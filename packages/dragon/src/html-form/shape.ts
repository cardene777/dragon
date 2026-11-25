/**
 * HTMLの形の要素と属性の名前の決まり (#3908)。
 *
 * HTMLの形は記法の1行を1つの要素で書き、図を`<dg-<種類>>`で包む。要素と属性の名前は原本のJSONの欄の名前から作る。
 * 決まりは原本の形 (`diagram.schema.json`) からbuildの時に名前の表 (`vocabulary.ts`) へ書き出し、変換の処理は表だけを読む。
 * 記法に語を足すと原本の形に欄が増え、次のbuildで表にも同じ名前が増えるので、種類ごと語ごとに対応を手で書かない。
 *
 * 名前の作り方は次の通り。
 * - 物は要素になり、字と数と真偽の欄は属性になる。図の宣言 (`blocks`) の並びは図の要素の直ぐ下に、ブロックの名前の要素で並ぶ
 * - 並びの1つずつは欄の名前を1つの形にした要素 (`steps`は`dg-step`) になり、`type`で分ける並び (段の中で起きること) は`type`の値の要素 (`dg-edge`) になる
 * - 字と数と真偽だけを持つ1つの物 (線の運ぶ物の`carry`) は、`<欄>-<中の欄>`の属性 (`carry-kind`) に平らに書く
 * - 名前、線の名前、札の字 (`name`、`label`、`text`) は、子の要素を持たない要素の字に書く
 * - 記法で行を分けて書く字 (段の語りの`body`と命令の`code`) は、その名前の子の要素 (`dg-body`) の字に書く
 * - 鍵を持つ表の1つずつは、属性`key`に鍵を持つ要素になる
 * - 同じ所に同じ名前の要素が2つできる時は、並びの欄は1つの形にせず欄の名前のままにする
 * - HTMLは要素と属性の名前の大文字を小文字に読むので、大文字を含む欄の名前は`-`でつないだ小文字にする (`labelSide`は`label-side`)
 */

/** 図と図の部品の要素の名前の頭 */
export const PREFIX = "dg-";

/** HTMLの頁の要素の名前 */
export const PAGE_TAG = "dragon-page";

/** 子の要素を持たない要素の字に書く欄。前に在る欄を選ぶ */
export const TEXT_FIELDS: readonly string[] = ["name", "label", "text"];

/** 記法で行を分けて書く字の欄。その名前の子の要素の字に書く */
export const LINE_FIELDS: readonly string[] = ["body", "code"];

/** 鍵を持つ表の1つずつの要素が、鍵を持つ属性 */
export const KEY_ATTR = "key";

/**
 * 字と数と真偽の値の形。`s`は字、`i`は整数、`n`は数、`b`は真偽で、2つ以上を持つ値はどれでも書ける。
 * 属性の字は、真偽を書ける時は`true`と`false`を、整数か数を書ける時は数の形の字を数に読み、ほかは字のまま読む
 */
export type Kinds = string;

/** 子の要素が表す値。物は要素の形の番号、字と数と真偽は値の形、並びは中の1つずつの値 (中の要素も同じ名前) */
export interface Value {
  e?: number;
  s?: Kinds;
  x?: Value;
}

/** 子の要素と、それが埋める原本の欄 */
export interface Kid extends Value {
  /** 埋める欄の道。図の宣言は`["blocks", <ブロックの名前>]` */
  f: string[];
  /** `item`は並びの1つ、`one`は1つだけの物か字、`entry`は鍵を持つ表の1つ */
  h: "item" | "one" | "entry";
  /** `type`で分ける並びの1つの時、`type`の値 */
  v?: string;
}

/** 1つの物を表す要素の形 */
export interface ElementShape {
  /** 属性の名前と値の形 */
  a: Record<string, Kinds>;
  /** 欄の名前と違う名前の属性 (平らに書いた`carry-kind`と、小文字にした`label-side`) の、原本の欄の道 */
  p?: Record<string, string[]>;
  /** 子の要素を持たない時に要素の字に書く欄 */
  t?: string;
  /** 子の要素の名前 (`dg-`を外した字) と、それが埋める欄 */
  c: Record<string, Kid>;
  /** 欠かせない欄 */
  r?: string[];
}

/** 名前の表 */
export interface Vocabulary {
  /** 図の種類。図の要素は`dg-<種類>` */
  kinds: string[];
  /** 図の要素の形の番号 */
  root: number;
  shapes: ElementShape[];
}

/** 大文字を含む欄の名前を、HTMLの名前の`-`でつないだ小文字にする。`labelSide`は`label-side` */
export const kebab = (name: string): string => name.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);

/** 英語の複数の語を1つの形にする。`steps`は`step`、`axes`は`axis`、`children`は`child`。ほかの語はそのまま */
export function singular(word: string): string {
  if (word === "children") return "child";
  if (word.endsWith("axes")) return `${word.slice(0, -4)}axis`;
  if (word.endsWith("ies") && word.length > 3) return `${word.slice(0, -3)}y`;
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 1) return word.slice(0, -1);
  return word;
}
