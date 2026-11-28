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
 * 場面の図では、目盛りは場面ごとの図に 1 つずつ出て、場面の中の段の `set` はその場面の目盛りだけを動かす (#3894)。
 * `set <目盛り>: <確定> [hold: <予約>]` は、確定を濃い色、続けて予約を同じ色の淡い塗りで塗り、棒の下に内訳の行を出す。`hold` を書かない `set` は予約を 0 に戻す (#3895)。
 * 検査は種類を登録しない入口と、使う 2 つの種類の登録の file だけを読む (#3763)。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
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
const BUDGET = (extra = ""): string =>
  `gauge budget as 1日の予算 [on: vi, limit: 100, unit: USDC${extra}]`;

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
  expect(
    parsed.ok,
    `記法を読めない: ${parsed.ok ? "" : parsed.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join(" / ")}`,
  ).toBe(true);
  return parsed.ok ? parsed.diagram : undefined;
}

/** 記法を読んだ誤り。読めた時は判定の文で落とし、`undefined` を返す */
function errorOf(
  text: string,
  lang: "ja" | "en" = "ja",
): { line: number; message: string } | undefined {
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
  const rendered = dragon.renderDiagram(diagram, {
    lang,
    ...(width === undefined ? {} : { width }),
  });
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
  return [...gauge.querySelectorAll("[data-gauge-value]")].find((g) =>
    (g.getAttribute("data-steps") ?? "").split(" ").includes(String(step)),
  );
}

/** 要素の数の属性 */
const num = (el: Element | null | undefined, name: string): number =>
  Number(el?.getAttribute(name) ?? Number.NaN);

/** 目盛りの棒の地 (上限より先の伸びる所まで含む) と、上限の点線の横の位置 */
function trackOf(gauge: Element): { x: number; w: number; limit: number } {
  const track = gauge.querySelector(".dg-gk");
  const limit = gauge.querySelector(".dg-gm");
  expect(track, "目盛りの棒の地を描いていない").not.toBeNull();
  expect(limit, "目盛りの上限の点線を描いていない").not.toBeNull();
  return { x: num(track, "x"), w: num(track, "width"), limit: num(limit, "x1") };
}

/** 値の組の字 */
const valueText = (shown: Element | undefined): string =>
  shown?.querySelector(".dg-gv")?.textContent ?? "";

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
    const size =
      /font:\s*\d+\s+([\d.]+)px/u.exec(rule)?.[1] ?? /font-size:\s*([\d.]+)px/u.exec(rule)?.[1];
    return size === undefined ? [] : [Number(size)];
  });
  return sizes.at(-1) ?? Number.NaN;
}

