import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  画面の題,
  htmlの題,
  相手を見分ける,
  相手の問題,
} from "../../../../test-support/dev-server-identity";
import { DEV_URL } from "../../ports";

/**
 * 開発 server の相手を見分ける側の検査 (#2295)。
 *
 * ## 何が起きたか
 *
 * 束ねの古さを見る関門 (#1998) は disk の記録しか読まず、相手の server に 1 度も触らない。
 * `DEV_URL` の port を別のリポジトリの preview が押さえていた回、関門は通ったうえで
 * `row-bounds-offset` の 3 件が 15 秒ずつ「要素が現れない」 とだけ言って落ちた。
 *
 * ## 何を固定するか
 *
 * 3 通り (繋がらない / 別の画面 / dragon) が **別の文面で** 出ること。
 * 畳むと、port を空ける作業と server を立てる作業のどちらをすればよいか読み手が決められない。
 *
 * 引く側 (`頁を引く`) は相手の server が要るのでここでは見ない。 見分ける側を純粋な関数に
 * 切ってあるので、3 通りの分岐をここで全部通せる。
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

describe("開発 server の相手を見分ける (#2295)", () => {
  it("期待する題を index.html から導けている (空振り検知)", () => {
    const 題 = 画面の題(ROOT);
    // 空でないことだけでは足りない = 何を取ったかを見ないと、題を変えた時に気付けない
    expect(題).not.toBe("");
    expect(題).toContain("dragon");
  });

  it("導いた題で突き合わせると一致する", () => {
    const 期待 = 画面の題(ROOT);
    expect(htmlの題(`<html><head><title>${期待}</title></head></html>`)).toBe(期待);
  });

  it("題が同じなら dragon", () => {
    const 相手 = 相手を見分ける("dragon — x", { ok: true, html: "<title>dragon — x</title>" });
    expect(相手.種類).toBe("dragon");
    expect(相手の問題(DEV_URL, 相手)).toBeNull();
  });

  it("題が違えば別の画面。 名乗った題を出す", () => {
    const 相手 = 相手を見分ける("dragon — x", { ok: true, html: "<title>berth</title>" });
    expect(相手).toEqual({ 種類: "別の画面", 題: "berth" });
    const 問題 = 相手の問題(DEV_URL, 相手);
    expect(問題).toContain("別の画面が居る");
    expect(問題).toContain("berth");
    // 直し方は port を空ける側。 名前を取り違えると届かない (`SPA_URL` は dev に届かない)
    expect(問題).toContain("DEV_SPA_URL");
  });

  it("題が無い相手も別の画面。 題が無いことを出す", () => {
    const 相手 = 相手を見分ける("dragon — x", { ok: true, html: "<html></html>" });
    expect(相手).toEqual({ 種類: "別の画面", 題: undefined });
    expect(相手の問題(DEV_URL, 相手)).toContain("題が無い");
  });

  it("引けなければ繋がらない。 別の画面とは違う文面を出す", () => {
    const 相手 = 相手を見分ける("dragon — x", { ok: false, 事情: "ECONNREFUSED" });
    expect(相手).toEqual({ 種類: "繋がらない", 事情: "ECONNREFUSED" });
    const 問題 = 相手の問題(DEV_URL, 相手);
    expect(問題).toContain("居ない");
    expect(問題).toContain("ECONNREFUSED");
    expect(問題).not.toContain("別の画面が居る");
  });

  it("題の前後の空白は落として比べる", () => {
    expect(相手を見分ける("dragon", { ok: true, html: "<title>\n  dragon\n</title>" }).種類).toBe(
      "dragon",
    );
  });

  it("期待する題を導けない時は投げる (一致しない側に倒さない)", () => {
    expect(() => 画面の題(join(ROOT, "存在しない"))).toThrow();
  });
});
