const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');

// @route   POST /api/bookings
// @desc    Members only - Book a class spot
router.post('/', auth, async (req, res) => {
    try {
        const { className, classTime, instructor, difficulty } = req.body;

        if (!className) {
            return res.status(400).json({ message: 'Class name is required' });
        }

        // Get member details from authenticated user
        const member = await prisma.member.findFirst({
            where: { userId: req.user.id }
        });

        if (!member) {
            return res.status(403).json({ message: 'Only gym members can book classes. Please sign up for a membership first.' });
        }

        const booking = await prisma.classBooking.create({
            data: {
                className,
                classTime: classTime || '',
                instructor: instructor || '',
                difficulty: difficulty || '',
                bookerName: member.name,
                bookerEmail: member.email || null,
                bookerPhone: member.phone
            }
        });

        res.json({ message: 'Class booked successfully! The gym will confirm your spot.', booking });
    } catch (err) {
        console.error('Booking Error:', err.message);
        res.status(500).json({ message: 'Server error while booking class' });
    }
});

// @route   GET /api/bookings/my
// @desc    Members - Get own bookings
router.get('/my', auth, async (req, res) => {
    try {
        const member = await prisma.member.findFirst({
            where: { userId: req.user.id }
        });

        if (!member) {
            return res.status(403).json({ message: 'Member not found' });
        }

        const bookings = await prisma.classBooking.findMany({
            where: {
                OR: [
                    { bookerEmail: member.email },
                    { bookerName: member.name }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(bookings);
    } catch (err) {
        console.error('My Bookings Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/bookings
// @desc    Admin - Get all class bookings (recent first)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const bookings = await prisma.classBooking.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/bookings/:id
// @desc    Admin - Dismiss a booking
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        await prisma.classBooking.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Booking dismissed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
