# classDiagram preset

`classDiagram` preset は UML class diagram (クラス図) を `class` (クラス) と `relation` (関係) の chain API で組み立てる高位 API です。
mermaid `classDiagram` に対応します。

各 class は `attributes` (属性) と `methods` (メソッド) を rows に持ち、 storage kind で描画されます。
relation は extends / implements / uses / aggregates / composes の 5 種類をサポートします。

## いつ使うか

`classDiagram` は OO 設計や TypeScript / Python の型階層を共有するときに最適です。

- React component の props 階層 (Base → Variant → Specialized)
- DDD の entity / aggregate / value object の関係
- SDK の class 階層 (Client → Resource → Operation)
- 状態管理 store の構造

table の関係を描きたい場合は [er preset](/docs/cdl/presets/er) を使ってください。
`classDiagram` は behaviour (method) を持つ object 設計向けです。

## relation の 5 種類

| type | UML | 用途 |
|---|---|---|
| `extends` | 継承 (実線 + 中空 ▲) | superclass → subclass の type 拡張 |
| `implements` | 実装 (破線 + 中空 ▲) | interface → concrete class |
| `uses` | 使用 (実線 + → ) | 他 class の method を呼ぶ依存 |
| `aggregates` | 集約 (実線 + 中空 ◇) | has-a 関係、 lifecycle 独立 |
| `composes` | 合成 (実線 + 黒 ◆) | has-a 関係、 lifecycle 共有 |

## Signature

```ts
classDiagram({ id: string, topic: string, classWidth?: number, defaultTone?: Tone })
  .class({ id, title, attributes?, methods?, stereotype? })
  .relation({ from, to, type, label?, cardinality?, tone? })
  .build()
```

[preview:presets/class-demo]

## attribute / method の書式

UML 慣習に従い `+` (public) / `-` (private) / `#` (protected) を prefix にできます。

- `+name: string` → public 属性、 type string
- `-id: number` → private 属性
- `+login(): void` → public method、 戻り値 void

`attributes` と `methods` は両方とも optional ですが、 両方あると `─────` の separator が自動挿入されます。

## 完全な例

```ts
import { classDiagram } from "@cardenelabs/cdl";

export const userDomain = classDiagram({ id: "user-domain", topic: "User domain model" })
  .class({
    id: "User",
    title: "User",
    attributes: ["+name: string", "+email: string"],
    methods: ["+login(): void", "+logout(): void"],
  })
  .class({
    id: "Admin",
    title: "Admin",
    attributes: ["+permissions: string[]"],
    methods: ["+banUser(): void"],
    stereotype: "subclass",
  })
  .class({
    id: "Order",
    title: "Order",
    attributes: ["+id: number", "+total: number"],
    methods: ["+pay(): void"],
  })
  .relation({ from: "Admin", to: "User", type: "extends" })
  .relation({ from: "User", to: "Order", type: "aggregates", cardinality: "1..*" })
  .build();
```

[preview:presets/class-demo]

## 関連

- [er preset](/docs/cdl/presets/er) — table の関係を描く時
- [tree preset](/docs/cdl/presets/tree) — シンプルな継承階層なら
