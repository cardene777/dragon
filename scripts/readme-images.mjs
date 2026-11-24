/**
 * README の絵を、見本の記法から作り直す (#3881)。`pnpm readme:images` で回す。
 *
 * GitHub と npm の頁は `dragon` の囲みを字のまま出すので、README は描いた図を絵で見せる。
 * 絵は buildした package の命令 (`packages/dragon/dist/cli.js`) で書き出すので、先に `pnpm build:packages` を回す。
 * 見た目を変えた後に回すと、README の絵が今の見た目に揃う。
 *
 * 作る絵は 3 種類で、全て `docs/readme` の下に置く。
 * - 先頭の絵 (`hero.png` と `hero-dark.png`)。書き出した HTML を開き、再生の帯ごと最後の段で撮る
 * - 図の種類の一覧の絵 (`kinds/<種類>.png` と `kinds/<種類>-dark.png`)。最後の段の PNG
 * - 札 (`badges/npm.svg`、`badges/license.svg`、`badges/catalog.svg`)。外の札の service を読まないため repo の中に置く
 *
 * 先頭の絵と一覧の絵は、英語のREADMEに英語の見本 (`<見本>.en.dragon`) から描いた絵を`docs/readme`の下に、
 * 日本語のREADMEに日本語の見本 (`<見本>.dragon`) から描いた絵を`docs/readme/ja`の下に、同じ名前で置く (#3887)。
 * 札は言葉で分けない。
 *
 * `--badges` を付けると札だけを書き直す。版を上げた時は札だけで足りる。
 * `--lang ja` か `--lang en` を付けると、その言葉の絵だけを描き直す。
 * 1 枚ずつ順に書き出すのは、ブラウザを同時に何個も起こして機械の負荷を上げないため。
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs/readme");
const CLI = join(ROOT, "packages/dragon/dist/cli.js");

/** 絵の意匠。README を読んだ人が入れて描いた図と同じ見た目にするため、既定の意匠で描く */
export const PALETTE = "paper";
/** 明るい表示と暗い表示。暗い表示の絵は GitHub を暗い表示で開いた人に出る */
export const THEMES = ["light", "dark"];
/** 書き出す幅 (px) */
const WIDTH = 900;

/** 先頭の絵の見本。特定の分野に寄らず、横長で再生の帯まで 1 画面に収まる構成図 */
export const HERO = { example: "photo-delivery" };

/**
 * 図の種類の一覧の絵。種類と、その種類を描いた英語の見本 (`packages/dragon/examples/<example>.en.dragon`)。
 * 申し込みの図 (checkout) は書き出しが箱を並べるだけなので、絵を作らない
 */
export const README_KINDS = [
  { kind: "sequence", example: "oauth" },
  { kind: "architecture", example: "photo-delivery" },
  { kind: "state", example: "order" },
  { kind: "git", example: "rebase" },
  { kind: "time", example: "release-plan" },
  { kind: "tree", example: "sitemap" },
  { kind: "lineup", example: "kanban" },
  { kind: "try", example: "stock-reserve" },
  { kind: "pipe", example: "swap" },
  { kind: "chart", example: "shop-funnel" },
  { kind: "flow", example: "login-check" },
  { kind: "cycle", example: "pdca" },
  { kind: "mind", example: "trip-plan" },
  { kind: "er", example: "library-loan" },
  { kind: "matrix", example: "task-priority" },
  { kind: "venn", example: "hobbies" },
  { kind: "sankey", example: "salary" },
];

/** 絵を描く言葉。英語の絵は英語のREADMEが、日本語の絵は日本語のREADMEが指す */
export const LANGS = ["en", "ja"];

/** 見本の file の置き場。英語の見本は`.en.dragon`、日本語の見本は`.dragon`で終わる */
const exampleOf = (example, lang) =>
  join(ROOT, `packages/dragon/examples/${example}${lang === "en" ? ".en" : ""}.dragon`);

/** 言葉ごとの絵の置き場 */
const outOf = (lang) => (lang === "en" ? OUT : join(OUT, lang));

/** 暗い表示の絵の file の名前に付ける印 */
const suffixOf = (theme) => (theme === "dark" ? "-dark" : "");

