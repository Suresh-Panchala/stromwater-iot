-- StromWater IoT Platform - Database Creation
-- Run with: psql -U postgres -f setup-database.sql

-- Check if database exists and create if not
SELECT 'Creating database...' as status;

-- Note: You may need to run this manually:
-- CREATE DATABASE stromwater_db;

-- Then connect and run the rest:
-- \c stromwater_db

SELECT 'Database setup complete. Now run: node backend/src/scripts/initDatabase.js' as next_step;
