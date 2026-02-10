# 云函数数据契约（MVP）

> 目标流程：写信 -> 生成取信码 -> 他人凭码取信 -> 可回信。

## 1) sendLetter

- **入参**
  - `content: string` 信件内容（必填）
  - `theme: number` 纸张主题索引（可选）
  - `type: 'root' | 'reply'` 写新信 / 回信（必填）
  - `parentId: string | null` 回信时指向原信或会话（回信必填）

- **出参（result）**
  - `code: 200 | 4xx | 5xx`
  - `msg?: string`
  - `id: string` 新信件 ID
  - `codeValue?: string` 取信码（写新信时返回）

## 2) getLetter

- **入参**
  - `code: string` 取信码（建议固定 6 位）

- **出参（result）**
  - `code: 200 | 404 | 5xx`
  - `msg?: string`
  - `data: {
      _id: string,
      content: string,
      createTime: string,
      fromAlias?: string,
      rootId?: string
    }`

## 3) getDeskTree

- **出参（result）**
  - `code: 200 | 5xx`
  - `msg?: string`
  - `data: {
      tree?: RootNode[],
      roots?: RootNode[]
    }`

前端已兼容 `tree` / `roots` 两种字段，后端建议最终只保留 `tree`。

## 4) RootNode / ConnectionNode / LetterNode

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
  rootId?: string;
  sourceId?: string;
  children: LetterNode[];
}

interface RootNode {
  _id: string;
  title: string;
  createTime: string;
  content?: string;
  replyCount?: number;
  children: ConnectionNode[];
}
```

## 5) 隐私与路由约束

- 页面跳转不再通过 URL 传递信件正文。
- 前端使用临时 `storage` payloadKey 传递页面间大对象，页面消费后即删除。
- URL 仅传递 `id`、`payloadKey` 等轻量字段。
