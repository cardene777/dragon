/**
 * CAR-1678 = yaml-adapter unit test。 spec `docs/spec/pr1-editor-multiline-yaml-tab.md` AC 3-4 の
 * core logic (js-yaml.load → jsonToDiagram bridge + error mapping) を behavior test で検証する。
 * playground-spa 側の CdlEditor tab UI (AC 1-2) と Playwright e2e (AC 5) は別 file で担保。
 *
 * 判定基準:
 * - AC 3 = 有効 YAML source が CdlDiagram に変換され、 render pipeline に流せる shape になる
 * - AC 4 = parse error (tab 混在 / unclosed quote) が `{ line, message }` 形式で返る、 前段 render 保持は caller 側責務のため本 test では error shape のみ検証
 * - validation error (schema 不一致) が「line なし + validation kind」 で返り、 preview error banner の分岐に使える
 * - 空 source / null 結果は validation error に統一される (undefined 経路の regression 防止)
 *
 * verify 方法 = `pnpm test yaml-adapter` (vitest run) で全 assertion PASS
 */
import { describe, it, expect } from "vitest";
import { jsonToDiagram } from "@cardenelabs/dragon";
import {
  yamlToObject,
  yamlToDiagram,
  formatYamlError,
  type YamlAdapterError,
} from "./yaml-adapter";

const VALID_YAML = `title: "YAML tab demo"
type: sequence
actors:
  - User
  - API
flow:
  - from: User
    to: API
    label: login
  - from: API
    to: User
    label: ok
animation:
  - step: request
    duration: 1.2
    focus:
      - User
      - API
`;

