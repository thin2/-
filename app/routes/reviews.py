"""复习中心相关接口：统计、抽题、提交结果。"""
from datetime import datetime, timedelta
from typing import Any

from flask import Blueprint, g, request
from sqlalchemy import func

from app.models import db, Question
from app.utils.response import Response

reviews_bp = Blueprint("reviews", __name__, url_prefix="/api/review")


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@reviews_bp.route("/stats", methods=["GET"])
def review_stats():
    """返回复习统计数据：今日复习、待复习、已复习、连续天数。"""
    today = datetime.utcnow().date()
    user_id = g.current_user.id

    base_query = Question.query.filter_by(user_id=user_id, is_deleted=False)

    pending_count = base_query.filter(Question.review_status == 0).count()
    reviewed_count = base_query.filter(Question.review_status == 1).count()

    today_start = datetime.combine(today, datetime.min.time())
    today_next = today_start + timedelta(days=1)
    today_count = (
        base_query.filter(
            Question.last_review_at >= today_start,
            Question.last_review_at < today_next,
        ).count()
    )

    reviewed_dates = {
        q.last_review_at.date()
        for q in base_query.filter(Question.last_review_at.isnot(None)).all()
    }
    streak_days = 0
    cursor = today
    while cursor in reviewed_dates:
        streak_days += 1
        cursor -= timedelta(days=1)

    data = {
        "today_count": today_count,
        "pending_count": pending_count,
        "reviewed_count": reviewed_count,
        "streak_days": streak_days,
    }
    return Response.success(data)


@reviews_bp.route("/list", methods=["GET"])
def review_list():
    """根据复习模式返回待复习题目列表，支持分页。"""
    user_id = g.current_user.id
    mode = request.args.get("mode", "pending")
    subject_id = _to_int(request.args.get("subject_id"))
    difficulty = _to_int(request.args.get("difficulty"))
    
    # 解析分页参数
    page = max(_to_int(request.args.get("page", 1), 1), 1)
    page_size = max(min(_to_int(request.args.get("page_size", 10), 10), 100), 1)
    limit = request.args.get("limit")  # 兼容旧版 limit 参数
    if limit:
        # 如果有 limit 参数，使用 limit（用于复习模式的随机抽题）
        limit = max(1, min(_to_int(limit, 20), 100))
        offset = 0
    else:
        # 使用分页参数
        limit = page_size
        offset = (page - 1) * page_size

    query = Question.query.filter_by(user_id=user_id, is_deleted=False)

    if mode == "important":
        query = query.filter(Question.is_important.is_(True))
    else:
        query = query.filter(Question.review_status == 0)

    if subject_id:
        query = query.filter(Question.subject_id == subject_id)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)

    # 获取总数（仅在使用分页时计算）
    total = None
    if not request.args.get("limit"):
        total = query.count()

    if mode == "random":
        query = query.order_by(func.random())
    elif mode == "difficulty":
        query = query.order_by(Question.difficulty.asc(), Question.created_at.desc())
    else:
        query = query.order_by(Question.created_at.desc())

    results = query.offset(offset).limit(limit).all()
    data = [
        {
            "id": item.id,
            "title": item.title,
            "content": item.content,
            "answer": item.answer,
            "error_reason": item.error_reason,
            "difficulty": item.difficulty,
            "review_count": item.review_count,
            "last_review_at": item.last_review_at.strftime("%Y-%m-%d %H:%M:%S")
            if item.last_review_at
            else None,
            "subject_id": item.subject_id,
            "subject_name": item.subject.name if item.subject else None,
            "mastery_status": item.mastery_status,
        }
        for item in results
    ]
    
    # 如果使用分页，返回分页信息
    if total is not None:
        return Response.success({
            "list": data,
            "total": total,
            "page": page,
            "page_size": page_size
        })
    return Response.success(data)


@reviews_bp.route("/<int:question_id>", methods=["POST"])
def submit_review(question_id: int):
    """提交单题复习结果。"""
    question = Question.query.filter_by(
        id=question_id,
        user_id=g.current_user.id,
        is_deleted=False,
    ).first()
    if not question:
        return Response.not_found("错题不存在或已删除")

    payload = request.get_json(silent=True) or {}
    result = (payload.get("result") or "").strip().lower()
    if result not in {"forgot", "hard", "mastered"}:
        return Response.error("复习结果不合法")

    now = datetime.utcnow()
    question.review_count += 1
    question.last_review_at = now
    
    # 更新掌握状态：forgot（忘记了）、hard（有点难）、mastered（已掌握）
    question.mastery_status = result

    if result == "mastered":
        question.review_status = 1
        question.is_mastered = True
        question.is_important = False
        question.next_review_at = None
    else:
        question.review_status = 0
        question.is_mastered = False
        question.is_important = result == "hard" or question.is_important
        question.next_review_at = now + timedelta(days=1)

    db.session.commit()
    return Response.success(
        {
            "review_count": question.review_count,
            "last_review_at": question.last_review_at.strftime("%Y-%m-%d %H:%M:%S"),
            "review_status": question.review_status,
            "mastery_status": question.mastery_status,
        },
        "复习结果已记录",
    )

