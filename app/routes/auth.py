from typing import Optional
from datetime import datetime, timedelta

from flask import Blueprint, request
from werkzeug.security import check_password_hash, generate_password_hash
from sqlalchemy.exc import IntegrityError
import jwt

from ..models import User
from ..utils.response import Response
from ..config import Config


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register_user():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    password_hash = generate_password_hash(password)
    nickname = username.split("@")[0] if "@" in username else username

    try:
        user = User.create(username, password_hash, nickname)
        user_dict = user.to_dict()
        return Response.success(data=user_dict, message="注册成功")
    except IntegrityError:
        return Response.conflict("账号已存在")


@auth_bp.route("/login", methods=["POST"])
def login_user():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    user = User.find_by_username(username)
    if not user or not check_password_hash(user.password_hash, password):
        return Response.error("账号或密码错误")

    user_dict = user.to_dict()
    
    # 使用 JWT 生成 token，token 中包含用户 ID 和过期时间，不需要额外存储
    expiration_hours = Config.TOKEN_EXPIRATION_HOURS
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=expiration_hours)
    
    # 生成 JWT token，exp 和 iat 需要使用 Unix 时间戳（整数）
    payload = {
        'user_id': user.id,
        'exp': int(expires_at.timestamp()),  # 过期时间戳
        'iat': int(now.timestamp())  # 签发时间戳
    }
    token = jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')
    # PyJWT 2.0+ 返回字符串，旧版本返回 bytes
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    
    return Response.success(data={"token": token, "user_info": user_dict}, message="登录成功")


def get_user_by_token(token: str) -> Optional["User"]:
    """根据 JWT token 获取用户，如果 token 无效或已过期则返回 None"""
    if not token:
        return None
    
    try:
        # 解码 JWT token，自动验证签名和过期时间
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
        
        if not user_id:
            return None
        
        # 从数据库获取用户
        return User.query.get(user_id)
    except jwt.ExpiredSignatureError:
        # token 已过期
        return None
    except jwt.InvalidTokenError:
        # token 无效
        return None

