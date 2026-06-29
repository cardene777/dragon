# mind preset

`mind` preset は mind map (中心テーマから放射状にアイデアを展開する図、 mermaid `mindmap` 相当) を表現するための preset です。
最初の actor を中央 root、 残り actor を leaf として配置するのが理想ですが、 現状は専用 radial layout を持たず、 topology preset 経由で root → 各 leaf の暗黙 edge を自動生成する簡略実装です。

## いつ使うか

- ブレインストーミング / アイデア展開を 1 枚で示したい
- 概念マップ (中心概念から関連語を展開) を視覚化したい
- 学習資料の章構成 (root = タイトル、 leaf = 章) を整理したい

完全な放射状 layout (root を中央に配置、 leaf を 360 度に分散) は将来 PR で専用 layout を追加予定です。
現状は group 内に actor を縦並びに配置し、 root から各 leaf に edge を引きます。

## 最小例

::: tabs

@@@ humans 👤 For humans

`flow` が空でも、 先頭 actor を root として残り actor に暗黙 edge が自動生成されます。

```text
title: "アイデア展開"
type: mind

actors:
  - Core: { kind: card, subtitle: "中心テーマ" }
  - Idea1: { kind: card, subtitle: "案 1" }
  - Idea2: { kind: card, subtitle: "案 2" }
  - Idea3: { kind: card, subtitle: "案 3" }
```

明示的に edge を宣言したい場合は flow を書きます。

```text
flow:
  - Core -> Idea1: "branch"
  - Core -> Idea2: "branch"
  - Idea1 -> Idea3: "child"
```

@@@ llm 🤖 For LLM

```yaml
preset: mind
intent: "Mind map / brainstorm with central root and leaves"
actors:
  - { id: Core, kind: card, role: root }
  - { id: Idea1, kind: card, role: leaf }
  - { id: Idea2, kind: card, role: leaf }
flow: []   # 空ならroot → leaf を自動生成
constraints:
  - "actors[0] が root、 残り全部 leaf"
  - "flow 宣言が空なら root → 各 leaf の暗黙 edge を自動生成"
  - "現状は専用 radial layout なし、 縦並び card で表現"
```

:::

## 関連

- [topology preset](/docs/cdl/presets/topology) ... base layout として利用
- [flow preset](/docs/cdl/presets/flow) ... 単方向に流れる思考整理はこちら
