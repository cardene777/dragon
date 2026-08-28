/**
 * LLM 向け JSON DSL parser の behavior test。
 *
 * AC (Issue #208) 検証:
 * - jsonToDiagram({...}) が有効 CdlDiagram を返す
 * - validation error が具体的な path を返す
 * - YAML と JSON で同じ diagram が生成される
 * - diagramJsonSchema が exported されて内容妥当
 */
import { describe, it, expect } from "vitest";
import {
  jsonToDiagram,
  validateDragonJson,
  diagramJsonSchema,
  textDslToDiagram,
  PRESET_TYPES,
} from "../src/index";

describe("jsonToDiagram (LLM 向け JSON DSL)", () => {
  it("Issue #208 AC 1 = 最小 example が有効 CdlDiagram を返す", () => {
    const diagram = jsonToDiagram({
      title: "test",
      // 順序図は #1466 で 1 枚の板になり矢印を持たない。 本検査は JSON が図を作れることを
      // 見るもので図種に依らないため、矢印が出る図種で測る
      type: "topology",
      actors: ["a", "b"],
      flow: [{ from: "a", to: "b", label: "x" }],
    });
    expect(diagram).toBeDefined();
    expect(diagram.id).toBeTruthy();
    expect(diagram.nodes.length).toBeGreaterThan(0);
    expect(diagram.edges.length).toBeGreaterThan(0);
    const edge = diagram.edges[0]!;
    expect(edge.label).toBe("x");
  });

  it("actor は文字列 or object の両方を受け入れる (name / subtitle 反映)", () => {
    const diagram = jsonToDiagram({
      title: "mixed",
      // 順序図の板は面ごとの箱を持たない (#1466)。 箱の題と呼び名を見る検査なので箱が出る図種で測る
      type: "topology",
      actors: ["User", { name: "DB", subtitle: "Postgres" }],
      flow: [{ from: "User", to: "DB", label: "query" }],
    });
    const dbNode = diagram.nodes.find((n) => n.title === "DB");
    expect(dbNode).toBeDefined();
    // 本 test は「object 形式の actor が name / subtitle を反映すること」 のみ検証。
    expect(dbNode?.subtitle).toBe("Postgres");
  });

  it("animation phase が cdl phases に変換される", () => {
    const diagram = jsonToDiagram({
      title: "animated",
      type: "sequence",
      actors: ["A", "B", "C"],
      flow: [
        { from: "A", to: "B", label: "1" },
        { from: "B", to: "C", label: "2" },
      ],
      animation: [
        { step: "call", duration: 1.4, focus: ["A", "B"] },
        { step: "query", duration: 1.4, focus: ["B", "C"] },
      ],
    });
    expect(diagram.phases.length).toBeGreaterThanOrEqual(2);
    const callPhase = diagram.phases.find((p) => p.title === "call");
    expect(callPhase).toBeDefined();
    expect(callPhase?.duration).toBe(1400);
  });

  it("tone / style option が step に反映される", () => {
    // 線種は描画側が実際に分ける値で測る (#1304)。 以前は `dashed` で測っていたが、
    // 描画側は `dotted-flow` しか分岐を持たない = 図では `solid` と同じ線が出ていた。
    // 「届いた」 ことだけを見ると、届いても何も起きない値を通す形を検査が固定してしまう
    const diagram = jsonToDiagram({
      title: "toned",
      type: "topology",
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "ok", tone: "success", style: "dotted-flow" }],
    });
    const edge = diagram.edges[0]!;
    expect(edge.tone).toBe("success");
    expect(edge.style).toBe("dotted-flow");
  });

  it("描画側が持たない線種は誤りになる (#1304)", () => {
    // `dotted` は schema が宣言していたが実装は受けない = 書いても線が変わらず、知らせも出なかった。
    // `dashed` は #1466 で描画側が分岐を持つようになったため、いまは通る側にある
    expect(() =>
      jsonToDiagram({
        title: "toned",
        type: "topology",
        actors: ["A", "B"],
        flow: [{ from: "A", to: "B", label: "ok", style: "dotted" }],
      }),
    ).toThrow(/step\.style must be one of: /);
  });

  it("YAML と JSON で同じ diagram が生成される (1:1 対応)", () => {
    const jsonDiagram = jsonToDiagram({
      title: "compare",
      type: "topology",
      actors: ["User", "API"],
      flow: [{ from: "User", to: "API", label: "login" }],
    });
    const yamlDiagram = textDslToDiagram(`
title: "compare"
type: topology
actors:
  - User
  - API
flow:
  - User -> API: "login"
animation:
  - step: "call" 1.4s
    focus: [User, API]
`);
    expect(jsonDiagram.id).toBeTruthy();
    expect(yamlDiagram.id).toBeTruthy();
    expect(jsonDiagram.nodes.length).toBe(yamlDiagram.nodes.length);
    expect(jsonDiagram.edges.length).toBe(yamlDiagram.edges.length);
    const jsonEdge = jsonDiagram.edges[0]!;
    const yamlEdge = yamlDiagram.edges[0]!;
    expect(jsonEdge.label).toBe(yamlEdge.label);
  });

  it("validation error が具体的な path を返す (root object 必須)", () => {
    expect(() => jsonToDiagram(null)).toThrow(/root must be a JSON object/);
    expect(() => jsonToDiagram([])).toThrow(/root must be a JSON object/);
    expect(() => jsonToDiagram("not an object")).toThrow(/root must be a JSON object/);
  });

  it("validation error = title 欠落を path で示す", () => {
    const result = validateDragonJson({
      type: "sequence",
      actors: ["a"],
      flow: [{ from: "a", to: "a", label: "x" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const titleErr = result.errors.find((e) => e.path === "$.title");
      expect(titleErr).toBeDefined();
    }
  });

  it("validation error = type invalid を enum hint 付きで示す", () => {
    const result = validateDragonJson({
      title: "bad",
      type: "invalid-preset",
      actors: ["a"],
      flow: [{ from: "a", to: "a", label: "x" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const typeErr = result.errors.find((e) => e.path === "$.type");
      expect(typeErr).toBeDefined();
      expect(typeErr?.message).toMatch(/type must be one of/);
    }
  });

  it("validation error = flow step 内の from 型不正を配列 index で示す", () => {
    const result = validateDragonJson({
      title: "bad step",
      type: "sequence",
      actors: ["a", "b"],
      flow: [
        { from: "a", to: "b", label: "ok" },
        { from: 123, to: "b", label: "bad" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const err = result.errors.find((e) => e.path === "$.flow[1].from");
      expect(err).toBeDefined();
    }
  });

  it("multiple validation errors を全部返す (LLM 一括修正用)", () => {
    const result = validateDragonJson({
      title: "",
      type: "unknown",
      actors: [],
      flow: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("diagramJsonSchema (LLM tool schema)", () => {
  it("Issue #208 AC 2 = JSON Schema が export される", () => {
    expect(diagramJsonSchema).toBeDefined();
    expect(diagramJsonSchema.type).toBe("object");
    expect(diagramJsonSchema.required).toContain("title");
    expect(diagramJsonSchema.required).toContain("type");
    expect(diagramJsonSchema.required).toContain("actors");
    expect(diagramJsonSchema.required).toContain("flow");
  });

  it("schema の type enum は記法の型と完全に一致する", () => {
    // 型の一覧は 3 箇所にある = 記法の型 (`PRESET_TYPES`)、 JSON 経路の検査
    // (`VALID_PRESETS`、 `PRESET_TYPES` から導出済)、 そして本 schema。 schema だけは手で
    // 持っているため、 型を足しても消しても気付けない。
    //
    // 下限だけを見る上の検査は増減のどちらにも当たらない (19 件でも 18 件でも通る)。 実際
    // `#1170` で `radial` を消した時、 schema に残ったまま全ての検査が通った。 schema は
    // LLM に渡す契約なので、 残ると「schema 通りに書いたのに弾かれる」 出力を誘発する。
    const typeSchema = (diagramJsonSchema.properties as Record<string, { enum?: string[] }>).type;
    expect(new Set(typeSchema?.enum ?? [])).toEqual(new Set(PRESET_TYPES));
  });

  it("schema の説明文が実在する型だけを挙げる", () => {
    // **説明文も型の一覧を持っている** (`#1174`)。 enum だけ縛っても、 同じ object の
    // `description` が型名を並べているのでそちらが古くなる。
    //
    // 説明文の方が実害が大きい。 enum は一致しなければ弾くが、 説明文は LLM が
    // 「どう actors を書くか」 を決める材料なので、 消えた型の書き方が残っていると
    // **黙って誤った出力を誘導する**。 `#1170` で `radial` を消した時、 enum と説明文の
    // 両方を手で直す必要があった。
    const typeSchema = (diagramJsonSchema.properties as Record<string, { description?: string }>).type;
    const 説明 = typeSchema?.description ?? "";
    expect(説明, "型の説明文が空").not.toBe("");

    // **型の項目は「名前 + 半角空白 + 括弧」 の形で書く**。 説明文はこの形を守っており
    // (`sequence (時系列の呼び出し)` / `gantt (工程の並び)`)、 欄の名前として出る `flow` や
    // `actors` はこの形を取らない (`flow に矢印を書く`)。
    //
    // この形を手掛かりにすると、 **型名の一覧を手で持たずに済む**。 手で持つと、 後から
    // 足した型が一覧に無いまま消された時に検出できない (この検査を最初に書いた時は
    // 手書きの一覧に依存しており、 その穴があった)。
    const 項目 = (s: string) =>
      new Set([...s.matchAll(/(?:^|[\s/(])([a-z][a-z0-9]*) \(/gu)].map((m) => m[1]!));
    const 出てくる型 = 項目(説明);
    const 実在 = new Set<string>(PRESET_TYPES);

    // 消した型の項目が残っていないか
    const 消えた型が残っている = [...出てくる型].filter((w) => !実在.has(w));
    expect(
      消えた型が残っている,
      `説明文に実在しない型が残っている: ${消えた型が残っている.join(", ")}`,
    ).toEqual([]);

    // 足した型の項目が書かれているか。 **素の部分一致では見られない** = `flow` は欄の名前
    // としても出るため、 型の項目を消しても `説明.includes("flow")` は真のまま通る
    const 書かれていない = [...実在].filter((t) => !出てくる型.has(t));
    expect(書かれていない, `説明文に書かれていない型がある: ${書かれていない.join(", ")}`).toEqual([]);
  });

  it("schema は $schema field を持つ (Draft 7 declaration)", () => {
    expect(diagramJsonSchema.$schema).toMatch(/json-schema.org/);
  });
});
