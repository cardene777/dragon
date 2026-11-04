/**
 * `note` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import type { BlockReading } from "../block";
import { attrs, name } from "../../print-kit";
import { readOnBox } from "../../read-kit";

export interface NoteMessages {
  noteShape: string;
}

export const reading: BlockReading<NoteMessages> = {
  read: {
    note: (source, state) => {
      const step = state.inStep(source);
      const on = readOnBox(source, "note", state.m.noteShape, state.boxAt);
      step.events.push({ type: "swap", box: on.box, text: on.text });
    },
  },
  print: {
    events: { swap: (e, kind) => (kind === "time" ? `note ${e.box}: ${name(e.text)}${attrs([["color", e.color]])}` : `note ${e.box}: ${e.text}`) },
  },
  messages: {
    ja: { noteShape: "note は note <名札>: <下の小さな字> の形で書く" },
    en: { noteShape: "Write note as note <id>: <caption>" },
  },
};
