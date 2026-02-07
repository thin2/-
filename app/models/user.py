from datetime import datetime
from typing import Optional

from . import db


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    nickname = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    gender = db.Column(db.String(10), default='保密')
    avatar = db.Column(db.String(255))  # 头像URL
    bio = db.Column(db.Text)  # 个人简介
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now)
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', nickname='{self.nickname}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'nickname': self.nickname,
            'email': self.email,
            'phone': self.phone,
            'gender': self.gender,
            'avatar': self.avatar,
            'bio': self.bio,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def update_profile(self, **kwargs):
        """更新用户资料"""
        for key, value in kwargs.items():
            if hasattr(self, key) and value is not None:
                setattr(self, key, value)
        self.updated_at = datetime.now()
        db.session.commit()
    
    def update_password(self, new_password_hash: str):
        """更新密码"""
        self.password_hash = new_password_hash
        self.updated_at = datetime.now()
        db.session.commit()
    
    @classmethod
    def create(cls, username: str, password_hash: str, nickname: Optional[str] = None) -> 'User':
        user = cls(username=username, password_hash=password_hash, nickname=nickname)
        db.session.add(user)
        db.session.commit()
        return user
    
    @classmethod
    def find_by_username(cls, username: str) -> Optional['User']:
        return cls.query.filter_by(username=username).first()
    
    @classmethod
    def find_by_id(cls, user_id: int) -> Optional['User']:
        return cls.query.get(user_id)

