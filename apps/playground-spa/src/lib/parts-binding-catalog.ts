/**
 * canvas pivot parts binding catalog (full = 36 entries)。
 * user 「連動の組み合わせちゃんと満たしてる？漏れない？」 の対応 2026-07-18。
 * parts.cdl.ts の全 80 parts から binding 対応可能な 36 個 (source 8 + sink 28) を登録。
 * heuristic 分類 = source (押される/増える累積 numeric) + sink (描画型 numeric)。
 * standalone (色 state / 配列 state / 状態遷移) = binding scope 外 28 個。
 * multi-sink (numeric 複数 state 持ち) = 16 個、 現状 default state で単一 bindable として扱い。
 *
 * ## 動作例
 *
 * 1. `partsCounterActor` (source) を drop
 * 2. counter1 右上「⚡」 click → 連動可能 sink (28 種) 一覧表示
 * 3. `partsArcGauge` (sink) を選択 → `- arc1: { kind: arc-gauge, bind: counter1.n }` 追加
 * 4. compile 側で arc の state `v` を counter1 の state `n` と同名 rename、 cdl 側 state 共有で連動
 */

export type PartsRole = "source" | "sink" | "standalone";

export interface PartsBindingDef {
  kind: string;
  role: PartsRole;
  bindableState: string | null;
  valueRange: { min: number; max: number };
  label: string;
}

