# dragon の置き場と命名

## 置き場

| 置き場 | 持つ物 | 根拠 |
|---|---|---|
| `packages/dragon/src` | package の入口。今は何も公開しない仮の入口だけ | `packages/dragon/src/index.ts` |
| `packages/dragon/test` | package と repo の仕組みの検査 | `vitest.config.ts` の `include` |
| `packages/dragon/scripts` | 入れた依存が公開物と一致するかを確かめる script | `package.json` の `verify:deps` |
| `apps/playground-spa/src` | 見本帳。今は仮の 1 頁と、配信の仕組みの検査 | `apps/playground-spa/src/main.tsx` |
| `apps/playground-spa/scripts` | 公開の build を GitHub Pages へ配る script | `apps/playground-spa/package.json` の `deploy:pages` |
| `docs/design` | 作り直す前の画面の設計図 (`app.pen`) と、図の種類ごとの記録 | `docs/design/README.md` |
| `test-support` | vitest の前処理 | `vitest.config.ts` の `globalSetup` |

## 命名

- 検査は、package の検査を `packages/dragon/test` に、見本帳の検査を検査する file の近くの `src` の下に `*.test.ts` か `*.test.tsx` で置く (`vitest.config.ts` の `include`)。
- 記法と原本と描く部品の置き場と命名は、作り直しの子の課題で決める (#2982)。
