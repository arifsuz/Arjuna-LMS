import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, EnrollStudentsDto } from './dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';

// ─── Admin endpoints ──────────────────────────────────────────────────

@Controller('admin/courses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }

  @Post(':id/enroll')
  async enrollStudents(
    @Param('id') courseId: string,
    @Body() dto: EnrollStudentsDto,
  ) {
    return this.coursesService.enrollStudents(courseId, dto);
  }

  @Delete(':courseId/students/:studentId')
  async unenrollStudent(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.coursesService.unenrollStudent(courseId, studentId);
  }
}

// ─── Authenticated user endpoints ─────────────────────────────────────

@Controller('courses')
@UseGuards(AuthGuard('jwt'))
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async myCourses(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.findByUser(userId, role);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }
}
