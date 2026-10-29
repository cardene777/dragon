/**
 * 枝分かれの図 (#3164)。
 *
 * git の枝に commit が積まれ、rebase や merge commit で取り込まれる様子を段で追う図。原本の JSON の `kind` は `git` で、
 * 枝の並びは種類の欄 `git.branches` に、commit を積む出来事 (`commit`) と枝を切る出来事 (`branch`) は段の中に置く。
 * 枝の札と HEAD を動かすのは共通の線の出来事で、送る側に札の名前、受ける側に commit を書く。
 * commit を積むと、その枝の札と、その枝を指す HEAD が付いて進む。当て直し (`copy`) は枝の札を動かさず、
 * merge commit (`merge`) は取り込む先の先端と取り込む枝の先端の 2 つを親に持つ。
 * 見た目の元は試作の `docs/design/base/scenes/git.js`。hash と一言は丸の外側に 2 行で置く (step 2 で本人が選んだ)。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、点線の丸と札は SVG の印で確かめる。
 * 見本の file と、枝分かれの図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError, patched, pointers, smallSequence } from "./diagram-support";
import { exporter, formatOf, runCli } from "./export-support";
import { covers, draw, gap, type LaidBox, type Layout, type Rect, type Rendered, sampleTimes, type Timeline } from "./render-support";

/** 書き出し 1 回に許す時間 (`export.test.ts` と同じ) */
const SLOW = 180_000;

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** 試作 (`git.js`) の 11 段の題 */
const REBASE_STEPS = [
  "main にある",
  "枝を切る",
  "作業を積む",
  "main が進む",
  "rebase を始める",
  "衝突で止まる",
  "直して続ける",
  "D を当て直す",
  "検査が通る",
  "main を早送り",
  "一直線の履歴",
] as const;

/** rebase の図で、HEAD が枝から離れている段 (rebase を始めてから D を当て直す前まで) */
const DETACHED_STEPS = [4, 5, 6] as const;

/** rebase の図で、feature が D' へ移って C と D がどこからも辿れなくなる段 */
const ORPHAN_STEP = 7;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Point = [number, number];

/** 枝の帯。`line` は commit の丸を並べる高さ */
interface GitLane extends Rect {
  id: string;
  line: number;
}

interface GitCommit {
  id: string;
  branch: string;
  cx: number;
  cy: number;
  r: number;
  /** commit を積んだ段と、段の中の出来事の番号 */
  step: number;
  event: number;
  /** 親の commit。merge commit は取り込む先の先端と取り込む枝の先端の 2 つ */
  parents: string[];
  /** 当て直した元の commit */
  copy?: string;
  hash?: string;
  note?: string;
  /** hash と一言の字の四角と、上から並べた行 */
  text?: Rect & { lines: string[] };
  /** どの枝の札からも辿れなくなった段 */
  orphan?: number;
}

/** 丸と丸を繋ぐ線。`kind` は親から子 (`parent`)、当て直しの元から写し (`copy`)、枝を切る (`branch`) */
interface GitLink {
  kind: "parent" | "copy" | "branch";
  from: string;
  to: string;
  step: number;
  points: Point[];
}

/** 段の終わりに札が留まる四角 */
interface GitTag extends Rect {
  ref: string;
  step: number;
}

/** 札が段の終わりに指す commit。HEAD は `attached` に段の終わりに指す枝を持ち、枝から離れた段は `null` */
interface GitRef {
  name: string;
  at: (string | null)[];
  attached?: (string | null)[];
}

interface GitLayout extends Omit<Layout, "boxes"> {
  kind: string;
  boxes: LaidBox[];
  lanes: GitLane[];
  commits: GitCommit[];
  links: GitLink[];
  tags: GitTag[];
  refs: GitRef[];
}

interface GitRendered extends Omit<Rendered, "layout"> {
  layout: GitLayout;
}

interface SourceEvent {
  type: string;
  id?: string;
  branch?: string;
  from?: string;
  to?: string;
  copy?: string;
  merge?: string;
  hash?: string;
  note?: string;
  label?: string;
}

interface Source {
  kind: string;
  title: string;
  view?: string;
  boxes: { id: string; name: string }[];
  steps: { title: string; events: SourceEvent[] }[];
  git?: { branches: { id: string; note?: string }[] };
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
function render(diagram: Json, lang?: "ja" | "en"): GitRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "枝分かれの図を描けない").toBe("");
  return rendered as unknown as GitRendered;
}

