import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System Health')
@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'ARJUNA LMS Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/api/auth/login, /api/auth/me, /api/auth/refresh, /api/auth/logout',
        users: '/api/admin/users, /api/users/me',
        courses: '/api/courses, /api/admin/courses',
        threads: '/api/courses/:courseId/threads, /api/threads/:threadId',
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
