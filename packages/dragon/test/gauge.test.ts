// @vitest-environment jsdom
/**
 * 上限のある量を棒で見せ、段ごとに動かす目盛り (#3880)。
 *
 * 最初の `step` より前に `gauge <id> as <名前> [on: <箱>, limit: <数>, unit: <単位>, over: <字>]` で目盛りを宣言し、
 * 段の中の `set <目盛り>: <総量>` で値を書く。値はその段の総量で、書かない段は前の段の値を保ち、前より小さい値で棒が縮む。
 * 目盛りは `on` で指した箱のすぐ下に置き、`on` を書かない目盛りは図の上の帯に置き、同じ箱の目盛りは宣言した順に縦に積む。
 * 上限を超えた段は、上限の位置の点線から超えた分だけを赤で伸ばし、値の字を赤にして、目盛りのすぐ下に赤い札を出す。
 * 値が変わった段は、棒の横に増えた量か減った量の札を出す。手順の図と列の図で同じ書き方で置ける。
 *
 * 描いた SVG の目盛りは `data-gauge` を持つ組で、値ごとの組 (`data-gauge-value`) はその値を段の終わりに見せる段の番号を `data-steps` に持つ。
 * 検査は種類を登録しない入口と、使う 2 つの種類の登録の file だけを読む (#3763)。
 */
import { afterEach, describe, expect, it } from "vitest";
import "./built-globals";
import * as dragon from "../src/core";
import "../src/kind-use/flow";
import "../src/kind-use/lineup";
import { READABLE_PX } from "../src/look/values";

/** 目盛りを置ける 2 つの図の種類。どちらも同じ書き方で目盛りを置く */
const KINDS = ["flow", "lineup"] as const;
type Kind = (typeof KINDS)[number];

/** 1 日の予算の目盛りの宣言。`extra` は宣言の属性の後ろに足す属性 */
const BUDGET = (extra = ""): string => `gauge budget as 1日の予算 [on: vi, limit: 100, unit: USDC${extra}]`;

/**
 * 箱 3 つの図。`gauges` は最初の段より前の行 (目盛りの宣言)、`sets` は段ごとに足す行 (書かない段は空の字)。
 * 手順の図は線で箱を結び、列の図は札を置く
 */
function notation(kind: Kind, gauges: string[], sets: string[]): string {
  const boxes = "box agent as AIエージェント\nbox vi as VeriIntent\nbox signer as Signer\n";
  const items = kind === "lineup" ? "item p1\n" : "";
  const steps = sets
    .map((set, k) => {
      const body = kind === "flow" ? `agent -> vi: ${k + 1}件目` : "line vi: p1";
      return `step ${k + 1}件目\n  say ${k + 1}件目の段。\n  ${body}\n${set === "" ? "" : `  ${set}\n`}`;
    })
    .join("\n");
  return `${kind} 予算で止める\n\n${boxes}${items}\n${gauges.join("\n")}\n\n${steps}`;
}

/** 記法を読んだ原本。読めない時は判定の文で落とし、`undefined` を返す */
function diagramOf(text: string, lang: "ja" | "en" = "ja"): unknown {
  const parsed = dragon.parseNotation(text, { lang });
  expect(parsed.ok, `記法を読めない: ${parsed.ok ? "" : parsed.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join(" / ")}`).toBe(true);
  return parsed.ok ? parsed.diagram : undefined;
}

/** 記法を読んだ誤り。読めた時は判定の文で落とし、`undefined` を返す */
function errorOf(text: string, lang: "ja" | "en" = "ja"): { line: number; message: string } | undefined {
  const parsed = dragon.parseNotation(text, { lang });
  expect(parsed.ok, `次の記法を断らずに読んだ:\n${text}`).toBe(false);
  return parsed.ok ? undefined : parsed.errors[0];
}

/** 描いた SVG を要素にする */
function svgOf(markup: string): Element {
  const holder = document.createElement("div");
  holder.innerHTML = markup;
  return holder.querySelector("svg") ?? holder;
}

