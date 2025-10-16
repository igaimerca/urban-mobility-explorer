const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
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

// NYC bounds for coordinate validation
const NYC_BOUNDS = {
    minLat: 40.4774,
    maxLat: 40.9176,
    minLon: -74.2591,
    maxLon: -73.7004
};

// Borough boundaries (simplified)
const BOROUGHS = {
    'Manhattan': { minLat: 40.7000, maxLat: 40.8000, minLon: -74.0500, maxLon: -73.9000 },
    'Brooklyn': { minLat: 40.5700, maxLat: 40.7400, minLon: -74.0500, maxLon: -73.8000 },
    'Queens': { minLat: 40.5400, maxLat: 40.8000, minLon: -74.0000, maxLon: -73.7000 },
    'Bronx': { minLat: 40.7800, maxLat: 40.9200, minLon: -73.9500, maxLon: -73.7500 },
    'Staten Island': { minLat: 40.5000, maxLat: 40.6500, minLon: -74.3000, maxLon: -74.0000 }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function getBorough(lat, lon) {
    for (const [borough, bounds] of Object.entries(BOROUGHS)) {
        if (lat >= bounds.minLat && lat <= bounds.maxLat &&
            lon >= bounds.minLon && lon <= bounds.maxLon) {
            return borough;
        }
    }
    return 'Unknown';
}

function isValidCoordinate(lat, lon) {
    return lat !== 0 && lon !== 0 &&
           lat >= NYC_BOUNDS.minLat && lat <= NYC_BOUNDS.maxLat &&
           lon >= NYC_BOUNDS.minLon && lon <= NYC_BOUNDS.maxLon;
}

function isValidTrip(record) {
    const pickupLat = parseFloat(record.pickup_latitude);
    const pickupLon = parseFloat(record.pickup_longitude);
    const dropoffLat = parseFloat(record.dropoff_latitude);
    const dropoffLon = parseFloat(record.dropoff_longitude);
    const duration = parseInt(record.trip_duration);
    const passengers = parseInt(record.passenger_count);
    
    // Basic validation
    if (!isValidCoordinate(pickupLat, pickupLon) || 
        !isValidCoordinate(dropoffLat, dropoffLon)) {
        return false;
    }
    
    // Duration validation (between 30 seconds and 3 hours)
    if (duration < 30 || duration > 10800) {
        return false;
    }
    
    // Passenger count validation
    if (passengers < 1 || passengers > 6) {
        return false;
    }
    
    // Distance validation (minimum 0.1km, maximum 100km)
    const distance = calculateDistance(pickupLat, pickupLon, dropoffLat, dropoffLon);
    if (distance < 0.1 || distance > 100) {
        return false;
    }
    
    return true;
}

function enrichTripData(record) {
    const pickupLat = parseFloat(record.pickup_latitude);
    const pickupLon = parseFloat(record.pickup_longitude);
    const dropoffLat = parseFloat(record.dropoff_latitude);
    const dropoffLon = parseFloat(record.dropoff_longitude);
    const duration = parseInt(record.trip_duration);
    
    const distance = calculateDistance(pickupLat, pickupLon, dropoffLat, dropoffLon);
    const speed = distance / (duration / 3600); // km/h
    
    const pickupDatetime = new Date(record.pickup_datetime);
    const hourOfDay = pickupDatetime.getHours();
    const dayOfWeek = pickupDatetime.getDay();
    const month = pickupDatetime.getMonth() + 1;
    
    const pickupBorough = getBorough(pickupLat, pickupLon);
    const dropoffBorough = getBorough(dropoffLat, dropoffLon);
    
    // Determine trip type based on boroughs
    let tripType = 'Within Borough';
    if (pickupBorough !== dropoffBorough && pickupBorough !== 'Unknown' && dropoffBorough !== 'Unknown') {
        tripType = 'Cross Borough';
    }
    
    return {
        ...record,
        distance_km: distance.toFixed(3),
        speed_kmh: speed.toFixed(2),
        fare_per_km: (parseFloat(record.trip_duration) / distance).toFixed(2),
        hour_of_day: hourOfDay,
        day_of_week: dayOfWeek,
        month: month,
        pickup_borough: pickupBorough,
        dropoff_borough: dropoffBorough,
        trip_type: tripType
    };
}

async function importData() {
    try {
        console.log('Starting data import...');
        
        const client = await pool.connect();
        
        let processedCount = 0;
        let validCount = 0;
        let invalidCount = 0;
        const batchSize = 500; // Reduced batch size
        let batch = [];
        let isProcessing = false;
        
        const stream = fs.createReadStream('train.csv')
            .pipe(csv())
            .on('data', async (record) => {
                if (isProcessing) return; // Prevent overlapping processing
                isProcessing = true;
                
                processedCount++;
                
                if (processedCount % 5000 === 0) {
                    console.log(`Processed ${processedCount} records...`);
                }
                
                if (isValidTrip(record)) {
                    const enrichedRecord = enrichTripData(record);
                    batch.push(enrichedRecord);
                    validCount++;
                    
                    if (batch.length >= batchSize) {
                        await insertBatch(client, batch);
                        batch = [];
                        // Force garbage collection hint
                        if (global.gc) global.gc();
                    }
                } else {
                    invalidCount++;
                }
                
                isProcessing = false;
            })
            .on('end', async () => {
                if (batch.length > 0) {
                    await insertBatch(client, batch);
                }
                
                console.log(`\nImport completed!`);
                console.log(`Total processed: ${processedCount}`);
                console.log(`Valid records: ${validCount}`);
                console.log(`Invalid records: ${invalidCount}`);
                
                client.release();
                await pool.end();
            });
            
    } catch (error) {
        console.error('Error importing data:', error);
    }
}

async function insertBatch(client, batch) {
    const values = batch.map(record => 
        `('${record.id}', ${record.vendor_id}, '${record.pickup_datetime}', '${record.dropoff_datetime}', 
         ${record.passenger_count}, ${record.pickup_longitude}, ${record.pickup_latitude}, 
         ${record.dropoff_longitude}, ${record.dropoff_latitude}, '${record.store_and_fwd_flag}', 
         ${record.trip_duration}, ${record.distance_km}, ${record.speed_kmh}, ${record.fare_per_km}, 
         ${record.hour_of_day}, ${record.day_of_week}, ${record.month}, 
         '${record.pickup_borough}', '${record.dropoff_borough}', '${record.trip_type}')`
    ).join(',');
    
    const query = `
        INSERT INTO trips (id, vendor_id, pickup_datetime, dropoff_datetime, passenger_count,
                          pickup_longitude, pickup_latitude, dropoff_longitude, dropoff_latitude,
                          store_and_fwd_flag, trip_duration, distance_km, speed_kmh, fare_per_km,
                          hour_of_day, day_of_week, month, pickup_borough, dropoff_borough, trip_type)
        VALUES ${values}
        ON CONFLICT (id) DO NOTHING
    `;
    
    await client.query(query);
}

if (require.main === module) {
    importData();
}

module.exports = { importData, enrichTripData, isValidTrip };
