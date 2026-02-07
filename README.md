# 错题管理系统

一个基于 Flask + Vue.js 的智能错题管理平台，帮助学生系统化地收集、整理和复习错题，并集成 AI 辅助学习功能。

## 功能特性

- **错题管理** - 支持单选、多选、判断、简答等多种题型的增删改查
- **科目分类** - 按科目、难度、题型等维度分类管理
- **智能复习** - 基于遗忘曲线的复习任务推荐与掌握度追踪
- **模拟考试** - 从错题库中自动生成试卷并评分
- **AI 助手** - 集成智谱 AI (GLM-4.5-flash)，支持流式对话答疑
- **数据统计** - 可视化仪表盘展示学习数据与趋势
- **图片上传** - 支持为错题添加图片附件
- **用户系统** - JWT 认证，个人资料与头像管理

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Flask 3.0 / SQLAlchemy / SQLite |
| 前端 | Vue.js 2 / Element UI / ECharts |
| 认证 | JWT (PyJWT) |
| AI | 智谱 AI GLM-4.5-flash |

## 快速开始

### 环境要求

- Python 3.8+

### 安装与运行

```bash
# 克隆项目
git clone <repo-url>
cd 错题管理系统

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境 (Windows)
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python init_db.py

# 启动服务
python app.py
```

启动后访问 http://127.0.0.1:5000

### 默认账号

| 用户名 | 密码 |
|--------|------|
| admin  | 123456 |

## 项目结构

```
├── app/
│   ├── __init__.py          # 应用工厂
│   ├── config.py            # 配置
│   ├── models/              # 数据模型
│   ├── routes/              # API 路由
│   ├── services/            # 业务逻辑
│   └── utils/               # 工具函数
├── templates/               # HTML 页面模板
├── static/                  # 静态资源 (CSS/JS/上传文件)
├── docs/                    # 项目文档
├── data/                    # 数据库文件
├── app.py                   # 入口文件
├── init_db.py               # 数据库初始化脚本
└── requirements.txt         # Python 依赖
```

## API 概览

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 认证 | `/api/auth` | 登录、注册、登出 |
| 错题 | `/api/questions` | 错题 CRUD 与搜索 |
| 复习 | `/api/reviews` | 复习任务与记录 |
| 考试 | `/api/exams` | 试卷生成与提交 |
| 统计 | `/api/dashboard` | 仪表盘数据 |
| AI | `/api/ai` | AI 对话 |
| 用户 | `/api/profile` | 个人资料管理 |
| 上传 | `/api/upload` | 文件上传 |

详细接口文档见 [docs/API文档.md](docs/API文档.md)。

## 文档

完整项目文档位于 `docs/` 目录，包含项目概述、需求分析、设计方案、测试报告等，详见 [docs/README.md](docs/README.md)。

## License

MIT
