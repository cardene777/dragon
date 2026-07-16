# test-spec-editor-drag-drop.e2e (CAR-1646)

- module: editor-drag-drop
- layer: e2e-generic (Playwright + @kiwa-test/e2e、 非 web3 browser e2e)
- doc-language: ja
- source: PR #413 / Linear CAR-1646

## 対象機能

dragon editor (`apps/playground-spa/src/components/CdlEditor.tsx`) の 3 pane 構造に新規追加した「パーツ tab drag-and-drop 経路」。

- 左 sidebar tab (SAMPLES 12 diagram / パーツ 80 個) 2 分割 + parts lazy import
- native HTML5 drag events で sidebar item → preview canvas に drag
- drop で `#!parts` marker + `JSON.stringify(CdlDiagram)` に text buffer を REPLACE
- CdlEditor parse pipeline が marker 検出時 textDslToDiagram を bypass、 `JSON.parse` した CdlDiagram を CdlDiagramView に直接渡す
- click fallback で drag が使えない環境でも同 REPLACE semantic 動作
- parts.cdl.ts の 60 → 80 拡張 (Round 5 state bind pattern 20)、 `PARTS_COUNT_ESTIMATE = 80` 同期

## 仕様の要約

主要要素。

- 変更 file 6 + 1 追加 helper file = CdlEditor.tsx / parts-serializer.ts (新規) / parts.cdl.ts / catalog-items.ts / editor.css / editor-drag-drop.spec.ts (baseline 5 test)
- `#!parts` marker text form = 1 行目 `#!parts` + 2 行目以降 `JSON.stringify(diagram, null, 2)`
- parts.cdl.ts の 80 diagram は全て `.state() + .tween()` を持つ dynamic parts、 20 追加分は state bind pattern demo (counter → radius、 2 state mirror、 cascade、 template chain 等)
- Playwright infra は既存 `apps/playground-spa/playwright.config.ts` (baseURL 4323 / workers 1) を再利用

決定事項 (decision-log 4 件、 `~/projects/claude-memory/decisions/personal/decision-log/2026-07-16-dragon-editor-*.md`)。

- drag source = parts.cdl.ts 60 (80 に拡張)、 配置 semantic = lane / stack ベース
- drag lib = native HTML5 drag events、 DSL patch = CodeMirror text patch (parts 経路は escape hatch に override)
- drop semantic = REPLACE (MERGE は別 Issue で後続 3-4 PR 分割)
- parts drop = `#!parts` marker + JSON escape hatch (parser 未対応の `shape / w / h / dyn-*` field 回避経路)

## UI feature 一覧 (Step 1.5 grep 結果)

`apps/playground-spa/src/components/CdlEditor.tsx` を grep して列挙。

| element | data-testid / class | 判定要件 | 対応 TC |
|---|---|---|---|
| samples tab button | class `v4-editor-side-tab` + `aria-selected=true/false` | default active、 パーツ tab click で inactive 遷移 | TC-004 / TC-005 |
| パーツ tab button | `data-testid="editor-parts-tab"` | click で parts tab に切替、 lazy import trigger | TC-004 / TC-005 |
| parts panel | `data-testid="editor-parts-panel"` | パーツ tab active 時 visible | TC-006 |
| parts item button | `data-testid="editor-part-item-{partId}"` + `draggable=true` + `data-part-id={partId}` | drag source、 click fallback、 grab cursor | TC-006 〜 TC-015 (loop) |
| preview stage | `data-testid="editor-preview-stage"` | drop target、 drag over で `drop-over` class 付与 | TC-011 / TC-013 |
| drop overlay | class `v4-editor-drop-overlay` | drag over 中 visible、 dragleave / drop で非表示 | TC-014 |
| drop hint | class `v4-editor-drop-hint` role=status | drop 成功後 6 秒間 visible、 unknown partId で error hint | TC-013 / TC-020 |
| search input | class `v4-editor-search` | samples / parts 両 tab で共用、 filter 動作 | TC-023 |
| CodeMirror content | class `.cm-content` | text buffer の innerText 取得経路 | TC-007 〜 TC-018 |
| preview SVG | `.v4-editor-preview svg` | render 反映確認 | TC-015 |
| warnings panel | class `v4-editor-warnings` | visualValidate 結果表示 | TC-016 |

