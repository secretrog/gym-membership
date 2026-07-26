const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');

// @route   GET api/members
// @desc    Get all members
router.get('/', auth, async (req, res) => {
    try {
        const { status, search } = req.query;

        const where = {};
        if (status && status !== 'all') {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { phone: { contains: search } },
                { email: { contains: search } }
            ];
        }

        const members = await prisma.member.findMany({
            where,
            include: {
                memberships: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(members);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

const bcrypt = require('bcryptjs');

// @route   POST api/members
// @desc    Create a member (and linked user account)
router.post('/', auth, async (req, res) => {
    try {
        const { name, phone, email, ...otherData } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and Phone are required' });
        }

        // 1. Generate a user account for the member
        // Use last 6 digits of phone as the initial password/access code
        const password = phone.replace(/[^0-9]/g, '').slice(-6) || 'gym123';
        const passwordHash = await bcrypt.hash(password, 10);

        // Check if phone already exists in Member table
        const existingMember = await prisma.member.findUnique({ where: { phone } });
        if (existingMember) {
            return res.status(400).json({ message: 'A member with this phone number already exists' });
        }

        const userEmail = email || `${phone.replace(/\+/g, '')}@ironpulse.com`;

        // Check if email already exists in User table
        const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
        if (existingUser) {
            return res.status(400).json({ message: 'A user with this email/phone already exists' });
        }

        // Use a transaction to ensure both are created or none
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    name,
                    email: userEmail,
                    passwordHash,
                    role: 'member'
                }
            });

            // Create member linked to user
            const member = await tx.member.create({
                data: {
                    name,
                    phone,
                    email,
                    userId: user.id,
                    ...otherData
                }
            });

            return { member, accessCode: password };
        });

        res.json(result);
    } catch (err) {
        console.error('Create Member Error:', err);
        if (err.code === 'P2002') {
            const field = err.meta?.target || 'field';
            return res.status(400).json({ message: `Duplicate value for ${field}` });
        }
        res.status(500).json({ message: 'Server error while creating member' });
    }
});

// @route   GET api/members/:id
// @desc    Get member by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const member = await prisma.member.findUnique({
            where: { id: req.params.id },
            include: {
                memberships: true,
                payments: true,
                attendance: true
            }
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json(member);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/members/:id
// @desc    Update a member
router.put('/:id', auth, async (req, res) => {
    try {
        const updatedMember = await prisma.member.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(updatedMember);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/members/:id
// @desc    Delete a member and their linked user account
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const member = await prisma.member.findUnique({
            where: { id: req.params.id },
            include: { memberships: true }
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        await prisma.$transaction(async (tx) => {
            // Delete attendance records
            await tx.attendance.deleteMany({ where: { memberId: member.id } });

            // Delete payments for each membership
            for (const ms of member.memberships) {
                await tx.payment.deleteMany({ where: { membershipId: ms.id } });
            }

            // Delete payments linked to member directly
            await tx.payment.deleteMany({ where: { memberId: member.id } });

            // Delete memberships
            await tx.membership.deleteMany({ where: { memberId: member.id } });

            // Delete class bookings by this member
            await tx.classBooking.deleteMany({
                where: {
                    OR: [
                        { bookerEmail: member.email },
                        { bookerName: member.name }
                    ]
                }
            });

            // Delete member
            await tx.member.delete({ where: { id: member.id } });

            // Delete linked user account
            if (member.userId) {
                await tx.user.delete({ where: { id: member.userId } });
            }
        });

        res.json({ message: 'Member deleted successfully' });
    } catch (err) {
        console.error('Delete Member Error:', err.message);
        res.status(500).json({ message: 'Server error while deleting member' });
    }
});

module.exports = router;
