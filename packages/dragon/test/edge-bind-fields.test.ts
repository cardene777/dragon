/**
 * 矢印を値に追随させる 3 欄の検査 (#1396)。
 *
 * 描画側の矢印は `widthBind` / `strokeBind` / `dashOffsetBind` を持つが、記法にも JSON にも
 * 書く項目が無かった。 見本帳の「動く見本」 1 件がこれだけを理由に記法を持てなかった。
 *
 * ## 中括弧の切り出しも併せて見る
 *
 * これらの欄は値に中括弧を書く (`widthBind: "{flow}"`)。 矢印の中括弧を `{[^}]*}` で
 * 切っていた間、内側の `}` に引っかかって **塊ごと読み落とし、説明文の一部として図に
 * 載っていた**。 箱の側は #1381 で直してあり、矢印だけが古い形で残っていた。
 *
 * そのため「値に中括弧を書いても他の欄が壊れない」 ことを、この 3 欄と既存の欄の両方で見る。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram, validateDragonJson, jsonToDiagram } from "../src";
import { FLOW_INLINE_KEYS } from "../src/v05/parser";
import { diagramJsonSchema } from "../src/schema";

/** 本 Issue で足した 3 欄 */
const 三欄 = ["widthBind", "strokeBind", "dashOffsetBind"] as const;

type 矢印 = Record<string, unknown>;

const 矢印たち = (d: unknown): 矢印[] => (d as { edges: 矢印[] }).edges;

const 記法 = (中身: string) =>
  textDslToDiagram(`title: "t"
type: flow

states:
  flow: 3

actors:
  - A: { kind: card }
  - B: { kind: card }

flow:
  - A -> B: "x"${中身}
`);

const JSONの図 = (extra: Record<string, unknown>) => ({
  title: "t",
  type: "flow",
  actors: [
    { name: "A", kind: "card" },
    { name: "B", kind: "card" },
  ],
  flow: [{ from: "A", to: "B", label: "x", ...extra }],
});

describe("矢印の 3 欄が記法から図に届く (#1396)", () => {
  it("3 欄が中括弧に書ける欄の一覧に載っている", () => {
    // 載せないと「項目名が読めません」 にならず、書いても黙って消える
    const 無い = 三欄.filter((k) => !FLOW_INLINE_KEYS.includes(k));
    expect(無い, "中括弧に書ける欄の一覧に無い").toEqual([]);
  });

  it("3 欄がそのまま届く", () => {
    const e = 矢印たち(
      記法(' { widthBind: "{flow}", strokeBind: "{hue}", dashOffsetBind: "{dash}" }'),
    )[0]!;
    expect({
      widthBind: e.widthBind,
      strokeBind: e.strokeBind,
      dashOffsetBind: e.dashOffsetBind,
    }).toEqual({ widthBind: "{flow}", strokeBind: "{hue}", dashOffsetBind: "{dash}" });
  });

  it("書かなければ欄ごと付かない", () => {
    const e = 矢印たち(記法(""))[0]!;
    for (const 欄 of 三欄) expect(e[欄], `${欄} が書かないのに付いている`).toBeUndefined();
  });

  it.each(三欄)("%s の空は捨てずに知らせる", (欄) => {
    // 描画側は空文字を既定値へ落とさず置換に使うため、書き忘れが「線が消えた」 形で出る
    expect(() => 記法(` { ${欄}: "" }`)).toThrow(new RegExp(`矢印の ${欄} が空です`));
    expect(() => 記法(` {${欄}:}`)).toThrow(new RegExp(`矢印の ${欄} が空です`));
  });
});

