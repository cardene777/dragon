// @vitest-environment jsdom
/**
 * カタログの頭に図の種類を絵つきで並べる (#3614)。
 *
 * カタログの一覧は、頁の頭の下に図の種類の段を最初に置き、部品の段 (どの図でも使える部品と、図の種類だけの部品) をその後に置く。
 * 図の種類の札は、その種類の最初の見本を描く絵の枠を持ち、押すとその種類の頁へ移る。
 * 一覧を jsdom に描き、後から読む見本が届いた後の段の並びと札の中身を読む。
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { KINDS } from "../catalog/catalog";
import { CatalogIndex } from "../catalog/CatalogIndex";
import { LATER_EXAMPLES } from "../examples";
import { PATHS } from "../site/routes";
import { atLoad } from "../../../../packages/dragon/test/at-load";
import { whenReady } from "../site/later";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** jsdom は大きさを測らないので、札の絵を縮める見張りは何も知らせない物で置き換える */
class QuietObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= QuietObserver as unknown as typeof ResizeObserver;

let host: HTMLDivElement;
let unmount: (() => void) | undefined;

// 後から読む塊は file を読み込む段で待つ。前処理で 25 ミリ秒ずつ見て待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3759)
const EXAMPLES_READY = await atLoad("見本帳の後から読む見本の塊を待つ", () => whenReady(LATER_EXAMPLES));

beforeAll(() => {
  EXAMPLES_READY.get();
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => {
    root.render(<CatalogIndex lang="ja" theme="light" palette="paper" />);
  });
  unmount = () => root.unmount();
});

afterAll(() => {
  act(() => unmount?.());
  host?.remove();
});

const sections = (): string[] => [...host.querySelectorAll<HTMLElement>('[data-catalog="section"]')].map((el) => el.dataset.section ?? "");
const cards = (): HTMLAnchorElement[] => [...host.querySelectorAll<HTMLAnchorElement>('[data-catalog="card"]')];

describe("カタログの頭の図の種類 (#3614)", () => {
  // 頁の頭の下の最初の段が図の種類の段
  it("catalog-kinds-come-first", () => {
    expect(sections()[0]).toBe("kinds");
  });

  // 部品の 2 つの段は図の種類の段より後に在る
  it("catalog-parts-follow-kinds", () => {
    const order = sections();
    expect(order.indexOf("parts")).toBeGreaterThan(order.indexOf("kinds"));
    expect(order.indexOf("kind-parts")).toBeGreaterThan(order.indexOf("kinds"));
  });

  // 図の種類の札の全てが、見本を描く絵の枠を持つ
  it("catalog-kind-cards-draw-an-example", () => {
    expect(cards()).toHaveLength(KINDS.length);
    for (const card of cards()) {
      const face = card.querySelector('[data-catalog="card-face"]');
      expect(face, `${card.href} に絵の枠が無い`).not.toBeNull();
      expect(face?.querySelector(".catalog-index-card-figure"), `${card.href} の絵の枠に図が無い`).not.toBeNull();
    }
  });

  // 図の種類の札は、その種類の頁へ向かう
  it("catalog-kind-cards-open-their-kind", () => {
    expect(cards().map((card) => card.getAttribute("href"))).toEqual(KINDS.map((kind) => `${PATHS.catalog}/${kind}`));
  });
});
