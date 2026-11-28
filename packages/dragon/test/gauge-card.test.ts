// @vitest-environment jsdom
/**
 * 目盛りを押すと、段ごとの増えた量とその時の値を並べた内訳の札を出す (#3896)。
 *
 * 1 行目に `[note: pop]` を書いた手順の図は、値を 1 度でも書いた目盛りの名前のすぐ右に丸い i の印を描き、目盛りを押すと目盛りのすぐ下に札を開く。
 * 札は目盛りの名前と上限と単位を見出しにし、目盛りに `set` を書いた段のうち今見ている段までを段の順に並べる。
 * 各行は段の番号と名前、増えた量、その時の値を持ち、上限を書いた目盛りの行はその段の終わりの目盛りを図と同じ塗りの小さな棒で描く。
 * 予約を持つ段の行は確定と予約の内訳を添え、上限を超えた段の行は値の字を赤で描く。印刷の形では全ての札を開き、全ての段の行を並べる。
 *
 * 画面の大きさを測れない jsdom では、押した目盛りと図の枠の四角を検査が決め、札をその四角から置く位置を確かめる。
 * 検査は種類を登録しない入口と、手順の図の登録の file だけを読む (#3763)。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import "./built-globals";
import * as dragon from "../src/core";
import "../src/kind-use/flow";
import { textWidth } from "../src/layout/measure";
import { LOOK, TYPE } from "../src/look/values";

/** 段の名前と、その段に書く目盛りの行 (書かない段は空の字) */
const STEPS: readonly (readonly [string, string])[] = [
  ["1件目を送る", "set budget: 40"],
  ["2件目を予約する", "set budget: 40 [hold: 30]"],
  ["予約を確定する", "set budget: 70"],
  ["署名を待つ", ""],
  ["3件目で止める", "set budget: 110"],
  ["1件を戻す", "set budget: 90"],
];

/** 英語の図の段の名前。段の行は日本語の図と同じ */
const STEPS_EN = [
  "Send the first",
  "Hold the second",
  "Confirm the hold",
  "Wait for the signer",
  "Stop at the third",
  "Return one",
];

/**
 * 1 日の予算の目盛りを持つ手順の図。`head` は 1 行目の後ろに書く属性、`gauges` は足す目盛りの宣言、`extra` は段ごとに足す行。
 * 4 段目は目盛りに値を書かない
 */
