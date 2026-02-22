const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

console.log('API DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all hotels (with optional search and filtering)
router.get('/hotels', async (req, res) => {
  try {
    const { location, minPrice, maxPrice } = req.query;
    let query = 'SELECT * FROM hotels WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (minPrice || maxPrice) {
      query = `
        SELECT DISTINCT h.* 
        FROM hotels h
        JOIN rooms r ON h.id = r.hotel_id
        WHERE 1=1
      `;
    }

    if (location) {
      query += ` AND ${minPrice || maxPrice ? 'h.' : ''}location ILIKE $${paramIndex}`;
      values.push(`%${location}%`);
      paramIndex++;
    }

    if (minPrice) {
      query += ` AND r.price >= $${paramIndex}`;
      values.push(minPrice);
      paramIndex++;
    }
    if (maxPrice) {
      query += ` AND r.price <= $${paramIndex}`;
      values.push(maxPrice);
      paramIndex++;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get hotel details with rooms
router.get('/hotels/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const hotel = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
    const rooms = await pool.query('SELECT * FROM rooms WHERE hotel_id = $1', [id]);
    
    if (hotel.rows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    res.json({ ...hotel.rows[0], rooms: rooms.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create booking
router.post('/bookings', async (req, res) => {
  const { user_name, email, room_id, check_in, check_out, total_price } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO bookings (user_name, email, room_id, check_in, check_out, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_name, email, room_id, check_in, check_out, total_price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user bookings
router.get('/bookings/user/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query(`
      SELECT b.*, r.type as room_type, h.name as hotel_name, h.location as hotel_location, h.image_url as hotel_image
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN hotels h ON r.hotel_id = h.id
      WHERE b.email = $1
      ORDER BY b.check_in DESC
    `, [email]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel a booking
router.delete('/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', ['cancelled', id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking cancelled successfully', booking: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check room availability
router.get('/rooms/:id/availability', async (req, res) => {
  const { id } = req.params;
  const { check_in, check_out } = req.query;
  
  if (!check_in || !check_out) {
    return res.status(400).json({ error: 'check_in and check_out dates are required' });
  }

  try {
    // Check if there are any overlapping bookings
    const result = await pool.query(`
      SELECT * FROM bookings 
      WHERE room_id = $1 
      AND status != 'cancelled'
      AND (
        (check_in <= $2 AND check_out >= $2) OR
        (check_in <= $3 AND check_out >= $3) OR
        (check_in >= $2 AND check_out <= $3)
      )
    `, [id, check_in, check_out]);

    if (result.rows.length > 0) {
      res.json({ available: false, message: 'Room is not available for these dates' });
    } else {
      res.json({ available: true, message: 'Room is available' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile
router.get('/users/profile/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put('/users/profile/:email', async (req, res) => {
  const { email } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1 WHERE email = $2 RETURNING id, name, email',
      [name, email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
