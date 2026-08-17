/**
 * 記法に書ける項目と依存の版が `CHANGELOG.md` に載っていることの検査 (#1206)。
 *
 * `values:` が記法に入ったのは `912ae68` (#1163)。 `CHANGELOG.md` はその後 `4dc4583` (#1176) で
 * 1 度更新されているのに、**主題である `values:` / `states:` を 1 度も書いていなかった**
 * (実測で出現 0 件、17 commit 分)。
 *
 * 更新が止まったのではなく、**更新したのに主題を落とした**形になる。 `#1176` は放射状の図の
 * 後片付けで、その PR の視点からは `values` は無関係に見える。 commit 単位の trigger では拾えない。
 *
 * そこで「記法に書ける項目」 と「依存の版」 の 2 つを実物から導いて突き合わせる。
 * どちらも人が数えて書くと必ずずれる値で、`packages/dragon/test/top-level-keys.test.ts` が
 * `TOP_LEVEL_KEYS` に対して既に同じ形を採っている。
 */
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { TOP_LEVEL_KEYS } from "../src/index";

const CHANGELOG_URL = new URL("../../../CHANGELOG.md", import.meta.url);
const PKG_URL = new URL("../package.json", import.meta.url);

const CHANGELOG = readFileSync(CHANGELOG_URL, "utf8");

/** Markdown の code span だけを取り出す。 通常の文章に同じ語があるだけでは記載済みにしない。 */
function codeSpans(markdown: string): Set<string> {
  return new Set([...markdown.matchAll(/`([^`\n]+)`/g)].map((m) => m[1] ?? ""));
}

const CHANGELOGのcodeSpans = codeSpans(CHANGELOG);

/**
 * `CHANGELOG.md` に記載が無いまま受け入れる項目。
 *
 * この 3 つは `CHANGELOG.md` が作られる前から記法にあり、載せるべき版が既に過ぎている。
 * 遡って書くと、実際には無かった変更を歴史に足すことになる。
 *
 * **新しく足す項目をここに入れて逃げない**。 入れると diff に残るので、review で気付ける。
 */
const 記載が無い既知の項目 = new Set(["actors", "lanes", "groups"]);

function cdlの依存版(): string {
  const pkg = JSON.parse(readFileSync(PKG_URL, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const v = deps["@cardenelabs/cdl"];
  if (!v) throw new Error("packages/dragon/package.json に @cardenelabs/cdl の依存が無い");
  return v;
}

describe("記法の項目と依存の版が CHANGELOG に載っている (#1206)", () => {
  it("走査が空振りしていない", () => {
    // 項目が 0 件だと以下の検査が「全て通った」 として素通りする
    expect(TOP_LEVEL_KEYS.length, "TOP_LEVEL_KEYS が空 (検査が空振りしている)").toBeGreaterThan(5);
    expect(CHANGELOG.length, "CHANGELOG.md が空 (検査が空振りしている)").toBeGreaterThan(100);
  });

  it("既知の空白は今も記法にある項目だけ", () => {
    // 記法から消えた項目が空白の一覧に残ると、その分だけ検査が緩む
    const 記法にある = new Set<string>(TOP_LEVEL_KEYS);
    const 迷子 = [...記載が無い既知の項目].filter((k) => !記法にある.has(k));
    expect(迷子, "記法に無い項目が既知の空白に残っている").toEqual([]);
  });

  it("通常の文章や長い値の一部を記載済みにしない", () => {
    const spans = codeSpans("type: と ^0.7.0 と `prototype:` と `^0.7.0-next.1`");
    expect(spans.has("prototype:")).toBe(true);
    expect(spans.has("type:")).toBe(false);
    expect(spans.has("^0.7.0")).toBe(false);
  });

  it.each(TOP_LEVEL_KEYS.filter((k) => !記載が無い既知の項目.has(k)))(
    "%s が CHANGELOG に載っている",
    (key) => {
      // 記法として載せた項目だけを見る。 通常の文章や別の識別子に同じ語があっても通さない
      const 出現 = CHANGELOGのcodeSpans.has(`${key}:`);
      expect(出現, `記法の項目 "${key}" が CHANGELOG.md に 1 度も出てこない`).toBe(true);
    },
  );

  it("cdlの依存版が CHANGELOG に載っている", () => {
    const v = cdlの依存版();
    expect(
      CHANGELOGのcodeSpans.has(v),
      `packages/dragon/package.json の @cardenelabs/cdl (${v}) が CHANGELOG.md に出てこない`,
    ).toBe(true);
  });
});
