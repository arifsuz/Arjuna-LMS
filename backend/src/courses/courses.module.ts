import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { AdminCoursesController, CoursesController } from './courses.controller';

@Module({
  controllers: [AdminCoursesController, CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
