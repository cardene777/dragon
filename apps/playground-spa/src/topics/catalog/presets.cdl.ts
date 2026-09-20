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
  topic: "処理を役割ごとに縦列に分けて流れを示す図",
  lanes: ["クライアント", "サービス", "イベント"],
  laneWidth: 520,
});
const lSrc = swim.laneId("クライアント");
const lCt = swim.laneId("サービス");
const lOut = swim.laneId("イベント");
swim
  .node("user", { lane: lSrc, stack: 0, kind: "actor", title: "利用者" })
  .node("fn", { lane: lCt, stack: 0, kind: "function", title: "注文の処理" })
  .node("ev", { lane: lOut, stack: 0, kind: "event", title: "注文済み" })
  .edge("user", "fn", { id: "call", label: "呼び出す", tone: "accent", style: "dotted-flow" })
  .edge("fn", "ev", { id: "emit", label: "発行する", tone: "success", style: "dotted-flow" })
  .phase(
    "p",
    {
      duration: 2400,
      title: "処理を役割ごとに縦列に分けて流れを示す図",
      body: "処理が済むと、結果をイベントとして発行する。",
    },
    // 札は図の型を出す。 他の見本は記法が自動で付けており (`withSteps()` が引き継ぐ)、
    // この図だけ手書きなので綴りが揃っていなかった (#1870)
    (p: PhaseBuilder) => p.activate("user", "fn", "ev", "call", "emit").badge("swimlane"),
  );

export const presetSwimlane = withSteps(swim.build(), [
  { ids: ["user"], title: "1. クライアントの利用者", body: "外から呼ぶ人が最初の縦列に立つ。" },
  { ids: ["fn", "call"], title: "2. サービスの処理", body: "呼び出しが隣の縦列に渡る。" },
  { ids: ["ev", "emit"] },
]);

/**
 * 簡単な版と複雑な版は、1 つの見本の中のパターンで切り替える (#1960)。
 * 一覧の別の行にすると、同じ種類の図の規模違いを見比べるのに行を選び直すことになる
 */
export const patternBase__presetSwimlane = "簡単";

/**
 * 帯図の複雑な版 (#2169)。
 *
 * 簡単な版は縦列 3 本に 1 箱ずつの 1 本道で、**縦列を往き来する道も枝分かれも無い**。
 * 帯図の値打ちは「どの持ち場が今それを持っているか」 を横の位置で示すことなので、
 * 持ち場を渡って戻ってくる形を見せないと、この図を選ぶ理由が絵に出ない。
 *
 * **線は隣の縦列どうしか同じ縦列の中だけで引く**。 縦列を 1 本飛ばすと札が間の縦列の縁を
 * 貫いて重い指摘 (`lane-border-clearance`) になる (実測)。 受付が利用者と在庫と支払の
 * 3 つと話す形にすると必ずどれかを飛ばすので、支払からの戻りを在庫に受けさせている。
 *
 * **1 本の縦列の中では段を連番にする**。 段を飛ばすと箱の間隔が揃わず、重い指摘
 * (`column-gap-uniform`、間隔の差 308 world が上限 40 を超える) になる (実測)。
 *
 * **縦列の幅 (`laneWidth`) は 320 以下で頭打ちになる**。 520 の 2502 が 320 で 2362 まで
 * 縮み、260 に下げても 2362 のまま (実測)。
 */
const swimComplex = swimlane({
  id: "swim-complex-demo",
  topic: "注文が 4 つの持ち場を往き来して返るまで",
  lanes: ["利用者", "受付", "在庫", "支払"],
  laneWidth: 320,
});
swimComplex
  .node("order", { lane: swimComplex.laneId("利用者"), stack: 0, kind: "actor", title: "注文する" })
  .node("see", { lane: swimComplex.laneId("利用者"), stack: 1, kind: "actor", title: "結果を見る" })
  .node("accept", { lane: swimComplex.laneId("受付"), stack: 0, kind: "function", title: "受け取る" })
  .node("check", { lane: swimComplex.laneId("受付"), stack: 1, kind: "function", title: "数を確かめる" })
  .node("reply", { lane: swimComplex.laneId("受付"), stack: 2, kind: "event", title: "返事を作る" })
  .node("hold", { lane: swimComplex.laneId("在庫"), stack: 0, kind: "service", title: "押さえる" })
  .node("ship", { lane: swimComplex.laneId("在庫"), stack: 1, kind: "service", title: "出荷を頼む" })
  .node("charge", { lane: swimComplex.laneId("支払"), stack: 0, kind: "service", title: "引き落とす" })
  .node("receipt", { lane: swimComplex.laneId("支払"), stack: 1, kind: "service", title: "控えを作る" })
  .edge("order", "accept", { id: "sw1", label: "出す", style: "dotted-flow" })
  .edge("accept", "check", { id: "sw2", label: "渡す" })
  .edge("check", "hold", { id: "sw3", label: "頼む" })
  // 途中で分かれる道。 返事を作る箱へ入る 2 本目で、上の辺から入る
  .edge("check", "reply", { id: "sw4", label: "数が足りない", tone: "error" })
  .edge("hold", "charge", { id: "sw5", label: "押さえた", tone: "success" })
  .edge("charge", "receipt", { id: "sw6", label: "引けた", tone: "success" })
  .edge("receipt", "ship", { id: "sw7", label: "出してよい" })
  .edge("ship", "reply", { id: "sw8", label: "手配した" })
  .edge("reply", "see", { id: "sw9", label: "返す", style: "dotted-flow" });

export const pattern__presetSwimlane__複雑 = withSteps(swimComplex.build(), [
  {
    ids: ["order", "accept", "sw1"],
    title: "1. 注文が受付に渡る",
    body: "縦列は持ち場。 点で描いた線は、外から入ってくる呼び出し。",
  },
  {
    ids: ["check", "sw2"],
    title: "2. 数を確かめる",
    body: "同じ縦列の中で下へ進む。 持ち場が変わらない仕事は縦に積む。",
  },
  {
    ids: ["hold", "sw3"],
    title: "3. 在庫を押さえる",
    body: "隣の縦列へ渡る。 ここから持ち場が受付を離れる。",
  },
  {
    ids: ["charge", "sw5"],
    title: "4. 引き落とす",
    body: "さらに隣へ渡る。 3 本目の縦列を飛ばさずに 1 本ずつ進む。",
  },
  {
    ids: ["receipt", "sw6"],
    title: "5. 控えを作る",
    body: "支払の縦列の中で下へ。 ここが一番遠い持ち場になる。",
  },
  {
    ids: ["ship", "sw7"],
    title: "6. 出荷を頼む",
    body: "ここから戻り始める。 支払から在庫へ、隣どうしで返る。",
  },
  {
    ids: ["reply", "sw8", "sw4"],
    title: "7. 2 つの道が合流する",
    body: "うまく行った道は右から、数が足りなかった道は上から入る。 別の辺から入るので重ならない。",
  },
  {
    ids: ["see", "sw9"],
    title: "8. 結果が利用者へ返る",
    body: "4 本の縦列を往って還る 1 周が閉じる。 点の線は外へ出る返事。",
  },
]);

// flow preset ... 1 lane に縦 stack、 前 step → 次 step 自動接続
export const presetFlow = withSteps(
  flow({
    id: "flow-demo",
    topic: "処理の順番を上から下へ 1 本の流れで示す図",
    laneLabel: "ログインの流れ",
    defaultTone: "teal",
  })
    .step({ id: "user", kind: "person", title: "利用者", eyebrow: "人" })
    .step({ id: "api", kind: "api", title: "POST /login", eyebrow: "API" }, "ログイン要求")
    .step({ id: "auth", kind: "service", title: "認証サービス", eyebrow: "サービス" }, "認証処理")
    .step({ id: "db", kind: "database", title: "利用者の表", eyebrow: "DB" }, "パスワードの照合")
    .build(),
  [
    { ids: ["user"], title: "1. 利用者", body: "ログインしようとする人から始まる。" },
    { ids: ["api", "e-user-api"], title: "2. POST /login", body: "ログイン要求を受け取る。" },
    { ids: ["auth", "e-api-auth"], title: "3. 認証サービス", body: "認証の処理に渡す。" },
    { ids: ["db", "e-auth-db"], body: "認証サービスが利用者の表でパスワードを照合する。" },
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
      { name: "ブラウザ", subtitle: "画面" },
      { name: "API", subtitle: "受付" },
      { name: "DB", subtitle: "台帳" },
      { name: "キュー", subtitle: "待ち行列" },
    ],
    // 動いている間の帯。 台帳は途中で手が空くので区間が 2 つに分かれる
    bands: [
      { actor: "ブラウザ", from: 0, to: 5 },
      { actor: "API", from: 0, to: 5 },
      { actor: "DB", from: 1, to: 2 },
      { actor: "DB", from: 6, to: 6 },
      { actor: "キュー", from: 4, to: 6 },
    ],
  })
    // 呼ぶ = 相手にやらせて待つ (実線 + 塗った矢)
    .step({ from: "ブラウザ", to: "API", label: "注文を出す", kind: "call" })
    .step({ from: "API", to: "DB", label: "在庫を押さえる", kind: "call" })
    // 返す = 呼ばれた側から戻る。 新しい仕事ではないので線が切れる
    .step({ from: "DB", to: "API", label: "押さえた", kind: "return" })
    // 自分宛て。 控えを書くだけで相手がいない
    .step({ from: "API", to: "API", label: "控えを書く", kind: "call" })
    // 投げる = 返事を待たない。 実線だが矢を閉じない
    .step({ from: "API", to: "キュー", label: "発送を頼む", kind: "fire" })
    .step({ from: "API", to: "ブラウザ", label: "受け付けた", kind: "return" })
    .step({ from: "キュー", to: "DB", label: "引当を確定", kind: "call" })
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

/**
 * 簡単な版と複雑な版は、1 つの見本の中のパターンで切り替える (#1960)。
 * 一覧の別の行にすると、同じ種類の図の規模違いを見比べるのに行を選び直すことになる
 */
export const patternBase__presetSequence = "簡単";

/**
 * 順序図の複雑な版 (#2161)。
 *
 * 簡単な版は呼ぶ / 返す / 投げる の 3 種を 1 本ずつ並べた記法の見本で、**失敗して戻る道が無い**。
 * 実物の注文はまず支払いで弾かれ、押さえを延ばして別の払い方を聞き、もう一度引き落とす。
 * その往復を 5 つの面と 13 本の言づてで描く。
 *
 * **面と言づての数は器で決まる**。 面 6 つだと図の幅が 1701 になり、縦列の幅を 180 まで下げても
 * 動かないため、一覧の器 (幅 874) で箱の題が 11.3px になる (下限 12px、幅 1602 まで)。
 * 言づては 1 本が縦 64px で、14 本だと高さ 1192 になり拡大の器 (1150 × 630) でも 11.6px になる。
 * 面 5 つ × 言づて 13 本の 1501 × 1128 が、どちらの器でも指摘 0 件になる形 (実測)。
 *
 * **枝分かれの枠 (`alt`) と繰り返しの枠 (`loop`) は記法に無い**。 失敗した道は、返ってきた札
 * (「残高が足りない」) とその後の言づての並びで表す。 枠が要るかは、この見本を読んで判断する。
 *
 * **帯は面ごとに書く**。 書かないと「最初に関わった段から最後まで」 の 1 本になり、
 * 鍵が 2 段目で手を離すことや、支払が 2 度呼ばれる間に空く区間が絵から消える。
 */
const seqComplex = sequence({
  id: "seq-complex-demo",
  topic: "支払いに 1 度失敗してからやり直す注文のやり取り",
  actors: [
    { name: "ブラウザ", subtitle: "画面" },
    { name: "API", subtitle: "受付" },
    { name: "認証", subtitle: "鍵" },
    { name: "在庫", subtitle: "台帳" },
    { name: "決済", subtitle: "支払" },
  ],
  bands: [
    // 画面は答えを待つ間 手を離す = 別の払い方を聞かれてから再び動く
    { actor: "ブラウザ", from: 0, to: 8 },
    { actor: "ブラウザ", from: 9, to: 12 },
    { actor: "API", from: 0, to: 12 },
    { actor: "認証", from: 1, to: 2 },
    { actor: "在庫", from: 3, to: 4 },
    { actor: "在庫", from: 7, to: 7 },
    { actor: "決済", from: 5, to: 6 },
    { actor: "決済", from: 10, to: 11 },
  ],
})
  .step({ from: "ブラウザ", to: "API", label: "注文を出す", kind: "call" })
  .step({ from: "API", to: "認証", label: "合言葉を確かめる", kind: "call" })
  .step({ from: "認証", to: "API", label: "本人と確かめた", kind: "return" })
  .step({ from: "API", to: "在庫", label: "数を押さえる", sub: "30 分だけ", kind: "call" })
  .step({ from: "在庫", to: "API", label: "押さえた", kind: "return" })
  .step({ from: "API", to: "決済", label: "引き落とす", kind: "call" })
  .step({ from: "決済", to: "API", label: "残高が足りない", kind: "return", tone: "error" })
  // 投げる = 返事を待たない。 押さえを解かずに延ばすので、次のやり取りを待たせない
  .step({ from: "API", to: "在庫", label: "押さえを延ばす", kind: "fire" })
  .step({ from: "API", to: "ブラウザ", label: "別の払い方を聞く", kind: "return", tone: "warning" })
  .step({ from: "ブラウザ", to: "API", label: "別の方法で払う", kind: "call" })
  .step({ from: "API", to: "決済", label: "もう一度引き落とす", kind: "call" })
  .step({ from: "決済", to: "API", label: "引き落とした", kind: "return", tone: "success" })
  .step({ from: "API", to: "ブラウザ", label: "受け付けた", kind: "return", tone: "success" })
  .build();

