// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  readableFloorScale,
  applyReadableFloor,
  smallestFontWorld,
  effectiveSmallestFontWorld,
  readableScaleForFrame,
  readableScaleForWidth,
  boxesRightPx,
  READABLE_MIN_PX,
  READABLE_MAX_SCALE,
  READABLE_RELAXED_PX,
} from "./readable-scale";

describe("readableFloorScale", () => {
  it("世界座標の文字が大きいほど下限は低い", () => {
    // 見本「利用者登録」 の実測値 (最小文字 20 世界座標、 図の倍率 1)
    expect(readableFloorScale(20, 1)).toBeCloseTo(0.5, 5);
    // 文字を大きく持つ図はもっと縮めても読める
    expect(readableFloorScale(40, 1)).toBeCloseTo(0.25, 5);
  });

  it("図そのものの倍率を掛けた後の大きさで判定する", () => {
    // 記法で 2 倍にした図は、 表示倍率が半分でも同じ見え方になる
    expect(readableFloorScale(20, 2)).toBeCloseTo(0.25, 5);
  });

  it("下限の px は差し替えられる", () => {
    expect(readableFloorScale(20, 1, 20)).toBeCloseTo(1, 5);
  });

  it("測れない時は下限を課さない", () => {
    for (const v of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(readableFloorScale(v, 1), `minFontWorld=${v}`).toBe(0);
      expect(readableFloorScale(20, v), `diagramK=${v}`).toBe(0);
      expect(readableFloorScale(20, 1, v), `minPx=${v}`).toBe(0);
    }
  });

  it("既定の下限は 10px", () => {
    expect(READABLE_MIN_PX).toBe(10);
    expect(readableFloorScale(20, 1)).toBe(readableFloorScale(20, 1, 10));
  });
});

describe("applyReadableFloor", () => {
  it("収める倍率が下限を下回るなら下限を採る", () => {
    // 見本「利用者登録」 = 収める 0.23 に対し下限 0.5
    expect(applyReadableFloor(0.23, 0.5)).toBeCloseTo(0.5, 5);
  });

  it("収める倍率が下限より大きいならそのまま", () => {
    // 縦長の図はここに落ちる (見本「トリガー」 = 収める 0.6 / 下限 0.45)
    expect(applyReadableFloor(0.6, 0.45)).toBeCloseTo(0.6, 5);
  });

  it("下限は 100% で頭打ちにする", () => {
    // 文字を極端に小さく持つ図で下限が 2.0 になっても、 実寸より膨らませない
    expect(applyReadableFloor(0.3, 2)).toBeCloseTo(1, 5);
    expect(READABLE_MAX_SCALE).toBe(1);
  });

  it("頭打ちは下限にだけ効き、 収める倍率は下げない", () => {
    // 小さい図が 150% で収まる形。 上限で 1 に下げると、 直そうとしていない図が縮む
    expect(applyReadableFloor(1.5, 0.4)).toBeCloseTo(1.5, 5);
  });

  it("下限が無い (測れなかった) 時は収める倍率のまま", () => {
    expect(applyReadableFloor(0.23, 0)).toBeCloseTo(0.23, 5);
  });

  it("収める倍率が壊れている時は触らない", () => {
    expect(applyReadableFloor(Number.NaN, 0.5)).toBeNaN();
    expect(applyReadableFloor(0, 0.5)).toBe(0);
  });

  it("上限は差し替えられる", () => {
    expect(applyReadableFloor(0.3, 2, 1.5)).toBeCloseTo(1.5, 5);
  });
});

