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

@Injectable()
export class DatasetsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregate interaction threads into structured dataset rows
   * 1:1 mapping with PRD Image 2 column schema.
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

      const label = thread.labels[0] || null;

      // Group answers by student
      const answers = thread.messages.filter(
        (m) => m.type === MessageType.ANSWER,
      );

      // If there are enrolled students, generate a row for each enrolled student or each answering student
      const targetStudents =
        answers.length > 0
          ? answers.map((a) => a.author)
          : thread.course.enrollments.map((e) => e.student);

      // Dedup students
      const uniqueStudents = Array.from(
        new Map(targetStudents.map((s) => [s.id, s])).values(),
      );

      for (const student of uniqueStudents) {
        const studentAnswerMsg = thread.messages.find(
          (m) => m.type === MessageType.ANSWER && m.authorId === student.id,
        );

        // Feedback given by lecturer (either responding to this student or general)
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

        rows.push({
          Course_ID: thread.course.code || thread.course.id,
          Lecturer_ID: thread.course.lecturer?.email || thread.course.lecturerId,
          Student_ID: student.email || student.id,
          Lecturer_Question: questionText,
          Student_Answer: studentAnswerMsg ? this.cleanText(studentAnswerMsg.body) : '',
          Lecturer_Feedback: feedbackMsg ? this.cleanText(feedbackMsg.body) : '',
          Student_Reaction: reactionMsg ? this.cleanText(reactionMsg.body) : '',
          Student_Opinion: opinion ? this.cleanText(opinion.opinionText) : '',
          'Q-A_Relevance': label?.qaRelevance ?? '',
          'A-F_Relevance': label?.afRelevance ?? '',
          Feedback_Novalty: label?.feedbackNovelty ?? '',
          Student_Sentiment: label?.studentSentiment ?? '',
          Student_Emotion: label?.studentEmotion ?? '',
          Lecturer_Emotion: label?.lecturerEmotion ?? '',
          Interaction_Quality: label?.interactionQuality ?? '',
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
   * Set or update dataset labels (from manual annotator or offline NLP pipeline)
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
        source: dto.source || LabelSource.MANUAL,
      },
    });
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
    // Strip simple HTML tags and normalize spaces for clean dataset output
    return html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
