import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Animation ... phase / state / tween / set / badge の動作。
 */

/** 1. 単 phase + state tween */
export const tweenSimple = diagram("tween-simple", { topic: "tween: 数値線形補間" })
  .lane("l", { x: 0, width: 400 })
  .state("counter", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "数え上げ", value: "{counter}" })
  .phase(
    "p",
    {
      duration: 2500,
      title: "数え上げを滑らかに進める (0 → 100)",
      body: "1 つの段の中で値を 0 から 100 へ滑らかに変える。",
    },
    (p: PhaseBuilder) => p.activate("a").tween("counter", 0, 100).badge("tween 中"),
  )
  .build();

/** 2. 連続 phase で tween 累積 */
export const tweenChain = diagram("tween-chain", { topic: "tween: 連続 phase で累積" })
  .lane("l", { x: 0, width: 400 })
  .state("n", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "合計", value: "{n}" })
  .phase(
    "p1",
    { duration: 2000, title: "初動 (0 → 10)", body: "1 phase 目の tween。" },
    (p: PhaseBuilder) => p.activate("a").tween("n", 0, 10).badge("p1"),
  )
  .phase(
    "p2",
    { duration: 2000, title: "加速 (10 → 50)", body: "前 phase の終端値から続けて tween。" },
    (p: PhaseBuilder) => p.activate("a").tween("n", 10, 50).badge("p2"),
  )
  .phase(
    "p3",
    {
      duration: 2000,
      title: "完了 (50 → 100)",
      body: "最後の段で 100 まで。 そのまま静止して見せる。",
    },
    (p: PhaseBuilder) => p.activate("a").tween("n", 50, 100).badge("p3"),
  )
  .build();

/** 3. set (即時切替) */
export const setSwitch = diagram("set-switch", { topic: "set: 即時切替 (lerp なし)" })
  .lane("l", { x: 0, width: 500 })
  .state("status", { initial: "待機" })
  .node("a", {
    lane: "l",
    stack: 0,
    kind: "function",
    title: "処理",
    subtitle: "状態: {status}",
  })
  .phase(
    "p1",
    {
      duration: 2000,
      title: "待機 → 実行中",
      body: "set で文字列 state を即時切替。 phase 開始の瞬間に値が変わる。",
    },
    (p: PhaseBuilder) => p.activate("a").set("status", "実行中").badge("実行中"),
  )
  .phase(
    "p2",
    {
      duration: 2000,
      title: "実行中 → 完了",
      body: "次の段で完了に切り替える。 tween と違い段階を踏まず一瞬で移る。",
    },
    (p: PhaseBuilder) => p.activate("a").set("status", "完了").badge("完了"),
  )
  .build();

/** 4. badge 動作 */
export const badgePerPhase = diagram("badge-per-phase", { topic: "badge: phase ごと切替" })
  .lane("l", { x: 0, width: 400 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "手順" })
  .phase(
    "p1",
    { duration: 1500, title: "準備中", body: "見出しの札に「準備中」 を出す。" },
    (p: PhaseBuilder) => p.activate("a").badge("準備中"),
  )
  .phase(
    "p2",
    { duration: 1500, title: "処理中", body: "見出しの札を「処理中」 に切り替える。" },
    (p: PhaseBuilder) => p.activate("a").badge("処理中"),
  )
  .phase(
    "p3",
    { duration: 1500, title: "完了", body: "最後の段の札を「完了」 にして、手順の終わりを示す。" },
    (p: PhaseBuilder) => p.activate("a").badge("完了"),
  )
  .build();

/** 5. 数値 tween と文字列 set の併用 */
export const mixedTweenSet = diagram("mixed-tween-set", { topic: "tween + set 併用" })
  .lane("l", { x: 0, width: 500 })
  .state("amount", { initial: 0 })
  .state("phase", { initial: "初期" })
  .node("a", {
    lane: "l",
    stack: 0,
    kind: "function",
    title: "操作",
    subtitle: "段階: {phase}",
    value: "{amount}",
  })
  .phase(
    "p1",
    {
      duration: 2400,
      title: "読込開始 (状態 + 進捗を併走)",
      body: "tween で数値、 set で文字列を同時更新。 1 phase 内で複数 state を制御可能。",
    },
    (p: PhaseBuilder) =>
      p.activate("a").tween("amount", 0, 50).set("phase", "読込中").badge("読込中"),
  )
  .phase(
    "p2",
    { duration: 2400, title: "完了 (状態 + 進捗を仕上げ)", body: "次 phase で完了状態へ。" },
    (p: PhaseBuilder) =>
      p.activate("a").tween("amount", 50, 100).set("phase", "完了").badge("完了"),
  )
  .build();

/**
 * 6. richPipelineDemo = iter 9 wave 9-C 完動 pilot (rich layered animation exemplar)。
 *
 * incremental step 1-6 で全 element (dyn-wave / phase 5 / state 7 / readout 2 / lane 3 / edge 4 + activate 連鎖) が動作確認済、 動作 baseline は step6 compare で verified。
 *
 * 5 段を横 1 列に置くと幅 2002 world / 縦横比 6.3 で潰れるため、 3 列 2 段に折り返す。
 * 帯 id は内容ではなく位置を表す (段をまたぐと 1 つの帯に別の段の節が入るため)。
 *
 * 5 layer 同時発火 (rich judgment 5/5 pass):
 * - layer 1 = arrow が step 1-5 順に色付き (edge activate 連鎖)
 * - layer 2 = rectangle border が光る (node activate で strokeWidth 3 + accent)
 * - layer 3 = rectangle 内 wave 高さで進捗 % 表示 (dyn-wave level tween)
 * - layer 4 = 全体進捗 (readout.percentRing)
 * - layer 5 = badge phase 名切替
 *
 * theme = 「5段階 CSV batch import pipeline (500 record 処理) の rich 進捗表示」。
 * mermaid では静止 5 rectangle + 5 arrow しか描けない、 dragon はこの 5 layer 同時発火で「見てて楽しい + 理解しやすい」 を両立する。
 */
