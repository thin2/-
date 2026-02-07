from flask import Blueprint, abort, render_template
from pathlib import Path

# 创建main_routes蓝图
main_routes = Blueprint('main', __name__)

# 获取项目根目录
ROOT_DIR = Path(__file__).resolve().parent.parent.parent


def _render_static_page(page: str):
    template_path = ROOT_DIR / "templates" / f"{page}.html"
    if not template_path.exists():
        abort(404)
    return render_template(f"{page}.html")


@main_routes.route("/")
@main_routes.route("/login")
def login_page():
    return _render_static_page("login")


@main_routes.route("/register")
def register_page():
    return _render_static_page("register")


# 每个静态 HTML 文件都注册一个同名的路由
TEMPLATE_DIR = ROOT_DIR / "templates"
for template in sorted(TEMPLATE_DIR.glob("*.html")):
    page_name = template.stem
    if page_name in {"login", "register"}:
        continue

    def make_view(name):
        def view():
            return _render_static_page(name)
        view.__name__ = f"{name}_page"
        return view

    main_routes.add_url_rule(f"/{page_name}", view_func=make_view(page_name))
