// @vitest-environment jsdom
/**
 * 木の図 (#3233)。
 *
 * 親子で枝分かれする木を、葉から根へ組み上げたり、根と葉の間を辿ったりする様子を段で追う図。原本の JSON の `kind` は `tree` で、
 * 葉を出す出来事 (`leaf`) と、1 つ以上の子から親を組む出来事 (`node`) は段の中に置き、書いた段で箱が現れる。
 * 親子の箱どうしの運ぶ物の線は、子と親を結ぶ木の線の上を走る。木の線を運ぶ物が通った段から後は、
 * それまでに運ぶ物を送るか受けた木の箱だけを濃く出し、ほかの木の箱を薄く出す。
 * 見た目の元は step 2 で本人が選んだ「根を上」の試作 (`.context/propose/merkle-look/`)。根を上の真ん中に置き、葉を下に並べる。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、濃さは SVG の keyframes を jsdom で読んで確かめる。
 * 見本の file と、木の図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { api, type Json, type LineError, patched, pointers, smallSequence } from "./diagram-support";
import { formatOf, runCli } from "./export-support";
import { place, releasePlaced } from "./follow-support";
import { type Motion, motionFrom } from "./motion-support";
import { covers, draw, gap, type LaidBox, type Layout, type Rect, type Rendered, sampleTimes } from "./render-support";

/** 書き出し 1 回に許す時間 (`export.test.ts` と同じ) */
const SLOW = 180_000;

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** Merkle の図の 8 段の題。前半の 4 段で組み上げ、後半の 4 段で証明の道を辿る (step 2 で決めた) */
const MERKLE_STEPS = [
  "取引ごとに値を出す",
  "2つずつ組む",
  "さらに2つを組む",
  "根ができる",
  "取引3の値を出す",
  "e5f8と組む",
  "7a21と組む",
  "6f53と組んで根と照らす",
] as const;

/** Merkle の図の段 8 で濃く出る木の箱 (証明で運ぶ物を送るか受けた箱) */
const PROOF_BOXES = ["取引3", "取引4", "3から4", "1から2", "1から4", "5から8", "根"] as const;

/** Merkle の図の段 8 で薄く出る木の箱 */
const FAINT_BOXES = ["取引1", "取引2", "取引5", "取引6", "取引7", "取引8", "5から6", "7から8"] as const;

/** 証明の道。段 (0 から数える) と、その段で取引 3 の側の値を運ぶ子と親 */
const PROOF_PATH: [number, string, string][] = [
  [5, "取引3", "3から4"],
  [6, "3から4", "1から4"],
  [7, "1から4", "根"],
];

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Point = [number, number];

/** 木の箱。葉 (`leaf`) と、子から組んだ親 (`node`) */
interface TreeNode extends Rect {
  id: string;
  kind: "leaf" | "node";
  /** 根からの深さ。根が 0 */
  depth: number;
  parent?: string;
  children: string[];
  /** 箱を書いた段と、段の中の出来事の番号 */
  step: number;
  event: number;
  hash?: string;
  root: boolean;
  /** 箱の中の字を上から並べた行 */
  lines: string[];
  /** 値を持つ葉の下に置く、名札の札 */
  card?: Rect & { text: string };
}

/** 子から親への木の線。親を書いた段で現れる */
interface TreeLink {
  from: string;
  to: string;
  step: number;
  points: Point[];
}

interface TreeLayout extends Omit<Layout, "boxes"> {
  kind: string;
  boxes: LaidBox[];
  nodes: TreeNode[];
  links: TreeLink[];
}

interface TreeRendered extends Omit<Rendered, "layout"> {
  layout: TreeLayout;
}

interface SourceEvent {
  type: string;
  id?: string;
  children?: string[];
  hash?: string;
  from?: string;
  to?: string;
  field?: string;
  value?: string;
}

interface Source {
  kind: string;
  title: string;
  view?: string;
  boxes: { id: string; name: string }[];
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
function render(diagram: Json, lang?: "ja" | "en"): TreeRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "木の図を描けない").toBe("");
  expect((rendered as unknown as TreeRendered | undefined)?.layout?.nodes, "並べた木の図に木の箱 (layout.nodes) が無い").toBeDefined();
  return rendered as unknown as TreeRendered;
}

const nodeOf = (layout: TreeLayout, id: string): TreeNode => {
  const node = layout.nodes.find((n) => n.id === id);
  expect(node, `木の箱 ${id} が並べた図に無い`).toBeDefined();
  return node as TreeNode;
};

