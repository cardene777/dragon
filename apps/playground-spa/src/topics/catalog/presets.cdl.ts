import { swimlane, flow, sequence, topology, er, stateMachine, infrastructure, classDiagram, tree, userJourney, mindMap, funnel, quadrant, chart, gantt, flowchart, network, stateMachine2 } from "@cardenelabs/cdl";
import type { CdlDiagram, PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Presets ... 高位 API (swimlane / flow) の demo。
 * 低位 API (lane / node / edge 個別宣言) を 1 行で生成する preset。
 */

// ───────────── 段を組む helper (#1194) ─────────────

type Phase = CdlDiagram["phases"][number];
type State = NonNullable<CdlDiagram["states"]>[number];
type Node = CdlDiagram["nodes"][number];

/** 段 1 つ分の指定 */
type Step = {
  /** その段で新しく光らせる要素。 前の段で光ったものは光ったまま積み上がる */
  ids?: readonly string[];
  /** 段の題。 省略すると preset が自動で作った段の題を使う */
  title?: string;
  /** 段の説明。 省略すると preset が自動で作った段の説明を使う */
  body?: string;
  /** 段の中で数を動かす (始点 → 終点) */
  tweens?: ReadonlyArray<{ id: string; from: number; to: number }>;
  /** 段に入った時点で値を切り替える */
  sets?: ReadonlyArray<{ id: string; value: string | number }>;
};

const STEP_DURATION = 900;

/**
 * 組み上がった図に段を組み直す (#1194)。
 *
 * preset の builder は `.phase()` を持たない (`swimlane` だけが `DiagramBuilder` を返す) ため、
 * 段は `build()` の後に足す。 preset が自動で作る段は 1 つだけで、全要素を光らせて終わるので、
 * そのままでは開いても静止画と区別が付かない。
 *
 * 題と説明を省いた段は、preset が自動で作った段のものを引き継ぐ。 図の型そのものの説明は
 * 最後の段に残したいので、最後の段で省くのが既定の使い方になる。
 */
function withSteps(d: CdlDiagram, steps: readonly Step[], states: readonly State[] = []): CdlDiagram {
  const auto = d.phases[0];
  const lit: string[] = [];
  const phases: Phase[] = steps.map((s, i) => {
    for (const id of s.ids ?? []) if (!lit.includes(id)) lit.push(id);
    return {
      id: `p${i + 1}`,
      duration: STEP_DURATION,
      title: s.title ?? auto?.title ?? "",
      body: s.body ?? auto?.body ?? "",
      activate: [...lit],
      tweens: (s.tweens ?? []).map((t) => ({ stateId: t.id, from: t.from, to: t.to })),
      sets: (s.sets ?? []).map((v) => ({ stateId: v.id, value: v.value })),
      badge: auto?.badge,
    };
  });
  return { ...d, states: [...(d.states ?? []), ...states], phases };
}

/**
 * 図表の箱の中身に状態を通す (#1194)。
 *
 * 図表の中身 (`chartData` / `funnelData` / `ganttData` / `quadrantData` / `journeyData`) は
 * `{名前}` を受ける型で宣言されている一方、preset の入口 (`.datum({ value })` 等) は数と語しか
 * 受けない。 そこで組み上がった図の中身を書き換える。 読む側は cdl の
 * `render/payload-binding.ts` が `{名前}` を解いてから数と語として扱う。
 *
 * 図表の preset はいずれも箱を 1 つだけ作り、そこに配列を丸ごと載せる。 対象が先頭の箱に
 * 限られるのはそのため。
 */
function bindFirstNode(d: CdlDiagram, patch: (n: Node) => Node): CdlDiagram {
  return { ...d, nodes: d.nodes.map((n, i) => (i === 0 ? patch(n) : n)) };
}

// swimlane preset ... 3 lane 自動配置 + laneId(label) で slug 取得
const swim = swimlane({ id: "swim-demo", topic: "処理を役割ごとに縦レーン分けして流れを示す図", lanes: ["Client", "Service", "Event"], laneWidth: 520 });
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

export const presetSwimlane = withSteps(swim.build(), [
  { ids: ["user"], title: "1. Client の User", body: "外から呼ぶ人が最初の縦列に立つ。" },
  { ids: ["fn", "call"], title: "2. Service の handler", body: "呼び出しが隣の縦列に渡る。" },
  { ids: ["ev", "emit"] },
]);

// flow preset ... 1 lane に縦 stack、 前 step → 次 step 自動接続
export const presetFlow = withSteps(
  flow({ id: "flow-demo", topic: "処理の順番を上から下へ 1 本の流れで示す図", laneLabel: "Authentication Flow", defaultTone: "teal" })
    .step({ id: "user", kind: "person", title: "User", eyebrow: "ユーザー" })
    .step({ id: "api", kind: "api", title: "POST /login", eyebrow: "API" }, "ログイン要求")
    .step({ id: "auth", kind: "service", title: "AuthService", eyebrow: "サービス" }, "認証処理")
    .step({ id: "db", kind: "database", title: "users 表", eyebrow: "DB" }, "credential 検証")
    .build(),
  [
    { ids: ["user"], title: "1. User", body: "ログインしようとする人から始まる。" },
    { ids: ["api", "e-user-api"], title: "2. POST /login", body: "ログイン要求を受け取る。" },
    { ids: ["auth", "e-api-auth"], title: "3. AuthService", body: "認証の処理に渡す。" },
    { ids: ["db", "e-auth-db"] },
  ],
);

// sequence preset ... actor 列 × 時系列 row、 UML sequence diagram 風
// 縦線 (見出し / 余白 / 足元) は最初の段から出したままにする。 1 つずつ光らせると
// 「誰の時間軸か」 が読めないまま最初の遣り取りが始まる。
const SEQ_LIFELINES = [
  "user-header", "user-spacer", "api-header", "api-spacer", "db-header", "db-spacer",
  "user-footer", "api-footer", "db-footer",
] as const;

export const presetSequence = withSteps(
  sequence({
    id: "seq-demo",
    topic: "時系列のやり取りを縦の時間軸で並べる図",
    actors: ["User", "API", "DB"],
    defaultTone: "accent",
    defaultStyle: "solid",
  })
    .step({ from: "User", to: "API", label: "POST /login", sub: "email + password" })
    .step({ from: "API", to: "DB", label: "SELECT credentials" })
    .step({ from: "DB", to: "API", label: "rows", tone: "success", style: "dotted-flow" })
    .step({ from: "API", to: "User", label: "200 OK", sub: "JWT token", tone: "success" })
    .build(),
  [
    { ids: [...SEQ_LIFELINES, "s0-user", "s0-api", "e0-user-api"], title: "1. POST /login", body: "User が API に送る。" },
    { ids: ["s1-api", "s1-db", "e1-api-db"], title: "2. SELECT credentials", body: "API が DB に問い合わせる。" },
    { ids: ["s2-db", "s2-api", "e2-db-api"], title: "3. rows", body: "DB が結果を返す。" },
    { ids: ["s3-api", "s3-user", "e3-api-user"] },
  ],
);

// topology preset ... 構成図 / deployment diagram、 group で container を囲む
const topo = topology({ id: "topo-demo", topic: "システムの構成要素と接続を配置で示す図", defaultTone: "teal" });
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

export const presetTopology = withSteps(topo.build(), [
  { ids: ["browser"], title: "1. Browser", body: "利用者側の入口。" },
  { ids: ["alb", "c0-browser-alb"], title: "2. ALB", body: "HTTPS を受けて振り分ける。" },
  { ids: ["ecs", "c1-alb-ecs"], title: "3. ECS Task", body: "container が処理する。" },
  { ids: ["rds", "c2-ecs-rds"] },
]);

// er preset ... ER 図 (User → Order の 1:N 関係)
export const presetEr = withSteps(
  er({ id: "er-demo", topic: "テーブル間の関係を表す図", defaultTone: "info" })
    .entity({ id: "user", title: "User", rows: ["id: PK", "email: string", "createdAt: timestamp"] })
    .entity({ id: "order", title: "Order", rows: ["id: PK", "userId: FK", "total: number", "status: enum"] })
    .relation({ from: "user", to: "order", cardinality: "1:N", label: "places" })
    .build(),
  [
    { ids: ["user"], title: "1. User 表", body: "利用者 1 行が主キーを持つ。" },
    { ids: ["order", "rel-0-user-order"] },
  ],
);

// stateMachine preset ... FSM (Auth フロー、 initial → loading → done/error → retry の workflow)
export const presetStateMachine = withSteps(
  stateMachine({ id: "fsm-demo", topic: "状態と遷移条件を示す図" })
    .state({ id: "idle", title: "Idle", initial: true })
    .state({ id: "loading", title: "Loading" })
    .state({ id: "done", title: "Done", final: true })
    .state({ id: "error", title: "Error" })
    .transition({ from: "idle", to: "loading", trigger: "submit" })
    .transition({ from: "loading", to: "done", trigger: "success", tone: "success" })
    .transition({ from: "loading", to: "error", trigger: "fail", tone: "error" })
    .transition({ from: "error", to: "idle", trigger: "retry", guard: "if attempts < 3" })
    .build(),
  [
    { ids: ["idle"], title: "1. Idle", body: "何も起きていない初期状態。" },
    { ids: ["loading", "t0-idle-loading"], title: "2. submit で Loading", body: "送信を受けて処理中になる。" },
    { ids: ["done", "t1-loading-done"], title: "3. success で Done", body: "成功して終わりの状態へ。" },
    { ids: ["error", "t2-loading-error", "t3-error-idle"] },
  ],
);

// ───────────── 新図種 12 種 (cdl v0.6+) ─────────────

// infrastructure preset ... cloud / system 構成図 (col + row grid)
export const presetInfrastructure = withSteps(
  infrastructure({ id: "infra-demo", topic: "クラウド・ネットワーク構成を階層で示す図" })
    .node({ id: "user", kind: "person", title: "User", col: 0, row: 0 })
    .node({ id: "cdn", kind: "cdn", title: "CloudFront", col: 1, row: 0 })
    .node({ id: "alb", kind: "service", title: "ALB", col: 2, row: 0 })
    .node({ id: "app", kind: "service", title: "App", col: 2, row: 1 })
    .node({ id: "db", kind: "database", title: "RDS", col: 3, row: 0 })
    .node({ id: "cache", kind: "cache", title: "Redis", col: 3, row: 1 })
    .connect({ from: "user", to: "cdn", label: "HTTPS" })
    .connect({ from: "cdn", to: "alb", label: "origin" })
    .connect({ from: "alb", to: "app", label: "route" })
    .connect({ from: "app", to: "db", label: "SQL" })
    .connect({ from: "app", to: "cache", label: "GET/SET" })
    .build(),
  [
    { ids: ["user"], title: "1. User", body: "利用者から始まる。" },
    { ids: ["cdn", "i0-user-cdn"], title: "2. CloudFront", body: "HTTPS を受ける。" },
    { ids: ["alb", "i1-cdn-alb"], title: "3. ALB", body: "origin へ振り分ける。" },
    { ids: ["app", "i2-alb-app"], title: "4. App", body: "処理を担う。" },
    { ids: ["db", "cache", "i3-app-db", "i4-app-cache"] },
  ],
);

// classDiagram preset ... UML クラス図
export const presetClassDiagram = withSteps(
  classDiagram({ id: "class-demo", topic: "クラスの継承・保有関係を示す UML 図" })
    .class({ id: "User", title: "User", attributes: ["+name: string", "+email: string"], methods: ["+login(): void", "+logout(): void"] })
    .class({ id: "Admin", title: "Admin", attributes: ["+permissions: string[]"], methods: ["+banUser(): void"] })
    .class({ id: "Order", title: "Order", attributes: ["+id: number", "+total: number"], methods: ["+pay(): void"] })
    .relation({ from: "Admin", to: "User", type: "extends" })
    // CAR-492 SSOT ... aggregates edge を Admin → Order に変更 (旧 User → Order は Admin が
    // 直線経路を塞ぐため上方 detour Y=78 まで大迂回、 label Y=104 で diagram 全体より上方に浮遊)。
    // Admin → Order は adjacent 隣接で直接水平 path、 label が edge 中央近傍に密着する。
    // semantic 的にも Admin が Order を管理する関係の方が UML 表現として妥当。
    .relation({ from: "Admin", to: "Order", type: "aggregates", cardinality: "1..*" })
    .build(),
  [
    { ids: ["User"], title: "1. User", body: "基になるクラス。" },
    { ids: ["Admin", "cr-0-Admin-User"], title: "2. Admin が継承", body: "User を継ぎ、権限を足す。" },
    { ids: ["Order", "cr-1-Admin-Order"] },
  ],
);

// tree preset ... 組織図 / file tree / class 階層
// 名前を状態から取り、組織の呼び方が変わる様子を見せる (cdl 0.7.0 で名前が状態を読む)。
export const presetTree = withSteps(
  bindFirstNode(
    tree({ id: "tree-demo", topic: "親子関係を縦階層で示す組織図・木構造" })
      .node({ id: "ceo", title: "CEO" })
      .node({ id: "cto", title: "CTO", parent: "ceo" })
      .node({ id: "cfo", title: "CFO", parent: "ceo" })
      .node({ id: "eng", title: "Eng Manager", parent: "cto" })
      .node({ id: "ops", title: "Ops Manager", parent: "cto" })
      .build(),
    (n) => ({
      ...n,
      treeData: n.treeData?.map((t) => (t.id === "eng" ? { ...t, title: "{eng}" } : t)),
    }),
  ),
  [
    { ids: ["tree-demo-tree"], title: "組織を作った時", body: "開発の責任者を Eng Manager と呼んでいる。" },
    { body: "呼び方だけが変わり、繋がりはそのまま。 名前を状態から取っている。", sets: [{ id: "eng", value: "VP of Engineering" }] },
  ],
  [{ id: "eng", initial: "Eng Manager" }],
);

// userJourney preset ... step + emotion + touchpoint
// 段で 1 つの段階の気持ちを動かす。 感情の欄は `{名前}` を受けるので、同じ図が改善前と
// 改善後を映す。
export const presetUserJourney = withSteps(
  bindFirstNode(
    userJourney({ id: "journey-demo", topic: "ユーザー体験の感情変化をステップ順に示す図" })
      .step({ id: "land", title: "Land on /", emotion: "neutral", touchpoint: "Website" })
      .step({ id: "form", title: "Fill signup form", emotion: "frustrated", touchpoint: "Form", opportunity: "input UX 改善" })
      .step({ id: "verify", title: "Email verify", emotion: "happy", touchpoint: "Email" })
      .step({ id: "done", title: "Dashboard", emotion: "delighted", touchpoint: "Dashboard" })
      .build(),
    (n) => ({
      ...n,
      journeyData: n.journeyData?.map((s) => (s.id === "form" ? { ...s, emotion: "{form_mood}" } : s)),
    }),
  ),
  [
    { ids: ["journey-demo-journey"], title: "改善前", body: "申込みの入力で気持ちが落ちる。", sets: [{ id: "form_mood", value: "frustrated" }] },
    { body: "入力の作りを直すと、その段階の気持ちだけが上がる。 曲線の高さを状態から取っている。", sets: [{ id: "form_mood", value: "happy" }] },
  ],
  [{ id: "form_mood", initial: "frustrated" }],
);

// mindMap preset ... 中心 + 放射 branch
// 中心の主題を状態から取り、主題が定まる様子を見せる (cdl 0.7.0 で名前が状態を読む)。
export const presetMindMap = withSteps(
  bindFirstNode(
    mindMap({ id: "mind-demo", topic: "中心の主題から発想を放射状に広げる図", rootId: "root", rootTitle: "Project" })
      .branch({ id: "feat", title: "Features", parent: "root" })
      .branch({ id: "ui", title: "UI design", parent: "root" })
      .branch({ id: "launch", title: "Launch", parent: "root" })
      .branch({ id: "auth", title: "Auth", parent: "feat" })
      .branch({ id: "billing", title: "Billing", parent: "feat" })
      .build(),
    (n) => ({
      ...n,
      mindData: n.mindData && { ...n.mindData, rootTitle: "{theme}" },
    }),
  ),
  [
    { ids: ["mind-demo-mind"], title: "書き出した時", body: "中心はまだ Project のまま。" },
    { body: "枝を見て中心の主題が決まる。 中心の名前を状態から取っている。", sets: [{ id: "theme", value: "認証と課金の刷新" }] },
  ],
  [{ id: "theme", initial: "Project" }],
);

// funnel preset ... Sales / marketing funnel
// 段の人数を状態から取り、先月と今月を同じ図で見る。
const FUNNEL_STAGES = [
  { id: "visit", title: "Visit", last: 8200, now: 10000 },
  { id: "signup", title: "Sign up", last: 1100, now: 1500 },
  { id: "trial", title: "Trial", last: 520, now: 800 },
  { id: "paid", title: "Paid", last: 130, now: 200 },
] as const;

const funnelBuilder = funnel({ id: "funnel-demo", topic: "各段階での離脱率を示す絞込みの図" });
for (const s of FUNNEL_STAGES) funnelBuilder.stage({ id: s.id, title: s.title, count: s.last });

export const presetFunnel = withSteps(
  bindFirstNode(funnelBuilder.build(), (n) => ({
    ...n,
    funnelData: n.funnelData?.map((s) => ({ ...s, count: `{${s.id}}` })),
  })),
  [
    { ids: ["funnel-demo-funnel"], title: "先月", body: "訪問 8200 から申込み 130 まで絞られる。" },
    {
      body: "今月は訪問 10000 / 申込み 200。 段の人数を状態から取るので、同じ図が別の月を映す。",
      tweens: FUNNEL_STAGES.map((s) => ({ id: s.id, from: s.last, to: s.now })),
    },
  ],
  FUNNEL_STAGES.map((s) => ({ id: s.id, initial: s.last })),
);

// quadrant preset ... 2 軸 matrix (4 象限完全配置、 cdl PR #32 で stack 衝突 bug 修正済)
// 1 項目の居場所を状態から取り、優先度の見直しで枠を移る様子を見せる。
export const presetQuadrant = withSteps(
  bindFirstNode(
    quadrant({
      id: "quad-demo",
      topic: "2 つの軸で 4 象限に分けて配置する優先度マトリクス",
      xAxis: { left: "Low effort", right: "High effort" },
      yAxis: { bottom: "Low value", top: "High value" },
    })
      .item({ id: "qw", title: "Quick win", quadrant: "topLeft" })
      .item({ id: "mp", title: "Major project", quadrant: "topRight" })
      .item({ id: "fi", title: "Fill in", quadrant: "bottomLeft" })
      .item({ id: "tt", title: "Thankless", quadrant: "bottomRight" })
      .build(),
    (n) => ({
      ...n,
      quadrantData: n.quadrantData && {
        ...n.quadrantData,
        items: n.quadrantData.items.map((it) => (it.id === "fi" ? { ...it, quadrant: "{fill_in_at}" } : it)),
      },
    }),
  ),
  [
    { ids: ["quad-demo-quadrant"], title: "見直し前", body: "Fill in は価値も労力も低い枠に置いてある。", sets: [{ id: "fill_in_at", value: "bottomLeft" }] },
    { body: "見直しで Fill in を価値の高い枠へ移す。 どの枠に居るかを状態から取っている。", sets: [{ id: "fill_in_at", value: "topLeft" }] },
  ],
  [{ id: "fill_in_at", initial: "bottomLeft" }],
);

// chart preset (pie) ... 統計チャート
// 扇の大きさを状態から取り、昨年と今年の内訳を同じ図で見る。
const PIE_SLICES = [
  { id: "pie_web", label: "Web", last: 45, now: 30 },
  { id: "pie_mobile", label: "Mobile", last: 35, now: 45 },
  { id: "pie_api", label: "API", last: 20, now: 25 },
] as const;

const pieBuilder = chart({ id: "chart-pie-demo", topic: "全体に対する内訳の割合を示す円グラフ", type: "pie" });
for (const s of PIE_SLICES) pieBuilder.datum({ id: s.id, label: s.label, value: s.last });

export const presetChartPie = withSteps(
  bindFirstNode(pieBuilder.build(), (n) => ({
    ...n,
    chartData: n.chartData?.map((c, i) => ({ ...c, value: `{${PIE_SLICES[i].id}}` })),
  })),
  [
    { ids: ["chart-pie-demo-chart"], title: "昨年の内訳", body: "Web 45 / Mobile 35 / API 20。" },
    {
      body: "今年は Mobile が 45 まで伸びる。 扇の大きさを状態から取っている。",
      tweens: PIE_SLICES.map((s) => ({ id: s.id, from: s.last, to: s.now })),
    },
  ],
  PIE_SLICES.map((s) => ({ id: s.id, initial: s.last })),
);

// chart preset (line) ... 時系列
// 折れ線の高さを状態から取り、計画と実績を同じ図で見る。
const LINE_POINTS = [
  { id: "line_jan", label: "Jan", plan: 1000, actual: 900 },
  { id: "line_feb", label: "Feb", plan: 1300, actual: 1400 },
  { id: "line_mar", label: "Mar", plan: 1100, actual: 1250 },
  { id: "line_apr", label: "Apr", plan: 1600, actual: 1750 },
] as const;

const lineBuilder = chart({ id: "chart-line-demo", topic: "時系列データの推移を線で示す折れ線グラフ", type: "line" });
for (const p of LINE_POINTS) lineBuilder.datum({ id: p.id, label: p.label, value: p.plan });

export const presetChartLine = withSteps(
  bindFirstNode(lineBuilder.build(), (n) => ({
    ...n,
    chartData: n.chartData?.map((c, i) => ({ ...c, value: `{${LINE_POINTS[i].id}}` })),
  })),
  [
    { ids: ["chart-line-demo-chart"], title: "計画", body: "四半期ごとの見込みを引いた線。" },
    {
      body: "実績に置き換えると 2 月以降が計画を上回る。 点の高さを状態から取っている。",
      tweens: LINE_POINTS.map((p) => ({ id: p.id, from: p.plan, to: p.actual })),
    },
  ],
  LINE_POINTS.map((p) => ({ id: p.id, initial: p.plan })),
);

// gantt preset ... sprint / release timeline
// 帯の終わりを状態から取り、作り込みが 1 期ぶん延びる様子を見せる。
export const presetGantt = withSteps(
  bindFirstNode(
    gantt({ id: "gantt-demo", topic: "タスクの期間と依存関係を横棒で示す進捗図" })
      .task({ id: "design", title: "Design", start: "Q1", end: "Q1", owner: "Designer" })
      .task({ id: "build", title: "Build", start: "Q2", end: "Q2", owner: "Eng", dependsOn: "design" })
      .task({ id: "test", title: "Test", start: "Q3", end: "Q3", owner: "QA", dependsOn: "build" })
      .task({ id: "ship", title: "Ship", start: "Q4", end: "Q4", owner: "PM", dependsOn: "test" })
      .build(),
    (n) => ({
      ...n,
      ganttData: n.ganttData?.map((t) => (t.id === "build" ? { ...t, endIdx: "{build_end}" } : t)),
    }),
  ),
  [
    { ids: ["gantt-demo-gantt"], title: "当初の計画", body: "Build は Q2 で終わる想定。" },
    {
      body: "作り込みが Q3 まで延びる。 帯の終わりを状態から取っている。",
      tweens: [{ id: "build_end", from: 1, to: 2 }],
    },
  ],
  [{ id: "build_end", initial: 1 }],
);

// flowchart preset ... swimlane + decision
export const presetFlowchart = withSteps(
  flowchart({ id: "flowchart-demo", topic: "分岐や判定を含む処理の流れを示す図", lanes: ["User", "Manager"] })
    .node({ id: "submit", title: "Submit request", shape: "start", lane: "User" })
    .node({ id: "review", title: "Review", shape: "decision", lane: "Manager" })
    .node({ id: "approve", title: "Approved", shape: "end", lane: "Manager" })
    .node({ id: "revise", title: "Revise", shape: "process", lane: "User" })
    .edge({ from: "submit", to: "review" })
    .edge({ from: "review", to: "approve", label: "true", tone: "success" })
    .edge({ from: "review", to: "revise", label: "false", tone: "warning" })
    .build(),
  [
    { ids: ["submit"], title: "1. Submit request", body: "User が申請を出す。" },
    { ids: ["review", "fc-0-submit-review"], title: "2. Review", body: "Manager が判定する。" },
    { ids: ["approve", "fc-1-review-approve"], title: "3. true なら Approved", body: "承認して終わる枝。" },
    { ids: ["revise", "fc-2-review-revise"] },
  ],
);

// network preset ... NW topology
export const presetNetwork = withSteps(
  network({ id: "network-demo", topic: "ネットワーク機器とセグメントの接続関係を示す図" })
    .device({ id: "fw", title: "Firewall", kind: "firewall", col: 0, row: 0, segment: "DMZ" })
    .device({ id: "sw1", title: "Switch A", kind: "switch", col: 1, row: 0, segment: "LAN" })
    .device({ id: "srv", title: "App Server", kind: "server", col: 2, row: 0 })
    .device({ id: "db", title: "DB Server", kind: "server", col: 2, row: 1 })
    .link({ from: "fw", to: "sw1", protocol: "VLAN 10" })
    .link({ from: "sw1", to: "srv", protocol: "TCP 22" })
    .link({ from: "sw1", to: "db", protocol: "TCP 5432" })
    .build(),
  [
    { ids: ["fw"], title: "1. Firewall", body: "DMZ の入口。" },
    { ids: ["sw1", "nl-0-fw-sw1"], title: "2. Switch A", body: "VLAN 10 で LAN に流す。" },
    { ids: ["srv", "nl-1-sw1-srv"], title: "3. App Server", body: "TCP 22 で繋がる。" },
    { ids: ["db", "nl-2-sw1-db"] },
  ],
);

// stateMachine2 preset ... 拡張 FSM (nested + action)
// 箱の既定幅 320 のままだと 4 状態を横に並べた図が幅 2439 world / 縦横比 6.04 になり、
// 親幅に収めた時に帯状に潰れて中身が読めない。 状態の幅を 280 に絞って 5.64 に収める
// (280 は最も長い題名 "Loading" が切れない下限 198 に余裕を持たせた値、 cdl#357)。
export const presetStateMachine2 = withSteps(
  stateMachine2({ id: "sm2-demo", topic: "階層状態や遷移アクションを持つ拡張ステート図", stateWidth: 280 })
    .state({ id: "idle", title: "Idle", initial: true, entry: "clearForm" })
    .state({ id: "active", title: "Active" })
    .state({ id: "loading", title: "Loading", parent: "active", entry: "startSpinner", exit: "stopSpinner" })
    .state({ id: "done", title: "Done", final: true })
    .transition({ from: "idle", to: "loading", trigger: "submit", action: "validate" })
    .transition({ from: "loading", to: "done", trigger: "success", tone: "success" })
    .build(),
  [
    { ids: ["idle"], title: "1. Idle", body: "clearForm を実行して待つ。" },
    { ids: ["active", "loading", "sm2-0-idle-loading"], title: "2. Active の中の Loading", body: "submit で入れ子の状態に入る。" },
    { ids: ["done", "sm2-1-loading-done"] },
  ],
);
