# direction-marks

| Criterion | How to check | Origin |
|---|---|---|
| 列の図のボードは、帯を横に並べた形 (幅1100) でも、狭い幅 (390と324) で帯を上から積んだ形でも、帯の間に向きの印を描かず、並べ方も帯の間の印を持たない | `pnpm exec vitest run packages/dragon/test/lineup-board.test.ts` check `lineup-board-no-lane-mark` passes | #4060 |
| ボードの帯の間は、横に並べた形でも帯を積んだ形でも16pxのまま | `pnpm exec vitest run packages/dragon/test/lineup-board.test.ts` check `lineup-board-lane-gap-stays` passes | #4060 |
| 狭い幅のボードは、帯を図の幅にして上から積み、帯の中に札を2つずつ並べ、全体を出す見せ方で枠に収めた字が10.5px以上ある | `pnpm exec vitest run packages/dragon/test/lineup-board.test.ts` check `lineup-board-narrow-stacks-lanes` passes | #4060 |
| 差し戻しの段は、今と同じく戻りの線と「差し戻し」の札を描く | `pnpm exec vitest run packages/dragon/test/lineup-board.test.ts` check `lineup-board-send-back-draws-a-return-line` passes | #4060 |
| 寄って追う窓で切れた箱の名前を出す札の印は、札の色で塗った閉じた三角で、尖った先が切れた箱の続く側を向く | `pnpm exec vitest run packages/dragon/test/follow-ends.test.ts` check `follow-ends-tag-arrow-filled` passes | #4060 |
| 寄って追う窓の札の印を、塗らない線だけの開いたV字で描かない | `pnpm exec vitest run packages/dragon/test/follow-ends.test.ts` check `follow-ends-tag-arrow-not-open` passes | #4060 |
| 札は今と同じく窓の枠の中に収まる | `pnpm exec vitest run packages/dragon/test/follow-ends.test.ts` check `follow-ends-tag-inside-frame` passes | #4060 |
| 窓の外へ切れた箱の端には、今と同じく全て札が付く | `pnpm exec vitest run packages/dragon/test/follow-ends.test.ts` check `follow-ends-every-cut-end-has-tag` passes | #4060 |
| 見た目の決まり (`docs/design/base/GRAMMAR.md`) の置き方の節が、線に付かない細い線だけの小さな`>`を向きの印に使わないこと、印1つで向きを示す所には塗った三角を使うこと、並びで順が読める所には印を置かないことを書き、`CHANGELOG.md`と`CHANGELOG.ja.md`のUnreleasedが2つの印の変更を書く | `pnpm exec vitest run packages/dragon/test/look.test.ts` check `direction-marks-docs` passes | #4060 |
| 描き方のfileは、色と大きさを直に書かず値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts` check `renderers-read-values-from-one-table` passes | #4060 |
| 最初に読むscriptのgzip後の合計が、上限の90,000 byteに収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts` check `script-entry-within-budget` passes | #4060 |
| 見本帳とエディタの頁が最初に読む量は、上限の中に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts` check `page-bundle-within-budget` passes | #4060 |
