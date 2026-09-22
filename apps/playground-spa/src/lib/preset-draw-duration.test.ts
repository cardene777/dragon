/**
 * 起点から描く見本で、段の長さがいつ揃うかの検証 (#1440 → #1444)。
 *
 * `描き直す` (`redraw-mode.ts`) を選ぶと 1 段目の `draw` が 2 段目以降へ写され、その段でも
 * 起点から描き直される。 ところが **伸び具合は段の進みそのもの** で決まる = 描画側は段の
 * 進み 0→1 を `strokeDashoffset` や角度に直接使い、段の長さと別の「描く時間」 を持たない。
 *
 * 2 段目が短いままだと、同じ絵が 2.4 秒かけて描かれた後 0.9 秒で描き直される。
 *
 * ## 揃えるのは切替が入の時だけ (#1444)
 *
 * #1440 は見本の 2 段目に長さを書いて揃えたが、**書いた長さは既定の「動かすだけ」 でも効く**。
 * 値が移るだけの段まで 0.9 秒から 2.4 秒に伸びていた。
 *
 * 揃える処理を `図の描き方を変える` (写す側) に移したので、
 *
 * - 切 (動かすだけ) ... 見本に書いたままの長さ = 2 段目は短い
 * - 入 (描き直す) ... 1 段目と同じ長さ
 *
 * になる。 本 file は **両方の向き** を見る。 片方だけだと、常に揃える実装と
 * 常に揃えない実装のどちらかを見逃す。
 *
 * ## 3 つの書き方すべてを見る
 *
 * 見本は組み立て API と YAML と JSON の 3 つで書かれている。 1 つだけ直すと、画面と
 * 「コード」 タブとエディタで別の速さになる。
 */
import { describe, it, expect } from "vitest";
import * as Presets from "@/topics/catalog/presets.cdl";
import { 図の描き方を変える, 記法の描き方を変える } from "./redraw-mode";
import type { CdlDiagram } from "@cardenelabs/cdl";

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

/** 記法の文字列を持つ見本だけを返す */
const 記法 = (名: string, 種: "yaml" | "json"): string | undefined => {
  const v = mod[`source${種 === "yaml" ? "Yaml" : "Json"}__${名}`];
  return typeof v === "string" ? v : undefined;
};

describe("起点から描く見本の段の長さ (#1444)", () => {
  it("対象の見本が 1 件以上ある (検査が空振りしていない)", () => {
    // 走査した結果が空だと、以下の検査は assert に届かず必ず通る
    expect(描く見本.length, "`draw` を持つ見本を 1 つも見つけられていない").toBeGreaterThan(0);
  });

  it("2 段以上ある見本がある (揃える相手がいる)", () => {
    // 1 段しか無い見本ばかりだと「揃う / 揃わない」 の差が出ず、以下が自明に通る
    const 複数段 = 描く見本.filter((名) => ((mod[名] as 図).phases ?? []).length > 1);
    expect(複数段.length, "段が 2 つ以上ある見本が無い").toBeGreaterThan(0);
  });

  it("描き直す時は、全段が 1 段目と同じ長さになる", () => {
    const ずれ: string[] = [];
    for (const 名 of 描く見本) {
      const 元 = mod[名] as CdlDiagram;
      const 変えた = 図の描き方を変える(元, "redraw") as unknown as 図;
      const 段群 = 変えた.phases ?? [];
      const 期待 = 段群[0]?.duration;
      expect(期待, `${名} の 1 段目に長さが無い`).toBeDefined();
      const 長さ = 段群.map((p) => p.duration);
      if (長さ.some((v) => v !== 期待)) ずれ.push(`${名}: ${JSON.stringify(長さ)} (1 段目は ${期待})`);
    }
    expect(ずれ, "描き直しが 1 段目と違う速さになる見本がある").toEqual([]);
  });

  it("動かすだけの時は、見本に書いた長さのまま変わらない", () => {
    // 陰性対照。 これが無いと「常に揃える」 実装でも上の検査が通る
    for (const 名 of 描く見本) {
      const 元 = mod[名] as CdlDiagram;
      const 変えた = 図の描き方を変える(元, "hold");
      expect(変えた, `${名} で別の object が返っている (図が最初へ戻る)`).toBe(元);
    }
  });

  it("2 段目が 1 段目より短い見本が実際にある (揃える意味がある)", () => {
    // 全見本が元から同じ長さだと、上の 2 件は何も守っていない
    const 短い = 描く見本.filter((名) => {
      const 段群 = ((mod[名] as 図).phases ?? []);
      const 一 = 段群[0]?.duration;
      return 段群.slice(1).some((p) => p.duration !== undefined && 一 !== undefined && p.duration < 一);
    });
    expect(短い.length, "2 段目が短い見本が 1 件も無い").toBeGreaterThan(0);
  });

  it("記法 (YAML / JSON) も、描き直す時だけ 1 段目に揃う", () => {
    const ずれ: string[] = [];
    let 読めた = 0;
    for (const 名 of 描く見本) {
      for (const 種 of ["yaml", "json"] as const) {
        const src = 記法(名, 種);
        if (src === undefined) continue;
        読めた += 1;
        const 読む = 種 === "yaml" ? yamlの秒数 : jsonの秒数;

        // 切 = 元のまま
        if (記法の描き方を変える(src, "hold", 種) !== src) {
          ずれ.push(`${名} の ${種}: 動かすだけで記法が書き換わっている`);
        }

        // 入 = 全段が 1 段目に揃う
        const 揃えた = 読む(記法の描き方を変える(src, "redraw", 種));
        const 期待 = 揃えた[0];
        if (揃えた.length > 1 && 揃えた.some((v) => v !== 期待)) {
          ずれ.push(`${名} の ${種}: ${JSON.stringify(揃えた)} (1 段目は ${期待})`);
        }
      }
    }
    expect(読めた, "記法を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(ずれ, "記法の段の長さが揃っていない").toEqual([]);
  });

  it("記法の段の長さが、組み立て API と一致する (書き方で速さが変わらない)", () => {
    const ずれ: string[] = [];
    let 読めた = 0;
    for (const 名 of 描く見本) {
      const 期待 = ((mod[名] as 図).phases ?? []).map((p) => (p.duration ?? 0) / 1000);
      for (const 種 of ["yaml", "json"] as const) {
        const src = 記法(名, 種);
        if (src === undefined) continue;
        読めた += 1;
        const 実際 = (種 === "yaml" ? yamlの秒数 : jsonの秒数)(src);
        if (JSON.stringify(実際) !== JSON.stringify(期待)) {
          ずれ.push(`${名} の ${種}: ${JSON.stringify(実際)} (組み立て API は ${JSON.stringify(期待)})`);
        }
      }
    }
    expect(読めた, "記法を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(ずれ, "書き方によって段の長さが違う").toEqual([]);
  });
});
