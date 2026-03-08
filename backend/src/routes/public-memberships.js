const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// @route   POST api/public-memberships/request
// @desc    Public endpoint for new users to request a membership from landing page
router.post('/request', async (req, res) => {
    try {
        const { name, email, phone, planId, paymentMethod } = req.body;

        if (!name || !email || !phone || !planId || !paymentMethod) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if phone or email already exists
        const existingMember = await prisma.member.findFirst({
            where: {
                OR: [
                    { email },
                    { phone }
                ]
            }
        });

        if (existingMember) {
            return res.status(400).json({ message: 'A member with this email or phone already exists.' });
        }

        const plan = await prisma.membershipPlan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return res.status(404).json({ message: 'Selected plan not found' });
        }

        // Hash the phone number to use as the initial password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(phone, salt);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create inactive User with 'member' role
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    role: 'member',
                    isActive: false // Pending admin approval
                }
            });

            // 2. Create Member linked to User
            const member = await tx.member.create({
                data: {
                    name,
                    email,
                    phone,
                    userId: user.id,
                    status: 'pending'
                }
            });

            // 3. Create pending Membership
            const membership = await tx.membership.create({
                data: {
                    memberId: member.id,
                    planId: plan.id,
                    status: 'pending'
                }
            });

            // 4. Create pending Payment
            const payment = await tx.payment.create({
                data: {
                    membershipId: membership.id,
                    memberId: member.id,
                    amount: plan.price,
                    amountDue: plan.price,
                    paymentMethod,
                    status: 'pending'
                }
            });

            return { user, member, membership, payment };
        });

        res.json({ message: 'Request submitted successfully. Waiting for admin approval.', membershipId: result.membership.id });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error while submitting request' });
    }
});

module.exports = router;
