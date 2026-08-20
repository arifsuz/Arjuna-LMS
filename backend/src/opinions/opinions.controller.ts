import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { OpinionsService } from './opinions.service';
import { CreateOpinionDto } from './dto';
import { CurrentUser } from '../common/decorators';
import { AuditInterceptor } from '../common/interceptors';

@Controller('threads/:threadId/opinions')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(AuditInterceptor)
export class OpinionsController {
  constructor(private readonly opinionsService: OpinionsService) {}

  @Post()
  async create(
    @Param('threadId') threadId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: CreateOpinionDto,
  ) {
    return this.opinionsService.createOpinion(threadId, userId, userRole, dto);
  }

  @Get()
  async findAll(
    @Param('threadId') threadId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.opinionsService.findByThread(threadId, userId, userRole);
  }
}
