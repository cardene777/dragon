/**
 * 公開する頁の build の結果 (#2995)。
 *
 * build した頁の大きさと、最初に読む script の中身と、CSP と、経路の写しを、頁を開かずに確かめる (#3585)。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import { KINDS } from "../catalog/catalog";
import { PARTS } from "../catalog/parts";
import { PATHS } from "../site/routes";
import { builtDir, bundleSizes, firstLoadFiles, pageSources } from "./playground-support";

/** 画面の経路 (頁の置き場の後ろ)。帯の行き先の経路の表と、カタログの分類から導く (#3157) */
const screenRoutes = (): string[] => {
  const relative = (path: string): string => path.slice(PATHS.home.length);
  return [
    ...Object.values(PATHS).map(relative).filter((path) => path !== ""),
    ...KINDS.map((kind) => `${relative(PATHS.catalog)}/${kind}`),
    ...PARTS.map((part) => `${relative(PATHS.catalog)}/part/${part.id}`),
  ].sort();
};

describe("公開する頁 (#2995)", () => {

  // 上限は 250KB で始め、#3199 で 270KB にした。図の種類が 5 つになり、記法の語ごとに全ての図の種類と 2 つの言葉の
  // 見本帳の部品を置く決まりのため、語を 1 つ足すと 1KB ほど増える。#3199 の前の main で残りが 1.3KB しか無かった。
  // #3239 で 290KB にした。列の図を足すと 266.2KB から 277.6KB に増える (検査の関数 3.5KB、部品と見本の記法 5KB、描く部品 3KB)
  // #3246 で、上限を頁が最初に読む script と CSS に当てる形にした。見本と部品の図の記法は後から読む塊に分け、
  // 全部の塊の合計は分けてもほぼ減らないので上限を当てず、前の記録と同じ数え方で比べられるよう落ちた時の文に並べる
  it("page-bundle-within-budget", () => {
    const sizes = bundleSizes(builtDir());
    const first = firstLoadFiles(builtDir());
    const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)}KB`;
    const sum = (names: string[]): number => names.reduce((a, name) => a + (sizes[name] ?? 0), 0);
    const all = sum(Object.keys(sizes));
    const loaded = sum(first);
    expect(first.length, "build した頁が最初に読む script と CSS が無い").toBeGreaterThan(0);
    expect(first.filter((name) => sizes[name] === undefined), "最初に読む file が build の assets に無い").toEqual([]);
    const report = `最初に読む script と CSS が gzip で ${kb(loaded)} (${JSON.stringify(Object.fromEntries(first.map((name) => [name, sizes[name]])))})、全部の塊の合計が ${kb(all)}`;
    expect(loaded, report).toBeLessThanOrEqual(290 * 1024);
    // 種類の描く部品を後から読む形 (#3248) と、使い方とカタログの頁を後から読む形 (#3280) にした分を確かめる。
    // #3280 の前の実測は 226.8KB で後の実測は 203.0KB。#3292 で字の `@font-face` を外して 168.5KB にした。#3248 の時と同じく余裕を約 10KB 残す。
    // 列の図の見直し (#3354) で 178.8KB になり、原本の版2 (#3346) の組み直しと版1の移しがどの頁でも最初に要るので 180.3KB になった。
    // 版1を読む処理はその場で答えを返すため後から読めず、上限を 181KB に上げた。図が使うブロックだけを読む軽い入口 (#3349) で下げる
    // 試す図 (#3337) の記法を読む処理と形の検査はほかの種類と同じく最初に要り、191.8KB になったので、本人が選んで上限を 193KB に上げた
    // 図が使うブロックだけを読む軽い入口 (#3349) で、後から読む種類の個別ブロックの読み方が最初の script から抜けて 181.1KB になった。余裕を約 10KB 残して上限を 191KB に下げた
    // 記法から読んだ図は描く時に原本の形の検査を省き、検査は原本の JSON を描く時だけ後から読むので、上限を 10KB 下げて 181KB にした (#3400)
    // 狭い枠で配管の図を読める大きさから始める処理 (#3483) が置いた時に要り、181.1KB になったので、本人が選んで上限を 182KB に上げた
    expect(loaded, report).toBeLessThanOrEqual(182 * 1024);
    // 分ける前は最初に読む量が全部の合計と同じだった (0.44.0 の後の main で 277.59KB)。見本と部品の図の記法は gzip で 20KB を超えるので、
    // 外せば全部の合計より 20KB 以上小さくなる
    expect(all - loaded, report).toBeGreaterThanOrEqual(20 * 1024);
  });

  // 崩れの検査 (#3484) は `dragon check --layout` と `checkLayoutText` だけが使う。描くだけの頁が最初に読むと、
  // 使わない部品の分だけ上の上限を押し上げるので、崩れの種類の名前で最初の script に入っていないことを確かめる (#3494)
  it("first-load-carries-no-layout-check", () => {
    const first = firstLoadFiles(builtDir())
      .filter((name) => name.endsWith(".js"))
      .map((name) => readFileSync(join(builtDir(), "assets", name), "utf8"))
      .join("\n");
    expect(first.length, "build した頁が最初に読む script が無い (走査の空振り)").toBeGreaterThan(0);
    // 枠に沿って近すぎる線と枠に接する字 (#3526) も、崩れの確かめだけが持つ
    const kinds = [
      "badges-close",
      "lines-close",
      "badge-off-shape",
      "slot-outside-shape",
      "text-outside-shape",
      "part-outside-frame",
      "panel-edge",
      "label-off-line",
      "label-on-line",
      "label-on-frame",
      "title-outside-ring",
      "line-crosses-text",
      "chip-over-part",
      "pipe-behind-box",
      "pipes-merged",
      "valve-near-pipe",
      "line-near-border",
      "text-touches-border",
      "badge-on-frame",
    ];
    expect(
      kinds.filter((kind) => first.includes(`"${kind}"`) || first.includes(`'${kind}'`) || first.includes(`\`${kind}\``)),
      "最初に読む script に在る崩れの種類の名前",
    ).toEqual([]);
  });

  // 部品の説明 (各ブロックの `gallery/desc.ts`) は部品の頁だけが見せる。最初に読む script に入ると、日英で 100 件を超える字が
  // gzip で 7KB ほど上の上限を押し上げるので、どの説明の字も最初の script に入っていないことを確かめる (#3531)
  it("first-load-carries-no-part-desc", async () => {
    const blocks = join(__dirname, "../../../../packages/dragon/src/blocks");
    const files = readdirSync(blocks)
      .map((name) => join(blocks, name, "gallery", "desc.ts"))
      .filter((path) => existsSync(path));
    const descs = (
      await Promise.all(files.map(async (path) => Object.values(((await import(/* @vite-ignore */ path)) as { desc: Record<string, string> }).desc)))
    ).flat();
    expect(descs.length, "部品の説明の字を数えられない (gallery/desc.ts が無い)").toBeGreaterThan(0);
    const first = firstLoadFiles(builtDir())
      .filter((name) => name.endsWith(".js"))
      .map((name) => readFileSync(join(builtDir(), "assets", name), "utf8"))
      .join("\n");
    expect(first.length, "build した頁が最初に読む script が無い (走査の空振り)").toBeGreaterThan(0);
    expect(
      descs.filter((desc) => first.includes(desc) || first.includes(JSON.stringify(desc).slice(1, -1))).map((desc) => desc.slice(0, 40)),
      "最初に読む script に在る部品の説明の字",
    ).toEqual([]);
    // 外した字が最初の script をどれだけ軽くしたか。説明の字を足して gzip で比べる
    const gz = (text: string): number => gzipSync(Buffer.from(text)).length;
    expect(gz(`${first}\n${descs.join("\n")}`) - gz(first), "部品の説明の字を外しても、最初に読む script が gzip で 5,000 バイト軽くならない").toBeGreaterThanOrEqual(5000);
  });

  it("page-draws-with-package-parts", () => {
    const sources = pageSources();
    expect(sources.length, "頁の source が無い").toBeGreaterThan(0);
    for (const [path, text] of sources) {
      // 図を描くのは package の部品だけ。頁の側で SVG を組まない
      expect(text, `${path} が SVG を組んでいる`).not.toMatch(/createElementNS|<svg\b/u);
      // package の中の file を直に読まず、公開している入口から読む。字の入口は使い方の頁の本文が `` ` `` で囲んで名指す (#3155)。図の部品は軽い入口から読む (#3248)
      // ブロックの置き場の見本帳の分 (`packages/dragon/src/blocks/<名前>/gallery/`) と、その型 (`packages/dragon/src/blocks/gallery.ts`) だけは、見本帳が直に読む。
      // package の入口はこの分を持たないため (#3345)。型の file は型だけを持ち、棚の部品と見本を探す関数に見本帳が渡す道具の形を決める (#3350)
      expect(text, `${path} が package の中の file を直に読んでいる`).not.toMatch(/@cardenelabs\/dragon\/(?!(?:fonts|light)["'`])|packages\/dragon\/src(?!\/blocks\/(?:[^/"'`\s]+\/gallery\/|gallery["'`]))/u);
      // 既定の入口を 1 か所でも読むと、全ての種類の部品が頁に入る (型だけの読み込みは消えるので数えない)
      expect(text, `${path} が既定の入口から部品を読んでいる`).not.toMatch(/^import (?!type )[^;]*from\s+["']@cardenelabs\/dragon["']/mu);
      if (/\b(mountDiagram|renderDiagram)\b/u.test(text)) {
        // 使い方の頁の本文は、読者に既定の入口の書き方を見せる。実際に読む形は上の検査が既定の入口を止める
        expect(text, `${path} が描く部品を @cardenelabs/dragon から読んでいない`).toMatch(/from\s+["']@cardenelabs\/dragon(?:\/light)?["']/u);
      }
    }
  });


  it("page-routes-have-html-copies", () => {
    // Pages は無い path に 404 で答えるので、画面の経路ごとに頁の写しを `.html` で置いて 200 で答えさせる (#3157)。
    // 下にも経路を持つ経路 (カタログ) は、Pages が dir の側を選んだ時のために dir の `index.html` も置く
    const routes = screenRoutes();
    const parents = routes.filter((route) => routes.some((other) => other.startsWith(`${route}/`)));
    const want = [...routes.map((route) => `${route}.html`), ...parents.map((route) => `${route}/index.html`)].sort();
    const dir = builtDir();
    const copies = (readdirSync(dir, { recursive: true }) as string[]).filter((path) => path.endsWith(".html") && path !== "index.html" && path !== "404.html").sort();
    expect(copies, "build した頁の経路の写しが、経路の表とカタログの分類と部品の表から導いた一覧と違う").toEqual(want);
    const index = readFileSync(join(dir, "index.html"), "utf8");
    for (const copy of copies) expect(readFileSync(join(dir, copy), "utf8") === index, `${copy} が index.html の写しでない`).toBe(true);
  });

  it("csp-script-self-only", () => {
    const html = readFileSync(join(builtDir(), "index.html"), "utf8");
    const meta = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/u);
    expect(meta, "配る頁に CSP の meta が無い").not.toBeNull();
    // build は属性の中の引用符を文字の参照 (`&#39;`) で書く
    const content = (meta?.[1] ?? "").replaceAll("&#39;", "'").replaceAll("&quot;", '"').replaceAll("&amp;", "&");
    const directives = Object.fromEntries(
      content
        .split(";")
        .map((x) => x.trim().split(/\s+/u))
        .filter((x) => x[0])
        .map(([name, ...values]) => [name, values]),
    );
    expect(directives["script-src"], "script を自分の置き場だけにしていない").toEqual(["'self'"]);
    const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)].filter(
      ([, attrs, body]) => !/\bsrc=/u.test(attrs ?? "") || (body ?? "").trim() !== "",
    );
    expect(inline.map(([tag]) => tag), "配る頁に inline の script がある").toEqual([]);
  });

  it("site-setup-skips-without-pages", async () => {
    // build した頁の中身を読む検査の file を含まない回は、準備の段が見本帳を build しない (#3381)
    const { default: setup } = await import("./site-setup");
    const provided: Record<string, unknown> = {};
    const project = {
      vitest: {
        filenamePattern: [],
        getRelevantTestSpecifications: () => Promise.resolve([{ moduleId: join(process.cwd(), "packages/dragon/test/test-limits.test.ts") }]),
      },
      provide: (key: string, value: unknown) => {
        provided[key] = value;
      },
    };
    const teardown = await setup(project as unknown as Parameters<typeof setup>[0]);
    try {
      expect(provided.dragonSites, "build した頁を読まない回に build した").toEqual({});
    } finally {
      teardown();
    }
  });
});
