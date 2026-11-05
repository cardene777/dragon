/**
 * README の思想の節 (#3391)。
 *
 * dragon は、ブロックを組み立てて図を作り、mermaid と同じ手軽さで書けて表示まで出ることを目指す。
 * この考えは作る側の前提の記録 (`.ikkan/premises/product.md`) にしか無く、OSS として初めて来た人が読む README に無かった。
 * repo の README 2 つと npm の頁の README 2 つの入れ方の節の前に思想の節を置き、同じ言葉の版どうしで中身を揃える。
 * あわせて、repo の README の最初の図の節が script の 1 行の入口を示し、描ける図の欄が全ての図の種類を挙げることを確かめる。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const CATALOG = "https://cardene777.github.io/dragon/";

const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");

/** `## <見出し>` の節の本文。次の `## ` の見出しの前まで。無ければ空 */
const sectionOf = (text: string, heading: string): string => text.split(new RegExp(`^## ${heading}$`, "mu"))[1]?.split(/^## /mu)[0] ?? "";

/** 言葉ごとの README と、思想の節と入れ方の節の見出し */
const LANGS = {
  ja: { idea: "考え方", install: "## 入れ方", repo: "README.ja.md", npm: "packages/dragon/README.ja.md" },
  en: { idea: "The idea", install: "## Install", repo: "README.md", npm: "packages/dragon/README.md" },
} as const;

/** 思想の節が書く事柄ごとに、その事柄を書いたと読める字。言葉ごとに持つ */
const PHRASES = {
  ja: {
    blocks: ["| コアブロック |", "| 個別ブロック |", "| 接続ブロック |", "図は、ブロックを組み立てたものである", "1 つの表"],
    extend: ["pull request", "fork", "手元でブロックを足す口はまだ無く"],
    mermaid: ["mermaid と同じ手軽さ", "- 書く字が短い。", "- script の 1 行で出る。", "- AI が速く書ける。", "- 軽くて速い。", "mermaid とは互換にしない"],
  },
  en: {
    blocks: ["| Core blocks |", "| Kind blocks |", "| Connector blocks |", "A diagram is blocks put together", "one table"],
    extend: ["pull request", "fork", "There is no way yet for users to add their own blocks"],
    mermaid: ["as easy as mermaid", "- Short to write.", "- One script line.", "- Fast for AI to write.", "- Light and fast.", "not compatible with mermaid"],
  },
} as const;

/** 4 つの README の思想の節。言葉と置き場ごと */
const ideaSections = (): { lang: keyof typeof LANGS; path: string; section: string }[] =>
  (Object.keys(LANGS) as (keyof typeof LANGS)[]).flatMap((lang) => [LANGS[lang].repo, LANGS[lang].npm].map((path) => ({ lang, path, section: sectionOf(read(path), LANGS[lang].idea) })));

/** 図の種類の置き場の dir の名前。種類の一覧は置き場から導く */
const kindNames = (): string[] =>
  readdirSync(join(ROOT, "packages/dragon/src/kinds"))
    .filter((name) => statSync(join(ROOT, "packages/dragon/src/kinds", name)).isDirectory())
    .sort();

/** README が図の種類を呼ぶ名前 */
const KIND_LABELS: Record<"ja" | "en", Record<string, string>> = {
  ja: { architecture: "構成図", git: "枝分かれの図", lineup: "列の図", sequence: "時系列図", state: "状態遷移図", time: "時間軸の図", tree: "木の図", try: "試す図" },
  en: { architecture: "Architecture diagram", git: "Git graph", lineup: "Lineup diagram", sequence: "Sequence diagram", state: "State diagram", time: "Time diagram", tree: "Tree diagram", try: "Try diagram" },
};

describe("README の思想の節 (#3391)", () => {
  it("readme-idea-before-install", () => {
    // 4 つの README は、見本帳の場所の後、入れ方の節の前に思想の節を持つ
    for (const lang of Object.keys(LANGS) as (keyof typeof LANGS)[]) {
      for (const path of [LANGS[lang].repo, LANGS[lang].npm]) {
        const text = read(path);
        const at = [text.indexOf(CATALOG), text.indexOf(`\n## ${LANGS[lang].idea}\n`), text.indexOf(`\n${LANGS[lang].install}\n`)];
        expect(at[1], `${path} に思想の節 (## ${LANGS[lang].idea}) が無い`).toBeGreaterThan(0);
        expect([...at].sort((a, b) => a - b), `${path} の思想の節が、見本帳の場所の後、入れ方の節の前に無い`).toEqual(at);
      }
    }
  });

  it("readme-idea-names-blocks", () => {
    // 思想の節は、ブロックの 3 つの分け方を表に並べ、図がブロックを組み立てたものであることと、見た目を 1 つの表で揃えることを書く
    for (const { lang, path, section } of ideaSections()) {
      for (const phrase of PHRASES[lang].blocks) expect(section, `${path} の思想の節に「${phrase}」が無い`).toContain(phrase);
    }
  });

  it("readme-idea-names-extend-path", () => {
    // 思想の節は、今ブロックを足す道が pull request か fork で、使う人が手元で足す口はまだ無いことを書く
    for (const { lang, path, section } of ideaSections()) {
      for (const phrase of PHRASES[lang].extend) expect(section, `${path} の思想の節に「${phrase}」が無い`).toContain(phrase);
    }
  });

  it("readme-idea-names-mermaid-ease", () => {
    // 思想の節は、mermaid と同じ手軽さの 4 つと、mermaid と互換にしないことを書く
    for (const { lang, path, section } of ideaSections()) {
      for (const phrase of PHRASES[lang].mermaid) expect(section, `${path} の思想の節に「${phrase}」が無い`).toContain(phrase);
    }
  });

  it("readme-idea-same-in-repo-and-npm", () => {
    // repo の README と npm の頁の README の思想の節は、同じ言葉の版どうしで 1 字も違わない
    for (const lang of Object.keys(LANGS) as (keyof typeof LANGS)[]) {
      const repo = sectionOf(read(LANGS[lang].repo), LANGS[lang].idea);
      expect(repo, `${LANGS[lang].repo} に思想の節が無い`).not.toBe("");
      expect(sectionOf(read(LANGS[lang].npm), LANGS[lang].idea), `${LANGS[lang].npm} の思想の節が ${LANGS[lang].repo} と違う`).toBe(repo);
    }
  });
});

describe("repo の README の最初の図と、できることの表 (#3391)", () => {
  it("readme-first-diagram-points-to-script-entry", () => {
    // 最初の図の節は、script の 1 行と記法の塊で頁に図を出す書き方を示し、package の README のその節へ link する
    const cases = [
      { path: "README.ja.md", first: "最初の図", link: "](packages/dragon/README.ja.md#script-の-1-行で頁に出す)" },
      { path: "README.md", first: "A first diagram", link: "](packages/dragon/README.md#show-it-with-one-script-line)" },
    ];
    for (const { path, first, link } of cases) {
      const section = sectionOf(read(path), first);
      expect(section, `${path} の最初の図の節が記法の塊 (<pre class="dragon">) を示していない`).toContain('`<pre class="dragon">`');
      expect(section, `${path} の最初の図の節が script の 1 行を示していない`).toMatch(/script/u);
      expect(section, `${path} の最初の図の節が package の README の script の 1 行の節へ link しない`).toContain(link);
    }
  });

  it("readme-lists-every-kind-and-blocks-source", () => {
    // 描ける図の欄は全ての図の種類を挙げ、原本の欄はブロックを並べる版 2 の形 (`blocks`) を書く
    const kinds = kindNames();
    expect(kinds.length, "図の種類の置き場を 1 つも数えていない").toBeGreaterThan(0);
    for (const lang of ["ja", "en"] as const) {
      expect(Object.keys(KIND_LABELS[lang]).sort(), `検査の ${lang} の図の種類の名前が置き場の dir と合わない`).toEqual(kinds);
    }
    const ja = read("README.ja.md");
    const en = read("README.md");
    const jaKinds = /^\| 描ける図 \| (.+) \|$/mu.exec(ja)?.[1] ?? "";
    const enKinds = /^\| Diagram kinds \| (.+) \|$/mu.exec(en)?.[1] ?? "";
    for (const kind of kinds) {
      expect(jaKinds, `README.ja.md の描ける図の欄に ${KIND_LABELS.ja[kind]} が無い`).toContain(KIND_LABELS.ja[kind]);
      // 英語の欄は文の頭だけを大文字で書くので、大文字と小文字を分けずに比べる
      expect(enKinds.toLowerCase(), `README.md の Diagram kinds の欄に ${KIND_LABELS.en[kind]} が無い`).toContain((KIND_LABELS.en[kind] ?? "").toLowerCase());
    }
    expect(/^\| 原本 \| (.+) \|$/mu.exec(ja)?.[1] ?? "", "README.ja.md の原本の欄が、ブロックを並べる欄 (`blocks`) を書いていない").toContain("`blocks`");
    expect(/^\| Source \| (.+) \|$/mu.exec(en)?.[1] ?? "", "README.md の Source の欄が、ブロックを並べる欄 (`blocks`) を書いていない").toContain("`blocks`");
  });
});
