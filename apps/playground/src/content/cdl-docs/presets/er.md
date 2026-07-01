# er preset

`er` preset は ER 図 (Entity-Relationship diagram、 DB schema を entity と relation で表現する図) を `entity` (テーブル相当) と `relation` (テーブル間の関係) で組み立てる高位 API です。
mermaid `erDiagram` に対応します。

著者は entity の `rows` (カラム配列) を文字列で宣言するだけで、 engine が `storage` kind で表組みを描画し、 `cardinality` (関係多重度) を矢印 label に展開します。

## いつ使うか

`er` は DB schema や entity 間の関係を視覚化したい場合に最適です。
3 から 10 entity 程度の中規模 schema で読みやすさが最大化します。

- DB schema を視覚化したい
- entity 間の cardinality (1 対多 / 多対多 等) を明示したい
- mermaid `erDiagram` の構文を TypeScript で型安全に書きたい

10 entity を超える大規模 schema は、 主要 entity だけ抜粋した複数の図に分割すると読みやすくなります。

## なぜ専用 preset を分けたか

低位 API で entity を描くと、 1 entity ごとに `node` を作って `rows` を手で組んで表組み layout を計算する必要があります。
`er` preset は entity の `rows` を `string[]` (各要素が `"key: value"` 形式の文字列) で受け取り、 表組み layout と key / value の色分けを engine が auto 処理します。

> mermaid との違い ... mermaid `erDiagram` は `USER { int id PK string email }` のような独自構文ですが、 cdl `er` は普通の TypeScript object で書けて IDE 補完が効きます。

## Signature

::: tabs

@@@ humans 👤 人間向け

ER 図は v0.5 Text DSL で `type: er` を指定し、 `actors` に `entity` kind の table を並べ、 `flow` で entity 間の relation を書きます。

```text
title: "<schema 題名>"
type: er

actors:
  - <Entity 1>: entity
  - <Entity 2>: entity

flow:
  - <Entity 1> -> <Entity 2>: "<relation name>"
```

[preview:presets/er-demo]

v0.5 Text DSL は entity 名と relation の最小宣言に絞っており、 `rows` (カラム配列) と `cardinality` (`1:1` / `1:N` / `N:M` / `0..1` / `1..*`) は表現できません。
table の表組み宣言と cardinality を指定したい場合は本ページ末尾の「API Reference (chain API)」 section を参照してください。

@@@ llm 🤖 LLM向け

```yaml
fn: er(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      entityWidth: { type: number, optional: true, default: 460, range: [280, 720] }
      defaultTone: { type: Tone, optional: true }
returns: ErBuilder { entity, relation, build }
typical_use:
  - "DB schema visualization with 3-10 entities"
  - "explicit cardinality between entities (1:N, N:M, ...)"
  - "type-safe alternative to mermaid erDiagram"
constraints:
  - "rows are 'key: value' strings split at the first colon; key must be ASCII alphanumerics + underscore (no spaces)"
  - "cardinality is a fixed union of 6 values: 1:1, 1:N, N:1, N:M, 0..1, 1..*"
  - "relation.from / relation.to reference entity ids, not titles"
  - "when label is omitted, cardinality becomes the primary label; when set, cardinality drops to sub label"
  - "for >10 entities, split into multiple focused diagrams"
common_hallucinations:
  - '.entity({ id, title, columns: [...] }) — field is rows, not columns'
  - '.entity({ id, title, rows: [{ name: "id", type: "PK" }] }) — rows is string[], not object[]'
  - 'cardinality: "many-to-many" — must be one of 1:1 / 1:N / N:1 / N:M / 0..1 / 1..*'
  - '.relation({ from, to, type: "1:N" }) — field is cardinality, not type'
  - 'rows: ["user id: PK"] — key cannot contain spaces, use user_id instead'
```

:::

## 引数

`er` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | 図全体の identifier、 同一 page 内で一意 |
| `topic` | `string` | 必須 | 図上部に描画される題名 |
| `entityWidth` | `number` | 任意 | 1 entity の幅 px、 default `460` |
| `defaultTone` | `Tone` | 任意 | 全 relation の既定色調 |

`entity` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | entity identifier、 同一図内で一意 |
| `title` | `string` | 必須 | entity 名 (表組み heading) |
| `rows` | `string[]` | 必須 | カラム配列、 各要素は `"key: value"` 形式 |

`relation` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `from` | `string` | 必須 | 起点 entity id |
| `to` | `string` | 必須 | 終点 entity id |
| `cardinality` | union | 必須 | 関係多重度 (`1:1` / `1:N` / `N:1` / `N:M` / `0..1` / `1..*`) |
| `label` | `string` | 任意 | 関係名 (`"places"` 等)、 未指定なら cardinality が主 label に出る |
| `tone` | `Tone` | 任意 | この relation だけ色調を上書き |

## 基本例

2 entity (`User` / `Order`) と 1 つの 1 対多 relation を組む完全例です。

::: tabs

@@@ humans 👤 人間向け (JA)

```text
title: "User-Order schema"
type: er

actors:
  - User: entity
  - Order: entity

flow:
  - User -> Order: "places"
```

@@@ llm 🤖 LLM向け

```yaml
diagram: { id: schema, topic: "User-Order schema" }
entities:
  - id: user
    label: User
    rows: ["id: PK", "email: string", "createdAt: timestamp"]
  - id: order
    label: Order
    rows: ["id: PK", "userId: FK", "total: number"]
relations:
  - { from: user, to: order, cardinality: "1:N", label: places }
intent: User と Order の 1 対多 relation、 cardinality は sub label に併記
```

