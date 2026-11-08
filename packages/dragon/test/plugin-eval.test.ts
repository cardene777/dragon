/**
 * プラグインの skill を入れた Claude を実際に動かした評価の記録 (#3484)。
 *
 * 評価 (`claude plugin eval plugins/dragon`) は Claude を動かすたびに費用がかかるので、検査の中では回さない。
 * 回した結果は評価のケースの指紋と一緒に `plugins/dragon/evals/record.json` に残し、この検査は記録を読む。
 * ケースの文や判定を書き換えると指紋が変わり、記録が古いと分かる。その時は評価を回し直して記録を書き直す
 * (`node scripts/plugin-eval-record.mjs`)。
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const EVALS = join(ROOT, "plugins/dragon/evals");
const RECORD = join(EVALS, "record.json");
/** 1 つのケースを回す回数の下限。1 回だけの合格は運でも出る */
const MIN_RUNS = 3;

interface Entry {
  fingerprint: string;
  runs: number;
  passed: number;
  claude: string;
  date: string;
}

/** ケースの dir の下の file を全て、ケースの dir からの path の順に */
function filesUnder(dir: string): string[] {
  return readdirSync(dir)
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? filesUnder(path) : [path];
    })
    .sort();
}

/** ケースの指紋。ケースの dir の下の file の path と中身から作る。記録を書く `scripts/plugin-eval-record.mjs` も同じ作り方をする */
function caseFingerprint(dir: string): string {
  const hash = createHash("sha256");
  for (const file of filesUnder(dir)) hash.update(`${relative(dir, file)}\0${readFileSync(file, "utf8")}\0`);
  return hash.digest("hex");
}

function checkRecorded(name: string): void {
  const dir = join(EVALS, name);
  expect(existsSync(join(dir, "prompt.md")), `評価のケース ${relative(ROOT, dir)} が無い`).toBe(true);
  expect(existsSync(RECORD), `${relative(ROOT, RECORD)} が無い`).toBe(true);
  if (!existsSync(join(dir, "prompt.md")) || !existsSync(RECORD)) return;
  const entry = (JSON.parse(readFileSync(RECORD, "utf8")) as Record<string, Entry>)[name];
  expect(entry, `${name} を回した記録が無い`).toBeDefined();
  expect(entry?.fingerprint, `${name} のケースを書き換えた後に回し直していない`).toBe(caseFingerprint(dir));
  expect(entry?.runs ?? 0, `${name} を回した回数が少ない`).toBeGreaterThanOrEqual(MIN_RUNS);
  expect(entry?.passed, `${name} の回のうち通らなかった回がある`).toBe(entry?.runs);
}

describe("skill を入れた Claude が崩れを伝える評価 (#3484)", () => {
  it("layout-bridge", () => checkRecorded("layout-bridge"));
  it("layout-payment", () => checkRecorded("layout-payment"));
});

/** 評価のために fork の代わりに作る写しの repo と、偽の `gh` を置いた dir */
interface StandIn {
  repo: string;
  bin: string;
  /** 偽の `gh` が受けた引数を 1 回 1 行の JSON の配列で書く file */
  ghLog: string;
}

/**
 * 足したブロックを共有のブロック集へ PR で出す評価 (#3508)。
 *
 * 評価の囲いは GitHub に届かず、本物へ PR を出すと試しの PR が積まれる。
 * 記録の script は fork の代わりに小さな写しの repo を作り、渡された引数を書き残す偽の `gh` を PATH の頭に置いて回す。
 */
