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
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "利用者", eyebrow: "外部主体", value: "{v} 人" })
  .phase("p", { duration: 1500, title: "actor", body: "外から関わる主体 (利用者や外部の仕組み)。 値の欄に数を出せる。" }, (p: PhaseBuilder) => p.activate("a").badge("動作中"))
  .phase("p2", { duration: 1500, title: "actor の数が動く", body: "値の欄が段の中で動く。 この欄を描くのは actor だけ。" }, (p: PhaseBuilder) => p.activate("a").tween("v", 42, 137).badge("動作中"))
  .build();

export const kindFunction = diagram("kind-function", { topic: "kind: function (関数呼び出し)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 12 })
  .node("fn", { lane: "l", stack: 0, kind: "function", title: "注文を受ける(要求)", eyebrow: "関数呼び出し", subtitle: "-> 注文か失敗 · 呼出 {v} 回" })
  .phase("p", { duration: 1500, title: "function", body: "処理を受け持つ関数。 題を等幅の字で書き、副題に戻り値を書いて署名に見せる。" }, (p: PhaseBuilder) => p.activate("fn").badge("動作中"))
  .phase("p2", { duration: 1500, title: "function の数が動く", body: "副題の呼出回数が段の中で動く。 署名の形は変えない。" }, (p: PhaseBuilder) => p.activate("fn").tween("v", 12, 480).badge("動作中"))
  .build();

export const kindStorage = diagram("kind-storage", { topic: "kind: storage (保存データ)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 1200 })
  .node("s", { lane: "l", stack: 0, kind: "storage", title: "利用者の表", eyebrow: "保存データ", rows: ["番号: 主キー", "メール: 文字列", "行数: {v}"] })
  .phase("p", { duration: 1500, title: "storage", body: "DB の表。 列を rows に 1 行ずつ書く。" }, (p: PhaseBuilder) => p.activate("s").badge("動作中"))
  .phase("p2", { duration: 1500, title: "storage の数が動く", body: "行の数が段の中で動く。 行も同じ経路で置換される。" }, (p: PhaseBuilder) => p.activate("s").tween("v", 1200, 8400).badge("動作中"))
  .build();

export const kindEvent = diagram("kind-event", { topic: "kind: event (イベントログ)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 3 })
  .node("e", { lane: "l", stack: 0, kind: "event", title: "注文ができた", eyebrow: "イベント", subtitle: "(注文, 利用者) · 毎秒 {v} 件" })
  .phase("p", { duration: 1500, title: "event", body: "発行された出来事。 出来事を配る経路や記録が読む。" }, (p: PhaseBuilder) => p.activate("e").badge("動作中"))
  .phase("p2", { duration: 1500, title: "event の数が動く", body: "副題の発生件数が段の中で動く。 中身の形は変えない。" }, (p: PhaseBuilder) => p.activate("e").tween("v", 3, 96).badge("動作中"))
  .build();

export const kindCard = diagram("kind-card", { topic: "kind: card (汎用情報)" })
  .lane("l", { x: 0, width: W })
  .state("v", { initial: 2 })
  .node("c", { lane: "l", stack: 0, kind: "card", title: "備考", eyebrow: "汎用カード", subtitle: "汎用の説明カード · {v} 件" })
  .phase("p", { duration: 1500, title: "card", body: "kind に当てはまらない補足情報。" }, (p: PhaseBuilder) => p.activate("c").badge("動作中"))
  .phase("p2", { duration: 1500, title: "card の数が動く", body: "副題の件数が段の中で動く。 説明の文は変えない。" }, (p: PhaseBuilder) => p.activate("c").tween("v", 2, 31).badge("動作中"))
  .build();

/** 2. Lane バリエーション */
export const laneSingle = diagram("lane-single", { topic: "lane: 1 本" })
  .lane("only", { x: 0, width: W })
  .node("a", { lane: "only", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "only", stack: 1, kind: "function", title: "B" })
  .phase("p", { duration: 1500, title: "1 lane", body: "1 本の lane に node を縦に積む。" }, (p: PhaseBuilder) => p.activate("a", "b").badge("正常"))
  .build();

export const laneMulti = diagram("lane-multi", { topic: "lane: 3 本 (横並び)" })
  .lane("l1", { width: 240 })
  .lane("l2", { width: 240 })
  .lane("l3", { width: 240 })
  .node("a", { lane: "l1", stack: 0, kind: "function", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .node("c", { lane: "l3", stack: 0, kind: "event", title: "C" })
  .phase("p", { duration: 1500, title: "3 lane", body: "lane を横に並べて役割を分ける (利用者 / 処理 / 出来事)。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("正常"))
  .build();

export const laneContain = diagram("lane-contain", { topic: "lane: contain (枠囲み)" })
  .lane("inner", { x: 0, width: W, contain: true })
  .node("fn", { lane: "inner", stack: 0, kind: "function", title: "内部の処理" })
  .node("st", { lane: "inner", stack: 1, kind: "storage", title: "保存先" })
  .phase("p", { duration: 1500, title: "contain", body: "lane に contain を付けると、 lane ごと枠で囲んで内と外の境を示す。" }, (p: PhaseBuilder) => p.activate("fn", "st").badge("正常"))
  .build();

/** 3. Node stack バリエーション */
export const stackPair = diagram("stack-pair", { topic: "stack: 縦 2 段" })
  .lane("l", { x: 0, width: W })
  .node("top", { lane: "l", stack: 0, kind: "actor", title: "上" })
  .node("bot", { lane: "l", stack: 1, kind: "actor", title: "下" })
  .phase("p", { duration: 1500, title: "stack 0/1", body: "同じ lane の中で、 stack の番号が縦の並びを決める。" }, (p: PhaseBuilder) => p.activate("top", "bot").badge("正常"))
  .build();

export const stackTriple = diagram("stack-triple", { topic: "stack: 縦 3 段" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "stack 0" })
  .node("b", { lane: "l", stack: 1, kind: "function", title: "stack 1" })
  .node("c", { lane: "l", stack: 2, kind: "storage", title: "stack 2" })
  .phase("p", { duration: 1500, title: "stack 0/1/2", body: "stack を増やすと縦に伸びる。 間隔は row_gap が自動で決める。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("正常"))
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
  title: "月次報告書",
  eyebrow: "ファイル",
  subtitle: "PDF · {v} MB",
  metric: { from: 2, to: 9 },
  w: 272,
  topic: "shape: file (ドッグイア rect、 ファイル / document 表現)",
  phase: { title: "shape-file", body: "右上の角を折り返した四角。 ファイルや文書、報告書を表す。" },
});
export const shapeFolder = shapeSample({
  id: "shape-folder",
  kind: "shape-folder",
  title: "設計資料/",
  eyebrow: "フォルダ",
  subtitle: "ファイル {v} 件",
  metric: { from: 24, to: 118 },
  topic: "shape: folder (tab 付き rect、 フォルダ / パッケージ)",
  phase: { title: "shape-folder", body: "上の縁につまみの付いた四角。 フォルダや、部品をまとめた単位を表す。" },
});
export const shapeCloud = shapeSample({
  id: "shape-cloud",
  kind: "shape-cloud",
  title: "AWS",
  eyebrow: "クラウド",
  subtitle: "{v} リージョン",
  metric: { from: 3, to: 12 },
  topic: "shape: cloud (5 円 合成、 クラウド / SaaS 表現)",
  phase: { title: "shape-cloud", body: "5 つの円を重ねた雲の形。 クラウドの事業者や、外から呼ぶ API を表す。" },
});
export const shapeCylinder = shapeSample({
  id: "shape-cylinder",
  kind: "shape-cylinder",
  title: "PostgreSQL",
  eyebrow: "データベース",
  subtitle: "{v} GB 使用",
  metric: { from: 120, to: 480 },
  w: 272,
  topic: "shape: cylinder (円柱、 DB / storage 表現)",
  phase: { title: "shape-cylinder", body: "円柱 (上面と側面と底の楕円)。 DB や、消えずに残る保存先を表す。" },
});
export const shapeHexagon = shapeSample({
  id: "shape-hexagon",
  kind: "shape-hexagon",
  title: "認証の役務",
  eyebrow: "部品",
  subtitle: "毎秒 {v} 件",
  metric: { from: 60, to: 940 },
  w: 294,
  topic: "shape: hexagon (六角形、 component / service)",
  phase: { title: "shape-hexagon", body: "六角形。 小さく分けた役務や、業務ごとの部品を表す。" },
});
export const shapeDiamond = shapeSample({
  id: "shape-diamond",
  kind: "shape-diamond",
  title: "正しい?",
  eyebrow: "判定",
  subtitle: "はい {v}%",
  metric: { from: 40, to: 92 },
  topic: "shape: diamond (ひし形、 decision / 判定)",
  phase: { title: "shape-diamond", body: "ひし形。 条件で道が分かれる所を表す。" },
});
export const shapeStack = shapeSample({
  id: "shape-stack",
  kind: "shape-stack",
  title: "v3.2.0",
  eyebrow: "公開版",
  subtitle: "{v} 版",
  metric: { from: 3, to: 14 },
  topic: "shape: stack (重ね rect、 layer / history)",
  phase: { title: "shape-stack", body: "3 枚重ねた四角。 版の履歴や層、ある時点の写しの束を表す。" },
});
export const shapePerson = shapeSample({
  id: "shape-person",
  kind: "shape-person",
  title: "エンドユーザ",
  eyebrow: "人物",
  subtitle: "{v} 操作",
  metric: { from: 2, to: 21 },
  topic: "shape: person (人型 figure、 actor / user 表現)",
  phase: { title: "shape-person", body: "人の形 (丸い頭と台形の胴、曲げた腕)。 登場する人や利用者、担当者を表す。" },
});

/** 4-b. Shape-driven software 6 (CAR-1111 Phase 2-B) ... OS ウィンドウ / 端末 / コード block / kanban ticket / チャット吹き出し / 歯車 */
export const shapeWindow = shapeSample({
  id: "shape-window",
  kind: "shape-window",
  title: "ダッシュボード",
  eyebrow: "アプリの画面",
  subtitle: "開いた画面 {v}",
  metric: { from: 1, to: 6 },
  topic: "shape: window (GUI アプリ、 traffic lights + body)",
  phase: { title: "shape-window", body: "題の帯と 3 色の丸ボタン、本体。 アプリの画面や、閲覧ソフトで開いた画面を表す。" },
});
// 段を付けていない (#1196)。 この種別は副題を描かない (題と目次だけを自前で描く)。
// 数を置ける欄が識別の文字しか残らず、形の見本としての説明を潰すことになる。
// cdl 側で副題を読むようにしてから動かす (cdl #469)。
export const shapeTerminal = shapeSample({
  id: "shape-terminal",
  kind: "shape-terminal",
  title: "zsh",
  eyebrow: "端末",
  subtitle: "命令を打つ画面",
  topic: "shape: terminal (CLI shell、 mac bar + prompt)",
  phase: { title: "shape-terminal", body: "上の帯と $ の入力待ち、点滅する印。 命令を打つ画面や、遠くの機械への接続、手順の自動実行を表す。" },
});
// 段を付けていない (#1196)。 この種別は副題を描かない (題と目次だけを自前で描く)。
// 数を置ける欄が識別の文字しか残らず、形の見本としての説明を潰すことになる。
// cdl 側で副題を読むようにしてから動かす (cdl #469)。
export const shapeCodeBlock = shapeSample({
  id: "shape-code-block",
  kind: "shape-code-block",
  title: "共通の処理",
  eyebrow: "コード",
  subtitle: "3 行の抜粋",
  topic: "shape: code-block (snippet、 editor tab + 4 syntax lines)",
  phase: { title: "shape-code-block", body: "編集画面の見出しと行番号の欄、色分けした 4 行。 コードの抜粋や、実装そのものを表す。" },
});
// 段を付けていない (#1196)。 この種別は副題を描かない (題と目次だけを自前で描く)。
// 数を置ける欄が識別の文字しか残らず、形の見本としての説明を潰すことになる。
// cdl 側で副題を読むようにしてから動かす (cdl #469)。
export const shapeKanbanCard = shapeSample({
  id: "shape-kanban-card",
  kind: "shape-kanban-card",
  title: "課題 #1111",
  eyebrow: "作業中",
  subtitle: "形で見せる種別",
  topic: "shape: kanban-card (ticket + priority + tags)",
  phase: { title: "shape-kanban-card", body: "優先度の帯と番号、状態の札、題、分類の札、担当者の顔。 看板に貼る作業札や課題を表す。" },
});
export const shapeMessageBubble = shapeSample({
  id: "shape-message-bubble",
  kind: "shape-message-bubble",
  title: "了解しました",
  eyebrow: "発言",
  subtitle: "未読 {v}",
  metric: { from: 0, to: 9 },
  topic: "shape: message-bubble (吹き出し、 rounded rect + tail)",
  phase: { title: "shape-message-bubble", body: "角の丸い四角と、左下のしっぽ。 会話の発言や、変更への意見、通知を表す。" },
});
export const shapeGear = shapeSample({
  id: "shape-gear",
  kind: "shape-gear",
  title: "環境設定",
  eyebrow: "構成",
  subtitle: "設定 {v} 件",
  metric: { from: 8, to: 26 },
  topic: "shape: gear (歯車、 設定 / 処理エンジン)",
  phase: { title: "shape-gear", body: "歯が 12 枚の大きな歯車と、4 本の腕、中心の軸、留め具。 設定や、処理を回す仕組みを表す。" },
});

/** 5. Shape-driven hardware 6 (CAR-1111 Phase 2-C) ... ハードウェア / IoT / エッジ領域の視覚要素 */
export const shapeServerRack = shapeSample({
  id: "shape-server-rack",
  kind: "shape-server-rack",
  title: "公開用 1 号機",
  eyebrow: "サーバ",
  subtitle: "{v} U 分を使用",
  metric: { from: 3, to: 12 },
  topic: "shape: server-rack (19 inch rack、 物理サーバ)",
  phase: { title: "shape-server-rack", body: "外枠と 3 段の差し込み口を持つ棚。 実機のサーバや、データセンター、自社に置く機器を表す。" },
});
export const shapeNetworkNode = shapeSample({
  id: "shape-network-node",
  kind: "shape-network-node",
  title: "基幹ルータ",
  eyebrow: "通信網",
  subtitle: "L3 · 接続 {v} 台",
  metric: { from: 12, to: 96 },
  topic: "shape: network-node (network hub、 router / switch)",
  phase: { title: "shape-network-node", body: "中央の円と 4 方向の線。 通信を中継する機器 (経路を選ぶもの、線を束ねるもの) を表す。" },
});
export const shapeMobileDevice = shapeSample({
  id: "shape-mobile-device",
  kind: "shape-mobile-device",
  title: "iPhone",
  eyebrow: "携帯端末",
  subtitle: "{v} 台が稼働",
  metric: { from: 200, to: 1800 },
  topic: "shape: mobile-device (スマホ、 モバイル端末)",
  phase: { title: "shape-mobile-device", body: "上の話し口と画面、下のボタンを持つスマホ。 携帯のアプリや、利用者の手元の端末を表す。" },
});
export const shapeIotSensor = shapeSample({
  id: "shape-iot-sensor",
  kind: "shape-iot-sensor",
  title: "温度センサー",
  eyebrow: "計測機器",
  subtitle: "無線 · {v} 度",
  metric: { from: 18, to: 34 },
  topic: "shape: iot-sensor (IoT beacon、 電波発信)",
  phase: { title: "shape-iot-sensor", body: "計測器の円と 3 重の波紋。 電波で知らせる計測器や、ものにつないだ端末を表す。" },
});
export const shapeRobotArm = shapeSample({
  id: "shape-robot-arm",
  kind: "shape-robot-arm",
  title: "組立ライン",
  eyebrow: "ロボット",
  subtitle: "6 軸 · {v} 個/時",
  metric: { from: 40, to: 260 },
  topic: "shape: robot-arm (ロボアーム、 産業機器)",
  phase: { title: "shape-robot-arm", body: "台座と 2 つの関節、先のつかみ手を持つ腕。 産業機器や、自動にした工程、制御する対象を表す。" },
});
export const shapeSatellite = shapeSample({
  id: "shape-satellite",
  kind: "shape-satellite",
  title: "Starlink",
  eyebrow: "人工衛星",
  subtitle: "低軌道 · 高度 {v} km",
  metric: { from: 340, to: 550 },
  topic: "shape: satellite (人工衛星、 エッジ通信)",
  phase: { title: "shape-satellite", body: "中央の本体と左右の太陽電池板、アンテナ。 人工衛星や、宇宙を経由する通信を表す。" },
});

/** 6. Shape-driven blockchain / web3 6 (CAR-1111 Phase 2-D) ... Solidity / EVM 系開発主体 */
export const shapeSmartContract = shapeSample({
  id: "shape-smart-contract",
  kind: "shape-smart-contract",
  title: "預かり契約",
  eyebrow: "契約",
  subtitle: "0.8.24 · 呼出 {v}",
  metric: { from: 12, to: 480 },
  topic: "shape: smart-contract (契約書 + 歯車 = 自動実行)",
  phase: { title: "shape-smart-contract", body: "文書と、底の歯車 (自動で動く印)。 自動で動く契約や、参加者で決める組織の規約、条件付きの預かりを表す。" },
});
// 段を付けていない (#1196)。 この種別は絵の文字を自前で固定していて、書き手が渡した
// 題 / 副題 / 目次 を 1 つも読まない。 副題に数を置いても変わるのは見えない控えの欄だけ。
// cdl 側の別 Issue (cdl #469) で種別が値を読むようにしてから動かす。
export const shapeBlockchainBlock = shapeSample({
  id: "shape-blockchain-block",
  kind: "shape-blockchain-block",
  title: "ブロック #421",
  eyebrow: "台帳",
  subtitle: "0xaf31c9d2...",
  topic: "shape: blockchain-block (連結 3 block + hash pointer)",
  phase: { title: "shape-blockchain-block", body: "3 つのブロックを縦につなぎ、前のブロックの要約値と取引の数を持たせた形。 Ethereum や Bitcoin のブロックを表す。" },
});
export const shapeRpcNode = shapeSample({
  id: "shape-rpc-node",
  kind: "shape-rpc-node",
  title: "Alchemy",
  eyebrow: "RPC の窓口",
  subtitle: "本番の網 · 毎秒 {v} 件",
  metric: { from: 90, to: 1200 },
  topic: "shape: rpc-node (JSON-RPC node + 6 peers + sync bar)",
  phase: { title: "shape-rpc-node", body: "中央の球と周りの 6 つの点、同期の帯。 分散台帳へ問い合わせる窓口を貸す事業者を表す。" },
});
export const shapeWallet = shapeSample({
  id: "shape-wallet",
  kind: "shape-wallet",
  title: "MetaMask",
  eyebrow: "財布",
  subtitle: "個人の口座 · 残高 {v} ETH",
  metric: { from: 1, to: 12 },
  topic: "shape: wallet (財布 + coin + balance display)",
  phase: { title: "shape-wallet", body: "財布と差し込んだ硬貨、残高。 閲覧ソフトの財布や、鍵を持ち歩く機器、契約でできた財布を表す。" },
});
export const shapeNft = shapeSample({
  id: "shape-nft",
  kind: "shape-nft",
  title: "CryptoPunk",
  eyebrow: "NFT",
  subtitle: "ERC-721 · {v} ETH",
  metric: { from: 3, to: 28 },
  w: 272,
  topic: "shape: nft (額縁 + polygonal art + verified badge)",
  phase: { title: "shape-nft", body: "額縁と角ばった絵、本物の印。 ERC-721 の作品や、譲れない証明、作品の集まりを表す。" },
});
export const shapeToken = shapeSample({
  id: "shape-token",
  kind: "shape-token",
  title: "ETH",
  eyebrow: "通貨",
  subtitle: "ERC-20 · {v} ドル",
  metric: { from: 2100, to: 3400 },
  topic: "shape: token (硬貨、 fungible currency)",
  phase: { title: "shape-token", body: "硬貨と通貨の記号 Ξ、光。 ERC-20 の通貨や、台帳そのものの通貨、値を固定した通貨を表す。" },
});

/** 7. Shape-driven finance 6 (CAR-1111 Phase 2-D) ... 銀行 / 決済 / 信託 / 取引所主体 */
export const shapeBank = shapeSample({
  id: "shape-bank",
  kind: "shape-bank",
  title: "みずほ銀行",
  eyebrow: "銀行",
  subtitle: "都銀 · 預金 {v} 兆円",
  metric: { from: 90, to: 142 },
  topic: "shape: bank (Greek facade + 4 columns + $)",
  phase: { title: "shape-bank", body: "神殿風の正面 (三角の屋根と柱と土台)。 都市銀行や地方銀行、銀行の本店を表す。" },
});
export const shapeTrustBank = shapeSample({
  id: "shape-trust-bank",
  kind: "shape-trust-bank",
  title: "三菱 UFJ 信託",
  eyebrow: "信託銀行",
  subtitle: "受託 {v} 兆円",
  metric: { from: 40, to: 88 },
  topic: "shape: trust-bank (bank facade + 冠 crown = 受託の信頼)",
  phase: { title: "shape-trust-bank", body: "冠と正面の柱、T の印。 信託銀行や、預かって運用する業務、資産の管理を表す。" },
});
export const shapePaymentProvider = shapeSample({
  id: "shape-payment-provider",
  kind: "shape-payment-provider",
  title: "Stripe",
  eyebrow: "決済",
  subtitle: "決済 {v} 件/s",
  metric: { from: 30, to: 420 },
  topic: "shape: payment-provider (POS 端末 + screen + keypad)",
  phase: { title: "shape-payment-provider", body: "支払いの端末と承認の表示、数字の鍵盤。 決済の代行業者や、電子決済の取次を表す。" },
});
export const shapeBrokerage = shapeSample({
  id: "shape-brokerage",
  kind: "shape-brokerage",
  title: "野村證券",
  eyebrow: "証券",
  subtitle: "約定 {v} 件",
  metric: { from: 120, to: 940 },
  topic: "shape: brokerage (証券会社 tower + candle chart + up arrow)",
  phase: { title: "shape-brokerage", body: "高い建物と格子の窓、ろうそく足の図、上向きの矢印。 証券会社や投資銀行を表す。" },
});
export const shapeExchange = shapeSample({
  id: "shape-exchange",
  kind: "shape-exchange",
  title: "Coinbase",
  eyebrow: "取引所",
  subtitle: "出来高 {v} 億",
  metric: { from: 12, to: 86 },
  topic: "shape: exchange (取引所、 $ ⇄ Ξ swap)",
  phase: { title: "shape-exchange", body: "2 つの通貨の硬貨と両向きの矢印、交換の比率。 取引所や、仲介なしで交換する場、両替を表す。" },
});
export const shapeAtm = shapeSample({
  id: "shape-atm",
  kind: "shape-atm",
  title: "ATM",
  eyebrow: "現金の窓口",
  subtitle: "24 時間 · {v} 件/日",
  metric: { from: 180, to: 620 },
  topic: "shape: atm (現金自動預払機、 card slot + cash dispenser)",
  phase: { title: "shape-atm", body: "画面とボタン、カードの差し込み口、お金の出口。 銀行やコンビニの ATM を表す。" },
});

/** 8. Shape-driven commerce / web 6 (CAR-1111 Phase 2-D) ... web / EC / インフラ主体 */
export const shapeWebsite = shapeSample({
  id: "shape-website",
  kind: "shape-website",
  title: "会社案内",
  eyebrow: "サイト",
  subtitle: "閲覧 {v} 回/日",
  metric: { from: 1200, to: 8600 },
  topic: "shape: website (browser + URL + page layout)",
  phase: { title: "shape-website", body: "閲覧ソフトの枠と住所の欄、見出し、2 列の本文。 会社の案内や製品の紹介、日記のようなサイトを表す。" },
});
export const shapeStorefront = shapeSample({
  id: "shape-storefront",
  kind: "shape-storefront",
  title: "コンビニ",
  eyebrow: "店舗",
  subtitle: "来店 {v} 人/日",
  metric: { from: 240, to: 810 },
  topic: "shape: storefront (実店舗、 awning + door + windows)",
  phase: { title: "shape-storefront", body: "赤と白の日よけ、営業中の札、扉、窓。 実際の店や小売を表す。" },
});
export const shapeWarehouse = shapeSample({
  id: "shape-warehouse",
  kind: "shape-warehouse",
  title: "市川倉庫",
  eyebrow: "物流拠点",
  subtitle: "在庫 {v} 千点",
  metric: { from: 12, to: 48 },
  topic: "shape: warehouse (倉庫、 roof + shutter + boxes)",
  phase: { title: "shape-warehouse", body: "屋根と巻き上げの扉、積んだ箱。 出荷を受け持つ拠点や倉庫を表す。" },
});
export const shapeOnlineShop = shapeSample({
  id: "shape-online-shop",
  kind: "shape-online-shop",
  title: "Amazon",
  eyebrow: "通販",
  subtitle: "注文 {v} 件/分",
  metric: { from: 6, to: 74 },
  topic: "shape: online-shop (browser + cart badge + product grid)",
  phase: { title: "shape-online-shop", body: "閲覧ソフトの枠と、かごの数 (3)、6 つの商品の並び。 通販やネットの販売を表す。" },
});
export const shapeCdnEdge = shapeSample({
  id: "shape-cdn-edge",
  kind: "shape-cdn-edge",
  title: "Cloudflare",
  eyebrow: "配信網",
  subtitle: "拠点 {v} か所",
  metric: { from: 300, to: 380 },
  topic: "shape: cdn-edge (地球儀 + 5 edge nodes + arc)",
  phase: { title: "shape-cdn-edge", body: "地球儀と 5 つの拠点、点線のつながり。 配信網の事業者や、利用者の近くで返す網を表す。" },
});
export const shapeApiGateway = shapeSample({
  id: "shape-api-gateway",
  kind: "shape-api-gateway",
  title: "Kong",
  eyebrow: "API の入口",
  subtitle: "毎秒 {v} 件",
  metric: { from: 400, to: 3200 },
  topic: "shape: api-gateway (門柱 + arch + traffic arrow)",
  phase: { title: "shape-api-gateway", body: "2 本の柱と弧、API の字、行き交う矢印。 API の入口に立つ門番を表す。" },
});

/** 9. Shape-driven people 6 (CAR-1111 Phase 2-D) ... 職種別 person 型 */
export const shapeAuditor = shapeSample({
  id: "shape-auditor",
  kind: "shape-auditor",
  title: "監査法人",
  eyebrow: "監査",
  subtitle: "指摘 {v} 件",
  metric: { from: 2, to: 17 },
  topic: "shape: auditor (監査人 + magnifier + check)",
  phase: { title: "shape-auditor", body: "人とネクタイ、虫眼鏡、確認の印。 監査人や公認会計士、内部の監査を表す。" },
});
export const shapeRegulator = shapeSample({
  id: "shape-regulator",
  kind: "shape-regulator",
  title: "金融庁",
  eyebrow: "規制当局",
  subtitle: "検査 {v} 件",
  metric: { from: 4, to: 23 },
  topic: "shape: regulator (規制当局 + 冠 crown + 章 badge)",
  phase: { title: "shape-regulator", body: "人と冠、五芒星の記章。 金融庁や消費者庁のような規制の当局を表す。" },
});
export const shapeNotary = shapeSample({
  id: "shape-notary",
  kind: "shape-notary",
  title: "公証役場",
  eyebrow: "公証",
  subtitle: "認証 {v} 件",
  metric: { from: 6, to: 31 },
  topic: "shape: notary (公証人 + 儒学者風 hat + seal 印)",
  phase: { title: "shape-notary", body: "人と儒学者風の帽子、赤い印。 公証人や、書類が正しいと認める業務を表す。" },
});
export const shapeLawyer = shapeSample({
  id: "shape-lawyer",
  kind: "shape-lawyer",
  title: "顧問弁護士",
  eyebrow: "法務",
  subtitle: "案件 {v} 件",
  metric: { from: 3, to: 19 },
  topic: "shape: lawyer (弁護士 + wig + 天秤)",
  phase: { title: "shape-lawyer", body: "人と髪、正義の天秤の印。 弁護士や法務の顧問、法律事務所を表す。" },
});
export const shapeTrader = shapeSample({
  id: "shape-trader",
  kind: "shape-trader",
  title: "デイトレーダー",
  eyebrow: "売買",
  subtitle: "約定 {v} 回",
  metric: { from: 8, to: 152 },
  topic: "shape: trader (トレーダー + headset + laptop chart)",
  phase: { title: "shape-trader", body: "人とヘッドセット、値動きの映るパソコン。 トレーダーや、値付けを受け持つ業者、機械の自動発注を表す。" },
});
export const shapeCustomerService = shapeSample({
  id: "shape-customer-service",
  kind: "shape-customer-service",
  title: "サポート担当",
  eyebrow: "問い合わせ",
  subtitle: "対応 {v} 件",
  metric: { from: 14, to: 88 },
  topic: "shape: customer-service (CS + headset + bubble)",
  phase: { title: "shape-customer-service", body: "人とヘッドセット、吹き出し、名札。 お客様の窓口やコールセンターを表す。" },
});

/** 10. Phase 2-D 追加分 (blockchain 4 新 + credit-card 分離) */
export const shapeBlockchain = shapeSample({
  id: "shape-blockchain",
  kind: "shape-blockchain",
  title: "ブロックチェーン",
  eyebrow: "台帳",
  subtitle: "{v} ブロック",
  metric: { from: 5, to: 42 },
  topic: "shape: blockchain (5 block linked chain)",
  phase: { title: "shape-blockchain", body: "5 つのブロックを、前の要約値を指す形で横につなぐ。 分散台帳の一般の形を表す。" },
});
export const shapeBitcoinChain = shapeSample({
  id: "shape-bitcoin-chain",
  kind: "shape-bitcoin-chain",
  title: "Bitcoin",
  eyebrow: "分散台帳",
  subtitle: "ブロック高 {v} 万",
  metric: { from: 84, to: 89 },
  topic: "shape: bitcoin-chain (₿ + PoW + 橙色)",
  phase: { title: "shape-bitcoin-chain", body: "橙の色と ₿ の記号、計算の量で合意する採掘。 Bitcoin の本番の網や、試しの網を表す。" },
});
export const shapeEthereumChain = shapeSample({
  id: "shape-ethereum-chain",
  kind: "shape-ethereum-chain",
  title: "Ethereum",
  eyebrow: "分散台帳",
  subtitle: "{v} 万ブロック",
  metric: { from: 2000, to: 2400 },
  topic: "shape: ethereum-chain (Ξ + PoS + 紫色)",
  phase: { title: "shape-ethereum-chain", body: "紫の色と Ξ の記号、預けた量で合意する検証役。 Ethereum の本番の網や、その上に重ねた網を表す。" },
});
export const shapeBlockchainNode = shapeSample({
  id: "shape-blockchain-node",
  kind: "shape-blockchain-node",
  title: "フルノード",
  eyebrow: "参加者",
  subtitle: "直接つながる相手 {v} 台",
  metric: { from: 8, to: 64 },
  topic: "shape: blockchain-node (P2P hex + 6 peers)",
  phase: { title: "shape-blockchain-node", body: "中央の六角形と周りの 6 つの六角形、積んだブロックの印。 分散台帳の参加者 (全記録を持つもの、過去の状態まで持つもの、最小限だけ持つもの) を表す。" },
});
export const shapeCreditCard = shapeSample({
  id: "shape-credit-card",
  kind: "shape-credit-card",
  title: "クレカ",
  eyebrow: "カード",
  subtitle: "利用額 {v} 万円",
  metric: { from: 3, to: 18 },
  topic: "shape: credit-card (chip + magstripe + brand mark)",
  phase: { title: "shape-credit-card", body: "金色の端子と非接触の波、番号、名義、有効期限、ブランドの印。 実物のクレジットカードを表す。" },
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

export const sourceYaml__sceneCryptoTransfer = `title: "scene: crypto 送金 (wallet → exchange → chain)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 送金者: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "wallet", subtitle: "MetaMask EOA" }
  - DEX: { kind: shape-exchange, lane: l, stack: 1, eyebrow: "exchange", subtitle: "clearing" }
  - Ethereum: { kind: shape-ethereum-chain, lane: l, stack: 2, eyebrow: "chain", subtitle: "L1 mainnet" }

flow:
  - 送金者 -> DEX: "" (accent)
  - DEX -> Ethereum: "" (accent)

animation:
  - step: "1. 送金者" 0.75s
    focus: ["送金者"]
    badge: "wallet"
    description: "MetaMask EOA"
  - step: "2. DEX" 0.75s
    focus: ["送金者", "DEX"]
    badge: "exchange"
    description: "clearing"
  - step: "crypto 送金" 0.75s
    focus: ["送金者", "DEX", "Ethereum"]
    badge: "chain"
    description: "wallet が exchange に order を送り、 exchange が chain に settle。 EOA → DEX → L1 の 3-stage scene"
`;

export const sourceJson__sceneCryptoTransfer = `{
  "title": "scene: crypto 送金 (wallet → exchange → chain)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "送金者",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "wallet",
      "subtitle": "MetaMask EOA"
    },
    {
      "name": "DEX",
      "kind": "shape-exchange",
      "lane": "l",
      "stack": 1,
      "eyebrow": "exchange",
      "subtitle": "clearing"
    },
    {
      "name": "Ethereum",
      "kind": "shape-ethereum-chain",
      "lane": "l",
      "stack": 2,
      "eyebrow": "chain",
      "subtitle": "L1 mainnet"
    }
  ],
  "flow": [
    { "from": "送金者", "to": "DEX", "label": "", "tone": "accent" },
    { "from": "DEX", "to": "Ethereum", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 送金者",
      "duration": 0.75,
      "focus": ["送金者"],
      "badge": "wallet",
      "body": "MetaMask EOA"
    },
    {
      "step": "2. DEX",
      "duration": 0.75,
      "focus": ["送金者", "DEX"],
      "badge": "exchange",
      "body": "clearing"
    },
    {
      "step": "crypto 送金",
      "duration": 0.75,
      "focus": ["送金者", "DEX", "Ethereum"],
      "badge": "chain",
      "body": "wallet が exchange に order を送り、 exchange が chain に settle。 EOA → DEX → L1 の 3-stage scene"
    }
  ]
}`;

export const sourceYaml__sceneLegalNotarization = `title: "scene: 法務 (弁護士 → 公証人 → 登記)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 代理人: { kind: shape-lawyer, lane: l, stack: 0, eyebrow: "lawyer", subtitle: "起草" }
  - 公証役場: { kind: shape-notary, lane: l, stack: 1, eyebrow: "notary", subtitle: "認証" }
  - 登記簿: { kind: shape-file, lane: l, stack: 2, eyebrow: "record", subtitle: "official record" }

flow:
  - 代理人 -> 公証役場: "" (accent)
  - 公証役場 -> 登記簿: "" (accent)

animation:
  - step: "1. 代理人" 0.75s
    focus: ["代理人"]
    badge: "lawyer"
    description: "起草"
  - step: "2. 公証役場" 0.75s
    focus: ["代理人", "公証役場"]
    badge: "notary"
    description: "認証"
  - step: "法務 flow" 0.75s
    focus: ["代理人", "公証役場", "登記簿"]
    badge: "record"
    description: "弁護士 起草 → 公証人 認証 → 登記簿 記録。 契約 / 遺言 / 不動産譲渡 の formal flow"
`;

export const sourceJson__sceneLegalNotarization = `{
  "title": "scene: 法務 (弁護士 → 公証人 → 登記)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "代理人",
      "kind": "shape-lawyer",
      "lane": "l",
      "stack": 0,
      "eyebrow": "lawyer",
      "subtitle": "起草"
    },
    {
      "name": "公証役場",
      "kind": "shape-notary",
      "lane": "l",
      "stack": 1,
      "eyebrow": "notary",
      "subtitle": "認証"
    },
    {
      "name": "登記簿",
      "kind": "shape-file",
      "lane": "l",
      "stack": 2,
      "eyebrow": "record",
      "subtitle": "official record"
    }
  ],
  "flow": [
    { "from": "代理人", "to": "公証役場", "label": "", "tone": "accent" },
    { "from": "公証役場", "to": "登記簿", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. 代理人", "duration": 0.75, "focus": ["代理人"], "badge": "lawyer", "body": "起草" },
    {
      "step": "2. 公証役場",
      "duration": 0.75,
      "focus": ["代理人", "公証役場"],
      "badge": "notary",
      "body": "認証"
    },
    {
      "step": "法務 flow",
      "duration": 0.75,
      "focus": ["代理人", "公証役場", "登記簿"],
      "badge": "record",
      "body": "弁護士 起草 → 公証人 認証 → 登記簿 記録。 契約 / 遺言 / 不動産譲渡 の formal flow"
    }
  ]
}`;

export const sourceYaml__sceneNftMint = `title: "scene: NFT mint (wallet → contract → NFT)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - creator: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "wallet", subtitle: "artist" }
  - ERC-721: { kind: shape-smart-contract, lane: l, stack: 1, eyebrow: "contract", subtitle: "OpenSea" }
  - Rare Punk: { kind: shape-nft, lane: l, stack: 2, eyebrow: "nft", subtitle: "#42" }

flow:
  - creator -> ERC-721: "" (accent)
  - ERC-721 -> Rare Punk: "" (accent)

animation:
  - step: "1. creator" 0.75s
    focus: ["creator"]
    badge: "wallet"
    description: "artist"
  - step: "2. ERC-721" 0.75s
    focus: ["creator", "ERC-721"]
    badge: "contract"
    description: "OpenSea"
  - step: "NFT mint" 0.75s
    focus: ["creator", "ERC-721", "Rare Punk"]
    badge: "nft"
    description: "wallet → ERC-721 contract 呼出 → NFT 発行。 minting の canonical 3-stage flow"
`;

export const sourceJson__sceneNftMint = `{
  "title": "scene: NFT mint (wallet → contract → NFT)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "creator",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "wallet",
      "subtitle": "artist"
    },
    {
      "name": "ERC-721",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 1,
      "eyebrow": "contract",
      "subtitle": "OpenSea"
    },
    {
      "name": "Rare Punk",
      "kind": "shape-nft",
      "lane": "l",
      "stack": 2,
      "eyebrow": "nft",
      "subtitle": "#42"
    }
  ],
  "flow": [
    { "from": "creator", "to": "ERC-721", "label": "", "tone": "accent" },
    { "from": "ERC-721", "to": "Rare Punk", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. creator",
      "duration": 0.75,
      "focus": ["creator"],
      "badge": "wallet",
      "body": "artist"
    },
    {
      "step": "2. ERC-721",
      "duration": 0.75,
      "focus": ["creator", "ERC-721"],
      "badge": "contract",
      "body": "OpenSea"
    },
    {
      "step": "NFT mint",
      "duration": 0.75,
      "focus": ["creator", "ERC-721", "Rare Punk"],
      "badge": "nft",
      "body": "wallet → ERC-721 contract 呼出 → NFT 発行。 minting の canonical 3-stage flow"
    }
  ]
}`;

export const sourceYaml__sceneBankingFlow = `title: "scene: 銀行送金 (ATM → 銀行 → EC)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - ATM: { kind: shape-atm, lane: l, stack: 0, eyebrow: "atm", subtitle: "cash 出金" }
  - みずほ銀行: { kind: shape-bank, lane: l, stack: 1, eyebrow: "bank", subtitle: "都銀" }
  - Amazon: { kind: shape-online-shop, lane: l, stack: 2, eyebrow: "shop", subtitle: "EC" }

flow:
  - ATM -> みずほ銀行: "" (accent)
  - みずほ銀行 -> Amazon: "" (accent)

animation:
  - step: "1. ATM" 0.75s
    focus: ["ATM"]
    badge: "atm"
    description: "cash 出金"
  - step: "2. みずほ銀行" 0.75s
    focus: ["ATM", "みずほ銀行"]
    badge: "bank"
    description: "都銀"
  - step: "銀行 flow" 0.75s
    focus: ["ATM", "みずほ銀行", "Amazon"]
    badge: "shop"
    description: "ATM 出金 → 銀行 口座 → EC 支払い。 日常の消費者送金 flow"
`;

export const sourceJson__sceneBankingFlow = `{
  "title": "scene: 銀行送金 (ATM → 銀行 → EC)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ATM",
      "kind": "shape-atm",
      "lane": "l",
      "stack": 0,
      "eyebrow": "atm",
      "subtitle": "cash 出金"
    },
    {
      "name": "みずほ銀行",
      "kind": "shape-bank",
      "lane": "l",
      "stack": 1,
      "eyebrow": "bank",
      "subtitle": "都銀"
    },
    {
      "name": "Amazon",
      "kind": "shape-online-shop",
      "lane": "l",
      "stack": 2,
      "eyebrow": "shop",
      "subtitle": "EC"
    }
  ],
  "flow": [
    { "from": "ATM", "to": "みずほ銀行", "label": "", "tone": "accent" },
    { "from": "みずほ銀行", "to": "Amazon", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. ATM", "duration": 0.75, "focus": ["ATM"], "badge": "atm", "body": "cash 出金" },
    {
      "step": "2. みずほ銀行",
      "duration": 0.75,
      "focus": ["ATM", "みずほ銀行"],
      "badge": "bank",
      "body": "都銀"
    },
    {
      "step": "銀行 flow",
      "duration": 0.75,
      "focus": ["ATM", "みずほ銀行", "Amazon"],
      "badge": "shop",
      "body": "ATM 出金 → 銀行 口座 → EC 支払い。 日常の消費者送金 flow"
    }
  ]
}`;

export const sourceYaml__sceneIotOnchain = `title: "scene: IoT オンチェーン (sensor → RPC → contract)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 温度計: { kind: shape-iot-sensor, lane: l, stack: 0, eyebrow: "sensor", subtitle: "BLE" }
  - Infura: { kind: shape-rpc-node, lane: l, stack: 1, eyebrow: "rpc", subtitle: "provider" }
  - OracleContract: { kind: shape-smart-contract, lane: l, stack: 2, eyebrow: "contract", subtitle: "Solidity", posW: 360 }

flow:
  - 温度計 -> Infura: "" (accent)
  - Infura -> OracleContract: "" (accent)

animation:
  - step: "1. 温度計" 0.75s
    focus: ["温度計"]
    badge: "sensor"
    description: "BLE"
  - step: "2. Infura" 0.75s
    focus: ["温度計", "Infura"]
    badge: "rpc"
    description: "provider"
  - step: "IoT オンチェーン" 0.75s
    focus: ["温度計", "Infura", "OracleContract"]
    badge: "contract"
    description: "IoT センサー → RPC → smart contract。 real-world data を Chainlink Oracle 経由で on-chain 記録"
`;

export const sourceJson__sceneIotOnchain = `{
  "title": "scene: IoT オンチェーン (sensor → RPC → contract)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "温度計",
      "kind": "shape-iot-sensor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "sensor",
      "subtitle": "BLE"
    },
    {
      "name": "Infura",
      "kind": "shape-rpc-node",
      "lane": "l",
      "stack": 1,
      "eyebrow": "rpc",
      "subtitle": "provider"
    },
    {
      "name": "OracleContract",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 2,
      "eyebrow": "contract",
      "subtitle": "Solidity",
      "posW": 360
    }
  ],
  "flow": [
    { "from": "温度計", "to": "Infura", "label": "", "tone": "accent" },
    { "from": "Infura", "to": "OracleContract", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. 温度計", "duration": 0.75, "focus": ["温度計"], "badge": "sensor", "body": "BLE" },
    {
      "step": "2. Infura",
      "duration": 0.75,
      "focus": ["温度計", "Infura"],
      "badge": "rpc",
      "body": "provider"
    },
    {
      "step": "IoT オンチェーン",
      "duration": 0.75,
      "focus": ["温度計", "Infura", "OracleContract"],
      "badge": "contract",
      "body": "IoT センサー → RPC → smart contract。 real-world data を Chainlink Oracle 経由で on-chain 記録"
    }
  ]
}`;

export const sourceYaml__sceneAuditFlow = `title: "scene: 監査 (auditor → 帳簿 → regulator)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 監査法人: { kind: shape-auditor, lane: l, stack: 0, eyebrow: "auditor", subtitle: "検査" }
  - 会計帳簿: { kind: shape-file, lane: l, stack: 1, eyebrow: "record", subtitle: "ledger" }
  - 金融庁: { kind: shape-regulator, lane: l, stack: 2, eyebrow: "regulator", subtitle: "監督" }

flow:
  - 監査法人 -> 会計帳簿: "" (accent)
  - 会計帳簿 -> 金融庁: "" (accent)

animation:
  - step: "1. 監査法人" 0.75s
    focus: ["監査法人"]
    badge: "auditor"
    description: "検査"
  - step: "2. 会計帳簿" 0.75s
    focus: ["監査法人", "会計帳簿"]
    badge: "record"
    description: "ledger"
  - step: "監査 flow" 0.75s
    focus: ["監査法人", "会計帳簿", "金融庁"]
    badge: "regulator"
    description: "監査法人 → 帳簿 検証 → 規制当局 報告。 上場企業 財務監査の 3-stage flow"
`;

export const sourceJson__sceneAuditFlow = `{
  "title": "scene: 監査 (auditor → 帳簿 → regulator)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "監査法人",
      "kind": "shape-auditor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "auditor",
      "subtitle": "検査"
    },
    {
      "name": "会計帳簿",
      "kind": "shape-file",
      "lane": "l",
      "stack": 1,
      "eyebrow": "record",
      "subtitle": "ledger"
    },
    {
      "name": "金融庁",
      "kind": "shape-regulator",
      "lane": "l",
      "stack": 2,
      "eyebrow": "regulator",
      "subtitle": "監督"
    }
  ],
  "flow": [
    { "from": "監査法人", "to": "会計帳簿", "label": "", "tone": "accent" },
    { "from": "会計帳簿", "to": "金融庁", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. 監査法人", "duration": 0.75, "focus": ["監査法人"], "badge": "auditor", "body": "検査" },
    {
      "step": "2. 会計帳簿",
      "duration": 0.75,
      "focus": ["監査法人", "会計帳簿"],
      "badge": "record",
      "body": "ledger"
    },
    {
      "step": "監査 flow",
      "duration": 0.75,
      "focus": ["監査法人", "会計帳簿", "金融庁"],
      "badge": "regulator",
      "body": "監査法人 → 帳簿 検証 → 規制当局 報告。 上場企業 財務監査の 3-stage flow"
    }
  ]
}`;

export const sourceYaml__sceneStockTrading = `title: "scene: 証券取引 (trader → 証券会社 → 取引所)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 個人投資家: { kind: shape-trader, lane: l, stack: 0, eyebrow: "trader", subtitle: "retail" }
  - 野村証券: { kind: shape-brokerage, lane: l, stack: 1, eyebrow: "broker", subtitle: "投資銀行" }
  - 東証: { kind: shape-exchange, lane: l, stack: 2, eyebrow: "exchange", subtitle: "TSE" }

flow:
  - 個人投資家 -> 野村証券: "" (accent)
  - 野村証券 -> 東証: "" (accent)

animation:
  - step: "1. 個人投資家" 0.75s
    focus: ["個人投資家"]
    badge: "trader"
    description: "retail"
  - step: "2. 野村証券" 0.75s
    focus: ["個人投資家", "野村証券"]
    badge: "broker"
    description: "投資銀行"
  - step: "証券取引" 0.75s
    focus: ["個人投資家", "野村証券", "東証"]
    badge: "exchange"
    description: "トレーダー → 証券会社 発注 → 取引所 約定。 株式売買の 3-stage scene"
`;

export const sourceJson__sceneStockTrading = `{
  "title": "scene: 証券取引 (trader → 証券会社 → 取引所)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "個人投資家",
      "kind": "shape-trader",
      "lane": "l",
      "stack": 0,
      "eyebrow": "trader",
      "subtitle": "retail"
    },
    {
      "name": "野村証券",
      "kind": "shape-brokerage",
      "lane": "l",
      "stack": 1,
      "eyebrow": "broker",
      "subtitle": "投資銀行"
    },
    {
      "name": "東証",
      "kind": "shape-exchange",
      "lane": "l",
      "stack": 2,
      "eyebrow": "exchange",
      "subtitle": "TSE"
    }
  ],
  "flow": [
    { "from": "個人投資家", "to": "野村証券", "label": "", "tone": "accent" },
    { "from": "野村証券", "to": "東証", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 個人投資家",
      "duration": 0.75,
      "focus": ["個人投資家"],
      "badge": "trader",
      "body": "retail"
    },
    {
      "step": "2. 野村証券",
      "duration": 0.75,
      "focus": ["個人投資家", "野村証券"],
      "badge": "broker",
      "body": "投資銀行"
    },
    {
      "step": "証券取引",
      "duration": 0.75,
      "focus": ["個人投資家", "野村証券", "東証"],
      "badge": "exchange",
      "body": "トレーダー → 証券会社 発注 → 取引所 約定。 株式売買の 3-stage scene"
    }
  ]
}`;

export const sourceYaml__sceneSupportFlow = `title: "scene: 問い合わせ (CS → ticket → 開発)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - サポート担当: { kind: shape-customer-service, lane: l, stack: 0, eyebrow: "support", subtitle: "24H 対応" }
  - BUG-1234: { kind: shape-kanban-card, lane: l, stack: 1, eyebrow: "ticket", subtitle: "Linear" }
  - hotfix.ts: { kind: shape-code-block, lane: l, stack: 2, eyebrow: "commit", subtitle: "fix by dev" }

flow:
  - サポート担当 -> BUG-1234: "" (accent)
  - BUG-1234 -> hotfix.ts: "" (accent)

animation:
  - step: "1. サポート担当" 0.75s
    focus: ["サポート担当"]
    badge: "support"
    description: "24H 対応"
  - step: "2. BUG-1234" 0.75s
    focus: ["サポート担当", "BUG-1234"]
    badge: "ticket"
    description: "Linear"
  - step: "問い合わせ flow" 0.75s
    focus: ["サポート担当", "BUG-1234", "hotfix.ts"]
    badge: "commit"
    description: "CS 受電 → Ticket 起票 → 開発 hotfix。 一般 SaaS の bug report → fix の 3-stage flow"
`;

export const sourceJson__sceneSupportFlow = `{
  "title": "scene: 問い合わせ (CS → ticket → 開発)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "サポート担当",
      "kind": "shape-customer-service",
      "lane": "l",
      "stack": 0,
      "eyebrow": "support",
      "subtitle": "24H 対応"
    },
    {
      "name": "BUG-1234",
      "kind": "shape-kanban-card",
      "lane": "l",
      "stack": 1,
      "eyebrow": "ticket",
      "subtitle": "Linear"
    },
    {
      "name": "hotfix.ts",
      "kind": "shape-code-block",
      "lane": "l",
      "stack": 2,
      "eyebrow": "commit",
      "subtitle": "fix by dev"
    }
  ],
  "flow": [
    { "from": "サポート担当", "to": "BUG-1234", "label": "", "tone": "accent" },
    { "from": "BUG-1234", "to": "hotfix.ts", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. サポート担当",
      "duration": 0.75,
      "focus": ["サポート担当"],
      "badge": "support",
      "body": "24H 対応"
    },
    {
      "step": "2. BUG-1234",
      "duration": 0.75,
      "focus": ["サポート担当", "BUG-1234"],
      "badge": "ticket",
      "body": "Linear"
    },
    {
      "step": "問い合わせ flow",
      "duration": 0.75,
      "focus": ["サポート担当", "BUG-1234", "hotfix.ts"],
      "badge": "commit",
      "body": "CS 受電 → Ticket 起票 → 開発 hotfix。 一般 SaaS の bug report → fix の 3-stage flow"
    }
  ]
}`;

export const sourceYaml__scenePaymentSettlement = `title: "scene: 決済 (provider → クレカ → 銀行)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - Stripe: { kind: shape-payment-provider, lane: l, stack: 0, eyebrow: "provider", subtitle: "SaaS" }
  - VISA: { kind: shape-credit-card, lane: l, stack: 1, eyebrow: "card", subtitle: "credit" }
  - 発行銀行: { kind: shape-bank, lane: l, stack: 2, eyebrow: "issuer", subtitle: "MUFG" }

flow:
  - Stripe -> VISA: "" (accent)
  - VISA -> 発行銀行: "" (accent)

animation:
  - step: "1. Stripe" 0.75s
    focus: ["Stripe"]
    badge: "provider"
    description: "SaaS"
  - step: "2. VISA" 0.75s
    focus: ["Stripe", "VISA"]
    badge: "card"
    description: "credit"
  - step: "決済 flow" 0.75s
    focus: ["Stripe", "VISA", "発行銀行"]
    badge: "issuer"
    description: "Stripe → クレカ authorization → 発行銀行 決済。 EC 決済の card processing 3-stage flow"
`;

export const sourceJson__scenePaymentSettlement = `{
  "title": "scene: 決済 (provider → クレカ → 銀行)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Stripe",
      "kind": "shape-payment-provider",
      "lane": "l",
      "stack": 0,
      "eyebrow": "provider",
      "subtitle": "SaaS"
    },
    {
      "name": "VISA",
      "kind": "shape-credit-card",
      "lane": "l",
      "stack": 1,
      "eyebrow": "card",
      "subtitle": "credit"
    },
    {
      "name": "発行銀行",
      "kind": "shape-bank",
      "lane": "l",
      "stack": 2,
      "eyebrow": "issuer",
      "subtitle": "MUFG"
    }
  ],
  "flow": [
    { "from": "Stripe", "to": "VISA", "label": "", "tone": "accent" },
    { "from": "VISA", "to": "発行銀行", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. Stripe",
      "duration": 0.75,
      "focus": ["Stripe"],
      "badge": "provider",
      "body": "SaaS"
    },
    {
      "step": "2. VISA",
      "duration": 0.75,
      "focus": ["Stripe", "VISA"],
      "badge": "card",
      "body": "credit"
    },
    {
      "step": "決済 flow",
      "duration": 0.75,
      "focus": ["Stripe", "VISA", "発行銀行"],
      "badge": "issuer",
      "body": "Stripe → クレカ authorization → 発行銀行 決済。 EC 決済の card processing 3-stage flow"
    }
  ]
}`;

export const sourceYaml__sceneWebInfra = `title: "scene: web infra (website → CDN → server)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - example.com: { kind: shape-website, lane: l, stack: 0, eyebrow: "site", subtitle: "SPA" }
  - Cloudflare: { kind: shape-cdn-edge, lane: l, stack: 1, eyebrow: "cdn", subtitle: "edge" }
  - origin: { kind: shape-server-rack, lane: l, stack: 2, eyebrow: "server", subtitle: "AWS" }

flow:
  - example.com -> Cloudflare: "" (accent)
  - Cloudflare -> origin: "" (accent)

animation:
  - step: "1. example.com" 0.75s
    focus: ["example.com"]
    badge: "site"
    description: "SPA"
  - step: "2. Cloudflare" 0.75s
    focus: ["example.com", "Cloudflare"]
    badge: "cdn"
    description: "edge"
  - step: "web infra" 0.75s
    focus: ["example.com", "Cloudflare", "origin"]
    badge: "server"
    description: "website request → CDN cache → origin server。 web 配信の standard 3-tier"
`;

export const sourceJson__sceneWebInfra = `{
  "title": "scene: web infra (website → CDN → server)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "example.com",
      "kind": "shape-website",
      "lane": "l",
      "stack": 0,
      "eyebrow": "site",
      "subtitle": "SPA"
    },
    {
      "name": "Cloudflare",
      "kind": "shape-cdn-edge",
      "lane": "l",
      "stack": 1,
      "eyebrow": "cdn",
      "subtitle": "edge"
    },
    {
      "name": "origin",
      "kind": "shape-server-rack",
      "lane": "l",
      "stack": 2,
      "eyebrow": "server",
      "subtitle": "AWS"
    }
  ],
  "flow": [
    { "from": "example.com", "to": "Cloudflare", "label": "", "tone": "accent" },
    { "from": "Cloudflare", "to": "origin", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. example.com",
      "duration": 0.75,
      "focus": ["example.com"],
      "badge": "site",
      "body": "SPA"
    },
    {
      "step": "2. Cloudflare",
      "duration": 0.75,
      "focus": ["example.com", "Cloudflare"],
      "badge": "cdn",
      "body": "edge"
    },
    {
      "step": "web infra",
      "duration": 0.75,
      "focus": ["example.com", "Cloudflare", "origin"],
      "badge": "server",
      "body": "website request → CDN cache → origin server。 web 配信の standard 3-tier"
    }
  ]
}`;

export const sourceYaml__sceneTokenBridge = `title: "scene: token bridge (chain A → bridge → chain B)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - Ethereum: { kind: shape-ethereum-chain, lane: l, stack: 0, eyebrow: "src chain", subtitle: "L1" }
  - Bridge: { kind: shape-smart-contract, lane: l, stack: 1, eyebrow: "contract", subtitle: "lock" }
  - Arbitrum: { kind: shape-blockchain, lane: l, stack: 2, eyebrow: "dst chain", subtitle: "L2" }

flow:
  - Ethereum -> Bridge: "" (accent)
  - Bridge -> Arbitrum: "" (accent)

animation:
  - step: "1. Ethereum" 0.75s
    focus: ["Ethereum"]
    badge: "src chain"
    description: "L1"
  - step: "2. Bridge" 0.75s
    focus: ["Ethereum", "Bridge"]
    badge: "contract"
    description: "lock"
  - step: "token bridge" 0.75s
    focus: ["Ethereum", "Bridge", "Arbitrum"]
    badge: "dst chain"
    description: "src chain で lock → bridge contract → dst chain で mint。 cross-chain 資産移動"
`;

export const sourceJson__sceneTokenBridge = `{
  "title": "scene: token bridge (chain A → bridge → chain B)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Ethereum",
      "kind": "shape-ethereum-chain",
      "lane": "l",
      "stack": 0,
      "eyebrow": "src chain",
      "subtitle": "L1"
    },
    {
      "name": "Bridge",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 1,
      "eyebrow": "contract",
      "subtitle": "lock"
    },
    {
      "name": "Arbitrum",
      "kind": "shape-blockchain",
      "lane": "l",
      "stack": 2,
      "eyebrow": "dst chain",
      "subtitle": "L2"
    }
  ],
  "flow": [
    { "from": "Ethereum", "to": "Bridge", "label": "", "tone": "accent" },
    { "from": "Bridge", "to": "Arbitrum", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. Ethereum",
      "duration": 0.75,
      "focus": ["Ethereum"],
      "badge": "src chain",
      "body": "L1"
    },
    {
      "step": "2. Bridge",
      "duration": 0.75,
      "focus": ["Ethereum", "Bridge"],
      "badge": "contract",
      "body": "lock"
    },
    {
      "step": "token bridge",
      "duration": 0.75,
      "focus": ["Ethereum", "Bridge", "Arbitrum"],
      "badge": "dst chain",
      "body": "src chain で lock → bridge contract → dst chain で mint。 cross-chain 資産移動"
    }
  ]
}`;

export const sourceYaml__sceneDefiLending = `title: "scene: DeFi lending (wallet → contract → token)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 供給者: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "wallet", subtitle: "USDC 供給" }
  - Aave v3: { kind: shape-smart-contract, lane: l, stack: 1, eyebrow: "lending", subtitle: "pool" }
  - aUSDC: { kind: shape-token, lane: l, stack: 2, eyebrow: "token", subtitle: "yield-bearing" }

flow:
  - 供給者 -> Aave v3: "" (accent)
  - Aave v3 -> aUSDC: "" (accent)

animation:
  - step: "1. 供給者" 0.75s
    focus: ["供給者"]
    badge: "wallet"
    description: "USDC 供給"
  - step: "2. Aave v3" 0.75s
    focus: ["供給者", "Aave v3"]
    badge: "lending"
    description: "pool"
  - step: "DeFi lending" 0.75s
    focus: ["供給者", "Aave v3", "aUSDC"]
    badge: "token"
    description: "wallet が Aave に USDC を供給 → aUSDC (yield-bearing) を発行受領。 利息付き貸出の canonical flow"
`;

export const sourceJson__sceneDefiLending = `{
  "title": "scene: DeFi lending (wallet → contract → token)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "供給者",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "wallet",
      "subtitle": "USDC 供給"
    },
    {
      "name": "Aave v3",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 1,
      "eyebrow": "lending",
      "subtitle": "pool"
    },
    {
      "name": "aUSDC",
      "kind": "shape-token",
      "lane": "l",
      "stack": 2,
      "eyebrow": "token",
      "subtitle": "yield-bearing"
    }
  ],
  "flow": [
    { "from": "供給者", "to": "Aave v3", "label": "", "tone": "accent" },
    { "from": "Aave v3", "to": "aUSDC", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 供給者",
      "duration": 0.75,
      "focus": ["供給者"],
      "badge": "wallet",
      "body": "USDC 供給"
    },
    {
      "step": "2. Aave v3",
      "duration": 0.75,
      "focus": ["供給者", "Aave v3"],
      "badge": "lending",
      "body": "pool"
    },
    {
      "step": "DeFi lending",
      "duration": 0.75,
      "focus": ["供給者", "Aave v3", "aUSDC"],
      "badge": "token",
      "body": "wallet が Aave に USDC を供給 → aUSDC (yield-bearing) を発行受領。 利息付き貸出の canonical flow"
    }
  ]
}`;

export const sourceYaml__sceneBitcoinTx = `title: "scene: bitcoin tx (wallet → BTC chain → node)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - sender: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "wallet", subtitle: "Bitcoin Core" }
  - BTC mainnet: { kind: shape-bitcoin-chain, lane: l, stack: 1, eyebrow: "chain", subtitle: "PoW" }
  - full node: { kind: shape-blockchain-node, lane: l, stack: 2, eyebrow: "node", subtitle: "validator" }

flow:
  - sender -> BTC mainnet: "" (accent)
  - BTC mainnet -> full node: "" (accent)

animation:
  - step: "1. sender" 0.75s
    focus: ["sender"]
    badge: "wallet"
    description: "Bitcoin Core"
  - step: "2. BTC mainnet" 0.75s
    focus: ["sender", "BTC mainnet"]
    badge: "chain"
    description: "PoW"
  - step: "bitcoin tx" 0.75s
    focus: ["sender", "BTC mainnet", "full node"]
    badge: "node"
    description: "wallet で tx 署名 → BTC chain broadcast → full node が承認。 P2P 送金の 3-stage flow"
`;

export const sourceJson__sceneBitcoinTx = `{
  "title": "scene: bitcoin tx (wallet → BTC chain → node)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "sender",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "wallet",
      "subtitle": "Bitcoin Core"
    },
    {
      "name": "BTC mainnet",
      "kind": "shape-bitcoin-chain",
      "lane": "l",
      "stack": 1,
      "eyebrow": "chain",
      "subtitle": "PoW"
    },
    {
      "name": "full node",
      "kind": "shape-blockchain-node",
      "lane": "l",
      "stack": 2,
      "eyebrow": "node",
      "subtitle": "validator"
    }
  ],
  "flow": [
    { "from": "sender", "to": "BTC mainnet", "label": "", "tone": "accent" },
    { "from": "BTC mainnet", "to": "full node", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. sender",
      "duration": 0.75,
      "focus": ["sender"],
      "badge": "wallet",
      "body": "Bitcoin Core"
    },
    {
      "step": "2. BTC mainnet",
      "duration": 0.75,
      "focus": ["sender", "BTC mainnet"],
      "badge": "chain",
      "body": "PoW"
    },
    {
      "step": "bitcoin tx",
      "duration": 0.75,
      "focus": ["sender", "BTC mainnet", "full node"],
      "badge": "node",
      "body": "wallet で tx 署名 → BTC chain broadcast → full node が承認。 P2P 送金の 3-stage flow"
    }
  ]
}`;

export const sourceYaml__sceneEcOrder = `title: "scene: EC 注文 (customer → shop → warehouse)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 顧客: { kind: shape-customer-service, lane: l, stack: 0, eyebrow: "customer", subtitle: "注文" }
  - Rakuten: { kind: shape-online-shop, lane: l, stack: 1, eyebrow: "shop", subtitle: "EC" }
  - 物流倉庫: { kind: shape-warehouse, lane: l, stack: 2, eyebrow: "warehouse", subtitle: "出荷" }

flow:
  - 顧客 -> Rakuten: "" (accent)
  - Rakuten -> 物流倉庫: "" (accent)

animation:
  - step: "1. 顧客" 0.75s
    focus: ["顧客"]
    badge: "customer"
    description: "注文"
  - step: "2. Rakuten" 0.75s
    focus: ["顧客", "Rakuten"]
    badge: "shop"
    description: "EC"
  - step: "EC 注文" 0.75s
    focus: ["顧客", "Rakuten", "物流倉庫"]
    badge: "warehouse"
    description: "顧客 注文 → EC 受注 → 倉庫 出荷指示。 物販 fulfillment flow"
`;

export const sourceJson__sceneEcOrder = `{
  "title": "scene: EC 注文 (customer → shop → warehouse)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "顧客",
      "kind": "shape-customer-service",
      "lane": "l",
      "stack": 0,
      "eyebrow": "customer",
      "subtitle": "注文"
    },
    {
      "name": "Rakuten",
      "kind": "shape-online-shop",
      "lane": "l",
      "stack": 1,
      "eyebrow": "shop",
      "subtitle": "EC"
    },
    {
      "name": "物流倉庫",
      "kind": "shape-warehouse",
      "lane": "l",
      "stack": 2,
      "eyebrow": "warehouse",
      "subtitle": "出荷"
    }
  ],
  "flow": [
    { "from": "顧客", "to": "Rakuten", "label": "", "tone": "accent" },
    { "from": "Rakuten", "to": "物流倉庫", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. 顧客", "duration": 0.75, "focus": ["顧客"], "badge": "customer", "body": "注文" },
    {
      "step": "2. Rakuten",
      "duration": 0.75,
      "focus": ["顧客", "Rakuten"],
      "badge": "shop",
      "body": "EC"
    },
    {
      "step": "EC 注文",
      "duration": 0.75,
      "focus": ["顧客", "Rakuten", "物流倉庫"],
      "badge": "warehouse",
      "body": "顧客 注文 → EC 受注 → 倉庫 出荷指示。 物販 fulfillment flow"
    }
  ]
}`;

export const sourceYaml__sceneMobileApi = `title: "scene: mobile app (mobile → API gateway → server)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - iOS app: { kind: shape-mobile-device, lane: l, stack: 0, eyebrow: "mobile", subtitle: "SwiftUI" }
  - GraphQL: { kind: shape-api-gateway, lane: l, stack: 1, eyebrow: "gateway", subtitle: "Apollo" }
  - backend: { kind: shape-server-rack, lane: l, stack: 2, eyebrow: "server", subtitle: "K8s" }

flow:
  - iOS app -> GraphQL: "" (accent)
  - GraphQL -> backend: "" (accent)

animation:
  - step: "1. iOS app" 0.75s
    focus: ["iOS app"]
    badge: "mobile"
    description: "SwiftUI"
  - step: "2. GraphQL" 0.75s
    focus: ["iOS app", "GraphQL"]
    badge: "gateway"
    description: "Apollo"
  - step: "mobile API" 0.75s
    focus: ["iOS app", "GraphQL", "backend"]
    badge: "server"
    description: "mobile app request → API gateway auth/route → backend server 処理。 modern mobile stack"
`;

export const sourceJson__sceneMobileApi = `{
  "title": "scene: mobile app (mobile → API gateway → server)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "iOS app",
      "kind": "shape-mobile-device",
      "lane": "l",
      "stack": 0,
      "eyebrow": "mobile",
      "subtitle": "SwiftUI"
    },
    {
      "name": "GraphQL",
      "kind": "shape-api-gateway",
      "lane": "l",
      "stack": 1,
      "eyebrow": "gateway",
      "subtitle": "Apollo"
    },
    {
      "name": "backend",
      "kind": "shape-server-rack",
      "lane": "l",
      "stack": 2,
      "eyebrow": "server",
      "subtitle": "K8s"
    }
  ],
  "flow": [
    { "from": "iOS app", "to": "GraphQL", "label": "", "tone": "accent" },
    { "from": "GraphQL", "to": "backend", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. iOS app",
      "duration": 0.75,
      "focus": ["iOS app"],
      "badge": "mobile",
      "body": "SwiftUI"
    },
    {
      "step": "2. GraphQL",
      "duration": 0.75,
      "focus": ["iOS app", "GraphQL"],
      "badge": "gateway",
      "body": "Apollo"
    },
    {
      "step": "mobile API",
      "duration": 0.75,
      "focus": ["iOS app", "GraphQL", "backend"],
      "badge": "server",
      "body": "mobile app request → API gateway auth/route → backend server 処理。 modern mobile stack"
    }
  ]
}`;

export const sourceYaml__sceneFactoryLine = `title: "scene: 工場ライン (robot → sensor → DB)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - FANUC robot: { kind: shape-robot-arm, lane: l, stack: 0, eyebrow: "robot", subtitle: "組立", posW: 294 }
  - 計測 sensor: { kind: shape-iot-sensor, lane: l, stack: 1, eyebrow: "sensor", subtitle: "品質" }
  - MES DB: { kind: shape-cylinder, lane: l, stack: 2, eyebrow: "database", subtitle: "traceability" }

flow:
  - FANUC robot -> 計測 sensor: "" (accent)
  - 計測 sensor -> MES DB: "" (accent)

animation:
  - step: "1. FANUC robot" 0.75s
    focus: ["FANUC robot"]
    badge: "robot"
    description: "組立"
  - step: "2. 計測 sensor" 0.75s
    focus: ["FANUC robot", "計測 sensor"]
    badge: "sensor"
    description: "品質"
  - step: "factory line" 0.75s
    focus: ["FANUC robot", "計測 sensor", "MES DB"]
    badge: "database"
    description: "robot arm 作業 → 計測 sensor が品質確認 → MES DB に記録。 スマート工場の canonical"
`;

export const sourceJson__sceneFactoryLine = `{
  "title": "scene: 工場ライン (robot → sensor → DB)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "FANUC robot",
      "kind": "shape-robot-arm",
      "lane": "l",
      "stack": 0,
      "eyebrow": "robot",
      "subtitle": "組立",
      "posW": 294
    },
    {
      "name": "計測 sensor",
      "kind": "shape-iot-sensor",
      "lane": "l",
      "stack": 1,
      "eyebrow": "sensor",
      "subtitle": "品質"
    },
    {
      "name": "MES DB",
      "kind": "shape-cylinder",
      "lane": "l",
      "stack": 2,
      "eyebrow": "database",
      "subtitle": "traceability"
    }
  ],
  "flow": [
    { "from": "FANUC robot", "to": "計測 sensor", "label": "", "tone": "accent" },
    { "from": "計測 sensor", "to": "MES DB", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. FANUC robot",
      "duration": 0.75,
      "focus": ["FANUC robot"],
      "badge": "robot",
      "body": "組立"
    },
    {
      "step": "2. 計測 sensor",
      "duration": 0.75,
      "focus": ["FANUC robot", "計測 sensor"],
      "badge": "sensor",
      "body": "品質"
    },
    {
      "step": "factory line",
      "duration": 0.75,
      "focus": ["FANUC robot", "計測 sensor", "MES DB"],
      "badge": "database",
      "body": "robot arm 作業 → 計測 sensor が品質確認 → MES DB に記録。 スマート工場の canonical"
    }
  ]
}`;

export const sourceYaml__sceneSatelliteChain = `title: "scene: satellite (satellite → RPC → chain)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - Starlink: { kind: shape-satellite, lane: l, stack: 0, eyebrow: "satellite", subtitle: "LEO" }
  - Alchemy: { kind: shape-rpc-node, lane: l, stack: 1, eyebrow: "rpc", subtitle: "endpoint" }
  - Solana: { kind: shape-blockchain, lane: l, stack: 2, eyebrow: "chain", subtitle: "high TPS" }

flow:
  - Starlink -> Alchemy: "" (accent)
  - Alchemy -> Solana: "" (accent)

animation:
  - step: "1. Starlink" 0.75s
    focus: ["Starlink"]
    badge: "satellite"
    description: "LEO"
  - step: "2. Alchemy" 0.75s
    focus: ["Starlink", "Alchemy"]
    badge: "rpc"
    description: "endpoint"
  - step: "satellite chain" 0.75s
    focus: ["Starlink", "Alchemy", "Solana"]
    badge: "chain"
    description: "衛星 データ → RPC 中継 → chain 記録。 space-to-chain の real-world data 送信"
`;

export const sourceJson__sceneSatelliteChain = `{
  "title": "scene: satellite (satellite → RPC → chain)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Starlink",
      "kind": "shape-satellite",
      "lane": "l",
      "stack": 0,
      "eyebrow": "satellite",
      "subtitle": "LEO"
    },
    {
      "name": "Alchemy",
      "kind": "shape-rpc-node",
      "lane": "l",
      "stack": 1,
      "eyebrow": "rpc",
      "subtitle": "endpoint"
    },
    {
      "name": "Solana",
      "kind": "shape-blockchain",
      "lane": "l",
      "stack": 2,
      "eyebrow": "chain",
      "subtitle": "high TPS"
    }
  ],
  "flow": [
    { "from": "Starlink", "to": "Alchemy", "label": "", "tone": "accent" },
    { "from": "Alchemy", "to": "Solana", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. Starlink",
      "duration": 0.75,
      "focus": ["Starlink"],
      "badge": "satellite",
      "body": "LEO"
    },
    {
      "step": "2. Alchemy",
      "duration": 0.75,
      "focus": ["Starlink", "Alchemy"],
      "badge": "rpc",
      "body": "endpoint"
    },
    {
      "step": "satellite chain",
      "duration": 0.75,
      "focus": ["Starlink", "Alchemy", "Solana"],
      "badge": "chain",
      "body": "衛星 データ → RPC 中継 → chain 記録。 space-to-chain の real-world data 送信"
    }
  ]
}`;

export const sourceYaml__sceneDevOps = `title: "scene: DevOps (code → CI → cloud)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - src/: { kind: shape-code-block, lane: l, stack: 0, eyebrow: "code", subtitle: "TypeScript" }
  - GitHub Actions: { kind: shape-gear, lane: l, stack: 1, eyebrow: "ci", subtitle: "build + test", posW: 360 }
  - AWS ECS: { kind: shape-cloud, lane: l, stack: 2, eyebrow: "deploy", subtitle: "container" }

flow:
  - src/ -> GitHub Actions: "" (accent)
  - GitHub Actions -> AWS ECS: "" (accent)

animation:
  - step: "1. src/" 0.75s
    focus: ["src/"]
    badge: "code"
    description: "TypeScript"
  - step: "2. GitHub Actions" 0.75s
    focus: ["src/", "GitHub Actions"]
    badge: "ci"
    description: "build + test"
  - step: "DevOps" 0.75s
    focus: ["src/", "GitHub Actions", "AWS ECS"]
    badge: "deploy"
    description: "code push → CI build/test → cloud deploy。 modern CI/CD の canonical 3-stage flow"
`;

export const sourceJson__sceneDevOps = `{
  "title": "scene: DevOps (code → CI → cloud)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "src/",
      "kind": "shape-code-block",
      "lane": "l",
      "stack": 0,
      "eyebrow": "code",
      "subtitle": "TypeScript"
    },
    {
      "name": "GitHub Actions",
      "kind": "shape-gear",
      "lane": "l",
      "stack": 1,
      "eyebrow": "ci",
      "subtitle": "build + test",
      "posW": 360
    },
    {
      "name": "AWS ECS",
      "kind": "shape-cloud",
      "lane": "l",
      "stack": 2,
      "eyebrow": "deploy",
      "subtitle": "container"
    }
  ],
  "flow": [
    { "from": "src/", "to": "GitHub Actions", "label": "", "tone": "accent" },
    { "from": "GitHub Actions", "to": "AWS ECS", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. src/",
      "duration": 0.75,
      "focus": ["src/"],
      "badge": "code",
      "body": "TypeScript"
    },
    {
      "step": "2. GitHub Actions",
      "duration": 0.75,
      "focus": ["src/", "GitHub Actions"],
      "badge": "ci",
      "body": "build + test"
    },
    {
      "step": "DevOps",
      "duration": 0.75,
      "focus": ["src/", "GitHub Actions", "AWS ECS"],
      "badge": "deploy",
      "body": "code push → CI build/test → cloud deploy。 modern CI/CD の canonical 3-stage flow"
    }
  ]
}`;

export const sourceYaml__sceneTaskFlow = `title: "scene: task flow (kanban → terminal → file)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - todo #42: { kind: shape-kanban-card, lane: l, stack: 0, eyebrow: "kanban", subtitle: "in progress" }
  - $ npm run build: { kind: shape-terminal, lane: l, stack: 1, eyebrow: "terminal", subtitle: "shell", posW: 382 }
  - build.log: { kind: shape-file, lane: l, stack: 2, eyebrow: "file", subtitle: "output" }

flow:
  - todo #42 -> $ npm run build: "" (accent)
  - $ npm run build -> build.log: "" (accent)

animation:
  - step: "1. todo #42" 0.75s
    focus: ["todo #42"]
    badge: "kanban"
    description: "in progress"
  - step: "2. $ npm run build" 0.75s
    focus: ["todo #42", "$ npm run build"]
    badge: "terminal"
    description: "shell"
  - step: "task flow" 0.75s
    focus: ["todo #42", "$ npm run build", "build.log"]
    badge: "file"
    description: "kanban task 着手 → terminal で作業 → file 出力保存。 開発者の日常 flow"
`;

export const sourceJson__sceneTaskFlow = `{
  "title": "scene: task flow (kanban → terminal → file)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "todo #42",
      "kind": "shape-kanban-card",
      "lane": "l",
      "stack": 0,
      "eyebrow": "kanban",
      "subtitle": "in progress"
    },
    {
      "name": "$ npm run build",
      "kind": "shape-terminal",
      "lane": "l",
      "stack": 1,
      "eyebrow": "terminal",
      "subtitle": "shell",
      "posW": 382
    },
    {
      "name": "build.log",
      "kind": "shape-file",
      "lane": "l",
      "stack": 2,
      "eyebrow": "file",
      "subtitle": "output"
    }
  ],
  "flow": [
    { "from": "todo #42", "to": "$ npm run build", "label": "", "tone": "accent" },
    { "from": "$ npm run build", "to": "build.log", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. todo #42",
      "duration": 0.75,
      "focus": ["todo #42"],
      "badge": "kanban",
      "body": "in progress"
    },
    {
      "step": "2. $ npm run build",
      "duration": 0.75,
      "focus": ["todo #42", "$ npm run build"],
      "badge": "terminal",
      "body": "shell"
    },
    {
      "step": "task flow",
      "duration": 0.75,
      "focus": ["todo #42", "$ npm run build", "build.log"],
      "badge": "file",
      "body": "kanban task 着手 → terminal で作業 → file 出力保存。 開発者の日常 flow"
    }
  ]
}`;

export const sourceYaml__sceneNotification = `title: "scene: 通知 (message → service → app)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - @alice: { kind: shape-message-bubble, lane: l, stack: 0, eyebrow: "message", subtitle: "Slack" }
  - NotifyService: { kind: shape-hexagon, lane: l, stack: 1, eyebrow: "service", subtitle: "push", posW: 338 }
  - デスクトップ通知: { kind: shape-window, lane: l, stack: 2, eyebrow: "window", subtitle: "OS native" }

flow:
  - @alice -> NotifyService: "" (accent)
  - NotifyService -> デスクトップ通知: "" (accent)

animation:
  - step: "1. @alice" 0.75s
    focus: ["@alice"]
    badge: "message"
    description: "Slack"
  - step: "2. NotifyService" 0.75s
    focus: ["@alice", "NotifyService"]
    badge: "service"
    description: "push"
  - step: "通知" 0.75s
    focus: ["@alice", "NotifyService", "デスクトップ通知"]
    badge: "window"
    description: "message 送信 → notify service push → 受信者 desktop 通知表示。 messaging の end-to-end"
`;

export const sourceJson__sceneNotification = `{
  "title": "scene: 通知 (message → service → app)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "@alice",
      "kind": "shape-message-bubble",
      "lane": "l",
      "stack": 0,
      "eyebrow": "message",
      "subtitle": "Slack"
    },
    {
      "name": "NotifyService",
      "kind": "shape-hexagon",
      "lane": "l",
      "stack": 1,
      "eyebrow": "service",
      "subtitle": "push",
      "posW": 338
    },
    {
      "name": "デスクトップ通知",
      "kind": "shape-window",
      "lane": "l",
      "stack": 2,
      "eyebrow": "window",
      "subtitle": "OS native"
    }
  ],
  "flow": [
    { "from": "@alice", "to": "NotifyService", "label": "", "tone": "accent" },
    { "from": "NotifyService", "to": "デスクトップ通知", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. @alice",
      "duration": 0.75,
      "focus": ["@alice"],
      "badge": "message",
      "body": "Slack"
    },
    {
      "step": "2. NotifyService",
      "duration": 0.75,
      "focus": ["@alice", "NotifyService"],
      "badge": "service",
      "body": "push"
    },
    {
      "step": "通知",
      "duration": 0.75,
      "focus": ["@alice", "NotifyService", "デスクトップ通知"],
      "badge": "window",
      "body": "message 送信 → notify service push → 受信者 desktop 通知表示。 messaging の end-to-end"
    }
  ]
}`;

export const sourceYaml__sceneTrustAsset = `title: "scene: 信託資産 (trader → trust bank → 帳簿)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 資産運用者: { kind: shape-trader, lane: l, stack: 0, eyebrow: "trader", subtitle: "buy 指示" }
  - 三井住友信託: { kind: shape-trust-bank, lane: l, stack: 1, eyebrow: "trust", subtitle: "受託" }
  - 運用報告書: { kind: shape-file, lane: l, stack: 2, eyebrow: "record", subtitle: "月次" }

flow:
  - 資産運用者 -> 三井住友信託: "" (accent)
  - 三井住友信託 -> 運用報告書: "" (accent)

animation:
  - step: "1. 資産運用者" 0.75s
    focus: ["資産運用者"]
    badge: "trader"
    description: "buy 指示"
  - step: "2. 三井住友信託" 0.75s
    focus: ["資産運用者", "三井住友信託"]
    badge: "trust"
    description: "受託"
  - step: "信託資産" 0.75s
    focus: ["資産運用者", "三井住友信託", "運用報告書"]
    badge: "record"
    description: "運用者 buy 指示 → 信託銀行 受託 → 月次報告書 発行。 institutional 資産管理"
`;

export const sourceJson__sceneTrustAsset = `{
  "title": "scene: 信託資産 (trader → trust bank → 帳簿)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "資産運用者",
      "kind": "shape-trader",
      "lane": "l",
      "stack": 0,
      "eyebrow": "trader",
      "subtitle": "buy 指示"
    },
    {
      "name": "三井住友信託",
      "kind": "shape-trust-bank",
      "lane": "l",
      "stack": 1,
      "eyebrow": "trust",
      "subtitle": "受託"
    },
    {
      "name": "運用報告書",
      "kind": "shape-file",
      "lane": "l",
      "stack": 2,
      "eyebrow": "record",
      "subtitle": "月次"
    }
  ],
  "flow": [
    { "from": "資産運用者", "to": "三井住友信託", "label": "", "tone": "accent" },
    { "from": "三井住友信託", "to": "運用報告書", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 資産運用者",
      "duration": 0.75,
      "focus": ["資産運用者"],
      "badge": "trader",
      "body": "buy 指示"
    },
    {
      "step": "2. 三井住友信託",
      "duration": 0.75,
      "focus": ["資産運用者", "三井住友信託"],
      "badge": "trust",
      "body": "受託"
    },
    {
      "step": "信託資産",
      "duration": 0.75,
      "focus": ["資産運用者", "三井住友信託", "運用報告書"],
      "badge": "record",
      "body": "運用者 buy 指示 → 信託銀行 受託 → 月次報告書 発行。 institutional 資産管理"
    }
  ]
}`;

export const sourceYaml__sceneConsensus = `title: "scene: consensus (node → block → chain)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - validator: { kind: shape-blockchain-node, lane: l, stack: 0, eyebrow: "node", subtitle: "PoS" }
  - block #8123456: { kind: shape-blockchain-block, lane: l, stack: 1, eyebrow: "block", subtitle: "proposed", posW: 360 }
  - canonical chain: { kind: shape-blockchain, lane: l, stack: 2, eyebrow: "chain", subtitle: "finalized" }

flow:
  - validator -> block #8123456: "" (accent)
  - block #8123456 -> canonical chain: "" (accent)

animation:
  - step: "1. validator" 0.75s
    focus: ["validator"]
    badge: "node"
    description: "PoS"
  - step: "2. block #8123456" 0.75s
    focus: ["validator", "block #8123456"]
    badge: "block"
    description: "proposed"
  - step: "consensus" 0.75s
    focus: ["validator", "block #8123456", "canonical chain"]
    badge: "chain"
    description: "validator が block 提案 → attestation 集約 → chain finalize。 PoS consensus の canonical"
`;

export const sourceJson__sceneConsensus = `{
  "title": "scene: consensus (node → block → chain)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "validator",
      "kind": "shape-blockchain-node",
      "lane": "l",
      "stack": 0,
      "eyebrow": "node",
      "subtitle": "PoS"
    },
    {
      "name": "block #8123456",
      "kind": "shape-blockchain-block",
      "lane": "l",
      "stack": 1,
      "eyebrow": "block",
      "subtitle": "proposed",
      "posW": 360
    },
    {
      "name": "canonical chain",
      "kind": "shape-blockchain",
      "lane": "l",
      "stack": 2,
      "eyebrow": "chain",
      "subtitle": "finalized"
    }
  ],
  "flow": [
    { "from": "validator", "to": "block #8123456", "label": "", "tone": "accent" },
    { "from": "block #8123456", "to": "canonical chain", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. validator",
      "duration": 0.75,
      "focus": ["validator"],
      "badge": "node",
      "body": "PoS"
    },
    {
      "step": "2. block #8123456",
      "duration": 0.75,
      "focus": ["validator", "block #8123456"],
      "badge": "block",
      "body": "proposed"
    },
    {
      "step": "consensus",
      "duration": 0.75,
      "focus": ["validator", "block #8123456", "canonical chain"],
      "badge": "chain",
      "body": "validator が block 提案 → attestation 集約 → chain finalize。 PoS consensus の canonical"
    }
  ]
}`;

export const sourceYaml__sceneTokenDeploy = `title: "scene: token deploy (dev → contract → token)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - deployer: { kind: shape-lawyer, lane: l, stack: 0, eyebrow: "dev", subtitle: "founder" }
  - ERC-20: { kind: shape-smart-contract, lane: l, stack: 1, eyebrow: "contract", subtitle: "OpenZeppelin" }
  - $KIWA: { kind: shape-token, lane: l, stack: 2, eyebrow: "token", subtitle: "1B supply" }

flow:
  - deployer -> ERC-20: "" (accent)
  - ERC-20 -> $KIWA: "" (accent)

animation:
  - step: "1. deployer" 0.75s
    focus: ["deployer"]
    badge: "dev"
    description: "founder"
  - step: "2. ERC-20" 0.75s
    focus: ["deployer", "ERC-20"]
    badge: "contract"
    description: "OpenZeppelin"
  - step: "token deploy" 0.75s
    focus: ["deployer", "ERC-20", "$KIWA"]
    badge: "token"
    description: "developer が ERC-20 contract deploy → token 発行 → market 供給。 project trickery 開始"
`;

export const sourceJson__sceneTokenDeploy = `{
  "title": "scene: token deploy (dev → contract → token)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "deployer",
      "kind": "shape-lawyer",
      "lane": "l",
      "stack": 0,
      "eyebrow": "dev",
      "subtitle": "founder"
    },
    {
      "name": "ERC-20",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 1,
      "eyebrow": "contract",
      "subtitle": "OpenZeppelin"
    },
    {
      "name": "$KIWA",
      "kind": "shape-token",
      "lane": "l",
      "stack": 2,
      "eyebrow": "token",
      "subtitle": "1B supply"
    }
  ],
  "flow": [
    { "from": "deployer", "to": "ERC-20", "label": "", "tone": "accent" },
    { "from": "ERC-20", "to": "$KIWA", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. deployer",
      "duration": 0.75,
      "focus": ["deployer"],
      "badge": "dev",
      "body": "founder"
    },
    {
      "step": "2. ERC-20",
      "duration": 0.75,
      "focus": ["deployer", "ERC-20"],
      "badge": "contract",
      "body": "OpenZeppelin"
    },
    {
      "step": "token deploy",
      "duration": 0.75,
      "focus": ["deployer", "ERC-20", "$KIWA"],
      "badge": "token",
      "body": "developer が ERC-20 contract deploy → token 発行 → market 供給。 project trickery 開始"
    }
  ]
}`;

export const sourceYaml__sceneCompliance = `title: "scene: 規制対応 (regulator → 帳簿 → bank)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 金融庁: { kind: shape-regulator, lane: l, stack: 0, eyebrow: "regulator", subtitle: "検査" }
  - 取引記録: { kind: shape-file, lane: l, stack: 1, eyebrow: "record", subtitle: "audit trail" }
  - 対象銀行: { kind: shape-bank, lane: l, stack: 2, eyebrow: "bank", subtitle: "検査対象" }

flow:
  - 金融庁 -> 取引記録: "" (accent)
  - 取引記録 -> 対象銀行: "" (accent)

animation:
  - step: "1. 金融庁" 0.75s
    focus: ["金融庁"]
    badge: "regulator"
    description: "検査"
  - step: "2. 取引記録" 0.75s
    focus: ["金融庁", "取引記録"]
    badge: "record"
    description: "audit trail"
  - step: "compliance" 0.75s
    focus: ["金融庁", "取引記録", "対象銀行"]
    badge: "bank"
    description: "規制当局 検査開始 → 帳簿 提出 → 銀行 検査対応。 金融庁 検査の canonical flow"
`;

export const sourceJson__sceneCompliance = `{
  "title": "scene: 規制対応 (regulator → 帳簿 → bank)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "金融庁",
      "kind": "shape-regulator",
      "lane": "l",
      "stack": 0,
      "eyebrow": "regulator",
      "subtitle": "検査"
    },
    {
      "name": "取引記録",
      "kind": "shape-file",
      "lane": "l",
      "stack": 1,
      "eyebrow": "record",
      "subtitle": "audit trail"
    },
    {
      "name": "対象銀行",
      "kind": "shape-bank",
      "lane": "l",
      "stack": 2,
      "eyebrow": "bank",
      "subtitle": "検査対象"
    }
  ],
  "flow": [
    { "from": "金融庁", "to": "取引記録", "label": "", "tone": "accent" },
    { "from": "取引記録", "to": "対象銀行", "label": "", "tone": "accent" }
  ],
  "animation": [
    { "step": "1. 金融庁", "duration": 0.75, "focus": ["金融庁"], "badge": "regulator", "body": "検査" },
    {
      "step": "2. 取引記録",
      "duration": 0.75,
      "focus": ["金融庁", "取引記録"],
      "badge": "record",
      "body": "audit trail"
    },
    {
      "step": "compliance",
      "duration": 0.75,
      "focus": ["金融庁", "取引記録", "対象銀行"],
      "badge": "bank",
      "body": "規制当局 検査開始 → 帳簿 提出 → 銀行 検査対応。 金融庁 検査の canonical flow"
    }
  ]
}`;

export const sourceYaml__sceneNftMarketplace = `title: "scene: NFT 売買 (buyer → marketplace → NFT)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - buyer: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "wallet", subtitle: "collector" }
  - OpenSea: { kind: shape-exchange, lane: l, stack: 1, eyebrow: "marketplace", subtitle: "royalty 5%" }
  - BAYC #7890: { kind: shape-nft, lane: l, stack: 2, eyebrow: "nft", subtitle: "Bored Ape", posW: 272 }

flow:
  - buyer -> OpenSea: "" (accent)
  - OpenSea -> BAYC #7890: "" (accent)

animation:
  - step: "1. buyer" 0.75s
    focus: ["buyer"]
    badge: "wallet"
    description: "collector"
  - step: "2. OpenSea" 0.75s
    focus: ["buyer", "OpenSea"]
    badge: "marketplace"
    description: "royalty 5%"
  - step: "NFT marketplace" 0.75s
    focus: ["buyer", "OpenSea", "BAYC #7890"]
    badge: "nft"
    description: "buyer が marketplace で bid → contract 実行 → NFT ownership 移転。 secondary market flow"
`;

export const sourceJson__sceneNftMarketplace = `{
  "title": "scene: NFT 売買 (buyer → marketplace → NFT)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "buyer",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "wallet",
      "subtitle": "collector"
    },
    {
      "name": "OpenSea",
      "kind": "shape-exchange",
      "lane": "l",
      "stack": 1,
      "eyebrow": "marketplace",
      "subtitle": "royalty 5%"
    },
    {
      "name": "BAYC #7890",
      "kind": "shape-nft",
      "lane": "l",
      "stack": 2,
      "eyebrow": "nft",
      "subtitle": "Bored Ape",
      "posW": 272
    }
  ],
  "flow": [
    { "from": "buyer", "to": "OpenSea", "label": "", "tone": "accent" },
    { "from": "OpenSea", "to": "BAYC #7890", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. buyer",
      "duration": 0.75,
      "focus": ["buyer"],
      "badge": "wallet",
      "body": "collector"
    },
    {
      "step": "2. OpenSea",
      "duration": 0.75,
      "focus": ["buyer", "OpenSea"],
      "badge": "marketplace",
      "body": "royalty 5%"
    },
    {
      "step": "NFT marketplace",
      "duration": 0.75,
      "focus": ["buyer", "OpenSea", "BAYC #7890"],
      "badge": "nft",
      "body": "buyer が marketplace で bid → contract 実行 → NFT ownership 移転。 secondary market flow"
    }
  ]
}`;

export const sourceYaml__sceneNetworkPath = `title: "scene: network (router → hub → server)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - client: { kind: shape-mobile-device, lane: l, stack: 0, eyebrow: "device", subtitle: "端末" }
  - core switch: { kind: shape-network-node, lane: l, stack: 1, eyebrow: "network", subtitle: "L2/L3" }
  - app server: { kind: shape-server-rack, lane: l, stack: 2, eyebrow: "server", subtitle: "DC", posW: 272 }

flow:
  - client -> core switch: "" (accent)
  - core switch -> app server: "" (accent)

animation:
  - step: "1. client" 0.75s
    focus: ["client"]
    badge: "device"
    description: "端末"
  - step: "2. core switch" 0.75s
    focus: ["client", "core switch"]
    badge: "network"
    description: "L2/L3"
  - step: "network path" 0.75s
    focus: ["client", "core switch", "app server"]
    badge: "server"
    description: "client 端末 → network core switch 経由 → server 到達。 typical enterprise network 3-stage path"
`;

export const sourceJson__sceneNetworkPath = `{
  "title": "scene: network (router → hub → server)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "client",
      "kind": "shape-mobile-device",
      "lane": "l",
      "stack": 0,
      "eyebrow": "device",
      "subtitle": "端末"
    },
    {
      "name": "core switch",
      "kind": "shape-network-node",
      "lane": "l",
      "stack": 1,
      "eyebrow": "network",
      "subtitle": "L2/L3"
    },
    {
      "name": "app server",
      "kind": "shape-server-rack",
      "lane": "l",
      "stack": 2,
      "eyebrow": "server",
      "subtitle": "DC",
      "posW": 272
    }
  ],
  "flow": [
    { "from": "client", "to": "core switch", "label": "", "tone": "accent" },
    { "from": "core switch", "to": "app server", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. client",
      "duration": 0.75,
      "focus": ["client"],
      "badge": "device",
      "body": "端末"
    },
    {
      "step": "2. core switch",
      "duration": 0.75,
      "focus": ["client", "core switch"],
      "badge": "network",
      "body": "L2/L3"
    },
    {
      "step": "network path",
      "duration": 0.75,
      "focus": ["client", "core switch", "app server"],
      "badge": "server",
      "body": "client 端末 → network core switch 経由 → server 到達。 typical enterprise network 3-stage path"
    }
  ]
}`;

export const sourceYaml__sceneCheckout = `title: "scene: checkout (site → provider → card)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - shop.example.com: { kind: shape-website, lane: l, stack: 0, eyebrow: "site", subtitle: "cart", posW: 404 }
  - PayPal: { kind: shape-payment-provider, lane: l, stack: 1, eyebrow: "provider", subtitle: "checkout" }
  - MasterCard: { kind: shape-credit-card, lane: l, stack: 2, eyebrow: "card", subtitle: "credit" }

flow:
  - shop.example.com -> PayPal: "" (accent)
  - PayPal -> MasterCard: "" (accent)

animation:
  - step: "1. shop.example.com" 0.75s
    focus: ["shop.example.com"]
    badge: "site"
    description: "cart"
  - step: "2. PayPal" 0.75s
    focus: ["shop.example.com", "PayPal"]
    badge: "provider"
    description: "checkout"
  - step: "checkout" 0.75s
    focus: ["shop.example.com", "PayPal", "MasterCard"]
    badge: "card"
    description: "サイトで cart 送信 → 決済 provider 経由 → クレカ authorization。 EC checkout の canonical"
`;

export const sourceJson__sceneCheckout = `{
  "title": "scene: checkout (site → provider → card)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "shop.example.com",
      "kind": "shape-website",
      "lane": "l",
      "stack": 0,
      "eyebrow": "site",
      "subtitle": "cart",
      "posW": 404
    },
    {
      "name": "PayPal",
      "kind": "shape-payment-provider",
      "lane": "l",
      "stack": 1,
      "eyebrow": "provider",
      "subtitle": "checkout"
    },
    {
      "name": "MasterCard",
      "kind": "shape-credit-card",
      "lane": "l",
      "stack": 2,
      "eyebrow": "card",
      "subtitle": "credit"
    }
  ],
  "flow": [
    { "from": "shop.example.com", "to": "PayPal", "label": "", "tone": "accent" },
    { "from": "PayPal", "to": "MasterCard", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. shop.example.com",
      "duration": 0.75,
      "focus": ["shop.example.com"],
      "badge": "site",
      "body": "cart"
    },
    {
      "step": "2. PayPal",
      "duration": 0.75,
      "focus": ["shop.example.com", "PayPal"],
      "badge": "provider",
      "body": "checkout"
    },
    {
      "step": "checkout",
      "duration": 0.75,
      "focus": ["shop.example.com", "PayPal", "MasterCard"],
      "badge": "card",
      "body": "サイトで cart 送信 → 決済 provider 経由 → クレカ authorization。 EC checkout の canonical"
    }
  ]
}`;

export const sourceYaml__sceneEdgeCompute = `title: "scene: edge compute (mobile → CDN → cloud)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - Android app: { kind: shape-mobile-device, lane: l, stack: 0, eyebrow: "mobile", subtitle: "user", posW: 294 }
  - Fastly edge: { kind: shape-cdn-edge, lane: l, stack: 1, eyebrow: "edge", subtitle: "compute@edge" }
  - GCP origin: { kind: shape-cloud, lane: l, stack: 2, eyebrow: "cloud", subtitle: "fallback" }

flow:
  - Android app -> Fastly edge: "" (accent)
  - Fastly edge -> GCP origin: "" (accent)

animation:
  - step: "1. Android app" 0.75s
    focus: ["Android app"]
    badge: "mobile"
    description: "user"
  - step: "2. Fastly edge" 0.75s
    focus: ["Android app", "Fastly edge"]
    badge: "edge"
    description: "compute@edge"
  - step: "edge compute" 0.75s
    focus: ["Android app", "Fastly edge", "GCP origin"]
    badge: "cloud"
    description: "mobile request → CDN edge で compute → origin fallback。 low-latency delivery"
`;

export const sourceJson__sceneEdgeCompute = `{
  "title": "scene: edge compute (mobile → CDN → cloud)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Android app",
      "kind": "shape-mobile-device",
      "lane": "l",
      "stack": 0,
      "eyebrow": "mobile",
      "subtitle": "user",
      "posW": 294
    },
    {
      "name": "Fastly edge",
      "kind": "shape-cdn-edge",
      "lane": "l",
      "stack": 1,
      "eyebrow": "edge",
      "subtitle": "compute@edge"
    },
    {
      "name": "GCP origin",
      "kind": "shape-cloud",
      "lane": "l",
      "stack": 2,
      "eyebrow": "cloud",
      "subtitle": "fallback"
    }
  ],
  "flow": [
    { "from": "Android app", "to": "Fastly edge", "label": "", "tone": "accent" },
    { "from": "Fastly edge", "to": "GCP origin", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. Android app",
      "duration": 0.75,
      "focus": ["Android app"],
      "badge": "mobile",
      "body": "user"
    },
    {
      "step": "2. Fastly edge",
      "duration": 0.75,
      "focus": ["Android app", "Fastly edge"],
      "badge": "edge",
      "body": "compute@edge"
    },
    {
      "step": "edge compute",
      "duration": 0.75,
      "focus": ["Android app", "Fastly edge", "GCP origin"],
      "badge": "cloud",
      "body": "mobile request → CDN edge で compute → origin fallback。 low-latency delivery"
    }
  ]
}`;

export const sourceYaml__sceneVersionDeploy = `title: "scene: version deploy (stack → gear → site)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - release v3.2.0: { kind: shape-stack, lane: l, stack: 0, eyebrow: "release", subtitle: "tagged", posW: 360 }
  - deploy pipeline: { kind: shape-gear, lane: l, stack: 1, eyebrow: "ci", subtitle: "canary", posW: 382 }
  - prod.example.com: { kind: shape-website, lane: l, stack: 2, eyebrow: "site", subtitle: "live", posW: 404 }

flow:
  - release v3.2.0 -> deploy pipeline: "" (accent)
  - deploy pipeline -> prod.example.com: "" (accent)

animation:
  - step: "1. release v3.2.0" 0.75s
    focus: ["release v3.2.0"]
    badge: "release"
    description: "tagged"
  - step: "2. deploy pipeline" 0.75s
    focus: ["release v3.2.0", "deploy pipeline"]
    badge: "ci"
    description: "canary"
  - step: "version deploy" 0.75s
    focus: ["release v3.2.0", "deploy pipeline", "prod.example.com"]
    badge: "site"
    description: "release tag → deploy pipeline canary → production site 反映。 SaaS deploy の standard"
`;

export const sourceJson__sceneVersionDeploy = `{
  "title": "scene: version deploy (stack → gear → site)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "release v3.2.0",
      "kind": "shape-stack",
      "lane": "l",
      "stack": 0,
      "eyebrow": "release",
      "subtitle": "tagged",
      "posW": 360
    },
    {
      "name": "deploy pipeline",
      "kind": "shape-gear",
      "lane": "l",
      "stack": 1,
      "eyebrow": "ci",
      "subtitle": "canary",
      "posW": 382
    },
    {
      "name": "prod.example.com",
      "kind": "shape-website",
      "lane": "l",
      "stack": 2,
      "eyebrow": "site",
      "subtitle": "live",
      "posW": 404
    }
  ],
  "flow": [
    { "from": "release v3.2.0", "to": "deploy pipeline", "label": "", "tone": "accent" },
    { "from": "deploy pipeline", "to": "prod.example.com", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. release v3.2.0",
      "duration": 0.75,
      "focus": ["release v3.2.0"],
      "badge": "release",
      "body": "tagged"
    },
    {
      "step": "2. deploy pipeline",
      "duration": 0.75,
      "focus": ["release v3.2.0", "deploy pipeline"],
      "badge": "ci",
      "body": "canary"
    },
    {
      "step": "version deploy",
      "duration": 0.75,
      "focus": ["release v3.2.0", "deploy pipeline", "prod.example.com"],
      "badge": "site",
      "body": "release tag → deploy pipeline canary → production site 反映。 SaaS deploy の standard"
    }
  ]
}`;

export const sourceYaml__sceneAuditChain = `title: "scene: audit chain (auditor → file → regulator)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 監査法人: { kind: shape-auditor, lane: l, stack: 0, eyebrow: "auditor", subtitle: "PwC" }
  - 監査報告書: { kind: shape-file, lane: l, stack: 1, eyebrow: "report", subtitle: "signed" }
  - 金融庁: { kind: shape-regulator, lane: l, stack: 2, eyebrow: "regulator", subtitle: "受領" }

flow:
  - 監査法人 -> 監査報告書: "" (accent)
  - 監査報告書 -> 金融庁: "" (accent)

animation:
  - step: "1. 監査法人" 0.75s
    focus: ["監査法人"]
    badge: "auditor"
    description: "PwC"
  - step: "2. 監査報告書" 0.75s
    focus: ["監査法人", "監査報告書"]
    badge: "report"
    description: "signed"
  - step: "audit chain" 0.75s
    focus: ["監査法人", "監査報告書", "金融庁"]
    badge: "regulator"
    description: "監査法人 検査 → 報告書 作成 → 規制当局 受領。 上場企業 quarterly audit の canonical"
`;

export const sourceJson__sceneAuditChain = `{
  "title": "scene: audit chain (auditor → file → regulator)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "監査法人",
      "kind": "shape-auditor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "auditor",
      "subtitle": "PwC"
    },
    {
      "name": "監査報告書",
      "kind": "shape-file",
      "lane": "l",
      "stack": 1,
      "eyebrow": "report",
      "subtitle": "signed"
    },
    {
      "name": "金融庁",
      "kind": "shape-regulator",
      "lane": "l",
      "stack": 2,
      "eyebrow": "regulator",
      "subtitle": "受領"
    }
  ],
  "flow": [
    { "from": "監査法人", "to": "監査報告書", "label": "", "tone": "accent" },
    { "from": "監査報告書", "to": "金融庁", "label": "", "tone": "accent" }
  ],
  "animation": [
    {
      "step": "1. 監査法人",
      "duration": 0.75,
      "focus": ["監査法人"],
      "badge": "auditor",
      "body": "PwC"
    },
    {
      "step": "2. 監査報告書",
      "duration": 0.75,
      "focus": ["監査法人", "監査報告書"],
      "badge": "report",
      "body": "signed"
    },
    {
      "step": "audit chain",
      "duration": 0.75,
      "focus": ["監査法人", "監査報告書", "金融庁"],
      "badge": "regulator",
      "body": "監査法人 検査 → 報告書 作成 → 規制当局 受領。 上場企業 quarterly audit の canonical"
    }
  ]
}`;

// ============================================================
// 記法 (#1376)
// ============================================================
//
// catalog は `sourceYaml__<図の export 名>` の名前で記法を拾う (`lib/catalog-items.ts`)。
// 記法があると画面で「コード」 を読めて「エディタで開く」 が押せる。
//
// **手で書かず、組み立て済みの図から機械で出した**。 110 件を手で写すと必ずずれる。
// 実際、先に手で書いた 30 件は図とずれていた = 縦列の幅と見出し、箱の上の小見出し、
// 段の札が落ちていて、コードのタブに **別の図になる記法** が出ていた。
//
// 出した記法は `textDslToDiagram` と `jsonToDiagram` に通して同じ図になることを確かめてから
// 貼っており、以降は一致検査 (`lib/catalog-source-parity.test.tsx`) が骨格まで突き合わせる。
//
// 出す経路は repo に残していない。 1 度きりの生成で、残すべき成果物は記法そのものだから。
// 記法を直したら検査が落ちるので、以降は記法が正になる。
//
// **図は組み立て API のまま残す**。 記法から組み立て直すと図の識別子が題から導かれ、
// 一覧と検索に出る文字列が変わる。

export const sourceYaml__kindActor = `title: "kind: actor (外部主体)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 42

actors:
  - 利用者: { kind: actor, lane: l, stack: 0, eyebrow: "外部主体", value: "{v} 人" }

animation:
  - step: "actor" 1.5s
    focus: ["利用者"]
    badge: "動作中"
    description: "外から関わる主体 (利用者や外部の仕組み)。 値の欄に数を出せる。"
  - step: "actor の数が動く" 1.5s
    focus: ["利用者"]
    tween:
      v: 42 -> 137
    badge: "動作中"
    description: "値の欄が段の中で動く。 この欄を描くのは actor だけ。"
`;

export const sourceJson__kindActor = `{
  "title": "kind: actor (外部主体)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "利用者",
      "kind": "actor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "外部主体",
      "value": "{v} 人"
    }
  ],
  "flow": [],
  "states": { "v": 42 },
  "animation": [
    {
      "step": "actor",
      "duration": 1.5,
      "focus": ["利用者"],
      "badge": "動作中",
      "body": "外から関わる主体 (利用者や外部の仕組み)。 値の欄に数を出せる。"
    },
    {
      "step": "actor の数が動く",
      "duration": 1.5,
      "focus": ["利用者"],
      "tween": { "v": [42, 137] },
      "badge": "動作中",
      "body": "値の欄が段の中で動く。 この欄を描くのは actor だけ。"
    }
  ]
}`;

export const sourceYaml__kindFunction = `title: "kind: function (関数呼び出し)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - 注文を受ける(要求): { kind: function, lane: l, stack: 0, eyebrow: "関数呼び出し", subtitle: "-> 注文か失敗 · 呼出 {v} 回" }

animation:
  - step: "function" 1.5s
    focus: ["注文を受ける(要求)"]
    badge: "動作中"
    description: "処理を受け持つ関数。 題を等幅の字で書き、副題に戻り値を書いて署名に見せる。"
  - step: "function の数が動く" 1.5s
    focus: ["注文を受ける(要求)"]
    tween:
      v: 12 -> 480
    badge: "動作中"
    description: "副題の呼出回数が段の中で動く。 署名の形は変えない。"
`;

export const sourceJson__kindFunction = `{
  "title": "kind: function (関数呼び出し)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "注文を受ける(要求)",
      "kind": "function",
      "lane": "l",
      "stack": 0,
      "eyebrow": "関数呼び出し",
      "subtitle": "-> 注文か失敗 · 呼出 {v} 回"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "function",
      "duration": 1.5,
      "focus": ["注文を受ける(要求)"],
      "badge": "動作中",
      "body": "処理を受け持つ関数。 題を等幅の字で書き、副題に戻り値を書いて署名に見せる。"
    },
    {
      "step": "function の数が動く",
      "duration": 1.5,
      "focus": ["注文を受ける(要求)"],
      "tween": { "v": [12, 480] },
      "badge": "動作中",
      "body": "副題の呼出回数が段の中で動く。 署名の形は変えない。"
    }
  ]
}`;

export const sourceYaml__kindStorage = `title: "kind: storage (保存データ)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 1200

actors:
  - 利用者の表: { kind: storage, lane: l, stack: 0, eyebrow: "保存データ", rows: ["番号: 主キー", "メール: 文字列", "行数: {v}"] }

animation:
  - step: "storage" 1.5s
    focus: ["利用者の表"]
    badge: "動作中"
    description: "DB の表。 列を rows に 1 行ずつ書く。"
  - step: "storage の数が動く" 1.5s
    focus: ["利用者の表"]
    tween:
      v: 1200 -> 8400
    badge: "動作中"
    description: "行の数が段の中で動く。 行も同じ経路で置換される。"
`;

export const sourceJson__kindStorage = `{
  "title": "kind: storage (保存データ)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "利用者の表",
      "kind": "storage",
      "lane": "l",
      "stack": 0,
      "eyebrow": "保存データ",
      "rows": ["番号: 主キー", "メール: 文字列", "行数: {v}"]
    }
  ],
  "flow": [],
  "states": { "v": 1200 },
  "animation": [
    {
      "step": "storage",
      "duration": 1.5,
      "focus": ["利用者の表"],
      "badge": "動作中",
      "body": "DB の表。 列を rows に 1 行ずつ書く。"
    },
    {
      "step": "storage の数が動く",
      "duration": 1.5,
      "focus": ["利用者の表"],
      "tween": { "v": [1200, 8400] },
      "badge": "動作中",
      "body": "行の数が段の中で動く。 行も同じ経路で置換される。"
    }
  ]
}`;

export const sourceYaml__kindEvent = `title: "kind: event (イベントログ)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - 注文ができた: { kind: event, lane: l, stack: 0, eyebrow: "イベント", subtitle: "(注文, 利用者) · 毎秒 {v} 件" }

animation:
  - step: "event" 1.5s
    focus: ["注文ができた"]
    badge: "動作中"
    description: "発行された出来事。 出来事を配る経路や記録が読む。"
  - step: "event の数が動く" 1.5s
    focus: ["注文ができた"]
    tween:
      v: 3 -> 96
    badge: "動作中"
    description: "副題の発生件数が段の中で動く。 中身の形は変えない。"
`;

export const sourceJson__kindEvent = `{
  "title": "kind: event (イベントログ)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "注文ができた",
      "kind": "event",
      "lane": "l",
      "stack": 0,
      "eyebrow": "イベント",
      "subtitle": "(注文, 利用者) · 毎秒 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "event",
      "duration": 1.5,
      "focus": ["注文ができた"],
      "badge": "動作中",
      "body": "発行された出来事。 出来事を配る経路や記録が読む。"
    },
    {
      "step": "event の数が動く",
      "duration": 1.5,
      "focus": ["注文ができた"],
      "tween": { "v": [3, 96] },
      "badge": "動作中",
      "body": "副題の発生件数が段の中で動く。 中身の形は変えない。"
    }
  ]
}`;

export const sourceYaml__kindCard = `title: "kind: card (汎用情報)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2

actors:
  - 備考: { kind: card, lane: l, stack: 0, eyebrow: "汎用カード", subtitle: "汎用の説明カード · {v} 件" }

animation:
  - step: "card" 1.5s
    focus: ["備考"]
    badge: "動作中"
    description: "kind に当てはまらない補足情報。"
  - step: "card の数が動く" 1.5s
    focus: ["備考"]
    tween:
      v: 2 -> 31
    badge: "動作中"
    description: "副題の件数が段の中で動く。 説明の文は変えない。"
`;

export const sourceJson__kindCard = `{
  "title": "kind: card (汎用情報)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "備考",
      "kind": "card",
      "lane": "l",
      "stack": 0,
      "eyebrow": "汎用カード",
      "subtitle": "汎用の説明カード · {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 2 },
  "animation": [
    {
      "step": "card",
      "duration": 1.5,
      "focus": ["備考"],
      "badge": "動作中",
      "body": "kind に当てはまらない補足情報。"
    },
    {
      "step": "card の数が動く",
      "duration": 1.5,
      "focus": ["備考"],
      "tween": { "v": [2, 31] },
      "badge": "動作中",
      "body": "副題の件数が段の中で動く。 説明の文は変えない。"
    }
  ]
}`;

export const sourceYaml__laneSingle = `title: "lane: 1 本"
type: flow

lanes:
  only: { x: 0, width: 440 }

actors:
  - A: { kind: actor, lane: only, stack: 0 }
  - B: { kind: function, lane: only, stack: 1 }

animation:
  - step: "1 lane" 1.5s
    focus: ["A", "B"]
    badge: "正常"
    description: "1 本の lane に node を縦に積む。"
`;

export const sourceJson__laneSingle = `{
  "title": "lane: 1 本",
  "type": "flow",
  "lanes": {
    "only": { "x": 0, "width": 440 }
  },
  "actors": [
    { "name": "A", "kind": "actor", "lane": "only", "stack": 0 },
    { "name": "B", "kind": "function", "lane": "only", "stack": 1 }
  ],
  "flow": [],
  "animation": [
    {
      "step": "1 lane",
      "duration": 1.5,
      "focus": ["A", "B"],
      "badge": "正常",
      "body": "1 本の lane に node を縦に積む。"
    }
  ]
}`;

export const sourceYaml__laneMulti = `title: "lane: 3 本 (横並び)"
type: flow

lanes:
  l1: { width: 240 }
  l2: { width: 240 }
  l3: { width: 240 }

actors:
  - A: { kind: function, lane: l1, stack: 0 }
  - B: { kind: function, lane: l2, stack: 0 }
  - C: { kind: event, lane: l3, stack: 0 }

animation:
  - step: "3 lane" 1.5s
    focus: ["A", "B", "C"]
    badge: "正常"
    description: "lane を横に並べて役割を分ける (利用者 / 処理 / 出来事)。"
`;

export const sourceJson__laneMulti = `{
  "title": "lane: 3 本 (横並び)",
  "type": "flow",
  "lanes": {
    "l1": { "width": 240 },
    "l2": { "width": 240 },
    "l3": { "width": 240 }
  },
  "actors": [
    { "name": "A", "kind": "function", "lane": "l1", "stack": 0 },
    { "name": "B", "kind": "function", "lane": "l2", "stack": 0 },
    { "name": "C", "kind": "event", "lane": "l3", "stack": 0 }
  ],
  "flow": [],
  "animation": [
    {
      "step": "3 lane",
      "duration": 1.5,
      "focus": ["A", "B", "C"],
      "badge": "正常",
      "body": "lane を横に並べて役割を分ける (利用者 / 処理 / 出来事)。"
    }
  ]
}`;

export const sourceYaml__laneContain = `title: "lane: contain (枠囲み)"
type: flow

lanes:
  inner: { x: 0, width: 440, contain: true }

actors:
  - 内部の処理: { kind: function, lane: inner, stack: 0 }
  - 保存先: { kind: storage, lane: inner, stack: 1 }

animation:
  - step: "contain" 1.5s
    focus: ["内部の処理", "保存先"]
    badge: "正常"
    description: "lane に contain を付けると、 lane ごと枠で囲んで内と外の境を示す。"
`;

export const sourceJson__laneContain = `{
  "title": "lane: contain (枠囲み)",
  "type": "flow",
  "lanes": {
    "inner": { "x": 0, "width": 440, "contain": true }
  },
  "actors": [
    { "name": "内部の処理", "kind": "function", "lane": "inner", "stack": 0 },
    { "name": "保存先", "kind": "storage", "lane": "inner", "stack": 1 }
  ],
  "flow": [],
  "animation": [
    {
      "step": "contain",
      "duration": 1.5,
      "focus": ["内部の処理", "保存先"],
      "badge": "正常",
      "body": "lane に contain を付けると、 lane ごと枠で囲んで内と外の境を示す。"
    }
  ]
}`;

export const sourceYaml__stackPair = `title: "stack: 縦 2 段"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 上: { kind: actor, lane: l, stack: 0 }
  - 下: { kind: actor, lane: l, stack: 1 }

animation:
  - step: "stack 0/1" 1.5s
    focus: ["上", "下"]
    badge: "正常"
    description: "同じ lane の中で、 stack の番号が縦の並びを決める。"
`;

export const sourceJson__stackPair = `{
  "title": "stack: 縦 2 段",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    { "name": "上", "kind": "actor", "lane": "l", "stack": 0 },
    { "name": "下", "kind": "actor", "lane": "l", "stack": 1 }
  ],
  "flow": [],
  "animation": [
    {
      "step": "stack 0/1",
      "duration": 1.5,
      "focus": ["上", "下"],
      "badge": "正常",
      "body": "同じ lane の中で、 stack の番号が縦の並びを決める。"
    }
  ]
}`;

export const sourceYaml__stackTriple = `title: "stack: 縦 3 段"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - stack 0: { kind: actor, lane: l, stack: 0 }
  - stack 1: { kind: function, lane: l, stack: 1 }
  - stack 2: { kind: storage, lane: l, stack: 2 }

animation:
  - step: "stack 0/1/2" 1.5s
    focus: ["stack 0", "stack 1", "stack 2"]
    badge: "正常"
    description: "stack を増やすと縦に伸びる。 間隔は row_gap が自動で決める。"
`;

export const sourceJson__stackTriple = `{
  "title": "stack: 縦 3 段",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    { "name": "stack 0", "kind": "actor", "lane": "l", "stack": 0 },
    { "name": "stack 1", "kind": "function", "lane": "l", "stack": 1 },
    { "name": "stack 2", "kind": "storage", "lane": "l", "stack": 2 }
  ],
  "flow": [],
  "animation": [
    {
      "step": "stack 0/1/2",
      "duration": 1.5,
      "focus": ["stack 0", "stack 1", "stack 2"],
      "badge": "正常",
      "body": "stack を増やすと縦に伸びる。 間隔は row_gap が自動で決める。"
    }
  ]
}`;

export const sourceYaml__shapeFile = `title: "shape: file (ドッグイア rect、 ファイル / document 表現)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2

actors:
  - 月次報告書: { kind: shape-file, lane: l, stack: 0, eyebrow: "ファイル", subtitle: "PDF · {v} MB", posW: 272 }

animation:
  - step: "shape-file" 1.5s
    focus: ["月次報告書"]
    badge: "shape"
    description: "右上の角を折り返した四角。 ファイルや文書、報告書を表す。"
  - step: "shape-file の数が動く" 1.5s
    focus: ["月次報告書"]
    tween:
      v: 2 -> 9
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeFile = `{
  "title": "shape: file (ドッグイア rect、 ファイル / document 表現)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "月次報告書",
      "kind": "shape-file",
      "lane": "l",
      "stack": 0,
      "eyebrow": "ファイル",
      "subtitle": "PDF · {v} MB",
      "posW": 272
    }
  ],
  "flow": [],
  "states": { "v": 2 },
  "animation": [
    {
      "step": "shape-file",
      "duration": 1.5,
      "focus": ["月次報告書"],
      "badge": "shape",
      "body": "右上の角を折り返した四角。 ファイルや文書、報告書を表す。"
    },
    {
      "step": "shape-file の数が動く",
      "duration": 1.5,
      "focus": ["月次報告書"],
      "tween": { "v": [2, 9] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeFolder = `title: "shape: folder (tab 付き rect、 フォルダ / パッケージ)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 24

actors:
  - 設計資料/: { kind: shape-folder, lane: l, stack: 0, eyebrow: "フォルダ", subtitle: "ファイル {v} 件" }

animation:
  - step: "shape-folder" 1.5s
    focus: ["設計資料/"]
    badge: "shape"
    description: "上の縁につまみの付いた四角。 フォルダや、部品をまとめた単位を表す。"
  - step: "shape-folder の数が動く" 1.5s
    focus: ["設計資料/"]
    tween:
      v: 24 -> 118
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeFolder = `{
  "title": "shape: folder (tab 付き rect、 フォルダ / パッケージ)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "設計資料/",
      "kind": "shape-folder",
      "lane": "l",
      "stack": 0,
      "eyebrow": "フォルダ",
      "subtitle": "ファイル {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 24 },
  "animation": [
    {
      "step": "shape-folder",
      "duration": 1.5,
      "focus": ["設計資料/"],
      "badge": "shape",
      "body": "上の縁につまみの付いた四角。 フォルダや、部品をまとめた単位を表す。"
    },
    {
      "step": "shape-folder の数が動く",
      "duration": 1.5,
      "focus": ["設計資料/"],
      "tween": { "v": [24, 118] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeCloud = `title: "shape: cloud (5 円 合成、 クラウド / SaaS 表現)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - AWS: { kind: shape-cloud, lane: l, stack: 0, eyebrow: "クラウド", subtitle: "{v} リージョン" }

animation:
  - step: "shape-cloud" 1.5s
    focus: ["AWS"]
    badge: "shape"
    description: "5 つの円を重ねた雲の形。 クラウドの事業者や、外から呼ぶ API を表す。"
  - step: "shape-cloud の数が動く" 1.5s
    focus: ["AWS"]
    tween:
      v: 3 -> 12
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeCloud = `{
  "title": "shape: cloud (5 円 合成、 クラウド / SaaS 表現)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "AWS",
      "kind": "shape-cloud",
      "lane": "l",
      "stack": 0,
      "eyebrow": "クラウド",
      "subtitle": "{v} リージョン"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-cloud",
      "duration": 1.5,
      "focus": ["AWS"],
      "badge": "shape",
      "body": "5 つの円を重ねた雲の形。 クラウドの事業者や、外から呼ぶ API を表す。"
    },
    {
      "step": "shape-cloud の数が動く",
      "duration": 1.5,
      "focus": ["AWS"],
      "tween": { "v": [3, 12] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeCylinder = `title: "shape: cylinder (円柱、 DB / storage 表現)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 120

actors:
  - PostgreSQL: { kind: shape-cylinder, lane: l, stack: 0, eyebrow: "データベース", subtitle: "{v} GB 使用", posW: 272 }

animation:
  - step: "shape-cylinder" 1.5s
    focus: ["PostgreSQL"]
    badge: "shape"
    description: "円柱 (上面と側面と底の楕円)。 DB や、消えずに残る保存先を表す。"
  - step: "shape-cylinder の数が動く" 1.5s
    focus: ["PostgreSQL"]
    tween:
      v: 120 -> 480
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeCylinder = `{
  "title": "shape: cylinder (円柱、 DB / storage 表現)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "PostgreSQL",
      "kind": "shape-cylinder",
      "lane": "l",
      "stack": 0,
      "eyebrow": "データベース",
      "subtitle": "{v} GB 使用",
      "posW": 272
    }
  ],
  "flow": [],
  "states": { "v": 120 },
  "animation": [
    {
      "step": "shape-cylinder",
      "duration": 1.5,
      "focus": ["PostgreSQL"],
      "badge": "shape",
      "body": "円柱 (上面と側面と底の楕円)。 DB や、消えずに残る保存先を表す。"
    },
    {
      "step": "shape-cylinder の数が動く",
      "duration": 1.5,
      "focus": ["PostgreSQL"],
      "tween": { "v": [120, 480] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeHexagon = `title: "shape: hexagon (六角形、 component / service)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 60

actors:
  - 認証の役務: { kind: shape-hexagon, lane: l, stack: 0, eyebrow: "部品", subtitle: "毎秒 {v} 件", posW: 294 }

animation:
  - step: "shape-hexagon" 1.5s
    focus: ["認証の役務"]
    badge: "shape"
    description: "六角形。 小さく分けた役務や、業務ごとの部品を表す。"
  - step: "shape-hexagon の数が動く" 1.5s
    focus: ["認証の役務"]
    tween:
      v: 60 -> 940
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeHexagon = `{
  "title": "shape: hexagon (六角形、 component / service)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "認証の役務",
      "kind": "shape-hexagon",
      "lane": "l",
      "stack": 0,
      "eyebrow": "部品",
      "subtitle": "毎秒 {v} 件",
      "posW": 294
    }
  ],
  "flow": [],
  "states": { "v": 60 },
  "animation": [
    {
      "step": "shape-hexagon",
      "duration": 1.5,
      "focus": ["認証の役務"],
      "badge": "shape",
      "body": "六角形。 小さく分けた役務や、業務ごとの部品を表す。"
    },
    {
      "step": "shape-hexagon の数が動く",
      "duration": 1.5,
      "focus": ["認証の役務"],
      "tween": { "v": [60, 940] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeDiamond = `title: "shape: diamond (ひし形、 decision / 判定)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 40

actors:
  - 正しい?: { kind: shape-diamond, lane: l, stack: 0, eyebrow: "判定", subtitle: "はい {v}%" }

animation:
  - step: "shape-diamond" 1.5s
    focus: ["正しい?"]
    badge: "shape"
    description: "ひし形。 条件で道が分かれる所を表す。"
  - step: "shape-diamond の数が動く" 1.5s
    focus: ["正しい?"]
    tween:
      v: 40 -> 92
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeDiamond = `{
  "title": "shape: diamond (ひし形、 decision / 判定)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "正しい?",
      "kind": "shape-diamond",
      "lane": "l",
      "stack": 0,
      "eyebrow": "判定",
      "subtitle": "はい {v}%"
    }
  ],
  "flow": [],
  "states": { "v": 40 },
  "animation": [
    {
      "step": "shape-diamond",
      "duration": 1.5,
      "focus": ["正しい?"],
      "badge": "shape",
      "body": "ひし形。 条件で道が分かれる所を表す。"
    },
    {
      "step": "shape-diamond の数が動く",
      "duration": 1.5,
      "focus": ["正しい?"],
      "tween": { "v": [40, 92] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeStack = `title: "shape: stack (重ね rect、 layer / history)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - v3.2.0: { kind: shape-stack, lane: l, stack: 0, eyebrow: "公開版", subtitle: "{v} 版" }

animation:
  - step: "shape-stack" 1.5s
    focus: ["v3.2.0"]
    badge: "shape"
    description: "3 枚重ねた四角。 版の履歴や層、ある時点の写しの束を表す。"
  - step: "shape-stack の数が動く" 1.5s
    focus: ["v3.2.0"]
    tween:
      v: 3 -> 14
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeStack = `{
  "title": "shape: stack (重ね rect、 layer / history)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "v3.2.0",
      "kind": "shape-stack",
      "lane": "l",
      "stack": 0,
      "eyebrow": "公開版",
      "subtitle": "{v} 版"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-stack",
      "duration": 1.5,
      "focus": ["v3.2.0"],
      "badge": "shape",
      "body": "3 枚重ねた四角。 版の履歴や層、ある時点の写しの束を表す。"
    },
    {
      "step": "shape-stack の数が動く",
      "duration": 1.5,
      "focus": ["v3.2.0"],
      "tween": { "v": [3, 14] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapePerson = `title: "shape: person (人型 figure、 actor / user 表現)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2

actors:
  - エンドユーザ: { kind: shape-person, lane: l, stack: 0, eyebrow: "人物", subtitle: "{v} 操作" }

animation:
  - step: "shape-person" 1.5s
    focus: ["エンドユーザ"]
    badge: "shape"
    description: "人の形 (丸い頭と台形の胴、曲げた腕)。 登場する人や利用者、担当者を表す。"
  - step: "shape-person の数が動く" 1.5s
    focus: ["エンドユーザ"]
    tween:
      v: 2 -> 21
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapePerson = `{
  "title": "shape: person (人型 figure、 actor / user 表現)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "エンドユーザ",
      "kind": "shape-person",
      "lane": "l",
      "stack": 0,
      "eyebrow": "人物",
      "subtitle": "{v} 操作"
    }
  ],
  "flow": [],
  "states": { "v": 2 },
  "animation": [
    {
      "step": "shape-person",
      "duration": 1.5,
      "focus": ["エンドユーザ"],
      "badge": "shape",
      "body": "人の形 (丸い頭と台形の胴、曲げた腕)。 登場する人や利用者、担当者を表す。"
    },
    {
      "step": "shape-person の数が動く",
      "duration": 1.5,
      "focus": ["エンドユーザ"],
      "tween": { "v": [2, 21] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeWindow = `title: "shape: window (GUI アプリ、 traffic lights + body)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 1

actors:
  - ダッシュボード: { kind: shape-window, lane: l, stack: 0, eyebrow: "アプリの画面", subtitle: "開いた画面 {v}" }

animation:
  - step: "shape-window" 1.5s
    focus: ["ダッシュボード"]
    badge: "shape"
    description: "題の帯と 3 色の丸ボタン、本体。 アプリの画面や、閲覧ソフトで開いた画面を表す。"
  - step: "shape-window の数が動く" 1.5s
    focus: ["ダッシュボード"]
    tween:
      v: 1 -> 6
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeWindow = `{
  "title": "shape: window (GUI アプリ、 traffic lights + body)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ダッシュボード",
      "kind": "shape-window",
      "lane": "l",
      "stack": 0,
      "eyebrow": "アプリの画面",
      "subtitle": "開いた画面 {v}"
    }
  ],
  "flow": [],
  "states": { "v": 1 },
  "animation": [
    {
      "step": "shape-window",
      "duration": 1.5,
      "focus": ["ダッシュボード"],
      "badge": "shape",
      "body": "題の帯と 3 色の丸ボタン、本体。 アプリの画面や、閲覧ソフトで開いた画面を表す。"
    },
    {
      "step": "shape-window の数が動く",
      "duration": 1.5,
      "focus": ["ダッシュボード"],
      "tween": { "v": [1, 6] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeTerminal = `title: "shape: terminal (CLI shell、 mac bar + prompt)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - zsh: { kind: shape-terminal, lane: l, stack: 0, eyebrow: "端末", subtitle: "命令を打つ画面" }

animation:
  - step: "shape-terminal" 1.5s
    focus: ["zsh"]
    badge: "shape"
    description: "上の帯と $ の入力待ち、点滅する印。 命令を打つ画面や、遠くの機械への接続、手順の自動実行を表す。"
`;

export const sourceJson__shapeTerminal = `{
  "title": "shape: terminal (CLI shell、 mac bar + prompt)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "zsh",
      "kind": "shape-terminal",
      "lane": "l",
      "stack": 0,
      "eyebrow": "端末",
      "subtitle": "命令を打つ画面"
    }
  ],
  "flow": [],
  "animation": [
    {
      "step": "shape-terminal",
      "duration": 1.5,
      "focus": ["zsh"],
      "badge": "shape",
      "body": "上の帯と $ の入力待ち、点滅する印。 命令を打つ画面や、遠くの機械への接続、手順の自動実行を表す。"
    }
  ]
}`;

export const sourceYaml__shapeCodeBlock = `title: "shape: code-block (snippet、 editor tab + 4 syntax lines)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 共通の処理: { kind: shape-code-block, lane: l, stack: 0, eyebrow: "コード", subtitle: "3 行の抜粋" }

animation:
  - step: "shape-code-block" 1.5s
    focus: ["共通の処理"]
    badge: "shape"
    description: "編集画面の見出しと行番号の欄、色分けした 4 行。 コードの抜粋や、実装そのものを表す。"
`;

export const sourceJson__shapeCodeBlock = `{
  "title": "shape: code-block (snippet、 editor tab + 4 syntax lines)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "共通の処理",
      "kind": "shape-code-block",
      "lane": "l",
      "stack": 0,
      "eyebrow": "コード",
      "subtitle": "3 行の抜粋"
    }
  ],
  "flow": [],
  "animation": [
    {
      "step": "shape-code-block",
      "duration": 1.5,
      "focus": ["共通の処理"],
      "badge": "shape",
      "body": "編集画面の見出しと行番号の欄、色分けした 4 行。 コードの抜粋や、実装そのものを表す。"
    }
  ]
}`;

export const sourceYaml__shapeKanbanCard = `title: "shape: kanban-card (ticket + priority + tags)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - 課題 #1111: { kind: shape-kanban-card, lane: l, stack: 0, eyebrow: "作業中", subtitle: "形で見せる種別" }

animation:
  - step: "shape-kanban-card" 1.5s
    focus: ["課題 #1111"]
    badge: "shape"
    description: "優先度の帯と番号、状態の札、題、分類の札、担当者の顔。 看板に貼る作業札や課題を表す。"
`;

export const sourceJson__shapeKanbanCard = `{
  "title": "shape: kanban-card (ticket + priority + tags)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "課題 #1111",
      "kind": "shape-kanban-card",
      "lane": "l",
      "stack": 0,
      "eyebrow": "作業中",
      "subtitle": "形で見せる種別"
    }
  ],
  "flow": [],
  "animation": [
    {
      "step": "shape-kanban-card",
      "duration": 1.5,
      "focus": ["課題 #1111"],
      "badge": "shape",
      "body": "優先度の帯と番号、状態の札、題、分類の札、担当者の顔。 看板に貼る作業札や課題を表す。"
    }
  ]
}`;

export const sourceYaml__shapeMessageBubble = `title: "shape: message-bubble (吹き出し、 rounded rect + tail)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 0

actors:
  - 了解しました: { kind: shape-message-bubble, lane: l, stack: 0, eyebrow: "発言", subtitle: "未読 {v}" }

animation:
  - step: "shape-message-bubble" 1.5s
    focus: ["了解しました"]
    badge: "shape"
    description: "角の丸い四角と、左下のしっぽ。 会話の発言や、変更への意見、通知を表す。"
  - step: "shape-message-bubble の数が動く" 1.5s
    focus: ["了解しました"]
    tween:
      v: 0 -> 9
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeMessageBubble = `{
  "title": "shape: message-bubble (吹き出し、 rounded rect + tail)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "了解しました",
      "kind": "shape-message-bubble",
      "lane": "l",
      "stack": 0,
      "eyebrow": "発言",
      "subtitle": "未読 {v}"
    }
  ],
  "flow": [],
  "states": { "v": 0 },
  "animation": [
    {
      "step": "shape-message-bubble",
      "duration": 1.5,
      "focus": ["了解しました"],
      "badge": "shape",
      "body": "角の丸い四角と、左下のしっぽ。 会話の発言や、変更への意見、通知を表す。"
    },
    {
      "step": "shape-message-bubble の数が動く",
      "duration": 1.5,
      "focus": ["了解しました"],
      "tween": { "v": [0, 9] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeGear = `title: "shape: gear (歯車、 設定 / 処理エンジン)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 8

actors:
  - 環境設定: { kind: shape-gear, lane: l, stack: 0, eyebrow: "構成", subtitle: "設定 {v} 件" }

animation:
  - step: "shape-gear" 1.5s
    focus: ["環境設定"]
    badge: "shape"
    description: "歯が 12 枚の大きな歯車と、4 本の腕、中心の軸、留め具。 設定や、処理を回す仕組みを表す。"
  - step: "shape-gear の数が動く" 1.5s
    focus: ["環境設定"]
    tween:
      v: 8 -> 26
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeGear = `{
  "title": "shape: gear (歯車、 設定 / 処理エンジン)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "環境設定",
      "kind": "shape-gear",
      "lane": "l",
      "stack": 0,
      "eyebrow": "構成",
      "subtitle": "設定 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 8 },
  "animation": [
    {
      "step": "shape-gear",
      "duration": 1.5,
      "focus": ["環境設定"],
      "badge": "shape",
      "body": "歯が 12 枚の大きな歯車と、4 本の腕、中心の軸、留め具。 設定や、処理を回す仕組みを表す。"
    },
    {
      "step": "shape-gear の数が動く",
      "duration": 1.5,
      "focus": ["環境設定"],
      "tween": { "v": [8, 26] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeServerRack = `title: "shape: server-rack (19 inch rack、 物理サーバ)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - 公開用 1 号機: { kind: shape-server-rack, lane: l, stack: 0, eyebrow: "サーバ", subtitle: "{v} U 分を使用" }

animation:
  - step: "shape-server-rack" 1.5s
    focus: ["公開用 1 号機"]
    badge: "shape"
    description: "外枠と 3 段の差し込み口を持つ棚。 実機のサーバや、データセンター、自社に置く機器を表す。"
  - step: "shape-server-rack の数が動く" 1.5s
    focus: ["公開用 1 号機"]
    tween:
      v: 3 -> 12
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeServerRack = `{
  "title": "shape: server-rack (19 inch rack、 物理サーバ)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "公開用 1 号機",
      "kind": "shape-server-rack",
      "lane": "l",
      "stack": 0,
      "eyebrow": "サーバ",
      "subtitle": "{v} U 分を使用"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-server-rack",
      "duration": 1.5,
      "focus": ["公開用 1 号機"],
      "badge": "shape",
      "body": "外枠と 3 段の差し込み口を持つ棚。 実機のサーバや、データセンター、自社に置く機器を表す。"
    },
    {
      "step": "shape-server-rack の数が動く",
      "duration": 1.5,
      "focus": ["公開用 1 号機"],
      "tween": { "v": [3, 12] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeNetworkNode = `title: "shape: network-node (network hub、 router / switch)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - 基幹ルータ: { kind: shape-network-node, lane: l, stack: 0, eyebrow: "通信網", subtitle: "L3 · 接続 {v} 台" }

animation:
  - step: "shape-network-node" 1.5s
    focus: ["基幹ルータ"]
    badge: "shape"
    description: "中央の円と 4 方向の線。 通信を中継する機器 (経路を選ぶもの、線を束ねるもの) を表す。"
  - step: "shape-network-node の数が動く" 1.5s
    focus: ["基幹ルータ"]
    tween:
      v: 12 -> 96
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeNetworkNode = `{
  "title": "shape: network-node (network hub、 router / switch)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "基幹ルータ",
      "kind": "shape-network-node",
      "lane": "l",
      "stack": 0,
      "eyebrow": "通信網",
      "subtitle": "L3 · 接続 {v} 台"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "shape-network-node",
      "duration": 1.5,
      "focus": ["基幹ルータ"],
      "badge": "shape",
      "body": "中央の円と 4 方向の線。 通信を中継する機器 (経路を選ぶもの、線を束ねるもの) を表す。"
    },
    {
      "step": "shape-network-node の数が動く",
      "duration": 1.5,
      "focus": ["基幹ルータ"],
      "tween": { "v": [12, 96] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeMobileDevice = `title: "shape: mobile-device (スマホ、 モバイル端末)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 200

actors:
  - iPhone: { kind: shape-mobile-device, lane: l, stack: 0, eyebrow: "携帯端末", subtitle: "{v} 台が稼働" }

animation:
  - step: "shape-mobile-device" 1.5s
    focus: ["iPhone"]
    badge: "shape"
    description: "上の話し口と画面、下のボタンを持つスマホ。 携帯のアプリや、利用者の手元の端末を表す。"
  - step: "shape-mobile-device の数が動く" 1.5s
    focus: ["iPhone"]
    tween:
      v: 200 -> 1800
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeMobileDevice = `{
  "title": "shape: mobile-device (スマホ、 モバイル端末)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "iPhone",
      "kind": "shape-mobile-device",
      "lane": "l",
      "stack": 0,
      "eyebrow": "携帯端末",
      "subtitle": "{v} 台が稼働"
    }
  ],
  "flow": [],
  "states": { "v": 200 },
  "animation": [
    {
      "step": "shape-mobile-device",
      "duration": 1.5,
      "focus": ["iPhone"],
      "badge": "shape",
      "body": "上の話し口と画面、下のボタンを持つスマホ。 携帯のアプリや、利用者の手元の端末を表す。"
    },
    {
      "step": "shape-mobile-device の数が動く",
      "duration": 1.5,
      "focus": ["iPhone"],
      "tween": { "v": [200, 1800] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeIotSensor = `title: "shape: iot-sensor (IoT beacon、 電波発信)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 18

actors:
  - 温度センサー: { kind: shape-iot-sensor, lane: l, stack: 0, eyebrow: "計測機器", subtitle: "無線 · {v} 度" }

animation:
  - step: "shape-iot-sensor" 1.5s
    focus: ["温度センサー"]
    badge: "shape"
    description: "計測器の円と 3 重の波紋。 電波で知らせる計測器や、ものにつないだ端末を表す。"
  - step: "shape-iot-sensor の数が動く" 1.5s
    focus: ["温度センサー"]
    tween:
      v: 18 -> 34
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeIotSensor = `{
  "title": "shape: iot-sensor (IoT beacon、 電波発信)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "温度センサー",
      "kind": "shape-iot-sensor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "計測機器",
      "subtitle": "無線 · {v} 度"
    }
  ],
  "flow": [],
  "states": { "v": 18 },
  "animation": [
    {
      "step": "shape-iot-sensor",
      "duration": 1.5,
      "focus": ["温度センサー"],
      "badge": "shape",
      "body": "計測器の円と 3 重の波紋。 電波で知らせる計測器や、ものにつないだ端末を表す。"
    },
    {
      "step": "shape-iot-sensor の数が動く",
      "duration": 1.5,
      "focus": ["温度センサー"],
      "tween": { "v": [18, 34] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeRobotArm = `title: "shape: robot-arm (ロボアーム、 産業機器)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 40

actors:
  - 組立ライン: { kind: shape-robot-arm, lane: l, stack: 0, eyebrow: "ロボット", subtitle: "6 軸 · {v} 個/時" }

animation:
  - step: "shape-robot-arm" 1.5s
    focus: ["組立ライン"]
    badge: "shape"
    description: "台座と 2 つの関節、先のつかみ手を持つ腕。 産業機器や、自動にした工程、制御する対象を表す。"
  - step: "shape-robot-arm の数が動く" 1.5s
    focus: ["組立ライン"]
    tween:
      v: 40 -> 260
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeRobotArm = `{
  "title": "shape: robot-arm (ロボアーム、 産業機器)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "組立ライン",
      "kind": "shape-robot-arm",
      "lane": "l",
      "stack": 0,
      "eyebrow": "ロボット",
      "subtitle": "6 軸 · {v} 個/時"
    }
  ],
  "flow": [],
  "states": { "v": 40 },
  "animation": [
    {
      "step": "shape-robot-arm",
      "duration": 1.5,
      "focus": ["組立ライン"],
      "badge": "shape",
      "body": "台座と 2 つの関節、先のつかみ手を持つ腕。 産業機器や、自動にした工程、制御する対象を表す。"
    },
    {
      "step": "shape-robot-arm の数が動く",
      "duration": 1.5,
      "focus": ["組立ライン"],
      "tween": { "v": [40, 260] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeSatellite = `title: "shape: satellite (人工衛星、 エッジ通信)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 340

actors:
  - Starlink: { kind: shape-satellite, lane: l, stack: 0, eyebrow: "人工衛星", subtitle: "低軌道 · 高度 {v} km" }

animation:
  - step: "shape-satellite" 1.5s
    focus: ["Starlink"]
    badge: "shape"
    description: "中央の本体と左右の太陽電池板、アンテナ。 人工衛星や、宇宙を経由する通信を表す。"
  - step: "shape-satellite の数が動く" 1.5s
    focus: ["Starlink"]
    tween:
      v: 340 -> 550
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeSatellite = `{
  "title": "shape: satellite (人工衛星、 エッジ通信)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Starlink",
      "kind": "shape-satellite",
      "lane": "l",
      "stack": 0,
      "eyebrow": "人工衛星",
      "subtitle": "低軌道 · 高度 {v} km"
    }
  ],
  "flow": [],
  "states": { "v": 340 },
  "animation": [
    {
      "step": "shape-satellite",
      "duration": 1.5,
      "focus": ["Starlink"],
      "badge": "shape",
      "body": "中央の本体と左右の太陽電池板、アンテナ。 人工衛星や、宇宙を経由する通信を表す。"
    },
    {
      "step": "shape-satellite の数が動く",
      "duration": 1.5,
      "focus": ["Starlink"],
      "tween": { "v": [340, 550] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeSmartContract = `title: "shape: smart-contract (契約書 + 歯車 = 自動実行)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - 預かり契約: { kind: shape-smart-contract, lane: l, stack: 0, eyebrow: "契約", subtitle: "0.8.24 · 呼出 {v}" }

animation:
  - step: "shape-smart-contract" 1.5s
    focus: ["預かり契約"]
    badge: "shape"
    description: "文書と、底の歯車 (自動で動く印)。 自動で動く契約や、参加者で決める組織の規約、条件付きの預かりを表す。"
  - step: "shape-smart-contract の数が動く" 1.5s
    focus: ["預かり契約"]
    tween:
      v: 12 -> 480
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeSmartContract = `{
  "title": "shape: smart-contract (契約書 + 歯車 = 自動実行)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "預かり契約",
      "kind": "shape-smart-contract",
      "lane": "l",
      "stack": 0,
      "eyebrow": "契約",
      "subtitle": "0.8.24 · 呼出 {v}"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "shape-smart-contract",
      "duration": 1.5,
      "focus": ["預かり契約"],
      "badge": "shape",
      "body": "文書と、底の歯車 (自動で動く印)。 自動で動く契約や、参加者で決める組織の規約、条件付きの預かりを表す。"
    },
    {
      "step": "shape-smart-contract の数が動く",
      "duration": 1.5,
      "focus": ["預かり契約"],
      "tween": { "v": [12, 480] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBlockchainBlock = `title: "shape: blockchain-block (連結 3 block + hash pointer)"
type: flow

lanes:
  l: { x: 0, width: 440 }

actors:
  - ブロック #421: { kind: shape-blockchain-block, lane: l, stack: 0, eyebrow: "台帳", subtitle: "0xaf31c9d2..." }

animation:
  - step: "shape-blockchain-block" 1.5s
    focus: ["ブロック #421"]
    badge: "shape"
    description: "3 つのブロックを縦につなぎ、前のブロックの要約値と取引の数を持たせた形。 Ethereum や Bitcoin のブロックを表す。"
`;

export const sourceJson__shapeBlockchainBlock = `{
  "title": "shape: blockchain-block (連結 3 block + hash pointer)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ブロック #421",
      "kind": "shape-blockchain-block",
      "lane": "l",
      "stack": 0,
      "eyebrow": "台帳",
      "subtitle": "0xaf31c9d2..."
    }
  ],
  "flow": [],
  "animation": [
    {
      "step": "shape-blockchain-block",
      "duration": 1.5,
      "focus": ["ブロック #421"],
      "badge": "shape",
      "body": "3 つのブロックを縦につなぎ、前のブロックの要約値と取引の数を持たせた形。 Ethereum や Bitcoin のブロックを表す。"
    }
  ]
}`;

export const sourceYaml__shapeRpcNode = `title: "shape: rpc-node (JSON-RPC node + 6 peers + sync bar)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 90

actors:
  - Alchemy: { kind: shape-rpc-node, lane: l, stack: 0, eyebrow: "RPC の窓口", subtitle: "本番の網 · 毎秒 {v} 件" }

animation:
  - step: "shape-rpc-node" 1.5s
    focus: ["Alchemy"]
    badge: "shape"
    description: "中央の球と周りの 6 つの点、同期の帯。 分散台帳へ問い合わせる窓口を貸す事業者を表す。"
  - step: "shape-rpc-node の数が動く" 1.5s
    focus: ["Alchemy"]
    tween:
      v: 90 -> 1200
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeRpcNode = `{
  "title": "shape: rpc-node (JSON-RPC node + 6 peers + sync bar)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Alchemy",
      "kind": "shape-rpc-node",
      "lane": "l",
      "stack": 0,
      "eyebrow": "RPC の窓口",
      "subtitle": "本番の網 · 毎秒 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 90 },
  "animation": [
    {
      "step": "shape-rpc-node",
      "duration": 1.5,
      "focus": ["Alchemy"],
      "badge": "shape",
      "body": "中央の球と周りの 6 つの点、同期の帯。 分散台帳へ問い合わせる窓口を貸す事業者を表す。"
    },
    {
      "step": "shape-rpc-node の数が動く",
      "duration": 1.5,
      "focus": ["Alchemy"],
      "tween": { "v": [90, 1200] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeWallet = `title: "shape: wallet (財布 + coin + balance display)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 1

actors:
  - MetaMask: { kind: shape-wallet, lane: l, stack: 0, eyebrow: "財布", subtitle: "個人の口座 · 残高 {v} ETH" }

animation:
  - step: "shape-wallet" 1.5s
    focus: ["MetaMask"]
    badge: "shape"
    description: "財布と差し込んだ硬貨、残高。 閲覧ソフトの財布や、鍵を持ち歩く機器、契約でできた財布を表す。"
  - step: "shape-wallet の数が動く" 1.5s
    focus: ["MetaMask"]
    tween:
      v: 1 -> 12
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeWallet = `{
  "title": "shape: wallet (財布 + coin + balance display)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "MetaMask",
      "kind": "shape-wallet",
      "lane": "l",
      "stack": 0,
      "eyebrow": "財布",
      "subtitle": "個人の口座 · 残高 {v} ETH"
    }
  ],
  "flow": [],
  "states": { "v": 1 },
  "animation": [
    {
      "step": "shape-wallet",
      "duration": 1.5,
      "focus": ["MetaMask"],
      "badge": "shape",
      "body": "財布と差し込んだ硬貨、残高。 閲覧ソフトの財布や、鍵を持ち歩く機器、契約でできた財布を表す。"
    },
    {
      "step": "shape-wallet の数が動く",
      "duration": 1.5,
      "focus": ["MetaMask"],
      "tween": { "v": [1, 12] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeNft = `title: "shape: nft (額縁 + polygonal art + verified badge)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - CryptoPunk: { kind: shape-nft, lane: l, stack: 0, eyebrow: "NFT", subtitle: "ERC-721 · {v} ETH", posW: 272 }

animation:
  - step: "shape-nft" 1.5s
    focus: ["CryptoPunk"]
    badge: "shape"
    description: "額縁と角ばった絵、本物の印。 ERC-721 の作品や、譲れない証明、作品の集まりを表す。"
  - step: "shape-nft の数が動く" 1.5s
    focus: ["CryptoPunk"]
    tween:
      v: 3 -> 28
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeNft = `{
  "title": "shape: nft (額縁 + polygonal art + verified badge)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "CryptoPunk",
      "kind": "shape-nft",
      "lane": "l",
      "stack": 0,
      "eyebrow": "NFT",
      "subtitle": "ERC-721 · {v} ETH",
      "posW": 272
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-nft",
      "duration": 1.5,
      "focus": ["CryptoPunk"],
      "badge": "shape",
      "body": "額縁と角ばった絵、本物の印。 ERC-721 の作品や、譲れない証明、作品の集まりを表す。"
    },
    {
      "step": "shape-nft の数が動く",
      "duration": 1.5,
      "focus": ["CryptoPunk"],
      "tween": { "v": [3, 28] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeToken = `title: "shape: token (硬貨、 fungible currency)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2100

actors:
  - ETH: { kind: shape-token, lane: l, stack: 0, eyebrow: "通貨", subtitle: "ERC-20 · {v} ドル" }

animation:
  - step: "shape-token" 1.5s
    focus: ["ETH"]
    badge: "shape"
    description: "硬貨と通貨の記号 Ξ、光。 ERC-20 の通貨や、台帳そのものの通貨、値を固定した通貨を表す。"
  - step: "shape-token の数が動く" 1.5s
    focus: ["ETH"]
    tween:
      v: 2100 -> 3400
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeToken = `{
  "title": "shape: token (硬貨、 fungible currency)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ETH",
      "kind": "shape-token",
      "lane": "l",
      "stack": 0,
      "eyebrow": "通貨",
      "subtitle": "ERC-20 · {v} ドル"
    }
  ],
  "flow": [],
  "states": { "v": 2100 },
  "animation": [
    {
      "step": "shape-token",
      "duration": 1.5,
      "focus": ["ETH"],
      "badge": "shape",
      "body": "硬貨と通貨の記号 Ξ、光。 ERC-20 の通貨や、台帳そのものの通貨、値を固定した通貨を表す。"
    },
    {
      "step": "shape-token の数が動く",
      "duration": 1.5,
      "focus": ["ETH"],
      "tween": { "v": [2100, 3400] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBank = `title: "shape: bank (Greek facade + 4 columns + $)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 90

actors:
  - みずほ銀行: { kind: shape-bank, lane: l, stack: 0, eyebrow: "銀行", subtitle: "都銀 · 預金 {v} 兆円" }

animation:
  - step: "shape-bank" 1.5s
    focus: ["みずほ銀行"]
    badge: "shape"
    description: "神殿風の正面 (三角の屋根と柱と土台)。 都市銀行や地方銀行、銀行の本店を表す。"
  - step: "shape-bank の数が動く" 1.5s
    focus: ["みずほ銀行"]
    tween:
      v: 90 -> 142
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeBank = `{
  "title": "shape: bank (Greek facade + 4 columns + $)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "みずほ銀行",
      "kind": "shape-bank",
      "lane": "l",
      "stack": 0,
      "eyebrow": "銀行",
      "subtitle": "都銀 · 預金 {v} 兆円"
    }
  ],
  "flow": [],
  "states": { "v": 90 },
  "animation": [
    {
      "step": "shape-bank",
      "duration": 1.5,
      "focus": ["みずほ銀行"],
      "badge": "shape",
      "body": "神殿風の正面 (三角の屋根と柱と土台)。 都市銀行や地方銀行、銀行の本店を表す。"
    },
    {
      "step": "shape-bank の数が動く",
      "duration": 1.5,
      "focus": ["みずほ銀行"],
      "tween": { "v": [90, 142] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeTrustBank = `title: "shape: trust-bank (bank facade + 冠 crown = 受託の信頼)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 40

actors:
  - 三菱 UFJ 信託: { kind: shape-trust-bank, lane: l, stack: 0, eyebrow: "信託銀行", subtitle: "受託 {v} 兆円" }

animation:
  - step: "shape-trust-bank" 1.5s
    focus: ["三菱 UFJ 信託"]
    badge: "shape"
    description: "冠と正面の柱、T の印。 信託銀行や、預かって運用する業務、資産の管理を表す。"
  - step: "shape-trust-bank の数が動く" 1.5s
    focus: ["三菱 UFJ 信託"]
    tween:
      v: 40 -> 88
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeTrustBank = `{
  "title": "shape: trust-bank (bank facade + 冠 crown = 受託の信頼)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "三菱 UFJ 信託",
      "kind": "shape-trust-bank",
      "lane": "l",
      "stack": 0,
      "eyebrow": "信託銀行",
      "subtitle": "受託 {v} 兆円"
    }
  ],
  "flow": [],
  "states": { "v": 40 },
  "animation": [
    {
      "step": "shape-trust-bank",
      "duration": 1.5,
      "focus": ["三菱 UFJ 信託"],
      "badge": "shape",
      "body": "冠と正面の柱、T の印。 信託銀行や、預かって運用する業務、資産の管理を表す。"
    },
    {
      "step": "shape-trust-bank の数が動く",
      "duration": 1.5,
      "focus": ["三菱 UFJ 信託"],
      "tween": { "v": [40, 88] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapePaymentProvider = `title: "shape: payment-provider (POS 端末 + screen + keypad)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 30

actors:
  - Stripe: { kind: shape-payment-provider, lane: l, stack: 0, eyebrow: "決済", subtitle: "決済 {v} 件/s" }

animation:
  - step: "shape-payment-provider" 1.5s
    focus: ["Stripe"]
    badge: "shape"
    description: "支払いの端末と承認の表示、数字の鍵盤。 決済の代行業者や、電子決済の取次を表す。"
  - step: "shape-payment-provider の数が動く" 1.5s
    focus: ["Stripe"]
    tween:
      v: 30 -> 420
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapePaymentProvider = `{
  "title": "shape: payment-provider (POS 端末 + screen + keypad)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Stripe",
      "kind": "shape-payment-provider",
      "lane": "l",
      "stack": 0,
      "eyebrow": "決済",
      "subtitle": "決済 {v} 件/s"
    }
  ],
  "flow": [],
  "states": { "v": 30 },
  "animation": [
    {
      "step": "shape-payment-provider",
      "duration": 1.5,
      "focus": ["Stripe"],
      "badge": "shape",
      "body": "支払いの端末と承認の表示、数字の鍵盤。 決済の代行業者や、電子決済の取次を表す。"
    },
    {
      "step": "shape-payment-provider の数が動く",
      "duration": 1.5,
      "focus": ["Stripe"],
      "tween": { "v": [30, 420] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBrokerage = `title: "shape: brokerage (証券会社 tower + candle chart + up arrow)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 120

actors:
  - 野村證券: { kind: shape-brokerage, lane: l, stack: 0, eyebrow: "証券", subtitle: "約定 {v} 件" }

animation:
  - step: "shape-brokerage" 1.5s
    focus: ["野村證券"]
    badge: "shape"
    description: "高い建物と格子の窓、ろうそく足の図、上向きの矢印。 証券会社や投資銀行を表す。"
  - step: "shape-brokerage の数が動く" 1.5s
    focus: ["野村證券"]
    tween:
      v: 120 -> 940
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeBrokerage = `{
  "title": "shape: brokerage (証券会社 tower + candle chart + up arrow)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "野村證券",
      "kind": "shape-brokerage",
      "lane": "l",
      "stack": 0,
      "eyebrow": "証券",
      "subtitle": "約定 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 120 },
  "animation": [
    {
      "step": "shape-brokerage",
      "duration": 1.5,
      "focus": ["野村證券"],
      "badge": "shape",
      "body": "高い建物と格子の窓、ろうそく足の図、上向きの矢印。 証券会社や投資銀行を表す。"
    },
    {
      "step": "shape-brokerage の数が動く",
      "duration": 1.5,
      "focus": ["野村證券"],
      "tween": { "v": [120, 940] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeExchange = `title: "shape: exchange (取引所、 $ ⇄ Ξ swap)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - Coinbase: { kind: shape-exchange, lane: l, stack: 0, eyebrow: "取引所", subtitle: "出来高 {v} 億" }

animation:
  - step: "shape-exchange" 1.5s
    focus: ["Coinbase"]
    badge: "shape"
    description: "2 つの通貨の硬貨と両向きの矢印、交換の比率。 取引所や、仲介なしで交換する場、両替を表す。"
  - step: "shape-exchange の数が動く" 1.5s
    focus: ["Coinbase"]
    tween:
      v: 12 -> 86
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeExchange = `{
  "title": "shape: exchange (取引所、 $ ⇄ Ξ swap)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Coinbase",
      "kind": "shape-exchange",
      "lane": "l",
      "stack": 0,
      "eyebrow": "取引所",
      "subtitle": "出来高 {v} 億"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "shape-exchange",
      "duration": 1.5,
      "focus": ["Coinbase"],
      "badge": "shape",
      "body": "2 つの通貨の硬貨と両向きの矢印、交換の比率。 取引所や、仲介なしで交換する場、両替を表す。"
    },
    {
      "step": "shape-exchange の数が動く",
      "duration": 1.5,
      "focus": ["Coinbase"],
      "tween": { "v": [12, 86] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeAtm = `title: "shape: atm (現金自動預払機、 card slot + cash dispenser)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 180

actors:
  - ATM: { kind: shape-atm, lane: l, stack: 0, eyebrow: "現金の窓口", subtitle: "24 時間 · {v} 件/日" }

animation:
  - step: "shape-atm" 1.5s
    focus: ["ATM"]
    badge: "shape"
    description: "画面とボタン、カードの差し込み口、お金の出口。 銀行やコンビニの ATM を表す。"
  - step: "shape-atm の数が動く" 1.5s
    focus: ["ATM"]
    tween:
      v: 180 -> 620
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeAtm = `{
  "title": "shape: atm (現金自動預払機、 card slot + cash dispenser)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ATM",
      "kind": "shape-atm",
      "lane": "l",
      "stack": 0,
      "eyebrow": "現金の窓口",
      "subtitle": "24 時間 · {v} 件/日"
    }
  ],
  "flow": [],
  "states": { "v": 180 },
  "animation": [
    {
      "step": "shape-atm",
      "duration": 1.5,
      "focus": ["ATM"],
      "badge": "shape",
      "body": "画面とボタン、カードの差し込み口、お金の出口。 銀行やコンビニの ATM を表す。"
    },
    {
      "step": "shape-atm の数が動く",
      "duration": 1.5,
      "focus": ["ATM"],
      "tween": { "v": [180, 620] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeWebsite = `title: "shape: website (browser + URL + page layout)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 1200

actors:
  - 会社案内: { kind: shape-website, lane: l, stack: 0, eyebrow: "サイト", subtitle: "閲覧 {v} 回/日" }

animation:
  - step: "shape-website" 1.5s
    focus: ["会社案内"]
    badge: "shape"
    description: "閲覧ソフトの枠と住所の欄、見出し、2 列の本文。 会社の案内や製品の紹介、日記のようなサイトを表す。"
  - step: "shape-website の数が動く" 1.5s
    focus: ["会社案内"]
    tween:
      v: 1200 -> 8600
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeWebsite = `{
  "title": "shape: website (browser + URL + page layout)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "会社案内",
      "kind": "shape-website",
      "lane": "l",
      "stack": 0,
      "eyebrow": "サイト",
      "subtitle": "閲覧 {v} 回/日"
    }
  ],
  "flow": [],
  "states": { "v": 1200 },
  "animation": [
    {
      "step": "shape-website",
      "duration": 1.5,
      "focus": ["会社案内"],
      "badge": "shape",
      "body": "閲覧ソフトの枠と住所の欄、見出し、2 列の本文。 会社の案内や製品の紹介、日記のようなサイトを表す。"
    },
    {
      "step": "shape-website の数が動く",
      "duration": 1.5,
      "focus": ["会社案内"],
      "tween": { "v": [1200, 8600] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeStorefront = `title: "shape: storefront (実店舗、 awning + door + windows)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 240

actors:
  - コンビニ: { kind: shape-storefront, lane: l, stack: 0, eyebrow: "店舗", subtitle: "来店 {v} 人/日" }

animation:
  - step: "shape-storefront" 1.5s
    focus: ["コンビニ"]
    badge: "shape"
    description: "赤と白の日よけ、営業中の札、扉、窓。 実際の店や小売を表す。"
  - step: "shape-storefront の数が動く" 1.5s
    focus: ["コンビニ"]
    tween:
      v: 240 -> 810
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeStorefront = `{
  "title": "shape: storefront (実店舗、 awning + door + windows)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "コンビニ",
      "kind": "shape-storefront",
      "lane": "l",
      "stack": 0,
      "eyebrow": "店舗",
      "subtitle": "来店 {v} 人/日"
    }
  ],
  "flow": [],
  "states": { "v": 240 },
  "animation": [
    {
      "step": "shape-storefront",
      "duration": 1.5,
      "focus": ["コンビニ"],
      "badge": "shape",
      "body": "赤と白の日よけ、営業中の札、扉、窓。 実際の店や小売を表す。"
    },
    {
      "step": "shape-storefront の数が動く",
      "duration": 1.5,
      "focus": ["コンビニ"],
      "tween": { "v": [240, 810] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeWarehouse = `title: "shape: warehouse (倉庫、 roof + shutter + boxes)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - 市川倉庫: { kind: shape-warehouse, lane: l, stack: 0, eyebrow: "物流拠点", subtitle: "在庫 {v} 千点" }

animation:
  - step: "shape-warehouse" 1.5s
    focus: ["市川倉庫"]
    badge: "shape"
    description: "屋根と巻き上げの扉、積んだ箱。 出荷を受け持つ拠点や倉庫を表す。"
  - step: "shape-warehouse の数が動く" 1.5s
    focus: ["市川倉庫"]
    tween:
      v: 12 -> 48
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeWarehouse = `{
  "title": "shape: warehouse (倉庫、 roof + shutter + boxes)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "市川倉庫",
      "kind": "shape-warehouse",
      "lane": "l",
      "stack": 0,
      "eyebrow": "物流拠点",
      "subtitle": "在庫 {v} 千点"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "shape-warehouse",
      "duration": 1.5,
      "focus": ["市川倉庫"],
      "badge": "shape",
      "body": "屋根と巻き上げの扉、積んだ箱。 出荷を受け持つ拠点や倉庫を表す。"
    },
    {
      "step": "shape-warehouse の数が動く",
      "duration": 1.5,
      "focus": ["市川倉庫"],
      "tween": { "v": [12, 48] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeOnlineShop = `title: "shape: online-shop (browser + cart badge + product grid)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 6

actors:
  - Amazon: { kind: shape-online-shop, lane: l, stack: 0, eyebrow: "通販", subtitle: "注文 {v} 件/分" }

animation:
  - step: "shape-online-shop" 1.5s
    focus: ["Amazon"]
    badge: "shape"
    description: "閲覧ソフトの枠と、かごの数 (3)、6 つの商品の並び。 通販やネットの販売を表す。"
  - step: "shape-online-shop の数が動く" 1.5s
    focus: ["Amazon"]
    tween:
      v: 6 -> 74
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeOnlineShop = `{
  "title": "shape: online-shop (browser + cart badge + product grid)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Amazon",
      "kind": "shape-online-shop",
      "lane": "l",
      "stack": 0,
      "eyebrow": "通販",
      "subtitle": "注文 {v} 件/分"
    }
  ],
  "flow": [],
  "states": { "v": 6 },
  "animation": [
    {
      "step": "shape-online-shop",
      "duration": 1.5,
      "focus": ["Amazon"],
      "badge": "shape",
      "body": "閲覧ソフトの枠と、かごの数 (3)、6 つの商品の並び。 通販やネットの販売を表す。"
    },
    {
      "step": "shape-online-shop の数が動く",
      "duration": 1.5,
      "focus": ["Amazon"],
      "tween": { "v": [6, 74] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeCdnEdge = `title: "shape: cdn-edge (地球儀 + 5 edge nodes + arc)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 300

actors:
  - Cloudflare: { kind: shape-cdn-edge, lane: l, stack: 0, eyebrow: "配信網", subtitle: "拠点 {v} か所" }

animation:
  - step: "shape-cdn-edge" 1.5s
    focus: ["Cloudflare"]
    badge: "shape"
    description: "地球儀と 5 つの拠点、点線のつながり。 配信網の事業者や、利用者の近くで返す網を表す。"
  - step: "shape-cdn-edge の数が動く" 1.5s
    focus: ["Cloudflare"]
    tween:
      v: 300 -> 380
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeCdnEdge = `{
  "title": "shape: cdn-edge (地球儀 + 5 edge nodes + arc)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Cloudflare",
      "kind": "shape-cdn-edge",
      "lane": "l",
      "stack": 0,
      "eyebrow": "配信網",
      "subtitle": "拠点 {v} か所"
    }
  ],
  "flow": [],
  "states": { "v": 300 },
  "animation": [
    {
      "step": "shape-cdn-edge",
      "duration": 1.5,
      "focus": ["Cloudflare"],
      "badge": "shape",
      "body": "地球儀と 5 つの拠点、点線のつながり。 配信網の事業者や、利用者の近くで返す網を表す。"
    },
    {
      "step": "shape-cdn-edge の数が動く",
      "duration": 1.5,
      "focus": ["Cloudflare"],
      "tween": { "v": [300, 380] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeApiGateway = `title: "shape: api-gateway (門柱 + arch + traffic arrow)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 400

actors:
  - Kong: { kind: shape-api-gateway, lane: l, stack: 0, eyebrow: "API の入口", subtitle: "毎秒 {v} 件" }

animation:
  - step: "shape-api-gateway" 1.5s
    focus: ["Kong"]
    badge: "shape"
    description: "2 本の柱と弧、API の字、行き交う矢印。 API の入口に立つ門番を表す。"
  - step: "shape-api-gateway の数が動く" 1.5s
    focus: ["Kong"]
    tween:
      v: 400 -> 3200
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeApiGateway = `{
  "title": "shape: api-gateway (門柱 + arch + traffic arrow)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Kong",
      "kind": "shape-api-gateway",
      "lane": "l",
      "stack": 0,
      "eyebrow": "API の入口",
      "subtitle": "毎秒 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 400 },
  "animation": [
    {
      "step": "shape-api-gateway",
      "duration": 1.5,
      "focus": ["Kong"],
      "badge": "shape",
      "body": "2 本の柱と弧、API の字、行き交う矢印。 API の入口に立つ門番を表す。"
    },
    {
      "step": "shape-api-gateway の数が動く",
      "duration": 1.5,
      "focus": ["Kong"],
      "tween": { "v": [400, 3200] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeAuditor = `title: "shape: auditor (監査人 + magnifier + check)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2

actors:
  - 監査法人: { kind: shape-auditor, lane: l, stack: 0, eyebrow: "監査", subtitle: "指摘 {v} 件" }

animation:
  - step: "shape-auditor" 1.5s
    focus: ["監査法人"]
    badge: "shape"
    description: "人とネクタイ、虫眼鏡、確認の印。 監査人や公認会計士、内部の監査を表す。"
  - step: "shape-auditor の数が動く" 1.5s
    focus: ["監査法人"]
    tween:
      v: 2 -> 17
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeAuditor = `{
  "title": "shape: auditor (監査人 + magnifier + check)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "監査法人",
      "kind": "shape-auditor",
      "lane": "l",
      "stack": 0,
      "eyebrow": "監査",
      "subtitle": "指摘 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 2 },
  "animation": [
    {
      "step": "shape-auditor",
      "duration": 1.5,
      "focus": ["監査法人"],
      "badge": "shape",
      "body": "人とネクタイ、虫眼鏡、確認の印。 監査人や公認会計士、内部の監査を表す。"
    },
    {
      "step": "shape-auditor の数が動く",
      "duration": 1.5,
      "focus": ["監査法人"],
      "tween": { "v": [2, 17] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeRegulator = `title: "shape: regulator (規制当局 + 冠 crown + 章 badge)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 4

actors:
  - 金融庁: { kind: shape-regulator, lane: l, stack: 0, eyebrow: "規制当局", subtitle: "検査 {v} 件" }

animation:
  - step: "shape-regulator" 1.5s
    focus: ["金融庁"]
    badge: "shape"
    description: "人と冠、五芒星の記章。 金融庁や消費者庁のような規制の当局を表す。"
  - step: "shape-regulator の数が動く" 1.5s
    focus: ["金融庁"]
    tween:
      v: 4 -> 23
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeRegulator = `{
  "title": "shape: regulator (規制当局 + 冠 crown + 章 badge)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "金融庁",
      "kind": "shape-regulator",
      "lane": "l",
      "stack": 0,
      "eyebrow": "規制当局",
      "subtitle": "検査 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 4 },
  "animation": [
    {
      "step": "shape-regulator",
      "duration": 1.5,
      "focus": ["金融庁"],
      "badge": "shape",
      "body": "人と冠、五芒星の記章。 金融庁や消費者庁のような規制の当局を表す。"
    },
    {
      "step": "shape-regulator の数が動く",
      "duration": 1.5,
      "focus": ["金融庁"],
      "tween": { "v": [4, 23] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeNotary = `title: "shape: notary (公証人 + 儒学者風 hat + seal 印)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 6

actors:
  - 公証役場: { kind: shape-notary, lane: l, stack: 0, eyebrow: "公証", subtitle: "認証 {v} 件" }

animation:
  - step: "shape-notary" 1.5s
    focus: ["公証役場"]
    badge: "shape"
    description: "人と儒学者風の帽子、赤い印。 公証人や、書類が正しいと認める業務を表す。"
  - step: "shape-notary の数が動く" 1.5s
    focus: ["公証役場"]
    tween:
      v: 6 -> 31
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeNotary = `{
  "title": "shape: notary (公証人 + 儒学者風 hat + seal 印)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "公証役場",
      "kind": "shape-notary",
      "lane": "l",
      "stack": 0,
      "eyebrow": "公証",
      "subtitle": "認証 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 6 },
  "animation": [
    {
      "step": "shape-notary",
      "duration": 1.5,
      "focus": ["公証役場"],
      "badge": "shape",
      "body": "人と儒学者風の帽子、赤い印。 公証人や、書類が正しいと認める業務を表す。"
    },
    {
      "step": "shape-notary の数が動く",
      "duration": 1.5,
      "focus": ["公証役場"],
      "tween": { "v": [6, 31] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeLawyer = `title: "shape: lawyer (弁護士 + wig + 天秤)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - 顧問弁護士: { kind: shape-lawyer, lane: l, stack: 0, eyebrow: "法務", subtitle: "案件 {v} 件" }

animation:
  - step: "shape-lawyer" 1.5s
    focus: ["顧問弁護士"]
    badge: "shape"
    description: "人と髪、正義の天秤の印。 弁護士や法務の顧問、法律事務所を表す。"
  - step: "shape-lawyer の数が動く" 1.5s
    focus: ["顧問弁護士"]
    tween:
      v: 3 -> 19
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeLawyer = `{
  "title": "shape: lawyer (弁護士 + wig + 天秤)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "顧問弁護士",
      "kind": "shape-lawyer",
      "lane": "l",
      "stack": 0,
      "eyebrow": "法務",
      "subtitle": "案件 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-lawyer",
      "duration": 1.5,
      "focus": ["顧問弁護士"],
      "badge": "shape",
      "body": "人と髪、正義の天秤の印。 弁護士や法務の顧問、法律事務所を表す。"
    },
    {
      "step": "shape-lawyer の数が動く",
      "duration": 1.5,
      "focus": ["顧問弁護士"],
      "tween": { "v": [3, 19] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeTrader = `title: "shape: trader (トレーダー + headset + laptop chart)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 8

actors:
  - デイトレーダー: { kind: shape-trader, lane: l, stack: 0, eyebrow: "売買", subtitle: "約定 {v} 回" }

animation:
  - step: "shape-trader" 1.5s
    focus: ["デイトレーダー"]
    badge: "shape"
    description: "人とヘッドセット、値動きの映るパソコン。 トレーダーや、値付けを受け持つ業者、機械の自動発注を表す。"
  - step: "shape-trader の数が動く" 1.5s
    focus: ["デイトレーダー"]
    tween:
      v: 8 -> 152
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeTrader = `{
  "title": "shape: trader (トレーダー + headset + laptop chart)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "デイトレーダー",
      "kind": "shape-trader",
      "lane": "l",
      "stack": 0,
      "eyebrow": "売買",
      "subtitle": "約定 {v} 回"
    }
  ],
  "flow": [],
  "states": { "v": 8 },
  "animation": [
    {
      "step": "shape-trader",
      "duration": 1.5,
      "focus": ["デイトレーダー"],
      "badge": "shape",
      "body": "人とヘッドセット、値動きの映るパソコン。 トレーダーや、値付けを受け持つ業者、機械の自動発注を表す。"
    },
    {
      "step": "shape-trader の数が動く",
      "duration": 1.5,
      "focus": ["デイトレーダー"],
      "tween": { "v": [8, 152] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeCustomerService = `title: "shape: customer-service (CS + headset + bubble)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 14

actors:
  - サポート担当: { kind: shape-customer-service, lane: l, stack: 0, eyebrow: "問い合わせ", subtitle: "対応 {v} 件" }

animation:
  - step: "shape-customer-service" 1.5s
    focus: ["サポート担当"]
    badge: "shape"
    description: "人とヘッドセット、吹き出し、名札。 お客様の窓口やコールセンターを表す。"
  - step: "shape-customer-service の数が動く" 1.5s
    focus: ["サポート担当"]
    tween:
      v: 14 -> 88
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeCustomerService = `{
  "title": "shape: customer-service (CS + headset + bubble)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "サポート担当",
      "kind": "shape-customer-service",
      "lane": "l",
      "stack": 0,
      "eyebrow": "問い合わせ",
      "subtitle": "対応 {v} 件"
    }
  ],
  "flow": [],
  "states": { "v": 14 },
  "animation": [
    {
      "step": "shape-customer-service",
      "duration": 1.5,
      "focus": ["サポート担当"],
      "badge": "shape",
      "body": "人とヘッドセット、吹き出し、名札。 お客様の窓口やコールセンターを表す。"
    },
    {
      "step": "shape-customer-service の数が動く",
      "duration": 1.5,
      "focus": ["サポート担当"],
      "tween": { "v": [14, 88] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBlockchain = `title: "shape: blockchain (5 block linked chain)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 5

actors:
  - ブロックチェーン: { kind: shape-blockchain, lane: l, stack: 0, eyebrow: "台帳", subtitle: "{v} ブロック" }

animation:
  - step: "shape-blockchain" 1.5s
    focus: ["ブロックチェーン"]
    badge: "shape"
    description: "5 つのブロックを、前の要約値を指す形で横につなぐ。 分散台帳の一般の形を表す。"
  - step: "shape-blockchain の数が動く" 1.5s
    focus: ["ブロックチェーン"]
    tween:
      v: 5 -> 42
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeBlockchain = `{
  "title": "shape: blockchain (5 block linked chain)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ブロックチェーン",
      "kind": "shape-blockchain",
      "lane": "l",
      "stack": 0,
      "eyebrow": "台帳",
      "subtitle": "{v} ブロック"
    }
  ],
  "flow": [],
  "states": { "v": 5 },
  "animation": [
    {
      "step": "shape-blockchain",
      "duration": 1.5,
      "focus": ["ブロックチェーン"],
      "badge": "shape",
      "body": "5 つのブロックを、前の要約値を指す形で横につなぐ。 分散台帳の一般の形を表す。"
    },
    {
      "step": "shape-blockchain の数が動く",
      "duration": 1.5,
      "focus": ["ブロックチェーン"],
      "tween": { "v": [5, 42] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBitcoinChain = `title: "shape: bitcoin-chain (₿ + PoW + 橙色)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 84

actors:
  - Bitcoin: { kind: shape-bitcoin-chain, lane: l, stack: 0, eyebrow: "分散台帳", subtitle: "ブロック高 {v} 万" }

animation:
  - step: "shape-bitcoin-chain" 1.5s
    focus: ["Bitcoin"]
    badge: "shape"
    description: "橙の色と ₿ の記号、計算の量で合意する採掘。 Bitcoin の本番の網や、試しの網を表す。"
  - step: "shape-bitcoin-chain の数が動く" 1.5s
    focus: ["Bitcoin"]
    tween:
      v: 84 -> 89
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeBitcoinChain = `{
  "title": "shape: bitcoin-chain (₿ + PoW + 橙色)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Bitcoin",
      "kind": "shape-bitcoin-chain",
      "lane": "l",
      "stack": 0,
      "eyebrow": "分散台帳",
      "subtitle": "ブロック高 {v} 万"
    }
  ],
  "flow": [],
  "states": { "v": 84 },
  "animation": [
    {
      "step": "shape-bitcoin-chain",
      "duration": 1.5,
      "focus": ["Bitcoin"],
      "badge": "shape",
      "body": "橙の色と ₿ の記号、計算の量で合意する採掘。 Bitcoin の本番の網や、試しの網を表す。"
    },
    {
      "step": "shape-bitcoin-chain の数が動く",
      "duration": 1.5,
      "focus": ["Bitcoin"],
      "tween": { "v": [84, 89] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeEthereumChain = `title: "shape: ethereum-chain (Ξ + PoS + 紫色)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2000

actors:
  - Ethereum: { kind: shape-ethereum-chain, lane: l, stack: 0, eyebrow: "分散台帳", subtitle: "{v} 万ブロック" }

animation:
  - step: "shape-ethereum-chain" 1.5s
    focus: ["Ethereum"]
    badge: "shape"
    description: "紫の色と Ξ の記号、預けた量で合意する検証役。 Ethereum の本番の網や、その上に重ねた網を表す。"
  - step: "shape-ethereum-chain の数が動く" 1.5s
    focus: ["Ethereum"]
    tween:
      v: 2000 -> 2400
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeEthereumChain = `{
  "title": "shape: ethereum-chain (Ξ + PoS + 紫色)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Ethereum",
      "kind": "shape-ethereum-chain",
      "lane": "l",
      "stack": 0,
      "eyebrow": "分散台帳",
      "subtitle": "{v} 万ブロック"
    }
  ],
  "flow": [],
  "states": { "v": 2000 },
  "animation": [
    {
      "step": "shape-ethereum-chain",
      "duration": 1.5,
      "focus": ["Ethereum"],
      "badge": "shape",
      "body": "紫の色と Ξ の記号、預けた量で合意する検証役。 Ethereum の本番の網や、その上に重ねた網を表す。"
    },
    {
      "step": "shape-ethereum-chain の数が動く",
      "duration": 1.5,
      "focus": ["Ethereum"],
      "tween": { "v": [2000, 2400] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeBlockchainNode = `title: "shape: blockchain-node (P2P hex + 6 peers)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 8

actors:
  - フルノード: { kind: shape-blockchain-node, lane: l, stack: 0, eyebrow: "参加者", subtitle: "直接つながる相手 {v} 台" }

animation:
  - step: "shape-blockchain-node" 1.5s
    focus: ["フルノード"]
    badge: "shape"
    description: "中央の六角形と周りの 6 つの六角形、積んだブロックの印。 分散台帳の参加者 (全記録を持つもの、過去の状態まで持つもの、最小限だけ持つもの) を表す。"
  - step: "shape-blockchain-node の数が動く" 1.5s
    focus: ["フルノード"]
    tween:
      v: 8 -> 64
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeBlockchainNode = `{
  "title": "shape: blockchain-node (P2P hex + 6 peers)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "フルノード",
      "kind": "shape-blockchain-node",
      "lane": "l",
      "stack": 0,
      "eyebrow": "参加者",
      "subtitle": "直接つながる相手 {v} 台"
    }
  ],
  "flow": [],
  "states": { "v": 8 },
  "animation": [
    {
      "step": "shape-blockchain-node",
      "duration": 1.5,
      "focus": ["フルノード"],
      "badge": "shape",
      "body": "中央の六角形と周りの 6 つの六角形、積んだブロックの印。 分散台帳の参加者 (全記録を持つもの、過去の状態まで持つもの、最小限だけ持つもの) を表す。"
    },
    {
      "step": "shape-blockchain-node の数が動く",
      "duration": 1.5,
      "focus": ["フルノード"],
      "tween": { "v": [8, 64] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;

export const sourceYaml__shapeCreditCard = `title: "shape: credit-card (chip + magstripe + brand mark)"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - クレカ: { kind: shape-credit-card, lane: l, stack: 0, eyebrow: "カード", subtitle: "利用額 {v} 万円" }

animation:
  - step: "shape-credit-card" 1.5s
    focus: ["クレカ"]
    badge: "shape"
    description: "金色の端子と非接触の波、番号、名義、有効期限、ブランドの印。 実物のクレジットカードを表す。"
  - step: "shape-credit-card の数が動く" 1.5s
    focus: ["クレカ"]
    tween:
      v: 3 -> 18
    badge: "shape"
    description: "副題の数が段の中で動く。 形と説明は変えない。"
`;

export const sourceJson__shapeCreditCard = `{
  "title": "shape: credit-card (chip + magstripe + brand mark)",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "クレカ",
      "kind": "shape-credit-card",
      "lane": "l",
      "stack": 0,
      "eyebrow": "カード",
      "subtitle": "利用額 {v} 万円"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "shape-credit-card",
      "duration": 1.5,
      "focus": ["クレカ"],
      "badge": "shape",
      "body": "金色の端子と非接触の波、番号、名義、有効期限、ブランドの印。 実物のクレジットカードを表す。"
    },
    {
      "step": "shape-credit-card の数が動く",
      "duration": 1.5,
      "focus": ["クレカ"],
      "tween": { "v": [3, 18] },
      "badge": "shape",
      "body": "副題の数が段の中で動く。 形と説明は変えない。"
    }
  ]
}`;
