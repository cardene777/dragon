# release

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `.ikkan/checks.md`が配る前の7つの欄と`配った後の確かめ`を全て持ち、どの欄にも命令か理由つきの`無し`を書く | `pnpm exec vitest run packages/dragon/test/test-policy.test.ts`の検査`release-fields-all-written`が通る | #3589 |
| `配る前のテスト`の命令は型検査とbuildとlintとpackagesとappsの`vitest`を回し、e2eとplaywrightのテストを回さない | `pnpm exec vitest run packages/dragon/test/test-policy.test.ts`の検査`release-tests-skip-e2e`が通る | #3589 |
| `配る前の動作`は包んだ物を入れて`check:pack`を回し、入れた`dragon --version`の答えが包んだ版と違う時に落とす | `pnpm exec vitest run packages/dragon/test/pack-check.test.ts`の検査`pack-check-version-must-match`が通る | #3589 |
| `check:pack`は、入れた`dragon`で見本をSVGに書き出したfileが`<svg`で始まらない時に落とす | `pnpm exec vitest run packages/dragon/test/pack-check.test.ts`の検査`pack-check-svg-must-be-svg`が通る | #3589 |
| `配る先との整合`は、包む版がnpmの版の一覧かGitHubの印に既に在る時に落とし、どちらにも無い時に通す | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts`の検査`release-target-refuses-published-version`が通る | #3589 |
| `配る前のセキュリティ`は、包む物に`.env`か`.npmrc`か鍵のfileが在る時に落とす | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts`の検査`release-security-refuses-secret-files`が通る | #3589 |
| `配る前のセキュリティ`は、依存の脆弱性の確かめか`gitleaks`が0以外で終わった時に落とす | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts`の検査`release-security-fails-on-failed-scan`が通る | #3589 |
| 前の版は、包む版より小さい`v`の印のうち最も大きい版である | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts`の検査`release-previous-version-is-highest-lower-tag`が通る | #3589 |
| `戻す確かめ`は、前の版がnpmに無い時か取り下げられている時に落とす | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts`の検査`release-rollback-needs-previous-version`が通る | #3589 |
| `配った後の確かめ`は、npmの最新の版が包んだ版と違う時と、入れた`dragon --version`が違う時と、GitHub Pagesの頁が200を返さない時に落とす | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts`の検査`release-after-judges-npm-and-pages`が通る | #3589 |
| `.claude/skills/dragon-extend/SKILL.md`が、版を出す前に確かめる物を`.ikkan/checks.md`の欄が持つと書く | `pnpm exec vitest run packages/dragon/test/extend-skill.test.ts`の検査`extend-skill-release-checks-in-checks-md`が通る | #3589 |
| `一式`の欄は今の命令のままで、最後に依存の脆弱性を1回見る | `pnpm exec vitest run packages/dragon/test/dependency-vulnerability-check.test.ts`の検査`checks-suite-ends-with-real-vuln-check`が通る | #3589 |
| READMEと使い方の頁とプラグインの文書が書くscriptの1行は、どれもpackageの今の版の真ん中の数までを指し、古い版を指す行を拒む | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts --reporter=verbose`の検査`pinned-script-lines-follow-package-version`が通る | #3711 #3715 #3728 #3747 |
| npmへ出す時の検査`prepublishOnly`は、検査の一式 (`pnpm run test`とvitest) を回さない | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts --reporter=verbose`の検査`prepublish-skips-the-whole-suite`が通る | #3717 |
| npmへ出す時の検査`prepublishOnly`は、型の検査とbuildを回し、buildの後に`check:pack`を回す | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts --reporter=verbose`の検査`prepublish-builds-and-checks-pack`が通る | #3717 |
| 管理者向けの決まり`docs/maintaining.md`の節`npmへ出す時の検査`が、npmへ出す時は型の検査とbuildと`check:pack`を回し、一式は配る前の関門が1回だけ回すと書く | `pnpm exec vitest run packages/dragon/test/release-checks.test.ts --reporter=verbose`の検査`maintaining-says-suite-runs-once-before-release`が通る | #3717 |
| READMEと使い方の頁とプラグインの文書と検査の頁が書くscriptの1行は、どれもpackageの今の版の真ん中の数までを指し、古い版を指す行を拒む | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts --reporter=verbose`の検査`pinned-script-lines-follow-package-version`が通る | #3760 #3771 |
