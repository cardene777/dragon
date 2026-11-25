// @vitest-environment jsdom
/**
 * 判定の表 (`judge`、#3879)。
 *
 * 例を行に、規則を列に並べ、最後の列に行ごとの判定 (通すか止めるか) を置く表を、SVG でなく HTML の表で描く。字を縮めないため。
 * 記法は `judge <題>` で始め、`rule <名札> as <名前> [value: <値>]` で列の規則を、`case <名前> [note: <添え書き>]` で行の例を書く。
 * 例の下に `fail <規則の名札>: <外れた値>` を書いた規則のセルだけが✕になり、書かない規則のセルは✓になる。dragon は値を比べない。
 * `fail` の行に `[stop]` を書くと、その後の列のセルは照らせない印 (「—」) になる。1 行目の `[pass: <語>, block: <語>]` で判定の語を替えられる。
 * 再生すると、段の送り 1 回で規則の列を左から 1 列ずつ照らし、最後の送りで判定を出す。段の送りは再生の部品の釦をそのまま使う。
 * 見た目の元は step 2 で本人が選んだ見本 (基本の形、外れた理由の案2、規則が多い時の幅の案1、✕の後の列の「—」)。
 *
 * 表の部品は `data-dragon` の名前で探す。表の根は `judge`、横に送る枠は `judge-scroll`、例の列の見出しは `judge-case-head`、
 * 規則の見出しは `data-rule` を持つ `th` で番号 (`judge-no`) と名前 (`judge-rule-name`) と値 (`judge-rule-value`) を持つ。
 * 行は `data-case` (書いた順の番号) を持ち、例のセル (`judge-case`) は名前 (`judge-case-name`) と添え書き (`judge-note`) を持つ。
 * 規則のセルは `data-rule` と `data-col` (左から 0 で数えた列) を持ち、印 (`judge-mark`) の `data-mark` は `pass` (✓) か `fail` (✕) か `skip` (—)、
 * ✕のセルは外れた値 (`judge-value`) を持つ。判定のセル (`judge-verdict`) は判定の語 (`judge-word`、`data-verdict` は `pass` か `block`) と、
 * 止める例だけ外れた規則の並び (`judge-why`) を持つ。再生の部品は段を送るたびに表の根へ `data-play` を、照らした列のセルへ `data-on` を書く。
 *
 * 検査は種類を登録しない入口 (`src/core.ts`) と、判定の表の種類の登録の file だけを読む (#3763)。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import "./built-globals";
import * as dragon from "../src/core";
import "../src/kind-use/judge";

const ROOT = process.cwd();
/** 束ねて書き出す原本の形 */
const SCHEMA = join(ROOT, "packages/dragon/src/schemas/diagram.schema.json");

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 規則 5 つと例 6 つの表。外れる規則を持たない例が 1 つ、外れる規則を 1 つ持つ例が 4 つ、2 つ持つ例が 1 つ */
const BASIC = `judge どの送金を止めるのか

rule chain as チェーン [value: 31337のUSDC]
rule to as 宛先 [value: 0x2222…]
rule once as 1回 [value: 30まで]
rule day as 1日 [value: 計100まで]
rule until as 期限 [value: 12/31まで]

case 0x2222…へ20 USDC [note: 11/24 その日1件目]
case 0x9999…へ20 USDC [note: 11/24 宛先が違う]
  fail to: 0x9999
case 0x2222…へ35 USDC [note: 11/24 額が大きい]
  fail once: 35
case 0x2222…へ20 USDC [note: 11/24 その日6件目]
  fail day: 計120
case 0x2222…へ20 USDC [note: 2027/1/5 期限の後]
  fail until: 1/5
case 0x9999…へ35 USDC
  fail to: 0x9999
  fail once: 35
`;

