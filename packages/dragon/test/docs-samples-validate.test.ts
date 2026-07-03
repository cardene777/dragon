/**
 * cdl-docs (JA + EN) の code block を text-dsl として parse → visualValidate に通す geometry gate。
 *
 * docs の code sample が視覚的に破綻していると読者が実行してもゴミが出る。 docs 側 code block を
 * 抽出して text-dsl として parse し、 visualValidate の error severity 0 件で pass 判定。
 *
 * Scope。
 *  - 対象 = apps/playground/src/content/cdl-docs 配下 + cdl-docs-en 配下 の md file
 *  - fence = ``` (言語指定なし) で始まる block のうち `title:` + `type:` を含むものを text-dsl として扱う
 *  - error 0 件で pass、 warn は count のみ
 *  - parse 失敗 = skip (docs 側の説明用 fragment / 部分抜粋の可能性)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { visualValidate, type CdlDiagram, type Violation } from "@cardenelabs/cdl";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findMarkdownFiles(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && full.endsWith(".md")) out.push(full);
    }
  }
  return out;
}

interface CodeSample {
  file: string;
  index: number;
  code: string;
}

function extractCodeBlocks(md: string, file: string): CodeSample[] {
  const out: CodeSample[] = [];
  const lines = md.split("\n");
  let insideFence = false;
  let buf: string[] = [];
  let idx = 0;
  for (const line of lines) {
    if (line.startsWith("```")) {
      if (insideFence) {
        const code = buf.join("\n");
        if (/^\s*title:/m.test(code) && /^\s*type:/m.test(code)) {
          // シンタックス説明用の placeholder block (`<foo>` を含む title / type) は除外。
          // これらは「動作する完全なコード例」 ではなく docs 用テンプレなので parse 不可が正常。
          const hasPlaceholder = /<[^>]+>/.test(code);
          // 最小構造 (title + type だけで actors / flow がない block) も skip。
          // これも「最小 API 説明」 用で validate 対象外。
          const hasBody = /^\s*(actors:|nodes:|entities:|states:|flow:|steps:|animation:|relations:|columns:|groups:)/m.test(code);
          // TypeScript wrapper (`export const ... = textDslToDiagram(...)`) を含む block は
          // docs migration-guide の TS 混在例で DSL 単体として parse 不可、 skip 対象。
          const hasTsWrapper = /export\s+const|textDslToDiagram/.test(code);
          if (!hasPlaceholder && hasBody && !hasTsWrapper) {
            out.push({ file, index: idx++, code });
          }
        }
        buf = [];
        insideFence = false;
      } else {
        insideFence = true;
      }
      continue;
    }
    if (insideFence) buf.push(line);
  }
  return out;
}

const contentRoot = path.resolve(__dirname, "../../../apps/playground/src/content");
const docsJa = path.join(contentRoot, "cdl-docs");
const docsEn = path.join(contentRoot, "cdl-docs-en");

const allMarkdown = [...findMarkdownFiles(docsJa), ...findMarkdownFiles(docsEn)];
const allSamples: CodeSample[] = allMarkdown.flatMap((f) => extractCodeBlocks(fs.readFileSync(f, "utf-8"), f));

// parse に失敗する fragment は skip、 成功したものだけ validate 対象。
interface ValidatedSample {
  sample: CodeSample;
  diagram: CdlDiagram;
}

const validated: ValidatedSample[] = [];
const parseFailures: Array<{ sample: CodeSample; error: string }> = [];
for (const s of allSamples) {
  try {
    const diagram = textDslToDiagram(s.code);
    validated.push({ sample: s, diagram });
  } catch (err) {
    parseFailures.push({ sample: s, error: (err as Error).message });
  }
}

describe("cdl-docs code samples geometry gate", () => {
  it("markdown files が発見される", () => {
    expect(allMarkdown.length).toBeGreaterThan(0);
  });

  it("code block を含む sample が発見される", () => {
    expect(allSamples.length).toBeGreaterThan(0);
  });

  it("全 parse 成功 sample で visualValidate error 0 件", () => {
    const failures: Array<{ file: string; index: number; violations: Violation[] }> = [];
    for (const v of validated) {
      const report = visualValidate(v.diagram);
      const errors = report.violations.filter((x) => x.severity === "error");
      if (errors.length > 0) {
        failures.push({
          file: path.relative(contentRoot, v.sample.file),
          index: v.sample.index,
          violations: errors,
        });
      }
    }
    if (failures.length > 0) {
      const summary = failures
        .slice(0, 5)
        .map((f) => `  ${f.file}#${f.index} ... ${f.violations.length} errors: ${f.violations[0]!.detail}`)
        .join("\n");
      process.stderr.write(`docs sample errors:\n${summary}\n`);
    }
    expect(failures).toEqual([]);
  });

  it("parse 失敗数を stats として dump (skip 対象、 test は必ず pass)", () => {
    process.stderr.write(
      `[docs-samples-validate] parsed=${validated.length} parse-failed=${parseFailures.length} total=${allSamples.length}\n`,
    );
    for (const f of parseFailures.slice(0, 5)) {
      const relPath = path.relative(contentRoot, f.sample.file);
      process.stderr.write(`  parse-fail: ${relPath}#${f.sample.index} — ${f.error.slice(0, 200)}\n`);
    }
    expect(validated.length + parseFailures.length).toBe(allSamples.length);
  });
});
