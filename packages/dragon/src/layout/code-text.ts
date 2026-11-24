/**
 * 英語の字をコードとして等幅で描くかの決まり。
 * 線の札 (#3850) と図の下の値の欄 `strip` の値 (#3856) で同じ決まりを使う。
 */
import { type TextStyle, TYPE } from "../look/values";
import { hasWide, textWidth } from "./measure";

/** 全体を backtick で囲んだ字。印の無いコマンド (`git rebase main`) や枝の名前 (`main`) も等幅で描くために書き手が囲む (#3850、#3856) */
const BACKTICKED = /^`([^`]+)`$/u;

/**
 * コードの印 (#3850)。括弧と記号、英字が続く `/` (`GET /me`)、`0x` で始まる値、語の中の大文字
 * (`sendRawTransaction`、`CCIPMessageSent`)、英字の間の `.`、`-` で始まる引数、2 字以上の大文字で始まる語
 * (`SELECT orders`)、数で始まる字 (`200 OK`、`15%`)。
 * 値の欄の hash と版と道を見分けるため、英字と数字が混ざる 3 字以上の語 (`8b04f71`、`e5f8`、`tx3`)、途中で切った字 (`Splx…`)、
 * `v` で始まる版 (`v2.4.0`)、英字と数に挟まれた `/` (`m/44'/60'`) を足す (#3856)。
 * 線の札の数 (`send 0.05 WETH`、`passed 2/3`) は地の文のままにするため、版は `v` で始まる物に、道は `/` の前が英字の物に限る。
 * どれも持たない字は英語の地の文にする
 */
const CODE_SIGNS = [
  /[()[\]{}<>=_\\:;`#$@|&*]/u,
  /\/[A-Za-z]/u,
  /0x[0-9a-fA-F]/u,
  /[a-z][A-Z]/u,
  /[A-Za-z]\.[A-Za-z]/u,
  /(?:^|\s)--?[a-z]/u,
  /^[A-Z]{2,}(?:\s|$)/u,
  /^[+-]?\d/u,
  /(?<![A-Za-z0-9])(?=[0-9a-z]*\d)(?=[0-9a-z]*[a-z])[0-9a-z]{3,}(?![A-Za-z0-9])/u,
  /…/u,
  /(?<![A-Za-z0-9])v\d+\.\d/u,
  /[A-Za-z]\/\d/u,
];

/** 描く字。backtick の囲みは描かない (#3850) */
export const plainText = (text: string): string => BACKTICKED.exec(text)?.[1] ?? text;

/** backtick で囲んだか、コードの印を持つ字か (#3850、#3856)。日本語を含むかは呼ぶ側が先に見る */
export const isCodeText = (text: string): boolean => BACKTICKED.test(text) || CODE_SIGNS.some((sign) => sign.test(text));

/**
 * 値の欄 `strip` の値の字 (#3856)。コードの値は等幅の字 (`fieldValue`) で、英語の地の文の値は日本語の値と同じ字
 * (`fieldValueJa`) で描く。等幅の字は和文を持たないので、日本語を含む値は印があっても `fieldValueJa` で描く
 */
export const valueStyle = (value: string): TextStyle => (!hasWide(value) && isCodeText(value) ? TYPE.fieldValue : TYPE.fieldValueJa);

/** 値の欄の値の幅。囲みを外した字を、描く字で測る (#3856) */
export const valueWidth = (value: string): number => textWidth(plainText(value), valueStyle(value));
