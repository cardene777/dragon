/**
 * dragon preset SSOT — 10 preset を playground-next で render するための metadata。
 *
 * cdl core (packages/cdl/src/presets.ts) を直接 import できるが、 型 dependency を薄く
 * 保つため、 本 playground-next では playground 独自の PresetDoc 型 + minimal render を持つ。
 */

export type NodeKind =
  | "actor"
  | "function"
  | "storage"
  | "event"
  | "card"
  | "database"
  | "container"
  | "process"
  | "queue"
  | "loadbalancer";

export interface PresetNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: NodeKind;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  shape?: "rect" | "cylinder" | "cloud" | "diamond" | "hexagon" | "ellipse";
}

export interface PresetEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed";
}

export interface PresetLane {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface PresetDoc {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  tags: string[];
  viewBox: { x: number; y: number; w: number; h: number };
  lanes?: PresetLane[];
  nodes: PresetNode[];
  edges: PresetEdge[];
}

/**
 * 10 preset、 catalog gallery の source of truth。
 * viewBox は 1200x800 に統一 (thumbnail scale 計算しやすさ)。
 */
export const PRESETS: PresetDoc[] = [
  {
    id: "swimlane",
    slug: "swimlane",
    title: "swimlane",
    eyebrow: "SWIMLANE / LAYOUT",
    subtitle: "3 lane 自動配置。 laneId(label) で slug 参照、 lane.x を auto-layout。",
    tags: ["3 lane", "auto layout"],
    viewBox: { x: 0, y: 0, w: 1200, h: 600 },
    lanes: [
      { id: "client", x: 0, y: 40, w: 380, h: 500, label: "Client" },
      { id: "service", x: 400, y: 40, w: 380, h: 500, label: "Service" },
      { id: "event", x: 800, y: 40, w: 380, h: 500, label: "Event" },
    ],
    nodes: [
      { id: "user", x: 190, y: 200, w: 220, h: 120, kind: "actor", title: "User", eyebrow: "ACTOR" },
      {
        id: "handler",
        x: 590,
        y: 200,
        w: 240,
        h: 120,
        kind: "function",
        title: "handler(...)",
        eyebrow: "FUNCTION",
      },
      { id: "event", x: 990, y: 200, w: 220, h: 120, kind: "event", title: "Processed", eyebrow: "EVENT" },
    ],
    edges: [
      { id: "call", from: "user", to: "handler", label: "call" },
      { id: "emit", from: "handler", to: "event", label: "emit" },
    ],
  },
  {
    id: "flow",
    slug: "flow",
    title: "flow",
    eyebrow: "FLOW / SEQUENCE",
    subtitle: "1 lane sequence。 前 step → 次 step 自動 edge、 縦 stack。",
    tags: ["1 lane", "sequential"],
    viewBox: { x: 0, y: 0, w: 1200, h: 800 },
    nodes: [
      { id: "s1", x: 500, y: 80, w: 240, h: 100, kind: "actor", title: "Authentication Flow", eyebrow: "STEP" },
      { id: "s2", x: 500, y: 240, w: 260, h: 100, kind: "function", title: "Login handler", subtitle: "POST /login", eyebrow: "STEP 1" },
      { id: "s3", x: 500, y: 400, w: 260, h: 100, kind: "function", title: "Validate creds", eyebrow: "STEP 2" },
      { id: "s4", x: 500, y: 560, w: 260, h: 100, kind: "function", title: "Issue JWT", eyebrow: "STEP 3" },
      { id: "s5", x: 500, y: 720, w: 260, h: 60, kind: "event", title: "Login Success", eyebrow: "END" },
    ],
    edges: [
      { id: "e1", from: "s1", to: "s2" },
      { id: "e2", from: "s2", to: "s3" },
      { id: "e3", from: "s3", to: "s4" },
      { id: "e4", from: "s4", to: "s5" },
    ],
  },
  {
    id: "sequence",
    slug: "sequence",
    title: "sequence",
    eyebrow: "SEQUENCE / UML",
    subtitle: "actor 列 × 時系列 row。 UML sequence diagram 風、 return 動作あり。",
    tags: ["actor", "UML"],
    viewBox: { x: 0, y: 0, w: 1200, h: 800 },
    nodes: [
      { id: "a1", x: 120, y: 60, w: 160, h: 80, kind: "actor", title: "User" },
      { id: "a2", x: 520, y: 60, w: 160, h: 80, kind: "actor", title: "Auth", eyebrow: "SERVICE" },
      { id: "a3", x: 920, y: 60, w: 160, h: 80, kind: "actor", title: "DB", eyebrow: "STORAGE", shape: "cylinder" },
      { id: "a4", x: 120, y: 620, w: 160, h: 80, kind: "actor", title: "User" },
      { id: "a5", x: 520, y: 620, w: 160, h: 80, kind: "actor", title: "Auth" },
    ],
    edges: [
      { id: "s1", from: "a1", to: "a2", label: "login" },
      { id: "s2", from: "a2", to: "a3", label: "query" },
      { id: "s3", from: "a3", to: "a5", label: "row", style: "dashed" },
      { id: "s4", from: "a5", to: "a4", label: "token", style: "dashed" },
    ],
  },
  {
    id: "topology",
    slug: "topology",
    title: "topology",
    eyebrow: "TOPOLOGY / DEPLOY",
    subtitle: "group + container 配置。 構成図 / deployment diagram 風。",
    tags: ["group", "container"],
    viewBox: { x: 0, y: 0, w: 1200, h: 700 },
    lanes: [{ id: "aws", x: 100, y: 40, w: 1000, h: 620, label: "AWS us-east-1" }],
    nodes: [
      { id: "lb", x: 220, y: 200, w: 200, h: 100, kind: "loadbalancer", title: "Load Balancer", eyebrow: "ALB" },
      { id: "app", x: 480, y: 200, w: 240, h: 140, kind: "container", title: "Container", subtitle: "ECS Fargate", eyebrow: "APP" },
      { id: "db", x: 780, y: 200, w: 200, h: 140, kind: "database", title: "Postgres", subtitle: "RDS", eyebrow: "DB", shape: "cylinder" },
      { id: "cache", x: 480, y: 420, w: 240, h: 100, kind: "database", title: "Redis", eyebrow: "CACHE", shape: "cylinder" },
    ],
    edges: [
      { id: "e1", from: "lb", to: "app" },
      { id: "e2", from: "app", to: "db" },
      { id: "e3", from: "app", to: "cache" },
    ],
  },
  {
    id: "er",
    slug: "er",
    title: "er",
    eyebrow: "ER / DB SCHEMA",
    subtitle: "entity + cardinality。 ER 図 / DB schema 風、 relation 表現。",
    tags: ["entity", "relation"],
    viewBox: { x: 0, y: 0, w: 1200, h: 600 },
    nodes: [
      { id: "user", x: 140, y: 180, w: 320, h: 240, kind: "storage", title: "User", subtitle: "id / email / createdAt", eyebrow: "ENTITY" },
      { id: "order", x: 740, y: 180, w: 320, h: 240, kind: "storage", title: "Order", subtitle: "id / userId / total / status", eyebrow: "ENTITY" },
    ],
    edges: [{ id: "r1", from: "user", to: "order", label: "1 : N" }],
  },
  {
    id: "state",
    slug: "state",
    title: "stateMachine",
    eyebrow: "STATE / FSM",
    subtitle: "state + transition trigger。 FSM / workflow 図風。",
    tags: ["state", "transition"],
    viewBox: { x: 0, y: 0, w: 1200, h: 400 },
    nodes: [
      { id: "s1", x: 40, y: 140, w: 160, h: 100, kind: "actor", title: "idle", shape: "ellipse" },
      { id: "s2", x: 300, y: 140, w: 160, h: 100, kind: "actor", title: "loading", shape: "ellipse" },
      { id: "s3", x: 560, y: 140, w: 160, h: 100, kind: "actor", title: "success", shape: "ellipse" },
      { id: "s4", x: 820, y: 140, w: 160, h: 100, kind: "actor", title: "error", shape: "ellipse" },
      { id: "s5", x: 1020, y: 140, w: 160, h: 100, kind: "actor", title: "done", shape: "ellipse" },
    ],
    edges: [
      { id: "t1", from: "s1", to: "s2", label: "start" },
      { id: "t2", from: "s2", to: "s3", label: "ok" },
      { id: "t3", from: "s2", to: "s4", label: "fail" },
      { id: "t4", from: "s3", to: "s5" },
      { id: "t5", from: "s4", to: "s5" },
    ],
  },
  {
    id: "class",
    slug: "class",
    title: "classDiagram",
    eyebrow: "CLASS / UML",
    subtitle: "class + attribute + relation。 UML クラス図風、 aggregates / extends。",
    tags: ["class", "UML"],
    viewBox: { x: 0, y: 0, w: 1200, h: 500 },
    nodes: [
      { id: "user", x: 60, y: 120, w: 300, h: 260, kind: "storage", title: "User", subtitle: "name : string\nemail : string\nlogin()", eyebrow: "CLASS" },
      { id: "admin", x: 440, y: 120, w: 300, h: 260, kind: "storage", title: "Admin", subtitle: "role : string\nhasAccess()", eyebrow: "CLASS" },
      { id: "session", x: 820, y: 120, w: 300, h: 260, kind: "storage", title: "Session", subtitle: "token : string\nexpiresAt : Date", eyebrow: "CLASS" },
    ],
    edges: [
      { id: "e1", from: "user", to: "admin", label: "extends" },
      { id: "e2", from: "admin", to: "session", label: "aggregates" },
    ],
  },
  {
    id: "mindmap",
    slug: "mindmap",
    title: "mindMap",
    eyebrow: "MIND MAP / IDEA",
    subtitle: "root + branch 放射。 idea / brain storm 図風。",
    tags: ["mind map", "brain storm"],
    viewBox: { x: 0, y: 0, w: 1200, h: 500 },
    nodes: [
      { id: "root", x: 480, y: 200, w: 240, h: 100, kind: "actor", title: "Project", eyebrow: "ROOT" },
      { id: "b1", x: 60, y: 60, w: 200, h: 80, kind: "card", title: "Marketing" },
      { id: "b2", x: 60, y: 200, w: 200, h: 80, kind: "card", title: "Product" },
      { id: "b3", x: 60, y: 340, w: 200, h: 80, kind: "card", title: "Sales" },
      { id: "b4", x: 940, y: 60, w: 200, h: 80, kind: "card", title: "Engineering" },
      { id: "b5", x: 940, y: 200, w: 200, h: 80, kind: "card", title: "Design" },
      { id: "b6", x: 940, y: 340, w: 200, h: 80, kind: "card", title: "Operations" },
    ],
    edges: [
      { id: "e1", from: "root", to: "b1" },
      { id: "e2", from: "root", to: "b2" },
      { id: "e3", from: "root", to: "b3" },
      { id: "e4", from: "root", to: "b4" },
      { id: "e5", from: "root", to: "b5" },
      { id: "e6", from: "root", to: "b6" },
    ],
  },
  {
    id: "flowchart",
    slug: "flowchart",
    title: "flowchart",
    eyebrow: "FLOWCHART / DECISION",
    subtitle: "2 lane 承認フロー、 approval / rejection 分岐、 decision diamond。",
    tags: ["approval", "decision"],
    viewBox: { x: 0, y: 0, w: 1200, h: 700 },
    nodes: [
      { id: "start", x: 80, y: 320, w: 200, h: 100, kind: "actor", title: "Start", subtitle: "User request" },
      { id: "process", x: 400, y: 320, w: 240, h: 100, kind: "function", title: "process", subtitle: "verify" },
      { id: "decision", x: 720, y: 300, w: 200, h: 160, kind: "actor", title: "Approved?", shape: "diamond" },
      { id: "approve", x: 990, y: 160, w: 180, h: 100, kind: "event", title: "Approved" },
      { id: "reject", x: 990, y: 460, w: 180, h: 100, kind: "event", title: "Rejected" },
    ],
    edges: [
      { id: "e1", from: "start", to: "process" },
      { id: "e2", from: "process", to: "decision" },
      { id: "e3", from: "decision", to: "approve", label: "yes" },
      { id: "e4", from: "decision", to: "reject", label: "no" },
    ],
  },
  {
    id: "pubsub",
    slug: "pubsub",
    title: "pubsub",
    eyebrow: "PUB / SUB / QUEUE",
    subtitle: "publisher + queue + subscribers。 event-driven architecture 風。",
    tags: ["queue", "event"],
    viewBox: { x: 0, y: 0, w: 1200, h: 600 },
    nodes: [
      { id: "pub", x: 80, y: 240, w: 200, h: 120, kind: "actor", title: "Publisher" },
      { id: "q", x: 460, y: 240, w: 280, h: 120, kind: "queue", title: "Message Queue", subtitle: "Kafka / SQS" },
      { id: "sub1", x: 900, y: 100, w: 220, h: 100, kind: "container", title: "Consumer A" },
      { id: "sub2", x: 900, y: 260, w: 220, h: 100, kind: "container", title: "Consumer B" },
      { id: "sub3", x: 900, y: 420, w: 220, h: 100, kind: "container", title: "Consumer C" },
    ],
    edges: [
      { id: "e1", from: "pub", to: "q", label: "emit" },
      { id: "e2", from: "q", to: "sub1", label: "consume" },
      { id: "e3", from: "q", to: "sub2", label: "consume" },
      { id: "e4", from: "q", to: "sub3", label: "consume" },
    ],
  },
];
