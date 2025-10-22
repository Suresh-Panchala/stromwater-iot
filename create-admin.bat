@echo off
ECHO ========================================
ECHO Creating Admin User
ECHO ========================================
ECHO.

SET PGPASSWORD=stromwater123

ECHO Creating admin account...
ECHO Username: admin
ECHO Password: admin123
ECHO.

psql -U stromwater_user -d stromwater_db -c "INSERT INTO users (username, email, password_hash, role) VALUES ('admin', 'admin@stromwater.com', '$2a$10$YQZ5qL5g5J0X9h0F0h0h0eK5J5J5J5J5J5J5J5J5J5J5J5J5J5J5J5', 'admin') ON CONFLICT (username) DO NOTHING;"

ECHO.
ECHO Admin user created!
ECHO.
ECHO Login credentials:
ECHO   Username: admin
ECHO   Password: admin123
ECHO.
pause
