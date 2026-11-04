/**
 * 描く部品が出す字 (#3001)。
 *
 * 図の原本は語を持たないので、呼ぶ側が言葉を渡す。渡さなければ英語で出す (#3338)。
 * 頁は頁の言葉を、`dragon export` は `--lang` の言葉 (渡さなければ英語) を渡す。
 */
import type { NotationLang } from "./words";

export interface FigureText {
  /** 描けない時の断りの文。`detail` は誤りの場所と文を並べた物 */
  cannotDraw: (detail: string) => string;
  /** 軽い入口で読んでいない種類を描いた時の誤り (#3248) */
  kindNotLoaded: (kind: string) => string;
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
  /**
   * 時間軸の図 (#3165)。時刻の字の単位、拡大の帯の名前、目盛りの番号の範囲の書き方、列の上の目盛りの番号と時刻の間、
   * 空きの目盛りの枠の字
   */
  timeUnits: Record<"ms" | "s" | "min" | "h" | "d", string>;
  zoom: string;
  range: (from: string, to: string) => string;
  headJoin: string;
  empty: string;
  /**
   * 列の図の卓の形 (#3351)。札と置き場の名前の下の字、選んだ札の印、封の字、「この先」の帯の字、空の置き場の字。
   * 札の下の一言は、色付きのチップの席の番号、置き場に無かったチップを足したこと、置き場に在った色付きのチップが無いことを言う
   */
  lineupInOrder: string;
  lineupNoOrder: string;
  lineupPicked: string;
  lineupSealed: string;
  lineupAhead: string;
  lineupEmpty: string;
  lineupAt: (name: string, n: number) => string;
  lineupAdded: (names: string[]) => string;
  lineupMissing: (name: string) => string;
  /**
   * 試す図 (#3337)。ブロックの番号の字、待ち行列の取り出し方 (釦が上から何件を取り出すか)、畳んだ古いブロックの数。
   * prev と hash と SHA-256 は語の名前のまま、どちらの言葉でも書き換えない
   */
  tryBlock: (n: number) => string;
  tryTakes: (n: number) => string;
  tryFolded: (n: number) => string;
  /**
   * 試す図の再生の部品 (#3337)。入力の帯と書き換える欄の読み上げの名前、送る釦と決める釦と閉じる釦の字、書き換える欄の名前。
   * 押せない訳は、満杯の待ち行列へ送れないこと、空の待ち行列から取り出せないこと、空の欄、チップの名前に使えない字、空の書き換え。
   * 読み手が足した段の題と本文は、送った、釦を押した、書き換えたの 3 つ
   */
  tryAsk: string;
  tryEditForm: string;
  trySend: string;
  tryApply: string;
  tryClose: string;
  tryEditField: (item: string, field: string) => string;
  tryFull: (queue: string, most: number) => string;
  tryEmpty: (queue: string, press: string) => string;
  tryBlank: string;
  tryBadName: (field: string) => string;
  tryBlankEdit: string;
  trySent: (name: string) => string;
  trySentBody: (name: string, into: string, via?: string) => string;
  tryPressed: (press: string) => string;
  tryPressedBody: (count: number, from: string, block: number) => string;
  tryEdited: (item: string, field: string) => string;
  tryEditedBody: (field: string, from: string, to: string) => string;
}

