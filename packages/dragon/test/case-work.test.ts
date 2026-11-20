/**
 * 検査の件の中の重い仕事の形 (#3738)。
 *
 * 別の会話の負荷が高い時、件の中で図を描く、画面を置く、書き出す、子の process を起こす、頁を開く仕事を重ねる件が、1 件 10 秒の上限を超えて落ちた。
 * load average 76 の下で 4 秒以上かかった件を、次の 3 つの形に直した。
 *
 * - 見本や形式や組を件の中で全て回していた件は、1 つずつの件に分けた (`split` は件の中の重い呼び出しの上限)
 * - 1 回分の仕事しか持たない件は、その仕事を検査の file を読み込む段 (`at-load.ts`) で済ませ、件はその結果を読む (`load` は件に残してよい重い呼び出しの数)
 * - 子の process で命令を起こしていた件は、同じ process の呼び出しに替えた (`child`)
 *
 * 件の字を構文で読み、直した形から外れた件を名前と呼び出しと共に挙げる。数え方は `case-work.ts` が持つ。
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
/** 数える道具。まだ無い時もこの file のほかの件を回すため、置き場を変数で渡して読めない時は無いと判定する */
const WORK = "./case-work";
/** file を読み込む段の道具 */
const AT_LOAD = "./at-load";

interface Call {
  name: string;
  looped: boolean;
}
interface FoundCase {
  name: string;
  heavy: Call[];
  child: Call[];
  readsAtLoad: boolean;
}
interface Work {
  casesIn: (source: string, fileName?: string) => FoundCase[];
  countOf: (calls: readonly Call[]) => number;
  describeCalls: (calls: readonly Call[]) => string;
}
interface Loaded<T> {
  get: () => T;
}
interface AtLoad {
  atLoad: <T>(name: string, work: () => T | Promise<T>) => Promise<Loaded<T>>;
}

/** 直した件の形。`split` と `load` は件の中の重い呼び出しの上限 (繰り返しの中の呼び出しは無限と数える) */
interface Rule {
  file: string;
  name: string;
  split?: number;
  load?: number;
  child?: true;
}

const T = "packages/dragon/test/";
const A = "apps/playground-spa/src/";

