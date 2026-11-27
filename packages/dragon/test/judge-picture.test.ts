/**
 * 判定の表 (#3879) を `dragon export --format svg` で書き出した絵 (#3891)。
 *
 * 絵は表の枠、地、字、✓と✕、判定の札を SVG の要素で描き、`foreignObject` を使わない。
 * 例の名前と添え書きはその例の✓と✕の行の上の帯に置き、左の例の列を持たない。幅は 728px 以下で、字は読める大きさ (10.5px) 以上。
 * 帯の形でも 728px を超える表は、規則の列を分けて帯の形の表を縦に積む (`docs/adr/0015-judge-pictures-put-cases-on-bands.md`)。
 * 札で見せない表の規則の `note` は見出しに描かず、表の下 (段に分けた時は最後の段の後) に番号と名前と一緒に並べる (#4008)。
 *
 * 書き出しは file を読み込む段 (`at-load.ts`) で済ませ、件は書き出した SVG を読んで確かめる。
 * 確かめる元の印と値と判定の語は、同じ原本を頁の形 (HTML の表) で描いた物から読む。
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { parseNotation, renderDiagram } from "../src/core";
import "../src/kind-use/judge";
import { textWidth } from "../src/layout/measure";
import { READABLE_PX } from "../src/look/values";
import { textLang } from "../src/words";
import { atLoad } from "./at-load";
import { exampleText } from "./diagram-data";
import { exporter } from "./export-support";
import { colorsOf } from "./judge-pixels";

/** 判定の表の見本。日本語と英語の 4 組 */
const EXAMPLES = [
  "airdrop-check.dragon",
  "airdrop-check.en.dragon",
  "refund-check.dragon",
  "refund-check.en.dragon",
  "signup-check.dragon",
  "signup-check.en.dragon",
  "transfer-check.dragon",
  "transfer-check.en.dragon",
] as const;
/**
 * SVG と HTML を読む道具。書き出しは字の file を組む wasm を使い、jsdom の環境の大域では動かないので、
 * 検査の file は Node の環境で回し、読む道具だけを jsdom の窓から取る
 */
const { DOMParser } = new JSDOM("").window;
/** 絵の幅の上限 (CSS の px) */
const FRAME = 728;
/** 規則を 10 個書いた表。英語の規則の列は 1 つ 90px を超えるので、帯の形でも 728px を超える */
const WIDE = [
  "judge Ten checks on a transfer",
  ...Array.from(
    { length: 10 },
    (_, i) => `rule r${i + 1} as Check number ${i + 1} [value: up to ${(i + 1) * 100}]`,
  ),
  "case First transfer [note: every check passes]",
  "case Second transfer [note: the last check fails]",
  "  fail r10: 1200",
  "case Third transfer [note: two checks fail]",
  "  fail r2: 250",
  "  fail r7: 900",
].join("\n");
/**
 * 札で見せる表 (#3890)。チェーンと宛先の規則と、1 つ目と 2 つ目の例が note を持ち、1回の規則と 3 つ目の例は持たない
 */
