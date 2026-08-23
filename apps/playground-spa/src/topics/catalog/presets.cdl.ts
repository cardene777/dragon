import {
  swimlane,
  flow,
  sequence,
  topology,
  er,
  stateMachine,
  infrastructure,
  classDiagram,
  tree,
  userJourney,
  mindMap,
  funnel,
  quadrant,
  chart,
  gantt,
  flowchart,
  network,
  stateMachine2,
} from "@cardenelabs/cdl";
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
  /**
   * その段の長さ (ミリ秒、#1353)。 省略すると `STEP_DURATION`。
   *
   * 起点から描く段は伸ばす。 既定の 0.9 秒では、線が引かれる様子を追う前に引き終わる。
   * 図の性質で追える速さが違う (線は目で追い、扇は開き方を見る) ため、見本ごとに書く。
   *
   * 記法 (text DSL) は元から段ごとに秒数を書ける (`- step: "計画" 2.4s`)。 組み立て API 側
   * だけが 1 つの値に固定されており、その表現力を落としていた。
   */
  duration?: number;
  /**
   * その段で **起点から描く** 要素 (#1351)。
   *
   * 折れ線なら左端から右へ、円なら 12 時から時計回りに伸びる。 書かない段では従来どおり
   * 全長で出る。 対象の種別は描画側の `DRAW_KINDS` が持つ。
   *
   * `ids` (光らせる) とは別の欄にする。 図表の見本は箱が 1 つしか無く、その箱は最初の段から
   * 最後まで光り続けるため、光っていることを描く合図に使うと段が進むたびに線を引き直す。
   */
  draw?: readonly string[];
  /** 段の中で数を動かす (始点 → 終点) */
  tweens?: ReadonlyArray<{ id: string; from: number; to: number }>;
  /** 段に入った時点で値を切り替える */
  sets?: ReadonlyArray<{ id: string; value: string | number }>;
};

const STEP_DURATION = 900;

/**
 * 起点から描く段の長さ (ミリ秒、#1357)。
 *
 * 既定の 0.9 秒では、線が伸びる / 扇が開く様子を追う前に描き終わる。 見本ごとに違う値を
 * 置ける (`Step` の `duration`) が、同じページの中で速さがばらつくと比べにくいので
 * **描く段は 1 つの値に揃える**。
 */
