// @vitest-environment jsdom
/**
 * 列の図 (#3239)。
 *
 * 1 枚の盤の上でチップの列が動き、並びが変わり、隠れ、現れる様子を段で追う図。原本の JSON の `kind` は `lineup` で、
 * 箱 (`blocks.box`) が列、チップ (`blocks.item`) がチップの宣言で、段の中の `line` が列の並びを書き換える。
 * 書き手は並びだけを書き、dragon が前の段との差分を動きに変える。チップは前に居た列から滑り、どの列にも居なかったチップは弾んで現れ、
 * 列から外れたチップは消える。元の列を書き換えない時は元の列にも残る。
 * `seal` は列を左から覆って中身を隠し、`open` は封を消し、`pick` は列の縁に色を付けてほかの列を薄くし、`stamp` は札を押す。
 * 見た目の元は step 2 で本人が選んだ見本 (同じ 6 場面を 3 つの形で動かした 1 枚) の「列の図」。
 *
 * 卓の形 (#3351)。箱は札として左から横に並び、札の中にチップを上から積み、`note` の字を札の下に大きく出す。`[order: none]` の箱は順番の無い置き場になる。
 * 役 (`role`) の札を箱の上に並べ、段で動く役を光らせ、段の題を図の上に、後の段の題を「この先」の帯に、チップの説明 (`item` の `note`) を凡例に出す。
 * 箱を横に並べると箱の名前が読めない枠の幅では、置き場を帯にして札の列の上と下に積む。
 * 見た目の元は `docs/design/lineup/auction.pen` の 2 枚の板 (卓の形と、携帯の幅で縦に組んだ形)。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、濃さと位置は SVG の keyframes を jsdom で読んで確かめる。
 * 見本の file と列の図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  api,
  type Json,
  type LineError,
  patched,
  pointers,
  smallArchitecture,
  smallSequence,
} from "./diagram-support";

import { type Motion, motionFrom } from "./motion-support";
import {
  covers,
  draw,
  figureClass,
  gap,
  type LaidBox,
  type Layout,
  type Rect,
  type Rendered,
  sampleTimes,
} from "./render-support";

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** 入札の図の 7 段の題 (step 4 で決めた) */
const AUCTION_STEPS = [
  "トランザクションが列に並ぶ",
  "ビルダーが順序を決めて入札する",
  "リレーが封をして中身を隠す",
  "提案者に金額だけを見せる",
  "提案者が中身を見ずに署名する",
  "封を開けて全文を公開する",
  "バリデーターが投票する",
] as const;

/** 入札の図のビルダーの列 */
const BUILDERS = ["ビルダーA", "ビルダーB", "ビルダーC"] as const;

/** 1 列に並べられるチップの上限 */
const MOST = 12;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 列の中の字。`text` は描く字 */
type Writing = Rect & { text: string };

/** 箱。置き場 (`pool`) か札で、`track` はチップを置く所、`hint` は枠の頭の名前の下の字 (「上から実行」か「順番なし」)、`note` は札の下の端の字 */
interface Lane extends Rect {
  id: string;
  name: string;
  pool?: boolean;
  title: Writing;
  hint?: Writing;
  note?: Writing;
  track: Rect;
}

/** チップが箱の席に居る間 1 回分。`from` は滑り始める左上で、弾んで現れるチップは持たない。`label` はチップの枠の中の字 */
interface Seat extends Rect {
  id: string;
  lane: string;
  index: number;
  step: number;
  event: number;
  from?: [number, number];
  label?: Writing;
}

/** 役の札。`note` は名前の下の一言 */
interface Role extends Rect {
  id: string;
  title: Writing;
  note?: Writing;
}

/** 段の出来事に結んだ字の置き場所 */
type AtStep = { step: number };

interface LineupLayout extends Omit<Layout, "boxes"> {
  kind: string;
  /** 箱を横に並べたか (`row`)、置き場を帯にして札の列の上下に積んだか (`stack`) */
  arrangement?: "row" | "stack";
  boxes: LaidBox[];
  lanes: Lane[];
  chips: Seat[];
  seals: (Rect & { lane: string; step: number; event: number })[];
  stamps: (Writing & { lane: string; step: number; event: number })[];
  roles?: Role[];
  /** 「選ばれる」の印 */
  marks?: (Writing & { lane: string; step: number; event: number })[];
  /** 段ごとの図の上の題と `say` の文 */
  headlines?: (AtStep & { title: Writing; say?: Writing })[];
  /** 札の下の一言。`bar` は色の縦棒 */
  remarks?: (AtStep & { lane: string; color?: string; bar: Rect; text: Writing })[];
  /** 段ごとの「この先」の帯。札は後の段の題 */
  aheads?: (AtStep & { tags: (Rect & AtStep & { text: Writing })[] })[];
  /** 凡例の行。`swatch` は色の枠の見本 */
  legend?: { color?: string; swatch: Rect; text: Writing }[];
  /** 置き場と札の間の矢印 */
  arrows?: { from: string; to: string; points: [number, number][] }[];
}

interface LineupRendered extends Omit<Rendered, "layout"> {
  layout: LineupLayout;
}

interface SourceEvent {
  type: string;
  box?: string;
  items?: string[];
  role?: string;
}

