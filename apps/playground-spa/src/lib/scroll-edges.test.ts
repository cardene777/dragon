/**
 * 続きが隠れている端の判定 (#2427)。
 *
 * 実測の値を土台にする。 見本の頁の「フロー」 は #2424 で横に並ぶようになり、
 * 器 1150px に対し 1492px 描かれる = 右に 342px 隠れている。
 *
 * **境界を両方向で見る**。 送り切った時に消えることと、送り切る 1px 手前で残ることを
 * どちらも見ないと、「常に出す」 実装でも「常に消す」 実装でも片方は通る。
 */
import { describe, it, expect } from "vitest";
import { 隠れている端 } from "./scroll-edges";

/** 見本の頁の「フロー」 の実測 (#2424 で測った値) */
const フロー = { scrollWidth: 1492, clientWidth: 1150 };
/** 送り切った位置 */
const 右端 = フロー.scrollWidth - フロー.clientWidth;

describe("続きが隠れている端 (#2427)", () => {
  it("左端に居る時は右に続く", () => {
    expect(隠れている端({ ...フロー, scrollLeft: 0 })).toBe("右");
  });

  it("送り切ると端が無くなる", () => {
    expect(隠れている端({ ...フロー, scrollLeft: 右端 })).toBe("左");
  });

  it("途中では両側に続く", () => {
    expect(隠れている端({ ...フロー, scrollLeft: 右端 / 2 })).toBe("両方");
  });

  it("溢れていなければ端は無い", () => {
    expect(隠れている端({ scrollLeft: 0, scrollWidth: 1150, clientWidth: 1150 })).toBe("無し");
  });

  it("1px 以下の余りは溢れていない扱い", () => {
    // 手がかりが指す先が 1px なら、送っても見えるものが無い
    expect(隠れている端({ scrollLeft: 0, scrollWidth: 1151, clientWidth: 1150 })).toBe("無し");
  });

  it("小数の残りは送り切った扱い", () => {
    // 倍率を指定した図は `scrollLeft` が 0.5px ほど届かない。
    // ここを見ないと、送り切っても右の手がかりが残る
    expect(隠れている端({ ...フロー, scrollLeft: 右端 - 0.5 })).toBe("左");
  });

  it("送り切る手前では右に続いたまま", () => {
    // 上の 1 つ前と対で見る。 誤差を広げすぎると、まだ見えていない続きを無いことにする
    expect(隠れている端({ ...フロー, scrollLeft: 右端 - 2 })).toBe("両方");
  });

  it("読めない値は端が無い側に倒す", () => {
    // 読めないことを「続きがある」 と読むと、溢れていない図にも手がかりが出る
    expect(隠れている端({ scrollLeft: Number.NaN, scrollWidth: 1492, clientWidth: 1150 })).toBe(
      "無し",
    );
    expect(
      隠れている端({ scrollLeft: 0, scrollWidth: Number.POSITIVE_INFINITY, clientWidth: 1150 }),
    ).toBe("無し");
  });
});