describe("readableScaleForFrame", () => {
  // 実測 (窓 1440px、 枠 840px) を土台にする。 最小文字 20 世界座標 / 図の倍率 1 で
  // 好ましい下限 (10px) は 0.5、 譲った下限 (8px) は 0.4 になる。
  // 囲んだ範囲は箱の右端と同じにしておく = 位置決めの効果を見る test だけ個別に上書きする
  const 素 = {
    fitScale: 0.23,
    minFontWorld: 20,
    diagramK: 1,
    frameWidth: 840,
    boundsLeft: 0,
    boundsWidth: 3000,
  };

  it("箱が枠に収まるなら譲らない", () => {
    // 見本「ログインAPI呼び出し」 = 図の外枠は 886px で枠を超えるが、 箱は全部内側。
    // 外枠で判定すると 8px に落ちる (実測でそうなった)
    expect(readableScaleForFrame({ ...素, boxesRight: 1600 })).toBeCloseTo(0.5, 5);
  });

  it("箱が枠から出て、 譲れば収まるなら譲る", () => {
    // 0.5 で 1000 → 枠 840 を超える。 0.4 で 800 → 収まる
    expect(readableScaleForFrame({ ...素, boxesRight: 2000 })).toBeCloseTo(0.4, 5);
  });

  it("譲っても収まらないなら譲らない", () => {
    // 文字が小さくなるだけで見えない箱は見えないまま = 損しかしない。
    // 見本「利用者登録」 を減らす前がここに落ちる
    expect(readableScaleForFrame({ ...素, boxesRight: 3000 })).toBeCloseTo(0.5, 5);
  });

  it("境界ちょうどは譲らない", () => {
    // 0.5 で 840 ぴったり = 枠に収まっている
    expect(readableScaleForFrame({ ...素, boxesRight: 1680 })).toBeCloseTo(0.5, 5);
  });

  // Round 1 review の指摘。 判定が倍率を掛けるだけだと、 中央寄せの分 (`axisOffset`) を
  // 見落として「譲ったのに箱が出たまま」 になる。 実測は 3 段の swimlane で名前を 14 文字に
  // した形 = 譲った倍率でも箱が枠から 10.7px 外に残り、 文字だけ小さくなっていた
  it("譲ると図が枠に収まって中央へ動く時、 その分だけ箱が右へずれるのを数える", () => {
    // 譲った倍率 0.4 で 囲んだ範囲は 800 → 枠 840 に収まるので中央寄せ (右へ 20)。
    // 箱の右端 2050 × 0.4 = 820 に 20 が乗って 840 ちょうど = 収まる
    expect(
      readableScaleForFrame({ ...素, boxesRight: 2050, boundsWidth: 2000 }),
    ).toBeCloseTo(0.4, 5);
    // 1px 右にあるだけで枠を超える = 譲らない
    expect(
      readableScaleForFrame({ ...素, boxesRight: 2053, boundsWidth: 2000 }),
    ).toBeCloseTo(0.5, 5);
  });

  it("図の左にパーツがある時は、 寄せ戻す分を数える", () => {
    // 囲んだ範囲の左端が負 = 左端に寄せると図が右へ動く。 その分を足さないと甘くなる。
    // 0.4 で 囲んだ範囲 1200 は枠 840 を超えるので左端寄せ、 tx = -(-500 × 0.4) = 200。
    // 箱の右端 1550 × 0.4 = 620 に 200 が乗って 820 = 収まる
    expect(
      readableScaleForFrame({ ...素, boxesRight: 1550, boundsLeft: -500, boundsWidth: 3000 }),
    ).toBeCloseTo(0.4, 5);
    // 右へ 100 動かすと 860 で枠を超える = 譲らない
    expect(
      readableScaleForFrame({ ...素, boxesRight: 1800, boundsLeft: -500, boundsWidth: 3000 }),
    ).toBeCloseTo(0.5, 5);
  });

  it("測れない時は譲らない", () => {
    // 判定材料が無いことを理由に文字を小さくしない
    for (const v of [null, Number.NaN]) {
      expect(readableScaleForFrame({ ...素, boxesRight: v }), `boxesRight=${v}`).toBeCloseTo(0.5, 5);
    }
    for (const v of [0, -1, Number.NaN]) {
      expect(
        readableScaleForFrame({ ...素, boxesRight: 2000, frameWidth: v }),
        `frameWidth=${v}`,
      ).toBeCloseTo(0.5, 5);
      expect(
        readableScaleForFrame({ ...素, boxesRight: 2000, boundsWidth: v }),
        `boundsWidth=${v}`,
      ).toBeCloseTo(0.5, 5);
    }
    expect(readableScaleForFrame({ ...素, boxesRight: 2000, boundsLeft: Number.NaN })).toBeCloseTo(
      0.5,
      5,
    );
  });

  it("収める倍率が下限より大きい図では何も起きない", () => {
    // 縦長の図。 下限が効いていないので譲る余地がそもそも無い
    expect(readableScaleForFrame({ ...素, fitScale: 0.8, boxesRight: 2000 })).toBeCloseTo(0.8, 5);
  });

  it("下限の px は差し替えられる", () => {
    // 譲り先を 5px にすると下限 0.25、 箱の右端 3000 でも 750 で収まる
    expect(readableScaleForFrame({ ...素, boxesRight: 3000, relaxedPx: 5 })).toBeCloseTo(0.25, 5);
  });

  it("譲り先の既定は 8px", () => {
    expect(READABLE_RELAXED_PX).toBe(8);
    expect(readableScaleForFrame({ ...素, boxesRight: 2000 })).toBe(
      readableScaleForFrame({ ...素, boxesRight: 2000, relaxedPx: 8 }),
    );
  });
});

