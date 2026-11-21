# 検査の方針

課題ごとの実装のstepの関門は、テストを書くstepが記録した命令 (受入条件が名指した検査) だけを回し、欄`届く検査`は`無し`にする (本人が2026-11-21に外すと決めた、#3813)。
管の図の中心のfileを変えると届く検査が全ての検査に近い数になり、1回5分の上限の中で回り切らずに関門が止まるため。
変えた所に関係する検査を広く回したい時は、手で`pnpm build:packages && pnpm typecheck && pnpm test:related`を打つ。
検査はbuildした`dist`を読み、`pnpm test:related`はbuildしないので、buildを先に回す。

`package.json`の`scripts`だけを変えた時は、`pnpm test:related`は全ての検査を選ばず、その`package.json`を字で書き同じfileで`scripts`の欄を読む検査だけを選ぶ (#3733)。
`scripts`は依存も型も検査の設定も変えないので、全ての検査を選ぶと、混んだ機械で1件10秒の上限を超える検査を待つだけになる。
別の会話の負荷が高い時は検査1件の秒数が5倍から11倍に延び、workerの数を変えても1件の秒数は縮まない (#3733)。
負荷で延びる時間切れは、上限を上げずに、1件の検査がする仕事を減らす形で防ぐ (全ての見本を描く検査を見本ごとの件に分ける、描く前に種類で絞る、1度読んだ物を使い回す)。

`pnpm test:related`が起こすvitestは検査のfileの型を見ないため、手で関係する検査を回す時は型の検査も回す (#3730)。
型の検査も検査のfileが読む`dist`の型の定義を読むので、buildの後に回し、関係する検査より短いのでその前に回す。

一式はbuild、型検査、lint、全ての検査を順に回し、検査は名前を 1 行ずつ出す。
型検査はbuildした`dist`の型の定義を読み、`dist`の無い作業場所では`TS2307`で落ちるので、buildの後に回す (#3732)。
一式は版を出す前に配る前の関門が1回だけ回す (#3381)。
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
| 一式 | `bash -c 'pnpm build && pnpm typecheck && pnpm lint && pnpm exec vitest run packages/ --reporter=verbose && pnpm exec vitest run apps/ --reporter=verbose && bash scripts/check-dependency-vulnerabilities.sh'` |
| 通った行の形 | `^\s*✓\s+\S+\s+>\s+(?:.*\s+>\s+)?(.+?)\s+\d+ms$` |
| 落ちた行の形 | `^\s*×\s+\S+\s+>\s+(?:.*\s+>\s+)?(.+?)\s+\d+ms$` |
| 一式の重さ | 軽い |
| 届く検査 | 無し (本人が2026-11-21に外すと決めた。課題ごとの関門は記録したテスト命令だけを回す) |
| 配る前のテスト | `bash -c 'pnpm build && pnpm typecheck && pnpm lint && pnpm exec vitest run packages/dragon/test/pipe-mesh-call-port.test.ts packages/dragon/test/pipe-side-port.test.ts packages/dragon/test/pipe-port.test.ts packages/dragon/test/pipe-top-look.test.ts packages/dragon/test/examples-svg.test.ts packages/dragon/test/release-records.test.ts packages/dragon/test/script-entry.test.ts packages/dragon/test/notation-skill.test.ts --reporter=verbose'` (0.79.3に限り、本人が2026-11-21に変えた所の検査に絞ると決めた。取り込む前に元の命令へ戻す、#3814) |
| 配る前の動作 | `bash -c 'pnpm build:packages && pnpm --filter @cardenelabs/dragon check:pack'` |
| 配る前のセキュリティ | `node scripts/release-checks.mjs security` |
| 配る先との整合 | `node scripts/release-checks.mjs target` |
| 壊す変更 | 無し (DBもterraformもコントラクトも持たない。0.xの版は書き出しを変える版も意図して出し、変えた点をCHANGELOG.mdに書く) |
| stagingの確かめ | 無し (stagingもプレビューの配信も持たない。手元で包んで入れる確かめは配る前の動作が持つ) |
| 戻す確かめ | `node scripts/release-checks.mjs rollback` |
| 配った後の確かめ | `node scripts/release-checks.mjs after` |
