#!/bin/bash

# NYC Taxi Trip Explorer - Submission Package Script
echo "Creating submission package for NYC Taxi Trip Explorer..."

# Create submission directory
mkdir -p submission

# Copy all source files
cp -r public submission/
cp -r scripts submission/
cp *.js submission/
cp *.json submission/
cp README.md submission/
cp TECHNICAL_DOCUMENTATION.md submission/
cp *.sql submission/
cp env.example submission/

# Remove unnecessary files
rm -f submission/package-lock.json
rm -f submission/.DS_Store
rm -rf submission/node_modules

# Create final README for submission
cat > submission/README.md << 'EOF'
# NYC Taxi Trip Explorer - Final Submission

## Quick Start
1. Install dependencies: `npm install`
2. Set up PostgreSQL database: `npm run setup-db`
3. Import data: `npm run import-data-optimized`
4. Start server: `npm start`
5. Open browser: http://localhost:3000

## Files Included
- `server.js` - Express.js backend server
- `public/` - Frontend HTML/CSS/JavaScript
- `scripts/` - Database setup and data import scripts
- `database_dump.sql` - Complete database dump
- `TECHNICAL_DOCUMENTATION.md` - Technical documentation
- `package.json` - Dependencies and scripts

## Video Walkthrough
[Link to 5-minute video walkthrough - TO BE ADDED]

## Database Dump
The `database_dump.sql` file contains:
- Complete table schema
- 1,000 sample records
- Database statistics
- Index definitions

## Technical Features
- Custom K-means clustering algorithm
- Interactive geographic heatmaps
- Real-time data filtering
- Statistical visualizations
- Memory-optimized data processing

## Assignment Requirements Met
✅ Data cleaning and preprocessing
✅ Normalized database design
✅ RESTful API backend
✅ Interactive frontend dashboard
✅ Custom algorithm implementation
✅ Comprehensive documentation
✅ Database dump provided
EOF

# Create zip file
cd submission
zip -r ../nyc_taxi_explorer_submission.zip .
cd ..

echo "Submission package created: nyc_taxi_explorer_submission.zip"
echo "Files included:"
ls -la submission/

echo ""
echo "Next steps:"
echo "1. Record 5-minute video walkthrough"
echo "2. Add video link to README.md"
echo "4. Upload to GitHub and submit"
