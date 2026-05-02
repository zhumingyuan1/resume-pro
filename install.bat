@echo off
cd /d C:\Users\DELL\.openclaw\workspace\resume-pro
echo Starting npm install at %TIME% >> install.log
npm install --no-audit --no-fund >> install.log 2>&1
echo Finished at %TIME% >> install.log
