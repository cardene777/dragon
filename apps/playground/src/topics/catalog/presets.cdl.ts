import { swimlane, flow, sequence, topology, er, stateMachine } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Presets ... 高位 API (swimlane / flow) の demo。
 * 低位 API (lane / node / edge 個別宣言) を 1 行で生成する preset。
 */

// swimlane preset ... 3 lane 自動配置 + laneId(label) で slug 取得
const swim = swimlane({ id: "swim-demo", topic: "swimlane preset (3 lane 自動)", lanes: ["送信元", "Contract", "出力"], laneWidth: 520 });
const lSrc = swim.laneId("送信元");
const lCt = swim.laneId("Contract");
const lOut = swim.laneId("出力");
swim
  .node("alice", { lane: lSrc, stack: 0, kind: "actor", title: "Alice" })
  .node("fn", { lane: lCt, stack: 0, kind: "function", title: "transfer(...)" })
  .node("ev", { lane: lOut, stack: 0, kind: "event", title: "Transfer" })
  .edge("alice", "fn", { id: "call", label: "call", tone: "accent", style: "dotted-flow" })
  .edge("fn", "ev", { id: "emit", label: "emit", tone: "success", style: "dotted-flow" })
  .phase("p", { duration: 2400, title: "swimlane", body: "swimlane preset で 3 lane を 1 行宣言、 lane.x auto-layout。" }, (p: PhaseBuilder) => p.activate("alice", "fn", "ev", "call", "emit").badge("preset"));

export const presetSwimlane = swim.build();

// flow preset ... 1 lane に縦 stack、 前 step → 次 step 自動接続
export const presetFlow = flow({ id: "flow-demo", topic: "flow preset (auth フロー)", laneLabel: "Authentication Flow", defaultTone: "teal" })
  .step({ id: "user", kind: "person", title: "User", eyebrow: "ユーザー" })
  .step({ id: "api", kind: "api", title: "POST /login", eyebrow: "API" }, "ログイン要求")
  .step({ id: "auth", kind: "service", title: "AuthService", eyebrow: "サービス" }, "認証処理")
  .step({ id: "db", kind: "database", title: "users 表", eyebrow: "DB" }, "credential 検証")
  .build();

// sequence preset ... actor 列 × 時系列 row、 UML sequence diagram 風
export const presetSequence = sequence({
  id: "seq-demo",
  topic: "sequence preset (auth fl)",
  actors: ["User", "API", "DB"],
  defaultTone: "accent",
  defaultStyle: "solid",
})
  .step({ from: "User", to: "API", label: "POST /login", sub: "email + password" })
  .step({ from: "API", to: "DB", label: "SELECT credentials" })
  .step({ from: "DB", to: "API", label: "rows", tone: "success", style: "dotted-flow" })
  .step({ from: "API", to: "User", label: "200 OK", sub: "JWT token", tone: "success" })
  .build();

// topology preset ... 構成図 / deployment diagram、 group で container を囲む
const topo = topology({ id: "topo-demo", topic: "topology preset (AWS deployment)", defaultTone: "teal" });
topo
  .group("client", { label: "Client" })
  .add({ id: "browser", kind: "frontend", title: "Browser" });
topo
  .group("aws", { label: "AWS" })
  .add({ id: "alb", kind: "service", title: "ALB", eyebrow: "Load Balancer" })
  .add({ id: "ecs", kind: "service", title: "ECS Task", eyebrow: "Container" })
  .add({ id: "rds", kind: "database", title: "RDS", eyebrow: "Postgres" });
topo
  .connect("browser", "alb", { label: "HTTPS", sub: "TLS 1.3" })
  .connect("alb", "ecs", { label: "round-robin" })
  .connect("ecs", "rds", { label: "TCP 5432", sub: "pgbouncer", tone: "success", labelOffsetX: 150 });
export const presetTopology = topo.build();

// er preset ... ER 図 (User → Order の 1:N 関係)
export const presetEr = er({ id: "er-demo", topic: "er preset (User-Order schema)", defaultTone: "info" })
  .entity({ id: "user", title: "User", rows: ["id: PK", "email: string", "createdAt: timestamp"] })
  .entity({ id: "order", title: "Order", rows: ["id: PK", "userId: FK", "total: number", "status: enum"] })
  .relation({ from: "user", to: "order", cardinality: "1:N", label: "places" })
  .build();

// stateMachine preset ... FSM (Auth フロー、 initial → loading → done/error → retry の workflow)
export const presetStateMachine = stateMachine({ id: "fsm-demo", topic: "stateMachine preset (Auth FSM)" })
  .state({ id: "idle", title: "Idle", initial: true })
  .state({ id: "loading", title: "Loading" })
  .state({ id: "done", title: "Done", final: true })
  .state({ id: "error", title: "Error" })
  .transition({ from: "idle", to: "loading", trigger: "submit" })
  .transition({ from: "loading", to: "done", trigger: "success", tone: "success" })
  .transition({ from: "loading", to: "error", trigger: "fail", tone: "error" })
  .transition({ from: "error", to: "idle", trigger: "retry", guard: "if attempts < 3" })
  .build();
