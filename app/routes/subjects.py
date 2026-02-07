"""科目管理接口：提供科目列表及增删改。"""
from typing import Any

from flask import Blueprint, g, request

from app.models import db, Subject
from app.utils.response import Response

subjects_bp = Blueprint("subjects", __name__, url_prefix="/api/subjects")


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _get_subject_or_404(subject_id: int) -> Subject:
    subject = Subject.query.filter_by(
        id=subject_id,
        user_id=g.current_user.id,
        is_deleted=False,
    ).first()
    if not subject:
        raise ValueError("科目不存在或者已被删除")
    return subject


@subjects_bp.route("", methods=["GET"])
def list_subjects():
    """获取当前用户的科目列表。"""
    subjects = (
        Subject.query.filter_by(user_id=g.current_user.id, is_deleted=False)
        .order_by(Subject.sort_order.asc(), Subject.id.asc())
        .all()
    )
    return Response.success([subject.to_dict() for subject in subjects])


@subjects_bp.route("", methods=["POST"])
def create_subject():
    """创建新的科目。"""
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return Response.error("科目名称不能为空")

    subject = Subject(
        user_id=g.current_user.id,
        name=name,
        color=(payload.get("color") or "#4299e1").strip() or "#4299e1",
        icon=(payload.get("icon") or "fas fa-book").strip() or "fas fa-book",
        sort_order=_to_int(payload.get("sort_order"), 0),
    )
    db.session.add(subject)
    db.session.commit()
    return Response.success(subject.to_dict(), "科目创建成功")


@subjects_bp.route("/<int:subject_id>", methods=["PUT"])
def update_subject(subject_id: int):
    """更新科目信息。"""
    try:
        subject = _get_subject_or_404(subject_id)
    except ValueError as exc:
        return Response.not_found(str(exc))

    payload = request.get_json(silent=True) or {}
    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            return Response.error("科目名称不能为空")
        subject.name = name
    if "color" in payload:
        color = (payload.get("color") or subject.color).strip()
        subject.color = color or subject.color
    if "icon" in payload:
        icon = (payload.get("icon") or subject.icon).strip()
        subject.icon = icon or subject.icon
    if "sort_order" in payload:
        subject.sort_order = _to_int(payload.get("sort_order"), subject.sort_order)

    db.session.commit()
    return Response.success(subject.to_dict(), "科目更新成功")


@subjects_bp.route("/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id: int):
    """软删除科目。"""
    try:
        subject = _get_subject_or_404(subject_id)
    except ValueError as exc:
        return Response.not_found(str(exc))

    subject.is_deleted = True
    db.session.commit()
    return Response.success(message="科目已删除")

