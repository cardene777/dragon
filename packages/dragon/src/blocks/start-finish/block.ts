/**
 * 始まりと終わりのブロック (#3163、#3347)。
 *
 * 状態遷移図の部品 (`only: state`)。線の送る側に `start` を書くと始まりの印から出る線に、受ける側に `finish` を書くと終わりの印へ入る線になる。
 * 印は線の端に名札で書くので、記法に印の行は無く、原本にも印の欄は無い。線の端の名札を確かめるのは、このブロックの読み方 (`read.ts`) の `endAt` と `reserved` が行う。
 * 状態遷移図では `start` と `finish` を箱と区画の名札に使えない。時系列図と構成図では、宣言して使う普通の名札のまま。
 * 原本の箱の名札の決まりは図の種類ごとの決まりと一緒に骨組み (`schemas/base.schema.json`) が持ち、その誤りの文をこのブロックが持つ。
 */
import type { Block } from "../block";

export const STATE_ENDS = ["start", "finish"] as const;

export type StateEnd = (typeof STATE_ENDS)[number];

export interface StartFinishFieldMessages {
  /** 状態遷移図の原本の箱の名札に、始まりか終わりの印の名前を書いた */
  reserved: (names: readonly string[]) => string;
}

export const block: Block<StartFinishFieldMessages> = {
  name: "start-finish",
  rank: 3,
  attach: { how: "place", only: "state" },
  words: {},
  // 状態遷移図の線の端と、始まりと終わりの印の名前を名札に使えない決まりを持つ
  always: true,
  fieldMessages: {
    ja: { reserved: (names) => `${names.join(" と ")} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない` },
    en: { reserved: (names) => `${names.join(" and ")} name the start and end marks of a state diagram and cannot be box ids` },
  },
};