/** load average 76 の下で 4 秒以上かかった件と、背景の表で見本を全て回していた件 */
const RULES: Rule[] = [
  // 見本や形式や組ごとに分けた件
  { file: `${T}layout-check.test.ts`, name: "layout-check-examples-match-recorded", split: 1 },
  { file: `${T}layout-check.test.ts`, name: "gallery-warns-nothing", split: 1 },
  { file: `${T}layout-check.test.ts`, name: "export-png-at-step", split: 1 },
  { file: `${T}layout-check.test.ts`, name: "amount-chip-near-flow-in-swap-retry", split: 1 },
  { file: `${T}layout-check.test.ts`, name: "export-step-cli-rejects-missing-step", split: 1, child: true },
  { file: `${T}arcade-corners.test.ts`, name: "arcade-cuts-box-region-frame-corners", split: 1 },
  { file: `${T}arcade-corners.test.ts`, name: "other-palettes-keep-rounded-corners", split: 1 },
  { file: `${T}arcade-palette.test.ts`, name: "cli-draws-with-arcade-palette", load: 0, child: true },
  { file: `${T}blocks.test.ts`, name: "every-block-draws-on-every-matching-kind", split: 1 },
  { file: `${A}lib/catalog-parts.test.ts`, name: "catalog-part-snippets-use-their-words", split: 1 },
  { file: `${T}light-entry.test.ts`, name: "default-entry-draws-every-kind", split: 1, load: 1 },
  { file: `${A}lib/playground.test.ts`, name: "first-load-carries-no-part-desc", split: 1 },
  { file: `${T}pen-line.test.ts`, name: "pen-line-parts-have-no-breaks", split: 1 },
  { file: `${T}pipe-diagram.test.ts`, name: "pipe-layout-same-in-every-palette", split: 1 },
  { file: `${T}pipe-layout-quality.test.ts`, name: "pipe-fit-wide-keeps-readable-text", split: 2 },
  { file: `${T}pipe-port.test.ts`, name: "port-player-zoom-options", split: 2 },
  { file: `${T}shaped-box-fit.test.ts`, name: "shaped-box-basic-shapes-fit", split: 2 },
  // 1 回分の仕事を file を読み込む段で済ませた件。命令と書き出しの件は、種類の検査から `*-cli-checks.ts` へ移し `kind-cli.test.ts` が読む (#3763)
  { file: `${T}arcade-bends.test.ts`, name: "arcade-sharpens-line-and-arrow-joins", load: 0 },
  { file: `${T}arcade-bends.test.ts`, name: "arcade-draws-square-line-bends", load: 0 },
  { file: `${T}arcade-bends.test.ts`, name: "arcade-keeps-round-line-ends", load: 0 },
  { file: `${T}blocks.test.ts`, name: "block-folder-holds-whole-definition", load: 0 },
  { file: `${T}chart-diagram-cli-checks.ts`, name: "chart-exports-every-format", load: 0 },
  { file: `${T}clock-look.test.ts`, name: "clock-short-step-leads-labels-out", load: 0 },
  { file: `${T}export-blocks.test.ts`, name: "export-uses-blocks-option-definitions", load: 0 },
  { file: `${T}flow-diagram-cli-checks.ts`, name: "flow-exports-every-format", load: 0 },
  { file: `${T}follow-strip.test.ts`, name: "follow-strip-whole-in-figure", load: 0 },
  { file: `${T}follow-strip.test.ts`, name: "follow-window-stops-above-strip", load: 0 },
  { file: `${T}follow-strip.test.ts`, name: "follow-strip-narrow-drops-overview", load: 0 },
  { file: `${T}follow-strip.test.ts`, name: "follow-strip-narrow-keeps-window", load: 0 },
  { file: `${T}icon-paint-cli-checks.ts`, name: "icon-command-refuses-non-solid", load: 0 },
  { file: `${T}icon-set.test.ts`, name: "html-export-carries-only-used-tabler-icons", load: 0 },
  { file: `${T}interactive-browser.test.ts`, name: "interactive-controls-fit-390-at-44px", load: 1 },
  { file: `${T}interactive-diagram-cli-checks.ts`, name: "interactive-export-draws-author-steps", load: 0 },
  { file: `${T}layout-check.test.ts`, name: "layout-check-finds-label-off-line", load: 0 },
  { file: `${T}layout-check.test.ts`, name: "layout-check-skips-intended-overlaps", load: 0 },
  { file: `${T}light-entry.test.ts`, name: "light-entry-draws-same-svg", load: 4 },
  { file: `${T}light-entry.test.ts`, name: "light-mounts-parsed-try-without-validator", load: 0 },
  { file: `${T}overview-place.test.ts`, name: "overview-outside-window", load: 0 },
  { file: `${T}pipe-diagram.test.ts`, name: "pipe-move-shifts-tank-levels", load: 0 },
  { file: `${T}pipe-diagram-r6.test.ts`, name: "pipe-r6-final-step-draws-all-tanks", load: 0 },
  { file: `${T}pipe-diagram-r6.test.ts`, name: "pipe-r6-gauge-on-pipe", load: 0 },
  { file: `${T}pipe-diagram-rules.test.ts`, name: "pipe-rules-zero-violations-in-every-example", load: 0 },
  { file: `${T}pipe-diagram-rules.test.ts`, name: "pipe-pipes-join-side-ports-and-cross-under", load: 0 },
  { file: `${T}pipe-diagram-rules.test.ts`, name: "pipe-layout-matches-recorded-fingerprints", load: 0 },
  { file: `${T}pipe-diagram-rules.test.ts`, name: "pipe-text-caps-and-square-labels", load: 0 },
  { file: `${T}pipe-layout-quality.test.ts`, name: "pipe-faint-lines-avoid-boxes", load: 0 },
  { file: `${T}pipe-layout-quality.test.ts`, name: "pipe-contracts-share-shape-and-height", load: 0 },
  { file: `${T}pipe-layout-quality.test.ts`, name: "pipe-export-frames-keep-layout", load: 0 },
  { file: `${T}pipe-layout-quality.test.ts`, name: "pipe-grid-no-overlap", load: 0 },
  { file: `${T}pipe-layout-quality.test.ts`, name: "pipe-grid-long-names-and-many-logs", load: 0 },
  { file: `${T}pipe-words.test.ts`, name: "pipe-words-mount-keeps-words", load: 1 },
  { file: `${T}plugin-eval.test.ts`, name: "plugin-eval-stand-in-records-gh", load: 0 },
  { file: `${T}plugin-eval.test.ts`, name: "plugin-eval-stand-in-gh-rejects-missing-body", load: 0 },
  { file: `${T}return-lines-cli-checks.ts`, name: "return-lines-payment-eval-no-close-breaks", load: 0 },
  { file: `${T}test-limits.test.ts`, name: "test-over-limit-is-stopped-and-named", load: 0 },
  { file: `${T}test-limits.test.ts`, name: "run-limit-stops-whole-run", load: 0 },
  { file: `${T}test-limits.test.ts`, name: "run-limit-writes-unfinished-files", load: 0 },
  { file: `${T}test-limits.test.ts`, name: "unfinished-out-not-inherited-by-tests", load: 0 },
  { file: `${T}time-axis-inside-cli-checks.ts`, name: "layout-check-finds-time-text-on-panel-edge", load: 0 },
  { file: `${A}editor/export-menu.test.tsx`, name: "editor-export-menu-lists-formats", load: 1 },
  { file: `${A}lib/embed-sample.test.ts`, name: "docs-page-has-embed-section", load: 0 },
  { file: `${A}lib/first-load-split.test.ts`, name: "later-shelf-items-match", load: 0 },
  { file: `${A}lib/line-style.test.tsx`, name: "stage-picks-pen-line", load: 1 },
  { file: `${A}lib/playground.test.ts`, name: "page-bundle-within-budget", load: 0 },
  { file: `${A}lib/split-bars.test.tsx`, name: "split-code-drag-widens-code", load: 1 },
  // 子の Node で命令を起こす件と書き出しの入口を読む件、箱を開いた aggregator を jsdom に置く件は、仕事を読む段で済ませる (#3739)
  { file: `${T}export-leftovers.test.ts`, name: "export-failure-leaves-no-out-dir", load: 0, child: true },
  { file: `${T}export-leftovers.test.ts`, name: "export-failure-writes-no-html", load: 0, child: true },
  { file: `${T}export-leftovers.test.ts`, name: "export-failure-keeps-existing-dir", load: 0, child: true },
  { file: `${T}export-leftovers.test.ts`, name: "export-write-failure-removes-created-dir", load: 0, child: true },
  { file: `${T}player.test.ts`, name: "player-pans-wide-figure", load: 0, child: true },
  { file: `${T}player.test.ts`, name: "player-pipe-flows-show-moves", load: 0, child: true },
  { file: `${T}player.test.ts`, name: "player-pipe-flows-show-calls-and-returns", load: 0, child: true },
  { file: `${T}player.test.ts`, name: "player-pipe-narrow-keeps-text-readable", load: 0, child: true },
];

