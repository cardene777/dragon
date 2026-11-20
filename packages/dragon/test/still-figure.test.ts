/**
 * 頁に止めて置く図 (#3801)。
 *
 * レポートや説明の頁は、図を段で送らずに最後の段の形を 1 枚で置きたい。
 * `renderDiagram` に `figure: true` を渡すと、止め絵の時刻を図の中に書き込み、再生の部品が無くても最後の段の形を描く。
 * 段の番号の丸を出さず、量の図は段の名前の所に図の題を出し、字の並びは一般の sans-serif に落ちる。
 * 色は頁の `data-theme` と `prefers-color-scheme` に従って暗い色に変わる。
 *
 * 頁の塊は属性 `data-still` を持つ時、再生の部品を置かずにこの SVG に置き換わる。
 * 頁の塊と `dragon embed` の件は、組み立てた1行の入口と命令を回す `script-entry.test.ts` が確かめる。
 * 1行の入口は時系列図を最初から読み、埋める処理は全ての種類を読むので、ここで回すと、どの種類を変えてもこの検査が選ばれる (#3763)。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseNotation, renderDiagram } from "../src/api";
import "../src/kinds/basics";
import "../src/kind-use/chart";
import "../src/kind-use/cycle";
import "../src/kind-use/flow";
import { textWidth } from "../src/layout/measure";
import { CHART_LOOK, CHART_TYPE } from "../src/look/chart";
import { BAND_LOOK, BAND_TYPE } from "../src/look/cycle";
import { LOOK } from "../src/look/values";
import { Motion } from "../src/render/motion";

const ROOT = process.cwd();

/** 横棒の量の図。段の名前 (注ぐ) と図の題 (注いだお湯の量) が違う */
const BAR = "chart 注いだお湯の量 [shape: bar]\n\nitem bloom as 蒸らし\nitem first as 1回目まで\n\nstep 注ぐ\n  say 3回に分けて注ぐ。\n  set bloom: 30\n  set first: 120\n";
/** ドーナツの量の図 */
const DONUT = "chart 種類ごとの割合 [shape: donut]\n\nitem bread as パン\nitem sweets as 菓子パン\n\nstep 今週\n  say 売り上げの内訳。\n  set bread: 268\n  set sweets: 141\n";
/** 段の番号の丸を描く、2 段の流れ図 */
const FLOW = "flow 注文の流れ\n\nbox order as 注文\nbox pay as 支払い\nbox ship as 発送\n\nstep 受ける\n  say 注文を受ける。\n  order -> pay: 確かめる\nstep 送る\n  say 品を送る。\n  pay -> ship: 送る\n";

function read(source: string) {
  const parsed = parseNotation(source, { lang: "ja" });
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\n"));
  return parsed.diagram;
}

const figure = (source: string) => renderDiagram(read(source), { lang: "ja", still: true, figure: true });
const styleOf = (svg: string): string => /<style>([\s\S]*?)<\/style>/u.exec(svg)?.[1] ?? "";
const idOf = (svg: string): string => /class="dg dg-([A-Za-z0-9_-]+)"/u.exec(svg)?.[1] ?? "";
/** 図の根の規則 (`.dg-<id>{...}`) の中身を全て繋げた字 */
const rootRules = (svg: string): string => {
  const id = idOf(svg);
  // 規則の終わりの `}` を前の一致が使うので、後ろ読みで規則の頭を見る
  return [...styleOf(svg).matchAll(new RegExp(`(?<=^|\\})\\.dg-${id}\\{([^}]*)\\}`, "gu"))].map((m) => m[1]).join(";");
};
const varOf = (rules: string, name: string): string | undefined => new RegExp(`(?:^|;)--${name}:([^;]+)`, "u").exec(rules)?.[1];
/** 同じ変数が 2 度在る時に勝つ、後の値 */
const lastVarOf = (rules: string, name: string): string | undefined => [...rules.matchAll(new RegExp(`(?:^|;)--${name}:([^;]+)`, "gu"))].at(-1)?.[1];
/** 頁が暗い時の規則 (`data-theme="dark"` と、`data-theme="light"` でない頁の暗い `prefers-color-scheme`) の中身 */
const darkRules = (svg: string): { theme: string; media: string } => {
  const id = idOf(svg);
  const style = styleOf(svg);
  return {
    theme: new RegExp(`:root\\[data-theme="dark"\\] \\.dg-${id}\\{([^}]*)\\}`, "u").exec(style)?.[1] ?? "",
    media: new RegExp(`@media \\(prefers-color-scheme: ?dark\\)\\{:root:not\\(\\[data-theme="light"\\]\\) \\.dg-${id}\\{([^}]*)\\}\\}`, "u").exec(style)?.[1] ?? "",
  };
};

