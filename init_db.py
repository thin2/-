"""脚本方式初始化数据库（只在开发/部署时运行）。"""

import os
from pathlib import Path

from werkzeug.security import generate_password_hash

from app import create_app
from app.config import Config
from app.models import db, User, Subject, Question, QuestionOption, QuestionTag


DB_PATH = Path(Config.ROOT_DIR / "data/app.db")

DEFAULT_SUBJECTS = [
    {"name": "数学", "color": "#4299e1", "icon": "fas fa-calculator"},
    {"name": "语文", "color": "#48bb78", "icon": "fas fa-book"},
    {"name": "英语", "color": "#ed8936", "icon": "fas fa-language"},
    {"name": "物理", "color": "#9f7aea", "icon": "fas fa-atom"},
    {"name": "化学", "color": "#38b2ac", "icon": "fas fa-flask"},
]

SEED_QUESTIONS = [
    {
        "subject": "数学",
        "question_type": "single_choice",
        "title": "一次函数图像斜率",
        "content": "求一次函数 y=3x-2 的斜率。",
        "answer": "斜率为3",
        "error_reason": "忽略了系数就是斜率",
        "difficulty": 1,
    },
    {
        "subject": "数学",
        "question_type": "single_choice",
        "title": "因式分解错误",
        "content": "对 x^2-5x+6 进行因式分解。",
        "answer": "(x-2)(x-3)",
        "error_reason": "常数项符号处理错误",
        "difficulty": 2,
    },
    {
        "subject": "数学",
        "question_type": "essay",
        "title": "二次函数最值",
        "content": "求 f(x)=x^2-4x+1 的最小值。",
        "answer": "最小值 -3",
        "error_reason": "配方法推导错误",
        "difficulty": 2,
    },
    {
        "subject": "数学",
        "question_type": "single_choice",
        "title": "等差数列求和",
        "content": "已知首项2、公差3，求前10项和。",
        "answer": "155",
        "error_reason": "公式代入错位",
        "difficulty": 2,
    },
    {
        "subject": "数学",
        "question_type": "judgement",
        "title": "绝对值不等式",
        "content": "|x-3|<2 的解集是 (1,5)。",
        "answer": "正确",
        "error_reason": "区间端点写成闭区间",
        "difficulty": 1,
    },
    {
        "subject": "数学",
        "question_type": "essay",
        "title": "三角函数恒等式",
        "content": "证明 sin^2x+cos^2x=1。",
        "answer": "利用单位圆定义",
        "error_reason": "推导步骤省略造成逻辑断层",
        "difficulty": 1,
    },
    {
        "subject": "数学",
        "question_type": "single_choice",
        "title": "立体几何体积",
        "content": "正方体棱长2，求体积。",
        "answer": "8",
        "error_reason": "公式记错",
        "difficulty": 1,
    },
    {
        "subject": "数学",
        "question_type": "multiple_choice",
        "title": "导数概念",
        "content": "以下哪些函数可求导：|x|, sinx, e^x, floor(x)。",
        "answer": "sinx,e^x",
        "error_reason": "没有判断可导条件",
        "difficulty": 2,
    },
    {
        "subject": "数学",
        "question_type": "single_choice",
        "title": "概率基础",
        "content": "抛两次硬币恰好一次正面概率？",
        "answer": "0.5",
        "error_reason": "样本空间枚举有误",
        "difficulty": 1,
    },
    {
        "subject": "数学",
        "question_type": "essay",
        "title": "矩阵乘法",
        "content": "简述矩阵乘法定义并举例。",
        "answer": "行乘列加",
        "error_reason": "示例计算错误",
        "difficulty": 2,
    },
    {
        "subject": "数学",
        "question_type": "single_choice",
        "title": "解析几何距离",
        "content": "点(1,2)到直线x+y=4的距离。",
        "answer": "√2/2",
        "error_reason": "距离公式代入错误",
        "difficulty": 3,
    },
    {
        "subject": "数学",
        "question_type": "essay",
        "title": "数列极限",
        "content": "证明 lim(n→∞) (1+1/n)^n=e。",
        "answer": "使用夹逼和单调有界",
        "error_reason": "步骤跳跃",
        "difficulty": 3,
    },
    {
        "subject": "数学",
        "question_type": "single_choice",
        "title": "对数运算",
        "content": "log₂32 的值？",
        "answer": "5",
        "error_reason": "把底写错",
        "difficulty": 1,
    },
    {
        "subject": "数学",
        "question_type": "essay",
        "title": "椭圆标准方程",
        "content": "已知椭圆焦距 6，长轴 10，求方程。",
        "answer": "x^2/25 + y^2/16 =1",
        "error_reason": "a,b 关系混淆",
        "difficulty": 3,
    },
    {
        "subject": "数学",
        "question_type": "single_choice",
        "title": "排列组合",
        "content": "从5人选2人排队数量？",
        "answer": "20",
        "error_reason": "没考虑顺序",
        "difficulty": 2,
    },
    {
        "subject": "语文",
        "question_type": "essay",
        "title": "文言文翻译",
        "content": "翻译“学而不思则罔”。",
        "answer": "学习而不思考就会迷惑",
        "error_reason": "主谓宾顺序错误",
        "difficulty": 2,
    },
    {
        "subject": "语文",
        "question_type": "single_choice",
        "title": "古诗赏析",
        "content": "“孤舟蓑笠翁”描写的意境？",
        "answer": "寂寥淡泊",
        "error_reason": "误判为豪迈",
        "difficulty": 1,
    },
    {
        "subject": "语文",
        "question_type": "essay",
        "title": "议论文结构",
        "content": "说明议论文三段式结构。",
        "answer": "提出论点-分析论证-总结",
        "error_reason": "举例不恰当",
        "difficulty": 1,
    },
    {
        "subject": "语文",
        "question_type": "single_choice",
        "title": "修辞手法",
        "content": "“白发三千丈”是什么修辞？",
        "answer": "夸张",
        "error_reason": "记混夸张和比喻",
        "difficulty": 1,
    },
    {
        "subject": "语文",
        "question_type": "essay",
        "title": "人物描写",
        "content": "分析《孔乙己》人物性格。",
        "answer": "迂腐善良而悲凉",
        "error_reason": "缺少文本引用",
        "difficulty": 2,
    },
    {
        "subject": "语文",
        "question_type": "single_choice",
        "title": "成语辨析",
        "content": "“安然无恙”与哪项同义？",
        "answer": "毫发无损",
        "error_reason": "词义理解偏差",
        "difficulty": 1,
    },
    {
        "subject": "语文",
        "question_type": "essay",
        "title": "现代文阅读",
        "content": "概括文章中心论点。",
        "answer": "围绕环保行动",
        "error_reason": "抓不住关键词",
        "difficulty": 2,
    },
    {
        "subject": "语文",
        "question_type": "single_choice",
        "title": "标点使用",
        "content": "引用句内引用再引用应使用？",
        "answer": "单引号内再套双引号",
        "error_reason": "规则混淆",
        "difficulty": 1,
    },
    {
        "subject": "语文",
        "question_type": "essay",
        "title": "作文立意",
        "content": "题目“重拾”应如何立意？",
        "answer": "从亲情/梦想/责任展开",
        "error_reason": "立意过窄",
        "difficulty": 2,
    },
    {
        "subject": "语文",
        "question_type": "single_choice",
        "title": "文化常识",
        "content": "下列书法家属于唐代？",
        "answer": "颜真卿",
        "error_reason": "记忆错误",
        "difficulty": 1,
    },
    {
        "subject": "英语",
        "question_type": "single_choice",
        "title": "时态选择",
        "content": "I ____ (study) English for five years. 应用时态？",
        "answer": "have studied",
        "error_reason": "用成过去式",
        "difficulty": 1,
    },
    {
        "subject": "英语",
        "question_type": "essay",
        "title": "长难句分析",
        "content": "分析句子结构并翻译。",
        "answer": "包含定语从句",
        "error_reason": "主从结构拆分错误",
        "difficulty": 2,
    },
    {
        "subject": "英语",
        "question_type": "single_choice",
        "title": "虚拟语气",
        "content": "If I ____ you, I would apologize.",
        "answer": "were",
        "error_reason": "使用 was",
        "difficulty": 1,
    },
    {
        "subject": "英语",
        "question_type": "essay",
        "title": "写作开头",
        "content": "如何写好议论文开头？",
        "answer": "提出问题+背景+观点",
        "error_reason": "缺少实例",
        "difficulty": 1,
    },
    {
        "subject": "英语",
        "question_type": "single_choice",
        "title": "词性转换",
        "content": "success 的动词形式？",
        "answer": "succeed",
        "error_reason": "拼写错误",
        "difficulty": 1,
    },
    {
        "subject": "英语",
        "question_type": "essay",
        "title": "完形填空策略",
        "content": "总结做完形填空的方法。",
        "answer": "语境+搭配+语法",
        "error_reason": "没有层次",
        "difficulty": 2,
    },
    {
        "subject": "英语",
        "question_type": "single_choice",
        "title": "阅读主旨",
        "content": "文章主旨通常位于？",
        "answer": "首段或尾段",
        "error_reason": "掉入细节陷阱",
        "difficulty": 2,
    },
    {
        "subject": "英语",
        "question_type": "single_choice",
        "title": "介词短语",
        "content": "be fond ___ 的介词？",
        "answer": "of",
        "error_reason": "记忆混乱",
        "difficulty": 1,
    },
    {
        "subject": "英语",
        "question_type": "essay",
        "title": "口语练习",
        "content": "如何提升口语流利度？",
        "answer": "模仿+输入+输出",
        "error_reason": "策略不明确",
        "difficulty": 1,
    },
    {
        "subject": "英语",
        "question_type": "single_choice",
        "title": "连词使用",
        "content": "我喜欢他，____ 他诚实（because/so）。",
        "answer": "因为用 because",
        "error_reason": "中英思维混用",
        "difficulty": 1,
    },
    {
        "subject": "物理",
        "question_type": "single_choice",
        "title": "牛顿第二定律",
        "content": "F=ma 中 m 单位是？",
        "answer": "kg",
        "error_reason": "写成 N/kg",
        "difficulty": 1,
    },
    {
        "subject": "物理",
        "question_type": "essay",
        "title": "匀加速直线运动",
        "content": "推导 s=vt+1/2at^2。",
        "answer": "积分或运动学方程",
        "error_reason": "推导顺序错",
        "difficulty": 3,
    },
    {
        "subject": "物理",
        "question_type": "single_choice",
        "title": "电场强度",
        "content": "点电荷场强与距离关系？",
        "answer": "E∝1/r^2",
        "error_reason": "误记反比",
        "difficulty": 2,
    },
    {
        "subject": "物理",
        "question_type": "essay",
        "title": "受力分析",
        "content": "画出斜面上物体受力图。",
        "answer": "重力、支持力、摩擦力",
        "error_reason": "漏画分力",
        "difficulty": 2,
    },
    {
        "subject": "物理",
        "question_type": "single_choice",
        "title": "热力学第一定律",
        "content": "ΔU=Q-？",
        "answer": "Q-W",
        "error_reason": "符号写错",
        "difficulty": 2,
    },
    {
        "subject": "物理",
        "question_type": "single_choice",
        "title": "波速公式",
        "content": "v=f·λ，若 f=20Hz, λ=2m，v=?",
        "answer": "40m/s",
        "error_reason": "单位换算错",
        "difficulty": 1,
    },
    {
        "subject": "物理",
        "question_type": "essay",
        "title": "光的折射",
        "content": "说明折射定律并举例。",
        "answer": "n1 sinθ1 = n2 sinθ2",
        "error_reason": "例子解释不完整",
        "difficulty": 1,
    },
]

