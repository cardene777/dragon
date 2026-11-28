# player-bar

| Criterion | How to check | Origin |
|---|---|---|
| やり直しと前と次と再生の釦と、配管の図の拡大と縮小の釦は、絵柄の要素を1つずつ持ち、釦の字に`↺`、`‹`、`›`、`❚❚`、`▶`、`−`、`+`の字を持たない。再生の釦は絵柄の右に`止める`か`流す`の名前を持つ | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-buttons-carry-icons`が通る | #3752 |
| 再生の部品は、図の枠の外に`svg`の要素を置くことを拒み、部品の中の`svg`の要素は図の1つだけになる | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-bar-keeps-svg-to-figure`が通る | #3752 |
| 幅760pxと480pxの帯つきの図と帯の無い図で、釦の絵柄の枠が縦横18pxになり、釦を撮った画像の絵柄の画素の外接矩形の真ん中が、釦の真ん中から縦にも横にも1px以内に在る。再生の釦は絵柄と名前を合わせた外接矩形で測る | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`player-icons-centered-in-buttons`が通る | #3752 |
| 幅760pxの帯つきの図と帯の無い図で、説明文が2行の段の時、釦の段の縦の真ん中が、段の番号と題と説明文の塊の縦の真ん中から1px以内に在る | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`player-buttons-center-on-caption`が通る | #3752 |
| 段2で止めた図の進み具合は、高さ6pxの帯で、段1の帯を呼び出しの色で塗り切り、段2の帯を95%以上塗り、段3から後の帯を塗らない | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`player-progress-fills-done-and-now`が通る | #3752 |
| 流している図の進み具合は、今の段の帯を0より多く1より少ない割合で塗り、400ms後に測った割合が前に測った割合より大きい | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`player-progress-now-grows-while-playing`が通る | #3752 |
| 段を持つ全ての図の再生の操作は、やり直しの釦、名前の付いた再生の釦、段ごとに分けた進み具合の帯を持ち、帯を済んだ段と今の段とまだの段に分ける | `pnpm exec vitest run packages/dragon/test/player.test.ts`の検査`player-r6-controls`が通る | #3752 |
| 帯つきの図の再生の帯は、段の番号の左の端と次の段の釦の右の端を`.stage`の左右の縁から16px離し、段ごとの進み具合の下の端を`.stage`の下の縁から12px離す | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`frame-bar-keeps-room-from-edges`が通る | #3752 |
| 帯の無い図の再生の帯は、自分で左右と下の余白を付けることを拒み、置いた頁の余白に任せる | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`plain-bar-leaves-room-to-page`が通る | #3752 |
| 帯の段のボタンの絵柄は、今どおり1.6pxの線で描き、塗らない | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`frame-icons-keep-their-lines`が通る | #3752 |
| scriptの1行の入口が最初に読むscriptのgzip後の合計が90,000バイト以下に収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3752 |
| 頁がボタンのCSSを持つ時、帯の無い図 (`mountDiagram`) の再生の帯の4つのボタンの計算値と寸法は、頁のCSSが無い時と同じで、頁の指定が入らない | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`plain-bar-buttons-ignore-page-button-css`が通る | #3799 |
| 同じ頁で、帯の無い図の再生の帯 (`.dg-bar`) の高さは、頁のCSSが無い時と同じになる | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`plain-bar-height-ignores-page-button-css`が通る | #3799 |
| 頁がボタンのCSSを持つ時、帯の無い配管の図の拡大と縮小のボタンの計算値と寸法は、頁のCSSが無い時と同じになる | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`plain-zoom-buttons-ignore-page-button-css`が通る | #3799 |
| 頁がボタンのCSSを持つ時、帯の無い場面の図 (`[scenes: pick]`) の帯のボタンと場面を選ぶ札の計算値と寸法は、頁のCSSが無い時と同じになる | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`plain-scene-buttons-ignore-page-button-css`が通る | #3799 |
| 頁がボタンのCSSを持つ時、帯の無い図の開いた箱の札を閉じるボタンの計算値と寸法は、頁のCSSが無い時と同じになる | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`plain-note-close-ignores-page-button-css`が通る | #3799 |
| 頁のCSSが無い時、帯の無い図の再生の帯のボタンの高さは`LOOK.player.button`の値で、やり直しと前と次のボタンの幅も同じ値のまま描かれる | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`plain-bar-buttons-keep-bare-size`が通る | #3799 |
| 帯つきの図の再生の部品の見た目は、帯の内側に届く | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`frame-player-styled-inside-frame`が通る | #3799 |
| 再生の帯の釦の絵柄は、釦の真ん中に在る | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`player-icons-centered-in-buttons`が通る | #3799 |
| 帯の頭のボタンは、頁の`button`の指定の影と最小の幅と大文字を受けない | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`figure-header-ignores-page-css`が通る | #3799 |
| 幅760pxと480pxの帯つきの図と帯の無い図で、再生の帯の「次へ」のボタンの絵は、右を向いた塗った三角と、その右に立てた縦の棒 (段送りの印) で描き、「前へ」は左を向いた塗った三角と、その左の縦の棒で描く | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts` check `player-step-icons-skip-mark` passes | #4074 |
| 同じ図で、「前へ」と「次へ」のボタンの絵を、縁の線を45度回した線だけのV字で描かない | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts` check `player-step-icons-not-open-v` passes | #4074 |
| 釦の絵柄の枠は縦横18pxのままで、釦を撮った画像の絵柄の真ん中は、釦の真ん中から縦にも横にも1px以内に在る | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts` check `player-icons-centered-in-buttons` passes | #4074 |
| やり直しと前と次と再生の釦は、今と同じく絵柄の要素を1つずつ持ち、釦の字に`‹`や`›`の字を持たない | `pnpm exec vitest run packages/dragon/test/player.test.ts` check `player-buttons-carry-icons` passes | #4074 |
| 見た目の決まり (`docs/design/base/GRAMMAR.md`) の置き方の節の向きの印の行が、再生の帯の前へと次へのボタンも決まりに入り、塗った三角と縦の棒の段送りの印で描くことを書き、`CHANGELOG.md`と`CHANGELOG.ja.md`のUnreleasedがボタンの絵の変更を書く | `pnpm exec vitest run packages/dragon/test/look.test.ts` check `player-step-icons-docs` passes | #4074 |
| 向きの印の行は、今と同じく線に付かない細い`>`を向きの印に使わないこと、塗った三角、並びで順が読める所に印を置かないことを書く | `pnpm exec vitest run packages/dragon/test/look.test.ts` check `direction-marks-docs` passes | #4074 |
| 英語の変更の一覧は、日本語の文を持たない | `pnpm exec vitest run packages/dragon/test/release-records.test.ts` check `changelog-english-has-no-japanese-prose` passes | #4074 |
| 最初に読むscriptのgzip後の合計が、上限の90,000 byteに収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts` check `script-entry-within-budget` passes | #4074 |
| 見本帳とエディタの頁が最初に読む量は、上限の中に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts` check `page-bundle-within-budget` passes | #4074 |
