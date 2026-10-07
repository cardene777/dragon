import { expect, type Locator, type Page } from "@playwright/test";

import { 一覧の行 } from "./catalog-item-pick";
import { 一覧が落ち着くまで待つ } from "./wait-for-render";

export type 路線の実測 = {
  pending: boolean;
  tone: string | null;
  opacity: number;
  stroke: string;
  strokeWidth: string;
  strokeDasharray: string;
  markerEnd: string | null;
  width: number;
  height: number;
};

/** 見本帳の路線図を、画面にある操作だけで選び測る。 */
export class MetroMapPage {
  readonly page: Page;
  readonly preview: Locator;
  readonly diagram: Locator;

  constructor(page: Page) {
    this.page = page;
    this.preview = page.locator(".catalog-preview-stage:not([hidden])");
    this.diagram = this.preview.locator("[data-cdl-diagram]");
  }

  async open(): Promise<void> {
    await this.page.goto("catalog/text-dsl");
    await 一覧が落ち着くまで待つ(this.page, "テキスト記法");
    await 一覧の行(this.page, "テキスト記法の路線図", true).click();
    await expect(this.preview.locator('svg[role="img"]')).toBeVisible();
    await expect(this.preview.locator('[data-cdl-routing="metro"]')).toHaveCount(10);
    await this.page.evaluate(() => document.fonts.ready);
  }

  async choosePalette(name: string): Promise<void> {
    const group = this.page.getByRole("radiogroup", { name: "図の色味" });
    const radio = group.getByRole("radio", { name, exact: true });
    await radio.click();
    await expect(radio).toHaveAttribute("aria-checked", "true");
  }

  async choosePhase(index: number): Promise<void> {
    const group = this.page.getByRole("radiogroup", { name: "図の段" });
    const radio = group.getByRole("radio", { name: `段 ${index + 1}`, exact: true });
    await radio.click();
    await expect(radio).toHaveAttribute("aria-checked", "true");
    await expect(this.diagram).toHaveAttribute("data-cdl-phase-index", String(index));
    await this.waitForFiniteAnimations();
  }

  /** 現れ方の途中を測らず、終わりの濃さを測る。無限の装飾は待たない。 */
  async waitForFiniteAnimations(): Promise<void> {
    await this.preview.evaluate(async (root) => {
      const finite = root.getAnimations({ subtree: true }).filter((animation) => {
        const iterations = animation.effect?.getTiming().iterations;
        return iterations !== Infinity;
      });
      await Promise.all(finite.map(async (animation) => await animation.finished.catch(() => undefined)));
    });
  }

  async measureLines(): Promise<路線の実測[]> {
    return await this.preview.locator('[data-cdl-routing="metro"]').evaluateAll((groups) =>
      groups.map((group) => {
        const line = group.querySelector('[data-cdl-role="edge-line"]');
        if (!(line instanceof SVGGraphicsElement)) throw new Error("路線に edge-line が無い");

        let opacity = 1;
        let current: Element | null = line;
        while (current !== null) {
          opacity *= Number.parseFloat(getComputedStyle(current).opacity || "1");
          if (current instanceof SVGSVGElement) break;
          current = current.parentElement;
        }
        opacity *= Number.parseFloat(getComputedStyle(line).strokeOpacity || "1");
        const box = line.getBBox();
        return {
          pending: group.getAttribute("data-cdl-pending") === "true",
          tone: group.getAttribute("data-cdl-tone"),
          opacity,
          stroke: getComputedStyle(line).stroke,
          strokeWidth: getComputedStyle(line).strokeWidth,
          strokeDasharray: getComputedStyle(line).strokeDasharray,
          markerEnd: line.getAttribute("marker-end"),
          width: box.width,
          height: box.height,
        };
      }),
    );
  }
}