/** 規則の名札と名前と値。書いた順 */
const RULES = [
  ["chain", "チェーン", "31337のUSDC"],
  ["to", "宛先", "0x2222…"],
  ["once", "1回", "30まで"],
  ["day", "1日", "計100まで"],
  ["until", "期限", "12/31まで"],
] as const;

/** 例ごとの、外れる規則の名札と外れた値。書いた順 */
const FAILS: [string, string][][] = [[], [["to", "0x9999"]], [["once", "35"]], [["day", "計120"]], [["until", "1/5"]], [["to", "0x9999"], ["once", "35"]]];

/** 照らせない例を持つ表。2 つ目の例はチェーンで外れて照らせないので、宛先から後の列を照らさない */
const STOPPED = `judge どの送金を止めるのか

rule chain as チェーン [value: 31337のUSDC]
rule to as 宛先 [value: 0x2222…]
rule once as 1回 [value: 30まで]

case 0x2222…へ20 USDC
case 読み解けないTx [note: 何をするか分からない]
  fail chain: ? [stop]
case 0x9999…へ35 USDC
  fail to: 0x9999
  fail once: 35
`;

/** 規則 `count` 個と例 2 つの表。規則の数に上限は無い */
const wide = (count: number): string =>
  `judge 規則の多い表\n\n${Array.from({ length: count }, (_, i) => `rule r${i + 1} as 規則${i + 1} [value: 値${i + 1}]`).join("\n")}\n\n` +
  `case 全て通る例\ncase 最後で外れる例\n  fail r${count}: 外れ\n`;

/** 記法を読んだ原本。読めない時は判定の文で落とし、`undefined` を返す */
function diagramOf(text: string, lang: "ja" | "en" = "ja"): Record<string, unknown> | undefined {
  const parsed = dragon.parseNotation(text, { lang });
  expect(parsed.ok, `判定の表の記法を読めない: ${parsed.ok ? "" : parsed.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join(" / ")}`).toBe(true);
  return parsed.ok ? (parsed.diagram as unknown as Record<string, unknown>) : undefined;
}

/** 描いた判定の表の根。描けない時は判定の文で落とし、`null` を返す */
function figureOf(text: string, options: { lang?: "ja" | "en"; width?: number } = {}): HTMLElement | null {
  const diagram = diagramOf(text, options.lang ?? "ja");
  if (diagram === undefined) return null;
  const rendered = dragon.renderDiagram(diagram, { lang: "ja", ...options });
  const holder = document.createElement("div");
  holder.innerHTML = rendered.svg;
  document.body.append(holder);
  const figure = holder.firstElementChild as HTMLElement | null;
  expect(figure?.tagName, "判定の表の根が HTML の要素でない").toBe("DIV");
  expect(figure?.getAttribute("data-dragon"), "判定の表の根の名前").toBe("judge");
  return figure;
}

/** `name` の部品の字 */
const textIn = (root: ParentNode | null | undefined, name: string): string => root?.querySelector(`[data-dragon="${name}"]`)?.textContent?.trim() ?? "";

/** 表の行。書いた順 */
const rowsOf = (figure: ParentNode): HTMLTableRowElement[] => [...figure.querySelectorAll<HTMLTableRowElement>("tbody tr[data-case]")];

/** 行の規則のセル。左から */
const cellsOf = (row: ParentNode): HTMLElement[] => [...row.querySelectorAll<HTMLElement>("td[data-rule]")];

/** セルの印 (`pass` か `fail` か `skip`) */
const markOf = (cell: Element): string => cell.querySelector('[data-dragon="judge-mark"]')?.getAttribute("data-mark") ?? "";

/** 頁に置いた図。検査の終わりに外す */
const mounted: { destroy(): void }[] = [];

afterEach(() => {
  for (const player of mounted.splice(0)) player.destroy();
  document.body.innerHTML = "";
});

