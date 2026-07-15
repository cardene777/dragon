---
name: dragon-diagram
description: dragon 記法 (cdl) で animated diagram を生成する汎用 skill。 theme (「EIP-1559 gas fee」 「incident response」 等) を入力すると、 既存 parts catalog を活用しつつ必要に応じて新規 parts を作成、 意味のある composite exemplar を animation.cdl.ts に追加する。 新規 parts 発生時は user 確認後、 dragon repo に GitHub Issue を起票して parts catalog 標準化議論に載せる。 skill は「parts 主義 + 意味のある図」 の 2 原則で品質担保、 dyn-wave 規約 + narrative title + 日本語 label を強制。
---

# dragon-diagram — dragon 記法で animated diagram を生成する汎用 skill

## 位置付け

dragon repo 内で animation catalog に rich exemplar を追加する時の SSOT 経路。 「20 parts を使い回す」 のは理想論、 実際は theme 固有の parts が必要になることが多い。 本 skill が theme を受取り、 既存 parts で組立てるか / 新規 parts が必要か を判定して自動処理する。

## 起動 trigger

user 明示起動のみ:

- `/dragon-diagram <theme>` — theme を引数で指定
- `/dragon-diagram` (引数なし) — AskUserQuestion で theme 聞取り

例:
```
/dragon-diagram EIP-1559 gas fee
/dragon-diagram incident response の 25 分間の severity 遷移
/dragon-diagram Kubernetes pod scheduling
```

## 前提

- 起動 dir = dragon repo root (`/Users/cardene/Desktop/projects/dragon` or clone dir)
- dev server 起動中 (`http://localhost:4323`) — Playwright screenshot 用
- Node.js + pnpm 使用可能

## Skill 実行 flow

### Step 1. Theme 分析

user 入力 theme を分析、 以下を特定:

- **core message** = この図で伝えたい 1 つの concept
- **story arc** = 時間軸で何がどう変化するか (before → during → after)
- **visual metaphor** = どの視覚表現が最も直感的か (bar race / gauge / flow / timeline / state machine 等)
- **必要 element 数** = 主役 1-3 + 補助 1-2 が理想 (parts 5-10 個以上は overload)

### Step 2. Parts catalog Read (SSOT 参照)

`apps/playground-spa/src/topics/catalog/parts.cdl.ts` を Read。 現状 20 parts:

| # | parts | 用途 |
|---|---|---|
| 1 | 波打つ矩形ゲージ (partsWaveGauge) | 液面 metaphor で進捗 |
| 2 | バケット貯留 (partsBucketReservoir) | 大 wave 容器で残量 |
| 3 | 縦積み層バー (partsStackedLayer) | 合計値の内訳 (3 層) |
| 4 | 状態インジケーター (partsStateIndicator) | 大 circle 色遷移 |
| 5 | 横進捗バー (partsHorizontalBar) | 左→右 fill |
| 6 | アークゲージ (partsArcGauge) | 円弧 % 表現 |
| 7 | カウンタ表示 (partsCounterActor) | 数値 subtitle template |
| 8 | 3灯シグナル (partsTrafficLightStack) | 縦積み 3 circle |
| 9 | 円サイズ競争 (partsCircleSizeRace) | radius で強さ比較 |
| 10 | エッジ連鎖 (partsEdgeChain) | 3 node + 2 edge 順次 activate |
| 11 | パーセントリング (partsPercentRing) | 0-100% DOM ring |
| 12 | カウントアップ (partsCountup) | DOM count up |
| 13 | スパークライン (partsSparkline) | 履歴 trend |
| 14 | ドーナツチャート (partsDonut) | N segment 割合 |
| 15 | レーダーポリゴン (partsRadar) | N 軸 polygon balance |
| 16 | ステップ進捗 (partsStepProgress) | wizard step |
| 17 | ステータスドット (partsStatusDot) | 小 dot 状態 |
| 18 | 通知カード (partsNotification) | 4 kind alert |
| 19 | KPIカード (partsKpiCard) | 数値 + delta + sparkline |
| 20 | タイムライン帯 (partsTimelineStrip) | 時系列 status band |

theme の visual metaphor と照合し、 既存 parts で 100% 賄えるか判定。

### Step 3. 新規 parts 必要判定

既存 parts で 覆えない visual element が theme に含まれる場合、 新規 parts 候補を列挙:

**判定基準** — 以下いずれか該当時のみ新規 parts 検討:
- 既存 20 parts のどれとも異なる shape kind / metaphor
- 既存 parts の変形 (color / size 違い) で対応可能なら新規禁止 (composite 側で調整)
- 既存 parts の組合せで代替できるなら新規禁止

