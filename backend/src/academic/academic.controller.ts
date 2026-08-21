import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AcademicService } from './academic.service';
import { CurrentUser, Roles } from '../common/decorators';
import { Role } from '@prisma/client';
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

@Controller()
@UseGuards(AuthGuard('jwt'))
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // 1. Overview
  @Get('academic/overview')
  getAcademicOverview(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.academicService.getAcademicOverview(userId, userRole);
  }

  // 2. Syllabus & RPS
  @Patch('courses/:courseId/syllabus')
  updateSyllabus(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: UpdateCourseSyllabusDto,
  ) {
    return this.academicService.updateSyllabus(courseId, userId, userRole, dto);
  }

  // 3. Modules & Materials
  @Get('courses/:courseId/modules')
  getCourseModules(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    const studentId = userRole === Role.STUDENT ? userId : undefined;
    return this.academicService.getCourseModules(courseId, studentId);
  }

  @Post('courses/:courseId/modules')
  createModule(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: CreateModuleDto,
  ) {
    return this.academicService.createModule(courseId, userId, userRole, dto);
  }

  @Post('modules/:moduleId/materials')
  createMaterial(
    @Param('moduleId') moduleId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: CreateMaterialDto,
  ) {
    return this.academicService.createMaterial(moduleId, userId, userRole, dto);
  }

  @Post('materials/:materialId/toggle-progress')
  toggleMaterialProgress(
    @Param('materialId') materialId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.academicService.toggleMaterialProgress(materialId, userId);
  }

  // 4. Virtual Meetings
  @Get('courses/:courseId/meetings')
  getVirtualMeetings(@Param('courseId') courseId: string) {
    return this.academicService.getVirtualMeetings(courseId);
  }

  @Post('courses/:courseId/meetings')
  createVirtualMeeting(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: CreateVirtualMeetingDto,
  ) {
    return this.academicService.createVirtualMeeting(courseId, userId, userRole, dto);
  }

  // 5. Announcements & Study Groups
  @Get('courses/:courseId/announcements')
  getCourseAnnouncements(@Param('courseId') courseId: string) {
    return this.academicService.getAnnouncements(courseId);
  }

  @Get('announcements')
  getGeneralAnnouncements() {
    return this.academicService.getAnnouncements();
  }

  @Post('courses/:courseId/announcements')
  createAnnouncement(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.academicService.createAnnouncement(courseId, userId, dto);
  }

  @Get('courses/:courseId/groups')
  getStudyGroups(@Param('courseId') courseId: string) {
    return this.academicService.getStudyGroups(courseId);
  }

  // 6. Assignments
  @Get('courses/:courseId/assignments')
  getAssignments(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    const studentId = userRole === Role.STUDENT ? userId : undefined;
    return this.academicService.getAssignments(courseId, studentId);
  }

  @Post('courses/:courseId/assignments')
  createAssignment(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.academicService.createAssignment(courseId, userId, userRole, dto);
  }

  @Post('assignments/:assignmentId/submissions')
  submitAssignment(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.academicService.submitAssignment(assignmentId, userId, dto);
  }

  @Post('submissions/:submissionId/grade')
  gradeSubmission(
    @Param('submissionId') submissionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.academicService.gradeSubmission(submissionId, userId, userRole, dto);
  }

  // 7. Quizzes
  @Get('courses/:courseId/quizzes')
  getQuizzes(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    const studentId = userRole === Role.STUDENT ? userId : undefined;
    return this.academicService.getQuizzes(courseId, studentId);
  }

  @Get('quizzes/:quizId')
  getQuizDetails(@Param('quizId') quizId: string) {
    return this.academicService.getQuizDetails(quizId);
  }

  @Post('courses/:courseId/quizzes')
  createQuiz(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: CreateQuizDto,
  ) {
    return this.academicService.createQuiz(courseId, userId, userRole, dto);
  }

  @Post('quizzes/:quizId/attempt')
  submitQuizAttempt(
    @Param('quizId') quizId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitQuizAttemptDto,
  ) {
    return this.academicService.submitQuizAttempt(quizId, userId, dto);
  }

  // 8. Gradebook & Early Warning
  @Get('courses/:courseId/gradebook')
  getCourseGradebook(@Param('courseId') courseId: string) {
    return this.academicService.getCourseGradebook(courseId);
  }
}