/** 名前が輪の内側の縁から余白を空けた円に 1 行で収まらないドーナツ */
const LONG_DONUT = "chart 売り上げの割合 [shape: donut]\n\nitem bread as パン\nitem sweets as 菓子パン\nitem drinks as 飲み物\n\nstep 今週\n  say 売り上げの内訳。\n  set bread: 60\n  set sweets: 27\n  set drinks: 13\n";
/** 英語の名前が 1 行で収まらないドーナツ */
const LONG_DONUT_EN = "chart Share of sales [shape: donut]\n\nitem bread as Bread\nitem sweets as Sweets\n\nstep Week\n  say Sales by kind.\n  set bread: 60\n  set sweets: 40\n";
/** 段の名前が 1 行で収まらない、動くドーナツ */
const LONG_STEP_DONUT = "chart 割合 [shape: donut]\n\nitem bread as パン\nitem sweets as 菓子パン\n\nstep 今週の売り上げ\n  say 売り上げの内訳。\n  set bread: 60\n  set sweets: 40\n";
/** 名前が 1 行で収まるドーナツ */
const SHORT_DONUT = "chart 割合 [shape: donut]\n\nitem bread as パン\nitem sweets as 菓子パン\n\nstep 今週\n  say 売り上げの内訳。\n  set bread: 60\n  set sweets: 40\n";
/** 分かれ道の無い 5 つの手順を左から右へ並べる手順の帯 */
const BAND =
  "cycle 豆からカップまで [shape: band]\n\nbox weigh as 豆を量る\nbox grind as 挽く\nbox bloom as 蒸らす\nbox pour as 3回に分けて注ぐ\nbox cup as 1杯のコーヒー\n\n" +
  "step 量る\n  say 豆を量る。\nstep 挽く\n  say 豆を挽く。\n  weigh -> grind [carry: none]\nstep 蒸らす\n  say 粉を蒸らす。\n  grind -> bloom [carry: none]\n" +
  "step 注ぐ\n  say 残りのお湯を注ぐ。\n  bloom -> pour [carry: none]\nstep できあがり\n  say コーヒーができる。\n  pour -> cup [carry: none]\n";

/** ドーナツの真ん中の名前の行。1 行の名前は `<text>` の字、折り返した名前は `<tspan>` ごとの字 */
function titleLines(svg: string, title: string): { lines: { text: string; x: number; y: number }[]; size: number } {
  const found = new RegExp(`<text([^>]*)data-chart-title="${title}"([^>]*)>([\\s\\S]*?)</text>`, "u").exec(svg);
  if (!found) throw new Error(`名前 ${title} の字が無い`);
  const attrs = `${found[1] ?? ""}${found[2] ?? ""}`;
  const inner = found[3] ?? "";
  const num = (text: string, name: string): number => Number(new RegExp(`\\b${name}="([-\\d.]+)"`, "u").exec(text)?.[1]);
  const size = Number(/font-size:\s*([\d.]+)px/u.exec(attrs)?.[1] ?? CHART_TYPE.title.size);
  const spans = [...inner.matchAll(/<tspan([^>]*)>([^<]*)<\/tspan>/gu)];
  const lines = spans.length === 0 ? [{ text: inner, x: num(attrs, "x"), y: num(attrs, "y") }] : spans.map((s) => ({ text: s[2] ?? "", x: num(s[1] ?? "", "x"), y: num(s[1] ?? "", "y") }));
  return { lines, size };
}

