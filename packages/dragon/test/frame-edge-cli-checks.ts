/**
 * `frame-edge.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Layout } from "../src/layout/scene";
import { atLoad } from "./at-load";
import { runCli } from "./export-support";
import "../src/kinds/basics";
import "../src/kind-use/sequence";
import "../src/kind-use/state";

/*
 * 描く部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械で変換だけで 1 件の上限を超える (#3410)。
 * 時系列図と状態遷移図の部品は、種類の登録の file を読むだけで登録する (`src/kind-use/`)
 */
const [, { drawDiagram }, { parseNotation }, { LOOK }] = await Promise.all([
  import("../src/kinds/basics"),
  import("../src/render/draw"),
  import("../src/parser"),
  import("../src/look/values"),
]);

type DrawnFigure = import("../src/render/breaks").DrawnFigure;

type Ink = DrawnFigure["inks"][number];

const ROOT = process.cwd();

/** 段 5 の札「session id」が一番左の箱へ向かう線の先に留まり、段 1 の札「email + password」が一番左の箱の左で待つ図 */
const LOGIN = join(ROOT, "packages/dragon/test/fixtures/layout/login.dragon");

const LOGIN_TEXT = readFileSync(LOGIN, "utf8");

/** 記法 `text` を描き、図の大きさと、描く処理が記録した字と、置き場所を返す */
function draw(text: string): { width: number; layout: Layout; inks: Ink[] } {
  const parsed = parseNotation(text, { lang: "ja" });
  if (!parsed.ok) throw new Error(`図を読めない: ${JSON.stringify(parsed.errors)}`);
  let figure: DrawnFigure | undefined;
  const rendered = drawDiagram(parsed.diagram, {
    lang: "ja",
    findBreaks: (drawn) => {
      figure = drawn;
      return [];
    },
  });
  if (!figure) throw new Error("描く処理が描いた物を渡さない");
  return { width: rendered.layout.width, layout: rendered.layout, inks: figure.inks };
}

/** 中心が `seat` にある札 `text` の記録。運ぶ物は留まる所ごとに 1 件記録される */
function inkAt(inks: Ink[], text: string, seat: [number, number] | undefined): Ink {
  expect(seat, `札「${text}」の留まる所が置き場所に無い`).toBeDefined();
  const [sx, sy] = seat ?? [Number.NaN, Number.NaN];
  const found = inks.find((ink) => ink.text === text && Math.abs(ink.rect.x + ink.rect.w / 2 - sx) < 0.5 && Math.abs(ink.rect.y + ink.rect.h / 2 - sy) < 0.5);
  expect(found, `札「${text}」が留まる所に記録されていない`).toBeDefined();
  return found as Ink;
}

/** 浮動小数の足し引きで余白が 1/1000 px 欠けても、余白を取ったと数える */
const EPS = 0.001;

// 件の中で dragon check の命令を子の process で起こすと、混んだ機械で 1 件 10 秒の上限を超えうる (#3816)。file を読み込む段で起こし、件はその結果を読む
const LOGIN_CHECKED = await atLoad("ログインの図を dragon check --layout で確かめる", () => runCli(["check", LOGIN, "--layout", "--json", "--lang", "ja"]));

describe("端の箱へ向かう線と出る線の札は図の枠の内側に余白を取る (#3515)", () => {
  it("sequence-tag-to-leftmost-box-inside-frame", () => {
    const { layout, inks } = draw(LOGIN_TEXT);
    const edge = layout.edges.find((e) => e.step === 4);
    const tag = inkAt(inks, "session id", edge?.settle);
    expect(tag.rect.x, "段 5 で一番左の箱へ着いた札「session id」の左端と図の枠の左端の間").toBeGreaterThanOrEqual(LOOK.margin - EPS);
    const ran = LOGIN_CHECKED.get();
    expect(ran.code, ran.stderr).toBe(0);
    const problems = JSON.parse(ran.stdout || "[]") as { layout?: unknown }[];
    expect(problems.filter((p) => p.layout !== undefined), "ログインの図に崩れを出す").toEqual([]);
  });
});
