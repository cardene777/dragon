/**
 * 描く部品が出す字 (#3001)。
 *
 * 図の原本は語を持たないので、呼ぶ側が言葉を渡す。渡さなければ日本語で出す。
 * 頁は頁の言葉を、`dragon export` は `--lang` の言葉 (渡さなければ日本語) を渡す。
 */
import type { NotationLang } from "./words";

export interface FigureText {
  /** 描けない時の断りの文。`detail` は誤りの場所と文を並べた物 */
  cannotDraw: (detail: string) => string;
  /** 描く設定の `colors` (#3198) の誤り。色味に無い色の名前と、色の値として読めない値の色の名前 */
  unknownColor: (name: string) => string;
  unreadableColor: (name: string) => string;
  /** 寄って動かす見せ方の、隅の全体図の札 */
  overview: string;
  /** 再生の釦の読み上げの名前 */
  prev: string;
  pause: string;
  play: string;
  next: string;
  /** 段の一覧の読み上げの名前 */
  steps: (title: string) => string;
  /** 状態遷移図の脇道の囲みの名前と添え書き (#3163)。添え書きの 2 行目は脇道へ入れる状態の数を言う (#3171) */
  side: string;
  sideNote: string;
  sideFrom: (count: number) => string;
  /** 状態遷移図の帯の最後の、通った状態の欄の名前 (#3171) */
  trail: string;
  /** 状態遷移図の始まりと終わりの印の字 */
  start: string;
  end: string;
  /** 字の重なりを知らせる文 (#3178)。段の番号の呼び方、字の囲み方、2 つの字の重なり、線が字を横切る所 */
  badgeName: (no: string) => string;
  quoted: (text: string) => string;
  /** 書き手が書いていない図の部品の呼び方 (#3184)。箱 `box` の絵柄と、運ぶ物の硬貨と封筒 */
  iconOf: (box: string) => string;
  coin: string;
  envelope: string;
  textsOverlap: (a: string, b: string) => string;
  lineCrosses: (from: string, to: string, text: string) => string;
}

/** 英数字で終わる語の後ろに空白を置く。「段の番号 1 と」のように、数と仮名の間を空けて読みやすくする */
const spaced = (word: string): string => (/[0-9A-Za-z]$/u.test(word) ? `${word} ` : word);
/** 英語の文の頭を大文字にする */
const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const FIGURE_TEXT: Record<NotationLang, FigureText> = {
  ja: {
    cannotDraw: (detail) => `図を描けない: ${detail}`,
    unknownColor: (name) => `colors の ${name} は色味に無い色の名前`,
    unreadableColor: (name) => `colors の ${name} の値を色として読めない`,
    overview: "全体図",
    prev: "前の段",
    pause: "止める",
    play: "動かす",
    next: "次の段",
    steps: (title) => `${title} の段`,
    side: "脇道",
    sideNote: "今回は通らない",
    sideFrom: (count) => `${count} つの状態から入れる`,
    trail: "通った状態",
    start: "始まり",
    end: "終わり",
    badgeName: (no) => `段の番号 ${no}`,
    quoted: (text) => `「${text}」`,
    iconOf: (box) => `「${box} の絵柄」`,
    coin: "「硬貨」",
    envelope: "「封筒」",
    textsOverlap: (a, b) => `${spaced(a)}と${spaced(b)}が重なる`,
    lineCrosses: (from, to, text) => `線 ${from} → ${to} が${spaced(text)}を横切る`,
  },
  en: {
    cannotDraw: (detail) => `Cannot draw the diagram: ${detail}`,
    unknownColor: (name) => `colors.${name} is not a color name of the palette`,
    unreadableColor: (name) => `colors.${name} cannot be read as a color`,
    overview: "Overview",
    prev: "Previous step",
    pause: "Pause",
    play: "Play",
    next: "Next step",
    steps: (title) => `Steps of ${title}`,
    side: "Side path",
    sideNote: "Not taken this time",
    sideFrom: (count) => `Enterable from ${count} ${count === 1 ? "state" : "states"}`,
    trail: "States passed",
    start: "Start",
    end: "End",
    badgeName: (no) => `step number ${no}`,
    quoted: (text) => `"${text}"`,
    iconOf: (box) => `the icon of "${box}"`,
    coin: "the coin",
    envelope: "the envelope",
    textsOverlap: (a, b) => capital(`${a} and ${b} overlap`),
    lineCrosses: (from, to, text) => `The line ${from} → ${to} crosses ${text}`,
  },
};
