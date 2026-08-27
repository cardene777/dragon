/**
 * 描く速さを段の長さと別に書ける (#1441)。
 *
 * 伸び具合は段の進みそのものなので、これが無いと「線はゆっくり引きたいが値の移りは短くしたい」
 * が書けない。 描く速さのために段の長さを動かすと、同じ段の `tween` まで遅くなる。
 *
 * 記法は `draw: line 0.4` の形で、**語と同じ行に書かせる**。 別の項目にすると
 * 「割合だけ書いて `draw` が無い段」 が書けてしまい、何も起きない指定になる。
 *
 * ## 何を見るか
 *
 * 1. 記法と JSON の両方から書けること
 * 2. **書かない段が従来と同じ形のままであること** = 陰性対照
 * 3. 範囲外と書き間違いを黙って捨てないこと
 *
 * 2 が要点。 1 と 3 だけだと「書いた時に正しく渡る」 ことしか見ておらず、
 * 書いていない全図に欄が付いても気付けない。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram, jsonToDiagram } from "../src/index";
import { jsonToDoc } from "../src/json-parser";
import { parseTextDslV05 } from "../src/v05";

/** 折れ線 2 段。 1 段目で描き、2 段目で値が動く */
const 記法 = (draw: string): string =>
  [
    'title: "確認"',
    "type: line",
    "",
    "actors:",
    '  - 1月: "10"',
    '  - 2月: "30"',
    '  - 3月: "20"',
    "",
    "animation:",
    '  - step: "描く" 2.4s',
    `    draw: ${draw}`,
    '  - step: "動く" 0.9s',
    "",
  ].join("\n");

const 一段目 = (draw: string) => textDslToDiagram(記法(draw)).phases[0];

describe("記法から描く速さを書ける (#1441)", () => {
  it("語だけなら割合の欄を持たない (従来と同じ形)", () => {
    // 陰性対照。 これが無いと「常に欄を付ける」 実装でも以下が通る
    const p = 一段目("line");
    expect(p?.draw, "描く相手が決まっていない (検査が空振りしている)").toBeDefined();
    expect(p?.drawRatio).toBeUndefined();
    expect(Object.keys(p ?? {})).not.toContain("drawRatio");
  });

  it("語の後ろに書いた割合が描画側へ渡る", () => {
    expect(一段目("line 0.4")?.drawRatio).toBe(0.4);
  });

  it("1 は書ける (上限の内側)", () => {
    expect(一段目("line 1")?.drawRatio).toBe(1);
  });

  it("描く相手が決まらない段には割合を渡さない", () => {
    // `bar` は `type: line` では効かない。 相手が決まらないまま割合だけ渡すと、
    // 描画側が「draw が空なのに割合がある」 と知らせる
    const p = 一段目("bar 0.4");
    expect(p?.draw).toBeUndefined();
    expect(p?.drawRatio).toBeUndefined();
  });
});

describe("書き間違いを黙って捨てない (#1441)", () => {
  /** 解析の知らせ。 通った時は `errors` を持たないので空として扱う */
  const 誤り = (draw: string): string[] => {
    const r = parseTextDslV05(記法(draw)) as { errors?: Array<{ message: string }> };
    return (r.errors ?? []).map((e) => e.message);
  };

  it("正しい書き方では知らせが出ない", () => {
    expect(誤り("line 0.4")).toEqual([]);
  });

  it("範囲外の割合を知らせる", () => {
    for (const 値 of ["0", "-0.5", "1.5", "abc"]) {
      expect(誤り(`line ${値}`).join(" / "), `割合 ${値} が知らせになっていない`).toContain(
        "draw の割合が範囲外です",
      );
    }
  });

  it("項目が 3 つ以上ある形を知らせる", () => {
    expect(誤り("line 0.4 0.5").join(" / ")).toContain("語と割合の 2 つまで");
  });

  it("読めない語は従来どおり知らせる (割合を足しても変わらない)", () => {
    expect(誤り("nope 0.4").join(" / ")).toContain("draw に書けない語です");
  });
});

describe("JSON からも同じことが書ける (#1441)", () => {
  const JSONの図 = (phase: Record<string, unknown>) =>
    jsonToDiagram({
      title: "確認",
      type: "line",
      actors: [
        { name: "1月", subtitle: "10" },
        { name: "2月", subtitle: "30" },
      ],
      flow: [],
      animation: [
        { step: "描く", duration: 2400, ...phase },
        { step: "動く", duration: 900 },
      ],
    }).phases[0];

  it("語だけなら割合の欄を持たない (従来と同じ形)", () => {
    const p = JSONの図({ draw: "line" });
    expect(p?.draw, "描く相手が決まっていない (検査が空振りしている)").toBeDefined();
    expect(p?.drawRatio).toBeUndefined();
  });

  it("割合を書けば描画側へ渡る", () => {
    expect(JSONの図({ draw: "line", drawRatio: 0.4 })?.drawRatio).toBe(0.4);
  });

  it("`draw` が無い段に割合だけ書いても渡さない", () => {
    // 記法側は同じ行に書かせるのでこの形を作れない。 JSON は作れるので、
    // 写す時に外して記法側と同じ状態に揃える
    expect(JSONの図({ drawRatio: 0.4 })?.drawRatio).toBeUndefined();
  });

  it("`draw` が無い段の割合は、写した時点で既に落ちている", () => {
    // **組み立てまで見ると 2 つの守りが混ざる**。 組み立て側にも「描く相手が決まった段だけ」
    // の判定があるので、写す側を外しても最終の図は同じになる (実測で 0 件 FAIL)。
    //
    // 2 つは別の条件を見ている = 写す側は「`draw` がそもそも無い」、組み立て側は
    // 「`draw` はあるが図種と合わない」。 分けて観測するため、写した直後の形を見る
    const doc = jsonToDoc({
      title: "確認",
      type: "line",
      actors: [{ name: "1月", subtitle: "10" }],
      flow: [],
      animation: [{ step: "描く", duration: 2400, drawRatio: 0.4 }],
    } as never);
    const 段 = doc.animate?.phases[0];
    expect(段, "段を 1 つも写せていない (検査が空振りしている)").toBeDefined();
    expect(段?.drawRatio).toBeUndefined();
  });

  it("`draw` がある段の割合は、写した時点で残っている (陰性対照)", () => {
    // 上が「常に落とす」 実装でも通らないようにする
    const doc = jsonToDoc({
      title: "確認",
      type: "line",
      actors: [{ name: "1月", subtitle: "10" }],
      flow: [],
      animation: [{ step: "描く", duration: 2400, draw: "line", drawRatio: 0.4 }],
    } as never);
    expect(doc.animate?.phases[0]?.drawRatio).toBe(0.4);
  });

  it("記法と JSON が同じ値を出す (書き方で速さが変わらない)", () => {
    expect(JSONの図({ draw: "line", drawRatio: 0.4 })?.drawRatio).toBe(一段目("line 0.4")?.drawRatio);
  });
});
