import os
from flask import Blueprint, request, current_app, g
from werkzeug.security import generate_password_hash, check_password_hash

from ..utils.response import Response
from .upload import _process_file_upload

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile", methods=["GET"])
def get_profile():
    """获取当前用户资料"""
    try:
        user_data = g.current_user.to_dict()
        return Response.success(data=user_data, message="获取资料成功")
    except Exception as e:
        current_app.logger.error(f"获取用户资料失败: {str(e)}")
        return Response.error("获取资料失败")


@profile_bp.route("/profile", methods=["PUT"])
def update_profile():
    """更新用户资料"""
    try:
        data = request.get_json(silent=True) or {}
        
        # 允许更新的字段（精简版）
        allowed_fields = ['nickname', 'email', 'phone', 'gender', 'bio']
        
        update_data = {}
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field] if data[field] != '' else None
        
        # 验证邮箱格式
        if update_data.get('email'):
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, update_data['email']):
                return Response.error("邮箱格式不正确")
        
        # 验证手机号格式
        if update_data.get('phone'):
            import re
            phone_pattern = r'^1[3-9]\d{9}$'
            if not re.match(phone_pattern, update_data['phone']):
                return Response.error("手机号格式不正确")
        
        g.current_user.update_profile(**update_data)
        user_data = g.current_user.to_dict()
        
        return Response.success(data=user_data, message="资料更新成功")
        
    except Exception as e:
        current_app.logger.error(f"更新用户资料失败: {str(e)}")
        return Response.error("更新资料失败")


@profile_bp.route("/password", methods=["PUT"])
def change_password():
    """修改密码"""
    try:
        data = request.get_json(silent=True) or {}
        old_password = data.get('oldPassword', '')
        new_password = data.get('newPassword', '')
        
        if not old_password or not new_password:
            return Response.error("请输入当前密码和新密码")
        
        # 验证当前密码
        if not check_password_hash(g.current_user.password_hash, old_password):
            return Response.error("当前密码不正确")
        
        # 验证新密码长度
        if len(new_password) < 6 or len(new_password) > 10:
            return Response.error("新密码长度应在6-10位之间")
        
        # 更新密码
        new_password_hash = generate_password_hash(new_password)
        g.current_user.update_password(new_password_hash)
        
        return Response.success(message="密码修改成功")
        
    except Exception as e:
        current_app.logger.error(f"修改密码失败: {str(e)}")
        return Response.error("修改密码失败")


@profile_bp.route("/avatar", methods=["POST"])
def upload_avatar():
    """上传头像"""
    try:
        if 'avatar' not in request.files:
            return Response.error("请选择要上传的头像文件")
        
        file = request.files['avatar']
        if file.filename == '':
            return Response.error("请选择要上传的头像文件")
        
        success, data, message = _process_file_upload(file, "avatar")
        if not success or not data or "url" not in data:
            return Response.error(message or "头像上传失败")
        
        avatar_url = data["url"]
        
        # 更新用户头像
        g.current_user.update_profile(avatar=avatar_url)
        
        return Response.success(data={'avatar_url': avatar_url}, message="头像上传成功")
        
    except Exception as e:
        current_app.logger.error(f"上传头像失败: {str(e)}")
        return Response.error("上传头像失败")