export const pattern__presetSequence__複雑 = withSteps(
  seqComplex,
  [
    {
      ids: ["seq-complex-demo"],
      title: "1. 注文を出す",
      body: "画面から受付へ。 実線に塗った矢は、相手にやらせて待つ言づて。",
      sets: [{ id: "seq_step", value: 0 }],
    },
    {
      title: "2. 合言葉を確かめる",
      body: "鍵の帯は 2 本目の言づてで終わる。 確かめ終われば手が空く。",
      sets: [{ id: "seq_step", value: 2 }],
    },
    {
      title: "3. 数を押さえる",
      body: "台帳が 30 分だけ押さえる。 札の 2 行目は言づての補足。",
      sets: [{ id: "seq_step", value: 4 }],
    },
    {
      title: "4. 支払いが弾かれる",
      body: "返る線は破線。 赤い札は、頼んだことが成り立たなかった返事。",
      sets: [{ id: "seq_step", value: 6 }],
    },
    {
      title: "5. 押さえを延ばす",
      body: "矢を閉じない線は返事を待たない言づて。 台帳の返事を待たずに次へ進む。",
      sets: [{ id: "seq_step", value: 7 }],
    },
    {
      title: "6. 別の払い方を聞く",
      body: "画面の帯がここで 1 度切れる。 人が選ぶまで受付は待つ。",
      sets: [{ id: "seq_step", value: 9 }],
    },
    {
      title: "7. もう一度引き落とす",
      body: "支払の帯は 2 本。 1 度目と 2 度目の間は手が空いている。",
      sets: [{ id: "seq_step", value: 11 }],
    },
    {
      title: "8. 受け付けて返す",
      body: "緑の返事が画面へ戻り、往復が閉じる。 帯が残るのは受付だけ。",
      sets: [{ id: "seq_step", value: 12 }],
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
  .group("client", { label: "利用者側" })
  .add({ id: "browser", kind: "frontend", title: "ブラウザ" });
topo
  .group("aws", { label: "AWS" })
  .add({ id: "alb", kind: "service", title: "ALB", eyebrow: "負荷分散" })
  .add({ id: "ecs", kind: "service", title: "ECS のタスク", eyebrow: "コンテナ" })
  .add({ id: "rds", kind: "database", title: "RDS", eyebrow: "PostgreSQL" });
topo
  .connect("browser", "alb", { label: "HTTPS", sub: "TLS 1.3" })
  .connect("alb", "ecs", { label: "ラウンドロビン" })
  .connect("ecs", "rds", { label: "TCP 5432", sub: "PgBouncer 経由", tone: "success" });

export const presetTopology = withSteps(topo.build(), [
  { ids: ["browser"], title: "1. ブラウザ", body: "利用者側の入口。" },
  { ids: ["alb", "c0-browser-alb"], title: "2. ALB", body: "HTTPS を受けて振り分ける。" },
  { ids: ["ecs", "c1-alb-ecs"], title: "3. ECS のタスク", body: "コンテナが処理する。" },
  { ids: ["rds", "c2-ecs-rds"], body: "コンテナが PgBouncer を経て PostgreSQL に繋がる。" },
]);

/**
 * 簡単な版と複雑な版は、1 つの見本の中のパターンで切り替える (#1960)。
 * 一覧の別の行にすると、同じ種類の図の規模違いを見比べるのに行を選び直すことになる
 */
export const patternBase__presetTopology = "簡単";

/**
 * 枠で囲む構成図の複雑な版 (#2167)。
 *
 * 簡単な版は枠 2 つに 4 箱を置く 1 本道で、**枠の中で完結する線が 1 本も無い**。
 * 実物の構成は入口と動かす場所としまう場所を分けて書き、枠の中だけで繋がる部分も出る。
 *
 * **枠をまたぐ線は前向き (左の枠から右の枠) だけにする**。 後ろ向きに引くと線の端が箱の辺の
 * 中心から 56 world ずれ、重い指摘 (`arrow-endpoint-center`) になる (実測 2 件)。
 * 順番待ちと後でやる役を同じ枠に置いたのはこのため = しまう場所に置くと後ろ向きの線になる。
 *
 * **枠の幅 (`groupWidth`) は 320 以下で頭打ちになる**。 既定 (360) の 2454 が 320 で 2364 まで
 * 縮み、280 / 240 に下げても 2364 のまま (実測)。 320 を書いて縮む分だけ縮めている。
 */
const topoComplex = topology({
  id: "topo-complex-demo",
  topic: "利用者から しまう場所までを 4 つの枠で分けた構成",
  defaultTone: "teal",
  groupWidth: 320,
});
topoComplex
  .group("client", { label: "利用者側" })
  .add({ id: "browser", kind: "frontend", title: "ブラウザ", eyebrow: "画面" })
  .add({ id: "mobile", kind: "frontend", title: "携帯のアプリ", eyebrow: "画面" });
topoComplex
  .group("edge", { label: "入口" })
  .add({ id: "cdn", kind: "cdn", title: "配信網", eyebrow: "静的な物" })
  // 箱の肩に枠の名前と同じ語を置かない。 枠が「入口」 なので肩も「入口」 だと同じ語が 2 度出る (#2165)
  .add({ id: "alb", kind: "service", title: "振り分け", eyebrow: "宛先を選ぶ" });
topoComplex
  .group("app", { label: "動かす場所" })
  .add({ id: "web", kind: "service", title: "画面を返す役", eyebrow: "コンテナ" })
  .add({ id: "api", kind: "service", title: "仕事をする役", eyebrow: "コンテナ" })
  .add({ id: "queue", kind: "queue", title: "順番待ち", eyebrow: "仕事の列" })
  .add({ id: "worker", kind: "service", title: "後でやる役", eyebrow: "コンテナ" });
topoComplex
  .group("store", { label: "しまう場所" })
  .add({ id: "cache", kind: "cache", title: "覚え書き", eyebrow: "Redis" })
  .add({ id: "db", kind: "database", title: "台帳", eyebrow: "PostgreSQL" });
topoComplex
  .connect("browser", "cdn", { label: "画面を取る" })
  .connect("mobile", "alb", { label: "呼び出す" })
  // 枠の中だけで繋がる線。 枠をまたぐ線と違って枠の縁を越えない
  .connect("cdn", "alb", { label: "無い分を回す" })
  .connect("alb", "web", { label: "画面の求め" })
  .connect("alb", "api", { label: "仕事の求め" })
  .connect("api", "queue", { label: "後の分を積む" })
  .connect("queue", "worker", { label: "1 件ずつ渡す" })
  .connect("web", "cache", { label: "先に見る" })
  .connect("api", "db", { label: "読み書き", tone: "success" })
  .connect("worker", "db", { label: "書き足す", tone: "success" });

export const pattern__presetTopology__複雑 = withSteps(topoComplex.build(), [
  {
    ids: ["browser", "mobile"],
    title: "1. 利用者は 2 通りで来る",
    body: "1 つの枠に 2 箱を置く。 枠の名前が左肩に出る。",
  },
  {
    ids: ["cdn", "alb", "c0-browser-cdn", "c1-mobile-alb"],
    title: "2. 入口で受ける",
    body: "枠をまたぐ線は左から右へ引く。 画面は配信網へ、呼び出しは振り分けへ。",
  },
  {
    ids: ["c2-cdn-alb"],
    title: "3. 無い分を振り分けへ回す",
    body: "同じ枠の中だけで繋がる線。 枠の縁を越えないので短く引かれる。",
  },
  {
    ids: ["web", "api", "c3-alb-web", "c4-alb-api"],
    title: "4. 動かす場所へ渡す",
    body: "1 つの箱から 2 本に分かれる。 求めの種類で行き先が変わる。",
  },
  {
    ids: ["queue", "c5-api-queue"],
    title: "5. 後でやる分を積む",
    body: "順番待ちを同じ枠に置く。 しまう場所に置くと戻る線になり、端が辺の中心からずれる。",
  },
  {
    ids: ["worker", "c6-queue-worker"],
    title: "6. 1 件ずつ取り出す",
    body: "積んだ順に渡す。 この 2 本も枠の中だけの線。",
  },
  {
    ids: ["cache", "c7-web-cache"],
    title: "7. 覚え書きを先に見る",
    body: "しまう場所の枠へ入る 1 本目。 画面を返す役だけが使う。",
  },
  {
    ids: ["db", "c8-api-db", "c9-worker-db"],
    title: "8. 台帳へ読み書きする",
    body: "2 つの役が同じ台帳を使う。 色を変えて残す道だと分かるようにした。",
  },
]);

// er preset ... ER 図 (設計「箱と行と関係」 の意匠)
//
// `users` が `orders` を注文し、`orders` が `order_items` を明細として持つ。 `users` は自分自身を
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
    // 識別しない = 破線。 子は自分の鍵を持ち、親はただの参照先。 1 人の利用者が 0 件以上の注文をする
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
      title: "2. 注文する",
      body: "破線は識別しない関係。 1 人の利用者が 0 件以上の注文をする。",
    },
    {
      ids: ["order_items", "rel-1-orders-order_items"],
      title: "3. 明細を持つ",
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

/**
 * 簡単な版と複雑な版は、1 つの見本の中のパターンで切り替える (#1960)。
 * 一覧の別の行にすると、同じ種類の図の規模違いを見比べるのに行を選び直すことになる
 */
export const patternBase__presetEr = "簡単";

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
    label: "登録する",
    style: "dashed",
    tailHead: "one",
    head: "zero-many",
  })
  .relation({ from: "users", to: "orders", label: "注文する", tailHead: "one", head: "many" })
  .relation({ from: "users", to: "user_roles", label: "役割を持つ", tailHead: "one", head: "many" })
  .relation({ from: "roles", to: "user_roles", label: "割り当てる", tailHead: "one", head: "many" })
  .relation({ from: "orders", to: "order_items", label: "含む", tailHead: "one", head: "many" })
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
    label: "発送する",
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
  .relation({ from: "products", to: "order_items", label: "注文される", tailHead: "one", head: "many" })
  .relation({ from: "products", to: "inventory", label: "在庫を持つ", tailHead: "one", head: "one" })
  .relation({
    from: "products",
    to: "product_categories",
    label: "属する",
    tailHead: "one",
    head: "many",
  })
  .relation({
    from: "categories",
    to: "product_categories",
    label: "商品を含む",
    tailHead: "one",
    head: "many",
  })
  .relation({
    from: "categories",
    to: "categories",
    label: "下位分類を持つ",
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
      body: "1 人の利用者が 1 件以上の注文をする。 端の棒と鳥の足で数を読む。",
    },
    {
      ids: ["order_items", "products", "rel-4-orders-order_items", "rel-9-products-order_items"],
      title: "2. 明細に商品が並ぶ",
      body: "実線は識別する関係。 親の鍵が子の鍵に入る。",
    },
    {
      ids: ["inventory", "rel-10-products-inventory"],
      title: "3. 在庫を持つ",
      body: "端が両方とも棒。 1 対 1 で、どちらも欠けない。",
    },
    {
      ids: [
        "categories",
        "product_categories",
        "rel-11-products-product_categories",
        "rel-12-categories-product_categories",
      ],
      title: "4. 商品を分類する",
      body: "2 つの鍵を持つ中継表が、商品と分類の多対多を作る。",
    },
    {
      ids: ["roles", "rel-13-categories-categories"],
      title: "5. 分類の親子",
      body: "破線で同じ表へ戻る。 親を持たない最上位の分類もある。",
    },
    {
      ids: ["user_roles", "rel-2-users-user_roles", "rel-3-roles-user_roles"],
      title: "6. 役割を割り当てる",
      body: "利用者と役割も中継表越し。 2 つの鍵がそのまま主キーになる。",
    },
    {
      ids: ["addresses", "rel-0-users-addresses"],
      title: "7. 住所を登録する",
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
/** 順番を持たない図なので触れて読む形にする (#1757)。 ER 図の中のパターン「複雑」 (#1960) */
export const pattern__presetEr__複雑 = 触れて読む(presetErComplexSteps);

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
    .state({ id: "draft", title: "下書き", col: 0, row: 1, initial: true })
    .state({
      id: "placed",
      title: "受付済",
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
      title: "支払済",
      col: 0,
      row: 3,
      final: true,
      actions: [{ when: "do", label: "出荷を待つ" }],
    })
    .mark({ id: "done", kind: "end", col: 0, row: 4 })
    .state({
      id: "cancelled",
      title: "取消済",
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
    { ids: ["begin", "draft", "t0-begin-draft"], title: "1. 下書き", body: "塗った丸が始まり。" },
    {
      ids: ["placed", "t1-draft-placed"],
      title: "2. 出して受付済へ",
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

/**
 * 簡単な版と複雑な版は、1 つの見本の中のパターンで切り替える (#1960)。
 * 一覧の別の行にすると、同じ種類の図の規模違いを見比べるのに行を選び直すことになる
 */
export const patternBase__presetStateMachine = "簡単";

/**
 * 状態遷移図の複雑な版 (#2163)。
 *
 * 簡単な版は注文が下書きから支払済へ進む 1 本道で、終わり方が 2 つ、条件付きの遷移が 0 本。
 * 実物の状態は「何度まで直せるか」 のような条件で分かれるので、`guard` を使った見本を置く。
 * 題材を記事にしたのは、注文を題材にした複雑な版が ER 図 / クラス図 / 順序図に既にあるため。
 *
 * **主な道を左の 1 列に置き、外れる道を右へ出す**。 線は縦か横の隣どうしだけで結ぶ。
 * 斜めに結ぶと間の箱を貫く = 査読待ち (0 列 2 段) から直し中 (1 列 1 段) へ引いた線は
 * 下書きを貫き、その戻りは始まりの丸を貫いた (実測の重い指摘 2 件)。
 * そのため直しは自分へ戻る輪 1 本にまとめ、直し中の状態は置いていない。
 *
 * **箱の幅 (`stateWidth`) は図の大きさを変えない**。 320 / 280 / 240 のどれでも
 * 2212 × 1488 のままだった (実測)。 幅を決めているのは列の間隔で、箱の幅ではない。
 *
 * 器の倍率は拡大で 9.3px、一覧で 8.7px になる。 段を減らすか横に並べ替えれば縮むが、
 * 3 通りの終わり方を列で分ける置き方そのものが見本の中身なので、受け入れ一覧に足している。
 */
const fsmComplex = stateMachine({
  id: "fsm-complex-demo",
  topic: "記事が下書きから公開と取り下げへ進む状態",
})
  .mark({ id: "begin", kind: "start", col: 0, row: 0 })
  .state({
    id: "draft",
    title: "下書き",
    col: 0,
    row: 1,
    initial: true,
    actions: [
      { when: "entry", label: "自動で保存を始める" },
      { when: "internal", label: "下書きを保つ", note: "30 秒ごと" },
    ],
  })
  .state({
    id: "review",
    title: "査読待ち",
    col: 0,
    row: 2,
    actions: [{ when: "entry", label: "査読者に知らせる" }],
  })
  .state({
    id: "rejected",
    title: "見送り",
    col: 1,
    row: 2,
    final: true,
    actions: [{ when: "entry", label: "見送った訳を残す" }],
  })
  .mark({ id: "closed1", kind: "end", col: 2, row: 2 })
  .state({
    id: "scheduled",
    title: "予約済",
    col: 0,
    row: 3,
    actions: [{ when: "do", label: "時刻が来るのを待つ" }],
  })
  .state({
    id: "canceled",
    title: "取り消し",
    col: 1,
    row: 3,
    final: true,
    actions: [{ when: "exit", label: "枠を空ける" }],
  })
  .mark({ id: "closed2", kind: "end", col: 2, row: 3 })
  .state({
    id: "published",
    title: "公開中",
    col: 0,
    row: 4,
    final: true,
    actions: [{ when: "do", label: "読まれた数を数える" }],
  })
  .state({
    id: "withdrawn",
    title: "取り下げ",
    col: 1,
    row: 4,
    final: true,
    actions: [{ when: "exit", label: "検索から消す" }],
  })
  .mark({ id: "closed3", kind: "end", col: 2, row: 4 })
  .transition({ from: "begin", to: "draft", trigger: "" })
  // 自分へ戻る輪 (#1464)。 書き足しても状態は下書きのまま
  .transition({ from: "draft", to: "draft", trigger: "書き足す" })
  .transition({ from: "draft", to: "review", trigger: "出す" })
  // 条件付きの遷移。 同じきっかけでも回数で行き先が分かれる
  .transition({ from: "review", to: "review", trigger: "直して出し直す", guard: "3 度まで" })
  .transition({ from: "review", to: "rejected", trigger: "見送られる", guard: "4 度目", tone: "error" })
  .transition({ from: "rejected", to: "closed1", trigger: "" })
  .transition({ from: "review", to: "scheduled", trigger: "認められる", tone: "success" })
  .transition({ from: "scheduled", to: "canceled", trigger: "取りやめる" })
  .transition({ from: "canceled", to: "closed2", trigger: "" })
  .transition({ from: "scheduled", to: "published", trigger: "時刻になる", tone: "success" })
  .transition({ from: "published", to: "withdrawn", trigger: "誤りが見つかる", tone: "error" })
  .transition({ from: "withdrawn", to: "closed3", trigger: "" })
  .build();

export const pattern__presetStateMachine__複雑 = withSteps(fsmComplex, [
  {
    ids: ["begin", "draft", "t0-begin-draft", "t1-draft-draft"],
    title: "1. 下書きで書き始める",
    body: "塗った丸が始まり。 自分へ戻る輪は、書き足しても状態が変わらないこと。",
  },
  {
    ids: ["review", "t2-draft-review"],
    title: "2. 出して査読を待つ",
    body: "山形を塗った行は、その状態に入った瞬間に 1 度だけすること。",
  },
  {
    ids: ["t3-review-review"],
    title: "3. 直して出し直す",
    body: "札の 2 行目が条件。 3 度目までは査読待ちのまま戻る。",
  },
  {
    ids: ["rejected", "closed1", "t4-review-rejected", "t5-rejected-closed1"],
    title: "4. 4 度目は見送りで終わる",
    body: "同じ査読でも回数で行き先が分かれる。 輪で囲んだ印が 1 つ目の終わり。",
  },
  {
    ids: ["scheduled", "t6-review-scheduled"],
    title: "5. 認められて予約に入る",
    body: "四角を塗った行は、その状態にいる間ずっと続くこと。",
  },
  {
    ids: ["canceled", "closed2", "t7-scheduled-canceled", "t8-canceled-closed2"],
    title: "6. 公開の前に取りやめる",
    body: "山形の外枠だけの行は、その状態から出る瞬間に 1 度だけすること。 2 つ目の終わり。",
  },
  {
    ids: ["published", "t9-scheduled-published"],
    title: "7. 時刻が来て公開する",
    body: "主な道はここまで。 左の 1 列が下書きから公開までの道になっている。",
  },
  {
    ids: ["withdrawn", "closed3", "t10-published-withdrawn", "t11-withdrawn-closed3"],
    title: "8. 誤りが見つかって取り下げる",
    body: "公開の後にも外れる道がある。 3 つ目の終わりで、右の列に終わり方が 3 つ並ぶ。",
  },
]);

// ───────────── 新図種 12 種 (cdl v0.6+) ─────────────

// infrastructure preset ... cloud / system 構成図 (col + row grid)
export const presetInfrastructure = withSteps(
  // 小見出しと説明を書く (#1498)。 cdl 0.20.0 で名前だけの箱は 54 まで縮み、段が近づいて
  // `GET/SET` の説明が隣の線に 1 かぶった。 中身を足せば箱が中身ぶんの高さに戻る
  infrastructure({ id: "infra-demo", topic: "クラウド・ネットワーク構成を階層で示す図" })
    .node({ id: "user", kind: "person", title: "ブラウザ", eyebrow: "利用者", subtitle: "利用者の画面", col: 0, row: 0 })
    .node({ id: "cdn", kind: "cdn", title: "CloudFront", eyebrow: "配信", subtitle: "静的配信", col: 1, row: 0 })
    .node({ id: "alb", kind: "service", title: "ALB", eyebrow: "振り分け", subtitle: "負荷分散", col: 2, row: 0 })
    .node({ id: "app", kind: "service", title: "アプリ", eyebrow: "処理", subtitle: "注文の処理", col: 2, row: 1 })
    .node({ id: "db", kind: "database", title: "RDS", eyebrow: "保存", subtitle: "永続化", col: 3, row: 0 })
    .node({ id: "cache", kind: "cache", title: "Redis", eyebrow: "一時保存", subtitle: "高速化", col: 3, row: 1 })
    // 順路 = 要求が通る 1 本道。 朱で引き、名前の下地を外す (cdl#618)。
    // 預け先の 2 本は順路の続きではないので墨のまま = どちらも同じ色だと、
    // どこから読むかが決まらない
    .connect({ from: "user", to: "cdn", label: "HTTPS", role: "main", labelPlate: false })
    .connect({ from: "cdn", to: "alb", label: "オリジン", role: "main", labelPlate: false })
    .connect({ from: "alb", to: "app", label: "転送", role: "main", labelPlate: false })
    .connect({ from: "app", to: "db", label: "SQL", labelPlate: false })
    .connect({ from: "app", to: "cache", label: "GET/SET", labelPlate: false })
    .build(),
  [
    { ids: ["user"], title: "1. ブラウザ", body: "利用者から始まる。" },
    { ids: ["cdn", "i0-user-cdn"], title: "2. CloudFront", body: "HTTPS を受ける。" },
    { ids: ["alb", "i1-cdn-alb"], title: "3. ALB", body: "CloudFront はオリジンの ALB へ要求を渡す。" },
    { ids: ["app", "i2-alb-app"], title: "4. アプリ", body: "処理を担う。" },
    { ids: ["db", "cache", "i3-app-db", "i4-app-cache"], body: "アプリは RDS に SQL で書き込み、Redis に一時保存する。" },
  ],
);

/** 簡単な版と複雑な版は、1 つの見本の中のパターンで切り替える (#1960) */
export const patternBase__presetInfrastructure = "簡単";

// 構成図の複雑な版 (#2139)。 注文を受けてから発送の知らせを送るまでを 12 箱で追う。
//
// 簡単な版に無い 4 つの形を入れる = 順路から外れる枝 (S3) / 待ち行列の後ろの処理 (SQS → 発送係) /
// 2 か所から書く台帳 (注文 API と発送係) / 写しへの複製 (RDS 主 → 複製)。
//
// 置き場所は下書きで 3 通り組んで決めた。 同じ段に空いた列を挟むと段の間隔の揃い
// (`row-gap-uniform`) に掛かるので、段ごとに列を詰めて置く。 線は全て隣の枠へ引く。
//
//   段 0          S3          Cognito   Redis     RDS 複製
//   段 1  ブラウザ  CloudFront  ALB       注文 API  RDS 主
//   段 2                                 SQS       発送係
//   段 3                                           SES
//
// 箱は段ごとに上から宣言するので、最初に現れる列は 1 になる。 組み立て器は現れた順に縦列を
// 作るため、そのままでは列 0 (ブラウザ) が右端に回る = `orderGridColumns` で番号順に戻す
export const pattern__presetInfrastructure__複雑 = withSteps(
  orderGridColumns(
    infrastructure({
      id: "infra-complex-demo",
      topic: "注文を受けてから発送の知らせを送るまでのクラウド構成図",
    })
      // `storage` は表を持つ箱 (ER 図の実体) の種類で、説明の字を描かない。 保存先は円柱で描く
      .node({ id: "s3", kind: "database", title: "S3", eyebrow: "静的ファイル", subtitle: "画像と画面の部品", col: 1, row: 0 })
      .node({ id: "auth", kind: "service", title: "Cognito", eyebrow: "認証", subtitle: "ログインを確かめる", col: 2, row: 0 })
      .node({ id: "cache", kind: "cache", title: "Redis", eyebrow: "一時保存", subtitle: "在庫数を覚えておく", col: 3, row: 0 })
      .node({ id: "replica", kind: "database", title: "RDS 複製", eyebrow: "読み取り", subtitle: "集計に使う写し", col: 4, row: 0 })
      .node({ id: "user", kind: "person", title: "ブラウザ", eyebrow: "利用者", subtitle: "注文する人の画面", col: 0, row: 1 })
      .node({ id: "cdn", kind: "cdn", title: "CloudFront", eyebrow: "配信", subtitle: "近い拠点から返す", col: 1, row: 1 })
      .node({ id: "alb", kind: "service", title: "ALB", eyebrow: "振り分け", subtitle: "空いたタスクへ渡す", col: 2, row: 1 })
      .node({ id: "app", kind: "service", title: "注文 API", eyebrow: "処理", subtitle: "ECS のタスク", col: 3, row: 1 })
      .node({ id: "db", kind: "database", title: "RDS 主", eyebrow: "書き込み", subtitle: "注文の台帳", col: 4, row: 1 })
      .node({ id: "queue", kind: "queue", title: "SQS", eyebrow: "待ち行列", subtitle: "注文の知らせを溜める", col: 3, row: 2 })
      .node({ id: "worker", kind: "service", title: "発送係", eyebrow: "後ろの処理", subtitle: "Lambda の関数", col: 4, row: 2 })
      .node({ id: "mail", kind: "service", title: "SES", eyebrow: "送信", subtitle: "発送の知らせを送る", col: 4, row: 3 })
      // 順路 = 要求が通る 1 本道 (cdl#618)。 ブラウザから台帳に書くまでの 4 本だけを順路にする
      .connect({ from: "user", to: "cdn", label: "HTTPS", role: "main", labelPlate: false })
      .connect({ from: "cdn", to: "s3", label: "静的ファイル", labelPlate: false })
      .connect({ from: "cdn", to: "alb", label: "オリジン", role: "main", labelPlate: false })
      .connect({ from: "alb", to: "auth", label: "ログインを確かめる", labelPlate: false })
      .connect({ from: "alb", to: "app", label: "転送", role: "main", labelPlate: false })
      .connect({ from: "app", to: "cache", label: "GET/SET", labelPlate: false })
      .connect({ from: "app", to: "db", label: "SQL", role: "main", labelPlate: false })
      .connect({ from: "db", to: "replica", label: "複製", labelPlate: false })
      .connect({ from: "app", to: "queue", label: "注文の知らせ", labelPlate: false })
      .connect({ from: "queue", to: "worker", label: "取り出す", labelPlate: false })
      .connect({ from: "worker", to: "db", label: "発送済みを書く", labelPlate: false })
      .connect({ from: "worker", to: "mail", label: "送る", labelPlate: false })
      .build(),
  ),
  [
    {
      ids: ["user", "cdn", "i0-user-cdn"],
      title: "1. 近い拠点へ繋ぐ",
      body: "ブラウザは近い拠点の CloudFront に HTTPS で繋ぐ。 ここから台帳に書くまでの 4 本が、要求の通る順路。",
    },
    {
      ids: ["s3", "i1-cdn-s3"],
      title: "2. 画面の部品は S3 から",
      body: "画像や画面の部品は、CloudFront が S3 から返す。 この線は順路から外れる枝で、アプリまで届かない。",
    },
    {
      ids: ["alb", "auth", "i2-cdn-alb", "i3-alb-auth"],
      title: "3. 振り分けの前にログインを確かめる",
      body: "画面の部品以外の要求は、オリジンの ALB へ渡る。 ALB は Cognito でログインを確かめてから通す。",
    },
    {
      ids: ["app", "i4-alb-app"],
      title: "4. 注文 API へ転送する",
      body: "ALB は空いている ECS のタスクへ転送する。 タスクを増やしても入口は ALB の 1 つのまま。",
    },
    {
      ids: ["cache", "i5-app-cache"],
      title: "5. 在庫数を一時保存から読む",
      body: "在庫数は Redis に覚えておく。 注文のたびに台帳を読まずに済む。",
    },
    {
      ids: ["db", "replica", "i6-app-db", "i7-db-replica"],
      title: "6. 台帳に書いて写しを作る",
      body: "注文は RDS 主に SQL で書く。 主は写しを RDS 複製へ送り、集計の読み取りは複製が受ける。",
    },
    {
      ids: ["queue", "i8-app-queue"],
      title: "7. 知らせを待ち行列に置く",
      body: "注文 API は発送の手配を待たない。 SQS に知らせを置いた時点で、ブラウザへ返事を返す。",
    },
    {
      ids: ["worker", "i9-queue-worker", "i10-worker-db"],
      title: "8. 発送係が引き取る",
      body: "Lambda の発送係が知らせを取り出して手配する。 済んだら同じ RDS 主に発送済みを書く = 台帳へ書く線が 2 本入る。",
    },
    {
      ids: ["mail", "i11-worker-mail"],
      body: "発送係は SES で発送の知らせを送る。 注文を受けた処理と知らせを送る処理が、待ち行列で切り離されている。",
    },
  ],
);

// classDiagram preset ... UML クラス図 (設計「箱と行と関係」 の意匠)
//
// **6 種すべてを 1 枚で使う**。 見本にあって図に無い記法は、読み手が確かめられない決まりに
// なる。 並べ方の決まりは 1 つで、**箱の 1 つの辺には関係を 1 本しか載せない** = 同じ辺から
// 2 本出すと、どちらも辺の芯から出るので重なる。 7 箱を 3 列 3 段に置いて、6 本が
// 上 / 下 / 左 / 右 に散るようにしてある。
// 描き手は元から種類の札を持つが、カタログでは 1 度も使っていなかった。 `interface` と
// `abstract` の異なる 2 値を出し、札が種類を分ける入口だと読めるようにする。
// **関係に色みを書かない** (#1583)。 描き手が種類から 3 群の色みを決めるので、書くとそちらが
// 勝って 6 本とも同じ色になる。 記法 3 形とも書かない形で揃える。
//
//   段 0   User        Auditable
//   段 1   Admin ──集約── Order ──依存── Receipt
//   段 2               Line ──関連── Sku
const presetClassDiagramSteps = withSteps(
  // 配色は生成りに茶 (#1567)。 クラス図の箱は ER 図と同じ作り (行頭の印 + 左に名前 +
  // 右に型) で、名前と型が離れて並ぶ。 縞の色は配色から取るので、書かないと縞が箱の面と
  // 同じ色になって出ない
  classDiagram({ id: "class-demo", topic: "クラスどうしの 6 種の関係を示す UML クラス図", palette: "kinari" })
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
    // 継承 = 実線 + 白抜きの三角が親の側 / 実装 = 破線 + 白抜きの三角 /
    // 集約 = 実線 + 白抜きの菱が全体の側 / コンポジション = 菱を塗る /
    // 関連 = 実線 + 開いた矢 / 依存 = 破線 + 開いた矢
    .relation({ from: "Admin", to: "User", type: "extends", label: "継承" })
    .relation({ from: "Order", to: "Auditable", type: "implements", label: "実装" })
    .relation({ from: "Admin", to: "Order", type: "aggregates", label: "集約", cardinality: "1..*", tailCardinality: "1" })
    .relation({ from: "Order", to: "Receipt", type: "uses", label: "依存" })
    .relation({ from: "Order", to: "Line", type: "composes", label: "コンポジション", cardinality: "1..*", tailCardinality: "1" })
    .relation({ from: "Line", to: "Sku", type: "associates", label: "関連" })
    .build(),
  [
    { ids: ["User"], title: "1. User", body: "抽象クラス。 直接は作らず、Admin が継承して使う。" },
    {
      ids: ["Admin", "cr-0-Admin-User"],
      title: "2. 継承",
      body: "実線に白抜きの三角。 三角は親クラスの側に付く。",
    },
    {
      ids: ["Auditable", "Order", "cr-1-Order-Auditable"],
      title: "3. 実装",
      body: "破線に白抜きの三角。 処理の中身ではなく操作の取り決めだけを引き継ぐので、線を破線にする。",
    },
    {
      ids: ["cr-2-Admin-Order"],
      title: "4. 集約",
      body: "実線に白抜きの菱。 菱は全体の側に付く。 部分は全体が無くなっても残る。",
    },
    {
      ids: ["Line", "cr-4-Order-Line"],
      title: "5. コンポジション",
      body: "菱を塗る。 部分の寿命は全体と同じで、全体を消すと部分も消える。",
    },
    {
      ids: ["Sku", "Receipt", "cr-5-Line-Sku", "cr-3-Order-Receipt"],
      title: "6. 関連と依存",
      body: "関連は実線に開いた矢で、相手を参照し続ける。 依存は破線に開いた矢で、引数や戻り値として一時的に使うだけ。",
    },
  ],
);
/** 順番を持たない図なので触れて読む形にする (#1757) */
export const presetClassDiagram = 触れて読む(presetClassDiagramSteps);

/** 簡単な版と複雑な版は、1 つの見本の中のパターンで切り替える (#1960) */
export const patternBase__presetClassDiagram = "簡単";

// 同じ辺に 2 本以上の関係が付くと、@cardenelabs/cdl が全ての線を辺の中点へ寄せる
// (`layout/edges.ts` の offset 0) ため、辺から最初の折れまでが必ず重なる。
// 5 本の関係を持つ Transaction は 4 辺へ割り振れないので、同色の「関連」と「依存」を
// 1 辺へ寄せ、残る 3 本を上・左・下へ散らしている。
//
// 箱の置き場所は数え上げで決めた。 満たすべきは 5 つで、いずれも `edge-geometry.test.ts` が
// 見ている (色違いの線が重ならない / 同色の重なりが 2 件以下 / 折れが 32 個以下 /
// 30px 未満の直線区間が無い / 札が別の関係の線に乗らない)。
//
// **札の条件は後から足した** (#1608)。 先に入れた配置 (カード払いを c2、財布払いを c3 に
// 置いた形) は線と線しか見ておらず、カード払いの継承の線と財布払いの実装の線が同じ区画で
// 交差して、両方の札が互いの線に乗っていた。 それを見ていたのは `packages/dragon` の
// sweep だけで、この file の隣にある検査は緑のままだった。
//
// 段は崩せない。 段 0 に約束、段 1 に実装、段 2 以降に動くものを置く形を外すと、
// 数値だけは満たせる配置が出るが、子が親の上に来たり同じ親を継承する 3 つが散ったりして
// 段の筋書きが読めなくなる。 その形を保ったまま列を 6 本まで広げて全通り (2592 通り)
// 数えると、上 2 段だけでは 5 つを同時に満たす置き方が 1 つも無かった。
// 下段も 1 列ずつ右へ寄せて初めて両立する。
const presetClassComplexSteps = withSteps(
  orderGridColumns(
    classDiagram({
      id: "class-complex-demo",
      topic: "決済の抽象クラスとインターフェースと関係を示す UML クラス図",
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
      .relation({ from: "BankTransfer", to: "PaymentMethod", type: "extends", label: "継承" })
      .relation({ from: "CardPayment", to: "PaymentMethod", type: "extends", label: "継承" })
      .relation({ from: "WalletPayment", to: "PaymentMethod", type: "extends", label: "継承" })
      .relation({ from: "PaymentGateway", to: "Auditable", type: "implements", label: "実装" })
      .relation({ from: "WalletPayment", to: "Auditable", type: "implements", label: "実装" })
      .relation({ from: "RiskCheck", to: "Notification", type: "uses", label: "依存" })
      .relation({ from: "PaymentGateway", to: "Retryable", type: "implements", label: "実装" })
      .relation({ from: "Transaction", to: "Receipt", type: "aggregates", label: "集約" })
      .relation({ from: "Transaction", to: "LedgerEntry", type: "composes", label: "コンポジション" })
      .relation({ from: "PaymentGateway", to: "Transaction", type: "composes", label: "コンポジション" })
      .relation({ from: "Transaction", to: "CardPayment", type: "associates", label: "関連" })
      .relation({ from: "Receipt", to: "LedgerEntry", type: "associates", label: "関連" })
      .relation({ from: "PaymentGateway", to: "RiskCheck", type: "uses", label: "依存" })
      .relation({ from: "Transaction", to: "Notification", type: "uses", label: "依存" })
      .build(),
  ),
  [
    {
      ids: ["PaymentMethod", "Auditable", "Retryable"],
      title: "1. 抽象クラスとインターフェース",
      body: "支払い方法の抽象クラスと、監査・再試行のインターフェースを先に読む。",
    },
    {
      ids: [
        "BankTransfer",
        "CardPayment",
        "cr-0-BankTransfer-PaymentMethod",
        "cr-1-CardPayment-PaymentMethod",
      ],
      title: "2. 振込とカードの継承",
      body: "実線に白抜きの三角。 三角は親クラスの側に付く。",
    },
    {
      ids: [
        "WalletPayment",
        "cr-2-WalletPayment-PaymentMethod",
        "cr-4-WalletPayment-Auditable",
      ],
      title: "3. 財布の継承と実装",
      body: "1 つのクラスが親クラスを継承し、別のインターフェースも実装する。 破線の先がインターフェース。",
    },
    {
      ids: [
        "PaymentGateway",
        "cr-3-PaymentGateway-Auditable",
        "cr-6-PaymentGateway-Retryable",
      ],
      title: "4. ゲートウェイの実装",
      body: "破線に白抜きの三角。 処理の中身ではなく操作の取り決めだけを引き継ぐので、線を破線にする。",
    },
    {
      ids: [
        "Transaction",
        "cr-9-PaymentGateway-Transaction",
        "cr-10-Transaction-CardPayment",
      ],
      title: "5. 取引のコンポジション",
      body: "塗った菱。 取引の寿命はゲートウェイと同じで、ゲートウェイが消えると取引も消える。 実線に開いた矢は関連で、取引はカード払いを参照する。",
    },
    {
      ids: ["Receipt", "LedgerEntry", "cr-7-Transaction-Receipt", "cr-8-Transaction-LedgerEntry"],
      title: "6. 領収書と仕訳",
      body: "白抜きの菱は集約で、領収書は取引が無くなっても残る。 塗った菱はコンポジションで、仕訳は取引と一緒に消える。",
    },
    {
      ids: ["RiskCheck", "cr-11-Receipt-LedgerEntry", "cr-12-PaymentGateway-RiskCheck"],
      title: "7. 仕訳の参照とリスク判定",
      body: "関連は実線に開いた矢で、相手を参照し続ける。 依存は破線に開いた矢で、引数や戻り値として一時的に使うだけ。",
    },
    {
      ids: ["Notification", "cr-5-RiskCheck-Notification", "cr-13-Transaction-Notification"],
      title: "8. 通知への依存",
      body: "リスク判定と取引が、同じ通知クラスに依存する。 破線に開いた矢が 2 本入る。",
    },
  ],
);
/** 順番を持たない図なので触れて読む形にする (#1757)。 クラス図の中のパターン「複雑」 (#1960) */
export const pattern__presetClassDiagram__複雑 = 触れて読む(presetClassComplexSteps);

// tree preset ... 組織図 / file tree / class 階層
// 名前を状態から取り、組織の呼び方が変わる様子を見せる (cdl 0.7.0 で名前が状態を読む)。
export const presetTree = withSteps(
  bindFirstNode(
    tree({ id: "tree-demo", topic: "親子関係を縦階層で示す組織図・木構造" })
      .node({ id: "ceo", title: "社長" })
      .node({ id: "cto", title: "技術責任者", parent: "ceo" })
      .node({ id: "cfo", title: "財務責任者", parent: "ceo" })
      .node({ id: "eng", title: "開発部長", parent: "cto" })
      .node({ id: "ops", title: "運用部長", parent: "cto" })
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
      body: "開発の責任者を開発部長と呼んでいる。",
    },
    {
      body: "呼び方だけが変わり、繋がりはそのまま。 名前を状態から取っている。",
      sets: [{ id: "eng", value: "開発本部長" }],
    },
  ],
  [{ id: "eng", initial: "開発部長" }],
);

// userJourney preset ... step + emotion + touchpoint
// 段で 1 つの段階の気持ちを動かす。 感情の欄は `{名前}` を受けるので、同じ図が改善前と
// 改善後を映す。
export const presetUserJourney = withSteps(
  bindFirstNode(
    userJourney({ id: "journey-demo", topic: "ユーザー体験の感情変化をステップ順に示す図" })
      .step({ id: "land", title: "サイトを訪れる", emotion: "neutral", touchpoint: "サイト" })
      .step({
        id: "form",
        title: "登録の入力",
        emotion: "frustrated",
        touchpoint: "入力画面",
        opportunity: "入力のしやすさを直す",
      })
      .step({ id: "verify", title: "メールの確認", emotion: "happy", touchpoint: "メール" })
      .step({ id: "done", title: "管理画面を開く", emotion: "delighted", touchpoint: "管理画面" })
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
      body: "登録の入力で気持ちが落ちる。",
      sets: [{ id: "form_mood", value: "frustrated" }],
    },
    {
      body: "入力の作りを直すと、その段階の気持ちだけが上がる。 曲線の高さを状態から取っている。",
      sets: [{ id: "form_mood", value: "happy" }],
    },
  ],
  [{ id: "form_mood", initial: "frustrated" }],
);

export const patternBase__presetTree = "簡単";

/**
 * 階層図の複雑な版 (#2189)。
 *
 * 簡単な版は 5 箱 2 階層で、動くのは 1 箱の呼び方だけ。 実際に読み取りが要るのは
 * 「組織が育つにつれて課が部になり、人数が増える」 形で、5 箱の 1 回の言い換えでは描けない。
 *
 * **ぶら下げ先は状態から取れない**。 `parent` に `{...}` を書くと箱が親から切り離され、
 * 図の外れた所に 1 つだけ置かれる (実測、`validate` の警告は 0 件で重い指摘も出ない)。
 * 動かせるのは名前と 2 行目の補足の 2 つなので、**組み替えではなく呼び方と規模が変わる形**にする。
 *
 * **1 つの親にぶら下げる数は 8 まで**。 箱の幅は横に並ぶ数で決まるので、名前が長いと切れる
 * (実測 = 2 行目の補足を持たない箱なら 5 文字の名前を 8 つ並べても切れないが、7 文字は 7 つで切れた)。
 * 深さは 4 階層まで収まる。 ここでは 1 つの親に 3 つまでにして、3 階層 12 箱に収めた。
 *
 * **2 行目の補足を持つ箱の名前は 4 文字まで**。 3 つ並べた所で 5 文字の「品質保証部」 が
 * 「品質保…」 に切れた (画面で確かめた)。 補足の分だけ名前に使える幅が狭くなる。
 */
const TREE_COMPLEX_NODES = [
  { id: "tc_ceo", title: "社長", subtitle: "1 人" },
  { id: "tc_tech", title: "技術本部", subtitle: "{tc_tech_n}", parent: "tc_ceo" },
  { id: "tc_biz", title: "事業本部", subtitle: "10 人", parent: "tc_ceo" },
  { id: "tc_admin", title: "管理本部", subtitle: "{tc_admin_n}", parent: "tc_ceo" },
  { id: "tc_design", title: "{tc_design_t}", subtitle: "{tc_design_n}", parent: "tc_tech" },
  { id: "tc_dev", title: "{tc_dev_t}", subtitle: "{tc_dev_n}", parent: "tc_tech" },
  { id: "tc_qa", title: "{tc_qa_t}", subtitle: "{tc_qa_n}", parent: "tc_tech" },
  { id: "tc_sales", title: "営業部", subtitle: "6 人", parent: "tc_biz" },
  { id: "tc_support", title: "支援部", subtitle: "4 人", parent: "tc_biz" },
  { id: "tc_acct", title: "経理部", subtitle: "2 人", parent: "tc_admin" },
  { id: "tc_hr", title: "人事部", subtitle: "2 人", parent: "tc_admin" },
  { id: "tc_legal", title: "{tc_legal_t}", subtitle: "{tc_legal_n}", parent: "tc_admin" },
] as const;

const treeComplexBuilder = tree({
  id: "tree-complex-demo",
  topic: "立ち上げから育つにつれて課が部になり人数が増える組織図",
});
for (const n of TREE_COMPLEX_NODES) {
  // 組み立ての段では文字を決め打ちし、状態を読む欄は下の `bindFirstNode` で差し替える
  treeComplexBuilder.node({
    id: n.id,
    title: n.title.startsWith("{") ? n.id : n.title,
    ...("parent" in n ? { parent: n.parent } : {}),
  });
}

export const pattern__presetTree__複雑 = withSteps(
  bindFirstNode(treeComplexBuilder.build(), (n) => ({
    ...n,
    // `treeData` は `TREE_COMPLEX_NODES` を回す `for` で 1:1 に作るので長さは常に一致する
    treeData: n.treeData?.map((t, i) => {
      const 元 = TREE_COMPLEX_NODES[i];
      return 元 === undefined ? t : { ...t, title: 元.title, subtitle: 元.subtitle };
    }),
  })),
  [
    {
      ids: ["tree-complex-demo-tree"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["tree-complex-demo-tree"],
      // 描く段は伸ばす (#1353)。 12 箱を追うので簡単な版より長く取る
      duration: DRAW_DURATION,
      title: "立ち上げた時",
      body: "3 つの本部の下はどれも課と担当。 作る側は 3 つ合わせて 10 人。",
    },
    {
      title: "作る部門が部になる",
      body: "設計課と開発課が部になり、2 つで 10 人から 22 人へ。 技術本部は 28 人になる。",
      sets: [
        { id: "tc_design_t", value: "設計部" },
        { id: "tc_design_n", value: "8 人" },
        { id: "tc_dev_t", value: "開発部" },
        { id: "tc_dev_n", value: "14 人" },
      ],
    },
    {
      title: "品質を独立させる",
      body: "品質課が品質部になり 2 人から 6 人へ。 作る側の 3 つが全部「部」 で揃う。",
      sets: [
        { id: "tc_qa_t", value: "品質部" },
        { id: "tc_qa_n", value: "6 人" },
        { id: "tc_tech_n", value: "28 人" },
      ],
    },
    {
      body: "法務担当が法務部になり 1 人から 3 人へ。 12 箱のうち 4 つの呼び方が変わった。",
      sets: [
        { id: "tc_legal_t", value: "法務部" },
        { id: "tc_legal_n", value: "3 人" },
        { id: "tc_admin_n", value: "7 人" },
      ],
    },
  ],
  [
    { id: "tc_tech_n", initial: "10 人" },
    { id: "tc_admin_n", initial: "5 人" },
    { id: "tc_design_t", initial: "設計課" },
    { id: "tc_design_n", initial: "3 人" },
    { id: "tc_dev_t", initial: "開発課" },
    { id: "tc_dev_n", initial: "5 人" },
    { id: "tc_qa_t", initial: "品質課" },
    { id: "tc_qa_n", initial: "2 人" },
    { id: "tc_legal_t", initial: "法務担当" },
    { id: "tc_legal_n", initial: "1 人" },
  ],
);

export const patternBase__presetUserJourney = "簡単";

/**
 * 体験の道筋の複雑な版 (#2183)。
 *
 * 簡単な版は 4 段階で、動くのは 1 段階の気持ちだけ。 実際に読み取りが要るのは
 * 「何段階かの落ち込みを順に直すと、道筋全体の形が変わる」 形で、1 段階の上下では描けない。
 *
 * 買い物の体験を 6 段階に分け、探しにくさと支払いの選び方の 2 か所で気持ちが落ちる形にする。
 * 直す順に段を分けるので、どの改善がどの谷を埋めたかが読み取れる。
 *
 * **段階は 6 が上限**。 段階の名札は横に等間隔で並ぶので、8 段階にすると隣の名札に重なる
 * (画面で「3. 内容を読む」 と「4. かごに入れる」 が重なり、後ろの 4 つは互いに潰れた)。
 * 直しどころの札も隣り合うと重なるので、落ちる段階は 1 つ空けて置く。
 *
 * **これらは数の検査に出ない**。 板 1 枚で描く図は段階を増やしても `viewBox` が 865x600 の
 * まま変わらず指摘も 0 件で、画面で見て初めて分かる (進捗図でも同じことが起きた、#2181)。
 */
const JOURNEY_COMPLEX_STEPS = [
  { id: "jc_ad", title: "広告を見る", emotion: "neutral", touchpoint: "広告" },
  { id: "jc_find", title: "商品を探す", emotion: "{jc_find_mood}", touchpoint: "検索" },
  { id: "jc_cart", title: "かごに入れる", emotion: "happy", touchpoint: "買い物かご" },
  { id: "jc_pay", title: "支払いを選ぶ", emotion: "{jc_pay_mood}", touchpoint: "支払い画面" },
  { id: "jc_check", title: "注文を確かめる", emotion: "neutral", touchpoint: "確認画面" },
  { id: "jc_wait", title: "届くのを待つ", emotion: "{jc_wait_mood}", touchpoint: "お知らせ" },
] as const;

const journeyComplexBuilder = userJourney({
  id: "journey-complex-demo",
  topic: "買い物の道筋にある 2 つの落ち込みを順に直す図",
});
for (const s of JOURNEY_COMPLEX_STEPS) {
  // 組み立ての段では落ち込んだ側の気持ちを置き、状態は下の `bindFirstNode` で差し替える
  journeyComplexBuilder.step({
    id: s.id,
    title: s.title,
    emotion: "neutral",
    touchpoint: s.touchpoint,
    ...(s.id === "jc_find" ? { opportunity: "探しやすさを直す" } : {}),
    // 札は 8 文字まで。 10 文字にすると札の枠から字がはみ出す (画面で確かめた)
    ...(s.id === "jc_pay" ? { opportunity: "支払いを直す" } : {}),
  });
}

export const pattern__presetUserJourney__複雑 = withSteps(
  bindFirstNode(journeyComplexBuilder.build(), (n) => ({
    ...n,
    // `journeyData` は `JOURNEY_COMPLEX_STEPS` を回す `for` で 1:1 に作るので長さは常に一致する
    journeyData: n.journeyData?.map((s, i) => {
      const 元 = JOURNEY_COMPLEX_STEPS[i];
      return 元 === undefined ? s : { ...s, emotion: 元.emotion };
    }),
  })),
  [
    {
      ids: ["journey-complex-demo-journey"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["journey-complex-demo-journey"],
      // 描く段は伸ばす (#1353)。 8 段階を追うので簡単な版より長く取る
      duration: DRAW_DURATION,
      title: "直す前",
      body: "商品を探す段階と支払いを選ぶ段階の 2 か所で気持ちが落ちる。 道筋が 2 つの谷を作る。",
    },
    {
      title: "探しやすさを直す",
      body: "絞り込みを足すと、商品を探す段階の谷が満足まで上がる。 残る谷は 1 つ。",
      sets: [{ id: "jc_find_mood", value: "happy" }],
    },
    {
      title: "支払いの選び方を直す",
      body: "よく使う手立てを先頭に出すと、支払いの谷も埋まる。 谷が無くなる。",
      sets: [{ id: "jc_pay_mood", value: "happy" }],
    },
    {
      body: "2 つ直した後は、届くのを待つ段階が最も高くなる。 道筋全体が右上がりになった。",
      sets: [{ id: "jc_wait_mood", value: "delighted" }],
    },
  ],
  [
    { id: "jc_find_mood", initial: "frustrated" },
    { id: "jc_pay_mood", initial: "frustrated" },
    { id: "jc_wait_mood", initial: "happy" },
  ],
);

// mindMap preset ... 中心 + 放射 branch
// 中心の主題を状態から取り、主題が定まる様子を見せる (cdl 0.7.0 で名前が状態を読む)。
export const presetMindMap = withSteps(
  bindFirstNode(
    mindMap({
      id: "mind-demo",
      topic: "中心の主題から発想を放射状に広げる図",
      rootId: "root",
      rootTitle: "新しい企画",
    })
      .branch({ id: "feat", title: "機能", parent: "root" })
      .branch({ id: "ui", title: "画面の設計", parent: "root" })
      .branch({ id: "launch", title: "公開", parent: "root" })
      .branch({ id: "auth", title: "認証", parent: "feat" })
      .branch({ id: "billing", title: "課金", parent: "feat" })
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
      body: "中心はまだ「新しい企画」 のまま。",
    },
    {
      body: "枝を見て中心の主題が決まる。 中心の名前を状態から取っている。",
      sets: [{ id: "theme", value: "認証と課金の刷新" }],
    },
  ],
  [{ id: "theme", initial: "新しい企画" }],
);

export const patternBase__presetMindMap = "簡単";

/**
 * 枝分かれ図の複雑な版 (#2191)。
 *
 * 簡単な版は 6 箱 (中心 + 枝 5) で、動くのは中心の呼び方だけ。 実際に読み取りが要るのは
 * 「書き出した案を見比べて、先に作る所と後にする所を決める」 形で、1 回の言い換えでは描けない。
 *
 * **動かせるのは名前と 2 行目の補足だけ**。 枝のぶら下げ先は状態から取れず、`parent` に
 * `{...}` を書くと枝が中心から切り離されて図の外れた所に浮く (`validate` の警告は 0 件で
 * 重い指摘も出ない)。 階層図 (#2189) と同じ形の制約。
 *
 * そこで **中心と 4 つの観点の 2 行目に決めたことを書き込む形**にする。 枝の繋がりは動かさず、
 * 段が進むにつれて「先に作る」「後にする」 が埋まり、最後に中心の方針が決まる。
 *
 * **中心から出す枝は 8 まで、1 つの枝にぶら下げる数は 5 まで収まる** (実測で 3 / 4 / 5 / 6 / 8 本と
 * 1 枝に 2 / 3 / 4 / 5 個を描いて撮り、どれも名前が切れなかった)。 ここでは 4 本 + 6 個の 11 箱。
 */
const MIND_COMPLEX_BRANCHES = [
  { id: "mc_collect", title: "集める", subtitle: "{mc_collect_s}", parent: "mc_root" },
  { id: "mc_store", title: "貯める", subtitle: "{mc_store_s}", parent: "mc_root" },
  { id: "mc_show", title: "見せる", subtitle: "{mc_show_s}", parent: "mc_root" },
  { id: "mc_send", title: "配る", subtitle: "{mc_send_s}", parent: "mc_root" },
  { id: "mc_form", title: "入力の画面", parent: "mc_collect" },
  // 枝の名前は 5 文字まで。 6 文字の「読み込みの口」 は「読み込み…」 に切れた (画面で確かめた)
  { id: "mc_api", title: "読み込む口", parent: "mc_collect" },
  { id: "mc_place", title: "置き場所", parent: "mc_store" },
  { id: "mc_erase", title: "消し方", parent: "mc_store" },
  { id: "mc_list", title: "一覧", parent: "mc_show" },
  { id: "mc_detail", title: "詳しい画面", parent: "mc_show" },
] as const;

const mindComplexBuilder = mindMap({
  id: "mind-complex-demo",
  topic: "書き出した観点を先と後に仕分けて中心の方針が決まる枝分かれ図",
  rootId: "mc_root",
  rootTitle: "新しい仕組み",
});
for (const b of MIND_COMPLEX_BRANCHES) {
  mindComplexBuilder.branch({ id: b.id, title: b.title, parent: b.parent });
}

export const pattern__presetMindMap__複雑 = withSteps(
  bindFirstNode(mindComplexBuilder.build(), (n) => ({
    ...n,
    mindData: n.mindData && {
      ...n.mindData,
      rootSubtitle: "{mc_root_s}",
      // `branches` は `MIND_COMPLEX_BRANCHES` を回す `for` で 1:1 に作るので長さは常に一致する
      branches: n.mindData.branches.map((br, i) => {
        const 元 = MIND_COMPLEX_BRANCHES[i];
        return 元 === undefined || !("subtitle" in 元) ? br : { ...br, subtitle: 元.subtitle };
      }),
    },
  })),
  [
    {
      ids: ["mind-complex-demo-mind"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["mind-complex-demo-mind"],
      // 描く段は伸ばす (#1353)。 11 箱を追うので簡単な版より長く取る
      duration: DRAW_DURATION,
      title: "書き出した時",
      body: "4 つの観点と 6 つの枝を並べた。 どれを先に作るかはまだ決めていない。",
    },
    {
      title: "先に作る所を決める",
      body: "集めると貯めるが無いと何も始まらないので、この 2 つを先に作る。",
      sets: [
        { id: "mc_collect_s", value: "先に作る" },
        { id: "mc_store_s", value: "先に作る" },
      ],
    },
    {
      title: "後にする所を決める",
      body: "見せると配るは貯めた後でよいので、後に回す。 4 つの観点すべてに順番が付いた。",
      sets: [
        { id: "mc_show_s", value: "後にする" },
        { id: "mc_send_s", value: "後にする" },
      ],
    },
    {
      body: "中心の 2 行目が「集めて貯める所まで作る」 に変わる。 枝を見比べて方針が決まった。",
      sets: [{ id: "mc_root_s", value: "集めて貯める所まで作る" }],
    },
  ],
  [
    { id: "mc_root_s", initial: "まだ決めていない" },
    { id: "mc_collect_s", initial: "未定" },
    { id: "mc_store_s", initial: "未定" },
    { id: "mc_show_s", initial: "未定" },
    { id: "mc_send_s", initial: "未定" },
  ],
);

// funnel preset ... Sales / marketing funnel
// 段の人数を状態から取り、先月と今月を同じ図で見る。
const FUNNEL_STAGES = [
  { id: "visit", title: "訪問", last: 8200, now: 10000 },
  { id: "signup", title: "登録", last: 1100, now: 1500 },
  { id: "trial", title: "試用", last: 520, now: 800 },
  { id: "paid", title: "有料", last: 130, now: 200 },
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
      body: "訪問 8200 から有料 130 まで絞られる。",
    },
    {
      body: "今月は訪問 10000 / 有料 200。 段の人数を状態から取るので、同じ図が別の月を映す。",
      tweens: FUNNEL_STAGES.map((s) => ({ id: s.id, from: s.last, to: s.now })),
    },
  ],
  FUNNEL_STAGES.map((s) => ({ id: s.id, initial: s.last })),
);

export const patternBase__presetFunnel = "簡単";

/**
 * 漏斗の複雑な版 (#2185)。
 *
 * 簡単な版は 4 段階で、2 つの月の人数を丸ごと置き換えるだけ。 実際に読み取りが要るのは
 * 「どの段階で最も抜けるかを見つけて、そこだけ直す」 形で、丸ごと動かす見せ方では描けない。
 *
 * **入口の 3 段階はどの段でも動かさない**。 全部が増えると「集客を増やしたのか、途中を
 * 直したのか」 が読み分けられない。 真ん中の 1 か所だけを動かし、その後ろが順に増える形にする。
 *
 * 減り方の割合は隣の段階との差から出るので、**1 か所を直すと次の段階の割合が跳ねる**。
 * 二度目に使うを直した段で見積りの抜けが 25% から 69% になり、見積りを直した段では
 * 続けて使うが 13% から 64% になる。 詰まりが 1 つずつ後ろへ移る様子がそのまま図に出る。
 *
 * **段階は画面で 8 まで収まることを確かめてある** (7 にしたのは余裕を持たせるため)。
 * 板 1 枚で描く図は段階を増やしても `viewBox` が 712x600 のまま変わらず重い指摘も 0 件なので、
 * 数の検査では収まりを判定できない (#2181 / #2183 で同じことが起きた)。
 */
const FUNNEL_COMPLEX_STAGES = [
  { id: "fc_visit", title: "訪問", before: 10000, after: 10000 },
  { id: "fc_signup", title: "登録", before: 3000, after: 3000 },
  { id: "fc_trial", title: "試用を始める", before: 2100, after: 2100 },
  { id: "fc_again", title: "二度目に使う", before: 520, after: 1260 },
  { id: "fc_quote", title: "見積りを見る", before: 390, after: 950 },
  { id: "fc_paid", title: "有料へ移る", before: 300, after: 730 },
  { id: "fc_keep", title: "続けて使う", before: 260, after: 630 },
] as const;

const funnelComplexBuilder = funnel({
  id: "funnel-complex-demo",
  topic: "抜けが最も大きい一か所を直すと後ろが順に増える漏斗",
});
for (const s of FUNNEL_COMPLEX_STAGES) {
  funnelComplexBuilder.stage({ id: s.id, title: s.title, count: s.before });
}

/** 名前で選んで置き換える。 入口の 3 段階は選ばないので動かない */
const 段階を動かす = (...名前: readonly string[]) =>
  名前.map((名) => {
    const s = FUNNEL_COMPLEX_STAGES.find((x) => x.id === 名);
    if (s === undefined) throw new Error(`${名} は漏斗の複雑な版に無い`);
    return { id: s.id, from: s.before, to: s.after };
  });

export const pattern__presetFunnel__複雑 = withSteps(
  bindFirstNode(funnelComplexBuilder.build(), (n) => ({
    ...n,
    funnelData: n.funnelData?.map((s) => ({ ...s, count: `{${s.id}}` })),
  })),
  [
    {
      ids: ["funnel-complex-demo-funnel"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["funnel-complex-demo-funnel"],
      // 描く段は伸ばす (#1353)。 7 段階を追うので簡単な版より長く取る
      duration: DRAW_DURATION,
      title: "直す前",
      body: "訪問 10000 から続けて使う 260 まで。 二度目に使う段階で 75% が抜ける。",
    },
    {
      title: "二度目の使い方を直す",
      body: "初日の案内を足すと 520 が 1260 へ。 抜けは 40% に縮むが、次の見積りが 69% に跳ねる。",
      tweens: 段階を動かす("fc_again"),
    },
    {
      title: "詰まりが後ろへ移る",
      body: "見積りが 950、有料が 730 になる。 今度は続けて使うの抜けが 64% に跳ねて、詰まりがまた 1 つ後ろへ移る。",
      tweens: 段階を動かす("fc_quote", "fc_paid"),
    },
    {
      body: "続けて使う人が 630 になり、どの段階も 40% を超えない。 入口を増やさずに 2.4 倍になった。",
      tweens: 段階を動かす("fc_keep"),
    },
  ],
  FUNNEL_COMPLEX_STAGES.map((s) => ({ id: s.id, initial: s.before })),
);

// quadrant preset ... 2 軸 matrix (4 象限完全配置、 cdl PR #32 で stack 衝突 bug 修正済)
// 1 項目の居場所を状態から取り、優先度の見直しで枠を移る様子を見せる。
export const presetQuadrant = withSteps(
  bindFirstNode(
    quadrant({
      id: "quad-demo",
      topic: "2 つの軸で 4 象限に分けて優先度を決める図",
      xAxis: { left: "労力が小さい", right: "労力が大きい" },
      yAxis: { bottom: "価値が低い", top: "価値が高い" },
    })
      .item({ id: "qw", title: "文言の直し", quadrant: "topLeft" })
      .item({ id: "mp", title: "決済の作り直し", quadrant: "topRight" })
      .item({ id: "fi", title: "検索の絞り込み", quadrant: "bottomLeft" })
      .item({ id: "tt", title: "古い画面の移行", quadrant: "bottomRight" })
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
      body: "検索の絞り込みは、価値も労力も低い枠に置いてある。",
      sets: [{ id: "fill_in_at", value: "bottomLeft" }],
    },
    {
      body: "見直しで検索の絞り込みを価値の高い枠へ移す。 どの枠に居るかを状態から取っている。",
      sets: [{ id: "fill_in_at", value: "topLeft" }],
    },
  ],
  [{ id: "fill_in_at", initial: "bottomLeft" }],
);

export const patternBase__presetQuadrant = "簡単";

/**
 * 四象限図の複雑な版 (#2187)。
 *
 * 簡単な版は 4 項目 (各枠に 1 つ) で、動くのは 1 項目が枠を 1 回移るだけ。 実際に読み取りが
 * 要るのは「見直しで何件かが枠を移り、どの枠が厚くなるか」 で、1 項目の 1 回の移動では描けない。
 *
 * 改善の候補 12 件を価値と労力で仕分け、手間の見積りと価値の見積りを分けて直す。
 * **どちらの見積りを直したかで移る向きが変わる** = 手間の見直しは左右に、価値の見直しは
 * 上下に動く。 段を分けておくと、どの見直しが効いたのかが図から読み取れる。
 *
 * **1 つの枠に描かれる項目は 3 つまで**。 4 つ目を置いても 3 つしか描かれず、**消えた 1 件は
 * 何も知らせない** (実測 = 1 枠に 2 / 3 / 4 / 5 件を置いて描いた結果が 2 / 3 / 3 / 3 件、
 * 板は 792x600 のまま、指摘も同じ 1 件)。
 *
 * そのため **どの段でも 4 つの枠を 3 件ずつに保つ**。 動かす時は 2 件を入れ替える。
 * 見直しをしても枠の厚みは変わらず中身だけが入れ替わるので、
 * 「優先度の見直しは総量を減らさない」 ことが図から読み取れる。
 */
const QUADRANT_COMPLEX_ITEMS = [
  { id: "qc_word", title: "文言を直す", quadrant: "topLeft" },
  { id: "qc_speed", title: "読み込みを速く", quadrant: "topLeft" },
  { id: "qc_guide", title: "手引きの更新", quadrant: "{qc_guide_at}" },
  { id: "qc_pay", title: "決済の作り直し", quadrant: "topRight" },
  { id: "qc_search", title: "検索の作り直し", quadrant: "{qc_search_at}" },
  { id: "qc_role", title: "権限の見直し", quadrant: "topRight" },
  { id: "qc_color", title: "色の調整", quadrant: "bottomLeft" },
  { id: "qc_notify", title: "通知の作り直し", quadrant: "bottomLeft" },
  { id: "qc_order", title: "並び順の変更", quadrant: "{qc_order_at}" },
  { id: "qc_device", title: "旧端末の対応", quadrant: "bottomRight" },
  { id: "qc_legacy", title: "古い画面の移行", quadrant: "{qc_legacy_at}" },
  { id: "qc_report", title: "帳票の作り直し", quadrant: "{qc_report_at}" },
] as const;

const quadrantComplexBuilder = quadrant({
  id: "quad-complex-demo",
  topic: "手間と価値の見積りを分けて直し、枠の中身だけが入れ替わる四象限図",
  xAxis: { left: "労力が小さい", right: "労力が大きい" },
  yAxis: { bottom: "価値が低い", top: "価値が高い" },
});
for (const it of QUADRANT_COMPLEX_ITEMS) {
  // 組み立ての段では枠を決め打ちし、状態を読む欄は下の `bindFirstNode` で差し替える
  quadrantComplexBuilder.item({
    id: it.id,
    title: it.title,
    quadrant: it.quadrant.startsWith("{") ? "topLeft" : it.quadrant,
  });
}

export const pattern__presetQuadrant__複雑 = withSteps(
  bindFirstNode(quadrantComplexBuilder.build(), (n) => ({
    ...n,
    quadrantData: n.quadrantData && {
      ...n.quadrantData,
      // `items` は `QUADRANT_COMPLEX_ITEMS` を回す `for` で 1:1 に作るので長さは常に一致する
      items: n.quadrantData.items.map((it, i) => {
        const 元 = QUADRANT_COMPLEX_ITEMS[i];
        return 元 === undefined ? it : { ...it, quadrant: 元.quadrant };
      }),
    },
  })),
  [
    {
      title: "仕分けた直後",
      body: "改善の候補 12 件を 4 つの枠に 3 件ずつ置いた。 すぐやる枠には文言と読み込みと手引きが入る。",
      sets: [
        { id: "qc_guide_at", value: "topLeft" },
        { id: "qc_search_at", value: "topRight" },
        { id: "qc_order_at", value: "bottomLeft" },
        { id: "qc_legacy_at", value: "bottomRight" },
        { id: "qc_report_at", value: "bottomRight" },
      ],
    },
    {
      title: "手間の見積りを直す",
      body: "検索は既にある部品で作れ、手引きは図を全部描き直すと分かる。 上の 2 件が左右に入れ替わる。",
      sets: [
        { id: "qc_search_at", value: "topLeft" },
        { id: "qc_guide_at", value: "topRight" },
      ],
    },
    {
      title: "価値の見積りを直す",
      body: "古い画面は法の改正で急ぐことになり、手引きは問い合わせを減らさないと分かる。 右の 2 件が上下に入れ替わる。",
      sets: [
        { id: "qc_legacy_at", value: "topRight" },
        { id: "qc_guide_at", value: "bottomRight" },
      ],
    },
    {
      body: "並び順は端末ごとの作り分けが要り、帳票は外に頼めると分かる。 3 回見直しても、どの枠も 3 件のまま。",
      sets: [
        { id: "qc_order_at", value: "bottomRight" },
        { id: "qc_report_at", value: "bottomLeft" },
      ],
    },
  ],
  [
    { id: "qc_guide_at", initial: "topLeft" },
    { id: "qc_search_at", initial: "topRight" },
    { id: "qc_order_at", initial: "bottomLeft" },
    { id: "qc_legacy_at", initial: "bottomRight" },
    { id: "qc_report_at", initial: "bottomRight" },
  ],
);

// chart preset (pie) ... 統計チャート
// 扇の大きさを状態から取り、昨年と今年の内訳を同じ図で見る。
const PIE_SLICES = [
  { id: "pie_web", label: "ウェブ", last: 45, now: 30 },
  { id: "pie_mobile", label: "アプリ", last: 35, now: 45 },
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
      body: "ウェブ 45 / アプリ 35 / API 20。",
    },
    {
      body: "今年はアプリが 45 まで伸びる。 扇の大きさを状態から取っている。",
      tweens: PIE_SLICES.map((s) => ({ id: s.id, from: s.last, to: s.now })),
    },
  ],
  PIE_SLICES.map((s) => ({ id: s.id, initial: s.last })),
);

export const patternBase__presetChartPie = "簡単";

/**
 * 円グラフの複雑な版 (#2179)。
 *
 * 簡単な版は 3 区分で、扇が 3 枚しかない。 実際に読み取りが要るのは
 * 「細かい区分が並んでいて、上位と下位が入れ替わる」 形で、3 枚では描けない。
 *
 * **図表は板 1 枚で描くので、区分を増やしても図の大きさが変わらない** (実測 = 6 区分も
 * 8 区分も 9 区分も 792x440 で、指摘は重さを問わず 0 件)。 箱の数で大きさが決まる他の図と
 * 違い、区分を増やす方向に制約が無い。 9 区分を並べ、半年で上位 3 つが入れ替わる様子を見せる。
 *
 * **減る扇と増える扇を同じ段で動かし、どの段でも合計を 100 に保つ** (#2179)。 円グラフは
 * 扇に「その時の合計に対する割合」 を書くので、合計が動くと **触っていない扇の表示まで動く**
 * (実測 = 上の 3 つだけ減らした段で合計が 80 になり、値が 12 のままの支払いが 12% から 15% に
 * 変わった)。 それでは「この種類が増えた」 と「他が減った」 を読み分けられない。
 */
const PIE_COMPLEX_SLICES = [
  { id: "pc_change", label: "注文の変更", before: 22, after: 14 },
  { id: "pc_delivery", label: "配送の問い合わせ", before: 18, after: 11 },
  { id: "pc_return", label: "返品", before: 14, after: 9 },
  { id: "pc_payment", label: "支払い", before: 12, after: 13 },
  { id: "pc_signup", label: "会員登録", before: 10, after: 10 },
  { id: "pc_bug", label: "不具合の報告", before: 8, after: 6 },
  { id: "pc_howto", label: "使い方の質問", before: 7, after: 15 },
  { id: "pc_stock", label: "在庫の確認", before: 5, after: 12 },
  { id: "pc_other", label: "その他", before: 4, after: 10 },
] as const;

const pieComplexBuilder = chart({
  id: "chart-pie-complex-demo",
  topic: "問い合わせの種類ごとの割合が半年で入れ替わる円グラフ",
  type: "pie",
});
for (const s of PIE_COMPLEX_SLICES) {
  pieComplexBuilder.datum({ id: s.id, label: s.label, value: s.before });
}

/**
 * 名前で選んで置き換える。 減る扇と増える扇を同じ段に入れ、その段の増減を釣り合わせる。
 * 動く量が同じなので、動いている途中も合計は 100 のまま保たれる。
 */
const 扇を動かす = (...名前: readonly string[]) =>
  名前.map((名) => {
    const s = PIE_COMPLEX_SLICES.find((x) => x.id === 名);
    if (s === undefined) throw new Error(`${名} は円グラフの複雑な版に無い`);
    return { id: s.id, from: s.before, to: s.after };
  });

export const pattern__presetChartPie__複雑 = withSteps(
  bindFirstNode(pieComplexBuilder.build(), (n) => ({
    ...n,
    // `chartData` は `PIE_COMPLEX_SLICES` を回す `for` で 1:1 に作るので長さは常に一致する
    chartData: n.chartData?.map((c, i) => {
      const s = PIE_COMPLEX_SLICES[i];
      return s === undefined ? c : { ...c, value: `{${s.id}}` };
    }),
  })),
  [
    {
      ids: ["chart-pie-complex-demo-chart"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["chart-pie-complex-demo-chart"],
      // 描く段は伸ばす (#1353)。 9 枚を追うので簡単な版より長く取る
      duration: DRAW_DURATION,
      title: "半年前の内訳",
      body: "注文の変更 22 を先頭に、9 種類が大きい順に並ぶ。 合計は 100。",
    },
    {
      title: "注文の変更が使い方の質問へ移る",
      body: "注文の変更が 22 から 14 へ 8 減り、同じ 8 が使い方の質問に乗って 7 から 15 になる。",
      tweens: 扇を動かす("pc_change", "pc_howto"),
    },
    {
      title: "配送の問い合わせが在庫の確認へ移る",
      body: "配送の問い合わせが 18 から 11 へ 7 減り、同じ 7 が在庫の確認に乗って 5 から 12 になる。",
      tweens: 扇を動かす("pc_delivery", "pc_stock"),
    },
    {
      body: "返品 5 と不具合の報告 2 のぶんが、その他 6 と支払い 1 へ移る。 上位 3 つが入れ替わる。",
      tweens: 扇を動かす("pc_return", "pc_bug", "pc_other", "pc_payment"),
    },
  ],
  PIE_COMPLEX_SLICES.map((s) => ({ id: s.id, initial: s.before })),
);

// chart preset (line) ... 時系列
// 折れ線の高さを状態から取り、計画と実績を同じ図で見る。
const LINE_POINTS = [
  { id: "line_jan", label: "1月", plan: 1000, actual: 900 },
  { id: "line_feb", label: "2月", plan: 1300, actual: 1400 },
  { id: "line_mar", label: "3月", plan: 1100, actual: 1250 },
  { id: "line_apr", label: "4月", plan: 1600, actual: 1750 },
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
      body: "月ごとの見込みを引いた線。 左から順に引かれる。",
    },
    {
      body: "実績に置き換えると 2 月以降が計画を上回る。 点の高さを状態から取っている。",
      tweens: LINE_POINTS.map((p) => ({ id: p.id, from: p.plan, to: p.actual })),
    },
  ],
  LINE_POINTS.map((p) => ({ id: p.id, initial: p.plan })),
);

export const patternBase__presetChartLine = "簡単";

/**
 * 折れ線の複雑な版 (#2177)。
 *
 * 簡単な版は 4 点で、計画と実績が 2 本とも同じ向きに伸びる。 実際に読み取りが要るのは
 * 「一度落ち込んでから追い越す」 形で、4 点では描けない。
 *
 * **図表は板 1 枚で描くので、点を増やしても図の大きさが変わらない** (実測 = 4 点も 12 点も
 * 792x488 で、重い指摘は 0 件)。 箱の数で大きさが決まる他の図と違い、点を増やす方向に
 * 制約が無い。 12 か月ぶんを並べて、四半期ごとに置き換える段を作る。
 */
const LINE_COMPLEX_POINTS = [
  { id: "lc_1", label: "1月", plan: 1000, actual: 1000 },
  { id: "lc_2", label: "2月", plan: 1100, actual: 1120 },
  { id: "lc_3", label: "3月", plan: 1200, actual: 1180 },
  { id: "lc_4", label: "4月", plan: 1300, actual: 1050 },
  { id: "lc_5", label: "5月", plan: 1400, actual: 980 },
  { id: "lc_6", label: "6月", plan: 1500, actual: 1020 },
  { id: "lc_7", label: "7月", plan: 1600, actual: 1180 },
  { id: "lc_8", label: "8月", plan: 1700, actual: 1400 },
  { id: "lc_9", label: "9月", plan: 1800, actual: 1650 },
  { id: "lc_10", label: "10月", plan: 1900, actual: 1880 },
  { id: "lc_11", label: "11月", plan: 2000, actual: 2100 },
  { id: "lc_12", label: "12月", plan: 2100, actual: 2400 },
] as const;

const lineComplexBuilder = chart({
  id: "chart-line-complex-demo",
  topic: "1 年の計画と実績が落ち込んでから追い越す折れ線",
  type: "line",
});
for (const p of LINE_COMPLEX_POINTS) {
  lineComplexBuilder.datum({ id: p.id, label: p.label, value: p.plan });
}

/** 四半期ごとの置き換え。 1 段で動かす点を 3 つに揃える */
const 四半期 = (先頭: number) =>
  LINE_COMPLEX_POINTS.slice(先頭, 先頭 + 3).map((p) => ({ id: p.id, from: p.plan, to: p.actual }));

export const pattern__presetChartLine__複雑 = withSteps(
  bindFirstNode(lineComplexBuilder.build(), (n) => ({
    ...n,
    // `chartData` は `LINE_COMPLEX_POINTS` を回す `for` で 1:1 に作るので長さは常に一致する
    chartData: n.chartData?.map((c, i) => {
      const p = LINE_COMPLEX_POINTS[i];
      return p === undefined ? c : { ...c, value: `{${p.id}}` };
    }),
  })),
  [
    {
      ids: ["chart-line-complex-demo-chart"],
      // 左端から右へ線が伸びる (#1351)。 開いた瞬間に全長で出ると静止画と区別が付かない
      draw: ["chart-line-complex-demo-chart"],
      // 描く段は伸ばす (#1353)。 12 点を追うので簡単な版より更に長く取る
      duration: DRAW_DURATION,
      title: "1 年の計画",
      body: "1 月の 1000 から 12 月の 2100 まで、毎月 100 ずつ積む計画を引く。",
    },
    {
      title: "春は計画どおり",
      body: "1 月から 3 月を実績に置き換える。 3 点とも計画とほぼ重なる。",
      tweens: 四半期(0),
    },
    {
      title: "夏に落ち込む",
      body: "4 月から 6 月で実績が計画を大きく下回る。 5 月の 980 が谷になる。",
      tweens: 四半期(3),
    },
    {
      title: "秋に戻す",
      body: "7 月から 9 月で実績が戻り始める。 9 月の 1650 で差が 150 まで縮む。",
      tweens: 四半期(6),
    },
    {
      body: "10 月から 12 月で実績が計画を追い越す。 12 月の 2400 が計画を 300 上回る。",
      tweens: 四半期(9),
    },
  ],
  LINE_COMPLEX_POINTS.map((p) => ({ id: p.id, initial: p.plan })),
);

// gantt preset ... sprint / release timeline
// 帯の終わりを状態から取り、作り込みが 1 期ぶん延びる様子を見せる。
export const presetGantt = withSteps(
  bindFirstNode(
    gantt({ id: "gantt-demo", topic: "タスクの期間と依存関係を横棒で示す進捗図" })
      .task({ id: "design", title: "設計", start: "Q1", end: "Q1", owner: "デザイナー" })
      .task({
        id: "build",
        title: "実装",
        start: "Q2",
        end: "Q2",
        owner: "開発",
        dependsOn: "design",
      })
      .task({ id: "test", title: "検証", start: "Q3", end: "Q3", owner: "品質保証", dependsOn: "build" })
      .task({ id: "ship", title: "公開", start: "Q4", end: "Q4", owner: "企画", dependsOn: "test" })
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
      body: "実装は Q2 で終わる想定。",
    },
    {
      body: "作り込みが Q3 まで延びる。 帯の終わりを状態から取っている。",
      tweens: [{ id: "build_end", from: 1, to: 2 }],
    },
  ],
  [{ id: "build_end", initial: 1 }],
);

export const patternBase__presetGantt = "簡単";

/**
 * 進捗図の複雑な版 (#2181)。
 *
 * 簡単な版は 4 作業を四半期ごとに 1 つずつ並べた形で、遅れも 1 本の帯が 1 期ぶん延びるだけ。
 * 実際に読み取りが要るのは「1 つの遅れが後ろの作業を次々と押し出す」 形で、4 作業では描けない。
 *
 * **動かすのは帯の終わりだけで、始まりは動かさない**。 目盛りの月名は帯が持つ月名から作られ、
 * **始まりの月名が終わりの月名より強い**。 始まりを状態から動かすと、動いた先の列に古い月名を
 * 置いてしまう (実測 = 外部と繋ぐの始まりを 8 月から 9 月の列へ動かしたら、その列の見出しが
 * 「9月」 から「8月」 に化けた)。 月名そのものを状態から取る書き方も試したが、`{...}` が
 * そのまま文字として出た。
 *
 * そこで **月の数だけ作業を置き、1 つの月に 1 つの始まりを置く**。 どの段でも 6 列ぶんの
 * 見出しが埋まるので、終わりが右隣の列へ伸びても目盛りは崩れない。 簡単な版の 4 作業も
 * 同じ形になっている。
 *
 * **作業は 6 件が上限**。 板の高さは 480 で固定され、月の見出しは常に y=334 に置かれる。
 * 行は 6 件までその上に収まる (最後の行が y=310) が、7 件で y=358 になって見出しより下に出る。
 * 実測で 7 件以上は最後の行が板の外に切れ、月の見出しが図の途中に現れた。
 * **板の大きさは 865x480 のまま変わらないので、数の検査ではこのはみ出しを捕まえられない**。
 */
const GANTT_COMPLEX_TASKS = [
  { id: "gc_hear", title: "要望を聞く", start: "4月", end: "4月", owner: "企画" },
  { id: "gc_design", title: "画面を決める", start: "5月", end: "5月", owner: "デザイナー", dependsOn: "gc_hear" },
  { id: "gc_base", title: "土台を作る", start: "6月", end: "6月", owner: "開発", dependsOn: "gc_design" },
  { id: "gc_screen", title: "画面を作る", start: "7月", end: "7月", owner: "開発", dependsOn: "gc_base" },
  { id: "gc_verify", title: "検証する", start: "8月", end: "8月", owner: "品質保証", dependsOn: "gc_screen" },
  { id: "gc_ship", title: "公開する", start: "9月", end: "9月", owner: "企画", dependsOn: "gc_verify" },
] as const;

const ganttComplexBuilder = gantt({
  id: "gantt-complex-demo",
  topic: "土台の 1 月の遅れが後ろの作業へ次々と波及する進捗図",
});
for (const t of GANTT_COMPLEX_TASKS) ganttComplexBuilder.task({ ...t });

/**
 * 終わりを状態から取る帯。 4 月を 0 とした月の番号で動かす。
 *
 * 動かす帯だけを状態にする。 動かさない帯まで状態にすると、どれが遅れの波及で
 * 動いたのかが定義から読み取れなくなる。
 */
const 遅れる帯 = {
  gc_base: { endIdx: "{gc_base_end}" },
  gc_screen: { endIdx: "{gc_screen_end}" },
  gc_verify: { endIdx: "{gc_verify_end}" },
} as const;

export const pattern__presetGantt__複雑 = withSteps(
  bindFirstNode(ganttComplexBuilder.build(), (n) => ({
    ...n,
    ganttData: n.ganttData?.map((t) => {
      const 差し替え = 遅れる帯[t.id as keyof typeof 遅れる帯];
      return 差し替え === undefined ? t : { ...t, ...差し替え };
    }),
  })),
  [
    {
      ids: ["gantt-complex-demo-gantt"],
      // 起点から描く (#1357)。 開いた瞬間に全部出ると静止画と区別が付かない
      draw: ["gantt-complex-demo-gantt"],
      // 描く段は伸ばす (#1353)。 10 本の帯を追うので簡単な版より長く取る
      duration: DRAW_DURATION,
      title: "当初の計画",
      body: "4 月から 9 月の 6 か月に 6 つの作業を 1 月ずつ置く。 公開は 9 月の予定。",
    },
    {
      title: "土台が1月延びる",
      body: "土台を作るの終わりが 6 月から 7 月へ動く。 帯が右へ 1 つぶん伸びて画面を作る月に重なる。",
      tweens: [{ id: "gc_base_end", from: 2, to: 3 }],
    },
    {
      title: "画面を作るも延びる",
      body: "土台の後ろなので、終わりが 7 月から 8 月へ動く。 要望を聞くと画面を決めるは前なので動かない。",
      tweens: [{ id: "gc_screen_end", from: 3, to: 4 }],
    },
    {
      body: "検証の終わりが 8 月から 9 月へ届き、公開の月に重なる。 1 つの遅れが 3 本の帯を伸ばした。",
      tweens: [{ id: "gc_verify_end", from: 4, to: 5 }],
    },
  ],
  [
    { id: "gc_base_end", initial: 2 },
    { id: "gc_screen_end", initial: 3 },
    { id: "gc_verify_end", initial: 4 },
  ],
);

// flowchart preset ... swimlane + decision
export const presetFlowchart = withSteps(
  flowchart({
    id: "flowchart-demo",
    topic: "分岐や判定を含む処理の流れを示す図",
    lanes: ["申請者", "承認者"],
  })
    .node({ id: "submit", title: "申請を出す", shape: "start", lane: "申請者" })
    .node({ id: "review", title: "審査", shape: "decision", lane: "承認者" })
    .node({ id: "approve", title: "承認", shape: "end", lane: "承認者" })
    .node({ id: "revise", title: "直して出し直す", shape: "process", lane: "申請者" })
    .edge({ from: "submit", to: "review" })
    .edge({ from: "review", to: "approve", label: "はい", tone: "success" })
    .edge({ from: "review", to: "revise", label: "いいえ", tone: "warning" })
    .build(),
  [
    { ids: ["submit"], title: "1. 申請を出す", body: "申請者が申請を出す。" },
    { ids: ["review", "fc-0-submit-review"], title: "2. 審査", body: "承認者が審査して判断する。" },
    {
      ids: ["approve", "fc-1-review-approve"],
      title: "3. はいなら承認",
      body: "承認して終わる枝。",
    },
    { ids: ["revise", "fc-2-review-revise"], body: "いいえなら申請者に差し戻し、直して出し直す。" },
  ],
);

/** 簡単な版と複雑な版は、1 つの見本の中のパターンで切り替える (#1960) */
export const patternBase__presetFlowchart = "簡単";

// 流れ図の複雑な版 (#2143)。 経費の申請から振込までを 8 箱で追う。
//
// 簡単な版に無い形と筋を入れる = 繰り返し (`loop`) / 判断を 2 つ続ける / 2 つの道が照合で合流する /
// 差し戻して最初の申請に戻る線 / 終わり方が 2 つ (振込と却下)。
//
// 組み立て器は段を選べず、縦列ごとに宣言した順に上から積む。 下書きで 3 通り組み、金額の判断を
// 照合の後に置く形は上長から振込への線が関係の無い箱 2 つを貫いたので、金額で先に道を分ける。
//
//   段   申請者                  経理                    上長
//   0    領収書を添えて申請する  10 万円を超えるか        上長が認めるか
//   1    直して出し直す          明細を 1 行ずつ見る      却下を知らせる
//   2                            領収書と金額が合うか
//   3                            次の給与日に振り込む
export const pattern__presetFlowchart__複雑 = withSteps(
  flowchart({
    id: "flowchart-complex-demo",
    topic: "経費の申請を金額と領収書で分けて振込まで追う流れ図",
    lanes: ["申請者", "経理", "上長"],
  })
    .node({ id: "submit", title: "領収書を添えて申請する", shape: "start", lane: "申請者" })
    .node({ id: "fix", title: "直して出し直す", shape: "process", lane: "申請者" })
    .node({ id: "amount", title: "10 万円を超えるか", shape: "decision", lane: "経理" })
    .node({ id: "lines", title: "明細を 1 行ずつ見る", shape: "loop", lane: "経理" })
    .node({ id: "check", title: "領収書と金額が合うか", shape: "decision", lane: "経理" })
    .node({ id: "pay", title: "次の給与日に振り込む", shape: "end", lane: "経理" })
    .node({ id: "boss", title: "上長が認めるか", shape: "decision", lane: "上長" })
    .node({ id: "reject", title: "却下を知らせる", shape: "end", lane: "上長" })
    .edge({ from: "submit", to: "amount" })
    .edge({ from: "amount", to: "boss", label: "はい", tone: "warning" })
    .edge({ from: "amount", to: "lines", label: "いいえ", tone: "success" })
    .edge({ from: "boss", to: "lines", label: "はい", tone: "success" })
    .edge({ from: "boss", to: "reject", label: "いいえ", tone: "error" })
    .edge({ from: "lines", to: "check" })
    .edge({ from: "check", to: "fix", label: "いいえ", tone: "warning" })
    .edge({ from: "fix", to: "submit", label: "出し直す" })
    .edge({ from: "check", to: "pay", label: "はい", tone: "success" })
    .build(),
  [
    {
      ids: ["submit"],
      title: "1. 領収書を添えて申請する",
      body: "申請者が領収書を添えて経費を申請する。 流れはここから始まり、振込か却下のどちらかで終わる。",
    },
    {
      ids: ["amount", "fc-0-submit-amount"],
      title: "2. 金額で道を分ける",
      body: "経理は最初に、合計が 10 万円を超えるかを見る。 超えない申請は上長を通さずに照合へ進む。",
    },
    {
      ids: ["boss", "fc-1-amount-boss"],
      title: "3. 高い申請は上長に回す",
      body: "10 万円を超える申請だけ、上長が認めるかを判断する。 判断が 2 つ続く道になる。",
    },
    {
      ids: ["reject", "fc-4-boss-reject"],
      title: "4. 認めなければ却下で終える",
      body: "上長が認めない申請は、却下を知らせて終わる。 この流れの 1 つ目の終わり方。",
    },
    {
      ids: ["lines", "fc-2-amount-lines", "fc-3-boss-lines"],
      title: "5. 2 つの道が照合で合流する",
      body: "10 万円以下の申請と、上長が認めた申請が同じ照合に入る。 経理は明細を 1 行ずつ、最後の行まで繰り返し見る。",
    },
    {
      ids: ["check", "fc-5-lines-check"],
      title: "6. 領収書と金額が合うかを判断する",
      body: "全ての行を見終えたら、領収書と金額が合うかを判断する。",
    },
    {
      ids: ["fix", "fc-6-check-fix", "fc-7-fix-submit"],
      title: "7. 合わなければ差し戻す",
      body: "合わない申請は申請者に戻る。 申請者が直して出し直すと、最初の申請へ戻ってもう一度流れる。",
    },
    {
      ids: ["pay", "fc-8-check-pay"],
      body: "合う申請は次の給与日に振り込んで終わる。 この流れの 2 つ目の終わり方。",
    },
  ],
);

// network preset ... NW topology
export const presetNetwork = withSteps(
  network({ id: "network-demo", topic: "ネットワーク機器とセグメントの接続関係を示す図" })
    .device({ id: "fw", title: "外部との境界", kind: "firewall", col: 0, row: 0, segment: "DMZ" })
    .device({ id: "sw1", title: "スイッチ A", kind: "switch", col: 1, row: 0, segment: "LAN" })
    .device({ id: "srv", title: "アプリのサーバー", kind: "server", col: 2, row: 0 })
    .device({ id: "db", title: "DB のサーバー", kind: "server", col: 2, row: 1 })
    .link({ from: "fw", to: "sw1", protocol: "VLAN 10" })
    .link({ from: "sw1", to: "srv", protocol: "TCP 22" })
    .link({ from: "sw1", to: "db", protocol: "TCP 5432" })
    .build(),
  [
    { ids: ["fw"], title: "1. 外部との境界", body: "DMZ の入口。" },
    { ids: ["sw1", "nl-0-fw-sw1"], title: "2. スイッチ A", body: "VLAN 10 で LAN に流す。" },
    { ids: ["srv", "nl-1-sw1-srv"], title: "3. アプリのサーバー", body: "TCP 22 で繋がる。" },
    { ids: ["db", "nl-2-sw1-db"], body: "DB のサーバーへは TCP 5432 で繋がる。" },
  ],
);

/**
 * 簡単な版と複雑な版は、1 つの見本の中のパターンで切り替える (#1960)。
 * 一覧の別の行にすると、同じ種類の図の規模違いを見比べるのに行を選び直すことになる
 */
export const patternBase__presetNetwork = "簡単";

/**
 * ネットワーク図の複雑な版 (#2165)。
 *
 * 簡単な版は 境界 → 交換機 → サーバー 2 台の 1 本道で、**二重にした経路が 1 つも無い**。
 * 実物は回線も壁も交換機も 2 つ用意し、片方が落ちても通るように組む。
 * 同じ役目を 2 台並べ、その間を横に結ぶ書き方をここで見せる。
 *
 * **列を役目で分け、線は縦か横の隣どうしだけで結ぶ** (#2163)。 斜めに結ぶと間の箱を貫く。
 * 0 列が外の回線、1 列が境の壁、2 列が交換機、3 列がサーバーと端末になる。
 *
 * **図の幅は列の数だけで決まる**。 縦列の幅 (`laneWidth`) を 260 / 200 に下げても、
 * 機器の題を 3 字に縮めても 4 列なら 2389 のまま (実測)。 そのため器の倍率の指摘は
 * 受け入れ一覧に足している (拡大 10.6px / 一覧 8.0px)。
 */
const networkComplex = network({
  id: "network-complex-demo",
  topic: "回線と壁と交換機を二重にした事務所のネットワーク",
})
  .device({ id: "line1", title: "外の回線 A", kind: "router", col: 0, row: 0, segment: "外" })
  .device({ id: "line2", title: "外の回線 B", kind: "router", col: 0, row: 1, segment: "外" })
  .device({ id: "fw1", title: "境の壁 A", kind: "firewall", col: 1, row: 0, segment: "DMZ" })
  .device({ id: "fw2", title: "境の壁 B", kind: "firewall", col: 1, row: 1, segment: "DMZ" })
  .device({ id: "core1", title: "中心の交換機 A", kind: "switch", col: 2, row: 0, segment: "LAN" })
  .device({ id: "core2", title: "中心の交換機 B", kind: "switch", col: 2, row: 1, segment: "LAN" })
  .device({ id: "mgmt", title: "管理の交換機", kind: "switch", col: 2, row: 2, segment: "管理" })
  // 区画の名前に機器の種別と同じ語を置かない。 肩の字が「サーバー / サーバー」 と重なる (画面で確認)
  .device({ id: "app", title: "仕事のサーバー", kind: "server", col: 3, row: 0, segment: "仕事" })
  .device({ id: "db", title: "台帳のサーバー", kind: "server", col: 3, row: 1, segment: "仕事" })
  .device({ id: "desk", title: "事務所の端末", kind: "client", col: 3, row: 2, segment: "管理" })
  .link({ from: "line1", to: "fw1", protocol: "光 1G" })
  .link({ from: "line2", to: "fw2", protocol: "光 1G" })
  // 同じ役目の 2 台を横に結ぶ線。 片方が落ちたことを互いに見張る
  .link({ from: "fw1", to: "fw2", protocol: "生死を見る", tone: "warning" })
  .link({ from: "fw1", to: "core1", protocol: "VLAN 10" })
  .link({ from: "fw2", to: "core2", protocol: "VLAN 10" })
  .link({ from: "core1", to: "core2", protocol: "2 本を束ねる" })
  .link({ from: "core2", to: "mgmt", protocol: "VLAN 99" })
  .link({ from: "core1", to: "app", protocol: "TCP 443" })
  .link({ from: "core2", to: "db", protocol: "TCP 5432" })
  .link({ from: "mgmt", to: "desk", protocol: "TCP 22" })
  .link({ from: "app", to: "db", protocol: "読み書き" })
  .build();

export const pattern__presetNetwork__複雑 = withSteps(networkComplex, [
  {
    ids: ["line1", "line2"],
    title: "1. 外の回線を 2 本引く",
    body: "同じ役目の機器を 2 台並べる。 片方が落ちても残る形の出発点。",
  },
  {
    ids: ["fw1", "fw2", "nl-0-line1-fw1", "nl-1-line2-fw2"],
    title: "2. 境の壁で受ける",
    body: "回線 1 本に壁 1 台を割り当てる。 区画の名前が箱の肩に出る。",
  },
  {
    ids: ["nl-2-fw1-fw2"],
    title: "3. 壁どうしで生死を見る",
    body: "同じ役目の 2 台を横に結ぶ線。 色を変えて中の道と見分ける。",
  },
  {
    ids: ["core1", "core2", "nl-3-fw1-core1", "nl-4-fw2-core2"],
    title: "4. 中心の交換機へ渡す",
    body: "壁から中へ入る 2 本。 札に書いた区画の番号がどちらも同じ。",
  },
  {
    ids: ["nl-5-core1-core2"],
    title: "5. 交換機 2 台を束ねる",
    body: "2 本の線を 1 本として扱う繋ぎ方。 どちらの壁から来ても両方へ届く。",
  },
  {
    ids: ["app", "db", "nl-7-core1-app", "nl-8-core2-db"],
    title: "6. サーバーを 2 台ぶら下げる",
    body: "交換機 1 台にサーバー 1 台。 札は使う口の番号。",
  },
  {
    ids: ["nl-10-app-db"],
    title: "7. サーバーどうしが読み書きする",
    body: "外を通らずに中だけで繋がる線。 区画が同じなので壁を越えない。",
  },
  {
    ids: ["mgmt", "desk", "nl-6-core2-mgmt", "nl-9-mgmt-desk"],
    title: "8. 手入れの道を分ける",
    body: "管理の区画は仕事の道と別に置く。 事務所の端末はここからだけ入る。",
  },
]);

// stateMachine2 preset ... 拡張 FSM (nested + action)
// 箱の既定幅 320 のままだと 4 状態を横に並べた図が幅 2439 world / 縦横比 6.04 になり、
// 親幅に収めた時に帯状に潰れて中身が読めない。 状態の幅を 280 に絞って 5.64 に収める
// (280 は題名と入る時・出る時の処理が切れない幅に余裕を持たせた値、 cdl#357)。
export const presetStateMachine2 = withSteps(
  stateMachine2({
    id: "sm2-demo",
    topic: "階層状態や遷移の処理を持つ入れ子の状態遷移図",
    stateWidth: 280,
  })
    .state({ id: "idle", title: "待機", initial: true, entry: "入力を空にする" })
    .state({ id: "active", title: "処理中" })
    .state({
      id: "loading",
      title: "読み込み",
      parent: "active",
      entry: "印を出す",
      exit: "印を消す",
    })
    .state({ id: "done", title: "完了", final: true })
    .transition({ from: "idle", to: "loading", trigger: "送信", action: "入力を確かめる" })
    .transition({ from: "loading", to: "done", trigger: "成功", tone: "success" })
    .build(),
  [
    { ids: ["idle"], title: "1. 待機", body: "入力を空にして待つ。" },
    {
      ids: ["active", "loading", "sm2-0-idle-loading"],
      title: "2. 処理中の中の読み込み",
      body: "送信で入れ子の状態に入る。",
    },
    { ids: ["done", "sm2-1-loading-done"], body: "成功で完了に移る。" },
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
  - ブラウザ: { subtitle: "画面" }
  - API: { subtitle: "受付" }
  - DB: { subtitle: "台帳" }
  - キュー: { subtitle: "待ち行列" }

# 動いている間の帯。 台帳は途中で手が空くので区間が 2 つに分かれる
bands:
  - ブラウザ: 0..5
  - API: 0..5
  - DB: 1..2
  - DB: 6..6
  - キュー: 4..6

# kind を書くと線と矢の形がまとめて決まる
flow:
  - ブラウザ -> API: "注文を出す" { kind: call }
  - API -> DB: "在庫を押さえる" { kind: call }
  - DB -> API: "押さえた" { kind: return }
  - API -> API: "控えを書く" { kind: call }
  - API -> キュー: "発送を頼む" { kind: fire }
  - API -> ブラウザ: "受け付けた" { kind: return }
  - キュー -> DB: "引当を確定" { kind: call }

animation:
  - step: "1. 注文を出す" 0.9s
    focus: ["ブラウザ -> API"]
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
    focus: ["API -> キュー"]
    badge: "sequence"
    body: "実線に開いた矢。 矢を閉じないことで返事を待たないと示す。"
  - step: "6. 受け付けた" 0.9s
    focus: ["API -> ブラウザ"]
    badge: "sequence"
    body: "待ち行列の返事を待たずに画面へ返す。"
  - step: "時系列のやり取りを縦の時間軸で並べる図" 0.9s
    focus: ["キュー -> DB"]
    badge: "sequence"
    body: "台帳は途中で手が空く。 帯が途切れることでそれと判る。"
`;

export const sourceJson__presetSequence = `{
  "title": "時系列のやり取りを縦の時間軸で並べる図",
  "type": "sequence",
  "actors": [{"name": "ブラウザ", "subtitle": "画面"}, {"name": "API", "subtitle": "受付"}, {"name": "DB", "subtitle": "台帳"}, {"name": "キュー", "subtitle": "待ち行列"}],
  "bands": [{"actor": "ブラウザ", "from": 0, "to": 5}, {"actor": "API", "from": 0, "to": 5}, {"actor": "DB", "from": 1, "to": 2}, {"actor": "DB", "from": 6, "to": 6}, {"actor": "キュー", "from": 4, "to": 6}],
  "flow": [
    { "from": "ブラウザ", "to": "API", "label": "注文を出す", "kind": "call" },
    { "from": "API", "to": "DB", "label": "在庫を押さえる", "kind": "call" },
    { "from": "DB", "to": "API", "label": "押さえた", "kind": "return" },
    { "from": "API", "to": "API", "label": "控えを書く", "kind": "call" },
    { "from": "API", "to": "キュー", "label": "発送を頼む", "kind": "fire" },
    { "from": "API", "to": "ブラウザ", "label": "受け付けた", "kind": "return" },
    { "from": "キュー", "to": "DB", "label": "引当を確定", "kind": "call" }
  ],
  "animation": [
    {
      "step": "1. 注文を出す",
      "duration": 0.9,
      "focus": ["ブラウザ -> API"],
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
      "focus": ["API -> キュー"],
      "body": "実線に開いた矢。 矢を閉じないことで返事を待たないと示す。",
      "badge": "sequence"
    },
    {
      "step": "6. 受け付けた",
      "duration": 0.9,
      "focus": ["API -> ブラウザ"],
      "body": "待ち行列の返事を待たずに画面へ返す。",
      "badge": "sequence"
    },
    {
      "step": "時系列のやり取りを縦の時間軸で並べる図",
      "duration": 0.9,
      "focus": ["キュー -> DB"],
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
  - step: "2. 注文する" 0.9s
    focus: [users, orders, "users -> orders"]
    badge: "er"
    body: "破線は識別しない関係。 1 人の利用者が 0 件以上の注文をする。"
  - step: "3. 明細を持つ" 0.9s
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
      "step": "2. 注文する",
      "duration": 0.9,
      "focus": ["users", "orders", "users -> orders"],
      "body": "破線は識別しない関係。 1 人の利用者が 0 件以上の注文をする。",
      "badge": "er"
    },
    {
      "step": "3. 明細を持つ",
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

export const sourceYaml__pattern__presetEr__複雑 = `title: "商取引の表と必須・任意の関係を表す ER 図"
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
  - users -> addresses: "登録する" (info, dashed) { tailHead: one, head: zero-many }
  - users -> orders: "注文する" (info, solid) { tailHead: one, head: many }
  - users -> user_roles: "役割を持つ" (info, solid) { tailHead: one, head: many }
  - roles -> user_roles: "割り当てる" (info, solid) { tailHead: one, head: many }
  - orders -> order_items: "含む" (info, solid) { tailHead: one, head: many }
  - orders -> payments: "支払う" (info, dashed) { tailHead: one, head: zero-one }
  - orders -> shipments: "発送する" (info, dashed) { tailHead: one, head: zero-one }
  - addresses -> shipments: "届け先" (info, dashed) { tailHead: one, head: zero-many }
  - addresses -> orders: "請求先" (info, dashed) { tailHead: one, head: zero-many }
  - products -> order_items: "注文される" (info, solid) { tailHead: one, head: many }
  - products -> inventory: "在庫を持つ" (info, solid) { tailHead: one, head: one }
  - products -> product_categories: "属する" (info, solid) { tailHead: one, head: many }
  - categories -> product_categories: "商品を含む" (info, solid) { tailHead: one, head: many }
  - categories -> categories: "下位分類を持つ" (info, dashed) { tailHead: one, head: zero-many }

animation:
  - step: "1. 利用者が注文する" 0.9s
    focus: [users, orders, "users -> orders"]
    badge: "er"
    body: "1 人の利用者が 1 件以上の注文をする。 端の棒と鳥の足で数を読む。"
  - step: "2. 明細に商品が並ぶ" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items"]
    badge: "er"
    body: "実線は識別する関係。 親の鍵が子の鍵に入る。"
  - step: "3. 在庫を持つ" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory"]
    badge: "er"
    body: "端が両方とも棒。 1 対 1 で、どちらも欠けない。"
  - step: "4. 商品を分類する" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory", categories, product_categories, "products -> product_categories", "categories -> product_categories"]
    badge: "er"
    body: "2 つの鍵を持つ中継表が、商品と分類の多対多を作る。"
  - step: "5. 分類の親子" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory", categories, product_categories, "products -> product_categories", "categories -> product_categories", roles, "categories -> categories"]
    badge: "er"
    body: "破線で同じ表へ戻る。 親を持たない最上位の分類もある。"
  - step: "6. 役割を割り当てる" 0.9s
    focus: [users, orders, "users -> orders", order_items, products, "orders -> order_items", "products -> order_items", inventory, "products -> inventory", categories, product_categories, "products -> product_categories", "categories -> product_categories", roles, "categories -> categories", user_roles, "users -> user_roles", "roles -> user_roles"]
    badge: "er"
    body: "利用者と役割も中継表越し。 2 つの鍵がそのまま主キーになる。"
  - step: "7. 住所を登録する" 0.9s
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

export const sourceJson__pattern__presetEr__複雑 = JSON.stringify(
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
      { from: "users", to: "addresses", label: "登録する", tone: "info", style: "dashed", tailHead: "one", head: "zero-many" },
      { from: "users", to: "orders", label: "注文する", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "users", to: "user_roles", label: "役割を持つ", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "roles", to: "user_roles", label: "割り当てる", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "orders", to: "order_items", label: "含む", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "orders", to: "payments", label: "支払う", tone: "info", style: "dashed", tailHead: "one", head: "zero-one" },
      { from: "orders", to: "shipments", label: "発送する", tone: "info", style: "dashed", tailHead: "one", head: "zero-one" },
      { from: "addresses", to: "shipments", label: "届け先", tone: "info", style: "dashed", tailHead: "one", head: "zero-many" },
      { from: "addresses", to: "orders", label: "請求先", tone: "info", style: "dashed", tailHead: "one", head: "zero-many" },
      { from: "products", to: "order_items", label: "注文される", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "products", to: "inventory", label: "在庫を持つ", tone: "info", style: "solid", tailHead: "one", head: "one" },
      { from: "products", to: "product_categories", label: "属する", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "categories", to: "product_categories", label: "商品を含む", tone: "info", style: "solid", tailHead: "one", head: "many" },
      { from: "categories", to: "categories", label: "下位分類を持つ", tone: "info", style: "dashed", tailHead: "one", head: "zero-many" },
    ],
    animation: [
      { step: "1. 利用者が注文する", duration: 0.9, focus: ["users", "orders", "users -> orders"], badge: "er", body: "1 人の利用者が 1 件以上の注文をする。 端の棒と鳥の足で数を読む。" },
      { step: "2. 明細に商品が並ぶ", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items"], badge: "er", body: "実線は識別する関係。 親の鍵が子の鍵に入る。" },
      { step: "3. 在庫を持つ", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory"], badge: "er", body: "端が両方とも棒。 1 対 1 で、どちらも欠けない。" },
      { step: "4. 商品を分類する", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory", "categories", "product_categories", "products -> product_categories", "categories -> product_categories"], badge: "er", body: "2 つの鍵を持つ中継表が、商品と分類の多対多を作る。" },
      { step: "5. 分類の親子", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory", "categories", "product_categories", "products -> product_categories", "categories -> product_categories", "roles", "categories -> categories"], badge: "er", body: "破線で同じ表へ戻る。 親を持たない最上位の分類もある。" },
      { step: "6. 役割を割り当てる", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory", "categories", "product_categories", "products -> product_categories", "categories -> product_categories", "roles", "categories -> categories", "user_roles", "users -> user_roles", "roles -> user_roles"], badge: "er", body: "利用者と役割も中継表越し。 2 つの鍵がそのまま主キーになる。" },
      { step: "7. 住所を登録する", duration: 0.9, focus: ["users", "orders", "users -> orders", "order_items", "products", "orders -> order_items", "products -> order_items", "inventory", "products -> inventory", "categories", "product_categories", "products -> product_categories", "categories -> product_categories", "roles", "categories -> categories", "user_roles", "users -> user_roles", "roles -> user_roles", "addresses", "users -> addresses"], badge: "er", body: "破線は識別しない関係。 丸い端が 0 件を許す。" },
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
  main: { label: "ログインの流れ" }
actors:
  - 利用者: { kind: person, eyebrow: "人" }
  - POST /login: { kind: api, eyebrow: "API" }
  - 認証サービス: { kind: service, eyebrow: "サービス" }
  - 利用者の表: { kind: database, eyebrow: "DB" }
flow:
  - 利用者 -> POST /login: "ログイン要求" (teal, dotted-flow)
  - POST /login -> 認証サービス: "認証処理" (teal, dotted-flow)
  - 認証サービス -> 利用者の表: "パスワードの照合" (teal, dotted-flow)
animation:
  - step: "1. 利用者" 0.9s
    badge: "flow"
    focus: [利用者]
    body: "ログインしようとする人から始まる。"
  - step: "2. POST /login" 0.9s
    badge: "flow"
    focus: [利用者, "POST /login", "利用者 -> POST /login"]
    body: "ログイン要求を受け取る。"
  - step: "3. 認証サービス" 0.9s
    badge: "flow"
    focus: [利用者, "POST /login", 認証サービス, "利用者 -> POST /login", "POST /login -> 認証サービス"]
    body: "認証の処理に渡す。"
  - step: "処理の順番を上から下へ 1 本の流れで示す図" 0.9s
    badge: "flow"
    focus: [利用者, "POST /login", 認証サービス, "利用者の表", "利用者 -> POST /login", "POST /login -> 認証サービス", "認証サービス -> 利用者の表"]
    body: "認証サービスが利用者の表でパスワードを照合する。"
`;

export const sourceJson__presetFlow = `{
  "title": "処理の順番を上から下へ 1 本の流れで示す図",
  "type": "flow",
  "lanes": { "main": {"label": "ログインの流れ"} },
  "actors": [
    { "name": "利用者", "kind": "person", "eyebrow": "人" },
    { "name": "POST /login", "kind": "api", "eyebrow": "API" },
    { "name": "認証サービス", "kind": "service", "eyebrow": "サービス" },
    { "name": "利用者の表", "kind": "database", "eyebrow": "DB" }
  ],
  "flow": [
    {
      "from": "利用者",
      "to": "POST /login",
      "label": "ログイン要求",
      "tone": "teal",
      "style": "dotted-flow"
    },
    {
      "from": "POST /login",
      "to": "認証サービス",
      "label": "認証処理",
      "tone": "teal",
      "style": "dotted-flow"
    },
    {
      "from": "認証サービス",
      "to": "利用者の表",
      "label": "パスワードの照合",
      "tone": "teal",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "1. 利用者",
      "duration": 0.9,
      "focus": ["利用者"],
      "body": "ログインしようとする人から始まる。",
      "badge": "flow"
    },
    {
      "step": "2. POST /login",
      "duration": 0.9,
      "focus": ["利用者", "POST /login", "利用者 -> POST /login"],
      "body": "ログイン要求を受け取る。",
      "badge": "flow"
    },
    {
      "step": "3. 認証サービス",
      "duration": 0.9,
      "focus": [
        "利用者",
        "POST /login",
        "認証サービス",
        "利用者 -> POST /login",
        "POST /login -> 認証サービス"
      ],
      "body": "認証の処理に渡す。",
      "badge": "flow"
    },
    {
      "step": "処理の順番を上から下へ 1 本の流れで示す図",
      "duration": 0.9,
      "focus": [
        "利用者",
        "POST /login",
        "認証サービス",
        "利用者の表",
        "利用者 -> POST /login",
        "POST /login -> 認証サービス",
        "認証サービス -> 利用者の表"
      ],
      "body": "認証サービスが利用者の表でパスワードを照合する。",
      "badge": "flow"
    }
  ]
}`;

export const sourceYaml__presetChartPie = `title: "全体に対する内訳の割合を示す円グラフ"
eyebrow: "pie"
type: pie

actors:
  - ウェブ: "{pie_web}"
  - アプリ: "{pie_mobile}"
  - API: "{pie_api}"

states:
  pie_web: 45
  pie_mobile: 35
  pie_api: 20

animation:
  - step: "昨年の内訳" 2.4s
    badge: "pie"
    focus: [ウェブ, アプリ, API]
    draw: pie
    body: "ウェブ 45 / アプリ 35 / API 20。"
  - step: "全体に対する内訳の割合を示す円グラフ" 0.9s
    badge: "pie"
    focus: [ウェブ, アプリ, API]
    tween:
      pie_web: 45 -> 30
      pie_mobile: 35 -> 45
      pie_api: 20 -> 25
    body: "今年はアプリが 45 まで伸びる。 扇の大きさを状態から取っている。"
`;

export const sourceJson__presetChartPie = `{
  "title": "全体に対する内訳の割合を示す円グラフ",
  "type": "pie",
  "eyebrow": "pie",
  "actors": [
    { "name": "ウェブ", "subtitle": "{pie_web}" },
    { "name": "アプリ", "subtitle": "{pie_mobile}" },
    { "name": "API", "subtitle": "{pie_api}" }
  ],
  "flow": [],
  "states": { "pie_web": 45, "pie_mobile": 35, "pie_api": 20 },
  "animation": [
    {
      "step": "昨年の内訳",
      "duration": 2.4,
      "focus": ["ウェブ", "アプリ", "API"],
      "draw": "pie",
      "body": "ウェブ 45 / アプリ 35 / API 20。",
      "badge": "pie"
    },
    {
      "step": "全体に対する内訳の割合を示す円グラフ",
      "duration": 0.9,
      "focus": ["ウェブ", "アプリ", "API"],
      "body": "今年はアプリが 45 まで伸びる。 扇の大きさを状態から取っている。",
      "badge": "pie",
      "tween": { "pie_web": [45, 30], "pie_mobile": [35, 45], "pie_api": [20, 25] }
    }
  ]
}`;

export const sourceYaml__presetChartLine = `title: "時系列データの推移を線で示す折れ線グラフ"
eyebrow: "line"
type: line

actors:
  - 1月: "{line_jan}"
  - 2月: "{line_feb}"
  - 3月: "{line_mar}"
  - 4月: "{line_apr}"

states:
  line_jan: 1000
  line_feb: 1300
  line_mar: 1100
  line_apr: 1600

animation:
  - step: "計画" 2.4s
    badge: "line"
    focus: [1月, 2月, 3月, 4月]
    draw: line
    body: "月ごとの見込みを引いた線。 左から順に引かれる。"
  - step: "時系列データの推移を線で示す折れ線グラフ" 0.9s
    badge: "line"
    focus: [1月, 2月, 3月, 4月]
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
    { "name": "1月", "subtitle": "{line_jan}" },
    { "name": "2月", "subtitle": "{line_feb}" },
    { "name": "3月", "subtitle": "{line_mar}" },
    { "name": "4月", "subtitle": "{line_apr}" }
  ],
  "flow": [],
  "states": { "line_jan": 1000, "line_feb": 1300, "line_mar": 1100, "line_apr": 1600 },
  "animation": [
    {
      "step": "計画",
      "duration": 2.4,
      "focus": ["1月", "2月", "3月", "4月"],
      "draw": "line",
      "body": "月ごとの見込みを引いた線。 左から順に引かれる。",
      "badge": "line"
    },
    {
      "step": "時系列データの推移を線で示す折れ線グラフ",
      "duration": 0.9,
      "focus": ["1月", "2月", "3月", "4月"],
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
  - 訪問: "{visit}"
  - 登録: "{signup}"
  - 試用: "{trial}"
  - 有料: "{paid}"

states:
  visit: 8200
  signup: 1100
  trial: 520
  paid: 130

animation:
  - step: "先月" 2.4s
    badge: "funnel"
    focus: [訪問, 登録, 試用, 有料]
    draw: funnel
    body: "訪問 8200 から有料 130 まで絞られる。"
  - step: "各段階での離脱率を示す絞込みの図" 0.9s
    badge: "funnel"
    focus: [訪問, 登録, 試用, 有料]
    tween:
      visit: 8200 -> 10000
      signup: 1100 -> 1500
      trial: 520 -> 800
      paid: 130 -> 200
    body: "今月は訪問 10000 / 有料 200。 段の人数を状態から取るので、同じ図が別の月を映す。"
`;

export const sourceJson__presetFunnel = `{
  "title": "各段階での離脱率を示す絞込みの図",
  "type": "funnel",
  "eyebrow": "funnel",
  "lanes": { "chart": {"width": 624} },
  "actors": [
    { "name": "訪問", "subtitle": "{visit}" },
    { "name": "登録", "subtitle": "{signup}" },
    { "name": "試用", "subtitle": "{trial}" },
    { "name": "有料", "subtitle": "{paid}" }
  ],
  "flow": [],
  "states": { "visit": 8200, "signup": 1100, "trial": 520, "paid": 130 },
  "animation": [
    {
      "step": "先月",
      "duration": 2.4,
      "focus": ["訪問", "登録", "試用", "有料"],
      "draw": "funnel",
      "body": "訪問 8200 から有料 130 まで絞られる。",
      "badge": "funnel"
    },
    {
      "step": "各段階での離脱率を示す絞込みの図",
      "duration": 0.9,
      "focus": ["訪問", "登録", "試用", "有料"],
      "body": "今月は訪問 10000 / 有料 200。 段の人数を状態から取るので、同じ図が別の月を映す。",
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
  - 社長
  - 技術責任者
  - 財務責任者
  - "{eng}"
  - 運用部長

states:
  eng: "開発部長"

flow:
  - 社長 -> 技術責任者: ""
  - 社長 -> 財務責任者: ""
  - 技術責任者 -> "{eng}": ""
  - 技術責任者 -> 運用部長: ""

animation:
  - step: "組織を作った時" 2.4s
    badge: "tree"
    focus: [社長, 技術責任者, 財務責任者, "{eng}", 運用部長]
    draw: tree
    body: "開発の責任者を開発部長と呼んでいる。"
  - step: "親子関係を縦階層で示す組織図・木構造" 0.9s
    badge: "tree"
    focus: [社長, 技術責任者, 財務責任者, "{eng}", 運用部長]
    set:
      eng: "開発本部長"
    body: "呼び方だけが変わり、繋がりはそのまま。 名前を状態から取っている。"
`;

export const sourceJson__presetTree = `{
  "title": "親子関係を縦階層で示す組織図・木構造",
  "type": "tree",
  "eyebrow": "tree",
  "lanes": { "chart": {"width": 720} },
  "actors": [
    { "name": "社長" },
    { "name": "技術責任者" },
    { "name": "財務責任者" },
    { "name": "{eng}" },
    { "name": "運用部長" }
  ],
  "flow": [
    { "from": "社長", "to": "技術責任者", "label": "" },
    { "from": "社長", "to": "財務責任者", "label": "" },
    { "from": "技術責任者", "to": "{eng}", "label": "" },
    { "from": "技術責任者", "to": "運用部長", "label": "" }
  ],
  "states": { "eng": "開発部長" },
  "animation": [
    {
      "step": "組織を作った時",
      "duration": 2.4,
      "focus": ["社長", "技術責任者", "財務責任者", "{eng}", "運用部長"],
      "draw": "tree",
      "body": "開発の責任者を開発部長と呼んでいる。",
      "badge": "tree"
    },
    {
      "step": "親子関係を縦階層で示す組織図・木構造",
      "duration": 0.9,
      "focus": ["社長", "技術責任者", "財務責任者", "{eng}", "運用部長"],
      "body": "呼び方だけが変わり、繋がりはそのまま。 名前を状態から取っている。",
      "badge": "tree",
      "set": { "eng": "開発本部長" }
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
  - 機能
  - 画面の設計
  - 公開
  - 認証
  - 課金

states:
  theme: "新しい企画"

flow:
  - 機能 -> 認証: ""
  - 機能 -> 課金: ""

animation:
  - step: "書き出した時" 2.4s
    badge: "mind"
    focus: ["{theme}", 機能, 画面の設計, 公開, 認証, 課金]
    draw: mind
    body: "中心はまだ「新しい企画」 のまま。"
  - step: "中心の主題から発想を放射状に広げる図" 0.9s
    badge: "mind"
    focus: ["{theme}", 機能, 画面の設計, 公開, 認証, 課金]
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
    { "name": "機能" },
    { "name": "画面の設計" },
    { "name": "公開" },
    { "name": "認証" },
    { "name": "課金" }
  ],
  "flow": [
    { "from": "機能", "to": "認証", "label": "" },
    { "from": "機能", "to": "課金", "label": "" }
  ],
  "states": { "theme": "新しい企画" },
  "animation": [
    {
      "step": "書き出した時",
      "duration": 2.4,
      "focus": ["{theme}", "機能", "画面の設計", "公開", "認証", "課金"],
      "draw": "mind",
      "body": "中心はまだ「新しい企画」 のまま。",
      "badge": "mind"
    },
    {
      "step": "中心の主題から発想を放射状に広げる図",
      "duration": 0.9,
      "focus": ["{theme}", "機能", "画面の設計", "公開", "認証", "課金"],
      "body": "枝を見て中心の主題が決まる。 中心の名前を状態から取っている。",
      "badge": "mind",
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
  - サイトを訪れる: { value: "普通", touchpoint: "サイト" }
  - 登録の入力: { value: "{form_mood}", touchpoint: "入力画面", opportunity: "入力のしやすさを直す" }
  - メールの確認: { value: "満足", touchpoint: "メール" }
  - 管理画面を開く: { value: "最高", touchpoint: "管理画面" }

states:
  form_mood: "不満"

animation:
  - step: "改善前" 2.4s
    badge: "journey"
    focus: ["サイトを訪れる", "登録の入力", "メールの確認", "管理画面を開く"]
    draw: journey
    set:
      form_mood: "不満"
    body: "登録の入力で気持ちが落ちる。"
  - step: "ユーザー体験の感情変化をステップ順に示す図" 0.9s
    badge: "journey"
    focus: ["サイトを訪れる", "登録の入力", "メールの確認", "管理画面を開く"]
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
    { "name": "サイトを訪れる", "value": "普通", "touchpoint": "サイト" },
    {
      "name": "登録の入力",
      "value": "{form_mood}",
      "touchpoint": "入力画面",
      "opportunity": "入力のしやすさを直す"
    },
    { "name": "メールの確認", "value": "満足", "touchpoint": "メール" },
    { "name": "管理画面を開く", "value": "最高", "touchpoint": "管理画面" }
  ],
  "flow": [],
  "states": { "form_mood": "不満" },
  "animation": [
    {
      "step": "改善前",
      "duration": 2.4,
      "focus": ["サイトを訪れる", "登録の入力", "メールの確認", "管理画面を開く"],
      "draw": "journey",
      "body": "登録の入力で気持ちが落ちる。",
      "badge": "journey",
      "set": { "form_mood": "不満" }
    },
    {
      "step": "ユーザー体験の感情変化をステップ順に示す図",
      "duration": 0.9,
      "focus": ["サイトを訪れる", "登録の入力", "メールの確認", "管理画面を開く"],
      "body": "入力の作りを直すと、その段階の気持ちだけが上がる。 曲線の高さを状態から取っている。",
      "badge": "journey",
      "set": { "form_mood": "満足" }
    }
  ]
}`;

export const sourceYaml__presetQuadrant = `title: "2 つの軸で 4 象限に分けて優先度を決める図"
eyebrow: "quadrant"
type: quadrant

axes:
  x: { left: "労力が小さい", right: "労力が大きい" }
  y: { bottom: "価値が低い", top: "価値が高い" }

actors:
  - 文言の直し: "左上"
  - 決済の作り直し: "右上"
  - 検索の絞り込み: "{fill_in_at}"
  - 古い画面の移行: "右下"

states:
  fill_in_at: "左下"

animation:
  - step: "見直し前" 0.9s
    badge: "quadrant"
    focus: ["文言の直し", "決済の作り直し", "検索の絞り込み", "古い画面の移行"]
    set:
      fill_in_at: "左下"
    body: "検索の絞り込みは、価値も労力も低い枠に置いてある。"
  - step: "2 つの軸で 4 象限に分けて優先度を決める図" 0.9s
    badge: "quadrant"
    focus: ["文言の直し", "決済の作り直し", "検索の絞り込み", "古い画面の移行"]
    set:
      fill_in_at: "左上"
    body: "見直しで検索の絞り込みを価値の高い枠へ移す。 どの枠に居るかを状態から取っている。"
`;

export const sourceJson__presetQuadrant = `{
  "title": "2 つの軸で 4 象限に分けて優先度を決める図",
  "type": "quadrant",
  "eyebrow": "quadrant",
  "axes": {
    "x": { "left": "労力が小さい", "right": "労力が大きい" },
    "y": { "bottom": "価値が低い", "top": "価値が高い" }
  },
  "actors": [
    { "name": "文言の直し", "subtitle": "左上" },
    { "name": "決済の作り直し", "subtitle": "右上" },
    { "name": "検索の絞り込み", "subtitle": "{fill_in_at}" },
    { "name": "古い画面の移行", "subtitle": "右下" }
  ],
  "flow": [],
  "states": { "fill_in_at": "左下" },
  "animation": [
    {
      "step": "見直し前",
      "duration": 0.9,
      "focus": ["文言の直し", "決済の作り直し", "検索の絞り込み", "古い画面の移行"],
      "body": "検索の絞り込みは、価値も労力も低い枠に置いてある。",
      "badge": "quadrant",
      "set": { "fill_in_at": "左下" }
    },
    {
      "step": "2 つの軸で 4 象限に分けて優先度を決める図",
      "duration": 0.9,
      "focus": ["文言の直し", "決済の作り直し", "検索の絞り込み", "古い画面の移行"],
      "body": "見直しで検索の絞り込みを価値の高い枠へ移す。 どの枠に居るかを状態から取っている。",
      "badge": "quadrant",
      "set": { "fill_in_at": "左上" }
    }
  ]
}`;

export const sourceYaml__presetGantt = `title: "タスクの期間と依存関係を横棒で示す進捗図"
eyebrow: "gantt"
type: gantt

actors:
  - 設計: { value: "Q1", owner: "デザイナー", tone: teal }
  - 実装: { value: "Q2", owner: "開発", tone: teal, end: "{build_end}" }
  - 検証: { value: "Q3", owner: "品質保証", tone: teal }
  - 公開: { value: "Q4", owner: "企画", tone: teal }

states:
  build_end: 1

flow:
  - 設計 -> 実装: ""
  - 実装 -> 検証: ""
  - 検証 -> 公開: ""

animation:
  - step: "当初の計画" 2.4s
    badge: "gantt"
    focus: [設計, 実装, 検証, 公開]
    draw: gantt
    body: "実装は Q2 で終わる想定。"
  - step: "タスクの期間と依存関係を横棒で示す進捗図" 0.9s
    badge: "gantt"
    focus: [設計, 実装, 検証, 公開]
    tween:
      build_end: 1 -> 2
    body: "作り込みが Q3 まで延びる。 帯の終わりを状態から取っている。"
`;

export const sourceJson__presetGantt = `{
  "title": "タスクの期間と依存関係を横棒で示す進捗図",
  "type": "gantt",
  "eyebrow": "gantt",
  "actors": [
    { "name": "設計", "value": "Q1", "tone": "teal", "owner": "デザイナー" },
    { "name": "実装", "value": "Q2", "tone": "teal", "owner": "開発", "end": "{build_end}" },
    { "name": "検証", "value": "Q3", "tone": "teal", "owner": "品質保証" },
    { "name": "公開", "value": "Q4", "tone": "teal", "owner": "企画" }
  ],
  "flow": [
    { "from": "設計", "to": "実装", "label": "" },
    { "from": "実装", "to": "検証", "label": "" },
    { "from": "検証", "to": "公開", "label": "" }
  ],
  "states": { "build_end": 1 },
  "animation": [
    {
      "step": "当初の計画",
      "duration": 2.4,
      "focus": ["設計", "実装", "検証", "公開"],
      "draw": "gantt",
      "body": "実装は Q2 で終わる想定。",
      "badge": "gantt"
    },
    {
      "step": "タスクの期間と依存関係を横棒で示す進捗図",
      "duration": 0.9,
      "focus": ["設計", "実装", "検証", "公開"],
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
  - 下書き: { kind: storage, lane: c0, stack: 1, posW: 320 }
  - 受付済: { kind: storage, lane: c0, stack: 2, posW: 428, rows: ["在庫を押さえる", "督促を送る: 7 日ごと"], marks: ["entry", "internal"] }
  - 支払済: { kind: storage, lane: c0, stack: 3, posW: 320, rows: ["出荷を待つ"], marks: ["do"] }
  - done: { kind: mark-end, lane: c0, stack: 4, posW: 96, posH: 96 }
  - 取消済: { kind: storage, lane: c1, stack: 2, posW: 320, rows: ["押さえを解く"], marks: ["exit"] }
  - closed: { kind: mark-end, lane: c1, stack: 3, posW: 96, posH: 96 }

# 遷移は実線に開いた矢の 1 種だけ。 違いは語の中に入る
flow:
  - begin -> 下書き: "" (accent, solid) { head: open }
  - 下書き -> 受付済: "出す" (accent, solid) { head: open }
  - 受付済 -> 支払済: "支払う" (accent, solid) { head: open }
  - 支払済 -> done: "受け取る" (accent, solid) { head: open }
  - 受付済 -> 取消済: "取り消す" (accent, solid) { head: open }
  - 取消済 -> closed: "" (accent, solid) { head: open }
  - 受付済 -> 受付済: "催促する" (accent, solid) { head: open }

animation:
  - step: "1. 下書き" 0.9s
    badge: "state"
    focus: [begin, 下書き, "begin -> 下書き"]
    body: "塗った丸が始まり。"
  - step: "2. 出して受付済へ" 0.9s
    badge: "state"
    focus: [begin, 下書き, 受付済, "begin -> 下書き", "下書き -> 受付済"]
    body: "山形を塗ると入った瞬間に 1 度だけ。 四角の外枠だけは状態が変わらない。"
  - step: "3. 受付済のまま催促する" 0.9s
    badge: "state"
    focus: [begin, 下書き, 受付済, "begin -> 下書き", "下書き -> 受付済", "受付済 -> 受付済"]
    body: "自分へ戻る輪。 7 日ごとに督促を送っても状態は変わらない。"
  - step: "4. 支払って終わる" 0.9s
    badge: "state"
    focus: [begin, 下書き, 受付済, 支払済, done, "begin -> 下書き", "下書き -> 受付済", "受付済 -> 受付済", "受付済 -> 支払済", "支払済 -> done"]
    body: "四角を塗るとその状態にいる間ずっと続く。 輪で囲むと終わり。"
  - step: "5. 取り消して終わる" 0.9s
    badge: "state"
    focus: [begin, 下書き, 受付済, 支払済, done, 取消済, closed, "begin -> 下書き", "下書き -> 受付済", "受付済 -> 受付済", "受付済 -> 支払済", "支払済 -> done", "受付済 -> 取消済", "取消済 -> closed"]
    body: "山形の外枠だけは出る瞬間に 1 度だけ。"
`;

export const sourceJson__presetStateMachine = `{
  "title": "状態と遷移条件を示す図",
  "type": "state",
  "lanes": { "c0": { "width": 478 }, "c1": { "width": 370 } },
  "actors": [
    { "name": "begin", "kind": "mark-start", "lane": "c0", "stack": 0, "posW": 96, "posH": 96 },
    { "name": "下書き", "kind": "storage", "posW": 320, "lane": "c0", "stack": 1 },
    { "name": "受付済", "kind": "storage", "posW": 428, "lane": "c0", "stack": 2, "rows": ["在庫を押さえる", "督促を送る: 7 日ごと"], "marks": ["entry", "internal"] },
    { "name": "支払済", "kind": "storage", "posW": 320, "lane": "c0", "stack": 3, "rows": ["出荷を待つ"], "marks": ["do"] },
    { "name": "done", "kind": "mark-end", "lane": "c0", "stack": 4, "posW": 96, "posH": 96 },
    { "name": "取消済", "kind": "storage", "posW": 320, "lane": "c1", "stack": 2, "rows": ["押さえを解く"], "marks": ["exit"] },
    { "name": "closed", "kind": "mark-end", "lane": "c1", "stack": 3, "posW": 96, "posH": 96 }
  ],
  "flow": [
    { "from": "begin", "to": "下書き", "label": "", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "下書き", "to": "受付済", "label": "出す", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "受付済", "to": "支払済", "label": "支払う", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "支払済", "to": "done", "label": "受け取る", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "受付済", "to": "取消済", "label": "取り消す", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "取消済", "to": "closed", "label": "", "tone": "accent", "style": "solid", "head": "open" },
    { "from": "受付済", "to": "受付済", "label": "催促する", "tone": "accent", "style": "solid", "head": "open" }
  ],
  "animation": [
    {
      "step": "1. 下書き",
      "duration": 0.9,
      "focus": ["begin", "下書き", "begin -> 下書き"],
      "body": "塗った丸が始まり。",
      "badge": "state"
    },
    {
      "step": "2. 出して受付済へ",
      "duration": 0.9,
      "focus": ["begin", "下書き", "受付済", "begin -> 下書き", "下書き -> 受付済"],
      "body": "山形を塗ると入った瞬間に 1 度だけ。 四角の外枠だけは状態が変わらない。",
      "badge": "state"
    },
    {
      "step": "3. 受付済のまま催促する",
      "duration": 0.9,
      "focus": ["begin", "下書き", "受付済", "begin -> 下書き", "下書き -> 受付済", "受付済 -> 受付済"],
      "body": "自分へ戻る輪。 7 日ごとに督促を送っても状態は変わらない。",
      "badge": "state"
    },
    {
      "step": "4. 支払って終わる",
      "duration": 0.9,
      "focus": ["begin", "下書き", "受付済", "支払済", "done", "begin -> 下書き", "下書き -> 受付済", "受付済 -> 受付済", "受付済 -> 支払済", "支払済 -> done"],
      "body": "四角を塗るとその状態にいる間ずっと続く。 輪で囲むと終わり。",
      "badge": "state"
    },
    {
      "step": "5. 取り消して終わる",
      "duration": 0.9,
      "focus": ["begin", "下書き", "受付済", "支払済", "done", "取消済", "closed", "begin -> 下書き", "下書き -> 受付済", "受付済 -> 受付済", "受付済 -> 支払済", "支払済 -> done", "受付済 -> 取消済", "取消済 -> closed"],
      "body": "山形の外枠だけは出る瞬間に 1 度だけ。",
      "badge": "state"
    }
  ]
}`;

export const sourceYaml__presetStateMachine2 = `title: "階層状態や遷移の処理を持つ入れ子の状態遷移図"
type: state

lanes:
  lane-待機: { width: 330 }
  lane-処理中: { width: 330 }
  lane-読み込み: { width: 330 }
  lane-完了: { width: 330 }

actors:
  - 待機: { kind: card, eyebrow: "初期", subtitle: "入る時: 入力を空にする", posW: 280 }
  - 処理中: { kind: card, eyebrow: "状態", posW: 280 }
  - 読み込み: { kind: card, eyebrow: "状態 / 処理中の中", subtitle: "入る時: 印を出す / 出る時: 印を消す", posW: 280 }
  - 完了: { kind: card, eyebrow: "最終", posW: 280 }

flow:
  - 待機 -> 読み込み: "送信" (accent, solid) { sub: "/入力を確かめる" }
  - 読み込み -> 完了: "成功" (success, solid)

animation:
  - step: "1. 待機" 0.9s
    badge: "state"
    focus: [待機]
    body: "入力を空にして待つ。"
  - step: "2. 処理中の中の読み込み" 0.9s
    badge: "state"
    focus: [待機, 処理中, 読み込み, "待機 -> 読み込み"]
    body: "送信で入れ子の状態に入る。"
  - step: "階層状態や遷移の処理を持つ入れ子の状態遷移図" 0.9s
    badge: "state"
    focus: [待機, 処理中, 読み込み, 完了, "待機 -> 読み込み", "読み込み -> 完了"]
    body: "成功で完了に移る。"
`;

export const sourceJson__presetStateMachine2 = `{
  "title": "階層状態や遷移の処理を持つ入れ子の状態遷移図",
  "type": "state",
  "lanes": {
    "lane-待機": { "width": 330 },
    "lane-処理中": { "width": 330 },
    "lane-読み込み": { "width": 330 },
    "lane-完了": { "width": 330 }
  },
  "actors": [
    {
      "name": "待機",
      "kind": "card",
      "subtitle": "入る時: 入力を空にする",
      "eyebrow": "初期",
      "posW": 280
    },
    { "name": "処理中", "kind": "card", "eyebrow": "状態", "posW": 280 },
    {
      "name": "読み込み",
      "kind": "card",
      "subtitle": "入る時: 印を出す / 出る時: 印を消す",
      "eyebrow": "状態 / 処理中の中",
      "posW": 280
    },
    { "name": "完了", "kind": "card", "eyebrow": "最終", "posW": 280 }
  ],
  "flow": [
    {
      "from": "待機",
      "to": "読み込み",
      "label": "送信",
      "sub": "/入力を確かめる",
      "tone": "accent",
      "style": "solid"
    },
    { "from": "読み込み", "to": "完了", "label": "成功", "tone": "success", "style": "solid" }
  ],
  "animation": [
    {
      "step": "1. 待機",
      "duration": 0.9,
      "focus": ["待機"],
      "body": "入力を空にして待つ。",
      "badge": "state"
    },
    {
      "step": "2. 処理中の中の読み込み",
      "duration": 0.9,
      "focus": ["待機", "処理中", "読み込み", "待機 -> 読み込み"],
      "body": "送信で入れ子の状態に入る。",
      "badge": "state"
    },
    {
      "step": "階層状態や遷移の処理を持つ入れ子の状態遷移図",
      "duration": 0.9,
      "focus": ["待機", "処理中", "読み込み", "完了", "待機 -> 読み込み", "読み込み -> 完了"],
      "body": "成功で完了に移る。",
      "badge": "state"
    }
  ]
}`;

export const sourceYaml__presetSwimlane = `title: "処理を役割ごとに縦列に分けて流れを示す図"
type: swimlane

lanes:
  lane-利用者: { width: 520, label: "クライアント" }
  lane-注文の処理: { width: 520, label: "サービス" }
  lane-注文済み: { width: 520, label: "イベント" }

actors:
  - 利用者: { kind: actor }
  - 注文の処理: { kind: function }
  - 注文済み: { kind: event }

flow:
  - 利用者 -> 注文の処理: "呼び出す" (accent, dotted-flow)
  - 注文の処理 -> 注文済み: "発行する" (success, dotted-flow)

animation:
  - step: "1. クライアントの利用者" 0.9s
    badge: "swimlane"
    focus: [利用者]
    body: "外から呼ぶ人が最初の縦列に立つ。"
  - step: "2. サービスの処理" 0.9s
    badge: "swimlane"
    focus: [利用者, "注文の処理", "利用者 -> 注文の処理"]
    body: "呼び出しが隣の縦列に渡る。"
  - step: "処理を役割ごとに縦列に分けて流れを示す図" 0.9s
    badge: "swimlane"
    focus: [利用者, "注文の処理", 注文済み, "利用者 -> 注文の処理", "注文の処理 -> 注文済み"]
    body: "処理が済むと、結果をイベントとして発行する。"
`;

export const sourceJson__presetSwimlane = `{
  "title": "処理を役割ごとに縦列に分けて流れを示す図",
  "type": "swimlane",
  "lanes": {
    "lane-利用者": { "width": 520, "label": "クライアント" },
    "lane-注文の処理": { "width": 520, "label": "サービス" },
    "lane-注文済み": { "width": 520, "label": "イベント" }
  },
  "actors": [
    { "name": "利用者", "kind": "actor" },
    { "name": "注文の処理", "kind": "function" },
    { "name": "注文済み", "kind": "event" }
  ],
  "flow": [
    {
      "from": "利用者",
      "to": "注文の処理",
      "label": "呼び出す",
      "tone": "accent",
      "style": "dotted-flow"
    },
    {
      "from": "注文の処理",
      "to": "注文済み",
      "label": "発行する",
      "tone": "success",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "1. クライアントの利用者",
      "duration": 0.9,
      "focus": ["利用者"],
      "body": "外から呼ぶ人が最初の縦列に立つ。",
      "badge": "swimlane"
    },
    {
      "step": "2. サービスの処理",
      "duration": 0.9,
      "focus": ["利用者", "注文の処理", "利用者 -> 注文の処理"],
      "body": "呼び出しが隣の縦列に渡る。",
      "badge": "swimlane"
    },
    {
      "step": "処理を役割ごとに縦列に分けて流れを示す図",
      "duration": 0.9,
      "focus": [
        "利用者",
        "注文の処理",
        "注文済み",
        "利用者 -> 注文の処理",
        "注文の処理 -> 注文済み"
      ],
      "body": "処理が済むと、結果をイベントとして発行する。",
      "badge": "swimlane"
    }
  ]
}`;

export const sourceYaml__presetClassDiagram = `title: "クラスどうしの 6 種の関係を示す UML クラス図"
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
  - Admin -> User: "継承" { relation: extends }
  - Order -> Auditable: "実装" { relation: implements }
  - Admin -> Order: "集約" { relation: aggregates, sub: "1..*", tailSub: "1" }
  - Order -> Receipt: "依存" { relation: uses }
  - Order -> Line: "コンポジション" { relation: composes, sub: "1..*", tailSub: "1" }
  - Line -> Sku: "関連" { relation: associates }

animation:
  - step: "1. User" 0.9s
    badge: "class"
    focus: [User]
    body: "抽象クラス。 直接は作らず、Admin が継承して使う。"
  - step: "2. 継承" 0.9s
    badge: "class"
    focus: [User, Admin, "Admin -> User"]
    body: "実線に白抜きの三角。 三角は親クラスの側に付く。"
  - step: "3. 実装" 0.9s
    badge: "class"
    focus: [User, Admin, Auditable, Order, "Admin -> User", "Order -> Auditable"]
    body: "破線に白抜きの三角。 処理の中身ではなく操作の取り決めだけを引き継ぐので、線を破線にする。"
  - step: "4. 集約" 0.9s
    badge: "class"
    focus: [User, Admin, Auditable, Order, "Admin -> User", "Order -> Auditable", "Admin -> Order"]
    body: "実線に白抜きの菱。 菱は全体の側に付く。 部分は全体が無くなっても残る。"
  - step: "5. コンポジション" 0.9s
    badge: "class"
    focus: [User, Admin, Auditable, Order, Line, "Admin -> User", "Order -> Auditable", "Admin -> Order", "Order -> Line"]
    body: "菱を塗る。 部分の寿命は全体と同じで、全体を消すと部分も消える。"
  - step: "6. 関連と依存" 0.9s
    badge: "class"
    focus: [User, Admin, Auditable, Order, Line, Sku, Receipt, "Admin -> User", "Order -> Auditable", "Admin -> Order", "Order -> Line", "Line -> Sku", "Order -> Receipt"]
    body: "関連は実線に開いた矢で、相手を参照し続ける。 依存は破線に開いた矢で、引数や戻り値として一時的に使うだけ。"
`;

export const sourceJson__presetClassDiagram = `{
  "title": "クラスどうしの 6 種の関係を示す UML クラス図",
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
      "label": "継承",
      "relation": "extends"
    },
    {
      "from": "Order",
      "to": "Auditable",
      "label": "実装",
      "relation": "implements"
    },
    {
      "from": "Admin",
      "to": "Order",
      "label": "集約",
      "sub": "1..*",
      "tailSub": "1",
      "relation": "aggregates"
    },
    {
      "from": "Order",
      "to": "Receipt",
      "label": "依存",
      "relation": "uses"
    },
    {
      "from": "Order",
      "to": "Line",
      "label": "コンポジション",
      "sub": "1..*",
      "tailSub": "1",
      "relation": "composes"
    },
    {
      "from": "Line",
      "to": "Sku",
      "label": "関連",
      "relation": "associates"
    }
  ],
  "animation": [
    {
      "step": "1. User",
      "duration": 0.9,
      "focus": ["User"],
      "body": "抽象クラス。 直接は作らず、Admin が継承して使う。",
      "badge": "class"
    },
    {
      "step": "2. 継承",
      "duration": 0.9,
      "focus": ["User", "Admin", "Admin -> User"],
      "body": "実線に白抜きの三角。 三角は親クラスの側に付く。",
      "badge": "class"
    },
    {
      "step": "3. 実装",
      "duration": 0.9,
      "focus": ["User", "Admin", "Auditable", "Order", "Admin -> User", "Order -> Auditable"],
      "body": "破線に白抜きの三角。 処理の中身ではなく操作の取り決めだけを引き継ぐので、線を破線にする。",
      "badge": "class"
    },
    {
      "step": "4. 集約",
      "duration": 0.9,
      "focus": ["User", "Admin", "Auditable", "Order", "Admin -> User", "Order -> Auditable", "Admin -> Order"],
      "body": "実線に白抜きの菱。 菱は全体の側に付く。 部分は全体が無くなっても残る。",
      "badge": "class"
    },
    {
      "step": "5. コンポジション",
      "duration": 0.9,
      "focus": ["User", "Admin", "Auditable", "Order", "Line", "Admin -> User", "Order -> Auditable", "Admin -> Order", "Order -> Line"],
      "body": "菱を塗る。 部分の寿命は全体と同じで、全体を消すと部分も消える。",
      "badge": "class"
    },
    {
      "step": "6. 関連と依存",
      "duration": 0.9,
      "focus": ["User", "Admin", "Auditable", "Order", "Line", "Sku", "Receipt", "Admin -> User", "Order -> Auditable", "Admin -> Order", "Order -> Line", "Line -> Sku", "Order -> Receipt"],
      "body": "関連は実線に開いた矢で、相手を参照し続ける。 依存は破線に開いた矢で、引数や戻り値として一時的に使うだけ。",
      "badge": "class"
    }
  ]
}`;

export const sourceYaml__pattern__presetClassDiagram__複雑 = `title: "決済の抽象クラスとインターフェースと関係を示す UML クラス図"
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
  - BankTransfer -> PaymentMethod: "継承" { relation: extends }
  - CardPayment -> PaymentMethod: "継承" { relation: extends }
  - WalletPayment -> PaymentMethod: "継承" { relation: extends }
  - PaymentGateway -> Auditable: "実装" { relation: implements }
  - WalletPayment -> Auditable: "実装" { relation: implements }
  - RiskCheck -> Notification: "依存" { relation: uses }
  - PaymentGateway -> Retryable: "実装" { relation: implements }
  - Transaction -> Receipt: "集約" { relation: aggregates }
  - Transaction -> LedgerEntry: "コンポジション" { relation: composes }
  - PaymentGateway -> Transaction: "コンポジション" { relation: composes }
  - Transaction -> CardPayment: "関連" { relation: associates }
  - Receipt -> LedgerEntry: "関連" { relation: associates }
  - PaymentGateway -> RiskCheck: "依存" { relation: uses }
  - Transaction -> Notification: "依存" { relation: uses }
animation:
  - step: "1. 抽象クラスとインターフェース" 0.9s
    focus: [PaymentMethod, Auditable, Retryable]
    badge: "class"
    body: "支払い方法の抽象クラスと、監査・再試行のインターフェースを先に読む。"
  - step: "2. 振込とカードの継承" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod"]
    badge: "class"
    body: "実線に白抜きの三角。 三角は親クラスの側に付く。"
  - step: "3. 財布の継承と実装" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable"]
    badge: "class"
    body: "1 つのクラスが親クラスを継承し、別のインターフェースも実装する。 破線の先がインターフェース。"
  - step: "4. ゲートウェイの実装" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", PaymentGateway, "PaymentGateway -> Auditable", "PaymentGateway -> Retryable"]
    badge: "class"
    body: "破線に白抜きの三角。 処理の中身ではなく操作の取り決めだけを引き継ぐので、線を破線にする。"
  - step: "5. 取引のコンポジション" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", PaymentGateway, "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", Transaction, "PaymentGateway -> Transaction", "Transaction -> CardPayment"]
    badge: "class"
    body: "塗った菱。 取引の寿命はゲートウェイと同じで、ゲートウェイが消えると取引も消える。 実線に開いた矢は関連で、取引はカード払いを参照する。"
  - step: "6. 領収書と仕訳" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", PaymentGateway, "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", Transaction, "PaymentGateway -> Transaction", "Transaction -> CardPayment", Receipt, LedgerEntry, "Transaction -> Receipt", "Transaction -> LedgerEntry"]
    badge: "class"
    body: "白抜きの菱は集約で、領収書は取引が無くなっても残る。 塗った菱はコンポジションで、仕訳は取引と一緒に消える。"
  - step: "7. 仕訳の参照とリスク判定" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", PaymentGateway, "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", Transaction, "PaymentGateway -> Transaction", "Transaction -> CardPayment", Receipt, LedgerEntry, "Transaction -> Receipt", "Transaction -> LedgerEntry", RiskCheck, "Receipt -> LedgerEntry", "PaymentGateway -> RiskCheck"]
    badge: "class"
    body: "関連は実線に開いた矢で、相手を参照し続ける。 依存は破線に開いた矢で、引数や戻り値として一時的に使うだけ。"
  - step: "8. 通知への依存" 0.9s
    focus: [PaymentMethod, Auditable, Retryable, BankTransfer, CardPayment, "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", WalletPayment, "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", PaymentGateway, "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", Transaction, "PaymentGateway -> Transaction", "Transaction -> CardPayment", Receipt, LedgerEntry, "Transaction -> Receipt", "Transaction -> LedgerEntry", RiskCheck, "Receipt -> LedgerEntry", "PaymentGateway -> RiskCheck", Notification, "RiskCheck -> Notification", "Transaction -> Notification"]
    badge: "class"
    body: "リスク判定と取引が、同じ通知クラスに依存する。 破線に開いた矢が 2 本入る。"
`;

export const sourceJson__pattern__presetClassDiagram__複雑 = JSON.stringify(
  {
    "title": "決済の抽象クラスとインターフェースと関係を示す UML クラス図",
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
        "label": "継承",
        "relation": "extends"
      },
      {
        "from": "CardPayment",
        "to": "PaymentMethod",
        "label": "継承",
        "relation": "extends"
      },
      {
        "from": "WalletPayment",
        "to": "PaymentMethod",
        "label": "継承",
        "relation": "extends"
      },
      {
        "from": "PaymentGateway",
        "to": "Auditable",
        "label": "実装",
        "relation": "implements"
      },
      {
        "from": "WalletPayment",
        "to": "Auditable",
        "label": "実装",
        "relation": "implements"
      },
      {
        "from": "RiskCheck",
        "to": "Notification",
        "label": "依存",
        "relation": "uses"
      },
      {
        "from": "PaymentGateway",
        "to": "Retryable",
        "label": "実装",
        "relation": "implements"
      },
      {
        "from": "Transaction",
        "to": "Receipt",
        "label": "集約",
        "relation": "aggregates"
      },
      {
        "from": "Transaction",
        "to": "LedgerEntry",
        "label": "コンポジション",
        "relation": "composes"
      },
      {
        "from": "PaymentGateway",
        "to": "Transaction",
        "label": "コンポジション",
        "relation": "composes"
      },
      {
        "from": "Transaction",
        "to": "CardPayment",
        "label": "関連",
        "relation": "associates"
      },
      {
        "from": "Receipt",
        "to": "LedgerEntry",
        "label": "関連",
        "relation": "associates"
      },
      {
        "from": "PaymentGateway",
        "to": "RiskCheck",
        "label": "依存",
        "relation": "uses"
      },
      {
        "from": "Transaction",
        "to": "Notification",
        "label": "依存",
        "relation": "uses"
      }
    ],
    "animation": [
      {
        "step": "1. 抽象クラスとインターフェース",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable"],
        "badge": "class",
        "body": "支払い方法の抽象クラスと、監査・再試行のインターフェースを先に読む。"
      },
      {
        "step": "2. 振込とカードの継承",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod"],
        "badge": "class",
        "body": "実線に白抜きの三角。 三角は親クラスの側に付く。"
      },
      {
        "step": "3. 財布の継承と実装",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable"],
        "badge": "class",
        "body": "1 つのクラスが親クラスを継承し、別のインターフェースも実装する。 破線の先がインターフェース。"
      },
      {
        "step": "4. ゲートウェイの実装",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", "PaymentGateway", "PaymentGateway -> Auditable", "PaymentGateway -> Retryable"],
        "badge": "class",
        "body": "破線に白抜きの三角。 処理の中身ではなく操作の取り決めだけを引き継ぐので、線を破線にする。"
      },
      {
        "step": "5. 取引のコンポジション",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", "PaymentGateway", "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", "Transaction", "PaymentGateway -> Transaction", "Transaction -> CardPayment"],
        "badge": "class",
        "body": "塗った菱。 取引の寿命はゲートウェイと同じで、ゲートウェイが消えると取引も消える。 実線に開いた矢は関連で、取引はカード払いを参照する。"
      },
      {
        "step": "6. 領収書と仕訳",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", "PaymentGateway", "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", "Transaction", "PaymentGateway -> Transaction", "Transaction -> CardPayment", "Receipt", "LedgerEntry", "Transaction -> Receipt", "Transaction -> LedgerEntry"],
        "badge": "class",
        "body": "白抜きの菱は集約で、領収書は取引が無くなっても残る。 塗った菱はコンポジションで、仕訳は取引と一緒に消える。"
      },
      {
        "step": "7. 仕訳の参照とリスク判定",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", "PaymentGateway", "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", "Transaction", "PaymentGateway -> Transaction", "Transaction -> CardPayment", "Receipt", "LedgerEntry", "Transaction -> Receipt", "Transaction -> LedgerEntry", "RiskCheck", "Receipt -> LedgerEntry", "PaymentGateway -> RiskCheck"],
        "badge": "class",
        "body": "関連は実線に開いた矢で、相手を参照し続ける。 依存は破線に開いた矢で、引数や戻り値として一時的に使うだけ。"
      },
      {
        "step": "8. 通知への依存",
        "duration": 0.9,
        "focus": ["PaymentMethod", "Auditable", "Retryable", "BankTransfer", "CardPayment", "BankTransfer -> PaymentMethod", "CardPayment -> PaymentMethod", "WalletPayment", "WalletPayment -> PaymentMethod", "WalletPayment -> Auditable", "PaymentGateway", "PaymentGateway -> Auditable", "PaymentGateway -> Retryable", "Transaction", "PaymentGateway -> Transaction", "Transaction -> CardPayment", "Receipt", "LedgerEntry", "Transaction -> Receipt", "Transaction -> LedgerEntry", "RiskCheck", "Receipt -> LedgerEntry", "PaymentGateway -> RiskCheck", "Notification", "RiskCheck -> Notification", "Transaction -> Notification"],
        "badge": "class",
        "body": "リスク判定と取引が、同じ通知クラスに依存する。 破線に開いた矢が 2 本入る。"
      }
    ]
  },
  null,
  2,
);

export const sourceYaml__presetTopology = `title: "システムの構成要素と接続を配置で示す図"
type: topology

lanes:
  client: { width: 460, label: "利用者側" }
  aws: { width: 460, label: "AWS" }

actors:
  - ブラウザ: { kind: frontend, lane: client }
  - ALB: { kind: service, eyebrow: "負荷分散", lane: aws }
  - ECS のタスク: { kind: service, eyebrow: "コンテナ", lane: aws }
  - RDS: { kind: database, eyebrow: "PostgreSQL", lane: aws }

flow:
  - ブラウザ -> ALB: "HTTPS" (teal, solid) { sub: "TLS 1.3" }
  - ALB -> ECS のタスク: "ラウンドロビン" (teal, solid)
  - ECS のタスク -> RDS: "TCP 5432" (success, solid) { sub: "PgBouncer 経由" }

animation:
  - step: "1. ブラウザ" 0.9s
    badge: "topology"
    focus: [ブラウザ]
    body: "利用者側の入口。"
  - step: "2. ALB" 0.9s
    badge: "topology"
    focus: [ブラウザ, ALB, "ブラウザ -> ALB"]
    body: "HTTPS を受けて振り分ける。"
  - step: "3. ECS のタスク" 0.9s
    badge: "topology"
    focus: [ブラウザ, ALB, "ブラウザ -> ALB", "ECS のタスク", "ALB -> ECS のタスク"]
    body: "コンテナが処理する。"
  - step: "システムの構成要素と接続を配置で示す図" 0.9s
    badge: "topology"
    focus: [ブラウザ, ALB, "ブラウザ -> ALB", "ECS のタスク", "ALB -> ECS のタスク", RDS, "ECS のタスク -> RDS"]
    body: "コンテナが PgBouncer を経て PostgreSQL に繋がる。"
`;

export const sourceJson__presetTopology = `{
  "title": "システムの構成要素と接続を配置で示す図",
  "type": "topology",
  "lanes": {
    "client": { "width": 460, "label": "利用者側" },
    "aws": { "width": 460, "label": "AWS" }
  },
  "actors": [
    { "name": "ブラウザ", "kind": "frontend", "lane": "client" },
    { "name": "ALB", "kind": "service", "eyebrow": "負荷分散", "lane": "aws" },
    { "name": "ECS のタスク", "kind": "service", "eyebrow": "コンテナ", "lane": "aws" },
    { "name": "RDS", "kind": "database", "eyebrow": "PostgreSQL", "lane": "aws" }
  ],
  "flow": [
    {
      "from": "ブラウザ",
      "to": "ALB",
      "label": "HTTPS",
      "sub": "TLS 1.3",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "ALB",
      "to": "ECS のタスク",
      "label": "ラウンドロビン",
      "tone": "teal",
      "style": "solid"
    },
    {
      "from": "ECS のタスク",
      "to": "RDS",
      "label": "TCP 5432",
      "sub": "PgBouncer 経由",
      "tone": "success",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "1. ブラウザ",
      "duration": 0.9,
      "focus": ["ブラウザ"],
      "body": "利用者側の入口。",
      "badge": "topology"
    },
    {
      "step": "2. ALB",
      "duration": 0.9,
      "focus": ["ブラウザ", "ALB", "ブラウザ -> ALB"],
      "body": "HTTPS を受けて振り分ける。",
      "badge": "topology"
    },
    {
      "step": "3. ECS のタスク",
      "duration": 0.9,
      "focus": ["ブラウザ", "ALB", "ブラウザ -> ALB", "ECS のタスク", "ALB -> ECS のタスク"],
      "body": "コンテナが処理する。",
      "badge": "topology"
    },
    {
      "step": "システムの構成要素と接続を配置で示す図",
      "duration": 0.9,
      "focus": [
        "ブラウザ",
        "ALB",
        "ブラウザ -> ALB",
        "ECS のタスク",
        "ALB -> ECS のタスク",
        "RDS",
        "ECS のタスク -> RDS"
      ],
      "body": "コンテナが PgBouncer を経て PostgreSQL に繋がる。",
      "badge": "topology"
    }
  ]
}`;

export const sourceYaml__presetFlowchart = `title: "分岐や判定を含む処理の流れを示す図"
type: swimlane

lanes:
  user: { width: 380, label: "申請者" }
  manager: { width: 380, label: "承認者" }

actors:
  - 申請を出す: { kind: event, eyebrow: "開始", lane: user }
  - 審査: { kind: card, eyebrow: "判断", lane: manager }
  - 承認: { kind: event, eyebrow: "終了", lane: manager }
  - 直して出し直す: { kind: function, eyebrow: "処理", lane: user }

flow:
  - 申請を出す -> 審査: "" (accent, solid) { overlay: false }
  - 審査 -> 承認: "はい" (success, solid) { overlay: true }
  - 審査 -> 直して出し直す: "いいえ" (warning, solid) { overlay: true }

animation:
  - step: "1. 申請を出す" 0.9s
    badge: "flowchart"
    focus: ["申請を出す"]
    body: "申請者が申請を出す。"
  - step: "2. 審査" 0.9s
    badge: "flowchart"
    focus: ["申請を出す", 審査, "申請を出す -> 審査"]
    body: "承認者が審査して判断する。"
  - step: "3. はいなら承認" 0.9s
    badge: "flowchart"
    focus: ["申請を出す", 審査, "申請を出す -> 審査", 承認, "審査 -> 承認"]
    body: "承認して終わる枝。"
  - step: "分岐や判定を含む処理の流れを示す図" 0.9s
    badge: "flowchart"
    focus: ["申請を出す", 審査, "申請を出す -> 審査", 承認, "審査 -> 承認", 直して出し直す, "審査 -> 直して出し直す"]
    body: "いいえなら申請者に差し戻し、直して出し直す。"
`;

export const sourceJson__presetFlowchart = `{
  "title": "分岐や判定を含む処理の流れを示す図",
  "type": "swimlane",
  "lanes": {
    "user": { "width": 380, "label": "申請者" },
    "manager": { "width": 380, "label": "承認者" }
  },
  "actors": [
    { "name": "申請を出す", "kind": "event", "eyebrow": "開始", "lane": "user" },
    { "name": "審査", "kind": "card", "eyebrow": "判断", "lane": "manager" },
    { "name": "承認", "kind": "event", "eyebrow": "終了", "lane": "manager" },
    { "name": "直して出し直す", "kind": "function", "eyebrow": "処理", "lane": "user" }
  ],
  "flow": [
    {
      "from": "申請を出す",
      "to": "審査",
      "label": "",
      "tone": "accent",
      "style": "solid",
      "overlay": false
    },
    {
      "from": "審査",
      "to": "承認",
      "label": "はい",
      "tone": "success",
      "style": "solid",
      "overlay": true
    },
    {
      "from": "審査",
      "to": "直して出し直す",
      "label": "いいえ",
      "tone": "warning",
      "style": "solid",
      "overlay": true
    }
  ],
  "animation": [
    {
      "step": "1. 申請を出す",
      "duration": 0.9,
      "focus": ["申請を出す"],
      "body": "申請者が申請を出す。",
      "badge": "flowchart"
    },
    {
      "step": "2. 審査",
      "duration": 0.9,
      "focus": ["申請を出す", "審査", "申請を出す -> 審査"],
      "body": "承認者が審査して判断する。",
      "badge": "flowchart"
    },
    {
      "step": "3. はいなら承認",
      "duration": 0.9,
      "focus": [
        "申請を出す",
        "審査",
        "申請を出す -> 審査",
        "承認",
        "審査 -> 承認"
      ],
      "body": "承認して終わる枝。",
      "badge": "flowchart"
    },
    {
      "step": "分岐や判定を含む処理の流れを示す図",
      "duration": 0.9,
      "focus": [
        "申請を出す",
        "審査",
        "申請を出す -> 審査",
        "承認",
        "審査 -> 承認",
        "直して出し直す",
        "審査 -> 直して出し直す"
      ],
      "body": "いいえなら申請者に差し戻し、直して出し直す。",
      "badge": "flowchart"
    }
  ]
}`;

export const sourceYaml__pattern__presetFlowchart__複雑 = `title: "経費の申請を金額と領収書で分けて振込まで追う流れ図"
# 簡単な版と同じく swimlane で書く。 縦列の中は書いた順に上から積む
type: swimlane

lanes:
  applicant: { width: 380, label: "申請者" }
  accounting: { width: 380, label: "経理" }
  manager: { width: 380, label: "上長" }

actors:
  - 領収書を添えて申請する: { kind: event, eyebrow: "開始", lane: applicant }
  - 直して出し直す: { kind: function, eyebrow: "処理", lane: applicant }
  - 10 万円を超えるか: { kind: card, eyebrow: "判断", lane: accounting }
  - 明細を 1 行ずつ見る: { kind: card, eyebrow: "繰り返し", lane: accounting }
  - 領収書と金額が合うか: { kind: card, eyebrow: "判断", lane: accounting }
  - 次の給与日に振り込む: { kind: event, eyebrow: "終了", lane: accounting }
  - 上長が認めるか: { kind: card, eyebrow: "判断", lane: manager }
  - 却下を知らせる: { kind: event, eyebrow: "終了", lane: manager }

# 「はい」 と「いいえ」 は線の上に重ねる (overlay: true)。 それ以外の名前は線から離して置く
flow:
  - 領収書を添えて申請する -> 10 万円を超えるか: "" (accent, solid) { overlay: false }
  - 10 万円を超えるか -> 上長が認めるか: "はい" (warning, solid) { overlay: true }
  - 10 万円を超えるか -> 明細を 1 行ずつ見る: "いいえ" (success, solid) { overlay: true }
  - 上長が認めるか -> 明細を 1 行ずつ見る: "はい" (success, solid) { overlay: true }
  - 上長が認めるか -> 却下を知らせる: "いいえ" (error, solid) { overlay: true }
  - 明細を 1 行ずつ見る -> 領収書と金額が合うか: "" (accent, solid) { overlay: false }
  - 領収書と金額が合うか -> 直して出し直す: "いいえ" (warning, solid) { overlay: true }
  - 直して出し直す -> 領収書を添えて申請する: "出し直す" (accent, solid) { overlay: false }
  - 領収書と金額が合うか -> 次の給与日に振り込む: "はい" (success, solid) { overlay: true }

animation:
  - step: "1. 領収書を添えて申請する" 0.9s
    badge: "flowchart"
    focus: [領収書を添えて申請する]
    body: "申請者が領収書を添えて経費を申請する。 流れはここから始まり、振込か却下のどちらかで終わる。"
  - step: "2. 金額で道を分ける" 0.9s
    badge: "flowchart"
    focus: [領収書を添えて申請する, "10 万円を超えるか", "領収書を添えて申請する -> 10 万円を超えるか"]
    body: "経理は最初に、合計が 10 万円を超えるかを見る。 超えない申請は上長を通さずに照合へ進む。"
  - step: "3. 高い申請は上長に回す" 0.9s
    badge: "flowchart"
    focus: [領収書を添えて申請する, "10 万円を超えるか", "領収書を添えて申請する -> 10 万円を超えるか", 上長が認めるか, "10 万円を超えるか -> 上長が認めるか"]
    body: "10 万円を超える申請だけ、上長が認めるかを判断する。 判断が 2 つ続く道になる。"
  - step: "4. 認めなければ却下で終える" 0.9s
    badge: "flowchart"
    focus: [領収書を添えて申請する, "10 万円を超えるか", "領収書を添えて申請する -> 10 万円を超えるか", 上長が認めるか, "10 万円を超えるか -> 上長が認めるか", 却下を知らせる, "上長が認めるか -> 却下を知らせる"]
    body: "上長が認めない申請は、却下を知らせて終わる。 この流れの 1 つ目の終わり方。"
  - step: "5. 2 つの道が照合で合流する" 0.9s
    badge: "flowchart"
    focus: [領収書を添えて申請する, "10 万円を超えるか", "領収書を添えて申請する -> 10 万円を超えるか", 上長が認めるか, "10 万円を超えるか -> 上長が認めるか", 却下を知らせる, "上長が認めるか -> 却下を知らせる", "明細を 1 行ずつ見る", "10 万円を超えるか -> 明細を 1 行ずつ見る", "上長が認めるか -> 明細を 1 行ずつ見る"]
    body: "10 万円以下の申請と、上長が認めた申請が同じ照合に入る。 経理は明細を 1 行ずつ、最後の行まで繰り返し見る。"
  - step: "6. 領収書と金額が合うかを判断する" 0.9s
    badge: "flowchart"
    focus: [領収書を添えて申請する, "10 万円を超えるか", "領収書を添えて申請する -> 10 万円を超えるか", 上長が認めるか, "10 万円を超えるか -> 上長が認めるか", 却下を知らせる, "上長が認めるか -> 却下を知らせる", "明細を 1 行ずつ見る", "10 万円を超えるか -> 明細を 1 行ずつ見る", "上長が認めるか -> 明細を 1 行ずつ見る", 領収書と金額が合うか, "明細を 1 行ずつ見る -> 領収書と金額が合うか"]
    body: "全ての行を見終えたら、領収書と金額が合うかを判断する。"
  - step: "7. 合わなければ差し戻す" 0.9s
    badge: "flowchart"
    focus: [領収書を添えて申請する, "10 万円を超えるか", "領収書を添えて申請する -> 10 万円を超えるか", 上長が認めるか, "10 万円を超えるか -> 上長が認めるか", 却下を知らせる, "上長が認めるか -> 却下を知らせる", "明細を 1 行ずつ見る", "10 万円を超えるか -> 明細を 1 行ずつ見る", "上長が認めるか -> 明細を 1 行ずつ見る", 領収書と金額が合うか, "明細を 1 行ずつ見る -> 領収書と金額が合うか", 直して出し直す, "領収書と金額が合うか -> 直して出し直す", "直して出し直す -> 領収書を添えて申請する"]
    body: "合わない申請は申請者に戻る。 申請者が直して出し直すと、最初の申請へ戻ってもう一度流れる。"
  - step: "経費の申請を金額と領収書で分けて振込まで追う流れ図" 0.9s
    badge: "flowchart"
    focus: [領収書を添えて申請する, "10 万円を超えるか", "領収書を添えて申請する -> 10 万円を超えるか", 上長が認めるか, "10 万円を超えるか -> 上長が認めるか", 却下を知らせる, "上長が認めるか -> 却下を知らせる", "明細を 1 行ずつ見る", "10 万円を超えるか -> 明細を 1 行ずつ見る", "上長が認めるか -> 明細を 1 行ずつ見る", 領収書と金額が合うか, "明細を 1 行ずつ見る -> 領収書と金額が合うか", 直して出し直す, "領収書と金額が合うか -> 直して出し直す", "直して出し直す -> 領収書を添えて申請する", 次の給与日に振り込む, "領収書と金額が合うか -> 次の給与日に振り込む"]
    body: "合う申請は次の給与日に振り込んで終わる。 この流れの 2 つ目の終わり方。"
`;

/** 複雑な流れ図の段で光る先。 記法の JSON は段ごとに前の段の分を積み上げて書く */
const flowchartComplexFocus: readonly (readonly string[])[] = [
  ["領収書を添えて申請する"],
  ["10 万円を超えるか", "領収書を添えて申請する -> 10 万円を超えるか"],
  ["上長が認めるか", "10 万円を超えるか -> 上長が認めるか"],
  ["却下を知らせる", "上長が認めるか -> 却下を知らせる"],
  ["明細を 1 行ずつ見る", "10 万円を超えるか -> 明細を 1 行ずつ見る", "上長が認めるか -> 明細を 1 行ずつ見る"],
  ["領収書と金額が合うか", "明細を 1 行ずつ見る -> 領収書と金額が合うか"],
  ["直して出し直す", "領収書と金額が合うか -> 直して出し直す", "直して出し直す -> 領収書を添えて申請する"],
  ["次の給与日に振り込む", "領収書と金額が合うか -> 次の給与日に振り込む"],
];

export const sourceJson__pattern__presetFlowchart__複雑 = JSON.stringify(
  {
    title: "経費の申請を金額と領収書で分けて振込まで追う流れ図",
    type: "swimlane",
    lanes: {
      applicant: { width: 380, label: "申請者" },
      accounting: { width: 380, label: "経理" },
      manager: { width: 380, label: "上長" },
    },
    actors: [
      { name: "領収書を添えて申請する", kind: "event", eyebrow: "開始", lane: "applicant" },
      { name: "直して出し直す", kind: "function", eyebrow: "処理", lane: "applicant" },
      { name: "10 万円を超えるか", kind: "card", eyebrow: "判断", lane: "accounting" },
      { name: "明細を 1 行ずつ見る", kind: "card", eyebrow: "繰り返し", lane: "accounting" },
      { name: "領収書と金額が合うか", kind: "card", eyebrow: "判断", lane: "accounting" },
      { name: "次の給与日に振り込む", kind: "event", eyebrow: "終了", lane: "accounting" },
      { name: "上長が認めるか", kind: "card", eyebrow: "判断", lane: "manager" },
      { name: "却下を知らせる", kind: "event", eyebrow: "終了", lane: "manager" },
    ],
    flow: [
      { from: "領収書を添えて申請する", to: "10 万円を超えるか", label: "", tone: "accent", style: "solid", overlay: false },
      { from: "10 万円を超えるか", to: "上長が認めるか", label: "はい", tone: "warning", style: "solid", overlay: true },
      { from: "10 万円を超えるか", to: "明細を 1 行ずつ見る", label: "いいえ", tone: "success", style: "solid", overlay: true },
      { from: "上長が認めるか", to: "明細を 1 行ずつ見る", label: "はい", tone: "success", style: "solid", overlay: true },
      { from: "上長が認めるか", to: "却下を知らせる", label: "いいえ", tone: "error", style: "solid", overlay: true },
      { from: "明細を 1 行ずつ見る", to: "領収書と金額が合うか", label: "", tone: "accent", style: "solid", overlay: false },
      { from: "領収書と金額が合うか", to: "直して出し直す", label: "いいえ", tone: "warning", style: "solid", overlay: true },
      { from: "直して出し直す", to: "領収書を添えて申請する", label: "出し直す", tone: "accent", style: "solid", overlay: false },
      { from: "領収書と金額が合うか", to: "次の給与日に振り込む", label: "はい", tone: "success", style: "solid", overlay: true },
    ],
    animation: [
      ["1. 領収書を添えて申請する", "申請者が領収書を添えて経費を申請する。 流れはここから始まり、振込か却下のどちらかで終わる。"],
      ["2. 金額で道を分ける", "経理は最初に、合計が 10 万円を超えるかを見る。 超えない申請は上長を通さずに照合へ進む。"],
      ["3. 高い申請は上長に回す", "10 万円を超える申請だけ、上長が認めるかを判断する。 判断が 2 つ続く道になる。"],
      ["4. 認めなければ却下で終える", "上長が認めない申請は、却下を知らせて終わる。 この流れの 1 つ目の終わり方。"],
      ["5. 2 つの道が照合で合流する", "10 万円以下の申請と、上長が認めた申請が同じ照合に入る。 経理は明細を 1 行ずつ、最後の行まで繰り返し見る。"],
      ["6. 領収書と金額が合うかを判断する", "全ての行を見終えたら、領収書と金額が合うかを判断する。"],
      ["7. 合わなければ差し戻す", "合わない申請は申請者に戻る。 申請者が直して出し直すと、最初の申請へ戻ってもう一度流れる。"],
      ["経費の申請を金額と領収書で分けて振込まで追う流れ図", "合う申請は次の給与日に振り込んで終わる。 この流れの 2 つ目の終わり方。"],
    ].map(([step, body], i) => ({
      step,
      duration: 0.9,
      focus: flowchartComplexFocus.slice(0, i + 1).flat(),
      body,
      badge: "flowchart",
    })),
  },
  null,
  2,
);

export const sourceYaml__presetNetwork =`title: "ネットワーク機器とセグメントの接続関係を示す図"
type: flow

lanes:
  n-col-0: { width: 320 }
  n-col-1: { width: 320 }
  n-col-2: { width: 320 }

actors:
  - 外部との境界: { kind: service, eyebrow: "ファイアウォール / DMZ", lane: n-col-0 }
  - スイッチ A: { kind: service, eyebrow: "スイッチ / LAN", lane: n-col-1 }
  - アプリのサーバー: { kind: backend, eyebrow: "サーバー", lane: n-col-2 }
  - DB のサーバー: { kind: backend, eyebrow: "サーバー", lane: n-col-2 }

flow:
  - 外部との境界 -> スイッチ A: "VLAN 10" (info, solid)
  - スイッチ A -> アプリのサーバー: "TCP 22" (info, solid)
  - スイッチ A -> DB のサーバー: "TCP 5432" (info, solid)

animation:
  - step: "1. 外部との境界" 0.9s
    badge: "network"
    focus: [外部との境界]
    body: "DMZ の入口。"
  - step: "2. スイッチ A" 0.9s
    badge: "network"
    focus: [外部との境界, "スイッチ A", "外部との境界 -> スイッチ A"]
    body: "VLAN 10 で LAN に流す。"
  - step: "3. アプリのサーバー" 0.9s
    badge: "network"
    focus: [外部との境界, "スイッチ A", "外部との境界 -> スイッチ A", "アプリのサーバー", "スイッチ A -> アプリのサーバー"]
    body: "TCP 22 で繋がる。"
  - step: "ネットワーク機器とセグメントの接続関係を示す図" 0.9s
    badge: "network"
    focus: [外部との境界, "スイッチ A", "外部との境界 -> スイッチ A", "アプリのサーバー", "スイッチ A -> アプリのサーバー", "DB のサーバー", "スイッチ A -> DB のサーバー"]
    body: "DB のサーバーへは TCP 5432 で繋がる。"
`;

export const sourceJson__presetNetwork = `{
  "title": "ネットワーク機器とセグメントの接続関係を示す図",
  "type": "flow",
  "lanes": { "n-col-0": {"width": 320}, "n-col-1": {"width": 320}, "n-col-2": {"width": 320} },
  "actors": [
    { "name": "外部との境界", "kind": "service", "eyebrow": "ファイアウォール / DMZ", "lane": "n-col-0" },
    { "name": "スイッチ A", "kind": "service", "eyebrow": "スイッチ / LAN", "lane": "n-col-1" },
    { "name": "アプリのサーバー", "kind": "backend", "eyebrow": "サーバー", "lane": "n-col-2" },
    { "name": "DB のサーバー", "kind": "backend", "eyebrow": "サーバー", "lane": "n-col-2" }
  ],
  "flow": [
    {
      "from": "外部との境界",
      "to": "スイッチ A",
      "label": "VLAN 10",
      "tone": "info",
      "style": "solid"
    },
    {
      "from": "スイッチ A",
      "to": "アプリのサーバー",
      "label": "TCP 22",
      "tone": "info",
      "style": "solid"
    },
    {
      "from": "スイッチ A",
      "to": "DB のサーバー",
      "label": "TCP 5432",
      "tone": "info",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "1. 外部との境界",
      "duration": 0.9,
      "focus": ["外部との境界"],
      "body": "DMZ の入口。",
      "badge": "network"
    },
    {
      "step": "2. スイッチ A",
      "duration": 0.9,
      "focus": ["外部との境界", "スイッチ A", "外部との境界 -> スイッチ A"],
      "body": "VLAN 10 で LAN に流す。",
      "badge": "network"
    },
    {
      "step": "3. アプリのサーバー",
      "duration": 0.9,
      "focus": [
        "外部との境界",
        "スイッチ A",
        "外部との境界 -> スイッチ A",
        "アプリのサーバー",
        "スイッチ A -> アプリのサーバー"
      ],
      "body": "TCP 22 で繋がる。",
      "badge": "network"
    },
    {
      "step": "ネットワーク機器とセグメントの接続関係を示す図",
      "duration": 0.9,
      "focus": [
        "外部との境界",
        "スイッチ A",
        "外部との境界 -> スイッチ A",
        "アプリのサーバー",
        "スイッチ A -> アプリのサーバー",
        "DB のサーバー",
        "スイッチ A -> DB のサーバー"
      ],
      "body": "DB のサーバーへは TCP 5432 で繋がる。",
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
  - ブラウザ: { kind: person, lane: col-0, eyebrow: "利用者", subtitle: "利用者の画面" }
  - CloudFront: { kind: cdn, lane: col-1, eyebrow: "配信", subtitle: "静的配信" }
  - ALB: { kind: service, lane: col-2, eyebrow: "振り分け", subtitle: "負荷分散" }
  - アプリ: { kind: service, lane: col-2, eyebrow: "処理", subtitle: "注文の処理" }
  - RDS: { kind: database, lane: col-3, eyebrow: "保存", subtitle: "永続化" }
  - Redis: { kind: cache, lane: col-3, eyebrow: "一時保存", subtitle: "高速化" }

flow:
  - ブラウザ -> CloudFront: "HTTPS" (accent, solid) { role: main, labelPlate: false }
  - CloudFront -> ALB: "オリジン" (accent, solid) { role: main, labelPlate: false }
  - ALB -> アプリ: "転送" (accent, solid) { role: main, labelPlate: false }
  - アプリ -> RDS: "SQL" (accent, solid) { labelPlate: false }
  - アプリ -> Redis: "GET/SET" (accent, solid) { labelPlate: false }

animation:
  - step: "1. ブラウザ" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ]
    body: "利用者から始まる。"
  - step: "2. CloudFront" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront"]
    body: "HTTPS を受ける。"
  - step: "3. ALB" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", ALB, "CloudFront -> ALB"]
    body: "CloudFront はオリジンの ALB へ要求を渡す。"
  - step: "4. アプリ" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", ALB, "CloudFront -> ALB", アプリ, "ALB -> アプリ"]
    body: "処理を担う。"
  - step: "クラウド・ネットワーク構成を階層で示す図" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", ALB, "CloudFront -> ALB", アプリ, "ALB -> アプリ", RDS, Redis, "アプリ -> RDS", "アプリ -> Redis"]
    body: "アプリは RDS に SQL で書き込み、Redis に一時保存する。"
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
    { "name": "ブラウザ", "kind": "person", "lane": "col-0", "eyebrow": "利用者", "subtitle": "利用者の画面" },
    { "name": "CloudFront", "kind": "cdn", "lane": "col-1", "eyebrow": "配信", "subtitle": "静的配信" },
    { "name": "ALB", "kind": "service", "lane": "col-2", "eyebrow": "振り分け", "subtitle": "負荷分散" },
    { "name": "アプリ", "kind": "service", "lane": "col-2", "eyebrow": "処理", "subtitle": "注文の処理" },
    { "name": "RDS", "kind": "database", "lane": "col-3", "eyebrow": "保存", "subtitle": "永続化" },
    { "name": "Redis", "kind": "cache", "lane": "col-3", "eyebrow": "一時保存", "subtitle": "高速化" }
  ],
  "flow": [
    { "from": "ブラウザ", "to": "CloudFront", "label": "HTTPS", "tone": "accent", "style": "solid", "role": "main", "labelPlate": false },
    { "from": "CloudFront", "to": "ALB", "label": "オリジン", "tone": "accent", "style": "solid", "role": "main", "labelPlate": false },
    { "from": "ALB", "to": "アプリ", "label": "転送", "tone": "accent", "style": "solid", "role": "main", "labelPlate": false },
    { "from": "アプリ", "to": "RDS", "label": "SQL", "tone": "accent", "style": "solid", "labelPlate": false },
    { "from": "アプリ", "to": "Redis", "label": "GET/SET", "tone": "accent", "style": "solid", "labelPlate": false }
  ],
  "animation": [
    {
      "step": "1. ブラウザ",
      "duration": 0.9,
      "focus": ["ブラウザ"],
      "body": "利用者から始まる。",
      "badge": "infrastructure"
    },
    {
      "step": "2. CloudFront",
      "duration": 0.9,
      "focus": ["ブラウザ", "CloudFront", "ブラウザ -> CloudFront"],
      "body": "HTTPS を受ける。",
      "badge": "infrastructure"
    },
    {
      "step": "3. ALB",
      "duration": 0.9,
      "focus": ["ブラウザ", "CloudFront", "ブラウザ -> CloudFront", "ALB", "CloudFront -> ALB"],
      "body": "CloudFront はオリジンの ALB へ要求を渡す。",
      "badge": "infrastructure"
    },
    {
      "step": "4. アプリ",
      "duration": 0.9,
      "focus": [
        "ブラウザ",
        "CloudFront",
        "ブラウザ -> CloudFront",
        "ALB",
        "CloudFront -> ALB",
        "アプリ",
        "ALB -> アプリ"
      ],
      "body": "処理を担う。",
      "badge": "infrastructure"
    },
    {
      "step": "クラウド・ネットワーク構成を階層で示す図",
      "duration": 0.9,
      "focus": [
        "ブラウザ",
        "CloudFront",
        "ブラウザ -> CloudFront",
        "ALB",
        "CloudFront -> ALB",
        "アプリ",
        "ALB -> アプリ",
        "RDS",
        "Redis",
        "アプリ -> RDS",
        "アプリ -> Redis"
      ],
      "body": "アプリは RDS に SQL で書き込み、Redis に一時保存する。",
      "badge": "infrastructure"
    }
  ]
}`;

export const sourceYaml__pattern__presetInfrastructure__複雑 = `title: "注文を受けてから発送の知らせを送るまでのクラウド構成図"
# 記法に構成図の型が無いため、簡単な版と同じく flow で書く。
# 列を縦列に、段を stack に置く = 同じ段に空いた列を挟まない
type: flow

lanes:
  col-0: { width: 380 }
  col-1: { width: 380 }
  col-2: { width: 380 }
  col-3: { width: 380 }
  col-4: { width: 380 }

actors:
  - S3: { kind: database, lane: col-1, stack: 0, eyebrow: "静的ファイル", subtitle: "画像と画面の部品" }
  - Cognito: { kind: service, lane: col-2, stack: 0, eyebrow: "認証", subtitle: "ログインを確かめる" }
  - Redis: { kind: cache, lane: col-3, stack: 0, eyebrow: "一時保存", subtitle: "在庫数を覚えておく" }
  - RDS 複製: { kind: database, lane: col-4, stack: 0, eyebrow: "読み取り", subtitle: "集計に使う写し" }
  - ブラウザ: { kind: person, lane: col-0, stack: 1, eyebrow: "利用者", subtitle: "注文する人の画面" }
  - CloudFront: { kind: cdn, lane: col-1, stack: 1, eyebrow: "配信", subtitle: "近い拠点から返す" }
  - ALB: { kind: service, lane: col-2, stack: 1, eyebrow: "振り分け", subtitle: "空いたタスクへ渡す" }
  - 注文 API: { kind: service, lane: col-3, stack: 1, eyebrow: "処理", subtitle: "ECS のタスク" }
  - RDS 主: { kind: database, lane: col-4, stack: 1, eyebrow: "書き込み", subtitle: "注文の台帳" }
  - SQS: { kind: queue, lane: col-3, stack: 2, eyebrow: "待ち行列", subtitle: "注文の知らせを溜める" }
  - 発送係: { kind: service, lane: col-4, stack: 2, eyebrow: "後ろの処理", subtitle: "Lambda の関数" }
  - SES: { kind: service, lane: col-4, stack: 3, eyebrow: "送信", subtitle: "発送の知らせを送る" }

# role: main はブラウザから台帳に書くまでの 4 本だけに書く
flow:
  - ブラウザ -> CloudFront: "HTTPS" (accent, solid) { role: main, labelPlate: false }
  - CloudFront -> S3: "静的ファイル" (accent, solid) { labelPlate: false }
  - CloudFront -> ALB: "オリジン" (accent, solid) { role: main, labelPlate: false }
  - ALB -> Cognito: "ログインを確かめる" (accent, solid) { labelPlate: false }
  - ALB -> 注文 API: "転送" (accent, solid) { role: main, labelPlate: false }
  - 注文 API -> Redis: "GET/SET" (accent, solid) { labelPlate: false }
  - 注文 API -> RDS 主: "SQL" (accent, solid) { role: main, labelPlate: false }
  - RDS 主 -> RDS 複製: "複製" (accent, solid) { labelPlate: false }
  - 注文 API -> SQS: "注文の知らせ" (accent, solid) { labelPlate: false }
  - SQS -> 発送係: "取り出す" (accent, solid) { labelPlate: false }
  - 発送係 -> RDS 主: "発送済みを書く" (accent, solid) { labelPlate: false }
  - 発送係 -> SES: "送る" (accent, solid) { labelPlate: false }

animation:
  - step: "1. 近い拠点へ繋ぐ" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront"]
    body: "ブラウザは近い拠点の CloudFront に HTTPS で繋ぐ。 ここから台帳に書くまでの 4 本が、要求の通る順路。"
  - step: "2. 画面の部品は S3 から" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", S3, "CloudFront -> S3"]
    body: "画像や画面の部品は、CloudFront が S3 から返す。 この線は順路から外れる枝で、アプリまで届かない。"
  - step: "3. 振り分けの前にログインを確かめる" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", S3, "CloudFront -> S3", ALB, Cognito, "CloudFront -> ALB", "ALB -> Cognito"]
    body: "画面の部品以外の要求は、オリジンの ALB へ渡る。 ALB は Cognito でログインを確かめてから通す。"
  - step: "4. 注文 API へ転送する" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", S3, "CloudFront -> S3", ALB, Cognito, "CloudFront -> ALB", "ALB -> Cognito", "注文 API", "ALB -> 注文 API"]
    body: "ALB は空いている ECS のタスクへ転送する。 タスクを増やしても入口は ALB の 1 つのまま。"
  - step: "5. 在庫数を一時保存から読む" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", S3, "CloudFront -> S3", ALB, Cognito, "CloudFront -> ALB", "ALB -> Cognito", "注文 API", "ALB -> 注文 API", Redis, "注文 API -> Redis"]
    body: "在庫数は Redis に覚えておく。 注文のたびに台帳を読まずに済む。"
  - step: "6. 台帳に書いて写しを作る" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", S3, "CloudFront -> S3", ALB, Cognito, "CloudFront -> ALB", "ALB -> Cognito", "注文 API", "ALB -> 注文 API", Redis, "注文 API -> Redis", "RDS 主", "RDS 複製", "注文 API -> RDS 主", "RDS 主 -> RDS 複製"]
    body: "注文は RDS 主に SQL で書く。 主は写しを RDS 複製へ送り、集計の読み取りは複製が受ける。"
  - step: "7. 知らせを待ち行列に置く" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", S3, "CloudFront -> S3", ALB, Cognito, "CloudFront -> ALB", "ALB -> Cognito", "注文 API", "ALB -> 注文 API", Redis, "注文 API -> Redis", "RDS 主", "RDS 複製", "注文 API -> RDS 主", "RDS 主 -> RDS 複製", SQS, "注文 API -> SQS"]
    body: "注文 API は発送の手配を待たない。 SQS に知らせを置いた時点で、ブラウザへ返事を返す。"
  - step: "8. 発送係が引き取る" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", S3, "CloudFront -> S3", ALB, Cognito, "CloudFront -> ALB", "ALB -> Cognito", "注文 API", "ALB -> 注文 API", Redis, "注文 API -> Redis", "RDS 主", "RDS 複製", "注文 API -> RDS 主", "RDS 主 -> RDS 複製", SQS, "注文 API -> SQS", 発送係, "SQS -> 発送係", "発送係 -> RDS 主"]
    body: "Lambda の発送係が知らせを取り出して手配する。 済んだら同じ RDS 主に発送済みを書く = 台帳へ書く線が 2 本入る。"
  - step: "注文を受けてから発送の知らせを送るまでのクラウド構成図" 0.9s
    badge: "infrastructure"
    focus: [ブラウザ, CloudFront, "ブラウザ -> CloudFront", S3, "CloudFront -> S3", ALB, Cognito, "CloudFront -> ALB", "ALB -> Cognito", "注文 API", "ALB -> 注文 API", Redis, "注文 API -> Redis", "RDS 主", "RDS 複製", "注文 API -> RDS 主", "RDS 主 -> RDS 複製", SQS, "注文 API -> SQS", 発送係, "SQS -> 発送係", "発送係 -> RDS 主", SES, "発送係 -> SES"]
    body: "発送係は SES で発送の知らせを送る。 注文を受けた処理と知らせを送る処理が、待ち行列で切り離されている。"
`;

/** 複雑な構成図の段で光る先。 記法の JSON は段ごとに前の段の分を積み上げて書く */
const infraComplexFocus: readonly (readonly string[])[] = [
  ["ブラウザ", "CloudFront", "ブラウザ -> CloudFront"],
  ["S3", "CloudFront -> S3"],
  ["ALB", "Cognito", "CloudFront -> ALB", "ALB -> Cognito"],
  ["注文 API", "ALB -> 注文 API"],
  ["Redis", "注文 API -> Redis"],
  ["RDS 主", "RDS 複製", "注文 API -> RDS 主", "RDS 主 -> RDS 複製"],
  ["SQS", "注文 API -> SQS"],
  ["発送係", "SQS -> 発送係", "発送係 -> RDS 主"],
  ["SES", "発送係 -> SES"],
];

export const sourceJson__pattern__presetInfrastructure__複雑 = JSON.stringify(
  {
    title: "注文を受けてから発送の知らせを送るまでのクラウド構成図",
    type: "flow",
    lanes: {
      "col-0": { width: 380 },
      "col-1": { width: 380 },
      "col-2": { width: 380 },
      "col-3": { width: 380 },
      "col-4": { width: 380 },
    },
    actors: [
      { name: "S3", kind: "database", lane: "col-1", stack: 0, eyebrow: "静的ファイル", subtitle: "画像と画面の部品" },
      { name: "Cognito", kind: "service", lane: "col-2", stack: 0, eyebrow: "認証", subtitle: "ログインを確かめる" },
      { name: "Redis", kind: "cache", lane: "col-3", stack: 0, eyebrow: "一時保存", subtitle: "在庫数を覚えておく" },
      { name: "RDS 複製", kind: "database", lane: "col-4", stack: 0, eyebrow: "読み取り", subtitle: "集計に使う写し" },
      { name: "ブラウザ", kind: "person", lane: "col-0", stack: 1, eyebrow: "利用者", subtitle: "注文する人の画面" },
      { name: "CloudFront", kind: "cdn", lane: "col-1", stack: 1, eyebrow: "配信", subtitle: "近い拠点から返す" },
      { name: "ALB", kind: "service", lane: "col-2", stack: 1, eyebrow: "振り分け", subtitle: "空いたタスクへ渡す" },
      { name: "注文 API", kind: "service", lane: "col-3", stack: 1, eyebrow: "処理", subtitle: "ECS のタスク" },
      { name: "RDS 主", kind: "database", lane: "col-4", stack: 1, eyebrow: "書き込み", subtitle: "注文の台帳" },
      { name: "SQS", kind: "queue", lane: "col-3", stack: 2, eyebrow: "待ち行列", subtitle: "注文の知らせを溜める" },
      { name: "発送係", kind: "service", lane: "col-4", stack: 2, eyebrow: "後ろの処理", subtitle: "Lambda の関数" },
      { name: "SES", kind: "service", lane: "col-4", stack: 3, eyebrow: "送信", subtitle: "発送の知らせを送る" },
    ],
    flow: [
      { from: "ブラウザ", to: "CloudFront", label: "HTTPS", tone: "accent", style: "solid", role: "main", labelPlate: false },
      { from: "CloudFront", to: "S3", label: "静的ファイル", tone: "accent", style: "solid", labelPlate: false },
      { from: "CloudFront", to: "ALB", label: "オリジン", tone: "accent", style: "solid", role: "main", labelPlate: false },
      { from: "ALB", to: "Cognito", label: "ログインを確かめる", tone: "accent", style: "solid", labelPlate: false },
      { from: "ALB", to: "注文 API", label: "転送", tone: "accent", style: "solid", role: "main", labelPlate: false },
      { from: "注文 API", to: "Redis", label: "GET/SET", tone: "accent", style: "solid", labelPlate: false },
      { from: "注文 API", to: "RDS 主", label: "SQL", tone: "accent", style: "solid", role: "main", labelPlate: false },
      { from: "RDS 主", to: "RDS 複製", label: "複製", tone: "accent", style: "solid", labelPlate: false },
      { from: "注文 API", to: "SQS", label: "注文の知らせ", tone: "accent", style: "solid", labelPlate: false },
      { from: "SQS", to: "発送係", label: "取り出す", tone: "accent", style: "solid", labelPlate: false },
      { from: "発送係", to: "RDS 主", label: "発送済みを書く", tone: "accent", style: "solid", labelPlate: false },
      { from: "発送係", to: "SES", label: "送る", tone: "accent", style: "solid", labelPlate: false },
    ],
    animation: [
      ["1. 近い拠点へ繋ぐ", "ブラウザは近い拠点の CloudFront に HTTPS で繋ぐ。 ここから台帳に書くまでの 4 本が、要求の通る順路。"],
      ["2. 画面の部品は S3 から", "画像や画面の部品は、CloudFront が S3 から返す。 この線は順路から外れる枝で、アプリまで届かない。"],
      ["3. 振り分けの前にログインを確かめる", "画面の部品以外の要求は、オリジンの ALB へ渡る。 ALB は Cognito でログインを確かめてから通す。"],
      ["4. 注文 API へ転送する", "ALB は空いている ECS のタスクへ転送する。 タスクを増やしても入口は ALB の 1 つのまま。"],
      ["5. 在庫数を一時保存から読む", "在庫数は Redis に覚えておく。 注文のたびに台帳を読まずに済む。"],
      ["6. 台帳に書いて写しを作る", "注文は RDS 主に SQL で書く。 主は写しを RDS 複製へ送り、集計の読み取りは複製が受ける。"],
      ["7. 知らせを待ち行列に置く", "注文 API は発送の手配を待たない。 SQS に知らせを置いた時点で、ブラウザへ返事を返す。"],
      ["8. 発送係が引き取る", "Lambda の発送係が知らせを取り出して手配する。 済んだら同じ RDS 主に発送済みを書く = 台帳へ書く線が 2 本入る。"],
      ["注文を受けてから発送の知らせを送るまでのクラウド構成図", "発送係は SES で発送の知らせを送る。 注文を受けた処理と知らせを送る処理が、待ち行列で切り離されている。"],
    ].map(([step, body], i) => ({
      step,
      duration: 0.9,
      focus: infraComplexFocus.slice(0, i + 1).flat(),
      body,
      badge: "infrastructure",
    })),
  },
  null,
  2,
);
