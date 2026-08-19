@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo         تشغيل نظام نبض لإدارة الجيم
echo ============================================
echo.

REM تحقق من وجود Node.js أصلاً قبل أي حاجة
where node >nul 2>nul
if errorlevel 1 (
    echo [خطأ] لم يتم العثور على Node.js على هذا الجهاز.
    echo تأكد من تثبيت Node.js أولاً من https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM أول تشغيل فقط: ثبّت حزم المشروع الرئيسية (وهذا يثبّت حزم server تلقائياً معها)
if not exist "node_modules" (
    echo [تجهيز أول مرة] تثبيت الحزم الأساسية... قد يستغرق بضع دقائق.
    call npm install
    if errorlevel 1 (
        echo.
        echo [خطأ] فشل تثبيت الحزم. راجع الرسالة أعلاه.
        pause
        exit /b 1
    )
    echo.
)

REM احتياطي: لو حزم server ناقصة لأي سبب رغم وجود node_modules الرئيسية
if not exist "server\node_modules" (
    echo [تجهيز] تثبيت حزم الخادم...
    pushd server
    call npm install
    popd
    echo.
)

echo [تشغيل التطبيق...]
echo أول مرة فقط قد يستغرق التشغيل وقتاً أطول قليلاً (إعداد قاعدة البيانات المحلية).
echo.

call npm run dev:electron

echo.
echo ============================================
echo تم إغلاق التطبيق.
echo ============================================
pause