describe("readableScaleForWidth (#2269)", () => {
  /** 携帯の幅の台に、横に長い図を収めた形 (`preset/swimlane` の実測) */
  const 素 = { frameWidth: 275, viewBoxWidth: 1916, minFontWorld: 20 };

  it("収めると下限を割る図は、下限を満たす倍率を返す", () => {
    // 収める倍率 = 275/1916 = 0.144 → 文字は 20 × 0.144 = 2.9px
    // 下限 10px に要る倍率 = 10/20 = 0.5
    expect(readableScaleForWidth(素)).toBeCloseTo(0.5, 5);
  });

  it("収めた時点で下限に届く図は undefined (器に合わせたままにする)", () => {
    // 収める倍率 = 600/800 = 0.75 → 文字は 20 × 0.75 = 15px
    expect(
      readableScaleForWidth({ frameWidth: 600, viewBoxWidth: 800, minFontWorld: 20 }),
    ).toBeUndefined();
  });

  it("実寸 (100%) を超えては拡げない", () => {
    // 文字が 7.6 世界単位の図は、100% でも 7.6px にしかならない (`preset/gantt` の実測)
    expect(readableScaleForWidth({ ...素, minFontWorld: 7.6 })).toBeCloseTo(1, 5);
  });

  it("**返した倍率を器の幅として渡し直しても、同じ答えに落ち着く**", () => {
    // 描かれている倍率を土台にすると 2 つの状態を行き来する (実測で 2.9px と 10.0px が交互に出た)。
    // 器の幅は図に幅を与えても変わらないので、何度測っても同じ値を返す
    const 一度目 = readableScaleForWidth(素);
    expect(一度目).toBeCloseTo(0.5, 5);
    expect(readableScaleForWidth(素), "2 度目で答えが変わった (行き来する)").toBe(一度目);
    // 図に与えた幅 (viewBox 幅 × 返した倍率) を器の幅と取り違えた形は、下限を割らないと読む
    expect(
      readableScaleForWidth({ ...素, frameWidth: 素.viewBoxWidth * 一度目! }),
      "描かれた幅を土台にすると『もう届いている』 と読む (この形は渡してはいけない)",
    ).toBeUndefined();
  });

  it("測れていない値は undefined に倒す (図の大きさを動かさない)", () => {
    expect(readableScaleForWidth({ ...素, minFontWorld: undefined })).toBeUndefined();
    expect(readableScaleForWidth({ ...素, viewBoxWidth: undefined })).toBeUndefined();
    for (const v of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(readableScaleForWidth({ ...素, frameWidth: v }), `器の幅=${v}`).toBeUndefined();
      expect(readableScaleForWidth({ ...素, viewBoxWidth: v }), `viewBox=${v}`).toBeUndefined();
      expect(readableScaleForWidth({ ...素, minFontWorld: v }), `文字=${v}`).toBeUndefined();
    }
  });

  it("下限と上限を渡せる", () => {
    expect(readableScaleForWidth({ ...素, minPx: 8 })).toBeCloseTo(0.4, 5);
    expect(readableScaleForWidth({ ...素, minFontWorld: 5, maxScale: 1.5 })).toBeCloseTo(1.5, 5);
  });
});

