/**
 * AI が dragon記法で図を書く skill と、それを配るプラグイン (#3455)。
 *
 * skill は dragon の repo の `plugins/dragon/` に置き、使う人は `/plugin marketplace add cardene777/dragon` で入れる。
 * 記法を変える PR で skill も同時に直せるよう、skill の例が今の読む処理で読めるかをこの検査で縛る。
 * プラグインの版は npm の版と同じ数にし、skill は使う人の dragon の版を `dragon --version` で確かめさせる。
 * `SKILL.md` は短く保ち、図の種類ごとの書き方は `references/` に分けて、選んだ種類の file だけを読ませる。
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { api } from "./diagram-support";

const ROOT = process.cwd();
const MARKETPLACE = join(ROOT, ".claude-plugin/marketplace.json");
const PLUGIN = join(ROOT, "plugins/dragon");
const MANIFEST = join(PLUGIN, ".claude-plugin/plugin.json");
const SKILL = join(PLUGIN, "skills/dragon");
const MAIN = join(SKILL, "SKILL.md");
const REFERENCES = join(SKILL, "references");
const KINDS = join(ROOT, "packages/dragon/src/kinds");

/** `SKILL.md` の行の上限。常に読まれる本文を短く保つ */
const MAIN_LINES = 200;

/** 日本語の字。skill の文は英語で書き、図の例の中の字だけは依頼の言葉に合わせてよい */
const JAPANESE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

const read = (path: string): string => (existsSync(path) ? readFileSync(path, "utf8") : "");
const json = (path: string): Record<string, unknown> => (existsSync(path) ? (JSON.parse(read(path)) as Record<string, unknown>) : {});

/** dir の下の Markdown の file を全て */
function markdownUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return markdownUnder(path);
    return name.endsWith(".md") ? [path] : [];
  });
}

/** skill の Markdown の file。`SKILL.md` と参照の全て */
const skillFiles = (): string[] => [...(existsSync(MAIN) ? [MAIN] : []), ...markdownUnder(REFERENCES)];

/** 頭書き (`---` で囲んだ頭) の鍵と値 */
function frontmatter(text: string): Record<string, string> {
  const head = /^---\n([\s\S]*?)\n---\n/u.exec(text)?.[1] ?? "";
  return Object.fromEntries(
    head
      .split("\n")
      .map((line) => /^([a-z-]+):\s*(.*)$/u.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => [m[1] ?? "", (m[2] ?? "").trim()]),
  );
}

/** 囲み。言葉が `dragon` の囲みの中身と始まる行 */
function dragonFences(text: string): { source: string; line: number }[] {
  const found: { source: string; line: number }[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.trim() !== "```dragon") continue;
    const end = lines.findIndex((line, k) => k > i && line.trim() === "```");
    if (end < 0) break;
    found.push({ source: lines.slice(i + 1, end).join("\n"), line: i + 2 });
    i = end;
  }
  return found;
}

/** 囲みの外の字。囲みの言葉を問わず中身を外す */
const outsideFences = (text: string): string => text.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gmu, "");

/** Markdown の link の行き先のうち、同じ skill の中の file を指す物 */
const localLinks = (text: string): string[] =>
  [...outsideFences(text).matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/gu)].map((m) => m[1] ?? "").filter((to) => !/^[a-z]+:/u.test(to));

/** 図の種類の置き場の dir の名前。置き場の一覧から導き、手で並べない */
const kindNames = (): string[] => readdirSync(KINDS).filter((name) => statSync(join(KINDS, name)).isDirectory()).sort();

