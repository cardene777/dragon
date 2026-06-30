# phase

`phase` は diagram を時系列の章 (step) に分割する primitive です。
各 phase で「どの要素を active 強調するか」 「どの state を変化させるか」 「footer に何を表示するか」 を宣言します。
複数の phase を順に並べることで、 物語のように動く animation を構成します。

## API signature

::: tabs

@@@ humans 👤 For humans

```ts
.phase(id: string, opts: { duration?: number; title: string; body: string },
  build: (p: PhaseBuilder) => PhaseBuilder)

interface PhaseBuilder {
  activate(...ids: string[]): PhaseBuilder;                       // active 強調
  tween(stateId: string, from: number, to: number): PhaseBuilder; // 数値線形補間
  set(stateId: string, value: number | string): PhaseBuilder;     // 即時切替
  badge(text: string): PhaseBuilder;                              // phase footer badge
}
```

@@@ llm 🤖 For LLM

```yaml
fn: .phase
args:
  - name: id
    type: string
    required: true
    constraints:
      - "1-32 chars, [a-z0-9-_], unique per diagram"
      - "referenced from phase.activate when chaining phases"
  - name: opts
    type: object
    required: true
    properties:
      duration: { type: number, optional: true, range: [400, 6000], default: 1800, hint: "milliseconds" }
      title: { type: string, required: true, max: 32, hint: "header heading" }
      body: { type: string, required: true, max: 120, hint: "1-2 sentences explainer" }
  - name: build
    type: callback
    required: true
    signature: "(p: PhaseBuilder) => PhaseBuilder"
    methods:
      activate: { args: "...ids: string[]", hint: "node / edge / phase ids to highlight" }
      tween: { args: "stateId: string, from: number, to: number", hint: "linear interpolation over duration" }
      set: { args: "stateId: string, value: number | string", hint: "instant switch, no lerp" }
      badge: { args: "text: string", hint: "footer pill label, max 16 chars" }
returns: DiagramBuilder
typical_use:
  - "step-by-step active highlighting for narrative animation"
  - "state transition (tween for number, set for string flag)"
  - "footer badge as step marker (call / processing / done etc)"
constraints:
  - "build callback must return PhaseBuilder (chain method calls)"
  - "every node should appear in at least one phase.activate to avoid muted-stale warning"
  - "tween chains across phases inherit prior end value as next start value"
  - "set with string value cannot be tweened in any phase"
common_hallucinations:
  - '.phase({ id: ..., title: ..., body: ... }, build) — opts is 2nd positional, build is 3rd'
  - '.phase("p", { ... }) — build callback is required'
  - 'PhaseBuilder.deactivate / .reset — no such methods, muted is the default'
  - '.activate({ ids: [...] }) — variadic string args, not object'
  - 'duration in seconds — duration is milliseconds'
```

:::

[preview:animation/tween-simple]

## 引数

| 引数 | 型 | 必須 | 用途 |
|---|---|---|---|
| `id` | `string` | 必須 | phase を識別する一意の ID |
| `opts.duration` | `number` | 任意 | この phase の動画時間 (ms、 default `1800`) |
| `opts.title` | `string` | 必須 | header 上に表示する phase 見出し |
| `opts.body` | `string` | 必須 | header 下の説明文 (1-2 文) |
| `build` | `(p: PhaseBuilder) => PhaseBuilder` | 必須 | active 要素や state 遷移を宣言する callback |

## PhaseBuilder の method

| method | 用途 |
|---|---|
| `.activate(...ids)` | 渡した node / edge / phase id を active 強調します |
| `.tween(stateId, from, to)` | state を duration 全体で線形補間します |
| `.set(stateId, value)` | state を即時切替します (補間なし) |
| `.badge(text)` | phase footer の右下に小さな pill ラベルを表示します |

## 戻り値

DiagramBuilder を返します。
chain で続けて `.phase()` や `.build()` を呼び出せます。

## 設計意図

