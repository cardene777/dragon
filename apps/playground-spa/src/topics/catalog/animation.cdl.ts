import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Animation ... phase / state / tween / set / badge の動作。
 */

/** 1. 単 phase + state tween */
export const tweenSimple = diagram("tween-simple", { topic: "tween: 数値線形補間" })
  .lane("l", { x: 0, width: 400 })
  .state("counter", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "カウンター", value: "{counter}" })
  .phase("p", { duration: 2500, title: "0 → 100へtween", body: "フェーズ 内で カウンター を0から100へ滑らかに変化。" }, (p: PhaseBuilder) => p.activate("a").tween("counter", 0, 100).badge("tween 中"))
  .build();

/** 2. 連続 phase で tween 累積 */
export const tweenChain = diagram("tween-chain", { topic: "tween: 連続 phase で累積" })
  .lane("l", { x: 0, width: 400 })
  .state("n", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "合計", value: "{n}" })
  .phase("p1", { duration: 2000, title: "フェーズ1: 0 → 10", body: "1フェーズ 目のtween。" }, (p: PhaseBuilder) => p.activate("a").tween("n", 0, 10).badge("p1"))
  .phase("p2", { duration: 2000, title: "フェーズ2: 10 → 50", body: "前 フェーズ の終端値から続けてtween。" }, (p: PhaseBuilder) => p.activate("a").tween("n", 10, 50).badge("p2"))
  .phase("p3", { duration: 2000, title: "フェーズ3: 50 → 100", body: "最終 フェーズ で100まで。 holdで静止表示。" }, (p: PhaseBuilder) => p.activate("a").tween("n", 50, 100).badge("p3"))
  .build();

/** 3. set (即時切替) */
export const setSwitch = diagram("set-switch", { topic: "set: 即時切替 (lerp なし)" })
  .lane("l", { x: 0, width: 500 })
  .state("status", { initial: "idle" })
  .node("a", { lane: "l", stack: 0, kind: "function", title: "処理", subtitle: "状態: {状態}" })
  .phase("p1", { duration: 2000, title: "アイドル → 実行中", body: "setで文字列状態を即時切替。 フェーズ開始の瞬間に値が変わる。" }, (p: PhaseBuilder) => p.activate("a").set("status", "running").badge("実行中"))
  .phase("p2", { duration: 2000, title: "実行中 → 完了", body: "次 フェーズ で 完了 に切替。 tweenと違い段階的でなく瞬間遷移。" }, (p: PhaseBuilder) => p.activate("a").set("status", "done").badge("done"))
  .build();

/** 4. badge 動作 */
export const badgePerPhase = diagram("badge-per-phase", { topic: "badge: phase ごと切替" })
  .lane("l", { x: 0, width: 400 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "ステップ" })
  .phase("p1", { duration: 1500, title: "フェーズ1", body: "ヘッダー に バッジ='preparing' を表示。" }, (p: PhaseBuilder) => p.activate("a").badge("preparing"))
  .phase("p2", { duration: 1500, title: "フェーズ2", body: "ヘッダー の バッジ を 'processing' に切替。" }, (p: PhaseBuilder) => p.activate("a").badge("processing"))
  .phase("p3", { duration: 1500, title: "フェーズ3", body: "最終 フェーズ で バッジ='完了'、 ステップ 完了示唆。" }, (p: PhaseBuilder) => p.activate("a").badge("completed"))
  .build();

/** 5. 数値 tween と文字列 set の併用 */
export const mixedTweenSet = diagram("mixed-tween-set", { topic: "tween + set 併用" })
  .lane("l", { x: 0, width: 500 })
  .state("amount", { initial: 0 })
  .state("phase", { initial: "init" })
  .node("a", { lane: "l", stack: 0, kind: "function", title: "操作", subtitle: "フェーズ: {フェーズ}", value: "{amount}" })
  .phase("p1", { duration: 2400, title: "init → loading + 0 → 50", body: "tweenで数値、 setで文字列を同時更新。 1フェーズ 内で複数 状態 を制御可能。" }, (p: PhaseBuilder) => p.activate("a").tween("amount", 0, 50).set("phase", "loading").badge("loading"))
  .phase("p2", { duration: 2400, title: "loading → 完了 + 50 → 100", body: "次 フェーズ で完了状態へ。" }, (p: PhaseBuilder) => p.activate("a").tween("amount", 50, 100).set("phase", "done").badge("done"))
  .build();