const POP = [
  "judge どの送金を止めるのか [note: pop]",
  "rule chain as チェーン [value: 31337のUSDC, note: チェーンのIDとUSDCの契約を確かめる]",
  "rule to as 宛先 [value: 0x2222…, note: 宛先が許した0x2222…と同じか]",
  "rule once as 1回 [value: 30まで]",
  "case 0x2222…へ20 USDC [note: 11/24 その日1件目]",
  "case 0x9999…へ20 USDC [note: 11/24 宛先が違う]",
  "  fail to: 0x9999",
  "case 0x2222…へ35 USDC",
  "  fail once: 35",
].join("\n");
/** 札で見せない表の規則の note (#4008)。送金の見本のチェーンと宛先と1回と1日の規則が持ち、期限の規則は持たない */
const RULE_NOTES: Record<string, string> = {
  chain: "Txを出すチェーンのIDが31337で、送る物がそのチェーンのUSDCの契約か。読み解けないTxはここで照らせない",
  to: "宛先が許した0x2222…と同じか",
  once: "1回に送る額が30 USDC以下か",
  day: "その日に送った額の合計が100 USDC以下か",
};
/** 英語の送金の見本の規則の note。チェーンの note は表の幅で 2 行に折れる長さ */
const RULE_NOTES_EN: Record<string, string> = {
  chain: "The Tx runs on chain 31337 and sends the USDC contract of that chain so an unreadable Tx that does not say which contract it calls cannot be checked here and stops at this rule",
  to: "The recipient is the allowed 0x2222…",
  once: "One transfer sends 30 USDC or less",
  day: "The day's transfers add up to 100 USDC or less",
};
/** 規則 10 個の表の規則の note。1つ目と4つ目と10個目の規則だけが持つ */
const WIDE_NOTES: Record<string, string> = {
  r1: "The first check looks at the sender and the chain of the Tx",
  r4: "Only counts transfers of the same day",
  r10: "The last check compares the total with the yearly limit",
};
/** 規則の行 `rule <名札> as <名前> [value: <値>]` に note を足す */
function withRuleNotes(source: string, notes: Record<string, string>): string {
  return source
    .split("\n")
    .map((line) => {
      const m = /^rule (\S+) as (.*) \[value: (.*)\]$/u.exec(line);
      const note = m ? notes[m[1] as string] : undefined;
      return m && note !== undefined ? `rule ${m[1]} as ${m[2]} [value: ${m[3]}, note: ${note}]` : line;
    })
    .join("\n");
}
/** 色味と明るさを替えて書き出す見本と色味 */
const TINTED = { file: "transfer-check.en.dragon", palette: "sea", theme: "dark" } as const;

interface Written {
  /** 書き出した SVG の字。書かなかった時は空 */
  svg: string;
  /** 同じ原本を頁の形で描いた HTML */
  html: string;
}

/** 原本の字を読み、SVG に書き出した物と、頁の形で描いた HTML を返す。書き出しが落ちた時は理由を `svg` の代わりに投げる */
async function written(
  name: string,
  source: string,
  extra: { palette?: string; theme?: "light" | "dark" } = {},
): Promise<Written> {
  const parsed = parseNotation(source);
  if (!parsed.ok) throw new Error(`${name} を読めない`);
  const exportDiagram = await exporter();
  const outDir = mkdtempSync(join(tmpdir(), "dragon-judge-svg-"));
  // 書き出しは言葉を渡さない時に図の字の言葉で描くので、頁の形も同じ言葉で描いて比べる
  const lang = textLang(parsed.diagram);
  const result = await exportDiagram(parsed.diagram, {
    outDir,
    name: "judge",
    formats: ["svg"],
    ...extra,
  });
  const file = (result.files as Record<string, string | undefined>).svg;
  return {
    svg: file ? readFileSync(file, "utf8") : "",
    html: renderDiagram(parsed.diagram, { ...extra, lang }).svg,
  };
}

const WRITTEN = await atLoad("判定の表の見本を SVG に書き出す", async () => {
  const pairs = await Promise.all([
    ...EXAMPLES.map(async (file) => [file, await written(file, exampleText(file))] as const),
    (async () => ["wide", await written("wide", WIDE)] as const)(),
    // 札で見せない表で、規則が note を持つ表 (#4008)。送金の見本の日本語と英語と、規則 10 個の表に note を足す
    (async () => ["noted", await written("noted", withRuleNotes(exampleText("transfer-check.dragon"), RULE_NOTES))] as const)(),
    (async () => ["noted-en", await written("noted-en", withRuleNotes(exampleText("transfer-check.en.dragon"), RULE_NOTES_EN))] as const)(),
    (async () => ["noted-wide", await written("noted-wide", withRuleNotes(WIDE, WIDE_NOTES))] as const)(),
    // 札で見せる表は #3890 で読めるようになる。読めない間も見本の件を確かめられるよう、書き出せない時は空の SVG にする
    (async () => ["pop", await written("pop", POP).catch((): Written => ({ svg: "", html: "" }))] as const)(),
    (async () =>
      [
        "tinted",
        await written("tinted", exampleText(TINTED.file), {
          palette: TINTED.palette,
          theme: TINTED.theme,
        }),
      ] as const)(),
    (async () =>
      [
        "light",
        await written("light", exampleText(TINTED.file), {
          palette: TINTED.palette,
          theme: "light",
        }),
      ] as const)(),
  ]);
  return Object.fromEntries(pairs);
});

