import { test, expect, type Page } from "@playwright/test";
import { verifyAllDiagramsDom, type CdlDiagram, type Discrepancy } from "@cardenelabs/cdl";

import * as cookbook from "../src/topics/catalog/cookbook.cdl";
import * as patterns from "../src/topics/catalog/patterns.cdl";
import * as presets from "../src/topics/catalog/presets.cdl";
import * as primitives from "../src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../src/topics/catalog/text-dsl.cdl";
import * as animation from "../src/topics/catalog/animation.cdl";
import * as styles from "../src/topics/catalog/styles.cdl";
import * as interactive from "../src/topics/catalog/interactive.cdl";
import * as ethereum from "../src/topics/catalog/ethereum.cdl";
import * as parts from "../src/topics/catalog/parts.cdl";

/**
 * 行の文字が node の枠に収まっているかを **実ブラウザ** で確かめる (cardene777/cdl#390)。
 *
 * 軸 16 (`row-vertical-spacing`) は layout 出力だけを見るので、 字形が baseline から下へ
 * どれだけ伸びるかを見込み (`ROW_GLYPH_DEPTH_RATIO`) で置いている。 その見込みは preset が
 * 出す文字の範囲を押さえるもので、 任意の文字列に対する上限ではない。 文字列ごとの実寸は
 * font に依存し、 実ブラウザでしか取れない。
 *
 * ## 検査対象は 412 見本のうち行を持つ 7 件
 *
 * 見本の頁は 1 件ずつ表示する形なので、 行を持つ見本を **id で名指しして開く**。 頁を開く
 * だけだと既定で選ばれた 1 件しか DOM に出ず、 行が 0 件のまま「違反なし」 になる
 * (最初にこの形で書いて、 空振りの確認 test に捕まえられた)。
 *
 * `verifyAllDiagramsDom` の他の検証 (bbox / particle / phase) は本 spec の関心ではないので
 * skip する。 それぞれ別の許容量と timing の前提を持ち、 混ぜると原因が読めなくなる。
 */

const isCdlDiagram = (v: unknown): v is CdlDiagram => {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && Array.isArray(o.nodes) && Array.isArray(o.lanes);
};

const collect = (mod: Record<string, unknown>): CdlDiagram[] =>
  Object.values(mod).filter(isCdlDiagram);

const SOURCES: Array<{ slug: string; diagrams: CdlDiagram[] }> = [
  { slug: "presets", diagrams: collect(presets) },
  { slug: "cookbook", diagrams: collect(cookbook) },
  { slug: "patterns", diagrams: collect(patterns) },
  { slug: "primitives", diagrams: [...collect(primitives), ...collect(primitivesExtra)] },
  { slug: "text-dsl", diagrams: collect(textDsl) },
  { slug: "animation", diagrams: collect(animation) },
  { slug: "ethereum", diagrams: collect(ethereum) },
  { slug: "parts", diagrams: collect(parts) },
  { slug: "styles", diagrams: collect(styles) },
  { slug: "interactive", diagrams: collect(interactive) },
];

/** その見本が行を持つか。 */
const hasRows = (d: CdlDiagram): boolean =>
  d.nodes.some((n) => Array.isArray(n.rows) && n.rows.length > 0);

/**
 * 行を持つ見本の **期待一覧**。 検査対象そのものから導かない。
 *
 * 導くと、 見本から `rows` が消えても / category を落としても残り 1 件で全 test が通る =
 * 対象が減ったことを検知できない。 現在の値を固定して、 増減を必ず気付く形にする。
 */
const EXPECTED: Array<{ slug: string; id: string; rows: number }> = [
  /*
   * `#1466` で 4 図を設計どおりに書き直した分を反映した (#1479 で実測)。
   *
   * | 見本 | 変更前 | 変更後 | 何が変わったか |
   * |---|---|---|---|
   * | `class-demo` | 12 | 18 | 属性と操作を設計どおりに並べ直して行が増えた |
   * | `er-demo` | 7 | 14 | 列を印 (主キー / 外部キー) 付きで並べ直して行が増えた |
   * | `fsm-demo` | (無) | 4 | 状態に `actions` を書けるようになり、行を持つ側に入った |
   * | `service-call-write-emit` | 1 | (無) | 行を持っていた `DB: storage` を見本から外した |
   *
   * **行が消えた回帰ではない**。 4 件とも `#1466` の書き直しと 1 対 1 で対応する。
   */
  { slug: "presets", id: "class-demo", rows: 18 },
  { slug: "presets", id: "er-demo", rows: 14 },
  { slug: "presets", id: "fsm-demo", rows: 4 },
  { slug: "patterns", id: "pattern-call-rw", rows: 1 },
  { slug: "patterns", id: "pattern-rollback", rows: 1 },
  { slug: "patterns", id: "pattern-validate-process", rows: 1 },
  // #1196 で「行数: {v}」 の行が増えて 3 になった。 一覧を直していなかったため落ちていた
  { slug: "primitives", id: "kind-storage", rows: 3 },
];