/**
 * 6. animationCounterViewCount v2 = tweenSimple の business scenario 拡張 (video 配信サービスで 1 動画の view count が 0 → 10000 まで tween で急伸)、 shape-person + shape-mobile-device + shape-website + shape-cdn-edge + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (公開直後 → 拡散 → engagement peak → 定着) + 4 readout (gauge viral 度 / countup view count / stat share 数 / stat 平均滞在秒) が tween で visually 連続変化。 iteration 8 wave 8-V redesign。 tweenSimple 抽象 tween demo と並置。
 */
export const animationCounterViewCount = diagram("animation-counter-view-count", {
  topic: "動画公開直後から1週間で再生数がゼロから1万まで急伸する軌跡",
})
  .lane("viewer", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("viralRate", { initial: 0 })
  .state("viewCount", { initial: 0 })
  .state("shareCount", { initial: 0 })
  .state("avgSec", { initial: 0 })
  .node("viewer", { lane: "viewer", stack: 0, kind: "shape-person", title: "視聴者 平方様", eyebrow: "視聴者", subtitle: "動画発見 → 視聴 → シェア" })
  .node("phone", { lane: "viewer", stack: 1, kind: "shape-mobile-device", title: "iPhone動画アプリ", eyebrow: "端末", subtitle: "フィード + プレイヤー + 共有UI" })
  .node("videoSvc", { lane: "service", stack: 0, kind: "shape-website", title: "動画配信サービス", eyebrow: "サービス", subtitle: "動画feed + 推薦" })
  .node("cdn", { lane: "service", stack: 1, kind: "shape-cdn-edge", title: "動画CDNエッジ", eyebrow: "CDN", subtitle: "低遅延stream + 適応ビットレート" })
  .node("analytics", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "閲覧分析", eyebrow: "分析", subtitle: "表示 + エンゲージメント + retention集計" })
  .node("viewDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "閲覧履歴DB", eyebrow: "保存", subtitle: "利用者 別視聴履歴 + いいね" })
  .edge("viewer", "phone", { label: "起動", tone: "info" })
  .edge("phone", "videoSvc", { label: "取得", tone: "info" })
  .edge("videoSvc", "cdn", { label: "ストリーム", tone: "success" })
  .edge("videoSvc", "analytics", { label: "追跡", tone: "accent" })
  .edge("analytics", "viewDb", { label: "保存", tone: "success" })
  .readout.gauge("virG", { source: "viralRate", min: 0, max: 100, color: "#22c55e", label: "viral度 %" })
  .readout.countup("vcCU", { source: "viewCount", unit: " 表示", label: "累計 表示", decimals: 0 })
  .readout.stat("shrStat", { source: "shareCount", unit: " 共有", caption: "共有", label: "共有" })
  .readout.stat("secStat", { source: "avgSec", unit: " 秒", caption: "平均滞在", label: "秒" })
  .phase("p1", {
    duration: 1800,
    title: "公開直後(Day 0)",
    body: "動画公開、 platform推薦 初回配信、 平方様含む初期視聴者が視聴開始。 viralRate 0 → 15 tween、 viewCount 0 → 250 tween、 shareCount 0 → 5 tween、 avgSec 0 → 45 tween、 視聴者 + スマホ + videoSvc + CDN lane有効。",
  }, (p: PhaseBuilder) => p.activate("viewer", "phone", "videoSvc", "cdn", "viewer-phone", "phone-videoSvc", "videoSvc-cdn").tween("viralRate", 0, 15).tween("viewCount", 0, 250).tween("shareCount", 0, 5).tween("avgSec", 0, 45).badge("Day 0"))
  .phase("p2", {
    duration: 2200,
    title: "拡散(Day 1)",
    body: "SNSシェアで拡散加速、 推薦algorithmがさらに露出増加。 viralRate 15 → 55 tween、 viewCount 250 → 3500 tween、 shareCount 5 → 42 tween、 avgSec 45 → 68 tween、 分析 + viewDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("viewer", "phone", "videoSvc", "cdn", "analytics", "viewDb", "viewer-phone", "phone-videoSvc", "videoSvc-cdn", "videoSvc-analytics", "analytics-viewDb").tween("viralRate", 15, 55).tween("viewCount", 250, 3500).tween("shareCount", 5, 42).tween("avgSec", 45, 68).badge("Day 1"))
  .phase("p3", {
    duration: 2200,
    title: "エンゲージメントピーク(Day 3)",
    body: "エンジニアリング界隈でバズ、 いいね + comment急増、 平均滞在秒も伸長。 viralRate 55 → 85 tween (ゲージ 針最上位近く)、 viewCount 3500 → 7800 tween、 shareCount 42 → 128 tween、 avgSec 68 → 92 tween、 CDN edgeキャッシュHIT率 上。",
  }, (p: PhaseBuilder) => p.activate("viewer", "phone", "videoSvc", "cdn", "analytics", "viewDb", "viewer-phone", "phone-videoSvc", "videoSvc-cdn", "videoSvc-analytics", "analytics-viewDb").tween("viralRate", 55, 85).tween("viewCount", 3500, 7800).tween("shareCount", 42, 128).tween("avgSec", 68, 92).badge("peak"))
  .phase("p4", {
    duration: 2000,
    title: "定着(Day 7)",
    body: "1週間経過で拡散収束、 定着 表示 + 継続的tail視聴、 再生数10000到達。 viralRate 85 → 92 keep (バズ定着)、 viewCount 7800 → 10000 tween (大台到達)、 shareCount 128 → 158 tween、 avgSec 92 → 88 tween (若干下降で安定)、 6 shape全active、 動画lifetime cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("viewer", "phone", "videoSvc", "cdn", "analytics", "viewDb", "viewer-phone", "phone-videoSvc", "videoSvc-cdn", "videoSvc-analytics", "analytics-viewDb").tween("viralRate", 85, 92).tween("viewCount", 7800, 10000).tween("shareCount", 128, 158).tween("avgSec", 92, 88).badge("Day 7"))
  .build();

/**
 * 7. animationSprintProgress v2 = tweenChain の business scenario 拡張 (エンジニア team の 2 週 sprint 進捗、 3 phase で 0 → 100% まで累積 tween)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (計画 → design → impl → ship) + 4 readout (gauge 進捗 / countup 消化 story point / stat 残 task / stat velocity) が tween で visually 連続変化。 iteration 8 wave 8-V redesign。 tweenChain 抽象 chain demo と並置。
 */
export const animationSprintProgress = diagram("animation-sprint-progress", {
  topic: "8名開発チームが2週間スプリントで設計から実装、テスト、リリースまで消化",
})
  .lane("team", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("progress", { initial: 0 })
  .state("spDone", { initial: 0 })
  .state("taskRemain", { initial: 12 })
  .state("velocity", { initial: 0 })
  .node("scrum", { lane: "team", stack: 0, kind: "shape-person", title: "スクラムマスター 松本様", eyebrow: "スクラム", subtitle: "8名 チーム 主宰 · 2週 スプリント" })
  .node("laptop", { lane: "team", stack: 1, kind: "shape-mobile-device", title: "SlackとJiraモバイル", eyebrow: "端末", subtitle: "dailyスタンドアップ + burndown追跡" })
  .node("jira", { lane: "service", stack: 0, kind: "shape-website", title: "Jiraかんばんボード", eyebrow: "ボード", subtitle: "バックログ + スプリント20 SP + カード12枚" })
  .node("cicd", { lane: "service", stack: 1, kind: "shape-server-rack", title: "CI/CDパイプライン", eyebrow: "CI/CD", subtitle: "PRマージ → ステージング → production" })
  .node("sprintDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "スプリント指標DB", eyebrow: "保存", subtitle: "ベロシティ + burndown履歴保存" })
  .node("retro", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "ふりかえりボード", eyebrow: "ふりかえり", subtitle: "スプリント42振返り + アクション項目" })
  .edge("scrum", "laptop", { label: "監視", tone: "info" })
  .edge("laptop", "jira", { label: "更新", tone: "info" })
  .edge("jira", "cicd", { label: "起動", tone: "success" })
  .edge("cicd", "sprintDb", { label: "ログ", tone: "accent" })
  .edge("sprintDb", "retro", { label: "集約", tone: "success" })
  .readout.gauge("prG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "スプリント 進捗 %" })
  .readout.countup("spCU", { source: "spDone", unit: " SP", label: "消化story point", decimals: 0 })
  .readout.stat("remStat", { source: "taskRemain", unit: " タスク", caption: "残 タスク", label: "残" })
  .readout.stat("velStat", { source: "velocity", unit: " SP/日", caption: "速度", label: "速度" })
  .phase("p1", {
    duration: 1800,
    title: "計画(Day 1)",
    body: "松本様がスプリント計画会議主催、 バックログ から20 SP選定 + 8名で担当割当。 進捗0 → 10 tween、 spDone 0 → 2 tween、 taskRemain 12 keep、 ベロシティ0 → 2 tween、 スクラム + ノートPC + jira lane有効。",
  }, (p: PhaseBuilder) => p.activate("scrum", "laptop", "jira", "scrum-laptop", "laptop-jira").tween("progress", 0, 10).tween("spDone", 0, 2).tween("velocity", 0, 2).badge("計画"))
  .phase("p2", {
    duration: 2200,
    title: "design (Day 4)",
    body: "設計 レビュー + プロトタイプ完成 + 実装着手、 SP 7消化。 進捗10 → 40 tween、 spDone 2 → 8 tween、 taskRemain 12 → 8 tween、 ベロシティ2 → 3 tween、 CI/CD lane activate。",
  }, (p: PhaseBuilder) => p.activate("scrum", "laptop", "jira", "cicd", "scrum-laptop", "laptop-jira", "jira-cicd").tween("progress", 10, 40).tween("spDone", 2, 8).tween("taskRemain", 12, 8).tween("velocity", 2, 3).badge("design"))
  .phase("p3", {
    duration: 2200,
    title: "impl (Day 8)",
    body: "実装 フェーズ 佳境、 PRマージ 続々、 ステージング デプロイ 開始。 進捗40 → 80 tween、 spDone 8 → 16 tween、 taskRemain 8 → 3 tween、 ベロシティ3 → 4 tween、 sprintDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("scrum", "laptop", "jira", "cicd", "sprintDb", "scrum-laptop", "laptop-jira", "jira-cicd", "cicd-sprintDb").tween("progress", 40, 80).tween("spDone", 8, 16).tween("taskRemain", 8, 3).tween("velocity", 3, 4).badge("impl"))
  .phase("p4", {
    duration: 2000,
    title: "ship + ふりかえり(Day 14)",
    body: "全 タスク 完遂、 productionデプロイ 成功、 ふりかえり で アクション項目 抽出。 進捗80 → 100 tween (ゲージ 針最上位)、 spDone 16 → 20 tween、 taskRemain 3 → 0 tween、 ベロシティ4 → 3 tween (平均化)、 ふりかえりlane activate、 6 shape全active、 スプリント42完遂。",
  }, (p: PhaseBuilder) => p.activate("scrum", "laptop", "jira", "cicd", "sprintDb", "retro", "scrum-laptop", "laptop-jira", "jira-cicd", "cicd-sprintDb", "sprintDb-retro").tween("progress", 80, 100).tween("spDone", 16, 20).tween("taskRemain", 3, 0).tween("velocity", 4, 3).badge("ship"))
  .build();

/**
 * 8. animationBuildStatus v2 = setSwitch の business scenario 拡張 (CI/CD pipeline で build status を queued → running → tests → deployed に即時切替)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (queued → running → tests → deployed) + 4 readout (gauge build 進捗 / countup 累計 build / stat 直近 duration / stat エラー率) が tween で visually 連続変化。 iteration 8 wave 8-V redesign。 setSwitch 抽象 set demo と並置。
 */
export const animationBuildStatus = diagram("animation-build-status", {
  topic: "CI/CDのビルド状態がキュー投入から実行、テスト、デプロイ完了まで遷移",
})
  .lane("dev", { x: 0, width: 220 })
  .lane("cicd", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("status", { initial: "queued" })
  .state("buildPct", { initial: 0 })
  .state("buildCount", { initial: 8721 })
  .state("durationSec", { initial: 0 })
  .state("errRate", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("dev", { lane: "dev", stack: 0, kind: "shape-person", title: "開発者 北野様", eyebrow: "開発", subtitle: "PR #4231 push直後 · CI監視中" })
  .node("phone", { lane: "dev", stack: 1, kind: "shape-mobile-device", title: "GitHubモバイル アプリ", eyebrow: "端末", subtitle: "PR状態 + push通知" })
  .node("gh", { lane: "cicd", stack: 0, kind: "shape-website", title: "GitHub Actions", eyebrow: "ci", subtitle: "ワークフロー起動 + ステータスページ" })
  .node("runner", { lane: "cicd", stack: 1, kind: "shape-server-rack", title: "self-hosted実行環境", eyebrow: "実行環境", subtitle: "ビルド + テスト + deploy実行" })
  .node("deployTarget", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "本番クラスター", eyebrow: "デプロイ", subtitle: "GKEクラスター + ローリング更新" })
  .node("buildDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "ビルド履歴DB", eyebrow: "保存", subtitle: "全 ビルドログ + 成果物と状態" })
  .edge("dev", "phone", { label: "プッシュ", tone: "info" })
  .edge("phone", "gh", { label: "起動", tone: "info" })
  .edge("gh", "runner", { label: "配信", tone: "success" })
  .edge("runner", "deployTarget", { label: "デプロイ", tone: "accent" })
  .edge("deployTarget", "buildDb", { label: "ログ", tone: "success" })
  .readout.gauge("bpG", { source: "buildPct", min: 0, max: 100, color: "#22c55e", label: "ビルド %" })
  .readout.countup("bdCU", { source: "buildCount", unit: " 回", label: "累計 ビルド", decimals: 0 })
  .readout.stat("durStat", { source: "durationSec", unit: " 秒", caption: "所要時間", label: "時間" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "キュー投入",
    body: "北野様がPRプッシュ、 GitHub Actionsが ワークフロー キュー 投入 状態 = 'キュー投入'。 buildPct 0 → 10 tween、 buildCount 8721 keep、 durationSec 0 → 3 tween、 errRate 0 keep、 開発 + スマホ + gh lane有効。",
  }, (p: PhaseBuilder) => p.activate("dev", "phone", "gh", "dev-phone", "phone-gh").set("status", "queued").tween("buildPct", 0, 10).tween("durationSec", 0, 3).tween("curStep", 0, 1).badge("queued"))
  .phase("p2", {
    duration: 2000,
    title: "実行中",
    body: "実行環境 が ビルド 開始、 状態 = '実行中' 即時切替、 コンパイル + Lint実行。 buildPct 10 → 45 tween、 buildCount 8721 → 8722 tween、 durationSec 3 → 25 tween、 実行環境lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "phone", "gh", "runner", "dev-phone", "phone-gh", "gh-runner").set("status", "running").tween("buildPct", 10, 45).tween("buildCount", 8721, 8722).tween("durationSec", 3, 25).tween("curStep", 1, 2).badge("running"))
  .phase("p3", {
    duration: 2200,
    title: "テスト",
    body: "unitテスト + integrationテスト 実行、 状態 = 'テスト' 即時切替、 一部flakyテスト でerrRate微増。 buildPct 45 → 85 tween、 durationSec 25 → 65 tween、 errRate 0 → 2 tween、 buildDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "phone", "gh", "runner", "buildDb", "dev-phone", "phone-gh", "gh-runner").set("status", "tests").tween("buildPct", 45, 85).tween("durationSec", 25, 65).tween("errRate", 0, 2).tween("curStep", 2, 3).badge("tests"))
  .phase("p4", {
    duration: 2000,
    title: "deployed",
    body: "全pass → 本番クラスター に ローリング更新、 状態 = 'deployed' 即時切替、 北野様に完了通知。 buildPct 85 → 100 tween (ゲージ 針最上位)、 durationSec 65 → 78 tween (最終)、 errRate 2 keep、 deployTarget lane activate、 6 shape全active、 CI/CD cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("dev", "phone", "gh", "runner", "buildDb", "deployTarget", "dev-phone", "phone-gh", "gh-runner", "runner-deployTarget", "deployTarget-buildDb").set("status", "deployed").tween("buildPct", 85, 100).tween("durationSec", 65, 78).set("curStep", 3).badge("deployed"))
  .build();

/**
 * 9. animationDeployBadge v2 = badgePerPhase の business scenario 拡張 (production deploy pipeline で badge を preparing → deploying → validating → live に切替)、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-cylinder + shape-iot-sensor の 6 shape で visual scene 化、 4 phase (preparing → deploying → validating → live) + 4 readout (gauge deploy 進捗 / countup 累計 deploy / stat rollout 秒 / stat health check pass 数) が tween で visually 連続変化。 iteration 8 wave 8-W redesign。 badgePerPhase 抽象 badge demo と並置。
 */
export const animationDeployBadge = diagram("animation-deploy-badge", {
  topic: "本番デプロイのパイプラインが準備、デプロイ、検証、稼働開始と進行",
})
  .lane("sre", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("deployPct", { initial: 0 })
  .state("deployCount", { initial: 4521 })
  .state("rolloutSec", { initial: 0 })
  .state("healthPass", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("sre", { lane: "sre", stack: 0, kind: "shape-person", title: "releaseエンジニア 山内様", eyebrow: "リリース", subtitle: "金曜夕方のproduction deploy担当" })
  .node("dashboard", { lane: "sre", stack: 1, kind: "shape-mobile-device", title: "デプロイ ダッシュボード", eyebrow: "端末", subtitle: "フェーズ バッジ + 進捗bar" })
  .node("cluster", { lane: "service", stack: 0, kind: "shape-server-rack", title: "本番K8sクラスター", eyebrow: "本番", subtitle: "10 podローリング更新target" })
  .node("orchestrator", { lane: "service", stack: 1, kind: "shape-cloud", title: "deploy編成器", eyebrow: "編成器", subtitle: "カナリア → 100% + 戻しsafety" })
  .node("healthProbe", { lane: "outcome", stack: 0, kind: "shape-iot-sensor", title: "health探査", eyebrow: "探査", subtitle: "各pod /healthz + metric監視" })
  .node("deployLog", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "deploy履歴DB", eyebrow: "保存", subtitle: "全phase + rollout秒 + status保存" })
  .edge("sre", "dashboard", { label: "起動", tone: "info" })
  .edge("dashboard", "orchestrator", { label: "開始", tone: "info" })
  .edge("orchestrator", "cluster", { label: "ローリング更新", tone: "accent" })
  .edge("cluster", "healthProbe", { label: "探査", tone: "success" })
  .edge("healthProbe", "deployLog", { label: "ログ", tone: "success" })
  .readout.gauge("dpG", { source: "deployPct", min: 0, max: 100, color: "#22c55e", label: "デプロイ %" })
  .readout.countup("dcCU", { source: "deployCount", unit: " 回", label: "累計 デプロイ", decimals: 0 })
  .readout.stat("rolStat", { source: "rolloutSec", unit: " 秒", caption: "展開", label: "巻" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "preparing",
    body: "山内様が デプロイ ダッシュボード で 起動、 編成器 がpreparingバッジ 表示、 事前rollbackバックアップ 作成。 deployPct 0 → 15 tween、 deployCount 4521 keep、 rolloutSec 0 → 8 tween、 healthPass 0 keep、 SRE + ダッシュボード + 編成器lane有効。",
  }, (p: PhaseBuilder) => p.activate("sre", "dashboard", "orchestrator", "sre-dashboard", "dashboard-orchestrator").tween("deployPct", 0, 15).tween("rolloutSec", 0, 8).tween("curStep", 0, 1).badge("preparing"))
  .phase("p2", {
    duration: 2000,
    title: "deploying",
    body: "編成器 がK8sクラスター に ローリング更新kick、 バッジ = 'deploying'、 5 Pod順次replace。 deployPct 15 → 55 tween、 deployCount 4521 → 4522 tween、 rolloutSec 8 → 40 tween、 クラスター lane activate。",
  }, (p: PhaseBuilder) => p.activate("sre", "dashboard", "orchestrator", "cluster", "sre-dashboard", "dashboard-orchestrator", "orchestrator-cluster").tween("deployPct", 15, 55).tween("deployCount", 4521, 4522).tween("rolloutSec", 8, 40).tween("curStep", 1, 2).badge("deploying"))
  .phase("p3", {
    duration: 2000,
    title: "validating",
    body: "全Pod上 後healthProbeが /healthz判定、 バッジ = 'validating'、 10 Pod × 3チェック = 30判定。 deployPct 55 → 90 tween、 rolloutSec 40 → 70 tween、 healthPass 0 → 28 tween、 healthProbe lane activate。",
  }, (p: PhaseBuilder) => p.activate("sre", "dashboard", "orchestrator", "cluster", "healthProbe", "sre-dashboard", "dashboard-orchestrator", "orchestrator-cluster", "cluster-healthProbe").tween("deployPct", 55, 90).tween("rolloutSec", 40, 70).tween("healthPass", 0, 28).tween("curStep", 2, 3).badge("validating"))
  .phase("p4", {
    duration: 2000,
    title: "live",
    body: "全 ヘルスチェックpass、 バッジ = 'live'、 deployLogに成功記録、 山内様Slack完了報告。 deployPct 90 → 100 tween (ゲージ 針最上位)、 rolloutSec 70 → 78 tween (最終)、 healthPass 28 → 30 tween、 deployLog lane activate、 6 shape全active、 デプロイ パイプラインcycle完遂。",
  }, (p: PhaseBuilder) => p.activate("sre", "dashboard", "orchestrator", "cluster", "healthProbe", "deployLog", "sre-dashboard", "dashboard-orchestrator", "orchestrator-cluster", "cluster-healthProbe", "healthProbe-deployLog").tween("deployPct", 90, 100).tween("rolloutSec", 70, 78).tween("healthPass", 28, 30).set("curStep", 3).badge("live"))
  .build();

/**
 * 10. animationOrderProgress v2 = mixedTweenSet の business scenario 拡張 (EC 注文処理で amount tween + phase set 併用)、 shape-person + shape-mobile-device + shape-online-shop + shape-brokerage + shape-warehouse + shape-cylinder の 6 shape で visual scene 化、 4 phase (init → charging → shipping → delivered) + 4 readout (gauge 進捗 / countup 累計 orders / stat 金額 / stat 配送日) が tween で visually 連続変化。 iteration 8 wave 8-W redesign。 mixedTweenSet 抽象 mixed demo と並置。
 */
export const animationOrderProgress = diagram("animation-order-progress", {
  topic: "EC注文が受付から決済、配送、到着完了まで4段階の状態を経て購入完了",
})
  .lane("buyer", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("phase", { initial: "init" })
  .state("amount", { initial: 0 })
  .state("orderCount", { initial: 12451 })
  .state("dayCount", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("buyer", { lane: "buyer", stack: 0, kind: "shape-person", title: "購入者 藤本様", eyebrow: "購入者", subtitle: "商品注文 → 配送追跡者" })
  .node("phone", { lane: "buyer", stack: 1, kind: "shape-mobile-device", title: "ECモバイル アプリ", eyebrow: "端末", subtitle: "注文 + 決済 + 配送status" })
  .node("shop", { lane: "service", stack: 0, kind: "shape-online-shop", title: "ECサービス", eyebrow: "ショップ", subtitle: "注文管理 + フェーズstate更新" })
  .node("payment", { lane: "service", stack: 1, kind: "shape-brokerage", title: "決済ゲートウェイ", eyebrow: "決済", subtitle: "Stripe課金 + settlement" })
  .node("warehouse", { lane: "outcome", stack: 0, kind: "shape-warehouse", title: "配送センター", eyebrow: "warehouse", subtitle: "選定 + packing + 配送" })
  .node("orderDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "注文DB", eyebrow: "保存", subtitle: "全phase transition + timestamp" })
  .edge("buyer", "phone", { label: "注文", tone: "info" })
  .edge("phone", "shop", { label: "コミット", tone: "info" })
  .edge("shop", "payment", { label: "課金", tone: "success" })
  .edge("shop", "warehouse", { label: "選定", tone: "accent" })
  .edge("warehouse", "orderDb", { label: "保存", tone: "success" })
  .readout.gauge("prG", { source: "curStep", min: 0, max: 3, color: "#22c55e", label: "進捗 ステップ" })
  .readout.countup("ocCU", { source: "orderCount", unit: " 件", label: "累計 注文", decimals: 0 })
  .readout.stat("amtStat", { source: "amount", unit: " %", caption: "金額", label: "額" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "init",
    body: "藤本様が注文 確認、 ショップ が フェーズ = 'init' set、 金額0で待機。 金額0 → 15 tween、 orderCount 12451 keep、 dayCount 0 keep、 購入者 + スマホ + ショップlane有効。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "buyer-phone", "phone-shop").set("phase", "init").tween("amount", 0, 15).tween("curStep", 0, 1).badge("init"))
  .phase("p2", {
    duration: 2000,
    title: "charging",
    body: "フェーズ = 'charging' set、 決済ゲートウェイ がStripe charge実行、 金額progress更新。 金額15 → 45 tween、 orderCount 12451 → 12452 tween、 決済lane activate。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payment", "buyer-phone", "phone-shop", "shop-payment").set("phase", "charging").tween("amount", 15, 45).tween("orderCount", 12451, 12452).tween("curStep", 1, 2).badge("charging"))
  .phase("p3", {
    duration: 2200,
    title: "配送",
    body: "フェーズ = '配送' set、 warehouseがpicking + packing + 配送業者pickup、 金額 継続進捗。 金額45 → 85 tween、 dayCount 0 → 1 tween、 warehouse lane activate。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payment", "warehouse", "buyer-phone", "phone-shop", "shop-payment", "shop-warehouse").set("phase", "shipping").tween("amount", 45, 85).tween("dayCount", 0, 1).tween("curStep", 2, 3).badge("shipping"))
  .phase("p4", {
    duration: 2000,
    title: "配達済",
    body: "フェーズ = '配達済' set、 藤本様手元到着、 orderDbにfinal状態 記録。 金額85 → 100 tween (ゲージ 針最上位)、 dayCount 1 → 3 tween (最終)、 orderDb lane activate、 6 shape全active、 EC注文cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payment", "warehouse", "orderDb", "buyer-phone", "phone-shop", "shop-payment", "shop-warehouse", "warehouse-orderDb").set("phase", "delivered").tween("amount", 85, 100).tween("dayCount", 1, 3).set("curStep", 3).badge("delivered"))
  .build();
