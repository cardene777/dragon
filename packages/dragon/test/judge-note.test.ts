// @vitest-environment jsdom
/**
 * 判定の表 (#3879) の規則の見出しと例の名前を押すと、すぐ下に説明の札を開く (#3890)。
 *
 * 1 行目に `[note: pop]` を書いた表 (札で見せる表) では、`note` を持つ規則の見出しのセルと例の名前のセルが押せる所になり、
 * 名前のすぐ右に箱の札 (#3877) と同じ i の丸を持つ。押すとそのセルのすぐ下に札が開き、
 * 規則の札は番号と規則の名前と `note` の全文を、例の札は例の名前と `note` の全文を持ち、行に `example` を書いた時だけ灰色の例の帯を持つ。
 * 札で見せる表は例の `note` を名前の下に描かない。札で見せない表は規則の `note` を見出しに描かず、表の下に番号と名前と一緒に並べる (#4008)。
 * 札は札の外か閉じるのアイコンを押すと閉じ、段を送ると閉じ、表を横に送ると閉じる。例の行の名前のセルより右は押しても開かない (#3892 が使う)。
 * 印刷の形では全ての札を開き、表の下に並べる。
 *
 * 画面の大きさを測れない jsdom では、押したセルと図の枠の四角を検査が決め、札をその四角から置く位置を確かめる。
 * 検査は種類を登録しない入口 (`src/core.ts`) と、判定の表の種類の登録の file だけを読む (#3763)。
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./built-globals";
import * as dragon from "../src/core";
import "../src/kind-use/judge";
import { LOOK } from "../src/look/values";
import { drawPageBlocks } from "../src/page-blocks";
import { exportPage } from "../src/page/export";

const ROOT = process.cwd();

/** チェーンの規則の長い説明。札の本文にだけ出す */
const CHAIN_NOTE = "Txを出すチェーンのIDが31337で、送る物がそのチェーンのUSDCの契約か。読み解けないTxはここで照らせない";

interface TableOptions {
  /** 1 行目の題の後ろに書く属性 */
  head?: string;
  /** チェーンの規則に `example` を書くか */
  chainExample?: boolean;
  /** 1 つ目の例に `example` を書くか */
  caseExample?: boolean;
  /** `note` を持たない 1回の規則に `example` を書くか */
  onceExample?: boolean;
  /** `note` を持たない 3 つ目の例に `example` を書くか */
  lastExample?: boolean;
}

/**
 * 規則 3 つと例 3 つの表。チェーンと宛先の規則と、1 つ目と 2 つ目の例が `note` を持ち、1回の規則と 3 つ目の例は持たない。
 * 行は 1 行目が題、3 から 5 行目が規則、7、8、10 行目が例
 */
const table = (o: TableOptions = {}): string => {
  const { head = " [note: pop]", chainExample = true, caseExample = true, onceExample = false, lastExample = false } = o;
  return (
    `judge どの送金を止めるのか${head}\n\n` +
    `rule chain as チェーン [value: 31337のUSDC, note: ${CHAIN_NOTE}${chainExample ? ", example: chainId 31337" : ""}]\n` +
    "rule to as 宛先 [value: 0x2222…, note: 宛先が許した0x2222…と同じか]\n" +
    `rule once as 1回 [value: 30まで${onceExample ? ", example: 35は止める" : ""}]\n\n` +
    `case 0x2222…へ20 USDC [note: 11/24 その日1件目${caseExample ? ", example: transfer 0x2222… 20 USDC" : ""}]\n` +
    "case 0x9999…へ20 USDC [note: 11/24 宛先が違う]\n" +
    "  fail to: 0x9999\n" +
    `case 0x2222…へ35 USDC${lastExample ? " [example: 35 USDC]" : ""}\n` +
    "  fail once: 35\n"
  );
};

/** 記法を読んだ原本。読めない時は判定の文で落とし、`undefined` を返す */
function diagramOf(text: string, lang: "ja" | "en" = "ja"): unknown {
  const parsed = dragon.parseNotation(text, { lang });
  expect(parsed.ok, `判定の表の記法を読めない: ${parsed.ok ? "" : parsed.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join(" / ")}`).toBe(true);
  return parsed.ok ? parsed.diagram : undefined;
}