function notation(
  head = " [note: pop]",
  gauges: string[] = [],
  extra: string[] = [],
  lang: "ja" | "en" = "ja",
): string {
  const steps = STEPS.map(([title, set], k) => {
    const name = lang === "en" ? STEPS_EN[k] : title;
    const lines = [set, extra[k] ?? ""].filter((l) => l !== "").map((l) => `  ${l}\n`);
    return `step ${name}\n  say ${k + 1}段目。\n  agent -> vi: ${k + 1}件目\n${lines.join("")}`;
  }).join("\n");
  return (
    `flow 予算で止める${head}\n\nbox agent as AIエージェント\nbox vi as VeriIntent\nbox signer as Signer\n\n` +
    `${["gauge budget as 1日の予算 [on: vi, limit: 100, unit: USDC]", ...gauges].join("\n")}\n\n${steps}`
  );
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

/** 描いた SVG を要素にする */
function svgOf(markup: string): Element {
  const holder = document.createElement("div");
  holder.innerHTML = markup;
  return holder.querySelector("svg") ?? holder;
}

interface Placed {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 描いた図の、置いた目盛り `id` の四角 */
const placedOf = (rendered: { layout: unknown }, id: string): Placed | undefined =>
  ((rendered.layout as { gauges?: Placed[] }).gauges ?? []).find((g) => g.id === id);

/** 目盛り `id` の組 */
const gaugeOf = (root: ParentNode, id: string): Element | null =>
  root.querySelector(`[data-gauge="${id}"]`);

/** 目盛り `id` の押せる組。札を持たない目盛りは `null` */
const pressableOf = (root: ParentNode, id: string): Element | null =>
  gaugeOf(root, id)?.querySelector("[data-note]") ?? null;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 要素の四角を決める。jsdom は画面の大きさを測らないので、押した目盛りと図の枠の四角を検査が渡す */
function placeAt(el: Element | null, rect: Rect): void {
  if (!el) return;
  const value = {
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => rect,
  };
  Object.defineProperty(el, "getBoundingClientRect", { configurable: true, value: () => value });
}

/** 頁に置いた図。検査の終わりに外す */
const mounted: { destroy(): void }[] = [];
const hosts: HTMLElement[] = [];

/** 記法 `text` の図を頁に置く。置けない時は判定の文で落とし、`undefined` を返す */
function mount(
  text: string,
  lang: "ja" | "en" = "ja",
): { host: HTMLElement; player: dragon.Player } | undefined {
  const diagram = diagramOf(text, lang);
  if (diagram === undefined) return undefined;
  const host = document.createElement("div");
  document.body.appendChild(host);
  hosts.push(host);
  const player = dragon.mountDiagram(host, diagram, { lang });
  mounted.push(player);
  return { host, player };
}

/** 札 `key` の要素。札の無い時は `null` */
const cardOf = (host: ParentNode, key: string): HTMLElement | null =>
  host.querySelector<HTMLElement>(`[data-dragon="note-card"][data-box="${key}"]`);

/** 開いている札の名札 */
const openCards = (host: ParentNode): string[] =>
  [...host.querySelectorAll('[data-dragon="note-card"][data-open]')].map(
    (el) => el.getAttribute("data-box") ?? "",
  );

/** 要素を押す。押した所から上の要素へ伝わる */
const press = (el: Element | null): void => {
  el?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
};

/** 図の枠の四角と目盛りの四角。目盛りは枠の左上から右へ 200、下へ 160 の所に在る */
const FRAME: Rect = { left: 20, top: 30, width: 800, height: 500 };
const GAUGE: Rect = { left: 220, top: 190, width: 180, height: 64 };

/** 図の枠と目盛り `id` の四角を決めてから、目盛りを押す。押した目盛りの札の名札を返す */
function pressGauge(host: HTMLElement, id: string = "budget"): string {
  placeAt(host.querySelector(".dg-frame"), FRAME);
  const el = pressableOf(host, id);
  expect(el, `目盛り ${id} に札の印が無く、押せない`).not.toBeNull();
  placeAt(el, GAUGE);
  press(el);
  return el?.getAttribute("data-note") ?? "";
}

/** 札の行。`all` が偽の時は、画面に出ている行 (`hidden` を持たない行) だけ */
const rowsOf = (card: ParentNode | null, all = false): HTMLElement[] =>
  [...(card?.querySelectorAll<HTMLElement>('[data-dragon="gauge-row"]') ?? [])].filter(
    (row) => all || !row.hidden,
  );

/** 行の中の部品 `part` の字 */
const partText = (row: ParentNode, part: string): string =>
  row.querySelector(`[data-dragon="gauge-row-${part}"]`)?.textContent ?? "";

/** 行の棒の中の塗り `part` の、棒の地の幅に対する長さ (%)。塗りが無い時は `undefined` */
const barPart = (row: ParentNode, part: "fill" | "held" | "over"): number | undefined => {
  const el = row.querySelector<HTMLElement>(
    `[data-dragon="gauge-row-bar"] [data-dragon="gauge-row-${part}"]`,
  );
  return el ? Number.parseFloat(el.style.width) : undefined;
};

/** 頁の全ての見た目の規則。印刷の形の規則は `print` を真にして読む */
function cssRules(print: boolean): CSSStyleRule[] {
  const isMedia = (rule: CSSRule): rule is CSSMediaRule => "media" in rule && "cssRules" in rule;
  const isStyle = (rule: CSSRule): rule is CSSStyleRule =>
    "selectorText" in rule && "style" in rule;
  return [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .flatMap((rule) =>
      isMedia(rule)
        ? print === rule.media.mediaText.includes("print")
          ? [...rule.cssRules]
          : []
        : print
          ? []
          : [rule],
    )
    .filter(isStyle);
}

afterEach(() => {
  for (const player of mounted.splice(0)) player.destroy();
  for (const host of hosts.splice(0)) host.remove();
  document.body.innerHTML = "";
  document.documentElement.lang = "";
});

describe("目盛りの内訳の札 (#3896)", () => {
  it("gauge-card-mark-after-name", () => {
    const diagram = diagramOf(notation());
    if (diagram === undefined) return;
    const rendered = dragon.renderDiagram(diagram, { lang: "ja" });
    const svg = svgOf(rendered.svg);
    const scene = placedOf(rendered, "budget");
    expect(scene, "目盛りの置き場所").toBeDefined();
    if (!scene) return;
    const circle = gaugeOf(svg, "budget")?.querySelector(".dg-nb circle");
    expect(circle, "札で見せる図の目盛りに印の丸が無い").not.toBeNull();
    const cx = Number(circle?.getAttribute("cx"));
    const cy = Number(circle?.getAttribute("cy"));
    const r = Number(circle?.getAttribute("r"));
    // 印は名前のすぐ右に、名前の字の高さの真ん中に置く
    const nameRight = scene.x + textWidth("1日の予算", TYPE.gaugeName);
    expect(
      cx - r - nameRight,
      `印の左の端 (${cx - r}) が名前の右の端 (${nameRight}) のすぐ右に無い`,
    ).toBeGreaterThanOrEqual(2);
    expect(
      cx - r - nameRight,
      `印の左の端 (${cx - r}) が名前の右の端 (${nameRight}) から離れすぎる`,
    ).toBeLessThanOrEqual(10);
    const middle = scene.y + LOOK.gauge.textH - 4 - TYPE.gaugeName.size * 0.35;
    expect(
      Math.abs(cy - middle),
      `印の真ん中 (${cy}) が名前の字の真ん中 (${middle}) に揃わない`,
    ).toBeLessThanOrEqual(1.5);
    // 値の字は、最も長い「110 / 100 USDC」の段も印の右に離れて始まる
    const values = [...(gaugeOf(svg, "budget")?.querySelectorAll(".dg-gv") ?? [])];
    expect(values.length, "値の字").toBeGreaterThan(0);
    for (const value of values) {
      const left = Number(value.getAttribute("x"));
      expect(
        left - (cx + r),
        `値の字「${value.textContent}」の左の端 (${left}) が印の右の端 (${cx + r}) に重なる`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("gauge-card-opens-under-gauge", () => {
    const placed = mount(notation());
    if (!placed) return;
    const { host, player } = placed;
    player.goTo(5);
    expect(openCards(host), "押す前に開いている札").toEqual([]);
    const key = pressGauge(host);
    expect(openCards(host), "目盛りを押した後に開いている札").toEqual([key]);
    const card = cardOf(host, key);
    // 見出しは目盛りの名前と上限と単位
    const head = card?.querySelector('[data-dragon="note-name"]')?.textContent ?? "";
    expect(head, "札の見出しに目盛りの名前が無い").toContain("1日の予算");
    expect(
      card?.querySelector('[data-dragon="gauge-card-limit"]')?.textContent,
      "札の見出しの上限と単位",
    ).toBe("上限 100 USDC");
    // 札は目盛りのすぐ下に、目盛りと真ん中を揃えて出る。位置は図の枠の左上から測る
    const top = Number.parseFloat(card?.style.top ?? "");
    const left = Number.parseFloat(card?.style.left ?? "");
    const width = Number.parseFloat(card?.style.width ?? "");
    const bottom = GAUGE.top + GAUGE.height - FRAME.top;
    expect(
      top > bottom && top <= bottom + 16,
      `札の上端 (${top}) が目盛りの下端 (${bottom}) のすぐ下に無い`,
    ).toBe(true);
    expect(
      Math.abs(left + width / 2 - (GAUGE.left + GAUGE.width / 2 - FRAME.left)),
      `札の真ん中 (${left + width / 2}) が目盛りの真ん中に揃わない`,
    ).toBeLessThanOrEqual(1);
    // 札の外を押すと閉じる
    press(document.body);
    expect(openCards(host), "札の外を押した後に開いている札").toEqual([]);
    // 閉じるのアイコンを押すと閉じる
    pressGauge(host);
    press(cardOf(host, key)?.querySelector('[data-dragon="note-close"]') ?? null);
    expect(openCards(host), "閉じるのアイコンを押した後に開いている札").toEqual([]);
    // 段を送ると閉じる
    player.goTo(4);
    pressGauge(host);
    expect(openCards(host), "5段目で目盛りを押した後に開いている札").toEqual([key]);
    press(host.querySelector('[data-dragon="next"]'));
    expect(player.step, "次の段へ送った後の段").toBe(5);
    expect(openCards(host), "次の段へ送った後に開いている札").toEqual([]);
  });

  it("gauge-card-rows-up-to-step", () => {
    const placed = mount(notation());
    if (!placed) return;
    const { host, player } = placed;
    // 3段目では、1段目から3段目までの行だけを出す
    player.goTo(2);
    const key = pressGauge(host);
    const early = rowsOf(cardOf(host, key));
    expect(
      early.map((row) => row.dataset.step),
      "3段目で出す行の段",
    ).toEqual(["0", "1", "2"]);
    // 最後の段では、値を書いた段を全て順に並べ、値を書かない4段目の行は持たない
    player.goTo(5);
    pressGauge(host);
    const card = cardOf(host, key);
    expect(
      rowsOf(card, true).map((row) => row.dataset.step),
      "札が持つ行の段",
    ).toEqual(["0", "1", "2", "4", "5"]);
    const rows = rowsOf(card);
    expect(
      rows.map((row) => row.dataset.step),
      "最後の段で出す行の段",
    ).toEqual(["0", "1", "2", "4", "5"]);
    expect(
      rows.map((row) => partText(row, "no")),
      "行の段の番号",
    ).toEqual(["1", "2", "3", "5", "6"]);
    expect(
      rows.map((row) => partText(row, "name")),
      "行の段の名前",
    ).toEqual(["1件目を送る", "2件目を予約する", "予約を確定する", "3件目で止める", "1件を戻す"]);
    expect(
      rows.map((row) => partText(row, "delta")),
      "行の増えた量",
    ).toEqual(["+40", "+30", "±0", "+40", "−20"]);
    expect(
      rows.map((row) => partText(row, "value")),
      "行のその時の値",
    ).toEqual(["40 USDC", "70 USDC", "70 USDC", "110 USDC", "90 USDC"]);
  });

  it("gauge-card-row-bars", () => {
    const placed = mount(
      notation(
        " [note: pop]",
        ["gauge count as 件数 [on: signer]"],
        ["set count: 1", "set count: 2"],
      ),
    );
    if (!placed) return;
    const { host, player } = placed;
    player.goTo(5);
    const rows = rowsOf(cardOf(host, pressGauge(host)));
    // 棒は、その段の終わりの目盛りを上限に対する割合で描く。確定は濃い色、予約は総量まで淡い色、上限を超えた分は赤
    const parts = rows.map((row) => [
      barPart(row, "fill"),
      barPart(row, "held"),
      barPart(row, "over"),
    ]);
    const want = [
      [40, undefined, undefined],
      [40, 70, undefined],
      [70, undefined, undefined],
      [100, undefined, 10],
      [90, undefined, undefined],
    ];
    expect(parts.length, "棒を持つ行の数").toBe(want.length);
    parts.forEach((got, k) =>
      got.forEach((v, p) => {
        const w = want[k]?.[p];
        if (w === undefined)
          expect(v, `${k + 1}行目の${["確定", "予約", "超えた分"][p]}の塗り`).toBeUndefined();
        else
          expect(
            v ?? Number.NaN,
            `${k + 1}行目の${["確定", "予約", "超えた分"][p]}の塗りの長さ`,
          ).toBeCloseTo(w, 1);
      }),
    );
    // 上限を書かない目盛りの札の行は棒を描かない
    press(document.body);
    const counts = rowsOf(cardOf(host, pressGauge(host, "count")));
    expect(
      counts.map((row) => partText(row, "value")),
      "上限を書かない目盛りの行の値",
    ).toEqual(["1", "2"]);
    expect(
      counts.map((row) => row.querySelector('[data-dragon="gauge-row-bar"]')),
      "上限を書かない目盛りの行の棒",
    ).toEqual([null, null]);
  });

  it("gauge-card-hold-and-over", () => {
    for (const lang of ["ja", "en"] as const) {
      const placed = mount(notation(" [note: pop]", [], [], lang), lang);
      if (!placed) return;
      const { host, player } = placed;
      player.goTo(5);
      const rows = rowsOf(cardOf(host, pressGauge(host)));
      // 予約を持つ2段目の行だけが、色の四角と確定と予約の内訳を持つ
      const splits = rows.map((row) => row.querySelector('[data-dragon="gauge-row-split"]'));
      expect(
        splits.map((s) => s !== null),
        `${lang} の内訳を持つ行`,
      ).toEqual([false, true, false, false, false]);
      const words = lang === "ja" ? ["確定 40", "予約 30"] : ["confirmed 40", "held 30"];
      for (const word of words)
        expect(splits[1]?.textContent ?? "", `${lang} の内訳の字`).toContain(word);
      expect(
        splits[1]?.querySelectorAll('[data-dragon="gauge-row-swatch"]').length,
        `${lang} の内訳の色の四角`,
      ).toBe(2);
      // 上限を超えた5段目の行だけが、値の字を赤で描く印を持つ
      expect(
        rows.map((row) => row.hasAttribute("data-over")),
        `${lang} の上限を超えた行`,
      ).toEqual([false, false, false, true, false]);
      for (const player_ of mounted.splice(0)) player_.destroy();
    }
    const red = cssRules(false).find(
      (rule) => rule.selectorText.includes("[data-over]") && rule.style.color.includes("--t-rose"),
    );
    expect(red, "上限を超えた行の値の字を赤で描く決まりが無い").toBeDefined();
  });

  it("gauge-card-print-shows-all-rows", () => {
    const text = notation(" [note: pop]", ["gauge count as 件数 [on: signer]"], ["set count: 1"]);
    const placed = mount(text);
    const diagram = diagramOf(text);
    if (!placed || diagram === undefined) return;
    const { host, player } = placed;
    const rendered = dragon.renderDiagram(diagram, { lang: "ja" });
    const { width, height } = rendered.layout as { width: number; height: number };
    // 札は押す前から全ての目盛りの分を持つ
    const keys = ["budget", "count"].map(
      (id) => pressableOf(host, id)?.getAttribute("data-note") ?? "",
    );
    const cards = keys.map((key) => cardOf(host, key));
    expect(
      cards.every((card) => card !== null),
      "押す前に全ての目盛りの札を持たない",
    ).toBe(true);
    // 札は印刷の形で目盛りの下に置くため、図の幅と高さに対する目盛りの真ん中と下端の割合を持つ
    const scene = placedOf(rendered, "budget");
    if (!scene) return;
    expect(
      Number.parseFloat(cards[0]?.style.getPropertyValue("--nx") ?? ""),
      "目盛りの札の印刷の横の位置",
    ).toBeCloseTo(((scene.x + scene.w / 2) / width) * 100, 1);
    expect(
      Number.parseFloat(cards[0]?.style.getPropertyValue("--ny") ?? ""),
      "目盛りの札の印刷の縦の位置",
    ).toBeCloseTo(((scene.y + scene.h) / height) * 100, 1);
    // 画面で2段目に絞った札も、印刷の形では全ての行を出す
    player.goTo(1);
    pressGauge(host);
    expect(rowsOf(cards[0] ?? null).length, "2段目で画面に出す行の数").toBe(2);
    expect(rowsOf(cards[0] ?? null, true).length, "札が持つ行の数").toBe(5);
    const print = cssRules(true);
    const shown = print.find(
      (rule) =>
        rule.selectorText.includes(".dg-nc") &&
        !rule.selectorText.includes("[data-open]") &&
        rule.style.display === "block",
    );
    expect(shown, "印刷の形で閉じた札を開いて描く決まりが無い").toBeDefined();
    const all = print.find(
      (rule) =>
        rule.selectorText.includes("[hidden]") &&
        rule.selectorText.includes("dg-ngr") &&
        rule.style.display !== "" &&
        rule.style.display !== "none",
    );
    expect(all, "印刷の形で画面に出さない行も描く決まりが無い").toBeDefined();
  });

  it("gauge-card-only-with-pop-and-values", () => {
    // [note: pop] を書かない図の目盛りは印も札も持たない
    const plain = diagramOf(notation(""));
    if (plain === undefined) return;
    const svg = svgOf(dragon.renderDiagram(plain, { lang: "ja" }).svg);
    expect(pressableOf(svg, "budget"), "札で見せない図の目盛りの押せる組").toBeNull();
    expect(
      gaugeOf(svg, "budget")?.querySelector(".dg-nb") ?? null,
      "札で見せない図の目盛りの印",
    ).toBeNull();
    const placedPlain = mount(notation(""));
    if (!placedPlain) return;
    expect(
      placedPlain.host.querySelectorAll('[data-dragon="note-card"]').length,
      "札で見せない図の札",
    ).toBe(0);
    // 値を1度も書かない目盛りは、札で見せる図でも印も札も持たない
    const placed = mount(
      notation(" [note: pop]", ["gauge idle as 使わない予算 [on: signer, limit: 50]"]),
    );
    if (!placed) return;
    expect(gaugeOf(placed.host, "idle"), "値を書かない目盛り").not.toBeNull();
    expect(pressableOf(placed.host, "idle"), "値を書かない目盛りの押せる組").toBeNull();
    expect(
      gaugeOf(placed.host, "idle")?.querySelector(".dg-nb") ?? null,
      "値を書かない目盛りの印",
    ).toBeNull();
    const boxes = [...placed.host.querySelectorAll('[data-dragon="note-card"]')].map((card) =>
      card.getAttribute("data-box"),
    );
    expect(boxes, "値を書いた目盛りだけが札を持つ").toEqual([
      pressableOf(placed.host, "budget")?.getAttribute("data-note"),
    ]);
  });

  it("gauge-card-docs", () => {
    const docs: readonly [string, RegExp][] = [
      ["packages/dragon/src/blocks/gauge/gallery/docs.ts", /目盛りを押すと/u],
      ["packages/dragon/src/blocks/gauge/gallery/docs.ts", /click(?:ing)? (?:a|the) gauge/iu],
      ["packages/dragon/examples/quick-start.md", /目盛りを押すと/u],
      ["packages/dragon/examples/quick-start.en.md", /click(?:ing)? (?:a|the) gauge/iu],
      ["plugins/dragon/skills/dragon/references/cheatsheet.md", /click(?:ing)? (?:a|the) gauge/iu],
    ];
    for (const [file, pattern] of docs) {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      expect(
        pattern.test(text),
        `${file} が、目盛りを押すと内訳の札が開くことを書かない (${pattern})`,
      ).toBe(true);
    }
    const musubi = JSON.parse(
      readFileSync(join(process.cwd(), "plugins/dragon/skills/dragon/musubi.json"), "utf8"),
    ) as {
      provides: Record<string, { version: string }>;
    };
    // 後の課題が早見表の版を上げても落ちないよう、この課題で上げた1.2.0以上と見る (#4040)
    const version = musubi.provides.cheatsheet?.version ?? "0.0.0";
    const [major = 0, minor = 0] = version.split(".").map(Number);
    expect(major > 1 || (major === 1 && minor >= 2), `スキルの cheatsheet の版 (${version}) が1.2.0より前`).toBe(true);
  });
});
