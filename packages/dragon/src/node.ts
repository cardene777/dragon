/**
 * Node でだけ動く部品の入口 (#3206)。
 *
 * 原本の file を読み書きする部品は、頁で描く入口 (`index.ts`) に置かない。
 * 頁を束ねる道具 (Next.js の Turbopack など) は、呼ぶかどうかに関わらず入口の file の読み込みを全て解くため、
 * 頁の入口に Node の組み込みの module を読む部品が 1 つでも在ると、ブラウザ向けの build が止まる。
 */
import { readFile, writeFile } from "node:fs/promises";
import { registerValidator } from "./schema";
import { VALIDATOR } from "./schemas/validator";
import { FORMAT_VERSION, readDiagram } from "./version";

// 原本の file を移す入口は原本の JSON を読むので、原本の形の検査を初めから持つ (#3400)
registerValidator(VALIDATOR);

export interface Migrated {
  changed: boolean;
  from: number;
  to: number;
}

/**
 * 原本の file を今の版へ移す。今の版の file には触れない。
 * 古い版の file は今の版の形 (2 字の字下げと末尾の改行の JSON) に書き換える (#3346)
 */
export async function migrateFile(path: string): Promise<Migrated> {
  const input: unknown = JSON.parse(await readFile(path, "utf8"));
  const read = readDiagram(input);
  if (!read.ok) throw new Error(`${path} を移せない: ${read.errors.map((error) => `${error.pointer} ${error.message}`).join(" / ")}`);
  const from = (input as { version: number }).version;
  if (from === FORMAT_VERSION) return { changed: false, from, to: FORMAT_VERSION };
  await writeFile(path, `${JSON.stringify(read.diagram, null, 2)}\n`);
  return { changed: true, from, to: FORMAT_VERSION };
}
