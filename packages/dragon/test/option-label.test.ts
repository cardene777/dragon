/**
 * 記法で選択肢と切り替えに見せる名前を書ける (#1920)。
 *
 * 描画側は選択肢を文字列か `{ value, label }` の組で受け、名前を操作部の選択肢と箱の字の差し込みに
 * 描く (cdl#855)。 値は綴りのまま残るので、綴りで読む読み出しと表示の出し分けは名前に影響されない。
 * 記法が文字列の並びしか受けないと、組み立て関数で書いた名前を記法の見本に写せない。
 */
import { describe, expect, it } from "vitest";
import { jsonToDiagram, textDslToDiagram, validateDragonJson } from "../src";
import { diagramJsonSchema } from "../src/schema";

type 入力欄 = Record<string, unknown>;

const 記法 = (行: string, onNotice?: (n: { actor: string }) => void) =>
  textDslToDiagram(
    `title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

inputs:
${行}

actors:
  - A: { kind: card, lane: l, stack: 0 }

animation:
  - step: "p" 1s
`,
    onNotice ? { onNotice } : undefined,
  );

const 入力欄たち = (d: unknown): 入力欄[] => (d as { inputs?: 入力欄[] }).inputs ?? [];

const JSONの図 = (inputs: unknown) => ({
  title: "t",
  type: "flow",
  lanes: { l: { x: 0, width: 400 } },
  flow: [],
  inputs,
  actors: [{ name: "A", kind: "card", lane: "l", stack: 0 }],
  animation: [{ step: "p", duration: 1 }],
});

describe("YAML で選択肢に名前を書ける", () => {
  it("文字列と組を混ぜて書け、書いた並びのまま図に載る", () => {
    const d = 記法(
      '  s: { kind: dropdown, options: ["green", { value: "red", label: "失敗" }], defaultValue: "green" }',
    );
    expect(入力欄たち(d)).toEqual([
      {
        id: "s",
        kind: "dropdown",
        options: ["green", { value: "red", label: "失敗" }],
        defaultValue: "green",
      },
    ]);
  });

  it("`radio` / `tabs` / `multi-select` も同じ形を受ける", () => {
    const d = 記法(
      [
        "  r: { kind: radio, options: [{ value: s, label: 小 }, m], defaultValue: s }",
        "  t: { kind: tabs, options: [{ value: list, label: 一覧 }, grid], defaultValue: list }",
        "  u: { kind: multi-select, options: [{ value: a, label: 甲 }, b], defaultValues: [a] }",
      ].join("\n"),
    );
    expect(入力欄たち(d).map((x) => x.options)).toEqual([
      [{ value: "s", label: "小" }, "m"],
      [{ value: "list", label: "一覧" }, "grid"],
      [{ value: "a", label: "甲" }, "b"],
    ]);
  });

  it("引用符の中の `,` を含む組は割れない", () => {
    const d = 記法(
      '  s: { kind: dropdown, options: [{ value: "a, b", label: "甲, 乙" }, c], defaultValue: c }',
    );
    expect(入力欄たち(d)[0]?.options).toEqual([{ value: "a, b", label: "甲, 乙" }, "c"]);
  });

  it("文字列だけの並びは変更前と同じ形で届く", () => {
    const d = 記法("  m: { kind: dropdown, options: [日, 週, 月], defaultValue: 日 }");
    expect(入力欄たち(d)[0]?.options).toEqual(["日", "週", "月"]);
  });

  it.each([
    ["名前が無い", "[{ value: red }]", /options\[0\]\.label は必ず書きます/],
    ["値が無い", '[{ label: "失敗" }]', /options\[0\]\.value は必ず書きます/],
    [
      "知らない項目名",
      '[{ value: red, label: "失敗", color: "#f00" }]',
      /options\[0\] の項目名が読めません: "color"/,
    ],
    ["値が空", '[{ value: "", label: "失敗" }]', /options\[0\]\.value が空です/],
    ["名前が空", '[{ value: red, label: "" }]', /options\[0\]\.label が空です/],
    ["閉じていない組", '[green, { value: red, label: "失敗" ]', /options/],
  ])("組の形で %s 時は行番号付きで知らせる", (_名, 並び, 知らせ) => {
    expect(() => 記法(`  s: { kind: dropdown, options: ${並び}, defaultValue: red }`)).toThrow(
      知らせ,
    );
  });

  it("切り替えの名前が図に載り、書かなければ項目ごと付かない", () => {
    const d = 記法(
      '  a: { kind: toggle, defaultValue: false, onLabel: "押した", offLabel: "押していない" }\n  b: { kind: toggle, defaultValue: true }',
    );
    expect(入力欄たち(d)).toEqual([
      { id: "a", kind: "toggle", defaultValue: false, onLabel: "押した", offLabel: "押していない" },
      { id: "b", kind: "toggle", defaultValue: true },
    ]);
  });

  it("組の値に書いた外部参照は、状態に入る値として出口で落とす", () => {
    const 知らせ: string[] = [];
    const d = 記法(
      '  s: { kind: dropdown, options: [safe, { value: "url(https://example.invalid/paint)", label: "外" }], defaultValue: safe }',
      (n) => 知らせ.push(n.actor),
    );
    expect(入力欄たち(d)[0]?.options).toEqual(["safe", { value: "none", label: "外" }]);
    expect(知らせ).toEqual(["inputs[0].options[1].value"]);
  });
});

