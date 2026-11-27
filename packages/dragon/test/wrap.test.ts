/**
 * 字を折る幅の決まり (#4009、`docs/adr/0017-wrapped-text-keeps-16-chars.md`)。
 *
 * 並べ方で幅を測って折る SVG の字は、1 行に 16 字 (字の大きさの 16 倍) 入らない幅で折らない。
 * 狭い列に長い字を折ると、1 行が 2、3 語の短い行が縦に積み上がって字がごちゃつくため (#4008)。
 * 折った最後の行が 4 字に満たない時は、前の行の最後の句読点の後で折り直し、句読点が無ければ行数を変えずに行の長さを均す。
 * 字数は全角に直した数で、半角は 2 字で全角 1 字に数える。
 *
 * 描き方が字を折る所を広げたかは、描き方が字を折る処理 (`wrap`) に渡した幅で確かめる。処理を包んで、渡した幅と折った行を記録する。
 * 図を描く仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は記録を読んで確かめる。
 * 全ての見本を描いて確かめる件と、`dragon check --layout` の件は、全ての種類を読む崩れの検査 (`layout-check.test.ts`) が持つ。
 * この file は列の図と判定の表の種類だけを読み、関係する検査を選ぶ命令がほかの種類の変更で選ばないようにする
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseNotation, renderDiagram } from "../src/core";
import "../src/kind-use/judge";
import "../src/kind-use/lineup";
import type { LineupLayout, LineupText } from "../src/kinds/lineup/layout";
import { hasWide, textWidth } from "../src/layout/measure";
import { wrap } from "../src/layout/wrap";
import { TYPE, type TextStyle } from "../src/look/values";
import { atLoad } from "./at-load";

/** 描き方が字を折る処理に渡した字と字の大きさと幅、折った行 */
interface WrapCall {
  text: string;
  size: number;
  width: number;
  lines: string[];
}

const recorded = vi.hoisted((): WrapCall[] => []);

// 字を折る処理を包み、描き方が渡した幅と折った行を記録する。折り方そのものは元の処理のまま
vi.mock("../src/layout/wrap", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/layout/wrap")>();
  return {
    ...real,
    wrap: (text: string, style: TextStyle, width: number): string[] => {
      const lines = real.wrap(text, style, width);
      recorded.push({ text, size: style.size, width, lines });
      return lines;
    },
  };
});

const ROOT = join(process.cwd(), "packages/dragon");
/** 1 行に入れる字数の下限と、最後の行の字数の下限 (決めた値、ADR 0017) */
const LEAST = 16;
const LAST = 4;
/** 段の本文の字。字の大きさは 12.5px で、16 字の幅は 200px */
const SAY = TYPE.lineupSay;
const SAY_LEAST = LEAST * SAY.size;

/** 全角に直した字数。和文の字は 1 字、ほかの字 (欧文と空白) は半字に数える */
const chars = (line: string): number => [...line].reduce((n, ch) => n + (hasWide(ch) ? 1 : 0.5), 0);

/** `work` の間に字を折る処理へ渡された記録 */
function callsDuring<T>(work: () => T): { value: T; calls: WrapCall[] } {
  recorded.length = 0;
  const value = work();
  return { value, calls: recorded.splice(0) };
}

/** 記法を読んだ原本。読めなければ断りを挙げて投げる */
function diagramOf(text: string, lang: "ja" | "en"): unknown {
  const parsed = parseNotation(text, { lang });
  if (!parsed.ok) throw new Error(`記法を読めない: ${JSON.stringify(parsed.errors)}`);
  return parsed.diagram;
}

/** 記法を描いた結果と、描く間に字を折る処理へ渡された記録 */
function drawn(
  text: string,
  lang: "ja" | "en",
  width?: number,
): { layout: LineupLayout; svg: string; calls: WrapCall[] } {
  const diagram = diagramOf(text, lang);
  const { value, calls } = callsDuring(() =>
    renderDiagram(diagram, { lang, ...(width === undefined ? {} : { width }) }),
  );
  return { layout: value.layout as LineupLayout, svg: value.svg, calls };
}

/** 部品の図の記法。部品の図はブロックの置き場の `gallery/` に在る */
const partText = (block: string, file: string): string =>
  readFileSync(join(ROOT, "src/blocks", block, "gallery", file), "utf8");
const exampleText = (file: string): string => readFileSync(join(ROOT, "examples", file), "utf8");

