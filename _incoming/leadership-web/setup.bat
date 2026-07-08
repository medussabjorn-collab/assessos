@echo off
echo ================================================
echo  LeaderAssess Pro — Full-Stack Setup
echo ================================================
echo.

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found.
    echo Please install Node.js 20+ from https://nodejs.org/
    pause & exit /b 1
)
echo Node.js OK

echo.
echo [2/3] Installing frontend dependencies...
npm install
if %errorlevel% neq 0 ( echo ERROR: npm install failed & pause & exit /b 1 )

echo.
echo [3/3] Starting development server...
echo.
echo ================================================
echo  Frontend:  http://localhost:5173
echo  Backend:   http://localhost:4000  (run setup.bat in leadership-assessment-backend\)
echo.
echo  Demo logins (after seeding the backend):
echo    Admin:     admin@leaderassess.com     / demo1234
echo    Candidate: candidate@leaderassess.com / demo1234
echo.
echo  Full stack quick-start:
echo    1. cd ..\leadership-assessment-backend ^&^& setup.bat
echo    2. In another terminal: docker compose up postgres mongo redis -d
echo    3. npm run seed
echo    4. Back here: already done ^(frontend running^)
echo ================================================
echo.
npm run dev
