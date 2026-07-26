const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const qrs = await prisma.dailyQR.findMany();
    console.log("All Daily QRs:", qrs);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log("Today is:", today);

    const todayQR = await prisma.dailyQR.findUnique({ where: { date: today } });
    console.log("Today's QR:", todayQR);
}

main().catch(console.error).finally(() => prisma.$disconnect());
