/**
 * `export.test.ts` の書き出しと比べる側の図を、1 回の実行の準備の段で済ませる (#3734)。
 *
 * 命令で 4 つの形を書き出す件と、aggregator を書き出す件は、混んだ機械で 1 件の上限 (10 秒) を超えた。
 * 命令 `dragon export` は子の Node の process で起こし、部品の書き出しは書き出しの thread で回す。
 * 件は書き出した file を読み、書き出した頁を Chromium で開いて確かめる。
 * 書き出しの時間を抑える設定 (小さな図、少ないコマ) は件の中で書き出していた時と同じ。件と準備で同じ物を使う値はここに置く。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { exportIn, runCli, scratch } from "../../../test-support/prepare-tools";
import { exampleJson, exampleText, type Json, patched, smallArchitecture, smallSequence } from "./diagram-data";

/** 英数字 (等幅の字で描く線の名前) と日本語が混ざり、段の本文が 2 行ある図 */
function mixed(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "API と字の図",
    boxes: [
      { id: "a", name: "Web アプリ" },
      { id: "b", name: "API v2" },
    ],
    steps: [
      {
        title: "問い合わせる",
        body: "Web アプリが API に問い合わせる。\n結果は JSON で返る。",
        events: [{ type: "edge", from: "a", to: "b", label: "GET /items", carry: { kind: "envelope" } }],
      },
    ],
    sequence: { lifelines: ["a", "b"] },
  };
}

/** 3 つの箱を 2 段で順に結ぶ構成図。2 段目の番号の丸は、1 段目の止め絵には出ない */
function twoSteps(): Json {
  const link = (from: string, to: string): Json => ({ type: "edge", from, to, carry: { kind: "envelope" } });
  return {
    version: 1,
    kind: "architecture",
    title: "2 段の構成図",
    regions: [{ id: "r", name: "区画" }],
    boxes: [
      { id: "a", name: "入口", region: "r" },
      { id: "b", name: "中", region: "r" },
      { id: "c", name: "出口", region: "r" },
    ],
    steps: [
      { title: "流す", body: "入口から中へ流す。", events: [link("a", "b")] },
      { title: "渡す", body: "中から出口へ渡す。", events: [link("b", "c")] },
    ],
  };
}

/**
 * 1 秒 1 コマの mp4 と 2 秒に 1 コマの GIF を 1 回で撮る動画と、2 段の図の PNG の 2 回に分けて書き出す。
 * 既定のコマの数 (1 秒 30 コマ) で撮ると 20 秒を超える。既定の数は `export-defaults.test.ts` が確かめる。
 * mp4 と GIF は 1 回で撮る。GIF は mp4 のコマを間引いて使うので、間引きのとおりのコマの数になるかを本物の書き出しで確かめる。
 * 混んだ機械では 1 コマに 0.3 秒から 0.5 秒かかるので、コマの数は数えて比べられる最小にする (コマの数は 0 より大きい数を受ける、#3410)
 */
export const RATES = { fps: 1, gifFps: 0.5 } as const;
/** 動画で撮る図。コマの数を数えるだけなので 2 段の図の最初の段だけを撮り、コマの数を半分にする (#3410) */
const oneStep = (): Json => {
  const two = twoSteps() as { steps: Json[] };
  return { ...two, steps: two.steps.slice(0, 1) };
};

/**
 * CCIP の最初の段。図の箱と絵柄は最初の段から全て描くので、GIF の色の表は最初の段で上限まで埋まる。
 * 段を 3 つ撮ると、混んだ機械で 1 件の上限 (10 秒) を超えた (#3381、#3410)
 */
const ccipHead = (): Json => {
  const ccip = exampleJson("ccip.json") as { steps: Json[] };
  return { ...ccip, steps: ccip.steps.slice(0, 1) };
};

/** 線を 1 本だけ持つ最小の時系列図。4 つの形式を書き出すことだけを確かめる検査が使う (#3410) */
const oneEdge = (): Json => {
  const small = smallSequence() as { steps: { events: Json[] }[] };
  return { ...small, steps: small.steps.map((step) => ({ ...step, body: "送る側が受ける側へ送る。", events: step.events.slice(0, 1) })) };
};

/** 書き出した HTML に埋める script は全ての種類を持ち、部品を後から読まない (#3248)。種類ごとの見本 */
export const EVERY_KIND = [
  { kind: "architecture", file: "ccip.dragon" },
  { kind: "git", file: "rebase.dragon" },
  { kind: "lineup", file: "auction.dragon" },
  { kind: "sequence", file: "api.dragon" },
  { kind: "state", file: "order.dragon" },
  { kind: "time", file: "finality.dragon" },
  { kind: "tree", file: "merkle.dragon" },
] as const;

