/**
 * 測るためだけの配置が、描かれない図についての知らせを出さないことを見る (#2312)。
 *
 * カタログの群を **読み込むだけ** で、記法の engine の知らせが 481 行流れていた。
 * 開発サーバーを立てるたび、検査一式を回すたび、頁を書き出すたびに出る。
 *
 * 出どころは `src/compile/parts.ts` の 4 箇所で、どれも **測るためだけに配置** していた。
 * 縦列の位置や部品の図枠を知るために配置し、読んだら捨てる。 部品はこの後に動かすので、
 * 測った時の並びは画面にも書き出しにも出ない。
 *
 * ## 描かれない図の知らせだと分かる根拠
 *
 * 箱どうしの重なり 48 件を、出来上がった図の座標で測り直した。
 *
 * ```
 * 箱どうしの知らせ 48 件
 *   出来上がりでも重なる     0 件
 *   出来上がりでは重ならない 48 件
 * ```
 *
 * 最大 `136800px²` と知らされていたが、出来上がった図では 1 件も重ならない。
 * #2300 と同じ形で、場所が違い、規模が 481 行になっていた。
 *
 * ## 0 行を「測っていない」 と区別する
 *
 * 0 行を期待する検査なので、2 つの母数を併せて見る。
 *
 * | 母数 | 何を保証するか |
 * |---|---|
 * | 測るために受け取った知らせの数 | 測る経路を実際に通った (0 件なら通っていない) |
 * | 直に配置すると 1 行以上捕まる | 集める仕掛けが働いている (文面が変わると落ちる) |
 *
 * ## 出来上がった図の知らせは止めていない
 *
 * 画面を描く側の配置は別の経路で、そちらの知らせは `layout-warn-ledger.test.ts` が
 * 宣言と突き合わせている (#2308)。 この検査が見るのは読み込みのたびに流れる分だけ。
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { 測るために受け取った知らせの数 } from "@cardenelabs/dragon";

const ここ = dirname(fileURLToPath(import.meta.url));
const カタログの置き場 = join(
  ここ,
  "..",
  "..",
  "..",
  "apps",
  "playground-spa",
  "src",
  "topics",
  "catalog",
);

/**
 * 走査するカタログの群を **実ファイルから導く**。
 *
 * 手で並べると群を足した時に追記を忘れ、その群の知らせが永久に測られない。
 * 同じ間違いを #1405 と #2310 で踏んでいる。
 */
const 群の名 = (): string[] =>
  readdirSync(カタログの置き場)
    .filter((f) => f.endsWith(".cdl.ts"))
    .map((f) => f.slice(0, -".cdl.ts".length))
    .sort();

const is図 = (v: unknown): v is CdlDiagram => {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    Array.isArray(o.nodes) &&
    Array.isArray(o.edges) &&
    Array.isArray(o.lanes) &&
    Array.isArray(o.phases)
  );
};

interface 読み込みの結果 {
  readonly 知らせ: string[];
  readonly 図: CdlDiagram[];
  readonly 読み込んだ群: number;
  readonly 測って受け取った数: number;
}

/**
 * カタログの群を読み込み、その間に流れた engine の知らせを集める。
 *
 * 読み込みは 1 度しか起きない (module は覚えられる) ので、この検査 file の中で 1 回だけ行う。
 * `console.warn` を差し替えている間に読み込みが終わるよう、`await` の外で戻す。
 */
async function 読み込んで集める(): Promise<読み込みの結果> {
  const 知らせ: string[] = [];
  const 元 = console.warn;
  const 前の数 = 測るために受け取った知らせの数();
  console.warn = (...a: unknown[]) => {
    const s = a.map(String).join(" ");
    if (s.includes("[cdl layout]")) 知らせ.push(s);
    else 元(...(a as []));
  };
  const mods: Array<Record<string, unknown>> = [];
  try {
    for (const 名 of 群の名()) {
      mods.push((await import(`${カタログの置き場}/${名}.cdl.ts`)) as Record<string, unknown>);
    }
  } finally {
    console.warn = 元;
  }
  return {
    知らせ,
    図: mods.flatMap((m) => Object.values(m).filter(is図)),
    読み込んだ群: mods.length,
    測って受け取った数: 測るために受け取った知らせの数() - 前の数,
  };
}

describe("測るためだけの配置が、描かれない図の知らせを出さない (#2312)", () => {
  let 結果: 読み込みの結果;

  beforeAll(async () => {
    結果 = await 読み込んで集める();
  }, 120_000);

  it("カタログの群を読み込めている (空振り防止)", () => {
    expect(結果.読み込んだ群, "カタログの群を 1 つも読み込めていない").toBeGreaterThan(0);
    expect(結果.図.length, "図を 1 件も読み込めていない").toBeGreaterThan(0);
  });

  it("走査した群が実ファイルと 1 件も違わない", () => {
    /*
     * 読み込んだ数と実ファイルの数を比べる。 群を足した時にこの検査が黙って素通りしない。
     */
    expect(結果.読み込んだ群).toBe(群の名().length);
  });

  it("測るための配置を実際に通っている (母数)", () => {
    /*
     * 0 件は「知らせが無い」 ではなく「測る経路を 1 度も通っていない」。
     * 通っていなければ、下の 0 行は何も保証しない。
     */
    expect(
      結果.測って受け取った数,
      "測るための配置が 1 度も知らせを受け取っていない (この検査は空振りしている)",
    ).toBeGreaterThan(0);
  });

  it("読み込みのたびに流れる知らせが 1 行も無い", () => {
    expect(
      結果.知らせ,
      `カタログの群 ${結果.読み込んだ群} 件 / 図 ${結果.図.length} 件を読み込んだ間に集めた`,
    ).toEqual([]);
  });

  it("集める仕掛けが働いている (植え込み対照)", () => {
    /*
     * 上の 0 行は、文面が変わって読めなくなった時にも 0 行になる。
     * 同じ集め方で図を **直に** 配置し、1 行以上捕まることを見る。
     * 直の配置は出来上がった図についての知らせで、#2308 の台帳が別に宣言している。
     */
    const 捕まえた: string[] = [];
    const 元 = console.warn;
    console.warn = (...a: unknown[]) => {
      const s = a.map(String).join(" ");
      if (s.includes("[cdl layout]")) 捕まえた.push(s);
    };
    try {
      for (const d of 結果.図) {
        try {
          layout(d);
        } catch {
          // 配置できない図は別の検査が見る
        }
      }
    } finally {
      console.warn = 元;
    }
    expect(
      捕まえた.length,
      "図を直に配置しても知らせを 1 行も集められない (文面が変わって読めなくなった)",
    ).toBeGreaterThan(0);
  });
});
