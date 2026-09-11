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
import { 触れて読む } from "./relation-focus";

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
 *
 * ## 描く段の後ろの段にも同じ値を置く (#1440)
 *
 * `描き直す` (`redraw-mode.ts`) を選ぶと、1 段目の `draw` が 2 段目以降へ写されてその段でも
 * 起点から描かれる。 ところが **伸び具合は段の進みそのもの** で決まる = 描画側
 * (`@cardenelabs/cdl`) は段の進み 0→1 を `strokeDashoffset` に直接使い、段の長さと別の
 * 「描く時間」 を持たない。
 *
 * 2 段目を既定の 0.9 秒のままにすると、同じ絵が 2.4 秒かけて描かれた後 0.9 秒で描き直される
 * = 約 2.7 倍速い。 1 段目が作った期待を裏切り、「別のデータで描き直した」 という
 * `描き直す` の意図が伝わらない。
 *
 * そのため **描く見本は 2 段目にも同じ値を置く**。 対象は `draw` を持つ 7 見本すべてで、
 * 1 つだけ直すと同じページの中で間がばらつく。
 *
 * 代償は既定の「動かすだけ」 側でも 2 段目が 0.9 秒から伸びること。 描く速さを段の長さと
 * 別に指定できれば代償なしで直せるが、それは描画側の作りを変える話になる。
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
 * ER 図を複数の縦列へ置き直す。
 *
 * `er()` は表ごとに縦列を作るため、表が多い見本では横一列になり、線が途中の表をまたぐ。
 * 出来上がった箱の幅は保ちつつ、指定した格子へ集めれば、行の長さから求めた寸法を捨てずに
 * 関係の近い表を上下左右へ置ける。
 */
function placeErOnGrid(
  d: CdlDiagram,
  positions: readonly { id: string; col: number; row: number }[],
): CdlDiagram {
  const byId = new Map(positions.map((position) => [position.id, position]));
  const missing = d.nodes.filter((node) => !byId.has(node.id)).map((node) => node.id);
  if (missing.length > 0) throw new Error(`ER 図の格子位置が無い表: ${missing.join(", ")}`);

  const cols = [...new Set(positions.map((position) => position.col))].sort((a, b) => a - b);
  const lanes = cols.map((col) => {
    const widths = d.nodes
      .filter((node) => byId.get(node.id)?.col === col)
      .map((node) => node.w ?? 400);
    return { id: `er-col-${col}`, width: Math.max(...widths) + 50 };
  });

  return {
    ...d,
    lanes,
    nodes: d.nodes.map((node) => {
      const position = byId.get(node.id)!;
      return { ...node, lane: `er-col-${position.col}`, stack: position.row };
    }),
  };
}

