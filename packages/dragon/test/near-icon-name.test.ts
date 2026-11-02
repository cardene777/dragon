/**
 * 書き間違えたアイコン名に、一番近い名前を誤りの文で示す (#3315)。
 *
 * 知らないアイコン名の誤り (#3311) は使えるアイコン名を全て並べるので、`user` のつもりで `usr` と書いた時も長い一覧から探すことになる。
 * 近い名前が 1 つに決まる時は、書いた名前と近い名前だけを挙げて一覧を並べない。近い名前が無い時は今までどおり一覧を並べる。
 * 近いかは大文字と小文字を区別しない編集距離で決め、距離が 2 以下で書いた名前の字数より小さい時だけ近いとみなす。
 * 記法の誤りの文と原本の JSON の誤りの文の両方、日本語と英語の両方で同じ決め方にする。
 */
import { describe, expect, it } from "vitest";
import { api, type NotationLang, smallSequence } from "./diagram-support";

/** 近い名前を挙げた文に、一覧のほかの名前が混ざっていないかを見るための名前 (どれも usr から遠い) */
const OTHERS = ["router", "pool", "chain", "shield", "refresh"];

const notation = (icon: string): string => ["sequence 印", "", `box 甲 [icon: ${icon}]`, "box 乙", "", "step 送る", "  say 甲が乙へ送る。", "  甲 -> 乙: 送る"].join("\n");

function notationMessage(icon: string, lang?: NotationLang): string {
  const result = api("parseNotation")(notation(icon), lang ? { lang } : {});
  expect(result.ok, `アイコン名 ${icon} を通さない`).toBe(false);
  return (result as { ok: false; errors: { message: string }[] }).errors[0]?.message ?? "";
}

function jsonError(icon: string, lang?: NotationLang): { pointer: string; message: string } {
  const diagram = structuredClone(smallSequence()) as { boxes: { icon?: string }[] };
  diagram.boxes[0] = { ...diagram.boxes[0], icon };
  const checked = api("validateDiagram")(diagram, lang ? { lang } : {});
  expect(checked.ok, `アイコン名 ${icon} を通さない`).toBe(false);
  const errors = (checked as { ok: false; errors: { pointer: string; message: string }[] }).errors;
  expect(errors.length, "誤りの数").toBe(1);
  return errors[0] as { pointer: string; message: string };
}

const expectNearOnly = (message: string, written: string, near: string): void => {
  expect(message, "誤りの文が書いた名前を挙げる").toContain(written);
  expect(message, `誤りの文が近い名前 ${near} を挙げる`).toContain(near);
  for (const other of OTHERS) expect(message, `誤りの文がほかのアイコン名 ${other} を並べない`).not.toContain(other);
};

describe("近いアイコン名を示す (#3315)", () => {
  it("記法で box 甲 [icon: usr] を読むと、誤りの文が usr と近い名前 user を挙げ、ほかのアイコン名を並べない", () => {
    expectNearOnly(notationMessage("usr"), "usr", "user");
  });

  it("記法で近い名前の無いアイコン名 zzzzzz を読むと、誤りの文が使えるアイコン名を全て並べる", () => {
    const message = notationMessage("zzzzzz");
    for (const name of ["user", ...OTHERS]) expect(message, `誤りの文がアイコン名 ${name} を並べる`).toContain(name);
  });

  it("原本の JSON で箱の icon を usr にして validateDiagram に通すと、/boxes/0/icon を指す誤りの文が user を挙げ、ほかのアイコン名を並べない", () => {
    const error = jsonError("usr");
    expect(error.pointer, "誤りが指す欄").toBe("/boxes/0/icon");
    expectNearOnly(error.message, "usr", "user");
  });

  it("原本の JSON で近い名前の無いアイコン名は、誤りの文が使えるアイコン名を全て並べる", () => {
    const { message } = jsonError("zzzzzz");
    for (const name of ["user", ...OTHERS]) expect(message, `誤りの文がアイコン名 ${name} を並べる`).toContain(name);
  });

  it("英語の誤りの文 (lang が en) でも、記法と原本の JSON の両方で近い名前 user を挙げる", () => {
    expectNearOnly(notationMessage("usr", "en"), "usr", "user");
    expectNearOnly(jsonError("usr", "en").message, "usr", "user");
  });

  it("大文字で書いた名前と、2 文字違いの名前も近い名前を挙げ、字数より遠い名前は挙げない", () => {
    expectNearOnly(notationMessage("USR"), "USR", "user");
    // 字の入れ替え (chian) は編集距離 2 で近い
    expect(notationMessage("chian"), "誤りの文が近い名前 chain を挙げる").toContain("chain");
    // 1 文字の名前 (q) は、1 文字の名前 (x) と距離 1 でも字数より小さくないので近いとみなさない
    expect(notationMessage("q"), "誤りの文が一覧を並べる").toContain("router");
  });
});
