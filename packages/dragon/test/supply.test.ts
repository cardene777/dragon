/**
 * supply chain / DevOps helper (Axis 73-76) の behavior test。
 */
import { describe, it, expect } from "vitest";
import {
  generateSbom,
  scanSpdxLicenses,
  extractDiagramsFromTs,
  diffDiagrams,
  threeWayMerge,
  visualValidateAll,
  type CdlDiagram,
} from "@cardenelabs/cdl";

function makeDiag(id: string): CdlDiagram {
  return {
    id,
    topic: "supply test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [
      { id: "a", lane: "l", stack: 0, kind: "actor", title: "A" },
      { id: "b", lane: "l", stack: 1, kind: "actor", title: "B" },
    ],
    edges: [{ id: "e", from: "a", to: "b", label: "ok", tone: "accent" }],
    states: [],
    phases: [],
  };
}

describe("supply chain helpers (Axis 73-76)", () => {
  // Axis 73: SBOM
  it("generateSbom は CycloneDX 1.5 shape を返す", () => {
    const report = visualValidateAll([makeDiag("d1"), makeDiag("d2")]);
    const sbom = generateSbom(report, {
      name: "my-app",
      version: "1.0.0",
      timestamp: "2026-07-03T00:00:00Z",
    });
    expect(sbom.bomFormat).toBe("CycloneDX");
    expect(sbom.specVersion).toBe("1.5");
    expect(sbom.metadata.component.name).toBe("my-app");
    expect(sbom.metadata.timestamp).toBe("2026-07-03T00:00:00Z");
    expect(sbom.components).toHaveLength(2);
    expect(sbom.components[0].name).toBe("diagram:d1");
    expect(sbom.components[0].purl).toContain("pkg:cdl/diagram/");
  });

  it("generateSbom は default metadata でも動く", () => {
    const report = visualValidateAll([makeDiag("d1")]);
    const sbom = generateSbom(report);
    expect(sbom.metadata.component.name).toBe("cdl-validate");
    expect(sbom.serialNumber).toContain("urn:uuid:");
  });

  // Axis 74: SPDX
  it("scanSpdxLicenses は node title の SPDX id を検知", () => {
    const d = makeDiag("dx");
    d.nodes[0].title = "MIT licensed component";
    const findings = scanSpdxLicenses(d);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].licenseId).toBe("MIT");
  });

  it("scanSpdxLicenses は Apache-2.0 も検知", () => {
    const d = makeDiag("dx");
    d.edges[0].label = "SPDX-License-Identifier: Apache-2.0";
    const findings = scanSpdxLicenses(d);
    expect(findings.some((f) => f.licenseId === "Apache-2.0")).toBe(true);
  });

  it("scanSpdxLicenses は none で空 array", () => {
    const findings = scanSpdxLicenses(makeDiag("dx"));
    expect(findings).toEqual([]);
  });

  // Axis 75: AST extraction
  it("extractDiagramsFromTs は builder chain から id 抽出", () => {
    const src = `
import { diagram } from "@cardenelabs/cdl";
export const d1 = diagram("my-diagram", { topic: "test flow" })
  .node("a").node("b").edge({ from: "a", to: "b" });
export const d2 = diagram("another-diag").node("x").node("y");
`;
    const extracted = extractDiagramsFromTs(src);
    expect(extracted).toHaveLength(2);
    expect(extracted[0].id).toBe("my-diagram");
    expect(extracted[0].topic).toBe("test flow");
    expect(extracted[0].nodeIds).toContain("a");
    expect(extracted[0].edgeCount).toBeGreaterThan(0);
    expect(extracted[1].id).toBe("another-diag");
  });

  it("extractDiagramsFromTs は空 source で []", () => {
    expect(extractDiagramsFromTs("")).toEqual([]);
    expect(extractDiagramsFromTs("no diagram here")).toEqual([]);
  });

  // Axis 76: Diff / Merge
  it("diffDiagrams は added / removed / changed 分類", () => {
    const a = makeDiag("d1");
    const b = makeDiag("d1");
    b.nodes.push({ id: "c", lane: "l", stack: 2, kind: "actor", title: "C" });
    b.nodes[0] = { ...a.nodes[0], title: "A (changed)" };
    b.edges = [];
    const diff = diffDiagrams(a, b);
    expect(diff.addedNodeIds).toContain("c");
    expect(diff.changedNodeIds).toContain("a");
    expect(diff.removedEdgeIds).toContain("e");
  });

  it("diffDiagrams 同一 diagram = 全 empty", () => {
    const a = makeDiag("d");
    const b = makeDiag("d");
    const diff = diffDiagrams(a, b);
    expect(diff.addedNodeIds).toEqual([]);
    expect(diff.removedNodeIds).toEqual([]);
    expect(diff.changedNodeIds).toEqual([]);
    expect(diff.addedEdgeIds).toEqual([]);
    expect(diff.removedEdgeIds).toEqual([]);
    expect(diff.changedEdgeIds).toEqual([]);
  });

  it("threeWayMerge 独立変更は conflict なし", () => {
    const base = makeDiag("d");
    const left = makeDiag("d");
    left.nodes.push({ id: "c", lane: "l", stack: 2, kind: "actor", title: "C" });
    const right = makeDiag("d");
    right.edges.push({ id: "e2", from: "a", to: "b", label: "extra", tone: "success" });
    const result = threeWayMerge(base, left, right);
    expect(result.conflicts).toHaveLength(0);
    expect(result.merged.nodes.some((n) => n.id === "c")).toBe(true);
    expect(result.merged.edges.some((e) => e.id === "e2")).toBe(true);
  });

  it("threeWayMerge 同 id を両方変更 = conflict + left 優先", () => {
    const base = makeDiag("d");
    const left = { ...base, nodes: base.nodes.map((n) => (n.id === "a" ? { ...n, title: "Left" } : n)) };
    const right = { ...base, nodes: base.nodes.map((n) => (n.id === "a" ? { ...n, title: "Right" } : n)) };
    const result = threeWayMerge(base, left, right);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0].target).toBe("node");
    expect(result.conflicts[0].id).toBe("a");
    // left 優先
    expect(result.merged.nodes.find((n) => n.id === "a")?.title).toBe("Left");
  });
});
