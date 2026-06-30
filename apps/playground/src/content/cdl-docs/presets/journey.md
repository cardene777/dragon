# userJourney preset

`userJourney` preset は user journey map (UX research の journey 図) を `step` 単位で時系列に並べる高位 API です。
mermaid `journey` 構文に対応します。

各 step は `emotion` (delighted / happy / neutral / frustrated / angry の 5 段階) を持ち、 emotion ごとに edge の tone が自動で色分けされます。
`touchpoint` と `opportunity` で詳細 (どこで接点があるか / どこに改善余地があるか) を併記できます。

## いつ使うか

`userJourney` は UX / product research の成果を共有するときに最適です。

- signup / onboarding の手順と感情の起伏を可視化したい
- 既存サービスの摩擦点 (frustrated stage) を team で共有したい
- product designer / PM へ user pain point を見せたい

時系列でなく状態遷移なら [stateMachine preset](/docs/cdl/presets/state-machine) を使ってください。
個別 step の処理 detail は [flow preset](/docs/cdl/presets/flow) が向いています。

## なぜ専用 preset を分けたか

低位 API で journey map を書くと、 emotion の色分けと step の連結 edge を全て手作業で指定する必要があります。
`userJourney` preset は emotion enum から tone を auto 決定 + 前 step → 次 step の edge を自動生成するため、 著者は step を順番に書くだけで journey が完成します。

## Signature

```ts
userJourney({ id: string, topic: string, stepWidth?: number, defaultTone?: Tone })
  .step({ id, title, emotion: "delighted" | "happy" | "neutral" | "frustrated" | "angry",
          touchpoint?, opportunity? })
  .build()
```

[preview:presets/journey-demo]

## emotion → tone 対応

| emotion | tone | 視覚 |
|---|---|---|
| `delighted` | success | 緑、 喜び |
| `happy` | teal | 青緑、 満足 |
| `neutral` | info | 青、 標準 |
| `frustrated` | warning | 黄、 不満 |
| `angry` | error | 赤、 怒り |

## 完全な例

```ts
import { userJourney } from "@cardenelabs/cdl";

export const signupJourney = userJourney({ id: "signup", topic: "Signup journey" })
  .step({ id: "land", title: "Land on /", emotion: "neutral", touchpoint: "Website" })
  .step({ id: "form", title: "Fill signup form", emotion: "frustrated",
          touchpoint: "Form", opportunity: "input UX 改善" })
  .step({ id: "verify", title: "Email verify", emotion: "happy", touchpoint: "Email" })
  .step({ id: "done", title: "Dashboard", emotion: "delighted", touchpoint: "Dashboard" })
  .build();
```

[preview:presets/journey-demo]

## 関連

- [stateMachine preset](/docs/cdl/presets/state-machine) — 状態遷移を主に描きたい時
- [flow preset](/docs/cdl/presets/flow) — emotion なしの単純な step 列
- [funnel preset](/docs/cdl/presets/funnel) — 数値 (count / drop rate) を併記したい時
