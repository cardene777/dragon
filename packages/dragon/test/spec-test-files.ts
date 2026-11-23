/**
 * 受入条件の記録 (`.ikkan/specs/*.md`) の行を、命令が名指す検査の file と照らす道具 (#3768)。
 *
 * 確かめ方の欄は `pnpm exec vitest run <検査の file>`の検査`<名前>`が通る、の形で書く。
 * 名前がどこかの検査の file に在るかだけを見ると、検査を別の file へ移した時に、記録の命令が名指す file と検査の在る file のずれを見落とす。
 * そこで、命令が検査の file を名指す行は、その file と、その file が import する助けの file に名前が在るかを見る。
 * 検査の file を名指さない命令 (`pnpm test` など) の後に書いた名前は、呼ぶ側が渡す `namedAnywhere` で、どこかの検査の file に在るかを見る。
 */

export interface SpecRowsInput {
  /** 受入条件の記録。file の名前と字 */
  specs: { file: string; text: string }[];
  /** 根から見た path の file の字。無い時は undefined */
  read: (path: string) => string | undefined;
  /** 検査の file を名指さない命令の後に書いた名前が、どこかの検査の file に在るか */
  namedAnywhere: (name: string) => boolean;
}

export interface SpecRowsResult {
  /** 照らした名前の数 */
  counted: number;
  /** 照らして外れた行。`<記録の file>:<行> <中身>` の形 */
  problems: string[];
}

/** 命令の中の検査の file の path。`.test.tsx` を `.test.ts` と読まないよう、長い拡張子を先に試す */
const TEST_PATH = /[\w./@-]+\.test\.(?:tsx|ts|mjs|js)(?![\w.])/gu;
/** 助けの file を読む import と export ... from。相対の path だけを辿る */
const RELATIVE_IMPORT = /(?:^|[\s;])(?:import|export)\b[^"';]*?["'](\.{1,2}\/[^"']+)["']/gu;
/** import の path に拡張子が無い時に試す拡張子 */
const EXTENSIONS = ["", ".ts", ".tsx", ".mts", ".mjs", ".js"];

/** path を `/` で区切って `.` と `..` を畳む */
function normalize(path: string): string {
  const out: string[] = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

const dirOf = (path: string): string => path.slice(0, Math.max(path.lastIndexOf("/"), 0));

/**
 * 検査の名前を組む字の型。`` `overview-parts-${kind}` `` のように、頭に 3 字以上の決まった字を持つ物だけを読む。
 * 頭に決まった字の無い型 (`` `${name}` ``) はどの名前にも当たるので読まない
 */
const NAME_TEMPLATE = /`([\w-]{3,}(?:\$\{[^}`]+\}[\w-]*)+)`/gu;

/** 正規表現の中で字のまま読ませる */
const literal = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/**
 * 検査の名前が字の中に引用符で囲んで書かれているか。
 * 登録表や見本の一覧から名前を組んで件を作る検査 (#3849、#3852) は、名前を組む字の型のどれかが名前の全体に当たる時も書かれていると読む
 */
const quotedIn = (text: string, name: string): boolean =>
  [`"${name}"`, `'${name}'`, `\`${name}\``].some((quoted) => text.includes(quoted)) ||
  [...text.matchAll(NAME_TEMPLATE)].some((m) =>
    new RegExp(
      `^${(m[1] ?? "")
        .split(/\$\{[^}`]+\}/u)
        .map(literal)
        .join("[\\w.-]+")}$`,
      "u",
    ).test(name),
  );

/**
 * 欄の字から、名前と命令を書いた順に読む。
 * backtick で囲んだ語のうち、空白と `/` と `.` を持たない語と、二重引用符で囲んだ語を名前と読む (`test-policy.test.ts` の `namesIn` と同じ読み方)。
 * それ以外の語は命令か path と読み、検査の file の path を持てば、その後の名前を照らす file を替える。
 * 検査の file を持たず空白を持つ語は別の命令と読み、その後の名前は file を名指さない名前にする。
 */
function* namesWithFiles(cell: string): Generator<{ name: string; files: string[] | undefined }> {
  let files: string[] | undefined;
  for (const m of cell.matchAll(/`([^`]+)`/gu)) {
    const raw = m[1] ?? "";
    if (raw.startsWith('"') && raw.endsWith('"') && raw.length > 1) {
      yield { name: raw.slice(1, -1), files };
      continue;
    }
    if (!/[\s/.]/u.test(raw)) {
      yield { name: raw, files };
      continue;
    }
    const paths = [...raw.matchAll(TEST_PATH)].map((p) => normalize(p[0]));
    if (paths.length > 0) files = paths;
    else if (/\s/u.test(raw)) files = undefined;
  }
}

/** 記録の行を照らし、外れた行を返す */
export function specRowProblems(input: SpecRowsInput): SpecRowsResult {
  const texts = new Map<string, string | undefined>();
  const textOf = (path: string): string | undefined => {
    if (!texts.has(path)) texts.set(path, input.read(path));
    return texts.get(path);
  };
  /**
   * 検査の file と、そこから相対の import で辿れる助けの file の字を全てつないだ物。
   * 辿るのは、読む側と同じ `test` の dir の下に在る file だけにする。検査が読む製品の code は検査の名前を持たないため
   */
  const closures = new Map<string, string>();
  const closureOf = (path: string): string => {
    const cached = closures.get(path);
    if (cached !== undefined) return cached;
    const seen = new Set<string>();
    const parts: string[] = [];
    const visit = (file: string): void => {
      if (seen.has(file)) return;
      seen.add(file);
      const text = textOf(file);
      if (text === undefined) return;
      parts.push(text);
      for (const m of text.matchAll(RELATIVE_IMPORT)) {
        const target = normalize(`${dirOf(file)}/${m[1] ?? ""}`);
        if (!/(?:^|\/)test\//u.test(target)) continue;
        const found = EXTENSIONS.map((ext) => `${target}${ext}`).find((candidate) => textOf(candidate) !== undefined);
        if (found !== undefined) visit(found);
      }
    };
    visit(path);
    const joined = parts.join("\n");
    closures.set(path, joined);
    return joined;
  };

  let counted = 0;
  const problems: string[] = [];
  for (const spec of input.specs) {
    const lines = spec.text.split("\n");
    for (const [index, line] of lines.entries()) {
      if (!line.startsWith("|") || /^\|\s*-/u.test(line)) continue;
      const cell = line.split("|").slice(1, -1)[1]?.trim() ?? "";
      const where = `${spec.file}:${index + 1}`;
      const missingReported = new Set<string>();
      for (const { name, files } of namesWithFiles(cell)) {
        counted += 1;
        if (files === undefined) {
          if (!input.namedAnywhere(name)) problems.push(`${where} ${name} はどの検査の file にも無い`);
          continue;
        }
        const present = files.filter((file) => textOf(file) !== undefined);
        for (const file of files)
          if (!present.includes(file) && !missingReported.has(file)) {
            missingReported.add(file);
            problems.push(`${where} ${file} が無い`);
          }
        if (present.length === 0) continue;
        if (!present.some((file) => quotedIn(closureOf(file), name))) problems.push(`${where} ${name} は ${files.join("、")} に無い`);
      }
    }
  }
  return { counted, problems };
}
