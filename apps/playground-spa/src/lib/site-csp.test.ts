import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { HtmlTagDescriptor, IndexHtmlTransformContext } from "vite";

import { CSPの決まり, createCspMetaPlugin } from "../../vite-csp";

/**
 * 公開 site が読み込んでよい場所を絞る (#2956)。
 *
 * 決まりの中身と、それが build の時だけ `index.html` に入ることを見る。 画面が実際に
 * 違反を出さないことは `tests/csp-no-violation.spec.ts` がブラウザで確かめる。
 */
const root = resolve(__dirname, "../../../..");

/** `a b; c d` を `{ a: ["b"], c: ["d"] }` に分ける */
function 項目に分ける(決まり: string): Record<string, string[]> {
  return Object.fromEntries(
    決まり
      .split(";")
      .map((x) => x.trim())
      .filter((x) => x !== "")
      .map((x) => {
        const [名前, ...値] = x.split(/\s+/u);
        return [名前, 値];
      }),
  );
}

describe("公開 site の CSP (#2956)", () => {
  const 項目 = 項目に分ける(CSPの決まり);

  it("script は自分の置き場だけで、inline と eval を許さない", () => {
    expect(項目["script-src"]).toEqual(["'self'"]);
  });

  it("既定・通信先・送信先・基準の URL は自分の置き場だけ、埋め込みの plugin は使わない", () => {
    expect(項目["default-src"]).toEqual(["'self'"]);
    expect(項目["connect-src"]).toEqual(["'self'"]);
    expect(項目["form-action"]).toEqual(["'self'"]);
    expect(項目["base-uri"]).toEqual(["'self'"]);
    expect(項目["object-src"]).toEqual(["'none'"]);
  });

  it("枠の制限を書かない (meta では効かず、埋め込みを許す方針)", () => {
    expect(項目).not.toHaveProperty("frame-ancestors");
  });

  it("差し込みは build の時だけ当たる (開発 server は inline の script を使う)", () => {
    expect(createCspMetaPlugin().apply).toBe("build");
  });

  it("差し込む meta が決まりをそのまま持ち、head の先頭に入る", () => {
    const plugin = createCspMetaPlugin();
    const 差し込み = plugin.transformIndexHtml as (
      html: string,
      ctx: IndexHtmlTransformContext,
    ) => HtmlTagDescriptor[];
    const tags = 差し込み("", {} as IndexHtmlTransformContext);
    expect(tags).toEqual([
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: CSPの決まり },
        injectTo: "head-prepend",
      },
    ]);
  });

  it("index.html が referrer を置き場の名前だけに絞る", () => {
    const html = readFileSync(resolve(root, "apps/playground-spa/index.html"), "utf8");
    expect(html).toMatch(/<meta\s+name="referrer"\s+content="strict-origin-when-cross-origin"\s*\/?>/u);
  });

  it("vercel が全ての path に nosniff を返す", () => {
    const v = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8")) as {
      headers?: { source: string; headers: { key: string; value: string }[] }[];
    };
    const 全て = v.headers?.find((h) => h.source === "/(.*)");
    expect(全て, "全ての path に当たる headers が無い").toBeTruthy();
    expect(全て!.headers).toContainEqual({ key: "X-Content-Type-Options", value: "nosniff" });
  });
});
