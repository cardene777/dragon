# mindMap preset

`mindMap` preset は mind map (中心 topic から放射状に伸びる思考図) を `branch` (枝) で組み立てる高位 API です。
mermaid `mindmap` に対応します。

中心 root topic は `rootId` + `rootTitle` で宣言、 各 branch は `parent` 指定で第 1 階層 / 第 2 階層と展開します。
第 1 階層の branch ごとに 6 色 (accent / teal / success / warning / info / error) が rotation 表示され、 第 2 階層以降は parent の色を継承します。

## いつ使うか

`mindMap` は思考整理 / ブレスト / アイデア整理に最適です。

- プロジェクト構想の枝分かれ (Project → Features / UI design / Launch)
- ブログ記事構成 (Topic → Section A / B / C → Sub points)
- 概念マップ (cdl → Diagram engine / DSL / Visual editor)

階層が一方向で順序が重要な場合は [tree preset](/docs/cdl/presets/tree) のほうが読みやすいです。

## tree との違い

| 観点 | tree | mindMap |
|---|---|---|
| root | 必須 (parent なし) | 必須 (`rootId` 指定) |
| 色分け | edge 全て同色 | 第 1 階層で 6 色 rotation |
| 用途 | 組織図 / file tree | ブレスト / アイデア整理 |
| 階層感 | 階層が明確 | 中心からの放射 |

## Signature

```ts
mindMap({ id: string, topic: string, rootId: string, rootTitle: string,
          branchWidth?: number, defaultTone?: Tone })
  .branch({ id, title, parent, tone?, subtitle? })
  .build()
```

[preview:presets/mind-demo]

## 完全な例

```ts
import { mindMap } from "@cardenelabs/cdl";

export const projectIdeas = mindMap({
  id: "ideas",
  topic: "Project ideas",
  rootId: "root",
  rootTitle: "Project",
})
  .branch({ id: "feat", title: "Features", parent: "root" })
  .branch({ id: "ui", title: "UI design", parent: "root" })
  .branch({ id: "launch", title: "Launch", parent: "root" })
  .branch({ id: "auth", title: "Auth", parent: "feat" })
  .branch({ id: "billing", title: "Billing", parent: "feat" })
  .build();
```

[preview:presets/mind-demo]

## 関連

- [tree preset](/docs/cdl/presets/tree) — 階層が明確な組織図 / file tree
- [classDiagram preset](/docs/cdl/presets/class) — UML 風の構造を示す時
