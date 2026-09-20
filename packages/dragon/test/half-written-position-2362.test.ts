/*
 * 箱の座標を片方だけ書いた時に、黙って落ちないことを見る (#2362)。
 *
 * 座標は横と縦を両方書いて初めて効く。 実測 = 片方だけ書くと図は 1 bit も変わらず
 * 知らせも出なかった (`c4` / `class` / `er` / `state` / `swimlane` の 5 図種)。
 *
 * 大きさ (`posW` / `posH`) は片方だけでも効くので対象外 = 同じ「片方だけ」 でも
 * 落ちるのは座標だけ。
 */
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

/** 箱を持ち、座標が効く図種 (実測) */
const 図種一覧 = ["c4", "class", "er", "state", "swimlane"] as const;

function 本文(図種: string, 書く: string): string {
  return `title: "座標の図"
type: ${図種}

actors:
  - 受付
  - 審査${書く === "" ? "" : `: { ${書く} }`}
  - 完了

flow:
  - 受付 -> 審査: "出す"
  - 審査 -> 完了: "通す"
`;
}

type 結果 = { 図: unknown; 知: { kind: string; message: string }[] };

function 組む(src: string): 結果 {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知: { kind: string; message: string }[] = [];
  const d = compileToCdl(p.doc, { onNotice: (n) => 知.push({ kind: n.kind, message: n.message }) });
  return { 図: d, 知 };
}

/** 片方だけの座標を伝える知らせの件数 */
function 知らせの数(図種: string, 書く: string): number {
  return 組む(本文(図種, 書く)).知.filter((n) => n.kind === "position-axis-missing").length;
}

describe("箱の座標を片方だけ書くと、知らせが出る (#2362)", () => {
  it("座標が効く図種を走査できている (空振り防止)", () => {
    expect(図種一覧.length, "図種を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("横だけ書いた箱に知らせが出る", () => {
    const 出ない = 図種一覧.filter((t) => 知らせの数(t, "posX: 100") !== 1);
    expect(出ない, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("縦だけ書いた箱に知らせが出る", () => {
    const 出ない = 図種一覧.filter((t) => 知らせの数(t, "posY: 100") !== 1);
    expect(出ない, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("両方書いた箱には知らせが出ない", () => {
    // 片方の検査だけだと、どの箱にも知らせを出す形で通ってしまう
    const 出た = 図種一覧.filter((t) => 知らせの数(t, "posX: 100, posY: 100") !== 0);
    expect(出た, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("どちらも書かない箱には知らせが出ない", () => {
    const 出た = 図種一覧.filter((t) => 知らせの数(t, "") !== 0);
    expect(出た, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("両方書いた座標は、いまも図に効く (植え込み対照)", () => {
    // 知らせを足したついでに座標そのものを止めていないことを見る
    const 効かない = 図種一覧.filter((t) =>
      isDeepStrictEqual(組む(本文(t, "")).図, 組む(本文(t, "posX: 100, posY: 100")).図),
    );
    expect(効かない, `図種 ${図種一覧.length} 件`).toEqual([]);
  });

  it("大きさは片方だけでも知らせが出ない", () => {
    // 同じ「片方だけ」 でも、大きさは片方だけで効く (実測)。 巻き込んでいないことを見る
    const 出た = 図種一覧.flatMap((t) =>
      ["posW: 900", "posH: 400"]
        .filter((書く) => 知らせの数(t, 書く) !== 0)
        .map((書く) => `${t}: ${書く}`),
    );
    expect(出た, `図種 ${図種一覧.length} 件 × 2 通り`).toEqual([]);
  });

  it("知らせの文が、書いた方と足りない方の両方を指す", () => {
    const 文 = 組む(本文("class", "posX: 100")).知.find((n) => n.kind === "position-axis-missing");
    expect(文, "知らせが 1 件も出ていない").toBeDefined();
    expect(文!.message).toContain("posX");
    expect(文!.message).toContain("posY");
  });
});
