/**
 * 配管の図の再生の部品 (`pipe-player.ts`) が図の下に出す字の既定 (#4046)。段の矢印と呼び出しの結果の字を、描く言葉ごとに持つ。
 * 段の要点の札の名札は、最初に読む再生の部品の読み上げの段の一覧も使うので、最初に読む言葉の表に残す。
 * 配管の図の再生の部品は配管の図の描く部品と同じ後から読む塊に入るので、最初に読む言葉の表 (`figure-text.ts`) に置かず、配管の図の置き場が持つ。
 * 最初に読む言葉の表に置くと、配管の図を描かない頁も配管の図の語を読み、見本帳の頁が最初に読む量の上限を超えた (#4046)
 */
import type { NotationLang } from "../../words";

export interface PipePlayerWords {
  /**
   * 配管の図の下の段の矢印と呼び出しの結果 (#3418、#3450)。結果の一覧の名前、矢印の札 (送る、呼ぶ、返す、計算する、記録を出す)、
   * 同じ段で戻った呼び出しの返した値の札、確かめた式を満たした時と満たさない時の札、中身の無い所の印、
   * 一覧の先頭に置くいちばん外の呼び出しの札、戻る前の呼び出しの返した値の欄、取り消しの札
   */
  calls: string;
  flowTags: Record<"move" | "call" | "return" | "calc" | "emit", string>;
  returnOf: (label: string) => string;
  checkPass: string;
  checkFail: string;
  callNone: string;
  deal: string;
  waiting: string;
  reverted: string;
}

export const PIPE_PLAYER_WORDS: Record<NotationLang, PipePlayerWords> = {
  ja: {
    calls: "呼び出しの結果",
    flowTags: { move: "送る", call: "呼ぶ", return: "返す", calc: "計算する", emit: "記録を出す" },
    returnOf: (label) => `${label}を返す`,
    checkPass: "✓ 満たす",
    checkFail: "✗ 満たさない",
    callNone: "—",
    deal: "取引",
    waiting: "返り待ち",
    reverted: "✗ 取り消し",
  },
  en: {
    calls: "Call results",
    flowTags: {
      move: "sends",
      call: "calls",
      return: "returns",
      calc: "calculates",
      emit: "emits",
    },
    returnOf: (label) => `returns ${label}`,
    checkPass: "✓ holds",
    checkFail: "✗ fails",
    callNone: "—",
    deal: "Transaction",
    waiting: "Pending",
    reverted: "✗ Reverted",
  },
};