/** 見た目の規則に、級 `cls` の規則が性質 `pattern` を持つか */
function ruleHas(svg: Element, cls: string, pattern: RegExp): boolean {
  const css = svg.querySelector("style")?.textContent ?? "";
  return [...css.matchAll(new RegExp(`\\.${cls}\\{([^}]*)\\}`, "gu"))].some((m) =>
    pattern.test(m[1] ?? ""),
  );
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
      expect(fill / (track.limit - track.x), `${kind} の棒が上限の 2 割まで動かない`).toBeCloseTo(
        0.2,
        2,
      );
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
      expect(budget.y, `${kind} の目盛りが箱の下の端より上にある`).toBeGreaterThanOrEqual(
        vi.y + vi.h,
      );
      expect(budget.y - (vi.y + vi.h), `${kind} の目盛りが箱から離れる`).toBeLessThanOrEqual(24);
      expect(
        budget.x < vi.x + vi.w && budget.x + budget.w > vi.x,
        `${kind} の目盛りが箱の横の幅に重ならない`,
      ).toBe(true);
      expect(total.on, `${kind} の上の帯の目盛りが箱を指す`).toBeUndefined();
      const boxes = [...layout.boxes, ...(layout.lanes ?? [])];
      expect(total.y + total.h, `${kind} の上の帯の目盛りが箱より下にある`).toBeLessThanOrEqual(
        Math.min(...boxes.map((b) => b.y)),
      );
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
      expect(second.y, `${kind} の 2 つ目の目盛りが 1 つ目の下に積まれない`).toBeGreaterThanOrEqual(
        budget.y + budget.h,
      );
      expect(second.x, `${kind} の 2 つ目の目盛りが 1 つ目と縦に揃わない`).toBeCloseTo(budget.x, 1);
      expect(budget.y, `${kind} の 1 つ目の目盛りが箱の下に無い`).toBeGreaterThanOrEqual(
        vi.y + vi.h,
      );
    }
  });

  it("gauge-keeps-and-shrinks", () => {
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET()], ["set budget: 20", "", "set budget: 10"]));
      if (!drawn) return;
      const gauge = gaugeOf(drawn.svg, "budget");
      if (!gauge) return;
      const values = [0, 1, 2].map((s) => valueText(shownAt(gauge, s)));
      expect(values, `${kind} の段ごとの値の字`).toEqual([
        "20 / 100 USDC",
        "20 / 100 USDC",
        "10 / 100 USDC",
      ]);
      expect(shownAt(gauge, 1), `${kind} の値を書かない段が前の段の値の組を続けない`).toBe(
        shownAt(gauge, 0),
      );
      const width = (s: number): number => num(shownAt(gauge, s)?.querySelector(".dg-gf"), "width");
      expect(width(2), `${kind} の前より小さい値の段で棒が縮まない`).toBeLessThan(width(1));
      expect(width(2) / width(1), `${kind} の縮んだ棒の長さ`).toBeCloseTo(0.5, 2);
    }
  });

  it("gauge-delta-chip-on-change", () => {
    for (const kind of KINDS) {
      const drawn = draw(
        notation(kind, [BUDGET()], ["set budget: 20", "set budget: 40", "", "set budget: 30"]),
      );
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
        expect(x, `${kind} の札 ${chip.textContent} が棒の横に無い`).toBeGreaterThanOrEqual(
          track.x + track.w,
        );
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
      expect(
        ruleHas(drawn.svg, "dg-gm", /stroke-dasharray/u),
        `${kind} の上限の線が点線でない`,
      ).toBe(true);
      const under = shownAt(gauge, 0);
      const over = shownAt(gauge, 1);
      expect(under?.querySelector(".dg-go"), `${kind} の上限より下の段に赤い伸びがある`).toBeNull();
      expect(
        paintsRed(drawn.svg, under?.querySelector(".dg-gv")),
        `${kind} の上限より下の段の値の字が赤い`,
      ).toBe(false);
      const extra = over?.querySelector(".dg-go");
      expect(extra, `${kind} の上限を超えた段に赤い伸びが無い`).not.toBeNull();
      expect(num(extra, "x"), `${kind} の赤い伸びが上限の位置から始まらない`).toBeCloseTo(
        track.limit,
        1,
      );
      expect(
        num(extra, "width") / (track.limit - track.x),
        `${kind} の赤い伸びが超えた分の長さでない`,
      ).toBeCloseTo(0.2, 2);
      expect(paintsRed(drawn.svg, extra), `${kind} の伸びが赤くない`).toBe(true);
      expect(
        num(over?.querySelector(".dg-gf"), "width"),
        `${kind} の上限までの棒が上限の位置で止まらない`,
      ).toBeCloseTo(track.limit - track.x, 1);
      expect(
        paintsRed(drawn.svg, over?.querySelector(".dg-gv")),
        `${kind} の上限を超えた段の値の字が赤くない`,
      ).toBe(true);
      expect(valueText(over), `${kind} の上限を超えた段の値の字`).toBe("120 / 100 USDC");
    }
  });

  it("gauge-over-label-default-and-override", () => {
    const sets = ["set budget: 80", "set budget: 120"];
    for (const kind of KINDS) {
      const cases: { text: string; lang: "ja" | "en"; want: string }[] = [
        { text: notation(kind, [BUDGET()], sets), lang: "ja", want: "上限を超えた" },
        { text: notation(kind, [BUDGET()], sets), lang: "en", want: "over the limit" },
        {
          text: notation(kind, [BUDGET(", over: 上限を超えたので止める")], sets),
          lang: "ja",
          want: "上限を超えたので止める",
        },
      ];
      for (const { text, lang, want } of cases) {
        const drawn = draw(text, lang);
        if (!drawn) return;
        const gauge = gaugeOf(drawn.svg, "budget");
        if (!gauge) return;
        expect(
          shownAt(gauge, 0)?.querySelector("[data-gauge-over]"),
          `${kind} (${lang}) の上限より下の段に超えた札がある`,
        ).toBeNull();
        const label = shownAt(gauge, 1)?.querySelector("[data-gauge-over]");
        expect(label?.textContent, `${kind} (${lang}) の上限を超えた段の札の字`).toBe(want);
        const bar = gauge.querySelector(".dg-gk");
        expect(
          num(label?.querySelector("rect"), "y"),
          `${kind} (${lang}) の札が目盛りの下に無い`,
        ).toBeGreaterThanOrEqual(num(bar, "y") + num(bar, "height"));
        expect(
          paintsRed(drawn.svg, label?.querySelector("text")),
          `${kind} (${lang}) の札の字が赤くない`,
        ).toBe(true);
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
      expect(
        gauge.querySelector(".dg-gm"),
        `${kind} の上限の無い目盛りに上限の線がある`,
      ).toBeNull();
      expect(valueText(shownAt(gauge, 0)), `${kind} の上限の無い目盛りの値と単位`).toBe("3 件");
    }
  });

  it("gauge-same-in-flow-and-lineup", () => {
    const declared = KINDS.map((kind) => {
      const diagram = diagramOf(
        notation(kind, [BUDGET()], ["set budget: 20", "set budget: 40"]),
      ) as { blocks: { gauge?: unknown }; steps: { events: { type: string }[] }[] } | undefined;
      return {
        kind,
        gauge: diagram?.blocks.gauge,
        sets: diagram?.steps.map((s) => s.events.filter((e) => e.type === "gauge")),
      };
    });
    const [flow, lineup] = declared;
    expect(flow?.gauge, "手順の図の目盛りの宣言").toEqual([
      { id: "budget", name: "1日の予算", on: "vi", limit: 100, unit: "USDC" },
    ]);
    expect(lineup?.gauge, "列の図の目盛りの宣言が手順の図と違う").toEqual(flow?.gauge);
    expect(flow?.sets, "手順の図の段の値").toEqual([
      [{ type: "gauge", gauge: "budget", value: 20 }],
      [{ type: "gauge", gauge: "budget", value: 40 }],
    ]);
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
      const drawn = draw(
        notation(
          kind,
          [BUDGET(), month, top],
          ["set budget: 80\n  set month: 300\n  set total: 300", "set budget: 120"],
        ),
        "ja",
        728,
      );
      if (!drawn) return;
      const viewBox = (drawn.svg.getAttribute("viewBox") ?? "").split(" ").map(Number);
      const scale = Math.min(1, 728 / (viewBox[2] ?? Number.POSITIVE_INFINITY));
      const texts = [...drawn.svg.querySelectorAll("[data-gauge] text")];
      expect(texts.length, `${kind} の目盛りの字が無い`).toBeGreaterThan(0);
      for (const text of texts) {
        const px = fontPx(drawn.svg, text) * scale;
        expect(
          px,
          `${kind} の目盛りの字「${text.textContent}」が 728px の枠で ${px.toFixed(1)}px`,
        ).toBeGreaterThanOrEqual(READABLE_PX);
      }
    }
  });

  it("gauge-unknown-box-refused", () => {
    for (const kind of KINDS) {
      const text = notation(
        kind,
        ["gauge budget as 1日の予算 [on: nope, limit: 100, unit: USDC]"],
        ["set budget: 20"],
      );
      const line = text.split("\n").findIndex((l) => l.startsWith("gauge")) + 1;
      for (const lang of ["ja", "en"] as const) {
        const error = errorOf(text, lang);
        expect(error?.line, `${kind} (${lang}) の誤りが目盛りの行を名指さない`).toBe(line);
        expect(
          error?.message,
          `${kind} (${lang}) の誤りの文が宣言していない箱を挙げない`,
        ).toContain("nope");
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
          expect(error?.line, `${kind} (${lang}) の「${set}」の誤りがその行を名指さない`).toBe(
            line,
          );
          messages.push(error?.message ?? "");
        }
        expect(messages[0], `${kind} の「${set}」の日本語と英語の誤りの文が同じ`).not.toBe(
          messages[1],
        );
      }
      const unknown = errorOf(notation(kind, [BUDGET()], ["set nope: 20"]));
      expect(
        unknown?.message,
        `${kind} の宣言していない目盛りの誤りの文が名札を挙げない`,
      ).toContain("nope");
    }
  });

  it("gauge-name-clash-or-in-step-refused", () => {
    for (const kind of KINDS) {
      // 断る記法と、直した記法 (名札を替えるか、宣言を最初の段より前へ移す)。直した記法は読める
      const clash = notation(
        kind,
        ["gauge signer as 1日の予算 [on: vi, limit: 100, unit: USDC]"],
        ["set signer: 20"],
      );
      const strip = notation(kind, ["strip 帯: budget, 送り先", BUDGET()], ["set budget: 20"]);
      const inStep = notation(kind, [], [BUDGET()]);
      const cases = [
        {
          name: "箱と同じ名札",
          text: clash,
          fixed: notation(kind, [BUDGET()], ["set budget: 20"]),
          word: "signer",
          line: clash.split("\n").findIndex((l) => l.startsWith("gauge")) + 1,
        },
        {
          name: "帯の欄と同じ名札",
          text: strip,
          fixed: notation(kind, ["strip 帯: 送り先", BUDGET()], ["set budget: 20"]),
          word: "budget",
          line: strip.split("\n").findIndex((l) => l.startsWith("gauge")) + 1,
        },
        {
          name: "段の中の gauge",
          text: inStep,
          fixed: notation(kind, [BUDGET()], [""]),
          word: "gauge",
          line: inStep.split("\n").findIndex((l) => l.trim().startsWith("gauge")) + 1,
        },
      ];
      for (const { name, text, fixed, word, line } of cases) {
        diagramOf(fixed);
        for (const lang of ["ja", "en"] as const) {
          const error = errorOf(text, lang);
          expect(error?.line, `${kind} (${lang}) の${name}の誤りが目盛りの行を名指さない`).toBe(
            line,
          );
          expect(
            error?.message,
            `${kind} (${lang}) の${name}の誤りの文が ${word} を挙げない`,
          ).toContain(word);
        }
      }
    }
  });
});

