# dragon の技術の構成と制約

## 構成

- pnpm の workspace で、`apps/*` と `packages/*` を持つ (`pnpm-workspace.yaml`)。
- TypeScript の ESM で書く (`package.json` の `"type": "module"`、`tsconfig.json`)。
- package は tsup で build する。依存は字 (`@fontsource-variable/noto-sans-jp`、`@fontsource-variable/jetbrains-mono`) と書き出しの部品 (`gifenc`、`mediabunny`、`subset-font`) だけ (`packages/dragon/package.json`)。
- 描画は `packages/dragon` の中に持つ。`@cardenelabs/cdl` への依存は #2983 で外した (#2982)。
- 見本帳は Vite と React 19 で作り、経路は依存を足さずに `history` で持つ (`apps/playground-spa/src/site/routes.ts`)。Tailwind 4 の plugin は Vite の設定に残るが、今の頁は使っていない (`apps/playground-spa/package.json`、`apps/playground-spa/vite.config.ts`)。
- 見本帳の公開の build は、読み込んでよい場所を CSP の meta で絞る (`apps/playground-spa/vite-csp.ts`)。
- 字は Noto Sans JP と JetBrains Mono を同梱し、`@cardenelabs/dragon/fonts` の入口から読む (`packages/dragon/src/load-fonts.ts`)。

## 検査

- `pnpm test` は repo の根で vitest を回す (`package.json`、`vitest.config.ts`)。
- vitest は回す前に、`packages/dragon` の `dist` が `src` より古くないかを見る (`test-support/global-setup.ts`)。
- `pnpm run verify` は型、build、lint、`pnpm test` の順に回す (`package.json`)。
- 見本帳の検査は、頁を build して GitHub Pages と同じ形で配り、Playwright で画面なしの Chromium に開いて確かめる (`apps/playground-spa/src/lib/playground-support.ts`)。
- 変異の検査を stryker で持つが、名指した 3 file のうち `keywords.ts` と `compile.ts` は今は無い (`stryker.conf.json`)。
- 頁の中で動く値は `pnpm test:mutation:values` で 1 つずつ書き換えて検査を回し、受入条件が全部 `今を守る` の課題に要る壊して測った結果の表は、その結果の file から `pnpm test:mutation:table <変異の一覧> <結果の file> --step <数>` で作る (`scripts/mutate-values.mjs`)。
- 依存の中身が公開されている物と一致するかを `pnpm verify:deps` が確かめ、network を使う (`packages/dragon/scripts/verify-dep-integrity.mjs`)。
- 依存の既知の脆弱性は `scripts/check-dependency-vulnerabilities.sh` が `osv-scanner` で見る。
- `.github/workflows` は持たない (`git ls-files`)。

## 制約

- node は 18 以上 (`packages/dragon/package.json` の `engines`)。
- package の任意の peer 依存は、mp4 や GIF への書き出しで使う `playwright-core` (`packages/dragon/package.json` の `peerDependenciesMeta`)。
