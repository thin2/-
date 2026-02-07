# 错题管理系统 API 文档

> 说明：本文档基于当前需求与数据库设计整理，所有接口均遵循 REST 风格，返回统一的 JSON 结构：
>
> ```json
> {
>   "code": 0,               // 业务状态码，0 表示成功
>   "message": "success",    // 描述信息
>   "data": { ... }          // 具体数据
> }
> ```
>
> - 成功返回：`code = 0`
> - 失败返回：`code != 0`，`message` 包含错误原因

## 1. 基本信息

| 项目        | 说明                            |
|-------------|---------------------------------|
| 基础路径    | `/api`                          |
| 数据格式    | `application/json`              |
| 认证方式    | Bearer Token（登录后返回 token） |
| 分页约定    | `page`（页码，默认 1）、`page_size`（每页条数，默认 10） |

- 以下接口除登录、注册外均需在请求头携带：`Authorization: Bearer <token>`
- 时间字段使用 ISO8601 或 `YYYY-MM-DD HH:mm:ss` 字符串

---

## 2. 认证模块

### 2.1 用户登录

- **URL**：`POST /auth/login`
- **说明**：使用用户名 + 密码登录
- **请求参数**

| 字段       | 类型   | 必填 | 说明       |
|------------|--------|------|------------|
| username   | string | 是   | 用户名     |
| password   | string | 是   | 密码       |

