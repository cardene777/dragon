# Contributing to dragon

Thanks for considering a contribution. dragon は小さな OSS プロジェクトで、 idea / bug 報告 / pull request どれも歓迎。

## Quick start

```bash
git clone git@github.com:cardene777/dragon.git
cd dragon
pnpm install
pnpm test            # vitest 全 pass を確認
pnpm dev             # http://localhost:4323 で playground SPA 起動
```

`pnpm test` で全件 pass する状態が baseline。 ローカル開発開始前に必ず緑を確認。

## monorepo の構成

| path | 役割 |
| --- | --- |
| `packages/dragon/` | text DSL parser (`@cardenelabs/dragon`) ... YAML-like → CdlDiagram |
| `apps/playground-spa/` | Vite + React 19 + Tailwind 4 SPA ... Catalog + Editor + Compare + Docs |

engine (`@cardenelabs/cdl`) は別 repo (`github.com/cardene777/cdl`) SSOT。

## 開発フロー

1. issue を起票
2. `feature/{N}-{slug}` で branch 切り
3. test 先行 (TDD 推奨、 動作証明のないコードは merge 対象外)
4. `pnpm test` + `pnpm typecheck` + `pnpm build` が緑になるか確認
5. pull request を起票

## 残作業の数え方

この repo の issue は **Linear と GitHub の 2 箇所**にある。 片方だけ見ると残作業が見えない。

「残りゼロ」 と判断する前に、両方を実測する。

```bash
# GitHub 側
gh issue list -R cardene777/dragon --state open --limit 50
gh pr list -R cardene777/dragon --state open

# Linear 側 (MCP 経由)
#   mcp__linear__list_issues  project=dragon  state=Backlog
#   mcp__linear__list_issues  project=dragon  state="In Progress"
```

### Linear の tool が見当たらない時

**「この repo は GitHub 運用だから Linear は非該当」 と読み替えない。**

`.mcp.json` に Linear が登録されている。 tool が出ていないのは **未登録ではなく未認証**。

1. `.mcp.json` を開いて登録の有無を確かめる
2. 登録があれば `mcp__linear__authenticate` を呼び、返ってきた URL を開いて認可する
3. 認可後に tool が使えるようになるので、そこで数える

登録が無い repo なら非該当でよい。 その場合も `.mcp.json` を見てから判断する。

数えるだけなら API key と `curl` でも読める (Linear の状態変更は MCP 経由が必須で、
GraphQL の mutation 直叩きは禁止)。

### なぜこの手順があるか

2026-08-06 の棚卸しで、GitHub が 0 件になった時点で Linear の tool が出ておらず、
`.mcp.json` を見ないまま「非該当」 と判断した。 実際は未認証だっただけで、認証したら
Backlog 7 件 / In Progress 4 件が残っていた。 そのまま報告していれば 11 件を見落として
「残作業 0」 と書くところだった。

経緯は `#1055` と `#1056` に残っている。

## Tests

```bash
pnpm test                                        # vitest 全件 (unit + integration)
pnpm test:watch                                  # vitest watch mode
pnpm --filter dragon-playground-spa test         # Playwright E2E
pnpm lint                                        # eslint
pnpm typecheck                                   # tsc -b 全 workspace
```

新機能を追加する PR は test を必ず添える。 test の置き場所は `packages/dragon/test/` または `apps/playground-spa/tests/` のいずれか。

## Pull request

- 1 PR = 1 concern (機能 / 修正 / refactor を混ぜない)
- title prefix ... `feat` / `fix` / `docs` / `refactor` / `test` / `chore`
- description ... 変更理由 + 影響範囲 + test 方針を明記

## commit message

絵文字 prefix + 日本語簡潔。

| 絵文字 | 用途 |
| --- | --- |
| `✨` | 新機能 |
| `🐛` | bug fix |
| `📝` | docs |
| `♻️` | refactor |
| `✅` | test |
| `🎨` | style / format |
| `⚡` | performance |
| `🔧` | tooling / config |

例 ... `✨ feat(dragon): sequence preset を追加`

## code style

- TypeScript ... strict mode 全面 ON、 `any` 禁止
- prettier ... `pnpm format` (eslint + prettier)
- import 順 ... 標準 lib → 外部 → 自 package → 相対 path
- 1 file 1 責務、 巨大ファイル禁止

## License

dragon は [MIT License](LICENSE) で配布。 contribution は同 license で受領される前提。
