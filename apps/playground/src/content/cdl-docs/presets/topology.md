# topology preset

`topology` preset は構成図 (deployment diagram、 system architecture diagram のような「何が」 「どこに」 配置されるかを描く図) を `group` (グループ) + `container` (グループ内の要素) + `connect` (要素間の接続) の 3 要素で組み立てる高位 API です。
mermaid `C4` (システム構成記法) や `flowchart` の `subgraph` 並列構成に相当します。

著者は group を宣言して中に container を `.add` し、 group を跨いだ接続は `.connect` で引きます。
group の `lane` (列) 化や container の `stack` (積み順) は engine が auto 計算します。

## いつ使うか

`topology` は階層的な構成を持つ system architecture に最適です。
3 層程度 (Client / Backend / DB) の deployment 図で読みやすさが最大化します。

- AWS / GCP / Azure deployment 図を描きたい
- microservice 構成図を 1 枚にまとめたい
- system architecture (Client / Backend / DB の 3 層) を描きたい

時系列が主役なら [sequence preset](/docs/cdl/presets/sequence)、 並列 actor の workflow なら [swimlane preset](/docs/cdl/presets/swimlane) を選びます。

## なぜ専用 preset を分けたか

低位 API で構成図を作ると、 group ごとに `contain = true` な lane を作って中に node を縦積みする宣言を毎回書くことになり、 5 group の図で 30 行を超えます。
`topology` preset は group / container / connect の 3 つの操作だけに API を絞り、 著者が「どこに何があるか」 と「何が何と繋がるか」 だけを宣言する形に圧縮しています。

> mermaid との違い ... mermaid `C4` は専用の DSL ですが、 cdl `topology` は通常の TypeScript として書けて、 IDE の補完と型 check が効きます。

## Signature

::: tabs

@@@ humans 👤 For humans

`topology` 図は v0.5 Text DSL で `type: topology` を指定し、 `actors` に container を flat に並べ、 `flow` で container 間の接続を書きます。

```text
title: "<deployment 題名>"
type: topology

actors:
  - <Container 1>: <kind>
  - <Container 2>: <kind>
  - <Container 3>: <kind>

flow:
  - <Container 1> -> <Container 2>: "<label>"
  - <Container 2> -> <Container 3>: "<label>" (<tone>)
```

[preview:presets/topo-demo]

v0.5 Text DSL では container を flat に並べ、 group (枠付き lane) や container の縦 stack は engine に委ねます。
階層的な group (Client 内の Browser、 AWS 内の ALB / ECS / RDS 等) を作りたい場合は本ページ末尾の「API Reference (chain API)」 section を参照してください。

@@@ llm 🤖 For LLM

```yaml
fn: topology(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      groupWidth: { type: number, optional: true, default: 460, range: [280, 720] }
      defaultTone: { type: Tone, optional: true }
      defaultStyle: { type: EdgeStyle, optional: true }
returns: TopologyBuilder { group, connect, build }
typical_use:
  - "AWS / GCP / Azure deployment diagram with 3-5 groups"
  - "microservice topology with hierarchical containers"
  - "3-tier system architecture (Client / Backend / DB)"
constraints:
  - "group(id, opts) is positional (id 1st, opts 2nd), unlike sequence / flow which take a single object"
  - "calling .group(id, ...) twice with the same id reuses the existing group and appends containers"
  - ".connect references container ids (not group ids), engine auto-routes cross-group connections"
  - "use labelOffsetX 100-200 px when connect labels collide with nodes"
common_hallucinations:
  - 'topology({ id, topic, groups: [...] }) — no groups property, declare via .group() chain'
  - '.group({ id, label }) — group takes (id, opts) positional, not single object'
  - '.add({ id, title }) — kind is required on TopologyContainer'
  - '.connect({ from, to, label }) — connect takes (from, to, opts) positional, not single object'
  - '.lane("client", { ... }) — no .lane method, use .group() instead'
```

:::

## 引数

`topology` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | 図全体の identifier、 同一 page 内で一意 |
| `topic` | `string` | 必須 | 図上部に描画される題名 |
| `groupWidth` | `number` | 任意 | 1 group の幅 px、 default `460` |
| `defaultTone` | `Tone` | 任意 | 全 connect の既定色調 |
| `defaultStyle` | `EdgeStyle` | 任意 | 全 connect の既定 line style |

`group` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | group identifier、 container は中で `stack` 0, 1, 2... と積まれる |
| `label` | `string` | 必須 | group 上端 heading に出る文字 |

`TopologyContainer` (`.add` の引数) は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | container identifier、 同一図内で一意 |
| `kind` | `NodeKind` | 必須 | 描画 kind (`frontend` / `service` / `database` 等) |
| `title` | `string` | 必須 | container 内に表示される主 label |
| `eyebrow` | `string` | 任意 | title の上に小さく出る副 label |