/** 級 `cls` の規則の塗り (`fill:` の値)。規則が無い時は空の字 */
function fillOf(svg: Element, cls: string): string {
  const css = svg.querySelector("style")?.textContent ?? "";
  return new RegExp(`\\.${cls}\\{[^}]*?fill:([^;}]+)`, "u").exec(css)?.[1] ?? "";
}

/** 要素の級の規則の塗り。最後に当たった級の塗りを返す */
const fillOfElement = (svg: Element, el: Element): string =>
  [...el.classList]
    .map((cls) => fillOf(svg, cls))
    .filter((fill) => fill !== "")
    .at(-1) ?? "";

/** 段ごとに書いた`set`の出来事 */
type GaugeSet = { type: string; gauge: string; value: number; hold?: number };

/** 予約の量を書ける目盛りの検査が見る文書と、文書が書く字 (#3895) */
const HOLD_DOCS = [
  "packages/dragon/src/blocks/gauge/gallery/docs.ts",
  "packages/dragon/examples/quick-start.md",
  "packages/dragon/examples/quick-start.en.md",
  "plugins/dragon/skills/dragon/references/cheatsheet.md",
];

describe("目盛りの予約と確定 (#3895)", () => {
  it("gauge-hold-paints-pale-after-confirmed", () => {
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET()], ["set budget: 40 [hold: 30]"]));
      if (!drawn) return;
      const gauge = gaugeOf(drawn.svg, "budget");
      if (!gauge) return;
      const shown = shownAt(gauge, 0);
      const track = trackOf(gauge);
      const span = track.limit - track.x;
      expect(
        num(shown?.querySelector(".dg-gf"), "width") / span,
        `${kind} の確定の濃い棒が上限の4割まで伸びない`,
      ).toBeCloseTo(0.4, 2);
      const held = shown?.querySelector(".dg-gh");
      expect(held, `${kind} の予約の淡い塗りが無い`).not.toBeNull();
      expect(
        (num(held, "x") + num(held, "width") - track.x) / span,
        `${kind} の予約の淡い塗りが上限の7割まで伸びない`,
      ).toBeCloseTo(0.7, 2);
      expect(num(held, "x"), `${kind} の予約の淡い塗りと確定の棒の間が空く`).toBeLessThanOrEqual(
        track.x + 0.4 * span + 0.05,
      );
      expect(
        fillOf(drawn.svg, "dg-gh"),
        `${kind} の予約の塗りが目盛りの色を淡くした色でない`,
      ).toMatch(/^color-mix\(in srgb,var\(--c\) \d+%,var\(--surf\)\)$/u);
      expect(valueText(shown), `${kind} の値の字が確定と予約の合計でない`).toBe("70 / 100 USDC");
    }
  });

  it("gauge-hold-breakdown-row", () => {
    const langs: { lang: "ja" | "en"; words: string[] }[] = [
      { lang: "ja", words: ["確定 40", "予約 30"] },
      { lang: "en", words: ["confirmed 40", "held 30"] },
    ];
    for (const kind of KINDS) {
      for (const { lang, words } of langs) {
        const drawn = draw(
          notation(kind, [BUDGET()], ["set budget: 40 [hold: 30]", "set budget: 70"]),
          lang,
        );
        if (!drawn) return;
        const gauge = gaugeOf(drawn.svg, "budget");
        if (!gauge) return;
        const row = shownAt(gauge, 0)?.querySelector("[data-gauge-split]");
        expect(row, `${kind} (${lang}) の予約を持つ段に内訳の行が無い`).not.toBeNull();
        if (!row) return;
        expect(
          [...row.querySelectorAll("text")].map((t) => t.textContent),
          `${kind} (${lang}) の内訳の字`,
        ).toEqual(words);
        const swatches = [...row.querySelectorAll("rect")];
        expect(
          swatches.map((r) => fillOfElement(drawn.svg, r)),
          `${kind} (${lang}) の内訳の四角が棒の確定と予約の色でない`,
        ).toEqual([fillOf(drawn.svg, "dg-gf"), fillOf(drawn.svg, "dg-gh")]);
        const bar = gauge.querySelector(".dg-gk");
        const top = Math.min(...swatches.map((r) => num(r, "y")));
        expect(top, `${kind} (${lang}) の内訳の行が棒の下に無い`).toBeGreaterThanOrEqual(
          num(bar, "y") + num(bar, "height"),
        );
        expect(
          shownAt(gauge, 1)?.querySelector("[data-gauge-split]"),
          `${kind} (${lang}) の予約が0の段に内訳の行がある`,
        ).toBeNull();
      }
    }
  });

  it("gauge-hold-confirm-or-cancel", () => {
    for (const kind of KINDS) {
      const confirmed = draw(
        notation(kind, [BUDGET()], ["set budget: 40 [hold: 30]", "set budget: 70"]),
      );
      const canceled = draw(
        notation(kind, [BUDGET()], ["set budget: 40 [hold: 30]", "set budget: 40"]),
      );
      if (!confirmed || !canceled) return;
      const moved = gaugeOf(confirmed.svg, "budget");
      const dropped = gaugeOf(canceled.svg, "budget");
      if (!moved || !dropped) return;
      const track = trackOf(moved);
      const span = track.limit - track.x;
      // 予約を確定に移した段は、合計の70まで濃い色になり、淡い分と内訳の行が消え、合計が変わらないので札を出さない
      const after = shownAt(moved, 1);
      expect(after, `${kind} の確定に移した段の値の組が無い`).toBeDefined();
      expect(
        num(after?.querySelector(".dg-gf"), "width") / span,
        `${kind} の確定に移した段の濃い棒が7割まで伸びない`,
      ).toBeCloseTo(0.7, 2);
      expect(after?.querySelector(".dg-gh"), `${kind} の確定に移した段に淡い塗りが残る`).toBeNull();
      expect(
        [...moved.querySelectorAll("[data-gauge-delta]")].map((c) => c.getAttribute("data-step")),
        `${kind} の確定に移した図で札を出した段`,
      ).toEqual(["0"]);
      // 予約を取り消した段は、淡い分が消えて4割の濃い棒だけになり、減った量の札を出す
      const cut = shownAt(dropped, 1);
      expect(
        num(cut?.querySelector(".dg-gf"), "width") / span,
        `${kind} の取り消した段の濃い棒が4割でない`,
      ).toBeCloseTo(0.4, 2);
      expect(cut?.querySelector(".dg-gh"), `${kind} の取り消した段に淡い塗りが残る`).toBeNull();
      const chip = [...dropped.querySelectorAll("[data-gauge-delta]")].find(
        (c) => c.getAttribute("data-step") === "1",
      );
      expect(chip?.textContent, `${kind} の取り消した段の減った量の札`).toBe("−30");
    }
  });

  it("gauge-hold-over-limit-by-total", () => {
    for (const kind of KINDS) {
      const drawn = draw(notation(kind, [BUDGET()], ["set budget: 80 [hold: 40]"]));
      if (!drawn) return;
      const gauge = gaugeOf(drawn.svg, "budget");
      if (!gauge) return;
      const shown = shownAt(gauge, 0);
      const track = trackOf(gauge);
      const span = track.limit - track.x;
      expect(
        num(shown?.querySelector(".dg-gf"), "width") / span,
        `${kind} の確定の濃い棒が8割まで伸びない`,
      ).toBeCloseTo(0.8, 2);
      const held = shown?.querySelector(".dg-gh");
      expect(
        (num(held, "x") + num(held, "width") - track.x) / span,
        `${kind} の予約の淡い塗りが上限の位置で止まらない`,
      ).toBeCloseTo(1, 2);
      const extra = shown?.querySelector(".dg-go");
      expect(extra, `${kind} の合計が上限を超えた段に赤い伸びが無い`).not.toBeNull();
      expect(num(extra, "x"), `${kind} の赤い伸びが上限の位置から始まらない`).toBeCloseTo(
        track.limit,
        1,
      );
      expect(num(extra, "width") / span, `${kind} の赤い伸びが超えた分の長さでない`).toBeCloseTo(
        0.2,
        2,
      );
      expect(
        paintsRed(drawn.svg, shown?.querySelector(".dg-gv")),
        `${kind} の合計が上限を超えた段の値の字が赤くない`,
      ).toBe(true);
      expect(valueText(shown), `${kind} の合計が上限を超えた段の値の字`).toBe("120 / 100 USDC");
      expect(
        shown?.querySelector("[data-gauge-over]"),
        `${kind} の合計が上限を超えた段に上限を超えた札が無い`,
      ).not.toBeNull();
    }
  });

  it("gauge-bad-hold-refused", () => {
    const count = "gauge sent as 送った件数 [on: vi, unit: 件]";
    for (const kind of KINDS) {
      const cases = [
        {
          name: "上限の無い目盛りの予約",
          gauges: [count],
          set: "set sent: 3 [hold: 1]",
          word: "limit",
        },
        {
          name: "負の数の予約",
          gauges: [BUDGET()],
          set: "set budget: 20 [hold: -5]",
          word: "hold",
        },
        {
          name: "数でない予約",
          gauges: [BUDGET()],
          set: "set budget: 20 [hold: abc]",
          word: "hold",
        },
      ];
      for (const { name, gauges, set, word } of cases) {
        const text = notation(kind, gauges, [set]);
        const line = text.split("\n").findIndex((l) => l.trim() === set) + 1;
        const messages: string[] = [];
        for (const lang of ["ja", "en"] as const) {
          const error = errorOf(text, lang);
          expect(error?.line, `${kind} (${lang}) の${name}の誤りがその行を名指さない`).toBe(line);
          expect(
            error?.message,
            `${kind} (${lang}) の${name}の誤りの文が ${word} を挙げない`,
          ).toContain(word);
          messages.push(error?.message ?? "");
        }
        expect(messages[0], `${kind} の${name}の日本語と英語の誤りの文が同じ`).not.toBe(
          messages[1],
        );
      }
    }
  });

  it("gauge-hold-round-trips", () => {
    for (const kind of KINDS) {
      const text = notation(kind, [BUDGET()], ["set budget: 40 [hold: 30]", "set budget: 70"]);
      const read = diagramOf(text) as { steps: { events: GaugeSet[] }[] } | undefined;
      if (read === undefined) return;
      expect(
        read.steps.map((s) => s.events.filter((e) => e.type === "gauge")),
        `${kind} の段ごとの目盛りの出来事`,
      ).toEqual([
        [{ type: "gauge", gauge: "budget", value: 40, hold: 30 }],
        [{ type: "gauge", gauge: "budget", value: 70 }],
      ]);
      expect(
        dragon.validateDiagram(read),
        `${kind} の予約を持つ原本を形の検査が受け付けない`,
      ).toEqual({ ok: true });
      const printed = dragon.printNotation(
        read as unknown as Parameters<typeof dragon.printNotation>[0],
      );
      expect(
        printed
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("set ")),
        `${kind} の書き戻した set の行`,
      ).toEqual(["set budget: 40 [hold: 30]", "set budget: 70"]);
      expect(diagramOf(printed), `${kind} の書き戻した記法を読んだ原本`).toEqual(read);
    }
  });

  it("gauge-hold-text-readable-at-728", () => {
    const month = "gauge month as 1か月の予算 [on: vi, limit: 1000, unit: USDC]";
    const top = "gauge total as 全体の予算 [limit: 1000, unit: USDC]";
    for (const kind of KINDS) {
      for (const lang of ["ja", "en"] as const) {
        const sets = [
          "set budget: 40 [hold: 30]\n  set month: 300 [hold: 200]\n  set total: 300 [hold: 100]",
          "set budget: 80 [hold: 40]",
        ];
        const drawn = draw(notation(kind, [BUDGET(), month, top], sets), lang, 728);
        if (!drawn) return;
        const viewBox = (drawn.svg.getAttribute("viewBox") ?? "").split(" ").map(Number);
        const scale = Math.min(1, 728 / (viewBox[2] ?? Number.POSITIVE_INFINITY));
        const split = [...drawn.svg.querySelectorAll("[data-gauge-split] text")];
        expect(split.length, `${kind} (${lang}) の内訳の字が無い`).toBeGreaterThan(0);
        for (const text of drawn.svg.querySelectorAll("[data-gauge] text")) {
          const px = fontPx(drawn.svg, text) * scale;
          expect(
            px,
            `${kind} (${lang}) の目盛りの字「${text.textContent}」が 728px の枠で ${px.toFixed(1)}px`,
          ).toBeGreaterThanOrEqual(READABLE_PX);
        }
      }
    }
  });

  it("gauge-hold-docs", () => {
    for (const file of HOLD_DOCS) {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      expect(text, `${file} が予約の量の書き方 [hold: <量>] を書かない`).toContain("[hold:");
    }
    const grammar = readFileSync(join(process.cwd(), "docs/design/base/GRAMMAR.md"), "utf8").split(
      "\n",
    );
    expect(
      grammar.filter((l) => l.startsWith("| 量の目盛り")).some((l) => l.includes("hold")),
      "文法の表の目盛りの行が予約を書かない",
    ).toBe(true);
    const musubi = JSON.parse(
      readFileSync(join(process.cwd(), "plugins/dragon/skills/dragon/musubi.json"), "utf8"),
    ) as {
      provides: Record<string, { version: string }>;
    };
    // 版は予約の書き方を足した 1.1.0 以上。後の課題が早見表に足して版を上げても落ちない (#3896)
    const [major = 0, minor = 0] = (musubi.provides.cheatsheet?.version ?? "0.0").split(".").map(Number);
    expect(major > 1 || (major === 1 && minor >= 1), `スキルの cheatsheet の版 (${musubi.provides.cheatsheet?.version}) が 1.1.0 より前`).toBe(true);
  });
});

