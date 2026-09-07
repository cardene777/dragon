/**
 * 見本帳の傾き図で、名札が段のどこでも重ならないことの検査 (#1672)。
 *
 * 描画側 (`cdl#723`) が名札の縦の位置をほどくようになった。 版を上げただけでは効かないので、
 * **実際に見本の図を描いて名札の位置を測る**。
 *
 * 「経路別の申込み」 は 2 段目で `sns` を 400 へ動かす。 その時の今期の値は 420 と 400 が
 * 並び、名札の縦の差は 15.8 になる = 1 行に要る 18 を下回って重なっていた。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";

/** 名札 1 行が縦に要する高さ。 描画側が値 14 と名前 13 の大きい方 + 4 から出す */
const 名札の行 = 18;

/** 見本の中で傾き図の箱を持つ図。 id を手で書かず、箱の種類から引く */
function 傾きの見本(): CdlDiagram[] {
  const 一覧 = Object.values(CATALOG_ITEMS)
    .flat()
    .filter(({ diagram }) => diagram.nodes.some((n) => n.kind === "chart-slope"))
    .map(({ diagram }) => diagram);
  expect(一覧.length, "傾き図の見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
  return 一覧;
}

/**
 * 段を進めた後の値を初期値に焼いた図。
 *
 * `draw` と動きを外すのは、描き切った絵を見るため = 段の途中では右の名札がまだ出ない。
 */
function 段の終わりの図(diagram: CdlDiagram, 段の数: number): CdlDiagram {
  const d = diagram as unknown as {
    states?: { id: string; initial: number }[];
    phases?: { tweens?: { stateId: string; to: number }[]; sets?: { stateId: string; value: number }[] }[];
  };
  const 値 = new Map((d.states ?? []).map((s) => [s.id, s.initial]));
  (d.phases ?? []).slice(0, 段の数).forEach((p) => {
    (p.tweens ?? []).forEach((t) => 値.set(t.stateId, t.to));
    (p.sets ?? []).forEach((s) => 値.set(s.stateId, s.value));
  });
  return {
    ...(diagram as object),
    states: (d.states ?? []).map((s) => ({ ...s, initial: 値.get(s.id) ?? s.initial })),
    phases: (d.phases ?? []).map(({ ...残り }) => ({
      ...(残り as object),
      draw: undefined,
      tweens: [],
    })),
    // 元の図の残りの項目は綴じ込みで運ぶ。 綴じ込み元が `object` なので型は素通りしない
  } as unknown as CdlDiagram;
}

/** 描いた絵から、役割ごとの名札の `x` と `y` を読む */
function 名札たち(svg: string, role: string): { x: number; y: number }[] {
  const re = new RegExp(`data-cdl-role="${role}"[^>]*?x="([-\\d.]+)"[^>]*?y="([-\\d.]+)"`, "g");
  return [...svg.matchAll(re)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
}

/**
 * 近すぎる組を数える。 **左右は別の列** なので `x` でまとめてから縦の差を見る。
 *
 * 0 件を期待する検査なので、探し方そのものを植え込みで確かめる (下の検査)。
 */
function 近すぎる組(名札: { x: number; y: number }[], 下限: number): string[] {
  const 列 = new Map<number, number[]>();
  名札.forEach(({ x, y }) => 列.set(x, [...(列.get(x) ?? []), y]));
  const 出た: string[] = [];
  列.forEach((ys, x) => {
    const 並び = [...ys].sort((a, b) => a - b);
    for (let i = 1; i < 並び.length; i++) {
      if (並び[i]! - 並び[i - 1]! < 下限 - 1e-6) 出た.push(`x=${x} ${並び[i - 1]} と ${並び[i]}`);
    }
  });
  return 出た;
}

describe("見本帳の傾き図は名札が重ならない (#1672)", () => {
  it("どの段の終わりでも、同じ列の名札が 18 以上離れる", () => {
    const 見本たち = 傾きの見本();
    let 測れた = 0;
    for (const 図 of 見本たち) {
      const 段の数 = ((図 as unknown as { phases?: unknown[] }).phases ?? []).length;
      for (let n = 1; n <= Math.max(1, 段の数); n++) {
        const svg = renderToStaticMarkup(<CdlDiagramView diagram={layout(段の終わりの図(図, n))} />);
        for (const role of ["chart-slope-name", "chart-slope-value"]) {
          const 名札 = 名札たち(svg, role);
          expect(名札.length, `${n} 段目の ${role} を 1 つも読めない (検査が空振りしている)`).toBeGreaterThan(0);
          測れた += 名札.length;
          expect(近すぎる組(名札, 名札の行), `${n} 段目の ${role} が重なっている`).toEqual([]);
        }
      }
    }
    expect(測れた, "名札を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("重なりの探し方が、置いた重なりを見つける", () => {
    // 植え込み対照。 上の検査は 0 件を期待するので、探し方が何も見つけないだけでも通る
    const 置いた = [
      { x: 100, y: 10 },
      { x: 100, y: 20 },
      { x: 300, y: 10 },
      { x: 300, y: 40 },
    ];
    expect(近すぎる組(置いた, 名札の行)).toEqual(["x=100 10 と 20"]);
  });

  it("段を進めると今期の値が動く", () => {
    // 収容対照。 段を進めた図を作れていなければ、上の検査は 1 段目だけを何度も見ている
    const 図 = 傾きの見本()[0]!;
    const 一段目 = renderToStaticMarkup(<CdlDiagramView diagram={layout(段の終わりの図(図, 1))} />);
    const 二段目 = renderToStaticMarkup(<CdlDiagramView diagram={layout(段の終わりの図(図, 2))} />);
    expect(名札たち(一段目, "chart-slope-value").length).toBe(
      名札たち(二段目, "chart-slope-value").length,
    );
    expect(一段目).not.toBe(二段目);
  });
});
