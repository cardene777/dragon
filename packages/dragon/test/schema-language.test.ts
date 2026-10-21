/**
 * 原本の JSON の誤りの文を、渡した言葉 (日本語か英語) で出す (#2999)。
 *
 * JSON は語を持たず file から言葉を決められないので、呼ぶ側 (頁なら頁の言葉) が言葉を渡す。
 * 渡さなければ今の日本語で出す。今は ajv の英語の文がそのまま出ていた決まりも、日本語と英語の文に書き起こす。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, exampleJson, type FieldError, type Json, type NotationLang } from "./diagram-support";

/** 仮名と漢字。英語の誤りの文に入らない */
const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
/** ajv が作る英語の文 */
const AJV_ENGLISH = /\bmust\b/u;

type Diagramish = { [key: string]: Json };
const oauth = (): Diagramish => structuredClone(exampleJson("oauth.json")) as Diagramish;
const boxes = (d: Diagramish): Diagramish[] => d.boxes as Diagramish[];
const firstEvent = (d: Diagramish): Diagramish => ((d.steps as Diagramish[])[0]?.events as Diagramish[])[0] as Diagramish;

/** 誤りの種類ごとに、その誤りだけを持つ原本を作る */
const CASES: Record<string, () => Diagramish> = {
  書けない欄: () => {
    const d = oauth();
    (boxes(d)[0] as Diagramish).colour = "blue";
    return d;
  },
  要る欄: () => {
    const d = oauth();
    delete (boxes(d)[0] as Diagramish).name;
    return d;
  },
  決まった値: () => {
    const d = oauth();
    (boxes(d)[0] as Diagramish).color = "pink";
    return d;
  },
  道具より新しい版: () => ({ ...oauth(), version: 9 }),
  型: () => ({ ...oauth(), title: 3 }),
  字の数: () => ({ ...oauth(), title: "" }),
  名札の形: () => {
    const d = oauth();
    (boxes(d)[0] as Diagramish).id = "a b";
    return d;
  },
  数: () => ({ ...oauth(), steps: [] }),
  版の下限: () => ({ ...oauth(), version: 0 }),
  線の種類の値: () => {
    const d = oauth();
    firstEvent(d).type = "arrow";
    return d;
  },
  書けない組み合わせ: () => ({ ...oauth(), kind: "architecture" }),
  どちらかが要る欄: () => withStripValue({ type: "strip", field: "f" }),
};

/** 帯を宣言し、最初の段の終わりに帯の値の行を足した原本 */
function withStripValue(event: Diagramish): Diagramish {
  const d = oauth();
  d.strip = { title: "S", fields: ["f"] };
  ((d.steps as Diagramish[])[0]?.events as Json[]).push(event);
  return d;
}

/** ajv の英語の文がそのまま出ていた決まりの誤り */
const AJV_RULES = ["型", "字の数", "名札の形", "数", "版の下限", "線の種類の値", "書けない組み合わせ", "どちらかが要る欄"];

const errorsOf = (input: Diagramish, lang?: NotationLang): FieldError[] => {
  const read = api("readDiagram")(input, lang === undefined ? undefined : { lang });
  expect(read.ok, "誤りのある原本が通った").toBe(false);
  return read.ok ? [] : read.errors;
};

