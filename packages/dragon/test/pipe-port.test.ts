// @vitest-environment jsdom
/**
 * Tracelythが0.68.1に当てた直し (`patches/@cardenelabs__dragon@0.68.1.patch`) の振る舞いを、直し無しで持つことを確かめる (#3720)。
 *
 * 直しはTracelythの#86から#183の22件の課題で足した。この file は直しが足した振る舞いを受入条件ごとに 1 つの検査で確かめる。
 * 記法はTracelythの検査 (`tests/unit/fixed-pipe.spec.ts`) の手で書いた記法 (ERC-20の`transferFrom`) を写した。
 * 期待する値は、直しを当てた0.68.1で同じ記法を描いて確かめた。
 *
 * 図は入口 (`@cardenelabs/dragon` = `dist`) で描く。再生の部品は jsdom に置き、枠の幅は `clientWidth` を差し替えて渡す。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { afterEach, describe, expect, it } from "vitest";

type Point = [number, number];
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Party extends Rect {
  id: string;
  shape: string;
}
interface Tank extends Rect {
  party: string;
  token: string;
}
interface Line {
  from: string;
  to: string;
  token?: string;
  points: Point[];
}
interface Text extends Rect {
  text: string;
}
interface Plate extends Rect {
  party: string;
  name: string;
  step: number;
  state: string;
  row?: boolean;
  label?: Text;
  text?: Text;
  was?: Text;
  arrow?: Text;
  pill?: Rect;
  badge?: { cx: number; cy: number; r: number; text: string };
}
interface Link {
  step: number;
  from: string;
  to: string;
  owner: string;
  name: string;
  label: Text;
  delta?: Text;
}
interface Branch {
  to: string;
  points: Point[];
  valve: { x: number; y: number };
}
interface PipeLayout {
  width: number;
  height: number;
  narrow?: boolean;
  parties: Party[];
  tanks: Tank[];
  valuePipes: Line[];
  plates: Plate[];
  gauges: Rect[];
  mains: { from: string; branches: Branch[] }[];
  links?: Link[];
  ledgers?: unknown[];
  busLines?: unknown[];
  fixed?: { shape: string; faded: string[]; score: { crossings: number; length: number }; order: string[] };
  callCards?: (Rect & { call: string; title: string; rows: { name: string; value: string }[]; shown: [number, number][] })[];
  wallets?: Rect[];
  logCards?: (Rect & { party: string; title: string; states: string[]; rows: { name: string; value: string }[] })[];
  gulps?: { step: number; token: string; box: string; w: number; from: Point; to: Point; hidden: [number, number] }[];
}
interface SequenceLayout {
  edges: { step: number; event: number; from: string; to: string; width?: number; block?: string; op?: number }[];
  rows?: (Rect & { step: number })[];
}
interface Timeline {
  steps: { start: number; end: number }[];
  stills: number[];
}
interface Rendered<L> {
  svg: string;
  layout: L;
  timeline: Timeline;
}
type Parsed = { ok: true; diagram: Record<string, unknown> } | { ok: false; errors: { line: number; column: number; message: string }[] };
interface Player {
  readonly step: number;
  readonly playing: boolean;
  readonly held?: boolean;
  hold?(): void;
  rewind?(): void;
  goTo(step: number): void;
  play(): void;
  pause(): void;
  destroy(): void;
}
interface Api {
  parseNotation(text: string, options?: { lang?: string }): Parsed;
  printNotation(diagram: unknown): string;
  renderDiagram(input: unknown, options?: Record<string, unknown>): Rendered<unknown>;
  readDiagram(input: unknown): { ok: boolean; errors?: unknown[] };
  mountDiagram(host: HTMLElement, diagram: unknown, options?: Record<string, unknown>): Player;
}
const api = dragon as unknown as Api;

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");
const example = (file: string): unknown => JSON.parse(readFileSync(join(EXAMPLES, file), "utf8"));

// ---- 手で書いた記法 (ERC-20の transferFrom)

const NAMES: Record<string, string> = { alice: "Alice", bob: "Bob", carol: "Carol", dave: "Dave", usdc: "USDC", weth: "WETH" };
const BALANCE: Record<string, string> = { alice: "1000", bob: "200", carol: "0", dave: "50" };
const TOKENS = new Set(["usdc", "weth"]);
const ALLOWANCE = 'hold usdc: "allowance[Alice][Bob]" 100 [from: alice, to: bob, unit: USDC]';
/** BobがAliceのUSDCをCarolへ送る呼び出し */
const SENT = [
  "step 100 USDCがAliceからCarolへ移る",
  "  say BobがtransferFromを呼ぶ",
  "  bob -> usdc: transferFrom(from: alice, to: carol, amount: 100 USDC)",
  '  write usdc: "allowance[Alice][Bob]" 0',
  "  move usdc: 100 alice -> carol",
  "  emit usdc: Transfer(from: alice, to: carol, amount: 100 USDC)",
  "",
  "step 成功する",
  "  say trueを返す",
  "  return usdc",
];
/** 送る前にリバートする呼び出し。Bobが from にBobを入れて呼ぶ */
const DENIED = [
  "step BobがtransferFromを呼ぶ",
  "  say BobがtransferFromを呼ぶ",
  "  bob -> usdc: transferFrom(from: bob, to: carol, amount: 100 USDC)",
  "",
  "step リバートする",
  "  say requireが通らない",
  "  check usdc: allowance[Bob][Bob] (0 USDC) >= 100 USDC [fail]",
  "  revert usdc: allowance too low",
];