/** ドーナツの輪の真ん中と、輪の線の内側の縁の半径 */
function ringOf(svg: string): { cx: number; cy: number; inner: number } {
  const found = /<circle class="dg-ch-track" cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"/u.exec(svg);
  if (!found) throw new Error("輪の地が無い");
  return { cx: Number(found[1]), cy: Number(found[2]), inner: Number(found[3]) - CHART_LOOK.donut.width / 2 };
}

/** 山形の四角。山形の線 (`M` `L` `H`) の点を囲む */
function segmentsOf(svg: string): Map<string, { left: number; right: number; top: number; bottom: number }> {
  const out = new Map<string, { left: number; right: number; top: number; bottom: number }>();
  for (const found of svg.matchAll(/<g data-segment="([^"]+)" data-round="0"[^>]*><path class="dg-bd-seg" d="([^"]+)"/gu)) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const [, cmd, args] of (found[2] ?? "").matchAll(/([MLHZ])([^MLHZ]*)/gu)) {
      const n = (args ?? "").trim().split(/[\s,]+/u).filter(Boolean).map(Number);
      if (cmd === "H") xs.push(n[0] as number);
      if (cmd === "M" || cmd === "L") {
        xs.push(n[0] as number);
        ys.push(n[1] as number);
      }
    }
    out.set(found[1] ?? "", { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) });
  }
  return out;
}

/** 手順の名前の字の所。`x` は真ん中、`y` は基準線 */
function bandNamesOf(svg: string): Map<string, { text: string; x: number; y: number }> {
  const out = new Map<string, { text: string; x: number; y: number }>();
  for (const found of svg.matchAll(/<g data-band-name="([^"]+)"><text class="dg-bd-name" x="([-\d.]+)" y="([-\d.]+)"[^>]*>([^<]*)<\/text>/gu)) {
    out.set(found[1] ?? "", { text: found[4] ?? "", x: Number(found[2]), y: Number(found[3]) });
  }
  return out;
}

describe("止めて置く図を描く", () => {
  it("still-figure-hides-step-badges", () => {
    expect(figure(FLOW).svg).not.toMatch(/class="dg-bd"/u);
    expect(figure(BAR).svg).not.toMatch(/class="dg-bd"/u);
  });

  it("still-figure-freezes-at-last-step", () => {
    for (const source of [FLOW, BAR]) {
      const rendered = figure(source);
      const last = rendered.timeline.stills[rendered.timeline.steps.length - 1];
      const rules = rootRules(rendered.svg);
      expect(varOf(rules, "at")).toBe(String(last));
      expect(varOf(rules, "play")).toBe("paused");
    }
  });

  it("still-figure-bar-chart-shows-title", () => {
    const { svg } = figure(BAR);
    expect(svg).toContain('data-chart-title="注いだお湯の量"');
    expect(svg).not.toContain('data-chart-title="注ぐ"');
  });

  it("still-figure-donut-shows-title", () => {
    const { svg } = figure(DONUT);
    expect(svg).toContain('data-chart-title="種類ごとの割合"');
    expect(svg).not.toContain('data-chart-title="今週"');
  });

  it("still-figure-font-has-fallback-stack", () => {
    const rules = rootRules(figure(BAR).svg);
    // 同じ変数が 2 度在る時は後の値が勝つ
    const sans = [...rules.matchAll(/(?:^|;)--sans:([^;]+)/gu)].at(-1)?.[1] ?? "";
    const mono = [...rules.matchAll(/(?:^|;)--mono:([^;]+)/gu)].at(-1)?.[1] ?? "";
    expect(sans).toMatch(/,\s*sans-serif$/u);
    expect(mono).toMatch(/,\s*monospace$/u);
  });

  it("still-figure-follows-page-theme", () => {
    const { svg } = figure(BAR);
    const id = idOf(svg);
    const style = styleOf(svg);
    const light = varOf(rootRules(svg), "bg");
    const darkRule = new RegExp(`:root\\[data-theme="dark"\\] \\.dg-${id}\\{([^}]*)\\}`, "u").exec(style)?.[1] ?? "";
    const mediaRule = new RegExp(`@media \\(prefers-color-scheme: ?dark\\)\\{:root:not\\(\\[data-theme="light"\\]\\) \\.dg-${id}\\{([^}]*)\\}\\}`, "u").exec(style)?.[1] ?? "";
    expect(light).toBeDefined();
    expect(varOf(darkRule, "bg")).toBeDefined();
    expect(varOf(darkRule, "bg")).not.toBe(light);
    expect(varOf(mediaRule, "bg")).toBe(varOf(darkRule, "bg"));
  });

  it("still-figure-off-keeps-render", () => {
    const { svg } = renderDiagram(read(FLOW), { lang: "ja" });
    expect(svg).toMatch(/class="dg-bd"/u);
    expect(varOf(rootRules(svg), "play")).toBeUndefined();
  });
});

