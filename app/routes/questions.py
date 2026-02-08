"""错题相关接口：列表、详情、增删改与图片上传。"""
import json
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from flask import Blueprint, g, request, current_app
from werkzeug.utils import secure_filename
from sqlalchemy import or_

from app.models import (
    db,
    Subject,
    Question,
    QuestionOption,
    QuestionTag,
)
from app.utils.response import Response
from app.config import Config

questions_bp = Blueprint("questions", __name__, url_prefix="/api")


# ---------- Helpers ----------
def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _parse_pagination() -> Tuple[int, int]:
    page = max(_to_int(request.args.get("page", 1), 1), 1)
    page_size = max(min(_to_int(request.args.get("page_size", 10), 10), 100), 1)
    return page, page_size


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _get_subject_or_404(subject_id: int) -> Subject:
    subject = Subject.query.filter_by(
        id=subject_id,
        user_id=g.current_user.id,
        is_deleted=False,
    ).first()
    if not subject:
        raise ValueError("科目不存在或者已被删除")
    return subject


def _question_to_dict(question: Question, detail: bool = False) -> Dict[str, Any]:
    return question.to_detail_dict() if detail else question.to_brief_dict()


def _sync_options(question: Question, options_payload: Optional[List[Dict[str, Any]]]) -> None:
    if options_payload is None:
        return
    cleaned: List[QuestionOption] = []
    for item in options_payload:
        option_key = (item.get("option_key") or "").strip()
        option_text = (item.get("option_text") or "").strip()
        if not option_key or not option_text:
            continue
        cleaned.append(
            QuestionOption(
                option_key=option_key,
                option_text=option_text,
                is_correct=bool(item.get("is_correct")),
                sort_order=int(item.get("sort_order") or 0),
            )
        )
    question.options = cleaned


def _sync_tags(question: Question, tag_names: Optional[List[str]]) -> None:
    if tag_names is None:
        return
    question.tags = [
        QuestionTag(name=tag.strip())
        for tag in tag_names
        if tag and tag.strip()
    ]


def _sync_images(question: Question, image_urls: Optional[List[str]], field: str = "images") -> None:
    """同步图片URL列表

    Args:
        question: Question对象
        image_urls: 图片URL列表
        field: 字段名,可以是"images", "error_images", "answer_images"
    """
    if image_urls is None:
        return
    # 过滤空值并验证URL格式
    valid_urls = [url.strip() for url in image_urls if url and url.strip()]
    if valid_urls:
        setattr(question, field, json.dumps(valid_urls))
    else:
        setattr(question, field, None)