interface Source {
  kind: string;
  title: string;
  view?: string;
  blocks: {
    box?: { id: string; name: string; order?: string }[];
    item?: { id: string; color?: string; label?: string; note?: string }[];
    role?: { id: string; note?: string }[];
  };
  steps: { title: string; body?: string; events: SourceEvent[] }[];
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** 見本の原本の JSON。無ければ落とす */
function exampleJson(name: string): Json {
  const text = fileText(name);
  expect(text, `${name} が packages/dragon/examples に無い`).toBeDefined();
  return JSON.parse(text ?? "{}") as Json;
}

/** 描いた図。`width` は描く枠の幅。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en", width?: number): LineupRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, {
      ...(lang ? { lang } : {}),
      ...(width === undefined ? {} : { width }),
    });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "列の図を描けない").toBe("");
  expect(
    (rendered as unknown as LineupRendered | undefined)?.layout?.lanes,
    "並べた列の図に列 (layout.lanes) が無い",
  ).toBeDefined();
  return rendered as unknown as LineupRendered;
}

const laneOf = (layout: LineupLayout, id: string): Lane => {
  const lane = layout.lanes.find((l) => l.id === id);
  expect(lane, `列 ${id} が並べた図に無い`).toBeDefined();
  return lane as Lane;
};

/** 描いた図の部品。無ければ落とす */
function partOf(motion: Motion, selector: string): Element {
  const el = motion.doc.querySelector(selector);
  expect(el, `描いた図に ${selector} の部品が無い`).not.toBeNull();
  return el as Element;
}

/** 部品の見える濃さ。動きの濃さに、部品と包む部品の `opacity` の属性も掛ける */
function seenOf(motion: Motion, el: Element, t: number): number {
  let o = motion.opacity(el, t);
  for (let e: Element | null = el; e; e = e.parentElement) {
    const attr = e.getAttribute("opacity");
    if (attr !== null) o *= Number(attr);
  }
  return o;
}

const seen = (motion: Motion, selector: string, t: number): number =>
  seenOf(motion, partOf(motion, selector), t);

/** 列 `lane` のチップの部品のうち、時刻 `t` に濃さが `low` 以上の物の左上と大きさ。上から、同じ高さなら左から並べる */
function chipsIn(
  motion: Motion,
  lane: string,
  t: number,
  low = 0.9,
): { id: string; x: number; y: number; scale: number }[] {
  return [...motion.doc.querySelectorAll(`[data-lineup-on="${lane}"]`)]
    .flatMap((el) => {
      if (seenOf(motion, el, t) < low) return [];
      const rect = el.querySelector("rect");
      const [dx = 0, dy = 0, scale = 1] = motion.value(el, "transform", t) ?? [];
      return [
        {
          id: el.getAttribute("data-lineup-chip") ?? "",
          x: Number(rect?.getAttribute("x")) + dx,
          y: Number(rect?.getAttribute("y")) + dy,
          scale,
        },
      ];
    })
    .sort((a, b) => (Math.abs(a.y - b.y) < 1 ? a.x - b.x : a.y - b.y));
}

const namesIn = (motion: Motion, lane: string, t: number, low?: number): string[] =>
  chipsIn(motion, lane, t, low).map((c) => c.id);

/** 段 `step` の `event` 番目の出来事の時刻。無ければ落とす */
function timeOf(
  rendered: LineupRendered,
  step: number,
  event: number,
): { start: number; drawn: number } {
  const time = rendered.timeline.edges.find((e) => e.step === step && e.event === event);
  expect(time, `段 ${step + 1} の ${event + 1} 番目の出来事の時刻が表に無い`).toBeDefined();
  return time as { start: number; drawn: number };
}

const lineEvent = (box: string, items: string[]): Json => ({ type: "line", box, items });
const sealEvent = (box: string): Json => ({ type: "seal", box });
const openEvent = (box: string): Json => ({ type: "open", box });
const pickEvent = (box: string): Json => ({ type: "pick", box });
const stampEvent = (box: string, text: string): Json => ({ type: "stamp", box, text });
const noteEvent = (box: string, text: string): Json => ({ type: "swap", box, text });
const roleEvent = (role: string): Json => ({ type: "role", role });
const stepOf = (title: string, events: Json[]): Json => ({ title, body: `${title}。`, events });

/** 列 2 つとチップ 3 つを持ち、5 つの出来事を全部使う最小の列の図 */
function smallLineup(): Json {
  return {
    version: 1,
    kind: "lineup",
    title: "小さな列の図",
    boxes: [
      { id: "甲", name: "列の甲", sub: "値 1" },
      { id: "乙", name: "列の乙", color: "amber" },
    ],
    lineup: {
      items: [{ id: "a", color: "amber", label: "12" }, { id: "b", color: "blue" }, { id: "c" }],
    },
    steps: [
      stepOf("並べる", [lineEvent("甲", ["a", "b", "c"])]),
      stepOf("移す", [lineEvent("乙", ["c", "a"])]),
      stepOf("封をする", [sealEvent("乙")]),
      stepOf("選ぶ", [pickEvent("乙")]),
      stepOf("札を押す", [stampEvent("乙", "済み")]),
      stepOf("開ける", [openEvent("乙")]),
    ],
  };
}

/** チップが列を移り、列の中で並びを変え、列から外れ、初めて現れる図 */
function movingLineup(): Json {
  return {
    version: 1,
    kind: "lineup",
    title: "動く列の図",
    boxes: [
      { id: "上", name: "上の列" },
      { id: "下", name: "下の列" },
    ],
    lineup: {
      items: [
        { id: "x", color: "amber" },
        { id: "y", color: "blue" },
        { id: "z", color: "green" },
      ],
    },
    steps: [
      stepOf("並べる", [lineEvent("上", ["x", "y"])]),
      stepOf("移す", [lineEvent("下", ["y", "x"])]),
      stepOf("並べ直す", [lineEvent("上", ["y", "z"])]),
    ],
  };
}

/** 封をして、封をしたまま段を進め、開ける図 */
function sealedLineup(): Json {
  return {
    version: 1,
    kind: "lineup",
    title: "封の図",
    boxes: [
      { id: "甲", name: "列の甲" },
      { id: "乙", name: "列の乙" },
    ],
    lineup: {
      items: [
        { id: "a", color: "amber" },
        { id: "b", color: "blue" },
        { id: "c", color: "green" },
      ],
    },
    steps: [
      stepOf("並べる", [lineEvent("甲", ["a", "b", "c"]), lineEvent("乙", ["a"])]),
      stepOf("封をする", [sealEvent("甲")]),
      stepOf("待つ", [noteEvent("甲", "待つ")]),
      stepOf("開ける", [openEvent("甲")]),
    ],
  };
}

/** 列を選び、選ばなかった列を後で書き換える図 */
function pickedLineup(): Json {
  return {
    version: 1,
    kind: "lineup",
    title: "選ぶ図",
    boxes: [
      { id: "甲", name: "列の甲" },
      { id: "乙", name: "列の乙" },
      { id: "丙", name: "列の丙" },
    ],
    lineup: {
      items: [
        { id: "a", color: "amber" },
        { id: "b", color: "blue" },
      ],
    },
    steps: [
      stepOf("並べる", [lineEvent("甲", ["a"]), lineEvent("乙", ["a"]), lineEvent("丙", ["a"])]),
      stepOf("選ぶ", [pickEvent("乙")]),
      stepOf("書き換える", [lineEvent("丙", ["b"])]),
    ],
  };
}

/** 1 列に `count` 枚を並べる図 */
function rowOf(count: number): Json {
  const ids = Array.from({ length: count }, (_, i) => `c${i}`);
  return {
    version: 1,
    kind: "lineup",
    title: "枚数の図",
    boxes: [{ id: "甲", name: "列の甲" }],
    lineup: { items: ids.map((id) => ({ id })) },
    steps: [stepOf("並べる", [lineEvent("甲", ids)]), stepOf("待つ", [pickEvent("甲")])],
  };
}

/**
 * 卓の形の図 (#3351)。置き場 2 つの間に札 2 つを置き、役 2 つと、説明を持つチップを持つ。
 * 段 2 で札に並べ、段 3 で封をし、段 4 で選び、段 5 で開け、段 6 で出口の置き場へ並べる
 */
function tableLineup(): Json {
  return {
    version: 1,
    kind: "lineup",
    title: "卓の図",
    boxes: [
      { id: "池", name: "待ちの池", order: "none" },
      { id: "甲", name: "札の甲", sub: "1.5 ETH" },
      { id: "乙", name: "札の乙" },
      { id: "出口", name: "出口", order: "none" },
    ],
    lineup: {
      roles: [{ id: "封じ手", note: "中身を隠す" }, { id: "選び手" }],
      items: [
        { id: "送金", note: "取引" },
        { id: "自分", color: "amber", note: "自分の取引" },
        { id: "裏", color: "blue", note: "裏の取引" },
        { id: "交換", note: "取引" },
      ],
    },
    steps: [
      stepOf("並べる", [lineEvent("池", ["送金", "自分", "交換"])]),
      stepOf("組む", [
        lineEvent("甲", ["送金", "自分", "交換"]),
        lineEvent("乙", ["裏", "送金", "交換"]),
        noteEvent("乙", "0.9 ETH"),
      ]),
      stepOf("封をする", [roleEvent("封じ手"), sealEvent("甲"), sealEvent("乙")]),
      stepOf("選ぶ", [roleEvent("選び手"), pickEvent("甲")]),
      stepOf("開ける", [roleEvent("封じ手"), openEvent("甲")]),
      stepOf("出す", [lineEvent("出口", ["送金", "自分"])]),
    ],
  };
}

/** 置き場と札に `count` 枚ずつ置く図。`card` が偽なら置き場だけを持つ */
function heapOf(count: number, card = true): Json {
  const ids = Array.from({ length: count }, (_, i) => `取${i}`);
  return {
    version: 1,
    kind: "lineup",
    title: "積む図",
    boxes: [{ id: "池", name: "池", order: "none" }, ...(card ? [{ id: "札", name: "札" }] : [])],
    lineup: { items: ids.map((id) => ({ id })) },
    steps: [
      stepOf("置く", [lineEvent("池", ids)]),
      ...(card ? [stepOf("積む", [lineEvent("札", ids)])] : []),
    ],
  };
}

/** 置き場 1 つと札 3 つと置き場 1 つを並べ、最初の置き場に字の幅の違う 7 枚のチップを置く図 (bitsumi のメモリプールの図と同じ形、#3408) */
function mempoolLineup(): Json {
  const ids = ["他1", "他2", "自分", "他3", "他4", "他5", "他6"];
  return {
    version: 1,
    kind: "lineup",
    title: "メモリプールの図",
    boxes: [
      { id: "池", name: "メモリプール", order: "none" },
      { id: "甲", name: "ビルダーA" },
      { id: "乙", name: "ビルダーB" },
      { id: "丙", name: "ビルダーC" },
      { id: "出口", name: "バリデーター", order: "none" },
    ],
    lineup: { items: ids.map((id): Json => (id === "自分" ? { id, color: "amber" } : { id })) },
    steps: [stepOf("並ぶ", [lineEvent("池", ids)]), stepOf("組む", [lineEvent("甲", ids)])],
  };
}

/** 置き場のチップが格子に並ぶか。行の上端と列の左端と幅が揃い、上下の間と左右の間がそれぞれ全て同じ */
function expectGrid(chips: Seat[]): void {
  expect(chips.length, "置き場に置いたチップの数").toBe(7);
  const key = (v: number): number => Math.round(v * 1000) / 1000;
  for (const c of chips)
    expect(c.w, `${c.id} の幅が最も広いチップの幅と揃わない`).toBeCloseTo(
      Math.max(...chips.map((d) => d.w)),
      6,
    );
  const xs = [...new Set(chips.map((c) => key(c.x)))].sort((a, b) => a - b);
  const ys = [...new Set(chips.map((c) => key(c.y)))].sort((a, b) => a - b);
  expect(xs.length, `列の数 (左端 ${xs.join(", ")})`).toBeGreaterThan(1);
  expect(ys.length, `行の数 (上端 ${ys.join(", ")})`).toBe(Math.ceil(chips.length / xs.length));
  // 間は 2 つ以上の列か行がある時だけ数える (広い帯では 7 枚が 1 行に収まる)
  const steps = (vs: number[]): number[] => vs.slice(1).map((v, i) => key(v - (vs[i] as number)));
  const [w, h] = [chips[0]?.w ?? 0, chips[0]?.h ?? 0];
  expect(new Set(steps(xs)).size, `左右の間 (${steps(xs).join(", ")})`).toBe(1);
  expect((steps(xs)[0] ?? 0) - w, "左右のチップが重なる").toBeGreaterThan(0);
  if (ys.length > 1) {
    expect(new Set(steps(ys)).size, `上下の間 (${steps(ys).join(", ")})`).toBe(1);
    expect((steps(ys)[0] ?? 0) - h, "上下のチップが重なる").toBeGreaterThan(0);
  }
}

/** 字を持つチップと、色の無いチップと、色付きのチップを、置き場と札の両方に置く図 */
function chipsLineup(): Json {
  return {
    version: 1,
    kind: "lineup",
    title: "チップの図",
    boxes: [
      { id: "池", name: "池", order: "none" },
      { id: "甲", name: "札の甲" },
    ],
    lineup: {
      items: [
        { id: "a", color: "amber", label: "12" },
        { id: "送金" },
        { id: "裏", color: "blue" },
      ],
    },
    steps: [
      stepOf("置く", [lineEvent("池", ["a", "送金", "裏"])]),
      stepOf("積む", [lineEvent("甲", ["a", "送金", "裏"])]),
    ],
  };
}

/** チップの字の高さ。チップが字を持たなければ落とす */
function chipTextH(layout: LineupLayout): number {
  const label = layout.chips.find((c) => c.label)?.label;
  expect(label, "チップが枠の中の字 (label) を持たない").toBeDefined();
  return label?.h ?? Number.POSITIVE_INFINITY;
}

/** 原本の JSON の、列とチップと段と段ごとの出来事の数 */
const shape = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  lanes: (d.blocks.box ?? []).length,
  items: (d.blocks.item ?? []).length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.length),
});

