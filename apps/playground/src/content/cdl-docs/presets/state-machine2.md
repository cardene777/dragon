# stateMachine2 preset

`stateMachine2` preset は UML statechart に近い拡張 FSM を扱う高位 API です。
基本の [stateMachine preset](/docs/cdl/presets/state-machine) に **nested state** (親 state)、 **entry / exit action** (状態進入時 / 退出時アクション)、 **transition action** (遷移時アクション) を追加しています。

## いつ使うか

`stateMachine2` は UI / business workflow の詳細状態モデルに最適です。

- React useReducer / xstate 等の statechart 設計を可視化
- 「Active 状態の中で Loading / Idle が切替わる」 という nested 構造を表現
- entry / exit / transition action を design doc 上で明示

action / nested が不要な単純 FSM なら [stateMachine preset](/docs/cdl/presets/state-machine) で十分です。

## なぜ専用 preset を分けたか

`stateMachine` は trigger + guard だけのシンプル API です。
`stateMachine2` は nested + action を加えて UML statechart の semantics をフルにカバーします。
両 preset を併存させることで、 「軽量な workflow は `stateMachine`、 詳細設計は `stateMachine2`」 と用途別に選択できます。

## Signature

```ts
stateMachine2({ id: string, topic: string, stateWidth?: number, defaultTone?: Tone })
  .state({ id, title, initial?, final?, parent?, entry?, exit? })
  .transition({ from, to, trigger, guard?, action?, tone? })
  .build()
```

[preview:presets/sm2-demo]

## subtitle に出る情報

各 state の subtitle に以下が併記されます。

- `entry: <action>` ... 状態進入時の action
- `exit: <action>` ... 状態退出時の action

各 transition の sub に以下が併記されます。

- `[<guard>]` ... 遷移条件 (UML notation 準拠)
- `/<action>` ... 遷移時アクション (UML notation 準拠)

`parent` を指定した state は eyebrow に `nested in <parent>` が追記されます。

## 完全な例

```ts
import { stateMachine2 } from "@cardenelabs/cdl";

export const authFsm = stateMachine2({ id: "auth", topic: "Auth FSM 拡張" })
  .state({ id: "idle", title: "Idle", initial: true, entry: "clearForm" })
  .state({ id: "active", title: "Active" })
  .state({ id: "loading", title: "Loading", parent: "active",
           entry: "startSpinner", exit: "stopSpinner" })
  .state({ id: "done", title: "Done", final: true })
  .transition({ from: "idle", to: "loading", trigger: "submit", action: "validate" })
  .transition({ from: "loading", to: "done", trigger: "success", tone: "success" })
  .build();
```

[preview:presets/sm2-demo]

## 関連

- [stateMachine preset](/docs/cdl/presets/state-machine) — シンプルな FSM
- [flowchart preset](/docs/cdl/presets/flowchart) — 状態でなく business process なら
