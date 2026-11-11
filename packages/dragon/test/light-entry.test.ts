/**
 * 図の種類の描く部品を後から読む軽い入口 (`@cardenelabs/dragon/light`、#3248)。
 *
 * 既定の入口は全ての種類を持ったまま、待たずに描ける。軽い入口は git、time、state、tree、lineup の部品を持たず、
 * `loadKind` を待った後に、既定の入口と同じ関数で同じ図を描く。
 * 読んでいない種類を描くと、その種類の名前を含む誤りで止まる。
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { casesNamed } from "./export-support";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES = join(ROOT, "examples");

/** 図の種類の置き場 (`src/kinds/<種類>/kind.ts`) から導いた種類と、そのうち後から読むと名乗る種類。種類を足しても手で並べ直さない (#3561) */
const KINDS_DIR = join(ROOT, "src/kinds");
const KIND_FILES = readdirSync(KINDS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({ name: entry.name, text: readFileSync(join(KINDS_DIR, entry.name, "kind.ts"), "utf8") }));
const ALL_KINDS = KIND_FILES.map((k) => k.name).sort();
const LATER_KINDS = KIND_FILES.filter((k) => /^\s*later: true,?$/mu.test(k.text))
  .map((k) => k.name)
  .sort();

interface Rendered {
  svg: string;
  timeline: { stills: number[] };
}
interface Entry {
  parseNotation(text: string): { ok: true; diagram: { kind?: string } } | { ok: false; errors: unknown[] };
  renderDiagram(diagram: unknown, options?: Record<string, unknown>): Rendered;
  chooseView(rendered: Rendered, width: number): { mode: string };
}
interface LightEntry extends Entry {
  loadKind(kind: string): Promise<void>;
  loadFor(source: unknown): Promise<void>;
}

const name = "@cardenelabs/dragon";
const importEntry = <T>(path: string): Promise<T | undefined> => (import(/* @vite-ignore */ path) as Promise<T>).catch(() => undefined);

/** 見本の記法の file。検査を見本ごとに分けるため、検査を組む時に読む (#3410) */
const DRAGON_FILES = readdirSync(EXAMPLES)
  .filter((file) => file.endsWith(".dragon"))
  .sort();

/** 見本の記法を読んだ図と、その種類 */
function example(entry: Entry, file: string): { file: string; kind: string; diagram: unknown } {
  const parsed = entry.parseNotation(readFileSync(join(EXAMPLES, file), "utf8"));
  expect(parsed.ok, `見本 ${file} の記法を読めない`).toBe(true);
  const diagram = parsed.ok ? parsed.diagram : {};
  return { file, kind: diagram.kind ?? "architecture", diagram };
}

/** 新しい Node を起こした回数。見本ごとに分けた件が子の Node を起こさないことを数える (#3580) */
let freshNodes = 0;

