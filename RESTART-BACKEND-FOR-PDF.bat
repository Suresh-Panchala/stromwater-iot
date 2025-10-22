@echo off
ECHO ========================================
ECHO Restart Backend for PDF Fix
ECHO ========================================
ECHO.
ECHO The PDF export has been fixed with a simplified table format.
ECHO.
ECHO To apply the changes:
ECHO  1. Go to the backend terminal window
ECHO  2. Press Ctrl+C to stop the backend
ECHO  3. Run: start-backend.bat
ECHO.
ECHO After restarting, test the PDF export:
ECHO  1. Go to dashboard: http://localhost:3000
ECHO  2. Scroll down and click "View Details"
ECHO  3. Click "Export PDF" button
ECHO  4. PDF should download with clean table format
ECHO.
ECHO PDF Format:
ECHO  - Professional header with device info
ECHO  - 9-column table (Time, Level, P1, P2, V1, V2, I1, I2, Freq)
ECHO  - Alternating row colors
ECHO  - Auto pagination with repeated headers
ECHO  - Page numbers in footer
ECHO  - Up to 100 records per export
ECHO.
pause
