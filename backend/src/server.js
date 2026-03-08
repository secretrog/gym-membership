require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const prisma = require('./lib/prisma');

const path = require('path');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, '../../site/public')));

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/user', require('./routes/user'));
app.use('/api/memberships', require('./routes/memberships'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/public-memberships', require('./routes/public-memberships'));

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