/** 新しい Node で軽い入口を読み、中で回した結果を受け取る。登録は読み込みごとに 1 度なので、読んでいない形は別の process でしか作れない */
function inFreshNode<T>(body: string): T {
  freshNodes++;
  const code = `const light = await import("${name}/light");\nconst out = {};\n${body}\nconsole.log(JSON.stringify(out));`;
  const stdout = execFileSync(process.execPath, ["--input-type=module", "-e", code], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(stdout) as T;
}

/** 拡大の範囲 (`zoom`) も節目 (`point`) も書かない時間軸の図。目盛りと印の列のブロックだけを使う */
const TIME_NO_ZOOM = "time 待ち時間\n\nscale 分 1min 10\nrow 作業\n\nstep 始める\n  say 作業を始める。\n  now -> 3\n";
/** 最初の段より前に線 (移れる道) を書いた状態遷移図。道の行は行の頭の語を持たず、線の形で脇道のブロックが読む */
const STATE_WITH_PATH = "state 注文\n\nbox 受付\nbox 発送\n\n受付 -> 発送\n\nstep 受け付ける\n  say 注文を受け付ける。\n  受付 -> 発送 : 送る\n";
/** 移れる道を書かない状態遷移図 */
const STATE_NO_PATH = "state 注文\n\nbox 受付\nbox 発送\n\nstep 受け付ける\n  say 注文を受け付ける。\n  受付 -> 発送 : 送る\n";

/** 後から読む種類ごとの見本の記法 */
const LATER_SAMPLES: Record<string, string> = {
  chart: "os-share.dragon",
  cycle: "eth-slot.dragon",
  er: "order-total.dragon",
  flow: "login-check.dragon",
  git: "rebase.dragon",
  lineup: "auction.dragon",
  pipe: "swap.dragon",
  state: "order.dragon",
  time: "finality.dragon",
  tree: "merkle.dragon",
  try: "tx-block.dragon",
};

/** 後から読む種類の原本の見本 (`.en.json` を除く JSON)。見本ごとの件を組む時に読む (#3580) */
const JSON_SAMPLES = readdirSync(EXAMPLES)
  .filter((file) => file.endsWith(".json") && !file.endsWith(".en.json"))
  .sort()
  .map((file) => ({ file, source: JSON.parse(readFileSync(join(EXAMPLES, file), "utf8")) as { kind?: string } }))
  .filter(({ source }) => Object.keys(LATER_SAMPLES).includes(source.kind ?? ""));

/** 同じ process で読み直す軽い入口 (#3580) */
interface FreshLight {
  LATER_BLOCKS: readonly string[];
  blockLoaded(block: string): boolean;
  loadKind(kind: string): Promise<void>;
}

/**
 * 読み込みの記録を消して (`vi.resetModules`) 軽い入口を読み直す (#3580)。
 * 製品の code は process 全体に残る状態を持たないので、読み直すと後から読む個別ブロックを 1 つも読んでいない状態から始まる。
 * 子の Node を起こすと、混んだ機械で起こすだけで 1 秒を超えうる
 */
async function freshLight<T extends FreshLight>(): Promise<T> {
  vi.resetModules();
  return (await import(/* @vite-ignore */ `${name}/light`)) as T;
}

/** 見本ごとの件が使う軽い入口の関数 */
interface CaseLight extends FreshLight {
  loadFor(source: unknown): Promise<void>;
  diagramKind(source: unknown): string;
  printNotation(diagram: unknown): string;
  parseNotation(text: string): { ok: true; diagram: unknown } | { ok: false; errors: { message: string }[] };
  renderDiagram(diagram: unknown): { svg: string };
}

/** 見本ごとの件が比べる既定の入口 */
interface WholeEntry {
  parseNotation(text: string): { ok: true; diagram: unknown } | { ok: false; errors: unknown[] };
  renderDiagram(diagram: unknown): { svg: string };
  printNotation(diagram: unknown): string;
  blockKinds(block: string): string[];
}

let wholeLoading: Promise<WholeEntry> | undefined;
/** 既定の入口。件ごとに軽い入口を読み直しても、比べる既定の入口は file で 1 度だけ読む */
function wholeEntry(): Promise<WholeEntry> {
  wholeLoading ??= import(/* @vite-ignore */ name) as Promise<WholeEntry>;
  return wholeLoading;
}

/** 読めなかった記法の最初の誤りの文 */
const messageOf = (parsed: { ok: false; errors: { message: string }[] }): string => parsed.errors[0]?.message ?? "";

/** 読んでいた後から読む個別ブロック */
const loadedOf = (light: FreshLight): string[] => light.LATER_BLOCKS.filter((block) => light.blockLoaded(block)).sort();

interface Loaded {
  loaded: string[];
  parsed?: boolean | string;
  [key: string]: unknown;
}

/** 新しい Node で `body` を回し、回した後に読んだ後から読む個別ブロックを `out.loaded` に入れて返す */
function loadedAfter(body: string): Loaded | undefined {
  try {
    return inFreshNode<Loaded>(`${body}\nout.loaded = light.LATER_BLOCKS.filter((block) => light.blockLoaded(block)).sort();`);
  } catch {
    return undefined;
  }
}

/** 原本の形の検査を読んだかを返す式。関数がまだ無い時は "missing" (#3400) */
const VALIDATOR_LOADED = `typeof light.validatorLoaded === "function" ? light.validatorLoaded() : "missing"`;

/** 見本や種類を 1 件の中で回していた 4 つの検査。見本ごとの件に分ける (#3580) */
const SPLIT = ["light-load-for-reads-every-later-example", "light-load-for-reads-json-blocks", "light-load-kind-reads-kind-blocks", "light-entry-finds-lines-read-by-shape"];

/** 分けた件ごとに、子の Node を起こした回数 (#3580) */
const spawned = new Map<string, number>();
let nodesAtStart = 0;
beforeEach(() => {
  nodesAtStart = freshNodes;
});
afterEach(({ task }) => {
  if (SPLIT.includes(task.name)) spawned.set(`${task.suite?.name ?? ""} > ${task.name}`, freshNodes - nodesAtStart);
});

/** 時系列図の入門の見本。後から読む種類の部品を要らない */
const INTRO = readFileSync(join(EXAMPLES, "intro.dragon"), "utf8");

describe("記法から読んだ図は描く時の検査を省く (#3400)", () => {
  it("light-draws-parsed-without-validator", async () => {
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const out = inFreshNode<{ svg?: string; error?: string; validator: unknown }>(`
      const text = ${JSON.stringify(INTRO)};
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      try { out.svg = light.renderDiagram(parsed.diagram).svg; } catch (e) { out.error = e.message; }
      out.validator = ${VALIDATOR_LOADED};
    `);
    expect(out.error, "記法から読んだ図を軽い入口で描けない").toBeUndefined();
    const parsed = whole.parseNotation(INTRO);
    expect(out.svg, "軽い入口で描いた SVG が既定の入口と違う").toBe(parsed.ok ? whole.renderDiagram(parsed.diagram).svg : "");
    // 記法から読んだ図を描くだけの頁は、原本の形の検査を 1 度も読まない
    expect(out.validator, "記法から読んだ図を描いた後に、原本の形の検査を読んでいた").toBe(false);
  });

  it("light-refuses-json-before-validator", async () => {
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const parsed = whole.parseNotation(INTRO);
    const json = JSON.stringify(parsed.ok ? parsed.diagram : {});
    const out = inFreshNode<{ svg?: string; error?: string; validator: unknown }>(`
      try { out.svg = light.renderDiagram(JSON.parse(${JSON.stringify(json)})).svg; } catch (e) { out.error = e.message; }
      out.validator = ${VALIDATOR_LOADED};
    `);
    expect(out.svg, "loadFor を待たずに原本の JSON を描けた (検査を通していない)").toBeUndefined();
    expect(out.error ?? "", "原本の形の検査を読んでいないことを名指さない").toMatch(/schema check.*loadFor|loadFor.*schema check/u);
  });

  it("light-load-for-json-reads-validator", async () => {
    const whole = await importEntry<Entry & { readDiagram(input: unknown): unknown }>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const parsed = whole.parseNotation(INTRO);
    const diagram = JSON.parse(JSON.stringify(parsed.ok ? parsed.diagram : {})) as { blocks: { box: { icon?: string }[] } };
    const bad = structuredClone(diagram);
    (bad.blocks.box[0] as { icon?: string }).icon = "usr";
    const out = inFreshNode<{ svg?: string; error?: string; read?: unknown; validator: unknown }>(`
      const json = JSON.parse(${JSON.stringify(JSON.stringify(diagram))});
      const bad = JSON.parse(${JSON.stringify(JSON.stringify(bad))});
      await light.loadFor(json);
      await light.loadFor(bad);
      out.validator = ${VALIDATOR_LOADED};
      try { out.svg = light.renderDiagram(json).svg; } catch (e) { out.error = e.message; }
      out.read = light.readDiagram(bad);
    `);
    expect(out.validator, "loadFor に原本の JSON を渡して待った後に、原本の形の検査を読んでいない").toBe(true);
    expect(out.error, "loadFor を待った後に原本の JSON を描けない").toBeUndefined();
    expect(out.svg, "軽い入口で原本の JSON を描いた SVG が既定の入口と違う").toBe(whole.renderDiagram(diagram).svg);
    // 知らないアイコン名の誤りは、既定の入口と同じ欄と文で返す
    expect(out.read, "軽い入口で読んだ原本の誤りが既定の入口と違う").toEqual(whole.readDiagram(bad));
  });
});

/**
 * 新しい Node で jsdom の頁に試す図の見本を置き、読み手が値を送ってブロックを作る釦を押す式。
 * `out.mounted`、`out.steps` (置いた時、送った後、押した後の原本の段の数)、`out.refused` (帯が出した断りの訳)、`out.error` を入れる。
 * `source` は図を作る式で、`text` (見本の記法) を読める
 */
/** 試す図の見本の記法 */
const TRY_EXAMPLE = readFileSync(join(EXAMPLES, "tx-block.dragon"), "utf8");

function tryOnPage(source: string): string {
  return `
    const { JSDOM } = await import("jsdom");
    const dom = new JSDOM("<!doctype html><html><body><div id=host></div></body></html>", { pretendToBeVisual: true });
    for (const key of ["window", "document", "Node", "Element", "HTMLElement", "SVGElement", "Event", "MouseEvent", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) globalThis[key] ??= key === "window" ? dom.window : dom.window[key];
    const host = dom.window.document.getElementById("host");
    const text = ${JSON.stringify(TRY_EXAMPLE)};
    const steps = (player) => (player.diagram?.steps ?? []).length;
    const set = (field, value) => {
      const input = host.querySelector('form[data-dragon="ask"] input[data-field="' + field + '"]');
      input.value = value;
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    };
    let player;
    try {
      const diagram = await (async () => { ${source} })();
      player = light.mountDiagram(host, diagram, { lang: "ja" });
      out.mounted = true;
      out.steps = [steps(player)];
      for (const [field, value] of Object.entries({ 送り手: "Dan", 宛先: "Bob", 量: "4", 手数料: "11" })) set(field, value);
      host.querySelector('button[data-dragon="send"]').click();
      out.steps.push(steps(player));
      host.querySelector('button[data-dragon="press"][data-press="ブロックを作る"]').click();
      out.steps.push(steps(player));
      out.refused = host.querySelector('[data-dragon="reason"]')?.textContent ?? "";
    } catch (e) { out.error = e.message; }
    out.validator = ${VALIDATOR_LOADED};
    // 流す動きと頁の時計が残ると process が終わらないので、片付けて頁を閉じる
    player?.destroy();
    dom.window.close();
  `;
}

describe("記法から読んだ試す図は、置いた後に写した図も検査を省く (#3416)", () => {
  it("light-mounts-parsed-try-without-validator", () => {
    // 試す図は書き手の最初の段だけを持つ図を写して置き、押すたびに段を足した図を写して描き直す。写した図も記法から読んだ図として描く
    const out = inFreshNode<{ mounted?: boolean; steps?: number[]; refused?: string; error?: string; validator: unknown }>(
      tryOnPage(`await light.loadFor(text); const parsed = light.parseNotation(text); return parsed.diagram;`),
    );
    expect(out.error, "記法から読んだ試す図を軽い入口で置けない").toBeUndefined();
    expect(out.mounted).toBe(true);
    expect(out.steps, "置いた後、値を送るたびとブロックを作るたびに段が 1 つずつ増えない").toEqual([1, 2, 3]);
    expect(out.refused ?? "", "読み手の操作を断った").not.toMatch(/schema check/u);
    expect(out.validator, "記法から読んだ試す図を置いて操作した後に、原本の形の検査を読んでいた").toBe(false);
  });

  it("light-refuses-json-try-before-validator", async () => {
    // 原本の JSON から作った試す図は印を持たないので、今どおり loadFor を待つよう示して止まる
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const parsed = whole.parseNotation(TRY_EXAMPLE);
    const json = JSON.stringify(parsed.ok ? parsed.diagram : {});
    const out = inFreshNode<{ mounted?: boolean; error?: string; validator: unknown }>(
      // loadKind と原本の JSON を渡した loadFor は検査も読むので、記法を渡した loadFor で試す図の部品だけを読む
      tryOnPage(`await light.loadFor(text); return JSON.parse(${JSON.stringify(json)});`),
    );
    expect(out.mounted, "loadFor を待たずに原本の JSON の試す図を置けた (検査を通していない)").toBeUndefined();
    expect(out.error ?? "", "原本の形の検査を読んでいないことを名指さない").toMatch(/schema check.*loadFor|loadFor.*schema check/u);
  });
});

/** 宣言と段を省いた時系列図 (#3438)。箱は線に出た名前から、段は線 1 本ずつから導く */
const SHORT = "sequence\n\nブラウザ -> アプリ: GET /login\nアプリ -> ブラウザ: 認可の頁へ送る\n";
/** 箱の行に Tabler の石の橋を書いた構成図。共有の橋のブロックの絵柄と比べる相手 (#3489) */
const BRIDGE_ICON_BOX = "architecture 橋\n\nbox eth as Ethereum\nbox cc as 橋 [icon: tabler:building-bridge-2]\n\nstep 送る\n  say Ethereum が橋へ送る。\n  eth -> cc: 送る\n";
/** 既定の入口で描いた SVG の箱の絵柄 (`dg-gl`) の path の d */
const glyphDs = (svg: string): string[] => [...svg.matchAll(/<path class="dg-gl" [^>]*\bd="([^"]*)"/gu)].map((match) => match[1] ?? "");
/** 定義に Tabler の絵柄を書いた構成図 (#3489) */
const BLOCK_ICON = "architecture 橋\n\nblocks 1\nblock +span\n  base box\n  icon tabler:building-bridge-2\nend\n\nbox eth as Ethereum\n+span cc as 橋\n\nstep 送る\n  say Ethereum が橋へ送る。\n  eth -> cc: 送る\n";
/** 絵柄集を読んだかを返す式 */
const TABLER_LOADED = `light.iconSetLoaded("tabler")`;
/** 図の頭に定義を書かずに共有のブロックを使う構成図 */
const SHARED_BLOCK = "architecture 橋\n\nbox eth as Ethereum\n+bridge cc as 橋\n\nstep 送る\n  say Ethereum が橋へ送る。\n  eth -> cc: 送る\n";

describe("宣言と段を省いた短い記法 (#3438)", () => {
  it("light-draws-short-notation", async () => {
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const out = inFreshNode<{ ok?: boolean; svg?: string; error?: string; validator: unknown }>(`
      const text = ${JSON.stringify(SHORT)};
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      out.ok = parsed.ok;
      try { out.svg = light.renderDiagram(parsed.diagram).svg; } catch (e) { out.error = e.message; }
      out.validator = ${VALIDATOR_LOADED};
    `);
    expect(out.ok, "軽い入口が短い記法を読めない").toBe(true);
    expect(out.error, "短い記法から読んだ図を軽い入口で描けない").toBeUndefined();
    const parsed = whole.parseNotation(SHORT);
    expect(parsed.ok, "既定の入口が短い記法を読めない").toBe(true);
    expect(out.svg, "軽い入口で描いた SVG が既定の入口と違う").toBe(parsed.ok ? whole.renderDiagram(parsed.diagram).svg : "");
    // 短い記法の図も記法から読んだ図なので、原本の形の検査を読まない (#3400)
    expect(out.validator, "短い記法の図を描いた後に、原本の形の検査を読んでいた").toBe(false);
  });

  it("light-draws-shared-block", async () => {
    // 図の頭に定義を書かない共有のブロック (`+bridge`) を、軽い入口も既定の入口と同じ図に描く (#3455)
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const out = inFreshNode<{ ok?: boolean; svg?: string; error?: string }>(`
      const text = ${JSON.stringify(SHARED_BLOCK)};
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      out.ok = parsed.ok;
      if (!parsed.ok) out.error = JSON.stringify(parsed.errors);
      else try { out.svg = light.renderDiagram(parsed.diagram).svg; } catch (e) { out.error = e.message; }
    `);
    expect(out.ok, `軽い入口が共有のブロックを使う図を読めない ${out.error ?? ""}`).toBe(true);
    expect(out.error, "共有のブロックを使う図を軽い入口で描けない").toBeUndefined();
    // 共有の橋は石の橋の絵柄を持つ角丸の箱 (#3489)。軽い入口は絵柄集の表を読んでから描く
    const plain = whole.parseNotation(BRIDGE_ICON_BOX);
    const [bridge] = plain.ok ? glyphDs(whole.renderDiagram(plain.diagram).svg) : [];
    expect(bridge, "既定の入口で箱の行に書いた石の橋が描かれない").toBeDefined();
    expect(glyphDs(out.svg ?? ""), "軽い入口が共有の橋の石の橋の絵柄を描かない").toContain(bridge);
    const parsed = whole.parseNotation(SHARED_BLOCK);
    expect(parsed.ok, "既定の入口が共有のブロックを使う図を読めない").toBe(true);
    expect(out.svg, "軽い入口で描いた SVG が既定の入口と違う").toBe(parsed.ok ? whole.renderDiagram(parsed.diagram).svg : "");
  });

  it("light-loads-tabler-for-block-icon", () => {
    const out = inFreshNode<{ before: unknown; after: unknown }>(`
      out.before = ${TABLER_LOADED};
      await light.loadFor(${JSON.stringify(BLOCK_ICON)});
      out.after = ${TABLER_LOADED};
    `);
    expect(out.before, "読む前から絵柄集を持つ").toBe(false);
    expect(out.after, "定義に Tabler の絵柄を持つ図の loadFor が絵柄集を読まない").toBe(true);
  });

  it("light-refuses-block-icon-before-load", () => {
    const out = inFreshNode<{ result: string; loaded: unknown }>(`
      // 構成図の部品は最初から在るので、loadFor を待たずに読んで描く
      const parsed = light.parseNotation(${JSON.stringify(SHARED_BLOCK)});
      if (!parsed.ok) out.result = "読めない: " + parsed.errors.map((e) => e.message).join(" / ");
      else {
        try { out.result = light.renderDiagram(parsed.diagram).svg ? "描けた" : "空"; } catch (e) { out.result = "描けない: " + e.message; }
      }
      out.loaded = ${TABLER_LOADED};
    `);
    expect(out.loaded, "loadFor を待っていないのに絵柄集を読んだ").toBe(false);
    expect(out.result, "loadFor の前に共有の橋の図を描けた").not.toBe("描けた");
    expect(out.result, "誤りの文が絵柄集の名前を言わない").toMatch(/tabler/iu);
    expect(out.result, "誤りの文が loadFor を待つよう言わない").toContain("loadFor");
  });
});


describe("書いた図が使う個別ブロックだけを読む軽い入口 (#3349)", () => {
  it("light-entry-loads-only-used-blocks", () => {
    const out = loadedAfter(`
      out.before = light.LATER_BLOCKS.filter((block) => light.blockLoaded(block));
      const text = ${JSON.stringify(TIME_NO_ZOOM)};
      out.kind = light.diagramKind(text);
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      out.parsed = parsed.ok ? true : parsed.errors[0].message;
      try { light.renderDiagram(parsed.diagram); out.drawn = true; } catch (e) { out.drawn = e.message; }
    `);
    expect(out, "軽い入口を新しい Node で読めない").toBeDefined();
    if (!out) return;
    expect(out.before, "何も読む前に読んでいた後から読む個別ブロック").toEqual([]);
    expect(out.kind, "読む前に引いた記法の図の種類").toBe("time");
    expect(out.loaded, "拡大の範囲を書かない時間軸の図で読んだ個別ブロック").toEqual(["row", "scale"]);
    expect(out.parsed, "読んだ後に記法を読めない").toBe(true);
    expect(out.drawn, "読んだ後に図を描けない").toBe(true);
  });

  /** 記法の見本ごとに 1 件。1 件の中で全ての見本を回すと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3580) */
  describe.for(Object.keys(LATER_SAMPLES))("%s", (kind) => {
    it("light-load-for-reads-every-later-example", async () => {
      const whole = await wholeEntry();
      const file = LATER_SAMPLES[kind] as string;
      const text = readFileSync(join(EXAMPLES, file), "utf8");
      const light = await freshLight<CaseLight>();
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      expect(parsed.ok ? true : messageOf(parsed), `${file} を loadFor の後に読めない`).toBe(true);
      const expected = whole.parseNotation(text);
      expect(parsed.ok ? light.renderDiagram(parsed.diagram).svg : "", `${file} を軽い入口で描いた SVG が既定の入口と違う`).toBe(expected.ok ? whole.renderDiagram(expected.diagram).svg : "");
      const loaded = loadedOf(light);
      expect(loaded.length, `${file} で読んだ個別ブロックが無い (走査の空振り)`).toBeGreaterThan(0);
      expect(
        loaded.filter((block) => !whole.blockKinds(block).includes(kind)),
        `${file} (${kind}) で読んだ、ほかの種類の個別ブロック`,
      ).toEqual([]);
    });
  });

  it("light-load-readings-leaves-renderer-out", () => {
    const out = loadedAfter(`
      const text = ${JSON.stringify(TIME_NO_ZOOM)};
      await light.loadReadings(text);
      const parsed = light.parseNotation(text);
      out.parsed = parsed.ok ? true : parsed.errors[0].message;
      out.kindLoaded = light.kindLoaded("time");
      try { light.renderDiagram(parsed.diagram); out.drawn = "描けた"; } catch (e) { out.drawn = e.message; }
    `);
    expect(out, "軽い入口を新しい Node で読めない").toBeDefined();
    if (!out) return;
    expect(out.parsed, "ブロックの読み方だけを読んだ後に記法を読めない").toBe(true);
    expect(out.loaded, "ブロックの読み方だけを読んだ時に読んだ個別ブロック").toEqual(["row", "scale"]);
    expect(out.kindLoaded, "ブロックの読み方だけを読んだのに、時間軸の図の描く部品を読んだ").toBe(false);
    expect(String(out.drawn), "描く部品を読まずに描いた時の誤り").toContain("time");
  });

  it("light-parse-names-unloaded-block", () => {
    const out = loadedAfter(`
      const first = (text) => { const parsed = light.parseNotation(text); return parsed.ok ? "読めた" : parsed.errors[0].message; };
      out.time = first(${JSON.stringify(TIME_NO_ZOOM)});
      out.before = light.LATER_BLOCKS.filter((block) => light.blockLoaded(block));
      // 状態遷移図の決まりを持つブロックだけを読んでから、移れる道 (線の形で脇道のブロックが読む行) を持つ図を読む
      await light.loadFor(${JSON.stringify(STATE_NO_PATH)});
      out.path = first(${JSON.stringify(STATE_WITH_PATH)});
    `);
    expect(out, "軽い入口を新しい Node で読めない").toBeDefined();
    if (!out) return;
    // 読んでいない個別ブロックの行を読むと、黙って別の行と読まず、ブロックの名前と待つ関数を名指して止める
    expect(out.time, "目盛りのブロックを読む前に時間軸の図を読んだ時の誤り").toContain("scale");
    expect(out.time, "目盛りのブロックを読む前に時間軸の図を読んだ時の誤り").toContain("loadFor");
    expect(out.path, "脇道のブロックを読む前に移れる道を読んだ時の誤り").toContain("side-path");
    expect(out.before, "読む前に読んでいた個別ブロック").toEqual([]);
    expect(out.loaded, "移れる道の無い状態遷移図で読んだ個別ブロック").not.toContain("side-path");
  });

  /** 後から読む種類の原本の見本ごとに 1 件。原本から引く個別ブロックが記法から引く物より少ないと、書き戻した字が既定の入口と食い違うか、書き戻した記法を読めない (#3580) */
  describe.for(JSON_SAMPLES)("$file", ({ file, source }) => {
    it("light-load-for-reads-json-blocks", async () => {
      const whole = await wholeEntry();
      const light = await freshLight<CaseLight>();
      // 軽い入口には写しを渡す。子の Node で回していた時と同じく、既定の入口と同じ原本の物を触らせない
      const given = structuredClone(source);
      expect(light.diagramKind(given), `${file} を読む前に引いた原本の図の種類`).toBe(source.kind);
      await light.loadFor(given);
      let printed: string;
      try {
        printed = light.printNotation(given);
      } catch (error) {
        printed = (error as Error).message;
      }
      expect(printed, `${file} を loadFor に渡した後に記法へ書き戻した字`).toBe(whole.printNotation(source));
      const again = light.parseNotation(printed);
      expect(again.ok ? true : messageOf(again), `${file} を書き戻した記法を、続けて読めない`).toBe(true);
      let svg: string;
      try {
        svg = light.renderDiagram(given).svg;
      } catch (error) {
        svg = (error as Error).message;
      }
      expect(svg, `${file} を loadFor に渡した後に描いた SVG`).toBe(whole.renderDiagram(source).svg);
      expect(
        loadedOf(light).filter((block) => !whole.blockKinds(block).includes(source.kind ?? "")),
        `${file} (${source.kind}) で読んだ、ほかの種類の個別ブロック`,
      ).toEqual([]);
    });
  });

  /** 後から読む種類ごとに 1 件 (#3580) */
  describe.for(Object.keys(LATER_SAMPLES))("%s", (kind) => {
    it("light-load-kind-reads-kind-blocks", async () => {
      const whole = await wholeEntry();
      const file = LATER_SAMPLES[kind] as string;
      const light = await freshLight<CaseLight>();
      await light.loadKind(kind);
      const parsed = light.parseNotation(readFileSync(join(EXAMPLES, file), "utf8"));
      const own = light.LATER_BLOCKS.filter((block) => whole.blockKinds(block).includes(kind)).sort();
      expect(own.length, `${kind} だけの後から読む個別ブロックが無い (走査の空振り)`).toBeGreaterThan(0);
      expect(loadedOf(light), `loadKind("${kind}") の後に読んでいた個別ブロック`).toEqual(own);
      expect(parsed.ok ? true : messageOf(parsed), `loadKind("${kind}") の後に ${file} を読めない`).toBe(true);
    });
  });

  // 移れる道の行は行の頭の語を持たず、最初の段より前の線の形で脇道のブロックが読む。書いた図と書かない図を 1 件ずつ (#3580)
  describe.for([
    { name: "移れる道を書いた状態遷移図", text: STATE_WITH_PATH, side: true },
    { name: "移れる道を書かない状態遷移図", text: STATE_NO_PATH, side: false },
  ])("$name", ({ name: drawn, text, side }) => {
    it("light-entry-finds-lines-read-by-shape", async () => {
      const light = await freshLight<CaseLight>();
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      expect(loadedOf(light).includes("side-path"), `${drawn}で脇道の個別ブロックを読んだか`).toBe(side);
      expect(parsed.ok ? true : messageOf(parsed), `${drawn}を loadFor の後に読めない`).toBe(true);
    });
  });
});

describe("見本ごとに分けた軽い入口の件 (#3580)", () => {
  it("light-fresh-entry-starts-empty", async () => {
    const first = await freshLight();
    await first.loadKind("pipe");
    expect(loadedOf(first).length, "配管の図の種類を読んだ後に読んでいた個別ブロック (走査の空振り)").toBeGreaterThan(0);
    const again = await freshLight();
    expect(loadedOf(again), "読み込みの記録を消して読み直した後に読んでいた個別ブロック").toEqual([]);
  });

  it("light-json-samples-found", async () => {
    // 原本の `blocks` の欄の鍵は、ブロックの名前か定義の `fields` で持ち主を引く。試す図の部品 (`part`) は部品の種類ごとに引くので除く
    const { BLOCKS } = (await import("../src/blocks/index")) as unknown as { BLOCKS: Record<string, { name: string; fields?: readonly string[] }> };
    const schema = JSON.parse(readFileSync(join(ROOT, "src/schemas/diagram.schema.json"), "utf8")) as { properties: { blocks: { properties: Record<string, unknown> } } };
    const owned = new Set(Object.values(BLOCKS).flatMap((block) => [block.name, ...(block.fields ?? [])]));
    const keys = Object.keys(schema.properties.blocks.properties);
    expect(keys.length, "原本の blocks の欄の数 (走査の空振り)").toBeGreaterThan(0);
    expect(keys.filter((key) => key !== "part" && !owned.has(key)), "持ち主のブロックを引けない原本の blocks の欄").toEqual([]);
    // 見本ごとの件は、見本が 0 件の種類では 1 件も組まれず素通りするので、どの後から読む種類も原本の見本を持つことをここで確かめる
    expect([...new Set(JSON_SAMPLES.map(({ source }) => source.kind))].sort(), "原本の見本を持つ後から読む種類").toEqual(Object.keys(LATER_SAMPLES).sort());
  });

  it("light-load-for-reads-zoom-block", async () => {
    const light = await freshLight<CaseLight>();
    await light.loadFor(JSON.parse(readFileSync(join(EXAMPLES, "finality.json"), "utf8")));
    expect(loadedOf(light), "拡大の範囲を持つ原本で読んだ個別ブロック").toContain("zoom");
  });

  it("light-entry-cases-follow-samples", ({ task }) => {
    const kinds = Object.keys(LATER_SAMPLES).sort();
    expect(casesNamed(task.file, "light-load-for-reads-json-blocks").sort(), "原本の見本ごとの件").toEqual(JSON_SAMPLES.map(({ file }) => file));
    expect(casesNamed(task.file, "light-load-for-reads-every-later-example").sort(), "記法の見本ごとの件").toEqual(kinds);
    expect(casesNamed(task.file, "light-load-kind-reads-kind-blocks").sort(), "種類ごとの件").toEqual(kinds);
    expect(casesNamed(task.file, "light-entry-finds-lines-read-by-shape"), "線の形で読む件").toHaveLength(2);
  });
});

describe("図の種類の部品を後から読む軽い入口 (#3248)", () => {
  it("light-entry-samples-cover-kinds", async () => {
    // 見本ごとの SVG の一致は下の見本ごとの検査が持つ。ここではどの種類も見本を持つ (走査が空振りしていない) ことを確かめる
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    expect([...new Set(DRAGON_FILES.map((file) => example(whole, file).kind))].sort(), "見本が描く種類").toEqual(ALL_KINDS);
  });

  it("light-entry-refuses-unloaded-kind", () => {
    let out: { refused: Record<string, string[]>; kept: string[]; loaded: string[] } | undefined;
    try {
      out = inFreshNode(`
        const fs = await import("node:fs");
        // 記法を読むには個別ブロックの読み方が要るので (#3349)、描く部品だけを確かめるよう原本を読む
        const read = (file) => JSON.parse(fs.readFileSync(new URL("./examples/" + file, "file://${ROOT}/"), "utf8"));
        const later = { chart: "os-share.json", cycle: "eth-slot.json", er: "order-total.json", flow: "login-check.json", git: "rebase.json", lineup: "auction.json", pipe: "swap.json", state: "order.json", time: "finality.json", tree: "merkle.json", try: "tx-block.json" };
        const kept = { sequence: "api.json", architecture: "ccip.json" };
        const host = { ownerDocument: { defaultView: null } };
        const message = (run) => { try { run(); return "描けた"; } catch (e) { return e.message; } };
        out.refused = {}; out.kept = []; out.loaded = [];
        // 原本の JSON を描くには原本の形の検査が要るので (#3400)、先に検査だけを読み、描く部品が無い時の誤りを確かめる
        await light.loadValidator();
        for (const [kind, file] of Object.entries(later)) {
          const diagram = read(file);
          out.refused[kind] = [message(() => light.renderDiagram(diagram)), message(() => light.mountDiagram(host, diagram))];
          await light.loadKind(kind);
          if (message(() => light.renderDiagram(diagram)) === "描けた") out.loaded.push(kind);
        }
        for (const [kind, file] of Object.entries(kept)) if (message(() => light.renderDiagram(read(file))) === "描けた") out.kept.push(kind);
      `);
    } catch {
      out = undefined;
    }
    expect(out, "軽い入口を新しい Node で読めない").toBeDefined();
    if (!out) return;
    for (const kind of LATER_KINDS) {
      for (const message of out.refused[kind] ?? []) expect(message, `読んでいない ${kind} を描いた時の誤り`).toContain(kind);
    }
    expect(out.loaded, "loadKind を待った後に描けた種類").toEqual(LATER_KINDS);
    expect(out.kept, "loadKind を呼ばずに描けた種類").toEqual(["sequence", "architecture"]);
  });

  it("full-entry-reads-every-block", async () => {
    const whole = await importEntry<Entry & { printNotation(diagram: unknown): string }>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    // 既定の入口は読み込みを待たずに、どの種類の記法も読み、どの原本も記法へ書き戻す
    const files = readdirSync(EXAMPLES).filter((file) => file.endsWith(".json"));
    expect(files.length, "見本の原本の数").toBeGreaterThan(0);
    for (const file of files) {
      const printed = whole.printNotation(JSON.parse(readFileSync(join(EXAMPLES, file), "utf8")));
      expect(whole.parseNotation(printed).ok, `${file} を書き戻した記法を既定の入口で読めない`).toBe(true);
    }
  });

  it("default-entry-draws-every-kind", async () => {
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const samples = DRAGON_FILES.map((file) => example(whole, file));
    expect([...new Set(samples.map((s) => s.kind))].sort(), "見本が描く種類").toEqual(ALL_KINDS);
    for (const { file, diagram } of samples) {
      // bitsumi と同じ呼び方。読んだ後に待たずに続けて描き、SVG と段の時刻と見せ方を読む
      const rendered = whole.renderDiagram(diagram, { palette: "night", theme: "dark", still: true });
      expect(rendered.svg, `${file} の SVG`).toContain('data-dragon="figure"');
      expect(rendered.timeline.stills.length, `${file} の段の時刻`).toBeGreaterThan(0);
      expect(["fixed", "follow"], `${file} の見せ方`).toContain(whole.chooseView(rendered, 1280).mode);
    }
  });
});

/** 全ての見本を 1 件で描くと、混んだ機械で 1 件の上限 (10 秒) を超えたので、見本ごとに分ける (#3410) */
describe.for(DRAGON_FILES)("軽い入口と既定の入口の SVG (#3248) %s", (file) => {
  it("light-entry-draws-same-svg", async () => {
    const light = await importEntry<LightEntry>(`${name}/light`);
    expect(light, "軽い入口を読めない").toBeDefined();
    if (!light) return;
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const { kind, diagram } = example(whole, file);
    await light.loadKind(kind);
    // 絵柄集 Tabler の表は種類を読む関数では読まず、loadFor が読む (#3493)。表を使う見本 (橋の見本、#3489) だけ loadFor も待つ
    if (JSON.stringify(diagram).includes('"tabler:')) await light.loadFor(diagram);
    for (const options of [{}, { theme: "dark", still: true, lang: "en" }])
      expect(light.renderDiagram(diagram, options).svg, `${file} (${JSON.stringify(options)}) を軽い入口で描いた SVG が既定の入口と違う`).toBe(whole.renderDiagram(diagram, options).svg);
  });
});

describe("見本ごとに分けた件が子の Node を起こさない (#3580)", () => {
  // このfileの最後の件として、分けた件が起こした子の Node を数える
  it("light-split-cases-start-no-node", () => {
    expect([...new Set([...spawned.keys()].map((key) => key.split(" > ").pop()))].sort(), "子の Node を数えた検査").toEqual([...SPLIT].sort());
    expect(
      [...spawned].filter(([, count]) => count > 0).map(([key, count]) => `${key}: ${count}`),
      "子の Node を起こした件",
    ).toEqual([]);
  });
});
