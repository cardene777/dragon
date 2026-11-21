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
| 一番外の呼び出しが`return`した段で、暫定だった槽と値の札とイベントが全て確定の緑に替わる。確定の語は無く、内側の呼び出しの`return`では暫定のまま | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-outer-return-finalizes-changes`が通る | #3389 |
| 一番外の呼び出しが`revert`した段で、全ての槽と値の札が元の値へ戻り、移した分とイベントが取り消しの印で描かれる | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-outer-revert-undoes-everything`が通る | #3389 |
| 内側の呼び出しが`revert`し、呼んだ側に`revert`が無い時、落ちた呼び出しとその内側の変更 (槽、値の札、イベント) だけが元へ戻り、呼んだ側の変更は暫定のまま残り、呼んだ側の次の行から続けて描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-inner-revert-undoes-only-inside`が通る | #3389 |
| `[fold]`を付けた呼び出しの内側を1つの箱にまとめ、箱に内側の段の数と、内側の段にしか出ない関係者の数を出す。畳んだ間は、その関係者の列と名札と槽と値の札と、内側にしか出ないトークンの管と内側の流れを描かず、畳んだ箱の段では見えている関係者の槽に内側の`move`を差し引いた量を1段で出す。箱を押すと内側の段と関係者を開いて描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-fold-collapses-inner-calls`が通る | #3389 |
| 交換の成功の図と取り消しの図を原本のJSONから描いた時、原本の段の数だけ順に動き、成功の図は最後の段で全てが確定の緑になり、取り消しの図は最後の段で全てが元へ戻る | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`swap-renders-every-step`が通る | #3389 |
| 配管の図を0.25秒ごとに止めて数えた時、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-keeps-motion-rules`が通る | #3389 |
| 今ある全ての色味で交換の図を描いた時、関係者と槽と管の位置と大きさが色味によらず同じで、変わるのは色の値だけ | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-layout-same-in-every-palette`が通る | #3389 |
| `packages/dragon/examples`に見本6組の日本語と英語の記法とJSONがあり、英語版の関係者と段と段ごとの出来事の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-example-files-match`が通る | #3389 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と手引き (`packages/dragon/examples/quick-start.md`と`quick-start.en.md`) に、配管の図の頭の語`pipe`と、`hold`、`move`、`write`、`check`、`return`、`revert`、`emit`、`calc`の行と、`[value]`、`[call]`、`[fold]`、`[fail]`の印の書き方が載る | `pnpm exec vitest run packages/dragon/test/kind-playground.test.ts`の検査`docs-describe-pipe-diagram`が通る | #3389 |
| repoの全ての`.dragon`のfileを誤り無く読み、見本帳の全ての見本でどの段でも字が重ならず、描画のfileが値を共通の値の表からだけ読み、記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`every-dragon-file-parses`と`overlaps-none-in-every-example`と`renderers-read-values-from-one-table`と`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3389 |
| ほかの図の描き方は今どおりで、OAuthは12段、CCIPは13段、入札は7段が順に動き、箱どうしと線の名前と箱が10px以上離れる | `pnpm test`の検査`oauth-renders-12-steps`と`ccip-renders-13-steps`と`auction-renders-7-steps`と`layout-keeps-10px-gap`が通る | #3389 |
| 一式が通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3389 |
| トークンの箱は、`hold`で宣言したその箱の値(許可額など)を名前の下に書き、`write`の段で前の値を消し線で残す | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-token-box-holds-values`が通る | #3398 |
| `calc`を行う関係者の2つの槽の間に変換器を描き、その関係者の槽を点線の囲いで囲み、計算する段で変換器を値の色にする | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-converter-between-tanks`が通る | #3398 |
| 呼び出しの段で管が光って弁の取っ手が回り、`move`の段で液が値の管を流れて槽の水位が変わり、`check`の段で計器の針が振れて印が付く | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-motions`が通る | #3398 #3418 |
| 図の横幅が枠を超える時、段を進めると枠の中の図がその段に関わる関係者の所へ横に送られ、手でも横に動かせ、図の下の細い線が全体のどこを見ているかを示す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pans-wide-figure`が通る | #3398 |
| 色味を指定せずに描いた配管の図は色味`sea`の値で描き、色味を指定した時はその色味で描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-default-palette-is-sea`が通る | #3398 #3418 |
| 槽と値の管とトークンの箱と弁は`blocks/hold/draw.ts`、計器は`blocks/check/draw.ts`、変換器は`blocks/calc/draw.ts`、値の札は`blocks/write/draw.ts`、丸の名札とContractの箱は`blocks/box/draw.ts`が描き、配管の図の描き方(`render/pipe.ts`)はそれらを呼んで組む | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-parts-live-in-blocks`が通る | #3398 |
| 配管の図の見本の記法と原本のJSONの形は変わらず、記法から読んだJSONが同じ名前のJSONと一致する | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`notation-compiles-pipe-examples-to-json`が通る | #3398 |
| 見本の全てを記法、JSON、記法、JSONの順に往復した時、最初と最後のJSONが一致する | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-roundtrip-keeps-json-identical`が通る | #3398 |
| 槽の水位はトークンごとに量に比例し、`move`の段で送り手の槽が下がって受け手の槽が上がり、流れた分は確定するまで斜線の暫定で描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-move-shifts-tank-levels`が通る | #3398 |
| 一番外の呼び出しの`return`で暫定だった槽と値とイベントが全て確定になり、内側の`return`では暫定のまま | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-outer-return-finalizes-changes`が通る | #3398 #3418 |
| 一番外の呼び出しの`revert`で全ての槽と値が元へ戻り、移した分とイベントが取り消しの印で描かれる | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-outer-revert-undoes-everything`が通る | #3398 #3418 |
| 内側の呼び出しの`revert`では、落ちた呼び出しとその内側の変更だけが元へ戻る | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-inner-revert-undoes-only-inside`が通る | #3398 #3418 |
| `[fold]`を付けた呼び出しの内側を1つの箱にまとめ、箱を押すと内側の段と関係者を開いて描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-fold-collapses-inner-calls`が通る | #3398 #3418 |
| 交換の成功の図と取り消しの図は原本の段の数だけ順に動き、成功は最後の段で全て確定、取り消しは最後の段で全て元へ戻る | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`swap-renders-every-step`が通る | #3398 #3418 |
| 段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-keeps-motion-rules`が通る | #3398 |
| 全ての色味で、関係者と槽と管の位置と大きさが同じで、変わるのは色の値だけ | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-layout-same-in-every-palette`が通る | #3398 #3418 |
| 配管の図以外の見本のSVGと置き場所と時刻は変わらない(配管の図の見本の指紋だけを取り直す) | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3398 #3418 |
| 動きを減らす設定では各段の止まった絵を出し、段の題と本文を読み上げに出す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`reduced-motion-shows-stills`と`steps-exposed-to-screen-readers`が通る | #3398 #3418 |
| 配管の図の決まりの表が、部品の種類の組ごとの最小の間、線が部品を通ってよい口、線どうしの間と交わり方、1本の管が折れてよい回数を持ち、背景の6種類の崩れと、字に線がかかる形と、線の小さな段差と揃わない間の8種類をそれぞれ受け持つ決まりがある | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-rules-table-covers-eight-breakages`が通る | #3418 |
| 6つの見本(`swap`、`swap-revert`、`swap-retry`、`swap-two-hops`、`vault-proxy`、`aggregator`)の日本語版と英語版の全ての段の止め絵を、全ての色味で幅1280と幅390の枠に描いた時、決まりの表への違反を数える検査が0件を返す | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-rules-zero-violations-in-every-example`が通る | #3418 |
| 関係者と槽と流れの数を変えて機械で作った図と、関係者とトークンに英語の長い名前を付けた図を幅1280と幅390の枠に描いた時、違反を数える検査が0件を返す | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-rules-zero-violations-in-generated-figures`が通る | #3418 |
| 決まりの表の値を1つ壊して描いた時、違反を数える検査がその決まりの名前を出して落ちる | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-rules-broken-value-names-the-rule`が通る | #3418 |
| 図を1列に並べず、名札を呼び出しの深さで段を下げ、槽を持ち主ごとの囲いにまとめ、流れでつながる囲いを隣に置き、1列で隣にできない流れは囲いを下の段に置いて輪にする(見本`swap-two-hops`ではPool2の囲いがPool1の囲いより下の段に在り、WETHとDAIの値の管が輪を作る) | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-compose-by-calls-and-flows`が通る | #3418 |
| 値の管は槽の横の口どうしを結び、1本の幹を共に通る同じ組の管(次の行)のほかは管どうしを重ねて走らせない。呼び出しの管が値の管を越える所は直角に1回だけ値の管の下をくぐり、名札と槽を横切らない。呼び出しの弁は管が横か縦に走る所に、計器は横に走る所に、間を空けて並ぶ | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-pipes-join-side-ports-and-cross-under`が通る | #3418 |
| 同じトークンで同じ槽を端に持つ値の管が2本以上在る時、管は槽の1つの口を共に出て1本の幹を重なって通り、相手の近くで枝に分かれる。幹の管は同じ組の管を突き抜けて越えない(見本`aggregator`では、Aggregatorの`USDC`の槽から3つのPoolへ出る管と、3つのPoolからAggregatorの`WETH`の槽へ入る管がそれぞれ幹を作る) | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-value-pipes-share-a-trunk`が通る | #3418 |
| 決まりの表が、呼び出しの管の弁の胴と軸と閉じた取っ手と開いた取っ手の形と、ほかの線の縁の間の下限(3px)を持つ。弁が載る管と、弁の所でその管と重なって走る同じ者の管は測らない。弁の取っ手をほかの管に重ねて描くと、違反を数える検査がこの決まりの名前を出す | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-rules-valve-clearance`が通る | #3418 |
| 見本`aggregator`の箱を全て開いた図を幅1280の枠に描いた最後の段で、呼び出しの管どうしが交わる所が12以下(直す前は25)、呼び出しの管が値の管を越える所が16以下(直す前は26)、1本の呼び出しの管が越える線が7本以下(直す前は10)になる | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-aggregator-untangled`が通る | #3418 |
| 全ての見本で槽と弁と計器と名札の高さが見本`swap`と同じ寸法で、込み合う図でも部品を小さくせず間を広げて図を大きくする。幅1280の枠で描いた時、槽の数字は22px、名前は15px、値の箱は26pxを超えず、名札の幅は名前の長さに合わせ、図の中の札の角の丸みは6px以下にする | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-text-caps-and-square-labels`が通る | #3418 |
| 値の管に流れた量を単位つきで出し、計器に単位つきの式(見本`swap-two-hops`の`160 DAI ≥ 150 DAI`)を出し、始めた人が払った槽に入力、受け取った槽に出力の印を付ける。段ごとの吹き出しは出さない | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-values-have-roles`が通る | #3418 |
| 槽の下に今の残高を出し、変わった段から増えた分か減った分(`+100 USDC`の形)と暫定の語を、確定した後は確定の語を添え、前の値の消し線は出さない | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-tank-shows-balance-and-change`が通る | #3418 |
| `emit`の段で、イベントの札を出したContractの箱の横に出し、図の上の端にイベントの列を描かない | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-emit-beside-emitter`が通る | #3418 |
| `hold`で宣言した残高以外の値の札を持つContractの囲いの中に並べ、`write`の段で札の値が替わり、前の値を消し線で残し、確定するまで暫定の印で描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-write-plates-sit-in-owner-housing`が通る | #3418 |
| どの段でも、その段で動いた部品(流れた値の管、回った弁、振れた計器、計算した変換器、出したイベント)を明るく描き、動かなかった部品を薄く描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-dims-parts-that-did-not-move`が通る | #3418 |
| `return`の段で、戻り値の札が呼び出しの管を伝って呼んだ側の名札まで動く | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-return-travels-back-along-call`が通る | #3418 |
| 枠の幅が390の時、図を枠の幅に合わせて全体を出し、全ての槽の残高と、今の段で動いた値(流れた量、確認の式)を画面で10px以上に見える字で出す。済んだ段の値と計算とイベントと戻り値と槽の下の増減は図に出さず、呼び出しの一覧で読める | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-narrow-shows-balances-and-current-value`が通る | #3418 |
| 配管の図の再生の枠は、拡大と縮小の釦と拡大の度合いの百分率を持ち、縦に回すホイールで修飾キーの有無に依らず指した所を中心に拡大と縮小ができ、横に回すホイールは拡大せず図を横に送り、拡大した図を引いて動かせ、ダブルクリックで押した所を中心に拡大する (Tracelyth #191) | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-zooms-and-pans`が通る | #3418、#3761 |
| `dragon export`で書き出した見本`aggregator`のHTMLで畳んだ箱を押すと、段の番号を出さないまま進み具合の帯が8つから14に分かれ、今の段が4つ目になる | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`export-pipe-opens-inner-steps-by-progress`が通る | #3418 |
| 見本`swap`の5段目と最後の段は、[#3398](https://github.com/cardene777/dragon/issues/3398)で本人が良しとした絵と同じ並び(関係者の左右と上下の順、槽の順、値の管がつなぐ槽)で描かれる | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-swap-keeps-approved-arrangement`が通る | #3418 |
| 槽の水位はトークンごとに同じ尺で量に比例し、0より多い量は最小の帯より低くならない。`move`の段で送り手の槽が下がって受け手の槽が上がり、流れた分は確定するまで斜線の暫定で描く | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-move-shifts-tank-levels`が通る | #3418 |
| 槽はつやと5本の目盛りとトークンの名前を持ち、下に3桁ごとに区切った数を出し、トークンごとに液の色を分ける | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-tank-parts`が通る | #3418 |
| `check`の計器は、トークンのContractが確かめる時と、確かめた者がその後に払うトークンの単位を式が持つ時は値の管の上に、ほかの確認は確かめる関係者を呼んだ管の上に描き、確かめた段の後も針と通ったか落ちたかの印を残す。図の上に確認の印の列は描かない | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-gauge-on-pipe`が通る | #3418 |
| トークンの箱は、`hold`で宣言したその箱の値を名前の下に書き、`write`の段で前の値を消し線で残す | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-token-box-holds-values`が通る | #3418 |
| `calc`を行う関係者の2つの槽の間に変換器を描き、計算する段で変換器を値の色にする | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-converter-between-tanks`が通る | #3418 |
| 見本`aggregator`の箱を全て開いた図の最後の段で、AliceとRouterとBobの残高の槽が全て図の中に描かれる | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-final-step-draws-all-tanks`が通る | #3418 |
| 時刻表の段の番号の札は、その段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-keeps-motion-rules`が通る | #3418 |
| 槽と値の管とトークンの箱と弁は`blocks/hold/draw.ts`、計器は`blocks/check/draw.ts`、変換器は`blocks/calc/draw.ts`、値の札は`blocks/write/draw.ts`、名札とContractの箱は`blocks/box/draw.ts`が描き、配管の図の描き方(`render/pipe.ts`)はそれらを呼んで組む | `pnpm exec vitest run packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-parts-live-in-blocks`が通る | #3418 |
| 配管の図の見本の記法と原本のJSONの形は変わらず、記法から読んだJSONが同じ名前のJSONと一致し、記法とJSONを往復しても最初と最後のJSONが一致する | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`notation-compiles-pipe-examples-to-json`と`pipe-roundtrip-keeps-json-identical`が通る | #3418 |
| 図の横幅が枠を超える時、段を進めると枠の中の図がその段に関わる関係者の所へ送られ、手でも動かせ、図の下の細い線が全体のどこを見ているかを示す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pans-wide-figure`が通る | #3418 |
| 段を持つ全ての図の再生の操作は、やり直しの釦、名前の付いた再生の釦、段ごとに分けた進み具合の帯を持ち、配管の図でない図は大きな段の題と題の下の小さな段の説明文を持つ | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-r6-controls`が通る | #3418 |
| 配管の図の段に`gist <要点>`の行を書いた記法を読むと、原本の段が`gist`の欄に要点の文を持ち、原本の形の検査がその原本を通し、書き戻すと元の記法と同じ文字列に戻る(日本語と英語) | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-step-gist-roundtrip`が通る | #3464 |
| 配管の図でない図の段に`gist`の行を書くと、行と列を名指して配管の図だけで書けると知らせる誤りで止まる。1つの段に`gist`を2行書いた時と、要点の文が空の時も、行と列を名指した誤りで止まる。原本のJSONで配管の図でない図の段が`gist`を持つと、原本の形の検査がその欄の場所を名指して断る。英語の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-gist-only-in-pipe`が通る | #3464 |
| 配管の図の再生の部品は、`gist`を持つ段で、図の下の矢印の後に「要点」の名札と要点の文を持つ札を出し、`gist`を持たない段では札を出さない(見本`swap`の段14は札を出し、段1は出さない)。英語を渡した時の名札は`Key point`。読み上げの段の一覧は、`gist`を持つ段に要点の文を出す | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-shows-gist`が通る | #3464 |
| 6つの配管の図の見本の日本語版と英語版で、次の11段が`gist`を持ち、要点の文が括弧の語を含む。`swap`の段6と段13(暫定、`provisional`)と段14(確定、`final`)、`swap-two-hops`の段13と`swap-retry`の段11と`vault-proxy`の段9と`aggregator`の段14(確定、`final`)、`swap-retry`の段7(Pool1と内側、`pool 1`と`inside`)、`vault-proxy`の段2(Proxyの値、`proxy`)と段4(書き込めない、`written`)、`aggregator`の段3(押すと開く、`press`)。ほかの段は`gist`を持たない | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-examples-carry-gists`が通る | #3464 |
| 英語と日本語のREADMEの配管の図の小節と、AIのskillの配管の図の段の行の表が、`gist`の書き方を持つ | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`docs-describe-gist`が通る | #3464 |
| 書き出した頁の字の file に残す配管の図の字(`pipeTexts`)は、見本の全ての段で図の下の矢印と要点の札と呼び出しの結果が出す字を全て含む | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`pipe-texts-cover-flows`が通る | #3464 |
| 配管の図でない図に配管の図の行(`move`など)を書くと、今どおり配管の図だけで書けると知らせる誤りで止まる | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`notation-limits-pipe-lines-to-pipe`が通る | #3464 |
| 配管の図の見本の記法と原本のJSONは、往復しても今どおり同じJSONになる | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-roundtrip-keeps-json-identical`が通る | #3464 |
| 6つの見本の全ての段を幅1280と幅390の枠に描いた時、決まりの表への違反が0件のまま | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-rules-zero-violations-in-every-example`が通る | #3464 |
| 記法の行の頭の語は、今どおり1つの語を1つのブロックだけが持つ | `pnpm exec vitest run packages/dragon/test/blocks.test.ts`の検査`block-heads-owned-once`が通る | #3464 |
| 見本帳の部品は、今どおり記法の全ての語を受け持つ | `pnpm exec vitest run apps/playground-spa/src/lib/catalog-parts.test.ts`の検査`catalog-parts-cover-every-word`が通る | #3464 |
| AIのskillの記法の囲みは、今どおり全て読める | `pnpm exec vitest run packages/dragon/test/notation-skill.test.ts`の検査`skill-fences-parse`が通る | #3464 |
| 見本`swap`の段14を描いた時、返した値の札「0.05 WETH」が止まる所は、Aliceの弁とRouterの計器に重ならない | `pnpm exec vitest run packages/dragon/test/pipe-layout-check.test.ts`の検査`pipe-return-chip-clears-valve-and-gauge`が通る | #3523 |
| 見本`swap-retry`の段4を描いた時、札「true」が止まる所は、Pool1の箱とPool1から出る管の弁 (胴と取っ手) に重ならない | `pnpm exec vitest run packages/dragon/test/pipe-layout-check.test.ts`の検査`pipe-return-chip-clears-box-and-lever`が通る | #3523 |
| 見本`swap-retry`の段11を描いた時、Pool1から出る2本の管の弁の胴は、ほかの管の縁から平行な管の間 (10px) 以上離れる | `pnpm exec vitest run packages/dragon/test/pipe-layout-check.test.ts`の検査`pipe-valves-keep-clear-of-sibling-pipes`が通る | #3523 |
| 見本`swap-two-hops`の段13を描いた時、呼び出しの管は箱の縁の角の丸みにかからない所から出入りし、RouterからPool1への管とRouterからPool2への管は1本の管を共に通らない | `pnpm exec vitest run packages/dragon/test/pipe-layout-check.test.ts`の検査`pipe-calls-leave-straight-edges-and-stay-apart`が通る | #3523 |
| 配管の図で札が弁か計器か箱に重なる時、`dragon check --layout`がその段と札と部品を名指す`warning`の行を出す | `pnpm exec vitest run packages/dragon/test/pipe-layout-check.test.ts`の検査`layout-check-finds-chip-over-pipe-part`が通る | #3523 |
| 配管の図で管が箱の縁の角の後ろを通る時と、2本の管が逆向きに1本の管を共に通る時と、弁の胴がほかの管に近すぎる時、`dragon check --layout`がその段と管か弁を名指す`warning`の行を出す | `pnpm exec vitest run packages/dragon/test/pipe-layout-check.test.ts`の検査`layout-check-finds-pipes-overlapping`が通る | #3523 |
| 常に、見本の`.dragon`に、数えた一覧 (`packages/dragon/test/fixtures/layout-breaks.json`) に無い崩れが出ない | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-examples-match-recorded`が通る | #3523 |
| 常に、配管の図の見本と機械で作った図は、配管の図の決まりの表に違反しない | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-rules-zero-violations-in-every-example`と`pipe-rules-zero-violations-in-generated-figures`が通る | #3523 |
| `renderDiagram`に`words.pipe.tags`を渡すと、槽の下の暫定、確定、取り消しの語が渡した語で描かれ、元の語が図に残らない | `pnpm exec vitest run packages/dragon/test/pipe-words.test.ts`の検査`pipe-words-tags-replaced`が通る | #3584 |
| `mountDiagram`に同じ語を渡すと、置いた図の槽の下の語が渡した語になり、畳んだ箱を押して描き直した後も渡した語のまま描かれる | `pnpm exec vitest run packages/dragon/test/pipe-words.test.ts`の検査`pipe-words-mount-keeps-words`が通る | #3584 |
| `words.pipe.io`を渡すと、始めた人と受け取った人の槽の札が渡した語で描かれる | `pnpm exec vitest run packages/dragon/test/pipe-words.test.ts`の検査`pipe-words-io-replaced`が通る | #3584 |
| `words.pipe.fold`と`open`と`foldTitle`を渡すと、まとめた枠の文が`{steps}`と`{parties}`に数を差し込んだ文で、押すと開くの語とまとめた段の題が`{name}`に名前を差し込んだ文で描かれる | `pnpm exec vitest run packages/dragon/test/pipe-words.test.ts`の検査`pipe-words-fold-replaced`が通る | #3584 |
| 一部の語だけを渡した時は、渡していない語が描く言葉の今の語で描かれる | `pnpm exec vitest run packages/dragon/test/pipe-words.test.ts`の検査`pipe-words-partial-keeps-rest`が通る | #3584 |
| 今の語より長い語を渡しても、槽の札が長い語の幅で組まれ、重なりの数が今の語で描いた時より増えない | `pnpm exec vitest run packages/dragon/test/pipe-words.test.ts`の検査`pipe-words-long-words-fit`が通る | #3584 |
| 語を渡さない時と、空の`words`か空の`words.pipe`を渡した時の図が、今の図と同じ字で描かれる | `pnpm exec vitest run packages/dragon/test/pipe-words.test.ts`の検査`pipe-words-absent-same-svg`が通る | #3584 |
| 配管の図の管を引く順を試す時、ある回の結果 (道の無い管、曲がりすぎた管などの数) が前の最良より良くならなかったら、次の順を試さずにやめる | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-order-tries-stop-without-gain`が通る | #3603 |
| 引く順を試す時、前の最良より良くなった回の後は次の順を試し、悪い管が0になった回か4回目でやめ、最良の回の順を返す | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-order-tries-keep-going-while-better`が通る | #3603 |
| 幅390で箱2を開いた`aggregator`を日本語と英語で組む時、管の道を探す回数が、直す前の515回より少ない | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-narrow-open-aggregator-searches-fewer`が通る | #3603 |
| 配管の見本の全ての言語と幅と開いた箱で、置き場所の指紋が記録した指紋と同じで、管の線を1本も変えない | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-layout-matches-recorded-fingerprints`が通る | #3603 |
| 配管の見本の全てで決まりの表の違反が0で、狭い幅で再生した配管の図の字が読める大きさで描かれる | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts packages/dragon/test/player.test.ts packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-rules-zero-violations-in-every-example`と検査`player-pipe-narrow-keeps-text-readable`が通る | #3603 |
| 変えたfileを確かめる2つの検査のfileが全て通り、packageの検査の一式 (`pnpm exec vitest run packages/`) も全て通る | `pnpm exec vitest run packages/dragon/test/pipe-diagram.test.ts packages/dragon/test/player.test.ts`が終わり方0で終わる | #3603 |
| `mint usdc: 100 -> alice`を読み、aliceの槽が100増える | `pnpm exec vitest run packages/dragon/test/pipe-token-notation.test.ts`の検査`pipe-mint-fills-receiver`が通る | #3722 |
| `burn usdc: 100 alice`を読み、aliceの槽が100減る | `pnpm exec vitest run packages/dragon/test/pipe-token-notation.test.ts`の検査`pipe-burn-drains-holder`が通る | #3722 |
| 発行と焼却を書いた図は、ゼロのアドレスを人として描かず、残高も持たせない | `pnpm exec vitest run packages/dragon/test/pipe-token-notation.test.ts`の検査`pipe-mint-burn-draw-no-zero-address`が通る | #3722 |
| `move art: #1 alice -> bob`を読み、aliceからbobへ移る線を描き、番号1の持ち主をbobにする | `pnpm exec vitest run packages/dragon/test/pipe-token-notation.test.ts`の検査`pipe-nft-move-draws-line`が通る | #3722 |
| `move items: 2 #1 alice -> bob`を読み、aliceの番号1を2減らしてbobに2足し、移る線を描く | `pnpm exec vitest run packages/dragon/test/pipe-token-notation.test.ts`の検査`pipe-erc1155-move-draws-line`が通る | #3722 |
| `mint art: #3 -> alice`と`burn art: #3 alice`を読み、番号3の持ち主を変える | `pnpm exec vitest run packages/dragon/test/pipe-token-notation.test.ts`の検査`pipe-nft-mint-burn`が通る | #3722 |
| `#`の後に番号の無い`move art: # alice -> bob`を、読む時に誤りとして拒む | `pnpm exec vitest run packages/dragon/test/pipe-token-notation.test.ts`の検査`pipe-nft-move-refuses-missing-id`が通る | #3722 |
| 数を移す`move usdc: 100 alice -> bob`の読み方と描き方は今のまま | `pnpm exec vitest run packages/dragon/test/pipe-token-notation.test.ts`の検査`pipe-move-amount-unchanged`が通る | #3722 |
| 記法の説明の`plugins/dragon/skills/dragon/references/kinds/pipe.md`が、`mint`と`burn`と`#`の番号の書き方を載せる | `pnpm exec vitest run packages/dragon/test/pipe-token-notation.test.ts`の検査`pipe-notation-docs-list-mint-burn-nft`が通る | #3722 |
| 記法の`layout`の行で、箱を上に置く形と、箱を人の列の下に集める形を含む4つの置き方を選べ、`auto`はトークンの箱が4つまでの図で形と箱の並びを点数で選ぶ (Tracelyth #165、#166) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-layout-four-shapes-and-auto`が通る | #3720 |
| 記法の`layout`の行で、槽をトークンごとの行に並べる帳簿型と母線型と、全ての槽を1つの行に置いて人ごとの槽を丸の真下に横に並べ、値が動いた組だけを結ぶ網型を選べる (Tracelyth #168、#221、#225) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-layout-ledger-grid-bus`が通る | #3720、#3761 |
| 呼び出しに関わらない人と箱を薄く描き、呼び方を替えても人と箱と槽の置き場所を変えない (Tracelyth #165) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-faint-uninvolved-keeps-places`が通る | #3720 |
| トークンの箱の中に、持つ人ごとの残高を人の頭文字の印つきの行で並べ、値が変わった行に前の値と矢印と今の値を出す (Tracelyth #171、#175) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-token-box-balance-rows`が通る | #3720 |
| 許可のような送金でない書き換えを2人を結ぶ線と札で描き、線の札はrequireの針と呼び出しの札と札入れに重ならない (Tracelyth #107、#111、#113、#115) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-write-links-clear-of-chips`が通る | #3720 |
| 描いた置き場所が、今の呼び出しの札 (`callCards`)、札入れ (`wallets`)、ログの札 (`logCards`)、移す額の受け渡し (`gulps`) を持つ | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-layout-exposes-cards-and-gulps`が通る | #3720 |
| 再生の部品が、`pausedAtStart`と`rewind`で段1の変わる前の値を見せて止まる (Tracelyth #131) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-player-pauses-at-start`が通る | #3720 |
| 再生の部品が、`fitWide`で600px以上の枠では枠より広い図の全体を枠の幅に収めて始め、`minZoom`で始めの大きさより小さくでき、`startZoom`と`onZoom`で拡大の度合いを渡し返せる (Tracelyth #177、#179、#181) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-player-zoom-options`が通る | #3720、#3761 |
| 見る人が図を送るか拡大と縮小をした後は、段が進んでも枠を関係者の所へ送らず、段を選ぶと送り直す (Tracelyth #183) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-player-holds-after-user-pan`が通る | #3720 |
| 共有のHTMLが、値の持ち分を書いた図を止まらずに描く (Tracelyth #133) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-shared-html-draws-holdings`が通る | #3720 |
| 電話の幅でも広い枠と同じ並びで描き、再生の部品が今の段へ寄せる (Tracelyth #87) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-phone-width-same-arrangement`が通る | #3720 |
| 図の種類の行に見た目の指定`[shape: pipe]`を書いたシーケンス図が、パイプ図の部品で描き、線を起こした操作の番号を`data-op`で持ち、今の段の帯とお金の矢印を描く (Tracelyth #86、#91、#93、#97) | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-sequence-ops-band-money`が通る | #3720 |
| 弁を、載せた真っすぐな所の真ん中から探して置く | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-valve-centered-on-straight`が通る | #3720 |
| 見た目を書かないシーケンス図は今の見た目で描き、パイプ図の部品の生存線の管と今の段の帯を描かない | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-sequence-default-look-kept`が通る | #3720 |
| シーケンス図の外の種類の線に書いた操作の番号`op`を、読む処理が行と列を示して拒む | `pnpm exec vitest run packages/dragon/test/pipe-port.test.ts`の検査`port-op-refused-outside-sequence`が通る | #3720 |
| 見本帳の部品の図 (配管の図の呼び出しの部品を含む) が、崩れの検査に1つも掛からない | `pnpm exec vitest run apps/playground-spa/src/lib/part-settings.test.tsx`の検査`part-settings-figures-have-no-breaks`が通る | #3720 |
| 見本帳の頁が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3720 |
| 最初に読む script の大きさは今の上限 (gzip 後の合計90000バイト) に収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3720 |
| 人を1人から8人、トークンの箱とコントラクトを1つから8つに変えて作ったパイプ図で、札と人と箱と槽の重なりが0件 | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-grid-no-overlap`が通る | #3721 |
| 同じ図で、線が箱と槽と札の文字の上を通る所が0件 | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-grid-lines-avoid-text`が通る | #3721 |
| 同じ図で、横幅いっぱいに何も描かない高さ200px以上の帯が0件 | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-grid-no-empty-band`が通る | #3721 |
| 同じ図で、2本の線が同じ所を重なって走る所が0件で、線どうしは直角にだけ交わる | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-grid-lines-cross-only-at-right-angles`が通る | #3721 |
| 名前が40字を超える図と、1つの段で5枚以上のログを発する図でも、重なりと文字の上を通る線が0件 | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-grid-long-names-and-many-logs`が通る | #3721 |
| 上と下の形で、値のパイプは槽の左か右の縁の口から横へ出て、槽の下の残高の字の上を通らない | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-pipes-leave-tanks-from-side`が通る | #3721、#3761 |
| 記法の`route`の行を読み、書いても人と箱と槽の置き場所を行を書かない図と同じにする | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-route-lines-keep-places`が通る | #3721、#3761 |
| ログの札を発した箱の札入れに入れ、上の形は箱の上の左半分に、下の形は箱の下の左半分に積み、右半分を呼び出しの札に空ける (Tracelyth #165、#166) | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-logs-stack-by-emitter`が通る | #3721、#3761 |
| 値の箱の前の値を線で消して箱の下の行に置き、確定の語を右に添え、行を槽の下の額と同じ高さに並べる | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-prev-value-under-box`が通る | #3721、#3761 |
| 入力と出力の札を始めた人の槽にだけ付け、払った槽に入力を、受け取った槽に出力を付けて、持ち主の点線の枠の中の槽より上の余白に置く | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-io-tags-in-frame-margin`が通る | #3721、#3761 |
| 呼ばれるコントラクトを全て四角の箱で描いて高さを揃え、トークンの箱も高さを揃え、どの段でも呼ばれない値の持ち主は人と同じ大きさの丸で描く | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-contracts-share-shape-and-height`が通る | #3721、#3761 |
| 薄く描く線は表の縁に沿って走らず、箱の中を通らない | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-faint-lines-avoid-boxes`が通る | #3721 |
| 値の変わった表を薄く描かない | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-changed-table-not-faded`が通る | #3721 |
| `fitWide`だけを渡した図は枠より広ければ全体を枠に収めて狭ければ原寸のまま始め、`fitNarrow`も渡した600px以上の枠では名前の字が10.5pxに、携帯の幅の枠では槽の残高の字が読める大きさになる幅で始める | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-fit-wide-keeps-readable-text`が通る | #3721、#3761 |
| 暗い色味で、薄く描く線と表の縁の背景との明るさの比が、明るい色味の同じ部品の比を下回らない | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-dark-faint-parts-stay-visible`が通る | #3721 |
| 動画とGIFに書き出した各段の絵の部品の位置が図の置き場所と同じで、重なりが0件 | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-export-frames-keep-layout`が通る | #3721 |
| 置き場所の検査`dragon check --layout`が、重なりと文字の上を通る線と高さ200px以上の空き帯を持つパイプ図を拒む | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`layout-check-refuses-pipe-breaks`が通る | #3721 |
| 人と箱の左右の順と表の左右の順は、記法に書いた順のまま | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-keeps-notation-order`が通る | #3721 |
| 呼び出しの線とパイプの色と太さは今のまま | `pnpm exec vitest run packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-keeps-line-colors-and-widths`が通る | #3721 |
| 配管の図の見本6つを日本語と英語と幅1280と390で描いた置き場所 (`layout`) の指紋と、箱2を開いた`aggregator`の指紋が、記録した指紋と同じになる | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-layout-matches-recorded-fingerprints`が通る | #3737 #3751 |
| 札の候補を格子に並べた時、置き場所を探す道具は、どの候補についても、障りの物か置いた札に隙間8pxの内まで重なるかの答えと、重なる面積の和を、障りの物を全部見る定義と同じ値で返す。障りの物の寸法が数でない時、格子の64升を超える大きな物、置いた札を含む場面を種から作って確かめる | `pnpm exec vitest run packages/dragon/test/pipe-spot.test.ts`の検査`pipe-spot-grid-matches-definition`が通る | #3737 |
| 置き場所を探す道具は、札から一番近い道の点とその隔たりを、全部の点を順に見る定義と同じ点と値で返し、同じ隔たりの点が2つ在る時は先の点を返す。札から56px以内に点が在る時の一番近い隔たりも、定義と同じ値で返す | `pnpm exec vitest run packages/dragon/test/pipe-spot.test.ts`の検査`pipe-spot-nearest-matches-definition`が通る | #3737 |
| 置き場所を探す道具は、障りの物か置いた札から隙間8pxの内に入る候補を空いた候補として返さない。隙間がちょうど8pxの候補は空いた候補として返し、寸法が数でない障りの物は候補をふさがない | `pnpm exec vitest run packages/dragon/test/pipe-spot.test.ts`の検査`pipe-spot-refuses-spots-within-gap`が通る | #3737 |
| 箱2を開いた`aggregator.json`を描く時、札の候補から道までの隔たりを測る回数が、直す前の37万回の10分の1 (3万7千回) より少ない | `pnpm exec vitest run packages/dragon/test/pipe-spot.test.ts`の検査`pipe-open-aggregator-measures-fewer-spots`が通る | #3737 |
| 配管の図の見本を言語と枠の幅ごとに描いた時、決まりの表への違反が0件のままである | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-rules-zero-violations-in-every-example`が通る | #3737 #3751 |
| 収めた並べ方を渡し、並べ方の覚えが無い状態 (新しいprocess) で箱2を開いた`aggregator.json`を1回目に描く時、`Router.route`を1回も呼ばずに描ける | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout.test.ts`の検査`stored-layout-draws-without-route`が通る | #3748 |
| 配管の原本58個を、書いたままの形と、`layout`の行を書かない形と、行を6つの形 (`PIPE_LAYOUTS`) に替えた形の528形 (最初に見える形と、箱を1つだけ開いた形) で描いた時、収めた並べ方を渡して描いた並べ方 (管の道と札の場所) と描いたSVGが、渡さずに描いた時と同じになる | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout.test.ts`の検査`stored-layout-matches-composed`が通る | #3748 |
| 並べ方を収めた後に原本を変えた時、変える前の並べ方を使うことを拒み、その場で組んだ並べ方で描く | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout.test.ts`の検査`stored-layout-ignored-after-source-change`が通る | #3748 |
| 描く言葉 (`lang`か渡した語) が収めた時と違う時、収めた並べ方を使うことを拒む | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout.test.ts`の検査`stored-layout-ignored-for-other-words`が通る | #3748 |
| codeの指紋が描くcodeと違う並べ方 (別の`packages/dragon/src`から作った物) を使うことを拒む | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout.test.ts`の検査`stored-layout-ignored-for-other-code`が通る | #3748 |
| codeの指紋は`packages/dragon/src`の全てのfileから作り、どれか1つのfileを変えると指紋が変わる | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout.test.ts`の検査`src-fingerprint-covers-every-src-file`が通る | #3748 |
| 畳んだ箱をN個持つ配管の図を書き出す時、最初に見える形と、箱を1つだけ開いた形のN+1通りの並べ方を、書き出したHTMLに指紋つきで収める | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout.test.ts`の検査`export-stores-pipe-layouts`が通る | #3748 |
| 畳んだ箱を2つ以上持つ図を書き出す時、2つ以上の箱を開いた組の並べ方を書き出したHTMLに収めることを拒む | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout.test.ts`の検査`export-skips-multi-open-layouts`が通る | #3748 |
| 書き出したHTMLの頁で配管の図を最初に描く時と、畳んだ箱を1つ押して開いた時に、`Router.route`を1回も呼ばずに描ける | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout-page.test.ts`の検査`exported-page-draws-pipe-without-route`が通る | #3748 |
| `dragon embed`が、頁の配管の図の記法の塊ごとに、最初に見える形と、箱を1つだけ開いた形の並べ方を、埋めた頁に指紋つきで収める | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout-page.test.ts`の検査`embed-stores-pipe-layouts`が通る | #3748 |
| 埋めた頁を開いた時、配管の図の記法の塊を`Router.route`を1回も呼ばずに描ける | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout-page.test.ts`の検査`embedded-page-draws-pipe-without-route`が通る | #3748 |
| 並べ方を収めていない頁 (jsDelivrの入口で手で書いた記法の頁) では、配管の図の記法の塊を今どおり頁で並べ方を組んで描ける | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout-page.test.ts`の検査`page-blocks-compose-pipe-without-stored-layouts`が通る | #3748 |
| 見本帳のbuildが見本帳の頁の描く配管の図の並べ方を収め、`LiveFigure`がその図を`Router.route`を1回も呼ばずに描ける | `pnpm exec vitest run apps/playground-spa/src/lib/pipe-layouts.test.ts`の検査`site-draws-pipe-with-stored-layouts`が通る | #3748 |
| 時系列図だけを描く頁で、scriptの1行の入口が最初に読むscriptのgzip後の合計が、上限90,000バイトに収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3748 |
| 見本帳が最初に読むscriptとCSSのgzip後の合計が、今の上限に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3748 |
| 札を置く隙間を作るために図の座標をずらす道具は、ずらす相手を1回目に並べた後も、図の全てを辿ってずらす定義と同じ値へずらし、返した関数で元の値へ戻す。同じ物を2か所から指す図、数の2つ組、座標と大きさの欄、外から渡した札の枠、関数で決める切れ目を含む図を種から作り、縦と横に続けてずらして確かめる | `pnpm exec vitest run packages/dragon/test/pipe-shift.test.ts`の検査`pipe-shift-matches-definition`が通る | #3751 |
| 図の座標をずらす道具は、切れ目より手前 (上か左) の物の座標を動かさず、数でない欄と、ずらす軸でない欄 (縦にずらす時の`x`と`w`) を書き換えず、2か所から指す同じ物を2度ずらさない | `pnpm exec vitest run packages/dragon/test/pipe-shift.test.ts`の検査`pipe-shift-keeps-what-it-must-not-move`が通る | #3751 |
| 箱2を開いた`aggregator.json`を描く時、置き場の決まらなかった札を探し直す2つ目の札探しで、札の候補から道までの隔たりを測る回数が、直す前の3万414回の10分の1 (3千回) より少ない | `pnpm exec vitest run packages/dragon/test/pipe-spot.test.ts`の検査`pipe-open-aggregator-skips-far-spots`が通る | #3751 |
| 箱2を開いた`aggregator.json`を描く時、札を置ける所を探す1つ目の札探しで道までの隔たりを測る回数が、3万7千回より少ないままである | `pnpm exec vitest run packages/dragon/test/pipe-spot.test.ts`の検査`pipe-open-aggregator-measures-fewer-spots`が通る | #3751 |
| 収めた並べ方を渡して描いた配管の図の並べ方とSVGが、渡さずに描いた時と同じままである | `pnpm exec vitest run packages/dragon/test/pipe-stored-layout.test.ts`の検査`stored-layout-draws-without-route`が通る | #3751 |
| 箱を開いた`aggregator`を携帯の幅に置いた時、字が読める大きさのままである | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-pipe-narrow-keeps-text-readable`が通る | #3751 |
| 見本帳の頁が最初に読むscriptとCSSが、gzipで184KB以下のままである | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3751 |
| `layout top`と`layout bottom`の図を描いた時、値の管は槽の左か右の縁の口から出入りし、口から横へ真っすぐ出る | `pnpm exec vitest run --reporter=verbose packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-pipes-leave-tanks-from-side`が通る | #3761 |
| `route`の行を書いた図を描いた時、人と箱と槽を行を書かない図と同じ所に置く | `pnpm exec vitest run --reporter=verbose packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-route-lines-keep-places`が通る | #3761 |
| ログの札を発した箱の札入れに積み、札から箱へ点線を引かない | `pnpm exec vitest run --reporter=verbose packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-logs-stack-by-emitter`が通る | #3761 |
| 入力と出力の札を、始めた人の槽の持ち主の点線の枠の中の、槽より上の余白に置く | `pnpm exec vitest run --reporter=verbose packages/dragon/test/pipe-layout-quality.test.ts`の検査`pipe-io-tags-in-frame-margin`が通る | #3761 |
| 書き込んだ値を、箱の行で前の値から次の値へ数えて見せる | `pnpm exec vitest run --reporter=verbose packages/dragon/test/pipe-diagram-r6.test.ts`の検査`pipe-r6-token-box-holds-values`が通る | #3761 |
| 移した額を、払った人と受け取った人の両方の槽で前の量から次の量へ数えて見せる | `pnpm exec vitest run --reporter=verbose packages/dragon/test/pipe-diagram.test.ts`の検査`pipe-move-shifts-tank-levels`が通る | #3761 |
| 書き込みの線を札で描き、`dragon.checkLayoutText`が崩れを返さない | `pnpm exec vitest run --reporter=verbose packages/dragon/test/pipe-port.test.ts`の検査`port-write-links-clear-of-chips`が通る | #3761 |
| 全ての見本で、呼び出しの管が1本の値の管を2回以上越える道を採らない | `pnpm exec vitest run --reporter=verbose packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-pipes-join-side-ports-and-cross-under`が通る | #3761 |
| 全ての見本と言葉と枠の幅で、決まりの表への違反を出さない | `pnpm exec vitest run --reporter=verbose packages/dragon/test/pipe-diagram-rules.test.ts`の検査`pipe-rules-zero-violations-in-every-example`が通る | #3761 |
| 見本に、崩れの一覧に無い崩れを出さない | `pnpm exec vitest run --reporter=verbose packages/dragon/test/layout-check.test.ts`の検査`layout-check-examples-match-recorded`が通る | #3761 |
| 戻り値の札が管に収まらない時は、2人の間を広げて札を収める | `pnpm exec vitest run --reporter=verbose packages/dragon/test/pipe-chip-room.test.ts`の検査`pipe-widens-for-long-return-chip`が通る | #3761 |
| scriptの1行の入口が最初に読む量が上限を超えない | `pnpm exec vitest run --reporter=verbose packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3761 |
| Tracelythのカタログの14枚の網型の図で、槽と槽を繋ぐ値の管の口は、どれも槽の左か右の側面に在り、管の縁が丸めた角に掛からない | `pnpm exec vitest run packages/dragon/test/pipe-side-port.test.ts`の検査`pipe-side-port-on-flat-side`が通る | #3775 |
| 間の人が槽を持たない2つの槽 (発行の図のBobとゼロのアドレス) は、側面どうしを1本の真っすぐな管で繋ぐ | `pnpm exec vitest run packages/dragon/test/pipe-side-port.test.ts`の検査`pipe-side-port-straight-over-empty-column`が通る | #3775 |
| 槽の下を回る管は、どの槽にも槽の下の残高の文字にも重ならない | `pnpm exec vitest run packages/dragon/test/pipe-side-port.test.ts`の検査`pipe-side-port-under-clears-tanks-and-text`が通る | #3775 |
| 隣り合う槽 (送金の図のAliceとBob) は、今どおり側面の真ん中の口どうしを真っすぐ繋ぐ | `pnpm exec vitest run packages/dragon/test/pipe-side-port.test.ts`の検査`pipe-side-port-adjacent-unchanged`が通る | #3775 |
| パイプ図の値の管の折れ線は、どの角も図のほかの線と同じ共通の半径12px (隣の辺の半分より短い時はその半分) の弧で曲がり、直角の角を持たない | `pnpm exec vitest run packages/dragon/test/pipe-top-look.test.ts --reporter=verbose`の検査`pipe-value-corners-round`が通る | #3783 |
| 値の管の壁は墨の色 (`--ink`) の14pxの線で、空洞は11pxの線なので、管の縁が1.5pxの細い墨の線になる | `pnpm exec vitest run packages/dragon/test/pipe-top-look.test.ts --reporter=verbose`の検査`pipe-value-tube-ink-edge`が通る | #3783 |
| 槽の名前の字は槽のガラスの上端より上に在り、名札の字と値の管と入力と出力の印に重ならず、名前に重なる名札からの点線を描かない | `pnpm exec vitest run packages/dragon/test/pipe-top-look.test.ts --reporter=verbose`の検査`pipe-tank-name-above-glass`が通る | #3783 |
| 槽の液に上端を波の形に切り抜くマスクがかかって横へ流れ、動きを減らす設定の時は流れない | `pnpm exec vitest run packages/dragon/test/pipe-top-look.test.ts --reporter=verbose`の検査`pipe-tank-liquid-waves`が通る | #3783 |
| 呼び出しの管の折れ線も、値の管と同じ共通の半径12pxの弧で曲がり、直角の角を持たない | `pnpm exec vitest run packages/dragon/test/pipe-top-look.test.ts --reporter=verbose`の検査`pipe-call-corners-round`が通る | #3783 |
| 隣り合わない槽を繋ぐ管の両端は、槽の角の丸みを除いた平らな辺の上に在る | `pnpm exec vitest run packages/dragon/test/pipe-side-port.test.ts --reporter=verbose`の検査`pipe-side-port-on-flat-side`が通る | #3783 |
| 槽の下を回る管は、槽と残高の字を横切らない | `pnpm exec vitest run packages/dragon/test/pipe-side-port.test.ts --reporter=verbose`の検査`pipe-side-port-under-clears-tanks-and-text`が通る | #3783 |
| 角を落とす色味 (arcade) では、管を含む全ての線の45度以上の折れ目を直角で描く | `pnpm exec vitest run packages/dragon/test/arcade-bends.test.ts --reporter=verbose`の検査`arcade-draws-square-line-bends`が通る | #3783 |
| 外の上に置いた槽の名前の字の箱とガラスの間は、部品どうしの間の下限8px以上空く | `pnpm exec vitest run packages/dragon/test/pipe-diagram-rules.test.ts --reporter=verbose`の検査`pipe-rules-zero-violations-in-every-example`が通る | #3783 |
| 網型で箱の幅の外に居る人の呼び出しの管は、箱の近い方の横の縁の上下の真ん中に入り、1回だけ折れる | `pnpm exec vitest run packages/dragon/test/pipe-mesh-call-port.test.ts --reporter=verbose`の検査`pipe-mesh-call-side-middle`が通る | #3813 |
| 網型で箱の真下に居る人の呼び出しの管は、箱の下の縁へまっすぐ入り、折れない | `pnpm exec vitest run packages/dragon/test/pipe-mesh-call-port.test.ts --reporter=verbose`の検査`pipe-mesh-call-straight-below`が通る | #3813 |
| 同じ横へ入る2本の管は交わらず、上下の真ん中を挟んで同じ離れで並び、遠い人の管が上に入る | `pnpm exec vitest run packages/dragon/test/pipe-mesh-call-port.test.ts --reporter=verbose`の検査`pipe-mesh-call-side-pair`が通る | #3813 |
| 箱の下で折る管が無い網型の図は、箱の下の縁と人の丸の上の縁の間に折る段 (34px) を空けない | `pnpm exec vitest run packages/dragon/test/pipe-mesh-call-port.test.ts --reporter=verbose`の検査`pipe-mesh-box-no-turn-band`が通る | #3813 |
| Tracelythのトップページの図2枚とカタログの網型の図14枚に、部品の重なりと字の上を通る線と空き帯が出ない | `pnpm exec vitest run packages/dragon/test/pipe-mesh-call-port.test.ts --reporter=verbose`の検査`pipe-mesh-call-no-breaks`が通る | #3813 |
| 槽と槽を繋ぐ値の管の口は、槽の側面の平らな所に在る | `pnpm exec vitest run packages/dragon/test/pipe-side-port.test.ts --reporter=verbose`の検査`pipe-side-port-on-flat-side`が通る | #3813 |
