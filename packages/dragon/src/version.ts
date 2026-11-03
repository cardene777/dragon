/**
 * 原本の形式の版。
 *
 * 道具より新しい版の図は描かずに断る。古い版の図は、版を上げる変換を通して読み、
 * 原本の file を書き換えるのは移行の命令 (`migrateFile`、Node でだけ動く入口 `node.ts`) だけにする。
 * 版2 (#3346) は図の宣言を `blocks` のブロックの名前ごとの欄に持つ。版1の原本は読む時に版2へ移し、移したことを警告で返す。
 * 版の番号と、版1と版2の欄の対応は `model.ts` が持つ。
 */
import { FIELD_MESSAGES } from "./field-messages";
import { FORMAT_VERSION, fromModel, isVersion1, toModel, upgrade } from "./model";
import { type CheckOptions, type Diagram, type FieldError, validateDiagram } from "./schema";
import { DEFAULT_LANG, type NotationLang } from "./words";

/** この道具が読める原本の版 */
export { FORMAT_VERSION };

export type Read = { ok: true; diagram: Diagram; warnings: string[] } | { ok: false; errors: FieldError[] };

function newerThanTool(input: unknown): number | undefined {
  if (typeof input !== "object" || input === null) return undefined;
  const version = (input as { version?: unknown }).version;
  return typeof version === "number" && version > FORMAT_VERSION ? version : undefined;
}

const newerError = (version: number, lang: NotationLang): FieldError => ({
  pointer: "/version",
  message: FIELD_MESSAGES[lang].newer(version, FORMAT_VERSION),
});

/**
 * 原本を読む。道具より新しい版は描かずに断り、形の誤りは検査の誤りとして返す。誤りの文は `options.lang` (渡さなければ英語) で出す。
 * 版1の原本は版2へ移し、空の並びを外して欄を版2の並びに整えた原本と、移したことの警告を返す。版2の原本は渡した物をそのまま返す
 */
export function readDiagram(input: unknown, options: CheckOptions = {}): Read {
  const lang = options.lang ?? DEFAULT_LANG;
  const newer = newerThanTool(input);
  if (newer !== undefined) return { ok: false, errors: [newerError(newer, lang)] };
  const checked = validateDiagram(input, options);
  if (!checked.ok) return checked;
  if (!isVersion1(input)) return { ok: true, diagram: input as Diagram, warnings: [] };
  const diagram = fromModel(toModel(upgrade(input, FORMAT_VERSION) as unknown as Diagram), FORMAT_VERSION);
  return { ok: true, diagram, warnings: [FIELD_MESSAGES[lang].upgraded(1, FORMAT_VERSION)] };
}
