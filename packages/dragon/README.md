# @cardenelabs/dragon

Dragon は [@cardenelabs/cdl](https://www.npmjs.com/package/@cardenelabs/cdl) engine の上に乗る、 Mermaid 感覚の Text DSL。
箇条書きで書ける宣言的 syntax から animated SVG diagram を生成する。

## Why Dragon

Mermaid は静的、 cdl 直書きは TypeScript builder が必要。
Dragon は両者の中間 ... Mermaid に似た短文 syntax で書きつつ、 cdl の animation engine 上で動く。

- Mermaid 風 syntax (1 行 = 1 step、 `A -> B` 矢印、 box-drawing 不要)
- Mermaid にない animation (state tween / phase highlight / badge)
- 出力は cdl の `CdlDiagram`、 そのまま `CdlDiagramView` 等に渡せる
- engine 部 (layout / render / animation) は cdl に委譲、 dragon は parser + compiler に専念

## Quickstart

```bash
npm install @cardenelabs/dragon @cardenelabs/cdl
```

```ts
import { textDslToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const diagram = textDslToDiagram(`
title: "送金フロー"
type: sequence

actors:
  - Alice
  - Vault: storage
  - Bob

flow:
  - Alice -> Vault: "deposit"
  - Vault -> Bob: "send" (success)
`);

// React で render
<CdlDiagramView diagram={diagram} />
```

## API

- `textDslToDiagram(src: string): CdlDiagram` ... 一発変換 (v0.4 / v0.5 auto-detect)
- `parseTextDslV05(src: string): V05ParseResult` ... v0.5 parser を直接呼出 (error 詳細取得)
- `parseTextDsl(src: string): ParseResult` ... v0.4 parser (deprecated)
- `compileToCdl(doc: DslDocument): CdlDiagram` ... AST → CdlDiagram

## License

MIT
