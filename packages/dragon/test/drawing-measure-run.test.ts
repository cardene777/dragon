import { describe, expect, it } from "vitest";

// @ts-expect-error -- 検査対象は .mjs で型宣言を持たない
import { 一枚を測る, 一群を測る, 理由の一行 } from "../scripts/drawing-measure-run.mjs";

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
