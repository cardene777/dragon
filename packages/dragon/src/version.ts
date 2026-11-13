/**
 * 原本の形式の版。
 *
 * 道具より新しい版の図は描かずに断る。古い版の図は、版を上げる変換を通して読み、
 * 原本の file を書き換えるのは移行の命令 (`migrateFile`、Node でだけ動く入口 `node.ts`) だけにする。
 * 版2 (#3346) は図の宣言を `blocks` のブロックの名前ごとの欄に持つ。版1の原本は読む時に版2へ移し、移したことを警告で返す。
 * 版の番号と、版1と版2の欄の対応は `model.ts` が持つ。
 */
import { FIELD_MESSAGES } from "./field-messages";
import { readyParts } from "./kinds/registry";
import { FORMAT_VERSION, fromModel, isVersion1, toModel, upgrade } from "./model";
import { LINK_URL } from "./blocks/link/block";
import { isParsed } from "./parsed";
import { type CheckOptions, type Diagram, type FieldError, validateDiagram } from "./schema";
import { isUserPath, userBlockUseMessages } from "./user-blocks";
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

const SAFE_URL = new RegExp(LINK_URL, "u");

/**
 * 記法から読んだ図の、字のまま SVG と頁に入る値のうち、決まりの外の物 (#3400)。
 * 印の付いた図は原本の形の検査を省くので、読んだ後に書き換えた値はここで止める。
 * 見るのは足したブロックの path (SVG の `d` に入る) と、箱の飛び先と段の出典の URL (`href` に入る) だけ
 */
function unsafeValues(diagram: Diagram, lang: NotationLang): FieldError[] {
  const errors: FieldError[] = [];
  const bad = (value: unknown, ok: (text: string) => boolean): boolean => value !== undefined && (typeof value !== "string" || !ok(value));
  const url = (text: string): boolean => SAFE_URL.test(text);
  for (const [i, b] of (diagram.define?.blocks ?? []).entries()) if (bad(b.path, isUserPath)) errors.push({ pointer: `/define/blocks/${i}/path`, message: userBlockUseMessages(lang).badPath });
  for (const [i, box] of (diagram.blocks.box ?? []).entries()) if (bad(box.link, url)) errors.push({ pointer: `/blocks/box/${i}/link`, message: FIELD_MESSAGES[lang].url });
  for (const [s, step] of diagram.steps.entries()) {
    for (const [k, source] of (step.sources ?? []).entries()) if (bad(source.url, url)) errors.push({ pointer: `/steps/${s}/sources/${k}/url`, message: FIELD_MESSAGES[lang].url });
  }
  return errors;
}

/**
 * 原本を読む。道具より新しい版は描かずに断り、形の誤りは検査の誤りとして返す。誤りの文は `options.lang` (渡さなければ英語) で出す。
 * 版1の原本は版2へ移し、空の並びを外して欄を版2の並びに整えた原本と、移したことの警告を返す。版2の原本は渡した物をそのまま返す。
 * 記法から読んだ図 (`parseNotation` が返した図) は原本の形の検査を省き、字のまま SVG と頁に入る値だけを確かめる (#3400)
 */
export function readDiagram(input: unknown, options: CheckOptions = {}): Read {
  const lang = options.lang ?? DEFAULT_LANG;
  const newer = newerThanTool(input);
  if (newer !== undefined) return { ok: false, errors: [newerError(newer, lang)] };
  if (isParsed(input)) {
    const unsafe = unsafeValues(input as Diagram, lang);
    unsafe.push(...(readyParts((input as Diagram).kind)?.validate?.(input as Diagram) ?? []).map(message=>({pointer:"/blocks",message})));
    return unsafe.length > 0 ? { ok: false, errors: unsafe } : { ok: true, diagram: input as Diagram, warnings: [] };
  }
  const checked = validateDiagram(input, options);
  if (!checked.ok) return checked;
  if (!isVersion1(input)) return { ok: true, diagram: input as Diagram, warnings: [] };
  const diagram = fromModel(toModel(upgrade(input, FORMAT_VERSION) as unknown as Diagram), FORMAT_VERSION);
  return { ok: true, diagram, warnings: [FIELD_MESSAGES[lang].upgraded(1, FORMAT_VERSION)] };
}
