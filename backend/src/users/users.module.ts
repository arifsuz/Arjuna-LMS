import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UsersController, UsersSelfController } from './users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      storage: undefined, // memory storage (buffer)
    }),
  ],
  controllers: [UsersController, UsersSelfController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
