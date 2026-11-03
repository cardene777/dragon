/**
 * 始まりと終わりのブロック (#3163、#3347)。
 *
 * 状態遷移図の部品 (`only: state`)。線の送る側に `start` を書くと始まりの印から出る線に、受ける側に `finish` を書くと終わりの印へ入る線になる。
 * 印は線の端に名札で書くので、記法に印の行は無く、原本にも印の欄は無い。線の端の名札を確かめるのは、図の種類ごとの端の決まりを知る parser が行う。
 * 状態遷移図では `start` と `finish` を箱と区画の名札に使えない。時系列図と構成図では、宣言して使う普通の名札のまま。
 * 原本の箱の名札の決まりは図の種類ごとの決まりと一緒に骨組み (`schemas/base.schema.json`) が持ち、その誤りの文をこのブロックが持つ。
 */
import { type Block, none } from "../block";

/** 状態遷移図の始まりと終わりの印の名前。線の送る側に `start`、受ける側に `finish` を書く */
export const STATE_ENDS = ["start", "finish"] as const;
export type StateEnd = (typeof STATE_ENDS)[number];

export interface StartFinishMessages {
  /** 状態遷移図の箱の名札に、始まりか終わりの印の名前を書いた */
  reservedId: (id: string) => string;
  intoStart: string;
  outOfFinish: string;
}

export interface StartFinishFieldMessages {
  /** 状態遷移図の原本の箱の名札に、始まりか終わりの印の名前を書いた */
  reserved: (names: readonly string[]) => string;
}

export const block: Block<StartFinishMessages, StartFinishFieldMessages> = {
  name: "start-finish",
  rank: 3,
  attach: { how: "place", only: "state" },
  words: {},
  shape: none("印は線の端の名札で書き、原本に印の欄は無い。箱の名札の決まりは図の種類ごとの決まりと一緒に骨組みが持つ"),
  read: none("印の行は無い。線の端の名札を、図の種類ごとの端の決まりを知る parser が確かめる"),
  print: none("印は線の端の名札なので、線のブロックが線の行と一緒に書く"),
  messages: {
    ja: {
      reservedId: (id) => `${id} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,
      intoStart: "start へ入る線は書けない。start は始まりの印で、線は start から出る",
      outOfFinish: "finish から出る線は書けない。finish は終わりの印で、線は finish へ入る",
    },
    en: {
      reservedId: (id) => `${id} names the start or end mark of a state diagram and cannot be a box id`,
      intoStart: "A line cannot go into start. start is the start mark, and lines leave it",
      outOfFinish: "A line cannot leave finish. finish is the end mark, and lines go into it",
    },
  },
  fieldMessages: {
    ja: { reserved: (names) => `${names.join(" と ")} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない` },
    en: { reserved: (names) => `${names.join(" and ")} name the start and end marks of a state diagram and cannot be box ids` },
  },
};