## 主な品質リスク

| リスク項目 | 影響度 | 発生確率 | 根拠 |
|---|---|---|---|
| 80 parts 個別 round-trip 失敗 (JSON.parse で throw / render 失敗) | 高 | 中 | 2 parts のみ既存 test で assert、 残 78 parts 未検証、 特に「総合 story parts」 は 7 state 5 phase で JSON 200+ 行 |
| 既存 SAMPLES / URL hash `#preset=X` 経路 regression | 高 | 中 | sidebar 構造を `<details>` → tab に refactor、 samples tab active default 遷移や preset hash 経路の破壊可能性 |
| CodeMirror history に setSrc 反映されず undo 不可 | 中 | 高 | `@uiw/react-codemirror` controlled 経路で外部 setSrc は history に載らない可能性、 undo 期待の user 動作破綻 |
| 大 JSON (200+ 行) での parse debounce 遅延 / render 阻害 | 中 | 中 | debounce 300ms 後 JSON.parse + visualValidate + render の pipeline 全体で 1 秒超えると UX 悪化 |
| `#!parts` marker 手編集破壊時の error 表示不明瞭 | 中 | 高 | user が JSON 途中で `,` 削って壊す想定、 現状 message は 1 種類だけ |
| dark mode で sidebar tabs / drop overlay の palette 未定義 | 低 | 中 | editor.css は `--v4-brand` / `--v4-ink` 変数依存、 dark theme override 未確認 |
| drag simulation の cross-browser 挙動差異 (Chromium / Firefox / Safari) | 中 | 低 | native HTML5 drag events は browser 実装差あり、 dataTransfer 保持挙動が異なる |
| parts 66 (wave level 2-phase) / 73 (level+color combo) の wave amplitude 修正 render | 中 | 低 | `amplitude` を number 固定に変更、 render 動作は未目視 |
| dnd (drag) 中に editor が別 keyboard input を受けた時の race | 低 | 低 | 通常 user 操作では発生しないが 2 手同時 input で state 不整合の可能性 |
| security = JSON.parse で malicious payload が embedded (XSS 経路) | 低 | 低 | parts.cdl.ts は自 workspace 由来で外部由来なし、 但し将来 URL 経由 import 時に問題化 |

## 推奨テスト構成

3 layer 並置。

- **e2e-generic (Playwright + @kiwa-test/e2e)** = 主軸、 UI drag / drop / render の behavior 全体、 全 TC の 70% 以上
- **unit (Vitest)** = parts-serializer.ts の 3 pure function を単体 verify、 全 TC の 15%
- **visual (playwright screenshot diff、 optional)** = drop overlay animation / dark mode / drag cursor grab の visual 一貫性、 全 TC の 15%

CI 実行順 = unit → e2e → (visual は user 手動起動)、 CI 総所要時間 e2e 側 90-120 秒目安。

## テスト観点一覧

以下 11 観点から本 module 該当を選択。

