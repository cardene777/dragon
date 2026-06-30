# infrastructure preset

`infrastructure` preset は AWS / GCP / Azure 等の cloud / system 構成図を `col` (列) と `row` (行) の grid で配置する高位 API です。
mermaid `flowchart` の box 配置に対応します。

著者は `node` で kind (cloud / service / database / cache / queue / cdn / backend 等の NodeKind) と col + row を宣言、 `connect` で接続線を引きます。
col ごとに lane が自動生成されるため、 column 並びの構成図 (Frontend → API → DB) を最短宣言で描けます。

## いつ使うか

`infrastructure` は SaaS / web service / serverless architecture の overview を 1 枚で見せるときに最適です。

- AWS / GCP の典型構成 (CloudFront → ALB → ECS → RDS) を一目で示したい
- BFF / Lambda / queue / cache を散在配置するシステム概要を描きたい
- on-prem hybrid (DC + cloud) の 2 zone を col 別に並べたい

包含 (group) を使った階層構造で構成図を描く場合は [topology preset](/docs/cdl/presets/topology) の方が適しています。
`infrastructure` は flat grid 配置に特化しています。

## なぜ専用 preset を分けたか

低位 API で grid 配置すると、 各 col の lane を 1 件ずつ宣言する必要があり、 6 col の構成図で lane 宣言だけで 6 行消費します。
`infrastructure` preset は col 番号から lane を auto 生成するため、 著者は `node` の col + row だけ書けば配置完了します。

> topology との違い ... `topology` は group で container を視覚的に囲み「この 3 element は AWS 内」 のような所属を強調します。 `infrastructure` は所属を持たず、 col + row の格子で配置するシンプル構成。 階層感が要らないシステム overview で軽量に使えます。

## Signature

```ts
infrastructure({ id: string, topic: string, laneWidth?: number, defaultTone?: Tone, defaultStyle?: EdgeStyle })
  .node({ id, kind: NodeKind, title, col: number, row: number, subtitle?, eyebrow? })
  .connect({ from, to, label, sub?, tone?, style? })
  .build()
```

[preview:presets/infra-demo]

## 引数

`infrastructure` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | 図全体の identifier |
| `topic` | `string` | 必須 | 図上部の題名 |
| `laneWidth` | `number` | 任意 | 1 col の幅 px、 default `380` |
| `defaultTone` | `Tone` | 任意 | 全 connect の既定色調 |

`node` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | node id |
| `kind` | `NodeKind` | 必須 | cloud / service / database / cache / queue / cdn 等 |
| `title` | `string` | 必須 | node 名 |
| `col` | `number` | 必須 | 0-indexed の列番号 (左から 0 / 1 / 2 / ...) |
| `row` | `number` | 必須 | 0-indexed の行番号 (同 col 内で stack=row) |
| `subtitle` | `string` | 任意 | 補足 |
| `eyebrow` | `string` | 任意 | 上付き label |

`connect` の引数は `from` / `to` / `label` 必須、 `sub` / `tone` / `style` 任意です。

## 完全な例

```ts
import { infrastructure } from "@cardenelabs/cdl";

export const saasArch = infrastructure({ id: "saas", topic: "SaaS Architecture" })
  .node({ id: "user", kind: "person", title: "User", col: 0, row: 0 })
  .node({ id: "cdn", kind: "cdn", title: "CloudFront", col: 1, row: 0 })
  .node({ id: "alb", kind: "service", title: "ALB", col: 2, row: 0 })
  .node({ id: "app", kind: "service", title: "App", col: 2, row: 1 })
  .node({ id: "db", kind: "database", title: "RDS", col: 3, row: 0 })
  .node({ id: "cache", kind: "cache", title: "Redis", col: 3, row: 1 })
  .connect({ from: "user", to: "cdn", label: "HTTPS" })
  .connect({ from: "cdn", to: "alb", label: "origin" })
  .connect({ from: "alb", to: "app", label: "route" })
  .connect({ from: "app", to: "db", label: "SQL" })
  .connect({ from: "app", to: "cache", label: "GET/SET" })
  .build();
```

[preview:presets/infra-demo]

## 関連

- [topology preset](/docs/cdl/presets/topology) — group + container 包含が必要なら
- [network preset](/docs/cdl/presets/network) — router / switch / firewall + protocol 名で NW topology を描きたい時
- [catalog の presets ページ](/catalog/presets) — 全 preset を visual で一覧
