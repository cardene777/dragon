import { describe, expect, it } from "vitest";
import { jsonToDiagram, textDslToDiagram, type CompileNotice } from "../src";

const yaml = (extra = "", type = "chart\nshape: pie") => `title: 円\ntype: ${type}\n${extra}\nactors:\n  - A: "60"\n  - B: "40"\n`;
const node = (extra = "", type?: string, notices: CompileNotice[] = []) =>
  textDslToDiagram(yaml(extra, type), { onNotice: (notice) => notices.push(notice) }).nodes[0]!;

describe("円の見せ方 form (#2837)", () => {
  it("英名と和名を chartPieForm へ渡す", () => {
    expect(node("form: table").chartPieForm).toBe("table");
    expect(node("見せ方: 積層の弧").chartPieForm).toBe("arcs");
    expect(
      jsonToDiagram({
        title: "円",
        type: "chart",
        shape: "pie",
        見せ方: "銘板",
        actors: [
          { name: "A", value: "60" },
          { name: "B", value: "40" },
        ],
        flow: [],
      }).nodes[0]?.chartPieForm,
    ).toBe("table");
  });

  it("読めない値と円以外への指定を行付きで知らせて無視する", () => {
    const unreadable: CompileNotice[] = [];
    expect(node("form: unknown", undefined, unreadable).chartPieForm).toBeUndefined();
    expect(unreadable.some((n) => n.kind === "chart-value-unreadable" && n.line === 4)).toBe(true);

    const notPie: CompileNotice[] = [];
    expect(node("form: table", "chart\nshape: bar", notPie).chartPieForm).toBeUndefined();
    expect(notPie.some((n) => n.message.includes("shape: pie") && n.line === 4)).toBe(true);
  });

  it("欄を書かなければ chartPieForm を出さない", () => {
    expect(Object.hasOwn(node(), "chartPieForm")).toBe(false);
  });

  it("輪は従来の札高を保ち、積層の弧と銘板は区分数から札高を組み立てる", () => {
    const four = `actors:\n  - A: "10"\n  - B: "20"\n  - C: "30"\n  - D: "40"\n`;
    const height = (form: string): number | undefined =>
      textDslToDiagram(`title: 円\ntype: chart\nshape: pie\nform: ${form}\n${four}`).nodes[0]?.h;

    expect(height("ring")).toBe(320);
    expect(height("arcs")).toBe(272);
    expect(height("table")).toBe(288);
    for (const form of ["ring", "arcs", "table"]) expect(height(form)! % 16).toBe(0);
  });
});
