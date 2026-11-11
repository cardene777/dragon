/**
 * 見本帳が最初に読む script から、英語の画面の字と最初の見本 3 枚の英語の記法と、編集画面の棚の雛形を外して後から読む (#3646)。
 *
 * 最初に読む script は、build した頁の `index.html` が名指す script (`firstLoadFiles`)。
 * 「最初の script が持たない」検査は、移した物だけが持つ語が最初の script に無く、移した先の塊に在ることを見る。
 * 移した先の塊は、移した先の file の名前で始まる後から読む塊 (英語の塊は `english-<hash>.js`、棚の雛形は `shelf-items-<hash>.js`)。
 * 「後から読むと同じ物を返す」検査は、後から読む口が返す値を、同じ元 (見本の file、字の定義、棚の部品の定義) から直に作った値と比べる。値は検査に写さない。
 * 英語で開いた頁の検査は、頁を開く言葉を決める口 (`openLang`) と言葉を替える口 (`langChanger`) が、英語の字が届くまで描く処理へ言葉を渡さないことを見る。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { LATER_KINDS, loadKind, parseNotation } from "@cardenelabs/dragon/light";
import { describe, expect, it, vi } from "vitest";

import { BLOCK_ORDER, BLOCK_SHELF, BLOCK_TEXT } from "../catalog/blocks.gen";
import type { Lang } from "../text";
import { builtDir, firstLoadFiles, root } from "./playground-support";

/** 最初の画面の見本。日本語は最初の script に残し、英語だけを後から読む */
const FIRST_SCREEN = ["intro", "oauth", "ccip"] as const;
const LANGS: readonly Lang[] = ["ja", "en"];
const EXAMPLES = join(root, "packages/dragon/examples");
const exampleFile = (key: string, lang: Lang): string => readFileSync(join(EXAMPLES, lang === "ja" ? `${key}.dragon` : `${key}.en.dragon`), "utf8").trimEnd();

/** 英語の画面の字だけが持つ 1 文。概要の頁の見出しの下の文 */
const ENGLISH_SENTENCE = "Diagrams you gave up on because the template could not hold them now build themselves from plain text.";
/** 最初の見本 3 枚の英語の記法だけが持つ 1 行。OAuth の見本の 2 段目の語り */
const ENGLISH_EXAMPLE_LINE = "  say The app makes a one-time code_verifier and uses its SHA-256 as the code_challenge. It also makes a state to recognise the return trip and keeps it.";
/** 棚の雛形だけが持つ語。記法の早見の出典の行に置く穴の英語の名前 */
const SHELF_WORD = "source name";

/** 字の並びが script の中で取りうる形。build は字の並びをそのままか、`"` の囲みの中の書き方で書く */
const plainForms = (word: string): string[] => [word, JSON.stringify(word).slice(1, -1)];
/** 1 つの値として書いた字の並びの形。引用符の 3 通りの囲みのどれか */
const quotedForms = (word: string): string[] => [`"${word}"`, `'${word}'`, `\`${word}\``];

const assets = (): string => join(builtDir(), "assets");
const readAsset = (name: string): string => readFileSync(join(assets(), name), "utf8");

/**
 * `word` が最初に読む script に無く、移した先の塊 (`<chunk>-<hash>.js`) に在ることを確かめる。
 * 最初の script が空の時と、移した先の塊が語を持たない時は、走査の空振りとして落とす
 */
function expectMoved(word: string, chunk: string, label: string, formsOf: (word: string) => string[]): void {
  const first = firstLoadFiles(builtDir()).filter((name) => name.endsWith(".js"));
  const firstCode = first.map(readAsset).join("\n");
  expect(firstCode.length, "build した頁が最初に読む script が無い (走査の空振り)").toBeGreaterThan(0);
  const forms = formsOf(word);
  expect(
    forms.some((form) => firstCode.includes(form)),
    `最初に読む script が${label}を持つ (${word.trim().slice(0, 48)})`,
  ).toBe(false);
  const named = new RegExp(`^${chunk}-[\\w-]+\\.js$`, "u");
  const moved = readdirSync(assets()).filter((name) => named.test(name) && !first.includes(name));
  expect(moved, `${label}を移した先の後から読む塊 (${chunk}-<hash>.js)`).toHaveLength(1);
  expect(
    forms.some((form) => readAsset(moved[0] ?? "").includes(form)),
    `移した先の塊 ${moved[0]} が${label}の語を持たない (走査の空振り)`,
  ).toBe(true);
}

