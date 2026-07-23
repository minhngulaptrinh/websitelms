@echo off
cd /d "%~dp0"
set LOG=detect.txt
echo ==== runtime detection ==== > %LOG%
echo [py] >> %LOG%
py -3 --version >> %LOG% 2>&1
echo [python] >> %LOG%
python --version >> %LOG% 2>&1
echo [python3] >> %LOG%
python3 --version >> %LOG% 2>&1
echo [node] >> %LOG%
node --version >> %LOG% 2>&1
echo [npx] >> %LOG%
npx --version >> %LOG% 2>&1
echo [where py] >> %LOG%
where py >> %LOG% 2>&1
echo [where node] >> %LOG%
where node >> %LOG% 2>&1
echo ==== done ==== >> %LOG%
