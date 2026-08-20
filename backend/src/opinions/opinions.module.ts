import { Module } from '@nestjs/common';
import { OpinionsService } from './opinions.service';
import { OpinionsController } from './opinions.controller';

@Module({
  controllers: [OpinionsController],
  providers: [OpinionsService],
  exports: [OpinionsService],
})
export class OpinionsModule {}
