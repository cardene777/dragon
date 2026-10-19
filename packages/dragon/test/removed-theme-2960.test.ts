/**
 * 色だけを変える 2 つの意匠を外し、置き換え先で描く (#2960)。
 *
 * 記法の意匠は 9 つあり、そのうち生成りに茶 (`kinari`) と青磁に墨 (`celadon`) の 2 つは
 * 色だけを変える意匠だった。 残りの 7 つは地まで含めた 1 枚の絵なので、色だけの 2 つを外す。
 *
 * 外した図種と箱の種類 (#2947) は誤りにして描かない形だったが、意匠は **警告を出したうえで
 * 置き換え先で描く**。 意匠は図の骨組みを変えないため、置き換えても図が崩れない。
 *
 * | 外す書き方 | 置き換え先 |
 * |---|---|
 * | `kinari` / `生成り` / `生成りに茶` | `letterpress` (活版) |
 * | `celadon` / `青磁` / `青磁に墨` | `blueprint` (図面) |
 *
 * ここでは記法の `theme:` と `palette:`、JSON の `theme` と `palette` の 4 つの入口すべてで、
 * 描かれる意匠と警告の件数と文面を確かめる。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { jsonToDiagram, textDslToDiagram, validateDragonJson, type CompileNotice } from "../src";
import { THEMES, THEME_ALIAS } from "../src/keywords";
import { parseTextDslV05 } from "../src/v05/parser";
import { 外した意匠 } from "../src/v05/removed-syntax";

/**
 * 外すと決めた意匠の名前と置き換え先 (#2960 の表)。
 *
 * **実装の表とは別に書く**。 下の検査は名前ごとに回すので、実装の表から行が消えても
 * この一覧が残っていれば、その名前が受け付けられないことで落ちる。
 */
const 外すと決めた意匠 = {
  kinari: "letterpress",
  生成り: "letterpress",
  生成りに茶: "letterpress",
  celadon: "blueprint",
  青磁: "blueprint",
  青磁に墨: "blueprint",
} as const;

const 外す名前 = Object.keys(外すと決めた意匠) as (keyof typeof 外すと決めた意匠)[];
const 入口の語 = ["theme", "palette"] as const;
/** 名前と書いた語の全ての組。 `it.each` に渡す */
const 組 = 外す名前.flatMap((名前) => 入口の語.map((語) => [名前, 語, 外すと決めた意匠[名前]] as const));

/** 意匠を 3 行目に書いた最小の表の図。 警告が書いた行を指すかを 3 行目で見る */
const 意匠の行 = 3;
const 記法 = (意匠: string, 語: "theme" | "palette"): string =>
  [
    'title: "確かめ"',
    "type: record",
    `${語}: ${意匠}`,
    "",
    "actors:",
    '  - users: { kind: storage, rows: ["id: bigint", "email: text"], marks: ["pk", ""] }',
    '  - orders: { kind: storage, rows: ["id: bigint", "user_id: bigint"], marks: ["pk", "fk"] }',
    "",
    "flow:",
    '  - users -> orders: "注文する"',
    "",
  ].join("\n");

const JSONの図 = (意匠: string, 語: "theme" | "palette") => ({
  title: "確かめ",
  type: "record",
  [語]: 意匠,
  actors: [
    { name: "users", kind: "storage", rows: ["id: bigint", "email: text"], marks: ["pk", ""] },
    { name: "orders", kind: "storage", rows: ["id: bigint", "user_id: bigint"], marks: ["pk", "fk"] },
  ],
  flow: [{ from: "users", to: "orders", label: "注文する" }],
});

/** 外した意匠の警告だけを取り出す */
const 外した意匠の警告 = (notices: readonly CompileNotice[]): CompileNotice[] =>
  notices.filter((n) => n.kind === "theme-removed");

function 記法で組む(意匠: string, 語: "theme" | "palette") {
  const notices: CompileNotice[] = [];
  const diagram = textDslToDiagram(記法(意匠, 語), { onNotice: (n) => notices.push(n) });
  return { diagram, notices };
}

function JSONで組む(意匠: string, 語: "theme" | "palette") {
  const notices: CompileNotice[] = [];
  const diagram = jsonToDiagram(JSONの図(意匠, 語), { onNotice: (n) => notices.push(n) });
  return { diagram, notices };
}

describe("外した意匠の表が決めた一覧と一致する (#2960)", () => {
  it("外した名前と置き換え先", () => {
    expect(外した意匠, "外した意匠の表が removed-syntax.ts に無い").toBeInstanceOf(Map);
    expect(Object.fromEntries(外した意匠)).toEqual(外すと決めた意匠);
  });
});

