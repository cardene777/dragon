/**
 * 説明に合う図が無い時に、新しい図の種類と部品を足す skill (`dragon-extend`、#3245)。
 *
 * skill の文と登録先の一覧は人が読む文書だが、名指す path と、過去に図の種類と部品を足した取り込みで変えた file を照らし、
 * 一覧が実装からずれた時と、足す時に触る所が一覧から漏れた時に落とす。
 * 一覧の行は path を持ち、足す種類や部品ごとに名前が変わる所は `<種類>` のように山括弧で書く。末尾が `/` の行は dir の下を全て当てる。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const SKILL = join(ROOT, ".claude/skills/dragon-extend");
const SKILL_MD = join(SKILL, "SKILL.md");
const REFERENCES = join(SKILL, "references");
const REGISTRY = join(REFERENCES, "registry.md");

/** 図の種類を足した取り込み。木の図 (#3233)、木の図の書き方 (#3235)、列の図 (#3239) */
const KIND_COMMITS = ["dcf419d1", "33b853a0", "2e18ba4b"];
/** 部品を足した取り込み。箱の飛び先と段の出典 (#3199) */
const PART_COMMITS = ["b357ad1a"];
/** 登録先の一覧の表の見出し */
const KIND_TABLE = "図の種類を足す時";
const PART_TABLE = "部品を足す時";
/** repo の path として読む、backtick の中の字の頭 */
const PATH_HEAD = /^(?:packages|apps|\.claude|\.ikkan|docs|scripts)\/\S+$|^(?:README|CHANGELOG|CONTRIBUTING)\.md$/u;

const read = (path: string): string => (existsSync(path) ? readFileSync(path, "utf8") : "");
const git = (...args: string[]): string[] => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\n").filter(Boolean);

