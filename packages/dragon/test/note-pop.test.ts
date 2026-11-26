// @vitest-environment jsdom
/**
 * 箱の説明を、押すと箱のすぐ下に出る札で見せる (#3877)。
 *
 * 図の1行目に `[note: pop]` を書くと、`note` を持つ箱だけが右上に丸い i の印を持ち、名前の下に `note` の字を描かない。
 * 印の付いた箱を押すと、その箱のすぐ下に箱の名前と `note` の全文を持つ札が出て、箱に `[example: …]` を書いた時だけ札の下に例の帯が出る。
 * 札は札の外か閉じるのアイコンを押すと閉じ、段を送ると閉じる。印刷の形では全ての札を箱の下に開いて描く。
 * Markdown の頁の上の設定の行に `note: pop` を書くと頁の全ての図の既定になり、1行目に `[note: under]` を書いた図だけは今の形で描く。
 *
 * 画面の大きさを測れない jsdom では、押した箱と図の枠の四角を検査が決め、札をその四角から置く位置を確かめる。
 * 検査は種類を登録しない入口と、使う 3 つの種類の登録の file だけを読む (#3763)。
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./built-globals";
import * as dragon from "../src/core";
import "../src/kind-use/sequence";
import "../src/kind-use/architecture";
import "../src/kind-use/flow";
import { drawPageBlocks } from "../src/page-blocks";
import { exportPage } from "../src/page/export";

/** 3 つの図の種類。どれも同じ書き方で札の見せ方を選ぶ */
const KINDS = ["sequence", "architecture", "flow"] as const;

/** 長い説明。名前の下に描くと箱がこの字の幅まで広がる */
const LONG = "注文を受けて在庫を確かめ、倉庫に出荷の手配を頼んでから、利用者に受け付けたと返す";

/** 箱 3 つの図。店と銀行は `note` を持ち、倉庫は持たない。`head` は 1 行目の後ろに書く属性、`shop` は店の箱の属性 */
const notation = (kind: string, head = " [note: pop]", shop = `note: ${LONG}`): string =>
  `${kind} 注文${head}\n\nbox shop as 店 [${shop}]\nbox bank as 銀行 [note: 代金を預かる]\nbox store as 倉庫\n\n` +
  "step 頼む\n  say 店が銀行に代金を頼む。\n  shop -> bank: 代金\n\nstep 送る\n  say 銀行が倉庫に出荷してよいと伝える。\n  bank -> store: 出荷\n";

/** 記法を読んだ原本。読めない時は判定の文で落とし、`undefined` を返す */
function diagramOf(text: string, options: Parameters<typeof dragon.parseNotation>[1] = {}): unknown {
  const parsed = dragon.parseNotation(text, { lang: "ja", ...options });
  expect(parsed.ok, `記法を読めない: ${parsed.ok ? "" : parsed.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join(" / ")}`).toBe(true);
  return parsed.ok ? parsed.diagram : undefined;
}

/** 描いた SVG を要素にする */
function svgOf(markup: string): Element {
  const holder = document.createElement("div");
  holder.innerHTML = markup;
  return holder.querySelector("svg") ?? holder;
}

/** SVG の字。見た目の規則 (`<style>`) の中の字は数えない */
const textOf = (svg: Element): string => [...svg.querySelectorAll("text")].map((t) => t.textContent ?? "").join("\n");

/** 札の印を持つ箱の名札 */
const notedBoxes = (root: ParentNode): string[] => [...root.querySelectorAll("[data-note]")].map((el) => el.getAttribute("data-note") ?? "");

/** 札の印の丸。印を持つ箱の中の `circle` */
const badgeOf = (svg: Element, box: string): Element | null => svg.querySelector(`[data-note="${box}"] .dg-nb circle`);

interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
}

/** 描いた図の箱の並び */
const boxesOf = (rendered: { layout: unknown }): Box[] => (rendered.layout as { boxes: Box[] }).boxes;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 要素の四角を決める。jsdom は画面の大きさを測らないので、押した箱と図の枠の四角を検査が渡す */
function placeAt(el: Element | null, rect: Rect): void {
  if (!el) return;
  const value = { ...rect, x: rect.left, y: rect.top, right: rect.left + rect.width, bottom: rect.top + rect.height, toJSON: () => rect };
  Object.defineProperty(el, "getBoundingClientRect", { configurable: true, value: () => value });
}

/** 頁に置いた図。検査の終わりに外す */
const mounted: { destroy(): void }[] = [];
const hosts: HTMLElement[] = [];