describe("字を折る処理は 16 字より狭い幅で折らない (#4009)", () => {
  it("wrap-keeps-16-chars", () => {
    const texts = [
      "source gives a step a source name and url. A step can have any number of them.",
      "item で、列に並べるチップを最初の step より前に宣言する。color で色を付ける。",
    ];
    for (const text of texts) {
      const at16 = wrap(text, SAY, SAY_LEAST);
      expect(at16.length, `${text} が 16 字の幅で 2 行以上に折れない`).toBeGreaterThan(1);
      // 16 字より狭い幅 (列が 1 つの列の図の段の本文の 13.3 字、ほぼ 0、境の直前) を渡しても、16 字の幅で折った行と同じになる
      for (const width of [166, 1, 0, SAY_LEAST - 0.1])
        expect(wrap(text, SAY, width), `${text} を幅 ${width} で折った行`).toEqual(at16);
    }
    // 字の大きさが違えば 16 字の幅も違う。凡例の字 (11px) の 16 字は 176px
    const legend = "Item notes appear in the legend under the diagram, one row per note.";
    expect(wrap(legend, TYPE.legend, 120), "凡例の字を幅 120 で折った行").toEqual(
      wrap(legend, TYPE.legend, LEAST * TYPE.legend.size),
    );
  });
});

describe("最後の行が 4 字に満たない時は折り直す (#4009)", () => {
  it("wrap-rebreaks-short-last-line-at-punctuation", () => {
    const width = 347.5;
    expect(
      wrap("列から外したチップは消える。1列に並べられるのは12枚まで。", SAY, width),
      "句点の後で折り直す",
    ).toEqual(["列から外したチップは消える。", "1列に並べられるのは12枚まで。"]);
    expect(
      wrap("A chip left out of a lane disappears. A lane holds up to 12 chips.", SAY, width),
      "英語の句点の後で折り直す",
    ).toEqual(["A chip left out of a lane disappears.", "A lane holds up to 12 chips."]);
    // 前の行の最後の句読点が読点の時は、読点の後で折り直す
    expect(wrap("列を広げて描くので、名前の字を折らない", SAY, 205), "読点の後で折り直す").toEqual([
      "列を広げて描くので、",
      "名前の字を折らない",
    ]);
  });

  it("wrap-evens-lines-without-punctuation", () => {
    // 前から詰めると最後の行が「value.」「と本文」「の本文」だけになる字。3 つ目は読点の後で折ると後ろの 17 字が 16 字の幅に収まらない
    const cases: [string, number][] = [
      ["tag on set adds a tag to the field value.", 236],
      ["字を折る幅を広げて描く列の図の段と本文", 205],
      ["で、字を折る幅を広げて描く列の図の本文", 205],
    ];
    for (const [text, width] of cases) {
      const lines = wrap(text, SAY, width);
      expect(lines.length, `${text} の行数は前から詰めた時と同じ 2 行`).toBe(2);
      expect(
        chars(lines.at(-1) ?? ""),
        `${text} の最後の行「${lines.at(-1)}」の字数`,
      ).toBeGreaterThanOrEqual(LAST);
      for (const line of lines)
        expect(
          textWidth(line, SAY),
          `${text} の行「${line}」は幅 ${width} に収まる`,
        ).toBeLessThanOrEqual(width);
      expect(lines.join(hasWide(text) ? "" : " "), `${text} の字を落とさない`).toBe(text);
    }
  });

  it("wrap-keeps-greedy-lines-when-last-line-is-long", () => {
    const width = 347.5;
    expect(
      wrap(
        "ほかの列に居たチップは、その席から滑って来る。元の列を書かなければ、元の席にも残る。",
        SAY,
        width,
      ),
    ).toEqual([
      "ほかの列に居たチップは、その席から滑って来る。元の列を",
      "書かなければ、元の席にも残る。",
    ]);
    expect(
      wrap(
        "Each box line becomes a lane, stacked top to bottom in the order declared, all the same width.",
        SAY,
        width,
      ),
    ).toEqual([
      "Each box line becomes a lane, stacked top to bottom in",
      "the order declared, all the same width.",
    ]);
    // 最後の行がちょうど 4 字なら折り直さない
    expect(wrap("字を折る幅を広げて描く列の図の段の本文。", SAY, 205)).toEqual([
      "字を折る幅を広げて描く列の図の段",
      "の本文。",
    ]);
  });

  it("wrap-keeps-one-line-text", () => {
    const text = "段は1つずつ送って見る。";
    const width = textWidth(text, SAY);
    expect(width, "16 字より狭い字").toBeLessThan(SAY_LEAST);
    for (const w of [width, width + 5, SAY_LEAST])
      expect(wrap(text, SAY, w), `幅 ${w}`).toEqual([text]);
    expect(wrap("短い字", SAY, 40)).toEqual(["短い字"]);
  });
});

/** 列が 1 つの列の図の部品 (段の本文を折る) */
const ONE_LANE = [
  {
    name: "parts/step.lineup.dragon",
    text: partText("step", "step.lineup.dragon"),
    lang: "ja" as const,
  },
  {
    name: "parts/step.lineup.en.dragon",
    text: partText("step", "step.lineup.en.dragon"),
    lang: "en" as const,
  },
];
const ONE_LANE_DRAWN = await atLoad("列が 1 つの列の図の部品を描く", () =>
  ONE_LANE.map((one) => ({ ...one, ...drawn(one.text, one.lang) })),
);