/** 全 parts の binding role 定義 (36 entries、 2026-07-18 full audit)。 */
export const PARTS_BINDING_CATALOG: Record<string, PartsBindingDef> = {
  // === source (8) = 押される / 増える 累積 numeric parts ===
  "counter-actor": { kind: "counter-actor", role: "source", bindableState: "n", valueRange: { min: 0, max: 100 }, label: "カウンタ" },
  "countup": { kind: "countup", role: "source", bindableState: "n", valueRange: { min: 0, max: 100 }, label: "カウントアップ" },
  "like-button": { kind: "like-button", role: "source", bindableState: "likes", valueRange: { min: 0, max: 100 }, label: "いいね" },
  "shopping-cart": { kind: "shopping-cart", role: "source", bindableState: "cnt", valueRange: { min: 0, max: 100 }, label: "カート数" },
  "mail-inbox": { kind: "mail-inbox", role: "source", bindableState: "unread", valueRange: { min: 0, max: 100 }, label: "未読メール" },
  "coin-balance": { kind: "coin-balance", role: "source", bindableState: "coin", valueRange: { min: 0, max: 100 }, label: "コイン残高" },
  "exp-bar": { kind: "exp-bar", role: "source", bindableState: "xp", valueRange: { min: 0, max: 100 }, label: "経験値" },
  "bell-notification": { kind: "bell-notification", role: "source", bindableState: "alerts", valueRange: { min: 0, max: 100 }, label: "通知ベル" },

  // === sink (28) = 描画型 numeric parts ===
  "arc-gauge": { kind: "arc-gauge", role: "sink", bindableState: "v", valueRange: { min: 0, max: 100 }, label: "アークゲージ" },
  "percent-ring": { kind: "percent-ring", role: "sink", bindableState: "v", valueRange: { min: 0, max: 100 }, label: "パーセントリング" },
  "horizontal-bar": { kind: "horizontal-bar", role: "sink", bindableState: "pv", valueRange: { min: 0, max: 100 }, label: "横進捗バー" },
  "wave-gauge": { kind: "wave-gauge", role: "sink", bindableState: "lv", valueRange: { min: 0, max: 100 }, label: "波打つゲージ" },
  "bucket-reservoir": { kind: "bucket-reservoir", role: "sink", bindableState: "water", valueRange: { min: 0, max: 100 }, label: "バケット貯留" },
  "thermometer": { kind: "thermometer", role: "sink", bindableState: "temp", valueRange: { min: 0, max: 100 }, label: "温度計" },
  "speedometer": { kind: "speedometer", role: "sink", bindableState: "kph", valueRange: { min: 0, max: 100 }, label: "スピードメーター" },
  "volume-meter": { kind: "volume-meter", role: "sink", bindableState: "vol", valueRange: { min: 0, max: 100 }, label: "音量メーター" },
  "disk-usage": { kind: "disk-usage", role: "sink", bindableState: "used", valueRange: { min: 0, max: 100 }, label: "ディスク使用率" },
  "budget-usage": { kind: "budget-usage", role: "sink", bindableState: "used", valueRange: { min: 0, max: 100 }, label: "予算消化率" },
  "battery-level": { kind: "battery-level", role: "sink", bindableState: "bat", valueRange: { min: 0, max: 100 }, label: "バッテリー残量" },
  "sparkline": { kind: "sparkline", role: "sink", bindableState: "v", valueRange: { min: 0, max: 100 }, label: "スパークライン" },
  "pulse-indicator": { kind: "pulse-indicator", role: "sink", bindableState: "rate", valueRange: { min: 0, max: 100 }, label: "パルス指標" },
  "heartbeat": { kind: "heartbeat", role: "sink", bindableState: "bpm", valueRange: { min: 0, max: 100 }, label: "心拍波形" },
  "cloud-sync": { kind: "cloud-sync", role: "sink", bindableState: "sync", valueRange: { min: 0, max: 100 }, label: "クラウド同期" },
  "sale-tag": { kind: "sale-tag", role: "sink", bindableState: "off", valueRange: { min: 0, max: 100 }, label: "セール割引率" },
  "digital-clock": { kind: "digital-clock", role: "sink", bindableState: "hh", valueRange: { min: 0, max: 100 }, label: "デジタル時計" },
  "badge-count": { kind: "badge-count", role: "sink", bindableState: "cnt", valueRange: { min: 0, max: 100 }, label: "バッジカウント" },
  "countdown": { kind: "countdown", role: "sink", bindableState: "sec", valueRange: { min: 0, max: 100 }, label: "カウントダウン" },
  "bind-arc-sweep": { kind: "bind-arc-sweep", role: "sink", bindableState: "deg", valueRange: { min: 0, max: 100 }, label: "arc sweep" },
  "bind-countdown": { kind: "bind-countdown", role: "sink", bindableState: "sec", valueRange: { min: 0, max: 100 }, label: "bind countdown" },
  "bind-counter-radius": { kind: "bind-counter-radius", role: "sink", bindableState: "count", valueRange: { min: 0, max: 100 }, label: "counter radius" },
  "bind-grow-shrink": { kind: "bind-grow-shrink", role: "sink", bindableState: "r", valueRange: { min: 0, max: 100 }, label: "grow shrink" },
  "bind-pulse-cycle": { kind: "bind-pulse-cycle", role: "sink", bindableState: "pulse", valueRange: { min: 0, max: 100 }, label: "pulse cycle" },
  "bind-ring-counter": { kind: "bind-ring-counter", role: "sink", bindableState: "k", valueRange: { min: 0, max: 100 }, label: "ring counter" },
  "bind-template-chain": { kind: "bind-template-chain", role: "sink", bindableState: "rate", valueRange: { min: 0, max: 100 }, label: "template chain" },
  "bind-tween-chain-4": { kind: "bind-tween-chain-4", role: "sink", bindableState: "v", valueRange: { min: 0, max: 100 }, label: "tween chain 4" },
  "bind-wave-level-2phase": { kind: "bind-wave-level-2phase", role: "sink", bindableState: "lvl", valueRange: { min: 0, max: 100 }, label: "wave level" },
};

export function getBindingDef(kind: string): PartsBindingDef {
  return PARTS_BINDING_CATALOG[kind] ?? {
    kind, role: "standalone", bindableState: null, valueRange: { min: 0, max: 100 }, label: kind,
  };
}

export function listBindableSinks(sourceKind: string): PartsBindingDef[] {
  const source = getBindingDef(sourceKind);
  if (source.role !== "source") return [];
  return Object.values(PARTS_BINDING_CATALOG).filter((p) => p.role === "sink");
}

export function listBindableSources(sinkKind: string): PartsBindingDef[] {
  const sink = getBindingDef(sinkKind);
  if (sink.role !== "sink") return [];
  return Object.values(PARTS_BINDING_CATALOG).filter((p) => p.role === "source");
}
