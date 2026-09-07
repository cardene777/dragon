// @vitest-environment jsdom
/**
 * 見本の折れ線で、値の動きが段の終わりまで続くことの検査 (#1679)。
 *
 * 描画側 (`cdl#736`) が段の既定の曲線を `easeOutQuint` から `easeOut` にゆるめた。
 * 版を上げただけでは効かないので、**実際に見本の図を動かして途中の値を測る**。
 *
 * ## 何を見るか
 *
 * 折れ線の `points` の縦位置を読み、段の始まりの位置から終わりの位置まで
 * どこまで進んだかを割合で出す。 字ではなく点の位置を見るのは、値を描く経路が
 * 変わっても図が主張する量そのものを測れるため。
 *
 * ## 時計を手で回す
 *
 * `CdlDiagramView` は内側で `Timeline` を作るので、進みを外から渡せない。
 * `performance.now` と `requestAnimationFrame` を差し替えて、好きな経過時間の
 * 1 frame だけを起こす。
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { sourceYaml__chartLine } from "@/topics/catalog/charts.cdl";

afterEach(() => cleanup());

/**
 * 見本の折れ線から、値を動かす段 (`改善後`) だけを残した図。
 *
 * **段を残す理由** = 段を指定して描かせる形 (`focusPhaseId`) では、engine が
 * その段の終わった状態から始めるため途中の値を測れない。 値を動かす段を先頭に置けば、
 * 描き始めた瞬間から段の進みを追える。 記法の値と段の長さは見本のまま。
 */
const 図 = () => {
  const d = textDslToDiagram(sourceYaml__chartLine);
  const 動く段 = (d.phases ?? []).filter((p) => p.id === "改善後");
  expect(動く段.length, "値を動かす段が見本に無い (検査が空振りしている)").toBe(1);
  return layout({ ...d, phases: 動く段 });
};

/** 段の長さ (記法の `1.2s`) */
const 段の長さ = 1200;

/** 折れ線の点の縦位置。 縦は下へ行くほど値が小さい (SVG の座標) */
function 点の縦(container: HTMLElement): number[] {
  const 点 = container.querySelector("polyline")?.getAttribute("points") ?? "";
  return 点
    .trim()
    .split(/\s+/)
    .map((p) => Number(p.split(",")[1]))
    .filter((v) => Number.isFinite(v));
}

/**
 * 値を動かす段を `経過ms` だけ進めた画面を描く。
 *
 * 時計と `requestAnimationFrame` を差し替え、1 frame だけを手で起こす。
 */
function 進めて描く(経過ms: number): HTMLElement {
  const 元のraf = globalThis.requestAnimationFrame;
  const 元のcancel = globalThis.cancelAnimationFrame;
  // `performance` から外して持つと `this` が外れるので束ねてから控える
  const 元のnow = performance.now.bind(performance);
  let 今 = 0;
  const 予約: { frame: FrameRequestCallback | null } = { frame: null };
  performance.now = () => 今;
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    予約.frame = cb;
    return 1;
  };
  globalThis.cancelAnimationFrame = (): void => {
    予約.frame = null;
  };
  try {
    const { container } = render(<CdlDiagramView diagram={図()} hideHeader />);
    const frame = 予約.frame;
    expect(frame, "frame が予約されていない (検査が空振りしている)").not.toBeNull();
    act(() => {
      今 = 経過ms;
      frame?.(今);
    });
    return container;
  } finally {
    performance.now = 元のnow;
    globalThis.requestAnimationFrame = 元のraf;
    globalThis.cancelAnimationFrame = 元のcancel;
  }
}

/** 段の始まりの位置から終わりの位置まで、どこまで進んだかの割合 */
function 進み(経過ms: number, 始め: number[], 終わり: number[]): number {
  const 今 = 点の縦(進めて描く(経過ms));
  expect(今.length, "点を 1 つも読めていない (検査が空振りしている)").toBe(始め.length);
  const 割たち = 今
    .map((y, i) => {
      const 幅 = 終わり[i]! - 始め[i]!;
      return Math.abs(幅) < 1e-6 ? null : (y - 始め[i]!) / 幅;
    })
    .filter((v): v is number => v !== null);
  expect(割たち.length, "動く点が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  return 割たち.reduce((a, b) => a + b, 0) / 割たち.length;
}

describe("見本の折れ線は段の終わりまで動く (#1679)", () => {
  it("段の 13% の時刻では、まだ半分も進んでいない", () => {
    // 上げる前 (easeOutQuint) はこの時刻で既に半分に達していた
    const 始め = 点の縦(進めて描く(0));
    cleanup();
    const 終わり = 点の縦(進めて描く(段の長さ));
    cleanup();
    const p = 進み(段の長さ * 0.13, 始め, 終わり);
    expect(p, `13% の時刻で進みすぎている: ${(p * 100).toFixed(0)}%`).toBeLessThan(0.35);
  });

  it("段の 80% の時刻でも、まだ終わりに達していない", () => {
    // 上げる前はこの時刻で 100% に達し、残りの時間は止まって見えていた
    const 始め = 点の縦(進めて描く(0));
    cleanup();
    const 終わり = 点の縦(進めて描く(段の長さ));
    cleanup();
    const p = 進み(段の長さ * 0.8, 始め, 終わり);
    expect(p, `80% の時刻で終わっている: ${(p * 100).toFixed(0)}%`).toBeLessThan(0.99);
    // 止まって見えないだけの残りがあること
    expect(1 - p, `残りが少なすぎる: ${((1 - p) * 100).toFixed(1)}%`).toBeGreaterThan(0.03);
  });

  it("段の始まりと終わりの値は変わらない", () => {
    // 曲線をゆるめても両端は動かない = 図が主張する量は今までと同じ
    const 始め = 点の縦(進めて描く(0));
    cleanup();
    const 終わり = 点の縦(進めて描く(段の長さ));
    expect(始め.length, "点を 1 つも読めていない (検査が空振りしている)").toBe(5);
    expect(終わり.length).toBe(5);
    // 全週が下がる図なので、終わりの縦位置は始まりより下 (SVG の縦は下へ行くほど小さい値)
    始め.forEach((y, i) => expect(終わり[i]!, `${i} 番目の点が下がっていない`).toBeGreaterThan(y));
  });

  it("測り方が、置いた進みを言い当てる", () => {
    // 植え込み対照。 上の検査は上限を見るので、常に 0 を返す測り方でも通る
    const 始め = [100, 200];
    const 終わり = [50, 150];
    const 半分 = [75, 175];
    const 割 = 半分.map((y, i) => (y - 始め[i]!) / (終わり[i]! - 始め[i]!));
    expect(割.reduce((a, b) => a + b, 0) / 割.length).toBeCloseTo(0.5, 6);
  });
});
