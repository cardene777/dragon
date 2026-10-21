/**
 * 原本の形式の版。
 *
 * 道具より新しい版の図は描かずに断る。古い版の図は、版を 1 つずつ上げる変換を通して読み、
 * 原本の file を書き換えるのは移行の命令 (`migrateFile`) だけにする。
 * 今は版 1 しか無いため、版を上げる変換はまだ持たない。版 2 を作る時に、版 1 から 2 への変換と
 * 古い版を読んだ時の警告をここに足す。
 */
import { FIELD_MESSAGES } from "./field-messages";
import { type CheckOptions, type Diagram, type FieldError, validateDiagram } from "./schema";
import type { NotationLang } from "./words";

/** この道具が読める原本の版 */
export const FORMAT_VERSION = 1;

export type Read = { ok: true; diagram: Diagram; warnings: string[] } | { ok: false; errors: FieldError[] };

export interface Migrated {
  changed: boolean;
  from: number;
  to: number;
}

function newerThanTool(input: unknown): number | undefined {
  if (typeof input !== "object" || input === null) return undefined;
  const version = (input as { version?: unknown }).version;
  return typeof version === "number" && version > FORMAT_VERSION ? version : undefined;
}

const newerError = (version: number, lang: NotationLang): FieldError => ({
  pointer: "/version",
  message: FIELD_MESSAGES[lang].newer(version, FORMAT_VERSION),
});

/** 原本を読む。道具より新しい版は描かずに断り、形の誤りは検査の誤りとして返す。誤りの文は `options.lang` (渡さなければ日本語) で出す。 */
export function readDiagram(input: unknown, options: CheckOptions = {}): Read {
  const newer = newerThanTool(input);
  if (newer !== undefined) return { ok: false, errors: [newerError(newer, options.lang ?? "ja")] };
  const checked = validateDiagram(input, options);
  if (!checked.ok) return checked;
  return { ok: true, diagram: input as Diagram, warnings: [] };
}

/**
 * 原本の file を今の版へ移す。今の版の file には触れない。
 *
 * file を読むので、画面で描く入口からは呼ばない。node の file の命令は呼んだ時に初めて読み込む。
 */
export async function migrateFile(path: string): Promise<Migrated> {
  const { readFile } = await import("node:fs/promises");
  const input: unknown = JSON.parse(await readFile(path, "utf8"));
  const read = readDiagram(input);
  if (!read.ok) throw new Error(`${path} を移せない: ${read.errors.map((error) => `${error.pointer} ${error.message}`).join(" / ")}`);
  return { changed: false, from: read.diagram.version, to: FORMAT_VERSION };
}
