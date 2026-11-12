/**
 * 枝分かれの図で HEAD を動かす線の端 (#3648)。
 *
 * `HEAD -> <commit>` で HEAD を動かした後、同じ段で HEAD が枝に戻るか先へ進むと、HEAD の札はその段の終わりに出ていない。
 * 線は札が来るはずだった所で止まっていたため、端に何も無いまま描かれていた (見本 `squash` の4段目、部品の見本 `copy` と `delete`)。
 * 線の端は、段の終わりに HEAD が居る所の札に着ける (step 2 で本人が選んだ)。HEAD が枝に戻った時は、その枝の札に着ける。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { api, type Json } from "./diagram-support";
import { draw, type Rendered } from "./render-support";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");

type Point = [number, number];
type Lang = "ja" | "en";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface GitTag extends Rect {
  ref: string;
  step: number;
}

interface GitMove {
  ref: string;
  step: number;
  event: number;
  line?: Point[];
}

interface GitCommit {
  id: string;
  cx: number;
}

interface GitRendered {
  layout: { kind: string; commits: GitCommit[]; tags: GitTag[]; moves: GitMove[] };
}


/** 枝分かれの図の記法の見本。見本の置き場と、部品の見本帳の `<名前>.git.dragon` と `<名前>.git.en.dragon` */
function gitSources(): { file: string; text: string; lang: Lang }[] {
  const examples = readdirSync(EXAMPLES)
    .filter((f) => f.endsWith(".dragon"))
    .map((f) => ({ file: `examples/${f}`, path: join(EXAMPLES, f) }));
  const parts = readdirSync(BLOCKS)
    .map((name) => join(BLOCKS, name, "gallery"))
    .filter((dir) => existsSync(dir))
    .flatMap((dir) =>
      readdirSync(dir)
        .filter((f) => /\.git(\.en)?\.dragon$/u.test(f))
        .map((f) => ({ file: `parts/${f}`, path: join(dir, f) })),
    );
  return [...examples, ...parts]
    .map(({ file, path }) => ({ file, text: readFileSync(path, "utf8"), lang: (file.endsWith(".en.dragon") ? "en" : "ja") as Lang }))
    .filter(({ text }) => /^git /mu.test(text));
}

