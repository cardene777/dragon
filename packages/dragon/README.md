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

## 記法に書ける欄

**この節の一覧は検査が実装と突き合わせる** (`test/readme-notation-keys.test.ts`)。
実装に欄が増えてここを直さないと落ちる。

### 最上位のブロック

<!-- notation:top-level:start -->

| 欄          | 何を書くか                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`     | 図の題                                                                                                                                     |
| `type`      | 図種 (`sequence` / `flow` / `swimlane` / `er` / `state` / `topology` / `gantt` / `class` / `mind` / `tree` / `c4` / `solidity` / 図表各種) |
| `actors`    | 箱                                                                                                                                         |
| `flow`      | 矢印                                                                                                                                       |
| `states`    | 状態の初期値                                                                                                                               |
| `values`    | 他の状態から決まる値 (式)                                                                                                                  |
| `animation` | 段                                                                                                                                         |
| `viewport`  | 図全体の大きさと間隔                                                                                                                       |
| `lanes`     | 縦列の見出しと幅                                                                                                                           |
| `groups`    | 縦列を束ねる枠                                                                                                                             |
| `eyebrow`   | 図全体を 1 箱にする図種で、その箱の上に出す小見出し                                                                                        |
| `axes`      | 2 軸で仕分ける図の軸の名前                                                                                                                 |
| `readouts`  | 値を見せる部品 (割合の輪 / 数え上げ / 目盛り)                                                                                              |
| `inputs`    | 読む人が動かすつまみ (すべり / 選び / 入り切り など 14 種)                                                                                 |
| `formulas`  | つまみの値から決まる値 (式。 `values` は段が動かす状態を読み、こちらはつまみを読む)                                                        |
| `events`    | 押下などの出来事で動く仕掛け (相手は名前で指す)                                                                                            |
| `scrolls`   | 巻き上げに応じて進む値 (画面を巻き上げた量から 0 から 1 を作る)                                                                            |
| `bands`     | 動いている間の帯 (順序図。 `- DB: 1..2` の形で段の番号の区間を書く)                                                                        |
| `reveal`    | 矢印をいつ出すか (`phase` = 段が名指しする矢印はその段まで描かない (既定) / `all` = 最初から全部描く)                                      |

<!-- notation:top-level:end -->

### 箱に書ける欄

`- 名前: { 欄: 値, ... }` の形で書く。

<!-- notation:actor:start -->

| 欄              | 何を書くか                                                                     |
| --------------- | ------------------------------------------------------------------------------ |
| `kind`          | 見た目の種別 (`card` / `storage` / `service` / `person` 等、`種類` とも書ける) |
| `subtitle`      | 題の下の補足 (`補足` とも書ける)                                               |
| `eyebrow`       | 題の上の小見出し                                                               |
| `value`         | 箱に出す値 (`値` とも書ける)                                                   |
| `previous`      | 前の時点の値 (`前の値` とも書ける)。 `type: stacked` が 2 本目の帯として描く   |
| `rows`          | 箱の中に並べる行 (`行` とも書ける)                                             |
| `marks`         | 行頭の印 (`印` とも書ける。 `rows` と同じ並び。 ER は `pk` / `fk` / `opt`、状態は `entry` / `exit` / `do` / `internal`) |
| `lane`          | どの縦列に置くか                                                               |
| `stack`         | 縦列の中の何段目に置くか                                                       |
| `initial`       | 状態遷移図で始まりの状態か                                                     |
| `final`         | 状態遷移図で終わりの状態か                                                     |
| `tone`          | 色                                                                             |
| `nodes`         | 見本 (parts) の中の箱を差し替える                                              |
| `touchpoint`    | 体験の道筋で、利用者が触れる場所                                               |
| `opportunity`   | 体験の道筋で、改善の余地                                                       |
| `owner`         | 工程の並びで、担当                                                             |
| `end`           | 工程の並びで、終わりの位置                                                     |
| `posX`          | 置く場所の横位置                                                               |
| `posY`          | 置く場所の縦位置                                                               |
| `posW`          | 箱の幅                                                                         |
| `posH`          | 箱の高さ                                                                       |
| `scale`         | 見本 (parts) の倍率 (`倍率` とも書ける)                                        |
| `shape`         | 箱の中に描く図形 (水位 / 角度 / 半径を状態で動かす、`図形` とも書ける)         |
| `visibleIf`     | その箱を出すかどうかの条件 (`出す条件` とも書ける)                             |
| `title`         | 箱に出す題。 書かなければ名前がそのまま題になる (`題` とも書ける)              |
| `wBind`         | 箱の幅を値に追随させる (状態の名前を `{名前}` の形で書く)                      |
| `hBind`         | 箱の高さを値に追随させる (`wBind` と同じ読み方)                                |
| `opacity`       | 箱の濃さ (0 から 1 の数か、状態の名前)                                         |
| `renderOffsetX` | 描く時だけ箱を横へずらす量 (配置と矢印はずらす前の位置を使う)                  |
| `renderOffsetY` | 描く時だけ箱を縦へずらす量 (`renderOffsetX` と同じ読み方)                      |

<!-- notation:actor:end -->

### 矢印に書ける欄

`- A -> B: "説明" (色, 線種) { 欄: 値, ... }` の形で書く。

<!-- notation:flow:start -->

| 欄               | 何を書くか                                                          |
| ---------------- | ------------------------------------------------------------------- |
| `sub`            | 説明の下の補足                                                      |
| `guard`          | 状態遷移の条件                                                      |
| `cardinality`    | 関係の多重度 (`1:N` 等)                                             |
| `widthBind`      | 線の太さを値に追随させる (状態やつまみの名前を `{名前}` の形で書く) |
| `strokeBind`     | 線の色を値に追随させる (`widthBind` と同じ読み方)                   |
| `dashOffsetBind` | 破線の位置を値に追随させる (流れているように見せる)                 |
| `side`           | 矢印がどの辺から出るか (`top` / `right` / `bottom` / `left`)        |
| `head`           | 矢印の先の形 (`triangle` 継ぐ / `diamond` 持つ / `open` 使う / `crow` 多 / `one` `zero-one` `many` `zero-many` ER の端 / `none` 描かない) |
| `tailHead`       | 出どころ側の端の形 (ER は端ごとに違う個数を示すので両端に要る) |
| `headFill`       | 端の印の塗り (`solid` 塗る / `hollow` 白抜き) |
| `tailHeadFill`   | 出どころ側の印の塗り |
| `relation`       | クラス図の関係の種類 (`extends` 継ぐ / `implements` 満たす / `aggregates` 持つ / `composes` 抱える / `associates` 結ぶ / `uses` 使う)。 書くと線と端の形と塗りと付く側がまとめて決まる |
| `kind`           | 順序図の言づての種類 (`call` 呼ぶ / `return` 返す / `fire` 投げる) |
| `labelOffsetX`   | 説明文の位置を横にずらす                                            |
| `labelOffsetY`   | 説明文の位置を縦にずらす                                            |
| `overlay`        | `true` で説明文を線の上に重ねる (分岐図の条件ラベル用)              |

<!-- notation:flow:end -->

## 記法の癖

### 箱の `lane:` が効く図種は限られる

縦列を並べるために使う図種 (`flow` / `topology` / `swimlane`) では効く。 縦列が骨格その
ものになる図種 (`sequence` は縦列がそのまま時間軸の線) では効かず、知らせが出る。

効く図種でも **全ての箱に書いた時だけ** 効く。 一部だけ書くと、書かなかった箱をどこに
置くか決められないため知らせが出る。

```yaml
type: flow

