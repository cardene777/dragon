# Spec Review Report — editor-drag-drop

Generated: 2026-07-16T20:55Z
Skill: /kiwa-review --mode spec-review
Target: apps/playground-spa/tests/spec/integration/test-spec-editor-drag-drop.e2e.ja.md
Reviewer: independent agent (kiwa-review)

## 1. 判定サマリ

| 軸 | スコア | weight | 重み付き | 根拠 |
|---|---|---|---|---|
| 1. 観点網羅 | 9/10 | 0.30 | 2.70 | 11 catalog 観点中 10 選択、 権限のみ「authn/role なし」 で妥当除外、 独自「12. UI feature 網羅」 追加は SSOT 準拠 (`kiwa-design` Step 1.5) |
| 2. TC 件数妥当性 | 6/10 | 0.20 | 1.20 | **総合リスク = 高** (影響度=高 かつ 発生確率=中 の risk 項目 = 2 件 = 80 parts 個別 round-trip / SAMPLES regression) に該当するが、 観点あたり 3 TC 未満が 5 観点 (異常系=2 / 入力バリデーション=2 / 冪等性=2 / 性能=2 / セキュリティ=2)、 SSOT 「高リスク module は観点あたり 3+」 未達 |
| 3. 優先度妥当性 | 7/10 | 0.20 | 1.40 | P0 20 / P1 14 / P2 9 / P3 3 = 46 (spec は 45 と記載、 count drift = 1、 単純カウント齟齬)、 wave amplitude 修正 (parts 66/73、 TC-035/036) が P1 は low、 未 verify 新 code path なので P0 昇格妥当 |
| 4. 入力 / 期待結果の具体性 | 7/10 | 0.20 | 1.40 | 大半 TC は具体値、 3 件が abstract 残存 = TC-016 「throw なし」 / TC-025 「drag state cleanup」 / TC-034 「text 判読可 (contrast ratio 基準なし)」 |
| 5. 不足している仕様 section の使い方 | 7/10 | 0.10 | 0.70 | 5 bullet 明示 + 別 Issue 候補記述で構造は良、 だが Issue 番号紐付け 0 件、 result-review 軸 5 = 0 に相当し将来 critical |
| **Weighted Score** | | 1.00 | **7.40 / 10** | (7.0 以上で **PASS**) |

**判定 — ✅ PASS (但し major 2 件 + minor 3 件、 実装前修正推奨)**

軸 2 の「高リスク module で観点あたり 3+」 SSOT 違反が major、 軸 5 の「後追い項目 Issue 化」 が critical to major、 その他 minor。 weighted score は PASS 閾値超えているが、 major 2 件を実装前に修正するのが望ましい。

## 2. critical / major 指摘

### M1: 総合リスク = 高 判定と TC 密度不足 (major)

- **場所**: `## 主な品質リスク` section + `## テストケース一覧` section
- **詳細**: 「主な品質リスク」 表で 影響度=高 の項目が 2 件 (80 parts round-trip / SAMPLES regression)、 かつ 発生確率=中 のため kiwa-design SSOT の総合リスク判定で「高」 に該当する (`references/risk-criteria.md` § 優先度導出)。 高リスク module では観点あたり 3+ TC が SSOT。 現状の TC 密度:
  - 異常系: 2 件 (TC-019 破損 marker + TC-020 unknown partId) — 3 未達
  - 入力バリデーション: TC-023/024 は search filter test で真の validation ではない、 実質 0-1 件 — 3 未達
  - 冪等性: 2 件 (TC-009 同 parts 2 度 + TC-022 samples 経由復帰) — 3 未達
  - 性能: 2 件 (TC-028 大 JSON parse + TC-029 80 parts populate) — 3 未達
  - セキュリティ: 2 件 (TC-030 XSS + TC-031 prototype pollution) — 3 未達
- **改善案**: 5 観点で最低 1 TC ずつ (合計 5 TC) を追加、 または「総合リスク = 中」 と再判定して「主な品質リスク」 section を修正。 追加 TC の候補:
  - **異常系 TC-046** = marker text で `nodes` field 型が array でない (`{"id":"x","nodes":"invalid"}`) → deserializePart null 返却 + textDslToDiagram fallback で parse error 表示
  - **入力バリデーション TC-047** = CodeMirror で `#!parts\n{"id": "x", "nodes": []}\n\nextra text` (JSON 後に余計な text) → JSON.parse throw → error 表示
  - **冪等性 TC-048** = wave-gauge drop → 手編集で 1 文字修正 → 元 partId で drop 再実行、 修正が上書きされる (REPLACE の冪等性で最終 state が predictable)
  - **性能 TC-049** = 80 parts 連続 drop (500ms interval × 80 = 40s)、 memory leak なし + editor 応答性維持
  - **セキュリティ TC-050** = URL hash に悪意 payload `/editor#preset=<script>` を注入、 script 実行なし + fallback message 表示

### M2: 後追い項目 5 件が Issue 化されていない (major、 result-review 軸 5 = 0 に相当)