describe("目盛りの語の置き場 (#4043)", () => {
  it("gauge-words-stay-out-of-first-load", () => {
    // 目盛りは手順の図と列の図の後から読む塊だけが描くので、目盛りの語は最初に読む言葉の表に置かず、目盛りの置き場が持つ
    const first = readFileSync(join(process.cwd(), "packages/dragon/src/figure-text.ts"), "utf8");
    expect(first.match(/\bgauge\w*\??:/gu) ?? [], "最初に読む言葉の表が持つ目盛りの語").toEqual([]);
    const file = join(process.cwd(), "packages/dragon/src/blocks/gauge/words.ts");
    expect(existsSync(file), "目盛りの置き場に語の file (blocks/gauge/words.ts) が無い").toBe(true);
    if (!existsSync(file)) return;
    const own = readFileSync(file, "utf8");
    for (const word of ["上限を超えた", "確定", "予約", "over the limit", "confirmed", "held"])
      expect(own, `目盛りの置き場の語に「${word}」が無い`).toContain(`"${word}"`);
  });
});

/** 場面を 2 つ持つ図の場面の名前。1 つ目は上限の内で通り、2 つ目は上限を超える */
const SCENES = ["通る送金", "超える送金"] as const;

/**
 * 場面を 2 つ持つ図 (#3894)。共通の段で `set budget: 40` を書き、`SCENES` の場面ごとに 1 段を足して `sets` の行 (空の字は書かない) を書く。
 * `show` は場面の見せ方、`gauges` は最初の段より前の行 (目盛りの宣言)。手順の図は線で箱を結び、列の図は札を置く
 */
