# NYC Taxi Trip Explorer

A web application for exploring and analyzing NYC taxi trip data patterns using Node.js, Express.js, and PostgreSQL.

## Features

- Interactive dashboard with trip pattern visualizations
- Filtering by borough, time, duration, and trip type
- Geographic heatmap of pickup locations
- Custom K-means clustering for trip analysis
- Statistical insights and data exploration
- Responsive web interface

## Dataset

This application uses the NYC Taxi Trip Dataset containing:
- 1.4 million trip records from 2016
- Pickup and dropoff coordinates and timestamps
- Trip duration, distance, and passenger data
- Vendor and payment information

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (HTML/CSS/JS) │◄──►│   (Express.js)  │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • Interactive   │    │ • REST API      │    │ • Normalized    │
│   Dashboard     │    │ • Data Cleaning │    │   Schema        │
│ • Visualizations│    │ • Custom        │    │ • Indexing      │
│ • Filtering     │    │   Algorithms    │    │ • Performance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Backend
- Node.js - Runtime environment
- Express.js - Web framework
- PostgreSQL - Database
- pg - PostgreSQL client

### Frontend
- HTML/CSS/JavaScript - User interface
- Plotly.js - Data visualizations
- Leaflet - Interactive maps

### Data Processing
- Custom K-means algorithm for trip clustering
- Geographic analysis for borough detection
- Statistical processing for data cleaning

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd urban-mobility-explorer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Install PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database and User
```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE nyc_taxi_db;
CREATE USER taxi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nyc_taxi_db TO taxi_user;
\q
```

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nyc_taxi_db
DB_USER=taxi_user
DB_PASSWORD=your_password
PORT=3000
```

### 5. Database Schema Setup
```bash
npm run setup-db
```

### 6. Data Import
```bash
npm run import-data
```

**Note**: The data import process may take 10-15 minutes depending on your system performance.

### 7. Start the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
urban-mobility-explorer/
├── public/
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   ├── js/
│   │   └── app.js             # Frontend JavaScript
│   └── index.html             # Main dashboard
├── scripts/
│   ├── setupDatabase.js       # Database schema setup
│   └── importData.js          # Data cleaning and import
├── server.js                  # Express.js server
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## API Endpoints

### Statistics
- `GET /api/stats` - Overall trip statistics and borough data

### Trip Data
- `GET /api/trips` - Filtered trip data with pagination
  - Query parameters: `limit`, `offset`, `borough`, `hour`, `minDuration`, `maxDuration`, `tripType`

### Clustering
- `GET /api/clusters` - Custom K-means clustering results
  - Query parameters: `k` (number of clusters), `limit` (sample size)

### Heatmap
- `GET /api/heatmap` - Geographic heatmap data
  - Query parameters: `hour`, `borough`

## Custom Algorithm Implementation

### K-Means Clustering Algorithm

The application implements a custom K-means clustering algorithm for analyzing trip patterns:

**Features:**
- Manual implementation without external libraries
- Multi-dimensional clustering (latitude, longitude, duration)
- Custom distance calculation
- Convergence detection
- Time complexity: O(n * k * i) where n=points, k=clusters, i=iterations

**Algorithm Steps:**
1. Initialize k centroids randomly
2. Assign each point to nearest centroid
3. Update centroids based on cluster means
4. Repeat until convergence or max iterations

## Key Insights

### 1. Rush Hour Patterns
- Morning rush (7-9 AM) shows higher trip density in business districts
- Evening rush (5-7 PM) exhibits more distributed patterns across boroughs

### 2. Cross-Borough Mobility
- Manhattan serves as the primary hub for cross-borough trips
- Average trip distances vary significantly by borough
- Brooklyn-Queens trips show unique mobility patterns

### 3. Speed Patterns by Location
- Manhattan trips have lower average speeds due to traffic density
- Outer boroughs show higher speeds and longer durations
- Airport trips (JFK/LGA) exhibit distinct speed characteristics

## Data Processing Pipeline

### Data Cleaning
- **Coordinate Validation**: Filter trips outside NYC boundaries
- **Duration Filtering**: Remove trips < 30s or > 3 hours
- **Passenger Validation**: Filter invalid passenger counts
- **Distance Validation**: Remove trips with unrealistic distances

### Feature Engineering
- **Distance Calculation**: Haversine formula for accurate distances
- **Speed Calculation**: Distance/time-based speed computation
- **Borough Detection**: Geographic boundary-based classification
- **Trip Classification**: Within-borough vs cross-borough trips
- **Temporal Features**: Hour, day, month extraction

### Data Quality
- **Outlier Detection**: Statistical methods for anomaly identification
- **Missing Value Handling**: Appropriate imputation strategies
- **Duplicate Removal**: Trip deduplication based on key attributes

## Database Schema

### Trips Table
```sql
CREATE TABLE trips (
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
);
```

### Indexes
- `idx_pickup_datetime` - Time-based queries
- `idx_trip_duration` - Duration filtering
- `idx_pickup_location` - Geographic queries
- `idx_hour_of_day` - Hourly analysis
- `idx_pickup_borough` - Borough filtering

## Performance Optimizations

- **Database Indexing**: Strategic indexes for common query patterns
- **Batch Processing**: Efficient data import with batching
- **Query Optimization**: Optimized SQL queries with proper joins
- **Frontend Caching**: Client-side data caching for better UX
- **Pagination**: Large dataset handling with offset-based pagination

## Testing

### Manual Testing Checklist
- [ ] Database connection and schema creation
- [ ] Data import process completion
- [ ] API endpoint functionality
- [ ] Frontend visualization rendering
- [ ] Filter and search operations
- [ ] Clustering algorithm execution
- [ ] Responsive design on different screen sizes

## Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check PostgreSQL status
brew services list | grep postgresql
# Restart if needed
brew services restart postgresql
```

**Data Import Fails**
```bash
# Check file permissions
ls -la train.csv
# Verify CSV format
head -5 train.csv
```

**Memory Issues During Import**
- Reduce batch size in `importData.js`
- Increase Node.js memory limit: `node --max-old-space-size=4096 scripts/importData.js`

## Performance Metrics

- **Data Processing**: ~1.4M records processed
- **Import Time**: 10-15 minutes (varies by hardware)
- **Query Response**: < 200ms for most operations
- **Memory Usage**: ~500MB during data import
- **Database Size**: ~800MB for processed dataset

## Future Enhancements

- **Real-time Data Streaming**: Live trip data integration
- **Machine Learning**: Predictive trip duration models
- **Advanced Analytics**: Time series analysis and forecasting
- **Mobile App**: Native mobile application
- **API Rate Limiting**: Production-ready API management
- **Caching Layer**: Redis integration for improved performance

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For questions or issues:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

This application is designed for educational and research purposes.
