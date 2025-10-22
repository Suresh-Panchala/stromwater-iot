@echo off
ECHO ========================================
ECHO Testing Database INSERT
ECHO ========================================
ECHO.

SET PGPASSWORD=root
psql -U postgres -d stromwater_db -f test-insert.sql

ECHO.
pause
