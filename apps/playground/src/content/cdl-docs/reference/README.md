# Reference

`@cardenelabs/cdl` の網羅情報を 1 箇所に集めた section です。
API 仕様と verifier (「目」) の使い方を、 ここからすべて参照できます。

> このページは **Reference** です。
> 正確な定義を引きたい人向けに、 機能ごとに事実を中立的に並べています。
> 「動かしてみたい」 場合は [Quickstart](/docs/cdl/overview/quickstart)、
> 「なぜこう設計したか」 は [Overview](/docs/cdl/README) を参照してください。

## この section の構成

下の 2 file が Reference の本体です。
それぞれ用途が異なるので、 状況に応じて使い分けてください。

| File | 内容 | 想定読者 |
|---|---|---|
| [API Reference](/docs/cdl/reference/api) | 概念中心の API ガイド (builder / 6 preset / 29 NodeKind / 6 Tone / verifier の使い方) | 関数 signature と使い方を一緒に見たい人 |
| [Auto-generated Type API](/docs/cdl/reference/generated/README) | TypeScript source から `typedoc` で自動生成した全 type / interface / function 一覧 | 全 type を網羅的に引きたい人、 API drift を疑う人 |
| [Verifier Guide](/docs/cdl/reference/verifier-guide) | 「目」 (validate / verify:dom / verify:intent) の使い方と検知範囲 | 自動検証を回したい人 |

API Reference は手書きで「概念」 中心、 Auto-generated Type API は機械生成で「網羅性」 中心です。
新規 type を追加した時は `pnpm docs:generate` で再生成してください。

## API 一覧の抜粋

ここでは API の全体像だけを示します。
各 API の引数 / 戻り値 / 例は [API Reference](/docs/cdl/reference/api) に集約しています。

### 低位 builder

`diagram()` から始まる primitive API です。
mermaid の自由記述に相当し、 lane / node / edge / phase を 1 つずつ組み立てます。

```ts
diagram(id, { topic })
  .lane(id, opts)
  .node(id, opts) / .nodes([...])
  .edge(from, to, opts) / .edges([...])
  .state(id, opts)
  .phase(id, opts, build)
  .build()
```

`.build()` で immutable な `CdlDiagram` を返します。
細かい layout 制御が必要な場合は、 この低位 API を直接使います。

[preview:presets/seq-demo]

### 高位 6 preset

mermaid 同等の使い勝手で、 1 関数 + chain で完結する API です。
sequence / flow / swimlane / topology / er / stateMachine の 6 種類を用意しています。

```ts
swimlane({ lanes: [...] })
flow({ ... })
sequence({ actors: [...] })
topology({ ... }).group(...).add(...).connect(...)
er({ ... }).entity(...).relation(...)
stateMachine({ ... }).state(...).transition(...)
```

どの preset も内部で低位 builder に compile されます。
preset の選び方は [API Reference の高位 API 表](/docs/cdl/reference/api) を参照してください。

[preview:presets/seq-demo]

### verifier

cdl が独自に持つ「目」 (作者意図と画面の照合機構) を呼び出す関数群です。
3 経路 (`validate` / `verifyDiagramDom` / `verifyAuthorIntent`) があり、 検証粒度が異なります。

```ts
validate(diagram)
visualValidate(diagram) / visualValidateAll(diagrams)
verifyDiagramDom(page, diagram) / verifyAllDiagramsDom(page, diagrams)
verifyAuthorIntent(page, diagram) / verifyAuthorIntentAll(page, diagrams)
```

関数 signature の詳細は [API Reference](/docs/cdl/reference/api)、
3 経路の役割分担は [Verifier Guide](/docs/cdl/reference/verifier-guide) を参照してください。

## 「目」 の使い方の概要

cdl は他の diagram tool には無い、 **作者意図と実画面の一致を engine 側で自動検証する仕組み** を備えています。
3 つのコマンドで、 静的検証から実画面検証までを段階的にかけられます。

```bash
pnpm validate:diagrams      # 静的 layout 衝突判定
pnpm verify:dom             # render DOM 整合性 (engine 自己整合)
pnpm verify:intent          # 作者意図 ↔ 実画面 (mermaid 的本質)
```

上のコマンドは dev server を起動した状態で実行します。
3 経路の役割分担 / tolerance 設計 / 実コード例は [Verifier Guide](/docs/cdl/reference/verifier-guide) にまとめています。

## 関連 docs

ここから他 section への入口を 1 行ずつ案内します。

- [Overview](/docs/cdl/README) ... docs 全体の index、 cdl の思想と全体像
- [Primitives](/docs/cdl/primitives/README) ... lane / node / edge / state / phase の 5 基本パーツ
- [Presets](/docs/cdl/presets/README) ... 6 preset の完成例
- [Patterns](/docs/cdl/patterns/README) ... 12 種の汎用 pattern (Direct / Passthrough / Branch / Loop / Fan-out / Fan-in 等)
