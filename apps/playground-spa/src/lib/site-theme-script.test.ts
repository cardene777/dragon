/**
 * 描く前に意匠を html へ付ける外部 script (#2962)。
 *
 * 画面は React が描くので、React が意匠を読むまでの間は値の表が当たらず、別の色で 1 度描かれる。
 * 公開の頁は CSP が `script-src 'self'` (#2956) で inline の script を許さないため、`public/` に置いた
 * 外部 script を `index.html` の頭で読み、本体より先に `data-site-theme` を付ける。
 *
 * script は束ねられずにそのまま配られるので、記法の `THEMES` を import できない。
 * 名前の一覧は script が自分で持ち、ここで `THEMES` と突き合わせる。
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";
import { THEMES } from "@cardenelabs/dragon";

const 置き場 = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const script = readFileSync(resolve(置き場, "public/site-theme.js"), "utf8");
const indexHtml = readFileSync(resolve(置き場, "index.html"), "utf8");

type 走らせた結果 = {
  属性: Map<string, string>;
  読んだ鍵: string[];
  消した鍵: string[];
};

/** script を、住所と保存の場所だけを持つ空の頁で 1 回走らせる */
function 走らせる(住所: string, 保存: Record<string, string> = {}): 走らせた結果 {
  const 属性 = new Map<string, string>();
  const 読んだ鍵: string[] = [];
  const 消した鍵: string[] = [];
  const 中身 = new Map(Object.entries(保存));
  runInNewContext(script, {
    URL,
    location: { href: 住所 },
    document: {
      documentElement: {
        setAttribute: (名前: string, 値: string) => 属性.set(名前, 値),
      },
    },
    localStorage: {
      getItem: (鍵: string) => {
        読んだ鍵.push(鍵);
        return 中身.get(鍵) ?? null;
      },
      removeItem: (鍵: string) => {
        消した鍵.push(鍵);
        中身.delete(鍵);
      },
    },
  });
  return { 属性, 読んだ鍵, 消した鍵 };
}

describe("描く前に意匠を付ける外部 script (#2962)", () => {
  it("`?theme=` を付けずに開くと活版を付ける", () => {
    expect(走らせる("https://example.test/dragon/").属性.get("data-site-theme")).toBe("letterpress");
  });

  it.each(THEMES.map((意匠) => [意匠]))("`?theme=%s` で開くとその名前を付ける", (意匠) => {
    expect(走らせる(`https://example.test/dragon/editor?theme=${意匠}`).属性.get("data-site-theme")).toBe(意匠);
  });

  it.each([["kinari"], ["dark"], ["%3Cscript%3E"]])("記法に無い名前 `%s` は活版を付ける", (名前) => {
    expect(走らせる(`https://example.test/?theme=${名前}`).属性.get("data-site-theme")).toBe("letterpress");
  });

  it("保存した値を 1 つも読まない", () => {
    expect(走らせる("https://example.test/", { "dragon-locale": "en" }).読んだ鍵).toEqual([]);
  });

  it("明暗を残した古い保存の値を 1 つだけ消す", () => {
    expect(走らせる("https://example.test/").消した鍵).toHaveLength(1);
  });

  it("消すのは言語の保存ではない", () => {
    expect(走らせる("https://example.test/").消した鍵).not.toContain("dragon-locale");
  });
});

describe("index.html は外部 script だけで意匠を付ける (#2962)", () => {
  const scripts = [...indexHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map((m) => ({
    属性: m[1] ?? "",
    中身: (m[2] ?? "").trim(),
    位置: m.index ?? 0,
  }));

  it("script を 1 つ以上読んでいる (検査が空振りしていない)", () => {
    expect(scripts.length).toBeGreaterThan(0);
  });

  it("中身を直に書いた script が 0 件", () => {
    expect(scripts.filter((s) => s.中身 !== "").map((s) => s.属性)).toEqual([]);
  });

  it("`site-theme.js` を読む script が頭の中にある", () => {
    const 頭の終わり = indexHtml.indexOf("</head>");
    const 意匠 = scripts.find((s) => /src="[^"]*site-theme\.js"/.test(s.属性));
    expect(意匠 !== undefined && 意匠.位置 < 頭の終わり).toBe(true);
  });

  it("`site-theme.js` は後回しにされず、本体の script より先に走る", () => {
    const 意匠 = scripts.find((s) => /src="[^"]*site-theme\.js"/.test(s.属性));
    const 本体 = scripts.find((s) => /type="module"/.test(s.属性));
    expect(
      意匠 !== undefined && 本体 !== undefined && 意匠.位置 < 本体.位置 && !/\b(defer|async|type="module")/.test(意匠.属性),
    ).toBe(true);
  });
});

describe("script が持つ名前の一覧は記法の `THEMES` と同じ (#2962)", () => {
  it("script に書いた名前の並びが `THEMES` と同じ (記法に意匠が増えたら落ちる)", () => {
    const 並び = /\[((?:\s*"[a-z]+"\s*,?)+)\]/.exec(script)?.[1] ?? "";
    expect([...並び.matchAll(/"([a-z]+)"/g)].map((m) => m[1])).toEqual([...THEMES]);
  });
});
