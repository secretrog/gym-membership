const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@ironpulse.com';
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await prisma.user.create({
            data: {
                name: 'System Admin',
                email: adminEmail,
                passwordHash: hashedPassword,
                role: 'owner'
            }
        });
        console.log('✅ Admin user created: admin@ironpulse.com / admin123');
    } else {
        console.log('ℹ️ Admin user already exists');
    }

    // Seed some initial plans
    const plans = [
        { name: 'Basic', durationDays: 30, price: 1500, description: 'Basic monthly membership' },
        { name: 'Pro', durationDays: 90, price: 4000, description: 'Quarterly pro membership' },
        { name: 'Elite', durationDays: 365, price: 15000, description: 'Annual elite membership' }
    ];

    for (const plan of plans) {
        await prisma.membershipPlan.upsert({
            where: { id: plan.name }, // This is a hack for upserting by name if it were unique, but id is uuid.
            // Let's just create if count is 0
            update: {},
            create: plan,
            where: { id: 'non-existent-uuid' } // forcing create for now or better:
        });
    }

    // Proper upsert for plans
    for (const plan of plans) {
        const existingPlan = await prisma.membershipPlan.findFirst({ where: { name: plan.name } });
        if (!existingPlan) {
            await prisma.membershipPlan.create({ data: plan });
            console.log(`✅ Plan created: ${plan.name}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
