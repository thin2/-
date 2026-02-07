"""出卷自测相关接口"""
from datetime import datetime
from typing import Any, List, Dict

from flask import Blueprint, g, request
from sqlalchemy import func

from app.models import db, Question, Subject
from app.utils.response import Response

exams_bp = Blueprint("exams", __name__, url_prefix="/api/exam")


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@exams_bp.route("/generate", methods=["POST"])
def generate_exam():
    """生成试卷"""
    user_id = g.current_user.id
    payload = request.get_json(silent=True) or {}
    
    # 获取参数
    question_count = _to_int(payload.get("question_count", 20))
    difficulty_mode = payload.get("difficulty_mode", "all")  # all, simple, medium, hard
    question_mode = payload.get("question_mode", "random")  # random, unreviewed, important
    time_limit = _to_int(payload.get("time_limit", 0))  # 分钟，0为不限时

    if question_count < 5 or question_count > 50:
        return Response.error("题目数量应在5-50之间")

    # 构建查询（从所有错题中抽取）
    query = Question.query.filter_by(user_id=user_id, is_deleted=False)
    
    # 难度筛选
    if difficulty_mode == "simple":
        query = query.filter(Question.difficulty == 1)
    elif difficulty_mode == "medium":
        query = query.filter(Question.difficulty == 2)
    elif difficulty_mode == "hard":
        query = query.filter(Question.difficulty == 3)
    # all 不筛选难度
    
    # 出题方式筛选
    if question_mode == "unreviewed":
        query = query.filter(Question.review_status == 0)
    elif question_mode == "important":
        query = query.filter(Question.is_important.is_(True))
    # random 不额外筛选
    
    # 获取总数
    total = query.count()
    if total == 0:
        return Response.error("没有符合条件的错题")
    
    # 随机抽取题目
    actual_count = min(question_count, total)
    questions = query.order_by(func.random()).limit(actual_count).all()
    
    # 构建返回数据
    data = {
        "exam_id": None,  # 暂时不保存试卷记录
        "question_count": actual_count,
        "time_limit": time_limit,
        "questions": [
            {
                "id": q.id,
                "title": q.title,
                "content": q.content,
                "answer": q.answer,
                "difficulty": q.difficulty,
                "subject_id": q.subject_id,
                "subject_name": q.subject.name if q.subject else None,
                "question_type": q.question_type,
            }
            for q in questions
        ],
    }
    
    return Response.success(data, "试卷生成成功")


@exams_bp.route("/submit", methods=["POST"])
def submit_exam():
    """提交答卷并评分"""
    user_id = g.current_user.id
    payload = request.get_json(silent=True) or {}
    
    # 获取参数
    question_ids = payload.get("question_ids", [])  # 题目ID列表
    answers = payload.get("answers", {})  # {question_id: "用户答案"}
    time_used = _to_int(payload.get("time_used", 0))  # 用时（秒）
    
    if not question_ids or not isinstance(question_ids, list):
        return Response.error("题目ID列表不能为空")
    
    # 查询题目
    questions = (
        Question.query.filter_by(user_id=user_id, is_deleted=False)
        .filter(Question.id.in_(question_ids))
        .all()
    )
    
    if len(questions) != len(question_ids):
        return Response.error("部分题目不存在")
    
    # 创建题目映射
    question_map = {q.id: q for q in questions}
    
    # 评分
    details = []
    correct_count = 0
    wrong_count = 0
    unanswered_count = 0
    
    for qid in question_ids:
        question = question_map.get(qid)
        if not question:
            continue
        
        user_answer = (answers.get(str(qid)) or answers.get(qid) or "").strip()
        correct_answer = (question.answer or "").strip()
        
        # 简单的答案比较（不区分大小写，去除空格）
        is_correct = False
        if user_answer and correct_answer:
            is_correct = user_answer.lower().replace(" ", "") == correct_answer.lower().replace(" ", "")
        
        if not user_answer:
            unanswered_count += 1
        elif is_correct:
            correct_count += 1
        else:
            wrong_count += 1
        
        details.append({
            "question_id": question.id,
            "question_title": question.title,
            "my_answer": user_answer or "未作答",
            "correct_answer": correct_answer,
            "is_correct": is_correct,
        })
    
    total = len(details)
    accuracy = round((correct_count / total * 100) if total > 0 else 0, 1)
    
    data = {
        "score": correct_count,
        "total": total,
        "accuracy": accuracy,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "unanswered_count": unanswered_count,
        "time_used": time_used,
        "details": details,
    }
    
    return Response.success(data, "答卷提交成功")


@exams_bp.route("/save-wrong-question", methods=["POST"])
def save_wrong_question():
    """将错题保存到错题本（如果题目不在错题本中）"""
    user_id = g.current_user.id
    payload = request.get_json(silent=True) or {}
    
    question_id = _to_int(payload.get("question_id"))
    error_reason = payload.get("error_reason", "").strip()
    
    if not question_id:
        return Response.error("题目ID不能为空")
    
    # 查询题目
    question = Question.query.filter_by(
        id=question_id,
        user_id=user_id,
        is_deleted=False,
    ).first()
    
    if not question:
        return Response.not_found("题目不存在")
    
    # 如果提供了错误原因，更新错误原因
    if error_reason:
        question.error_reason = error_reason
        db.session.commit()
    
    return Response.success({"question_id": question_id}, "已保存到错题本")