/** 描いた判定の表の根。描けない時は判定の文で落とし、`null` を返す */
function figureOf(text: string): HTMLElement | null {
  const diagram = diagramOf(text);
  if (diagram === undefined) return null;
  const holder = document.createElement("div");
  holder.innerHTML = dragon.renderDiagram(diagram, { lang: "ja" }).svg;
  document.body.append(holder);
  const figure = holder.querySelector<HTMLElement>('[data-dragon="judge"]');
  expect(figure, "判定の表の根が無い").not.toBeNull();
  return figure;
}

/** 規則 `id` の見出しのセル */
const ruleHead = (root: ParentNode, id: string): HTMLElement | null => root.querySelector<HTMLElement>(`thead th[data-rule="${id}"]`);

/** `i` 番目 (0 から) の例の名前のセル */
const caseCell = (root: ParentNode, i: number): HTMLElement | null => root.querySelector<HTMLElement>(`tbody tr[data-case="${i}"] [data-dragon="judge-case"]`);

/** セル `cell` の札。セルが札の印を持たない時と札が無い時は `null` */
const cardFor = (host: ParentNode, cell: Element | null): HTMLElement | null => {
  const id = cell?.getAttribute("data-note");
  return id ? host.querySelector<HTMLElement>(`[data-dragon="note-card"][data-box="${id}"]`) : null;
};

/** 開いている札の名札 */
const openCards = (host: ParentNode): string[] => [...host.querySelectorAll('[data-dragon="note-card"][data-open]')].map((el) => el.getAttribute("data-box") ?? "");

/** 札の部品 `name` の字 */
const partOf = (card: Element | null, name: string): string | null => card?.querySelector(`[data-dragon="${name}"]`)?.textContent ?? null;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 要素の四角を決める。jsdom は画面の大きさを測らないので、押したセルと図の枠の四角を検査が渡す */
function placeAt(el: Element | null, rect: Rect): void {
  if (!el) return;
  const value = { ...rect, x: rect.left, y: rect.top, right: rect.left + rect.width, bottom: rect.top + rect.height, toJSON: () => rect };
  Object.defineProperty(el, "getBoundingClientRect", { configurable: true, value: () => value });
}

/** 図の枠の四角と、規則の見出しと例の名前のセルの四角。どれも枠の左上から測る */
const FRAME: Rect = { left: 20, top: 30, width: 800, height: 400 };
const CHAIN: Rect = { left: 240, top: 30, width: 120, height: 60 };
const TO: Rect = { left: 360, top: 30, width: 120, height: 60 };
const FIRST: Rect = { left: 20, top: 90, width: 220, height: 50 };
const SECOND: Rect = { left: 20, top: 140, width: 220, height: 50 };

/** 要素を押す。押した所から上の要素へ伝わる */
const press = (el: Element | null): void => {
  el?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
};

/** 図の枠とセル `cell` の四角を決めてから、セルを押す */
function pressCell(host: HTMLElement, cell: Element | null, rect: Rect): void {
  placeAt(host.querySelector(".dg-frame"), FRAME);
  expect(cell, "押すセルが無い").not.toBeNull();
  placeAt(cell, rect);
  press(cell);
}

/** 頁に置いた図。検査の終わりに外す */
const mounted: { destroy(): void }[] = [];
const hosts: HTMLElement[] = [];

/** 記法 `text` の図を頁に置く。置けない時は判定の文で落とし、`undefined` を返す */
function mount(text: string): { host: HTMLElement; player: dragon.Player } | undefined {
  const diagram = diagramOf(text);
  if (diagram === undefined) return undefined;
  const host = document.createElement("div");
  document.body.append(host);
  hosts.push(host);
  const player = dragon.mountDiagram(host, diagram, { lang: "ja" });
  mounted.push(player);
  return { host, player };
}

