/**
 * 説明に合う図が無い時に、新しい図の種類と部品を足す skill (`dragon-extend`、#3245)。
 *
 * skill の文と登録先の一覧は人が読む文書だが、名指す path と、過去に図の種類を足した取り込みで変えた file と、
 * ブロックの置き場の外で個別ブロックを並べて持つ file を照らし、一覧が実装からずれた時と、足す時に触る所が一覧から漏れた時に落とす。
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
/** 登録先の一覧の表の見出し */
const KIND_TABLE = "図の種類を足す時";
/** ブロックを足す時の表の見出しと、表の行の数の上限 (#3350) */
const BLOCK_TABLE = "ブロックを足す時";
const BLOCK_ROWS_MOST = 6;
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
/**
 * 過去の取り込みが変えた file のうち、登録先の一覧のどの行にも当たらない物。
 * 今の repo に無い file は数えない。後の取り込みが置き場を移した file (見本帳の部品の図はブロックの置き場の `gallery/` へ移った、#3348) は、
 * 足す時に触る登録先ではなくなっている。一覧は今在る path だけを名指す (`extend-skill-names-existing-paths`)
 */
function uncovered(commits: string[], rows: string[]): string[] {
  const patterns = rows.map(patternOf);
  const tracked = new Set(git("ls-files"));
  return commits.flatMap((commit) =>
    git("show", "--name-only", "--format=", commit)
      .filter((file) => tracked.has(file) && !patterns.some((p) => p.test(file)))
      .map((file) => `${commit} ${file}`),
  );
}

/** 書き出した一覧の冒頭の注釈。書き出した script を名指し、手で直さないと書く */
const GENERATED = /^\/\/ packages\/dragon\/scripts\/build-[a-z-]+\.mjs が.*手で直さない/u;

/** 前提 (`product.md`) の節の本文。見出しから次の `## ` の見出しの前まで */
function premiseSection(title: string): string {
  const lines = read(join(ROOT, ".ikkan/premises/product.md")).split("\n");
  const start = lines.indexOf(`## ${title}`);
  if (start < 0) return "";
  const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  return lines.slice(start + 1, end < 0 ? undefined : end).join("\n");
}

/**
 * ブロックの置き場の外で、個別ブロックの置き場を 2 つ以上名指す file (#3350)。
 * 個別ブロックを並べて持つ file は、個別ブロックを足すと並びに足すので、ブロックを足す時に触る。
 * 1 つだけを名指す file はそのブロックを使う所で、ほかのブロックを足しても触らない。書き出した一覧は数えない
 */
async function handLists(): Promise<string[]> {
  const { BLOCKS } = (await import("../src/blocks/index")) as unknown as { BLOCKS: Record<string, { name: string; attach: { only?: string } }> };
  const individual = Object.values(BLOCKS).filter((block) => block.attach.only !== undefined).map((block) => block.name);
  return git("ls-files", "packages/dragon/src", "packages/dragon/scripts", "packages/dragon/test", "apps/playground-spa/src")
    .filter((file) => /\.(?:ts|tsx|mjs)$/u.test(file) && !file.startsWith("packages/dragon/src/blocks/"))
    .filter((file) => {
      const text = read(join(ROOT, file));
      if (GENERATED.test(text.split("\n")[0] ?? "")) return false;
      return individual.filter((name) => text.includes(`blocks/${name}/`)).length >= 2;
    });
}

/** skill の文と `references/` の file */
function skillTexts(): [string, string][] {
  const refs = existsSync(REFERENCES) ? readdirSync(REFERENCES).filter((name) => name.endsWith(".md")).map((name) => join(REFERENCES, name)) : [];
  return [SKILL_MD, ...refs].filter(existsSync).map((path) => [path, read(path)]);
}

/** 空白を除いた字。決まりの言い回しは、空白の置き方の違いで落とさない */
const squash = (text: string): string => text.replace(/\s+/gu, "");

