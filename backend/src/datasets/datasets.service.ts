import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageType, LabelSource } from '@prisma/client';
import { PrismaService } from '../common/prisma';
import { CreateDatasetLabelDto, QueryDatasetExportDto } from './dto';
import * as csv from 'fast-csv';

export interface DatasetRow {
  Course_ID: string;
  Lecturer_ID: string;
  Student_ID: string;
  Lecturer_Question: string;
  Student_Answer: string;
  Lecturer_Feedback: string;
  Student_Reaction: string;
  Student_Opinion: string;
  'Q-A_Relevance': string | number;
  'A-F_Relevance': string | number;
  Feedback_Novalty: string | number;
  Student_Sentiment: string;
  Student_Emotion: string;
  Lecturer_Emotion: string;
  Interaction_Quality: string | number;
}

export interface ComputedAutoLabels {
  qaRelevance: number;
  afRelevance: number;
  feedbackNovelty: number;
  studentSentiment: string;
  studentEmotion: string;
  lecturerEmotion: string;
  interactionQuality: number;
}

@Injectable()
export class DatasetsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * NLP Heuristic Engine aligned with ARJUNA-Net Pipeline (Stage 3 & 4):
   * - Sentiment: Exclusively "Positif" or "Negatif" (SSWE + CNN)
   * - Emotions: Exclusively 5 classes: "Happiness", "Anger", "Fear", "Disgust", "Sadness" (EWE + CNN)
   */
  computeAutoLabels(
    question: string,
    answer: string,
    feedback: string,
    reaction: string,
    opinion: string,
  ): ComputedAutoLabels {
    const qClean = (question || '').toLowerCase();
    const aClean = (answer || '').toLowerCase();
    const fClean = (feedback || '').toLowerCase();
    const rClean = (reaction || '').toLowerCase();
    const oClean = (opinion || '').toLowerCase();

    // If student hasn't answered yet
    if (!aClean.trim()) {
      return {
        qaRelevance: 0.0,
        afRelevance: 0.0,
        feedbackNovelty: 0.0,
        studentSentiment: 'Positif',
        studentEmotion: 'Happiness',
        lecturerEmotion: 'Happiness',
        interactionQuality: 0.0,
      };
    }

    // Tokenization helper
    const tokenize = (text: string): Set<string> => {
      const stopwords = new Set([
        'yang', 'di', 'ke', 'dari', 'ini', 'itu', 'dan', 'atau', 'untuk', 'dengan',
        'adalah', 'pada', 'saya', 'kami', 'kita', 'kamu', 'anda', 'mereka', 'dia',
        'akan', 'telah', 'sudah', 'bisa', 'dapat', 'juga', 'dalam', 'karena', 'oleh',
        'secara', 'sebagai', 'agar', 'supaya', 'tentang', 'seperti', 'ada', 'tidak',
      ]);
      const words = text
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopwords.has(w));
      return new Set(words);
    };

    const qTokens = tokenize(qClean);
    const aTokens = tokenize(aClean);
    const fTokens = tokenize(fClean);

    // 1. Q-A Relevance (0.00 - 1.00)
    let qaScore = 0.75;
    if (qTokens.size > 0 && aTokens.size > 0) {
      let intersection = 0;
      qTokens.forEach((t) => {
        if (aTokens.has(t)) intersection++;
      });
      const overlapRatio = intersection / Math.min(qTokens.size, aTokens.size);
      const lengthFactor = Math.min(aTokens.size / 15, 1.0) * 0.15;
      qaScore = Math.min(0.98, Math.max(0.65, 0.68 + overlapRatio * 0.22 + lengthFactor));
    }
    qaScore = Math.round(qaScore * 100) / 100;

    // 2. A-F Relevance (0.00 - 1.00)
    let afScore = 0.85;
    if (fTokens.size > 0 && aTokens.size > 0) {
      let intersection = 0;
      aTokens.forEach((t) => {
        if (fTokens.has(t)) intersection++;
      });
      const overlapRatio = intersection / Math.min(aTokens.size, fTokens.size);
      const affirmationTerms = ['bagus', 'tepat', 'benar', 'sesuai', 'baik', 'penjelasan', 'konsep', 'analisis', 'perhatikan', 'koreksi'];
      let affirmBonus = 0;
      affirmationTerms.forEach((term) => {
        if (fClean.includes(term)) affirmBonus += 0.03;
      });
      afScore = Math.min(0.98, Math.max(0.68, 0.72 + overlapRatio * 0.18 + affirmBonus));
    }
    afScore = Math.round(afScore * 100) / 100;

    // 3. Feedback Novelty (0.00 - 1.00)
    let noveltyScore = 0.78;
    if (fTokens.size > 0) {
      let uniqueTokens = 0;
      fTokens.forEach((t) => {
        if (!qTokens.has(t) && !aTokens.has(t)) uniqueTokens++;
      });
      const noveltyRatio = uniqueTokens / fTokens.size;
      const depthBonus = Math.min(fTokens.size / 20, 1.0) * 0.12;
      noveltyScore = Math.min(0.95, Math.max(0.55, 0.60 + noveltyRatio * 0.28 + depthBonus));
    }
    noveltyScore = Math.round(noveltyScore * 100) / 100;

    // 4. Student Sentiment ("Positif" | "Negatif")
    const studentFullText = `${aClean} ${rClean} ${oClean}`;
    const posKeywords = [
      'paham', 'mengerti', 'jelas', 'menarik', 'senang', 'bagus', 'terima kasih',
      'makasih', 'membantu', 'bermanfaat', 'setuju', 'mantap', 'sukses', 'mudah',
      'hebat', 'solutif', 'siap', 'baik', 'positif', 'puas', 'tercerahkan', 'gembira',
    ];
    const negKeywords = [
      'bingung', 'sulit', 'kurang', 'tidak mengerti', 'belum paham', 'kecewa',
      'rumit', 'pusing', 'keberatan', 'masalah', 'gagal', 'keliru', 'ragu', 'takut',
      'marah', 'kesal', 'jengkel', 'sedih', 'lelah', 'muak',
    ];

    let posCount = 0;
    let negCount = 0;
    posKeywords.forEach((w) => {
      if (studentFullText.includes(w)) posCount++;
    });
    negKeywords.forEach((w) => {
      if (studentFullText.includes(w)) negCount++;
    });

    const studentSentiment = negCount > posCount ? 'Negatif' : 'Positif';

    // 5. Student Emotion (Happiness, Anger, Fear, Disgust, Sadness)
    const emotionKeywords = {
      Happiness: ['senang', 'gembira', 'puas', 'terima kasih', 'makasih', 'hebat', 'bagus', 'mantap', 'alhamdulillah', 'jelas', 'paham', 'mengerti', 'menarik', 'semangat', 'suka', 'berhasil', 'solutif', 'terbantu', 'mudah', 'yakin', 'pasti'],
      Anger: ['marah', 'kesal', 'jengkel', 'keberatan', 'protes', 'tidak adil', 'parah', 'buruk', 'emosi'],
      Fear: ['takut', 'cemas', 'khawatir', 'ragu', 'was-was', 'takut salah', 'tidak yakin', 'risau', 'bingung', 'rancu'],
      Disgust: ['muak', 'jijik', 'tidak suka', 'menolak', 'menyebalkan', 'ogah', 'aneh'],
      Sadness: ['sedih', 'kecewa', 'sulit', 'tidak bisa', 'gagal', 'pusing', 'lelah', 'kurang paham', 'berat', 'menyerah'],
    };

    let studentEmotion = 'Happiness';
    let maxEmotionScore = -1;

    for (const [emo, kws] of Object.entries(emotionKeywords)) {
      let count = 0;
      kws.forEach((w) => {
        if (studentFullText.includes(w)) count++;
      });
      if (count > maxEmotionScore && count > 0) {
        maxEmotionScore = count;
        studentEmotion = emo;
      }
    }

    // Default if negative sentiment with no specific keyword
    if (studentSentiment === 'Negatif' && maxEmotionScore <= 0) {
      studentEmotion = 'Sadness';
    }

    // 6. Lecturer Emotion (Happiness, Anger, Fear, Disgust, Sadness)
    let lecturerEmotion = 'Happiness';
    let maxLecScore = -1;

    const lecEmotionKeywords = {
      Happiness: ['bagus', 'tepat', 'benar', 'hebat', 'sangat baik', 'luar biasa', 'apresiasi', 'mantap', 'memuaskan', 'sempurna', 'terima kasih', 'senang', 'lanjutkan', 'pertahankan', 'baik sekali'],
      Sadness: ['sayang sekali', 'kecewa', 'kurang tepat', 'belum sesuai', 'perlu belajar lagi', 'lemah'],
      Fear: ['hati-hati', 'waspada', 'jangan sampai salah', 'berisiko', 'rawan', 'teliti'],
      Anger: ['keliru fatal', 'ceroboh', 'jangan diulang', 'tidak teliti', 'tidak boleh'],
      Disgust: ['tidak masuk akal', 'berantakan', 'rancu total'],
    };

    for (const [emo, kws] of Object.entries(lecEmotionKeywords)) {
      let count = 0;
      kws.forEach((w) => {
        if (fClean.includes(w)) count++;
      });
      if (count > maxLecScore && count > 0) {
        maxLecScore = count;
        lecturerEmotion = emo;
      }
    }

    // 7. Interaction Quality (0.00 - 1.00)
    const sentimentScore = studentSentiment === 'Positif' ? 0.95 : 0.65;
    const completenessBonus =
      (aClean ? 0.05 : 0) + (fClean ? 0.03 : 0) + (rClean ? 0.02 : 0) + (oClean ? 0.02 : 0);

    let interactionQuality =
      qaScore * 0.30 +
      afScore * 0.25 +
      noveltyScore * 0.20 +
      sentimentScore * 0.15 +
      completenessBonus;
    interactionQuality = Math.min(0.99, Math.max(0.50, Math.round(interactionQuality * 100) / 100));

    return {
      qaRelevance: qaScore,
      afRelevance: afScore,
      feedbackNovelty: noveltyScore,
      studentSentiment,
      studentEmotion,
      lecturerEmotion,
      interactionQuality,
    };
  }

  /**
   * Aggregate interaction threads into structured dataset rows.
   * 1:1 mapping with PRD Image 2 and ARJUNA-Net 15-column schema.
   */
  async buildDatasetRows(query: QueryDatasetExportDto): Promise<DatasetRow[]> {
    const where: any = {};
    if (query.courseId) {
      where.courseId = query.courseId;
    }

    const threads = await this.prisma.thread.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            lecturerId: true,
            lecturer: { select: { id: true, name: true, email: true } },
            enrollments: {
              include: {
                student: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        messages: {
          include: {
            author: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        opinions: {
          include: {
            author: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        labels: {
          take: 1,
          orderBy: { labeledAt: 'desc' },
        },
      },
      orderBy: { openedAt: 'asc' },
    });

    const rows: DatasetRow[] = [];

    for (const thread of threads) {
      const questionMsg = thread.messages.find(
        (m) => m.type === MessageType.QUESTION,
      );
      const questionText = questionMsg ? this.cleanText(questionMsg.body) : '';

      const threadLabel = thread.labels[0] || null;

      // Group answers by student
      const answers = thread.messages.filter(
        (m) => m.type === MessageType.ANSWER,
      );

      // If there are enrolled students, generate a row for each enrolled student or each answering student
      const targetStudents =
        answers.length > 0
          ? answers.map((a) => a.author || { id: a.authorId, name: 'Student' })
          : (thread.course.enrollments || []).map((e) => e.student || { id: e.studentId, name: 'Student' });

      // Dedup students safely
      const uniqueStudents = Array.from(
        new Map(
          targetStudents
            .filter((s) => s && s.id)
            .map((s) => [s.id, s]),
        ).values(),
      );

      for (const student of uniqueStudents) {
        const studentAnswerMsg = thread.messages.find(
          (m) => m.type === MessageType.ANSWER && m.authorId === student.id,
        );

        // Feedback given by lecturer
        const feedbackMsg = thread.messages.find(
          (m) =>
            m.type === MessageType.FEEDBACK &&
            (m.parentMessageId === studentAnswerMsg?.id || !m.parentMessageId),
        );

        // Reaction from this student
        const reactionMsg = thread.messages.find(
          (m) =>
            m.type === MessageType.REACTION && m.authorId === student.id,
        );

        // Opinion from this student
        const opinion = thread.opinions.find(
          (o) => o.authorId === student.id,
        );

        const studentAnswer = studentAnswerMsg ? this.cleanText(studentAnswerMsg.body) : '';
        const lecturerFeedback = feedbackMsg ? this.cleanText(feedbackMsg.body) : '';
        const studentReaction = reactionMsg ? this.cleanText(reactionMsg.body) : '';
        const studentOpinion = opinion ? this.cleanText(opinion.opinionText) : '';

        // Calculate auto-labels
        const auto = this.computeAutoLabels(
          questionText,
          studentAnswer,
          lecturerFeedback,
          studentReaction,
          studentOpinion,
        );

        // Fallback priority: Saved DB Label > User Opinion Stored Selection > Auto-Calculated Value
        const qaRelevance =
          threadLabel?.qaRelevance != null ? threadLabel.qaRelevance : auto.qaRelevance;
        const afRelevance =
          threadLabel?.afRelevance != null ? threadLabel.afRelevance : auto.afRelevance;
        const feedbackNovelty =
          threadLabel?.feedbackNovelty != null
            ? threadLabel.feedbackNovelty
            : auto.feedbackNovelty;
        const studentSentiment =
          (threadLabel?.studentSentiment && threadLabel.studentSentiment.trim() !== '')
            ? threadLabel.studentSentiment
            : (opinion?.sentiment || auto.studentSentiment);
        const studentEmotion =
          (threadLabel?.studentEmotion && threadLabel.studentEmotion.trim() !== '')
            ? threadLabel.studentEmotion
            : (opinion?.emotion || auto.studentEmotion);
        const lecturerEmotion =
          (threadLabel?.lecturerEmotion && threadLabel.lecturerEmotion.trim() !== '')
            ? threadLabel.lecturerEmotion
            : auto.lecturerEmotion;
        const interactionQuality =
          threadLabel?.interactionQuality != null
            ? threadLabel.interactionQuality
            : auto.interactionQuality;

        rows.push({
          Course_ID: thread.course.code || thread.course.id,
          Lecturer_ID: thread.course.lecturerId,
          Student_ID: student.id,
          Lecturer_Question: questionText,
          Student_Answer: studentAnswer,
          Lecturer_Feedback: lecturerFeedback,
          Student_Reaction: studentReaction,
          Student_Opinion: studentOpinion,
          'Q-A_Relevance': qaRelevance,
          'A-F_Relevance': afRelevance,
          Feedback_Novalty: feedbackNovelty,
          Student_Sentiment: studentSentiment,
          Student_Emotion: studentEmotion,
          Lecturer_Emotion: lecturerEmotion,
          Interaction_Quality: interactionQuality,
        });
      }
    }

    return rows;
  }

  /**
   * Convert dataset rows to CSV buffer
   */
  async exportCsv(query: QueryDatasetExportDto): Promise<string> {
    const rows = await this.buildDatasetRows(query);
    if (rows.length === 0) {
      return (
        [
          'Course_ID',
          'Lecturer_ID',
          'Student_ID',
          'Lecturer_Question',
          'Student_Answer',
          'Lecturer_Feedback',
          'Student_Reaction',
          'Student_Opinion',
          'Q-A_Relevance',
          'A-F_Relevance',
          'Feedback_Novalty',
          'Student_Sentiment',
          'Student_Emotion',
          'Lecturer_Emotion',
          'Interaction_Quality',
        ].join(',') + '\n'
      );
    }
    return csv.writeToString(rows, { headers: true });
  }

  /**
   * Get summary statistics of collected data for research monitoring
   */
  async getSummary() {
    const [totalCourses, totalThreads, totalMessages, totalOpinions, totalLabels] =
      await Promise.all([
        this.prisma.course.count(),
        this.prisma.thread.count(),
        this.prisma.threadMessage.count(),
        this.prisma.opinion.count(),
        this.prisma.datasetLabel.count(),
      ]);

    const answersCount = await this.prisma.threadMessage.count({
      where: { type: MessageType.ANSWER },
    });

    return {
      totalCourses,
      totalThreads,
      totalMessages,
      totalAnswers: answersCount,
      totalOpinions,
      totalLabels,
      readinessScore:
        totalThreads > 0
          ? Math.min(100, Math.round((answersCount / (totalThreads * 4)) * 100))
          : 0,
    };
  }

  /**
   * Get list of interaction threads with their dataset labels and auto-calculated metrics
   * for the Admin Dataset Label Manager Studio.
   */
  async getThreadsWithLabels(query: {
    courseId?: string;
    labeledStatus?: 'ALL' | 'MANUAL' | 'AUTO' | 'MODEL' | 'UNLABELED';
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { course: { name: { contains: query.search, mode: 'insensitive' } } },
        { course: { code: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.labeledStatus === 'MANUAL') {
      where.labels = { some: { source: LabelSource.MANUAL } };
    } else if (query.labeledStatus === 'AUTO' || query.labeledStatus === 'MODEL') {
      where.labels = { some: { source: LabelSource.MODEL } };
    } else if (query.labeledStatus === 'UNLABELED') {
      where.labels = { none: {} };
    }

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        include: {
          course: { select: { id: true, code: true, name: true } },
          initiator: { select: { id: true, name: true, role: true } },
          messages: {
            include: {
              author: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          opinions: {
            include: {
              author: { select: { id: true, name: true, role: true } },
            },
          },
          labels: {
            include: {
              labeler: { select: { id: true, name: true, email: true } },
            },
            orderBy: { labeledAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { openedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.thread.count({ where }),
    ]);

    const items = threads.map((thread) => {
      const questionMsg = thread.messages.find(
        (m) => m.type === MessageType.QUESTION,
      );
      const answers = thread.messages.filter(
        (m) => m.type === MessageType.ANSWER,
      );
      const feedbacks = thread.messages.filter(
        (m) => m.type === MessageType.FEEDBACK,
      );
      const reactions = thread.messages.filter(
        (m) => m.type === MessageType.REACTION,
      );

      const questionText = questionMsg ? this.cleanText(questionMsg.body) : '';
      const sampleAnswer = answers.length > 0 ? this.cleanText(answers[0].body) : '';
      const sampleFeedback = feedbacks.length > 0 ? this.cleanText(feedbacks[0].body) : '';
      const sampleReaction = reactions.length > 0 ? this.cleanText(reactions[0].body) : '';
      const sampleOpinion =
        thread.opinions.length > 0
          ? this.cleanText(thread.opinions[0].opinionText)
          : '';

      const autoLabels = this.computeAutoLabels(
        questionText,
        sampleAnswer,
        sampleFeedback,
        sampleReaction,
        sampleOpinion,
      );

      const activeLabel = thread.labels[0] || null;
      const latestOpinion = thread.opinions[0];

      return {
        id: thread.id,
        title: thread.title,
        status: thread.status,
        openedAt: thread.openedAt,
        course: thread.course,
        initiator: thread.initiator,
        answersCount: answers.length,
        feedbacksCount: feedbacks.length,
        reactionsCount: reactions.length,
        opinionsCount: thread.opinions.length,
        questionText,
        sampleAnswer,
        sampleFeedback,
        sampleReaction,
        sampleOpinion,
        label: activeLabel,
        autoCalculated: autoLabels,
        effectiveLabels: {
          qaRelevance: activeLabel?.qaRelevance ?? autoLabels.qaRelevance,
          afRelevance: activeLabel?.afRelevance ?? autoLabels.afRelevance,
          feedbackNovelty: activeLabel?.feedbackNovelty ?? autoLabels.feedbackNovelty,
          studentSentiment:
            activeLabel?.studentSentiment ||
            latestOpinion?.sentiment ||
            autoLabels.studentSentiment,
          studentEmotion:
            activeLabel?.studentEmotion ||
            latestOpinion?.emotion ||
            autoLabels.studentEmotion,
          lecturerEmotion: activeLabel?.lecturerEmotion ?? autoLabels.lecturerEmotion,
          interactionQuality: activeLabel?.interactionQuality ?? autoLabels.interactionQuality,
          source: activeLabel ? activeLabel.source : 'MODEL',
        },
      };
    });

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Bulk auto-label all threads in the database (or for a specific course).
   * Generates and persists DatasetLabel records with source = MODEL.
   */
  async autoLabelAllThreads(courseId?: string, adminId?: string) {
    const where: any = {};
    if (courseId) where.courseId = courseId;

    const threads = await this.prisma.thread.findMany({
      where,
      include: {
        messages: true,
        opinions: true,
        labels: {
          orderBy: { labeledAt: 'desc' },
          take: 1,
        },
      },
    });

    let labeledCount = 0;

    for (const thread of threads) {
      const questionMsg = thread.messages.find(
        (m) => m.type === MessageType.QUESTION,
      );
      const answerMsg = thread.messages.find(
        (m) => m.type === MessageType.ANSWER,
      );
      const feedbackMsg = thread.messages.find(
        (m) => m.type === MessageType.FEEDBACK,
      );
      const reactionMsg = thread.messages.find(
        (m) => m.type === MessageType.REACTION,
      );
      const opinion = thread.opinions[0];

      const auto = this.computeAutoLabels(
        questionMsg ? this.cleanText(questionMsg.body) : '',
        answerMsg ? this.cleanText(answerMsg.body) : '',
        feedbackMsg ? this.cleanText(feedbackMsg.body) : '',
        reactionMsg ? this.cleanText(reactionMsg.body) : '',
        opinion ? this.cleanText(opinion.opinionText) : '',
      );

      const existing = thread.labels[0];
      const effSentiment = existing?.studentSentiment || opinion?.sentiment || auto.studentSentiment;
      const effEmotion = existing?.studentEmotion || opinion?.emotion || auto.studentEmotion;

      if (existing) {
        await this.prisma.datasetLabel.update({
          where: { id: existing.id },
          data: {
            qaRelevance: auto.qaRelevance,
            afRelevance: auto.afRelevance,
            feedbackNovelty: auto.feedbackNovelty,
            studentSentiment: effSentiment,
            studentEmotion: effEmotion,
            lecturerEmotion: existing.lecturerEmotion || auto.lecturerEmotion,
            interactionQuality: auto.interactionQuality,
            labeledBy: adminId || existing.labeledBy,
            labeledAt: new Date(),
            source: LabelSource.MODEL,
          },
        });
      } else {
        await this.prisma.datasetLabel.create({
          data: {
            threadId: thread.id,
            qaRelevance: auto.qaRelevance,
            afRelevance: auto.afRelevance,
            feedbackNovelty: auto.feedbackNovelty,
            studentSentiment: effSentiment,
            studentEmotion: effEmotion,
            lecturerEmotion: auto.lecturerEmotion,
            interactionQuality: auto.interactionQuality,
            labeledBy: adminId || null,
            labeledAt: new Date(),
            source: LabelSource.MODEL,
          },
        });
      }
      labeledCount++;
    }

    return {
      success: true,
      totalProcessed: threads.length,
      labeledCount,
    };
  }

  /**
   * Set or update dataset labels (from manual annotator or offline NLP pipeline).
   * Upserts the single active label record for the thread.
   */
  async setLabels(
    threadId: string,
    labeledBy: string,
    dto: CreateDatasetLabelDto,
  ) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread tidak ditemukan');
    }

    const existing = await this.prisma.datasetLabel.findFirst({
      where: { threadId },
      orderBy: { labeledAt: 'desc' },
    });

    if (existing) {
      return this.prisma.datasetLabel.update({
        where: { id: existing.id },
        data: {
          qaRelevance: dto.qaRelevance !== undefined ? dto.qaRelevance : existing.qaRelevance,
          afRelevance: dto.afRelevance !== undefined ? dto.afRelevance : existing.afRelevance,
          feedbackNovelty: dto.feedbackNovelty !== undefined ? dto.feedbackNovelty : existing.feedbackNovelty,
          studentSentiment: dto.studentSentiment !== undefined ? dto.studentSentiment : existing.studentSentiment,
          studentEmotion: dto.studentEmotion !== undefined ? dto.studentEmotion : existing.studentEmotion,
          lecturerSentiment: dto.lecturerSentiment !== undefined ? dto.lecturerSentiment : existing.lecturerSentiment,
          lecturerEmotion: dto.lecturerEmotion !== undefined ? dto.lecturerEmotion : existing.lecturerEmotion,
          interactionQuality: dto.interactionQuality !== undefined ? dto.interactionQuality : existing.interactionQuality,
          labeledBy,
          labeledAt: new Date(),
          source: dto.source || LabelSource.MANUAL,
        },
      });
    }

    return this.prisma.datasetLabel.create({
      data: {
        threadId,
        qaRelevance: dto.qaRelevance,
        afRelevance: dto.afRelevance,
        feedbackNovelty: dto.feedbackNovelty,
        studentSentiment: dto.studentSentiment,
        studentEmotion: dto.studentEmotion,
        lecturerSentiment: dto.lecturerSentiment,
        lecturerEmotion: dto.lecturerEmotion,
        interactionQuality: dto.interactionQuality,
        labeledBy,
        labeledAt: new Date(),
        source: dto.source || LabelSource.MANUAL,
      },
    });
  }

  /**
   * Delete or reset labels for a thread
   */
  async deleteLabels(threadId: string) {
    const deleted = await this.prisma.datasetLabel.deleteMany({
      where: { threadId },
    });
    return { success: true, count: deleted.count };
  }

  /**
   * Get labels for a thread
   */
  async getLabels(threadId: string) {
    return this.prisma.datasetLabel.findMany({
      where: { threadId },
      orderBy: { labeledAt: 'desc' },
    });
  }

  private cleanText(html: string): string {
    if (!html) return '';
    // Strip HTML tags and normalize spaces for clean dataset output
    return html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
