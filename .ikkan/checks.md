# 検査の方針

照合の段 (step 12) は下の表の一式を回す (#3025)。
一式は型検査、build、lint、全ての検査を順に回し、検査は名前を 1 行ずつ出す。
課題ごとには変えた所に関係する検査だけを `pnpm test:related` で回し、一式は版を出す前に 1 回だけ回す (#3381)。
一式は 1 件 10 秒、1 回の実行 5 分の上限の中で終わるので、重さを `軽い` と書く。
検査は package の検査 (`packages/`) と見本帳の検査 (`apps/`) の 2 回の実行に分けて回す。1 回で回すと、機械が混んだ時に 5 分の上限を超えて残りを回さずに止まるため (#3463)。
一式の最後に、依存の脆弱性を本物の `osv-scanner` で 1 回だけ見る (`bash scripts/check-dependency-vulnerabilities.sh`、#3498)。外の脆弱性の一覧に問い合わせ、応答が遅いと 1 回 15 秒を超えるので、1 件 10 秒の上限がある検査の外で走らせる。検査の中では代わりの道具で命令の判定だけを見る。外の一覧が止まっている時は終了 2 で止まる。

検査の名前は、行の最後の ` > ` から時間の前までを読む。
空白を含む名前も全体で読み、受入条件は二重引用符で囲んで名指す (#3254)。

| 欄 | 中身 |
|---|---|
| 一式 | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run packages/ --reporter=verbose && pnpm exec vitest run apps/ --reporter=verbose && bash scripts/check-dependency-vulnerabilities.sh'` |
| 通った行の形 | `^\s*✓\s+\S+\s+>\s+(?:.*\s+>\s+)?(.+?)\s+\d+ms$` |
| 落ちた行の形 | `^\s*×\s+\S+\s+>\s+(?:.*\s+>\s+)?(.+?)\s+\d+ms$` |
| 一式の重さ | 軽い |
