import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role, MaterialType, MeetingPlatform } from '@prisma/client';
import { PrismaService } from '../common/prisma';
import {
  CreateModuleDto,
  CreateMaterialDto,
  CreateVirtualMeetingDto,
  CreateAnnouncementDto,
  CreateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  CreateQuizDto,
  SubmitQuizAttemptDto,
  UpdateCourseSyllabusDto,
} from './dto';

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // 1. SYLLABUS & RPS
  // ══════════════════════════════════════════════════════════════════════════

  async updateSyllabus(courseId: string, userId: string, userRole: Role, dto: UpdateCourseSyllabusDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kelas tidak ditemukan');
    if (userRole !== Role.ADMIN && course.lecturerId !== userId) {
      throw new ForbiddenException('Hanya dosen pengampu atau admin yang bisa mengubah RPS');
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        description: dto.description ?? course.description,
        syllabus: dto.syllabus ?? course.syllabus,
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. MODULES & MATERIALS & LEARNING PATH
  // ══════════════════════════════════════════════════════════════════════════

  async getCourseModules(courseId: string, studentId?: string) {
    const modules = await this.prisma.courseModule.findMany({
      where: { courseId },
      include: {
        materials: {
          include: {
            progress: studentId ? { where: { studentId } } : true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        assignments: {
          include: {
            submissions: studentId ? { where: { studentId } } : false,
          },
        },
        quizzes: {
          include: {
            attempts: studentId ? { where: { studentId } } : false,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    // Compute progress stats
    let totalMaterials = 0;
    let completedMaterials = 0;

    const formattedModules = modules.map((m) => {
      const formattedMaterials = m.materials.map((mat) => {
        totalMaterials++;
        const isCompleted = studentId ? mat.progress.length > 0 : false;
        if (isCompleted) completedMaterials++;
        return {
          id: mat.id,
          title: mat.title,
          type: mat.type,
          contentUrl: mat.contentUrl,
          textContent: mat.textContent,
          durationMinutes: mat.durationMinutes,
          orderIndex: mat.orderIndex,
          isCompleted,
        };
      });

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        orderIndex: m.orderIndex,
        materials: formattedMaterials,
        assignments: m.assignments,
        quizzes: m.quizzes,
      };
    });

    const progressPercentage =
      totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

    return {
      modules: formattedModules,
      stats: {
        totalMaterials,
        completedMaterials,
        progressPercentage,
      },
    };
  }

  async createModule(courseId: string, userId: string, userRole: Role, dto: CreateModuleDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kelas tidak ditemukan');
    if (userRole !== Role.ADMIN && course.lecturerId !== userId) {
      throw new ForbiddenException('Hanya dosen pengampu atau admin yang bisa membuat modul');
    }

    const count = await this.prisma.courseModule.count({ where: { courseId } });

    return this.prisma.courseModule.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description || null,
        orderIndex: dto.orderIndex ?? count + 1,
      },
    });
  }

  async createMaterial(moduleId: string, userId: string, userRole: Role, dto: CreateMaterialDto) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!module) throw new NotFoundException('Modul tidak ditemukan');
    if (userRole !== Role.ADMIN && module.course.lecturerId !== userId) {
      throw new ForbiddenException('Hanya dosen pengampu atau admin yang bisa menambah materi');
    }

    const count = await this.prisma.courseMaterial.count({ where: { moduleId } });

    return this.prisma.courseMaterial.create({
      data: {
        moduleId,
        title: dto.title,
        type: dto.type || MaterialType.PDF,
        contentUrl: dto.contentUrl || null,
        textContent: dto.textContent || null,
        durationMinutes: dto.durationMinutes || null,
        orderIndex: dto.orderIndex ?? count + 1,
      },
    });
  }

  async toggleMaterialProgress(materialId: string, studentId: string) {
    const material = await this.prisma.courseMaterial.findUnique({
      where: { id: materialId },
    });
    if (!material) throw new NotFoundException('Materi tidak ditemukan');

    const existing = await this.prisma.materialProgress.findUnique({
      where: {
        materialId_studentId: {
          materialId,
          studentId,
        },
      },
    });

    if (existing) {
      await this.prisma.materialProgress.delete({
        where: { id: existing.id },
      });
      return { completed: false };
    } else {
      await this.prisma.materialProgress.create({
        data: {
          materialId,
          studentId,
        },
      });
      return { completed: true };
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. VIRTUAL CLASSROOM (SYNCHRONOUS MEETINGS)
  // ══════════════════════════════════════════════════════════════════════════

  async getVirtualMeetings(courseId: string) {
    return this.prisma.virtualMeeting.findMany({
      where: { courseId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async createVirtualMeeting(
    courseId: string,
    userId: string,
    userRole: Role,
    dto: CreateVirtualMeetingDto,
  ) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kelas tidak ditemukan');
    if (userRole !== Role.ADMIN && course.lecturerId !== userId) {
      throw new ForbiddenException('Hanya dosen pengampu atau admin yang bisa menjadwalkan kelas virtual');
    }

    return this.prisma.virtualMeeting.create({
      data: {
        courseId,
        title: dto.title,
        platform: dto.platform || MeetingPlatform.GOOGLE_MEET,
        meetingUrl: dto.meetingUrl,
        passcode: dto.passcode || null,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes || 90,
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. ANNOUNCEMENTS & STUDY GROUPS
  // ══════════════════════════════════════════════════════════════════════════

  async getAnnouncements(courseId?: string) {
    const where: any = {};
    if (courseId) {
      where.OR = [{ courseId }, { courseId: null }];
    }
    return this.prisma.announcement.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAnnouncement(
    courseId: string | undefined,
    authorId: string,
    dto: CreateAnnouncementDto,
  ) {
    return this.prisma.announcement.create({
      data: {
        courseId: courseId || null,
        authorId,
        title: dto.title,
        content: dto.content,
        isPinned: dto.isPinned ?? false,
        priority: dto.priority || 'NORMAL',
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async getStudyGroups(courseId: string) {
    return this.prisma.studyGroup.findMany({
      where: { courseId },
      include: {
        members: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. ASSIGNMENTS & PLAGIARISM SIMULATION
  // ══════════════════════════════════════════════════════════════════════════

  async getAssignments(courseId: string, studentId?: string) {
    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        module: { select: { id: true, title: true } },
        submissions: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return assignments.map((a) => {
      const mySubmission = studentId
        ? a.submissions.find((s) => s.studentId === studentId) || null
        : null;

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        module: a.module,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        weightPercentage: a.weightPercentage,
        totalSubmissions: a.submissions.length,
        mySubmission,
        submissions: a.submissions,
      };
    });
  }

  async createAssignment(
    courseId: string,
    userId: string,
    userRole: Role,
    dto: CreateAssignmentDto,
  ) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kelas tidak ditemukan');
    if (userRole !== Role.ADMIN && course.lecturerId !== userId) {
      throw new ForbiddenException('Hanya dosen pengampu atau admin yang bisa membuat tugas');
    }

    return this.prisma.assignment.create({
      data: {
        courseId,
        moduleId: dto.moduleId || null,
        title: dto.title,
        description: dto.description,
        dueDate: new Date(dto.dueDate),
        maxScore: dto.maxScore || 100,
        weightPercentage: dto.weightPercentage || 15,
      },
    });
  }

  async submitAssignment(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('Tugas tidak ditemukan');

    // Simulate Turnitin Plagiarism Similarity Score (between 4.0% and 14.5% - green/clean)
    const simulatedSimilarity = Math.round((4.0 + Math.random() * 10.5) * 10) / 10;

    const existing = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });

    if (existing) {
      return this.prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: {
          fileUrl: dto.fileUrl || existing.fileUrl,
          submittedText: dto.submittedText || existing.submittedText,
          plagiarismSimilarity: simulatedSimilarity,
          submittedAt: new Date(),
        },
      });
    }

    return this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        fileUrl: dto.fileUrl || null,
        submittedText: dto.submittedText || null,
        plagiarismSimilarity: simulatedSimilarity,
      },
    });
  }

  async gradeSubmission(
    submissionId: string,
    userId: string,
    userRole: Role,
    dto: GradeSubmissionDto,
  ) {
    const sub = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { course: true } } },
    });
    if (!sub) throw new NotFoundException('Pengumpulan tugas tidak ditemukan');
    if (userRole !== Role.ADMIN && sub.assignment.course.lecturerId !== userId) {
      throw new ForbiddenException('Hanya dosen kelas yang bisa menilai tugas');
    }

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback || null,
        gradedAt: new Date(),
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. QUIZ ENGINE
  // ══════════════════════════════════════════════════════════════════════════

  async getQuizzes(courseId: string, studentId?: string) {
    const quizzes = await this.prisma.quiz.findMany({
      where: { courseId },
      include: {
        module: { select: { id: true, title: true } },
        questions: { select: { id: true, points: true } },
        attempts: studentId
          ? { where: { studentId }, orderBy: { submittedAt: 'desc' } }
          : { include: { student: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => {
      const myAttempt = studentId && q.attempts.length > 0 ? q.attempts[0] : null;
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        module: q.module,
        durationMinutes: q.durationMinutes,
        passingScore: q.passingScore,
        weightPercentage: q.weightPercentage,
        questionsCount: q.questions.length,
        totalPoints: q.questions.reduce((sum, item) => sum + item.points, 0),
        myAttempt,
        attempts: q.attempts,
      };
    });
  }

  async getQuizDetails(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { points: 'asc' },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Kuis tidak ditemukan');
    return quiz;
  }

  async createQuiz(courseId: string, userId: string, userRole: Role, dto: CreateQuizDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kelas tidak ditemukan');
    if (userRole !== Role.ADMIN && course.lecturerId !== userId) {
      throw new ForbiddenException('Hanya dosen pengampu atau admin yang bisa membuat kuis');
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        courseId,
        moduleId: dto.moduleId || null,
        title: dto.title,
        description: dto.description || null,
        durationMinutes: dto.durationMinutes || 30,
        passingScore: dto.passingScore || 70,
        weightPercentage: dto.weightPercentage || 10,
      },
    });

    if (dto.questions && dto.questions.length > 0) {
      await Promise.all(
        dto.questions.map((q) =>
          this.prisma.quizQuestion.create({
            data: {
              quizId: quiz.id,
              questionText: q.questionText,
              questionType: q.questionType || 'MULTIPLE_CHOICE',
              options: q.options || [],
              correctOptionIndex: q.correctOptionIndex ?? 0,
              points: q.points || 10,
            },
          }),
        ),
      );
    }

    return this.getQuizDetails(quiz.id);
  }

  async submitQuizAttempt(quizId: string, studentId: string, dto: SubmitQuizAttemptDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) throw new NotFoundException('Kuis tidak ditemukan');

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const q of quiz.questions) {
      totalPoints += q.points;
      const userAns = dto.answers.find((a) => a.questionId === q.id);
      if (userAns) {
        if (q.questionType === 'MULTIPLE_CHOICE') {
          if (userAns.selectedOptionIndex === q.correctOptionIndex) {
            earnedPoints += q.points;
          }
        } else {
          // Essay: award baseline points for submitted essay answer
          if (userAns.essayAnswer && userAns.essayAnswer.trim().length > 10) {
            earnedPoints += Math.round(q.points * 0.85);
          }
        }
      }
    }

    const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;
    const isPassed = finalScore >= quiz.passingScore;

    return this.prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        score: finalScore,
        answersJson: dto.answers as any,
        isPassed,
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 7. GRADEBOOK & EARLY WARNING ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════

  async getCourseGradebook(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
        assignments: {
          include: { submissions: true },
        },
        quizzes: {
          include: { attempts: true },
        },
        threads: {
          include: {
            messages: true,
            opinions: true,
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Kelas tidak ditemukan');

    const gradebookRows = course.enrollments.map((enr) => {
      const student = enr.student;

      // 1. Assignment Average
      const studentSubs = course.assignments.map((a) => {
        const sub = a.submissions.find((s) => s.studentId === student.id);
        return {
          assignmentTitle: a.title,
          weight: a.weightPercentage,
          score: sub?.score != null ? sub.score : sub ? 80 : 0,
          submitted: !!sub,
        };
      });

      const totalAssignmentScore =
        studentSubs.length > 0
          ? Math.round(studentSubs.reduce((acc, curr) => acc + curr.score, 0) / studentSubs.length)
          : 85;

      // 2. Quiz Average
      const studentAttempts = course.quizzes.map((q) => {
        const att = q.attempts.find((a) => a.studentId === student.id);
        return {
          quizTitle: q.title,
          score: att ? att.score : 0,
          attempted: !!att,
        };
      });

      const totalQuizScore =
        studentAttempts.length > 0
          ? Math.round(studentAttempts.reduce((acc, curr) => acc + curr.score, 0) / studentAttempts.length)
          : 80;

      // 3. Forum Participation (Answers + Opinions)
      const answersCount = course.threads.reduce((acc, t) => {
        return acc + t.messages.filter((m) => m.authorId === student.id && m.type === 'ANSWER').length;
      }, 0);

      const opinionsCount = course.threads.reduce((acc, t) => {
        return acc + t.opinions.filter((o) => o.authorId === student.id).length;
      }, 0);

      const forumScore = Math.min(100, (answersCount * 35) + (opinionsCount * 25) + 30);

      // 4. UTS & UAS Baseline Estimates
      const utsScore = Math.min(100, Math.round(totalAssignmentScore * 0.5 + totalQuizScore * 0.5));
      const uasScore = Math.min(100, Math.round(totalAssignmentScore * 0.6 + forumScore * 0.4));

      // Weighted Total Calculation: Tugas (20%), Kuis (15%), Forum (15%), UTS (25%), UAS (25%)
      const finalScore = Math.round(
        totalAssignmentScore * 0.20 +
        totalQuizScore * 0.15 +
        forumScore * 0.15 +
        utsScore * 0.25 +
        uasScore * 0.25,
      );

      // Letter Grade & Status
      let letterGrade = 'A';
      let gpa = 4.0;
      if (finalScore < 50) {
        letterGrade = 'E';
        gpa = 0.0;
      } else if (finalScore < 60) {
        letterGrade = 'D';
        gpa = 1.0;
      } else if (finalScore < 68) {
        letterGrade = 'C';
        gpa = 2.0;
      } else if (finalScore < 75) {
        letterGrade = 'B';
        gpa = 3.0;
      } else if (finalScore < 85) {
        letterGrade = 'AB';
        gpa = 3.5;
      } else {
        letterGrade = 'A';
        gpa = 4.0;
      }

      // Early Warning Risk Assessment
      const missingAssignments = studentSubs.filter((s) => !s.submitted).length;
      const isAtRisk = missingAssignments > 0 || forumScore < 60 || finalScore < 65;

      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        assignmentScore: totalAssignmentScore,
        quizScore: totalQuizScore,
        forumScore,
        utsScore,
        uasScore,
        finalScore,
        letterGrade,
        gpa,
        missingAssignments,
        isAtRisk,
        riskReason: isAtRisk
          ? missingAssignments > 0
            ? `${missingAssignments} tugas belum dikumpulkan`
            : 'Keaktifan forum & skor di bawah target'
          : 'Performa Sangat Baik',
      };
    });

    return {
      course: { id: course.id, code: course.code, name: course.name },
      totalStudents: course.enrollments.length,
      gradebook: gradebookRows,
      earlyWarningSummary: {
        totalAtRisk: gradebookRows.filter((r) => r.isAtRisk).length,
        averageClassScore:
          gradebookRows.length > 0
            ? Math.round(gradebookRows.reduce((acc, r) => acc + r.finalScore, 0) / gradebookRows.length)
            : 0,
      },
    };
  }

  async getAcademicOverview(userId: string, userRole: Role) {
    const upcomingMeetings = await this.prisma.virtualMeeting.findMany({
      where: { scheduledAt: { gte: new Date(Date.now() - 2 * 3600 * 1000) } },
      include: { course: { select: { id: true, code: true, name: true } } },
      orderBy: { scheduledAt: 'asc' },
      take: 4,
    });

    const pendingAssignments = await this.prisma.assignment.findMany({
      where: { dueDate: { gte: new Date() } },
      include: {
        course: { select: { id: true, code: true, name: true } },
        submissions: userRole === Role.STUDENT ? { where: { studentId: userId } } : false,
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    const recentAnnouncements = await this.getAnnouncements();

    return {
      upcomingMeetings,
      pendingAssignments: pendingAssignments.map((a) => ({
        id: a.id,
        title: a.title,
        course: a.course,
        dueDate: a.dueDate,
        isSubmitted: userRole === Role.STUDENT ? (a.submissions?.length || 0) > 0 : false,
      })),
      recentAnnouncements: recentAnnouncements.slice(0, 3),
    };
  }
}
