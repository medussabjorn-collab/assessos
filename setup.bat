@echo off
echo ================================================
echo  LeaderAssess Pro — Backend Setup
echo ================================================
echo.

echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org/
    pause & exit /b 1
)
echo Node.js OK

echo.
echo [2/5] Installing dependencies...
npm install
if %errorlevel% neq 0 ( echo ERROR: npm install failed & pause & exit /b 1 )

echo.
echo [3/5] Copying .env...
if not exist .env (
    copy .env.example .env
    echo .env created from .env.example
    echo IMPORTANT: Edit .env and set DATABASE_URL, MONGODB_URI, JWT_SECRET
) else (
    echo .env already exists
)

echo.
echo [4/5] Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 ( echo ERROR: Prisma generate failed & pause & exit /b 1 )

echo.
echo [5/5] Starting dev server...
echo.
echo ================================================
echo  Backend running at http://localhost:4000
echo  Health:  GET  http://localhost:4000/health
echo  API:     http://localhost:4000/api/v1
echo.
echo  Endpoints:
echo    POST /api/v1/auth/register
echo    POST /api/v1/auth/login
echo    POST /api/v1/assessments/sessions/:module/start
echo    POST /api/v1/proctoring/event
echo    GET  /api/v1/admin/stats    (admin only)
echo.
echo  Demo logins (after seeding):
echo    admin@leaderassess.com     / demo1234
echo    candidate@leaderassess.com / demo1234
echo ================================================
echo.
npm run dev
