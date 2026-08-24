/**
 * 記法が受けるつまみの表が、描画側の型定義とずれていないことの検査 (#1389)。
 *
 * ## なぜ生成なのか
 *
 * 描画側は 14 種のつまみを持ち、欄は種類ごとに違う。 手で写すと写し間違いと、描画側が
 * 種類を足した時の drift が残る (`rules/quality.md § 導出可能記述は人手で書かない`)。
 *
 * ## この検査が見るもの
 *
 * 生成し直した中身が、repo に置いてある file と 1 文字も違わないこと。
 * 描画側を上げて種類が増えれば落ちるので、作り直す作業が抜けない。
 *
 * 公開している形 (`diagram.json`) と記法の表が同じ種類を持つことも併せて見る。
 * 片方だけ増えると、記法で書けるのに JSON で拒まれる (逆もある) 状態が生まれる。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

import { つまみの表 } from "../src/v05/parser";
import { diagramJsonSchema } from "../src/schema";
import { textDslToDiagram, validateDragonJson, jsonToDiagram } from "../src";

const ここ = dirname(fileURLToPath(import.meta.url));
const 生成の段 = join(ここ, "../scripts/gen-input-table.mjs");

describe("つまみの表は描画側の型定義から生成する (#1389)", () => {
  it("生成し直しても実物と一致する", () => {
    /*
     * `--check` は生成し直した中身と実物を比べ、違えば非 0 で終わる。
     * 落ちた時は `node packages/dragon/scripts/gen-input-table.mjs` で作り直す。
     */
    const 結果 = execFileSync("node", [生成の段, "--check"], { encoding: "utf8" });
    expect(結果, "生成の段が何も言わずに終わっている").toContain("一致しています");
  });

  it("種類を 14 持つ", () => {
    // 生成が空振りした時 (型定義を読めない / 切り出しに失敗する) を落とす。
    // 描画側の `CdlInput` は 14 種で、増えたら生成し直して本行も直す
    expect(Object.keys(つまみの表).sort()).toEqual([
      "color",
      "datetime",
      "dropdown",
      "multi-select",
      "number",
      "radio",
      "range",
      "slider",
      "stepper",
      "tabs",
      "text",
      "timeline",
      "toggle",
      "xypad",
    ]);
  });

  it("全ての種類が欄を 1 つ以上持つ", () => {
    const 空 = Object.entries(つまみの表)
      .filter(([, 定義]) => Object.keys(定義.欄).length === 0)
      .map(([k]) => k);
    expect(空, "欄を 1 つも持たない種類がある (切り出しに失敗している)").toEqual([]);
  });

  it("必須の欄は全て欄の一覧にある", () => {
    const 食い違い = Object.entries(つまみの表).flatMap(([k, 定義]) =>
      定義.必須.filter((n) => !(n in 定義.欄)).map((n) => `${k}.${n}`),
    );
    expect(食い違い, "必須なのに欄の一覧に無い項目がある").toEqual([]);
  });

  it("数の並びを取る欄が実在する (数の並びを足した理由が残っている)", () => {
    // この形が 1 つも無ければ `数の並び` は要らない。 消えたら形ごと外せる合図
    const 持つ = Object.entries(つまみの表)
      .filter(([, 定義]) => Object.values(定義.欄).includes("数の並び"))
      .map(([k]) => k);
    expect(持つ, "数の並びを取る欄が 1 つも無い").toContain("timeline");
  });

  it("生成した file を手で編集しないよう書いてある", () => {
    const 中身 = readFileSync(join(ここ, "../src/v05/input-table.generated.ts"), "utf8");
    expect(中身, "自動生成であることが書かれていない").toContain("自動生成");
    expect(中身, "作り直し方が書かれていない").toContain("gen-input-table.mjs");
  });
});