- **場所**: `## 不足している仕様` section (5 bullet)
- **詳細**: 5 件全てが「別 Issue 候補」「別 Issue で検討」 と記述、 Issue 番号紐付け (`#NNN`) が 0 件。 kiwa-review SSOT の result-review 軸 5 では引用率 = 0 で critical 警告発火、 spec-review 段階でも同 pattern を先取り指摘する。
- **改善案**: 以下 5 件を Linear + GitHub 起票 (dual-issue helper 経由)、 spec bullet 末尾に Issue 番号追記。
  1. cross-browser test (Chromium 以外 Firefox / Safari) → 別 Issue = playwright.config projects 追加
  2. mobile / touch 対応 → 既に decision-log で scope 外明示、 別 Issue 未起票なら起票 (or scope 外を明記して bullet 削除)
  3. JSON diff 見づらさ緩和 → 既存 MERGE Issue に統合 or 独立 Issue
  4. CodeMirror history + setSrc の undo 検証 → 別 Issue = TC-046 として次 iteration に追加
  5. parts-serializer vitest infra (playground-spa 用 vitest config or dragon package 移設) → 別 Issue

## 3. minor 指摘 (参考)

### m1: TC-016 の期待結果 abstract

- **場所**: `## テストケース一覧` TC-016 (visualValidate warnings 反映)
- **詳細**: 「`v4-editor-warnings` 表示 or 無し (throw なし)」 は「throw なし」 だけが具体、 「表示 or 無し」 の判定不明。 実装依存で正解が定まらない。
- **改善案**: 「wave-gauge parts で visualValidate → warnings.length は 0 か or 対応 axis で 1+」 のように expected を数値化、 or 「HIDDEN_WARNING_AXES filter 後の warnings.length を assert 対象」 と明記。

### m2: TC-025 の 「drag state cleanup」 抽象

- **場所**: TC-025 (drag 中に別 samples click)
- **詳細**: 「drag state cleanup」 の具体基準なし、 dropOver state / dataTransfer / activeSample の 3 state のどれを cleanup するのか未明示。
- **改善案**: 「samples click 後に `.v4-editor-stage.drop-over` class が存在しないこと + activeSample が sample.label に切替」 に修正。

### m3: TC-034 の contrast ratio 基準なし

- **場所**: TC-034 (dark mode palette)
- **詳細**: 「dark palette 適用、 text 判読可」 の「判読可」 は WCAG 2.1 AA contrast 4.5:1 相当を想定と思われるが明記なし。
- **改善案**: 「computed style で `color` と `background-color` を取得し、 contrast ratio ≥ 4.5:1 を assert (chroma-js or 自前 calc helper 経由)」 or 「visual snapshot diff (a11y layer に切出)」 に修正。 現状の P3 では明確な pass 基準がないため意味薄。

### m4: 優先度 count drift 45 vs 46

- **場所**: spec top「45 TC」 記述 vs TC 表 (P0 20 + P1 14 + P2 9 + P3 3 = 46) + Layer 2 記述「35 件を Playwright」+「8 件を Vitest」 = 43
- **詳細**: 数字が 3 通り (45 / 46 / 43)、 単純カウント齟齬。
- **改善案**: TC-001 〜 TC-045 を再カウント (実際は 45)、 P0-P3 分類も再集計、 Layer 2 分担 count (kiwa-e2e = TC 数 / kiwa-vitest = TC 数) も再集計。

### m5: wave amplitude 修正 (parts 66/73) は P0 昇格妥当

- **場所**: TC-035 / TC-036
- **詳細**: 型修正で `amplitude: "{amp}"` (string template、 typecheck error) → `amplitude: 100` (number 固定) にした 2 parts は既存 60 に対して振る舞い変更のある新 code path、 render 未 verify で P0 が妥当。
- **改善案**: TC-035 / 036 の Priority を P1 → P0 に昇格 (但し M1 で観点密度優先の場合は現状維持でも可)。

## 4. 追加すべき test 提案 (spec-review でも列挙する枠)

M1 の 5 追加 TC (TC-046 〜 TC-050) が最優先。 その他:

| 観点 | 提案 TC | 理由 |
|---|---|---|
| 状態遷移 | TC-051 = parts drop 後 samples tab に切替、 preview が SAMPLES active state に戻るか | 現状 samples click で src だけ切替、 tab state と activeSample との整合未 verify |
| 回帰 | TC-052 = handleAutoFix + `#!parts` marker 混在 (marker 状態で warnings 出た時 auto-fix ボタン挙動) | escape hatch と handleAutoFix の相互作用未 verify |
| 単体 | TC-053 = serializePart の JSON.stringify indentation (2 space) 一貫性 | LLM parse 側 (別 skill) が indent 依存する可能性 |

## 5. 総評

45 TC / 11 観点 (+UI feature 網羅 12) で網羅性は高い、 UI feature 一覧 12 element の TC 紐付けも SSOT 準拠。 一方で「総合リスク = 高」 の観点密度 3+ SSOT 違反が 5 観点で major、 特に 入力バリデーション が実質 0-1 件は 手編集 JSON 破損経路 (M1 TC-046/047 候補) の cover 不足で実運用リスク大。

**推奨 next action** = spec に M1 の 5 TC + m1-m3 の abstract 修正 + m4 count 是正を反映 (10-15 分)、 その後 Layer 2 実装 (kiwa-e2e + kiwa-vitest) に進む。 major 2 件を無視して Layer 2 直接開始も可能だが、 result-review 軸 5 で critical 警告が確実に発火する。

**Chain return 提案** = 「spec 修正 → 再 design」 or 「Layer 2 直接開始 (major 未解消のまま)」 の 2 択を user に AskUserQuestion で確認する。 spec author (kiwa-design) と reviewer (kiwa-review) が独立 agent (今回は main session 内で疑似分離) のため、 修正判断は spec author 側 (main session) が行う。