**真に新規** の例:
- ネットワークトポロジ 図 (star / mesh) → 既存 parts に該当なし → 新規候補
- 3D バブルチャート → 既存 parts に該当なし → 新規候補
- コード diff highlight → 既存 parts に該当なし → 新規候補

**既存で足りる** の例:
- 「特定色の bar」 → 横進捗バーの fill 変更で対応
- 「大きい gauge」 → アークゲージの w/h 変更で対応
- 「5 個の progress」 → 横進捗バー ×5 で composite 側対応

### Step 4. AskUserQuestion (新規 parts 発生時のみ)

新規 parts 候補が発生した場合、 skill 進行前に user 確認:

```
質問例:
「theme "X" の生成で新規 parts が必要と判定しました。
候補 parts:
  1. {name} — {metaphor / 用途}
以下いずれか選んでください:
  A. 新規 parts 追加 + dragon repo Issue 起票 (parts 標準化議論)
  B. composite 内で inline 対応 (parts 追加なし、 skill 完了)
  C. skill abort (別 approach 検討)」
```

新規 parts なしなら本 step skip、 Step 5 へ直進。

### Step 5. Composite exemplar 生成

`apps/playground-spa/src/topics/catalog/animation.cdl.ts` に composite exemplar を追加:

**規約遵守 checklist:**
- [ ] title = 抽象化 (「EIP-1559」 でなく 「3 層優先度手数料」)
- [ ] topic = 日本語で 1 文
- [ ] state 名は英字 (id として)、 subtitle template で日本語表示
- [ ] phase title = narrative (「均等分配」 「収集期」)、 data 値 (`[1,2,3]` / `0→60`) 禁止
- [ ] phase badge = 抽象 phase 名 (「初期」 「拡大」)
- [ ] lane gap ≥ 70px 確保
- [ ] dyn-wave 規約 = rectangle 内 gauge は wave (parts 1/2 経由)
- [ ] 使用 parts を comment で明示 (`// uses: partsWaveGauge / partsCounterActor / partsEdgeChain`)

**composite structure:**
- primary parts 1-3 個 + support parts 1-2 個
- 4-5 phase で story 進行
- 各 phase で複数 state を tween/set

### Step 6. i18n + export 登録

`apps/playground-spa/src/lib/i18n.ts` に export 名 → 日本語 label を追加。 export 名は composite 内容を表す動詞 (`richPipelineFlow` / `richIncidentRecovery` 等)、 label は日本語で「〜が〜する」 の narrative。

### Step 7. Verify

1. `pnpm --filter dragon-playground-spa exec tsc --noEmit` で typecheck (EXIT=0 必須)
2. Playwright script で screenshot 撮影 (`http://localhost:4323/catalog/animation` → target 選択 → t3/t7 で撮影)
3. screenshot Read で AI 目視 (rich judgment 5 criteria):
   - 見てて楽しい (visual richness)
   - 理解しやすい (message clarity at glance)
   - primary parts + support の役割分離明確
   - mermaid で描けない dynamism
   - 逆算設計 (theme → parts の因果連鎖 comment 明記)

1-4 criteria pass 必須、 fail 時は composite 再設計 loop (最大 3 回)。

### Step 8. 新規 parts Issue 起票 (Step 4 で A を選択した場合のみ)

新規 parts を parts.cdl.ts に追加した場合、 dragon repo GitHub Issue を起票:

```bash
# body cache 事前作成
cat > /tmp/dragon-parts-proposal-{slug}.md <<EOF
# [parts] {parts 名} を parts catalog 標準化検討

## 発生 context
theme = "{user 入力 theme}" の生成で新規 parts が必要と判定。

## 提案 parts spec
- id: parts-{slug}
- kind: dyn-{shape}
- metaphor: {description}
- shape spec: {source / fillMax / orient / fill 等}

## 既存 parts で代替不可の理由
{既存 20 parts を検討したが以下の理由で代替不可}
{...}

## 使用実績
- composite: {generated exemplar name}
- file: apps/playground-spa/src/topics/catalog/animation.cdl.ts
- 生成日時: {ISO date}

## 次アクション
- [ ] parts spec review (別 skill or user)
- [ ] parts.cdl.ts に恒久追加
- [ ] i18n 対応
- [ ] parts catalog 説明追加
EOF

# GitHub Issue 起票 (REST 経路、 rate limit 対策 = rules/git-workflow.md § SSOT)
gh api -X POST repos/cardene777/dragon/issues \
  -f title="[parts] {parts 名} を parts catalog 標準化検討" \
  -F 'labels[]=parts' -F 'labels[]=enhancement' \
  -f body="$(cat /tmp/dragon-parts-proposal-{slug}.md)" \
  --jq '.number,.html_url'
```