describe("boxesRightPx", () => {
  /** getBBox を持たない jsdom のために、 節点ごとの矩形を差し込んだ svg を作る */
  const svgWithNodes = (boxes: { x: number; width: number }[]): SVGSVGElement => {
    const host = document.createElement("div");
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${boxes
      .map(() => `<g data-cdl-node="1"></g>`)
      .join("")}</svg>`;
    const svg = host.querySelector("svg")!;
    // 節点は `boxes` から作っているので同じ数だけ在る。 値を持つ側から回して
    // 節点の方を確かめる形にすると、 添字で引くのが 1 つだけになる
    const 節点 = svg.querySelectorAll("[data-cdl-node]");
    boxes.forEach((b, i) => {
      const n = 節点[i];
      if (n === undefined) return;
      (n as unknown as { getBBox: () => DOMRect }).getBBox = () =>
        ({ x: b.x, y: 0, width: b.width, height: 10 }) as DOMRect;
    });
    return svg;
  };

  it("最も右にある箱の右端を返す", () => {
    // 利用者座標 200 の位置を px 換算 2 倍で見る = 400
    const svg = svgWithNodes([
      { x: 0, width: 50 },
      { x: 150, width: 50 },
    ]);
    expect(boxesRightPx(svg, 2, 0)).toBe(400);
  });

  // Round 1 review の指摘。 実データの `sequence` は `viewBox.x = -44` で、 引かないと右端を
  // 44 利用者単位ぶん手前に見積もる = 判定が枠幅の側へ甘くなる
  it("viewBox の原点がずれている時はその分を戻す", () => {
    const svg = svgWithNodes([{ x: 1518, width: 50 }]);
    // 原点 -44 なので図の左端からの距離は 1568 + 44 = 1612
    expect(boxesRightPx(svg, 1, -44)).toBe(1612);
    // 引き忘れると 1568 になる (この差が Round 1 の指摘そのもの)
    expect(boxesRightPx(svg, 1, 0)).toBe(1568);
  });

  it("箱が 1 つも無ければ null", () => {
    expect(boxesRightPx(svgWithNodes([]), 1, 0)).toBeNull();
  });

  it("大きさを持たない箱は数えない", () => {
    const svg = svgWithNodes([
      { x: 0, width: 100 },
      { x: 500, width: 0 },
    ]);
    expect(boxesRightPx(svg, 1, 0)).toBe(100);
  });

  it("getBBox が投げる節点は数えない", () => {
    const svg = svgWithNodes([{ x: 0, width: 100 }]);
    const 壊れた = document.createElementNS("http://www.w3.org/2000/svg", "g");
    壊れた.setAttribute("data-cdl-node", "1");
    (壊れた as unknown as { getBBox: () => DOMRect }).getBBox = () => {
      throw new Error("not rendered");
    };
    svg.append(壊れた);
    expect(boxesRightPx(svg, 1, 0)).toBe(100);
  });

  it("換算が壊れている時は null", () => {
    const svg = svgWithNodes([{ x: 0, width: 100 }]);
    for (const v of [0, -1, Number.NaN]) {
      expect(boxesRightPx(svg, v, 0), `pxPerViewBox=${v}`).toBeNull();
    }
    expect(boxesRightPx(svg, 1, Number.NaN)).toBeNull();
    expect(boxesRightPx(null, 1, 0)).toBeNull();
  });
});

describe("smallestFontWorld", () => {
  const svgWith = (html: string): SVGSVGElement => {
    const host = document.createElement("div");
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`;
    return host.querySelector("svg")!;
  };

  it("最も小さい文字を返す", () => {
    const svg = svgWith(
      `<text font-size="24">大</text><text font-size="11">小</text><text font-size="17">中</text>`,
    );
    expect(smallestFontWorld(svg)).toBe(11);
  });

  it("CSS で決まっている図でも拾う", () => {
    const svg = svgWith(`<text style="font-size: 13px">CSS</text>`);
    expect(smallestFontWorld(svg)).toBe(13);
  });

  it("中身の無い文字は数えない", () => {
    // 位置合わせのための空 text を数えると、 読めない文字が実在しないのに下限が上がる
    const svg = svgWith(`<text font-size="4"></text><text font-size="20">あ</text>`);
    expect(smallestFontWorld(svg)).toBe(20);
  });

  it("大きさが読めない文字は数えない", () => {
    const svg = svgWith(`<text font-size="none">壊</text><text font-size="18">正</text>`);
    expect(smallestFontWorld(svg)).toBe(18);
  });

  it("文字が 1 つも無ければ 0 (下限を課さない)", () => {
    expect(smallestFontWorld(svgWith(`<rect width="10" height="10" />`))).toBe(0);
    expect(smallestFontWorld(null)).toBe(0);
    expect(smallestFontWorld(undefined)).toBe(0);
  });
});

