/**
 * 画面の検査が手で書いている図の目印が、描く側の目印と一致していることを見る (#2579)。
 *
 * ## なぜ 1 箇所で見るか
 *
 * 描く側は目印を定数で出している (`STAGE_SVG_SELECTOR` / `NODE_FRAME_SELECTOR`)。 出している
 * 理由は入口のコメントが持つ = 文字列を写すと、描く側が目印を変えた時に使う側が何も掴まなくなる。
 *
 * それでも画面の検査は文字列を手で書いている (件数は § 舞台の目印が変わっていない の失敗の文面が
 * 走査して出す)。 `.v4-editor-preview svg[data-cdl-stage]` のように前置と組む形が多く、その大半が
 * `page.evaluate` の中に居る。 中に入れるには引数で渡す必要があり、書き換えると読みにくさが
 * 増える一方で **落ち方は変わらない** (定数を使っても、目印が変われば検査は落ちる)。
 *
 * そこで書き換えずに、**写しが安全であることを 1 箇所で確かめる**。 描く側の定数が今の文字列と
 * 一致しなくなったら、ここが落ちて直すべき file を名指しする。
 *
 * ## 期待する文字列を書いてよい唯一の場所
 *
 * 判定の期待値だけは literal で持つ。 これは写しではなく **実物と突き合わせる相手** で、
 * ずれたら落ちる形になっている (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。
 * file の一覧は走査で作り、手で並べない。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, it, expect } from "vitest";
import { STAGE_SVG_SELECTOR, NODE_FRAME_SELECTOR } from "@cardenelabs/cdl";

/** repo の root (この file から 3 つ上)。 */
const root = new URL("../../..", import.meta.url).pathname;

/** 画面の検査と単体の検査を集める。 走査先を間違えたら 0 件になり、空振りの判定が落とす。 */
function 検査のfile(): string[] {
  const out: string[] = [];
  const 降りる = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === "dist" || e.name.startsWith(".")) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) 降りる(p);
      else if (/\.(test|spec)\.tsx?$/.test(e.name)) out.push(p);
    }
  };
  for (const 起点 of ["packages", "apps"]) {
    const p = join(root, 起点);
    try {
      if (statSync(p).isDirectory()) 降りる(p);
    } catch {
      // 起点が無い配置は空振りの判定が落とす
    }
  }
  return out;
}

const 全 = 検査のfile();

/** その文字列を手で書いている file を挙げる (定数名を書いている行は写しではない)。 */
function 写している(値: string, 定数名: string): string[] {
  const 当たり: string[] = [];
  for (const f of 全) {
    const 行 = readFileSync(f, "utf8").split("\n");
    if (行.some((l) => l.includes(値) && !l.includes(定数名))) 当たり.push(f.slice(root.length));
  }
  return 当たり;
}

describe("図の目印が描く側と一致している (#2579)", () => {
  it("検査の file を 1 件以上集められている (空振り防止)", () => {
    expect(全.length, `走査先を間違えている (root ${root})`).toBeGreaterThan(0);
  });

  it("舞台の目印が変わっていない", () => {
    /*
     * 変わったらここが落ちる。 落ちた時に直す先を毎回数え直さなくてよいように、
     * 文字列を書いている file を失敗の文面に並べる。
     */
    const 直す先 = 写している("svg[data-cdl-stage]", "STAGE_SVG_SELECTOR");
    expect(
      STAGE_SVG_SELECTOR,
      `描く側の舞台の目印が変わった。 手で書いている ${直す先.length} file を直す:\n  ${直す先.join("\n  ")}`,
    ).toBe("svg[data-cdl-stage]");
  });

  it("箱の枠の目印が変わっていない", () => {
    const 直す先 = 写している("[data-cdl-frame]", "NODE_FRAME_SELECTOR");
    expect(
      NODE_FRAME_SELECTOR,
      `描く側の箱の枠の目印が変わった。 手で書いている ${直す先.length} file を直す:\n  ${直す先.join("\n  ")}`,
    ).toBe("[data-cdl-frame]");
  });

  it("写している file を実際に挙げられている", () => {
    /*
     * 上の 2 件は目印が変わらない限り通るため、一覧を作る側が壊れても緑のままになる。
     * 走査が実際に file を挙げることを別に押さえる (0 件なら走査が働いていない)。
     */
    expect(
      写している("svg[data-cdl-stage]", "STAGE_SVG_SELECTOR").length,
      `舞台の目印を手で書いている file を 1 件も挙げられていない (走査した ${全.length} file)`,
    ).toBeGreaterThan(0);
  });
});
