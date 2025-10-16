const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'nyc_taxi_db',
    password: '123456',
    port: 5432,
});

async function createDatabaseDump() {
    try {
        console.log('Creating database dump...');
        
        // Get table schema
        const schemaQuery = `
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'trips'
            ORDER BY ordinal_position;
        `;
        
        const schemaResult = await pool.query(schemaQuery);
        
        // Get table data (sample)
        const dataQuery = `
            SELECT * FROM trips 
            ORDER BY id 
            LIMIT 1000;
        `;
        
        const dataResult = await pool.query(dataQuery);
        
        // Get table statistics
        const statsQuery = `
            SELECT 
                COUNT(*) as total_trips,
                COUNT(DISTINCT pickup_borough) as boroughs,
                MIN(pickup_datetime) as earliest_trip,
                MAX(pickup_datetime) as latest_trip,
                AVG(trip_duration) as avg_duration,
                AVG(distance_km) as avg_distance
            FROM trips;
        `;
        
        const statsResult = await pool.query(statsQuery);
        
        // Create dump content
        let dumpContent = `-- NYC Taxi Trip Explorer Database Dump
-- Generated: ${new Date().toISOString()}
-- Database: nyc_taxi_db

-- Table Schema
CREATE TABLE trips (
`;

        // Add column definitions
        schemaResult.rows.forEach((row, index) => {
            let columnDef = `    ${row.column_name} ${row.data_type}`;
            
            if (row.data_type === 'character varying') {
                columnDef += '(255)';
            } else if (row.data_type === 'numeric') {
                columnDef += '(10,7)';
            }
            
            if (row.is_nullable === 'NO') {
                columnDef += ' NOT NULL';
            }
            
            if (row.column_default) {
                columnDef += ` DEFAULT ${row.column_default}`;
            }
            
            if (index < schemaResult.rows.length - 1) {
                columnDef += ',';
            }
            
            dumpContent += columnDef + '\n';
        });
        
        dumpContent += `);

-- Indexes
CREATE INDEX idx_trips_pickup_borough ON trips(pickup_borough);
CREATE INDEX idx_trips_hour_of_day ON trips(hour_of_day);
CREATE INDEX idx_trips_trip_duration ON trips(trip_duration);
CREATE INDEX idx_trips_pickup_coords ON trips(pickup_latitude, pickup_longitude);
CREATE INDEX idx_trips_datetime ON trips(pickup_datetime);
CREATE INDEX idx_trips_trip_type ON trips(trip_type);

-- Sample Data (1000 records)
`;

        // Add sample data
        dataResult.rows.forEach((row, index) => {
            const values = Object.values(row).map(val => {
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                return val;
            }).join(', ');
            
            if (index === 0) {
                dumpContent += `INSERT INTO trips VALUES\n`;
            }
            
            dumpContent += `(${values})`;
            
            if (index < dataResult.rows.length - 1) {
                dumpContent += ',\n';
            } else {
                dumpContent += ';\n';
            }
        });
        
        // Add statistics
        const stats = statsResult.rows[0];
        dumpContent += `
-- Database Statistics
-- Total trips: ${stats.total_trips.toLocaleString()}
-- Boroughs: ${stats.boroughs}
-- Date range: ${stats.earliest_trip} to ${stats.latest_trip}
-- Average duration: ${Math.round(stats.avg_duration)} seconds
-- Average distance: ${parseFloat(stats.avg_distance).toFixed(2)} km

-- End of dump
`;

        // Write to file
        fs.writeFileSync('database_dump.sql', dumpContent);
        
        console.log('Database dump created successfully!');
        console.log(`- Schema: ${schemaResult.rows.length} columns`);
        console.log(`- Sample data: ${dataResult.rows.length} records`);
        console.log(`- Total trips in database: ${stats.total_trips.toLocaleString()}`);
        
    } catch (error) {
        console.error('Error creating database dump:', error);
    } finally {
        await pool.end();
    }
}

createDatabaseDump();