describe("skill を入れた Claude がブロックを足して PR を出す評価 (#3508)", () => {
  it("plugin-eval-stand-in-records-gh", async () => {
    const script = join(ROOT, "scripts/plugin-eval-stand-in.mjs");
    expect(existsSync(script), `${relative(ROOT, script)} が無い`).toBe(true);
    if (!existsSync(script)) return;
    const { makeStandIn } = (await import(script)) as { makeStandIn: (options: { root: string; dir: string }) => StandIn };
    const dir = mkdtempSync(join(tmpdir(), "dragon-stand-in-"));
    const standIn = makeStandIn({ root: ROOT, dir });
    // 写しの repo は git の repo で、共有のブロック集と PR の雛形と決まりの文書を持つ
    for (const path of ["packages/dragon/blocks/bridge.dragon", "packages/dragon/blocks/examples/bridge.dragon", "CONTRIBUTING.md", ".github/PULL_REQUEST_TEMPLATE.md"]) {
      expect(existsSync(join(standIn.repo, path)), `写しの repo に ${path} が無い`).toBe(true);
    }
    const head = spawnSync("git", ["-C", standIn.repo, "rev-parse", "--verify", "HEAD"], { encoding: "utf8" });
    expect(head.status, `写しの repo に commit が無い ${head.stderr}`).toBe(0);
    // PATH の頭に置くと gh は偽の gh を指し、届かない proxy を渡しても通る
    const env = { ...process.env, PATH: `${standIn.bin}:${process.env.PATH ?? ""}`, HTTPS_PROXY: "http://127.0.0.1:9", HTTP_PROXY: "http://127.0.0.1:9" };
    const which = spawnSync("sh", ["-c", "command -v gh"], { encoding: "utf8", env });
    expect(which.stdout.trim(), "gh が偽の gh を指さない").toBe(join(standIn.bin, "gh"));
    const body = join(dir, "pr-body.md");
    writeFileSync(body, "## What the block shows\n");
    const calls = [
      ["pr", "create", "--repo", "cardene777/dragon", "--title", "feat: add the shared block +vault", "--body-file", body],
      ["pr", "merge", "1", "--repo", "cardene777/dragon"],
    ];
    for (const args of calls) {
      const ran = spawnSync("gh", args, { cwd: standIn.repo, encoding: "utf8", env, timeout: 10_000 });
      expect(ran.status, `偽の gh ${args.join(" ")} が終わり方 0 にならない ${ran.stderr}`).toBe(0);
    }
    const logged = readFileSync(standIn.ghLog, "utf8")
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line) as string[]);
    expect(logged, "偽の gh が受けた引数を順に残さない").toEqual(calls);
  });

  it("block-pr", () => checkRecorded("block-pr"));
});

/**
 * 9 種類のどれにも合わない図を頼まれた時に、近い種類で描いて書き出してから Issue を立てる評価 (#3513)。
 * 円グラフは扇形で割合を描ける種類が無いので、描けない所が必ず残る。Issue は偽の `gh` が受ける
 */
describe("skill を入れた Claude が合う種類の無い図を描いてから Issue を立てる評価 (#3513)", () => {
  it("new-kind-issue", () => checkRecorded("new-kind-issue"));
});

/** 崩れの検査が返す 1 件。崩れは `layout` に段の番号 (1 から数える) を持つ */
interface GalleryProblem {
  severity: string;
  message: string;
  layout?: { step: number };
}

/** 頁を作る時に使う道具。崩れを数える、段の数を読む、1 つの段を PNG に書き出すの 3 つ */
interface GalleryTools {
  breaks: (file: string) => Promise<{ problems?: GalleryProblem[]; error?: string }>;
  steps: (file: string) => Promise<number | undefined>;
  png: (file: string, step: number | undefined, dest: string) => Promise<{ error?: string }>;
}

/** 頁に並べる 1 回の実行。`dir` は評価が残した実行の dir (`sealed` を持つ) */
interface GalleryRun {
  dir: string;
  passed?: boolean;
  why?: string[];
}

interface GalleryModule {
  writeGallery: (options: { cases: { name: string; runs: GalleryRun[] }[]; page: string; tools: GalleryTools; known?: string[] }) => Promise<string>;
  cliTools: (cli: string) => GalleryTools;
}

const GALLERY = join(ROOT, "scripts/plugin-eval-gallery.mjs");
const RECORD_SCRIPT = join(ROOT, "scripts/plugin-eval-record.mjs");
const CLI = join(ROOT, "packages/dragon/dist/cli.cjs");

async function gallery(): Promise<GalleryModule> {
  expect(existsSync(GALLERY), `${relative(ROOT, GALLERY)} が無い`).toBe(true);
  return (await import(GALLERY)) as GalleryModule;
}

/** 評価が残す形の実行の dir を作る。`files` は `sealed` からの path と中身 */
function runDir(root: string, name: string, files: Record<string, string>): string {
  const dir = join(root, name);
  mkdirSync(join(dir, "sealed"), { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, "sealed", path)), { recursive: true });
    writeFileSync(join(dir, "sealed", path), text);
  }
  return dir;
}

/** 偽の道具が図の file の名前ごとに返す物 */
interface FakeDiagram {
  problems?: GalleryProblem[];
  breakError?: string;
  steps?: number;
  /** 書き出しが投げる誤りの文 */
  pngThrows?: string;
}

