import prisma from '../config/prisma.js';

async function testPrismaConnectivity() {
  console.log('[Prisma Test] Verifying live connection with Prisma Client...');
  try {
    const userCount = await prisma.user.count();
    const deviceCount = await prisma.device.count();
    console.log(`[Prisma Test] Success! Total users in DB: ${userCount}, Total devices: ${deviceCount}`);
    
    const sampleUser = await prisma.user.findFirst({
      select: { id: true, email: true, name: true, created_at: true }
    });
    if (sampleUser) {
      console.log('[Prisma Test] Verified query result:', sampleUser);
    }
    
    await prisma.$disconnect();
    console.log('[Prisma Test] Connection test passed and disconnected cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('[Prisma Test] Error connecting via Prisma:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testPrismaConnectivity();
