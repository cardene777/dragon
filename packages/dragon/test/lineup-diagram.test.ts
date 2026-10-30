// @vitest-environment jsdom
/**
 * 列の図 (#3239)。
 *
 * 1 枚の盤の上でチップの列が動き、並びが変わり、隠れ、現れる様子を段で追う図。原本の JSON の `kind` は `lineup` で、
 * `boxes` が列、`lineup.items` がチップの宣言で、段の中の `line` が列の並びを書き換える。
 * 書き手は並びだけを書き、dragon が前の段との差分を動きに変える。チップは前に居た列から滑り、どの列にも居なかったチップは弾んで現れ、
 * 列から外れたチップは消える。元の列を書き換えない時は元の列にも残る。
 * `seal` は列を左から覆って中身を隠し、`open` は封を消し、`pick` は列の縁に色を付けてほかの列を薄くし、`stamp` は札を押す。
 * 見た目の元は step 2 で本人が選んだ見本 (同じ 6 場面を 3 つの形で動かした 1 枚) の「列の図」。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、濃さと位置は SVG の keyframes を jsdom で読んで確かめる。
 * 見本の file と列の図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError, patched, pointers, smallArchitecture, smallSequence } from "./diagram-support";
import { formatOf, runCli } from "./export-support";
import { type Motion, motionFrom } from "./motion-support";
import { covers, draw, gap, type LaidBox, type Layout, type Rect, type Rendered, sampleTimes } from "./render-support";

/** 書き出し 1 回に許す時間 (`export.test.ts` と同じ) */
const SLOW = 180_000;

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

/** 列。`track` はチップを並べる所 */
interface Lane extends Rect {
  id: string;
  name: string;
  title: Writing;
  note?: Writing;
  track: Rect;
}

/** チップが列の席に居る間 1 回分。`from` は滑り始める左上で、弾んで現れるチップは持たない */
interface Seat extends Rect {
  id: string;
  lane: string;
  index: number;
  step: number;
  event: number;
  from?: [number, number];
}

interface LineupLayout extends Omit<Layout, "boxes"> {
  kind: string;
  boxes: LaidBox[];
  lanes: Lane[];
  chips: Seat[];
  seals: (Rect & { lane: string; step: number; event: number })[];
  stamps: (Writing & { lane: string; step: number; event: number })[];
}

interface LineupRendered extends Omit<Rendered, "layout"> {
  layout: LineupLayout;
}

interface SourceEvent {
  type: string;
  box?: string;
  items?: string[];
}