## 基本例

3 group (Client / AWS / の中の ALB-ECS-RDS 階層) で AWS deployment 図を組む完全例です。

::: tabs

@@@ humans 👤 For humans (JA)

```text
title: "AWS deployment"
type: topology

actors:
  - Browser: frontend
  - ALB: service
  - "ECS Task": service
  - RDS: database

flow:
  - Browser -> ALB: "HTTPS"
  - ALB -> "ECS Task": "round-robin"
  - "ECS Task" -> RDS: "TCP 5432" (success)
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: aws, topic: "AWS deployment" }
groups:
  - id: client
    label: Client
    contains:
      - { id: browser, kind: frontend, title: Browser }
  - id: aws
    label: AWS
    contains:
      - { id: alb, kind: service,  title: ALB,        eyebrow: "Load Balancer" }
      - { id: ecs, kind: service,  title: "ECS Task", eyebrow: Container }
      - { id: rds, kind: database, title: RDS,        eyebrow: Postgres }
connects:
  - { from: browser, to: alb, label: HTTPS,        sub: "TLS 1.3" }
  - { from: alb,     to: ecs, label: round-robin }
  - { from: ecs,     to: rds, label: "TCP 5432",   sub: pgbouncer, tone: success, labelOffsetX: 150 }
intent: Client / AWS の 2 group + AWS 内 ALB/ECS/RDS 縦積み、 cross-group 接続は engine auto routing
```

:::

[preview:presets/topo-demo]

v0.5 Text DSL は 4 つの actor を flat に並べて 3 本の edge で繋ぎます。
`group` (枠付き lane で container を縦積み) / `sub` (補助 label) / `labelOffsetX` (label 位置の x 方向 offset) を細かく制御したい場合は下記 chain API を使ってください。

## API Reference (chain API)

v0.5 Text DSL では `group` (container の縦積み枠) と `connect.sub` / `connect.labelOffsetX` を表現できないため、 階層的な topology を組みたい場合は以下の chain API で宣言します。

`topology` 関数の signature と builder の interface は以下のとおりです。

```ts
topology({
  id: string;
  topic: string;
  groupWidth?: number;        // 1 group の幅、 default 460
  defaultTone?: Tone;
  defaultStyle?: EdgeStyle;
}): TopologyBuilder

interface TopologyBuilder {
  group(id: string, opts: { label: string }): TopologyGroupBuilder;
  connect(from: string, to: string, opts: TopologyConnection): TopologyBuilder;
  build(): CdlDiagram;
}

interface TopologyGroupBuilder {
  add(container: TopologyContainer): TopologyGroupBuilder;
}

interface TopologyContainer {
  id: string;
  kind: NodeKind;
  title: string;
  eyebrow?: string;
}
```

完全な利用例は以下のとおりです。

```ts
import { topology } from "@cardenelabs/cdl";

const aws = topology({ id: "aws", topic: "AWS deployment" });

aws
  .group("client", { label: "Client" })
    .add({ id: "browser", kind: "frontend", title: "Browser" });

aws
  .group("aws", { label: "AWS" })
    .add({ id: "alb", kind: "service",  title: "ALB",      eyebrow: "Load Balancer" })
    .add({ id: "ecs", kind: "service",  title: "ECS Task", eyebrow: "Container" })
    .add({ id: "rds", kind: "database", title: "RDS",      eyebrow: "Postgres" });

aws
  .connect("browser", "alb", { label: "HTTPS", sub: "TLS 1.3" })
  .connect("alb",     "ecs", { label: "round-robin" })
  .connect("ecs",     "rds", { label: "TCP 5432", sub: "pgbouncer", tone: "success", labelOffsetX: 150 });

export const awsDiagram = aws.build();
```

## `group` の役割

`.group(id, { label })` は contain (枠付き) の lane を 1 つ作ります。
直後に `.add(...)` を chain すると、 同 lane 内に `stack` 0, 1, 2... と node を縦に積みます。
group の `label` は lane heading として描画されます。

container を後から追加したい場合は、 同じ `id` で再度 `.group(id, ...)` を呼び出します。
engine が既存の group を再利用して container を append します。

## `connect` の自動 routing

`.connect(from, to, opts)` は edge を 1 本引きます。
group を跨いだ接続 (`browser` → `alb` のような group 外参照) は engine が自動で routing します。

`sub` (補助 label) や `labelOffsetX` (label の x 方向 offset px) で label 位置を微調整できます。
label が他の node と重なる場合は `labelOffsetX` で 100 から 200 px ずらすと読みやすくなります。

## 関連

- [API Reference](/docs/cdl/reference/api#topology) は型定義の正式な SSOT です。
- [swimlane preset](/docs/cdl/presets/swimlane) は構成図でなく並列 workflow を描く場合の選択肢です。
