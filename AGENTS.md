# AGENTS.md

本文件为在本仓库中工作的 AI 代理提供上下文与约束。修改代码前请先阅读本文件。

## 项目概述

孙思淇（大连民族大学在读）的个人展示网站。前台为纯静态单页，无框架、无构建、无第三方依赖；站点内容由根目录 `content.json` 驱动（前台 fetch 渲染，读取失败回退 HTML 内置内容）。本地另有一个仅供本机使用的 FastAPI 后台服务，用于可视化编辑内容并一键推送同步线上。

- 线上地址：https://ssq060902.github.io/sunsiqi-site/
- 源码仓库：https://github.com/Ssq060902/sunsiqi-site（推送 `main` 即自动部署到 GitHub Pages）
- 部署源：仓库根目录 `/ (root)`

## 目录与文件

```
index.html              # 页面结构：吸顶导航 / Hero / 人物介绍 / 技能展示 / 项目展示 / 页脚（静态兜底内容）
style.css               # 全部样式：设计变量、组件、响应式
script.js               # 全部交互：content.json 动态渲染、移动菜单、滚动显现、导航高亮
content.json            # 站点内容数据源（后台编辑、前台渲染、随仓库发布到 Pages）
server.py               # 本地后台服务（FastAPI）：托管静态页 + 内容编辑 API + git 一键发布
admin.html              # 管理后台页面（登录 + 表单编辑 + 同步线上），仅本机访问
start_site_server.bat   # 无窗口启动后台服务（pythonw，端口 8778，日志 site_server.log）
.gitignore              # 忽略 site_server.log / __pycache__ / .env
AGENTS.md               # 本文件
需求文档.md              # 需求与验收标准
技术文档.md              # 技术实现与维护说明
```

## 技术约束（必须遵守）

1. 前台保持 `index.html` / `style.css` / `script.js` 纯静态架构，不引入框架、打包工具、CSS 预处理器或 npm 依赖。
2. 后端仅限现有的本地内容编辑服务：`server.py`（FastAPI，用 `d:\damoxing\.venv` 的 python 启动）+ `admin.html`；管理密码读环境变量 `ADMIN_PASSWORD`（默认 sunsiqi2026）。
3. 不引入外部字体、图标库、CDN 资源；图标使用内联 SVG。
4. `index.html`、`style.css`、`script.js` 必须留在仓库根目录（Pages 部署目录为 root）；`content.json` 也在根目录，作为前台与后台共用的数据源。
5. 改前台只动 `index.html`、`style.css`、`script.js`；改内容/后台动 `content.json`、`server.py`、`admin.html`。
6. 不生成 AI 真人头像；人物视觉始终用姓名首字「孙」的渐变圆形徽标。
7. 代码注释与文档使用中文。

## 设计系统

所有视觉参数定义在 `style.css` 的 `:root`，改主题只改这里，不要在组件里硬编码颜色。

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#0E1613` | 页面主背景（深色主题） |
| `--bg-alt` | `#121C17` | 交替区块背景 |
| `--ink` | `#E6F2EB` | 主文字 |
| `--muted` | `#8FA89A` | 次要文字 |
| `--card` | `#16241D` | 卡片背景 |
| `--line` | `#24352C` | 边框 / 分割线 |
| `--accent` | `#4FD08A` | 主强调色 |
| `--grad` | `linear-gradient(135deg,#1E9A5F,#4FD08A)` | 渐变（按钮、头像、高亮文字） |
| `--radius` / `--radius-sm` | `20px` / `12px` | 圆角 |
| `--header-h` | `68px` | 吸顶导航高度（同时用于锚点偏移） |

风格基调：深色墨绿底 + 亮绿点缀，圆角卡片 + 柔和阴影，克制留白，区块首次进入视口时淡入上移（`.reveal` → `.visible`）。

## 页面结构约定

- 区块锚点：`#top`（Hero）、`#about`、`#skills`、`#projects`、`#contact`（页脚）。
- 导航锚点与区块 ID 必须一一对应。
- **新增区块时必须同步三处**：`index.html` 的 `<section id>`、导航 `<a href="#...">`、`script.js` 中 `sections` 数组的 ID（否则导航高亮不生效）。
- 技能展示与项目展示当前仅保留"内容整理中"空状态（`.empty-card`），**不要在未获内容的情况下自行编造技能或项目**。

## 内容事实

可作为真实信息使用的仅有：

- 姓名：孙思淇
- 学校：大连民族大学（在读）
- GitHub：https://github.com/Ssq060902

专业、年级、兴趣爱好、技能、项目经历等内容均为未知。用户曾明确要求「技能展示和项目介绍先不写」，因此这些区块保持空状态，除非用户提供内容。

## 交互逻辑要点

- 移动菜单（≤680px）：`#navToggle` 切换 `#siteNav` 的 `open` 类，同步 `aria-expanded` / `aria-label`；点击任一菜单项自动收起。
- 滚动显现：`IntersectionObserver`（threshold 0.15）给 `.reveal` 加 `.visible`，触发后 `unobserve`。
- 导航高亮：第二个 `IntersectionObserver`，`rootMargin: '-40% 0px -55% 0px'`。
- 已适配 `prefers-reduced-motion: reduce`：关闭动画与平滑滚动。

## 响应式断点

- `max-width: 820px`：个人卡片内边距收窄。
- `max-width: 680px`：启用汉堡菜单与下拉面板，缩小 Hero 与区块间距。

## 本地验证

```powershell
d:\damoxing\personal-site\start_site_server.bat
```

（或手动：`d:\damoxing\.venv\Scripts\pythonw.exe -m uvicorn server:app --app-dir d:\damoxing\personal-site --host 127.0.0.1 --port 8778`）

浏览器访问 http://127.0.0.1:8778 （前台）与 http://127.0.0.1:8778/admin （后台）。改动后必须验证：

1. 控制台无 JS 报错。
2. 桌面与移动（约 390×844）无横向滚动、无溢出。
3. 导航跳转、汉堡菜单开合、高亮联动正常。
4. 深色主题下无"深底深字"不可读区域。
5. 前台内容来自 content.json（后台改并保存后刷新前台可见）；content.json 读取失败时回退静态内容。

## 发布

- 常规方式：后台 http://127.0.0.1:8778/admin 点「同步到线上」（服务端执行 git add content.json → commit → push origin main）。
- 手动方式：

```powershell
git add index.html style.css script.js content.json
git commit -m "feat: 简述改动"
git push origin main
```

推送后确认 GitHub Actions 部署工作流成功，再访问线上地址复核。**未经用户明确要求，不要推送或改变部署配置。**

## 明确不要做的事

- 不新增数据库、留言、评论等功能；后端仅限现有的本地内容编辑服务（server.py + admin.html），不再扩展。
- 不添加统计、埋点、客服等第三方脚本。
- 不做与当前需求无关的重构或"顺手优化"。
- 不覆盖其他仓库（如 `ssq` 仓库当前承载 PicGrab，不要推个人网站上去）。
- 创建文件前先考虑能否改动现有文件；不要凭空新增文档。
