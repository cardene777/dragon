# class preset

`class` preset は UML class diagram (クラス図、 mermaid `classDiagram` 相当) を表現するための preset です。
各 class を 1 actor として配置し、 `subtitle` に attribute、 `rows` に method、 flow の edge で継承 / 関連 (extends / implements / has-a) を表現する慣習です。

## いつ使うか

- オブジェクト指向設計の class 階層を 1 枚で示したい
- 継承 (extends) / 実装 (implements) / 関連 (cardinality 1:N 等) を視覚化したい
- DDD の entity / aggregate / value object の関係を整理したい

現状は専用 UML layout を持たず、 sequence preset と同じ横並び layout で描画される簡略実装です。
完全な UML class layout (上下重ね / インターフェース菱形矢印) は将来 PR で追加予定です。

## 最小例

::: tabs

@@@ humans 👤 For humans

```text
title: "User / Admin"
type: class

actors:
  - User: { kind: card, subtitle: "+name: string", rows: ["+login(): void"] }
  - Admin: { kind: card, subtitle: "+role: string", rows: ["+delete(): void"] }

flow:
  - User -> Admin: "extends"
```

@@@ llm 🤖 For LLM

```yaml
preset: class
intent: "UML class hierarchy with inheritance"
actors:
  - { id: User, kind: card, subtitle: "+name: string", rows: ["+login(): void"] }
  - { id: Admin, kind: card, subtitle: "+role: string", rows: ["+delete(): void"] }
flow:
  - { from: User, to: Admin, label: extends }
constraints:
  - "subtitle = attribute (例 +name: string)、 rows = method 配列"
  - "edge label = extends / implements / has-a / 1:N 等の関係 keyword"
  - "現状は UML 専用 layout なし、 横並び card で表現"
```

:::

## 引数

`class` の引数は他 preset と共通です。
`actors` の `subtitle` に attribute、 `rows` に method 配列を入れる慣習を推奨します。
`flow` の `label` に `"extends"` / `"implements"` / `"has-a"` 等の関係 keyword を、 `cardinality` inline option に `"1:N"` 等を指定します。

## 関連

- [sequence preset](/docs/cdl/presets/sequence) ... base layout として利用
- [er preset](/docs/cdl/presets/er) ... DB schema の entity 関係はこちら
