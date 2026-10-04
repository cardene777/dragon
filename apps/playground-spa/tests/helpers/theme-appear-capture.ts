import type { Page } from "@playwright/test";

export const themeAppearSource = (theme: string): string => `title: "現れ方"
type: flow
theme: ${theme}
reveal: all

states:
  shown: 0

actors:
  - a: { kind: card, title: "A" }
  - b: { kind: card, title: "B" }
  - c: { kind: card, title: "C", 出す条件: "{shown}" }

flow:
  - a -> b
  - b -> c

animation:
  - step: "1" 2.0s
    focus: [a]
  - step: "2" 2.0s
    focus: [b]
    set:
      shown: 1
  - step: "3" 2.0s
    focus: [a]
`;

export async function captureThemeAppear(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const counts: Record<string, number> = {};
    (window as unknown as { __themeAppearCounts: Record<string, number> }).__themeAppearCounts = counts;
    const edgeCounts: Record<string, number> = {};
    (window as unknown as { __themeEdgeAppearCounts: Record<string, number> })
      .__themeEdgeAppearCounts = edgeCounts;
    document.addEventListener(
      "animationstart",
      (event) => {
        if (!(event instanceof AnimationEvent)) return;
        const target = event.target instanceof Element
          ? event.target.closest("[data-cdl-node]")
          : null;
        const stage = target?.closest("svg[data-cdl-stage]");
        const animation = stage
          ? getComputedStyle(stage).getPropertyValue("--theme-appear").trim()
          : "";
        if (animation && animation !== "none" && event.animationName === animation) {
          const id = target?.getAttribute("data-cdl-node");
          if (id) counts[id] = (counts[id] ?? 0) + 1;
        }

        const edge = event.target instanceof Element
          ? event.target.closest("[data-cdl-edge]")
          : null;
        const edgeStage = edge?.closest("svg[data-cdl-stage]");
        const edgeAnimation = edgeStage
          ? getComputedStyle(edgeStage).getPropertyValue("--theme-edge-appear").trim()
          : "";
        if (edgeAnimation && edgeAnimation !== "none" && event.animationName === edgeAnimation) {
          const edgeId = edge?.getAttribute("data-cdl-edge");
          if (edgeId) edgeCounts[edgeId] = (edgeCounts[edgeId] ?? 0) + 1;
        }
      },
      true,
    );
  });
}

export async function themeEdgeAppearCounts(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => ({
    ...(window as unknown as { __themeEdgeAppearCounts?: Record<string, number> })
      .__themeEdgeAppearCounts,
  }));
}

export async function themeAppearCounts(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => ({
    ...(window as unknown as { __themeAppearCounts?: Record<string, number> }).__themeAppearCounts,
  }));
}

export async function themeAnimationName(page: Page, name: string): Promise<string> {
  return page
    .locator(`svg[data-cdl-stage][data-cdl-palette="${name}"]`)
    .evaluate((stage) => getComputedStyle(stage).getPropertyValue("--theme-appear").trim());
}
