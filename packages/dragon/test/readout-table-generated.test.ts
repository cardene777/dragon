/**
 * 記法が受ける部品の表が、描画側の型定義とずれていないことの検査 (#1385)。
 *
 * ## なぜ生成なのか
 *
 * 描画側は 107 種の部品を持ち、欄は合わせて 510 個ある。 手で写すと写し間違いと、描画側が
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

import { 部品の表, 部品の組の表 } from "../src/v05/parser";
import { diagramJsonSchema } from "../src/schema";
import { textDslToDiagram, validateDragonJson } from "../src";

const ここ = dirname(fileURLToPath(import.meta.url));
const 生成の段 = join(ここ, "../scripts/gen-readout-table.mjs");

describe("部品の表は描画側の型定義から生成する (#1385)", () => {
  it("生成し直しても実物と一致する", () => {
    /*
     * `--check` は生成し直した中身と実物を比べ、違えば非 0 で終わる。
     * 落ちた時は `node packages/dragon/scripts/gen-readout-table.mjs` で作り直す。
     */
    const 結果 = execFileSync("node", [生成の段, "--check"], { encoding: "utf8" });
    expect(結果, "生成の段が何も言わずに終わっている").toContain("一致しています");
  });

  it("種類を 100 以上持つ", () => {
    // 生成が空振りした時 (型定義を読めない / 切り出しに失敗する) を落とす。
    // 実測で 107 種あり、描画側が減らす向きに動くことは想定していない
    expect(Object.keys(部品の表).length, "部品の種類が少なすぎる").toBeGreaterThanOrEqual(100);
  });

  it("全ての種類が欄を 1 つ以上持つ", () => {
    const 空 = Object.entries(部品の表)
      .filter(([, 定義]) => Object.keys(定義.欄).length === 0)
      .map(([k]) => k);
    expect(空, "欄を 1 つも持たない種類がある (切り出しに失敗している)").toEqual([]);
  });

  it("必須の欄は全て欄の一覧にある", () => {
    const 食い違い = Object.entries(部品の表).flatMap(([k, 定義]) =>
      定義.必須.filter((n) => !(n in 定義.欄)).map((n) => `${k}.${n}`),
    );
    expect(食い違い, "必須なのに欄の一覧に無い項目がある").toEqual([]);
  });

  it("組の並びを取る欄は、組の中身も持つ", () => {
    /*
     * 「object の並び」 までしか持たないと、組の中身を検査できず知らない欄が素通りする。
     * 欄の形が `組の並び` なら、必ず `部品の組の表` に中身がある。
     */
    const 中身なし = Object.entries(部品の表).flatMap(([k, 定義]) =>
      Object.entries(定義.欄)
        .filter(([n, 形]) => 形 === "組の並び" && 部品の組の表[k]?.[n] === undefined)
        .map(([n]) => `${k}.${n}`),
    );
    expect(中身なし, "組の並びなのに中身の欄を持たない項目がある").toEqual([]);

    // 0 件を見る検査なので、組の並びが実際にあることも確かめる
    const 組の欄 = Object.values(部品の表).flatMap((定義) =>
      Object.values(定義.欄).filter((形) => 形 === "組の並び"),
    );
    expect(組の欄.length, "組の並びを取る欄が 1 つも無い (検査が空振りしている)").toBeGreaterThan(
      0,
    );
  });

  it("生成した file を手で編集しないよう書いてある", () => {
    const 中身 = readFileSync(join(ここ, "../src/v05/readout-table.generated.ts"), "utf8");
    expect(中身, "自動生成であることが書かれていない").toContain("自動生成");
    expect(中身, "作り直し方が書かれていない").toContain("gen-readout-table.mjs");
  });
});

