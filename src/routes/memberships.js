const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');

// @route   GET api/memberships/plans
// @desc    Get all available membership plans
router.get('/plans', async (req, res) => {
    try {
        const plans = await prisma.membershipPlan.findMany({
            where: { isActive: true }
        });
        res.json(plans);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/memberships/request
// @desc    User requests a membership plan
router.post('/request', auth, async (req, res) => {
    try {
        const { planId, paymentMethod } = req.body;
        const userId = req.user.id;

        const member = await prisma.member.findUnique({
            where: { userId }
        });

        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }

        const plan = await prisma.membershipPlan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Create a pending membership and payment
        const result = await prisma.$transaction(async (tx) => {
            const membership = await tx.membership.create({
                data: {
                    memberId: member.id,
                    planId: plan.id,
                    status: 'pending'
                }
            });

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

            return { membership, payment };
        });

        res.json({ message: 'Membership request submitted', ...result });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/memberships/pending
// @desc    Get all pending membership requests (Admin only)
router.get('/pending', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const pending = await prisma.membership.findMany({
            where: { status: 'pending' },
            include: {
                member: true,
                plan: true,
                payments: true
            }
        });
        res.json(pending);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/memberships/approve/:id
// @desc    Approve a membership request (Admin only)
router.put('/approve/:id', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const membershipId = req.params.id;

        const membership = await prisma.membership.findUnique({
            where: { id: membershipId },
            include: { plan: true, member: true }
        });

        if (!membership) {
            return res.status(404).json({ message: 'Membership request not found' });
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + membership.plan.durationDays);

        await prisma.$transaction(async (tx) => {
            // Update membership
            await tx.membership.update({
                where: { id: membershipId },
                data: {
                    status: 'active',
                    startDate,
                    endDate
                }
            });

            // Update associated pending payments to 'paid'
            await tx.payment.updateMany({
                where: { membershipId, status: 'pending' },
                data: {
                    status: 'paid',
                    paymentDate: new Date(),
                    amountDue: 0
                }
            });

            // Update member status
            await tx.member.update({
                where: { id: membership.memberId },
                data: { status: 'active' }
            });

            // If the member has an associated User, activate the user account
            if (membership.member.userId) {
                await tx.user.update({
                    where: { id: membership.member.userId },
                    data: { isActive: true }
                });
            }
        });

        res.json({ message: 'Membership approved and activated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/memberships/dismiss/:id
// @desc    Dismiss/reject a pending membership request (Admin only)
router.delete('/dismiss/:id', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const membershipId = req.params.id;

        const membership = await prisma.membership.findUnique({
            where: { id: membershipId }
        });

        if (!membership) {
            return res.status(404).json({ message: 'Membership request not found' });
        }

        await prisma.$transaction(async (tx) => {
            // Delete associated payments first
            await tx.payment.deleteMany({
                where: { membershipId }
            });
            // Delete the membership
            await tx.membership.delete({
                where: { id: membershipId }
            });
        });

        res.json({ message: 'Membership request dismissed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
