@echo off
rem personal site server, windowless (pythonw), logs -> site_server.log
start "personal-site-svc" /b d:\damoxing\.venv\Scripts\pythonw.exe -m uvicorn server:app --app-dir d:\damoxing\personal-site --host 127.0.0.1 --port 8778 >> d:\damoxing\personal-site\site_server.log 2>&1
