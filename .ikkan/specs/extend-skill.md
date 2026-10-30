# extend-skill

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `.claude/skills/dragon-extend/SKILL.md` が在り、先頭の決まりの欄 (frontmatter) に名前 `dragon-extend` と、起動の言葉を含む説明を持つ | `pnpm exec vitest run packages/dragon/test/extend-skill.test.ts`の検査`extend-skill-has-frontmatter`が通る | #3245 |
| SKILL.md が、判定の段、見本で選ぶ段、ikkan の線で足す段、取り込んだ後に版を聞く段の 4 つの見出しを持つ | `pnpm exec vitest run packages/dragon/test/extend-skill.test.ts`の検査`extend-skill-walks-the-line`が通る | #3245 |
| SKILL.md が step 2 で決めた決まりを全て持つ。部品を種類より先に考えること、今の語で言えない時だけ語を足すこと、新しい語は英語の動詞 1 語にすること、まだ描けない種類は動く試作を 3 案並べること、部品の案は `dragon-propose` で並べること、1 つの課題で足すのは 1 つだけにすること、日本語と英語の見本をそろえること、1.0 までは語を替えてよく替える時は `readDiagram` で読み替えること、書き方の文書を同じ PR に入れること、完了条件に一式を入れず版の前の関門で回すこと、取り込んだ後に版を出すかを本人に聞くこと、値の表だけを読む検査とほかの種類では名札として読む検査を置くこと | `pnpm exec vitest run packages/dragon/test/extend-skill.test.ts`の検査`extend-skill-carries-decided-rules`が通る | #3245 |
| SKILL.md と `references/` の file が backtick で名指す repo の path が全て在る。`<種類>` のような山括弧を持つ path は、当てはまる file が repo に 1 つ以上在る | `pnpm exec vitest run packages/dragon/test/extend-skill.test.ts`の検査`extend-skill-names-existing-paths`が通る | #3245 |
| 木の図を足した取り込み (`dcf419d1`)、木の図の書き方を載せた取り込み (`33b853a0`)、列の図を足した取り込み (`2e18ba4b`) で変えた file が全て、登録先の一覧の図の種類の表のどれかの行に当てはまる | `pnpm exec vitest run packages/dragon/test/extend-skill.test.ts`の検査`extend-registry-covers-kind-additions`が通る | #3245 |
| 箱の飛び先と段の出典を足した取り込み (`b357ad1a`) で変えた file が全て、登録先の一覧の部品の表のどれかの行に当てはまる | `pnpm exec vitest run packages/dragon/test/extend-skill.test.ts`の検査`extend-registry-covers-part-addition`が通る | #3245 |
| 登録先の一覧の行は、`packages/`、`apps/` のような 2 段より浅い dir を名指さない | `pnpm exec vitest run packages/dragon/test/extend-skill.test.ts`の検査`extend-registry-rows-stay-narrow`が通る | #3245 |
| 作り直しで消した skill (`dragon-design`、`dragon-diagram`、`dragon-match`、`dragon-redraw`) は repo に戻っていない | `pnpm exec vitest run packages/dragon/test/cleanup.test.ts`の検査`stale-skills-and-docs-removed`が通る | #3245 |
