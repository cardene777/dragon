# dragon の技術の構成と制約

## 構成

- pnpm の workspace で、`apps/*` と `packages/*` を持つ (`pnpm-workspace.yaml`)。
- TypeScript の ESM で書く (`package.json` の `"type": "module"`、`tsconfig.json`)。
- package は tsup で build する。依存は字 (`@fontsource-variable/noto-sans-jp`、`@fontsource-variable/jetbrains-mono`) と書き出しの部品 (`gifenc`、`mediabunny`、`subset-font`) だけ (`packages/dragon/package.json`)。
- 描画は `packages/dragon` の中に持つ。`@cardenelabs/cdl` への依存は #2983 で外した (#2982)。
- 見本帳は Vite と React 19 で作り、経路は依存を足さずに `history` で持つ (`apps/playground-spa/src/site/routes.ts`)。Tailwind 4 の plugin は Vite の設定に残るが、今の頁は使っていない (`apps/playground-spa/package.json`、`apps/playground-spa/vite.config.ts`)。
- 見本帳の公開の build は、読み込んでよい場所を CSP の meta で絞る (`apps/playground-spa/vite-csp.ts`)。
- 見本帳は、概要の頁と編集画面の最初の見本のほかの見本の記法と、部品の図の記法を、それぞれ1つの後から読む塊に分け、最初の画面を描いた後に裏で読む (`apps/playground-spa/src/site/later.ts`、#3246)。
- 見本帳の使い方の頁とカタログの頁も後から読む塊に分け、同じ仕組みで読む (`apps/playground-spa/src/site/pages.tsx`、#3280)。頁の塊が読めなかった時だけ、頁を1度自動で読み直す (#3288)。
- 字は Noto Sans JP と JetBrains Mono を同梱し、`@cardenelabs/dragon/fonts` の入口から読む (`packages/dragon/src/load-fonts.ts`)。見本帳は字の CSS を最初の CSS に入れず、初めて開く端末は最初の画面を描いた後に読み、前に読んだ端末は描く前に読む (`apps/playground-spa/src/site/fonts.ts`、#3292)。
- 既定の入口 `@cardenelabs/dragon` は全ての図の種類の部品を持ち、軽い入口 `@cardenelabs/dragon/light` は `git`、`lineup`、`state`、`time`、`tree` の部品を `loadKind` を待った時に読む。見本帳は軽い入口だけを読む (`packages/dragon/src/kinds/registry.ts`、#3248)。
- 頁で描く入口 `@cardenelabs/dragon` は Node の組み込みの module を読まず、原本の file を移す `migrateFile` は Node でだけ動く入口 `@cardenelabs/dragon/node` に置く (`packages/dragon/src/node.ts`、#3206)。

## 検査

- `pnpm test` は repo の根で vitest を回す (`package.json`、`vitest.config.ts`)。
- vitest は回す前に、`packages/dragon` の `dist` が `src` より古くないかを見る (`test-support/global-setup.ts`)。
- `pnpm run verify` は型、build、lint、`pnpm test` の順に回す (`package.json`)。
- 見本帳の検査は、頁を build して GitHub Pages と同じ形で配り、Playwright で画面なしの Chromium に開いて確かめる (`apps/playground-spa/src/lib/playground-support.ts`)。
- 見本帳の検査は、動きを嫌う設定を頁を開く時に渡し (`site.open` の `reducedMotion`)、開いた後に `emulateMedia` で当てない。指で触る頁は `(pointer: coarse)` が当たるまで待ってから返す (#3231)。
- 字の重なる図を作れないため、重なりを知らせる流れは、重なりを探す所 (`findOverlaps`) を包んで重なりを 1 件足して確かめる。書き出しの命令は `vi.mock` で包み、見本帳は検査だけの build の設定で包む (`packages/dragon/test/paired-overlap.ts`、`apps/playground-spa/src/lib/overlap-build-support.ts`、#3197)。
- 頁の中で動く値は `pnpm test:mutation:values` で 1 つずつ書き換えて検査を回し、受入条件が全部 `今を守る` の課題に要る壊して測った結果の表は、その結果の file から `pnpm test:mutation:table <変異の一覧> <結果の file> --step <数>` で作る (`scripts/mutate-values.mjs`)。
- 依存の中身が公開されている物と一致するかを `pnpm verify:deps` が確かめ、network を使う (`packages/dragon/scripts/verify-dep-integrity.mjs`)。
- 依存の既知の脆弱性は `scripts/check-dependency-vulnerabilities.sh` が `osv-scanner` で見る。
- 版を上げた時に、`packages/dragon/package.json` の版が前提の配り方の節と `CHANGELOG.md` の見出しに書かれているかを確かめる (`packages/dragon/test/release-records.test.ts`)。
- `.github/workflows` は持たない (`git ls-files`)。

## 制約

- node は 18 以上 (`packages/dragon/package.json` の `engines`)。
- package の任意の peer 依存は、mp4 や GIF への書き出しで使う `playwright-core` (`packages/dragon/package.json` の `peerDependenciesMeta`)。
