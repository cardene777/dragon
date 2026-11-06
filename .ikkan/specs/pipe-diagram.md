# pipe-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `kind`が`pipe`の原本のJSONをJSON Schemaで検査した時、関係者の宣言 (`box`) と始めの値 (`hold`) と、段の中の呼び出し (`[value]`と`[fold]`と`[call]`の印を含む)、`return`、`revert`、`check`、`calc`、`move`、`write`、`emit`の出来事を持つ図は通る | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`schema-accepts-pipe-diagram`が通る | #3389 |
| 配管の図の出来事 (`hold`、`move`、`write`、`check`、`return`、`revert`、`emit`、`calc`) をほかの図に書いた時と、配管の図にほかの図の欄を書いた時、検査が落ちて誤った欄の場所をJSON Pointerで示す。英語を渡した時の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`schema-rejects-misplaced-pipe-events`が通る | #3389 |
| schemaが使う決まりのどれにも、日本語と英語の誤りの文がある | `pnpm test`の検査`every-schema-keyword-has-messages`が通る | #3389 |
| `packages/dragon/examples`の配管の図の見本6組 (交換の成功、交換の取り消し、2回の交換、内側だけの取り消し、storageとイベントとETHの送金と`delegatecall`と`staticcall`、大きなTrace) を`parseNotation`が読んだ時、同じ名前のJSONと同じJSONを返す。英語版の`.en.dragon`と`.en.json`も同じ | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`notation-compiles-pipe-examples-to-json`が通る | #3389 |
| 配管の図の記法に次のどれかがある時は、行と列を示した誤りで止まり、英語の文は仮名と漢字を含まない。宣言していない関係者を書いた行、`box`の行が1つも無い図、最初の`step`より前の`move`か`write`か`emit`、開いていない呼び出しの`return`か`revert`、最後まで`return`か`revert`で閉じない呼び出し、持っている量より多い`move`か`[value]`、動かす者がそのトークンのContractでない`move`、ETHの`move`、両側が数の`check`に書いた`[fail]`、単位の違う数を比べる`check`、両側が数でない`calc`、呼び出しでない行の`[fold]`、`[call: static]`の呼び出しの内側の`move`か`write`か`emit`か`[value]`、`[call: delegate]`の呼び出しに付けた`[value]`、`[call: create]`、配管の図が持たない語の行 (`group`など) | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`notation-rejects-misused-pipe-lines`が通る | #3389 |
| ほかの図の記法で、行の頭に`hold`、`move`、`write`、`check`、`return`、`revert`、`emit`、`calc`を書いた行 (`move usdc: 100 alice -> pool`の形) は、その行は配管の図でしか書けないと示す誤りで止まる | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`notation-limits-pipe-lines-to-pipe`が通る | #3389 |
| 配管の図でない図の記法では、`hold`、`move`、`write`、`check`、`return`、`revert`、`emit`、`calc`を名札にした箱どうしの線 (`move -> db`) を今どおり箱の線として読む | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`notation-keeps-pipe-words-plain-outside-pipe`が通る | #3389 |
| 見本6組の全てを記法、JSON、記法、JSONの順に往復した時、最初と最後のJSONが一致する。英語版も同じ | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-roundtrip-keeps-json-identical`が通る | #3389 |
| OAuthとCCIPの往復で、最初と最後のJSONが一致する | `pnpm test`の検査`roundtrip-keeps-json-identical`が通る | #3389 |
| 関係者の種類を行から導く。最初に呼ぶ者を送り手、呼ばれる者をContractとして描く。`hold`の量の単位に名前 (`box usdc as USDC`の`USDC`) を書かれた関係者と`move`の動かす者をトークンのContractとし、そのトークンの管の弁にも描く。呼びも呼ばれもせず持つだけの者を口座として描く。`ETH`は`box`で宣言しない決まった名前で、弁を持たない。`box`の行に`icon`を書いた関係者はその形で描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-derives-party-kinds-from-lines`が通る | #3389 |
| `[call: delegate]`の呼び出しの内側の`write`は呼んだ側の値の札を書き替え、書き込む管を呼んだ側の札へ向けて描く。`[call: static]`の呼び出しの管は、普通の呼び出しの管の半分の太さで描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-call-kinds-draw-their-pipes`が通る | #3389 |
| 槽の水位はトークンごとに量に比例し、0より多い量は最小の帯より低くならない。`move`と`[value]`の段で送り手の槽が下がって受け手の槽が上がり、管を流れた分は確定するまで斜線の暫定で描く。同じ段に描く流れた分は、横の線どうしも縦の線どうしも重ならない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-move-shifts-tank-levels`が通る | #3389 |
| `hold`で宣言した残高以外の値は、持つContractの列の下に値の札として描く。`write`の段で札の値が替わり、前の値を消し線で残し、確定するまで暫定の印で描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-write-updates-value-plate`が通る | #3389 |
| `emit`の段で、出したContractに値の表のイベントの色の印を出し、図の上の端のイベントの列に`<出した者の名前>.<イベントの名前>`の札を積み、その段だけ引数も出す | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-emit-stacks-events`が通る | #3389 |
| 一番外の呼び出しが`return`した段で、暫定だった槽と値の札とイベントが全て確定の緑に替わる。確定の語は無く、内側の呼び出しの`return`では暫定のまま | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-outer-return-finalizes-changes`が通る | #3389 |
| 一番外の呼び出しが`revert`した段で、全ての槽と値の札が元の値へ戻り、移した分とイベントが取り消しの印で描かれる | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-outer-revert-undoes-everything`が通る | #3389 |
| 内側の呼び出しが`revert`し、呼んだ側に`revert`が無い時、落ちた呼び出しとその内側の変更 (槽、値の札、イベント) だけが元へ戻り、呼んだ側の変更は暫定のまま残り、呼んだ側の次の行から続けて描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-inner-revert-undoes-only-inside`が通る | #3389 |
| `[fold]`を付けた呼び出しの内側を1つの箱にまとめ、箱に内側の段の数と、内側の段にしか出ない関係者の数を出す。畳んだ間は、その関係者の列と名札と槽と値の札と、内側にしか出ないトークンの管と内側の流れを描かず、畳んだ箱の段では見えている関係者の槽に内側の`move`を差し引いた量を1段で出す。箱を押すと内側の段と関係者を開いて描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-fold-collapses-inner-calls`が通る | #3389 |
| 交換の成功の図と取り消しの図を原本のJSONから描いた時、原本の段の数だけ順に動き、成功の図は最後の段で全てが確定の緑になり、取り消しの図は最後の段で全てが元へ戻る | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`swap-renders-every-step`が通る | #3389 |
| 配管の図を0.25秒ごとに止めて数えた時、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-keeps-motion-rules`が通る | #3389 |
| 今ある全ての色味で交換の図を描いた時、関係者と槽と管の位置と大きさが色味によらず同じで、変わるのは色の値だけ | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-layout-same-in-every-palette`が通る | #3389 |
| `packages/dragon/examples`に見本6組の日本語と英語の記法とJSONがあり、英語版の関係者と段と段ごとの出来事の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-example-files-match`が通る | #3389 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と手引き (`packages/dragon/examples/quick-start.md`と`quick-start.en.md`) に、配管の図の頭の語`pipe`と、`hold`、`move`、`write`、`check`、`return`、`revert`、`emit`、`calc`の行と、`[value]`、`[call]`、`[fold]`、`[fail]`の印の書き方が載る | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`docs-describe-pipe-diagram`が通る | #3389 |
| 見本帳の一覧に図の分類が9つ (時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図、列の図、試す図、配管の図) 並び、配管の図の頁に見本6組が載り、選ぶと段を送れる | `pnpm exec vitest run apps/playground-spa/src/lib/pipe-catalog.test.ts`の検査`catalog-lists-pipe-with-examples`が通る | #3389 |
| 見本帳の配管の図の部品に、槽、値の札、呼び出しの管、呼び出しの種類、ETHの送金、確認、イベント、換算、取り消し、畳みの部品が並び、頁ごとに日本語と英語の記法と配管の図で描いた図を出す | `pnpm exec vitest run apps/playground-spa/src/lib/pipe-catalog.test.ts`の検査`catalog-has-pipe-parts`が通る | #3389 |
| 編集画面の棚の見本に配管の図の束があって交換の図が載り、選ぶと書く欄にその記法が入って図が描ける。記法の早見の図の種類の行に`pipe`の頭の行がある | `pnpm exec vitest run apps/playground-spa/src/lib/pipe-catalog.test.ts`の検査`editor-shelf-has-pipe`が通る | #3389 |
| repoの全ての`.dragon`のfileを誤り無く読み、見本帳の全ての見本でどの段でも字が重ならず、描画のfileが値を共通の値の表からだけ読み、記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`every-dragon-file-parses`と`overlaps-none-in-every-example`と`renderers-read-values-from-one-table`と`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3389 |
| 使い方の頁と`CHANGELOG.md`の前の形との対応表の頭の語が、読む部品の語と一致する | `pnpm test`の検査`notation-old-to-new-table-matches-the-parser`が通る | #3389 |
| ほかの図の描き方は今どおりで、OAuthは12段、CCIPは13段、入札は7段が順に動き、箱どうしと線の名前と箱が10px以上離れる | `pnpm test`の検査`oauth-renders-12-steps`と`ccip-renders-13-steps`と`auction-renders-7-steps`と`layout-keeps-10px-gap`が通る | #3389 |
| 一式が通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3389 |
| 送り手と、呼ばれずに持つだけの口座は丸の名札で一番上の行に、Contractは呼ばれた深さの行に箱で描き、槽を持つ関係者は自分の槽の真上に置く(見本swapではAliceとSwapRouterとBobが1行目、LiquidityPoolが2行目) | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-parties-by-call-depth`が通る | #3398 |
| トークンの流れが隣り合う槽どうしだけを結ぶ図(見本swap)は槽の横を結ぶ値の管で、離れた槽を結ぶ図(見本aggregatorの箱を開いた図)は槽の上に通す本管で描き、どちらもトークンの箱が値の管の弁の真上に軸で立つ | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-value-pipes-follow-flows`が通る | #3398 |
| トークンの箱は、`hold`で宣言したその箱の値(許可額など)を名前の下に書き、`write`の段で前の値を消し線で残す | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-token-box-holds-values`が通る | #3398 |
| 槽は、つやと5本の目盛りとトークンの名前を持ち、下に3桁ごとに区切った大きな数を出し、変わった段から確定するまで前の値の消し線と暫定の語を、確定した後は確定の語を添える | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-tank-parts`が通る | #3398 |
| 同じ関係者から出る呼び出しの管は1本の本管と呼ぶ相手ごとの枝で描き、弁は枝の根元に置き、まだ戻っていない呼び出しの管だけを光らせる(見本aggregatorの箱を開いた図のAggregator) | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-calls-share-a-main`が通る | #3398 |
| `check`の計器は、トークンのContractが確かめる時と、確かめた者がその後に払うトークンの単位を式が持つ時(見本swapのPoolの最低額の確認)は値の管の上に、ほかの確認は確かめる関係者を呼んだ管の上に描き、確かめた段の後も針と通ったか落ちたかの印を残す。値の管の計器の式は管が運ぶ単位を外して書く。図の上に確認の印の列は描かない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-gauge-on-pipe`が通る | #3398 |
| `calc`を行う関係者の2つの槽の間に変換器を描き、その関係者の槽を点線の囲いで囲み、計算する段で変換器を値の色にする | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-converter-between-tanks`が通る | #3398 |
| どの段でも、その段の動き(移した量、確かめた式、換算、戻った値、呼び出しの字のどれか)を吹き出し1つで出し、吹き出しは名札と槽と槽の下の数に重ならない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-callout-per-step`が通る | #3398 |
| 呼び出しの段で管が光って弁の取っ手が回り、`move`の段で液が値の管を流れて槽の水位が変わり、`check`の段で計器の針が振れて印が付く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-motions`が通る | #3398 |
| 見本aggregatorの箱を全て開いた図を幅1200で描いた時、縮めずに関係者の名前と槽の下の数を見本swapと同じ字の大きさで出し、名前を1字に略さない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-wide-figure-keeps-text-size`が通る | #3398 |
| 同じ図の最後の段で、AliceとRouterとBobの残高の槽が全て図の中に描かれる | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-final-step-draws-all-tanks`が通る | #3398 |
| 図の横幅が枠を超える時、段を進めると枠の中の図がその段に関わる関係者の所へ横に送られ、手でも横に動かせ、図の下の細い線が全体のどこを見ているかを示す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pans-wide-figure`が通る | #3398 |
| 色味を指定せずに描いた配管の図は色味`sea`の値で描き、色味を指定した時はその色味で描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-default-palette-is-sea`が通る | #3398 |
| 槽と値の管とトークンの箱と弁は`blocks/hold/draw.ts`、計器は`blocks/check/draw.ts`、変換器は`blocks/calc/draw.ts`、値の札は`blocks/write/draw.ts`、丸の名札とContractの箱は`blocks/box/draw.ts`が描き、配管の図の描き方(`render/pipe.ts`)はそれらを呼んで組む | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-r6-parts-live-in-blocks`が通る | #3398 |
| 段を持つ全ての図の再生の操作は、大きな段の題、題の下の小さな段の説明文、やり直しの釦、名前の付いた再生の釦、段ごとに分けた進み具合の帯を持つ | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-r6-controls`が通る | #3398 |
| `dragon export`で書き出した見本aggregatorのHTMLで畳んだ箱を押すと、段の番号が04/14になり内側の段に分かれる | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`export-pipe-opens-inner-steps`が通る | #3398 |
| 配管の図の見本の記法と原本のJSONの形は変わらず、記法から読んだJSONが同じ名前のJSONと一致する | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`notation-compiles-pipe-examples-to-json`が通る | #3398 |
| 見本の全てを記法、JSON、記法、JSONの順に往復した時、最初と最後のJSONが一致する | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-roundtrip-keeps-json-identical`が通る | #3398 |
| 槽の水位はトークンごとに量に比例し、`move`の段で送り手の槽が下がって受け手の槽が上がり、流れた分は確定するまで斜線の暫定で描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-move-shifts-tank-levels`が通る | #3398 |
| 一番外の呼び出しの`return`で暫定だった槽と値とイベントが全て確定になり、内側の`return`では暫定のまま | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-outer-return-finalizes-changes`が通る | #3398 |
| 一番外の呼び出しの`revert`で全ての槽と値が元へ戻り、移した分とイベントが取り消しの印で描かれる | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-outer-revert-undoes-everything`が通る | #3398 |
| 内側の呼び出しの`revert`では、落ちた呼び出しとその内側の変更だけが元へ戻る | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-inner-revert-undoes-only-inside`が通る | #3398 |
| `[fold]`を付けた呼び出しの内側を1つの箱にまとめ、箱を押すと内側の段と関係者を開いて描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-fold-collapses-inner-calls`が通る | #3398 |
| `emit`の段で、図の上の端のイベントの列に`<出した者の名前>.<イベントの名前>`の札を積む | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-emit-stacks-events`が通る | #3398 |
| 交換の成功の図と取り消しの図は原本の段の数だけ順に動き、成功は最後の段で全て確定、取り消しは最後の段で全て元へ戻る | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`swap-renders-every-step`が通る | #3398 |
| 段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-keeps-motion-rules`が通る | #3398 |
| 全ての色味で、関係者と槽と管の位置と大きさが同じで、変わるのは色の値だけ | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-layout-same-in-every-palette`が通る | #3398 |
| 配管の図以外の見本のSVGと置き場所と時刻は変わらない(配管の図の見本の指紋だけを取り直す) | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3398 |
| 動きを減らす設定では各段の止まった絵を出し、段の題と本文を読み上げに出す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`reduced-motion-shows-stills`と`steps-exposed-to-screen-readers`が通る | #3398 |
