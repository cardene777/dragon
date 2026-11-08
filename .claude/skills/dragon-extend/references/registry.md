# 足す時に触る登録先

図の種類かブロックを足す時に触る file の一覧。
表から漏れると `packages/dragon/test/extend-skill.test.ts` が落ちる。
図の種類の表は、木の図 (#3233)、木の図の書き方 (#3235)、列の図 (#3239) の取り込みで実際に変えた file から作る。
ブロックの表は、ブロックの置き場の外で個別ブロックを 2 つ以上並べて持つ file (個別ブロックを足すと並びに足す所) が全て行に当たり、行は 6 つまでにする (#3350)。

最初の欄の path のうち、`<種類>` のように山括弧で書いた所は、足す種類や部品ごとに名前が変わる。
末尾が `/` の行は、その dir の下の file を全て含む。

## 図の種類を足す時

| 登録先 | 足す物 | 落とし穴 |
|---|---|---|
| `packages/dragon/src/words.ts` | 図の種類の頭の語と、その種類だけが読む行の頭の語 | 新しい語はほかの種類では名札として読む。読めなくなると既存の原本が壊れる |
| `packages/dragon/src/schema.ts` | 原本の型 | 型と原本の形を同じ取り込みで直す |
| `packages/dragon/src/schemas/diagram.schema.json` | 原本の形 | 直したら `node packages/dragon/scripts/build-validator.mjs` で検査の関数を書き出し直す。食い違うと `schema.test.ts` が落ちる |
| `packages/dragon/src/schemas/validate-diagram.js` | 書き出した検査の関数 | 手で直さない。`packages/dragon/scripts/build-validator.mjs` が書く |
| `packages/dragon/src/parser.ts` | 記法を原本にする読む部品 | 頭の語ごとの分かれ道に足す |
| `packages/dragon/src/printer.ts` | 原本を記法に戻す書き戻す部品 | 読んで書き戻すと同じ記法に戻る形を検査で確かめる |
| `packages/dragon/src/messages.ts` | 記法の誤りの文 | 日本語と英語の両方に足す |
| `packages/dragon/src/field-messages.ts` | 原本の欄の誤りの文 | 日本語と英語の両方に足す |
| `packages/dragon/src/timeline.ts` | 段ごとの時刻の表 | 動きを持つ種類は、段の長さをここで決める |
| `packages/dragon/src/layout/<種類>.ts` | 置き方 | 字の幅は英語の見本でも確かめる |
| `packages/dragon/src/render/<種類>.ts` | 描き方 | 色と字の大きさを直に書かない。`renderers-read-values-from-one-table` が落ちる |
| `packages/dragon/src/render/draw.ts` | 種類ごとの描き分けの本体 | 新しい種類の分かれ道を足す。種類の部品は `kindParts` で登録簿から引き、直に読まない |
| `packages/dragon/src/kinds/<種類>.ts` | その種類の描く部品をまとめて出す | 種類ごとに 1 つ置く |
| `packages/dragon/src/kinds/<種類>/` | 図の種類の置き場。並べ方 (`layout.ts`) と受け付ける付け方 (`kind.ts`) | この 2 つの file だけを置き、並べ方は描き方を読まない。置き場を足したら `node packages/dragon/scripts/build-blocks.mjs` で一覧 (`packages/dragon/src/kinds/index.ts`) を書き出し直す。食い違うと `blocks.test.ts` が落ちる |
| `packages/dragon/src/kinds/registry.ts` と `packages/dragon/src/kinds/all.ts` と `packages/dragon/src/light.ts` | 種類の登録簿と全部入りの登録と後から読む入口 | 3 つとも新しい種類を足す。足さないと軽い入口で読めない |
| `packages/dragon/src/render/parts.ts` | 種類をまたいで使う描き方の部品 | 使い回す時だけ触る |
| `packages/dragon/src/blocks/icon/icons.ts` | 図の中の印の形 | 印を持つ種類だけ触る |
| `packages/dragon/src/look/values.ts` | 色と寸法の値の表 | 描き方が使う値はここにだけ置く |
| `packages/dragon/src/api.ts` | 既定の入口と軽い入口が共に出す部品 | 外から使う型と関数を出す |
| `packages/dragon/src/index.ts` | 既定の入口 | 触らない。`api.ts` が出す物を全部出し、全ての種類を登録する |
| `packages/dragon/test/<名前>.test.ts` | 足した種類の検査と、既存の検査の一覧 | 新しい語をほかの種類では名札として読む検査を置く。書き方の文書を名指す検査は `notation.test.ts` と `notation-language.test.ts` と `release-records.test.ts` が持つ |
| `packages/dragon/examples/` | 見本の記法と書き出した絵、手引き | 日本語と英語の見本をそろえる。見本の file の最初の注釈の行に作業の番号を書かない |
| `packages/dragon/README.md` | package の README の記法の節 | 行の頭の語と、その種類の小節の例を足す |
| `README.md` | repo の README の描ける図の欄と行の頭の表 | 記法と同じ PR で直す |
| `CHANGELOG.md` | Unreleased の Added | 足した種類と語を英語で書き、`CHANGELOG.ja.md` の同じ節にも日本語で書く |
| `.ikkan/premises/product.md` | 描ける図の種類の数と一覧 | 前提の文が古い数のまま残らないようにする |
| `.ikkan/specs/<機能>.md` | 課題の受入条件を写す先 | 書き方の文書の条件は `.ikkan/specs/site.md` に写す |
| `apps/playground-spa/src/catalog/parts.ts` | 見本帳の部品の一覧 | 図の種類を2つ以上持つ部品がどの図でも使える部品になる (`isCommon`)。新しい種類を既存の部品に足すと分類が変わる |
| `packages/dragon/src/blocks/<名前>/gallery/` | 部品ごとの図の記法 (`<名札>.<種類>.dragon` と `.en.dragon`) | 新しい種類で描ける部品の置き場ごとに、新しい種類の2つの言葉の file を置く |
| `apps/playground-spa/src/editor/shelf-items.ts` | 編集画面の棚 | 新しい種類の書き始めの形を足す |
| `apps/playground-spa/src/examples.ts` | 見本の並び (`EXAMPLE_KEYS`) | 新しい見本の名前を並びに足す。最初に読む見本 (`FIRST_SCREEN_EXAMPLES`) のほかは、ここで記法を読まない |
| `apps/playground-spa/src/examples-later.ts` | 後から読む見本の記法 | 見本の file を読む行を足す。最初に読む script に入れると `first-load-carries-no-catalog-notation` が落ちる |
| `apps/playground-spa/src/text.ts` | 見本帳と編集画面の言葉 | 日本語と英語の両方に種類の名前と説明を足す |
| `apps/playground-spa/src/docs/content.ts` | 使い方の頁の本文 | 記法と同じ PR で書き方の節を足す |
| `apps/playground-spa/src/docs/examples/` | 使い方の頁の例 | 日本語と英語の例をそろえる |
| `apps/playground-spa/src/lib/<種類>-catalog.test.ts` | 見本帳での描け方の検査 | 既存の種類の検査が図の分類を全部並べて照らしていると、新しい種類で落ちる。先頭から既存の種類の順で始まるかを見る形にする |
| `apps/playground-spa/src/lib/site-pages.test.ts` | 書き方の文書と読む部品の照らし合わせ | 新しい語を `ADDED_AFTER_MIGRATION` に足す |
| `apps/playground-spa/src/lib/catalog-parts.test.ts` | 部品の頁の検査 | 部品の分類は `isCommon` と同じ規則で数える |
| `apps/playground-spa/src/lib/playground.test.ts` | 頁の大きさの上限 (`page-bundle-within-budget`) | 上限は頁が最初に読む script と CSS に当て (#3280)、値は検査が持つ。見本と部品の図の記法と、後から読む種類の描く部品と個別ブロックの読み方は後から読む塊に入るので増えないが、記法を読む処理と検査の関数は種類ごとに増える (#3248、#3349)。超える時は上限を上げず本人に聞く |

## ブロックを足す時

ブロックは置き場の dir に 1 つずつ置き、見本帳の一覧と棚と使い方の頁と `docs/design/base/GRAMMAR.md` の表は、置き場から書き出した一覧をブロックの並び (`block.ts` の `rank`) の順に並べて作る。
置き場の外で触るのは下の 6 行だけで、どの行も足すブロックが要る時だけ触る。
書き方の文書 (使い方の頁の段落のほかの README、手引き、`CHANGELOG.md`、`.ikkan/specs/`) は SKILL.md の「登録先を触る」の決まりで直す。

| 登録先 | 足す物 | 落とし穴 |
|---|---|---|
| `packages/dragon/src/blocks/<名前>/` | ブロックの置き場。名前と並びと付け方と語と使う行の宣言 (`block.ts`)、原本の形の欠片 (`shape.ts`)、読む処理と書き戻す処理と日英の誤りの文 (`read.ts`)、描き方 (`draw.ts`)、見本帳の分 (`gallery/` の名前の `text.ts`、部品の頁の説明の `desc.ts`、棚の部品の `shelf.ts`、使い方の頁の段落の `docs.ts`、`GRAMMAR.md` の表の行の `rule.ts`、見本を探す関数の `uses.ts`、部品の図の `<名前>.<種類>.dragon` と `.en.dragon`) | 持たない欄は `none(<理由>)` を、`gallery/` では `{ none: <理由> }` を置く。`gallery/` の file は `import type` と同じ置き場の file だけを読み、棚の部品の組み立ては見本帳が渡す道具 (`ShelfKit`) だけを使う。置き場を足したら `pnpm build:packages` (最初に `node packages/dragon/scripts/build-blocks.mjs` を回す) で一覧と `GRAMMAR.md` の表を書き出し直す。食い違うと `blocks.test.ts` と `block-gallery.test.ts` が落ちる。行の頭の語で読まない行を読むブロックは `block.ts` の `lines` に行の形を、図の種類の決まりを持つブロックは `always` を書く。書かないと軽い入口の `loadFor` がそのブロックの読み方を読まず、`light-load-for-reads-every-later-example` が落ちる |
| `packages/dragon/src/schema.ts` | 原本の型 | 段の中で起きること (`DiagramEvent`) か原本の欄 (`DiagramBlocks`) を足すブロックだけ触る。型はブロックの `block.ts` に置き、ここでは並びに足して出す |
| `packages/dragon/src/render/<種類>.ts` | 描き方の本体から、ブロックの描き方を呼ぶ所 | 時系列図と構成図と状態遷移図は `render/draw.ts`、ほかの種類は種類の名前の file が呼ぶ。色と字の大きさを直に書かない。`renderers-read-values-from-one-table` が落ちる |
| `packages/dragon/src/words.ts` | 記法の語のうち、ブロックの外へ出す語 | 行の頭の語と属性はブロックの `words` から並びの順に混ぜるので触らない。名札に使えない名前や行の中の語のように、入口から出す語だけを足す。ほかの種類では名札として読む |
| `packages/dragon/test/<名前>.test.ts` | ブロックの検査 | 読んで書き戻す検査と、ほかの種類では名札として読む検査を置く |
| `apps/playground-spa/src/lib/site-pages.test.ts` | 書き方の文書と読む部品の照らし合わせ | 新しい語を `ADDED_AFTER_MIGRATION` に足す |