describe("公開している形と記法の表が同じ種類を持つ (#1385)", () => {
  type 公開欄 = {
    type?: string;
    items?: {
      type?: string;
      properties?: Record<string, 公開欄>;
      required?: string[];
    };
  };
  const schema = diagramJsonSchema as unknown as {
    properties: {
      readouts: {
        items: {
          properties: { kind: { enum: string[] } } & Record<string, 公開欄>;
          oneOf: {
            properties: { kind: { enum: string[] } } & Record<string, 公開欄>;
            required?: string[];
          }[];
        };
      };
    };
  };
  const 公開の部品 = schema.properties.readouts.items;
  const 公開の種類 = 公開の部品.properties.kind.enum;

  it("公開している種類を読めている", () => {
    expect(公開の種類.length, "公開している種類を 1 つも読めていない").toBeGreaterThan(0);
  });

  it("記法の表にあって公開している形に無い種類が 0 件", () => {
    const 無い = Object.keys(部品の表).filter((k) => !公開の種類.includes(k));
    expect(無い, "記法で書けるのに公開している形が拒む種類がある").toEqual([]);
  });

  it("公開している形にあって記法の表に無い種類が 0 件", () => {
    const 無い = 公開の種類.filter((k) => !(k in 部品の表));
    expect(無い, "公開している形にあるのに記法で書けない種類がある").toEqual([]);
  });

  it("記法の表の全ての欄が、公開している形にもある", () => {
    const 公開の欄 = new Set(
      Object.keys(schema.properties.readouts.items.properties),
    );
    const 無い = [
      ...new Set(Object.values(部品の表).flatMap((定義) => Object.keys(定義.欄))),
    ].filter((n) => !公開の欄.has(n));
    expect(無い, "記法で書けるのに公開している形が持たない項目がある").toEqual([]);
  });

  const 公開の欄の形 = (欄: 公開欄 | undefined): string | undefined => {
    if (欄?.type === "number") return "数";
    if (欄?.type === "string") return "文字列";
    if (欄?.type === "boolean") return "真偽";
    if (欄?.type === "array" && 欄.items?.type === "string") return "文字列の並び";
    if (欄?.type === "array" && 欄.items?.type === "object") return "組の並び";
    return undefined;
  };

  it("全種類の欄の型が公開している形と一致する", () => {
    const 食い違い = Object.entries(部品の表).flatMap(([kind, 定義]) =>
      Object.entries(定義.欄)
        .filter(([欄, 形]) => 公開の欄の形(公開の部品.properties[欄]) !== 形)
        .map(
          ([欄, 形]) =>
            `${kind}.${欄}: 記法=${形} / 公開=${公開の欄の形(公開の部品.properties[欄]) ?? "無し"}`,
        ),
    );
    expect(食い違い, "記法と公開 schema で欄の型が違う").toEqual([]);
  });

  it("全種類の必須欄が公開している形と一致する", () => {
    /*
     * kind の enum だけ合っていても oneOf に分岐が無い種類は JSON Schema が全て拒む。
     * #1385 の初稿では新しい 91 種がまさにその形で、runtime validator だけが通っていた。
     *
     * 同じ必須欄を持つ種類は 1 分岐に束ねてよい。ここで各 kind に展開して生成表と比べる。
     */
    const 公開の必須 = new Map<string, string[]>();
    const 重複: string[] = [];
    for (const branch of 公開の部品.oneOf) {
      for (const kind of branch.properties.kind.enum) {
        if (公開の必須.has(kind)) 重複.push(kind);
        公開の必須.set(kind, branch.required ?? []);
      }
    }
    expect(重複, "oneOf の複数分岐に同じ種類がある").toEqual([]);
    expect(Object.fromEntries([...公開の必須].sort(([a], [b]) => a.localeCompare(b)))).toEqual(
      Object.fromEntries(
        Object.entries(部品の表)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([kind, 定義]) => [kind, [...定義.必須]]),
      ),
    );
  });

  it("組の並びの中身が種類ごとに公開している形と一致する", () => {
    const 食い違い: string[] = [];
    for (const [kind, 欄の表] of Object.entries(部品の組の表)) {
      const branch = 公開の部品.oneOf.find((x) => x.properties.kind.enum.includes(kind));
      for (const [欄, 定義] of Object.entries(欄の表)) {
        const item = (branch?.properties[欄] ?? 公開の部品.properties[欄])?.items;
        const 公開の欄 = item?.properties ?? {};
        if (
          JSON.stringify(Object.keys(公開の欄).sort()) !==
          JSON.stringify(Object.keys(定義.欄).sort())
        ) {
          食い違い.push(`${kind}.${欄}: 組の欄`);
        }
        if (
          JSON.stringify([...(item?.required ?? [])].sort()) !==
          JSON.stringify([...定義.必須].sort())
        ) {
          食い違い.push(`${kind}.${欄}: 組の必須欄`);
        }
        for (const [子欄, 形] of Object.entries(定義.欄)) {
          if (公開の欄の形(公開の欄[子欄]) !== 形) 食い違い.push(`${kind}.${欄}.${子欄}: 型`);
        }
      }
    }
    expect(食い違い, "組の並びの中身が記法と公開 schema で違う").toEqual([]);
  });
});

