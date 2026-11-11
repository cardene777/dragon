# dragon の置き場と命名

## 置き場

| 置き場 | 持つ物 | 根拠 |
|---|---|---|
| `packages/dragon/src` | 記法の読み書き、原本の検査、描画、再生、書き出し、命令 (`cli.ts`) と、それらを公開する入口 | `packages/dragon/src/index.ts`、`packages/dragon/package.json` の `exports` |
| `packages/dragon/src/blocks/<名前>` | ブロックの置き場。名前と並びと付け方と語と読む行の宣言 (`block.ts`、軽い入口が初めから持つ)、読む処理と書き戻す処理と誤りの文 (`read.ts`、軽い入口は書いた図が使う時に読む、#3349)、原本の形の欠片 (`shape.ts`、build の時の script と検査だけが一覧 `blocks/shapes.ts` から読む、#3348)、描き方 (`draw.ts`)、見本帳の分と部品の図 (`gallery/`。見本帳の一覧と棚と使い方の頁のブロックの段落と `docs/design/base/GRAMMAR.md` の部品と使い方の表は、この分をブロックの並びの順に並べて作る、#3350) | `packages/dragon/src/blocks/block.ts`、`packages/dragon/test/blocks.test.ts` の `block-folder-holds-whole-definition` |
| `packages/dragon/src/kinds/<種類>` | 図の種類の置き場。受け付ける付け方 (`kind.ts`) と並べ方 (`layout.ts`)。後から読む図の種類 (状態遷移図、枝分かれの図、時間軸の図、木の図、列の図、試す図、配管の図、量の図、手順の図、回り続ける図、考えを広げる地図) の `kind.ts` は並べ方を読まず、後から読む入口 (`kinds/state.ts`、`kinds/git.ts`、`kinds/time.ts`、`kinds/tree.ts`、`kinds/lineup.ts`、`kinds/try.ts`、`kinds/pipe.ts`、`kinds/chart.ts`、`kinds/flow.ts`、`kinds/cycle.ts`、`kinds/mind.ts`) が並べ方を出す。並べ方が使う処理は種類の名前を頭に付けて `packages/dragon/src` の直下に置き、配管の図は管の道を探す処理を `pipe-route.ts`、置き場所の決まりの表と違反を数える処理を `pipe-rules.ts`、弁の形を囲む四角と取っ手の向きを `pipe-valve.ts` に置く (#3418)。置き場はブロックの一覧を持たず、どのブロックを使えるかはブロックの付け方 (`attach`) と受け付ける付け方 (`accepts`) から導く (#3348) | `packages/dragon/src/kinds/kind.ts`、`packages/dragon/test/blocks.test.ts` の `later-kind-folder-keeps-layout-out-of-first-load` |
| `packages/dragon/blocks` | 共有のブロック集。使う人が足すブロックの定義を 1 定義 1 file (`<名前>.dragon`) で置き、使う見本を `examples/` に置く。build が読んで本体に埋める (#3455)。埋める前の定義と見本は `dragon check` と `dragon check --blocks` で確かめる (#3508) | `packages/dragon/tsup.config.ts`、`packages/dragon/test/shared-blocks.test.ts` |
| `plugins/dragon` | AI が dragon記法で図を書く skill を配る Claude Code のプラグイン。skill の本文は `skills/dragon/SKILL.md`、図の種類ごとの書き方は `skills/dragon/references/` に置く。置き場の一覧は repo の根の `.claude-plugin/marketplace.json` (#3455)。skill を入れた Claude を動かす評価のケースと、回した結果の記録 (`record.json`) は `evals/` に置く (#3484)。PR を出すケースは下ごしらえ (`case.yaml` と `scaffold.sh`) で、fork の代わりの写しの repo を作業場所に置く (#3508)。合う種類の無い図を描いてからIssueを立てるケース (`new-kind-issue`) は下ごしらえを持たず、偽の `gh` が写しのrepoの外で受けた引数を一時のdirに書く (#3513) | `packages/dragon/test/notation-skill.test.ts`、`packages/dragon/test/plugin-eval.test.ts` |
| `packages/dragon/test` | package と repo の仕組みの検査 | `vitest.config.ts` の `include` |
| `packages/dragon/scripts` | 入れた依存が公開物と一致するかを確かめる script | `package.json` の `verify:deps` |
| `apps/playground-spa/src` | 見本帳。経路と上の帯と編集画面のほかの画面を `src/site` に、編集画面を `Playground.tsx` に、頁と配信の仕組みの検査を `src/lib` に置く | `apps/playground-spa/src/main.tsx` |
| `apps/playground-spa/scripts` | 公開の build を GitHub Pages へ配る script | `apps/playground-spa/package.json` の `deploy:pages` |
| `docs/design` | 作り直す前の画面の設計図 (`app.pen`) と、図の種類ごとの記録 | `docs/design/README.md` |
| `test-support` | vitest の前処理 | `vitest.config.ts` の `globalSetup` |

## 命名

- 検査は、package の検査を `packages/dragon/test` に、見本帳の検査を検査する file の近くの `src` の下に `*.test.ts` か `*.test.tsx` で置く (`vitest.config.ts` の `include`)。