describe("smallestFontWorld — 画面に出ていない文字 (Round 1 review の指摘)", () => {
  const svgWith = (html: string): SVGSVGElement => {
    const host = document.createElement("div");
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`;
    return host.querySelector("svg")!;
  };

  it("display: none の文字は数えない", () => {
    // 実測 = 見本「プロジェクト構想」 に隠れた 20 の文字があり、 見えている最小 (24) ではなく
    // そちらが下限を決めていた (42% で足りるところが 50% になっていた)
    const svg = svgWith(
      `<text font-size="20" style="display: none">隠</text><text font-size="24">見</text>`,
    );
    expect(smallestFontWorld(svg)).toBe(24);
  });

  it("visibility: hidden の文字は数えない", () => {
    const svg = svgWith(
      `<text font-size="11" style="visibility: hidden">隠</text><text font-size="18">見</text>`,
    );
    expect(smallestFontWorld(svg)).toBe(18);
  });

  it("透明度 0 の文字は数えない", () => {
    const svg = svgWith(
      `<text font-size="9" style="opacity: 0">隠</text><text font-size="17">見</text>`,
    );
    expect(smallestFontWorld(svg)).toBe(17);
  });

  it("薄いだけの文字は数える", () => {
    // 透明度 0 は見えないが、 0.3 は読める。 見えるものを落とすと図が要らぬ大きさになる
    const svg = svgWith(
      `<text font-size="12" style="opacity: 0.3">薄</text><text font-size="20">濃</text>`,
    );
    expect(smallestFontWorld(svg)).toBe(12);
  });

  it("見えている文字が 1 つも無ければ 0 (下限を課さない)", () => {
    const svg = svgWith(`<text font-size="20" style="display: none">隠</text>`);
    expect(smallestFontWorld(svg)).toBe(0);
  });
});

describe("smallestFontWorld — 描き出しの動きに引きずられない (#2279)", () => {
  const svgWith = (html: string): SVGSVGElement => {
    const host = document.createElement("div");
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`;
    return host.querySelector("svg")!;
  };

  /** 仮想 DOM は `getScreenCTM` を持たない。 倍率だけを持つ行列を差し込む */
  const 倍率を差し込む = (el: Element, 倍率: number): void => {
    (el as unknown as { getScreenCTM: () => DOMMatrix }).getScreenCTM = () =>
      ({ a: 倍率, b: 0, c: 0, d: 倍率 }) as DOMMatrix;
  };

  it("**入れ子の倍率が掛かっていても返る値は指定のまま**", () => {
    // 描き出しの動きは文字に 0 倍から 1 倍までの拡大率を掛ける (実測 = 工程表の帯の中の名前が
    // 0.19 → 0.46 → 0.74 → 1.0)。 途中を読むと同じ図が測る時刻だけで別の下限を出す
    const svg = svgWith(`<text font-size="11">デザイナー</text><text font-size="20">Q1</text>`);
    const [動いている, 止まっている] = [...svg.querySelectorAll("text")];
    倍率を差し込む(svg, 0.9091);
    倍率を差し込む(動いている!, 0.9091 * 0.19);
    倍率を差し込む(止まっている!, 0.9091);
    expect(smallestFontWorld(svg), "描かれている大きさを読んでいる").toBe(11);
  });

  it("動きの途中でも動き終わりでも同じ値を返す", () => {
    const 作る = (入れ子: number): SVGSVGElement => {
      const svg = svgWith(`<text font-size="11">名</text>`);
      倍率を差し込む(svg, 0.9091);
      倍率を差し込む(svg.querySelector("text")!, 0.9091 * 入れ子);
      return svg;
    };
    expect(smallestFontWorld(作る(0.19))).toBe(smallestFontWorld(作る(1)));
  });
});