describe("列が 1 つの列の図は段の題と本文を 16 字以上の幅で折る (#4009)", () => {
  it("lineup-one-lane-wraps-step-text-at-16-chars", () => {
    for (const { name, layout, calls } of ONE_LANE_DRAWN.get()) {
      const texts = new Set(
        layout.headlines.flatMap((h) => [h.title.text, ...(h.say ? [h.say.text] : [])]),
      );
      const mine = calls.filter((call) => texts.has(call.text) && call.lines.length > 1);
      expect(mine.length, `${name} の段の本文を 2 行以上に折らない`).toBeGreaterThan(0);
      for (const call of mine)
        expect(
          call.width / call.size,
          `${name} の「${call.text}」を折った幅 (字数)`,
        ).toBeGreaterThanOrEqual(LEAST);
      // 折った字は図の枠の中 (左右の余白の内側) に収まる
      const right = layout.width - (layout.headlines[0]?.title.x ?? 0);
      const fit = (t: LineupText | undefined, style: TextStyle): string[] =>
        (t?.lines ?? [])
          .filter((line) => line.x + textWidth(line.text, style) > right + 0.5)
          .map((line) => line.text);
      for (const h of layout.headlines)
        expect(
          [...fit(h.title, TYPE.lineupHead), ...fit(h.say, SAY)],
          `${name} の枠をはみ出す行`,
        ).toEqual([]);
    }
  });
});

/** 段の題と本文を今の幅のまま 16 字以上の幅で折れる列の図と、今の幅 */
const WIDE = [
  {
    name: "parts/line.lineup.dragon",
    text: partText("line", "line.lineup.dragon"),
    lang: "ja" as const,
    width: 388,
  },
  {
    name: "parts/line.lineup.en.dragon",
    text: partText("line", "line.lineup.en.dragon"),
    lang: "en" as const,
    width: 388,
  },
  {
    name: "parts/color.lineup.dragon",
    text: partText("color", "color.lineup.dragon"),
    lang: "ja" as const,
    width: 388,
  },
  {
    name: "examples/kanban.en.dragon",
    text: exampleText("kanban.en.dragon"),
    lang: "en" as const,
    width: 762.7,
  },
];
const WIDE_DRAWN = await atLoad("今の幅で 16 字以上に折れる列の図を描く", () =>
  WIDE.map((one) => ({ ...one, drawnWidth: drawn(one.text, one.lang).layout.width })),
);

describe("今の幅で 16 字以上に折れる列の図は幅を変えない (#4009)", () => {
  it("lineup-wide-figures-keep-width", () => {
    for (const { name, width, drawnWidth } of WIDE_DRAWN.get())
      expect(drawnWidth, `${name} の幅`).toBeCloseTo(width, 1);
  });
});

/** 規則の名前が長く、`note` を名前の右の狭い所に折る判定の表 */
const LONG_RULE = [
  "judge Rules with long names",
  "rule to as The recipient address must already be on the allow list that the sending wallet keeps [note: checked against the list the owner signed before sending]",
  "rule once as Once [value: up to 30]",
  "case First transfer",
  "case Second transfer",
  "  fail to: 0x9999",
].join("\n");
const LONG_RULE_NOTE = "checked against the list the owner signed before sending";
const JUDGE_DRAWN = await atLoad("名前の長い規則の判定の表を静止画に描く", () => {
  const diagram = diagramOf(LONG_RULE, "en");
  const { value, calls } = callsDuring(() => renderDiagram(diagram, { lang: "en", picture: true }));
  return { svg: value.svg, calls };
});

describe("判定の表の静止画は名前の長い規則の note も 16 字以上の幅で折る (#4009)", () => {
  it("judge-picture-long-rule-name-note-wraps-at-16-chars", () => {
    const { svg, calls } = JUDGE_DRAWN.get();
    const mine = calls.filter((call) => call.text === LONG_RULE_NOTE);
    expect(mine.length, "規則の note を折る処理に渡していない").toBeGreaterThan(0);
    for (const call of mine)
      expect(call.width / call.size, "規則の note を折った幅 (字数)").toBeGreaterThanOrEqual(LEAST);
    // 折った note の行は絵の幅に収まる
    const frame = Number(/viewBox="0 0 ([\d.]+) /u.exec(svg)?.[1] ?? Number.NaN);
    expect(frame, "絵の幅を読めない").toBeGreaterThan(0);
    const note: TextStyle = { family: "sans", size: mine[0]?.size ?? 12, weight: 500 };
    // 字の要素の属性の順に依らず、規則の note の行の左端と字を読む
    const lines = [...svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/gu)]
      .filter((m) => (m[1] ?? "").includes('data-dragon="judge-rule-note"'))
      .map((m) => ({ x: Number(/\bx="([\d.]+)"/u.exec(m[1] ?? "")?.[1]), text: m[2] ?? "" }));
    expect(lines.length, "規則の note の行を描いていない").toBeGreaterThan(0);
    expect(
      lines
        .filter((line) => line.x + textWidth(line.text, note) > frame + 0.5)
        .map((line) => line.text),
      "絵の幅をはみ出す note の行",
    ).toEqual([]);
  });
});