/** 読んで描いた枝分かれの図。読めないか描けなければ、file を名指して落とす */
function rendered(file: string, text: string, lang: Lang): GitRendered {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${file} を読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  let out: Rendered | undefined;
  let refusal = "";
  try {
    out = draw("renderDiagram")((read.ok ? read.diagram : {}) as Json, {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, `${file} を描けない`).toBe("");
  return out as unknown as GitRendered;
}

const fileText = (path: string): string => readFileSync(join(ROOT, path), "utf8");

/** 点が四角の中か縁に在る */
const touches = (p: Point, r: Rect): boolean => p[0] >= r.x - 0.5 && p[0] <= r.x + r.w + 0.5 && p[1] >= r.y - 0.5 && p[1] <= r.y + r.h + 0.5;

/** 段 `step` で HEAD を動かす線の端 */
function headLineEnd(g: GitRendered, step: number, file: string): Point {
  const lines = g.layout.moves.filter((m) => m.ref === "HEAD" && m.step === step && m.line && m.line.length > 0);
  expect(lines.length, `${file} の段 ${step + 1} に HEAD を動かす線が無い`).toBe(1);
  return (lines[0]?.line ?? []).at(-1) as Point;
}

/** 段 `step` の終わりに出ている `ref` の札。commit の真上に在るかも確かめる */
function tagOver(g: GitRendered, step: number, ref: string, commit: string, file: string): GitTag {
  const tag = g.layout.tags.find((t) => t.step === step && t.ref === ref);
  expect(tag, `${file} の段 ${step + 1} の終わりに ${ref} の札が無い`).toBeDefined();
  const at = g.layout.commits.find((c) => c.id === commit);
  expect(at, `${file} に commit ${commit} が無い`).toBeDefined();
  if (tag && at) expect(Math.abs(tag.x + tag.w / 2 - at.cx), `${file} の段 ${step + 1} の ${ref} の札が ${commit} の上に無い`).toBeLessThan(0.5);
  return tag as GitTag;
}

/** 線の端が変わる3つの見本の記法の path */
const SAMPLES = [
  "packages/dragon/examples/squash.dragon",
  "packages/dragon/examples/squash.en.dragon",
  "packages/dragon/src/blocks/copy/gallery/copy.git.dragon",
  "packages/dragon/src/blocks/copy/gallery/copy.git.en.dragon",
  "packages/dragon/src/blocks/delete/gallery/delete.git.dragon",
  "packages/dragon/src/blocks/delete/gallery/delete.git.en.dragon",
];

describe("HEAD を動かす線の端 (#3648)", () => {
  it("git-head-line-ends-at-the-joined-branch-ref", () => {
    // squash の4段目は HEAD -> E の後に main -> E で HEAD が main に戻り、S を積んで main が S へ進む。
    // delete の2段目は HEAD -> A の後に main -> A で HEAD が main に戻る。どちらも線の端は段の終わりの main の札に接する
    const cases: { path: string; step: number; commit: string }[] = [
      { path: "packages/dragon/examples/squash.dragon", step: 3, commit: "S" },
      { path: "packages/dragon/examples/squash.en.dragon", step: 3, commit: "S" },
      { path: "packages/dragon/src/blocks/delete/gallery/delete.git.dragon", step: 1, commit: "A" },
      { path: "packages/dragon/src/blocks/delete/gallery/delete.git.en.dragon", step: 1, commit: "A" },
    ];
    for (const { path, step, commit } of cases) {
      const g = rendered(path, fileText(path), path.endsWith(".en.dragon") ? "en" : "ja");
      const end = headLineEnd(g, step, path);
      const main = tagOver(g, step, "main", commit, path);
      expect(touches(end, main), `${path} の段 ${step + 1} で HEAD を動かす線の端 ${end.join(",")} が main の札に接していない`).toBe(true);
    }
  });

  it("git-head-line-ends-at-the-final-head-ref", () => {
    // copy の2段目は HEAD -> B の後に C' を積み、枝から離れた HEAD が C' へ進む。線の端は段の終わりの C' の HEAD の札に接する
    for (const path of ["packages/dragon/src/blocks/copy/gallery/copy.git.dragon", "packages/dragon/src/blocks/copy/gallery/copy.git.en.dragon"]) {
      const g = rendered(path, fileText(path), path.endsWith(".en.dragon") ? "en" : "ja");
      const end = headLineEnd(g, 1, path);
      const head = tagOver(g, 1, "HEAD", "C'", path);
      expect(touches(end, head), `${path} の段 2 で HEAD を動かす線の端 ${end.join(",")} が C' の HEAD の札に接していない`).toBe(true);
    }
  });

  it("git-move-lines-end-on-a-shown-ref", () => {
    // 札を動かす線は、どの見本と部品の図でも、その段の終わりに出ている札のどれかに端が接する
    const sources = gitSources();
    expect(sources.length, "枝分かれの図の見本が少なすぎる").toBeGreaterThan(10);
    let lines = 0;
    const loose: string[] = [];
    for (const { file, text, lang } of sources) {
      const g = rendered(file, text, lang);
      for (const m of g.layout.moves) {
        if (!m.line || m.line.length === 0) continue;
        lines += 1;
        const end = m.line.at(-1) as Point;
        if (!g.layout.tags.some((t) => t.step === m.step && touches(end, t))) loose.push(`${file} の段 ${m.step + 1} の ${m.ref} の線 (端 ${end.map((v) => v.toFixed(1)).join(",")})`);
      }
    }
    expect(lines, "札を動かす線を1本も数えていない").toBeGreaterThan(5);
    expect(loose, "端が何も無い所で終わる線").toEqual([]);
  });

  it("git-head-line-samples-have-no-breaks", () => {
    // `dragon check --layout` と同じ形で、線の端が変わる3つの見本を日本語と英語で描き、崩れの知らせが無い
    for (const path of SAMPLES) {
      const breaks = dragon.checkLayoutText(fileText(path), { lang: path.endsWith(".en.dragon") ? "en" : "ja" });
      expect(breaks.map((b) => b.kind), `${path} の崩れの知らせ`).toEqual([]);
    }
  });
});