describe("公開している形と記法の表が同じ種類を持つ (#1389)", () => {
  type 公開欄 = {
    type?: string | string[];
    items?: { type?: string };
  };
  type 分岐 = {
    properties: { kind: { enum: string[] } } & Record<string, 公開欄>;
    required?: string[];
  };
  const schema = diagramJsonSchema as unknown as {
    properties: {
      inputs: {
        items: {
          properties: { kind: { enum: string[] } } & Record<string, 公開欄>;
          oneOf: 分岐[];
        };
      };
    };
  };
  const 公開のつまみ = schema.properties.inputs.items;
  const 公開の種類 = 公開のつまみ.properties.kind.enum;

  const 分岐を引く = (kind: string): 分岐 | undefined =>
    公開のつまみ.oneOf.find((x) => x.properties.kind.enum.includes(kind));

  /**
   * 種類ごとの欄の形を読む。
   *
   * **分岐を先に見る**。 `defaultValue` は種類によって数 / 文字列 / 真偽と割れるため、
   * 外側では 3 型を許して分岐が絞る形にしてある。 外側だけを見ると全種類で
   * 「3 型のどれか」 になり、種類ごとの食い違いを 1 件も捕まえられない。
   */
  const 公開の欄の形 = (kind: string, 欄: string): string | undefined => {
    const 定義 = 分岐を引く(kind)?.properties[欄] ?? 公開のつまみ.properties[欄];
    if (定義?.type === "number") return "数";
    if (定義?.type === "string") return "文字列";
    if (定義?.type === "boolean") return "真偽";
    if (定義?.type === "array" && 定義.items?.type === "string") return "文字列の並び";
    if (定義?.type === "array" && 定義.items?.type === "number") return "数の並び";
    return undefined;
  };

  it("公開している種類を読めている", () => {
    expect(公開の種類.length, "公開している種類を 1 つも読めていない").toBeGreaterThan(0);
  });

  it("記法の表にあって公開している形に無い種類が 0 件", () => {
    const 無い = Object.keys(つまみの表).filter((k) => !公開の種類.includes(k));
    expect(無い, "記法で書けるのに公開している形が拒む種類がある").toEqual([]);
  });

  it("公開している形にあって記法の表に無い種類が 0 件", () => {
    const 無い = 公開の種類.filter((k) => !(k in つまみの表));
    expect(無い, "公開している形にあるのに記法で書けない種類がある").toEqual([]);
  });

  it("記法の表の全ての欄が、公開している形にもある", () => {
    const 公開の欄 = new Set(Object.keys(公開のつまみ.properties as Record<string, unknown>));
    const 無い = [
      ...new Set(Object.values(つまみの表).flatMap((定義) => Object.keys(定義.欄))),
    ].filter((n) => !公開の欄.has(n));
    expect(無い, "記法で書けるのに公開している形が持たない項目がある").toEqual([]);
  });

  it("全種類の欄の型が公開している形と一致する", () => {
    const 測れた: string[] = [];
    const 食い違い = Object.entries(つまみの表).flatMap(([kind, 定義]) =>
      Object.entries(定義.欄)
        .map(([欄, 形]) => {
          測れた.push(`${kind}.${欄}`);
          return [欄, 形, 公開の欄の形(kind, 欄)] as const;
        })
        .filter(([, 形, 公開]) => 公開 !== 形)
        .map(([欄, 形, 公開]) => `${kind}.${欄}: 記法=${形} / 公開=${公開 ?? "無し"}`),
    );
    expect(測れた.length, "欄を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(食い違い, "記法と公開 schema で欄の型が違う").toEqual([]);
  });

  it("全種類の必須欄が公開している形と一致する", () => {
    /*
     * kind の enum だけ合っていても oneOf に分岐が無い種類は JSON Schema が全て拒む。
     * 同じ必須欄を持つ種類は 1 分岐に束ねてよい。ここで各 kind に展開して生成表と比べる。
     */
    const 公開の必須 = new Map<string, string[]>();
    const 重複: string[] = [];
    for (const branch of 公開のつまみ.oneOf) {
      for (const kind of branch.properties.kind.enum) {
        if (公開の必須.has(kind)) 重複.push(kind);
        公開の必須.set(kind, branch.required ?? []);
      }
    }
    expect(重複, "oneOf の複数分岐に同じ種類がある").toEqual([]);
    expect(Object.fromEntries([...公開の必須].sort(([a], [b]) => a.localeCompare(b)))).toEqual(
      Object.fromEntries(
        Object.entries(つまみの表)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([kind, 定義]) => [kind, [...定義.必須]]),
      ),
    );
  });
});

/**
 * 表があるだけでは足りない。 書いたつまみが図まで届くところを見る。
 *
 * 生成した表を読み取り側に配線し忘れると、表の検査は全て通ったまま
 * 「書いたのに図に載らない」 状態になる。
 */
