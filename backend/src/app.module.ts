import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ThreadsModule } from './threads/threads.module';
import { OpinionsModule } from './opinions/opinions.module';
import { DatasetsModule } from './datasets/datasets.module';
import { AcademicModule } from './academic/academic.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Environment config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting: 120 requests per 60 seconds per IP (safe for multi-request page bursts)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: Number(process.env.THROTTLE_LIMIT || 120),
      },
    ]),

    // Global Core & Events
    PrismaModule,
    EventsModule,

    // Feature modules
    AuthModule,
    UsersModule,
    CoursesModule,
    ThreadsModule,
    OpinionsModule,
    DatasetsModule,
    AcademicModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
