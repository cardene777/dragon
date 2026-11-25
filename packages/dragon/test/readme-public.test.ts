/**
 * 公開できる形の README (#3881)。
 *
 * GitHub は `dragon` の囲みを字のまま出すので、README を開いた人は描いた図を 1 枚も見られなかった。
 * 4 つの README (repo の 2 つと npm の頁の 2 つ) の頭に、再生の帯つきの図の絵、札、mermaid と比べる表を置き、
 * 図の種類の一覧を種類ごとの絵で見せる。種類ごとの記法の細部は記法の手引き (`quick-start.en.md` と `quick-start.md`) へ移す。
 * 絵は `pnpm readme:images` (`scripts/readme-images.mjs`) が見本の記法から作り直す。
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { KIND_FOLDERS } from "../src/kinds/index";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");

/** npm の頁は相対パスの絵を出さないので、npm の README は絵をこの URL で指す */
const RAW = "https://raw.githubusercontent.com/cardene777/dragon/main/";
/** npm の頁の README が repo の file へ繋ぐ時の URL */
const BLOB = "https://github.com/cardene777/dragon/blob/main/";

type Lang = "ja" | "en";
type Readme = { lang: Lang; path: string; npm: boolean };
const READMES: Readme[] = [
  { lang: "en", path: "README.md", npm: false },
  { lang: "ja", path: "README.ja.md", npm: false },
  { lang: "en", path: "packages/dragon/README.md", npm: true },
  { lang: "ja", path: "packages/dragon/README.ja.md", npm: true },
];

/** 言葉ごとの記法の手引き */
const GUIDES: Record<Lang, string> = { en: "packages/dragon/examples/quick-start.en.md", ja: "packages/dragon/examples/quick-start.md" };

/** 図の種類の名前。README の一覧と手引きの節の見出しに同じ名前を使う */
const KIND_LABELS: Record<Lang, Record<string, string>> = {
  ja: { architecture: "構成図", cards: "持ち主ごとのカードの図", chart: "量の図", checkout: "購入操作図", cycle: "回り続ける図", er: "表どうしの関係の図", flow: "手順の図", git: "枝分かれの図", lineup: "列の図", matrix: "2つの軸で置く図", mind: "考えを広げる地図", pipe: "配管の図", sankey: "量の行き先の図", sequence: "時系列図", state: "状態遷移図", time: "時間軸の図", tree: "木の図", try: "試す図", venn: "集合の重なりの図", judge: "判定の表" },
  en: { architecture: "Architecture diagram", cards: "Owner card diagram", chart: "Chart", checkout: "Checkout diagram", cycle: "Cycle diagram", er: "Table relation diagram", flow: "Flow diagram", git: "Git graph", lineup: "Lineup diagram", matrix: "Two-axis matrix", mind: "Mind map", pipe: "Pipe diagram", sankey: "Sankey diagram", sequence: "Sequence diagram", state: "State diagram", time: "Time diagram", tree: "Tree diagram", try: "Try diagram", venn: "Set overlap diagram", judge: "Judge table" },
};

/**
 * 絵を持たず、一覧には名前と手引きへの繋ぎだけを置く種類。購入操作図は書き出しが箱を並べるだけで、
 * 判定の表 (#3879) は HTML の表で描き、静止画の書き出しは別の課題 (#3891) で作る
 */
const WITHOUT_PICTURE = new Set(["checkout", "judge"]);

/** 種類の頭の語で、手引きの種類の節がその種類の書き方を持つと読める字 */
const KIND_WORDS: Record<string, string> = {
  architecture: "architecture", cards: "cards", chart: "chart", checkout: "checkout", cycle: "cycle", er: "er", flow: "flow", git: "git", lineup: "lineup", matrix: "matrix", mind: "mind", pipe: "pipe", sankey: "sankey", sequence: "sequence", state: "state", time: "time", tree: "tree", try: "try", venn: "venn", judge: "judge",
};

