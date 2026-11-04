/**
 * 箱の下の小さな字のブロック (#3345)。
 *
 * 段の中の `note <名札>: <字>` の行で、その段から箱の下の字を書き換える。
 * 時間軸の図の `note` の行は節目にも書けて丸の色を持つので、時間軸の図の読み方 (`parser.ts` の `readTimeNote`) が読み、
 * 書き戻す時は `[` を含む字を `"` で囲んで色の属性を後ろに書く。
 * 箱と区画の宣言の行の `note:` の属性は箱と区画の欄 (`sub` と `note`) で、宣言の行と一緒に読む。
 */
import { attrs, name } from "../../print-kit";
import { readOnBox } from "../../read-kit";
import type { Block } from "../block";

export interface NoteMessages {
  noteShape: string;
}

export const block: Block<NoteMessages> = {
  name: "note",
  rank: 70,
  attach: { how: "attach-to-box" },
  words: { heads: ["note"] },
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
