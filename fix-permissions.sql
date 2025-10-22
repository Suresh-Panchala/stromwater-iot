-- Fix permissions for stromwater_user
\c stromwater_db

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;

-- Grant all privileges on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stromwater_user;

-- Grant all privileges on all sequences (for auto-increment IDs)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stromwater_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stromwater_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO stromwater_user;

-- Change ownership of all tables to stromwater_user
ALTER TABLE users OWNER TO stromwater_user;
ALTER TABLE devices OWNER TO stromwater_user;
ALTER TABLE device_data OWNER TO stromwater_user;
ALTER TABLE alerts OWNER TO stromwater_user;
ALTER TABLE refresh_tokens OWNER TO stromwater_user;

-- Verify permissions
SELECT 'Permissions fixed successfully!' as status;
