/**
 * 見本帳の build が収めた配管の図の並べ方を読む (#3748)。`LiveFigure` が配管の図を描く前に呼ぶ。
 *
 * 最初に読む量に入れないよう、`LiveFigure` は配管の図を描く時だけこの file を読む。
 * 収めていない記法と、読めない時 (開発の server) は `undefined` を返し、図はその場で並べ方を組んで描く。
 */
import type { StoredPipeLayout } from "@cardenelabs/dragon/light";

import { pipeTextKey } from "./pipe-text-key";

export async function pipeLayoutsFor(text: string, lang: string): Promise<StoredPipeLayout[] | undefined> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}pipe-layouts/${pipeTextKey(text, lang)}.json`);
    const read: unknown = res.ok ? await res.json() : undefined;
    return Array.isArray(read) ? (read as StoredPipeLayout[]) : undefined;
  } catch {
    return undefined;
  }
}
