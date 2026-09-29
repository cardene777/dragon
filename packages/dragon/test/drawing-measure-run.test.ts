import { describe, expect, it } from "vitest";

// @ts-expect-error -- 検査対象は .mjs で型宣言を持たない
import { 一枚を測る, 一群を測る, 落ち着くまで読む, より広い, 理由の一行 } from "../scripts/drawing-measure-run.mjs";

type 結果 = {
  group: string;
  id: string;
  測れた: boolean;
  なぜ?: string;
  広がり?: number;
};

/** 測れた時に道具が返す形。 中身は測り方が持つので、ここでは 1 つだけ持たせる */
const 測れた値 = { 広がり: 0.42, 文字の件数: 3, 切れた名前: 0, 読める字: 12 };

const 投げる = (文: string) => () => {
  throw new Error(文);
};

describe("図 1 枚の失敗で走査を終えない (#2673)", () => {
  it("押せない図は測れなかった側へ入り、理由が残る", async () => {
    const r: 結果 = await 一枚を測る("interactive", "tagcloud", {
      押す: 投げる("locator.click: Timeout 30000ms exceeded.\nCall log:\n  - waiting for"),
      測る: () => Promise.resolve(測れた値),
    });
    expect(r.測れた).toBe(false);
    expect(r.なぜ).toBe("押せない ... locator.click: Timeout 30000ms exceeded.");
  });

  it("読めない図も測れなかった側へ入る", async () => {
    const r: 結果 = await 一枚を測る("charts", "pie", {
      押す: () => Promise.resolve(),
      測る: 投げる("page.evaluate: Execution context was destroyed"),
    });
    expect(r.測れた).toBe(false);
    expect(r.なぜ).toBe("読めない ... page.evaluate: Execution context was destroyed");
  });

  it("枠を持たない図は今までどおりの理由で入る", async () => {
    const r: 結果 = await 一枚を測る("charts", "pie", {
      押す: () => Promise.resolve(),
      測る: () => Promise.resolve(null),
    });
    expect(r.測れた).toBe(false);
    expect(r.なぜ).toBe("枠を持つ SVG が無い");
  });

  it("測れた図は値をそのまま持つ", async () => {
    const r: 結果 = await 一枚を測る("charts", "pie", {
      押す: () => Promise.resolve(),
      測る: () => Promise.resolve(測れた値),
    });
    expect(r).toEqual({ group: "charts", id: "pie", 測れた: true, ...測れた値 });
  });

  it("走った図を 1 枚ずつ報せる", async () => {
    const 行: string[] = [];
    await 一枚を測る("charts", "pie", {
      押す: () => Promise.resolve(),
      測る: () => Promise.resolve(測れた値),
      報せる: (s: string) => 行.push(s),
    });
    expect(行).toEqual(["charts/pie"]);
  });

  it("報せ先を渡さなくても測れる (陰性対照)", async () => {
    // 進捗の出力は任意。 無いと落ちる形にすると、検査から呼べなくなる
    const r: 結果 = await 一枚を測る("charts", "pie", {
      押す: () => Promise.resolve(),
      測る: () => Promise.resolve(測れた値),
    });
    expect(r.測れた).toBe(true);
  });

  it("押せない図があっても、押す前に報せている", async () => {
    // 報せるのを押した後にすると、止まった図の名前が出ない = どこで止まったか読めない
    const 行: string[] = [];
    await 一枚を測る("interactive", "tagcloud", {
      押す: 投げる("Timeout"),
      測る: () => Promise.resolve(測れた値),
      報せる: (s: string) => 行.push(s),
    });
    expect(行).toEqual(["interactive/tagcloud"]);
  });
});

describe("群 1 つの失敗で走査を終えない (#2673)", () => {
  const 一枚 = (g: string, id: string) =>
    Promise.resolve({ group: g, id, 測れた: true, ...測れた値 });

  it("開けない群は 1 行だけ返し、残りの群へ進める形になる", async () => {
    const r: 結果[] = await 一群を測る("charts", {
      開く: 投げる("page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4323"),
      一覧: () => Promise.resolve(["pie"]),
      一枚,
    });
    expect(r).toHaveLength(1);
    expect(r[0]!.測れた).toBe(false);
    expect(r[0]!.id).toBe("(群ごと)");
    expect(r[0]!.なぜ).toBe(
      "開けない ... page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4323",
    );
  });

  it("一覧を読めない群も 1 行だけ返す", async () => {
    const r: 結果[] = await 一群を測る("charts", {
      開く: () => Promise.resolve(),
      一覧: 投げる("locator.evaluateAll: Target closed"),
      一枚,
    });
    expect(r).toHaveLength(1);
    expect(r[0]!.なぜ).toBe("一覧を読めない ... locator.evaluateAll: Target closed");
  });

  it("開けた群は図の数だけ返す", async () => {
    const r: 結果[] = await 一群を測る("charts", {
      開く: () => Promise.resolve(),
      一覧: () => Promise.resolve(["pie", "bar", "line"]),
      一枚,
    });
    expect(r.map((x) => x.id)).toEqual(["pie", "bar", "line"]);
    expect(r.every((x) => x.測れた)).toBe(true);
  });

  it("1 枚が落ちても残りの図は測る", async () => {
    const r: 結果[] = await 一群を測る("charts", {
      開く: () => Promise.resolve(),
      一覧: () => Promise.resolve(["pie", "bar", "line"]),
      一枚: (g: string, id: string) =>
        一枚を測る(g, id, {
          押す: id === "bar" ? 投げる("Timeout 30000ms exceeded.") : () => Promise.resolve(),
          測る: () => Promise.resolve(測れた値),
        }),
    });
    expect(r.map((x) => x.測れた)).toEqual([true, false, true]);
    expect(r[1]!.なぜ).toBe("押せない ... Timeout 30000ms exceeded.");
  });

  it("図が 0 件の群は 0 行を返す (陰性対照)", async () => {
    // 群ごと落ちた形と混ざらない。 落ちた時は 1 行返るので、0 行は「開けたが空」 を表す
    const r: 結果[] = await 一群を測る("charts", {
      開く: () => Promise.resolve(),
      一覧: () => Promise.resolve([]),
      一枚,
    });
    expect(r).toEqual([]);
  });
});

