const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTables = async () => {
  try {
    // Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add role column if it doesn't exist (for existing databases)
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
    `);

    // Hotels Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hotels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT,
        rating DECIMAL(2, 1) DEFAULT 0,
        image_url VARCHAR(500)
      );
    `);

    // Add image_url column if it doesn't exist
    await pool.query(`
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
    `);

    // Rooms Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER REFERENCES hotels(id),
        type VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        capacity INTEGER NOT NULL,
        amenities TEXT[],
        available BOOLEAN DEFAULT true,
        image_url VARCHAR(500)
      );
    `);

    // Add image_url column if it doesn't exist
    await pool.query(`
      ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
    `);

    // Bookings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        room_id INTEGER REFERENCES rooms(id),
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables', err);
  }
};

const seedData = async () => {
  try {
    // Check if data exists
    const check = await pool.query('SELECT count(*) FROM hotels');
    if (parseInt(check.rows[0].count) > 0) {
      // Update existing hotels with default images if they don't have one
      await pool.query(`
        UPDATE hotels SET image_url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' WHERE name = 'Grand Luxury Hotel' AND image_url IS NULL;
        UPDATE hotels SET image_url = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80' WHERE name = 'Oceanview Resort' AND image_url IS NULL;
        UPDATE hotels SET image_url = 'https://images.unsplash.com/photo-1518602164578-cd0074062767?auto=format&fit=crop&w=800&q=80' WHERE name = 'Mountain Retreat' AND image_url IS NULL;
        UPDATE hotels SET image_url = 'https://images.unsplash.com/photo-1551882547-ff40c0d5bf8f?auto=format&fit=crop&w=800&q=80' WHERE name = 'City Center Inn' AND image_url IS NULL;
        UPDATE hotels SET image_url = 'https://images.unsplash.com/photo-1582719478250-c894082909ce?auto=format&fit=crop&w=800&q=80' WHERE name = 'Desert Oasis' AND image_url IS NULL;
        UPDATE hotels SET image_url = 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80' WHERE name = 'Lakeside Lodge' AND image_url IS NULL;
      `);
      return;
    }

    // Insert Hotels
    const hotelRes = await pool.query(`
      INSERT INTO hotels (name, location, description, rating, image_url)
      VALUES 
      ('Grand Luxury Hotel', 'New York, NY', 'A premium experience in the heart of the city.', 4.8, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'),
      ('Oceanview Resort', 'Miami, FL', 'Relax by the beach with stunning ocean views.', 4.5, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'),
      ('Mountain Retreat', 'Denver, CO', 'Cozy cabins nestled in the snowy peaks.', 4.7, 'https://images.unsplash.com/photo-1518602164578-cd0074062767?auto=format&fit=crop&w=800&q=80'),
      ('City Center Inn', 'Chicago, IL', 'Affordable and convenient stay downtown.', 3.9, 'https://images.unsplash.com/photo-1551882547-ff40c0d5bf8f?auto=format&fit=crop&w=800&q=80'),
      ('Desert Oasis', 'Phoenix, AZ', 'Luxury spa and resort in the beautiful desert.', 4.6, 'https://images.unsplash.com/photo-1582719478250-c894082909ce?auto=format&fit=crop&w=800&q=80'),
      ('Lakeside Lodge', 'Seattle, WA', 'Peaceful getaway right on the water.', 4.4, 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80')
      RETURNING id;
    `);
    
    const hotelIds = hotelRes.rows.map(row => row.id);

    // Insert Rooms
    await pool.query(`
      INSERT INTO rooms (hotel_id, type, price, capacity, amenities)
      VALUES 
      ($1, 'Deluxe Room', 200.00, 2, ARRAY['WiFi', 'TV', 'Mini Bar']),
      ($1, 'Executive Suite', 450.00, 4, ARRAY['WiFi', 'TV', 'Mini Bar', 'Jacuzzi', 'Ocean View']),
      ($2, 'Standard Room', 150.00, 2, ARRAY['WiFi', 'TV', 'Balcony']),
      ($2, 'Oceanfront Suite', 350.00, 4, ARRAY['WiFi', 'TV', 'Kitchenette', 'Ocean View']),
      ($3, 'Cozy Cabin', 180.00, 2, ARRAY['Fireplace', 'Kitchen', 'WiFi']),
      ($3, 'Family Lodge', 400.00, 6, ARRAY['Fireplace', 'Kitchen', 'WiFi', 'Hot Tub']),
      ($4, 'Single Room', 90.00, 1, ARRAY['WiFi', 'TV']),
      ($4, 'Double Room', 120.00, 2, ARRAY['WiFi', 'TV']),
      ($5, 'Spa Suite', 300.00, 2, ARRAY['WiFi', 'TV', 'Private Spa', 'Mini Bar']),
      ($5, 'Desert Villa', 600.00, 6, ARRAY['WiFi', 'TV', 'Private Pool', 'Kitchen']),
      ($6, 'Lakeview Room', 160.00, 2, ARRAY['WiFi', 'TV', 'Lake View']),
      ($6, 'Lakeside Cabin', 280.00, 4, ARRAY['WiFi', 'TV', 'Kitchen', 'Boat Dock']);
    `, [hotelIds[0], hotelIds[1], hotelIds[2], hotelIds[3], hotelIds[4], hotelIds[5]]);

    console.log('Seed data inserted');
  } catch (err) {
    console.error('Error seeding data', err);
  } finally {
    pool.end();
  }
};

createTables().then(() => seedData());
