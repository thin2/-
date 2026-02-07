"""Models for AI 聊天记录."""
from datetime import datetime
from typing import List

from . import db


class AIChatRecord(db.Model):
    """保存每次 AI 聊天对话记录。"""

    __tablename__ = "ai_chat_records"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' 或 'assistant'
    content = db.Column(db.Text, nullable=False)  # 消息内容
    model = db.Column(db.String(64), nullable=True)  # 使用的模型
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", lazy="joined")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "role": self.role,
            "content": self.content,
            "model": self.model,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
        }

    @classmethod
    def get_user_history(cls, user_id: int, limit: int = 50) -> List['AIChatRecord']:
        """获取用户的聊天历史"""
        return cls.query.filter_by(user_id=user_id).order_by(cls.created_at.asc()).limit(limit).all()

