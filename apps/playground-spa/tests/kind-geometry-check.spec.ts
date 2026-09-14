/**
 * 図の型ごとの描画の形の検査 (層 3、開発者向けの検知)。
 *
 * 描いた SVG の形を画面から測る。 層 1 (画面を開いて誤りを見る) と層 2 (図の置き方を計算の上で
 * 見る) では、型の中の形 (工程表の矢印の向き・絞り込み図の幅の減り方・枝分かれ図の根の位置 等) を
 * 見られない。
 *
 * 軸 (何を測ってどう判定するか) は `helpers/kind-geometry-axes.ts` の表が持つ。 実証の検査
 * (`kind-geometry-check.proof.spec.ts`) も同じ表を回し、壊した画面で同じ判定が違反を見つけることを
 * 確かめる (#1952)。
 *
 * 実行 = `pnpm check:kind` (実証の検査も続けて走る)。 決まった規則だけで判定し、直し方は出さない。
 */
import { test, expect } from "@playwright/test";
import { 層3の軸たち, 見本の一覧を開く, 見本を開く } from "./helpers/kind-geometry-axes";

test.describe("図の型ごとの描画の形の検査 (層 3)", () => {
  for (const 軸 of 層3の軸たち) {
    test(軸.名前, async ({ page }) => {
      await 見本の一覧を開く(page);
      const 開いた図 = await 見本を開く(page, 軸);
      expect(開いた図, `「${軸.見本}」 を開いたのに、画面に出ている図が見本と違う`).toEqual([
        軸.図のid,
      ]);
      const 結果 = await 軸.確かめる(page);
      expect(
        結果.母数,
        `「${軸.見本}」 で測る対象が下限 (${軸.下限}) に届かない (検査が空振りしている)`,
      ).toBeGreaterThanOrEqual(軸.下限);
      expect(結果.違反).toEqual([]);
    });
  }
});
