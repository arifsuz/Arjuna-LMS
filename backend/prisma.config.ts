import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://arjuna:arjuna_dev_2026@127.0.0.1:5433/arjuna_lms?schema=public',
  },
});