lanes:
  left: { width: 320 }
  right: { width: 320 }

actors:
  - A: { kind: card, lane: left }
  - B: { kind: card, lane: right }
```

`lanes:` の id は組み立て側が作る形に合わせて、字 / 数 / 下線 / hyphen を受ける
(`lane-idle` のような自動で作られた縦列の幅も書き直せる)。

### 静止した `type: flow` は書いた矢印の端を使わない

この図種は **登場人物を書いた順に鎖状に繋ぐ**。 矢印の説明文は「その箱を to に持つ行」
から拾い、書いた側の端は使わない。

```yaml
type: flow

actors: [A, B, C]

flow:
  - A -> C: "x" # 出来るのは A -> B
  - C -> B: "y" # 出来るのは B -> C
```

書いた端どおりに繋ぎたい時は箱に `lane:` を書く。 縦列を書いた形は別の組み立てを通り、
書いた端がそのまま矢印になる。 端が使われなかった行には知らせが出る。

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
      tools: [
        {
          name: "create_diagram",
          description: "Create an animated diagram from user's request using Dragon DSL.",
          input_schema: diagramJsonSchema,
        },
      ],
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
  "ユーザーが API 経由で DB に検索をかけて結果を受け取るシーケンス図を作って",
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

| YAML                   | JSON                                                    |
| ---------------------- | ------------------------------------------------------- |
| `title: "..."`         | `{title: "..."}`                                        |
| `actors: [A, B: kind]` | `{actors: [{name: "A"}, {name: "B", kind: "storage"}]}` |
| `- A -> B: "label"`    | `{from: "A", to: "B", label: "label"}`                  |
| `step: "..." 1.4s`     | `{step: "...", duration: 1.4}`                          |
| `focus: [A, B]`        | `{focus: ["A", "B"]}`                                   |

箱に書ける項目 (`tone` / `owner` / `posX` 等) は両方の記法で同じ。 一覧は実装
(`INLINE_ACTOR_KEYS`) が持ち、`packages/dragon/test/json-actor-fields.test.ts` が
両入口の一致を確かめる。 ここに一覧を写すと項目が増えた時に取り残されるため書かない。

## License

MIT