/** 数字で指定した列と、出来上がった縦列の左右順を一致させる。 */
function orderGridColumns(d: CdlDiagram): CdlDiagram {
  return {
    ...d,
    // 組み立て器は最初に現れた順で縦列を作るため、層ごとに宣言すると数字の左右順が崩れる。
    lanes: [...d.lanes].sort(
      (a, b) => Number(a.id.replace("col-", "")) - Number(b.id.replace("col-", "")),
    ),
  };
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

// sequence preset ... 時系列のやり取り (設計「箱と行と関係」 の意匠)
//
// **ここだけ骨格が違う**。 他の 3 図は「箱 + 行 + 関係」 だが、こちらは縦が時間で箱を持たない。
// 言づてを行にして、語を左の桁に縦に並べる。 参加者の糸は残す = x の位置が「誰」 で、
// 縦の連なりが「その参加者を時間で追う」 手段になる。
//
// 教科書の縦形 (箱 + 寿命線 + 線の上の札) は 3 版まで詰めて却下されている。 骨格の選び方の
// 問題ではなく、時間を位置に畳んでいたのが原因だった。
//
// **段が進むと濃さが移る**。 済んだ言づては薄く残り、今の 1 本だけが濃い。 全部同じ濃さで
// 残すと、どこを見ているのか判らなくなる。
export const presetSequence = withSteps(
  sequence({
    id: "seq-demo",
    topic: "時系列のやり取りを縦の時間軸で並べる図",
    actors: [
      { name: "Browser", subtitle: "画面" },
      { name: "API", subtitle: "受付" },
      { name: "DB", subtitle: "台帳" },
      { name: "Queue", subtitle: "待ち行列" },
    ],
    // 動いている間の帯。 台帳は途中で手が空くので区間が 2 つに分かれる
    bands: [
      { actor: "Browser", from: 0, to: 5 },
      { actor: "API", from: 0, to: 5 },
      { actor: "DB", from: 1, to: 2 },
      { actor: "DB", from: 6, to: 6 },
      { actor: "Queue", from: 4, to: 6 },
    ],
  })
    // 呼ぶ = 相手にやらせて待つ (実線 + 塗った矢)
    .step({ from: "Browser", to: "API", label: "注文を出す", kind: "call" })
    .step({ from: "API", to: "DB", label: "在庫を押さえる", kind: "call" })
    // 返す = 呼ばれた側から戻る。 新しい仕事ではないので線が切れる
    .step({ from: "DB", to: "API", label: "押さえた", kind: "return" })
    // 自分宛て。 控えを書くだけで相手がいない
    .step({ from: "API", to: "API", label: "控えを書く", kind: "call" })
    // 投げる = 返事を待たない。 実線だが矢を閉じない
    .step({ from: "API", to: "Queue", label: "発送を頼む", kind: "fire" })
    .step({ from: "API", to: "Browser", label: "受け付けた", kind: "return" })
    .step({ from: "Queue", to: "DB", label: "引当を確定", kind: "call" })
    .build(),
  [
    {
      ids: ["seq-demo"],
      title: "1. 注文を出す",
      body: "実線に塗った矢。 相手にやらせて待つ。 左の点が出どころ。",
      sets: [{ id: "seq_step", value: 0 }],
    },
    {
      title: "2. 在庫を押さえる",
      body: "受付が台帳に問い合わせる。 動いている間だけ帯が伸びる。",
      sets: [{ id: "seq_step", value: 1 }],
    },
    {
      title: "3. 押さえた",
      body: "破線に開いた矢。 新しい仕事ではないので線が切れる。",
      sets: [{ id: "seq_step", value: 2 }],
    },
    {
      title: "4. 控えを書く",
      body: "自分宛ての言づて。 相手がいない仕事。",
      sets: [{ id: "seq_step", value: 3 }],
    },
    {
      title: "5. 発送を頼む",
      body: "実線に開いた矢。 矢を閉じないことで返事を待たないと示す。",
      sets: [{ id: "seq_step", value: 4 }],
    },
    {
      title: "6. 受け付けた",
      body: "待ち行列の返事を待たずに画面へ返す。",
      sets: [{ id: "seq_step", value: 5 }],
    },
    {
      body: "台帳は途中で手が空く。 帯が途切れることでそれと判る。",
      sets: [{ id: "seq_step", value: 6 }],
    },
  ],
  [{ id: "seq_step", initial: "0" }],
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

// er preset ... ER 図 (設計「箱と行と関係」 の意匠)
//
// `users` が `orders` を出し、`orders` が `order_items` を抱える。 `users` は自分自身を
// 上司として持つ (上司も利用者なので `manager_id` は `users` を指す)。
//
// **端の印は両端に付く**。 クラス図の印は「どちらが親か」 のような関係そのものの性質を指す
// ので 1 つで足りるが、ER の印が指すのは端ごとに違う個数なので両端に要る。
// 箱に近い側が個数 (棒 = 1 / 三又 = 多)、その外側が任意か (棒 = 必須 / 丸 = 任意)。
const presetErSteps = withSteps(
  // 配色は生成りに茶 (#1553)。 ER 図は小さい字が密に並ぶので、他の図種と同じ色みだと行を
  // 追えない。 記法から作った ER 図は `compileToCdl` が同じ名前を既定で入れるので、ここは
  // 組み立て API から作る図をそれに揃える手当て
  er({ id: "er-demo", topic: "テーブル間の関係を表す図", defaultTone: "info", palette: "kinari" })
    .entity({
      id: "users",
      title: "users",
      subtitle: "利用者",
      columns: [
        { name: "id", type: "bigint", pk: true },
        { name: "email", type: "text" },
        { name: "manager_id", type: "bigint", fk: true, optional: true },
        { name: "created_at", type: "timestamptz" },
      ],
    })
    .entity({
      id: "orders",
      title: "orders",
      subtitle: "注文",
      columns: [
        { name: "id", type: "bigint", pk: true },
        { name: "user_id", type: "bigint", fk: true },
        { name: "total", type: "numeric" },
        { name: "placed_at", type: "timestamptz" },
      ],
    })
    .entity({
      id: "order_items",
      title: "order_items",
      subtitle: "注文の明細",
      columns: [
        // 親の鍵が自分の鍵に入る = 識別する関係の子側。 山形 + 下線で重ねて示す
        { name: "order_id", type: "bigint", pk: true, fk: true },
        { name: "product_id", type: "bigint", pk: true, fk: true },
        { name: "qty", type: "int" },
      ],
    })
    // 識別しない = 破線。 子は自分の鍵を持ち、親はただの参照先。 1 人が 0 件以上を出す
    .relation({
      from: "users",
      to: "orders",
      label: "注文する",
      style: "dashed",
      tailHead: "one",
      head: "zero-many",
    })
    // 識別する = 実線。 親の鍵が子の鍵に入るので、親なしでは子を名指せない
    .relation({
      from: "orders",
      to: "order_items",
      label: "明細を持つ",
      tailHead: "one",
      head: "many",
    })
    // 自分への関係。 0 か 1 人の上司が 0 人以上の部下を持つ
    .relation({
      from: "users",
      to: "users",
      label: "上司",
      style: "dashed",
      tailHead: "zero-one",
      head: "zero-many",
    })
    .build(),
  [
    { ids: ["users"], title: "1. users 表", body: "主キーは名前に下線。 印は形 × 塗りの 2 軸。" },
    {
      ids: ["orders", "rel-0-users-orders"],
      title: "2. 注文を出す",
      body: "破線は識別しない関係。 1 人が 0 件以上を出す。",
    },
    {
      ids: ["order_items", "rel-1-orders-order_items"],
      title: "3. 明細を抱える",
      body: "実線は識別する関係。 親の鍵が子の鍵に入る。",
    },
    {
      ids: ["rel-2-users-users"],
      title: "4. 自分への関係",
      body: "上司も利用者。 manager_id は同じ表を指す。",
    },
  ],
);
/** 順番を持たない図なので触れて読む形にする (#1757) */
export const presetEr = 触れて読む(presetErSteps);

const erComplex = er({
  id: "er-complex-demo",
  topic: "商取引の表と必須・任意の関係を表す ER 図",
  defaultTone: "info",
  palette: "kinari",
})
  .entity({
    id: "users",
    title: "users",
    subtitle: "利用者",
    columns: [
      { name: "id", type: "bigint", pk: true },
      { name: "email", type: "text" },
    ],
  })
  .entity({
    id: "addresses",
    title: "addresses",
    subtitle: "住所",
    columns: [
      { name: "id", type: "bigint", pk: true },
      { name: "user_id", type: "bigint", fk: true },
      { name: "line", type: "text" },
    ],
  })
  .entity({
    id: "roles",
    title: "roles",
    subtitle: "役割",
    columns: [
      { name: "id", type: "bigint", pk: true },
      { name: "name", type: "text" },
    ],
  })
  .entity({
    id: "user_roles",
    title: "user_roles",
    subtitle: "役割の割当",
    columns: [
      { name: "user_id", type: "bigint", pk: true, fk: true },
      { name: "role_id", type: "bigint", pk: true, fk: true },
    ],
  })
  .entity({
    id: "orders",
    title: "orders",
    subtitle: "注文",
    columns: [
      { name: "id", type: "bigint", pk: true },
      { name: "user_id", type: "bigint", fk: true },
      { name: "billing_address_id", type: "bigint", fk: true },
      { name: "total", type: "numeric" },
    ],
  })
  .entity({
    id: "order_items",
    title: "order_items",
    subtitle: "注文の明細",
    columns: [
      { name: "id", type: "bigint", pk: true },
      { name: "order_id", type: "bigint", fk: true },
      { name: "product_id", type: "bigint", fk: true },
      { name: "qty", type: "int" },
    ],
  })
  .entity({
    id: "payments",
    title: "payments",
    subtitle: "支払",
    columns: [
      { name: "id", type: "bigint", pk: true },
      { name: "order_id", type: "bigint", fk: true },
      { name: "method", type: "text" },
    ],
  })
  .entity({
    id: "shipments",
    title: "shipments",
    subtitle: "配送",
    columns: [
      { name: "id", type: "bigint", pk: true },
      { name: "order_id", type: "bigint", fk: true },
      { name: "address_id", type: "bigint", fk: true },
      { name: "status", type: "text" },
    ],
  })
  .entity({
    id: "products",
    title: "products",
    subtitle: "商品",
    columns: [
      { name: "id", type: "bigint", pk: true },
      { name: "sku", type: "text" },
      { name: "price", type: "numeric" },
    ],
  })
  .entity({
    id: "categories",
    title: "categories",
    subtitle: "分類",
    columns: [
      { name: "id", type: "bigint", pk: true },
      { name: "parent_id", type: "bigint", fk: true, optional: true },
      { name: "name", type: "text" },
    ],
  })
  .entity({
    id: "product_categories",
    title: "product_categories",
    subtitle: "商品の分類",
    columns: [
      { name: "product_id", type: "bigint", pk: true, fk: true },
      { name: "category_id", type: "bigint", pk: true, fk: true },
    ],
  })
  .entity({
    id: "inventory",
    title: "inventory",
    subtitle: "在庫",
    columns: [
      { name: "product_id", type: "bigint", pk: true, fk: true },
      { name: "qty", type: "int" },
    ],
  })
  .relation({
    from: "users",
    to: "addresses",
    label: "住む",
    style: "dashed",
    tailHead: "one",
    head: "zero-many",
  })
  .relation({ from: "users", to: "orders", label: "注文する", tailHead: "one", head: "many" })
  .relation({ from: "users", to: "user_roles", label: "持つ", tailHead: "one", head: "many" })
  .relation({ from: "roles", to: "user_roles", label: "割り当てる", tailHead: "one", head: "many" })
  .relation({ from: "orders", to: "order_items", label: "並べる", tailHead: "one", head: "many" })
  .relation({
    from: "orders",
    to: "payments",
    label: "支払う",
    style: "dashed",
    tailHead: "one",
    head: "zero-one",
  })
  .relation({
    from: "orders",
    to: "shipments",
    label: "送る",
    style: "dashed",
    tailHead: "one",
    head: "zero-one",
  })
  .relation({
    from: "addresses",
    to: "shipments",
    label: "届け先",
    style: "dashed",
    tailHead: "one",
    head: "zero-many",
  })
  .relation({
    from: "addresses",
    to: "orders",
    label: "請求先",
    style: "dashed",
    tailHead: "one",
    head: "zero-many",
  })
  .relation({ from: "products", to: "order_items", label: "売る", tailHead: "one", head: "many" })
  .relation({ from: "products", to: "inventory", label: "数える", tailHead: "one", head: "one" })
  .relation({
    from: "products",
    to: "product_categories",
    label: "属す",
    tailHead: "one",
    head: "many",
  })
  .relation({
    from: "categories",
    to: "product_categories",
    label: "束ねる",
    tailHead: "one",
    head: "many",
  })
  .relation({
    from: "categories",
    to: "categories",
    label: "親を持つ",
    style: "dashed",
    tailHead: "one",
    head: "zero-many",
  })
  .build();

/**
 * 同じ辺へ 2 本の関係が入ると `@cardenelabs/cdl` が取付位置を上下へ散らすため、まっすぐ進める線にも
 * 段差が生まれ、28px と 1px の角ができていた。5 本の関係を持つ `orders` は 4 辺だけでは収まらないので、
 * 2 本とも元から折れる側へ重複する辺を寄せ、散らしても段差を増やさない。
 * 列の割当と列内の上下順を保って間隔だけを 3375 通り数え、5 段以内では `addresses → orders` が
 * `payments` を貫くため 6 段にした。
 */
const presetErComplexSteps = withSteps(
  placeErOnGrid(erComplex, [
    { id: "roles", col: 0, row: 0 },
    { id: "user_roles", col: 0, row: 1 },
    { id: "users", col: 0, row: 2 },
    { id: "addresses", col: 0, row: 4 },
    { id: "payments", col: 1, row: 4 },
    { id: "orders", col: 1, row: 3 },
    { id: "order_items", col: 1, row: 2 },
    { id: "shipments", col: 1, row: 5 },
    { id: "categories", col: 2, row: 0 },
    { id: "product_categories", col: 2, row: 1 },
    { id: "products", col: 2, row: 2 },
    { id: "inventory", col: 2, row: 3 },
  ]),
  [
    {
      ids: ["users", "orders", "rel-1-users-orders"],
      title: "1. 利用者が注文する",
      body: "1 人が 1 件以上を出す。 端の棒と鳥の足で数を読む。",
    },
    {
      ids: ["order_items", "products", "rel-4-orders-order_items", "rel-9-products-order_items"],
      title: "2. 明細に商品が並ぶ",
      body: "実線は識別する関係。 親の鍵が子の鍵に入る。",
    },
    {
      ids: ["inventory", "rel-10-products-inventory"],
      title: "3. 在庫を数える",
      body: "端が両方とも棒。 1 対 1 で、どちらも欠けない。",
    },
    {
      ids: [
        "categories",
        "product_categories",
        "rel-11-products-product_categories",
        "rel-12-categories-product_categories",
      ],
      title: "4. 分類で束ねる",
      body: "2 つの鍵を持つ中継表が、商品と分類の多対多を作る。",
    },
    {
      ids: ["roles", "rel-13-categories-categories"],
      title: "5. 分類が分類を指す",
      body: "破線で同じ表へ戻る。 親を持たない分類もある。",
    },
    {
      ids: ["user_roles", "rel-2-users-user_roles", "rel-3-roles-user_roles"],
      title: "6. 役割を割り当てる",
      body: "利用者と役割も中継表越し。 2 つの鍵がそのまま主キーになる。",
    },
    {
      ids: ["addresses", "rel-0-users-addresses"],
      title: "7. 住所を持つ",
      body: "破線は識別しない関係。 丸い端が 0 件を許す。",
    },
    {
      ids: ["payments", "shipments", "rel-5-orders-payments", "rel-6-orders-shipments"],
      title: "8. 支払と配送",
      body: "丸い端は 0 か 1。 未払いも未発送もありうる。",
    },
    {
      ids: ["rel-7-addresses-shipments", "rel-8-addresses-orders"],
      title: "9. 住所を指す 2 本",
      body: "同じ表へ 2 本入る。 届け先と請求先で役割が違う。",
    },
  ],
);
/** 順番を持たない図なので触れて読む形にする (#1757) */
export const presetErComplex = 触れて読む(presetErComplexSteps);

// stateMachine preset ... 状態遷移図 (設計「箱と行と関係」 の意匠)
//
// 注文が下書きから受付済へ進み、支払いを経て終わる。 受付済からは取り消せる。
//
// **遷移の種類は 1 つしかない**。 クラス図 6 種、ER 図は端 4 種 × 線 2 種に対して、
// 状態遷移の線は実線 + 開いた矢の 1 種だけ。 違いは語の中 (きっかけ / きっかけ + 条件) に入る。
//
// **始まりと終わりは箱ではない**。 行も名前も持たないので、箱にすると題も呼び名も空で
// 寸法が出せない。 塗った丸と輪で別に置く。
export const presetStateMachine = withSteps(
  stateMachine({ id: "fsm-demo", topic: "状態と遷移条件を示す図" })
    .mark({ id: "begin", kind: "start", col: 0, row: 0 })
    .state({ id: "draft", title: "Draft", subtitle: "下書き", col: 0, row: 1, initial: true })
    .state({
      id: "placed",
      title: "Placed",
      subtitle: "受付済",
      col: 0,
      row: 2,
      // 入る時に 1 度だけ / きっかけを受けるが状態は変わらない
      actions: [
        { when: "entry", label: "在庫を押さえる" },
        { when: "internal", label: "督促を送る", note: "7 日ごと" },
      ],
    })
    .state({
      id: "paid",
      title: "Paid",
      subtitle: "支払済",
      col: 0,
      row: 3,
      final: true,
      actions: [{ when: "do", label: "出荷を待つ" }],
    })
    .mark({ id: "done", kind: "end", col: 0, row: 4 })
    .state({
      id: "cancelled",
      title: "Cancelled",
      subtitle: "取消済",
      col: 1,
      row: 2,
      final: true,
      actions: [{ when: "exit", label: "押さえを解く" }],
    })
    .mark({ id: "closed", kind: "end", col: 1, row: 3 })
    .transition({ from: "begin", to: "draft", trigger: "" })
    .transition({ from: "draft", to: "placed", trigger: "出す" })
    .transition({ from: "placed", to: "paid", trigger: "支払う" })
    .transition({ from: "paid", to: "done", trigger: "受け取る" })
    .transition({ from: "placed", to: "cancelled", trigger: "取り消す" })
    .transition({ from: "cancelled", to: "closed", trigger: "" })
    // 自分へ戻る輪 (#1464)。 受付済のまま督促を繰り返す = 状態は変わらない
    .transition({ from: "placed", to: "placed", trigger: "催促する" })
    .build(),
  [
    { ids: ["begin", "draft", "t0-begin-draft"], title: "1. Draft", body: "塗った丸が始まり。" },
    {
      ids: ["placed", "t1-draft-placed"],
      title: "2. 出して Placed",
      body: "山形を塗ると入った瞬間に 1 度だけ。 四角の外枠だけは状態が変わらない。",
    },
    {
      ids: ["t6-placed-placed"],
      title: "3. 受付済のまま催促する",
      body: "自分へ戻る輪。 7 日ごとに督促を送っても状態は変わらない。",
    },
    {
      ids: ["paid", "done", "t2-placed-paid", "t3-paid-done"],
      title: "4. 支払って終わる",
      body: "四角を塗るとその状態にいる間ずっと続く。 輪で囲むと終わり。",
    },
    {
      ids: ["cancelled", "closed", "t4-placed-cancelled", "t5-cancelled-closed"],
      title: "5. 取り消して終わる",
      body: "山形の外枠だけは出る瞬間に 1 度だけ。",
    },
  ],
);

// ───────────── 新図種 12 種 (cdl v0.6+) ─────────────

// infrastructure preset ... cloud / system 構成図 (col + row grid)
export const presetInfrastructure = withSteps(
  // 小見出しと説明を書く (#1498)。 cdl 0.20.0 で名前だけの箱は 54 まで縮み、段が近づいて
  // `GET/SET` の説明が隣の線に 1 かぶった。 中身を足せば箱が中身ぶんの高さに戻る
  infrastructure({ id: "infra-demo", topic: "クラウド・ネットワーク構成を階層で示す図" })
    .node({ id: "user", kind: "person", title: "User", eyebrow: "利用者", subtitle: "ブラウザ", col: 0, row: 0 })
    .node({ id: "cdn", kind: "cdn", title: "CloudFront", eyebrow: "配信", subtitle: "静的配信", col: 1, row: 0 })
    .node({ id: "alb", kind: "service", title: "ALB", eyebrow: "振り分け", subtitle: "負荷分散", col: 2, row: 0 })
    .node({ id: "app", kind: "service", title: "App", eyebrow: "処理", subtitle: "アプリ", col: 2, row: 1 })
    .node({ id: "db", kind: "database", title: "RDS", eyebrow: "保存", subtitle: "永続化", col: 3, row: 0 })
    .node({ id: "cache", kind: "cache", title: "Redis", eyebrow: "一時保存", subtitle: "高速化", col: 3, row: 1 })
    // 順路 = 要求が通る 1 本道。 朱で引き、名前の下地を外す (cdl#618)。
    // 預け先の 2 本は順路の続きではないので墨のまま = どちらも同じ色だと、
    // どこから読むかが決まらない
    .connect({ from: "user", to: "cdn", label: "HTTPS", role: "main", labelPlate: false })
    .connect({ from: "cdn", to: "alb", label: "origin", role: "main", labelPlate: false })
    .connect({ from: "alb", to: "app", label: "route", role: "main", labelPlate: false })
    .connect({ from: "app", to: "db", label: "SQL", labelPlate: false })
    .connect({ from: "app", to: "cache", label: "GET/SET", labelPlate: false })
    .build(),
  [
    { ids: ["user"], title: "1. User", body: "利用者から始まる。" },
    { ids: ["cdn", "i0-user-cdn"], title: "2. CloudFront", body: "HTTPS を受ける。" },
    { ids: ["alb", "i1-cdn-alb"], title: "3. ALB", body: "origin へ振り分ける。" },
    { ids: ["app", "i2-alb-app"], title: "4. App", body: "処理を担う。" },
    { ids: ["db", "cache", "i3-app-db", "i4-app-cache"] },
  ],
);

// classDiagram preset ... UML クラス図 (設計「箱と行と関係」 の意匠)
//
// **6 種すべてを 1 枚で使う**。 見本にあって図に無い記法は、読み手が確かめられない決まりに
// なる。 並べ方の決まりは 1 つで、**箱の 1 つの辺には関係を 1 本しか載せない** = 同じ辺から
// 2 本出すと、どちらも辺の芯から出るので重なる。 7 箱を 3 列 3 段に置いて、6 本が
// 上 / 下 / 左 / 右 に散るようにしてある。
// 描き手は元から種類の札を持つが、見本帳では 1 度も使っていなかった。 `interface` と
// `abstract` の異なる 2 値を出し、札が種類を分ける入口だと読めるようにする。
// **関係に色みを書かない** (#1583)。 描き手が種類から 3 群の色みを決めるので、書くとそちらが
// 勝って 6 本とも同じ色になる。 記法 3 形とも書かない形で揃える。
//
//   段 0   User        Auditable
//   段 1   Admin ──持つ── Order ──使う── Receipt
//   段 2               Line ──結ぶ── Sku
const presetClassDiagramSteps = withSteps(
  // 配色は生成りに茶 (#1567)。 クラス図の箱は ER 図と同じ作り (行頭の印 + 左に名前 +
  // 右に型) で、名前と型が離れて並ぶ。 縞の色は配色から取るので、書かないと縞が箱の面と
  // 同じ色になって出ない
  classDiagram({ id: "class-demo", topic: "クラスの継承・保有関係を示す UML 図", palette: "kinari" })
    .class({
      id: "User",
      title: "User",
      stereotype: "abstract",
      col: 0,
      row: 0,
      attributes: ["+name: string", "+email: string"],
      methods: ["+login(): Session"],
    })
    .class({
      id: "Auditable",
      title: "Auditable",
      stereotype: "interface",
      col: 1,
      row: 0,
      methods: ["+audit(): Log[]"],
    })
    .class({
      id: "Admin",
      title: "Admin",
      col: 0,
      row: 1,
      attributes: ["+permissions: string[]"],
      methods: ["+banUser(): void"],
    })
    .class({
      id: "Order",
      title: "Order",
      col: 1,
      row: 1,
      attributes: ["+id: number", "+total: number"],
      methods: ["+pay(): Receipt"],
    })
    .class({
      id: "Receipt",
      title: "Receipt",
      col: 2,
      row: 1,
      attributes: ["+no: string", "+amount: number"],
    })
    .class({
      id: "Line",
      title: "Line",
      col: 1,
      row: 2,
      attributes: ["+qty: number", "+price: number"],
    })
    .class({
      id: "Sku",
      title: "Sku",
      col: 2,
      row: 2,
      attributes: ["+code: string", "+name: string"],
    })
    // 線 / 印の形 / 印の塗り / 印が付く側 は種類から決まる (`CLASS_RELATION_LOOK`)。
    // 継ぐ = 実線 + 白抜きの三角が親の側 / 満たす = 破線 + 白抜きの三角 /
    // 持つ = 実線 + 白抜きの菱が持ち主の側 / 抱える = 菱を塗る /
    // 結ぶ = 実線 + 開いた矢 / 使う = 破線 + 開いた矢
    .relation({ from: "Admin", to: "User", type: "extends", label: "EXTENDS" })
    .relation({ from: "Order", to: "Auditable", type: "implements", label: "IMPLEMENTS" })
    .relation({ from: "Admin", to: "Order", type: "aggregates", label: "HAS", cardinality: "1..*" })
    .relation({ from: "Order", to: "Receipt", type: "uses", label: "USES" })
    .relation({ from: "Order", to: "Line", type: "composes", label: "OWNS", cardinality: "1..*" })
    .relation({ from: "Line", to: "Sku", type: "associates", label: "LINKS" })
    .build(),
  [
    { ids: ["User"], title: "1. User", body: "基になるクラス。" },
    {
      ids: ["Admin", "cr-0-Admin-User"],
      title: "2. 継ぐ",
      body: "実線に白抜きの三角。 三角は親の側に付く。",
    },
    {
      ids: ["Auditable", "Order", "cr-1-Order-Auditable"],
      title: "3. 満たす",
      body: "破線に白抜きの三角。 中身ではなく約束だけを受け継ぐので線が切れる。",
    },
    {
      ids: ["cr-2-Admin-Order"],
      title: "4. 持つ",
      body: "実線に白抜きの菱。 菱は持ち主の側に付く。 相手は単独でも生きる。",
    },
    {
      ids: ["Line", "cr-4-Order-Line"],
      title: "5. 抱える",
      body: "菱を塗ると命が同じになる。 持ち主が消えると中身も消える。",
    },
    {
      ids: ["Sku", "Receipt", "cr-5-Line-Sku", "cr-3-Order-Receipt"],
      title: "6. 結ぶ・使う",
      body: "実線に開いた矢はたどれるだけ。 破線に開いた矢はその場で使うだけ。",
    },
  ],
);
/** 順番を持たない図なので触れて読む形にする (#1757) */
export const presetClassDiagram = 触れて読む(presetClassDiagramSteps);

// 同じ辺に 2 本以上の関係が付くと、@cardenelabs/cdl が全ての線を辺の中点へ寄せる
// (`layout/edges.ts` の offset 0) ため、辺から最初の折れまでが必ず重なる。
// 5 本の関係を持つ Transaction は 4 辺へ割り振れないので、同色の「結ぶ」と「使う」を
// 1 辺へ寄せ、残る 3 本を上・左・下へ散らしている。
//
// 箱の置き場所は数え上げで決めた。 満たすべきは 5 つで、いずれも `edge-geometry.test.ts` が
// 見ている (色違いの線が重ならない / 同色の重なりが 2 件以下 / 折れが 32 個以下 /
// 30px 未満の直線区間が無い / 札が別の関係の線に乗らない)。
//
// **札の条件は後から足した** (#1608)。 先に入れた配置 (カード払いを c2、財布払いを c3 に
// 置いた形) は線と線しか見ておらず、カード払いが継ぐ線と財布払いが満たす線が同じ区画で
// 交差して、両方の札が互いの線に乗っていた。 それを見ていたのは `packages/dragon` の
// sweep だけで、この file の隣にある検査は緑のままだった。
//
// 段は崩せない。 段 0 に約束、段 1 に実装、段 2 以降に動くものを置く形を外すと、
// 数値だけは満たせる配置が出るが、子が親の上に来たり同じ親を継ぐ 3 つが散ったりして
// 段の筋書きが読めなくなる。 その形を保ったまま列を 6 本まで広げて全通り (2592 通り)
// 数えると、上 2 段だけでは 5 つを同時に満たす置き方が 1 つも無かった。
// 下段も 1 列ずつ右へ寄せて初めて両立する。
const presetClassComplexSteps = withSteps(
  orderGridColumns(
    classDiagram({
      id: "class-complex-demo",
      topic: "支払いの抽象・実装・組み立てを示す UML クラス図",
      palette: "kinari",
    })
      .class({
        id: "RiskCheck",
        title: "RiskCheck",
        col: 0,
        row: 2,
        attributes: ["+score: number", "+decision: Decision"],
        methods: ["+evaluate(): Decision", "+audit(): AuditLog"],
      })
      .class({
        id: "Notification",
        title: "Notification",
        col: 0,
        row: 3,
        attributes: ["+channel: Channel", "+recipient: string"],
        methods: ["+send(): Result"],
      })
      .class({
        id: "Retryable",
        title: "Retryable",
        stereotype: "interface",
        col: 1,
        row: 0,
        attributes: ["+maxAttempts: number"],
        methods: ["+retry(): Result"],
      })
      .class({
        id: "PaymentGateway",
        title: "PaymentGateway",
        col: 1,
        row: 1,
        attributes: ["+endpoint: string", "+attempts: number"],
        methods: ["+charge(): Transaction", "+retry(): Result"],
      })
      .class({
        id: "Auditable",
        title: "Auditable",
        stereotype: "interface",
        col: 2,
        row: 0,
        attributes: ["+auditId: string"],
        methods: ["+audit(): AuditLog"],
      })
      .class({
        id: "WalletPayment",
        title: "WalletPayment",
        col: 2,
        row: 1,
        attributes: ["+walletId: string", "+balance: Money"],
        methods: ["+authorize(): Result", "+debit(): Result"],
      })
      .class({
        id: "Transaction",
        title: "Transaction",
        col: 2,
        row: 3,
        attributes: ["+id: string", "+amount: Money", "+status: Status"],
        methods: ["+settle(): Receipt", "+cancel(): Result"],
      })
      .class({
        id: "LedgerEntry",
        title: "LedgerEntry",
        col: 2,
        row: 4,
        attributes: ["+account: string", "+amount: Money"],
        methods: ["+post(): void"],
      })
      .class({
        id: "PaymentMethod",
        title: "PaymentMethod",
        stereotype: "abstract",
        col: 3,
        row: 0,
        attributes: ["+methodId: string", "+enabled: boolean"],
        methods: ["+authorize(): Result", "+capture(): Result"],
      })
      .class({
        id: "CardPayment",
        title: "CardPayment",
        col: 3,
        row: 1,
        attributes: ["+token: string", "+brand: string"],
        methods: ["+authorize(): Result", "+capture(): Result"],
      })
      .class({
        id: "Receipt",
        title: "Receipt",
        col: 3,
        row: 4,
        attributes: ["+number: string", "+issuedAt: Date"],
        methods: ["+render(): Document"],
      })
      .class({
        id: "BankTransfer",
        title: "BankTransfer",
        col: 4,
        row: 1,
        attributes: ["+bankCode: string", "+reference: string"],
        methods: ["+authorize(): Result", "+reconcile(): Result"],
      })
      .relation({ from: "BankTransfer", to: "PaymentMethod", type: "extends", label: "継ぐ" })
      .relation({ from: "CardPayment", to: "PaymentMethod", type: "extends", label: "継ぐ" })
      .relation({ from: "WalletPayment", to: "PaymentMethod", type: "extends", label: "継ぐ" })
      .relation({ from: "PaymentGateway", to: "Auditable", type: "implements", label: "満たす" })
      .relation({ from: "WalletPayment", to: "Auditable", type: "implements", label: "満たす" })
      .relation({ from: "RiskCheck", to: "Notification", type: "uses", label: "使う" })
      .relation({ from: "PaymentGateway", to: "Retryable", type: "implements", label: "満たす" })
      .relation({ from: "Transaction", to: "Receipt", type: "aggregates", label: "持つ" })
      .relation({ from: "Transaction", to: "LedgerEntry", type: "composes", label: "抱える" })
      .relation({ from: "PaymentGateway", to: "Transaction", type: "composes", label: "抱える" })
      .relation({ from: "Transaction", to: "CardPayment", type: "associates", label: "結ぶ" })
      .relation({ from: "Receipt", to: "LedgerEntry", type: "associates", label: "結ぶ" })
      .relation({ from: "PaymentGateway", to: "RiskCheck", type: "uses", label: "使う" })
      .relation({ from: "Transaction", to: "Notification", type: "uses", label: "使う" })
      .build(),
  ),
  [
    {
      ids: ["PaymentMethod", "Auditable", "Retryable"],
      title: "1. 約束を先に置く",
      body: "支払い方法の共通部分と、監査・再試行の約束を先に読む。",
    },
    {
      ids: [
        "BankTransfer",
        "CardPayment",
        "cr-0-BankTransfer-PaymentMethod",
        "cr-1-CardPayment-PaymentMethod",
      ],
      title: "2. 振込とカードが継ぐ",
      body: "実線に白抜きの三角。 三角は親の側に付く。",
    },
    {
      ids: [
        "WalletPayment",
        "cr-2-WalletPayment-PaymentMethod",
        "cr-4-WalletPayment-Auditable",
      ],
      title: "3. 財布は継いで、満たす",
      body: "1 つの箱が親を継ぎ、別の約束も満たす。 線が切れている側が約束。",
    },
    {
      ids: [
        "PaymentGateway",
        "cr-3-PaymentGateway-Auditable",
        "cr-6-PaymentGateway-Retryable",
      ],
      title: "4. 門口が 2 つの約束を満たす",
      body: "破線に白抜きの三角。 中身ではなく約束だけを受け継ぐので線が切れる。",
    },
    {
      ids: [
        "Transaction",
        "cr-9-PaymentGateway-Transaction",
        "cr-10-Transaction-CardPayment",
      ],
      title: "5. 取引を抱える",
      body: "塗った菱は命が同じ。 門口が消えると取引も消える。 開いた矢はたどれるだけ。",
    },
    {
      ids: ["Receipt", "LedgerEntry", "cr-7-Transaction-Receipt", "cr-8-Transaction-LedgerEntry"],
      title: "6. 証明書と台帳",
      body: "白抜きの菱は持つだけで、相手は単独でも生きる。 塗ると命が同じになる。",
    },
    {
      ids: ["RiskCheck", "cr-11-Receipt-LedgerEntry", "cr-12-PaymentGateway-RiskCheck"],
      title: "7. 台帳へ結び、危険を見る",
      body: "実線に開いた矢はたどれるだけ。 破線に開いた矢はその場で使うだけ。",
    },
    {
      ids: ["Notification", "cr-5-RiskCheck-Notification", "cr-13-Transaction-Notification"],
      title: "8. 知らせる",
      body: "2 つの箱が同じ相手を使う。 破線に開いた矢が 2 本入る。",
    },
  ],
);
/** 順番を持たない図なので触れて読む形にする (#1757) */
export const presetClassComplex = 触れて読む(presetClassComplexSteps);

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
    // `chartData` は `PIE_SLICES` を回す `for` で 1:1 に作るので長さは常に一致する。
    // 型はそれを知らないので、引けない形は値を触らずそのまま返す
    chartData: n.chartData?.map((c, i) => {
      const s = PIE_SLICES[i];
      return s === undefined ? c : { ...c, value: `{${s.id}}` };
    }),
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
    // `chartData` は `LINE_POINTS` を回す `for` で 1:1 に作るので長さは常に一致する
    chartData: n.chartData?.map((c, i) => {
      const p = LINE_POINTS[i];
      return p === undefined ? c : { ...c, value: `{${p.id}}` };
    }),
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
// **記法と組み立て API が同じ図になることは検査で確かめる** (`lib/catalog-source-parity.test.tsx`)。
// 箱と矢印と縦列の id と並び、段の題、段が光らせる先を突き合わせる。
//
// 段の `focus:` は **箱の名前か矢印しか受けない** (`focus.ts` が生成 id を意図的に拒否する)。
// 組み立て API 側は光った先を積み上げるので、記法でも各段に前の段の分を並べて書く。

export const sourceYaml__presetSequence = `title: "時系列のやり取りを縦の時間軸で並べる図"
type: sequence

actors:
  - Browser: { subtitle: "画面" }
  - API: { subtitle: "受付" }
  - DB: { subtitle: "台帳" }
  - Queue: { subtitle: "待ち行列" }

# 動いている間の帯。 台帳は途中で手が空くので区間が 2 つに分かれる
bands:
  - Browser: 0..5
  - API: 0..5
  - DB: 1..2
  - DB: 6..6
  - Queue: 4..6

# kind を書くと線と矢の形がまとめて決まる
flow:
  - Browser -> API: "注文を出す" { kind: call }
  - API -> DB: "在庫を押さえる" { kind: call }
  - DB -> API: "押さえた" { kind: return }
  - API -> API: "控えを書く" { kind: call }
  - API -> Queue: "発送を頼む" { kind: fire }
  - API -> Browser: "受け付けた" { kind: return }
  - Queue -> DB: "引当を確定" { kind: call }

animation:
  - step: "1. 注文を出す" 0.9s
    focus: ["Browser -> API"]
    badge: "sequence"
    body: "実線に塗った矢。 相手にやらせて待つ。 左の点が出どころ。"
  - step: "2. 在庫を押さえる" 0.9s
    focus: ["API -> DB"]
    badge: "sequence"
    body: "受付が台帳に問い合わせる。 動いている間だけ帯が伸びる。"
  - step: "3. 押さえた" 0.9s
    focus: ["DB -> API"]
    badge: "sequence"
    body: "破線に開いた矢。 新しい仕事ではないので線が切れる。"
  - step: "4. 控えを書く" 0.9s
    focus: ["API -> API"]
    badge: "sequence"
    body: "自分宛ての言づて。 相手がいない仕事。"
  - step: "5. 発送を頼む" 0.9s
    focus: ["API -> Queue"]
    badge: "sequence"
    body: "実線に開いた矢。 矢を閉じないことで返事を待たないと示す。"
  - step: "6. 受け付けた" 0.9s
    focus: ["API -> Browser"]
    badge: "sequence"
    body: "待ち行列の返事を待たずに画面へ返す。"
  - step: "時系列のやり取りを縦の時間軸で並べる図" 0.9s
    focus: ["Queue -> DB"]
    badge: "sequence"
    body: "台帳は途中で手が空く。 帯が途切れることでそれと判る。"
`;

export const sourceJson__presetSequence = `{
  "title": "時系列のやり取りを縦の時間軸で並べる図",
  "type": "sequence",
  "actors": [{"name": "Browser", "subtitle": "画面"}, {"name": "API", "subtitle": "受付"}, {"name": "DB", "subtitle": "台帳"}, {"name": "Queue", "subtitle": "待ち行列"}],
  "bands": [{"actor": "Browser", "from": 0, "to": 5}, {"actor": "API", "from": 0, "to": 5}, {"actor": "DB", "from": 1, "to": 2}, {"actor": "DB", "from": 6, "to": 6}, {"actor": "Queue", "from": 4, "to": 6}],
  "flow": [
    { "from": "Browser", "to": "API", "label": "注文を出す", "kind": "call" },
    { "from": "API", "to": "DB", "label": "在庫を押さえる", "kind": "call" },
    { "from": "DB", "to": "API", "label": "押さえた", "kind": "return" },
    { "from": "API", "to": "API", "label": "控えを書く", "kind": "call" },
    { "from": "API", "to": "Queue", "label": "発送を頼む", "kind": "fire" },
    { "from": "API", "to": "Browser", "label": "受け付けた", "kind": "return" },
    { "from": "Queue", "to": "DB", "label": "引当を確定", "kind": "call" }
  ],
  "animation": [
    {
      "step": "1. 注文を出す",
      "duration": 0.9,
      "focus": ["Browser -> API"],
      "body": "実線に塗った矢。 相手にやらせて待つ。 左の点が出どころ。",
      "badge": "sequence"
    },
    {
      "step": "2. 在庫を押さえる",
      "duration": 0.9,
      "focus": ["API -> DB"],
      "body": "受付が台帳に問い合わせる。 動いている間だけ帯が伸びる。",
      "badge": "sequence"
    },
    {
      "step": "3. 押さえた",
      "duration": 0.9,
      "focus": ["DB -> API"],
      "body": "破線に開いた矢。 新しい仕事ではないので線が切れる。",
      "badge": "sequence"
    },
    {
      "step": "4. 控えを書く",
      "duration": 0.9,
      "focus": ["API -> API"],
      "body": "自分宛ての言づて。 相手がいない仕事。",
      "badge": "sequence"
    },
    {
      "step": "5. 発送を頼む",
      "duration": 0.9,
      "focus": ["API -> Queue"],
      "body": "実線に開いた矢。 矢を閉じないことで返事を待たないと示す。",
      "badge": "sequence"
    },
    {
      "step": "6. 受け付けた",
      "duration": 0.9,
      "focus": ["API -> Browser"],
      "body": "待ち行列の返事を待たずに画面へ返す。",
      "badge": "sequence"
    },
    {
      "step": "時系列のやり取りを縦の時間軸で並べる図",
      "duration": 0.9,
      "focus": ["Queue -> DB"],
      "body": "台帳は途中で手が空く。 帯が途切れることでそれと判る。",
      "badge": "sequence"
    }
  ]
}`;

export const sourceYaml__presetEr = `title: "テーブル間の関係を表す図"
type: er
# 順番を持たない図なので触れて読む形にする (#1757)。
# 線は最初から全部出す = 段は引くのをやめて光らせるだけになる
relations: hover
reveal: all

# 幅は組み立て API 側が行の長さから導く。 記法は導けないので書く。
# 書いた値がずれたら catalog-source-parity が落ちる
lanes:
  lane-users: { width: 462 }
  lane-orders: { width: 450 }
  lane-order_items: { width: 450 }

# 印は行ごとに書く。 pk は名前の下線、fk は山形、opt は中空 = 形 × 塗り の 2 軸
actors:
  - users: { kind: storage, subtitle: "利用者", posW: 412, rows: ["id: bigint", "email: text", "manager_id: bigint", "created_at: timestamptz"], marks: ["pk", "", "fk opt", ""] }
  - orders: { kind: storage, subtitle: "注文", rows: ["id: bigint", "user_id: bigint", "total: numeric", "placed_at: timestamptz"], marks: ["pk", "fk", "", ""] }
  - order_items: { kind: storage, subtitle: "注文の明細", rows: ["order_id: bigint", "product_id: bigint", "qty: int"], marks: ["pk fk", "pk fk", ""] }

# 端の印は両端に立つ。 箱に近い側が個数、その外側が任意か
flow:
  - users -> orders: "注文する" (info, dashed) { tailHead: one, head: zero-many }
  - orders -> order_items: "明細を持つ" (info, solid) { tailHead: one, head: many }
  - users -> users: "上司" (info, dashed) { tailHead: zero-one, head: zero-many }

animation:
  - step: "1. users 表" 0.9s
    focus: [users]
    badge: "er"
    body: "主キーは名前に下線。 印は形 × 塗りの 2 軸。"
  - step: "2. 注文を出す" 0.9s
    focus: [users, orders, "users -> orders"]
    badge: "er"
    body: "破線は識別しない関係。 1 人が 0 件以上を出す。"
  - step: "3. 明細を抱える" 0.9s
    focus: [users, orders, order_items, "users -> orders", "orders -> order_items"]
    badge: "er"
    body: "実線は識別する関係。 親の鍵が子の鍵に入る。"
  - step: "4. 自分への関係" 0.9s
    focus: [users, orders, order_items, "users -> orders", "orders -> order_items", "users -> users"]
    badge: "er"
    body: "上司も利用者。 manager_id は同じ表を指す。"
`;

export const sourceJson__presetEr = `{
  "title": "テーブル間の関係を表す図",
  "type": "er",
  "relations": "hover",
  "reveal": "all",
  "lanes": {
    "lane-users": { "width": 462 },
    "lane-orders": { "width": 450 },
    "lane-order_items": { "width": 450 }
  },
  "actors": [
    {
      "name": "users",
      "kind": "storage",
      "subtitle": "利用者",
      "posW": 412,
      "rows": ["id: bigint", "email: text", "manager_id: bigint", "created_at: timestamptz"],
      "marks": ["pk", "", "fk opt", ""]
    },
    {
      "name": "orders",
      "kind": "storage",
      "subtitle": "注文",
      "rows": ["id: bigint", "user_id: bigint", "total: numeric", "placed_at: timestamptz"],
      "marks": ["pk", "fk", "", ""]
    },
    {
      "name": "order_items",
      "kind": "storage",
      "subtitle": "注文の明細",
      "rows": ["order_id: bigint", "product_id: bigint", "qty: int"],
      "marks": ["pk fk", "pk fk", ""]
    }
  ],
  "flow": [
    {
      "from": "users",
      "to": "orders",
      "label": "注文する",
      "tone": "info",
      "style": "dashed",
      "tailHead": "one",
      "head": "zero-many"
    },
    {
      "from": "orders",
      "to": "order_items",
      "label": "明細を持つ",
      "tone": "info",
      "style": "solid",
      "tailHead": "one",
      "head": "many"
    },
    {
      "from": "users",
      "to": "users",
      "label": "上司",
      "tone": "info",
      "style": "dashed",
      "tailHead": "zero-one",
      "head": "zero-many"
    }
  ],
  "animation": [
    {
      "step": "1. users 表",
      "duration": 0.9,
      "focus": ["users"],
      "body": "主キーは名前に下線。 印は形 × 塗りの 2 軸。",
      "badge": "er"
    },
    {
      "step": "2. 注文を出す",
      "duration": 0.9,
      "focus": ["users", "orders", "users -> orders"],
      "body": "破線は識別しない関係。 1 人が 0 件以上を出す。",
      "badge": "er"
    },
    {
      "step": "3. 明細を抱える",
      "duration": 0.9,
      "focus": ["users", "orders", "order_items", "users -> orders", "orders -> order_items"],
      "body": "実線は識別する関係。 親の鍵が子の鍵に入る。",
      "badge": "er"
    },
    {
      "step": "4. 自分への関係",
      "duration": 0.9,
      "focus": ["users", "orders", "order_items", "users -> orders", "orders -> order_items", "users -> users"],
      "body": "上司も利用者。 manager_id は同じ表を指す。",
      "badge": "er"
    }
  ]
}`;

export const sourceYaml__presetErComplex = `title: "商取引の表と必須・任意の関係を表す ER 図"
type: er
palette: kinari
# 順番を持たない図なので触れて読む形にする (#1757)。
# 線は最初から全部出す = 段は引くのをやめて光らせるだけになる
relations: hover
reveal: all

lanes:
  er-col-0: { width: 450 }
  er-col-1: { width: 524 }
  er-col-2: { width: 450 }

actors:
  - users: { kind: storage, subtitle: "利用者", lane: er-col-0, stack: 2, rows: ["id: bigint", "email: text"], marks: ["pk", ""] }
  - addresses: { kind: storage, subtitle: "住所", lane: er-col-0, stack: 4, rows: ["id: bigint", "user_id: bigint", "line: text"], marks: ["pk", "fk", ""] }
  - roles: { kind: storage, subtitle: "役割", lane: er-col-0, stack: 0, rows: ["id: bigint", "name: text"], marks: ["pk", ""] }
  - user_roles: { kind: storage, subtitle: "役割の割当", lane: er-col-0, stack: 1, rows: ["user_id: bigint", "role_id: bigint"], marks: ["pk fk", "pk fk"] }
  - orders: { kind: storage, subtitle: "注文", lane: er-col-1, stack: 3, posW: 474, rows: ["id: bigint", "user_id: bigint", "billing_address_id: bigint", "total: numeric"], marks: ["pk", "fk", "fk", ""] }
  - order_items: { kind: storage, subtitle: "注文の明細", lane: er-col-1, stack: 2, rows: ["id: bigint", "order_id: bigint", "product_id: bigint", "qty: int"], marks: ["pk", "fk", "fk", ""] }
  - payments: { kind: storage, subtitle: "支払", lane: er-col-1, stack: 4, rows: ["id: bigint", "order_id: bigint", "method: text"], marks: ["pk", "fk", ""] }
  - shipments: { kind: storage, subtitle: "配送", lane: er-col-1, stack: 5, rows: ["id: bigint", "order_id: bigint", "address_id: bigint", "status: text"], marks: ["pk", "fk", "fk", ""] }
  - products: { kind: storage, subtitle: "商品", lane: er-col-2, stack: 2, rows: ["id: bigint", "sku: text", "price: numeric"], marks: ["pk", "", ""] }
  - categories: { kind: storage, subtitle: "分類", lane: er-col-2, stack: 0, rows: ["id: bigint", "parent_id: bigint", "name: text"], marks: ["pk", "fk opt", ""] }
  - product_categories: { kind: storage, subtitle: "商品の分類", lane: er-col-2, stack: 1, rows: ["product_id: bigint", "category_id: bigint"], marks: ["pk fk", "pk fk"] }
  - inventory: { kind: storage, subtitle: "在庫", lane: er-col-2, stack: 3, rows: ["product_id: bigint", "qty: int"], marks: ["pk fk", ""] }

flow:
  - users -> addresses: "住む" (info, dashed) { tailHead: one, head: zero-many }
  - users -> orders: "注文する" (info, solid) { tailHead: one, head: many }
  - users -> user_roles: "持つ" (info, solid) { tailHead: one, head: many }
  - roles -> user_roles: "割り当てる" (info, solid) { tailHead: one, head: many }
  - orders -> order_items: "並べる" (info, solid) { tailHead: one, head: many }
  - orders -> payments: "支払う" (info, dashed) { tailHead: one, head: zero-one }
  - orders -> shipments: "送る" (info, dashed) { tailHead: one, head: zero-one }
  - addresses -> shipments: "届け先" (info, dashed) { tailHead: one, head: zero-many }
  - addresses -> orders: "請求先" (info, dashed) { tailHead: one, head: zero-many }
  - products -> order_items: "売る" (info, solid) { tailHead: one, head: many }
  - products -> inventory: "数える" (info, solid) { tailHead: one, head: one }
  - products -> product_categories: "属す" (info, solid) { tailHead: one, head: many }
  - categories -> product_categories: "束ねる" (info, solid) { tailHead: one, head: many }
  - categories -> categories: "親を持つ" (info, dashed) { tailHead: one, head: zero-many }

animation:
  - step: "1. 利用者が注文する" 0.9s
    focus: [users, orders, "users -> orders"]
    badge: "er"
    body: "1 人が 1 件以上を出す。 端の棒と鳥の足で数を読む。"
  - step: "2. 明細に商品が並ぶ" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items"]
    badge: "er"
    body: "実線は識別する関係。 親の鍵が子の鍵に入る。"
  - step: "3. 在庫を数える" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory"]
    badge: "er"
    body: "端が両方とも棒。 1 対 1 で、どちらも欠けない。"
  - step: "4. 分類で束ねる" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory", categories, product_categories, "products -> product_categories", "categories -> product_categories"]
    badge: "er"
    body: "2 つの鍵を持つ中継表が、商品と分類の多対多を作る。"
  - step: "5. 分類が分類を指す" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory", categories, product_categories, "products -> product_categories", "categories -> product_categories", roles, "categories -> categories"]
    badge: "er"
    body: "破線で同じ表へ戻る。 親を持たない分類もある。"
  - step: "6. 役割を割り当てる" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory", categories, product_categories, "products -> product_categories", "categories -> product_categories", roles, "categories -> categories", user_roles, "users -> user_roles", "roles -> user_roles"]
    badge: "er"
    body: "利用者と役割も中継表越し。 2 つの鍵がそのまま主キーになる。"
  - step: "7. 住所を持つ" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory", categories, product_categories, "products -> product_categories", "categories -> product_categories", roles, "categories -> categories", user_roles, "users -> user_roles", "roles -> user_roles", addresses, "users -> addresses"]
    badge: "er"
    body: "破線は識別しない関係。 丸い端が 0 件を許す。"
  - step: "8. 支払と配送" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory", categories, product_categories, "products -> product_categories", "categories -> product_categories", roles, "categories -> categories", user_roles, "users -> user_roles", "roles -> user_roles", addresses, "users -> addresses", payments, shipments, "orders -> payments", "orders -> shipments"]
    badge: "er"
    body: "丸い端は 0 か 1。 未払いも未発送もありうる。"
  - step: "9. 住所を指す 2 本" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory", categories, product_categories, "products -> product_categories", "categories -> product_categories", roles, "categories -> categories", user_roles, "users -> user_roles", "roles -> user_roles", addresses, "users -> addresses", payments, shipments, "orders -> payments", "orders -> shipments", "addresses -> shipments", "addresses -> orders"]
    badge: "er"
    body: "同じ表へ 2 本入る。 届け先と請求先で役割が違う。"
`;

export const sourceJson__presetErComplex = JSON.stringify(
  {
    title: "商取引の表と必須・任意の関係を表す ER 図",
    type: "er",
    palette: "kinari",
    relations: "hover",
    reveal: "all",
    lanes: {
      "er-col-0": { width: 450 },
      "er-col-1": { width: 524 },
      "er-col-2": { width: 450 },
    },
    actors: [
      { name: "users", kind: "storage", subtitle: "利用者", lane: "er-col-0", stack: 2, rows: ["id: bigint", "email: text"], marks: ["pk", ""] },
      { name: "addresses", kind: "storage", subtitle: "住所", lane: "er-col-0", stack: 4, rows: ["id: bigint", "user_id: bigint", "line: text"], marks: ["pk", "fk", ""] },
      { name: "roles", kind: "storage", subtitle: "役割", lane: "er-col-0", stack: 0, rows: ["id: bigint", "name: text"], marks: ["pk", ""] },
      { name: "user_roles", kind: "storage", subtitle: "役割の割当", lane: "er-col-0", stack: 1, rows: ["user_id: bigint", "role_id: bigint"], marks: ["pk fk", "pk fk"] },
      { name: "orders", kind: "storage", subtitle: "注文", lane: "er-col-1", stack: 3, posW: 474, rows: ["id: bigint", "user_id: bigint", "billing_address_id: bigint", "total: numeric"], marks: ["pk", "fk", "fk", ""] },
      { name: "order_items", kind: "storage", subtitle: "注文の明細", lane: "er-col-1", stack: 2, rows: ["id: bigint", "order_id: bigint", "product_id: bigint", "qty: int"], marks: ["pk", "fk", "fk", ""] },
      { name: "payments", kind: "storage", subtitle: "支払", lane: "er-col-1", stack: 4, rows: ["id: bigint", "order_id: bigint", "method: text"], marks: ["pk", "fk", ""] },
      { name: "shipments", kind: "storage", subtitle: "配送", lane: "er-col-1", stack: 5, rows: ["id: bigint", "order_id: bigint", "address_id: bigint", "status: text"], marks: ["pk", "fk", "fk", ""] },
      { name: "products", kind: "storage", subtitle: "商品", lane: "er-col-2", stack: 2, rows: ["id: bigint", "sku: text", "price: numeric"], marks: ["pk", "", ""] },
      { name: "categories", kind: "storage", subtitle: "分類", lane: "er-col-2", stack: 0, rows: ["id: bigint", "parent_id: bigint", "name: text"], marks: ["pk", "fk opt", ""] },
      { name: "product_categories", kind: "storage", subtitle: "商品の分類", lane: "er-col-2", stack: 1, rows: ["product_id: bigint", "category_id: bigint"], marks: ["pk fk", "pk fk"] },
      { name: "inventory", kind: "storage", subtitle: "在庫", lane: "er-col-2", stack: 3, rows: ["product_id: bigint", "qty: int"], marks: ["pk fk", ""] },
    ],
    flow: [
      { from: "users", to: "addresses", label: "住む", tone: "info", style: "dashed", tailHead: "one", head: "zero-many" },
      { from: "users", to: "orders", label: "注文する", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "users", to: "user_roles", label: "持つ", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "roles", to: "user_roles", label: "割り当てる", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "orders", to: "order_items", label: "並べる", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "orders", to: "payments", label: "支払う", tone: "info", style: "dashed", tailHead: "one", head: "zero-one" },
      { from: "orders", to: "shipments", label: "送る", tone: "info", style: "dashed", tailHead: "one", head: "zero-one" },
      { from: "addresses", to: "shipments", label: "届け先", tone: "info", style: "dashed", tailHead: "one", head: "zero-many" },
      { from: "addresses", to: "orders", label: "請求先", tone: "info", style: "dashed", tailHead: "one", head: "zero-many" },
      { from: "products", to: "order_items", label: "売る", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "products", to: "inventory", label: "数える", tone: "info", style: "solid", tailHead: "one", head: "one" },
      { from: "products", to: "product_categories", label: "属す", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "categories", to: "product_categories", label: "束ねる", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "categories", to: "categories", label: "親を持つ", tone: "info", style: "dashed", tailHead: "one", head: "zero-many" },
    ],
    animation: [
      { step: "1. 利用者が注文する", duration: 0.9, focus: ["users", "orders", "users -> orders"], badge: "er", body: "1 人が 1 件以上を出す。 端の棒と鳥の足で数を読む。" },
      { step: "2. 明細に商品が並ぶ", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items"], badge: "er", body: "実線は識別する関係。 親の鍵が子の鍵に入る。" },
      { step: "3. 在庫を数える", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory"], badge: "er", body: "端が両方とも棒。 1 対 1 で、どちらも欠けない。" },
      { step: "4. 分類で束ねる", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory", "categories", "product_categories", "products -> product_categories", "categories -> product_categories"], badge: "er", body: "2 つの鍵を持つ中継表が、商品と分類の多対多を作る。" },
      { step: "5. 分類が分類を指す", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory", "categories", "product_categories", "products -> product_categories", "categories -> product_categories", "roles", "categories -> categories"], badge: "er", body: "破線で同じ表へ戻る。 親を持たない分類もある。" },
      { step: "6. 役割を割り当てる", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory", "categories", "product_categories", "products -> product_categories", "categories -> product_categories", "roles", "categories -> categories", "user_roles", "users -> user_roles", "roles -> user_roles"], badge: "er", body: "利用者と役割も中継表越し。 2 つの鍵がそのまま主キーになる。" },
      { step: "7. 住所を持つ", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory", "categories", "product_categories", "products -> product_categories", "categories -> product_categories", "roles", "categories -> categories", "user_roles", "users -> user_roles", "roles -> user_roles", "addresses", "users -> addresses"], badge: "er", body: "破線は識別しない関係。 丸い端が 0 件を許す。" },
      { step: "8. 支払と配送", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory", "categories", "product_categories", "products -> product_categories", "categories -> product_categories", "roles", "categories -> categories", "user_roles", "users -> user_roles", "roles -> user_roles", "addresses", "users -> addresses", "payments", "shipments", "orders -> payments", "orders -> shipments"], badge: "er", body: "丸い端は 0 か 1。 未払いも未発送もありうる。" },
      { step: "9. 住所を指す 2 本", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory", "categories", "product_categories", "products -> product_categories", "categories -> product_categories", "roles", "categories -> categories", "user_roles", "users -> user_roles", "roles -> user_roles", "addresses", "users -> addresses", "payments", "shipments", "orders -> payments", "orders -> shipments", "addresses -> shipments", "addresses -> orders"], badge: "er", body: "同じ表へ 2 本入る。 届け先と請求先で役割が違う。" },
    ],
  },
  null,
  2,
);

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

# 幅は組み立て API 側が行の長さから導く。 記法は導けないので書く。
# 書いた値がずれたら catalog-source-parity が落ちる
lanes:
  c0: { width: 478 }
  c1: { width: 370 }

# 大きさも組み立て API 側が行の長さから導く。 記法は導けないので書く
# 縦列は lane、段は stack。 始まりと終わりは箱ではないので種類で書く
actors:
  - begin: { kind: mark-start, lane: c0, stack: 0, posW: 96, posH: 96 }
  - Draft: { kind: storage, lane: c0, stack: 1, posW: 320, subtitle: "下書き" }
  - Placed: { kind: storage, lane: c0, stack: 2, posW: 428, subtitle: "受付済", rows: ["在庫を押さえる", "督促を送る: 7 日ごと"], marks: ["entry", "internal"] }
  - Paid: { kind: storage, lane: c0, stack: 3, posW: 320, subtitle: "支払済", rows: ["出荷を待つ"], marks: ["do"] }
  - done: { kind: mark-end, lane: c0, stack: 4, posW: 96, posH: 96 }
  - Cancelled: { kind: storage, lane: c1, stack: 2, posW: 320, subtitle: "取消済", rows: ["押さえを解く"], marks: ["exit"] }
  - closed: { kind: mark-end, lane: c1, stack: 3, posW: 96, posH: 96 }

# 遷移は実線に開いた矢の 1 種だけ。 違いは語の中に入る
flow:
  - begin -> Draft: "" (accent, solid) { head: open }
  - Draft -> Placed: "出す" (accent, solid) { head: open }
  - Placed -> Paid: "支払う" (accent, solid) { head: open }
  - Paid -> done: "受け取る" (accent, solid) { head: open }
  - Placed -> Cancelled: "取り消す" (accent, solid) { head: open }
  - Cancelled -> closed: "" (accent, solid) { head: open }
  - Placed -> Placed: "催促する" (accent, solid) { head: open }

animation:
  - step: "1. Draft" 0.9s
    badge: "fsm"
    focus: [begin, Draft, "begin -> Draft"]
    body: "塗った丸が始まり。"
  - step: "2. 出して Placed" 0.9s
    badge: "fsm"
    focus: [begin, Draft, Placed, "begin -> Draft", "Draft -> Placed"]
    body: "山形を塗ると入った瞬間に 1 度だけ。 四角の外枠だけは状態が変わらない。"
  - step: "3. 受付済のまま催促する" 0.9s
    badge: "fsm"
    focus: [begin, Draft, Placed, "begin -> Draft", "Draft -> Placed", "Placed -> Placed"]
    body: "自分へ戻る輪。 7 日ごとに督促を送っても状態は変わらない。"
  - step: "4. 支払って終わる" 0.9s
    badge: "fsm"
    focus: [begin, Draft, Placed, Paid, done, "begin -> Draft", "Draft -> Placed", "Placed -> Placed", "Placed -> Paid", "Paid -> done"]
    body: "四角を塗るとその状態にいる間ずっと続く。 輪で囲むと終わり。"
  - step: "5. 取り消して終わる" 0.9s
    badge: "fsm"
    focus: [begin, Draft, Placed, Paid, done, Cancelled, closed, "begin -> Draft", "Draft -> Placed", "Placed -> Placed", "Placed -> Paid", "Paid -> done", "Placed -> Cancelled", "Cancelled -> closed"]
    body: "山形の外枠だけは出る瞬間に 1 度だけ。"
`;

export const sourceJson__presetStateMachine = `{
  "title": "状態と遷移条件を示す図",
  "type": "state",
  "lanes": { "c0": { "width": 478 }, "c1": { "width": 370 } },
  "actors": [
    { "name": "begin", "kind": "mark-start", "lane": "c0", "stack": 0, "posW": 96, "posH": 96 },
    { "name": "Draft", "kind": "storage", "posW": 320, "lane": "c0", "stack": 1, "subtitle": "下書き" },
    { "name": "Placed", "kind": "storage", "posW": 428, "lane": "c0", "stack": 2, "subtitle": "受付済", "rows": ["在庫を押さえる", "督促を送る: 7 日ごと"], "marks": ["entry", "internal"] },
    { "name": "Paid", "kind": "storage", "posW": 320, "lane": "c0", "stack": 3, "subtitle": "支払済", "rows": ["出荷を待つ"], "marks": ["do"] },
    { "name": "done", "kind": "mark-end", "lane": "c0", "stack": 4, "posW": 96, "posH": 96 },
    { "name": "Cancelled", "kind": "storage", "posW": 320, "lane": "c1", "stack": 2, "subtitle": "取消済", "rows": ["押さえを解く"], "marks": ["exit"] },
    { "name": "closed", "kind": "mark-end", "lane": "c1", "stack": 3, "posW": 96, "posH": 96 }
  ],
  "flow": [
    { "from": "begin", "to": "Draft", "label": "", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "Draft", "to": "Placed", "label": "出す", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "Placed", "to": "Paid", "label": "支払う", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "Paid", "to": "done", "label": "受け取る", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "Placed", "to": "Cancelled", "label": "取り消す", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "Cancelled", "to": "closed", "label": "", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "Placed", "to": "Placed", "label": "催促する", "tone": "accent", "style": "solid", "head": "open" }
  ],
  "animation": [
    {
      "step": "1. Draft",
      "duration": 0.9,
      "focus": ["begin", "Draft", "begin -> Draft"],
      "body": "塗った丸が始まり。",
      "badge": "fsm"
    },
    {
      "step": "2. 出して Placed",
      "duration": 0.9,
      "focus": ["begin", "Draft", "Placed", "begin -> Draft", "Draft -> Placed"],
      "body": "山形を塗ると入った瞬間に 1 度だけ。 四角の外枠だけは状態が変わらない。",
      "badge": "fsm"
    },
    {
      "step": "3. 受付済のまま催促する",
      "duration": 0.9,
      "focus": ["begin", "Draft", "Placed", "begin -> Draft", "Draft -> Placed", "Placed -> Placed"],
      "body": "自分へ戻る輪。 7 日ごとに督促を送っても状態は変わらない。",
      "badge": "fsm"
    },
    {
      "step": "4. 支払って終わる",
      "duration": 0.9,
      "focus": ["begin", "Draft", "Placed", "Paid", "done", "begin -> Draft", "Draft -> Placed", "Placed -> Placed", "Placed -> Paid", "Paid -> done"],
      "body": "四角を塗るとその状態にいる間ずっと続く。 輪で囲むと終わり。",
      "badge": "fsm"
    },
    {
      "step": "5. 取り消して終わる",
      "duration": 0.9,
      "focus": ["begin", "Draft", "Placed", "Paid", "done", "Cancelled", "closed", "begin -> Draft", "Draft -> Placed", "Placed -> Placed", "Placed -> Paid", "Paid -> done", "Placed -> Cancelled", "Cancelled -> closed"],
      "body": "山形の外枠だけは出る瞬間に 1 度だけ。",
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
palette: kinari
# 順番を持たない図なので触れて読む形にする (#1757)。
# 線は最初から全部出す = 段は引くのをやめて光らせるだけになる
relations: hover
reveal: all

# 縦列は lane の並び、段は stack。 箱の 1 つの辺には関係を 1 本しか載せない
actors:
  - User: { eyebrow: "abstract", lane: c0, stack: 0, rows: ["+name: string", "+email: string", "───", "+login(): Session"] }
  - Auditable: { eyebrow: "interface", lane: c1, stack: 0, rows: ["+audit(): Log[]"] }
  - Admin: { lane: c0, stack: 1, rows: ["+permissions: string[]", "───", "+banUser(): void"] }
  - Order: { lane: c1, stack: 1, rows: ["+id: number", "+total: number", "───", "+pay(): Receipt"] }
  - Receipt: { lane: c2, stack: 1, rows: ["+no: string", "+amount: number"] }
  - Line: { lane: c1, stack: 2, rows: ["+qty: number", "+price: number"] }
  - Sku: { lane: c2, stack: 2, rows: ["+code: string", "+name: string"] }

# relation を書くと 線 / 端の形 / 塗り / 付く側 がまとめて決まる
flow:
  - Admin -> User: "EXTENDS" { relation: extends }
  - Order -> Auditable: "IMPLEMENTS" { relation: implements }
  - Admin -> Order: "HAS" { relation: aggregates, sub: "1..*" }
  - Order -> Receipt: "USES" { relation: uses }
  - Order -> Line: "OWNS" { relation: composes, sub: "1..*" }
  - Line -> Sku: "LINKS" { relation: associates }

animation:
  - step: "1. User" 0.9s
    badge: "class"
    focus: [User]
    body: "基になるクラス。"
  - step: "2. 継ぐ" 0.9s
    badge: "class"
    focus: [User, Admin, "Admin -> User"]
    body: "実線に白抜きの三角。 三角は親の側に付く。"
  - step: "3. 満たす" 0.9s
    badge: "class"
    focus: [User, Admin, Auditable, Order, "Admin -> User", "Order -> Auditable"]
    body: "破線に白抜きの三角。 中身ではなく約束だけを受け継ぐので線が切れる。"
  - step: "4. 持つ" 0.9s
    badge: "class"
    focus: [User, Admin, Auditable, Order, "Admin -> User", "Order -> Auditable", "Admin -> Order"]
    body: "実線に白抜きの菱。 菱は持ち主の側に付く。 相手は単独でも生きる。"
  - step: "5. 抱える" 0.9s
    badge: "class"
    focus: [User, Admin, Auditable, Order, Line, "Admin -> User", "Order -> Auditable", "Admin -> Order", "Order -> Line"]
    body: "菱を塗ると命が同じになる。 持ち主が消えると中身も消える。"
  - step: "6. 結ぶ・使う" 0.9s
    badge: "class"
    focus: [User, Admin, Auditable, Order, Line, Sku, Receipt, "Admin -> User", "Order -> Auditable", "Admin -> Order", "Order -> Line", "Line -> Sku", "Order -> Receipt"]
    body: "実線に開いた矢はたどれるだけ。 破線に開いた矢はその場で使うだけ。"
`;

export const sourceJson__presetClassDiagram = `{
  "title": "クラスの継承・保有関係を示す UML 図",
  "type": "class",
  "palette": "kinari",
  "relations": "hover",
  "reveal": "all",
  "actors": [
    {
      "name": "User",
      "eyebrow": "abstract",
      "lane": "c0",
      "stack": 0,
      "rows": ["+name: string", "+email: string", "───", "+login(): Session"]
    },
    {
      "name": "Auditable",
      "eyebrow": "interface",
      "lane": "c1",
      "stack": 0,
      "rows": ["+audit(): Log[]"]
    },
    {
      "name": "Admin",
      "lane": "c0",
      "stack": 1,
      "rows": ["+permissions: string[]", "───", "+banUser(): void"]
    },
    {
      "name": "Order",
      "lane": "c1",
      "stack": 1,
      "rows": ["+id: number", "+total: number", "───", "+pay(): Receipt"]
    },
    {
      "name": "Receipt",
      "lane": "c2",
      "stack": 1,
      "rows": ["+no: string", "+amount: number"]
    },
    {
      "name": "Line",
      "lane": "c1",
      "stack": 2,
      "rows": ["+qty: number", "+price: number"]
    },
    {
      "name": "Sku",
      "lane": "c2",
      "stack": 2,
      "rows": ["+code: string", "+name: string"]
    }
  ],
  "flow": [
    {
      "from": "Admin",
      "to": "User",
      "label": "EXTENDS",
      "relation": "extends"
    },
    {
      "from": "Order",
      "to": "Auditable",
      "label": "IMPLEMENTS",
      "relation": "implements"
    },
    {
      "from": "Admin",
      "to": "Order",
      "label": "HAS",
      "sub": "1..*",
      "relation": "aggregates"
    },
    {
      "from": "Order",
      "to": "Receipt",
      "label": "USES",
      "relation": "uses"
    },
    {
      "from": "Order",
      "to": "Line",
      "label": "OWNS",
      "sub": "1..*",
      "relation": "composes"
    },
    {
      "from": "Line",
      "to": "Sku",
      "label": "LINKS",
      "relation": "associates"
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
      "step": "2. 継ぐ",
      "duration": 0.9,
      "focus": ["User", "Admin", "Admin -> User"],
      "body": "実線に白抜きの三角。 三角は親の側に付く。",
      "badge": "class"
    },
    {
      "step": "3. 満たす",
      "duration": 0.9,
      "focus": ["User", "Admin", "Auditable", "Order", "Admin -> User", "Order -> Auditable"],
      "body": "破線に白抜きの三角。 中身ではなく約束だけを受け継ぐので線が切れる。",
      "badge": "class"
    },
    {
      "step": "4. 持つ",
      "duration": 0.9,
      "focus": ["User", "Admin", "Auditable", "Order", "Admin -> User", "Order -> Auditable", "Admin -> Order"],
      "body": "実線に白抜きの菱。 菱は持ち主の側に付く。 相手は単独でも生きる。",
      "badge": "class"
    },
    {
      "step": "5. 抱える",
      "duration": 0.9,
      "focus": ["User", "Admin", "Auditable", "Order", "Line", "Admin -> User", "Order -> Auditable", "Admin -> Order", "Order -> Line"],
      "body": "菱を塗ると命が同じになる。 持ち主が消えると中身も消える。",
      "badge": "class"
    },
    {
      "step": "6. 結ぶ・使う",
      "duration": 0.9,
      "focus": ["User", "Admin", "Auditable", "Order", "Line", "Sku", "Receipt", "Admin -> User", "Order -> Auditable", "Admin -> Order", "Order -> Line", "Line -> Sku", "Order -> Receipt"],
      "body": "実線に開いた矢はたどれるだけ。 破線に開いた矢はその場で使うだけ。",
      "badge": "class"
    }
  ]
}`;

export const sourceYaml__presetClassComplex = `title: "支払いの抽象・実装・組み立てを示す UML クラス図"
type: class
palette: kinari
# 順番を持たない図なので触れて読む形にする (#1757)。
# 線は最初から全部出す = 段は引くのをやめて光らせるだけになる
relations: hover
reveal: all

actors:
  - RiskCheck: { lane: c0, stack: 2, rows: ["+score: number", "+decision: Decision", "───", "+evaluate(): Decision", "+audit(): AuditLog"] }
  - Notification: { lane: c0, stack: 3, rows: ["+channel: Channel", "+recipient: string", "───", "+send(): Result"] }
  - Retryable: { eyebrow: "interface", lane: c1, stack: 0, rows: ["+maxAttempts: number", "───", "+retry(): Result"] }
  - PaymentGateway: { lane: c1, stack: 1, rows: ["+endpoint: string", "+attempts: number", "───", "+charge(): Transaction", "+retry(): Result"] }
  - Auditable: { eyebrow: "interface", lane: c2, stack: 0, rows: ["+auditId: string", "───", "+audit(): AuditLog"] }
  - WalletPayment: { lane: c2, stack: 1, rows: ["+walletId: string", "+balance: Money", "───", "+authorize(): Result", "+debit(): Result"] }
  - Transaction: { lane: c2, stack: 3, rows: ["+id: string", "+amount: Money", "+status: Status", "───", "+settle(): Receipt", "+cancel(): Result"] }
  - LedgerEntry: { lane: c2, stack: 4, rows: ["+account: string", "+amount: Money", "───", "+post(): void"] }
  - PaymentMethod: { eyebrow: "abstract", lane: c3, stack: 0, rows: ["+methodId: string", "+enabled: boolean", "───", "+authorize(): Result", "+capture(): Result"] }
  - CardPayment: { lane: c3, stack: 1, rows: ["+token: string", "+brand: string", "───", "+authorize(): Result", "+capture(): Result"] }
  - Receipt: { lane: c3, stack: 4, rows: ["+number: string", "+issuedAt: Date", "───", "+render(): Document"] }
  - BankTransfer: { lane: c4, stack: 1, rows: ["+bankCode: string", "+reference: string", "───", "+authorize(): Result", "+reconcile(): Result"] }
flow:
  - BankTransfer -> PaymentMethod: "継ぐ" { relation: extends }
  - CardPayment -> PaymentMethod: "継ぐ" { relation: extends }
  - WalletPayment -> PaymentMethod: "継ぐ" { relation: extends }
  - PaymentGateway -> Auditable: "満たす" { relation: implements }
  - WalletPayment -> Auditable: "満たす" { relation: implements }
  - RiskCheck -> Notification: "使う" { relation: uses }
  - PaymentGateway -> Retryable: "満たす" { relation: implements }
  - Transaction -> Receipt: "持つ" { relation: aggregates }
  - Transaction -> LedgerEntry: "抱える" { relation: composes }
  - PaymentGateway -> Transaction: "抱える" { relation: composes }
  - Transaction -> CardPayment: "結ぶ" { relation: associates }
  - Receipt -> LedgerEntry: "結ぶ" { relation: associates }
  - PaymentGateway -> RiskCheck: "使う" { relation: uses }
  - Transaction -> Notification: "使う" { relation: uses }
animation:
  - step: "1. 約束を先に置く" 0.9s
    focus: [PaymentMethod, Auditable, Retryable]
    badge: "class"
    body: "支払い方法の共通部分と、監査・再試行の約束を先に読む。"
  - step: "2. 振込とカードが継ぐ" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod"]
    badge: "class"
    body: "実線に白抜きの三角。 三角は親の側に付く。"
  - step: "3. 財布は継いで、満たす" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable"]
    badge: "class"
    body: "1 つの箱が親を継ぎ、別の約束も満たす。 線が切れている側が約束。"
  - step: "4. 門口が 2 つの約束を満たす" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", PaymentGateway, "PaymentGateway -> Auditable", "PaymentGateway -> Retryable"]
    badge: "class"
    body: "破線に白抜きの三角。 中身ではなく約束だけを受け継ぐので線が切れる。"
  - step: "5. 取引を抱える" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", PaymentGateway, "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", Transaction, "PaymentGateway -> Transaction", "Transaction -> CardPayment"]
    badge: "class"
    body: "塗った菱は命が同じ。 門口が消えると取引も消える。 開いた矢はたどれるだけ。"
  - step: "6. 証明書と台帳" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", PaymentGateway, "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", Transaction, "PaymentGateway -> Transaction", "Transaction -> CardPayment", Receipt, LedgerEntry, "Transaction -> Receipt", "Transaction -> LedgerEntry"]
    badge: "class"
    body: "白抜きの菱は持つだけで、相手は単独でも生きる。 塗ると命が同じになる。"
  - step: "7. 台帳へ結び、危険を見る" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", PaymentGateway, "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", Transaction, "PaymentGateway -> Transaction", "Transaction -> CardPayment", Receipt, LedgerEntry, "Transaction -> Receipt", "Transaction -> LedgerEntry", RiskCheck, "Receipt -> LedgerEntry", "PaymentGateway -> RiskCheck"]
    badge: "class"
    body: "実線に開いた矢はたどれるだけ。 破線に開いた矢はその場で使うだけ。"
  - step: "8. 知らせる" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", PaymentGateway, "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", Transaction, "PaymentGateway -> Transaction", "Transaction -> CardPayment", Receipt, LedgerEntry, "Transaction -> Receipt", "Transaction -> LedgerEntry", RiskCheck, "Receipt -> LedgerEntry", "PaymentGateway -> RiskCheck", Notification, "RiskCheck -> Notification", "Transaction -> Notification"]
    badge: "class"
    body: "2 つの箱が同じ相手を使う。 破線に開いた矢が 2 本入る。"
`;

export const sourceJson__presetClassComplex = JSON.stringify(
  {
    "title": "支払いの抽象・実装・組み立てを示す UML クラス図",
    "type": "class",
    "palette": "kinari",
    "relations": "hover",
    "reveal": "all",
    "actors": [
      {
        "name": "RiskCheck",
        "lane": "c0",
        "stack": 2,
        "rows": [
          "+score: number",
          "+decision: Decision",
          "───",
          "+evaluate(): Decision",
          "+audit(): AuditLog"
        ]
      },
      {
        "name": "Notification",
        "lane": "c0",
        "stack": 3,
        "rows": [
          "+channel: Channel",
          "+recipient: string",
          "───",
          "+send(): Result"
        ]
      },
      {
        "name": "Retryable",
        "eyebrow": "interface",
        "lane": "c1",
        "stack": 0,
        "rows": [
          "+maxAttempts: number",
          "───",
          "+retry(): Result"
        ]
      },
      {
        "name": "PaymentGateway",
        "lane": "c1",
        "stack": 1,
        "rows": [
          "+endpoint: string",
          "+attempts: number",
          "───",
          "+charge(): Transaction",
          "+retry(): Result"
        ]
      },
      {
        "name": "Auditable",
        "eyebrow": "interface",
        "lane": "c2",
        "stack": 0,
        "rows": [
          "+auditId: string",
          "───",
          "+audit(): AuditLog"
        ]
      },
      {
        "name": "WalletPayment",
        "lane": "c2",
        "stack": 1,
        "rows": [
          "+walletId: string",
          "+balance: Money",
          "───",
          "+authorize(): Result",
          "+debit(): Result"
        ]
      },
      {
        "name": "Transaction",
        "lane": "c2",
        "stack": 3,
        "rows": [
          "+id: string",
          "+amount: Money",
          "+status: Status",
          "───",
          "+settle(): Receipt",
          "+cancel(): Result"
        ]
      },
      {
        "name": "LedgerEntry",
        "lane": "c2",
        "stack": 4,
        "rows": [
          "+account: string",
          "+amount: Money",
          "───",
          "+post(): void"
        ]
      },
      {
        "name": "PaymentMethod",
        "eyebrow": "abstract",
        "lane": "c3",
        "stack": 0,
        "rows": [
          "+methodId: string",
          "+enabled: boolean",
          "───",
          "+authorize(): Result",
          "+capture(): Result"
        ]
      },
      {
        "name": "CardPayment",
        "lane": "c3",
        "stack": 1,
        "rows": [
          "+token: string",
          "+brand: string",
          "───",
          "+authorize(): Result",
          "+capture(): Result"
        ]
      },
      {
        "name": "Receipt",
        "lane": "c3",
        "stack": 4,
        "rows": [
          "+number: string",
          "+issuedAt: Date",
          "───",
          "+render(): Document"
        ]
      },
      {
        "name": "BankTransfer",
        "lane": "c4",
        "stack": 1,
        "rows": [
          "+bankCode: string",
          "+reference: string",
          "───",
          "+authorize(): Result",
          "+reconcile(): Result"
        ]
      }
    ],
    "flow": [
      {
        "from": "BankTransfer",
        "to": "PaymentMethod",
        "label": "継ぐ",
        "relation": "extends"
      },
      {
        "from": "CardPayment",
        "to": "PaymentMethod",
        "label": "継ぐ",
        "relation": "extends"
      },
      {
        "from": "WalletPayment",
        "to": "PaymentMethod",
        "label": "継ぐ",
        "relation": "extends"
      },
      {
        "from": "PaymentGateway",
        "to": "Auditable",
        "label": "満たす",
        "relation": "implements"
      },
      {
        "from": "WalletPayment",
        "to": "Auditable",
        "label": "満たす",
        "relation": "implements"
      },
      {
        "from": "RiskCheck",
        "to": "Notification",
        "label": "使う",
        "relation": "uses"
      },
      {
        "from": "PaymentGateway",
        "to": "Retryable",
        "label": "満たす",
        "relation": "implements"
      },
      {
        "from": "Transaction",
        "to": "Receipt",
        "label": "持つ",
        "relation": "aggregates"
      },
      {
        "from": "Transaction",
        "to": "LedgerEntry",
        "label": "抱える",
        "relation": "composes"
      },
      {
        "from": "PaymentGateway",
        "to": "Transaction",
        "label": "抱える",
        "relation": "composes"
      },
      {
        "from": "Transaction",
        "to": "CardPayment",
        "label": "結ぶ",
        "relation": "associates"
      },
      {
        "from": "Receipt",
        "to": "LedgerEntry",
        "label": "結ぶ",
        "relation": "associates"
      },
      {
        "from": "PaymentGateway",
        "to": "RiskCheck",
        "label": "使う",
        "relation": "uses"
      },
      {
        "from": "Transaction",
        "to": "Notification",
        "label": "使う",
        "relation": "uses"
      }
    ],
    "animation": [
      {
        "step": "1. 約束を先に置く",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable"],
        "badge": "class",
        "body": "支払い方法の共通部分と、監査・再試行の約束を先に読む。"
      },
      {
        "step": "2. 振込とカードが継ぐ",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod"],
        "badge": "class",
        "body": "実線に白抜きの三角。 三角は親の側に付く。"
      },
      {
        "step": "3. 財布は継いで、満たす",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable"],
        "badge": "class",
        "body": "1 つの箱が親を継ぎ、別の約束も満たす。 線が切れている側が約束。"
      },
      {
        "step": "4. 門口が 2 つの約束を満たす",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", "PaymentGateway", "PaymentGateway -> Auditable", "PaymentGateway -> Retryable"],
        "badge": "class",
        "body": "破線に白抜きの三角。 中身ではなく約束だけを受け継ぐので線が切れる。"
      },
      {
        "step": "5. 取引を抱える",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", "PaymentGateway", "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", "Transaction", "PaymentGateway -> Transaction", "Transaction -> CardPayment"],
        "badge": "class",
        "body": "塗った菱は命が同じ。 門口が消えると取引も消える。 開いた矢はたどれるだけ。"
      },
      {
        "step": "6. 証明書と台帳",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", "PaymentGateway", "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", "Transaction", "PaymentGateway -> Transaction", "Transaction -> CardPayment", "Receipt", "LedgerEntry", "Transaction -> Receipt", "Transaction -> LedgerEntry"],
        "badge": "class",
        "body": "白抜きの菱は持つだけで、相手は単独でも生きる。 塗ると命が同じになる。"
      },
      {
        "step": "7. 台帳へ結び、危険を見る",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", "PaymentGateway", "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", "Transaction", "PaymentGateway -> Transaction", "Transaction -> CardPayment", "Receipt", "LedgerEntry", "Transaction -> Receipt", "Transaction -> LedgerEntry", "RiskCheck", "Receipt -> LedgerEntry", "PaymentGateway -> RiskCheck"],
        "badge": "class",
        "body": "実線に開いた矢はたどれるだけ。 破線に開いた矢はその場で使うだけ。"
      },
      {
        "step": "8. 知らせる",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", "PaymentGateway", "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", "Transaction", "PaymentGateway -> Transaction", "Transaction -> CardPayment", "Receipt", "LedgerEntry", "Transaction -> Receipt", "Transaction -> LedgerEntry", "RiskCheck", "Receipt -> LedgerEntry", "PaymentGateway -> RiskCheck", "Notification", "RiskCheck -> Notification", "Transaction -> Notification"],
        "badge": "class",
        "body": "2 つの箱が同じ相手を使う。 破線に開いた矢が 2 本入る。"
      }
    ]
  },
  null,
  2,
);

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
  - User: { kind: person, lane: col-0, eyebrow: "利用者", subtitle: "ブラウザ" }
  - CloudFront: { kind: cdn, lane: col-1, eyebrow: "配信", subtitle: "静的配信" }
  - ALB: { kind: service, lane: col-2, eyebrow: "振り分け", subtitle: "負荷分散" }
  - App: { kind: service, lane: col-2, eyebrow: "処理", subtitle: "アプリ" }
  - RDS: { kind: database, lane: col-3, eyebrow: "保存", subtitle: "永続化" }
  - Redis: { kind: cache, lane: col-3, eyebrow: "一時保存", subtitle: "高速化" }

flow:
  - User -> CloudFront: "HTTPS" (accent, solid) { role: main, labelPlate: false }
  - CloudFront -> ALB: "origin" (accent, solid) { role: main, labelPlate: false }
  - ALB -> App: "route" (accent, solid) { role: main, labelPlate: false }
  - App -> RDS: "SQL" (accent, solid) { labelPlate: false }
  - App -> Redis: "GET/SET" (accent, solid) { labelPlate: false }

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
    { "name": "User", "kind": "person", "lane": "col-0", "eyebrow": "利用者", "subtitle": "ブラウザ" },
    { "name": "CloudFront", "kind": "cdn", "lane": "col-1", "eyebrow": "配信", "subtitle": "静的配信" },
    { "name": "ALB", "kind": "service", "lane": "col-2", "eyebrow": "振り分け", "subtitle": "負荷分散" },
    { "name": "App", "kind": "service", "lane": "col-2", "eyebrow": "処理", "subtitle": "アプリ" },
    { "name": "RDS", "kind": "database", "lane": "col-3", "eyebrow": "保存", "subtitle": "永続化" },
    { "name": "Redis", "kind": "cache", "lane": "col-3", "eyebrow": "一時保存", "subtitle": "高速化" }
  ],
  "flow": [
    { "from": "User", "to": "CloudFront", "label": "HTTPS", "tone": "accent", "style": "solid", "role": "main", "labelPlate": false },
    { "from": "CloudFront", "to": "ALB", "label": "origin", "tone": "accent", "style": "solid", "role": "main", "labelPlate": false },
    { "from": "ALB", "to": "App", "label": "route", "tone": "accent", "style": "solid", "role": "main", "labelPlate": false },
    { "from": "App", "to": "RDS", "label": "SQL", "tone": "accent", "style": "solid", "labelPlate": false },
    { "from": "App", "to": "Redis", "label": "GET/SET", "tone": "accent", "style": "solid", "labelPlate": false }
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
