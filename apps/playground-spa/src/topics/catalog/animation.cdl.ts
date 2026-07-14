import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Animation ... phase / state / tween / set / badge の動作。
 */

/** 1. 単 phase + state tween */
export const tweenSimple = diagram("tween-simple", { topic: "tween: 数値線形補間" })
  .lane("l", { x: 0, width: 400 })
  .state("counter", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "Counter", value: "{counter}" })
  .phase("p", { duration: 2500, title: "0 → 100 へ tween", body: "phase 内で counter を 0 から 100 へ滑らかに変化。" }, (p: PhaseBuilder) => p.activate("a").tween("counter", 0, 100).badge("tween 中"))
  .build();

/** 2. 連続 phase で tween 累積 */
export const tweenChain = diagram("tween-chain", { topic: "tween: 連続 phase で累積" })
  .lane("l", { x: 0, width: 400 })
  .state("n", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "Sum", value: "{n}" })
  .phase("p1", { duration: 2000, title: "Phase 1: 0 → 10", body: "1 phase 目の tween。" }, (p: PhaseBuilder) => p.activate("a").tween("n", 0, 10).badge("p1"))
  .phase("p2", { duration: 2000, title: "Phase 2: 10 → 50", body: "前 phase の終端値から続けて tween。" }, (p: PhaseBuilder) => p.activate("a").tween("n", 10, 50).badge("p2"))
  .phase("p3", { duration: 2000, title: "Phase 3: 50 → 100", body: "最終 phase で 100 まで。 hold で静止表示。" }, (p: PhaseBuilder) => p.activate("a").tween("n", 50, 100).badge("p3"))
  .build();

/** 3. set (即時切替) */
export const setSwitch = diagram("set-switch", { topic: "set: 即時切替 (lerp なし)" })
  .lane("l", { x: 0, width: 500 })
  .state("status", { initial: "idle" })
  .node("a", { lane: "l", stack: 0, kind: "function", title: "Process", subtitle: "status: {status}" })
  .phase("p1", { duration: 2000, title: "idle → running", body: "set で文字列 state を即時切替。 phase 開始の瞬間に値が変わる。" }, (p: PhaseBuilder) => p.activate("a").set("status", "running").badge("running"))
  .phase("p2", { duration: 2000, title: "running → done", body: "次 phase で done に切替。 tween と違い段階的でなく瞬間遷移。" }, (p: PhaseBuilder) => p.activate("a").set("status", "done").badge("done"))
  .build();

/** 4. badge 動作 */
export const badgePerPhase = diagram("badge-per-phase", { topic: "badge: phase ごと切替" })
  .lane("l", { x: 0, width: 400 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "Step" })
  .phase("p1", { duration: 1500, title: "Phase 1", body: "header に badge='preparing' を表示。" }, (p: PhaseBuilder) => p.activate("a").badge("preparing"))
  .phase("p2", { duration: 1500, title: "Phase 2", body: "header の badge を 'processing' に切替。" }, (p: PhaseBuilder) => p.activate("a").badge("processing"))
  .phase("p3", { duration: 1500, title: "Phase 3", body: "最終 phase で badge='completed'、 step 完了示唆。" }, (p: PhaseBuilder) => p.activate("a").badge("completed"))
  .build();

/** 5. 数値 tween と文字列 set の併用 */
export const mixedTweenSet = diagram("mixed-tween-set", { topic: "tween + set 併用" })
  .lane("l", { x: 0, width: 500 })
  .state("amount", { initial: 0 })
  .state("phase", { initial: "init" })
  .node("a", { lane: "l", stack: 0, kind: "function", title: "Operation", subtitle: "phase: {phase}", value: "{amount}" })
  .phase("p1", { duration: 2400, title: "init → loading + 0 → 50", body: "tween で数値、 set で文字列を同時更新。 1 phase 内で複数 state を制御可能。" }, (p: PhaseBuilder) => p.activate("a").tween("amount", 0, 50).set("phase", "loading").badge("loading"))
  .phase("p2", { duration: 2400, title: "loading → done + 50 → 100", body: "次 phase で完了状態へ。" }, (p: PhaseBuilder) => p.activate("a").tween("amount", 50, 100).set("phase", "done").badge("done"))
  .build();