describe("列の図の原本の JSON (#3239)", () => {
  it("schema-accepts-lineup-diagram", () => {
    const validate = api("validateDiagram");
    const checked = validate(smallLineup());
    expect(
      checked.ok,
      `最小の列の図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`,
    ).toBe(true);
    // 上限の 12 枚の列も、note の書き換えも通る
    const row = validate(rowOf(MOST));
    expect(row.ok, `12 枚の列が検査で落ちる: ${JSON.stringify(row.ok ? [] : row.errors)}`).toBe(
      true,
    );
    const sealed = validate(sealedLineup());
    expect(
      sealed.ok,
      `note を書き換える列の図が検査で落ちる: ${JSON.stringify(sealed.ok ? [] : sealed.errors)}`,
    ).toBe(true);
  });

  it("schema-rejects-misplaced-lineup-events", () => {
    const validate = api("validateDiagram");
    const edge: Json = { type: "edge", from: "甲", to: "乙", carry: { kind: "envelope" } };
    const cases: [string, Json, string][] = [
      [
        "時系列図に line の出来事",
        patched(smallSequence(), ["steps", 0, "events"], [lineEvent("a", ["x"])]),
        "/steps/0/events/0/type",
      ],
      [
        "時系列図に seal の出来事",
        patched(smallSequence(), ["steps", 0, "events"], [sealEvent("a")]),
        "/steps/0/events/0/type",
      ],
      [
        "構成図に open の出来事",
        patched(smallArchitecture(), ["steps", 0, "events"], [openEvent("a")]),
        "/steps/0/events/0/type",
      ],
      [
        "構成図に pick の出来事",
        patched(smallArchitecture(), ["steps", 0, "events"], [pickEvent("a")]),
        "/steps/0/events/0/type",
      ],
      [
        "時系列図に stamp の出来事",
        patched(smallSequence(), ["steps", 0, "events"], [stampEvent("a", "済み")]),
        "/steps/0/events/0/type",
      ],
      [
        "時系列図に lineup の欄",
        patched(smallSequence(), ["lineup"], { items: [{ id: "a" }] }),
        "/lineup",
      ],
      [
        "列の図に git の欄",
        patched(smallLineup(), ["git"], { branches: [{ id: "main" }] }),
        "/git",
      ],
      [
        "列の図に state の欄",
        patched(smallLineup(), ["state"], { paths: [{ from: "a", to: "b" }] }),
        "/state",
      ],
      [
        "列の図に sequence の欄",
        patched(smallLineup(), ["sequence"], { lifelines: ["a"] }),
        "/sequence",
      ],
      [
        "列の図に time の欄",
        patched(smallLineup(), ["time"], { scale: { unit: "slot", length: "12s", count: 4 } }),
        "/time",
      ],
      [
        "列の図に線の出来事",
        patched(smallLineup(), ["steps", 0, "events"], [edge]),
        "/steps/0/events/0/type",
      ],
      [
        "列の図に処理の出来事",
        patched(
          smallLineup(),
          ["steps", 0, "events"],
          [{ type: "action", box: "甲", label: "処理" }],
        ),
        "/steps/0/events/0/type",
      ],
      [
        "5 字の字のチップ",
        patched(smallLineup(), ["lineup", "items", 0, "label"], "12345"),
        "/lineup/items/0/label",
      ],
      ["チップの無い図", patched(smallLineup(), ["lineup", "items"], []), "/lineup/items"],
      [
        "13 枚の列",
        patched(
          rowOf(MOST),
          ["steps", 0, "events"],
          [
            lineEvent(
              "甲",
              Array.from({ length: MOST + 1 }, (_, i) => `c${i}`),
            ),
          ],
        ),
        "/steps/0/events/0/items",
      ],
    ];
    for (const [name, input, pointer] of cases) {
      const ja = validate(input);
      expect(pointers(ja), `${name} の誤りの場所`).toContain(pointer);
      const en = validate(input, { lang: "en" });
      expect(pointers(en), `${name} の英語の誤りの場所`).toContain(pointer);
      const messages = en.ok ? [] : en.errors.map((e) => e.message);
      expect(
        messages.filter((m) => KANA.test(m)),
        `${name} の英語の誤りの文に仮名か漢字がある`,
      ).toEqual([]);
    }
  });
});

