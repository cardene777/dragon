/**
 * 図の種類の描く部品を後から読む軽い入口 (`@cardenelabs/dragon/light`、#3248)。
 *
 * 既定の入口は全ての種類を持ったまま、待たずに描ける。軽い入口は git、time、state、tree、lineup の部品を持たず、
 * `loadKind` を待った後に、既定の入口と同じ関数で同じ図を描く。
 * 読んでいない種類を描くと、その種類の名前を含む誤りで止まる。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atLoad } from "./at-load";
import { casesNamed } from "./export-support";
import { KIND_FOLDERS } from "../src/kinds/index";
// 既定の入口 (`dist`) で全ての種類の図を描くので、全ての種類を読む助けの file に型だけでつなぐ (#3763)。
// 関係する検査を選ぶ命令は、どの種類の描く所を変えてもこの検査を選ぶ。型だけなので、検査の中で src を読み込まない
import type {} from "./all-kinds";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES = join(ROOT, "examples");

/** 図の種類の置き場 (`src/kinds/<種類>/kind.ts`) から導いた種類と、そのうち後から読むと名乗る種類。種類を足しても手で並べ直さない (#3561) */
const KINDS_DIR = join(ROOT, "src/kinds");
const KIND_FILES = readdirSync(KINDS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({ name: entry.name, text: readFileSync(join(KINDS_DIR, entry.name, "kind.ts"), "utf8") }));
const ALL_KINDS = KIND_FILES.map((k) => k.name).sort();
const fieldsOf = (kind: string): readonly string[] => (KIND_FOLDERS as Readonly<Record<string, { fields?: readonly string[] }>>)[kind]?.fields ?? [];
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
  cards: "note-transfer.dragon",
  checkout: "purchase-shoes.dragon",
  chart: "os-share.dragon",
  cycle: "eth-slot.dragon",
  er: "order-total.dragon",
  flow: "login-check.dragon",
  git: "rebase.dragon",
  lineup: "auction.dragon",
  matrix: "task-priority.dragon",
  mind: "budget-app.dragon",
  pipe: "swap.dragon",
  sankey: "token-allocation.dragon",
  state: "order.dragon",
  time: "finality.dragon",
  tree: "merkle.dragon",
  try: "tx-block.dragon",
  venn: "wallet-usage.dragon",
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

// 件ごとに新しい Node を起こすと、混んだ機械で 1 件 10 秒の上限を超えうる (#3816)。
// 件ごとの Node を file を読み込む段で 1 つずつ順に起こし、件はその結果を読む。子の Node に渡す原本は既定の入口で作る

/** 既定の入口。子の Node に渡す原本を作るので、読めない時は読み込む段の仕事を落とす */
async function wholeForNode<T extends Entry>(): Promise<T> {
  const whole = await importEntry<T>(name);
  if (!whole) throw new Error("既定の入口を読めない");
  return whole;
}

const PARSED_IN_NODE = await atLoad("記法から読んだ図を新しい Node の軽い入口で描く", () =>
  inFreshNode<{ svg?: string; error?: string; validator: unknown }>(`
      const text = ${JSON.stringify(INTRO)};
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      try { out.svg = light.renderDiagram(parsed.diagram).svg; } catch (e) { out.error = e.message; }
      out.validator = ${VALIDATOR_LOADED};
    `),
);

const JSON_BEFORE_VALIDATOR = await atLoad("原本の JSON を検査を読む前の新しい Node の軽い入口で描く", async () => {
  const whole = await wholeForNode<Entry>();
  const parsed = whole.parseNotation(INTRO);
  const json = JSON.stringify(parsed.ok ? parsed.diagram : {});
  return inFreshNode<{ svg?: string; error?: string; validator: unknown }>(`
      try { out.svg = light.renderDiagram(JSON.parse(${JSON.stringify(json)})).svg; } catch (e) { out.error = e.message; }
      out.validator = ${VALIDATOR_LOADED};
    `);
});