const isMedia = (rule: CSSRule): rule is CSSMediaRule => "media" in rule && "cssRules" in rule;
const isStyle = (rule: CSSRule): rule is CSSStyleRule => "selectorText" in rule && "style" in rule;

/** 見た目の規則 `sheet` の、画面の規則と印刷の形の規則 */
function rulesIn(sheet: CSSStyleSheet | null | undefined): { screen: CSSStyleRule[]; print: CSSStyleRule[] } {
  const all = [...(sheet?.cssRules ?? [])];
  return {
    screen: all.filter(isStyle),
    print: all
      .filter(isMedia)
      .filter((rule) => rule.media.mediaText.includes("print"))
      .flatMap((rule) => [...rule.cssRules].filter(isStyle)),
  };
}

/** 要素 `el` に当たる規則。`selectorText` が読めない規則は外す */
const matching = (rules: CSSStyleRule[], el: Element): CSSStyleRule[] =>
  rules.filter((rule) => {
    try {
      return el.matches(rule.selectorText);
    } catch {
      return false;
    }
  });

afterEach(() => {
  for (const player of mounted.splice(0)) player.destroy();
  for (const host of hosts.splice(0)) host.remove();
  document.body.innerHTML = "";
  document.documentElement.lang = "";
  vi.unstubAllGlobals();
});

