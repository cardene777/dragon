/**
 * 描く部品が出す字 (#3001)。
 *
 * 図の原本は語を持たないので、呼ぶ側が言葉を渡す。渡さなければ英語で出す (#3338)。
 * 頁は頁の言葉を、`dragon export` は `--lang` の言葉を渡す。`--lang` が無ければ、書き出しが図の題と `say` から言葉を決める (#3516)。
 */
import type { NotationLang } from "./words";

export interface FigureText {
  /** 描けない時の断りの文。`detail` は誤りの場所と文を並べた物 */
  cannotDraw: (detail: string) => string;
  /** 軽い入口で読んでいない種類を描いた時の誤り (#3248) */
  kindNotLoaded: (kind: string) => string;
  /** 軽い入口で、手描きの線 (`line: "pen"`) の処理を読まずに描いた時の誤り (#3643) */
  penNotLoaded: string;
  sequenceLookNotLoaded: string;
  /** 描く設定の `colors` (#3198) の誤り。色味に無い色の名前と、色の値として読めない値の色の名前 */
  unknownColor: (name: string) => string;
  unreadableColor: (name: string) => string;
  /** 寄って動かす見せ方の、隅の全体図の札 */
  overview: string;
  /** 再生の釦の読み上げの名前 */
  /** 最初の段から流し直す釦 (#3398) */
  restart: string;
  prev: string;
  pause: string;
  play: string;
  next: string;
  /** 段の一覧の読み上げの名前 */
  steps: (title: string) => string;
  /** 札で見せる図 (#3877) の、印の付いた箱の読み上げの名前と、札の閉じるのアイコンの読み上げの名前 */
  openNote: (name: string) => string;
  closeNote: string;
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
   * 描いた図の崩れを知らせる文に添える、段を添えた線の呼び方と、携帯の幅でだけ出る崩れの幅 (#3484)。
   * 崩れの種類ごとの文は、崩れを探す処理 (`render/layout-check.ts`) だけが持つ (#3515)
   */
  lineOf: (from: string, to: string, step: number) => string;
  atWidth: (width: number) => string;
  /**
   * 時間軸の図 (#3165)。時刻の字の単位、拡大の帯の名前、目盛りの番号の範囲の書き方、列の上の目盛りの番号と時刻の間、
   * 空きの目盛りの枠の字
   */
  timeUnits: Record<"ms" | "s" | "min" | "h" | "d", string>;
  zoom: string;
  range: (from: string, to: string) => string;
  /**
   * 作業の棒の期間の字 (#3562)。`unit` は目盛りの名前、`from` と `to` は始まりと終わりの目盛りの名前の数で、同じなら 1 つで書く。
   * 日本語は数の後ろに目盛りの名前 (`1〜3日`、本人が試作で選んだ形)、英語は目盛りの名前を頭に置く (`Day 1–3`)
   */
  taskRange: (unit: string, from: string, to: string) => string;
  headJoin: string;
  empty: string;
  /** 並べる見せ方の場面の図で、場面が分かれる箱か帯に掛ける札の字 (#4019) */
  sceneFork: string;
  /** 配管の図の拡大と縮小の釦の読み上げの名前 (#3418) */
  zoomIn: string;
  zoomOut: string;
  /** 配管の図の下の、段の要点の札の名札 (#3464)。読み上げの段の一覧でも要点の前に置く */
  gist: string;
}

/**
 * 英数字で終わる語の後ろに空白を置く。「段の番号 1 と」のように、数と仮名の間を空けて読みやすくする。
 * 書き手が CLI で受け取る配置の警告だけが使う。読み手が図で見る字は和文と英数字の間に空白を置かない (#3517)
 */
export const spaced = (word: string): string => (/[0-9A-Za-z]$/u.test(word) ? `${word} ` : word);
/** 和文の字 (漢字、ひらがな、カタカナ、長音) で終わる語と始まる語。句読点と中黒は和文の字に数えない */
const ENDS_WITH_KANA_KANJI = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]$/u;
const STARTS_WITH_KANA_KANJI = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u;
/**
 * 読み手が図で見る字で、2 つの語を並べる (#3517)。境の片側が和文の字なら空白を置かず、それ以外は空白で離す。
 * 時間軸の図の「12秒」と「slot 3200」、配管の図の「10ポイント」と「100 USDC」のように、書き手の語と数をつなぐ
 */
export const joinWords = (left: string, right: string): string =>
  ENDS_WITH_KANA_KANJI.test(left) || STARTS_WITH_KANA_KANJI.test(right) ? `${left}${right}` : `${left} ${right}`;
/** 英語の文の頭を大文字にする */
export const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export const FIGURE_TEXT: Record<NotationLang, FigureText> = {
  ja: {
    cannotDraw: (detail) => `図を描けない: ${detail}`,
    kindNotLoaded: (kind) => `${kind} の図の部品を読んでいない。描く前に loadKind を待つ`,
    penNotLoaded: '手描きの線 (line: "pen") の部品を読んでいない。描く前に loadLine を待つ',
    sequenceLookNotLoaded: "時系列図の配管の見た目を読んでいない。描く前に loadLook を待つ",
    unknownColor: (name) => `colors の ${name} は色味に無い色の名前`,
    unreadableColor: (name) => `colors の ${name} の値を色として読めない`,
    overview: "全体図",
    restart: "最初から",
    prev: "前の段",
    pause: "止める",
    play: "動かす",
    next: "次の段",
    steps: (title) => `${title}の段`,
    openNote: (name) => `${name}の説明を開く`,
    closeNote: "説明を閉じる",
    side: "脇道",
    sideNote: "今回は通らない",
    sideFrom: (count) => `${count}つの状態から入れる`,
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
    lineOf: (from, to, step) => `線 ${from} → ${to} (段 ${step})`,
    atWidth: (width) => `(幅 ${width} の時)`,
    timeUnits: { ms: "ミリ秒", s: "秒", min: "分", h: "時間", d: "日" },
    zoom: "拡大",
    range: (from, to) => `${from}〜${to}`,
    taskRange: (unit, from, to) => joinWords(from === to ? from : `${from}〜${to}`, unit),
    headJoin: " ・ ",
    empty: "空き",
    sceneFork: "ここから分かれる",
    zoomIn: "拡大する",
    zoomOut: "縮小する",
    gist: "要点",
  },
  en: {
    cannotDraw: (detail) => `Cannot draw the diagram: ${detail}`,
    kindNotLoaded: (kind) => `The ${kind} diagram parts are not loaded. Await loadKind before drawing`,
    penNotLoaded: 'The pen line (line: "pen") parts are not loaded. Await loadLine before drawing',
    sequenceLookNotLoaded: "The pipe look of sequence diagrams is not loaded. Await loadLook before drawing",
    unknownColor: (name) => `colors.${name} is not a color name of the palette`,
    unreadableColor: (name) => `colors.${name} cannot be read as a color`,
    overview: "Overview",
    restart: "Restart",
    prev: "Previous step",
    pause: "Pause",
    play: "Play",
    next: "Next step",
    steps: (title) => `Steps of ${title}`,
    openNote: (name) => `Open the note of ${name}`,
    closeNote: "Close the note",
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
    lineOf: (from, to, step) => `the line ${from} → ${to} (step ${step})`,
    atWidth: (width) => `(at width ${width})`,
    timeUnits: { ms: "ms", s: "s", min: "min", h: "h", d: "d" },
    zoom: "Zoom",
    range: (from, to) => `${from}–${to}`,
    taskRange: (unit, from, to) => joinWords(capital(unit), from === to ? from : `${from}–${to}`),
    headJoin: " · ",
    empty: "Empty",
    sceneFork: "splits here",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    gist: "Key point",
  },
};
