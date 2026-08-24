/**
 * どのページが記法を持つかを台帳として固定する (#1371)。
 *
 * 見本帳は 11 ページあり、記法 (`sourceYaml` / `sourceJson`) を持つページはまだ一部しかない。
 * 記法があるページだけ画面に「コード」 のタブが出て「エディタで開く」 が押せる。
 *
 * ## 数を書かない
 *
 * 「N ページが対応済」 のような数を書くと実物とずれる (`rules/quality.md`)。 ここに置くのは
 * **ページ名の割り振り** だけで、件数は実物から数える。
 *
 * ## 3 つに割り振る
 *
 * | 区分 | 意味 |
 * |---|---|
 * | 揃った | そのページの見本が全件 YAML と JSON を持つ |
 * | 一部 | 1 件以上持つが全件ではない |
 * | まだ | 1 件も持たない |
 *
 * 割り振りは **和がページ全体と一致すること** を検査する。 ページを足した時に、
 * どの区分に入るかの判断を必ず通る = 新しいページが黙って「まだ」 に埋もれない。
 *
 * 区分そのものも検査する = 「まだ」 に書いたページが記法を持ち始めたら落ちる。
 * 書き終えたのに台帳を動かし忘れる形を止める。
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";

/** 全件が YAML と JSON を持つページ */
const 揃ったページ = [
  "presets",
  "patterns",
  "charts",
  "text-dsl",
  "styles",
  "primitives",
  "cookbook",
  "animation",
  "ethereum",
  "parts",
] as const;

/**
 * 一部だけ持つページ。
 *
 * **なぜ全件でないか** を 1 ページずつ書く。 書かないと「まだ書いていない」 と
 * 「書けない」 が区別できず、残りを埋める時にどちらを相手にしているか分からない。
 *
 * **`interactive` が唯一**。 記法は図を書くためのもので、図の値が動く仕掛けの一部を
 * 持たない。 #1389 でつまみ (`inputs:`) を足し、それだけが理由だった見本は全て埋めた。
 *
 * 残るのは以下。 **件数は書かない** (上の「数を書かない」 と同じ理由で、実物からしか
 * 正しく数えられない)。
 *
 * | まだ書けない理由 | 記法側に足りないもの |
 * |---|---|
 * | 式で値を導く | `values:` は `derived` になり `formulas` にならない |
 * | 押下 / 巻き上げに応じて動く | `eventBindings` / `scrollTriggers` を書く項目が無い |
 * | 箱の欄 4 つ | `wBind` / `opacity` / `renderOffsetX` / `renderOffsetY` を書けない |
 * | 縦列の並びが箱の並びで決まる | 記法は `lanes:` の並びで決める (`radialHubAndSpoke`) |
 * | 段の番号が読み直しで詰められる | 記法は書いた段をそのまま持つ (`decisionTree`) |
 * | 値が二重引用符と単引用符の両方を含む | 逃がす書き方が無い (`supportChat`) |
 *
 * **これは「まだ書いていない」 ではない**。 書ける分は埋め終わっており、残りは記法の
 * 対象を広げないと書けない。
 */
const 一部のページ: readonly string[] = ["interactive"];

/** まだ 1 件も持たないページ。 書き終えたら `揃ったページ` へ移す */
const まだのページ: readonly string[] = [];

async function ページごとの見本(): Promise<Map<string, CatalogItem[]>> {
  const m = new Map<string, CatalogItem[]>(Object.entries(CATALOG_ITEMS));
  // parts は後から読む設計なので、ここで読んで数に入れる
  m.set("parts", await loadPartsItems());
  return m;
}

const 記法あり = (i: CatalogItem): boolean => Boolean(i.sourceYaml) && Boolean(i.sourceJson);

describe("記法を持つページの台帳 (#1371)", () => {
  it("台帳の割り振りが実物のページと過不足なく一致する", async () => {
    const ページ = await ページごとの見本();
    expect(ページ.size, "ページを 1 つも集められていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    const 台帳 = [...揃ったページ, ...一部のページ, ...まだのページ].sort();
    expect(new Set(台帳).size, "台帳に同じページが 2 度出ている").toBe(台帳.length);
    expect(台帳, "台帳と実物のページが食い違っている").toEqual([...ページ.keys()].sort());
  });

  it.each(揃ったページ)("%s は全件が YAML と JSON を持つ", async (名) => {
    const items = (await ページごとの見本()).get(名) ?? [];
    expect(items.length, `${名} の見本が 1 件も無い (検査が空振りしている)`).toBeGreaterThan(0);
    expect(
      items.filter((i) => !記法あり(i)).map((i) => i.id),
      `${名} に記法の無い見本がある`,
    ).toEqual([]);
  });

  it.each(一部のページ)("%s は一部だけが記法を持つ", async (名) => {
    const items = (await ページごとの見本()).get(名) ?? [];
    expect(items.length, `${名} の見本が 1 件も無い (検査が空振りしている)`).toBeGreaterThan(0);
    const 持つ = items.filter(記法あり).length;
    expect(持つ, `${名} が 1 件も持たなくなっている。 台帳を「まだ」 へ移すこと`).toBeGreaterThan(
      0,
    );
    expect(持つ, `${名} が全件持つようになっている。 台帳を「揃った」 へ移すこと`).toBeLessThan(
      items.length,
    );
  });

  it.each(まだのページ)("%s はまだ記法を持たない", async (名) => {
    const items = (await ページごとの見本()).get(名) ?? [];
    expect(items.length, `${名} の見本が 1 件も無い (検査が空振りしている)`).toBeGreaterThan(0);
    expect(
      items.filter((i) => i.sourceYaml || i.sourceJson).map((i) => i.id),
      `${名} が記法を持ち始めている。 台帳を「一部」 か「揃った」 へ移すこと`,
    ).toEqual([]);
  });
});

/**
 * 記法を持つ file が記法の検査 (`pnpm lint:notation`) に載っていること (#1371)。
 *
 * 検査する file の一覧は root の `package.json` に手で並べてある。 **手で並べた一覧は実物と
 * ずれる** (`rules/quality.md`)。 実際 `charts.cdl.ts` は 9 件の記法を持つのに一覧から漏れて
 * いて、記法の検査を 1 度も通っていなかった。
 *
 * 一覧を実物から導く検査をここに置く = 記法を足した file が漏れたらここで落ちる。
 */
describe("記法の検査に載っている file (#1371)", () => {
  it("`sourceYaml__` を持つ catalog の file が全て `lint:notation` に並んでいる", () => {
    const ここ = dirname(fileURLToPath(import.meta.url));
    const catalog = join(ここ, "..", "topics", "catalog");
    const repo = join(ここ, "..", "..", "..", "..");

    const 記法あり = readdirSync(catalog)
      .filter((f) => f.endsWith(".cdl.ts"))
      .filter((f) => readFileSync(join(catalog, f), "utf8").includes("export const sourceYaml__"))
      .sort();
    expect(
      記法あり.length,
      "記法を持つ file を 1 つも見つけられていない (検査が空振りしている)",
    ).toBeGreaterThan(0);

    const scripts = (
      JSON.parse(readFileSync(join(repo, "package.json"), "utf8")) as {
        scripts?: Record<string, string>;
      }
    ).scripts;
    const cmd = scripts?.["lint:notation"];
    expect(cmd, "`lint:notation` が root の package.json に無い").toBeDefined();

    const 漏れ = 記法あり.filter((f) => !cmd!.includes(`catalog/${f}`));
    expect(漏れ, "記法を持つのに `lint:notation` に並んでいない file がある").toEqual([]);
  });
});
