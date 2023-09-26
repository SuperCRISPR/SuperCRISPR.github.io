@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

set "baseDir=%CD%"

> file.list (
    for /r %%i in (*) do (
        set "file=%%i"
        set "file=!file:%baseDir%\=!"
        set "file=!file:\=/!"
	echo !file!
    )
)

chcp 936 > nul
endlocal