> 💡 なぜ phase を時間軸の単位にしたか
> mermaid の sequenceDiagram は「上から下へ」 という暗黙の時間順序を持つだけで、 「同じ step で複数 actor が動く」 「step ごとに強調を変える」 表現ができません。
> cdl は phase を明示的な時間単位として導入し、 phase 内で active 要素を列挙する設計にしました。
> これにより、 1 つの diagram で「現在の step に集中させる」 視覚効果を表現でき、 プレゼンや解説動画で読者の視線を誘導できます。

## 基本

最小コードは `id` / `title` / `body` を指定し、 callback で active 要素を列挙する形です。
非活性要素は灰色 + 50% opacity で背景に下がり、 active 要素が前面に強調されます。

::: tabs

@@@ humans 👤 For humans

```text
title: "User to API call"
type: sequence

actors:
  - user
  - api: function

flow:
  - user -> api: "call"

animation:
  - step: "call" 1.8s
    focus: [user, api]
    badge: "call"
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: call
    duration_ms: 1800
    title: "User -> API"
    body: "User が API を呼ぶ。"
    activates: [user, api, user-api]
    badge: call
intent: 最小 phase 構成 (id / duration / title / body + activate + badge)
```

:::

## activate (active 強調表示)

`activate` には、 phase 中に強調する要素 id を列挙します。
node / edge / phase の id を同じ method で受け取り、 該当要素に active class を付けます。

::: tabs

@@@ humans 👤 For humans

```text
title: "activate mix"
type: sequence

actors:
  - client
  - fn: function

flow:
  - client -> fn: "call"

animation:
  - step: "p" 1.5s
    focus: [client, fn]
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: p
    activates: [client, fn, client-fn]   # node 2 つ + edge 1 つを同 method で混在指定
intent: activate は variadic、 node / edge / phase の id を区別なく受ける
```

:::

[preview:animation/tween-simple]

active になった要素は、 stroke が太くなり / 色付きになり / 微かに scale します。
非活性要素は muted (灰色 + 50% opacity) で背景に下がります。

## tween (数値補間)

phase の duration 全体で state を線形補間します。
詳細な使い方は [state.md](/docs/cdl/primitives/state) を参照してください。

::: tabs

@@@ humans 👤 For humans

```text
title: "tween balance"
type: sequence

actors:
  - api: storage

states:
  balance: 100

animation:
  - step: "transfer" 1.5s
    focus: [api]
    tween:
      balance: 100 -> 90
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: transfer
    activates: [api]
    tweens:
      - { state: balance, from: 100, to: 90 }
intent: phase duration 全体で balance を linear 補間 (100 -> 90)
```

:::

## set (即時切替)

文字列 state や、 補間が不要な切替に使います。
status flag (`loading` → `done` 等) のように、 中間値に意味がない値で使います。

::: tabs

@@@ humans 👤 For humans

```text
title: "submit set"
type: flow

actors:
  - fn: function

states:
  status: "idle"

animation:
  - step: "submit" 0.8s
    focus: [fn]
    set:
      status: "loading"
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: submit
    sets:
      - { state: status, to: "loading" }
intent: 即時切替 (補間なし)、 文字列 state や中間値に意味なき flag に使う
```

:::

## badge (footer ラベル)

phase footer の右下に小さな pill 表示を出します。
phase 名の補足や、 流れの目印として使います。

::: tabs

@@@ humans 👤 For humans

```text
title: "badge example"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "call"

animation:
  - step: "call" 1.2s
    focus: [a, b]
    badge: "processing"
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: call
    activates: [a, b]
    badge: processing   # footer 右下 pill (max 16 chars)
intent: phase 名の補足 / 流れの目印を pill 表示で添える
```

:::

## opts.duration / title / body

phase header 周りの 3 つの option は、 それぞれ役割が異なります。
animation の長さと、 header に表示する文字を制御します。

| field | 用途 |
|---|---|
| `duration` | この phase の動画時間 (ms、 default `1800`) |
| `title` | header 上に表示する phase 見出し |
| `body` | header 下の説明文 (1-2 文) |

::: tabs

@@@ humans 👤 For humans

```text
title: "DB save phase"
type: flow

actors:
  - api: function
  - db: database

flow:
  - api -> db: "INSERT"

animation:
  - step: "DB save" 2.4s
    focus: [api, db]
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: p2
    duration_ms: 2400          # default 1800、 range 400..6000
    title: "DB に save"
    body: "users 表に row を追加して commit する。"
    activates: [...]
intent: header 3 option (duration / title / body) で animation 長 + 表示文字を制御
```