describe("記法に書いたつまみが図に載る (#1389)", () => {
  const 記法 = (行: string) =>
    textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  v: 10

inputs:
${行}

actors:
  - A: { kind: card, lane: l, stack: 0 }

animation:
  - step: "p" 1s
`);

  const つまみ = (d: ReturnType<typeof 記法>) =>
    (d as unknown as { inputs?: Record<string, unknown>[] }).inputs ?? [];

  it("書かなければ欄ごと付かない", () => {
    const d = textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

actors:
  - A: { kind: card, lane: l, stack: 0 }

animation:
  - step: "p" 1s
`);
    expect((d as unknown as { inputs?: unknown }).inputs).toBeUndefined();
  });

  it("すべりの欄がそのまま届く", () => {
    const d = 記法(
      '  v: { kind: slider, min: 0, max: 100, step: 5, defaultValue: 50, label: "V" }',
    );
    expect(つまみ(d)).toEqual([
      { id: "v", kind: "slider", min: 0, max: 100, step: 5, defaultValue: 50, label: "V" },
    ]);
  });

  it("選び (`options`) が文字列の並びとして届く", () => {
    const d = 記法("  m: { kind: dropdown, options: [日, 週, 月], defaultValue: 日 }");
    expect(つまみ(d)[0]).toEqual({
      id: "m",
      kind: "dropdown",
      options: ["日", "週", "月"],
      defaultValue: "日",
    });
  });

  it("入り切り (`toggle`) は真偽そのものが届く", () => {
    const d = 記法("  on: { kind: toggle, defaultValue: false }");
    expect(つまみ(d)[0]).toEqual({ id: "on", kind: "toggle", defaultValue: false });
  });

  it("再生速度の候補が数の並びとして届く", () => {
    // 文字列の並びとして読むと `"0.5"` が図に載り、描画側が数として扱えない
    const d = 記法("  c: { kind: timeline, duration: 3000, speeds: [0.5, 1, 2, 4] }");
    expect(つまみ(d)[0]).toEqual({
      id: "c",
      kind: "timeline",
      duration: 3000,
      speeds: [0.5, 1, 2, 4],
    });
  });

  it("書いた順のまま図に載る", () => {
    // 並び順は `defaultSpeedIdx` のように番号で指す欄の意味を決める
    const d = 記法(
      '  a: { kind: toggle, defaultValue: true }\n  b: { kind: color, defaultValue: "#ff0000" }',
    );
    expect(つまみ(d).map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("知らない種類は行番号付きで知らせる", () => {
    expect(() => 記法("  x: { kind: knob, defaultValue: 1 }")).toThrow(/つまみの種類が読めません/);
  });

  it("知らない欄は行番号付きで知らせる", () => {
    expect(() =>
      記法("  v: { kind: slider, min: 0, max: 100, defaultValue: 1, unit: px }"),
    ).toThrow(/unit/);
  });

  it("足りない必須欄を知らせる", () => {
    expect(() => 記法("  v: { kind: slider, min: 0, defaultValue: 1 }")).toThrow(/max/);
  });

  it("数の並びに数でない値が混じると知らせる", () => {
    // 読めた分だけ渡すと並びの長さが変わり、番号で指す欄が別の要素を指す
    expect(() => 記法("  c: { kind: timeline, duration: 3000, speeds: [0.5, おそい] }")).toThrow(
      /speeds/,
    );
  });

  it("1 行にまとめた形は受けない", () => {
    expect(() =>
      textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

inputs: { v: { kind: slider } }

actors:
  - A: { kind: card, lane: l, stack: 0 }

animation:
  - step: "p" 1s
`),
    ).toThrow(/1 行にまとめて書けない/);
  });
});

describe("JSON でもつまみを書ける (#1389)", () => {
  const 基本 = {
    title: "t",
    type: "flow",
    lanes: { l: { x: 0, width: 400 } },
    flow: [],
    states: { v: 10 },
    actors: [{ name: "A", kind: "card", lane: "l", stack: 0 }],
    animation: [{ step: "p", duration: 1 }],
  };

  it("正しい形は通り、図まで届く", () => {
    const json = {
      ...基本,
      inputs: [{ id: "v", kind: "slider", min: 0, max: 100, defaultValue: 50 }],
    };
    const v = validateDragonJson(json);
    expect(v.ok, v.ok ? "" : v.errors.map((e) => e.path).join(" ")).toBe(true);
    const d = jsonToDiagram(json) as unknown as { inputs?: unknown[] };
    expect(d.inputs).toEqual([{ id: "v", kind: "slider", min: 0, max: 100, defaultValue: 50 }]);
  });

  it("並びでない形を拒む", () => {
    const r = validateDragonJson({ ...基本, inputs: 1 });
    expect(r.ok, "並びでない `inputs` が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain("$.inputs");
  });

  it("id の無いつまみを拒む", () => {
    const r = validateDragonJson({
      ...基本,
      inputs: [{ kind: "slider", min: 0, max: 100, defaultValue: 1 }],
    });
    expect(r.ok, "id の無いつまみが通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain("$.inputs[0].id");
  });

  it("知らない欄を拒む", () => {
    const r = validateDragonJson({
      ...基本,
      inputs: [{ id: "v", kind: "slider", min: 0, max: 100, defaultValue: 1, unit: "px" }],
    });
    expect(r.ok, "知らない欄が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain("$.inputs[0].unit");
  });

  it("足りない必須欄を拒む", () => {
    const r = validateDragonJson({
      ...基本,
      inputs: [{ id: "v", kind: "slider", min: 0, defaultValue: 1 }],
    });
    expect(r.ok, "必須欄の欠落が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain("$.inputs[0].max");
  });

  it("数の並びに文字列が混じる形を拒む", () => {
    const r = validateDragonJson({
      ...基本,
      inputs: [{ id: "c", kind: "timeline", duration: 3000, speeds: [0.5, "1"] }],
    });
    expect(r.ok, "文字列の混じった数の並びが通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain("$.inputs[0].speeds");
  });
});