def _allowed_file(filename: str) -> bool:
    """检查文件扩展名是否允许"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS


# ---------- Question APIs ----------
@questions_bp.route("/questions", methods=["GET"])
def list_questions():
    """分页获取错题列表，支持关键词、科目、难度等筛选。"""
    page, page_size = _parse_pagination()
    query = Question.query.filter_by(user_id=g.current_user.id, is_deleted=False)

    keyword = request.args.get("keyword")
    if keyword:
        like_keyword = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                Question.title.ilike(like_keyword),
                Question.content.ilike(like_keyword),
            )
        )

    subject_id = _to_int(request.args.get("subject_id"))
    if subject_id:
        query = query.filter(Question.subject_id == subject_id)

    difficulty = _to_int(request.args.get("difficulty"))
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)

    question_type = request.args.get("question_type")
    if question_type:
        query = query.filter(Question.question_type == question_type)

    review_status = request.args.get("review_status")
    if review_status not in (None, ""):
        status_val = _to_int(review_status, -1)
        if status_val in (0, 1):
            query = query.filter(Question.review_status == status_val)

    start_date = _parse_datetime(request.args.get("start_date"))
    if start_date:
        query = query.filter(Question.created_at >= start_date)

    end_date = _parse_datetime(request.args.get("end_date"))
    if end_date:
        query = query.filter(Question.created_at <= end_date)

    total = query.count()
    items = (
        query.order_by(Question.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    data = {
        "list": [_question_to_dict(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
    return Response.success(data)


@questions_bp.route("/questions/<int:question_id>", methods=["GET"])
def get_question_detail(question_id: int):
    """获取单个错题的完整详情。"""
    question = Question.query.filter_by(
        id=question_id,
        user_id=g.current_user.id,
        is_deleted=False,
    ).first()
    if not question:
        return Response.not_found("错题不存在或已删除")
    return Response.success(_question_to_dict(question, detail=True))


@questions_bp.route("/questions", methods=["POST"])
def create_question():
    """创建新错题记录。"""
    payload = request.get_json(silent=True) or {}
    required_fields = ["title", "question_type", "difficulty"]
    missing = [field for field in required_fields if not payload.get(field)]
    # content/answer: 有对应图片时文字可以为空；error_reason完全可选
    if not payload.get("content") and not payload.get("images"):
        missing.append("content")
    if not payload.get("answer") and not payload.get("answer_images"):
        missing.append("answer")
    if missing:
        return Response.error(f"缺少必要参数：{', '.join(missing)}")

    # subject_id改为可选,如果提供则验证,否则设为None
    subject_id = None
    if payload.get("subject_id"):
        try:
            subject = _get_subject_or_404(_to_int(payload.get("subject_id")))
            subject_id = subject.id
        except ValueError as exc:
            return Response.not_found(str(exc))

    question = Question(
        user_id=g.current_user.id,
        subject_id=subject_id,
        question_type=payload.get("question_type"),
        title=payload.get("title"),
        content=payload.get("content"),
        answer=payload.get("answer"),
        error_reason=payload.get("error_reason"),
        difficulty=_to_int(payload.get("difficulty"), 2),
        review_status=int(payload.get("review_status", 0)),
        is_important=bool(payload.get("is_important", False)),
        is_mastered=bool(payload.get("is_mastered", False)),
    )
    _sync_options(question, payload.get("options"))
    _sync_tags(question, payload.get("tags"))
    _sync_images(question, payload.get("images"))
    # 同步错误解析图片和答案图片
    _sync_images(question, payload.get("error_images"), field="error_images")
    _sync_images(question, payload.get("answer_images"), field="answer_images")

    db.session.add(question)
    db.session.commit()
    return Response.success(_question_to_dict(question, detail=True), "错题创建成功")


@questions_bp.route("/questions/<int:question_id>", methods=["PUT"])
def update_question(question_id: int):
    """更新指定错题的内容。"""
    question = Question.query.filter_by(
        id=question_id,
        user_id=g.current_user.id,
        is_deleted=False,
    ).first()
    if not question:
        return Response.not_found("错题不存在或已删除")

    payload = request.get_json(silent=True) or {}

    if "subject_id" in payload:
        if payload["subject_id"]:
            try:
                subject = _get_subject_or_404(_to_int(payload.get("subject_id")))
                question.subject_id = subject.id
            except ValueError as exc:
                return Response.not_found(str(exc))
        else:
            question.subject_id = None

    for field in ["title", "content", "answer", "error_reason", "question_type"]:
        if field in payload and payload[field] is not None:
            setattr(question, field, payload[field])

    if "difficulty" in payload:
        question.difficulty = _to_int(payload.get("difficulty"), question.difficulty)
    if "review_status" in payload:
        question.review_status = _to_int(payload.get("review_status"), question.review_status)
    if "is_important" in payload:
        question.is_important = bool(payload.get("is_important"))
    if "is_mastered" in payload:
        question.is_mastered = bool(payload.get("is_mastered"))

    _sync_options(question, payload.get("options"))
    _sync_tags(question, payload.get("tags"))
    if "images" in payload:
        _sync_images(question, payload.get("images"))
    # 同步错误解析图片和答案图片
    if "error_images" in payload:
        _sync_images(question, payload.get("error_images"), field="error_images")
    if "answer_images" in payload:
        _sync_images(question, payload.get("answer_images"), field="answer_images")

    db.session.commit()
    return Response.success(_question_to_dict(question, detail=True), "错题更新成功")


@questions_bp.route("/questions/<int:question_id>", methods=["DELETE"])
def delete_question(question_id: int):
    """软删除指定错题。"""
    question = Question.query.filter_by(
        id=question_id,
        user_id=g.current_user.id,
        is_deleted=False,
    ).first()
    if not question:
        return Response.not_found("错题不存在或已删除")

    question.is_deleted = True
    db.session.commit()
    return Response.success(message="错题已删除")


# ---------- Image Upload APIs (已迁移到通用上传接口) ----------
# 保留此路由用于向后兼容，调用通用上传逻辑
@questions_bp.route("/questions/upload-image", methods=["POST"])
def upload_question_image():
    """上传错题图片（兼容接口，使用通用上传逻辑）。"""
    from app.routes.upload import _process_file_upload
    
    # 检查文件
    if "file" not in request.files:
        return Response.error("请选择要上传的图片")
    
    file = request.files["file"]
    if file.filename == "":
        return Response.error("请选择要上传的图片")
    
    # 使用通用上传逻辑，类型为question
    success, data, message = _process_file_upload(file, "question")
    
    if success:
        return Response.success(data, message)
    else:
        return Response.error(message)
