/**
 * 原本の JSON を JSON Schema 1 本で検査する (#2984)。
 *
 * 誤りは JSON Pointer で場所を示す。座標の欄 (x / y) はどの部品にも許さず、段の題と本文と
 * 形式の版は必須にする。
 */
import { describe, expect, it } from "vitest";
import { api, exampleJson, patched, pointers, smallArchitecture, smallSequence } from "./diagram-support";

describe("原本の JSON の検査", () => {
  it("schema-reports-pointer-of-invalid-field", () => {
    const validate = api("validateDiagram");

    // 4 つ目の線の行き先が数値
    const wrongTarget = validate(patched(smallSequence(), ["steps", 0, "events", 3, "to"], 5));
    expect(wrongTarget.ok).toBe(false);
    expect(pointers(wrongTarget)).toContain("/steps/0/events/3/to");

    // 欄の名前に `/` と `~` を含む時は、JSON Pointer の決まりで `~1` と `~0` に置き換えて示す
    const escaped = validate(patched(smallSequence(), ["boxes", 0, "名前/別~名"], "x"));
    expect(escaped.ok).toBe(false);
    expect(pointers(escaped)).toContain("/boxes/0/名前~1別~0名");
  });

  it("schema-rejects-coordinates", () => {
    const validate = api("validateDiagram");
    const cases: [ReturnType<typeof smallSequence>, string][] = [
      [patched(smallSequence(), ["boxes", 0, "x"], 10), "/boxes/0/x"],
      [patched(smallArchitecture(), ["regions", 0, "y"], 5), "/regions/0/y"],
      [patched(smallSequence(), ["steps", 0, "events", 0, "x"], 1), "/steps/0/events/0/x"],
      [patched(smallSequence(), ["steps", 0, "events", 0, "carry", "y"], 1), "/steps/0/events/0/carry/y"],
      [patched(smallSequence(), ["strip", "y"], 1), "/strip/y"],
    ];
    for (const [diagram, pointer] of cases) {
      const result = validate(diagram);
      expect(result.ok, pointer).toBe(false);
      expect(pointers(result)).toContain(pointer);
    }
  });

  it("schema-requires-step-title-and-body", () => {
    const validate = api("validateDiagram");
    const cases: [ReturnType<typeof smallSequence>, string][] = [
      [patched(smallSequence(), ["steps", 0, "title"], undefined), "/steps/0/title"],
      [patched(smallSequence(), ["steps", 0, "body"], undefined), "/steps/0/body"],
      [patched(smallSequence(), ["steps", 0, "title"], ""), "/steps/0/title"],
    ];
    for (const [diagram, pointer] of cases) {
      const result = validate(diagram);
      expect(result.ok, pointer).toBe(false);
      expect(pointers(result)).toContain(pointer);
    }
  });

  it("schema-requires-format-version", () => {
    const validate = api("validateDiagram");
    const result = validate(patched(smallSequence(), ["version"], undefined));
    expect(result.ok).toBe(false);
    expect(pointers(result)).toContain("/version");
  });

  it("schema-accepts-common-skeleton-with-form-fields", () => {
    const validate = api("validateDiagram");
    // 生存線の欄を持つ時系列図と、種類の欄を持たない構成図
    expect(validate(smallSequence())).toEqual({ ok: true });
    expect(validate(smallArchitecture())).toEqual({ ok: true });
    expect(validate(exampleJson("oauth.json"))).toEqual({ ok: true });
    expect(validate(exampleJson("ccip.json"))).toEqual({ ok: true });
  });
});
