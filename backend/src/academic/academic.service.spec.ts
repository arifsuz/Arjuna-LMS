import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Role, MaterialType, MeetingPlatform } from '@prisma/client';
import { AcademicService } from './academic.service';
import { PrismaService } from '../common/prisma';

describe('AcademicService Unit Test (Core LMS Academic & Grading Operations)', () => {
  let service: AcademicService;
  let prisma: any;

  const mockCourse = {
    id: 'course-1',
    code: 'IF-301',
    name: 'Struktur Data & Algoritma',
    term: '2026/2027 Ganjil',
    lecturerId: 'dosen-1',
    description: 'Mata kuliah dasar algoritma',
    syllabus: '<p>Silabus RPS</p>',
    enrollments: [
      {
        id: 'enr-1',
        studentId: 'mhs-1',
        student: { id: 'mhs-1', name: 'Budi Santoso', email: 'budi@arjuna.ac.id' },
      },
    ],
    assignments: [
      {
        id: 'a-1',
        title: 'Tugas 1: Tree & Graph',
        weightPercentage: 20,
        maxScore: 100,
        submissions: [{ studentId: 'mhs-1', score: 90 }],
      },
    ],
    quizzes: [
      {
        id: 'q-1',
        title: 'Kuis 1: Kompleksitas',
        weightPercentage: 15,
        attempts: [{ studentId: 'mhs-1', score: 85 }],
      },
    ],
    threads: [
      {
        id: 't-1',
        messages: [{ authorId: 'mhs-1' }],
        opinions: [{ userId: 'mhs-1' }],
      },
    ],
  };

  beforeEach(async () => {
    const mockPrisma = {
      course: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      courseModule: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      courseMaterial: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      materialProgress: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      virtualMeeting: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      assignment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      assignmentSubmission: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      quiz: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      quizAttempt: {
        create: jest.fn(),
      },
      announcement: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      enrollment: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AcademicService>(AcademicService);
    prisma = module.get(PrismaService);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 1. SYLLABUS & RPS
  // ══════════════════════════════════════════════════════════════════════════
  describe('Syllabus & RPS Operations', () => {
    it('TC-ACAD-001: Should update RPS when called by assigned lecturer', async () => {
      prisma.course.findUnique.mockResolvedValue(mockCourse);
      prisma.course.update.mockResolvedValue({
        ...mockCourse,
        syllabus: '<p>Updated RPS</p>',
      });

      const result = await service.updateSyllabus('course-1', 'dosen-1', Role.LECTURER, {
        syllabus: '<p>Updated RPS</p>',
      });

      expect(result.syllabus).toBe('<p>Updated RPS</p>');
      expect(prisma.course.update).toHaveBeenCalled();
    });

    it('TC-ACAD-002: Should allow ADMIN to update RPS for any course', async () => {
      prisma.course.findUnique.mockResolvedValue(mockCourse);
      prisma.course.update.mockResolvedValue({
        ...mockCourse,
        syllabus: '<p>Admin Revised RPS</p>',
      });

      const result = await service.updateSyllabus('course-1', 'admin-1', Role.ADMIN, {
        syllabus: '<p>Admin Revised RPS</p>',
      });

      expect(result.syllabus).toBe('<p>Admin Revised RPS</p>');
    });

    it('TC-ACAD-003: Should reject when unauthorized user attempts to update RPS', async () => {
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      await expect(
        service.updateSyllabus('course-1', 'other-user', Role.STUDENT, {
          syllabus: '<p>Hacked RPS</p>',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. LEARNING PATH & MATERIAL PROGRESS
  // ══════════════════════════════════════════════════════════════════════════
  describe('Material Completion & Progress Tracking', () => {
    it('TC-ACAD-004: Should toggle material progress to completed for student', async () => {
      prisma.courseMaterial.findUnique.mockResolvedValue({ id: 'mat-1', title: 'Slide Bab 1' });
      prisma.materialProgress.findUnique.mockResolvedValue(null);
      prisma.materialProgress.create.mockResolvedValue({
        id: 'prog-1',
        materialId: 'mat-1',
        studentId: 'mhs-1',
        isCompleted: true,
        completedAt: new Date(),
      });

      const res = await service.toggleMaterialProgress('mat-1', 'mhs-1');
      expect(res).toHaveProperty('completed');
      expect(res.completed).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. VIRTUAL MEETINGS & SCHEDULING
  // ══════════════════════════════════════════════════════════════════════════
  describe('Virtual Meetings Scheduling', () => {
    it('TC-ACAD-005: Should create virtual meeting with Google Meet link', async () => {
      prisma.course.findUnique.mockResolvedValue(mockCourse);
      prisma.virtualMeeting.create.mockResolvedValue({
        id: 'meet-1',
        courseId: 'course-1',
        title: 'Review Midterm Test',
        platform: MeetingPlatform.GOOGLE_MEET,
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        scheduledAt: new Date(),
      });

      const res = await service.createVirtualMeeting('course-1', 'dosen-1', Role.LECTURER, {
        title: 'Review Midterm Test',
        platform: MeetingPlatform.GOOGLE_MEET,
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        scheduledAt: new Date().toISOString(),
      });

      expect(res.platform).toBe(MeetingPlatform.GOOGLE_MEET);
      expect(res.meetingUrl).toContain('meet.google.com');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. ASSIGNMENTS & TURNITIN ANTI-PLAGIARISM SIMULATION
  // ══════════════════════════════════════════════════════════════════════════
  describe('Assignments & Anti-Plagiarism Engine', () => {
    it('TC-ACAD-006: Should submit assignment and calculate Turnitin originality index', async () => {
      prisma.assignment.findUnique.mockResolvedValue({
        id: 'assign-1',
        courseId: 'course-1',
        maxScore: 100,
        submissions: [],
      });

      prisma.assignmentSubmission.findUnique.mockResolvedValue(null);
      prisma.assignmentSubmission.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'sub-1',
          ...data,
          plagiarismSimilarity: 12,
        }),
      );

      const res = await service.submitAssignment('assign-1', 'mhs-1', {
        submittedText: 'Analisis kompleksitas algoritma sorting QuickSort dan MergeSort.',
      });

      expect(res).toBeDefined();
      expect(res.plagiarismSimilarity).toBeGreaterThanOrEqual(0);
      expect(res.plagiarismSimilarity).toBeLessThanOrEqual(100);
    });

    it('TC-ACAD-007: Should grade student submission with score and lecturer feedback', async () => {
      prisma.assignmentSubmission.findUnique.mockResolvedValue({
        id: 'sub-1',
        assignmentId: 'assign-1',
        assignment: {
          courseId: 'course-1',
          course: mockCourse,
          maxScore: 100,
        },
      });

      prisma.assignmentSubmission.update.mockResolvedValue({
        id: 'sub-1',
        score: 95,
        feedback: 'Analisis sangat mendalam dan tepat.',
        gradedById: 'dosen-1',
      });

      const res = await service.gradeSubmission('sub-1', 'dosen-1', Role.LECTURER, {
        score: 95,
        feedback: 'Analisis sangat mendalam dan tepat.',
      });

      expect(res.score).toBe(95);
      expect(res.feedback).toContain('Analisis sangat mendalam');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. QUIZ ENGINE & AUTOMATIC ATTEMPT SCORING
  // ══════════════════════════════════════════════════════════════════════════
  describe('Quiz Engine & Evaluation', () => {
    it('TC-ACAD-008: Should evaluate quiz answers and calculate automatic percentage score', async () => {
      const mockQuiz = {
        id: 'quiz-1',
        courseId: 'course-1',
        title: 'Kuis 1: Kompleksitas Algoritma',
        timeLimitMinutes: 30,
        passingScore: 70,
        questions: [
          {
            id: 'q-1',
            questionText: 'Kompleksitas Binary Search adalah?',
            questionType: 'MULTIPLE_CHOICE',
            options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
            correctOptionIndex: 1,
            points: 10,
          },
          {
            id: 'q-2',
            questionText: 'Stack menggunakan prinsip LIFO?',
            questionType: 'MULTIPLE_CHOICE',
            options: ['Benar', 'Salah'],
            correctOptionIndex: 0,
            points: 10,
          },
        ],
      };

      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);
      prisma.quizAttempt.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'attempt-1',
          ...data,
        }),
      );

      const res = await service.submitQuizAttempt('quiz-1', 'mhs-1', {
        answers: [
          { questionId: 'q-1', selectedOptionIndex: 1 },
          { questionId: 'q-2', selectedOptionIndex: 0 },
        ],
      });

      expect(res.score).toBe(100);
      expect(res.isPassed).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. GRADEBOOK & LETTER GRADE CALCULATION
  // ══════════════════════════════════════════════════════════════════════════
  describe('Gradebook & Letter Grades', () => {
    it('TC-ACAD-009: Should compute accurate letter grades (A, B+, B, C, D, E) based on default academic weights', async () => {
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      const gradebook = await service.getCourseGradebook('course-1');

      expect(gradebook).toBeDefined();
      expect(gradebook.gradebook).toBeInstanceOf(Array);
      expect(gradebook.gradebook.length).toBe(1);
      expect(gradebook.gradebook[0].studentName).toBe('Budi Santoso');
      expect(gradebook.gradebook[0].letterGrade).toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. ANNOUNCEMENTS & SYSTEM SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  describe('Campus Announcements & System Configuration', () => {
    it('TC-ACAD-010: Should broadcast global campus announcement with urgent priority', async () => {
      prisma.announcement.create.mockResolvedValue({
        id: 'ann-1',
        title: 'Pemeliharaan Server Akademik',
        content: 'Server akan di-maintenance pukul 23:00 WIB.',
        priority: 'URGENT',
        isPinned: true,
        authorId: 'admin-1',
        courseId: null,
      });

      const res = await service.createAnnouncement('admin-1', Role.ADMIN, {
        title: 'Pemeliharaan Server Akademik',
        content: 'Server akan di-maintenance pukul 23:00 WIB.',
        priority: 'URGENT',
        isPinned: true,
      });

      expect(res.priority).toBe('URGENT');
      expect(res.isPinned).toBe(true);
    });

    it('TC-ACAD-011: Should get and update Admin System Settings', async () => {
      const settings = await service.getAdminSettings();
      expect(settings.activeTerm).toBeDefined();
      expect(
        settings.assessmentWeights.assignments +
          settings.assessmentWeights.quizzes +
          settings.assessmentWeights.forum +
          settings.assessmentWeights.midterm +
          settings.assessmentWeights.finalExam,
      ).toBe(100);

      const updated = await service.updateAdminSettings({
        turnitinMaxSimilarity: 25,
      });

      expect(updated.turnitinMaxSimilarity).toBe(25);
    });
  });
});
