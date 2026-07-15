# @cardenelabs/dragon

Dragon は [@cardenelabs/cdl](https://www.npmjs.com/package/@cardenelabs/cdl) engine の上に乗る、 Mermaid 感覚の Text DSL。
箇条書きで書ける宣言的 syntax から animated SVG diagram を生成する。

## Why Dragon

Mermaid は静的、 cdl 直書きは TypeScript builder が必要。
Dragon は両者の中間 ... Mermaid に似た短文 syntax で書きつつ、 cdl の animation engine 上で動く。

- Mermaid 風 syntax (1 行 = 1 step、 `A -> B` 矢印、 box-drawing 不要)
- Mermaid にない animation (state tween / phase highlight / badge)
- 出力は cdl の `CdlDiagram`、 そのまま `CdlDiagramView` 等に渡せる
- engine 部 (layout / render / animation) は cdl に委譲、 dragon は parser + compiler に専念

## Quickstart

```bash
npm install @cardenelabs/dragon @cardenelabs/cdl
```

```ts
import { textDslToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const diagram = textDslToDiagram(`
title: "送金フロー"
type: sequence

actors:
  - Alice
  - Vault: storage
  - Bob

flow:
  - Alice -> Vault: "deposit"
  - Vault -> Bob: "send" (success)
`);

// React で render
<CdlDiagramView diagram={diagram} />
```

## API

**Text DSL (人向け YAML)**
- `textDslToDiagram(src: string): CdlDiagram` ... 一発変換 (v0.4 / v0.5 auto-detect、 recommended entry)
- `parseTextDslV05(src: string): V05ParseResult` ... v0.5 parser を直接呼出 (error 詳細取得)
- `compileToCdl(doc: DslDocument): CdlDiagram` ... AST → CdlDiagram

**JSON DSL (LLM 向け)**
- `jsonToDiagram(json: unknown): CdlDiagram` ... JSON DSL → CdlDiagram、 validation error は throw
- `validateDragonJson(json: unknown): { ok, data | errors }` ... compile なしで validation のみ
- `diagramJsonSchema` ... JSON Schema (Draft 7)、 LLM の tool schema にそのまま注入可能

**Deprecated (2026-12-31 削除予定)**
- `parseTextDsl(src: string): ParseResult` ... v0.4 parser、 `textDslToDiagram` に移行推奨

## LLM 向け JSON DSL

LLM (Anthropic Claude / OpenAI GPT) が structured output で確実に diagram を生成できるよう、 YAML DSL と 1:1 対応する JSON 記法を提供する。

### 最小 example

```ts
import { jsonToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const diagram = jsonToDiagram({
  title: "ログインAPI",
  type: "sequence",
  actors: ["ユーザー", "API", "DB"],
  flow: [
    { from: "ユーザー", to: "API", label: "ログイン要求" },
    { from: "API", to: "DB", label: "ユーザー検索" },
    { from: "DB", to: "API", label: "結果", tone: "success" },
    { from: "API", to: "ユーザー", label: "認証成功", tone: "success" },
  ],
  animation: [
    { step: "call", duration: 1.4, focus: ["ユーザー", "API"] },
    { step: "query", duration: 1.4, focus: ["API", "DB"] },
    { step: "return", duration: 1.4, focus: ["DB", "API"] },
    { step: "ok", duration: 1.4, focus: ["API", "ユーザー"] },
  ],
});
// <CdlDiagramView diagram={diagram} />
```

### Anthropic Claude で LLM に書かせる example

```ts
import Anthropic from "@anthropic-ai/sdk";
import { jsonToDiagram, diagramJsonSchema, validateDragonJson } from "@cardenelabs/dragon";

const client = new Anthropic();

async function generateDiagramFromLLM(userRequest: string, maxRetry = 3) {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userRequest }];
  for (let attempt = 0; attempt < maxRetry; attempt++) {
    const res = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      tools: [{
        name: "create_diagram",
        description: "Create an animated diagram from user's request using Dragon DSL.",
        input_schema: diagramJsonSchema,
      }],
      tool_choice: { type: "tool", name: "create_diagram" },
      messages,
    });
    const toolUse = res.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("no tool_use in LLM response");
    const validation = validateDragonJson(toolUse.input);
    if (validation.ok) {
      return jsonToDiagram(validation.data);
    }
    // retry loop = error path を prompt に注入して LLM に修正させる
    const errorSummary = validation.errors.map((e) => `  ${e.path}: ${e.message}`).join("\n");
    messages.push({ role: "assistant", content: res.content });
    messages.push({
      role: "user",
      content: `The diagram JSON has validation errors:\n${errorSummary}\nPlease fix and retry.`,
    });
  }
  throw new Error(`LLM failed to generate valid diagram after ${maxRetry} attempts`);
}

// 使用例
const diagram = await generateDiagramFromLLM(
  "ユーザーが API 経由で DB に検索をかけて結果を受け取るシーケンス図を作って"
);
```

### OpenAI GPT で structured output に使う場合

```ts
import OpenAI from "openai";
import { jsonToDiagram, diagramJsonSchema } from "@cardenelabs/dragon";

const client = new OpenAI();
const res = await client.chat.completions.create({
  model: "gpt-4o-2024-08-06",
  messages: [{ role: "user", content: "..." }],
  response_format: {
    type: "json_schema",
    json_schema: { name: "diagram", strict: true, schema: diagramJsonSchema },
  },
});
const json = JSON.parse(res.choices[0].message.content!);
const diagram = jsonToDiagram(json);
```

### JSON Schema の場所

- SSOT = `packages/dragon/src/schemas/diagram.json`
- npm 経由取得 = `@cardenelabs/dragon/schemas/diagram.json` (package.json exports)
- TypeScript import = `import { diagramJsonSchema } from "@cardenelabs/dragon"`

### YAML と JSON の 1:1 対応

同じ図を両方の記法で書ける。 人 → YAML、 LLM → JSON が推奨だが、 混在可能。

| YAML | JSON |
|---|---|
| `title: "..."` | `{title: "..."}` |
| `actors: [A, B: kind]` | `{actors: [{name: "A"}, {name: "B", kind: "storage"}]}` |
| `- A -> B: "label"` | `{from: "A", to: "B", label: "label"}` |
| `step: "..." 1.4s` | `{step: "...", duration: 1.4}` |
| `focus: [A, B]` | `{focus: ["A", "B"]}` |

## License

MIT
