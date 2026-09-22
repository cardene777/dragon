/**
 * 呼出側に型が届くことの検証。
 *
 * 型検査 (`tsc -b`) と束ね (`tsup`) の 2 つが d.ts を出す。 出力先が同じだと交互に上書きし、
 * `package.json` の `types` が指す中身が「最後に走った側」 で決まる。 tsc 側の index.d.ts は
 * 相対 re-export だけを持ち参照先が dist に残らないため、 呼出側で型が `any` に落ちる。
 *
 * `skipLibCheck: true` が解決できない re-export の誤りを隠すので、 型検査は通ってしまう。
 * 落ちるのは「型が効かない」 方だけなので、 気付く手掛かりが無い (実測 = editor 側で
 * dragon の関数がほぼ `any` になっていた)。
 *
 * 出力先が分かれていることは build なしで確かめられる。 束ねた d.ts の中身は build 後に
 * しか見られないので、 存在する時だけ確かめる。
 */
import { describe, it, expect } from "vitest";
import { readFile, stat } from "node:fs/promises";

const PKG = new URL("../", import.meta.url);

/** JSON with comments を読む (tsconfig は行 comment を許す)。 */
async function readJsonc(url: URL): Promise<Record<string, unknown>> {
  const raw = await readFile(url, "utf8");
  // 行 comment を落とす。 文字列中の `//` を消さないよう、 quote の中は残す
  const stripped = raw
    .split("\n")
    .map((line) => {
      let quote = false;
      for (let i = 0; i < line.length; i += 1) {
        const c = line[i]!;
        if (c === '"' && line[i - 1] !== "\\") quote = !quote;
        if (!quote && c === "/" && line[i + 1] === "/") return line.slice(0, i);
      }
      return line;
    })
    .join("\n");
  return JSON.parse(stripped) as Record<string, unknown>;
}

async function exists(url: URL): Promise<boolean> {
  try {
    await stat(url);
    return true;
  } catch {
    return false;
  }
}

describe("呼出側に型が届く", () => {
  it("型検査の出力先が束ねの出力先と別 (交互に上書きしない)", async () => {
    const tsconfig = await readJsonc(new URL("tsconfig.json", PKG));
    const opts = tsconfig.compilerOptions as Record<string, unknown>;
    const tsOut = String(opts.outDir);
    const tsup = await readFile(new URL("tsup.config.ts", PKG), "utf8");
    const tsupOut = tsup.match(/outDir:\s*"([^"]+)"/)?.[1];
    expect(tsupOut, "tsup の出力先が読めない").toBeDefined();
    expect(tsOut, "型検査と束ねが同じ場所に出している").not.toBe(tsupOut);
  });

  it("package.json の types が束ねの出力先を指す", async () => {
    const pkg = JSON.parse(await readFile(new URL("package.json", PKG), "utf8")) as {
      types: string;
      exports: Record<string, { types?: string }>;
    };
    const tsup = await readFile(new URL("tsup.config.ts", PKG), "utf8");
    const tsupOut = tsup.match(/outDir:\s*"([^"]+)"/)?.[1] ?? "dist";
    expect(pkg.types).toContain(`${tsupOut}/`);
    expect(pkg.exports["."]?.types).toContain(`${tsupOut}/`);
  });

  it("呼出側は型を源から引く (build 前でも解決できる)", async () => {
    // `package.json` の `types` は build 後にしか存在しない。 clean checkout で先に型検査すると
    // 解決できず `any` に落ちる (`skipLibCheck: true` が誤りを隠すので気付けない)
    const spa = await readJsonc(new URL("../../apps/playground-spa/tsconfig.json", PKG));
    const paths = (spa.compilerOptions as Record<string, unknown>).paths as Record<string, string[]>;
    const mapped = paths["@cardenelabs/dragon"];
    expect(mapped, "SPA が dragon の型を源から引いていない").toBeDefined();
    expect(mapped![0]).toContain("packages/dragon/src");
  });

  it("束ねた d.ts が実体を持つ (相対 re-export だけになっていない)", async (ctx) => {
    const dts = new URL("dist/index.d.ts", PKG);
    // **抜けるのではなく飛ばす** (#2500)。 裸の `return` は通ったのと見分けが付かない。
    // build 前は確かめられない (出力先の分離は上の 2 件が見ている)
    if (!(await exists(dts))) ctx.skip();
    const body = await readFile(dts, "utf8");
    // 自 package 内への相対 re-export が残っていたら、 参照先が dist に無く型が解決しない
    const relativeReExports = [...body.matchAll(/^export .* from ["']\.\/.*["'];$/gm)].map((m) => m[0]);
    expect(relativeReExports, "相対 re-export が残っている").toEqual([]);
    // 公開している主要な型と関数が実体で書かれているか
    for (const decl of [
      "declare function textDslToDiagram",
      "declare function parseFocusEntry",
      "declare function parseRelativePos",
      "declare function resolveRelativePos",
      "declare function writeActorPosition",
      "declare function measureActorBoxes",
      "declare function 部品に上書きを当てる",
      "type RelativePos",
      "type FocusEntry",
      "type CompileNotice",
    ]) {
      expect(body.includes(decl), `${decl} が束ねた d.ts に無い`).toBe(true);
    }
  });
});
