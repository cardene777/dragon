/**
 * 見本帳の分の型 (#3342、#3345、#3350)。
 *
 * ブロックの置き場の `gallery/` は、見本帳 (`apps/playground-spa`) だけが読む分を持つ。
 * 一覧の名前 (`text.ts`)、部品の頁の説明 (`desc.ts`)、編集画面の棚の部品 (`shelf.ts`)、使い方の頁の本文 (`docs.ts`)、
 * `docs/design/base/GRAMMAR.md` の部品の表の行 (`rule.ts`)、部品の頁が見本を探す関数 (`uses.ts`) と、
 * 部品の図 (`<名前>.<図の種類>.dragon` と英語の `.en.dragon`)。
 * 見本帳の一覧と棚と使い方の頁は、この分をブロックの並び (`rank`) の順に並べて作り、ブロックの名前を手で並べない (#3350)。
 *
 * package の入口はこの分を読まず、npm に出す file からも外す (`package.json` の `files`)。
 * 見本帳の分の file は package の処理を読まない。読めるのは `import type` と同じ置き場の file だけ
 * (`blocks.test.ts` の `gallery-imports-no-package-runtime` が見る)。そのため持たない欄は `none()` を呼ばず、
 * `{ none: <理由> }` を直に書き、棚の部品の組み立てと見本を探す関数は、見本帳が渡す道具 (`ShelfKit`、`SampleView`) だけを使う。
 * 一覧は `scripts/build-blocks.mjs` が置き場の dir から書き出す (`apps/playground-spa/src/catalog/blocks.gen.ts`)。
 * 使い方の頁の段落は使い方の頁だけが読む `blocks-docs.gen.ts` に、見本を探す関数は部品の頁が読む `blocks-uses.gen.ts` に書き出す (#3341、#3350)。
 * 部品の説明も部品の頁だけが読む `blocks-desc.gen.ts` に書き出し、見本帳が最初に読む塊に入れない (#3531)。
 */
import type { Carry, Diagram, DiagramEvent, LabelSide, LineupItem, TryPart } from "../schema";
import type { None } from "./block";

export type { None };

/** 見本帳の言葉 */
export type GalleryLang = "ja" | "en";

/** 見本帳の一覧の、部品の名前 */
export interface PartText {
  readonly name: string;
}

/** `gallery/text.ts` が出す `text` */
export type BlockText = Readonly<Record<GalleryLang, PartText>>;

/**
 * `gallery/desc.ts` が出す `desc`。部品の頁に出す説明 (#3531)。
 * 名前 (`text.ts`) と分けるのは、名前を読む最初の画面の塊に、部品の頁だけが見せる説明が入らないため
 */
export type BlockDesc = Readonly<Record<GalleryLang, string>>;

/** 編集画面の棚に置く部品 1 つの名前 */
export type ShelfName = Readonly<Record<GalleryLang, string>>;

/** 線の行の 1 本。棚の線の部品が足す */
export interface ShelfEdge {
  readonly label: string;
  readonly carry: Carry;
  readonly labelSide?: LabelSide;
}

/**
 * 棚の部品を組み立てる道具。見本帳が書く欄の記法の言葉ごとに作って渡す。
 * 箱と線を足す時の仮の名前 (箱の名札の頭と箱の名前) は見本帳が言葉ごとに持ち、部品ごとの仮の名前は部品が持つ
 */
export interface ShelfKit {
  /** 書く欄の記法の言葉。部品が足す仮の名前の言葉 */
  readonly lang: GalleryLang;
  /** 箱と区画の名札と重ならない `prefix` + 番号 */
  freshId(d: Diagram, prefix: string): string;
  /** 箱を 1 つ足す。`region` を渡すとその区画に入れ、渡さない構成図では最後の箱と同じ区画に入れる */
  withBox(d: Diagram, region?: string): { diagram: Diagram; id: string };
  /** 線の両端。箱が 1 つしかない時は相手の箱を足す */
  pair(d: Diagram): { diagram: Diagram; from: string; to: string };
  /** 最後の段の終わりに起きることを 1 つ足す */
  withEvent(d: Diagram, event: DiagramEvent): Diagram;
  /** 最初の 2 つの箱の間に線を 1 本、最後の段の終わりに足す */
  withEdge(d: Diagram, edge: ShelfEdge): Diagram;
}

/** 編集画面の棚に置く部品 1 つ。名前と、書く欄の図に足す時の組み立て */
export type ShelfPart = ShelfName & {
  /** 部品を 1 つ足した図。書く欄はこの図と足す前の図を書いた行の差を足す */
  readonly build: (d: Diagram, kit: ShelfKit) => Diagram;
};

/**
 * `gallery/shelf.ts` が出す `shelf`。ブロックが編集画面の棚に置く部品。
 * 鍵は棚の部品の id で、1 つのブロックが棚に 2 つ以上の部品を置ける。
 * 棚はブロックの並び (`rank`) の順に、ブロックの中は鍵の順に部品を並べる (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`)
 */
export type BlockShelf = Readonly<Record<string, ShelfPart>> | None;

/**
 * 見本の図から引いた値。見本がブロックの語を使ったかを決める関数 (`gallery/uses.ts`) に、見本帳が見本ごとに作って渡す。
 * 段の中で起きることを種類ごとに引く道具を見本帳が 1 か所で持ち、ブロックの関数は引いた値を読むだけにする
 */
export interface SampleView {
  /** 見本の記法から作った原本の JSON */
  readonly diagram: Diagram;
  /** 全ての段で起きること。段の順 */
  readonly events: readonly DiagramEvent[];
  /** 線 */
  readonly edges: readonly Extract<DiagramEvent, { type: "edge" }>[];
  /** 枝分かれの図の commit */
  readonly commits: readonly Extract<DiagramEvent, { type: "commit" }>[];
  /** 時間軸の図の範囲の括弧と枠 */
  readonly spans: readonly Extract<DiagramEvent, { type: "span" }>[];
  /** 列の図のチップ。試す図のチップ (欄の値を持つ) は入れない */
  readonly lineupItems: readonly LineupItem[];
  /** 試す図の部品のうち、種類が `type` の部品 */
  tryParts<T extends TryPart["type"]>(type: T): readonly Extract<TryPart, { type: T }>[];
}

/**
 * `gallery/uses.ts` が出す `uses`。ブロックが受け持つ記法の語ごとの、見本がその語を使ったか。
 * 鍵は語で、`kind:<図の種類>`、`head:<行の頭の語>`、`attr:<行>.<鍵>`、線の行の `edge:->`、枝分かれの図の行の中の語の `git:<語>` の形で書く。
 * 見本帳の部品の頁は、鍵を部品の語として鍵の順に並べ、語を 1 つでも使う見本を並べる。
 * 記法の語の表 (`words.ts`) の語は、どれかのブロックの鍵に必ず在る (`apps/playground-spa/src/lib/catalog-parts.test.ts` が数える)
 */
export type BlockUses = Readonly<Record<string, (view: SampleView) => boolean>>;

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

/** `gallery/rule.ts` が出す `rule`。ブロックが受け持つ表の行を、表に出す順に並べる。表はブロックの並び (`rank`) の順にブロックの行を並べる */
export type BlockRule = readonly RuleRow[] | None;

/** ブロック 1 つの見本帳の分 */
export interface BlockGallery {
  readonly text: BlockText;
  readonly desc: BlockDesc;
  readonly shelf: BlockShelf;
  readonly docs: BlockDocs | None;
  readonly rule: BlockRule;
  readonly uses: BlockUses;
}