describe("止めて置く図の地を頁の色に合わせる (#3809)", () => {
  it("still-figure-background-follows-page", () => {
    for (const source of [FLOW, BAR]) {
      const { svg } = figure(source);
      const rules = rootRules(svg);
      const dark = darkRules(svg);
      // 色味の地の色は最初の `--bg`、頁の色を読む値は後の `--bg` で、後の値が勝つ
      expect(lastVarOf(rules, "bg"), "明るい頁の地").toBe(`var(--dragon-figure-background,${varOf(rules, "bg") ?? ""})`);
      expect(lastVarOf(dark.theme, "bg"), "data-theme の暗い頁の地").toBe(`var(--dragon-figure-background,${varOf(dark.theme, "bg") ?? ""})`);
      expect(lastVarOf(dark.media, "bg"), "prefers-color-scheme の暗い頁の地").toBe(lastVarOf(dark.theme, "bg"));
    }
  });

  it("still-figure-off-ignores-page-background", () => {
    for (const source of [FLOW, BAR]) {
      expect(renderDiagram(read(source), { lang: "ja" }).svg).not.toContain("--dragon-figure-background");
    }
  });
});

describe("ドーナツの真ん中の名前を輪の内側に収める (#3809)", () => {
  it("donut-long-title-wraps-inside-ring", () => {
    // 止めて置く図は図の題を、動く図は段の名前を真ん中に描く
    for (const [svg, title] of [
      [figure(LONG_DONUT).svg, "売り上げの割合"],
      [figure(LONG_DONUT_EN).svg, "Share of sales"],
      [renderDiagram(read(LONG_STEP_DONUT), { lang: "ja" }).svg, "今週の売り上げ"],
    ] as const) {
      const { lines, size } = titleLines(svg, title);
      expect(lines.map((l) => l.text), `${title} の行`).toHaveLength(2);
      expect(lines.map((l) => l.text).join("").replace(/\s/gu, ""), `${title} の字`).toBe(title.replace(/\s/gu, ""));
      const { cx, cy, inner } = ringOf(svg);
      const room = inner - CHART_LOOK.donut.titlePad;
      for (const line of lines) {
        const w = textWidth(line.text, { ...CHART_TYPE.title, size });
        const corners = [
          [line.x - w / 2, line.y - size * 0.8],
          [line.x + w / 2, line.y - size * 0.8],
          [line.x - w / 2, line.y + size * 0.2],
          [line.x + w / 2, line.y + size * 0.2],
        ] as const;
        for (const [x, y] of corners) expect(Math.hypot(x - cx, y - cy), `${line.text} の角と輪の真ん中の間`).toBeLessThanOrEqual(room + 0.5);
      }
    }
  });

  it("donut-short-title-keeps-one-line", () => {
    const { lines, size } = titleLines(figure(SHORT_DONUT).svg, "割合");
    expect(lines.map((l) => l.text)).toEqual(["割合"]);
    expect(size).toBe(CHART_TYPE.title.size);
  });
});

