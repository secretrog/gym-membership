const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

// Haversine formula: calculate distance between two GPS points in meters
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// @route   POST api/checkin/generate-qr
// @desc    Admin generates today's QR code
router.post('/generate-qr', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Gym location (latitude, longitude) is required' });
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Check if QR already exists for today
        const existing = await prisma.dailyQR.findUnique({ where: { date: today } });
        if (existing) {
            return res.json({
                token: existing.token,
                qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(existing.token)}`,
                message: 'QR code already generated for today'
            });
        }

        // Generate unique token
        const token = `IRONPULSE-${today.toISOString().split('T')[0]}-${crypto.randomBytes(8).toString('hex')}`;

        const dailyQR = await prisma.dailyQR.create({
            data: {
                token,
                date: today,
                gymLat: latitude,
                gymLng: longitude,
                radius: 200
            }
        });

        res.json({
            token: dailyQR.token,
            qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dailyQR.token)}`,
            message: 'QR code generated successfully'
        });
    } catch (err) {
        console.error('Generate QR Error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/checkin/today-qr
// @desc    Admin gets today's QR (if already generated)
router.get('/today-qr', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const existing = await prisma.dailyQR.findUnique({ where: { date: today } });
        if (!existing) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            token: existing.token,
            qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(existing.token)}`
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/checkin/scan
// @desc    User scans QR code to check in (with geolocation validation)
router.post('/scan', auth, async (req, res) => {
    try {
        const { token, latitude, longitude } = req.body;
        const userId = req.user.id;

        if (!token) {
            return res.status(400).json({ message: 'QR code token is required' });
        }

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Location access is required to check in' });
        }

        // 1. Validate QR token
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const dailyQR = await prisma.dailyQR.findUnique({ where: { date: today } });

        if (!dailyQR || dailyQR.token !== token) {
            return res.status(400).json({ message: 'Invalid or expired QR code. Please scan today\'s QR at the gym.' });
        }

        // 2. Validate geolocation
        const distance = haversineDistance(latitude, longitude, dailyQR.gymLat, dailyQR.gymLng);

        if (distance > dailyQR.radius) {
            return res.status(403).json({
                message: `You are not at the gym. You are ${Math.round(distance)}m away. Please be within ${Math.round(dailyQR.radius)}m to check in.`
            });
        }

        // 3. Get member
        const member = await prisma.member.findUnique({
            where: { userId },
            include: {
                memberships: {
                    where: { status: 'active' },
                    take: 1
                }
            }
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        if (member.status === 'blocked') {
            return res.status(403).json({ message: 'Your account is blocked. Please contact admin.' });
        }

        if (member.memberships.length === 0) {
            return res.status(403).json({ message: 'No active membership found' });
        }

        // 4. Check daily limit
        if (member.lastScanDate) {
            const lastScan = new Date(member.lastScanDate);
            const lastScanDay = new Date(lastScan.getFullYear(), lastScan.getMonth(), lastScan.getDate());

            if (lastScanDay.getTime() === today.getTime()) {
                return res.status(400).json({ message: 'You have already checked in today!' });
            }
        }

        // 5. Create check-in
        const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);

        await prisma.$transaction(async (tx) => {
            await tx.attendance.create({
                data: {
                    memberId: member.id,
                    checkIn: now,
                    expiresAt,
                    isActive: true,
                    date: today
                }
            });

            await tx.member.update({
                where: { id: member.id },
                data: {
                    streak: { increment: 1 },
                    lastScanDate: now
                }
            });
        });

        res.json({ message: 'Check-in successful! Welcome to Iron Pulse 💪', expiresAt, streak: member.streak + 1 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/checkin/verify/:identifier
// @desc    Admin verifies member status (Admin only)
router.get('/verify/:identifier', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const { identifier } = req.params;

        // Enhanced search: Email, Phone, Name, or UUID
        const member = await prisma.member.findFirst({
            where: {
                OR: [
                    { email: { contains: identifier } },
                    { phone: { contains: identifier } },
                    { name: { contains: identifier } },
                    { id: identifier }, // Exact UUID match
                    { user: { email: { contains: identifier } } }
                ]
            },
            include: {
                user: true,
                memberships: {
                    include: { plan: true },
                    orderBy: { createdAt: 'desc' }
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                attendance: {
                    where: { isActive: true },
                    orderBy: { checkIn: 'desc' },
                    take: 1
                }
            }
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Check if current check-in is expired (manual cleanup on read)
        if (member.attendance.length > 0) {
            const active = member.attendance[0];
            if (active.expiresAt && new Date() > new Date(active.expiresAt)) {
                await prisma.attendance.update({
                    where: { id: active.id },
                    data: { isActive: false }
                });
                member.attendance = []; // Mark as no longer active in response
            }
        }

        res.json(member);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/checkin/recent
// @desc    Get 10 most recent successful check-ins (Admin only)
router.get('/recent', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const attendance = await prisma.attendance.findMany({
            take: 10,
            orderBy: { checkIn: 'desc' },
            include: {
                member: {
                    select: {
                        id: true,
                        name: true,
                        photoUrl: true
                    }
                }
            }
        });

        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/checkin/block/:id
// @desc    Admin blocks a member (Admin only)
router.put('/block/:id', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        await prisma.member.update({
            where: { id: req.params.id },
            data: { status: 'blocked' }
        });
        res.json({ message: 'Member blocked' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/checkin/unblock/:id
// @desc    Admin unblocks a member (Admin only)
router.put('/unblock/:id', auth, async (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        await prisma.member.update({
            where: { id: req.params.id },
            data: { status: 'active' }
        });
        res.json({ message: 'Member unblocked' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