| # | 観点 | 適用 | 理由 |
|---|---|---|---|
| 1 | 正常系 | ✅ 常に | drag → drop → render の happy path |
| 2 | 異常系 | ✅ | 破損 JSON marker / 存在しない partId / drop target 外 |
| 3 | 境界値 | ✅ | 80 parts 全件 loop / 最大 JSON size / 最小 shape / 0 state parts |
| 4 | 状態遷移 | ✅ | samples ↔ parts tab 遷移 / marker あり ↔ なし text buffer 遷移 |
| 5 | 権限 | ❌ | authn / role なし機能 |
| 6 | 入力バリデーション | ✅ | 手編集 JSON の syntax / schema 検証 |
| 7 | 冪等性 | ✅ | 同 parts 2 度 drop で同 text 生成 |
| 8 | 並行処理 | ✅ | drag 中に別 samples click / 2 tab 高速切替 / debounce 中の再入力 |
| 9 | 性能 | ✅ | 大 JSON parse 遅延 / 80 parts 一覧 render 時間 |
| 10 | セキュリティ | ✅ | dataTransfer 経由 XSS 面 / JSON.parse prototype pollution 面 |
| 11 | 回帰 | ✅ | 既存 SAMPLES tab / URL hash `#preset=X` / handleAutoFix 経路 |
| 12 | UI feature 網羅 | ✅ | 上記 UI feature 一覧 の 12 element を TC 紐付け |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| TC-001 | 正常系 default 表示 | `/editor` 初回 goto | networkidle 待機 | SAMPLES tab active、 CodeMirror に SAMPLES[0] code、 preview SVG render | P0 | yes | live | /editor |
| TC-002 | 正常系 preview SVG 初回 render | `/editor` load 直後 | 800ms 待機 | `.v4-editor-preview svg` visible | P0 | yes | live | /editor |
| TC-003 | 正常系 パーツ tab click で切替 | samples tab active | `[data-testid="editor-parts-tab"]` click | パーツ tab `aria-selected=true`、 samples tab `aria-selected=false` | P0 | yes | live | /editor |
| TC-004 | 状態遷移 samples ↔ parts 双方向 | samples default | パーツ click → samples click | 各 click 後 tab active 遷移 + search input 維持 | P1 | yes | live | /editor |
| TC-005 | 正常系 パーツ tab lazy import で 80 parts 流入 | パーツ tab active | 5000ms 以内待機 | `[data-testid^="editor-part-item-"]` の count が 80 以上 | P0 | yes | live | /editor |
| TC-006 | 境界値 全 80 parts 個別 click で REPLACE round-trip (loop) | パーツ tab active | 80 parts 各 1 click → 500ms 待機 | 各 parts で text 先頭 `#!parts` + `"id": "<partId>"` 含む + JSON.parse に throw なし + preview SVG 存在 | P0 | yes | live | /editor |
| TC-007 | 正常系 click で REPLACE + marker text | パーツ tab active | `editor-part-item-parts-wave-gauge` click | text 先頭 `#!parts`、 JSON body に `"id": "parts-wave-gauge"` `"nodes"` `"phases"` | P0 | yes | live | /editor |
| TC-008 | 正常系 Round 5 bind parts click | パーツ tab active | `editor-part-item-parts-bind-counter-radius` click | text に `"id": "parts-bind-counter-radius"` | P0 | yes | live | /editor |
| TC-009 | 冪等性 同 parts 2 度 click で同 text | パーツ tab active | wave-gauge を 2 度 click | 1 度目と 2 度目の text buffer が完全一致 | P1 | yes | live | /editor |
| TC-010 | 正常系 native drag simulation (DragEvent dispatch) | パーツ tab active | dragstart → dragover → drop を dispatchEvent | text 先頭 `#!parts` + 対象 partId 含む | P0 | yes | live | /editor |
| TC-011 | 状態遷移 dragover で drop-over class 付与 | パーツ tab active | dragover event dispatch | `.v4-editor-stage.drop-over` selector match | P1 | yes | live | /editor |
| TC-012 | 状態遷移 dragleave で drop-over class 除去 | drop-over active | dragleave event (currentTarget 外) | `.v4-editor-stage.drop-over` selector unmatch | P1 | yes | live | /editor |
| TC-013 | 正常系 drop 成功後の hint message 表示 | パーツ tab active | drop 経由 REPLACE | `.v4-editor-drop-hint` visible + parts title 含む | P1 | yes | live | /editor |
| TC-014 | 状態遷移 drop overlay の on/off | dragover 中 | drop 実行 | drop-overlay 非表示 (drop event で setDropOver(false)) | P1 | yes | live | /editor |
| TC-015 | 正常系 marker text で preview SVG render | wave-gauge click | 800ms 待機 | `.v4-editor-preview svg` visible | P0 | yes | live | /editor |
| TC-016 | 正常系 visualValidate warnings 数値化 | wave-gauge click | 800ms 待機 → warnings 取得 | HIDDEN_WARNING_AXES filter 後の `.v4-editor-warning-item` count が 0 (wave-gauge 単体 shape で validation error なし)、 throw なし | P2 | yes | live | /editor |
| TC-017 | 回帰 SAMPLES tab 既存動作 | samples tab active | SAMPLES[1] `注文チェックアウト (sequence)` を click | CodeMirror text が sequence YAML DSL に切替 + preview render | P0 | yes | live | /editor |
| TC-018 | 回帰 URL hash `#preset=<slug>` 経路 | `/editor#preset=sequence` goto | 1500ms 待機 | SAMPLES から slug=sequence 一致 sample の code が load | P0 | yes | live | /editor#preset=sequence |
| TC-019 | 異常系 破損 marker text の error 表示 | 手動 setSrc(`#!parts\n{ invalid`) | 400ms 待機 | error panel に「JSON が invalid」 message 表示 | P1 | yes | live | /editor |
| TC-020 | 異常系 存在しない partId で drop | パーツ tab active | drop に fake partId `parts-doesnotexist` | drop hint に「parts "..." が見つかりません」 error message | P1 | yes | live | /editor |
| TC-021 | 状態遷移 marker あり ↔ なし text buffer | wave-gauge drop 後 | text buffer を hand-edit で `#!parts` 削除 (setSrc via `.cm-content` type simulation) | 通常 textDslToDiagram 経路に fallback、 parse error or valid render | P1 | yes | live | /editor |
| TC-022 | 冪等性 samples 切替後の parts 再 click | wave-gauge active | samples[0] click → parts tab → wave-gauge click | 2 度目の wave-gauge text と 1 度目が一致 | P2 | yes | live | /editor |
| TC-023 | 境界値 search input で parts filter | パーツ tab active | search input に `wave` 入力 | filter された parts のみ表示 (`parts-wave-gauge` 含む) | P2 | yes | live | /editor |
| TC-024 | 境界値 空 search で全 80 parts 復帰 | パーツ tab active + `wave` filter 状態 | search input clear | 80 parts 再表示 | P2 | yes | live | /editor |
| TC-025 | 並行処理 drag 中に別 samples click | パーツ tab で drag 開始 | dragstart 直後に samples tab click | samples tab active + `.v4-editor-stage.drop-over` selector 存在せず + activeSample が sample.label に切替 (drag state cleanup) | P2 | yes | live | /editor |
| TC-026 | 並行処理 高速 tab 切替 | any tab active | パーツ ↔ samples を 5 連続 click | 最後の click に応じた tab active、 crash なし | P2 | yes | live | /editor |
| TC-027 | 並行処理 debounce 中の再入力 | wave-gauge drop 直後 | 300ms 以内に別 parts drop | 最後の drop の text が最終 state | P2 | yes | live | /editor |
| TC-028 | 性能 大 JSON parse 時間 | パーツ tab active | `parts-bind-comprehensive` (7 state 5 phase) click → 800ms 待機 | 800ms 以内に preview SVG 更新完了 | P1 | yes | live | /editor |
| TC-029 | 性能 80 parts 一覧 render 時間 | パーツ tab active | 初回 populate 完了までの時間計測 | 5000ms 以内 (現状 2.5s 実測) | P1 | yes | live | /editor |
| TC-030 | セキュリティ dataTransfer 経由の XSS | パーツ tab active | 悪意 partId `<img src=x onerror=alert(1)>` を dataTransfer.setData 経由で drop | drop hint に文字列そのまま表示 (script 実行なし)、 partId lookup 失敗経路 | P2 | yes | live | /editor |
| TC-031 | セキュリティ JSON prototype pollution 面 | パーツ tab active | setSrc(`#!parts\n{"__proto__": {"polluted": 1}, "id": "x", "nodes": []}`) | parse は成功、 `Object.prototype.polluted` が undefined (JSON.parse は prototype pollution しない仕様確認) | P2 | yes | live | /editor |
| TC-032 | UI feature grab cursor | パーツ tab active | parts item を hover | CSS `cursor: grab` 適用 | P3 | yes | live | /editor |
| TC-033 | UI feature grabbing cursor active | パーツ tab active | parts item を mousedown | CSS `cursor: grabbing` 適用 | P3 | yes | live | /editor |
| TC-034 | UI feature dark mode palette contrast | `html.dark` class 追加 | パーツ tab active + drop overlay 表示 → element の computed `color` + `background-color` 取得 | contrast ratio ≥ 4.5:1 (WCAG 2.1 AA) を chroma-js or 自前 helper で assert (`.v4-editor-side-tab.active` と `.v4-editor-drop-overlay` の 2 element 対象) | P3 | yes | live | /editor |
| TC-035 | 回帰 wave amplitude 修正 (parts 66) | パーツ tab active | `editor-part-item-parts-bind-wave-level-2phase` click | text に `"amplitude": 100` (number 固定) 含む、 render 成功 | P1 | yes | live | /editor |
| TC-036 | 回帰 wave amplitude 修正 (parts 73) | パーツ tab active | `editor-part-item-parts-bind-level-color-combo` click | text に `"amplitude": 100` + `"fill": "{hue}"` 含む、 render 成功 | P1 | yes | live | /editor |
| TC-037 | 単体 serializePart output format | parts-serializer.ts unit | `serializePart({id:"x",...})` を呼出 | 先頭 `#!parts\n` + `JSON.stringify(diagram, null, 2)` 一致 | P0 | yes | unit | apps/playground-spa/src/lib/parts-serializer.ts |
| TC-038 | 単体 isPartsMarker true 判定 | parts-serializer.ts unit | `isPartsMarker("#!parts\n{}")` / `isPartsMarker("  \n#!parts")` (trimStart 経路) | true / true | P0 | yes | unit | apps/playground-spa/src/lib/parts-serializer.ts |
| TC-039 | 単体 isPartsMarker false 判定 | parts-serializer.ts unit | `isPartsMarker("title: foo")` / `isPartsMarker("")` | false / false | P0 | yes | unit | apps/playground-spa/src/lib/parts-serializer.ts |
| TC-040 | 単体 deserializePart happy | parts-serializer.ts unit | `deserializePart("#!parts\n{\\"id\\":\\"x\\",\\"nodes\\":[]}")` | `{id:"x", nodes:[]}` object | P0 | yes | unit | apps/playground-spa/src/lib/parts-serializer.ts |
| TC-041 | 単体 deserializePart marker 不在で null | parts-serializer.ts unit | `deserializePart("title: foo")` | null | P0 | yes | unit | apps/playground-spa/src/lib/parts-serializer.ts |
| TC-042 | 単体 deserializePart 破損 JSON で null | parts-serializer.ts unit | `deserializePart("#!parts\n{ invalid")` | null (throw なし) | P0 | yes | unit | apps/playground-spa/src/lib/parts-serializer.ts |
| TC-043 | 単体 deserializePart id / nodes 不在で null | parts-serializer.ts unit | `deserializePart("#!parts\n{}")` / `deserializePart("#!parts\n{\\"id\\":\\"x\\"}")` | null / null (nodes 必須) | P0 | yes | unit | apps/playground-spa/src/lib/parts-serializer.ts |
| TC-044 | 単体 round-trip 全 80 parts | parts-serializer.ts unit | 80 parts 全て `deserializePart(serializePart(d))` | 各 parts で id / nodes.length / phases.length が同一 | P0 | yes | unit | apps/playground-spa/src/lib/parts-serializer.ts |
| TC-045 | 回帰 handleAutoFix 経路 | SAMPLES tab active | warning 発生 sample を load → 一括反映 click | text buffer の flow 行に `labelOffsetY` 追記 | P2 | yes | live | /editor |
| TC-046 | 異常系 nodes 型不正 marker | パーツ tab active | setSrc(`#!parts\n{"id":"x","nodes":"invalid"}`) → 400ms 待機 | error panel visible + message に「JSON が invalid」 含む (deserializePart が nodes 型 check で null 返却) | P1 | yes | live | /editor |
| TC-047 | 入力バリデーション marker 後の余計 text | パーツ tab active | setSrc(`#!parts\n{"id":"x","nodes":[]}\n\nextra text`) → 400ms 待機 | error panel visible + JSON.parse throw を catch した message | P1 | yes | live | /editor |
| TC-048 | 冪等性 手編集後の再 drop で REPLACE 冪等 | wave-gauge drop 済 | text buffer で 1 文字修正 → 同 wave-gauge を再 drop | 修正が元 wave-gauge の canonical text に上書きされ、 2 度目 drop の text と初回 drop text が完全一致 | P1 | yes | live | /editor |
| TC-049 | 性能 連続 drop での memory leak なし | パーツ tab active | 80 parts を 200ms interval で 80 回連続 drop | 全 drop 完了、 editor 応答性維持 (`.cm-content` 経由 text 取得可)、 heap 増加が 100MB 未満 (browser performance.memory) | P1 | yes | live | /editor |
| TC-050 | セキュリティ URL hash 悪意 payload | `/editor#preset=<script>alert(1)</script>` goto | 1500ms 待機 | script 実行なし + autoFixMessage panel に「対応する編集可能サンプルは未登録です」 表示 (decodeURIComponent + SAMPLES.find で fallback) | P1 | yes | live | /editor#preset=&lt;script&gt;alert(1)&lt;/script&gt; |
| TC-051 | 状態遷移 parts drop 後 samples tab で activeSample 整合 | wave-gauge drop 済 (activeSample = wave-gauge title) | samples tab click → SAMPLES[0] click | samples tab active、 activeSample が SAMPLES[0].label に切替 + text が SAMPLES[0].code | P2 | yes | live | /editor |
| TC-052 | 回帰 handleAutoFix と marker 混在 | wave-gauge drop 済 (marker text) | warnings 発生させて 一括反映 button click | button disabled or「対応可 0 件」 表示 (marker text には flow: 行なし = auto-fix 対象外) | P2 | yes | live | /editor |
| TC-053 | 単体 serializePart JSON indent 一貫性 | parts-serializer.ts unit | `serializePart(d)` output の JSON body を parse | `JSON.stringify(d, null, 2)` と完全一致 (indent 2 space、 sort なし) | P1 | yes | unit | apps/playground-spa/src/lib/parts-serializer.ts |

