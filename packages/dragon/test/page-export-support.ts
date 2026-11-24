/**
 * mdから頁を書き出す検査が使う道具と見本のmd (#3755)。
 *
 * 見本のmdは一時のdirに書き、Nodeの入口 (`@cardenelabs/dragon/node`) の`exportPage`で書き出す。
 * 入口が`exportPage`を出さない時は、判定の文で落とす。
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import * as node from "@cardenelabs/dragon/node";
import { expect } from "vitest";

/** 頁の組み立て。mdの頭の`layout`の行に書く値 */
export type Layout = "entry" | "sidebar" | "tabs";
export const LAYOUTS: readonly Layout[] = ["entry", "sidebar", "tabs"];

/** 書き出せなかった訳。mdか載せたfileの名前と行と文 */
export interface PageError {
  file: string;
  line: number;
  message: string;
}
/** 書き出した結果。書けた時は書いたfileのpath、書けなかった時は訳の並び */
export type PageExport = { ok: true; path: string } | { ok: false; errors: PageError[] };
/** Nodeの入口の`exportPage` */
export type ExportPage = (
  file: string,
  options?: { outDir?: string; lang?: "ja" | "en" },
) => Promise<PageExport>;

/**
 * Nodeの入口の`exportPage`。入口が出さない時は判定の文で落とし、`undefined`を返す。
 * 入口は file を読む時に 1 度だけ読み、混んだ機械で読む時間を件の時間に入れない
 */
export async function exportPageTool(): Promise<ExportPage | undefined> {
  const entry = node as { exportPage?: unknown };
  expect(entry.exportPage, "Nodeの入口が頁を書き出すexportPageを出さない").toBeTypeOf("function");
  return Promise.resolve(
    typeof entry.exportPage === "function" ? (entry.exportPage as ExportPage) : undefined,
  );
}

/** 書き出した結果が書けた形か。書けなかった時は訳を添えて判定の文で落とす */
export function expectWritten(result: PageExport | undefined): string {
  expect(result?.ok, `頁を書き出せない: ${JSON.stringify(result)}`).toBe(true);
  return result?.ok ? result.path : "";
}

/** 一時のdirを作る */
export const tempDir = (name: string): string =>
  mkdtempSync(join(tmpdir(), `dragon-page-${name}-`));

/** dir `root`に、path と中身の表のfileを書く */
export function writeFiles(root: string, files: Readonly<Record<string, string | Buffer>>): void {
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body);
  }
}

/** 1 画素の PNG */
export const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** 載せる設計書のmd */
export const DESIGN_MD =
  "# 注文の設計\n\n| 欄 | 中身 |\n|---|---|\n| id | 注文の番号 |\n\n- 受ける\n- 確かめる\n";
/** 載せるコードのfile。`<` を持つ */
export const PAY_TS = "export const pay = (n: number): number => n * 2; // <total>\n";
/** 載せる図のfile */
export const PAY_DRAGON =
  "sequence 支払いの流れ\n\nbox shop as 店\nbox bank as 銀行\n\nstep 払う\n  shop -> bank: 支払い\n";

/** 見本のmd。`layout`を渡すと頭の`---`の間に書く */
export function noteMarkdown(layout?: Layout): string {
  const head = layout === undefined ? "" : `---\nlayout: ${layout}\n---\n\n`;
  return `${head}# 注文の流れ

店が注文を受けてから届けるまでを、段ごとに見る。

#### 全体の図

\`\`\`dragon
architecture 注文の流れ [view: fixed]
box order as 注文を受ける [link: #order]
box pay as 支払う [link: #pay]
box ship as 届ける [link: #配送]
step 受ける
  order -> pay: 注文
step 払う
  pay -> ship: 支払い済み
\`\`\`

#### 表で見る

| 段 | 項目 |
|---|---|
| 受付 | order |
| 支払いと配送 | pay、配送 |

## 受付

注文を受ける段。

### order

注文を受ける。

#### 結果

受けた注文を確かめた。

> [!NOTE] 頼んだこと
> 注文を受ける仕組みを作る。

| 項目 | 結果 |
|---|---|
| 受けた注文 | 3件 |

#### 仕組みの図

\`\`\`dragon
sequence 注文を受ける
box user as 利用者
box shop as 店
step 頼む
  user -> shop: 注文
\`\`\`

#### 出力の全文

##### design.md

![設計](parts/design.md)

##### pay.ts

![支払い](parts/pay.ts)

## 支払いと配送

払って届ける段。

### pay

代金を払う。

#### 結果

支払いを確かめた。

![絵](parts/pic.png)

#### 仕組みの図

![支払いの図](parts/pay.dragon)

### 配送

品物を届ける。

#### 結果

届けた。
`;
}

/** 見本のmdと載せるfileを一時のdirに書き、mdのpathを返す */
export function writeNote(layout?: Layout): string {
  const root = tempDir(layout ?? "default");
  writeFiles(root, {
    "notes.md": noteMarkdown(layout),
    "parts/design.md": DESIGN_MD,
    "parts/pay.ts": PAY_TS,
    "parts/pay.dragon": PAY_DRAGON,
    "parts/pic.png": PIXEL,
  });
  return join(root, "notes.md");
}