def remove_existing_db():
    db_dir = DB_PATH.parent
    db_dir.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"removed existing database at {DB_PATH}")


def create_admin_user() -> User:
    user = User.find_by_username("admin")
    if user:
        return user
    password_hash = generate_password_hash("123456")
    return User.create("admin", password_hash, nickname="admin")


def seed_subjects(user_id: int):
    existing = Subject.query.filter_by(user_id=user_id, is_deleted=False).count()
    if existing:
        return
    subjects = []
    for idx, data in enumerate(DEFAULT_SUBJECTS, start=1):
        subjects.append(
            Subject(
                user_id=user_id,
                name=data["name"],
                color=data["color"],
                icon=data["icon"],
                sort_order=idx,
            )
        )
    db.session.add_all(subjects)
    db.session.commit()


def seed_questions(user_id: int):
    existing = Question.query.filter_by(user_id=user_id, is_deleted=False).count()
    if existing >= len(SEED_QUESTIONS):
        return

    # 建立 subject 名称到 ID 的映射
    subjects = {
        s.name: s.id
        for s in Subject.query.filter_by(user_id=user_id, is_deleted=False).all()
    }

    to_insert = []
    for data in SEED_QUESTIONS:
        subject_name = data["subject"]
        subject_id = subjects.get(subject_name)
        if not subject_id:
            continue
        question = Question(
            user_id=user_id,
            subject_id=subject_id,
            question_type=data["question_type"],
            title=data["title"],
            content=data["content"],
            answer=data.get("answer"),
            error_reason=data["error_reason"],
            difficulty=data["difficulty"],
        )
        to_insert.append(question)

    if to_insert:
        db.session.add_all(to_insert)
    db.session.commit()


def init_database():
    remove_existing_db()
    app = create_app()
    with app.app_context():
        db.create_all()
        admin = create_admin_user()
        seed_subjects(admin.id)
        seed_questions(admin.id)
        print("database initialized, admin user ready.")


if __name__ == "__main__":
    init_database()