## 自動化すべきテスト

優先度順、 M1 追加 TC-046 〜 050 + M4 count 是正 + TC-053 反映。

- **P0 = 20 件** (TC-001 / 002 / 003 / 005 / 006 (80 loop) / 007 / 008 / 010 / 015 / 017 / 018 / TC-037 〜 044) = 主軸 happy path + 全 parts round-trip + 既存経路 regression + unit-level serializer 8 件
- **P1 = 20 件** (TC-004 / 009 / 011 / 012 / 013 / 014 / 016 / 019 / 020 / 021 / 028 / 029 / 035 / 036 / TC-046 / 047 / 048 / 049 / 050 / 053) = 状態遷移 + 異常系 + 性能 + wave amplitude 回帰 + M1 追加 5 件 + serializer indent
- **P2 = 10 件** (TC-022 / 023 / 024 / 025 / 026 / 027 / 030 / 031 / 045 / 051 / 052) = 並行処理 + セキュリティ + search + handleAutoFix 回帰 + parts drop 後 samples 整合 + marker 混在 (実際 11 件、 併記後 P2 内で cross-cutting 分類の重複を含む)
- **P3 = 3 件** (TC-032 / 033 / 034) = grab cursor + dark mode contrast

**合計 = 53 TC** (M1 で +5 TC-046 〜 050、 review 提案 +3 TC-051 〜 053、 base 45 + 8 = 53)。

