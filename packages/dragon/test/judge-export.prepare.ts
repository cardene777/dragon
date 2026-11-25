/**
 * `judge-export.test.ts` の書き出しを、1 回の実行の準備の段で済ませる (#3923、#3734)。
 *
 * 判定の表 (#3879) は SVG でなく HTML で描くので、書き出しは撮る頁で表を描いた大きさを測って撮る。
 * 見本の PNG、段と幅を渡した PNG、形を選ばない命令の書き出し、SVG の図の PNG を並べて済ませる。GIF のコマの読み戻しは検査の file の読み込む段が行う。
 * 判定の表の書き出しが落ちても準備を止めず、落ちた理由を残す。件はその理由を挙げて落ち、ほかの件は回る。
 * 件は書き出した file の画素を、表の色の値 (描いた HTML の根の `style` の色) で数えて確かめる。
 */
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { EXAMPLES, exportIn, type Ran, runCli, scratch } from "../../../test-support/prepare-tools";
import { exampleText, type Json, smallSequence } from "./diagram-data";
// 既定の入口 (`dist`) で判定の表と時系列図を書き出すので、全ての種類を読む助けの file に型だけでつなぐ (#3763)
import type {} from "./all-kinds";

/** 判定の表の英語の見本 4 つ */
export const JUDGE_EXAMPLES = [
  "airdrop-check.en.dragon",
  "refund-check.en.dragon",
  "signup-check.en.dragon",
  "transfer-check.en.dragon",
] as const;
/** 段と幅を渡して撮る見本。規則を 5 つ持つ */
export const STEPPED = "transfer-check.en.dragon";
/** 形を選ばずに命令で書き出す見本 */
export const FILMED = "airdrop-check.en.dragon";
/** 命令で撮る動画の 1 秒のコマの数。既定 (30 と 10) で撮ると 20 秒の表で 600 コマになるので、数えて比べられる最小にする */
export const FILM_RATES = { fps: 1, gifFps: 0.5 } as const;

/** 書き出しの結果か、落ちた理由 */
export type Settled<T> = { ok: true; value: T } | { ok: false; error: string };
const settle = async <T>(run: () => Promise<T>): Promise<Settled<T>> => {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    return {
      ok: false,
      error: String(error instanceof Error ? (error.stack ?? error.message) : error),
    };
  }
};

/** 判定の表の見本の中身。規則の数、例ごとの判定、表の色の値 */
export interface JudgeFacts {
  rules: number;
  verdicts: ("pass" | "block")[];
  colors: Record<string, string>;
  /** 段ごとの止め絵の時刻 (秒) */
  stills: number[];
}

/** 描いた HTML の根の `style` に書いた色の値 (`--surf` など) */
function colorsOf(markup: string): Record<string, string> {
  const style = /style="([^"]*)"/.exec(markup)?.[1]?.replace(/&quot;/g, '"') ?? "";
  return Object.fromEntries(
    [...style.matchAll(/(--[\w-]+):(#[0-9a-f]{6,8})/gi)].map(([, name, value]) => [
      name as string,
      value as string,
    ]),
  );
}

function judgeOf(file: string): { diagram: unknown; facts: JudgeFacts } {
  const parsed = dragon.parseNotation(exampleText(file));
  if (!parsed.ok) throw new Error(`${file} を読めない`);
  const spec = (parsed.diagram as { judge: { rules: unknown[]; cases: { fails?: unknown[] }[] } })
    .judge;
  const rendered = dragon.renderDiagram(parsed.diagram);
  return {
    diagram: parsed.diagram,
    facts: {
      rules: spec.rules.length,
      verdicts: spec.cases.map((one) => ((one.fails?.length ?? 0) > 0 ? "block" : "pass")),
      colors: colorsOf(rendered.svg),
      stills: rendered.timeline.stills,
    },
  };
}

/** GIF のコマ (重ねて描き終えた絵)。画素は RGBA の並びを base64 にした字 (準備の段から件へ字で渡す) */
export interface GifShot {
  width: number;
  height: number;
  rgba: string;
}

/**
 * 形を選ばずに命令で書き出した結果と、書き出した GIF の path と最後の段の止め絵の時刻のコマの番号。
 * GIF のコマの読み戻しは Chromium を使うので、検査の file の読み込む段が file で 1 つの Chromium で行う (#3424、#3940)
 */
export interface Filmed {
  ran: Ran;
  out: string;
  gif?: { path: string; lastIndex: number };
}

async function filmed(facts: JudgeFacts): Promise<Filmed> {
  const dir = scratch("dragon-judge-film-");
  const out = join(dir, "out");
  const ran = await runCli([
    "export",
    join(EXAMPLES, FILMED),
    "--out",
    out,
    "--fps",
    String(FILM_RATES.fps),
    "--gif-fps",
    String(FILM_RATES.gifFps),
  ]);
  if (ran.code !== 0) return { ran, out };
  // GIF の k 番目のコマは k / gifFps 秒の絵。最後の段 (判定の列) の止め絵の時刻に最も近いコマを読む
  const lastIndex = Math.round((facts.stills.at(-1) ?? 0) * FILM_RATES.gifFps);
  return { ran, out, gif: { path: join(out, FILMED.replace(/\.dragon$/u, ".gif")), lastIndex } };
}

/** SVG で描く図の PNG と、描いた SVG の `width` と `height` */
async function svgPng(): Promise<{ png: string; width: number; height: number }> {
  const diagram: Json = smallSequence();
  const svg = dragon.renderDiagram(diagram).svg;
  const [, width = "0", height = "0"] =
    /^<svg\b[^>]*?\swidth="(\d+)"\s+height="(\d+)"/.exec(svg) ?? [];
  const result = await exportIn(diagram, { outDir: scratch("dragon-svg-png-"), formats: ["png"] });
  return { png: result.files.png as string, width: Number(width), height: Number(height) };
}

/** 図に無い段を選んで書き出した時の断りと、書き出す先の dir が残らないか */
async function missingStep(diagram: unknown): Promise<{ error?: string; outDir: string }> {
  const outDir = join(scratch("dragon-judge-step-"), "never");
  try {
    await exportIn(diagram, { outDir, formats: ["png"], step: 99 });
    return { outDir };
  } catch (error) {
    return { error: String(error instanceof Error ? error.message : error), outDir };
  }
}

export default async function prepare() {
  const judges = Object.fromEntries(JUDGE_EXAMPLES.map((file) => [file, judgeOf(file)]));
  const png = (
    file: string,
    extra: { step?: number; width?: number } = {},
  ): Promise<Settled<string>> =>
    settle(
      async () =>
        (
          await exportIn(judges[file]?.diagram, {
            outDir: scratch("dragon-judge-png-"),
            formats: ["png"],
            ...extra,
          })
        ).files.png as string,
    );
  const [pngs, stepped, narrow, film, svg, refused] = await Promise.all([
    Promise.all(JUDGE_EXAMPLES.map(async (file) => [file, await png(file)] as const)),
    png(STEPPED, { step: 2 }),
    png(STEPPED, { width: 390 }),
    settle(() => filmed(judges[FILMED]?.facts as JudgeFacts)),
    svgPng(),
    missingStep(judges[STEPPED]?.diagram),
  ]);
  const facts = Object.fromEntries(
    Object.entries(judges).map(([file, judge]) => [file, judge.facts]),
  );
  return { facts, pngs: Object.fromEntries(pngs), stepped, narrow, film, svg, refused };
}
