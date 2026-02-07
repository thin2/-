"""仪表盘统计相关接口"""
from datetime import datetime, timedelta
from typing import Dict, Any

from flask import Blueprint, g
from sqlalchemy import func

from app.models import db, Question, Subject
from app.utils.response import Response

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/stats", methods=["GET"])
def dashboard_stats():
    """返回仪表盘统计数据：总错题数、科目数量、已复习数、复习完成率等"""
    user_id = g.current_user.id
    
    base_query = Question.query.filter_by(user_id=user_id, is_deleted=False)
    
    # 总错题数
    total_count = base_query.count()
    
    # 科目数量
    subject_count = Subject.query.filter_by(user_id=user_id, is_deleted=False).count()
    
    # 已复习数
    reviewed_count = base_query.filter(Question.review_status == 1).count()
    
    # 复习完成率
    review_rate = round((reviewed_count / total_count * 100) if total_count > 0 else 0, 1)
    
    # 待复习数
    pending_count = base_query.filter(Question.review_status == 0).count()
    
    # 本周新增复习数（从本周一开始）
    today = datetime.utcnow().date()
    week_start = today - timedelta(days=today.weekday())
    week_start_datetime = datetime.combine(week_start, datetime.min.time())
    week_reviewed_count = (
        base_query.filter(
            Question.last_review_at >= week_start_datetime,
            Question.review_status == 1,
        ).count()
    )
    
    data = {
        "total_count": total_count,
        "subject_count": subject_count,
        "reviewed_count": reviewed_count,
        "pending_count": pending_count,
        "review_rate": review_rate,
        "week_reviewed_count": week_reviewed_count,
    }
    return Response.success(data)


@dashboard_bp.route("/subject-distribution", methods=["GET"])
def subject_distribution():
    """返回错题按科目分布数据"""
    user_id = g.current_user.id
    
    # 查询每个科目的错题数量
    results = (
        db.session.query(
            Subject.id,
            Subject.name,
            Subject.color,
            func.count(Question.id).label("count")
        )
        .join(Question, Subject.id == Question.subject_id)
        .filter(
            Subject.user_id == user_id,
            Subject.is_deleted == False,
            Question.user_id == user_id,
            Question.is_deleted == False,
        )
        .group_by(Subject.id, Subject.name, Subject.color)
        .all()
    )
    
    data = [
        {
            "name": result.name,
            "value": result.count,
            "color": result.color,
        }
        for result in results
    ]
    
    return Response.success(data)


@dashboard_bp.route("/review-trend", methods=["GET"])
def review_trend():
    """返回最近7天的复习趋势数据"""
    user_id = g.current_user.id
    today = datetime.utcnow().date()
    
    # 获取最近7天的日期
    dates = []
    counts = []
    for i in range(6, -1, -1):  # 从6天前到今天
        date = today - timedelta(days=i)
        date_start = datetime.combine(date, datetime.min.time())
        date_end = date_start + timedelta(days=1)
        
        count = (
            Question.query.filter_by(user_id=user_id, is_deleted=False)
            .filter(
                Question.last_review_at >= date_start,
                Question.last_review_at < date_end,
            )
            .count()
        )
        
        dates.append(date.strftime("%m/%d"))
        counts.append(count)
    
    data = {
        "dates": dates,
        "counts": counts,
    }
    return Response.success(data)


@dashboard_bp.route("/mastery-status", methods=["GET"])
def mastery_status():
    """返回掌握状态分布数据"""
    user_id = g.current_user.id
    
    base_query = Question.query.filter_by(user_id=user_id, is_deleted=False)
    
    # 统计各掌握状态的数量
    mastered_count = base_query.filter(Question.mastery_status == "mastered").count()
    hard_count = base_query.filter(Question.mastery_status == "hard").count()
    forgot_count = base_query.filter(Question.mastery_status == "forgot").count()
    no_status_count = base_query.filter(
        (Question.mastery_status.is_(None)) | (Question.mastery_status == "")
    ).count()
    
    data = [
        {"name": "已掌握", "value": mastered_count, "status": "mastered"},
        {"name": "有点难", "value": hard_count, "status": "hard"},
        {"name": "忘记了", "value": forgot_count, "status": "forgot"},
        {"name": "未复习", "value": no_status_count, "status": "none"},
    ]
    
    return Response.success(data)

