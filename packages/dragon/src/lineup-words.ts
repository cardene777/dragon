/**
 * 列の図の字の既定 (#4046)。卓の形 (#3351) とボードと流れの線 (#3624) が描く札と一言の字を、描く言葉ごとに持つ。
 * 列の図は後から読む塊だけが描くので、最初に読む言葉の表 (`figure-text.ts`) に置かず、列の図の並べ方だけが読むこのfileが持つ。
 * 図の種類の置き場 (`kinds/lineup/`) は`kind.ts`と`layout.ts`だけを持つ決まり (#3345) なので、置き場の外に置く (#4050)。
 * 最初に読む言葉の表に置くと、列の図を描かない頁も列の図の語を読み、見本帳の頁が最初に読む量の上限を超えた (#4046)
 */
import type { NotationLang } from "./words";

export interface LineupWords {
  /**
   * 列の図の卓の形 (#3351)。順番の無い置き場の字、選んだ札の印、封の字、「この先」の帯の字。
   * 札の下の一言は、色付きのチップの席の番号、置き場に無かったチップを足したこと、置き場に在った色付きのチップが無いことを言う
   */
  lineupNoOrder: string;
  lineupPicked: string;
  lineupSealed: string;
  lineupAhead: string;
  lineupAt: (name: string, n: number) => string;
  lineupAdded: (names: string[]) => string;
  lineupMissing: (name: string) => string;
  /** 列の図のボードと流れの線 (#3624) の、前の列へ戻る段の札と、現れた札と外れた札の印 */
  lineupBack: string;
  lineupNew: string;
  lineupGone: string;
}

export const LINEUP_WORDS: Record<NotationLang, LineupWords> = {
  ja: {
    lineupNoOrder: "順番なし",
    lineupPicked: "選ばれる",
    lineupSealed: "封",
    lineupAhead: "この先",
    lineupAt: (name, n) => `${name}は${n}番目`,
    lineupAdded: (names) => `${names.join("、")}を足した`,
    lineupMissing: (name) => `${name}が無い`,
    lineupBack: "差し戻し",
    lineupNew: "足した",
    lineupGone: "外れた",
  },
  en: {
    lineupNoOrder: "No order",
    lineupPicked: "Picked",
    lineupSealed: "Sealed",
    lineupAhead: "Next",
    lineupAt: (name, n) => `${name} is #${n}`,
    lineupAdded: (names) => `Added ${names.join(", ")}`,
    lineupMissing: (name) => `${name} is missing`,
    lineupBack: "Sent back",
    lineupNew: "Added",
    lineupGone: "Gone",
  },
};
