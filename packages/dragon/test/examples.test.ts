/**
 * 公開する頁で選べる見本 3 つと、その英語版 (#2995)。
 *
 * 英語版は頁の言葉を EN にした時に出す。記法の語 (`時系列図` や `帯`) は日本語のまま、名前と本文だけを英語にする。
 * 訳す時に箱や線や段を落とすと、言葉を替えただけで図の形が変わるため、数を突き合わせる。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Diagram } from "../src/schema";
import { api, exampleText } from "./diagram-support";

const examples = join(process.cwd(), "packages/dragon/examples");

/** 図の形を数で表す。線は段ごとに数える */
const shape = (d: Diagram): Record<string, unknown> => ({
  kind: d.kind,
  regions: (d.regions ?? []).length,
  boxes: d.boxes.length,
  steps: d.steps.length,
  lines: d.steps.map((step) => step.events.filter((event) => event.type === "edge").length),
});

describe("見本の英語版 (#2995)", () => {
  it("english-examples-match-japanese", () => {
    const parse = api("parseNotation");
    for (const name of ["intro", "oauth", "ccip"]) {
      for (const file of [`${name}.dragon`, `${name}.en.dragon`]) {
        expect(existsSync(join(examples, file)), `${file} が無い`).toBe(true);
      }
      const ja = parse(exampleText(`${name}.dragon`));
      const en = parse(exampleText(`${name}.en.dragon`));
      expect(ja.ok, `${name}.dragon が読めない`).toBe(true);
      expect(en.ok, `${name}.en.dragon が読めない: ${en.ok ? "" : JSON.stringify(en.errors)}`).toBe(true);
      if (!ja.ok || !en.ok) continue;
      expect(shape(en.diagram as unknown as Diagram), `${name} の英語版の形が日本語版と違う`).toEqual(shape(ja.diagram as unknown as Diagram));
    }
  });
});

describe("見本の説明 (#3240)", () => {
  it("example-descriptions-carry-no-issue-number", () => {
    // 見本帳は見本の file の最初の注釈の行を説明に出す (#3032)。作業の番号は利用者に意味が無いので、最初の行に書かない
    const files = readdirSync(examples).filter((file) => file.endsWith(".dragon"));
    expect(files.length, "packages/dragon/examples の見本の file の数").toBeGreaterThan(0);
    const numbered = files.filter((file) => /\(#\d+\)/u.test(readFileSync(join(examples, file), "utf8").split("\n")[0] ?? ""));
    expect(numbered, "最初の注釈の行に作業の番号を持つ見本の file").toEqual([]);
  });
});
