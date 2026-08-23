import { describe, it, expect } from "vitest";
import { textDslToDiagram, jsonToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";

/**
 * 「Text DSL」 のページで記法がコードタブに出ることの検査 (#1365)。
 *
 * このページは「記法で書くと図になる」 ことを見せる場所なのに、記法が画面に出ていなかった。
 * 図は記法の文字列から組み立てているので文字列は元からあり、`sourceYaml__<key>` として
 * export していないだけだった (コードタブはその名前で拾う)。
 *
 * **記法と図が同じ元から出ていること** をここで見る。 別々に持つと、記法を直しても図が
 * 変わらない (あるいはその逆) 状態が生まれ、見せている記法が嘘になる。
 */

/** 図として扱える export */
const 図の一覧 = (mod: Record<string, unknown>): { key: string; diagram: CdlDiagram }[] => {
  const out: { key: string; diagram: CdlDiagram }[] = [];
  for (const [key, v] of Object.entries(mod)) {
    if (v && typeof v === "object" && "id" in v && "nodes" in v && "phases" in v) {
      out.push({ key, diagram: v as CdlDiagram });
    }
  }
  return out;
};

/** その key の記法 */
const 記法 = (mod: Record<string, unknown>, key: string): string | undefined => {
  const v = mod[`sourceYaml__${key}`];
  return typeof v === "string" ? v : undefined;
};

describe("Text DSL のページは記法を持つ (#1365)", () => {
  const 図 = 図の一覧(textDsl as Record<string, unknown>);

  it("図を 13 件集められている", () => {
    // 件数を固定する = 図が増えた時に、記法を足す前に気付ける
    expect(図.map((x) => x.key).sort()).toHaveLength(13);
  });

  it("13 件すべてが記法を持つ", () => {
    const 無い = 図
      .filter((x) => 記法(textDsl as Record<string, unknown>, x.key) === undefined)
      .map((x) => x.key);
    expect(無い, "記法を持たない図がある (コードのタブが押せない)").toEqual([]);
  });

  it("記法から組み立てた図が、export された図と一致する", () => {
    /*
     * **同じ元から出ていること** を見る。 記法と図を別々に持つと、記法を直しても図が変わらない
     * (あるいはその逆) 状態になり、見せている記法が嘘になる。
     */
    let 照合した = 0;
    for (const { key, diagram } of 図) {
      const src = 記法(textDsl as Record<string, unknown>, key);
      if (src === undefined) continue;
      照合した += 1;
      expect(textDslToDiagram(src), `${key} の記法から組み立てた図が export と違う`).toEqual(
        diagram,
      );
    }
    expect(照合した, "1 件も照合していない (検査が空振りしている)").toBe(13);
  });

  it("13 件すべてが JSON の記法も持つ", () => {
    /*
     * この repo は「YAML を持つ見本は JSON も持つ」 を不変条件にしている
     * (`catalog-source-pair.test.ts`、 #1292)。 片側だけ足すとその検査が落ちる。
     *
     * ここでも件数で固定するのは、対の検査が全ページを横断して見るのに対し、
     * **このページで何件あるべきか** を近くに残すため。
     */
    const 無い = 図
      .filter((x) => typeof (textDsl as Record<string, unknown>)[`sourceJson__${x.key}`] !== "string")
      .map((x) => x.key);
    expect(無い, "JSON の記法を持たない図がある").toEqual([]);
  });

  it("JSON の記法が読める形で、YAML と同じ図に解決される", () => {
    // 文字列に埋め込む時に壊れうる (実測 = JSON の中の改行の書き方が template literal で
    // 解釈され、1 件が読めなくなった)。 読めることと、同じ図になることを分けて見る
    let 照合した = 0;
    for (const { key, diagram } of 図) {
      const src = (textDsl as Record<string, unknown>)[`sourceJson__${key}`];
      expect(typeof src, `${key} の JSON が無い`).toBe("string");
      const 読めた = JSON.parse(src as string) as unknown;
      照合した += 1;
      expect(jsonToDiagram(読めた), `${key} の JSON から組み立てた図が export と違う`).toEqual(
        diagram,
      );
    }
    expect(照合した, "1 件も照合していない (検査が空振りしている)").toBe(13);
  });

  it("引用符の中のカンマを補足の一部として保つ", () => {
    /*
     * inline mapping は引用符の中でもカンマを項目区切りとして扱う。 見本でその形を使うと、
     * YAML と JSON が同じ壊れ方をして上の図全体の比較を通ってしまうため、見える値も固定する。
     */
    const yamlDiagram = textDslToDiagram(textDsl.sourceYaml__textDslCode);
    const jsonDiagram = jsonToDiagram(JSON.parse(textDsl.sourceJson__textDslCode) as unknown);
    for (const diagram of [yamlDiagram, jsonDiagram]) {
      expect(diagram.nodes.find((node) => node.title === "OrderCreated")?.subtitle).toBe(
        "orderId, total",
      );
    }
  });

  it("記法に段の指定がそのまま出ている", () => {
    // コードタブに出す以上、画面の動きを決めている行が記法にも見えている必要がある。
    // #1364 で足した 3 件の `draw:` が読めることを確かめる
    const 描く = ["textDslGantt", "textDslPie", "textDslMind"] as const;
    for (const key of 描く) {
      const src = 記法(textDsl as Record<string, unknown>, key);
      expect(src, `${key} の記法が無い`).toBeDefined();
      expect(src, `${key} の記法に draw: が出ていない`).toMatch(/^\s*draw:\s*\S+\s*$/m);
    }
  });
});

describe("記法を持たない図では従来どおり (陰性対照、 #1365)", () => {
  it("記法を持たないページの図は記法が引けない", () => {
    /*
     * 「どの図でも引ける」 形なら、上の検査は通っても意味を持たない。
     * 記法を登録していないページでは `undefined` のままであることを見る。
     */
    // `cookbook` は記法を 1 件も登録していないページ (実測)。
    // `primitives` / `presets` / `charts` は登録しているので対照にならない
    const mod = cookbook as Record<string, unknown>;
    const 図 = 図の一覧(mod);
    expect(図.length, "比べる図が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);

    const 引けた = 図.filter((x) => 記法(mod, x.key) !== undefined).map((x) => x.key);
    expect(引けた, "記法を登録していないページで記法が引けている").toEqual([]);
  });

  it("記法を持つページでは引ける (陽性対照)", () => {
    // 上は 0 件を見る検査なので、引ける側も確かめる = 引き方そのものが壊れたら気付く
    const mod = presets as Record<string, unknown>;
    const 図 = 図の一覧(mod);
    const 引けた = 図.filter((x) => 記法(mod, x.key) !== undefined);
    expect(引けた.length, "記法を持つページで 1 件も引けていない").toBeGreaterThan(0);
  });
});
