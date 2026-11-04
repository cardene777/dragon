/**
 * `role` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs } from "../../print-kit";
import { fail, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";

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

export const reading: BlockReading<RoleMessages> = {
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