const JSON_AFTER_LOAD_FOR = await atLoad("原本の JSON を loadFor の後に新しい Node の軽い入口で描いて読む", async () => {
  const whole = await wholeForNode<Entry & { readDiagram(input: unknown): unknown }>();
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
  return { diagram, bad, out };
});

describe("記法から読んだ図は描く時の検査を省く (#3400)", () => {
  it("light-draws-parsed-without-validator", async () => {
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const out = PARSED_IN_NODE.get();
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
    const out = JSON_BEFORE_VALIDATOR.get();
    expect(out.svg, "loadFor を待たずに原本の JSON を描けた (検査を通していない)").toBeUndefined();
    expect(out.error ?? "", "原本の形の検査を読んでいないことを名指さない").toMatch(/schema check.*loadFor|loadFor.*schema check/u);
  });

  it("light-load-for-json-reads-validator", async () => {
    const whole = await importEntry<Entry & { readDiagram(input: unknown): unknown }>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const { diagram, bad, out } = JSON_AFTER_LOAD_FOR.get();
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

// 試す図を子の Node で置くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。file を読み込む段で済ませ、件はその結果を読む。
// 試す図は書き手の最初の段だけを持つ図を写して置き、押すたびに段を足した図を写して描き直す。写した図も記法から読んだ図として描く
const TRIED = await atLoad("記法から読んだ試す図を新しい Node で置く", () =>
  inFreshNode<{ mounted?: boolean; steps?: number[]; refused?: string; error?: string; validator: unknown }>(
    tryOnPage(`await light.loadFor(text); const parsed = light.parseNotation(text); return parsed.diagram;`),
  ),
);

// 原本の JSON から作った試す図も、同じく子の Node で置く仕事を file を読み込む段で済ませる (#3816)
const TRIED_JSON = await atLoad("原本の JSON から作った試す図を新しい Node で置く", async () => {
  const whole = await wholeForNode<Entry>();
  const parsed = whole.parseNotation(TRY_EXAMPLE);
  const json = JSON.stringify(parsed.ok ? parsed.diagram : {});
  return inFreshNode<{ mounted?: boolean; error?: string; validator: unknown }>(
    // loadKind と原本の JSON を渡した loadFor は検査も読むので、記法を渡した loadFor で試す図の部品だけを読む
    tryOnPage(`await light.loadFor(text); return JSON.parse(${JSON.stringify(json)});`),
  );
});

describe("記法から読んだ試す図は、置いた後に写した図も検査を省く (#3416)", () => {
  it("light-mounts-parsed-try-without-validator", () => {
    const out = TRIED.get();
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
    const out = TRIED_JSON.get();
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

// 件ごとに新しい Node を起こす仕事を、file を読み込む段で 1 つずつ順に済ませる (#3816)

const SHORT_IN_NODE = await atLoad("短い記法を新しい Node の軽い入口で描く", () =>
  inFreshNode<{ ok?: boolean; svg?: string; error?: string; validator: unknown }>(`
      const text = ${JSON.stringify(SHORT)};
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      out.ok = parsed.ok;
      try { out.svg = light.renderDiagram(parsed.diagram).svg; } catch (e) { out.error = e.message; }
      out.validator = ${VALIDATOR_LOADED};
    `),
);

const SHARED_IN_NODE = await atLoad("共有のブロックを使う図を新しい Node の軽い入口で描く", () =>
  inFreshNode<{ ok?: boolean; svg?: string; error?: string }>(`
      const text = ${JSON.stringify(SHARED_BLOCK)};
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      out.ok = parsed.ok;
      if (!parsed.ok) out.error = JSON.stringify(parsed.errors);
      else try { out.svg = light.renderDiagram(parsed.diagram).svg; } catch (e) { out.error = e.message; }
    `),
);

const BLOCK_ICON_IN_NODE = await atLoad("定義に Tabler の絵柄を持つ図を新しい Node の軽い入口で読む", () =>
  inFreshNode<{ before: unknown; after: unknown }>(`
      out.before = ${TABLER_LOADED};
      await light.loadFor(${JSON.stringify(BLOCK_ICON)});
      out.after = ${TABLER_LOADED};
    `),
);

const BLOCK_ICON_BEFORE_LOAD = await atLoad("loadFor の前に共有の橋の図を新しい Node の軽い入口で描く", () =>
  inFreshNode<{ result: string; loaded: unknown }>(`
      // 構成図の部品は最初から在るので、loadFor を待たずに読んで描く
      const parsed = light.parseNotation(${JSON.stringify(SHARED_BLOCK)});
      if (!parsed.ok) out.result = "読めない: " + parsed.errors.map((e) => e.message).join(" / ");
      else {
        try { out.result = light.renderDiagram(parsed.diagram).svg ? "描けた" : "空"; } catch (e) { out.result = "描けない: " + e.message; }
      }
      out.loaded = ${TABLER_LOADED};
    `),
);

describe("宣言と段を省いた短い記法 (#3438)", () => {
  it("light-draws-short-notation", async () => {
    const whole = await importEntry<Entry>(name);
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const out = SHORT_IN_NODE.get();
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
    const out = SHARED_IN_NODE.get();
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
    const out = BLOCK_ICON_IN_NODE.get();
    expect(out.before, "読む前から絵柄集を持つ").toBe(false);
    expect(out.after, "定義に Tabler の絵柄を持つ図の loadFor が絵柄集を読まない").toBe(true);
  });

  it("light-refuses-block-icon-before-load", () => {
    const out = BLOCK_ICON_BEFORE_LOAD.get();
    expect(out.loaded, "loadFor を待っていないのに絵柄集を読んだ").toBe(false);
    expect(out.result, "loadFor の前に共有の橋の図を描けた").not.toBe("描けた");
    expect(out.result, "誤りの文が絵柄集の名前を言わない").toMatch(/tabler/iu);
    expect(out.result, "誤りの文が loadFor を待つよう言わない").toContain("loadFor");
  });
});

// 件ごとに新しい Node を起こして読んだ個別ブロックを数える仕事を、file を読み込む段で 1 つずつ順に済ませる (#3816)

const USED_BLOCKS = await atLoad("拡大の範囲を書かない時間軸の図を新しい Node の軽い入口で読んで描く", () =>
  loadedAfter(`
      out.before = light.LATER_BLOCKS.filter((block) => light.blockLoaded(block));
      const text = ${JSON.stringify(TIME_NO_ZOOM)};
      out.kind = light.diagramKind(text);
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      out.parsed = parsed.ok ? true : parsed.errors[0].message;
      try { light.renderDiagram(parsed.diagram); out.drawn = true; } catch (e) { out.drawn = e.message; }
    `),
);

const READINGS_ONLY = await atLoad("ブロックの読み方だけを新しい Node の軽い入口で読む", () =>
  loadedAfter(`
      const text = ${JSON.stringify(TIME_NO_ZOOM)};
      await light.loadReadings(text);
      const parsed = light.parseNotation(text);
      out.parsed = parsed.ok ? true : parsed.errors[0].message;
      out.kindLoaded = light.kindLoaded("time");
      try { light.renderDiagram(parsed.diagram); out.drawn = "描けた"; } catch (e) { out.drawn = e.message; }
    `),
);

const UNLOADED_BLOCK = await atLoad("読んでいない個別ブロックの行を新しい Node の軽い入口で読む", () =>
  loadedAfter(`
      const first = (text) => { const parsed = light.parseNotation(text); return parsed.ok ? "読めた" : parsed.errors[0].message; };
      out.time = first(${JSON.stringify(TIME_NO_ZOOM)});
      out.before = light.LATER_BLOCKS.filter((block) => light.blockLoaded(block));
      // 状態遷移図の決まりを持つブロックだけを読んでから、移れる道 (線の形で脇道のブロックが読む行) を持つ図を読む
      await light.loadFor(${JSON.stringify(STATE_NO_PATH)});
      out.path = first(${JSON.stringify(STATE_WITH_PATH)});
    `),
);

describe("書いた図が使う個別ブロックだけを読む軽い入口 (#3349)", () => {
  it("light-entry-loads-only-used-blocks", () => {
    const out = USED_BLOCKS.get();
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
      expect(loaded.length + fieldsOf(kind).length, `${file} で読んだ個別ブロックが無い (走査の空振り)`).toBeGreaterThan(0);
      expect(
        loaded.filter((block) => !whole.blockKinds(block).includes(kind)),
        `${file} (${kind}) で読んだ、ほかの種類の個別ブロック`,
      ).toEqual([]);
    });
  });

  /**
   * 種類の検査が子の Node で 1 つずつ持っていた確かめ (`<種類>-light-entry-draws-after-load-for`) を、見本ごとの件にまとめる (#3763)。
   * 種類の検査が軽い入口を読むと、関係する検査を選ぶ命令が全ての種類の描く所を変えた時にその検査を選ぶため。
   * 後から読む種類の見本に、見た目を替える行 (`[shape: ...]`) の見本と色付きの絵柄の定義を持つ見本を足す。
   * 色付きの絵柄の見本は構成図で、構成図は軽い入口が最初から持つ
   */
  describe.for([
    ...Object.entries(LATER_SAMPLES).map(([kind, file]) => ({ name: kind, kind, file })),
    { name: "lineup [shape: stairs]", kind: "lineup", file: "video-publish.dragon" },
    { name: "cycle [shape: clock]", kind: "cycle", file: "focus-clock.dragon" },
    { name: "cycle [shape: band]", kind: "cycle", file: "farm-year.dragon" },
    { name: "sankey [shape: rows]", kind: "sankey", file: "day-hours.dragon" },
    { name: "sankey [shape: treemap]", kind: "sankey", file: "phone-storage.dragon" },
    { name: "matrix [shape: scatter]", kind: "matrix", file: "feature-scores.dragon" },
    { name: "chart [shape: dots]", kind: "chart", file: "device-dots.dragon" },
    { name: "architecture の色付きの絵柄", kind: "architecture", file: "photo-delivery.dragon" },
  ])("$name", ({ kind, file }) => {
    it("light-entry-draws-each-later-kind-after-load-for", async () => {
      const whole = await wholeEntry();
      expect(existsSync(join(EXAMPLES, file)), `${file} (${kind}) の見本がpackages/dragon/examplesに無い`).toBe(true);
      const text = readFileSync(join(EXAMPLES, file), "utf8");
      const light = await freshLight<CaseLight & { kindLoaded(kind: string): boolean }>();
      expect(light.kindLoaded(kind), `${file} の種類 (${kind}) を loadFor の前に読んでいたか`).toBe(!(kind in LATER_SAMPLES));
      await light.loadFor(text);
      expect(light.kindLoaded(kind), `${file} の種類 (${kind}) を loadFor の後に読んでいない`).toBe(true);
      const parsed = light.parseNotation(text);
      expect(parsed.ok ? true : messageOf(parsed), `${file} を loadFor の後に読めない`).toBe(true);
      const expected = whole.parseNotation(text);
      expect(parsed.ok ? light.renderDiagram(parsed.diagram).svg : "", `${file} を軽い入口で描いた SVG が既定の入口と違う`).toBe(expected.ok ? whole.renderDiagram(expected.diagram).svg : "");
    });
  });

  // 時系列図と構成図は軽い入口が最初から持ち、loadFor を待たずに描く (#3763)
  it("light-draws-sequence-and-architecture-without-load", async () => {
    const light = await freshLight<CaseLight & { kindLoaded(kind: string): boolean }>();
    const architecture = "architecture 橋\n\nbox eth as Ethereum\nbox cc as 橋\n\nstep 送る\n  say Ethereum が橋へ送る。\n  eth -> cc: 送る\n";
    for (const [kind, text] of [
      ["sequence", INTRO],
      ["architecture", architecture],
    ] as const) {
      expect(light.kindLoaded(kind), `${kind} を最初から持たない`).toBe(true);
      const parsed = light.parseNotation(text);
      expect(parsed.ok ? true : messageOf(parsed), `${kind} を待たずに読めない`).toBe(true);
      const svg = parsed.ok ? light.renderDiagram(parsed.diagram).svg : "";
      expect(svg, `${kind} を待たずに描けない`).toContain('data-dragon="figure"');
    }
  });

  it("light-load-readings-leaves-renderer-out", () => {
    const out = READINGS_ONLY.get();
    expect(out, "軽い入口を新しい Node で読めない").toBeDefined();
    if (!out) return;
    expect(out.parsed, "ブロックの読み方だけを読んだ後に記法を読めない").toBe(true);
    expect(out.loaded, "ブロックの読み方だけを読んだ時に読んだ個別ブロック").toEqual(["row", "scale"]);
    expect(out.kindLoaded, "ブロックの読み方だけを読んだのに、時間軸の図の描く部品を読んだ").toBe(false);
    expect(String(out.drawn), "描く部品を読まずに描いた時の誤り").toContain("time");
  });

  it("light-parse-names-unloaded-block", () => {
    const out = UNLOADED_BLOCK.get();
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
      expect(own.length + fieldsOf(kind).length, `${kind} だけの後から読む個別ブロックが無い (走査の空振り)`).toBeGreaterThan(0);
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
    const { KIND_FOLDERS } = await import('../src/kinds/index');
    for (const kind of Object.values(KIND_FOLDERS) as { fields?: readonly string[] }[]) for (const field of kind.fields ?? []) owned.add(field);
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

// 件ごとに 2 つの入口を読み、軽い入口で見本の種類を読むと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。
// 2 つの入口を file を読み込む段で 1 度だけ読み、軽い入口は全ての見本が使う種類と絵柄集を読んでおく。件はその入口で描く。
// 件が読み直す軽い入口 (`freshLight`) は読み込みの記録を消すが、ここで読んだ入口は読んだ物を持ったまま残る
const ENTRIES = await atLoad("既定の入口と軽い入口を読み、見本が使う種類を軽い入口で読む", async () => {
  const whole = await importEntry<Entry>(name);
  const light = await importEntry<LightEntry>(`${name}/light`);
  if (!whole || !light) throw new Error(`${whole ? "軽い" : "既定の"}入口を読めない`);
  for (const file of DRAGON_FILES) {
    const { kind, diagram } = example(whole, file);
    await light.loadKind(kind);
    // 絵柄集 Tabler の表は種類を読む関数では読まず、loadFor が読む (#3493)。表を使う見本 (橋の見本、#3489) だけ loadFor も待つ
    if (JSON.stringify(diagram).includes('"tabler:')) await light.loadFor(diagram);
  }
  return { whole, light };
});

// 読んでいない種類を新しい Node で描く仕事も、file を読み込む段で済ませる (#3816)。Node を起こせない時は結果を持たず、件が落とす
const UNLOADED_KINDS = await atLoad("読んでいない種類を新しい Node の軽い入口で描く", () => {
  try {
    return inFreshNode<{ refused: Record<string, string[]>; kept: string[]; loaded: string[] }>(`
        const fs = await import("node:fs");
        // 記法を読むには個別ブロックの読み方が要るので (#3349)、描く部品だけを確かめるよう原本を読む
        const read = (file) => JSON.parse(fs.readFileSync(new URL("./examples/" + file, "file://${ROOT}/"), "utf8"));
        const later = ${JSON.stringify(Object.fromEntries(Object.entries(LATER_SAMPLES).map(([kind,file])=>[kind,file.replace(/\.dragon$/u,'.json')])))};
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
    return undefined;
  }
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
    const out = UNLOADED_KINDS.get();
    expect(out, "軽い入口を新しい Node で読めない").toBeDefined();
    if (!out) return;
    for (const kind of LATER_KINDS) {
      for (const message of out.refused[kind] ?? []) expect(message, `読んでいない ${kind} を描いた時の誤り`).toContain(kind);
    }
    expect(out.loaded.sort(), "loadKind を待った後に描けた種類").toEqual(LATER_KINDS);
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

  // 既定の入口は読み込みを待たずに、どの種類の図も描く。見本がどの種類も持つことは light-entry-samples-cover-kinds が確かめる
  describe.for(DRAGON_FILES)("%s", (file) => {
    it("default-entry-draws-every-kind", () => {
      const { whole } = ENTRIES.get();
      const { diagram } = example(whole, file);
      // bitsumi と同じ呼び方。読んだ後に待たずに続けて描き、SVG と段の時刻と見せ方を読む
      const rendered = whole.renderDiagram(diagram, { palette: "night", theme: "dark", still: true });
      expect(rendered.svg, `${file} の SVG`).toContain('data-dragon="figure"');
      expect(rendered.timeline.stills.length, `${file} の段の時刻`).toBeGreaterThan(0);
      expect(["fixed", "follow"], `${file} の見せ方`).toContain(whole.chooseView(rendered, 1280).mode);
    });
  });

  // 配管の図の決まりの表の検査 (`pipe-diagram-rules.test.ts`) は表を元の file から引くので、既定の入口が出すことはここで確かめる (#3763)
  it("default-entry-exports-pipe-rules", async () => {
    const whole = (await importEntry<Entry>(name)) as unknown as { PIPE_RULES?: unknown; pipeViolations?: unknown } | undefined;
    expect(whole?.PIPE_RULES, "配管の図の決まりの表 (PIPE_RULES) が既定の入口から出ていない").toBeDefined();
    expect(whole?.pipeViolations, "決まりの表への違反を数える処理 (pipeViolations) が既定の入口から出ていない").toBeTypeOf("function");
  });

  // 全ての見本を既定の入口で 1 件で描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。見本ごとの件に分ける
  it("default-entry-cases-follow-files", ({ task }) => {
    expect(DRAGON_FILES.length, "見本を数えられない").toBeGreaterThan(1);
    expect(casesNamed(task.file, "default-entry-draws-every-kind").sort(), "見本ごとの件").toEqual(DRAGON_FILES);
  });
});

/** 全ての見本を 1 件で描くと、混んだ機械で 1 件の上限 (10 秒) を超えたので、見本ごとに分ける (#3410) */
describe.for(DRAGON_FILES)("軽い入口と既定の入口の SVG (#3248) %s", (file) => {
  it("light-entry-draws-same-svg", () => {
    // 2 つの入口と、軽い入口が見本の種類を読むのは file を読み込む段で済ませた (#3738)。件は 2 つの表示で描き比べる
    const { whole, light } = ENTRIES.get();
    const { diagram } = example(whole, file);
    const plain = {};
    const dark = { theme: "dark", still: true, lang: "en" };
    expect(light.renderDiagram(diagram, plain).svg, `${file} (${JSON.stringify(plain)}) を軽い入口で描いた SVG が既定の入口と違う`).toBe(whole.renderDiagram(diagram, plain).svg);
    expect(light.renderDiagram(diagram, dark).svg, `${file} (${JSON.stringify(dark)}) を軽い入口で描いた SVG が既定の入口と違う`).toBe(whole.renderDiagram(diagram, dark).svg);
  });
});

/** build した package の置き場 */
const DIST = join(ROOT, "dist");
/** 軽い入口の帯の入口 (#3789) */
const LIGHT_FRAME = join(DIST, "light-frame.js");
/** 軽い入口の頁で帯つきで置く時系列図。後から読む種類を持たない */
const LIGHT_SEQUENCE = "sequence 注文\nbox a as あなた\nbox b as 店\nstep 確認\n  a -> b: 注文\n";
/** 後から読む種類 (`state`) の記法。`loadFor` を待たずに置くと断られる */
const LIGHT_STATE = "state 注文\n\nstate a as 受けた\nstate b as 送った\n\nstep 流す\n  a -> b\n";

/** 軽い入口だけを読む頁で帯つきの図を置いて見たこと */
interface LightFrameSeen {
  /** 帯の入口を読めなかった時の誤り */
  loadError?: string;
  /** 帯の数と、帯の内側に描いた図の数と、帯のボタンの並び */
  frames: number;
  drawn: number;
  buttons: string[];
  /** `loadFor` を待たずに後から読む種類を置いた時の誤りの文と、置き先に残った要素の数 */
  refused: string;
  leftover: number;
  /** 頁が読み込んだ file の path (`/` から) */
  loaded: string[];
}

// 頁を開く仕事は、混んだ機械で 1 件 10 秒の上限を超えないよう、file を読み込む段で済ませる (#3815)
const LIGHT_FRAME_PAGE = await atLoad("軽い入口だけを読む頁で、帯の入口から帯つきの図を置く", async (): Promise<LightFrameSeen> => {
  const { fileChromium } = await import("./page-needs");
  const html =
    '<!doctype html><html lang="ja"><head><meta charset="utf-8">' +
    // 既定の入口も import map に載せ、帯の入口が誤って読んだ時に読み込んだ file として数える
    '<script type="importmap">{"imports":{"@cardenelabs/dragon/light":"/light/index.js","@cardenelabs/dragon":"/index.js"}}</script>' +
    '</head><body><div id="host" style="width:760px"></div><div id="refused" style="width:760px"></div>' +
    `<script type="module">
      const sequence = ${JSON.stringify(LIGHT_SEQUENCE)};
      const state = ${JSON.stringify(LIGHT_STATE)};
      try {
        const light = await import("@cardenelabs/dragon/light");
        let frame;
        try { frame = await import("/light-frame.js"); } catch (error) { window.seen = { loadError: String(error) }; throw error; }
        await light.loadFor(sequence);
        frame.mountFramedDiagram(document.getElementById("host"), sequence);
        let refused = "置けた";
        try { frame.mountFramedDiagram(document.getElementById("refused"), state); } catch (error) { refused = error.message; }
        const root = document.querySelector("#host .dragon-frame")?.shadowRoot;
        window.seen = {
          frames: document.querySelectorAll(".dragon-frame").length,
          drawn: root?.querySelectorAll('[data-dragon="player"] svg').length ?? 0,
          buttons: [...(root?.querySelectorAll(".dg-header-actions > [data-action]") ?? [])].map((el) => el.dataset.action),
          refused,
          leftover: document.getElementById("refused").children.length,
        };
      } catch (error) {
        window.seen ??= { loadError: String(error) };
      }
    </script></body></html>`;
  const context = await (await fileChromium()).newContext({ viewport: { width: 900, height: 900 } });
  context.setDefaultTimeout(10_000);
  const loaded: string[] = [];
  try {
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== "http://localhost") return route.abort();
      if (url.pathname === "/") return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
      const file = join(DIST, url.pathname);
      if (!file.startsWith(`${DIST}/`) || !file.endsWith(".js") || !existsSync(file)) return route.fulfill({ status: 404, body: "" });
      loaded.push(url.pathname);
      return route.fulfill({ contentType: "text/javascript", body: readFileSync(file) });
    });
    const page = await context.newPage();
    await page.goto("http://localhost/");
    await page.waitForFunction(() => "seen" in window, null, { timeout: 10_000 }).catch(() => undefined);
    const seen = await page.evaluate(() => (window as unknown as { seen?: Omit<LightFrameSeen, "loaded"> }).seen);
    return { frames: 0, drawn: 0, buttons: [], refused: "", leftover: 0, ...seen, loaded: [...loaded] };
  } finally {
    await context.close();
  }
});

describe("軽い入口の頁の帯つきの図 (#3789)", () => {
  it("light-entry-mounts-framed-diagram", () => {
    expect(existsSync(LIGHT_FRAME), `軽い入口の帯の入口の build した file が無い: ${LIGHT_FRAME}`).toBe(true);
    const seen = LIGHT_FRAME_PAGE.get();
    expect(seen.loadError, "軽い入口の帯の入口を頁で読めない").toBeUndefined();
    expect({ frames: seen.frames, drawn: seen.drawn, buttons: seen.buttons }, "loadFor を待った後に置いた帯つきの図").toEqual({
      frames: 1,
      drawn: 1,
      buttons: ["code", "editor", "copy", "export", "expand"],
    });
    expect(seen.loaded, "頁が読み込んだ file に軽い入口と帯の入口が在る").toEqual(expect.arrayContaining(["/light/index.js", "/light-frame.js"]));
    expect(seen.loaded, "頁が読み込んだ既定の入口").not.toContain("/index.js");
  });

  it("light-frame-refuses-unloaded-kind", () => {
    expect(existsSync(LIGHT_FRAME), `軽い入口の帯の入口の build した file が無い: ${LIGHT_FRAME}`).toBe(true);
    const seen = LIGHT_FRAME_PAGE.get();
    expect(seen.loadError, "軽い入口の帯の入口を頁で読めない").toBeUndefined();
    // 後から読む種類は、loadFor を待つまで種類の名前を含む誤りで断り、置き先に帯を残さない
    expect(seen.refused, "loadFor を待たずに置いた状態遷移図の誤りの文").toContain("state");
    expect(seen.refused, "誤りの文が loadFor を待つよう言わない").toContain("loadFor");
    expect(seen.leftover, "断った置き先に残った要素").toBe(0);
  });
});

/** 1 行目に `[note: pop]` を書いた時系列図。店の箱だけが note を持つ */
const NOTE_POP = "sequence 注文 [note: pop]\n\nbox shop as 店 [note: 注文を受けて倉庫に出荷を頼む]\nbox store as 倉庫\n\nstep 頼む\n  say 店が倉庫に頼む。\n  shop -> store: 出荷\n";

// 札の層を作る処理 (#3877) は軽い入口の最初に読む量に入れず、札で見せる図を置いた時に後から読む。
// 読み込みの記録が残らない新しい Node で、置いた直後に層が無く、読み終わった後に層を置いて印を押すと札が開くかを、file を読み込む段で確かめる
const NOTE_CARDS = await atLoad("札で見せる図を軽い入口で新しい Node に置く", () =>
  inFreshNode<{ before?: boolean; after?: boolean; opened?: string[]; error?: string }>(`
    const { JSDOM } = await import("jsdom");
    const dom = new JSDOM("<!doctype html><html><body><div id=host></div></body></html>", { pretendToBeVisual: true });
    for (const key of ["window", "document", "Node", "Element", "HTMLElement", "SVGElement", "Event", "MouseEvent", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) globalThis[key] ??= key === "window" ? dom.window : dom.window[key];
    const host = dom.window.document.getElementById("host");
    const layer = () => host.querySelector('[data-dragon="notes"]') !== null;
    let player;
    try {
      const parsed = light.parseNotation(${JSON.stringify(NOTE_POP)}, { lang: "ja" });
      player = light.mountDiagram(host, parsed.diagram, { lang: "ja" });
      out.before = layer();
      for (let i = 0; i < 100 && !layer(); i++) await new Promise((done) => setTimeout(done, 20));
      out.after = layer();
      host.querySelector('[data-note="shop"]').dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
      out.opened = [...host.querySelectorAll('[data-dragon="note-card"][data-open]')].map((el) => el.getAttribute("data-box"));
    } catch (e) { out.error = e.message; }
    player?.destroy();
    dom.window.close();
  `),
);

describe("札の層を後から読む軽い入口 (#3877)", () => {
  it("light-loads-note-cards-after-mount", () => {
    const seen = NOTE_CARDS.get();
    expect(seen.error, "札で見せる図を軽い入口で置けない").toBeUndefined();
    expect(seen.before, "軽い入口が札の層を作る処理を最初から持っていた").toBe(false);
    expect(seen.after, "札で見せる図を置いた後に、札の層を読んで置かない").toBe(true);
    expect(seen.opened, "札の層を置いた後に店の箱の印を押して開いた札").toEqual(["shop"]);
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
