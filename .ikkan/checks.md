# 検査の方針

照合の段 (step 12) は下の表の一式を回す (#3025)。
一式は型検査、build、lint、全ての検査を順に回し、検査は名前を 1 行ずつ出す。

照合の段で `suite.sh` に渡す正規表現は次の 2 つ。

- 通った名前は `^\s*✓\s+.*>\s+(\S+)\s+\d+ms$`
- 落ちた名前は `^\s*×\s+.*>\s+(\S+)\s+\d+ms$`

| 欄 | 中身 |
|---|---|
| 一式 | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'` |
