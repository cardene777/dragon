import { diagram } from "@cardenelabs/cdl";
import type { EdgeStyle, Tone, PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Styles ... edge / tone の見た目バリエーション。
 */

// lane gap = label pill 最大幅 (~240px = 14 文字 mono) + node 端マージン分を確保
function smallPair(id: string, style: EdgeStyle, tone: Tone, label: string, topicOverride: string, sub?: string) {
  return diagram(id, { topic: topicOverride })
    .lane("l1", { x: 0, width: 280 })
    .lane("l2", { x: 600, width: 280 })
    .node("a", { lane: "l1", stack: 0, kind: "actor", title: "From" })
    .node("b", { lane: "l2", stack: 0, kind: "actor", title: "To" })
    .edge("a", "b", { id: "e", label, sub, tone, style })
    .phase("p", { duration: 1800, title: `${style} / ${tone}`, body: "edge styleとtoneの組み合わせを確認。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge(tone))
    .build();
}

/** 1. EdgeStyle 2 種 = 線種の違いを比較 (tone は accent 固定) */
export const styleSolid = smallPair("style-solid", "solid", "accent", "solid", "solid style (実線 + 矢頭、 edge の default)", "実線 + 矢頭");
export const styleDottedFlow = smallPair("style-dotted-flow", "dotted-flow", "accent", "dotted-flow", "dotted-flow style (点線 + 粒子、 動的 flow 表現)", "点線 + 粒子");

/** 2. Tone 全 6 種 (solid edge で色差を確認) = 色 identity の違いを比較 */
export const toneAccent = smallPair("tone-accent", "solid", "accent", "accent", "accent tone (主張色、 dark navy)");
export const toneTeal = smallPair("tone-teal", "solid", "teal", "teal", "teal tone (青緑、 secondary emphasis)");
export const toneSuccess = smallPair("tone-success", "solid", "success", "success", "success tone (green、 成功状態)");
export const toneError = smallPair("tone-error", "solid", "error", "error", "error tone (red、 エラー状態)");
export const toneWarning = smallPair("tone-warning", "solid", "warning", "warning", "warning tone (orange、 警告状態)");
export const toneInfo = smallPair("tone-info", "solid", "info", "info", "info tone (light blue、 情報表示)");

/** 3. Inactive vs Active */
export const stateActive = diagram("state-active", { topic: "edge: active 状態" })
  .lane("l1", { x: 0, width: 280 })
  .lane("l2", { x: 600, width: 280 })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .edge("a", "b", { id: "e", label: "active", tone: "accent", style: "solid" })
  .phase("p", { duration: 1800, title: "active状態", body: "フェーズ でactivateされたedgeは太く + 色付きでvisible。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge("active"))
  .build();

export const stateInactive = diagram("state-inactive", { topic: "edge: inactive 状態" })
  .lane("l1", { x: 0, width: 280 })
  .lane("l2", { x: 600, width: 280 })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .edge("a", "b", { id: "e", label: "inactive", tone: "accent", style: "solid" })
  .phase("p", { duration: 1800, title: "inactive状態", body: "activateされていないedgeは薄い灰色 + dashで静的表示。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge("edge は inactive"))
  .build();

/**
 * 3. stateActiveConnection v2 = stateActive の business scenario 拡張 (SaaS realtime chat で WebSocket connection が active、 messages が流れる)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (接続前 → handshake → active messaging → keepalive) + 4 readout (gauge connection 健康度 / countup msg 数 / stat 平均 latency / stat active session) が tween で visually 連続変化。 iteration 8 wave 8-W redesign。 stateActive 抽象 edge state demo と並置。
 */
export const stateActiveConnection = diagram("state-active-connection", {
  topic: "リアルタイムチャットのWebSocketが接続前から握手、通信中、維持通信まで遷移",
})
  .lane("client", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("healthPct", { initial: 0 })
  .state("msgCount", { initial: 0 })
  .state("latency", { initial: 0 })
  .state("activeSessions", { initial: 8541 })
  .state("curStep", { initial: 0 })
  .node("user", { lane: "client", stack: 0, kind: "shape-person", title: "chat利用者 上野様", eyebrow: "利用者", subtitle: "realtime chat利用中" })
  .node("app", { lane: "client", stack: 1, kind: "shape-mobile-device", title: "chatモバイル アプリ", eyebrow: "端末", subtitle: "WebSocket接続 + msg送受信" })
  .node("wsGateway", { lane: "service", stack: 0, kind: "shape-website", title: "WebSocketゲートウェイ", eyebrow: "ゲートウェイ", subtitle: "接続upgrade + 認証 + routing" })
  .node("chatSvc", { lane: "service", stack: 1, kind: "shape-server-rack", title: "chatサービス", eyebrow: "chat", subtitle: "msg broadcast + presence管理" })
  .node("presenceSvc", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "presenceサービス", eyebrow: "presence", subtitle: "全 セッション 監視 + ハートビート" })
  .node("msgDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "msg履歴DB", eyebrow: "保存", subtitle: "全msg保存 + 検索 インデックス" })
  .edge("user", "app", { label: "起動", tone: "info" })
  .edge("app", "wsGateway", { label: "connect (active)", tone: "accent" })
  .edge("wsGateway", "chatSvc", { label: "経路", tone: "success" })
  .edge("chatSvc", "presenceSvc", { label: "生存確認", tone: "info" })
  .edge("chatSvc", "msgDb", { label: "persist", tone: "success" })
  .readout.gauge("hpG", { source: "healthPct", min: 0, max: 100, color: "#22c55e", label: "connection健康度 %" })
  .readout.countup("mcCU", { source: "msgCount", unit: " msg", label: "累計msg", decimals: 0 })
  .readout.stat("latStat", { source: "latency", unit: " ms", caption: "平均 latency", label: "lat" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "接続前",
    body: "上野様がchatアプリ 起動、 WebSocket接続まだ確立していない。 healthPct 0 keep、 msgCount 0 keep、 latency 0 keep、 activeSessions 8541 keep、 利用者 + アプリlane active。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "user-app").tween("curStep", 0, 1).badge("接続前"))
  .phase("p2", {
    duration: 1800,
    title: "ハンドシェイク",
    body: "WebSocket upgradeハンドシェイク + 認証 トークン 検証、 wsGatewayで接続establish。 healthPct 0 → 55 tween、 latency 0 → 45 tween、 activeSessions 8541 → 8542 tween、 wsGateway lane activate、 active edge発火。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "wsGateway", "user-app", "app-wsGateway").tween("healthPct", 0, 55).tween("latency", 0, 45).tween("activeSessions", 8541, 8542).tween("curStep", 1, 2).badge("handshake"))
  .phase("p3", {
    duration: 2200,
    title: "active messaging",
    body: "上野様がchat msg送信、 chatSvcがbroadcast + msgDb persist、 active connection上で双方向msg。 healthPct 55 → 95 tween (ゲージ 針上振れ)、 msgCount 0 → 24 tween、 latency 45 → 32 tween (低遅延安定)、 chatSvc + msgDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "wsGateway", "chatSvc", "msgDb", "user-app", "app-wsGateway", "wsGateway-chatSvc", "chatSvc-msgDb").tween("healthPct", 55, 95).tween("msgCount", 0, 24).tween("latency", 45, 32).tween("curStep", 2, 3).badge("messaging"))
  .phase("p4", {
    duration: 2000,
    title: "維持通信",
    body: "idle状態でpresenceSvcが ハートビートping、 接続維持 + セッション 追跡。 healthPct 95 → 100 tween (最高値)、 msgCount 24 → 30 tween、 latency 32 → 28 tween、 activeSessions 8542 keep、 presenceSvc lane activate、 6 shape全active、 realtime chat cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "wsGateway", "chatSvc", "msgDb", "presenceSvc", "user-app", "app-wsGateway", "wsGateway-chatSvc", "chatSvc-presenceSvc", "chatSvc-msgDb").tween("healthPct", 95, 100).tween("msgCount", 24, 30).tween("latency", 32, 28).set("curStep", 3).badge("keepalive"))
  .build();

/**
 * 4. stateInactiveMonitor v2 = stateInactive の business scenario 拡張 (SaaS batch job monitor で inactive job → active job の遷移、 idle → running → active に visible 化)、 shape-person + shape-mobile-device + shape-server-rack + shape-cloud + shape-iot-sensor + shape-cylinder の 6 shape で visual scene 化、 4 phase (idle 監視 → job trigger → active 実行 → 完了 idle 復帰) + 4 readout (gauge job utilization / countup 累計 run / stat 平均秒 / stat idle 分) が tween で visually 連続変化。 iteration 8 wave 8-W redesign。 stateInactive 抽象 inactive demo と並置。
 */
export const stateInactiveMonitor = diagram("state-inactive-monitor", {
  topic: "バッチジョブ監視でアイドルからトリガー、実行中、完了後アイドル復帰の状態遷移",
})
  .lane("ops", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("utilization", { initial: 5 })
  .state("runCount", { initial: 234 })
  .state("avgSec", { initial: 0 })
  .state("idleMin", { initial: 55 })
  .state("curStep", { initial: 0 })
  .node("ops", { lane: "ops", stack: 0, kind: "shape-person", title: "運用 高瀬様", eyebrow: "運用", subtitle: "バッチジョブ 稼働監視" })
  .node("dashboard", { lane: "ops", stack: 1, kind: "shape-mobile-device", title: "バッチdashboard", eyebrow: "端末", subtitle: "ジョブstatus + 履歴view" })
  .node("scheduler", { lane: "service", stack: 0, kind: "shape-cloud", title: "ジョブscheduler", eyebrow: "scheduler", subtitle: "Cron起動 + concurrency制御" })
  .node("worker", { lane: "service", stack: 1, kind: "shape-server-rack", title: "バッチ ワーカー", eyebrow: "ワーカー", subtitle: "現在idle · 次trigger待機" })
  .node("healthProbe", { lane: "outcome", stack: 0, kind: "shape-iot-sensor", title: "health probe", eyebrow: "probe", subtitle: "ワーカー liveness + resource監視" })
  .node("jobLog", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "ジョブ 履歴DB", eyebrow: "保存", subtitle: "全run + duration + status保存" })
  .edge("ops", "dashboard", { label: "監視", tone: "info" })
  .edge("dashboard", "scheduler", { label: "ポーリング", tone: "info" })
  .edge("scheduler", "worker", { label: "起動", tone: "accent" })
  .edge("worker", "healthProbe", { label: "probe", tone: "success" })
  .edge("healthProbe", "jobLog", { label: "ログ", tone: "success" })
  .readout.gauge("utG", { source: "utilization", min: 0, max: 100, color: "#22c55e", label: "utilization %" })
  .readout.countup("rcCU", { source: "runCount", unit: " 回", label: "累計run", decimals: 0 })
  .readout.stat("avgStat", { source: "avgSec", unit: " 秒", caption: "平均", label: "平均" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "idle監視",
    body: "ワーカー はidle、 高瀬様が ダッシュボード で稼働状況確認。 scheduler → ワーカー edgeはinactive表示(灰色 + dashed)、 直近 起動 なし。 utilization 5 keep、 idleMin 55 → 60 tween、 avgSec 0 keep、 運用 + ダッシュボード + scheduler + ワーカー lane active (ワーカー はidle表示)。",
  }, (p: PhaseBuilder) => p.activate("ops", "dashboard", "scheduler", "worker", "ops-dashboard", "dashboard-scheduler", "scheduler-worker").tween("idleMin", 55, 60).tween("curStep", 0, 1).badge("idle"))
  .phase("p2", {
    duration: 1800,
    title: "ジョブtrigger",
    body: "schedulerのCron発火、 ワーカー に 起動 送信、 inactive edgeがactive edgeに切替。 utilization 5 → 45 tween、 runCount 234 → 235 tween、 avgSec 0 → 8 tween、 idleMin 60 → 0 tween (idle状態解除)。",
  }, (p: PhaseBuilder) => p.activate("ops", "dashboard", "scheduler", "worker", "ops-dashboard", "dashboard-scheduler", "scheduler-worker").tween("utilization", 5, 45).tween("runCount", 234, 235).tween("avgSec", 0, 8).tween("idleMin", 60, 0).tween("curStep", 1, 2).badge("trigger"))
  .phase("p3", {
    duration: 2000,
    title: "active実行",
    body: "ワーカー が実処理実行、 healthProbeでresource監視 + jobLogにprogress記録。 utilization 45 → 95 tween (ゲージ 針上振れ)、 avgSec 8 → 45 tween、 healthProbe + jobLog lane activate。",
  }, (p: PhaseBuilder) => p.activate("ops", "dashboard", "scheduler", "worker", "healthProbe", "jobLog", "ops-dashboard", "dashboard-scheduler", "scheduler-worker", "worker-healthProbe", "healthProbe-jobLog").tween("utilization", 45, 95).tween("avgSec", 8, 45).tween("curStep", 2, 3).badge("active"))
  .phase("p4", {
    duration: 2000,
    title: "完了idle復帰",
    body: "ジョブ 完了、 ワーカー が再度idle状態に戻る、 edgeもinactive表示に戻る。 utilization 95 → 8 tween (急降下、 idle復帰)、 avgSec 45 → 48 tween (最終)、 idleMin 0 → 3 tween、 6 shape全active、 バッチジョブcycle完遂。",
  }, (p: PhaseBuilder) => p.activate("ops", "dashboard", "scheduler", "worker", "healthProbe", "jobLog", "ops-dashboard", "dashboard-scheduler", "scheduler-worker", "worker-healthProbe", "healthProbe-jobLog").tween("utilization", 95, 8).tween("avgSec", 45, 48).tween("idleMin", 0, 3).set("curStep", 3).badge("完了 idle"))
  .build();
