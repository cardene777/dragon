import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import {
  図の速さを変える,
  記法の速さを変える,
  既定の速さ,
  速さの選択肢,
} from "./playback-speed";
import { CATALOG_ITEMS } from "./catalog-items";

/**
 * カタログの再生速度の切替 (#1355)。
 *
 * 見ている図と、コードタブに出る記法の **両方に同じ倍率を掛ける**。 別々に計算するとずれ、
 * 写したコードが画面と違う速さで動く。
 *
 * 倍率は「速さ」 で持つ = `2` が 2 倍速で、段の長さは半分になる。
 */

/** 段の長さと秒数を持つ見本。 一致の検査はこれを通す */
const 記法を持つ見本 = (): { id: string; diagram: CdlDiagram; yaml: string; json?: string }[] => {
  const out: { id: string; diagram: CdlDiagram; yaml: string; json?: string }[] = [];
  for (const items of Object.values(CATALOG_ITEMS)) {
    for (const item of items) {
      if (item.sourceYaml) {
        out.push({
          id: item.id,
          diagram: item.diagram,
          yaml: item.sourceYaml,
          ...(item.sourceJson === undefined ? {} : { json: item.sourceJson }),
        });
      }
    }
  }
  return out;
};

/** 記法 (YAML) の段の秒数を並び順に取り出す */
const yamlの秒数 = (src: string): number[] =>
  [...src.matchAll(/^[ \t]*-[ \t]*step:[ \t]*"[^"]*"[ \t]+(\d+(?:\.\d+)?)s[ \t]*$/gm)].map((m) =>
    Number(m[1]),
  );

/** 記法 (JSON) の段の秒数を並び順に取り出す */
const jsonの秒数 = (src: string): number[] =>
  [...src.matchAll(/"duration"\s*:\s*(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));

describe("図の段の長さに倍率が掛かる (#1355)", () => {
  const 図: CdlDiagram = {
    id: "d",
    topic: "t",
    lanes: [{ id: "l", width: 400 }],
    nodes: [],
    edges: [],
    states: [],
    phases: [
      { id: "p1", duration: 2400, title: "a", body: "", activate: [], tweens: [], sets: [] },
      { id: "p2", duration: 900, title: "b", body: "", activate: [], tweens: [], sets: [] },
    ],
  };

  it("0.5 倍速では段が 2 倍の長さになる", () => {
    expect(図の速さを変える(図, 0.5).phases.map((p) => p.duration)).toEqual([4800, 1800]);
  });

  it("2 倍速では段が半分の長さになる", () => {
    expect(図の速さを変える(図, 2).phases.map((p) => p.duration)).toEqual([1200, 450]);
  });

  it("既定では元の object をそのまま返す", () => {
    // **同一性まで見る** = 新しい object を返すと `CdlDiagramView` が別の図とみなして
    // 描き直し、速さを触っていない図が切替えのたびに最初へ戻る
    expect(図の速さを変える(図, 既定の速さ)).toBe(図);
  });

  it("壊れた倍率では元の object をそのまま返す", () => {
    for (const v of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(図の速さを変える(図, v), `${v} で図が変わっている`).toBe(図);
    }
  });
});

describe("記法の秒数に倍率が掛かる (#1355)", () => {
  const yaml = 'animation:\n  - step: "計画" 2.4s\n    body: "1600 まで伸びる"\n  - step: "実績" 0.9s\n';
  const json = '{"animation":[{"step":"計画","duration":2.4},{"step":"実績","duration":0.9}]}';

  it("YAML の段の秒数が倍になる", () => {
    expect(yamlの秒数(記法の速さを変える(yaml, 0.5, "yaml"))).toEqual([4.8, 1.8]);
  });

  it("JSON の段の秒数が倍になる", () => {
    expect(jsonの秒数(記法の速さを変える(json, 0.5, "json"))).toEqual([4.8, 1.8]);
  });

  it("段の秒数以外の数は触らない", () => {
    // 説明の中の数 (1600) や状態の初期値を動かすと図が別物になる
    expect(記法の速さを変える(yaml, 0.5, "yaml")).toContain('body: "1600 まで伸びる"');
  });

  it("既定では元の文字列をそのまま返す", () => {
    expect(記法の速さを変える(yaml, 既定の速さ, "yaml")).toBe(yaml);
    expect(記法の速さを変える(json, 既定の速さ, "json")).toBe(json);
  });

  it("末尾に 0 を残さない", () => {
    // `4.80s` のような書き方は記法として不格好で、写した時にも残る
    expect(記法の速さを変える('  - step: "a" 2.4s\n', 0.5, "yaml")).toBe('  - step: "a" 4.8s\n');
    expect(記法の速さを変える('  - step: "a" 1s\n', 0.5, "yaml")).toBe('  - step: "a" 2s\n');
  });
});

describe("どの倍率でも図とコードが一致する (#1355)", () => {
  it.each(速さの選択肢)("%s 倍速で秒数と段の長さが揃う", (速さ) => {
    const 見本 = 記法を持つ見本();
    expect(見本.length, "記法を持つ見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);

    let 照合した段 = 0;
    for (const x of 見本) {
      const 秒 = yamlの秒数(記法の速さを変える(x.yaml, 速さ, "yaml"));
      // 記法の段の数と図の段の数が違う見本 (記法を持たない段がある等) は突き合わせない
      if (秒.length !== x.diagram.phases.length) continue;
      const 長さ = 図の速さを変える(x.diagram, 速さ).phases.map((p) => p.duration);
      for (let i = 0; i < 秒.length; i++) {
        照合した段 += 1;
        expect(
          Math.round(秒[i]! * 1000),
          `${x.id} の段 ${i + 1} で秒数と段の長さがずれている (${速さ} 倍速)`,
        ).toBe(長さ[i]);
      }
    }
    expect(照合した段, "段を 1 つも照合していない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it.each(速さの選択肢)("%s 倍速で YAML と JSON の秒数が揃う", (速さ) => {
    const 見本 = 記法を持つ見本().filter((x) => x.json !== undefined);
    expect(見本.length, "両方の記法を持つ見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);

    let 照合した見本 = 0;
    for (const x of 見本) {
      const y = yamlの秒数(記法の速さを変える(x.yaml, 速さ, "yaml"));
      const j = jsonの秒数(記法の速さを変える(x.json!, 速さ, "json"));
      if (y.length !== j.length) continue;
      照合した見本 += 1;
      expect(y, `${x.id} で YAML と JSON の秒数が違う (${速さ} 倍速)`).toEqual(j);
    }
    expect(照合した見本, "見本を 1 つも照合していない (検査が空振りしている)").toBeGreaterThan(0);
  });
});
