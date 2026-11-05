/**
 * `revert` のブロックの読み方 (#3389)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * `revert <落ちた者>: <理由>` の行で、いちばん内側の呼び出しを落として閉じ、その内側の変更を元へ戻す。閉じ方は呼び出しの管のブロックが持つ
 */
import { inPipeStep, pipeLine } from "../../pipe-read";
import type { BlockReading } from "../block";
import { closeCall } from "../return/read";

export interface RevertMessages {
  revertShape: string;
}

export const reading: BlockReading<RevertMessages> = {
  read: {
    revert: (source, state) => {
      const { step } = inPipeStep(source, state);
      const { box, at, rest } = pipeLine(source, "revert", state, state.m.revertShape, true);
      closeCall(source, state, box, at, "revert");
      const reason = source.text.slice(rest).trim();
      step.events.push({ type: "revert", box, ...(reason !== "" ? { reason } : {}) });
    },
  },
  print: {
    events: {
      revert: (e) => `revert ${e.box}${e.reason === undefined ? "" : `: ${e.reason}`}`,
    },
  },
  messages: {
    ja: { revertShape: "revert は revert <落ちた者>: <理由> の形で書く" },
    en: { revertShape: "Write revert as revert <failing party>: <reason>" },
  },
};