/** 行を持つ見本だけを `{slug, diagram}` に展開する。 */
const TARGETS = SOURCES.flatMap(({ slug, diagrams }) =>
  diagrams.filter(hasRows).map((diagram) => ({ slug, diagram })),
);

/** その見本が持つ行の総数。 DOM に出た数と突き合わせる。 */
const rowCount = (d: CdlDiagram): number =>
  d.nodes.reduce((n, node) => n + (node.rows?.length ?? 0), 0);

/** 見本を id で名指しして開き、 font の読込と描画を待つ。 */
async function openDiagram(page: Page, slug: string, id: string): Promise<void> {
  await page.goto(`catalog/${slug}`);
  await page.waitForSelector(".catalog-list-item", { timeout: 15000 });
  await page.locator(".catalog-list-item").filter({ hasText: id }).first().click();
  await page.waitForSelector(`[data-cdl-diagram="${id}"]`, { timeout: 15000 });
  // font 未読込だと代替 font の字形で測ることになり、 判定が環境に依存する。
  await page.evaluate(() => document.fonts.ready);
}

test.describe("行の文字が枠に収まっている (cdl#390)", () => {
  test("行を持つ見本の一覧が期待どおり", () => {
    // 見本から `rows` が消えた / 増えた / category が落ちた を検知する。 対象が減ると
    // 以下の test は残った分だけで通ってしまい、 減ったことに気付けない。
    const actual = TARGETS
      .map(({ slug, diagram }) => ({ slug, id: diagram.id, rows: rowCount(diagram) }))
      .sort((a, b) => (a.slug + a.id).localeCompare(b.slug + b.id));
    const expected = [...EXPECTED].sort((a, b) => (a.slug + a.id).localeCompare(b.slug + b.id));
    expect(actual).toEqual(expected);
  });

  for (const { slug, diagram } of TARGETS) {
    test(`${diagram.id} の行が枠に収まっている`, async ({ page }) => {
      await openDiagram(page, slug, diagram.id);

      // 行が DOM に出ていることを先に確かめる。 出ていなければ以下の 0 件は「検査した上で
      // 0 件」 ではなく「何も検査していない」 になる。
      const measured = await page
        .locator(`[data-cdl-diagram="${diagram.id}"] [data-cdl-node] [data-cdl-role="node-row"]`)
        .count();
      expect(measured, `${diagram.id} の行が DOM に出ている`).toBeGreaterThan(0);

      const report = await verifyAllDiagramsDom(page, [diagram], {
        skipBbox: true, skipParticle: true, skipPhase: true,
      });
      const overflow = report.discrepancies.filter(
        (d: Discrepancy) => d.kind === "node-row-overflow",
      );
      expect(overflow.map((d) => d.detail)).toEqual([]);
      // **測定不能も 0 件であること**。 これを見ないと、 実寸が 1 行も測れていない状態
      // (枠の要素が無い / font が読めない / CTM が取れない) でも上の 0 件が成立してしまう。
      const unverifiable = report.discrepancies.filter(
        (d: Discrepancy) => d.kind === "node-row-unverifiable",
      );
      expect(unverifiable.map((d) => d.detail)).toEqual([]);
    });
  }

  test("字形が深い行を実ブラウザで検知する", async ({ page }) => {
    // 本検査の存在理由そのもの。 軸 16 は layout 出力だけを見るので、 文字列が変わっても
    // 判定は動かない。 実 DOM で測って初めて捕まる。
    //
    // 結合文字を重ねると字形が baseline から大きく下へ伸びる。 `rows` に直接書ける形なので、
    // 著者が書けば実際に起こりうる。
    //
    // **この経路は矩形では捕まらない**。 `getBoundingClientRect()` / `getBBox()` の高さは
    // font metrics の箱で、 中身を反映しない (実測 = `a` / `gjpqy` / `日本語` / 結合文字 40 個
    // のいずれも同じ高さ)。 canvas の ink 実寸でしか差が出ないため、 本 test は実装が ink を
    // 見ていることの証明も兼ねる。
    const target = TARGETS[0];
    // 一覧が空だと以下の検査は何も見ずに通る。 引けない形はここで落とす
    expect(target, "対象の見本が 1 件も無い (検査が空振りしている)").toBeDefined();
    if (target === undefined) return;
    await openDiagram(page, target.slug, target.diagram.id);

    const sel = `[data-cdl-diagram="${target.diagram.id}"] [data-cdl-node] [data-cdl-role="node-row"]`;
    const before = await verifyAllDiagramsDom(page, [target.diagram], {
      skipBbox: true, skipParticle: true, skipPhase: true,
    });
    expect(
      before.discrepancies.filter((d: Discrepancy) => d.kind === "node-row-overflow"),
      "変える前は発火しない",
    ).toEqual([]);

    // **最終行** の文字を、 下方向に深く伸びる結合文字の列に差し替える。 最終行を選ぶのは、
    // 上の行だと枠の下端まで余裕があり、 深い字形でも収まってしまうため (実測 = 1 行目では
    // 100px 下がっても枠まで 17px 残っていた)。 枠から出るかが問題になるのは最終行。
    const applied = await page.evaluate((s) => {
      const els = document.querySelectorAll(s);
      const el = els[els.length - 1];
      if (!el) return false;
      // U+0353 COMBINING X BELOW。 Inter / JetBrains Mono のどちらでも下方向に積み上がる
      // (実測 = 30 個で 9.4 - 10.9 em、 通常の文字は 0.28 em 以下)。 font によって積む記号が
      // 違うため、 両方で効く記号を選んでいる (U+0329 は JetBrains Mono でしか積まない)。
      el.textContent = "y" + "\u0353".repeat(60);
      return true;
    }, sel);
    expect(applied, "差し替える対象の行がある").toBe(true);

    const after = await verifyAllDiagramsDom(page, [target.diagram], {
      skipBbox: true, skipParticle: true, skipPhase: true,
    });
    const overflow = after.discrepancies.filter((d: Discrepancy) => d.kind === "node-row-overflow");
    expect(overflow.length, "字形が枠を越えたことを検知する").toBeGreaterThan(0);
    // **下** に出ていることを見る。 横は文字数でも動くので、 縦の判定が効いている証明にならない。
    expect(
      overflow.some((d) => /下 [\d.]+px/.test(d.detail)),
      `下方向の超過が報告される: ${overflow.map((d) => d.detail).join(" | ")}`,
    ).toBe(true);
  });

  test("上に伸びる字形も実ブラウザで検知する", async ({ page }) => {
    // 下と対で押さえる。 下だけだと `ascent` を 0 にする変異や、 上の判定を消す変異が
    // 通ってしまう。
    const target = TARGETS[0];
    // 一覧が空だと以下の検査は何も見ずに通る。 引けない形はここで落とす
    expect(target, "対象の見本が 1 件も無い (検査が空振りしている)").toBeDefined();
    if (target === undefined) return;
    await openDiagram(page, target.slug, target.diagram.id);
    const sel = `[data-cdl-diagram="${target.diagram.id}"] [data-cdl-node] [data-cdl-role="node-row"]`;

    // **先頭行** を選ぶ。 上方向に出るかが問題になるのは枠の上端に近い行。
    //
    // 上向きに積む記号は font で違う (実測 = Inter は `U+0304` で 11.9 em 積むが `U+033D` は
    // 0.78 em、 JetBrains Mono は逆に `U+033D` で 21.9 em 積むが `U+0304` は 0.74 em)。
    // 混ぜると積まなくなる (実測で ascent 0.78 em に落ちた) ので、 1 つずつ試して
    // **どれか 1 つで検知できれば良い** とする。
    const MARKS = ["\u0304", "\u033D", "\u030A", "\u0302"];
    const details: string[] = [];
    let detected = false;
    for (const mark of MARKS) {
      const applied = await page.evaluate(([s, m]) => {
        const el = document.querySelectorAll(s)[0];
        if (!el) return false;
        el.textContent = "y" + m.repeat(60);
        return true;
      }, [sel, mark] as const);
      expect(applied, "差し替える対象の行がある").toBe(true);

      const after = await verifyAllDiagramsDom(page, [target.diagram], {
        skipBbox: true, skipParticle: true, skipPhase: true,
      });
      const overflow = after.discrepancies.filter((d: Discrepancy) => d.kind === "node-row-overflow");
      details.push(...overflow.map((d) => d.detail));
      if (overflow.some((d) => /上 [\d.]+px/.test(d.detail))) { detected = true; break; }
    }
    expect(detected, `上方向の超過が報告される: ${details.join(" | ") || "(報告なし)"}`).toBe(true);
  });

  test("宣言した行の数だけ DOM に出ている", async ({ page }) => {
    // 行の一部だけが描かれていても、 描かれた分が枠に収まっていれば上の test は通る。
    // 宣言と描画の数を突き合わせて、 検査の網羅を数で押さえる。
    //
    // 1 行が左右 2 つの `<text>` に分かれるので、 DOM 上の数は宣言の 2 倍になる。
    for (const { slug, diagram } of TARGETS) {
      await openDiagram(page, slug, diagram.id);
      const measured = await page
        .locator(`[data-cdl-diagram="${diagram.id}"] [data-cdl-node] [data-cdl-role="node-row"]`)
        .count();
      expect(measured, `${diagram.id} の行数`).toBe(rowCount(diagram) * 2);
    }
  });
});