:::

[preview:presets/er-demo]

このコードは 2 つの entity を横に並べ、 `User` から `Order` へ `places` という label の矢印を引きます。
v0.5 Text DSL では `rows` (カラム情報) と `cardinality` (多重度) は表現できないので、 詳細な schema 表現が必要な場合は下記 chain API を使ってください。

各 entity は `storage` kind で render され、 `rows` が表組みで表示されます。
`eyebrow` には engine が自動で `"エンティティ"` を付与します。

## API Reference (chain API)

v0.5 Text DSL は entity 名と relation の最小宣言に絞っています。
`rows` (カラム配列) と `cardinality` (1:1 / 1:N / N:M / 0..1 / 1..*) を細かく制御したい場合は、 以下の chain API を使ってください。

`er` 関数の signature と builder の interface は以下のとおりです。

```ts
er({
  id: string;
  topic: string;
  entityWidth?: number;       // 1 entity の幅、 default 460
  defaultTone?: Tone;
}): ErBuilder

interface ErBuilder {
  entity(e: ErEntity): ErBuilder;
  relation(r: ErRelation): ErBuilder;
  build(): CdlDiagram;
}

interface ErEntity {
  id: string;
  title: string;
  rows: string[];             // ["id: PK", "email: string", ...] 形式
}

interface ErRelation {
  from: string;
  to: string;
  cardinality: "1:1" | "1:N" | "N:1" | "N:M" | "0..1" | "1..*";
  label?: string;
  tone?: Tone;
}
```

完全な利用例は以下のとおりです。

```ts
import { er } from "@cardenelabs/cdl";

export const schema = er({ id: "schema", topic: "User-Order schema" })
  .entity({ id: "user",  title: "User",  rows: ["id: PK", "email: string", "createdAt: timestamp"] })
  .entity({ id: "order", title: "Order", rows: ["id: PK", "userId: FK", "total: number"] })
  .relation({ from: "user", to: "order", cardinality: "1:N", label: "places" })
  .build();
```

## `rows` の書き方

`rows` は `"key: value"` 形式の文字列を配列で渡します。
engine が key と value を区別して、 左側 (key) を黒文字、 右側 (value) を orange アクセント色で render します。

::: tabs

@@@ humans 👤 人間向け (JA)

```text
title: "rows example"
type: er

actors:
  - User: entity
  - Order: entity

flow:
  - User -> Order: "places"
```

@@@ llm 🤖 LLM向け

```yaml
rows:
  - "id: PK"               # PK = primary key
  - "userId: FK"           # FK = foreign key
  - "email: string"        # 型情報
  - "total: number"
  - "createdAt: timestamp"
  - "status: enum"
constraints:
  - "key 側 (左) は ASCII 英数字 + underscore のみ、 空白含めると : split 失敗"
  - "value 側 (右) は free text、 engine が orange accent 色で render"
```

:::

[preview:presets/er-demo]

v0.5 Text DSL では `rows` を表現できないため、 PK / FK / 型情報の表組みは下記 chain API で宣言します。
key 側の文字列に空白を含めると engine が `:` を区切りに使えず value 側が空になるので、 key には英数字とアンダースコアだけを使ってください。

```ts
rows: [
  "id: PK",               // PK = primary key
  "userId: FK",           // FK = foreign key
  "email: string",        // 型情報
  "total: number",
  "createdAt: timestamp",
  "status: enum",
]
```

## `relation.cardinality` の意味

`cardinality` (関係多重度、 entity 間の数量関係を示す記号) は 6 種類から選びます。
各値の意味と典型的な用途を以下に示します。

| cardinality | 意味 | 典型例 |
|---|---|---|
| `"1:1"` | 1 対 1 | User と Profile (1 ユーザーに 1 プロフィール) |
| `"1:N"` | 1 対 多 | User と Order (1 ユーザーが複数の注文) |
| `"N:1"` | 多 対 1 | Order と User (`1:N` の逆向き) |
| `"N:M"` | 多 対 多 | User と Role (多対多、 中間テーブル必須) |
| `"0..1"` | 任意 (0 または 1) | User と Avatar (アバター無しユーザーも可) |
| `"1..*"` | 1 以上 | Cart と CartItem (空カート不可) |

`relation` の主 label は `label ?? cardinality` で決まります。
`label` を指定すると主 label にその文字列が出て、 cardinality は sub label に下がります。

## mermaid との対応

mermaid `erDiagram` の主要 syntax を cdl `er` に置き換える対応表です。

| mermaid | cdl |
|---|---|
| `erDiagram` | `er({ id, topic })` |
| `USER \|\|--o{ ORDER : places` | `.relation({ from: "user", to: "order", cardinality: "1:N", label: "places" })` |
| `USER { int id PK string email }` | `.entity({ id: "user", title: "User", rows: ["id: PK", "email: string"] })` |

mermaid の cardinality 記号 (`||--o{` 等) は読みづらいので、 cdl では英字の union type (`"1:N"` 等) に置き換えています。

## 関連

- [API Reference](/docs/cdl/reference/api#er) は型定義の正式な SSOT です。
- [Mermaid Migration Guide](/docs/cdl/overview/mermaid-migration) は mermaid → cdl の変換手順をまとめた移行ガイドです。