describe("止めて置く手順の帯 (#3809)", () => {
  it("still-figure-band-drops-badge-room", () => {
    const still = segmentsOf(figure(BAND).svg).get("weigh");
    const moving = segmentsOf(renderDiagram(read(BAND), { lang: "ja" }).svg).get("weigh");
    expect(still, "止めて置いた帯の最初の山形").toBeDefined();
    expect(moving, "動く帯の最初の山形").toBeDefined();
    expect((moving?.top ?? 0) - (still?.top ?? 0), "番号の丸の空きの分だけ上に在る").toBeCloseTo(BAND_LOOK.badgeAt + LOOK.badge.r, 0);
  });

  it("still-figure-band-writes-names-inside", () => {
    const { svg } = figure(BAND);
    const segments = segmentsOf(svg);
    const names = bandNamesOf(svg);
    expect([...names.keys()]).toEqual(["weigh", "grind", "bloom", "pour", "cup"]);
    for (const [id, name] of names) {
      const seg = segments.get(id);
      if (!seg) throw new Error(`${id} の山形が無い`);
      const w = textWidth(name.text, BAND_TYPE.name);
      const size = BAND_TYPE.name.size;
      expect(name.y - size * 0.8, `${name.text} の字の上の端`).toBeGreaterThanOrEqual(seg.top);
      expect(name.y + size * 0.2, `${name.text} の字の下の端`).toBeLessThanOrEqual(seg.bottom);
      expect(name.x - w / 2, `${name.text} の字の左の端`).toBeGreaterThanOrEqual(seg.left + BAND_LOOK.point);
      expect(name.x + w / 2, `${name.text} の字の右の端`).toBeLessThanOrEqual(seg.right - BAND_LOOK.point);
    }
  });
});

/** 急に上り下りする折れ線 */
const STEEP_LINE = "chart 日ごとの売り上げ [shape: line]\n\nitem sales as 売り上げ\n\nstep 火\n  say 10。\n  set sales: 10\nstep 水\n  say 95。\n  set sales: 95\nstep 木\n  say 5。\n  set sales: 5\n";
/** 部品の style の性質 `prop` の字 */
const styleProp = (style: string, prop: string): string | undefined => new RegExp(`(?:^|;)${prop}:([^;]+)`, "u").exec(style)?.[1];

