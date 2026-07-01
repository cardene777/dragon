import { swimlane, flow, sequence, topology, er, stateMachine, infrastructure, classDiagram, tree, userJourney, mindMap, funnel, quadrant, chart, gantt, flowchart, network, stateMachine2 } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Presets ... 高位 API (swimlane / flow) の demo。
 * 低位 API (lane / node / edge 個別宣言) を 1 行で生成する preset。
 */

// swimlane preset ... 3 lane 自動配置 + laneId(label) で slug 取得
const swim = swimlane({ id: "swim-demo", topic: "swimlane preset (3 lane 自動)", lanes: ["Client", "Service", "Event"], laneWidth: 520 });
const lSrc = swim.laneId("Client");
const lCt = swim.laneId("Service");
const lOut = swim.laneId("Event");
swim
  .node("user", { lane: lSrc, stack: 0, kind: "actor", title: "User" })
  .node("fn", { lane: lCt, stack: 0, kind: "function", title: "handler(...)" })
  .node("ev", { lane: lOut, stack: 0, kind: "event", title: "Processed" })
  .edge("user", "fn", { id: "call", label: "call", tone: "accent", style: "dotted-flow" })
  .edge("fn", "ev", { id: "emit", label: "emit", tone: "success", style: "dotted-flow" })
  .phase("p", { duration: 2400, title: "swimlane", body: "swimlane preset で 3 lane を 1 行宣言、 lane.x auto-layout。" }, (p: PhaseBuilder) => p.activate("user", "fn", "ev", "call", "emit").badge("preset"));

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
  .connect("ecs", "rds", { label: "TCP 5432", sub: "pgbouncer", tone: "success" });
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

// ───────────── 新図種 12 種 (cdl v0.6+) ─────────────

// infrastructure preset ... cloud / system 構成図 (col + row grid)
export const presetInfrastructure = infrastructure({ id: "infra-demo", topic: "infrastructure preset (SaaS arch)" })
  .node({ id: "user", kind: "person", title: "User", col: 0, row: 0 })
  .node({ id: "cdn", kind: "cdn", title: "CloudFront", col: 1, row: 0 })
  .node({ id: "alb", kind: "service", title: "ALB", col: 2, row: 0 })
  .node({ id: "app", kind: "service", title: "App", col: 2, row: 1 })
  .node({ id: "db", kind: "database", title: "RDS", col: 3, row: 0 })
  .node({ id: "cache", kind: "cache", title: "Redis", col: 3, row: 1 })
  .connect({ from: "user", to: "cdn", label: "HTTPS", labelOffsetY: -60 })
  .connect({ from: "cdn", to: "alb", label: "origin", labelOffsetY: -60 })
  .connect({ from: "alb", to: "app", label: "route", labelOffsetX: 120, labelOffsetY: 0 })
  .connect({ from: "app", to: "db", label: "SQL", labelOffsetX: 200, labelOffsetY: -50 })
  .connect({ from: "app", to: "cache", label: "GET/SET", labelOffsetX: 200, labelOffsetY: 60 })
  .build();

// classDiagram preset ... UML クラス図
export const presetClassDiagram = classDiagram({ id: "class-demo", topic: "classDiagram preset (User domain)" })
  .class({ id: "User", title: "User", attributes: ["+name: string", "+email: string"], methods: ["+login(): void", "+logout(): void"] })
  .class({ id: "Admin", title: "Admin", attributes: ["+permissions: string[]"], methods: ["+banUser(): void"] })
  .class({ id: "Order", title: "Order", attributes: ["+id: number", "+total: number"], methods: ["+pay(): void"] })
  .relation({ from: "Admin", to: "User", type: "extends" })
  .relation({ from: "User", to: "Order", type: "aggregates", cardinality: "1..*" })
  .build();

// tree preset ... 組織図 / file tree / class 階層
export const presetTree = tree({ id: "tree-demo", topic: "tree preset (組織図)" })
  .node({ id: "ceo", title: "CEO" })
  .node({ id: "cto", title: "CTO", parent: "ceo" })
  .node({ id: "cfo", title: "CFO", parent: "ceo" })
  .node({ id: "eng", title: "Eng Manager", parent: "cto" })
  .node({ id: "ops", title: "Ops Manager", parent: "cto" })
  .build();

// userJourney preset ... step + emotion + touchpoint
export const presetUserJourney = userJourney({ id: "journey-demo", topic: "userJourney preset (Signup flow)" })
  .step({ id: "land", title: "Land on /", emotion: "neutral", touchpoint: "Website" })
  .step({ id: "form", title: "Fill signup form", emotion: "frustrated", touchpoint: "Form", opportunity: "input UX 改善" })
  .step({ id: "verify", title: "Email verify", emotion: "happy", touchpoint: "Email" })
  .step({ id: "done", title: "Dashboard", emotion: "delighted", touchpoint: "Dashboard" })
  .build();