/** 偽の道具が書く PNG の中身。頁が埋めた絵がどの段の物かを中身で見分ける */
const pngBytes = (name: string, step: number | undefined): Buffer => Buffer.from(`png ${name} step ${String(step)}`);
const brk = (step: number, message: string): GalleryProblem => ({ severity: "warning", message, layout: { step } });

/** Chromium を起こさない偽の道具と、道具を呼んだ記録 */
function fakeTools(diagrams: Record<string, FakeDiagram>): { tools: GalleryTools; calls: { breaks: string[]; png: [string, number | undefined][] } } {
  const calls = { breaks: [] as string[], png: [] as [string, number | undefined][] };
  const of = (file: string): FakeDiagram => diagrams[basename(file)] ?? {};
  const tools: GalleryTools = {
    breaks: (file) => {
      calls.breaks.push(file);
      const d = of(file);
      return Promise.resolve(d.breakError === undefined ? { problems: d.problems ?? [] } : { error: d.breakError });
    },
    steps: (file) => Promise.resolve(of(file).steps),
    png: (file, step, dest) => {
      calls.png.push([basename(file), step]);
      const d = of(file);
      if (d.pngThrows !== undefined) return Promise.reject(new Error(d.pngThrows));
      writeFileSync(dest, pngBytes(basename(file), step));
      return Promise.resolve({});
    },
  };
  return { tools, calls };
}

const documentOf = (page: string): Document => new JSDOM(readFileSync(page, "utf8")).window.document;
const runsOf = (doc: Document, name: string): Element[] => [...doc.querySelectorAll(`section[data-case="${name}"] article[data-run]`)];
/** 実行の欄の絵の段の番号と、最後の段の印 */
const figuresOf = (run: Element | undefined): [string | null, boolean][] =>
  [...(run?.querySelectorAll("figure[data-step]") ?? [])].map((figure) => [figure.getAttribute("data-step"), figure.hasAttribute("data-last")]);

/**
 * 評価のたびに、AI が描いた図を 1 枚の頁に並べる (#3519)。
 *
 * 評価は AI が手順を踏んだかを確かめるだけで、描いた図の見た目は誰も見ていなかった。
 * 記録の script は評価の後に、各実行で保存した `.dragon` の最後の段と崩れの出た段を PNG に書き出し、ケースごとに並べた頁を書く。
 * 頁を作る処理は、書き出しを Chromium で回すと 1 枚 8 秒かかるので、検査では道具を偽の物に替えて確かめる
 */