describe("yamlToObject (parse layer)", () => {
  it("有効 multi-line YAML が plain object に変換される (AC 3 前段)", () => {
    const result = yamlToObject(VALID_YAML);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const obj = result.value as Record<string, unknown>;
    expect(obj.title).toBe("YAML tab demo");
    expect(obj.type).toBe("sequence");
    expect(Array.isArray(obj.actors)).toBe(true);
    expect((obj.actors as unknown[]).length).toBe(2);
  });

  it("空文字列 = validation error (kind=validation, line=null) で返る", () => {
    const result = yamlToObject("");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation");
    expect(result.error.line).toBeNull();
    expect(result.error.message).toContain("empty");
  });

  it("whitespace のみ = validation error で返る", () => {
    const result = yamlToObject("   \n\n   \n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation");
  });

  it("null にのみ resolve される YAML = validation error", () => {
    const result = yamlToObject("~");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation");
    expect(result.error.message).toContain("null");
  });

  it("unclosed quote = parse error (AC 4 の line + message mapping)", () => {
    const bad = `title: "unclosed
type: sequence
actors:
  - A
`;
    const result = yamlToObject(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("parse");
    // js-yaml の YAMLException.mark.line は 0-origin、 adapter で +1 して 1-origin にする
    expect(result.error.line).not.toBeNull();
    expect(typeof result.error.line).toBe("number");
    expect(result.error.line!).toBeGreaterThan(0);
    expect(result.error.message.length).toBeGreaterThan(0);
    // reason field は元 YAMLException.reason (test / debug 用)
    expect(result.error.reason).not.toBeNull();
  });

  it("tab 混在 indentation = parse error", () => {
    // YAML 1.2 は tab を indentation として禁止する
    const bad = "actors:\n\t- A\n\t- B\n";
    const result = yamlToObject(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("parse");
    expect(result.error.line).not.toBeNull();
  });
});

describe("yamlToDiagram (full pipeline)", () => {
  it("有効 YAML が CdlDiagram に変換される (AC 3 完全経路)", () => {
    const result = yamlToDiagram(VALID_YAML);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.diagram).toBeDefined();
    expect(result.diagram.id).toBeTruthy();
    expect(result.diagram.nodes.length).toBeGreaterThan(0);
    expect(result.diagram.edges.length).toBeGreaterThan(0);
    const firstEdge = result.diagram.edges[0];
    expect(firstEdge.label).toBe("login");
  });

  it("YAML tab 混在 = parse error に丸められる (kind=parse, line 保持)", () => {
    const bad = "actors:\n\t- A\n\t- B\n";
    const result = yamlToDiagram(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("parse");
    expect(result.error.line).not.toBeNull();
  });

  it("schema 不一致 (title 欠落) = validation error", () => {
    const noTitle = `type: sequence
actors:
  - A
  - B
flow:
  - from: A
    to: B
    label: x
`;
    const result = yamlToDiagram(noTitle);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation");
    // jsonToDiagram の validation message は path 情報を含む長文なので存在確認のみ
    expect(result.error.message.length).toBeGreaterThan(0);
  });

  it("schema 不一致 (actors 欠落) = validation error", () => {
    const noActors = `title: "x"
type: sequence
flow:
  - from: A
    to: B
    label: x
`;
    const result = yamlToDiagram(noActors);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation");
  });

  it("空 source = validation error (empty)", () => {
    const result = yamlToDiagram("");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation");
    expect(result.error.message).toContain("empty");
  });

  it("部品の一覧を渡すと図に取り込まれる (渡さないと仮の箱に落ちる)", () => {
    // 渡す経路を落としても throw しないため、 「通った」 だけでは検知できない。
    // 渡した時と渡さない時で図の中身が変わることを両方見る。
    const yaml = `title: "with parts"
type: sequence
actors:
  - name: gauge1
    kind: demo-part
flow: []
`;
    const part = jsonToDiagram({ title: "demo part", type: "flow", actors: ["Inner"], flow: [] });

    const withCatalog = yamlToDiagram(yaml, { partsCatalog: { "demo-part": part } });
    expect(withCatalog.ok).toBe(true);
    if (!withCatalog.ok) return;
    // 部品の中身が名前の頭を付けて入る
    expect(withCatalog.diagram.nodes.map((n) => n.id)).toEqual(["gauge1__inner"]);

    const without = yamlToDiagram(yaml);
    expect(without.ok).toBe(true);
    if (!without.ok) return;
    // 解決できないと仮の箱 3 つになる = 渡す経路を落とせば必ずここで差が出る
    expect(without.diagram.nodes.map((n) => n.id)).toEqual([
      "gauge1-header",
      "gauge1-spacer",
      "gauge1-footer",
    ]);
  });

  it("`---` で区切った複数の文書は誤りにする (先頭だけ読む形ではない)", () => {
    // 説明文と実装が食い違っていた箇所。 `load()` 自身が単一文書を要求する
    const result = yamlToObject("a: 1\n---\na: 2\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("parse");
    expect(result.error.message).toContain("single document");
  });
});

describe("formatYamlError (preview display formatting)", () => {
  it("AC 4 の form: parse error + line 保持で `YAML parse error: line <N>: <message>`", () => {
    const err: YamlAdapterError = {
      kind: "parse",
      line: 3,
      message: "unexpected end of the stream within a single quoted scalar",
      reason: "unexpected end of the stream within a single quoted scalar",
    };
    expect(formatYamlError(err)).toBe(
      "YAML parse error: line 3: unexpected end of the stream within a single quoted scalar",
    );
  });

  it("validation error = `YAML error: <message>` (line なし fallback)", () => {
    const err: YamlAdapterError = {
      kind: "validation",
      line: null,
      message: "YAML source is empty",
      reason: null,
    };
    expect(formatYamlError(err)).toBe("YAML error: YAML source is empty");
  });

  it("parse error だが line 不明 (null) = validation form に fallback", () => {
    const err: YamlAdapterError = {
      kind: "parse",
      line: null,
      message: "malformed",
      reason: null,
    };
    expect(formatYamlError(err)).toBe("YAML error: malformed");
  });
});