const DRAW_DURATION = 2400;

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
function withSteps(
  d: CdlDiagram,
  steps: readonly Step[],
  states: readonly State[] = [],
): CdlDiagram {
  const auto = d.phases[0];
  const lit: string[] = [];
  const phases: Phase[] = steps.map((s, i) => {
    for (const id of s.ids ?? []) if (!lit.includes(id)) lit.push(id);
    return {
      id: `p${i + 1}`,
      duration: s.duration ?? STEP_DURATION,
      title: s.title ?? auto?.title ?? "",
      body: s.body ?? auto?.body ?? "",
      activate: [...lit],
      // 空なら欄ごと置かない (#1351)。 置くと `draw` を使わない見本の JSON の形が変わる =
      // 描画側の `builder.ts` も同じ扱いをしている
      ...((s.draw ?? []).length > 0 ? { draw: [...(s.draw ?? [])] } : {}),
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
const swim = swimlane({
  id: "swim-demo",
  topic: "処理を役割ごとに縦レーン分けして流れを示す図",
  lanes: ["Client", "Service", "Event"],
  laneWidth: 520,
});
const lSrc = swim.laneId("Client");
const lCt = swim.laneId("Service");
const lOut = swim.laneId("Event");
swim
  .node("user", { lane: lSrc, stack: 0, kind: "actor", title: "User" })
  .node("fn", { lane: lCt, stack: 0, kind: "function", title: "handler(...)" })
  .node("ev", { lane: lOut, stack: 0, kind: "event", title: "Processed" })
  .edge("user", "fn", { id: "call", label: "call", tone: "accent", style: "dotted-flow" })
  .edge("fn", "ev", { id: "emit", label: "emit", tone: "success", style: "dotted-flow" })
  .phase(
    "p",
    {
      duration: 2400,
      title: "swimlane",
      body: "swimlane preset で 3 lane を 1 行宣言、 lane.x auto-layout。",
    },
    (p: PhaseBuilder) => p.activate("user", "fn", "ev", "call", "emit").badge("preset"),
  );

export const presetSwimlane = withSteps(swim.build(), [
  { ids: ["user"], title: "1. Client の User", body: "外から呼ぶ人が最初の縦列に立つ。" },
  { ids: ["fn", "call"], title: "2. Service の handler", body: "呼び出しが隣の縦列に渡る。" },
  { ids: ["ev", "emit"] },
]);

// flow preset ... 1 lane に縦 stack、 前 step → 次 step 自動接続
export const presetFlow = withSteps(
  flow({
    id: "flow-demo",
    topic: "処理の順番を上から下へ 1 本の流れで示す図",
    laneLabel: "Authentication Flow",
    defaultTone: "teal",
  })
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
  "user-header",
  "user-spacer",
  "api-header",
  "api-spacer",
  "db-header",
  "db-spacer",
  "user-footer",
  "api-footer",
  "db-footer",
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
    {
      ids: [...SEQ_LIFELINES, "s0-user", "s0-api", "e0-user-api"],
      title: "1. POST /login",
      body: "User が API に送る。",
    },
    {
      ids: ["s1-api", "s1-db", "e1-api-db"],
      title: "2. SELECT credentials",
      body: "API が DB に問い合わせる。",
    },
    { ids: ["s2-db", "s2-api", "e2-db-api"], title: "3. rows", body: "DB が結果を返す。" },
    { ids: ["s3-api", "s3-user", "e3-api-user"] },
  ],
);

// topology preset ... 構成図 / deployment diagram、 group で container を囲む
const topo = topology({
  id: "topo-demo",
  topic: "システムの構成要素と接続を配置で示す図",
  defaultTone: "teal",
});
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
    .entity({
      id: "user",
      title: "User",
      rows: ["id: PK", "email: string", "createdAt: timestamp"],
    })
    .entity({
      id: "order",
      title: "Order",
      rows: ["id: PK", "userId: FK", "total: number", "status: enum"],
    })
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
    {
      ids: ["loading", "t0-idle-loading"],
      title: "2. submit で Loading",
      body: "送信を受けて処理中になる。",
    },
    {
      ids: ["done", "t1-loading-done"],
      title: "3. success で Done",
      body: "成功して終わりの状態へ。",
    },
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
    .class({
      id: "User",
      title: "User",
      attributes: ["+name: string", "+email: string"],
      methods: ["+login(): void", "+logout(): void"],
    })
    .class({
      id: "Admin",
      title: "Admin",
      attributes: ["+permissions: string[]"],
      methods: ["+banUser(): void"],
    })
    .class({
      id: "Order",
      title: "Order",
      attributes: ["+id: number", "+total: number"],
      methods: ["+pay(): void"],
    })
    .relation({ from: "Admin", to: "User", type: "extends" })
    // CAR-492 SSOT ... aggregates edge を Admin → Order に変更 (旧 User → Order は Admin が
    // 直線経路を塞ぐため上方 detour Y=78 まで大迂回、 label Y=104 で diagram 全体より上方に浮遊)。
    // Admin → Order は adjacent 隣接で直接水平 path、 label が edge 中央近傍に密着する。
    // semantic 的にも Admin が Order を管理する関係の方が UML 表現として妥当。
    .relation({ from: "Admin", to: "Order", type: "aggregates", cardinality: "1..*" })
    .build(),
  [
    { ids: ["User"], title: "1. User", body: "基になるクラス。" },
    {
      ids: ["Admin", "cr-0-Admin-User"],
      title: "2. Admin が継承",
      body: "User を継ぎ、権限を足す。",
    },
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
    {
      ids: ["tree-demo-tree"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["tree-demo-tree"],
      duration: DRAW_DURATION,
      title: "組織を作った時",
      body: "開発の責任者を Eng Manager と呼んでいる。",
    },
    {
      body: "呼び方だけが変わり、繋がりはそのまま。 名前を状態から取っている。",
      sets: [{ id: "eng", value: "VP of Engineering" }],
    },
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
      .step({
        id: "form",
        title: "Fill signup form",
        emotion: "frustrated",
        touchpoint: "Form",
        opportunity: "input UX 改善",
      })
      .step({ id: "verify", title: "Email verify", emotion: "happy", touchpoint: "Email" })
      .step({ id: "done", title: "Dashboard", emotion: "delighted", touchpoint: "Dashboard" })
      .build(),
    (n) => ({
      ...n,
      journeyData: n.journeyData?.map((s) =>
        s.id === "form" ? { ...s, emotion: "{form_mood}" } : s,
      ),
    }),
  ),
  [
    {
      ids: ["journey-demo-journey"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["journey-demo-journey"],
      duration: DRAW_DURATION,
      title: "改善前",
      body: "申込みの入力で気持ちが落ちる。",
      sets: [{ id: "form_mood", value: "frustrated" }],
    },
    {
      body: "入力の作りを直すと、その段階の気持ちだけが上がる。 曲線の高さを状態から取っている。",
      sets: [{ id: "form_mood", value: "happy" }],
    },
  ],
  [{ id: "form_mood", initial: "frustrated" }],
);

// mindMap preset ... 中心 + 放射 branch
// 中心の主題を状態から取り、主題が定まる様子を見せる (cdl 0.7.0 で名前が状態を読む)。
export const presetMindMap = withSteps(
  bindFirstNode(
    mindMap({
      id: "mind-demo",
      topic: "中心の主題から発想を放射状に広げる図",
      rootId: "root",
      rootTitle: "Project",
    })
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
    {
      ids: ["mind-demo-mind"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["mind-demo-mind"],
      duration: DRAW_DURATION,
      title: "書き出した時",
      body: "中心はまだ Project のまま。",
    },
    {
      body: "枝を見て中心の主題が決まる。 中心の名前を状態から取っている。",
      sets: [{ id: "theme", value: "認証と課金の刷新" }],
    },
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
    {
      ids: ["funnel-demo-funnel"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["funnel-demo-funnel"],
      duration: DRAW_DURATION,
      title: "先月",
      body: "訪問 8200 から申込み 130 まで絞られる。",
    },
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
        items: n.quadrantData.items.map((it) =>
          it.id === "fi" ? { ...it, quadrant: "{fill_in_at}" } : it,
        ),
      },
    }),
  ),
  [
    {
      ids: ["quad-demo-quadrant"],
      title: "見直し前",
      body: "Fill in は価値も労力も低い枠に置いてある。",
      sets: [{ id: "fill_in_at", value: "bottomLeft" }],
    },
    {
      body: "見直しで Fill in を価値の高い枠へ移す。 どの枠に居るかを状態から取っている。",
      sets: [{ id: "fill_in_at", value: "topLeft" }],
    },
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

const pieBuilder = chart({
  id: "chart-pie-demo",
  topic: "全体に対する内訳の割合を示す円グラフ",
  type: "pie",
});
for (const s of PIE_SLICES) pieBuilder.datum({ id: s.id, label: s.label, value: s.last });

export const presetChartPie = withSteps(
  bindFirstNode(pieBuilder.build(), (n) => ({
    ...n,
    chartData: n.chartData?.map((c, i) => ({ ...c, value: `{${PIE_SLICES[i].id}}` })),
  })),
  [
    {
      ids: ["chart-pie-demo-chart"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["chart-pie-demo-chart"],
      duration: DRAW_DURATION,
      title: "昨年の内訳",
      body: "Web 45 / Mobile 35 / API 20。",
    },
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

const lineBuilder = chart({
  id: "chart-line-demo",
  topic: "時系列データの推移を線で示す折れ線グラフ",
  type: "line",
});
for (const p of LINE_POINTS) lineBuilder.datum({ id: p.id, label: p.label, value: p.plan });

export const presetChartLine = withSteps(
  bindFirstNode(lineBuilder.build(), (n) => ({
    ...n,
    chartData: n.chartData?.map((c, i) => ({ ...c, value: `{${LINE_POINTS[i].id}}` })),
  })),
  [
    {
      ids: ["chart-line-demo-chart"],
      // 左端から右へ線が伸びる (#1351)。 開いた瞬間に全長で出ると静止画と区別が付かない
      draw: ["chart-line-demo-chart"],
      // 描く段は伸ばす (#1353)。 既定の 0.9 秒では引かれる様子を追う前に引き終わる
      duration: DRAW_DURATION,
      title: "計画",
      body: "四半期ごとの見込みを引いた線。 左から順に引かれる。",
    },
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
      .task({
        id: "build",
        title: "Build",
        start: "Q2",
        end: "Q2",
        owner: "Eng",
        dependsOn: "design",
      })
      .task({ id: "test", title: "Test", start: "Q3", end: "Q3", owner: "QA", dependsOn: "build" })
      .task({ id: "ship", title: "Ship", start: "Q4", end: "Q4", owner: "PM", dependsOn: "test" })
      .build(),
    (n) => ({
      ...n,
      ganttData: n.ganttData?.map((t) => (t.id === "build" ? { ...t, endIdx: "{build_end}" } : t)),
    }),
  ),
  [
    {
      ids: ["gantt-demo-gantt"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["gantt-demo-gantt"],
      duration: DRAW_DURATION,
      title: "当初の計画",
      body: "Build は Q2 で終わる想定。",
    },
    {
      body: "作り込みが Q3 まで延びる。 帯の終わりを状態から取っている。",
      tweens: [{ id: "build_end", from: 1, to: 2 }],
    },
  ],
  [{ id: "build_end", initial: 1 }],
);

// flowchart preset ... swimlane + decision
export const presetFlowchart = withSteps(
  flowchart({
    id: "flowchart-demo",
    topic: "分岐や判定を含む処理の流れを示す図",
    lanes: ["User", "Manager"],
  })
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
    {
      ids: ["approve", "fc-1-review-approve"],
      title: "3. true なら Approved",
      body: "承認して終わる枝。",
    },
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
  stateMachine2({
    id: "sm2-demo",
    topic: "階層状態や遷移アクションを持つ拡張ステート図",
    stateWidth: 280,
  })
    .state({ id: "idle", title: "Idle", initial: true, entry: "clearForm" })
    .state({ id: "active", title: "Active" })
    .state({
      id: "loading",
      title: "Loading",
      parent: "active",
      entry: "startSpinner",
      exit: "stopSpinner",
    })
    .state({ id: "done", title: "Done", final: true })
    .transition({ from: "idle", to: "loading", trigger: "submit", action: "validate" })
    .transition({ from: "loading", to: "done", trigger: "success", tone: "success" })
    .build(),
  [
    { ids: ["idle"], title: "1. Idle", body: "clearForm を実行して待つ。" },
    {
      ids: ["active", "loading", "sm2-0-idle-loading"],
      title: "2. Active の中の Loading",
      body: "submit で入れ子の状態に入る。",
    },
    { ids: ["done", "sm2-1-loading-done"] },
  ],
);

// ───────────── 記法 (#1237) ─────────────
//
// catalog は `sourceYaml__<図の export 名>` の名前で記法を拾う (`lib/catalog-items.ts`)。
// 記法があると画面で「コード」 を読めて「エディタで開く」 が押せる。
//
// **記法と組み立て API が同じ図になることは検査で確かめる** (`lib/preset-source-parity.test.ts`)。
// 箱と矢印と縦列の id と並び、段の題、段が光らせる先を突き合わせる。
//
// 段の `focus:` は **箱の名前か矢印しか受けない** (`focus.ts` が生成 id を意図的に拒否する)。
// 組み立て API 側は光った先を積み上げるので、記法でも各段に前の段の分を並べて書く。

export const sourceYaml__presetSequence = `title: "時系列のやり取りを縦の時間軸で並べる図"
type: sequence
actors:
  - User
  - API
  - DB
flow:
  - User -> API: "POST /login" (solid) { sub: "email + password" }
  - API -> DB: "SELECT credentials" (solid)
  - DB -> API: "rows" (success, dotted-flow)
  - API -> User: "200 OK" (success, solid) { sub: "JWT token" }
animation:
  - step: "1. POST /login" 0.9s
    focus: [User -> API]
    badge: "sequence"
    body: "User が API に送る。"
  - step: "2. SELECT credentials" 0.9s
    focus: [User -> API, API -> DB]
    badge: "sequence"
    body: "API が DB に問い合わせる。"
  - step: "3. rows" 0.9s
    focus: [User -> API, API -> DB, DB -> API]
    badge: "sequence"
    body: "DB が結果を返す。"
  - step: "時系列のやり取りを縦の時間軸で並べる図" 0.9s
    focus: [User -> API, API -> DB, DB -> API, API -> User]
    badge: "sequence"
    body: "sequence の全 message を時系列展開。"
`;

export const sourceJson__presetSequence = `{
  "title": "時系列のやり取りを縦の時間軸で並べる図",
  "type": "sequence",
  "actors": [{"name": "User"}, {"name": "API"}, {"name": "DB"}],
  "flow": [
    {
      "from": "User",
      "to": "API",
      "label": "POST /login",
      "sub": "email + password",
      "style": "solid"
    },
    { "from": "API", "to": "DB", "label": "SELECT credentials", "style": "solid" },
    { "from": "DB", "to": "API", "label": "rows", "tone": "success", "style": "dotted-flow" },
    {
      "from": "API",
      "to": "User",
      "label": "200 OK",
      "sub": "JWT token",
      "tone": "success",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "1. POST /login",
      "duration": 0.9,
      "focus": ["User -> API"],
      "body": "User が API に送る。",
      "badge": "sequence"
    },
    {
      "step": "2. SELECT credentials",
      "duration": 0.9,
      "focus": ["User -> API", "API -> DB"],
      "body": "API が DB に問い合わせる。",
      "badge": "sequence"
    },
    {
      "step": "3. rows",
      "duration": 0.9,
      "focus": ["User -> API", "API -> DB", "DB -> API"],
      "body": "DB が結果を返す。",
      "badge": "sequence"
    },
    {
      "step": "時系列のやり取りを縦の時間軸で並べる図",
      "duration": 0.9,
      "focus": ["User -> API", "API -> DB", "DB -> API", "API -> User"],
      "body": "sequence の全 message を時系列展開。",
      "badge": "sequence"
    }
  ]
}`;

export const sourceYaml__presetEr = `title: "テーブル間の関係を表す図"
type: er
actors:
  - User: { kind: storage, eyebrow: "エンティティ", rows: ["id: PK", "email: string", "createdAt: timestamp"] }
  - Order: { kind: storage, eyebrow: "エンティティ", rows: ["id: PK", "userId: FK", "total: number", "status: enum"] }
flow:
  - User -> Order: "places" (info, solid) { sub: "1:N" }
animation:
  - step: "1. User 表" 0.9s
    focus: [User]
    badge: "er"
    body: "利用者 1 行が主キーを持つ。"
  - step: "テーブル間の関係を表す図" 0.9s
    focus: [User, Order, "User -> Order"]
    badge: "er"
    body: "ER 図の全 entity + relation を visible 化。"
`;

export const sourceJson__presetEr = `{
  "title": "テーブル間の関係を表す図",
  "type": "er",
  "actors": [
    {
      "name": "User",
      "kind": "storage",
      "eyebrow": "エンティティ",
      "rows": ["id: PK", "email: string", "createdAt: timestamp"]
    },
    {
      "name": "Order",
      "kind": "storage",
      "eyebrow": "エンティティ",
      "rows": ["id: PK", "userId: FK", "total: number", "status: enum"]
    }
  ],
  "flow": [
    {
      "from": "User",
      "to": "Order",
      "label": "places",
      "sub": "1:N",
      "tone": "info",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "1. User 表",
      "duration": 0.9,
      "focus": ["User"],
      "body": "利用者 1 行が主キーを持つ。",
      "badge": "er"
    },
    {
      "step": "テーブル間の関係を表す図",
      "duration": 0.9,
      "focus": ["User", "Order", "User -> Order"],
      "body": "ER 図の全 entity + relation を visible 化。",
      "badge": "er"
    }
  ]
}`;

export const sourceYaml__presetFlow = `title: "処理の順番を上から下へ 1 本の流れで示す図"
type: flow
lanes:
  main: { label: "Authentication Flow" }
actors:
  - User: { kind: person, eyebrow: "ユーザー" }
  - POST /login: { kind: api, eyebrow: "API" }
  - AuthService: { kind: service, eyebrow: "サービス" }
  - users 表: { kind: database, eyebrow: "DB" }
flow:
  - User -> POST /login: "ログイン要求" (teal, dotted-flow)
  - POST /login -> AuthService: "認証処理" (teal, dotted-flow)
  - AuthService -> users 表: "credential 検証" (teal, dotted-flow)
animation:
  - step: "1. User" 0.9s
    badge: "flow"
    focus: [User]
    body: "ログインしようとする人から始まる。"
  - step: "2. POST /login" 0.9s
    badge: "flow"
    focus: [User, "POST /login", "User -> POST /login"]
    body: "ログイン要求を受け取る。"
  - step: "3. AuthService" 0.9s
    badge: "flow"
    focus: [User, "POST /login", AuthService, "User -> POST /login", "POST /login -> AuthService"]
    body: "認証の処理に渡す。"
  - step: "処理の順番を上から下へ 1 本の流れで示す図" 0.9s
    badge: "flow"
    focus: [User, "POST /login", AuthService, "users 表", "User -> POST /login", "POST /login -> AuthService", "AuthService -> users 表"]
    body: "全 step 順次実行。"
`;

export const sourceJson__presetFlow = `{
  "title": "処理の順番を上から下へ 1 本の流れで示す図",
  "type": "flow",
  "lanes": { "main": {"label": "Authentication Flow"} },
  "actors": [
    { "name": "User", "kind": "person", "eyebrow": "ユーザー" },
    { "name": "POST /login", "kind": "api", "eyebrow": "API" },
    { "name": "AuthService", "kind": "service", "eyebrow": "サービス" },
    { "name": "users 表", "kind": "database", "eyebrow": "DB" }
  ],
  "flow": [
    {
      "from": "User",
      "to": "POST /login",
      "label": "ログイン要求",
      "tone": "teal",
      "style": "dotted-flow"
    },
    {
      "from": "POST /login",
      "to": "AuthService",
      "label": "認証処理",
      "tone": "teal",
      "style": "dotted-flow"
    },
    {
      "from": "AuthService",
      "to": "users 表",
      "label": "credential 検証",
      "tone": "teal",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "1. User",
      "duration": 0.9,
      "focus": ["User"],
      "body": "ログインしようとする人から始まる。",
      "badge": "flow"
    },
    {
      "step": "2. POST /login",
      "duration": 0.9,
      "focus": ["User", "POST /login", "User -> POST /login"],
      "body": "ログイン要求を受け取る。",
      "badge": "flow"
    },
    {
      "step": "3. AuthService",
      "duration": 0.9,
      "focus": [
        "User",
        "POST /login",
        "AuthService",
        "User -> POST /login",
        "POST /login -> AuthService"
      ],
      "body": "認証の処理に渡す。",
      "badge": "flow"
    },
    {
      "step": "処理の順番を上から下へ 1 本の流れで示す図",
      "duration": 0.9,
      "focus": [
        "User",
        "POST /login",
        "AuthService",
        "users 表",
        "User -> POST /login",
        "POST /login -> AuthService",
        "AuthService -> users 表"
      ],
      "body": "全 step 順次実行。",
      "badge": "flow"
    }
  ]
}`;

export const sourceYaml__presetChartPie = `title: "全体に対する内訳の割合を示す円グラフ"
eyebrow: "pie"
type: pie

actors:
  - Web: "{pie_web}"
  - Mobile: "{pie_mobile}"
  - API: "{pie_api}"

states:
  pie_web: 45
  pie_mobile: 35
  pie_api: 20

animation:
  - step: "昨年の内訳" 2.4s
    badge: "pie"
    focus: [Web]
    draw: pie
    body: "Web 45 / Mobile 35 / API 20。"
  - step: "全体に対する内訳の割合を示す円グラフ" 0.9s
    badge: "pie"
    focus: [Web]
    tween:
      pie_web: 45 -> 30
      pie_mobile: 35 -> 45
      pie_api: 20 -> 25
    body: "今年は Mobile が 45 まで伸びる。 扇の大きさを状態から取っている。"
`;

export const sourceJson__presetChartPie = `{
  "title": "全体に対する内訳の割合を示す円グラフ",
  "type": "pie",
  "eyebrow": "pie",
  "actors": [
    { "name": "Web", "subtitle": "{pie_web}" },
    { "name": "Mobile", "subtitle": "{pie_mobile}" },
    { "name": "API", "subtitle": "{pie_api}" }
  ],
  "flow": [],
  "states": { "pie_web": 45, "pie_mobile": 35, "pie_api": 20 },
  "animation": [
    {
      "step": "昨年の内訳",
      "duration": 2.4,
      "focus": ["Web"],
      "draw": "pie",
      "body": "Web 45 / Mobile 35 / API 20。",
      "badge": "pie"
    },
    {
      "step": "全体に対する内訳の割合を示す円グラフ",
      "duration": 0.9,
      "focus": ["Web"],
      "body": "今年は Mobile が 45 まで伸びる。 扇の大きさを状態から取っている。",
      "badge": "pie",
      "tween": { "pie_web": [45, 30], "pie_mobile": [35, 45], "pie_api": [20, 25] }
    }
  ]
}`;

export const sourceYaml__presetChartLine = `title: "時系列データの推移を線で示す折れ線グラフ"
eyebrow: "line"
type: line

actors:
  - Jan: "{line_jan}"
  - Feb: "{line_feb}"
  - Mar: "{line_mar}"
  - Apr: "{line_apr}"

states:
  line_jan: 1000
  line_feb: 1300
  line_mar: 1100
  line_apr: 1600

animation:
  - step: "計画" 2.4s
    badge: "line"
    focus: [Jan]
    draw: line
    body: "四半期ごとの見込みを引いた線。 左から順に引かれる。"
  - step: "時系列データの推移を線で示す折れ線グラフ" 0.9s
    badge: "line"
    focus: [Jan]
    tween:
      line_jan: 1000 -> 900
      line_feb: 1300 -> 1400
      line_mar: 1100 -> 1250
      line_apr: 1600 -> 1750
    body: "実績に置き換えると 2 月以降が計画を上回る。 点の高さを状態から取っている。"
`;

export const sourceJson__presetChartLine = `{
  "title": "時系列データの推移を線で示す折れ線グラフ",
  "type": "line",
  "eyebrow": "line",
  "actors": [
    { "name": "Jan", "subtitle": "{line_jan}" },
    { "name": "Feb", "subtitle": "{line_feb}" },
    { "name": "Mar", "subtitle": "{line_mar}" },
    { "name": "Apr", "subtitle": "{line_apr}" }
  ],
  "flow": [],
  "states": { "line_jan": 1000, "line_feb": 1300, "line_mar": 1100, "line_apr": 1600 },
  "animation": [
    {
      "step": "計画",
      "duration": 2.4,
      "focus": ["Jan"],
      "draw": "line",
      "body": "四半期ごとの見込みを引いた線。 左から順に引かれる。",
      "badge": "line"
    },
    {
      "step": "時系列データの推移を線で示す折れ線グラフ",
      "duration": 0.9,
      "focus": ["Jan"],
      "body": "実績に置き換えると 2 月以降が計画を上回る。 点の高さを状態から取っている。",
      "badge": "line",
      "tween": {
        "line_jan": [1000, 900],
        "line_feb": [1300, 1400],
        "line_mar": [1100, 1250],
        "line_apr": [1600, 1750]
      }
    }
  ]
}`;

export const sourceYaml__presetFunnel = `title: "各段階での離脱率を示す絞込みの図"
eyebrow: "funnel"
type: funnel

lanes:
  chart: { width: 624 }

actors:
  - Visit: "{visit}"
  - Sign up: "{signup}"
  - Trial: "{trial}"
  - Paid: "{paid}"

states:
  visit: 8200
  signup: 1100
  trial: 520
  paid: 130

animation:
  - step: "先月" 2.4s
    badge: "funnel"
    focus: [Visit]
    draw: funnel
    body: "訪問 8200 から申込み 130 まで絞られる。"
  - step: "各段階での離脱率を示す絞込みの図" 0.9s
    badge: "funnel"
    focus: [Visit]
    tween:
      visit: 8200 -> 10000
      signup: 1100 -> 1500
      trial: 520 -> 800
      paid: 130 -> 200
    body: "今月は訪問 10000 / 申込み 200。 段の人数を状態から取るので、同じ図が別の月を映す。"
`;

export const sourceJson__presetFunnel = `{
  "title": "各段階での離脱率を示す絞込みの図",
  "type": "funnel",
  "eyebrow": "funnel",
  "lanes": { "chart": {"width": 624} },
  "actors": [
    { "name": "Visit", "subtitle": "{visit}" },
    { "name": "Sign up", "subtitle": "{signup}" },
    { "name": "Trial", "subtitle": "{trial}" },
    { "name": "Paid", "subtitle": "{paid}" }
  ],
  "flow": [],
  "states": { "visit": 8200, "signup": 1100, "trial": 520, "paid": 130 },
  "animation": [
    {
      "step": "先月",
      "duration": 2.4,
      "focus": ["Visit"],
      "draw": "funnel",
      "body": "訪問 8200 から申込み 130 まで絞られる。",
      "badge": "funnel"
    },
    {
      "step": "各段階での離脱率を示す絞込みの図",
      "duration": 0.9,
      "focus": ["Visit"],
      "body": "今月は訪問 10000 / 申込み 200。 段の人数を状態から取るので、同じ図が別の月を映す。",
      "badge": "funnel",
      "tween": {
        "visit": [8200, 10000],
        "signup": [1100, 1500],
        "trial": [520, 800],
        "paid": [130, 200]
      }
    }
  ]
}`;

export const sourceYaml__presetTree = `title: "親子関係を縦階層で示す組織図・木構造"
eyebrow: "tree"
type: tree

lanes:
  chart: { width: 720 }

actors:
  - CEO
  - CTO
  - CFO
  - "{eng}"
  - Ops Manager

states:
  eng: "Eng Manager"

flow:
  - CEO -> CTO: ""
  - CEO -> CFO: ""
  - CTO -> "{eng}": ""
  - CTO -> Ops Manager: ""

animation:
  - step: "組織を作った時" 2.4s
    badge: "tree"
    focus: [CEO]
    draw: tree
    body: "開発の責任者を Eng Manager と呼んでいる。"
  - step: "親子関係を縦階層で示す組織図・木構造" 0.9s
    badge: "tree"
    focus: [CEO]
    set:
      eng: "VP of Engineering"
    body: "呼び方だけが変わり、繋がりはそのまま。 名前を状態から取っている。"
`;

export const sourceJson__presetTree = `{
  "title": "親子関係を縦階層で示す組織図・木構造",
  "type": "tree",
  "eyebrow": "tree",
  "lanes": { "chart": {"width": 720} },
  "actors": [
    { "name": "CEO" },
    { "name": "CTO" },
    { "name": "CFO" },
    { "name": "{eng}" },
    { "name": "Ops Manager" }
  ],
  "flow": [
    { "from": "CEO", "to": "CTO", "label": "" },
    { "from": "CEO", "to": "CFO", "label": "" },
    { "from": "CTO", "to": "{eng}", "label": "" },
    { "from": "CTO", "to": "Ops Manager", "label": "" }
  ],
  "states": { "eng": "Eng Manager" },
  "animation": [
    {
      "step": "組織を作った時",
      "duration": 2.4,
      "focus": ["CEO"],
      "draw": "tree",
      "body": "開発の責任者を Eng Manager と呼んでいる。",
      "badge": "tree"
    },
    {
      "step": "親子関係を縦階層で示す組織図・木構造",
      "duration": 0.9,
      "focus": ["CEO"],
      "body": "呼び方だけが変わり、繋がりはそのまま。 名前を状態から取っている。",
      "badge": "tree",
      "set": { "eng": "VP of Engineering" }
    }
  ]
}`;

export const sourceYaml__presetMindMap = `title: "中心の主題から発想を放射状に広げる図"
eyebrow: "mindMap"
type: mind

lanes:
  chart: { width: 720 }

actors:
  - "{theme}"
  - Features
  - UI design
  - Launch
  - Auth
  - Billing

states:
  theme: "Project"

flow:
  - Features -> Auth: ""
  - Features -> Billing: ""

animation:
  - step: "書き出した時" 2.4s
    badge: "mindmap"
    focus: [Features]
    draw: mind
    body: "中心はまだ Project のまま。"
  - step: "中心の主題から発想を放射状に広げる図" 0.9s
    badge: "mindmap"
    focus: [Features]
    set:
      theme: "認証と課金の刷新"
    body: "枝を見て中心の主題が決まる。 中心の名前を状態から取っている。"
`;

export const sourceJson__presetMindMap = `{
  "title": "中心の主題から発想を放射状に広げる図",
  "type": "mind",
  "eyebrow": "mindMap",
  "lanes": { "chart": {"width": 720} },
  "actors": [
    { "name": "{theme}" },
    { "name": "Features" },
    { "name": "UI design" },
    { "name": "Launch" },
    { "name": "Auth" },
    { "name": "Billing" }
  ],
  "flow": [
    { "from": "Features", "to": "Auth", "label": "" },
    { "from": "Features", "to": "Billing", "label": "" }
  ],
  "states": { "theme": "Project" },
  "animation": [
    {
      "step": "書き出した時",
      "duration": 2.4,
      "focus": ["Features"],
      "draw": "mind",
      "body": "中心はまだ Project のまま。",
      "badge": "mindmap"
    },
    {
      "step": "中心の主題から発想を放射状に広げる図",
      "duration": 0.9,
      "focus": ["Features"],
      "body": "枝を見て中心の主題が決まる。 中心の名前を状態から取っている。",
      "badge": "mindmap",
      "set": { "theme": "認証と課金の刷新" }
    }
  ]
}`;

export const sourceYaml__presetUserJourney = `title: "ユーザー体験の感情変化をステップ順に示す図"
eyebrow: "userJourney"
type: journey

lanes:
  chart: { width: 720 }

actors:
  - Land on /: { value: "普通", touchpoint: "Website" }
  - Fill signup form: { value: "{form_mood}", touchpoint: "Form", opportunity: "input UX 改善" }
  - Email verify: { value: "満足", touchpoint: "Email" }
  - Dashboard: { value: "最高", touchpoint: "Dashboard" }

states:
  form_mood: "不満"

animation:
  - step: "改善前" 2.4s
    badge: "journey"
    focus: ["Land on /"]
    draw: journey
    set:
      form_mood: "不満"
    body: "申込みの入力で気持ちが落ちる。"
  - step: "ユーザー体験の感情変化をステップ順に示す図" 0.9s
    badge: "journey"
    focus: ["Land on /"]
    set:
      form_mood: "満足"
    body: "入力の作りを直すと、その段階の気持ちだけが上がる。 曲線の高さを状態から取っている。"
`;

export const sourceJson__presetUserJourney = `{
  "title": "ユーザー体験の感情変化をステップ順に示す図",
  "type": "journey",
  "eyebrow": "userJourney",
  "lanes": { "chart": {"width": 720} },
  "actors": [
    { "name": "Land on /", "value": "普通", "touchpoint": "Website" },
    {
      "name": "Fill signup form",
      "value": "{form_mood}",
      "touchpoint": "Form",
      "opportunity": "input UX 改善"
    },
    { "name": "Email verify", "value": "満足", "touchpoint": "Email" },
    { "name": "Dashboard", "value": "最高", "touchpoint": "Dashboard" }
  ],
  "flow": [],
  "states": { "form_mood": "不満" },
  "animation": [
    {
      "step": "改善前",
      "duration": 2.4,
      "focus": ["Land on /"],
      "draw": "journey",
      "body": "申込みの入力で気持ちが落ちる。",
      "badge": "journey",
      "set": { "form_mood": "不満" }
    },
    {
      "step": "ユーザー体験の感情変化をステップ順に示す図",
      "duration": 0.9,
      "focus": ["Land on /"],
      "body": "入力の作りを直すと、その段階の気持ちだけが上がる。 曲線の高さを状態から取っている。",
      "badge": "journey",
      "set": { "form_mood": "満足" }
    }
  ]
}`;

export const sourceYaml__presetQuadrant = `title: "2 つの軸で 4 象限に分けて配置する優先度マトリクス"
eyebrow: "quadrant"
type: quadrant

axes:
  x: { left: "Low effort", right: "High effort" }
  y: { bottom: "Low value", top: "High value" }

actors:
  - Quick win: "左上"
  - Major project: "右上"
  - Fill in: "{fill_in_at}"
  - Thankless: "右下"

states:
  fill_in_at: "左下"

animation:
  - step: "見直し前" 0.9s
    badge: "quadrant"
    focus: ["Quick win"]
    set:
      fill_in_at: "左下"
    body: "Fill in は価値も労力も低い枠に置いてある。"
  - step: "2 つの軸で 4 象限に分けて配置する優先度マトリクス" 0.9s
    badge: "quadrant"
    focus: ["Quick win"]
    set:
      fill_in_at: "左上"
    body: "見直しで Fill in を価値の高い枠へ移す。 どの枠に居るかを状態から取っている。"
`;

export const sourceJson__presetQuadrant = `{
  "title": "2 つの軸で 4 象限に分けて配置する優先度マトリクス",
  "type": "quadrant",
  "eyebrow": "quadrant",
  "axes": {
    "x": { "left": "Low effort", "right": "High effort" },
    "y": { "bottom": "Low value", "top": "High value" }
  },
  "actors": [
    { "name": "Quick win", "subtitle": "左上" },
    { "name": "Major project", "subtitle": "右上" },
    { "name": "Fill in", "subtitle": "{fill_in_at}" },
    { "name": "Thankless", "subtitle": "右下" }
  ],
  "flow": [],
  "states": { "fill_in_at": "左下" },
  "animation": [
    {
      "step": "見直し前",
      "duration": 0.9,
      "focus": ["Quick win"],
      "body": "Fill in は価値も労力も低い枠に置いてある。",
      "badge": "quadrant",
      "set": { "fill_in_at": "左下" }
    },
    {
      "step": "2 つの軸で 4 象限に分けて配置する優先度マトリクス",
      "duration": 0.9,
      "focus": ["Quick win"],
      "body": "見直しで Fill in を価値の高い枠へ移す。 どの枠に居るかを状態から取っている。",
      "badge": "quadrant",
      "set": { "fill_in_at": "左上" }
    }
  ]
}`;

export const sourceYaml__presetGantt = `title: "タスクの期間と依存関係を横棒で示す進捗図"
eyebrow: "gantt"
type: gantt

actors:
  - Design: { value: "Q1", owner: "Designer", tone: teal }
  - Build: { value: "Q2", owner: "Eng", tone: teal, end: "{build_end}" }
  - Test: { value: "Q3", owner: "QA", tone: teal }
  - Ship: { value: "Q4", owner: "PM", tone: teal }

states:
  build_end: 1

flow:
  - Design -> Build: ""
  - Build -> Test: ""
  - Test -> Ship: ""

animation:
  - step: "当初の計画" 2.4s
    badge: "gantt"
    focus: [Design]
    draw: gantt
    body: "Build は Q2 で終わる想定。"
  - step: "タスクの期間と依存関係を横棒で示す進捗図" 0.9s
    badge: "gantt"
    focus: [Design]
    tween:
      build_end: 1 -> 2
    body: "作り込みが Q3 まで延びる。 帯の終わりを状態から取っている。"
`;

export const sourceJson__presetGantt = `{
  "title": "タスクの期間と依存関係を横棒で示す進捗図",
  "type": "gantt",
  "eyebrow": "gantt",
  "actors": [
    { "name": "Design", "value": "Q1", "tone": "teal", "owner": "Designer" },
    { "name": "Build", "value": "Q2", "tone": "teal", "owner": "Eng", "end": "{build_end}" },
    { "name": "Test", "value": "Q3", "tone": "teal", "owner": "QA" },
    { "name": "Ship", "value": "Q4", "tone": "teal", "owner": "PM" }
  ],
  "flow": [
    { "from": "Design", "to": "Build", "label": "" },
    { "from": "Build", "to": "Test", "label": "" },
    { "from": "Test", "to": "Ship", "label": "" }
  ],
  "states": { "build_end": 1 },
  "animation": [
    {
      "step": "当初の計画",
      "duration": 2.4,
      "focus": ["Design"],
      "draw": "gantt",
      "body": "Build は Q2 で終わる想定。",
      "badge": "gantt"
    },
    {
      "step": "タスクの期間と依存関係を横棒で示す進捗図",
      "duration": 0.9,
      "focus": ["Design"],
      "body": "作り込みが Q3 まで延びる。 帯の終わりを状態から取っている。",
      "badge": "gantt",
      "tween": { "build_end": [1, 2] }
    }
  ]
}`;

export const sourceYaml__presetStateMachine = `title: "状態と遷移条件を示す図"
type: state

lanes:
  lane-idle: { width: 370 }
  lane-loading: { width: 370 }
  lane-done: { width: 370 }
  lane-error: { width: 370 }

actors:
  - Idle: { kind: card, eyebrow: "初期" }
  - Loading: { kind: card, eyebrow: "状態" }
  - Done: { kind: card, eyebrow: "最終" }
  - Error: { kind: card, eyebrow: "状態" }

flow:
  - Idle -> Loading: "submit" (accent, solid)
  - Loading -> Done: "success" (success, solid)
  - Loading -> Error: "fail" (error, solid)
  - Error -> Idle: "retry" (accent, solid) { sub: "if attempts < 3" }

animation:
  - step: "1. Idle" 0.9s
    badge: "fsm"
    focus: [Idle]
    body: "何も起きていない初期状態。"
  - step: "2. submit で Loading" 0.9s
    badge: "fsm"
    focus: [Idle, Loading, "Idle -> Loading"]
    body: "送信を受けて処理中になる。"
  - step: "3. success で Done" 0.9s
    badge: "fsm"
    focus: [Idle, Loading, Done, "Idle -> Loading", "Loading -> Done"]
    body: "成功して終わりの状態へ。"
  - step: "状態と遷移条件を示す図" 0.9s
    badge: "fsm"
    focus: [Idle, Loading, Done, Error, "Idle -> Loading", "Loading -> Done", "Loading -> Error", "Error -> Idle"]
    body: "FSM の全 state + transition を visible 化。"
`;

export const sourceJson__presetStateMachine = `{
  "title": "状態と遷移条件を示す図",
  "type": "state",
  "lanes": {
    "lane-idle": { "width": 370 },
    "lane-loading": { "width": 370 },
    "lane-done": { "width": 370 },
    "lane-error": { "width": 370 }
  },
  "actors": [
    { "name": "Idle", "kind": "card", "eyebrow": "初期" },
    { "name": "Loading", "kind": "card", "eyebrow": "状態" },
    { "name": "Done", "kind": "card", "eyebrow": "最終" },
    { "name": "Error", "kind": "card", "eyebrow": "状態" }
  ],
  "flow": [
    { "from": "Idle", "to": "Loading", "label": "submit", "tone": "accent", "style": "solid" },
    { "from": "Loading", "to": "Done", "label": "success", "tone": "success", "style": "solid" },
    { "from": "Loading", "to": "Error", "label": "fail", "tone": "error", "style": "solid" },
    {
      "from": "Error",
      "to": "Idle",
      "label": "retry",
      "sub": "if attempts < 3",
      "tone": "accent",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "1. Idle",
      "duration": 0.9,
      "focus": ["Idle"],
      "body": "何も起きていない初期状態。",
      "badge": "fsm"
    },
    {
      "step": "2. submit で Loading",
      "duration": 0.9,
      "focus": ["Idle", "Loading", "Idle -> Loading"],
      "body": "送信を受けて処理中になる。",
      "badge": "fsm"
    },
    {
      "step": "3. success で Done",
      "duration": 0.9,
      "focus": ["Idle", "Loading", "Done", "Idle -> Loading", "Loading -> Done"],
      "body": "成功して終わりの状態へ。",
      "badge": "fsm"
    },
    {
      "step": "状態と遷移条件を示す図",
      "duration": 0.9,
      "focus": [
        "Idle",
        "Loading",
        "Done",
        "Error",
        "Idle -> Loading",
        "Loading -> Done",
        "Loading -> Error",
        "Error -> Idle"
      ],
      "body": "FSM の全 state + transition を visible 化。",
      "badge": "fsm"
    }
  ]
}`;

export const sourceYaml__presetStateMachine2 = `title: "階層状態や遷移アクションを持つ拡張ステート図"
type: state

lanes:
  lane-idle: { width: 330 }
  lane-active: { width: 330 }
  lane-loading: { width: 330 }
  lane-done: { width: 330 }

actors:
  - Idle: { kind: card, eyebrow: "初期", subtitle: "entry: clearForm", posW: 280 }
  - Active: { kind: card, eyebrow: "状態", posW: 280 }
  - Loading: { kind: card, eyebrow: "状態 / nested in active", subtitle: "entry: startSpinner / exit: stopSpinner", posW: 280 }
  - Done: { kind: card, eyebrow: "最終", posW: 280 }

flow:
  - Idle -> Loading: "submit" (accent, solid) { sub: "/validate" }
  - Loading -> Done: "success" (success, solid)

animation:
  - step: "1. Idle" 0.9s
    badge: "statemachine2"
    focus: [Idle]
    body: "clearForm を実行して待つ。"
  - step: "2. Active の中の Loading" 0.9s
    badge: "statemachine2"
    focus: [Idle, Active, Loading, "Idle -> Loading"]
    body: "submit で入れ子の状態に入る。"
  - step: "階層状態や遷移アクションを持つ拡張ステート図" 0.9s
    badge: "statemachine2"
    focus: [Idle, Active, Loading, Done, "Idle -> Loading", "Loading -> Done"]
    body: "拡張 FSM (nested + action) を visible 化。"
`;

export const sourceJson__presetStateMachine2 = `{
  "title": "階層状態や遷移アクションを持つ拡張ステート図",
  "type": "state",
  "lanes": {
    "lane-idle": { "width": 330 },
    "lane-active": { "width": 330 },
    "lane-loading": { "width": 330 },
    "lane-done": { "width": 330 }
  },
  "actors": [
    {
      "name": "Idle",
      "kind": "card",
      "subtitle": "entry: clearForm",
      "eyebrow": "初期",
      "posW": 280
    },
    { "name": "Active", "kind": "card", "eyebrow": "状態", "posW": 280 },
    {
      "name": "Loading",
      "kind": "card",
      "subtitle": "entry: startSpinner / exit: stopSpinner",
      "eyebrow": "状態 / nested in active",
      "posW": 280
    },
    { "name": "Done", "kind": "card", "eyebrow": "最終", "posW": 280 }
  ],
  "flow": [
    {
      "from": "Idle",
      "to": "Loading",
      "label": "submit",
      "sub": "/validate",
      "tone": "accent",
      "style": "solid"
    },
    { "from": "Loading", "to": "Done", "label": "success", "tone": "success", "style": "solid" }
  ],
  "animation": [
    {
      "step": "1. Idle",
      "duration": 0.9,
      "focus": ["Idle"],
      "body": "clearForm を実行して待つ。",
      "badge": "statemachine2"
    },
    {
      "step": "2. Active の中の Loading",
      "duration": 0.9,
      "focus": ["Idle", "Active", "Loading", "Idle -> Loading"],
      "body": "submit で入れ子の状態に入る。",
      "badge": "statemachine2"
    },
    {
      "step": "階層状態や遷移アクションを持つ拡張ステート図",
      "duration": 0.9,
      "focus": ["Idle", "Active", "Loading", "Done", "Idle -> Loading", "Loading -> Done"],
      "body": "拡張 FSM (nested + action) を visible 化。",
      "badge": "statemachine2"
    }
  ]
}`;

export const sourceYaml__presetSwimlane = `title: "処理を役割ごとに縦レーン分けして流れを示す図"
type: swimlane

lanes:
  lane-user: { width: 520, label: "Client" }
  lane-handler: { width: 520, label: "Service" }
  lane-processed: { width: 520, label: "Event" }

actors:
  - User: { kind: actor }
  - handler(...): { kind: function }
  - Processed: { kind: event }

flow:
  - User -> handler(...): "call" (accent, dotted-flow)
  - handler(...) -> Processed: "emit" (success, dotted-flow)

animation:
  - step: "1. Client の User" 0.9s
    badge: "preset"
    focus: [User]
    body: "外から呼ぶ人が最初の縦列に立つ。"
  - step: "2. Service の handler" 0.9s
    badge: "preset"
    focus: [User, "handler(...)", "User -> handler(...)"]
    body: "呼び出しが隣の縦列に渡る。"
  - step: "swimlane" 0.9s
    badge: "preset"
    focus: [User, "handler(...)", Processed, "User -> handler(...)", "handler(...) -> Processed"]
    body: "swimlane preset で 3 lane を 1 行宣言、 lane.x auto-layout。"
`;

export const sourceJson__presetSwimlane = `{
  "title": "処理を役割ごとに縦レーン分けして流れを示す図",
  "type": "swimlane",
  "lanes": {
    "lane-user": { "width": 520, "label": "Client" },
    "lane-handler": { "width": 520, "label": "Service" },
    "lane-processed": { "width": 520, "label": "Event" }
  },
  "actors": [
    { "name": "User", "kind": "actor" },
    { "name": "handler(...)", "kind": "function" },
    { "name": "Processed", "kind": "event" }
  ],
  "flow": [
    {
      "from": "User",
      "to": "handler(...)",
      "label": "call",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "handler(...)",
      "to": "Processed",
      "label": "emit",
      "tone": "success",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "1. Client の User",
      "duration": 0.9,
      "focus": ["User"],
      "body": "外から呼ぶ人が最初の縦列に立つ。",
      "badge": "preset"
    },
    {
      "step": "2. Service の handler",
      "duration": 0.9,
      "focus": ["User", "handler(...)", "User -> handler(...)"],
      "body": "呼び出しが隣の縦列に渡る。",
      "badge": "preset"
    },
    {
      "step": "swimlane",
      "duration": 0.9,
      "focus": [
        "User",
        "handler(...)",
        "Processed",
        "User -> handler(...)",
        "handler(...) -> Processed"
      ],
      "body": "swimlane preset で 3 lane を 1 行宣言、 lane.x auto-layout。",
      "badge": "preset"
    }
  ]
}`;

export const sourceYaml__presetClassDiagram = `title: "クラスの継承・保有関係を示す UML 図"
type: class

actors:
  - User: { eyebrow: "クラス", rows: ["+name: string", "+email: string", "───", "+login(): void", "+logout(): void"] }
  - Admin: { eyebrow: "クラス", rows: ["+permissions: string[]", "───", "+banUser(): void"] }
  - Order: { eyebrow: "クラス", rows: ["+id: number", "+total: number", "───", "+pay(): void"] }

flow:
  - Admin -> User: "extends" (info, solid)
  - Admin -> Order: "aggregates" (info, solid) { sub: "1..*" }

animation:
  - step: "1. User" 0.9s
    badge: "class"
    focus: [User]
    body: "基になるクラス。"
  - step: "2. Admin が継承" 0.9s
    badge: "class"
    focus: [User, Admin, "Admin -> User"]
    body: "User を継ぎ、権限を足す。"
  - step: "クラスの継承・保有関係を示す UML 図" 0.9s
    badge: "class"
    focus: [User, Admin, "Admin -> User", Order, "Admin -> Order"]
    body: "UML class 全 class + relation を visible 化。"
`;

export const sourceJson__presetClassDiagram = `{
  "title": "クラスの継承・保有関係を示す UML 図",
  "type": "class",
  "actors": [
    {
      "name": "User",
      "eyebrow": "クラス",
      "rows": ["+name: string", "+email: string", "───", "+login(): void", "+logout(): void"]
    },
    {
      "name": "Admin",
      "eyebrow": "クラス",
      "rows": ["+permissions: string[]", "───", "+banUser(): void"]
    },
    {
      "name": "Order",
      "eyebrow": "クラス",
      "rows": ["+id: number", "+total: number", "───", "+pay(): void"]
    }
  ],
  "flow": [
    { "from": "Admin", "to": "User", "label": "extends", "tone": "info", "style": "solid" },
    {
      "from": "Admin",
      "to": "Order",
      "label": "aggregates",
      "sub": "1..*",
      "tone": "info",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "1. User",
      "duration": 0.9,
      "focus": ["User"],
      "body": "基になるクラス。",
      "badge": "class"
    },
    {
      "step": "2. Admin が継承",
      "duration": 0.9,
      "focus": ["User", "Admin", "Admin -> User"],
      "body": "User を継ぎ、権限を足す。",
      "badge": "class"
    },
    {
      "step": "クラスの継承・保有関係を示す UML 図",
      "duration": 0.9,
      "focus": ["User", "Admin", "Admin -> User", "Order", "Admin -> Order"],
      "body": "UML class 全 class + relation を visible 化。",
      "badge": "class"
    }
  ]
}`;

export const sourceYaml__presetTopology = `title: "システムの構成要素と接続を配置で示す図"
type: topology

lanes:
  client: { width: 460, label: "Client" }
  aws: { width: 460, label: "AWS" }

actors:
  - Browser: { kind: frontend, lane: client }
  - ALB: { kind: service, eyebrow: "Load Balancer", lane: aws }
  - ECS Task: { kind: service, eyebrow: "Container", lane: aws }
  - RDS: { kind: database, eyebrow: "Postgres", lane: aws }

flow:
  - Browser -> ALB: "HTTPS" (teal, solid) { sub: "TLS 1.3" }
  - ALB -> ECS Task: "round-robin" (teal, solid)
  - ECS Task -> RDS: "TCP 5432" (success, solid) { sub: "pgbouncer" }

animation:
  - step: "1. Browser" 0.9s
    badge: "topology"
    focus: [Browser]
    body: "利用者側の入口。"
  - step: "2. ALB" 0.9s
    badge: "topology"
    focus: [Browser, ALB, "Browser -> ALB"]
    body: "HTTPS を受けて振り分ける。"
  - step: "3. ECS Task" 0.9s
    badge: "topology"
    focus: [Browser, ALB, "Browser -> ALB", "ECS Task", "ALB -> ECS Task"]
    body: "container が処理する。"
  - step: "システムの構成要素と接続を配置で示す図" 0.9s
    badge: "topology"
    focus: [Browser, ALB, "Browser -> ALB", "ECS Task", "ALB -> ECS Task", RDS, "ECS Task -> RDS"]
    body: "topology の全 container + connection を visible 化。"
`;

export const sourceJson__presetTopology = `{
  "title": "システムの構成要素と接続を配置で示す図",
  "type": "topology",
  "lanes": {
    "client": { "width": 460, "label": "Client" },
    "aws": { "width": 460, "label": "AWS" }
  },
  "actors": [
    { "name": "Browser", "kind": "frontend", "lane": "client" },
    { "name": "ALB", "kind": "service", "eyebrow": "Load Balancer", "lane": "aws" },
    { "name": "ECS Task", "kind": "service", "eyebrow": "Container", "lane": "aws" },
    { "name": "RDS", "kind": "database", "eyebrow": "Postgres", "lane": "aws" }
  ],
  "flow": [
    {
      "from": "Browser",
      "to": "ALB",
      "label": "HTTPS",
      "sub": "TLS 1.3",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "ALB",
      "to": "ECS Task",
      "label": "round-robin",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "ECS Task",
      "to": "RDS",
      "label": "TCP 5432",
      "sub": "pgbouncer",
      "tone": "success",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "1. Browser",
      "duration": 0.9,
      "focus": ["Browser"],
      "body": "利用者側の入口。",
      "badge": "topology"
    },
    {
      "step": "2. ALB",
      "duration": 0.9,
      "focus": ["Browser", "ALB", "Browser -> ALB"],
      "body": "HTTPS を受けて振り分ける。",
      "badge": "topology"
    },
    {
      "step": "3. ECS Task",
      "duration": 0.9,
      "focus": ["Browser", "ALB", "Browser -> ALB", "ECS Task", "ALB -> ECS Task"],
      "body": "container が処理する。",
      "badge": "topology"
    },
    {
      "step": "システムの構成要素と接続を配置で示す図",
      "duration": 0.9,
      "focus": [
        "Browser",
        "ALB",
        "Browser -> ALB",
        "ECS Task",
        "ALB -> ECS Task",
        "RDS",
        "ECS Task -> RDS"
      ],
      "body": "topology の全 container + connection を visible 化。",
      "badge": "topology"
    }
  ]
}`;

export const sourceYaml__presetFlowchart = `title: "分岐や判定を含む処理の流れを示す図"
type: swimlane

lanes:
  user: { width: 380, label: "User" }
  manager: { width: 380, label: "Manager" }

actors:
  - Submit request: { kind: event, eyebrow: "start", lane: user }
  - Review: { kind: card, eyebrow: "decision", lane: manager }
  - Approved: { kind: event, eyebrow: "end", lane: manager }
  - Revise: { kind: function, eyebrow: "process", lane: user }

flow:
  - Submit request -> Review: "" (accent, solid) { overlay: false }
  - Review -> Approved: "true" (success, solid) { overlay: true }
  - Review -> Revise: "false" (warning, solid) { overlay: true }

animation:
  - step: "1. Submit request" 0.9s
    badge: "flowchart"
    focus: ["Submit request"]
    body: "User が申請を出す。"
  - step: "2. Review" 0.9s
    badge: "flowchart"
    focus: ["Submit request", Review, "Submit request -> Review"]
    body: "Manager が判定する。"
  - step: "3. true なら Approved" 0.9s
    badge: "flowchart"
    focus: ["Submit request", Review, "Submit request -> Review", Approved, "Review -> Approved"]
    body: "承認して終わる枝。"
  - step: "分岐や判定を含む処理の流れを示す図" 0.9s
    badge: "flowchart"
    focus: ["Submit request", Review, "Submit request -> Review", Approved, "Review -> Approved", Revise, "Review -> Revise"]
    body: "flowchart 全 node + edge を visible 化、 swimlane + decision を表現。"
`;

export const sourceJson__presetFlowchart = `{
  "title": "分岐や判定を含む処理の流れを示す図",
  "type": "swimlane",
  "lanes": {
    "user": { "width": 380, "label": "User" },
    "manager": { "width": 380, "label": "Manager" }
  },
  "actors": [
    { "name": "Submit request", "kind": "event", "eyebrow": "start", "lane": "user" },
    { "name": "Review", "kind": "card", "eyebrow": "decision", "lane": "manager" },
    { "name": "Approved", "kind": "event", "eyebrow": "end", "lane": "manager" },
    { "name": "Revise", "kind": "function", "eyebrow": "process", "lane": "user" }
  ],
  "flow": [
    {
      "from": "Submit request",
      "to": "Review",
      "label": "",
      "tone": "accent",
      "style": "solid",
      "overlay": false
    },
    {
      "from": "Review",
      "to": "Approved",
      "label": "true",
      "tone": "success",
      "style": "solid",
      "overlay": true
    },
    {
      "from": "Review",
      "to": "Revise",
      "label": "false",
      "tone": "warning",
      "style": "solid",
      "overlay": true
    }
  ],
  "animation": [
    {
      "step": "1. Submit request",
      "duration": 0.9,
      "focus": ["Submit request"],
      "body": "User が申請を出す。",
      "badge": "flowchart"
    },
    {
      "step": "2. Review",
      "duration": 0.9,
      "focus": ["Submit request", "Review", "Submit request -> Review"],
      "body": "Manager が判定する。",
      "badge": "flowchart"
    },
    {
      "step": "3. true なら Approved",
      "duration": 0.9,
      "focus": [
        "Submit request",
        "Review",
        "Submit request -> Review",
        "Approved",
        "Review -> Approved"
      ],
      "body": "承認して終わる枝。",
      "badge": "flowchart"
    },
    {
      "step": "分岐や判定を含む処理の流れを示す図",
      "duration": 0.9,
      "focus": [
        "Submit request",
        "Review",
        "Submit request -> Review",
        "Approved",
        "Review -> Approved",
        "Revise",
        "Review -> Revise"
      ],
      "body": "flowchart 全 node + edge を visible 化、 swimlane + decision を表現。",
      "badge": "flowchart"
    }
  ]
}`;

export const sourceYaml__presetNetwork = `title: "ネットワーク機器とセグメントの接続関係を示す図"
type: flow

lanes:
  n-col-0: { width: 320 }
  n-col-1: { width: 320 }
  n-col-2: { width: 320 }

actors:
  - Firewall: { kind: service, eyebrow: "firewall / DMZ", lane: n-col-0 }
  - Switch A: { kind: service, eyebrow: "switch / LAN", lane: n-col-1 }
  - App Server: { kind: backend, eyebrow: "server", lane: n-col-2 }
  - DB Server: { kind: backend, eyebrow: "server", lane: n-col-2 }

flow:
  - Firewall -> Switch A: "VLAN 10" (info, solid)
  - Switch A -> App Server: "TCP 22" (info, solid)
  - Switch A -> DB Server: "TCP 5432" (info, solid)

animation:
  - step: "1. Firewall" 0.9s
    badge: "network"
    focus: [Firewall]
    body: "DMZ の入口。"
  - step: "2. Switch A" 0.9s
    badge: "network"
    focus: [Firewall, "Switch A", "Firewall -> Switch A"]
    body: "VLAN 10 で LAN に流す。"
  - step: "3. App Server" 0.9s
    badge: "network"
    focus: [Firewall, "Switch A", "Firewall -> Switch A", "App Server", "Switch A -> App Server"]
    body: "TCP 22 で繋がる。"
  - step: "ネットワーク機器とセグメントの接続関係を示す図" 0.9s
    badge: "network"
    focus: [Firewall, "Switch A", "Firewall -> Switch A", "App Server", "Switch A -> App Server", "DB Server", "Switch A -> DB Server"]
    body: "network 全 device + link を visible 化。"
`;

export const sourceJson__presetNetwork = `{
  "title": "ネットワーク機器とセグメントの接続関係を示す図",
  "type": "flow",
  "lanes": { "n-col-0": {"width": 320}, "n-col-1": {"width": 320}, "n-col-2": {"width": 320} },
  "actors": [
    { "name": "Firewall", "kind": "service", "eyebrow": "firewall / DMZ", "lane": "n-col-0" },
    { "name": "Switch A", "kind": "service", "eyebrow": "switch / LAN", "lane": "n-col-1" },
    { "name": "App Server", "kind": "backend", "eyebrow": "server", "lane": "n-col-2" },
    { "name": "DB Server", "kind": "backend", "eyebrow": "server", "lane": "n-col-2" }
  ],
  "flow": [
    {
      "from": "Firewall",
      "to": "Switch A",
      "label": "VLAN 10",
      "tone": "info",
      "style": "solid"
    },
    {
      "from": "Switch A",
      "to": "App Server",
      "label": "TCP 22",
      "tone": "info",
      "style": "solid"
    },
    {
      "from": "Switch A",
      "to": "DB Server",
      "label": "TCP 5432",
      "tone": "info",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "1. Firewall",
      "duration": 0.9,
      "focus": ["Firewall"],
      "body": "DMZ の入口。",
      "badge": "network"
    },
    {
      "step": "2. Switch A",
      "duration": 0.9,
      "focus": ["Firewall", "Switch A", "Firewall -> Switch A"],
      "body": "VLAN 10 で LAN に流す。",
      "badge": "network"
    },
    {
      "step": "3. App Server",
      "duration": 0.9,
      "focus": [
        "Firewall",
        "Switch A",
        "Firewall -> Switch A",
        "App Server",
        "Switch A -> App Server"
      ],
      "body": "TCP 22 で繋がる。",
      "badge": "network"
    },
    {
      "step": "ネットワーク機器とセグメントの接続関係を示す図",
      "duration": 0.9,
      "focus": [
        "Firewall",
        "Switch A",
        "Firewall -> Switch A",
        "App Server",
        "Switch A -> App Server",
        "DB Server",
        "Switch A -> DB Server"
      ],
      "body": "network 全 device + link を visible 化。",
      "badge": "network"
    }
  ]
}`;

export const sourceYaml__presetInfrastructure = `title: "クラウド・ネットワーク構成を階層で示す図"
type: flow

lanes:
  col-0: { width: 380 }
  col-1: { width: 380 }
  col-2: { width: 380 }
  col-3: { width: 380 }

actors:
  - User: { kind: person, lane: col-0 }
  - CloudFront: { kind: cdn, lane: col-1 }
  - ALB: { kind: service, lane: col-2 }
  - App: { kind: service, lane: col-2 }
  - RDS: { kind: database, lane: col-3 }
  - Redis: { kind: cache, lane: col-3 }

flow:
  - User -> CloudFront: "HTTPS" (accent, solid)
  - CloudFront -> ALB: "origin" (accent, solid)
  - ALB -> App: "route" (accent, solid)
  - App -> RDS: "SQL" (accent, solid)
  - App -> Redis: "GET/SET" (accent, solid)

animation:
  - step: "1. User" 0.9s
    badge: "infrastructure"
    focus: [User]
    body: "利用者から始まる。"
  - step: "2. CloudFront" 0.9s
    badge: "infrastructure"
    focus: [User, CloudFront, "User -> CloudFront"]
    body: "HTTPS を受ける。"
  - step: "3. ALB" 0.9s
    badge: "infrastructure"
    focus: [User, CloudFront, "User -> CloudFront", ALB, "CloudFront -> ALB"]
    body: "origin へ振り分ける。"
  - step: "4. App" 0.9s
    badge: "infrastructure"
    focus: [User, CloudFront, "User -> CloudFront", ALB, "CloudFront -> ALB", App, "ALB -> App"]
    body: "処理を担う。"
  - step: "クラウド・ネットワーク構成を階層で示す図" 0.9s
    badge: "infrastructure"
    focus: [User, CloudFront, "User -> CloudFront", ALB, "CloudFront -> ALB", App, "ALB -> App", RDS, Redis, "App -> RDS", "App -> Redis"]
    body: "infrastructure 全 node + connection を visible 化。"
`;

export const sourceJson__presetInfrastructure = `{
  "title": "クラウド・ネットワーク構成を階層で示す図",
  "type": "flow",
  "lanes": {
    "col-0": { "width": 380 },
    "col-1": { "width": 380 },
    "col-2": { "width": 380 },
    "col-3": { "width": 380 }
  },
  "actors": [
    { "name": "User", "kind": "person", "lane": "col-0" },
    { "name": "CloudFront", "kind": "cdn", "lane": "col-1" },
    { "name": "ALB", "kind": "service", "lane": "col-2" },
    { "name": "App", "kind": "service", "lane": "col-2" },
    { "name": "RDS", "kind": "database", "lane": "col-3" },
    { "name": "Redis", "kind": "cache", "lane": "col-3" }
  ],
  "flow": [
    { "from": "User", "to": "CloudFront", "label": "HTTPS", "tone": "accent", "style": "solid" },
    { "from": "CloudFront", "to": "ALB", "label": "origin", "tone": "accent", "style": "solid" },
    { "from": "ALB", "to": "App", "label": "route", "tone": "accent", "style": "solid" },
    { "from": "App", "to": "RDS", "label": "SQL", "tone": "accent", "style": "solid" },
    { "from": "App", "to": "Redis", "label": "GET/SET", "tone": "accent", "style": "solid" }
  ],
  "animation": [
    {
      "step": "1. User",
      "duration": 0.9,
      "focus": ["User"],
      "body": "利用者から始まる。",
      "badge": "infrastructure"
    },
    {
      "step": "2. CloudFront",
      "duration": 0.9,
      "focus": ["User", "CloudFront", "User -> CloudFront"],
      "body": "HTTPS を受ける。",
      "badge": "infrastructure"
    },
    {
      "step": "3. ALB",
      "duration": 0.9,
      "focus": ["User", "CloudFront", "User -> CloudFront", "ALB", "CloudFront -> ALB"],
      "body": "origin へ振り分ける。",
      "badge": "infrastructure"
    },
    {
      "step": "4. App",
      "duration": 0.9,
      "focus": [
        "User",
        "CloudFront",
        "User -> CloudFront",
        "ALB",
        "CloudFront -> ALB",
        "App",
        "ALB -> App"
      ],
      "body": "処理を担う。",
      "badge": "infrastructure"
    },
    {
      "step": "クラウド・ネットワーク構成を階層で示す図",
      "duration": 0.9,
      "focus": [
        "User",
        "CloudFront",
        "User -> CloudFront",
        "ALB",
        "CloudFront -> ALB",
        "App",
        "ALB -> App",
        "RDS",
        "Redis",
        "App -> RDS",
        "App -> Redis"
      ],
      "body": "infrastructure 全 node + connection を visible 化。",
      "badge": "infrastructure"
    }
  ]
}`;
