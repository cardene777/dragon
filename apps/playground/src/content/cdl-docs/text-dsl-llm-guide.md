# Text DSL ... LLM Generation Guide (v0.5)

LLM (Claude / GPT / Gemini) に「○○の図を描いて」 とお願いするだけで、 chainome 用の Text DSL を生成してもらうための **How-to** ガイドです。
system prompt + few-shot 例を組み合わせると、 自然文の依頼から DSL を引き出せます。

> このページは **How-to** です。
> 「LLM に DSL を生成させる」 という task の具体的手順を示します。
> 文法仕様そのものは [Text DSL Spec](/docs/cdl/text-dsl-spec) を参照してください。

## TOC

- [使い方 (User 側)](#使い方-user-側)
- [few-shot 例 5 件](#few-shot-例-5-件)
- [prompt template (コピペ用)](#prompt-template-コピペ用)
- [LLM が苦手な点と対策](#llm-が苦手な点と対策)
- [評価指標 (将来追加)](#評価指標-将来追加)
- [関連](#関連)

## 使い方 (User 側)

ChatGPT / Claude / Cursor 等で、 以下のシステムプロンプトを設定してください。
LLM 側でこのプロンプトを context に入れた状態で、 自然文の依頼を投げれば DSL が出てきます。

```
あなたは chainome 用の Text DSL を生成する専門 AI です。
ユーザーの依頼を受けて、 docs/cdl/text-dsl-spec.md 準拠の v0.5 DSL を出力してください。

ルール:
- 必ず `title` / `type` / `actors` / `flow` の 4 ブロックを書く (英語 keyword)
- アニメーションが必要なら `states` + `animation` ブロックも追加
- `type` は sequence / flow / swimlane / er / state / topology / solidity / gantt / class / pie / c4 / mind の 12 preset から選ぶ
- `actors` の種類は `- 名前: kind` colon 形式、 kind は actor / function / storage / event / cdn / service / database / cache / queue 等
- `flow` は `- <from> -> <to>: "<ラベル>"` 形式、 番号 prefix なし
- トーンは (success) (error) (warning) (info) (neutral) から選択
- 日本語ラベルは double quote で囲む
- duration は 1.5s / 1500ms / 2s の英語短縮形
- 親しみやすい日本語で書く (technical writing 風)
- 不明な場合は適切な仮定をして書く (質問しない)
```

最後の「質問しない」 ルールは、 対話往復を減らすための工夫です。
LLM に判断を委ねた方が、 結果として手戻りが少なくなります。

## few-shot 例 5 件

system prompt と一緒に LLM の context に渡すと、 生成精度が大きく向上する 5 つの例を用意しました。
網羅性を意識して、 静止図 / animation 付き / blockchain / 構成図の 4 系統を含めています。

### 例 1 ... 「ログインフロー」

最も基本の sequence 図のリクエストと、 期待する DSL 出力です。
何のひねりも無い defaults case として置いています。

**依頼**: ログインの流れを描いて

**出力**:
```
title: "ログインの流れ"
type: sequence

actors:
  - User
  - APIサーバー: function
  - DB: storage

flow:
  - User -> APIサーバー: "ログイン情報を送る"
  - APIサーバー -> DB: "ユーザー情報を取得" (info)
  - DB -> APIサーバー: "ユーザー情報" (success)
  - APIサーバー -> User: "200 OK + JWT トークン" (success)
```

ラベルはなるべく自然文寄りに書かせています。
trace log のような短い記号ではなく、 動作を読みやすく示すスタイルを推奨します。

### 例 2 ... 「API call with アニメーション」

state / tween / focus / badge / body を網羅した animation の例です。
animation 構文の使い方を、 1 例で全部見せています。

**依頼**: Client が API 経由で Server に 10 送るAPI call フロー、 残高アニメーション付き

**出力**:
```
title: "Client -> Server API call"
type: sequence

actors:
  - Client
  - API: storage
  - Server

flow:
  - Client -> API: "deposit(10)" (info)
  - API -> Server: "send(10)" (success)

states:
  clientBalance: 100
  serverBalance: 0

animation:
  - step: "API call" 1.5s
    focus: [Client, API, Server]
    tween:
      clientBalance: 100 -> 90
      serverBalance: 0 -> 10
    badge: "calling"
    body: "Client の残高が 100 から 90 へ、 Server は 0 から 10 へ"
```

`tween:` で 2 つの state を同時に補間しています。
1 phase 内で複数 state を動かす場合のリファレンスとして有効です。

### 例 3 ... 「permit (EIP-2612 gasless 認可)」

blockchain 固有の用語 (EIP-712 / on-chain / allowance) を含む依頼の例です。
3 phase の sequential animation で、 phase 間で状態が伝播する case を見せています。

**依頼**: ERC20 Permit を使った gasless 認可フロー

**出力**:
```
title: "Permit (EIP-2612 gasless approval)"
type: solidity

actors:
  - Owner
  - Spender: function
  - permit: function
  - allowance: storage

flow:
  - Owner -> Spender: "EIP-712 署名 (off-chain) を送る" (info)
  - Spender -> permit: "relay (signature 添えて呼出)"
  - permit -> allowance: "set allowance" (success)
  - permit -> Spender: "allowance 設定済" (success)

states:
  allowanceValue: 0

animation:
  - step: "sign" 1.5s
    focus: [Owner]
    body: "Owner が EIP-712 typed-data に署名 (gas 不要)"
  - step: "relay" 1.5s
    focus: [Spender, permit]
    body: "Spender が署名を on-chain へ relay"
  - step: "execute" 1.5s
    focus: [permit, allowance]
    tween:
      allowanceValue: 0 -> 100
    badge: "approved"
    body: "permit が allowance を 100 に設定"
```

3 phase それぞれで `focus:` の対象を切り替えることで、 進行に応じたフォーカス移動を表現できます。
EIP-2612 / EIP-712 等の specific な用語は LLM 側が解釈して使い分けています。

### 例 4 ... 「DEX swap (Uniswap V2 風)」

DeFi 系の AMM swap を、 animation 無しで簡潔に表現した例です。
最小限の `actors` + `flow` だけで static 図が成立する case を示しています。

**依頼**: Uniswap V2 風の AMM swap フロー

**出力**:
```
title: "DEX Swap (Uniswap V2 AMM)"
type: sequence

actors:
  - Trader
  - Router: function
  - Pair: function
  - Reserves: storage

flow:
  - Trader -> Router: "swap A -> B" (info)
  - Router -> Pair: "forward"
  - Pair -> Reserves: "update (constant product)" (warning)
  - Pair -> Trader: "tokenB 受領" (success)
```

`Pair -> Reserves` に `(warning)` を付けて、 constant product の invariant 維持を視覚的に強調しています。
トーンによって視覚的な強弱を付けられる、 という参照例です。

### 例 5 ... 「マイクロサービス構成図 (topology)」

`topology` preset を使った構成図の例です。
sequence と違い、 actor が container として配置される場合の例として置いています。

**依頼**: User -> Frontend -> Backend -> DB + Cache の構成図

**出力**:
```
title: "マイクロサービス構成図"
type: topology

actors:
  - User
  - Frontend: service
  - Backend API: service
  - PostgreSQL: database
  - Redis: cache

flow:
  - User -> Frontend: "HTTPS request" (info)
  - Frontend -> Backend API: "REST call"
  - Backend API -> PostgreSQL: "SQL query" (info)
  - Backend API -> Redis: "cache lookup" (info)
  - Redis -> Backend API: "cached value" (success)
```

`service` / `database` / `cache` といった構成図向け NodeKind を、 明示的に colon 形式で指定しています。
`type: topology` を選んだ場合は、 actor よりインフラ系 NodeKind を選ぶよう LLM に促すと精度が上がります。

## prompt template (コピペ用)

system prompt + few-shot 例 + ユーザー依頼を、 1 つの template にまとめた形式です。
そのままコピーして、 LLM の context に貼り付けて使ってください。

```text
# システムプロンプト
あなたは chainome v0.5 Text DSL の生成 AI です。
docs/cdl/text-dsl-spec.md の文法に従い、 依頼内容を DSL に変換してください。

# few-shot 例
[上記 5 例を全部 paste]

# ユーザー依頼
{ユーザーの自然文}
```

LLM の context window が小さい場合は、 few-shot を 5 例から 2-3 例に減らしても構いません。
ただし例 2 (animation) と例 5 (topology) を残すと、 多様性が保てます。

## LLM が苦手な点と対策

実運用で観察された LLM の typical failure mode と、 推奨対策を整理します。
parser 側の robust 化と、 LLM への明示で両側から防いでいます。

| 苦手 | 対策 |
|---|---|
| `animation` の構造 (states / tween / step の関係) | few-shot 例 2 と 3 で詳細パターン提示 |
| 日本語値の引用符忘れ (`title: API call` ではなく `title: "API call"`) | spec で double quote 必須を明記 |
| 12 preset の選択 (sequence vs flow vs topology vs solidity 等) | spec の preset 別解釈表を context に含める |
| 矢印の種類 (-> vs → vs =>) | parser 側で全部正規化、 LLM はどれを使っても OK |
| 未宣言 actor | parser エラーで明確に検知 → LLM に再生成依頼可能 |

未宣言 actor のエラーメッセージは、 そのまま LLM の自己修正 loop に渡せる形式にしています。
parser → LLM のフィードバックループを回せば、 80%+ の精度を確保できます。

## 評価指標 (将来追加)

LLM 生成 DSL の品質を、 機械的に評価する指標を準備中です。
v0.6 以降で実装予定です。

| 指標 | 内容 |
|---|---|
| parse 成功率 | LLM 生成 DSL のうち parse OK 率 |
| 意図一致率 | 生成された diagram がユーザー意図と一致する率 |
| エラー検知率 | 不正 DSL のエラーが appropriate な hint を出す率 |

parse 成功率は機械的に取れる指標、 意図一致率は人手 review が必要な指標です。
両方を組み合わせた benchmark を、 docs に取り込む計画があります。

## 関連

ここからの次の docs を案内します。

- [Text DSL Specification](/docs/cdl/text-dsl-spec) ... 文法詳細
- [Primitives](/docs/cdl/primitives/README) ... DSL が compile される `LaidDiagram` の基本要素
- [Presets](/docs/cdl/presets/README) ... 12 preset 一覧
- [Migration Guide](/docs/cdl/migration-guide) ... builder API から DSL への移行