/** 記法 `text` の図を頁に置く。置けない時は判定の文で落とし、`undefined` を返す */
function mount(text: string): { host: HTMLElement; player: dragon.Player } | undefined {
  const diagram = diagramOf(text);
  if (diagram === undefined) return undefined;
  const host = document.createElement("div");
  document.body.append(host);
  const player = dragon.mountDiagram(host, diagram, { lang: "ja" });
  mounted.push(player);
  return { host, player };
}

/** 要素を押す。押した所から上の要素へ伝わる */
const press = (el: Element | null): void => {
  el?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
};

const isMedia = (rule: CSSRule): rule is CSSMediaRule => "media" in rule && "cssRules" in rule;
const isStyle = (rule: CSSRule): rule is CSSStyleRule => "selectorText" in rule && "style" in rule;

/** 判定の表の見た目の規則。`print` は印刷の形の規則で、そのほかは画面の規則 (どの幅の画面でも効く規則) */
function rulesOf(figure: Element | null): { screen: CSSStyleRule[]; print: CSSStyleRule[]; media: CSSMediaRule[] } {
  const sheet = (figure?.querySelector("style") as HTMLStyleElement | null)?.sheet;
  expect(sheet, "判定の表が自分の見た目の規則 (style) を持たない").toBeTruthy();
  const all = [...(sheet?.cssRules ?? [])];
  const media = all.filter(isMedia);
  return {
    screen: all.filter(isStyle),
    print: media.filter((rule) => rule.media.mediaText.includes("print")).flatMap((rule) => [...rule.cssRules].filter(isStyle)),
    media,
  };
}

