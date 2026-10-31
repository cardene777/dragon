# dependencies

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 依存の脆弱性を見る命令 (`scripts/check-dependency-vulnerabilities.sh`) をこの repo で走らせた時、`fast-uri`、`undici`、`zod` の検出を出さず、検出なしで終了 0 で終わる | `pnpm test`の検査`この repo では検出なしで 0 で終わる`が通る | #3072 |
| 依存の脆弱性を見る命令 (`scripts/check-dependency-vulnerabilities.sh`) をこの repo で走らせた時、`minimatch` の GHSA-g3hv-75wg-m249 の検出を出さず、検出なしで終了 0 で終わる | `pnpm exec vitest run packages/dragon/test/dependency-vulnerability-check.test.ts`の検査`"この repo では検出なしで 0 で終わる"`が通る | #3251 |
| 受容の記録 (`osv-scanner.toml`) のどの記録も、理由と今日より後の再確認の期限と、lockfile に実在する `名前@版` の名指しを持つ | `pnpm exec vitest run packages/dragon/test/dependency-vulnerability-check.test.ts`の検査`"どの記録も守るべき形を持つ"`が通る | #3072 #3251 |
| 依存の脆弱性を見る命令をこの repo で走らせた時、受容の記録に、今の依存に当たらない使われない記録が無い | `pnpm exec vitest run packages/dragon/test/dependency-vulnerability-check.test.ts`の検査`"使われない受容記録が無い"`が通る | #3072 #3251 |
| 受容の記録に載せていない脆弱性を持つ束ねを見せると、依存の脆弱性を見る命令が終了 1 で終わる | `pnpm exec vitest run packages/dragon/test/dependency-vulnerability-check.test.ts`の検査`"脆弱な束ねでは 1 で終わる"`が通る | #3072 #3251 |
| 見る場所が無い時、依存の脆弱性を見る命令が検出ありの 1 と別の終了 2 で終わる | `pnpm test`の検査`見る場所が無い時は検出ありと別の状態で終わる`が通る | #3072 |
| 受容の記録の読み手が、本物の `osv-scanner.toml` の記録を見出しの数だけ読める | `pnpm exec vitest run packages/dragon/test/dependency-vulnerability-check.test.ts`の検査`"本物の file の記録を見出しの数だけ読める"`が通る | #3072 #3251 |