function sceneNotation(
  kind: Kind,
  show: "stack" | "pick",
  sets: [string, string],
  gauges: string[] = [BUDGET()],
): string {
  const boxes = "box agent as AIエージェント\nbox vi as VeriIntent\nbox signer as Signer\n";
  const items = kind === "lineup" ? "item p1\n" : "";
  const common = kind === "flow" ? "agent -> vi: 1件目" : "line vi: p1";
  const later = kind === "flow" ? "vi -> signer: 2件目" : "line signer: p1";
  const scenes = SCENES.map((name, k) => {
    const set = sets[k] ?? "";
    return `scene ${name}\n  step ${name}の段\n    say ${name}の段。\n    ${later}\n${set === "" ? "" : `    ${set}\n`}end`;
  }).join("\n\n");
  return `${kind} 予算で止める [scenes: ${show}]\n\n${boxes}${items}\n${gauges.join("\n")}\n\nstep 1件目\n  say どの場面も通る段。\n  ${common}\n  set budget: 40\n\n${scenes}`;
}

/** 場面 `name` の図の組。無い時は判定の文で落とし、`null` を返す */
function sceneOf(svg: Element, name: string): Element | null {
  const found = svg.querySelector(`[data-scene="${name}"]`);
  expect(found, `場面 ${name} の図を描いていない`).not.toBeNull();
  return found;
}