/** mermaid と比べる表の節の見出しと、表の 4 つの行の頭 */
const COMPARE: Record<Lang, { heading: string; rows: string[] }> = {
  en: { heading: "Why dragon", rows: ["What you get", "Look", "Export", "Writing with AI"] },
  ja: { heading: "mermaidとの違い", rows: ["出来上がる物", "見た目", "書き出し", "AIで書く時"] },
};

/** 図の種類の一覧の節の見出しと、手引きの種類の節をまとめる見出し */
const KINDS_HEADING: Record<Lang, { readme: string; guide: string }> = {
  en: { readme: "Diagram kinds", guide: "Diagram kinds" },
  ja: { readme: "描ける図", guide: "図の種類" },
};

const kinds = (): string[] => Object.keys(KIND_FOLDERS).sort();

/** README の冒頭 (最初の `## ` の見出しの前まで) */
const leadOf = (text: string): string => text.split(/^## /mu)[0] ?? "";

/** `## <見出し>` の節の本文。次の `## ` の見出しの前まで。無ければ空 */
const sectionOf = (text: string, heading: string): string => text.split(new RegExp(`^## ${heading}$`, "mu"))[1]?.split(/^## /mu)[0] ?? "";

/** GitHub が見出しに付ける繋ぎ先の名前 */
const anchorOf = (heading: string): string =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/gu, "-");

/**
 * code の囲みと行の中の code を除いた本文。囲みは開いた印と同じ字で、同じ数以上並ぶ行で閉じる (```` の中の ``` は閉じない)。
 * 書き方の例として囲みや code に書いた絵や繋ぎ先は、README が指す物でないため数えない
 */
const withoutFences = (text: string): string => {
  const kept: string[] = [];
  let fence = "";
  for (const line of text.split("\n")) {
    const mark = /^\s*(`{3,}|~{3,})/u.exec(line)?.[1] ?? "";
    if (fence === "" && mark !== "") fence = mark;
    else if (fence !== "" && mark.startsWith(fence) && line.trim() === mark) fence = "";
    else if (fence === "") kept.push(line);
  }
  return kept.join("\n");
};
const withoutCode = (text: string): string => withoutFences(text).replace(/(`+).*?\1/gu, "");

/**
 * 地の文の中の、30語を超える文。codeの囲み、表、HTMLの行、見出し、絵の行は数えない。
 * 英語のREADMEと英語の手引きの図の種類の節が同じ数え方を使う (#3881、#3884)
 */
const longSentences = (text: string): string[] =>
  withoutFences(text)
    .split("\n")
    .filter((line) => line.trim() !== "" && !/^\s*(#|\||<|>|!\[)/u.test(line))
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z`(])/u))
    .filter((sentence) => sentence.split(/\s+/u).filter(Boolean).length > 30);

/** 本文が指す絵の置き場 (`<img src>`、`<source srcset>`、`![](...)`) */
const pictureRefs = (text: string): string[] => {
  const body = withoutCode(text);
  return [
    ...[...body.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gu)].map((m) => m[1] ?? ""),
    ...[...body.matchAll(/<source\b[^>]*\bsrcset="([^"]+)"/gu)].map((m) => m[1] ?? ""),
    ...[...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/gu)].map((m) => m[1] ?? ""),
  ];
};

/** 本文が指す繋ぎ先 (`[](...)` と `<a href>`)。絵の `![](...)` は除く */
const linkRefs = (text: string): string[] => {
  const body = withoutCode(text);
  return [...[...body.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)\)/gu)].map((m) => m[1] ?? ""), ...[...body.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gu)].map((m) => m[1] ?? "")];
};

/** README の置き場から見た `docs/readme` の下の file の書き方。npm の README は絶対 URL、repo の README は相対パス */
const docsRef = (readme: Readme, file: string): string => (readme.npm ? `${RAW}docs/readme/${file}` : `docs/readme/${file}`);

/**
 * README の置き場から見た図の絵の書き方。日本語のREADMEは日本語の見本から描いた`docs/readme/ja`の下の絵を指す (#3887)。
 * 札は言葉で分けないので`docsRef`で指す
 */
const pictureRef = (readme: Readme, file: string): string => docsRef(readme, readme.lang === "ja" ? `ja/${file}` : file);

/** README の置き場から見た手引きの書き方 */
const guideRef = (readme: Readme): string => (readme.npm ? `${BLOB}${GUIDES[readme.lang]}` : GUIDES[readme.lang]);

/** `<picture>` の塊のうち、明るい表示の絵と暗い表示の絵を持つ物 */
const hasPicture = (text: string, light: string, dark: string): boolean =>
  [...text.matchAll(/<picture>([\s\S]*?)<\/picture>/gu)].some((m) => {
    const block = m[1] ?? "";
    return block.includes(`media="(prefers-color-scheme: dark)" srcset="${dark}"`) && block.includes(`src="${light}"`);
  });

/** 絵を作り直す script が持つ一覧。まだ無い時は undefined */
type ImagesModule = { README_KINDS: { kind: string; example: string }[]; HERO: { example: string }; PALETTE: string; THEMES: string[]; LANGS?: string[] };
const loadImagesModule = async (): Promise<ImagesModule | undefined> => {
  const path = join(ROOT, "scripts/readme-images.mjs");
  if (!existsSync(path)) return undefined;
  return (await import(pathToFileURL(path).href)) as ImagesModule;
};

describe("公開できる形の README (#3881)", () => {
  it("readme-public-hero-first", () => {
    // 4 つの README は、最初の `##` の節より前に先頭の絵を持ち、暗い表示では暗い意匠の絵を出す
    for (const readme of READMES) {
      const lead = leadOf(read(readme.path));
      // 仕様の変更 (#3887): 日本語のREADMEは日本語の見本から描いた絵を指す
      expect(hasPicture(lead, pictureRef(readme, "hero.png"), pictureRef(readme, "hero-dark.png")),`${readme.path} の冒頭に、暗い表示の絵も持つ先頭の絵 (<picture>) が無い`).toBe(true);
    }
  });

  it("readme-public-badges", () => {
    // 4 つの README は、npm の版、ライセンス、見本帳の 3 つの札を題の下に持つ。札は repo の中に置き、版の札は今の版を書く
    const version = (JSON.parse(read("packages/dragon/package.json")) as { version: string }).version;
    for (const readme of READMES) {
      const lead = leadOf(read(readme.path));
      const pictures = pictureRefs(lead);
      for (const badge of ["npm", "license", "catalog"]) {
        expect(pictures, `${readme.path} の冒頭に ${badge} の札が無い`).toContain(docsRef(readme, `badges/${badge}.svg`));
      }
      expect(pictures.some((src) => src.includes("img.shields.io")), `${readme.path} が外の札 (img.shields.io) を読む`).toBe(false);
    }
    const npm = existsSync(join(ROOT, "docs/readme/badges/npm.svg")) ? read("docs/readme/badges/npm.svg") : "";
    expect(npm, "npm の札が今の版を書いていない").toContain(`v${version}`);
  });

  it("readme-public-compares-with-mermaid", () => {
    // 4 つの README は、mermaid と dragon を比べる表を持ち、表は出来上がる物、見た目、書き出し、AI で書く時の 4 行を持つ
    for (const readme of READMES) {
      const { heading, rows } = COMPARE[readme.lang];
      const section = sectionOf(read(readme.path), heading);
      expect(section, `${readme.path} に ${heading} の節が無い`).not.toBe("");
      expect(/^\|\s*\|\s*mermaid\s*\|\s*dragon\s*\|$/mu.test(section), `${readme.path} の ${heading} の節に mermaid と dragon の表が無い`).toBe(true);
      const heads = [...section.matchAll(/^\| ([^|]+?) \|/gmu)].map((m) => m[1] ?? "");
      for (const row of rows) expect(heads, `${readme.path} の比べる表に ${row} の行が無い`).toContain(row);
    }
  });

  it("readme-public-kinds-gallery", () => {
    // 4 つの README の図の種類の一覧は 19 種類を全て挙げ、申し込みの図と判定の表を除く 17 種類は明るい表示と暗い表示の絵を持ち、手引きのその種類の節へ繋ぐ
    for (const readme of READMES) {
      const section = sectionOf(read(readme.path), KINDS_HEADING[readme.lang].readme);
      expect(section, `${readme.path} に図の種類の一覧の節が無い`).not.toBe("");
      const links = linkRefs(section);
      for (const kind of kinds()) {
        const name = KIND_LABELS[readme.lang][kind] ?? kind;
        expect(section, `${readme.path} の図の種類の一覧に ${name} が無い`).toContain(name);
        expect(links, `${readme.path} の ${name} が手引きの ${name} の節へ繋がない`).toContain(`${guideRef(readme)}#${anchorOf(name)}`);
        if (WITHOUT_PICTURE.has(kind)) continue;
        // 仕様の変更 (#3887): 日本語のREADMEは日本語の見本から描いた絵を指す
        expect(hasPicture(section, pictureRef(readme, `kinds/${kind}.png`), pictureRef(readme, `kinds/${kind}-dark.png`)),`${readme.path} の ${name} に明るい表示と暗い表示の絵が無い`).toBe(true);
      }
    }
  });

  it("readme-public-pictures-exist", () => {
    // 4 つの README が指す絵の file は、全て `docs/readme` の下に在る
    for (const readme of READMES) {
      const local = pictureRefs(read(readme.path)).map((src) => src.replace(RAW, ""));
      expect(local.length, `${readme.path} が絵を 1 枚も指さない`).toBeGreaterThan(0);
      for (const src of local) {
        expect(src.startsWith("docs/readme/"), `${readme.path} の絵 ${src} が docs/readme の下に無い`).toBe(true);
        expect(existsSync(join(ROOT, src)), `${readme.path} が指す絵 ${src} が無い`).toBe(true);
      }
    }
  });

  it("readme-public-npm-absolute-pictures", () => {
    // npm の README 2 つは、絵を repo の絶対 URL で指す
    for (const readme of READMES.filter((r) => r.npm)) {
      const pictures = pictureRefs(read(readme.path));
      expect(pictures.length, `${readme.path} が絵を 1 枚も指さない`).toBeGreaterThan(0);
      for (const src of pictures) expect(src.startsWith(`${RAW}docs/readme/`), `${readme.path} の絵 ${src} が repo の絶対 URL でない`).toBe(true);
    }
  });

  it("readme-public-npm-refuses-relative-paths", () => {
    // npm の頁に出る README (`packages/dragon/README.md`) は、相対パスで指す絵と、相対パスで指す繋ぎ先を持たない。
    // npm の頁は相対パスを repo の file へ繋がないため。日本語版は GitHub で開くので、隣の英語版への相対の繋ぎを残す
    const text = read("packages/dragon/README.md");
    const relative = [...pictureRefs(text), ...linkRefs(text)].filter((ref) => !/^(https?:|#|mailto:)/u.test(ref));
    expect(relative, "packages/dragon/README.md が相対パスで絵か繋ぎ先を指す").toEqual([]);
  });

  it("readme-images-list-matches-gallery", async () => {
    // `pnpm readme:images` の命令が在り、絵にする種類と見本は README の一覧と同じで、絵は既定の意匠 paper の明るい表示と暗い表示で書く
    const scripts = (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts;
    expect(scripts["readme:images"], "package.json に readme:images の命令が無い").toBe("node scripts/readme-images.mjs");
    const images = await loadImagesModule();
    expect(images, "scripts/readme-images.mjs が無い").toBeDefined();
    if (!images) return;
    const pictured = kinds().filter((kind) => !WITHOUT_PICTURE.has(kind));
    expect(images.README_KINDS.map((entry) => entry.kind).sort(), "絵を作る種類が README の一覧と合わない").toEqual(pictured);
    // 仕様の変更 (#3887): 英語と日本語の2つの言葉で絵を描く。日本語の絵は日本語の見本 (`<見本>.dragon`) から描く
    expect(images.LANGS, "絵が英語と日本語の2つの言葉で描かれない").toEqual(["en", "ja"]);
    for (const { kind, example } of [...images.README_KINDS, { kind: "hero", example: images.HERO.example }]) {
      expect(existsSync(join(ROOT, `packages/dragon/examples/${example}.en.dragon`)), `${kind} の絵の見本 ${example}.en.dragon が無い`).toBe(true);
      expect(existsSync(join(ROOT, `packages/dragon/examples/${example}.dragon`)), `${kind} の絵の日本語の見本 ${example}.dragon が無い`).toBe(true);
    }
    expect(images.PALETTE, "絵が既定の意匠で描かれない").toBe("paper");
    expect(images.THEMES, "絵が明るい表示と暗い表示の 2 つで描かれない").toEqual(["light", "dark"]);
  });

  it("guide-has-a-section-per-kind", () => {
    // 記法の手引き 2 つは図の種類ごとの節を 19 持ち、各節はその種類の頭の語の書き方を持つ
    for (const lang of ["en", "ja"] as const) {
      const guide = read(GUIDES[lang]);
      const section = sectionOf(guide, KINDS_HEADING[lang].guide);
      expect(section, `${GUIDES[lang]} に図の種類の節 (## ${KINDS_HEADING[lang].guide}) が無い`).not.toBe("");
      for (const kind of kinds()) {
        const name = KIND_LABELS[lang][kind] ?? kind;
        const body = section.split(new RegExp(`^### ${name}$`, "mu"))[1]?.split(/^### /mu)[0] ?? "";
        expect(body, `${GUIDES[lang]} に ${name} の節が無い`).not.toBe("");
        expect(body.includes(`\`${KIND_WORDS[kind]} `), `${GUIDES[lang]} の ${name} の節に \`${KIND_WORDS[kind]} …\` の書き方が無い`).toBe(true);
      }
    }
  });

  it("readme-public-holds-no-kind-notation", () => {
    // 4 つの README は、図の種類ごとの記法の小節を持たない
    for (const readme of READMES) {
      const names = new Set(Object.values(KIND_LABELS[readme.lang]));
      const subsections = [...read(readme.path).matchAll(/^### (.+)$/gmu)].map((m) => (m[1] ?? "").trim());
      const kindSections = subsections.filter((title) => names.has(title) || /(look|looks) of an? .+ (diagram|graph)$/iu.test(title) || /の(見た目|形)$/u.test(title));
      expect(kindSections, `${readme.path} が図の種類ごとの記法の小節を持つ`).toEqual([]);
    }
  });

  it("readme-english-short-lines", () => {
    // 英語版の 2 つの README は、30 語を超える文を持たない。code の囲み、表、HTML の行、見出しは数えない
    // 仕様の変更 (#3884): 数え方を longSentences に出し、英語の手引きの検査と共有する。READMEへの判定は変わらない
    for (const readme of READMES.filter((r) => r.lang === "en")) {
      expect(longSentences(read(readme.path)), `${readme.path} に 30 語を超える文が在る`).toEqual([]);
    }
  });

  it("guide-english-short-lines", () => {
    // 英語の手引きは、英語のREADMEと同じ数え方で30語を超える文を持たない (#3884)
    // 仕様の変更 (#3889): 図の種類の節だけでなく、手引きの全ての節を見る
    expect(longSentences(read(GUIDES.en)), `${GUIDES.en} に30語を超える文が在る`).toEqual([]);
  });
});
