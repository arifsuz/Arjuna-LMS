import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is required. Set it in .env (local) or Dokploy Environment (production).',
      );
    }
    const pool = new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_MAX || 25),
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT || 10000),
      connectionTimeoutMillis: Number(process.env.DB_POOL_CONN_TIMEOUT || 5000),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
