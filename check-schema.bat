@echo off
SET PGPASSWORD=root
psql -U postgres -d stromwater_db -c "\d device_data"
pause
