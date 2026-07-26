const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // Get the email and new password from the command line arguments
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
        console.log("❌ Please provide both an email and a new password.");
        console.log("👉 Usage: node reset-password.js <email> <newPassword>");
        console.log("👉 Example: node reset-password.js admin@ironpulse.com myNewPassword123");
        process.exit(1);
    }

    // 1. Check if the user exists in the database
    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    if (!user) {
        console.log(`❌ No user found with the email: ${email}`);
        process.exit(1);
    }

    // 2. Encrypt (hash) the new password
    console.log(`🔒 Encrypting the new password for ${email}...`);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 3. Save the new encrypted password into the database
    await prisma.user.update({
        where: { email: email },
        data: { passwordHash: hashedPassword }
    });

    console.log(`✅ Success! The password for ${email} has been changed to: ${newPassword}`);
}

main()
    .catch((e) => {
        console.error("An error occurred:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
