import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { INestApplicationContext, Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private readonly logger = new Logger(RedisIoAdapter.name);

  async connectToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    try {
      const pubClient = new Redis(redisUrl);
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) => {
        this.logger.warn(`Redis PubClient error: ${err.message}`);
      });
      subClient.on('error', (err) => {
        this.logger.warn(`Redis SubClient error: ${err.message}`);
      });

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log(`Connected to Redis at ${redisUrl} for Socket.IO clustering`);
    } catch (err: any) {
      this.logger.warn(
        `Failed to connect to Redis (${err.message}). Falling back to memory adapter.`,
      );
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
      },
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