describe("判定の表の説明の札 (#3890)", () => {
  it("judge-pop-rule-card-opens", () => {
    const placed = mount(table());
    if (!placed) return;
    const { host } = placed;
    const chain = ruleHead(host, "chain");
    expect(chain?.hasAttribute("data-note"), "note を持つチェーンの規則の見出しが押せる所になっていない").toBe(true);
    expect(openCards(host), "押す前に開いている札").toEqual([]);
    pressCell(host, chain, CHAIN);
    const card = cardFor(host, chain);
    expect(card, "チェーンの規則の見出しを押しても札が無い").not.toBeNull();
    expect(openCards(host), "チェーンの規則の見出しを押した後に開いている札").toEqual([chain?.getAttribute("data-note")]);
    // 札は番号と規則の名前と note の全文を持ち、example を書いた規則だけ例の帯を持つ
    expect(partOf(card, "note-name"), "規則の札の名前").toBe("1 チェーン");
    expect(partOf(card, "note-text"), "規則の札の本文").toBe(CHAIN_NOTE);
    expect(partOf(card, "note-example"), "example を書いた規則の札の例の帯").toBe("chainId 31337");
    // 札は見出しのすぐ下に、見出しと真ん中を揃えて出る。位置は図の枠の左上から測る
    const top = Number.parseFloat(card?.style.top ?? "");
    const left = Number.parseFloat(card?.style.left ?? "");
    const width = Number.parseFloat(card?.style.width ?? "");
    const bottom = CHAIN.top + CHAIN.height - FRAME.top;
    expect(top > bottom && top <= bottom + 16, `札の上端 (${top}) が見出しの下端 (${bottom}) のすぐ下に無い`).toBe(true);
    expect(Math.abs(left + width / 2 - (CHAIN.left + CHAIN.width / 2 - FRAME.left)), `札の真ん中 (${left + width / 2}) が見出しの真ん中に揃わない`).toBeLessThanOrEqual(1);
    // example を書かない宛先の規則の札は、例の帯を持たない
    const to = ruleHead(host, "to");
    pressCell(host, to, TO);
    expect(openCards(host), "宛先の規則の見出しを押した後に開いている札").toEqual([to?.getAttribute("data-note")]);
    expect(partOf(cardFor(host, to), "note-name"), "宛先の規則の札の名前").toBe("2 宛先");
    expect(partOf(cardFor(host, to), "note-example"), "example を書かない規則の札の例の帯").toBeNull();
  });

  it("judge-pop-case-card-opens", () => {
    const placed = mount(table());
    if (!placed) return;
    const { host } = placed;
    const first = caseCell(host, 0);
    expect(first?.hasAttribute("data-note"), "note を持つ 1 つ目の例の名前のセルが押せる所になっていない").toBe(true);
    pressCell(host, first, FIRST);
    const card = cardFor(host, first);
    expect(openCards(host), "1 つ目の例の名前を押した後に開いている札").toEqual([first?.getAttribute("data-note")]);
    expect(partOf(card, "note-name"), "例の札の名前").toBe("0x2222…へ20 USDC");
    expect(partOf(card, "note-text"), "例の札の本文").toBe("11/24 その日1件目");
    expect(partOf(card, "note-example"), "example を書いた例の札の例の帯").toBe("transfer 0x2222… 20 USDC");
    const top = Number.parseFloat(card?.style.top ?? "");
    const bottom = FIRST.top + FIRST.height - FRAME.top;
    expect(top > bottom && top <= bottom + 16, `札の上端 (${top}) が例の名前のセルの下端 (${bottom}) のすぐ下に無い`).toBe(true);
    // example を書かない 2 つ目の例の札は、例の帯を持たない
    const second = caseCell(host, 1);
    pressCell(host, second, SECOND);
    expect(openCards(host), "2 つ目の例の名前を押した後に開いている札").toEqual([second?.getAttribute("data-note")]);
    expect(partOf(cardFor(host, second), "note-text"), "2 つ目の例の札の本文").toBe("11/24 宛先が違う");
    expect(partOf(cardFor(host, second), "note-example"), "example を書かない例の札の例の帯").toBeNull();
  });

  it("judge-pop-case-note-moves-to-card", () => {
    const figure = figureOf(table());
    if (!figure) return;
    // 札で見せる表は、例の note を名前の下に描かない
    expect(figure.querySelectorAll('[data-dragon="judge-note"]').length, "札で見せる表が例の名前の下に添え書きを描いた").toBe(0);
    expect(figure.textContent ?? "", "札で見せる表が例の note の字を表に描いた").not.toContain("11/24 その日1件目");
    expect(caseCell(figure, 0)?.querySelector('[data-dragon="judge-case-name"]')?.textContent, "例の名前").toBe("0x2222…へ20 USDC");
  });

  it("judge-pop-mark-beside-name", () => {
    const figure = figureOf(table());
    if (!figure) return;
    const { screen } = rulesIn(figure.querySelector("style")?.sheet);
    const size = LOOK.note.badge * 2;
    const named: [string, HTMLElement | null, string][] = [
      ["チェーンの規則の見出し", ruleHead(figure, "chain"), "judge-rule-name"],
      ["宛先の規則の見出し", ruleHead(figure, "to"), "judge-rule-name"],
      ["1 つ目の例の名前", caseCell(figure, 0), "judge-case-name"],
      ["2 つ目の例の名前", caseCell(figure, 1), "judge-case-name"],
    ];
    for (const [what, cell, part] of named) {
      const mark = cell?.querySelector('[data-dragon="note-mark"]') ?? null;
      expect(mark, `${what} に i の丸が無い`).not.toBeNull();
      if (!cell || !mark) continue;
      const name = cell.querySelector(`[data-dragon="${part}"]`);
      // i の丸は名前のすぐ右に置く
      expect(name?.nextElementSibling, `${what} の i の丸が名前のすぐ後に無い`).toBe(mark);
      expect(Number(mark.getAttribute("width")), `${what} の i の丸の幅`).toBe(size);
      expect(Number(mark.getAttribute("height")), `${what} の i の丸の高さ`).toBe(size);
      // 名前と丸を包む所は、行の高さの真ん中で揃え、名前と丸の間を 5px 空ける
      const holder = mark.parentElement;
      const held = holder ? matching(screen, holder) : [];
      expect(
        held.some((rule) => rule.style.alignItems === "center"),
        `${what} の名前と i の丸を行の高さの真ん中で揃える規則が無い`,
      ).toBe(true);
      const gap = [...held.map((rule) => rule.style.gap), ...matching(screen, mark).map((rule) => rule.style.marginLeft)];
      expect(gap, `${what} の名前と i の丸の間が 5px でない`).toContain("5px");
    }
  });

  it("judge-pop-no-note-no-card", () => {
    const placed = mount(table());
    if (!placed) return;
    const { host } = placed;
    const once = ruleHead(host, "once");
    const last = caseCell(host, 2);
    for (const [what, cell] of [
      ["note を持たない 1回の規則の見出し", once],
      ["note を持たない 3 つ目の例の名前", last],
    ] as const) {
      expect(cell, `${what} が無い`).not.toBeNull();
      expect(cell?.hasAttribute("data-note"), `${what} が押せる所になった`).toBe(false);
      expect(cell?.querySelector('[data-dragon="note-mark"]') ?? null, `${what} が i の丸を持つ`).toBeNull();
      placeAt(host.querySelector(".dg-frame"), FRAME);
      placeAt(cell, CHAIN);
      press(cell);
      expect(openCards(host), `${what} を押した後に開いている札`).toEqual([]);
    }
  });

  it("judge-pop-row-cells-do-not-open", () => {
    const placed = mount(table());
    if (!placed) return;
    const { host } = placed;
    const row = host.querySelector('tbody tr[data-case="0"]');
    const cells = [...(row?.querySelectorAll<HTMLElement>("td") ?? [])];
    // 規則の 3 つのセルと判定のセル
    expect(cells.length, "1 つ目の例の行の名前より右のセルの数").toBe(4);
    for (const cell of cells) {
      expect(cell.closest("[data-note]"), `列 ${cell.getAttribute("data-col")} のセルが押せる所の中に在る`).toBeNull();
      placeAt(host.querySelector(".dg-frame"), FRAME);
      placeAt(cell, { left: 260, top: 90, width: 100, height: 50 });
      press(cell);
      expect(openCards(host), `列 ${cell.getAttribute("data-col")} のセルを押した後に開いている札`).toEqual([]);
    }
  });

  it("judge-pop-card-closes", () => {
    const placed = mount(table());
    if (!placed) return;
    const { host, player } = placed;
    player.goTo(0);
    const chain = ruleHead(host, "chain");
    const id = chain?.getAttribute("data-note");
    pressCell(host, chain, CHAIN);
    expect(openCards(host), "見出しを押した後に開いている札").toEqual([id]);
    // 札の中を押しても閉じず、札の外を押すと閉じる
    press(cardFor(host, chain)?.querySelector('[data-dragon="note-text"]') ?? null);
    expect(openCards(host), "札の中を押した後に開いている札").toEqual([id]);
    press(document.body);
    expect(openCards(host), "札の外を押した後に開いている札").toEqual([]);
    // 閉じるのアイコンを押すと閉じる
    pressCell(host, chain, CHAIN);
    press(cardFor(host, chain)?.querySelector('[data-dragon="note-close"]') ?? null);
    expect(openCards(host), "閉じるのアイコンを押した後に開いている札").toEqual([]);
    // 表を横に送ると閉じる
    pressCell(host, chain, CHAIN);
    const scroll = host.querySelector('[data-dragon="judge-scroll"]');
    expect(scroll, "表を横に送る枠が無い").not.toBeNull();
    scroll?.dispatchEvent(new Event("scroll"));
    expect(openCards(host), "表を横に送った後に開いている札").toEqual([]);
    // 段を送ると閉じる
    pressCell(host, chain, CHAIN);
    press(host.querySelector('[data-dragon="next"]'));
    expect(player.step, "次の段へ送った後の段").toBe(1);
    expect(openCards(host), "次の段へ送った後に開いている札").toEqual([]);
  });

  it("judge-pop-print-lists-all-cards", () => {
    // 規則 12 個の表は枠より広く、右の列は横に送らないと見えない
    const rules = Array.from({ length: 12 }, (_, i) => `rule r${i + 1} as 規則${i + 1} [value: 値${i + 1}, note: 規則${i + 1}の説明]`).join("\n");
    const placed = mount(`judge 規則の多い表 [note: pop]\n\n${rules}\n\ncase 全て通る例 [note: 例1の説明]\ncase 最後で外れる例 [note: 例2の説明]\n  fail r12: 外れ\n`);
    if (!placed) return;
    const { host } = placed;
    // 札は押す前から全ての規則と例の分を持ち、画面では閉じておく
    const cards = [...host.querySelectorAll<HTMLElement>('[data-dragon="note-card"]')];
    const names = cards.map((card) => partOf(card, "note-name"));
    expect(names, "印刷の前に持つ札の名前").toEqual([...Array.from({ length: 12 }, (_, i) => `${i + 1} 規則${i + 1}`), "全て通る例", "最後で外れる例"]);
    expect(openCards(host), "押す前に開いている札").toEqual([]);
    // 札の層は表の後ろに置き、表に重ねない
    const layer = host.querySelector('[data-dragon="notes"]');
    const figure = host.querySelector('[data-dragon="judge"]');
    expect(layer && figure && Boolean(figure.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING), "札の層が表の後ろに無い").toBe(true);
    expect(host.querySelector(".dg-player")?.hasAttribute("data-notes"), "再生の部品が札を持つ図の印を持たない").toBe(true);
    // 再生の部品の印刷の形の規則で、札の層を表の後ろに置いて全ての札を開く
    const { print } = rulesIn((document.getElementById("dragon-player-css") as HTMLStyleElement | null)?.sheet);
    expect(print.find((rule) => rule.selectorText.includes(".dg-notes"))?.style.position, "印刷の形の札の層が表の上に重なる").toBe("static");
    const shown = print.find((rule) => rule.selectorText.includes(".dg-nc") && !rule.selectorText.includes("[data-open]") && rule.style.display === "block");
    expect(shown, "印刷の形で閉じた札を開いて描く決まりが無い").toBeDefined();
  });

  it("judge-pop-page-default", async () => {
    vi.stubGlobal("__DRAGON_VERSION__", "0.87.0");
    const dir = mkdtempSync(join(tmpdir(), "dragon-judge-note-"));
    const fence = (text: string): string => `\`\`\`dragon\n${text}\`\`\``;
    // 1 行目に何も書かない表は頁の既定で札にし、[note: under] を書いた表は名前の下の字で見せる
    const page =
      "---\nnote: pop\n---\n\n# 送金の頁\n\n入口の字。\n\n" +
      `${fence(table({ head: "" }))}\n\n` +
      `${fence(table({ head: " [note: under]", chainExample: false, caseExample: false }))}\n`;
    writeFileSync(join(dir, "judge.md"), page);
    const result = await exportPage(join(dir, "judge.md"));
    expect(result.ok, `頁を書き出せない: ${JSON.stringify(result)}`).toBe(true);
    if (!result.ok) return;
    const written = new DOMParser().parseFromString(readFileSync(result.path, "utf8"), "text/html");
    document.documentElement.lang = "ja";
    document.body.innerHTML = written.body.innerHTML;
    for (const script of document.body.querySelectorAll("script")) script.remove();
    drawPageBlocks(document, () => Promise.resolve());
    for (let i = 0; i < 50 && document.querySelector("pre.dragon"); i++) await new Promise((done) => setTimeout(done, 0));
    expect([...document.querySelectorAll(".dragon-error")].map((e) => e.textContent), "頁の図の誤り").toEqual([]);
    const tables = [...document.querySelectorAll('[data-dragon="judge"]')];
    expect(tables.length, "頁に描いた判定の表の数").toBe(2);
    const [pop, under] = tables;
    expect(pop?.querySelectorAll("[data-note]").length, "頁の既定で札にした表の押せる所の数").toBe(4);
    expect(pop?.querySelectorAll('[data-dragon="judge-note"]').length, "頁の既定で札にした表が名前の下に添え書きを描いた").toBe(0);
    expect(under?.querySelectorAll("[data-note]").length, "[note: under] を書いた表の押せる所の数").toBe(0);
    expect(under?.querySelectorAll('[data-dragon="judge-note"]').length, "[note: under] を書いた表の名前の下の添え書きの数").toBe(2);
  });

  it("judge-pop-notation-round-trip", () => {
    const text = table();
    const diagram = diagramOf(text);
    if (diagram === undefined) return;
    const printed = dragon.printNotation(diagram as Parameters<typeof dragon.printNotation>[0]);
    const lines = printed.split("\n");
    expect(lines[0], "書き戻した 1 行目").toBe("judge どの送金を止めるのか [note: pop]");
    const chain = lines.find((line) => line.startsWith("rule chain "));
    expect(chain, "書き戻したチェーンの規則の行").toContain(`note: ${CHAIN_NOTE}`);
    expect(chain, "書き戻したチェーンの規則の行").toContain("example: chainId 31337");
    const first = lines.find((line) => line.startsWith("case 0x2222…へ20 USDC"));
    expect(first, "書き戻した 1 つ目の例の行").toContain("note: 11/24 その日1件目");
    expect(first, "書き戻した 1 つ目の例の行").toContain("example: transfer 0x2222… 20 USDC");
    // 書き戻した記法を読み直すと、同じ原本に戻る
    expect(diagramOf(printed), "書き戻した記法を読み直した原本").toEqual(diagram);
  });

  it("judge-example-without-pop-refused", () => {
    // 札で見せる表の note を持つ規則と例は example を書ける
    const parsed = dragon.parseNotation(table(), { lang: "ja" });
    expect(parsed.ok, `札で見せる表の example を断った: ${parsed.ok ? "" : parsed.errors[0]?.message}`).toBe(true);
    const cases: [string, string, number][] = [
      ["1 行目に何も書かない表の規則", table({ head: "", caseExample: false }), 3],
      ["1 行目に [note: under] を書いた表の規則", table({ head: " [note: under]", caseExample: false }), 3],
      ["1 行目に何も書かない表の例", table({ head: "", chainExample: false }), 7],
      ["札で見せる表の note を持たない規則", table({ chainExample: false, caseExample: false, onceExample: true }), 5],
      ["札で見せる表の note を持たない例", table({ chainExample: false, caseExample: false, lastExample: true }), 10],
    ];
    for (const [name, text, line] of cases) {
      for (const lang of ["ja", "en"] as const) {
        const read = dragon.parseNotation(text, { lang });
        expect(read.ok, `${name} の example を読んだ`).toBe(false);
        const error = read.ok ? undefined : read.errors[0];
        expect(error?.line, `${name} の example を断った行`).toBe(line);
        expect(error?.message ?? "", `${name} の example の断りの文 (${lang}) が札の見せ方を挙げない`).toMatch(/note: pop/u);
      }
    }
  });

  it("judge-rule-notes-below-table", () => {
    const figure = figureOf(table({ head: "", chainExample: false, caseExample: false }));
    if (!figure) return;
    // 札で見せない表は、note を持つ規則だけを表の下に書いた順に並べ、1 項は番号の丸と規則の名前と note の全文を持つ (#4008)
    const list = figure.querySelector('[data-dragon="judge-rule-notes"]');
    expect(list, "表の下の規則の note の並び").not.toBeNull();
    const items = [...(list?.querySelectorAll('[data-dragon="judge-rule-note-item"]') ?? [])];
    expect(
      items.map((item) => [item.getAttribute("data-rule"), partOf(item, "judge-rule-note-no"), partOf(item, "judge-rule-note-name"), partOf(item, "judge-rule-note")]),
      "表の下に並べた規則 (名札、番号、名前、note)",
    ).toEqual([
      ["chain", "1", "チェーン", CHAIN_NOTE],
      ["to", "2", "宛先", "宛先が許した0x2222…と同じか"],
    ]);
    // 並びは表の後に置き、表を横に送る枠の外に在る
    const scroll = figure.querySelector('[data-dragon="judge-scroll"]');
    expect(scroll && list && Boolean(scroll.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING), "規則の note の並びが表の後に無い").toBe(true);
    expect(list?.closest('[data-dragon="judge-scroll"]') ?? null, "規則の note の並びが表を横に送る枠の中に在る").toBeNull();
  });

  it("judge-rule-note-not-in-head", () => {
    const figure = figureOf(table({ head: "", chainExample: false, caseExample: false }));
    if (!figure) return;
    // 札で見せない表の見出しは、規則の note の字を持たない (#4008)。狭い列に長い字を折って詰めない
    for (const id of ["chain", "to", "once"]) {
      const head = ruleHead(figure, id);
      expect(head?.querySelector('[data-dragon="judge-rule-note"]') ?? null, `規則 ${id} の見出しの note の字`).toBeNull();
      expect(head?.textContent ?? "", `規則 ${id} の見出しの字`).not.toContain("宛先が許した");
      expect(head?.textContent ?? "", `規則 ${id} の見出しの字`).not.toContain(CHAIN_NOTE);
    }
    const chain = ruleHead(figure, "chain");
    expect(chain?.hasAttribute("data-note"), "札で見せない表の規則の見出しが押せる所になった").toBe(false);
    expect(chain?.querySelector('[data-dragon="note-mark"]') ?? null, "札で見せない表の規則の見出しが i の丸を持つ").toBeNull();
  });

  it("judge-pop-documented", () => {
    const read = (file: string): string => readFileSync(join(ROOT, file), "utf8");
    // 使い方の頁の札の段落は、札で見せる図の種類に判定の表を挙げる
    const docs = read("packages/dragon/src/blocks/pop/gallery/docs.ts");
    const [ja = "", en = ""] = docs.split(/\n\s*en: \[/u);
    expect(ja, "使い方の頁の札の段落 (日本語) が判定の表を挙げない").toContain("判定の表");
    expect(en, "使い方の頁の札の段落 (英語) が判定の表を挙げない").toMatch(/judge tables?/iu);
    // 手引きの判定の表の節は、[note: pop] の書き方を持ち、判定の下に外れた規則が並ぶとは書かない
    const section = (file: string, heading: string): string => {
      const text = read(file);
      const start = text.indexOf(heading);
      expect(start, `${file} に ${heading} の節が無い`).toBeGreaterThanOrEqual(0);
      const end = text.indexOf("\n### ", start + heading.length);
      return text.slice(start, end < 0 ? undefined : end);
    };
    const guideJa = section("packages/dragon/examples/quick-start.md", "### 判定の表");
    const guideEn = section("packages/dragon/examples/quick-start.en.md", "### Judge table");
    expect(guideJa, "手引き (日本語) の判定の表の節").toContain("[note: pop]");
    expect(guideEn, "手引き (英語) の判定の表の節").toContain("[note: pop]");
    expect(guideJa, "手引き (日本語) が判定の下に外れた規則が並ぶと書く").not.toContain("その下に外れた規則の番号と名前が並ぶ");
    expect(guideEn, "手引き (英語) が判定の下に外れた規則が並ぶと書く").not.toContain("numbers and names of the failed rules");
  });

  it("judge-rule-notes-documented", () => {
    // 手引きの判定の表の節の規則の行は、札で見せない表の規則の note を表の下に並べると書き、値の下に出すとは書かない (#4008)
    const ruleLine = (file: string, start: string): string => {
      const text = readFileSync(join(ROOT, file), "utf8");
      const line = text.split("\n").find((one) => one.startsWith(start)) ?? "";
      expect(line, `${file} に規則の行が無い`).not.toBe("");
      return line;
    };
    const ja = ruleLine("packages/dragon/examples/quick-start.md", "- `rule <名札> as <名前>");
    const en = ruleLine("packages/dragon/examples/quick-start.en.md", "- `rule <id> as <name>");
    expect(ja, "手引き (日本語) の規則の行").toContain("表の下");
    expect(ja, "手引き (日本語) の規則の行が値の下に出すと書く").not.toContain("値の下");
    expect(en, "手引き (英語) の規則の行").toContain("below the table");
    expect(en, "手引き (英語) の規則の行が値の下に出すと書く").not.toContain("under the value");
  });
});