/** 記法 `text` の図を頁に置く。置けない時は判定の文で落とし、`undefined` を返す */
function mount(text: string): { host: HTMLElement; player: dragon.Player } | undefined {
  const diagram = diagramOf(text);
  if (diagram === undefined) return undefined;
  const host = document.createElement("div");
  document.body.appendChild(host);
  hosts.push(host);
  const player = dragon.mountDiagram(host, diagram, { lang: "ja" });
  mounted.push(player);
  return { host, player };
}

/** 箱 `box` の札。札の無い時は `null` */
const cardOf = (host: ParentNode, box: string): HTMLElement | null => host.querySelector<HTMLElement>(`[data-dragon="note-card"][data-box="${box}"]`);

/** 開いている札の箱の名札 */
const openCards = (host: ParentNode): string[] => [...host.querySelectorAll('[data-dragon="note-card"][data-open]')].map((el) => el.getAttribute("data-box") ?? "");

/** 要素を押す。押した所から上の要素へ伝わる */
const press = (el: Element | null): void => {
  el?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
};

/** 図の枠の四角と箱の四角。箱は枠の左上から右へ 100、下へ 40 の所に在る */
const FRAME: Rect = { left: 20, top: 30, width: 800, height: 400 };
const SHOP: Rect = { left: 120, top: 70, width: 120, height: 72 };

/** 図の枠と箱 `box` の四角を決めてから、箱を押す */
function pressBox(host: HTMLElement, box: string, rect: Rect = SHOP): void {
  placeAt(host.querySelector(".dg-frame"), FRAME);
  const el = host.querySelector(`[data-note="${box}"]`);
  expect(el, `箱 ${box} に札の印が無く、押せない`).not.toBeNull();
  placeAt(el, rect);
  press(el);
}

afterEach(() => {
  for (const player of mounted.splice(0)) player.destroy();
  for (const host of hosts.splice(0)) host.remove();
  document.body.innerHTML = "";
  document.documentElement.lang = "";
  vi.unstubAllGlobals();
});

