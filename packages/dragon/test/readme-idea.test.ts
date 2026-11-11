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
    extend: ["pull request", "fork", "使う人が自分の手元でも足せる"],
    mermaid: ["mermaid と同じ手軽さ", "- 書く字が短い。", "- script の 1 行で出る。", "- AI が速く書ける。", "- 軽くて速い。", "mermaid とは互換にしない"],
  },
  en: {
    blocks: ["| Core blocks |", "| Kind blocks |", "| Connector blocks |", "A diagram is blocks put together", "one table"],
    extend: ["pull request", "fork", "You can also add your own blocks in your own project"],
    mermaid: ["as easy as mermaid", "- Short to write.", "- One script line.", "- Fast for AI to write.", "- Light and fast.", "not compatible with mermaid"],
  },
} as const;

/** AI が書く形を書いたと読める字と、前の形 (AI は JSON で書く) の字。言葉ごとに持つ (#3438) */
const AI_WRITES = {
  ja: { says: ["AI も人と同じ記法で書き", "読む処理の誤りの文"], old: "AI は同じ図を JSON で書き" },
  en: { says: ["AI writes the same notation as people", "the parser's error messages"], old: "AI writes the same diagram as JSON" },
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
  ja: { architecture: "構成図", chart: "量の図", cycle: "回り続ける図", er: "表どうしの関係の図", flow: "手順の図", git: "枝分かれの図", lineup: "列の図", mind: "考えを広げる地図", pipe: "配管の図", sankey: "量の行き先の図", sequence: "時系列図", state: "状態遷移図", time: "時間軸の図", tree: "木の図", try: "試す図", venn: "集合の重なりの図" },
  en: { architecture: "Architecture diagram", chart: "Chart", cycle: "Cycle diagram", er: "Table relation diagram", flow: "Flow diagram", git: "Git graph", lineup: "Lineup diagram", mind: "Mind map", pipe: "Pipe diagram", sankey: "Sankey diagram", sequence: "Sequence diagram", state: "State diagram", time: "Time diagram", tree: "Tree diagram", try: "Try diagram", venn: "Set overlap diagram" },
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
    // 思想の節は、使う人が手元でブロックを足せることと、図の種類と元にできるブロックを増やす道が pull request か fork であることを書く (#3399)
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

  it("readme-idea-ai-writes-notation", () => {
    // AI も人と同じ記法で書き、読む処理の誤りの文で直す。JSON は原本として残すが、AI に JSON で書かせない (#3438)
    for (const { lang, path, section } of ideaSections()) {
      expect(section, `${path} に思想の節が無い`).not.toBe("");
      for (const phrase of AI_WRITES[lang].says) expect(section, `${path} の思想の節に「${phrase}」が無い`).toContain(phrase);
      expect(section, `${path} の思想の節が、AI は JSON で書くと書いている`).not.toContain(AI_WRITES[lang].old);
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

/** 使う人がブロックを足す節の見出しと、その節へのリンクの行き先の頭 (#3399) */
const EXTEND = {
  ja: { heading: "ブロックを足す", anchor: "#ブロックを足す", old: "手元でブロックを足す口はまだ無く" },
  en: { heading: "Add your own blocks", anchor: "#add-your-own-blocks", old: "There is no way yet for users to add their own blocks" },
} as const;

describe("使う人がブロックを足す節 (#3399)", () => {
  it("readme-idea-links-block-extension", () => {
    // 足す口を開いたので、4 つの考え方の節は「まだ無い」 と書かず、package の README の足し方の節を指す
    for (const { lang, path, section } of ideaSections()) {
      expect(section, `${path} の考え方の節が無い`).not.toBe("");
      expect(section, `${path} の考え方の節が、足す口はまだ無いと書いている`).not.toContain(EXTEND[lang].old);
      const targets = [...section.matchAll(/\]\(([^)]+)\)/gu)].map((m) => m[1] ?? "");
      expect(
        targets.some((t) => t.endsWith(EXTEND[lang].anchor)),
        `${path} の考え方の節が、足し方の節 (${EXTEND[lang].anchor}) へのリンクを持たない`,
      ).toBe(true);
    }
    for (const lang of Object.keys(LANGS) as (keyof typeof LANGS)[]) {
      const path = LANGS[lang].npm;
      const section = sectionOf(read(path), EXTEND[lang].heading);
      expect(section, `${path} に足し方の節 (## ${EXTEND[lang].heading}) が無い`).not.toBe("");
      for (const word of ["blocks 1", "block +", "base box", "end", 'rel="dragon-blocks"', "readBlocks"]) {
        expect(section, `${path} の足し方の節が \`${word}\` を書いていない`).toContain(word);
      }
      expect(/^\+[a-z][a-z0-9-]* \S+/mu.test(section), `${path} の足し方の節に、\`+\` で始まる行の例が無い`).toBe(true);
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

/** README の冒頭 (最初の `## ` の見出しの前まで) */
const leadOf = (text: string): string => text.split(/^## /mu)[0] ?? "";

/** 冒頭が AI も記法で書くと書いたと読める字と、前の形 (AI は JSON で書く) の字。言葉ごとに持つ (#3455) */
const LEAD = {
  ja: { says: "人も AI も", old: /AI は(同じ図を )?JSON で書/u },
  en: { says: "people and AI write", old: /AI (can )?writes? (the same diagram )?as JSON/u },
} as const;

/** skill の入れ方。Claude Code のプラグインの命令と、ほかの AI に写す skill の dir (#3455) */
const SKILL_INSTALL = ["/plugin marketplace add cardene777/dragon", "/plugin install dragon@dragon", "plugins/dragon/skills/dragon"];

describe("AI が記法で図を書く skill (#3455)", () => {
  it("readme-lead-says-ai-writes-notation", () => {
    // 4 つの README の冒頭の 1 行と導入文は、AI も記法で書くと書き、AI が JSON で書くと書かない
    for (const lang of Object.keys(LANGS) as (keyof typeof LANGS)[]) {
      for (const path of [LANGS[lang].repo, LANGS[lang].npm]) {
        const lead = leadOf(read(path));
        expect(lead, `${path} の冒頭が、AI も記法で書くと書いていない`).toContain(LEAD[lang].says);
        expect(lead, `${path} の冒頭が、AI は JSON で書くと書いている`).not.toMatch(LEAD[lang].old);
      }
    }
    // npm の頁に出る package の説明も同じ
    const description = (JSON.parse(read("packages/dragon/package.json")) as { description: string }).description;
    expect(description, "package の説明が、AI も記法で書くと書いていない").toContain(LEAD.en.says);
    expect(description, "package の説明が、AI は JSON で書くと書いている").not.toMatch(LEAD.en.old);
  });

  it("readme-shows-skill-install", () => {
    // 4 つの README は、Claude Code で skill を入れる命令と、ほかの AI に skill の dir を写す手順を書く
    for (const lang of Object.keys(LANGS) as (keyof typeof LANGS)[]) {
      for (const path of [LANGS[lang].repo, LANGS[lang].npm]) {
        const text = read(path);
        for (const words of SKILL_INSTALL) expect(text, `${path} が \`${words}\` を書いていない`).toContain(words);
      }
    }
  });
});
