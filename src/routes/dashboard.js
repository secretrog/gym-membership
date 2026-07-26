const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth, authorize } = require('../middleware/auth');

// @route   GET api/dashboard/stats
// @desc    Get dashboard metrics
router.get('/stats', auth, authorize(['owner', 'staff']), async (req, res) => {
    try {
        const totalMembers = await prisma.member.count();
        const activeMembers = await prisma.member.count({ where: { status: 'active' } });
        const expiredMembers = await prisma.member.count({ where: { status: 'expired' } });

        // Simple revenue aggregation (example: Sum of all 'paid' payments this month)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const revenueThisMonth = await prisma.payment.aggregate({
            where: {
                status: 'paid',
                paymentDate: { gte: firstDayOfMonth }
            },
            _sum: { amount: true }
        });

        const pendingPaymentsCount = await prisma.payment.count({
            where: { status: { in: ['pending', 'overdue'] } }
        });

        const checkInsToday = await prisma.attendance.count({
            where: {
                date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }
        });

        const classBookings = await prisma.classBooking.count({
            where: { status: 'pending' }
        });

        res.json({
            activeMembers,
            expiredMembers,
            expiringIn7Days: 0, // Placeholder for complex logic
            revenueThisMonth: revenueThisMonth._sum.amount || 0,
            pendingPayments: pendingPaymentsCount,
            totalPendingAmount: 0, // Placeholder
            checkInsToday,
            classBookings
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
