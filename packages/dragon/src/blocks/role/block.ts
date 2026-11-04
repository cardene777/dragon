/**
 * 役のブロック (#3351、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。最初の `step` より前の `role <名札> [note: <一言>]` の行で、チップを持たずに動く役を宣言し、役の札が箱の上に並ぶ。
 * 段の中の `role <名札>` の行は、その段で動く役を名指し、その段に役の札が光る。段の中で名指す役は宣言した役だけ。
 * 書き戻す時は、役の宣言を図の種類の行の直ぐ後ろ、箱の宣言より前に書く (`print.lead`)。
 */
import { attrs } from "../../print-kit";
import { fail, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState } from "../block";

/** 列の図の役 (#3351)。チップを持たずに動く者で、箱の上に札として並ぶ。`note` は名前の下の一言 */
export interface LineupRole {
  id: string;
  note?: string;
}

/** 列の図の、段 `role` の役が動く出来事 (#3351)。役の札の縁が光る */
export interface LineupAct {
  type: "role";
  role: string;
}

/** 段の中の `role <名札>` の行 */
const ACT_ROLE = /^role\s+(\S+)\s*$/du;

export interface RoleMessages {
  /** `role` の行の形 */
  roleShape: string;
  /** 段の中の `role` の行に、宣言していない役を書いた */
  unknownRole: (id: string) => string;
}

/**
 * 列の図の `role` の行 (#3351)。最初の `step` より前なら `role <名札> [note: <一言>]` で役を宣言し、
 * 段の中なら `role <名札>` でその段で動く役を名指す。段の中で名指す役は宣言した役だけ
 */
function readRole(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const { roles } = state.figure.lineup;
  const building = state.current();
  if (!building) {
    const declared = readDeclared(source, "role", state.attrs.role ?? [], m);
    if (declared.name !== undefined) throw fail(source, 0, m.roleShape);
    state.declare(source, declared.id, declared.idAt);
    const note = declared.attrs.get("note")?.value;
    roles.push({ id: declared.id, ...(note !== undefined ? { note } : {}) });
    return;
  }
  const found = ACT_ROLE.exec(source.text);
  const id = found?.[1];
  if (!found || id === undefined) throw fail(source, 0, m.roleShape);
  const at = found.indices?.[1]?.[0] ?? 0;
  if (!roles.some((role) => role.id === id)) throw fail(source, at, m.unknownRole(id));
  building.events.push({ type: "role", role: id });
}

export const block: Block<RoleMessages> = {
  name: "role",
  rank: 104,
  attach: { how: "place", only: "lineup" },
  words: { heads: ["role"], attrs: { role: ["note"] } },
  read: { role: readRole },
  print: {
    lead: (diagram) => {
      const roles = diagram.lineup?.roles ?? [];
      return roles.length > 0 ? [roles.map((r) => `role ${r.id}${attrs([["note", r.note]])}`).join("\n")] : [];
    },
    events: {
      role: (e) => `role ${e.role}`,
    },
  },
  messages: {
    ja: {
      roleShape: "role は、最初の step より前なら role <名札> [note: <一言>]、step の中なら role <名札> の形で書く",
      unknownRole: (id) => `${id} という役は宣言していない。最初の step より前に role ${id} と書く`,
    },
    en: {
      roleShape: "Write a role as role <id> [note: <text>] before the first step, or as role <id> inside a step",
      unknownRole: (id) => `The role ${id} is not declared. Write role ${id} before the first step`,
    },
  },
};