describe("評価で AI が描いた図を 1 枚の頁に並べる (#3519)", () => {
  it("plugin-eval-gallery-exports-last-and-break-steps", async () => {
    const { writeGallery } = await gallery();
    const root = mkdtempSync(join(tmpdir(), "dragon-gallery-"));
    const a = runDir(root, "e-a", { "home/cwd/a.dragon": "sequence A\n" });
    const b = runDir(root, "e-b", { "home/cwd/b.dragon": "sequence B\n" });
    const { tools, calls } = fakeTools({
      "a.dragon": { steps: 3, problems: [brk(1, "段 1: 札が詰まる"), brk(3, "段 3: 字がはみ出す")] },
      "b.dragon": { steps: 4 },
    });
    const page = join(root, "out", "gallery.html");
    const written = await writeGallery({ cases: [{ name: "demo", runs: [{ dir: a }, { dir: b }] }], page, tools });
    expect(written, "頁の置き場を返さない").toBe(page);
    expect(existsSync(page), "頁を書かない").toBe(true);
    expect([...calls.png].sort(), "最後の段と崩れの段を 1 回ずつ書き出さない").toEqual([
      ["a.dragon", 1],
      ["a.dragon", 3],
      ["b.dragon", 4],
    ]);
    const runs = runsOf(documentOf(page), "demo");
    expect(runs.map((run) => run.getAttribute("data-run")), "ケースの欄に実行の欄を順に並べない").toEqual(["1", "2"]);
    // 最後の段を先に置き、崩れの段を番号の順に続ける。最後の段の崩れは最後の段の絵 1 枚にまとめる
    expect(figuresOf(runs[0]), "1 つ目の実行の絵の段").toEqual([
      ["3", true],
      ["1", false],
    ]);
    expect(figuresOf(runs[1]), "2 つ目の実行の絵の段").toEqual([["4", true]]);
    const src = runs[0]?.querySelector('figure[data-step="1"] img')?.getAttribute("src");
    expect(src, "書き出した PNG を頁に埋めない").toBe(`data:image/png;base64,${pngBytes("a.dragon", 1).toString("base64")}`);
  });

  it("plugin-eval-gallery-shows-break-counts", async () => {
    const { writeGallery } = await gallery();
    const root = mkdtempSync(join(tmpdir(), "dragon-gallery-"));
    const a = runDir(root, "e-a", { "home/cwd/a.dragon": "sequence A\n" });
    const b = runDir(root, "e-b", { "home/cwd/b.dragon": "sequence B\n" });
    const { tools } = fakeTools({
      "a.dragon": { steps: 3, problems: [brk(1, "段 1: 札が詰まる"), brk(1, "段 1: 線が詰まる"), brk(3, "段 3: 字がはみ出す")] },
      "b.dragon": { steps: 2 },
    });
    const page = join(root, "gallery.html");
    await writeGallery({ cases: [{ name: "demo", runs: [{ dir: a, passed: false, why: ["返答が段 3 を名指さない"] }, { dir: b, passed: true }] }], page, tools });
    const [failed, passed] = runsOf(documentOf(page), "demo");
    const diagram = failed?.querySelector(".diagram");
    expect(diagram?.getAttribute("data-breaks"), "崩れの件数を持たない").toBe("3");
    expect(diagram?.getAttribute("data-break-steps"), "崩れの段の番号を持たない").toBe("1,3");
    expect(diagram?.textContent, "崩れの件数を書かない").toContain("崩れ3件");
    const first = failed?.querySelector('figure[data-step="1"]')?.textContent ?? "";
    expect(first, "崩れの段の絵に検査の文を添えない").toContain("段 1: 札が詰まる");
    expect(first, "同じ段の崩れを全て添えない").toContain("段 1: 線が詰まる");
    expect(failed?.querySelector('figure[data-step="3"]')?.textContent, "最後の段の崩れの文を添えない").toContain("段 3: 字がはみ出す");
    expect(passed?.querySelector(".diagram")?.getAttribute("data-breaks"), "崩れの無い図の件数").toBe("0");
    expect(failed?.getAttribute("data-passed"), "落ちた実行の印").toBe("false");
    expect(failed?.textContent, "落ちたと書かない").toContain("落ちた");
    expect(failed?.textContent, "落ちた理由を書かない").toContain("返答が段 3 を名指さない");
    expect(passed?.getAttribute("data-passed"), "通った実行の印").toBe("true");
    expect(passed?.textContent, "通ったと書かない").toContain("通った");
  });

  it("plugin-eval-gallery-keeps-run-without-diagram", async () => {
    const { writeGallery } = await gallery();
    const root = mkdtempSync(join(tmpdir(), "dragon-gallery-"));
    const none = runDir(root, "e-none", { "home/cwd/notes.md": "# 図\n" });
    const b = runDir(root, "e-b", { "home/cwd/b.dragon": "sequence B\n" });
    const { tools, calls } = fakeTools({ "b.dragon": { steps: 1 } });
    const page = join(root, "gallery.html");
    await writeGallery({ cases: [{ name: "demo", runs: [{ dir: none }, { dir: b }] }], page, tools });
    const runs = runsOf(documentOf(page), "demo");
    expect(runs, "図を保存しなかった実行の欄を残さない").toHaveLength(2);
    expect(runs[0]?.querySelectorAll(".diagram, img"), "図の無い実行に図の欄がある").toHaveLength(0);
    expect(runs[0]?.textContent, "保存した図が無いと書かない").toContain("保存した.dragonが無い");
    expect(calls.breaks.some((file) => file.startsWith(none)), "図でない file を検査に掛けた").toBe(false);
    expect(runs[1]?.querySelectorAll("img"), "図を保存した実行の絵").toHaveLength(1);
  });

  it("plugin-eval-gallery-skips-prepared-and-definitions", async () => {
    const { writeGallery } = await gallery();
    const root = mkdtempSync(join(tmpdir(), "dragon-gallery-"));
    const example = "architecture 橋\n+bridge b as 橋\n";
    const prepared = join(root, "template");
    mkdirSync(join(prepared, "packages/dragon/blocks/examples"), { recursive: true });
    writeFileSync(join(prepared, "packages/dragon/blocks/examples/bridge.dragon"), example);
    const run = runDir(root, "e-pr", {
      "home/cwd/packages/dragon/blocks/examples/bridge.dragon": example,
      "home/cwd/packages/dragon/blocks/vault.dragon": "// 金庫\nblocks 1\nblock +vault\n  base box\nend\n",
      "home/cwd/packages/dragon/blocks/examples/vault.dragon": "architecture 金庫\n+vault v as 金庫\n",
      "tmp/claude-501/draft.dragon": "sequence 下書き\n",
    });
    const { tools, calls } = fakeTools({ "vault.dragon": { steps: 1 }, "draft.dragon": { steps: 2 } });
    const page = join(root, "gallery.html");
    await writeGallery({ cases: [{ name: "block-pr", runs: [{ dir: run }] }], page, tools, known: [prepared] });
    const sealed = join(run, "sealed");
    expect(calls.breaks.map((file) => relative(sealed, file)).sort(), "前から在った見本か定義だけの file を検査に掛けた").toEqual([
      "home/cwd/packages/dragon/blocks/examples/vault.dragon",
      "tmp/claude-501/draft.dragon",
    ]);
    const files = [...(runsOf(documentOf(page), "block-pr")[0]?.querySelectorAll(".diagram") ?? [])].map((diagram) => diagram.getAttribute("data-file"));
    expect(files, "頁に並べる図").toEqual(["home/cwd/packages/dragon/blocks/examples/vault.dragon", "tmp/claude-501/draft.dragon"]);
  });

  it("plugin-eval-gallery-reports-tool-failure", async () => {
    const { writeGallery } = await gallery();
    const root = mkdtempSync(join(tmpdir(), "dragon-gallery-"));
    const broken = runDir(root, "e-broken", { "home/cwd/bad.dragon": "x\n", "home/cwd/nopng.dragon": "sequence N\n" });
    const b = runDir(root, "e-b", { "home/cwd/b.dragon": "sequence B\n" });
    const { tools } = fakeTools({
      "bad.dragon": { breakError: "dragon check --layout の終わり方 2: 読めない" },
      "nopng.dragon": { steps: 2, pngThrows: "Chromium が起きない" },
      "b.dragon": { steps: 1 },
    });
    const page = join(root, "gallery.html");
    await writeGallery({ cases: [{ name: "demo", runs: [{ dir: broken }, { dir: b }] }], page, tools });
    const runs = runsOf(documentOf(page), "demo");
    const diagram = (file: string): Element | null | undefined => runs[0]?.querySelector(`.diagram[data-file="home/cwd/${file}"]`);
    expect(diagram("bad.dragon")?.textContent, "検査が通らない理由を書かない").toContain("dragon check --layout の終わり方 2: 読めない");
    expect(diagram("nopng.dragon")?.textContent, "書き出しが通らない理由を書かない").toContain("Chromium が起きない");
    expect(diagram("nopng.dragon")?.querySelectorAll("img"), "書き出せなかった段に絵がある").toHaveLength(0);
    expect(runs[1]?.querySelectorAll("img"), "失敗した実行の後の実行を並べない").toHaveLength(1);
  });

  it("plugin-eval-gallery-page-is-self-contained", async () => {
    const { writeGallery } = await gallery();
    const root = mkdtempSync(join(tmpdir(), "dragon-gallery-"));
    const a = runDir(root, "e-a", { "home/cwd/a-very-long-file-name-that-must-wrap-inside-a-phone-wide-card.dragon": "sequence A\n" });
    const { tools } = fakeTools({ "a-very-long-file-name-that-must-wrap-inside-a-phone-wide-card.dragon": { steps: 2, problems: [brk(1, "段 1: 札が詰まる")] } });
    const page = join(root, "gallery.html");
    await writeGallery({ cases: [{ name: "demo", runs: [{ dir: a }] }], page, tools });
    const doc = documentOf(page);
    const refs = [...doc.querySelectorAll("[src], [href]")].map((el) => el.getAttribute("src") ?? el.getAttribute("href") ?? "");
    expect(refs.filter((ref) => !ref.startsWith("data:") && !ref.startsWith("#")), "頁の外を指す src か href がある").toEqual([]);
    expect(refs.filter((ref) => ref.startsWith("data:image/png;base64,")), "PNG を data URI で埋めない").toHaveLength(2);
    expect(doc.querySelectorAll("link, script[src], iframe, object, embed"), "外を読む要素がある").toHaveLength(0);
    expect(doc.querySelector('meta[name="viewport"]')?.getAttribute("content"), "携帯の幅に合わせる設定が無い").toContain("width=device-width");
    const css = [...doc.querySelectorAll("style")].map((style) => style.textContent).join("\n");
    expect(css, "外の file を読む url( が CSS にある").not.toContain("url(");
    expect(css, "明るい色の変数が :root に無い").toMatch(/:root\s*\{[^}]*--bg:/u);
    expect(css, "暗い表示の色が無い").toMatch(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)\s*\{[^}]*--bg:/u);
    expect(css, "暗い表示を選んだ時の色が無い").toMatch(/:root\[data-theme="dark"\]\s*\{[^}]*--bg:/u);
    expect(css, "body の背景が色の変数でない").toMatch(/body\s*\{[^}]*background:\s*var\(--bg\)/u);
    expect(css, "絵を枠の幅に収めない").toMatch(/img\s*\{[^}]*max-width:\s*100%/u);
    // 実行の欄の中の字 (path、検査と書き出しの失敗の文) は、区切りの無い長い path でも欄の幅で折り返す
    expect(css, "実行の欄の中の長い path を折り返さない").toMatch(/\.run\s*\{[^}]*overflow-wrap:\s*anywhere/u);
  });

  it("plugin-eval-gallery-cli-tools-read-breaks-and-steps", async () => {
    const { cliTools } = await gallery();
    expect(existsSync(CLI), `${relative(ROOT, CLI)} が無い。pnpm build:packages を回す`).toBe(true);
    const tools = cliTools(CLI);
    // 段 3 で番号の丸どうしが近すぎる図 (`layout-check.test.ts` が崩れを確かめる図)。段は 3 つ。
    // 前に使った支払いの図は段 3 の行きと帰りの線で崩れを作っていて、行きと帰りの線を離した直し (#3521) で段 3 の崩れが消えた
    const close = join(ROOT, "packages/dragon/test/fixtures/layout/close-badges.dragon");
    const broken = join(mkdtempSync(join(tmpdir(), "dragon-gallery-")), "broken.dragon");
    writeFileSync(broken, "not a diagram\n");
    const [found, steps, bad, badSteps] = await Promise.all([tools.breaks(close), tools.steps(close), tools.breaks(broken), tools.steps(broken)]);
    expect(found.error, "崩れを数えられない").toBeUndefined();
    const breakSteps = (found.problems ?? []).flatMap((problem) => (problem.layout ? [problem.layout.step] : []));
    expect(breakSteps, "崩れの段の番号を layout.step から読まない").toContain(3);
    expect(steps, "図の段の数").toBe(3);
    // 記法の誤りは崩れでない誤りとして返し、投げない
    expect(bad.problems?.some((problem) => problem.severity === "error" && problem.layout === undefined), "記法の誤りを返さない").toBe(true);
    expect(badSteps, "読めない図の段の数は分からないとする").toBeUndefined();
  });
});

