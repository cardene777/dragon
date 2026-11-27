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
| 頭の行に`layout: guide`を書いたmdを書き出した時、`##`が話題になり、`###`がその話題の中に節として縦に積まれ、話題は1つの頁に続けて積まれる (#3961で話題のタブを外した。#4024で節の題の番号を外した) | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-sections-stack-in-topics` passes | #3876 |
| 節の題の直後の引用は題の下の答えとして出て、題の直後でない引用は今の引用のまま出る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-answer-from-quote-after-title` passes | #3876 |
| `<details>`と`<summary>`は確かめる問いとして出て、答えは押すまで隠れ、もう一度押すと隠れる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-quiz-hides-answer-until-pressed` passes | #3876 |
| 用語のfileへのリンク (`[用語](glossary.md#用語)`) は下線になり、押すとすぐ下に用語の名前と説明と例の帯を持つ札が開く | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-term-link-opens-card` passes | #3876 |
| `![用語](glossary.md)`の行で読み込んだ用語のfileは、頁の終わりの「用語」の話題として用語ごとに並ぶ (#3961でタブから話題にした) | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-glossary-file-becomes-topic` passes | #3876 |
| 印刷の形では、用語の札と箱の札と確かめる問いの答えが全て開いて描かれる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-print-opens-cards-and-answers` passes | #3876 |
| 幅728pxの枠と幅390pxの枠で、`layout: guide`の頁の字が10.5px以上で描かれ、横にはみ出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-readable-and-fits` passes | #3876 |
| 用語のfileに同じ用語を2度書いた時と、用語のfileに無い用語へのリンクを書いた時、その行を名指して書き出しを断る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-term-twice-or-missing-refused` passes | #3876 |
| `entry`、`sidebar`、`tabs`の組み立ての見本のmdは、今と同じく書き出せる | `pnpm exec vitest run packages/dragon/test/page-export.test.ts` check `page-examples-export` passes | #3876 |
| `<details>`と`<summary>`の外の生のHTMLは、今と同じく字として出す | `pnpm exec vitest run packages/dragon/test/page-export.test.ts` check `page-escapes-raw-html` passes | #3876 |
| `![名前](path)`だけの行は、今と同じくfileの種類ごとに載る | `pnpm exec vitest run packages/dragon/test/page-export.test.ts` check `page-includes-files-by-kind` passes | #3876 |
| 説明の頁を印刷すると、全ての話題の節が書いた順に紙に出る (#3961でタブを外した) | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts`の検査`guide-print-shows-every-topic`が通る | #3956 |
| 説明の頁を印刷すると、各話題は新しい紙から始まり、その紙の上に話題の名前の見出しが出る (#3961でタブを外した) | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts`の検査`guide-print-starts-each-topic-on-new-paper`が通る | #3956 |
| 説明の頁を印刷すると、箱の札 (`note: pop`) は図に重ならず、図の下に箱の名前と並んで開く | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts`の検査`guide-print-notes-below-figure`が通る | #3956 |
| 説明の頁を印刷すると、段のある図の全ての段の止め絵が紙に出て、各段の`say`の文が読める | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts`の検査`guide-print-shows-every-step`が通る | #3956 |
| 図を置く頁を印刷すると、再生の部品は箱の札を図の下に並べ、箱の上の位置 (`--nx`、`--ny`) には置かない | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts`の検査`note-pop-print-lists-cards-below-figure`が通る | #3956 |
| 図を置く頁を印刷すると、再生の帯 (段を送る釦、段の文、進み) が紙に出ない | `pnpm exec vitest run packages/dragon/test/player-print.test.ts`の検査`player-print-hides-bar`が通る | #3956 |
| 図の上の道具の帯 (コード、エディタ、コピー、エクスポート、拡大の釦) は、印刷すると紙に出ない | `pnpm exec vitest run packages/dragon/test/player-print.test.ts`の検査`frame-print-hides-tool-bar`が通る | #3956 |
| 図を置く頁で段のある図を印刷すると、全ての段の止め絵が段の順に並び、各絵の下に段の番号と`say`の文が出る | `pnpm exec vitest run packages/dragon/test/player-print.test.ts`の検査`player-print-stacks-every-step`が通る | #3956 |
| 画面では、段のある図は1つの段だけを映し、再生の帯を出す | `pnpm exec vitest run packages/dragon/test/player-print.test.ts`の検査`player-screen-shows-one-step-and-bar`が通る | #3956 |
| 画面では、説明の頁は全ての話題を1つの頁に続けて積む (#3961でタブを外した) | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts`の検査`guide-sections-stack-in-topics`が通る | #3956 |
| 画面では、箱の札は押した箱の下に開く | `pnpm exec vitest run packages/dragon/test/note-pop.test.ts`の検査`note-pop-opens-card-under-box`が通る | #3956 |
| 説明の頁を印刷すると、用語の札と確かめる問いの答えが開く | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts`の検査`guide-print-opens-cards-and-answers`が通る | #3956 |
| 場面の図を印刷すると、場面ごとに全ての段の止め絵が段の順に並び、各絵の下に段の番号と`say`の文が出る | `pnpm exec vitest run packages/dragon/test/scenes.test.ts`の検査`scenes-print-stacks-every-step`が通る | #3956 |
| 場面の図を印刷すると、今と同じく全ての場面が場面の見出しと共に書いた順に出て、場面を選ぶ釦は紙に出ない | `pnpm exec vitest run packages/dragon/test/scenes.test.ts`の検査`scenes-print-shows-every-scene`が通る | #3956 |
| `layout: guide`の頁は、左の目次に話題ごとにその問いを並べ (話題が2つ以上の頁は開いている話題の並びだけを見せる、#4024)、「このタブで答える問い」の箱を出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-side-menu-lists-every-question` passes | #3961 |
| 問いの見出しの末尾に`[menu: 短い名前]`を書くと、目次はその短い名前を出し、本文の見出しは問いの文のまま出る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-menu-uses-short-name` passes | #3961 |
| `[menu: ]`のように名前が空の時、書き出しは行の番号を付けて断る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-menu-empty-name-refused` passes | #3961 |
| 頁の説明の文 (最初の`##`より前) に置いた図は、頁の頭の全体像として出て、その下に話題が書いた順に矢印でつながって並ぶ | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-overview-from-lead-figure` passes | #3961 |
| 話題はタブで分かれず、話題の見出しを挟んで上から順に続き、節の題は番号を持たない (#4024で番号を外した) | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-topics-flow-one-after-another` passes | #3961 |
| 頁を下へ読み進めると、目次で今読んでいる問いに色が付き、目次の問いを押すとその節へ移る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-menu-marks-current-question` passes | #3961 |
| 幅390pxでは、目次が本文の横に並ばず、本文が横にはみ出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-menu-folds-on-phone` passes | #3961 |
| 節の題の直後の引用は題の下の答えとして出る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-answer-from-quote-after-title` passes | #3961 |
| 確かめる問いの答えは押すまで隠れ、もう一度押すと隠れる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-quiz-hides-answer-until-pressed` passes | #3961 |
| 用語のfileへのリンクを押すと、すぐ下に用語の札が開く | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-term-link-opens-card` passes | #3961 #3969 |
| 同じ用語が2度在るか、用語のfileに無い用語へのリンクが在ると、書き出しは断る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-term-twice-or-missing-refused` passes | #3961 |
| 頁の説明の文で全体像の図より後に書いた段落は、全体像の図より後、読む順の矢印より前に出る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-overview-keeps-text-after-figure` passes | #3969 |
| 全体像の図より後の段落の用語のリンクは、押すとすぐ下に用語の札が開く | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-overview-text-opens-term-card` passes | #3969 |
| 頁の説明の文に置いた図は頁の頭の全体像として出て、その下に話題が書いた順に矢印でつながる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-overview-from-lead-figure` passes | #3969 |
| 話題が1つだけの説明の頁は、全ての節を1枚に積み、前と次のlinkを持たない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-single-topic-stacks` passes | #3983 #3991 #3998 |
| 印刷の形では、話題が2つ以上でも全ての話題を書いた順に出す | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-print-shows-every-topic` passes | #3983 #3991 |
| 印刷の形では、2つ目からの話題を新しい紙から始める | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-print-starts-each-topic-on-new-paper` passes | #3983 |
| 幅1200pxと728pxと390pxで、頁の字が読める大きさで横にはみ出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-readable-and-fits` passes | #3983 #3991 #3998 |
| 話題のタブの頭に、その話題の問いの短い名前と答え1文を順に並べた一覧 (#4024で番号を外した) が在り、行を押すとその問いの節へ移る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-tabs-topic-map-lists-answers` passes | #3991 |
| 全体像の図で`link: #<話題のid>`を持つ箱を押すと、その話題のタブに切り替わる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-tabs-overview-box-opens-topic` passes | #3991 |
| 話題のタブの頭に、全体像の図のうちその話題への`link:`を持つ箱だけに色を残した止め絵が在り、`link:`を持つ箱が無い話題には止め絵が無い | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-tabs-topic-map-focus-figure` passes | #3991 |
| 用語の札の中のlinkを押すと、用語の話題のタブに切り替わり、その用語の説明が画面に入る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-tabs-term-link-opens-glossary-tab` passes | #3991 |
| 左の目次の問いは番号を持たず、目次の名前だけを出す | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-question-pages-menu-without-numbers` passes | #3998 |
| 目次の問いを押すと、その問いの節だけが見え、地図と他の問いの節は見えず、URLの`#`の後ろがその問いのidになる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-question-pages-menu-opens-one-question` passes | #3998 |
| 話題の地図の一覧の行を押すと、その問いの節だけが見える | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-question-pages-map-row-opens-question` passes | #3998 |
| 目次は開いた問いの下に、その問いの図の題を書いた順に並べる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-question-pages-menu-lists-open-figures` passes | #3998 |
| 目次は閉じた問いの下に図の題を出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-question-pages-menu-hides-closed-figures` passes | #3998 |
| 目次の図の題を押すと、その図が画面の上に来る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-question-pages-figure-row-scrolls` passes | #3998 |
| 話題の地図と問いの頁の終わりに、全体像、話題の地図、問いを書いた順に並べた前と次の頁へのlinkが在る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-question-pages-pager-follows-order` passes | #3998 |
| 印刷の形では、全ての話題と問いを書いた順に出す | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts` check `guide-print-shows-every-topic` passes | #3998 |
| 開いた問いの下に、その頁の`####`の見出しを書いた順に並べ、見出しを押すとその見出しが画面の上へ来る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-docs-menu-lists-page-headings` passes | #4010 |
| `####`の見出しを持たない問いの頁は、開いた問いの下に図の題を並べ、見出しを持つ頁は図の題を並べない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-docs-menu-falls-back-to-figures` passes | #4010 |
| 頁の終わりの前と次のlinkは、全体像、話題ごとの地図と問いを書いた順に並べる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-question-pages-pager-follows-order` passes | #4010 |
| 話題が1つの頁は頁に分けず、節を縦に積む | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-single-topic-stacks` passes | #4010 |
| 話題を2つ以上持つ説明の頁は、頁の上のヘッダーに題と全体像と章のタブを並べ、開いているページの章のタブに印 (`aria-current`) が付く | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-head-tabs-mark-open-chapter` passes | #4024 |
| ヘッダーの章のタブを押すと、その章の地図の頁が開き、URLの`#`の後ろがその章のidになる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-head-tab-opens-chapter` passes | #4024 |
| 左の目次は開いている章のページと開いているページの見出しだけを並べ、他の章のページと開閉の矢印 (`pg-menu-fold`) を出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-menu-lists-open-chapter-only` passes | #4024 |
| 開いているページの行は太字と灰色の地で示し、地と線に青を使わない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-menu-marks-open-page-gray` passes | #4024 |
| ページの題、章の地図の行、前と次のlinkに1-1のような番号を出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-shows-no-numbers` passes | #4024 |
| 章の題は本文と同じ色の字と灰色の線で出す | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-topic-title-ink` passes | #4024 |
| 幅1440pxで、目次のページの行と本文の段落は16px、目次の見出しの行は15pxで描かれる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-menu-and-text-sizes` passes | #4024 |
| 全体像の頁は左の目次を出さず、本文の列を頁の中央に置き、ヘッダーと同じ題を本文の頭に重ねて出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-overview-centers-without-menu` passes | #4024 |
| 章のタブが題の横に入らない幅では、タブを題の下の段に移し、最初のタブの字の左端を題の字の左端に揃える | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-head-tabs-wrap-below-title` passes | #4024 |
| 幅390pxでは、左の目次を本文の上の目次の釦にまとめ、釦で開いた目次からページを選ぶと目次が閉じてそのページが開く | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-phone-menu-closes-on-pick` passes | #4024 |
| 幅390pxでは、章のタブの段を横に送れ、開いている章のタブが段の中に見える | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-phone-tabs-show-open-chapter` passes | #4024 |
| 説明の頁の図の再生の帯は、01/03のような段の数を出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-figure-hides-step-count` passes | #4024 |
| 印刷の形では、ヘッダーの章のタブを紙に出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-print-hides-head-tabs` passes | #4024 |
| 開いたページの下に、そのページの`####`の見出しを書いた順に並べ、見出しを押すとその見出しが画面の上へ来る | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-docs-menu-lists-page-headings` passes | #4024 |
| 目次のページを押すと、そのページの節だけが見え、URLの`#`の後ろがそのページのidになる | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-question-pages-menu-opens-one-question` passes | #4024 |
| 幅390pxでは、目次が本文の横に並ばず、本文が横にはみ出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-menu-folds-on-phone` passes | #4024 |
| 幅1200pxと728pxと390pxで、頁の字が読める大きさで横にはみ出さない | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-readable-and-fits` passes | #4024 |
| 話題が1つの説明の頁は、今と同じく頁に分けず節を縦に積む | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-single-topic-stacks` passes | #4024 |
| 印刷の形では、今と同じく全ての話題と問いを書いた順に出す | `pnpm exec vitest run packages/dragon/test/page-guide.test.ts --reporter=verbose` check `guide-print-shows-every-topic` passes | #4024 |
| `entry`、`sidebar`、`tabs`の組み立ての見本のmdは、今と同じく書き出せる | `pnpm exec vitest run packages/dragon/test/page-export.test.ts --reporter=verbose` check `page-examples-export` passes | #4024 |