describe("失敗の理由を書き換えない (#2673)", () => {
  it("1 行目だけを採る", () => {
    expect(理由の一行(new Error("Timeout 30000ms exceeded.\nCall log:\n  - waiting"))).toBe(
      "Timeout 30000ms exceeded.",
    );
  });

  it("error でない値も読める", () => {
    expect(理由の一行("落ちた")).toBe("落ちた");
  });

  it("前後の空白を落とす", () => {
    expect(理由の一行(new Error("  Timeout  \n次の行"))).toBe("Timeout");
  });

  it("理由を要約しない (陰性対照)", () => {
    // 言い換えると、次に同じ失敗を見た時に playwright の文言から原因へ辿れない
    const 文 = "locator.click: Timeout 30000ms exceeded.";
    expect(理由の一行(new Error(文))).toBe(文);
  });
});

describe("描き終わるまで読む (#2675)", () => {
  /** 読みを順に返す。 最後の値はそれ以降ずっと返る = 動きが繰り返して落ち着いた状態 */
  const 順に返す = (並び: unknown[]) => {
    let i = 0;
    return () => Promise.resolve(並び[Math.min(i++, 並び.length - 1)]);
  };
  const 読み = (広がり: number, 文字の件数 = 1) => ({
    広がり,
    文字の件数,
    切れた名前: 0,
    読める字: 1,
  });

  it("伸びが止まったら上限を待たずに打ち切る", async () => {
    let 回 = 0;
    const r = await 落ち着くまで読む({
      読む: () => {
        回 += 1;
        return Promise.resolve(読み(回 <= 2 ? 0.1 * 回 : 0.2));
      },
      上限: 30,
      落ち着き: 3,
    });
    // 3 / 4 / 5 回目が据え置き = 5 回で打ち切る
    expect(r.読んだ回数).toBe(5);
    expect(r.読み切れた).toBe(true);
    expect(r.広がり).toBeCloseTo(0.2);
  });

  it("上限まで伸び続けた図は読み切れていないと返る", async () => {
    let 回 = 0;
    const r = await 落ち着くまで読む({
      読む: () => {
        回 += 1;
        return Promise.resolve(読み(0.01 * 回));
      },
      上限: 6,
      落ち着き: 3,
    });
    expect(r.読み切れた).toBe(false);
    expect(r.読んだ回数).toBe(6);
  });

  it("読み切れていない図の値を捨てない", async () => {
    // 捨てると相手選びから消えるが、消えたことが一覧に出ない
    let 回 = 0;
    const r = await 落ち着くまで読む({
      読む: () => {
        回 += 1;
        return Promise.resolve(読み(0.01 * 回));
      },
      上限: 4,
      落ち着き: 3,
    });
    expect(r.広がり).toBeCloseTo(0.04);
  });

  it("広がりが同じまま文字だけ増える途中で止まらない", async () => {
    // 値だけを見ると据え置きに数えてしまい、描き終わる前に打ち切る
    const r = await 落ち着くまで読む({
      読む: 順に返す([読み(0.5, 3), 読み(0.5, 4), 読み(0.5, 5), 読み(0.5, 5)]),
      上限: 30,
      落ち着き: 2,
    });
    expect(r.文字の件数).toBe(5);
    expect(r.読み切れた).toBe(true);
  });

  it("枠を持たない図は今までどおり null を返す", async () => {
    const r = await 落ち着くまで読む({
      読む: () => Promise.resolve(null),
      上限: 4,
      落ち着き: 2,
    });
    expect(r).toBeNull();
  });

  it("待つ側を渡さなくても読める (陰性対照)", async () => {
    // 検査から呼ぶ時に待ち時間を作らせない
    const r = await 落ち着くまで読む({
      読む: () => Promise.resolve(読み(0.3)),
      上限: 5,
      落ち着き: 2,
    });
    expect(r.読み切れた).toBe(true);
  });

  it("落ち着いた図では読む回数が上限より少ない", async () => {
    const r = await 落ち着くまで読む({
      読む: () => Promise.resolve(読み(0.3)),
      上限: 30,
      落ち着き: 5,
    });
    expect(r.読んだ回数).toBeLessThan(30);
  });
});

describe("どの読みを採るか (#2675)", () => {
  const 読み = (広がり: number, 文字の件数: number) => ({ 広がり, 文字の件数 });

  it("広がりが大きいほうを採る", () => {
    expect(より広い(読み(0.5, 1), 読み(0.4, 9))).toBe(true);
  });

  it("広がりが並んだら文字の件数が多いほうを採る", () => {
    expect(より広い(読み(0.5, 4), 読み(0.5, 3))).toBe(true);
  });

  it("並んで件数も同じなら採らない (陰性対照)", () => {
    // ここが true になると据え置きが数えられず、落ち着きの判定が永久に立たない
    expect(より広い(読み(0.5, 3), 読み(0.5, 3))).toBe(false);
  });

  it("最初の読みは必ず採る", () => {
    expect(より広い(読み(0, 0), null)).toBe(true);
  });

  it("読めなかった回は採らない", () => {
    expect(より広い(null, 読み(0.1, 1))).toBe(false);
  });
});
