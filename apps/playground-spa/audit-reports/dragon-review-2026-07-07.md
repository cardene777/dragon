# dragon-review 実行結果 (2026-07-07)

**contexto** = /auto iteration 5、 user 明示「絶対嘘、 精度が低い、 正解デザインが間違ってる可能性が高い、 開発中なので専用のレビュースキルがないと」 の対応で /dragon-review skill 初回本番運用。

**対象** = 15 diagram (7 category から代表 diagram サンプリング)、 3 batch で dragon-diagram-reviewer subagent 並列起動。

---

## 全体 verdict

| batch | 対象 | High | Medium | Low | verdict |
|---|---|---:|---:|---:|---|
| 1 | presets (swimlane / class / sequence) + patterns (fan-out / passthrough) | 9 | 8 | 4 | FAIL |
| 2 | cookbook (apiCall / jwtAuth) + text-dsl (class / sequence) | 8 | 7 | 3 | FAIL |
| 3 | primitives (actor / function) + animation (tween / badge) + styles (solid / tone-accent) | 5 | 6 | 3 | FAIL |
| **合計** | 15 diagram | **22** | **21** | **10** | **FAIL** |

53 finding、 15 diagram 全て FAIL。 全 100+ catalog に外挿すると推定 300+ finding。

## systematic 根本課題 (全 15 diagram 横断、 root cause 8 系統)

| # | 課題 | 該当 diagram | root cause 所在 | dragon 側修正可否 |
|---|---|---|---|---|
| 1 | edge label 潰れ 5-6px (V-1) | apiCall / jwtAuth / textDslSequence 他 | cdl engine renderer min font-size 未保証 | ×engine 側 |
| 2 | modal aspect ratio 崩壊 (V-6) | sequence 系 / kindActor / badgePerPhase 全部 | cdl engine container fit logic | ×engine 側 |
| 3 | subtitle 情報密度ゼロ (V-8) | apiCall / jwtAuth / textDslSequence / kindFunction 等 | catalog topic の DSL 記述 | **○ dragon 側で解決可** |
| 4 | preset 縦 density 空きすぎ (V-4) | swimlane / class / sequence | cdl engine lane height content-fit 未対応 | ×engine 側 |
| 5 | phase progress UI 浮遊 (V-7) | fan-out / sequence / badgePerPhase | cdl engine phase renderer 配置 | ×engine 側 |
| 6 | pass-through node 視覚 marker 未実装 (V-2) | pattern-passthrough / jwtAuth | cdl engine node option 未対応 | ×engine 側 (要 API 追加) |
| 7 | tone identity 欠如 (V-5, V-8) | styleSolid / toneAccent | cdl engine tone color spec | ×engine 側 |
| 8 | value 桁下がり clip (V-1) | tweenSimple | cdl engine renderer padding | ×engine 側 |

**dragon 側で解ける = 20%** (課題 3 のみ = subtitle / phase name / value 意味付け / topic 情報密度)、 **cdl engine 改修必須 = 80%**。

## 修正着手 = 課題 3 系 (20%) を全 15 diagram で

### presetSwimlane
- topic subtitle: `swimlane preset (3 lane 自動)` → `Client / Service / Event 3 lane 自動配置 (auth flow demo)`

### presetClassDiagram
- eyebrow 3 card 全てで「クラス」 反復 → `Entity / Aggregate Root / Value Object` 等差別化 or eyebrow なし

### presetSequence
- topic subtitle: `sequence preset (auth fl)` → `sequence preset (認証 flow: User → API → DB → 200)`

### patternFanOut
- phase "fanout" body: `Dispatcher が 3 worker に並列分配` → `Dispatcher が 1 job を 3 worker に並列 dispatch (round-robin)、 各 worker が独立処理`

### patternPassthrough
- API Gateway subtitle: `粒子が貫通` → `Client → Service を relay (proxy pattern)`

### apiCall
- subtitle: `REST API GET` → `Handler が DB へ SELECT → 200 JSON 返却`

### jwtAuth
- subtitle: `JWT auth` → `login → JWT issue → Bearer で API アクセス`
- phase name: `login` → `credentials-verify`、 `token` → `issue-token`、 `access` → `bearer-access`

### textDslSequence
- subtitle: `API call (DSL)` → `Text DSL 6 行で書ける最小 sequence`
- phase name: `step1` → `request`、 `step2` → `fetch`

### kindActor
- value: `100` → `42 users` or 削除して `subtitle: "id=42"`

### kindFunction
- subtitle: `Service 内の処理` → `-> Result<Order, ValidationError>` or `auth check + persist`

### styleSolid
- topic subtitle: `solid / accent` → `solid line + arrow head (edge の default style)`

### toneAccent
- topic subtitle: `solid / accent` → `accent tone (主張色、 dark navy)`
- (engine 側 accent color 修正が必要だが、 subtitle だけでも identity 明示)

---

## 次 iteration

修正後 dragon-diagram-reviewer 再 spawn、 verdict PASS 目指す。 cdl engine 側 80% は別 sprint で対応 (別 Issue 起票候補)。