const commitsOf = (d: Source): (SourceEvent & { step: number })[] =>
  d.steps.flatMap((step, s) => step.events.flatMap((e) => (e.type === "commit" ? [{ ...e, step: s }] : [])));

const commitOf = (layout: GitLayout, id: string): GitCommit => {
  const commit = layout.commits.find((c) => c.id === id);
  expect(commit, `commit ${id} が並べた図に無い`).toBeDefined();
  return commit as GitCommit;
};

const refOf = (layout: GitLayout, name: string): GitRef => {
  const ref = layout.refs.find((r) => r.name === name);
  expect(ref, `札 ${name} が並べた図に無い`).toBeDefined();
  return ref as GitRef;
};

/** 原本の JSON の、枝と commit と段と段ごとの出来事の数 */
const shape = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  branches: (d.git?.branches ?? []).length,
  commits: commitsOf(d).length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.length),
});

const commit = (id: string, branch: string, extra: Record<string, string> = {}): Json => ({ type: "commit", id, branch, ...extra });
const move = (ref: string, to: string, label?: string): Json => ({ type: "edge", from: ref, to, ...(label ? { label } : {}), carry: { kind: "tag", text: ref } });

/** 箱を持たず、枝を切って merge commit で取り込み、札を 1 つ動かす最小の枝分かれの図 */
function smallGit(): Json {
  return {
    version: 1,
    kind: "git",
    title: "小さな枝の図",
    boxes: [],
    git: { branches: [{ id: "main", note: "取り込む先" }, { id: "topic" }] },
    steps: [
      { title: "積む", body: "main に A と B を積む。", events: [commit("A", "main"), commit("B", "main", { hash: "8b04f71", note: "一覧を足す" })] },
      { title: "枝を切る", body: "B から topic を切って C を積む。", events: [{ type: "branch", branch: "topic", from: "B" }, commit("C", "topic", { hash: "c41d0e5" })] },
      { title: "取り込む", body: "main へ topic を取り込み、topic の札も M へ進める。", events: [commit("M", "main", { merge: "topic", note: "取り込む" }), move("topic", "M", "揃える")] },
    ],
  };
}

