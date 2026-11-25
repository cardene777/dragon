/**
 * HTMLの形を読めない時の誤りの文 (#3908)。要素の名前は`<dg-box>`の形で書き、書ける名前を並べて、直す所を名指す。
 */
import type { NotationLang } from "../words";

export interface FormMessages {
  /** `parent`の中に書けない要素。`allowed`は書ける要素の名前を`, `でつないだ字 */
  unknownElement(name: string, parent: string, allowed: string): string;
  /** `element`が持てない属性。`allowed`は持てる属性の名前を`, `でつないだ字 */
  unknownAttribute(name: string, element: string, allowed: string): string;
  /** 属性か字の値が、書ける形でない。`expected`は書ける形の言い方 */
  badValue(name: string, element: string, value: string, expected: string): string;
  /** 字を持てない要素に字を書いた */
  noText(element: string): string;
  /** `/>`で閉じたつもりの要素 */
  selfClosed(element: string): string;
  /** 鍵を持つ表の1つの要素に、属性`key`が無い */
  noKey(element: string): string;
  /** 1つだけ書ける要素を2つ書いた */
  twice(element: string): string;
  /** HTMLの形の図が無い */
  noFigure: string;
  /** `<dragon-page>`が無い */
  noPage: string;
  /** 読んだ原本を記法へ書き戻せない */
  cannotPrint(detail: string): string;
  /** 値の形の言い方 */
  kinds: { s: string; i: string; n: string; b: string; or: string };
}

export const FORM_MESSAGES: Record<NotationLang, FormMessages> = {
  ja: {
    unknownElement: (name, parent, allowed) => `<${name}> は <${parent}> の中に書けない。書ける要素: ${allowed}`,
    unknownAttribute: (name, element, allowed) => `<${element}> は属性 ${name} を持てない。持てる属性: ${allowed}`,
    badValue: (name, element, value, expected) => `<${element}> の ${name} の値 ${value} は${expected}で書く`,
    noText: (element) => `<${element}> は字を持てない。字は子の要素か属性に書く`,
    selfClosed: (element) => `<${element}/> は閉じない。</${element}> で閉じる`,
    noKey: (element) => `<${element}> は属性keyに鍵を書く`,
    twice: (element) => `<${element}> は1つだけ書ける`,
    noFigure: "<dg-<図の種類>> の図が無い",
    noPage: "<dragon-page> の頁が無い",
    cannotPrint: (detail) => `記法に書き戻せない: ${detail}`,
    kinds: { s: "字", i: "整数", n: "数", b: "trueかfalse", or: "か" },
  },
  en: {
    unknownElement: (name, parent, allowed) => `<${name}> cannot go inside <${parent}>. Elements allowed here: ${allowed}`,
    unknownAttribute: (name, element, allowed) => `<${element}> cannot have the attribute ${name}. Attributes it can have: ${allowed}`,
    badValue: (name, element, value, expected) => `Write ${name} of <${element}> as ${expected}, not ${value}`,
    noText: (element) => `<${element}> cannot hold text. Write it in a child element or an attribute`,
    selfClosed: (element) => `<${element}/> does not close the element. Close it with </${element}>`,
    noKey: (element) => `Write the key of <${element}> in the attribute key`,
    twice: (element) => `Write <${element}> only once`,
    noFigure: "No <dg-<kind>> diagram",
    noPage: "No <dragon-page> page",
    cannotPrint: (detail) => `Cannot write the notation back: ${detail}`,
    kinds: { s: "text", i: "a whole number", n: "a number", b: "true or false", or: " or " },
  },
};