describe("effectiveSmallestFontWorld — 入れ子の縮小まで含める (#2287)", () => {
  const svgWith = (html: string): SVGSVGElement => {
    const host = document.createElement("div");
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`;
    return host.querySelector("svg")!;
  };

  /** 仮想 DOM は `getScreenCTM` を持たない。 倍率だけを持つ行列を差し込む */
  const 倍率を差し込む = (el: Element, 倍率: number): void => {
    (el as unknown as { getScreenCTM: () => DOMMatrix }).getScreenCTM = () =>
      ({ a: 倍率, b: 0, c: 0, d: 倍率 }) as DOMMatrix;
  };

  it("指定に入れ子の縮小を掛けた値を返す", () => {
    // カタログの `ethereum` の実測。 指定 10.5 の `ハッシュ` の親に scale(0.719) が掛かり、
    // 図そのものは 0.9524 で描かれている
    const svg = svgWith(`<text font-size="10.5">ハッシュ</text>`);
    倍率を差し込む(svg, 0.9524);
    倍率を差し込む(svg.querySelector("text")!, 0.9524 * 0.719);
    expect(effectiveSmallestFontWorld(svg)).toBeCloseTo(10.5 * 0.719, 5);
  });

  it("**表示倍率を変えても返る値は変わらない**", () => {
    // 根の倍率で割るので、図を何倍で表示していても入れ子の積だけが残る。
    // 割らないと、下限で拡げた次の測りで母数が大きくなり、拡げたぶんだけ下限が緩む
    const 作る = (表示: number): SVGSVGElement => {
      const svg = svgWith(`<text font-size="10.5">ハッシュ</text>`);
      倍率を差し込む(svg, 表示);
      倍率を差し込む(svg.querySelector("text")!, 表示 * 0.719);
      return svg;
    };
    expect(effectiveSmallestFontWorld(作る(0.2))).toBeCloseTo(effectiveSmallestFontWorld(作る(1)), 5);
  });

  it("入れ子が掛かっていない文字では指定と同じになる", () => {
    const svg = svgWith(`<text font-size="11">Q1</text><text font-size="20">名</text>`);
    倍率を差し込む(svg, 0.9091);
    for (const t of svg.querySelectorAll("text")) 倍率を差し込む(t, 0.9091);
    expect(effectiveSmallestFontWorld(svg)).toBeCloseTo(11, 5);
    expect(effectiveSmallestFontWorld(svg)).toBeCloseTo(smallestFontWorld(svg), 5);
  });

  it("指定がいちばん小さい文字と、実効がいちばん小さい文字が違っても実効で選ぶ", () => {
    // 指定 11 は縮んでおらず 11、指定 20 は 0.4 倍で 8。 実効の最小は 8 の側
    const svg = svgWith(`<text font-size="11">Q1</text><text font-size="20">名</text>`);
    const [小さい指定, 大きい指定] = [...svg.querySelectorAll("text")];
    倍率を差し込む(svg, 1);
    倍率を差し込む(小さい指定!, 1);
    倍率を差し込む(大きい指定!, 0.4);
    expect(smallestFontWorld(svg)).toBe(11);
    expect(effectiveSmallestFontWorld(svg)).toBeCloseTo(8, 5);
  });

  it("**測る時刻で変わる** = 動きの途中は小さく返る", () => {
    // これは欠陥ではなく性質。 描き出しの動きも同じ transform を書き換えるので、
    // 静止した姿が要る呼出側が何度か測って最大を採る (`動き終わりの実効`)
    const 作る = (入れ子: number): SVGSVGElement => {
      const svg = svgWith(`<text font-size="11">デザイナー</text>`);
      倍率を差し込む(svg, 0.9091);
      倍率を差し込む(svg.querySelector("text")!, 0.9091 * 入れ子);
      return svg;
    };
    expect(effectiveSmallestFontWorld(作る(0.4651))).toBeLessThan(effectiveSmallestFontWorld(作る(1)));
    expect(effectiveSmallestFontWorld(作る(1))).toBeCloseTo(11, 5);
  });

  it("変換を取れない時は 0 = 測れていない", () => {
    // 0 を「文字が無い」 と同じ値で返すのは `smallestFontWorld` と揃えるため。
    // 呼出側はどちらも「母数に入れない」 として扱う
    const svg = svgWith(`<text font-size="11">名</text>`);
    expect(effectiveSmallestFontWorld(svg)).toBe(0);
    expect(effectiveSmallestFontWorld(null)).toBe(0);
    expect(effectiveSmallestFontWorld(undefined)).toBe(0);
  });

  it("根の変換だけ取れない時も 0", () => {
    const svg = svgWith(`<text font-size="11">名</text>`);
    倍率を差し込む(svg.querySelector("text")!, 0.5);
    expect(effectiveSmallestFontWorld(svg)).toBe(0);
  });

  it("中身の空の文字と画面に出ていない文字は数えない", () => {
    const svg = svgWith(
      `<text font-size="4"></text><text font-size="5" style="display:none">隠</text><text font-size="11">名</text>`,
    );
    倍率を差し込む(svg, 1);
    for (const t of svg.querySelectorAll("text")) 倍率を差し込む(t, 1);
    expect(effectiveSmallestFontWorld(svg)).toBeCloseTo(11, 5);
  });
});
