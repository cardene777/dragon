# gantt preset

`gantt` preset は Gantt chart (時間軸上に task bar を並べたプロジェクト進捗図、 mermaid `gantt` 相当) を簡易に表現するための preset です。
現状は専用の時間軸 layout を持たず、 各 task を 1 lane = 1 card として横並びに配置し、 task 間の依存関係を flow の edge で表現する簡略実装です。

## いつ使うか

- ロードマップ / マイルストーン / プロジェクト進捗を 1 枚で示したい
- 四半期 (Q1 / Q2 / Q3) や月単位の task 進行を時系列に並べたい
- 各 task の progress (0-100%) を `states` + `tween` でアニメーション表現したい

完全な Gantt chart (時間軸付き bar / dependency arrow) は将来 PR で専用 layout を追加予定です。
現状は `swimlane` preset と同じ layout 経由で「task = 横並びの card」 として描画されます。

## 最小例

::: tabs

@@@ humans 👤 For humans

```text
title: "ロードマップ"
type: gantt

actors:
  - task1: { kind: card, subtitle: "Q1" }
  - task2: { kind: card, subtitle: "Q2" }
  - task3: { kind: card, subtitle: "Q3" }

flow:
  - task1 -> task2: "depends"
  - task2 -> task3: "depends"

states:
  task1_progress: 0

animation:
  - step: "Q1 進行" 1.2s
    focus: [task1]
    tween:
      task1_progress: 0 -> 100
    badge: "Q1 完了"
```

@@@ llm 🤖 For LLM

```yaml
preset: gantt
intent: "Project roadmap with quarterly tasks"
actors:
  - { id: task1, kind: card, subtitle: "Q1" }
  - { id: task2, kind: card, subtitle: "Q2" }
flow:
  - { from: task1, to: task2, label: depends }
states:
  - { id: task1_progress, initial: 0 }
phases:
  - { id: q1, focus: [task1], tweens: [task1_progress: 0->100] }
constraints:
  - "task kind は card 推奨 (label + subtitle (期間) 表示が中心)"
  - "現状は時間軸 layout なし、 将来 PR で専用 layout 追加予定"
```

:::

## 引数

`gantt` の引数は他 preset と共通です (`title` / `type` / `actors` / `flow` / `states` / `animation`)。
`actors` の `subtitle` に期間 (`"Q1"` / `"2026/06"` 等)、 `value` に進捗率 (`"50%"`) を入れる慣習を推奨します。

## 関連

- [swimlane preset](/docs/cdl/presets/swimlane) ... base layout として利用
- [state primitive](/docs/cdl/primitives/state) ... progress の tween 表現
