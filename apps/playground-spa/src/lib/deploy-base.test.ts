import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 配信先ごとに資産の URL の前置きが変わる (#1156)。
 *
 * `vite.config.ts` は build 時に `base` を `/dragon/` にする。 GitHub Pages が
 * `cardene777.github.io/dragon/` の subpath で配るため。
 *
 * **Vercel は root で配る**ので、 同じ build を出すと資産が `/dragon/assets/...` を指し、
 * 何も読み込めない (画面が白くなる)。 `GH_PAGES_BASE=/` で前置きを外す。
 *
 * ここは `vercel.json` がその指定を持っていることを見る。 落とすと、 deploy は成功するのに
 * 画面だけ壊れる = **一番気付きにくい壊れ方** になる。
 */
describe("配信先ごとの前置き (#1156)", () => {
  const root = resolve(__dirname, "../../../..");

  it("vercel の build が前置きを外している", () => {
    const v = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8")) as {
      buildCommand?: string;
    };
    expect(v.buildCommand, "buildCommand が無い").toBeTruthy();
    // **部分一致で見てはいけない**。 `GH_PAGES_BASE=/dragon/` のような誤った値も
    // `GH_PAGES_BASE=/` を含むため通ってしまう (review 指摘)。 値そのものを取り出して比べる
    const m = v.buildCommand!.match(/GH_PAGES_BASE=(\S*)/u);
    expect(m, "GH_PAGES_BASE の指定が無い (資産が /dragon/ を指して画面が白くなる)").not.toBeNull();
    expect(m?.[1], "前置きが root になっていない").toBe("/");
  });

  it("既定は GitHub Pages の前置きのまま", () => {
    // Vercel 側を直した時に、 こちらを巻き添えで変えていないことを見る。
    //
    // **file 全体から探してはいけない**。 説明文にも `/dragon/` が出るので、 既定値を壊しても
    // 通ってしまう (review 指摘)。 既定値を決めている式そのものを見る
    const c = readFileSync(resolve(root, "apps/playground-spa/vite.config.ts"), "utf8");
    const m = c.match(/process\.env\.GH_PAGES_BASE\s*\?\?\s*"([^"]*)"/u);
    expect(m, "既定値を決める式が見つからない (書き方が変わった)").not.toBeNull();
    expect(m?.[1], "既定の前置きが変わっている").toBe("/dragon/");
  });
});
