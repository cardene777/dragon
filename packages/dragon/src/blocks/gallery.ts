/**
 * 見本帳の分の型 (#3342、#3345)。
 *
 * ブロックの置き場の `gallery/` は、見本帳 (`apps/playground-spa`) だけが読む分を持つ。
 * 一覧の名前と説明 (`text.ts`)、編集画面の棚の書き始め (`shelf.ts`)、使い方の頁の本文 (`docs.ts`)、
 * `docs/design/base/GRAMMAR.md` の部品の表の行 (`rule.ts`) と、部品の図 (`<名前>.<図の種類>.dragon` と英語の `.en.dragon`)。
 *
 * package の入口はこの分を読まず、npm に出す file からも外す (`package.json` の `files`)。
 * 見本帳の分の file は package の処理を読まない。読めるのは `import type` と同じ置き場の file だけ
 * (`blocks.test.ts` の `gallery-imports-no-package-runtime` が見る)。そのため持たない欄は `none()` を呼ばず、
 * `{ none: <理由> }` を直に書く。
 * 一覧は `scripts/build-blocks.mjs` が置き場の dir から書き出す。一覧の名前と説明と棚の名前は見本帳を開いた時に読む `apps/playground-spa/src/catalog/blocks.gen.ts`、
 * 使い方の頁の段落と表の行は使い方の頁だけが読む `apps/playground-spa/src/catalog/blocks-docs.gen.ts` に書き出す (#3347)。
 */
import type { None } from "./block";

export type { None };

/** 見本帳の言葉 */
export type GalleryLang = "ja" | "en";

/** 見本帳の一覧の、部品の名前と説明 */
export interface PartText {
  readonly name: string;
  readonly desc: string;
}

/** `gallery/text.ts` が出す `text` */
export type BlockText = Readonly<Record<GalleryLang, PartText>>;

/** 編集画面の棚に置く部品 1 つの名前 */
export type ShelfName = Readonly<Record<GalleryLang, string>>;

/**
 * `gallery/shelf.ts` が出す `shelf`。ブロックが編集画面の棚に置く部品の名前。
 * 鍵は棚の部品の id (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) で、1 つのブロックが棚に 2 つ以上の部品を置ける
 */
export type BlockShelf = Readonly<Record<string, ShelfName>> | None;

/**
 * `gallery/docs.ts` が出す `docs`。使い方の頁の `section` の節に置く段落。
 * 段落の字は頁の本文と同じ書き方で、`` ` `` で囲んだ語は `<code>` で出る
 */
export type BlockDocs = { readonly section: string } & Readonly<Record<GalleryLang, readonly string[]>>;

/** `GRAMMAR.md` の部品と使い方の表の 1 行。表の 3 つの欄 (部品、決まり、部品の名前) の字をそのまま持つ */
export interface RuleRow {
  readonly part: string;
  readonly rule: string;
  readonly name: string;
}

/** `gallery/rule.ts` が出す `rule`。ブロックが受け持つ表の行を、表の順に並べる */
export type BlockRule = readonly RuleRow[] | None;

/** ブロック 1 つの見本帳の分 */
export interface BlockGallery {
  readonly text: BlockText;
  readonly shelf: BlockShelf;
  readonly docs: BlockDocs | None;
  readonly rule: BlockRule;
}
