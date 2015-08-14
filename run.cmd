@echo off

cls
echo.
echo  Continually press ctrl+c as many times as it takes to terminate the program.
echo.
echo  Starting the static file server! Note that startup time will be longer with more files
echo  in the /static, /init, or /404 directories...
echo.
node index.js || goto :error
goto :EOF

:error
echo.
echo  Failed to run the static file server because either Node.js is not correctly
echo  configured or installed on this machine, or the index.js file is missing from
echo  the root folder. Please install Node, or replace the missing index.js file and
echo  try again.
echo.
pause
exit /b %errorlevel%