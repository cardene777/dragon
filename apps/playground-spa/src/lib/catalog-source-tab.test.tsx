/**
 * 記法の有無でコードのタブの押せる側が変わることの検査 (#1383)。
 *
 * ## なぜ実在のページを使わないか
 *
 * 「記法を持たないページではタブが押せない」 を実在のページで確かめる形は、**そのページに
 * 記法を足すたびに成立しなくなる**。 実際 3 度移した (`cookbook` は #1378、`ethereum` は
 * #1374、`parts` は #1381 で記法を持った)。
 *
 * 残るページは `interactive` だけで、そこを埋めると移し先が尽きる。 対照が「まだ埋めて
 * いないページがある」 ことに依存しているのが誤りで、埋め終わることは目標そのものだった。
 *
 * ## 代わりに何を見るか
 *
 * 押せる側は `記法を持つか` と `item.sourceYaml` / `item.sourceJson` だけで決まる。
 * 見本を検査側で組み立てれば、実在のページを介さずに両側を確かめられる。
 *
 * **片方だけ持つ見本が、消えない陰性対照になる**。 台帳
 * (`catalog-notation-coverage.test.ts`) がすべての見本に両方を要求するため、この形は実在の
 * データには決して現れない。 ページを埋めても成立しなくなることがない。
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

import { SourceTabs, 記法を持つか } from "@/pages/CategoryPage";
import type { CatalogItem } from "./catalog-items";

const 見本の図 = diagram("neg-ctl", { topic: "対照" })
  .lane("l", { x: 0, width: 200 })
  .node("a", { lane: "l", stack: 0, kind: "card", title: "A" })
  .phase("p", { duration: 1000, title: "p", body: "" }, (p: PhaseBuilder) => p.activate("a"))
  .build();

const YAML = 'title: "対照"\ntype: flow\n\nactors:\n  - A\n\nanimation:\n  - step: "p" 1s\n';
const JSON_ = '{ "title": "対照", "type": "flow" }';

/** 記法の有無だけを変えた見本を組む */
function 見本(記法: { yaml?: string; json?: string }): CatalogItem {
  return {
    id: "neg-ctl",
    title: "対照",
    subtitle: "検査が組み立てた見本",
    motionNote: "動かない",
    diagram: 見本の図,
    ...(記法.yaml !== undefined ? { sourceYaml: 記法.yaml } : {}),
    ...(記法.json !== undefined ? { sourceJson: 記法.json } : {}),
  };
}

/** タブの節を描いて、`role="tab"` のボタンを名前と押せるかで並べる */
function 描いたタブ(item: CatalogItem): { 名前: string; 押せる: boolean }[] {
  const html = renderToStaticMarkup(<SourceTabs item={item} 速さ={1} 描き方="動かすだけ" />);
  return [...html.matchAll(/<button[^>]*role="tab"[^>]*>([^<]*)<\/button>/g)].map((m) => ({
    名前: (m[1] ?? "").trim(),
    押せる: !/\sdisabled(?:=|\s|>)/.test(m[0]),
  }));
}

describe("記法の有無でタブの押せる側が変わる (#1383)", () => {
  it("記法を持たない見本では節そのものを描かない (陰性対照)", () => {
    const item = 見本({});
    expect(記法を持つか(item), "記法を持たない見本が持つと判定されている").toBe(false);
    expect(
      renderToStaticMarkup(<SourceTabs item={item} 速さ={1} 描き方="動かすだけ" />),
      "記法を持たないのにタブが描かれている",
    ).toBe("");
  });

  it("両方を持つ見本では両方押せる (陽性対照)", () => {
    const タブ = 描いたタブ(見本({ yaml: YAML, json: JSON_ }));
    expect(タブ.length, "タブを 1 つも描けていない (検査が空振りしている)").toBe(2);
    expect(タブ, "両方持つのに押せないタブがある").toEqual([
      { 名前: "yaml", 押せる: true },
      { 名前: "json", 押せる: true },
    ]);
  });

  /*
   * **この 2 件が、埋め終わっても消えない陰性対照になる**。
   *
   * 台帳がすべての見本に両方を要求するため、片方だけ持つ形は実在のデータに現れない。
   * 「常に押せる」 実装に変えるとここが落ちる。
   */
  it("yaml だけを持つ見本では json が押せない", () => {
    const タブ = 描いたタブ(見本({ yaml: YAML }));
    expect(タブ.length, "タブを 1 つも描けていない (検査が空振りしている)").toBe(2);
    expect(タブ, "yaml だけ持つのに json が押せる").toEqual([
      { 名前: "yaml", 押せる: true },
      { 名前: "json", 押せる: false },
    ]);
  });

  it("json だけを持つ見本では yaml が押せない", () => {
    const タブ = 描いたタブ(見本({ json: JSON_ }));
    expect(タブ.length, "タブを 1 つも描けていない (検査が空振りしている)").toBe(2);
    expect(タブ, "json だけ持つのに yaml が押せる").toEqual([
      { 名前: "yaml", 押せる: false },
      { 名前: "json", 押せる: true },
    ]);
  });

  it("持たない側を選んだ状態では、未登録であることを画面に出す", () => {
    // 押せないタブを選べる実装に変えた時、空欄が黙って出るのではなく理由が出る
    const html = renderToStaticMarkup(
      <SourceTabs item={見本({ json: JSON_ })} 速さ={1} 描き方="動かすだけ" />,
    );
    expect(html, "初期に選ぶのは yaml のはず").toContain("(この記法の source は未登録です)");
  });
});