interface TextOptions {
  layout?: string;
  order?: string[];
  steps?: string[];
  holds?: string[];
  allowance?: string;
}
/** 記法を組む。`holds` を渡すと人の残高の行を差し替える */
function pipeText({ layout, order = ["alice", "usdc", "bob", "carol"], steps = SENT, holds, allowance = ALLOWANCE }: TextOptions = {}): string {
  const boxes = order.map((id) => `box ${id} as ${NAMES[id] ?? id}`);
  const balances = holds ?? order.filter((id) => !TOKENS.has(id)).map((id) => `hold ${id}: ${BALANCE[id] ?? "0"} USDC`);
  return ["pipe USDC.transferFromを実行", ...(layout ? [`layout ${layout}`] : []), "", ...boxes, "", ...balances, ...(allowance ? [allowance] : []), "", ...steps, ""].join("\n");
}

function parse(text: string): Record<string, unknown> {
  const parsed = api.parseNotation(text, { lang: "ja" });
  expect(parsed.ok, parsed.ok ? "" : parsed.errors.map((e) => `${e.line}行目 ${e.message}`).join("\n")).toBe(true);
  return parsed.ok ? parsed.diagram : {};
}
/** 読めずに断った時の文。読めた時は空 */
function refused(text: string): string {
  const parsed = api.parseNotation(text, { lang: "ja" });
  return parsed.ok ? "" : parsed.errors.map((e) => e.message).join("\n");
}
function drawPipe(text: string, options: Record<string, unknown> = {}): Rendered<PipeLayout> {
  return api.renderDiagram(parse(text), { lang: "ja", ...options }) as Rendered<PipeLayout>;
}

