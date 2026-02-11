# 云函数数据契约（会话中立版）

> 目标流程：写信 -> 生成取信码 -> 对方取信 -> 首次回信 -> 会话内持续回信。
>
> 会话模型约定：`root` 仅表示会话起点，不承载“我方/对方”归属语义。

## 1) sendLetter

### 入参
- `content: string` 信件内容（必填）
- `theme?: number` 纸张主题索引（可选）
- `type: 'root' | 'reply'` 新建会话 / 回信（必填）
- `parentId: string | null` 回信目标（`type='reply'` 时必填）
- `parentKind?: 'root' | 'letter'` 回信目标类型（`type='reply'` 时建议必填）

### 回信规则
- 新建会话：`type='root'`，`parentId=null`
- 取信后首回：`type='reply'`，`parentKind='letter'`，`parentId=<letterId>`
- 会话内回信：`type='reply'`，`parentKind='root'`，`parentId=<rootId>`

### 出参（result）
- `code: 200 | 4xx | 5xx`
- `msg?: string`
- `id: string` 当前新信 ID
- `rootId: string` 所属会话 ID（统一返回）
- `codeValue?: string` 取信码（仅 `type='root'` 场景）
- `relation?: { parentId: string | null; parentKind?: 'root' | 'letter' }`

## 2) getLetter

### 入参
- `code: string` 取信码（建议固定 6 位）

### 出参（result）
- `code: 200 | 404 | 5xx`
- `msg?: string`
- `data: {
    _id: string;
    content: string;
    createTime: string;
    rootId: string;
    fromAlias?: string;
    direction?: 'inbound' | 'outbound';
  }`

## 3) getDeskTree

### 出参（result）
- `code: 200 | 5xx`
- `msg?: string`
- `data: {
    tree?: RootNode[];
    roots?: RootNode[]; // 兼容字段（过渡期）
  }`

### 字段收敛策略
- 后端最终只保留 `data.tree`。
- 前端在过渡期兼容 `tree` / `roots`。

## 4) 数据结构

```ts
interface LetterNode {
  _id: string;
  type: 'letter';
  content: string;
  summary?: string;
  createTime: string;
  status?: 'unread' | 'read';
  isMe?: boolean;
}

interface ConnectionNode {
  _id: string;
  type: 'bond' | 'new_echo';
  title: string;
  rootId: string;
  sourceId?: string; // 该分支由某封信触发时，指向触发信件 letterId
  children: LetterNode[];
}

interface RootNode {
  _id: string;
  title: string;
  createTime: string;
  originType?: 'inbound' | 'outbound';
  content?: string;
  replyCount?: number;
  children: ConnectionNode[];
}
```

## 5) reviewReply

### 入参
- `replyId: string`
- `action: 'accept' | 'reject'`

### 出参（result）
- `code: 200 | 4xx | 5xx`
- `msg?: string`

### 约束
- 仅用于 `new_echo` 审核流。
- 调用失败不阻断主阅读流程，但应记录日志以便追踪。

## 6) 隐私与路由约束

- 页面跳转不通过 URL 传递正文与大对象。
- 前端通过临时 `storage + payloadKey` 传输页面间大对象，消费后立即删除。
- URL 仅保留轻量字段（例如 `id`、`payloadKey`、`type`）。
