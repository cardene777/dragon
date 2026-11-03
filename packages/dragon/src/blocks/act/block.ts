/**
 * 箱の中の処理のブロック (#3345)。
 *
 * 段の中の `act <名札>: <処理の名前>` の行で、線を引かずに箱の中で起きる処理を出す。
 * 時系列図は生存線の上の札 (`draw.ts`) で見せ、ほかの図の種類は箱の下の字の書き換えで見せる。
 * 列の図は線と処理を持たないので、列の図の `act` の行は断る。
 */
import { fail, readOnBox } from "../../read-kit";
import type { Block } from "../block";

export interface ActMessages {
  actShape: string;
  lineupNoAct: string;
}

export const block: Block<ActMessages> = {
  name: "act",
  rank: 60,
  attach: { how: "attach-to-box" },
  words: { heads: ["act"] },
  shape: {
    events: {
      action: {
        description: "箱の中の処理",
        type: "object",
        additionalProperties: false,
        required: ["type", "box", "label"],
        properties: { type: { const: "action" }, box: { $ref: "#/definitions/id" }, label: { $ref: "#/definitions/text" } },
      },
    },
  },
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
      lineupNoAct: "lineup (列の図) には act の行を書けない。列の右上の字は note の行で書き換える",
    },
    en: {
      actShape: "Write act as act <id>: <action>",
      lineupNoAct: "A lineup diagram takes no act lines. Rewrite the text at the top right of a lane with a note line",
    },
  },
};