/** 英数字で終わる語の後ろに空白を置く。「段の番号 1 と」のように、数と仮名の間を空けて読みやすくする */
const spaced = (word: string): string => (/[0-9A-Za-z]$/u.test(word) ? `${word} ` : word);
/** 英数字で始まる語の前に空白を置く。仮名の後ろに続く英数字の語を離す */
const led = (word: string): string => (/^[0-9A-Za-z]/u.test(word) ? ` ${word}` : word);
/** 仮名の間に置く語。英数字の端だけを空白で離す */
const inner = (word: string): string => spaced(led(word));
/** 英語の文の頭を大文字にする */
const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const FIGURE_TEXT: Record<NotationLang, FigureText> = {
  ja: {
    cannotDraw: (detail) => `図を描けない: ${detail}`,
    kindNotLoaded: (kind) => `${kind} の図の部品を読んでいない。描く前に loadKind を待つ`,
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
    timeUnits: { ms: "ミリ秒", s: "秒", min: "分", h: "時間", d: "日" },
    zoom: "拡大",
    range: (from, to) => `${from}〜${to}`,
    headJoin: " ・ ",
    empty: "空き",
    lineupInOrder: "上から実行",
    lineupNoOrder: "順番なし",
    lineupPicked: "選ばれる",
    lineupSealed: "封",
    lineupAhead: "この先",
    lineupEmpty: "まだ空",
    lineupAt: (name, n) => `${name}は${n}番目`,
    lineupAdded: (names) => `${names.join("、")}を足した`,
    lineupMissing: (name) => `${name}が無い`,
    tryBlock: (n) => `ブロック ${n}`,
    tryTakes: (n) => `次は上から ${n} 件`,
    tryFolded: (n) => `古いブロック ${n} つ`,
    tryAsk: "送る値",
    tryEditForm: "チップを書き換える",
    trySend: "送る",
    tryApply: "決める",
    tryClose: "閉じる",
    tryEditField: (item, field) => `${spaced(item)}の${led(field)}`,
    tryFull: (queue, most) => `${spaced(queue)}が満杯 (${most} 件) なので送れない`,
    tryEmpty: (queue, press) => `${spaced(queue)}が空なので「${press}」を押せない`,
    tryBlank: "全ての欄を埋めてから送る",
    tryBadName: (field) => `${spaced(field)}に空白と [ ] 「 」 = : は使えない`,
    tryBlankEdit: "値を入れてから決める",
    trySent: (name) => `${spaced(name)}を送った`,
    trySentBody: (name, into, via) =>
      via === undefined ? `${spaced(name)}が${inner(into)}に入った。` : `${spaced(name)}が${inner(via)}を通って${inner(into)}に入った。`,
    tryPressed: (press) => `「${press}」を押した`,
    tryPressedBody: (count, from, block) => `${spaced(from)}の上から ${count} 件がブロック ${block} に入った。`,
    tryEdited: (item, field) => `${spaced(item)}の${inner(field)}を書き換えた`,
    tryEditedBody: (field, from, to) => `${spaced(field)}を ${from} から ${to} にした。ブロックの hash を出し直す。`,
  },
  en: {
    cannotDraw: (detail) => `Cannot draw the diagram: ${detail}`,
    kindNotLoaded: (kind) => `The ${kind} diagram parts are not loaded. Await loadKind before drawing`,
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
    timeUnits: { ms: "ms", s: "s", min: "min", h: "h", d: "d" },
    zoom: "Zoom",
    range: (from, to) => `${from}–${to}`,
    headJoin: " · ",
    empty: "Empty",
    lineupInOrder: "Top first",
    lineupNoOrder: "No order",
    lineupPicked: "Picked",
    lineupSealed: "Sealed",
    lineupAhead: "Next",
    lineupEmpty: "Empty",
    lineupAt: (name, n) => `${name} is #${n}`,
    lineupAdded: (names) => `Added ${names.join(", ")}`,
    lineupMissing: (name) => `${name} is missing`,
    tryBlock: (n) => `Block ${n}`,
    tryTakes: (n) => `Top ${n} go next`,
    tryFolded: (n) => `${n} older ${n === 1 ? "block" : "blocks"}`,
    tryAsk: "Values to send",
    tryEditForm: "Edit a chip",
    trySend: "Send",
    tryApply: "Apply",
    tryClose: "Close",
    tryEditField: (item, field) => `${field} of ${item}`,
    tryFull: (queue, most) => `${queue} is full (${most}), so nothing more can be sent`,
    tryEmpty: (queue, press) => `${queue} is empty, so "${press}" cannot be pressed`,
    tryBlank: "Fill in every field before sending",
    tryBadName: (field) => `${field} cannot contain spaces, brackets, "=" or ":"`,
    tryBlankEdit: "Enter a value before applying",
    trySent: (name) => `Sent ${name}`,
    trySentBody: (name, into, via) => (via === undefined ? `${name} went into ${into}.` : `${name} traveled through ${via} into ${into}.`),
    tryPressed: (press) => `Pressed "${press}"`,
    tryPressedBody: (count, from, block) => `The top ${count === 1 ? "item" : `${count} items`} of ${from} went into block ${block}.`,
    tryEdited: (item, field) => `Changed ${field} of ${item}`,
    tryEditedBody: (field, from, to) => `Set ${field} from ${from} to ${to}. The block hash is computed again.`,
  },
};
