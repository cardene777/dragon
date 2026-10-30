# 足す時に触る登録先

図の種類か部品を足す時に触る file の一覧。
行は過去に足した取り込みで実際に変えた file から作り、表から漏れると `packages/dragon/test/extend-skill.test.ts` が落ちる。
図の種類の表は木の図 (#3233)、木の図の書き方 (#3235)、列の図 (#3239) の取り込みを、部品の表は箱の飛び先と段の出典 (#3199) の取り込みを元にする。

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
| `packages/dragon/src/render/svg.ts` | 種類ごとの描き分けの入口 | 新しい種類の分かれ道を足す |
| `packages/dragon/src/render/parts.ts` | 種類をまたいで使う描き方の部品 | 使い回す時だけ触る |
| `packages/dragon/src/render/icons.ts` | 図の中の印 | 印を持つ種類だけ触る |
| `packages/dragon/src/look/values.ts` | 色と寸法の値の表 | 描き方が使う値はここにだけ置く |
| `packages/dragon/src/index.ts` | package の公開の入口 | 外から使う型と関数を出す |
| `packages/dragon/test/<名前>.test.ts` | 足した種類の検査と、既存の検査の一覧 | 新しい語をほかの種類では名札として読む検査を置く。書き方の文書を名指す検査は `notation.test.ts` と `notation-language.test.ts` と `release-records.test.ts` が持つ |
| `packages/dragon/examples/` | 見本の記法と書き出した絵、手引き | 日本語と英語の見本をそろえる。見本の file の最初の注釈の行に作業の番号を書かない |
| `packages/dragon/README.md` | package の README の記法の節 | 行の頭の語と、その種類の小節の例を足す |
| `README.md` | repo の README の描ける図の欄と行の頭の表 | 記法と同じ PR で直す |
| `CHANGELOG.md` | Unreleased の Added | 足した種類と語を書く |
| `.ikkan/premises/product.md` | 描ける図の種類の数と一覧 | 前提の文が古い数のまま残らないようにする |
| `.ikkan/specs/<機能>.md` | 課題の受入条件を写す先 | 書き方の文書の条件は `.ikkan/specs/site.md` に写す |
| `apps/playground-spa/src/catalog/parts.ts` | 見本帳の部品の一覧 | 図の種類を2つ以上持つ部品がどの図でも使える部品になる (`isCommon`)。新しい種類を既存の部品に足すと分類が変わる |
| `apps/playground-spa/src/catalog/parts/` | 部品ごとの図の記法 (`<名札>.<種類>.dragon` と `.en.dragon`) | 記法の語ごとに、描ける全ての種類と2つの言葉の file を置く |
| `apps/playground-spa/src/editor/shelf-items.ts` | 編集画面の棚 | 新しい種類の書き始めの形を足す |
| `apps/playground-spa/src/examples.ts` | 見本の並び (`EXAMPLE_KEYS`) | 新しい見本の名前を並びに足す。最初に読む見本 (`FIRST_SCREEN_EXAMPLES`) のほかは、ここで記法を読まない |
| `apps/playground-spa/src/examples-later.ts` | 後から読む見本の記法 | 見本の file を読む行を足す。最初に読む script に入れると `first-load-carries-no-catalog-notation` が落ちる |
| `apps/playground-spa/src/text.ts` | 見本帳と編集画面の言葉 | 日本語と英語の両方に種類の名前と説明を足す |
| `apps/playground-spa/src/docs/content.ts` | 使い方の頁の本文 | 記法と同じ PR で書き方の節を足す |
| `apps/playground-spa/src/docs/examples/` | 使い方の頁の例 | 日本語と英語の例をそろえる |
| `apps/playground-spa/src/lib/<種類>-catalog.test.ts` | 見本帳での描け方の検査 | 既存の種類の検査が図の分類を全部並べて照らしていると、新しい種類で落ちる。先頭から既存の種類の順で始まるかを見る形にする |
| `apps/playground-spa/src/lib/site.test.ts` | 書き方の文書と読む部品の照らし合わせ | 新しい語を `ADDED_AFTER_MIGRATION` に足す |
| `apps/playground-spa/src/lib/catalog-parts.test.ts` | 部品の頁の検査 | 部品の分類は `isCommon` と同じ規則で数える |
| `apps/playground-spa/src/lib/playground.test.ts` | 頁の大きさの上限 (`page-bundle-within-budget`) | 上限290KBは頁が最初に読む script と CSS に当てる。見本と部品の図の記法は後から読む塊に入るので増えないが、描く部品と検査の関数は種類ごとに約6.5KB増える (#3248)。超える時は上限を上げず本人に聞く |

## 部品を足す時

| 登録先 | 足す物 | 落とし穴 |
|---|---|---|
| `packages/dragon/src/words.ts` | 部品の語 | 今の語で言えない時だけ足す。ほかの種類では名札として読む |
| `packages/dragon/src/schema.ts` | 原本の型 | 型と原本の形を同じ取り込みで直す |
| `packages/dragon/src/schemas/diagram.schema.json` | 原本の形 | 直したら `node packages/dragon/scripts/build-validator.mjs` で検査の関数を書き出し直す |
| `packages/dragon/src/schemas/validate-diagram.js` | 書き出した検査の関数 | 手で直さない。`packages/dragon/scripts/build-validator.mjs` が書く |
| `packages/dragon/src/parser.ts` | 記法を原本にする読む部品 | 部品を持てる種類の分かれ道に足す |
| `packages/dragon/src/printer.ts` | 原本を記法に戻す書き戻す部品 | 読んで書き戻すと同じ記法に戻る形を検査で確かめる |
| `packages/dragon/src/messages.ts` | 記法の誤りの文 | 日本語と英語の両方に足す |
| `packages/dragon/src/field-messages.ts` | 原本の欄の誤りの文 | 日本語と英語の両方に足す |
| `packages/dragon/src/player.ts` | 再生の部品 | 押すと動く部品 (飛び先など) だけ触る |
| `packages/dragon/src/render/parts.ts` | 種類をまたいで使う描き方の部品 | 2つ以上の種類で描く部品はここに置く |
| `packages/dragon/src/render/svg.ts` | 描き分けの入口 | 部品を描く分かれ道を足す |
| `packages/dragon/src/render/<種類>.ts` | その種類だけの描き方 | 色と字の大きさを直に書かない。`renderers-read-values-from-one-table` が落ちる |
| `packages/dragon/src/index.ts` | package の公開の入口 | 外から使う型を出す |
| `packages/dragon/test/<名前>.test.ts` | 部品の検査 | 読んで書き戻す検査と、名札として読む検査を置く |
| `packages/dragon/examples/` | 手引き | 日本語と英語の手引きの両方に部品の書き方を足す |
| `packages/dragon/README.md` | package の README の記法の節 | 部品の語と例を足す |
| `README.md` | repo の README の行の頭の表 | 記法と同じ PR で直す |
| `CHANGELOG.md` | Unreleased の Added | 足した部品と語を書く |
| `.ikkan/specs/<機能>.md` | 課題の受入条件を写す先 | 描き方の条件は `.ikkan/specs/diagram-core.md`、見本帳の条件は `.ikkan/specs/playground.md` に写す |
| `apps/playground-spa/src/catalog/parts.ts` | 見本帳の部品の一覧 | 描ける種類が2つ以上なら、どの図でも使える部品として並ぶ (`isCommon`) |
| `apps/playground-spa/src/catalog/parts/` | 部品の図の記法 (`<名札>.<種類>.dragon` と `.en.dragon`) | 部品を描ける全ての種類と2つの言葉の file を置く |
| `apps/playground-spa/src/editor/shelf-items.ts` | 編集画面の棚 | 部品の書き始めの形を足す |
| `apps/playground-spa/src/text.ts` | 見本帳と編集画面の言葉 | 日本語と英語の両方に部品の名前と説明を足す |
| `apps/playground-spa/src/docs/content.ts` | 使い方の頁の本文 | 記法と同じ PR で部品の書き方を足す |
| `apps/playground-spa/src/lib/<種類>-catalog.test.ts` | 部品を描く種類ごとの見本帳の検査 | 部品の数を数える検査は、足した数に直す |
| `apps/playground-spa/src/lib/site.test.ts` | 書き方の文書と読む部品の照らし合わせ | 新しい語を `ADDED_AFTER_MIGRATION` に足す |
| `apps/playground-spa/src/lib/catalog-parts.test.ts` | 部品の頁の検査 | 部品の分類は `isCommon` と同じ規則で数える |
| `apps/playground-spa/src/lib/playground.test.ts` | 頁の大きさの上限 (`page-bundle-within-budget`) | 部品の図の記法は後から読む塊に入るので、最初に読む量は描く部品の分だけ増える。上限は290KBで、超える時は本人に聞く |
