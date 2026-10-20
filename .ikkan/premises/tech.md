# dragon の技術の構成と制約

## 構成

- pnpm の workspace で、`apps/*` と `packages/*` を持つ (`pnpm-workspace.yaml`)。
- TypeScript の ESM で書く (`package.json` の `"type": "module"`、`tsconfig.json`)。
- package は tsup で build し、外の package への依存を持たない (`packages/dragon/package.json`)。
- 描画は作り直しで `packages/dragon` の中に持つ。`@cardenelabs/cdl` への依存は #2983 で外した (#2982)。
- 見本帳は Vite と React 19 で作る。Tailwind 4 の plugin は Vite の設定に残るが、今の頁は使っていない (`apps/playground-spa/package.json`、`apps/playground-spa/vite.config.ts`)。
- 見本帳の公開の build は、読み込んでよい場所を CSP の meta で絞る (`apps/playground-spa/vite-csp.ts`)。
- 字は今は同梱していない。作り直しで Noto Sans JP と等幅の字を同梱する (#2982)。

## 検査

- `pnpm test` は repo の根で vitest を回す (`package.json`、`vitest.config.ts`)。
- vitest は回す前に、`packages/dragon` の `dist` が `src` より古くないかを見る (`test-support/global-setup.ts`)。
- `pnpm run verify` は型、build、lint、`pnpm test` の順に回す (`package.json`)。
- 画面の Playwright の検査は #2983 で古い画面と一緒に消し、今は持たない。
- 変異の検査を stryker で持つが、対象の 3 file は #2983 で消したため、今は変異させる file が無い (`stryker.conf.json`)。
- 依存の中身が公開されている物と一致するかを `pnpm verify:deps` が確かめ、network を使う (`packages/dragon/scripts/verify-dep-integrity.mjs`)。
- 依存の既知の脆弱性は `scripts/check-dependency-vulnerabilities.sh` が `osv-scanner` で見る。
- `.github/workflows` は持たない (`git ls-files`)。

## 制約

- node は 18 以上 (`packages/dragon/package.json` の `engines`)。
- React は package では任意の peer 依存 (`packages/dragon/package.json` の `peerDependenciesMeta`)。
