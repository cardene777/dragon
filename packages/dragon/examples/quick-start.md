# dragon quick-start examples

## 1. YAML DSL (人向け、 5 ブロック箇条書き)

```yaml
# examples/auth-flow.yaml
タイトル: User Login
種類: シーケンス
登場人物: User, API, DB
流れ:
  - User → API: POST /login
  - API → DB: SELECT credentials
  - DB → API: rows (成功)
  - API → User: 200 OK (成功)
```

TypeScript から:

```tsx
import { compileText, CdlDiagramView } from "@cardenelabs/dragon";
import { readFileSync } from "node:fs";

const dsl = readFileSync("examples/auth-flow.yaml", "utf-8");
const diagram = compileText(dsl);

export default function AuthFlow() {
  return <CdlDiagramView diagram={diagram} />;
}
```

## 2. JSON DSL (LLM / structured output 向け)

```ts
import { compileJson, CdlDiagramView } from "@cardenelabs/dragon";

const spec = {
  id: "auth-flow",
  topic: "User Login",
  kind: "sequence",
  actors: ["User", "API", "DB"],
  steps: [
    { from: "User", to: "API", label: "POST /login" },
    { from: "API", to: "DB", label: "SELECT credentials" },
    { from: "DB", to: "API", label: "rows", tone: "success" },
    { from: "API", to: "User", label: "200 OK", tone: "success" },
  ],
};

const diagram = compileJson(spec);
```

## 3. flow (フローチャート)

```yaml
タイトル: 決済フロー
種類: フロー
ノード: 受注, 与信, 決済, 完了
流れ:
  - 受注 → 与信: カード確認
  - 与信 → 決済: OK
  - 決済 → 完了: 成功 (成功)
```

## 4. state machine (状態遷移)

```yaml
タイトル: TCP コネクション
種類: 状態遷移
状態: CLOSED, LISTEN, ESTABLISHED, CLOSE_WAIT
遷移:
  - CLOSED → LISTEN: passive open
  - LISTEN → ESTABLISHED: SYN + ACK
  - ESTABLISHED → CLOSE_WAIT: FIN
  - CLOSE_WAIT → CLOSED: close
```

## 5. animated pipeline (rich layered animation)

builder API を直接使う (cdl 経路)、 dragon YAML より細かい制御可能:

```ts
import { diagram, CdlDiagramView } from "@cardenelabs/cdl";

const pipeline = diagram("pipeline", { topic: "ETL パイプライン" })
  .lane("l1", { x: 0, width: 200 })
  .lane("l2", { x: 220, width: 200 })
  .lane("l3", { x: 440, width: 200 })
  .state("p1", { initial: 0 })
  .state("p2", { initial: 0 })
  .state("p3", { initial: 0 })
  .node("extract", {
    lane: "l1", stack: 0, kind: "dyn-wave", title: "抽出",
    subtitle: "{p1}%", w: 180, h: 240,
    shape: { kind: "wave", level: "{p1}", amplitude: 100, frequency: 2.5, waveHeight: 10, fill: "#4e9dc4" },
  })
  .node("transform", {
    lane: "l2", stack: 0, kind: "dyn-wave", title: "変換",
    subtitle: "{p2}%", w: 180, h: 240,
    shape: { kind: "wave", level: "{p2}", amplitude: 100, frequency: 2.5, waveHeight: 10, fill: "#4e9dc4" },
  })
  .node("load", {
    lane: "l3", stack: 0, kind: "dyn-wave", title: "ロード",
    subtitle: "{p3}%", w: 180, h: 240,
    shape: { kind: "wave", level: "{p3}", amplitude: 100, frequency: 2.5, waveHeight: 10, fill: "#22c55e" },
  })
  .edge("extract", "transform", { label: "raw" })
  .edge("transform", "load", { label: "clean" })
  .phase("p1", { duration: 1500, title: "抽出中", body: "" }, (p) =>
    p.activate("extract").tween("p1", 0, 100).badge("抽出")
  )
  .phase("p2", { duration: 1500, title: "変換中", body: "" }, (p) =>
    p.activate("extract", "transform").tween("p2", 0, 100).badge("変換")
  )
  .phase("p3", { duration: 1500, title: "ロード完了", body: "" }, (p) =>
    p.activate("extract", "transform", "load").tween("p3", 0, 100).badge("完了")
  )
  .build();

export default function ETLPipeline() {
  return <CdlDiagramView diagram={pipeline} />;
}
```

## 6. catalog SPA で全実例閲覧

https://github.com/cardene777/dragon の `apps/playground-spa` で 300+ 例が閲覧可能:

- `/catalog/presets` — 定型テンプレート
- `/catalog/cookbook` — 頻出レシピ
- `/catalog/patterns` — 汎用構成パターン
- `/catalog/primitives` — cdl の最小構成
- `/catalog/text-dsl` — YAML/JSON 記法
- `/catalog/animation` — 時間軸の物語
- `/catalog/parts` — 合成用小部品
- `/catalog/styles` — 線と色
- `/catalog/interactive` — user 操作で動く要素

## 参考

- README: 全機能 overview
- CHANGELOG: version 履歴
- ISSUES: バグ報告 / 機能要望 https://github.com/cardene777/dragon/issues
