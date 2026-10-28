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
}

export const FIGURE_TEXT: Record<NotationLang, FigureText> = {
  ja: {
    cannotDraw: (detail) => `図を描けない: ${detail}`,
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
  },
  en: {
    cannotDraw: (detail) => `Cannot draw the diagram: ${detail}`,
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
  },
};