/** 約束の事が進むのを待つ。待つ間に届いた結果を受け取る処理を先に回す */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** 外から届いた時を決められる約束 */
function deferred(): { promise: Promise<void>; arrive: () => void } {
  let arrive = (): void => undefined;
  const promise = new Promise<void>((resolve) => {
    arrive = resolve;
  });
  return { promise, arrive };
}

/** 頁の言葉の字と見本を、ほかの検査が読んだ塊を持ち越さない新しい写しで読む */
async function fresh(): Promise<{ text: typeof import("../text"); examples: typeof import("../examples") }> {
  vi.resetModules();
  const text = await import("../text");
  const examples = await import("../examples");
  return { text, examples };
}

/** 日本語の字 (ひらがな、カタカナ、漢字) */
const JAPANESE = /[぀-ヿ㐀-鿿]/u;

describe("最初に読む script から英語の字と見本と棚の雛形を外す (#3646)", () => {
  it("first-load-carries-no-english-text", () => {
    expectMoved(ENGLISH_SENTENCE, "english", "英語の画面の字", plainForms);
  });

  it("first-load-carries-no-english-examples", () => {
    // 選んだ行が英語の見本の file から消えると、最初の script に無いことが何も確かめなくなる
    expect(readFileSync(join(EXAMPLES, "oauth.en.dragon"), "utf8").split("\n"), "選んだ行が OAuth の英語の見本の file に無い").toContain(ENGLISH_EXAMPLE_LINE);
    expectMoved(ENGLISH_EXAMPLE_LINE, "english", "最初の見本の英語の記法", plainForms);
  });

  it("first-load-carries-no-shelf-templates", () => {
    expectMoved(SHELF_WORD, "shelf-items", "編集画面の棚の雛形", quotedForms);
  });
});

describe("後から読むと、分ける前と同じ物を返す (#3646)", () => {
  it("later-english-text-matches", async () => {
    const { text } = await fresh();
    expect(() => text.TEXT.en, "英語の字が届く前から英語の字の表を読める").toThrow();
    expect(typeof text.whenText, "英語の字を後から読む口 (`whenText`) が無い").toBe("function");
    await text.whenText("en");
    const english = await import("../english").then(
      (loaded) => loaded,
      () => undefined,
    );
    expect(english, "英語の字の定義 (`english.ts`) が無い").toBeDefined();
    expect(text.TEXT.en, "後から読んだ英語の字が、英語の字の定義と違う").toEqual(english?.EN_TEXT);
    // 部品の名前と棚の部品の名前は、ブロックの見本帳の分の英語の名前から直に作った物と同じ
    expect(text.TEXT.en.site.catalog.parts, "後から読んだ英語の部品の名前").toEqual(Object.fromEntries(Object.entries(BLOCK_TEXT).map(([name, names]) => [name, names.en])));
    const shelfNames = BLOCK_ORDER.flatMap((name) => {
      const shelf: Readonly<Record<string, Readonly<Record<Lang, string>>>> | { none: string } = BLOCK_SHELF[name];
      return "none" in shelf ? [] : Object.entries(shelf).map(([id, part]) => [id, part.en] as const);
    });
    expect(shelfNames.length, "棚の部品の名前を数えられない").toBeGreaterThan(0);
    expect(text.TEXT.en.shelf.parts, "後から読んだ英語の棚の部品の名前").toEqual(Object.fromEntries(shelfNames));
  });

  it("later-english-examples-match", async () => {
    const { text, examples } = await fresh();
    for (const key of FIRST_SCREEN) {
      expect(examples.exampleText(key, "en"), `英語の字が届く前から英語の見本 ${key} を持つ`).toBeUndefined();
      // 日本語の見本は待たずに出す
      expect(examples.firstScreenText(key, "ja"), `日本語の見本 ${key} が見本の file と違う`).toBe(exampleFile(key, "ja"));
    }
    expect(typeof text.whenText, "英語の字を後から読む口 (`whenText`) が無い").toBe("function");
    await text.whenText("en");
    for (const key of FIRST_SCREEN) {
      expect(examples.firstScreenText(key, "en"), `後から読んだ英語の見本 ${key} が見本の file と違う`).toBe(exampleFile(key, "en"));
      expect(examples.exampleText(key, "en"), `後から読んだ英語の見本 ${key} の記法`).toBe(exampleFile(key, "en"));
    }
  });

  it("later-shelf-items-match", async () => {
    const first = await import("../editor/shelf-first").then(
      (loaded) => loaded,
      () => undefined,
    );
    expect(first?.LATER_SHELF, "棚の雛形を後から読む塊 (`LATER_SHELF`) が無い").toBeDefined();
    const later = await import("../site/later");
    expect(typeof later.whenReady, "後から読む塊が届くのを待つ口 (`whenReady`) が無い").toBe("function");
    if (!first) return;
    const templates = await later.whenReady(first.LATER_SHELF);
    // 棚の雛形は全ての種類の図を書き戻して作るので、棚と同じく全ての種類の塊を待つ
    await Promise.all(LATER_KINDS.map((kind) => loadKind(kind)));
    const direct = await import("../editor/shelf-items");
    // 部品の並びは、ブロックの並びとブロックの見本帳の分の棚の鍵から直に作った並び
    const ids = BLOCK_ORDER.flatMap((name) => {
      const shelf: Readonly<Record<string, unknown>> | { none: string } = BLOCK_SHELF[name];
      return "none" in shelf ? [] : Object.keys(shelf);
    });
    expect(ids.length, "棚の部品を数えられない").toBeGreaterThan(0);
    expect(templates.PART_IDS, "後から読んだ棚の部品の並び").toEqual(ids);
    const read = parseNotation(exampleFile("oauth", "ja"));
    expect(read.ok, "部品を足す先の見本が読めない").toBe(true);
    if (!read.ok) return;
    for (const lang of LANGS) {
      const parts = direct.PART_IDS.map((id) => {
        const added = direct.partLines(id, read.diagram, lang);
        return { id, lines: [...added.declarations, ...added.steps] };
      });
      expect(templates.partEntries(read.diagram, lang), `後から読んだ棚の部品の行 (${lang})`).toEqual(parts);
      const syntax = direct.syntaxLines(lang);
      expect(syntax.length, `記法の早見の行を数えられない (${lang})`).toBeGreaterThan(0);
      expect(templates.syntaxLines(lang), `後から読んだ記法の早見の行 (${lang})`).toEqual(syntax);
    }
  });
});

