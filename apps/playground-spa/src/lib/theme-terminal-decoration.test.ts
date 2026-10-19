// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { readCdlThemeCssRules } from "./theme-role-table-test-helpers";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const palettes = [
  { name: "図面", value: "blueprint", hidden: 3 },
  { name: "活版", value: "letterpress", hidden: 3 },
  { name: "図録", value: "catalog", hidden: 3 },
  { name: "端末", value: "terminal", hidden: 0 },
  { name: "手描き", value: "sketch", hidden: 3 },
  { name: "電飾", value: "neon", hidden: 3 },
  { name: "浮彫", value: "relief", hidden: 3 },
] as const;

const terminalDecorationRoles = [
  "terminal-window-control",
  "terminal-cursor",
  "terminal-row-ordinal",
] as const;

const displayNoneSelectors = readCdlThemeCssRules()
  .filter(({ body }) => /(?:^|;)\s*display\s*:\s*none(?:\s*!important)?\s*(?:;|$)/iu.test(body))
  .map(({ selector }) => selector);

function hiddenTerminalDecorationCount(palette: string | undefined): number {
  const stage = document.createElementNS(SVG_NAMESPACE, "svg");
  stage.setAttribute("data-cdl-stage", "");
  if (palette !== undefined) stage.setAttribute("data-cdl-palette", palette);

  const decorations = terminalDecorationRoles.map((role) => {
    const decoration = document.createElementNS(SVG_NAMESPACE, "g");
    decoration.setAttribute("data-cdl-role", role);
    stage.append(decoration);
    return decoration;
  });
  document.body.append(stage);

  const hidden = decorations.filter((decoration) =>
    displayNoneSelectors.some((selector) => decoration.matches(selector)));
  stage.remove();
  return hidden.length;
}

describe("端末だけの飾りを色味ごとに隠す (#2916)", () => {
  it.each(palettes)("$name で隠れる飾りは $hidden 件", ({ value, hidden }) => {
    expect(hiddenTerminalDecorationCount(value)).toBe(hidden);
  });
});
