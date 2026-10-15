import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readFlowchartDecisionStyles } from "../../tests/helpers/theme-notes";

const css = readFileSync(
  fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)),
  "utf8",
);

const 共通値 = {
  "--dragon-flow-edge-width": "5",
  "--dragon-flow-return-width": "6",
  "--dragon-flow-return-dash": "0 9.6",
  "--dragon-flow-return-cap": "round",
  "--dragon-flow-end-radius": "19px",
  "--dragon-flow-end-frame-width": "3.5",
  "--dragon-flow-end-core-radius": "10px",
  "--dragon-flow-decision-font-size": "26px",
  "--dragon-flow-decision-font-weight": "700",
} as const;

const palettes = [
  {
    palette: "blueprint",
    roles: {
      "--dragon-flow-main": "#143a52",
      "--dragon-flow-mark": "#143a52",
      "--dragon-flow-return-legend": "var(--er-own)",
      "--dragon-flow-lane-divider-dash": "22 7 5 7",
      "--dragon-flow-decision-fill": "var(--er-face)",
      "--dragon-flow-decision-frame": "#143a52",
      "--dragon-flow-decision-frame-width": "1.5",
      "--dragon-flow-label-success-fill": "#1f7a6b",
      "--dragon-flow-label-error-fill": "#a8431f",
      "--dragon-flow-label-success-text": "#e3e9ea",
      "--dragon-flow-label-error-text": "#e3e9ea",
      "--dragon-flow-label-success-frame": "none",
      "--dragon-flow-label-error-frame": "none",
      "--dragon-flow-label-radius": "9px",
      "--dragon-flow-label-frame-width": "0",
    },
  },
  {
    palette: "letterpress",
    roles: {
      "--dragon-flow-main": "#c8431f",
      "--dragon-flow-mark": "#1a1510",
      "--dragon-flow-return-legend": "var(--er-own)",
      "--dragon-flow-lane-divider-dash": "6 8",
      "--dragon-flow-decision-fill": "none",
      "--dragon-flow-decision-frame": "var(--er-frame)",
      "--dragon-flow-decision-frame-width": "2",
      "--dragon-flow-label-success-fill": "#1a1510",
      "--dragon-flow-label-error-fill": "#1a1510",
      "--dragon-flow-label-success-text": "#f0eadc",
      "--dragon-flow-label-error-text": "#f0eadc",
      "--dragon-flow-label-success-frame": "none",
      "--dragon-flow-label-error-frame": "none",
      "--dragon-flow-label-radius": "9px",
      "--dragon-flow-label-frame-width": "0",
    },
  },
  {
    palette: "catalog",
    roles: {
      "--dragon-flow-main": "#dca443",
      "--dragon-flow-mark": "#efe7d8",
      "--dragon-flow-return-legend": "var(--er-own)",
      "--dragon-flow-lane-divider-dash": "6 8",
      "--dragon-flow-decision-fill": "var(--er-face)",
      "--dragon-flow-decision-frame": "none",
      "--dragon-flow-decision-frame-width": "0",
      "--dragon-flow-label-success-fill": "#4fae9a",
      "--dragon-flow-label-error-fill": "#e8705a",
      "--dragon-flow-label-success-text": "#1b222c",
      "--dragon-flow-label-error-text": "#1b222c",
      "--dragon-flow-label-success-frame": "none",
      "--dragon-flow-label-error-frame": "none",
      "--dragon-flow-label-radius": "9px",
      "--dragon-flow-label-frame-width": "0",
    },
  },
  {
    palette: "terminal",
    roles: {
      "--dragon-flow-main": "#4ade80",
      "--dragon-flow-mark": "#a6f0bd",
      "--dragon-flow-return-legend": "var(--er-own)",
      "--dragon-flow-lane-divider-dash": "3 7",
      "--dragon-flow-decision-fill": "var(--er-face)",
      "--dragon-flow-decision-frame": "var(--er-frame)",
      "--dragon-flow-decision-frame-width": "1.75",
      "--dragon-flow-label-success-fill": "#c792ea",
      "--dragon-flow-label-error-fill": "#f5c451",
      "--dragon-flow-label-success-text": "#03110a",
      "--dragon-flow-label-error-text": "#03110a",
      "--dragon-flow-label-success-frame": "none",
      "--dragon-flow-label-error-frame": "none",
      "--dragon-flow-label-radius": "4px",
      "--dragon-flow-label-frame-width": "0",
    },
  },
  {
    palette: "sketch",
    roles: {
      "--dragon-flow-main": "#d2491f",
      "--dragon-flow-mark": "#2b2620",
      "--dragon-flow-return-legend": "var(--er-own)",
      "--dragon-flow-lane-divider-dash": "6 8",
      "--dragon-flow-decision-fill": "var(--er-face)",
      "--dragon-flow-decision-frame": "#2b2620",
      "--dragon-flow-decision-frame-width": "2.5",
      "--dragon-flow-label-success-fill": "#2f7d4f",
      "--dragon-flow-label-error-fill": "#2a5ca8",
      "--dragon-flow-label-success-text": "#fffdf7",
      "--dragon-flow-label-error-text": "#fffdf7",
      "--dragon-flow-label-success-frame": "none",
      "--dragon-flow-label-error-frame": "none",
      "--dragon-flow-label-radius": "9px",
      "--dragon-flow-label-frame-width": "0",
    },
  },
  {
    palette: "neon",
    roles: {
      "--dragon-flow-main": "#ff2e97",
      "--dragon-flow-mark": "#f3eefe",
      "--dragon-flow-return-legend": "var(--er-own)",
      "--dragon-flow-lane-divider-dash": "6 8",
      "--dragon-flow-decision-fill": "var(--er-face)",
      "--dragon-flow-decision-frame": "#00e5ff",
      "--dragon-flow-decision-frame-width": "3",
      "--dragon-flow-label-success-fill": "#07060c",
      "--dragon-flow-label-error-fill": "#07060c",
      "--dragon-flow-label-success-text": "#00e5ff",
      "--dragon-flow-label-error-text": "#ffd000",
      "--dragon-flow-label-success-frame": "#00e5ff",
      "--dragon-flow-label-error-frame": "#ffd000",
      "--dragon-flow-label-radius": "9px",
      "--dragon-flow-label-frame-width": "2.5px",
    },
  },
  {
    palette: "relief",
    roles: {
      "--dragon-flow-main": "#c4573c",
      "--dragon-flow-mark": "#463e33",
      "--dragon-flow-return-legend": "#c99a35",
      "--dragon-flow-lane-divider-dash": "6 8",
      "--dragon-flow-decision-fill": "var(--er-face)",
      "--dragon-flow-decision-frame": "none",
      "--dragon-flow-decision-frame-width": "0",
      "--dragon-flow-label-success-fill": "#2f7a6e",
      "--dragon-flow-label-error-fill": "#c99a35",
      "--dragon-flow-label-success-text": "#ffffff",
      "--dragon-flow-label-error-text": "#ffffff",
      "--dragon-flow-label-success-frame": "none",
      "--dragon-flow-label-error-frame": "none",
      "--dragon-flow-label-radius": "20px",
      "--dragon-flow-label-frame-width": "0",
    },
  },
] as const;

