# layout-check

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 背景のブリッジの図をアーチの箱で描いた #3520 の前の姿に崩れの検査を掛けると、段 3 の番号の丸が`+bridge`の箱の見えている形 (アーチ) から離れて浮くことを 1 件の崩れとして出す | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-finds-badge-off-shape`が通る | #3484 |
| 背景のブリッジの図をアーチの箱で描いた #3520 の前の姿に崩れの検査を掛けると、硬貨を置く枠が`+bridge`のアーチの形からはみ出すことを 1 件の崩れとして出す | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-finds-slot-outside-shape`が通る | #3484 |
| 背景のブリッジの図をアーチの箱で描いた #3520 の前の姿に崩れの検査を掛けると、段 3 の箱の下の字「100 USDC を預かり中」が`+bridge`のアーチの形の外 (アーチの底の線より下) へはみ出すことを 1 件の崩れとして出す | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-finds-text-outside-shape`が通る | #3484 |
| 背景の決済の図に`dragon check --layout`を打つと、段 2 と段 3 の番号の丸の間が近すぎることを 1 件の知らせとして出す | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-finds-close-badges`が通る | #3484 |
| 背景の決済の図に`dragon check --layout`を打つと、段 2 の線 (APIサーバーから価格オラクル) と段 3 の線 (価格オラクルからAPIサーバー) が並んで近すぎることを 1 件の知らせとして出す | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-finds-crowded-lines`が通る | #3484 |
| 崩れの知らせの 1 行は、段の番号と、崩れの種類と、関わる 2 つの物の名前 (番号の丸は段の番号、箱は箱の名前、硬貨の枠、線は両端の箱の名前、字は字そのもの) を持つ | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-line-names-step-and-parts`が通る | #3484 |
| `dragon check --layout --json`は、崩れを段の番号と種類と 2 つの物を持つ JSON で出す | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-prints-json`が通る | #3484 |
| 同じ崩れが続く段にわたって見える時は、最初に見える段の番号で 1 件にまとめる | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-merges-repeated-steps`が通る | #3484 |
| 全部の段を既定の幅と幅 390 の両方で描いて確かめ、幅 390 でだけ出る崩れは知らせの行に幅を書く | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-names-narrow-width`が通る | #3484 |
| 線とその両端の箱、グループとその中の箱、自分の箱の角に付いた番号の丸、線の始まりの番号の丸とその線を出す箱の縁 (背景の決済の図の段 3 の丸と六角形の上の辺の 1px の間も含む) は、崩れに数えない | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-skips-intended-overlaps`が通る | #3484 |
| `packages/dragon/examples/`と`packages/dragon/blocks/examples/`の全ての`.dragon`の崩れを数えた一覧が repo に在り、見本の検査は一覧に無い崩れが 1 件でも出ると落ち、一覧の崩れだけなら通る | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-examples-match-recorded`が通る | #3484 |
| `dragon export <図> --format png --step <N>`は、段 N の止め絵の PNG を書き出す | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`export-png-at-step`が通る | #3484 |
| `plugins/dragon/skills/dragon/SKILL.md`の手順が、図を書いた後に`dragon check --layout`を打ち、記法で直せる崩れを直してから、残った崩れを段の番号と物の名前で伝え、崩れた段の PNG を添える (Chromium が無い時は文だけ) ことを求める | `pnpm exec vitest run packages/dragon/test/notation-skill.test.ts`の検査`skill-names-layout-check-loop`が通る | #3484 |
| skill の参照が、記法で崩れを直す手 (箱の並びを変える、行きと帰りの線を分ける、名前を短くする) と、描き方の側でしか直せない崩れを dragon の repo へ課題として送る手順への案内を持つ | `pnpm exec vitest run packages/dragon/test/notation-skill.test.ts`の検査`skill-layout-fixes-and-issue-route`が通る | #3484 |
| skill を入れた Claude に背景の 2 つの図と同じ依頼を`claude plugin eval plugins/dragon`で出すと、返答が残った崩れを段の番号を名指して書くか、`dragon check --layout`の崩れが 0 件の図を保存する。回した結果は評価のケースの指紋と一緒に repo に残し、ケースを書き換えると記録が古いと分かる | `pnpm exec vitest run packages/dragon/test/plugin-eval.test.ts`の検査`layout-bridge`と`layout-payment`が通る | #3484 |
| 常に、`dragon check`を`--layout`無しで打つと図を描かず、今と同じ行と終わり方を返す | `pnpm exec vitest run packages/dragon/test/cli-check.test.ts`の検査`check-reports-error-at-line-and-column`と`check-prints-json`と`check-warns-similar-names-and-passes`が通る | #3484 |
| 常に、書き出しの命令が出す字の重なりの知らせは今と同じ文で出る | `pnpm exec vitest run packages/dragon/test/overlap-cli.test.ts packages/dragon/test/overlap-notice.test.ts`が終わり方 0 | #3484 |
| 見本帳を組み立てた時、最初に読む script に崩れの種類の名前`badges-close`、`lines-close`、`badge-off-shape`、`slot-outside-shape`、`text-outside-shape`が 1 つも入らない | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`first-load-carries-no-layout-check`が通る | #3494 |
| 見本帳が最初に読む script と CSS の合計が、gzip で上限の 182KB 以下に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3494 |
| `dragon check --layout`が、番号の丸と硬貨の枠と字の形からのはみ出しと、近すぎる番号の丸と線を今どおり見つけ、見本の崩れが記録と合う | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-finds-badge-off-shape`と`layout-check-finds-slot-outside-shape`と`layout-check-finds-text-outside-shape`と`layout-check-finds-close-badges`と`layout-check-finds-crowded-lines`と`layout-check-examples-match-recorded`が通る | #3494 |
