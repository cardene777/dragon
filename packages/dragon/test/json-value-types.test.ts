/**
 * JSON 入口が欄ごとの値の型と列挙を検査することの検証 (#1304)。
 *
 * 項目名の側は #1295 で閉じたが、**値の側が残っていた**。 実測すると 20 欄が型違いの値を
 * そのまま通し、`type: sequence` では 17 欄の値が図まで届いていた。
 *
 * ```json
 * { "from": "A", "to": "B", "label": "x", "labelOffsetX": "q" }
 * ```
 * ```json
 * {"id":"e0-a-b","from":"s0-a","to":"s0-b","label":"x","labelOffsetX":"q"}
 * ```
 *
 * ## 何を測るか
 *
 * 個別の欄を列挙して並べると、欄が増えた時に検査だけが古くなる。 実装の表
 * (`ACCEPTED_KEYS` と `欄の型表`) を出どころにして、**全欄** に対して 2 方向を見る。
 *
 * | 向き | 見ること |
 * |---|---|
 * | 型違いの値 | その欄を指す誤りが返る |
 * | 正しい型の値 | 誤りが返らない (厳しくしすぎていない) |
 *
 * 正しい型の側は、値が型だけから決まる欄 (文字列 / 数 / 色 等) を見る。 中身の形が欄ごとに
 * 違う欄 (`viewport` / `states` / `pos` 等) は `json-unknown-keys.test.ts` の
 * 「受ける項目は 1 つずつ通る」 が欄ごとの実値で既に見ている。
 */
import { describe, it, expect } from "vitest";
import { TONES } from "@cardenelabs/cdl";
import { diagramJsonSchema } from "@cardenelabs/dragon";
import {
  ACCEPTED_KEYS,
  欄の型表,
  validateDragonJson,
  jsonToDiagram,
  type 欄の型,
} from "../src/json-parser";
import { EDGE_SIDE_VALUES, EDGE_HEAD_VALUES, STYLE_VALID, 書ける色名 } from "../src/v05/parser";
import { RELATIVE_DIRECTIONS } from "../src/relative-pos";
import { 図, 欄に値を置く, 欄のpath } from "./support/json-field-input";

type 階層 = keyof typeof ACCEPTED_KEYS;

const 全階層 = Object.keys(ACCEPTED_KEYS) as 階層[];

/**
 * 型ごとの、誤りになるべき値と通るべき値。
 *
 * `他の誤り` は、型の名前が縛っている 2 つ目の条件 (空でないこと) を測る。 型違いだけを
 * 測ると「空文字を弾く」 側の判定を外しても検査が通ってしまう (変異試験で実測)。
 * 通る側が無い型は中身の形が欄ごとに違うため、専用の検査が見る。
 */
const 型ごとの値: Record<string, { 誤り: unknown; 他の誤り?: unknown[]; 正しい?: unknown }> = {
  必須の非空文字列: { 誤り: 1, 他の誤り: [""], 正しい: "a" },
  必須の文字列: { 誤り: 1, 正しい: "a" },
  非空の文字列: { 誤り: 1, 他の誤り: [""], 正しい: "storage" },
  文字列: { 誤り: 1, 正しい: "a" },
  文字列の並び: { 誤り: "a", 正しい: ["a"] },
  数: { 誤り: "q", 正しい: 1 },
  必須の数: { 誤り: "q", 正しい: 1 },
  // 数と文字列の両方を受ける (#1392)。 誤りになるのは真偽と空文字で、
  // 空文字を弾く側を外すと `他の誤り` が落ちる
  数か文字列: { 誤り: true, 他の誤り: [""], 正しい: 1 },
  真偽: { 誤り: "yes", 正しい: true },
  色: { 誤り: "bogus", 正しい: "success" },
  線種: { 誤り: "bogus", 正しい: "solid" },
  辺: { 誤り: "diagonal", 正しい: EDGE_SIDE_VALUES[0] },
  端の形: { 誤り: "nope", 正しい: EDGE_HEAD_VALUES[0] },
  // 相対で置く時の向き (#2039)。 書けば必ず要るので、書かない形も誤りになる
  必須の向き: { 誤り: "diagonal", 他の誤り: [undefined, 1], 正しい: RELATIVE_DIRECTIONS[0] },
  描くもの: { 誤り: "bogus", 他の誤り: ["", "LINE", " line"], 正しい: "line" },
  色か色番号: { 誤り: "bogus", 正しい: "#f59e0b" },
  必須の図種: { 誤り: "bogus", 正しい: "flow" },
  // 中身の形は欄ごとに違うため、専用の検査が見る。 ここでは外側の形だけを測る
  object: { 誤り: 1 },
  並び: { 誤り: 1 },
  必須の並び: { 誤り: 1 },
  必須の非空の並び: { 誤り: 1 },
};

