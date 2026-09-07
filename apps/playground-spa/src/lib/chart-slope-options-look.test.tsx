/**
 * 傾き図の見せ方が engine の描画へ届く検査 (#1659 / #1664)。
 *
 * node の欄だけでなく、実際に描いた SVG の役割と字を見る。既定の絵を欄を書かない元の絵と
 * 完全一致させることで、画面の初期状態と engine の既定がずれないことも固定する。
 *
 * 順位 (cdl#707) は右の列の字ではなく **縦の位置** を変える唯一の見せ方なので、
 * 字ではなく線の両端を測る。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";
import {
  図の傾きの見せ方を変える,
  傾きの見せ方の選択肢,
  既定の傾きの見せ方,
} from "./chart-slope-options";

/** 見本の中の傾き図。 id を手で書かず、node の種別から引く */
function 傾きの図(): CdlDiagram {
  const 一覧 = Object.values(CATALOG_ITEMS)
    .flat()
    .filter(({ diagram }) => diagram.nodes.some((n) => n.kind === "chart-slope"));
  expect(一覧.length, "傾き図の見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
  return 一覧[0]!.diagram;
}

/** 系列の数。 期待値を手で書かず、図の datum から導く */
function 系列の数(diagram: CdlDiagram): number {
  const 傾き = diagram.nodes.find((n) => n.kind === "chart-slope") as
    | { chartData?: unknown[] }
    | undefined;
  const 数 = 傾き?.chartData?.length ?? 0;
  expect(数, "系列が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  return 数;
}

/**
 * 起点から描く指定を外した図。
 *
 * 見本は 1 段目で線を引き起こすため、静止した最初の絵では右の列がまだ出ていない。
 * 右に何が出るかを見るには描き切った状態が要る。
 */
function 描き切った図(): CdlDiagram {
  const 元 = 傾きの図();
  expect(
    元.phases?.some((p) => p.draw !== undefined),
    "見本が draw を持っていない (前提が崩れている)",
  ).toBe(true);
  return { ...元, phases: 元.phases?.map(({ draw: _draw, ...残り }) => 残り) };
}

const 描く = (diagram: CdlDiagram): string =>
  renderToStaticMarkup(<CdlDiagramView diagram={layout(diagram)} />);

const roleの数 = (svg: string, role: string): number =>
  (svg.match(new RegExp(`data-cdl-role="${role}"`, "g")) ?? []).length;

/** その役割で描かれた字を並べる */
const roleの字 = (svg: string, role: string): string[] =>
  [...svg.matchAll(new RegExp(`data-cdl-role="${role}"[^>]*>([^<]*)<`, "g"))].map((m) => m[1]!);

/** 線の両端の y。 順位で置いた段はここに出る (`d="M x y L x y"`) */
const 線のy = (svg: string): number[] =>
  [
    ...svg.matchAll(
      /data-cdl-role="chart-slope-line"[^>]*\sd="M\s[\d.]+\s([\d.]+)\sL\s[\d.]+\s([\d.]+)"/g,
    ),
  ].flatMap((m) => [Number(m[1]), Number(m[2])]);

/** 重なりを畳んで上から並べた段 */
const 段たち = (svg: string): number[] => {
  const y = 線のy(svg);
  expect(y.length, "線の両端を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  return [...new Set(y.map((v) => Math.round(v * 100) / 100))].sort((a, b) => a - b);
};

/** 段の間隔が揃っているか。 順位の段は等間隔、値の尺はそうでない */
const 等間隔か = (段: number[]): boolean => {
  expect(段.length, "段を 2 つ以上測れていない (検査が空振りしている)").toBeGreaterThan(1);
  const 幅 = 段.slice(1).map((v, i) => v - 段[i]!);
  return 幅.every((w) => Math.abs(w - 幅[0]!) < 0.5);
};

/** React の `useId` が振る連番だけを伏せる。 図の中身は 1 文字も変えない */
const idを伏せる = (html: string): string => html.replace(/_r_[0-9a-z]+_/g, "_r_x_");

describe("傾き図の見せ方を描いた絵で見る (#1659 / #1664)", () => {
  it("既定の絵は欄を書かない元の絵と 1 文字も違わない", () => {
    // Given
    const 元 = 傾きの図();

    // When
    const 既定 = 図の傾きの見せ方を変える(元, 既定の傾きの見せ方);

    // Then
    expect(idを伏せる(描く(既定)), "既定の絵が元と違う").toBe(idを伏せる(描く(元)));
  });

  it("増減では右の列が chart-slope-delta になり、値の役割は左の列だけになる", () => {
    // Given = 描き切った図。 描いている途中では右の列がまだ出ていない
    const 元 = 描き切った図();
    const 数 = 系列の数(元);
    expect(roleの数(描く(元), "chart-slope-value"), "既定で右の列が出ていない").toBe(数 * 2);

    // When
    const svg = 描く(図の傾きの見せ方を変える(元, "増減"));

    // Then = 増減が系列の数だけ出て、値は左の列 (前の値) だけになる
    expect(roleの数(svg, "chart-slope-delta"), "増減の数が系列と合わない").toBe(数);
    expect(roleの数(svg, "chart-slope-value"), "右の列が値のまま残っている").toBe(数);
  });

  it("増減の字は 今の値 - 前の値 に符号を付けた形になる", () => {
    // Given = 既定の絵に出ている 2 列から期待値を導く。 手で数を書かない。
    // 記法の値は `{kensaku}` のような差し込みで、node の datum からは数を取れない
    // (実測 = すべて `NaN` になる)。 差し込みを解いた後の字は絵にしか出ていない
    const 元 = 描き切った図();
    const 列 = roleの字(描く(元), "chart-slope-value").map((s) => Number(s.replace(/,/g, "")));
    expect(列.length, "値の字を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(列.every((n) => Number.isFinite(n)), "値の字が数として読めない").toBe(true);
    const 期待 = 列.flatMap((_, i) =>
      i % 2 === 0 ? [列[i + 1]! - 列[i]!] : [],
    ).map((差) => (差 > 0 ? `+${差.toLocaleString("en-US")}` : 差.toLocaleString("en-US")));

    // When
    const svg = 描く(図の傾きの見せ方を変える(元, "増減"));

    // Then
    expect(roleの字(svg, "chart-slope-delta"), "増減の字が値と噛み合っていない").toEqual(期待);
  });

  it("左の列は増減でも前の値のまま", () => {
    // Given
    const 元 = 描き切った図();
    const 前 = roleの字(描く(元), "chart-slope-value").filter((_, i) => i % 2 === 0);
    expect(前.length, "左の列を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);

    // When
    const svg = 描く(図の傾きの見せ方を変える(元, "増減"));

    // Then = 残った値の字が、既定の左の列と一致する
    expect(roleの字(svg, "chart-slope-value"), "左の列が変わっている").toEqual(前);
  });

  it("順位では縦の位置が等間隔の段になる", () => {
    // Given = 既定の絵は値の尺で置くので段が等間隔にならない。
    // 先にそれを確かめないと、もともと等間隔の図で測って「効いた」 と読める
    const 元 = 描き切った図();
    const 数 = 系列の数(元);
    expect(等間隔か(段たち(描く(元))), "既定の段がもともと等間隔 (前提が崩れている)").toBe(false);

    // When
    const svg = 描く(図の傾きの見せ方を変える(元, "順位"));

    // Then = 段が系列の数だけ等間隔に並ぶ
    const 段 = 段たち(svg);
    expect(段.length, "段の数が系列と合わない").toBe(数);
    expect(等間隔か(段), "段が等間隔になっていない").toBe(true);
  });

  it("順位でも右の列は値のまま", () => {
    // Given
    const 元 = 描き切った図();
    const 数 = 系列の数(元);
    const 既定の字 = roleの字(描く(元), "chart-slope-value");

    // When
    const svg = 描く(図の傾きの見せ方を変える(元, "順位"));

    // Then = 増減には切り替わらず、左右 2 列とも既定と同じ字が出る
    expect(roleの数(svg, "chart-slope-delta"), "順位で増減が出ている").toBe(0);
    expect(roleの数(svg, "chart-slope-value"), "値の列が減っている").toBe(数 * 2);
    expect(roleの字(svg, "chart-slope-value"), "字が値でなくなっている").toEqual(既定の字);
  });

  it("どの見せ方の絵も互いに違う (陰性対照の裏返し)", () => {
    // Given = 同じ図を選択肢の数だけ描く。 一覧は手で書かず選択肢から導く
    const 元 = 描き切った図();
    expect(傾きの見せ方の選択肢.length, "選択肢が 1 つも無い (検査が空振りしている)").toBeGreaterThan(
      1,
    );
    const 絵 = 傾きの見せ方の選択肢.map((v) => idを伏せる(描く(図の傾きの見せ方を変える(元, v))));

    // Then = すべて互いに違う。 同じものがあれば切替がそこまで届いていない
    expect(new Set(絵).size, "見せ方を変えても絵が変わっていない").toBe(傾きの見せ方の選択肢.length);
  });
});
