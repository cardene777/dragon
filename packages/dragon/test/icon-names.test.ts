/**
 * アイコン名は描く部品のアイコンの表 (`ICONS`) に在る名前だけ (#3311)。
 *
 * 書き間違えたアイコン名は図に何も描かれず、アイコンを持つ箱が在るかで決まる名前の高さ (#3307) まで変わる。
 * 色の名前と同じく、原本の型の決まりが値の一覧で断り、記法の読み取りも値の位置を指して断る。
 * 型の決まりの一覧は手で書くので、`ICONS` の名前と同じかをここで突き合わせる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { api, type Json, smallArchitecture, smallSequence } from "./diagram-support";

const SCHEMA = join(process.cwd(), "packages/dragon/src/schemas/diagram.schema.json");
const ICON_NAMES = Object.keys((dragon as unknown as { ICONS: Record<string, string> }).ICONS);

const withIcon = (base: Json, list: "boxes" | "regions", icon: string): Json => {
  const diagram = structuredClone(base) as Record<string, { icon?: string }[]>;
  const items = diagram[list] as { icon?: string }[];
  items[0] = { ...items[0], icon };
  return diagram;
};

describe("アイコン名 (#3311)", () => {
  it("記法で box 甲 [icon: usr] を読むと、icon の属性の位置を指す誤りで止まり、使えるアイコン名を挙げる", () => {
    const text = ["sequence 印", "", "box 甲 [icon: usr]", "box 乙", "", "step 送る", "  say 甲が乙へ送る。", "  甲 -> 乙: 送る"].join("\n");
    const result = api("parseNotation")(text);
    expect(result.ok, "書き間違えたアイコン名を通さない").toBe(false);
    const error = (result as { ok: false; errors: { line: number; column: number; message: string }[] }).errors[0];
    expect(error, "誤りが 1 つも無い").toBeDefined();
    // 色の名前の誤りと同じく、属性の頭 (icon の語) を指す
    expect({ line: error?.line, column: error?.column }, "誤りが指す所").toEqual({ line: 3, column: (text.split("\n")[2] ?? "").indexOf("icon") + 1 });
    // 近い名前がある時は一覧を並べず近い名前だけを挙げる (#3315)。一覧を並べる形は近い名前の無い名前で確かめる
    expect(error?.message, "誤りの文が近いアイコン名 user を挙げる").toContain("user");
  });

  it("記法で近い名前の無いアイコン名 zzzzzz を読むと、誤りの文が使えるアイコン名を挙げる", () => {
    const text = ["sequence 印", "", "box 甲 [icon: zzzzzz]", "box 乙", "", "step 送る", "  say 甲が乙へ送る。", "  甲 -> 乙: 送る"].join("\n");
    const result = api("parseNotation")(text);
    expect(result.ok, "知らないアイコン名を通さない").toBe(false);
    const message = (result as { ok: false; errors: { message: string }[] }).errors[0]?.message;
    for (const name of ["user", "db", "key"]) expect(message, `誤りの文が使えるアイコン名 ${name} を挙げる`).toContain(name);
  });

  it("記法で使えるアイコン名を書いた箱と区画は、そのまま読める", () => {
    const text = ["architecture 印", "", "group 店 [icon: cart]", "  box 甲 [icon: user]", "end", "box 乙", "", "step 送る", "  say 甲が乙へ送る。", "  甲 -> 乙: 送る"].join("\n");
    const result = api("parseNotation")(text);
    expect(result, "使えるアイコン名を読む").toMatchObject({ ok: true });
  });

  it("原本の JSON で箱の icon を usr にして validateDiagram に通すと、/boxes/0/icon を指す誤りが返る", () => {
    const checked = api("validateDiagram")(withIcon(smallSequence(), "boxes", "usr"));
    expect(checked.ok, "書き間違えたアイコン名を通さない").toBe(false);
    const errors = (checked as { ok: false; errors: { pointer: string; message: string }[] }).errors;
    expect(errors.map((e) => e.pointer), "誤りが指す欄").toEqual(["/boxes/0/icon"]);
    expect(errors[0]?.message, "誤りの文が使えるアイコン名を挙げる").toContain("user");
  });

  it("原本の JSON で区画の icon を usr にして validateDiagram に通すと、/regions/0/icon を指す誤りが返る", () => {
    const checked = api("validateDiagram")(withIcon(smallArchitecture(), "regions", "usr"));
    expect(checked.ok, "書き間違えたアイコン名を通さない").toBe(false);
    const errors = (checked as { ok: false; errors: { pointer: string }[] }).errors;
    expect(errors.map((e) => e.pointer), "誤りが指す欄").toEqual(["/regions/0/icon"]);
  });

  it("アイコンの表の継いだ鍵 constructor も、記法と原本の JSON の両方で知らないアイコン名として断る", () => {
    // 表を `ICONS[name]` で引くと継いだ鍵が値を返し、描く部品が空の絵柄の枠を描いていた (#3307)
    const text = ["sequence 印", "", "box 甲 [icon: constructor]", "box 乙", "", "step 送る", "  say 甲が乙へ送る。", "  甲 -> 乙: 送る"].join("\n");
    expect(api("parseNotation")(text).ok, "記法で通さない").toBe(false);
    expect(api("validateDiagram")(withIcon(smallSequence(), "boxes", "constructor")).ok, "原本の JSON で通さない").toBe(false);
  });

  it("原本の JSON で使えるアイコン名を書いた箱と区画は通る", () => {
    expect(api("validateDiagram")(withIcon(withIcon(smallArchitecture(), "regions", "cart"), "boxes", "user"))).toEqual({ ok: true });
  });

  it("原本の型の決まりのアイコン名の一覧が、ICONS の名前と同じ並びで一致する", () => {
    const schema = JSON.parse(readFileSync(SCHEMA, "utf8")) as { definitions: Record<string, { enum?: string[] }> };
    expect(ICON_NAMES.length, "ICONS の名前の数").toBeGreaterThan(0);
    expect(schema.definitions.icon?.enum, "型の決まりのアイコン名の一覧").toEqual(ICON_NAMES);
  });
});
