import { describe, expect, it } from "vitest";

import { compileToCdl, type CompileNotice } from "../src/compile";
import { jsonToDiagram, jsonToDoc, validateDragonJson } from "../src/json-parser";
import { parseTextDslV05, PRESET_TYPES, TYPE_ALIASES } from "../src/v05/parser";

const 記法 = (type: string, shape: string): string => `title: "形の確認"
shape: ${shape}
type: ${type}
actors:
  - 受付
  - 完了
flow:
  - 受付 -> 完了: "渡す"
`;

function 読む(type: string, shape: string) {
  return parseTextDslV05(記法(type, shape));
}

function 知らせ(type: string, shape: string): CompileNotice[] {
  const parsed = 読む(type, shape);
  if (!parsed.ok) throw new Error(parsed.errors.map((error) => error.message).join("\n"));
  const notices: CompileNotice[] = [];
  compileToCdl(parsed.doc, { onNotice: (notice) => notices.push(notice) });
  return notices;
}

const JSON図 = (type: string, shape: string): unknown => ({
  title: "形の確認",
  type,
  shape,
  actors: ["受付", "完了"],
  flow: [{ from: "受付", to: "完了", label: "渡す" }],
});

describe("図種ごとの shape (#2797)", () => {
  it("swimlane の timeline は shape として読める", () => {
    const parsed = 読む("swimlane", "timeline");
    expect(parsed.ok).toBe(true);
    if (parsed.ok)
      expect({ type: parsed.doc.type, shape: parsed.doc.shape }).toEqual({
        type: "swimlane",
        shape: "timeline",
      });
  });

  it("timeline は図種の別名にならない", () => {
    expect(TYPE_ALIASES.has("timeline")).toBe(false);
    expect(PRESET_TYPES.has("timeline" as never)).toBe(false);
  });

  it("swimlane の metro は shape として読める", () => {
    const parsed = 読む("swimlane", "metro");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect({ type: parsed.doc.type, shape: parsed.doc.shape }).toEqual({ type: "swimlane", shape: "metro" });
  });

  it("metro は図種の別名にならない", () => {
    expect(TYPE_ALIASES.has("metro")).toBe(false);
    expect(PRESET_TYPES.has("metro" as never)).toBe(false);
  });

  it("swimlane の stages は shape として読める", () => {
    const parsed = 読む("swimlane", "stages");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.doc.type).toBe("swimlane");
      expect(parsed.doc.shape).toBe("stages");
    }
  });

  it("stages は図種の別名にならない", () => {
    expect(TYPE_ALIASES.has("stages")).toBe(false);
    expect(PRESET_TYPES.has("stages" as never)).toBe(false);
    const parsed = 読む("stages", "pie");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.map((error) => error.message).join(" / ")).toContain("図種が読めません");
  });

  it("swimlane の stages には shape の知らせを出さない", () => {
    expect(知らせ("swimlane", "stages").filter((notice) => notice.kind === "shape-not-honored")).toEqual([]);
  });

  it.each([
    ["swimlane", "pie"],
    ["flow", "stages"],
    ["flow", "pie"],
  ])("%s の shape: %s は知らせを1件出す", (type, shape) => {
    const notices = 知らせ(type, shape).filter((notice) => notice.kind === "shape-not-honored");
    expect(notices).toHaveLength(1);
  });

  it("flow の metro は shape の知らせを1件出す", () => {
    const notices = 知らせ("flow", "metro").filter((notice) => notice.kind === "shape-not-honored");
    expect(notices).toHaveLength(1);
    expect(notices[0]?.hint).toContain("metro");
  });

  it("flow の timeline は shape の知らせを1件出す", () => {
    const notices = 知らせ("flow", "timeline").filter(
      (notice) => notice.kind === "shape-not-honored",
    );
    expect(notices).toHaveLength(1);
    expect(notices[0]?.hint).toContain("timeline");
  });

  it("shape の知らせはその図種で書ける語を案内する", () => {
    const swimlane = 知らせ("swimlane", "pie").find((notice) => notice.kind === "shape-not-honored");
    expect(swimlane?.hint).toContain("stages");
    expect(swimlane?.hint).not.toContain("pie");

    const flow = 知らせ("flow", "stages").find((notice) => notice.kind === "shape-not-honored");
    expect(flow?.hint).toContain("type: chart");
    expect(flow?.hint).toContain("type: swimlane");
  });

  it("chart の stages は chart で使える語を案内する parser error になる", () => {
    const parsed = 読む("chart", "stages");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errors.map((error) => error.message).join(" / ")).toContain("shape が読めません");
      const hints = parsed.errors.map((error) => error.hint ?? "").join(" / ");
      expect(hints).toContain("pie");
      expect(hints).not.toContain("stages");
    }
  });

  it("記法の chart では metro は parser error になる", () => {
    const parsed = 読む("chart", "metro");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.map((error) => error.message).join(" / ")).toContain("shape が読めません");
  });

  it("記法の chart では timeline は parser error になる", () => {
    const parsed = 読む("chart", "timeline");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok)
      expect(parsed.errors.map((error) => error.message).join(" / ")).toContain(
        "shape が読めません",
      );
  });

  it("綴り違いは swimlane で使える語を案内する parser error になる", () => {
    const parsed = 読む("swimlane", "stagse");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      const text = parsed.errors.map((error) => `${error.message} ${error.hint ?? ""}`).join(" / ");
      expect(text).toContain("shape が読めません");
      expect(text).toContain("stages");
    }
  });

  it("JSON の swimlane でも stages を同じ文書へ解く", () => {
    const input = JSON図("swimlane", "stages");
    const validated = validateDragonJson(input);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const doc = jsonToDoc(validated.data);
    expect({ type: doc.type, shape: doc.shape }).toEqual({ type: "swimlane", shape: "stages" });
    expect(() => jsonToDiagram(input)).not.toThrow();
  });

  it("JSON の swimlane でも metro を同じ文書へ解く", () => {
    const input = JSON図("swimlane", "metro");
    const validated = validateDragonJson(input);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const doc = jsonToDoc(validated.data);
    expect({ type: doc.type, shape: doc.shape }).toEqual({ type: "swimlane", shape: "metro" });
    expect(() => jsonToDiagram(input)).not.toThrow();
  });

  it.each([
    ["swimlane", "stages", 0],
    ["swimlane", "pie", 1],
    ["flow", "stages", 1],
    ["flow", "pie", 1],
  ])("JSON の %s / %s も shape の知らせが %i 件になる", (type, shape, count) => {
    const notices: CompileNotice[] = [];
    jsonToDiagram(JSON図(type, shape), { onNotice: (notice) => notices.push(notice) });
    expect(notices.filter((notice) => notice.kind === "shape-not-honored")).toHaveLength(count);
  });

  it("JSON の chart でも stages は validation error になる", () => {
    expect(() => jsonToDiagram(JSON図("chart", "stages"))).toThrow(/shape/);
  });

  it("JSON の chart でも metro は validation error になる", () => {
    expect(() => jsonToDiagram(JSON図("chart", "metro"))).toThrow(/shape/);
  });

  it("JSON の綴り違いも validation error になる", () => {
    expect(() => jsonToDiagram(JSON図("swimlane", "stagse"))).toThrow(/shape/);
  });

  it("記法と JSON は同じ意味の文書と知らせになる", () => {
    const source = `title: "同じ入口"
type: swimlane
shape: stages
actors:
  - 受付: { lane: front }
  - 完了: { stage: 完了, lane: front }
flow:
  - 受付 -> 完了: "渡す"
`;
    const parsed = parseTextDslV05(source);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const input = {
      title: "同じ入口",
      type: "swimlane",
      shape: "stages",
      actors: [
        { name: "受付", lane: "front" },
        { name: "完了", stage: "完了", lane: "front" },
      ],
      flow: [{ from: "受付", to: "完了", label: "渡す" }],
    };
    const validated = validateDragonJson(input);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const jsonDoc = jsonToDoc(validated.data);
    const 意味 = (doc: typeof jsonDoc) => ({
      title: doc.title,
      type: doc.type,
      shape: doc.shape,
      actors: doc.actors.map(({ name, stage, lane }) => ({ name, stage, lane })),
      flow: doc.flow.map(({ from, to, label }) => ({ from, to, label })),
    });
    expect(意味(jsonDoc)).toEqual(意味(parsed.doc));
    const notice = (doc: typeof jsonDoc) => {
      const out: CompileNotice[] = [];
      compileToCdl(doc, { onNotice: (value) => out.push(value) });
      return out.map(({ kind, message }) => ({ kind, message }));
    };
    expect(notice(jsonDoc)).toEqual(notice(parsed.doc));
  });
});
