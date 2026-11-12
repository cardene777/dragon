/**
 * `act` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import type { BlockReading } from "../block";
import { fail, readOnBox } from "../../read-kit";

export interface ActMessages {
  actShape: string;
  lineupNoAct: string;
}

export const reading: BlockReading<ActMessages> = {
  read: {
    act: (source, state) => {
      if (state.kind === "lineup") throw fail(source, 0, state.m.lineupNoAct);
      const step = state.inStep(source);
      const on = readOnBox(source, "act", state.m.actShape, state.boxAt);
      step.events.push({ type: "action", box: on.box, label: on.text });
    },
  },
  print: { events: { action: (e) => `act ${e.box}: ${e.label}` } },
  messages: {
    ja: {
      actShape: "act は act <名札>: <処理の名前> の形で書く",
      lineupNoAct: "lineup (列の図) には act の行を書けない。列の値の札は note の行で書き換える",
    },
    en: {
      actShape: "Write act as act <id>: <action>",
      lineupNoAct: "A lineup diagram takes no act lines. Rewrite the value chip of a lane with a note line",
    },
  },
};