describe("英語の字が届くまで描かない (#3646)", () => {
  it("english-page-waits-for-english-text", async () => {
    const { text } = await fresh();
    // 届く前の英語の字は読めない。日本語の字で代えて描くことは無い
    expect(() => text.TEXT.en, "英語の字が届く前から英語の字の表を読める").toThrow();
    expect(typeof text.openLang, "頁を開く言葉を決める口 (`openLang`) が無い").toBe("function");
    expect(typeof text.langChanger, "言葉を替える口 (`langChanger`) が無い").toBe("function");

    // 英語で開く頁は、英語の字が届くまで描く言葉を返さない。日本語は待たずに返す
    const opening = deferred();
    let opened: Lang | undefined;
    void text.openLang("en", () => opening.promise).then((lang) => {
      opened = lang;
    });
    await settle();
    expect(opened, "英語の字が届く前に頁を描く言葉を返した").toBeUndefined();
    opening.arrive();
    await settle();
    expect(opened, "英語の字が届いた後に頁を描く言葉").toBe("en");
    expect(await text.openLang("ja", () => new Promise<void>(() => undefined)), "日本語の頁が字を待った").toBe("ja");
    // 英語の字を読めなかった時は、描かずに止めず日本語で開く
    expect(await text.openLang("en", () => Promise.reject(new Error("読めない"))), "英語の字を読めなかった時に開く言葉").toBe("ja");

    // 言葉を英語に替える時も、英語の字が届くまで替えない
    const switching = deferred();
    const applied: Lang[] = [];
    const change = text.langChanger(
      (lang) => applied.push(lang),
      (lang) => (lang === "en" ? switching.promise : Promise.resolve()),
    );
    change("en");
    await settle();
    expect(applied, "英語の字が届く前に言葉を英語に替えた").toEqual([]);
    switching.arrive();
    await settle();
    expect(applied, "英語の字が届いた後に替えた言葉").toEqual(["en"]);
    // 英語を待つ間に日本語へ戻したら、遅れて届いた英語で替え直さない
    const late = deferred();
    const back: Lang[] = [];
    const changeBack = text.langChanger(
      (lang) => back.push(lang),
      (lang) => (lang === "en" ? late.promise : Promise.resolve()),
    );
    changeBack("en");
    changeBack("ja");
    await settle();
    late.arrive();
    await settle();
    expect(back, "英語を待つ間に日本語へ戻した時に替えた言葉").toEqual(["ja"]);

    // 本物の英語の塊で開くと、届いた英語の字の表は日本語の字を持たない
    expect(await text.openLang("en"), "英語の塊で開いた頁の言葉").toBe("en");
    expect(JSON.stringify(text.TEXT.en), "英語の字の表に日本語の字が混ざる").not.toMatch(JAPANESE);
  });
});
