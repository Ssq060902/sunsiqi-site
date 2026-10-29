"""个人网站后台服务。

职责：
1. 托管静态站点（index.html / admin.html / style.css / script.js / content.json）
2. 内容编辑 API：登录 -> 读取/保存 content.json
3. 一键发布：git add content.json -> commit -> push origin main
   （GitHub Pages 推送 main 后自动部署）

启动：d:\\damoxing\\.venv\\Scripts\\pythonw.exe -m uvicorn server:app --app-dir d:\\damoxing\\personal-site --host 127.0.0.1 --port 8778
管理密码：环境变量 ADMIN_PASSWORD（默认 sunsiqi2026）
"""
import json
import os
import secrets
import subprocess
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
CONTENT_FILE = BASE_DIR / "content.json"
STATIC_FILES = {"style.css", "script.js", "content.json", "admin.html"}

# 管理密码：优先读环境变量 ADMIN_PASSWORD，便于不改动代码就更换密码
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "sunsiqi2026")

app = FastAPI()
_tokens: set[str] = set()


class LoginBody(BaseModel):
    password: str


class ContentBody(BaseModel):
    token: str
    content: dict


class PublishBody(BaseModel):
    token: str
    message: str = "更新站点内容"


def check_token(token: str) -> None:
    if token not in _tokens:
        raise HTTPException(status_code=401, detail="登录状态已失效，请重新登录")


def run_git(args: list[str]) -> tuple[int, str]:
    """在仓库根目录执行 git 命令，返回 (returncode, 合并后的输出)。"""
    p = subprocess.run(
        ["git", *args],
        cwd=BASE_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return p.returncode, ((p.stdout or "") + (p.stderr or "")).strip()


# ---------- 公开接口 ----------

@app.get("/api/content")
def get_content():
    if not CONTENT_FILE.exists():
        raise HTTPException(status_code=404, detail="content.json 不存在")
    return JSONResponse(json.loads(CONTENT_FILE.read_text("utf-8")))


# ---------- 管理接口 ----------

@app.post("/api/login")
def login(b: LoginBody):
    if b.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="密码错误")
    token = secrets.token_hex(16)
    _tokens.add(token)
    return {"token": token}


@app.post("/api/content")
def save_content(b: ContentBody):
    check_token(b.token)
    text = json.dumps(b.content, ensure_ascii=False, indent=2) + "\n"
    CONTENT_FILE.write_text(text, "utf-8")
    return {"ok": True, "message": "已保存到 content.json"}


@app.post("/api/publish")
def publish(b: PublishBody):
    check_token(b.token)
    logs: list[str] = []

    rc, out = run_git(["add", "content.json"])
    logs.append(f"$ git add content.json\n{out}")
    if rc != 0:
        raise HTTPException(status_code=500, detail=f"git add 失败：{out}")

    rc, out = run_git(["status", "--porcelain", "content.json"])
    if rc != 0:
        raise HTTPException(status_code=500, detail=f"git status 失败：{out}")
    if not out:
        return {"ok": True, "message": "线上已是最新，没有需要同步的修改。", "logs": logs}

    message = (b.message or "更新站点内容").strip()[:60]
    rc, out = run_git(["commit", "-m", message])
    logs.append(f"$ git commit -m {message}\n{out}")
    if rc != 0:
        raise HTTPException(status_code=500, detail=f"git commit 失败：{out}")

    rc, out = run_git(["push", "origin", "main"])
    logs.append(f"$ git push origin main\n{out}")
    if rc != 0:
        raise HTTPException(status_code=500, detail=f"git push 失败：{out}")

    return {"ok": True, "message": "已推送到 GitHub，Pages 将在 1-2 分钟内自动更新线上站点。", "logs": logs}


# ---------- 静态页面 ----------

@app.get("/")
def index():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/admin")
def admin():
    return FileResponse(BASE_DIR / "admin.html")


@app.get("/{name}")
def static_file(name: str):
    if name in STATIC_FILES:
        f = BASE_DIR / name
        if f.exists():
            return FileResponse(f)
    raise HTTPException(status_code=404)
