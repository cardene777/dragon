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

/** Markdown の `heading` の行から、同じ深さか浅い次の見出しの前までの文。見出しが無い時は空 */
function sectionOf(text: string, heading: string): string {
  const start = text.split("\n").indexOf(heading);
  if (start < 0) return "";
  const depth = heading.indexOf(" ");
  const rows = text.split("\n").slice(start + 1);
  const end = rows.findIndex((row) => /^#+ /u.test(row) && row.indexOf(" ") <= depth);
  return rows.slice(0, end >= 0 ? end : undefined).join("\n");
}

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

  it("marketplace-describes-the-plugin", () => {
    // 説明文が無いと `claude plugin validate` が警告する (#3468)。説明は英語の 1 文で書く
    const metadata = (json(MARKETPLACE).metadata ?? {}) as { description?: unknown };
    const description = typeof metadata.description === "string" ? metadata.description : "";
    expect(description, `${relative(ROOT, MARKETPLACE)} の metadata.description が無い`).not.toBe("");
    expect(description, "説明が 1 文でない").toMatch(/^[^.!?]+[.!?]$/u);
    expect(description, "説明に日本語の字がある").not.toMatch(JAPANESE);
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

  // PR を出す前の確かめは、入れた dragon で定義の file と見本を回す。fork を組み立てた CLI は評価の囲いでも利用者の手元でも重い (#3508)
  it("skill-blocks-pr-checks-with-installed-dragon", () => {
    const text = read(join(REFERENCES, "blocks.md"));
    const start = text.indexOf("## Offer a reusable block to the dragon repo");
    expect(start, "PR を出す手順の節が無い").toBeGreaterThanOrEqual(0);
    // 見出しの頭の 1 字を外して、次の節の見出しまでを切り出す
    const rest = text.slice(start + 1);
    const end = rest.search(/^## /mu);
    const section = end >= 0 ? rest.slice(0, end) : rest;
    expect(section, "定義の file を入れた dragon で確かめない").toMatch(/dragon check packages\/dragon\/blocks\/<name>\.dragon/u);
    expect(section, "見本を --blocks で定義を渡して確かめない").toMatch(/dragon check --blocks packages\/dragon\/blocks\/<name>\.dragon packages\/dragon\/blocks\/examples\/<name>\.dragon/u);
    expect(section, "fork を組み立てた CLI で確かめる手順が残る").not.toContain("dist/cli.js");
    expect(section, "pnpm verify を手順から外した").toContain("pnpm verify");
    expect(section, "pnpm verify を回せない時に PR 本文へ書くと書かない").toMatch(/cannot run `pnpm verify`[^\n]*PR body|PR body[^\n]*cannot run `pnpm verify`/u);
  });

  // 9 種類のどれにも合わない時は、押し込まず Issue も急がず、近い種類で描いて書き出し、足りるかを利用者が決める (#3513)
  it("skill-no-fitting-kind-draws-first", () => {
    const section = sectionOf(read(MAIN), "## 2. Pick the kind");
    expect(section, "図の種類を選ぶ節が無い").not.toBe("");
    const parts = {
      "どの種類にも合わない時の書き出し": /When no kind fits/u,
      "近い種類で書く": /closest kind/u,
      "崩れまで確かめる": /dragon check --layout/u,
      "書き出して見せる": /dragon export/u,
      "利用者が決める": /the user decides/u,
      "Issue へ進む道": /issue/iu,
    };
    const missing = Object.entries(parts)
      .filter(([, pattern]) => !pattern.test(section))
      .map(([part]) => part);
    expect(missing, "図の種類を選ぶ節が、合う種類が無い時に書かない事").toEqual([]);
  });

  // 新しい図の種類の Issue は、立てる前に聞き、試した記法と描けなかった所を本文に載せる (#3513)
  it("skill-new-kind-issue-carries-attempt", () => {
    const section = sectionOf(read(join(REFERENCES, "blocks.md")), "## Ask for a new kind of diagram");
    expect(section, "新しい図の種類を頼む節が無い").not.toBe("");
    const parts = {
      "立てる前に利用者に聞く": /Ask the user first/u,
      "描きたい動き": /what the diagram must show/u,
      "試した記法を dragon の囲みで載せる": /```dragon/u,
      "描けなかった所": /could not draw/u,
      "Issue の立て方": /gh issue create --repo cardene777\/dragon/u,
    };
    const missing = Object.entries(parts)
      .filter(([, pattern]) => !pattern.test(section))
      .map(([part]) => part);
    expect(missing, "新しい図の種類を頼む節が書かない事").toEqual([]);
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

  // 記法が正しくても、描くと番号の丸や線が詰まり、形を持つブロックから枠や字がはみ出す図がある (#3484)。
  // skill は描いた結果の崩れを確かめ、記法で直せる崩れを直してから、残った崩れを段と物の名前で伝えさせる
  it("skill-names-layout-check-loop", () => {
    const text = read(MAIN);
    const steps = {
      "描いた結果の崩れを確かめる": "dragon check --layout",
      "崩れた段の PNG を書き出す": "--format png --step",
      "崩れの直し方の参照": "references/layout.md",
      "残った崩れを段の番号で伝える": "step number",
      "書き出せない時は文だけで伝える": "Chromium",
    };
    const missing = Object.entries(steps)
      .filter(([, words]) => !text.includes(words))
      .map(([step, words]) => `${step} (${words})`);
    expect(missing, "SKILL.md が書かない崩れの手順").toEqual([]);
  });

  it("skill-blocks-names-block-icon", () => {
    // 箱を元にしたブロックの定義は icon の行を持てる。共有の +bridge は石の橋の絵柄を持つ角丸の箱 (#3489)
    const text = read(join(REFERENCES, "blocks.md"));
    expect(text, "references/blocks.md が無い").not.toBe("");
    const definitions = [...text.matchAll(/^ *block \+[a-z][a-z0-9-]*\n(?:.*\n)*? *end$/gmu)].map((match) => match[0]);
    expect(definitions.length, "定義の見本を数えられない (走査の空振り)").toBeGreaterThan(0);
    expect(
      definitions.some((d) => /^ *base box\b/mu.test(d) && /^ *icon tabler:[a-z0-9-]+$/mu.test(d)),
      "箱を元にした定義に Tabler の絵柄の icon の行を書く見本が無い",
    ).toBe(true);
    const bridgeRow = text.split("\n").find((line) => line.startsWith("| `+bridge` |")) ?? "";
    expect(bridgeRow, "共有の +bridge の行が石の橋の絵柄を持たない").toContain("tabler:building-bridge-2");
    expect(bridgeRow, "共有の +bridge の行がまだアーチの path を持つ").not.toContain("path");
  });

  it("skill-layout-fixes-and-issue-route", () => {
    const text = read(join(REFERENCES, "layout.md"));
    expect(text, "references/layout.md が無い").not.toBe("");
    const parts = {
      "崩れの種類 (浮いた丸)": "badge-off-shape",
      "崩れの種類 (はみ出した枠)": "slot-outside-shape",
      "崩れの種類 (はみ出した字)": "text-outside-shape",
      "崩れの種類 (近すぎる丸)": "badges-close",
      "崩れの種類 (詰まった線)": "lines-close",
      "崩れの種類 (図の枠からはみ出す部品、#3515)": "part-outside-frame",
      "札を短くする直し方 (#3515)": "Shorten the tag",
      "箱の並びを変える直し方": "Reorder the boxes",
      "名前を短くする直し方": "Shorten",
      "描き方の側の崩れを課題として送る案内": "blocks.md",
    };
    const missing = Object.entries(parts)
      .filter(([, words]) => !text.includes(words))
      .map(([part, words]) => `${part} (${words})`);
    expect(missing, "崩れの参照が書かない事").toEqual([]);
  });

  it("skill-layout-no-reply-workaround", () => {
    // 行きと帰りの線は dragon が崩れの下限より広く離して描くので (#3521)、記法で避ける手と、描き方の側の崩れとして伝える案内を書かない
    const layout = read(join(REFERENCES, "layout.md"));
    const skill = read(join(SKILL, "SKILL.md"));
    expect(layout, "references/layout.md が無い").not.toBe("");
    expect(skill, "SKILL.md が無い").not.toBe("");
    const checks: [string, string, string][] = [
      ["references/layout.md", layout, "a request and its reply"],
      ["references/layout.md", layout, "reply drawn right next to its request"],
      ["SKILL.md", skill, "a request and its reply drawn on top of each other"],
    ];
    const said = checks.flatMap(([file, text, words]) => (text.includes(words) ? [`${file}: ${words}`] : []));
    expect(said, "行きと帰りの線の崩れを記法で避ける手か、描き方の側の崩れとして書く").toEqual([]);
  });
});