/** 全欄を `(階層, 欄, 型)` の組で列挙する */
function 全欄(): Array<{ 層: 階層; 欄: string; 型: 欄の型 }> {
  const out: Array<{ 層: 階層; 欄: string; 型: 欄の型 }> = [];
  for (const 層 of 全階層) {
    const 表 = 欄の型表[層] as Record<string, 欄の型>;
    for (const 欄 of ACCEPTED_KEYS[層] as readonly string[]) out.push({ 層, 欄, 型: 表[欄]! });
  }
  return out;
}

describe("型の表が受ける項目を覆っている (#1304)", () => {
  it("階層を 1 つ以上持っている", () => {
    // 持っていなければ、以下の走査は 1 件も回らずに通る
    expect(全階層.length, "階層が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("`ACCEPTED_KEYS` の全欄に型がある", () => {
    const 抜け: string[] = [];
    for (const 層 of 全階層) {
      const 表 = 欄の型表[層] as Record<string, unknown>;
      for (const 欄 of ACCEPTED_KEYS[層] as readonly string[]) {
        if (!(欄 in 表)) 抜け.push(`${層}.${欄}`);
      }
    }
    expect(抜け, "受ける項目に型を書いていない").toEqual([]);
  });

  it("型の表に、受けない欄が混ざっていない", () => {
    const 余り: string[] = [];
    for (const 層 of 全階層) {
      const 受ける = ACCEPTED_KEYS[層] as readonly string[];
      for (const 欄 of Object.keys(欄の型表[層])) {
        if (!受ける.includes(欄)) 余り.push(`${層}.${欄}`);
      }
    }
    expect(余り, "受けない項目に型を書いている").toEqual([]);
  });

  it("表に出てくる型は全て、測る値を用意してある", () => {
    const 未定義 = [...new Set(全欄().map((f) => f.型))].filter((t) => !(t in 型ごとの値));
    expect(未定義, "型を足したのに測る値が無い (その型の欄は 1 度も測られない)").toEqual([]);
  });
});

describe("型違いの値は誤りになる (#1304)", () => {
  const 欄一覧 = 全欄();

  it("欄を 1 つ以上列挙できている", () => {
    expect(欄一覧.length, "欄を 1 つも列挙できていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("全欄で、型違いの値がその欄を指す誤りになる", () => {
    let 測れた = 0;
    const 素通り: string[] = [];
    for (const { 層, 欄, 型 } of 欄一覧) {
      const 値 = 型ごとの値[型]!;
      for (const 悪い値 of [値.誤り, ...(値.他の誤り ?? [])]) {
        測れた += 1;
        const r = validateDragonJson(欄に値を置く(層, 欄, 悪い値));
        if (r.ok) {
          素通り.push(`${層}.${欄} (${型}) が ${JSON.stringify(悪い値)} を通してしまう`);
          continue;
        }
        const path = 欄のpath(層, 欄);
        // 並びの要素まで指す型があるため、欄そのものか その配下を指していれば通す
        if (!r.errors.some((e) => e.path === path || e.path.startsWith(`${path}[`))) {
          素通り.push(`${層}.${欄} (${型}) の誤りが ${path} を指さない`);
        }
      }
    }
    expect(測れた, "欄を 1 つも測れていない (検査が空振りしている)").toBeGreaterThanOrEqual(
      欄一覧.length,
    );
    expect(素通り, "型違いの値が素通りする欄がある").toEqual([]);
  });

  it("正しい型の値は通る (厳しくしすぎていない)", () => {
    let 測れた = 0;
    const 落ちた: string[] = [];
    for (const { 層, 欄, 型 } of 欄一覧) {
      const 正しい = 型ごとの値[型]!.正しい;
      if (正しい === undefined) continue;
      測れた += 1;
      const r = validateDragonJson(欄に値を置く(層, 欄, 正しい));
      if (!r.ok)
        落ちた.push(`${層}.${欄}: ${r.errors.map((e) => `${e.path} ${e.message}`).join(" / ")}`);
    }
    expect(測れた, "正しい値を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(落ちた, "受けるはずの値が誤りになる").toEqual([]);
  });
});

describe("不正な値が図に届かない (#1304)", () => {
  // preset が色と線種を上書きする図種 (`flow`) では、素通りしても図に出ない。
  // 書いた値がそのまま届く図種で測る
  const 矢印 = (extra: Record<string, unknown>) => ({
    title: "t",
    // 順序図は #1466 で板になり矢印を作らない。 書いた値がそのまま届く図種で測る
    type: "topology",
    actors: [{ name: "Alpha" }, { name: "Beta" }],
    flow: [{ from: "Alpha", to: "Beta", label: "x", ...extra }],
  });

  for (const [名, extra] of [
    ["ずらし幅に文字列", { labelOffsetX: "q" }],
    ["重ねるかに文字列", { overlay: "yes" }],
    ["色に無い名前", { tone: "bogus" }],
    ["線種に無い名前", { style: "bogus" }],
  ] as Array<[string, Record<string, unknown>]>) {
    it(`${名} は組み立てで止まる`, () => {
      expect(() => jsonToDiagram(矢印(extra)), "図まで届いてしまう").toThrow(
        /Dragon JSON DSL validation error/,
      );
    });
  }

  it("段の focus に文字列を書くと誤りになる", () => {
    // 並びでない値は 1 文字ずつ名前として読まれ、どれにも当たらず段が空になっていた
    const r = validateDragonJson(図({ animation: [{ step: "s1", focus: "A" }] }));
    expect(r.ok, "文字列が通ってしまう").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.animation[0].focus");
  });

  it("色番号の形が違うと誤りになる", () => {
    // `#` で始まる値は色番号として絵の色に入る。 形が違う値をそのまま入れると、描画側が
    // 読めない色のまま図に届く (色名として読めないので既定色にも落ちない)
    for (const 悪い色番号 of ["#zzz", "#12345", "#", "#1234567"]) {
      const r = validateDragonJson(
        図({ actors: [{ name: "A", color: 悪い色番号 }, { name: "B" }] }),
      );
      expect(r.ok, `${悪い色番号} が通ってしまう`).toBe(false);
      if (r.ok) continue;
      expect(
        r.errors.map((e) => e.path),
        悪い色番号,
      ).toContain("$.actors[0].color");
    }
  });

  it("色番号として正しい形は通る (3 / 4 / 6 / 8 桁)", () => {
    for (const 色番号 of ["#fff", "#ffff", "#f59e0b", "#f59e0bcc", "#F59E0B"]) {
      const r = validateDragonJson(図({ actors: [{ name: "A", color: 色番号 }, { name: "B" }] }));
      expect(r.ok, `${色番号} が誤りになる`).toBe(true);
    }
  });

  it("箱の行に数が混ざると、その要素を指す誤りになる", () => {
    const r = validateDragonJson(図({ actors: [{ name: "A", rows: ["ア", 1] }, { name: "B" }] }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.actors[0].rows[1]");
  });

  it("正しい値の矢印は組み立てまで通り、書いた色が図に載る", () => {
    const d = jsonToDiagram(矢印({ tone: "success", style: "dotted-flow" })) as {
      edges: Array<{ tone?: string; style?: string }>;
    };
    expect([d.edges[0]?.tone, d.edges[0]?.style]).toEqual(["success", "dotted-flow"]);
  });

  it("矢印の色も箱と同じ別名を受け、正規の色名に直って図に載る", () => {
    // 直さずに載せると `tone: "成功"` が色名でないまま図に届く (箱は元から直していた)
    const d = jsonToDiagram(矢印({ tone: "成功" })) as { edges: Array<{ tone?: string }> };
    expect(d.edges[0]?.tone).toBe("success");
  });
});

describe("縦列と群は形が違えば誤りになる (#1304)", () => {
  it("縦列が object でない", () => {
    const r = validateDragonJson(図({ lanes: 5 }));
    expect(r.ok, "形が違う値が通ってしまう").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.lanes");
  });

  it("縦列の中身が object でない", () => {
    const r = validateDragonJson(図({ lanes: { L1: 5 } }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.lanes.L1");
  });

  it("群が object でない", () => {
    const r = validateDragonJson(図({ groups: 5 }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.groups");
  });

  it("群の縦列の並びに数が混ざる", () => {
    const r = validateDragonJson(図({ lanes: { L1: {} }, groups: { G1: { lanes: ["L1", 2] } } }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.path)).toContain("$.groups.G1.lanes[1]");
  });
});

describe("列挙の一覧は engine から取る (#1304)", () => {
  const s = diagramJsonSchema as unknown as Record<string, any>;
  const actor = (s.properties.actors.items.oneOf as any[]).find(
    (o) => o.properties !== undefined,
  ).properties;
  const step = s.properties.flow.items.properties;

  it("矢印の線種の一覧が実装と一致する", () => {
    // schema は `dashed` / `dotted` を宣言していたが、実装は受けない = 書いても黙って捨てていた
    expect([...(step.style.enum as string[])].sort()).toEqual([...STYLE_VALID].sort());
  });

  it("色名の一覧が実装と一致する (箱と矢印の両方)", () => {
    const 実装 = [...書ける色名()].sort();
    expect([...(actor.tone.enum as string[])].sort(), "箱").toEqual(実装);
    expect([...(step.tone.enum as string[])].sort(), "矢印").toEqual(実装);
  });

  it("色を受ける 3 欄で、schema が受ける値と parser が受ける値が一致する", () => {
    // parser は受ける色の値を書ける色名だけに絞っている。 schema を `type: string` のままに
    // すると、schema が許した値を parser が後から拒む = schema を入口にする意味が消える
    // (review Round 1 の指摘)。
    //
    // 逆向きのずれも見る。 記法の `resolveTone` は前後の空白と引用符を落として小文字に寄せる
    // ため、それを JSON でも通すと schema の `enum` が拒む値を parser が受ける
    // (review Round 2 の指摘)。 JSON 側は完全一致に揃えてある。
    const 欄 = [
      {
        名: "箱の tone",
        schema: actor.tone,
        置く: (v: string) => ({ actors: [{ name: "A", tone: v }, { name: "B" }] }),
      },
      {
        名: "矢印の tone",
        schema: step.tone,
        置く: (v: string) => ({ flow: [{ from: "A", to: "B", label: "x", tone: v }] }),
      },
      {
        名: "箱の color",
        schema: actor.color,
        置く: (v: string) => ({ actors: [{ name: "A", color: v }, { name: "B" }] }),
      },
    ];

    const schemaが受ける = (
      定義: { enum?: string[]; anyOf?: Array<{ enum?: string[]; pattern?: string }> },
      v: string,
    ): boolean => {
      const 選択肢: Array<{ enum?: string[]; pattern?: string }> = 定義.anyOf ?? [定義];
      return 選択肢.some(
        (o) =>
          o.enum?.includes(v) === true ||
          (o.pattern !== undefined && new RegExp(o.pattern).test(v)),
      );
    };

    // 値は型から導く = 手で並べると色が増えた時に取り残される。 崩し方 (大文字 / 前後の空白 /
    // 引用符) は記法の `resolveTone` が落とす 3 種で、JSON では受けないことを見る
    const 色名 = 書ける色名();
    const 値 = [
      ...色名,
      ...色名.flatMap((v) => [v.toUpperCase(), ` ${v} `, `"${v}"`, `'${v}'`]),
      "#fff",
      "#ffff",
      "#f59e0b",
      "#f59e0bcc",
      "#F59E0B",
      " #fff ",
      "bogus",
      "#zzz",
      "#12345",
      "#",
      "#1234567",
      "x#fff",
      "#fffz",
      "",
    ];

    let 測れた = 0;
    const 食い違い: string[] = [];
    for (const { 名, schema: 定義, 置く } of 欄) {
      for (const v of 値) {
        測れた += 1;
        const parserが受ける = validateDragonJson(図(置く(v))).ok;
        if (schemaが受ける(定義, v) !== parserが受ける) {
          食い違い.push(
            `${名}: ${JSON.stringify(v)} (schema=${!parserが受ける} parser=${parserが受ける})`,
          );
        }
      }
    }
    expect(測れた, "1 件も測れていない (検査が空振りしている)").toBe(欄.length * 値.length);
    expect(食い違い, "schema と parser が別の値を受ける").toEqual([]);
  });

  it("色番号の形は 3 / 4 / 6 / 8 桁だけを受ける", () => {
    // 一致だけを見ると、両方が同時に緩い形も通る。 受ける値そのものを固定する
    const 色番号 = (actor.color.anyOf as Array<{ pattern?: string }>).find(
      (o) => o.pattern !== undefined,
    );
    const pattern = new RegExp(色番号?.pattern ?? "(?!)");
    for (const v of ["#fff", "#ffff", "#f59e0b", "#f59e0bcc", "#F59E0B"]) {
      expect(pattern.test(v), v).toBe(true);
    }
    for (const v of ["bogus", "#zzz", "#12345", "#", "#1234567", " #fff "]) {
      expect(pattern.test(v), v).toBe(false);
    }
  });

  it("正規の色名が一覧に全て入っている", () => {
    // 別名だけを並べて正規名が抜ける形を防ぐ
    expect(TONES.length, "正規の色名を 1 つも読めていない").toBeGreaterThan(0);
    for (const t of TONES) expect(書ける色名(), t).toContain(t);
  });
});