describe("dragon記法の skill を配るプラグイン (#3455)", () => {
  it("marketplace-lists-dragon-plugin", () => {
    const market = json(MARKETPLACE);
    const plugins = (market.plugins ?? []) as { name?: string; source?: string }[];
    const entry = plugins.find((plugin) => plugin.name === "dragon");
    expect(entry, `${relative(ROOT, MARKETPLACE)} がプラグイン dragon を持たない`).toBeDefined();
    expect(entry?.source, "プラグイン dragon の置き場が plugins/dragon でない").toBe("./plugins/dragon");
    const manifest = json(MANIFEST);
    expect(manifest.name, `${relative(ROOT, MANIFEST)} の名前が dragon でない`).toBe("dragon");
    expect(typeof manifest.version, "プラグインの版が無い").toBe("string");
    expect(typeof manifest.description === "string" ? manifest.description : "", "プラグインの説明が無い").not.toBe("");
  });

  it("plugin-version-matches-package", () => {
    const pkg = json(join(ROOT, "packages/dragon/package.json"));
    expect(json(MANIFEST).version, "プラグインの版が @cardenelabs/dragon の版と違う").toBe(pkg.version);
  });

  it("skill-main-stays-short", () => {
    const text = read(MAIN);
    expect(text, `${relative(ROOT, MAIN)} が無い`).not.toBe("");
    const head = frontmatter(text);
    expect(head.name, "skill の名前が dragon でない").toBe("dragon");
    expect(head.description ?? "", "skill の説明が無い").not.toBe("");
    const lines = text.split("\n").length;
    expect(lines, `SKILL.md が ${lines} 行で、上限の ${MAIN_LINES} 行を超える`).toBeLessThanOrEqual(MAIN_LINES);
  });

  it("skill-links-resolve", () => {
    const files = skillFiles();
    expect(files.length, "skill の file が無い").toBeGreaterThan(1);
    const broken = files.flatMap((file) =>
      localLinks(read(file))
        .filter((to) => !existsSync(join(dirname(file), to)))
        .map((to) => `${relative(ROOT, file)} -> ${to}`),
    );
    expect(localLinks(read(MAIN)).length, "SKILL.md が参照の file を 1 つも名指さない").toBeGreaterThan(0);
    expect(broken, "名指した file が無い").toEqual([]);
  });

  it("skill-covers-every-kind", () => {
    const kinds = kindNames();
    // 走査の空振りを避ける。図の種類は 1 つ以上ある
    expect(kinds.length, "図の種類の置き場を数えられない").toBeGreaterThan(0);
    const main = read(MAIN);
    const missing = kinds.filter((kind) => !existsSync(join(REFERENCES, "kinds", `${kind}.md`)));
    const unnamed = kinds.filter((kind) => !main.includes(`references/kinds/${kind}.md`));
    expect(missing, "書き方の参照が無い図の種類").toEqual([]);
    expect(unnamed, "SKILL.md が名指さない図の種類の参照").toEqual([]);
  });

  it("skill-fences-parse", () => {
    const parse = api("parseNotation");
    const fences = skillFiles().flatMap((file) => dragonFences(read(file)).map((fence) => ({ ...fence, file })));
    // 走査の空振りを避ける。どの図の種類の参照も読める例を 1 つ以上持つ
    expect(fences.length, "skill に dragon の囲みが無い").toBeGreaterThanOrEqual(kindNames().length);
    const failed = fences.flatMap(({ source, line, file }) => {
      const parsed = parse(source, { lang: "en" });
      return parsed.ok ? [] : [`${relative(ROOT, file)}:${line + (parsed.errors[0]?.line ?? 1) - 1} ${parsed.errors[0]?.message ?? ""}`];
    });
    expect(failed, "読めない dragon の囲み").toEqual([]);
  });

  it("skill-written-in-english", () => {
    const files = skillFiles();
    expect(files.length, "skill の file が無い").toBeGreaterThan(0);
    const japanese = files.flatMap((file) =>
      outsideFences(read(file))
        .split("\n")
        .map((line, i) => ({ line, at: i + 1 }))
        .filter(({ line }) => JAPANESE.test(line))
        .map(({ at }) => `${relative(ROOT, file)}:${at}`),
    );
    expect(japanese, "囲みの外に日本語の字を持つ行").toEqual([]);
  });

  it("skill-names-version-check-and-fix-loop", () => {
    const text = read(MAIN);
    const steps = {
      "使う人の dragon の版を確かめる": "dragon --version",
      "書いた後に確かめて直す": "dragon check",
      "説明の図は段と say で書く": "`step` and `say`",
      "短い記法は小さな図と下書きに使う": "short form",
      "図の中の字は依頼の言葉に合わせる": "same language as the request",
    };
    const missing = Object.entries(steps)
      .filter(([, words]) => !text.includes(words))
      .map(([step, words]) => `${step} (${words})`);
    expect(missing, "SKILL.md が書かない手順").toEqual([]);
  });

  it("skill-blocks-reference-covers-define-share-and-pr", () => {
    const text = read(join(REFERENCES, "blocks.md"));
    const parts = {
      "図の頭の定義の書き方": "blocks 1",
      "共有のブロック集の置き場": "packages/dragon/blocks/",
      "共有のブロック集の見本の置き場": "packages/dragon/blocks/examples/",
      "PR の作り方": "gh pr create",
    };
    const missing = Object.entries(parts)
      .filter(([, words]) => !text.includes(words))
      .map(([part, words]) => `${part} (${words})`);
    expect(missing, "ブロックの参照が書かない事").toEqual([]);
  });

  it("skill-setup-reference-covers-three-ways", () => {
    const text = read(join(REFERENCES, "setup.md"));
    const ways = {
      "npm での入れ方": "npm install @cardenelabs/dragon",
      "文書のサイトに置く script の 1 行": '<script type="module"',
      "Markdown から作った HTML の囲み": "language-dragon",
      "README に画像で埋める書き出し": "dragon export",
      "アプリで描く関数": "renderDiagram",
    };
    const missing = Object.entries(ways)
      .filter(([, words]) => !text.includes(words))
      .map(([way, words]) => `${way} (${words})`);
    expect(missing, "入れ方の参照が書かない事").toEqual([]);
  });
});
