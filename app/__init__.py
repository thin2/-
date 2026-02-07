from pathlib import Path
from flask import Flask, abort, render_template, request, g
from flask_cors import CORS

from .config import Config
from .utils.response import Response
from .routes.auth import auth_bp, get_user_by_token


def create_app() -> Flask:
    # 获取项目根目录
    ROOT_DIR = Path(__file__).resolve().parent.parent
    
    # 创建Flask应用实例
    app = Flask(
        __name__,
        static_folder=str(ROOT_DIR / "static"),
        template_folder=str(ROOT_DIR / "templates"),
    )

    app.config.from_object(Config)
    
    # 配置CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # 初始化数据库
    from .models import db
    db.init_app(app)
    
    # 确保基础上传目录存在
    upload_base_dir = Config.UPLOAD_BASE_DIR
    upload_base_dir.mkdir(parents=True, exist_ok=True)
    
    # 确保各类型上传目录存在
    (upload_base_dir / "questions").mkdir(parents=True, exist_ok=True)
    (upload_base_dir / "avatars").mkdir(parents=True, exist_ok=True)
    (upload_base_dir / "general").mkdir(parents=True, exist_ok=True)

    # 注册API路由蓝图
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    
    from .routes.upload import upload_bp
    app.register_blueprint(upload_bp)
    
    from .routes.questions import questions_bp
    # from .routes.subjects import subjects_bp  # 已禁用科目管理
    from .routes.reviews import reviews_bp
    from .routes.dashboard import dashboard_bp
    from .routes.exams import exams_bp
    from .routes.profile import profile_bp
    from .routes.ai import ai_bp
    app.register_blueprint(questions_bp)
    # app.register_blueprint(subjects_bp)  # 已禁用科目管理
    app.register_blueprint(reviews_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(exams_bp)
    app.register_blueprint(profile_bp, url_prefix="/api")
    app.register_blueprint(ai_bp)
    
    # 注册页面路由蓝图
    from .routes.main import main_routes
    app.register_blueprint(main_routes)

    @app.before_request
    def require_authentication():
        path = request.path
        if path.startswith("/api/") and not path.startswith("/api/auth"):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header:
                return Response.unauthorized("请先登录")
            
            # 处理 "Bearer " 或 "Bearer" 前缀
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]  # "Bearer " 长度为 7
            elif auth_header.startswith("Bearer"):
                token = auth_header[6:].strip()  # "Bearer" 长度为 6，可能有空格
            else:
                return Response.unauthorized("请先登录")
            
            if not token:
                return Response.unauthorized("请先登录")
                
            user = get_user_by_token(token)
            if not user:
                return Response.unauthorized("登录已失效，请重新登录")
            g.current_user = user

    return app