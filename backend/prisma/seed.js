try {
  require('dotenv').config();
} catch (e) {}

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {}
}

const { PrismaClient, Role } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { hash, Algorithm } = require('@node-rs/argon2');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordPlain = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Super Admin';

  if (!adminEmail || !adminPasswordPlain) {
    console.log(
      '[Seed] ℹ️ Variabel ADMIN_EMAIL atau ADMIN_PASSWORD belum disetel di .env / Dokploy Environment. Melewati inisialisasi akun admin.',
    );
    return;
  }

  console.log(`[Seed] Menginisialisasi akun Super Admin untuk email: ${adminEmail}...`);

  const passwordHash = await hash(adminPasswordPlain, {
    algorithm: Algorithm.Argon2id,
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`[Seed] ✅ Akun Super Admin (${admin.email}) siap digunakan.`);
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
