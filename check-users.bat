@echo off
ECHO ========================================
ECHO Checking Users in Database
ECHO ========================================
ECHO.

SET PGPASSWORD=root

ECHO Current users:
psql -U postgres -d stromwater_db -c "SELECT id, username, email, role, is_active FROM users;"

ECHO.
pause
