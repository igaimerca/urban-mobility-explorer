const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nyc_taxi_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456'
};

const pool = new Pool(dbConfig);

async function setupDatabase() {
    try {
        console.log('Setting up NYC Taxi Database...');
        
        // Create database if it doesn't exist
        const adminPool = new Pool({
            host: dbConfig.host,
            port: dbConfig.port,
            database: 'postgres',
            user: dbConfig.user,
            password: dbConfig.password
        });
        
        await adminPool.query(`CREATE DATABASE ${dbConfig.database}`);
        console.log(`Database ${dbConfig.database} created successfully`);
        await adminPool.end();
        
        // Connect to the new database
        const client = await pool.connect();
        
        // Create trips table
        await client.query(`
            CREATE TABLE IF NOT EXISTS trips (
                id VARCHAR(50) PRIMARY KEY,
                vendor_id INTEGER,
                pickup_datetime TIMESTAMP,
                dropoff_datetime TIMESTAMP,
                passenger_count INTEGER,
                pickup_longitude DECIMAL(10, 7),
                pickup_latitude DECIMAL(10, 7),
                dropoff_longitude DECIMAL(10, 7),
                dropoff_latitude DECIMAL(10, 7),
                store_and_fwd_flag CHAR(1),
                trip_duration INTEGER,
                distance_km DECIMAL(8, 3),
                speed_kmh DECIMAL(8, 2),
                fare_per_km DECIMAL(8, 2),
                hour_of_day INTEGER,
                day_of_week INTEGER,
                month INTEGER,
                pickup_borough VARCHAR(50),
                dropoff_borough VARCHAR(50),
                trip_type VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create indexes for better query performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_pickup_datetime ON trips(pickup_datetime);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_trip_duration ON trips(trip_duration);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_pickup_location ON trips(pickup_latitude, pickup_longitude);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_dropoff_location ON trips(dropoff_latitude, dropoff_longitude);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_hour_of_day ON trips(hour_of_day);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_day_of_week ON trips(day_of_week);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_month ON trips(month);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_pickup_borough ON trips(pickup_borough);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_dropoff_borough ON trips(dropoff_borough);
        `);
        
        console.log('Database schema created successfully');
        
        client.release();
        await pool.end();
        
    } catch (error) {
        console.error('Error setting up database:', error.message);
        if (error.code === '42P04') {
            console.log('Database already exists, continuing...');
        }
    }
}

if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase, pool };