const outDir = (): string => scratch("dragon-export-");

/** 命令で、まだ無い dir へ書き出す。書き出した先を返す */
async function cliExport(name: string, text: string, extra: string[]): Promise<{ code: number; stderr: string; out: string }> {
  const dir = outDir();
  const input = join(dir, name);
  writeFileSync(input, text);
  // 書き出す先の dir はまだ無い
  const out = join(dir, "new", name.replace(/\.[^.]+$/u, ""));
  const ran = await runCli(["export", input, "--out", out, ...extra]);
  return { code: ran.code, stderr: ran.stderr, out };
}

/** 種類の見本を記法から読んで HTML に書き出す */
async function kindHtml(file: string): Promise<{ parsed: boolean; kind?: string; steps: number; html?: string }> {
  const parsed = dragon.parseNotation(exampleText(file));
  if (!parsed.ok) return { parsed: false, steps: 0 };
  const diagram = parsed.diagram as { kind?: string; steps: unknown[] };
  const result = await exportIn(parsed.diagram, { outDir: outDir(), formats: ["html"] });
  return { parsed: true, kind: diagram.kind ?? "architecture", steps: diagram.steps.length, ...(result.files.html ? { html: result.files.html } : {}) };
}

/** 同じ図を 2 回、別の dir へ PNG に書き出す */
async function twice(): Promise<(string | undefined)[]> {
  const shots: (string | undefined)[] = [];
  for (const k of [0, 1]) {
    const dir = join(outDir(), `run-${k}`);
    mkdirSync(dir, { recursive: true });
    shots.push((await exportIn(smallArchitecture(), { outDir: dir, formats: ["png"], theme: "dark" })).files.png);
  }
  return shots;
}

export default async function prepare() {
  // 寄って見せると決めた CCIP の最初の段と最後の段。全ての段を撮ると 45 秒の図になるので、見る範囲の離れた 2 段だけを撮る (#3381)
  const full = exampleJson("ccip.json") as { steps: Json[] };
  const ccipFollow = patched({ ...full, steps: [full.steps[0], full.steps.at(-1)].filter((step): step is Json => step !== undefined) }, ["view"], "follow");
  const [video, png, palette, fourFormats, notationHtml, deterministic, camera, fontSubset, kinds, oauthHtml, aggregatorHtml] = await Promise.all([
    exportIn(oneStep(), { outDir: outDir(), formats: ["mp4", "gif"], ...RATES }),
    exportIn(twoSteps(), { outDir: outDir(), formats: ["png"], ...RATES }),
    // GIF の色の表は 1 コマごとに作るので、4 秒に 1 コマで撮り、コマを 3 つに絞る (#3410)
    exportIn(ccipHead(), { outDir: outDir(), formats: ["gif"], gifFps: 0.25 }),
    // 4 つの形式に書かれることだけを見るので、2 秒に 1 コマで撮る (#3410)
    cliExport("small.json", JSON.stringify(oneEdge()), ["--fps", "0.5", "--gif-fps", "0.5"]),
    cliExport("small-notation.dragon", dragon.printNotation(oneEdge() as unknown as Parameters<typeof dragon.printNotation>[0]), ["--format", "html"]),
    twice(),
    // 比べるのは最初と途中の 2 コマなので、2 秒に 1 コマで撮る (#3410)
    exportIn(ccipFollow, { outDir: outDir(), formats: ["mp4", "html"], fps: 0.5 }),
    exportIn(mixed(), { outDir: outDir(), formats: ["html"] }),
    Promise.all(EVERY_KIND.map(({ file }) => kindHtml(file))),
    // 帯と釦の件は、`oauth.json` を HTML に 1 度だけ書き出して使い回す (#3421)
    exportIn(exampleJson("oauth.json"), { outDir: outDir(), formats: ["html"] }),
    exportIn(exampleJson("aggregator.json"), { outDir: outDir(), formats: ["html"] }),
  ]);
  const { layout } = dragon.renderDiagram(twoSteps()) as unknown as { layout: { width: number; badges: { x: number; y: number }[] } };
  return {
    video,
    /** 動画で撮った図の 1 周の秒数 */
    videoTotal: (dragon.renderDiagram(oneStep()) as unknown as { timeline: { total: number } }).timeline.total,
    png,
    /** PNG に撮った 2 段の図の幅と、段の番号の丸の所 */
    pngLayout: { width: layout.width, badges: layout.badges.map(({ x, y }) => ({ x, y })) },
    palette,
    fourFormats,
    notationHtml,
    deterministic,
    camera,
    fontSubset: fontSubset.files.html,
    kinds,
    oauthHtml: oauthHtml.files.html,
    aggregatorHtml: aggregatorHtml.files.html,
  };
}