describe("止めて置く図は動きに頼らない (#3812)", () => {
  it("still-figure-has-no-keyframes", () => {
    for (const source of [FLOW, BAR, LONG_DONUT, STEEP_LINE, BAND]) {
      const { svg } = figure(source);
      expect(svg, `${source.split("\n")[0]} の keyframes`).not.toContain("@keyframes");
      expect(svg, `${source.split("\n")[0]} の animation-name`).not.toMatch(/animation-name:/u);
    }
  });

  it("still-figure-donut-arcs-keep-shares", () => {
    const { svg } = figure(LONG_DONUT);
    const arcs = [...svg.matchAll(/<circle class="dg-ch-arc[^"]*" cx="[-\d.]+" cy="[-\d.]+" r="([-\d.]+)"[^>]*data-chart-arc="(\w+)" style="([^"]*)"/gu)];
    expect(arcs.map((a) => a[2]), "弧の項目").toEqual(["bread", "sweets", "drinks"]);
    const c = 2 * Math.PI * Number(arcs[0]?.[1]);
    const gap = CHART_LOOK.donut.gap;
    let start = 0;
    [0.6, 0.27, 0.13].forEach((share, k) => {
      const style = arcs[k]?.[3] ?? "";
      const dash = (styleProp(style, "stroke-dasharray") ?? "").trim().split(/\s+/u).map(Number);
      const offset = Number(styleProp(style, "stroke-dashoffset"));
      expect(((dash[0] ?? 0) + gap) / c, `${arcs[k]?.[2]} の弧の長さの割合`).toBeCloseTo(share, 2);
      expect((-offset - gap / 2) / c, `${arcs[k]?.[2]} の弧の始まり`).toBeCloseTo(start, 2);
      expect(Number(styleProp(style, "opacity")), `${arcs[k]?.[2]} の弧の濃さ`).toBe(1);
      start += share;
    });
  });

  it("still-figure-bars-keep-lengths", () => {
    const { svg } = figure(BAR);
    const bars = new Map([...svg.matchAll(/<rect class="dg-ch-bar[^"]*"[^>]*data-chart-bar="(\w+)" style="([^"]*)"/gu)].map((b) => [b[1], b[2] ?? ""]));
    expect([...bars.keys()], "棒の項目").toEqual(["bloom", "first"]);
    expect(styleProp(bars.get("bloom") ?? "", "transform"), "30 の棒の長さ").toBe("scaleX(0.25)");
    expect(styleProp(bars.get("first") ?? "", "transform"), "120 の棒の長さ").toBe("scaleX(1)");
  });

  it("motion-freeze-writes-values-at-time", () => {
    const points: [number, Record<string, string | number>][] = [
      [0, { opacity: 0, transform: "scaleX(0)" }],
      [4, { opacity: 0, transform: "scaleX(0)" }],
      [6, { opacity: 1, transform: "scaleX(1)" }],
      [9, { opacity: 1, transform: "scaleX(1)" }],
    ];
    const settled = new Motion("t", 10, 9, 8);
    expect(settled.kf(points), "動き終えた時刻の値").toBe("opacity:1;transform:scaleX(1)");
    const moving = new Motion("t", 10, 9, 5);
    expect(moving.kf(points), "動いている途中の時刻の値").toBe("opacity:0.5;transform:scaleX(0.5)");
    expect([...settled.frames, ...moving.frames], "止める時刻を渡した時の keyframes").toEqual([]);
    const free = new Motion("t", 10, 9);
    expect(free.kf(points), "止める時刻を渡さない時").toBe("animation-name:t-0");
    expect(free.frames.length, "止める時刻を渡さない時の keyframes").toBe(1);
  });

  it("moving-figure-keeps-keyframes", () => {
    for (const source of [BAR, LONG_DONUT, STEEP_LINE]) {
      for (const options of [{ lang: "ja" as const }, { lang: "ja" as const, still: true }]) {
        const { svg } = renderDiagram(read(source), options);
        expect(svg, `${source.split("\n")[0]} の keyframes (${JSON.stringify(options)})`).toContain("@keyframes");
        expect(svg, `${source.split("\n")[0]} の animation-name (${JSON.stringify(options)})`).toMatch(/animation-name:/u);
      }
    }
  });
});

describe("止めて置く図の書き方を文書に書く", () => {
  it("still-figure-docs-name-data-still", () => {
    for (const path of ["packages/dragon/README.ja.md", "packages/dragon/README.md", "plugins/dragon/skills/dragon/references/embed.md"]) {
      const text = readFileSync(join(ROOT, path), "utf8");
      expect(text, path).toContain("data-still");
      expect(text, path).toMatch(/figure: true/u);
    }
  });

  it("still-figure-docs-name-figure-background", () => {
    for (const path of ["packages/dragon/README.ja.md", "packages/dragon/README.md", "plugins/dragon/skills/dragon/references/embed.md"]) {
      const text = readFileSync(join(ROOT, path), "utf8");
      expect(text, path).toContain("--dragon-figure-background");
    }
  });
});
