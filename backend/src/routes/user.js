const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');

// @route   GET api/user/profile
// @desc    Get logged in member's profile and stats
router.get('/profile', auth, async (req, res) => {
    try {
        // Check if the user is a member
        if (req.user.role !== 'member') {
            return res.status(403).json({ message: 'Access denied: Members only' });
        }

        const member = await prisma.member.findUnique({
            where: { userId: req.user.id },
            include: {
                memberships: {
                    where: { status: 'active' },
                    orderBy: { endDate: 'desc' },
                    take: 1,
                    include: { plan: true }
                }
            }
        });

        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }

        const activeMembership = member.memberships[0];

        res.json({
            name: member.name,
            email: member.email,
            phone: member.phone,
            streak: member.streak,
            goalProgress: member.goalProgress,
            membershipStatus: member.status,
            joinedDate: member.joinedDate,
            planName: activeMembership?.plan?.name || null,
            startDate: activeMembership?.startDate || null,
            expiryDate: activeMembership?.endDate || null
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