/**
 * 真偽の欄 (#1385 で足した欄の形)。
 *
 * 描画側で `boolean` を取る欄は 2 つしかないが、その 2 つは **この形が無いと書けない**。
 * 表の生成が形を読み替えられるだけでは足りず、読み取り側が値を渡すところまで見る。
 */
describe("真偽の欄 (#1385)", () => {
  const 記法 = (行: string) =>
    textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  v: 10

readouts:
${行}

actors:
  - A: { kind: card, lane: l, stack: 0 }

animation:
  - step: "p" 1s
`);

  it("真偽の欄を持つ種類が表にある (検査が空振りしていない)", () => {
    const 持つ = Object.entries(部品の表)
      .filter(([, 定義]) => Object.values(定義.欄).includes("真偽"))
      .map(([k]) => k);
    expect(持つ, "真偽の欄を持つ種類が無い").toContain("line-chart");
    expect(持つ, "真偽の欄を持つ種類が無い").toContain("matrix");
  });

  it.each([
    ["true", true],
    ["false", false],
  ])("記法に %s と書くとその値が渡る", (書く, 期待) => {
    const d = 記法(`  lc: { kind: line-chart, source: v, min: 0, max: 100, fill: ${書く} }`);
    expect((d.readouts?.[0] as { fill?: unknown }).fill).toBe(期待);
  });

  it("書かなければ欄が付かない", () => {
    const d = 記法("  lc: { kind: line-chart, source: v, min: 0, max: 100 }");
    expect((d.readouts?.[0] as { fill?: unknown }).fill).toBeUndefined();
  });

  it.each(["1", "yes", "TRUE", "はい"])("真偽として読めない値 (%s) は誤りになる", (書く) => {
    // 黙って真に倒すと、書いた人には「書いたのに効かない」 としか見えない
    expect(() =>
      記法(`  lc: { kind: line-chart, source: v, min: 0, max: 100, fill: ${書く} }`),
    ).toThrow(/fill/);
  });

  it("JSON では真偽そのものを受け、文字列は拒む", () => {
    const 基本 = {
      title: "t",
      type: "flow",
      lanes: { l: { x: 0, width: 400 } },
      flow: [],
      states: { v: 10 },
      actors: [{ name: "A", kind: "card", lane: "l", stack: 0 }],
      animation: [{ step: "p", duration: 1 }],
    };
    const 通る = validateDragonJson({
      ...基本,
      readouts: [{ id: "lc", kind: "line-chart", source: "v", min: 0, max: 100, fill: true }],
    });
    expect(通る.ok, 通る.ok ? "" : 通る.errors.map((e) => e.path).join(" ")).toBe(true);

    const 落ちる = validateDragonJson({
      ...基本,
      readouts: [{ id: "lc", kind: "line-chart", source: "v", min: 0, max: 100, fill: "true" }],
    });
    expect(落ちる.ok, "文字列の真偽が通っている").toBe(false);
    if (!落ちる.ok) expect(落ちる.errors.map((e) => e.path).join(" ")).toContain("fill");
  });
});