/** 場面の図の中の、箱か列の図の帯 `id` の下の端と横の幅。箱の組の中の四角を全て囲む */
function boxIn(scene: Element, id: string): { bottom: number; x: number; w: number } {
  const rects = [...scene.querySelectorAll(`[data-node="${id}"] rect`)];
  expect(rects.length, `場面の図に箱 ${id} を描いていない`).toBeGreaterThan(0);
  const left = Math.min(...rects.map((r) => num(r, "x")));
  const right = Math.max(...rects.map((r) => num(r, "x") + num(r, "width")));
  return {
    bottom: Math.max(...rects.map((r) => num(r, "y") + num(r, "height"))),
    x: left,
    w: right - left,
  };
}

describe("場面の図の目盛りは場面ごとに値を持つ (#3894)", () => {
  it("scene-gauge-moves-only-its-scene", () => {
    for (const kind of KINDS) {
      for (const show of ["stack", "pick"] as const) {
        const drawn = draw(sceneNotation(kind, show, ["set budget: 80", "set budget: 110"]));
        if (!drawn) return;
        expect(
          drawn.svg.querySelectorAll("[data-scene]").length,
          `${kind} (${show}) の場面の図の数`,
        ).toBe(SCENES.length);
        const values = SCENES.map((name) => {
          const scene = sceneOf(drawn.svg, name);
          const gauge = scene?.querySelector('[data-gauge="budget"]');
          return gauge ? valueText(shownAt(gauge, 1)) : "";
        });
        expect(values, `${kind} (${show}) の場面ごとの最後の段の値の字`).toEqual([
          "80 / 100 USDC",
          "110 / 100 USDC",
        ]);
      }
    }
  });

  it("scene-gauge-under-each-scene-box", () => {
    const top = "gauge total as 全体の予算 [limit: 1000, unit: USDC]";
    for (const kind of KINDS) {
      const drawn = draw(
        sceneNotation(kind, "stack", ["set budget: 80", "set budget: 110"], [BUDGET(), top]),
      );
      if (!drawn) return;
      for (const name of SCENES) {
        const scene = sceneOf(drawn.svg, name);
        if (!scene) return;
        for (const id of ["budget", "total"])
          expect(
            scene.querySelectorAll(`[data-gauge="${id}"]`).length,
            `${kind} の場面 ${name} の目盛り ${id} の数`,
          ).toBe(1);
        const vi = boxIn(scene, "vi");
        const track = trackOf(scene.querySelector('[data-gauge="budget"]') as Element);
        const y = num(scene.querySelector('[data-gauge="budget"] .dg-gk'), "y");
        expect(y, `${kind} の場面 ${name} の目盛りが箱の下の端より上にある`).toBeGreaterThanOrEqual(
          vi.bottom,
        );
        expect(
          track.x < vi.x + vi.w && track.x + track.w > vi.x,
          `${kind} の場面 ${name} の目盛りが箱の横の幅に重ならない`,
        ).toBe(true);
      }
    }
  });

  it("scene-gauge-keeps-common-value", () => {
    for (const kind of KINDS) {
      const drawn = draw(sceneNotation(kind, "stack", ["", "set budget: 110"]));
      if (!drawn) return;
      const values = SCENES.map((name) => {
        const gauge = sceneOf(drawn.svg, name)?.querySelector('[data-gauge="budget"]');
        return gauge ? [0, 1].map((s) => valueText(shownAt(gauge, s))) : [];
      });
      expect(values, `${kind} の場面ごとの段の値の字`).toEqual([
        ["40 / 100 USDC", "40 / 100 USDC"],
        ["40 / 100 USDC", "110 / 100 USDC"],
      ]);
    }
  });
});