const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const people = (layout: PipeLayout): Party[] => layout.parties.filter((p) => p.shape === "round");
const partyOf = (layout: PipeLayout, id: string): Party => {
  const found = layout.parties.find((p) => p.id === id);
  if (!found) throw new Error(`${id}の箱が無い`);
  return found;
};
/** 箱と槽の置き場所。出てきた順の違いを比べないよう並べ替える */
const places = (layout: PipeLayout): string =>
  JSON.stringify({
    parties: layout.parties.map((p) => [p.id, p.x, p.y, p.w, p.h]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    tanks: layout.tanks.map((t) => [t.party, t.token, t.x, t.y, t.w, t.h]).sort((a, b) => `${a[0]}/${a[1]}`.localeCompare(`${b[0]}/${b[1]}`)),
  });
/** SVGの、`attr="id"` を持つ部品の開きタグ */
const tagsWith = (svg: string, attr: string, id: string): string[] => [...svg.matchAll(new RegExp(`<g [^>]*${attr}="${id}"[^>]*>`, "gu"))].map((m) => m[0]);
const countOf = (svg: string, cls: string): number => [...svg.matchAll(new RegExp(`class="${cls}[" ]`, "gu"))].length;
/** SVGの、`class="cls"` で始まる最初の `<g>` の開きタグから、対になる閉じタグまで。無い時は空 */
function groupOf(svg: string, cls: string): string {
  const start = svg.indexOf(`<g class="${cls}"`);
  if (start < 0) return "";
  let depth = 0;
  for (const tag of svg.slice(start).matchAll(/<g[\s>]|<\/g>/gu)) {
    depth += tag[0] === "</g>" ? -1 : 1;
    if (depth === 0) return svg.slice(start, start + (tag.index ?? 0) + tag[0].length);
  }
  return "";
}
const byScore = (a: { crossings: number; length: number }, b: { crossings: number; length: number }): number => a.crossings - b.crossings || a.length - b.length;

describe("置き方の形", () => {
  it("port-layout-four-shapes-and-auto", () => {
    const order = ["alice", "usdc", "bob", "carol", "dave"];
    // layout の行を持たない図は、今の並べ方のまま描き、固定した形を持たない
    expect(drawPipe(pipeText({ order })).layout.fixed, "layout の行を持たない図の固定した形").toBeUndefined();

    const top = drawPipe(pipeText({ layout: "top", order })).layout;
    expect(top.fixed?.shape, "top の形").toBe("top");
    const topBox = partyOf(top, "usdc");
    for (const p of people(top)) expect(topBox.y + topBox.h, `top の箱が ${p.id} より上に無い`).toBeLessThanOrEqual(p.y);

    const bottom = drawPipe(pipeText({ layout: "bottom", order })).layout;
    expect(bottom.fixed?.shape, "bottom の形").toBe("bottom");
    const bottomBox = partyOf(bottom, "usdc");
    for (const p of people(bottom)) expect(bottomBox.y, `bottom の箱が ${p.id} より下に無い`).toBeGreaterThanOrEqual(p.y + p.h);

    // auto は top と bottom のうち、交わりの数が少なく、次に長さの合計が短い形を選ぶ
    const auto = drawPipe(pipeText({ layout: "auto", order })).layout;
    expect(["top", "bottom"], "auto が選んだ形").toContain(auto.fixed?.shape);
    const best = [top.fixed, bottom.fixed].map((f) => f?.score ?? { crossings: Number.POSITIVE_INFINITY, length: 0 }).sort(byScore)[0];
    expect(auto.fixed?.score, "auto が点数の低い形を選んでいない").toEqual(best);

    // トークンの箱が5つの図の auto は、箱の並びを試さず box の行の順で2つの形を比べる
    const five = ["aaa", "bbb", "ccc", "ddd", "eee"];
    const fiveText = [
      "pipe 5つのトークン",
      "layout auto",
      "",
      "box alice as Alice",
      "box bob as Bob",
      ...five.map((id) => `box ${id} as ${id.toUpperCase()}`),
      "",
      `hold alice: ${five.map((id) => `10 ${id.toUpperCase()}`).join(", ")}`,
      "hold bob: 0 EEE",
      "",
      "step EEEを送る",
      "  say AliceがEEEを送る",
      "  alice -> eee: transfer(to: bob, amount: 1)",
      "  move eee: 1 alice -> bob",
      "  return eee",
      "",
    ].join("\n");
    const fixed = drawPipe(fiveText).layout.fixed;
    expect(fixed?.order.filter((id) => five.includes(id)), "箱が5つの図の auto が箱の並びを変えた").toEqual(five);

    // パイプ図の外の layout の行と、2行目の layout の行と、知らない形と、形の無い layout の行は読まずに断る
    expect(refused("sequence 題\nlayout top\nbox a as A\nbox b as B\nstep s\n  say 呼ぶ\n  a -> b: hi\n"), "シーケンス図の layout の行").toMatch(/パイプ図 \(pipe\) だけ/u);
    expect(refused(pipeText({ layout: "top\nlayout bottom" })), "2行目の layout の行").toMatch(/1行だけ/u);
    expect(refused(pipeText({ layout: "nope" })), "知らない形").toMatch(/「nope」は書けない/u);
    expect(refused(pipeText().replace("\n\nbox", "\nlayout\n\nbox")), "形の無い layout の行").toMatch(/layout の後に形の名前/u);
  });

  it("port-layout-ledger-grid-bus", () => {
    const order = ["alice", "usdc", "weth", "bob", "carol"];
    const holds = ["hold alice: 1000 USDC, 5 WETH", "hold bob: 200 USDC", "hold carol: 0 USDC, 1 WETH"];
    for (const shape of ["ledger", "mesh", "bus"]) {
      const { layout, svg } = drawPipe(pipeText({ layout: shape, order, holds }));
      expect(layout.fixed?.shape, `${shape} の形`).toBe(shape);
      // 槽はトークンごとの行に並べる。同じトークンの槽は同じ高さに、違うトークンの槽は違う高さに置く
      const rowY = (token: string): Set<number> => new Set(layout.tanks.filter((t) => t.token === token).map((t) => t.y));
      expect(rowY("USDC").size, `${shape} のUSDCの槽が1つの行に無い`).toBe(1);
      expect(rowY("WETH").size, `${shape} のWETHの槽が1つの行に無い`).toBe(1);
      expect([...rowY("USDC")][0], `${shape} のUSDCとWETHが同じ行`).not.toBe([...rowY("WETH")][0]);
      if (shape === "ledger") {
        // 帳簿型は箱を持つトークンの行を囲む
        expect(layout.ledgers?.length ?? 0, "帳簿型の囲み").toBeGreaterThan(0);
        expect(countOf(svg, "dg-pp-ledger"), "帳簿型の囲みを描いていない").toBeGreaterThan(0);
      }
      if (shape === "mesh") {
        // 網型はトークンの行ごとに全ての人の組をパイプで結ぶ (USDCを持つ3人は3組)
        const pairs = new Set(layout.valuePipes.filter((p) => p.token === "USDC").map((p) => [p.from, p.to].sort().join("-")));
        expect(pairs.size, "網型のUSDCの組").toBe(3);
      }
      if (shape === "bus") {
        // 母線型は箱を持つトークンの行ごとに母線を引き、箱を行の左の端に置く
        expect(layout.busLines?.length ?? 0, "母線型の母線").toBeGreaterThan(0);
        const box = partyOf(layout, "usdc");
        for (const t of layout.tanks.filter((x) => x.token === "USDC")) expect(box.x, `母線型の箱が ${t.party} の槽より左に無い`).toBeLessThan(t.x);
      }
    }
  });

  it("port-faint-uninvolved-keeps-places", () => {
    const order = ["alice", "usdc", "bob", "carol", "dave"];
    const sent = drawPipe(pipeText({ layout: "top", order }));
    // 呼び出しにも移動にも書き換えのキーにも出ないDaveだけを薄く描く
    expect(sent.layout.fixed?.faded, "薄く描いた人").toEqual(["dave"]);
    const daveTags = tagsWith(sent.svg, "data-pipe-party", "dave");
    expect(daveTags.length, "Daveの丸").toBeGreaterThan(0);
    for (const tag of daveTags) expect(tag, "Daveの丸が薄くない").toMatch(/\bdg-pp-faded\b/u);
    for (const tag of tagsWith(sent.svg, "data-pipe-party", "bob")) expect(tag, "Bobの丸が薄い").not.toMatch(/\bdg-pp-faded\b/u);
    // 呼ぶ人の引数を替えても、人と箱と槽の置き場所は変えない
    const denied = drawPipe(pipeText({ layout: "top", order, steps: DENIED }));
    expect(places(denied.layout), "呼び方を替えると置き場所が動いた").toBe(places(sent.layout));
  });
});

describe("トークンの箱と2人を結ぶ線", () => {
  it("port-token-box-balance-rows", () => {
    const { layout } = drawPipe(pipeText({ layout: "top" }));
    const box = partyOf(layout, "usdc");
    const rows = layout.plates.filter((p) => p.party === "usdc" && p.row && p.step === 0);
    expect(rows.map((r) => r.name), "トークンの箱の残高の行").toEqual(["balanceOf[Alice]", "balanceOf[Bob]", "balanceOf[Carol]"]);
    expect(rows.map((r) => r.badge?.text), "行の頭の印の頭文字").toEqual(["A", "B", "C"]);
    for (const r of rows) {
      expect(r.x >= box.x && r.x + r.w <= box.x + box.w && r.y >= box.y && r.y + r.h <= box.y + box.h, `${r.name} の行が箱の外`).toBe(true);
    }
    const [alice, bob, carol] = rows;
    // 値が変わった行は前の値と矢印と今の値を札に入れ、変わらない行は今の値だけを出す
    expect([alice?.was?.text, alice?.text?.text, alice?.pill !== undefined], "Aliceの行").toEqual(["1,000", "900", true]);
    expect([carol?.was?.text, carol?.text?.text, carol?.pill !== undefined], "Carolの行").toEqual(["0", "100", true]);
    expect(alice?.arrow, "Aliceの行の矢印").toBeDefined();
    expect([bob?.was, bob?.text?.text, bob?.pill], "Bobの行").toEqual([undefined, "200", undefined]);
  });

  it("port-write-links-clear-of-chips", () => {
    for (const steps of [SENT, DENIED]) {
      const { layout, svg } = drawPipe(pipeText({ layout: "top", steps }));
      const links = layout.links ?? [];
      expect(links.length, "2人を結ぶ線").toBeGreaterThan(0);
      expect(countOf(svg, "dg-pp-rell"), "2人を結ぶ点線を描いていない").toBeGreaterThan(0);
      for (const l of links) {
        expect([l.from, l.to, l.owner], "線の両端と持ち主").toEqual(["alice", "bob", "usdc"]);
        const label = l.delta ? { x: l.label.x, y: l.label.y, w: l.delta.x + l.delta.w - l.label.x, h: l.label.h } : l.label;
        const others: [string, Rect][] = [
          ...layout.gauges.map((g): [string, Rect] => ["requireの針", g]),
          ...(layout.callCards ?? []).map((c): [string, Rect] => ["呼び出しの札", c]),
          ...(layout.wallets ?? []).map((w): [string, Rect] => ["札入れ", w]),
        ];
        for (const [what, rect] of others) expect(overlaps(label, rect), `段 ${l.step + 1} の線の札が${what}に重なる`).toBe(false);
      }
    }
    // 同じ人を2度書いた線は読まずに断る
    expect(refused(pipeText({ allowance: ALLOWANCE.replace("to: bob", "to: alice") })), "同じ人を2度書いた線").not.toBe("");
  });

  it("port-layout-exposes-cards-and-gulps", () => {
    const { layout, timeline } = drawPipe(pipeText());
    const [card] = layout.callCards ?? [];
    expect(card?.call, "呼び出しの札の呼び出し").toBe("bob>usdc");
    expect(card?.title, "呼び出しの札の見出し").toBe("USDC.transferFrom");
    expect(card?.rows.map((r) => r.name), "呼び出しの札の引数").toEqual(["from", "to", "amount"]);
    // 呼び出しの札は呼び出した段の間だけ出て、図を描き始めた時刻には出ていない
    const first = timeline.steps[0] ?? { start: 0, end: 0 };
    for (const [a, b] of card?.shown ?? []) {
      expect(a, "呼び出しの札が段1より前に出る").toBeGreaterThanOrEqual(first.start);
      expect(b, "呼び出しの札が段1の後も残る").toBeLessThanOrEqual(first.end + 0.5);
    }
    expect(card?.shown.length ?? 0, "呼び出しの札が出る時刻").toBeGreaterThan(0);
    expect(layout.wallets?.length ?? 0, "札入れ").toBeGreaterThan(0);
    const [log] = layout.logCards ?? [];
    expect([log?.party, log?.title, log?.states], "ログの札").toEqual(["usdc", "USDC.Transfer", ["暫定", "確定"]]);
    expect(log?.rows.map((r) => r.name), "ログの札の引数").toEqual(["from", "to", "amount"]);
    const [gulp] = layout.gulps ?? [];
    expect([gulp?.step, gulp?.box], "移す額の受け渡し").toEqual([0, "usdc"]);
  });
});

describe("再生の部品", () => {
  const players: Player[] = [];
  afterEach(() => {
    for (const p of players.splice(0)) p.destroy();
    document.body.innerHTML = "";
  });
  function reduceMotion(reduce: boolean): void {
    window.matchMedia = (query: string) =>
      ({
        matches: reduce && query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  /** 幅 `width` の枠に図を置く */
  function mount(diagram: unknown, width: number, options: Record<string, unknown> = {}) {
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { configurable: true, get: () => width });
    document.body.appendChild(host);
    const player = api.mountDiagram(host, diagram, options);
    players.push(player);
    const svg = (): SVGElement | null => host.querySelector<SVGElement>('[data-dragon="pan"] svg,[data-dragon="zoom-frame"] svg') ?? host.querySelector<SVGElement>("svg");
    const frame = (): HTMLElement | null => host.querySelector<HTMLElement>('[data-dragon="pan"],[data-dragon="zoom-frame"]');
    const level = (): string => host.querySelector('[data-dragon="zoom-level"]')?.textContent ?? "";
    const button = (name: string): HTMLButtonElement | null => host.querySelector<HTMLButtonElement>(`button[data-dragon="${name}"]`);
    const shown = (): number => Number.parseFloat(svg()?.style.width || "0");
    const at = (): number => Number(svg()?.style.getPropertyValue("--at"));
    return { host, player, svg, frame, level, button, shown, at };
  }

  it("port-player-pauses-at-start", () => {
    reduceMotion(false);
    const source = parse(pipeText());
    const { timeline } = api.renderDiagram(source, { lang: "ja" });
    const first = timeline.steps[0]?.start ?? Number.NaN;
    // pausedAtStart は pausedAt より先に効き、段1の始まり (段1で変わる前の値) で止めて置く
    const m = mount(source, 1200, { lang: "ja", pausedAtStart: true, pausedAt: 1 });
    expect([m.player.step, m.player.playing], "置いた時の段と流れ").toEqual([0, false]);
    expect(m.at(), "置いた時の時刻が段1の始まりでない").toBeCloseTo(first, 5);
    expect(first, "段1の始まりが段1の止め絵と同じ").toBeLessThan(timeline.stills[0] ?? 0);
    // rewind は段1の始まりへ戻して止め、goTo(0) は段1の止め絵 (変わった後の値) で止める
    m.player.goTo(1);
    expect(typeof m.player.rewind, "rewind が無い").toBe("function");
    m.player.rewind?.();
    expect([m.player.step, m.player.playing], "rewind の後の段と流れ").toEqual([0, false]);
    expect(m.at(), "rewind の後の時刻が段1の始まりでない").toBeCloseTo(first, 5);
    m.player.goTo(0);
    expect(m.at(), "goTo(0) の時刻が段1の止め絵でない").toBeCloseTo(timeline.stills[0] ?? Number.NaN, 5);
  });

  it("port-player-zoom-options", () => {
    reduceMotion(true);
    const source = example("swap.json");
    const native = (api.renderDiagram(source, { lang: "ja", width: 700 }) as Rendered<PipeLayout>).layout.width;
    expect(native, "見本の図が枠より狭い").toBeGreaterThan(700);
    // fitWide は600px以上の枠で、枠より広い図の全体を枠の幅に収めて始める
    const fit = mount(source, 700, { lang: "ja", fitWide: true });
    expect(fit.shown(), "fitWide の図が枠の幅に収まらない").toBeCloseTo(700, 0);
    expect(fit.level(), "fitWide の始めの度合い").toBe("100%");
    expect(mount(source, 700, { lang: "ja" }).shown(), "fitWide を渡さない図が原寸でない").toBeCloseTo(native, 0);
    // 原寸が枠に収まる図と、600px より狭い枠には効かない
    expect(mount(source, 2600, { lang: "ja", fitWide: true }).shown(), "枠に収まる図を広げた").toBeCloseTo(native, 0);
    expect(mount(source, 390, { lang: "ja", fitWide: true }).shown(), "狭い枠で fitWide が効いた").toBeCloseTo(mount(source, 390, { lang: "ja" }).shown(), 0);

    // minZoom は始めの大きさより小さくでき、ボタンは始めの大きさをまたぐ時に1度止まる
    const zooms: number[] = [];
    const low = mount(source, 700, { lang: "ja", fitWide: true, minZoom: 0.25, onZoom: (z: number) => zooms.push(z) });
    expect(low.button("zoom-out")?.disabled, "minZoom を渡しても縮められない").toBe(false);
    low.button("zoom-out")?.click();
    expect(low.level(), "1度縮めた度合い").toBe("80%");
    for (let i = 0; i < 20 && !low.button("zoom-out")?.disabled; i++) low.button("zoom-out")?.click();
    expect(low.level(), "縮めきった度合い").toBe("25%");
    for (let i = 0; i < 20 && low.level() !== "100%" && !low.button("zoom-in")?.disabled; i++) {
      low.button("zoom-in")?.click();
      if (Number.parseInt(low.level(), 10) > 100) break;
    }
    expect(low.level(), "拡大で始めの大きさに1度止まらない").toBe("100%");
    // onZoom は度合いが変わるたびに新しい度合いを受け取る
    expect(zooms[0], "onZoom が最初に受け取った度合い").toBeCloseTo(0.8, 5);
    expect(zooms.at(-1), "onZoom が最後に受け取った度合い").toBeCloseTo(1, 5);
    // 0 以下と 1 以上の minZoom は読まず、始めの大きさより縮めない
    for (const minZoom of [0, 1]) expect(mount(source, 700, { lang: "ja", fitWide: true, minZoom }).button("zoom-out")?.disabled, `minZoom ${minZoom}`).toBe(true);
    // startZoom はその度合いで始める
    expect(mount(source, 700, { lang: "ja", fitWide: true, startZoom: 1.5 }).level(), "startZoom 1.5 の始めの度合い").toBe("150%");
  });

  it("port-player-holds-after-user-pan", () => {
    reduceMotion(true);
    const source = example("swap.json");
    const m = mount(source, 390, { lang: "ja", zoom: "readable" });
    expect(m.frame()?.dataset.dragon, "狭い枠の図を送る枠にしていない").toBe("pan");
    expect(m.player.held, "置いた時から送らない間").toBe(false);
    // 拡大と縮小をした後は送らない間にし、段を選ぶと送り直す
    m.button("zoom-in")?.click();
    expect(m.player.held, "拡大した後").toBe(true);
    m.player.goTo(1);
    expect(m.player.held, "段を選んだ後").toBe(false);
    // 図を回して送った後も送らない間にする
    m.frame()?.dispatchEvent(new WheelEvent("wheel", { deltaY: 40, bubbles: true }));
    expect(m.player.held, "回して送った後").toBe(true);
    m.player.goTo(2);
    expect(m.player.held, "段を選んだ後").toBe(false);
    // 図の外で送った時は hold で送らない間にし、流し始めると送り直す
    m.player.hold?.();
    expect(m.player.held, "hold の後").toBe(true);
    const left = m.frame()?.scrollLeft;
    m.player.play();
    expect(m.player.held, "流し始めた後").toBe(false);
    m.player.pause();
    expect(typeof left, "枠の送った位置").toBe("number");
  });

  it("port-shared-html-draws-holdings", () => {
    reduceMotion(true);
    // 共有のHTMLは原本の JSON を再生の部品に渡して描く。値の持ち分の線 (link) を持つ原本を、形の確かめで止めずに描く
    for (const allowance of [ALLOWANCE, 'hold usdc: "allowance[Alice][Bob]" 100 [on: alice, unit: USDC]']) {
      const source = parse(pipeText({ allowance }));
      const holds = ((source.blocks as { hold?: { link?: unknown }[] } | undefined)?.hold ?? []).filter((h) => h.link !== undefined);
      expect(holds.length, `${allowance} の値の持ち分を読んでいない`).toBe(1);
      const read = api.readDiagram(JSON.parse(JSON.stringify(source)));
      expect(read.ok, `${allowance} の原本を形の確かめが通さない ${JSON.stringify(read.errors ?? []).slice(0, 300)}`).toBe(true);
      const m = mount(JSON.parse(JSON.stringify(source)), 1200, { lang: "ja" });
      expect(m.svg()?.innerHTML.length ?? 0, `${allowance} の図を描いていない`).toBeGreaterThan(0);
    }
  });

  it("port-phone-width-same-arrangement", () => {
    reduceMotion(true);
    const source = example("swap.json");
    // 電話の幅でも広い枠と同じ並びで描く
    const phone = (api.renderDiagram(source, { lang: "ja", width: 390 }) as Rendered<PipeLayout>).layout;
    const wide = (api.renderDiagram(source, { lang: "ja", width: 1200 }) as Rendered<PipeLayout>).layout;
    expect(phone.narrow ?? false, "電話の幅の並び").toBe(false);
    expect([phone.width, phone.height], "電話の幅の図の大きさ").toEqual([wide.width, wide.height]);
    expect(places(phone), "電話の幅で置き場所が変わった").toBe(places(wide));
    // 再生の部品は電話の幅の枠で図を送る枠にし、段を進めると今の段へ寄せる
    const m = mount(source, 390, { lang: "ja" });
    expect(m.frame()?.dataset.dragon, "電話の幅の図を送る枠にしていない").toBe("pan");
    const lefts = new Set<number>();
    for (let s = 0; s < 6; s++) {
      m.player.goTo(s);
      lefts.add(Math.round(m.frame()?.scrollLeft ?? 0));
    }
    expect(lefts.size, "段を進めても今の段へ寄せない").toBeGreaterThan(1);
  });
});

describe("シーケンス図", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });
  /** パイプ図の部品で描く見た目を種類の行の `[shape: pipe]` で選んだ記法 */
  const SEQ = [
    "sequence USDCを送る [shape: pipe]",
    "blocks 1",
    "block +call",
    "  base edge",
    "  shape solid",
    "  color blue",
    "end",
    "block +money",
    "  base edge",
    "  shape solid",
    "  color amber",
    "end",
    "box alice as Alice",
    "box usdc as USDC",
    "box bob as Bob",
    "hold alice: 100 USDC",
    "step 送る",
    "  say AliceがUSDCのtransferを呼ぶ",
    "  alice +call usdc: transfer(to: bob, amount: 10) [carry: none, op: 3]",
    "  alice +money bob: 10 USDC [carry: none, op: 4]",
    "",
    "step 終わる",
    "  say trueを返す",
    "  usdc -> alice: true [carry: none, op: 5]",
    "",
  ].join("\n");

  it("port-sequence-ops-band-money", () => {
    const { svg, layout } = api.renderDiagram(parse(SEQ), { lang: "ja" }) as Rendered<SequenceLayout>;
    // 線を起こした操作の番号を、描いた部品が data-op (段/番号) で持つ
    const ops = new Set([...svg.matchAll(/data-op="(\d+\/\d+)"/gu)].map((m) => m[1]));
    expect([...ops].sort(), "線の操作の番号").toEqual(["0/3", "0/4", "1/5"]);
    expect(layout.edges.map((e) => e.op), "並びの線の操作の番号").toEqual([3, 4, 5]);
    // 今の段の帯を段ごとに置く
    expect(layout.rows?.map((r) => r.step), "今の段の帯").toEqual([0, 1]);
    expect(countOf(svg, "dg-row"), "今の段の帯を描いていない").toBeGreaterThan(0);
    // お金の矢印は呼び出しの線より太い
    const money = layout.edges.find((e) => e.block === "+money");
    const call = layout.edges.find((e) => e.block === "+call");
    expect(money?.width ?? 0, "お金の矢印が呼び出しの線より太くない").toBeGreaterThan(call?.width ?? Number.POSITIVE_INFINITY);
    // 見た目を選んだ記法を書き戻すと、同じ見た目の指定と操作の番号が戻る
    const printed = api.printNotation(parse(SEQ));
    expect(printed.split("\n")[0], "書き戻した種類の行").toBe("sequence USDCを送る [shape: pipe]");
    expect(printed, "書き戻した操作の番号").toContain("op: 4");
    // 知らない見た目の名前は読まずに断る
    expect(refused(SEQ.replace("[shape: pipe]", "[shape: ledger]")), "知らない見た目").toMatch(/shape/u);
    // 原本 (版2) の時系列図の欄 `sequence.shape` でも同じ見た目で描く
    const original = { ...(example("payment.json") as Record<string, unknown>), sequence: { shape: "pipe" } };
    const drawn = api.renderDiagram(original, { lang: "ja" });
    expect(countOf(drawn.svg, "dg-sqtube"), "原本で選んだ見た目の生存線の管").toBeGreaterThan(0);
    // 見た目を書かない時系列図に書いた操作の番号も、線が data-op で持つ
    const plain = api.renderDiagram(parse(SEQ.replace(" [shape: pipe]", "")), { lang: "ja" });
    expect([...plain.svg.matchAll(/data-op="(\d+\/\d+)"/gu)].map((m) => m[1]).sort(), "既定の見た目の線の操作の番号").toEqual(["0/3", "0/4", "1/5"]);
  });

  it("port-sequence-default-look-kept", () => {
    // 見た目を書かない時系列図は、生存線を共通の部品の線で描き、パイプ図の部品の生存線の管と今の段の帯を描かない
    const plain = SEQ.replace(" [shape: pipe]", "").replace(/, op: \d+/gu, "");
    const { svg, layout } = api.renderDiagram(parse(plain), { lang: "ja" }) as Rendered<SequenceLayout>;
    expect(countOf(svg, "dg-ll"), "共通の部品の生存線").toBe(3);
    expect(countOf(svg, "dg-sqtube"), "生存線の管").toBe(0);
    expect(countOf(svg, "dg-row"), "今の段の帯").toBe(0);
    expect(layout.rows, "今の段の帯の置き場").toBeUndefined();
    // 寄って追う形も、窓の上端の頭の列 (#3118) に頭の箱だけを描き、パイプ図の部品の列の頭と器を描かない
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { configurable: true, get: () => 360 });
    document.body.appendChild(host);
    const player = api.mountDiagram(host, parse(plain.replace("sequence USDCを送る", "sequence USDCを送る [view: follow]")), { lang: "ja" });
    const shown = host.querySelector("svg")?.outerHTML ?? "";
    player.destroy();
    expect(shown, "寄って追う形で描いていない").toContain('data-view="follow"');
    expect(countOf(groupOf(shown, "dg-hd"), "dg-sn"), "頭の列の頭の箱").toBe(3);
    expect(countOf(shown, "dg-sqc-head") + countOf(shown, "dg-sqtube"), "パイプ図の部品の列の頭と生存線の管").toBe(0);
  });

  it("port-op-refused-outside-sequence", () => {
    // 時系列図の外の種類の線に書いた操作の番号は、その行とopの列を示して断る
    const arch = ["architecture 決済", "", "box shop as 店", "box pay as 決済", "", "step 払う", "  shop -> pay: 払う [op: 3]", ""].join("\n");
    const pipe = pipeText({ steps: SENT.map((line) => (line.includes("bob -> usdc") ? `${line} [op: 3]` : line)) });
    for (const [name, text] of [
      ["構成図", arch],
      ["配管の図", pipe],
    ] as const) {
      const parsed = api.parseNotation(text, { lang: "ja" });
      expect(parsed.ok, `${name}の線のop`).toBe(false);
      const error = parsed.ok ? undefined : parsed.errors[0];
      const lines = text.split("\n");
      const at = lines.findIndex((line) => line.includes("[op: 3]")) + 1;
      expect(error?.line, `${name}の誤りの行`).toBe(at);
      expect(Array.from(lines[at - 1] ?? "").slice((error?.column ?? 0) - 1).join(""), `${name}の誤りの列`).toMatch(/^op:/u);
      expect(error?.message ?? "", `${name}の誤りの文が時系列図だけと示していない`).toMatch(/sequence/u);
    }
    // 数でない操作の番号は、時系列図の線でも読まずに断る
    expect(refused(SEQ.replace("op: 3", "op: x")), "数でない操作の番号").toMatch(/op/u);
  });
});

