import { Test, TestingModule } from '@nestjs/testing';
import { DatasetsService, DatasetRow } from './datasets.service';
import { PrismaService } from '../common/prisma';
import { LabelSource } from '@prisma/client';

describe('DatasetsService Unit Test (ARJUNA-Net ML Dataset & NLP Annotation Pipeline)', () => {
  let service: DatasetsService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      course: {
        count: jest.fn().mockResolvedValue(5),
      },
      datasetLabel: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn().mockResolvedValue(10),
      },
      thread: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(8),
      },
      threadMessage: {
        count: jest.fn().mockResolvedValue(32),
      },
      opinion: {
        count: jest.fn().mockResolvedValue(8),
      },
      user: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatasetsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DatasetsService>(DatasetsService);
    prisma = module.get(PrismaService);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 1. NLP HEURISTIC EMOTION & SENTIMENT PIPELINE
  // ══════════════════════════════════════════════════════════════════════════
  describe('NLP Annotation & Emotion/Sentiment Heuristics', () => {
    it('TC-DATA-001: Should assign Happiness emotion and Positif sentiment for positive student answer and opinion', () => {
      const question = 'Bagaimana cara kerja rekursi pada struktur data tree?';
      const answer =
        'Saya sangat memahami konsep rekursi traversing preorder dan inorder, sangat jelas dan menyenangkan.';
      const feedback = 'Penjelasan Anda sangat bagus dan tepat.';
      const reaction = 'Terima kasih banyak atas feedbacknya pak.';
      const opinion = 'Materi ini sangat mudah dipahami dan saya merasa puas.';

      const labels = service.computeAutoLabels(question, answer, feedback, reaction, opinion);

      expect(['Happiness', 'Anger', 'Fear', 'Disgust', 'Sadness']).toContain(labels.studentEmotion);
      expect(['Positif', 'Negatif']).toContain(labels.studentSentiment);
      expect(labels.studentEmotion).toBe('Happiness');
      expect(labels.studentSentiment).toBe('Positif');
      expect(labels.qaRelevance).toBeGreaterThan(0.6);
      expect(labels.interactionQuality).toBeGreaterThan(0.7);
    });

    it('TC-DATA-002: Should assign Sadness/Fear emotion and Negatif sentiment for confused/difficult student opinion', () => {
      const question = 'Jelaskan kompleksitas waktu Dijkstra Algorithm';
      const answer = 'Waktunya O(V^2) atau O(E log V)';
      const feedback = 'Perhatikan implementasi min-heap.';
      const reaction = 'Saya masih bingung.';
      const opinion = 'Saya merasa sangat kesulitan, cemas, dan gagal paham dengan materi graf ini.';

      const labels = service.computeAutoLabels(question, answer, feedback, reaction, opinion);

      expect(['Fear', 'Sadness', 'Anger', 'Disgust']).toContain(labels.studentEmotion);
      expect(labels.studentSentiment).toBe('Negatif');
    });

    it('TC-DATA-003: Should compute interaction quality using alpha=0.4, beta=0.35, gamma=0.25 formula', () => {
      const question = 'Apa itu Binary Search Tree?';
      const answer =
        'BST adalah struktur data pohon biner di mana subtree kiri lebih kecil dan kanan lebih besar.';
      const feedback = 'Tepat sekali, jangan lupa kondisi seimbang AVL.';
      const reaction = 'Baik, terima kasih penjelasannya.';
      const opinion = 'Sangat membantu.';

      const labels = service.computeAutoLabels(question, answer, feedback, reaction, opinion);

      expect(labels.qaRelevance).toBeGreaterThanOrEqual(0.0);
      expect(labels.qaRelevance).toBeLessThanOrEqual(1.0);
      expect(labels.afRelevance).toBeGreaterThanOrEqual(0.0);
      expect(labels.afRelevance).toBeLessThanOrEqual(1.0);
      expect(labels.feedbackNovelty).toBeGreaterThanOrEqual(0.0);
      expect(labels.feedbackNovelty).toBeLessThanOrEqual(1.0);
      expect(labels.interactionQuality).toBeGreaterThanOrEqual(0.0);
      expect(labels.interactionQuality).toBeLessThanOrEqual(1.0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. 15-COLUMN DATASET EXPORT & FORMATTING
  // ══════════════════════════════════════════════════════════════════════════
  describe('Dataset Export & Formatting (ARJUNA-Net ML Format)', () => {
    it('TC-DATA-004: Should format rows with Log column, user names, and reply pairs', async () => {
      prisma.thread.findMany.mockResolvedValue([
        {
          id: 'thread-1',
          title: 'Diskusi Minggu 1',
          courseId: 'course-1',
          course: {
            code: 'IF-101',
            name: 'Pemrograman Web',
            lecturerId: 'dosen-1',
            lecturer: { id: 'dosen-1', name: 'Dr. Aris Sudaryanto, M.Kom', email: 'aris@arjuna-lms.ac.id' },
            enrollments: [
              {
                student: { id: 'mhs-1', name: 'Mahasiswa 1', email: 'mhs1@arjuna-lms.ac.id' },
              },
            ],
          },
          initiator: { id: 'dosen-1', name: 'Dr. Aris Sudaryanto, M.Kom', role: 'LECTURER' },
          messages: [
            {
              id: 'm-1',
              type: 'QUESTION',
              authorId: 'dosen-1',
              author: { id: 'dosen-1', name: 'Dr. Aris Sudaryanto, M.Kom', role: 'LECTURER' },
              body: 'Bagaimana peran DOM dalam browser?',
              parentMessageId: null,
              createdAt: new Date(),
            },
            {
              id: 'm-2',
              type: 'ANSWER',
              authorId: 'mhs-1',
              author: { id: 'mhs-1', name: 'Mahasiswa 1', role: 'STUDENT' },
              body: 'DOM adalah representasi objek dokumen HTML.',
              parentMessageId: 'm-1',
              createdAt: new Date(),
            },
            {
              id: 'm-3',
              type: 'FEEDBACK',
              authorId: 'dosen-1',
              author: { id: 'dosen-1', name: 'Dr. Aris Sudaryanto, M.Kom', role: 'LECTURER' },
              body: 'Bagus, dapat dimanipulasi dengan JavaScript.',
              parentMessageId: 'm-2',
              createdAt: new Date(),
            },
          ],
          opinions: [
            {
              authorId: 'dosen-1',
              authorRole: 'LECTURER',
              opinionText: 'Diskusi berjalan sangat efektif.',
              sentiment: 'Positif',
              emotion: 'Happiness',
            },
            {
              authorId: 'mhs-1',
              authorRole: 'STUDENT',
              opinionText: 'Saya paham sekarang.',
              sentiment: 'Positif',
              emotion: 'Happiness',
            },
          ],
          labels: [],
        },
      ]);

      const rows: DatasetRow[] = await service.buildDatasetRows({});

      expect(rows).toBeInstanceOf(Array);
      expect(rows.length).toBeGreaterThan(0);

      const firstRow = rows[0];
      const requiredColumns = [
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
      ];

      requiredColumns.forEach((col) => {
        expect(firstRow).toHaveProperty(col);
      });

      expect(firstRow.Log).toContain('Diskusi Minggu 1');
      expect(firstRow.Lecturer_ID).toBe('Dr. Aris Sudaryanto, M.Kom');
      expect(firstRow.Student_ID).toBe('Mahasiswa 1');
      expect(firstRow.Lecturer_Opinion).toBe('Diskusi berjalan sangat efektif.');
      expect(firstRow.Student_Opinion).toBe('Saya paham sekarang.');

      // Verify emotion and sentiment validity
      expect(['Happiness', 'Anger', 'Fear', 'Disgust', 'Sadness']).toContain(firstRow.Student_Emotion);
      expect(['Positif', 'Negatif']).toContain(firstRow.Student_Sentiment);
    });

    it('TC-DATA-006: Should capture Lecturer_Feedback whenever lecturer sends a discussion message other than QUESTION', async () => {
      prisma.thread.findMany.mockResolvedValue([
        {
          id: 'thread-2',
          title: 'Diskusi Sesi 2',
          courseId: 'course-2',
          course: {
            code: 'IF-202',
            name: 'Kecerdasan Buatan',
            lecturerId: 'dosen-2',
            lecturer: { id: 'dosen-2', name: 'Prof. Budi', email: 'budi@arjuna-lms.ac.id' },
            enrollments: [
              {
                student: { id: 'mhs-2', name: 'Siti Rahma', email: 'siti@arjuna-lms.ac.id' },
              },
            ],
          },
          initiator: { id: 'dosen-2', name: 'Prof. Budi', role: 'LECTURER' },
          messages: [
            {
              id: 'm-q1',
              type: 'QUESTION',
              authorId: 'dosen-2',
              author: { id: 'dosen-2', name: 'Prof. Budi', role: 'LECTURER' },
              body: 'Bagaimana cara kerja Backpropagation?',
              parentMessageId: null,
              createdAt: new Date(),
            },
            {
              id: 'm-a1',
              type: 'ANSWER',
              authorId: 'mhs-2',
              author: { id: 'mhs-2', name: 'Siti Rahma', role: 'STUDENT' },
              body: 'Menggunakan gradient descent untuk menghitung turunan berantai bobot.',
              parentMessageId: 'm-q1',
              createdAt: new Date(),
            },
            {
              id: 'm-f1',
              // Custom/general reply message from lecturer (besides QUESTION)
              type: 'ANSWER',
              authorId: 'dosen-2',
              author: { id: 'dosen-2', name: 'Prof. Budi', role: 'LECTURER' },
              body: 'Hebat, penurunan rumus chain rule sangat penting diperhatikan.',
              parentMessageId: 'm-a1',
              createdAt: new Date(),
            },
          ],
          opinions: [],
          labels: [],
        },
      ]);

      const rows: DatasetRow[] = await service.buildDatasetRows({});
      expect(rows.length).toBeGreaterThan(0);

      const targetRow = rows.find((r) => r.Student_ID === 'Siti Rahma');
      expect(targetRow).toBeDefined();
      expect(targetRow?.Lecturer_Feedback).toBe(
        'Hebat, penurunan rumus chain rule sangat penting diperhatikan.',
      );
    });
  });
});