const linkOf = (layout: TreeLayout, child: string): TreeLink => {
  const link = layout.links.find((l) => l.from === child);
  expect(link, `${child} から親への木の線が並べた図に無い`).toBeDefined();
  return link as TreeLink;
};

const centerX = (r: Rect): number => r.x + r.w / 2;
const centerY = (r: Rect): number => r.y + r.h / 2;

/** 描いた図の部品。無ければ落とす */
function partOf(motion: Motion, selector: string): Element {
  const el = motion.doc.querySelector(selector);
  expect(el, `描いた図に ${selector} の部品が無い`).not.toBeNull();
  return el as Element;
}

/** 部品の見える濃さ。動きの濃さに、部品と包む部品の `opacity` の属性も掛ける */
function seen(motion: Motion, selector: string, t: number): number {
  const el = partOf(motion, selector);
  let o = motion.opacity(el, t);
  for (let e: Element | null = el; e; e = e.parentElement) {
    const attr = e.getAttribute("opacity");
    if (attr !== null) o *= Number(attr);
  }
  return o;
}

const treeEventsOf = (d: Source, type: "leaf" | "node"): (SourceEvent & { step: number })[] =>
  d.steps.flatMap((step, s) => step.events.flatMap((e) => (e.type === type ? [{ ...e, step: s }] : [])));

/** 原本の JSON の、葉と親と段と段ごとの出来事の数 */
const shape = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  leaves: treeEventsOf(d, "leaf").length,
  nodes: treeEventsOf(d, "node").length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.length),
});

const leaf = (id: string, hash?: string): Json => ({ type: "leaf", id, ...(hash ? { hash } : {}) });
const node = (id: string, children: string[], hash?: string): Json => ({ type: "node", id, children, ...(hash ? { hash } : {}) });
const carry = (from: string, to: string, text: string): Json => ({ type: "edge", from, to, carry: { kind: "tag", text } });

/** 葉 4 つを 2 段で出し、2 つずつ組んで根まで組み、葉 c の値を親へ運ぶ最小の木の図。箱を 1 つ持つ */
function smallTree(): Json {
  return {
    version: 1,
    kind: "tree",
    title: "小さな木",
    boxes: [{ id: "記録", name: "記録した根" }],
    steps: [
      { title: "葉を出す", body: "葉 a と b を出す。", events: [leaf("a", "3fa0"), leaf("b", "8b04")] },
      { title: "葉を足す", body: "葉 c と d を足し、a と b を組む。", events: [leaf("c", "c41d"), leaf("d", "e5f8"), node("ab", ["a", "b"], "7a21")] },
      { title: "根まで組む", body: "c と d を組み、根を組む。", events: [node("cd", ["c", "d"], "b9e4"), node("top", ["ab", "cd"], "e71c")] },
      { title: "運ぶ", body: "c の値を親へ運ぶ。", events: [carry("c", "cd", "c41d"), carry("d", "cd", "e5f8")] },
    ],
  };
}

/** 子が 1 つの親を持ち、葉の深さが揃わない木。値を持たない */
function unevenTree(): Json {
  return {
    version: 1,
    kind: "tree",
    title: "揃わない木",
    boxes: [],
    steps: [
      { title: "葉", body: "葉を出す。", events: [leaf("x1"), leaf("x2"), leaf("x3")] },
      { title: "組む", body: "親を組む。", events: [node("p", ["x1"]), node("q", ["p", "x2"]), node("r", ["q", "x3"])] },
    ],
  };
}