/** 1 つの見本を 1 つの言葉と形で書き出し、書き出した file の置き場を返す。図の中の字と再生の帯の字はその言葉で描く */
const exportOne = (example, lang, theme, format, dir) => {
  execFileSync(
    process.execPath,
    [
      CLI,
      "export",
      exampleOf(example, lang),
      "--out",
      dir,
      "--format",
      format,
      "--width",
      String(WIDTH),
      "--palette",
      PALETTE,
      "--theme",
      theme,
      "--lang",
      lang,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  // 書き出した file の名前は見本の名前から決まるので、空のフォルダに書いた 1 つを探す
  const written = readdirSync(dir).filter((name) => name.endsWith(`.${format}`));
  if (written.length !== 1)
    throw new Error(`${dir} に書き出した .${format} が 1 つでない: ${written.join(", ")}`);
  return join(dir, written[0]);
};

/** 図の種類の一覧の絵の枠 (px)。縦に長い図も横に長い図も同じ枠に収め、一覧の行の高さを揃える */
const FRAME = { width: 960, height: 600 };

/**
 * 図の種類の一覧の絵を書く。書き出した PNG を、地の透けた同じ大きさの枠の真ん中に、縦横の比を保って収める。
 * 枠の地を透かすので、GitHub の明るい表示でも暗い表示でも枠の縁が見えない
 */
const writeKinds = async (work, browser, lang) => {
  const out = outOf(lang);
  mkdirSync(join(out, "kinds"), { recursive: true });
  const tab = await browser.newPage({ viewport: FRAME, deviceScaleFactor: 1 });
  try {
    for (const { kind, example } of README_KINDS) {
      for (const theme of THEMES) {
        const dir = join(work, `${lang}-${kind}-${theme}`);
        const png = exportOne(example, lang, theme, "png", dir);
        const page = join(dir, "frame.html");
        writeFileSync(
          page,
          `<!doctype html><style>html,body{margin:0;background:transparent}div{width:${FRAME.width}px;height:${FRAME.height}px;display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:100%}</style><div><img src="${basename(png)}"></div>`,
        );
        await tab.goto(pathToFileURL(page).href);
        await tab.locator("img").evaluate((img) => img.decode());
        await tab.locator("div").screenshot({
          path: join(out, "kinds", `${kind}${suffixOf(theme)}.png`),
          omitBackground: true,
        });
        console.log(`${lang} kinds/${kind}${suffixOf(theme)}.png`);
      }
    }
  } finally {
    await tab.close();
  }
};

/** 先頭の絵を書く。書き出した HTML を開いて流れを止め、最後の段の再生の部品を帯ごと撮る */
const writeHero = async (work, browser, lang) => {
  for (const theme of THEMES) {
    const html = exportOne(HERO.example, lang, theme, "html", join(work, `${lang}-hero-${theme}`));
    const tab = await browser.newPage({
      viewport: { width: WIDTH + 60, height: 900 },
      deviceScaleFactor: 2,
    });
    await tab.goto(pathToFileURL(html).href);
    await tab.waitForSelector(".dg-player button");
    // 釦は読み上げの名前でなく`data-dragon`で探す。名前は言葉で変わるため (#3887)
    const pause = tab.locator(
      ".dg-player button[data-dragon='toggle']:has(.dg-btn-ic[data-icon='pause'])",
    );
    if (await pause.count()) await pause.first().click();
    const next = tab.locator(".dg-player button[data-dragon='next']").first();
    // 最後の段まで送る。送れなくなった釦は押せないので、押せる間だけ押す
    for (let i = 0; i < 40 && (await next.isEnabled()); i++) await next.click();
    // 塗りを伸ばす動きと線の動きが止まるのを待つ
    await tab.waitForTimeout(1500);
    await tab
      .locator(".dg-player")
      .first()
      .screenshot({ path: join(outOf(lang), `hero${suffixOf(theme)}.png`) });
    await tab.close();
    console.log(`${lang} hero${suffixOf(theme)}.png`);
  }
};

/** 左に名前、右に値を書く札の SVG。字の幅は 1 字 7px で見積もる */
const badge = (label, value, color) => {
  const left = label.length * 7 + 12;
  const right = value.length * 7 + 12;
  const width = left + right;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <rect width="${left}" height="20" rx="3" fill="#555"/>
  <rect x="${left}" width="${right}" height="20" rx="3" fill="${color}"/>
  <rect x="${left}" width="4" height="20" fill="${color}"/>
  <g fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle">
    <text x="${left / 2}" y="14">${label}</text>
    <text x="${left + right / 2}" y="14">${value}</text>
  </g>
</svg>
`;
};

/** 札を書く。版の札は package の今の版を書く */
const writeBadges = () => {
  const { version } = JSON.parse(readFileSync(join(ROOT, "packages/dragon/package.json"), "utf8"));
  mkdirSync(join(OUT, "badges"), { recursive: true });
  writeFileSync(join(OUT, "badges/npm.svg"), badge("npm", `v${version}`, "#cb3837"));
  writeFileSync(join(OUT, "badges/license.svg"), badge("license", "MIT", "#007ec6"));
  writeFileSync(join(OUT, "badges/catalog.svg"), badge("catalog", "open", "#2f7d4f"));
  console.log("badges/npm.svg badges/license.svg badges/catalog.svg");
};

const main = async () => {
  writeBadges();
  if (process.argv.includes("--badges")) return;
  const work = mkdtempSync(join(tmpdir(), "dragon-readme-"));
  // repo の根の依存に在る `playwright` を読む。`playwright-core` は package の依存にしか無い
  const { chromium } = await import("playwright");
  // `--lang <言葉>` が在ればその言葉だけ、無ければ全ての言葉の絵を描く
  const at = process.argv.indexOf("--lang");
  const langs = at < 0 ? LANGS : [process.argv[at + 1]];
  const unknown = langs.filter((lang) => !LANGS.includes(lang));
  if (unknown.length > 0)
    throw new Error(`--lang は ${LANGS.join(" か ")} を取る: ${unknown.join(", ")}`);
  const browser = await chromium.launch();
  try {
    for (const lang of langs) {
      await writeKinds(work, browser, lang);
      await writeHero(work, browser, lang);
    }
  } finally {
    await browser.close();
    rmSync(work, { recursive: true, force: true });
  }
};

// 検査が一覧を読むために import した時は書き出さない
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
