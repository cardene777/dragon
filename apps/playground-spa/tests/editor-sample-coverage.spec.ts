import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { EDITOR_SAMPLES } from "../src/data/editor-samples";

/**
 * 見本を手で並べている検査が、 全ての見本を走査している (#1154)。
 *
 * 読みやすさの検査 (`editor-readable-scale.spec.ts`) は見本ごとに実測した「読める下限」 を
 * 持つため、 一覧を導けない。 手で並べる以上、 **足した見本が漏れる**。
 *
 * 実際 8 つ足した時、 12 件のまま残って新しい見本の読みやすさが 1 度も確かめられなかった
 * (review 指摘)。
 *
 * ここは画面を開かない。 file を読んで突き合わせるだけ。
 *
 * **`__dirname` は使えない**。 この検査は ESM で動くため未定義になり、 突き合わせに届く前に
 * 必ず落ちる (review 指摘)。 `import.meta.url` から出す。
 */
const ここ = dirname(fileURLToPath(import.meta.url));

test("読みやすさの検査が全ての見本を走査する", () => {
  const src = readFileSync(resolve(ここ, "editor-readable-scale.spec.ts"), "utf8");
  // `["slug", 数]` の形から slug を集める
  const 並べた = new Set([...src.matchAll(/\["([a-z0-9-]+)",\s*\d+\]/gu)].map((m) => m[1]!));
  const 漏れ = EDITOR_SAMPLES.map((s) => s.slug).filter((s) => !並べた.has(s));
  expect(
    漏れ,
    `読みやすさの検査に並べていない見本がある (editor-readable-scale.spec.ts に足す): ${漏れ.join(", ")}`,
  ).toEqual([]);
});
