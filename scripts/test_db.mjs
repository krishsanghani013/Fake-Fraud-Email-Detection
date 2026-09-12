import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const profiles = await prisma.profile.findMany();
    console.log('Profiles in DB:', profiles);
    const emails = await prisma.email.findMany({
      include: {
        analysisResults: true,
        user: true
      }
    });
    console.log('Emails in DB:', emails.length, JSON.stringify(emails, null, 2));
  } catch (err) {
    console.error('DB Query Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