describe("JSON で選択肢に名前を書ける", () => {
  it("正しい形は通り、YAML と同じ入力欄が図に載る", () => {
    const json = JSONの図([
      {
        id: "s",
        kind: "dropdown",
        options: ["green", { value: "red", label: "失敗" }],
        defaultValue: "green",
      },
      { id: "a", kind: "toggle", defaultValue: false, onLabel: "押した", offLabel: "押していない" },
    ]);
    const v = validateDragonJson(json);
    expect(v.ok, v.ok ? "" : v.errors.map((e) => `${e.path} ${e.message}`).join(" / ")).toBe(true);
    expect(入力欄たち(jsonToDiagram(json as never))).toEqual([
      {
        id: "s",
        kind: "dropdown",
        options: ["green", { value: "red", label: "失敗" }],
        defaultValue: "green",
      },
      { id: "a", kind: "toggle", defaultValue: false, onLabel: "押した", offLabel: "押していない" },
    ]);
  });

  it.each([
    ["名前が無い", [{ value: "red" }], "$.inputs[0].options[0].label"],
    ["値が無い", [{ label: "失敗" }], "$.inputs[0].options[0].value"],
    [
      "知らない項目名",
      [{ value: "red", label: "失敗", color: "#f00" }],
      "$.inputs[0].options[0].color",
    ],
    ["値が空", [{ value: "", label: "失敗" }], "$.inputs[0].options[0].value"],
    ["名前が空", [{ value: "red", label: "" }], "$.inputs[0].options[0].label"],
    ["名前が数", [{ value: "red", label: 1 }], "$.inputs[0].options[0].label"],
    ["要素が数", [1], "$.inputs[0].options[0]"],
    ["並びでない", "red", "$.inputs[0].options"],
  ])("%s 形を場所付きで拒む", (_名, options, 場所) => {
    const r = validateDragonJson(
      JSONの図([{ id: "s", kind: "dropdown", options, defaultValue: "red" }]),
    );
    expect(r.ok, "読めない選択肢が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain(場所);
  });
});

describe("公開している形", () => {
  type 形 = {
    type?: string;
    minLength?: number;
    items?: { oneOf?: { type?: string; required?: string[]; additionalProperties?: boolean }[] };
  };
  const 欄 = (
    diagramJsonSchema as unknown as {
      properties: { inputs: { items: { properties: Record<string, 形> } } };
    }
  ).properties.inputs.items.properties;

  it("選択肢の要素は文字列か、`value` と `label` を必須に持ち他の項目を持たない組", () => {
    const 要素 = 欄.options?.items?.oneOf ?? [];
    expect(要素.length, "選択肢の要素の形を読めていない (検査が空振りしている)").toBe(2);
    expect(要素.map((x) => x.type).sort()).toEqual(["object", "string"]);
    const 組 = 要素.find((x) => x.type === "object");
    expect([...(組?.required ?? [])].sort()).toEqual(["label", "value"]);
    expect(組?.additionalProperties).toBe(false);
  });

  it("切り替えの名前を 1 文字以上の文字列で持つ", () => {
    expect(欄.onLabel).toMatchObject({ type: "string", minLength: 1 });
    expect(欄.offLabel).toMatchObject({ type: "string", minLength: 1 });
  });
});
