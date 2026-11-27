# text-wrap

| Criterion | How to check | Origin |
|---|---|---|
| 字を折る処理 (`wrap`) に字の大きさの16倍より狭い幅を渡しても、1行に16字入る幅 (字の大きさの16倍) で折り、それより狭い行に折らない | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `wrap-keeps-16-chars` passes | #4009 |
| 前から詰めて折った最後の行が4字に満たない時は、前の行の最後の句読点の後で折り直す | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `wrap-rebreaks-short-last-line-at-punctuation` passes | #4009 |
| 最後の行が4字に満たず、前の行に句読点が無いか句読点の後で折ると幅に収まらない時は、行数を変えずに行の長さを均して、最後の行を4字以上にする | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `wrap-evens-lines-without-punctuation` passes | #4009 |
| 最後の行が4字以上ある字は、今と同じく前から詰めて折る | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `wrap-keeps-greedy-lines-when-last-line-is-long` passes | #4009 |
| 幅に収まる字は、渡した幅が16字より狭くても折らずに1行で返す | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `wrap-keeps-one-line-text` passes | #4009 |
| 列が1つの列の図は、段の題と本文を16字以上の幅で折り、図の幅を広げて折った字を図の枠に収める | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `lineup-one-lane-wraps-step-text-at-16-chars` passes | #4009 |
| 段の題と本文を今の幅のまま16字以上の幅で折れる列の図は、今と同じ幅で描く | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `lineup-wide-figures-keep-width` passes | #4009 |
| 列の図の帯の一言と凡例と役の説明と列の名前と層の説明に長い字を書いた時も、帯か図を広げて16字以上の幅で折り、`dragon check --layout`が崩れを出さない | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `lineup-wrapped-texts-widen-their-area` passes | #4009 |
| 判定の表の静止画は、名前の長い規則の`note`も16字以上の幅で折り、絵を広げて折った字を絵の幅に収める | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `judge-picture-long-rule-name-note-wraps-at-16-chars` passes | #4009 |
| `dragon check --layout`は、描き方が16字より狭い幅で折った字を崩れとして、字と段と一緒に日本語と英語の文で知らせる | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `layout-check-finds-narrow-wrap` passes | #4009 |
| `dragon check --layout`は、16字以上の幅で折った字と1行に収まった字を崩れにしない | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `layout-check-skips-wraps-at-16-chars` passes | #4009 |
| 見本と検査の記法と部品の図を日本語と英語で全て描くと、2行以上に折った字は全て16字以上の幅で折る | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `examples-wrap-at-16-chars-or-more` passes | #4009 |
| 見本と検査の記法と部品の図を日本語と英語で全て描くと、2行以上に折った字の最後の行は全て4字以上ある | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `examples-last-wrapped-line-has-4-chars` passes | #4009 |
| 見本の崩れの記録は今のまま変わらず、図を広げても新しい崩れを出さない | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `layout-check-examples-match-recorded` passes | #4009 |
| 字を折る処理 (`wrap`) に改行を持つ字を渡すと、改行の所で行を替え、分けた行ごとに幅で折った行を返し、行に改行を残さない | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `wrap-breaks-at-newlines` passes | #4016 |
| 分けた行ごとに16字の幅の下限と最後の行の折り直しを当て、書き手が改行で作った1行だけの短い行は、折り直さずにそのまま返す | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `wrap-keeps-short-lines-the-writer-made` passes | #4016 |
| 改行を持たない字は、今と同じ行に折る | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `wrap-keeps-greedy-lines-when-last-line-is-long` passes | #4016 |
| 段の部品の図 (日本語と英語) の図の上の段の文は、書き手が`say`を分けた所で行を替え、行の間は折った行の間と同じで、図の枠に収まる | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `lineup-step-text-breaks-at-say-lines` passes | #4016 |
| 見本と検査の記法と部品の図を全て描くと、2行以上に折った字は全て16字以上の幅で折る | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `examples-wrap-at-16-chars-or-more` passes | #4016 |
| 見本と検査の記法と部品の図を全て描くと、分けた行ごとに2行以上に折った字の最後の行は全て4字以上ある | `pnpm exec vitest run packages/dragon/test/wrap.test.ts packages/dragon/test/layout-check.test.ts` check `examples-last-wrapped-line-has-4-chars` passes | #4016 |
