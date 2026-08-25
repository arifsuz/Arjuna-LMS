import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ThreadsService } from './threads.service';
import { CreateThreadDto, CreateMessageDto, QueryThreadsDto } from './dto';
import { CurrentUser } from '../common/decorators';

@ApiTags('Threads')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(AuthGuard('jwt'))
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  // ─── Thread endpoints ─────────────────────────────────────────────

  @Post('courses/:courseId/threads')
  async createThread(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateThreadDto,
  ) {
    return this.threadsService.createThread(courseId, userId, role, dto);
  }

  @Get('courses/:courseId/threads')
  async findThreads(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query() query: QueryThreadsDto,
  ) {
    return this.threadsService.findThreadsByCourse(
      courseId,
      userId,
      role,
      query,
    );
  }

  @Get('threads/:threadId')
  async findThread(
    @Param('threadId') threadId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.threadsService.findThreadById(threadId, userId, role);
  }

  // ─── Message endpoints ────────────────────────────────────────────

  @Post('threads/:threadId/messages')
  async addMessage(
    @Param('threadId') threadId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateMessageDto,
  ) {
    return this.threadsService.addMessage(threadId, userId, role, dto);
  }

  // ─── Thread management ────────────────────────────────────────────

  @Patch('threads/:threadId/close')
  async closeThread(
    @Param('threadId') threadId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.threadsService.closeThread(threadId, userId, role);
  }
}
