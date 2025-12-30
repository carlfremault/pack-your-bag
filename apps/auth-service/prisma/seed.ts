import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const connectionString = process.env.AUTH_URL;
if (!connectionString) {
  throw new Error('❌ Connection failed: AUTH_URL is missing in .env');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = ['user', 'admin'];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { title: role },
      update: {},
      create: {
        title: role,
      },
    });
  }

  console.log('✅ Roles seeded successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
