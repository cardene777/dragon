import { diagram } from "@cardenelabs/cdl";
import type { NodeKind, PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Primitives ... lane / node の基本パーツ。
 * 全 card で lane width 440 統一 = SVG viewBox 同サイズ = catalog grid 整列。
 */

const W = 440;

/**
 * 1. NodeKind 全 5 種 (actor / function / storage / event / card)。
 *
 * **種別ごとに数の出し場所が違う** (#1196 の実測)。 値の欄を描くのは `actor` だけ、
 * `storage` は行、残り 3 種は副題に出る。 種別の説明を潰さないため、数はその種別が
 * もともと持っている欄に足す。
 */
export const kindActor = diagram("kind-actor", { topic: "kind: actor (外部主体)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 42 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "Client", eyebrow: "外部主体", value: "{v} users" })
  .phase("p", { duration: 1500, title: "actor", body: "外部主体 (Client / 利用者 等)。 数値 value 表示可。" }, (p: PhaseBuilder) => p.activate("a").badge("active"))
  .phase("p2", { duration: 1500, title: "actor の数が動く", body: "値の欄が段の中で動く。 この欄を描くのは actor だけ。" }, (p: PhaseBuilder) => p.activate("a").tween("v", 42, 137).badge("active"))
  .build();

export const kindFunction = diagram("kind-function", { topic: "kind: function (関数呼び出し)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 12 })
  .node("fn", { lane: "l", stack: 0, kind: "function", title: "handler(req)", eyebrow: "関数呼び出し", subtitle: "-> Result<Order, E> · 呼出 {v}" })
  .phase("p", { duration: 1500, title: "function", body: "Service の関数。 mono 等幅 title + subtitle で署名表示。" }, (p: PhaseBuilder) => p.activate("fn").badge("active"))
  .phase("p2", { duration: 1500, title: "function の数が動く", body: "副題の呼出回数が段の中で動く。 署名の形は変えない。" }, (p: PhaseBuilder) => p.activate("fn").tween("v", 12, 480).badge("active"))
  .build();

export const kindStorage = diagram("kind-storage", { topic: "kind: storage (保存データ)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 1200 })
  .node("s", { lane: "l", stack: 0, kind: "storage", title: "users", eyebrow: "保存データ", rows: ["id: PK", "email: text", "行数: {v}"] })
  .phase("p", { duration: 1500, title: "storage", body: "DB の table。 rows で複数 column 表示。" }, (p: PhaseBuilder) => p.activate("s").badge("active"))
  .phase("p2", { duration: 1500, title: "storage の数が動く", body: "行の数が段の中で動く。 行も同じ経路で置換される。" }, (p: PhaseBuilder) => p.activate("s").tween("v", 1200, 8400).badge("active"))
  .build();

export const kindEvent = diagram("kind-event", { topic: "kind: event (イベントログ)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 3 })
  .node("e", { lane: "l", stack: 0, kind: "event", title: "OrderCreated", eyebrow: "イベント", subtitle: "(orderId, userId) · {v} 件/s" })
  .phase("p", { duration: 1500, title: "event", body: "emit された event。 event bus / log が読む。" }, (p: PhaseBuilder) => p.activate("e").badge("active"))
  .phase("p2", { duration: 1500, title: "event の数が動く", body: "副題の発生件数が段の中で動く。 中身の形は変えない。" }, (p: PhaseBuilder) => p.activate("e").tween("v", 3, 96).badge("active"))
  .build();

export const kindCard = diagram("kind-card", { topic: "kind: card (汎用情報)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 2 })
  .node("c", { lane: "l", stack: 0, kind: "card", title: "備考", eyebrow: "汎用カード", subtitle: "汎用の説明カード · {v} 件" })
  .phase("p", { duration: 1500, title: "card", body: "kind に当てはまらない補足情報。" }, (p: PhaseBuilder) => p.activate("c").badge("active"))
  .phase("p2", { duration: 1500, title: "card の数が動く", body: "副題の件数が段の中で動く。 説明の文は変えない。" }, (p: PhaseBuilder) => p.activate("c").tween("v", 2, 31).badge("active"))
  .build();

/** 2. Lane バリエーション */
export const laneSingle = diagram("lane-single", { topic: "lane: 1 本" })
  .lane("only", { x: 0, width: W })
  .node("a", { lane: "only", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "only", stack: 1, kind: "function", title: "B" })
  .phase("p", { duration: 1500, title: "1 lane", body: "1 lane に複数 node を縦 stack。" }, (p: PhaseBuilder) => p.activate("a", "b").badge("OK"))
  .build();

export const laneMulti = diagram("lane-multi", { topic: "lane: 3 本 (横並び)" })
  .lane("l1", { width: 240 })
  .lane("l2", { width: 240 })
  .lane("l3", { width: 240 })
  .node("a", { lane: "l1", stack: 0, kind: "function", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .node("c", { lane: "l3", stack: 0, kind: "event", title: "C" })
  .phase("p", { duration: 1500, title: "3 lane", body: "lane を横並びで責務分担 (Client / Service / Event)。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("OK"))
  .build();

export const laneContain = diagram("lane-contain", { topic: "lane: contain (枠囲み)" })
  .lane("inner", { x: 0, width: W, contain: true })
  .node("fn", { lane: "inner", stack: 0, kind: "function", title: "internal fn" })
  .node("st", { lane: "inner", stack: 1, kind: "storage", title: "storage" })
  .phase("p", { duration: 1500, title: "contain", body: "lane.contain=true で lane 自体を枠で囲み、 内部を境界明示。" }, (p: PhaseBuilder) => p.activate("fn", "st").badge("OK"))
  .build();

/** 3. Node stack バリエーション */
export const stackPair = diagram("stack-pair", { topic: "stack: 縦 2 段" })
  .lane("l", { x: 0, width: W })
  .node("top", { lane: "l", stack: 0, kind: "actor", title: "上" })
  .node("bot", { lane: "l", stack: 1, kind: "actor", title: "下" })
  .phase("p", { duration: 1500, title: "stack 0/1", body: "同 lane 内で stack で縦並びを制御。" }, (p: PhaseBuilder) => p.activate("top", "bot").badge("OK"))
  .build();

export const stackTriple = diagram("stack-triple", { topic: "stack: 縦 3 段" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "stack 0" })
  .node("b", { lane: "l", stack: 1, kind: "function", title: "stack 1" })
  .node("c", { lane: "l", stack: 2, kind: "storage", title: "stack 2" })
  .phase("p", { duration: 1500, title: "stack 0/1/2", body: "stack の数を増やして縦展開、 row_gap で間隔自動。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("OK"))
  .build();

/**
 * 形の見本 1 件 (#1196)。
 *
 * **動かすのはその形が表すものの数量だけ**。 題 (`title`) と目次 (`eyebrow`) は形の見本と
 * しての説明なので段をまたいで変えない。 数は副題に置く = 値の欄 (`node.value`) を描くのは
 * `ActorNode` と `GenericNode` の 2 経路だけで、`shape-*` はそこに含まれない (#1194 の実測)。
 *
 * 段は 2 つ。 1 段目が今の数、2 段目でそこから動かす。 段の中の値は整数に丸められるため
 * (cdl の `computeStateValues` が `Math.round`)、`from` / `to` は整数で書く。
 */
type ShapeSpec = {
  id: string;
  kind: NodeKind;
  title: string;
  eyebrow: string;
  /** 段の題と説明 */
  phase: { title: string; body: string };
  topic: string;
  /** 副題。 `{v}` の位置に数が入る。 省略した見本は動かない (理由を添えて 1 件ずつ書く) */
  subtitle?: string;
  metric?: { from: number; to: number };
  w?: number;
};

function shapeSample(spec: ShapeSpec) {
  const d = diagram(spec.id, { structuredData: "exclude", topic: spec.topic }).lane("l", { x: 0, width: W });
  if (spec.metric) d.state("v", { initial: spec.metric.from });
  d.node("n", {
    lane: "l",
    stack: 0,
    kind: spec.kind,
    title: spec.title,
    eyebrow: spec.eyebrow,
    ...(spec.subtitle ? { subtitle: spec.subtitle } : {}),
    ...(spec.w ? { w: spec.w } : {}),
  });
  d.phase("p", { duration: 1500, title: spec.phase.title, body: spec.phase.body }, (p: PhaseBuilder) =>
    p.activate("n").badge("shape"),
  );
  if (spec.metric) {
    const { from, to } = spec.metric;
    d.phase(
      "p2",
      { duration: 1500, title: `${spec.phase.title} の数が動く`, body: "副題の数が段の中で動く。 形と説明は変えない。" },
      (p: PhaseBuilder) => p.activate("n").tween("v", from, to).badge("shape"),
    );
  }
  return d.build();
}


/** 4. Shape-driven basement 8 (CAR-1099) ... 要素形状自体が意味を持つ SVG path node */
export const shapeFile = shapeSample({
  id: "shape-file",
  kind: "shape-file",
  title: "report.pdf",
  eyebrow: "file",
  subtitle: "PDF {v} MB",
  metric: { from: 2, to: 9 },
  w: 272,
  topic: "shape: file (ドッグイア rect、 ファイル / document 表現)",
  phase: { title: "file", body: "右上がドッグイアで折り返された rect。 ファイル / 文書 / レポート等" },
});
export const shapeFolder = shapeSample({
  id: "shape-folder",
  kind: "shape-folder",
  title: "src/",
  eyebrow: "folder",
  subtitle: "{v} files",
  metric: { from: 24, to: 118 },
  topic: "shape: folder (tab 付き rect、 フォルダ / パッケージ)",
  phase: { title: "folder", body: "上端に tab のある rect。 ディレクトリ / package / モジュール群等" },
});
export const shapeCloud = shapeSample({
  id: "shape-cloud",
  kind: "shape-cloud",
  title: "AWS",
  eyebrow: "cloud",
  subtitle: "{v} リージョン",
  metric: { from: 3, to: 12 },
  topic: "shape: cloud (5 円 合成、 クラウド / SaaS 表現)",
  phase: { title: "cloud", body: "5 円 合成の cloud shape。 AWS / GCP / SaaS / 外部 API 等" },
});
export const shapeCylinder = shapeSample({
  id: "shape-cylinder",
  kind: "shape-cylinder",
  title: "PostgreSQL",
  eyebrow: "database",
  subtitle: "{v} GB 使用",
  metric: { from: 120, to: 480 },
  w: 272,
  topic: "shape: cylinder (円柱、 DB / storage 表現)",
  phase: { title: "cylinder", body: "円柱 (top + side + bottom ellipse)。 DB / 永続 storage / volume 等" },
});
export const shapeHexagon = shapeSample({
  id: "shape-hexagon",
  kind: "shape-hexagon",
  title: "AuthService",
  eyebrow: "component",
  subtitle: "{v} req/s",
  metric: { from: 60, to: 940 },
  w: 294,
  topic: "shape: hexagon (六角形、 component / service)",
  phase: { title: "hexagon", body: "六角形。 microservice / ドメインコンポーネント / モジュール表現" },
});
export const shapeDiamond = shapeSample({
  id: "shape-diamond",
  kind: "shape-diamond",
  title: "valid?",
  eyebrow: "decision",
  subtitle: "true {v}%",
  metric: { from: 40, to: 92 },
  topic: "shape: diamond (ひし形、 decision / 判定)",
  phase: { title: "diamond", body: "ひし形。 判定分岐 / choice / gateway 表現" },
});
export const shapeStack = shapeSample({
  id: "shape-stack",
  kind: "shape-stack",
  title: "v3.2.0",
  eyebrow: "release",
  subtitle: "{v} 版",
  metric: { from: 3, to: 14 },
  topic: "shape: stack (重ね rect、 layer / history)",
  phase: { title: "stack", body: "重なった 3 段の rect。 バージョン履歴 / layer / snapshot 群等" },
});
export const shapePerson = shapeSample({
  id: "shape-person",
  kind: "shape-person",
  title: "エンドユーザ",
  eyebrow: "actor",
  subtitle: "{v} 操作",
  metric: { from: 2, to: 21 },
  topic: "shape: person (人型 figure、 actor / user 表現)",
  phase: { title: "person", body: "人型 figure (円頭 + 台形 body + 腕 curve)。 actor / user / 担当者" },
});

/** 4-b. Shape-driven software 6 (CAR-1111 Phase 2-B) ... OS ウィンドウ / 端末 / コード block / kanban ticket / チャット吹き出し / 歯車 */
export const shapeWindow = shapeSample({
  id: "shape-window",
  kind: "shape-window",
  title: "ダッシュボード",
  eyebrow: "window",
  subtitle: "開いた画面 {v}",
  metric: { from: 1, to: 6 },
  topic: "shape: window (GUI アプリ、 traffic lights + body)",
  phase: { title: "window", body: "title bar + traffic lights + body。 GUI アプリ / desktop / ブラウザ画面" },
});
// 段を付けていない (#1196)。 この種別は副題を描かない (題と目次だけを自前で描く)。
// 数を置ける欄が識別の文字しか残らず、形の見本としての説明を潰すことになる。
// cdl 側で副題を読むようにしてから動かす (cdl #469)。
export const shapeTerminal = shapeSample({
  id: "shape-terminal",
  kind: "shape-terminal",
  title: "zsh",
  eyebrow: "terminal",
  subtitle: "CLI shell",
  topic: "shape: terminal (CLI shell、 mac bar + prompt)",
  phase: { title: "terminal", body: "macOS bar + $ prompt + typing cursor。 CLI shell / SSH / script 実行" },
});
// 段を付けていない (#1196)。 この種別は副題を描かない (題と目次だけを自前で描く)。
// 数を置ける欄が識別の文字しか残らず、形の見本としての説明を潰すことになる。
// cdl 側で副題を読むようにしてから動かす (cdl #469)。
export const shapeCodeBlock = shapeSample({
  id: "shape-code-block",
  kind: "shape-code-block",
  title: "utils.ts",
  eyebrow: "code",
  subtitle: "3 line snippet",
  topic: "shape: code-block (snippet、 editor tab + 4 syntax lines)",
  phase: { title: "code-block", body: "editor tab + gutter + 4 syntax lines。 code snippet / editor / 実装" },
});
// 段を付けていない (#1196)。 この種別は副題を描かない (題と目次だけを自前で描く)。
// 数を置ける欄が識別の文字しか残らず、形の見本としての説明を潰すことになる。
// cdl 側で副題を読むようにしてから動かす (cdl #469)。
export const shapeKanbanCard = shapeSample({
  id: "shape-kanban-card",
  kind: "shape-kanban-card",
  title: "CAR-1111",
  eyebrow: "in progress",
  subtitle: "shape-driven kind",
  topic: "shape: kanban-card (ticket + priority + tags)",
  phase: { title: "kanban-card", body: "priority bar + ID + status pill + title + tags + avatars。 kanban ticket / Issue" },
});
export const shapeMessageBubble = shapeSample({
  id: "shape-message-bubble",
  kind: "shape-message-bubble",
  title: "了解しました",
  eyebrow: "message",
  subtitle: "未読 {v}",
  metric: { from: 0, to: 9 },
  topic: "shape: message-bubble (吹き出し、 rounded rect + tail)",
  phase: { title: "message-bubble", body: "rounded rect + 左下 tail。 message / commit comment / 通知 / チャット" },
});
export const shapeGear = shapeSample({
  id: "shape-gear",
  kind: "shape-gear",
  title: "Settings",
  eyebrow: "config",
  subtitle: "設定 {v} 件",
  metric: { from: 8, to: 26 },
  topic: "shape: gear (歯車、 設定 / 処理エンジン)",
  phase: { title: "gear", body: "12 teeth 大歯車 + 4 spokes + hub + bolt。 config / process engine / 設定" },
});

/** 5. Shape-driven hardware 6 (CAR-1111 Phase 2-C) ... ハードウェア / IoT / エッジ領域の視覚要素 */
export const shapeServerRack = shapeSample({
  id: "shape-server-rack",
  kind: "shape-server-rack",
  title: "web-01",
  eyebrow: "server",
  subtitle: "{v} U rack mount",
  metric: { from: 3, to: 12 },
  topic: "shape: server-rack (19 inch rack、 物理サーバ)",
  phase: { title: "server-rack", body: "外枠 + 3 段 slot の rack。 物理サーバ / データセンター / on-prem 機器" },
});
export const shapeNetworkNode = shapeSample({
  id: "shape-network-node",
  kind: "shape-network-node",
  title: "core-router",
  eyebrow: "network",
  subtitle: "L3 · 接続 {v} 台",
  metric: { from: 12, to: 96 },
  topic: "shape: network-node (network hub、 router / switch)",
  phase: { title: "network-node", body: "中央 circle + 4 方向 line。 router / switch / hub / L3 gateway 等" },
});
export const shapeMobileDevice = shapeSample({
  id: "shape-mobile-device",
  kind: "shape-mobile-device",
  title: "iPhone",
  eyebrow: "mobile",
  subtitle: "iOS · {v} 台",
  metric: { from: 200, to: 1800 },
  topic: "shape: mobile-device (スマホ、 モバイル端末)",
  phase: { title: "mobile-device", body: "speaker + screen + home button のスマホ。 mobile app / client 端末" },
});
export const shapeIotSensor = shapeSample({
  id: "shape-iot-sensor",
  kind: "shape-iot-sensor",
  title: "温度センサー",
  eyebrow: "iot",
  subtitle: "BLE · {v} 度",
  metric: { from: 18, to: 34 },
  topic: "shape: iot-sensor (IoT beacon、 電波発信)",
  phase: { title: "iot-sensor", body: "sensor 円 + 3 波紋 arc。 IoT beacon / センサー / ZigBee / LoRa 端末" },
});
export const shapeRobotArm = shapeSample({
  id: "shape-robot-arm",
  kind: "shape-robot-arm",
  title: "組立ライン",
  eyebrow: "robot",
  subtitle: "6 軸 · {v} 個/時",
  metric: { from: 40, to: 260 },
  topic: "shape: robot-arm (ロボアーム、 産業機器)",
  phase: { title: "robot-arm", body: "base + 2 関節 + gripper のロボアーム。 産業機器 / 自動化 / 制御対象" },
});
export const shapeSatellite = shapeSample({
  id: "shape-satellite",
  kind: "shape-satellite",
  title: "Starlink",
  eyebrow: "satellite",
  subtitle: "LEO · 高度 {v} km",
  metric: { from: 340, to: 550 },
  topic: "shape: satellite (人工衛星、 エッジ通信)",
  phase: { title: "satellite", body: "中央 body + 左右 solar panel + アンテナ。 人工衛星 / 宇宙 / エッジ通信" },
});

/** 6. Shape-driven blockchain / web3 6 (CAR-1111 Phase 2-D) ... Solidity / EVM 系開発主体 */
export const shapeSmartContract = shapeSample({
  id: "shape-smart-contract",
  kind: "shape-smart-contract",
  title: "Vault.sol",
  eyebrow: "contract",
  subtitle: "0.8.24 · 呼出 {v}",
  metric: { from: 12, to: 480 },
  topic: "shape: smart-contract (契約書 + 歯車 = 自動実行)",
  phase: { title: "smart-contract", body: "文書 + 底に歯車 (自動実行)。 Solidity 契約 / DAO 規約 / 自動 escrow" },
});
// 段を付けていない (#1196)。 この種別は絵の文字を自前で固定していて、書き手が渡した
// 題 / 副題 / 目次 を 1 つも読まない。 副題に数を置いても変わるのは見えない控えの欄だけ。
// cdl 側の別 Issue (cdl #469) で種別が値を読むようにしてから動かす。
export const shapeBlockchainBlock = shapeSample({
  id: "shape-blockchain-block",
  kind: "shape-blockchain-block",
  title: "Block #421",
  eyebrow: "chain",
  subtitle: "0xaf31c9d2...",
  topic: "shape: blockchain-block (連結 3 block + hash pointer)",
  phase: { title: "blockchain-block", body: "縦連結 3 block + hash pointer + tx count。 Ethereum / Bitcoin ブロック" },
});
export const shapeRpcNode = shapeSample({
  id: "shape-rpc-node",
  kind: "shape-rpc-node",
  title: "Alchemy",
  eyebrow: "rpc",
  subtitle: "mainnet · {v} req/s",
  metric: { from: 90, to: 1200 },
  topic: "shape: rpc-node (JSON-RPC node + 6 peers + sync bar)",
  phase: { title: "rpc-node", body: "中央 sphere + 6 peer dot + sync bar。 Infura / Alchemy / node provider" },
});
export const shapeWallet = shapeSample({
  id: "shape-wallet",
  kind: "shape-wallet",
  title: "MetaMask",
  eyebrow: "wallet",
  subtitle: "EOA · 残高 {v} ETH",
  metric: { from: 1, to: 12 },
  topic: "shape: wallet (財布 + coin + balance display)",
  phase: { title: "wallet", body: "財布 + coin 差し込み + balance。 MetaMask / Ledger / smart wallet" },
});
export const shapeNft = shapeSample({
  id: "shape-nft",
  kind: "shape-nft",
  title: "CryptoPunk",
  eyebrow: "nft",
  subtitle: "ERC-721 · {v} ETH",
  metric: { from: 3, to: 28 },
  w: 272,
  topic: "shape: nft (額縁 + polygonal art + verified badge)",
  phase: { title: "nft", body: "額縁 + polygonal art + verified check。 ERC-721 / SBT / collection" },
});
export const shapeToken = shapeSample({
  id: "shape-token",
  kind: "shape-token",
  title: "ETH",
  eyebrow: "token",
  subtitle: "ERC-20 · {v} USD",
  metric: { from: 2100, to: 3400 },
  topic: "shape: token (硬貨、 fungible currency)",
  phase: { title: "token", body: "硬貨 + 通貨 symbol Ξ + shine。 ERC-20 / native currency / stablecoin" },
});

/** 7. Shape-driven finance 6 (CAR-1111 Phase 2-D) ... 銀行 / 決済 / 信託 / 取引所主体 */
export const shapeBank = shapeSample({
  id: "shape-bank",
  kind: "shape-bank",
  title: "みずほ銀行",
  eyebrow: "bank",
  subtitle: "都銀 · 預金 {v} 兆円",
  metric: { from: 90, to: 142 },
  topic: "shape: bank (Greek facade + 4 columns + $)",
  phase: { title: "bank", body: "神殿風 facade (pediment + columns + base)。 都銀 / 地銀 / 銀行本店" },
});
export const shapeTrustBank = shapeSample({
  id: "shape-trust-bank",
  kind: "shape-trust-bank",
  title: "三菱 UFJ 信託",
  eyebrow: "trust-bank",
  subtitle: "受託 {v} 兆円",
  metric: { from: 40, to: 88 },
  topic: "shape: trust-bank (bank facade + 冠 crown = 受託の信頼)",
  phase: { title: "trust-bank", body: "冠 + facade + Ⓣ letter。 信託銀行 / 受託業務 / 資産管理" },
});
export const shapePaymentProvider = shapeSample({
  id: "shape-payment-provider",
  kind: "shape-payment-provider",
  title: "Stripe",
  eyebrow: "payment",
  subtitle: "決済 {v} 件/s",
  metric: { from: 30, to: 420 },
  topic: "shape: payment-provider (POS 端末 + screen + keypad)",
  phase: { title: "payment-provider", body: "POS 端末 + APPROVED 表示 + keypad。 決済業者 / Stripe / 電子決済手段等取引業" },
});
export const shapeBrokerage = shapeSample({
  id: "shape-brokerage",
  kind: "shape-brokerage",
  title: "野村證券",
  eyebrow: "brokerage",
  subtitle: "約定 {v} 件",
  metric: { from: 120, to: 940 },
  topic: "shape: brokerage (証券会社 tower + candle chart + up arrow)",
  phase: { title: "brokerage", body: "tower + window grid + candle chart + up arrow。 証券会社 / 投資銀行" },
});
export const shapeExchange = shapeSample({
  id: "shape-exchange",
  kind: "shape-exchange",
  title: "Coinbase",
  eyebrow: "exchange",
  subtitle: "出来高 {v} 億",
  metric: { from: 12, to: 86 },
  topic: "shape: exchange (取引所、 $ ⇄ Ξ swap)",
  phase: { title: "exchange", body: "2 通貨 coin + 双方向 arrow + rate。 取引所 / DEX / 換金" },
});
export const shapeAtm = shapeSample({
  id: "shape-atm",
  kind: "shape-atm",
  title: "ATM",
  eyebrow: "atm",
  subtitle: "24 h · {v} 件/日",
  metric: { from: 180, to: 620 },
  topic: "shape: atm (現金自動預払機、 card slot + cash dispenser)",
  phase: { title: "atm", body: "screen + button + card slot + dispenser。 銀行 ATM / コンビニ ATM" },
});

/** 8. Shape-driven commerce / web 6 (CAR-1111 Phase 2-D) ... web / EC / インフラ主体 */
export const shapeWebsite = shapeSample({
  id: "shape-website",
  kind: "shape-website",
  title: "example.com",
  eyebrow: "website",
  subtitle: "{v} PV/日",
  metric: { from: 1200, to: 8600 },
  topic: "shape: website (browser + URL + page layout)",
  phase: { title: "website", body: "browser + URL bar + header + 2 col。 corporate / SaaS LP / blog" },
});
export const shapeStorefront = shapeSample({
  id: "shape-storefront",
  kind: "shape-storefront",
  title: "コンビニ",
  eyebrow: "store",
  subtitle: "来店 {v} 人/日",
  metric: { from: 240, to: 810 },
  topic: "shape: storefront (実店舗、 awning + door + windows)",
  phase: { title: "storefront", body: "赤白 awning + OPEN sign + door + windows。 リアル店舗 / 小売" },
});
export const shapeWarehouse = shapeSample({
  id: "shape-warehouse",
  kind: "shape-warehouse",
  title: "FC1",
  eyebrow: "warehouse",
  subtitle: "在庫 {v} 千点",
  metric: { from: 12, to: 48 },
  topic: "shape: warehouse (倉庫、 roof + shutter + boxes)",
  phase: { title: "warehouse", body: "roof + shutter door + box stack。 fulfillment center / 倉庫" },
});
export const shapeOnlineShop = shapeSample({
  id: "shape-online-shop",
  kind: "shape-online-shop",
  title: "Amazon",
  eyebrow: "online-shop",
  subtitle: "注文 {v} 件/分",
  metric: { from: 6, to: 74 },
  topic: "shape: online-shop (browser + cart badge + product grid)",
  phase: { title: "online-shop", body: "browser + cart badge (3) + 6 product grid。 EC / online 販売" },
});
export const shapeCdnEdge = shapeSample({
  id: "shape-cdn-edge",
  kind: "shape-cdn-edge",
  title: "Cloudflare",
  eyebrow: "cdn",
  subtitle: "{v} POP",
  metric: { from: 300, to: 380 },
  topic: "shape: cdn-edge (地球儀 + 5 edge nodes + arc)",
  phase: { title: "cdn-edge", body: "地球儀 + 5 edge dot + dashed connect。 Cloudflare / Fastly / edge network" },
});
export const shapeApiGateway = shapeSample({
  id: "shape-api-gateway",
  kind: "shape-api-gateway",
  title: "Kong",
  eyebrow: "gateway",
  subtitle: "{v} req/s",
  metric: { from: 400, to: 3200 },
  topic: "shape: api-gateway (門柱 + arch + traffic arrow)",
  phase: { title: "api-gateway", body: "2 柱 + arch + API text + traffic arrow。 Kong / AWS API GW / 門番" },
});

/** 9. Shape-driven people 6 (CAR-1111 Phase 2-D) ... 職種別 person 型 */
export const shapeAuditor = shapeSample({
  id: "shape-auditor",
  kind: "shape-auditor",
  title: "監査法人",
  eyebrow: "auditor",
  subtitle: "指摘 {v} 件",
  metric: { from: 2, to: 17 },
  topic: "shape: auditor (監査人 + magnifier + check)",
  phase: { title: "auditor", body: "人 + tie + magnifier + check icon。 監査人 / 公認会計士 / 内部監査" },
});
export const shapeRegulator = shapeSample({
  id: "shape-regulator",
  kind: "shape-regulator",
  title: "金融庁",
  eyebrow: "regulator",
  subtitle: "検査 {v} 件",
  metric: { from: 4, to: 23 },
  topic: "shape: regulator (規制当局 + 冠 crown + 章 badge)",
  phase: { title: "regulator", body: "人 + crown + 五芒星 badge。 金融庁 / 消費者庁 / 規制当局" },
});
export const shapeNotary = shapeSample({
  id: "shape-notary",
  kind: "shape-notary",
  title: "公証役場",
  eyebrow: "notary",
  subtitle: "認証 {v} 件",
  metric: { from: 6, to: 31 },
  topic: "shape: notary (公証人 + 儒学者風 hat + seal 印)",
  phase: { title: "notary", body: "人 + 儒学者風 hat + 紅印。 公証人 / 認証業務 / 書類認証" },
});
export const shapeLawyer = shapeSample({
  id: "shape-lawyer",
  kind: "shape-lawyer",
  title: "顧問弁護士",
  eyebrow: "lawyer",
  subtitle: "案件 {v} 件",
  metric: { from: 3, to: 19 },
  topic: "shape: lawyer (弁護士 + wig + 天秤)",
  phase: { title: "lawyer", body: "人 + 髪 + 正義の天秤 icon。 弁護士 / 法務顧問 / 法律事務所" },
});
export const shapeTrader = shapeSample({
  id: "shape-trader",
  kind: "shape-trader",
  title: "デイトレーダー",
  eyebrow: "trader",
  subtitle: "約定 {v} 回",
  metric: { from: 8, to: 152 },
  topic: "shape: trader (トレーダー + headset + laptop chart)",
  phase: { title: "trader", body: "人 + headset + laptop with chart。 トレーダー / MM / algo 発注" },
});
export const shapeCustomerService = shapeSample({
  id: "shape-customer-service",
  kind: "shape-customer-service",
  title: "サポート担当",
  eyebrow: "support",
  subtitle: "対応 {v} 件",
  metric: { from: 14, to: 88 },
  topic: "shape: customer-service (CS + headset + bubble)",
  phase: { title: "customer-service", body: "人 + headset + speech bubble + name badge。 CS / コールセンター" },
});

/** 10. Phase 2-D 追加分 (blockchain 4 新 + credit-card 分離) */
export const shapeBlockchain = shapeSample({
  id: "shape-blockchain",
  kind: "shape-blockchain",
  title: "ブロックチェーン",
  eyebrow: "chain",
  subtitle: "{v} block",
  metric: { from: 5, to: 42 },
  topic: "shape: blockchain (5 block linked chain)",
  phase: { title: "blockchain", body: "5 block を hash pointer で横に連結。 汎用 chain / L1 / L2 の抽象" },
});
export const shapeBitcoinChain = shapeSample({
  id: "shape-bitcoin-chain",
  kind: "shape-bitcoin-chain",
  title: "Bitcoin",
  eyebrow: "bitcoin",
  subtitle: "PoW · 高さ {v} 万",
  metric: { from: 84, to: 89 },
  topic: "shape: bitcoin-chain (₿ + PoW + 橙色)",
  phase: { title: "bitcoin-chain", body: "橙 accent + ₿ symbol + PoW mining。 Bitcoin mainnet / testnet" },
});
export const shapeEthereumChain = shapeSample({
  id: "shape-ethereum-chain",
  kind: "shape-ethereum-chain",
  title: "Ethereum",
  eyebrow: "ethereum",
  subtitle: "PoS · {v} 万 block",
  metric: { from: 2000, to: 2400 },
  topic: "shape: ethereum-chain (Ξ + PoS + 紫色)",
  phase: { title: "ethereum-chain", body: "紫 accent + Ξ symbol + PoS validator。 Ethereum mainnet / rollup base" },
});
export const shapeBlockchainNode = shapeSample({
  id: "shape-blockchain-node",
  kind: "shape-blockchain-node",
  title: "フルノード",
  eyebrow: "node",
  subtitle: "P2P · peer {v}",
  metric: { from: 8, to: 64 },
  topic: "shape: blockchain-node (P2P hex + 6 peers)",
  phase: { title: "blockchain-node", body: "中央 hex + 6 peer hex + block stack icon。 P2P full / archive / light node" },
});
export const shapeCreditCard = shapeSample({
  id: "shape-credit-card",
  kind: "shape-credit-card",
  title: "クレカ",
  eyebrow: "card",
  subtitle: "VISA · {v} 万円",
  metric: { from: 3, to: 18 },
  topic: "shape: credit-card (chip + magstripe + brand mark)",
  phase: { title: "credit-card", body: "chip + NFC wave + 番号 + 名義 + 有効期限 + brand mark。 実物クレジットカード" },
});

/** 11. 実シーン (Scene) diagram = 複数 shape の連携例、 catalog の実用性向上 */

/** S-1. crypto 送金 flow = wallet → exchange → blockchain */
export const sceneCryptoTransfer = diagram("scene-crypto-transfer", { topic: "scene: crypto 送金 (wallet → exchange → chain)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-wallet", title: "送金者", eyebrow: "wallet", subtitle: "MetaMask EOA" })
  .node("e", { lane: "l", stack: 1, kind: "shape-exchange", title: "DEX", eyebrow: "exchange", subtitle: "clearing" })
  .node("c", { lane: "l", stack: 2, kind: "shape-ethereum-chain", title: "Ethereum", eyebrow: "chain", subtitle: "L1 mainnet" })
  .edge("w", "e", { label: "" })
  .edge("e", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. 送金者", body: "MetaMask EOA" }, (p: PhaseBuilder) => p.activate("w").badge("wallet"))
  .phase("p2", { duration: 750, title: "2. DEX", body: "clearing" }, (p: PhaseBuilder) => p.activate("w").activate("e").badge("exchange"))
  .phase("p3", { duration: 750, title: "crypto 送金", body: "wallet が exchange に order を送り、 exchange が chain に settle。 EOA → DEX → L1 の 3-stage scene" }, (p: PhaseBuilder) => p.activate("w").activate("e").activate("c").badge("chain"))
  .build();

/** S-2. 弁護士 → 公証人 → 登記 (法務 flow) */
export const sceneLegalNotarization = diagram("scene-legal-notarization", { topic: "scene: 法務 (弁護士 → 公証人 → 登記)" })
  .lane("l", { x: 0, width: W })
  .node("l1", { lane: "l", stack: 0, kind: "shape-lawyer", title: "代理人", eyebrow: "lawyer", subtitle: "起草" })
  .node("n", { lane: "l", stack: 1, kind: "shape-notary", title: "公証役場", eyebrow: "notary", subtitle: "認証" })
  .node("f", { lane: "l", stack: 2, kind: "shape-file", title: "登記簿", eyebrow: "record", subtitle: "official record" })
  .edge("l1", "n", { label: "" })
  .edge("n", "f", { label: "" })
  .phase("p1", { duration: 750, title: "1. 代理人", body: "起草" }, (p: PhaseBuilder) => p.activate("l1").badge("lawyer"))
  .phase("p2", { duration: 750, title: "2. 公証役場", body: "認証" }, (p: PhaseBuilder) => p.activate("l1").activate("n").badge("notary"))
  .phase("p3", { duration: 750, title: "法務 flow", body: "弁護士 起草 → 公証人 認証 → 登記簿 記録。 契約 / 遺言 / 不動産譲渡 の formal flow" }, (p: PhaseBuilder) => p.activate("l1").activate("n").activate("f").badge("record"))
  .build();

/** S-3. ATM → 銀行 → EC 送金 (金融 flow) */
export const sceneBankingFlow = diagram("scene-banking-flow", { topic: "scene: 銀行送金 (ATM → 銀行 → EC)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-atm", title: "ATM", eyebrow: "atm", subtitle: "cash 出金" })
  .node("b", { lane: "l", stack: 1, kind: "shape-bank", title: "みずほ銀行", eyebrow: "bank", subtitle: "都銀" })
  .node("s", { lane: "l", stack: 2, kind: "shape-online-shop", title: "Amazon", eyebrow: "shop", subtitle: "EC" })
  .edge("a", "b", { label: "" })
  .edge("b", "s", { label: "" })
  .phase("p1", { duration: 750, title: "1. ATM", body: "cash 出金" }, (p: PhaseBuilder) => p.activate("a").badge("atm"))
  .phase("p2", { duration: 750, title: "2. みずほ銀行", body: "都銀" }, (p: PhaseBuilder) => p.activate("a").activate("b").badge("bank"))
  .phase("p3", { duration: 750, title: "銀行 flow", body: "ATM 出金 → 銀行 口座 → EC 支払い。 日常の消費者送金 flow" }, (p: PhaseBuilder) => p.activate("a").activate("b").activate("s").badge("shop"))
  .build();

/** S-4. IoT センサー → RPC → smart-contract (web3 IoT) */
export const sceneIotOnchain = diagram("scene-iot-onchain", { topic: "scene: IoT オンチェーン (sensor → RPC → contract)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-iot-sensor", title: "温度計", eyebrow: "sensor", subtitle: "BLE" })
  .node("r", { lane: "l", stack: 1, kind: "shape-rpc-node", title: "Infura", eyebrow: "rpc", subtitle: "provider" })
  .node("c", { lane: "l", stack: 2, kind: "shape-smart-contract", title: "OracleContract", eyebrow: "contract", subtitle: "Solidity", w: 360 })
  .edge("s", "r", { label: "" })
  .edge("r", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. 温度計", body: "BLE" }, (p: PhaseBuilder) => p.activate("s").badge("sensor"))
  .phase("p2", { duration: 750, title: "2. Infura", body: "provider" }, (p: PhaseBuilder) => p.activate("s").activate("r").badge("rpc"))
  .phase("p3", { duration: 750, title: "IoT オンチェーン", body: "IoT センサー → RPC → smart contract。 real-world data を Chainlink Oracle 経由で on-chain 記録" }, (p: PhaseBuilder) => p.activate("s").activate("r").activate("c").badge("contract"))
  .build();

/** S-5. 監査人 → 帳簿 → 規制当局 (監査 flow) */
export const sceneAuditFlow = diagram("scene-audit-flow", { topic: "scene: 監査 (auditor → 帳簿 → regulator)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-auditor", title: "監査法人", eyebrow: "auditor", subtitle: "検査" })
  .node("f", { lane: "l", stack: 1, kind: "shape-file", title: "会計帳簿", eyebrow: "record", subtitle: "ledger" })
  .node("r", { lane: "l", stack: 2, kind: "shape-regulator", title: "金融庁", eyebrow: "regulator", subtitle: "監督" })
  .edge("a", "f", { label: "" })
  .edge("f", "r", { label: "" })
  .phase("p1", { duration: 750, title: "1. 監査法人", body: "検査" }, (p: PhaseBuilder) => p.activate("a").badge("auditor"))
  .phase("p2", { duration: 750, title: "2. 会計帳簿", body: "ledger" }, (p: PhaseBuilder) => p.activate("a").activate("f").badge("record"))
  .phase("p3", { duration: 750, title: "監査 flow", body: "監査法人 → 帳簿 検証 → 規制当局 報告。 上場企業 財務監査の 3-stage flow" }, (p: PhaseBuilder) => p.activate("a").activate("f").activate("r").badge("regulator"))
  .build();

/** S-6. トレーダー → 証券会社 → 取引所 (証券取引) */
export const sceneStockTrading = diagram("scene-stock-trading", { topic: "scene: 証券取引 (trader → 証券会社 → 取引所)" })
  .lane("l", { x: 0, width: W })
  .node("t", { lane: "l", stack: 0, kind: "shape-trader", title: "個人投資家", eyebrow: "trader", subtitle: "retail" })
  .node("b", { lane: "l", stack: 1, kind: "shape-brokerage", title: "野村証券", eyebrow: "broker", subtitle: "投資銀行" })
  .node("e", { lane: "l", stack: 2, kind: "shape-exchange", title: "東証", eyebrow: "exchange", subtitle: "TSE" })
  .edge("t", "b", { label: "" })
  .edge("b", "e", { label: "" })
  .phase("p1", { duration: 750, title: "1. 個人投資家", body: "retail" }, (p: PhaseBuilder) => p.activate("t").badge("trader"))
  .phase("p2", { duration: 750, title: "2. 野村証券", body: "投資銀行" }, (p: PhaseBuilder) => p.activate("t").activate("b").badge("broker"))
  .phase("p3", { duration: 750, title: "証券取引", body: "トレーダー → 証券会社 発注 → 取引所 約定。 株式売買の 3-stage scene" }, (p: PhaseBuilder) => p.activate("t").activate("b").activate("e").badge("exchange"))
  .build();

/** S-7. カスタマーサポート → チケット → 開発チーム (問い合わせ flow) */
export const sceneSupportFlow = diagram("scene-support-flow", { topic: "scene: 問い合わせ (CS → ticket → 開発)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-customer-service", title: "サポート担当", eyebrow: "support", subtitle: "24H 対応" })
  .node("k", { lane: "l", stack: 1, kind: "shape-kanban-card", title: "BUG-1234", eyebrow: "ticket", subtitle: "Linear" })
  .node("d", { lane: "l", stack: 2, kind: "shape-code-block", title: "hotfix.ts", eyebrow: "commit", subtitle: "fix by dev" })
  .edge("c", "k", { label: "" })
  .edge("k", "d", { label: "" })
  .phase("p1", { duration: 750, title: "1. サポート担当", body: "24H 対応" }, (p: PhaseBuilder) => p.activate("c").badge("support"))
  .phase("p2", { duration: 750, title: "2. BUG-1234", body: "Linear" }, (p: PhaseBuilder) => p.activate("c").activate("k").badge("ticket"))
  .phase("p3", { duration: 750, title: "問い合わせ flow", body: "CS 受電 → Ticket 起票 → 開発 hotfix。 一般 SaaS の bug report → fix の 3-stage flow" }, (p: PhaseBuilder) => p.activate("c").activate("k").activate("d").badge("commit"))
  .build();

/** S-8. 決済業者 → クレカ → 銀行 (決済 flow) */
export const scenePaymentSettlement = diagram("scene-payment-settlement", { topic: "scene: 決済 (provider → クレカ → 銀行)" })
  .lane("l", { x: 0, width: W })
  .node("p", { lane: "l", stack: 0, kind: "shape-payment-provider", title: "Stripe", eyebrow: "provider", subtitle: "SaaS" })
  .node("c", { lane: "l", stack: 1, kind: "shape-credit-card", title: "VISA", eyebrow: "card", subtitle: "credit" })
  .node("b", { lane: "l", stack: 2, kind: "shape-bank", title: "発行銀行", eyebrow: "issuer", subtitle: "MUFG" })
  .edge("p", "c", { label: "" })
  .edge("c", "b", { label: "" })
  .phase("p1", { duration: 750, title: "1. Stripe", body: "SaaS" }, (p: PhaseBuilder) => p.activate("p").badge("provider"))
  .phase("p2", { duration: 750, title: "2. VISA", body: "credit" }, (p: PhaseBuilder) => p.activate("p").activate("c").badge("card"))
  .phase("p3", { duration: 750, title: "決済 flow", body: "Stripe → クレカ authorization → 発行銀行 決済。 EC 決済の card processing 3-stage flow" }, (p: PhaseBuilder) => p.activate("p").activate("c").activate("b").badge("issuer"))
  .build();

/** S-9. website → CDN → server-rack (web infra) */
export const sceneWebInfra = diagram("scene-web-infra", { topic: "scene: web infra (website → CDN → server)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-website", title: "example.com", eyebrow: "site", subtitle: "SPA" })
  .node("c", { lane: "l", stack: 1, kind: "shape-cdn-edge", title: "Cloudflare", eyebrow: "cdn", subtitle: "edge" })
  .node("s", { lane: "l", stack: 2, kind: "shape-server-rack", title: "origin", eyebrow: "server", subtitle: "AWS" })
  .edge("w", "c", { label: "" })
  .edge("c", "s", { label: "" })
  .phase("p1", { duration: 750, title: "1. example.com", body: "SPA" }, (p: PhaseBuilder) => p.activate("w").badge("site"))
  .phase("p2", { duration: 750, title: "2. Cloudflare", body: "edge" }, (p: PhaseBuilder) => p.activate("w").activate("c").badge("cdn"))
  .phase("p3", { duration: 750, title: "web infra", body: "website request → CDN cache → origin server。 web 配信の standard 3-tier" }, (p: PhaseBuilder) => p.activate("w").activate("c").activate("s").badge("server"))
  .build();

/** S-10. NFT mint (wallet → smart-contract → NFT) */
export const sceneNftMint = diagram("scene-nft-mint", { topic: "scene: NFT mint (wallet → contract → NFT)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-wallet", title: "creator", eyebrow: "wallet", subtitle: "artist" })
  .node("c", { lane: "l", stack: 1, kind: "shape-smart-contract", title: "ERC-721", eyebrow: "contract", subtitle: "OpenSea" })
  .node("n", { lane: "l", stack: 2, kind: "shape-nft", title: "Rare Punk", eyebrow: "nft", subtitle: "#42" })
  .edge("w", "c", { label: "" })
  .edge("c", "n", { label: "" })
  .phase("p1", { duration: 750, title: "1. creator", body: "artist" }, (p: PhaseBuilder) => p.activate("w").badge("wallet"))
  .phase("p2", { duration: 750, title: "2. ERC-721", body: "OpenSea" }, (p: PhaseBuilder) => p.activate("w").activate("c").badge("contract"))
  .phase("p3", { duration: 750, title: "NFT mint", body: "wallet → ERC-721 contract 呼出 → NFT 発行。 minting の canonical 3-stage flow" }, (p: PhaseBuilder) => p.activate("w").activate("c").activate("n").badge("nft"))
  .build();

/** S-11. token bridge (chain A → bridge contract → chain B) */
export const sceneTokenBridge = diagram("scene-token-bridge", { topic: "scene: token bridge (chain A → bridge → chain B)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-ethereum-chain", title: "Ethereum", eyebrow: "src chain", subtitle: "L1" })
  .node("b", { lane: "l", stack: 1, kind: "shape-smart-contract", title: "Bridge", eyebrow: "contract", subtitle: "lock" })
  .node("c", { lane: "l", stack: 2, kind: "shape-blockchain", title: "Arbitrum", eyebrow: "dst chain", subtitle: "L2" })
  .edge("a", "b", { label: "" })
  .edge("b", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. Ethereum", body: "L1" }, (p: PhaseBuilder) => p.activate("a").badge("src chain"))
  .phase("p2", { duration: 750, title: "2. Bridge", body: "lock" }, (p: PhaseBuilder) => p.activate("a").activate("b").badge("contract"))
  .phase("p3", { duration: 750, title: "token bridge", body: "src chain で lock → bridge contract → dst chain で mint。 cross-chain 資産移動" }, (p: PhaseBuilder) => p.activate("a").activate("b").activate("c").badge("dst chain"))
  .build();

/** S-12. DeFi lending (wallet → lending contract → interest) */
export const sceneDefiLending = diagram("scene-defi-lending", { topic: "scene: DeFi lending (wallet → contract → token)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-wallet", title: "供給者", eyebrow: "wallet", subtitle: "USDC 供給" })
  .node("c", { lane: "l", stack: 1, kind: "shape-smart-contract", title: "Aave v3", eyebrow: "lending", subtitle: "pool" })
  .node("t", { lane: "l", stack: 2, kind: "shape-token", title: "aUSDC", eyebrow: "token", subtitle: "yield-bearing" })
  .edge("w", "c", { label: "" })
  .edge("c", "t", { label: "" })
  .phase("p1", { duration: 750, title: "1. 供給者", body: "USDC 供給" }, (p: PhaseBuilder) => p.activate("w").badge("wallet"))
  .phase("p2", { duration: 750, title: "2. Aave v3", body: "pool" }, (p: PhaseBuilder) => p.activate("w").activate("c").badge("lending"))
  .phase("p3", { duration: 750, title: "DeFi lending", body: "wallet が Aave に USDC を供給 → aUSDC (yield-bearing) を発行受領。 利息付き貸出の canonical flow" }, (p: PhaseBuilder) => p.activate("w").activate("c").activate("t").badge("token"))
  .build();

/** S-13. bitcoin transaction (wallet → bitcoin chain → node) */
export const sceneBitcoinTx = diagram("scene-bitcoin-tx", { topic: "scene: bitcoin tx (wallet → BTC chain → node)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-wallet", title: "sender", eyebrow: "wallet", subtitle: "Bitcoin Core" })
  .node("c", { lane: "l", stack: 1, kind: "shape-bitcoin-chain", title: "BTC mainnet", eyebrow: "chain", subtitle: "PoW" })
  .node("n", { lane: "l", stack: 2, kind: "shape-blockchain-node", title: "full node", eyebrow: "node", subtitle: "validator" })
  .edge("w", "c", { label: "" })
  .edge("c", "n", { label: "" })
  .phase("p1", { duration: 750, title: "1. sender", body: "Bitcoin Core" }, (p: PhaseBuilder) => p.activate("w").badge("wallet"))
  .phase("p2", { duration: 750, title: "2. BTC mainnet", body: "PoW" }, (p: PhaseBuilder) => p.activate("w").activate("c").badge("chain"))
  .phase("p3", { duration: 750, title: "bitcoin tx", body: "wallet で tx 署名 → BTC chain broadcast → full node が承認。 P2P 送金の 3-stage flow" }, (p: PhaseBuilder) => p.activate("w").activate("c").activate("n").badge("node"))
  .build();

/** S-14. e-commerce order (customer → storefront → warehouse) */
export const sceneEcOrder = diagram("scene-ec-order", { topic: "scene: EC 注文 (customer → shop → warehouse)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-customer-service", title: "顧客", eyebrow: "customer", subtitle: "注文" })
  .node("s", { lane: "l", stack: 1, kind: "shape-online-shop", title: "Rakuten", eyebrow: "shop", subtitle: "EC" })
  .node("w", { lane: "l", stack: 2, kind: "shape-warehouse", title: "物流倉庫", eyebrow: "warehouse", subtitle: "出荷" })
  .edge("c", "s", { label: "" })
  .edge("s", "w", { label: "" })
  .phase("p1", { duration: 750, title: "1. 顧客", body: "注文" }, (p: PhaseBuilder) => p.activate("c").badge("customer"))
  .phase("p2", { duration: 750, title: "2. Rakuten", body: "EC" }, (p: PhaseBuilder) => p.activate("c").activate("s").badge("shop"))
  .phase("p3", { duration: 750, title: "EC 注文", body: "顧客 注文 → EC 受注 → 倉庫 出荷指示。 物販 fulfillment flow" }, (p: PhaseBuilder) => p.activate("c").activate("s").activate("w").badge("warehouse"))
  .build();

/** S-15. mobile app (mobile → API gateway → server) */
export const sceneMobileApi = diagram("scene-mobile-api", { topic: "scene: mobile app (mobile → API gateway → server)" })
  .lane("l", { x: 0, width: W })
  .node("m", { lane: "l", stack: 0, kind: "shape-mobile-device", title: "iOS app", eyebrow: "mobile", subtitle: "SwiftUI" })
  .node("g", { lane: "l", stack: 1, kind: "shape-api-gateway", title: "GraphQL", eyebrow: "gateway", subtitle: "Apollo" })
  .node("s", { lane: "l", stack: 2, kind: "shape-server-rack", title: "backend", eyebrow: "server", subtitle: "K8s" })
  .edge("m", "g", { label: "" })
  .edge("g", "s", { label: "" })
  .phase("p1", { duration: 750, title: "1. iOS app", body: "SwiftUI" }, (p: PhaseBuilder) => p.activate("m").badge("mobile"))
  .phase("p2", { duration: 750, title: "2. GraphQL", body: "Apollo" }, (p: PhaseBuilder) => p.activate("m").activate("g").badge("gateway"))
  .phase("p3", { duration: 750, title: "mobile API", body: "mobile app request → API gateway auth/route → backend server 処理。 modern mobile stack" }, (p: PhaseBuilder) => p.activate("m").activate("g").activate("s").badge("server"))
  .build();

/** S-16. robot arm production (robot → sensor → cylinder db) */
export const sceneFactoryLine = diagram("scene-factory-line", { topic: "scene: 工場ライン (robot → sensor → DB)" })
  .lane("l", { x: 0, width: W })
  .node("r", { lane: "l", stack: 0, kind: "shape-robot-arm", title: "FANUC robot", eyebrow: "robot", subtitle: "組立", w: 294 })
  .node("s", { lane: "l", stack: 1, kind: "shape-iot-sensor", title: "計測 sensor", eyebrow: "sensor", subtitle: "品質" })
  .node("d", { lane: "l", stack: 2, kind: "shape-cylinder", title: "MES DB", eyebrow: "database", subtitle: "traceability" })
  .edge("r", "s", { label: "" })
  .edge("s", "d", { label: "" })
  .phase("p1", { duration: 750, title: "1. FANUC robot", body: "組立" }, (p: PhaseBuilder) => p.activate("r").badge("robot"))
  .phase("p2", { duration: 750, title: "2. 計測 sensor", body: "品質" }, (p: PhaseBuilder) => p.activate("r").activate("s").badge("sensor"))
  .phase("p3", { duration: 750, title: "factory line", body: "robot arm 作業 → 計測 sensor が品質確認 → MES DB に記録。 スマート工場の canonical" }, (p: PhaseBuilder) => p.activate("r").activate("s").activate("d").badge("database"))
  .build();

/** S-17. satellite communication (satellite → RPC → chain) */
export const sceneSatelliteChain = diagram("scene-satellite-chain", { topic: "scene: satellite (satellite → RPC → chain)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-satellite", title: "Starlink", eyebrow: "satellite", subtitle: "LEO" })
  .node("r", { lane: "l", stack: 1, kind: "shape-rpc-node", title: "Alchemy", eyebrow: "rpc", subtitle: "endpoint" })
  .node("c", { lane: "l", stack: 2, kind: "shape-blockchain", title: "Solana", eyebrow: "chain", subtitle: "high TPS" })
  .edge("s", "r", { label: "" })
  .edge("r", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. Starlink", body: "LEO" }, (p: PhaseBuilder) => p.activate("s").badge("satellite"))
  .phase("p2", { duration: 750, title: "2. Alchemy", body: "endpoint" }, (p: PhaseBuilder) => p.activate("s").activate("r").badge("rpc"))
  .phase("p3", { duration: 750, title: "satellite chain", body: "衛星 データ → RPC 中継 → chain 記録。 space-to-chain の real-world data 送信" }, (p: PhaseBuilder) => p.activate("s").activate("r").activate("c").badge("chain"))
  .build();

/** S-18. dev workflow (code block → gear ci → cloud deploy) */
export const sceneDevOps = diagram("scene-devops", { topic: "scene: DevOps (code → CI → cloud)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-code-block", title: "src/", eyebrow: "code", subtitle: "TypeScript" })
  .node("g", { lane: "l", stack: 1, kind: "shape-gear", title: "GitHub Actions", eyebrow: "ci", subtitle: "build + test", w: 360 })
  .node("d", { lane: "l", stack: 2, kind: "shape-cloud", title: "AWS ECS", eyebrow: "deploy", subtitle: "container" })
  .edge("c", "g", { label: "" })
  .edge("g", "d", { label: "" })
  .phase("p1", { duration: 750, title: "1. src/", body: "TypeScript" }, (p: PhaseBuilder) => p.activate("c").badge("code"))
  .phase("p2", { duration: 750, title: "2. GitHub Actions", body: "build + test" }, (p: PhaseBuilder) => p.activate("c").activate("g").badge("ci"))
  .phase("p3", { duration: 750, title: "DevOps", body: "code push → CI build/test → cloud deploy。 modern CI/CD の canonical 3-stage flow" }, (p: PhaseBuilder) => p.activate("c").activate("g").activate("d").badge("deploy"))
  .build();

/** S-19. kanban task (kanban → terminal → file) */
export const sceneTaskFlow = diagram("scene-task-flow", { topic: "scene: task flow (kanban → terminal → file)" })
  .lane("l", { x: 0, width: W })
  .node("k", { lane: "l", stack: 0, kind: "shape-kanban-card", title: "todo #42", eyebrow: "kanban", subtitle: "in progress" })
  .node("t", { lane: "l", stack: 1, kind: "shape-terminal", title: "$ npm run build", eyebrow: "terminal", subtitle: "shell", w: 382 })
  .node("f", { lane: "l", stack: 2, kind: "shape-file", title: "build.log", eyebrow: "file", subtitle: "output" })
  .edge("k", "t", { label: "" })
  .edge("t", "f", { label: "" })
  .phase("p1", { duration: 750, title: "1. todo #42", body: "in progress" }, (p: PhaseBuilder) => p.activate("k").badge("kanban"))
  .phase("p2", { duration: 750, title: "2. $ npm run build", body: "shell" }, (p: PhaseBuilder) => p.activate("k").activate("t").badge("terminal"))
  .phase("p3", { duration: 750, title: "task flow", body: "kanban task 着手 → terminal で作業 → file 出力保存。 開発者の日常 flow" }, (p: PhaseBuilder) => p.activate("k").activate("t").activate("f").badge("file"))
  .build();

/** S-20. message notification (message bubble → hexagon → window) */
export const sceneNotification = diagram("scene-notification", { topic: "scene: 通知 (message → service → app)" })
  .lane("l", { x: 0, width: W })
  .node("m", { lane: "l", stack: 0, kind: "shape-message-bubble", title: "@alice", eyebrow: "message", subtitle: "Slack" })
  .node("h", { lane: "l", stack: 1, kind: "shape-hexagon", title: "NotifyService", eyebrow: "service", subtitle: "push", w: 338 })
  .node("w", { lane: "l", stack: 2, kind: "shape-window", title: "デスクトップ通知", eyebrow: "window", subtitle: "OS native" })
  .edge("m", "h", { label: "" })
  .edge("h", "w", { label: "" })
  .phase("p1", { duration: 750, title: "1. @alice", body: "Slack" }, (p: PhaseBuilder) => p.activate("m").badge("message"))
  .phase("p2", { duration: 750, title: "2. NotifyService", body: "push" }, (p: PhaseBuilder) => p.activate("m").activate("h").badge("service"))
  .phase("p3", { duration: 750, title: "通知", body: "message 送信 → notify service push → 受信者 desktop 通知表示。 messaging の end-to-end" }, (p: PhaseBuilder) => p.activate("m").activate("h").activate("w").badge("window"))
  .build();

/** S-21. trust bank asset (trader → 信託銀行 → 帳簿) */
export const sceneTrustAsset = diagram("scene-trust-asset", { topic: "scene: 信託資産 (trader → trust bank → 帳簿)" })
  .lane("l", { x: 0, width: W })
  .node("t", { lane: "l", stack: 0, kind: "shape-trader", title: "資産運用者", eyebrow: "trader", subtitle: "buy 指示" })
  .node("b", { lane: "l", stack: 1, kind: "shape-trust-bank", title: "三井住友信託", eyebrow: "trust", subtitle: "受託" })
  .node("f", { lane: "l", stack: 2, kind: "shape-file", title: "運用報告書", eyebrow: "record", subtitle: "月次" })
  .edge("t", "b", { label: "" })
  .edge("b", "f", { label: "" })
  .phase("p1", { duration: 750, title: "1. 資産運用者", body: "buy 指示" }, (p: PhaseBuilder) => p.activate("t").badge("trader"))
  .phase("p2", { duration: 750, title: "2. 三井住友信託", body: "受託" }, (p: PhaseBuilder) => p.activate("t").activate("b").badge("trust"))
  .phase("p3", { duration: 750, title: "信託資産", body: "運用者 buy 指示 → 信託銀行 受託 → 月次報告書 発行。 institutional 資産管理" }, (p: PhaseBuilder) => p.activate("t").activate("b").activate("f").badge("record"))
  .build();

/** S-22. blockchain node consensus (blockchain-node → blockchain-block → chain) */
export const sceneConsensus = diagram("scene-consensus", { topic: "scene: consensus (node → block → chain)" })
  .lane("l", { x: 0, width: W })
  .node("n", { lane: "l", stack: 0, kind: "shape-blockchain-node", title: "validator", eyebrow: "node", subtitle: "PoS" })
  .node("b", { lane: "l", stack: 1, kind: "shape-blockchain-block", title: "block #8123456", eyebrow: "block", subtitle: "proposed", w: 360 })
  .node("c", { lane: "l", stack: 2, kind: "shape-blockchain", title: "canonical chain", eyebrow: "chain", subtitle: "finalized" })
  .edge("n", "b", { label: "" })
  .edge("b", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. validator", body: "PoS" }, (p: PhaseBuilder) => p.activate("n").badge("node"))
  .phase("p2", { duration: 750, title: "2. block #8123456", body: "proposed" }, (p: PhaseBuilder) => p.activate("n").activate("b").badge("block"))
  .phase("p3", { duration: 750, title: "consensus", body: "validator が block 提案 → attestation 集約 → chain finalize。 PoS consensus の canonical" }, (p: PhaseBuilder) => p.activate("n").activate("b").activate("c").badge("chain"))
  .build();

/** S-23. token deploy (developer → contract → token) */
export const sceneTokenDeploy = diagram("scene-token-deploy", { topic: "scene: token deploy (dev → contract → token)" })
  .lane("l", { x: 0, width: W })
  .node("d", { lane: "l", stack: 0, kind: "shape-lawyer", title: "deployer", eyebrow: "dev", subtitle: "founder" })
  .node("c", { lane: "l", stack: 1, kind: "shape-smart-contract", title: "ERC-20", eyebrow: "contract", subtitle: "OpenZeppelin" })
  .node("t", { lane: "l", stack: 2, kind: "shape-token", title: "$KIWA", eyebrow: "token", subtitle: "1B supply" })
  .edge("d", "c", { label: "" })
  .edge("c", "t", { label: "" })
  .phase("p1", { duration: 750, title: "1. deployer", body: "founder" }, (p: PhaseBuilder) => p.activate("d").badge("dev"))
  .phase("p2", { duration: 750, title: "2. ERC-20", body: "OpenZeppelin" }, (p: PhaseBuilder) => p.activate("d").activate("c").badge("contract"))
  .phase("p3", { duration: 750, title: "token deploy", body: "developer が ERC-20 contract deploy → token 発行 → market 供給。 project trickery 開始" }, (p: PhaseBuilder) => p.activate("d").activate("c").activate("t").badge("token"))
  .build();

/** S-24. regulator compliance (regulator → 帳簿 → 信託銀行) */
export const sceneCompliance = diagram("scene-compliance", { topic: "scene: 規制対応 (regulator → 帳簿 → bank)" })
  .lane("l", { x: 0, width: W })
  .node("r", { lane: "l", stack: 0, kind: "shape-regulator", title: "金融庁", eyebrow: "regulator", subtitle: "検査" })
  .node("f", { lane: "l", stack: 1, kind: "shape-file", title: "取引記録", eyebrow: "record", subtitle: "audit trail" })
  .node("b", { lane: "l", stack: 2, kind: "shape-bank", title: "対象銀行", eyebrow: "bank", subtitle: "検査対象" })
  .edge("r", "f", { label: "" })
  .edge("f", "b", { label: "" })
  .phase("p1", { duration: 750, title: "1. 金融庁", body: "検査" }, (p: PhaseBuilder) => p.activate("r").badge("regulator"))
  .phase("p2", { duration: 750, title: "2. 取引記録", body: "audit trail" }, (p: PhaseBuilder) => p.activate("r").activate("f").badge("record"))
  .phase("p3", { duration: 750, title: "compliance", body: "規制当局 検査開始 → 帳簿 提出 → 銀行 検査対応。 金融庁 検査の canonical flow" }, (p: PhaseBuilder) => p.activate("r").activate("f").activate("b").badge("bank"))
  .build();

/** S-25. cross-chain swap (wallet → exchange → NFT) */
export const sceneNftMarketplace = diagram("scene-nft-marketplace", { topic: "scene: NFT 売買 (buyer → marketplace → NFT)" })
  .lane("l", { x: 0, width: W })
  .node("b", { lane: "l", stack: 0, kind: "shape-wallet", title: "buyer", eyebrow: "wallet", subtitle: "collector" })
  .node("m", { lane: "l", stack: 1, kind: "shape-exchange", title: "OpenSea", eyebrow: "marketplace", subtitle: "royalty 5%" })
  .node("n", { lane: "l", stack: 2, kind: "shape-nft", title: "BAYC #7890", eyebrow: "nft", subtitle: "Bored Ape", w: 272 })
  .edge("b", "m", { label: "" })
  .edge("m", "n", { label: "" })
  .phase("p1", { duration: 750, title: "1. buyer", body: "collector" }, (p: PhaseBuilder) => p.activate("b").badge("wallet"))
  .phase("p2", { duration: 750, title: "2. OpenSea", body: "royalty 5%" }, (p: PhaseBuilder) => p.activate("b").activate("m").badge("marketplace"))
  .phase("p3", { duration: 750, title: "NFT marketplace", body: "buyer が marketplace で bid → contract 実行 → NFT ownership 移転。 secondary market flow" }, (p: PhaseBuilder) => p.activate("b").activate("m").activate("n").badge("nft"))
  .build();

/** S-26. network topology (router → network node → server) */
export const sceneNetworkPath = diagram("scene-network-path", { topic: "scene: network (router → hub → server)" })
  .lane("l", { x: 0, width: W })
  .node("m", { lane: "l", stack: 0, kind: "shape-mobile-device", title: "client", eyebrow: "device", subtitle: "端末" })
  .node("n", { lane: "l", stack: 1, kind: "shape-network-node", title: "core switch", eyebrow: "network", subtitle: "L2/L3" })
  .node("s", { lane: "l", stack: 2, kind: "shape-server-rack", title: "app server", eyebrow: "server", subtitle: "DC", w: 272 })
  .edge("m", "n", { label: "" })
  .edge("n", "s", { label: "" })
  .phase("p1", { duration: 750, title: "1. client", body: "端末" }, (p: PhaseBuilder) => p.activate("m").badge("device"))
  .phase("p2", { duration: 750, title: "2. core switch", body: "L2/L3" }, (p: PhaseBuilder) => p.activate("m").activate("n").badge("network"))
  .phase("p3", { duration: 750, title: "network path", body: "client 端末 → network core switch 経由 → server 到達。 typical enterprise network 3-stage path" }, (p: PhaseBuilder) => p.activate("m").activate("n").activate("s").badge("server"))
  .build();

/** S-27. website checkout (website → payment → credit card) */
export const sceneCheckout = diagram("scene-checkout", { topic: "scene: checkout (site → provider → card)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-website", title: "shop.example.com", eyebrow: "site", subtitle: "cart", w: 404 })
  .node("p", { lane: "l", stack: 1, kind: "shape-payment-provider", title: "PayPal", eyebrow: "provider", subtitle: "checkout" })
  .node("c", { lane: "l", stack: 2, kind: "shape-credit-card", title: "MasterCard", eyebrow: "card", subtitle: "credit" })
  .edge("w", "p", { label: "" })
  .edge("p", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. shop.example.com", body: "cart" }, (p: PhaseBuilder) => p.activate("w").badge("site"))
  .phase("p2", { duration: 750, title: "2. PayPal", body: "checkout" }, (p: PhaseBuilder) => p.activate("w").activate("p").badge("provider"))
  .phase("p3", { duration: 750, title: "checkout", body: "サイトで cart 送信 → 決済 provider 経由 → クレカ authorization。 EC checkout の canonical" }, (p: PhaseBuilder) => p.activate("w").activate("p").activate("c").badge("card"))
  .build();

/** S-28. edge computing (mobile → CDN edge → cloud) */
export const sceneEdgeCompute = diagram("scene-edge-compute", { topic: "scene: edge compute (mobile → CDN → cloud)" })
  .lane("l", { x: 0, width: W })
  .node("m", { lane: "l", stack: 0, kind: "shape-mobile-device", title: "Android app", eyebrow: "mobile", subtitle: "user", w: 294 })
  .node("e", { lane: "l", stack: 1, kind: "shape-cdn-edge", title: "Fastly edge", eyebrow: "edge", subtitle: "compute@edge" })
  .node("c", { lane: "l", stack: 2, kind: "shape-cloud", title: "GCP origin", eyebrow: "cloud", subtitle: "fallback" })
  .edge("m", "e", { label: "" })
  .edge("e", "c", { label: "" })
  .phase("p1", { duration: 750, title: "1. Android app", body: "user" }, (p: PhaseBuilder) => p.activate("m").badge("mobile"))
  .phase("p2", { duration: 750, title: "2. Fastly edge", body: "compute@edge" }, (p: PhaseBuilder) => p.activate("m").activate("e").badge("edge"))
  .phase("p3", { duration: 750, title: "edge compute", body: "mobile request → CDN edge で compute → origin fallback。 low-latency delivery" }, (p: PhaseBuilder) => p.activate("m").activate("e").activate("c").badge("cloud"))
  .build();

/** S-29. stack version deploy (stack → gear → website) */
export const sceneVersionDeploy = diagram("scene-version-deploy", { topic: "scene: version deploy (stack → gear → site)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-stack", title: "release v3.2.0", eyebrow: "release", subtitle: "tagged", w: 360 })
  .node("g", { lane: "l", stack: 1, kind: "shape-gear", title: "deploy pipeline", eyebrow: "ci", subtitle: "canary", w: 382 })
  .node("w", { lane: "l", stack: 2, kind: "shape-website", title: "prod.example.com", eyebrow: "site", subtitle: "live", w: 404 })
  .edge("s", "g", { label: "" })
  .edge("g", "w", { label: "" })
  .phase("p1", { duration: 750, title: "1. release v3.2.0", body: "tagged" }, (p: PhaseBuilder) => p.activate("s").badge("release"))
  .phase("p2", { duration: 750, title: "2. deploy pipeline", body: "canary" }, (p: PhaseBuilder) => p.activate("s").activate("g").badge("ci"))
  .phase("p3", { duration: 750, title: "version deploy", body: "release tag → deploy pipeline canary → production site 反映。 SaaS deploy の standard" }, (p: PhaseBuilder) => p.activate("s").activate("g").activate("w").badge("site"))
  .build();

/** S-30. audit compliance chain (auditor → file → regulator) */
export const sceneAuditChain = diagram("scene-audit-chain", { topic: "scene: audit chain (auditor → file → regulator)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-auditor", title: "監査法人", eyebrow: "auditor", subtitle: "PwC" })
  .node("f", { lane: "l", stack: 1, kind: "shape-file", title: "監査報告書", eyebrow: "report", subtitle: "signed" })
  .node("r", { lane: "l", stack: 2, kind: "shape-regulator", title: "金融庁", eyebrow: "regulator", subtitle: "受領" })
  .edge("a", "f", { label: "" })
  .edge("f", "r", { label: "" })
  .phase("p1", { duration: 750, title: "1. 監査法人", body: "PwC" }, (p: PhaseBuilder) => p.activate("a").badge("auditor"))
  .phase("p2", { duration: 750, title: "2. 監査報告書", body: "signed" }, (p: PhaseBuilder) => p.activate("a").activate("f").badge("report"))
  .phase("p3", { duration: 750, title: "audit chain", body: "監査法人 検査 → 報告書 作成 → 規制当局 受領。 上場企業 quarterly audit の canonical" }, (p: PhaseBuilder) => p.activate("a").activate("f").activate("r").badge("regulator"))
  .build();

/**
 * source 記法 sample (人 / LLM が dragon で書く時の記法対応表を catalog UI で表示するため)。
 * key convention = `sourceYaml__<diagram export key>` / `sourceJson__<diagram export key>`。
 * catalog-items.ts の moduleToItems がこの suffix を検出して該当 CatalogItem に付与する。
 */

export const sourceYaml__sceneCryptoTransfer = `title: "crypto 送金"
type: topology
actors:
  - 送金者: shape-wallet "MetaMask EOA"
  - DEX: shape-exchange "clearing"
  - Ethereum: shape-ethereum-chain "L1 mainnet"
flow:
  - 送金者 -> DEX: ""
  - DEX -> Ethereum: ""
animation:
  - step: "1. 送金者" 0.75s
    focus: [送金者]
  - step: "2. DEX" 0.75s
    focus: [送金者, DEX]
  - step: "crypto 送金" 0.75s
    focus: [送金者, DEX, Ethereum]
`;

export const sourceJson__sceneCryptoTransfer = `{
  "title": "crypto 送金",
  "type": "topology",
  "actors": [
    { "name": "送金者", "kind": "shape-wallet", "subtitle": "MetaMask EOA" },
    { "name": "DEX", "kind": "shape-exchange", "subtitle": "clearing" },
    { "name": "Ethereum", "kind": "shape-ethereum-chain", "subtitle": "L1 mainnet" }
  ],
  "flow": [
    { "from": "送金者", "to": "DEX", "label": "" },
    { "from": "DEX", "to": "Ethereum", "label": "" }
  ],
  "animation": [
    { "step": "1. 送金者", "duration": 0.75, "focus": ["送金者"] },
    { "step": "2. DEX", "duration": 0.75, "focus": ["送金者", "DEX"] },
    { "step": "crypto 送金", "duration": 0.75, "focus": ["送金者", "DEX", "Ethereum"] }
  ]
}`;

export const sourceYaml__sceneLegalNotarization = `title: "法務 flow"
type: topology
actors:
  - 代理人: shape-lawyer "起草"
  - 公証役場: shape-notary "認証"
  - 登記簿: shape-file "official record"
flow:
  - 代理人 -> 公証役場: ""
  - 公証役場 -> 登記簿: ""
animation:
  - step: "1. 代理人" 0.75s
    focus: [代理人]
  - step: "2. 公証役場" 0.75s
    focus: [代理人, 公証役場]
  - step: "法務 flow" 0.75s
    focus: [代理人, 公証役場, 登記簿]
`;

export const sourceJson__sceneLegalNotarization = `{
  "title": "法務 flow",
  "type": "topology",
  "actors": [
    { "name": "代理人", "kind": "shape-lawyer", "subtitle": "起草" },
    { "name": "公証役場", "kind": "shape-notary", "subtitle": "認証" },
    { "name": "登記簿", "kind": "shape-file", "subtitle": "official record" }
  ],
  "flow": [
    { "from": "代理人", "to": "公証役場", "label": "" },
    { "from": "公証役場", "to": "登記簿", "label": "" }
  ],
  "animation": [
    { "step": "1. 代理人", "duration": 0.75, "focus": ["代理人"] },
    { "step": "2. 公証役場", "duration": 0.75, "focus": ["代理人", "公証役場"] },
    { "step": "法務 flow", "duration": 0.75, "focus": ["代理人", "公証役場", "登記簿"] }
  ]
}`;

export const sourceYaml__sceneNftMint = `title: "NFT mint"
type: topology
actors:
  - creator: shape-wallet "artist"
  - ERC-721: shape-smart-contract "OpenSea"
  - "Rare Punk": shape-nft "#42"
flow:
  - creator -> ERC-721: ""
  - ERC-721 -> "Rare Punk": ""
animation:
  - step: "1. creator" 0.75s
    focus: [creator]
  - step: "2. ERC-721" 0.75s
    focus: [creator, ERC-721]
  - step: "NFT mint" 0.75s
    focus: [creator, ERC-721, "Rare Punk"]
`;

export const sourceJson__sceneNftMint = `{
  "title": "NFT mint",
  "type": "topology",
  "actors": [
    { "name": "creator", "kind": "shape-wallet", "subtitle": "artist" },
    { "name": "ERC-721", "kind": "shape-smart-contract", "subtitle": "OpenSea" },
    { "name": "Rare Punk", "kind": "shape-nft", "subtitle": "#42" }
  ],
  "flow": [
    { "from": "creator", "to": "ERC-721", "label": "" },
    { "from": "ERC-721", "to": "Rare Punk", "label": "" }
  ],
  "animation": [
    { "step": "1. creator", "duration": 0.75, "focus": ["creator"] },
    { "step": "2. ERC-721", "duration": 0.75, "focus": ["creator", "ERC-721"] },
    { "step": "NFT mint", "duration": 0.75, "focus": ["creator", "ERC-721", "Rare Punk"] }
  ]
}`;

export const sourceYaml__sceneBankingFlow = `title: "銀行 flow"
type: topology
actors:
  - ATM: shape-atm "cash 出金"
  - みずほ銀行: shape-bank "都銀"
  - Amazon: shape-online-shop "EC"
flow:
  - ATM -> みずほ銀行: ""
  - みずほ銀行 -> Amazon: ""
animation:
  - step: "1. ATM" 0.75s
    focus: [ATM]
  - step: "2. みずほ銀行" 0.75s
    focus: [ATM, みずほ銀行]
  - step: "銀行 flow" 0.75s
    focus: [ATM, みずほ銀行, Amazon]
`;

export const sourceJson__sceneBankingFlow = `{
  "title": "銀行 flow",
  "type": "topology",
  "actors": [
    { "name": "ATM", "kind": "shape-atm", "subtitle": "cash 出金" },
    { "name": "みずほ銀行", "kind": "shape-bank", "subtitle": "都銀" },
    { "name": "Amazon", "kind": "shape-online-shop", "subtitle": "EC" }
  ],
  "flow": [
    { "from": "ATM", "to": "みずほ銀行", "label": "" },
    { "from": "みずほ銀行", "to": "Amazon", "label": "" }
  ],
  "animation": [
    { "step": "1. ATM", "duration": 0.75, "focus": ["ATM"] },
    { "step": "2. みずほ銀行", "duration": 0.75, "focus": ["ATM", "みずほ銀行"] },
    { "step": "銀行 flow", "duration": 0.75, "focus": ["ATM", "みずほ銀行", "Amazon"] }
  ]
}`;

export const sourceYaml__sceneIotOnchain = `title: "IoT オンチェーン"
type: topology
actors:
  - 温度計: shape-iot-sensor "BLE"
  - Infura: shape-rpc-node "provider"
  - OracleContract: shape-smart-contract "Solidity"
flow:
  - 温度計 -> Infura: ""
  - Infura -> OracleContract: ""
animation:
  - step: "1. 温度計" 0.75s
    focus: [温度計]
  - step: "2. Infura" 0.75s
    focus: [温度計, Infura]
  - step: "IoT オンチェーン" 0.75s
    focus: [温度計, Infura, OracleContract]
`;

export const sourceJson__sceneIotOnchain = `{
  "title": "IoT オンチェーン",
  "type": "topology",
  "actors": [
    { "name": "温度計", "kind": "shape-iot-sensor", "subtitle": "BLE" },
    { "name": "Infura", "kind": "shape-rpc-node", "subtitle": "provider" },
    { "name": "OracleContract", "kind": "shape-smart-contract", "subtitle": "Solidity" }
  ],
  "flow": [
    { "from": "温度計", "to": "Infura", "label": "" },
    { "from": "Infura", "to": "OracleContract", "label": "" }
  ],
  "animation": [
    { "step": "1. 温度計", "duration": 0.75, "focus": ["温度計"] },
    { "step": "2. Infura", "duration": 0.75, "focus": ["温度計", "Infura"] },
    { "step": "IoT オンチェーン", "duration": 0.75, "focus": ["温度計", "Infura", "OracleContract"] }
  ]
}`;

export const sourceYaml__sceneAuditFlow = `title: "監査 flow"
type: topology
actors:
  - 監査法人: shape-auditor "検査"
  - 会計帳簿: shape-file "ledger"
  - 金融庁: shape-regulator "監督"
flow:
  - 監査法人 -> 会計帳簿: ""
  - 会計帳簿 -> 金融庁: ""
animation:
  - step: "1. 監査法人" 0.75s
    focus: [監査法人]
  - step: "2. 会計帳簿" 0.75s
    focus: [監査法人, 会計帳簿]
  - step: "監査 flow" 0.75s
    focus: [監査法人, 会計帳簿, 金融庁]
`;

export const sourceJson__sceneAuditFlow = `{
  "title": "監査 flow",
  "type": "topology",
  "actors": [
    { "name": "監査法人", "kind": "shape-auditor", "subtitle": "検査" },
    { "name": "会計帳簿", "kind": "shape-file", "subtitle": "ledger" },
    { "name": "金融庁", "kind": "shape-regulator", "subtitle": "監督" }
  ],
  "flow": [
    { "from": "監査法人", "to": "会計帳簿", "label": "" },
    { "from": "会計帳簿", "to": "金融庁", "label": "" }
  ],
  "animation": [
    { "step": "1. 監査法人", "duration": 0.75, "focus": ["監査法人"] },
    { "step": "2. 会計帳簿", "duration": 0.75, "focus": ["監査法人", "会計帳簿"] },
    { "step": "監査 flow", "duration": 0.75, "focus": ["監査法人", "会計帳簿", "金融庁"] }
  ]
}`;

export const sourceYaml__sceneStockTrading = `title: "証券取引"
type: topology
actors:
  - 個人投資家: shape-trader "retail"
  - 野村証券: shape-brokerage "投資銀行"
  - 東証: shape-exchange "TSE"
flow:
  - 個人投資家 -> 野村証券: ""
  - 野村証券 -> 東証: ""
animation:
  - step: "1. 個人投資家" 0.75s
    focus: [個人投資家]
  - step: "2. 野村証券" 0.75s
    focus: [個人投資家, 野村証券]
  - step: "証券取引" 0.75s
    focus: [個人投資家, 野村証券, 東証]
`;

export const sourceJson__sceneStockTrading = `{
  "title": "証券取引",
  "type": "topology",
  "actors": [
    { "name": "個人投資家", "kind": "shape-trader", "subtitle": "retail" },
    { "name": "野村証券", "kind": "shape-brokerage", "subtitle": "投資銀行" },
    { "name": "東証", "kind": "shape-exchange", "subtitle": "TSE" }
  ],
  "flow": [
    { "from": "個人投資家", "to": "野村証券", "label": "" },
    { "from": "野村証券", "to": "東証", "label": "" }
  ],
  "animation": [
    { "step": "1. 個人投資家", "duration": 0.75, "focus": ["個人投資家"] },
    { "step": "2. 野村証券", "duration": 0.75, "focus": ["個人投資家", "野村証券"] },
    { "step": "証券取引", "duration": 0.75, "focus": ["個人投資家", "野村証券", "東証"] }
  ]
}`;

export const sourceYaml__sceneSupportFlow = `title: "問い合わせ flow"
type: topology
actors:
  - サポート担当: shape-customer-service "24H 対応"
  - BUG-1234: shape-kanban-card "Linear"
  - hotfix.ts: shape-code-block "fix by dev"
flow:
  - サポート担当 -> BUG-1234: ""
  - BUG-1234 -> hotfix.ts: ""
animation:
  - step: "1. サポート担当" 0.75s
    focus: [サポート担当]
  - step: "2. BUG-1234" 0.75s
    focus: [サポート担当, BUG-1234]
  - step: "問い合わせ flow" 0.75s
    focus: [サポート担当, BUG-1234, hotfix.ts]
`;

export const sourceJson__sceneSupportFlow = `{
  "title": "問い合わせ flow",
  "type": "topology",
  "actors": [
    { "name": "サポート担当", "kind": "shape-customer-service", "subtitle": "24H 対応" },
    { "name": "BUG-1234", "kind": "shape-kanban-card", "subtitle": "Linear" },
    { "name": "hotfix.ts", "kind": "shape-code-block", "subtitle": "fix by dev" }
  ],
  "flow": [
    { "from": "サポート担当", "to": "BUG-1234", "label": "" },
    { "from": "BUG-1234", "to": "hotfix.ts", "label": "" }
  ],
  "animation": [
    { "step": "1. サポート担当", "duration": 0.75, "focus": ["サポート担当"] },
    { "step": "2. BUG-1234", "duration": 0.75, "focus": ["サポート担当", "BUG-1234"] },
    { "step": "問い合わせ flow", "duration": 0.75, "focus": ["サポート担当", "BUG-1234", "hotfix.ts"] }
  ]
}`;

export const sourceYaml__scenePaymentSettlement = `title: "決済 flow"
type: topology
actors:
  - Stripe: shape-payment-provider "SaaS"
  - VISA: shape-credit-card "credit"
  - 発行銀行: shape-bank "MUFG"
flow:
  - Stripe -> VISA: ""
  - VISA -> 発行銀行: ""
animation:
  - step: "1. Stripe" 0.75s
    focus: [Stripe]
  - step: "2. VISA" 0.75s
    focus: [Stripe, VISA]
  - step: "決済 flow" 0.75s
    focus: [Stripe, VISA, 発行銀行]
`;

export const sourceJson__scenePaymentSettlement = `{
  "title": "決済 flow",
  "type": "topology",
  "actors": [
    { "name": "Stripe", "kind": "shape-payment-provider", "subtitle": "SaaS" },
    { "name": "VISA", "kind": "shape-credit-card", "subtitle": "credit" },
    { "name": "発行銀行", "kind": "shape-bank", "subtitle": "MUFG" }
  ],
  "flow": [
    { "from": "Stripe", "to": "VISA", "label": "" },
    { "from": "VISA", "to": "発行銀行", "label": "" }
  ],
  "animation": [
    { "step": "1. Stripe", "duration": 0.75, "focus": ["Stripe"] },
    { "step": "2. VISA", "duration": 0.75, "focus": ["Stripe", "VISA"] },
    { "step": "決済 flow", "duration": 0.75, "focus": ["Stripe", "VISA", "発行銀行"] }
  ]
}`;

export const sourceYaml__sceneWebInfra = `title: "web infra"
type: topology
actors:
  - example.com: shape-website "SPA"
  - Cloudflare: shape-cdn-edge "edge"
  - origin: shape-server-rack "AWS"
flow:
  - example.com -> Cloudflare: ""
  - Cloudflare -> origin: ""
animation:
  - step: "1. example.com" 0.75s
    focus: [example.com]
  - step: "2. Cloudflare" 0.75s
    focus: [example.com, Cloudflare]
  - step: "web infra" 0.75s
    focus: [example.com, Cloudflare, origin]
`;

export const sourceJson__sceneWebInfra = `{
  "title": "web infra",
  "type": "topology",
  "actors": [
    { "name": "example.com", "kind": "shape-website", "subtitle": "SPA" },
    { "name": "Cloudflare", "kind": "shape-cdn-edge", "subtitle": "edge" },
    { "name": "origin", "kind": "shape-server-rack", "subtitle": "AWS" }
  ],
  "flow": [
    { "from": "example.com", "to": "Cloudflare", "label": "" },
    { "from": "Cloudflare", "to": "origin", "label": "" }
  ],
  "animation": [
    { "step": "1. example.com", "duration": 0.75, "focus": ["example.com"] },
    { "step": "2. Cloudflare", "duration": 0.75, "focus": ["example.com", "Cloudflare"] },
    { "step": "web infra", "duration": 0.75, "focus": ["example.com", "Cloudflare", "origin"] }
  ]
}`;

export const sourceYaml__sceneTokenBridge = `title: "token bridge"
type: topology
actors:
  - Ethereum: shape-ethereum-chain "L1"
  - Bridge: shape-smart-contract "lock"
  - Arbitrum: shape-blockchain "L2"
flow:
  - Ethereum -> Bridge: ""
  - Bridge -> Arbitrum: ""
animation:
  - step: "1. Ethereum" 0.75s
    focus: [Ethereum]
  - step: "2. Bridge" 0.75s
    focus: [Ethereum, Bridge]
  - step: "token bridge" 0.75s
    focus: [Ethereum, Bridge, Arbitrum]
`;

export const sourceJson__sceneTokenBridge = `{
  "title": "token bridge",
  "type": "topology",
  "actors": [
    { "name": "Ethereum", "kind": "shape-ethereum-chain", "subtitle": "L1" },
    { "name": "Bridge", "kind": "shape-smart-contract", "subtitle": "lock" },
    { "name": "Arbitrum", "kind": "shape-blockchain", "subtitle": "L2" }
  ],
  "flow": [
    { "from": "Ethereum", "to": "Bridge", "label": "" },
    { "from": "Bridge", "to": "Arbitrum", "label": "" }
  ],
  "animation": [
    { "step": "1. Ethereum", "duration": 0.75, "focus": ["Ethereum"] },
    { "step": "2. Bridge", "duration": 0.75, "focus": ["Ethereum", "Bridge"] },
    { "step": "token bridge", "duration": 0.75, "focus": ["Ethereum", "Bridge", "Arbitrum"] }
  ]
}`;

export const sourceYaml__sceneDefiLending = `title: "DeFi lending"
type: topology
actors:
  - 供給者: shape-wallet "USDC 供給"
  - "Aave v3": shape-smart-contract "pool"
  - aUSDC: shape-token "yield-bearing"
flow:
  - 供給者 -> "Aave v3": ""
  - "Aave v3" -> aUSDC: ""
animation:
  - step: "1. 供給者" 0.75s
    focus: [供給者]
  - step: "2. Aave v3" 0.75s
    focus: [供給者, "Aave v3"]
  - step: "DeFi lending" 0.75s
    focus: [供給者, "Aave v3", aUSDC]
`;

export const sourceJson__sceneDefiLending = `{
  "title": "DeFi lending",
  "type": "topology",
  "actors": [
    { "name": "供給者", "kind": "shape-wallet", "subtitle": "USDC 供給" },
    { "name": "Aave v3", "kind": "shape-smart-contract", "subtitle": "pool" },
    { "name": "aUSDC", "kind": "shape-token", "subtitle": "yield-bearing" }
  ],
  "flow": [
    { "from": "供給者", "to": "Aave v3", "label": "" },
    { "from": "Aave v3", "to": "aUSDC", "label": "" }
  ],
  "animation": [
    { "step": "1. 供給者", "duration": 0.75, "focus": ["供給者"] },
    { "step": "2. Aave v3", "duration": 0.75, "focus": ["供給者", "Aave v3"] },
    { "step": "DeFi lending", "duration": 0.75, "focus": ["供給者", "Aave v3", "aUSDC"] }
  ]
}`;

export const sourceYaml__sceneBitcoinTx = `title: "bitcoin tx"
type: topology
actors:
  - sender: shape-wallet "Bitcoin Core"
  - "BTC mainnet": shape-bitcoin-chain "PoW"
  - "full node": shape-blockchain-node "validator"
flow:
  - sender -> "BTC mainnet": ""
  - "BTC mainnet" -> "full node": ""
animation:
  - step: "1. sender" 0.75s
    focus: [sender]
  - step: "2. BTC mainnet" 0.75s
    focus: [sender, "BTC mainnet"]
  - step: "bitcoin tx" 0.75s
    focus: [sender, "BTC mainnet", "full node"]
`;

export const sourceJson__sceneBitcoinTx = `{
  "title": "bitcoin tx",
  "type": "topology",
  "actors": [
    { "name": "sender", "kind": "shape-wallet", "subtitle": "Bitcoin Core" },
    { "name": "BTC mainnet", "kind": "shape-bitcoin-chain", "subtitle": "PoW" },
    { "name": "full node", "kind": "shape-blockchain-node", "subtitle": "validator" }
  ],
  "flow": [
    { "from": "sender", "to": "BTC mainnet", "label": "" },
    { "from": "BTC mainnet", "to": "full node", "label": "" }
  ],
  "animation": [
    { "step": "1. sender", "duration": 0.75, "focus": ["sender"] },
    { "step": "2. BTC mainnet", "duration": 0.75, "focus": ["sender", "BTC mainnet"] },
    { "step": "bitcoin tx", "duration": 0.75, "focus": ["sender", "BTC mainnet", "full node"] }
  ]
}`;

export const sourceYaml__sceneEcOrder = `title: "EC 注文"
type: topology
actors:
  - 顧客: shape-customer-service "注文"
  - Rakuten: shape-online-shop "EC"
  - 物流倉庫: shape-warehouse "出荷"
flow:
  - 顧客 -> Rakuten: ""
  - Rakuten -> 物流倉庫: ""
animation:
  - step: "1. 顧客" 0.75s
    focus: [顧客]
  - step: "2. Rakuten" 0.75s
    focus: [顧客, Rakuten]
  - step: "EC 注文" 0.75s
    focus: [顧客, Rakuten, 物流倉庫]
`;

export const sourceJson__sceneEcOrder = `{
  "title": "EC 注文",
  "type": "topology",
  "actors": [
    { "name": "顧客", "kind": "shape-customer-service", "subtitle": "注文" },
    { "name": "Rakuten", "kind": "shape-online-shop", "subtitle": "EC" },
    { "name": "物流倉庫", "kind": "shape-warehouse", "subtitle": "出荷" }
  ],
  "flow": [
    { "from": "顧客", "to": "Rakuten", "label": "" },
    { "from": "Rakuten", "to": "物流倉庫", "label": "" }
  ],
  "animation": [
    { "step": "1. 顧客", "duration": 0.75, "focus": ["顧客"] },
    { "step": "2. Rakuten", "duration": 0.75, "focus": ["顧客", "Rakuten"] },
    { "step": "EC 注文", "duration": 0.75, "focus": ["顧客", "Rakuten", "物流倉庫"] }
  ]
}`;

export const sourceYaml__sceneMobileApi = `title: "mobile API"
type: topology
actors:
  - "iOS app": shape-mobile-device "SwiftUI"
  - GraphQL: shape-api-gateway "Apollo"
  - backend: shape-server-rack "K8s"
flow:
  - "iOS app" -> GraphQL: ""
  - GraphQL -> backend: ""
animation:
  - step: "1. iOS app" 0.75s
    focus: ["iOS app"]
  - step: "2. GraphQL" 0.75s
    focus: ["iOS app", GraphQL]
  - step: "mobile API" 0.75s
    focus: ["iOS app", GraphQL, backend]
`;

export const sourceJson__sceneMobileApi = `{
  "title": "mobile API",
  "type": "topology",
  "actors": [
    { "name": "iOS app", "kind": "shape-mobile-device", "subtitle": "SwiftUI" },
    { "name": "GraphQL", "kind": "shape-api-gateway", "subtitle": "Apollo" },
    { "name": "backend", "kind": "shape-server-rack", "subtitle": "K8s" }
  ],
  "flow": [
    { "from": "iOS app", "to": "GraphQL", "label": "" },
    { "from": "GraphQL", "to": "backend", "label": "" }
  ],
  "animation": [
    { "step": "1. iOS app", "duration": 0.75, "focus": ["iOS app"] },
    { "step": "2. GraphQL", "duration": 0.75, "focus": ["iOS app", "GraphQL"] },
    { "step": "mobile API", "duration": 0.75, "focus": ["iOS app", "GraphQL", "backend"] }
  ]
}`;

export const sourceYaml__sceneFactoryLine = `title: "factory line"
type: topology
actors:
  - "FANUC robot": shape-robot-arm "組立"
  - "計測 sensor": shape-iot-sensor "品質"
  - "MES DB": shape-cylinder "traceability"
flow:
  - "FANUC robot" -> "計測 sensor": ""
  - "計測 sensor" -> "MES DB": ""
animation:
  - step: "1. FANUC robot" 0.75s
    focus: ["FANUC robot"]
  - step: "2. 計測 sensor" 0.75s
    focus: ["FANUC robot", "計測 sensor"]
  - step: "factory line" 0.75s
    focus: ["FANUC robot", "計測 sensor", "MES DB"]
`;

export const sourceJson__sceneFactoryLine = `{
  "title": "factory line",
  "type": "topology",
  "actors": [
    { "name": "FANUC robot", "kind": "shape-robot-arm", "subtitle": "組立" },
    { "name": "計測 sensor", "kind": "shape-iot-sensor", "subtitle": "品質" },
    { "name": "MES DB", "kind": "shape-cylinder", "subtitle": "traceability" }
  ],
  "flow": [
    { "from": "FANUC robot", "to": "計測 sensor", "label": "" },
    { "from": "計測 sensor", "to": "MES DB", "label": "" }
  ],
  "animation": [
    { "step": "1. FANUC robot", "duration": 0.75, "focus": ["FANUC robot"] },
    { "step": "2. 計測 sensor", "duration": 0.75, "focus": ["FANUC robot", "計測 sensor"] },
    { "step": "factory line", "duration": 0.75, "focus": ["FANUC robot", "計測 sensor", "MES DB"] }
  ]
}`;

export const sourceYaml__sceneSatelliteChain = `title: "satellite chain"
type: topology
actors:
  - Starlink: shape-satellite "LEO"
  - Alchemy: shape-rpc-node "endpoint"
  - Solana: shape-blockchain "high TPS"
flow:
  - Starlink -> Alchemy: ""
  - Alchemy -> Solana: ""
animation:
  - step: "1. Starlink" 0.75s
    focus: [Starlink]
  - step: "2. Alchemy" 0.75s
    focus: [Starlink, Alchemy]
  - step: "satellite chain" 0.75s
    focus: [Starlink, Alchemy, Solana]
`;

export const sourceJson__sceneSatelliteChain = `{
  "title": "satellite chain",
  "type": "topology",
  "actors": [
    { "name": "Starlink", "kind": "shape-satellite", "subtitle": "LEO" },
    { "name": "Alchemy", "kind": "shape-rpc-node", "subtitle": "endpoint" },
    { "name": "Solana", "kind": "shape-blockchain", "subtitle": "high TPS" }
  ],
  "flow": [
    { "from": "Starlink", "to": "Alchemy", "label": "" },
    { "from": "Alchemy", "to": "Solana", "label": "" }
  ],
  "animation": [
    { "step": "1. Starlink", "duration": 0.75, "focus": ["Starlink"] },
    { "step": "2. Alchemy", "duration": 0.75, "focus": ["Starlink", "Alchemy"] },
    { "step": "satellite chain", "duration": 0.75, "focus": ["Starlink", "Alchemy", "Solana"] }
  ]
}`;

export const sourceYaml__sceneDevOps = `title: "DevOps"
type: topology
actors:
  - src/: shape-code-block "TypeScript"
  - "GitHub Actions": shape-gear "build + test"
  - "AWS ECS": shape-cloud "container"
flow:
  - src/ -> "GitHub Actions": ""
  - "GitHub Actions" -> "AWS ECS": ""
animation:
  - step: "1. src/" 0.75s
    focus: [src/]
  - step: "2. GitHub Actions" 0.75s
    focus: [src/, "GitHub Actions"]
  - step: "DevOps" 0.75s
    focus: [src/, "GitHub Actions", "AWS ECS"]
`;

export const sourceJson__sceneDevOps = `{
  "title": "DevOps",
  "type": "topology",
  "actors": [
    { "name": "src/", "kind": "shape-code-block", "subtitle": "TypeScript" },
    { "name": "GitHub Actions", "kind": "shape-gear", "subtitle": "build + test" },
    { "name": "AWS ECS", "kind": "shape-cloud", "subtitle": "container" }
  ],
  "flow": [
    { "from": "src/", "to": "GitHub Actions", "label": "" },
    { "from": "GitHub Actions", "to": "AWS ECS", "label": "" }
  ],
  "animation": [
    { "step": "1. src/", "duration": 0.75, "focus": ["src/"] },
    { "step": "2. GitHub Actions", "duration": 0.75, "focus": ["src/", "GitHub Actions"] },
    { "step": "DevOps", "duration": 0.75, "focus": ["src/", "GitHub Actions", "AWS ECS"] }
  ]
}`;

export const sourceYaml__sceneTaskFlow = `title: "task flow"
type: topology
actors:
  - "todo #42": shape-kanban-card "in progress"
  - "$ npm run build": shape-terminal "shell"
  - build.log: shape-file "output"
flow:
  - "todo #42" -> "$ npm run build": ""
  - "$ npm run build" -> build.log: ""
animation:
  - step: "1. todo #42" 0.75s
    focus: ["todo #42"]
  - step: "2. $ npm run build" 0.75s
    focus: ["todo #42", "$ npm run build"]
  - step: "task flow" 0.75s
    focus: ["todo #42", "$ npm run build", build.log]
`;

export const sourceJson__sceneTaskFlow = `{
  "title": "task flow",
  "type": "topology",
  "actors": [
    { "name": "todo #42", "kind": "shape-kanban-card", "subtitle": "in progress" },
    { "name": "$ npm run build", "kind": "shape-terminal", "subtitle": "shell" },
    { "name": "build.log", "kind": "shape-file", "subtitle": "output" }
  ],
  "flow": [
    { "from": "todo #42", "to": "$ npm run build", "label": "" },
    { "from": "$ npm run build", "to": "build.log", "label": "" }
  ],
  "animation": [
    { "step": "1. todo #42", "duration": 0.75, "focus": ["todo #42"] },
    { "step": "2. $ npm run build", "duration": 0.75, "focus": ["todo #42", "$ npm run build"] },
    { "step": "task flow", "duration": 0.75, "focus": ["todo #42", "$ npm run build", "build.log"] }
  ]
}`;

export const sourceYaml__sceneNotification = `title: "通知"
type: topology
actors:
  - @alice: shape-message-bubble "Slack"
  - NotifyService: shape-hexagon "push"
  - デスクトップ通知: shape-window "OS native"
flow:
  - @alice -> NotifyService: ""
  - NotifyService -> デスクトップ通知: ""
animation:
  - step: "1. @alice" 0.75s
    focus: [@alice]
  - step: "2. NotifyService" 0.75s
    focus: [@alice, NotifyService]
  - step: "通知" 0.75s
    focus: [@alice, NotifyService, デスクトップ通知]
`;

export const sourceJson__sceneNotification = `{
  "title": "通知",
  "type": "topology",
  "actors": [
    { "name": "@alice", "kind": "shape-message-bubble", "subtitle": "Slack" },
    { "name": "NotifyService", "kind": "shape-hexagon", "subtitle": "push" },
    { "name": "デスクトップ通知", "kind": "shape-window", "subtitle": "OS native" }
  ],
  "flow": [
    { "from": "@alice", "to": "NotifyService", "label": "" },
    { "from": "NotifyService", "to": "デスクトップ通知", "label": "" }
  ],
  "animation": [
    { "step": "1. @alice", "duration": 0.75, "focus": ["@alice"] },
    { "step": "2. NotifyService", "duration": 0.75, "focus": ["@alice", "NotifyService"] },
    { "step": "通知", "duration": 0.75, "focus": ["@alice", "NotifyService", "デスクトップ通知"] }
  ]
}`;

export const sourceYaml__sceneTrustAsset = `title: "信託資産"
type: topology
actors:
  - 資産運用者: shape-trader "buy 指示"
  - 三井住友信託: shape-trust-bank "受託"
  - 運用報告書: shape-file "月次"
flow:
  - 資産運用者 -> 三井住友信託: ""
  - 三井住友信託 -> 運用報告書: ""
animation:
  - step: "1. 資産運用者" 0.75s
    focus: [資産運用者]
  - step: "2. 三井住友信託" 0.75s
    focus: [資産運用者, 三井住友信託]
  - step: "信託資産" 0.75s
    focus: [資産運用者, 三井住友信託, 運用報告書]
`;

export const sourceJson__sceneTrustAsset = `{
  "title": "信託資産",
  "type": "topology",
  "actors": [
    { "name": "資産運用者", "kind": "shape-trader", "subtitle": "buy 指示" },
    { "name": "三井住友信託", "kind": "shape-trust-bank", "subtitle": "受託" },
    { "name": "運用報告書", "kind": "shape-file", "subtitle": "月次" }
  ],
  "flow": [
    { "from": "資産運用者", "to": "三井住友信託", "label": "" },
    { "from": "三井住友信託", "to": "運用報告書", "label": "" }
  ],
  "animation": [
    { "step": "1. 資産運用者", "duration": 0.75, "focus": ["資産運用者"] },
    { "step": "2. 三井住友信託", "duration": 0.75, "focus": ["資産運用者", "三井住友信託"] },
    { "step": "信託資産", "duration": 0.75, "focus": ["資産運用者", "三井住友信託", "運用報告書"] }
  ]
}`;

export const sourceYaml__sceneConsensus = `title: "consensus"
type: topology
actors:
  - validator: shape-blockchain-node "PoS"
  - "block #8123456": shape-blockchain-block "proposed"
  - "canonical chain": shape-blockchain "finalized"
flow:
  - validator -> "block #8123456": ""
  - "block #8123456" -> "canonical chain": ""
animation:
  - step: "1. validator" 0.75s
    focus: [validator]
  - step: "2. block #8123456" 0.75s
    focus: [validator, "block #8123456"]
  - step: "consensus" 0.75s
    focus: [validator, "block #8123456", "canonical chain"]
`;

export const sourceJson__sceneConsensus = `{
  "title": "consensus",
  "type": "topology",
  "actors": [
    { "name": "validator", "kind": "shape-blockchain-node", "subtitle": "PoS" },
    { "name": "block #8123456", "kind": "shape-blockchain-block", "subtitle": "proposed" },
    { "name": "canonical chain", "kind": "shape-blockchain", "subtitle": "finalized" }
  ],
  "flow": [
    { "from": "validator", "to": "block #8123456", "label": "" },
    { "from": "block #8123456", "to": "canonical chain", "label": "" }
  ],
  "animation": [
    { "step": "1. validator", "duration": 0.75, "focus": ["validator"] },
    { "step": "2. block #8123456", "duration": 0.75, "focus": ["validator", "block #8123456"] },
    { "step": "consensus", "duration": 0.75, "focus": ["validator", "block #8123456", "canonical chain"] }
  ]
}`;

export const sourceYaml__sceneTokenDeploy = `title: "token deploy"
type: topology
actors:
  - deployer: shape-lawyer "founder"
  - ERC-20: shape-smart-contract "OpenZeppelin"
  - $KIWA: shape-token "1B supply"
flow:
  - deployer -> ERC-20: ""
  - ERC-20 -> $KIWA: ""
animation:
  - step: "1. deployer" 0.75s
    focus: [deployer]
  - step: "2. ERC-20" 0.75s
    focus: [deployer, ERC-20]
  - step: "token deploy" 0.75s
    focus: [deployer, ERC-20, $KIWA]
`;

export const sourceJson__sceneTokenDeploy = `{
  "title": "token deploy",
  "type": "topology",
  "actors": [
    { "name": "deployer", "kind": "shape-lawyer", "subtitle": "founder" },
    { "name": "ERC-20", "kind": "shape-smart-contract", "subtitle": "OpenZeppelin" },
    { "name": "$KIWA", "kind": "shape-token", "subtitle": "1B supply" }
  ],
  "flow": [
    { "from": "deployer", "to": "ERC-20", "label": "" },
    { "from": "ERC-20", "to": "$KIWA", "label": "" }
  ],
  "animation": [
    { "step": "1. deployer", "duration": 0.75, "focus": ["deployer"] },
    { "step": "2. ERC-20", "duration": 0.75, "focus": ["deployer", "ERC-20"] },
    { "step": "token deploy", "duration": 0.75, "focus": ["deployer", "ERC-20", "$KIWA"] }
  ]
}`;

export const sourceYaml__sceneCompliance = `title: "compliance"
type: topology
actors:
  - 金融庁: shape-regulator "検査"
  - 取引記録: shape-file "audit trail"
  - 対象銀行: shape-bank "検査対象"
flow:
  - 金融庁 -> 取引記録: ""
  - 取引記録 -> 対象銀行: ""
animation:
  - step: "1. 金融庁" 0.75s
    focus: [金融庁]
  - step: "2. 取引記録" 0.75s
    focus: [金融庁, 取引記録]
  - step: "compliance" 0.75s
    focus: [金融庁, 取引記録, 対象銀行]
`;

export const sourceJson__sceneCompliance = `{
  "title": "compliance",
  "type": "topology",
  "actors": [
    { "name": "金融庁", "kind": "shape-regulator", "subtitle": "検査" },
    { "name": "取引記録", "kind": "shape-file", "subtitle": "audit trail" },
    { "name": "対象銀行", "kind": "shape-bank", "subtitle": "検査対象" }
  ],
  "flow": [
    { "from": "金融庁", "to": "取引記録", "label": "" },
    { "from": "取引記録", "to": "対象銀行", "label": "" }
  ],
  "animation": [
    { "step": "1. 金融庁", "duration": 0.75, "focus": ["金融庁"] },
    { "step": "2. 取引記録", "duration": 0.75, "focus": ["金融庁", "取引記録"] },
    { "step": "compliance", "duration": 0.75, "focus": ["金融庁", "取引記録", "対象銀行"] }
  ]
}`;

export const sourceYaml__sceneNftMarketplace = `title: "NFT marketplace"
type: topology
actors:
  - buyer: shape-wallet "collector"
  - OpenSea: shape-exchange "royalty 5%"
  - "BAYC #7890": shape-nft "Bored Ape"
flow:
  - buyer -> OpenSea: ""
  - OpenSea -> "BAYC #7890": ""
animation:
  - step: "1. buyer" 0.75s
    focus: [buyer]
  - step: "2. OpenSea" 0.75s
    focus: [buyer, OpenSea]
  - step: "NFT marketplace" 0.75s
    focus: [buyer, OpenSea, "BAYC #7890"]
`;

export const sourceJson__sceneNftMarketplace = `{
  "title": "NFT marketplace",
  "type": "topology",
  "actors": [
    { "name": "buyer", "kind": "shape-wallet", "subtitle": "collector" },
    { "name": "OpenSea", "kind": "shape-exchange", "subtitle": "royalty 5%" },
    { "name": "BAYC #7890", "kind": "shape-nft", "subtitle": "Bored Ape" }
  ],
  "flow": [
    { "from": "buyer", "to": "OpenSea", "label": "" },
    { "from": "OpenSea", "to": "BAYC #7890", "label": "" }
  ],
  "animation": [
    { "step": "1. buyer", "duration": 0.75, "focus": ["buyer"] },
    { "step": "2. OpenSea", "duration": 0.75, "focus": ["buyer", "OpenSea"] },
    { "step": "NFT marketplace", "duration": 0.75, "focus": ["buyer", "OpenSea", "BAYC #7890"] }
  ]
}`;

export const sourceYaml__sceneNetworkPath = `title: "network path"
type: topology
actors:
  - client: shape-mobile-device "端末"
  - "core switch": shape-network-node "L2/L3"
  - "app server": shape-server-rack "DC"
flow:
  - client -> "core switch": ""
  - "core switch" -> "app server": ""
animation:
  - step: "1. client" 0.75s
    focus: [client]
  - step: "2. core switch" 0.75s
    focus: [client, "core switch"]
  - step: "network path" 0.75s
    focus: [client, "core switch", "app server"]
`;

export const sourceJson__sceneNetworkPath = `{
  "title": "network path",
  "type": "topology",
  "actors": [
    { "name": "client", "kind": "shape-mobile-device", "subtitle": "端末" },
    { "name": "core switch", "kind": "shape-network-node", "subtitle": "L2/L3" },
    { "name": "app server", "kind": "shape-server-rack", "subtitle": "DC" }
  ],
  "flow": [
    { "from": "client", "to": "core switch", "label": "" },
    { "from": "core switch", "to": "app server", "label": "" }
  ],
  "animation": [
    { "step": "1. client", "duration": 0.75, "focus": ["client"] },
    { "step": "2. core switch", "duration": 0.75, "focus": ["client", "core switch"] },
    { "step": "network path", "duration": 0.75, "focus": ["client", "core switch", "app server"] }
  ]
}`;

export const sourceYaml__sceneCheckout = `title: "checkout"
type: topology
actors:
  - shop.example.com: shape-website "cart"
  - PayPal: shape-payment-provider "checkout"
  - MasterCard: shape-credit-card "credit"
flow:
  - shop.example.com -> PayPal: ""
  - PayPal -> MasterCard: ""
animation:
  - step: "1. shop.example.com" 0.75s
    focus: [shop.example.com]
  - step: "2. PayPal" 0.75s
    focus: [shop.example.com, PayPal]
  - step: "checkout" 0.75s
    focus: [shop.example.com, PayPal, MasterCard]
`;

export const sourceJson__sceneCheckout = `{
  "title": "checkout",
  "type": "topology",
  "actors": [
    { "name": "shop.example.com", "kind": "shape-website", "subtitle": "cart" },
    { "name": "PayPal", "kind": "shape-payment-provider", "subtitle": "checkout" },
    { "name": "MasterCard", "kind": "shape-credit-card", "subtitle": "credit" }
  ],
  "flow": [
    { "from": "shop.example.com", "to": "PayPal", "label": "" },
    { "from": "PayPal", "to": "MasterCard", "label": "" }
  ],
  "animation": [
    { "step": "1. shop.example.com", "duration": 0.75, "focus": ["shop.example.com"] },
    { "step": "2. PayPal", "duration": 0.75, "focus": ["shop.example.com", "PayPal"] },
    { "step": "checkout", "duration": 0.75, "focus": ["shop.example.com", "PayPal", "MasterCard"] }
  ]
}`;

export const sourceYaml__sceneEdgeCompute = `title: "edge compute"
type: topology
actors:
  - "Android app": shape-mobile-device "user"
  - "Fastly edge": shape-cdn-edge "compute@edge"
  - "GCP origin": shape-cloud "fallback"
flow:
  - "Android app" -> "Fastly edge": ""
  - "Fastly edge" -> "GCP origin": ""
animation:
  - step: "1. Android app" 0.75s
    focus: ["Android app"]
  - step: "2. Fastly edge" 0.75s
    focus: ["Android app", "Fastly edge"]
  - step: "edge compute" 0.75s
    focus: ["Android app", "Fastly edge", "GCP origin"]
`;

export const sourceJson__sceneEdgeCompute = `{
  "title": "edge compute",
  "type": "topology",
  "actors": [
    { "name": "Android app", "kind": "shape-mobile-device", "subtitle": "user" },
    { "name": "Fastly edge", "kind": "shape-cdn-edge", "subtitle": "compute@edge" },
    { "name": "GCP origin", "kind": "shape-cloud", "subtitle": "fallback" }
  ],
  "flow": [
    { "from": "Android app", "to": "Fastly edge", "label": "" },
    { "from": "Fastly edge", "to": "GCP origin", "label": "" }
  ],
  "animation": [
    { "step": "1. Android app", "duration": 0.75, "focus": ["Android app"] },
    { "step": "2. Fastly edge", "duration": 0.75, "focus": ["Android app", "Fastly edge"] },
    { "step": "edge compute", "duration": 0.75, "focus": ["Android app", "Fastly edge", "GCP origin"] }
  ]
}`;

export const sourceYaml__sceneVersionDeploy = `title: "version deploy"
type: topology
actors:
  - "release v3.2.0": shape-stack "tagged"
  - "deploy pipeline": shape-gear "canary"
  - prod.example.com: shape-website "live"
flow:
  - "release v3.2.0" -> "deploy pipeline": ""
  - "deploy pipeline" -> prod.example.com: ""
animation:
  - step: "1. release v3.2.0" 0.75s
    focus: ["release v3.2.0"]
  - step: "2. deploy pipeline" 0.75s
    focus: ["release v3.2.0", "deploy pipeline"]
  - step: "version deploy" 0.75s
    focus: ["release v3.2.0", "deploy pipeline", prod.example.com]
`;

export const sourceJson__sceneVersionDeploy = `{
  "title": "version deploy",
  "type": "topology",
  "actors": [
    { "name": "release v3.2.0", "kind": "shape-stack", "subtitle": "tagged" },
    { "name": "deploy pipeline", "kind": "shape-gear", "subtitle": "canary" },
    { "name": "prod.example.com", "kind": "shape-website", "subtitle": "live" }
  ],
  "flow": [
    { "from": "release v3.2.0", "to": "deploy pipeline", "label": "" },
    { "from": "deploy pipeline", "to": "prod.example.com", "label": "" }
  ],
  "animation": [
    { "step": "1. release v3.2.0", "duration": 0.75, "focus": ["release v3.2.0"] },
    { "step": "2. deploy pipeline", "duration": 0.75, "focus": ["release v3.2.0", "deploy pipeline"] },
    { "step": "version deploy", "duration": 0.75, "focus": ["release v3.2.0", "deploy pipeline", "prod.example.com"] }
  ]
}`;

export const sourceYaml__sceneAuditChain = `title: "audit chain"
type: topology
actors:
  - 監査法人: shape-auditor "PwC"
  - 監査報告書: shape-file "signed"
  - 金融庁: shape-regulator "受領"
flow:
  - 監査法人 -> 監査報告書: ""
  - 監査報告書 -> 金融庁: ""
animation:
  - step: "1. 監査法人" 0.75s
    focus: [監査法人]
  - step: "2. 監査報告書" 0.75s
    focus: [監査法人, 監査報告書]
  - step: "audit chain" 0.75s
    focus: [監査法人, 監査報告書, 金融庁]
`;

export const sourceJson__sceneAuditChain = `{
  "title": "audit chain",
  "type": "topology",
  "actors": [
    { "name": "監査法人", "kind": "shape-auditor", "subtitle": "PwC" },
    { "name": "監査報告書", "kind": "shape-file", "subtitle": "signed" },
    { "name": "金融庁", "kind": "shape-regulator", "subtitle": "受領" }
  ],
  "flow": [
    { "from": "監査法人", "to": "監査報告書", "label": "" },
    { "from": "監査報告書", "to": "金融庁", "label": "" }
  ],
  "animation": [
    { "step": "1. 監査法人", "duration": 0.75, "focus": ["監査法人"] },
    { "step": "2. 監査報告書", "duration": 0.75, "focus": ["監査法人", "監査報告書"] },
    { "step": "audit chain", "duration": 0.75, "focus": ["監査法人", "監査報告書", "金融庁"] }
  ]
}`;