function declarations(body: string): Map<string, string> {
  return new Map(
    [...body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((match) => [
      match[1]!,
      match[2]!.trim(),
    ]),
  );
}

function flatRules(source: string): Array<{ selector: string; body: string }> {
  return [...source.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
    (match) => ({ selector: (match[1] ?? "").trim(), body: match[2] ?? "" }),
  );
}

function tableDeclarations(palette: string): Map<string, string> {
  const selector = `svg[data-cdl-stage][data-cdl-palette="${palette}"]`;
  const rule = flatRules(css).find(
    (candidate) => candidate.selector.trim() === selector,
  );
  if (!rule) throw new Error(`${palette} の意匠表が無い`);
  return declarations(rule.body);
}

function resolvedRole(table: Map<string, string>, role: string): string | undefined {
  const value = table.get(role);
  const reference = /^var\((--[a-z0-9-]+)\)$/i.exec(value ?? "")?.[1];
  return reference ? resolvedRole(table, reference) : value;
}

describe("固定の 7 意匠の流れ図を値の表から描く (#2875)", () => {
  it.each(palettes)("$palette の線・印・分岐札は意匠帳の値を表に持つ", ({ palette, roles }) => {
    const table = tableDeclarations(palette);
    for (const [role, expected] of Object.entries({ ...共通値, ...roles })) {
      expect(table.get(role), `${palette} / ${role}`).toBe(expected);
    }
  });

  it("流れ図の表に置いた全役は共通規則から少なくとも 1 回読まれる", () => {
    const declared = new Set(
      palettes.flatMap(({ palette }) =>
        [...tableDeclarations(palette).keys()].filter((role) => role.startsWith("--dragon-flow-")),
      ),
    );
    const read = new Set(
      flatRules(css).flatMap(({ body }) =>
        [...body.matchAll(/var\((--dragon-flow-[a-z0-9-]+)/gi)].map((match) => match[1]!),
      ),
    );
    expect([...declared].filter((role) => !read.has(role))).toEqual([]);
  });

  it("意匠帳が別に定めた光っていない分かれ道の値を表へ写す", () => {
    const notes = readFlowchartDecisionStyles();
    expect([...notes.keys()]).toEqual(["letterpress", "sketch", "neon"]);
    for (const palette of palettes) {
      const note = notes.get(palette.palette);
      if (!note) continue;
      const table = tableDeclarations(palette.palette);
      expect(resolvedRole(table, "--dragon-flow-decision-fill"), `${palette.palette} / 面`).toBe(
        note.face,
      );
      expect(resolvedRole(table, "--dragon-flow-decision-frame"), `${palette.palette} / 枠`).toBe(
        note.frame,
      );
      expect(table.get("--dragon-flow-decision-frame-width"), `${palette.palette} / 太さ`).toBe(
        String(note.width),
      );
    }
  });

  it("全図共通の線幅 7 と、流れ図の主役・枝 5 を別の役で保つ", () => {
    for (const { palette } of palettes) {
      const table = tableDeclarations(palette);
      expect(table.get("--dragon-theme-line-width"), palette).toBe("7");
      expect(table.get("--dragon-flow-edge-width"), palette).toBe("5");
    }
  });

  it("縦列名の一部意匠だけが持つ字の差は表に残す", () => {
    for (const palette of ["letterpress", "sketch", "neon"]) {
      expect(tableDeclarations(palette).get("--cdl-flowchart-lane-heading-name-weight"), palette).toBe("800");
    }
    expect(tableDeclarations("terminal").get("--cdl-flowchart-lane-heading-name-size")).toBe("25px");
  });
});
