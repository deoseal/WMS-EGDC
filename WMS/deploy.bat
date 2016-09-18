@echo on
set target="\\192.168.0.230\wwwroot\app\wms\egdcwms"
xcopy /y/e/s www %target%\www

pause

copy /y index.html %target%
copy /y update.json %target%
copy /y WMS-Egdc.apk %target%\WMS-Egdc.apk
del WMS-Egdc.apk /f /q

pause 