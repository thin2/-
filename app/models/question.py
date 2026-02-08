"""Models for subjects and questions."""
import json
from datetime import datetime
from typing import List, Optional
from . import db


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), nullable=False, default="#4299e1")
    icon = db.Column(db.String(50), nullable=False, default="fas fa-book")
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    questions = db.relationship("Question", back_populates="subject", lazy="dynamic")

    def to_dict(self) -> dict:
        question_count = (
            Question.query.filter(
                Question.subject_id == self.id,
                Question.user_id == self.user_id,
                Question.is_deleted.is_(False),
            ).count()
        )
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "icon": self.icon,
            "sort_order": self.sort_order,
            "question_count": question_count,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
        }


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)  # 改为可空
    question_type = db.Column(db.String(30), nullable=False, default="single_choice")
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text)
    answer = db.Column(db.Text)
    error_reason = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.Integer, nullable=False, default=2)
    review_status = db.Column(db.Integer, nullable=False, default=0)
    review_count = db.Column(db.Integer, nullable=False, default=0)
    last_review_at = db.Column(db.DateTime)
    next_review_at = db.Column(db.DateTime)
    is_important = db.Column(db.Boolean, nullable=False, default=False)
    is_mastered = db.Column(db.Boolean, nullable=False, default=False)
    mastery_status = db.Column(db.String(20), nullable=True)  # 掌握状态：forgot（忘记了）、hard（有点难）、mastered（已掌握）
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)
    images = db.Column(db.Text, nullable=True)  # JSON格式存储图片URL列表（题目图片）
    error_images = db.Column(db.Text, nullable=True)  # JSON格式存储错误解析图片/文件URL列表
    answer_images = db.Column(db.Text, nullable=True)  # JSON格式存储答案图片/文件URL列表
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subject = db.relationship("Subject", back_populates="questions")
    options = db.relationship(
        "QuestionOption",
        cascade="all, delete-orphan",
        back_populates="question",
        lazy="selectin",
    )
    tags = db.relationship(
        "QuestionTag",
        cascade="all, delete-orphan",
        back_populates="question",
        lazy="selectin",
    )

    def _get_images(self) -> List[str]:
        """获取图片URL列表（题目图片）"""
        if not self.images:
            return []
        try:
            return json.loads(self.images)
        except (json.JSONDecodeError, TypeError):
            return []

    def _set_images(self, image_list: List[str]) -> None:
        """设置图片URL列表（题目图片）"""
        if image_list:
            self.images = json.dumps(image_list)
        else:
            self.images = None

    def _get_error_images(self) -> List[str]:
        """获取错误解析图片/文件URL列表"""
        if not self.error_images:
            return []
        try:
            return json.loads(self.error_images)
        except (json.JSONDecodeError, TypeError):
            return []

    def _get_answer_images(self) -> List[str]:
        """获取答案图片/文件URL列表"""
        if not self.answer_images:
            return []
        try:
            return json.loads(self.answer_images)
        except (json.JSONDecodeError, TypeError):
            return []

    def to_brief_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "subject_color": self.subject.color if self.subject else None,
            "difficulty": self.difficulty,
            "question_type": self.question_type,
            "review_status": self.review_status,
            "mastery_status": self.mastery_status,
            "error_reason": self.error_reason,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "tags": [tag.name for tag in self.tags],
            "images": self._get_images(),
        }

    def to_detail_dict(self) -> dict:
        data = self.to_brief_dict()
        data.update(
            {
                "content": self.content,
                "answer": self.answer,
                "error_reason": self.error_reason,
                "options": [option.to_dict() for option in self.options],
                "review_count": self.review_count,
                "last_review_at": self.last_review_at.strftime("%Y-%m-%d %H:%M:%S") if self.last_review_at else None,
                "next_review_at": self.next_review_at.strftime("%Y-%m-%d %H:%M:%S") if self.next_review_at else None,
                "is_important": self.is_important,
                "is_mastered": self.is_mastered,
                "mastery_status": self.mastery_status,
                "images": self._get_images(),
                "error_images": self._get_error_images(),
                "answer_images": self._get_answer_images(),
            }
        )
        return data


class QuestionOption(db.Model):
    __tablename__ = "question_options"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False)
    option_key = db.Column(db.String(5), nullable=False)
    option_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False, default=False)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    question = db.relationship("Question", back_populates="options")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "option_key": self.option_key,
            "option_text": self.option_text,
            "is_correct": self.is_correct,
            "sort_order": self.sort_order,
        }


class QuestionTag(db.Model):
    __tablename__ = "question_tags"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    question = db.relationship("Question", back_populates="tags")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
        }
