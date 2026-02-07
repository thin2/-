"""Application data models."""

from flask_sqlalchemy import SQLAlchemy

# 全局 SQLAlchemy 实例
db = SQLAlchemy()

from .user import User  # noqa: E402
from .question import Subject, Question, QuestionOption, QuestionTag  # noqa: E402
from .chat import AIChatRecord  # noqa: E402

__all__ = [
    'db',
    'User',
    'Subject',
    'Question',
    'QuestionOption',
    'QuestionTag',
    'AIChatRecord',
]