/** 書き出した SVG を読んだ文書。SVG を書かなかった時は落とす */
function svgOf(name: string): { doc: Document; root: SVGSVGElement; text: string } {
  const one = WRITTEN.get()[name];
  expect(one?.svg ?? "", `${name} の SVG を書かない`).not.toBe("");
  const doc = new DOMParser().parseFromString(one?.svg ?? "<svg/>", "image/svg+xml");
  expect(doc.querySelector("parsererror"), `${name} の SVG を XML として読めない`).toBeNull();
  return { doc, root: doc.documentElement as unknown as SVGSVGElement, text: one?.svg ?? "" };
}

/** 頁の形で描いた HTML の表 */
function tableOf(name: string): Document {
  return new DOMParser().parseFromString(WRITTEN.get()[name]?.html ?? "", "text/html");
}

/** 頁の表の行ごとの中身。セルの印と外れた値と判定の語 */
interface RowFacts {
  name: string;
  note?: string;
  marks: string[];
  values: (string | undefined)[];
  word: string;
}
function rowsOf(table: Document): RowFacts[] {
  return [...table.querySelectorAll("tbody tr")].map((row) => {
    const cells = [...row.querySelectorAll<HTMLElement>("td.dg-jc")];
    const note = row.querySelector('[data-dragon="judge-note"]')?.textContent ?? undefined;
    return {
      name: row.querySelector('[data-dragon="judge-case-name"]')?.textContent ?? "",
      ...(note === undefined ? {} : { note }),
      marks: cells.map(
        (cell) => cell.querySelector<HTMLElement>("[data-mark]")?.dataset.mark ?? "",
      ),
      values: cells.map(
        (cell) => cell.querySelector('[data-dragon="judge-value"]')?.textContent ?? undefined,
      ),
      word: row.querySelector('[data-dragon="judge-word"]')?.textContent ?? "",
    };
  });
}

/** 字の要素の大きさ。要素か祖先の `font-size` の値 */
function fontSizeOf(text: Element): number | undefined {
  for (let el: Element | null = text; el; el = el.parentElement) {
    const size = el.getAttribute("font-size");
    if (size !== null) return Number.parseFloat(size);
  }
  return undefined;
}

const textOf = (el: Element | null | undefined): string =>
  (el?.textContent ?? "").replace(/\s+/gu, " ").trim();
const num = (el: Element | null | undefined, name: string): number =>
  Number.parseFloat(el?.getAttribute(name) ?? "NaN");

