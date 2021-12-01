call "C:\\TechPlan\\server\\venv\\Scripts\\activate.bat"
pyinstaller --onefile api.spec --distpath ..\pyserver_dist\api --noconfirm
pyinstaller -D api.spec --distpath ..\pyserver_dist --noconfirm
pause