describe("弁", () => {
  const segs = (pts: Point[]): [Point, Point][] => pts.slice(1).map((q, i) => [pts[i] as Point, q]);
  /** 弁を載せた真っすぐな所の真ん中から弁までの隔たり。弁が線の上に無い時は無限大 */
  const offMiddle = (points: Point[], at: Point): number => {
    for (const [a, b] of segs(points)) {
      const flat = Math.abs(a[1] - b[1]) < 0.5;
      const on = flat
        ? Math.abs(at[1] - a[1]) < 0.5 && at[0] >= Math.min(a[0], b[0]) - 0.5 && at[0] <= Math.max(a[0], b[0]) + 0.5
        : Math.abs(at[0] - a[0]) < 0.5 && at[1] >= Math.min(a[1], b[1]) - 0.5 && at[1] <= Math.max(a[1], b[1]) + 0.5;
      if (on) return Math.abs(Math.abs(at[0] - a[0]) + Math.abs(at[1] - a[1]) - (Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])) / 2);
    }
    return Number.POSITIVE_INFINITY;
  };

  it("port-valve-centered-on-straight", () => {
    // ほかの線に塞がれない弁は、載せた真っすぐな所の真ん中から4px以内に置く。塞がれた弁だけが真ん中から外れる
    for (const file of ["swap-two-hops.json", "swap-retry.json"]) {
      const { layout } = api.renderDiagram(example(file), { lang: "ja" }) as Rendered<PipeLayout>;
      const offs = layout.mains.flatMap((m) => m.branches.map((b) => offMiddle(b.points, [b.valve.x, b.valve.y])));
      expect(offs.length, `${file} の弁`).toBeGreaterThan(0);
      const centred = offs.filter((o) => o <= 4).length;
      expect(centred / offs.length, `${file} の弁の真ん中からの隔たり ${offs.map((o) => Math.round(o)).join(",")}`).toBeGreaterThanOrEqual(0.75);
    }
  });
});
