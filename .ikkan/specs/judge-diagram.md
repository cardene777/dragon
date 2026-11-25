# judge-diagram

| Criterion | How to check | Origin |
|---|---|---|
| `judge`で規則5つと例6つを書いた時、行に例、列に規則、最後の列に判定を置いたHTMLの表を描く | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-draws-html-table` passes | #3879 |
| 例の下に`fail`を書いた規則のセルだけが✕とその外れた値を持ち、書かない規則のセルは✓になる | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-fail-marks-only-written-rules` passes | #3879 |
| 外れる規則を持つ例の判定は「止める」で、その下に外れた規則の番号と名前を出し、外れる規則を持たない例の判定は「通す」になる | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-verdict-names-failed-rules` passes | #3879 |
| 再生すると、段の送り1回で規則の列を左から1列ずつ照らして✓と✕を出し、最後の送りで判定を出す | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-plays-column-by-column` passes | #3879 |
| `fail`の行に`[stop]`を書いた時、その後の列のセルが「—」になる | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-stop-dashes-later-columns` passes | #3879 |
| 例に`[note: <字>]`を書いた時、例の名前の下にその字を出す | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-case-note-under-name` passes | #3879 |
| 1行目に`[pass: 合格, block: 不合格]`を書いた時、判定の語が替わり、書かない時は「通す」と「止める」(英語は`pass`と`block`) を出す | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-verdict-words-default-and-override` passes | #3879 |
| 枠の幅に収まらない時、表を横に送れて、例の列が左に留まる | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-wide-table-scrolls-with-cases-kept` passes | #3879 |
| 印刷の形では、全てのセルと判定を埋めた表を描く | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-print-fills-all-cells` passes | #3879 |
| 幅728pxの枠で、判定の表の字が10.5px以上で描かれる | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-text-readable-at-728` passes | #3879 |
| `judge`で始まる原本のJSONを形の検査が受け付け、記法を読んで書き戻すと同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-schema-and-roundtrip` passes | #3879 |
| 宣言していない規則を`fail`に書いた時と、同じ例に同じ規則の`fail`を2度書いた時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-fail-unknown-or-twice-refused` passes | #3879 |
| 最初の`case`より前に`fail`を書いた時と、規則か例が1つも無い時、その行を名指して描くのを断る | `pnpm exec vitest run packages/dragon/test/judge-diagram.test.ts` check `judge-fail-before-case-or-empty-refused` passes | #3879 |
| `judge`でない図は、今と同じ形で描く | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts` check `examples-svg-unchanged` passes | #3879 |
