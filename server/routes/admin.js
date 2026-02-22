const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Get all bookings (Admin)
router.get('/bookings', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, r.type as room_type, h.name as hotel_name, u.name as user_name_full
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN hotels h ON r.hotel_id = h.id
      LEFT JOIN users u ON b.email = u.email
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update booking status (Admin)
router.put('/bookings/:id/status', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new hotel (Admin)
router.post('/hotels', verifyAdmin, async (req, res) => {
  const { name, location, description, rating, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO hotels (name, location, description, rating, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, location, description, rating || 0, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a hotel (Admin)
router.delete('/hotels/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // First delete associated rooms
    await pool.query('DELETE FROM rooms WHERE hotel_id = $1', [id]);
    // Then delete hotel
    const result = await pool.query('DELETE FROM hotels WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    res.json({ message: 'Hotel deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a room to a hotel (Admin)
router.post('/rooms', verifyAdmin, async (req, res) => {
  const { hotel_id, type, price, capacity, amenities } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO rooms (hotel_id, type, price, capacity, amenities) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [hotel_id, type, price, capacity, amenities]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard stats (Admin)
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const hotelsCount = await pool.query('SELECT COUNT(*) FROM hotels');
    const bookingsCount = await pool.query('SELECT COUNT(*) FROM bookings');
    const revenue = await pool.query("SELECT SUM(total_price) FROM bookings WHERE status != 'cancelled'");
    
    res.json({
      users: parseInt(usersCount.rows[0].count),
      hotels: parseInt(hotelsCount.rows[0].count),
      bookings: parseInt(bookingsCount.rows[0].count),
      revenue: parseFloat(revenue.rows[0].sum || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
