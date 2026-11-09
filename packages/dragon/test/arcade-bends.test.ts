// @vitest-environment jsdom
/**
 * arcade の色味で描いた図の線の折れ目を、bitsumi の記事の図と同じ直角にする (#3358)。
 *
 * 角を落とす色味 (`corner` の `cut`) では、45 度以上曲がる線の折れ目を丸めずに直角で描き、
 * 点で区切って描いた曲線 (git の枝の線、同じ箱へ戻る輪) の緩い曲がりは半径 12 の丸めのまま残す。
 * 線と矢じりの継ぎ目は尖らせ、絵柄の線の継ぎ目と、線の端は丸いまま残す。
 * clear、paper、night の線は今の形のまま変えない。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BEND,
  FILES,
  OTHERS,
  SQUARE_FROM,
  STROKES,
  THEMES,
  byClass,
  figureOf,
  isGlyph,
  linePrint,
  linesOf,
  near,
  rulesIn,
  strokeOf,
  type Curve,
  type Point,
} from "./bends-support";
import { changelogEntry } from "./changelog-support";

const ROOT = process.cwd();
const at = ([x, y]: Point): string => `(${x}, ${y})`;
const length = (a: Point, b: Point): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** paper と arcade で描いた同じ見本の線を、class と描いた順で組にする。paper で丸めた曲がりを持つ class だけを見る */
function linePairs(file: string, theme: (typeof THEMES)[number]) {
  const paper = byClass(linesOf(figureOf(file, "paper", theme)));
  const arcade = byClass(linesOf(figureOf(file, "arcade", theme)));
  const pairs: { cls: string; paper: Curve[]; arcade: ReturnType<typeof linesOf>[number] }[] = [];
  for (const [cls, lines] of paper) {
    if (!lines.some((line) => line.curves.length > 0)) continue;
    const others = arcade.get(cls) ?? [];
    expect(others.length, `${file} の ${theme} を arcade で描いた ${cls} の線の数`).toBe(lines.length);
    lines.forEach((line, i) => pairs.push({ cls, paper: line.curves, arcade: others[i] as ReturnType<typeof linesOf>[number] }));
  }
  return pairs;
}

const sameCurve = (a: Curve, b: Curve): boolean => near(a.from, b.from) && near(a.at, b.at) && near(a.to, b.to);

/** class ごとの、効いている線の端 */
const caps = (root: Element): Record<string, string> => {
  const rules = rulesIn(root);
  const out: Record<string, string> = {};
  for (const el of root.querySelectorAll(STROKES)) {
    const cls = el.getAttribute("class");
    if (cls) out[cls] = [...new Set([...(out[cls]?.split(" ") ?? []), strokeOf(el, "stroke-linecap", rules)])].sort().join(" ");
  }
  return out;
};

/** 線を持つ見本。見本ごとの検査が線を読めていることを、この見本で確かめる */
const WITH_LINES = "oauth.json";

