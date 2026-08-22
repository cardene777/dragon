import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";

import { CATALOG_ITEMS, loadPartsItems } from "./catalog-items";
import { EDITOR_SAMPLES } from "@/data/editor-samples";

/**
 * 見本の文字が図の上で切り詰められていないことの検査 (#1334)。
 *
 * 記法に長い名前を書いても組み立ては通り、描画側が箱に収める時に末尾を `…` で切る。
 * 誰も見ていない図なら気付かないため、`#1332` では `新プロジェクト` が `新プロジェ…` の
 * まま 8 週間残った。
 *
 * ## 何を見るか
 *
 * 全ての見本を描いて、`…` を含む文字を集める。 その集合が **描画側が自分で書く literal
 * だけ** であることを見る。 切り詰めが起きると集合に新しい文字が増えるので落ちる。
 *
 * ## 描画側の値を書き写さない
 *
 * 箱幅 / 字の大きさ / 余白を持たない。 木の箱幅は `Math.min(140, slotW * 0.85)` で図ごとに
 * 変わり、縮める下限も描画側の版で動く。 書き写すと版を上げた時に片方だけ古くなる。
 *
 * ## 記法との突き合わせは採らなかった
 *
 * 「描かれた文字が記法の宣言から切られたものか」 を前半の一致で判定する形を先に試したが、
 * **値を埋める経路を捕まえられない**。 補足に `{total} ms 短縮` と書いた図は、描かれる時に
 * `300 ms 短縮` になる。 切られて `300 ms 短…` になっても、宣言 (`{total} ms 短縮`) とは
 * 前半を 1 文字も共有しないため当たらない (実測で確認)。
 *
 * 集合で見る形なら、値を埋めた後の切り詰めも新しい文字として現れる。
 */

/** 描画側が入りきらない文字を切る時に付ける字 */
const 省略 = "…";

/**
 * 図の上に出てよい、描画側が自分で書く省略。
 *
 * `0x…` は blockchain の宛先として `shape-blockchain` が書く literal で、記法に由来しない
 * (実測 = `shapeBlockchain` / `sceneTokenBridge` / `sceneSatelliteChain` / `sceneConsensus`
 * の 4 図)。 記法を直しても消えないため、切り詰めと数えると直しようのない指摘が毎回出る。
 *
 * **ここに足すのは人が判断する**。 新しい `…` が出たら検査が落ち、それが切り詰めなのか
 * 描画側の literal なのかを読んで決める。 その判断を機械に任せる形は採らない = 機械が
 * 判断できるなら最初から切り詰めを見分けられる。
 *
 * **裏を返すと、切り詰めをここに足せば検査は通る**。 それを止める仕組みは持たない
 * (`rules/dev-flow.md § marker の真正性` と同じ性質で、承認の実体は人の判断にある)。
 * 足す時は、その `…` が記法を直しても消えないことを確かめる。
 */
const 描画側の省略 = ["0x…"];

/** 検査する図 1 件 */
type 図の組 = { 出所: string; 名: string; 図: CdlDiagram };

/** 描いた結果から `<text>` の中身を取る */
function 描かれた文字ら(図: CdlDiagram): string[] {
  const html = renderToStaticMarkup(<CdlDiagramView diagram={図} />);
  return [...html.matchAll(/<text[^>]*>([^<]*)<\/text>/gu)]
    .map((m) => (m[1] ?? "").trim())
    .filter((s) => s !== "");
}

/** 見本を全部集める。 見本帳と記法の見本の両方を見る */
async function 見本を集める(): Promise<図の組[]> {
  const 全部: 図の組[] = [];
  for (const [分類, items] of Object.entries(CATALOG_ITEMS)) {
    for (const it of items) 全部.push({ 出所: 分類, 名: it.title, 図: it.diagram });
  }
  // `parts` は後から読む形なので `CATALOG_ITEMS` に載らない。 別経路で読む
  for (const it of await loadPartsItems()) 全部.push({ 出所: "parts", 名: it.title, 図: it.diagram });
  // 記法の見本。 `#1332` で実際に切られていたのはこちらで、見本帳だけ見ると同じ見落としが再発する
  for (const sm of EDITOR_SAMPLES) {
    全部.push({ 出所: "editor", 名: sm.slug, 図: textDslToDiagram(sm.code) });
  }
  return 全部;
}

/** 記法から放射図を 1 つ組む (対照に使う) */
function 放射(名前: string): CdlDiagram {
  return textDslToDiagram(`title: "t"
type: mind

actors:
  - ${名前}
  - 枝

animation:
  - step: "s" 1.2s
    draw: mind
`);
}

describe("見本の文字が切り詰められていない (#1334)", () => {
  it("見本を集められている", async () => {
    // 集められていなければ、以下の検査は通って当然になる
    const 見本 = await 見本を集める();
    expect(見本.length, "見本が少なすぎる (集め方が壊れている)").toBeGreaterThanOrEqual(400);
    const 出所 = new Set(見本.map((x) => x.出所));
    // 後から読む分類と記法の見本が抜けると、`#1332` と同じ見落としが再発する
    expect([...出所], "parts が集まっていない").toContain("parts");
    expect([...出所], "記法の見本が集まっていない").toContain("editor");
  });

  it("図の上に出る省略は描画側の literal だけ", async () => {
    const 見本 = await 見本を集める();
    const 出た = new Map<string, string[]>();
    for (const x of 見本) {
      for (const t of 描かれた文字ら(x.図)) {
        if (!t.includes(省略)) continue;
        出た.set(t, [...(出た.get(t) ?? []), `${x.出所}/${x.名}`]);
      }
    }
    // 1 件も無いと、切り詰めを見つける力があるのかどうか分からない
    expect(出た.size, "省略を含む文字が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    const 想定外 = [...出た.entries()]
      .filter(([t]) => !描画側の省略.includes(t))
      .map(([t, 図ら]) => `"${t}" (${図ら.slice(0, 3).join(", ")})`);
    expect(想定外, "記法に書いた文字が切り詰められている").toEqual([]);
  });

  it("入りきらない名前を書くと新しい省略が出る (陽性対照)", () => {
    // 通る検査だけを置くと、判定が恒真でも気付けない
    const 出た = 描かれた文字ら(放射("新プロジェクト構想案の全体")).filter((t) => t.includes(省略));
    expect(出た.length, "入りきらない名前が切られていない").toBeGreaterThan(0);
    expect(
      出た.filter((t) => !描画側の省略.includes(t)).length,
      "切られた文字を描画側の literal と取り違えている",
    ).toBeGreaterThan(0);
  });

  it("収まる名前だけなら省略が出ない (陰性対照)", () => {
    // 常に省略ありと判定する実装でも陽性対照は通る
    expect(
      描かれた文字ら(放射("速い")).filter((t) => t.includes(省略)),
      "収まる名前で省略が出ている",
    ).toEqual([]);
  });

  it("描画側の literal は実物に存在する", async () => {
    // 一覧が古くなって実物と食い違うと、素通しの範囲だけが残る
    const 見本 = await 見本を集める();
    const 実際 = new Set(見本.flatMap((x) => 描かれた文字ら(x.図)).filter((t) => t.includes(省略)));
    for (const s of 描画側の省略) {
      expect([...実際], `一覧の "${s}" が実物に無い (消えた literal が残っている)`).toContain(s);
    }
  });
});
