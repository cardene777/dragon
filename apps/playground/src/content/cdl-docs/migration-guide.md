# Migration Guide ... Builder API → Text DSL

builder API で書かれた既存 diagram を、 Text DSL に段階的に移行するための **How-to** ガイドです。
v0.4 で 6 preset × animation が全動作するため、 ほとんどの diagram は Text DSL でそのまま書き直せます。

> このページは **How-to** です。
> 「既存 builder API code を Text DSL に書き換える」 という具体的 task の手順を示します。
> 文法は [Text DSL Spec](/docs/cdl/text-dsl-spec)、 思想は [Overview](/docs/cdl/README) を参照してください。

## TOC

- [移行が推奨される理由](#移行が推奨される理由)
- [移行例 ... sequence preset](#移行例--sequence-preset)
- [移行例 ... animation 付き (v0.3+)](#移行例--animation-付き-v03)
- [v0.4 移行マップ (6 preset 全対応)](#v04-移行マップ-6-preset-全対応)
- [移行戦略](#移行戦略)
- [よくある質問](#よくある質問)
- [関連](#関連)

## 移行が推奨される理由

まず Text DSL と Builder API のトレードオフを整理します。
どちらが優れているかではなく、 用途で選び分ける構造になっています。

| 観点 | Builder API | Text DSL |
|---|---|---|
| 学習コスト | TypeScript 必須 | 箇条書きで習得可 |
| 非エンジニア | 不可 | 可 |
| LLM 生成 | やや困難 | 容易 (system prompt 提供) |
| 行数 | 8-15 行 | 5-10 行 |
| 型安全 | 完全 | parse 時 hint |
| IDE 補完 | 完全 | なし (将来 LSP 検討) |
| 細かい制御 | 自由 | preset 範囲内 |

「LLM に書いてもらいたい」 「コードを最小限にしたい」 場合は Text DSL、
「IDE 補完で型を見ながら細かく書きたい」 場合は Builder API を選びます。
プロジェクト内で両者を併用することも可能です。

## 移行例 ... sequence preset

最も単純な sequence diagram を、 builder API から Text DSL に書き換える例です。
行数の差と読みやすさを 1 例で確認できます。

### Before (Builder API)

builder API で書かれた sequence のログイン flow です。
chain で 4 step を並べる典型的な書き方です。

```ts
import { sequence } from "@cardenelabs/cdl";

export const login = sequence({
  id: "login",
  topic: "User Login",
  actors: ["User", "API", "DB"],
})
  .step({ from: "User", to: "API", label: "POST /login" })
  .step({ from: "API", to: "DB", label: "SELECT" })
  .step({ from: "DB", to: "API", label: "rows", tone: "success" })
  .step({ from: "API", to: "User", label: "200 OK", tone: "success" })
  .build();
```

各 `step()` の引数 object に `from` / `to` / `label` / `tone` をキー指定しています。
表現力は十分ですが、 何が起きているかを読むには TypeScript の文法理解が必要です。

[preview:presets/seq-demo]

### After (Text DSL)

同じ diagram を Text DSL で書き直したものです。
`textDslToDiagram()` に template string を渡すだけで、 builder API と等価な `CdlDiagram` が得られます。

```ts
import { textDslToDiagram } from "@cardenelabs/cdl";

export const login = textDslToDiagram(`
タイトル: User Login
種類: sequence

登場人物:
  - User
  - API (function)
  - DB (storage)

流れ:
  1. User → API: POST /login
  2. API → DB: SELECT
  3. DB → API: rows (成功)
  4. API → User: 200 OK (成功)
`);
```

行数は 15 行から 12 行に減り、 構造が直感的に読めるようになりました。
import 数は 1 → 1 で同じです。

[preview:presets/seq-demo]

## 移行例 ... animation 付き (v0.3+)

state / tween / phase / badge を含む animation 付きの例です。
boilerplate が多い builder API ほど、 DSL に移行したときの行数削減が大きくなります。

### Before

builder API で書いた送金 animation です。
低位 builder を直接使うため、 各 lane / header / spacer / step box / footer を 1 つずつ宣言します。

```ts
import { diagram } from "@cardenelabs/cdl";

export const transfer = diagram("transfer", { topic: "送金" })
  .lane("alice", { width: 340, label: "Alice", lifeline: true })
  .lane("vault", { width: 340, label: "Vault", lifeline: true })
  .lane("bob", { width: 340, label: "Bob", lifeline: true })
  .node("alice-header", { lane: "alice", stack: 0, kind: "card", title: "Alice" })
  // ... (大量の boilerplate)
  .state("alice残高", { initial: 100 })
  .state("bob残高", { initial: 0 })
  .phase("送金", { duration: 1500, title: "送金", body: "Alice → Bob 10" }, (p) =>
    p.activate("alice-header", "vault-header", "alice-vault")
      .tween("alice残高", 100, 90)
      .tween("bob残高", 0, 10)
      .badge("送金中"))
  .build();
```

省略箇所 (`// ...`) は実コードでは追加で 20+ 行のノード宣言が必要です。
3 actor で 40 行を超えるのが typical です。

[preview:animation/tween-simple]

### After

同じ diagram を Text DSL で書き直したものです。
header / footer / spacer 等の boilerplate は、 DSL compiler が自動生成するため不要です。

```ts
export const transfer = textDslToDiagram(`
タイトル: 送金
種類: sequence

登場人物:
  - Alice
  - Vault (storage)
  - Bob

流れ:
  1. Alice → Vault: deposit
  2. Vault → Bob: send (成功)

アニメーション:
  状態: alice残高 = 100
  状態: bob残高 = 0
  ステップ「送金」 1.5 秒:
    強調: Alice, Vault, Alice→Vault
    遷移: alice残高: 100 → 90
    遷移: bob残高: 0 → 10
    バッジ: 送金中
    説明: Alice → Bob 10
`);
```

行数は 40+ 行から 22 行に半減し、 構造が一目で読めるようになりました。
省略箇所が無くなった分、 全体像の把握も容易です。

[preview:animation/tween-simple]

## v0.4 移行マップ (6 preset 全対応)

builder API の各 preset と、 Text DSL の `種類:` 値の対応表です。
v0.4 で 6 preset 全てに animation 対応が完了しました。

| 用途 | Builder API | Text DSL `種類:` |
|---|---|---|
| UML sequence | `sequence(...)` + `.step(...)` | `種類: sequence` |
| 縦のプロセス | `flow(...)` + `.step(...)` | `種類: flow` |
| 並列 actor | `swimlane(...)` + `.node(...)` | `種類: swimlane` |
| ER 図 | `er(...)` + `.entity(...).relation(...)` | `種類: er` |
| FSM | `stateMachine(...)` + `.state(...).transition(...)` | `種類: state` |
| 構成図 | `topology(...).group(...).add(...).connect(...)` | `種類: topology` |

どの preset でも、 builder API の基本表現は DSL で同等に書けます。
細かい制御だけ builder API が必要 (詳細は次の section) です。

## 移行戦略

一度に全部移行せず、 4 段階に分けて少しずつ進めることを推奨します。
各段階で動作確認しながら進めれば、 regression を防げます。

### 段階 1 ... 新規 diagram は Text DSL で書く

これから追加する図は最初から Text DSL で書いてください。
既存の builder API code は触らず、 新規分だけ DSL に揃えます。
この段階だけでも、 docs site の見た目を統一できます。

### 段階 2 ... 簡単な例から移行

5-10 行の小さい builder 例から Text DSL に書き換えます。
1 つ移行するたびに `pnpm verify:intent` を回し、 declaration と画面の整合を確認します。
小さい例で慣れたら、 大きい diagram に進みます。

### 段階 3 ... animation 付き diagram を Text DSL に

v0.3 / v0.4 で animation 表現が可能になったため、 phase / tween / badge を含む diagram も移行対象に含めます。
特に boilerplate が多い低位 builder の diagram は、 移行効果が大きいです。
1 phase だけの簡単な例から始めて、 複数 phase / 複数 state の例に広げてください。

### 段階 4 ... 細かい制御が必要な diagram のみ builder API を残す

`labelOffsetY` や `routing: "back-detour"` 等の細かい layout 制御が必要な diagram は、 builder API で残します。
これらは v0.5 以降の DSL 拡張で対応予定なので、 それまでは builder API のままで構いません。
プロジェクト全体で「9 割 DSL、 1 割 builder」 程度に収束させるのが現実的です。

## よくある質問

移行を検討する際に頻出する質問を、 3 件まとめました。

### Q: builder API は deprecate されますか？

いいえ。
builder API は v1.0 まで public 維持予定です。
v1.0 以降は段階的に internal 化を検討しますが、 急な breaking change は予定していません。
細かい制御を残したい diagram は、 安心して builder API のままで構いません。

### Q: Text DSL で表現できないケースは？

v0.4 時点で、 以下 4 つは builder API でのみ可能です。
これらは v0.5 以降での DSL 対応を検討中です。

- `labelOffsetX` / `labelOffsetY` ... 細かい label 位置調整
- `routing: "back-detour"` ... back transition の経路指定
- ER entity の `rows: ["id: PK", ...]` ... 列定義 (v0.5 で追加検討)
- topology の複数 group ... 現在は 1 group のみ (v0.5 で追加検討)

DSL で書けない部分だけ builder API で書き、 残りは DSL に揃える、 という混在運用も可能です。
file 単位で書式を統一する必要はありません。

### Q: LLM に生成させた DSL の精度は？

system prompt + 5 few-shot 例で 80%+ の精度を確認しています。
詳細と評価指標は [LLM 生成ガイド](/docs/cdl/text-dsl-llm-guide) を参照してください。

80% を切る場合は、 few-shot 例を依頼内容に近いものに差し替えると精度が上がります。
未宣言 actor 等の parse error は LLM の自己修正 loop で吸収できるため、 実用上は問題ありません。

## 関連

ここからの次の docs を案内します。

- [Text DSL Specification (v0.4)](/docs/cdl/text-dsl-spec) ... 文法詳細
- [LLM 生成ガイド](/docs/cdl/text-dsl-llm-guide) ... LLM に DSL を生成させる手順
- [API Reference (Builder API)](/docs/cdl/reference/api) ... builder API の全仕様
- [CHANGELOG](../../CHANGELOG.md) ... 各 version の変更履歴