interface Drawn {
  svg: Element;
  layout: Laid;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 並べた目盛り。`on` は指した箱で、図の上の帯の目盛りは持たない */
interface LaidGauge extends Rect {
  id: string;
  on?: string;
}

interface Laid {
  width: number;
  boxes: (Rect & { id: string })[];
  lanes?: (Rect & { id: string })[];
  gauges?: LaidGauge[];
}

/** 記法 `text` を読んで描く。`width` は描く枠の幅 */
function draw(text: string, lang: "ja" | "en" = "ja", width?: number): Drawn | undefined {
  const diagram = diagramOf(text, lang);
  if (diagram === undefined) return undefined;
  const rendered = dragon.renderDiagram(diagram, { lang, ...(width === undefined ? {} : { width }) });
  return { svg: svgOf(rendered.svg), layout: rendered.layout as unknown as Laid };
}

/** 目盛り `id` の SVG の組。無い時は判定の文で落とし、`null` を返す */
function gaugeOf(svg: Element, id: string): Element | null {
  const found = svg.querySelector(`[data-gauge="${id}"]`);
  expect(found, `目盛り ${id} を描いていない`).not.toBeNull();
  return found;
}

/** 目盛りの、段 `step` の終わりに見せる値の組 */
function shownAt(gauge: Element, step: number): Element | undefined {
  return [...gauge.querySelectorAll("[data-gauge-value]")].find((g) => (g.getAttribute("data-steps") ?? "").split(" ").includes(String(step)));
}

/** 要素の数の属性 */
const num = (el: Element | null | undefined, name: string): number => Number(el?.getAttribute(name) ?? Number.NaN);

/** 目盛りの棒の地 (上限より先の伸びる所まで含む) と、上限の点線の横の位置 */
function trackOf(gauge: Element): { x: number; w: number; limit: number } {
  const track = gauge.querySelector(".dg-gk");
  const limit = gauge.querySelector(".dg-gm");
  expect(track, "目盛りの棒の地を描いていない").not.toBeNull();
  expect(limit, "目盛りの上限の点線を描いていない").not.toBeNull();
  return { x: num(track, "x"), w: num(track, "width"), limit: num(limit, "x1") };
}

/** 値の組の字 */
const valueText = (shown: Element | undefined): string => shown?.querySelector(".dg-gv")?.textContent ?? "";

/** 箱か列の図の帯 `id` の四角 */
function boxRect(layout: Laid, id: string): Rect | undefined {
  return [...layout.boxes, ...(layout.lanes ?? [])].find((b) => b.id === id);
}

/** 並べた目盛り `id`。無い時は判定の文で落とす */
function laidGauge(layout: Laid, id: string): LaidGauge | undefined {
  const found = layout.gauges?.find((g) => g.id === id);
  expect(found, `目盛り ${id} を並べていない`).toBeDefined();
  return found;
}

/** SVG の見た目の規則から、要素の字の大きさ (px) を引く。級の規則の `font` か `font-size` を読む */
function fontPx(svg: Element, el: Element): number {
  const css = svg.querySelector("style")?.textContent ?? "";
  const sizes = [...el.classList].flatMap((cls) => {
    const rule = new RegExp(`\\.${cls}\\{([^}]*)\\}`, "u").exec(css)?.[1] ?? "";
    const size = /font:\s*\d+\s+([\d.]+)px/u.exec(rule)?.[1] ?? /font-size:\s*([\d.]+)px/u.exec(rule)?.[1];
    return size === undefined ? [] : [Number(size)];
  });
  return sizes.at(-1) ?? Number.NaN;
}

/** 見た目の規則に、級 `cls` の規則が性質 `pattern` を持つか */
function ruleHas(svg: Element, cls: string, pattern: RegExp): boolean {
  const css = svg.querySelector("style")?.textContent ?? "";
  return [...css.matchAll(new RegExp(`\\.${cls}\\{([^}]*)\\}`, "gu"))].some((m) => pattern.test(m[1] ?? ""));
}

/** 赤の色 (色味の `rose`) を塗るか。要素の style か級の規則が赤の変数を読む */
function paintsRed(svg: Element, el: Element | null | undefined): boolean {
  if (!el) return false;
  const style = el.getAttribute("style") ?? "";
  if (/--c-rose|--t-rose/u.test(style)) return true;
  return [...el.classList].some((cls) => ruleHas(svg, cls, /--c-rose|--t-rose/u));
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("量の目盛り (#3880)", () => {
  it("gauge-bar-moves-to-value", () => {
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET()], ["set budget: 20"]));
      if (!drawn) return;
      const gauge = gaugeOf(drawn.svg, "budget");
      if (!gauge) return;
      const shown = shownAt(gauge, 0);
      expect(shown, `${kind} の段 1 の値の組が無い`).toBeDefined();
      const track = trackOf(gauge);
      const fill = num(shown?.querySelector(".dg-gf"), "width");
      expect(fill / (track.limit - track.x), `${kind} の棒が上限の 2 割まで動かない`).toBeCloseTo(0.2, 2);
      expect(valueText(shown), `${kind} の値と上限の字`).toBe("20 / 100 USDC");
    }
  });

  it("gauge-under-its-box-or-top-band", () => {
    const top = "gauge total as 全体の予算 [limit: 1000, unit: USDC]";
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET(), top], ["set budget: 20\n  set total: 200"]));
      if (!drawn) return;
      const { layout } = drawn;
      const vi = boxRect(layout, "vi");
      const budget = laidGauge(layout, "budget");
      const total = laidGauge(layout, "total");
      if (!vi || !budget || !total) return;
      expect(budget.on, `${kind} の目盛りが指した箱`).toBe("vi");
      expect(budget.y, `${kind} の目盛りが箱の下の端より上にある`).toBeGreaterThanOrEqual(vi.y + vi.h);
      expect(budget.y - (vi.y + vi.h), `${kind} の目盛りが箱から離れる`).toBeLessThanOrEqual(24);
      expect(budget.x < vi.x + vi.w && budget.x + budget.w > vi.x, `${kind} の目盛りが箱の横の幅に重ならない`).toBe(true);
      expect(total.on, `${kind} の上の帯の目盛りが箱を指す`).toBeUndefined();
      const boxes = [...layout.boxes, ...(layout.lanes ?? [])];
      expect(total.y + total.h, `${kind} の上の帯の目盛りが箱より下にある`).toBeLessThanOrEqual(Math.min(...boxes.map((b) => b.y)));
      gaugeOf(drawn.svg, "total");
    }
  });

  it("gauge-stacks-in-declared-order", () => {
    const month = "gauge month as 1か月の予算 [on: vi, limit: 1000, unit: USDC]";
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET(), month], ["set budget: 20\n  set month: 300"]));
      if (!drawn) return;
      const vi = boxRect(drawn.layout, "vi");
      const budget = laidGauge(drawn.layout, "budget");
      const second = laidGauge(drawn.layout, "month");
      if (!vi || !budget || !second) return;
      expect(second.on, `${kind} の 2 つ目の目盛りが指した箱`).toBe("vi");
      expect(second.y, `${kind} の 2 つ目の目盛りが 1 つ目の下に積まれない`).toBeGreaterThanOrEqual(budget.y + budget.h);
      expect(second.x, `${kind} の 2 つ目の目盛りが 1 つ目と縦に揃わない`).toBeCloseTo(budget.x, 1);
      expect(budget.y, `${kind} の 1 つ目の目盛りが箱の下に無い`).toBeGreaterThanOrEqual(vi.y + vi.h);
    }
  });

  it("gauge-keeps-and-shrinks", () => {
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET()], ["set budget: 20", "", "set budget: 10"]));
      if (!drawn) return;
      const gauge = gaugeOf(drawn.svg, "budget");
      if (!gauge) return;
      const values = [0, 1, 2].map((s) => valueText(shownAt(gauge, s)));
      expect(values, `${kind} の段ごとの値の字`).toEqual(["20 / 100 USDC", "20 / 100 USDC", "10 / 100 USDC"]);
      expect(shownAt(gauge, 1), `${kind} の値を書かない段が前の段の値の組を続けない`).toBe(shownAt(gauge, 0));
      const width = (s: number): number => num(shownAt(gauge, s)?.querySelector(".dg-gf"), "width");
      expect(width(2), `${kind} の前より小さい値の段で棒が縮まない`).toBeLessThan(width(1));
      expect(width(2) / width(1), `${kind} の縮んだ棒の長さ`).toBeCloseTo(0.5, 2);
    }
  });

  it("gauge-delta-chip-on-change", () => {
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET()], ["set budget: 20", "set budget: 40", "", "set budget: 30"]));
      if (!drawn) return;
      const gauge = gaugeOf(drawn.svg, "budget");
      if (!gauge) return;
      const chips = [...gauge.querySelectorAll("[data-gauge-delta]")];
      const byStep = new Map(chips.map((c) => [c.getAttribute("data-step"), c]));
      expect([...byStep.keys()].sort(), `${kind} の札を出した段`).toEqual(["0", "1", "3"]);
      expect(byStep.get("0")?.textContent, `${kind} の段 1 の増えた量`).toBe("+20");
      expect(byStep.get("1")?.textContent, `${kind} の段 2 の増えた量`).toBe("+20");
      expect(byStep.get("3")?.textContent, `${kind} の段 4 の減った量`).toBe("−10");
      const track = trackOf(gauge);
      for (const chip of chips) {
        const x = num(chip.querySelector("rect"), "x");
        expect(x, `${kind} の札 ${chip.textContent} が棒の横に無い`).toBeGreaterThanOrEqual(track.x + track.w);
      }
    }
  });

  it("gauge-over-limit-extends-red", () => {
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET()], ["set budget: 80", "set budget: 120"]));
      if (!drawn) return;
      const gauge = gaugeOf(drawn.svg, "budget");
      if (!gauge) return;
      const track = trackOf(gauge);
      expect(ruleHas(drawn.svg, "dg-gm", /stroke-dasharray/u), `${kind} の上限の線が点線でない`).toBe(true);
      const under = shownAt(gauge, 0);
      const over = shownAt(gauge, 1);
      expect(under?.querySelector(".dg-go"), `${kind} の上限より下の段に赤い伸びがある`).toBeNull();
      expect(paintsRed(drawn.svg, under?.querySelector(".dg-gv")), `${kind} の上限より下の段の値の字が赤い`).toBe(false);
      const extra = over?.querySelector(".dg-go");
      expect(extra, `${kind} の上限を超えた段に赤い伸びが無い`).not.toBeNull();
      expect(num(extra, "x"), `${kind} の赤い伸びが上限の位置から始まらない`).toBeCloseTo(track.limit, 1);
      expect(num(extra, "width") / (track.limit - track.x), `${kind} の赤い伸びが超えた分の長さでない`).toBeCloseTo(0.2, 2);
      expect(paintsRed(drawn.svg, extra), `${kind} の伸びが赤くない`).toBe(true);
      expect(num(over?.querySelector(".dg-gf"), "width"), `${kind} の上限までの棒が上限の位置で止まらない`).toBeCloseTo(track.limit - track.x, 1);
      expect(paintsRed(drawn.svg, over?.querySelector(".dg-gv")), `${kind} の上限を超えた段の値の字が赤くない`).toBe(true);
      expect(valueText(over), `${kind} の上限を超えた段の値の字`).toBe("120 / 100 USDC");
    }
  });

  it("gauge-over-label-default-and-override", () => {
    const sets = ["set budget: 80", "set budget: 120"];
    for (const kind of KINDS) {
      const cases: { text: string; lang: "ja" | "en"; want: string }[] = [
        { text: notation(kind, [BUDGET()], sets), lang: "ja", want: "上限を超えた" },
        { text: notation(kind, [BUDGET()], sets), lang: "en", want: "over the limit" },
        { text: notation(kind, [BUDGET(", over: 上限を超えたので止める")], sets), lang: "ja", want: "上限を超えたので止める" },
      ];
      for (const { text, lang, want } of cases) {
        const drawn = draw(text, lang);
        if (!drawn) return;
        const gauge = gaugeOf(drawn.svg, "budget");
        if (!gauge) return;
        expect(shownAt(gauge, 0)?.querySelector("[data-gauge-over]"), `${kind} (${lang}) の上限より下の段に超えた札がある`).toBeNull();
        const label = shownAt(gauge, 1)?.querySelector("[data-gauge-over]");
        expect(label?.textContent, `${kind} (${lang}) の上限を超えた段の札の字`).toBe(want);
        const bar = gauge.querySelector(".dg-gk");
        expect(num(label?.querySelector("rect"), "y"), `${kind} (${lang}) の札が目盛りの下に無い`).toBeGreaterThanOrEqual(num(bar, "y") + num(bar, "height"));
        expect(paintsRed(drawn.svg, label?.querySelector("text")), `${kind} (${lang}) の札の字が赤くない`).toBe(true);
      }
    }
  });

  it("gauge-without-limit-shows-value-only", () => {
    const count = "gauge sent as 送った件数 [on: vi, unit: 件]";
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [count], ["set sent: 3"]));
      if (!drawn) return;
      const gauge = gaugeOf(drawn.svg, "sent");
      if (!gauge) return;
      expect(gauge.querySelector(".dg-gk"), `${kind} の上限の無い目盛りに棒の地がある`).toBeNull();
      expect(gauge.querySelector(".dg-gf"), `${kind} の上限の無い目盛りに棒がある`).toBeNull();
      expect(gauge.querySelector(".dg-gm"), `${kind} の上限の無い目盛りに上限の線がある`).toBeNull();
      expect(valueText(shownAt(gauge, 0)), `${kind} の上限の無い目盛りの値と単位`).toBe("3 件");
    }
  });

  it("gauge-same-in-flow-and-lineup", () => {
    const declared = KINDS.map((kind) => {
      const diagram = diagramOf(notation(kind, [BUDGET()], ["set budget: 20", "set budget: 40"])) as { blocks: { gauge?: unknown }; steps: { events: { type: string }[] }[] } | undefined;
      return { kind, gauge: diagram?.blocks.gauge, sets: diagram?.steps.map((s) => s.events.filter((e) => e.type === "gauge")) };
    });
    const [flow, lineup] = declared;
    expect(flow?.gauge, "手順の図の目盛りの宣言").toEqual([{ id: "budget", name: "1日の予算", on: "vi", limit: 100, unit: "USDC" }]);
    expect(lineup?.gauge, "列の図の目盛りの宣言が手順の図と違う").toEqual(flow?.gauge);
    expect(flow?.sets, "手順の図の段の値").toEqual([[{ type: "gauge", gauge: "budget", value: 20 }], [{ type: "gauge", gauge: "budget", value: 40 }]]);
    expect(lineup?.sets, "列の図の段の値が手順の図と違う").toEqual(flow?.sets);
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET()], ["set budget: 20", "set budget: 40"]));
      if (!drawn) return;
      gaugeOf(drawn.svg, "budget");
      expect(laidGauge(drawn.layout, "budget")?.on, `${kind} の目盛りが箱の下に無い`).toBe("vi");
    }
  });

  it("gauge-text-readable-at-728", () => {
    const month = "gauge month as 1か月の予算 [on: vi, limit: 1000, unit: USDC]";
    const top = "gauge total as 全体の予算 [limit: 1000, unit: USDC]";
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET(), month, top], ["set budget: 80\n  set month: 300\n  set total: 300", "set budget: 120"]), "ja", 728);
      if (!drawn) return;
      const viewBox = (drawn.svg.getAttribute("viewBox") ?? "").split(" ").map(Number);
      const scale = Math.min(1, 728 / (viewBox[2] ?? Number.POSITIVE_INFINITY));
      const texts = [...drawn.svg.querySelectorAll("[data-gauge] text")];
      expect(texts.length, `${kind} の目盛りの字が無い`).toBeGreaterThan(0);
      for (const text of texts) {
        const px = fontPx(drawn.svg, text) * scale;
        expect(px, `${kind} の目盛りの字「${text.textContent}」が 728px の枠で ${px.toFixed(1)}px`).toBeGreaterThanOrEqual(READABLE_PX);
      }
    }
  });

  it("gauge-unknown-box-refused", () => {
    for (const kind of KINDS) {
      const text = notation(kind, ["gauge budget as 1日の予算 [on: nope, limit: 100, unit: USDC]"], ["set budget: 20"]);
      const line = text.split("\n").findIndex((l) => l.startsWith("gauge")) + 1;
      for (const lang of ["ja", "en"] as const) {
        const error = errorOf(text, lang);
        expect(error?.line, `${kind} (${lang}) の誤りが目盛りの行を名指さない`).toBe(line);
        expect(error?.message, `${kind} (${lang}) の誤りの文が宣言していない箱を挙げない`).toContain("nope");
      }
    }
  });

  it("gauge-bad-set-refused", () => {
    for (const kind of KINDS) {
      for (const set of ["set nope: 20", "set budget: -5", "set budget: abc"]) {
        const text = notation(kind, [BUDGET()], ["set budget: 20", set]);
        const line = text.split("\n").findIndex((l) => l.trim() === set) + 1;
        const messages: string[] = [];
        for (const lang of ["ja", "en"] as const) {
          const error = errorOf(text, lang);
          expect(error?.line, `${kind} (${lang}) の「${set}」の誤りがその行を名指さない`).toBe(line);
          messages.push(error?.message ?? "");
        }
        expect(messages[0], `${kind} の「${set}」の日本語と英語の誤りの文が同じ`).not.toBe(messages[1]);
      }
      const unknown = errorOf(notation(kind, [BUDGET()], ["set nope: 20"]));
      expect(unknown?.message, `${kind} の宣言していない目盛りの誤りの文が名札を挙げない`).toContain("nope");
    }
  });

  it("gauge-name-clash-or-in-step-refused", () => {
    for (const kind of KINDS) {
      // 断る記法と、直した記法 (名札を替えるか、宣言を最初の段より前へ移す)。直した記法は読める
      const clash = notation(kind, ["gauge signer as 1日の予算 [on: vi, limit: 100, unit: USDC]"], ["set signer: 20"]);
      const strip = notation(kind, ["strip 帯: budget, 送り先", BUDGET()], ["set budget: 20"]);
      const inStep = notation(kind, [], [BUDGET()]);
      const cases = [
        { name: "箱と同じ名札", text: clash, fixed: notation(kind, [BUDGET()], ["set budget: 20"]), word: "signer", line: clash.split("\n").findIndex((l) => l.startsWith("gauge")) + 1 },
        { name: "帯の欄と同じ名札", text: strip, fixed: notation(kind, ["strip 帯: 送り先", BUDGET()], ["set budget: 20"]), word: "budget", line: strip.split("\n").findIndex((l) => l.startsWith("gauge")) + 1 },
        { name: "段の中の gauge", text: inStep, fixed: notation(kind, [BUDGET()], [""]), word: "gauge", line: inStep.split("\n").findIndex((l) => l.trim().startsWith("gauge")) + 1 },
      ];
      for (const { name, text, fixed, word, line } of cases) {
        diagramOf(fixed);
        for (const lang of ["ja", "en"] as const) {
          const error = errorOf(text, lang);
          expect(error?.line, `${kind} (${lang}) の${name}の誤りが目盛りの行を名指さない`).toBe(line);
          expect(error?.message, `${kind} (${lang}) の${name}の誤りの文が ${word} を挙げない`).toContain(word);
        }
      }
    }
  });
});
