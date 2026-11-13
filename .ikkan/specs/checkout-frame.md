# checkout-frame

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 購入記法を標準の解析・JSON保存・描画で扱える | `pnpm exec vitest run packages/dragon/test/article-frame.test.ts packages/dragon/test/dragon-native.test.mjs packages/dragon/test/acp-purchase-lab.test.mjs packages/dragon/test/script-entry.test.ts` が終了0 | #3677 |
| 配送や数量を変更した後は、以前の承認で購入できない | `pnpm exec vitest run packages/dragon/test/article-frame.test.ts packages/dragon/test/dragon-native.test.mjs packages/dragon/test/acp-purchase-lab.test.mjs packages/dragon/test/script-entry.test.ts` が終了0 | #3677 |
| 応答不達でも、注文と決済を増やさない | `pnpm exec vitest run packages/dragon/test/article-frame.test.ts packages/dragon/test/dragon-native.test.mjs packages/dragon/test/acp-purchase-lab.test.mjs packages/dragon/test/script-entry.test.ts` が終了0 | #3677 |
| 共通ヘッダーがコードと5形式の書き出しを提供する | `pnpm exec vitest run packages/dragon/test/article-frame.test.ts packages/dragon/test/dragon-native.test.mjs packages/dragon/test/acp-purchase-lab.test.mjs packages/dragon/test/script-entry.test.ts` が終了0 | #3677 |
| 公式エディタへ記法を欠落なく渡す | `pnpm exec vitest run packages/dragon/test/article-frame.test.ts packages/dragon/test/dragon-native.test.mjs packages/dragon/test/acp-purchase-lab.test.mjs packages/dragon/test/script-entry.test.ts` が終了0 | #3677 |
| 中央寄せの余白をコマの複製後も保持できる | `pnpm exec vitest run packages/dragon/test/article-frame.test.ts packages/dragon/test/dragon-native.test.mjs packages/dragon/test/acp-purchase-lab.test.mjs packages/dragon/test/script-entry.test.ts` が終了0 | #3677 |
| 既存の時系列図を解析・描画できる | `pnpm exec vitest run packages/dragon/test/article-frame.test.ts packages/dragon/test/dragon-native.test.mjs packages/dragon/test/acp-purchase-lab.test.mjs packages/dragon/test/script-entry.test.ts` が終了0 | #3677 |
| 最初に読む入口の量が既存の上限を超えない | `pnpm exec vitest run packages/dragon/test/article-frame.test.ts packages/dragon/test/dragon-native.test.mjs packages/dragon/test/acp-purchase-lab.test.mjs packages/dragon/test/script-entry.test.ts` が終了0 | #3677 |
