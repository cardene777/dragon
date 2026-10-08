import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  sourceJson__pattern__sortingShelfGantt__帯だけ,
  sourceJson__sortingShelfGantt,
  sourceYaml__pattern__sortingShelfGantt__帯だけ,
  sourceYaml__sortingShelfGantt,
} from "@/topics/catalog/charts.cdl";

const css = readFileSync(fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)), "utf8")
  .replace(/\/\*[\s\S]*?\*\//gu, "");

const 意匠 = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"] as const;
const 沈んだ色 = {
  blueprint: "#8aa3b1",
  letterpress: "#9d9382",
  catalog: "#9c9381",
  terminal: "#355542",
  sketch: "#9a9080",
  neon: "#8f86b3",
  relief: "#a99e8e",
} as const;

function 意匠の宣言(name: (typeof 意匠)[number]): Map<string, string> {
  const selector = `svg[data-cdl-stage][data-cdl-palette="${name}"]`;
  const blocks = [...css.matchAll(/([^{}]*)\{([^{}]*)\}/gu)]
    .filter((match) => (match[1] ?? "").split(",").map((part) => part.trim()).includes(selector))
    .map((match) => match[2] ?? "");
  const out = new Map<string, string>();
  for (const body of blocks) {
    for (const declaration of body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/giu)) {
      if (declaration[1] && declaration[2]) out.set(declaration[1], declaration[2].trim().toLowerCase());
    }
  }
  return out;
}

function 規則の本文(selector: string): string[] {
  const normalized = selector.replace(/\s+/gu, " ").trim();
  return [...css.matchAll(/([^{}]*)\{([^{}]*)\}/gu)].flatMap((match) =>
    (match[1] ?? "").split(",").map((part) => part.replace(/\s+/gu, " ").trim()).includes(normalized)
      ? [match[2] ?? ""]
      : [],
  );
}

describe("工程の図の 7 意匠", () => {
  it.each(意匠)("%s の沈んだ色と工程専用色を見本の口へ当てる", (name) => {
    const declarations = 意匠の宣言(name);
    expect(declarations.get("cdl-tone-muted"), `${name} の沈んだ色`).toBe(沈んだ色[name]);
    expect(declarations.get("cdl-gantt-arrow"), `${name} の依存の線`).toBe("var(--cdl-chart-2)");
    expect(declarations.get("cdl-gantt-milestone"), `${name} の節目`).toBe("var(--cdl-chart-1)");
    expect(declarations.get("cdl-gantt-today"), `${name} の今日`).toBe("var(--er-own)");
  });

  it.each(["blueprint", "letterpress"] as const)("%s の沈んだ帯だけを枠にする", (name) => {
    const selector = `svg[data-cdl-stage][data-cdl-palette="${name}"] [data-cdl-role="gantt-bar"][data-cdl-tone="muted"]`;
    const body = 規則の本文(selector).join("\n");
    expect(body).toMatch(/fill\s*:\s*none/iu);
    expect(body).toMatch(/stroke\s*:\s*currentColor/iu);
    expect(selector).not.toBe(`[data-cdl-tone="muted"]`);
  });

  it("電飾は tone を持つ工程の帯を枠だけにし、節目を対象にしない", () => {
    const selector = 'svg[data-cdl-stage][data-cdl-palette="neon"] [data-cdl-role="gantt-bar"][data-cdl-tone]';
    const body = 規則の本文(selector).join("\n");
    expect(body).toMatch(/fill\s*:\s*none/iu);
    expect(body).toMatch(/stroke\s*:\s*currentColor/iu);
    expect(selector).not.toContain("gantt-milestone");
  });
});

describe("工程の図の見本の値", () => {
  const 全記法 = [
    sourceYaml__sortingShelfGantt,
    sourceJson__sortingShelfGantt,
    sourceYaml__pattern__sortingShelfGantt__帯だけ,
    sourceJson__pattern__sortingShelfGantt__帯だけ,
  ];

  it("端末の終わりを全 6 箇所で 2.30 にする", () => {
    const text = 全記法.join("\n");
    expect(text.match(/terminal_end["']?\s*:\s*2\.30/gu)).toHaveLength(6);
    expect(text).not.toMatch(/terminal_end["']?\s*:\s*2\.55/gu);
  });

  it.each(全記法)("主役 3 件・沈んだ帯 2 件・節目と今日を全ての記法で渡す", (source) => {
    expect(source.match(/emphasis["']?\s*:\s*["']?primary/gu)).toHaveLength(3);
    expect(source.match(/tone["']?\s*:\s*["']?muted/gu)).toHaveLength(2);
    expect(source).toMatch(/milestone["']?\s*:\s*true/gu);
    expect(source).toMatch(/ganttToday/gu);
    expect(source).toMatch(/ganttTickLabels/gu);
    expect(source).toMatch(/ganttBarEnd["']?\s*:\s*["']?position/gu);
    expect(source).toMatch(/ganttBarThickness["']?\s*:\s*["']?thin/gu);
  });
});
