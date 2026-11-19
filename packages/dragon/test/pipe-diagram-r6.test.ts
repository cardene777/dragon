// @vitest-environment jsdom
/**
 * 第6回の試作の形の配管の図 (#3398)。
 *
 * `pipe-diagram.test.ts` から分けた組 (#3738)。1 つの file では、混んだ機械で 1 回の実行の上限 (5 分) の中で終わらなかった。
 */
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { motionFrom } from "./motion-support";
import { draw, figureVars, type Rendered } from "./render-support";
import { type Point, exampleJson, repoText, render, partyOf, levelOf, tankOf, plateOf, center, lastStep, stillOf, partsOf, seen, classRules, roleOf, dashed, onPath, inside, changes, openedAggregator, tankCount, shownTexts, countsFromTo } from "./pipe-diagram-support";

// 件の中で見本を描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。file を読み込む段で描き、件は描いた物を読む
const DRAWN = await atLoad("見本 swap と、箱を開いた Aggregator の図を描く", () => {
  const source = exampleJson("swap.json");
  return { source, swap: render(source), opened: openedAggregator() };
});

describe("第6回の試作の形の配管の図 (#3398)", () => {

  it("pipe-r6-token-box-holds-values", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source);
    const { layout } = rendered;
    const box = partyOf(layout, "usdc");
    expect(box.shape, "USDC の名札の形").toBe("token");
    const name = "allowance[alice][router]";
    // hold で宣言したトークンの箱の値は、箱の中の名前の下に書く
    for (let s = 0; s <= lastStep(source); s++) {
      const plate = plateOf(layout, "usdc", name, s);
      expect(inside(plate, box), `段 ${s + 1} の許可額の札が USDC の箱の中に無い`).toBe(true);
      expect(plate.y, `段 ${s + 1} の許可額の札が USDC の箱の名前の下に無い`).toBeGreaterThanOrEqual(box.y + 18);
    }
    // write の段で、前の値を消し線で残す
    const written = plateOf(layout, "usdc", name, 4);
    expect([written.value, written.was?.text, written.state], "write の段の許可額の札").toEqual(["0", "100", "provisional"]);
    const was = written.was ?? { x: Number.NaN, y: Number.NaN, w: 0, h: 0 };
    expect(
      written.strike !== undefined && written.strike.x <= was.x + 1 && written.strike.x + written.strike.w >= was.x + was.w - 1,
      "write の段の前の許可額に消し線が無い",
    ).toBe(true);
    const motion = motionFrom(rendered as unknown as Rendered);
    const drawn = partsOf(motion, `[data-pipe-plate="usdc"][data-pipe-step="4"]`)[0] as Element;
    const texts = [...drawn.querySelectorAll("text, tspan")].map((t) => t.textContent ?? "");
    for (const want of [name, "100"]) expect(texts, `描いた write の段の許可額の札に ${want} が無い`).toContain(want);
    // 書き込んだ値は、箱の行の値が前の値から次の値へ数えて見せる (Tracelyth #221、#3761)
    const row = [...motion.doc.querySelectorAll(".dg-pp-tplate .dg-pp-tval")].filter((el) => Math.abs(Number(el.getAttribute("y")) - written.text.base) < 0.5);
    const shown = shownTexts(rendered, motion, 4, row);
    expect(countsFromTo(shown, "100", "0"), `write の段の許可額が 100 から 0 へ数えない (${shown.join(" / ")})`).toBe(true);
  });

  it("pipe-r6-tank-parts", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source, "ja");
    const { layout, svg } = rendered;
    const motion = motionFrom(rendered as unknown as Rendered);
    // 槽はつやと 5 本の目盛りとトークンの名前を持つ
    for (const tank of layout.tanks) {
      const g = partsOf(motion, `[data-pipe-tank="${tank.party}"][data-pipe-token="${tank.token}"]`)[0] as Element;
      expect(g.querySelectorAll("[data-pipe-shine]").length, `${tank.party} の ${tank.token} の槽につやが無い`).toBeGreaterThan(0);
      expect(g.querySelectorAll("[data-pipe-tick]").length, `${tank.party} の ${tank.token} の槽の目盛りの数`).toBe(5);
      expect(
        [...g.querySelectorAll("text")].map((t) => t.textContent),
        `${tank.party} の ${tank.token} の槽にトークンの名前が無い`,
      ).toContain(tank.token);
    }
    // 槽の下に 3 桁ごとに区切った大きな数を出す
    for (const level of layout.levels) {
      const tank = tankOf(layout, level.party, level.token);
      expect(level.text.y, `段 ${level.step + 1} の ${level.party} の ${level.token} の数が槽の下に無い`).toBeGreaterThanOrEqual(tank.y + tank.h);
    }
    expect([levelOf(layout, "alice", "USDC", 0).text.text, levelOf(layout, "pool", "USDC", 0).text.text], "段 1 の槽の下の数").toEqual(["1,000", "2,000"]);
    // トークンごとに液の色を分ける
    const fillOf = (party: string, token: string): string => {
      const el = partsOf(motion, `[data-pipe-level="${party}"][data-pipe-token="${token}"][data-pipe-step="0"]`)[0] as Element;
      return [el, ...el.querySelectorAll("*")].map((e) => `${e.getAttribute("fill") ?? ""}${e.getAttribute("style") ?? ""}${classRules(svg, e).join("")}`).join("|");
    };
    expect(fillOf("pool", "USDC"), "USDC と WETH の液が同じ色").not.toBe(fillOf("pool", "WETH"));
  });

  it("pipe-r6-gauge-on-pipe", () => {
    const { source, swap: rendered } = DRAWN.get();
    const { layout } = rendered;
    const last = lastStep(source);
    // 図の上に確認の印の列は描かない
    expect(layout.checks, "図の上に確認の印がある").toEqual([]);
    expect(layout.heads?.checks, "図の上の端に確認の行の字がある").toBeUndefined();
    const motion = motionFrom(rendered as unknown as Rendered);
    // 値を払う前の確認は払う値の管に載せる。Pool の最低額の確認 (0.05 WETH >= 0.04 WETH) は、Pool が払う WETH の管に載る
    for (const [party, step, on, token] of [
      ["router", 1, "call", ""],
      ["usdc", 3, "value", "USDC"],
      ["pool", 8, "value", "WETH"],
    ] as const) {
      const own = layout.gauges.filter((g) => g.party === party);
      // 確かめた段の後も、針と通ったかの印を残す
      expect(
        own.map((g) => g.step),
        `${party} の計器を描く段`,
      ).toEqual(Array.from({ length: last - step + 1 }, (_, i) => step + i));
      expect(own.every((g) => g.ok && g.on === on), `${party} の計器の結果と載せる管`).toBe(true);
      const g = own[0];
      if (!g) continue;
      const mid: Point = [center(g), g.y + g.h / 2];
      if (on === "call") {
        const pipe = layout.calls.find((c) => c.to === party);
        expect(onPath(mid, pipe?.points ?? []), `${party} の計器が ${party} を呼んだ管の上に無い`).toBe(true);
      } else {
        const bus = layout.buses.find((b) => b.token === token && b.valve);
        expect(mid[0] > (bus?.x1 ?? Number.NaN) && mid[0] < (bus?.x2 ?? Number.NaN), `${party} の計器が ${token} の値の管の横の範囲に無い`).toBe(true);
        expect(mid[1] < (bus?.y ?? Number.NaN) && (bus?.y ?? Number.NaN) - mid[1] <= 90, `${party} の計器が ${token} の値の管の上に無い`).toBe(true);
      }
      for (let s = step; s <= last; s++) {
        const sel = `[data-pipe-gauge="${party}"][data-pipe-step="${s}"]`;
        expect(seen(motion, sel, stillOf(rendered, s)), `段 ${s + 1} に ${party} の計器が見えない`).toBeGreaterThan(0.9);
        const drawn = partsOf(motion, sel)[0] as Element;
        expect(drawn.querySelector("[data-pipe-needle]"), `段 ${s + 1} の ${party} の計器に針が無い`).not.toBeNull();
        expect(drawn.querySelector("[data-pipe-lamp]"), `段 ${s + 1} の ${party} の計器に通ったかの印が無い`).not.toBeNull();
      }
    }
  });

  it("pipe-r6-converter-between-tanks", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source);
    const { layout, svg } = rendered;
    const last = lastStep(source);
    const own = layout.converters.filter((c) => c.party === "pool");
    expect(
      own.map((c) => c.step),
      "Pool の変換器を描く段",
    ).toEqual(Array.from({ length: last + 1 }, (_, i) => i));
    expect(
      own.filter((c) => c.active).map((c) => c.step),
      "Pool の変換器が計算する段",
    ).toEqual([7]);
    // 変換器は Pool の 2 つの槽の間に置く
    const usdc = tankOf(layout, "pool", "USDC");
    const weth = tankOf(layout, "pool", "WETH");
    const [l, r] = usdc.x < weth.x ? [usdc, weth] : [weth, usdc];
    for (const c of own) {
      expect(center(c) > l.x + l.w && center(c) < r.x, `段 ${c.step + 1} の変換器が Pool の 2 つの槽の間に無い`).toBe(true);
      const mid = c.y + c.h / 2;
      expect(mid > Math.max(l.y, r.y) && mid < Math.min(l.y + l.h, r.y + r.h), `段 ${c.step + 1} の変換器が槽の横の高さに無い`).toBe(true);
    }
    // Pool の槽を点線の囲いで囲む
    const housing = (layout.housings ?? []).find((h) => h.party === "pool");
    expect(housing, "Pool の槽の囲いが無い").toBeDefined();
    if (housing) for (const t of [usdc, weth]) expect(inside(t, housing), `Pool の ${t.token} の槽が囲いの中に無い`).toBe(true);
    const motion = motionFrom(rendered as unknown as Rendered);
    expect(
      partsOf(motion, '[data-pipe-housing="pool"]').some((el) => dashed(svg, el)),
      "Pool の槽の囲いが点線でない",
    ).toBe(true);
    // 計算する段で、変換器を値の色にする
    expect(roleOf(svg, partsOf(motion, '[data-pipe-converter="pool"][data-pipe-step="7"]')[0] as Element), "計算する段の変換器が値の色 (c-amber) でない").toBe("amber");
    expect(roleOf(svg, partsOf(motion, '[data-pipe-converter="pool"][data-pipe-step="6"]')[0] as Element), "計算しない段の変換器が値の色").not.toBe("amber");
  });

  it("pipe-r6-motions", () => {
    const rendered = render(exampleJson("swap.json"));
    const motion = motionFrom(rendered as unknown as Rendered);
    const startOf = (s: number): number => rendered.timeline.steps[s]?.start ?? Number.NaN;
    // 呼び出しの段で、管が光って帯の中を筋が流れる。弁の取っ手は描かない (Tracelyth #168、#3720)
    const lit = '[data-pipe-branch="alice>router"][data-pipe-pipe="open"][data-pipe-step="0"]';
    expect(seen(motion, lit, startOf(0)), "呼び出しの段の始まりに管が光っている").toBeLessThan(0.1);
    expect(seen(motion, lit, stillOf(rendered, 0)), "呼び出しの段の止め絵で管が光らない").toBeGreaterThan(0.9);
    expect(
      partsOf(motion, lit).some((el) => changes(motion, el, "stroke-dashoffset", startOf(0), stillOf(rendered, 0))),
      "呼び出しの段で管の中の筋が流れない",
    ).toBe(true);
    expect(motion.doc.querySelectorAll("[data-pipe-lever]").length, "弁の取っ手を描く").toBe(0);
    // move の段で、槽の数が前の額から次の額へ数えて水位が変わる (Tracelyth #221、#3761)
    const { layout } = rendered;
    const [was, now] = [3, 4].map((s) => levelOf(layout, "pool", "USDC", s).text.text) as [string, string];
    expect(countsFromTo(tankCount(rendered, motion, 4, "pool", "USDC"), was, now), `move の段で Pool の USDC の槽の数が ${was} から ${now} へ数えない`).toBe(true);
    const pool = partsOf(motion, '[data-pipe-level="pool"][data-pipe-token="USDC"][data-pipe-step="4"]');
    expect(
      pool.some((el) => changes(motion, el, "transform", startOf(4), stillOf(rendered, 4))),
      "move の段で Pool の USDC の水位が動かない",
    ).toBe(true);
    // check の段で、計器の針が振れて印が付く
    const needle = partsOf(motion, '[data-pipe-gauge="router"][data-pipe-step="1"] [data-pipe-needle]');
    expect(
      needle.some((el) => changes(motion, el, "transform", startOf(1), stillOf(rendered, 1))),
      "check の段で計器の針が振れない",
    ).toBe(true);
    const lamp = '[data-pipe-gauge="router"][data-pipe-step="1"] [data-pipe-lamp]';
    expect(seen(motion, lamp, startOf(1)), "check の段の始まりに印が付いている").toBeLessThan(0.1);
    expect(seen(motion, lamp, stillOf(rendered, 1)), "check の段の止め絵に印が無い").toBeGreaterThan(0.9);
  });

  it("pipe-r6-final-step-draws-all-tanks", () => {
    const rendered = DRAWN.get().opened;
    const { layout } = rendered;
    const last = rendered.timeline.steps.length - 1;
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const [party, token] of [
      ["alice", "USDC"],
      ["router", "WETH"],
      ["bob", "WETH"],
    ] as const) {
      const glass = layout.glasses.find((g) => g.step === last && g.party === party && g.token === token);
      expect(glass, `最後の段に ${party} の ${token} の槽が無い`).toBeDefined();
      const tank = tankOf(layout, party, token);
      expect(inside(tank, { x: 0, y: 0, w: layout.width, h: layout.height }), `${party} の ${token} の槽が図の外にはみ出す`).toBe(true);
      levelOf(layout, party, token, last);
      expect(
        seen(motion, `[data-pipe-level="${party}"][data-pipe-token="${token}"][data-pipe-step="${last}"]`, stillOf(rendered, last)),
        `最後の段に ${party} の ${token} の水が見えない`,
      ).toBeGreaterThan(0.9);
    }
  });

  it("pipe-default-palette-is-sea", () => {
    const palettes = draw("PALETTES");
    const sea = palettes.sea;
    expect(sea, "色味 sea が値の表に無い").toBeDefined();
    const source = exampleJson("swap.json");
    for (const theme of ["light", "dark"] as const) {
      // 色味を指定しない配管の図は sea で描く
      const plain = draw("renderDiagram")(source, { theme });
      expect(plain.palette, `色味を指定しない配管の図 (${theme}) の色味`).toBe("sea");
      const vars = figureVars(plain.svg);
      for (const key of ["bg", "ink", "c-blue", "c-amber", "c-green"]) expect(vars[key], `色味を指定しない配管の図 (${theme}) の ${key}`).toBe(sea?.[theme]?.[key]);
      // 色味を指定した時はその色味で描く
      const paper = draw("renderDiagram")(source, { theme, palette: "paper" });
      expect(paper.palette, `色味 paper を指定した配管の図 (${theme}) の色味`).toBe("paper");
      expect(figureVars(paper.svg)["c-blue"], `色味 paper を指定した配管の図 (${theme}) の c-blue`).toBe(palettes.paper?.[theme]?.["c-blue"]);
    }
    // 配管の図以外の図の既定の色味は変えない
    expect(draw("renderDiagram")(exampleJson("oauth.json")).palette, "配管の図以外の図の既定の色味").toBe("paper");
  });

  it("pipe-r6-parts-live-in-blocks", () => {
    const parts: [string, string[]][] = [
      ["hold", ["tank", "valuePipe", "tokenBox", "valve"]],
      ["check", ["gauge"]],
      ["calc", ["converter"]],
      ["write", ["plate"]],
      ["box", ["avatar", "cabinet"]],
    ];
    const pipe = repoText("packages/dragon/src/render/pipe.ts");
    expect(pipe, "packages/dragon/src/render/pipe.ts が無い").not.toBe("");
    for (const [block, names] of parts) {
      const path = `packages/dragon/src/blocks/${block}/draw.ts`;
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      // 部品はブロックの描き方が描き、配管の図の描き方はそれを呼んで組む
      for (const name of names) {
        expect(new RegExp(`export (?:function|const) ${name}\\b`, "u").test(text), `${path} が ${name} を描かない`).toBe(true);
        expect(
          new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "\\.\\./blocks/${block}/draw(?:\\.js)?"`, "u").test(pipe),
          `render/pipe.ts が blocks/${block}/draw.ts の ${name} を呼ばない`,
        ).toBe(true);
      }
    }
    // 色は値の表から読み、描き方の中に色の値を直接書かない
    for (const path of ["packages/dragon/src/render/pipe.ts", ...parts.map(([block]) => `packages/dragon/src/blocks/${block}/draw.ts`)]) {
      const code = repoText(path).replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gmu, "");
      const literal = /#[0-9a-fA-F]{3,8}\b(?![\w-])|\brgba?\(/u.exec(code.replace(/url\(#[\w-]+\)|href="#[\w-]+"|`#\$\{[^}]*\}`/gu, ""));
      expect(literal?.[0], `${path} に色の値が直接書かれている`).toBeUndefined();
    }
  });
});
