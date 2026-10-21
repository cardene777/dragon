/**
 * 記法の語。役割ごとに日本語と英語の語を組で持つ (#2997)。
 *
 * 英語の語は原本の JSON が使う名前に揃え、記法と JSON で覚える語を 1 組にする。
 * 1 つの file の言葉は最初の行の図の種類の語で決まり、読む仕組みと書き戻す仕組みは
 * その言葉の語だけをこの表から引く。
 *
 * 型が組の欠けを止める。原本の JSON の値 (図の種類、運ぶ物、見せ方、名前の側) に語が無い時と、
 * どちらかの言葉の語が無い役割がある時は、型の検査が落ちる。
 */
import type { Carry, Diagram, LabelSide, ViewMode } from "./schema";

export type NotationLang = "ja" | "en";

type Pair = Readonly<Record<NotationLang, string>>;

export const WORDS = {
  /** 最初の行の図の種類 */
  kind: { sequence: { ja: "時系列図", en: "sequence" }, architecture: { ja: "構成図", en: "architecture" } } satisfies Record<Diagram["kind"], Pair>,
  /** 段の見出しより前の行の頭 */
  head: {
    region: { ja: "区画", en: "region" },
    strip: { ja: "帯", en: "strip" },
    view: { ja: "見せ方", en: "view" },
  } satisfies Record<string, Pair>,
  /** 行の終わりの `[<鍵> <値>]` の鍵 */
  attr: {
    color: { ja: "色", en: "color" },
    icon: { ja: "印", en: "icon" },
    region: { ja: "区画", en: "region" },
    label: { ja: "名前", en: "label" },
  } satisfies Record<string, Pair>,
  /** 線の上を走る物 */
  carry: {
    envelope: { ja: "封筒", en: "envelope" },
    tag: { ja: "札", en: "tag" },
    coin: { ja: "硬貨", en: "coin" },
    none: { ja: "なし", en: "none" },
  } satisfies Record<Carry["kind"], Pair>,
  /** 見せ方の値 */
  view: { fixed: { ja: "止める", en: "fixed" }, follow: { ja: "寄る", en: "follow" } } satisfies Record<ViewMode, Pair>,
  /** 線の名前を置く側 */
  side: {
    above: { ja: "上", en: "above" },
    below: { ja: "下", en: "below" },
    left: { ja: "左", en: "left" },
    right: { ja: "右", en: "right" },
  } satisfies Record<LabelSide, Pair>,
} as const;

export type WordGroup = keyof typeof WORDS;

/** `group` の役割の `value` を、`lang` の言葉の語にする */
export function wordOf<G extends WordGroup>(group: G, value: keyof (typeof WORDS)[G], lang: NotationLang): string {
  return ((WORDS[group] as Record<string, Pair>)[value as string] as Pair)[lang];
}

/** `lang` の言葉の語 `word` が、`group` のどの値を指すか。語でなければ `undefined` */
export function valueOf<G extends WordGroup>(group: G, word: string, lang: NotationLang): keyof (typeof WORDS)[G] | undefined {
  const found = Object.entries(WORDS[group] as Record<string, Pair>).find(([, pair]) => pair[lang] === word);
  return found?.[0] as keyof (typeof WORDS)[G] | undefined;
}

export const otherLang = (lang: NotationLang): NotationLang => (lang === "ja" ? "en" : "ja");

/** 記法の最初の行 (空行とコメントの行を除く) の図の種類の語から、言葉を決める。決まらなければ `undefined` */
export function languageOf(headLine: string): NotationLang | undefined {
  const first = headLine.trim().split(/\s+/)[0] ?? "";
  return (["ja", "en"] as const).find((lang) => valueOf("kind", first, lang) !== undefined);
}

/** 記法の言葉。最初の行の図の種類の語で決まり、決まらなければ `undefined` */
export function notationLanguage(notation: string): NotationLang | undefined {
  const head = notation
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line !== "" && !line.startsWith("//"));
  return head === undefined ? undefined : languageOf(head);
}