interface Source {
  kind: string;
  title: string;
  view?: string;
  boxes: { id: string; name: string }[];
  lineup: { items: { id: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
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

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en"): LineupRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "列の図を描けない").toBe("");
  expect((rendered as unknown as LineupRendered | undefined)?.layout?.lanes, "並べた列の図に列 (layout.lanes) が無い").toBeDefined();
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

const seen = (motion: Motion, selector: string, t: number): number => seenOf(motion, partOf(motion, selector), t);

/** 列 `lane` のチップの部品のうち、時刻 `t` に濃さが `low` 以上の物の左上と大きさ。左から並べる */
function chipsIn(motion: Motion, lane: string, t: number, low = 0.9): { id: string; x: number; y: number; scale: number }[] {
  return [...motion.doc.querySelectorAll(`[data-lineup-on="${lane}"]`)]
    .flatMap((el) => {
      if (seenOf(motion, el, t) < low) return [];
      const rect = el.querySelector("rect");
      const [dx = 0, dy = 0, scale = 1] = motion.value(el, "transform", t) ?? [];
      return [{ id: el.getAttribute("data-lineup-chip") ?? "", x: Number(rect?.getAttribute("x")) + dx, y: Number(rect?.getAttribute("y")) + dy, scale }];
    })
    .sort((a, b) => a.x - b.x);
}

const namesIn = (motion: Motion, lane: string, t: number, low?: number): string[] => chipsIn(motion, lane, t, low).map((c) => c.id);

/** 段 `step` の `event` 番目の出来事の時刻。無ければ落とす */
function timeOf(rendered: LineupRendered, step: number, event: number): { start: number; drawn: number } {
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
    lineup: { items: [{ id: "x", color: "amber" }, { id: "y", color: "blue" }, { id: "z", color: "green" }] },
    steps: [stepOf("並べる", [lineEvent("上", ["x", "y"])]), stepOf("移す", [lineEvent("下", ["y", "x"])]), stepOf("並べ直す", [lineEvent("上", ["y", "z"])])],
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
    lineup: { items: [{ id: "a", color: "amber" }, { id: "b", color: "blue" }, { id: "c", color: "green" }] },
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
    lineup: { items: [{ id: "a", color: "amber" }, { id: "b", color: "blue" }] },
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

/** 原本の JSON の、列とチップと段と段ごとの出来事の数 */
const shape = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  lanes: d.boxes.length,
  items: d.lineup.items.length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.length),
});

describe("列の図の原本の JSON (#3239)", () => {
  it("schema-accepts-lineup-diagram", () => {
    const validate = api("validateDiagram");
    const checked = validate(smallLineup());
    expect(checked.ok, `最小の列の図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    // 上限の 12 枚の列も、note の書き換えも通る
    const row = validate(rowOf(MOST));
    expect(row.ok, `12 枚の列が検査で落ちる: ${JSON.stringify(row.ok ? [] : row.errors)}`).toBe(true);
    const sealed = validate(sealedLineup());
    expect(sealed.ok, `note を書き換える列の図が検査で落ちる: ${JSON.stringify(sealed.ok ? [] : sealed.errors)}`).toBe(true);
  });

  it("schema-rejects-misplaced-lineup-events", () => {
    const validate = api("validateDiagram");
    const edge: Json = { type: "edge", from: "甲", to: "乙", carry: { kind: "envelope" } };
    const cases: [string, Json, string][] = [
      ["時系列図に line の出来事", patched(smallSequence(), ["steps", 0, "events"], [lineEvent("a", ["x"])]), "/steps/0/events/0/type"],
      ["時系列図に seal の出来事", patched(smallSequence(), ["steps", 0, "events"], [sealEvent("a")]), "/steps/0/events/0/type"],
      ["構成図に open の出来事", patched(smallArchitecture(), ["steps", 0, "events"], [openEvent("a")]), "/steps/0/events/0/type"],
      ["構成図に pick の出来事", patched(smallArchitecture(), ["steps", 0, "events"], [pickEvent("a")]), "/steps/0/events/0/type"],
      ["時系列図に stamp の出来事", patched(smallSequence(), ["steps", 0, "events"], [stampEvent("a", "済み")]), "/steps/0/events/0/type"],
      ["時系列図に lineup の欄", patched(smallSequence(), ["lineup"], { items: [{ id: "a" }] }), "/lineup"],
      ["列の図に git の欄", patched(smallLineup(), ["git"], { branches: [{ id: "main" }] }), "/git"],
      ["列の図に state の欄", patched(smallLineup(), ["state"], { paths: [{ from: "a", to: "b" }] }), "/state"],
      ["列の図に sequence の欄", patched(smallLineup(), ["sequence"], { lifelines: ["a"] }), "/sequence"],
      ["列の図に time の欄", patched(smallLineup(), ["time"], { scale: { unit: "slot", length: "12s", count: 4 } }), "/time"],
      ["列の図に線の出来事", patched(smallLineup(), ["steps", 0, "events"], [edge]), "/steps/0/events/0/type"],
      ["列の図に処理の出来事", patched(smallLineup(), ["steps", 0, "events"], [{ type: "action", box: "甲", label: "処理" }]), "/steps/0/events/0/type"],
      ["5 字の字のチップ", patched(smallLineup(), ["lineup", "items", 0, "label"], "12345"), "/lineup/items/0/label"],
      ["チップの無い図", patched(smallLineup(), ["lineup", "items"], []), "/lineup/items"],
      ["13 枚の列", patched(rowOf(MOST), ["steps", 0, "events"], [lineEvent("甲", Array.from({ length: MOST + 1 }, (_, i) => `c${i}`))]), "/steps/0/events/0/items"],
    ];
    for (const [name, input, pointer] of cases) {
      const ja = validate(input);
      expect(pointers(ja), `${name} の誤りの場所`).toContain(pointer);
      const en = validate(input, { lang: "en" });
      expect(pointers(en), `${name} の英語の誤りの場所`).toContain(pointer);
      const messages = en.ok ? [] : en.errors.map((e) => e.message);
      expect(messages.filter((m) => KANA.test(m)), `${name} の英語の誤りの文に仮名か漢字がある`).toEqual([]);
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
      expect(parsed.ok, `${name}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      expect(parsed.ok ? parsed.diagram : undefined, `${name}.dragon から作った JSON が ${name}.json と違う`).toEqual(exampleJson(`${name}.json`));
    }
    // 1 行に名札を並べた item は、並べた名札ごとに同じ色と字のチップになる
    const many = parse(["lineup 宣言", "box top", "item a, b [color: amber, label: 7]", "item c", "step 並べる", "  say 並べる。", "  line top: c, a, b"].join("\n"));
    expect(many.ok ? (many.diagram as unknown as Source).lineup.items : many.errors, "item の行が宣言するチップ").toEqual([{ id: "a", color: "amber", label: "7" }, { id: "b", color: "amber", label: "7" }, { id: "c" }]);
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
      ["宣言していないチップの line", [...head, ...step, "  line low: a, zz"], 7, at("  line low: a, zz", "zz")],
      ["宣言していない列の line", [...head, ...step, "  line mid: a"], 7, at("  line mid: a", "mid")],
      ["同じチップを 2 度書いた line", [...head, ...step, "  line low: a, b, a"], 7, at("  line low: a, b, a", "a", 14)],
      ["上限を超える line", ["lineup 小さな列", "box top", `item ${many.join(", ")}`, "step 並べる", "  say 並べる。", crowded], 5, at(crowded, `c${MOST}`)],
      ["最初の step より前の line", ["lineup 小さな列", "box top", "item a", "line top: a", "step 並べる", "  say 並べる。"], 3, 0],
      ["封をした列への line", [...head, ...step, "  seal top", "  line top: a"], 8, at("  line top: a", "top")],
      ["封をしていない列への open", [...head, ...step, "  open top"], 7, at("  open top", "top")],
      ["封をした列への 2 度目の seal", [...head, ...step, "  seal top", "  seal top"], 8, at("  seal top", "top")],
      ["線の行", [...head, ...step, "  top -> low: 送る"], 7, 2],
      ["group の行", ["lineup 小さな列", "group g", "  box top", "end", "item a", "step 並べる", "  say 並べる。"], 1, 0],
      ["act の行", [...head, ...step, "  act top: 処理"], 7, 2],
      ["item の行が無い図", ["lineup 小さな列", "box top", "step 並べる", "  say 並べる。"], 0, 0],
    ];
    for (const [name, lines, row, column] of cases) {
      const want = { line: row + 1, column: column + 1 };
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang})`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
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
          expect(first?.line, `${name} の ${line} が ${head.length + 1} 行目の誤りにならない (${lang})`).toBe(head.length + 1);
          // 列の図の頭の語を名指して、その図でしか書けないことを示す
          expect(first?.message ?? "", `${name} の ${line} の誤りの文が列の図 (lineup) を名指さない (${lang})`).toContain("lineup");
          if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の ${line} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
        }
      }
    }
  });

  it("notation-keeps-lineup-words-plain-outside-lineup", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture"] as const) {
      const text = [`${kind} 列の語の名札`, "box item as 品物", "box line as 回線", "box db", "step 送る", "  say 送る。", "  line -> db: 送る", "  item -> line: 戻す"].join("\n");
      const parsed = parse(text);
      expect(parsed.ok, `${kind} で item と line を名札にした箱が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as { boxes?: { id: string }[]; steps?: { events: { type: string; from?: string; to?: string }[] }[] };
      expect(diagram.boxes?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["item", "line", "db"]);
      expect(diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })), `${kind} の line と item から出る線`).toEqual([
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
      expect(first.ok, `${name} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
      if (!first.ok) continue;
      const printed = print(first.diagram);
      const second = parse(printed);
      expect(second.ok, `${name} を書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`).toBe(true);
      expect(second.ok ? second.diagram : undefined, `${name} を往復した JSON が最初と違う`).toEqual(first.diagram);
    }
    // 字を持つチップと持たないチップが混ざっても往復する
    const printed = print(smallLineup());
    const again = parse(printed);
    expect(again.ok ? again.diagram : again.errors, `小さな列の図を往復した JSON が最初と違う\n${printed}`).toEqual(smallLineup());
  });
});

describe("列の図の並べ方 (#3239)", () => {
  it("lineup-layout-stacks-lanes", () => {
    const { layout } = render(smallLineup());
    expect(layout.kind, "並べた図の種類").toBe("lineup");
    expect(layout.lanes.map((l) => l.id), "列の並びが宣言した順と違う").toEqual(["甲", "乙"]);
    const [top, low] = layout.lanes as [Lane, Lane];
    // 列は上から宣言した順に、同じ左端と幅で 10px 以上離れて並ぶ
    expect(low.y, "2 つ目の列が 1 つ目の列の下に無い").toBeGreaterThanOrEqual(top.y + top.h + 10);
    expect([low.x, low.w], "列の左端と幅が揃わない").toEqual([top.x, top.w]);
    // 列の名前は列の左上、note は列の右上に置く
    expect(top.title.text, "列の名前の字").toBe("列の甲");
    expect(top.note?.text, "列の note の字").toBe("値 1");
    const note = top.note as Writing;
    expect(top.title.x - top.x, "列の名前が列の左端に寄らない").toBeLessThan(top.w / 4);
    expect(top.x + top.w - (note.x + note.w), "note が列の右端に寄らない").toBeLessThan(top.w / 4);
    expect(gap(top.title, note), "列の名前と note の隙間").toBeGreaterThanOrEqual(10);
    expect(low.note, "note を書かない列に note がある").toBeUndefined();

    // チップは列の左から等間隔に並び、列の名前と note から 10px 以上離れる
    const seats = layout.chips.filter((c) => c.lane === "甲" && c.step === 0).sort((a, b) => a.index - b.index);
    expect(seats.map((c) => c.id), "段 1 の甲の列のチップ").toEqual(["a", "b", "c"]);
    const pitch = (seats[1]?.x ?? 0) - (seats[0]?.x ?? 0);
    expect(pitch, "チップの間").toBeGreaterThan(seats[0]?.w ?? 0);
    expect((seats[2]?.x ?? 0) - (seats[1]?.x ?? 0), "チップの間が揃わない").toBeCloseTo(pitch, 6);
    expect(seats[0]?.x, "最初のチップが列の左端に置かれない").toBeCloseTo(top.track.x, 6);
    for (const chip of seats) {
      expect(gap(chip, top.title), `チップ ${chip.id} と列の名前の隙間`).toBeGreaterThanOrEqual(10);
      expect(gap(chip, note), `チップ ${chip.id} と note の隙間`).toBeGreaterThanOrEqual(10);
    }

    // 図の幅は上限の 12 枚の列の幅で決まり、チップの数で変わらない
    const one = render(rowOf(1)).layout;
    const full = render(rowOf(MOST)).layout;
    expect(one.width, "1 枚の列の図と 12 枚の列の図の幅が違う").toBe(full.width);
    const lane = full.lanes[0] as Lane;
    const last = full.chips.filter((c) => c.lane === lane.id).sort((a, b) => a.index - b.index)[MOST - 1] as Seat;
    expect(last.x + last.w, "12 枚目のチップが列の並びの右端を超える").toBeLessThanOrEqual(lane.track.x + lane.track.w + 1e-6);
    expect(lane.track.x + lane.track.w, "列の並びが列の外へ出る").toBeLessThan(lane.x + lane.w);
    expect(lane.x + lane.w, "列が図の外へ出る").toBeLessThan(full.width);
  });

  it("lineup-chips-show-labels", () => {
    const rendered = render(smallLineup());
    const motion = motionFrom(rendered);
    const chip = (id: string): Element => partOf(motion, `[data-lineup-chip="${id}"]`);
    // 字を持つチップは字を出す
    expect(chip("a").querySelector("text")?.textContent, "字を持つチップの字").toBe("12");
    expect(chip("a").getAttribute("style"), "色を持つチップの色").toContain("--c:var(--c-amber)");
    // 字を持たないチップは色だけを出す
    expect(chip("b").querySelector("text"), "字を持たないチップに字がある").toBeNull();
    expect(chip("b").getAttribute("style"), "色を持つチップの色").toContain("--c:var(--c-blue)");
    expect(chip("b").querySelector("rect")?.getAttribute("class"), "色を持つチップの地").toBe("dg-ln-chip");
    // 色を持たないチップは薄い色の地で出す
    expect(chip("c").getAttribute("style"), "色を持たないチップに色がある").not.toContain("--c:");
    expect(chip("c").querySelector("rect")?.getAttribute("class"), "色を持たないチップの地").toBe("dg-ln-plain");
    // 字はチップの中に収まる
    const wide = render(patched(smallLineup(), ["lineup", "items", 0, "label"], "1234")).layout;
    const seat = wide.chips.find((c) => c.id === "a") as Seat;
    const plain = render(smallLineup()).layout.chips.find((c) => c.id === "a") as Seat;
    expect(seat.w, "4 字のチップの幅が字の幅まで広がらない").toBeGreaterThan(plain.w);
  });

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
    const where = (list: { id: string; x: number; y: number }[], id: string): { x: number; y: number } => {
      const found = list.find((c) => c.id === id);
      expect(found, `チップ ${id} が見えない`).toBeDefined();
      return found as { x: number; y: number };
    };
    const start = where(chipsIn(motion, "下", slide.start + 0.01), "y");
    expect(Math.hypot(start.x - where(before, "y").x, start.y - where(before, "y").y), "チップ y が前に居た位置から滑り出さない").toBeLessThan(3);
    const middle = where(chipsIn(motion, "下", (slide.start + slide.drawn) / 2), "y");
    expect(middle.y, "チップ y が段の途中で途中の高さに居ない").toBeGreaterThan(where(before, "y").y + 3);
    expect(middle.y, "チップ y が段の途中で着いている").toBeLessThan(where(after, "y").y - 3);
    const landed = where(chipsIn(motion, "下", slide.drawn), "y");
    expect(Math.hypot(landed.x - where(after, "y").x, landed.y - where(after, "y").y), "チップ y が滑り終えた時に列の席に居ない").toBeLessThan(0.5);

    // 段 3。並びに残るチップは同じ列の中で滑り、外れたチップは消え、どの列にも居なかったチップは弾んで現れる
    expect(namesIn(motion, "上", at(2)), "段 3 の上の列").toEqual(["y", "z"]);
    const again = timeOf(rendered, 2, 0);
    const shifted = where(chipsIn(motion, "上", again.start + 0.01), "y");
    expect(Math.abs(shifted.x - where(before, "y").x), "チップ y が同じ列の中で元の席から滑り出さない").toBeLessThan(3);
    expect(where(chipsIn(motion, "上", at(2)), "y").x, "チップ y が同じ列の中で左の席へ移らない").toBeLessThan(where(before, "y").x);
    const z = partOf(motion, '[data-lineup-chip="z"]');
    expect(seenOf(motion, z, again.start - 0.05), "チップ z が現れる前に見える").toBeLessThan(0.1);
    expect(motion.value(z, "transform", again.start + 0.02)?.[2] ?? 1, "チップ z が小さな所から弾んで現れない").toBeLessThan(0.7);
    expect(motion.value(z, "transform", at(2))?.[2], "チップ z が元の大きさにならない").toBeCloseTo(1, 3);
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
    expect(opened.map((c) => c.id), "段 1 の甲の列").toEqual(["a", "b", "c"]);

    // 封は列の左から右へ伸び、覆い終えた列のチップは見えない
    const closing = timeOf(rendered, 1, 0);
    expect(scale(closing.start), "封が左端から始まらない").toBeLessThan(0.05);
    expect(scale((closing.start + closing.drawn) / 2), "封が段の途中で途中まで伸びない").toBeGreaterThan(0.05);
    expect(scale((closing.start + closing.drawn) / 2), "封が段の途中で伸び切っている").toBeLessThan(0.95);
    expect(rendered.svg, "封の伸びる起点が列の左端でない").toMatch(/\.dg-ln-seal\{[^}]*transform-box:fill-box;transform-origin:0 50%/u);
    expect(scale(at(1)), "封が列を覆い切らない").toBeCloseTo(1, 3);
    expect(seen(motion, selector, at(1)), "段 2 の封が見えない").toBeGreaterThan(0.9);
    expect(namesIn(motion, "甲", at(1), 0.1), "封をした列のチップが見える").toEqual([]);
    expect(namesIn(motion, "乙", at(1)), "封をしていない列のチップが隠れる").toEqual(["a"]);

    // 封は列のチップの席を全部覆う
    const lane = laneOf(layout, "甲");
    const cover = layout.seals.find((s) => s.lane === "甲");
    expect(cover, "封の置き場所が並べた図に無い").toBeDefined();
    expect(cover?.x ?? 0, "封が並びの左端を覆わない").toBeLessThanOrEqual(lane.track.x);
    expect((cover?.x ?? 0) + (cover?.w ?? 0), "封が並びの右端を覆わない").toBeGreaterThanOrEqual(lane.track.x + lane.track.w);

    // 封をしたまま段が進んでも見えない
    expect(namesIn(motion, "甲", at(2), 0.1), "段 3 に封をした列のチップが見える").toEqual([]);
    // open の段で封が消え、チップが同じ並びで見える
    expect(seen(motion, selector, at(3)), "open の段で封が消えない").toBeLessThan(0.1);
    expect(chipsIn(motion, "甲", at(3)), "open の段のチップが封をする前の並びと違う").toEqual(opened);
  });

  it("lineup-pick-fades-other-lanes", () => {
    const rendered = render(pickedLineup());
    const motion = motionFrom(rendered);
    const at = (s: number): number => rendered.timeline.stills[s] ?? 0;
    const lane = (id: string): string => `[data-lineup-lane="${id}"]`;
    const ring = '[data-lineup-ring="乙"]';

    expect(seen(motion, ring, at(0)), "pick の段より前に縁の色が見える").toBeLessThan(0.1);
    for (const id of ["甲", "乙", "丙"]) expect(seen(motion, lane(id), at(0)), `pick の段より前に ${id} の列が薄い`).toBeGreaterThan(0.9);

    // pick の段から後、選んだ列の縁に色が付き、ほかの列はチップまで薄くなる
    expect(seen(motion, ring, at(1)), "pick の段に縁の色が見えない").toBeGreaterThan(0.9);
    expect(seen(motion, lane("乙"), at(1)), "選んだ列が薄い").toBeGreaterThan(0.9);
    expect(namesIn(motion, "乙", at(1)), "選んだ列のチップが薄い").toEqual(["a"]);
    for (const id of ["甲", "丙"]) {
      expect(seen(motion, lane(id), at(1)), `選ばなかった ${id} の列が薄くならない`).toBeLessThan(0.6);
      expect(namesIn(motion, id, at(1), 0.6), `選ばなかった ${id} の列のチップが薄くならない`).toEqual([]);
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
    expect((placed?.x ?? 0) + (placed?.w ?? 0), "札が列の外へ出る").toBeLessThanOrEqual(lane.x + lane.w);
  });
});

describe("列の図の見本 (#3239)", () => {
  it("auction-renders-7-steps", () => {
    const source = exampleJson("auction.json") as unknown as Source;
    expect(source.kind, "入札の図の種類").toBe("lineup");
    expect(source.steps.map((s) => s.title), "入札の図の段の題が決めた 7 段と違う").toEqual([...AUCTION_STEPS]);
    const rendered = render(source as unknown as Json);
    const motion = motionFrom(rendered);
    const { timeline } = rendered;
    expect(timeline.steps, "時刻の表の段の数").toHaveLength(7);
    timeline.steps.forEach((step, i) => {
      expect(step.end, `段 ${i + 1} の長さ`).toBeGreaterThan(step.start);
      if (i > 0) expect(step.start, `段 ${i + 1} の始まり`).toBeGreaterThanOrEqual((timeline.steps[i - 1]?.end ?? Number.POSITIVE_INFINITY) - 1e-9);
    });
    const at = (s: number): number => timeline.stills[s] ?? 0;

    // 段 1 でメモリプールの列にチップが並ぶ
    expect(namesIn(motion, "メモリプール", at(0)).length, "段 1 のメモリプールの列のチップ").toBeGreaterThan(0);
    for (const id of BUILDERS) expect(namesIn(motion, id, at(0)), `段 1 に ${id} の列のチップが見える`).toEqual([]);
    // 段 2 でビルダーの 3 列が並ぶ。並びは列ごとに違う
    const orders = BUILDERS.map((id) => namesIn(motion, id, at(1)));
    for (const [k, order] of orders.entries()) expect(order.length, `段 2 の ${BUILDERS[k]} の列のチップ`).toBeGreaterThan(0);
    expect(new Set(orders.map((order) => order.join(","))).size, "段 2 の 3 列の並びが同じ").toBe(3);
    // 段 3 で 3 列に封が付く
    for (const id of BUILDERS) {
      expect(seen(motion, `[data-lineup-seal="${id}"]`, at(2)), `段 3 の ${id} の封が見えない`).toBeGreaterThan(0.9);
      expect(namesIn(motion, id, at(2), 0.1), `段 3 に ${id} の列のチップが見える`).toEqual([]);
    }
    // 段 4 で選んだ列が残る
    expect(seen(motion, '[data-lineup-ring="ビルダーB"]', at(3)), "段 4 に選んだ列の縁の色が見えない").toBeGreaterThan(0.9);
    expect(seen(motion, '[data-lineup-lane="ビルダーA"]', at(3)), "段 4 に選ばなかった列が薄くならない").toBeLessThan(0.6);
    expect(seen(motion, '[data-lineup-seal="ビルダーC"]', at(3)), "段 4 に選ばなかった列の封が薄くならない").toBeLessThan(0.6);
    // 段 5 で札が出る
    expect(seen(motion, '[data-lineup-stamp="ビルダーB"]', at(3)), "段 4 に札が見える").toBeLessThan(0.1);
    expect(seen(motion, '[data-lineup-stamp="ビルダーB"]', at(4)), "段 5 の札が見えない").toBeGreaterThan(0.9);
    // 段 6 で封が開く。負けた列の封は開かない
    expect(seen(motion, '[data-lineup-seal="ビルダーB"]', at(5)), "段 6 に封が開かない").toBeLessThan(0.1);
    expect(namesIn(motion, "ビルダーB", at(5)), "段 6 のチップが段 2 の並びと違う").toEqual(orders[1]);
    expect(namesIn(motion, "ビルダーA", at(5), 0.1), "段 6 に負けた列のチップが見える").toEqual([]);
    // 段 7 でバリデーターの列にチップが並ぶ
    expect(namesIn(motion, "バリデーター", at(5)), "段 6 にバリデーターの列のチップが見える").toEqual([]);
    expect(namesIn(motion, "バリデーター", at(6)).length, "段 7 のバリデーターの列のチップ").toBeGreaterThan(0);
  });

  it("lineup-keeps-motion-rules", () => {
    const { timeline } = render(exampleJson("auction.json"));
    for (const t of sampleTimes(timeline)) expect(timeline.labels.filter((span) => covers(span, t)).length, `入札の図の ${t} 秒に見える線の名前`).toBeLessThanOrEqual(2);
    expect(timeline.badges.map((b) => b.step), "入札の図の段の番号").toEqual(timeline.steps.map((_, i) => i));
    for (const badge of timeline.badges) {
      const step = timeline.steps[badge.step];
      expect(badge.appears, `入札の図の段 ${badge.step + 1} の番号が段より前に出る`).toBeGreaterThanOrEqual(step?.start ?? Number.POSITIVE_INFINITY);
    }
  });

  it("lineup-stays-whole-when-narrow", () => {
    for (const [name, lang] of [
      ["auction.json", "ja"],
      ["auction.en.json", "en"],
    ] as const) {
      const rendered = render(exampleJson(name), lang);
      const narrow = draw("chooseView")(rendered, 390);
      expect(narrow.mode, `${name} の 390px の枠の見せ方`).toBe("fixed");
      expect(narrow.textPx, `${name} の 390px の枠に収めた字の大きさ`).toBeGreaterThanOrEqual(10.5);
      // 中身の幅が 324px の枠 (本文の余白を引いた携帯の幅) でも全体を見せる
      expect(draw("chooseView")(rendered, 324).mode, `${name} の 324px の枠の見せ方`).toBe("fixed");
    }
  });
});

describe("列の図の書き出し (#3239)", () => {
  it(
    "export-writes-lineup-diagram",
    async () => {
      const json = join(EXAMPLES, "auction.json");
      expect(existsSync(json), "auction.json が無い").toBe(true);
      const out = join(mkdtempSync(join(tmpdir(), "dragon-lineup-")), "out");
      const ran = await runCli(["export", json, "--out", out, "--fps", "2", "--gif-fps", "1"]);
      expect(ran.code, `書き出しの命令が落ちた: ${ran.stderr}`).toBe(0);
      for (const format of ["mp4", "gif", "html", "png"] as const) {
        const file = join(out, `auction.${format}`);
        const bytes = existsSync(file) ? readFileSync(file) : Buffer.alloc(0);
        expect(formatOf(bytes), `${file} が ${format} として書かれていない`).toBe(format);
      }

      const shots: Buffer[] = [];
      for (const k of [0, 1]) {
        const outDir = join(mkdtempSync(join(tmpdir(), "dragon-lineup-")), `run-${k}`);
        const png = await runCli(["export", json, "--format", "png", "--out", outDir]);
        expect(png.code, `${k + 1} 回目の PNG の書き出しが落ちた: ${png.stderr}`).toBe(0);
        const file = join(outDir, "auction.png");
        expect(existsSync(file), `${k + 1} 回目の PNG を書き出していない`).toBe(true);
        shots.push(existsSync(file) ? readFileSync(file) : Buffer.alloc(0));
      }
      expect((shots[0] as Buffer).equals(shots[1] as Buffer), "同じ JSON から 2 回書き出した PNG がバイト単位で違う").toBe(true);
    },
    SLOW * 2,
  );
});

describe("列の図の見本の file (#3239)", () => {
  it("lineup-example-files-match", () => {
    const parse = api("parseNotation");
    for (const file of ["auction.dragon", "auction.en.dragon", "auction.json", "auction.en.json"]) {
      expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(true);
    }
    const ja = parse(fileText("auction.dragon") ?? "");
    const en = parse(fileText("auction.en.dragon") ?? "", { lang: "en" });
    expect(ja.ok && en.ok, "入札の見本の記法が読めない").toBe(true);
    if (!ja.ok || !en.ok) return;
    expect(shape(en.diagram as unknown as Source), "入札の英語版の列とチップと段と出来事の数が日本語版と違う").toEqual(shape(ja.diagram as unknown as Source));
    expect((ja.diagram as unknown as Source).kind, "入札の見本の図の種類").toBe("lineup");
  });
});
