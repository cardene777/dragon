# Contributing to cdl

Thanks for considering a contribution. cdl は小さな OSS プロジェクトで、 idea / bug 報告 / pull request どれも歓迎。

## Quick start

```bash
git clone git@github.com:cardene777/cdl.git
cd cdl
pnpm install
pnpm test            # 380 件 pass を確認
pnpm dev             # http://localhost:4321 で playground 起動
```

`pnpm test` で全 380 件が pass する状態が baseline。
ローカル開発開始前に必ず緑を確認。

## monorepo の構成

| path | 役割 |
| --- | --- |
| `packages/cdl/` | core library (`@cardenelabs/cdl`) ... builder + compile + layout + render |
| `packages/anim/` | animation runtime (`@cardenelabs/anim`) ... phase timeline + state tween |
| `apps/playground/` | Astro app ... Visual Editor + Catalog + Docs |
| `scripts/` | lint / docs preview helper |

## 開発フロー

1. issue を起票 (`bug-report` / `feature-request` / `question` template から選ぶ)
2. `feature/{N}-{slug}` で branch 切り
3. test 先行 (TDD 推奨、 動作証明のないコードは merge 対象外)
4. `pnpm test` + `pnpm typecheck` + `pnpm build` が緑になるか確認
5. pull request を起票

## Tests

```bash
pnpm test                                    # vitest 全 380 件 (unit + integration)
pnpm test:watch                              # vitest watch mode
pnpm --filter cdl-playground test:visual     # Playwright screenshot diff
pnpm --filter cdl-playground test:e2e        # Editor flow
pnpm lint                                    # eslint
pnpm typecheck                               # tsc -b 全 workspace
pnpm lint:docs-preview                       # docs の preview 強制 lint
```

新機能を追加する PR は test を必ず添える。
test の置き場所は `packages/{cdl,anim}/test/` または `apps/playground/tests/{visual,e2e}/` のいずれか。

## Pull request

- 1 PR = 1 concern (機能 / 修正 / refactor を混ぜない)
- title prefix ... `feat` / `fix` / `docs` / `refactor` / `test` / `chore`
  - 例 ... `feat(cdl): add new gantt preset`
  - 例 ... `fix(anim): handle reduced-motion edge case`
- description ... 変更理由 + 影響範囲 + test 方針を明記
- 新機能の test を必ず添える
- typecheck / test / build が緑であること

PR template (`.github/pull_request_template.md`) に従って書けば必須項目は全て埋まる。

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

例 ... `✨ feat(cdl): gantt preset を追加`

## code style

- TypeScript ... strict mode 全面 ON、 `any` 禁止
- prettier ... `pnpm format` (eslint + prettier)
- import 順 ... 標準 lib → 外部 → 自 package → 相対 path
- 1 file 1 責務、 巨大ファイル禁止

## docs を更新する

- public API の変更は `packages/cdl/README.md` + `apps/playground/src/content/cdl-docs/` 両方更新
- code block には preview tab + LLM tab を付ける (lint で強制、 `pnpm lint:docs-preview`)
- 日本語 docs と英語 docs を同期 (`cdl-docs/` + `cdl-docs-en/`)

## 質問 / 相談

- 軽い質問は [question template](https://github.com/cardene777/cdl/issues/new?template=question.yml)
- 設計判断を含む議論は discussion / issue を建てて方針合意してから実装

issue / PR に時間がかかっても焦らずお待ちください。 OSS でメンテナーの余力に依存する場面があります。

## License

cdl は [MIT License](LICENSE) で配布。
contribution は同 license で受領される前提。
