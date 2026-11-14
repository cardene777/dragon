/**
 * `start-finish` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { type BlockReading, none } from "../block";
import { fail, isOneOf } from "../../read-kit";
import { STATE_ENDS } from "../definition-values";

export interface StartFinishMessages {
  /** 状態遷移図の箱の名札に、始まりか終わりの印の名前を書いた */
  reservedId: (id: string) => string;
  intoStart: string;
  outOfFinish: string;
}

export const reading: BlockReading<StartFinishMessages> = {
  // 線の送る側に始まりの印 `start`、受ける側に終わりの印 `finish` を書ける
  endAt: (source, id, at, side, state) => {
    if (!isOneOf(STATE_ENDS, id)) return undefined;
    if ((id === "start") !== (side === "from")) throw fail(source, at, id === "start" ? state.m.intoStart : state.m.outOfFinish);
    return id;
  },
  reserved: (source, id, at, state) => {
    if (isOneOf(STATE_ENDS, id)) throw fail(source, at, state.m.reservedId(id));
  },
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
};
