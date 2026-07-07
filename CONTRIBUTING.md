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
