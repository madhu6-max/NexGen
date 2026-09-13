@echo off
echo ===================================================
echo   Resetting AgriLink to Clean State (0 Users)
echo ===================================================
node server/db/clean_reset.js
pause
