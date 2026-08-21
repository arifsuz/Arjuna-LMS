import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://arjuna:arjuna_dev_2026@127.0.0.1:5433/arjuna_lms?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('[Seed] Seeding database with initial sample data...');

  // Create Super Admin
  const adminPassword = await argon2.hash('admin123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@arjuna-lms.ac.id' },
    update: {},
    create: {
      name: 'Super Admin (Peneliti)',
      email: 'admin@arjuna-lms.ac.id',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`[Seed] Admin created: ${admin.email}`);

  // Create sample lecturer
  const lecturerPassword = await argon2.hash('dosen123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const lecturer = await prisma.user.upsert({
    where: { email: 'dosen1@arjuna-lms.ac.id' },
    update: {},
    create: {
      name: 'Dosen Contoh 1',
      email: 'dosen1@arjuna-lms.ac.id',
      passwordHash: lecturerPassword,
      role: Role.LECTURER,
      createdByAdmin: admin.id,
    },
  });
  console.log(`[Seed] Lecturer created: ${lecturer.email}`);

  // Create sample students
  const studentPassword = await argon2.hash('mahasiswa123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const students = [];
  for (let i = 1; i <= 4; i++) {
    const student = await prisma.user.upsert({
      where: { email: `mahasiswa${i}@arjuna-lms.ac.id` },
      update: {},
      create: {
        name: `Mahasiswa Contoh ${i}`,
        email: `mahasiswa${i}@arjuna-lms.ac.id`,
        passwordHash: studentPassword,
        role: Role.STUDENT,
        createdByAdmin: admin.id,
      },
    });
    students.push(student);
    console.log(`[Seed] Student created: ${student.email}`);
  }

  // Create sample course
  const course = await prisma.course.upsert({
    where: { code: 'IF101' },
    update: {},
    create: {
      code: 'IF101',
      name: 'Pemrograman Dasar',
      lecturerId: lecturer.id,
      term: '2026/2027-Ganjil',
    },
  });
  console.log(`[Seed] Course created: ${course.code} - ${course.name}`);

  // Enroll students
  for (const student of students) {
    await prisma.enrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: course.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        studentId: student.id,
      },
    });
  }
  console.log(`[Seed] 4 students enrolled into ${course.code}`);

  console.log('\n[Seed] Finished successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