// mindMap preset ... 中心 + 放射 branch
export const presetMindMap = mindMap({ id: "mind-demo", topic: "mindMap preset (Project ideas)", rootId: "root", rootTitle: "Project" })
  .branch({ id: "feat", title: "Features", parent: "root" })
  .branch({ id: "ui", title: "UI design", parent: "root" })
  .branch({ id: "launch", title: "Launch", parent: "root" })
  .branch({ id: "auth", title: "Auth", parent: "feat" })
  .branch({ id: "billing", title: "Billing", parent: "feat" })
  .build();

// funnel preset ... Sales / marketing funnel
export const presetFunnel = funnel({ id: "funnel-demo", topic: "funnel preset (Conversion)" })
  .stage({ id: "visit", title: "Visit", count: 10000 })
  .stage({ id: "signup", title: "Sign up", count: 1500 })
  .stage({ id: "trial", title: "Trial", count: 800 })
  .stage({ id: "paid", title: "Paid", count: 200 })
  .build();

// quadrant preset ... 2 軸 matrix (4 象限完全配置、 cdl PR #32 で stack 衝突 bug 修正済)
export const presetQuadrant = quadrant({
  id: "quad-demo",
  topic: "quadrant preset (Priority matrix)",
  xAxis: { left: "Low effort", right: "High effort" },
  yAxis: { bottom: "Low value", top: "High value" },
})
  .item({ id: "qw", title: "Quick win", quadrant: "topLeft" })
  .item({ id: "mp", title: "Major project", quadrant: "topRight" })
  .item({ id: "fi", title: "Fill in", quadrant: "bottomLeft" })
  .item({ id: "tt", title: "Thankless", quadrant: "bottomRight" })
  .build();

// chart preset (pie) ... 統計チャート
export const presetChartPie = chart({ id: "chart-pie-demo", topic: "chart preset (pie)", type: "pie" })
  .datum({ id: "a", label: "Web", value: 45 })
  .datum({ id: "b", label: "Mobile", value: 35 })
  .datum({ id: "c", label: "API", value: 20 })
  .build();

// chart preset (line) ... 時系列
export const presetChartLine = chart({ id: "chart-line-demo", topic: "chart preset (line)", type: "line" })
  .datum({ id: "jan", label: "Jan", value: 1000 })
  .datum({ id: "feb", label: "Feb", value: 1300 })
  .datum({ id: "mar", label: "Mar", value: 1100 })
  .datum({ id: "apr", label: "Apr", value: 1600 })
  .build();

// gantt preset ... sprint / release timeline
export const presetGantt = gantt({ id: "gantt-demo", topic: "gantt preset (Release timeline)" })
  .task({ id: "design", title: "Design", start: "Q1", end: "Q1", owner: "Designer" })
  .task({ id: "build", title: "Build", start: "Q2", end: "Q2", owner: "Eng", dependsOn: "design" })
  .task({ id: "test", title: "Test", start: "Q3", end: "Q3", owner: "QA", dependsOn: "build" })
  .task({ id: "ship", title: "Ship", start: "Q4", end: "Q4", owner: "PM", dependsOn: "test" })
  .build();

// flowchart preset ... swimlane + decision
export const presetFlowchart = flowchart({ id: "flowchart-demo", topic: "flowchart preset (Approval)", lanes: ["User", "Manager"] })
  .node({ id: "submit", title: "Submit request", shape: "start", lane: "User" })
  .node({ id: "review", title: "Review", shape: "decision", lane: "Manager" })
  .node({ id: "approve", title: "Approved", shape: "end", lane: "Manager" })
  .node({ id: "revise", title: "Revise", shape: "process", lane: "User" })
  .edge({ from: "submit", to: "review" })
  .edge({ from: "review", to: "approve", label: "true", tone: "success" })
  .edge({ from: "review", to: "revise", label: "false", tone: "warning" })
  .build();

// network preset ... NW topology
export const presetNetwork = network({ id: "network-demo", topic: "network preset (Office NW)" })
  .device({ id: "fw", title: "Firewall", kind: "firewall", col: 0, row: 0, segment: "DMZ" })
  .device({ id: "sw1", title: "Switch A", kind: "switch", col: 1, row: 0, segment: "LAN" })
  .device({ id: "srv", title: "App Server", kind: "server", col: 2, row: 0 })
  .device({ id: "db", title: "DB Server", kind: "server", col: 2, row: 1 })
  .link({ from: "fw", to: "sw1", protocol: "VLAN 10" })
  .link({ from: "sw1", to: "srv", protocol: "TCP 22" })
  .link({ from: "sw1", to: "db", protocol: "TCP 5432" })
  .build();

// stateMachine2 preset ... 拡張 FSM (nested + action)
export const presetStateMachine2 = stateMachine2({ id: "sm2-demo", topic: "stateMachine2 preset (Auth FSM 拡張)" })
  .state({ id: "idle", title: "Idle", initial: true, entry: "clearForm" })
  .state({ id: "active", title: "Active" })
  .state({ id: "loading", title: "Loading", parent: "active", entry: "startSpinner", exit: "stopSpinner" })
  .state({ id: "done", title: "Done", final: true })
  .transition({ from: "idle", to: "loading", trigger: "submit", action: "validate" })
  .transition({ from: "loading", to: "done", trigger: "success", tone: "success" })
  .build();
