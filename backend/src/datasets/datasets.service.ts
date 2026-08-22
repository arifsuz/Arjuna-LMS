import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageType, LabelSource } from '@prisma/client';
import { PrismaService } from '../common/prisma';
import { CreateDatasetLabelDto, QueryDatasetExportDto } from './dto';
import * as csv from 'fast-csv';

export interface DatasetRow {
  Log: string;
  Course_ID: string;
  Lecturer_ID: string;
  Student_ID: string;
  Lecturer_Question: string;
  Student_Answer: string;
  Lecturer_Feedback: string;
  Student_Reaction: string;
  Lecturer_Opinion: string;
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
   * Helper to format readable log timestamps: YYYY-MM-DD HH:mm:ss
   */
  private formatLogDate(date: Date | string | null | undefined): string {
    const d = date ? new Date(date) : new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

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
   * Pulls all messages and nested replies, pairing questions and answers cleanly.
   * Lecturer_ID and Student_ID use names, and Log details the interaction.
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
        initiator: {
          select: { id: true, name: true, role: true },
        },
        messages: {
          include: {
            author: { select: { id: true, name: true, email: true, role: true } },
            parent: {
              include: {
                author: { select: { id: true, name: true, role: true } },
              },
            },
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
      const courseCode = thread.course.code || thread.course.name || thread.course.id;
      const defaultLecturerName = thread.course.lecturer?.name || 'Dosen Pengampu';
      const threadLabel = thread.labels[0] || null;

      // Extract lecturer opinion from thread opinions
      const lecturerOpinionObj = thread.opinions.find(
        (o) => o.authorRole === 'LECTURER' || o.authorId === thread.course.lecturerId,
      );
      const lecturerOpinion = lecturerOpinionObj
        ? this.cleanText(lecturerOpinionObj.opinionText)
        : '';

      const messageMap = new Map<string, any>();
      thread.messages.forEach((m) => messageMap.set(m.id, m));

      // Root question message
      const rootQuestionMsg =
        thread.messages.find((m) => m.type === MessageType.QUESTION && !m.parentMessageId) ||
        thread.messages[0] ||
        null;
      const rootQuestionText = rootQuestionMsg ? this.cleanText(rootQuestionMsg.body) : '';

      const processedMessageIds = new Set<string>();

      // Helper: check if a message is a lecturer feedback / discussion message (any message from lecturer/admin other than QUESTION)
      const isLecturerFeedbackMsg = (m: any) =>
        (m.author?.role === 'LECTURER' ||
          m.author?.role === 'ADMIN' ||
          m.authorId === thread.course.lecturerId) &&
        m.type !== MessageType.QUESTION &&
        m.id !== rootQuestionMsg?.id;

      // 1. Process all student answers & their direct replies
      const studentAnswers = thread.messages.filter(
        (m) => m.type === MessageType.ANSWER && m.author.role === 'STUDENT',
      );

      for (const answerMsg of studentAnswers) {
        processedMessageIds.add(answerMsg.id);

        // Find what question was answered (parent message or root thread question)
        const parentMsg = answerMsg.parentMessageId
          ? messageMap.get(answerMsg.parentMessageId)
          : rootQuestionMsg;

        const questionText = parentMsg ? this.cleanText(parentMsg.body) : rootQuestionText;
        const studentAnswer = this.cleanText(answerMsg.body);

        const lecturerName =
          (parentMsg && parentMsg.author?.role === 'LECTURER'
            ? parentMsg.author.name
            : defaultLecturerName);
        const studentName = answerMsg.author.name || 'Mahasiswa';

        // Find all lecturer feedback messages (any message sent by lecturer other than question)
        // 1. First priority: messages directly replying to this student answer
        let feedbackMsgs = thread.messages.filter(
          (m) => isLecturerFeedbackMsg(m) && m.parentMessageId === answerMsg.id,
        );

        // 2. Second priority: any other lecturer messages in this thread besides question
        if (feedbackMsgs.length === 0) {
          const generalFeedback = thread.messages.filter(
            (m) =>
              isLecturerFeedbackMsg(m) &&
              (!m.parentMessageId || m.parentMessageId === rootQuestionMsg?.id),
          );
          if (generalFeedback.length > 0) {
            feedbackMsgs = generalFeedback;
          }
        }

        // Find all student reaction messages from this student
        const reactionMsgs = thread.messages.filter(
          (m) =>
            m.author.role === 'STUDENT' &&
            m.authorId === answerMsg.authorId &&
            m.id !== answerMsg.id &&
            (m.type === MessageType.REACTION ||
              (feedbackMsgs.length > 0 && feedbackMsgs.some((f) => m.parentMessageId === f.id)) ||
              (m.parentMessageId && m.parentMessageId !== rootQuestionMsg?.id)),
        );

        // Opinion from this student
        const opinion = thread.opinions.find(
          (o) => o.authorId === answerMsg.authorId,
        );
        const studentOpinion = opinion ? this.cleanText(opinion.opinionText) : '';

        // If multiple feedbacks or reactions exist, generate a row for each combination / reaction
        const feedbacksToIterate = feedbackMsgs.length > 0 ? feedbackMsgs : [null];
        const reactionsToIterate = reactionMsgs.length > 0 ? reactionMsgs : [null];

        for (const fb of feedbacksToIterate) {
          if (fb) processedMessageIds.add(fb.id);

          for (const rx of reactionsToIterate) {
            if (rx) processedMessageIds.add(rx.id);

            const lecturerFeedback = fb ? this.cleanText(fb.body) : '';
            const studentReaction = rx ? this.cleanText(rx.body) : '';

            // Calculate auto-labels
            const auto = this.computeAutoLabels(
              questionText,
              studentAnswer,
              lecturerFeedback,
              studentReaction,
              studentOpinion,
            );

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

            const logTimestamp = this.formatLogDate(rx?.createdAt || fb?.createdAt || answerMsg.createdAt);
            const logDetail = `[${logTimestamp}] Thread: "${thread.title}" | Interaksi ${studentName} - ${lecturerName}${rx ? ` (Reaction: ${studentReaction.substring(0, 30)}...)` : ''}`;

            rows.push({
              Log: logDetail,
              Course_ID: courseCode,
              Lecturer_ID: lecturerName,
              Student_ID: studentName,
              Lecturer_Question: questionText,
              Student_Answer: studentAnswer,
              Lecturer_Feedback: lecturerFeedback,
              Student_Reaction: studentReaction,
              Lecturer_Opinion: lecturerOpinion,
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
      }

      // 2. Process all other reply pairs & discussion messages in the forum (nested discussions)
      for (const msg of thread.messages) {
        if (processedMessageIds.has(msg.id) || msg.id === rootQuestionMsg?.id) continue;

        const parentMsg = msg.parentMessageId ? messageMap.get(msg.parentMessageId) : null;
        processedMessageIds.add(msg.id);

        let lecturerName = defaultLecturerName;
        let studentName = 'Mahasiswa';
        let questionText = rootQuestionText || (parentMsg ? this.cleanText(parentMsg.body) : '');
        let answerText = '';
        let feedbackText = '';
        let reactionText = '';

        if (msg.author.role === 'STUDENT') {
          studentName = msg.author.name;
          if (parentMsg && parentMsg.author.role !== 'STUDENT') {
            lecturerName = parentMsg.author.name;
            if (msg.type === MessageType.REACTION) {
              reactionText = this.cleanText(msg.body);
              if (isLecturerFeedbackMsg(parentMsg)) {
                feedbackText = this.cleanText(parentMsg.body);
              }
            } else {
              answerText = this.cleanText(msg.body);
            }
          } else {
            answerText = this.cleanText(msg.body);
          }
        } else {
          // Message author is Lecturer or Admin
          lecturerName = msg.author.name;
          // Any message from lecturer besides QUESTION is treated as Lecturer_Feedback
          if (isLecturerFeedbackMsg(msg)) {
            feedbackText = this.cleanText(msg.body);
          }
          if (parentMsg && parentMsg.author.role === 'STUDENT') {
            studentName = parentMsg.author.name;
            answerText = this.cleanText(parentMsg.body);
          }
        }

        const opinion = thread.opinions.find(
          (o) => o.authorId === (msg.author.role === 'STUDENT' ? msg.authorId : parentMsg?.authorId),
        );
        const studentOpinion = opinion ? this.cleanText(opinion.opinionText) : '';

        const auto = this.computeAutoLabels(
          questionText,
          answerText,
          feedbackText,
          reactionText,
          studentOpinion,
        );

        const logTimestamp = this.formatLogDate(msg.createdAt);
        const logDetail = `[${logTimestamp}] Thread: "${thread.title}" | Diskusi: ${msg.author.name} (${msg.author.role})${parentMsg ? ` membalas ${parentMsg.author.name} (${parentMsg.author.role})` : ''}`;

        rows.push({
          Log: logDetail,
          Course_ID: courseCode,
          Lecturer_ID: lecturerName,
          Student_ID: studentName,
          Lecturer_Question: questionText,
          Student_Answer: answerText,
          Lecturer_Feedback: feedbackText,
          Student_Reaction: reactionText,
          Lecturer_Opinion: lecturerOpinion,
          Student_Opinion: studentOpinion,
          'Q-A_Relevance': auto.qaRelevance,
          'A-F_Relevance': auto.afRelevance,
          Feedback_Novalty: auto.feedbackNovelty,
          Student_Sentiment: opinion?.sentiment || auto.studentSentiment,
          Student_Emotion: opinion?.emotion || auto.studentEmotion,
          Lecturer_Emotion: auto.lecturerEmotion,
          Interaction_Quality: auto.interactionQuality,
        });
      }

      // 3. Fallback: If thread has NO answers/messages yet, output topic info
      if (studentAnswers.length === 0 && rows.filter((r) => r.Log.includes(thread.title)).length === 0) {
        const targetStudents = (thread.course.enrollments || []).map(
          (e) => e.student || { id: e.studentId, name: 'Mahasiswa Kelas' },
        );

        const uniqueStudents = Array.from(
          new Map(
            targetStudents.filter((s) => s && s.id).map((s) => [s.id, s]),
          ).values(),
        );

        const studentsToRender =
          uniqueStudents.length > 0
            ? uniqueStudents
            : [{ id: 'mhs-1', name: 'Mahasiswa Kelas' }];

        for (const student of studentsToRender) {
          const auto = this.computeAutoLabels(
            rootQuestionText,
            '',
            '',
            '',
            '',
          );

          const logTimestamp = this.formatLogDate(thread.openedAt);
          const logDetail = `[${logTimestamp}] Thread: "${thread.title}" | Topik Forum Dosen (${defaultLecturerName}) - Belum ada balasan`;

          rows.push({
            Log: logDetail,
            Course_ID: courseCode,
            Lecturer_ID: defaultLecturerName,
            Student_ID: student.name,
            Lecturer_Question: rootQuestionText,
            Student_Answer: '',
            Lecturer_Feedback: '',
            Student_Reaction: '',
            Lecturer_Opinion: lecturerOpinion,
            Student_Opinion: '',
            'Q-A_Relevance': auto.qaRelevance,
            'A-F_Relevance': auto.afRelevance,
            Feedback_Novalty: auto.feedbackNovelty,
            Student_Sentiment: auto.studentSentiment,
            Student_Emotion: auto.studentEmotion,
            Lecturer_Emotion: auto.lecturerEmotion,
            Interaction_Quality: auto.interactionQuality,
          });
        }
      }
    }

    return rows;
  }

  /**
   * Convert dataset rows to CSV buffer with new Log column, user names, and Lecturer_Opinion
   */
  async exportCsv(query: QueryDatasetExportDto): Promise<string> {
    const rows = await this.buildDatasetRows(query);
    if (rows.length === 0) {
      return (
        [
          'Log',
          'Course_ID',
          'Lecturer_ID',
          'Student_ID',
          'Lecturer_Question',
          'Student_Answer',
          'Lecturer_Feedback',
          'Student_Reaction',
          'Lecturer_Opinion',
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
   * Get summary statistics of collected data for research monitoring.
   * Aggregates from all dataset rows combining manual annotations (Opinion / DatasetLabel)
   * and auto-inferred NLP heuristics.
   */
  async getSummary() {
    const [
      totalCourses,
      totalThreads,
      totalMessages,
      totalOpinions,
      savedLabelsCount,
    ] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.thread.count(),
      this.prisma.threadMessage.count(),
      this.prisma.opinion.count(),
      this.prisma.datasetLabel.count(),
    ]);

    const answersCount = await this.prisma.threadMessage.count({
      where: { type: MessageType.ANSWER },
    });

    // Build all dataset rows (combines manual annotations and auto NLP inference)
    const datasetRows = await this.buildDatasetRows({});

    const emotionCounts: Record<string, number> = {
      Happiness: 0,
      Anger: 0,
      Fear: 0,
      Disgust: 0,
      Sadness: 0,
    };
    const sentimentCounts: Record<string, number> = {
      Positif: 0,
      Negatif: 0,
    };

    let sumQaRelevance = 0;
    let sumAfRelevance = 0;
    let sumFeedbackNovelty = 0;
    let sumInteractionQuality = 0;
    let scoredQaCount = 0;
    let scoredAfCount = 0;
    let scoredNoveltyCount = 0;
    let scoredQualityCount = 0;

    for (const row of datasetRows) {
      // 1. Emotion distribution (takes Student_Emotion or Lecturer_Emotion from manual or auto-infer)
      const emotion = row.Student_Emotion || row.Lecturer_Emotion;
      if (emotion && emotionCounts[emotion] !== undefined) {
        emotionCounts[emotion]++;
      }

      // 2. Sentiment distribution (takes Student_Sentiment from manual or auto-infer)
      const sentiment = row.Student_Sentiment;
      if (sentiment && sentimentCounts[sentiment] !== undefined) {
        sentimentCounts[sentiment]++;
      }

      // 3. Relevance & Quality scores
      const qa = typeof row['Q-A_Relevance'] === 'number' ? row['Q-A_Relevance'] : parseFloat(row['Q-A_Relevance']);
      if (!isNaN(qa) && qa > 0) {
        sumQaRelevance += qa;
        scoredQaCount++;
      }

      const af = typeof row['A-F_Relevance'] === 'number' ? row['A-F_Relevance'] : parseFloat(row['A-F_Relevance']);
      if (!isNaN(af) && af > 0) {
        sumAfRelevance += af;
        scoredAfCount++;
      }

      const novelty = typeof row.Feedback_Novalty === 'number' ? row.Feedback_Novalty : parseFloat(row.Feedback_Novalty);
      if (!isNaN(novelty) && novelty > 0) {
        sumFeedbackNovelty += novelty;
        scoredNoveltyCount++;
      }

      const quality = typeof row.Interaction_Quality === 'number' ? row.Interaction_Quality : parseFloat(row.Interaction_Quality);
      if (!isNaN(quality) && quality > 0) {
        sumInteractionQuality += quality;
        scoredQualityCount++;
      }
    }

    const totalSamples = datasetRows.length;

    return {
      totalCourses,
      totalThreads,
      totalMessages,
      totalAnswers: answersCount,
      totalOpinions,
      totalLabels: Math.max(savedLabelsCount, totalSamples),
      readinessScore:
        totalThreads > 0
          ? Math.min(100, Math.round((answersCount / (totalThreads * 2)) * 100))
          : 0,
      emotionCounts,
      sentimentCounts,
      avgQaRelevance: scoredQaCount > 0 ? Number((sumQaRelevance / scoredQaCount).toFixed(2)) : 0,
      avgAfRelevance: scoredAfCount > 0 ? Number((sumAfRelevance / scoredAfCount).toFixed(2)) : 0,
      avgFeedbackNovelty: scoredNoveltyCount > 0 ? Number((sumFeedbackNovelty / scoredNoveltyCount).toFixed(2)) : 0,
      avgInteractionQuality: scoredQualityCount > 0 ? Number((sumInteractionQuality / scoredQualityCount).toFixed(2)) : 0,
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
