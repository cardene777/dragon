/**
 * 入れた依存が公開されている中身と一致するかの突き合わせ (#1456)。
 *
 * ## なぜ要るか
 *
 * #1448 で `node_modules` の `@cardenelabs/cdl` に未公開の build が上書きされていた。
 * 公開版に無い種別が一覧に入って見え、それを根拠に書けない記法を merge した。
 *
 * 発生源は特定できていない (#1454 で 7 経路を潰したが該当なし)。 塞げない以上、
 * **入ったことを検知する側** を持つ。
 *
 * ## 何を見るか
 *
 * 1. 一致する時に差を出さないこと (陰性対照)
 * 2. 余分 / 欠け / 中身違い を **それぞれ別に** 検知すること
 * 3. **比べた数を必ず出すこと** = 0 件なら「一致」 ではなく「測れていない」
 *
 * 1 と 3 が要点。 1 が無いと「常に差あり」 の実装が通り、3 が無いと展開に失敗して
 * 0 file を比べた run が「一致」 として通る。
 *
 * network は使わない。 比べる処理は 2 つの dir を受けるだけで、取り寄せは main が持つ。
 */
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const { 中身を突き合わせる, 結果を文にする, fileを並べる } = require_(
  "../scripts/lib/dep-integrity.mjs",
) as {
  中身を突き合わせる: (
    配布物: string,
    実物: string,
  ) => { 余分: string[]; 欠け: string[]; 中身違い: string[]; 比べた数: number };
  結果を文にする: (名: string, 版: string, r: unknown) => string;
  fileを並べる: (root: string) => string[];
};

const 作った: string[] = [];

/** `{ 相対path: 中身 }` から一時の dir を作る */
function 仮のdir(中身: Record<string, string>): string {
  const d = mkdtempSync(join(tmpdir(), "dep-int-"));
  作った.push(d);
  for (const [p, c] of Object.entries(中身)) {
    const 先 = join(d, p);
    mkdirSync(join(先, ".."), { recursive: true });
    writeFileSync(先, c);
  }
  return d;
}

afterEach(() => {
  for (const d of 作った.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** 配布物の側の中身。 3 file / 1 つは入れ子 */
const 配布物の中身 = {
  "package.json": '{"name":"x","version":"1.0.0"}\n',
  "dist/index.js": "export const a = 1;\n",
  "dist/render-AAA.d.ts": "type A = 1;\n",
};

describe("一致する時は差を出さない (#1456)", () => {
  it("同じ中身なら 3 つとも空", () => {
    // 陰性対照。 これが無いと「常に差あり」 の実装でも以下が通る
    const r = 中身を突き合わせる(仮のdir(配布物の中身), 仮のdir(配布物の中身));
    expect(r.余分).toEqual([]);
    expect(r.欠け).toEqual([]);
    expect(r.中身違い).toEqual([]);
  });

  it("比べた数が file の数と一致する (空振りしていない)", () => {
    // 0 件なら「一致」 ではなく「測れていない」。 数を出さないと区別が付かない
    const r = 中身を突き合わせる(仮のdir(配布物の中身), 仮のdir(配布物の中身));
    expect(r.比べた数).toBe(3);
  });

  it("入れ子の file も数える", () => {
    expect(fileを並べる(仮のdir(配布物の中身))).toContain("dist/render-AAA.d.ts");
  });
});

describe("3 種の差をそれぞれ検知する (#1456)", () => {
  it("余分 = 手元で書き加わった (#1448 の形)", () => {
    const 実物 = 仮のdir({ ...配布物の中身, "dist/render-BBB.d.ts": "type B = 2;\n" });
    const r = 中身を突き合わせる(仮のdir(配布物の中身), 実物);
    expect(r.余分).toEqual(["dist/render-BBB.d.ts"]);
    expect(r.欠け).toEqual([]);
    expect(r.中身違い).toEqual([]);
  });

  it("欠け = 手元で消えた", () => {
    const { "dist/render-AAA.d.ts": _外す, ...残り } = 配布物の中身;
    const r = 中身を突き合わせる(仮のdir(配布物の中身), 仮のdir(残り));
    expect(r.欠け).toEqual(["dist/render-AAA.d.ts"]);
    expect(r.余分).toEqual([]);
  });

  it("中身違い = 手元で書き換わった", () => {
    const 実物 = 仮のdir({ ...配布物の中身, "dist/index.js": "export const a = 999;\n" });
    const r = 中身を突き合わせる(仮のdir(配布物の中身), 実物);
    expect(r.中身違い).toEqual(["dist/index.js"]);
    expect(r.余分).toEqual([]);
    expect(r.欠け).toEqual([]);
  });

  it("大きさが同じで中身が違う形も検知する", () => {
    // 大きさで比べる実装だと通り抜ける
    const 実物 = 仮のdir({ ...配布物の中身, "dist/index.js": "export const a = 2;\n" });
    expect(中身を突き合わせる(仮のdir(配布物の中身), 実物).中身違い).toEqual(["dist/index.js"]);
  });
});

describe("dir の外は見ない (#1456)", () => {
  it("symlink を辿らない", () => {
    // 辿ると dir の外の中身を比べることになる
    const 外 = 仮のdir({ "秘密.txt": "外の中身\n" });
    const 実物 = 仮のdir(配布物の中身);
    symlinkSync(join(外, "秘密.txt"), join(実物, "link.txt"));
    const 並び = fileを並べる(実物);
    expect(並び, "symlink を数えている").not.toContain("link.txt");
    expect(並び.length).toBe(3);
  });
});

describe("結果の文 (#1456)", () => {
  const 一致 = () => 中身を突き合わせる(仮のdir(配布物の中身), 仮のdir(配布物の中身));

  it("一致した時は件数を添える", () => {
    expect(結果を文にする("x", "1.0.0", 一致())).toContain("一致 (3 file)");
  });

  it("違う時は次の一手を添える", () => {
    // 原因だけ言われても読み手は動けない (#1454 と同じ)
    const 実物 = 仮のdir({ ...配布物の中身, "dist/render-BBB.d.ts": "type B = 2;\n" });
    const 文 = 結果を文にする("x", "1.0.0", 中身を突き合わせる(仮のdir(配布物の中身), 実物));
    expect(文).toContain("公開されている中身と違います");
    expect(文).toContain("pnpm install --force");
    expect(文).toContain("手元で書き加わった");
  });

  it("比べた数が 0 の時は「一致」 と言わない", () => {
    // 展開に失敗して 0 file を比べた run が「一致」 として通ると、検知が空洞になる
    const 文 = 結果を文にする("x", "1.0.0", 中身を突き合わせる(仮のdir({}), 仮のdir({})));
    expect(文).toContain("比べられていません");
    expect(文).not.toContain("一致 (");
  });
});
