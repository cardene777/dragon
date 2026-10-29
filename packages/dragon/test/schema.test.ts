/**
 * 原本の JSON を JSON Schema 1 本で検査する (#2984)。
 *
 * 誤りは JSON Pointer で場所を示す。座標の欄 (x / y) はどの部品にも許さず、段の題と本文と
 * 形式の版は必須にする。
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { api, exampleJson, patched, pointers, smallArchitecture, smallSequence } from "./diagram-support";

const require_ = createRequire(import.meta.url);

describe("原本の JSON の検査", () => {
  it("validator-matches-schema", () => {
    // 頁の CSP の下で動くように前もって書き出した検査の関数が、今の schema から書き出した物と同じ (#2995)
    const { generate, OUT } = require_("../scripts/build-validator.mjs") as { generate: () => string; OUT: string };
    expect(readFileSync(OUT, "utf8") === generate(), "schema を直した後に build-validator.mjs を回していない").toBe(true);
  });

  it("schema-reports-enum-choices", () => {
    // 決まった値の欄は、使える値を並べて示す
    const checked = api("validateDiagram")(patched(smallSequence(), ["boxes", 0, "color"], "purple"));
    expect(checked.ok).toBe(false);
    const error = checked.ok ? undefined : checked.errors.find((e) => e.pointer === "/boxes/0/color");
    expect(error?.message).toBe("blue / amber / green / violet / rose / slate / coin のどれかにする");
  });

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

  it("schema-accepts-link-and-sources", () => {
    // 箱の飛び先と、段の出典 (名前と URL の組の並び) は書かなくてよい欄 (#3199)
    const validate = api("validateDiagram");
    const sources = [
      { name: "dragon の README", url: "https://github.com/cardene777/dragon/blob/main/README.md" },
      { name: "中の仕組み", url: "/diagrams/entry" },
    ];
    const architecture = patched(patched(smallArchitecture(), ["boxes", 0, "link"], "/diagrams/entry"), ["steps", 0, "sources"], sources);
    const sequence = patched(patched(smallSequence(), ["boxes", 1, "link"], "http://github.com/cardene777/dragon"), ["steps", 0, "sources"], sources);
    expect(validate(architecture)).toEqual({ ok: true });
    expect(validate(sequence)).toEqual({ ok: true });

    // 頁を移らない形の飛び先と出典は、その欄の場所を示して断る
    for (const lang of ["ja", "en"] as const) {
      const cases: [ReturnType<typeof smallSequence>, string][] = [
        [patched(architecture, ["boxes", 0, "link"], "javascript:alert(1)"), "/boxes/0/link"],
        [patched(architecture, ["steps", 0, "sources", 1, "url"], "javascript:alert(1)"), "/steps/0/sources/1/url"],
        [patched(sequence, ["boxes", 1, "link"], "diagrams/entry"), "/boxes/1/link"],
      ];
      for (const [diagram, pointer] of cases) {
        const result = validate(diagram, { lang });
        expect(pointers(result), `${lang} ${pointer}`).toEqual([pointer]);
        const message = result.ok ? "" : (result.errors[0]?.message ?? "");
        expect(message, `${lang} ${pointer} の誤りが書ける形を示さない`).toContain("https://");
      }
    }
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
