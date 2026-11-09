# 検査の方針

照合の段 (step 12) は下の表の一式を回す (#3025)。
一式は型検査、build、lint、全ての検査を順に回し、検査は名前を 1 行ずつ出す。
課題ごとには変えた所に関係する検査だけを `pnpm test:related` で回し、一式は版を出す前に 1 回だけ回す (#3381)。
一式は 1 件 10 秒、1 回の実行 5 分の上限の中で終わるので、重さを `軽い` と書く。
検査は package の検査 (`packages/`) と見本帳の検査 (`apps/`) の 2 回の実行に分けて回す。1 回で回すと、機械が混んだ時に 5 分の上限を超えて残りを回さずに止まるため (#3463)。
一式の最後に、依存の脆弱性を本物の `osv-scanner` で 1 回だけ見る (`bash scripts/check-dependency-vulnerabilities.sh`、#3498)。外の脆弱性の一覧に問い合わせ、応答が遅いと 1 回 15 秒を超えるので、1 件 10 秒の上限がある検査の外で走らせる。検査の中では代わりの道具で命令の判定だけを見る。外の一覧が止まっている時は終了 2 で止まる。

版を出す前は、ikkan の配る前の関門 (`deployable.sh --since v<前の版>`) が下の表の配る前の 7 つの欄を回し、落ちた欄を全て名指す (#3589)。
`配る前のテスト` は一式から依存の脆弱性の確かめを外した命令で、e2e は回さない。依存の脆弱性は `配る前のセキュリティ` が見る。
`配る前の動作` は包んだ物を空のフォルダへ入れ、`dragon --version` と見本の書き出しをブラウザ無しで確かめる (`check:pack`)。
配る先との整合、セキュリティ、戻す確かめ、配った後の確かめの命令は `scripts/release-checks.mjs` が持つ。
npm へ出して見本帳を配った後は、配った後の関門 (`deployed.sh`) が `配った後の確かめ` を回す。

検査の名前は、行の最後の ` > ` から時間の前までを読む。
空白を含む名前も全体で読み、受入条件は二重引用符で囲んで名指す (#3254)。

| 欄 | 中身 |
|---|---|
| 一式 | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run packages/ --reporter=verbose && pnpm exec vitest run apps/ --reporter=verbose && bash scripts/check-dependency-vulnerabilities.sh'` |
| 通った行の形 | `^\s*✓\s+\S+\s+>\s+(?:.*\s+>\s+)?(.+?)\s+\d+ms$` |
| 落ちた行の形 | `^\s*×\s+\S+\s+>\s+(?:.*\s+>\s+)?(.+?)\s+\d+ms$` |
| 一式の重さ | 軽い |
| 配る前のテスト | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run packages/ --reporter=verbose && pnpm exec vitest run apps/ --reporter=verbose'` |
| 配る前の動作 | `bash -c 'pnpm build:packages && pnpm --filter @cardenelabs/dragon check:pack'` |
| 配る前のセキュリティ | `node scripts/release-checks.mjs security` |
| 配る先との整合 | `node scripts/release-checks.mjs target` |
| 壊す変更 | 無し (DBもterraformもコントラクトも持たない。0.xの版は書き出しを変える版も意図して出し、変えた点をCHANGELOG.mdに書く) |
| stagingの確かめ | 無し (stagingもプレビューの配信も持たない。手元で包んで入れる確かめは配る前の動作が持つ) |
| 戻す確かめ | `node scripts/release-checks.mjs rollback` |
| 配った後の確かめ | `node scripts/release-checks.mjs after` |
