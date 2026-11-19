/**
 * `pipe-stored-layout.test.ts` の重い仕事を、1 回の実行の準備の段で済ませる (#3748、`test-support/prepare-setup.ts`)。
 *
 * 1. 箱 2 を開いた `aggregator.json` の並べ方を書き出す部品 (`pipeLayouts`) で組んで file に書き、新しい process (`tsx`) で 1 回目に描かせる。
 *    収めた並べ方を渡した回と渡さない回で、道を探した回数と描く本体の thread の CPU を返す。
 * 2. 配管の原本の全てを `layout` の行の 8 通りで、最初に見える形と箱を 1 つだけ開いた形に描き、
 *    描いた時に組んだ並べ方を集めて (`collectPipeLayouts`)、集めた並べ方を渡して描き直す。
 *    渡した並べ方を使ったか (印の欄 `__probe` が描いた並べ方に残るか) と、描いた並べ方と SVG が渡さずに描いた時と同じかを返す。
 *
 * まだ作っていない部品は無い物として名指して返し、準備の段では落とさない。件がその名前を挙げて落ちる。
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as pipeLayout from "../src/kinds/pipe/layout";
import { renderDiagram } from "../src/core";
import { parseNotation } from "../src/parser";
import { Router } from "../src/pipe-route";
import { CASES, langOfFile, REPO, type Row } from "./pipe-stored-layout-support";
import "../src/kind-use/pipe";

/** 収めた並べ方に付ける印。描いた並べ方に残れば、収めた並べ方を使ったと分かる */
const PROBE = "stored-layout-probe";

type Collect = <T>(run: () => T) => { value: T; layouts: { key: string; layout: Record<string, unknown> }[] };
type Laid = { svg: string; layout: Record<string, unknown> & { folds?: { call: number }[] } };

const render = (source: unknown, options: Record<string, unknown>): Laid => renderDiagram(source, options) as unknown as Laid;
const missing = (name: string): string => `${name} が無い`;

/** 原本を読み、`layout` の行を `row` の形にした原本を返す */
function sourceOf(file: string, row: Row): Record<string, unknown> {
  const text = readFileSync(join(REPO, file), "utf8");
  const lang = langOfFile(file);
  let base: Record<string, unknown>;
  if (file.endsWith(".json")) base = JSON.parse(text) as Record<string, unknown>;
  else {
    const read = parseNotation(text, { lang });
    if (!read.ok) throw new Error(`${file}: ${JSON.stringify(read.errors)}`);
    base = read.diagram as unknown as Record<string, unknown>;
  }
  const diagram = structuredClone(base);
  // 原本の形 (版2) は図の欄の中に layout を持つ。版1の形は頭に持つ
  const inner = diagram.diagram;
  const target = (inner !== null && typeof inner === "object" ? inner : diagram) as Record<string, unknown>;
  if (row === "none") delete target.layout;
  else if (row !== "as-written") target.layout = row;
  return diagram;
}

/** 道を探した回数を数えながら `run` を回す */
function counted<T>(run: () => T): { value: T; routeCalls: number } {
  let routeCalls = 0;
  // 置き換える前の route を取っておき、置き換えた関数が受けた this を渡して呼び、終わったら戻す
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const route = Router.prototype.route;
  Router.prototype.route = function (this: Router, ask: Parameters<typeof route>[0]) {
    routeCalls++;
    return route.call(this, ask);
  };
  try {
    return { value: run(), routeCalls };
  } finally {
    Router.prototype.route = route;
  }
}

interface FormResult {
  open: number[];
  usedStored: boolean;
  sameLayout: boolean;
  sameSvg: boolean;
}

interface CaseResult {
  error?: string;
  stored?: number;
  routeCalls?: number;
  forms?: FormResult[];
}

function compareCase(file: string, row: Row, collect: Collect | undefined): CaseResult {
  if (!collect) return { error: missing("collectPipeLayouts") };
  const source = sourceOf(file, row);
  const lang = langOfFile(file);
  const base: { open: number[]; layout: string; svg: string }[] = [];
  const { layouts } = collect(() => {
    const closed = render(source, { lang });
    base.push({ open: [], layout: JSON.stringify(closed.layout), svg: closed.svg });
    for (const fold of closed.layout.folds ?? []) {
      const opened = render(source, { lang, open: [fold.call] });
      base.push({ open: [fold.call], layout: JSON.stringify(opened.layout), svg: opened.svg });
    }
  });
  // 頁に収めた並べ方と同じく JSON を通し、使ったかを見る印を付ける
  const stored = (JSON.parse(JSON.stringify(layouts)) as { key: string; layout: Record<string, unknown> }[]).map((s) => ({ ...s, layout: { ...s.layout, __probe: PROBE } }));
  const { value: forms, routeCalls } = counted(() =>
    base.map((b): FormResult => {
      const drawn = render(source, { lang, open: b.open, layouts: stored });
      const usedStored = drawn.layout.__probe === PROBE;
      delete drawn.layout.__probe;
      return { open: b.open, usedStored, sameLayout: JSON.stringify(drawn.layout) === b.layout, sameSvg: drawn.svg === b.svg };
    }),
  );
  return { stored: layouts.length, routeCalls, forms };
}

interface FirstDraw {
  error?: string;
  /** 収めた並べ方を渡して新しい process で 1 回目に描いた回 */
  stored?: { routeCalls: number; cpu: number };
  /** 渡さずに新しい process で 1 回目に描いた回 */
  composed?: { routeCalls: number; cpu: number };
}

/** 箱 2 を開いた aggregator を、新しい process で 1 回目に描く */
async function firstDraw(): Promise<FirstDraw> {
  // まだ作っていない file を読んでも準備の段を落とさないよう、path を字で渡して読む
  const entry = join(REPO, "packages/dragon/src/export/layouts.ts");
  const mod = (await import(/* @vite-ignore */ entry).catch(() => undefined)) as { pipeLayouts?: (input: unknown, options: Record<string, unknown>) => unknown[] } | undefined;
  if (typeof mod?.pipeLayouts !== "function") return { error: missing("書き出す部品の pipeLayouts (src/export/layouts.ts)") };
  const sourceFile = join(REPO, "packages/dragon/examples/aggregator.json");
  const layouts = mod.pipeLayouts(JSON.parse(readFileSync(sourceFile, "utf8")), { lang: "ja" });
  const dir = mkdtempSync(join(tmpdir(), "dragon-3748-"));
  try {
    const layoutsFile = join(dir, "layouts.json");
    writeFileSync(layoutsFile, JSON.stringify(layouts));
    const child = (...args: string[]): { routeCalls: number; cpu: number } =>
      JSON.parse(
        execFileSync(join(REPO, "node_modules/.bin/tsx"), [join(REPO, "packages/dragon/test/pipe-stored-layout-child.ts"), sourceFile, "2", ...args], { cwd: REPO, encoding: "utf8" }).trim().split("\n").pop() ?? "{}",
      ) as { routeCalls: number; cpu: number };
    return { stored: child(layoutsFile), composed: child() };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export default async function prepare() {
  const collect = (pipeLayout as unknown as { collectPipeLayouts?: Collect }).collectPipeLayouts;
  const cases: Record<string, CaseResult> = {};
  for (const { id, file, row } of CASES) {
    try {
      cases[id] = compareCase(file, row, collect);
    } catch (error) {
      cases[id] = { error: error instanceof Error ? error.message : String(error) };
    }
  }
  let first: FirstDraw;
  try {
    first = await firstDraw();
  } catch (error) {
    first = { error: error instanceof Error ? error.message : String(error) };
  }
  return { cases, first };
}
