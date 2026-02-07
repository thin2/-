"""AI 对话相关接口（GLM 风格流式实现）。"""
from __future__ import annotations

import json
import threading
import time

from flask import Blueprint, g, request, Response as FlaskResponse, stream_with_context, copy_current_request_context

from app.models import db, AIChatRecord
from app.utils.response import Response
from app.services.llm_client import LLMClient
from app.config import Config

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")
stream_client = LLMClient(api_key=Config.API_KEY, base_url=Config.BASE_URL)
default_model = Config.MODEL
SYSTEM_PROMPT = (
    "你是一名专业的解题助手，专注于帮助学生解决学习中的题目、作业和考试问题。\n"
    "核心要求：\n"
    "1. 只回答与学习、知识点、题目解析相关的内容，忽略闲聊或与学习无关的问题。\n"
    "2. 作答时先简要分析题目，再分步骤给出推导过程，最后总结关键知识点与答案。\n"
    "3. 使用 Markdown 排版，必要时使用公式（LaTeX），语言保持清晰、友好、适合学生。\n"
    "4. 如果题目信息不足，请明确指出需要补充什么内容。\n"
    "5. 若用户刻意偏离学习场景，请礼貌提醒“我是解题助手，请提供具体的学习/题目问题。”"
)


@ai_bp.route("/chat", methods=["POST"])
def chat():
    """对话补全（流式输出）。"""
    try:
        data = request.get_json(silent=True) or {}
        message = (data.get("message") or "").strip()

        if not message:
            return Response.error("消息内容不能为空", code=400, status_code=400)

        if not stream_client or not stream_client.api_key:
            return Response.error("尚未配置 AI API Key，请联系管理员", code=500, status_code=500)

        user_id = g.current_user.id

        def generate():
            full_content = ""
            saved = False
            try:
                messages_history = [{"role": "system", "content": SYSTEM_PROMPT}]
                try:
                    history_records = db.session.query(
                        AIChatRecord.role,
                        AIChatRecord.content,
                        AIChatRecord.created_at,
                    ).filter(
                        AIChatRecord.user_id == user_id
                    ).order_by(
                        AIChatRecord.created_at.desc()
                    ).limit(6).all()

                    history_records = list(reversed(history_records))
                    for record in history_records:
                        messages_history.append({
                            "role": record.role,
                            "content": record.content or "",
                        })
                except Exception as exc:
                    print(f"获取历史记录失败: {exc}")

                user_message = {"role": "user", "content": message}
                messages_history.append(user_message)

                # 直接同步保存用户消息，避免子线程/上下文问题导致插入失败
                try:
                    user_record = AIChatRecord(
                        user_id=user_id,
                        role="user",
                        content=message,
                        model=None,
                    )
                    db.session.add(user_record)
                    db.session.commit()
                except Exception as exc:
                    db.session.rollback()
                    print(f"保存用户聊天记录失败: {exc}")

                model = data.get("model", default_model)
                temperature = data.get("temperature", 0.7)
                max_tokens = data.get("max_tokens", Config.MAX_TOKENS)

                try:
                    yield f"data: {json.dumps({'status': 'connected'})}\n\n"
                except GeneratorExit:
                    return

                stream_generator = stream_client.chat_completion_stream(
                    messages=messages_history,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

                start_time = time.time()
                first_chunk_sent = False

                for chunk in stream_generator:
                    if not chunk.get("success"):
                        error_msg = chunk.get("error", "未知错误")
                        try:
                            yield f"data: {json.dumps({'error': error_msg})}\n\n"
                        except GeneratorExit:
                            return
                        break

                    data_chunk = chunk.get("data", {})
                    choices = data_chunk.get("choices") or []
                    if not choices:
                        continue

                    delta = choices[0].get("delta", {})
                    content = delta.get("content", "")

                    if content:
                        full_content += content
                        if not first_chunk_sent:
                            latency = time.time() - start_time
                            first_chunk_sent = True
                        try:
                            yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"
                        except GeneratorExit:
                            if full_content.strip() and not saved:
                                if save_assistant_record(user_id, full_content.strip(), model):
                                    saved = True
                            return

                    finish_reason = choices[0].get("finish_reason")
                    if finish_reason == "stop":
                        if full_content.strip() and not saved:
                            if save_assistant_record(user_id, full_content.strip(), model):
                                saved = True
                        try:
                            yield f"data: {json.dumps({'content': '', 'done': True, 'full_content': full_content})}\n\n"
                        except GeneratorExit:
                            return
                        break

                if full_content.strip() and not saved:
                    if save_assistant_record(user_id, full_content.strip(), model):
                        saved = True

                try:
                    yield "data: [DONE]\n\n"
                except GeneratorExit:
                    return

            except Exception as exc:  # pylint: disable=broad-except
                if full_content.strip() and not saved:
                    try:
                        save_assistant_record(
                            user_id,
                            full_content.strip() + f"\n\n[错误: {str(exc)}]",
                            model,
                        )
                        saved = True
                    except Exception:
                        pass
                try:
                    yield f"data: {json.dumps({'error': str(exc)})}\n\n"
                    yield "data: [DONE]\n\n"
                except GeneratorExit:
                    return

        return FlaskResponse(
            stream_with_context(generate()),
            mimetype="text/event-stream",
            headers={
                "X-Accel-Buffering": "no",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )

    except Exception as exc:  # pylint: disable=broad-except
        return Response.error(f"请求处理失败: {str(exc)}", code=500, status_code=500)


def save_assistant_record(user_id: int, content: str, model: str | None):
    """保存助手消息；成功返回 True。"""
    try:
        assistant_record = AIChatRecord(
            user_id=user_id,
            role="assistant",
            content=content,
            model=model,
        )
        db.session.add(assistant_record)
        db.session.commit()
        return True
    except Exception as exc:
        db.session.rollback()
        print(f"保存助手聊天记录失败: {exc}")
        return False


@ai_bp.route("/chat/history", methods=["GET"])
def get_chat_history():
    """获取聊天历史记录（纯文本，按时间顺序）。"""
    try:
        limit = int(request.args.get("limit", 10))
        records = AIChatRecord.get_user_history(
            user_id=g.current_user.id,
            limit=limit,
        )
        messages = [{
            "role": record.role,
            "content": record.content or "",
            "created_at": record.created_at.isoformat() if record.created_at else None,
        } for record in records]
        return Response.success({"messages": messages})
    except Exception as exc:  # pylint: disable=broad-except
        return Response.error(f"获取历史记录失败：{str(exc)}")


@ai_bp.route("/chat/history", methods=["DELETE"])
def delete_chat_history():
    """删除当前用户的所有聊天历史记录。"""
    try:
        deleted_count = AIChatRecord.query.filter_by(user_id=g.current_user.id).delete()
        db.session.commit()
        return Response.success({"deleted_count": deleted_count}, f"已删除 {deleted_count} 条聊天记录")
    except Exception as exc:  # pylint: disable=broad-except
        db.session.rollback()
        return Response.error(f"删除失败：{str(exc)}")


@ai_bp.route("/chat/settings", methods=["GET"])
def get_chat_settings():
    """获取聊天设置，方便前端展示。"""
    try:
        return Response.success({
            "model": default_model,
            "max_tokens": Config.MAX_TOKENS,
            "supports_images": False,
            "streaming": True,
        })
    except Exception as exc:  # pylint: disable=broad-except
        return Response.error(f"获取设置失败：{str(exc)}")