import { describe, it, expect } from "vitest";
import { validate, type CdlDiagram } from "@cardenelabs/cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";

/**
 * 見本帳の「プリセット」 で、折れ線が左から伸びるようにした件 (#1351)。
 *
 * 描画側は段に `draw` があると起点から伸ばす。 折れ線は左端から右へ伸びる。
 * 段を組み直す `withSteps` が `draw` を運ぶ経路を持っていなかったため、このページの見本は
 * 1 件も伸びず、開いた瞬間に全長で出ていた。
 *
 * 段に `draw` を **書かない時は欄ごと置かない**。 置くと `draw` を使わない見本の JSON の形が
 * 変わる (描画側の `builder.ts` も同じ扱いをしている)。
 */

const 図の一覧 = (): { name: string; diagram: CdlDiagram }[] => {
  const out: { name: string; diagram: CdlDiagram }[] = [];
  for (const [name, v] of Object.entries(presets)) {
    if (v && typeof v === "object" && "id" in v && "phases" in v) {
      out.push({ name, diagram: v });
    }
  }
  return out;
};

const 折れ線 = (): CdlDiagram => {
  const d = 図の一覧().find((x) => x.diagram.id === "chart-line-demo");
  expect(d, "折れ線の見本 (chart-line-demo) が見つからない").toBeDefined();
  return d!.diagram;
};

/** `validate` が出す警告を集める。 cdl は `console.warn` に出す */
const 取れた警告 = (f: () => void): string[] => {
  const 元 = console.warn;
  const 出た: string[] = [];
  console.warn = (...a: unknown[]) => {
    出た.push(a.map(String).join(" "));
  };
  try {
    f();
  } finally {
    console.warn = 元;
  }
  return 出た;
};

/** 「描けない種別を指した」 警告だけを取り出す */
const 描けない件数 = (警告: string[]): string[] =>
  警告.filter((w) => w.includes("draw") && w.includes("起点から描く動きを持たない"));

describe("プリセットの折れ線は左から伸びる (#1351)", () => {
  it("1 段目で折れ線の箱を起点から描く", () => {
    const 段 = 折れ線().phases;
    expect(段.length, "段が 1 つも無い").toBeGreaterThan(0);
    expect(段[0]!.draw).toEqual(["chart-line-demo-chart"]);
  });

  it("描く箱は、その段で光らせている箱と同じものを指す", () => {
    // 実在しない id を書くと描画側は何も描かず、検査も気付けない。
    // 図の中の箱の id と突き合わせる。
    const d = 折れ線();
    const 箱 = new Set(d.nodes.map((n) => n.id));
    expect(箱.size, "箱が 1 つも無い").toBeGreaterThan(0);
    for (const id of d.phases[0]!.draw ?? []) {
      expect(箱.has(id), `draw の "${id}" が図の箱に無い`).toBe(true);
    }
  });

  it("2 段目には draw の欄が付かない (書いていない段は全長で出る)", () => {
    const 段 = 折れ線().phases;
    expect(段.length, "2 段目が無い").toBeGreaterThan(1);
    expect(Object.prototype.hasOwnProperty.call(段[1]!, "draw")).toBe(false);
  });

  it("描く指定は 1 段目にしか付かない (陰性対照)", () => {
    /*
     * #1357 で 6 件の見本にも描く指定を入れたため、「折れ線以外は 1 件も持たない」 という
     * 形の対照は成立しなくなった。 **同じ図の中** で取り直す = どの見本も 1 段目だけが描き、
     * 2 段目以降は欄ごと持たない。
     *
     * 全ての段に付ける実装にすると、値が動くだけの段でも図を描き直すことになる。
     */
    let 描く見本 = 0;
    let 見た段 = 0;
    for (const { name, diagram } of 図の一覧()) {
      const 描く段 = diagram.phases.filter((p) => (p.draw ?? []).length > 0);
      if (描く段.length > 0) 描く見本 += 1;
      for (const [i, p] of diagram.phases.entries()) {
        見た段 += 1;
        if (i === 0) continue;
        expect(
          Object.prototype.hasOwnProperty.call(p, "draw"),
          `${name} の 2 段目以降 "${p.id}" に draw の欄が付いている`,
        ).toBe(false);
      }
    }
    expect(描く見本, "描く見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(見た段, "段を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("描く指定の相手は、起点から描ける種別の箱だけ", () => {
    /*
     * 描けない種別を指しても図は出るが、書いた指定は何もしない。 対象の種別一覧は cdl が
     * 持っている (`DRAW_KINDS`) が公開されていないため、**cdl の検査そのものを通す** =
     * 一覧を写さずに済み、cdl 側で対象が変わっても追随する。
     */
    const 出た = 取れた警告(() => {
      for (const { diagram } of 図の一覧()) validate(diagram);
    });
    expect(描けない件数(出た), "描けない種別を指した draw がある").toEqual([]);
  });

  it("描けない種別を指すと cdl の検査が知らせる (陽性対照)", () => {
    /*
     * 上の検査は「警告が 0 件」 を見る。 0 件は「問題が無い」 とも「検査が動いていない」 とも
     * 読めるため、**わざと描けない種別を指した図を 1 件通して** 検査が発火することを見る。
     *
     * 発火しない形に変わったら (cdl が警告をやめた / 文言が変わった) ここが落ちる。
     */
    const 順序図 = 図の一覧().find((x) => x.diagram.id === "swim-demo");
    expect(順序図, "対照に使う見本 (swim-demo) が見つからない").toBeDefined();
    const 箱 = 順序図!.diagram.nodes[0];
    expect(箱, "対照に使う箱が無い").toBeDefined();

    const 壊した = {
      ...順序図!.diagram,
      phases: 順序図!.diagram.phases.map((p, i) => (i === 0 ? { ...p, draw: [箱!.id] } : p)),
    };
    expect(描けない件数(取れた警告(() => validate(壊した))).length, "描けない種別を指しても知らせない").toBeGreaterThan(0);
  });
});