describe("枝分かれの図の原本の JSON (#3164)", () => {
  it("schema-accepts-git-diagram", () => {
    const checked = api("validateDiagram")(smallGit());
    expect(checked.ok, `最小の枝分かれの図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    // 作業ツリーのような箱を持つ枝分かれの図も通る
    const withBox = patched(smallGit(), ["boxes"], [{ id: "tree", name: "作業ツリー", sub: "手元のファイル", icon: "doc" }]);
    const boxed = api("validateDiagram")(withBox);
    expect(boxed.ok, `箱を持つ枝分かれの図が検査で落ちる: ${JSON.stringify(boxed.ok ? [] : boxed.errors)}`).toBe(true);
  });

  it("schema-rejects-misplaced-git-fields", () => {
    const validate = api("validateDiagram");
    const sequenceWithCommit = patched(smallSequence(), ["steps", 0, "events"], [commit("A", "main")]);
    const sequenceWithBranch = patched(smallSequence(), ["steps", 0, "events"], [{ type: "branch", branch: "topic", from: "A" }]);
    const cases: [string, Json, string][] = [
      ["時系列図に git の欄", patched(smallSequence(), ["git"], { branches: [{ id: "main" }] }), "/git"],
      ["時系列図に commit を積む出来事", sequenceWithCommit, "/steps/0/events/0/type"],
      ["時系列図に枝を切る出来事", sequenceWithBranch, "/steps/0/events/0/type"],
      ["枝分かれの図に state の欄", patched(smallGit(), ["state"], { paths: [{ from: "A", to: "B" }] }), "/state"],
      ["枝分かれの図に sequence の欄", patched(smallGit(), ["sequence"], { lifelines: ["main"] }), "/sequence"],
      ["16 進でない字の hash", patched(smallGit(), ["steps", 0, "events", 1, "hash"], "8b04f7z"), "/steps/0/events/1/hash"],
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

describe("枝分かれの図の記法 (#3164)", () => {
  it("notation-compiles-git-examples-to-json", () => {
    const parse = api("parseNotation");
    for (const name of ["rebase", "rebase.en", "merge", "merge.en"]) {
      const text = fileText(`${name}.dragon`);
      expect(text, `${name}.dragon が無い`).toBeDefined();
      const parsed = parse(text ?? "", { lang: name.endsWith(".en") ? "en" : "ja" });
      expect(parsed.ok, `${name}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      expect(parsed.ok ? parsed.diagram : undefined, `${name}.dragon から作った JSON が ${name}.json と違う`).toEqual(exampleJson(`${name}.json`));
    }
  });

  it("notation-rejects-misused-git-lines", () => {
    const parse = api("parseNotation");
    const head = ["git 小さな枝の図", "branch main", "branch topic"];
    const step = ["step 積む", "  say 積む。", "  commit A on main"];
    // 記法の行と、誤りの行 (0 から数える) と、その行で誤りを指す語
    const cases: [string, string[], number, string][] = [
      ["宣言していない枝への commit", [...head, ...step, "  commit B on zzz"], 6, "zzz"],
      ["既にある名札と同じ名札の commit", [...head, ...step, "  commit A on topic"], 6, "A"],
      ["無い commit から切る枝", [...head, ...step, "  topic from Z"], 6, "Z"],
      ["無い commit の当て直し", [...head, ...step, "  commit B on topic copy Z"], 6, "Z"],
      ["無い commit への札の動き", [...head, ...step, "  main -> Z"], 6, "Z"],
      ["commit の無い枝の merge", [...head, ...step, "  commit M on main merge topic"], 6, "topic"],
      ["最初の step より前の commit", ["git 小さな枝の図", "branch main", "commit A on main", ...step], 2, "commit"],
    ];
    for (const [name, lines, at, token] of cases) {
      const want = { line: at + 1, column: (lines[at] ?? "").indexOf(token) + 1 };
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang})`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-limits-git-lines-to-git", () => {
    const parse = api("parseNotation");
    // 記法の行と、誤りの行 (1 から数える)
    const cases: [string, string[], number][] = [
      ["時系列図の branch の行", ["sequence 枝の行", "box a", "branch main", "step 送る", "  say 送る。", "  a -> a"], 3],
      ["構成図の branch の行", ["architecture 枝の行", "box a", "box b", "branch main", "step 送る", "  say 送る。", "  a -> b"], 4],
      ["状態遷移図の commit の行", ["state 枝の行", "box a", "step 送る", "  say 送る。", "  start -> a", "  commit A on main"], 6],
    ];
    for (const [name, lines, line] of cases) {
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first?.line, `${name} が ${line} 行目の誤りにならない (${lang})`).toBe(line);
        // 枝分かれの図の頭の語を名指して、その図でしか書けないことを示す
        expect(first?.message ?? "", `${name} の誤りの文が枝分かれの図 (git) を名指さない (${lang})`).toContain("git");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-keeps-ref-names-plain-outside-git", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture"] as const) {
      const text = [`${kind} 参照の名札`, "box main as 本線", "box HEAD as 今の場所", "step 送る", "  say 送る。", "  main -> HEAD: 送る"].join("\n");
      const parsed = parse(text);
      expect(parsed.ok, `${kind} で main と HEAD を名札にした箱が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as Source & { steps: { events: (SourceEvent & { carry?: { kind: string } })[] }[] };
      expect(diagram.boxes?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["main", "HEAD"]);
      const line = diagram.steps?.[0]?.events?.[0];
      expect(line && { type: line.type, from: line.from, to: line.to, carry: line.carry?.kind }, `${kind} の main から HEAD への線`).toEqual({ type: "edge", from: "main", to: "HEAD", carry: "envelope" });
    }
  });

  it("git-roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of ["rebase.dragon", "merge.dragon"]) {
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

describe("枝分かれの図の並べ方 (#3164)", () => {
  it("git-derives-parents-and-refs", () => {
    const small = render(smallGit()).layout;
    expect(small.commits.map((c) => c.id), "札の動きの線が commit を作る").toEqual(["A", "B", "C", "M"]);
    expect(Object.fromEntries(small.commits.map((c) => [c.id, c.parents])), "commit の親").toEqual({ A: [], B: ["A"], C: ["B"], M: ["B", "C"] });
    expect(refOf(small, "main").at, "main の札が段の終わりに指す commit").toEqual(["B", "B", "M"]);
    expect(refOf(small, "topic").at, "topic の札が段の終わりに指す commit").toEqual([null, "C", "M"]);
    // HEAD は最初に積んだ枝を指し、枝を切るとその枝へ移る。指していない枝に commit を積んでも付いていかない
    expect(refOf(small, "HEAD").attached, "HEAD が段の終わりに指す枝").toEqual(["main", "topic", "topic"]);
    expect(refOf(small, "HEAD").at, "HEAD が段の終わりに指す commit").toEqual(["B", "C", "M"]);

    const rebase = render(exampleJson("rebase.json")).layout;
    expect(commitOf(rebase, "C'").parents, "当て直した C' の親").toEqual(["E"]);
    expect(commitOf(rebase, "C'").copy, "C' の当て直しの元").toBe("C");
    expect(commitOf(rebase, "D'").parents, "当て直した D' の親").toEqual(["C'"]);
    // 当て直しは枝の札を動かさず、枝から離れた HEAD だけが付いていく
    expect(refOf(rebase, "main").at, "rebase の図の main の札").toEqual(["B", "B", "B", "E", "E", "E", "E", "E", "E", "D'", "D'"]);
    expect(refOf(rebase, "feature").at, "rebase の図の feature の札").toEqual([null, "B", "D", "D", "D", "D", "D", "D'", "D'", "D'", "D'"]);
    expect(refOf(rebase, "HEAD").at.slice(4, 8), "rebase の途中の HEAD").toEqual(["E", "E", "C'", "D'"]);
    expect(refOf(rebase, "HEAD").attached?.slice(3, 8), "rebase の途中で HEAD が指す枝").toEqual(["feature", null, null, null, "feature"]);
  });

  it("git-layout-places-lanes-and-commits", () => {
    for (const name of ["rebase.json", "merge.json"]) {
      const source = exampleJson(name) as unknown as Source;
      const { layout } = render(source as unknown as Json);
      const branches = (source.git?.branches ?? []).map((b) => b.id);
      expect(layout.lanes.map((l) => l.id), `${name} の帯が枝を宣言した順でない`).toEqual(branches);
      layout.lanes.slice(1).forEach((lane, i) => expect(lane.line, `${name} の ${lane.id} の帯が上の帯より下に無い`).toBeGreaterThan((layout.lanes[i] as GitLane).line));
      for (const c of layout.commits) {
        const lane = layout.lanes.find((l) => l.id === c.branch);
        expect(Math.abs(c.cy - (lane?.line ?? Number.NaN)), `${name} の ${c.id} が ${c.branch} の帯の線に無い`).toBeLessThan(0.5);
        for (const parent of c.parents) expect(c.cx, `${name} の ${c.id} が親の ${parent} より右に無い`).toBeGreaterThan(commitOf(layout, parent).cx);
      }
    }
    const rebase = render(exampleJson("rebase.json")).layout;
    const onLane = (lane: string): string[] => rebase.commits.filter((c) => c.branch === lane).sort((a, b) => a.cx - b.cx).map((c) => c.id);
    expect(onLane("main"), "rebase の図の main の線の commit").toEqual(["A", "B", "E", "C'", "D'"]);
    expect(onLane("feature"), "rebase の図の feature の線の commit").toEqual(["C", "D"]);
    const merge = render(exampleJson("merge.json")).layout;
    expect(merge.lanes.length, "merge の図の枝の帯の数").toBe(3);
    expect(new Set(merge.commits.map((c) => c.branch)).size, "merge の図で commit を積んだ枝の数").toBe(3);
  });

  it("git-renders-hash-and-note", () => {
    const { layout, svg } = render(exampleJson("rebase.json"));
    const top = layout.lanes[0]?.id;
    for (const c of layout.commits) {
      expect(c.text?.lines, `${c.id} の hash と一言`).toEqual([c.hash, c.note].filter((t) => t !== undefined));
      if (!c.text) continue;
      if (c.branch === top) expect(c.text.y + c.text.h, `${c.id} の字が丸の上に無い`).toBeLessThanOrEqual(c.cy - c.r + 1e-6);
      else expect(c.text.y, `${c.id} の字が丸の下に無い`).toBeGreaterThanOrEqual(c.cy + c.r - 1e-6);
      for (const line of c.text.lines) expect(svg, `${c.id} の字 ${line} が描かれない`).toContain(`>${line}<`);
    }
    // 枝の札は字より外に置き、どの段でも札と字が重ならない
    for (const tag of layout.tags) {
      for (const c of layout.commits) {
        if (c.text) expect(gap(tag, c.text), `段 ${tag.step + 1} の札 ${tag.ref} が ${c.id} の字に重なる`).toBeGreaterThanOrEqual(2);
      }
      const resting = layout.commits.find((c) => c.branch === top && c.text && Math.abs(tag.x + tag.w / 2 - c.cx) < 0.5);
      if (resting?.text) expect(tag.y + tag.h, `段 ${tag.step + 1} の札 ${tag.ref} が ${resting.id} の字より上に無い`).toBeLessThanOrEqual(resting.text.y);
    }
    // hash も一言も書かない commit には字を出さず、片方だけなら 1 行で出す
    const small = render(smallGit()).layout;
    expect(commitOf(small, "A").text, "hash も一言も書かない A に字が出る").toBeUndefined();
    expect(commitOf(small, "C").text?.lines, "hash だけを書いた C の字").toEqual(["c41d0e5"]);
    expect(commitOf(small, "M").text?.lines, "一言だけを書いた M の字").toEqual(["取り込む"]);
  });
});

describe("枝分かれの図の描き方 (#3164)", () => {
  it("rebase-renders-11-steps", () => {
    const source = exampleJson("rebase.json") as unknown as Source;
    expect(source.steps.map((s) => s.title), "rebase の図の段の題が試作の 11 段と違う").toEqual([...REBASE_STEPS]);
    const { layout, timeline, svg } = render(source as unknown as Json);
    expect(timeline.steps, "時刻の表の段の数").toHaveLength(11);
    timeline.steps.forEach((step, i) => {
      expect(step.end, `段 ${i + 1} の長さ`).toBeGreaterThan(step.start);
      if (i > 0) expect(step.start, `段 ${i + 1} の始まり`).toBeGreaterThanOrEqual((timeline.steps[i - 1]?.end ?? Number.POSITIVE_INFINITY) - 1e-9);
    });
    for (const c of commitsOf(source)) expect(commitOf(layout, c.id ?? "").step, `${c.id} を積む段`).toBe(c.step);
    // どの枝の札からも辿れなくなった C と D だけが、その段で点線の丸に変わる
    const orphans = layout.commits.filter((c) => c.orphan !== undefined);
    expect(Object.fromEntries(orphans.map((c) => [c.id, c.orphan])), "点線の丸に変わる commit と段").toEqual({ C: ORPHAN_STEP, D: ORPHAN_STEP });
    expect((svg.match(/data-orphan="/gu) ?? []).length, "点線の丸の印 (data-orphan) の数").toBe(2);
  });

  it("git-shows-head-tag-while-detached", () => {
    const { layout, svg } = render(exampleJson("rebase.json"));
    const head = layout.tags.filter((t) => t.ref === "HEAD");
    expect(head.map((t) => t.step), "HEAD の札が出る段").toEqual([...DETACHED_STEPS]);
    const centerOf = (t: GitTag): number => t.x + t.w / 2;
    expect(Math.abs(centerOf(head[0] as GitTag) - commitOf(layout, "E").cx), "枝から離れた HEAD の札が E の上に無い").toBeLessThan(0.5);
    expect(Math.abs(centerOf(head[2] as GitTag) - commitOf(layout, "C'").cx), "当て直している HEAD の札が C' の上に無い").toBeLessThan(0.5);
    expect(svg, "HEAD の札の印 (data-ref) が無い").toContain('data-ref="HEAD"');
    // 枝の札はどの段でも出る
    for (const ref of ["main", "feature"]) expect(layout.tags.some((t) => t.ref === ref && t.step === 10), `最後の段に ${ref} の札が無い`).toBe(true);
  });

  it("merge-renders-merge-commit", () => {
    const source = exampleJson("merge.json") as unknown as Source;
    const { layout } = render(source as unknown as Json);
    const merges = commitsOf(source).filter((c) => c.merge !== undefined);
    expect(merges.length, "merge の図に merge commit が無い").toBeGreaterThan(0);
    for (const m of merges) {
      const laid = commitOf(layout, m.id ?? "");
      expect(laid.parents, `${m.id} の親が 2 つでない`).toHaveLength(2);
      const into = layout.links.filter((l) => l.kind === "parent" && l.to === m.id).map((l) => l.from);
      expect([...into].sort(), `${m.id} へ入る線が 2 つの親から来ない`).toEqual([...laid.parents].sort());
      // 取り込む先の札だけが merge commit へ進み、取り込んだ枝の札は動かない
      const target = refOf(layout, m.branch ?? "");
      const merged = refOf(layout, m.merge ?? "");
      expect(target.at[m.step], `${m.branch} の札が ${m.id} へ進まない`).toBe(m.id);
      expect(merged.at[m.step], `取り込んだ ${m.merge} の札が動く`).toBe(merged.at[m.step - 1]);
    }
  });

  it("git-keeps-motion-rules", () => {
    for (const name of ["rebase.json", "merge.json"]) {
      const { timeline } = render(exampleJson(name)) as unknown as { timeline: Timeline };
      for (const t of sampleTimes(timeline)) expect(timeline.labels.filter((span) => covers(span, t)).length, `${name} の ${t} 秒に見える線の名前`).toBeLessThanOrEqual(2);
      expect(timeline.badges.map((b) => b.step), `${name} の段の番号`).toEqual(timeline.steps.map((_, i) => i));
      for (const badge of timeline.badges) {
        const step = timeline.steps[badge.step];
        expect(badge.appears, `${name} の段 ${badge.step + 1} の番号が段より前に出る`).toBeGreaterThanOrEqual(step?.start ?? Number.POSITIVE_INFINITY);
      }
    }
  });

  it("git-opens-fixed", () => {
    for (const name of ["rebase.json", "merge.json"]) {
      const source = exampleJson(name) as unknown as Source;
      expect(source.view, `${name} が見せ方を書いている`).toBeUndefined();
      const rendered = render(source as unknown as Json);
      const choose = draw("chooseView");
      for (const width of [rendered.layout.width, 720]) {
        expect(choose(rendered as unknown as Rendered, width).mode, `${width}px の枠で ${name} の見せ方`).toBe("fixed");
      }
    }
  });
});

describe("枝分かれの図の書き出し (#3164)", () => {
  it(
    "export-writes-git-diagram",
    async () => {
      const json = join(EXAMPLES, "rebase.json");
      expect(existsSync(json), "rebase.json が無い").toBe(true);
      const out = join(mkdtempSync(join(tmpdir(), "dragon-git-")), "out");
      const ran = await runCli(["export", json, "--out", out, "--fps", "2", "--gif-fps", "1"]);
      expect(ran.code, `書き出しの命令が落ちた: ${ran.stderr}`).toBe(0);
      for (const format of ["mp4", "gif", "html", "png"] as const) {
        const file = join(out, `rebase.${format}`);
        const bytes = existsSync(file) ? readFileSync(file) : Buffer.alloc(0);
        expect(formatOf(bytes), `${file} が ${format} として書かれていない`).toBe(format);
      }

      const exportDiagram = await exporter();
      const shots: Buffer[] = [];
      for (const k of [0, 1]) {
        const outDir = join(mkdtempSync(join(tmpdir(), "dragon-git-")), `run-${k}`);
        mkdirSync(outDir, { recursive: true });
        const result = await exportDiagram(exampleJson("rebase.json"), { outDir, formats: ["png"] });
        expect(result.files.png, "PNG を書き出していない").toBeDefined();
        shots.push(readFileSync(result.files.png as string));
      }
      expect((shots[0] as Buffer).equals(shots[1] as Buffer), "同じ JSON から 2 回書き出した PNG がバイト単位で違う").toBe(true);
    },
    SLOW * 2,
  );
});

describe("枝分かれの図の見本の file (#3164)", () => {
  it("git-example-files-match", () => {
    const parse = api("parseNotation");
    for (const name of ["rebase", "merge"]) {
      for (const file of [`${name}.dragon`, `${name}.en.dragon`, `${name}.json`, `${name}.en.json`]) {
        expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(true);
      }
      const ja = parse(fileText(`${name}.dragon`) ?? "");
      const en = parse(fileText(`${name}.en.dragon`) ?? "", { lang: "en" });
      expect(ja.ok && en.ok, `${name} の見本の記法が読めない`).toBe(true);
      if (!ja.ok || !en.ok) continue;
      expect(shape(en.diagram as unknown as Source), `${name} の英語版の枝と commit と段と出来事の数が日本語版と違う`).toEqual(shape(ja.diagram as unknown as Source));
      expect((ja.diagram as unknown as Source).kind, `${name} の見本の図の種類`).toBe("git");
    }
  });
});