describe("木の図の原本の JSON (#3233)", () => {
  it("schema-accepts-tree-diagram", () => {
    const validate = api("validateDiagram");
    const checked = validate(smallTree());
    expect(checked.ok, `最小の木の図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    // 値を持たない葉と親も通る
    const plain = validate(unevenTree());
    expect(plain.ok, `値を持たない木の図が検査で落ちる: ${JSON.stringify(plain.ok ? [] : plain.errors)}`).toBe(true);
  });

  it("schema-rejects-misplaced-tree-events", () => {
    const validate = api("validateDiagram");
    const cases: [string, Json, string][] = [
      ["時系列図に葉の出来事", patched(smallSequence(), ["steps", 0, "events"], [leaf("a")]), "/steps/0/events/0/type"],
      ["時系列図に親の出来事", patched(smallSequence(), ["steps", 0, "events"], [node("ab", ["a"])]), "/steps/0/events/0/type"],
      ["木の図に git の欄", patched(smallTree(), ["git"], { branches: [{ id: "main" }] }), "/git"],
      ["木の図に state の欄", patched(smallTree(), ["state"], { paths: [{ from: "a", to: "b" }] }), "/state"],
      ["木の図に sequence の欄", patched(smallTree(), ["sequence"], { lifelines: ["a"] }), "/sequence"],
      ["木の図に time の欄", patched(smallTree(), ["time"], { scale: { unit: "slot", length: "12s", count: 4 } }), "/time"],
      ["子の無い親", patched(smallTree(), ["steps", 1, "events", 2, "children"], []), "/steps/1/events/2/children"],
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

describe("木の図の記法 (#3233)", () => {
  it("notation-compiles-tree-examples-to-json", () => {
    const parse = api("parseNotation");
    for (const name of ["merkle", "merkle.en"]) {
      const text = fileText(`${name}.dragon`);
      expect(text, `${name}.dragon が無い`).toBeDefined();
      const parsed = parse(text ?? "", { lang: name.endsWith(".en") ? "en" : "ja" });
      expect(parsed.ok, `${name}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      expect(parsed.ok ? parsed.diagram : undefined, `${name}.dragon から作った JSON が ${name}.json と違う`).toEqual(exampleJson(`${name}.json`));
    }
  });

  it("notation-rejects-misused-tree-lines", () => {
    const parse = api("parseNotation");
    // 誤りの文は書き手の名札をそのまま引くので、英語の文を確かめるこの検査の箱の名札は英字にする
    const head = ["tree 小さな木", "box ledger"];
    const step = ["step 組む", "  say 組む。", "  leaf x1 [hash: 3fa0]", "  leaf x2"];
    // 記法の行と、誤りの行 (0 から数える) と、その行の中の誤りを指す語の位置 (0 から数える)。
    // 木の形の誤り (親を持たない箱が 2 つ以上残る) は全ての行を読んだ後に確かめるので、行の誤りが無い時だけ出る
    const at =(line: string, token: string, from = 0): number => line.indexOf(token, from);
    const cases: [string, string[], number, number][] = [
      ["まだ書いていない名札を子にした node", [...head, ...step, "  node y of x1, zz"], 6, at("  node y of x1, zz", "zz")],
      ["木の箱でない箱を子にした node", [...head, ...step, "  node y of x1, ledger"], 6, at("  node y of x1, ledger", "ledger")],
      ["既にある葉と同じ名札の leaf", [...head, ...step, "  leaf x1"], 6, at("  leaf x1", "x1")],
      ["既にある箱と同じ名札の leaf", [...head, ...step, "  leaf ledger"], 6, at("  leaf ledger", "ledger")],
      ["2 つの親の子になる箱", [...head, ...step, "  node y1 of x1, x2", "  node y2 of x2"], 7, at("  node y2 of x2", "x2", 10)],
      ["最初の step より前の leaf", ["tree 小さな木", "leaf x1", ...step], 1, 0],
      ["親を持たない箱が 2 つ以上残る木", [...head, ...step], 5, at("  leaf x2", "x2")],
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

  it("notation-limits-tree-lines-to-tree", () => {
    const parse = api("parseNotation");
    // 記法の行と、誤りの行 (1 から数える)
    const cases: [string, string[], number][] = [
      ["時系列図の leaf の行", ["sequence 木の行", "box a", "step 送る", "  say 送る。", "  a -> a", "  leaf x1"], 6],
      ["構成図の node の行", ["architecture 木の行", "box a", "box b", "step 送る", "  say 送る。", "  a -> b", "  node y of a"], 7],
      ["状態遷移図の leaf の行", ["state 木の行", "box a", "step 送る", "  say 送る。", "  start -> a", "  leaf x1"], 6],
      ["枝分かれの図の leaf の行", ["git 木の行", "branch main", "step 積む", "  say 積む。", "  commit A on main", "  leaf x1"], 6],
      ["時間軸の図の node の行", ["time 木の行", "scale slot 12s 4", "row a", "step 進む", "  say 進む。", "  now -> 1", "  node y of a"], 7],
    ];
    for (const [name, lines, line] of cases) {
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first?.line, `${name} が ${line} 行目の誤りにならない (${lang})`).toBe(line);
        // 木の図の頭の語を名指して、その図でしか書けないことを示す
        expect(first?.message ?? "", `${name} の誤りの文が木の図 (tree) を名指さない (${lang})`).toContain("tree");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-keeps-leaf-and-node-plain-outside-tree", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture"] as const) {
      const text = [`${kind} 葉と節の名札`, "box leaf as 葉", "box node as 節", "step 送る", "  say 送る。", "  node -> leaf: 送る"].join("\n");
      const parsed = parse(text);
      expect(parsed.ok, `${kind} で leaf と node を名札にした箱が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as Source;
      expect(diagram.boxes?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["leaf", "node"]);
      const line = diagram.steps?.[0]?.events?.[0];
      expect(line && { type: line.type, from: line.from, to: line.to }, `${kind} の node から leaf への線`).toEqual({ type: "edge", from: "node", to: "leaf" });
    }
  });

  it("tree-roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of ["merkle.dragon", "merkle.en.dragon"]) {
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
  });
});

describe("木の図の並べ方 (#3233)", () => {
  it("tree-layout-puts-root-on-top", () => {
    for (const [name, diagram] of [
      ["小さな木", smallTree()],
      ["揃わない木", unevenTree()],
      ["Merkle の図", exampleJson("merkle.json")],
    ] as const) {
      const { layout } = render(diagram);
      const roots = layout.nodes.filter((n) => n.root);
      expect(roots.map((n) => n.depth), `${name} の根が 1 つでない`).toEqual([0]);
      const root = roots[0] as TreeNode;
      for (const n of layout.nodes) {
        if (n !== root) expect(n.y, `${name} の ${n.id} が根より下に無い`).toBeGreaterThan(root.y + root.h - 1e-6);
        // 根からの深さが同じ箱は同じ高さに並ぶ
        for (const m of layout.nodes) if (m.depth === n.depth) expect(Math.abs(centerY(m) - centerY(n)), `${name} の深さ ${n.depth} の ${n.id} と ${m.id} の高さ`).toBeLessThan(0.5);
        // 親は子の真ん中の上に置く
        if (n.children.length > 0) {
          const kids = n.children.map((c) => nodeOf(layout, c));
          const mid = (centerX(kids[0] as TreeNode) + centerX(kids[kids.length - 1] as TreeNode)) / 2;
          expect(Math.abs(centerX(n) - mid), `${name} の ${n.id} が子の真ん中の上に無い`).toBeLessThan(0.5);
          for (const k of kids) expect(k.depth, `${name} の ${k.id} の深さ`).toBe(n.depth + 1);
        }
        // 箱どうしは 10px 以上離れる
        for (const m of layout.nodes) if (m !== n) expect(gap(n, m), `${name} の ${n.id} と ${m.id} の隙間`).toBeGreaterThanOrEqual(10);
      }
      // 葉は書いた順に左から並ぶ
      const source = diagram as unknown as Source;
      const written = treeEventsOf(source, "leaf").map((e) => e.id ?? "");
      const leaves = layout.nodes.filter((n) => n.kind === "leaf");
      expect([...leaves].sort((a, b) => a.x - b.x).map((n) => n.id), `${name} の葉の並び`).toEqual(written);
    }
    // 根は葉の並びの真ん中の上に来る
    const merkle = render(exampleJson("merkle.json")).layout;
    const leaves = merkle.nodes.filter((n) => n.kind === "leaf");
    const span = (Math.min(...leaves.map(centerX)) + Math.max(...leaves.map(centerX))) / 2;
    expect(Math.abs(centerX(nodeOf(merkle, "根")) - span), "Merkle の図の根が葉の並びの真ん中の上に無い").toBeLessThan(0.5);
    // 木の箱でない箱は木の右に、根と同じ高さから縦に並ぶ
    const small = render(smallTree()).layout;
    const right = Math.max(...small.nodes.map((n) => n.x + n.w));
    const box = small.boxes.find((b) => b.id === "記録");
    expect(box, "小さな木の箱 記録 が並べた図に無い").toBeDefined();
    expect(box?.x ?? 0, "箱 記録 が木の右に無い").toBeGreaterThanOrEqual(right + 10);
    expect(Math.abs((box?.y ?? 0) - nodeOf(small, "top").y), "箱 記録 の上端が根の上端と揃わない").toBeLessThan(0.5);
  });

  it("tree-boxes-show-values", () => {
    const rendered = render(smallTree());
    const { layout, svg, timeline } = rendered;
    // 値を持つ葉は箱に値だけを出し、名札を葉の下の札に出す
    for (const id of ["a", "b", "c", "d"]) {
      const n = nodeOf(layout, id);
      expect(n.lines, `葉 ${id} の箱の字`).toEqual([n.hash]);
      expect(n.card?.text, `葉 ${id} の札の字`).toBe(id);
      if (n.card) expect(n.card.y, `葉 ${id} の札が葉の下に無い`).toBeGreaterThanOrEqual(n.y + n.h);
    }
    // 値を持つ親は値を大きく、名札を小さく出す
    expect(nodeOf(layout, "ab").lines, "親 ab の箱の字").toEqual(["7a21", "ab"]);
    expect(svg, "親 ab の値の字が描かれない").toContain(">7a21<");
    // 値を持たない葉と親は箱に名札を出し、札を持たない
    const uneven = render(unevenTree()).layout;
    expect(nodeOf(uneven, "x1").lines, "値を持たない葉の字").toEqual(["x1"]);
    expect(nodeOf(uneven, "x1").card, "値を持たない葉に札がある").toBeUndefined();
    expect(nodeOf(uneven, "q").lines, "値を持たない親の字").toEqual(["q"]);
    // 根の箱は枝の絵を持ち、ほかの木の箱より大きい
    const top = nodeOf(layout, "top");
    expect(svg, "根の箱の印 (data-tree-root) が無い").toContain('data-tree-root="top"');
    for (const n of layout.nodes) if (!n.root) expect(top.w * top.h, `根の箱が ${n.id} の箱より大きくない`).toBeGreaterThan(n.w * n.h);
    // 札は最初の段から見え、段 2 で書いた葉 c の箱はまだ見えない
    const motion = motionFrom(rendered);
    const first = timeline.stills[0] ?? 0;
    expect(seen(motion, '[data-tree-card="c"]', first), "段 1 の止め絵で葉 c の札が見えない").toBeGreaterThan(0.9);
    expect(seen(motion, '[data-tree-node="c"]', first), "段 1 の止め絵で段 2 の葉 c の箱が見える").toBeLessThan(0.1);
  });

  it("tree-boxes-appear-at-their-step", () => {
    for (const [name, diagram] of [
      ["小さな木", smallTree()],
      ["Merkle の図", exampleJson("merkle.json")],
    ] as const) {
      const rendered = render(diagram);
      const { layout, timeline } = rendered;
      const motion = motionFrom(rendered);
      const source = diagram as unknown as Source;
      for (const type of ["leaf", "node"] as const) {
        for (const e of treeEventsOf(source, type)) expect(nodeOf(layout, e.id ?? "").step, `${name} の ${e.id} を書いた段`).toBe(e.step);
      }
      for (const n of layout.nodes) {
        const at = timeline.stills[n.step] ?? 0;
        expect(seen(motion, `[data-tree-node="${n.id}"]`, at), `${name} の段 ${n.step + 1} の止め絵で ${n.id} の箱が見えない`).toBeGreaterThan(0.9);
        if (n.step > 0) expect(seen(motion, `[data-tree-node="${n.id}"]`, timeline.stills[n.step - 1] ?? 0), `${name} の段 ${n.step} の止め絵で ${n.id} の箱が見える`).toBeLessThan(0.1);
        for (const c of n.children) {
          const link = linkOf(layout, c);
          expect(link.to, `${name} の ${c} からの木の線の行き先`).toBe(n.id);
          expect(link.step, `${name} の ${c} から ${n.id} への木の線が現れる段`).toBe(n.step);
          expect(seen(motion, `[data-tree-link="${c}"]`, at), `${name} の段 ${n.step + 1} の止め絵で ${c} から ${n.id} への木の線が見えない`).toBeGreaterThan(0.9);
          if (n.step > 0) expect(seen(motion, `[data-tree-link="${c}"]`, timeline.stills[n.step - 1] ?? 0), `${name} の段 ${n.step} の止め絵で ${c} からの木の線が見える`).toBeLessThan(0.1);
        }
      }
    }
  });
});

describe("木の図の描き方 (#3233)", () => {
  it("tree-carriers-run-along-tree-lines", () => {
    const near = (a: Point[], b: Point[]): boolean => a.length === b.length && a.every((p, i) => Math.hypot(p[0] - (b[i] as Point)[0], p[1] - (b[i] as Point)[1]) < 0.5);
    for (const [name, diagram] of [
      ["小さな木", smallTree()],
      ["Merkle の図", exampleJson("merkle.json")],
    ] as const) {
      const rendered = render(diagram);
      const { layout, svg } = rendered;
      const source = diagram as unknown as Source;
      const motion = motionFrom(rendered);
      let along = 0;
      source.steps.forEach((step, s) => {
        step.events.forEach((e, k) => {
          if (e.type !== "edge") return;
          const laid = layout.edges.find((x) => x.step === s && x.event === k);
          expect(laid, `${name} の段 ${s + 1} の ${e.from} から ${e.to} への線が並べた図に無い`).toBeDefined();
          const up = layout.links.find((l) => l.from === e.from && l.to === e.to);
          const down = layout.links.find((l) => l.from === e.to && l.to === e.from);
          const link = up ?? down;
          if (!link) {
            // 親子でない箱どうしの線は、どの木の線にも重ならない
            for (const l of layout.links) expect(near(laid?.points ?? [], l.points), `${name} の ${e.from} から ${e.to} への線が木の線に重なる`).toBe(false);
            return;
          }
          along += 1;
          // 親子の箱どうしの線は、向きに合わせて木の線の上を走る
          const path = up ? link.points : [...link.points].reverse();
          expect(near(laid?.points ?? [], path), `${name} の段 ${s + 1} の ${e.from} から ${e.to} への線が木の線の上を走らない`).toBe(true);
          // 運ぶ物が通った木の線は、その段から運ぶ物の色で残る
          const trail = `[data-tree-trail="${link.from}"]`;
          expect(svg, `${name} の ${link.from} から ${link.to} への木の線に通った跡 (data-tree-trail) が無い`).toContain(`data-tree-trail="${link.from}"`);
          expect(seen(motion, trail, rendered.timeline.stills[s] ?? 0), `${name} の段 ${s + 1} の止め絵で ${link.from} の通った跡が見えない`).toBeGreaterThan(0.9);
          if (s > 0) expect(seen(motion, trail, rendered.timeline.stills[s - 1] ?? 0), `${name} の段 ${s} の止め絵で ${link.from} の通った跡が見える`).toBeLessThan(0.1);
        });
      });
      expect(along, `${name} に木の線の上を走る線が無い`).toBeGreaterThan(0);
    }
  });

  it("tree-proof-fades-untouched-boxes", () => {
    const rendered = render(exampleJson("merkle.json"));
    const motion = motionFrom(rendered);
    const { stills } = rendered.timeline;
    const last = stills[7] ?? 0;
    for (const id of PROOF_BOXES) expect(seen(motion, `[data-tree-node="${id}"]`, last), `段 8 の止め絵で証明に使った ${id} の箱が濃くない`).toBeGreaterThan(0.9);
    for (const id of FAINT_BOXES) expect(seen(motion, `[data-tree-node="${id}"]`, last), `段 8 の止め絵で証明に使わない ${id} の箱が薄くない`).toBeLessThan(0.6);
    for (const id of ["取引1", "取引8"]) expect(seen(motion, `[data-tree-card="${id}"]`, last), `段 8 の止め絵で証明に使わない ${id} の札が薄くない`).toBeLessThan(0.6);
    // 木の線を運ぶ物が通る前 (段 5) は、どの箱も薄くしない
    const before = stills[4] ?? 0;
    for (const id of [...PROOF_BOXES, ...FAINT_BOXES]) expect(seen(motion, `[data-tree-node="${id}"]`, before), `段 5 の止め絵で ${id} の箱が薄い`).toBeGreaterThan(0.9);
  });

  it("merkle-renders-8-steps", () => {
    const source = exampleJson("merkle.json") as unknown as Source;
    expect(source.kind, "Merkle の図の種類").toBe("tree");
    expect(source.steps.map((s) => s.title), "Merkle の図の段の題が決めた 8 段と違う").toEqual([...MERKLE_STEPS]);
    const { layout, timeline } = render(source as unknown as Json);
    expect(timeline.steps, "時刻の表の段の数").toHaveLength(8);
    timeline.steps.forEach((step, i) => {
      expect(step.end, `段 ${i + 1} の長さ`).toBeGreaterThan(step.start);
      if (i > 0) expect(step.start, `段 ${i + 1} の始まり`).toBeGreaterThanOrEqual((timeline.steps[i - 1]?.end ?? Number.POSITIVE_INFINITY) - 1e-9);
    });
    // 段 1 で葉 8 つ、段 2 で親 4 つ、段 3 で親 2 つ、段 4 で根が現れる
    const appear = [0, 1, 2, 3].map((s) => layout.nodes.filter((n) => n.step === s).length);
    expect(appear, "段 1 から段 4 で現れる木の箱の数").toEqual([8, 4, 2, 1]);
    expect(nodeOf(layout, "根").step, "根が現れる段").toBe(3);
    // 段 5 で確かめる取引が取引 3 になり、段 8 で結果が一致になる
    const strip = (s: number, field: string): string | undefined => source.steps[s]?.events.find((e) => e.type === "strip" && e.field === field)?.value;
    expect(strip(4, "確かめる取引"), "段 5 の中身の帯の確かめる取引").toBe("取引3");
    expect(strip(7, "結果"), "段 8 の中身の帯の結果").toBe("一致");
    // 段 6 から段 8 で、運ぶ物が取引 3 の葉から根まで 1 段ずつ上る
    for (const [s, from, to] of PROOF_PATH) {
      const k = source.steps[s]?.events.findIndex((e) => e.type === "edge" && e.from === from && e.to === to) ?? -1;
      expect(k, `段 ${s + 1} に ${from} から ${to} へ上る運ぶ物が無い`).toBeGreaterThanOrEqual(0);
      expect(timeline.carriers.some((c) => c.step === s && c.event === k), `段 ${s + 1} の ${from} から ${to} への運ぶ物が時刻の表に無い`).toBe(true);
    }
  });

  it("tree-keeps-motion-rules", () => {
    const { timeline } = render(exampleJson("merkle.json"));
    for (const t of sampleTimes(timeline)) expect(timeline.labels.filter((span) => covers(span, t)).length, `Merkle の図の ${t} 秒に見える線の名前`).toBeLessThanOrEqual(2);
    expect(timeline.badges.map((b) => b.step), "Merkle の図の段の番号").toEqual(timeline.steps.map((_, i) => i));
    for (const badge of timeline.badges) {
      const step = timeline.steps[badge.step];
      expect(badge.appears, `Merkle の図の段 ${badge.step + 1} の番号が段より前に出る`).toBeGreaterThanOrEqual(step?.start ?? Number.POSITIVE_INFINITY);
    }
  });

  afterEach(releasePlaced);

  it("tree-follows-when-narrow", () => {
    const narrow = 390;
    const rendered = render(exampleJson("merkle.json"));
    const chosen = draw("chooseView")(rendered, narrow);
    expect(chosen.textPx, `${narrow}px の枠で全体を収めた字の大きさ`).toBeLessThan(10.5);
    expect(chosen.mode, `${narrow}px の枠の Merkle の図の見せ方`).toBe("follow");
    const placed = place("merkle", "merkle.json", narrow);
    const layout = placed.layout as unknown as TreeLayout;
    const source = exampleJson("merkle.json") as unknown as Source;
    const inside = (win: Rect, x: number, y: number): boolean => x >= win.x && x <= win.x + win.w && y >= win.y && y <= win.y + win.h;
    for (let s = 0; s < placed.steps; s++) {
      const win = placed.windowAt(s);
      // その段の番号の丸
      const badge = placed.badgeAt(s);
      const events = source.steps[s]?.events ?? [];
      // 表の値だけが変わる段の丸は、窓の下の表の隅に在る (#3270)
      if (events.every((e) => e.type === "strip")) {
        const table = placed.figure.querySelector(".dg-strip");
        expect(badge.y, `段 ${s + 1} の番号の丸が表の高さに無い`).toBeGreaterThanOrEqual(Number(table?.getAttribute("y")));
        continue;
      }
      expect(inside(win, badge.x, badge.y), `段 ${s + 1} の終わりに番号の丸 (${badge.x}, ${badge.y}) が窓 (${win.x}, ${win.y}, ${win.w}, ${win.h}) の中に無い`).toBe(true);
      // その段で運ぶ物が最後に着いた箱か、運ぶ物の無い段では最初に現れた木の箱
      const lastEdge = [...events].reverse().find((e) => e.type === "edge");
      const firstTree = events.find((e) => e.type === "leaf" || e.type === "node");
      const target = lastEdge?.to ?? firstTree?.id;
      if (!target) continue;
      const box: Rect | undefined = layout.nodes.find((n) => n.id === target) ?? layout.boxes.find((b) => b.id === target);
      expect(box, `段 ${s + 1} で見るべき箱 ${target} が並べた図に無い`).toBeDefined();
      if (!box) continue;
      expect(inside(win, centerX(box), centerY(box)), `段 ${s + 1} の終わりに ${target} (${centerX(box)}, ${centerY(box)}) が窓 (${win.x}, ${win.y}, ${win.w}, ${win.h}) の中に無い`).toBe(true);
    }
  });
});

describe("後から現れる木の箱への線 (#3240)", () => {
  it("tree-edge-path-waits-for-node", () => {
    // 線の点線は色の線を引く前に道を見せる部品だが、木の図の箱は段ごとに現れる。行き先の箱が無い間に点線を出すと、空中で止まった矢印になる
    const rendered = render(exampleJson("merkle.json"));
    const { layout, timeline } = rendered;
    const motion = motionFrom(rendered);
    // Merkle の見本で木の線を走らない線は、ブロックの頭から根への 1 本だけ
    expect(motion.doc.querySelectorAll("path.dg-e").length, "木の線を走らない線の点線の数").toBe(1);
    const root = nodeOf(layout, "根").step;
    expect(timeline.stills, "止め絵の数").toHaveLength(8);
    timeline.stills.forEach((t, s) => {
      for (const part of ["path.dg-e", "path.dg-eh"]) {
        const o = seen(motion, part, t);
        if (s < root) expect(o, `段 ${s + 1} の止め絵で、まだ現れていない根への線 (${part}) が見える`).toBeLessThan(0.1);
        else expect(o, `段 ${s + 1} の止め絵で、根への線 (${part}) が見えない`).toBeGreaterThan(0.5);
      }
    });
  });
});

describe("木の図の書き出し (#3233)", () => {
  it(
    "export-writes-tree-diagram",
    async () => {
      const json = join(EXAMPLES, "merkle.json");
      expect(existsSync(json), "merkle.json が無い").toBe(true);
      const out = join(mkdtempSync(join(tmpdir(), "dragon-tree-")), "out");
      const ran = await runCli(["export", json, "--out", out, "--fps", "2", "--gif-fps", "1"]);
      expect(ran.code, `書き出しの命令が落ちた: ${ran.stderr}`).toBe(0);
      for (const format of ["mp4", "gif", "html", "png"] as const) {
        const file = join(out, `merkle.${format}`);
        const bytes = existsSync(file) ? readFileSync(file) : Buffer.alloc(0);
        expect(formatOf(bytes), `${file} が ${format} として書かれていない`).toBe(format);
      }

      const shots: Buffer[] = [];
      for (const k of [0, 1]) {
        const outDir = join(mkdtempSync(join(tmpdir(), "dragon-tree-")), `run-${k}`);
        const png = await runCli(["export", json, "--format", "png", "--out", outDir]);
        expect(png.code, `${k + 1} 回目の PNG の書き出しが落ちた: ${png.stderr}`).toBe(0);
        const file = join(outDir, "merkle.png");
        expect(existsSync(file), `${k + 1} 回目の PNG を書き出していない`).toBe(true);
        shots.push(existsSync(file) ? readFileSync(file) : Buffer.alloc(0));
      }
      expect((shots[0] as Buffer).equals(shots[1] as Buffer), "同じ JSON から 2 回書き出した PNG がバイト単位で違う").toBe(true);
    },
    SLOW * 2,
  );
});

describe("木の図の見本の file (#3233)", () => {
  it("tree-example-files-match", () => {
    const parse = api("parseNotation");
    for (const file of ["merkle.dragon", "merkle.en.dragon", "merkle.json", "merkle.en.json"]) {
      expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(true);
    }
    const ja = parse(fileText("merkle.dragon") ?? "");
    const en = parse(fileText("merkle.en.dragon") ?? "", { lang: "en" });
    expect(ja.ok && en.ok, "Merkle の見本の記法が読めない").toBe(true);
    if (!ja.ok || !en.ok) return;
    expect(shape(en.diagram as unknown as Source), "Merkle の英語版の葉と親と段と出来事の数が日本語版と違う").toEqual(shape(ja.diagram as unknown as Source));
    expect((ja.diagram as unknown as Source).kind, "Merkle の見本の図の種類").toBe("tree");
  });
});