/** 数える道具を読む。無い時は undefined */
const work = async (): Promise<Work | undefined> => (await import(/* @vite-ignore */ WORK).catch(() => undefined)) as Work | undefined;

/** 件の file の字。無い時は undefined */
const sourceOf = (file: string): string | undefined => (existsSync(join(ROOT, file)) ? readFileSync(join(ROOT, file), "utf8") : undefined);

/**
 * 数える道具と、規則の file ごとの件。file の字を構文で読むのは重いので、件ごとに読み直さず、file を読み込む段で 1 度だけ読む。
 * 道具が無い時と、件の file が無い時は undefined
 */
const COUNTED = await (async () => {
  const w = await work();
  const cases = new Map<string, FoundCase[] | undefined>();
  if (w !== undefined)
    for (const file of new Set(RULES.map((rule) => rule.file))) {
      const source = sourceOf(file);
      cases.set(file, source === undefined ? undefined : w.casesIn(source, file));
    }
  return { w, cases };
})();

/** 規則に当たる件を全て集め、`judge` が返した外れを `file > 件の名前: 理由` の形で返す */
function broken(pick: (rule: Rule) => boolean, judge: (rule: Rule, found: FoundCase, w: Work) => string | undefined): string[] {
  const { w, cases } = COUNTED;
  expect(w?.casesIn, "件の重い仕事を数える道具 (packages/dragon/test/case-work.ts の casesIn) が無い").toBeTypeOf("function");
  if (w === undefined) return [];
  const out: string[] = [];
  for (const rule of RULES.filter(pick)) {
    const inFile = cases.get(rule.file);
    if (inFile === undefined) {
      out.push(`${rule.file} > ${rule.name}: 件の file が無い`);
      continue;
    }
    const found = inFile.filter((c) => c.name === rule.name);
    if (found.length === 0) out.push(`${rule.file} > ${rule.name}: 件が無い`);
    for (const c of found) {
      const why = judge(rule, c, w);
      if (why !== undefined) out.push(`${rule.file} > ${rule.name}: ${why}`);
    }
  }
  return out;
}

