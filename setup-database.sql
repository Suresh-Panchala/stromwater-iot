-- StromWater Database Setup
-- Run this with: psql -U postgres -f setup-database.sql

-- Create database
CREATE DATABASE stromwater_db;

-- Create user
CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;

-- Change owner
ALTER DATABASE stromwater_db OWNER TO stromwater_user;

-- Display success message
\echo 'Database setup complete!'
\echo 'Database: stromwater_db'
\echo 'User: stromwater_user'
\echo 'Password: stromwater123'