/** 一覧の行の path を正規表現にする。`<…>` は `/` を含まない 1 段、末尾の `/` は dir の下の全て */
function patternOf(path: string): RegExp {
  const source = path
    .split(/(<[^>]+>)/u)
    .map((part) => (/^<[^>]+>$/u.test(part) ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")))
    .join("");
  return new RegExp(`^${source}${path.endsWith("/") ? "" : "$"}`, "u");
}

/** 登録先の一覧の、見出し `## <title>` の節の表の行の、最初の欄の path */
function rowsOf(title: string): string[] {
  const text = read(REGISTRY);
  const start = text.indexOf(`## ${title}`);
  if (start < 0) return [];
  const rest = text.slice(start + title.length + 3);
  const end = rest.search(/^## /mu);
  return (end < 0 ? rest : rest.slice(0, end))
    .split("\n")
    .filter((line) => line.startsWith("|") && !/^\|\s*-/u.test(line))
    .flatMap((line) => {
      const found = /`([^`]+)`/u.exec(line.split("|")[1] ?? "");
      return found?.[1] ? [found[1]] : [];
    });
}

/** 取り込みで変えた file のうち、一覧のどの行にも当てはまらない物 */
function uncovered(commits: string[], rows: string[]): string[] {
  const patterns = rows.map(patternOf);
  return commits.flatMap((commit) => git("show", "--name-only", "--format=", commit).filter((file) => !patterns.some((p) => p.test(file))).map((file) => `${commit} ${file}`));
}

/** skill の文と `references/` の file */
function skillTexts(): [string, string][] {
  const refs = existsSync(REFERENCES) ? readdirSync(REFERENCES).filter((name) => name.endsWith(".md")).map((name) => join(REFERENCES, name)) : [];
  return [SKILL_MD, ...refs].filter(existsSync).map((path) => [path, read(path)]);
}

/** 空白を除いた字。決まりの言い回しは、空白の置き方の違いで落とさない */
const squash = (text: string): string => text.replace(/\s+/gu, "");

describe("記法と部品を足す skill (#3245)", () => {
  it("extend-skill-has-frontmatter", () => {
    const text = read(SKILL_MD);
    expect(text, ".claude/skills/dragon-extend/SKILL.md が無い").not.toBe("");
    const head = /^---\n([\s\S]*?)\n---\n/u.exec(text)?.[1] ?? "";
    expect(head, "SKILL.md の先頭に決まりの欄 (frontmatter) が無い").not.toBe("");
    expect(/^name: dragon-extend$/mu.test(head), "決まりの欄の名前が dragon-extend でない").toBe(true);
    const description = /^description: (.+)$/mu.exec(head)?.[1] ?? "";
    expect(description, "決まりの欄の説明に起動の言葉 (トリガー) が無い").toContain("トリガー");
  });

  it("extend-skill-walks-the-line", () => {
    const headings = read(SKILL_MD)
      .split("\n")
      .filter((line) => line.startsWith("## "));
    const at = (word: RegExp): number => headings.findIndex((line) => word.test(line));
    const stages: [string, number][] = [
      ["判定の段", at(/判定/u)],
      ["見本で選ぶ段", at(/見本/u)],
      ["ikkan の線で足す段", at(/ikkan/u)],
      ["取り込んだ後に版を聞く段", at(/版/u)],
    ];
    expect(stages.filter(([, index]) => index < 0).map(([name]) => name), "SKILL.md に無い段").toEqual([]);
    const order = stages.map(([, index]) => index);
    expect(order, "SKILL.md の段が、判定、見本、ikkan の線、版の順に並ばない").toEqual([...order].sort((a, b) => a - b));
  });

  it("extend-skill-carries-decided-rules", () => {
    const text = squash(read(SKILL_MD));
    expect(text, ".claude/skills/dragon-extend/SKILL.md が無い").not.toBe("");
    // step 2 で決めた決まりと、それを表す言い回し。言い回しを替えた時はここも替える
    const rules: [string, string[]][] = [
      ["部品を種類より先に考える", ["部品で描けるかを先に確かめる"]],
      ["今の語で言えない時だけ語を足す", ["今の語で言えない時だけ"]],
      ["新しい語は英語の動詞 1 語", ["英語の動詞1語"]],
      ["まだ描けない種類は動く試作を 3 案並べる", ["動く試作を3案"]],
      ["部品の案は dragon-propose で並べる", ["`dragon-propose`"]],
      ["1 つの課題で足すのは 1 つだけ", ["1つの課題で足すのは1つだけ"]],
      ["日本語と英語の見本をそろえる", ["日本語と英語の見本"]],
      ["1.0 までは語を替えてよく、readDiagram で読み替える", ["1.0までは語を替えてよい", "`readDiagram`"]],
      ["書き方の文書を同じ PR に入れる", ["使い方の頁とREADMEと手引き", "同じPR"]],
      ["完了条件に一式を入れず、版の前の関門で回す", ["完了条件に一式を入れない", "`deployable.sh`"]],
      ["取り込んだ後に版を出すかを本人に聞く", ["版を出すかを本人に聞く"]],
      ["値の表だけを読む検査と、ほかの種類では名札として読む検査を置く", ["`renderers-read-values-from-one-table`", "名札として読む"]],
    ];
    const missing = rules.filter(([, phrases]) => phrases.some((phrase) => !text.includes(squash(phrase)))).map(([name]) => name);
    expect(missing, "SKILL.md に無い決まり").toEqual([]);
  });

  it("extend-skill-names-existing-paths", () => {
    const tracked = git("ls-files");
    const named = skillTexts().flatMap(([file, text]) =>
      [...text.matchAll(/`([^`\s]+)`/gu)].flatMap((m) => (m[1] && PATH_HEAD.test(m[1]) ? [[file, m[1]] as [string, string]] : [])),
    );
    expect(named.length, "SKILL.md と references/ が名指す repo の path の数").toBeGreaterThan(0);
    const absent = named
      .filter(([, path]) => (/<[^>]+>/u.test(path) ? !tracked.some((file) => patternOf(path).test(file)) : !existsSync(join(ROOT, path))))
      .map(([file, path]) => `${file.slice(ROOT.length + 1)}: ${path}`);
    expect(absent, "skill が名指すが repo に無い path").toEqual([]);
  });

  it("extend-registry-covers-kind-additions", () => {
    const rows = rowsOf(KIND_TABLE);
    expect(rows.length, `登録先の一覧に「${KIND_TABLE}」の表の行が無い`).toBeGreaterThan(0);
    expect(uncovered(KIND_COMMITS, rows), "図の種類を足した取り込みで変えたが、図の種類の表に無い file").toEqual([]);
  });

  it("extend-registry-covers-part-addition", () => {
    const rows = rowsOf(PART_TABLE);
    expect(rows.length, `登録先の一覧に「${PART_TABLE}」の表の行が無い`).toBeGreaterThan(0);
    expect(uncovered(PART_COMMITS, rows), "部品を足した取り込みで変えたが、部品の表に無い file").toEqual([]);
  });

  it("extend-registry-rows-stay-narrow", () => {
    const rows = [...rowsOf(KIND_TABLE), ...rowsOf(PART_TABLE)];
    expect(rows.length, "登録先の一覧の表の行の数").toBeGreaterThan(0);
    // 名前の変わる所より前の、決まった dir の段の数。dir の行は 3 段、名前の変わる所を持つ行は 2 段より浅くしない
    const fixedDepth = (path: string): number => path.split(/<[^>]+>/u)[0]?.split("/").slice(0, -1).filter(Boolean).length ?? 0;
    const wide = rows.filter((path) => (path.endsWith("/") ? path.split("/").filter(Boolean).length < 3 : /<[^>]+>/u.test(path) && fixedDepth(path) < 2));
    expect(wide, "浅い dir を名指して漏れを隠す行").toEqual([]);
  });
});
