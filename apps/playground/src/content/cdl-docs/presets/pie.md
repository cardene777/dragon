# pie preset

`pie` preset は円グラフ (mermaid `pie` 相当) を表現するための preset です。
各 slice を 1 actor (`kind: card`) として配置し、 `value` 属性にパーセンテージを宣言します。

## いつ使うか

- シェア / 構成比 / 比率を 1 枚で示したい
- KPI の構成内訳 (新規 / 既存 / 解約 等) を視覚化したい
- 投票 / アンケート結果を表現したい

現状は専用の円グラフ描画 layout を持たず、 topology preset と同じ「全 slice を 1 group 内」 構造で描画される簡略実装です。
完全な円グラフ (角度配置 / 中央 label) は将来 PR で追加予定です。

## 最小例

::: tabs

@@@ humans 👤 For humans

```text
title: "シェア内訳"
type: pie

actors:
  - A: { kind: card, value: "30%" }
  - B: { kind: card, value: "50%" }
  - C: { kind: card, value: "20%" }

states:
  a_share: 30
  b_share: 50

animation:
  - step: "再分配" 1s
    focus: [A, B]
    tween:
      a_share: 30 -> 40
      b_share: 50 -> 40
    badge: "更新"
```

@@@ llm 🤖 For LLM

```yaml
preset: pie
intent: "Share / ratio breakdown with percentage slices"
actors:
  - { id: A, kind: card, value: "30%" }
  - { id: B, kind: card, value: "50%" }
states:
  - { id: a_share, initial: 30 }
phases:
  - { id: rebalance, focus: [A, B], tweens: [a_share: 30->40] }
constraints:
  - "slice kind は card 推奨、 value にパーセンテージを宣言"
  - "現状は円グラフ専用 layout なし、 group 内 card 配置で表現"
```

:::

## 引数

`pie` の引数は他 preset と共通です。
`actors` の `value` 属性 (`"30%"` 等) が slice の数値を表します。
`states` + `animation` で slice 値の増減 animation を表現できます。

## 関連

- [topology preset](/docs/cdl/presets/topology) ... base layout として利用
- [state primitive](/docs/cdl/primitives/state) ... value の tween 表現