describe("判定の表の SVG の絵 (#3891)", () => {
  it("judge-svg-draws-table-with-svg-elements", () => {
    for (const file of EXAMPLES) {
      const { doc, root } = svgOf(file);
      const rows = rowsOf(tableOf(file));
      expect([root.namespaceURI, root.localName], `${file} の根`).toEqual([
        "http://www.w3.org/2000/svg",
        "svg",
      ]);
      expect(doc.querySelector("foreignObject"), `${file} が foreignObject を持つ`).toBeNull();
      expect(
        [...doc.querySelectorAll("*")]
          .filter((el) => el.namespaceURI !== "http://www.w3.org/2000/svg")
          .map((el) => el.localName),
        `${file} の SVG でない要素`,
      ).toEqual([]);
      expect(
        doc.querySelectorAll('rect[data-dragon="judge-frame"]').length,
        `${file} の表の枠`,
      ).toBeGreaterThan(0);
      const marks = [...doc.querySelectorAll('[data-dragon="judge-mark"]')];
      expect(marks.length, `${file} のセルの印の数`).toBe(
        rows.reduce((sum, row) => sum + row.marks.length, 0),
      );
      const drawn = marks.filter((mark) => mark.getAttribute("data-mark") !== "skip");
      expect(
        drawn.filter((mark) => !mark.querySelector("path")).length,
        `${file} の✓と✕を path で描かない印`,
      ).toBe(0);
      const verdicts = [...doc.querySelectorAll('[data-dragon="judge-verdict"]')];
      expect(verdicts.length, `${file} の判定の札の数`).toBe(rows.length);
      expect(
        verdicts.filter((one) => !one.querySelector("rect") || !one.querySelector("text")).length,
        `${file} の地か字を持たない判定の札`,
      ).toBe(0);
    }
  });

  it("judge-picture-verdict-word-and-marks", () => {
    // 判定の札は語だけを持ち、外れた規則の番号と名前を持たない (#3890)
    for (const file of [...EXAMPLES, "pop"]) {
      const { doc } = svgOf(file);
      expect(doc.querySelectorAll('[data-dragon="judge-why"]').length, `${file} の判定の札の外れた規則`).toBe(0);
      for (const verdict of doc.querySelectorAll('[data-dragon="judge-verdict"]'))
        expect(textOf(verdict), `${file} の判定の札の字`).toBe(textOf(verdict.querySelector('[data-dragon="judge-word"]')));
    }
    // 札で見せる表は、例の note を名前の下に描かず、note を持つ規則と例の名前の右に i の丸を描く
    const { doc, text } = svgOf("pop");
    expect(doc.querySelectorAll('[data-dragon="judge-note"]').length, "札で見せる表の絵が例の名前の下に添え書きを描いた").toBe(0);
    expect(text, "札で見せる表の絵が例の note の字を描いた").not.toContain("11/24 その日1件目");
    const marked = (selector: string): boolean => doc.querySelector(selector)?.querySelector('[data-dragon="note-mark"]') != null;
    expect(
      ["chain", "to", "once"].map((id) => marked(`[data-dragon="judge-head"][data-rule="${id}"]`)),
      "i の丸を持つ規則の見出し (チェーン、宛先、1回)",
    ).toEqual([true, true, false]);
    expect(
      [0, 1, 2].map((i) => marked(`[data-dragon="judge-band"][data-case="${i}"]`)),
      "i の丸を持つ例の帯 (1 つ目、2 つ目、3 つ目)",
    ).toEqual([true, true, false]);
  });

  it("judge-svg-fills-every-cell-and-verdict", () => {
    for (const file of EXAMPLES) {
      const { doc } = svgOf(file);
      rowsOf(tableOf(file)).forEach((row, i) => {
        row.marks.forEach((mark, col) => {
          const cell = doc.querySelector(
            `[data-dragon="judge-cell"][data-case="${i}"][data-col="${col}"]`,
          );
          expect(
            cell?.querySelector('[data-dragon="judge-mark"]')?.getAttribute("data-mark"),
            `${file} の ${i + 1} 行目の ${col + 1} 列目の印`,
          ).toBe(mark);
          const value = row.values[col];
          if (value !== undefined)
            expect(
              textOf(cell?.querySelector('[data-dragon="judge-value"]')),
              `${file} の ${i + 1} 行目の ${col + 1} 列目の外れた値`,
            ).toBe(value);
        });
        const verdict = doc.querySelector(`[data-dragon="judge-verdict"][data-case="${i}"]`);
        expect(
          textOf(verdict?.querySelector('[data-dragon="judge-word"]')),
          `${file} の ${i + 1} 行目の判定の語`,
        ).toBe(row.word);
      });
    }
  });

  it("judge-svg-puts-cases-on-bands", () => {
    for (const file of EXAMPLES) {
      const { doc } = svgOf(file);
      expect(
        doc.querySelector('[data-dragon="judge-case-head"]'),
        `${file} が例の列の見出しを持つ`,
      ).toBeNull();
      const first = doc.querySelector(
        '[data-dragon="judge-head"][data-col="0"] [data-dragon="judge-no"]',
      );
      expect(num(first, "x"), `${file} の最初の規則の番号の丸の x (左に例の列が無い)`).toBeLessThan(
        100,
      );
      rowsOf(tableOf(file)).forEach((row, i) => {
        const band = doc.querySelector(`[data-dragon="judge-band"][data-case="${i}"]`);
        const name = band?.querySelector('[data-dragon="judge-case-name"]');
        expect(textOf(name), `${file} の ${i + 1} 行目の帯の例の名前`).toBe(row.name);
        const markYs = [
          ...doc.querySelectorAll(
            `[data-dragon="judge-cell"][data-case="${i}"] [data-dragon="judge-mark"]`,
          ),
        ].map((mark) => num(mark, "data-y"));
        expect(markYs.length, `${file} の ${i + 1} 行目の印`).toBeGreaterThan(0);
        expect(
          markYs.every((y) => num(name, "y") < y),
          `${file} の ${i + 1} 行目の帯 (y ${num(name, "y")}) が印 (y ${markYs.join(", ")}) の上に無い`,
        ).toBe(true);
        if (row.note === undefined) return;
        const note = band?.querySelector('[data-dragon="judge-note"]');
        expect(textOf(note), `${file} の ${i + 1} 行目の帯の添え書き`).toBe(row.note);
        expect(num(note, "y"), `${file} の ${i + 1} 行目の添え書きが名前と同じ行に無い`).toBe(
          num(name, "y"),
        );
        expect(
          num(note, "x") > num(name, "x"),
          `${file} の ${i + 1} 行目の添え書きが名前の右に無い`,
        ).toBe(true);
      });
    }
  });

  it("judge-svg-readable-at-728", () => {
    for (const file of EXAMPLES) {
      const { doc, root } = svgOf(file);
      expect(num(root, "width"), `${file} の SVG の幅`).toBeLessThanOrEqual(FRAME);
      expect(root.getAttribute("viewBox"), `${file} の viewBox`).toBe(
        `0 0 ${root.getAttribute("width")} ${root.getAttribute("height")}`,
      );
      expect(
        [...doc.querySelectorAll("[transform]")].filter((el) =>
          /scale|matrix/u.test(el.getAttribute("transform") ?? ""),
        ).length,
        `${file} の縮める変形`,
      ).toBe(0);
      const texts = [...doc.querySelectorAll("text")];
      expect(texts.length, `${file} の字`).toBeGreaterThan(0);
      const small = texts.flatMap((text) => {
        const size = fontSizeOf(text);
        return size === undefined || size < READABLE_PX
          ? [`${textOf(text)} (${size ?? "大きさ無し"})`]
          : [];
      });
      expect(small, `${file} の ${READABLE_PX}px に届かない字`).toEqual([]);
    }
  });

  it("judge-svg-stacks-wide-tables", () => {
    const { doc, root } = svgOf("wide");
    expect(num(root, "width"), "規則 10 個の表の SVG の幅").toBeLessThanOrEqual(FRAME);
    const blocks = [...doc.querySelectorAll('[data-dragon="judge-block"]')];
    expect(blocks.length, "規則 10 個の表の段の数").toBeGreaterThanOrEqual(2);
    const cols = blocks.flatMap((block) =>
      [...block.querySelectorAll('[data-dragon="judge-head"]')].map((head) =>
        Number(head.getAttribute("data-col")),
      ),
    );
    expect(cols, "段に分けた規則の列").toEqual(Array.from({ length: 10 }, (_, i) => i));
    blocks.forEach((block, b) => {
      expect(
        num(block.querySelector('rect[data-dragon="judge-frame"]'), "width"),
        `${b + 1} 段目の表の枠の幅`,
      ).toBeLessThanOrEqual(FRAME);
      expect(
        block.querySelectorAll('[data-dragon="judge-band"]').length,
        `${b + 1} 段目の例の帯の数`,
      ).toBe(3);
      expect(
        block.querySelectorAll('[data-dragon="judge-verdict-head"]').length,
        `${b + 1} 段目の判定の列の見出し`,
      ).toBe(b === blocks.length - 1 ? 1 : 0);
      expect(
        block.querySelectorAll('[data-dragon="judge-verdict"]').length,
        `${b + 1} 段目の判定の札`,
      ).toBe(b === blocks.length - 1 ? 3 : 0);
    });
  });

  it("judge-svg-embeds-fonts-offline", () => {
    for (const file of EXAMPLES) {
      const { text } = svgOf(file);
      expect(text.includes("@font-face"), `${file} の SVG が字の書体を埋めない`).toBe(true);
      const urls = [...text.matchAll(/url\(\s*["']?([^"')]+)/gu)].map((match) =>
        (match[1] ?? "").slice(0, 32),
      );
      expect(urls.length, `${file} の字の file の参照`).toBeGreaterThan(0);
      expect(
        urls.filter((url) => !url.startsWith("data:font/")),
        `${file} の data: でない参照`,
      ).toEqual([]);
      expect(
        text.match(/(?:href|src)\s*=\s*["']https?:/gu) ?? [],
        `${file} の外の URL を読む属性`,
      ).toEqual([]);
      expect(
        text.match(/https?:\/\/(?!www\.w3\.org\/)[^\s"')]+/gu) ?? [],
        `${file} の外の URL`,
      ).toEqual([]);
    }
  });

  it("judge-svg-follows-palette-and-theme", () => {
    const frameFill = (name: string): string =>
      (
        svgOf(name).doc.querySelector('rect[data-dragon="judge-frame"]')?.getAttribute("fill") ?? ""
      ).toLowerCase();
    const surf = (name: string): string =>
      (colorsOf(WRITTEN.get()[name]?.html ?? "")["--surf"] ?? "").toLowerCase();
    expect(surf("tinted"), "暗い色味の表の地の色").not.toBe("");
    expect(surf("tinted"), "暗い色味と明るい色味の地の色").not.toBe(surf("light"));
    expect(frameFill("tinted"), `${TINTED.palette} の暗い色味の SVG の表の地`).toBe(surf("tinted"));
    expect(frameFill("light"), `${TINTED.palette} の明るい色味の SVG の表の地`).toBe(surf("light"));
  });
});

/** 表の下に並べた規則の note の 1 項。名札と番号と名前と、折った行をつないだ note と、行ごとの字の要素 */
interface NoteItem {
  rule: string;
  no: string;
  name: string;
  note: string;
  lines: Element[];
}
function noteItemsOf(root: ParentNode): NoteItem[] {
  return [
    ...root.querySelectorAll('[data-dragon="judge-rule-notes"] [data-dragon="judge-rule-note-item"]'),
  ].map((item) => {
    const lines = [...item.querySelectorAll('[data-dragon="judge-rule-note"]')];
    return {
      rule: item.getAttribute("data-rule") ?? "",
      no: textOf(item.querySelector('[data-dragon="judge-rule-note-no"]')),
      name: textOf(item.querySelector('[data-dragon="judge-rule-note-name"]')),
      note: lines.map((line) => textOf(line)).join(" "),
      lines,
    };
  });
}
/** 空白を落とした字。折った行をつないだ note と、書いた note を比べる */
const squash = (s: string): string => s.replace(/\s+/gu, "");
/** 表の枠の上端と高さ。段ごとに 1 つ */
const framesOf = (doc: Document): number[][] =>
  [...doc.querySelectorAll('rect[data-dragon="judge-frame"]')].map((one) => [num(one, "y"), num(one, "height")]);
/** 表の枠の下端の一番下 */
const tableBottom = (doc: Document): number =>
  Math.max(...framesOf(doc).map(([y = 0, h = 0]) => y + h));

describe("判定の表の規則の note を表の下に並べる (#4008)", () => {
  it("judge-picture-rule-notes-below-table", () => {
    const { doc } = svgOf("noted");
    // 見出しは規則の note の字を描かない
    expect(
      doc.querySelectorAll('[data-dragon="judge-head"] [data-dragon="judge-rule-note"]').length,
      "見出しに描いた規則の note",
    ).toBe(0);
    // note を持つ規則だけを、書いた順に番号と名前と note の全文で並べる
    const items = noteItemsOf(doc);
    expect(
      items.map((item) => [item.rule, item.no, item.name]),
      "表の下に並べた規則 (名札、番号、名前)",
    ).toEqual([
      ["chain", "1", "チェーン"],
      ["to", "2", "宛先"],
      ["once", "3", "1回"],
      ["day", "4", "1日"],
    ]);
    for (const item of items)
      expect(squash(item.note), `${item.rule} の note`).toBe(squash(RULE_NOTES[item.rule] ?? ""));
    // 並びは表の枠の下に在り、表の枠は note を持たない見本の表と同じ高さのまま
    const bottom = tableBottom(doc);
    for (const line of doc.querySelectorAll('[data-dragon="judge-rule-notes"] text'))
      expect(num(line, "y"), "表の下の並びの字の基準線").toBeGreaterThan(bottom);
    expect(framesOf(doc), "note を持つ表の枠").toEqual(framesOf(svgOf("transfer-check.dragon").doc));
  });

  it("judge-picture-rule-notes-after-last-block", () => {
    const { doc } = svgOf("noted-wide");
    // 段の枠は note を持たない規則 10 個の表と同じで、note を持たない段の見出しも高くならない
    expect(framesOf(doc).length, "規則 10 個の表の段の数").toBeGreaterThanOrEqual(2);
    expect(framesOf(doc), "note を持つ規則 10 個の表の段の枠").toEqual(framesOf(svgOf("wide").doc));
    const items = noteItemsOf(doc);
    expect(
      items.map((item) => [item.rule, item.no]),
      "表の下に並べた規則 (名札、番号)",
    ).toEqual([
      ["r1", "1"],
      ["r4", "4"],
      ["r10", "10"],
    ]);
    // 並びは段の中でなく、最後の段の後にまとめて置く
    const group = doc.querySelector('[data-dragon="judge-rule-notes"]');
    expect(group?.closest('[data-dragon="judge-block"]') ?? null, "規則の note の並びが段の中に在る").toBeNull();
    const bottom = tableBottom(doc);
    for (const line of group?.querySelectorAll("text") ?? [])
      expect(num(line, "y"), "最後の段の後の並びの字の基準線").toBeGreaterThan(bottom);
  });

  it("judge-picture-rule-notes-readable", () => {
    for (const name of ["noted", "noted-en", "noted-wide"]) {
      const { doc, root } = svgOf(name);
      const width = num(root, "width");
      expect(width, `${name} の絵の幅`).toBeLessThanOrEqual(FRAME);
      const items = noteItemsOf(doc);
      expect(items.length, `${name} の表の下の規則の note`).toBeGreaterThan(0);
      for (const item of items) {
        // 折った行は同じ左端から始め、どの行も絵の幅を越えない
        expect(new Set(item.lines.map((line) => num(line, "x"))).size, `${name} の ${item.rule} の行の左端`).toBe(1);
        for (const line of item.lines) {
          const size = fontSizeOf(line) ?? 0;
          expect(size, `${name} の ${item.rule} の note の字の大きさ`).toBeGreaterThanOrEqual(READABLE_PX);
          const style = { size, weight: Number(line.getAttribute("font-weight") ?? 500), family: "sans" as const };
          expect(num(line, "x") + textWidth(textOf(line), style), `${name} の ${item.rule} の行の右端`).toBeLessThanOrEqual(width);
        }
        for (const part of ["judge-rule-note-no", "judge-rule-note-name"]) {
          const el = item.lines[0]?.closest('[data-dragon="judge-rule-note-item"]')?.querySelector(`[data-dragon="${part}"]`);
          expect(fontSizeOf(el ?? doc.documentElement) ?? 0, `${name} の ${item.rule} の ${part} の字の大きさ`).toBeGreaterThanOrEqual(READABLE_PX);
        }
      }
    }
    // 表の幅に収まらない長い note は、表の幅で折って 2 行以上にする
    const chain = noteItemsOf(svgOf("noted-en").doc).find((item) => item.rule === "chain");
    expect(chain?.lines.length ?? 0, "英語のチェーンの長い note の行数").toBeGreaterThanOrEqual(2);
    expect(squash(chain?.note ?? ""), "英語のチェーンの note を折った行をつないだ字").toBe(squash(RULE_NOTES_EN.chain ?? ""));
  });

  it("judge-pop-rule-notes-not-below", () => {
    // 札で見せる表は、頁でも静止画でも規則の note を表の下に並べず、i の丸の札で見せる (#3890)
    const { doc, text } = svgOf("pop");
    expect(doc.querySelector('[data-dragon="judge-rule-notes"]'), "札で見せる表の絵の表の下の並び").toBeNull();
    expect(text, "札で見せる表の絵が規則の note の字を描いた").not.toContain("チェーンのIDとUSDCの契約を確かめる");
    expect(tableOf("pop").querySelector('[data-dragon="judge-rule-notes"]'), "札で見せる表の頁の表の下の並び").toBeNull();
  });

  it("judge-case-notes-stay-on-band", () => {
    // 例の note は今のまま、絵では例の帯の名前の横に、頁では例の名前のセルに出し、表の下の並びに入れない
    const { doc } = svgOf("noted");
    const page = tableOf("noted");
    const bands = [...doc.querySelectorAll('[data-dragon="judge-band"] [data-dragon="judge-note"]')].map((one) => textOf(one));
    const cells = [...page.querySelectorAll('tbody [data-dragon="judge-case"] [data-dragon="judge-note"]')].map((one) => textOf(one));
    expect(cells.length, "頁の例の名前のセルの note").toBe(6);
    expect(bands, "絵の帯の例の note").toEqual(cells);
    expect(doc.querySelectorAll('[data-dragon="judge-rule-notes"] [data-dragon="judge-note"]').length, "絵の表の下の並びの例の note").toBe(0);
    expect(page.querySelectorAll('[data-dragon="judge-rule-notes"] [data-dragon="judge-note"]').length, "頁の表の下の並びの例の note").toBe(0);
  });
});