describe("箱の説明の札 (#3877)", () => {
  it("note-pop-badge-only-on-boxes-with-note", () => {
    const pop = diagramOf(notation("sequence"));
    const under = diagramOf(notation("sequence", ""));
    if (pop === undefined || under === undefined) return;
    const shown = dragon.renderDiagram(pop, { lang: "ja" });
    const plain = dragon.renderDiagram(under, { lang: "ja" });
    const svg = svgOf(shown.svg);
    // note を持つ店と銀行だけが印を持ち、note を持たない倉庫は持たない
    expect(notedBoxes(svg).sort(), "札の印を持つ箱").toEqual(["bank", "shop"]);
    // 印は箱の右上の内側に置く丸
    for (const box of boxesOf(shown).filter((b) => b.id !== "store")) {
      const circle = badgeOf(svg, box.id);
      expect(circle, `箱 ${box.id} の印の丸`).not.toBeNull();
      const cx = Number(circle?.getAttribute("cx"));
      const cy = Number(circle?.getAttribute("cy"));
      expect(cx > box.cx && cx < box.x + box.w, `箱 ${box.id} の印の x (${cx}) が箱の右の半分に無い`).toBe(true);
      expect(cy > box.y && cy < box.y + box.h / 2, `箱 ${box.id} の印の y (${cy}) が箱の上の半分に無い`).toBe(true);
    }
    // 名前は描き、note の字は名前の下に描かない
    expect(textOf(svg), "札で見せる図の箱の名前").toContain("店");
    expect(textOf(svg), "札で見せる図が名前の下に note の字を描いた").not.toContain(LONG);
    expect(textOf(svg), "札で見せる図が名前の下に note の字を描いた").not.toContain("代金を預かる");
    // 札で見せない図は今の形のまま、名前の下に note の字を描き、印を持たない
    expect(textOf(svgOf(plain.svg)), "札で見せない図の名前の下の字").toContain(LONG);
    expect(notedBoxes(svgOf(plain.svg)), "札で見せない図の札の印").toEqual([]);
    // 長い note の字の幅まで箱を広げない
    const width = (r: { layout: unknown }): number => boxesOf(r).find((b) => b.id === "shop")?.w ?? 0;
    expect(width(shown), "札で見せる図の店の箱の幅が、名前の下に字を描く図の幅より狭くない").toBeLessThan(width(plain));
  });

  it("note-pop-opens-card-under-box", () => {
    const placed = mount(notation("sequence"));
    if (!placed) return;
    const { host } = placed;
    expect(openCards(host), "押す前に開いている札").toEqual([]);
    pressBox(host, "shop");
    const card = cardOf(host, "shop");
    expect(card, "店の箱を押しても札が無い").not.toBeNull();
    expect(openCards(host), "店の箱を押した後に開いている札").toEqual(["shop"]);
    // 札は箱の名前と note の全文を持つ
    expect(card?.querySelector('[data-dragon="note-name"]')?.textContent, "札の箱の名前").toBe("店");
    expect(card?.querySelector('[data-dragon="note-text"]')?.textContent, "札の本文").toBe(LONG);
    // 札は箱のすぐ下に、箱と真ん中を揃えて出る。位置は図の枠の左上から測る
    const top = Number.parseFloat(card?.style.top ?? "");
    const left = Number.parseFloat(card?.style.left ?? "");
    const width = Number.parseFloat(card?.style.width ?? "");
    const bottom = SHOP.top + SHOP.height - FRAME.top;
    expect(top > bottom && top <= bottom + 16, `札の上端 (${top}) が箱の下端 (${bottom}) のすぐ下に無い`).toBe(true);
    expect(width, "札の幅").toBeGreaterThan(0);
    expect(Math.abs(left + width / 2 - (SHOP.left + SHOP.width / 2 - FRAME.left)), `札の真ん中 (${left + width / 2}) が箱の真ん中に揃わない`).toBeLessThanOrEqual(1);
  });

  it("note-pop-example-band-only-when-written", () => {
    const placed = mount(notation("sequence", " [note: pop]", `note: ${LONG}, example: 3個の注文を受けた日`));
    if (!placed) return;
    const { host } = placed;
    pressBox(host, "shop");
    const example = cardOf(host, "shop")?.querySelector('[data-dragon="note-example"]');
    expect(example, "example を書いた店の札に例の帯が無い").not.toBeNull();
    expect(example?.textContent, "例の帯の字").toBe("3個の注文を受けた日");
    // example を書かない銀行の札は例の帯を持たない
    pressBox(host, "bank", { left: 400, top: 70, width: 120, height: 72 });
    expect(openCards(host), "銀行の箱を押した後に開いている札").toEqual(["bank"]);
    expect(cardOf(host, "bank")?.querySelector('[data-dragon="note-example"]') ?? null, "example を書かない銀行の札の例の帯").toBeNull();
  });

  it("note-pop-closes-outside", () => {
    const placed = mount(notation("sequence"));
    if (!placed) return;
    const { host } = placed;
    pressBox(host, "shop");
    expect(openCards(host), "店の箱を押した後に開いている札").toEqual(["shop"]);
    // 札の中を押しても閉じない
    press(cardOf(host, "shop")?.querySelector('[data-dragon="note-text"]') ?? null);
    expect(openCards(host), "札の中を押した後に開いている札").toEqual(["shop"]);
    // 札の外を押すと閉じる
    press(document.body);
    expect(openCards(host), "札の外を押した後に開いている札").toEqual([]);
    // 閉じるのアイコンを押すと閉じる
    pressBox(host, "shop");
    const close = cardOf(host, "shop")?.querySelector('[data-dragon="note-close"]') ?? null;
    expect(close, "札に閉じるのアイコンが無い").not.toBeNull();
    press(close);
    expect(openCards(host), "閉じるのアイコンを押した後に開いている札").toEqual([]);
    // 別の箱を押すと、前の札を閉じて押した箱の札だけを開く
    pressBox(host, "shop");
    pressBox(host, "bank", { left: 400, top: 70, width: 120, height: 72 });
    expect(openCards(host), "店の札を開いたまま銀行の箱を押した後に開いている札").toEqual(["bank"]);
  });

  it("note-pop-closes-on-step", () => {
    const placed = mount(notation("sequence"));
    if (!placed) return;
    const { host, player } = placed;
    player.goTo(0);
    pressBox(host, "shop");
    expect(openCards(host), "店の箱を押した後に開いている札").toEqual(["shop"]);
    // 段を送らない操作 (流すと止めるの切り替え) では閉じない
    press(host.querySelector('[data-dragon="toggle"]'));
    press(host.querySelector('[data-dragon="toggle"]'));
    expect(player.step, "流して止めた後の段").toBe(0);
    expect(openCards(host), "段を送らずに流して止めた後に開いている札").toEqual(["shop"]);
    // 段を送ると閉じる
    press(host.querySelector('[data-dragon="next"]'));
    expect(player.step, "次の段へ送った後の段").toBe(1);
    expect(openCards(host), "次の段へ送った後に開いている札").toEqual([]);
    // 段を選んで移っても閉じる
    pressBox(host, "shop");
    player.goTo(0);
    expect(openCards(host), "段を選んで移った後に開いている札").toEqual([]);
  });

  it("note-pop-same-in-three-kinds", () => {
    /** 種類ごとの、印の丸の箱の右上からのずれと、札の中の部品の並び */
    const shapes: Record<string, { badge: [number, number]; parts: string[] }> = {};
    for (const kind of KINDS) {
      const diagram = diagramOf(notation(kind));
      if (diagram === undefined) continue;
      const rendered = dragon.renderDiagram(diagram, { lang: "ja" });
      const svg = svgOf(rendered.svg);
      expect(notedBoxes(svg).sort(), `${kind} の札の印を持つ箱`).toEqual(["bank", "shop"]);
      expect(textOf(svg), `${kind} が名前の下に note の字を描いた`).not.toContain(LONG);
      const box = boxesOf(rendered).find((b) => b.id === "shop");
      const circle = badgeOf(svg, "shop");
      expect(box && circle, `${kind} の店の箱の印`).toBeTruthy();
      const placed = mount(notation(kind));
      if (!placed || !box || !circle) continue;
      pressBox(placed.host, "shop");
      const card = cardOf(placed.host, "shop");
      expect(openCards(placed.host), `${kind} の店の箱を押した後に開いている札`).toEqual(["shop"]);
      expect(card?.querySelector('[data-dragon="note-text"]')?.textContent, `${kind} の札の本文`).toBe(LONG);
      // 座標は小数 2 桁に丸めて描くので、ずれは小数 1 桁で比べる
      const tenth = (n: number): number => Math.round(n * 10) / 10;
      shapes[kind] = {
        badge: [tenth(box.x + box.w - Number(circle.getAttribute("cx"))), tenth(Number(circle.getAttribute("cy")) - box.y)],
        parts: [...(card?.querySelectorAll("[data-dragon]") ?? [])].map((el) => el.getAttribute("data-dragon") ?? ""),
      };
    }
    // 3 つの種類で、印は箱の右上から同じ所に、札は同じ部品で出る
    expect(Object.keys(shapes), "印と札が出た図の種類").toEqual([...KINDS]);
    expect(shapes.architecture, "構成図の印と札が時系列図と違う").toEqual(shapes.sequence);
    expect(shapes.flow, "手順の図の印と札が時系列図と違う").toEqual(shapes.sequence);
  });

  it("page-note-pop-default-and-override", async () => {
    vi.stubGlobal("__DRAGON_VERSION__", "0.79.7");
    const dir = mkdtempSync(join(tmpdir(), "dragon-note-pop-"));
    const fence = (text: string): string => `\`\`\`dragon\n${text}\`\`\``;
    const page = (head: string): string =>
      `---\n${head}\n---\n\n# 注文の頁\n\n入口の字。\n\n` +
      // 1 行目に何も書かない図は頁の既定で札にし、札で見せる図だけが書ける example も書ける
      `${fence(notation("sequence", "", `note: ${LONG}, example: 3個の注文を受けた日`))}\n\n` +
      // 1 行目に [note: under] を書いた図は、頁の既定に関わらず名前の下の字で見せる
      `${fence(notation("architecture", " [note: under]"))}\n`;
    writeFileSync(join(dir, "notes.md"), page("note: pop"));
    const result = await exportPage(join(dir, "notes.md"));
    expect(result.ok, `頁を書き出せない: ${JSON.stringify(result)}`).toBe(true);
    // 頁の上の行の note に pop と under の外の値を書くと、行を名指して書き出すのを断る
    writeFileSync(join(dir, "bad.md"), page("note: side"));
    const refused = await exportPage(join(dir, "bad.md"));
    expect(refused.ok, "頁の上の行に note: side を書いた md を書き出した").toBe(false);
    expect(refused.ok ? [] : refused.errors.map((e) => e.line), "頁の上の行の note: side を断った行").toEqual([2]);
    if (!result.ok) return;
    // 書き出した頁の図を、頁の script の1行の入口と同じ処理で描く
    const written = new DOMParser().parseFromString(readFileSync(result.path, "utf8"), "text/html");
    document.documentElement.lang = "ja";
    document.body.innerHTML = written.body.innerHTML;
    for (const script of document.body.querySelectorAll("script")) script.remove();
    drawPageBlocks(document, () => Promise.resolve());
    for (let i = 0; i < 50 && document.querySelector("pre.dragon"); i++) await new Promise((done) => setTimeout(done, 0));
    expect([...document.querySelectorAll(".dragon-error")].map((e) => e.textContent), "頁の図の誤り").toEqual([]);
    const figures = [...document.querySelectorAll(".dragon-figure")];
    expect(figures.length, "頁に描いた図の数").toBe(2);
    const [first, second] = figures.map((figure) => figure.querySelector("svg") ?? figure);
    if (!first || !second) return;
    expect(notedBoxes(first).sort(), "頁の既定で札にした図の札の印").toEqual(["bank", "shop"]);
    expect(textOf(first), "頁の既定で札にした図が名前の下に note の字を描いた").not.toContain(LONG);
    expect(notedBoxes(second), "1 行目に [note: under] を書いた図の札の印").toEqual([]);
    expect(textOf(second), "1 行目に [note: under] を書いた図の名前の下の字").toContain(LONG);
  });

  it("note-pop-print-opens-all-cards", () => {
    const text = notation("sequence");
    const placed = mount(text);
    const diagram = diagramOf(text);
    if (!placed || diagram === undefined) return;
    const { host } = placed;
    const rendered = dragon.renderDiagram(diagram, { lang: "ja" });
    const { width, height } = rendered.layout as { width: number; height: number };
    // 札は押す前から全ての印の箱の分を持ち、画面では閉じておく
    const cards = [...host.querySelectorAll<HTMLElement>('[data-dragon="note-card"]')];
    expect(cards.map((card) => card.getAttribute("data-box")).sort(), "押す前に持つ札").toEqual(["bank", "shop"]);
    expect(openCards(host), "押す前に開いている札").toEqual([]);
    // 印刷の形では、閉じた札も箱の下に開いて描く。札の位置は図の幅と高さに対する箱の真ん中と下端の割合
    for (const card of cards) {
      const box = boxesOf(rendered).find((b) => b.id === card.getAttribute("data-box"));
      if (!box) continue;
      expect(Number.parseFloat(card.style.getPropertyValue("--nx")), `箱 ${box.id} の札の印刷の横の位置`).toBeCloseTo((box.cx / width) * 100, 1);
      expect(Number.parseFloat(card.style.getPropertyValue("--ny")), `箱 ${box.id} の札の印刷の縦の位置`).toBeCloseTo(((box.y + box.h) / height) * 100, 1);
    }
    // 再生の部品の見た目の規則を、頁の見た目の規則の読み方 (CSSOM) で読む
    const sheet = (document.getElementById("dragon-player-css") as HTMLStyleElement | null)?.sheet;
    const isMedia = (rule: CSSRule): rule is CSSMediaRule => "media" in rule && "cssRules" in rule;
    const isStyle = (rule: CSSRule): rule is CSSStyleRule => "selectorText" in rule && "style" in rule;
    const printRules = [...(sheet?.cssRules ?? [])]
      .filter((rule): rule is CSSMediaRule => isMedia(rule) && rule.media.mediaText.includes("print"))
      .flatMap((rule) => [...rule.cssRules])
      .filter((rule): rule is CSSStyleRule => isStyle(rule) && rule.selectorText.includes(".dg-nc") && !rule.selectorText.includes("[data-open]"));
    const shown = printRules.find((rule) => rule.style.display === "block");
    expect(shown, "印刷の形で閉じた札を開いて描く決まりが無い").toBeDefined();
    expect(shown?.style.getPropertyValue("left") ?? "", "印刷の形の札の横の位置").toContain("--nx");
    expect(shown?.style.getPropertyValue("top") ?? "", "印刷の形の札の縦の位置").toContain("--ny");
  });

  it("note-pop-print-lists-cards-below-figure", () => {
    const placed = mount(notation("sequence"));
    if (!placed) return;
    const { host } = placed;
    // 札は箱の名前を持ち、紙の上でどの箱の札かが読める
    const names: Record<string, string> = { shop: "店", bank: "銀行" };
    const cards = [...host.querySelectorAll<HTMLElement>('[data-dragon="note-card"]')];
    expect(cards.map((card) => card.getAttribute("data-box")).sort(), "印刷の前に持つ札").toEqual(["bank", "shop"]);
    for (const card of cards) {
      const id = card.getAttribute("data-box") ?? "";
      expect(card.querySelector('[data-dragon="note-name"]')?.textContent, `箱 ${id} の札の箱の名前`).toBe(names[id]);
    }
    // 再生の部品の見た目の規則を、頁の見た目の規則の読み方 (CSSOM) で読む
    const sheet = (document.getElementById("dragon-player-css") as HTMLStyleElement | null)?.sheet;
    const isMedia = (rule: CSSRule): rule is CSSMediaRule => "media" in rule && "cssRules" in rule;
    const isStyle = (rule: CSSRule): rule is CSSStyleRule => "selectorText" in rule && "style" in rule;
    const printRules = [...(sheet?.cssRules ?? [])]
      .filter((rule): rule is CSSMediaRule => isMedia(rule) && rule.media.mediaText.includes("print"))
      .flatMap((rule) => [...rule.cssRules])
      .filter((rule): rule is CSSStyleRule => isStyle(rule));
    // 印刷の形では、札の層を図の上に重ねず図の後ろに置き、札を層の中に並べる (#3956)
    const layer = printRules.find((rule) => rule.selectorText.includes(".dg-notes"));
    expect(layer?.style.position, "印刷の形の札の層が図の上に重なる").toBe("static");
    const shown = printRules.find((rule) => rule.selectorText.includes(".dg-nc") && !rule.selectorText.includes("[data-open]") && rule.style.display === "block");
    expect(shown, "印刷の形で閉じた札を開いて描く決まりが無い").toBeDefined();
    expect(shown?.style.position, "印刷の形の札が箱の上の位置に置かれる").toBe("static");
    expect(shown?.style.getPropertyValue("left") ?? "", "印刷の形の札の横の位置が箱の位置 (--nx) に依る").not.toContain("--nx");
    expect(shown?.style.getPropertyValue("top") ?? "", "印刷の形の札の縦の位置が箱の位置 (--ny) に依る").not.toContain("--ny");
  });

  it("note-mode-unknown-refused", () => {
    // pop と under は読め、ほかの値は 1 行目を名指して断る
    for (const mode of ["pop", "under"]) {
      const parsed = dragon.parseNotation(notation("sequence", ` [note: ${mode}]`), { lang: "ja" });
      expect(parsed.ok, `1 行目の [note: ${mode}] を断った: ${parsed.ok ? "" : parsed.errors[0]?.message}`).toBe(true);
    }
    for (const mode of ["side", "Pop"]) {
      for (const lang of ["ja", "en"] as const) {
        const parsed = dragon.parseNotation(notation("sequence", ` [note: ${mode}]`), { lang });
        expect(parsed.ok, `1 行目の [note: ${mode}] を読んだ`).toBe(false);
        const error = parsed.ok ? undefined : parsed.errors[0];
        expect(error?.line, `[note: ${mode}] を断った行`).toBe(1);
        expect(error?.message ?? "", `[note: ${mode}] の断りの文 (${lang}) が書ける値を挙げない`).toMatch(/pop[\s\S]*under/u);
      }
    }
  });

  it("example-without-pop-refused", () => {
    const example = `note: ${LONG}, example: 3個の注文を受けた日`;
    // 札で見せる図の note を持つ箱は example を書ける
    const parsed = dragon.parseNotation(notation("sequence", " [note: pop]", example), { lang: "ja" });
    expect(parsed.ok, `札で見せる図の example を断った: ${parsed.ok ? "" : parsed.errors[0]?.message}`).toBe(true);
    // 札で見せない図と、札で見せる図の note を持たない箱の example は、箱の行を名指して断る
    const cases: [string, string, string][] = [
      ["1 行目に何も書かない図", "", example],
      ["1 行目に [note: under] を書いた図", " [note: under]", example],
      ["札で見せる図の note を持たない箱", " [note: pop]", "example: 3個の注文を受けた日"],
    ];
    for (const [name, head, shop] of cases) {
      for (const lang of ["ja", "en"] as const) {
        const read = dragon.parseNotation(notation("sequence", head, shop), { lang });
        expect(read.ok, `${name} の example を読んだ`).toBe(false);
        const error = read.ok ? undefined : read.errors[0];
        expect(error?.line, `${name} の example を断った行`).toBe(3);
        expect(error?.message ?? "", `${name} の example の断りの文 (${lang}) が札の見せ方を挙げない`).toMatch(/note: pop/u);
      }
    }
  });
});
