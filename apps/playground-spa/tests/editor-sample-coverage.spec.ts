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

test("読みやすさの検査に消えた見本が残っていない", () => {
  // **逆向きも見る** (`#1174`)。 上は「足した見本が漏れる」 だけを見るので、 見本を消した時に
  // 一覧へ残った行に当たらない。
  //
  // 残ると黙って別の図を測る。 `CdlEditor.tsx` は一致しない slug で `SAMPLES[0]` に落ちる
  // ため、 `/editor#preset=<消えた slug>` は 1 つ目の見本を出す。 そこで消えた見本の下限と
  // 比べることになり、 **下限を満たせば通ってしまう**。 落ちないので誰も気付かない。
  //
  // 実際 `#1170` で `radial` を消した時、 一覧の `["radial", 9]` を外し忘れていれば
  // `sequence` (下限 10) を測って 9 と比べ、 通っていた。
  const src = readFileSync(resolve(ここ, "editor-readable-scale.spec.ts"), "utf8");
  const 並べた = [...src.matchAll(/\["([a-z0-9-]+)",\s*\d+\]/gu)].map((m) => m[1]!);
  const 実在 = new Set(EDITOR_SAMPLES.map((s) => s.slug));
  const 余り = 並べた.filter((s) => !実在.has(s));
  expect(
    余り,
    `消えた見本が読みやすさの検査に残っている (editor-readable-scale.spec.ts から外す): ${余り.join(", ")}`,
  ).toEqual([]);
});