## Layer 2 分担 (M4 count 是正後)

- **`/kiwa-e2e` (Layer 2 for e2e-generic)** = TC-001 〜 TC-036 + TC-045 〜 TC-052 = 44 件 を Playwright + @kiwa-test/e2e で実装
- **`/kiwa-vitest` (Layer 2 for unit)** = TC-037 〜 TC-044 + TC-053 = 9 件 を Vitest で実装
- **`/kiwa-visual` (optional)** = TC-032 / 033 / 034 を必要に応じて

## 手動確認でよいテスト

- **TC-032 / 033 (grab / grabbing cursor)** = CSS pseudo state、 Playwright での computed style 取得は可能だが実 mouse cursor 変化は headless では確認精度低い、 user 目視 review でよい
- **TC-034 (dark mode palette)** = dark class toggle 経由 Playwright でも確認可、 だが「見づらいかどうか」 の判定は user 感覚、 screenshot 目視 review でよい

## 不足している仕様

M2 指摘 = 5 bullet の Issue 番号紐付けは PR merge 後に user 判断で dual-issue 起票する暫定 TODO。

- **cross-browser** = Chromium で全 test 実行、 Firefox / Safari の drag event 挙動一致は playwright projects config 追加で対応可 (現状 config は `use: { baseURL }` のみで browser 明示なし = chromium default)。 別 Issue で `playwright.config.ts` に projects 追加を検討 (TODO: 後追い)
- **mobile / touch 対応** = decision-log 明示的に scope 外、 別 Issue 待ち (TODO: 後追い)
- **JSON diff の diff 見づらさ緩和** = review-passed marker で「diff 数百行」 と明記、 catalog UI で parts merge 経路 (MERGE Issue) 実装時に緩和検討 (TODO: 後追い、 MERGE Issue に統合予定)
- **CodeMirror history に setSrc 反映されるか (undo 動作)** = @uiw/react-codemirror の controlled 経路仕様の詳細未確認。 現状 spec に undo assert TC がない、 別 Issue で MERGE 検討時に併せて評価 (TODO: 後追い)
- **parts-serializer.ts の vitest test 実行 infra** = 現状 root `vitest.config.ts` の include = `packages/**/test/**`、 playground-spa は含まれず。 unit test 追加時に config 拡張 or dragon package 内配置 に判断が必要。 本 PR 実装 phase で「packages/dragon/test/ に parts-serializer.test.ts を配置 + import path で `../../apps/playground-spa/src/lib/parts-serializer` を参照」 の暫定 pass 経路を採用予定 (TODO: 後追い、 別 Issue で serializer を dragon package 側に正式移設)

