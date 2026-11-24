/**
 * 押すと出る札のブロックの読み方 (#3877)。印は図の種類の行と箱の行の属性で、図の種類の行は記法を読む処理 (`parser.ts`) が `noteModeOf` で、
 * 箱の行の `example` は箱のブロック (`box/read.ts`) が読み、書き戻しも同じ所が受け持つ。ここは 2 つの読み方が使う誤りの文を持つ
 */
import { type BlockReading, none } from "../block";
import type { Messages } from "../../messages";
import { type Attr, fail, isOneOf, list } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { NOTE_MODES, type NoteMode } from "./block";

export interface PopMessages {
  /** 図の1行目の `note` に `pop` と `under` の外の値を書いた */
  badNoteMode: string;
  /** 札で見せない図の箱か、札で見せる図の `note` を持たない箱に `example` を書いた */
  exampleWithoutPop: string;
}

/** 図の1行目の `note` の値。書かない時は `undefined`。`pop` と `under` の外の値は、1 行目の `note` の所を指して断る */
export function noteModeOf(head: SourceLine, attr: Attr | undefined, m: Messages): NoteMode | undefined {
  if (attr && !isOneOf(NOTE_MODES, attr.value)) throw fail(head, attr.at, m.badNoteMode);
  return attr?.value as NoteMode | undefined;
}

export const reading: BlockReading<PopMessages> = {
  read: none("札の印は図の種類の行と箱の行の属性で、記法を読む処理と箱のブロックが行と一緒に読む"),
  print: none("札の印は、図の種類の行と箱の宣言を書き戻す処理がその行の属性として書き戻す"),
  messages: {
    ja: {
      badNoteMode: `1 行目の note は ${list(NOTE_MODES)} のどれか。pop は箱の説明を押すと出る札で、under は名前の下の字で見せる`,
      exampleWithoutPop: "example は 1 行目に [note: pop] を書いた図の、note を持つ箱にだけ書ける。札の下の例の帯になる",
    },
    en: {
      badNoteMode: `note on the first line is one of ${list(NOTE_MODES)}. pop shows a box's note on a card that opens on a click, and under shows it under the name`,
      exampleWithoutPop: "example can be written only on a box with note in a diagram whose first line has [note: pop]. It becomes the example band of the card",
    },
  },
};