/**
 * 6. animationCounterViewCount v2 = tweenSimple の business scenario 拡張 (video 配信サービスで 1 動画の view count が 0 → 10000 まで tween で急伸)、 shape-person + shape-mobile-device + shape-website + shape-cdn-edge + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (公開直後 → 拡散 → engagement peak → 定着) + 4 readout (gauge viral 度 / countup view count / stat share 数 / stat 平均滞在秒) が tween で visually 連続変化。 iteration 8 wave 8-V redesign。 tweenSimple 抽象 tween demo と並置。
 */
export const animationCounterViewCount = diagram("animation-counter-view-count", {
  topic: "tween 実業務例 = 動画 view count 急伸 4 phase (公開 → 拡散 → peak → 定着) の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("viewer", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("viralRate", { initial: 0 })
  .state("viewCount", { initial: 0 })
  .state("shareCount", { initial: 0 })
  .state("avgSec", { initial: 0 })
  .node("viewer", { lane: "viewer", stack: 0, kind: "shape-person", title: "視聴者 平方様", eyebrow: "viewer", subtitle: "動画発見 → 視聴 → シェア" })
  .node("phone", { lane: "viewer", stack: 1, kind: "shape-mobile-device", title: "iPhone video app", eyebrow: "device", subtitle: "feed + player + share UI" })
  .node("videoSvc", { lane: "service", stack: 0, kind: "shape-website", title: "video 配信サービス", eyebrow: "service", subtitle: "動画 feed + recommendation" })
  .node("cdn", { lane: "service", stack: 1, kind: "shape-cdn-edge", title: "video CDN edge", eyebrow: "cdn", subtitle: "低遅延 stream + adaptive bitrate" })
  .node("analytics", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "view analytics", eyebrow: "analytics", subtitle: "view + engagement + retention 集計" })
  .node("viewDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "view 履歴 DB", eyebrow: "storage", subtitle: "user 別視聴履歴 + like" })
  .edge("viewer", "phone", { label: "起動", tone: "info" })
  .edge("phone", "videoSvc", { label: "GET", tone: "info" })
  .edge("videoSvc", "cdn", { label: "stream", tone: "success" })
  .edge("videoSvc", "analytics", { label: "track", tone: "accent" })
  .edge("analytics", "viewDb", { label: "persist", tone: "success" })
  .readout.gauge("virG", { source: "viralRate", min: 0, max: 100, color: "#22c55e", label: "viral 度 %" })
  .readout.countup("vcCU", { source: "viewCount", unit: " view", label: "累計 view", decimals: 0 })
  .readout.stat("shrStat", { source: "shareCount", unit: " share", caption: "share", label: "share" })
  .readout.stat("secStat", { source: "avgSec", unit: " 秒", caption: "平均滞在", label: "sec" })
  .phase("p1", {
    duration: 1800,
    title: "公開直後 (Day 0)",
    body: "動画公開、 platform recommendation 初回配信、 平方様含む初期視聴者が視聴開始。 viralRate 0 → 15 tween、 viewCount 0 → 250 tween、 shareCount 0 → 5 tween、 avgSec 0 → 45 tween、 viewer + phone + videoSvc + cdn lane active。",
  }, (p: PhaseBuilder) => p.activate("viewer", "phone", "videoSvc", "cdn", "viewer-phone", "phone-videoSvc", "videoSvc-cdn").tween("viralRate", 0, 15).tween("viewCount", 0, 250).tween("shareCount", 0, 5).tween("avgSec", 0, 45).badge("Day 0"))
  .phase("p2", {
    duration: 2200,
    title: "拡散 (Day 1)",
    body: "SNS シェアで拡散加速、 recommendation algorithm がさらに露出増加。 viralRate 15 → 55 tween、 viewCount 250 → 3500 tween、 shareCount 5 → 42 tween、 avgSec 45 → 68 tween、 analytics + viewDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("viewer", "phone", "videoSvc", "cdn", "analytics", "viewDb", "viewer-phone", "phone-videoSvc", "videoSvc-cdn", "videoSvc-analytics", "analytics-viewDb").tween("viralRate", 15, 55).tween("viewCount", 250, 3500).tween("shareCount", 5, 42).tween("avgSec", 45, 68).badge("Day 1"))
  .phase("p3", {
    duration: 2200,
    title: "engagement peak (Day 3)",
    body: "エンジニアリング界隈でバズ、 like + comment 急増、 平均滞在秒も伸長。 viralRate 55 → 85 tween (gauge 針最上位近く)、 viewCount 3500 → 7800 tween、 shareCount 42 → 128 tween、 avgSec 68 → 92 tween、 CDN edge cache HIT 率 UP。",
  }, (p: PhaseBuilder) => p.activate("viewer", "phone", "videoSvc", "cdn", "analytics", "viewDb", "viewer-phone", "phone-videoSvc", "videoSvc-cdn", "videoSvc-analytics", "analytics-viewDb").tween("viralRate", 55, 85).tween("viewCount", 3500, 7800).tween("shareCount", 42, 128).tween("avgSec", 68, 92).badge("peak"))
  .phase("p4", {
    duration: 2000,
    title: "定着 (Day 7)",
    body: "1 週間経過で拡散収束、 定着 view + 継続的 tail 視聴、 view count 10000 到達。 viralRate 85 → 92 keep (バズ定着)、 viewCount 7800 → 10000 tween (大台到達)、 shareCount 128 → 158 tween、 avgSec 92 → 88 tween (若干下降で安定)、 6 shape 全 active、 動画 lifetime cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("viewer", "phone", "videoSvc", "cdn", "analytics", "viewDb", "viewer-phone", "phone-videoSvc", "videoSvc-cdn", "videoSvc-analytics", "analytics-viewDb").tween("viralRate", 85, 92).tween("viewCount", 7800, 10000).tween("shareCount", 128, 158).tween("avgSec", 92, 88).badge("Day 7"))
  .build();

/**
 * 7. animationSprintProgress v2 = tweenChain の business scenario 拡張 (エンジニア team の 2 週 sprint 進捗、 3 phase で 0 → 100% まで累積 tween)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (計画 → design → impl → ship) + 4 readout (gauge 進捗 / countup 消化 story point / stat 残 task / stat velocity) が tween で visually 連続変化。 iteration 8 wave 8-V redesign。 tweenChain 抽象 chain demo と並置。
 */
export const animationSprintProgress = diagram("animation-sprint-progress", {
  topic: "tween chain 実業務例 = 2 週 sprint 進捗 4 phase (計画 → design → impl → ship) の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("team", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("progress", { initial: 0 })
  .state("spDone", { initial: 0 })
  .state("taskRemain", { initial: 12 })
  .state("velocity", { initial: 0 })
  .node("scrum", { lane: "team", stack: 0, kind: "shape-person", title: "scrum master 松本様", eyebrow: "scrum", subtitle: "8 名 team 主宰 · 2 週 sprint" })
  .node("laptop", { lane: "team", stack: 1, kind: "shape-mobile-device", title: "Slack + Jira mobile", eyebrow: "device", subtitle: "daily standup + burndown 追跡" })
  .node("jira", { lane: "service", stack: 0, kind: "shape-website", title: "Jira scrum board", eyebrow: "board", subtitle: "backlog + sprint 20 SP + card 12 枚" })
  .node("cicd", { lane: "service", stack: 1, kind: "shape-server-rack", title: "CI / CD pipeline", eyebrow: "cicd", subtitle: "PR merge → staging → production" })
  .node("sprintDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "sprint metric DB", eyebrow: "storage", subtitle: "velocity + burndown 履歴保存" })
  .node("retro", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "retro board", eyebrow: "retro", subtitle: "sprint 42 振返り + action item" })
  .edge("scrum", "laptop", { label: "monitor", tone: "info" })
  .edge("laptop", "jira", { label: "update", tone: "info" })
  .edge("jira", "cicd", { label: "trigger", tone: "success" })
  .edge("cicd", "sprintDb", { label: "log", tone: "accent" })
  .edge("sprintDb", "retro", { label: "aggregate", tone: "success" })
  .readout.gauge("prG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "sprint 進捗 %" })
  .readout.countup("spCU", { source: "spDone", unit: " SP", label: "消化 story point", decimals: 0 })
  .readout.stat("remStat", { source: "taskRemain", unit: " task", caption: "残 task", label: "rem" })
  .readout.stat("velStat", { source: "velocity", unit: " SP/日", caption: "velocity", label: "vel" })
  .phase("p1", {
    duration: 1800,
    title: "計画 (Day 1)",
    body: "松本様がスプリント計画会議主催、 backlog から 20 SP 選定 + 8 名で担当割当。 progress 0 → 10 tween、 spDone 0 → 2 tween、 taskRemain 12 keep、 velocity 0 → 2 tween、 scrum + laptop + jira lane active。",
  }, (p: PhaseBuilder) => p.activate("scrum", "laptop", "jira", "scrum-laptop", "laptop-jira").tween("progress", 0, 10).tween("spDone", 0, 2).tween("velocity", 0, 2).badge("計画"))
  .phase("p2", {
    duration: 2200,
    title: "design (Day 4)",
    body: "設計 review + プロトタイプ完成 + 実装着手、 SP 7 消化。 progress 10 → 40 tween、 spDone 2 → 8 tween、 taskRemain 12 → 8 tween、 velocity 2 → 3 tween、 cicd lane activate。",
  }, (p: PhaseBuilder) => p.activate("scrum", "laptop", "jira", "cicd", "scrum-laptop", "laptop-jira", "jira-cicd").tween("progress", 10, 40).tween("spDone", 2, 8).tween("taskRemain", 12, 8).tween("velocity", 2, 3).badge("design"))
  .phase("p3", {
    duration: 2200,
    title: "impl (Day 8)",
    body: "実装 phase 佳境、 PR merge 続々、 staging deploy 開始。 progress 40 → 80 tween、 spDone 8 → 16 tween、 taskRemain 8 → 3 tween、 velocity 3 → 4 tween、 sprintDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("scrum", "laptop", "jira", "cicd", "sprintDb", "scrum-laptop", "laptop-jira", "jira-cicd", "cicd-sprintDb").tween("progress", 40, 80).tween("spDone", 8, 16).tween("taskRemain", 8, 3).tween("velocity", 3, 4).badge("impl"))
  .phase("p4", {
    duration: 2000,
    title: "ship + retro (Day 14)",
    body: "全 task 完遂、 production deploy 成功、 retro で action item 抽出。 progress 80 → 100 tween (gauge 針最上位)、 spDone 16 → 20 tween、 taskRemain 3 → 0 tween、 velocity 4 → 3 tween (平均化)、 retro lane activate、 6 shape 全 active、 sprint 42 完遂。",
  }, (p: PhaseBuilder) => p.activate("scrum", "laptop", "jira", "cicd", "sprintDb", "retro", "scrum-laptop", "laptop-jira", "jira-cicd", "cicd-sprintDb", "sprintDb-retro").tween("progress", 80, 100).tween("spDone", 16, 20).tween("taskRemain", 3, 0).tween("velocity", 4, 3).badge("ship"))
  .build();

/**
 * 8. animationBuildStatus v2 = setSwitch の business scenario 拡張 (CI/CD pipeline で build status を queued → running → tests → deployed に即時切替)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (queued → running → tests → deployed) + 4 readout (gauge build 進捗 / countup 累計 build / stat 直近 duration / stat エラー率) が tween で visually 連続変化。 iteration 8 wave 8-V redesign。 setSwitch 抽象 set demo と並置。
 */
export const animationBuildStatus = diagram("animation-build-status", {
  topic: "set 実業務例 = CI/CD build status 即時切替 4 phase (queued → running → tests → deployed) の flow を shape-* primitive 6 種で表現 + 4 readout tween",
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
  .node("dev", { lane: "dev", stack: 0, kind: "shape-person", title: "developer 北野様", eyebrow: "dev", subtitle: "PR #4231 push 直後 · CI 監視中" })
  .node("phone", { lane: "dev", stack: 1, kind: "shape-mobile-device", title: "GitHub mobile app", eyebrow: "device", subtitle: "PR status + push 通知" })
  .node("gh", { lane: "cicd", stack: 0, kind: "shape-website", title: "GitHub Actions", eyebrow: "ci", subtitle: "workflow trigger + status page" })
  .node("runner", { lane: "cicd", stack: 1, kind: "shape-server-rack", title: "self-hosted runner", eyebrow: "runner", subtitle: "build + test + deploy 実行" })
  .node("deployTarget", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "prod cluster", eyebrow: "deploy", subtitle: "GKE cluster + rolling update" })
  .node("buildDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "build 履歴 DB", eyebrow: "storage", subtitle: "全 build log + artifact + status" })
  .edge("dev", "phone", { label: "push", tone: "info" })
  .edge("phone", "gh", { label: "trigger", tone: "info" })
  .edge("gh", "runner", { label: "dispatch", tone: "success" })
  .edge("runner", "deployTarget", { label: "deploy", tone: "accent" })
  .edge("deployTarget", "buildDb", { label: "log", tone: "success" })
  .readout.gauge("bpG", { source: "buildPct", min: 0, max: 100, color: "#22c55e", label: "build %" })
  .readout.countup("bdCU", { source: "buildCount", unit: " 回", label: "累計 build", decimals: 0 })
  .readout.stat("durStat", { source: "durationSec", unit: " 秒", caption: "duration", label: "dur" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "queued",
    body: "北野様が PR push、 GitHub Actions が workflow queue 投入 status = 'queued'。 buildPct 0 → 10 tween、 buildCount 8721 keep、 durationSec 0 → 3 tween、 errRate 0 keep、 dev + phone + gh lane active。",
  }, (p: PhaseBuilder) => p.activate("dev", "phone", "gh", "dev-phone", "phone-gh").set("status", "queued").tween("buildPct", 0, 10).tween("durationSec", 0, 3).tween("curStep", 0, 1).badge("queued"))
  .phase("p2", {
    duration: 2000,
    title: "running",
    body: "runner が build 開始、 status = 'running' 即時切替、 コンパイル + lint 実行。 buildPct 10 → 45 tween、 buildCount 8721 → 8722 tween、 durationSec 3 → 25 tween、 runner lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "phone", "gh", "runner", "dev-phone", "phone-gh", "gh-runner").set("status", "running").tween("buildPct", 10, 45).tween("buildCount", 8721, 8722).tween("durationSec", 3, 25).tween("curStep", 1, 2).badge("running"))
  .phase("p3", {
    duration: 2200,
    title: "tests",
    body: "unit test + integration test 実行、 status = 'tests' 即時切替、 一部 flaky test で errRate 微増。 buildPct 45 → 85 tween、 durationSec 25 → 65 tween、 errRate 0 → 2 tween、 buildDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("dev", "phone", "gh", "runner", "buildDb", "dev-phone", "phone-gh", "gh-runner").set("status", "tests").tween("buildPct", 45, 85).tween("durationSec", 25, 65).tween("errRate", 0, 2).tween("curStep", 2, 3).badge("tests"))
  .phase("p4", {
    duration: 2000,
    title: "deployed",
    body: "全 pass → prod cluster に rolling update、 status = 'deployed' 即時切替、 北野様に完了通知。 buildPct 85 → 100 tween (gauge 針最上位)、 durationSec 65 → 78 tween (最終)、 errRate 2 keep、 deployTarget lane activate、 6 shape 全 active、 CI/CD cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("dev", "phone", "gh", "runner", "buildDb", "deployTarget", "dev-phone", "phone-gh", "gh-runner", "runner-deployTarget", "deployTarget-buildDb").set("status", "deployed").tween("buildPct", 85, 100).tween("durationSec", 65, 78).set("curStep", 3).badge("deployed"))
  .build();

/**
 * 9. animationDeployBadge v2 = badgePerPhase の business scenario 拡張 (production deploy pipeline で badge を preparing → deploying → validating → live に切替)、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-cylinder + shape-iot-sensor の 6 shape で visual scene 化、 4 phase (preparing → deploying → validating → live) + 4 readout (gauge deploy 進捗 / countup 累計 deploy / stat rollout 秒 / stat health check pass 数) が tween で visually 連続変化。 iteration 8 wave 8-W redesign。 badgePerPhase 抽象 badge demo と並置。
 */
export const animationDeployBadge = diagram("animation-deploy-badge", {
  topic: "badge 実業務例 = production deploy pipeline 4 phase (preparing → deploying → validating → live) の flow を shape-* primitive 6 種で表現 + 4 readout tween",
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
  .node("sre", { lane: "sre", stack: 0, kind: "shape-person", title: "release engineer 山内様", eyebrow: "release", subtitle: "金曜夕方の production deploy 担当" })
  .node("dashboard", { lane: "sre", stack: 1, kind: "shape-mobile-device", title: "deploy dashboard", eyebrow: "device", subtitle: "phase badge + progress bar" })
  .node("cluster", { lane: "service", stack: 0, kind: "shape-server-rack", title: "prod k8s cluster", eyebrow: "prod", subtitle: "10 pod rolling update target" })
  .node("orchestrator", { lane: "service", stack: 1, kind: "shape-cloud", title: "deploy orchestrator", eyebrow: "orchestrator", subtitle: "canary → 100% + rollback safety" })
  .node("healthProbe", { lane: "outcome", stack: 0, kind: "shape-iot-sensor", title: "health probe", eyebrow: "probe", subtitle: "各 pod /healthz + metric 監視" })
  .node("deployLog", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "deploy 履歴 DB", eyebrow: "storage", subtitle: "全 phase + rollout 秒 + status 保存" })
  .edge("sre", "dashboard", { label: "trigger", tone: "info" })
  .edge("dashboard", "orchestrator", { label: "start", tone: "info" })
  .edge("orchestrator", "cluster", { label: "rolling update", tone: "accent" })
  .edge("cluster", "healthProbe", { label: "probe", tone: "success" })
  .edge("healthProbe", "deployLog", { label: "log", tone: "success" })
  .readout.gauge("dpG", { source: "deployPct", min: 0, max: 100, color: "#22c55e", label: "deploy %" })
  .readout.countup("dcCU", { source: "deployCount", unit: " 回", label: "累計 deploy", decimals: 0 })
  .readout.stat("rolStat", { source: "rolloutSec", unit: " 秒", caption: "rollout", label: "roll" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "preparing",
    body: "山内様が deploy dashboard で trigger、 orchestrator が preparing badge 表示、 事前 rollback backup 作成。 deployPct 0 → 15 tween、 deployCount 4521 keep、 rolloutSec 0 → 8 tween、 healthPass 0 keep、 sre + dashboard + orchestrator lane active。",
  }, (p: PhaseBuilder) => p.activate("sre", "dashboard", "orchestrator", "sre-dashboard", "dashboard-orchestrator").tween("deployPct", 0, 15).tween("rolloutSec", 0, 8).tween("curStep", 0, 1).badge("preparing"))
  .phase("p2", {
    duration: 2000,
    title: "deploying",
    body: "orchestrator が k8s cluster に rolling update kick、 badge = 'deploying'、 5 pod 順次 replace。 deployPct 15 → 55 tween、 deployCount 4521 → 4522 tween、 rolloutSec 8 → 40 tween、 cluster lane activate。",
  }, (p: PhaseBuilder) => p.activate("sre", "dashboard", "orchestrator", "cluster", "sre-dashboard", "dashboard-orchestrator", "orchestrator-cluster").tween("deployPct", 15, 55).tween("deployCount", 4521, 4522).tween("rolloutSec", 8, 40).tween("curStep", 1, 2).badge("deploying"))
  .phase("p3", {
    duration: 2000,
    title: "validating",
    body: "全 pod up 後 healthProbe が /healthz 判定、 badge = 'validating'、 10 pod × 3 check = 30 判定。 deployPct 55 → 90 tween、 rolloutSec 40 → 70 tween、 healthPass 0 → 28 tween、 healthProbe lane activate。",
  }, (p: PhaseBuilder) => p.activate("sre", "dashboard", "orchestrator", "cluster", "healthProbe", "sre-dashboard", "dashboard-orchestrator", "orchestrator-cluster", "cluster-healthProbe").tween("deployPct", 55, 90).tween("rolloutSec", 40, 70).tween("healthPass", 0, 28).tween("curStep", 2, 3).badge("validating"))
  .phase("p4", {
    duration: 2000,
    title: "live",
    body: "全 health check pass、 badge = 'live'、 deployLog に成功記録、 山内様 Slack 完了報告。 deployPct 90 → 100 tween (gauge 針最上位)、 rolloutSec 70 → 78 tween (最終)、 healthPass 28 → 30 tween、 deployLog lane activate、 6 shape 全 active、 deploy pipeline cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("sre", "dashboard", "orchestrator", "cluster", "healthProbe", "deployLog", "sre-dashboard", "dashboard-orchestrator", "orchestrator-cluster", "cluster-healthProbe", "healthProbe-deployLog").tween("deployPct", 90, 100).tween("rolloutSec", 70, 78).tween("healthPass", 28, 30).set("curStep", 3).badge("live"))
  .build();

/**
 * 10. animationOrderProgress v2 = mixedTweenSet の business scenario 拡張 (EC 注文処理で amount tween + phase set 併用)、 shape-person + shape-mobile-device + shape-online-shop + shape-brokerage + shape-warehouse + shape-cylinder の 6 shape で visual scene 化、 4 phase (init → charging → shipping → delivered) + 4 readout (gauge 進捗 / countup 累計 orders / stat 金額 / stat 配送日) が tween で visually 連続変化。 iteration 8 wave 8-W redesign。 mixedTweenSet 抽象 mixed demo と並置。
 */
export const animationOrderProgress = diagram("animation-order-progress", {
  topic: "tween + set 併用 実業務例 = EC 注文処理 4 phase (init → charging → shipping → delivered) の flow を shape-* primitive 6 種で表現 + 4 readout tween",
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
  .node("buyer", { lane: "buyer", stack: 0, kind: "shape-person", title: "buyer 藤本様", eyebrow: "buyer", subtitle: "商品注文 → 配送追跡者" })
  .node("phone", { lane: "buyer", stack: 1, kind: "shape-mobile-device", title: "EC mobile app", eyebrow: "device", subtitle: "注文 + 決済 + 配送 status" })
  .node("shop", { lane: "service", stack: 0, kind: "shape-online-shop", title: "EC service", eyebrow: "shop", subtitle: "注文管理 + phase state 更新" })
  .node("payment", { lane: "service", stack: 1, kind: "shape-brokerage", title: "payment gateway", eyebrow: "payment", subtitle: "Stripe charge + settlement" })
  .node("warehouse", { lane: "outcome", stack: 0, kind: "shape-warehouse", title: "配送センター", eyebrow: "warehouse", subtitle: "picking + packing + shipping" })
  .node("orderDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "注文 DB", eyebrow: "storage", subtitle: "全 phase transition + timestamp" })
  .edge("buyer", "phone", { label: "注文", tone: "info" })
  .edge("phone", "shop", { label: "commit", tone: "info" })
  .edge("shop", "payment", { label: "charge", tone: "success" })
  .edge("shop", "warehouse", { label: "picking", tone: "accent" })
  .edge("warehouse", "orderDb", { label: "persist", tone: "success" })
  .readout.gauge("prG", { source: "curStep", min: 0, max: 3, color: "#22c55e", label: "進捗 step" })
  .readout.countup("ocCU", { source: "orderCount", unit: " 件", label: "累計 orders", decimals: 0 })
  .readout.stat("amtStat", { source: "amount", unit: " %", caption: "amount", label: "amt" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "init",
    body: "藤本様が注文 confirm、 shop が phase = 'init' set、 amount 0 で待機。 amount 0 → 15 tween、 orderCount 12451 keep、 dayCount 0 keep、 buyer + phone + shop lane active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "buyer-phone", "phone-shop").set("phase", "init").tween("amount", 0, 15).tween("curStep", 0, 1).badge("init"))
  .phase("p2", {
    duration: 2000,
    title: "charging",
    body: "phase = 'charging' set、 payment gateway が Stripe charge 実行、 amount progress 更新。 amount 15 → 45 tween、 orderCount 12451 → 12452 tween、 payment lane activate。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payment", "buyer-phone", "phone-shop", "shop-payment").set("phase", "charging").tween("amount", 15, 45).tween("orderCount", 12451, 12452).tween("curStep", 1, 2).badge("charging"))
  .phase("p3", {
    duration: 2200,
    title: "shipping",
    body: "phase = 'shipping' set、 warehouse が picking + packing + 配送業者 pickup、 amount 継続進捗。 amount 45 → 85 tween、 dayCount 0 → 1 tween、 warehouse lane activate。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payment", "warehouse", "buyer-phone", "phone-shop", "shop-payment", "shop-warehouse").set("phase", "shipping").tween("amount", 45, 85).tween("dayCount", 0, 1).tween("curStep", 2, 3).badge("shipping"))
  .phase("p4", {
    duration: 2000,
    title: "delivered",
    body: "phase = 'delivered' set、 藤本様手元到着、 orderDb に final state 記録。 amount 85 → 100 tween (gauge 針最上位)、 dayCount 1 → 3 tween (最終)、 orderDb lane activate、 6 shape 全 active、 EC 注文 cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payment", "warehouse", "orderDb", "buyer-phone", "phone-shop", "shop-payment", "shop-warehouse", "warehouse-orderDb").set("phase", "delivered").tween("amount", 85, 100).tween("dayCount", 1, 3).set("curStep", 3).badge("delivered"))
  .build();