describe("記法を持つかの判定 (#1383)", () => {
  const 表: readonly [string, { yaml?: string; json?: string }, boolean][] = [
    ["どちらも無い", {}, false],
    ["yaml だけ", { yaml: YAML }, true],
    ["json だけ", { json: JSON_ }, true],
    ["両方", { yaml: YAML, json: JSON_ }, true],
  ];

  it.each(表)("%s", (_名, 記法, 期待) => {
    expect(記法を持つか(見本(記法))).toBe(期待);
  });

  it("見本そのものが無い間も落ちない", () => {
    /*
     * `parts` は一覧を後から読むため、選んでいる見本が `null` の時間がある。
     * ここを受けずに呼出側で分ける形にしていたら、その間だけ画面全体が落ちた
     * (実測 = `Cannot read properties of null (reading 'sourceYaml')` で一覧が空になった)。
     */
    expect(記法を持つか(null)).toBe(false);
    expect(記法を持つか(undefined)).toBe(false);
  });

  it("空文字は持たないものとして扱う", () => {
    // 記法を出す経路が空を返した時に「持っている」 と判定すると、空のコード欄が出る
    expect(記法を持つか({ sourceYaml: "", sourceJson: "" })).toBe(false);
  });

  it("4 通りすべてを見ている (検査が空振りしていない)", () => {
    expect(表.length, "組合せを 1 つも見ていない").toBe(4);
    expect(new Set(表.map(([名]) => 名)).size, "同じ組合せを 2 度書いている").toBe(4);
  });
});

describe("陰性対照が実在ページに依存していない (#1383)", () => {
  /**
   * 実在ページを名指しする形へ戻っていないことを、実物から数える。
   *
   * 見るのは、実在の route や一覧から陰性対照を選び「コードのタブが押せない」 と主張する
   * 形。 記法を持たない見本を検査内で組み立てて画面へ渡す形は、ページを埋めても壊れない。
   */
  const 画面の検査 = (): { 名: string; 中身: string }[] => {
    const ここ = dirname(fileURLToPath(import.meta.url));
    const dirs = [join(ここ, "../../tests"), join(ここ, "../pages")];
    return dirs.flatMap((dir) =>
      readdirSync(dir)
        .filter(
          (f) =>
            f.endsWith(".spec.ts") ||
            f.endsWith(".spec.tsx") ||
            f.endsWith(".test.ts") ||
            f.endsWith(".test.tsx"),
        )
        .map((f) => ({ 名: join(dir, f), 中身: readFileSync(join(dir, f), "utf8") })),
    );
  };

  it("画面の検査が実在ページを陰性対照にしていない", () => {
    const files = 画面の検査();
    expect(files.length, "画面の検査を 1 件も読めていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );

    // E2E の実在 route 指定と、SSR unit test の実在一覧からの探索を探す。
    // `disabled` の検査自体は、合成 fixture を画面へ渡すなら消えない対照として使える
    const 実在ページに依存する主張 = [
      /page\.goto\(\s*["']\/catalog\/[^"']+["'][\s\S]{0,500}?name:\s*["']コード["'][\s\S]{0,200}?toBeDisabled/,
      /Object\.entries\(CATALOG_ITEMS\)\.find\([\s\S]{0,300}?記法を持たない/,
    ];
    const 見つけた = files
      .filter((f) => 実在ページに依存する主張.some((pattern) => pattern.test(f.中身)))
      .map((f) => f.名);
    expect(
      見つけた,
      "押せない側を画面の検査で見ている。 実在ページ依存に戻っている (#1383)",
    ).toEqual([]);
  });

  it("押せない側を見る検査が本 file にある (裏返しの確認)", () => {
    // 上は 0 件を見る検査なので、押せない側がどこかで見られていることも確かめる
    const 本file = readFileSync(fileURLToPath(import.meta.url), "utf8");
    expect(本file, "押せない側を見る検査が消えている").toContain("押せる: false");
  });
});
