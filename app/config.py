from pathlib import Path
import os


class Config:
    """
    应用配置统一放在这个类中，供 create_app 和其他脚本共享。
    """

    ROOT_DIR = Path(__file__).resolve().parent.parent

    SECRET_KEY = "your-secret-key-here"

    SQLALCHEMY_DATABASE_URI = f"sqlite:///{ROOT_DIR / 'data/app.db'}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # 文件上传配置（保留用于兼容）
    UPLOAD_FOLDER = ROOT_DIR / "static" / "uploads" / "questions"
    MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
    
    # 上传基础目录
    UPLOAD_BASE_DIR = ROOT_DIR / "static" / "uploads"
    
    # Token 配置
    TOKEN_EXPIRATION_HOURS = 24  # Token 有效时间（小时），默认24小时

    # AI 模型配置（默认兼容 OpenAI / 通用 chat completion 接口）
    API_KEY = os.environ.get("API_KEY", "a1ffd117633d43c1b5d75f9261468910.u1QVyQm8QyYbAFzB")
    BASE_URL = os.environ.get("BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
    MODEL = os.environ.get("MODEL", "glm-4.5-flash")
    MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "4096"))