### Step 9. 完了 report

user に以下 report:

- 生成 composite = {export 名} (animation.cdl.ts に追加)
- 使用 parts = {list}
- 新規追加 parts = {list} (発生時のみ)
- Issue link = {GitHub Issue URL} (発生時のみ)
- screenshot = {saved paths}
- verify status = {typecheck / playwright / AI 目視 の 3 pass}

## SSOT 参照

- **parts catalog** = `apps/playground-spa/src/topics/catalog/parts.cdl.ts` (現 20 parts)
- **composite 置場** = `apps/playground-spa/src/topics/catalog/animation.cdl.ts`
- **i18n** = `apps/playground-spa/src/lib/i18n.ts`
- **情報伝達第一主義** = 「見た目 rich かつ意味明確」 の設計原則 (V/V-R/V-C/P6 = visual richness / visual reasoning / visual clarity / P6 逆算設計) を各 parts / composite で遵守する
- **dyn-wave 規約** = parts.cdl.ts header comment (「rectangle 内 gauge は wave 型 default」)
- **narrative title 規約** = parts.cdl.ts header comment (「data 値排除、 story 局面名で」)
- **日本語 label 規約** = i18n.ts 記述例
- **GitHub API rate limit 対策** = `gh pr create` / `gh issue create` 等 GraphQL 5000/hr 超過時は REST 経路 (`gh api -X POST repos/{owner}/{repo}/...`) に切替、 core rate limit (5000/hr、 独立 counter) を利用

## 品質保証 principle

- **1 parts = 1 concept** — parts は minimal、 混在禁止
- **composite = 意味ある story** — parts の並列でなく theme 固有の narrative
- **新規 parts は真に新規のみ** — 既存 parts の変形 (color / size) は新規化しない
- **user 判断が最優先** — 新規 parts 発生時は必ず AskUserQuestion 経由
- **verify 4 条件** — typecheck + layer 2 + Playwright + AI 目視 の 4 経路 pass 必須

## Anti-pattern (絶対禁止)

- 既存 parts の 単純色違い / サイズ違い を新規 parts として追加
- title に data 値 (「[30, 25, 20, 25]」 / 「0 → 60」) を書く
- 英語のみの label / topic (日本語 page 前提)
- rectangle 内 fill gauge を wave なしで作る (dyn-wave 規約違反)
- verify skip して user 送付
- Issue 起票を確認なしで自動実行

## 使用例

```
user: /dragon-diagram EIP-1559 gas fee

skill:
  1. theme 分析 = 「3 層手数料 (base burn + priority tip + max cap) の階層構造」
  2. parts 照合 = 縦積み層バー (partsStackedLayer) が完全一致、 新規 parts 不要
  3. composite 生成 = richLayeredPriorityFee を animation.cdl.ts に追加
     - 縦積み層バー (base/tip/cap の 3 layer) 主役
     - 補助 = カウンタ表示 (有効総額 gwei) + アークゲージ (混雑度 %)
  4. phase 設計 = 空 block → 平常 → 混雑 → 極混雑 の 4 phase
  5. typecheck EXIT=0
  6. Playwright screenshot t7 = 3 stacked layer + counter + arc が確認
  7. AI 目視 = 5 criteria 全 pass
  8. 新規 parts なし → Issue 起票 skip
  9. report: richLayeredPriorityFee 生成 (partsStackedLayer + partsCounterActor + partsArcGauge)
```

```
user: /dragon-diagram メッシュ状の 5-node network topology

skill:
  1. theme 分析 = 「5 node が全対全接続の network、 中央 node hub」
  2. parts 照合 = 既存 20 parts に該当なし (エッジ連鎖は 3 直列、 mesh 非対応)
  3. 新規 parts 候補 = "partsMeshTopology" (5 node + 10 edge の star/mesh レイアウト)
  4. AskUserQuestion: 「新規 parts 追加 + Issue 起票 / composite inline / abort」
  5. user が A 選択 → parts.cdl.ts に追加 + composite 生成 + Issue 起票
```

## Known limitations

- cdl engine が radial / tree layout をサポートしていないため、 mesh / graph 系 topology は近似のみ
- parts 新規追加時、 parts.cdl.ts + i18n.ts + catalog.ts の 3 file 更新が必要 (skill 内で自動化)
- rate limit で GitHub API 起票失敗時は marker Write して user に手動起票を依頼 (自動 retry しない)