/**
 * 記録の script が評価の後に頁を書き、置き場を出す (#3519)。
 * script は評価を回すたびに費用がかかるので、検査では回さずに script の字を読む
 */
describe("記録の script が評価の後に図の頁を書く (#3519)", () => {
  it("plugin-eval-record-writes-gallery-last", () => {
    const text = readFileSync(RECORD_SCRIPT, "utf8");
    expect(text, "頁を作る関数を読まない").toMatch(/import \{[^}]*\bwriteGallery\b[^}]*\} from "\.\/plugin-eval-gallery\.mjs";/u);
    const record = text.indexOf("writeFileSync(RECORD");
    const call = /const (\w+) = await writeGallery\(/u.exec(text);
    expect(record, "record.json を書かない").toBeGreaterThan(-1);
    expect(call, "頁を書いた置き場を受けない").not.toBeNull();
    expect(call?.index ?? -1, "record.json を書く前に頁を書く").toBeGreaterThan(record);
    expect(text, "実行の dir と判定を頁に渡さない").toMatch(/\{ dir: base, passed: ok, why \}/u);
    const last = [...text.matchAll(/console\.log\(/gu)].at(-1)?.index ?? -1;
    expect(last, "頁を書いた後に出力しない").toBeGreaterThan(call?.index ?? Infinity);
    expect(text.slice(last), "最後の出力に頁の置き場が無い").toContain(`\${${call?.[1] ?? "page"}}`);
  });

  it("plugin-eval-record-header-says-publish-gallery", () => {
    const header = /^#!.*\n\/\*\*\n([\s\S]*?)\n \*\//u.exec(readFileSync(RECORD_SCRIPT, "utf8"))?.[1] ?? "";
    expect(header, "頭の説明が頁を作る module を名指さない").toContain("plugin-eval-gallery.mjs");
    expect(header, "頭の説明が頁を Artifact で公開すると書かない").toContain("Artifact");
    expect(header, "頭の説明がリンクを渡すと書かない").toContain("リンク");
  });
});
