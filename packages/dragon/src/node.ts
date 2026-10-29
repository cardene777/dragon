/**
 * Node でだけ動く部品の入口 (#3206)。
 *
 * 原本の file を読み書きする部品は、頁で描く入口 (`index.ts`) に置かない。
 * 頁を束ねる道具 (Next.js の Turbopack など) は、呼ぶかどうかに関わらず入口の file の読み込みを全て解くため、
 * 頁の入口に Node の組み込みの module を読む部品が 1 つでも在ると、ブラウザ向けの build が止まる。
 */
import { readFile } from "node:fs/promises";
import { FORMAT_VERSION, readDiagram } from "./version";

export interface Migrated {
  changed: boolean;
  from: number;
  to: number;
}

/** 原本の file を今の版へ移す。今の版の file には触れない。 */
export async function migrateFile(path: string): Promise<Migrated> {
  const input: unknown = JSON.parse(await readFile(path, "utf8"));
  const read = readDiagram(input);
  if (!read.ok) throw new Error(`${path} を移せない: ${read.errors.map((error) => `${error.pointer} ${error.message}`).join(" / ")}`);
  return { changed: false, from: read.diagram.version, to: FORMAT_VERSION };
}