describe("検査の件の中の重い仕事 (#3738)", () => {
  it("case-work-no-heavy-loop-in-cases", () => {
    const found = broken(
      (rule) => rule.split !== undefined,
      (rule, c, w) => {
        const count = w.countOf(c.heavy);
        return count > (rule.split as number) ? `重い呼び出しが ${count} (上限 ${rule.split}) ${w.describeCalls(c.heavy)}` : undefined;
      },
    );
    expect(found, "件の中で重い仕事を繰り返す件").toEqual([]);
  });

  it("case-work-no-heavy-call-in-load-cases", () => {
    const found = broken(
      (rule) => rule.load !== undefined,
      (rule, c, w) => {
        if (!c.readsAtLoad) return "file を読み込む段で済ませた仕事の結果 (atLoad で作った物の get()) を読まない";
        const count = w.countOf(c.heavy);
        return count > (rule.load as number) ? `重い呼び出しが ${count} (上限 ${rule.load}) ${w.describeCalls(c.heavy)}` : undefined;
      },
    );
    expect(found, "1 回分の仕事を件の中に残す件").toEqual([]);
  });

  it("case-work-no-child-process-in-cases", () => {
    const found = broken(
      (rule) => rule.child === true,
      (_rule, c, w) => (c.child.length > 0 ? `子の process を起こす ${w.describeCalls(c.child)}` : undefined),
    );
    expect(found, "子の process を起こす件").toEqual([]);
  });

  it("case-work-named-cases-exist", () => {
    // 件の名前は直す前と同じまま残す。分けた件も元の件の名前を持つ
    const found = broken(
      () => true,
      () => undefined,
    );
    expect(found, "名指した file に無い件").toEqual([]);
    expect(new Set(RULES.map((r) => `${r.file} ${r.name}`)).size, "同じ件を 2 度挙げている").toBe(RULES.length);
  });

  it("case-work-finder-names-planted-calls", async () => {
    const w = await work();
    expect(w?.casesIn, "件の重い仕事を数える道具 (packages/dragon/test/case-work.ts の casesIn) が無い").toBeTypeOf("function");
    if (w === undefined) return;
    const planted = [
      'import { it } from "vitest";',
      "const LOADED = await atLoad(\"見本\", () => renderDiagram(sample));",
      "function layoutOf(file) { return runCli([\"check\", file]); }",
      "const check = checker();",
      "function checker() { const found = dragon.checkLayoutText; return found; }",
      'it("planted-loop", () => { for (const f of files) renderDiagram(f); });',
      'it("planted-map", () => { files.map((f) => check(f)); });',
      'it("planted-once", () => { renderDiagram(one); });',
      // 説明の文と字の列の中の名前は呼び出しでない: renderDiagram(x)
      'it("planted-said", () => { const said = "renderDiagram(y)"; return said; });',
      'it("planted-load", () => { expect(LOADED.get()).toBeDefined(); });',
      'it("planted-load-but-draws", () => { LOADED.get(); renderDiagram(two); });',
      'it("planted-child", async () => { await layoutOf("a.dragon"); });',
      'it("planted-by-name", () => { draw("renderDiagram")(three, {}); });',
    ].join("\n");
    const cases = new Map(w.casesIn(planted).map((c) => [c.name, c]));
    const count = (name: string): number => w.countOf(cases.get(name)?.heavy ?? []);
    expect(count("planted-loop"), "for の中の描く呼び出しを無限と数えない").toBe(Number.POSITIVE_INFINITY);
    expect(count("planted-map"), "map に渡した関数の中の、崩れを数える関数を入れた変数の呼び出しを無限と数えない").toBe(Number.POSITIVE_INFINITY);
    expect(count("planted-once"), "繰り返しの外の 1 回の呼び出しを 1 と数えない").toBe(1);
    expect(count("planted-said"), "字の列と説明の文の中の名前を呼び出しと数えた").toBe(0);
    expect(cases.get("planted-load")?.readsAtLoad, "atLoad で作った物の get() を読まないと数えた").toBe(true);
    expect(count("planted-load"), "atLoad で作った物を読むだけの件に重い呼び出しを数えた").toBe(0);
    expect(count("planted-load-but-draws"), "atLoad の結果を読んだ後の描く呼び出しを数えない").toBe(1);
    expect(w.describeCalls(cases.get("planted-child")?.child ?? []), "同じ file の関数を通して子の process を起こす呼び出しを名指さない").toBe("layoutOf");
    expect(count("planted-by-name"), "名前の字で引いた描く関数の呼び出しを数えない").toBe(1);
    expect(cases.has("LOADED"), "file を読み込む段の仕事を件と数えた").toBe(false);
  });

  it("at-load-failure-fails-only-its-readers", async () => {
    const tool = (await import(/* @vite-ignore */ AT_LOAD).catch(() => undefined)) as AtLoad | undefined;
    expect(tool?.atLoad, "file を読み込む段の道具 (packages/dragon/test/at-load.ts の atLoad) が無い").toBeTypeOf("function");
    if (tool === undefined) return;
    // 読み込む段で落ちた仕事は、その場で投げずに結果に残し、読んだ件だけが仕事の名前と理由を挙げて落ちる
    const fine = await tool.atLoad("通る仕事", () => 1);
    const failing = await tool.atLoad("落ちる仕事", () => {
      throw new Error("描けない図");
    });
    expect(fine.get(), "通った仕事の結果").toBe(1);
    expect(() => failing.get(), "落ちた仕事を読んだ件が、仕事の名前と理由を挙げて落ちない").toThrow(/落ちる仕事[\s\S]*描けない図/u);
    const later = await tool.atLoad("後で落ちる仕事", () => Promise.reject(new Error("書き出せない")));
    expect(() => later.get(), "約束で落ちた仕事を読んだ件が、仕事の名前と理由を挙げて落ちない").toThrow(/後で落ちる仕事[\s\S]*書き出せない/u);
  });
});