describe.for(THEMES)("arcade の線 (%s)", (theme) => {
  // 検査は見本ごとに分ける (#3571)。全ての見本を 1 件で描くと、混んだ機械で 1 件の上限 (10 秒) を超える。角の検査の #3410 と同じ形
  describe.for(FILES)("%s", (file) => {
    it("arcade-draws-square-line-bends", () => {
      const wrong: string[] = [];
      for (const { cls, paper, arcade } of linePairs(file, theme)) {
        for (const c of arcade.curves.filter((c) => c.turn >= SQUARE_FROM))
          wrong.push(`${file} の ${cls} が ${Math.round(c.turn)} 度の折れ目 ${at(c.at)} を丸めている`);
        for (const c of paper.filter((c) => c.turn >= SQUARE_FROM)) {
          const corner = arcade.corners.find((k) => near(k.at, c.at) && k.turn >= SQUARE_FROM);
          if (!corner) wrong.push(`${file} の ${cls} の折れ目 ${at(c.at)} で、前後の区間が直に交わっていない`);
        }
      }
      expect(wrong).toEqual([]);
    });

    it("arcade-keeps-round-line-ends", () => {
      const paper = caps(figureOf(file, "paper", theme));
      const arcade = caps(figureOf(file, "arcade", theme));
      const shared = Object.fromEntries(Object.entries(arcade).filter(([cls]) => cls in paper));
      const expected = Object.fromEntries(Object.keys(shared).map((cls) => [cls, paper[cls]]));
      expect(shared, `${file} を arcade の ${theme} で描いた線の端`).toEqual(expected);
    });
  });

  it("arcade-line-examples-found", () => {
    // 見本ごとの検査は線を読めないと 1 件も確かめずに素通りする
    expect(FILES.length, "線を確かめる見本が無い (走査の空振り)").toBeGreaterThan(0);
    const root = figureOf(WITH_LINES, "arcade", theme);
    expect(linesOf(root).length, "線を 1 本も読めていない").toBeGreaterThan(0);
    expect(Object.values(caps(root)).filter((cap) => cap.includes("round")).length, "丸い端の線が 1 本も無い").toBeGreaterThan(0);
  });

  it("arcade-keeps-curves-smooth", () => {
    const wrong: string[] = [];
    let gentle = 0;
    for (const file of FILES) {
      for (const { cls, paper, arcade } of linePairs(file, theme)) {
        const before = paper.filter((c) => c.turn < SQUARE_FROM);
        const after = arcade.curves.filter((c) => c.turn < SQUARE_FROM);
        gentle += before.length;
        if (before.length !== after.length || !before.every((c, i) => sameCurve(c, after[i] as Curve)))
          wrong.push(`${file} の ${cls} の緩い曲がり ${before.length} 件が、arcade で同じ丸めになっていない (${after.length} 件)`);
        for (const c of after)
          if (length(c.from, c.at) > BEND + 0.1 || length(c.at, c.to) > BEND + 0.1)
            wrong.push(`${file} の ${cls} の曲がり ${at(c.at)} の丸めが半径 ${BEND} を超える`);
      }
    }
    expect(gentle, "点で区切った曲線の緩い曲がりが見本に 1 つも無い").toBeGreaterThan(0);
    expect(wrong).toEqual([]);
  });

  it("arcade-sharpens-line-and-arrow-joins", () => {
    const wrong: string[] = [];
    let [lines, glyphs] = [0, 0];
    for (const file of FILES) {
      const root = figureOf(file, "arcade", theme);
      const rules = rulesIn(root);
      for (const el of root.querySelectorAll(STROKES)) {
        const join = strokeOf(el, "stroke-linejoin", rules);
        const name = `${el.localName}.${el.getAttribute("class") ?? "(class 無し)"}`;
        if (isGlyph(el, root)) {
          glyphs++;
          if (join !== "round") wrong.push(`${file} の絵柄の線 ${name} の継ぎ目が丸くない (${join})`);
        } else {
          lines++;
          if (join === "round") wrong.push(`${file} の ${name} の継ぎ目が丸い`);
        }
      }
    }
    expect(lines, "線を 1 本も読めていない").toBeGreaterThan(0);
    expect(glyphs, "絵柄の線を 1 本も読めていない").toBeGreaterThan(0);
    // 同じ class の形は見本ごとに同じ規則で描くので、見本の名前を外して 1 行にまとめる
    expect([...new Set(wrong.map((w) => w.replace(/^\S+ の /u, "")))]).toEqual([]);
  });
});

/** 角を落とさない色味と明暗の組 */
const OTHER_CASES = OTHERS.flatMap((palette) => THEMES.map((theme) => ({ palette, theme })));

/** 線の形を変える前の記録 */
const before = JSON.parse(
  readFileSync(join(ROOT, "packages/dragon/test/fixtures/bends-before-arcade.json"), "utf8"),
) as Record<string, string>;

describe("線の形を変える前の記録 (#3358)", () => {
  it("bends-record-lists-every-example", () => {
    expect(Object.keys(before).sort(), "線の形を変える前の記録と見本の file").toEqual(FILES);
  });
});

describe.for(OTHER_CASES)("$palette の線 ($theme)", ({ palette, theme }) => {
  // 見本ごとに分ける理由は上の arcade の線と同じ (#3571)
  describe.for(FILES)("%s", (file) => {
    it("other-palettes-keep-round-bends", () => {
      const root = figureOf(file, palette, theme);
      expect(linePrint(root), `${file} を ${palette} の ${theme} で描いた線の道筋と継ぎ目と端`).toBe(before[file]);
      for (const line of linesOf(root))
        for (const c of line.curves)
          expect(length(c.from, c.at), `${file} の ${line.cls} の曲がり ${at(c.at)} の丸め`).toBeLessThanOrEqual(BEND + 0.1);
    });
  });

  it("other-palettes-round-some-bends", () => {
    // 見本ごとの検査は丸めた折れ目を読めないと素通りする。1 つ見つかれば足りるので、見つけた所で止める
    const found = FILES.some((file) => linesOf(figureOf(file, palette, theme)).some((line) => line.curves.some((c) => c.turn >= SQUARE_FROM)));
    expect(found, `${palette} の ${theme} で丸めた 45 度以上の折れ目が 1 つも無い`).toBe(true);
  });
});

describe("変更の一覧 (#3358)", () => {
  it("changelog-lists-arcade-bends", () => {
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"])
      expect(changelogEntry(join(ROOT, file), 3358), `${file} に arcade の線の折れ目の項 (#3358) が無い`).not.toBe("");
  });
});
