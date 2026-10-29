/**
 * 原本の JSON の形式の版 (#2984)。
 *
 * 道具より新しい版は描かずに版の番号を示して断る。原本の file を書き換えるのは移行の命令だけで、
 * 今の版の file には触れない。移行の命令は Node でだけ動く入口 `@cardenelabs/dragon/node` から引く (#3206)。
 */
import { mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrateFile } from "@cardenelabs/dragon/node";
import { describe, expect, it } from "vitest";
import { api, exampleJson, exampleText, patched } from "./diagram-support";

describe("形式の版", () => {
  it("version-rejects-newer-than-tool", () => {
    const read = api("readDiagram");
    const current = api("FORMAT_VERSION");
    const newer = current + 1;

    expect(read(exampleJson("oauth.json")).ok).toBe(true);

    const result = read(patched(exampleJson("oauth.json"), ["version"], newer));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.pointer).toBe("/version");
    expect(result.errors[0]?.message).toContain(String(newer));
  });

  it("migrate-leaves-current-version-untouched", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dragon-migrate-"));
    try {
      const file = join(dir, "oauth.json");
      const text = exampleText("oauth.json");
      writeFileSync(file, text);
      const past = new Date("2026-01-01T00:00:00Z");
      utimesSync(file, past, past);

      const result = await migrateFile(file);

      expect(result.changed).toBe(false);
      expect(readFileSync(file, "utf8")).toBe(text);
      expect(statSync(file).mtimeMs).toBe(past.getTime());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