describe("記法で外した意匠を書くと置き換え先で描く (#2960)", () => {
  it.each(組)("%s を %s: に書くと %s で描く", (名前, 語, 置き換え先) => {
    expect(記法で組む(名前, 語).diagram.palette).toBe(置き換え先);
  });

  it.each(組)("%s を %s: に書くと外した意匠の警告が 1 件出る", (名前, 語) => {
    expect(外した意匠の警告(記法で組む(名前, 語).notices)).toHaveLength(1);
  });

  it.each(組)("%s を %s: に書いた警告は書いた名前と置き換え先 %s を示す", (名前, 語, 置き換え先) => {
    const [警告] = 外した意匠の警告(記法で組む(名前, 語).notices);
    expect(警告?.message, "警告が書いた名前を示していない").toContain(名前);
    expect(`${警告?.message} ${警告?.hint}`, "警告が置き換え先を示していない").toContain(置き換え先);
  });

  it.each(組)("%s を %s: に書いた警告は書いた行を指す", (名前, 語) => {
    expect(外した意匠の警告(記法で組む(名前, 語).notices)[0]?.line).toBe(意匠の行);
  });

  it.each(組)("%s を %s: に書いても誤りにしない", (名前, 語) => {
    expect(parseTextDslV05(記法(名前, 語))).toMatchObject({ ok: true });
  });

  it("大文字で書いた外した意匠も置き換え先で描く", () => {
    // 意匠は大文字小文字を区別せずに読む (`resolveTheme`)。 外した名前だけ区別すると、
    // `Kinari` と書いた人には「読めません」 が出て置き換え先が分からない
    const { diagram, notices } = 記法で組む("Kinari", "theme");
    expect([diagram.palette, 外した意匠の警告(notices).length]).toEqual(["letterpress", 1]);
  });

  it("theme: に残る意匠、palette: に外した意匠を書くと theme: が勝ち、外した意匠の警告も出る", () => {
    // 使われない側でも、外した名前を書いたことは知らせる。 黙って受けると、外した書き方を
    // 警告を返す以外の経路で受け付けることになる
    const 本文 = 記法("blueprint", "theme").replace("theme: blueprint", "theme: blueprint\npalette: kinari");
    const notices: CompileNotice[] = [];
    const diagram = textDslToDiagram(本文, { onNotice: (n) => notices.push(n) });
    expect([diagram.palette, 外した意匠の警告(notices).length]).toEqual(["blueprint", 1]);
  });
});

describe("JSON で外した意匠を書くと記法と同じ警告と描き方になる (#2960)", () => {
  it.each(組)("%s を %s に書くと %s で描く", (名前, 語, 置き換え先) => {
    expect(JSONで組む(名前, 語).diagram.palette).toBe(置き換え先);
  });

  it.each(組)("%s を %s に書くと外した意匠の警告が 1 件出る", (名前, 語) => {
    expect(外した意匠の警告(JSONで組む(名前, 語).notices)).toHaveLength(1);
  });

  it.each(組)("%s を %s に書いた警告の文面は記法と同じ", (名前, 語) => {
    const 文面 = (n: CompileNotice | undefined) => ({ message: n?.message, hint: n?.hint });
    const 記法の警告 = 外した意匠の警告(記法で組む(名前, 語).notices)[0];
    // 両方とも警告が無いと文面が undefined どうしで一致してしまう
    expect(記法の警告, "記法の警告が無く、比べる相手がいない").toBeDefined();
    expect(文面(外した意匠の警告(JSONで組む(名前, 語).notices)[0])).toEqual(文面(記法の警告));
  });

  it.each(組)("%s を %s に書いても検査は誤りにしない", (名前, 語) => {
    expect(validateDragonJson(JSONの図(名前, 語))).toMatchObject({ ok: true });
  });

  it("記法と JSON の図は外した意匠を書いても同じ図になる", () => {
    expect(組.length, "比べる組が無い (検査が空振りしている)").toBe(外す名前.length * 入口の語.length);
    for (const [名前, 語] of 組) {
      expect(JSONで組む(名前, 語).diagram, `${名前} / ${語}`).toEqual(記法で組む(名前, 語).diagram);
    }
  });
});

describe("意匠の一覧から外した 2 つが消えている (#2960)", () => {
  it("THEMES は残る 7 つの意匠だけを持つ", () => {
    expect(THEMES).toEqual(["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"]);
  });

  it("THEME_ALIAS は外した 6 つの名前を持たない", () => {
    expect(Object.keys(THEME_ALIAS).filter((k) => Object.hasOwn(外すと決めた意匠, k))).toEqual([]);
  });

  it("THEME_ALIAS は外した 2 つの意匠へ読み替えない", () => {
    expect(Object.values(THEME_ALIAS).filter((v) => v === ("kinari" as string) || v === ("celadon" as string))).toEqual([]);
  });

  it("公開 schema は外した 2 つの意匠を書かない", () => {
    const schema = readFileSync(fileURLToPath(new URL("../src/schemas/diagram.json", import.meta.url)), "utf8");
    expect(schema.match(/kinari|celadon/g) ?? []).toEqual([]);
  });
});