describe("記法と図の種類とブロックを足す skill (#3245)", () => {
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

  it("extend-skill-release-checks-in-checks-md", () => {
    // ikkan 0.15.8 の配る前の関門は命令を引数で受けず、`.ikkan/checks.md` の欄を回す (#3589)
    const text = squash(read(SKILL_MD));
    expect(text, ".claude/skills/dragon-extend/SKILL.md が無い").not.toBe("");
    expect(text, "版を出す前に確かめる物を `.ikkan/checks.md` の欄が持つと書かない").toMatch(new RegExp(`${squash("`.ikkan/checks.md`").replaceAll(".", "\\.")}の欄`, "u"));
    expect(text, "配る前の関門の呼び方 (`deployable.sh --since`) を書かない").toContain(squash("`deployable.sh --since"));
    expect(text, "配った後の関門 (`deployed.sh`) を書かない").toContain(squash("`deployed.sh`"));
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

  it("extend-registry-rows-stay-narrow", () => {
    const rows = [...rowsOf(KIND_TABLE), ...rowsOf(BLOCK_TABLE)];
    expect(rows.length, "登録先の一覧の表の行の数").toBeGreaterThan(0);
    // 名前の変わる所より前の、決まった dir の段の数。dir の行は 3 段、名前の変わる所を持つ行は 2 段より浅くしない
    const fixedDepth = (path: string): number => path.split(/<[^>]+>/u)[0]?.split("/").slice(0, -1).filter(Boolean).length ?? 0;
    const wide = rows.filter((path) => (path.endsWith("/") ? path.split("/").filter(Boolean).length < 3 : /<[^>]+>/u.test(path) && fixedDepth(path) < 2));
    expect(wide, "浅い dir を名指して漏れを隠す行").toEqual([]);
  });
});

describe("ブロックを足す時の登録先 (#3350)", () => {
  it("extend-registry-block-rows-shrink", async () => {
    const rows = rowsOf(BLOCK_TABLE);
    expect(rows.length, `登録先の一覧に「${BLOCK_TABLE}」の表の行が無い`).toBeGreaterThan(0);
    expect(rows.length, "ブロックを足す時の表の行の数").toBeLessThanOrEqual(BLOCK_ROWS_MOST);
    const tracked = git("ls-files");
    const absent = rows.filter((path) => (/<[^>]+>/u.test(path) ? !tracked.some((file) => patternOf(path).test(file)) : !existsSync(join(ROOT, path))));
    expect(absent, "ブロックを足す時の表が名指すが repo に無い path").toEqual([]);
    // 個別ブロックを並べて持つ file は、ブロックを足す時に触るので、表のどれかの行に当たる
    const lists = await handLists();
    expect(lists.length, "個別ブロックを並べて持つ file が無い (走査の空振り)").toBeGreaterThan(0);
    const patterns = rows.map(patternOf);
    expect(lists.filter((file) => !patterns.some((p) => p.test(file))), "個別ブロックを並べて持つが、表のどの行にも当たらない file").toEqual([]);
  });
});

describe("部品の考え方 (#3339)", () => {
  it("parts-concept-names-real-paths", () => {
    // 前提の節は部品を共通と図の種類だけの 2 段に分ける考え方を書き、根拠の置き場を backtick で名指す。
    // 名指した file を動かすと節が黙って古くなるので、backtick の中の字を全て repo の path として読み、在るかを確かめる
    const lines = read(join(ROOT, ".ikkan/premises/product.md")).split("\n");
    const start = lines.indexOf("## 部品の考え方");
    expect(start, "前提に部品の考え方の節が無い").toBeGreaterThanOrEqual(0);
    const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
    const body = lines.slice(start + 1, end < 0 ? undefined : end).join("\n");
    const paths = [...body.matchAll(/`([^`]+)`/gu)].map((match) => match[1] ?? "");
    expect(paths.length, "節が根拠の置き場を 1 つも名指さない").toBeGreaterThan(0);
    expect(paths.filter((path) => !existsSync(join(ROOT, path))), "節が名指す path のうち repo に無い物").toEqual([]);
  });

  it("parts-concept-names-block-and-kind-folders", () => {
    // 部品の考え方は、ブロックを組み立てて図を描く作りの言葉で書き、ブロックと図の種類の置き場の dir を名指す (#3350)
    const body = premiseSection("部品の考え方");
    expect(body, "前提に部品の考え方の節が無い").not.toBe("");
    const words = ["ブロック", "コアブロック", "個別ブロック", "接続ブロック", "付け方", "図の種類"];
    expect(words.filter((word) => !body.includes(word)), "部品の考え方の節に無い言葉").toEqual([]);
    expect(/図(?!の種類)/u.test(body), "部品の考え方の節に図の言葉が無い").toBe(true);
    expect(["台", "つなぎ口"].filter((word) => body.includes(word)), "使わないと決めた言葉").toEqual([]);
    const paths = [...body.matchAll(/`([^`]+)`/gu)].map((match) => match[1] ?? "");
    expect(["packages/dragon/src/blocks/", "packages/dragon/src/kinds/"].filter((dir) => !paths.includes(dir)), "部品の考え方の節が名指さない置き場の dir").toEqual([]);
    expect(paths.filter((path) => !existsSync(join(ROOT, path))), "節が名指す path のうち repo に無い物").toEqual([]);
  });

  it("premise-purpose-names-script-entry", () => {
    // 目的の節は、mermaid と同じ手軽さで書けて表示まで出る理念を書き、script の 1 行の入口の課題を名指す (#3350)
    const body = premiseSection("目的");
    expect(body, "前提に目的の節が無い").not.toBe("");
    expect(body.includes("mermaid"), "目的の節が mermaid と比べた手軽さを書かない").toBe(true);
    expect(body.includes("#3343"), "目的の節が script の 1 行の入口の課題 (#3343) を名指さない").toBe(true);
  });
});