describe("原本の JSON の誤りの文の言葉", () => {
  it("json-errors-in-english", () => {
    for (const [label, make] of Object.entries(CASES)) {
      const errors = errorsOf(make(), "en");
      expect(errors.length, label).toBeGreaterThan(0);
      for (const error of errors) expect(error.message, `${label} の誤りの文が英語でない (${error.pointer})`).not.toMatch(KANA_KANJI);
    }
  });

  it("json-errors-default-japanese-unchanged", () => {
    const expected: [string, string, string][] = [
      ["書けない欄", "/boxes/0/colour", "colour という欄は書けない"],
      ["要る欄", "/boxes/0/name", "name の欄が要る"],
      ["決まった値", "/boxes/0/color", "blue / amber / green / violet / rose / slate / coin のどれかにする"],
      ["道具より新しい版", "/version", "版 9 の図は、この道具 (版 1) より新しいので読めない。道具を新しくする"],
    ];
    for (const [label, pointer, message] of expected) {
      const make = CASES[label] as () => Diagramish;
      expect(errorsOf(make()), label).toEqual([{ pointer, message }]);
      if (label !== "道具より新しい版") expect(api("validateDiagram")(make()), label).toEqual({ ok: false, errors: [{ pointer, message }] });
    }
  });

  it("json-errors-in-japanese-for-ajv-rules", () => {
    for (const label of AJV_RULES) {
      for (const lang of [undefined, "ja"] as const) {
        const errors = errorsOf((CASES[label] as () => Diagramish)(), lang);
        for (const error of errors) {
          expect(error.message, `${label} の誤りの文が日本語でない (${error.pointer})`).toMatch(KANA_KANJI);
          expect(error.message, `${label} の誤りの文に ajv の英語の文が残る (${error.pointer})`).not.toMatch(AJV_ENGLISH);
        }
      }
    }
  });

  it("pattern-error-lists-forbidden-characters", () => {
    for (const lang of ["ja", "en"] as const) {
      const error = errorsOf((CASES.名札の形 as () => Diagramish)(), lang).find((e) => e.pointer === "/boxes/0/id");
      expect(error, `${lang} で名札の形の誤りが /boxes/0/id に出ない`).toBeDefined();
      expect(error?.message, `${lang} の名札の形の誤りが正規表現を出す`).not.toMatch(/\^|\\s|\$|\]\+/u);
      for (const char of ["[", "]", "「", "」", "=", ":"]) expect(error?.message, `${lang} の名札の形の誤りが ${char} を示さない`).toContain(char);
    }
  });

  it("not-error-names-the-field", () => {
    const withoutKind = oauth();
    delete withoutKind.kind;
    const cases: { label: string; input: Diagramish; pointer: string; words: string[] }[] = [
      { label: "構成図に sequence の欄", input: (CASES.書けない組み合わせ as () => Diagramish)(), pointer: "/sequence", words: ["sequence", "kind"] },
      { label: "kind が無い図の sequence の欄", input: withoutKind, pointer: "/sequence", words: ["sequence", "kind"] },
      { label: "kind の綴りを誤った図の sequence の欄", input: { ...oauth(), kind: "sequense" }, pointer: "/sequence", words: ["sequence", "kind"] },
    ];
    const coinWithText = oauth();
    firstEvent(coinWithText).carry = { kind: "coin", text: "x" };
    cases.push({ label: "札でない運ぶ物の text の欄", input: coinWithText, pointer: "/steps/0/events/0/carry/text", words: ["text", "kind", "tag"] });
    for (const lang of ["ja", "en"] as const) {
      for (const c of cases) {
        const errors = errorsOf(c.input, lang);
        expect(errors.map((e) => e.pointer), `${lang} ${c.label} の誤りの場所が書けない欄でない`).toContain(c.pointer);
        expect(errors.map((e) => e.pointer), `${lang} ${c.label} の誤りが根か運ぶ物の欄に残る`).not.toContain(c.pointer.replace(/\/[^/]+$/u, ""));
        const message = errors.find((e) => e.pointer === c.pointer)?.message ?? "";
        for (const word of c.words) expect(message, `${lang} ${c.label} の誤りが ${word} を示さない`).toContain(word);
        if (c.pointer === "/sequence") expect(message, `${lang} ${c.label} の誤りが図の種類を言い切る`).not.toMatch(/構成図|architecture/u);
      }
    }
  });

  it("any-of-error-is-one-message", () => {
    for (const lang of ["ja", "en"] as const) {
      const input = (CASES.どちらかが要る欄 as () => Diagramish)();
      const last = (((input.steps as Diagramish[])[0]?.events as Json[]).length ?? 0) - 1;
      const errors = errorsOf(input, lang);
      expect(errors.length, `${lang} で誤りが 1 つにまとまらない ${JSON.stringify(errors)}`).toBe(1);
      expect(errors[0]?.pointer).toBe(`/steps/0/events/${last}`);
      expect(errors[0]?.message).toContain("value");
      expect(errors[0]?.message).toContain("tag");
    }
  });

  it("every-schema-keyword-has-messages", async () => {
    const schema = JSON.parse(readFileSync(join(process.cwd(), "packages/dragon/src/schemas/diagram.schema.json"), "utf8")) as Json;
    const keywords = new Set<string>();
    /** 誤りを出さない欄と、中の schema を辿るだけの欄 */
    const NOT_JUDGED = new Set(["title", "description", "$ref", "$schema", "$id", "properties", "definitions", "items", "if", "then", "else"]);
    const walk = (node: Json): void => {
      if (node === null || typeof node !== "object" || Array.isArray(node)) return;
      for (const [key, value] of Object.entries(node)) {
        if (key === "properties" || key === "definitions") {
          for (const child of Object.values(value as { [key: string]: Json })) walk(child);
          continue;
        }
        if (!NOT_JUDGED.has(key)) keywords.add(key);
        if (key === "discriminator") continue;
        if (Array.isArray(value)) value.forEach(walk);
        else walk(value);
      }
    };
    walk(schema);
    expect([...keywords], "schema から決まりを読めていない").toEqual(expect.arrayContaining(["type", "required", "additionalProperties", "not", "anyOf", "discriminator"]));

    // 誤りの文の表は、検査が言葉ごとに文を引く表。名前を変数で組み、まだ無い時に読み込みで止まらず判定で落とす
    const place = ["..", "src", "field-messages"].join("/");
    const loaded = (await import(/* @vite-ignore */ place).catch(() => undefined)) as { FIELD_MESSAGES?: Record<NotationLang, Record<string, unknown>> } | undefined;
    expect(loaded?.FIELD_MESSAGES, "誤りの文の表 (packages/dragon/src/field-messages.ts の FIELD_MESSAGES) が無い").toBeDefined();
    for (const lang of ["ja", "en"] as const) {
      const missing = [...keywords].filter((keyword) => loaded?.FIELD_MESSAGES?.[lang]?.[keyword] === undefined);
      expect(missing, `${lang} の誤りの文が無い決まり`).toEqual([]);
    }
  });
});