export const richPipelineDemo = diagram("animation-rich-pipeline-demo", {
  topic: "5段階のCSV処理の進捗",
})
  .lane("col1", { x: 0, width: 190 })
  .lane("col2", { x: 230, width: 190 })
  .lane("col3", { x: 460, width: 190 })
  .state("s1", { initial: 0 })
  .state("s2", { initial: 0 })
  .state("s3", { initial: 0 })
  .state("s4", { initial: 0 })
  .state("s5", { initial: 0 })
  .state("total", { initial: 0 })
  .state("processed", { initial: 0 })
  .node("r1", {
    lane: "col1",
    stack: 0,
    kind: "dyn-wave",
    title: "検証",
    subtitle: "{s1}%",
    w: 140,
    h: 200,
    shape: {
      kind: "wave",
      level: "{s1}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 6,
      fill: "#4e9dc4",
    },
  })
  .node("r2", {
    lane: "col1",
    stack: 1,
    kind: "dyn-wave",
    title: "変換",
    subtitle: "{s2}%",
    w: 140,
    h: 200,
    shape: {
      kind: "wave",
      level: "{s2}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 6,
      fill: "#4e9dc4",
    },
  })
  .node("r3", {
    lane: "col2",
    stack: 0,
    kind: "dyn-wave",
    title: "加工",
    subtitle: "{s3}%",
    w: 140,
    h: 200,
    shape: {
      kind: "wave",
      level: "{s3}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 6,
      fill: "#4e9dc4",
    },
  })
  .node("r4", {
    lane: "col2",
    stack: 1,
    kind: "dyn-wave",
    title: "重複排除",
    subtitle: "{s4}%",
    w: 140,
    h: 200,
    shape: {
      kind: "wave",
      level: "{s4}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 6,
      fill: "#4e9dc4",
    },
  })
  .node("r5", {
    lane: "col3",
    stack: 0,
    kind: "dyn-wave",
    title: "保存",
    subtitle: "{s5}%",
    w: 140,
    h: 200,
    shape: {
      kind: "wave",
      level: "{s5}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 6,
      fill: "#22c55e",
    },
  })
  .edge("r1", "r2", { id: "e12", label: "変換", tone: "info" })
  .edge("r2", "r3", { id: "e23", label: "加工", tone: "info" })
  .edge("r3", "r4", { id: "e34", label: "排除", tone: "info" })
  .edge("r4", "r5", { id: "e45", label: "確定", tone: "success" })
  .readout.percentRing("ring", { source: "total", max: 500, label: "全体進捗" })
  .readout.countup("cu", { source: "processed", unit: " 行", label: "処理済", decimals: 0 })
  .phase("p1", { duration: 1500, title: "検証中", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("r1")
      .tween("s1", 0, 100)
      .tween("total", 0, 100)
      .tween("processed", 0, 100)
      .badge("検証"),
  )
  .phase("p2", { duration: 1500, title: "変換中", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("r1", "r2", "e12")
      .tween("s2", 0, 100)
      .tween("total", 100, 200)
      .tween("processed", 100, 200)
      .badge("変換"),
  )
  .phase("p3", { duration: 1500, title: "加工中", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("r1", "r2", "r3", "e12", "e23")
      .tween("s3", 0, 100)
      .tween("total", 200, 300)
      .tween("processed", 200, 300)
      .badge("加工"),
  )
  .phase("p4", { duration: 1500, title: "排除中", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("r1", "r2", "r3", "r4", "e12", "e23", "e34")
      .tween("s4", 0, 100)
      .tween("total", 300, 400)
      .tween("processed", 300, 400)
      .badge("排除"),
  )
  .phase("p5", { duration: 1500, title: "保存完遂", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("r1", "r2", "r3", "r4", "r5", "e12", "e23", "e34", "e45")
      .tween("s5", 0, 100)
      .tween("total", 400, 500)
      .tween("processed", 400, 500)
      .badge("保存"),
  )
  .build();

/**
 * 7. richServerLoadDashboard = 「サーバー負荷 dashboard」 rich exemplar (iter 9 wave 9-E)。
 *
 * theme = 「4 台のサーバーの CPU 使用率が朝ピーク → 昼安定 → 夜スケールダウン と変化する時系列」。
 * dyn-arc gauge を parts の使用機会 (「割合 / 目標達成率 / 針で示す状態変化」) 逆算で選定 = 使用率 % を扇形 sweep で表現。
 *
 * 5 layer 同時発火:
 * - layer 1 = 4 arc gauge が並列に 0-100% で sweep (angle tween)
 * - layer 2 = 各 server node の active/inactive (負荷高い server は active border)
 * - layer 3 = 平均負荷 readout.gauge (0-100)
 * - layer 4 = alert badge (低 = 平常運転 / 中 = 警戒 / 高 = 危険 / 復旧 = 通常)
 * - layer 5 = 稼働 hour readout.countup
 */
export const richServerLoadDashboard = diagram("animation-rich-server-load-dashboard", {
  topic: "4台のサーバーのCPU負荷 (朝ピーク→昼安定→夜スケールダウン→深夜アイドル)",
})
  .lane("l1", { x: 0, width: 200 })
  .lane("l2", { x: 260, width: 200 })
  .lane("l3", { x: 520, width: 200 })
  .lane("l4", { x: 780, width: 200 })
  .state("cpu1", { initial: 0 })
  .state("cpu2", { initial: 0 })
  .state("cpu3", { initial: 0 })
  .state("cpu4", { initial: 0 })
  .state("avgLoad", { initial: 0 })
  .state("uptimeHour", { initial: 0 })
  .node("srv1", {
    lane: "l1",
    stack: 0,
    kind: "dyn-arc",
    title: "サーバー 1",
    subtitle: "{cpu1}%",
    w: 180,
    h: 180,
    shape: {
      kind: "arc",
      angle: "{cpu1}",
      sweepMax: 100,
      outerRadius: 70,
      innerRadius: 52,
      fill: "#4e9dc4",
    },
  })
  .node("srv2", {
    lane: "l2",
    stack: 0,
    kind: "dyn-arc",
    title: "サーバー 2",
    subtitle: "{cpu2}%",
    w: 180,
    h: 180,
    shape: {
      kind: "arc",
      angle: "{cpu2}",
      sweepMax: 100,
      outerRadius: 70,
      innerRadius: 52,
      fill: "#4e9dc4",
    },
  })
  .node("srv3", {
    lane: "l3",
    stack: 0,
    kind: "dyn-arc",
    title: "サーバー 3",
    subtitle: "{cpu3}%",
    w: 180,
    h: 180,
    shape: {
      kind: "arc",
      angle: "{cpu3}",
      sweepMax: 100,
      outerRadius: 70,
      innerRadius: 52,
      fill: "#f97316",
    },
  })
  .node("srv4", {
    lane: "l4",
    stack: 0,
    kind: "dyn-arc",
    title: "サーバー 4",
    subtitle: "{cpu4}%",
    w: 180,
    h: 180,
    shape: {
      kind: "arc",
      angle: "{cpu4}",
      sweepMax: 100,
      outerRadius: 70,
      innerRadius: 52,
      fill: "#22c55e",
    },
  })
  .readout.gauge("avgG", {
    source: "avgLoad",
    min: 0,
    max: 100,
    color: "#f97316",
    label: "平均負荷 %",
  })
  .readout.countup("uptimeCU", {
    source: "uptimeHour",
    unit: " 時",
    label: "稼働時間",
    decimals: 0,
  })
  .phase("p1", { duration: 2000, title: "朝ピーク (7:00)", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("srv1", "srv2", "srv3", "srv4")
      .tween("cpu1", 0, 85)
      .tween("cpu2", 0, 88)
      .tween("cpu3", 0, 92)
      .tween("cpu4", 0, 78)
      .tween("avgLoad", 0, 86)
      .tween("uptimeHour", 0, 7)
      .badge("朝ピーク"),
  )
  .phase("p2", { duration: 2000, title: "昼安定 (12:00)", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("srv1", "srv2", "srv3", "srv4")
      .tween("cpu1", 85, 55)
      .tween("cpu2", 88, 58)
      .tween("cpu3", 92, 62)
      .tween("cpu4", 78, 48)
      .tween("avgLoad", 86, 55)
      .tween("uptimeHour", 7, 12)
      .badge("昼安定"),
  )
  .phase("p3", { duration: 2000, title: "夜スケールダウン (20:00)", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("srv1", "srv2", "srv3", "srv4")
      .tween("cpu1", 55, 30)
      .tween("cpu2", 58, 32)
      .tween("cpu3", 62, 35)
      .tween("cpu4", 48, 22)
      .tween("avgLoad", 55, 30)
      .tween("uptimeHour", 12, 20)
      .badge("スケールダウン"),
  )
  .phase("p4", { duration: 2000, title: "深夜アイドル (2:00)", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("srv1", "srv2", "srv3", "srv4")
      .tween("cpu1", 30, 8)
      .tween("cpu2", 32, 10)
      .tween("cpu3", 35, 12)
      .tween("cpu4", 22, 5)
      .tween("avgLoad", 30, 9)
      .tween("uptimeHour", 20, 26)
      .badge("アイドル"),
  )
  .build();

/**
 * 8. richOrderStatusFlow = 「EC 注文の状態遷移」 rich exemplar (iter 9 wave 9-E)。
 *
 * theme = 「1 件の EC 注文が受注 → 決済 → 発送 → 配達 → 完了 の 5 状態を経る process」。
 * dyn-rect を parts の使用機会 (「fill 率で完了度を表現」) 逆算で選定 = 各状態の完了率を rect 縦 fill で表現。
 *
 * 5 layer 同時発火:
 * - layer 1 = 5 rectangle 縦 fill (状態別完了率、 arrow で fill 伝搬)
 * - layer 2 = 状態遷移の edge activate 連鎖 (arrow 順次色付き)
 * - layer 3 = 進捗 readout.percentRing (0-100%)
 * - layer 4 = 経過時間 readout.countup (時)
 * - layer 5 = 状態 badge (受注 → 決済 → 発送 → 配達 → 完了)
 *
 * 5 段を横 1 列に置くと幅 1998 world / 縦横比 6.2 で潰れるため、 2 列 3 段に折り返す
 * (3 列 2 段は線が節を貫くため採らない)。 帯 id は内容ではなく位置を表す。
 */
export const richOrderStatusFlow = diagram("animation-rich-order-status-flow", {
  topic: "EC注文状態遷移 (受注→決済→発送→配達→完了)",
})
  // 帯の間隔を書いておく理由 (cdl#789)。
  // engine は「名札 1 枚が入る隙間」 しか確保しない。 この図は 1 つの隙間に名札を 2 枚以上
  // 置くので元から足りておらず、engine が余分に広げていた分がそれを隠していた。
  // その余分が無くなったので、必要な間隔をここで書く。
  // 422 は engine が `0.42.0` まで実際に取っていた間隔で、図の幅も当時と同じ 687 になる。
  // 210 のままだと `e34` の名札が `e23` の経路を跨ぐ (`edge-label-overlap`)。
  .lane("col1", { x: 0, width: 170 })
  .lane("col2", { x: 422, width: 170 })
  .state("f1", { initial: 0 })
  .state("f2", { initial: 0 })
  .state("f3", { initial: 0 })
  .state("f4", { initial: 0 })
  .state("f5", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("elapsedHour", { initial: 0 })
  .node("st1", {
    lane: "col1",
    stack: 0,
    kind: "dyn-rect",
    title: "受注",
    subtitle: "{f1}%",
    w: 120,
    h: 200,
    shape: { kind: "rect", source: "{f1}", fillMax: 100, orient: "up", fill: "#4e9dc4" },
  })
  .node("st2", {
    lane: "col2",
    stack: 0,
    kind: "dyn-rect",
    title: "決済",
    subtitle: "{f2}%",
    w: 120,
    h: 200,
    shape: { kind: "rect", source: "{f2}", fillMax: 100, orient: "up", fill: "#4e9dc4" },
  })
  .node("st3", {
    lane: "col1",
    stack: 1,
    kind: "dyn-rect",
    title: "発送",
    subtitle: "{f3}%",
    w: 120,
    h: 200,
    shape: { kind: "rect", source: "{f3}", fillMax: 100, orient: "up", fill: "#4e9dc4" },
  })
  .node("st4", {
    lane: "col2",
    stack: 1,
    kind: "dyn-rect",
    title: "配達",
    subtitle: "{f4}%",
    w: 120,
    h: 200,
    shape: { kind: "rect", source: "{f4}", fillMax: 100, orient: "up", fill: "#f97316" },
  })
  .node("st5", {
    lane: "col1",
    stack: 2,
    kind: "dyn-rect",
    title: "完了",
    subtitle: "{f5}%",
    w: 120,
    h: 200,
    shape: { kind: "rect", source: "{f5}", fillMax: 100, orient: "up", fill: "#22c55e" },
  })
  .edge("st1", "st2", { id: "e12", label: "決済へ", tone: "info" })
  .edge("st2", "st3", { id: "e23", label: "発送へ", tone: "info" })
  .edge("st3", "st4", { id: "e34", label: "配達へ", tone: "info" })
  .edge("st4", "st5", { id: "e45", label: "完了", tone: "success" })
  .readout.percentRing("progRing", { source: "progress", max: 100, label: "進捗" })
  .readout.countup("elapsedCU", { source: "elapsedHour", unit: " 時", label: "経過", decimals: 0 })
  .phase("p1", { duration: 1500, title: "受注中", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("st1")
      .tween("f1", 0, 100)
      .tween("progress", 0, 20)
      .tween("elapsedHour", 0, 1)
      .badge("受注"),
  )
  .phase("p2", { duration: 1500, title: "決済中", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("st1", "st2", "e12")
      .tween("f2", 0, 100)
      .tween("progress", 20, 40)
      .tween("elapsedHour", 1, 2)
      .badge("決済"),
  )
  .phase("p3", { duration: 1500, title: "発送中", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("st1", "st2", "st3", "e12", "e23")
      .tween("f3", 0, 100)
      .tween("progress", 40, 60)
      .tween("elapsedHour", 2, 8)
      .badge("発送"),
  )
  .phase("p4", { duration: 1500, title: "配達中", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("st1", "st2", "st3", "st4", "e12", "e23", "e34")
      .tween("f4", 0, 100)
      .tween("progress", 60, 85)
      .tween("elapsedHour", 8, 24)
      .badge("配達"),
  )
  .phase("p5", { duration: 1500, title: "完了", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("st1", "st2", "st3", "st4", "st5", "e12", "e23", "e34", "e45")
      .tween("f5", 0, 100)
      .tween("progress", 85, 100)
      .tween("elapsedHour", 24, 28)
      .badge("完了"),
  )
  .build();

/**
 * 9. richScoreLeaderboard = 「4 プレイヤーのスコア推移」 rich exemplar (iter 9 wave 9-E)。
 *
 * theme = 「オンラインゲーム大会で 4 人のプレイヤーが 4 round プレイして score が変動する」。
 * dyn-circle radius を parts の使用機会 (「大きさ変化で強弱を表現」) 逆算で選定 = score に応じた radius の大小。
 *
 * 5 layer 同時発火:
 * - layer 1 = 4 circle radius 変化 (score 追随、 大きい = 強い)
 * - layer 2 = badge = 現在 leader プレイヤー名
 * - layer 3 = readout.countup 累計の撃破数
 * - layer 4 = readout.gauge 平均 accuracy
 * - layer 5 = round 進行 (badge に round 番号)
 */
export const richScoreLeaderboard = diagram("animation-rich-score-leaderboard", {
  topic: "4人の得点の推移 (4ラウンドで順位変動、 円の大きさが強さを表す)",
})
  .lane("l1", { x: 0, width: 180 })
  .lane("l2", { x: 240, width: 180 })
  .lane("l3", { x: 480, width: 180 })
  .lane("l4", { x: 720, width: 180 })
  .state("p1", { initial: 20 })
  .state("p2", { initial: 20 })
  .state("p3", { initial: 20 })
  .state("p4", { initial: 20 })
  .state("totalKill", { initial: 0 })
  .state("avgAcc", { initial: 40 })
  .node("pl1", {
    lane: "l1",
    stack: 0,
    kind: "dyn-circle",
    title: "岸田様",
    subtitle: "得点 {p1}",
    w: 160,
    h: 180,
    shape: { kind: "circle", radius: "{p1}", fill: "#4e9dc4" },
  })
  .node("pl2", {
    lane: "l2",
    stack: 0,
    kind: "dyn-circle",
    title: "山田様",
    subtitle: "得点 {p2}",
    w: 160,
    h: 180,
    shape: { kind: "circle", radius: "{p2}", fill: "#f97316" },
  })
  .node("pl3", {
    lane: "l3",
    stack: 0,
    kind: "dyn-circle",
    title: "佐藤様",
    subtitle: "得点 {p3}",
    w: 160,
    h: 180,
    shape: { kind: "circle", radius: "{p3}", fill: "#22c55e" },
  })
  .node("pl4", {
    lane: "l4",
    stack: 0,
    kind: "dyn-circle",
    title: "森様",
    subtitle: "得点 {p4}",
    w: 160,
    h: 180,
    shape: { kind: "circle", radius: "{p4}", fill: "#8b7ffa" },
  })
  .readout.countup("killCU", {
    source: "totalKill",
    unit: " 回",
    label: "累計の撃破数",
    decimals: 0,
  })
  .readout.gauge("accG", {
    source: "avgAcc",
    min: 0,
    max: 100,
    color: "#22c55e",
    label: "平均命中率 %",
  })
  .phase("r1", { duration: 2000, title: "第 1 戦 (拮抗)", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("pl1", "pl2", "pl3", "pl4")
      .tween("p1", 20, 35)
      .tween("p2", 20, 38)
      .tween("p3", 20, 32)
      .tween("p4", 20, 30)
      .tween("totalKill", 0, 12)
      .tween("avgAcc", 40, 52)
      .badge("R1 拮抗"),
  )
  .phase("r2", { duration: 2000, title: "第 2 戦 (山田様が先行)", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("pl1", "pl2", "pl3", "pl4")
      .tween("p1", 35, 48)
      .tween("p2", 38, 65)
      .tween("p3", 32, 42)
      .tween("p4", 30, 40)
      .tween("totalKill", 12, 28)
      .tween("avgAcc", 52, 58)
      .badge("第 2 戦 山田様が先行"),
  )
  .phase(
    "r3",
    { duration: 2000, title: "第 3 戦 (佐藤様 追い上げ)", body: "" },
    (p: PhaseBuilder) =>
      p
        .activate("pl1", "pl2", "pl3", "pl4")
        .tween("p1", 48, 55)
        .tween("p2", 65, 68)
        .tween("p3", 42, 72)
        .tween("p4", 40, 45)
        .tween("totalKill", 28, 48)
        .tween("avgAcc", 58, 64)
        .badge("R3 佐藤様 追上げ"),
  )
  .phase("r4", { duration: 2000, title: "第 4 戦 (佐藤様 優勝)", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("pl1", "pl2", "pl3", "pl4")
      .tween("p1", 55, 62)
      .tween("p2", 68, 74)
      .tween("p3", 72, 80)
      .tween("p4", 45, 50)
      .tween("totalKill", 48, 72)
      .tween("avgAcc", 64, 68)
      .badge("R4 佐藤様 優勝"),
  )
  .build();

/**
 * 10. richLayeredPriorityFee = 「3 層優先度手数料」 composite exemplar (dragon-diagram skill pilot、 2026-07-15)。
 *
 * theme = Ethereum EIP-1559 gas fee の 3 層構成 (基本手数料 (焼却) / 優先手数料 / 上限手数料) を混雑度で追跡。
 *
 * uses parts:
 *   - 縦に積んだ層の棒 (partsStackedLayer 経路) = 3 dyn-rect stacked layer で「重ね張り」 metaphor
 *   - 件数の表示 (partsCounterActor 経路) = actor + subtitle template で有効総額 gwei
 *   - 円弧のゲージ (partsArcGauge 経路) = dyn-arc で混雑度 %
 *
 * story arc = 空 block → 平常 → 混雑 → 極混雑 の 4 phase で 3 層が同時変動。
 */
export const richLayeredPriorityFee = diagram("animation-rich-layered-priority-fee", {
  topic: "3層優先度手数料 — 混雑度で基本 / 優先 / 上限の手数料が同時に動く",
})
  .lane("bar", { x: 0, width: 320 })
  .lane("stat", { x: 380, width: 320 })
  .state("baseFee", { initial: 10 })
  .state("tipFee", { initial: 2 })
  .state("capFee", { initial: 8 })
  .state("effectiveGwei", { initial: 12 })
  .state("congestion", { initial: 15 })
  .node("capL", {
    lane: "bar",
    stack: 0,
    kind: "dyn-rect",
    title: "上限手数料",
    subtitle: "+{capFee} gwei",
    w: 300,
    h: 140,
    shape: {
      kind: "rect",
      source: "{capFee}",
      fillMax: 60,
      orient: "up",
      fill: "#a08870",
      radius: 4,
    },
  })
  .node("tipL", {
    lane: "bar",
    stack: 1,
    kind: "dyn-rect",
    title: "優先手数料",
    subtitle: "+{tipFee} gwei",
    w: 316,
    h: 100,
    shape: {
      kind: "rect",
      source: "{tipFee}",
      fillMax: 50,
      orient: "up",
      fill: "#22c55e",
      radius: 4,
    },
  })
  .node("baseL", {
    lane: "bar",
    stack: 2,
    kind: "dyn-rect",
    title: "基本手数料 (焼却)",
    subtitle: "{baseFee} gwei",
    w: 382,
    h: 180,
    shape: {
      kind: "rect",
      source: "{baseFee}",
      fillMax: 160,
      orient: "up",
      fill: "#dc2626",
      radius: 4,
    },
  })
  .node("effC", {
    lane: "stat",
    stack: 0,
    kind: "actor",
    title: "有効総額",
    subtitle: "{effectiveGwei} gwei",
    w: 280,
    h: 180,
  })
  .node("congA", {
    lane: "stat",
    stack: 1,
    kind: "dyn-arc",
    title: "混雑度",
    subtitle: "{congestion}%",
    w: 280,
    h: 220,
    shape: {
      kind: "arc",
      angle: "{congestion}",
      sweepMax: 100,
      outerRadius: 90,
      innerRadius: 62,
      fill: "#f97316",
    },
  })
  .phase("p1", { duration: 1800, title: "空のブロック", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("capL", "tipL", "baseL", "effC", "congA")
      .tween("baseFee", 10, 15)
      .tween("tipFee", 2, 3)
      .tween("capFee", 8, 12)
      .tween("effectiveGwei", 12, 18)
      .tween("congestion", 15, 28)
      .badge("空のブロック"),
  )
  .phase("p2", { duration: 1800, title: "平常", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("capL", "tipL", "baseL", "effC", "congA")
      .tween("baseFee", 15, 45)
      .tween("tipFee", 3, 6)
      .tween("capFee", 12, 20)
      .tween("effectiveGwei", 18, 51)
      .tween("congestion", 28, 58)
      .badge("平常"),
  )
  .phase("p3", { duration: 1800, title: "混雑", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("capL", "tipL", "baseL", "effC", "congA")
      .tween("baseFee", 45, 95)
      .tween("tipFee", 6, 18)
      .tween("capFee", 20, 35)
      .tween("effectiveGwei", 51, 113)
      .tween("congestion", 58, 88)
      .badge("混雑"),
  )
  .phase("p4", { duration: 1800, title: "極混雑", body: "" }, (p: PhaseBuilder) =>
    p
      .activate("capL", "tipL", "baseL", "effC", "congA")
      .tween("baseFee", 95, 140)
      .tween("tipFee", 18, 42)
      .tween("capFee", 35, 55)
      .tween("effectiveGwei", 113, 182)
      .tween("congestion", 88, 96)
      .badge("極混雑"),
  )
  .build();

// ============================================================
// 記法 (#1373)
// ============================================================
//
// catalog は `sourceYaml__<図の export 名>` の名前で記法を拾う (`lib/catalog-items.ts`)。
// 記法があると画面で「コード」 を読めて「エディタで開く」 が押せる。
//
// **10 件とも記法を持つ**。 rich な 5 件 (`richPipelineDemo` 以降) は `dyn-wave` /
// `dyn-arc` の箱に `shape` を渡し、うち 4 件は `readouts` (割合の輪 / 数え上げ) も使う。
// #1374 で記法にこの 2 つの欄を足したので、下の「記法 (#1374)」 の節で書けるようになった。
//
// **図は組み立て API のまま残す**。 記法から組み立て直すと図の識別子が題から導かれる。
// 併記の写し違いは `lib/catalog-source-parity.test.tsx` が止める。

export const sourceYaml__tweenSimple = `title: "tween: 数値線形補間"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  counter: 0

actors:
  - 数え上げ: { kind: actor, lane: l, value: "{counter}" }

flow:

animation:
  - step: "数え上げを滑らかに進める (0 → 100)" 2.5s
    focus: ["数え上げ"]
    tween:
      counter: 0 -> 100
    badge: "tween 中"
    description: "1 つの段の中で値を 0 から 100 へ滑らかに変える。"
`;

export const sourceJson__tweenSimple = `{
  "title": "tween: 数値線形補間",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    { "name": "数え上げ", "kind": "actor", "lane": "l", "value": "{counter}" }
  ],
  "flow": [],
  "states": { "counter": 0 },
  "animation": [
    {
      "step": "数え上げを滑らかに進める (0 → 100)",
      "duration": 2.5,
      "focus": ["数え上げ"],
      "body": "1 つの段の中で値を 0 から 100 へ滑らかに変える。",
      "tween": { "counter": [0, 100] },
      "badge": "tween 中"
    }
  ]
}`;

export const sourceYaml__tweenChain = `title: "tween: 連続 phase で累積"
type: flow

lanes:
  l: { x: 0, width: 400 }

states:
  n: 0

actors:
  - 合計: { kind: actor, lane: l, value: "{n}" }

flow:

animation:
  - step: "初動 (0 → 10)" 2s
    focus: ["合計"]
    tween:
      n: 0 -> 10
    badge: "p1"
    description: "1 phase 目の tween。"
  - step: "加速 (10 → 50)" 2s
    focus: ["合計"]
    tween:
      n: 10 -> 50
    badge: "p2"
    description: "前 phase の終端値から続けて tween。"
  - step: "完了 (50 → 100)" 2s
    focus: ["合計"]
    tween:
      n: 50 -> 100
    badge: "p3"
    description: "最後の段で 100 まで。 そのまま静止して見せる。"
`;

export const sourceJson__tweenChain = `{
  "title": "tween: 連続 phase で累積",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    { "name": "合計", "kind": "actor", "lane": "l", "value": "{n}" }
  ],
  "flow": [],
  "states": { "n": 0 },
  "animation": [
    {
      "step": "初動 (0 → 10)",
      "duration": 2,
      "focus": ["合計"],
      "body": "1 phase 目の tween。",
      "tween": { "n": [0, 10] },
      "badge": "p1"
    },
    {
      "step": "加速 (10 → 50)",
      "duration": 2,
      "focus": ["合計"],
      "body": "前 phase の終端値から続けて tween。",
      "tween": { "n": [10, 50] },
      "badge": "p2"
    },
    {
      "step": "完了 (50 → 100)",
      "duration": 2,
      "focus": ["合計"],
      "body": "最後の段で 100 まで。 そのまま静止して見せる。",
      "tween": { "n": [50, 100] },
      "badge": "p3"
    }
  ]
}`;

export const sourceYaml__setSwitch = `title: "set: 即時切替 (lerp なし)"
type: flow

lanes:
  l: { x: 0, width: 500 }

states:
  status: "待機"

actors:
  - 処理: { kind: function, lane: l, subtitle: "状態: {status}" }

flow:

animation:
  - step: "待機 → 実行中" 2s
    focus: ["処理"]
    set:
      status: "実行中"
    badge: "実行中"
    description: "set で文字列 state を即時切替。 phase 開始の瞬間に値が変わる。"
  - step: "実行中 → 完了" 2s
    focus: ["処理"]
    set:
      status: "完了"
    badge: "完了"
    description: "次の段で完了に切り替える。 tween と違い段階を踏まず一瞬で移る。"
`;

export const sourceJson__setSwitch = `{
  "title": "set: 即時切替 (lerp なし)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 500 }
  },
  "actors": [
    { "name": "処理", "kind": "function", "lane": "l", "subtitle": "状態: {status}" }
  ],
  "flow": [],
  "states": { "status": "待機" },
  "animation": [
    {
      "step": "待機 → 実行中",
      "duration": 2,
      "focus": ["処理"],
      "body": "set で文字列 state を即時切替。 phase 開始の瞬間に値が変わる。",
      "set": { "status": "実行中" },
      "badge": "実行中"
    },
    {
      "step": "実行中 → 完了",
      "duration": 2,
      "focus": ["処理"],
      "body": "次の段で完了に切り替える。 tween と違い段階を踏まず一瞬で移る。",
      "set": { "status": "完了" },
      "badge": "完了"
    }
  ]
}`;

export const sourceYaml__badgePerPhase = `title: "badge: phase ごと切替"
type: flow

lanes:
  l: { x: 0, width: 400 }

actors:
  - 手順: { kind: actor, lane: l }

flow:

animation:
  - step: "準備中" 1.5s
    focus: ["手順"]
    badge: "準備中"
    description: "見出しの札に「準備中」 を出す。"
  - step: "処理中" 1.5s
    focus: ["手順"]
    badge: "処理中"
    description: "見出しの札を「処理中」 に切り替える。"
  - step: "完了" 1.5s
    focus: ["手順"]
    badge: "完了"
    description: "最後の段の札を「完了」 にして、手順の終わりを示す。"
`;

export const sourceJson__badgePerPhase = `{
  "title": "badge: phase ごと切替",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 400 }
  },
  "actors": [
    { "name": "手順", "kind": "actor", "lane": "l" }
  ],
  "flow": [],
  "animation": [
    {
      "step": "準備中",
      "duration": 1.5,
      "focus": ["手順"],
      "body": "見出しの札に「準備中」 を出す。",
      "badge": "準備中"
    },
    {
      "step": "処理中",
      "duration": 1.5,
      "focus": ["手順"],
      "body": "見出しの札を「処理中」 に切り替える。",
      "badge": "処理中"
    },
    {
      "step": "完了",
      "duration": 1.5,
      "focus": ["手順"],
      "body": "最後の段の札を「完了」 にして、手順の終わりを示す。",
      "badge": "完了"
    }
  ]
}`;

export const sourceYaml__mixedTweenSet = `title: "tween + set 併用"
type: flow

lanes:
  l: { x: 0, width: 500 }

states:
  amount: 0
  phase: "初期"

actors:
  - 操作: { kind: function, lane: l, subtitle: "段階: {phase}", value: "{amount}" }

flow:

animation:
  - step: "読込開始 (状態 + 進捗を併走)" 2.4s
    focus: ["操作"]
    tween:
      amount: 0 -> 50
    set:
      phase: "読込中"
    badge: "読込中"
    description: "tween で数値、 set で文字列を同時更新。 1 phase 内で複数 state を制御可能。"
  - step: "完了 (状態 + 進捗を仕上げ)" 2.4s
    focus: ["操作"]
    tween:
      amount: 50 -> 100
    set:
      phase: "完了"
    badge: "完了"
    description: "次 phase で完了状態へ。"
`;

export const sourceJson__mixedTweenSet = `{
  "title": "tween + set 併用",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 500 }
  },
  "actors": [
    {
      "name": "操作",
      "kind": "function",
      "lane": "l",
      "subtitle": "段階: {phase}",
      "value": "{amount}"
    }
  ],
  "flow": [],
  "states": { "amount": 0, "phase": "初期" },
  "animation": [
    {
      "step": "読込開始 (状態 + 進捗を併走)",
      "duration": 2.4,
      "focus": ["操作"],
      "body": "tween で数値、 set で文字列を同時更新。 1 phase 内で複数 state を制御可能。",
      "tween": { "amount": [0, 50] },
      "set": { "phase": "読込中" },
      "badge": "読込中"
    },
    {
      "step": "完了 (状態 + 進捗を仕上げ)",
      "duration": 2.4,
      "focus": ["操作"],
      "body": "次 phase で完了状態へ。",
      "tween": { "amount": [50, 100] },
      "set": { "phase": "完了" },
      "badge": "完了"
    }
  ]
}`;

// ============================================================
// 記法 (#1374)
// ============================================================
//
// 記法に `shape:` (箱の中に描く図形) と `readouts:` (値を見せる部品) を足したので、
// 動きの見本の残り 5 件 も記法で書けるようになった。 これでカタログの図は全て記法を持つ。
//
// **手で書かず、組み立て済みの図から機械で出した**。 出す前に 3 つ確かめている =
// 組み立てが注意を出さないこと、2 記法が同じ図になること、組み立て済みの図と骨格が
// 一致すること。 以降は一致検査 (`lib/catalog-source-parity.test.tsx`) が守る。
//
// **図は組み立て API のまま残す**。 記法から組み立て直すと図の識別子が題から導かれ、
// 一覧と検索に出る文字列が変わる。

export const sourceYaml__richPipelineDemo = `title: "5段階のCSV処理の進捗"
type: flow

lanes:
  col1: { x: 0, width: 190 }
  col2: { x: 230, width: 190 }
  col3: { x: 460, width: 190 }

states:
  s1: 0
  s2: 0
  s3: 0
  s4: 0
  s5: 0
  total: 0
  processed: 0

readouts:
  ring: { kind: percent-ring, source: total, max: 500, label: "全体進捗" }
  cu: { kind: countup, source: processed, decimals: 0, unit: " 行", label: "処理済" }

actors:
  - 検証: { kind: dyn-wave, lane: col1, stack: 0, subtitle: "{s1}%", posW: 140, posH: 200, shape: { kind: wave, level: "{s1}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } }
  - 変換: { kind: dyn-wave, lane: col1, stack: 1, subtitle: "{s2}%", posW: 140, posH: 200, shape: { kind: wave, level: "{s2}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } }
  - 加工: { kind: dyn-wave, lane: col2, stack: 0, subtitle: "{s3}%", posW: 140, posH: 200, shape: { kind: wave, level: "{s3}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } }
  - 重複排除: { kind: dyn-wave, lane: col2, stack: 1, subtitle: "{s4}%", posW: 140, posH: 200, shape: { kind: wave, level: "{s4}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } }
  - 保存: { kind: dyn-wave, lane: col3, stack: 0, subtitle: "{s5}%", posW: 140, posH: 200, shape: { kind: wave, level: "{s5}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#22c55e" } }

flow:
  - 検証 -> 変換: "変換" (info)
  - 変換 -> 加工: "加工" (info)
  - 加工 -> 重複排除: "排除" (info)
  - 重複排除 -> 保存: "確定" (success)

animation:
  - step: "検証中" 1.5s
    focus: ["検証"]
    tween:
      s1: 0 -> 100
      total: 0 -> 100
      processed: 0 -> 100
    badge: "検証"
  - step: "変換中" 1.5s
    focus: ["検証", "変換", "検証 -> 変換"]
    tween:
      s2: 0 -> 100
      total: 100 -> 200
      processed: 100 -> 200
    badge: "変換"
  - step: "加工中" 1.5s
    focus: ["検証", "変換", "加工", "検証 -> 変換", "変換 -> 加工"]
    tween:
      s3: 0 -> 100
      total: 200 -> 300
      processed: 200 -> 300
    badge: "加工"
  - step: "排除中" 1.5s
    focus: ["検証", "変換", "加工", "重複排除", "検証 -> 変換", "変換 -> 加工", "加工 -> 重複排除"]
    tween:
      s4: 0 -> 100
      total: 300 -> 400
      processed: 300 -> 400
    badge: "排除"
  - step: "保存完遂" 1.5s
    focus: ["検証", "変換", "加工", "重複排除", "保存", "検証 -> 変換", "変換 -> 加工", "加工 -> 重複排除", "重複排除 -> 保存"]
    tween:
      s5: 0 -> 100
      total: 400 -> 500
      processed: 400 -> 500
    badge: "保存"
`;

export const sourceJson__richPipelineDemo = `{
  "title": "5段階のCSV処理の進捗",
  "type": "flow",
  "lanes": {
    "col1": { "x": 0, "width": 190 },
    "col2": { "x": 230, "width": 190 },
    "col3": { "x": 460, "width": 190 }
  },
  "actors": [
    {
      "name": "検証",
      "kind": "dyn-wave",
      "lane": "col1",
      "stack": 0,
      "subtitle": "{s1}%",
      "posW": 140,
      "posH": 200,
      "shape": {
        "kind": "wave",
        "level": "{s1}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#4e9dc4"
      }
    },
    {
      "name": "変換",
      "kind": "dyn-wave",
      "lane": "col1",
      "stack": 1,
      "subtitle": "{s2}%",
      "posW": 140,
      "posH": 200,
      "shape": {
        "kind": "wave",
        "level": "{s2}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#4e9dc4"
      }
    },
    {
      "name": "加工",
      "kind": "dyn-wave",
      "lane": "col2",
      "stack": 0,
      "subtitle": "{s3}%",
      "posW": 140,
      "posH": 200,
      "shape": {
        "kind": "wave",
        "level": "{s3}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#4e9dc4"
      }
    },
    {
      "name": "重複排除",
      "kind": "dyn-wave",
      "lane": "col2",
      "stack": 1,
      "subtitle": "{s4}%",
      "posW": 140,
      "posH": 200,
      "shape": {
        "kind": "wave",
        "level": "{s4}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#4e9dc4"
      }
    },
    {
      "name": "保存",
      "kind": "dyn-wave",
      "lane": "col3",
      "stack": 0,
      "subtitle": "{s5}%",
      "posW": 140,
      "posH": 200,
      "shape": {
        "kind": "wave",
        "level": "{s5}",
        "amplitude": 100,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#22c55e"
      }
    }
  ],
  "flow": [
    { "from": "検証", "to": "変換", "label": "変換", "tone": "info" },
    { "from": "変換", "to": "加工", "label": "加工", "tone": "info" },
    { "from": "加工", "to": "重複排除", "label": "排除", "tone": "info" },
    { "from": "重複排除", "to": "保存", "label": "確定", "tone": "success" }
  ],
  "states": { "s1": 0, "s2": 0, "s3": 0, "s4": 0, "s5": 0, "total": 0, "processed": 0 },
  "readouts": [
    { "id": "ring", "kind": "percent-ring", "source": "total", "max": 500, "label": "全体進捗" },
    {
      "id": "cu",
      "kind": "countup",
      "source": "processed",
      "decimals": 0,
      "unit": " 行",
      "label": "処理済"
    }
  ],
  "animation": [
    {
      "step": "検証中",
      "duration": 1.5,
      "focus": ["検証"],
      "tween": { "s1": [0, 100], "total": [0, 100], "processed": [0, 100] },
      "badge": "検証"
    },
    {
      "step": "変換中",
      "duration": 1.5,
      "focus": ["検証", "変換", "検証 -> 変換"],
      "tween": { "s2": [0, 100], "total": [100, 200], "processed": [100, 200] },
      "badge": "変換"
    },
    {
      "step": "加工中",
      "duration": 1.5,
      "focus": ["検証", "変換", "加工", "検証 -> 変換", "変換 -> 加工"],
      "tween": { "s3": [0, 100], "total": [200, 300], "processed": [200, 300] },
      "badge": "加工"
    },
    {
      "step": "排除中",
      "duration": 1.5,
      "focus": ["検証", "変換", "加工", "重複排除", "検証 -> 変換", "変換 -> 加工", "加工 -> 重複排除"],
      "tween": { "s4": [0, 100], "total": [300, 400], "processed": [300, 400] },
      "badge": "排除"
    },
    {
      "step": "保存完遂",
      "duration": 1.5,
      "focus": ["検証", "変換", "加工", "重複排除", "保存", "検証 -> 変換", "変換 -> 加工", "加工 -> 重複排除", "重複排除 -> 保存"],
      "tween": { "s5": [0, 100], "total": [400, 500], "processed": [400, 500] },
      "badge": "保存"
    }
  ]
}`;

export const sourceYaml__richServerLoadDashboard = `title: "4台のサーバーのCPU負荷 (朝ピーク→昼安定→夜スケールダウン→深夜アイドル)"
type: flow

lanes:
  l1: { x: 0, width: 200 }
  l2: { x: 260, width: 200 }
  l3: { x: 520, width: 200 }
  l4: { x: 780, width: 200 }

states:
  cpu1: 0
  cpu2: 0
  cpu3: 0
  cpu4: 0
  avgLoad: 0
  uptimeHour: 0

readouts:
  avgG: { kind: gauge, source: avgLoad, min: 0, max: 100, color: "#f97316", label: "平均負荷 %" }
  uptimeCU: { kind: countup, source: uptimeHour, decimals: 0, unit: " 時", label: "稼働時間" }

actors:
  - サーバー 1: { kind: dyn-arc, lane: l1, stack: 0, subtitle: "{cpu1}%", posW: 180, posH: 180, shape: { kind: arc, angle: "{cpu1}", sweepMax: 100, outerRadius: 70, innerRadius: 52, fill: "#4e9dc4" } }
  - サーバー 2: { kind: dyn-arc, lane: l2, stack: 0, subtitle: "{cpu2}%", posW: 180, posH: 180, shape: { kind: arc, angle: "{cpu2}", sweepMax: 100, outerRadius: 70, innerRadius: 52, fill: "#4e9dc4" } }
  - サーバー 3: { kind: dyn-arc, lane: l3, stack: 0, subtitle: "{cpu3}%", posW: 180, posH: 180, shape: { kind: arc, angle: "{cpu3}", sweepMax: 100, outerRadius: 70, innerRadius: 52, fill: "#f97316" } }
  - サーバー 4: { kind: dyn-arc, lane: l4, stack: 0, subtitle: "{cpu4}%", posW: 180, posH: 180, shape: { kind: arc, angle: "{cpu4}", sweepMax: 100, outerRadius: 70, innerRadius: 52, fill: "#22c55e" } }

animation:
  - step: "朝ピーク (7:00)" 2s
    focus: ["サーバー 1", "サーバー 2", "サーバー 3", "サーバー 4"]
    tween:
      cpu1: 0 -> 85
      cpu2: 0 -> 88
      cpu3: 0 -> 92
      cpu4: 0 -> 78
      avgLoad: 0 -> 86
      uptimeHour: 0 -> 7
    badge: "朝ピーク"
  - step: "昼安定 (12:00)" 2s
    focus: ["サーバー 1", "サーバー 2", "サーバー 3", "サーバー 4"]
    tween:
      cpu1: 85 -> 55
      cpu2: 88 -> 58
      cpu3: 92 -> 62
      cpu4: 78 -> 48
      avgLoad: 86 -> 55
      uptimeHour: 7 -> 12
    badge: "昼安定"
  - step: "夜スケールダウン (20:00)" 2s
    focus: ["サーバー 1", "サーバー 2", "サーバー 3", "サーバー 4"]
    tween:
      cpu1: 55 -> 30
      cpu2: 58 -> 32
      cpu3: 62 -> 35
      cpu4: 48 -> 22
      avgLoad: 55 -> 30
      uptimeHour: 12 -> 20
    badge: "スケールダウン"
  - step: "深夜アイドル (2:00)" 2s
    focus: ["サーバー 1", "サーバー 2", "サーバー 3", "サーバー 4"]
    tween:
      cpu1: 30 -> 8
      cpu2: 32 -> 10
      cpu3: 35 -> 12
      cpu4: 22 -> 5
      avgLoad: 30 -> 9
      uptimeHour: 20 -> 26
    badge: "アイドル"
`;

export const sourceJson__richServerLoadDashboard = `{
  "title": "4台のサーバーのCPU負荷 (朝ピーク→昼安定→夜スケールダウン→深夜アイドル)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 200 },
    "l2": { "x": 260, "width": 200 },
    "l3": { "x": 520, "width": 200 },
    "l4": { "x": 780, "width": 200 }
  },
  "actors": [
    {
      "name": "サーバー 1",
      "kind": "dyn-arc",
      "lane": "l1",
      "stack": 0,
      "subtitle": "{cpu1}%",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "arc",
        "angle": "{cpu1}",
        "sweepMax": 100,
        "outerRadius": 70,
        "innerRadius": 52,
        "fill": "#4e9dc4"
      }
    },
    {
      "name": "サーバー 2",
      "kind": "dyn-arc",
      "lane": "l2",
      "stack": 0,
      "subtitle": "{cpu2}%",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "arc",
        "angle": "{cpu2}",
        "sweepMax": 100,
        "outerRadius": 70,
        "innerRadius": 52,
        "fill": "#4e9dc4"
      }
    },
    {
      "name": "サーバー 3",
      "kind": "dyn-arc",
      "lane": "l3",
      "stack": 0,
      "subtitle": "{cpu3}%",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "arc",
        "angle": "{cpu3}",
        "sweepMax": 100,
        "outerRadius": 70,
        "innerRadius": 52,
        "fill": "#f97316"
      }
    },
    {
      "name": "サーバー 4",
      "kind": "dyn-arc",
      "lane": "l4",
      "stack": 0,
      "subtitle": "{cpu4}%",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "arc",
        "angle": "{cpu4}",
        "sweepMax": 100,
        "outerRadius": 70,
        "innerRadius": 52,
        "fill": "#22c55e"
      }
    }
  ],
  "flow": [],
  "states": { "cpu1": 0, "cpu2": 0, "cpu3": 0, "cpu4": 0, "avgLoad": 0, "uptimeHour": 0 },
  "readouts": [
    {
      "id": "avgG",
      "kind": "gauge",
      "source": "avgLoad",
      "min": 0,
      "max": 100,
      "color": "#f97316",
      "label": "平均負荷 %"
    },
    {
      "id": "uptimeCU",
      "kind": "countup",
      "source": "uptimeHour",
      "decimals": 0,
      "unit": " 時",
      "label": "稼働時間"
    }
  ],
  "animation": [
    {
      "step": "朝ピーク (7:00)",
      "duration": 2,
      "focus": ["サーバー 1", "サーバー 2", "サーバー 3", "サーバー 4"],
      "tween": {
        "cpu1": [0, 85],
        "cpu2": [0, 88],
        "cpu3": [0, 92],
        "cpu4": [0, 78],
        "avgLoad": [0, 86],
        "uptimeHour": [0, 7]
      },
      "badge": "朝ピーク"
    },
    {
      "step": "昼安定 (12:00)",
      "duration": 2,
      "focus": ["サーバー 1", "サーバー 2", "サーバー 3", "サーバー 4"],
      "tween": {
        "cpu1": [85, 55],
        "cpu2": [88, 58],
        "cpu3": [92, 62],
        "cpu4": [78, 48],
        "avgLoad": [86, 55],
        "uptimeHour": [7, 12]
      },
      "badge": "昼安定"
    },
    {
      "step": "夜スケールダウン (20:00)",
      "duration": 2,
      "focus": ["サーバー 1", "サーバー 2", "サーバー 3", "サーバー 4"],
      "tween": {
        "cpu1": [55, 30],
        "cpu2": [58, 32],
        "cpu3": [62, 35],
        "cpu4": [48, 22],
        "avgLoad": [55, 30],
        "uptimeHour": [12, 20]
      },
      "badge": "スケールダウン"
    },
    {
      "step": "深夜アイドル (2:00)",
      "duration": 2,
      "focus": ["サーバー 1", "サーバー 2", "サーバー 3", "サーバー 4"],
      "tween": {
        "cpu1": [30, 8],
        "cpu2": [32, 10],
        "cpu3": [35, 12],
        "cpu4": [22, 5],
        "avgLoad": [30, 9],
        "uptimeHour": [20, 26]
      },
      "badge": "アイドル"
    }
  ]
}`;

export const sourceYaml__richOrderStatusFlow = `title: "EC注文状態遷移 (受注→決済→発送→配達→完了)"
type: flow

lanes:
  col1: { x: 0, width: 170 }
  col2: { x: 422, width: 170 }

states:
  f1: 0
  f2: 0
  f3: 0
  f4: 0
  f5: 0
  progress: 0
  elapsedHour: 0

readouts:
  progRing: { kind: percent-ring, source: progress, max: 100, label: "進捗" }
  elapsedCU: { kind: countup, source: elapsedHour, decimals: 0, unit: " 時", label: "経過" }

actors:
  - 受注: { kind: dyn-rect, lane: col1, stack: 0, subtitle: "{f1}%", posW: 120, posH: 200, shape: { kind: rect, source: "{f1}", fillMax: 100, orient: "up", fill: "#4e9dc4" } }
  - 決済: { kind: dyn-rect, lane: col2, stack: 0, subtitle: "{f2}%", posW: 120, posH: 200, shape: { kind: rect, source: "{f2}", fillMax: 100, orient: "up", fill: "#4e9dc4" } }
  - 発送: { kind: dyn-rect, lane: col1, stack: 1, subtitle: "{f3}%", posW: 120, posH: 200, shape: { kind: rect, source: "{f3}", fillMax: 100, orient: "up", fill: "#4e9dc4" } }
  - 配達: { kind: dyn-rect, lane: col2, stack: 1, subtitle: "{f4}%", posW: 120, posH: 200, shape: { kind: rect, source: "{f4}", fillMax: 100, orient: "up", fill: "#f97316" } }
  - 完了: { kind: dyn-rect, lane: col1, stack: 2, subtitle: "{f5}%", posW: 120, posH: 200, shape: { kind: rect, source: "{f5}", fillMax: 100, orient: "up", fill: "#22c55e" } }

flow:
  - 受注 -> 決済: "決済へ" (info)
  - 決済 -> 発送: "発送へ" (info)
  - 発送 -> 配達: "配達へ" (info)
  - 配達 -> 完了: "完了" (success)

animation:
  - step: "受注中" 1.5s
    focus: ["受注"]
    tween:
      f1: 0 -> 100
      progress: 0 -> 20
      elapsedHour: 0 -> 1
    badge: "受注"
  - step: "決済中" 1.5s
    focus: ["受注", "決済", "受注 -> 決済"]
    tween:
      f2: 0 -> 100
      progress: 20 -> 40
      elapsedHour: 1 -> 2
    badge: "決済"
  - step: "発送中" 1.5s
    focus: ["受注", "決済", "発送", "受注 -> 決済", "決済 -> 発送"]
    tween:
      f3: 0 -> 100
      progress: 40 -> 60
      elapsedHour: 2 -> 8
    badge: "発送"
  - step: "配達中" 1.5s
    focus: ["受注", "決済", "発送", "配達", "受注 -> 決済", "決済 -> 発送", "発送 -> 配達"]
    tween:
      f4: 0 -> 100
      progress: 60 -> 85
      elapsedHour: 8 -> 24
    badge: "配達"
  - step: "完了" 1.5s
    focus: ["受注", "決済", "発送", "配達", "完了", "受注 -> 決済", "決済 -> 発送", "発送 -> 配達", "配達 -> 完了"]
    tween:
      f5: 0 -> 100
      progress: 85 -> 100
      elapsedHour: 24 -> 28
    badge: "完了"
`;

export const sourceJson__richOrderStatusFlow = `{
  "title": "EC注文状態遷移 (受注→決済→発送→配達→完了)",
  "type": "flow",
  "lanes": {
    "col1": { "x": 0, "width": 170 },
    "col2": { "x": 422, "width": 170 }
  },
  "actors": [
    {
      "name": "受注",
      "kind": "dyn-rect",
      "lane": "col1",
      "stack": 0,
      "subtitle": "{f1}%",
      "posW": 120,
      "posH": 200,
      "shape": { "kind": "rect", "source": "{f1}", "fillMax": 100, "orient": "up", "fill": "#4e9dc4" }
    },
    {
      "name": "決済",
      "kind": "dyn-rect",
      "lane": "col2",
      "stack": 0,
      "subtitle": "{f2}%",
      "posW": 120,
      "posH": 200,
      "shape": { "kind": "rect", "source": "{f2}", "fillMax": 100, "orient": "up", "fill": "#4e9dc4" }
    },
    {
      "name": "発送",
      "kind": "dyn-rect",
      "lane": "col1",
      "stack": 1,
      "subtitle": "{f3}%",
      "posW": 120,
      "posH": 200,
      "shape": { "kind": "rect", "source": "{f3}", "fillMax": 100, "orient": "up", "fill": "#4e9dc4" }
    },
    {
      "name": "配達",
      "kind": "dyn-rect",
      "lane": "col2",
      "stack": 1,
      "subtitle": "{f4}%",
      "posW": 120,
      "posH": 200,
      "shape": { "kind": "rect", "source": "{f4}", "fillMax": 100, "orient": "up", "fill": "#f97316" }
    },
    {
      "name": "完了",
      "kind": "dyn-rect",
      "lane": "col1",
      "stack": 2,
      "subtitle": "{f5}%",
      "posW": 120,
      "posH": 200,
      "shape": { "kind": "rect", "source": "{f5}", "fillMax": 100, "orient": "up", "fill": "#22c55e" }
    }
  ],
  "flow": [
    { "from": "受注", "to": "決済", "label": "決済へ", "tone": "info" },
    { "from": "決済", "to": "発送", "label": "発送へ", "tone": "info" },
    { "from": "発送", "to": "配達", "label": "配達へ", "tone": "info" },
    { "from": "配達", "to": "完了", "label": "完了", "tone": "success" }
  ],
  "states": { "f1": 0, "f2": 0, "f3": 0, "f4": 0, "f5": 0, "progress": 0, "elapsedHour": 0 },
  "readouts": [
    {
      "id": "progRing",
      "kind": "percent-ring",
      "source": "progress",
      "max": 100,
      "label": "進捗"
    },
    {
      "id": "elapsedCU",
      "kind": "countup",
      "source": "elapsedHour",
      "decimals": 0,
      "unit": " 時",
      "label": "経過"
    }
  ],
  "animation": [
    {
      "step": "受注中",
      "duration": 1.5,
      "focus": ["受注"],
      "tween": { "f1": [0, 100], "progress": [0, 20], "elapsedHour": [0, 1] },
      "badge": "受注"
    },
    {
      "step": "決済中",
      "duration": 1.5,
      "focus": ["受注", "決済", "受注 -> 決済"],
      "tween": { "f2": [0, 100], "progress": [20, 40], "elapsedHour": [1, 2] },
      "badge": "決済"
    },
    {
      "step": "発送中",
      "duration": 1.5,
      "focus": ["受注", "決済", "発送", "受注 -> 決済", "決済 -> 発送"],
      "tween": { "f3": [0, 100], "progress": [40, 60], "elapsedHour": [2, 8] },
      "badge": "発送"
    },
    {
      "step": "配達中",
      "duration": 1.5,
      "focus": ["受注", "決済", "発送", "配達", "受注 -> 決済", "決済 -> 発送", "発送 -> 配達"],
      "tween": { "f4": [0, 100], "progress": [60, 85], "elapsedHour": [8, 24] },
      "badge": "配達"
    },
    {
      "step": "完了",
      "duration": 1.5,
      "focus": ["受注", "決済", "発送", "配達", "完了", "受注 -> 決済", "決済 -> 発送", "発送 -> 配達", "配達 -> 完了"],
      "tween": { "f5": [0, 100], "progress": [85, 100], "elapsedHour": [24, 28] },
      "badge": "完了"
    }
  ]
}`;

export const sourceYaml__richScoreLeaderboard = `title: "4人の得点の推移 (4ラウンドで順位変動、 円の大きさが強さを表す)"
type: flow

lanes:
  l1: { x: 0, width: 180 }
  l2: { x: 240, width: 180 }
  l3: { x: 480, width: 180 }
  l4: { x: 720, width: 180 }

states:
  p1: 20
  p2: 20
  p3: 20
  p4: 20
  totalKill: 0
  avgAcc: 40

readouts:
  killCU: { kind: countup, source: totalKill, decimals: 0, unit: " 回", label: "累計の撃破数" }
  accG: { kind: gauge, source: avgAcc, min: 0, max: 100, color: "#22c55e", label: "平均命中率 %" }

actors:
  - 岸田様: { kind: dyn-circle, lane: l1, stack: 0, subtitle: "得点 {p1}", posW: 160, posH: 180, shape: { kind: circle, radius: "{p1}", fill: "#4e9dc4" } }
  - 山田様: { kind: dyn-circle, lane: l2, stack: 0, subtitle: "得点 {p2}", posW: 160, posH: 180, shape: { kind: circle, radius: "{p2}", fill: "#f97316" } }
  - 佐藤様: { kind: dyn-circle, lane: l3, stack: 0, subtitle: "得点 {p3}", posW: 160, posH: 180, shape: { kind: circle, radius: "{p3}", fill: "#22c55e" } }
  - 森様: { kind: dyn-circle, lane: l4, stack: 0, subtitle: "得点 {p4}", posW: 160, posH: 180, shape: { kind: circle, radius: "{p4}", fill: "#8b7ffa" } }

animation:
  - step: "第 1 戦 (拮抗)" 2s
    focus: ["岸田様", "山田様", "佐藤様", "森様"]
    tween:
      p1: 20 -> 35
      p2: 20 -> 38
      p3: 20 -> 32
      p4: 20 -> 30
      totalKill: 0 -> 12
      avgAcc: 40 -> 52
    badge: "R1 拮抗"
  - step: "第 2 戦 (山田様が先行)" 2s
    focus: ["岸田様", "山田様", "佐藤様", "森様"]
    tween:
      p1: 35 -> 48
      p2: 38 -> 65
      p3: 32 -> 42
      p4: 30 -> 40
      totalKill: 12 -> 28
      avgAcc: 52 -> 58
    badge: "第 2 戦 山田様が先行"
  - step: "第 3 戦 (佐藤様 追い上げ)" 2s
    focus: ["岸田様", "山田様", "佐藤様", "森様"]
    tween:
      p1: 48 -> 55
      p2: 65 -> 68
      p3: 42 -> 72
      p4: 40 -> 45
      totalKill: 28 -> 48
      avgAcc: 58 -> 64
    badge: "R3 佐藤様 追上げ"
  - step: "第 4 戦 (佐藤様 優勝)" 2s
    focus: ["岸田様", "山田様", "佐藤様", "森様"]
    tween:
      p1: 55 -> 62
      p2: 68 -> 74
      p3: 72 -> 80
      p4: 45 -> 50
      totalKill: 48 -> 72
      avgAcc: 64 -> 68
    badge: "R4 佐藤様 優勝"
`;

export const sourceJson__richScoreLeaderboard = `{
  "title": "4人の得点の推移 (4ラウンドで順位変動、 円の大きさが強さを表す)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 180 },
    "l2": { "x": 240, "width": 180 },
    "l3": { "x": 480, "width": 180 },
    "l4": { "x": 720, "width": 180 }
  },
  "actors": [
    {
      "name": "岸田様",
      "kind": "dyn-circle",
      "lane": "l1",
      "stack": 0,
      "subtitle": "得点 {p1}",
      "posW": 160,
      "posH": 180,
      "shape": { "kind": "circle", "radius": "{p1}", "fill": "#4e9dc4" }
    },
    {
      "name": "山田様",
      "kind": "dyn-circle",
      "lane": "l2",
      "stack": 0,
      "subtitle": "得点 {p2}",
      "posW": 160,
      "posH": 180,
      "shape": { "kind": "circle", "radius": "{p2}", "fill": "#f97316" }
    },
    {
      "name": "佐藤様",
      "kind": "dyn-circle",
      "lane": "l3",
      "stack": 0,
      "subtitle": "得点 {p3}",
      "posW": 160,
      "posH": 180,
      "shape": { "kind": "circle", "radius": "{p3}", "fill": "#22c55e" }
    },
    {
      "name": "森様",
      "kind": "dyn-circle",
      "lane": "l4",
      "stack": 0,
      "subtitle": "得点 {p4}",
      "posW": 160,
      "posH": 180,
      "shape": { "kind": "circle", "radius": "{p4}", "fill": "#8b7ffa" }
    }
  ],
  "flow": [],
  "states": { "p1": 20, "p2": 20, "p3": 20, "p4": 20, "totalKill": 0, "avgAcc": 40 },
  "readouts": [
    {
      "id": "killCU",
      "kind": "countup",
      "source": "totalKill",
      "decimals": 0,
      "unit": " 回",
      "label": "累計の撃破数"
    },
    {
      "id": "accG",
      "kind": "gauge",
      "source": "avgAcc",
      "min": 0,
      "max": 100,
      "color": "#22c55e",
      "label": "平均命中率 %"
    }
  ],
  "animation": [
    {
      "step": "第 1 戦 (拮抗)",
      "duration": 2,
      "focus": ["岸田様", "山田様", "佐藤様", "森様"],
      "tween": {
        "p1": [20, 35],
        "p2": [20, 38],
        "p3": [20, 32],
        "p4": [20, 30],
        "totalKill": [0, 12],
        "avgAcc": [40, 52]
      },
      "badge": "R1 拮抗"
    },
    {
      "step": "第 2 戦 (山田様が先行)",
      "duration": 2,
      "focus": ["岸田様", "山田様", "佐藤様", "森様"],
      "tween": {
        "p1": [35, 48],
        "p2": [38, 65],
        "p3": [32, 42],
        "p4": [30, 40],
        "totalKill": [12, 28],
        "avgAcc": [52, 58]
      },
      "badge": "第 2 戦 山田様が先行"
    },
    {
      "step": "第 3 戦 (佐藤様 追い上げ)",
      "duration": 2,
      "focus": ["岸田様", "山田様", "佐藤様", "森様"],
      "tween": {
        "p1": [48, 55],
        "p2": [65, 68],
        "p3": [42, 72],
        "p4": [40, 45],
        "totalKill": [28, 48],
        "avgAcc": [58, 64]
      },
      "badge": "R3 佐藤様 追上げ"
    },
    {
      "step": "第 4 戦 (佐藤様 優勝)",
      "duration": 2,
      "focus": ["岸田様", "山田様", "佐藤様", "森様"],
      "tween": {
        "p1": [55, 62],
        "p2": [68, 74],
        "p3": [72, 80],
        "p4": [45, 50],
        "totalKill": [48, 72],
        "avgAcc": [64, 68]
      },
      "badge": "R4 佐藤様 優勝"
    }
  ]
}`;

export const sourceYaml__richLayeredPriorityFee = `title: "3層優先度手数料 — 混雑度で基本 / 優先 / 上限の手数料が同時に動く"
type: flow

lanes:
  bar: { x: 0, width: 320 }
  stat: { x: 380, width: 320 }

states:
  baseFee: 10
  tipFee: 2
  capFee: 8
  effectiveGwei: 12
  congestion: 15

actors:
  - 上限手数料: { kind: dyn-rect, lane: bar, stack: 0, subtitle: "+{capFee} gwei", posW: 300, posH: 140, shape: { kind: rect, source: "{capFee}", fillMax: 60, orient: "up", fill: "#a08870", radius: 4 } }
  - 優先手数料: { kind: dyn-rect, lane: bar, stack: 1, subtitle: "+{tipFee} gwei", posW: 316, posH: 100, shape: { kind: rect, source: "{tipFee}", fillMax: 50, orient: "up", fill: "#22c55e", radius: 4 } }
  - 基本手数料 (焼却): { kind: dyn-rect, lane: bar, stack: 2, subtitle: "{baseFee} gwei", posW: 382, posH: 180, shape: { kind: rect, source: "{baseFee}", fillMax: 160, orient: "up", fill: "#dc2626", radius: 4 } }
  - 有効総額: { kind: actor, lane: stat, stack: 0, subtitle: "{effectiveGwei} gwei", posW: 280, posH: 180 }
  - 混雑度: { kind: dyn-arc, lane: stat, stack: 1, subtitle: "{congestion}%", posW: 280, posH: 220, shape: { kind: arc, angle: "{congestion}", sweepMax: 100, outerRadius: 90, innerRadius: 62, fill: "#f97316" } }

animation:
  - step: "空のブロック" 1.8s
    focus: ["上限手数料", "優先手数料", "基本手数料 (焼却)", "有効総額", "混雑度"]
    tween:
      baseFee: 10 -> 15
      tipFee: 2 -> 3
      capFee: 8 -> 12
      effectiveGwei: 12 -> 18
      congestion: 15 -> 28
    badge: "空のブロック"
  - step: "平常" 1.8s
    focus: ["上限手数料", "優先手数料", "基本手数料 (焼却)", "有効総額", "混雑度"]
    tween:
      baseFee: 15 -> 45
      tipFee: 3 -> 6
      capFee: 12 -> 20
      effectiveGwei: 18 -> 51
      congestion: 28 -> 58
    badge: "平常"
  - step: "混雑" 1.8s
    focus: ["上限手数料", "優先手数料", "基本手数料 (焼却)", "有効総額", "混雑度"]
    tween:
      baseFee: 45 -> 95
      tipFee: 6 -> 18
      capFee: 20 -> 35
      effectiveGwei: 51 -> 113
      congestion: 58 -> 88
    badge: "混雑"
  - step: "極混雑" 1.8s
    focus: ["上限手数料", "優先手数料", "基本手数料 (焼却)", "有効総額", "混雑度"]
    tween:
      baseFee: 95 -> 140
      tipFee: 18 -> 42
      capFee: 35 -> 55
      effectiveGwei: 113 -> 182
      congestion: 88 -> 96
    badge: "極混雑"
`;

export const sourceJson__richLayeredPriorityFee = `{
  "title": "3層優先度手数料 — 混雑度で基本 / 優先 / 上限の手数料が同時に動く",
  "type": "flow",
  "lanes": {
    "bar": { "x": 0, "width": 320 },
    "stat": { "x": 380, "width": 320 }
  },
  "actors": [
    {
      "name": "上限手数料",
      "kind": "dyn-rect",
      "lane": "bar",
      "stack": 0,
      "subtitle": "+{capFee} gwei",
      "posW": 300,
      "posH": 140,
      "shape": {
        "kind": "rect",
        "source": "{capFee}",
        "fillMax": 60,
        "orient": "up",
        "fill": "#a08870",
        "radius": 4
      }
    },
    {
      "name": "優先手数料",
      "kind": "dyn-rect",
      "lane": "bar",
      "stack": 1,
      "subtitle": "+{tipFee} gwei",
      "posW": 316,
      "posH": 100,
      "shape": {
        "kind": "rect",
        "source": "{tipFee}",
        "fillMax": 50,
        "orient": "up",
        "fill": "#22c55e",
        "radius": 4
      }
    },
    {
      "name": "基本手数料 (焼却)",
      "kind": "dyn-rect",
      "lane": "bar",
      "stack": 2,
      "subtitle": "{baseFee} gwei",
      "posW": 382,
      "posH": 180,
      "shape": {
        "kind": "rect",
        "source": "{baseFee}",
        "fillMax": 160,
        "orient": "up",
        "fill": "#dc2626",
        "radius": 4
      }
    },
    {
      "name": "有効総額",
      "kind": "actor",
      "lane": "stat",
      "stack": 0,
      "subtitle": "{effectiveGwei} gwei",
      "posW": 280,
      "posH": 180
    },
    {
      "name": "混雑度",
      "kind": "dyn-arc",
      "lane": "stat",
      "stack": 1,
      "subtitle": "{congestion}%",
      "posW": 280,
      "posH": 220,
      "shape": {
        "kind": "arc",
        "angle": "{congestion}",
        "sweepMax": 100,
        "outerRadius": 90,
        "innerRadius": 62,
        "fill": "#f97316"
      }
    }
  ],
  "flow": [],
  "states": { "baseFee": 10, "tipFee": 2, "capFee": 8, "effectiveGwei": 12, "congestion": 15 },
  "animation": [
    {
      "step": "空のブロック",
      "duration": 1.8,
      "focus": ["上限手数料", "優先手数料", "基本手数料 (焼却)", "有効総額", "混雑度"],
      "tween": {
        "baseFee": [10, 15],
        "tipFee": [2, 3],
        "capFee": [8, 12],
        "effectiveGwei": [12, 18],
        "congestion": [15, 28]
      },
      "badge": "空のブロック"
    },
    {
      "step": "平常",
      "duration": 1.8,
      "focus": ["上限手数料", "優先手数料", "基本手数料 (焼却)", "有効総額", "混雑度"],
      "tween": {
        "baseFee": [15, 45],
        "tipFee": [3, 6],
        "capFee": [12, 20],
        "effectiveGwei": [18, 51],
        "congestion": [28, 58]
      },
      "badge": "平常"
    },
    {
      "step": "混雑",
      "duration": 1.8,
      "focus": ["上限手数料", "優先手数料", "基本手数料 (焼却)", "有効総額", "混雑度"],
      "tween": {
        "baseFee": [45, 95],
        "tipFee": [6, 18],
        "capFee": [20, 35],
        "effectiveGwei": [51, 113],
        "congestion": [58, 88]
      },
      "badge": "混雑"
    },
    {
      "step": "極混雑",
      "duration": 1.8,
      "focus": ["上限手数料", "優先手数料", "基本手数料 (焼却)", "有効総額", "混雑度"],
      "tween": {
        "baseFee": [95, 140],
        "tipFee": [18, 42],
        "capFee": [35, 55],
        "effectiveGwei": [113, 182],
        "congestion": [88, 96]
      },
      "badge": "極混雑"
    }
  ]
}`;