describe("判定の表 (#3879)", () => {
  it("judge-draws-html-table", () => {
    const figure = figureOf(BASIC);
    if (!figure) return;
    // SVG でなく HTML の表で描く
    expect(figure.closest("svg"), "判定の表が SVG の中に在る").toBeNull();
    const table = figure.querySelector("table");
    expect(table, "判定の表に table が無い").not.toBeNull();
    // 見出しの行は、例の列、規則 5 つの列、判定の列の順
    const heads = [...(table?.querySelectorAll("thead th") ?? [])];
    expect(heads.map((th) => th.getAttribute("data-dragon") ?? th.getAttribute("data-rule")), "見出しの列の並び").toEqual([
      "judge-case-head",
      ...RULES.map(([id]) => id),
      "judge-verdict-head",
    ]);
    // 規則の見出しは番号と名前と値を持つ
    RULES.forEach(([id, name, value], i) => {
      const th = table?.querySelector(`thead th[data-rule="${id}"]`);
      expect(textIn(th, "judge-no"), `規則 ${id} の見出しの番号`).toBe(String(i + 1));
      expect(textIn(th, "judge-rule-name"), `規則 ${id} の見出しの名前`).toBe(name);
      expect(textIn(th, "judge-rule-value"), `規則 ${id} の見出しの値`).toBe(value);
    });
    expect(textIn(table, "judge-case-head"), "例の列の見出し").toBe("例");
    expect(textIn(table, "judge-verdict-head"), "判定の列の見出し").toBe("判定");
    // 行は例 6 つで、どの行も例のセル、規則のセル 5 つ、判定のセルを持つ
    const rows = rowsOf(figure);
    expect(rows.length, "例の行の数").toBe(6);
    for (const [i, row] of rows.entries()) {
      expect(row.querySelector('[data-dragon="judge-case"]'), `${i + 1} 行目の例のセル`).not.toBeNull();
      expect(cellsOf(row).map((cell) => cell.getAttribute("data-rule")), `${i + 1} 行目の規則のセルの並び`).toEqual(RULES.map(([id]) => id));
      expect(row.lastElementChild?.getAttribute("data-dragon"), `${i + 1} 行目の最後のセル`).toBe("judge-verdict");
    }
    expect(textIn(rows[1], "judge-case-name"), "2 行目の例の名前").toBe("0x9999…へ20 USDC");
  });

  it("judge-fail-marks-only-written-rules", () => {
    const figure = figureOf(BASIC);
    if (!figure) return;
    const rows = rowsOf(figure);
    expect(rows.length, "例の行の数").toBe(FAILS.length);
    for (const [i, row] of rows.entries()) {
      const fails = new Map(FAILS[i]);
      for (const cell of cellsOf(row)) {
        const rule = cell.getAttribute("data-rule") ?? "";
        const failed = fails.get(rule);
        // fail を書いた規則のセルだけが✕と外れた値を持ち、書かない規則のセルは✓で値を持たない
        expect(markOf(cell), `${i + 1} 行目の規則 ${rule} のセルの印`).toBe(failed === undefined ? "pass" : "fail");
        expect(textIn(cell, "judge-value"), `${i + 1} 行目の規則 ${rule} のセルの外れた値`).toBe(failed ?? "");
      }
    }
  });

  it("judge-verdict-names-failed-rules", () => {
    const figure = figureOf(BASIC);
    if (!figure) return;
    for (const [i, row] of rowsOf(figure).entries()) {
      const verdict = row.querySelector('[data-dragon="judge-verdict"]');
      const word = verdict?.querySelector('[data-dragon="judge-word"]');
      const why = verdict?.querySelector('[data-dragon="judge-why"]') ?? null;
      const fails = FAILS[i] ?? [];
      if (fails.length === 0) {
        // 外れる規則を持たない例は通し、外れた規則を並べない
        expect(word?.getAttribute("data-verdict"), `${i + 1} 行目の判定`).toBe("pass");
        expect(word?.textContent?.trim(), `${i + 1} 行目の判定の語`).toBe("通す");
        expect(why, `${i + 1} 行目の通す判定の下の外れた規則`).toBeNull();
        continue;
      }
      // 外れる規則を持つ例は止め、判定の下に外れた規則の番号と名前を左の列から並べる
      expect(word?.getAttribute("data-verdict"), `${i + 1} 行目の判定`).toBe("block");
      expect(word?.textContent?.trim(), `${i + 1} 行目の判定の語`).toBe("止める");
      const named = [...(why?.querySelectorAll("[data-rule]") ?? [])].map((item) => [item.getAttribute("data-rule"), textIn(item, "judge-no"), textIn(item, "judge-rule-name")]);
      const wanted = fails.map(([id]) => {
        const at = RULES.findIndex(([rule]) => rule === id);
        return [id, String(at + 1), RULES[at]?.[1] ?? ""];
      });
      expect(named, `${i + 1} 行目の止める判定の下の外れた規則`).toEqual(wanted);
    }
  });

  it("judge-plays-column-by-column", () => {
    const placed = mount(BASIC);
    if (!placed) return;
    const { host, player } = placed;
    // 段は規則の列ごとに 1 つと、判定の 1 つ
    expect(host.querySelectorAll('[data-dragon="segment"]').length, "段の数").toBe(RULES.length + 1);
    const figure = host.querySelector<HTMLElement>('[data-dragon="judge"]');
    expect(figure, "再生の部品の枠に判定の表が無い").not.toBeNull();
    /** 照らしたセルの列。全ての行で同じでなければ落とす */
    const litColumns = (): number[] => {
      const perRow = rowsOf(figure ?? document).map((row) =>
        [...row.querySelectorAll("td[data-col]")].filter((cell) => cell.hasAttribute("data-on")).map((cell) => Number(cell.getAttribute("data-col"))),
      );
      expect(new Set(perRow.map((cols) => cols.join(","))).size, `行ごとに照らした列が違う: ${JSON.stringify(perRow)}`).toBe(1);
      return perRow[0] ?? [];
    };
    player.goTo(0);
    expect(figure?.hasAttribute("data-play"), "段を送る表が再生の印を持たない").toBe(true);
    expect(litColumns(), "段 1 で照らした列").toEqual([0]);
    expect(textIn(host, "step-title"), "段 1 の題").toBe("チェーン");
    for (let step = 1; step < RULES.length; step++) {
      press(host.querySelector('[data-dragon="next"]'));
      expect(player.step, `次へを ${step} 回押した後の段`).toBe(step);
      // 段の送り 1 回で、左から 1 列ずつ照らす。判定はまだ出さない
      expect(litColumns(), `段 ${step + 1} で照らした列`).toEqual(Array.from({ length: step + 1 }, (_, i) => i));
      expect(textIn(host, "step-title"), `段 ${step + 1} の題`).toBe(RULES[step]?.[1]);
    }
    // 最後の送りで判定を出す
    press(host.querySelector('[data-dragon="next"]'));
    expect(player.step, "最後の段").toBe(RULES.length);
    expect(litColumns(), "最後の段で照らした列").toEqual(Array.from({ length: RULES.length + 1 }, (_, i) => i));
    expect(textIn(host, "step-title"), "最後の段の題").toBe("判定");
    // 照らす前のセルの印と判定は画面で見せない
    const hidden = rulesOf(figure).screen.find(
      (rule) => rule.selectorText.includes("[data-play]") && rule.selectorText.includes(":not([data-on])") && rule.style.getPropertyValue("opacity") === "0",
    );
    expect(hidden, "照らす前のセルを見せない規則が無い").toBeDefined();
  });

  it("judge-stop-dashes-later-columns", () => {
    const figure = figureOf(STOPPED);
    if (!figure) return;
    const [first, stopped, both] = rowsOf(figure).map((row) => cellsOf(row).map((cell) => [markOf(cell), cell.textContent?.trim() ?? ""]));
    // [stop] を書いた規則の後の列は照らせない印の「—」にし、外れた規則は✕と値のまま
    expect(stopped, "[stop] を書いた行のセル").toEqual([
      ["fail", "?"],
      ["skip", "—"],
      ["skip", "—"],
    ]);
    // [stop] を書かない行は、外れた後の規則も照らす
    expect(first?.map(([mark]) => mark), "外れる規則を持たない行の印").toEqual(["pass", "pass", "pass"]);
    expect(both?.map(([mark]) => mark), "[stop] を書かずに 2 つ外れる行の印").toEqual(["pass", "fail", "fail"]);
    const verdict = rowsOf(figure)[1]?.querySelector('[data-dragon="judge-word"]');
    expect(verdict?.getAttribute("data-verdict"), "照らせない例の判定").toBe("block");
  });

  it("judge-case-note-under-name", () => {
    const figure = figureOf(STOPPED);
    if (!figure) return;
    const [plain, noted] = rowsOf(figure).map((row) => row.querySelector('[data-dragon="judge-case"]'));
    // note を書いた例は、名前の下に添え書きを出す
    expect(textIn(noted, "judge-case-name"), "添え書きを持つ例の名前").toBe("読み解けないTx");
    expect(textIn(noted, "judge-note"), "例の添え書き").toBe("何をするか分からない");
    const name = noted?.querySelector('[data-dragon="judge-case-name"]');
    const note = noted?.querySelector('[data-dragon="judge-note"]');
    expect(name && note && Boolean(name.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING), "添え書きが例の名前の後に無い").toBe(true);
    // note を書かない例は添え書きを持たない
    expect(textIn(plain, "judge-case-name"), "添え書きを持たない例の名前").toBe("0x2222…へ20 USDC");
    expect(plain?.querySelector('[data-dragon="judge-note"]') ?? null, "note を書かない例の添え書き").toBeNull();
  });

  it("judge-verdict-words-default-and-override", () => {
    const words = (figure: HTMLElement | null): string[] => rowsOf(figure ?? document).map((row) => textIn(row, "judge-word"));
    // 書かない時は、日本語の頁で通すと止める、英語の頁で pass と block
    expect(words(figureOf(STOPPED)), "日本語の頁の判定の語").toEqual(["通す", "止める", "止める"]);
    expect(words(figureOf(STOPPED, { lang: "en" })), "英語の頁の判定の語").toEqual(["pass", "block", "block"]);
    // 1 行目の [pass: 合格, block: 不合格] で、どちらの言葉の頁でも語が替わる
    const exam = STOPPED.replace("judge どの送金を止めるのか", "judge 試験の結果 [pass: 合格, block: 不合格]");
    expect(words(figureOf(exam)), "語を替えた日本語の頁の判定の語").toEqual(["合格", "不合格", "不合格"]);
    expect(words(figureOf(exam, { lang: "en" })), "語を替えた英語の頁の判定の語").toEqual(["合格", "不合格", "不合格"]);
  });

  it("judge-wide-table-scrolls-with-cases-kept", () => {
    const count = 12;
    for (const width of [960, 360]) {
      const figure = figureOf(wide(count), { width });
      if (!figure) return;
      // 規則の数に上限を置かず、狭い枠でも全ての列を同じ表に描く
      const row = rowsOf(figure)[0];
      expect(cellsOf(row ?? figure).length, `幅 ${width} の表の規則の列の数`).toBe(count);
      const scroller = figure.querySelector('[data-dragon="judge-scroll"]');
      expect(scroller?.contains(figure.querySelector("table")), `幅 ${width} の表を横に送る枠で包まない`).toBe(true);
      const { screen, media } = rulesOf(figure);
      // 枠の幅に収まらない表は、横に送る枠の中を送る
      const scroll = screen.find((rule) => rule.selectorText.includes(".dg-jw") && rule.style.getPropertyValue("overflow-x") === "auto");
      expect(scroll, "横に送る枠を送れる規則が無い").toBeDefined();
      // 例の列は左に留める。携帯の幅でも同じ形にするので、幅で替える規則に入れない
      const sticky = screen.find((rule) => rule.selectorText.includes(".dg-jk") && rule.style.getPropertyValue("position") === "sticky");
      expect(["0", "0px"], "例の列を左に留める規則の左の位置").toContain(sticky?.style.getPropertyValue("left"));
      const narrowed = media.filter((rule) => !rule.media.mediaText.includes("print")).flatMap((rule) => [...rule.cssRules].filter(isStyle));
      expect(
        narrowed.filter((rule) => rule.selectorText.includes(".dg-jk") || rule.selectorText.includes(".dg-jw")).map((rule) => rule.cssText),
        "幅で例の列と横に送る枠を替える規則",
      ).toEqual([]);
      const caseCells = [...figure.querySelectorAll("tr > :first-child")];
      expect(caseCells.length > 0 && caseCells.every((cell) => cell.classList.contains("dg-jk")), "例の列のセルが左に留める印を持たない").toBe(true);
      document.body.innerHTML = "";
    }
  });

  it("judge-print-fills-all-cells", () => {
    const placed = mount(BASIC);
    if (!placed) return;
    const { host, player } = placed;
    player.goTo(0);
    const figure = host.querySelector<HTMLElement>('[data-dragon="judge"]');
    // 照らす前の段でも、全てのセルの印と全ての判定を表に持つ
    const rows = rowsOf(figure ?? host);
    expect(rows.length, "例の行の数").toBe(FAILS.length);
    for (const [i, row] of rows.entries()) {
      expect(cellsOf(row).map(markOf).filter((mark) => mark === ""), `${i + 1} 行目の印の無いセル`).toEqual([]);
      expect(textIn(row, "judge-word"), `${i + 1} 行目の判定の語`).not.toBe("");
    }
    // 印刷の形では、照らしていないセルの印と判定も見せ、横に送らずに全ての列を描く
    const { print } = rulesOf(figure);
    const shown = print.find((rule) => rule.selectorText.includes(".dg-jm") && rule.selectorText.includes(".dg-jp") && rule.style.getPropertyValue("opacity") === "1");
    expect(shown, "印刷の形で全てのセルの印と判定を見せる規則が無い").toBeDefined();
    const unrolled = print.find((rule) => rule.selectorText.includes(".dg-jw") && rule.style.getPropertyValue("overflow") === "visible");
    expect(unrolled, "印刷の形で横に送る枠を開く規則が無い").toBeDefined();
    // 再生の部品を通さずに描いた表は、照らす前の印を持たず、全てを埋めた形になる
    const still = figureOf(BASIC);
    expect(still?.hasAttribute("data-play"), "描いただけの表が再生の印を持つ").toBe(false);
  });

  it("judge-text-readable-at-728", () => {
    const figure = figureOf(BASIC, { width: 728 });
    if (!figure) return;
    const { screen, print } = rulesOf(figure);
    const sizes = [...screen, ...print].flatMap((rule) => {
      const size = rule.style.getPropertyValue("font-size");
      return size === "" ? [] : [[rule.selectorText, size] as const];
    });
    expect(sizes.length, "判定の表の字の大きさを決める規則が無い").toBeGreaterThan(0);
    // 字は縮めない px の大きさで書き、どれも読める大きさ以上にする
    const small = sizes.filter(([, size]) => !/^\d+(?:\.\d+)?px$/u.test(size) || Number.parseFloat(size) < dragon.READABLE_PX);
    expect(small, `幅 728px の枠で ${dragon.READABLE_PX}px に届かないか px でない字`).toEqual([]);
    // 図を枠の幅へ縮める形 (SVG の viewBox や transform) を持たない
    expect(figure.querySelector("svg[viewBox]"), "判定の表が枠の幅へ縮む SVG を持つ").toBeNull();
    expect([...screen].filter((rule) => /scale|zoom/u.test(rule.style.getPropertyValue("transform") + rule.style.getPropertyValue("zoom"))).map((rule) => rule.selectorText), "判定の表を縮める規則").toEqual([]);
  });

  it("judge-schema-and-roundtrip", () => {
    const validate = dragon.validateDiagram;
    const diagram = diagramOf(BASIC);
    if (diagram === undefined) return;
    // 束ねた原本の形は、種類に judge を持ち、根の judge の欄に規則と例を持つ
    const schema = JSON.parse(readFileSync(SCHEMA, "utf8")) as { properties: { kind: { enum: string[] } } & Record<string, unknown> };
    expect(schema.properties.kind.enum, "原本の形の種類").toContain("judge");
    expect(schema.properties.judge, "原本の形の根の judge の欄").toBeDefined();
    expect(diagram.kind, "読んだ原本の種類").toBe("judge");
    const judge = diagram.judge as { rules?: unknown[]; cases?: unknown[] } | undefined;
    expect(judge?.rules?.length, "原本の規則の数").toBe(RULES.length);
    expect(judge?.cases?.length, "原本の例の数").toBe(FAILS.length);
    expect(validate(diagram), "読んだ原本を形の検査が受け付けない").toEqual({ ok: true });
    const json = JSON.parse(JSON.stringify(diagram)) as Record<string, unknown>;
    expect(validate(json), "写した原本の JSON を形の検査が受け付けない").toEqual({ ok: true });
    // 記法を読んで書き戻すと同じ記法に戻り、書き戻した記法を読むと同じ原本に戻る
    for (const text of [BASIC, STOPPED, STOPPED.replace("judge どの送金を止めるのか", "judge 試験の結果 [pass: 合格, block: 不合格]")]) {
      const read = diagramOf(text);
      if (read === undefined) continue;
      const printed = dragon.printNotation(read as unknown as Parameters<typeof dragon.printNotation>[0]);
      expect(printed.trimEnd(), "書き戻した記法").toBe(text.trimEnd());
      expect(diagramOf(printed), "書き戻した記法を読んだ原本").toEqual(read);
    }
    // 宣言していない規則を外れる規則に書いた原本と、規則の名札を持たない原本は断る
    type JudgeTable = { rules: { id?: string }[]; cases: { fails?: { rule: string }[] }[] };
    const unknown = structuredClone(json) as typeof json & { judge: JudgeTable };
    const failing = unknown.judge.cases.find((c) => (c.fails?.length ?? 0) > 0);
    if (failing?.fails?.[0]) failing.fails[0].rule = "nowhere";
    expect(validate(unknown).ok, "宣言していない規則を外れる規則に書いた原本を受け付けた").toBe(false);
    const nameless = structuredClone(json) as typeof json & { judge: JudgeTable };
    delete nameless.judge.rules[0]?.id;
    expect(validate(nameless).ok, "規則の名札を持たない原本を受け付けた").toBe(false);
  });

  it("judge-fail-unknown-or-twice-refused", () => {
      const unknown = BASIC.replace("  fail to: 0x9999\ncase 0x2222…へ35", "  fail dest: 0x9999\ncase 0x2222…へ35");
    const twice = BASIC.replace("  fail day: 計120", "  fail day: 計120\n  fail day: 計130");
    /** 誤りの行の番号。`text` の中で `line` の字を持つ行 */
    const lineOf = (text: string, line: string, nth = 0): number => text.split("\n").flatMap((l, i) => (l.trim() === line ? [i + 1] : []))[nth] ?? -1;
    const cases: [string, string, number, RegExp][] = [
      ["宣言していない規則の fail", unknown, lineOf(unknown, "fail dest: 0x9999"), /dest/u],
      ["同じ例の同じ規則の 2 度目の fail", twice, lineOf(twice, "fail day: 計130"), /day/u],
    ];
    for (const [name, text, line, word] of cases) {
      for (const lang of ["ja", "en"] as const) {
        const parsed = dragon.parseNotation(text, { lang });
        expect(parsed.ok, `${name} を読んだ (${lang})`).toBe(false);
        const error = parsed.ok ? undefined : parsed.errors[0];
        // その行を名指し、規則の名札を挙げる。日本語の頁は日本語の文、英語の頁は英語の文で断る
        expect(error?.line, `${name} を断った行 (${lang})`).toBe(line);
        expect(error?.message ?? "", `${name} の断りの文 (${lang}) が規則の名札を挙げない`).toMatch(word);
        expect(KANA.test(error?.message ?? ""), `${name} の断りの文 (${lang}) の言葉: ${error?.message}`).toBe(lang === "ja");
      }
    }
  });

  it("judge-fail-before-case-or-empty-refused", () => {
      const early = BASIC.replace("rule until as 期限 [value: 12/31まで]\n", "rule until as 期限 [value: 12/31まで]\n  fail to: 0x9999\n");
    const noRules = "judge 規則の無い表\n\ncase 0x2222…へ20 USDC\n";
    const noCases = "judge 例の無い表\n\nrule to as 宛先 [value: 0x2222…]\n";
    const earlyLine = early.split("\n").findIndex((l) => l.trim() === "fail to: 0x9999") + 1;
    const cases: [string, string, number, RegExp][] = [
      ["最初の case より前の fail", early, earlyLine, /case/u],
      ["規則が 1 つも無い表", noRules, 1, /rule/u],
      ["例が 1 つも無い表", noCases, 1, /case/u],
    ];
    for (const [name, text, line, word] of cases) {
      for (const lang of ["ja", "en"] as const) {
        const parsed = dragon.parseNotation(text, { lang });
        expect(parsed.ok, `${name} を読んだ (${lang})`).toBe(false);
        const error = parsed.ok ? undefined : parsed.errors[0];
        expect(error?.line, `${name} を断った行 (${lang})`).toBe(line);
        expect(error?.message ?? "", `${name} の断りの文 (${lang}) が書く行の語を挙げない`).toMatch(word);
        expect(KANA.test(error?.message ?? ""), `${name} の断りの文 (${lang}) の言葉: ${error?.message}`).toBe(lang === "ja");
      }
    }
  });
});