describe("値に中括弧を書いても中括弧の塊を読み落とさない (#1396)", () => {
  /*
   * **これが本 Issue で直した本体**。 `{[^}]*}` で切っていた間、値の中括弧で塊ごと
   * 読み落とし、説明文の一部として図に載っていた (実測 = 説明が
   * `x { widthBind: "{flow}" }` のまま出た)。
   */
  it("説明文に中括弧の塊が残らない", () => {
    const e = 矢印たち(記法(' { widthBind: "{flow}" }'))[0]!;
    expect(e.label, "中括弧の塊が説明文に残っている").toBe("x");
  });

  it("値に中括弧を書いても同じ塊の他の欄が届く", () => {
    // 読み落とすと 3 欄だけでなく同居する欄も全て消える
    const e = 矢印たち(記法(' { widthBind: "{flow}", sub: "補足", labelOffsetY: -8 }'))[0]!;
    expect({ sub: e.sub, labelOffsetY: e.labelOffsetY }).toEqual({ sub: "補足", labelOffsetY: -8 });
  });

  it("引用符の中の閉じ括弧で塊が終わらない", () => {
    // 引用符を数えないと `sub: "a } b"` の `}` で閉じたことになる
    const e = 矢印たち(記法(' { sub: "a } b", widthBind: "{flow}" }'))[0]!;
    expect({ sub: e.sub, widthBind: e.widthBind }).toEqual({ sub: "a } b", widthBind: "{flow}" });
  });

  it("中括弧を書かない矢印はこれまでどおり読める", () => {
    // 切り出しを深さで数える形に変えたので、塊を書かない形が壊れていないことも見る。
    // 色は静止した `type: flow` が鎖を作る時に決めるため、ここでは説明文だけを見る
    const e = 矢印たち(記法(""))[0]!;
    expect(e.label).toBe("x");
    for (const 欄 of 三欄) expect(e[欄]).toBeUndefined();
  });

  it("中括弧の形が閉じていない行は本文として扱う", () => {
    // 切り出せない形を塊として読むと、途中で切れた本文が欄として届く
    const e = 矢印たち(記法(' { widthBind: "{flow}"'))[0]!;
    expect(e.widthBind, "閉じていない中括弧を塊として読んでいる").toBeUndefined();
    // 本文として残る (引用符の扱いは説明文の読み取りが決めるので、字そのものは見ない)
    expect(String(e.label)).toContain("widthBind");
  });
});

describe("矢印の 3 欄が JSON から図に届く (#1396)", () => {
  it("正しい形は通り、図まで届く", () => {
    const json = JSONの図({
      widthBind: "{flow}",
      strokeBind: "{hue}",
      dashOffsetBind: "{dash}",
    });
    const v = validateDragonJson(json);
    expect(v.ok, v.ok ? "" : v.errors.map((e) => e.path).join(" ")).toBe(true);
    const e = 矢印たち(jsonToDiagram(json as never))[0]!;
    expect({
      widthBind: e.widthBind,
      strokeBind: e.strokeBind,
      dashOffsetBind: e.dashOffsetBind,
    }).toEqual({ widthBind: "{flow}", strokeBind: "{hue}", dashOffsetBind: "{dash}" });
  });

  it.each(三欄)("%s に数を書くと誤りになる", (欄) => {
    // 描画側は文字列だけを取る
    const r = validateDragonJson(JSONの図({ [欄]: 3 }));
    expect(r.ok, `${欄} に数が通っている`).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain(`$.flow[0].${欄}`);
  });

  it.each(三欄)("%s の空文字は誤りになる", (欄) => {
    const r = validateDragonJson(JSONの図({ [欄]: "" }));
    expect(r.ok, `${欄} の空文字が通っている`).toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain(`$.flow[0].${欄}`);
  });
});

describe("公開している形が 3 欄を持つ (#1396)", () => {
  const 矢印の形 = (
    diagramJsonSchema as unknown as {
      properties: {
        flow: {
          items: {
            properties: Record<string, { type?: string; minLength?: number; pattern?: string }>;
          };
        };
      };
    }
  ).properties.flow.items.properties;

  it("矢印の形を読めている", () => {
    expect(矢印の形, "矢印の形を読めていない (検査が空振りしている)").toBeDefined();
  });

  it("3 欄すべてがあり、空でない文字列を取る", () => {
    // 記法 / JSON validator / 公開している形 の 3 つで受ける形が割れると、
    // 書けるのに拒まれる (逆もある) 状態が生まれる
    for (const 欄 of 三欄) {
      expect(矢印の形[欄]?.type, `${欄} が公開している形に無い`).toBe("string");
      expect(矢印の形[欄]?.minLength, `${欄} が空文字を通す`).toBe(1);
      expect(矢印の形[欄]?.pattern, `${欄} が空白だけを通す`).toBe("\\S");
    }
  });
});
