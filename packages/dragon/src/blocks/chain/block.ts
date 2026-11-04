/**
 * 機械の列のブロック (#3337、#3348)。
 *
 * 試す図の部品 (`only: try`)。最初の `step` より前の `chain <名札> [edit: <欄>]` の行で、ブロックの鎖を宣言する。
 * ブロックは 1 つ前のブロックの hash を prev に持ち、中身が変わると hash が変わってつながりが切れる。
 * `edit` を書くと、読み手がブロックの中のチップのその欄を書き換えられる。欄は入力の帯の欄 (最初の欄を除く) で、全ての宣言を読んでから確かめる。
 */
import { attrs } from "../../print-kit";
import { fail, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { fieldAt, valueAt } from "../../try-read";
import type { Block, ParseState } from "../block";

export interface ChainMessages {
  chainShape: string;
}

/** `chain <名札> [edit: <欄>]` の行。欄は入力の帯の欄 (最初の欄を除く) */
function readChain(source: SourceLine, state: ParseState): void {
  const { m } = state;
  if (state.current()) throw fail(source, 0, m.tryPartInStep("chain"));
  const declared = readDeclared(source, "chain", state.attrs.chain ?? [], m);
  if (declared.name !== undefined) throw fail(source, 0, m.chainShape);
  state.declare(source, declared.id, declared.idAt);
  const field = declared.attrs.get("edit");
  if (field) state.figure.try.pending.push(() => fieldAt(source, field.value, valueAt(source, field), state));
  state.figure.try.parts.push({ type: "chain", id: declared.id, ...(field ? { edit: field.value } : {}) });
}

export const block: Block<ChainMessages> = {
  name: "chain",
  rank: 109,
  attach: { how: "place", only: "try" },
  words: { heads: ["chain"], attrs: { chain: ["edit"] } },
  read: { chain: readChain },
  print: {
    part: (part) => (part.type === "chain" ? `chain ${part.id}${attrs([["edit", part.edit]])}` : ""),
  },
  messages: {
    ja: {
      chainShape: "chain は chain <名札> [edit: <欄>] の形で書く",
    },
    en: {
      chainShape: "Write a chain as chain <id> [edit: <field>]",
    },
  },
};