describe("列の図の記法 (#3239)", () => {
  it("notation-compiles-lineup-examples-to-json", () => {
    const parse = api("parseNotation");
    for (const name of ["auction", "auction.en"]) {
      const text = fileText(`${name}.dragon`);
      expect(text, `${name}.dragon が無い`).toBeDefined();
      const parsed = parse(text ?? "", { lang: name.endsWith(".en") ? "en" : "ja" });
      expect(
        parsed.ok,
        `${name}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`,
      ).toBe(true);
      expect(
        parsed.ok ? parsed.diagram : undefined,
        `${name}.dragon から作った JSON が ${name}.json と違う`,
      ).toEqual(exampleJson(`${name}.json`));
    }
    // 1 行に名札を並べた item は、並べた名札ごとに同じ色と字のチップになる
    const many = parse(
      [
        "lineup 宣言",
        "box top",
        "item a, b [color: amber, label: 7]",
        "item c",
        "step 並べる",
        "  say 並べる。",
        "  line top: c, a, b",
      ].join("\n"),
    );
    expect(
      many.ok ? (many.diagram as unknown as Source).blocks.item : many.errors,
      "item の行が宣言するチップ",
    ).toEqual([
      { id: "a", color: "amber", label: "7" },
      { id: "b", color: "amber", label: "7" },
      { id: "c" },
    ]);
  });

  it("notation-rejects-misused-lineup-lines", () => {
    const parse = api("parseNotation");
    // 誤りの文は書き手の名札をそのまま引くので、英語の文を確かめるこの検査の名札は英字にする
    const head = ["lineup 小さな列", "box top", "box low", "item a, b, c"];
    const step = ["step 並べる", "  say 並べる。", "  line top: a, b"];
    const many = Array.from({ length: MOST + 1 }, (_, i) => `c${i}`);
    const crowded = `  line top: ${many.join(", ")}`;
    // 記法の行と、誤りの行 (0 から数える) と、その行の中の誤りを指す語の位置 (0 から数える)
    const at = (line: string, token: string, from = 0): number => line.indexOf(token, from);
    const cases: [string, string[], number, number][] = [
      [
        "宣言していないチップの line",
        [...head, ...step, "  line low: a, zz"],
        7,
        at("  line low: a, zz", "zz"),
      ],
      [
        "宣言していない列の line",
        [...head, ...step, "  line mid: a"],
        7,
        at("  line mid: a", "mid"),
      ],
      [
        "同じチップを 2 度書いた line",
        [...head, ...step, "  line low: a, b, a"],
        7,
        at("  line low: a, b, a", "a", 14),
      ],
      [
        "上限を超える line",
        [
          "lineup 小さな列",
          "box top",
          `item ${many.join(", ")}`,
          "step 並べる",
          "  say 並べる。",
          crowded,
        ],
        5,
        at(crowded, `c${MOST}`),
      ],
      [
        "最初の step より前の line",
        ["lineup 小さな列", "box top", "item a", "line top: a", "step 並べる", "  say 並べる。"],
        3,
        0,
      ],
      [
        "封をした列への line",
        [...head, ...step, "  seal top", "  line top: a"],
        8,
        at("  line top: a", "top"),
      ],
      ["封をしていない列への open", [...head, ...step, "  open top"], 7, at("  open top", "top")],
      [
        "封をした列への 2 度目の seal",
        [...head, ...step, "  seal top", "  seal top"],
        8,
        at("  seal top", "top"),
      ],
      ["線の行", [...head, ...step, "  top -> low: 送る"], 7, 2],
      [
        "group の行",
        [
          "lineup 小さな列",
          "group g",
          "  box top",
          "end",
          "item a",
          "step 並べる",
          "  say 並べる。",
        ],
        1,
        0,
      ],
      ["act の行", [...head, ...step, "  act top: 処理"], 7, 2],
      ["item の行が無い図", ["lineup 小さな列", "box top", "step 並べる", "  say 並べる。"], 0, 0],
    ];
    for (const [name, lines, row, column] of cases) {
      const want = { line: row + 1, column: column + 1 };
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(
          first && { line: first.line, column: first.column },
          `${name} の誤りの行と列 (${lang})`,
        ).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en")
          expect(
            KANA.test(first?.message ?? ""),
            `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`,
          ).toBe(false);
      }
    }
  });

  it("notation-limits-lineup-lines-to-lineup", () => {
    const parse = api("parseNotation");
    const heads: [string, string[]][] = [
      ["時系列図", ["sequence 列の行", "box a", "step 送る", "  say 送る。"]],
      ["構成図", ["architecture 列の行", "box a", "step 送る", "  say 送る。"]],
      ["状態遷移図", ["state 列の行", "box a", "step 送る", "  say 送る。"]],
      ["枝分かれの図", ["git 列の行", "branch main", "step 積む", "  say 積む。"]],
      ["時間軸の図", ["time 列の行", "scale slot 12s 4", "row a", "step 進む", "  say 進む。"]],
      ["木の図", ["tree 列の行", "step 葉", "  say 葉。", "  leaf x1"]],
    ];
    for (const [name, head] of heads) {
      for (const line of ["item x", "line a: x", "seal a", "open a", "pick a", "stamp a: 済み"]) {
        for (const lang of ["ja", "en"] as const) {
          const parsed = parse([...head, `  ${line}`].join("\n"), { lang });
          const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
          expect(
            first?.line,
            `${name} の ${line} が ${head.length + 1} 行目の誤りにならない (${lang})`,
          ).toBe(head.length + 1);
          // 列の図の頭の語を名指して、その図でしか書けないことを示す
          expect(
            first?.message ?? "",
            `${name} の ${line} の誤りの文が列の図 (lineup) を名指さない (${lang})`,
          ).toContain("lineup");
          if (lang === "en")
            expect(
              KANA.test(first?.message ?? ""),
              `${name} の ${line} の英語の誤りの文に仮名か漢字がある: ${first?.message}`,
            ).toBe(false);
        }
      }
    }
  });

  it("notation-keeps-lineup-words-plain-outside-lineup", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture"] as const) {
      const text = [
        `${kind} 列の語の名札`,
        "box item as 品物",
        "box line as 回線",
        "box db",
        "step 送る",
        "  say 送る。",
        "  line -> db: 送る",
        "  item -> line: 戻す",
      ].join("\n");
      const parsed = parse(text);
      expect(
        parsed.ok,
        `${kind} で item と line を名札にした箱が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`,
      ).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as {
        blocks?: { box?: { id: string }[] };
        steps?: { events: { type: string; from?: string; to?: string }[] }[];
      };
      expect(
        diagram.blocks?.box?.map((b) => b.id),
        `${kind} の箱の名札`,
      ).toEqual(["item", "line", "db"]);
      expect(
        diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })),
        `${kind} の line と item から出る線`,
      ).toEqual([
        { type: "edge", from: "line", to: "db" },
        { type: "edge", from: "item", to: "line" },
      ]);
    }
  });

  it("lineup-roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of ["auction.dragon", "auction.en.dragon"]) {
      const text = fileText(name);
      expect(text, `${name} が無い`).toBeDefined();
      const first = parse(text ?? "");
      expect(first.ok, `${name} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(
        true,
      );
      if (!first.ok) continue;
      const printed = print(first.diagram);
      const second = parse(printed);
      expect(
        second.ok,
        `${name} を書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`,
      ).toBe(true);
      expect(
        second.ok ? second.diagram : undefined,
        `${name} を往復した JSON が最初と違う`,
      ).toEqual(first.diagram);
    }
    // 字を持つチップと持たないチップが混ざっても往復する。版1で書いた小さな図は、読んで版2の形にしてから往復させる
    const read = api("readDiagram")(smallLineup());
    const source = read.ok ? read.diagram : read.errors;
    const printed = print(source);
    const again = parse(printed);
    expect(
      again.ok ? again.diagram : again.errors,
      `小さな列の図を往復した JSON が最初と違う\n${printed}`,
    ).toEqual(source);
  });
});

describe("列の図の並べ方 (#3239)", () => {
  it("lineup-chips-slide-from-where-they-were", () => {
    const rendered = render(movingLineup());
    const motion = motionFrom(rendered);
    const { stills } = rendered.timeline;
    const at = (s: number): number => stills[s] ?? 0;
    expect(namesIn(motion, "上", at(0)), "段 1 の上の列").toEqual(["x", "y"]);
    expect(namesIn(motion, "下", at(0)), "段 1 の下の列").toEqual([]);

    // 段 2。チップは前に居た列から滑り、元の列を書き換えないので元の列にも残る
    expect(namesIn(motion, "下", at(1)), "段 2 の下の列").toEqual(["y", "x"]);
    expect(namesIn(motion, "上", at(1)), "段 2 の元の列のチップが残らない").toEqual(["x", "y"]);
    const before = chipsIn(motion, "上", at(0));
    const after = chipsIn(motion, "下", at(1));
    const slide = timeOf(rendered, 1, 0);
    const where = (
      list: { id: string; x: number; y: number }[],
      id: string,
    ): { x: number; y: number } => {
      const found = list.find((c) => c.id === id);
      expect(found, `チップ ${id} が見えない`).toBeDefined();
      return found as { x: number; y: number };
    };
    const start = where(chipsIn(motion, "下", slide.start + 0.01), "y");
    expect(
      Math.hypot(start.x - where(before, "y").x, start.y - where(before, "y").y),
      "チップ y が前に居た位置から滑り出さない",
    ).toBeLessThan(3);
    // 段の途中では、前に居た位置と今の位置の間に居る。札が横に並ぶ図でも縦に積む図でも同じ
    const middle = where(chipsIn(motion, "下", (slide.start + slide.drawn) / 2), "y");
    const away = (p: { x: number; y: number }, q: { x: number; y: number }): number =>
      Math.hypot(p.x - q.x, p.y - q.y);
    const span = away(where(before, "y"), where(after, "y"));
    expect(span, "チップ y の前に居た位置と今の位置が同じ").toBeGreaterThan(6);
    expect(
      away(middle, where(before, "y")),
      "チップ y が段の途中で前に居た位置から離れない",
    ).toBeGreaterThan(3);
    expect(away(middle, where(after, "y")), "チップ y が段の途中で着いている").toBeGreaterThan(3);
    expect(
      away(middle, where(before, "y")) + away(middle, where(after, "y")),
      "チップ y が段の途中で 2 つの位置を結ぶ道から外れる",
    ).toBeLessThan(span + 1);
    const landed = where(chipsIn(motion, "下", slide.drawn), "y");
    expect(
      Math.hypot(landed.x - where(after, "y").x, landed.y - where(after, "y").y),
      "チップ y が滑り終えた時に列の席に居ない",
    ).toBeLessThan(0.5);

    // 段 3。並びに残るチップは同じ列の中で滑り、外れたチップは消え、どの列にも居なかったチップは弾んで現れる
    expect(namesIn(motion, "上", at(2)), "段 3 の上の列").toEqual(["y", "z"]);
    const again = timeOf(rendered, 2, 0);
    const shifted = where(chipsIn(motion, "上", again.start + 0.01), "y");
    expect(
      Math.abs(shifted.x - where(before, "y").x),
      "チップ y が同じ列の中で元の席から滑り出さない",
    ).toBeLessThan(3);
    // 並びの前へ移ったチップは、列のチップを置く所の始まりへ近づく
    const track = laneOf(rendered.layout, "上").track;
    const fromStart = (p: { x: number; y: number }): number =>
      Math.hypot(p.x - track.x, p.y - track.y);
    expect(
      fromStart(where(chipsIn(motion, "上", at(2)), "y")),
      "チップ y が同じ列の中で前の席へ移らない",
    ).toBeLessThan(fromStart(where(before, "y")));
    const z = partOf(motion, '[data-lineup-chip="z"]');
    expect(seenOf(motion, z, again.start - 0.05), "チップ z が現れる前に見える").toBeLessThan(0.1);
    expect(
      motion.value(z, "transform", again.start + 0.02)?.[2] ?? 1,
      "チップ z が小さな所から弾んで現れない",
    ).toBeLessThan(0.7);
    expect(motion.value(z, "transform", at(2))?.[2], "チップ z が元の大きさにならない").toBeCloseTo(
      1,
      3,
    );
  });

  it("lineup-seal-hides-chips", () => {
    const rendered = render(sealedLineup());
    const motion = motionFrom(rendered);
    const { layout, timeline } = rendered;
    const at = (s: number): number => timeline.stills[s] ?? 0;
    const selector = '[data-lineup-seal="甲"]';
    const seal = partOf(motion, selector);
    const scale = (t: number): number => motion.value(seal, "transform", t)?.[0] ?? Number.NaN;

    expect(seen(motion, selector, at(0)), "段 1 に封が見える").toBeLessThan(0.1);
    const opened = chipsIn(motion, "甲", at(0));
    expect(
      opened.map((c) => c.id),
      "段 1 の甲の列",
    ).toEqual(["a", "b", "c"]);

    // 封は列の左から右へ伸び、覆い終えた列のチップは見えない
    const closing = timeOf(rendered, 1, 0);
    expect(scale(closing.start), "封が左端から始まらない").toBeLessThan(0.05);
    expect(
      scale((closing.start + closing.drawn) / 2),
      "封が段の途中で途中まで伸びない",
    ).toBeGreaterThan(0.05);
    expect(scale((closing.start + closing.drawn) / 2), "封が段の途中で伸び切っている").toBeLessThan(
      0.95,
    );
    expect(rendered.svg, "封の伸びる起点が列の左端でない").toMatch(
      /\.dg-ln-seal\{[^}]*transform-box:fill-box;transform-origin:0 50%/u,
    );
    expect(scale(at(1)), "封が列を覆い切らない").toBeCloseTo(1, 3);
    expect(seen(motion, selector, at(1)), "段 2 の封が見えない").toBeGreaterThan(0.9);
    expect(namesIn(motion, "甲", at(1), 0.1), "封をした列のチップが見える").toEqual([]);
    expect(namesIn(motion, "乙", at(1)), "封をしていない列のチップが隠れる").toEqual(["a"]);

    // 封は列のチップの席を全部覆う
    const lane = laneOf(layout, "甲");
    const cover = layout.seals.find((s) => s.lane === "甲");
    expect(cover, "封の置き場所が並べた図に無い").toBeDefined();
    expect(cover?.x ?? 0, "封が並びの左端を覆わない").toBeLessThanOrEqual(lane.track.x);
    expect((cover?.x ?? 0) + (cover?.w ?? 0), "封が並びの右端を覆わない").toBeGreaterThanOrEqual(
      lane.track.x + lane.track.w,
    );

    // 封をしたまま段が進んでも見えない
    expect(namesIn(motion, "甲", at(2), 0.1), "段 3 に封をした列のチップが見える").toEqual([]);
    // open の段で封が消え、チップが同じ並びで見える
    expect(seen(motion, selector, at(3)), "open の段で封が消えない").toBeLessThan(0.1);
    expect(chipsIn(motion, "甲", at(3)), "open の段のチップが封をする前の並びと違う").toEqual(
      opened,
    );
  });

  it("lineup-pick-fades-other-lanes", () => {
    const rendered = render(pickedLineup());
    const motion = motionFrom(rendered);
    const at = (s: number): number => rendered.timeline.stills[s] ?? 0;
    const lane = (id: string): string => `[data-lineup-lane="${id}"]`;
    const ring = '[data-lineup-ring="乙"]';

    expect(seen(motion, ring, at(0)), "pick の段より前に縁の色が見える").toBeLessThan(0.1);
    for (const id of ["甲", "乙", "丙"])
      expect(seen(motion, lane(id), at(0)), `pick の段より前に ${id} の列が薄い`).toBeGreaterThan(
        0.9,
      );

    // pick の段から後、選んだ列の縁に色が付き、ほかの列はチップまで薄くなる
    expect(seen(motion, ring, at(1)), "pick の段に縁の色が見えない").toBeGreaterThan(0.9);
    expect(seen(motion, lane("乙"), at(1)), "選んだ列が薄い").toBeGreaterThan(0.9);
    expect(namesIn(motion, "乙", at(1)), "選んだ列のチップが薄い").toEqual(["a"]);
    for (const id of ["甲", "丙"]) {
      expect(seen(motion, lane(id), at(1)), `選ばなかった ${id} の列が薄くならない`).toBeLessThan(
        0.6,
      );
      expect(
        namesIn(motion, id, at(1), 0.6),
        `選ばなかった ${id} の列のチップが薄くならない`,
      ).toEqual([]);
    }

    // 選ばなかった列も、後の段で書き換えれば濃く戻る
    expect(seen(motion, ring, at(2)), "後の段で縁の色が消える").toBeGreaterThan(0.9);
    expect(seen(motion, lane("丙"), at(2)), "書き換えた列が薄いまま").toBeGreaterThan(0.9);
    expect(namesIn(motion, "丙", at(2)), "書き換えた列のチップが見えない").toEqual(["b"]);
    expect(seen(motion, lane("甲"), at(2)), "書き換えていない列が濃く戻る").toBeLessThan(0.6);
  });

  it("lineup-stamp-appears-at-its-step", () => {
    const rendered = render(smallLineup());
    const motion = motionFrom(rendered);
    const { layout, timeline } = rendered;
    const at = (s: number): number => timeline.stills[s] ?? 0;
    const stamp = '[data-lineup-stamp="乙"]';
    expect(seen(motion, stamp, at(3)), "段 4 に札が見える").toBeLessThan(0.1);
    expect(seen(motion, stamp, at(4)), "段 5 の札が見えない").toBeGreaterThan(0.9);
    expect(seen(motion, stamp, at(5)), "札が最後の段まで残らない").toBeGreaterThan(0.9);
    expect(partOf(motion, stamp).textContent, "札の字").toBe("済み");
    // 札は列の右に置く
    const lane = laneOf(layout, "乙");
    const placed = layout.stamps.find((s) => s.lane === "乙");
    expect(placed, "札の置き場所が並べた図に無い").toBeDefined();
    expect(placed?.x ?? 0, "札が列の右半分に無い").toBeGreaterThan(lane.x + lane.w / 2);
    expect((placed?.x ?? 0) + (placed?.w ?? 0), "札が列の外へ出る").toBeLessThanOrEqual(
      lane.x + lane.w,
    );
  });
});

describe("列の図の見本 (#3239)", () => {
  it("auction-renders-7-steps", () => {
    const source = exampleJson("auction.json") as unknown as Source;
    expect(source.kind, "入札の図の種類").toBe("lineup");
    expect(
      source.steps.map((s) => s.title),
      "入札の図の段の題が決めた 7 段と違う",
    ).toEqual([...AUCTION_STEPS]);
    const rendered = render(source as unknown as Json);
    const motion = motionFrom(rendered);
    const { timeline } = rendered;
    expect(timeline.steps, "時刻の表の段の数").toHaveLength(7);
    timeline.steps.forEach((step, i) => {
      expect(step.end, `段 ${i + 1} の長さ`).toBeGreaterThan(step.start);
      if (i > 0)
        expect(step.start, `段 ${i + 1} の始まり`).toBeGreaterThanOrEqual(
          (timeline.steps[i - 1]?.end ?? Number.POSITIVE_INFINITY) - 1e-9,
        );
    });
    const at = (s: number): number => timeline.stills[s] ?? 0;

    // 段 1 でメモリプールの列にチップが並ぶ
    expect(
      namesIn(motion, "メモリプール", at(0)).length,
      "段 1 のメモリプールの列のチップ",
    ).toBeGreaterThan(0);
    for (const id of BUILDERS)
      expect(namesIn(motion, id, at(0)), `段 1 に ${id} の列のチップが見える`).toEqual([]);
    // 段 2 でビルダーの 3 列が並ぶ。並びは列ごとに違う
    const orders = BUILDERS.map((id) => namesIn(motion, id, at(1)));
    for (const [k, order] of orders.entries())
      expect(order.length, `段 2 の ${BUILDERS[k]} の列のチップ`).toBeGreaterThan(0);
    expect(new Set(orders.map((order) => order.join(","))).size, "段 2 の 3 列の並びが同じ").toBe(
      3,
    );
    // 段 3 で 3 列に封が付く
    for (const id of BUILDERS) {
      expect(
        seen(motion, `[data-lineup-seal="${id}"]`, at(2)),
        `段 3 の ${id} の封が見えない`,
      ).toBeGreaterThan(0.9);
      expect(namesIn(motion, id, at(2), 0.1), `段 3 に ${id} の列のチップが見える`).toEqual([]);
    }
    // 段 4 で選んだ列が残る
    expect(
      seen(motion, '[data-lineup-ring="ビルダーB"]', at(3)),
      "段 4 に選んだ列の縁の色が見えない",
    ).toBeGreaterThan(0.9);
    expect(
      seen(motion, '[data-lineup-lane="ビルダーA"]', at(3)),
      "段 4 に選ばなかった列が薄くならない",
    ).toBeLessThan(0.6);
    expect(
      seen(motion, '[data-lineup-seal="ビルダーC"]', at(3)),
      "段 4 に選ばなかった列の封が薄くならない",
    ).toBeLessThan(0.6);
    // 段 5 で札が出る
    expect(
      seen(motion, '[data-lineup-stamp="ビルダーB"]', at(3)),
      "段 4 に札が見える",
    ).toBeLessThan(0.1);
    expect(
      seen(motion, '[data-lineup-stamp="ビルダーB"]', at(4)),
      "段 5 の札が見えない",
    ).toBeGreaterThan(0.9);
    // 段 6 で封が開く。負けた列の封は開かない
    expect(
      seen(motion, '[data-lineup-seal="ビルダーB"]', at(5)),
      "段 6 に封が開かない",
    ).toBeLessThan(0.1);
    expect(namesIn(motion, "ビルダーB", at(5)), "段 6 のチップが段 2 の並びと違う").toEqual(
      orders[1],
    );
    expect(namesIn(motion, "ビルダーA", at(5), 0.1), "段 6 に負けた列のチップが見える").toEqual([]);
    // 段 7 でバリデーターの列にチップが並ぶ
    expect(
      namesIn(motion, "バリデーター", at(5)),
      "段 6 にバリデーターの列のチップが見える",
    ).toEqual([]);
    expect(
      namesIn(motion, "バリデーター", at(6)).length,
      "段 7 のバリデーターの列のチップ",
    ).toBeGreaterThan(0);
  });

  it("lineup-keeps-motion-rules", () => {
    const { timeline } = render(exampleJson("auction.json"));
    for (const t of sampleTimes(timeline))
      expect(
        timeline.labels.filter((span) => covers(span, t)).length,
        `入札の図の ${t} 秒に見える線の名前`,
      ).toBeLessThanOrEqual(2);
    expect(
      timeline.badges.map((b) => b.step),
      "入札の図の段の番号",
    ).toEqual(timeline.steps.map((_, i) => i));
    for (const badge of timeline.badges) {
      const step = timeline.steps[badge.step];
      expect(
        badge.appears,
        `入札の図の段 ${badge.step + 1} の番号が段より前に出る`,
      ).toBeGreaterThanOrEqual(step?.start ?? Number.POSITIVE_INFINITY);
    }
  });
});

describe("列の図の記法に足す語 (#3351)", () => {
  it("lineup-order-none-marks-a-pool", () => {
    const parse = api("parseNotation");
    const validate = api("validateDiagram");
    const print = api("printNotation");
    const text = [
      "lineup 置き場",
      "box pool [order: none]",
      "box card",
      "item a, b",
      "step 並べる",
      "  say 並べる。",
      "  line pool: a, b",
      "  line card: b, a",
    ].join("\n");
    const parsed = parse(text);
    expect(
      parsed.ok,
      `[order: none] の箱を持つ列の図が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`,
    ).toBe(true);
    if (!parsed.ok) return;
    const source = parsed.diagram as unknown as Source;
    expect(
      (source.blocks.box ?? []).map((b) => b.order),
      "箱の order",
    ).toEqual(["none", undefined]);
    const checked = validate(parsed.diagram);
    expect(
      checked.ok,
      `[order: none] の箱を持つ JSON が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`,
    ).toBe(true);
    const again = parse(print(parsed.diagram));
    expect(
      again.ok ? again.diagram : again.errors,
      "[order: none] の箱を往復した JSON が最初と違う",
    ).toEqual(parsed.diagram);

    // order に none 以外を書いた行と、列の図でない図の box に書いた行は、行と列を示して止まる
    const at = (line: string, token: string): number => line.indexOf(token);
    const cases: [string, string[], number, number][] = [
      [
        "none 以外の order",
        ["lineup 置き場", "box pool [order: random]", "item a", "step 並べる", "  say 並べる。"],
        1,
        at("box pool [order: random]", "random"),
      ],
      [
        "時系列図の box の order",
        [
          "sequence 置き場",
          "box pool [order: none]",
          "box b",
          "step 送る",
          "  say 送る。",
          "  pool -> b: 送る",
        ],
        1,
        at("box pool [order: none]", "order"),
      ],
    ];
    for (const [name, lines, row, column] of cases) {
      for (const lang of ["ja", "en"] as const) {
        const read = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(
          first && { line: first.line, column: first.column },
          `${name} の誤りの行と列 (${lang})`,
        ).toEqual({ line: row + 1, column: column + 1 });
        if (lang === "en")
          expect(
            KANA.test(first?.message ?? ""),
            `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`,
          ).toBe(false);
      }
    }
    // JSON Schema も同じ 2 つを、order の欄を指して断る
    const jsonCases: [string, Json][] = [
      ["none 以外の order", patched(smallLineup(), ["boxes", 0, "order"], "random")],
      ["時系列図の箱の order", patched(smallSequence(), ["boxes", 0, "order"], "none")],
    ];
    for (const [name, input] of jsonCases) {
      expect(pointers(validate(input)), `${name} の誤りの場所`).toContain("/boxes/0/order");
      const en = validate(input, { lang: "en" });
      expect(
        (en.ok ? [] : en.errors.map((e) => e.message)).filter((m) => KANA.test(m)),
        `${name} の英語の誤りの文に仮名か漢字がある`,
      ).toEqual([]);
    }
  });

  it("lineup-role-declares-and-acts", () => {
    const parse = api("parseNotation");
    const validate = api("validateDiagram");
    const print = api("printNotation");
    const text = [
      "lineup 役",
      "role relay [note: 封をする]",
      "role proposer",
      "box card",
      "item a",
      "step 並べる",
      "  say 並べる。",
      "  role relay",
      "  line card: a",
    ].join("\n");
    const parsed = parse(text);
    expect(
      parsed.ok,
      `role を持つ列の図が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`,
    ).toBe(true);
    if (!parsed.ok) return;
    const source = parsed.diagram as unknown as Source;
    expect(source.blocks.role, "最上位の role の行が宣言する役").toEqual([
      { id: "relay", note: "封をする" },
      { id: "proposer" },
    ]);
    expect(source.steps[0]?.events, "段の中の role の行が名指す動く役").toEqual([
      { type: "role", role: "relay" },
      { type: "line", box: "card", items: ["a"] },
    ]);
    const checked = validate(parsed.diagram);
    expect(
      checked.ok,
      `role を持つ JSON が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`,
    ).toBe(true);
    const again = parse(print(parsed.diagram));
    expect(again.ok ? again.diagram : again.errors, "role を往復した JSON が最初と違う").toEqual(
      parsed.diagram,
    );

    const head = ["lineup 役", "role relay", "box card", "item a", "step 並べる", "  say 並べる。"];
    const cases: [string, string[], number, number][] = [
      ["宣言していない役", [...head, "  role nobody"], 6, "  role nobody".indexOf("nobody")],
      [
        "時系列図の最上位の role",
        [
          "sequence 役",
          "role relay",
          "box a",
          "box b",
          "step 送る",
          "  say 送る。",
          "  a -> b: 送る",
        ],
        1,
        0,
      ],
      [
        "時系列図の段の中の role",
        [
          "sequence 役",
          "box a",
          "box b",
          "step 送る",
          "  say 送る。",
          "  role relay",
          "  a -> b: 送る",
        ],
        5,
        2,
      ],
    ];
    for (const [name, lines, row, column] of cases) {
      for (const lang of ["ja", "en"] as const) {
        const read = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(
          first && { line: first.line, column: first.column },
          `${name} の誤りの行と列 (${lang})`,
        ).toEqual({ line: row + 1, column: column + 1 });
        if (lang === "en")
          expect(
            KANA.test(first?.message ?? ""),
            `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`,
          ).toBe(false);
      }
    }
    const misplaced = patched(smallSequence(), ["steps", 0, "events"], [roleEvent("relay")]);
    expect(pointers(validate(misplaced)), "時系列図の role の出来事の誤りの場所").toContain(
      "/steps/0/events/0/type",
    );
    const en = validate(misplaced, { lang: "en" });
    expect(
      (en.ok ? [] : en.errors.map((e) => e.message)).filter((m) => KANA.test(m)),
      "時系列図の role の出来事の英語の誤りの文に仮名か漢字がある",
    ).toEqual([]);
  });

  it("lineup-legend-lists-item-notes", () => {
    const parse = api("parseNotation");
    const validate = api("validateDiagram");
    const print = api("printNotation");
    const text = [
      "lineup 凡例",
      "box card",
      "item 自分 [color: amber, note: 自分の取引]",
      "item 送金, 交換 [note: 取引]",
      "step 並べる",
      "  say 並べる。",
      "  line card: 送金, 自分, 交換",
    ].join("\n");
    const parsed = parse(text);
    expect(
      parsed.ok,
      `item の note を持つ列の図が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`,
    ).toBe(true);
    if (!parsed.ok) return;
    expect(
      (parsed.diagram as unknown as Source).blocks.item,
      "item の行が宣言するチップの説明",
    ).toEqual([
      { id: "自分", color: "amber", note: "自分の取引" },
      { id: "送金", note: "取引" },
      { id: "交換", note: "取引" },
    ]);
    expect(validate(parsed.diagram).ok, "item の note を持つ JSON が検査で落ちる").toBe(true);
    const again = parse(print(parsed.diagram));
    expect(
      again.ok ? again.diagram : again.errors,
      "item の note を往復した JSON が最初と違う",
    ).toEqual(parsed.diagram);

    // 凡例は図の下の端に、説明ごとに 1 つ、チップの宣言の順に出す。同じ説明は最初のチップの色で 1 度だけ
    const rendered = render(tableLineup());
    const { layout } = rendered;
    const legend = layout.legend ?? [];
    expect(
      legend.map((row) => row.text.text),
      "凡例の説明",
    ).toEqual(["取引", "自分の取引", "裏の取引"]);
    expect(
      legend.map((row) => row.color),
      "凡例の見本の色",
    ).toEqual([undefined, "amber", "blue"]);
    for (const row of legend) {
      expect(
        row.swatch.x + row.swatch.w,
        `凡例の ${row.text.text} の見本が説明の左に無い`,
      ).toBeLessThan(row.text.x);
      expect(
        Math.abs(row.swatch.y + row.swatch.h / 2 - (row.text.y + row.text.h / 2)),
        `凡例の ${row.text.text} の見本と説明が同じ行に無い`,
      ).toBeLessThan(4);
    }
    const above = [
      ...layout.lanes,
      ...(layout.remarks ?? []).map((r) => r.text),
      ...(layout.aheads ?? []).flatMap((a) => a.tags),
    ];
    const floor = Math.max(...above.map((r) => r.y + r.h));
    for (const row of legend)
      expect(
        row.swatch.y,
        `凡例の ${row.text.text} が箱と一言と「この先」の帯より下に無い`,
      ).toBeGreaterThanOrEqual(floor + 10);
    const motion = motionFrom(rendered);
    const entries = [
      ...motion.doc.querySelectorAll("[data-lineup-legend] [data-lineup-legend-row]"),
    ];
    expect(
      entries.map((e) => e.textContent?.trim()),
      "描いた凡例の行",
    ).toEqual(["取引", "自分の取引", "裏の取引"]);
    expect(
      entries[0]?.getAttribute("style") ?? "",
      "色の無いチップの凡例の見本に色がある",
    ).not.toContain("--c:");
    expect(entries[1]?.getAttribute("style") ?? "", "色付きのチップの凡例の見本の色").toContain(
      "--c:var(--c-amber)",
    );

    // 説明を持つチップが無い図は凡例を出さない
    const plain = render(smallLineup());
    expect(plain.layout.legend ?? [], "説明の無い図の凡例").toEqual([]);
    expect(
      motionFrom(plain).doc.querySelector("[data-lineup-legend]"),
      "説明の無い図に凡例がある",
    ).toBeNull();

    // 英語の記法の説明は書いたまま出す
    const en = parse(
      [
        "lineup Legend",
        "box card",
        "item mine [color: amber, note: Your transaction]",
        "step Line up",
        "  say Line up.",
        "  line card: mine",
      ].join("\n"),
      { lang: "en" },
    );
    expect(en.ok, "英語の item の note が読めない").toBe(true);
    if (en.ok)
      expect(
        (render(en.diagram, "en").layout.legend ?? []).map((row) => row.text.text),
        "英語の凡例の説明",
      ).toEqual(["Your transaction"]);
  });
});

describe("列の図を卓の形で並べる (#3351)", () => {
  it("lineup-player-arranges-by-frame-width", () => {
    const win = window as unknown as { ResizeObserver?: unknown };
    const saved = win.ResizeObserver;
    const watchers: (() => void)[] = [];
    win.ResizeObserver = class {
      constructor(cb: () => void) {
        watchers.push(cb);
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
    try {
      const host = document.createElement("div");
      let width = 390;
      Object.defineProperty(host, "clientWidth", { configurable: true, get: () => width });
      document.body.appendChild(host);
      const player = draw("mountDiagram")(host, exampleJson("auction.json"));
      const arranged = (): string | null =>
        host.querySelector('svg[data-dragon="figure"]')?.getAttribute("data-lineup-arrangement") ??
        null;
      const frameOf = (id: string): number =>
        Number(
          host.querySelector(`[data-lineup-lane="${id}"] [data-lineup-frame]`)?.getAttribute("y") ??
            Number.NaN,
        );
      expect(arranged(), "幅 390 の枠の入札の図が縦に組んだ図でない").toBe("stack");
      expect(frameOf("メモリプール"), "幅 390 の枠でメモリプールが札の列の上に無い").toBeLessThan(
        frameOf("ビルダーA"),
      );
      // 枠の幅が 760 に変わると横に並べ直す
      width = 760;
      for (const watch of watchers) watch();
      expect(arranged(), "枠の幅を 760 に広げても横に並べ直さない").toBe("row");
      expect(
        frameOf("メモリプール"),
        "幅 760 の枠でメモリプールと札の上の端が揃わない",
      ).toBeCloseTo(frameOf("ビルダーA"), 6);
      // 390 に戻すと、また縦に組む
      width = 390;
      for (const watch of watchers) watch();
      expect(arranged(), "枠の幅を 390 に狭めても縦に組み直さない").toBe("stack");
      player.destroy();
      host.remove();
    } finally {
      win.ResizeObserver = saved;
    }
  });

  it("lineup-band-chips-on-grid", () => {
    const { layout } = render(mempoolLineup(), "ja", 390);
    expect(layout.arrangement, "390px の枠の並べ方").toBe("stack");
    expectGrid(layout.chips.filter((c) => c.lane === "池" && c.step === 0));
  });

  it("lineup-holds-12-chips-in-places", () => {
    const { layout } = render(heapOf(MOST));
    const card = laneOf(layout, "札");
    const seats = layout.chips.filter((c) => c.lane === "札").sort((a, b) => a.index - b.index);
    expect(seats.length, "札に積んだチップの数").toBe(MOST);
    seats.forEach((c, i) => {
      expect(c.x, `札の ${i + 1} 枚目が 1 列に並ばない`).toBeCloseTo(seats[0]?.x ?? Number.NaN, 6);
      const above = seats[i - 1];
      if (above)
        expect(c.y, `札の ${i + 1} 枚目が上のチップの下に無い`).toBeGreaterThanOrEqual(
          above.y + above.h,
        );
      expect(c.y + c.h, `札の ${i + 1} 枚目がチップを置く所からはみ出す`).toBeLessThanOrEqual(
        card.track.y + card.track.h + 1e-6,
      );
      expect(c.x + c.w, `札の ${i + 1} 枚目が札からはみ出す`).toBeLessThanOrEqual(card.x + card.w);
    });
    // 置き場は折り返して高さを伸ばし、どのチップも枠からはみ出さない
    const few = laneOf(render(heapOf(4, false)).layout, "池");
    const many = render(heapOf(MOST, false)).layout;
    const pool = laneOf(many, "池");
    expect(pool.h, "12 枚の置き場が 4 枚の置き場より高くならない").toBeGreaterThan(few.h);
    const placed = many.chips.filter((c) => c.lane === "池");
    expect(placed.length, "置き場に置いたチップの数").toBe(MOST);
    expect(
      new Set(placed.map((c) => Math.round(c.y))).size,
      "12 枚の置き場が折り返さない",
    ).toBeGreaterThan(2);
    for (const c of placed) {
      const inside =
        c.x >= pool.x &&
        c.y >= pool.y &&
        c.x + c.w <= pool.x + pool.w &&
        c.y + c.h <= pool.y + pool.h;
      expect(inside, `置き場の ${c.id} が枠からはみ出す`).toBe(true);
    }
  });

  it("lineup-chips-show-names-in-frames", () => {
    const rendered = render(chipsLineup());
    const motion = motionFrom(rendered);
    // 札が移った後も前の列に残る控えの行 (#3624) は枠を持たないので、札だけを見る
    const chip = (id: string, lane: string): Element =>
      partOf(motion, `[data-lineup-chip="${id}"][data-lineup-on="${lane}"]:not([data-lineup-trace])`);
    for (const lane of ["池", "甲"]) {
      // label を持つチップは label を、持たないチップは名前を、枠の中に出す
      expect(
        chip("a", lane).querySelector("text")?.textContent,
        `${lane} の label を持つチップの字`,
      ).toBe("12");
      expect(
        chip("送金", lane).querySelector("text")?.textContent,
        `${lane} の label を持たないチップの字`,
      ).toBe("送金");
      expect(
        chip("裏", lane).querySelector("text")?.textContent,
        `${lane} の色付きのチップの字`,
      ).toBe("裏");
      for (const id of ["a", "送金", "裏"])
        expect(
          chip(id, lane).querySelector("rect[data-lineup-chip-frame]"),
          `${lane} の ${id} に枠が無い`,
        ).not.toBeNull();
      // 色付きのチップは縁をその色で描いて光らせる
      expect(chip("裏", lane).getAttribute("style"), `${lane} の色付きのチップの色`).toContain(
        "--c:var(--c-blue)",
      );
      expect(
        chip("裏", lane).hasAttribute("data-lineup-glow"),
        `${lane} の色付きのチップが光らない`,
      ).toBe(true);
      expect(
        chip("送金", lane).hasAttribute("data-lineup-glow"),
        `${lane} の色の無いチップが光る`,
      ).toBe(false);
    }
    // 札の中の色の無いチップは薄く出し、置き場の色の無いチップと色付きのチップは薄くしない
    expect(
      chip("送金", "甲").hasAttribute("data-lineup-faint"),
      "札の色の無いチップが薄くない",
    ).toBe(true);
    expect(
      chip("送金", "池").hasAttribute("data-lineup-faint"),
      "置き場の色の無いチップが薄い",
    ).toBe(false);
    expect(chip("裏", "甲").hasAttribute("data-lineup-faint"), "札の色付きのチップが薄い").toBe(
      false,
    );
    // 字は枠の中に収まる
    for (const seat of rendered.layout.chips) {
      const label = seat.label;
      expect(label, `${seat.lane} の ${seat.id} が字の置き場所を持たない`).toBeDefined();
      if (!label) continue;
      expect(
        label.x >= seat.x && label.x + label.w <= seat.x + seat.w,
        `${seat.lane} の ${seat.id} の字が枠からはみ出す`,
      ).toBe(true);
    }
  });

  it("lineup-seal-hides-items-not-note", () => {
    for (const lang of ["ja", "en"] as const) {
      const rendered = render(tableLineup(), lang);
      const motion = motionFrom(rendered);
      const { layout, timeline } = rendered;
      const at = (s: number): number => timeline.stills[s] ?? 0;
      const card = laneOf(layout, "甲");
      const seal = layout.seals.find((s) => s.lane === "甲");
      expect(seal, "甲の封の置き場所が無い").toBeDefined();
      if (!seal || !card.note) continue;
      // 封はチップの並ぶ所を覆い、note の字を覆わない
      expect(
        seal.y <= card.track.y && seal.y + seal.h >= card.track.y + card.track.h,
        "封がチップの並ぶ所を覆わない",
      ).toBe(true);
      expect(gap(seal, card.note), "封が note の字に掛かる").toBeGreaterThan(0);
      // 封は斜線と錠と字で描く
      const part = partOf(motion, '[data-lineup-seal="甲"]');
      expect(part.querySelector('[fill^="url(#dg-seal-"]'), "封に斜線が無い").not.toBeNull();
      expect(part.querySelector("[data-lineup-lock]"), "封に錠が無い").not.toBeNull();
      const word = part.querySelector("text")?.textContent ?? "";
      if (lang === "ja") expect(word, "封の字").toBe("封");
      else
        expect(KANA.test(word) || word === "", `英語の封の字 ${word} が仮名か漢字を含むか空`).toBe(
          false,
        );
      // 封をした段の後もチップは隠れ、note の字は見える
      expect(namesIn(motion, "甲", at(2), 0.1), "封をした札のチップが見える").toEqual([]);
      expect(
        seen(motion, '[data-lineup-note="甲"]', at(2)),
        "封をした札の note の字が見えない",
      ).toBeGreaterThan(0.9);
    }
  });

  it("lineup-pick-marks-the-card", () => {
    for (const lang of ["ja", "en"] as const) {
      const rendered = render(tableLineup(), lang);
      const motion = motionFrom(rendered);
      const { layout, timeline } = rendered;
      const at = (s: number): number => timeline.stills[s] ?? 0;
      const mark = (layout.marks ?? []).find((m) => m.lane === "甲");
      expect(mark?.text, `選んだ札の印の字 (${lang})`).toBe(lang === "ja" ? "選ばれる" : "Picked");
      const card = laneOf(layout, "甲");
      expect(
        mark &&
          mark.y < card.track.y &&
          mark.x >= card.x - 1e-6 &&
          mark.x + mark.w <= card.x + card.w + 1e-6,
        "選んだ札の印が札の頭に無い",
      ).toBe(true);
      const selector = '[data-lineup-mark="甲"]';
      expect(seen(motion, selector, at(2)), "pick の段より前に印が見える").toBeLessThan(0.1);
      expect(seen(motion, selector, at(3)), "pick の段に印が見えない").toBeGreaterThan(0.9);
      expect(seen(motion, selector, at(4)), "pick の段の後に印が消える").toBeGreaterThan(0.9);
      // 選んだ札の縁に札の色が付いて光る
      const ring = partOf(motion, '[data-lineup-ring="甲"]');
      expect(ring.querySelector(".dg-halo"), "選んだ札の縁が光らない").not.toBeNull();
      expect(
        seen(motion, '[data-lineup-ring="甲"]', at(3)),
        "pick の段に縁の色が見えない",
      ).toBeGreaterThan(0.9);
    }
  });

  it("lineup-role-lights-in-its-step", () => {
    const rendered = render(tableLineup());
    const motion = motionFrom(rendered);
    const at = (s: number): number => rendered.timeline.stills[s] ?? 0;
    const lit: Record<string, boolean[]> = {
      封じ手: [false, false, true, false, true, false],
      選び手: [false, false, false, true, false, false],
    };
    for (const [role, steps] of Object.entries(lit)) {
      steps.forEach((on, s) => {
        expect(
          seen(motion, `[data-lineup-role="${role}"]`, at(s)),
          `段 ${s + 1} に役 ${role} の札が見えない`,
        ).toBeGreaterThan(0.9);
        const glow = seen(motion, `[data-lineup-role-ring="${role}"]`, at(s));
        if (on) expect(glow, `段 ${s + 1} に役 ${role} の札が光らない`).toBeGreaterThan(0.9);
        else expect(glow, `段 ${s + 1} に役 ${role} の札が光る`).toBeLessThan(0.1);
      });
    }
  });

  it("lineup-headline-shows-step-title", () => {
    const rendered = render(tableLineup());
    const motion = motionFrom(rendered);
    const { layout, timeline } = rendered;
    const at = (s: number): number => timeline.stills[s] ?? 0;
    const source = tableLineup() as unknown as Source;
    const headlines = layout.headlines ?? [];
    expect(
      headlines.map((h) => h.title.text),
      "図の上の段の題",
    ).toEqual(source.steps.map((s) => s.title));
    expect(
      headlines.map((h) => h.say?.text),
      "段の題の下の文",
    ).toEqual(source.steps.map((s) => s.body));
    const textH = chipTextH(layout);
    const firstBox = Math.min(...[...(layout.roles ?? []), ...layout.lanes].map((r) => r.y));
    // ボード (#3624) の札の字は 15px と大きいので、段の題 (20px) は札の字の 1.3 倍で見分ける
    for (const h of headlines) {
      expect(
        h.title.h,
        `段 ${h.step + 1} の題がチップの字の 1.3 倍に届かない`,
      ).toBeGreaterThanOrEqual(textH * 1.3 - 1e-6);
      expect(h.say?.y ?? 0, `段 ${h.step + 1} の文が題の下に無い`).toBeGreaterThanOrEqual(
        h.title.y + h.title.h,
      );
      expect(
        (h.say?.y ?? 0) + (h.say?.h ?? 0) + 10,
        `段 ${h.step + 1} の文が役の札と箱より上に無い`,
      ).toBeLessThanOrEqual(firstBox);
    }
    for (let s = 0; s < source.steps.length; s++) {
      const part = partOf(motion, `[data-lineup-headline="${s}"]`);
      expect(part.textContent, `段 ${s + 1} の描いた題`).toContain(source.steps[s]?.title ?? "");
      expect(seenOf(motion, part, at(s)), `段 ${s + 1} の題が見えない`).toBeGreaterThan(0.9);
      for (const other of [s - 1, s + 1])
        if (other >= 0 && other < source.steps.length)
          expect(
            seenOf(motion, part, at(other)),
            `段 ${other + 1} に段 ${s + 1} の題が見える`,
          ).toBeLessThan(0.1);
    }
  });

  it("lineup-block-remarks-derive-from-lines", () => {
    const want: Record<string, [string, string][]> = {
      ビルダーA: [["自分は3番目", "amber"]],
      ビルダーB: [
        ["裏1、裏2を足した", "blue"],
        ["自分は4番目", "amber"],
      ],
      ビルダーC: [["自分が無い", "amber"]],
    };
    // 一言は図の言葉で書くので、日本語の見本は日本語で描く
    const rendered = render(exampleJson("auction.json"), "ja");
    const motion = motionFrom(rendered);
    const { layout, timeline } = rendered;
    const at = (s: number): number => timeline.stills[s] ?? 0;
    const remarks = layout.remarks ?? [];
    for (const [lane, rows] of Object.entries(want)) {
      const mine = remarks.filter((r) => r.lane === lane);
      expect(
        mine.map((r) => [r.text.text, r.color]),
        `${lane} の一言`,
      ).toEqual(rows);
      expect(
        mine.every((r) => r.step === 1),
        `${lane} の一言が line を書いた段 2 に無い`,
      ).toBe(true);
      const card = laneOf(layout, lane);
      for (const r of mine) {
        expect(r.text.y, `${lane} の一言 ${r.text.text} が札の下に無い`).toBeGreaterThanOrEqual(
          card.y + card.h,
        );
        expect(
          r.bar.x >= card.x - 1e-6 && r.text.x + r.text.w <= card.x + card.w + 1e-6,
          `${lane} の一言 ${r.text.text} が札の幅からはみ出す`,
        ).toBe(true);
        expect(r.bar.w, `${lane} の一言の色の棒が細くない`).toBeLessThanOrEqual(4);
      }
      // 一言は line を書いた段にだけ見え、色の縦棒と字で描き、チップのような枠を持たない
      const part = partOf(motion, `[data-lineup-remark="${lane}"]`);
      expect(seenOf(motion, part, at(1)), `段 2 に ${lane} の一言が見えない`).toBeGreaterThan(0.9);
      expect(seenOf(motion, part, at(0)), `段 1 に ${lane} の一言が見える`).toBeLessThan(0.1);
      expect(seenOf(motion, part, at(2)), `段 3 に ${lane} の一言が見える`).toBeLessThan(0.1);
      const rects = [...part.querySelectorAll("rect")];
      expect(rects.length, `${lane} の一言の四角の数 (色の棒だけ)`).toBe(rows.length);
      for (const rect of rects)
        expect(Number(rect.getAttribute("width")), `${lane} の一言に枠がある`).toBeLessThanOrEqual(
          4,
        );
    }
    // 置き場には一言を出さない
    expect(
      remarks.filter((r) => laneOf(layout, r.lane).pool),
      "置き場の一言",
    ).toEqual([]);
    // 英語の一言は仮名と漢字を含まない
    const en = render(exampleJson("auction.en.json"), "en").layout.remarks ?? [];
    expect(en.length, "英語の入札の図の一言の数").toBe(remarks.length);
    for (const r of en)
      expect(KANA.test(r.text.text), `英語の一言 ${r.text.text} に仮名か漢字がある`).toBe(false);
  });

  it("lineup-shows-steps-ahead", () => {
    for (const lang of ["ja", "en"] as const) {
      const rendered = render(tableLineup(), lang);
      const motion = motionFrom(rendered);
      const { layout, timeline } = rendered;
      const at = (s: number): number => timeline.stills[s] ?? 0;
      const source = tableLineup() as unknown as Source;
      const last = source.steps.length - 1;
      const aheads = layout.aheads ?? [];
      expect(
        aheads.map((a) => a.step),
        "「この先」の帯を出す段",
      ).toEqual(source.steps.slice(0, last).map((_, s) => s));
      const lanesBottom = Math.max(...layout.lanes.map((l) => l.y + l.h));
      for (const ahead of aheads) {
        expect(
          ahead.tags.map((t) => [t.step, t.text.text]),
          `段 ${ahead.step + 1} の「この先」の札`,
        ).toEqual(source.steps.slice(ahead.step + 1).map((s, k) => [ahead.step + 1 + k, s.title]));
        for (const tag of ahead.tags)
          expect(
            tag.y,
            `段 ${ahead.step + 1} の「この先」の札が箱より下に無い`,
          ).toBeGreaterThanOrEqual(lanesBottom + 10);
        const part = partOf(motion, `[data-lineup-ahead="${ahead.step}"]`);
        expect(
          seenOf(motion, part, at(ahead.step)),
          `段 ${ahead.step + 1} に「この先」の帯が見えない`,
        ).toBeGreaterThan(0.9);
        if (ahead.step > 0)
          expect(
            seenOf(motion, part, at(ahead.step - 1)),
            `段 ${ahead.step} に段 ${ahead.step + 1} の「この先」の帯が見える`,
          ).toBeLessThan(0.1);
        // 札は枠と番号を持ち、矢印で結ぶ
        const tags = [...part.querySelectorAll("[data-lineup-ahead-tag]")];
        expect(tags.length, `段 ${ahead.step + 1} の描いた「この先」の札の数`).toBe(
          ahead.tags.length,
        );
        tags.forEach((tag, k) => {
          expect(
            tag.querySelector("rect"),
            `段 ${ahead.step + 1} の「この先」の札 ${k + 1} に枠が無い`,
          ).not.toBeNull();
          expect(
            tag.textContent,
            `段 ${ahead.step + 1} の「この先」の札 ${k + 1} の番号`,
          ).toContain(String(ahead.step + 2 + k));
        });
        expect(
          part.querySelectorAll("[data-lineup-ahead-arrow]").length,
          `段 ${ahead.step + 1} の「この先」の矢印の数`,
        ).toBeGreaterThanOrEqual(ahead.tags.length - 1);
        const label = part.querySelector("[data-lineup-ahead-label]")?.textContent ?? "";
        if (lang === "ja") expect(label, "「この先」の字").toBe("この先");
        else
          expect(
            label !== "" && !KANA.test(label),
            `英語の「この先」の字 ${label} が空か仮名か漢字を含む`,
          ).toBe(true);
      }
      expect(
        motion.doc.querySelector(`[data-lineup-ahead="${last}"]`),
        "最後の段に「この先」の帯がある",
      ).toBeNull();
    }
  });
});

describe("入札の図を卓の形で描く (#3351)", () => {
  it("auction-pool-chips-carry-no-numbers", () => {
    for (const [name, pool] of [
      ["auction.json", "メモリプール"],
      ["auction.en.json", "Mempool"],
    ] as const) {
      const source = exampleJson(name) as unknown as Source;
      expect(
        (source.blocks.box ?? []).find((b) => b.id === pool)?.order,
        `${name} の ${pool} の order`,
      ).toBe("none");
      const placed = source.steps.flatMap((s) =>
        s.events.flatMap((e) => (e.type === "line" && e.box === pool ? (e.items ?? []) : [])),
      );
      expect(placed.length, `${name} の ${pool} に置くチップ`).toBeGreaterThan(0);
      expect(
        placed.filter((id) => /\d/u.test(id)),
        `${name} の ${pool} に置くチップの名前の数字`,
      ).toEqual([]);
    }
  });

  it("auction-declares-roles-and-legend", () => {
    for (const name of ["auction.json", "auction.en.json"]) {
      const source = exampleJson(name) as unknown as Source;
      const roles = (source.blocks.role ?? []).map((r) => r.id);
      expect(roles.length, `${name} の役の数`).toBe(2);
      const [relay, proposer] = roles as [string, string];
      expect(
        source.steps.map((s) => s.events.filter((e) => e.type === "role").map((e) => e.role)),
        `${name} の段ごとに動く役 (封をする段と公開する段でリレー、金額だけを見せる段と署名する段で提案者)`,
      ).toEqual([[], [], [relay], [proposer], [proposer], [relay], []]);
      for (const role of source.blocks.role ?? [])
        expect(role.note, `${name} の役 ${role.id} の一言`).toBeDefined();
      const pool = source.blocks.box?.[0]?.id;
      const pooled = new Set(
        source.steps[0]?.events.flatMap((e) =>
          e.type === "line" && e.box === pool ? (e.items ?? []) : [],
        ) ?? [],
      );
      for (const item of source.blocks.item ?? []) {
        if (pooled.has(item.id) || item.color !== undefined)
          expect(item.note, `${name} のチップ ${item.id} に凡例の説明が無い`).toBeDefined();
      }
    }
  });
});

describe("列の図の色味 (#3351)", () => {
  it("lineup-layout-same-in-every-palette", () => {
    const source = exampleJson("auction.json");
    const base = draw("renderDiagram")(source, {});
    // 図の名前 (class と動きの名前) は色の値からも作るので、同じ名前に揃え、色と字の変数を書く最初の規則を外して比べる
    const shape = (svg: string): string => {
      const hash = figureClass(svg)?.slice("dg-".length) ?? "";
      return svg
        .split(hash)
        .join("figure")
        .replace(/<style>\.dg-figure\{[^}]*\}/u, "<style>");
    };
    const palettes = draw("PALETTES");
    for (const palette of Object.keys(palettes)) {
      for (const theme of ["light", "dark"] as const) {
        const rendered = draw("renderDiagram")(source, { palette, theme });
        expect(rendered.layout, `色味 ${palette} (${theme}) の置き場所が既定の色味と違う`).toEqual(
          base.layout,
        );
        // 角を落とす色味 (#3344) は箱の形を変えるため、SVG は既定の色味と同じ角の形の色味だけで比べる
        if (palettes[palette]?.corner !== palettes.paper?.corner) continue;
        expect(
          shape(rendered.svg),
          `色味 ${palette} (${theme}) の SVG が色の値の外で既定の色味と違う`,
        ).toBe(shape(base.svg));
      }
    }
  });
});

describe("列の図の見本の file (#3239)", () => {
  it("lineup-example-files-match", () => {
    const parse = api("parseNotation");
    for (const file of ["auction.dragon", "auction.en.dragon", "auction.json", "auction.en.json"]) {
      expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(
        true,
      );
    }
    const ja = parse(fileText("auction.dragon") ?? "");
    const en = parse(fileText("auction.en.dragon") ?? "", { lang: "en" });
    expect(ja.ok && en.ok, "入札の見本の記法が読めない").toBe(true);
    if (!ja.ok || !en.ok) return;
    expect(
      shape(en.diagram as unknown as Source),
      "入札の英語版の列とチップと段と出来事の数が日本語版と違う",
    ).toEqual(shape(ja.diagram as unknown as Source));
    expect((ja.diagram as unknown as Source).kind, "入札の見本の図の種類").toBe("lineup");
  });
});
