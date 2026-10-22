# dragon の置き場と命名

## 置き場

| 置き場 | 持つ物 | 根拠 |
|---|---|---|
| `packages/dragon/src` | 記法の読み書き、原本の検査、描画、再生、書き出し、命令 (`cli.ts`) と、それらを公開する入口 | `packages/dragon/src/index.ts`、`packages/dragon/package.json` の `exports` |
| `packages/dragon/test` | package と repo の仕組みの検査 | `vitest.config.ts` の `include` |
| `packages/dragon/scripts` | 入れた依存が公開物と一致するかを確かめる script | `package.json` の `verify:deps` |
| `apps/playground-spa/src` | 見本帳。経路と上の帯と編集画面のほかの画面を `src/site` に、編集画面を `Playground.tsx` に、頁と配信の仕組みの検査を `src/lib` に置く | `apps/playground-spa/src/main.tsx` |
| `apps/playground-spa/scripts` | 公開の build を GitHub Pages へ配る script | `apps/playground-spa/package.json` の `deploy:pages` |
| `docs/design` | 作り直す前の画面の設計図 (`app.pen`) と、図の種類ごとの記録 | `docs/design/README.md` |
| `test-support` | vitest の前処理 | `vitest.config.ts` の `globalSetup` |

## 命名

- 検査は、package の検査を `packages/dragon/test` に、見本帳の検査を検査する file の近くの `src` の下に `*.test.ts` か `*.test.tsx` で置く (`vitest.config.ts` の `include`)。
- 見本帳の部品は `data-playground` (編集画面) と `data-site` (上の帯) の札で探し、画面は `data-site-screen` の札で見分ける (`apps/playground-spa/src/lib/playground.test.ts`、`apps/playground-spa/src/lib/site.test.ts`)。
