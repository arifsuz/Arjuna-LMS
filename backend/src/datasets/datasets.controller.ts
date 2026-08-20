import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { DatasetsService } from './datasets.service';
import { CreateDatasetLabelDto, QueryDatasetExportDto } from './dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { AuditInterceptor } from '../common/interceptors';

@Controller('admin/dataset')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@UseInterceptors(AuditInterceptor)
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Get('summary')
  async getSummary() {
    return this.datasetsService.getSummary();
  }

  @Get('export')
  async exportDataset(
    @Query() query: QueryDatasetExportDto,
    @Res() res: Response,
  ) {
    if (query.format === 'json') {
      const rows = await this.datasetsService.buildDatasetRows(query);
      return res.json({ data: rows });
    }

    const csvContent = await this.datasetsService.exportCsv(query);
    const filename = `arjuna_dataset_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    return res.send(csvContent);
  }

  @Post(':threadId/labels')
  async setLabels(
    @Param('threadId') threadId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateDatasetLabelDto,
  ) {
    return this.datasetsService.setLabels(threadId, adminId, dto);
  }

  @Get(':threadId/labels')
  async getLabels(@Param('threadId') threadId: string) {
    return this.datasetsService.getLabels(threadId);
  }
}
