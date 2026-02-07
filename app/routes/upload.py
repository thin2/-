"""通用文件上传路由"""
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

from flask import Blueprint, g, request, current_app
from werkzeug.utils import secure_filename

from app.config import Config
from app.utils.response import Response

upload_bp = Blueprint("upload", __name__, url_prefix="/api/upload")

# 文件类型配置
UPLOAD_TYPES: Dict[str, Dict] = {
    "question": {
        "folder": "questions",
        "allowed_extensions": {"png", "jpg", "jpeg", "gif", "webp"},
        "max_size": 5 * 1024 * 1024,  # 5MB
        "use_date_folder": True,  # 按年月日分文件夹
    },
    "avatar": {
        "folder": "avatars",
        "allowed_extensions": {"png", "jpg", "jpeg", "gif", "webp"},
        "max_size": 2 * 1024 * 1024,  # 2MB
        "use_date_folder": True,  # 头像按日期归档
    },
    "general": {
        "folder": "general",
        "allowed_extensions": {"png", "jpg", "jpeg", "gif", "webp", "pdf", "doc", "docx"},
        "max_size": 10 * 1024 * 1024,  # 10MB
        "use_date_folder": True,
    },
}


def _get_file_extension(filename: str) -> Optional[str]:
    """获取文件扩展名（对异常文件名更健壮）"""
    if not filename:
        return None

    # 先做安全处理，再判断是否包含扩展名
    safe_name = secure_filename(filename)
    if not safe_name or "." not in safe_name:
        return None

    parts = safe_name.rsplit(".", 1)
    if len(parts) != 2 or not parts[1]:
        return None
    return parts[1].lower()


def _allowed_file(filename: str, allowed_extensions: set) -> bool:
    """检查文件扩展名是否允许"""
    ext = _get_file_extension(filename)
    return ext is not None and ext in allowed_extensions


def _get_upload_config(upload_type: str) -> Optional[Dict]:
    """获取上传类型配置"""
    return UPLOAD_TYPES.get(upload_type)


def _process_file_upload(file, upload_type: str = "general"):
    """
    处理文件上传的核心逻辑
    
    Args:
        file: 文件对象
        upload_type: 上传类型
        
    Returns:
        tuple: (success: bool, data: dict, message: str)
    """
    # 获取配置
    config = _get_upload_config(upload_type)
    if not config:
        return False, None, f"不支持的上传类型: {upload_type}"

    # 检查文件扩展名
    if not _allowed_file(file.filename, config["allowed_extensions"]):
        return False, None, f"不支持的文件格式，仅支持: {', '.join(config['allowed_extensions'])}"

    # 检查文件大小
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > config["max_size"]:
        max_size_mb = config["max_size"] // 1024 // 1024
        return False, None, f"文件大小不能超过 {max_size_mb}MB"

    # 确定上传目录
    base_folder = Config.ROOT_DIR / "static" / "uploads" / config["folder"]
    
    if config["use_date_folder"]:
        # 按年月日创建文件夹结构
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        day = now.strftime("%d")
        upload_dir = base_folder / year / month / day
    else:
        # 不分日期，直接存储在基础目录
        upload_dir = base_folder

    # 确保目录存在
    upload_dir.mkdir(parents=True, exist_ok=True)

    # 生成UUID文件名（保留原文件扩展名）
    file_ext = _get_file_extension(file.filename)
    unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
    file_path = upload_dir / unique_filename

    try:
        file.save(str(file_path))
        
        # 构建返回的URL路径
        if config["use_date_folder"]:
            now = datetime.now()
            year = now.strftime("%Y")
            month = now.strftime("%m")
            day = now.strftime("%d")
            file_url = f"/static/uploads/{config['folder']}/{year}/{month}/{day}/{unique_filename}"
        else:
            file_url = f"/static/uploads/{config['folder']}/{unique_filename}"
        
        return True, {"url": file_url}, "文件上传成功"
    except Exception as e:
        return False, None, f"文件上传失败: {str(e)}"


@upload_bp.route("/file", methods=["POST"])
def upload_file():
    """
    通用文件上传接口
    
    请求参数:
    - file: 文件对象（multipart/form-data）
    - type: 上传类型（question/avatar/general），默认为general
    
    返回:
    {
        "code": 0,
        "message": "上传成功",
        "data": {
            "url": "/static/uploads/questions/2024/03/15/uuid.jpg"
        }
    }
    """
    # 获取上传类型，默认为general
    # 优先从form获取，如果没有则从args获取（兼容GET参数）
    upload_type = (request.form.get("type") or request.args.get("type") or "general").lower()

    # 检查文件
    if "file" not in request.files:
        return Response.error("请选择要上传的文件")

    file = request.files["file"]
    if file.filename == "":
        return Response.error("请选择要上传的文件")

    # 处理文件上传
    success, data, message = _process_file_upload(file, upload_type)
    
    if success:
        # 如果是头像上传，尝试同步更新用户头像
        if upload_type == "avatar" and data and data.get("url"):
            try:
                if hasattr(g, "current_user") and g.current_user:
                    g.current_user.update_profile(avatar=data["url"])
            except Exception as e:
                current_app.logger.error(f"同步头像信息失败: {str(e)}")
                return Response.error("头像上传成功但同步用户信息失败，请稍后重试")
        return Response.success(data, message)
    else:
        return Response.error(message)



