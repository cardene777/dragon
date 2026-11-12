# lineup-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `kind` が `lineup` の原本の JSON を JSON Schema で検査した時、チップの宣言 (`lineup.items`、名札と色と字) と、段の中の `line`、`seal`、`open`、`pick`、`stamp` の出来事を持つ図は通る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`schema-accepts-lineup-diagram`が通る | #3239 |
| `line`、`seal`、`open`、`pick`、`stamp` の出来事を列の図でない図に書いた時、列の図に`git`、`state`、`sequence`、`time`の欄か線の出来事を書いた時、5字以上の字のチップを書いた時、検査が落ちて誤った欄の場所を JSON Pointer で示す。英語を渡した時の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`schema-rejects-misplaced-lineup-events`が通る | #3239 |
| schema が使う決まりのどれにも、日本語と英語の誤りの文がある | `pnpm test`の検査`every-schema-keyword-has-messages`が通る | #3239 |
| `packages/dragon/examples/auction.dragon` を `parseNotation` が読んだ時、同じ名前の JSON と同じ JSON を返す。英語版の `.en.dragon` と `.en.json` も同じ | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`notation-compiles-lineup-examples-to-json`が通る | #3239 |
| 列の図の記法に、宣言していないチップか列を書いた `line`、同じチップを2度書いた `line`、1列の上限の12枚を超える `line`、最初の `step` より前の `line`、封をした列への `line`、封をしていない列への `open`、封をした列への2度目の `seal`、線の行、`group` の行、`act` の行のどれかがある時と、`item` の行が1つも無い時は、行と列を示した誤りで止まる。英語の文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`notation-rejects-misused-lineup-lines`が通る | #3239 |
| 時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図の記法で `item`、`line`、`seal`、`open`、`pick`、`stamp` の行を書いた時、その行は列の図でしか書けないと示す誤りで止まる | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`notation-limits-lineup-lines-to-lineup`が通る | #3239 |
| 列の図でない図の記法では、`item` か `line` を名札にした箱どうしの線 (`line -> db`) を今どおり読む | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`notation-keeps-lineup-words-plain-outside-lineup`が通る | #3239 |
| 入札の図を記法、JSON、記法、JSON の順に往復した時、最初と最後の JSON が一致する | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-roundtrip-keeps-json-identical`が通る | #3239 |
| OAuth と CCIP の往復で、最初と最後の JSON が一致する | `pnpm test`の検査`roundtrip-keeps-json-identical`が通る | #3239 |
| `line` の段で、前の段に同じチップが居た時はその位置から今の位置へ滑り、どの列にも居なかったチップは弾んで現れ、列から外れたチップは消える。元の列を書き換えていない時は元の列のチップも残る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-chips-slide-from-where-they-were`が通る | #3239 |
| `seal` の段で封が列を左から覆い、封がある間は列のチップが見えない。`open` の段で封が消え、チップが同じ並びで見える | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-seal-hides-chips`が通る | #3239 |
| `pick` の段から後、選んだ列の縁に色が付き、ほかの列が薄くなる | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-pick-fades-other-lanes`が通る | #3239 |
| `stamp` の段で札が列の右に現れ、最後の段まで残る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-stamp-appears-at-its-step`が通る | #3239 |
| 入札の図を原本の JSON から描いた時、7段が順に動き、段1でメモリプールの列にチップが並び、段2でビルダーの3列が並び、段3で3列に封が付き、段4で選んだ列が残り、段5で札が出て、段6で封が開き、段7でバリデーターの列にチップが並ぶ | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`auction-renders-7-steps`が通る | #3239 |
| 入札の図を0.25秒ごとに止めて数えた時、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-keeps-motion-rules`が通る | #3239 |
| 今の6種類の描き方は今どおりで、OAuth は12段、CCIP は13段、rebase は11段、ブロックの確定は10段、注文は10段、Merkle は8段が順に動き、箱どうしと線の名前と箱が10px以上離れる | `pnpm test`の検査`oauth-renders-12-steps`と`ccip-renders-13-steps`と`rebase-renders-11-steps`と`finality-renders-10-steps`と`order-renders-10-steps`と`merkle-renders-8-steps`と`layout-keeps-10px-gap`が通る | #3239 |
| 列の図の描画も、色、字、余白、動きの値を共通の値の表からだけ読み、描画の file に色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #3239 |
| `dragon export` は図の種類に関わらず同じ処理で mp4、GIF、HTML、PNG の 4 つを書き出し、同じ JSON を 2 回書き出した PNG がバイト単位で一致する。入札の図は書き出した HTML で全ての段を送れる | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`export-writes-four-formats`と`export-is-deterministic`と`html-export-draws-every-kind`が通る | #3239 |
| `packages/dragon/examples` に入札の図の日本語と英語の記法と JSON の4つの file があり、英語版の列とチップと段と段ごとの出来事の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-example-files-match`が通る | #3239 |
| repo の全ての `.dragon` の file を `parseNotation` が誤り無く読む | `pnpm test`の検査`every-dragon-file-parses`が通る | #3239 |
| 見本帳と編集画面に載せた全ての見本で、どの段でも字が重ならない | `pnpm test`の検査`overlaps-none-in-every-example`が通る | #3239 |
| 記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3239 |
| 列の図の`box`の行に`[order: none]`を書いた時、記法とJSON Schemaがその箱を順番の無い置き場として通す。`order`に`none`以外の値を書いた時と、列の図でない図の`box`に書いた時は、行と列かJSON Pointerを示した誤りで止まり、英語の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-order-none-marks-a-pool`が通る | #3351 |
| 列の図の最上位に`role 名前`を書いた時、記法とJSON Schemaがその名前を役として通し、`[note: 一言]`を添えられる。段の中に`role 名前`を書いた時は、その段で動く役として通す。宣言していない役を段に書いた時と、列の図でない図に`role`を書いた時は、行と列かJSON Pointerを示した誤りで止まり、英語の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-role-declares-and-acts`が通る | #3351 |
| 列の図を描く枠の幅を渡さない時と、箱を横に並べても枠に収めた箱の名前が10.5px以上になる幅を渡した時、役の札を宣言した順に左から1列に並べて箱の列の上に置き、箱を宣言した順に左から札として並べる。`[order: none]`の箱は点線の枠の置き場としてチップを格子に並べ、それ以外の箱は実線の枠の札としてチップを`line`に書いた順に上から縦に積む。どの段でも役の札と箱と字が10px以上離れる | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-layout-places-roles-and-cards`が通る | #3351、#3408 |
| 箱を横に並べると枠に収めた箱の名前が10.5px未満になる枠の幅 (390と324) を渡して入札の図を描いた時、縦に組む。置き場を図の幅の帯にし、続けて宣言した札を左から1列に並べ、帯と札の列を宣言した順に上から積む。役の札は図の幅に収まるよう並べる。全体を出す見せ方 (`fixed`) になり、枠に収めた字が10.5px以上ある。英語の入札の図も同じ | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-narrow-frame-stacks-places`が通る | #3351 |
| 再生の部品に入札の図を置いた時、枠の幅が390なら縦に組んだ図を、760なら横に並べた図を出し、置いた後に枠の幅が変わって並べ方が替わる時は組み直す | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-player-arranges-by-frame-width`が通る | #3351 |
| 札は枠の頭に名前と「上から実行」を出し、`note`を持つ札は`note`の字を札の下の端にチップの字の1.6倍以上の大きさで出す。置き場は枠の頭に名前と「順番なし」を出す。英語を渡した時はこれらの字が仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-cards-show-name-and-note`が通る | #3351 |
| 縦の札に12枚のチップを積んだ時は12枚が1列のまま上から並び、置き場に12枚を置いた時は置き場が折り返して高さを伸ばし、どのチップも枠からはみ出さない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-holds-12-chips-in-places`が通る | #3351 |
| チップは枠を持ち、`label`を持つチップは`label`を、持たないチップは名前を枠の中に出し、字は枠の中に収まる。色付きのチップは縁をその色で描いて光らせ、札の中の色の無いチップは薄く出し、置き場の色の無いチップは薄くしない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-chips-show-names-in-frames`が通る | #3351 |
| `seal`の段から後は、封が札のチップの並ぶ所を斜線と錠と「封」の字で隠し、`note`の字は隠さずに見せる | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-seal-hides-items-not-note`が通る | #3351 |
| `pick`の段から後は、選んだ札の縁に札の色が付いて光り、札の頭に「選ばれる」(英語では`Picked`) の印が出る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-pick-marks-the-card`が通る | #3351 |
| 段の中に`role 名前`を書いた段では、その役の札の縁が光り、書いていない役の札は光らない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-role-lights-in-its-step`が通る | #3351 |
| 段を持つ列の図を描いた時、図の上の端に今の段の題をチップの字の1.6倍以上の大きさで出し、その下に`say`の文を出す | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-headline-shows-step-title`が通る | #3351 |
| 札に`line`を書いた段で、札の下に一言を出す。前の段にどこかの箱に居た色付きのチップは位置を書き (入札の図のビルダーAでは自分が3番目)、前の段にどの箱にも居なかったチップは名前を書き (ビルダーBでは裏1と裏2)、同じ段のほかの札に居てこの札に居ない色付きのチップは無いことを書く (ビルダーCでは自分)。一言は色の縦棒と字で描き、チップのような枠を持たない。置き場には一言を出さない。英語を渡した時の一言は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-block-remarks-derive-from-lines`が通る | #3351 |
| 列の図の`item`の行に`[note: 説明]`を書いた時、記法とJSON Schemaがその説明をチップの宣言に通す。列の図の下の端に凡例を出し、説明を持つチップの説明ごとに1行で、そのチップの色の枠の見本と説明を左から並べる。色の無いチップの見本は色の無い枠で出す。説明を持つチップが無い図は凡例を出さない。英語の記法の説明は書いたまま出す | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-legend-lists-item-notes`が通る | #3351 |
| 置き場と札が隣り合う所に、横に並べた時は左から右へ、縦に組んだ時は上から下へ向く矢印を出す。札どうしの間と、置き場どうしの間には矢印を出さない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-arrows-join-pools-and-cards`が通る | #3351 |
| 段を持つ列の図を描いた時、図の下に今の段より後の段の題を枠付きの札にして矢印で結んだ「この先」の帯を出し、最後の段では帯を出さない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-shows-steps-ahead`が通る | #3351 |
| 日本語と英語の入札の図で、メモリプールの箱が`[order: none]`を持ち、メモリプールに置くチップの名前が数字を含まない | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`auction-pool-chips-carry-no-numbers`が通る | #3351 |
| 日本語と英語の入札の図で、リレーと提案者を役として宣言し、封をする段と公開する段でリレーが、金額だけを見せる段と署名する段で提案者が動く。メモリプールに置く取引のチップと、自分と裏と票のチップが凡例の説明を持つ | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`auction-declares-roles-and-legend`が通る | #3351 |
| 今ある全ての色味で入札の図を描いた時、役の札と箱とチップの位置と大きさが色味によらず同じで、変わるのは色の値だけ | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-layout-same-in-every-palette`が通る | #3351 |
| 入札の図の7段が順に動き、段3で3つのビルダーの札に封が付き、段4で選んだ札が残り、段5で札が出て、段6で封が開いて段2と同じ並びが見える | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`auction-renders-7-steps`が通る | #3351 |
| 封は今どおり左から伸びて札のチップを隠し、`line`の段で前の段に居たチップはその位置から今の位置へ滑る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-seal-hides-chips`と`lineup-chips-slide-from-where-they-were`が通る | #3351 |
| `pick`の段から後はほかの札が薄くなり、`stamp`の段で札が現れて最後の段まで残る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-pick-fades-other-lanes`と`lineup-stamp-appears-at-its-step`が通る | #3351 |
| 入札の図を記法、JSON、記法、JSONの順に往復した時、最初と最後のJSONが一致する | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-roundtrip-keeps-json-identical`が通る | #3351 |
| repoの全ての`.dragon`のfileを誤り無く読み、見本帳の全ての見本でどの段でも字が重ならず、描画のfileが値を共通の値の表からだけ読み、記法の全ての語をどれかの部品が受け持つ | `pnpm test`の検査`every-dragon-file-parses`と`overlaps-none-in-every-example`と`renderers-read-values-from-one-table`と`catalog-parts-cover-every-word`が通る | #3351 |
| ほかの図の描き方は今どおりで、OAuthは12段、CCIPは13段が順に動き、箱どうしと線の名前と箱が10px以上離れる | `pnpm test`の検査`oauth-renders-12-steps`と`ccip-renders-13-steps`と`layout-keeps-10px-gap`が通る | #3351 |
| 背景の記法 (縦に組む列の図) を枠324pxの寄って追うで描く時、どの段でも窓がその段で変わる列を含み、最初の段の窓にメモリプールの列と自分のチップが入る | `pnpm exec vitest run --reporter=verbose`の検査`follow-stack-window-shows-changed-lane`が通る | #3365 |
| 列の図を寄って追うで描く時、窓は見出しの文 (図の題、段の題、説明) を描かない | `pnpm exec vitest run --reporter=verbose`の検査`follow-lineup-hides-heading`が通る | #3365 |
| 背景の記法を枠324pxの寄って追うで描く時、箱の名前を縮めずに描いた大きさで出す | `pnpm exec vitest run --reporter=verbose`の検査`follow-stack-keeps-size`が通る | #3365 |
| 背景の記法を枠880pxで描く時、列を横に並べる形 (`row`) の全体の見せ方になる | `pnpm exec vitest run --reporter=verbose`の検査`follow-stack-wide-stays-row`が通る | #3365 |
| 一式が通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3365 |
| 箱を横に並べた列の図で、順番の無い置き場に 7 枚のチップを置いた時、同じ行のチップの上端が同じ値で、同じ列のチップの左端と幅が同じ値で、上下の間と左右の間がそれぞれ全て同じ値である | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-pool-chips-on-grid`が通る | #3408 |
| 携帯の幅で縦に組んだ列の図で、置き場の帯に 7 枚のチップを置いた時も、同じ行のチップの上端が同じ値で、同じ列のチップの左端と幅が同じ値で、上下の間と左右の間がそれぞれ全て同じ値である | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-band-chips-on-grid`が通る | #3408 |
| 常に、順番の無い置き場の枠は点線で、置き場のチップは縦の 1 列にも横の 1 列にもならず、札のチップは`line`に書いた順に同じ左端で上から積む | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-layout-places-roles-and-cards`が通る | #3408 |
| 常に、携帯の幅では置き場を帯にして札の列の上下に積み、置き場に 12 枚のチップを置いても置き場の中に収まる | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-narrow-frame-stacks-places`と`lineup-holds-12-chips-in-places`が通る | #3408 |
| 列の図の原本の JSON が`shape: layers`を受け付ける | `pnpm exec vitest run packages/dragon/test/lineup-layers.test.ts`の検査`schema-accepts-lineup-layers`が通る | #3625 |
| `[shape: layers]`の列の図の記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/lineup-layers.test.ts`の検査`lineup-layers-roundtrip-keeps-notation`が通る | #3625 |
| 層の見た目は`box`を書いた順に上から横の帯に重ね、帯の左に層の名前と説明を出す | `pnpm exec vitest run packages/dragon/test/lineup-layers.test.ts`の検査`lineup-layers-stack-boxes-top-to-bottom`が通る | #3625 |
| 段の中に`line <層>: <札>`を書くと、その段で札がその層の帯へ下りる | `pnpm exec vitest run packages/dragon/test/lineup-layers.test.ts`の検査`lineup-layers-item-moves-down`が通る | #3625 |
| 段の中に`note <層>: <文>`を書くと、その段でその層の帯に印を出し、後の段でも印を残す | `pnpm exec vitest run packages/dragon/test/lineup-layers.test.ts`の検査`lineup-layers-note-stamps-the-layer`が通る | #3625 |
| 層の見た目は層と層の間に矢印を描かない | `pnpm exec vitest run packages/dragon/test/lineup-layers.test.ts`の検査`lineup-layers-draws-no-arrows-between-layers`が通る | #3625 |
| 9つ以上の層を書いた層の見た目の列の図は、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/lineup-layers.test.ts`の検査`lineup-layers-rejects-more-than-eight-layers`が通る | #3625 |
| 使い方の頁と`packages/dragon/README.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、層の見た目の書き方が在る | `pnpm exec vitest run packages/dragon/test/lineup-layers.test.ts`の検査`lineup-layers-docs-describe-the-shape`が通る | #3625 |
| 層の見た目の見本2枚 (Web3の`l2-finality`と一般の`web-request`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じで、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run packages/dragon/test/lineup-layers.test.ts`の検査`lineup-layers-examples-in-both-langs-have-no-breaks`が通る | #3625 |
| 編集画面の棚に層の見た目の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run packages/dragon/test/lineup-layers.test.ts`の検査`lineup-layers-shelf-template-reads`が通る | #3625 |
| 今の列の図の原本を読んで書き戻すと、今と同じ JSON に戻る | `pnpm exec vitest run packages/dragon/test/lineup-diagram.test.ts`の検査`lineup-roundtrip-keeps-json-identical`が通る | #3625 |
| カタログのどの種類も見本を4枚以上載せ、種類の数は変わらない | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3625 |
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3625 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts`の検査`renderers-read-values-from-one-table`が通る | #3625 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3625 |
