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
 * 一覧は `scripts/build-blocks.mjs` が置き場の dir から書き出す (`apps/playground-spa/src/catalog/blocks.gen.ts`)。
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

/** `gallery/shelf.ts` が出す `shelf`。編集画面の棚に置く部品の名前 */
export type BlockShelf = Readonly<Record<GalleryLang, string>> | None;

/**
 * `gallery/docs.ts` が出す `docs`。使い方の頁の `section` の節に置く段落。
 * 段落の字は頁の本文と同じ書き方で、`` ` `` で囲んだ語は `<code>` で出る
 */
export type BlockDocs = { readonly section: string } & Readonly<Record<GalleryLang, readonly string[]>>;

/** `gallery/rule.ts` が出す `rule`。`GRAMMAR.md` の部品と使い方の表の 1 行 */
export type BlockRule = { readonly part: string; readonly rule: string; readonly name: string } | None;

/** ブロック 1 つの見本帳の分 */
export interface BlockGallery {
  readonly text: BlockText;
  readonly shelf: BlockShelf;
  readonly docs: BlockDocs | None;
  readonly rule: BlockRule;
}