- **响应示例**

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "xxxxx",
    "user_info": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "avatar": ""
    }
  }
}
```

### 2.2 用户注册

- **URL**：`POST /auth/register`
- **请求参数**

| 字段       | 类型   | 必填 | 说明                 |
|------------|--------|------|----------------------|
| username   | string | 是   | 用户名（唯一）       |
| password   | string | 是   | 密码（6-10 位）      |

### 2.3 退出登录

- **URL**：`POST /auth/logout`
- **说明**：可选实现，后端如有 token 黑名单可在此处理

---

## 3. 科目管理

### 3.1 获取科目列表
- **URL**：`GET /subjects`
- **说明**：返回当前用户的所有科目

### 3.2 新增科目
- **URL**：`POST /subjects`
- **请求参数**

| 字段       | 类型   | 必填 | 说明           |
|------------|--------|------|----------------|
| name       | string | 是   | 科目名称       |
| color      | string | 否   | 颜色 HEX 值    |
| icon       | string | 否   | Font Awesome 类 |

### 3.3 更新科目
- **URL**：`PUT /subjects/{id}`

### 3.4 删除科目
- **URL**：`DELETE /subjects/{id}`
- **说明**：逻辑删除（`is_deleted = 1`）

---

## 4. 错题管理

### 4.1 获取错题列表
- **URL**：`GET /questions`
- **查询参数**

| 字段          | 类型   | 说明                       |
|---------------|--------|----------------------------|
| keyword       | string | 题目模糊搜索               |
| subject_id    | int    | 科目筛选                   |
| difficulty    | int    | 难度（1/2/3）              |
| question_type | string | 题型（single_choice 等）   |
| start_date    | string | 添加时间起始               |
| end_date      | string | 添加时间结束               |
| page/page_size| int    | 分页                       |

- **响应 data 示例**

```json
{
  "list": [
    {
      "id": 1001,
      "title": "二次函数最值",
      "subject_id": 1,
      "subject_name": "数学",
      "difficulty": 2,
      "question_type": "single_choice",
      "review_status": 0,
      "last_review_at": null,
      "tags": ["函数", "最值"]
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 10
}
```

### 4.2 获取错题详情
- **URL**：`GET /questions/{id}`
- **说明**：返回题目内容、答案、选项（若存在）、标签、复习记录等

### 4.3 新增错题
- **URL**：`POST /questions`
- **请求参数**

| 字段           | 类型        | 必填 | 说明                         |
|----------------|-------------|------|------------------------------|
| title          | string      | 是   | 题目名称                     |
| subject_id     | int         | 是   | 科目 ID                      |
| question_type  | string      | 是   | 题型（single_choice 等）     |
| difficulty     | int         | 是   | 难度（1/2/3）                |
| content        | string      | 是   | 题目内容                     |
| answer         | string      | 是   | 正确答案                     |
| error_reason   | string      | 是   | 错误原因                     |
| options        | array       | 否   | 客观题选项（见下）           |
| tags           | array       | 否   | 标签字符串数组               |

**options 结构（可选）**

```json
[
  { "option_key": "A", "option_text": "3", "is_correct": false },
  { "option_key": "B", "option_text": "4", "is_correct": true }
]
```

### 4.4 更新错题
- **URL**：`PUT /questions/{id}`
- **说明**：与新增字段一致，未传字段默认不变

### 4.5 删除错题
- **URL**：`DELETE /questions/{id}`
- **说明**：逻辑删除

### 4.6 批量导入错题（可选）
- **URL**：`POST /questions/import`
- **说明**：支持 Excel / JSON 批量导入

---

## 5. 复习中心

### 5.1 获取复习任务
- **URL**：`GET /review/tasks`
- **查询参数**

| 字段       | 类型   | 说明                                       |
|------------|--------|--------------------------------------------|
| mode       | string | `random`/`subject`/`difficulty`/`important`|
| subject_id | int    | mode=subject 时必填                        |
| difficulty | int    | mode=difficulty 时必填                     |

- **响应**：返回题目列表及基本信息

### 5.2 提交复习结果
- **URL**：`POST /review/records`
- **请求参数**

| 字段          | 类型   | 必填 | 说明                                  |
|---------------|--------|------|---------------------------------------|
| question_id   | int    | 是   | 题目 ID                               |
| review_result | int    | 是   | 复习结果：1 忘记了 / 2 有点难 / 3 掌握 |
| notes         | string | 否   | 复习备注                              |

---

## 6. 出卷自测

### 6.1 生成试卷
- **URL**：`POST /exams`
- **请求参数**

| 字段           | 类型   | 必填 | 说明                               |
|----------------|--------|------|------------------------------------|
| subject_ids    | array  | 是   | 科目 ID 列表                       |
| question_count | int    | 是   | 题目数量                           |
| difficulties   | array  | 否   | 难度集合                           |
| question_types | array  | 否   | 题型集合                           |
| strategy       | string | 否   | 抽题策略（random/prior_unreviewed 等） |
| time_limit     | int    | 否   | 考试时长（分钟）                   |

- **响应**：返回试卷 ID 及题目列表

### 6.2 提交答卷
- **URL**：`POST /exams/{id}/submit`
- **请求参数**：题目作答列表

### 6.3 获取考试详情
- **URL**：`GET /exams/{id}`
- **说明**：返回成绩、正确率、错题记录等

---

## 7. AI 学习助手

### 7.1 AI 聊天

#### 7.1.1 创建会话
- **URL**：`POST /ai/conversations`
- **请求参数**：`title`（可选）、`model`（可选）

#### 7.1.2 获取会话列表
- **URL**：`GET /ai/conversations`
- **查询参数**：`page/page_size`

#### 7.1.3 删除会话
- **URL**：`DELETE /ai/conversations/{id}`

#### 7.1.4 发送消息
- **URL**：`POST /ai/conversations/{id}/messages`
- **请求参数**

| 字段     | 类型   | 必填 | 说明        |
|----------|--------|------|-------------|
| content  | string | 是   | 消息内容    |

- **响应**：返回 AI 回复消息（流式可使用 SSE 或 WebSocket）

#### 7.1.5 查看会话消息
- **URL**：`GET /ai/conversations/{id}/messages`

### 7.2 AI 解题

#### 7.2.1 提交题目获取解答
- **URL**：`POST /ai/solve`
- **请求参数**

| 字段          | 类型   | 必填 | 说明                         |
|---------------|--------|------|------------------------------|
| subject_id    | int    | 否   | 科目 ID                      |
| question_text | string | 是   | 题目文本                     |
| image_url     | string | 否   | 题目图片                     |

- **响应**：返回思路、解答、答案、知识点数组

#### 7.2.2 保存为错题
- **URL**：`POST /ai/solve/{record_id}/save`
- **说明**：将 AI 结果一键转入错题库，可指定题型与科目

---

## 8. 数据统计

### 8.1 仪表盘卡片数据
- **URL**：`GET /dashboard/stats`
- **响应**：总错题数、已复习、待复习、本周趋势等

### 8.2 图表数据
- **URL**：`GET /statistics/charts`
- **查询参数**：`range`（如 `7d`, `30d`）

### 8.3 分类明细
- **URL**：`GET /statistics/categories`

---

## 9. 个人中心 & 设置

### 9.1 获取个人资料
- **URL**：`GET /profile`

### 9.2 更新个人资料
- **URL**：`PUT /profile`
- **请求参数**：昵称、邮箱、头像、简介

### 9.3 修改密码
- **URL**：`PUT /profile/password`
- **请求参数**：`old_password`, `new_password`

### 9.4 获取系统设置
- **URL**：`GET /settings`

### 9.5 更新系统设置
- **URL**：`PUT /settings`
- **请求参数**：`page_size`, `email_notify`, `system_notify`, `review_remind`

---

## 10. 错误码参考

| 业务码 | HTTP | 说明                         |
|--------|------|------------------------------|
| 0      | 200  | 成功                         |
| 1001   | 400  | 参数错误                     |
| 1002   | 401  | 未登录或 token 失效          |
| 1003   | 403  | 权限不足                     |
| 1004   | 404  | 资源不存在                   |
| 1005   | 409  | 数据冲突（重复、约束失败等） |
| 1099   | 500  | 服务器内部错误               |

---

## 11. 附录：通用约定

- 所有时间字段建议使用 UTC+8 字符串
- 布尔类型统一使用 0/1 表示
- 分页返回格式统一为 `{ list: [], total, page, page_size }`
- 建议前端在请求失败时弹出 `message` 内容

> 文档版本：v1.0  
> 更新日期：2025-03-XX  
> 维护人：开发团队

