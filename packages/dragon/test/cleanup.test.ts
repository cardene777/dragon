/**
 * 作り直しの片付け (#2983、#2993) で消した物が repo に戻っていないかを確かめる。
 *
 * 見るのは作業木に実在する file で、git の index ではない。
 * 消した後に `git rm` を忘れた状態も、消し忘れた file も、どちらも同じく落とす。
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const SELF = relative(ROOT, fileURLToPath(import.meta.url));

/** 追跡中と、追跡していないが無視もしていない file のうち、作業木に実在する物 */
function presentFiles(): string[] {
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split("\n").filter((path) => path !== "" && existsSync(join(ROOT, path)));
}

// 7 つの意匠の文書と、図の種類と意匠の組の見本の置き場
const DESIGN_DIRS = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief", "proposal"].map(
  (name) => `docs/design/${name}/`,
);
// 意匠を値に取る属性。画面の意匠と図の意匠の 2 つ
const DESIGN_ATTRS = ["data-site-theme", "data-cdl-palette"];
// 意匠の名前を値として書いた形。`terminal` と `catalog` は一般の語と重なるため見ない
const DESIGN_ID = /["'`](letterpress|blueprint|neon|relief|sketch)["'`]/;
const CODE = /\.(ts|tsx|js|mjs|cjs|css|html|json)$/;

// 消した見本帳と cdl を前提に組んだ skill と、前の記法と描き方の文書 (#2993)
const STALE_PATHS = [
  ".claude/skills/dragon-design/",
  ".claude/skills/dragon-diagram/",
  ".claude/skills/dragon-match/",
  ".claude/skills/dragon-redraw/",
  ".claude-plugin/",
  "docs/spec-parts-actors-unified.md",
  "docs/spec-reactive-diagram.md",
  "docs/spec-widgets-syntax.md",
  "docs/layout-diversity-patterns.md",
  "docs/diagram-skills/",
  "docs/design/class/",
  "docs/design/er/",
  "docs/design/record/",
  "docs/design/drawing/",
];
// 前の入口と、前に頼っていた描画の package の名前
const OLD_ENTRY = /textDslToDiagram|CdlDiagramView|@cardenelabs\/cdl/;
// 作り直しの経緯として前の名前を書いてよい file
const HISTORY = new Set([
  "README.md",
  "packages/dragon/README.md",
  "CHANGELOG.md",
  ".ikkan/premises/tech.md",
  "packages/dragon/scripts/lib/dep-integrity.mjs",
  "packages/dragon/test/dep-integrity.test.ts",
]);

describe("作り直しの片付け", () => {
  it("designs-folded-into-one-look", () => {
    const files = presentFiles();
    const docs = files.filter((path) => DESIGN_DIRS.some((dir) => path.startsWith(dir)));
    const code = files.filter(
      (path) => (path.startsWith("packages/") || path.startsWith("apps/")) && CODE.test(path) && path !== SELF,
    );
    const attrs = code.filter((path) => {
      const text = readFileSync(join(ROOT, path), "utf8");
      return DESIGN_ATTRS.some((attr) => text.includes(attr));
    });
    const ids = code.filter((path) => DESIGN_ID.test(readFileSync(join(ROOT, path), "utf8")));
    expect({ docs, attrs, ids }).toEqual({ docs: [], attrs: [], ids: [] });
  });

  it("old-catalog-removed", () => {
    const files = presentFiles();
    const topics = files.filter((path) => path.startsWith("apps/playground-spa/src/topics/"));
    const cdl = files.filter((path) => path.endsWith(".cdl.ts"));
    expect({ topics, cdl }).toEqual({ topics: [], cdl: [] });
  });

  it("stale-skills-and-docs-removed", () => {
    const files = presentFiles();
    const stale = files.filter((path) => STALE_PATHS.some((dir) => path.startsWith(dir)));
    const mentions = files.filter(
      (path) =>
        !HISTORY.has(path) &&
        path !== SELF &&
        !path.endsWith(".png") &&
        !path.endsWith(".pen") &&
        OLD_ENTRY.test(readFileSync(join(ROOT, path), "utf8")),
    );
    expect({ stale, mentions }).toEqual({ stale: [], mentions: [] });
  });
});
