# gantt preset

`gantt` preset は Gantt chart (タスク × 時間軸) を `task` 単位で並べる高位 API です。
mermaid `gantt` に対応します。

各 task は `start` / `end` (期間)、 `owner` (担当者)、 `dependsOn` (依存 task id) を持ち、 依存関係がある場合は自動で edge が引かれます。
sprint planning / release timeline / プロジェクト計画の説明に向きます。

## いつ使うか

`gantt` は project planning / sprint planning の共有に最適です。

- 四半期ごとの release roadmap (Q1 Design → Q2 Build → Q3 Test → Q4 Ship)
- sprint planning (Week 1-2 / Week 3-4 の作業分割)
- multi-team プロジェクトの依存関係を可視化

時刻単位の precise timeline は cdl の chart API では扱えません。
詳細な Gantt が必要なら専用 library (e.g. Bryntum Gantt) を併用してください。

## なぜ専用 preset を分けたか

`task` の依存関係 (`dependsOn`) から edge を自動生成するため、 著者は task の宣言だけで dependency graph が完成します。
低位 API で依存 edge を 1 件ずつ書く必要がなくなります。

## Signature

```ts
gantt({ id: string, topic: string, laneWidth?: number, defaultTone?: Tone })
  .task({ id, title, start: string, end: string, owner?, dependsOn? })
  .build()
```

[preview:presets/gantt-demo]

## subtitle 自動生成

各 task の subtitle に以下が併記されます。

- `<start> → <end>` (例 `Q1 → Q1`)
- `owner: <name>` (指定時のみ、 例 `owner: Designer`)

## 完全な例

```ts
import { gantt } from "@cardenelabs/cdl";

export const releaseTimeline = gantt({ id: "release", topic: "Release timeline" })
  .task({ id: "design", title: "Design", start: "Q1", end: "Q1", owner: "Designer" })
  .task({ id: "build", title: "Build", start: "Q2", end: "Q2", owner: "Eng",
          dependsOn: "design" })
  .task({ id: "test", title: "Test", start: "Q3", end: "Q3", owner: "QA",
          dependsOn: "build" })
  .task({ id: "ship", title: "Ship", start: "Q4", end: "Q4", owner: "PM",
          dependsOn: "test" })
  .build();
```

[preview:presets/gantt-demo]

## 関連

- [flow preset](/docs/cdl/presets/flow) — 依存なしの単純な順次 step
- [flowchart preset](/docs/cdl/presets/flowchart) — 役割別の業務フロー