## Layer 2 skill 選定

以下 3 経路で実装分担。

- **`/kiwa-e2e` (Layer 2 for e2e-generic)** = TC-001 〜 TC-036 / TC-045 の 35 件を Playwright + @kiwa-test/e2e で実装、 出力 `apps/playground-spa/tests/editor-drag-drop-full.spec.ts` (既存 5 test を包含 or 分離)
- **`/kiwa-vitest` (Layer 2 for unit)** = TC-037 〜 TC-044 の 8 件を Vitest で実装、 出力 `packages/dragon/test/parts-serializer.test.ts` (root vitest config include 対象内に配置)、 但し parts-serializer.ts は `apps/playground-spa/src/lib/` にあるため import path で `../../../apps/playground-spa/src/lib/parts-serializer` を参照 or serializer を dragon package 側に移設して import cleanup
- **`/kiwa-visual` (optional Layer 2 for visual)** = TC-032 / 033 / 034 の cursor / dark mode screenshot diff、 pixelmatch threshold で回帰、 user 明示指示時のみ起動

## 実装 flow

1. `/kiwa-e2e --module editor-drag-drop --input tests/spec/integration/test-spec-editor-drag-drop.e2e.ja.md --lang ja` で e2e spec を Playwright test に変換 → 実装
2. `/kiwa-vitest --module parts-serializer --input tests/spec/integration/test-spec-editor-drag-drop.e2e.ja.md --tc-filter TC-037..TC-044 --lang ja` で unit spec を Vitest test に変換 → 実装
3. 全 test 実行 → `/kiwa-review --mode result-review --module editor-drag-drop --lang ja` で結果総合 review + report 生成
