# funnel preset

`funnel` preset は marketing / sales funnel (漏斗状の階層図) を `stage` 単位で並べる高位 API です。
mermaid `funnelChart` (community plugin) に対応します。

各 stage は `count` (件数) を持ち、 前 stage との比較で **drop rate** (落下率) が自動計算されて subtitle に表示されます。
Awareness → Consideration → Decision → Action のような段階遷移と数値変化を 1 枚で見せられます。

## いつ使うか

`funnel` は marketing / sales / growth analytics の共有に最適です。

- AARRR (Acquisition / Activation / Retention / Referral / Revenue) の各段階人数を可視化
- signup funnel (Visit → Sign up → Trial → Paid) の drop rate 分析
- support ticket の重要度別流入 (Low → Mid → High) で escalation 率を示す

stage 数が 2-3 件で十分なら単純な数値表で済みます。
6 段以上に増えるなら `funnel` より `chart bar` が見やすいです。

## なぜ専用 preset を分けたか

低位 API で funnel を書くと、 stage 間の drop rate を全て手で計算して表示する必要があります。
`funnel` preset は前 stage との比較で drop rate を自動算出するため、 著者は `count` を入力するだけで「Visit → Sign up で 85% drop」 のような分析情報が subtitle に出力されます。

## Signature

```ts
funnel({ id: string, topic: string, stageWidth?: number, defaultTone?: Tone })
  .stage({ id, title, count: number, subtitle? })
  .build()
```

[preview:presets/funnel-demo]

## subtitle 自動生成

各 stage の subtitle は以下のように自動構成されます。

- 最初の stage ... `10,000 件`
- 2 番目以降 ... `1,500 件 / drop 85.0%`
- `subtitle` を明示指定すれば追記される (`1,500 件 / drop 85.0% / メール認証完了率`)

## 完全な例

```ts
import { funnel } from "@cardenelabs/cdl";

export const conversionFunnel = funnel({ id: "sales", topic: "Conversion funnel" })
  .stage({ id: "visit", title: "Visit", count: 10000 })
  .stage({ id: "signup", title: "Sign up", count: 1500 })
  .stage({ id: "trial", title: "Trial", count: 800 })
  .stage({ id: "paid", title: "Paid", count: 200 })
  .build();
```

[preview:presets/funnel-demo]

## 関連

- [userJourney preset](/docs/cdl/presets/journey) — 数値より emotion を主軸にしたい時
- [chart preset (bar)](/docs/cdl/presets/chart) — 並列比較したい時
- [quadrant preset](/docs/cdl/presets/quadrant) — 2 軸 マトリクスで優先度評価したい時
