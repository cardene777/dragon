/**
 * 起点から描く見本で、段の長さが揃っていることの検証 (#1440)。
 *
 * `描き直す` (`redraw-mode.ts`) を選ぶと 1 段目の `draw` が 2 段目以降へ写され、その段でも
 * 起点から描き直される。 ところが **伸び具合は段の進みそのもの** で決まる = 描画側は段の
 * 進み 0→1 を `strokeDashoffset` や角度に直接使い、段の長さと別の「描く時間」 を持たない。
 *
 * 2 段目が短いままだと、同じ絵が 2.4 秒かけて描かれた後 0.9 秒で描き直される。 1 段目が
 * 作った期待を裏切るため、`draw` を持つ見本は全段を同じ長さにする。
 *
 * ## 画面の検査では 1 見本しか見ていない
 *
 * `catalog-modal-carry.spec.ts` は折れ線しか開かない。 残りの見本の長さがずれても落ちない
 * ため、ここで全件を走査する。
 *
 * ## 3 つの書き方すべてを見る
 *
 * 見本は組み立て API と YAML と JSON の 3 つで書かれている。 1 つだけ直すと、画面と
 * 「コード」 タブとエディタで別の速さになる。
 */
import { describe, it, expect } from "vitest";
import * as Presets from "@/topics/catalog/presets.cdl";

type 段 = { duration?: number; draw?: readonly string[] };
type 図 = { phases?: readonly 段[] };

const mod = Presets as unknown as Record<string, unknown>;

/** `draw` を持つ段がある見本の名前。 実物から導くので、見本が増えても追随する */
const 描く見本 = Object.keys(mod)
  .filter((k) => k.startsWith("preset"))
  .filter((k) => {
    const d = mod[k] as 図 | undefined;
    return (d?.phases ?? []).some((p) => (p.draw ?? []).length > 0);
  })
  .sort();

/** YAML の段の秒数を並び順に読む */
const yamlの秒数 = (src: string): number[] =>
  [...src.matchAll(/^[ \t]*-[ \t]*step:[ \t]*"[^"]*"[ \t]+(\d+(?:\.\d+)?)s[ \t]*$/gm)].map((m) =>
    Number(m[1]),
  );

/** JSON の段の秒数を並び順に読む */
const jsonの秒数 = (src: string): number[] =>
  [...src.matchAll(/"duration":\s*(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));

describe("起点から描く見本の段の長さ (#1440)", () => {
  it("対象の見本が 1 件以上ある (検査が空振りしていない)", () => {
    // 走査した結果が空だと、以下の検査は assert に届かず必ず通る
    expect(描く見本.length, "`draw` を持つ見本を 1 つも見つけられていない").toBeGreaterThan(0);
  });

  it("組み立て API で全段が同じ長さになる", () => {
    const ずれ: string[] = [];
    for (const 名 of 描く見本) {
      const 段群 = (mod[名] as 図).phases ?? [];
      const 描く段 = 段群.find((p) => (p.draw ?? []).length > 0);
      const 期待 = 描く段?.duration;
      expect(期待, `${名} の描く段に長さが無い`).toBeDefined();
      const 長さ = 段群.map((p) => p.duration);
      if (長さ.some((v) => v !== 期待)) ずれ.push(`${名}: ${JSON.stringify(長さ)} (描く段は ${期待})`);
    }
    expect(ずれ, "描き直しが 1 段目より速くなる見本がある").toEqual([]);
  });

  it("YAML と JSON の秒数が組み立て API と揃う", () => {
    const ずれ: string[] = [];
    let 読めた = 0;
    for (const 名 of 描く見本) {
      const 段群 = (mod[名] as 図).phases ?? [];
      const 期待 = 段群.map((p) => (p.duration ?? 0) / 1000);
      for (const [種, 読む] of [
        ["YAML", yamlの秒数] as const,
        ["JSON", jsonの秒数] as const,
      ]) {
        const src = mod[`source${種 === "YAML" ? "Yaml" : "Json"}__${名}`];
        // 記法を持たない見本は対象外。 持っている分だけ数える
        if (typeof src !== "string") continue;
        読めた += 1;
        const 実際 = 読む(src);
        if (JSON.stringify(実際) !== JSON.stringify(期待)) {
          ずれ.push(`${名} の ${種}: ${JSON.stringify(実際)} (組み立て API は ${JSON.stringify(期待)})`);
        }
      }
    }
    expect(読めた, "記法を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(ずれ, "書き方によって段の長さが違う").toEqual([]);
  });
});
