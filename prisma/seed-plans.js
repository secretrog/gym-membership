const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const plans = [
        {
            name: "Basic Plan",
            durationDays: 30,
            price: 50.0,
            description: "Access to gym equipment and locker room."
        },
        {
            name: "Pro Plan",
            durationDays: 90,
            price: 135.0,
            description: "Basic features plus group classes and 1 PT session/month."
        },
        {
            name: "Elite Plan",
            durationDays: 365,
            price: 500.0,
            description: "Unlimited access, all classes, sauna, and massage."
        }
    ];

    for (const plan of plans) {
        await prisma.membershipPlan.upsert({
            where: { id: plan.name }, // This is a bit hacky for a simple seed, but works if we use name as temporary unique key or just create
            update: {},
            create: {
                ...plan
            }
        }).catch(async (e) => {
            // If ID-based upsert fails because it's uuid, just create
            await prisma.membershipPlan.create({ data: plan });
        });
    }

    console.log('Seeded 3 membership plans');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
