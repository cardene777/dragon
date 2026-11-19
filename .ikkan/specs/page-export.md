# page-export

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `layout`を書かないmdを書き出すと、入口に全体の図と、`##`の段ごとに`###`の項目の札が並ぶ | `pnpm exec vitest run`の検査`page-entry-shows-overview-and-cards`が通る | #3755 |
| 入口の札を押すとその項目の頁へ移り、項目の頁の戻る釦で入口へ戻れる | `pnpm exec vitest run`の検査`page-card-opens-item-and-back`が通る | #3755 |
| 入口の全体の図で`[link: #<場所の名前>]`を持つ箱を押すと、その場所の名前の項目の頁へ移る | `pnpm exec vitest run`の検査`page-overview-box-opens-item`が通る | #3755 |
| `layout: sidebar`のmdは左の目次から、`layout: tabs`のmdは上の段のタブと段の中の項目のタブから、同じmdの同じ項目の頁を開ける | `pnpm exec vitest run`の検査`page-sidebar-layout-opens-item`と`page-tabs-layout-opens-item`が通る | #3755 |
| 項目の頁の中の`####`の見出しがタブになり、押したタブの中身だけを出す。`#####`の見出しはタブの中のタブになる | `pnpm exec vitest run`の検査`page-item-headings-become-tabs`が通る | #3755 |
| 開いている項目とタブが頁のURLの`#`の後ろに残り、読み直すと同じ項目とタブを開く | `pnpm exec vitest run`の検査`page-tab-survives-reload`が通る | #3755 |
| 書き出したHTMLの図は、帯 (コード、エディタ、コピー、エクスポート、拡大) つきで描かれる | `pnpm exec vitest run`の検査`page-diagrams-have-bar`が通る | #3755 |
| 幅390pxで開いた書き出したHTMLは、3つの組み立てのどれでも入口と項目の頁が横にはみ出さない | `pnpm exec vitest run`の検査`page-fits-390px`が通る | #3755 |
| `![名前](path)`だけの行は、`.md`のfileをmdとして、`.dragon`のfileを図として、ほかの文字のfileを名前を付けたcodeの囲みとして載せ、画像のfileは画像のまま出す | `pnpm exec vitest run`の検査`page-includes-files-by-kind`が通る | #3755 |
| mdの在るフォルダの外のfileを載せる行を持つmdの書き出しを、行を名指して拒む | `pnpm exec vitest run`の検査`page-rejects-include-outside-folder`が通る | #3755 |
| 無い項目を指す箱の飛び先を持つmdの書き出しを、行と飛び先を名指して拒む | `pnpm exec vitest run`の検査`page-rejects-link-to-missing-item`が通る | #3755 |
| 記法に誤りがある囲みか、知らない`layout`の値か、最初の`##`より前の`###`を持つmdの書き出しを、行を名指して拒む | `pnpm exec vitest run`の検査`page-rejects-broken-markdown`が通る | #3755 |
| mdに書いたHTMLの字は頁に字のまま出し、scriptとして動かさない | `pnpm exec vitest run`の検査`page-escapes-raw-html`が通る | #3755 |
| 頁に足す字は、mdの本文に仮名か漢字があれば日本語、無ければ英語になり、`--lang`で上書きできる | `pnpm exec vitest run`の検査`page-language-follows-text`が通る | #3755 |
| `dragon export notes.md`はmdの隣に`notes.html`を1つ書き、`--out`で書く先のフォルダを変えられる | `pnpm exec vitest run`の検査`page-export-command-writes-html`が通る | #3755 |
| `.md`の書き出しに図の書き出しの設定 (`--fps`など) を渡すと、何も書かずに拒む | `pnpm exec vitest run`の検査`page-export-refuses-diagram-options`が通る | #3755 |
| Nodeの入口`@cardenelabs/dragon/node`の`exportPage`が、命令と同じHTMLを書く | `pnpm exec vitest run`の検査`node-entry-exports-page`が通る | #3755 |
| 見本`packages/dragon/examples/page/`の英語と日本語のmdを、誤り無く書き出せる | `pnpm exec vitest run`の検査`page-examples-export`が通る | #3755 |
| packageのREADMEは英語と日本語で、mdから頁を書き出す書き方と見本の置き場を載せる | `pnpm exec vitest run`の検査`readme-documents-page-export`が通る | #3755 |
| 箱の飛び先に`#`で始まる頁の中の場所を、記法と原本のJSONのどちらでも書ける | `pnpm exec vitest run`の検査`box-link-accepts-page-anchor`が通る | #3755 |
| 箱の飛び先と段の出典は、今どおり`javascript:`などの頁を移る形でない値を拒む | `pnpm exec vitest run`の検査`notation-link-rejects-unsafe-url`が通る | #3755 |
| 読み込んだ時に隠れている`pre.dragon`の囲みは、隠れている間は描かず、見えて幅を持った時に枠の幅で描く | `pnpm exec vitest run`の検査`hidden-block-draws-when-shown`が通る | #3755 |
| 描いた後に隠して見せ直した図は、帯の段の番号と図の動きの段が揃う | `pnpm exec vitest run`の検査`reshown-figure-keeps-motion-in-step`が通る | #3755 |
| `visibility:hidden`の祖先の中の図は、段の番号の印が動く間も見えない | `pnpm exec vitest run`の検査`hidden-ancestor-hides-step-badges`が通る | #3755 |
| 見えている図の段の番号の印は、今どおり段が来た時に出て、まだ来ていない段では隠れる | `pnpm exec vitest run`の検査`shown-figure-badges-follow-steps`が通る | #3755 |
| Markdownの囲みのdragonの図を、`dragon check`と頁の`pre`の塊として今どおり読む | `pnpm exec vitest run`の検査`check-reads-markdown-fences-at-file-lines`と`script-entry-draws-markdown-code-fence`が通る | #3755 |
| `.json`の図の書き出しは今どおりmp4、GIF、HTML、PNGを書く | `pnpm exec vitest run`の検査`four-formats-written-once-from-json`が通る | #3755 |
| scriptの1行の入口が最初に読む量は、今と同じく上限の中に収まる | `pnpm exec vitest run`の検査`script-entry-within-budget`が通る | #3755 |
| 見本帳が最初に読む量は、今と同じく上限の中に収まる | `pnpm exec vitest run`の検査`page-bundle-within-budget`が通る | #3755 |