:::

v0.5 Text DSL では phase `body` (header 下の説明文) を直接表現できません。 補足説明が必要な場合は chain API を使います。

## phase 連鎖の自然な書き方

複数の phase を時系列に並べると、 物語のように動きます。
各 phase で active 要素と state 遷移を宣言することで、 step ごとに視線を誘導できます。

::: tabs

@@@ humans 👤 For humans

```text
title: "Auth Flow"
type: sequence

actors:
  - u
  - api: function
  - db: database

flow:
  - u -> api: "submit"
  - api -> db: "validate"
  - api -> u: "respond" (success)

states:
  status: "idle"

animation:
  - step: "submit" 1.5s
    focus: [u, api]
    set:
      status: "loading"
  - step: "validate" 1.8s
    focus: [api, db]
  - step: "respond" 1.5s
    focus: [api, u]
    set:
      status: "done"
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: auth, topic: "Auth Flow" }
states:
  - { id: status, initial: "idle" }
phases:
  - { id: submit,   duration_ms: 1500, title: submit,   body: "...", activates: [u, api, u-api],   sets: [{ state: status, to: "loading" }] }
  - { id: validate, duration_ms: 1800, title: validate, body: "...", activates: [api, db, api-db] }
  - { id: respond,  duration_ms: 1500, title: respond,  body: "...", activates: [api, u, api-u],   sets: [{ state: status, to: "done" }] }
intent: 時系列 3 phase を flat list で並列宣言、 各 phase で active + state 遷移を同時宣言
```

:::

[preview:animation/tween-simple]

## API Reference (chain API)

v0.5 Text DSL で表現できない phase `body` (header 下説明文) / `PhaseBuilder` の callback ベース宣言 / 詳細な activate id 指定 (edge auto id 等) が必要な場合は builder API を使います。

```ts
.phase("call", { duration: 1800, title: "User → API", body: "User が API を呼ぶ。" },
  (p) => p.activate("user", "api", "user-api").badge("call"))

.phase("p", { ... },
  (p) => p.activate("client", "fn", "client-fn"))   // client node + fn node + client-fn edge が active

.phase("transfer", { ... },
  (p) => p.activate("api").tween("balance", 100, 90))

.phase("submit", { ... }, (p) => p.set("status", "loading"))

.phase("call", { ... },
  (p) => p.activate("a", "b").badge("processing"))

.phase("p2", { duration: 2400, title: "DB に save", body: "users 表に row を追加して commit する。" },
  (p) => p.activate(...))

diagram("auth", { topic: "Auth Flow" })
  .lane(...).nodes(...).edges(...)
  .state("status", { initial: "idle" })
  .phase("submit",   { duration: 1500, title: "submit",   body: "..." }, (p) => p.activate("u", "api", "u-api").set("status", "loading"))
  .phase("validate", { duration: 1800, title: "validate", body: "..." }, (p) => p.activate("api", "db", "api-db"))
  .phase("respond",  { duration: 1500, title: "respond",  body: "..." }, (p) => p.activate("api", "u", "api-u").set("status", "done"))
  .build();
```

## 落とし穴 / エラー

### 警告 ... node が unused

**原因** ... どの phase でも `activate` 対象に含めなかった node は、 全 phase で muted のままになり、 視覚的に「居ない」 ように見えます。 validate skill が `unused` warning を出します。

**修正例**:

```diff
.node("dangling", { lane: "l", stack: 0, kind: "actor", title: "Dangling" })
.phase("p1", { ... }, (p) => p.activate("u", "api"))
+ .phase("p2", { ... }, (p) => p.activate("dangling"))
```

全 phase の `activate` を集約し、 必ず全要素が 1 回以上 active になるように設計してください。

## 関連

- [state](/docs/cdl/primitives/state) ... phase で tween / set する変数です
- [animation guide (cookbook 内)](/docs/cdl/overview/cookbook) ... animation 8 番例を載せています
- [API Reference](/docs/cdl/reference/api#phase) ... 全 field の型定義です
