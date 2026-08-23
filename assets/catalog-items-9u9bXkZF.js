const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/parts.cdl-jk17Wa5r.js","assets/index-C-VN7l6w.js","assets/index-Dzme9PnL.css"])))=>i.map(i=>d[i]);
import{a0 as t,W as i,$ as M,a1 as L}from"./index-C-VN7l6w.js";import{m as O}from"./catalog-motion-CFHGayrq.js";const o=440,F=t("kind-actor",{topic:"kind: actor (外部主体)"}).lane("l",{x:0,width:o}).state("v",{initial:42}).node("a",{lane:"l",stack:0,kind:"actor",title:"Client",eyebrow:"外部主体",value:"{v} users"}).phase("p",{duration:1500,title:"actor",body:"外部主体 (Client / 利用者 等)。 数値 value 表示可。"},e=>e.activate("a").badge("active")).phase("p2",{duration:1500,title:"actor の数が動く",body:"値の欄が段の中で動く。 この欄を描くのは actor だけ。"},e=>e.activate("a").tween("v",42,137).badge("active")).build(),H=t("kind-function",{topic:"kind: function (関数呼び出し)"}).lane("l",{x:0,width:o}).state("v",{initial:12}).node("fn",{lane:"l",stack:0,kind:"function",title:"handler(req)",eyebrow:"関数呼び出し",subtitle:"-> Result<Order, E> · 呼出 {v}"}).phase("p",{duration:1500,title:"function",body:"Service の関数。 mono 等幅 title + subtitle で署名表示。"},e=>e.activate("fn").badge("active")).phase("p2",{duration:1500,title:"function の数が動く",body:"副題の呼出回数が段の中で動く。 署名の形は変えない。"},e=>e.activate("fn").tween("v",12,480).badge("active")).build(),W=t("kind-storage",{topic:"kind: storage (保存データ)"}).lane("l",{x:0,width:o}).state("v",{initial:1200}).node("s",{lane:"l",stack:0,kind:"storage",title:"users",eyebrow:"保存データ",rows:["id: PK","email: text","行数: {v}"]}).phase("p",{duration:1500,title:"storage",body:"DB の table。 rows で複数 column 表示。"},e=>e.activate("s").badge("active")).phase("p2",{duration:1500,title:"storage の数が動く",body:"行の数が段の中で動く。 行も同じ経路で置換される。"},e=>e.activate("s").tween("v",1200,8400).badge("active")).build(),q=t("kind-event",{topic:"kind: event (イベントログ)"}).lane("l",{x:0,width:o}).state("v",{initial:3}).node("e",{lane:"l",stack:0,kind:"event",title:"OrderCreated",eyebrow:"イベント",subtitle:"(orderId, userId) · {v} 件/s"}).phase("p",{duration:1500,title:"event",body:"emit された event。 event bus / log が読む。"},e=>e.activate("e").badge("active")).phase("p2",{duration:1500,title:"event の数が動く",body:"副題の発生件数が段の中で動く。 中身の形は変えない。"},e=>e.activate("e").tween("v",3,96).badge("active")).build(),G=t("kind-card",{topic:"kind: card (汎用情報)"}).lane("l",{x:0,width:o}).state("v",{initial:2}).node("c",{lane:"l",stack:0,kind:"card",title:"備考",eyebrow:"汎用カード",subtitle:"汎用の説明カード · {v} 件"}).phase("p",{duration:1500,title:"card",body:"kind に当てはまらない補足情報。"},e=>e.activate("c").badge("active")).phase("p2",{duration:1500,title:"card の数が動く",body:"副題の件数が段の中で動く。 説明の文は変えない。"},e=>e.activate("c").tween("v",2,31).badge("active")).build(),V=t("lane-single",{topic:"lane: 1 本"}).lane("only",{x:0,width:o}).node("a",{lane:"only",stack:0,kind:"actor",title:"A"}).node("b",{lane:"only",stack:1,kind:"function",title:"B"}).phase("p",{duration:1500,title:"1 lane",body:"1 lane に複数 node を縦 stack。"},e=>e.activate("a","b").badge("OK")).build(),U=t("lane-multi",{topic:"lane: 3 本 (横並び)"}).lane("l1",{width:240}).lane("l2",{width:240}).lane("l3",{width:240}).node("a",{lane:"l1",stack:0,kind:"function",title:"A"}).node("b",{lane:"l2",stack:0,kind:"function",title:"B"}).node("c",{lane:"l3",stack:0,kind:"event",title:"C"}).phase("p",{duration:1500,title:"3 lane",body:"lane を横並びで責務分担 (Client / Service / Event)。"},e=>e.activate("a","b","c").badge("OK")).build(),Q=t("lane-contain",{topic:"lane: contain (枠囲み)"}).lane("inner",{x:0,width:o,contain:!0}).node("fn",{lane:"inner",stack:0,kind:"function",title:"internal fn"}).node("st",{lane:"inner",stack:1,kind:"storage",title:"storage"}).phase("p",{duration:1500,title:"contain",body:"lane.contain=true で lane 自体を枠で囲み、 内部を境界明示。"},e=>e.activate("fn","st").badge("OK")).build(),j=t("stack-pair",{topic:"stack: 縦 2 段"}).lane("l",{x:0,width:o}).node("top",{lane:"l",stack:0,kind:"actor",title:"上"}).node("bot",{lane:"l",stack:1,kind:"actor",title:"下"}).phase("p",{duration:1500,title:"stack 0/1",body:"同 lane 内で stack で縦並びを制御。"},e=>e.activate("top","bot").badge("OK")).build(),J=t("stack-triple",{topic:"stack: 縦 3 段"}).lane("l",{x:0,width:o}).node("a",{lane:"l",stack:0,kind:"actor",title:"stack 0"}).node("b",{lane:"l",stack:1,kind:"function",title:"stack 1"}).node("c",{lane:"l",stack:2,kind:"storage",title:"stack 2"}).phase("p",{duration:1500,title:"stack 0/1/2",body:"stack の数を増やして縦展開、 row_gap で間隔自動。"},e=>e.activate("a","b","c").badge("OK")).build();function a(e){const n=t(e.id,{structuredData:"exclude",topic:e.topic}).lane("l",{x:0,width:o});if(e.metric&&n.state("v",{initial:e.metric.from}),n.node("n",{lane:"l",stack:0,kind:e.kind,title:e.title,eyebrow:e.eyebrow,...e.subtitle?{subtitle:e.subtitle}:{},...e.w?{w:e.w}:{}}),n.phase("p",{duration:1500,title:e.phase.title,body:e.phase.body},s=>s.activate("n").badge("shape")),e.metric){const{from:s,to:b}=e.metric;n.phase("p2",{duration:1500,title:`${e.phase.title} の数が動く`,body:"副題の数が段の中で動く。 形と説明は変えない。"},u=>u.activate("n").tween("v",s,b).badge("shape"))}return n.build()}const Y=a({id:"shape-file",kind:"shape-file",title:"report.pdf",eyebrow:"file",subtitle:"PDF {v} MB",metric:{from:2,to:9},w:272,topic:"shape: file (ドッグイア rect、 ファイル / document 表現)",phase:{title:"file",body:"右上がドッグイアで折り返された rect。 ファイル / 文書 / レポート等"}}),z=a({id:"shape-folder",kind:"shape-folder",title:"src/",eyebrow:"folder",subtitle:"{v} files",metric:{from:24,to:118},topic:"shape: folder (tab 付き rect、 フォルダ / パッケージ)",phase:{title:"folder",body:"上端に tab のある rect。 ディレクトリ / package / モジュール群等"}}),$=a({id:"shape-cloud",kind:"shape-cloud",title:"AWS",eyebrow:"cloud",subtitle:"{v} リージョン",metric:{from:3,to:12},topic:"shape: cloud (5 円 合成、 クラウド / SaaS 表現)",phase:{title:"cloud",body:"5 円 合成の cloud shape。 AWS / GCP / SaaS / 外部 API 等"}}),K=a({id:"shape-cylinder",kind:"shape-cylinder",title:"PostgreSQL",eyebrow:"database",subtitle:"{v} GB 使用",metric:{from:120,to:480},w:272,topic:"shape: cylinder (円柱、 DB / storage 表現)",phase:{title:"cylinder",body:"円柱 (top + side + bottom ellipse)。 DB / 永続 storage / volume 等"}}),X=a({id:"shape-hexagon",kind:"shape-hexagon",title:"AuthService",eyebrow:"component",subtitle:"{v} req/s",metric:{from:60,to:940},w:294,topic:"shape: hexagon (六角形、 component / service)",phase:{title:"hexagon",body:"六角形。 microservice / ドメインコンポーネント / モジュール表現"}}),Z=a({id:"shape-diamond",kind:"shape-diamond",title:"valid?",eyebrow:"decision",subtitle:"true {v}%",metric:{from:40,to:92},topic:"shape: diamond (ひし形、 decision / 判定)",phase:{title:"diamond",body:"ひし形。 判定分岐 / choice / gateway 表現"}}),ee=a({id:"shape-stack",kind:"shape-stack",title:"v3.2.0",eyebrow:"release",subtitle:"{v} 版",metric:{from:3,to:14},topic:"shape: stack (重ね rect、 layer / history)",phase:{title:"stack",body:"重なった 3 段の rect。 バージョン履歴 / layer / snapshot 群等"}}),te=a({id:"shape-person",kind:"shape-person",title:"エンドユーザ",eyebrow:"actor",subtitle:"{v} 操作",metric:{from:2,to:21},topic:"shape: person (人型 figure、 actor / user 表現)",phase:{title:"person",body:"人型 figure (円頭 + 台形 body + 腕 curve)。 actor / user / 担当者"}}),ae=a({id:"shape-window",kind:"shape-window",title:"ダッシュボード",eyebrow:"window",subtitle:"開いた画面 {v}",metric:{from:1,to:6},topic:"shape: window (GUI アプリ、 traffic lights + body)",phase:{title:"window",body:"title bar + traffic lights + body。 GUI アプリ / desktop / ブラウザ画面"}}),ie=a({id:"shape-terminal",kind:"shape-terminal",title:"zsh",eyebrow:"terminal",subtitle:"CLI shell",topic:"shape: terminal (CLI shell、 mac bar + prompt)",phase:{title:"terminal",body:"macOS bar + $ prompt + typing cursor。 CLI shell / SSH / script 実行"}}),oe=a({id:"shape-code-block",kind:"shape-code-block",title:"utils.ts",eyebrow:"code",subtitle:"3 line snippet",topic:"shape: code-block (snippet、 editor tab + 4 syntax lines)",phase:{title:"code-block",body:"editor tab + gutter + 4 syntax lines。 code snippet / editor / 実装"}}),ne=a({id:"shape-kanban-card",kind:"shape-kanban-card",title:"CAR-1111",eyebrow:"in progress",subtitle:"shape-driven kind",topic:"shape: kanban-card (ticket + priority + tags)",phase:{title:"kanban-card",body:"priority bar + ID + status pill + title + tags + avatars。 kanban ticket / Issue"}}),le=a({id:"shape-message-bubble",kind:"shape-message-bubble",title:"了解しました",eyebrow:"message",subtitle:"未読 {v}",metric:{from:0,to:9},topic:"shape: message-bubble (吹き出し、 rounded rect + tail)",phase:{title:"message-bubble",body:"rounded rect + 左下 tail。 message / commit comment / 通知 / チャット"}}),se=a({id:"shape-gear",kind:"shape-gear",title:"Settings",eyebrow:"config",subtitle:"設定 {v} 件",metric:{from:8,to:26},topic:"shape: gear (歯車、 設定 / 処理エンジン)",phase:{title:"gear",body:"12 teeth 大歯車 + 4 spokes + hub + bolt。 config / process engine / 設定"}}),re=a({id:"shape-server-rack",kind:"shape-server-rack",title:"web-01",eyebrow:"server",subtitle:"{v} U rack mount",metric:{from:3,to:12},topic:"shape: server-rack (19 inch rack、 物理サーバ)",phase:{title:"server-rack",body:"外枠 + 3 段 slot の rack。 物理サーバ / データセンター / on-prem 機器"}}),de=a({id:"shape-network-node",kind:"shape-network-node",title:"core-router",eyebrow:"network",subtitle:"L3 · 接続 {v} 台",metric:{from:12,to:96},topic:"shape: network-node (network hub、 router / switch)",phase:{title:"network-node",body:"中央 circle + 4 方向 line。 router / switch / hub / L3 gateway 等"}}),ce=a({id:"shape-mobile-device",kind:"shape-mobile-device",title:"iPhone",eyebrow:"mobile",subtitle:"iOS · {v} 台",metric:{from:200,to:1800},topic:"shape: mobile-device (スマホ、 モバイル端末)",phase:{title:"mobile-device",body:"speaker + screen + home button のスマホ。 mobile app / client 端末"}}),ue=a({id:"shape-iot-sensor",kind:"shape-iot-sensor",title:"温度センサー",eyebrow:"iot",subtitle:"BLE · {v} 度",metric:{from:18,to:34},topic:"shape: iot-sensor (IoT beacon、 電波発信)",phase:{title:"iot-sensor",body:"sensor 円 + 3 波紋 arc。 IoT beacon / センサー / ZigBee / LoRa 端末"}}),pe=a({id:"shape-robot-arm",kind:"shape-robot-arm",title:"組立ライン",eyebrow:"robot",subtitle:"6 軸 · {v} 個/時",metric:{from:40,to:260},topic:"shape: robot-arm (ロボアーム、 産業機器)",phase:{title:"robot-arm",body:"base + 2 関節 + gripper のロボアーム。 産業機器 / 自動化 / 制御対象"}}),be=a({id:"shape-satellite",kind:"shape-satellite",title:"Starlink",eyebrow:"satellite",subtitle:"LEO · 高度 {v} km",metric:{from:340,to:550},topic:"shape: satellite (人工衛星、 エッジ通信)",phase:{title:"satellite",body:"中央 body + 左右 solar panel + アンテナ。 人工衛星 / 宇宙 / エッジ通信"}}),he=a({id:"shape-smart-contract",kind:"shape-smart-contract",title:"Vault.sol",eyebrow:"contract",subtitle:"0.8.24 · 呼出 {v}",metric:{from:12,to:480},topic:"shape: smart-contract (契約書 + 歯車 = 自動実行)",phase:{title:"smart-contract",body:"文書 + 底に歯車 (自動実行)。 Solidity 契約 / DAO 規約 / 自動 escrow"}}),ge=a({id:"shape-blockchain-block",kind:"shape-blockchain-block",title:"Block #421",eyebrow:"chain",subtitle:"0xaf31c9d2...",topic:"shape: blockchain-block (連結 3 block + hash pointer)",phase:{title:"blockchain-block",body:"縦連結 3 block + hash pointer + tx count。 Ethereum / Bitcoin ブロック"}}),ke=a({id:"shape-rpc-node",kind:"shape-rpc-node",title:"Alchemy",eyebrow:"rpc",subtitle:"mainnet · {v} req/s",metric:{from:90,to:1200},topic:"shape: rpc-node (JSON-RPC node + 6 peers + sync bar)",phase:{title:"rpc-node",body:"中央 sphere + 6 peer dot + sync bar。 Infura / Alchemy / node provider"}}),we=a({id:"shape-wallet",kind:"shape-wallet",title:"MetaMask",eyebrow:"wallet",subtitle:"EOA · 残高 {v} ETH",metric:{from:1,to:12},topic:"shape: wallet (財布 + coin + balance display)",phase:{title:"wallet",body:"財布 + coin 差し込み + balance。 MetaMask / Ledger / smart wallet"}}),me=a({id:"shape-nft",kind:"shape-nft",title:"CryptoPunk",eyebrow:"nft",subtitle:"ERC-721 · {v} ETH",metric:{from:3,to:28},w:272,topic:"shape: nft (額縁 + polygonal art + verified badge)",phase:{title:"nft",body:"額縁 + polygonal art + verified check。 ERC-721 / SBT / collection"}}),ve=a({id:"shape-token",kind:"shape-token",title:"ETH",eyebrow:"token",subtitle:"ERC-20 · {v} USD",metric:{from:2100,to:3400},topic:"shape: token (硬貨、 fungible currency)",phase:{title:"token",body:"硬貨 + 通貨 symbol Ξ + shine。 ERC-20 / native currency / stablecoin"}}),ye=a({id:"shape-bank",kind:"shape-bank",title:"みずほ銀行",eyebrow:"bank",subtitle:"都銀 · 預金 {v} 兆円",metric:{from:90,to:142},topic:"shape: bank (Greek facade + 4 columns + $)",phase:{title:"bank",body:"神殿風 facade (pediment + columns + base)。 都銀 / 地銀 / 銀行本店"}}),fe=a({id:"shape-trust-bank",kind:"shape-trust-bank",title:"三菱 UFJ 信託",eyebrow:"trust-bank",subtitle:"受託 {v} 兆円",metric:{from:40,to:88},topic:"shape: trust-bank (bank facade + 冠 crown = 受託の信頼)",phase:{title:"trust-bank",body:"冠 + facade + Ⓣ letter。 信託銀行 / 受託業務 / 資産管理"}}),Ce=a({id:"shape-payment-provider",kind:"shape-payment-provider",title:"Stripe",eyebrow:"payment",subtitle:"決済 {v} 件/s",metric:{from:30,to:420},topic:"shape: payment-provider (POS 端末 + screen + keypad)",phase:{title:"payment-provider",body:"POS 端末 + APPROVED 表示 + keypad。 決済業者 / Stripe / 電子決済手段等取引業"}}),xe=a({id:"shape-brokerage",kind:"shape-brokerage",title:"野村證券",eyebrow:"brokerage",subtitle:"約定 {v} 件",metric:{from:120,to:940},topic:"shape: brokerage (証券会社 tower + candle chart + up arrow)",phase:{title:"brokerage",body:"tower + window grid + candle chart + up arrow。 証券会社 / 投資銀行"}}),Se=a({id:"shape-exchange",kind:"shape-exchange",title:"Coinbase",eyebrow:"exchange",subtitle:"出来高 {v} 億",metric:{from:12,to:86},topic:"shape: exchange (取引所、 $ ⇄ Ξ swap)",phase:{title:"exchange",body:"2 通貨 coin + 双方向 arrow + rate。 取引所 / DEX / 換金"}}),Ne=a({id:"shape-atm",kind:"shape-atm",title:"ATM",eyebrow:"atm",subtitle:"24 h · {v} 件/日",metric:{from:180,to:620},topic:"shape: atm (現金自動預払機、 card slot + cash dispenser)",phase:{title:"atm",body:"screen + button + card slot + dispenser。 銀行 ATM / コンビニ ATM"}}),Ae=a({id:"shape-website",kind:"shape-website",title:"example.com",eyebrow:"website",subtitle:"{v} PV/日",metric:{from:1200,to:8600},topic:"shape: website (browser + URL + page layout)",phase:{title:"website",body:"browser + URL bar + header + 2 col。 corporate / SaaS LP / blog"}}),Pe=a({id:"shape-storefront",kind:"shape-storefront",title:"コンビニ",eyebrow:"store",subtitle:"来店 {v} 人/日",metric:{from:240,to:810},topic:"shape: storefront (実店舗、 awning + door + windows)",phase:{title:"storefront",body:"赤白 awning + OPEN sign + door + windows。 リアル店舗 / 小売"}}),Be=a({id:"shape-warehouse",kind:"shape-warehouse",title:"FC1",eyebrow:"warehouse",subtitle:"在庫 {v} 千点",metric:{from:12,to:48},topic:"shape: warehouse (倉庫、 roof + shutter + boxes)",phase:{title:"warehouse",body:"roof + shutter door + box stack。 fulfillment center / 倉庫"}}),_e=a({id:"shape-online-shop",kind:"shape-online-shop",title:"Amazon",eyebrow:"online-shop",subtitle:"注文 {v} 件/分",metric:{from:6,to:74},topic:"shape: online-shop (browser + cart badge + product grid)",phase:{title:"online-shop",body:"browser + cart badge (3) + 6 product grid。 EC / online 販売"}}),De=a({id:"shape-cdn-edge",kind:"shape-cdn-edge",title:"Cloudflare",eyebrow:"cdn",subtitle:"{v} POP",metric:{from:300,to:380},topic:"shape: cdn-edge (地球儀 + 5 edge nodes + arc)",phase:{title:"cdn-edge",body:"地球儀 + 5 edge dot + dashed connect。 Cloudflare / Fastly / edge network"}}),Te=a({id:"shape-api-gateway",kind:"shape-api-gateway",title:"Kong",eyebrow:"gateway",subtitle:"{v} req/s",metric:{from:400,to:3200},topic:"shape: api-gateway (門柱 + arch + traffic arrow)",phase:{title:"api-gateway",body:"2 柱 + arch + API text + traffic arrow。 Kong / AWS API GW / 門番"}}),Ie=a({id:"shape-auditor",kind:"shape-auditor",title:"監査法人",eyebrow:"auditor",subtitle:"指摘 {v} 件",metric:{from:2,to:17},topic:"shape: auditor (監査人 + magnifier + check)",phase:{title:"auditor",body:"人 + tie + magnifier + check icon。 監査人 / 公認会計士 / 内部監査"}}),Re=a({id:"shape-regulator",kind:"shape-regulator",title:"金融庁",eyebrow:"regulator",subtitle:"検査 {v} 件",metric:{from:4,to:23},topic:"shape: regulator (規制当局 + 冠 crown + 章 badge)",phase:{title:"regulator",body:"人 + crown + 五芒星 badge。 金融庁 / 消費者庁 / 規制当局"}}),Ee=a({id:"shape-notary",kind:"shape-notary",title:"公証役場",eyebrow:"notary",subtitle:"認証 {v} 件",metric:{from:6,to:31},topic:"shape: notary (公証人 + 儒学者風 hat + seal 印)",phase:{title:"notary",body:"人 + 儒学者風 hat + 紅印。 公証人 / 認証業務 / 書類認証"}}),Me=a({id:"shape-lawyer",kind:"shape-lawyer",title:"顧問弁護士",eyebrow:"lawyer",subtitle:"案件 {v} 件",metric:{from:3,to:19},topic:"shape: lawyer (弁護士 + wig + 天秤)",phase:{title:"lawyer",body:"人 + 髪 + 正義の天秤 icon。 弁護士 / 法務顧問 / 法律事務所"}}),Le=a({id:"shape-trader",kind:"shape-trader",title:"デイトレーダー",eyebrow:"trader",subtitle:"約定 {v} 回",metric:{from:8,to:152},topic:"shape: trader (トレーダー + headset + laptop chart)",phase:{title:"trader",body:"人 + headset + laptop with chart。 トレーダー / MM / algo 発注"}}),Oe=a({id:"shape-customer-service",kind:"shape-customer-service",title:"サポート担当",eyebrow:"support",subtitle:"対応 {v} 件",metric:{from:14,to:88},topic:"shape: customer-service (CS + headset + bubble)",phase:{title:"customer-service",body:"人 + headset + speech bubble + name badge。 CS / コールセンター"}}),Fe=a({id:"shape-blockchain",kind:"shape-blockchain",title:"ブロックチェーン",eyebrow:"chain",subtitle:"{v} block",metric:{from:5,to:42},topic:"shape: blockchain (5 block linked chain)",phase:{title:"blockchain",body:"5 block を hash pointer で横に連結。 汎用 chain / L1 / L2 の抽象"}}),He=a({id:"shape-bitcoin-chain",kind:"shape-bitcoin-chain",title:"Bitcoin",eyebrow:"bitcoin",subtitle:"PoW · 高さ {v} 万",metric:{from:84,to:89},topic:"shape: bitcoin-chain (₿ + PoW + 橙色)",phase:{title:"bitcoin-chain",body:"橙 accent + ₿ symbol + PoW mining。 Bitcoin mainnet / testnet"}}),We=a({id:"shape-ethereum-chain",kind:"shape-ethereum-chain",title:"Ethereum",eyebrow:"ethereum",subtitle:"PoS · {v} 万 block",metric:{from:2e3,to:2400},topic:"shape: ethereum-chain (Ξ + PoS + 紫色)",phase:{title:"ethereum-chain",body:"紫 accent + Ξ symbol + PoS validator。 Ethereum mainnet / rollup base"}}),qe=a({id:"shape-blockchain-node",kind:"shape-blockchain-node",title:"フルノード",eyebrow:"node",subtitle:"P2P · peer {v}",metric:{from:8,to:64},topic:"shape: blockchain-node (P2P hex + 6 peers)",phase:{title:"blockchain-node",body:"中央 hex + 6 peer hex + block stack icon。 P2P full / archive / light node"}}),Ge=a({id:"shape-credit-card",kind:"shape-credit-card",title:"クレカ",eyebrow:"card",subtitle:"VISA · {v} 万円",metric:{from:3,to:18},topic:"shape: credit-card (chip + magstripe + brand mark)",phase:{title:"credit-card",body:"chip + NFC wave + 番号 + 名義 + 有効期限 + brand mark。 実物クレジットカード"}}),Ve=t("scene-crypto-transfer",{topic:"scene: crypto 送金 (wallet → exchange → chain)"}).lane("l",{x:0,width:o}).node("w",{lane:"l",stack:0,kind:"shape-wallet",title:"送金者",eyebrow:"wallet",subtitle:"MetaMask EOA"}).node("e",{lane:"l",stack:1,kind:"shape-exchange",title:"DEX",eyebrow:"exchange",subtitle:"clearing"}).node("c",{lane:"l",stack:2,kind:"shape-ethereum-chain",title:"Ethereum",eyebrow:"chain",subtitle:"L1 mainnet"}).edge("w","e",{label:""}).edge("e","c",{label:""}).phase("p1",{duration:750,title:"1. 送金者",body:"MetaMask EOA"},e=>e.activate("w").badge("wallet")).phase("p2",{duration:750,title:"2. DEX",body:"clearing"},e=>e.activate("w").activate("e").badge("exchange")).phase("p3",{duration:750,title:"crypto 送金",body:"wallet が exchange に order を送り、 exchange が chain に settle。 EOA → DEX → L1 の 3-stage scene"},e=>e.activate("w").activate("e").activate("c").badge("chain")).build(),Ue=t("scene-legal-notarization",{topic:"scene: 法務 (弁護士 → 公証人 → 登記)"}).lane("l",{x:0,width:o}).node("l1",{lane:"l",stack:0,kind:"shape-lawyer",title:"代理人",eyebrow:"lawyer",subtitle:"起草"}).node("n",{lane:"l",stack:1,kind:"shape-notary",title:"公証役場",eyebrow:"notary",subtitle:"認証"}).node("f",{lane:"l",stack:2,kind:"shape-file",title:"登記簿",eyebrow:"record",subtitle:"official record"}).edge("l1","n",{label:""}).edge("n","f",{label:""}).phase("p1",{duration:750,title:"1. 代理人",body:"起草"},e=>e.activate("l1").badge("lawyer")).phase("p2",{duration:750,title:"2. 公証役場",body:"認証"},e=>e.activate("l1").activate("n").badge("notary")).phase("p3",{duration:750,title:"法務 flow",body:"弁護士 起草 → 公証人 認証 → 登記簿 記録。 契約 / 遺言 / 不動産譲渡 の formal flow"},e=>e.activate("l1").activate("n").activate("f").badge("record")).build(),Qe=t("scene-banking-flow",{topic:"scene: 銀行送金 (ATM → 銀行 → EC)"}).lane("l",{x:0,width:o}).node("a",{lane:"l",stack:0,kind:"shape-atm",title:"ATM",eyebrow:"atm",subtitle:"cash 出金"}).node("b",{lane:"l",stack:1,kind:"shape-bank",title:"みずほ銀行",eyebrow:"bank",subtitle:"都銀"}).node("s",{lane:"l",stack:2,kind:"shape-online-shop",title:"Amazon",eyebrow:"shop",subtitle:"EC"}).edge("a","b",{label:""}).edge("b","s",{label:""}).phase("p1",{duration:750,title:"1. ATM",body:"cash 出金"},e=>e.activate("a").badge("atm")).phase("p2",{duration:750,title:"2. みずほ銀行",body:"都銀"},e=>e.activate("a").activate("b").badge("bank")).phase("p3",{duration:750,title:"銀行 flow",body:"ATM 出金 → 銀行 口座 → EC 支払い。 日常の消費者送金 flow"},e=>e.activate("a").activate("b").activate("s").badge("shop")).build(),je=t("scene-iot-onchain",{topic:"scene: IoT オンチェーン (sensor → RPC → contract)"}).lane("l",{x:0,width:o}).node("s",{lane:"l",stack:0,kind:"shape-iot-sensor",title:"温度計",eyebrow:"sensor",subtitle:"BLE"}).node("r",{lane:"l",stack:1,kind:"shape-rpc-node",title:"Infura",eyebrow:"rpc",subtitle:"provider"}).node("c",{lane:"l",stack:2,kind:"shape-smart-contract",title:"OracleContract",eyebrow:"contract",subtitle:"Solidity",w:360}).edge("s","r",{label:""}).edge("r","c",{label:""}).phase("p1",{duration:750,title:"1. 温度計",body:"BLE"},e=>e.activate("s").badge("sensor")).phase("p2",{duration:750,title:"2. Infura",body:"provider"},e=>e.activate("s").activate("r").badge("rpc")).phase("p3",{duration:750,title:"IoT オンチェーン",body:"IoT センサー → RPC → smart contract。 real-world data を Chainlink Oracle 経由で on-chain 記録"},e=>e.activate("s").activate("r").activate("c").badge("contract")).build(),Je=t("scene-audit-flow",{topic:"scene: 監査 (auditor → 帳簿 → regulator)"}).lane("l",{x:0,width:o}).node("a",{lane:"l",stack:0,kind:"shape-auditor",title:"監査法人",eyebrow:"auditor",subtitle:"検査"}).node("f",{lane:"l",stack:1,kind:"shape-file",title:"会計帳簿",eyebrow:"record",subtitle:"ledger"}).node("r",{lane:"l",stack:2,kind:"shape-regulator",title:"金融庁",eyebrow:"regulator",subtitle:"監督"}).edge("a","f",{label:""}).edge("f","r",{label:""}).phase("p1",{duration:750,title:"1. 監査法人",body:"検査"},e=>e.activate("a").badge("auditor")).phase("p2",{duration:750,title:"2. 会計帳簿",body:"ledger"},e=>e.activate("a").activate("f").badge("record")).phase("p3",{duration:750,title:"監査 flow",body:"監査法人 → 帳簿 検証 → 規制当局 報告。 上場企業 財務監査の 3-stage flow"},e=>e.activate("a").activate("f").activate("r").badge("regulator")).build(),Ye=t("scene-stock-trading",{topic:"scene: 証券取引 (trader → 証券会社 → 取引所)"}).lane("l",{x:0,width:o}).node("t",{lane:"l",stack:0,kind:"shape-trader",title:"個人投資家",eyebrow:"trader",subtitle:"retail"}).node("b",{lane:"l",stack:1,kind:"shape-brokerage",title:"野村証券",eyebrow:"broker",subtitle:"投資銀行"}).node("e",{lane:"l",stack:2,kind:"shape-exchange",title:"東証",eyebrow:"exchange",subtitle:"TSE"}).edge("t","b",{label:""}).edge("b","e",{label:""}).phase("p1",{duration:750,title:"1. 個人投資家",body:"retail"},e=>e.activate("t").badge("trader")).phase("p2",{duration:750,title:"2. 野村証券",body:"投資銀行"},e=>e.activate("t").activate("b").badge("broker")).phase("p3",{duration:750,title:"証券取引",body:"トレーダー → 証券会社 発注 → 取引所 約定。 株式売買の 3-stage scene"},e=>e.activate("t").activate("b").activate("e").badge("exchange")).build(),ze=t("scene-support-flow",{topic:"scene: 問い合わせ (CS → ticket → 開発)"}).lane("l",{x:0,width:o}).node("c",{lane:"l",stack:0,kind:"shape-customer-service",title:"サポート担当",eyebrow:"support",subtitle:"24H 対応"}).node("k",{lane:"l",stack:1,kind:"shape-kanban-card",title:"BUG-1234",eyebrow:"ticket",subtitle:"Linear"}).node("d",{lane:"l",stack:2,kind:"shape-code-block",title:"hotfix.ts",eyebrow:"commit",subtitle:"fix by dev"}).edge("c","k",{label:""}).edge("k","d",{label:""}).phase("p1",{duration:750,title:"1. サポート担当",body:"24H 対応"},e=>e.activate("c").badge("support")).phase("p2",{duration:750,title:"2. BUG-1234",body:"Linear"},e=>e.activate("c").activate("k").badge("ticket")).phase("p3",{duration:750,title:"問い合わせ flow",body:"CS 受電 → Ticket 起票 → 開発 hotfix。 一般 SaaS の bug report → fix の 3-stage flow"},e=>e.activate("c").activate("k").activate("d").badge("commit")).build(),$e=t("scene-payment-settlement",{topic:"scene: 決済 (provider → クレカ → 銀行)"}).lane("l",{x:0,width:o}).node("p",{lane:"l",stack:0,kind:"shape-payment-provider",title:"Stripe",eyebrow:"provider",subtitle:"SaaS"}).node("c",{lane:"l",stack:1,kind:"shape-credit-card",title:"VISA",eyebrow:"card",subtitle:"credit"}).node("b",{lane:"l",stack:2,kind:"shape-bank",title:"発行銀行",eyebrow:"issuer",subtitle:"MUFG"}).edge("p","c",{label:""}).edge("c","b",{label:""}).phase("p1",{duration:750,title:"1. Stripe",body:"SaaS"},e=>e.activate("p").badge("provider")).phase("p2",{duration:750,title:"2. VISA",body:"credit"},e=>e.activate("p").activate("c").badge("card")).phase("p3",{duration:750,title:"決済 flow",body:"Stripe → クレカ authorization → 発行銀行 決済。 EC 決済の card processing 3-stage flow"},e=>e.activate("p").activate("c").activate("b").badge("issuer")).build(),Ke=t("scene-web-infra",{topic:"scene: web infra (website → CDN → server)"}).lane("l",{x:0,width:o}).node("w",{lane:"l",stack:0,kind:"shape-website",title:"example.com",eyebrow:"site",subtitle:"SPA"}).node("c",{lane:"l",stack:1,kind:"shape-cdn-edge",title:"Cloudflare",eyebrow:"cdn",subtitle:"edge"}).node("s",{lane:"l",stack:2,kind:"shape-server-rack",title:"origin",eyebrow:"server",subtitle:"AWS"}).edge("w","c",{label:""}).edge("c","s",{label:""}).phase("p1",{duration:750,title:"1. example.com",body:"SPA"},e=>e.activate("w").badge("site")).phase("p2",{duration:750,title:"2. Cloudflare",body:"edge"},e=>e.activate("w").activate("c").badge("cdn")).phase("p3",{duration:750,title:"web infra",body:"website request → CDN cache → origin server。 web 配信の standard 3-tier"},e=>e.activate("w").activate("c").activate("s").badge("server")).build(),Xe=t("scene-nft-mint",{topic:"scene: NFT mint (wallet → contract → NFT)"}).lane("l",{x:0,width:o}).node("w",{lane:"l",stack:0,kind:"shape-wallet",title:"creator",eyebrow:"wallet",subtitle:"artist"}).node("c",{lane:"l",stack:1,kind:"shape-smart-contract",title:"ERC-721",eyebrow:"contract",subtitle:"OpenSea"}).node("n",{lane:"l",stack:2,kind:"shape-nft",title:"Rare Punk",eyebrow:"nft",subtitle:"#42"}).edge("w","c",{label:""}).edge("c","n",{label:""}).phase("p1",{duration:750,title:"1. creator",body:"artist"},e=>e.activate("w").badge("wallet")).phase("p2",{duration:750,title:"2. ERC-721",body:"OpenSea"},e=>e.activate("w").activate("c").badge("contract")).phase("p3",{duration:750,title:"NFT mint",body:"wallet → ERC-721 contract 呼出 → NFT 発行。 minting の canonical 3-stage flow"},e=>e.activate("w").activate("c").activate("n").badge("nft")).build(),Ze=t("scene-token-bridge",{topic:"scene: token bridge (chain A → bridge → chain B)"}).lane("l",{x:0,width:o}).node("a",{lane:"l",stack:0,kind:"shape-ethereum-chain",title:"Ethereum",eyebrow:"src chain",subtitle:"L1"}).node("b",{lane:"l",stack:1,kind:"shape-smart-contract",title:"Bridge",eyebrow:"contract",subtitle:"lock"}).node("c",{lane:"l",stack:2,kind:"shape-blockchain",title:"Arbitrum",eyebrow:"dst chain",subtitle:"L2"}).edge("a","b",{label:""}).edge("b","c",{label:""}).phase("p1",{duration:750,title:"1. Ethereum",body:"L1"},e=>e.activate("a").badge("src chain")).phase("p2",{duration:750,title:"2. Bridge",body:"lock"},e=>e.activate("a").activate("b").badge("contract")).phase("p3",{duration:750,title:"token bridge",body:"src chain で lock → bridge contract → dst chain で mint。 cross-chain 資産移動"},e=>e.activate("a").activate("b").activate("c").badge("dst chain")).build(),et=t("scene-defi-lending",{topic:"scene: DeFi lending (wallet → contract → token)"}).lane("l",{x:0,width:o}).node("w",{lane:"l",stack:0,kind:"shape-wallet",title:"供給者",eyebrow:"wallet",subtitle:"USDC 供給"}).node("c",{lane:"l",stack:1,kind:"shape-smart-contract",title:"Aave v3",eyebrow:"lending",subtitle:"pool"}).node("t",{lane:"l",stack:2,kind:"shape-token",title:"aUSDC",eyebrow:"token",subtitle:"yield-bearing"}).edge("w","c",{label:""}).edge("c","t",{label:""}).phase("p1",{duration:750,title:"1. 供給者",body:"USDC 供給"},e=>e.activate("w").badge("wallet")).phase("p2",{duration:750,title:"2. Aave v3",body:"pool"},e=>e.activate("w").activate("c").badge("lending")).phase("p3",{duration:750,title:"DeFi lending",body:"wallet が Aave に USDC を供給 → aUSDC (yield-bearing) を発行受領。 利息付き貸出の canonical flow"},e=>e.activate("w").activate("c").activate("t").badge("token")).build(),tt=t("scene-bitcoin-tx",{topic:"scene: bitcoin tx (wallet → BTC chain → node)"}).lane("l",{x:0,width:o}).node("w",{lane:"l",stack:0,kind:"shape-wallet",title:"sender",eyebrow:"wallet",subtitle:"Bitcoin Core"}).node("c",{lane:"l",stack:1,kind:"shape-bitcoin-chain",title:"BTC mainnet",eyebrow:"chain",subtitle:"PoW"}).node("n",{lane:"l",stack:2,kind:"shape-blockchain-node",title:"full node",eyebrow:"node",subtitle:"validator"}).edge("w","c",{label:""}).edge("c","n",{label:""}).phase("p1",{duration:750,title:"1. sender",body:"Bitcoin Core"},e=>e.activate("w").badge("wallet")).phase("p2",{duration:750,title:"2. BTC mainnet",body:"PoW"},e=>e.activate("w").activate("c").badge("chain")).phase("p3",{duration:750,title:"bitcoin tx",body:"wallet で tx 署名 → BTC chain broadcast → full node が承認。 P2P 送金の 3-stage flow"},e=>e.activate("w").activate("c").activate("n").badge("node")).build(),at=t("scene-ec-order",{topic:"scene: EC 注文 (customer → shop → warehouse)"}).lane("l",{x:0,width:o}).node("c",{lane:"l",stack:0,kind:"shape-customer-service",title:"顧客",eyebrow:"customer",subtitle:"注文"}).node("s",{lane:"l",stack:1,kind:"shape-online-shop",title:"Rakuten",eyebrow:"shop",subtitle:"EC"}).node("w",{lane:"l",stack:2,kind:"shape-warehouse",title:"物流倉庫",eyebrow:"warehouse",subtitle:"出荷"}).edge("c","s",{label:""}).edge("s","w",{label:""}).phase("p1",{duration:750,title:"1. 顧客",body:"注文"},e=>e.activate("c").badge("customer")).phase("p2",{duration:750,title:"2. Rakuten",body:"EC"},e=>e.activate("c").activate("s").badge("shop")).phase("p3",{duration:750,title:"EC 注文",body:"顧客 注文 → EC 受注 → 倉庫 出荷指示。 物販 fulfillment flow"},e=>e.activate("c").activate("s").activate("w").badge("warehouse")).build(),it=t("scene-mobile-api",{topic:"scene: mobile app (mobile → API gateway → server)"}).lane("l",{x:0,width:o}).node("m",{lane:"l",stack:0,kind:"shape-mobile-device",title:"iOS app",eyebrow:"mobile",subtitle:"SwiftUI"}).node("g",{lane:"l",stack:1,kind:"shape-api-gateway",title:"GraphQL",eyebrow:"gateway",subtitle:"Apollo"}).node("s",{lane:"l",stack:2,kind:"shape-server-rack",title:"backend",eyebrow:"server",subtitle:"K8s"}).edge("m","g",{label:""}).edge("g","s",{label:""}).phase("p1",{duration:750,title:"1. iOS app",body:"SwiftUI"},e=>e.activate("m").badge("mobile")).phase("p2",{duration:750,title:"2. GraphQL",body:"Apollo"},e=>e.activate("m").activate("g").badge("gateway")).phase("p3",{duration:750,title:"mobile API",body:"mobile app request → API gateway auth/route → backend server 処理。 modern mobile stack"},e=>e.activate("m").activate("g").activate("s").badge("server")).build(),ot=t("scene-factory-line",{topic:"scene: 工場ライン (robot → sensor → DB)"}).lane("l",{x:0,width:o}).node("r",{lane:"l",stack:0,kind:"shape-robot-arm",title:"FANUC robot",eyebrow:"robot",subtitle:"組立",w:294}).node("s",{lane:"l",stack:1,kind:"shape-iot-sensor",title:"計測 sensor",eyebrow:"sensor",subtitle:"品質"}).node("d",{lane:"l",stack:2,kind:"shape-cylinder",title:"MES DB",eyebrow:"database",subtitle:"traceability"}).edge("r","s",{label:""}).edge("s","d",{label:""}).phase("p1",{duration:750,title:"1. FANUC robot",body:"組立"},e=>e.activate("r").badge("robot")).phase("p2",{duration:750,title:"2. 計測 sensor",body:"品質"},e=>e.activate("r").activate("s").badge("sensor")).phase("p3",{duration:750,title:"factory line",body:"robot arm 作業 → 計測 sensor が品質確認 → MES DB に記録。 スマート工場の canonical"},e=>e.activate("r").activate("s").activate("d").badge("database")).build(),nt=t("scene-satellite-chain",{topic:"scene: satellite (satellite → RPC → chain)"}).lane("l",{x:0,width:o}).node("s",{lane:"l",stack:0,kind:"shape-satellite",title:"Starlink",eyebrow:"satellite",subtitle:"LEO"}).node("r",{lane:"l",stack:1,kind:"shape-rpc-node",title:"Alchemy",eyebrow:"rpc",subtitle:"endpoint"}).node("c",{lane:"l",stack:2,kind:"shape-blockchain",title:"Solana",eyebrow:"chain",subtitle:"high TPS"}).edge("s","r",{label:""}).edge("r","c",{label:""}).phase("p1",{duration:750,title:"1. Starlink",body:"LEO"},e=>e.activate("s").badge("satellite")).phase("p2",{duration:750,title:"2. Alchemy",body:"endpoint"},e=>e.activate("s").activate("r").badge("rpc")).phase("p3",{duration:750,title:"satellite chain",body:"衛星 データ → RPC 中継 → chain 記録。 space-to-chain の real-world data 送信"},e=>e.activate("s").activate("r").activate("c").badge("chain")).build(),lt=t("scene-devops",{topic:"scene: DevOps (code → CI → cloud)"}).lane("l",{x:0,width:o}).node("c",{lane:"l",stack:0,kind:"shape-code-block",title:"src/",eyebrow:"code",subtitle:"TypeScript"}).node("g",{lane:"l",stack:1,kind:"shape-gear",title:"GitHub Actions",eyebrow:"ci",subtitle:"build + test",w:360}).node("d",{lane:"l",stack:2,kind:"shape-cloud",title:"AWS ECS",eyebrow:"deploy",subtitle:"container"}).edge("c","g",{label:""}).edge("g","d",{label:""}).phase("p1",{duration:750,title:"1. src/",body:"TypeScript"},e=>e.activate("c").badge("code")).phase("p2",{duration:750,title:"2. GitHub Actions",body:"build + test"},e=>e.activate("c").activate("g").badge("ci")).phase("p3",{duration:750,title:"DevOps",body:"code push → CI build/test → cloud deploy。 modern CI/CD の canonical 3-stage flow"},e=>e.activate("c").activate("g").activate("d").badge("deploy")).build(),st=t("scene-task-flow",{topic:"scene: task flow (kanban → terminal → file)"}).lane("l",{x:0,width:o}).node("k",{lane:"l",stack:0,kind:"shape-kanban-card",title:"todo #42",eyebrow:"kanban",subtitle:"in progress"}).node("t",{lane:"l",stack:1,kind:"shape-terminal",title:"$ npm run build",eyebrow:"terminal",subtitle:"shell",w:382}).node("f",{lane:"l",stack:2,kind:"shape-file",title:"build.log",eyebrow:"file",subtitle:"output"}).edge("k","t",{label:""}).edge("t","f",{label:""}).phase("p1",{duration:750,title:"1. todo #42",body:"in progress"},e=>e.activate("k").badge("kanban")).phase("p2",{duration:750,title:"2. $ npm run build",body:"shell"},e=>e.activate("k").activate("t").badge("terminal")).phase("p3",{duration:750,title:"task flow",body:"kanban task 着手 → terminal で作業 → file 出力保存。 開発者の日常 flow"},e=>e.activate("k").activate("t").activate("f").badge("file")).build(),rt=t("scene-notification",{topic:"scene: 通知 (message → service → app)"}).lane("l",{x:0,width:o}).node("m",{lane:"l",stack:0,kind:"shape-message-bubble",title:"@alice",eyebrow:"message",subtitle:"Slack"}).node("h",{lane:"l",stack:1,kind:"shape-hexagon",title:"NotifyService",eyebrow:"service",subtitle:"push",w:338}).node("w",{lane:"l",stack:2,kind:"shape-window",title:"デスクトップ通知",eyebrow:"window",subtitle:"OS native"}).edge("m","h",{label:""}).edge("h","w",{label:""}).phase("p1",{duration:750,title:"1. @alice",body:"Slack"},e=>e.activate("m").badge("message")).phase("p2",{duration:750,title:"2. NotifyService",body:"push"},e=>e.activate("m").activate("h").badge("service")).phase("p3",{duration:750,title:"通知",body:"message 送信 → notify service push → 受信者 desktop 通知表示。 messaging の end-to-end"},e=>e.activate("m").activate("h").activate("w").badge("window")).build(),dt=t("scene-trust-asset",{topic:"scene: 信託資産 (trader → trust bank → 帳簿)"}).lane("l",{x:0,width:o}).node("t",{lane:"l",stack:0,kind:"shape-trader",title:"資産運用者",eyebrow:"trader",subtitle:"buy 指示"}).node("b",{lane:"l",stack:1,kind:"shape-trust-bank",title:"三井住友信託",eyebrow:"trust",subtitle:"受託"}).node("f",{lane:"l",stack:2,kind:"shape-file",title:"運用報告書",eyebrow:"record",subtitle:"月次"}).edge("t","b",{label:""}).edge("b","f",{label:""}).phase("p1",{duration:750,title:"1. 資産運用者",body:"buy 指示"},e=>e.activate("t").badge("trader")).phase("p2",{duration:750,title:"2. 三井住友信託",body:"受託"},e=>e.activate("t").activate("b").badge("trust")).phase("p3",{duration:750,title:"信託資産",body:"運用者 buy 指示 → 信託銀行 受託 → 月次報告書 発行。 institutional 資産管理"},e=>e.activate("t").activate("b").activate("f").badge("record")).build(),ct=t("scene-consensus",{topic:"scene: consensus (node → block → chain)"}).lane("l",{x:0,width:o}).node("n",{lane:"l",stack:0,kind:"shape-blockchain-node",title:"validator",eyebrow:"node",subtitle:"PoS"}).node("b",{lane:"l",stack:1,kind:"shape-blockchain-block",title:"block #8123456",eyebrow:"block",subtitle:"proposed",w:360}).node("c",{lane:"l",stack:2,kind:"shape-blockchain",title:"canonical chain",eyebrow:"chain",subtitle:"finalized"}).edge("n","b",{label:""}).edge("b","c",{label:""}).phase("p1",{duration:750,title:"1. validator",body:"PoS"},e=>e.activate("n").badge("node")).phase("p2",{duration:750,title:"2. block #8123456",body:"proposed"},e=>e.activate("n").activate("b").badge("block")).phase("p3",{duration:750,title:"consensus",body:"validator が block 提案 → attestation 集約 → chain finalize。 PoS consensus の canonical"},e=>e.activate("n").activate("b").activate("c").badge("chain")).build(),ut=t("scene-token-deploy",{topic:"scene: token deploy (dev → contract → token)"}).lane("l",{x:0,width:o}).node("d",{lane:"l",stack:0,kind:"shape-lawyer",title:"deployer",eyebrow:"dev",subtitle:"founder"}).node("c",{lane:"l",stack:1,kind:"shape-smart-contract",title:"ERC-20",eyebrow:"contract",subtitle:"OpenZeppelin"}).node("t",{lane:"l",stack:2,kind:"shape-token",title:"$KIWA",eyebrow:"token",subtitle:"1B supply"}).edge("d","c",{label:""}).edge("c","t",{label:""}).phase("p1",{duration:750,title:"1. deployer",body:"founder"},e=>e.activate("d").badge("dev")).phase("p2",{duration:750,title:"2. ERC-20",body:"OpenZeppelin"},e=>e.activate("d").activate("c").badge("contract")).phase("p3",{duration:750,title:"token deploy",body:"developer が ERC-20 contract deploy → token 発行 → market 供給。 project trickery 開始"},e=>e.activate("d").activate("c").activate("t").badge("token")).build(),pt=t("scene-compliance",{topic:"scene: 規制対応 (regulator → 帳簿 → bank)"}).lane("l",{x:0,width:o}).node("r",{lane:"l",stack:0,kind:"shape-regulator",title:"金融庁",eyebrow:"regulator",subtitle:"検査"}).node("f",{lane:"l",stack:1,kind:"shape-file",title:"取引記録",eyebrow:"record",subtitle:"audit trail"}).node("b",{lane:"l",stack:2,kind:"shape-bank",title:"対象銀行",eyebrow:"bank",subtitle:"検査対象"}).edge("r","f",{label:""}).edge("f","b",{label:""}).phase("p1",{duration:750,title:"1. 金融庁",body:"検査"},e=>e.activate("r").badge("regulator")).phase("p2",{duration:750,title:"2. 取引記録",body:"audit trail"},e=>e.activate("r").activate("f").badge("record")).phase("p3",{duration:750,title:"compliance",body:"規制当局 検査開始 → 帳簿 提出 → 銀行 検査対応。 金融庁 検査の canonical flow"},e=>e.activate("r").activate("f").activate("b").badge("bank")).build(),bt=t("scene-nft-marketplace",{topic:"scene: NFT 売買 (buyer → marketplace → NFT)"}).lane("l",{x:0,width:o}).node("b",{lane:"l",stack:0,kind:"shape-wallet",title:"buyer",eyebrow:"wallet",subtitle:"collector"}).node("m",{lane:"l",stack:1,kind:"shape-exchange",title:"OpenSea",eyebrow:"marketplace",subtitle:"royalty 5%"}).node("n",{lane:"l",stack:2,kind:"shape-nft",title:"BAYC #7890",eyebrow:"nft",subtitle:"Bored Ape",w:272}).edge("b","m",{label:""}).edge("m","n",{label:""}).phase("p1",{duration:750,title:"1. buyer",body:"collector"},e=>e.activate("b").badge("wallet")).phase("p2",{duration:750,title:"2. OpenSea",body:"royalty 5%"},e=>e.activate("b").activate("m").badge("marketplace")).phase("p3",{duration:750,title:"NFT marketplace",body:"buyer が marketplace で bid → contract 実行 → NFT ownership 移転。 secondary market flow"},e=>e.activate("b").activate("m").activate("n").badge("nft")).build(),ht=t("scene-network-path",{topic:"scene: network (router → hub → server)"}).lane("l",{x:0,width:o}).node("m",{lane:"l",stack:0,kind:"shape-mobile-device",title:"client",eyebrow:"device",subtitle:"端末"}).node("n",{lane:"l",stack:1,kind:"shape-network-node",title:"core switch",eyebrow:"network",subtitle:"L2/L3"}).node("s",{lane:"l",stack:2,kind:"shape-server-rack",title:"app server",eyebrow:"server",subtitle:"DC",w:272}).edge("m","n",{label:""}).edge("n","s",{label:""}).phase("p1",{duration:750,title:"1. client",body:"端末"},e=>e.activate("m").badge("device")).phase("p2",{duration:750,title:"2. core switch",body:"L2/L3"},e=>e.activate("m").activate("n").badge("network")).phase("p3",{duration:750,title:"network path",body:"client 端末 → network core switch 経由 → server 到達。 typical enterprise network 3-stage path"},e=>e.activate("m").activate("n").activate("s").badge("server")).build(),gt=t("scene-checkout",{topic:"scene: checkout (site → provider → card)"}).lane("l",{x:0,width:o}).node("w",{lane:"l",stack:0,kind:"shape-website",title:"shop.example.com",eyebrow:"site",subtitle:"cart",w:404}).node("p",{lane:"l",stack:1,kind:"shape-payment-provider",title:"PayPal",eyebrow:"provider",subtitle:"checkout"}).node("c",{lane:"l",stack:2,kind:"shape-credit-card",title:"MasterCard",eyebrow:"card",subtitle:"credit"}).edge("w","p",{label:""}).edge("p","c",{label:""}).phase("p1",{duration:750,title:"1. shop.example.com",body:"cart"},e=>e.activate("w").badge("site")).phase("p2",{duration:750,title:"2. PayPal",body:"checkout"},e=>e.activate("w").activate("p").badge("provider")).phase("p3",{duration:750,title:"checkout",body:"サイトで cart 送信 → 決済 provider 経由 → クレカ authorization。 EC checkout の canonical"},e=>e.activate("w").activate("p").activate("c").badge("card")).build(),kt=t("scene-edge-compute",{topic:"scene: edge compute (mobile → CDN → cloud)"}).lane("l",{x:0,width:o}).node("m",{lane:"l",stack:0,kind:"shape-mobile-device",title:"Android app",eyebrow:"mobile",subtitle:"user",w:294}).node("e",{lane:"l",stack:1,kind:"shape-cdn-edge",title:"Fastly edge",eyebrow:"edge",subtitle:"compute@edge"}).node("c",{lane:"l",stack:2,kind:"shape-cloud",title:"GCP origin",eyebrow:"cloud",subtitle:"fallback"}).edge("m","e",{label:""}).edge("e","c",{label:""}).phase("p1",{duration:750,title:"1. Android app",body:"user"},e=>e.activate("m").badge("mobile")).phase("p2",{duration:750,title:"2. Fastly edge",body:"compute@edge"},e=>e.activate("m").activate("e").badge("edge")).phase("p3",{duration:750,title:"edge compute",body:"mobile request → CDN edge で compute → origin fallback。 low-latency delivery"},e=>e.activate("m").activate("e").activate("c").badge("cloud")).build(),wt=t("scene-version-deploy",{topic:"scene: version deploy (stack → gear → site)"}).lane("l",{x:0,width:o}).node("s",{lane:"l",stack:0,kind:"shape-stack",title:"release v3.2.0",eyebrow:"release",subtitle:"tagged",w:360}).node("g",{lane:"l",stack:1,kind:"shape-gear",title:"deploy pipeline",eyebrow:"ci",subtitle:"canary",w:382}).node("w",{lane:"l",stack:2,kind:"shape-website",title:"prod.example.com",eyebrow:"site",subtitle:"live",w:404}).edge("s","g",{label:""}).edge("g","w",{label:""}).phase("p1",{duration:750,title:"1. release v3.2.0",body:"tagged"},e=>e.activate("s").badge("release")).phase("p2",{duration:750,title:"2. deploy pipeline",body:"canary"},e=>e.activate("s").activate("g").badge("ci")).phase("p3",{duration:750,title:"version deploy",body:"release tag → deploy pipeline canary → production site 反映。 SaaS deploy の standard"},e=>e.activate("s").activate("g").activate("w").badge("site")).build(),mt=t("scene-audit-chain",{topic:"scene: audit chain (auditor → file → regulator)"}).lane("l",{x:0,width:o}).node("a",{lane:"l",stack:0,kind:"shape-auditor",title:"監査法人",eyebrow:"auditor",subtitle:"PwC"}).node("f",{lane:"l",stack:1,kind:"shape-file",title:"監査報告書",eyebrow:"report",subtitle:"signed"}).node("r",{lane:"l",stack:2,kind:"shape-regulator",title:"金融庁",eyebrow:"regulator",subtitle:"受領"}).edge("a","f",{label:""}).edge("f","r",{label:""}).phase("p1",{duration:750,title:"1. 監査法人",body:"PwC"},e=>e.activate("a").badge("auditor")).phase("p2",{duration:750,title:"2. 監査報告書",body:"signed"},e=>e.activate("a").activate("f").badge("report")).phase("p3",{duration:750,title:"audit chain",body:"監査法人 検査 → 報告書 作成 → 規制当局 受領。 上場企業 quarterly audit の canonical"},e=>e.activate("a").activate("f").activate("r").badge("regulator")).build(),vt=`title: "crypto 送金"
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
`,yt=`{
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
}`,ft=`title: "法務 flow"
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
`,Ct=`{
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
}`,xt=`title: "NFT mint"
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
`,St=`{
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
}`,Nt=`title: "銀行 flow"
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
`,At=`{
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
}`,Pt=`title: "IoT オンチェーン"
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
`,Bt=`{
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
}`,_t=`title: "監査 flow"
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
`,Dt=`{
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
}`,Tt=`title: "証券取引"
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
`,It=`{
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
}`,Rt=`title: "問い合わせ flow"
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
`,Et=`{
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
}`,Mt=`title: "決済 flow"
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
`,Lt=`{
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
}`,Ot=`title: "web infra"
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
`,Ft=`{
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
}`,Ht=`title: "token bridge"
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
`,Wt=`{
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
}`,qt=`title: "DeFi lending"
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
`,Gt=`{
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
}`,Vt=`title: "bitcoin tx"
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
`,Ut=`{
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
}`,Qt=`title: "EC 注文"
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
`,jt=`{
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
}`,Jt=`title: "mobile API"
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
`,Yt=`{
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
}`,zt=`title: "factory line"
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
`,$t=`{
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
}`,Kt=`title: "satellite chain"
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
`,Xt=`{
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
}`,Zt=`title: "DevOps"
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
`,ea=`{
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
}`,ta=`title: "task flow"
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
`,aa=`{
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
}`,ia=`title: "通知"
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
`,oa=`{
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
}`,na=`title: "信託資産"
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
`,la=`{
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
}`,sa=`title: "consensus"
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
`,ra=`{
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
}`,da=`title: "token deploy"
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
`,ca=`{
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
}`,ua=`title: "compliance"
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
`,pa=`{
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
}`,ba=`title: "NFT marketplace"
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
`,ha=`{
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
}`,ga=`title: "network path"
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
`,ka=`{
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
}`,wa=`title: "checkout"
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
`,ma=`{
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
}`,va=`title: "edge compute"
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
`,ya=`{
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
}`,fa=`title: "version deploy"
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
`,Ca=`{
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
}`,xa=`title: "audit chain"
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
`,Sa=`{
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
}`,Na=Object.freeze(Object.defineProperty({__proto__:null,kindActor:F,kindCard:G,kindEvent:q,kindFunction:H,kindStorage:W,laneContain:Q,laneMulti:U,laneSingle:V,sceneAuditChain:mt,sceneAuditFlow:Je,sceneBankingFlow:Qe,sceneBitcoinTx:tt,sceneCheckout:gt,sceneCompliance:pt,sceneConsensus:ct,sceneCryptoTransfer:Ve,sceneDefiLending:et,sceneDevOps:lt,sceneEcOrder:at,sceneEdgeCompute:kt,sceneFactoryLine:ot,sceneIotOnchain:je,sceneLegalNotarization:Ue,sceneMobileApi:it,sceneNetworkPath:ht,sceneNftMarketplace:bt,sceneNftMint:Xe,sceneNotification:rt,scenePaymentSettlement:$e,sceneSatelliteChain:nt,sceneStockTrading:Ye,sceneSupportFlow:ze,sceneTaskFlow:st,sceneTokenBridge:Ze,sceneTokenDeploy:ut,sceneTrustAsset:dt,sceneVersionDeploy:wt,sceneWebInfra:Ke,shapeApiGateway:Te,shapeAtm:Ne,shapeAuditor:Ie,shapeBank:ye,shapeBitcoinChain:He,shapeBlockchain:Fe,shapeBlockchainBlock:ge,shapeBlockchainNode:qe,shapeBrokerage:xe,shapeCdnEdge:De,shapeCloud:$,shapeCodeBlock:oe,shapeCreditCard:Ge,shapeCustomerService:Oe,shapeCylinder:K,shapeDiamond:Z,shapeEthereumChain:We,shapeExchange:Se,shapeFile:Y,shapeFolder:z,shapeGear:se,shapeHexagon:X,shapeIotSensor:ue,shapeKanbanCard:ne,shapeLawyer:Me,shapeMessageBubble:le,shapeMobileDevice:ce,shapeNetworkNode:de,shapeNft:me,shapeNotary:Ee,shapeOnlineShop:_e,shapePaymentProvider:Ce,shapePerson:te,shapeRegulator:Re,shapeRobotArm:pe,shapeRpcNode:ke,shapeSatellite:be,shapeServerRack:re,shapeSmartContract:he,shapeStack:ee,shapeStorefront:Pe,shapeTerminal:ie,shapeToken:ve,shapeTrader:Le,shapeTrustBank:fe,shapeWallet:we,shapeWarehouse:Be,shapeWebsite:Ae,shapeWindow:ae,sourceJson__sceneAuditChain:Sa,sourceJson__sceneAuditFlow:Dt,sourceJson__sceneBankingFlow:At,sourceJson__sceneBitcoinTx:Ut,sourceJson__sceneCheckout:ma,sourceJson__sceneCompliance:pa,sourceJson__sceneConsensus:ra,sourceJson__sceneCryptoTransfer:yt,sourceJson__sceneDefiLending:Gt,sourceJson__sceneDevOps:ea,sourceJson__sceneEcOrder:jt,sourceJson__sceneEdgeCompute:ya,sourceJson__sceneFactoryLine:$t,sourceJson__sceneIotOnchain:Bt,sourceJson__sceneLegalNotarization:Ct,sourceJson__sceneMobileApi:Yt,sourceJson__sceneNetworkPath:ka,sourceJson__sceneNftMarketplace:ha,sourceJson__sceneNftMint:St,sourceJson__sceneNotification:oa,sourceJson__scenePaymentSettlement:Lt,sourceJson__sceneSatelliteChain:Xt,sourceJson__sceneStockTrading:It,sourceJson__sceneSupportFlow:Et,sourceJson__sceneTaskFlow:aa,sourceJson__sceneTokenBridge:Wt,sourceJson__sceneTokenDeploy:ca,sourceJson__sceneTrustAsset:la,sourceJson__sceneVersionDeploy:Ca,sourceJson__sceneWebInfra:Ft,sourceYaml__sceneAuditChain:xa,sourceYaml__sceneAuditFlow:_t,sourceYaml__sceneBankingFlow:Nt,sourceYaml__sceneBitcoinTx:Vt,sourceYaml__sceneCheckout:wa,sourceYaml__sceneCompliance:ua,sourceYaml__sceneConsensus:sa,sourceYaml__sceneCryptoTransfer:vt,sourceYaml__sceneDefiLending:qt,sourceYaml__sceneDevOps:Zt,sourceYaml__sceneEcOrder:Qt,sourceYaml__sceneEdgeCompute:va,sourceYaml__sceneFactoryLine:zt,sourceYaml__sceneIotOnchain:Pt,sourceYaml__sceneLegalNotarization:ft,sourceYaml__sceneMobileApi:Jt,sourceYaml__sceneNetworkPath:ga,sourceYaml__sceneNftMarketplace:ba,sourceYaml__sceneNftMint:xt,sourceYaml__sceneNotification:ia,sourceYaml__scenePaymentSettlement:Mt,sourceYaml__sceneSatelliteChain:Kt,sourceYaml__sceneStockTrading:Tt,sourceYaml__sceneSupportFlow:Rt,sourceYaml__sceneTaskFlow:ta,sourceYaml__sceneTokenBridge:Ht,sourceYaml__sceneTokenDeploy:da,sourceYaml__sceneTrustAsset:na,sourceYaml__sceneVersionDeploy:fa,sourceYaml__sceneWebInfra:Ot,stackPair:j,stackTriple:J},Symbol.toStringTag,{value:"Module"})),Aa=440;function r(e,n){const{kind:s,eyebrow:b,title:u,subtitle:d,metric:c,nodeW:g}=n;return t(e,{topic:`kind: ${s}`}).lane("l",{x:0,width:Aa}).state("v",{initial:c.from}).node("n",{lane:"l",stack:0,kind:s,title:u,eyebrow:b,subtitle:d,value:c.value,...g?{w:g}:{}}).phase("p",{duration:1500,title:s,body:`${s} kind の見た目。`},f=>f.activate("n").badge("active")).phase("p2",{duration:1500,title:`${s} が動く`,body:"箱の値が段の中で動く。"},f=>f.activate("n").tween("v",c.from,c.to).badge("running")).build()}const Pa=r("k-person",{kind:"person",eyebrow:"個人",title:"User",subtitle:"外部の 1 ユーザー",metric:{value:"{v} 操作",from:3,to:18}}),Ba=r("k-user-group",{kind:"user-group",eyebrow:"複数ユーザー",title:"Users",subtitle:"team / コミュニティ",metric:{value:"{v} 人",from:4,to:32}}),_a=r("k-admin",{kind:"admin",eyebrow:"管理者",title:"Admin",subtitle:"権限保有者",metric:{value:"承認 {v}",from:0,to:7}}),Da=r("k-developer",{kind:"developer",eyebrow:"開発者",title:"Developer",subtitle:"コード書く人",metric:{value:"{v} commit",from:1,to:12}}),Ta=r("k-external-user",{kind:"external-user",eyebrow:"外部ユーザー",title:"External",subtitle:"別 system から来訪",metric:{value:"{v} 人/分",from:2,to:40}}),Ia=r("k-database",{kind:"database",eyebrow:"DB",title:"PostgreSQL",subtitle:"primary database",metric:{value:"{v} 行/s",from:120,to:980}}),Ra=r("k-cache",{kind:"cache",eyebrow:"キャッシュ",title:"Redis",subtitle:"in-memory store",metric:{value:"命中 {v}%",from:62,to:97}}),Ea=r("k-queue",{kind:"queue",eyebrow:"キュー",title:"Job Queue",subtitle:"Bull / SQS",metric:{value:"待ち {v}",from:8,to:120}}),Ma=r("k-message-bus",{kind:"message-bus",eyebrow:"メッセージバス",title:"Kafka",subtitle:"topic / partition",metric:{value:"{v} 件/s",from:40,to:620}}),La=r("k-cloud",{kind:"cloud",eyebrow:"クラウド",title:"AWS",subtitle:"cloud service",metric:{value:"{v} 台",from:2,to:16}}),Oa=r("k-cdn",{kind:"cdn",eyebrow:"CDN",title:"Cloudflare",subtitle:"edge network",metric:{value:"{v} GB/h",from:5,to:88}}),Fa=r("k-service",{kind:"service",eyebrow:"サービス",title:"AuthService",subtitle:"business logic",metric:{value:"{v} 件/s",from:30,to:450}}),Ha=r("k-api",{kind:"api",eyebrow:"API",title:"POST /users",subtitle:"REST endpoint",metric:{value:"{v} ms",from:240,to:45}}),Wa=r("k-frontend",{kind:"frontend",eyebrow:"フロント",title:"Next.js App",subtitle:"browser UI",metric:{value:"描画 {v} ms",from:180,to:60}}),qa=r("k-backend",{kind:"backend",eyebrow:"バックエンド",title:"Express",subtitle:"server runtime",metric:{value:"CPU {v}%",from:12,to:74}}),Ga=r("k-webhook",{kind:"webhook",eyebrow:"Webhook",title:"POST callback",subtitle:"incoming event",nodeW:338,metric:{value:"受信 {v}",from:0,to:26}}),Va=r("k-microservice",{kind:"microservice",eyebrow:"マイクロサービス",title:"Order Service",subtitle:"1 機能 1 サービス",nodeW:338,metric:{value:"{v} 件/分",from:15,to:210}}),Ua=r("k-signer",{kind:"signer",eyebrow:"署名者",title:"Signer",subtitle:"HMAC / 公開鍵署名",metric:{value:"署名 {v}",from:1,to:34}}),Qa=r("k-oracle",{kind:"oracle",eyebrow:"Oracle",title:"Feature flag service",subtitle:"外部設定の取込",nodeW:492,metric:{value:"取込 {v}",from:3,to:48}}),ja=r("k-merkle-tree",{kind:"merkle-tree",eyebrow:"Merkle Tree",title:"Hash tree",subtitle:"ハッシュ二分木",metric:{value:"葉 {v}",from:4,to:64}}),Ja=r("k-decision",{kind:"decision",eyebrow:"判定分岐",title:"if/else",subtitle:"条件分岐",metric:{value:"真 {v}%",from:20,to:85}}),Ya=Object.freeze(Object.defineProperty({__proto__:null,kAdmin:_a,kApi:Ha,kBackend:qa,kCache:Ra,kCdn:Oa,kCloud:La,kDatabase:Ia,kDecision:Ja,kDeveloper:Da,kExternalUser:Ta,kFrontend:Wa,kMerkleTree:ja,kMessageBus:Ma,kMicroservice:Va,kOracle:Qa,kPerson:Pa,kQueue:Ea,kService:Fa,kSigner:Ua,kUserGroup:Ba,kWebhook:Ga},Symbol.toStringTag,{value:"Module"})),w=0,m=520,v=1140,p=280,y=380,S=0,N=600,C=280,za=t("pattern-direct",{topic:"pattern: Direct (隣接 node 直結)"}).lane("l1",{x:S,width:C}).lane("l2",{x:N,width:C}).node("a",{lane:"l1",stack:0,kind:"actor",title:"Client"}).node("b",{lane:"l2",stack:0,kind:"function",title:"Service"}).edge("a","b",{id:"e",label:"request",sub:"node 端 stop",tone:"accent",style:"dotted-flow"}).phase("p1",{duration:1200,title:"送り手",body:""},e=>e.activate("a").badge("direct")).phase("p2",{duration:1200,title:"受け手まで",body:""},e=>e.activate("a","b").badge("direct")).phase("p3",{duration:2400,title:"直結",body:"粒子が Client 端 → Service 端で stop、 node 内には入らない。"},e=>e.activate("a","b","e").badge("direct")).build(),$a=t("pattern-passthrough",{topic:"pattern: Passthrough (中継 node 貫通)"}).lane("l1",{x:w,width:p}).lane("l2",{x:m,width:y,contain:!0}).lane("l3",{x:v,width:p}).node("a",{lane:"l1",stack:0,kind:"actor",title:"Client"}).node("router",{lane:"l2",stack:0,kind:"function",title:"API Gateway",subtitle:"Client → Service を relay (proxy pattern)"}).node("c",{lane:"l3",stack:0,kind:"function",title:"Service"}).edge("a","c",{id:"e",label:"Client → Service",sub:"Gateway 経由",tone:"accent",style:"dotted-flow"}).phase("p1",{duration:1200,title:"送り手",body:""},e=>e.activate("a").badge("through")).phase("p2",{duration:1200,title:"中継まで",body:""},e=>e.activate("a","router").badge("through")).phase("p3",{duration:2800,title:"貫通",body:"edge path が Gateway の上を通るため、 cdl が auto 判定で粒子を Gateway 中央まで動かす。"},e=>e.activate("a","router","c","e").badge("through")).build(),Ka=t("pattern-call-rw",{topic:"pattern: Call → Read → Write"}).lane("client",{x:S,width:C}).lane("service",{x:N,width:480,contain:!0}).state("count",{initial:100}).node("user",{lane:"client",stack:0,kind:"actor",title:"User",value:"{count}"}).node("fn",{lane:"service",stack:0,kind:"function",title:"decrement(...)"}).node("storage",{lane:"service",stack:1,kind:"storage",title:"counter table",rows:["User: {count}"]}).edge("user","fn",{id:"call",label:"call",tone:"accent",style:"dotted-flow"}).edge("fn","storage",{id:"read",label:"read",tone:"teal",style:"dotted-flow"}).edge("fn","storage",{id:"write",label:"write",tone:"accent",style:"dotted-flow"}).phase("call",{duration:1800,title:"call",body:"外部から関数呼び出し。"},e=>e.activate("user","fn","call").badge("call")).phase("read",{duration:1800,title:"read",body:"storage から現在値を読む。"},e=>e.activate("fn","storage","read").badge("read")).phase("write",{duration:1800,title:"write",body:"storage を更新。"},e=>e.activate("fn","storage","write").tween("count",100,90).badge("write")).build(),Xa=t("pattern-emit",{topic:"pattern: Emit Event (外部通知)"}).lane("c",{x:S,width:C}).lane("o",{x:N,width:C}).node("fn",{lane:"c",stack:0,kind:"function",title:"processOrder(...)",w:426}).node("ev",{lane:"o",stack:0,kind:"event",title:"OrderCreated",subtitle:"(orderId, userId, total)"}).edge("fn","ev",{id:"emit",label:"emit",tone:"success",style:"dotted-flow"}).phase("p1",{duration:1200,title:"関数",body:""},e=>e.activate("fn").badge("emit")).phase("p2",{duration:1200,title:"受け皿まで",body:""},e=>e.activate("fn","ev").badge("emit")).phase("p3",{duration:2400,title:"emit",body:"関数内で emit したイベントが event bus / log に書き込まれる。"},e=>e.activate("fn","ev","emit").badge("emit")).build(),Za=t("pattern-hook",{topic:"pattern: Hook callback"}).lane("col1",{x:0,width:430}).lane("col2",{x:470,width:430}).node("from",{lane:"col1",stack:0,kind:"actor",title:"Sender"}).node("fn",{lane:"col2",stack:0,kind:"function",title:"deliver",subtitle:"送付前 hook"}).node("hook",{lane:"col1",stack:1,kind:"function",title:"onReceive",subtitle:"受信側で実装"}).edge("from","fn",{id:"call",label:"call",tone:"accent",style:"dotted-flow"}).edge("fn","hook",{id:"hook",label:"hook callback",sub:"受信可否確認",tone:"teal",style:"dotted-flow"}).phase("call",{duration:1800,title:"call",body:"送信側が deliver を呼ぶ。"},e=>e.activate("from","fn","call").badge("call")).phase("hook",{duration:1800,title:"hook callback",body:"Service が受信側の onReceive hook を呼んで「受け取れますか」 と確認。"},e=>e.activate("fn","hook","hook").badge("hook")).build(),ei=t("pattern-branch",{topic:"pattern: Branch (条件分岐)"}).lane("u",{x:w,width:p}).lane("d",{x:m,width:y,contain:!0}).lane("r",{x:v,width:p}).node("input",{lane:"u",stack:0,kind:"actor",title:"Input"}).node("check",{lane:"d",stack:0,kind:"function",title:"if (valid?)",subtitle:"分岐 node"}).node("ok",{lane:"r",stack:0,kind:"function",title:"process()"}).node("ng",{lane:"r",stack:1,kind:"event",title:"ValidationError",w:382}).edge("input","check",{id:"e1",label:"evaluate",tone:"accent",style:"dotted-flow"}).edge("check","ok",{id:"e2",label:"true",tone:"success",style:"dotted-flow"}).edge("check","ng",{id:"e3",label:"false",tone:"error",style:"dotted-flow"}).phase("eval",{duration:1800,title:"evaluate",body:"input を条件 node に渡す。"},e=>e.activate("input","check","e1").badge("evaluate")).phase("true",{duration:1800,title:"true 経路",body:"条件成立で process を呼ぶ。"},e=>e.activate("check","ok","e2").badge("true")).phase("false",{duration:1800,title:"false 経路",body:"条件不成立で error イベントを emit。"},e=>e.activate("check","ng","e3").badge("false")).build(),ti=t("pattern-loop",{topic:"pattern: Loop (繰り返し処理)"}).lane("c",{x:S,width:C}).lane("w",{x:N,width:480,contain:!0}).state("i",{initial:0}).node("client",{lane:"c",stack:0,kind:"actor",title:"Client"}).node("iter",{lane:"w",stack:0,kind:"function",title:"for i in items",subtitle:"ループ node"}).node("body",{lane:"w",stack:1,kind:"function",title:"process(item)"}).edge("client","iter",{id:"e1",label:"run",tone:"accent",style:"dotted-flow"}).edge("iter","body",{id:"e2",label:"each item",tone:"teal",style:"dotted-flow"}).phase("start",{duration:1500,title:"start",body:"Client が一括実行を呼ぶ。"},e=>e.activate("client","iter","e1").badge("start")).phase("iter1",{duration:1500,title:"iter 1",body:"1 件目を処理。"},e=>e.activate("iter","body","e2").tween("i",0,1).badge("i=1")).phase("iter2",{duration:1500,title:"iter 2",body:"2 件目を処理。"},e=>e.activate("iter","body","e2").tween("i",1,2).badge("i=2")).phase("iter3",{duration:1500,title:"iter 3",body:"3 件目を処理。"},e=>e.activate("iter","body","e2").tween("i",2,3).badge("i=3")).build(),ai=t("pattern-fan-out",{topic:"pattern: Fan-out (1 入力 → 複数 worker)"}).lane("u",{x:w,width:p}).lane("d",{x:m,width:y}).lane("w",{x:v,width:p}).node("client",{lane:"u",stack:0,kind:"actor",title:"Producer"}).node("dist",{lane:"d",stack:0,kind:"function",title:"Dispatcher",subtitle:"分配"}).node("w1",{lane:"w",stack:0,kind:"function",title:"Worker 1"}).node("w2",{lane:"w",stack:1,kind:"function",title:"Worker 2"}).node("w3",{lane:"w",stack:2,kind:"function",title:"Worker 3"}).edge("client","dist",{id:"e1",label:"submit",tone:"accent",style:"solid"}).edge("dist","w1",{id:"e2",label:"job 1",tone:"teal",style:"solid"}).edge("dist","w2",{id:"e3",label:"job 2",tone:"teal",style:"solid"}).edge("dist","w3",{id:"e4",label:"job 3",tone:"teal",style:"solid"}).phase("submit",{duration:1800,title:"submit",body:"Producer が 1 入力を Dispatcher に submit。"},e=>e.activate("client","dist").badge("submit")).phase("fanout",{duration:1800,title:"fan-out",body:"Dispatcher が 1 job を 3 worker に並列 dispatch (round-robin)、 各 worker が独立処理。"},e=>e.activate("dist","w1","w2","w3").badge("fan-out")).build(),ii=t("pattern-fan-in",{topic:"pattern: Fan-in (複数 worker → 集約)"}).lane("w",{x:w,width:p}).lane("a",{x:m,width:y,contain:!0}).lane("r",{x:v,width:p}).node("w1",{lane:"w",stack:0,kind:"function",title:"Worker 1"}).node("w2",{lane:"w",stack:1,kind:"function",title:"Worker 2"}).node("w3",{lane:"w",stack:2,kind:"function",title:"Worker 3"}).node("agg",{lane:"a",stack:0,kind:"function",title:"Aggregator",subtitle:"集約"}).node("store",{lane:"a",stack:1,kind:"storage",title:"result table"}).node("client",{lane:"r",stack:0,kind:"actor",title:"Consumer"}).edge("w1","agg",{id:"e1",label:"result 1",tone:"teal",style:"solid"}).edge("w2","agg",{id:"e2",label:"result 2",tone:"teal",style:"solid"}).edge("w3","agg",{id:"e3",label:"result 3",tone:"teal",style:"solid"}).edge("agg","store",{id:"e4",label:"write",tone:"warning",style:"solid"}).edge("store","client",{id:"e5",label:"read",tone:"accent",style:"solid"}).phase("collect",{duration:1800,title:"collect",body:"3 worker が結果を Aggregator に送る。"},e=>e.activate("w1","w2","w3","agg").badge("fan-in")).phase("write",{duration:1800,title:"write",body:"Aggregator が集約結果を store に書込。"},e=>e.activate("agg","store").badge("write")).phase("read",{duration:1800,title:"read",body:"Consumer が集約結果を取得。"},e=>e.activate("store","client").badge("read")).build(),oi=t("pattern-rollback",{topic:"pattern: Rollback (失敗時巻き戻し)"}).lane("u",{x:w,width:p}).lane("t",{x:m,width:y,contain:!0}).lane("s",{x:v,width:p}).state("balance",{initial:100}).node("client",{lane:"u",stack:0,kind:"actor",title:"Client",value:"{balance}"}).node("tx",{lane:"t",stack:0,kind:"function",title:"BEGIN tx"}).node("op",{lane:"t",stack:1,kind:"function",title:"operation()"}).node("commit",{lane:"t",stack:2,kind:"function",title:"COMMIT / ROLLBACK",w:426}).node("db",{lane:"s",stack:0,kind:"storage",title:"DB",rows:["balance: {balance}"]}).edge("client","tx",{id:"e1",label:"BEGIN",tone:"accent",style:"dotted-flow"}).edge("tx","op",{id:"e2",label:"execute",tone:"teal",style:"dotted-flow"}).edge("op","db",{id:"e3",label:"write",tone:"warning",style:"dotted-flow"}).edge("op","commit",{id:"e4",label:"on error",tone:"error",style:"dotted-flow"}).edge("commit","db",{id:"e5",label:"ROLLBACK",tone:"error",style:"dotted-flow"}).phase("begin",{duration:1500,title:"BEGIN",body:"tx 開始。"},e=>e.activate("client","tx","e1").badge("BEGIN")).phase("write",{duration:1500,title:"tentative write",body:"operation 内で DB を仮更新。"},e=>e.activate("tx","op","db","e2","e3").tween("balance",100,80).badge("write")).phase("rollback",{duration:1500,title:"ROLLBACK",body:"失敗検知で元の値に巻き戻し。"},e=>e.activate("op","commit","db","e4","e5").tween("balance",80,100).badge("ROLLBACK")).build(),ni=t("pattern-schedule",{topic:"pattern: Schedule (定期実行)"}).lane("s",{x:w,width:p}).lane("j",{x:m,width:y,contain:!0}).lane("t",{x:v,width:p}).node("cron",{lane:"s",stack:0,kind:"actor",title:"Cron",subtitle:"*/5 * * * *"}).node("scheduler",{lane:"j",stack:0,kind:"function",title:"Scheduler",subtitle:"起動判定"}).node("job",{lane:"j",stack:1,kind:"function",title:"Job.run()"}).node("target",{lane:"t",stack:0,kind:"function",title:"Target service"}).edge("cron","scheduler",{id:"e1",label:"tick",tone:"info",style:"dotted-flow"}).edge("scheduler","job",{id:"e2",label:"trigger",tone:"accent",style:"dotted-flow"}).edge("job","target",{id:"e3",label:"invoke",tone:"teal",style:"dotted-flow"}).phase("tick",{duration:1800,title:"tick",body:"Cron が 5 分ごとに tick。"},e=>e.activate("cron","scheduler","e1").badge("tick")).phase("trigger",{duration:1800,title:"trigger",body:"Scheduler が Job を起動。"},e=>e.activate("scheduler","job","e2").badge("trigger")).phase("invoke",{duration:1800,title:"invoke",body:"Job が Target を呼ぶ。"},e=>e.activate("job","target","e3").badge("invoke")).build(),li=t("pattern-validate-process",{topic:"pattern: Validate → Process (検証後処理)"}).lane("u",{x:w,width:p}).lane("v",{x:m,width:y,contain:!0}).lane("p",{x:v,width:p}).node("client",{lane:"u",stack:0,kind:"actor",title:"Client"}).node("validate",{lane:"v",stack:0,kind:"function",title:"validate(input)"}).node("schema",{lane:"v",stack:1,kind:"storage",title:"schema",rows:["lib: zod / yup"]}).node("process",{lane:"p",stack:0,kind:"function",title:"process()"}).node("err",{lane:"p",stack:1,kind:"event",title:"ValidationError",w:382}).edge("client","validate",{id:"e1",label:"submit",tone:"accent",style:"dotted-flow"}).edge("validate","schema",{id:"e2",label:"check",tone:"teal",style:"dotted-flow"}).edge("validate","process",{id:"e3",label:"ok",tone:"success",style:"dotted-flow"}).edge("validate","err",{id:"e4",label:"ng",tone:"error",style:"dotted-flow"}).phase("submit",{duration:1500,title:"submit",body:"Client が input を送る。"},e=>e.activate("client","validate","e1").badge("submit")).phase("check",{duration:1500,title:"check",body:"schema で検証。"},e=>e.activate("validate","schema","e2").badge("check")).phase("ok",{duration:1500,title:"ok",body:"検証成功で process。"},e=>e.activate("validate","process","e3").badge("ok")).phase("ng",{duration:1500,title:"ng",body:"失敗時は ValidationError emit。"},e=>e.activate("validate","err","e4").badge("ng")).build(),si=Object.freeze(Object.defineProperty({__proto__:null,patternBranch:ei,patternCallReadWrite:Ka,patternDirect:za,patternEmit:Xa,patternFanIn:ii,patternFanOut:ai,patternHook:Za,patternLoop:ti,patternPassthrough:$a,patternRollback:oi,patternSchedule:ni,patternValidateProcess:li},Symbol.toStringTag,{value:"Module"})),ri=t("tween-simple",{topic:"tween: 数値線形補間"}).lane("l",{x:0,width:400}).state("counter",{initial:0}).node("a",{lane:"l",stack:0,kind:"actor",title:"Counter",value:"{counter}"}).phase("p",{duration:2500,title:"Counter を滑らかに進行 (0 → 100)",body:"phase 内で counter を 0 から 100 へ滑らかに変化。"},e=>e.activate("a").tween("counter",0,100).badge("tween 中")).build(),di=t("tween-chain",{topic:"tween: 連続 phase で累積"}).lane("l",{x:0,width:400}).state("n",{initial:0}).node("a",{lane:"l",stack:0,kind:"actor",title:"Sum",value:"{n}"}).phase("p1",{duration:2e3,title:"初動 (0 → 10)",body:"1 phase 目の tween。"},e=>e.activate("a").tween("n",0,10).badge("p1")).phase("p2",{duration:2e3,title:"加速 (10 → 50)",body:"前 phase の終端値から続けて tween。"},e=>e.activate("a").tween("n",10,50).badge("p2")).phase("p3",{duration:2e3,title:"完了 (50 → 100)",body:"最終 phase で 100 まで。 hold で静止表示。"},e=>e.activate("a").tween("n",50,100).badge("p3")).build(),ci=t("set-switch",{topic:"set: 即時切替 (lerp なし)"}).lane("l",{x:0,width:500}).state("status",{initial:"idle"}).node("a",{lane:"l",stack:0,kind:"function",title:"Process",subtitle:"status: {status}"}).phase("p1",{duration:2e3,title:"idle → running",body:"set で文字列 state を即時切替。 phase 開始の瞬間に値が変わる。"},e=>e.activate("a").set("status","running").badge("running")).phase("p2",{duration:2e3,title:"running → done",body:"次 phase で done に切替。 tween と違い段階的でなく瞬間遷移。"},e=>e.activate("a").set("status","done").badge("done")).build(),ui=t("badge-per-phase",{topic:"badge: phase ごと切替"}).lane("l",{x:0,width:400}).node("a",{lane:"l",stack:0,kind:"actor",title:"Step"}).phase("p1",{duration:1500,title:"準備中",body:"header に badge='preparing' を表示。"},e=>e.activate("a").badge("preparing")).phase("p2",{duration:1500,title:"処理中",body:"header の badge を 'processing' に切替。"},e=>e.activate("a").badge("processing")).phase("p3",{duration:1500,title:"完了",body:"最終 phase で badge='completed'、 step 完了示唆。"},e=>e.activate("a").badge("completed")).build(),pi=t("mixed-tween-set",{topic:"tween + set 併用"}).lane("l",{x:0,width:500}).state("amount",{initial:0}).state("phase",{initial:"init"}).node("a",{lane:"l",stack:0,kind:"function",title:"Operation",subtitle:"phase: {phase}",value:"{amount}"}).phase("p1",{duration:2400,title:"読込開始 (状態 + 進捗を併走)",body:"tween で数値、 set で文字列を同時更新。 1 phase 内で複数 state を制御可能。"},e=>e.activate("a").tween("amount",0,50).set("phase","loading").badge("loading")).phase("p2",{duration:2400,title:"完了 (状態 + 進捗を仕上げ)",body:"次 phase で完了状態へ。"},e=>e.activate("a").tween("amount",50,100).set("phase","done").badge("done")).build(),bi=t("animation-rich-pipeline-demo",{topic:"5段階CSVパイプラインのリッチ進捗デモ"}).lane("col1",{x:0,width:190}).lane("col2",{x:230,width:190}).lane("col3",{x:460,width:190}).state("s1",{initial:0}).state("s2",{initial:0}).state("s3",{initial:0}).state("s4",{initial:0}).state("s5",{initial:0}).state("total",{initial:0}).state("processed",{initial:0}).node("r1",{lane:"col1",stack:0,kind:"dyn-wave",title:"検証",subtitle:"{s1}%",w:140,h:200,shape:{kind:"wave",level:"{s1}",amplitude:100,frequency:2,waveHeight:6,fill:"#4e9dc4"}}).node("r2",{lane:"col1",stack:1,kind:"dyn-wave",title:"変換",subtitle:"{s2}%",w:140,h:200,shape:{kind:"wave",level:"{s2}",amplitude:100,frequency:2,waveHeight:6,fill:"#4e9dc4"}}).node("r3",{lane:"col2",stack:0,kind:"dyn-wave",title:"加工",subtitle:"{s3}%",w:140,h:200,shape:{kind:"wave",level:"{s3}",amplitude:100,frequency:2,waveHeight:6,fill:"#4e9dc4"}}).node("r4",{lane:"col2",stack:1,kind:"dyn-wave",title:"重複排除",subtitle:"{s4}%",w:140,h:200,shape:{kind:"wave",level:"{s4}",amplitude:100,frequency:2,waveHeight:6,fill:"#4e9dc4"}}).node("r5",{lane:"col3",stack:0,kind:"dyn-wave",title:"保存",subtitle:"{s5}%",w:140,h:200,shape:{kind:"wave",level:"{s5}",amplitude:100,frequency:2,waveHeight:6,fill:"#22c55e"}}).edge("r1","r2",{id:"e12",label:"変換",tone:"info"}).edge("r2","r3",{id:"e23",label:"加工",tone:"info"}).edge("r3","r4",{id:"e34",label:"排除",tone:"info"}).edge("r4","r5",{id:"e45",label:"確定",tone:"success"}).readout.percentRing("ring",{source:"total",max:500,label:"全体進捗"}).readout.countup("cu",{source:"processed",unit:" 行",label:"処理済",decimals:0}).phase("p1",{duration:1500,title:"検証中",body:""},e=>e.activate("r1").tween("s1",0,100).tween("total",0,100).tween("processed",0,100).badge("検証")).phase("p2",{duration:1500,title:"変換中",body:""},e=>e.activate("r1","r2","e12").tween("s2",0,100).tween("total",100,200).tween("processed",100,200).badge("変換")).phase("p3",{duration:1500,title:"加工中",body:""},e=>e.activate("r1","r2","r3","e12","e23").tween("s3",0,100).tween("total",200,300).tween("processed",200,300).badge("加工")).phase("p4",{duration:1500,title:"排除中",body:""},e=>e.activate("r1","r2","r3","r4","e12","e23","e34").tween("s4",0,100).tween("total",300,400).tween("processed",300,400).badge("排除")).phase("p5",{duration:1500,title:"保存完遂",body:""},e=>e.activate("r1","r2","r3","r4","r5","e12","e23","e34","e45").tween("s5",0,100).tween("total",400,500).tween("processed",400,500).badge("保存")).build(),hi=t("animation-rich-server-load-dashboard",{topic:"4台サーバーCPU負荷ダッシュボード (朝ピーク→昼安定→夜スケールダウン→深夜アイドル)"}).lane("l1",{x:0,width:200}).lane("l2",{x:260,width:200}).lane("l3",{x:520,width:200}).lane("l4",{x:780,width:200}).state("cpu1",{initial:0}).state("cpu2",{initial:0}).state("cpu3",{initial:0}).state("cpu4",{initial:0}).state("avgLoad",{initial:0}).state("uptimeHour",{initial:0}).node("srv1",{lane:"l1",stack:0,kind:"dyn-arc",title:"srv-1",subtitle:"{cpu1}%",w:180,h:180,shape:{kind:"arc",angle:"{cpu1}",sweepMax:100,outerRadius:70,innerRadius:52,fill:"#4e9dc4"}}).node("srv2",{lane:"l2",stack:0,kind:"dyn-arc",title:"srv-2",subtitle:"{cpu2}%",w:180,h:180,shape:{kind:"arc",angle:"{cpu2}",sweepMax:100,outerRadius:70,innerRadius:52,fill:"#4e9dc4"}}).node("srv3",{lane:"l3",stack:0,kind:"dyn-arc",title:"srv-3",subtitle:"{cpu3}%",w:180,h:180,shape:{kind:"arc",angle:"{cpu3}",sweepMax:100,outerRadius:70,innerRadius:52,fill:"#f97316"}}).node("srv4",{lane:"l4",stack:0,kind:"dyn-arc",title:"srv-4",subtitle:"{cpu4}%",w:180,h:180,shape:{kind:"arc",angle:"{cpu4}",sweepMax:100,outerRadius:70,innerRadius:52,fill:"#22c55e"}}).readout.gauge("avgG",{source:"avgLoad",min:0,max:100,color:"#f97316",label:"平均負荷 %"}).readout.countup("uptimeCU",{source:"uptimeHour",unit:" 時",label:"稼働時間",decimals:0}).phase("p1",{duration:2e3,title:"朝ピーク (7:00)",body:""},e=>e.activate("srv1","srv2","srv3","srv4").tween("cpu1",0,85).tween("cpu2",0,88).tween("cpu3",0,92).tween("cpu4",0,78).tween("avgLoad",0,86).tween("uptimeHour",0,7).badge("朝ピーク")).phase("p2",{duration:2e3,title:"昼安定 (12:00)",body:""},e=>e.activate("srv1","srv2","srv3","srv4").tween("cpu1",85,55).tween("cpu2",88,58).tween("cpu3",92,62).tween("cpu4",78,48).tween("avgLoad",86,55).tween("uptimeHour",7,12).badge("昼安定")).phase("p3",{duration:2e3,title:"夜スケールダウン (20:00)",body:""},e=>e.activate("srv1","srv2","srv3","srv4").tween("cpu1",55,30).tween("cpu2",58,32).tween("cpu3",62,35).tween("cpu4",48,22).tween("avgLoad",55,30).tween("uptimeHour",12,20).badge("スケールダウン")).phase("p4",{duration:2e3,title:"深夜アイドル (2:00)",body:""},e=>e.activate("srv1","srv2","srv3","srv4").tween("cpu1",30,8).tween("cpu2",32,10).tween("cpu3",35,12).tween("cpu4",22,5).tween("avgLoad",30,9).tween("uptimeHour",20,26).badge("アイドル")).build(),gi=t("animation-rich-order-status-flow",{topic:"EC注文状態遷移 (受注→決済→発送→配達→完了)"}).lane("col1",{x:0,width:170}).lane("col2",{x:210,width:170}).state("f1",{initial:0}).state("f2",{initial:0}).state("f3",{initial:0}).state("f4",{initial:0}).state("f5",{initial:0}).state("progress",{initial:0}).state("elapsedHour",{initial:0}).node("st1",{lane:"col1",stack:0,kind:"dyn-rect",title:"受注",subtitle:"{f1}%",w:120,h:200,shape:{kind:"rect",source:"{f1}",fillMax:100,orient:"up",fill:"#4e9dc4"}}).node("st2",{lane:"col2",stack:0,kind:"dyn-rect",title:"決済",subtitle:"{f2}%",w:120,h:200,shape:{kind:"rect",source:"{f2}",fillMax:100,orient:"up",fill:"#4e9dc4"}}).node("st3",{lane:"col1",stack:1,kind:"dyn-rect",title:"発送",subtitle:"{f3}%",w:120,h:200,shape:{kind:"rect",source:"{f3}",fillMax:100,orient:"up",fill:"#4e9dc4"}}).node("st4",{lane:"col2",stack:1,kind:"dyn-rect",title:"配達",subtitle:"{f4}%",w:120,h:200,shape:{kind:"rect",source:"{f4}",fillMax:100,orient:"up",fill:"#f97316"}}).node("st5",{lane:"col1",stack:2,kind:"dyn-rect",title:"完了",subtitle:"{f5}%",w:120,h:200,shape:{kind:"rect",source:"{f5}",fillMax:100,orient:"up",fill:"#22c55e"}}).edge("st1","st2",{id:"e12",label:"決済へ",tone:"info"}).edge("st2","st3",{id:"e23",label:"発送へ",tone:"info"}).edge("st3","st4",{id:"e34",label:"配達へ",tone:"info"}).edge("st4","st5",{id:"e45",label:"完了",tone:"success"}).readout.percentRing("progRing",{source:"progress",max:100,label:"進捗"}).readout.countup("elapsedCU",{source:"elapsedHour",unit:" 時",label:"経過",decimals:0}).phase("p1",{duration:1500,title:"受注中",body:""},e=>e.activate("st1").tween("f1",0,100).tween("progress",0,20).tween("elapsedHour",0,1).badge("受注")).phase("p2",{duration:1500,title:"決済中",body:""},e=>e.activate("st1","st2","e12").tween("f2",0,100).tween("progress",20,40).tween("elapsedHour",1,2).badge("決済")).phase("p3",{duration:1500,title:"発送中",body:""},e=>e.activate("st1","st2","st3","e12","e23").tween("f3",0,100).tween("progress",40,60).tween("elapsedHour",2,8).badge("発送")).phase("p4",{duration:1500,title:"配達中",body:""},e=>e.activate("st1","st2","st3","st4","e12","e23","e34").tween("f4",0,100).tween("progress",60,85).tween("elapsedHour",8,24).badge("配達")).phase("p5",{duration:1500,title:"完了",body:""},e=>e.activate("st1","st2","st3","st4","st5","e12","e23","e34","e45").tween("f5",0,100).tween("progress",85,100).tween("elapsedHour",24,28).badge("完了")).build(),ki=t("animation-rich-score-leaderboard",{topic:"4プレイヤースコア推移 (4ラウンドで順位変動、 円の大きさが強さを表す)"}).lane("l1",{x:0,width:180}).lane("l2",{x:240,width:180}).lane("l3",{x:480,width:180}).lane("l4",{x:720,width:180}).state("p1",{initial:20}).state("p2",{initial:20}).state("p3",{initial:20}).state("p4",{initial:20}).state("totalKill",{initial:0}).state("avgAcc",{initial:40}).node("pl1",{lane:"l1",stack:0,kind:"dyn-circle",title:"岸田様",subtitle:"score {p1}",w:160,h:180,shape:{kind:"circle",radius:"{p1}",fill:"#4e9dc4"}}).node("pl2",{lane:"l2",stack:0,kind:"dyn-circle",title:"山田様",subtitle:"score {p2}",w:160,h:180,shape:{kind:"circle",radius:"{p2}",fill:"#f97316"}}).node("pl3",{lane:"l3",stack:0,kind:"dyn-circle",title:"佐藤様",subtitle:"score {p3}",w:160,h:180,shape:{kind:"circle",radius:"{p3}",fill:"#22c55e"}}).node("pl4",{lane:"l4",stack:0,kind:"dyn-circle",title:"森様",subtitle:"score {p4}",w:160,h:180,shape:{kind:"circle",radius:"{p4}",fill:"#8b7ffa"}}).readout.countup("killCU",{source:"totalKill",unit:" kill",label:"累計 kill",decimals:0}).readout.gauge("accG",{source:"avgAcc",min:0,max:100,color:"#22c55e",label:"平均命中率 %"}).phase("r1",{duration:2e3,title:"Round 1 (拮抗)",body:""},e=>e.activate("pl1","pl2","pl3","pl4").tween("p1",20,35).tween("p2",20,38).tween("p3",20,32).tween("p4",20,30).tween("totalKill",0,12).tween("avgAcc",40,52).badge("R1 拮抗")).phase("r2",{duration:2e3,title:"Round 2 (山田様 lead)",body:""},e=>e.activate("pl1","pl2","pl3","pl4").tween("p1",35,48).tween("p2",38,65).tween("p3",32,42).tween("p4",30,40).tween("totalKill",12,28).tween("avgAcc",52,58).badge("R2 山田様 lead")).phase("r3",{duration:2e3,title:"Round 3 (佐藤様 追い上げ)",body:""},e=>e.activate("pl1","pl2","pl3","pl4").tween("p1",48,55).tween("p2",65,68).tween("p3",42,72).tween("p4",40,45).tween("totalKill",28,48).tween("avgAcc",58,64).badge("R3 佐藤様 追上げ")).phase("r4",{duration:2e3,title:"Round 4 (佐藤様 優勝)",body:""},e=>e.activate("pl1","pl2","pl3","pl4").tween("p1",55,62).tween("p2",68,74).tween("p3",72,80).tween("p4",45,50).tween("totalKill",48,72).tween("avgAcc",64,68).badge("R4 佐藤様 優勝")).build(),wi=t("animation-rich-layered-priority-fee",{topic:"3層優先度手数料 — 混雑度で base / tip / cap が同時に動く"}).lane("bar",{x:0,width:320}).lane("stat",{x:380,width:320}).state("baseFee",{initial:10}).state("tipFee",{initial:2}).state("capFee",{initial:8}).state("effectiveGwei",{initial:12}).state("congestion",{initial:15}).node("capL",{lane:"bar",stack:0,kind:"dyn-rect",title:"max cap",subtitle:"+{capFee} gwei",w:300,h:140,shape:{kind:"rect",source:"{capFee}",fillMax:60,orient:"up",fill:"#a08870",radius:4}}).node("tipL",{lane:"bar",stack:1,kind:"dyn-rect",title:"priority tip",subtitle:"+{tipFee} gwei",w:316,h:100,shape:{kind:"rect",source:"{tipFee}",fillMax:50,orient:"up",fill:"#22c55e",radius:4}}).node("baseL",{lane:"bar",stack:2,kind:"dyn-rect",title:"base fee (burn)",subtitle:"{baseFee} gwei",w:382,h:180,shape:{kind:"rect",source:"{baseFee}",fillMax:160,orient:"up",fill:"#dc2626",radius:4}}).node("effC",{lane:"stat",stack:0,kind:"actor",title:"有効総額",subtitle:"{effectiveGwei} gwei",w:280,h:180}).node("congA",{lane:"stat",stack:1,kind:"dyn-arc",title:"混雑度",subtitle:"{congestion}%",w:280,h:220,shape:{kind:"arc",angle:"{congestion}",sweepMax:100,outerRadius:90,innerRadius:62,fill:"#f97316"}}).phase("p1",{duration:1800,title:"空 block",body:""},e=>e.activate("capL","tipL","baseL","effC","congA").tween("baseFee",10,15).tween("tipFee",2,3).tween("capFee",8,12).tween("effectiveGwei",12,18).tween("congestion",15,28).badge("空 block")).phase("p2",{duration:1800,title:"平常",body:""},e=>e.activate("capL","tipL","baseL","effC","congA").tween("baseFee",15,45).tween("tipFee",3,6).tween("capFee",12,20).tween("effectiveGwei",18,51).tween("congestion",28,58).badge("平常")).phase("p3",{duration:1800,title:"混雑",body:""},e=>e.activate("capL","tipL","baseL","effC","congA").tween("baseFee",45,95).tween("tipFee",6,18).tween("capFee",20,35).tween("effectiveGwei",51,113).tween("congestion",58,88).badge("混雑")).phase("p4",{duration:1800,title:"極混雑",body:""},e=>e.activate("capL","tipL","baseL","effC","congA").tween("baseFee",95,140).tween("tipFee",18,42).tween("capFee",35,55).tween("effectiveGwei",113,182).tween("congestion",88,96).badge("極混雑")).build(),mi=Object.freeze(Object.defineProperty({__proto__:null,badgePerPhase:ui,mixedTweenSet:pi,richLayeredPriorityFee:wi,richOrderStatusFlow:gi,richPipelineDemo:bi,richScoreLeaderboard:ki,richServerLoadDashboard:hi,setSwitch:ci,tweenChain:di,tweenSimple:ri},Symbol.toStringTag,{value:"Module"}));function k(e,n,s,b,u,d){return t(e,{topic:u}).lane("l1",{x:0,width:280}).lane("l2",{x:600,width:280}).node("a",{lane:"l1",stack:0,kind:"actor",title:"From"}).node("b",{lane:"l2",stack:0,kind:"actor",title:"To"}).edge("a","b",{id:"e",label:b,sub:d,tone:s,style:n}).phase("p",{duration:1800,title:`${n} / ${s}`,body:"edge style と tone の組み合わせを確認。"},c=>c.activate("a","b","e").badge(s)).build()}const vi=k("style-solid","solid","accent","solid","solid style (実線 + 矢頭、 edge の default)","実線 + 矢頭"),yi=k("style-dotted-flow","dotted-flow","accent","dotted-flow","dotted-flow style (点線 + 粒子、 動的 flow 表現)","点線 + 粒子"),fi=k("tone-accent","solid","accent","accent","accent tone (主張色、 dark navy)"),Ci=k("tone-teal","solid","teal","teal","teal tone (青緑、 secondary emphasis)"),xi=k("tone-success","solid","success","success","success tone (green、 成功状態)"),Si=k("tone-error","solid","error","error","error tone (red、 エラー状態)"),Ni=k("tone-warning","solid","warning","warning","warning tone (orange、 警告状態)"),Ai=k("tone-info","solid","info","info","info tone (light blue、 情報表示)"),Pi=t("state-active",{topic:"edge: active 状態"}).lane("l1",{x:0,width:280}).lane("l2",{x:600,width:280}).node("a",{lane:"l1",stack:0,kind:"actor",title:"A"}).node("b",{lane:"l2",stack:0,kind:"function",title:"B"}).edge("a","b",{id:"e",label:"active",tone:"accent",style:"solid"}).phase("p",{duration:1800,title:"active 状態",body:"phase で activate された edge は太く + 色付きで visible。"},e=>e.activate("a","b","e").badge("active")).build(),Bi=t("state-inactive",{topic:"edge: inactive 状態"}).lane("l1",{x:0,width:280}).lane("l2",{x:600,width:280}).node("a",{lane:"l1",stack:0,kind:"actor",title:"A"}).node("b",{lane:"l2",stack:0,kind:"function",title:"B"}).edge("a","b",{id:"e",label:"inactive",tone:"accent",style:"solid"}).phase("p",{duration:1800,title:"inactive 状態",body:"activate されていない edge は薄い灰色 + dash で静的表示。"},e=>e.activate("a","b").badge("edge は inactive")).build(),_i=Object.freeze(Object.defineProperty({__proto__:null,stateActive:Pi,stateInactive:Bi,styleDottedFlow:yi,styleSolid:vi,toneAccent:fi,toneError:Si,toneInfo:Ai,toneSuccess:xi,toneTeal:Ci,toneWarning:Ni},Symbol.toStringTag,{value:"Module"}));function l(e,n){return{...n,id:e}}const Di=l("api-call",i(`
title: "REST API GET (Handler → DB SELECT → 200 JSON)"
type: sequence

actors:
  - Client
  - Handler: function
  - DB

flow:
  - Client -> Handler: "GET /users/:id"
  - Handler -> DB: "SELECT"
  - DB -> Handler: "row"
  - Handler -> Client: "200 JSON"

animation:
  - step: "request" 1.2s
    focus: [Client, Handler]
    badge: "GET"
  - step: "query" 1.2s
    focus: [Handler, DB]
    badge: "SELECT"
  - step: "respond" 1.2s
    focus: [DB, Handler, Client]
    badge: "200"
`)),Ti=l("jwt-auth",i(`
title: "JWT auth (login → JWT issue → Bearer で API アクセス)"
type: sequence

actors:
  - User
  - Login
  - API
  - DB

flow:
  - User -> Login: "POST credentials"
  - Login -> DB: "verify"
  - Login -> User: "issue JWT"
  - User -> API: "Bearer token"
  - API -> User: "200 data"

animation:
  - step: "credentials-verify" 1.5s
    focus: [User, Login, DB]
    badge: "verify"
  - step: "issue-token" 1.0s
    focus: [Login, User]
    badge: "JWT"
  - step: "bearer-access" 1.5s
    focus: [User, API]
    badge: "200"
`)),Ii=l("oauth-flow",i(`
title: "OAuth code flow"
type: sequence

actors:
  - User
  - App
  - AuthServer: function
  - API

flow:
  - User -> App: "click login"
  - App -> AuthServer: "redirect"
  - AuthServer -> User: "consent"
  - User -> AuthServer: "allow"
  - AuthServer -> App: "code"
  - App -> AuthServer: "exchange code"
  - AuthServer -> App: "access_token"
  - App -> API: "Bearer access_token"

animation:
  - step: "redirect" 1.2s
    focus: [User, App, AuthServer]
    badge: "redirect"
  - step: "consent" 1.5s
    focus: [AuthServer, User]
    badge: "consent"
  - step: "exchange" 1.2s
    focus: [App, AuthServer]
    badge: "code"
  - step: "access" 1.0s
    focus: [App, API]
    badge: "token"
`)),Ri=l("rate-limit",i(`
title: "Rate limit"
type: sequence

actors:
  - Client
  - Limiter: function
  - API
  - Bucket: storage

states:
  remaining: 5

flow:
  - Client -> Limiter: "request"
  - Limiter -> Bucket: "decrement"
  - Limiter -> API: "ok"
  - API -> Client: "200"
  - Client -> Limiter: "6th request"
  - Limiter -> Client: "429 Retry-After"

animation:
  - step: "allow" 1.2s
    focus: [Client, Limiter, API]
    tween:
      remaining: 5 -> 4
    badge: "allow"
  - step: "exceed" 1.2s
    focus: [Client, Limiter]
    badge: "429"
`)),Ei=l("csrf-token",i(`
title: "CSRF token"
type: sequence

actors:
  - Browser
  - Server
  - Session: storage

flow:
  - Browser -> Server: "GET form"
  - Server -> Session: "store token"
  - Server -> Browser: "form + token"
  - Browser -> Server: "POST form + token"
  - Server -> Session: "verify"
  - Server -> Browser: "200"

animation:
  - step: "issue" 1.2s
    focus: [Browser, Server]
    badge: "issue"
  - step: "store" 1.2s
    focus: [Server, Session]
    badge: "store"
  - step: "submit" 1.5s
    focus: [Browser, Server, Session]
    badge: "verify"
`)),Mi=l("crud-create",i(`
title: "CRUD create"
type: sequence

actors:
  - Client
  - Handler: function
  - DB
  - Table: storage

flow:
  - Client -> Handler: "POST json body"
  - Handler -> DB: "INSERT"
  - DB -> Table: "row"
  - Handler -> Client: "201 Created"

animation:
  - step: "post" 1.2s
    focus: [Client, Handler]
    badge: "POST"
  - step: "insert" 1.2s
    focus: [Handler, DB, Table]
    badge: "INSERT"
  - step: "respond" 1.0s
    focus: [Handler, Client]
    badge: "201"
`)),Li=l("pagination",i(`
title: "Cursor pagination"
type: sequence

actors:
  - Client
  - API
  - DB

flow:
  - Client -> API: "GET items cursor=null"
  - API -> DB: "LIMIT 20"
  - DB -> API: "20 rows + next_cursor"
  - API -> Client: "page 1 + cursor"
  - Client -> API: "GET items cursor=X"
  - API -> Client: "page 2"

animation:
  - step: "page1" 1.5s
    focus: [Client, API, DB]
    badge: "page 1"
  - step: "page2" 1.2s
    focus: [Client, API]
    badge: "page 2"
`)),Oi=l("cache-read",i(`
title: "Cache read-through"
type: sequence

actors:
  - Client
  - API
  - Cache: storage
  - DB

flow:
  - Client -> API: "GET key"
  - API -> Cache: "lookup"
  - Cache -> API: "miss"
  - API -> DB: "SELECT"
  - DB -> API: "row"
  - API -> Cache: "set TTL=60s"
  - API -> Client: "200"

animation:
  - step: "miss" 1.5s
    focus: [Client, API, Cache, DB]
    badge: "miss"
  - step: "fill" 1.2s
    focus: [API, Cache]
    badge: "set"
  - step: "respond" 1.0s
    focus: [API, Client]
    badge: "200"
`)),Fi=l("search-query",i(`
title: "Search full-text"
type: sequence

actors:
  - Client
  - API
  - Index: storage

flow:
  - Client -> API: "GET search q=foo"
  - API -> Index: "tokenize + score"
  - Index -> API: "ranked hits"
  - API -> Client: "results"

animation:
  - step: "query" 1.2s
    focus: [Client, API]
    badge: "q=foo"
  - step: "score" 1.5s
    focus: [API, Index]
    badge: "rank"
  - step: "respond" 1.0s
    focus: [API, Client]
    badge: "hits"
`)),Hi=l("sort-filter",i(`
title: "Sort + Filter"
type: sequence

actors:
  - Client
  - API
  - DB

flow:
  - Client -> API: "GET status=active sort=-created"
  - API -> DB: "WHERE + ORDER BY DESC"
  - DB -> API: "filtered rows"
  - API -> Client: "200"

animation:
  - step: "request" 1.0s
    focus: [Client, API]
    badge: "filter"
  - step: "query" 1.5s
    focus: [API, DB]
    badge: "ORDER BY"
  - step: "respond" 1.0s
    focus: [API, Client]
    badge: "200"
`)),Wi=l("form-submit",i(`
title: "Form submit"
type: sequence

actors:
  - User
  - Form
  - Server

flow:
  - User -> Form: "fill fields"
  - User -> Form: "submit"
  - Form -> Server: "POST form"
  - Server -> Form: "200"
  - Form -> User: "success toast"

animation:
  - step: "fill" 1.0s
    focus: [User, Form]
    badge: "fill"
  - step: "submit" 1.2s
    focus: [Form, Server]
    badge: "POST"
  - step: "ack" 1.0s
    focus: [Form, User]
    badge: "ok"
`)),qi=l("file-upload",i(`
title: "File upload"
type: sequence

actors:
  - Browser
  - API
  - ObjectStorage: storage

flow:
  - Browser -> API: "POST multipart"
  - API -> ObjectStorage: "PUT object"
  - ObjectStorage -> API: "etag + url"
  - API -> Browser: "201 + url"

animation:
  - step: "upload" 1.5s
    focus: [Browser, API]
    badge: "multipart"
  - step: "store" 1.2s
    focus: [API, ObjectStorage]
    badge: "PUT"
  - step: "respond" 1.0s
    focus: [API, Browser]
    badge: "url"
`)),Gi=l("sse-stream",i(`
title: "SSE stream"
type: sequence

actors:
  - Browser
  - Server

flow:
  - Browser -> Server: "GET events"
  - Server -> Browser: "event 1"
  - Server -> Browser: "event 2"
  - Server -> Browser: "event 3"

animation:
  - step: "open" 1.0s
    focus: ["Browser -> Server"]
    badge: "open"
  - step: "event1" 0.8s
    focus: ["Server -> Browser"]
    badge: "event 1"
  - step: "event2" 0.8s
    focus: ["Server -> Browser", Browser]
    badge: "event 2"
  - step: "event3" 0.8s
    focus: ["Server -> Browser", Browser, Server]
    badge: "event 3"
`)),Vi=l("websocket",i(`
title: "WebSocket"
type: sequence

actors:
  - Client
  - Server

flow:
  - Client -> Server: "ws handshake"
  - Server -> Client: "101 Switching"
  - Client -> Server: "send msg"
  - Server -> Client: "broadcast"

animation:
  - step: "handshake" 1.0s
    focus: ["Client -> Server"]
    badge: "ws"
  - step: "send" 1.0s
    focus: ["Client -> Server", Client]
    badge: "msg"
  - step: "broadcast" 1.0s
    focus: ["Server -> Client", Client, Server]
    badge: "recv"
`)),Ui=l("notification",i(`
title: "Notification"
type: sequence

actors:
  - App
  - PushService: function
  - Device

flow:
  - App -> PushService: "send payload"
  - PushService -> Device: "deliver"
  - Device -> App: "tap"

animation:
  - step: "send" 1.2s
    focus: [App, PushService]
    badge: "send"
  - step: "deliver" 1.2s
    focus: [PushService, Device]
    badge: "push"
  - step: "tap" 1.0s
    focus: [Device, App]
    badge: "open"
`)),Qi=l("background-job",i(`
title: "Background job"
type: sequence

actors:
  - API
  - Queue
  - Worker

flow:
  - API -> Queue: "enqueue job"
  - Queue -> Worker: "deliver"
  - Worker -> Queue: "ack"

animation:
  - step: "enqueue" 1.2s
    focus: [API, Queue]
    badge: "enqueue"
  - step: "process" 1.5s
    focus: [Queue, Worker]
    badge: "process"
  - step: "ack" 1.0s
    focus: [Worker, Queue]
    badge: "ack"
`)),ji=l("retry-backoff",i(`
title: "Retry + backoff"
type: sequence

actors:
  - Client
  - API

flow:
  - Client -> API: "attempt 1"
  - API -> Client: "500"
  - Client -> API: "attempt 2 wait 1s"
  - API -> Client: "500"
  - Client -> API: "attempt 3 wait 2s"
  - API -> Client: "200"

animation:
  - step: "attempt1" 1.0s
    focus: ["Client -> API"]
    badge: "500"
  - step: "attempt2" 1.2s
    focus: ["Client -> API", Client]
    badge: "wait 1s"
  - step: "attempt3" 1.2s
    focus: ["API -> Client", Client, API]
    badge: "200"
`)),Ji=l("webhook",i(`
title: "Webhook"
type: sequence

actors:
  - Source
  - Dispatcher: function
  - Consumer

flow:
  - Source -> Dispatcher: "event"
  - Dispatcher -> Consumer: "POST payload + sig"
  - Consumer -> Dispatcher: "200"

animation:
  - step: "trigger" 1.2s
    focus: [Source, Dispatcher]
    badge: "event"
  - step: "deliver" 1.5s
    focus: [Dispatcher, Consumer]
    badge: "POST"
  - step: "ack" 1.0s
    focus: [Consumer, Dispatcher]
    badge: "200"
`)),Yi=l("polling",i(`
title: "Long polling"
type: sequence

actors:
  - Client
  - Server
  - DB

flow:
  - Client -> Server: "GET poll"
  - Server -> DB: "wait for update"
  - DB -> Server: "new data"
  - Server -> Client: "200 + data"

animation:
  - step: "request" 1.0s
    focus: [Client, Server]
    badge: "poll"
  - step: "wait" 1.5s
    focus: [Server, DB]
    badge: "wait"
  - step: "respond" 1.0s
    focus: [Server, Client]
    badge: "data"
`)),zi=l("scheduled-task",i(`
title: "Scheduled task"
type: sequence

actors:
  - Cron
  - Scheduler
  - Job

flow:
  - Cron -> Scheduler: "tick 5min"
  - Scheduler -> Job: "trigger"
  - Job -> Scheduler: "result"

animation:
  - step: "tick" 1.0s
    focus: [Cron, Scheduler]
    badge: "tick"
  - step: "run" 1.5s
    focus: [Scheduler, Job]
    badge: "run"
  - step: "result" 1.0s
    focus: [Job, Scheduler]
    badge: "ok"
`)),$i=l("audit-log",i(`
title: "Audit log"
type: sequence

actors:
  - Admin
  - API
  - AuditStore: storage

flow:
  - Admin -> API: "delete user"
  - API -> AuditStore: "log entry"
  - API -> Admin: "200"

animation:
  - step: "action" 1.2s
    focus: [Admin, API]
    badge: "delete"
  - step: "log" 1.2s
    focus: [API, AuditStore]
    badge: "log"
  - step: "ack" 1.0s
    focus: [API, Admin]
    badge: "200"
`)),Ki=l("email-notification",i(`
title: "Email notification"
type: sequence

actors:
  - App
  - MailQueue: storage
  - MailProvider: function
  - Inbox

flow:
  - App -> MailQueue: "enqueue mail"
  - MailQueue -> MailProvider: "send"
  - MailProvider -> Inbox: "deliver"

animation:
  - step: "enqueue" 1.0s
    focus: [App, MailQueue]
    badge: "enqueue"
  - step: "send" 1.2s
    focus: [MailQueue, MailProvider]
    badge: "send"
  - step: "deliver" 1.0s
    focus: [MailProvider, Inbox]
    badge: "deliver"
`)),Xi=l("export-data",i(`
title: "Export CSV"
type: sequence

actors:
  - Client
  - API
  - DB
  - ObjectStorage: storage

flow:
  - Client -> API: "POST export"
  - API -> DB: "stream rows"
  - DB -> API: "rows"
  - API -> ObjectStorage: "PUT csv"
  - API -> Client: "200 + url"

animation:
  - step: "request" 1.0s
    focus: [Client, API]
    badge: "export"
  - step: "stream" 1.5s
    focus: [API, DB]
    badge: "rows"
  - step: "store" 1.2s
    focus: [API, ObjectStorage]
    badge: "PUT"
  - step: "respond" 1.0s
    focus: [API, Client]
    badge: "url"
`)),Zi=l("import-data",i(`
title: "Import CSV"
type: sequence

actors:
  - User
  - API
  - Validator
  - DB

flow:
  - User -> API: "POST csv"
  - API -> Validator: "validate rows"
  - Validator -> API: "ok rows + errors"
  - API -> DB: "INSERT ok rows"
  - API -> User: "summary report"

animation:
  - step: "upload" 1.2s
    focus: [User, API]
    badge: "upload"
  - step: "validate" 1.5s
    focus: [API, Validator]
    badge: "validate"
  - step: "insert" 1.2s
    focus: [API, DB]
    badge: "INSERT"
  - step: "summary" 1.0s
    focus: [API, User]
    badge: "report"
`)),eo=l("health-check",i(`
title: "Health check"
type: sequence

actors:
  - LoadBalancer: function
  - AppInstance: function
  - StatusBoard: storage

flow:
  - LoadBalancer -> AppInstance: "GET health"
  - AppInstance -> LoadBalancer: "200 ok"
  - LoadBalancer -> StatusBoard: "mark healthy"

animation:
  - step: "probe" 1.0s
    focus: [LoadBalancer, AppInstance]
    badge: "GET"
  - step: "ack" 1.0s
    focus: [AppInstance, LoadBalancer]
    badge: "200"
  - step: "record" 1.0s
    focus: [LoadBalancer, StatusBoard]
    badge: "healthy"
`)),to=Object.freeze(Object.defineProperty({__proto__:null,apiCall:Di,auditLog:$i,backgroundJob:Qi,cacheReadThrough:Oi,crudCreate:Mi,csrfToken:Ei,emailNotification:Ki,exportData:Xi,fileUpload:qi,formSubmit:Wi,healthCheck:eo,importData:Zi,jwtAuth:Ti,notification:Ui,oauthFlow:Ii,pagination:Li,polling:Yi,rateLimit:Ri,retryBackoff:ji,scheduledTask:zi,searchQuery:Fi,sortFilter:Hi,sseStream:Gi,webhook:Ji,websocket:Vi},Symbol.toStringTag,{value:"Module"})),ao=i(`
title: "時系列のやり取りを Text DSL で書く例"
type: sequence

actors:
  - Client
  - "API": function
  - DB: storage

flow:
  - Client -> "API": "GET /items" (info)
  - "API" -> DB: "SELECT" (success)

states:
  request_count: 0
  row_count: 0

animation:
  - step: "request" 1.5s
    focus: [Client, "API"]
    tween:
      request_count: 0 -> 1
    badge: "request"
    description: "Client が API を呼出"

  - step: "fetch" 1.5s
    focus: ["API", DB]
    tween:
      row_count: 0 -> 20
    badge: "fetched"
    description: "DB から 20 行取得"
`),io=i(`
title: "認証フロー (DSL)"
type: flow

actors:
  - Start: event
  - Verify: function
  - Done: event

flow:
  - Start -> Verify: "入力"
  - Verify -> Done: "OK" (success)

states:
  progress: 0

animation:
  - step: "処理中" 1s
    focus: [Start, Verify]
    tween:
      progress: 0 -> 50
    badge: "進行中"

  - step: "完了" 1s
    focus: [Verify, Done]
    tween:
      progress: 50 -> 100
    badge: "完了"
`),oo=i(`
title: "並列処理 (DSL)"
type: swimlane

actors:
  - ServiceA: service
  - ServiceB: service
  - ServiceC: service

flow:
  - ServiceA -> ServiceB: "dispatch" (info)
  - ServiceB -> ServiceC: "forward" (success)

animation:
  - step: "dispatch" 1.5s
    focus: [ServiceA, ServiceB]
    badge: "A → B"

  - step: "forward" 1.5s
    focus: [ServiceB, ServiceC]
    badge: "B → C"
`),no=i(`
title: "認証 FSM (DSL)"
type: state

actors:
  - Idle
  - Loading
  - Done
  - Error

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "success" (success)
  - Loading -> Error: "fail" (error)

states:
  counter: 0

animation:
  - step: "submit" 1s
    focus: [Idle, Loading]
    tween:
      counter: 0 -> 1
    badge: "送信"

  - step: "success" 1s
    focus: [Loading, Done]
    tween:
      counter: 1 -> 2
    badge: "完了"
`),lo=i(`
title: "System (DSL)"
type: topology

actors:
  - Browser: service
  - API: service
  - DB: database

flow:
  - Browser -> API: "HTTPS"
  - API -> DB: "SQL"

animation:
  - step: "request" 1s
    focus: [Browser, API]
    badge: "要求中"

  - step: "query" 1s
    focus: [API, DB]
    badge: "問合中"
`),so=i(`
title: "スキーマ (DSL)"
type: er

actors:
  - User
  - Order

flow:
  - User -> Order: "places" (info)

animation:
  - step: "片方" 1s
    focus: [User]
    badge: "User"
  - step: "つながり" 1s
    focus: ["User -> Order"]
    badge: "places"
  - step: "全体" 1s
    focus: [User, Order]
    badge: "1:N"
`),ro=i(`
title: "四半期ロードマップを Text DSL で書く例"
type: gantt

actors:
  - task1: { kind: card, subtitle: "Q1" }
  - task2: { kind: card, subtitle: "Q2" }
  - task3: { kind: card, subtitle: "Q3" }

flow:
  - task1 -> task2: "depends"
  - task2 -> task3: "depends"

states:
  task1_progress: 0
  task2_progress: 0

animation:
  - step: "Q1 進行" 1.2s
    focus: [task1]
    tween:
      task1_progress: 0 -> 100
    badge: "Q1 完了"

  - step: "Q2 開始" 1.2s
    focus: [task1, task2]
    tween:
      task2_progress: 0 -> 50
    badge: "Q2 進行中"
`),co=i(`
title: "UML class (DSL)"
type: flow

actors:
  - User: { kind: card, subtitle: "+name / +login()" }
  - Admin: { kind: card, subtitle: "+role / +delete()" }

flow:
  - User -> Admin: "extends"

animation:
  - step: "親" 1s
    focus: [User]
    badge: "User"
  - step: "つながり" 1s
    focus: ["User -> Admin"]
    badge: "extends"
  - step: "子まで" 1s
    focus: [User, Admin]
    badge: "Admin extends User"
`),uo=i(`
title: "内訳の割合を Text DSL で書く例"
type: pie

actors:
  - A: { kind: card, value: "30%" }
  - B: { kind: card, value: "50%" }
  - C: { kind: card, value: "20%" }

states:
  a_share: 30
  b_share: 50

animation:
  - step: "シェア更新" 1s
    focus: [A, B]
    tween:
      a_share: 30 -> 40
      b_share: 50 -> 40
    badge: "再分配"
`),po=i(`
title: "C4 (DSL)"
type: c4

actors:
  - User: { kind: person, subtitle: "End user" }
  - Web: { kind: service, subtitle: "Frontend" }
  - API: { kind: api, subtitle: "Backend" }
  - DB: { kind: database, subtitle: "PostgreSQL" }

flow:
  - User -> Web: "uses"
  - Web -> API: "calls"
  - API -> DB: "reads"

animation:
  - step: "request" 1s
    focus: [User, Web]
    badge: "アクセス"
  - step: "fetch" 1s
    focus: [API, DB]
    badge: "DB 参照"
`),bo=i(`
title: "アイデア DSL (中心 + 放射の枝)"
type: mind

states:
  stage: "下書き"

actors:
  - Core
  - Idea1
  - Idea2
  - "決め手 {stage}"

animation:
  - step: "中心" 1s
    set:
      stage: "下書き"
    badge: "発想"
  - step: "案が出る" 1s
    set:
      stage: "比べる"
    badge: "案 1"
  - step: "広がる" 1s
    set:
      stage: "選ぶ"
    badge: "案 3"
`),ho=i(`
title: "Service call + write + emit"
type: sequence

actors:
  - Client: { kind: actor, subtitle: "request" }
  - Server: { kind: function, subtitle: "handler" }
  - DB: { kind: storage, rows: ["count: {count}"] }
  - OrderCreated: { kind: event, subtitle: "orderId, total" }

states:
  count: 100

flow:
  - Client -> Server: "POST /orders"
  - Server -> DB: "UPDATE count -= 1" (info)
  - Server -> OrderCreated: "emit" (success)

animation:
  - step: "call" 1.2s
    focus: [Client, Server]
    badge: "request"
  - step: "write" 1.5s
    focus: [Server, DB]
    tween:
      count: 100 -> 99
    badge: "DB update"
  - step: "emit" 0.8s
    focus: [Server, OrderCreated]
    badge: "OrderCreated"
`),go=i(`
title: "値どうしの関係を書く例"
type: flow

actors:
  - 受付: api "入ってくる数" "{inflow}"
  - 待ち行列: queue "まだ捌けていない" "{waiting}"
  - 処理: service "捌いた数" "{done}"

flow:
  - 受付 -> 待ち行列: "積む"
  - 待ち行列 -> 処理: "取り出す" (success)

states:
  inflow: 0
  done: 0

values:
  waiting: "{inflow} - {done}"
  busy: "{waiting} > 20"

animation:
  - step: "入ってくる" 1.4s
    focus: [受付, 待ち行列]
    tween:
      inflow: 0 -> 40
    badge: "流入 40"
    description: "待ち行列は書かなくても 40 になる"

  - step: "捌き始める" 1.4s
    focus: [待ち行列, 処理]
    tween:
      done: 0 -> 10
    badge: "処理 10"
    description: "待ち行列は 30 に減る"

  - step: "追いつく" 1.4s
    focus: [処理]
    tween:
      done: 10 -> 25
    badge: "処理 25"
    description: "待ち行列は 15 まで減る"
`),ko=Object.freeze(Object.defineProperty({__proto__:null,textDslC4:po,textDslClass:co,textDslCode:ho,textDslEr:so,textDslFlow:io,textDslGantt:ro,textDslMind:bo,textDslPie:uo,textDslSequence:ao,textDslStateMachine:no,textDslSwimlane:oo,textDslTopology:lo,textDslValues:go},Symbol.toStringTag,{value:"Module"})),wo=t("interactive-slider-bar",{structuredData:"exclude",topic:"スライダーの値が右の箱の説明欄に届く"}).lane("slider",{x:0,width:260}).lane("output",{x:300,width:260}).input.slider("value",{min:0,max:100,defaultValue:50,label:"Value"}).state("value",{initial:50}).node("sliderNode",{lane:"slider",stack:0,kind:"card",title:"Slider",subtitle:"value = {value}"}).node("bar-node",{lane:"output",stack:0,kind:"card",title:"Bar",subtitle:"value: {value}"}).edge("sliderNode","bar-node",{label:"signal bind",tone:"info"}).phase("p1",{duration:1600,title:"つまみを持つ",body:"左の縦列だけを見る。 つまみが `value` という値を握っていて、動かすとこの値が変わる。 まだ右の棒には届いていない。"},e=>e.activate("sliderNode")).phase("p2",{duration:1600,title:"値が渡る",body:"つまみと右の箱を結ぶ線を通って値が渡る。 2 つの箱が同じ値を見ている状態になる。"},e=>e.activate("sliderNode","bar-node")).phase("p3",{duration:1600,title:"説明欄に出る",body:"渡った値が右の箱の説明欄に出る。 図形の大きさは変わらず、文字として反映される経路。"},e=>e.activate("bar-node")).build(),mo="input.slider bind の 2-lane (Slider signal / Bar node) + bind edge、 signal → subtitle 反映経路を可視化",vo=t("interactive-formula-text",{topic:"入力値から 2 倍と半分を自動計算する"}).lane("input",{x:0,width:200}).lane("doubled",{x:240,width:200}).lane("halved",{x:480,width:200}).input.number("input",{defaultValue:10,label:"Input"}).formula("doubled","input * 2").formula("halved","input / 2").state("input",{initial:10}).state("doubled",{initial:20}).state("halved",{initial:5}).node("in",{lane:"input",stack:0,kind:"card",title:"Input",subtitle:"value = {input}"}).node("out1",{lane:"doubled",stack:0,kind:"card",title:"Doubled",subtitle:"input * 2 = {doubled}"}).node("out2",{lane:"halved",stack:0,kind:"card",title:"Halved",subtitle:"input / 2 = {halved}"}).edge("in","out1",{label:"× 2",tone:"success"}).edge("in","out2",{label:"÷ 2",tone:"info"}).phase("p1",{duration:1600,title:"元の値を置く",body:"左の箱に入力値を置く。 まだ計算式は動いていない。"},e=>e.activate("in")).phase("p2",{duration:1600,title:"2 倍を出す",body:"1 つ目の計算式が元の値を 2 倍にして、右上の箱に書き出す。 元の値を変えると追いかける。"},e=>e.activate("in","out1")).phase("p3",{duration:1600,title:"半分も出す",body:"2 つ目の計算式が同じ元の値を半分にする。 元が 1 つ、そこから出る値が 2 つ。"},e=>e.activate("in","out1","out2")).build(),yo="formula chain を 3-lane (Input / Doubled / Halved) 分散 + 2 dependency edge で dataflow network 化、 formula reactive を可視化",fo=t("interactive-scroll-narrative",{topic:"スクロール進行に 3 つの段が同時に追随する"}).lane("s1",{x:0,width:220}).lane("s2",{x:260,width:220}).lane("s3",{x:520,width:220}).animation.scroll("intro",{start:.9,end:.1,label:"Intro reveal"}).state("intro",{initial:0}).node("a",{lane:"s1",stack:0,kind:"card",title:"Step 1",subtitle:"progress: {intro}"}).node("b",{lane:"s2",stack:0,kind:"card",title:"Step 2",subtitle:"progress: {intro}"}).node("c",{lane:"s3",stack:0,kind:"card",title:"Step 3",subtitle:"progress: {intro}"}).phase("p1",{duration:1600,title:"1 箱で見る",body:"スクロールの進み具合が 1 つの箱に届いている状態。 進捗は 1 つの信号で持つ。"},e=>e.activate("a")).phase("p2",{duration:1600,title:"2 箱で見る",body:"同じ進捗を 2 つ目の箱でも見る。 区切りが 2 つあるのではなく、1 つの信号を 2 箇所が見ている。"},e=>e.activate("a","b")).phase("p3",{duration:1600,title:"3 箱が同時に追う",body:"3 つの箱が同じ進捗を同時に映す。 スクロール 1 つで複数箇所が揃って動く。"},e=>e.activate("a","b","c")).build(),Co="scroll 0..1 progress を 3-lane (Step 1 / Step 2 / Step 3) step 別分散、 各 step 個別 lane、 scroll 進行が全 lane 同時追随",xo=t("interactive-click-toggle",{topic:"クリックが handler を通って状態に届く"}).lane("col1",{x:0,width:360}).lane("col2",{x:400,width:370}).input.toggle("active",{defaultValue:!1,label:"Active"}).state("active",{initial:"off"}).node("btn",{lane:"col1",stack:0,kind:"card",w:180,title:"Button",subtitle:"click target"}).node("handlerNode",{lane:"col2",stack:0,kind:"card",w:320,title:"Handler",subtitle:"押した時と触れた時の受け取り手"}).node("signalNode",{lane:"col1",stack:1,kind:"card",w:310,title:"Signal state",subtitle:"active = {active}"}).edge("btn","handlerNode",{label:"click / hover",tone:"info"}).edge("handlerNode","signalNode",{label:"toggle",tone:"success"}).on.click({kind:"node",id:"btn"},"toggle-active").on.hover({kind:"node",id:"btn"},"hover-state").phase("p1",{duration:1600,title:"押す前",body:"ボタンだけがある状態。 まだ何も起きていない。"},e=>e.activate("btn")).phase("p2",{duration:1600,title:"受け取り手に結ぶ",body:"押した時に呼ぶ受け取り手を結び付ける。 受け取り手の中身は使う側が渡す。"},e=>e.activate("btn","handlerNode")).phase("p3",{duration:1600,title:"押すと値が変わる",body:"受け取り手が値を書き換える。 左上の箱を実際に押すと下の箱の値が入れ替わり、もう一度押すと戻る。"},e=>e.activate("btn","handlerNode","signalNode")).build(),So="click event flow を 3 区画 (Trigger button / Event handler / Signal state) 2 列 2 段 + 2 edge、 click→handler→signal の 3 step dataflow",No=t("interactive-visual-bar",{topic:"信号の値が棒の実際の幅に反映される"}).lane("signal",{x:0,width:200}).lane("bar",{x:240,width:340}).lane("readout",{x:600,width:220}).input.slider("barW",{min:40,max:320,defaultValue:160,label:"Bar width"}).state("barW",{initial:160}).node("signalNode",{lane:"signal",stack:0,kind:"card",title:"Signal",subtitle:"barW = {barW}"}).node("bar",{lane:"bar",stack:0,kind:"card",title:"Bar",subtitle:"wBind = {barW}px",w:160,wBind:"{barW}"}).node("readoutNode",{lane:"readout",stack:0,kind:"card",title:"Bar readout",subtitle:"readout.bar が signal を同時追随"}).edge("signalNode","bar",{label:"wBind",tone:"info"}).edge("signalNode","readoutNode",{label:"readout",tone:"success"}).readout.bar("barMon",{source:"barW",min:40,max:320,label:"Width readout"}).phase("p1",{duration:1800,title:"信号を見る",body:"左の箱が信号の値を持つ。 幅はつまみで決まるので、ここでは持ち主だけを見る。"},e=>e.activate("signalNode")).phase("p2",{duration:1800,title:"棒に届く",body:"信号が棒の幅として束ねられている。 つまみを動かすとこの棒が追いかける。"},e=>e.activate("signalNode","bar")).phase("p3",{duration:1800,title:"数でも読む",body:"右の表示が同じ信号を数で出す。 図形と数が 1 つの信号を別の形で見ている。"},e=>e.activate("signalNode","bar","readoutNode")).build(),Ao="wBind visual binding を 3-lane (Signal source / Dynamic bar / Bar readout) + 2 edge、 signal → 実 SVG width の反映経路を可視化",Po=t("interactive-visual-opacity",{topic:"信号に追随する濃さと固定の濃さを並べる"}).lane("control",{x:0,width:200}).lane("target",{x:240,width:220}).lane("ref",{x:500,width:200}).input.slider("fade",{min:0,max:100,defaultValue:100,label:"Opacity"}).formula("op","fade / 100").state("fade",{initial:100}).state("op",{initial:1}).node("controlNode",{lane:"control",stack:0,kind:"card",title:"Fade control",subtitle:"fade = {fade} · op = {op}"}).node("target",{lane:"target",stack:0,kind:"card",title:"Target",subtitle:"opacity: {op}",opacity:"{op}"}).node("ref",{lane:"ref",stack:0,kind:"card",title:"Reference",subtitle:"always visible (opacity=1)"}).edge("controlNode","target",{label:"op bind",tone:"info"}).edge("controlNode","ref",{label:"no bind",tone:"warning"}).readout.gauge("opGauge",{source:"fade",min:0,max:100,label:"Fade % gauge"}).phase("p1",{duration:1800,title:"動かす側を見る",body:"左の箱がつまみで濃さを持つ。 この値が右の 1 つだけに届く。"},e=>e.activate("controlNode","ref")).phase("p2",{duration:1800,title:"追随する側",body:"追随する側は信号に束ねられている。 つまみを動かすとここだけが変わる。"},e=>e.activate("controlNode","target","ref")).phase("p3",{duration:1800,title:"固定の側と比べる",body:"固定側は束ねられていないので動かない。 2 つを並べると束ねの有無が見える。"},e=>e.activate("target","ref")).build(),Bo="opacity visual bind を 3-lane (Fade control / Target opacity / Reference constant) + 2 edge、 signal 追随 vs 固定の対比可視化",_o=t("interactive-xypad-nav",{topic:"XY パッドの座標が 4 象限のどこかを示す"}).lane("q2",{x:0,width:160}).lane("q1",{x:180,width:160}).lane("q3",{x:360,width:160}).lane("q4",{x:540,width:160}).input.xypad("pos",{xMin:0,xMax:100,yMin:0,yMax:100,defaultX:50,defaultY:50,label:"Position"}).state("pos",{initial:"50,50"}).node("q2Node",{lane:"q2",stack:0,kind:"card",title:"Q2",subtitle:"upper-left"}).node("q1Node",{lane:"q1",stack:0,kind:"card",title:"Q1",subtitle:"upper-right"}).node("q3Node",{lane:"q3",stack:0,kind:"card",title:"Q3",subtitle:"lower-left"}).node("q4Node",{lane:"q4",stack:0,kind:"card",title:"Q4",subtitle:"lower-right"}).node("indicator",{lane:"q1",stack:1,kind:"card",title:"◆ Position",subtitle:"{pos} (default center → Q1 boundary)"}).readout.stat("posStat",{source:"pos",label:"Selected",caption:"x,y in 0..100"}).phase("p1",{duration:1800,title:"左下の区画",body:"4 つに区切った左下。 座標はつまみで決まり、入った区画の箱が光る。"},e=>e.activate("q3Node","indicator")).phase("p2",{duration:1800,title:"右上の区画",body:"右上の区画。 つまみを動かして境界をまたぐと、光る箱が入れ替わる。"},e=>e.activate("q1Node","indicator")).phase("p3",{duration:1800,title:"4 区画を見る",body:"4 つの区画が同じ大きさで並ぶ。 座標 1 組がどれか 1 つを指す。"},e=>e.activate("q1Node","q2Node","q3Node","q4Node","indicator")).build(),Do="XY pad 2D 座標を 4-lane quadrant (Q1/Q2/Q3/Q4) 分散、 現在 pos を center indicator + stat readout で数値化",To=t("interactive-stepper",{topic:"増減ボタンで棒と数値が動く"}).lane("ctrl",{x:0,width:200}).lane("bar",{x:240,width:220}).lane("stat",{x:480,width:200}).input.stepper("count",{min:0,max:10,defaultValue:3,label:"Count"}).state("count",{initial:3}).node("ctrlNode",{lane:"ctrl",stack:0,kind:"card",title:"Stepper",subtitle:"count = {count} (0-10 range)"}).node("barNode",{lane:"bar",stack:0,kind:"card",title:"Bar visual",subtitle:"count 追随 progress bar (readout.bar)"}).node("statNode",{lane:"stat",stack:0,kind:"card",title:"Stat readout",subtitle:"count 追随 number + unit (readout.stat)"}).edge("ctrlNode","barNode",{label:"→ bar",tone:"info"}).edge("ctrlNode","statNode",{label:"→ stat",tone:"success"}).readout.bar("countBar",{source:"count",min:0,max:10,label:"Progress bar"}).readout.stat("countStat",{source:"count",label:"Total",unit:" items"}).phase("p1",{duration:1800,title:"3 個",body:"初期の 3 個。 棒の長さと数字が同じ値を見ている。"},e=>e.activate("ctrlNode")).phase("p2",{duration:1800,title:"増やす",body:"ボタンで増やすと棒が伸び、数字も上がる。 2 つが同時に動く。"},e=>e.activate("ctrlNode","barNode")).phase("p3",{duration:1800,title:"読み取る",body:"右の数字で正確な値を読む。 棒は大小、数字は正確さを担う。"},e=>e.activate("ctrlNode","barNode","statNode")).build(),Io="stepper control を 3-lane (Control input / Bar visualization / Stat readout) 分散 + 2 fan-out edge、 signal → 2 readout の 1:N 経路可視化",Ro=t("interactive-number-spark",{structuredData:"exclude",topic:"現在値と履歴のミニ折れ線を並べる"}).lane("current",{x:0,width:220}).lane("history",{x:260,width:320}).input.number("val",{defaultValue:20,label:"Value"}).state("val",{initial:20}).node("currentNode",{lane:"current",stack:0,kind:"card",title:"Current",subtitle:"val = {val}"}).node("historyNode",{lane:"history",stack:0,kind:"card",title:"History (15)",subtitle:"sparkline で直近 15 push 履歴"}).edge("currentNode","historyNode",{label:"push",tone:"info"}).readout.sparkline("valHist",{source:"val",history:15,color:"#e57373",label:"Sparkline history"}).readout.stat("valStat",{source:"val",label:"Latest",caption:"input 履歴の最新"}).phase("p1",{duration:1800,title:"現在値を見る",body:"つまみが持つ今の値。 数字と折れ線の右端が同じ値を指す。"},e=>e.activate("currentNode")).phase("p2",{duration:1800,title:"履歴と並べる",body:"折れ線は過去の値を並べたもの。 現在値だけが右端で動く。"},e=>e.activate("currentNode","historyNode")).phase("p3",{duration:1800,title:"形で読む",body:"上下の動きは折れ線の形に残る。 数字 1 つでは分からない推移が読める。"},e=>e.activate("historyNode")).build(),Eo="number sparkline を 2-lane (Current value / History sparkline) 分散 + push edge、 現在値と履歴の関係を可視化",Mo=t("interactive-radio-select",{topic:"3 択のラジオで選んだ 1 つだけが光る"}).lane("low",{x:0,width:200}).lane("mid",{x:240,width:200}).lane("high",{x:480,width:200}).input.radio("mode",{options:["low","mid","high"],defaultValue:"mid",label:"Mode"}).state("mode",{initial:"mid"}).node("lowNode",{lane:"low",stack:0,kind:"card",title:"Low mode",subtitle:"option: low"}).node("midNode",{lane:"mid",stack:0,kind:"card",title:"Mid mode",subtitle:"option: mid (default)"}).node("highNode",{lane:"high",stack:0,kind:"card",title:"High mode",subtitle:"option: high"}).node("currentMode",{lane:"mid",stack:1,kind:"card",title:"◆ Current",subtitle:"mode = {mode}"}).readout.stat("modeStat",{source:"mode",label:"Current",caption:"選択中"}).phase("p1",{duration:1800,title:"低の札",body:"3 択の 1 つ目。 どれが選ばれるかはつまみで決まり、選ばれた 1 つだけが光る。"},e=>e.activate("lowNode")).phase("p2",{duration:1800,title:"中の札",body:"2 つ目の札。 3 つのうち同時に選べるのは常に 1 つ。"},e=>e.activate("midNode")).phase("p3",{duration:1800,title:"高の札",body:"3 つ目の札。 選んだ値は右の箱にも文字で出る。"},e=>e.activate("highNode","currentMode")).build(),Lo="radio 3 option (low/mid/high) を 3-lane 排他分散 + current indicator、 現在選択 mode 位置を明示",Oo=t("interactive-color-theme",{topic:"選んだ色が見本と 16 進表記に伝わる"}).lane("picker",{x:0,width:370}).lane("swatch",{x:410,width:230}).lane("stat",{x:680,width:320}).input.color("accent",{defaultValue:"#8a5a2a",label:"Accent"}).state("accent",{initial:"#8a5a2a"}).node("pickerNode",{lane:"picker",stack:0,kind:"card",w:320,title:"Color picker",subtitle:"input.color widget · default #8a5a2a"}).node("swatch",{lane:"swatch",stack:0,kind:"card",w:180,title:"Swatch",subtitle:"hex: {accent}"}).node("statNode",{lane:"stat",stack:0,kind:"card",w:270,title:"Hex stat",subtitle:"readout.stat で hex 表示"}).edge("pickerNode","swatch",{label:"select",tone:"info"}).edge("swatch","statNode",{label:"display",tone:"success"}).readout.stat("hexReadout",{source:"accent",label:"Selected",caption:"hex color"}).phase("p1",{duration:1800,title:"色を選ぶ",body:"選んだ色が左の箱に入る。 まだ見本には伝わっていない。"},e=>e.activate("pickerNode")).phase("p2",{duration:1800,title:"見本に伝わる",body:"選んだ色の 16 進表記が中央に出る。 箱の塗り自体には束ねていないので、色は変わらない。"},e=>e.activate("pickerNode","swatch")).phase("p3",{duration:1800,title:"表記も揃う",body:"右にも同じ 16 進表記が出る。 選んだ値が 2 箇所で読める形になっている。"},e=>e.activate("pickerNode","swatch","statNode")).build(),Fo="color picker pipeline を 3-lane (Picker input / Swatch preview / Hex stat) + 2 edge、 hex signal 生成 dataflow を可視化",Ho=t("interactive-shape-rect",{topic:"四角の塗り割合を 4 段階で見せる"}).lane("low",{x:0,width:130}).lane("mid",{x:150,width:130}).lane("high",{x:300,width:130}).lane("interactive",{x:450,width:160}).input.slider("v",{min:0,max:100,defaultValue:40,label:"Value"}).state("v",{initial:40}).state("low25",{initial:25}).state("mid50",{initial:50}).state("high75",{initial:75}).node("barLow",{lane:"low",stack:0,kind:"dyn-rect",title:"Low 25%",w:100,h:240,shape:{kind:"rect",source:"{low25}",fillMax:100,orient:"up",fill:"#a08870"}}).node("barMid",{lane:"mid",stack:0,kind:"dyn-rect",title:"Mid 50%",w:100,h:240,shape:{kind:"rect",source:"{mid50}",fillMax:100,orient:"up",fill:"#2563eb"}}).node("barHigh",{lane:"high",stack:0,kind:"dyn-rect",title:"High 75%",w:100,h:240,shape:{kind:"rect",source:"{high75}",fillMax:100,orient:"up",fill:"#f97316"}}).node("bar",{lane:"interactive",stack:0,kind:"dyn-rect",title:"Slider ({v}%)",w:100,h:240,shape:{kind:"rect",source:"{v}",fillMax:100,orient:"up",fill:"#8a5a2a"}}).phase("p1",{duration:1600,title:"25% を見る",body:"塗りが 4 分の 1 の状態。 下から少しだけ埋まっている。"},e=>e.activate("barLow")).phase("p2",{duration:1600,title:"50% と並べる",body:"半分の状態を隣に置く。 25% との差が高さで分かる。"},e=>e.activate("barLow","barMid")).phase("p3",{duration:1600,title:"75% まで並べる",body:"4 分の 3 まで並べる。 3 段階の差が一目で比べられる。"},e=>e.activate("barLow","barMid","barHigh")).phase("p4",{duration:1600,title:"つまみで動かす",body:"右端はつまみで自由に変えられる。 3 つの見本と見比べる。"},e=>e.activate("barLow","barMid","barHigh","bar")).build(),Wo="dyn-rect fill を 4-lane (Low 25% / Mid 50% / High 75% / Interactive slider) 分散、 3 static + 1 reactive rect 並列比較",qo=t("interactive-shape-chain",{topic:"3 個の dyn-rect を並列、 base slider で各 fill が formula 経由で連動変化"}).lane("l1",{x:0,width:130}).lane("l2",{x:150,width:130}).lane("l3",{x:300,width:130}).input.slider("base",{min:0,max:100,defaultValue:30,label:"Base"}).formula("gas1","base").formula("gas2","base * 1.2").formula("gas3","base * 1.5").state("base",{initial:30}).state("gas1",{initial:30}).state("gas2",{initial:36}).state("gas3",{initial:45}).node("r1",{lane:"l1",stack:0,kind:"dyn-rect",title:"Block 1",subtitle:"gas: {gas1}",w:100,h:220,shape:{kind:"rect",source:"{gas1}",fillMax:150,orient:"up",fill:"#8a5a2a"}}).node("r2",{lane:"l2",stack:0,kind:"dyn-rect",title:"Block 2",subtitle:"gas: {gas2}",w:100,h:220,shape:{kind:"rect",source:"{gas2}",fillMax:150,orient:"up",fill:"#4e9dc4"}}).node("r3",{lane:"l3",stack:0,kind:"dyn-rect",title:"Block 3",subtitle:"gas: {gas3}",w:100,h:220,shape:{kind:"rect",source:"{gas3}",fillMax:150,orient:"up",fill:"#7ec4dd"}}).phase("p1",{duration:1600,title:"等倍で見る",body:"元の値がそのまま 1 つ目の四角の塗りになる。 3 つのうち基準になる 1 つ。"},e=>e.activate("r1")).phase("p2",{duration:1600,title:"1.2 倍で見る",body:"2 つ目は同じ元の値を 1.2 倍した塗りになる。 前の四角からではなく、元の値を直接見ている。"},e=>e.activate("r1","r2")).phase("p3",{duration:1600,title:"1.5 倍で見る",body:"3 つ目は 1.5 倍。 元を 1 つ動かすと 3 つが同時に、別々の率で変わる。"},e=>e.activate("r1","r2","r3")).build(),Go=t("interactive-shape-circle",{topic:"円の進捗リングを 4 段階で見せる"}).lane("empty",{x:0,width:170}).lane("third",{x:195,width:170}).lane("twothird",{x:390,width:170}).lane("interactive",{x:585,width:180}).input.slider("p",{min:0,max:100,defaultValue:60,label:"Progress"}).formula("prog","p / 100").state("p",{initial:60}).state("prog",{initial:.6}).state("prog0",{initial:0}).state("prog33",{initial:.33}).state("prog66",{initial:.66}).node("cEmpty",{lane:"empty",stack:0,kind:"dyn-circle",title:"0%",subtitle:"empty",w:160,h:160,shape:{kind:"circle",fillProgress:"{prog0}",fill:"#a08870"}}).node("cThird",{lane:"third",stack:0,kind:"dyn-circle",title:"33%",subtitle:"one-third",w:160,h:160,shape:{kind:"circle",fillProgress:"{prog33}",fill:"#2563eb"}}).node("cTwoThird",{lane:"twothird",stack:0,kind:"dyn-circle",title:"66%",subtitle:"two-third",w:160,h:160,shape:{kind:"circle",fillProgress:"{prog66}",fill:"#f97316"}}).node("c",{lane:"interactive",stack:0,kind:"dyn-circle",title:"Ring",subtitle:"{p}%",w:160,h:160,shape:{kind:"circle",fillProgress:"{prog}",fill:"#8a5a2a"}}).phase("p1",{duration:1600,title:"0% を見る",body:"輪がまだ描かれていない状態。 ここが目盛りの始まりで、右へ行くほど輪が伸びる。"},e=>e.activate("cEmpty")).phase("p2",{duration:1600,title:"33% と並べる",body:"3 分の 1 まで描いた輪を隣に置く。 0% との差が、輪の長さの違いとして読み取れる。"},e=>e.activate("cEmpty","cThird")).phase("p3",{duration:1600,title:"66% まで並べる",body:"3 分の 2 まで並べる。 角度の差が輪の長さで分かる。"},e=>e.activate("cEmpty","cThird","cTwoThird")).phase("p4",{duration:1600,title:"つまみで動かす",body:"右端はつまみで自由に変えられる。 3 つの見本と見比べる。"},e=>e.activate("cEmpty","cThird","cTwoThird","c")).build(),Vo="dyn-circle progress ring を 4-lane (0% / 33% / 66% / Interactive) 分散、 3 static + 1 reactive circle 並列比較",Uo=t("interactive-shape-arc",{topic:"弧のゲージ角度を 4 段階で見せる"}).lane("min",{x:0,width:180}).lane("quarter",{x:205,width:180}).lane("half",{x:410,width:180}).lane("interactive",{x:615,width:200}).input.slider("a",{min:0,max:270,defaultValue:180,label:"Angle"}).state("a",{initial:180}).state("a0",{initial:0}).state("a90",{initial:90}).state("a180",{initial:180}).node("gMin",{lane:"min",stack:0,kind:"dyn-arc",title:"0°",subtitle:"min",w:180,h:180,shape:{kind:"arc",angle:"{a0}",startAngle:-135,sweepMax:270,fill:"#a08870"}}).node("gQuarter",{lane:"quarter",stack:0,kind:"dyn-arc",title:"90°",subtitle:"quarter",w:180,h:180,shape:{kind:"arc",angle:"{a90}",startAngle:-135,sweepMax:270,fill:"#2563eb"}}).node("gHalf",{lane:"half",stack:0,kind:"dyn-arc",title:"180°",subtitle:"half",w:180,h:180,shape:{kind:"arc",angle:"{a180}",startAngle:-135,sweepMax:270,fill:"#f97316"}}).node("g",{lane:"interactive",stack:0,kind:"dyn-arc",title:"Slider",subtitle:"{a}°",w:180,h:180,shape:{kind:"arc",angle:"{a}",startAngle:-135,sweepMax:270,fill:"#8a5a2a"}}).phase("p1",{duration:1600,title:"0 度を見る",body:"針が振れていない状態。 ここが目盛りの始まりで、右へ行くほど弧が長くなる。"},e=>e.activate("gMin")).phase("p2",{duration:1600,title:"90 度と並べる",body:"4 分の 1 まで振れた状態を隣に置く。"},e=>e.activate("gMin","gQuarter")).phase("p3",{duration:1600,title:"180 度まで並べる",body:"半周まで並べる。 角度の差が弧の長さで分かる。"},e=>e.activate("gMin","gQuarter","gHalf")).phase("p4",{duration:1600,title:"つまみで動かす",body:"右端はつまみで自由に変えられる。 3 つの見本と見比べる。"},e=>e.activate("gMin","gQuarter","gHalf","g")).build(),Qo="dyn-arc gauge sweep を 4-lane (Min 0° / Quarter 90° / Half 180° / Interactive) 分散、 3 static + 1 reactive arc 並列比較",jo=t("interactive-shape-wave",{topic:"波の水位を 4 段階で見せる"}).lane("low",{x:0,width:160}).lane("half",{x:180,width:160}).lane("high",{x:360,width:160}).lane("interactive",{x:540,width:180}).input.slider("lvl",{min:0,max:100,defaultValue:55,label:"Level"}).state("lvl",{initial:55}).state("lvl25",{initial:25}).state("lvl50",{initial:50}).state("lvl75",{initial:75}).node("wLow",{lane:"low",stack:0,kind:"dyn-wave",title:"Low",subtitle:"25%",w:140,h:220,shape:{kind:"wave",level:"{lvl25}",amplitude:100,frequency:2,waveHeight:5,fill:"#a08870"}}).node("wHalf",{lane:"half",stack:0,kind:"dyn-wave",title:"Half",subtitle:"50%",w:140,h:220,shape:{kind:"wave",level:"{lvl50}",amplitude:100,frequency:2,waveHeight:5,fill:"#2563eb"}}).node("wHigh",{lane:"high",stack:0,kind:"dyn-wave",title:"High",subtitle:"75%",w:140,h:220,shape:{kind:"wave",level:"{lvl75}",amplitude:100,frequency:2,waveHeight:5,fill:"#f97316"}}).node("w",{lane:"interactive",stack:0,kind:"dyn-wave",title:"Wave",subtitle:"{lvl}%",w:140,h:220,shape:{kind:"wave",level:"{lvl}",amplitude:100,frequency:2,waveHeight:5,fill:"#4e9dc4"}}).phase("p1",{duration:1600,title:"25% を見る",body:"水位が低い状態。 波の線が下の方にあり、上に空きが多く残っている。"},e=>e.activate("wLow")).phase("p2",{duration:1600,title:"50% と並べる",body:"半分まで入った状態を隣に置く。 25% との差が、線の高さの違いとして読み取れる。"},e=>e.activate("wLow","wHalf")).phase("p3",{duration:1600,title:"75% まで並べる",body:"4 分の 3 まで並べる。 水位の差が線の高さで分かる。"},e=>e.activate("wLow","wHalf","wHigh")).phase("p4",{duration:1600,title:"つまみで動かす",body:"右端はつまみで自由に変えられる。 3 つの見本と見比べる。"},e=>e.activate("wLow","wHalf","wHigh","w")).build(),Jo="dyn-wave tank level を 4-lane (Low 25 / Half 50 / High 75 / Interactive slider) 分散、 3 static + 1 reactive tank 並列比較",Yo=t("interactive-shape-polygon",{topic:"多角形の角数を 3 / 6 / 8 で見せる"}).lane("triangle",{x:0,width:180}).lane("hexagon",{x:200,width:180}).lane("octagon",{x:400,width:180}).lane("interactive",{x:600,width:200}).input.slider("rot",{min:0,max:360,defaultValue:0,label:"Rotation"}).input.slider("radius",{min:20,max:80,defaultValue:60,label:"Radius"}).state("rot",{initial:0}).state("radius",{initial:60}).state("rot0",{initial:0}).state("radius60",{initial:60}).node("polyTri",{lane:"triangle",stack:0,kind:"dyn-polygon",title:"Tri",subtitle:"sides=3",w:180,h:180,shape:{kind:"polygon",sides:3,radius:"{radius60}",rotation:"{rot0}",fill:"#a08870"}}).node("polyHex",{lane:"hexagon",stack:0,kind:"dyn-polygon",title:"Hex",subtitle:"sides=6",w:180,h:180,shape:{kind:"polygon",sides:6,radius:"{radius60}",rotation:"{rot0}",fill:"#2563eb"}}).node("polyOct",{lane:"octagon",stack:0,kind:"dyn-polygon",title:"Oct",subtitle:"sides=8",w:180,h:180,shape:{kind:"polygon",sides:8,radius:"{radius60}",rotation:"{rot0}",fill:"#f97316"}}).node("p",{lane:"interactive",stack:0,kind:"dyn-polygon",title:"Hexagon",subtitle:"{rot}° · r={radius}",w:200,h:200,shape:{kind:"polygon",sides:6,radius:"{radius}",rotation:"{rot}",fill:"#8a5a2a"}}).phase("p1",{duration:1600,title:"3 角を見る",body:"角が 3 つの状態。 これが最も少ない形で、角を増やすほど丸に近づいていく。"},e=>e.activate("polyTri")).phase("p2",{duration:1600,title:"6 角と並べる",body:"角を 6 つにした形を隣に置く。 丸みが増す。"},e=>e.activate("polyTri","polyHex")).phase("p3",{duration:1600,title:"8 角まで並べる",body:"角を 8 つまで増やす。 角の数と丸みの関係が分かる。"},e=>e.activate("polyTri","polyHex","polyOct")).phase("p4",{duration:1600,title:"つまみで動かす",body:"右端はつまみで回転角と大きさを変えられる。 角の数は固定で、3 つの見本と見比べる。"},e=>e.activate("polyTri","polyHex","polyOct","p")).build(),zo="dyn-polygon sides を 4-lane (Triangle 3 / Hexagon 6 / Octagon 8 / Interactive hexagon slider) 分散、 3 static + 1 reactive polygon 並列比較",$o=t("interactive-repeat-chain",{topic:"repeatNodes + deriveChain で N 個の rect を宣言的に生成、 前値連鎖で伝搬"}).lane("l1",{x:0,width:100}).lane("l2",{x:120,width:100}).lane("l3",{x:240,width:100}).lane("l4",{x:360,width:100}).lane("l5",{x:480,width:100}).input.slider("base",{min:0,max:60,defaultValue:20,label:"Base"}).deriveChain("gas",5,(e,n)=>e===0?"base":`${n} * 1.2`).state("base",{initial:20}).state("gas1",{initial:20}).state("gas2",{initial:24}).state("gas3",{initial:28.8}).state("gas4",{initial:34.56}).state("gas5",{initial:41.472}).repeatNodes(5,e=>({id:"r{i}",lane:"l{i+1}",stack:0,kind:"dyn-rect",title:"Block {i+1}",subtitle:"gas: {gas{i+1}}",w:80,h:220,shape:{kind:"rect",source:"{gas{i+1}}",fillMax:130,orient:"up",fill:"#8a5a2a"}})).phase("p1",{duration:1600,title:"起点を置く",body:"元の値が 1 つ目の四角に入る。 ここが連なりの起点。"},e=>e.activate("r0")).phase("p2",{duration:1600,title:"2 つ目まで伝わる",body:"前の値を受けて次の値が決まる。 同じ規則で 2 つ目が埋まる。"},e=>e.activate("r0","r1")).phase("p3",{duration:1600,title:"4 つ目まで伝わる",body:"同じ規則を繰り返して 4 つ目まで届く。 書いたのは規則 1 つだけ。"},e=>e.activate("r0","r1","r2","r3")).phase("p4",{duration:1600,title:"端まで届く",body:"5 つ目まで伝わり切る。 元を動かすと端まで連なって変わる。"},e=>e.activate("r0","r1","r2","r3","r4")).build(),Ko=t("interactive-dynamic-readouts",{topic:"数え上げ / 増減 / 円 / 打字の 4 表示を並べる"}).lane("col1",{x:0,width:370}).lane("col2",{x:410,width:370}).input.slider("rev",{min:0,max:500,defaultValue:250,label:"Revenue"}).input.dropdown("status",{options:["active","pending","closed"],defaultValue:"active",label:"Status"}).state("rev",{initial:250}).state("status",{initial:"active"}).node("countNode",{lane:"col1",stack:0,kind:"card",w:320,title:"Countup",subtitle:"rev={rev} · animated $ counter"}).node("deltaNode",{lane:"col2",stack:0,kind:"card",w:240,title:"Delta",subtitle:"rev={rev} · ↑↓ arrow"}).node("ringNode",{lane:"col1",stack:1,kind:"card",w:310,title:"Percent ring",subtitle:"rev/500 = {rev} progress"}).node("textNode",{lane:"col2",stack:1,kind:"card",w:320,title:"Typewriter",subtitle:"status={status} · char reveal"}).readout.countup("revCount",{source:"rev",unit:"$",label:"Revenue count"}).readout.delta("revDelta",{source:"rev",unit:"$",label:"Δ delta"}).readout.percentRing("revPct",{source:"rev",max:500,label:"Progress ring"}).readout.typewriter("statusText",{source:"status",charMs:50,label:"Status text"}).phase("p1",{duration:1800,title:"数え上げを見る",body:"件数を数え上げる表示。 4 つのうち 1 つ目で、つまみの値をそのまま出す。"},e=>e.activate("countNode")).phase("p2",{duration:1800,title:"増減と円を見る",body:"同じ件数から増減の幅と割合の円を出す。 1 つの値を 3 通りに描き分ける。"},e=>e.activate("countNode","deltaNode","ringNode")).phase("p3",{duration:1800,title:"文字でも出す",body:"状態を打ち出す表示まで並ぶ。 数値 3 つと文字 1 つの 4 表示が揃う。"},e=>e.activate("countNode","deltaNode","ringNode","textNode")).build(),Xo="4 dynamic readout (countup/delta/percent-ring/typewriter) を 2 列 2 段に分散、 各 readout 個別区画、 signal → 4 readout の 1:N 経路可視化",Zo=t("interactive-timeline-drive",{topic:"1 つの時間信号が図形 2 種を同時に動かす"}).lane("time",{x:0,width:200}).lane("bar",{x:240,width:180}).lane("arc",{x:440,width:220}).input.timeline("t",{duration:3e3,autoplay:!0,loop:!0,label:"Timeline"}).formula("bar","t * 100").formula("angle","t * 270").state("t",{initial:0}).state("bar",{initial:0}).state("angle",{initial:0}).node("timeNode",{lane:"time",stack:0,kind:"card",title:"Timeline",subtitle:"t (0-1 loop 3s autoplay)"}).node("r",{lane:"bar",stack:0,kind:"dyn-rect",title:"Bar (rect)",subtitle:"bar = t * 100",w:80,h:200,shape:{kind:"rect",source:"{bar}",fillMax:100,orient:"up",fill:"#8a5a2a"}}).node("a",{lane:"arc",stack:0,kind:"dyn-arc",title:"Arc",subtitle:"angle = t * 270",w:140,h:140,shape:{kind:"arc",angle:"{angle}",startAngle:-135,sweepMax:270,fill:"#4e9dc4"}}).edge("timeNode","r",{label:"→ bar",tone:"info"}).edge("timeNode","a",{label:"→ angle",tone:"accent",labelOffsetX:-45}).readout.countup("timeCu",{source:"bar",unit:"%",label:"Time %"}).phase("p1",{duration:1800,title:"時間の元を見る",body:"時間の入力が元になる。 この値から計算式で図形の値を導く。"},e=>e.activate("timeNode")).phase("p2",{duration:1800,title:"四角に届く",body:"計算式の値が四角に束ねられている。 時間が進むと自動で変わる。"},e=>e.activate("timeNode","r")).phase("p3",{duration:1800,title:"弧にも届く",body:"弧には別の計算式 (時間の 270 倍) が束ねられている。 同じ時間から別々の値を導く。"},e=>e.activate("timeNode","r","a")).build(),en="timeline signal fan-out を 3-lane (Timeline control / Rect shape / Arc shape) + 2 fan-out edge、 time → 2 shape 同時追随",tn=t("interactive-edge-flow",{topic:"信号で線の太さと流れる点が変わる"}).lane("src",{x:0,width:230}).lane("pipe",{x:270,width:350}).lane("sink",{x:660,width:190}).input.slider("flow",{min:1,max:15,defaultValue:5,label:"Flow Width"}).input.timeline("t",{duration:2e3,autoplay:!0,loop:!0,label:"Timeline"}).formula("dash","t * 24").state("flow",{initial:5}).state("t",{initial:0}).state("dash",{initial:0}).node("a",{lane:"src",stack:0,kind:"card",w:180,title:"Source",subtitle:"producer"}).node("pipeNode",{lane:"pipe",stack:0,kind:"card",w:300,title:"Pipe",subtitle:"width={flow} · dash={dash}"}).node("b",{lane:"sink",stack:0,kind:"card",w:140,title:"Sink",subtitle:"consumer"}).edge("a","pipeNode",{label:"produce",widthBind:"{flow}",dashOffsetBind:"{dash}"}).edge("pipeNode","b",{label:"consume",widthBind:"{flow}",dashOffsetBind:"{dash}"}).phase("p1",{duration:1600,title:"送り手を見る",body:"左の箱が信号を持つ。 まだ線には出ていない。"},e=>e.activate("a")).phase("p2",{duration:1600,title:"線に出る",body:"信号の大きさが線の太さになる。 太いほど多く流れている。"},e=>e.activate("a","pipeNode")).phase("p3",{duration:1600,title:"受け手まで届く",body:"線を流れる点が受け手に届く。 太さはつまみ、流れる点は時間の信号で、別々の入力が担う。"},e=>e.activate("a","pipeNode","b")).build(),an="edge signal bind (太さ/dashoffset) を 3-lane (Source / Pipe / Sink) 分散、 Source→Sink flow を横断 edge で animate",on=t("interactive-input-variety",{topic:"スライダー / 複数選択 / タブ / 文字の 4 入力を並べる"}).lane("range",{x:0,width:360}).lane("multi",{x:380,width:360}).lane("tabs",{x:760,width:230}).lane("text",{x:1010,width:320}).input.range("priceRange",{min:0,max:1e3,defaultLo:200,defaultHi:700,label:"Price Range"}).input.multiSelect("tags",{options:["new","sale","hot","featured"],defaultValues:["new"],label:"Tags"}).input.tabs("view",{options:["grid","list","compact"],defaultValue:"grid",label:"View"}).input.text("query",{defaultValue:"",placeholder:"Search...",maxLength:50,label:"Query"}).state("priceRange",{initial:"200,700"}).state("tags",{initial:"new"}).state("view",{initial:"grid"}).state("query",{initial:""}).node("rangeNode",{lane:"range",stack:0,kind:"card",w:310,title:"Range slider",subtitle:"price = {priceRange}"}).node("multiNode",{lane:"multi",stack:0,kind:"card",w:310,title:"Multi-select",subtitle:"tags = {tags}"}).node("tabsNode",{lane:"tabs",stack:0,kind:"card",w:180,title:"Tabs",subtitle:"view = {view}"}).node("textNode",{lane:"text",stack:0,kind:"card",w:270,title:"Text input",subtitle:"query = {query}"}).phase("p1",{duration:1600,title:"数を選ぶ",body:"つまみで数の範囲を選ぶ。 4 種類の入力のうち 1 つ目。"},e=>e.activate("rangeNode")).phase("p2",{duration:1600,title:"複数選ぶ",body:"札を複数選べる入力を加える。 選んだ数だけ値が増える。"},e=>e.activate("rangeNode","multiNode")).phase("p3",{duration:1600,title:"切り替える",body:"タブで表示を切り替える入力を加える。 1 つだけ選ぶ形。"},e=>e.activate("rangeNode","multiNode","tabsNode")).phase("p4",{duration:1600,title:"文字を打つ",body:"文字を打つ入力まで並ぶ。 4 種類が同じ図の中で動く。"},e=>e.activate("rangeNode","multiNode","tabsNode","textNode")).build(),nn="4 input widget (range/multiSelect/tabs/text) を 4-lane 分散、 各 widget 個別 lane + input signal 表示",ln=t("interactive-readout-variety",{topic:"熱セル / バッジ / 状態点の 3 表示を並べる"}).lane("heat",{x:0,width:220}).lane("badge",{x:260,width:220}).lane("dot",{x:520,width:220}).input.slider("temp",{min:0,max:100,defaultValue:42,label:"Temp"}).input.dropdown("state",{options:["online","offline","error"],defaultValue:"online",label:"State"}).state("temp",{initial:42}).state("state",{initial:"online"}).node("heatNode",{lane:"heat",stack:0,kind:"card",title:"Heat cell",subtitle:"temp = {temp} · 色 gradient"}).node("badgeNode",{lane:"badge",stack:0,kind:"card",title:"Badge (pill)",subtitle:"temp = {temp} · number pill"}).node("dotNode",{lane:"dot",stack:0,kind:"card",title:"Status dot",subtitle:"state = {state} · online/offline/error"}).readout.heatCell("tempHeat",{source:"temp",min:0,max:100,colors:["#4e9dc4","#e57373"],label:"Temp gradient"}).readout.badge("tempBadge",{source:"temp",label:"Value pill"}).readout.statusDot("statusRead",{source:"state",map:[{value:"online",color:"#22c55e",label:"Online"},{value:"offline",color:"#a08870",label:"Offline"},{value:"error",color:"#ef4444",label:"Error"}],label:"State dot"}).phase("p1",{duration:1800,title:"熱の升目を見る",body:"温度をひとつの升目の濃さで出す。 3 表示のうち 1 つ目。"},e=>e.activate("heatNode")).phase("p2",{duration:1800,title:"札でも出す",body:"同じ温度を札の数字でも出す。 濃さと数字が同じ値を指す。"},e=>e.activate("heatNode","badgeNode")).phase("p3",{duration:1800,title:"状態の点を見る",body:"別の状態を色の点で出す。 温度 2 表示と状態 1 表示で計 3 つが並ぶ。"},e=>e.activate("heatNode","badgeNode","dotNode")).build(),sn="3 readout variant (heatCell/badge/statusDot) を 3-lane 分散、 各 readout 個別 lane + temp/state signal 追随",rn=t("interactive-event-variety",{topic:"5 種の操作イベントを受け取り分ける"}).lane("pointer",{x:0,width:200}).lane("keyboard",{x:240,width:240}).lane("touch",{x:500,width:240}).input.dropdown("lastEvent",{options:["まだ無し","2 回押し","選ばれた","外れた","キー入力","長押し"],defaultValue:"まだ無し",label:"直近に受け取った操作"}).input.stepper("received",{min:0,max:99,defaultValue:0,label:"受け取った回数"}).node("btn1",{lane:"pointer",stack:0,kind:"card",title:"Double Click",subtitle:"2 回続けて押す"}).node("btn2",{lane:"keyboard",stack:0,kind:"card",title:"Key Focus",subtitle:"選ぶ / 外れる / キーを押す"}).node("btn3",{lane:"touch",stack:0,kind:"card",title:"Long Press",subtitle:"押したまま 500 ミリ秒"}).node("receiver",{lane:"touch",stack:1,kind:"card",w:220,title:"受け取った結果",subtitle:"{lastEvent} · 累計 {received} 回"}).on.doubleClick({kind:"node",id:"btn1"},"on-dbl").on.focus({kind:"node",id:"btn2"},"on-focus").on.blur({kind:"node",id:"btn2"},"on-blur").on.keydown({kind:"node",id:"btn2"},"on-key").on.longPress({kind:"node",id:"btn3"},"on-long").phase("p1",{duration:1600,title:"2 回押す",body:"1 つ目は 2 回続けて押した時だけ受け取る。 1 回では何も起きない。 受け取ると右下の箱が変わる。"},e=>e.activate("btn1","receiver")).phase("p2",{duration:1600,title:"選ぶ / キーを押す",body:"2 つ目は選ばれた時 / 外れた時 / キーを押した時の 3 つを受け取る。 押す操作ではない。"},e=>e.activate("btn1","btn2","receiver")).phase("p3",{duration:1600,title:"長く押す",body:"3 つ目は押したまま一定時間たつと受け取る。 5 つの操作はどれも同じ箱に結果を書く。"},e=>e.activate("btn1","btn2","btn3","receiver")).build(),dn="5 event kind (dbl/focus/blur/keydown/longpress) を 3-lane (Pointer / Keyboard / Touch) event category 別分散、 3 target node + 5 event bind",cn=t("interactive-grid-matrix",{topic:"3 行 4 列の格子を列ごとに並べる"}).lane("col0",{x:0,width:150}).lane("col1",{x:170,width:150}).lane("col2",{x:340,width:150}).lane("col3",{x:510,width:150}).input.stepper("r",{min:0,max:2,defaultValue:0,label:"Row"}).input.stepper("c",{min:0,max:3,defaultValue:0,label:"Col"}).state("r",{initial:0}).state("c",{initial:0}).gridNodes(3,4,(e,n)=>({id:"cell-{r}-{c}",lane:"col{c}",stack:e,kind:"card",title:"r{r} c{c}",subtitle:"col{c} lane · row{r} stack"})).readout.stat("hover",{source:"r",label:"Row"}).readout.stat("hoverC",{source:"c",label:"Col"}).phase("p1",{duration:1800,title:"1 行目を見る",body:"格子の 1 行目。 行と列はつまみで選び、選んだ位置が表示に出る。"},e=>e.activate("cell-0-0","cell-0-1","cell-0-2","cell-0-3")).phase("p2",{duration:1800,title:"2 行目を見る",body:"2 行目の 4 つ。 3 行 4 列がすべて同じ形で並んでいる。"},e=>e.activate("cell-1-0","cell-1-1","cell-1-2","cell-1-3")).phase("p3",{duration:1800,title:"3 行目を見る",body:"3 行目まで見ると格子の全体が揃う。 12 個が規則的に並ぶ。"},e=>e.activate("cell-2-0","cell-2-1","cell-2-2","cell-2-3")).build(),un="gridNodes(3, 4) 12 cell を 4-lane (Col 0-3) 列別分散、 gridNodes template で lane 動的割当、 各 lane 3 cell (Row 0-2) stack",pn=t("interactive-array-signal",{topic:"配列 5 要素の合計と個別値を並べる"}).lane("agg",{x:0,width:240}).lane("items",{x:300,width:260}).arraySignal("xs",[12,34,20,45,28]).input.slider("bump",{min:0,max:50,defaultValue:20,label:"First bar"}).node("summary",{lane:"agg",stack:0,kind:"card",title:"Aggregate",subtitle:"count {xs.length} · sum {xs.sum} · avg {xs.avg} · max {xs.max}"}).node("bumpNode",{lane:"agg",stack:1,kind:"card",title:"Bump control",subtitle:"1 本目だけを上書きするつまみ"}).node("i0",{lane:"items",stack:0,kind:"card",title:"#0",subtitle:"xs[0] = {xs[0]}"}).node("i1",{lane:"items",stack:1,kind:"card",title:"#1",subtitle:"xs[1] = {xs[1]}"}).node("i2",{lane:"items",stack:2,kind:"card",title:"#2",subtitle:"xs[2] = {xs[2]}"}).node("i3",{lane:"items",stack:3,kind:"card",title:"#3",subtitle:"xs[3] = {xs[3]}"}).node("i4",{lane:"items",stack:4,kind:"card",title:"#4",subtitle:"xs[4] = {xs[4]}"}).readout.arrayBar("hist",{source:"xs",min:0,max:50,color:"#2563eb",label:"Bars (histogram)"}).readout.arrayList("items",{source:"xs",itemTemplate:"#{i} → {item}",max:6,label:"Items (bullet list)"}).readout.stat("first",{source:"bump",label:"Bump"}).phase("p1",{duration:1800,title:"初期の並び",body:"5 つの値が並んだ状態。 棒の高さと一覧が同じ配列を見ている。"},e=>e.activate("summary","i0").set("xs","[12,34,20,45,28]")).phase("p2",{duration:1800,title:"山が右へ移る",body:"配列を差し替えると、一番高い棒が左寄りから右端に移る。 各箱の数字も同時に変わる。"},e=>e.activate("summary","i0","i1","i2").set("xs","[40,18,30,26,48]")).phase("p3",{duration:1800,title:"右上がりに整う",body:"右端を最大に保ったまま、左から右へ揃って上がる形にする。 配列 1 つで棒も箱も追いかける。"},e=>e.activate("summary","i0","i1","i2","i3","i4").set("xs","[15,22,30,38,48]")).build(),bn="arraySignal 5 element を 2-lane (Aggregate stat / Individual items) 分散、 各 element 個別 card + 集約 card、 arrayBar/arrayList readout 併存",hn=t("interactive-path-progress",{topic:"経路の進捗と完了状態を連動させる"}).lane("state",{x:0,width:200}).lane("visual",{x:240,width:300}).lane("done",{x:560,width:200}).input.slider("progress",{min:0,max:100,defaultValue:40,label:"Progress"}).state("progress",{initial:40}).state("done",{initial:0}).formula("done","progress >= 100 ? 1 : 0").node("main",{lane:"state",stack:0,kind:"card",title:"Task state",subtitle:"{progress}% complete"}).node("pathNode",{lane:"visual",stack:0,kind:"card",title:"Path visual",subtitle:"SVG stroke-dashoffset で進行"}).node("ringNode",{lane:"visual",stack:1,kind:"card",title:"Percent ring",subtitle:"同時追随"}).node("ok",{lane:"done",stack:0,kind:"card",title:"✓ Done",subtitle:"progress=100% で visibleIf 発動",visibleIf:"{done}"}).readout.pathProgress("pp",{source:"progress",pathD:"M 10 30 L 60 10 L 110 30 L 160 10 L 210 30 L 260 10",viewW:270,viewH:40,strokeWidth:5,color:"#22c55e",max:100,label:"Path (zigzag)"}).readout.percentRing("ring",{source:"progress",max:100,color:"#22c55e",label:"Ring"}).phase("p1",{duration:1800,title:"元の値を見る",body:"進捗の値をつまみが持つ。 この 1 つの値から 2 つの表示を作る。"},e=>e.activate("main")).phase("p2",{duration:1800,title:"経路と円に届く",body:"同じ進捗が経路の塗りと円の角度になる。 つまみを動かすと両方が動く。"},e=>e.activate("main","pathNode","ringNode")).phase("p3",{duration:1800,title:"完了の印",body:"進捗が満ちた時だけ出る印。 条件付きの表示で、満たない間は隠れている。"},e=>e.activate("main","pathNode","ringNode","ok")).build(),gn="path progress を 3-lane (State / Path visual / Completion) 分散、 progress state + path readout + 完了 badge を lane 別展開",kn=t("interactive-array-line-chart",{topic:"配列の値から面グラフを描く"}).lane("data",{x:0,width:200}).lane("area",{x:240,width:280}).lane("line",{x:540,width:280}).arraySignal("series",[22,35,28,42,55,48,60,72,65,80]).node("dataCard",{lane:"data",stack:0,kind:"card",title:"Time series",subtitle:"n={series.length} · sum={series.sum} · avg={series.avg}"}).node("areaCard",{lane:"area",stack:0,kind:"card",title:"Area chart",subtitle:"blue #2563eb · viewH=70"}).node("lineCard",{lane:"line",stack:0,kind:"card",title:"Line chart",subtitle:"orange #f97316 · viewH=50"}).readout.lineChart("chart",{source:"series",min:0,max:100,viewW:260,viewH:70,color:"#2563eb",fill:!0,label:"Area chart"}).readout.lineChart("chartNoFill",{source:"series",min:0,max:100,viewW:260,viewH:50,color:"#f97316",fill:!1,label:"Line chart"}).phase("p1",{duration:1800,title:"序盤の値",body:"前半の値だけを持つ。 折れ線が左半分に収まる。"},e=>e.activate("dataCard").set("series","[22,35,28,42,55]")).phase("p2",{duration:1800,title:"伸びる",body:"後半の値が加わり、折れ線が右へ伸びる。 面の広さも増える。"},e=>e.activate("dataCard","areaCard").set("series","[22,35,28,42,55,48,60,72]")).phase("p3",{duration:1800,title:"全体が揃う",body:"10 個すべてが揃う。 面と線の 2 表示が同じ配列を描く。"},e=>e.activate("dataCard","areaCard","lineCard").set("series","[22,35,28,42,55,48,60,72,65,80]")).build(),wn="arraySignal line chart を 3-lane (Data source / Area chart fill / Line chart no-fill) 分散、 chart variant 別 lane 展開、 lineChart 2 種類併存",mn=t("interactive-array-stacked-bar",{topic:"2 系列の配列を積み上げ棒で比べる"}).lane("groupA",{x:0,width:300}).lane("groupB",{x:340,width:300}).arraySignal("groupA",[40,55,30,65,45]).arraySignal("groupB",[25,40,50,35,60]).node("aCard",{lane:"groupA",stack:0,kind:"card",title:"Group A",subtitle:"sum={groupA.sum} · avg={groupA.avg} · max={groupA.max}"}).node("aDetail",{lane:"groupA",stack:1,kind:"card",title:"A 5 element",subtitle:"系列 A"}).node("bCard",{lane:"groupB",stack:0,kind:"card",title:"Group B",subtitle:"sum={groupB.sum} · avg={groupB.avg} · max={groupB.max}"}).node("bDetail",{lane:"groupB",stack:1,kind:"card",title:"B 5 element",subtitle:"系列 B"}).edge("aCard","bCard",{label:"A vs B diff",tone:"warning"}).readout.stackedBar("cmp",{sourceA:"groupA",sourceB:"groupB",min:0,max:80,colorA:"#2563eb",colorB:"#f97316",label:"A / B (side-by-side bar)"}).phase("p1",{duration:1800,title:"A だけ",body:"1 つ目の系列だけを見る。 2 系列を横に並べて比べる形の片方。"},e=>e.activate("aCard","aDetail").set("groupA","[40,55,30,65,45]").set("groupB","[0,0,0,0,0]")).phase("p2",{duration:1800,title:"B を並べる",body:"2 つ目の系列が隣に並ぶ。 同じ位置で 2 本の高さを比べられる。"},e=>e.activate("aCard","aDetail","bCard").set("groupB","[25,40,50,35,60]")).phase("p3",{duration:1800,title:"高さが入れ替わる",body:"2 つ目が 1 つ目を上回る位置が出てくる。 隣り合う 2 本の高低が逆になる。"},e=>e.activate("aCard","aDetail","bCard","bDetail").set("groupA","[30,35,25,40,30]").set("groupB","[45,60,70,55,80]")).build(),vn="2 arraySignal (A/B) を 2-lane (Group A blue / Group B orange) 分散 + comparison edge、 各 group 個別 card + stackedBar readout 併存",yn=t("interactive-radial-hub",{topic:"中心から放射状に 4 本が伸びる"}).lane("spokesTop",{x:-300,width:200}).lane("hub",{x:0,width:200}).lane("spokesBottom",{x:300,width:200}).node("hub",{lane:"hub",stack:0,kind:"card",title:"Hub",subtitle:"center · 4 spoke に fan-out"}).node("spoke-0",{lane:"spokesTop",stack:0,kind:"card",title:"#0",subtitle:"0°"}).node("spoke-1",{lane:"spokesTop",stack:1,kind:"card",title:"#1",subtitle:"90°"}).node("spoke-2",{lane:"spokesBottom",stack:0,kind:"card",title:"#2",subtitle:"180°"}).node("spoke-3",{lane:"spokesBottom",stack:1,kind:"card",title:"#3",subtitle:"270°"}).edge("hub","spoke-0",{label:"0°",tone:"info"}).edge("hub","spoke-1",{label:"90°",tone:"info"}).edge("hub","spoke-2",{label:"180°",tone:"info"}).edge("hub","spoke-3",{label:"270°",tone:"info"}).phase("p1",{duration:1600,title:"中心を置く",body:"真ん中の箱が起点。 ここから外へ伸びる。"},e=>e.activate("hub")).phase("p2",{duration:1600,title:"2 本伸ばす",body:"中心から 2 本が外へ伸びる。 向きが 2 方向に分かれる。"},e=>e.activate("hub","spoke-0","spoke-1")).phase("p3",{duration:1600,title:"4 本に広げる",body:"4 本すべてが放射状に広がる。 中心 1 つに対して外が 4 つ。"},e=>e.activate("hub","spoke-0","spoke-1","spoke-2","spoke-3")).build(),fn="hub-and-spoke を 3-lane (Spokes 上 / Hub center / Spokes 下) 分散、 4 spoke を上下 lane に振り分けて edge-node-cross を回避、 hub → 4 spoke edge の star topology",Cn=t("interactive-array-waterfall",{topic:"増減を滝グラフで正負に分けて見せる"}).lane("pos",{x:0,width:300}).lane("neg",{x:340,width:300}).arraySignal("changes",[100,-30,50,-20,40]).node("pos1",{lane:"pos",stack:0,kind:"card",title:"+100",subtitle:"初期上昇"}).node("pos2",{lane:"pos",stack:1,kind:"card",title:"+50",subtitle:"回復"}).node("pos3",{lane:"pos",stack:2,kind:"card",title:"+40",subtitle:"最終利益"}).node("neg1",{lane:"neg",stack:0,kind:"card",title:"-30",subtitle:"小損失"}).node("neg2",{lane:"neg",stack:1,kind:"card",title:"-20",subtitle:"追加損失"}).node("summary",{lane:"pos",stack:3,kind:"card",title:"Waterfall",subtitle:"final = sum = {changes.sum}"}).readout.waterfall("wf",{source:"changes",min:-30,max:150,viewW:280,viewH:90,colorPos:"#22c55e",colorNeg:"#ef4444",label:"Changes (waterfall)"}).readout.arrayList("items",{source:"changes",itemTemplate:"step {i}: {item}",label:"Steps"}).phase("p1",{duration:1800,title:"増える分",body:"正の増減だけを置く。 滝が右上がりに積み上がる。"},e=>e.activate("pos1","pos2").set("changes","[60,30,25]")).phase("p2",{duration:1800,title:"減る分が入る",body:"負の増減が混ざる。 積み上がった分から下がる段が現れ、途中の落ち込みが見える。"},e=>e.activate("pos1","pos2","neg1").set("changes","[100,-30,50,-20,40]")).phase("p3",{duration:1800,title:"収支が出る",body:"増減を通した合計が出る。 一覧と滝が同じ配列を見ている。"},e=>e.activate("pos1","pos2","pos3","neg1","neg2","summary").set("changes","[60,-20,40,-15,30]")).build(),xn="arraySignal waterfall 5 element を 2-lane (Positive changes / Negative changes) 分散、 各 element 個別 card、 waterfall readout 併存",Sn=t("interactive-render-offset",{structuredData:"exclude",topic:"固定点に対して浮遊点がずれて動く"}).lane("anchor",{x:0,width:240}).lane("floater",{x:300,width:300}).input.slider("dx",{min:-80,max:80,defaultValue:0,label:"Drift X"}).input.slider("dy",{min:-40,max:40,defaultValue:0,label:"Drift Y"}).state("dx",{initial:0}).state("dy",{initial:0}).node("anchor",{lane:"anchor",stack:0,kind:"card",title:"Anchor",subtitle:"固定位置、 signal bind なし"}).node("floater",{lane:"floater",stack:0,kind:"card",title:"Floater",subtitle:"dx={dx} · dy={dy}",renderOffsetX:"{dx}",renderOffsetY:"{dy}"}).phase("p1",{duration:1600,title:"基準を置く",body:"動かない点を先に置く。 ここが位置の基準になる。"},e=>e.activate("anchor")).phase("p2",{duration:1600,title:"ずれを見る",body:"もう 1 つの点が基準からずれて描かれる。 ずれ幅は縦横それぞれで決まる。"},e=>e.activate("anchor","floater")).phase("p3",{duration:1600,title:"つまみで動かす",body:"つまみで縦横のずれを変えられる。 基準は動かないので差が読み取れる。"},e=>e.activate("floater")).build(),Nn="renderOffset bind を 2-lane (Anchor fixed / Floater drift) 分散、 anchor は固定、 floater は renderOffset signal 追随",An=t("interactive-matrix-heatmap",{topic:"4×4 の混同行列を熱の色で見せる"}).lane("c0",{x:0,width:150}).lane("c1",{x:170,width:150}).lane("c2",{x:340,width:150}).lane("c3",{x:510,width:150}).arraySignal("cm",[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]).node("c0Diag",{lane:"c0",stack:0,kind:"card",title:"Class 0 ✓",subtitle:"上段の正解"}).node("c0Wrong",{lane:"c0",stack:1,kind:"card",title:"Class 0 ✕",subtitle:"上段の取り違え"}).node("c1Diag",{lane:"c1",stack:0,kind:"card",title:"Class 1 ✓",subtitle:"中上段の正解"}).node("c1Wrong",{lane:"c1",stack:1,kind:"card",title:"Class 1 ✕",subtitle:"中上段の取り違え"}).node("c2Diag",{lane:"c2",stack:0,kind:"card",title:"Class 2 ✓",subtitle:"中下段の正解"}).node("c2Wrong",{lane:"c2",stack:1,kind:"card",title:"Class 2 ✕",subtitle:"中下段の取り違え"}).node("c3Diag",{lane:"c3",stack:0,kind:"card",title:"Class 3 ✓",subtitle:"下段の正解"}).node("c3Wrong",{lane:"c3",stack:1,kind:"card",title:"Class 3 ✕",subtitle:"下段の取り違え"}).readout.matrix("m",{source:"cm",min:0,max:10,cellSize:30,showValue:!0,colors:["#f0f4f8","#0369a1"],label:"Predictions (4×4)"}).phase("p1",{duration:1800,title:"対角だけ",body:"正解した数だけを置く。 対角線に色が集まり、取り違えは 0。"},e=>e.activate("c0Diag","c1Diag").set("cm","[[9,0,0,0],[0,8,0,0],[0,0,9,0],[0,0,0,7]]")).phase("p2",{duration:1800,title:"誤りが混ざる",body:"取り違えた数が対角の外に現れる。 色が対角から散らばる。"},e=>e.activate("c0Diag","c0Wrong","c1Diag","c1Wrong").set("cm","[[8,1,0,1],[2,7,1,0],[0,1,9,0],[0,0,2,6]]")).phase("p3",{duration:1800,title:"偏りが出る",body:"特定の組合せに誤りが集中する。 濃い升目の位置で癖が読める。"},e=>e.activate("c0Diag","c0Wrong","c1Diag","c1Wrong","c2Diag","c2Wrong","c3Diag","c3Wrong").set("cm","[[6,3,0,1],[4,5,1,0],[0,1,8,1],[0,0,5,3]]")).build(),Pn="4×4 confusion matrix を 4-lane (class 0/1/2/3) 分散、 各 class の diagonal (correct) / off-diagonal (wrong) を個別 card 表示、 matrix readout 併存",Bn=t("interactive-progress-group",{topic:"4 件の進捗を達成 / 遅れで分けて見せる"}).lane("advanced",{x:0,width:240}).lane("behind",{x:300,width:240}).arraySignal("progress",[40,75,20,90]).arraySignal("names",["Design","Impl","Test","Docs"]).node("implNode",{lane:"advanced",stack:0,kind:"card",title:"Impl",subtitle:"{progress[1]}%"}).node("docsNode",{lane:"advanced",stack:1,kind:"card",title:"Docs",subtitle:"{progress[3]}%"}).node("designNode",{lane:"behind",stack:0,kind:"card",title:"Design",subtitle:"{progress[0]}%"}).node("testNode",{lane:"behind",stack:1,kind:"card",title:"Test",subtitle:"{progress[2]}%"}).readout.progressGroup("tasks",{source:"progress",max:100,labelSource:"names",color:"#2563eb",label:"Tasks (progressGroup)"}).phase("p1",{duration:1800,title:"着手前",body:"4 件とも進捗が低い。 帯がどれも短い。"},e=>e.activate("implNode").set("progress","[10,20,5,15]")).phase("p2",{duration:1800,title:"ばらつく",body:"先に進む項目と遅れる項目に分かれる。 帯の長さの差が開く。"},e=>e.activate("implNode","docsNode").set("progress","[40,75,20,90]")).phase("p3",{duration:1800,title:"追いつく",body:"遅れていた項目が追いつく。 4 本の帯が揃う。"},e=>e.activate("implNode","docsNode","designNode","testNode").set("progress","[85,95,80,100]")).build(),_n="4 task の progress を 2-lane (Advanced ≥50% / Behind <50%) に分散、 各 task 個別 card + progressGroup readout 併存",Dn=t("interactive-eip1559",{topic:"EIP-1559 の手数料が 3 ブロックで変わる"}).lane("col1",{x:0,width:370}).lane("col2",{x:410,width:300}).input.slider("baseFee",{min:10,max:200,defaultValue:50,label:"Base fee (gwei)"}).input.slider("priority",{min:1,max:30,defaultValue:5,label:"Priority tip"}).state("baseFee",{initial:50}).state("priority",{initial:5}).arraySignal("burned",[50,60,72]).arraySignal("tips",[5,8,10]).formula("total1","baseFee + priority").formula("total2","(baseFee + priority) * 12 / 10").formula("total3","(baseFee + priority) * 15 / 10").state("total1",{initial:55}).state("total2",{initial:66}).state("total3",{initial:82}).node("wallet",{lane:"col1",stack:0,kind:"card",w:320,title:"Wallet",subtitle:"base {baseFee} + tip {priority} gwei"}).node("b1",{lane:"col1",stack:1,kind:"card",w:240,title:"Block N",subtitle:"1.0x = {total1} gwei"}).node("b2",{lane:"col2",stack:0,kind:"card",w:250,title:"Block N+1",subtitle:"1.2x = {total2} gwei"}).node("b3",{lane:"col2",stack:1,kind:"card",w:250,title:"Block N+2",subtitle:"1.5x = {total3} gwei"}).edge("wallet","b1",{label:"tx submit",sub:"base + tip",tone:"info"}).edge("b1","b2",{label:"next block",sub:"+20% fee",tone:"warning"}).edge("b2","b3",{label:"next block",sub:"+25% fee",tone:"error"}).readout.stackedBar("gas",{sourceA:"burned",sourceB:"tips",min:0,max:120,colorA:"#ef4444",colorB:"#22c55e",label:"Burned / Tip per block"}).phase("p1",{duration:1800,title:"1 ブロック目",body:"基準手数料 50 / 優先手数料 5。 最初のブロックの内訳。"},e=>e.activate("wallet","b1").set("burned","[50,0,0]").set("tips","[5,0,0]")).phase("p2",{duration:1800,title:"2 ブロック目",body:"混雑して基準手数料が上がる。 焼却分が増え、優先分も上がる。"},e=>e.activate("wallet","b1","b2").set("burned","[50,60,0]").set("tips","[5,8,0]")).phase("p3",{duration:1800,title:"3 ブロック目",body:"さらに上がって 72 に届く。 3 ブロック分の推移が積み上げで並ぶ。"},e=>e.activate("wallet","b1","b2","b3").set("burned","[50,60,72]").set("tips","[5,8,10]")).build(),Tn="EIP-1559 gas cost model = 4 区画 (Sender / Block1 / Block2 / Block3) 2 列 2 段を edge で gas propagation、 base fee slider で 3 block の total が chain 追随",In=t("interactive-oauth-flow",{topic:"OAuth 認可コードの往復を追う"}).lane("user",{x:0,width:220}).lane("auth",{x:320,width:220}).lane("resource",{x:640,width:220}).input.slider("delay",{min:0,max:300,defaultValue:50,label:"Server delay (ms)"}).state("delay",{initial:50}).arraySignal("events",[[0,"click"],[100,"redirect"],[200,"consent"],[350,"code"],[500,"token"],[650,"resp"]]).node("client",{lane:"user",stack:0,kind:"card",title:"Browser",subtitle:"user agent"}).node("consent",{lane:"auth",stack:0,kind:"card",title:"Auth server",subtitle:"delay {delay}ms"}).node("api",{lane:"resource",stack:0,kind:"card",title:"Resource",subtitle:"API endpoint"}).edge("client","consent",{label:"1. redirect (with client_id)",tone:"info"}).edge("consent","client",{label:"2. consent screen (user approves)",tone:"info",side:"left"}).edge("client","consent",{id:"code-exchange",label:"3. code exchange (with code)",tone:"accent"}).edge("consent","client",{id:"token-issue",label:"4. token issued (access_token)",tone:"success",side:"left"}).edge("client","api",{label:"5. API call",sub:"Bearer token",tone:"accent"}).edge("api","client",{label:"6. resp",sub:"protected data",tone:"success",side:"bottom",labelOffsetY:120}).readout.sequenceTimeline("seq",{source:"events",min:0,max:700,viewW:400,viewH:60,color:"#2563eb",label:"Timeline"}).readout.stat("finalDelay",{source:"delay",unit:"ms",label:"Delay"}).phase("p1",{duration:1800,title:"認可を求める",body:"利用者が認可画面に進む。 やり取りの 1 つ目が記録される。"},e=>e.activate("client").set("events",'[[0,"認可要求"]]')).phase("p2",{duration:1800,title:"コードを受け取る",body:"認可コードが返る。 やり取りが 2 つに増える。"},e=>e.activate("client","consent").set("events",'[[0,"認可要求"],[120,"コード発行"]]')).phase("p3",{duration:1800,title:"引き換える",body:"コードを token に引き換えて資源まで届く。 6 回のやり取りが時刻付きで並ぶ。"},e=>e.activate("client","consent","api").set("events",'[[0,"認可要求"],[120,"コード発行"],[260,"token 交換"],[380,"token 発行"],[500,"資源要求"],[620,"資源応答"]]')).build(),Rn="OAuth 2.0 authorization code flow を 3-lane (User / Auth server / Resource server) + 6 event edge で node network 化、 latency は slider 追随",En=t("interactive-decision-tree",{topic:"3 段の決定木が 4 つの葉に分岐する"}).lane("root",{x:0,width:200}).lane("mid",{x:240,width:200}).lane("leaf",{x:480,width:240}).node("node-0",{lane:"root",stack:1,kind:"card",title:"L0P0",subtitle:"#0 (root)"}).node("node-1",{lane:"mid",stack:0,kind:"card",title:"L1P0",subtitle:"#1"}).node("node-2",{lane:"mid",stack:2,kind:"card",title:"L1P1",subtitle:"#2"}).node("node-3",{lane:"leaf",stack:0,kind:"card",title:"L2P0",subtitle:"#3"}).node("node-4",{lane:"leaf",stack:1,kind:"card",title:"L2P1",subtitle:"#4"}).node("node-5",{lane:"leaf",stack:2,kind:"card",title:"L2P2",subtitle:"#5"}).node("node-6",{lane:"leaf",stack:3,kind:"card",title:"L2P3",subtitle:"#6"}).edge("node-0","node-1",{label:"yes",tone:"success"}).edge("node-0","node-2",{label:"no",tone:"error"}).edge("node-1","node-3",{label:"yes",tone:"success"}).edge("node-1","node-4",{label:"no",tone:"error"}).edge("node-2","node-5",{label:"yes",tone:"success"}).edge("node-2","node-6",{label:"no",tone:"error"}).phase("p1",{duration:1600,title:"入口に立つ",body:"一番上の分かれ道から始まる。 まだどちらにも進んでいない。"},e=>e.activate("node-0")).phase("p2",{duration:1600,title:"1 段目で分かれる",body:"最初の判断で左右に分かれる。 2 つの道ができる。"},e=>e.activate("node-0","node-1","node-2")).phase("p3",{duration:1600,title:"左の枝が分かれる",body:"左側だけがもう一度分かれて 2 つの葉になる。 右側はまだ 1 本のまま。"},e=>e.activate("node-0","node-1","node-2","node-3","node-4")).phase("p4",{duration:1600,title:"右の枝も分かれる",body:"右側も分かれて 4 つの終点すべてに届く。 2 段の判断で 4 通りの結果になる。"},e=>e.activate("node-0","node-1","node-2","node-3","node-4","node-5","node-6")).build(),Mn="decision tree 3 level (2^2 = 4 leaf) を 3-lane (Root / Mid / Leaf) tree depth 別分散、 stack を parent-child alignment で edge-node-cross 回避、 6 edge で 2 分木構造明示",Ln=t("interactive-skill-radar",{topic:"5 技能を強 / 中 / 弱に分けて見せる"}).lane("strong",{x:0,width:220}).lane("middle",{x:260,width:220}).lane("weak",{x:520,width:220}).arraySignal("skills",[8,5,7,3,9]).arraySignal("skillNames",["Design","Impl","Test","Docs","Debug"]).node("designNode",{lane:"strong",stack:0,kind:"card",title:"Design",subtitle:"{skills[0]}/10"}).node("testNode",{lane:"strong",stack:1,kind:"card",title:"Test",subtitle:"{skills[2]}/10"}).node("debugNode",{lane:"strong",stack:2,kind:"card",title:"Debug",subtitle:"{skills[4]}/10"}).node("implNode",{lane:"middle",stack:0,kind:"card",title:"Impl",subtitle:"{skills[1]}/10"}).node("docsNode",{lane:"weak",stack:0,kind:"card",title:"Docs",subtitle:"{skills[3]}/10"}).readout.radar("radar",{source:"skills",max:10,labelSource:"skillNames",color:"#2563eb",viewW:200,viewH:200,label:"Skills (polygon spider)"}).phase("p1",{duration:1800,title:"偏った形",body:"1 つの技能だけが高い。 図形が一方向に伸びる。"},e=>e.activate("designNode").set("skills","[9,2,3,2,3]")).phase("p2",{duration:1800,title:"広がる",body:"他の技能も伸びて図形が広がる。 尖りが目立たなくなる。"},e=>e.activate("designNode","testNode","debugNode").set("skills","[8,5,7,3,9]")).phase("p3",{duration:1800,title:"形が整う",body:"5 技能が近い値になり、図形が正多角形に近づく。"},e=>e.activate("designNode","testNode","debugNode","implNode","docsNode").set("skills","[7,7,8,6,8]")).build(),On="5 skill を 3-lane (Strong ≥7 / Middle 5-6 / Weak <5) レベル別分散、 各 skill 個別 card + radar readout 併存",Fn=t("interactive-perf-bubble",{topic:"5 種の処理の負荷を大きさで比べる"}).lane("high",{x:0,width:300}).lane("low",{x:340,width:300}).arraySignal("perf",[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]).node("w2",{lane:"high",stack:0,kind:"card",title:"Workload B",subtitle:"中央寄りの処理"}).node("w3",{lane:"high",stack:1,kind:"card",title:"Workload C",subtitle:"右上に位置する処理"}).node("w5",{lane:"high",stack:2,kind:"card",title:"Workload E",subtitle:"左上に位置する処理"}).node("w1",{lane:"low",stack:0,kind:"card",title:"Workload A",subtitle:"左下に位置する処理"}).node("w4",{lane:"low",stack:1,kind:"card",title:"Workload D",subtitle:"右寄りの処理"}).readout.bubbleChart("bubbles",{source:"perf",xMin:0,xMax:100,yMin:0,yMax:100,rMin:0,rMax:10,color:"#2563eb",viewW:280,viewH:180,label:"workloads (3D bubble)"}).phase("p1",{duration:1800,title:"軽い処理",body:"負荷の小さい処理だけを置く。 円が小さくまとまる。"},e=>e.activate("w2").set("perf","[[50,20,3],[70,40,4],[90,60,3]]")).phase("p2",{duration:1800,title:"重い処理が入る",body:"負荷の大きい処理が加わる。 円の大小差が開く。"},e=>e.activate("w2","w3","w5").set("perf","[[50,20,5],[70,40,8],[90,60,10],[30,80,3],[60,50,7]]")).phase("p3",{duration:1800,title:"偏りが出る",body:"右上に大きな円が集まる。 位置と大きさの両方で傾向が読める。"},e=>e.activate("w2","w3","w5","w1","w4").set("perf","[[50,20,4],[70,40,9],[90,60,10],[30,80,3],[85,70,8]]")).build(),Hn="5 workload を 2-lane (High usage ≥7 / Low usage <7) usage size 別分散、 各 workload 個別 card + bubbleChart readout 併存",Wn=t("interactive-portfolio-donut",{topic:"資産 4 種を伝統 / 代替に分けて見せる"}).lane("traditional",{x:0,width:300}).lane("alternative",{x:340,width:300}).arraySignal("assets",[45,30,15,10]).arraySignal("assetNames",["Stocks","Bonds","Cash","Crypto"]).node("stocksNode",{lane:"traditional",stack:0,kind:"card",title:"Stocks",subtitle:"{assets[0]}%"}).node("bondsNode",{lane:"traditional",stack:1,kind:"card",title:"Bonds",subtitle:"{assets[1]}%"}).node("cashNode",{lane:"alternative",stack:0,kind:"card",title:"Cash",subtitle:"{assets[2]}%"}).node("cryptoNode",{lane:"alternative",stack:1,kind:"card",title:"Crypto",subtitle:"{assets[3]}%"}).node("totalNode",{lane:"traditional",stack:2,kind:"card",title:"Portfolio",subtitle:"合計 {assets.sum}% · 最大 {assets.max}%"}).readout.donut("d",{source:"assets",innerRatio:.55,viewW:160,viewH:160,label:"Allocation (donut)"}).readout.arrayList("legend",{source:"assetNames",itemTemplate:"● {item}",label:"Legend"}).phase("p1",{duration:1800,title:"株式に寄る",body:"株式の比重が大きい配分。 円の 1 区画が広い。"},e=>e.activate("stocksNode").set("assets","[60,20,15,5]").set("assetNames",'["Stocks","Bonds","Cash","Crypto"]')).phase("p2",{duration:1800,title:"債券を増やす",body:"債券に振り替える。 円の区画の比率が変わり、各箱の数字も追いかける。"},e=>e.activate("stocksNode","bondsNode").set("assets","[45,30,15,10]").set("assetNames",'["Stocks","Bonds","Crypto","Cash"]')).phase("p3",{duration:1800,title:"分散する",body:"4 種に近い比率で分散する。 区画の差が小さくなる。"},e=>e.activate("stocksNode","bondsNode","cashNode","cryptoNode","totalNode").set("assets","[30,28,22,20]").set("assetNames",'["Stocks","Bonds","Cash","Crypto"]')).build(),qn="portfolio 4 asset を 2-lane (Traditional Stocks+Bonds / Alternative Cash+Crypto) 分散、 各 asset 個別 card、 donut readout 併存",Gn=t("interactive-kpi-dashboard",{topic:"SaaS の主要指標 4 つを 1 画面に並べる"}).lane("revenue",{x:0,width:200}).lane("users",{x:260,width:200}).lane("churn",{x:520,width:200}).lane("nps",{x:780,width:200}).input.slider("revenueInput",{min:10,max:500,defaultValue:120,label:"Revenue (k)"}).state("revenueInput",{initial:120}).formula("users","revenueInput * 8").formula("churn","50 - revenueInput / 10").formula("nps","revenueInput / 2 + 20").state("users",{initial:960}).state("churn",{initial:38}).state("nps",{initial:80}).node("revCard",{lane:"revenue",stack:0,kind:"card",title:"Revenue",subtitle:"${revenueInput}k / month"}).node("usersCard",{lane:"users",stack:0,kind:"card",title:"Users",subtitle:"{users} active"}).node("churnCard",{lane:"churn",stack:0,kind:"card",title:"Churn",subtitle:"{churn}% / month"}).node("npsCard",{lane:"nps",stack:0,kind:"card",title:"NPS",subtitle:"{nps} score"}).edge("revCard","usersCard",{label:"×8",sub:"acquisition",tone:"info"}).edge("revCard","churnCard",{label:"inverse",sub:"50 − rev/10",tone:"error"}).edge("revCard","npsCard",{label:"correlate",sub:"rev/2 + 20",tone:"success",side:"bottom"}).readout.stat("rev",{source:"revenueInput",unit:"k",label:"Revenue"}).readout.stat("usr",{source:"users",label:"Users"}).readout.gauge("chr",{source:"churn",min:0,max:60,color:"#ef4444",label:"Churn %"}).readout.percentRing("np",{source:"nps",max:100,color:"#22c55e",label:"NPS"}).phase("p1",{duration:1800,title:"利用者を見る",body:"売上のつまみから計算式で利用者数を導く。 4 指標のうち 1 つ目。"},e=>e.activate("usersCard")).phase("p2",{duration:1800,title:"解約率も導く",body:"同じ元の値から解約率を導く。 売上を動かすと 2 つが同時に変わる。"},e=>e.activate("usersCard","churnCard")).phase("p3",{duration:1800,title:"4 指標が揃う",body:"推奨度まで並ぶ。 つまみが持つ 1 指標と、そこから導く 3 指標の組になっている。"},e=>e.activate("revCard","usersCard","churnCard","npsCard")).build(),Vn="SaaS KPI dashboard = 4-lane (Revenue / Users / Churn / NPS) node grid + revenue → users/churn/nps に因果関係 edge、 formula chain で 3 KPI が chain 追随",Un=t("interactive-ab-test",{topic:"A/B テストの振り分けと結果を見せる"}).lane("varA",{x:0,width:300}).lane("split",{x:360,width:250}).lane("varB",{x:670,width:300}).arraySignal("convA",[40,45,42,48,44]).arraySignal("convB",[50,55,58,62,60]).arraySignal("splitData",[50,50]).arraySignal("results",[58,42]).node("controlCard",{lane:"varA",stack:0,kind:"card",w:250,title:"Variant A",subtitle:"avg {convA.avg}%"}).node("splitCard",{lane:"split",stack:0,kind:"card",w:200,title:"Split",subtitle:"振り分け {splitData[0]} / {splitData[1]}"}).node("treatmentCard",{lane:"varB",stack:0,kind:"card",w:250,title:"Variant B",subtitle:"avg {convB.avg}%"}).edge("splitCard","controlCard",{label:"50%",sub:"control",tone:"info",side:"left"}).edge("splitCard","treatmentCard",{label:"50%",sub:"treatment",tone:"success"}).readout.stackedBar("conv",{sourceA:"convA",sourceB:"convB",min:30,max:70,colorA:"#a08870",colorB:"#22c55e",label:"Daily conv % (A vs B)"}).readout.donut("splitDonut",{source:"splitData",innerRatio:.5,viewW:120,viewH:120,label:"Traffic split"}).readout.donut("winner",{source:"results",innerRatio:.6,viewW:120,viewH:120,colors:["#22c55e","#a08870"],label:"Winner share (B=green)"}).phase("p1",{duration:1800,title:"振り分け",body:"利用者を半々に分ける。 振り分けの円が 2 等分になる。"},e=>e.activate("controlCard","splitCard").set("splitData","[50,50]").set("results","[50,50]").set("convA","[48,50,49,51,50]").set("convB","[49,50,51,50,52]")).phase("p2",{duration:1800,title:"差が出る",body:"試験群に多く振り分けて成績を見る。 振り分けの円と結果の円が別々に動く。"},e=>e.activate("controlCard","splitCard","treatmentCard").set("splitData","[60,40]").set("results","[55,45]").set("convA","[48,49,50,48,49]").set("convB","[52,55,57,56,58]")).phase("p3",{duration:1800,title:"差が確定する",body:"振り分けを半々に戻しても差が残る。 振り分けと結果を分けて見られる。"},e=>e.activate("splitCard","treatmentCard").set("splitData","[50,50]").set("results","[62,38]").set("convA","[47,48,49,47,48]").set("convB","[58,61,63,62,65]")).build(),Qn="A/B test を 3-lane (Variant A / Split / Variant B) + Split → A,B edge で experiment 構造を node network 化";function jn(){const e=[];for(let n=0;n<371;n++){const s=n%7,b=(n*31+s*17)%13;e.push(s===0||s===6?Math.max(0,b-4):Math.min(10,b))}return e}const Jn=t("interactive-contribution-heatmap",{topic:"30 日の活動量を升目の濃さで見せる"}).lane("q1",{x:0,width:160}).lane("q2",{x:180,width:160}).lane("q3",{x:360,width:160}).lane("q4",{x:540,width:160}).arraySignal("commits",jn()).node("q1Card",{lane:"q1",stack:0,kind:"card",title:"Q1 (Jan-Mar)",subtitle:"静かな期間"}).node("q2Card",{lane:"q2",stack:0,kind:"card",title:"Q2 (Apr-Jun)",subtitle:"活発な期間"}).node("q3Card",{lane:"q3",stack:0,kind:"card",title:"Q3 (Jul-Sep)",subtitle:"落ち着く期間"}).node("q4Card",{lane:"q4",stack:0,kind:"card",title:"Q4 (Oct-Dec)",subtitle:"全体の推移"}).node("totalCard",{lane:"q4",stack:1,kind:"card",title:"Year total",subtitle:"sum {commits.sum} · max {commits.max} · avg {commits.avg}"}).readout.calendarHeatmap("h",{source:"commits",max:10,cellSize:10,cellGap:2,label:"1 year (53 週 × 7 日)"}).phase("p1",{duration:1800,title:"静かな期間",body:"書き込みが少ない期間。 濃い升目がまばら。"},e=>e.activate("q1Card").set("commits","[0,1,0,2,1,0,0,1,2,0,1,0,0,2,1,0,1,0,2,0,1,0,0,1,2,0,1,0,0,2]")).phase("p2",{duration:1800,title:"活発になる",body:"書き込みが増えて濃い升目が続く。 帯のように連なる。"},e=>e.activate("q1Card","q2Card").set("commits","[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,10,6,2,10,3,0,10,6,2,10,7,0,6,6]")).phase("p3",{duration:1800,title:"落ち着く",body:"終盤で書き込みが減る。 濃淡の移り変わりで期間の性格が読める。"},e=>e.activate("q1Card","q2Card","q3Card","q4Card","totalCard").set("commits","[0,9,5,1,10,6,0,5,5,1,10,6,2,7,1,1,4,2,1,3,1,0,2,1,0,1,2,0,1,0]")).build(),Yn="365 day contribution を 4-lane (Q1/Q2/Q3/Q4 quarter) 分散、 各 quarter summary card + total/max、 calendarHeatmap readout 併存",zn=t("interactive-canvas-minimap",{topic:"全体図の中で今見ている範囲を示す"}).lane("xpan",{x:0,width:200}).lane("ypan",{x:240,width:200}).lane("map",{x:480,width:260}).input.slider("panX",{min:0,max:600,defaultValue:300,label:"Pan X"}).input.slider("panY",{min:0,max:500,defaultValue:250,label:"Pan Y"}).state("panX",{initial:300}).state("panY",{initial:250}).arraySignal("viewport",[300,250,400,300]).node("xNode",{lane:"xpan",stack:0,kind:"card",title:"Pan X",subtitle:"panX = {panX}px (0-600)"}).node("yNode",{lane:"ypan",stack:0,kind:"card",title:"Pan Y",subtitle:"panY = {panY}px (0-500)"}).node("mapNode",{lane:"map",stack:0,kind:"card",title:"Mini-map",subtitle:"pan ({panX}, {panY}) view 400×300"}).readout.miniMap("map",{source:"viewport",canvasW:1e3,canvasH:800,viewW:200,viewH:160,color:"#2563eb",label:"Overview (mini-map)"}).readout.stat("panXStat",{source:"panX",unit:"px",label:"X stat"}).readout.stat("panYStat",{source:"panY",unit:"px",label:"Y stat"}).phase("p1",{duration:1800,title:"左上を見る",body:"全体図の左上を見ている状態。 小窓の枠が左上にある。"},e=>e.activate("xNode").set("viewport","[0,0,400,300]")).phase("p2",{duration:1800,title:"右へ移る",body:"見ている範囲が右へ移る。 小窓の枠も追いかける。"},e=>e.activate("xNode","yNode").set("viewport","[500,0,400,300]")).phase("p3",{duration:1800,title:"下へ移る",body:"さらに下へ移る。 全体の中で今どこを見ているかが枠で分かる。"},e=>e.activate("xNode","yNode","mapNode").set("viewport","[500,400,400,300]")).build(),$n="canvas mini-map を 3-lane (X pan / Y pan / Mini-map viewport) 分散、 axis 別 control + viewport 集約、 miniMap readout 併存",Kn=t("interactive-revenue-kpi",{topic:"前期と今期の売上を推移付きで比べる"}).lane("col1",{x:0,width:370}).lane("col2",{x:410,width:350}).input.slider("current",{min:50,max:300,defaultValue:180,label:"Current revenue (k)"}).state("current",{initial:180}).state("prev",{initial:150}).arraySignal("history",[120,135,148,152,165,170]).node("prevNode",{lane:"col1",stack:0,kind:"card",w:220,title:"Previous",subtitle:"{prev}k (baseline)"}).node("currNode",{lane:"col2",stack:0,kind:"card",w:300,title:"◆ Current",subtitle:"{current}k (slider driven)"}).node("trendNode",{lane:"col1",stack:1,kind:"card",w:320,title:"Trend",subtitle:"6 month sparkline (120-170k)"}).edge("prevNode","currNode",{label:"delta = current - prev",tone:"success"}).edge("currNode","trendNode",{label:"sparkline last",tone:"info"}).readout.kpiCard("kpi",{source:"current",historySource:"history",comparisonSource:"prev",unit:"k",colorPos:"#22c55e",colorNeg:"#ef4444",label:"Revenue KPI (composite)"}).readout.stat("prevStat",{source:"prev",unit:"k",label:"Prev stat"}).phase("p1",{duration:1800,title:"前期を見る",body:"比べる相手になる前期の値。 これは固定で動かない。"},e=>e.activate("prevNode")).phase("p2",{duration:1800,title:"今期を見る",body:"今期の値はつまみで動く。 前期との差がその場で出る。"},e=>e.activate("prevNode","currNode")).phase("p3",{duration:1800,title:"推移で読む",body:"推移の表示が上下の向きを形で出す。 数字と形の 2 通りで読める。"},e=>e.activate("prevNode","currNode","trendNode")).build(),Xn="revenue KPI を 3 区画 (Previous / Current / Trend) 2 列 2 段に分散 + prev→current delta edge、 kpiCard readout 併存",Zn=t("interactive-price-candlestick",{topic:"8 日分の値動きを陽線 / 陰線で見せる"}).lane("up",{x:0,width:320}).lane("down",{x:360,width:320}).arraySignal("ohlc",[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109],[109,113,106,112],[112,118,111,116],[116,120,113,118]]).node("d1",{lane:"up",stack:0,kind:"card",title:"Day 1 ▲",subtitle:"O=100 · C=105 (+5)"}).node("d3",{lane:"up",stack:1,kind:"card",title:"Day 3 ▲",subtitle:"O=102 · C=104 (+2)"}).node("d4",{lane:"up",stack:2,kind:"card",title:"Day 4 ▲",subtitle:"O=104 · C=111 (+7)"}).node("d6",{lane:"up",stack:3,kind:"card",title:"Day 6 ▲",subtitle:"O=109 · C=112 (+3)"}).node("d7",{lane:"up",stack:4,kind:"card",title:"Day 7 ▲",subtitle:"O=112 · C=116 (+4)"}).node("d8",{lane:"up",stack:5,kind:"card",title:"Day 8 ▲",subtitle:"O=116 · C=118 (+2)"}).node("d2",{lane:"down",stack:0,kind:"card",title:"Day 2 ▼",subtitle:"O=105 · C=102 (-3)"}).node("d5",{lane:"down",stack:1,kind:"card",title:"Day 5 ▼",subtitle:"O=111 · C=109 (-2)"}).readout.candlestick("chart",{source:"ohlc",min:95,max:122,viewW:300,viewH:110,colorUp:"#22c55e",colorDown:"#ef4444",label:"OHLC (candlestick)"}).phase("p1",{duration:1800,title:"横ばい",body:"始値と終値が近い日が続く。 実体の短い足が並ぶ。"},e=>e.activate("d1","d2").set("ohlc","[[100,102,99,101],[101,103,100,100],[100,102,98,101],[101,102,100,101]]")).phase("p2",{duration:1800,title:"上がる",body:"陽線と陰線を交えながら、全体として右上がりに進む。 足は横に並ぶ。"},e=>e.activate("d1","d2","d3","d4").set("ohlc","[[100,108,96,105],[105,110,100,102],[102,106,98,104],[104,112,103,111],[111,115,108,109]]")).phase("p3",{duration:1800,title:"振れる",body:"上下の幅が大きい日が混ざる。 ヒゲの長さで振れ幅が読める。"},e=>e.activate("d1","d2","d3","d4","d5","d6","d7","d8").set("ohlc","[[100,108,96,105],[105,118,95,102],[102,106,97,104],[104,120,103,111],[111,115,98,109],[109,121,106,112],[112,118,101,116],[116,122,113,118]]")).build(),el="OHLC 8 day を 2-lane (Up days close≥open / Down days close<open) 分散、 各 day 個別 card + candlestick readout 併存",tl=t("interactive-user-venn",{topic:"2 つの集合の重なりを 3 領域で見せる"}).lane("usersOnly",{x:0,width:220}).lane("both",{x:260,width:200}).lane("payersOnly",{x:500,width:200}).arraySignal("sets",[100,40,25]).node("usersOnlyNode",{lane:"usersOnly",stack:0,kind:"card",title:"Users total",subtitle:"A 全体 {sets[0]} · 共通 {sets[2]}"}).node("bothNode",{lane:"both",stack:0,kind:"card",title:"Both (A ∩ B)",subtitle:"共通 = {sets[2]}"}).node("payersOnlyNode",{lane:"payersOnly",stack:0,kind:"card",title:"Payers total",subtitle:"B 全体 = {sets[1]}"}).node("totalNode",{lane:"both",stack:1,kind:"card",title:"Universe",subtitle:"A={sets[0]} · B={sets[1]}"}).readout.venn("v",{source:"sets",viewW:220,viewH:140,colorA:"#2563eb",colorB:"#f97316",labelA:"Users",labelB:"Payers",label:"Overlap (2-set Venn)"}).phase("p1",{duration:1800,title:"重なりなし",body:"2 つの集まりが離れている。 共通する人が居ない。"},e=>e.activate("usersOnlyNode").set("sets","[100,40,0]")).phase("p2",{duration:1800,title:"重なる",body:"共通する人が現れて 2 つの円が重なる。"},e=>e.activate("usersOnlyNode","bothNode").set("sets","[100,40,25]")).phase("p3",{duration:1800,title:"大きく重なる",body:"共通部分が広がる。 重なりの面積で関係の強さが読める。"},e=>e.activate("usersOnlyNode","bothNode","payersOnlyNode","totalNode").set("sets","[100,60,45]")).build(),al="2 set Venn を 3-lane (Users only / Both / Payers only) 領域別分散、 各 region 個別 card、 venn readout 併存",il=t("interactive-score-slope",{topic:"5 人の点数変化を上昇 / 下降で分ける"}).lane("up",{x:0,width:300}).lane("down",{x:340,width:300}).arraySignal("scores",[[65,82,"Alice"],[70,68,"Bob"],[55,78,"Carol"],[80,88,"Dan"],[60,55,"Eve"]]).node("aliceNode",{lane:"up",stack:0,kind:"card",title:"Alice ↑",subtitle:"1 人目"}).node("carolNode",{lane:"up",stack:1,kind:"card",title:"Carol ↑",subtitle:"3 人目"}).node("danNode",{lane:"up",stack:2,kind:"card",title:"Dan ↑",subtitle:"4 人目"}).node("bobNode",{lane:"down",stack:0,kind:"card",title:"Bob ↓",subtitle:"2 人目"}).node("eveNode",{lane:"down",stack:1,kind:"card",title:"Eve ↓",subtitle:"5 人目"}).readout.slope("s",{source:"scores",min:40,max:100,viewW:260,viewH:160,colorUp:"#22c55e",colorDown:"#ef4444",label:"Score change (slope)"}).phase("p1",{duration:1800,title:"横並び",body:"前後で点数が変わらない状態。 線が水平に並ぶ。"},e=>e.activate("aliceNode").set("scores",'[[65,65,"Alice"],[70,70,"Bob"],[55,55,"Carol"]]')).phase("p2",{duration:1800,title:"差が出る",body:"伸びる人と落ちる人に分かれる。 線の傾きが逆を向く。"},e=>e.activate("aliceNode","carolNode","danNode").set("scores",'[[65,82,"Alice"],[70,68,"Bob"],[55,78,"Carol"],[80,88,"Dan"],[60,55,"Eve"]]')).phase("p3",{duration:1800,title:"順位が入れ替わる",body:"前は下位だった人が上位に来る。 線の交差で入れ替わりが見える。"},e=>e.activate("aliceNode","carolNode","danNode","bobNode","eveNode").set("scores",'[[65,72,"Alice"],[70,60,"Bob"],[55,90,"Carol"],[80,75,"Dan"],[60,85,"Eve"]]')).build(),ol="5 student score change を 2-lane (Improved up ↑ / Declined down ↓) 分散、 各 student 個別 card、 slope readout 併存",nl=t("interactive-sales-funnel",{topic:"訪問から購入までの絞り込みを追う"}).lane("col1",{x:0,width:220}).lane("col2",{x:260,width:270}).arraySignal("stages",[["Visit",1e3],["Signup",400],["Trial",150],["Paid",40]]).node("visitNode",{lane:"col1",stack:0,kind:"card",w:160,title:"Visit",subtitle:"漏斗の入口"}).node("signupNode",{lane:"col2",stack:0,kind:"card",w:180,title:"Signup",subtitle:"登録に進む段"}).node("trialNode",{lane:"col1",stack:1,kind:"card",w:170,title:"Trial",subtitle:"試用に進む段"}).node("paidNode",{lane:"col2",stack:1,kind:"card",w:220,title:"Paid",subtitle:"購入に至る段"}).edge("visitNode","signupNode",{label:"登録へ",tone:"info"}).edge("signupNode","trialNode",{label:"試用へ",tone:"warning"}).edge("trialNode","paidNode",{label:"購入へ",tone:"error"}).readout.funnel("f",{source:"stages",viewW:280,viewH:200,colorTop:"#2563eb",colorBottom:"#a08870",label:"Conversion (trapezoid)"}).phase("p1",{duration:1800,title:"入口だけ",body:"訪問だけがある状態。 漏斗の一番上が広い。"},e=>e.activate("visitNode").set("stages",'[["Visit",1000],["Signup",0],["Trial",0],["Paid",0]]')).phase("p2",{duration:1800,title:"絞られる",body:"登録と試用に進む人が現れる。 段ごとに幅が細くなる。"},e=>e.activate("visitNode","signupNode","trialNode").set("stages",'[["Visit",1000],["Signup",400],["Trial",150],["Paid",40]]')).phase("p3",{duration:1800,title:"歩留まりが上がる",body:"各段の残る割合が改善する。 漏斗の細まり方が緩くなる。"},e=>e.activate("visitNode","signupNode","trialNode","paidNode").set("stages",'[["Visit",1000],["Signup",620],["Trial",340],["Paid",130]]')).build(),ll="sales funnel 4 stage を 2 列 2 段の pipeline + 3 drop-off edge、 Visit → Signup → Trial → Paid の conversion 遷移 network 化",sl=t("interactive-project-gantt",{topic:"4 工程の期間を横棒で並べる"}).lane("col1",{x:0,width:370}).lane("col2",{x:410,width:330}).arraySignal("tasks",[["Design",0,3],["Impl",3,5],["Test",6,3],["Ship",9,1]]).node("designNode",{lane:"col1",stack:0,kind:"card",w:200,title:"Design",subtitle:"day 0-3 (3 day)"}).node("implNode",{lane:"col2",stack:0,kind:"card",w:280,title:"Impl",subtitle:"day 3-8 (5 day, largest)"}).node("testNode",{lane:"col1",stack:1,kind:"card",w:320,title:"Test",subtitle:"day 6-9 (3 day, overlap w/ impl)"}).node("shipNode",{lane:"col2",stack:1,kind:"card",w:210,title:"Ship",subtitle:"day 9-10 (1 day)"}).edge("designNode","implNode",{label:"handover",tone:"info"}).edge("implNode","testNode",{label:"test start",tone:"accent"}).edge("testNode","shipNode",{label:"release",tone:"success"}).readout.gantt("g",{source:"tasks",min:0,max:10,viewW:320,viewH:140,color:"#2563eb",label:"Timeline (gantt)"}).phase("p1",{duration:1800,title:"設計だけ",body:"最初の作業だけが置かれた状態。 帯が 1 本。"},e=>e.activate("designNode").set("tasks",'[["Design",0,3]]')).phase("p2",{duration:1800,title:"連なる",body:"前の作業を追うように次が始まる。 一部が重なりながら帯が階段状に並ぶ。"},e=>e.activate("designNode","implNode","testNode").set("tasks",'[["Design",0,3],["Impl",3,5],["Test",6,3]]')).phase("p3",{duration:1800,title:"重なる",body:"作業が並行して重なる期間が出る。 帯の重なりで山場が読める。"},e=>e.activate("designNode","implNode","testNode","shipNode").set("tasks",'[["Design",0,3],["Impl",2,6],["Test",6,4],["Ship",9,1]]')).build(),rl="project 4 task を 4 区画 (Design / Impl / Test / Ship) 2 列 2 段で task 別分散 + 3 handover edge、 gantt readout 併存",dl=t("interactive-resource-treemap",{topic:"6 チームの予算を面積で比べる"}).lane("major",{x:0,width:220}).lane("mid",{x:260,width:200}).lane("minor",{x:500,width:200}).arraySignal("teams",[["Engineering",45],["Sales",20],["Marketing",15],["Support",10],["Ops",6],["Legal",4]]).node("engNode",{lane:"major",stack:0,kind:"card",title:"Engineering",subtitle:"最も大きい区画"}).node("salesNode",{lane:"major",stack:1,kind:"card",title:"Sales",subtitle:"2 番目に大きい"}).node("mktNode",{lane:"major",stack:2,kind:"card",title:"Marketing",subtitle:"中位の区画"}).node("supportNode",{lane:"mid",stack:0,kind:"card",title:"Support",subtitle:"小さめの区画"}).node("opsNode",{lane:"mid",stack:1,kind:"card",title:"Ops",subtitle:"小さい区画"}).node("legalNode",{lane:"minor",stack:0,kind:"card",title:"Legal",subtitle:"最も小さい区画"}).readout.treemap("t",{source:"teams",viewW:280,viewH:200,label:"Budget (treemap)"}).phase("p1",{duration:1800,title:"均等に分ける",body:"6 つをほぼ同じ配分にする。 区画の大きさが揃い、大小の順は保ったまま差が小さくなる。"},e=>e.activate("engNode").set("teams",'[["Engineering",19],["Sales",18],["Marketing",17],["Support",16],["Ops",15],["Legal",14]]')).phase("p2",{duration:1800,title:"1 つに寄る",body:"1 つに配分が寄る。 大きな区画が場所を占める。"},e=>e.activate("engNode","salesNode","mktNode").set("teams",'[["Engineering",45],["Sales",20],["Marketing",15],["Support",10],["Ops",6],["Legal",4]]')).phase("p3",{duration:1800,title:"分け直す",body:"配分を組み替える。 区画の大小と位置が同時に変わる。"},e=>e.activate("engNode","salesNode","mktNode","supportNode","opsNode","legalNode").set("teams",'[["Engineering",30],["Sales",28],["Marketing",18],["Support",12],["Ops",8],["Legal",4]]')).build(),cl="6 team budget を 3-lane (Major ≥15% / Mid 5-14% / Minor <5%) size 別分散、 各 team 個別 card、 treemap readout 併存",ul=t("interactive-traffic-sankey",{topic:"流入 3 経路が 1 つの成果に合流する"}).lane("src",{x:0,width:180}).lane("land",{x:260,width:180}).lane("cv",{x:520,width:180}).arraySignal("flows",[["Search","Home",40],["Search","Product",30],["Social","Home",25],["Social","Product",15],["Direct","Home",20],["Direct","Product",10]]).node("search",{lane:"src",stack:0,kind:"card",title:"Search",subtitle:"検索からの流入"}).node("social",{lane:"src",stack:1,kind:"card",title:"Social",subtitle:"SNS からの流入"}).node("direct",{lane:"src",stack:2,kind:"card",title:"Direct",subtitle:"直接の流入"}).node("home",{lane:"land",stack:0,kind:"card",title:"Home",subtitle:"入口ページ"}).node("product",{lane:"land",stack:1,kind:"card",title:"Product",subtitle:"商品ページ"}).node("checkout",{lane:"cv",stack:0,kind:"card",title:"Checkout",subtitle:"成果ページ"}).edge("search","home",{label:"40",tone:"success"}).edge("search","product",{label:"30",tone:"success",labelOffsetX:90}).edge("social","home",{label:"25",tone:"info"}).edge("social","product",{label:"15",tone:"info"}).edge("direct","home",{label:"20",tone:"accent"}).edge("direct","product",{label:"10",tone:"accent"}).edge("home","checkout",{label:"85",tone:"warning"}).edge("product","checkout",{label:"55",tone:"warning"}).readout.sankey("s",{source:"flows",viewW:340,viewH:220,label:"Sources → Pages (sankey)"}).phase("p1",{duration:1800,title:"1 経路",body:"1 つの流入元から 1 つの行き先へ。 帯が 1 本通る。"},e=>e.activate("search","home").set("flows",'[["Search","Home",40]]')).phase("p2",{duration:1800,title:"枝分かれ",body:"流入元が増え、行き先も分かれる。 帯が交差する。"},e=>e.activate("search","social","home","product").set("flows",'[["Search","Home",40],["Search","Product",30],["Social","Home",25],["Social","Product",15]]')).phase("p3",{duration:1800,title:"流入元が増える",body:"3 つ目の流入元が加わる。 帯の太さで流入量の差が読める。"},e=>e.activate("search","social","direct","home","product","checkout").set("flows",'[["Search","Home",40],["Search","Product",30],["Social","Home",25],["Social","Product",15],["Direct","Home",20],["Direct","Product",10]]')).build(),pl="traffic source (3) → landing (2) → conversion (1) の 3-lane funnel を node network + edge で明示、 sankey readout 併存",bl=t("interactive-activity-polar",{topic:"1 週間の活動を平日 / 週末に分ける"}).lane("weekday",{x:0,width:300}).lane("weekend",{x:380,width:220}).arraySignal("hours",[3,5,8,6,7,4,2]).arraySignal("days",["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]).node("monNode",{lane:"weekday",stack:0,kind:"card",title:"Mon",subtitle:"{hours[0]}h"}).node("tueNode",{lane:"weekday",stack:1,kind:"card",title:"Tue",subtitle:"{hours[1]}h"}).node("wedNode",{lane:"weekday",stack:2,kind:"card",title:"Wed",subtitle:"{hours[2]}h"}).node("thuNode",{lane:"weekday",stack:3,kind:"card",title:"Thu",subtitle:"{hours[3]}h"}).node("friNode",{lane:"weekday",stack:4,kind:"card",title:"Fri",subtitle:"{hours[4]}h"}).node("satNode",{lane:"weekend",stack:0,kind:"card",title:"Sat",subtitle:"{hours[5]}h"}).node("sunNode",{lane:"weekend",stack:1,kind:"card",title:"Sun",subtitle:"{hours[6]}h"}).readout.polarArea("p",{source:"hours",max:10,labelSource:"days",viewW:220,viewH:220,label:"Hours (polar sectors)"}).phase("p1",{duration:1800,title:"平日だけ",body:"平日に時間が入り、週末は 0。 週末の 2 区画だけが消える。"},e=>e.activate("monNode","tueNode").set("hours","[6,7,8,6,7,0,0]")).phase("p2",{duration:1800,title:"週末も入る",body:"週末にも時間が入る。 扇形が一周に広がる。"},e=>e.activate("monNode","tueNode","wedNode","thuNode","friNode").set("hours","[3,5,8,6,7,4,2]")).phase("p3",{duration:1800,title:"差を均す",body:"曜日ごとの差が縮まる。 扇形の長さが揃う。"},e=>e.activate("monNode","tueNode","wedNode","thuNode","friNode","satNode","sunNode").set("hours","[5,5,6,5,6,4,4]")).build(),hl="weekly activity 7 day を 2-lane (Weekday / Weekend) に分散、 各 day 個別 card + hours、 polarArea readout 併存",gl=t("interactive-onboarding-stepper",{topic:"5 段の初期設定ウィザードを追う"}).lane("col1",{x:0,width:250}).lane("col2",{x:290,width:340}).lane("col3",{x:670,width:190}).input.stepper("current",{min:0,max:4,defaultValue:2,label:"Current step"}).state("current",{initial:2}).arraySignal("steps",["Sign up","Profile","Preferences","Verify","Done"]).node("signupNode",{lane:"col1",stack:0,kind:"card",w:200,title:"Sign up",subtitle:"アカウント作成"}).node("profileNode",{lane:"col1",stack:1,kind:"card",w:200,title:"Profile",subtitle:"プロフィール記入"}).node("prefsNode",{lane:"col2",stack:0,kind:"card",w:290,title:"Preferences",subtitle:"設定選択 (現在地)"}).node("verifyNode",{lane:"col2",stack:1,kind:"card",w:180,title:"Verify",subtitle:"認証確認"}).node("doneNode",{lane:"col3",stack:0,kind:"card",w:140,title:"Done",subtitle:"完了"}).edge("signupNode","profileNode",{label:"next",tone:"info"}).edge("profileNode","prefsNode",{label:"next",tone:"info"}).edge("prefsNode","verifyNode",{label:"next",tone:"accent"}).edge("verifyNode","doneNode",{label:"finish",tone:"success"}).readout.stepIndicator("wizard",{source:"current",stepsSource:"steps",viewW:360,viewH:60,colorActive:"#2563eb",colorPending:"#cbd5e1",label:"Progress (dot strip)"}).phase("p1",{duration:1200,title:"最初の 2 段",body:""},e=>e.activate("signupNode").badge("wizard")).phase("p2",{duration:1200,title:"中ほどまで",body:""},e=>e.activate("signupNode","profileNode","prefsNode").badge("wizard")).phase("p3",{duration:1200,title:"最後まで",body:"5 区画 pipeline (Sign up → Profile → Preferences → Verify → Done) を 3 列 2 段に置いて + 4 edge で onboarding 遷移を node network 化、 tone で段階分類 (info=前半 / accent=verify 直前 / success=完了)、 stepIndicator readout も併存で dot strip 表示。"},e=>e.activate("signupNode","profileNode","prefsNode","verifyNode","doneNode").badge("wizard")).build(),kl="onboarding 5 step wizard を 3 列 2 段の pipeline + 4 edge で wizard 遷移を node network 化、 stepIndicator readout 併存",wl=t("interactive-kpi-bullet",{topic:"実績と目標を良 / 並 / 悪の帯で見せる"}).lane("bad",{x:0,width:180}).lane("avg",{x:220,width:180}).lane("good",{x:440,width:220}).input.slider("actual",{min:0,max:100,defaultValue:55,label:"Actual"}).state("actual",{initial:55}).state("target",{initial:80}).node("badRange",{lane:"bad",stack:0,kind:"card",title:"Bad range",subtitle:"0-40 (red)"}).node("avgRange",{lane:"avg",stack:0,kind:"card",title:"Avg range",subtitle:"40-70 (yellow) · actual {actual} here"}).node("goodRange",{lane:"good",stack:0,kind:"card",title:"Good range",subtitle:"70-100 (green) · target {target}"}).node("actualNode",{lane:"avg",stack:1,kind:"card",title:"◆ Actual",subtitle:"{actual}"}).node("targetNode",{lane:"good",stack:1,kind:"card",title:"▼ Target",subtitle:"{target}"}).edge("actualNode","targetNode",{label:"gap = target - actual",tone:"warning"}).readout.bulletChart("b",{source:"actual",targetSource:"target",max:100,rangeBad:40,rangeAvg:70,viewW:320,viewH:40,colorActual:"#241c14",label:"Progress (bullet chart)"}).readout.stat("targetStat",{source:"target",label:"Target"}).phase("p1",{duration:1800,title:"悪い帯を見る",body:"実績が入ると位置づけが分かる 3 本の帯。 一番下の帯。"},e=>e.activate("badRange","actualNode")).phase("p2",{duration:1800,title:"並の帯を見る",body:"真ん中の帯。 つまみで実績を動かすと、入る帯が変わる。"},e=>e.activate("badRange","avgRange","actualNode")).phase("p3",{duration:1800,title:"良い帯と目標",body:"一番上の帯と、目標を指す縦線。 実績がどこに立つかで読み分ける。"},e=>e.activate("badRange","avgRange","goodRange","actualNode","targetNode")).build(),ml="KPI bullet chart を 3-lane (bad / avg / good) range 分散 + actual/target 個別 card、 bulletChart readout 併存",vl=t("interactive-revenue-scoreboard",{topic:"売上の現在 / 目標 / 差分を並べる"}).lane("col1",{x:0,width:370}).lane("col2",{x:410,width:250}).input.slider("rev",{min:0,max:999,defaultValue:234,label:"Revenue"}).state("rev",{initial:234}).node("currentNode",{lane:"col1",stack:0,kind:"card",w:270,title:"◆ Current",subtitle:"${rev}M (slider driven)"}).node("targetNode",{lane:"col2",stack:0,kind:"card",w:200,title:"Target",subtitle:"$500M (Q3 goal)"}).node("gapNode",{lane:"col1",stack:1,kind:"card",w:320,title:"Gap",subtitle:"target - current (progress toward goal)"}).edge("currentNode","targetNode",{label:"progress",tone:"info"}).edge("targetNode","gapNode",{label:"delta",tone:"warning"}).readout.numberBoard("nb",{source:"rev",prefix:"$",suffix:"M",size:56,color:"#241c14",caption:"vs $500M target",label:"Revenue (scoreboard)"}).phase("p1",{duration:1200,title:"現在を見る",body:""},e=>e.activate("currentNode").badge("scoreboard")).phase("p2",{duration:1200,title:"目標を並べる",body:""},e=>e.activate("currentNode","targetNode").badge("scoreboard")).phase("p3",{duration:1200,title:"差を出す",body:"3 区画 (Current / Target / Gap) を 2 列 2 段に置いて revenue Q3 status を分散、 2 edge (progress info / delta warning) で target 達成経路明示、 slider 変化で current lane 追随、 scoreboard readout も併存で 56px 大数字 表示、 progress dashboard 構造を lane で可視化。"},e=>e.activate("currentNode","targetNode","gapNode").badge("scoreboard")).build(),yl="revenue Q3 status を 3 区画 (Current / Target / Gap) 2 列 2 段 + 2 edge、 scoreboard display に加え target との差を可視化",fl=t("interactive-player-leaderboard",{topic:"6 人の順位を上位 / 中位 / 下位に分ける"}).lane("top",{x:0,width:260}).lane("middle",{x:300,width:220}).lane("bottom",{x:540,width:200}).arraySignal("players",[["Alice",920],["Bob",780],["Carol",850],["Dan",680],["Eve",890],["Frank",720]]).node("aliceNode",{lane:"top",stack:0,kind:"card",title:"🥇 1st Alice",subtitle:"首位"}).node("eveNode",{lane:"top",stack:1,kind:"card",title:"🥈 2nd Eve",subtitle:"2 位"}).node("carolNode",{lane:"top",stack:2,kind:"card",title:"🥉 3rd Carol",subtitle:"3 位"}).node("bobNode",{lane:"middle",stack:0,kind:"card",title:"4th Bob",subtitle:"中位"}).node("frankNode",{lane:"middle",stack:1,kind:"card",title:"5th Frank",subtitle:"表示の末尾"}).node("danNode",{lane:"bottom",stack:0,kind:"card",title:"6th Dan",subtitle:"圏外"}).readout.leaderboard("lb",{source:"players",max:5,color:"#2563eb",label:"Ranking (top 5 leaderboard)"}).phase("p1",{duration:1800,title:"接戦の状態",body:"上位の点差が小さい状態。 並びが僅差で決まる。"},e=>e.activate("aliceNode").set("players",'[["Alice",920],["Bob",915],["Carol",910],["Dan",905],["Eve",900]]')).phase("p2",{duration:1800,title:"差が開く",body:"首位が抜ける。 上位と下位の点差が大きくなる。"},e=>e.activate("aliceNode","eveNode").set("players",'[["Alice",1180],["Eve",890],["Carol",850],["Bob",780],["Frank",720]]')).phase("p3",{duration:1800,title:"順位が入れ替わる",body:"別の人が首位に立つ。 並びが上下ごと組み替わる。"},e=>e.activate("aliceNode","eveNode","carolNode","bobNode","frankNode","danNode").set("players",'[["Carol",1240],["Alice",1180],["Frank",1050],["Eve",890],["Bob",780],["Dan",680]]')).build(),Cl="6 player を 3-lane (Top 3 medals / Middle 2 / Bottom 1 out of top) rank 別分散、 各 player 個別 card、 leaderboard readout 併存",xl=t("interactive-build-traffic-light",{topic:"ビルド状態を信号機の 3 色で見せる"}).lane("red",{x:0,width:200}).lane("yellow",{x:240,width:200}).lane("green",{x:480,width:200}).input.dropdown("status",{options:["red","yellow","green"],defaultValue:"green",label:"Build status"}).state("status",{initial:"green"}).node("redNode",{lane:"red",stack:0,kind:"card",title:"● Red",subtitle:"ビルド失敗 · 要修正"}).node("yellowNode",{lane:"yellow",stack:0,kind:"card",title:"● Yellow",subtitle:"ビルド実行中 · 待機"}).node("greenNode",{lane:"green",stack:0,kind:"card",title:"● Green",subtitle:"ビルド成功 · deploy 可"}).node("currentCI",{lane:"green",stack:1,kind:"card",title:"◆ Current CI",subtitle:"status: {status}"}).readout.trafficLight("tl",{source:"status",viewW:70,viewH:180,label:"Status (3-color indicator)"}).phase("p1",{duration:1800,title:"赤を見る",body:"止まっている時に点く色。 3 色のうち 1 つ目で、状態はつまみで選ぶ。"},e=>e.activate("redNode")).phase("p2",{duration:1800,title:"黄を見る",body:"走っている間の色。 選んだ状態に応じて 1 つだけが点く。"},e=>e.activate("redNode","yellowNode")).phase("p3",{duration:1800,title:"緑を見る",body:"通った時の色。 3 色で状態を読み分ける形になっている。"},e=>e.activate("redNode","yellowNode","greenNode","currentCI")).build(),Sl="build status 3 state (red/yellow/green) を 3-lane 分散、 各 state 個別 card + current indicator、 trafficLight readout 併存",Nl=t("interactive-tech-tagcloud",{topic:"8 技術を使用量の大小で分けて見せる"}).lane("high",{x:0,width:220}).lane("mid",{x:260,width:220}).lane("low",{x:520,width:220}).arraySignal("tags",[["React",30],["TypeScript",28],["Python",22],["Rust",18],["Go",15],["Svelte",10],["Vue",8],["Deno",5]]).node("reactNode",{lane:"high",stack:0,kind:"card",title:"React",subtitle:"最も大きい語"}).node("tsNode",{lane:"high",stack:1,kind:"card",title:"TypeScript",subtitle:"大きい語"}).node("pyNode",{lane:"high",stack:2,kind:"card",title:"Python",subtitle:"やや大きい語"}).node("rustNode",{lane:"mid",stack:0,kind:"card",title:"Rust",subtitle:"中位の語"}).node("goNode",{lane:"mid",stack:1,kind:"card",title:"Go",subtitle:"やや小さい語"}).node("svelteNode",{lane:"mid",stack:2,kind:"card",title:"Svelte",subtitle:"小さい語"}).node("vueNode",{lane:"low",stack:0,kind:"card",title:"Vue",subtitle:"より小さい語"}).node("denoNode",{lane:"low",stack:1,kind:"card",title:"Deno",subtitle:"最も小さい語"}).readout.tagCloud("tc",{source:"tags",minSize:12,maxSize:32,label:"Tech cloud (font-size 比例)"}).phase("p1",{duration:1800,title:"少ない語",body:"語が 3 つだけの状態。 大きさの差が読み取りやすい。"},e=>e.activate("reactNode").set("tags",'[["React",30],["TypeScript",28],["Python",22]]')).phase("p2",{duration:1800,title:"語が増える",body:"語が 8 つに増える。 大小の幅が広がる。"},e=>e.activate("reactNode","tsNode","pyNode").set("tags",'[["React",30],["TypeScript",28],["Python",22],["Rust",18],["Go",15],["Svelte",10],["Vue",8],["Deno",5]]')).phase("p3",{duration:1800,title:"重みの幅が広がる",body:"大小の順はそのままで、上と下の差が開く。 文字の大きさの幅が最大まで使われる。"},e=>e.activate("reactNode","tsNode","pyNode","rustNode","goNode","svelteNode","vueNode","denoNode").set("tags",'[["React",32],["TypeScript",29],["Python",24],["Rust",18],["Go",14],["Svelte",9],["Vue",6],["Deno",3]]')).build(),Al="8 tech skill を 3-lane (High ≥20 / Mid 10-19 / Low <10) weight 別分散、 各 skill 個別 card、 tagCloud readout 併存",Pl=t("interactive-team-activity",{topic:"チームの動きを新しい順に 5 件並べる"}).lane("col1",{x:0,width:350}).lane("col2",{x:390,width:370}).lane("col3",{x:800,width:320}).arraySignal("events",[["Alice","pushed to main","2 min ago"],["Bob","opened PR #42","8 min ago"],["Carol","reviewed PR #40","15 min ago"],["Dan","merged PR #38","1 h ago"],["Eve","deployed v1.2","3 h ago"]]).node("e1",{lane:"col1",stack:0,kind:"card",w:300,title:"Alice",subtitle:"最新の出来事"}).node("e2",{lane:"col1",stack:1,kind:"card",w:290,title:"Bob",subtitle:"次に新しい出来事"}).node("e3",{lane:"col2",stack:0,kind:"card",w:320,title:"Carol",subtitle:"中ほどの出来事"}).node("e4",{lane:"col2",stack:1,kind:"card",w:270,title:"Dan",subtitle:"やや古い出来事"}).node("e5",{lane:"col3",stack:0,kind:"card",w:270,title:"Eve",subtitle:"最も古い出来事"}).edge("e1","e2",{label:"→",tone:"info"}).edge("e2","e3",{label:"→",tone:"info"}).edge("e3","e4",{label:"→",tone:"accent"}).edge("e4","e5",{label:"→",tone:"accent"}).readout.activityFeed("af",{source:"events",max:5,color:"#2563eb",label:"Recent (feed list)"}).phase("p1",{duration:1800,title:"1 件だけ",body:"出来事が 1 件だけある状態。 一覧の先頭に入る。"},e=>e.activate("e1").set("events",'[["Alice","pushed to main","2 min ago"]]')).phase("p2",{duration:1800,title:"積み上がる",body:"出来事が増えて一覧が伸びる。 新しいものが上に来る。"},e=>e.activate("e1","e2","e3").set("events",'[["Alice","pushed to main","2 min ago"],["Bob","opened PR #42","8 min ago"],["Carol","reviewed PR #40","15 min ago"]]')).phase("p3",{duration:1800,title:"押し出される",body:"件数の上限を超えると古いものが落ちる。 一覧の長さは変わらない。"},e=>e.activate("e1","e2","e3","e4","e5").set("events",'[["Dan","released v2.0","1 min ago"],["Alice","pushed to main","2 min ago"],["Bob","opened PR #42","8 min ago"],["Carol","reviewed PR #40","15 min ago"],["Eve","merged PR #38","1 h ago"]]')).build(),Bl="team activity 5 event を 3 列 2 段の timeline (recent → old) で個別 card 分散、 activityFeed readout 併存",_l=t("interactive-product-rating",{topic:"商品評価を低 / 中 / 高の帯で見せる"}).lane("low",{x:0,width:220}).lane("mid",{x:260,width:220}).lane("high",{x:520,width:220}).input.slider("score",{min:0,max:5,step:.5,defaultValue:3.5,label:"Score"}).state("score",{initial:3.5}).node("lowNode",{lane:"low",stack:0,kind:"card",title:"Low range",subtitle:"0-1.5 stars · poor"}).node("midNode",{lane:"mid",stack:0,kind:"card",title:"Mid range",subtitle:"2-3.5 stars · average · default 3.5 here"}).node("highNode",{lane:"high",stack:0,kind:"card",title:"High range",subtitle:"4-5 stars · excellent"}).node("currentNode",{lane:"mid",stack:1,kind:"card",title:"◆ Current",subtitle:"{score} / 5"}).readout.rating("r",{source:"score",count:5,color:"#eab308",label:"Rating (star display)"}).phase("p1",{duration:1200,title:"帯を並べる",body:""},e=>e.activate("lowNode").badge("rating")).phase("p2",{duration:1200,title:"現在の帯",body:""},e=>e.activate("lowNode","midNode").badge("rating")).phase("p3",{duration:1200,title:"いまの評価",body:"3-lane (Low 0-1.5 / Mid 2-3.5 / High 4-5) で rating range を分散、 default 3.5 の位置 (mid lane) を currentNode で明示、 slider (0.5 刻み) 変化で rating readout 追随 (star display half-star 対応)、 range 分類と star 表示の 2 経路 view。"},e=>e.activate("lowNode","midNode","highNode","currentNode").badge("rating")).build(),Dl="product rating を 3-lane (Low 0-1.5 / Mid 2-3.5 / High 4-5) range 別分散 + current indicator、 rating readout 併存",Tl=t("interactive-alert-notification",{topic:"通知 4 種を情報 / 注意 / 異常 / 成功で分ける"}).lane("info",{x:0,width:170}).lane("warn",{x:190,width:170}).lane("error",{x:380,width:170}).lane("success",{x:570,width:170}).input.dropdown("kind",{options:["info","warn","error","success"],defaultValue:"warn",label:"Kind"}).state("kind",{initial:"warn"}).state("title",{initial:"Deploy in progress"}).state("body",{initial:"Building v1.2.3 for production"}).node("infoNode",{lane:"info",stack:0,kind:"card",title:"ℹ Info",subtitle:"blue · 通知"}).node("warnNode",{lane:"warn",stack:0,kind:"card",title:"⚠ Warn",subtitle:"yellow · 注意 (default)"}).node("errorNode",{lane:"error",stack:0,kind:"card",title:"✕ Error",subtitle:"red · 失敗"}).node("successNode",{lane:"success",stack:0,kind:"card",title:"✓ Success",subtitle:"green · 成功"}).node("currentAlert",{lane:"warn",stack:1,kind:"card",title:"◆ Current",subtitle:"kind: {kind}"}).readout.notification("nt",{kindSource:"kind",titleSource:"title",bodySource:"body",label:"Alert (color + icon)"}).phase("p1",{duration:1200,title:"情報と注意",body:""},e=>e.activate("infoNode").badge("alert")).phase("p2",{duration:1200,title:"異常と成功",body:""},e=>e.activate("infoNode","warnNode","errorNode").badge("alert")).phase("p3",{duration:1200,title:"いまの通知",body:"4-lane (Info / Warn / Error / Success) で alert 4 kind を分散、 各 kind 個別 card + current indicator (default=warn lane)、 dropdown 切替で notification readout が color + icon (ℹ/⚠/✕/✓) 追随、 kind 分類と現在 state の 2 経路 view。"},e=>e.activate("infoNode","warnNode","errorNode","successNode","currentAlert").badge("alert")).build(),Il="alert kind 4 種 (info/warn/error/success) を 4-lane 分散 + current indicator、 各 kind 個別 card、 notification readout 併存",Rl=t("interactive-commit-diff",{topic:"追加行と削除行から差し引きを出す"}).lane("adds",{x:0,width:260}).lane("dels",{x:300,width:260}).input.stepper("add",{min:0,max:500,step:10,defaultValue:120,label:"Additions"}).input.stepper("del",{min:0,max:500,step:10,defaultValue:45,label:"Deletions"}).state("add",{initial:120}).state("del",{initial:45}).node("addCard",{lane:"adds",stack:0,kind:"card",title:"+ Additions",subtitle:"+{add} lines (green)"}).node("addDetail",{lane:"adds",stack:1,kind:"card",title:"adds/del",subtitle:"add > del → net growth"}).node("delCard",{lane:"dels",stack:0,kind:"card",title:"- Deletions",subtitle:"-{del} lines (red)"}).node("delDetail",{lane:"dels",stack:1,kind:"card",title:"cleanup",subtitle:"remove obsolete code"}).edge("addCard","delCard",{label:"net = add - del",tone:"info"}).readout.diffCounter("dc",{additionsSource:"add",deletionsSource:"del",colorAdd:"#22c55e",colorDel:"#ef4444",label:"Diff (+N/-N bar)"}).phase("p1",{duration:1200,title:"追加を見る",body:""},e=>e.activate("addCard").badge("diff")).phase("p2",{duration:1200,title:"削除を並べる",body:""},e=>e.activate("addCard","addDetail").badge("diff")).phase("p3",{duration:1200,title:"差し引き",body:"2-lane (Additions +N green / Deletions -N red) で PR diff を符号別分散、 各 lane に main card + detail card、 net delta edge (info tone) で add - del の差を明示、 diffCounter readout も併存で proportion bar 表示、 diff 構造と bar の 2 経路 view。"},e=>e.activate("addCard","addDetail","delCard","delDetail").badge("diff")).build(),El="git PR diff を 2-lane (Additions +N / Deletions -N) 分散 + net delta edge、 diffCounter readout 併存",Ml=t("interactive-support-chat",{topic:"問い合わせ 5 通を客 / 担当で分ける"}).lane("customer",{x:0,width:280}).lane("support",{x:320,width:320}).arraySignal("thread",[["Alice","Hi, I need help with my order",!1],["Support","Sure! What's the order ID?",!0],["Alice","#12345",!1],["Support","Checking...",!0],["Support","Refunded! You'll see it in 3-5 days.",!0]]).node("cust1",{lane:"customer",stack:0,kind:"card",title:"Alice #1",subtitle:"利用者の 1 通目"}).node("cust2",{lane:"customer",stack:1,kind:"card",title:"Alice #2",subtitle:"利用者の 2 通目"}).node("sup1",{lane:"support",stack:0,kind:"card",title:"Support #1",subtitle:"応対側の 1 通目"}).node("sup2",{lane:"support",stack:1,kind:"card",title:"Support #2",subtitle:"確認中の返答"}).node("sup3",{lane:"support",stack:2,kind:"card",title:"Support #3",subtitle:"解決の返答"}).readout.chatBubble("cb",{source:"thread",max:6,colorSelf:"#2563eb",colorOther:"#f0e0b8",label:"Conversation (bubbles)"}).phase("p1",{duration:1800,title:"問い合わせ",body:"利用者からの 1 通目。 左側に吹き出しが出る。"},e=>e.activate("cust1").set("thread",'[["Alice","Hi, I need help with my order",false]]')).phase("p2",{duration:1800,title:"やり取りが続く",body:"応対側が返し、利用者が答える。 左右に交互に並ぶ。"},e=>e.activate("cust1","sup1","cust2").set("thread",'[["Alice","Hi, I need help with my order",false],["Support","Sure! What is the order ID?",true],["Alice","#12345",false]]')).phase("p3",{duration:1800,title:"解決する",body:"確認を経て解決に至る。 やり取りの流れが上から下へ読める形になる。"},e=>e.activate("cust1","sup1","cust2","sup2","sup3").set("thread",'[["Alice","Hi, I need help with my order",false],["Support","Sure! What is the order ID?",true],["Alice","#12345",false],["Support","Checking...",true],["Support","Refunded! 3-5 days.",true]]')).build(),Ll="customer support 5 message を 2-lane (Customer / Support) speaker 別分散、 各 message 個別 card、 chatBubble readout 併存",Ol=t("interactive-user-avatar",{topic:"名前からアイコン画像を組み立てる"}).lane("col1",{x:0,width:370}).lane("col2",{x:410,width:370}).input.text("user",{defaultValue:"Alice Wonderland",placeholder:"Full name",maxLength:40,label:"User name"}).state("user",{initial:"Alice Wonderland"}).node("inputNode",{lane:"col1",stack:0,kind:"card",w:270,title:"Text input",subtitle:"user = {user}"}).node("initialsNode",{lane:"col2",stack:0,kind:"card",w:320,title:"Initials",subtitle:"first 2 word head chars (Alice Wonderland → AW)"}).node("circleNode",{lane:"col1",stack:1,kind:"card",w:320,title:"Circle",subtitle:"size 56 · blue #2563eb + AW text"}).edge("inputNode","initialsNode",{label:"parse",tone:"info"}).edge("initialsNode","circleNode",{label:"render",tone:"success"}).readout.avatar("av",{source:"user",size:56,color:"#2563eb",label:"Avatar (rendered)"}).phase("p1",{duration:1200,title:"名前を受ける",body:""},e=>e.activate("inputNode").badge("avatar")).phase("p2",{duration:1200,title:"頭文字を取る",body:""},e=>e.activate("inputNode","initialsNode").badge("avatar")).phase("p3",{duration:1200,title:"絵にする",body:"3 区画 (Input name / Initials extract / Circle render) を 2 列 2 段に置いて avatar 生成 3 step を pipeline 分散、 2 edge (parse info tone / render success tone) で dataflow 明示、 text input で name 変化 → 全 lane 追随、 avatar readout も併存で最終 rendered 表示。"},e=>e.activate("inputNode","initialsNode","circleNode").badge("avatar")).build(),Fl="user avatar generation pipeline を 3 区画 (Input name / Initials extract / Circle render) 2 列 2 段 + 2 edge で pipeline network 化、 avatar readout 併存",Hl=t("interactive-sprint-checklist",{topic:"6 タスクを完了 / 未完了で分ける"}).lane("done",{x:0,width:240}).lane("todo",{x:300,width:240}).arraySignal("tasks",[["Setup CI",!0],["Write tests",!0],["Fix bug #42",!1],["Code review",!1],["Deploy staging",!1],["Post-mortem",!1]]).node("t1",{lane:"done",stack:0,kind:"card",title:"✓ Setup CI",subtitle:"done"}).node("t2",{lane:"done",stack:1,kind:"card",title:"✓ Tests",subtitle:"done"}).node("t3",{lane:"todo",stack:0,kind:"card",title:"Fix bug #42",subtitle:"todo (blocker)"}).node("t4",{lane:"todo",stack:1,kind:"card",title:"Code review",subtitle:"todo (awaits reviewer)"}).node("t5",{lane:"todo",stack:2,kind:"card",title:"Deploy",subtitle:"todo (depends on review)"}).node("t6",{lane:"todo",stack:3,kind:"card",title:"Post-mortem",subtitle:"todo (last)"}).readout.checklist("cl",{source:"tasks",color:"#22c55e",label:"Progress (2/6 = 33%)"}).phase("p1",{duration:1800,title:"着手前",body:"どれも未完了の状態。 印が 1 つも付いていない。"},e=>e.activate("t1").set("tasks",'[["Setup CI",false],["Write tests",false],["Fix bug #42",false],["Code review",false],["Deploy",false],["Retro",false]]')).phase("p2",{duration:1800,title:"半分進む",body:"前半が終わる。 印の付いた項目が上に集まる。"},e=>e.activate("t1","t2","t3").set("tasks",'[["Setup CI",true],["Write tests",true],["Fix bug #42",true],["Code review",false],["Deploy",false],["Retro",false]]')).phase("p3",{duration:1800,title:"残り 1 件",body:"最後の 1 件を残して終わる。 未完了がどれか一目で分かる。"},e=>e.activate("t1","t2","t3","t4","t5","t6").set("tasks",'[["Setup CI",true],["Write tests",true],["Fix bug #42",true],["Code review",true],["Deploy",true],["Retro",false]]')).build(),Wl="sprint 6 task を 2-lane (Done ✓ / Todo) 状態別分散、 各 task 個別 card、 checklist readout 併存",ql=t("interactive-engine-tachometer",{topic:"回転数を通常 / 巡航 / 過回転で見せる"}).lane("idle",{x:0,width:200}).lane("cruise",{x:240,width:200}).lane("redline",{x:480,width:200}).input.slider("rpm",{min:0,max:8e3,defaultValue:3500,label:"RPM"}).state("rpm",{initial:3500}).node("idleNode",{lane:"idle",stack:0,kind:"card",title:"Idle range",subtitle:"0-2000 rpm (green)"}).node("cruiseNode",{lane:"cruise",stack:0,kind:"card",title:"Cruise range",subtitle:"2000-5000 rpm (yellow) · normal driving"}).node("redlineNode",{lane:"redline",stack:0,kind:"card",title:"Redline",subtitle:"5000-8000 rpm (red) · caution"}).node("currentRpm",{lane:"cruise",stack:1,kind:"card",title:"◆ Current",subtitle:"{rpm} rpm (default 3500 = cruise)"}).readout.circularGauge("g",{source:"rpm",min:0,max:8e3,unit:"rpm",color:"#f97316",viewW:200,viewH:160,label:"Tachometer (270° dial)"}).phase("p1",{duration:1200,title:"通常と巡航",body:""},e=>e.activate("idleNode").badge("tachometer")).phase("p2",{duration:1200,title:"過回転まで",body:""},e=>e.activate("idleNode","cruiseNode").badge("tachometer")).phase("p3",{duration:1200,title:"いまの回転数",body:"3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000) で rpm 範囲を領域別分散、 各 range 個別 card + 現在 rpm indicator (default 3500 = cruise lane)、 circularGauge readout も併存で 270° dial 表示、 range 分類と needle 表示の 2 経路 view。"},e=>e.activate("idleNode","cruiseNode","redlineNode","currentRpm").badge("tachometer")).build(),Gl="engine RPM を 3-lane (Idle 0-2000 / Cruise 2000-5000 / Redline 5000-8000) 領域別分散 + current rpm indicator、 circularGauge readout 併存",Vl=t("interactive-product-price-tag",{topic:"旧価格 / 新価格 / 割引率を並べる"}).lane("col1",{x:0,width:370}).lane("col2",{x:410,width:370}).input.stepper("newPrice",{min:0,max:200,step:5,defaultValue:65,label:"New price"}).state("newPrice",{initial:65}).state("oldPrice",{initial:100}).node("oldNode",{lane:"col1",stack:0,kind:"card",w:310,title:"Old price",subtitle:"${oldPrice} (strikethrough)"}).node("newNode",{lane:"col2",stack:0,kind:"card",w:320,title:"New price",subtitle:"${newPrice} (stepper driven)"}).node("discountNode",{lane:"col1",stack:1,kind:"card",w:320,title:"Discount %",subtitle:"(oldPrice - newPrice) / oldPrice · red badge"}).edge("oldNode","newNode",{label:"sale",tone:"warning"}).edge("newNode","discountNode",{label:"%",tone:"error"}).readout.priceTag("pt",{oldSource:"oldPrice",newSource:"newPrice",currency:"$",colorNew:"#241c14",colorOld:"#a08870",colorDiscount:"#ef4444",label:"Price (composite tag)"}).phase("p1",{duration:1200,title:"旧価格",body:""},e=>e.activate("oldNode").badge("price")).phase("p2",{duration:1200,title:"新価格",body:""},e=>e.activate("oldNode","newNode").badge("price")).phase("p3",{duration:1200,title:"割引率",body:"3 区画 (Old / New / Discount) を 2 列 2 段に置いて price tag 3 component を分散、 2 edge (sale warning tone / % error tone) で計算経路明示、 stepper で newPrice 変化 → priceTag readout が strikethrough + 大数字 + red badge を同時追随、 e-commerce 構造を dataflow で可視化。"},e=>e.activate("oldNode","newNode","discountNode").badge("price")).build(),Ul="e-commerce price tag を 3 区画 (Old price / New price / Discount %) 2 列 2 段 + 2 edge、 discount 計算経路可視化、 priceTag readout 併存",Ql=t("interactive-deploy-spinner",{topic:"配備状態を実行中 / 完了 / 失敗で見せる"}).lane("running",{x:0,width:220}).lane("done",{x:260,width:220}).lane("error",{x:520,width:220}).input.dropdown("status",{options:["running","done","error"],defaultValue:"running",label:"Status"}).input.text("msg",{defaultValue:"Building production bundle...",placeholder:"Status message",maxLength:60,label:"Message"}).state("status",{initial:"running"}).state("msg",{initial:"Building production bundle..."}).node("runningNode",{lane:"running",stack:0,kind:"card",title:"◐ Running",subtitle:"blue spinner · SMIL 回転 circle"}).node("doneNode",{lane:"done",stack:0,kind:"card",title:"✓ Done",subtitle:"green · deploy success"}).node("errorNode",{lane:"error",stack:0,kind:"card",title:"✕ Error",subtitle:"red · deploy failed"}).node("currentState",{lane:"running",stack:1,kind:"card",title:"◆ Deploy",subtitle:"status: {status} · msg: {msg}"}).readout.spinner("sp",{source:"status",textSource:"msg",color:"#2563eb",label:"Deploy (spinner + text)"}).phase("p1",{duration:1200,title:"実行中",body:""},e=>e.activate("runningNode").badge("loading")).phase("p2",{duration:1200,title:"完了と失敗",body:""},e=>e.activate("runningNode","doneNode").badge("loading")).phase("p3",{duration:1200,title:"いまの状態",body:"3-lane (Running spinner / Done ✓ / Error ✕) で deploy 3 state を分散、 各 state 個別 card + current indicator (default=running lane)、 dropdown 切替で spinner readout が icon 追随、 state 分類と現在 deploy の 2 経路 view。"},e=>e.activate("runningNode","doneNode","errorNode","currentState").badge("loading")).build(),jl="deploy 3 state (running/done/error) を 3-lane 分散 + current indicator、 spinner readout 併存",Jl=t("interactive-exam-grade",{topic:"成績を A から F の 5 段階で見せる"}).lane("A",{x:0,width:130}).lane("B",{x:150,width:130}).lane("C",{x:300,width:130}).lane("D",{x:450,width:130}).lane("F",{x:600,width:130}).input.slider("score",{min:0,max:100,defaultValue:85,label:"Score"}).state("score",{initial:85}).node("aNode",{lane:"A",stack:0,kind:"card",title:"A",subtitle:"≥ 90 (green)"}).node("bNode",{lane:"B",stack:0,kind:"card",title:"B",subtitle:"80-89 (blue, default here)"}).node("cNode",{lane:"C",stack:0,kind:"card",title:"C",subtitle:"70-79 (yellow)"}).node("dNode",{lane:"D",stack:0,kind:"card",title:"D",subtitle:"60-69 (orange)"}).node("fNode",{lane:"F",stack:0,kind:"card",title:"F",subtitle:"< 60 (red)"}).node("currentGrade",{lane:"B",stack:1,kind:"card",title:"◆ Current",subtitle:"score = {score} / 100"}).readout.grade("g",{source:"score",max:100,label:"Letter grade (band)"}).phase("p1",{duration:1200,title:"上の 2 段階",body:""},e=>e.activate("aNode","bNode").badge("grade")).phase("p2",{duration:1200,title:"下の 3 段階",body:""},e=>e.activate("aNode","bNode","cNode","dNode").badge("grade")).phase("p3",{duration:1200,title:"いまの成績",body:"5-lane (A ≥90 / B 80-89 / C 70-79 / D 60-69 / F <60) で 5 letter grade band を分散、 各 band 個別 card + current indicator (default score 85 → B lane)、 slider 変化で grade readout が letter + color 追随、 grade band 分類と current の 2 経路 view。"},e=>e.activate("aNode","bNode","cNode","dNode","fNode","currentGrade").badge("grade")).build(),Yl="exam grade 5 letter (A/B/C/D/F) を 5-lane band 分散 + current indicator (default=B lane)、 grade readout 併存",zl=t("interactive-timer-stopwatch",{topic:"秒数と実行状態から時計表示を作る"}).lane("input",{x:0,width:200}).lane("toggle",{x:240,width:200}).lane("display",{x:480,width:220}).input.stepper("sec",{min:0,max:3600,step:5,defaultValue:125,label:"Elapsed sec"}).input.toggle("running",{defaultValue:!0,label:"Running"}).state("sec",{initial:125}).state("running",{initial:"true"}).state("elapsed",{initial:125e3}).formula("elapsed","sec * 1000").node("secNode",{lane:"input",stack:0,kind:"card",title:"Seconds",subtitle:"sec = {sec}s (0-3600)"}).node("runNode",{lane:"toggle",stack:0,kind:"card",title:"Running",subtitle:"running = {running}"}).node("displayNode",{lane:"display",stack:0,kind:"card",title:"MM:SS.ms",subtitle:"elapsed = sec × 1000 = {elapsed}ms"}).edge("secNode","displayNode",{label:"× 1000",tone:"info"}).edge("runNode","displayNode",{label:"color",tone:"success"}).readout.stopwatch("sw",{source:"elapsed",runningSource:"running",size:40,color:"#241c14",label:"Timer (MM:SS.ms)"}).phase("p1",{duration:1200,title:"秒数",body:""},e=>e.activate("secNode").badge("timer")).phase("p2",{duration:1200,title:"実行状態",body:""},e=>e.activate("secNode","runNode").badge("timer")).phase("p3",{duration:1200,title:"時計表示",body:"3-lane (Seconds / Running / Display) で stopwatch 3 component を分散、 2 edge (× 1000 info tone / color success tone) で 2 signal → 1 display の fan-in 明示、 stepper + toggle 変化で stopwatch readout の time + color が同時追随。"},e=>e.activate("secNode","runNode","displayNode").badge("timer")).build(),$l="stopwatch control を 3-lane (Seconds input / Running toggle / MM:SS.ms display) + 2 edge、 stepper + toggle → display fan-out、 stopwatch readout 併存",Kl=t("interactive-ml-confidence",{topic:"推論の確信度を低 / 中 / 高で見せる"}).lane("low",{x:0,width:200}).lane("mid",{x:240,width:200}).lane("high",{x:480,width:220}).input.slider("conf",{min:0,max:100,defaultValue:82,label:"Confidence %"}).state("conf",{initial:82}).node("lowNode",{lane:"low",stack:0,kind:"card",title:"Low band",subtitle:"< 40% (red · uncertain)"}).node("midNode",{lane:"mid",stack:0,kind:"card",title:"Mid band",subtitle:"40-74% (yellow · borderline)"}).node("highNode",{lane:"high",stack:0,kind:"card",title:"High band",subtitle:"≥ 75% (green · confident)"}).node("currentConf",{lane:"high",stack:1,kind:"card",title:"◆ Current",subtitle:"conf = {conf}% (default 82 → high)"}).readout.confidenceMeter("cm",{source:"conf",lowThreshold:40,highThreshold:75,viewW:280,viewH:40,label:"Confidence (3-band bar)"}).phase("p1",{duration:1200,title:"低い帯",body:""},e=>e.activate("lowNode").badge("ML conf")).phase("p2",{duration:1200,title:"高い帯まで",body:""},e=>e.activate("lowNode","midNode").badge("ML conf")).phase("p3",{duration:1200,title:"いまの確信度",body:"3-lane (Low <40 red / Mid 40-74 yellow / High ≥75 green) で 3 confidence band を分散、 current indicator (default 82 → high lane)、 slider 変化で confidenceMeter readout が band 色追随、 ML/AI classification band 分類と meter の 2 経路 view。"},e=>e.activate("lowNode","midNode","highNode","currentConf").badge("ML conf")).build(),Xl="ML confidence を 3-lane (Low <40 / Mid 40-74 / High ≥75) band 別分散 + current indicator (default=high)、 confidenceMeter readout 併存",Zl=t("interactive-post-reactions",{topic:"投稿への 4 種の反応を並べる"}).lane("thumb",{x:0,width:360}).lane("heart",{x:380,width:270}).lane("laugh",{x:670,width:270}).lane("party",{x:960,width:270}).arraySignal("reactions",[["👍",24],["❤️",12],["😂",8],["🎉",5]]).node("thumbNode",{lane:"thumb",stack:0,kind:"card",w:310,title:"👍 Thumbs up",subtitle:"最も多く付く反応"}).node("heartNode",{lane:"heart",stack:0,kind:"card",w:220,title:"❤️ Heart",subtitle:"次に多い反応"}).node("laughNode",{lane:"laugh",stack:0,kind:"card",w:220,title:"😂 Laugh",subtitle:"中ほどの反応"}).node("partyNode",{lane:"party",stack:0,kind:"card",w:220,title:"🎉 Party",subtitle:"最も少ない反応"}).readout.reactionBar("rb",{source:"reactions",color:"#2563eb",label:"Reactions (pill list)"}).phase("p1",{duration:1800,title:"投稿した直後",body:"反応が付き始めたばかり。 絵記号と数を組にした札が 4 枚並び、数はどれも小さい。"},e=>e.activate("thumbNode").set("reactions",'[["👍",5],["❤️",3],["😂",2],["🎉",1]]')).phase("p2",{duration:1800,title:"広まる",body:"数が増える。 札の大きさは数に関わらず一定で、中の数字だけが上がる。"},e=>e.activate("thumbNode","heartNode").set("reactions",'[["👍",14],["❤️",7],["😂",4],["🎉",2]]')).phase("p3",{duration:1800,title:"落ち着く",body:"伸びが止まる。 一番人気とそれ以外の数の開きが最大になり、順位が読める。"},e=>e.activate("thumbNode","heartNode","laughNode","partyNode").set("reactions",'[["👍",24],["❤️",12],["😂",8],["🎉",5]]')).build(),es="social post 4 reaction を 4-lane emoji 別分散、 各 reaction 個別 card、 reactionBar readout 併存",ts=t("interactive-tech-pills",{topic:"技術 5 つを画面 / 基盤 / 構築で分ける"}).lane("frontend",{x:0,width:220}).lane("systems",{x:260,width:200}).lane("build",{x:480,width:220}).arraySignal("stack",[["React","#61dafb"],["TypeScript","#3178c6"],["Rust","#dea584"],["Vite","#646cff"],["Bun","#000000"]]).node("reactNode",{lane:"frontend",stack:0,kind:"card",title:"React",subtitle:"画面を組み立てる部品"}).node("tsNode",{lane:"frontend",stack:1,kind:"card",title:"TypeScript",subtitle:"型の付いた書き方"}).node("rustNode",{lane:"systems",stack:0,kind:"card",title:"Rust",subtitle:"土台を書く言語"}).node("viteNode",{lane:"build",stack:0,kind:"card",title:"Vite",subtitle:"開発中の配信役"}).node("bunNode",{lane:"build",stack:1,kind:"card",title:"Bun",subtitle:"実行の土台"}).readout.pillGroup("pg",{source:"stack",label:"Stack (pill group)"}).phase("p1",{duration:1800,title:"画面から始める",body:"画面周りの 2 つだけを使う。 札はその 2 色しか出ず、横の並びが短い。"},e=>e.activate("reactNode","tsNode").set("stack",'[["React","#61dafb"],["TypeScript","#3178c6"]]')).phase("p2",{duration:1800,title:"土台を足す",body:"土台を書く言語が加わる。 札が 1 つ増え、系統の違う色が並びに混じる。"},e=>e.activate("reactNode","tsNode","rustNode").set("stack",'[["React","#61dafb"],["TypeScript","#3178c6"],["Rust","#dea584"]]')).phase("p3",{duration:1800,title:"組み立てまで揃う",body:"組み立てと実行の土台が揃う。 札は 5 枚になり、色が札ごとに違うことが読み取れる。"},e=>e.activate("reactNode","tsNode","rustNode","viteNode","bunNode").set("stack",'[["React","#61dafb"],["TypeScript","#3178c6"],["Rust","#dea584"],["Vite","#646cff"],["Bun","#000000"]]')).build(),as="tech stack 5 pill を 3-lane (Frontend / Systems / Build) category 別分散、 各 tool 個別 card、 pillGroup readout 併存",is=t("interactive-device-battery",{topic:"電池残量を低 / 中 / 高で見せる"}).lane("low",{x:0,width:200}).lane("mid",{x:240,width:200}).lane("high",{x:480,width:220}).input.slider("battery",{min:0,max:100,defaultValue:72,label:"Battery %"}).state("battery",{initial:72}).node("lowNode",{lane:"low",stack:0,kind:"card",title:"Low band",subtitle:"< 20% (red · critical)"}).node("midNode",{lane:"mid",stack:0,kind:"card",title:"Mid band",subtitle:"20-60% (yellow · charge soon)"}).node("highNode",{lane:"high",stack:0,kind:"card",title:"High band",subtitle:"≥ 60% (green · healthy)"}).node("currentBattery",{lane:"high",stack:1,kind:"card",title:"◆ Current",subtitle:"battery = {battery}% (default 72 → high)"}).readout.fuelBar("fb",{source:"battery",segments:10,lowThreshold:20,highThreshold:60,viewW:240,viewH:32,label:"Level (10 segment bar)"}).phase("p1",{duration:1200,title:"低い帯",body:""},e=>e.activate("lowNode").badge("battery")).phase("p2",{duration:1200,title:"高い帯まで",body:""},e=>e.activate("lowNode","midNode").badge("battery")).phase("p3",{duration:1200,title:"いまの残量",body:"3-lane (Low <20 red / Mid 20-60 yellow / High ≥60 green) で battery 3 band を分散、 current indicator (default 72 → high lane)、 slider 変化で fuelBar readout の filled 数 + color 追随、 battery / fuel / stamina 状態を lane 分割で可視化。"},e=>e.activate("lowNode","midNode","highNode","currentBattery").badge("battery")).build(),os="battery level を 3-lane (Low <20 / Mid 20-60 / High ≥60) band 別分散 + current indicator (default=high)、 fuelBar readout 併存",ns=t("interactive-metrics-grid",{topic:"SaaS の 4 指標を並べて見せる"}).lane("users",{x:0,width:270}).lane("revenue",{x:290,width:250}).lane("uptime",{x:560,width:230}).lane("errors",{x:810,width:230}).arraySignal("kpis",[["Users","12.4k"],["Revenue","$45k"],["Uptime","99.9","%"],["Errors",12]]).node("usersNode",{lane:"users",stack:0,kind:"card",w:220,title:"Users",subtitle:"月あたりの利用者"}).node("revenueNode",{lane:"revenue",stack:0,kind:"card",w:200,title:"Revenue",subtitle:"月ごとの売上"}).node("uptimeNode",{lane:"uptime",stack:0,kind:"card",w:180,title:"Uptime",subtitle:"動き続けた割合"}).node("errorsNode",{lane:"errors",stack:0,kind:"card",w:180,title:"Errors",subtitle:"異常の件数 (直近)"}).readout.metricsGrid("mg",{source:"kpis",color:"#2563eb",label:"Metrics (2×2 grid)"}).phase("p1",{duration:1800,title:"立ち上げ",body:"利用者も売上も小さく、異常の件数が大きい。 4 つの升目に数と名前が出る。"},e=>e.activate("usersNode","errorsNode").set("kpis",'[["Users","3.1k"],["Revenue","$9k"],["Uptime","98.2","%"],["Errors",47]]')).phase("p2",{duration:1800,title:"伸びる",body:"利用者と売上が増え、異常が半分に減る。 升目の並びと大きさは変わらず数だけが動く。"},e=>e.activate("usersNode","revenueNode","errorsNode").set("kpis",'[["Users","7.8k"],["Revenue","$26k"],["Uptime","99.4","%"],["Errors",23]]')).phase("p3",{duration:1800,title:"落ち着く",body:"4 つとも良い値に揃う。 稼働率だけが単位付き (%) で出ることが読み取れる。"},e=>e.activate("usersNode","revenueNode","uptimeNode","errorsNode").set("kpis",'[["Users","12.4k"],["Revenue","$45k"],["Uptime","99.9","%"],["Errors",12]]')).build(),ls="SaaS 4 KPI を 4-lane (Users / Revenue / Uptime / Errors) 分散、 各 KPI 個別 card、 metricsGrid readout 併存",ss=t("interactive-room-thermometer",{topic:"室温を寒い / 快適 / 暑いで分ける"}).lane("cold",{x:0,width:200}).lane("comfort",{x:240,width:220}).lane("hot",{x:500,width:200}).input.slider("temp",{min:0,max:40,defaultValue:24,label:"Temp °C"}).state("temp",{initial:24}).node("coldNode",{lane:"cold",stack:0,kind:"card",title:"Cold band",subtitle:"< 15°C (blue · heating)"}).node("comfortNode",{lane:"comfort",stack:0,kind:"card",title:"Comfort band",subtitle:"15-25°C (green · default range)"}).node("hotNode",{lane:"hot",stack:0,kind:"card",title:"Hot band",subtitle:"≥ 25°C (red · cooling)"}).node("currentTemp",{lane:"comfort",stack:1,kind:"card",title:"◆ Current",subtitle:"temp = {temp}°C (default 24 → comfort)"}).readout.thermometer("th",{source:"temp",min:0,max:40,viewW:70,viewH:180,color:"#ef4444",unit:"°C",label:"Temp (vertical bar)"}).phase("p1",{duration:1200,title:"寒い帯",body:""},e=>e.activate("coldNode").badge("temp")).phase("p2",{duration:1200,title:"暑い帯まで",body:""},e=>e.activate("coldNode","comfortNode").badge("temp")).phase("p3",{duration:1200,title:"いまの室温",body:"3-lane (Cold <15 / Comfort 15-25 / Hot ≥25) で room 温度を band 別分散、 current indicator (default 24 → comfort lane)、 slider 変化で thermometer readout 縦 bar + 球部 追随、 温度帯分類と thermometer 表示の 2 経路 view。"},e=>e.activate("coldNode","comfortNode","hotNode","currentTemp").badge("temp")).build(),rs="室温を 3-lane (Cold <15°C / Comfort 15-25°C / Hot ≥25°C) 温度帯別分散 + current indicator、 thermometer readout 併存",ds=t("interactive-kpi-icon-tile",{topic:"3 つの指標をアイコン付きのタイルで並べる"}).lane("growth",{x:0,width:220}).lane("revenue",{x:260,width:220}).lane("goals",{x:520,width:220}).arraySignal("kpis",[["📈","Growth","+15%"],["💰","Revenue","$50k"],["🎯","Goals","8/10"]]).node("growthNode",{lane:"growth",stack:0,kind:"card",title:"📈 Growth",subtitle:"前の月からの伸び"}).node("revenueNode",{lane:"revenue",stack:0,kind:"card",title:"💰 Revenue",subtitle:"月ごとの売上"}).node("goalsNode",{lane:"goals",stack:0,kind:"card",title:"🎯 Goals",subtitle:"達成した目標の数"}).readout.iconTile("it",{source:"kpis",color:"#2563eb",label:"KPIs (icon tile)"}).phase("p1",{duration:1800,title:"期の始め",body:"3 枚の札はどれも小さい値を出す。 絵記号と組の並びは変わらず、値だけが低い。"},e=>e.activate("growthNode").set("kpis",'[["📈","Growth","+2%"],["💰","Revenue","$18k"],["🎯","Goals","2/10"]]')).phase("p2",{duration:1800,title:"期の半ば",body:"3 つとも伸びる。 札の位置は動かず、書かれた値だけが上がることが読み取れる。"},e=>e.activate("growthNode","revenueNode").set("kpis",'[["📈","Growth","+9%"],["💰","Revenue","$33k"],["🎯","Goals","5/10"]]')).phase("p3",{duration:1800,title:"期の終わり",body:"目標の大半に届く。 絵記号 + 名前 + 値の 3 点を 1 枚にまとめる形が完成する。"},e=>e.activate("growthNode","revenueNode","goalsNode").set("kpis",'[["📈","Growth","+15%"],["💰","Revenue","$50k"],["🎯","Goals","8/10"]]')).build(),cs="3 KPI (Growth / Revenue / Goals) を 3-lane 個別 tile 分散、 iconTile readout 併存",us=t("interactive-crypto-wallet",{topic:"保有 4 銘柄を値上がり / 値下がりで分ける"}).lane("gainers",{x:0,width:220}).lane("losers",{x:300,width:220}).arraySignal("tokens",[["₿","BTC","0.42",5.3],["Ξ","ETH","12.5",-2.8],["◎","SOL","245",8.1],["Ð","DOGE","8500",-1.4]]).node("btc",{lane:"gainers",stack:0,kind:"card",title:"₿ BTC",subtitle:"上げ幅が中くらい"}).node("sol",{lane:"gainers",stack:1,kind:"card",title:"◎ SOL",subtitle:"上げ幅が最も大きい"}).node("eth",{lane:"losers",stack:0,kind:"card",title:"Ξ ETH",subtitle:"下げ幅が大きい"}).node("doge",{lane:"losers",stack:1,kind:"card",title:"Ð DOGE",subtitle:"下げ幅が小さい"}).readout.tokenList("tl",{source:"tokens",colorUp:"#22c55e",colorDown:"#ef4444",label:"Portfolio (aggregate)"}).phase("p1",{duration:1800,title:"朝の値動き",body:"値動きがどれも小さい。 上げ下げの色は付くが、幅の差はまだ読み取りにくい。"},e=>e.activate("btc","eth").set("tokens",'[["₿","BTC","0.42",0.6],["Ξ","ETH","12.5",-0.4],["◎","SOL","245",1.1],["Ð","DOGE","8500",-0.3]]')).phase("p2",{duration:1800,title:"昼の値動き",body:"値動きが広がる。 保有量は変わらず、増減の割合だけが動くことが読み取れる。"},e=>e.activate("btc","sol","eth").set("tokens",'[["₿","BTC","0.42",2.7],["Ξ","ETH","12.5",-1.5],["◎","SOL","245",4.2],["Ð","DOGE","8500",-0.8]]')).phase("p3",{duration:1800,title:"引けの値動き",body:"上げ 2 銘柄と下げ 2 銘柄の差が最も開く。 緑と赤の対比で組の性格が分かれる。"},e=>e.activate("btc","sol","eth","doge").set("tokens",'[["₿","BTC","0.42",5.3],["Ξ","ETH","12.5",-2.8],["◎","SOL","245",8.1],["Ð","DOGE","8500",-1.4]]')).build(),ps="crypto wallet 4 token を 2-lane (Gainers +% / Losers -%) に分散、 各 token を個別 card、 tokenList readout 併存",bs=t("interactive-world-map",{topic:"5 都市をアジア / 欧米に分けて見せる"}).lane("apac",{x:0,width:220}).lane("amea",{x:300,width:220}).arraySignal("cities",[["Tokyo",100,60],["Paris",60,30],["NYC",30,40],["Sydney",105,75],["Rio",40,65]]).node("tokyo",{lane:"apac",stack:0,kind:"card",title:"Tokyo",subtitle:"最初の拠点 (右寄り・やや下)"}).node("sydney",{lane:"apac",stack:1,kind:"card",title:"Sydney",subtitle:"最も下に出る点"}).node("nyc",{lane:"amea",stack:0,kind:"card",title:"NYC",subtitle:"最も左に出る点"}).node("paris",{lane:"amea",stack:1,kind:"card",title:"Paris",subtitle:"最も上に出る点"}).node("rio",{lane:"amea",stack:2,kind:"card",title:"Rio",subtitle:"左下に出る点"}).readout.mapPin("mp",{source:"cities",xMin:0,xMax:120,yMin:0,yMax:80,viewW:300,viewH:200,color:"#2563eb",label:"World map (2D coord)"}).phase("p1",{duration:1800,title:"拠点は 1 つ",body:"点が 1 つだけ出る。 座標の組が 1 件でも地図として成立することが読み取れる。"},e=>e.activate("tokyo").set("cities",'[["Tokyo",100,60]]')).phase("p2",{duration:1800,title:"西へ広がる",body:"左側に 2 点が加わる。 同じ座標の枠のまま、点の散らばりだけが広がる。"},e=>e.activate("tokyo","nyc","paris").set("cities",'[["Tokyo",100,60],["NYC",30,40],["Paris",60,30]]')).phase("p3",{duration:1800,title:"南半球まで",body:"下側にも点が付き、5 点が枠いっぱいに散る。 左右と上下の広がりが揃う。"},e=>e.activate("tokyo","sydney","nyc","paris","rio").set("cities",'[["Tokyo",100,60],["Paris",60,30],["NYC",30,40],["Sydney",105,75],["Rio",40,65]]')).build(),hs="world map 5 city を 2-lane (Asia-Pacific / America-Europe) に分散、 各 city 個別 node + 座標表記、 mapPin readout 併存",gs=t("interactive-issue-priority",{topic:"課題の優先度を高 / 中 / 低で見せる"}).lane("high",{x:0,width:200}).lane("med",{x:240,width:200}).lane("low",{x:480,width:200}).input.dropdown("prio",{options:["high","med","low"],defaultValue:"high",label:"Priority"}).input.text("desc",{defaultValue:"Fix crash on startup",placeholder:"Issue description",maxLength:60,label:"Description"}).state("prio",{initial:"high"}).state("desc",{initial:"Fix crash on startup"}).node("highNode",{lane:"high",stack:0,kind:"card",title:"▲ High",subtitle:"red · crash / regression"}).node("medNode",{lane:"med",stack:0,kind:"card",title:"● Med",subtitle:"yellow · normal bug"}).node("lowNode",{lane:"low",stack:0,kind:"card",title:"▼ Low",subtitle:"gray · nice-to-have"}).node("currentIssue",{lane:"high",stack:1,kind:"card",title:"◆ Current",subtitle:"prio: {prio} · {desc}"}).readout.priorityBadge("pb",{source:"prio",textSource:"desc",label:"Priority (badge + icon + text)"}).phase("p1",{duration:1200,title:"高い優先度",body:""},e=>e.activate("highNode").badge("issue")).phase("p2",{duration:1200,title:"低い優先度まで",body:""},e=>e.activate("highNode","medNode").badge("issue")).phase("p3",{duration:1200,title:"いまの課題",body:"3-lane (High red ▲ / Med yellow ● / Low gray ▼) で 3 priority level を分散、 各 level 個別 card + 現在 issue の位置 (default=high lane) を currentIssue card で明示、 priorityBadge readout も併存で dropdown 追随 badge 表示、 priority 分類と現在 state の 2 経路 view。"},e=>e.activate("highNode","medNode","lowNode","currentIssue").badge("issue")).build(),ks="issue priority を 3-lane (High ▲ / Med ● / Low ▼) 分散、 現在選択 priority を currentIssue node で明示、 priorityBadge readout 併存",ws=t("interactive-tournament-podium",{topic:"表彰台を中央が 1 位になる並びで見せる"}).lane("silver",{x:0,width:200}).lane("gold",{x:220,width:220}).lane("bronze",{x:460,width:200}).arraySignal("winners",[["Alice","1200 pts"],["Bob","1050 pts"],["Carol","980 pts"]]).node("silverNode",{lane:"silver",stack:0,kind:"card",title:"🥈 2nd Bob",subtitle:"銀 · 中央のすぐ左"}).node("goldNode",{lane:"gold",stack:0,kind:"card",title:"🥇 1st Alice",subtitle:"金 · 中央で最も高い"}).node("bronzeNode",{lane:"bronze",stack:0,kind:"card",title:"🥉 3rd Carol",subtitle:"銅 · 中央のすぐ右"}).readout.podium("pod",{source:"winners",viewW:280,viewH:180,label:"Podium (3 縦 bar 表彰台)"}).phase("p1",{duration:1800,title:"予選の点",body:"予選を終えた点が台の上に出る。 台の高さは順位で決まり、点の大小では変わらない。"},e=>e.activate("goldNode").set("winners",'[["Alice","400 pts"],["Bob","380 pts"],["Carol","350 pts"]]')).phase("p2",{duration:1800,title:"準決勝",body:"点が倍近くに伸びる。 順位が変わらないため、台の形はそのままで数字だけが動く。"},e=>e.activate("goldNode","silverNode").set("winners",'[["Alice","800 pts"],["Bob","700 pts"],["Carol","640 pts"]]')).phase("p3",{duration:1800,title:"決勝の点",body:"最終の点で確定する。 配列の先頭が中央の一番高い台に、続く 2 件が左と右に出る。"},e=>e.activate("goldNode","silverNode","bronzeNode").set("winners",'[["Alice","1200 pts"],["Bob","1050 pts"],["Carol","980 pts"]]')).build(),ms="tournament 1st/2nd/3rd を 3-lane (Silver/Gold/Bronze、 中央=Gold の podium 配列) 分散、 各 winner 個別 card、 podium readout 併存",vs=t("interactive-feature-poll",{topic:"投票結果を 1 位とその他に分ける"}).lane("winner",{x:0,width:220}).lane("runners",{x:300,width:220}).arraySignal("options",[["Dark mode",42],["Faster search",28],["Better API",18],["Nicer UI",12]]).node("dark",{lane:"winner",stack:0,kind:"card",title:"★ Dark mode",subtitle:"票が最も多い案"}).node("search",{lane:"runners",stack:0,kind:"card",title:"Search",subtitle:"次に多い案"}).node("api",{lane:"runners",stack:1,kind:"card",title:"Better API",subtitle:"中ほどの案"}).node("ui",{lane:"runners",stack:2,kind:"card",title:"Nicer UI",subtitle:"最も少ない案"}).readout.pollBar("pb",{source:"options",color:"#a08870",colorWinner:"#2563eb",label:"Results (aggregate)"}).phase("p1",{duration:1800,title:"票が割れる",body:"4 案の割合が近い。 帯は票数でなく全体に占める割合で伸びるため、長さの差が小さい。"},e=>e.activate("dark").set("options",'[["Dark mode",7],["Faster search",6],["Better API",5],["Nicer UI",4]]')).phase("p2",{duration:1800,title:"1 案に集まる",body:"先頭の案が全体の 6 割を占める。 ★ が付いて色も他と変わり、帯が一気に伸びる。"},e=>e.activate("dark","search").set("options",'[["Dark mode",40],["Faster search",13],["Better API",8],["Nicer UI",5]]')).phase("p3",{duration:1800,title:"締め切り",body:"他の案も票を伸ばし、先頭の割合が 4 割まで下がる。 上から順に短くなる形に落ち着く。"},e=>e.activate("dark","search","api","ui").set("options",'[["Dark mode",42],["Faster search",28],["Better API",18],["Nicer UI",12]]')).build(),ys="feature poll 4 option を 2-lane (Winner / Runners-up) に分散、 各 option 個別 card、 pollBar readout 併存",fs=t("interactive-reviewer-stack",{topic:"レビュアー 7 人を 5 人表示と残りで見せる"}).lane("displayed",{x:0,width:340}).lane("overflow",{x:380,width:200}).arraySignal("reviewers",["Alice","Bob Smith","Carol","Dan Kim","Eve","Frank Wu","Grace Lee"]).node("r1",{lane:"displayed",stack:0,kind:"card",title:"Alice",subtitle:"頭文字 A · はじめから居る"}).node("r2",{lane:"displayed",stack:1,kind:"card",title:"Bob Smith",subtitle:"頭文字 BS · はじめから居る"}).node("r3",{lane:"displayed",stack:2,kind:"card",title:"Carol",subtitle:"頭文字 C · はじめから居る"}).node("r4",{lane:"displayed",stack:3,kind:"card",title:"Dan Kim",subtitle:"頭文字 DK · 途中で加わる"}).node("r5",{lane:"displayed",stack:4,kind:"card",title:"Eve",subtitle:"頭文字 E · 上限ちょうど"}).node("r6",{lane:"overflow",stack:0,kind:"card",title:"Frank Wu",subtitle:"頭文字 FW · 上限を超える"}).node("r7",{lane:"overflow",stack:1,kind:"card",title:"Grace Lee",subtitle:"頭文字 GL · 上限を超える"}).readout.userStack("us",{source:"reviewers",max:5,size:36,label:"Reviewers (stacked avatars)"}).phase("p1",{duration:1800,title:"依頼した直後",body:"3 人にだけ声を掛けた状態。 丸が 3 つ重なって並び、余りの表示は出ない。"},e=>e.activate("r1","r2","r3").set("reviewers",'["Alice","Bob Smith","Carol"]')).phase("p2",{duration:1800,title:"上限ちょうど",body:"表示の上限と同じ人数になる。 丸が 5 つ並び、余りの表示はまだ出ない。"},e=>e.activate("r1","r2","r3","r4","r5").set("reviewers",'["Alice","Bob Smith","Carol","Dan Kim","Eve"]')).phase("p3",{duration:1800,title:"上限を超える",body:"上限を超えた 2 人は丸にならず、末尾に残りの人数としてまとめて出る形になる。"},e=>e.activate("r1","r2","r3","r4","r5","r6","r7").set("reviewers",'["Alice","Bob Smith","Carol","Dan Kim","Eve","Frank Wu","Grace Lee"]')).build(),Cs="code review reviewer 7 人 を 2-lane (Displayed 5 / Overflow 2) 分散、 各 reviewer 個別 card、 userStack readout 併存",xs=t("interactive-git-commits",{topic:"5 つのコミットを種別ごとに並べる"}).lane("col1",{x:0,width:350}).lane("col2",{x:390,width:360}).lane("col3",{x:790,width:350}).arraySignal("commits",[["a1b2c3d","feat: add sankey primitive","Alice"],["e5f6g7h","fix: circular gauge angle bug","Bob"],["i9j0k1l","docs: update SKILL.md","Carol"],["m3n4o5p","refactor: extract widget dispatcher","Dan"],["q7r8s9t","test: add builder chain coverage","Eve"]]).node("featNode",{lane:"col1",stack:0,kind:"card",w:280,title:"feat",subtitle:"機能を足す (Alice)"}).node("fixNode",{lane:"col2",stack:0,kind:"card",w:310,title:"fix",subtitle:"不具合を直す (Bob)"}).node("docsNode",{lane:"col3",stack:0,kind:"card",w:300,title:"docs",subtitle:"説明を書く (Carol)"}).node("refactorNode",{lane:"col1",stack:1,kind:"card",w:300,title:"refactor",subtitle:"構造を整える (Dan)"}).node("testNode",{lane:"col2",stack:1,kind:"card",w:270,title:"test",subtitle:"検査を足す (Eve)"}).readout.commitList("cl",{source:"commits",max:5,color:"#2563eb",label:"History (git log)"}).phase("p1",{duration:1800,title:"1 件目",body:"履歴に 1 行だけ並ぶ。 短い名前と要約と書いた人の 3 つが 1 行に収まる形が読める。"},e=>e.activate("featNode").set("commits",'[["a1b2c3d","feat: add sankey primitive","Alice"]]')).phase("p2",{duration:1800,title:"積み上がる",body:"行が増えて履歴らしくなる。 先頭に新しいものが来る並びであることが読み取れる。"},e=>e.activate("featNode","fixNode","docsNode").set("commits",'[["i9j0k1l","docs: update SKILL.md","Carol"],["e5f6g7h","fix: circular gauge angle bug","Bob"],["a1b2c3d","feat: add sankey primitive","Alice"]]')).phase("p3",{duration:1800,title:"表示の上限",body:"表示できる行数いっぱいまで埋まる。 種類の違う 5 行が縦に並ぶ形で落ち着く。"},e=>e.activate("featNode","fixNode","docsNode","refactorNode","testNode").set("commits",'[["q7r8s9t","test: add builder chain coverage","Eve"],["m3n4o5p","refactor: extract widget dispatcher","Dan"],["i9j0k1l","docs: update SKILL.md","Carol"],["e5f6g7h","fix: circular gauge angle bug","Bob"],["a1b2c3d","feat: add sankey primitive","Alice"]]')).build(),Ss="5 git commit を 5 区画 (feat / fix / docs / refactor / test) 3 列 2 段で commit type 別分散、 各 commit 個別 card、 commitList readout 併存",Ns=t("interactive-audio-player",{topic:"再生位置と再生状態から時間表示を作る"}).lane("current",{x:0,width:220}).lane("toggle",{x:260,width:200}).lane("duration",{x:500,width:220}).input.slider("current",{min:0,max:240,defaultValue:65,label:"Current sec"}).input.toggle("playing",{defaultValue:!0,label:"Playing"}).state("current",{initial:65}).state("duration",{initial:240}).state("playing",{initial:"true"}).node("currentNode",{lane:"current",stack:0,kind:"card",title:"Current time",subtitle:"{current}s / 240s (slider driven)"}).node("toggleNode",{lane:"toggle",stack:0,kind:"card",title:"Play toggle",subtitle:"playing = {playing} (▶/❚❚ icon)"}).node("durationNode",{lane:"duration",stack:0,kind:"card",title:"Duration",subtitle:"240s total (fixed)"}).edge("currentNode","durationNode",{label:"progress %",tone:"info"}).edge("toggleNode","currentNode",{label:"advance/pause",tone:"success"}).readout.mediaPlayer("mp",{source:"current",durationSource:"duration",playingSource:"playing",color:"#2563eb",viewW:320,label:"Player (icon + progress + MM:SS)"}).phase("p1",{duration:1200,title:"再生位置",body:""},e=>e.activate("currentNode").badge("media")).phase("p2",{duration:1200,title:"再生状態",body:""},e=>e.activate("currentNode","toggleNode").badge("media")).phase("p3",{duration:1200,title:"時間表示",body:"3-lane (Current / Play toggle / Duration) で audio player 3 signal を分散、 2 edge (progress info / advance success) で 3 signal の相互関係明示、 slider + toggle 変化で mediaPlayer readout が icon + progress + MM:SS 追随、 player 構造を lane で可視化。"},e=>e.activate("currentNode","toggleNode","durationNode").badge("media")).build(),As="audio player を 3-lane (Current time / Play toggle / Duration) + 2 edge、 signal 制御と mediaPlayer readout の bind 関係可視化",Ps=t("interactive-server-event-log",{topic:"サーバのログ 5 件を重要度で分ける"}).lane("info",{x:0,width:160}).lane("debug",{x:200,width:160}).lane("warn",{x:400,width:160}).lane("error",{x:600,width:160}).arraySignal("events",[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"],["10:24:58","warn","High CPU usage: 82%"],["10:25:34","error","DB connection timeout after 5s"],["10:26:01","info","Retry connection succeeded"]]).node("info1",{lane:"info",stack:0,kind:"card",title:"ℹ 起動",subtitle:"待ち受けを始めた知らせ"}).node("info2",{lane:"info",stack:1,kind:"card",title:"ℹ 復帰",subtitle:"つなぎ直しに成功した知らせ"}).node("debug1",{lane:"debug",stack:0,kind:"card",title:"· 設定",subtitle:"設定を読んだ記録"}).node("warn1",{lane:"warn",stack:0,kind:"card",title:"⚠ 負荷",subtitle:"計算資源の使い過ぎ"}).node("error1",{lane:"error",stack:0,kind:"card",title:"✕ 切断",subtitle:"つなぎ先が応じない"}).readout.eventLog("el",{source:"events",max:10,label:"Events (timeline)"}).phase("p1",{duration:1800,title:"平常の記録",body:"知らせと記録だけが並ぶ。 重さの違いで行の印と色が変わることが読み取れる。"},e=>e.activate("info1","debug1").set("events",'[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"]]')).phase("p2",{duration:1800,title:"異常が出る",body:"注意と失敗が続けて出る。 下に行くほど新しく、重い行が末尾に積まれる。"},e=>e.activate("info1","debug1","warn1","error1").set("events",'[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"],["10:24:58","warn","High CPU usage: 82%"],["10:25:34","error","DB connection timeout after 5s"]]')).phase("p3",{duration:1800,title:"復帰する",body:"最後に成功の知らせが付く。 4 段階の重さが 1 本の時系列に混じる形が完成する。"},e=>e.activate("info1","info2","debug1","warn1","error1").set("events",'[["10:23:45","info","Server started on port 3000"],["10:24:12","debug","Loaded config from ~/.env"],["10:24:58","warn","High CPU usage: 82%"],["10:25:34","error","DB connection timeout after 5s"],["10:26:01","info","Retry connection succeeded"]]')).build(),Bs="server monitoring event log 5 event を 4-lane (info / debug / warn / error) severity 別に分散、 eventLog readout 併存",_s=t("interactive-search-results",{topic:"検索結果を文書 / ツールに分ける"}).lane("docs",{x:0,width:340}).lane("tools",{x:380,width:300}).arraySignal("hits",[["Rust playground","Interactive code sandbox for Rust programming language","play.rust-lang.org"],["MDN Web Docs","Documentation for web technologies","developer.mozilla.org"],["TypeScript Handbook","Official TS learning guide","typescriptlang.org/docs"],["React docs","React reference documentation","react.dev"],["Vite guide","Frontend build tool guide","vitejs.dev"]]).node("mdnNode",{lane:"docs",stack:0,kind:"card",title:"MDN Web Docs",subtitle:"developer.mozilla.org"}).node("tsNode",{lane:"docs",stack:1,kind:"card",title:"TS Handbook",subtitle:"typescriptlang.org/docs"}).node("reactNode",{lane:"docs",stack:2,kind:"card",title:"React docs",subtitle:"react.dev"}).node("viteNode",{lane:"docs",stack:3,kind:"card",title:"Vite guide",subtitle:"vitejs.dev"}).node("rustNode",{lane:"tools",stack:0,kind:"card",title:"Rust",subtitle:"play.rust-lang.org (interactive)"}).readout.searchResult("sr",{source:"hits",max:5,color:"#2563eb",label:"Results (link + snippet + url)"}).phase("p1",{duration:1800,title:"広い語で引く",body:"当たりが多く、表示できる上限まで並ぶ。 題と短い抜粋と所在の 3 行が 1 件を作る。"},e=>e.activate("mdnNode","tsNode","reactNode","viteNode","rustNode").set("hits",'[["Rust playground","Interactive code sandbox for Rust programming language","play.rust-lang.org"],["MDN Web Docs","Documentation for web technologies","developer.mozilla.org"],["TypeScript Handbook","Official TS learning guide","typescriptlang.org/docs"],["React docs","React reference documentation","react.dev"],["Vite guide","Frontend build tool guide","vitejs.dev"]]')).phase("p2",{duration:1800,title:"語を足す",body:"当たりが絞られる。 件数が減っても 1 件の形は変わらないことが読み取れる。"},e=>e.activate("mdnNode","tsNode","reactNode").set("hits",'[["MDN Web Docs","Documentation for web technologies","developer.mozilla.org"],["TypeScript Handbook","Official TS learning guide","typescriptlang.org/docs"],["React docs","React reference documentation","react.dev"]]')).phase("p3",{duration:1800,title:"絞り切る",body:"当たりが 1 件だけ残る。 抜粋が長い時に折り返さず端を切る形が見て取れる。"},e=>e.activate("rustNode").set("hits",'[["Rust playground","Interactive code sandbox for Rust programming language","play.rust-lang.org"]]')).build(),Ds="search hit 5 を 2-lane (Docs 4 / Interactive tool 1) 分散、 各 hit 個別 card、 searchResult readout 併存",Ts=t("interactive-year-roadmap",{topic:"年間の計画を四半期ごとに並べる"}).lane("q1",{x:0,width:150}).lane("q2",{x:170,width:150}).lane("q3",{x:340,width:150}).lane("q4",{x:510,width:150}).arraySignal("plan",[["Q1",["Design system","MVP feature A"]],["Q2",["Beta launch","Feature B","Feedback loop"]],["Q3",["Scale infra","Enterprise deals"]],["Q4",["Public GA","Series A"]]]).node("q1Head",{lane:"q1",stack:0,kind:"card",title:"Q1 (Jan-Mar)",subtitle:"Design + MVP"}).node("q1Item1",{lane:"q1",stack:1,kind:"card",title:"Design",subtitle:"foundation"}).node("q1Item2",{lane:"q1",stack:2,kind:"card",title:"MVP feature",subtitle:"prototype"}).node("q2Head",{lane:"q2",stack:0,kind:"card",title:"Q2 (Apr-Jun)",subtitle:"Beta + growth"}).node("q2Item1",{lane:"q2",stack:1,kind:"card",title:"Beta launch",subtitle:"public beta"}).node("q2Item2",{lane:"q2",stack:2,kind:"card",title:"Feature B",subtitle:"beta scope"}).node("q3Head",{lane:"q3",stack:0,kind:"card",title:"Q3 (Jul-Sep)",subtitle:"Scale + enterprise"}).node("q3Item1",{lane:"q3",stack:1,kind:"card",title:"Scale infra",subtitle:"capacity"}).node("q3Item2",{lane:"q3",stack:2,kind:"card",title:"Enterprise",subtitle:"企業向けの売上"}).node("q4Head",{lane:"q4",stack:0,kind:"card",title:"Q4 (Oct-Dec)",subtitle:"GA + funding"}).node("q4Item1",{lane:"q4",stack:1,kind:"card",title:"Public GA",subtitle:"general available"}).node("q4Item2",{lane:"q4",stack:2,kind:"card",title:"Series A",subtitle:"growth capital"}).edge("q1Head","q2Head",{label:"handover",tone:"info"}).edge("q2Head","q3Head",{label:"scale",tone:"accent"}).edge("q3Head","q4Head",{label:"GA",tone:"success"}).readout.roadmap("rm",{source:"plan",viewW:400,viewH:200,label:"Roadmap (4 column list)"}).phase("p1",{duration:1800,title:"手前だけ決まる",body:"最初の列にだけ項目が入る。 残り 3 列は枠だけが立ち、まだ中身を持たない。"},e=>e.activate("q1Head","q1Item1","q1Item2").set("plan",'[["Q1",["Design system","MVP feature A"]],["Q2",[]],["Q3",[]],["Q4",[]]]')).phase("p2",{duration:1800,title:"半年先まで",body:"2 列目が埋まる。 列ごとに項目数が違ってよいことが、長さの差から読み取れる。"},e=>e.activate("q1Head","q2Head","q2Item1","q2Item2").set("plan",'[["Q1",["Design system","MVP feature A"]],["Q2",["Beta launch","Feature B","Feedback loop"]],["Q3",[]],["Q4",[]]]')).phase("p3",{duration:1800,title:"年内が揃う",body:"4 列すべてに項目が入る。 期をまたぐ引き継ぎの矢印が左から右へ通る形になる。"},e=>e.activate("q1Head","q2Head","q3Head","q4Head").set("plan",'[["Q1",["Design system","MVP feature A"]],["Q2",["Beta launch","Feature B","Feedback loop"]],["Q3",["Scale infra","Enterprise deals"]],["Q4",["Public GA","Series A"]]]')).build(),Is="2026 yearly roadmap を 4-lane (Q1-Q4) 分散、 各 quarter items を stack 分散、 quarterly 遷移 3 edge、 roadmap readout 併存",Rs=t("interactive-week-weather",{topic:"5 日間の天気を晴 / 曇雨 / 雷で分ける"}).lane("sunny",{x:0,width:220}).lane("cloudy",{x:260,width:220}).lane("thunder",{x:520,width:200}).arraySignal("forecast",[["Mon","☀",24,18],["Tue","☁",22,17],["Wed","☂",19,15],["Thu","⚡",17,13],["Fri","☀",25,19]]).node("monNode",{lane:"sunny",stack:0,kind:"card",title:"☀ Mon",subtitle:"晴れ · 週の始まり"}).node("friNode",{lane:"sunny",stack:1,kind:"card",title:"☀ Fri",subtitle:"晴れ · 週で最も暖かい"}).node("tueNode",{lane:"cloudy",stack:0,kind:"card",title:"☁ Tue",subtitle:"曇り · 下り坂の入口"}).node("wedNode",{lane:"cloudy",stack:1,kind:"card",title:"☂ Wed",subtitle:"雨 · 気温が下がる"}).node("thuNode",{lane:"thunder",stack:0,kind:"card",title:"⚡ Thu",subtitle:"雷 · 週で最も寒い"}).readout.weatherForecast("wf",{source:"forecast",label:"Week (5-day forecast)"}).phase("p1",{duration:1800,title:"3 日前の予報",body:"5 日分が低めの気温で出る。 記号は週を通して変わらず、数字だけが暫定で並ぶ。"},e=>e.activate("monNode","tueNode").set("forecast",'[["Mon","☀",21,16],["Tue","☁",20,15],["Wed","☂",18,14],["Thu","⚡",16,12],["Fri","☀",22,17]]')).phase("p2",{duration:1800,title:"前日の予報",body:"気温が上に振れる。 高い方と低い方が 1 列で対になって出ることが読み取れる。"},e=>e.activate("monNode","tueNode","wedNode").set("forecast",'[["Mon","☀",23,17],["Tue","☁",21,16],["Wed","☂",19,15],["Thu","⚡",17,13],["Fri","☀",24,18]]')).phase("p3",{duration:1800,title:"当日の予報",body:"最終の気温で確定する。 最も暖かい日と最も寒い日の差が 5 列の中で読み取れる。"},e=>e.activate("monNode","friNode","tueNode","wedNode","thuNode").set("forecast",'[["Mon","☀",24,18],["Tue","☁",22,17],["Wed","☂",19,15],["Thu","⚡",17,13],["Fri","☀",25,19]]')).build(),Es="5-day weather を 3-lane (Sunny ☀ / Cloudy/Rainy / Thunder ⚡) 天気別分散、 各 day 個別 card、 weatherForecast readout 併存",Ms=t("interactive-tutorial-videos",{topic:"解説動画 3 本を言語ごとに分ける"}).lane("rust",{x:0,width:220}).lane("ts",{x:260,width:220}).lane("react",{x:520,width:220}).arraySignal("videos",[["🎬","Rust intro for beginners","12:45","24k"],["🎥","TypeScript deep dive","45:20","82k"],["📺","React hooks explained","18:30","156k"]]).node("rustVideo",{lane:"rust",stack:0,kind:"card",title:"🎬 Rust",subtitle:"最初に出す 1 本"}).node("tsVideo",{lane:"ts",stack:0,kind:"card",title:"🎥 TS deep",subtitle:"最も長い 1 本"}).node("reactVideo",{lane:"react",stack:0,kind:"card",title:"📺 React",subtitle:"最も見られている 1 本"}).readout.videoCard("vc",{source:"videos",max:5,color:"#ef4444",label:"Videos (thumbnail list)"}).phase("p1",{duration:1800,title:"1 本だけ出す",body:"行が 1 つだけ並ぶ。 絵記号と題と長さと再生数の 4 つが 1 行に収まる形が読める。"},e=>e.activate("rustVideo").set("videos",'[["🎬","Rust intro for beginners","12:45","24k"]]')).phase("p2",{duration:1800,title:"2 本に増える",body:"行が 2 つになる。 長さと再生数はどちらも文字として出るだけで、幅には効かない。"},e=>e.activate("rustVideo","tsVideo").set("videos",'[["🎬","Rust intro for beginners","12:45","24k"],["🎥","TypeScript deep dive","45:20","82k"]]')).phase("p3",{duration:1800,title:"3 本が揃う",body:"3 行が縦に並ぶ。 各行に絵記号と題と長さと再生数の 4 つがそのまま出る。"},e=>e.activate("rustVideo","tsVideo","reactVideo").set("videos",'[["🎬","Rust intro for beginners","12:45","24k"],["🎥","TypeScript deep dive","45:20","82k"],["📺","React hooks explained","18:30","156k"]]')).build(),Ls="tutorial video 3 本 を 3-lane (Rust / TypeScript / React) topic 別分散、 各 video 個別 card、 videoCard readout 併存",Os=t("interactive-shipping-status",{topic:"配送状況を 4 段階で追う"}).lane("col1",{x:0,width:340}).lane("col2",{x:380,width:340}).input.stepper("current",{min:0,max:3,defaultValue:2,label:"Step"}).state("current",{initial:2}).arraySignal("steps",["Packed","Shipped","Out for delivery","Delivered"]).node("packedNode",{lane:"col1",stack:0,kind:"card",w:250,title:"📦 Packed",subtitle:"梱包完了"}).node("shippedNode",{lane:"col2",stack:0,kind:"card",w:270,title:"🚚 Shipped",subtitle:"配送開始"}).node("deliveryNode",{lane:"col1",stack:1,kind:"card",w:290,title:"🏠 Delivery",subtitle:"配達中 (現在地)"}).node("deliveredNode",{lane:"col2",stack:1,kind:"card",w:290,title:"✅ Delivered",subtitle:"配達完了"}).edge("packedNode","shippedNode",{label:"handover",tone:"success"}).edge("shippedNode","deliveryNode",{label:"in transit",tone:"info"}).edge("deliveryNode","deliveredNode",{label:"arrived",tone:"warning"}).readout.orderStatus("os",{source:"current",stepsSource:"steps",color:"#2563eb",label:"Delivery status (icon strip)"}).phase("p1",{duration:1200,title:"梱包と発送",body:""},e=>e.activate("packedNode").badge("tracking")).phase("p2",{duration:1200,title:"配達中まで",body:""},e=>e.activate("packedNode","shippedNode").badge("tracking")).phase("p3",{duration:1200,title:"配達完了",body:"4 区画 pipeline (Packed / Shipped / Out for delivery / Delivered) を 2 列 2 段に置いて + 3 edge で配送状態遷移を node network 化、 tone で段階分類 (success=出荷 / info=輸送中 / warning=到着)、 orderStatus readout も併存で icon strip 表示。"},e=>e.activate("packedNode","shippedNode","deliveryNode","deliveredNode").badge("tracking")).build(),Fs="e-commerce 配送追跡 4 step (📦→🚚→🏠→✅) を 2 列 2 段の pipeline + 3 edge で状態遷移 network 化、 orderStatus readout 併存",Hs=t("interactive-team-attendance",{topic:"4 人 × 5 日の出欠を並べる"}).lane("alice",{x:0,width:330}).lane("bob",{x:350,width:330}).lane("carol",{x:700,width:370}).lane("dan",{x:1090,width:300}).arraySignal("attendance",[["Mon",!0,!0,!1,!0],["Tue",!0,!1,!0,!0],["Wed",!0,!0,!0,!0],["Thu",!1,!0,!0,!0],["Fri",!0,!0,!1,!0]]).arraySignal("members",["Alice","Bob","Carol","Dan"]).node("aliceCard",{lane:"alice",stack:0,kind:"card",w:280,title:"Alice",subtitle:"1 列目の人"}).node("bobCard",{lane:"bob",stack:0,kind:"card",w:280,title:"Bob",subtitle:"2 列目の人"}).node("carolCard",{lane:"carol",stack:0,kind:"card",w:320,title:"Carol",subtitle:"3 列目の人"}).node("danCard",{lane:"dan",stack:0,kind:"card",w:250,title:"Dan",subtitle:"4 列目の人 (欠けが無い)"}).readout.attendanceGrid("ag",{source:"attendance",membersSource:"members",color:"#22c55e",label:"Attendance (5 day × 4 member grid)"}).phase("p1",{duration:1800,title:"週の初め",body:"1 行だけ埋まる。 行が日、列が人で、印の有無だけを塗り分ける形が読める。"},e=>e.activate("aliceCard").set("attendance",'[["Mon",true,true,false,true]]')).phase("p2",{duration:1800,title:"週の半ば",body:"行が 3 つに増える。 欠けた升目が縦に並ぶかどうかで、人ごとの傾向が読める。"},e=>e.activate("aliceCard","bobCard").set("attendance",'[["Mon",true,true,false,true],["Tue",true,false,true,true],["Wed",true,true,true,true]]')).phase("p3",{duration:1800,title:"週の終わり",body:"5 行が揃う。 端の列だけ欠けが無く、他の列に穴が散ることが一目で読める。"},e=>e.activate("aliceCard","bobCard","carolCard","danCard").set("attendance",'[["Mon",true,true,false,true],["Tue",true,false,true,true],["Wed",true,true,true,true],["Thu",false,true,true,true],["Fri",true,true,false,true]]')).build(),Ws="5 day × 4 member attendance を 4-lane (Alice/Bob/Carol/Dan) member 別分散、 各 member weekly summary + attendanceGrid readout 併存",qs=t("interactive-timezone-clock",{topic:"4 都市の現地時刻を並べる"}).lane("tokyo",{x:0,width:230}).lane("london",{x:250,width:230}).lane("nyc",{x:500,width:230}).lane("sydney",{x:750,width:240}).arraySignal("clocks",[["Tokyo",9,"22:30"],["London",0,"13:30"],["NYC",-5,"08:30"],["Sydney",11,"00:30"]]).node("tokyoNode",{lane:"tokyo",stack:0,kind:"card",w:180,title:"Tokyo",subtitle:"時差が進んでいる側の都市"}).node("londonNode",{lane:"london",stack:0,kind:"card",w:180,title:"London",subtitle:"時差の基準となる都市"}).node("nycNode",{lane:"nyc",stack:0,kind:"card",w:180,title:"NYC",subtitle:"時差が最も遅れている都市"}).node("sydneyNode",{lane:"sydney",stack:0,kind:"card",w:190,title:"Sydney",subtitle:"時差が最も進んでいる都市"}).readout.timezoneClock("tc",{source:"clocks",color:"#2563eb",label:"Cities (4-column grid)"}).phase("p1",{duration:1800,title:"朝の会",body:"4 都市の時刻が並ぶ。 都市名と時刻と時差の 3 つが 1 枠に収まる形が読める。"},e=>e.activate("londonNode").set("clocks",'[["Tokyo",9,"17:00"],["London",0,"08:00"],["NYC",-5,"03:00"],["Sydney",11,"19:00"]]')).phase("p2",{duration:1800,title:"昼の会",body:"時刻だけが進む。 時差は動かないため、4 枠の並びと差はそのまま保たれる。"},e=>e.activate("londonNode","nycNode").set("clocks",'[["Tokyo",9,"22:00"],["London",0,"13:00"],["NYC",-5,"08:00"],["Sydney",11,"00:00"]]')).phase("p3",{duration:1800,title:"夜の会",body:"先に進む都市だけ日付をまたぐ。 時差の符号がそのまま時刻の前後になることが読める。"},e=>e.activate("tokyoNode","londonNode","nycNode","sydneyNode").set("clocks",'[["Tokyo",9,"01:30"],["London",0,"16:30"],["NYC",-5,"11:30"],["Sydney",11,"03:30"]]')).build(),Gs="4 city timezone を 4-lane (Tokyo / London / NYC / Sydney) 都市別分散、 各 city 個別 card、 timezoneClock readout 併存",Vs=t("interactive-signup-form",{topic:"登録項目 5 つを意味ごとに分ける"}).lane("personal",{x:0,width:220}).lane("contact",{x:260,width:220}).lane("prefs",{x:520,width:200}).arraySignal("fields",[["Name","Alice Wonderland"],["Email","alice@example.com"],["Age","28"],["Country","Japan"],["Newsletter","Yes"]]).node("nameNode",{lane:"personal",stack:0,kind:"card",title:"Name",subtitle:"本人を表す項目"}).node("ageNode",{lane:"personal",stack:1,kind:"card",title:"Age",subtitle:"本人を表す項目 (数)"}).node("emailNode",{lane:"contact",stack:0,kind:"card",title:"Email",subtitle:"連絡先の項目"}).node("countryNode",{lane:"contact",stack:1,kind:"card",title:"Country",subtitle:"連絡先の項目 (所在)"}).node("newsletterNode",{lane:"prefs",stack:0,kind:"card",title:"Newsletter",subtitle:"希望を表す項目"}).readout.formSummary("fs",{source:"fields",color:"#2563eb",label:"Submission (dl/dt/dd)"}).phase("p1",{duration:1800,title:"入力の途中",body:"本人の項目だけが埋まる。 項目名と値の組が上下に並ぶ形が読める。"},e=>e.activate("nameNode","ageNode").set("fields",'[["Name","Alice Wonderland"],["Age","28"]]')).phase("p2",{duration:1800,title:"連絡先まで",body:"組が 4 つに増える。 値の長さが違っても項目名の位置が揃うことが読み取れる。"},e=>e.activate("nameNode","ageNode","emailNode","countryNode").set("fields",'[["Name","Alice Wonderland"],["Age","28"],["Email","alice@example.com"],["Country","Japan"]]')).phase("p3",{duration:1800,title:"送信の直前",body:"希望の項目まで埋まる。 送る内容が 1 か所にまとまって確認できる形になる。"},e=>e.activate("nameNode","ageNode","emailNode","countryNode","newsletterNode").set("fields",'[["Name","Alice Wonderland"],["Age","28"],["Email","alice@example.com"],["Country","Japan"],["Newsletter","Yes"]]')).build(),Us="signup form 5 field を 3-lane (Personal / Contact / Prefs) semantic 分類、 各 field 個別 card、 formSummary readout 併存",Qs=t("interactive-playlist-queue",{topic:"再生待ち 5 曲を再生済 / 再生中 / 次にで分ける"}).lane("played",{x:0,width:200}).lane("now",{x:240,width:220}).lane("next",{x:500,width:220}).input.stepper("cur",{min:0,max:4,defaultValue:1,label:"Current index"}).state("cur",{initial:1}).arraySignal("queue",[["Bohemian Rhapsody","Queen","5:55"],["Hotel California","Eagles","6:30"],["Stairway to Heaven","Led Zeppelin","8:02"],["Sweet Child O' Mine","Guns N' Roses","5:56"],["Imagine","John Lennon","3:03"]]).node("song0",{lane:"played",stack:0,kind:"card",title:"✓ Bohemian",subtitle:"Queen · 5:55 (played)"}).node("song1",{lane:"now",stack:0,kind:"card",title:"▶ Hotel",subtitle:"Eagles · 6:30 (now playing)"}).node("song2",{lane:"next",stack:0,kind:"card",title:"Stairway",subtitle:"Led Zeppelin · 8:02"}).node("song3",{lane:"next",stack:1,kind:"card",title:"Sweet Child",subtitle:"Guns N' Roses · 5:56"}).node("song4",{lane:"next",stack:2,kind:"card",title:"Imagine",subtitle:"John Lennon · 3:03"}).readout.songQueue("sq",{source:"queue",currentSource:"cur",max:8,color:"#2563eb",label:"Queue (current highlight)"}).phase("p1",{duration:1200,title:"再生済",body:""},e=>e.activate("song0").badge("music")).phase("p2",{duration:1200,title:"再生中",body:""},e=>e.activate("song0","song1","song2").badge("music")).phase("p3",{duration:1200,title:"次に続く",body:"3-lane (Played 過去 / Now Playing 現在 / Up Next 未来) で 5 song を playback state 別分散、 default current=1 の状態を lane 配置で明示、 各 song 個別 card、 songQueue readout も併存で highlight 追随、 timeline 状態と queue の 2 経路 view。"},e=>e.activate("song0","song1","song2","song3","song4").badge("music")).build(),js="playlist queue 5 song を 3-lane (Played / Now Playing / Up Next) 状態別分散、 各 song 個別 card、 songQueue readout 併存";function x(e=[3,8,12,17,22,26],n=13){const s=[],b=new Set(e);for(let u=1;u<=31;u++)s.push([u,b.has(u),u===n]);return s}const Js=t("interactive-month-calendar",{topic:"1 か月を週ごとに並べる"}).lane("w1",{x:0,width:150}).lane("w2",{x:170,width:150}).lane("w3",{x:340,width:150}).lane("w4",{x:510,width:200}).arraySignal("days",x()).node("w1Card",{lane:"w1",stack:0,kind:"card",title:"Week 1",subtitle:"月の最初の週"}).node("w2Card",{lane:"w2",stack:0,kind:"card",title:"Week 2",subtitle:"今日を含む週"}).node("w3Card",{lane:"w3",stack:0,kind:"card",title:"Week 3",subtitle:"月の半ばの週"}).node("w4Card",{lane:"w4",stack:0,kind:"card",title:"Week 4-5",subtitle:"月の終わりの週"}).node("monthSummary",{lane:"w4",stack:1,kind:"card",title:"Month total",subtitle:"月ぜんたいのまとめ"}).readout.calendarMonth("cm",{source:"days",monthName:"January 2026",color:"#2563eb",label:"Month view (7 column grid)"}).phase("p1",{duration:1800,title:"月の初め",body:"予定の印が前半に 2 つだけ付く。 升目の数は変わらず、印の有無だけが変わる。"},e=>e.activate("w1Card","w2Card").set("days",JSON.stringify(x([3,8])))).phase("p2",{duration:1800,title:"月の半ば",body:"印が半ばまで広がる。 今日の升目だけ別の色で囲われることが読み取れる。"},e=>e.activate("w1Card","w2Card","w3Card").set("days",JSON.stringify(x([3,8,12,17])))).phase("p3",{duration:1800,title:"月の終わり",body:"印が月の終わりまで並ぶ。 7 列の格子に予定の散らばりが読める形になる。"},e=>e.activate("w1Card","w2Card","w3Card","w4Card","monthSummary").set("days",JSON.stringify(x([3,8,12,17,22,26])))).build(),Ys="January 2026 calendar を 4-lane (Week 1 / Week 2 / Week 3 / Week 4-5) 週別分散、 各週 summary + calendarMonth readout 併存",zs=t("interactive-cli-terminal",{topic:"コマンド 5 つを用途ごとに分ける"}).lane("fs",{x:0,width:220}).lane("git",{x:260,width:220}).lane("dev",{x:520,width:220}).arraySignal("cmds",[["$","ls -la",`total 42
drwxr-xr-x  8 user 256 Jan 13 08:00 .
-rw-r--r--  1 user 1240 Jan 13 07:55 README.md`],["$","cd projects",""],["$","git status",`On branch main
nothing to commit, working tree clean`],["$","pnpm test",`Test Files  114 passed
Tests  1649 passed`],["$","docker ps",`CONTAINER ID   IMAGE
8f3a2b1c9d   nginx:latest`]]).node("lsNode",{lane:"fs",stack:0,kind:"card",title:"ls -la",subtitle:"file を見る · 出力が長い"}).node("cdNode",{lane:"fs",stack:1,kind:"card",title:"cd projects",subtitle:"場所を移る · 出力が無い"}).node("gitStatusNode",{lane:"git",stack:0,kind:"card",title:"git status",subtitle:"履歴の状態を見る"}).node("pnpmNode",{lane:"dev",stack:0,kind:"card",title:"pnpm test",subtitle:"検査を回す"}).node("dockerNode",{lane:"dev",stack:1,kind:"card",title:"docker ps",subtitle:"動いている入れ物を見る"}).readout.terminal("tm",{source:"cmds",max:10,color:"var(--d-dg-2)",label:"Session (CLI window)"}).phase("p1",{duration:1800,title:"打ち始め",body:"1 つ目の命令と、その返事が出る。 促す記号と命令と返事の 3 つが 1 組になる。"},e=>e.activate("lsNode").set("cmds",'[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 .\\n-rw-r--r--  1 user 1240 Jan 13 07:55 README.md"]]')).phase("p2",{duration:1800,title:"場所を移る",body:"返事を持たない命令が続く。 返事が空でも組は 1 つ増えることが読み取れる。"},e=>e.activate("lsNode","cdNode","gitStatusNode").set("cmds",'[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 ."],["$","cd projects",""],["$","git status","On branch main\\nnothing to commit, working tree clean"]]')).phase("p3",{duration:1800,title:"作業が進む",body:"組が 5 つ並ぶ。 返事の行数が違っても、次の命令が続けて下に出る形が読める。"},e=>e.activate("lsNode","cdNode","gitStatusNode","pnpmNode","dockerNode").set("cmds",'[["$","ls -la","total 42\\ndrwxr-xr-x  8 user 256 Jan 13 08:00 ."],["$","cd projects",""],["$","git status","On branch main\\nnothing to commit, working tree clean"],["$","pnpm test","Test Files  114 passed\\nTests  1649 passed"],["$","docker ps","CONTAINER ID   IMAGE\\n8f3a2b1c9d   nginx:latest"]]')).build(),$s="CLI 5 command を 3-lane (Filesystem / Git / Dev) tool category 別分散、 各 command 個別 card、 terminal readout 併存",Ks=t("interactive-chess-board",{topic:"駒 32 個を白黒と前後列で並べる"}).lane("blackBack",{x:0,width:320}).lane("blackPawn",{x:340,width:340}).lane("whitePawn",{x:700,width:340}).lane("whiteBack",{x:1060,width:320}).arraySignal("pieces",[["a",8,"♜"],["b",8,"♞"],["c",8,"♝"],["d",8,"♛"],["e",8,"♚"],["f",8,"♝"],["g",8,"♞"],["h",8,"♜"],["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]).node("blackBackNode",{lane:"blackBack",stack:0,kind:"card",w:270,title:"Black back",subtitle:"黒の奥の列 (♜♞♝♛♚♝♞♜)"}).node("blackPawnNode",{lane:"blackPawn",stack:0,kind:"card",w:290,title:"Black pawns",subtitle:"黒の手前の列 (♟)"}).node("whitePawnNode",{lane:"whitePawn",stack:0,kind:"card",w:290,title:"White pawns",subtitle:"白の手前の列 (♙)"}).node("whiteBackNode",{lane:"whiteBack",stack:0,kind:"card",w:270,title:"White back",subtitle:"白の奥の列 (♖♘♗♕♔♗♘♖)"}).readout.chessBoard("cb",{source:"pieces",cellSize:28,label:"Position (8×8 board)"}).phase("p1",{duration:1800,title:"白を並べる",body:"白の 2 列だけを置く。 升目の明暗は駒と関係なく、置いた場所にだけ駒が乗る。"},e=>e.activate("whiteBackNode","whitePawnNode").set("pieces",'[["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]')).phase("p2",{duration:1800,title:"黒の手前を置く",body:"反対側の手前の列が埋まる。 縦の位置は数、横の位置は文字で決まることが読める。"},e=>e.activate("whiteBackNode","whitePawnNode","blackPawnNode").set("pieces",'[["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]')).phase("p3",{duration:1800,title:"開始の形",body:"上下の端 2 列ずつが埋まり、中央 4 列が空く。 開始の形が盤の上に揃う。"},e=>e.activate("blackBackNode","blackPawnNode","whitePawnNode","whiteBackNode").set("pieces",'[["a",8,"♜"],["b",8,"♞"],["c",8,"♝"],["d",8,"♛"],["e",8,"♚"],["f",8,"♝"],["g",8,"♞"],["h",8,"♜"],["a",7,"♟"],["b",7,"♟"],["c",7,"♟"],["d",7,"♟"],["e",7,"♟"],["f",7,"♟"],["g",7,"♟"],["h",7,"♟"],["a",2,"♙"],["b",2,"♙"],["c",2,"♙"],["d",2,"♙"],["e",2,"♙"],["f",2,"♙"],["g",2,"♙"],["h",2,"♙"],["a",1,"♖"],["b",1,"♘"],["c",1,"♗"],["d",1,"♕"],["e",1,"♔"],["f",1,"♗"],["g",1,"♘"],["h",1,"♖"]]')).build(),Xs="32 chess piece を 4-lane (Black back rank / Black pawns / White pawns / White back rank) rank 別分散、 chessBoard readout 併存",Zs=t("interactive-sprint-kanban",{topic:"6 タスクを未着手 / 進行中 / 完了で分ける"}).lane("todo",{x:0,width:220}).lane("inprogress",{x:260,width:220}).lane("done",{x:520,width:220}).arraySignal("tasks",[["todo","Design API schema","high"],["todo","Write docs","low"],["inprogress","Impl auth flow","high"],["inprogress","Migration script","med"],["done","Setup CI","med"],["done","Repo bootstrap","low"]]).node("todoCard",{lane:"todo",stack:0,kind:"card",title:"Todo",subtitle:"まだ手を付けていない列"}).node("inprogressCard",{lane:"inprogress",stack:0,kind:"card",title:"In Progress",subtitle:"いま進めている列"}).node("doneCard",{lane:"done",stack:0,kind:"card",title:"Done",subtitle:"終わった列"}).readout.kanbanBoard("kb",{source:"tasks",columnWidth:140,max:5,label:"Sprint kanban"}).phase("p1",{duration:1800,title:"着手前",body:"札がすべて左の列に積まれる。 重さの違いは札の色として出る。"},e=>e.activate("todoCard").set("tasks",'[["todo","Design API schema","high"],["todo","Write docs","low"],["todo","Impl auth flow","high"],["todo","Migration script","med"],["todo","Setup CI","med"],["todo","Repo bootstrap","low"]]')).phase("p2",{duration:1800,title:"動き出す",body:"札が中央と右の列へ移る。 列ごとの高さの差で、どこに滞っているかが読める。"},e=>e.activate("todoCard","inprogressCard").set("tasks",'[["todo","Design API schema","high"],["todo","Write docs","low"],["inprogress","Impl auth flow","high"],["inprogress","Migration script","med"],["done","Setup CI","med"],["todo","Repo bootstrap","low"]]')).phase("p3",{duration:1800,title:"終盤に入る",body:"右の列が最も高くなる。 札の総数は変わらず、列の間を移るだけであることが読める。"},e=>e.activate("todoCard","inprogressCard","doneCard").set("tasks",'[["todo","Design API schema","high"],["inprogress","Write docs","low"],["inprogress","Impl auth flow","high"],["done","Migration script","med"],["done","Setup CI","med"],["done","Repo bootstrap","low"]]')).build(),er="sprint 6 task を 3-lane (Todo / In Progress / Done) 状態別分散、 kanban readout 併存",tr=t("interactive-docs-breadcrumb",{topic:"階層 4 段のパンくずを順に辿る"}).lane("col1",{x:0,width:270}).lane("col2",{x:310,width:300}).arraySignal("path",["Home","Docs","API","Reference"]).state("cur",{initial:2}).node("homeNode",{lane:"col1",stack:0,kind:"card",w:190,title:"Home",subtitle:"最上位の階層"}).node("docsNode",{lane:"col2",stack:0,kind:"card",w:140,title:"Docs",subtitle:"Home の下にある階層"}).node("apiNode",{lane:"col1",stack:1,kind:"card",w:220,title:"API",subtitle:"Reference の上にある階層"}).node("refNode",{lane:"col2",stack:1,kind:"card",w:250,title:"Reference",subtitle:"最も深い階層"}).edge("homeNode","docsNode",{label:"→",tone:"info"}).edge("docsNode","apiNode",{label:"→",tone:"accent"}).edge("apiNode","refNode",{label:"→",tone:"info"}).readout.breadcrumb("bc",{source:"path",currentSource:"cur",color:"#2563eb",label:"Path"}).phase("p1",{duration:1800,title:"最上位に居る",body:"4 段すべてが並ぶ中で、先頭だけが濃く太い。 今どこに居るかを色と太さで示す。"},e=>e.activate("homeNode").set("cur",0)).phase("p2",{duration:1800,title:"中ほどへ降りる",body:"濃い段が右へ移る。 並びと区切りは変わらず、強調の位置だけが動く。"},e=>e.activate("homeNode","docsNode","apiNode").set("cur",2)).phase("p3",{duration:1800,title:"最も深い階層",body:"末尾が濃くなる。 手前の段は薄いまま残り、辿ってきた道が読める形になる。"},e=>e.activate("homeNode","docsNode","apiNode","refNode").set("cur",3)).build(),ar="docs navigation 4 crumb を 2 列 2 段の pipeline (Home → Docs → API → Reference) + 3 next edge + breadcrumb readout 併存",ir=t("interactive-day-schedule",{topic:"1 日の予定を朝 / 昼 / 夜で分ける"}).lane("morning",{x:0,width:240}).lane("afternoon",{x:280,width:240}).lane("evening",{x:560,width:240}).arraySignal("events",[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"],["14:00","Deploy staging","v1.2.0"],["16:00","1-on-1","career discussion"],["19:30","Retrospective","sprint 42 close"]]).node("morningCard",{lane:"morning",stack:0,kind:"card",title:"Morning",subtitle:"午前の時間帯"}).node("afternoonCard",{lane:"afternoon",stack:0,kind:"card",title:"Afternoon",subtitle:"午後の時間帯"}).node("eveningCard",{lane:"evening",stack:0,kind:"card",title:"Evening",subtitle:"夜の時間帯"}).readout.timelineVertical("tv",{source:"events",color:"#2563eb",max:8,label:"Day events"}).phase("p1",{duration:1800,title:"午前の予定",body:"点が 2 つだけ縦に並ぶ。 時刻と題と補足の 3 つが 1 つの点にぶら下がる形が読める。"},e=>e.activate("morningCard").set("events",'[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"]]')).phase("p2",{duration:1800,title:"午後まで",body:"点が 4 つに増える。 補足を持たない予定は 3 行目が出ないが、点の間隔は変わらない。"},e=>e.activate("morningCard","afternoonCard").set("events",'[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"],["14:00","Deploy staging"],["16:00","1-on-1","career discussion"]]')).phase("p3",{duration:1800,title:"1 日ぶん",body:"点が 5 つ並ぶ。 上から下へ時刻が進む形で、1 日の流れが 1 本の線に載る。"},e=>e.activate("morningCard","afternoonCard","eveningCard").set("events",'[["09:00","Standup","team sync"],["10:30","Design review","3 proposals"],["14:00","Deploy staging","v1.2.0"],["16:00","1-on-1","career discussion"],["19:30","Retrospective","sprint 42 close"]]')).build(),or="day schedule 5 event を 3-lane (Morning / Afternoon / Evening) 時間帯別分散 + timelineVertical readout 併存",nr=t("interactive-server-uptime",{topic:"稼働 6 区間を稼働 / 待機 / 異常で分ける"}).lane("active",{x:0,width:240}).lane("idle",{x:280,width:240}).lane("error",{x:560,width:240}).arraySignal("events",[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"],["11:15","active"],["12:00","active"]]).node("activeCard",{lane:"active",stack:0,kind:"card",title:"Active",subtitle:"稼働している区間 (緑)"}).node("idleCard",{lane:"idle",stack:0,kind:"card",title:"Idle",subtitle:"待機している区間 (灰)"}).node("errorCard",{lane:"error",stack:0,kind:"card",title:"Error",subtitle:"異常が出た区間 (赤)"}).readout.statusTimeline("st",{source:"events",max:8,label:"Server status"}).phase("p1",{duration:1800,title:"平常の稼働",body:"同じ色の区間が続く。 状態の名は 4 文字までに切って大文字で出ることが読める。"},e=>e.activate("activeCard").set("events",'[["09:00","active"],["09:15","active"]]')).phase("p2",{duration:1800,title:"異常が出る",body:"灰と赤の区間が混じる。 色の切り替わりで、いつ状態が変わったかが読み取れる。"},e=>e.activate("activeCard","idleCard","errorCard").set("events",'[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"]]')).phase("p3",{duration:1800,title:"復帰する",body:"末尾がまた緑に戻る。 赤が 1 区間だけであることが、帯の中の面積として読める。"},e=>e.activate("activeCard","errorCard").set("events",'[["09:00","active"],["09:15","active"],["10:30","idle"],["11:00","error"],["11:15","active"],["12:00","active"]]')).build(),lr="server uptime 6 event を 3-lane (Active / Idle / Error) status 別分散 + statusTimeline readout 併存",sr=t("interactive-week-calendar",{topic:"1 週間を曜日ごとに並べる"}).lane("mon",{x:0,width:160}).lane("tue",{x:185,width:160}).lane("wed",{x:370,width:210}).lane("thu",{x:605,width:160}).lane("fri",{x:790,width:160}).lane("sat",{x:975,width:160}).lane("sun",{x:1160,width:160}).arraySignal("week",[["Mon",!0,!1],["Tue",!1,!1],["Wed",!0,!0],["Thu",!1,!1],["Fri",!0,!1],["Sat",!1,!1],["Sun",!1,!1]]).node("monNode",{lane:"mon",stack:0,kind:"card",w:110,title:"Mon",subtitle:"予定を持つ日"}).node("tueNode",{lane:"tue",stack:0,kind:"card",w:110,title:"Tue",subtitle:"予定を持たない日"}).node("wedNode",{lane:"wed",stack:0,kind:"card",w:160,title:"Wed",subtitle:"予定を持つ日"}).node("thuNode",{lane:"thu",stack:0,kind:"card",w:110,title:"Thu",subtitle:"予定を持たない日"}).node("friNode",{lane:"fri",stack:0,kind:"card",w:110,title:"Fri",subtitle:"予定を持つ日"}).node("satNode",{lane:"sat",stack:0,kind:"card",w:110,title:"Sat",subtitle:"予定を持たない日 (週末)"}).node("sunNode",{lane:"sun",stack:0,kind:"card",w:110,title:"Sun",subtitle:"予定を持たない日 (週明け前)"}).readout.calendarWeek("cw",{source:"week",cellSize:40,color:"#2563eb",label:"This week"}).phase("p1",{duration:1800,title:"週の始まり",body:"今日の升目だけ塗りつぶす。 塗った日は予定の丸を出さないため、印は 1 つに畳まれる。"},e=>e.activate("monNode").set("week",'[["Mon",true,true],["Tue",false,false],["Wed",true,false],["Thu",false,false],["Fri",true,false],["Sat",false,false],["Sun",false,false]]')).phase("p2",{duration:1800,title:"週の半ば",body:"塗りが右へ移る。 塗りが外れた日に予定の丸が現れ、塗られた日の丸が消える。"},e=>e.activate("monNode","wedNode").set("week",'[["Mon",true,false],["Tue",false,false],["Wed",true,true],["Thu",false,false],["Fri",true,false],["Sat",false,false],["Sun",false,false]]')).phase("p3",{duration:1800,title:"週の終わり",body:"塗りが 5 つ目まで進む。 7 つの升目の数は変わらず、塗りと丸の位置だけが動く。"},e=>e.activate("monNode","wedNode","friNode","satNode","sunNode").set("week",'[["Mon",true,false],["Tue",false,false],["Wed",true,false],["Thu",false,false],["Fri",true,true],["Sat",false,false],["Sun",false,false]]')).build(),rr="7-day week calendar を 7-lane 個別 day 分散 + calendarWeek readout 併存",dr=t("interactive-team-kpi-compare",{topic:"2 チームの成績を並べて比べる"}).lane("teamA",{x:0,width:340}).lane("teamB",{x:380,width:340}).arraySignal("teams",[["Team A",82],["Team B",65]]).node("aCard",{lane:"teamA",stack:0,kind:"card",title:"Team A",subtitle:"上の帯 (青)"}).node("aDetail",{lane:"teamA",stack:1,kind:"card",title:"Velocity",subtitle:"上の帯が表す量"}).node("bCard",{lane:"teamB",stack:0,kind:"card",title:"Team B",subtitle:"下の帯 (橙)"}).node("bDetail",{lane:"teamB",stack:1,kind:"card",title:"Velocity",subtitle:"下の帯が表す量"}).edge("aCard","bCard",{label:"差",tone:"warning"}).readout.kpiComparison("kc",{source:"teams",max:100,colorA:"#2563eb",colorB:"#f97316",label:"Score compare"}).phase("p1",{duration:1800,title:"差が大きい",body:"2 本の帯の長さが大きく違う。 帯は上限を基準に伸びるため、差がそのまま長さに出る。"},e=>e.activate("aCard","bCard").set("teams",'[["Team A",82],["Team B",41]]')).phase("p2",{duration:1800,title:"追い上げる",body:"下の帯が伸びる。 上の帯は変わらないため、差が縮まったことが並べて読める。"},e=>e.activate("aCard","aDetail","bCard").set("teams",'[["Team A",82],["Team B",65]]')).phase("p3",{duration:1800,title:"ほぼ並ぶ",body:"2 本がほぼ同じ長さになる。 色が違うだけの帯として、比較の形が最も読みやすくなる。"},e=>e.activate("aCard","aDetail","bCard","bDetail").set("teams",'[["Team A",84],["Team B",80]]')).build(),cr="Team A vs Team B の score を 2-lane 分散 + kpiComparison readout 併存",ur=t("interactive-publish-workflow",{topic:"記事公開の 4 工程を順に追う"}).lane("col1",{x:0,width:300}).lane("col2",{x:340,width:270}).arraySignal("steps",["Draft","Review","Approve","Publish"]).state("cur",{initial:2}).node("draftNode",{lane:"col1",stack:0,kind:"card",w:190,title:"Draft",subtitle:"最初の工程"}).node("reviewNode",{lane:"col2",stack:0,kind:"card",w:190,title:"Review",subtitle:"Draft の次の工程"}).node("approveNode",{lane:"col1",stack:1,kind:"card",w:250,title:"Approve",subtitle:"Publish の直前の工程"}).node("publishNode",{lane:"col2",stack:1,kind:"card",w:220,title:"Publish",subtitle:"最後の工程"}).edge("draftNode","reviewNode",{label:"submit",tone:"success"}).edge("reviewNode","approveNode",{label:"reviewed",tone:"info"}).edge("approveNode","publishNode",{label:"publish",tone:"accent"}).readout.stepProgress("sp",{source:"cur",stepsSource:"steps",color:"#2563eb",label:"Workflow"}).phase("p1",{duration:1800,title:"書き始め",body:"番号の付いた丸が 4 つ並び、先頭だけが濃い。 手前の線が塗られていない状態から始まる。"},e=>e.activate("draftNode").set("cur",0)).phase("p2",{duration:1800,title:"確認を経る",body:"濃い丸が右へ移り、そこまでの線が塗られる。 どこまで進んだかを線の長さが示す。"},e=>e.activate("draftNode","reviewNode","approveNode").set("cur",2)).phase("p3",{duration:1800,title:"公開する",body:"末尾の丸まで濃くなる。 丸の数は変わらず、塗られた線が端まで届く形になる。"},e=>e.activate("draftNode","reviewNode","approveNode","publishNode").set("cur",3)).build(),pr="content publish workflow 4 step を 2 列 2 段の pipeline + 3 next edge + stepProgress readout 併存",br=t("interactive-team-presence",{topic:"5 人の在席を在席 / 離席 / 不在で分ける"}).lane("online",{x:0,width:240}).lane("away",{x:280,width:240}).lane("offline",{x:560,width:240}).arraySignal("team",[["Alice","online"],["Bob","away"],["Carol","online"],["Dan","offline"],["Eve","online"]]).node("aliceCard",{lane:"online",stack:0,kind:"card",title:"Alice",subtitle:"在席の人 (緑の丸)"}).node("carolCard",{lane:"online",stack:1,kind:"card",title:"Carol",subtitle:"在席の人 (緑の丸)"}).node("eveCard",{lane:"online",stack:2,kind:"card",title:"Eve",subtitle:"在席の人 (緑の丸)"}).node("bobCard",{lane:"away",stack:0,kind:"card",title:"Bob",subtitle:"離席の人 (黄の丸)"}).node("danCard",{lane:"offline",stack:0,kind:"card",title:"Dan",subtitle:"不在の人 (灰の丸)"}).readout.userPresence("up",{source:"team",max:6,label:"Team status"}).phase("p1",{duration:1800,title:"朝の在席",body:"全員が不在。 名前の左の丸がすべて灰になり、行末の状態も同じ語で揃う。"},e=>e.activate("danCard").set("team",'[["Alice","offline"],["Bob","offline"],["Carol","offline"],["Dan","offline"],["Eve","offline"]]')).phase("p2",{duration:1800,title:"上限ちょうど",body:"6 人まで並ぶ。 表示の上限と同じ人数なので、余りの行はまだ出ない。"},e=>e.activate("aliceCard","bobCard","danCard").set("team",'[["Alice","online"],["Bob","away"],["Carol","offline"],["Dan","offline"],["Eve","online"],["Frank","online"]]')).phase("p3",{duration:1800,title:"上限を超える",body:"7 人目は行にならず、末尾に残りの人数としてまとめて出る。 上の 6 行は変わらない。"},e=>e.activate("aliceCard","carolCard","eveCard","bobCard","danCard").set("team",'[["Alice","online"],["Bob","away"],["Carol","offline"],["Dan","offline"],["Eve","online"],["Frank","online"],["Grace","away"]]')).build(),hr="5 team member を 3-lane (Online / Away / Offline) status 別分散 + userPresence readout 併存",gr=t("interactive-feedback-rating",{topic:"賛成票と反対票を並べて見せる"}).lane("up",{x:0,width:340}).lane("down",{x:380,width:340}).arraySignal("votes",[24,3]).node("upCard",{lane:"up",stack:0,kind:"card",title:"▲ Up votes",subtitle:"帯の緑の側を決める票"}).node("upDetail",{lane:"up",stack:1,kind:"card",title:"Positive",subtitle:"帯の緑の部分"}).node("downCard",{lane:"down",stack:0,kind:"card",title:"▼ Down votes",subtitle:"帯の赤の側を決める票"}).node("downDetail",{lane:"down",stack:1,kind:"card",title:"Negative",subtitle:"帯の赤の部分"}).edge("upCard","downCard",{label:"割合",tone:"warning"}).readout.ratingThumb("rt",{source:"votes",colorUp:"#22c55e",colorDown:"#ef4444",label:"Review score"}).phase("p1",{duration:1800,title:"票が割れる",body:"賛成と反対がほぼ同数。 帯は票数でなく賛成の占める割合で塗り分けられる。"},e=>e.activate("upCard","downCard").set("votes","[12,10]")).phase("p2",{duration:1800,title:"賛成が増える",body:"賛成の割合が 3 分の 2 になる。 緑の部分が伸び、赤の部分が縮む。"},e=>e.activate("upCard","upDetail","downCard").set("votes","[20,10]")).phase("p3",{duration:1800,title:"賛成に寄る",body:"賛成が 9 割近くを占める。 総数が増えても、帯の長さは割合だけで決まる。"},e=>e.activate("upCard","upDetail","downCard","downDetail").set("votes","[24,3]")).build(),kr="review 24 up / 3 down vote を 2-lane (Up / Down) 分散 + ratingThumb readout 併存",wr=t("interactive-startup-org",{topic:"3 階層の組織図を階層ごとに並べる"}).lane("ceo",{x:0,width:220}).lane("vp",{x:260,width:220}).lane("ic",{x:520,width:260}).arraySignal("org",[["Alice CEO",0],["Bob VP Eng",1],["Carol VP Sales",1],["Dan Eng",2],["Eve Eng",2],["Frank Sales",2]]).node("ceoCard",{lane:"ceo",stack:0,kind:"card",title:"Alice CEO",subtitle:"最上位の階層"}).node("vpEng",{lane:"vp",stack:0,kind:"card",title:"Bob VP Eng",subtitle:"中間の階層"}).node("vpSales",{lane:"vp",stack:1,kind:"card",title:"Carol Sales",subtitle:"中間の階層"}).node("icDan",{lane:"ic",stack:0,kind:"card",title:"Dan Eng",subtitle:"最下位の階層"}).node("icEve",{lane:"ic",stack:1,kind:"card",title:"Eve Eng",subtitle:"最下位の階層"}).node("icFrank",{lane:"ic",stack:2,kind:"card",title:"Frank Sales",subtitle:"最下位の階層"}).edge("ceoCard","vpEng",{label:"reports",tone:"info"}).edge("ceoCard","vpSales",{label:"reports",tone:"info"}).edge("vpEng","icDan",{label:"manages",tone:"accent"}).edge("vpEng","icEve",{label:"manages",tone:"accent"}).edge("vpSales","icFrank",{label:"manages",tone:"accent"}).readout.orgChartMini("oc",{source:"org",color:"#2563eb",label:"Org hierarchy"}).phase("p1",{duration:1800,title:"創業した頃",body:"階層が 1 段しかない。 下の段が空だと繋ぐ線を引かないため、箱が 1 つ浮く形になる。"},e=>e.activate("ceoCard").set("org",'[["Alice CEO",0]]')).phase("p2",{duration:1800,title:"役員を置く",body:"2 段目が埋まり、上の段から線が下りる。 同じ段の箱は横に並ぶ。"},e=>e.activate("ceoCard","vpEng","vpSales").set("org",'[["Alice CEO",0],["Bob VP Eng",1],["Carol VP Sales",1]]')).phase("p3",{duration:1800,title:"現場が増える",body:"3 段目まで揃う。 名前が 10 文字を超える箱は末尾を省いて出ることが読み取れる。"},e=>e.activate("ceoCard","vpEng","vpSales","icDan","icEve","icFrank").set("org",'[["Alice CEO",0],["Bob VP Eng",1],["Carol VP Sales",1],["Dan Eng",2],["Eve Eng",2],["Frank Sales",2]]')).build(),mr="startup 3-level org (CEO / 2 VP / 3 IC) を 3-lane tree depth 別分散 + orgChartMini readout 併存",vr=t("interactive-nps-trend",{topic:"NPS の現在値と増減と推移を並べる"}).lane("cur",{x:0,width:220}).lane("delta",{x:260,width:220}).lane("hist",{x:520,width:260}).state("cur",{initial:82}).state("prev",{initial:75}).arraySignal("hist",[60,65,70,75,80,82]).node("curCard",{lane:"cur",stack:0,kind:"card",title:"Current",subtitle:"今月の値"}).node("prevCard",{lane:"delta",stack:0,kind:"card",title:"Previous",subtitle:"先月の値"}).node("deltaCard",{lane:"delta",stack:1,kind:"card",title:"Delta",subtitle:"今月 - 先月の差"}).node("histCard",{lane:"hist",stack:0,kind:"card",title:"History",subtitle:"折れ線のもとになる並び"}).edge("curCard","prevCard",{label:"比べる",tone:"info"}).edge("curCard","histCard",{label:"並べる",tone:"success"}).readout.kpiTrendTile("kt",{source:"cur",prevSource:"prev",historySource:"hist",unit:"",colorPos:"#22c55e",colorNeg:"#ef4444",label:"NPS trend"}).phase("p1",{duration:1800,title:"下がった月",body:"今月が先月を下回る。 差が負になり、印と色が下向きの赤に変わる。"},e=>e.activate("curCard","prevCard").set("cur",58).set("prev",64).set("hist","[70,68,66,64,60,58]")).phase("p2",{duration:1800,title:"底を打つ",body:"今月が先月と並んで差が 0 になる。 印は上向きのまま残り、折れ線の右端が持ち直す。"},e=>e.activate("curCard","prevCard","deltaCard").set("cur",64).set("prev",64).set("hist","[68,66,64,60,58,64]")).phase("p3",{duration:1800,title:"持ち直す",body:"今月が先月を上回る。 差が正になって上向きの緑になり、折れ線も右上がりに揃う。"},e=>e.activate("curCard","prevCard","deltaCard","histCard").set("cur",82).set("prev",75).set("hist","[60,65,70,75,80,82]")).build(),yr="NPS current + delta + sparkline を 3-lane (Current / Delta / History) 分散 + kpiTrendTile readout 併存",fr=t("interactive-post-reaction-poll",{topic:"絵文字 3 種の投票を並べる"}).lane("thumbs",{x:0,width:240}).lane("heart",{x:280,width:240}).lane("party",{x:560,width:240}).arraySignal("votes",[["👍",42],["❤️",28],["🎉",15]]).node("thumbsCard",{lane:"thumbs",stack:0,kind:"card",title:"👍 Thumbs",subtitle:"票が最も多い絵文字"}).node("heartCard",{lane:"heart",stack:0,kind:"card",title:"❤️ Heart",subtitle:"次に多い絵文字"}).node("partyCard",{lane:"party",stack:0,kind:"card",title:"🎉 Party",subtitle:"票が最も少ない絵文字"}).readout.quickPollEmoji("qp",{source:"votes",colorWinner:"#2563eb",label:"Reactions"}).phase("p1",{duration:1800,title:"票が入り始める",body:"票がまだ少ない。 最も多いものに枠が付き、他の 2 つとは色が変わる。"},e=>e.activate("thumbsCard").set("votes",'[["👍",3],["❤️",2],["🎉",1]]')).phase("p2",{duration:1800,title:"票が集まる",body:"差が開く。 枠が付くのは最も多い 1 つだけで、位置は動かない。"},e=>e.activate("thumbsCard","heartCard").set("votes",'[["👍",12],["❤️",7],["🎉",4]]')).phase("p3",{duration:1800,title:"締め切り",body:"3 種の差が最も開く。 枠の位置は動かず、中の数だけが上がる形で落ち着く。"},e=>e.activate("thumbsCard","heartCard","partyCard").set("votes",'[["👍",42],["❤️",28],["🎉",15]]')).build(),Cr="3 emoji reaction poll (👍/❤️/🎉) を 3-lane 分散 + quickPollEmoji readout 併存",xr=t("interactive-voice-message-playback",{topic:"音声メッセージの波形と再生位置を見せる"}).lane("sender",{x:0,width:200}).lane("wave",{x:240,width:260}).lane("play",{x:540,width:220}).arraySignal("amps",[.2,.4,.7,.9,.6,.3,.5,.8,.4,.6,.3,.7,.5,.2,.4]).state("progress",{initial:0}).node("senderCard",{lane:"sender",stack:0,kind:"card",title:"送り主",subtitle:"録音した人"}).node("waveCard",{lane:"wave",stack:0,kind:"card",title:"波形",subtitle:"音の大小が棒の高さになる"}).node("playCard",{lane:"play",stack:0,kind:"card",title:"再生",subtitle:"左から順に色が付く波形"}).node("progressCard",{lane:"play",stack:1,kind:"card",title:"進み具合",subtitle:"色の付いた本数を決める割合"}).edge("senderCard","waveCard",{label:"録音",tone:"info"}).edge("waveCard","playCard",{label:"再生",tone:"success"}).readout.voiceMessage("vm",{source:"amps",progressSource:"progress",duration:23,colorPlay:"#2563eb",colorBar:"#cbd5e1",label:"音声メモ"}).phase("p1",{duration:1800,title:"受信した直後",body:"棒が 15 本並ぶが、どれも灰のまま。 進み具合が 0 の間は色が 1 本も付かない。"},e=>e.activate("senderCard","waveCard").set("progress",0).badge("受信")).phase("p2",{duration:1800,title:"半ばまで再生",body:"左から半分の棒に色が付く。 棒の高さは変わらず、色の境目だけが右へ動く。"},e=>e.activate("senderCard","waveCard","playCard").set("progress",.5).badge("再生中")).phase("p3",{duration:1800,title:"再生完了",body:"15 本すべてに色が付く。 進み具合が 1 になると境目が右端まで届く。"},e=>e.activate("senderCard","waveCard","playCard","progressCard").set("progress",1).badge("完了")).build(),Sr="音声メッセージ再生 (波形 15 バー + 再生 progress) を 3-lane 分散 + voiceMessage readout 併存、 3 phase で受信 → 半ばまで再生 → 完了の変化を可視化",Nr=t("interactive-team-thread-summary",{topic:"スレッドの未読 / 参加者 / 経過をまとめる"}).lane("unread",{x:0,width:220}).lane("participants",{x:260,width:220}).lane("activity",{x:520,width:260}).arraySignal("thread",[5,8,"Alice","12 分前"]).node("unreadCard",{lane:"unread",stack:0,kind:"card",title:"未読",subtitle:"赤い丸の中に出る数"}).node("partCard",{lane:"participants",stack:0,kind:"card",title:"参加者",subtitle:"話している人数"}).node("authorCard",{lane:"activity",stack:0,kind:"card",title:"直近の発言者",subtitle:"最後に書いた人の名前"}).node("timeCard",{lane:"activity",stack:1,kind:"card",title:"経過",subtitle:"最後の書き込みからの経過"}).edge("unreadCard","authorCard",{label:"帰属",tone:"info"}).edge("partCard","authorCard",{label:"所属",tone:"teal"}).readout.threadSummary("ts",{source:"thread",colorUnread:"#ef4444",label:"スレッド概要"}).phase("p1",{duration:1800,title:"静かなスレッド",body:"未読が 0。 赤い丸だけが消え、人数と直近の発言者と経過の 3 行は残る。"},e=>e.activate("partCard").set("thread",'[0,4,"Bob","2 時間前"]').badge("静か")).phase("p2",{duration:1800,title:"新着が付く",body:"未読が 3 件。 右上に赤い丸が現れ、中に件数が出る。 人数と発言者も入れ替わる。"},e=>e.activate("unreadCard","partCard","authorCard").set("thread",'[3,6,"Carol","25 分前"]').badge("新着")).phase("p3",{duration:1800,title:"混雑する",body:"未読が 5 件に増える。 丸の大きさは変わらず、中の数と 3 行の文字だけが動く。"},e=>e.activate("unreadCard","partCard","authorCard","timeCard").set("thread",'[5,8,"Alice","12 分前"]').badge("混雑")).build(),Ar="チームスレッド概要 (未読 / 参加者 / 直近 author / 経過時間) を 3-lane 分散 + threadSummary readout 併存、 3 phase で静か → 新着 → 混雑の変化を可視化",Pr=t("interactive-dm-read-receipt",{topic:"DM の送信 / 配信 / 既読を段階で見せる"}).lane("sent",{x:0,width:300}).lane("delivered",{x:340,width:320}).lane("read",{x:700,width:320}).state("status",{initial:0}).node("sentCard",{lane:"sent",stack:0,kind:"card",w:250,title:"▶ 送信 (0)",subtitle:"単チェック · 灰 · 09:42"}).node("deliveredCard",{lane:"delivered",stack:0,kind:"card",w:270,title:"▶▶ 配信 (1)",subtitle:"二重チェック · 灰 · 09:43"}).node("readCard",{lane:"read",stack:0,kind:"card",w:270,title:"◆ 既読 (2)",subtitle:"二重チェック · 青 · 09:45"}).edge("sentCard","deliveredCard",{label:"配信完了",tone:"info"}).edge("deliveredCard","readCard",{label:"既読",tone:"success"}).readout.readReceipt("rr",{source:"status",colorRead:"#2563eb",colorPending:"#a08870",label:"既読状態"}).phase("p1",{duration:1500,title:"送信",body:"status = 0、 送信 lane のみ active、 readout に灰の単チェック表示 (送信済 but 未配信)。"},e=>e.activate("sentCard").set("status",0).badge("送信")).phase("p2",{duration:1500,title:"配信完了",body:"status = 1 に切替、 配信 lane 追加 activate、 readout が灰の二重チェックに変化 (配信 but 未読)。"},e=>e.activate("sentCard","deliveredCard").set("status",1).badge("配信")).phase("p3",{duration:1500,title:"既読",body:"status = 2 に切替、 既読 lane 追加 activate、 readout の二重チェックが青に変化 (既読確認)。"},e=>e.activate("sentCard","deliveredCard","readCard").set("status",2).badge("既読")).build(),Br="DM 既読状態 (0=送信 / 1=配信 / 2=既読) を 3-lane state 別分散 + readReceipt readout 併存、 3 phase で状態遷移の動きを可視化",_r=t("interactive-form-password-check",{topic:"パスワードの強度を 5 段階で見せる"}).lane("input",{x:0,width:220}).lane("meter",{x:260,width:260}).lane("rules",{x:560,width:260}).state("pw",{initial:1}).node("pwField",{lane:"input",stack:0,kind:"card",title:"◆ password",subtitle:"現在 level {pw} · マスク表示"}).node("meterBars",{lane:"meter",stack:0,kind:"card",title:"4 セグメント メーター",subtitle:"level {pw} 分だけ着色"}).node("levelLabel",{lane:"meter",stack:1,kind:"card",title:"level ラベル",subtitle:"メーター色と同色 tint"}).node("rule1",{lane:"rules",stack:0,kind:"card",title:"✓ 8 文字以上",subtitle:"level ≥ 1 で pass"}).node("rule2",{lane:"rules",stack:1,kind:"card",title:"✓ 大小混合",subtitle:"level ≥ 2 で pass"}).node("rule3",{lane:"rules",stack:2,kind:"card",title:"✓ 数字 + 記号",subtitle:"level ≥ 3 で pass"}).edge("pwField","meterBars",{label:"評価",tone:"info"}).edge("meterBars","levelLabel",{label:"注釈",tone:"success"}).readout.passwordStrength("ps",{source:"pw",colorStrong:"#22c55e",colorWeak:"#ef4444",label:"強度"}).phase("p1",{duration:1500,title:"弱い (level 1)",body:"初期入力、 pw = 1、 meter 1 セグメント赤、 rule1 のみ pass、 入力 + メーター lane が active。"},e=>e.activate("pwField","meterBars","rule1").set("pw",1).badge("弱い")).phase("p2",{duration:2e3,title:"改善中 (level 1 → 3)",body:"文字追加 + 大小混合、 pw を 1 → 3 まで tween、 meter が赤 → 橙 → 黄 → 黄緑と連続変化、 rule2 + rule3 追加 activate。"},e=>e.activate("pwField","meterBars","levelLabel","rule1","rule2","rule3").tween("pw",1,3).badge("改善中")).phase("p3",{duration:1500,title:"強い (level 4)",body:"数字 + 記号追加で pw = 4、 meter 全 4 セグメント緑、 全 rule pass、 6 node 全 active。"},e=>e.activate("pwField","meterBars","levelLabel","rule1","rule2","rule3").set("pw",4).badge("強い")).build(),Dr="サインアップ画面の password 強度 5 段階を 3-lane 分散 + passwordStrength readout 併存、 3 phase で弱 → 中 → 強の 3 段階を可視化",Tr=t("interactive-login-otp-verify",{topic:"OTP 6 桁の入力から検証までを追う"}).lane("sent",{x:0,width:220}).lane("entry",{x:260,width:260}).lane("verify",{x:560,width:220}).arraySignal("otp",[4,8,2,1,5,7]).node("sentCard",{lane:"sent",stack:0,kind:"card",title:"SMS 送信",subtitle:"6 桁の符号を送る"}).node("entryCard",{lane:"entry",stack:0,kind:"card",title:"6 つの枠",subtitle:"0-9 以外は空欄になる"}).node("focusHint",{lane:"entry",stack:1,kind:"card",title:"次に入れる枠",subtitle:"空欄の先頭が青枠になる"}).node("verifyCard",{lane:"verify",stack:0,kind:"card",title:"検証",subtitle:"6 つ埋まると送る"}).edge("sentCard","entryCard",{label:"ユーザ入力",tone:"info"}).edge("entryCard","verifyCard",{label:"自動送信",tone:"success"}).readout.otpInput("oi",{source:"otp",colorFocus:"#2563eb",label:"OTP コード"}).phase("p1",{duration:1800,title:"送った直後",body:"6 つの枠がすべて空。 0-9 の外の値は空欄として描かれるため、-1 を並べると空になる。"},e=>e.activate("sentCard").set("otp","[-1,-1,-1,-1,-1,-1]").badge("送信")).phase("p2",{duration:1800,title:"3 つ入れる",body:"左から 3 つが埋まる。 埋まった枠に数が出て、次に入れる枠が青枠で示される。"},e=>e.activate("sentCard","entryCard","focusHint").set("otp","[4,8,2,-1,-1,-1]").badge("入力中")).phase("p3",{duration:1800,title:"6 つ揃う",body:"6 つとも埋まる。 空欄が無くなり青枠も消え、そのまま送る形になる。"},e=>e.activate("sentCard","entryCard","focusHint","verifyCard").set("otp","[4,8,2,1,5,7]").badge("検証完了")).build(),Ir="OTP ログイン 6 桁検証を 3-lane 分散 + otpInput readout 併存、 3 phase で空欄 → 3 桁 → 6 桁の入力状態を可視化",Rr=t("interactive-profile-avatar-upload",{topic:"画像の選択から反映までを追う"}).lane("col1",{x:0,width:330}).lane("col2",{x:370,width:360}).state("file",{initial:""}).node("emptyCard",{lane:"col1",stack:0,kind:"card",w:280,title:"未選択",subtitle:"破線枠 · '⬆ ここにドロップ'"}).node("uploadedCard",{lane:"col2",stack:0,kind:"card",w:310,title:"◆ avatar.png",subtitle:"実線枠 · ファイル名カード"}).node("previewCard",{lane:"col1",stack:1,kind:"card",w:220,title:"▶ 円形アバター",subtitle:"80×80 クロップ表示"}).edge("emptyCard","uploadedCard",{label:"drop",tone:"info"}).edge("uploadedCard","previewCard",{label:"プレビュー",tone:"success"}).readout.fileDropzone("fd",{source:"file",colorActive:"#2563eb",label:"アバター ファイル"}).phase("p1",{duration:1500,title:"未選択",body:"file = ''、 未選択の card のみ active、 dropzone は破線枠 + '⬆ ここにドロップ' のプロンプト表示。"},e=>e.activate("emptyCard").set("file","").badge("未選択")).phase("p2",{duration:2e3,title:"ドロップ受信",body:"file を空 → 'avatar.png' に切替、 アップロードの card を追加 activate、 dropzone が実線枠 + ファイル名カード表示に変化。"},e=>e.activate("emptyCard","uploadedCard").set("file","avatar.png").badge("アップロード")).phase("p3",{duration:1500,title:"プレビュー表示",body:"アップロード完了、 プレビューの card を追加 activate、 円形クロップされたアバターが表示、 3 node 全 highlight。"},e=>e.activate("emptyCard","uploadedCard","previewCard").set("file","avatar.png").badge("完了")).build(),Er="プロフィール画像アップロードを 3 区画 2 列 2 段に分散 + fileDropzone readout 併存、 3 phase で未選択 → drop → プレビュー表示の状態遷移を可視化",Mr=t("interactive-prod-log-tail",{topic:"本番ログ直近 5 行を重要度付きで流す"}).lane("ts",{x:0,width:180}).lane("level",{x:200,width:140}).lane("msg",{x:360,width:340}).arraySignal("logs",[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"],["09:01:03",2,"メモリ使用率 82%"],["09:01:47",3,"worker crash: OOM"],["09:02:02",1,"worker 再起動 ok"]]).node("tsCard",{lane:"ts",stack:0,kind:"card",title:"時刻列",subtitle:"行の左端に出る時刻"}).node("levelCard",{lane:"level",stack:0,kind:"card",title:"レベル列",subtitle:"札の色を決める重さ"}).node("infoRow",{lane:"msg",stack:0,kind:"card",title:"情報の行",subtitle:"情報を表す札 (青)"}).node("warnRow",{lane:"msg",stack:1,kind:"card",title:"注意の行",subtitle:"注意を表す札 (橙)"}).node("errRow",{lane:"msg",stack:2,kind:"card",title:"異常の行",subtitle:"異常を表す札 (赤)"}).edge("tsCard","levelCard",{label:"分類",tone:"info"}).edge("levelCard","errRow",{label:"重篤化",tone:"error"}).readout.logStream("ls",{source:"logs",label:"ログ tail"}).phase("p1",{duration:1800,title:"通常運転",body:"情報の行だけが流れる。 札はどれも同じ色で、重さの差が出ていない状態。"},e=>e.activate("tsCard","levelCard","infoRow").set("logs",'[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"]]').badge("通常")).phase("p2",{duration:1800,title:"注意が出る",body:"橙の札が付いた行が混じる。 青い札と並ぶため、重さの違いが色で読み取れる。"},e=>e.activate("tsCard","levelCard","infoRow","warnRow").set("logs",'[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"],["09:01:03",2,"メモリ使用率 82%"]]').badge("警告")).phase("p3",{duration:1800,title:"異常が出る",body:"行が 6 つに増えるが、出るのは **末尾 5 行** だけ。 先頭の 1 行が押し出されて消える。"},e=>e.activate("tsCard","levelCard","infoRow","warnRow","errRow").set("logs",'[["09:00:12",1,"server 起動完了"],["09:00:15",1,"db connection pool 20"],["09:01:03",2,"メモリ使用率 82%"],["09:01:47",3,"worker crash: OOM"],["09:02:02",1,"worker 再起動 ok"],["09:02:30",1,"health check ok"]]').badge("障害")).build(),Lr="本番ログ tail (直近 5 行 + レベル別 pill) を 3-lane 分散 + logStream readout 併存、 3 phase で通常 → 警告 → 障害の重篤度昇華を可視化",Or=t("interactive-ops-alert-banner",{topic:"運用通知を情報 / 注意 / 異常で出し分ける"}).lane("trigger",{x:0,width:240}).lane("severity",{x:280,width:240}).lane("action",{x:560,width:220}).arraySignal("alert",[2,"CPU 92% を 5 分継続 — 調査要"]).node("triggerCard",{lane:"trigger",stack:0,kind:"card",title:"きっかけ",subtitle:"本文になる出来事"}).node("sevCard",{lane:"severity",stack:0,kind:"card",title:"重要度",subtitle:"帯の色を決める重さ"}).node("iconCard",{lane:"severity",stack:1,kind:"card",title:"重要度の印",subtitle:"重要度で ℹ / ⚠ / ✕ が変わる"}).node("actionCard",{lane:"action",stack:0,kind:"card",title:"対応",subtitle:"受け取った人が動く"}).edge("triggerCard","sevCard",{label:"分類",tone:"info"}).edge("sevCard","actionCard",{label:"通知",tone:"warning"}).readout.alertBanner("ab",{source:"alert",label:"アラート"}).phase("p1",{duration:1800,title:"軽微な知らせ",body:"重要度が最も低い。 帯は青で、印は情報を表す形になる。"},e=>e.activate("triggerCard","sevCard").set("alert",'[0,"CPU 68% — 通常の範囲"]').badge("info")).phase("p2",{duration:1800,title:"注意に上がる",body:"重要度が上がり、帯が橙に変わる。 本文も入れ替わり、印が注意の形になる。"},e=>e.activate("triggerCard","sevCard","iconCard").set("alert",'[2,"CPU 92% を 5 分継続 — 調査要"]').badge("warn")).phase("p3",{duration:1800,title:"異常に上がる",body:"重要度が最大になり帯が赤くなる。 本文と印も異常を表す内容に入れ替わる。"},e=>e.activate("triggerCard","sevCard","iconCard","actionCard").set("alert",'[3,"prod-web-3 応答なし — 全系統の切替が要る"]').badge("error")).build(),Fr="運用 alert 重要度別 banner (info / warn / error) を 3-lane 分散 + alertBanner readout 併存、 3 phase で info → warn → error のエスカレーションを可視化",Hr=t("interactive-service-health-grid",{topic:"各サービスの稼働状態を一覧で見せる"}).lane("up",{x:0,width:240}).lane("deg",{x:280,width:240}).lane("down",{x:560,width:240}).arraySignal("svcs",[["api",2],["web",2],["auth",2],["db",1],["cache",1],["queue",0]]).node("apiCard",{lane:"up",stack:0,kind:"card",title:"api",subtitle:"稼働を表す緑のマス"}).node("webCard",{lane:"up",stack:1,kind:"card",title:"web",subtitle:"稼働を表す緑のマス"}).node("authCard",{lane:"up",stack:2,kind:"card",title:"auth",subtitle:"稼働を表す緑のマス"}).node("dbCard",{lane:"deg",stack:0,kind:"card",title:"db",subtitle:"劣化を表す黄のマス"}).node("cacheCard",{lane:"deg",stack:1,kind:"card",title:"cache",subtitle:"劣化を表す黄のマス"}).node("queueCard",{lane:"down",stack:0,kind:"card",title:"queue",subtitle:"停止を表す赤のマス"}).edge("dbCard","queueCard",{label:"波及",tone:"error"}).readout.serviceHealth("sh",{source:"svcs",label:"サービス (6)"}).phase("p1",{duration:1800,title:"全て稼働",body:"6 つのマスがすべて緑。 名前と状態の組が並び、状態の数だけで色が決まる。"},e=>e.activate("apiCard","webCard","authCard").set("svcs",'[["api",2],["web",2],["auth",2],["db",2],["cache",2],["queue",2]]').badge("全稼働")).phase("p2",{duration:1800,title:"一部が劣化",body:"2 つが黄に変わる。 マスの位置と数は変わらず、色だけが入れ替わる。"},e=>e.activate("apiCard","webCard","authCard","dbCard","cacheCard").set("svcs",'[["api",2],["web",2],["auth",2],["db",1],["cache",1],["queue",2]]').badge("劣化")).phase("p3",{duration:1800,title:"1 つが停止",body:"最後の 1 つが赤になる。 緑 3 と黄 2 と赤 1 の内訳が、色を数えて読み取れる。"},e=>e.activate("apiCard","webCard","authCard","dbCard","cacheCard","queueCard").set("svcs",'[["api",2],["web",2],["auth",2],["db",1],["cache",1],["queue",0]]').badge("障害")).build(),Wr="microservice health matrix (up/degraded/down status per service) を 3-lane (Up / Degraded / Down) category split 分散 + serviceHealth readout 併存",qr=t("interactive-checkout-cart-summary",{topic:"カートの小計から合計までを積み上げる"}).lane("items",{x:0,width:220}).lane("costs",{x:260,width:260}).lane("total",{x:560,width:240}).arraySignal("cart",[3,149.85,8.5,158.35]).node("itemsCard",{lane:"items",stack:0,kind:"card",title:"商品数",subtitle:"カートに入れた点数"}).node("subtotalCard",{lane:"costs",stack:0,kind:"card",title:"小計",subtitle:"商品の金額を足した値"}).node("shippingCard",{lane:"costs",stack:1,kind:"card",title:"送料",subtitle:"小計に加える配送費"}).node("totalCard",{lane:"total",stack:0,kind:"card",title:"合計",subtitle:"末尾の行 · 太字と青で出る"}).edge("itemsCard","subtotalCard",{label:"集計",tone:"info"}).edge("subtotalCard","totalCard",{label:"+送料",tone:"success"}).edge("shippingCard","totalCard",{label:"加算",tone:"info"}).readout.cartSummary("cs",{source:"cart",currency:"$",colorTotal:"#2563eb",label:"カート合計"}).phase("p1",{duration:1800,title:"1 点だけ入れる",body:"4 行が並ぶ。 金額はどれも小数 2 桁で出るため、整数を渡しても末尾が 0 で揃う。"},e=>e.activate("itemsCard","subtotalCard").set("cart","[1,49.9,8.5,58.4]").badge("小計")).phase("p2",{duration:1800,title:"点数を増やす",body:"小計が上がり合計も動く。 送料は変わらないため、3 行目だけが同じ値のまま残る。"},e=>e.activate("itemsCard","subtotalCard","shippingCard").set("cart","[2,99.9,8.5,108.4]").badge("送料")).phase("p3",{duration:1800,title:"確定する",body:"合計が最も大きくなる。 最後の行だけ太字と青で出て、他の 3 行と区別される。"},e=>e.activate("itemsCard","subtotalCard","shippingCard","totalCard").set("cart","[3,149.85,8.5,158.35]").badge("合計")).build(),Gr="ショッピングカート小計 (商品 / 小計 / 送料 / 合計) を 3-lane 分散 + cartSummary readout 併存、 3 phase で 1 点 → 2 点 → 確定の金額変化を可視化",Vr=t("interactive-saas-pricing-tier",{topic:"料金 3 プランを並べて比べる"}).lane("starter",{x:0,width:240}).lane("pro",{x:280,width:240}).lane("enterprise",{x:560,width:260}).arraySignal("plan",["Pro",29,"10 席","優先サポート","カスタムドメイン"]).node("starterCard",{lane:"starter",stack:0,kind:"card",title:"Starter",subtitle:"最も安いプラン"}).node("proCard",{lane:"pro",stack:0,kind:"card",title:"Pro",subtitle:"中間のプラン"}).node("proBadge",{lane:"pro",stack:1,kind:"card",title:"特典の欄",subtitle:"名前と価格の後に並ぶ特典"}).node("enterpriseCard",{lane:"enterprise",stack:0,kind:"card",title:"Enterprise",subtitle:"最も高いプラン"}).edge("starterCard","proCard",{label:"アップグレード",tone:"info"}).edge("proCard","enterpriseCard",{label:"アップグレード",tone:"success"}).readout.pricingTier("pt",{source:"plan",colorAccent:"#2563eb",currency:"$",label:"プラン"}).phase("p1",{duration:1800,title:"最も安いプラン",body:"名前と価格と特典 1 つが出る。 3 つ目以降が特典として並ぶ形が読める。"},e=>e.activate("starterCard").set("plan",'["Starter",9,"3 席"]').badge("Starter")).phase("p2",{duration:1800,title:"中間のプラン",body:"価格が上がり特典が 3 つに増える。 名前と価格の位置は変わらず、下の並びだけが伸びる。"},e=>e.activate("starterCard","proCard","proBadge").set("plan",'["Pro",29,"10 席","優先サポート","カスタムドメイン"]').badge("Pro")).phase("p3",{duration:1800,title:"最も高いプラン",body:"特典を 5 つ渡しても出るのは **先頭 3 つ** まで。 4 つ目以降は表示に載らない。"},e=>e.activate("starterCard","proCard","proBadge","enterpriseCard").set("plan",'["Enterprise",99,"無制限の席","専任の担当","監査ログ","SSO 連携","SLA 保証"]').badge("比較")).build(),Ur="SaaS 料金 3 tier (Starter / Pro / Enterprise) を 3-lane 分散 + pricingTier readout 併存、 3 phase で Starter → Pro → Enterprise の表示差を可視化",Qr=t("interactive-checkout-coupon-apply",{topic:"クーポンの未入力から適用までを追う"}).lane("empty",{x:0,width:240}).lane("entered",{x:280,width:240}).lane("applied",{x:560,width:240}).arraySignal("coupon",["SAVE20",20]).node("emptyCard",{lane:"empty",stack:0,kind:"card",title:"未入力",subtitle:"符号が空の状態"}).node("enteredCard",{lane:"entered",stack:0,kind:"card",title:"入力済",subtitle:"符号は入ったが割引がまだ無い"}).node("applyBtn",{lane:"entered",stack:1,kind:"card",title:"適用ボタン",subtitle:"押すと割引が入る"}).node("appliedCard",{lane:"applied",stack:0,kind:"card",title:"適用済",subtitle:"割引が正になり緑の札が出る"}).edge("emptyCard","enteredCard",{label:"コード入力",tone:"info"}).edge("enteredCard","appliedCard",{label:"適用",tone:"success"}).readout.couponCode("cc",{source:"coupon",colorApplied:"#22c55e",label:"クーポン"}).phase("p1",{duration:1800,title:"未入力",body:"符号が空で割引も 0。 入力を促す表示だけが出て、割引の札は現れない。"},e=>e.activate("emptyCard").set("coupon",'["",0]').badge("未入力")).phase("p2",{duration:1800,title:"符号を入れる",body:"符号が入るが割引はまだ 0。 符号の文字は出るが、割引の札は出ないままになる。"},e=>e.activate("emptyCard","enteredCard","applyBtn").set("coupon",'["SAVE20",0]').badge("入力済")).phase("p3",{duration:1800,title:"適用する",body:"割引が正になる。 緑の札が現れ、符号と割引率が並んで出る形になる。"},e=>e.activate("emptyCard","enteredCard","applyBtn","appliedCard").set("coupon",'["SAVE20",20]').badge("適用")).build(),jr="チェックアウト クーポン適用フロー (未入力 → 入力 → 適用) を 3-lane state 分散 + couponCode readout 併存、 3 phase で未入力 → 符号入力 → 適用の状態変化を可視化",Jr=t("interactive-blog-article-preview",{topic:"記事カードの見出しと抜粋と著者を並べる"}).lane("thumb",{x:0,width:200}).lane("content",{x:220,width:320}).lane("meta",{x:560,width:220}).arraySignal("article",["dragon 入門","dragon で interactive diagram を作る方法を解説","Alice","2 時間前"]).node("thumbCard",{lane:"thumb",stack:0,kind:"card",title:"サムネイル",subtitle:"配列の値に依らず固定"}).node("titleCard",{lane:"content",stack:0,kind:"card",title:"タイトル",subtitle:"長いと末尾を省いて出る見出し"}).node("excerptCard",{lane:"content",stack:1,kind:"card",title:"抜粋",subtitle:"折り返して出る本文"}).node("authorCard",{lane:"meta",stack:0,kind:"card",title:"著者",subtitle:"記事を書いた人の名前"}).node("timeCard",{lane:"meta",stack:1,kind:"card",title:"経過",subtitle:"記事の公開からの経過"}).edge("thumbCard","titleCard",{label:"視線",tone:"info"}).edge("titleCard","authorCard",{label:"帰属",tone:"success"}).readout.articlePreview("ap",{source:"article",colorAccent:"#2563eb",label:"記事 card"}).phase("p1",{duration:1800,title:"短い記事",body:"題も抜粋も短い。 4 つの値がそれぞれの位置にそのまま出て、省略は起きない。"},e=>e.activate("thumbCard","titleCard").set("article",'["入門","はじめの一歩","Bob","5 分前"]').badge("初期")).phase("p2",{duration:1800,title:"抜粋が伸びる",body:"抜粋が 2 行に分かれる。 1 行目は 28 文字で切れて省略記号が付き、残りが 2 行目に出る。"},e=>e.activate("thumbCard","titleCard","excerptCard").set("article",'["dragon 入門","dragon で interactive diagram を作る方法を解説","Alice","2 時間前"]').badge("hover")).phase("p3",{duration:1800,title:"題も伸びる",body:"題が 26 文字を超える。 題も末尾を省いて出るため、1 行に収まる形が保たれる。"},e=>e.activate("thumbCard","titleCard","excerptCard","authorCard","timeCard").set("article",'["dragon で作る interactive diagram の完全ガイド 2026 年版","段ごとの変化と表示部品の連動を実例つきで最初から順に解説する長い記事","Carol","3 日前"]').badge("click")).build(),Yr="ブログ記事プレビュー card (タイトル / 抜粋 / 著者 / 経過) を 3-lane 分散 + articlePreview readout 併存、 3 phase で短い記事 → 抜粋が伸びる → 題も伸びるの表示差を可視化",zr=t("interactive-docs-toc-nav",{topic:"3 段の目次と現在位置を見せる"}).lane("lvl0",{x:0,width:240}).lane("lvl1",{x:280,width:260}).lane("lvl2",{x:560,width:260}).arraySignal("toc",[[0,"はじめに",0],[1,"スタートガイド",1],[2,"インストール",0],[2,"最初の図",1],[1,"高度な使い方",0],[0,"API リファレンス",0]]).state("activeIdx",{initial:0}).node("introCard",{lane:"lvl0",stack:0,kind:"card",title:"はじめに",subtitle:"最も浅い階層 · 字下げなし"}).node("apiCard",{lane:"lvl0",stack:1,kind:"card",title:"API リファレンス",subtitle:"最も浅い階層 · 字下げなし"}).node("gsCard",{lane:"lvl1",stack:0,kind:"card",title:"スタートガイド",subtitle:"中間の階層 · 少し字下げ"}).node("advCard",{lane:"lvl1",stack:1,kind:"card",title:"高度な使い方",subtitle:"中間の階層 · 少し字下げ"}).node("installCard",{lane:"lvl2",stack:0,kind:"card",title:"インストール",subtitle:"最も深い階層 · 大きく字下げ"}).node("firstCard",{lane:"lvl2",stack:1,kind:"card",title:"最初の図",subtitle:"最も深い階層 · 大きく字下げ"}).edge("introCard","gsCard",{label:"次へ",tone:"info"}).edge("gsCard","installCard",{label:"子",tone:"accent"}).edge("gsCard","firstCard",{label:"現在",tone:"success"}).readout.tocNav("tn",{source:"toc",colorActive:"#2563eb",label:"ドキュメント TOC"}).phase("p1",{duration:1800,title:"先頭を読む",body:"先頭の項目だけが青い。 印は各行の 3 つ目で、正の値を持つ行が今いる場所になる。"},e=>e.activate("introCard").set("toc",'[[0,"はじめに",1],[1,"スタートガイド",0],[2,"インストール",0],[2,"最初の図",0],[1,"高度な使い方",0],[0,"API リファレンス",0]]').badge("Intro")).phase("p2",{duration:1800,title:"下へ進む",body:"青い行が 2 つ目へ移る。 階層に応じた字下げは変わらず、色だけが動く。"},e=>e.activate("introCard","gsCard").set("toc",'[[0,"はじめに",0],[1,"スタートガイド",1],[2,"インストール",0],[2,"最初の図",0],[1,"高度な使い方",0],[0,"API リファレンス",0]]').badge("GS")).phase("p3",{duration:1800,title:"さらに下へ",body:"最も深い階層の行が青くなる。 6 行のうち出るのは先頭 6 行までで、字下げが 3 段に分かれる。"},e=>e.activate("introCard","apiCard","gsCard","advCard","installCard","firstCard").set("toc",'[[0,"はじめに",0],[1,"スタートガイド",0],[2,"インストール",0],[2,"最初の図",1],[1,"高度な使い方",0],[0,"API リファレンス",0]]').badge("First")).build(),$r="docs TOC (階層 3 段 + アクティブセクション) を 3-lane 分散 + tocNav readout 併存、 3 phase でスクロール進行によるアクティブセクション遷移を可視化",Kr=t("interactive-social-share-buttons",{topic:"SNS 4 種の共有ボタンを並べる"}).lane("tw",{x:0,width:200}).lane("fb",{x:220,width:200}).lane("li",{x:440,width:200}).arraySignal("shares",[["tw",245],["fb",89],["li",32],["rd",18]]).node("twCard",{lane:"tw",stack:0,kind:"card",title:"tw",subtitle:"共有が最も多い先"}).node("fbCard",{lane:"fb",stack:0,kind:"card",title:"fb",subtitle:"次に多い先"}).node("liCard",{lane:"li",stack:0,kind:"card",title:"li",subtitle:"中ほどの先"}).node("rdCard",{lane:"li",stack:1,kind:"card",title:"rd",subtitle:"共有が最も少ない先"}).edge("twCard","fbCard",{label:"拡散",tone:"info"}).edge("fbCard","liCard",{label:"拡散",tone:"info"}).edge("liCard","rdCard",{label:"拡散",tone:"info"}).readout.shareButtons("sb",{source:"shares",label:"シェア"}).phase("p1",{duration:1800,title:"投稿した直後",body:"4 つのボタンが並び、数はどれも小さい。 ボタンの大きさは数に依らず一定。"},e=>e.activate("twCard").set("shares",'[["tw",12],["fb",5],["li",3],["rd",1]]').badge("開始")).phase("p2",{duration:1800,title:"広まる",body:"数が桁 1 つぶん増える。 並びと色は変わらず、ボタンの中の数だけが上がる。"},e=>e.activate("twCard","fbCard","liCard").set("shares",'[["tw",98],["fb",41],["li",17],["rd",8]]').badge("拡散")).phase("p3",{duration:1800,title:"落ち着く",body:"4 つの差が最も開く。 5 つ渡しても出るのは **先頭 4 つ** までで、5 つ目は載らない。"},e=>e.activate("twCard","fbCard","liCard","rdCard").set("shares",'[["tw",245],["fb",89],["li",32],["rd",18],["hn",6]]').badge("バズ")).build(),Xr="ブログ記事 SNS シェア (Twitter / Facebook / LinkedIn / Reddit) を 3-lane 分散 + shareButtons readout 併存、 3 phase で投稿直後 → 広まる → 落ち着くの共有数変化を可視化",Zr=t("interactive-exemplar-payment-flow",{topic:"EC 決済を購入から記帳まで 4 段階で追う"}).lane("customer",{x:0,width:220}).lane("processor",{x:240,width:280}).lane("bank",{x:540,width:220}).state("amount",{initial:0}).state("auth3ds",{initial:0}).state("txStatus",{initial:0}).state("totalTx",{initial:1247}).node("customer",{lane:"customer",stack:0,kind:"shape-person",title:"田中様",eyebrow:"customer",subtitle:"購入者"}).node("mobile",{lane:"customer",stack:1,kind:"shape-mobile-device",title:"iPhone",eyebrow:"device",subtitle:"Safari / iOS 17"}).node("card",{lane:"customer",stack:2,kind:"shape-credit-card",title:"VISA **1234",eyebrow:"card",subtitle:"MUFG 発行"}).node("shop",{lane:"processor",stack:0,kind:"shape-online-shop",title:"BuyNow",eyebrow:"merchant",subtitle:"checkout · ¥{amount}"}).node("gateway",{lane:"processor",stack:1,kind:"shape-api-gateway",title:"API Gateway",eyebrow:"gateway",subtitle:"認証 + rate limit"}).node("provider",{lane:"processor",stack:2,kind:"shape-payment-provider",title:"Stripe",eyebrow:"provider",subtitle:"3DS {auth3ds}%"}).node("bankShape",{lane:"bank",stack:0,kind:"shape-bank",title:"MUFG",eyebrow:"issuer",subtitle:"発行銀行 · 与信照会"}).node("ledger",{lane:"bank",stack:1,kind:"shape-cylinder",title:"取引台帳",eyebrow:"database",subtitle:"記帳 + 監査 log"}).edge("customer","mobile",{label:"操作",tone:"info"}).edge("mobile","shop",{label:"購入",tone:"info"}).edge("shop","gateway",{label:"POST /pay",tone:"info"}).edge("gateway","provider",{label:"転送",tone:"info"}).edge("card","provider",{label:"3DS 認証",tone:"accent"}).edge("provider","bankShape",{label:"決済要求",tone:"success"}).edge("bankShape","ledger",{label:"記帳",tone:"success"}).readout.stat("amountStat",{source:"amount",unit:" 円",caption:"決済金額",label:"金額"}).readout.gauge("authGauge",{source:"auth3ds",min:0,max:100,color:"#22c55e",label:"3DS 認証 %"}).readout.trafficLight("statusTL",{source:"txStatus",label:"決済 status"}).readout.countup("totalCU",{source:"totalTx",unit:" 件",label:"本日累計 tx",decimals:0}).phase("p1",{duration:2200,title:"商品購入",body:"田中様が iPhone で BuyNow にアクセス、 checkout で購入決定。 amount 0 → 12500 tween (stat 金額上昇)、 txStatus = 0 (traffic-light 赤)、 auth3ds = 0 (gauge 針最下)。 顧客 + shop lane が active。"},e=>e.activate("customer","mobile","card","shop").tween("amount",0,12500).set("txStatus",0).set("auth3ds",0).badge("購入")).phase("p2",{duration:2500,title:"3DS 認証",body:"gateway 経由で Stripe に転送、 VISA カードの 3D-Secure 認証実行。 txStatus 0 → 1 tween (traffic-light 赤 → 黄)、 auth3ds 0 → 92% tween (gauge 針が緑域まで上昇)。 processor lane 全 activate、 card → provider の accent edge。"},e=>e.activate("customer","mobile","card","shop","gateway","provider").tween("txStatus",0,1).tween("auth3ds",0,92).badge("3DS 認証")).phase("p3",{duration:2e3,title:"銀行確定",body:"認証通過、 発行銀行 MUFG に与信照会 + 決済確定。 txStatus 1 → 2 tween (traffic-light 黄 → 緑)、 auth3ds 92 → 98% tween (最終確定)、 bank lane activate。"},e=>e.activate("customer","mobile","card","shop","gateway","provider","bankShape").tween("txStatus",1,2).tween("auth3ds",92,98).badge("銀行確定")).phase("p4",{duration:1800,title:"記帳完了",body:"銀行が取引台帳に記帳 + 監査 log 記録、 totalTx 1247 → 1248 tween (countup が +1 加算表示、 800ms かけて動的 count up)、 全 8 shape active、 決済 flow 完遂。"},e=>e.activate("customer","mobile","card","shop","gateway","provider","bankShape","ledger").tween("totalTx",1247,1248).set("txStatus",2).badge("記帳完了")).build(),ed="EC 決済実業務シナリオ = 4 phase (購入 → 3DS 認証 → 銀行確定 → 記帳) の flow を shape-* primitive 8 種で表現 + 4 readout が state を consume して表示に反映",td=t("interactive-exemplar-login-flow",{topic:"ログインと 2 要素認証を 5 段階で追う"}).lane("user",{x:0,width:200}).lane("auth",{x:220,width:300}).lane("session",{x:540,width:220}).state("authStatus",{initial:0}).state("successLogin",{initial:8421}).state("failRate",{initial:100}).state("latency",{initial:0}).node("customer",{lane:"user",stack:0,kind:"shape-person",title:"山田様",eyebrow:"user",subtitle:"email + password 送信"}).node("mobile",{lane:"user",stack:1,kind:"shape-mobile-device",title:"Pixel 8",eyebrow:"device",subtitle:"Chrome / Android 14"}).node("authApi",{lane:"auth",stack:0,kind:"shape-server-rack",title:"Auth API",eyebrow:"server",subtitle:"credential 一次検証"}).node("mfaCheck",{lane:"auth",stack:1,kind:"shape-diamond",title:"2FA 要求?",eyebrow:"decision",subtitle:"TOTP 6 桁 or SMS"}).node("jwtSign",{lane:"auth",stack:2,kind:"shape-hexagon",title:"JWT 発行器",eyebrow:"signer",subtitle:"RS256 · exp 1h"}).node("session",{lane:"session",stack:0,kind:"shape-cylinder",title:"Redis",eyebrow:"cache",subtitle:"TTL 3600s"}).node("token",{lane:"session",stack:1,kind:"shape-cloud",title:"JWT token",eyebrow:"response",subtitle:"Bearer · 302 redirect"}).edge("customer","mobile",{label:"入力",tone:"info"}).edge("mobile","authApi",{label:"POST /login",tone:"info"}).edge("authApi","mfaCheck",{label:"一次 OK",tone:"success"}).edge("mfaCheck","jwtSign",{label:"2FA OK",tone:"success"}).edge("jwtSign","session",{label:"sid 保存",tone:"success"}).edge("session","token",{label:"token 発行",tone:"success"}).readout.trafficLight("statusTL",{source:"authStatus",label:"認証 status (0/1/2)"}).readout.countup("successCU",{source:"successLogin",unit:" 回",label:"本日成功ログイン"}).readout.gauge("rateGauge",{source:"failRate",min:0,max:100,color:"#22c55e",label:"成功率 %"}).readout.bar("latencyBar",{source:"latency",min:0,max:500,color:"#f97316",label:"応答時間 ms"}).phase("p1",{duration:1500,title:"認証要求",body:"山田様が Pixel でログイン画面に credential 送信。 authStatus = 0 (traffic-light 赤 = 未検証)、 latency 0 → 80ms tween (bar 立ち上がり)、 gauge 100%、 countup 保持。 user lane 全 active。"},e=>e.activate("customer","mobile").set("authStatus",0).tween("latency",0,80).badge("要求")).phase("p2",{duration:2e3,title:"一次検証",body:"Auth API が credential 照合、 hash 比較。 authStatus 0 → 1 tween (traffic-light 赤 → 黄)、 latency 80 → 220ms tween (bcrypt で bar 伸長)、 gauge 100 → 99% tween (失敗も少数計上)。 authApi + mfaCheck lane activate。"},e=>e.activate("customer","mobile","authApi","mfaCheck").tween("authStatus",0,1).tween("latency",80,220).tween("failRate",100,99).badge("一次検証")).phase("p3",{duration:2200,title:"2FA 検証",body:"TOTP 6 桁認証、 認証サーバが time-window 比較。 authStatus 1 → 1 保持 (traffic-light 黄)、 latency 220 → 350ms tween (2FA overhead で bar さらに伸長)、 mfaCheck diamond が pending 状態。"},e=>e.activate("customer","mobile","authApi","mfaCheck").set("authStatus",1).tween("latency",220,350).badge("2FA")).phase("p4",{duration:2e3,title:"セッション発行",body:"2FA 通過、 JWT 発行 + Redis に session 保存。 authStatus 1 → 2 tween (traffic-light 黄 → 緑)、 latency 350 → 180ms tween (bar 縮小)、 gauge 99 → 99% 維持、 jwtSign + session lane activate。"},e=>e.activate("customer","mobile","authApi","mfaCheck","jwtSign","session").tween("authStatus",1,2).tween("latency",350,180).badge("発行")).phase("p5",{duration:1800,title:"応答返却",body:"JWT token を Bearer header で返却、 302 redirect。 successLogin 8421 → 8422 tween (countup が +1 加算表示、 900ms かけて動的)、 latency 180 → 50ms tween (最終)、 全 7 shape active。"},e=>e.activate("customer","mobile","authApi","mfaCheck","jwtSign","session","token").tween("successLogin",8421,8422).tween("latency",180,50).set("authStatus",2).badge("応答")).build(),ad="login + 2FA 実業務シナリオ = 5 phase (要求 → 一次検証 → 2FA → セッション発行 → 応答) の flow を shape-* primitive 7 種で表現 + 4 readout が state を consume して表示に反映",id=t("interactive-exemplar-notification-flow",{topic:"通知配信を発火から再送まで 5 段階で追う"}).lane("origin",{x:0,width:200}).lane("infra",{x:220,width:280}).lane("devices",{x:520,width:240}).state("queued",{initial:0}).state("delivered",{initial:0}).state("failed",{initial:0}).state("deliveryRate",{initial:0}).node("msg",{lane:"origin",stack:0,kind:"shape-message-bubble",title:"新着 message",eyebrow:"trigger",subtitle:'"注文が発送されました"'}).node("kafka",{lane:"infra",stack:0,kind:"shape-stack",title:"Kafka キュー",eyebrow:"queue",subtitle:"残 {queued} 件 · TTL 300s"}).node("fcm",{lane:"infra",stack:1,kind:"shape-cloud",title:"FCM Service",eyebrow:"notification",subtitle:"配信 batch 処理"}).node("retryGate",{lane:"infra",stack:2,kind:"shape-diamond",title:"retry 判定",eyebrow:"policy",subtitle:"指数 backoff · 最大 3 回"}).node("iphone",{lane:"devices",stack:0,kind:"shape-mobile-device",title:"iPhone",eyebrow:"device",subtitle:"APNs 経由 · foreground"}).node("pixel",{lane:"devices",stack:1,kind:"shape-mobile-device",title:"Pixel",eyebrow:"device",subtitle:"FCM 経由 · background"}).node("galaxy",{lane:"devices",stack:2,kind:"shape-mobile-device",title:"Galaxy",eyebrow:"device",subtitle:"圏外 → retry 対象"}).edge("msg","kafka",{label:"enqueue",tone:"info"}).edge("kafka","fcm",{label:"dequeue",tone:"info"}).edge("fcm","iphone",{label:"APNs 配信",tone:"success",labelOffsetY:-120}).edge("fcm","pixel",{label:"FCM 配信",tone:"success"}).edge("fcm","galaxy",{label:"初回失敗",tone:"error"}).edge("galaxy","retryGate",{label:"retry 要求",tone:"warning"}).edge("retryGate","fcm",{label:"再送指示",tone:"warning"}).readout.bar("queuedBar",{source:"queued",min:0,max:1e3,color:"#f97316",label:"queue 残"}).readout.countup("deliveredCU",{source:"delivered",unit:" 件",label:"配信成功",decimals:0}).readout.gauge("rateGauge",{source:"deliveryRate",min:0,max:100,color:"#22c55e",label:"配信成功率 %"}).readout.stat("failedStat",{source:"failed",unit:" 件",caption:"リトライ待ち",label:"失敗"}).phase("p1",{duration:1800,title:"event 発火",body:"注文発送 event が発生、 message-bubble から Kafka キューに enqueue。 queued 0 → 1000 tween (bar が右に伸長)、 delivered = 0、 failed = 0、 deliveryRate = 0% (gauge 針最下)。 origin + queue が active。"},e=>e.activate("msg","kafka").tween("queued",0,1e3).set("delivered",0).set("failed",0).set("deliveryRate",0).badge("発火")).phase("p2",{duration:2e3,title:"キューイング",body:"batch 化された 1000 件が処理待ち、 FCM Service が dequeue 開始。 queued 1000 → 800 tween (bar 縮小開始)、 fcm lane activate、 kafka → fcm edge が info tone で信号伝達。"},e=>e.activate("msg","kafka","fcm").tween("queued",1e3,800).badge("キュー")).phase("p3",{duration:2500,title:"配信中",body:"FCM が iPhone / Pixel / Galaxy へ fan-out 配信。 queued 800 → 50 tween (bar 大幅縮小)、 delivered 0 → 920 tween (countup が加速的 count up、 500/s peak)、 failed 0 → 80 tween、 deliveryRate 0 → 92% tween (gauge 針上昇)。 3 device 全 activate、 Galaxy は失敗 edge (error tone)。"},e=>e.activate("msg","kafka","fcm","iphone","pixel","galaxy").tween("queued",800,50).tween("delivered",0,920).tween("failed",0,80).tween("deliveryRate",0,92).badge("配信")).phase("p4",{duration:1800,title:"初回到達",body:"iPhone + Pixel は成功受信、 Galaxy は圏外で失敗。 queued 50 → 20 tween、 delivered 920 → 950 tween、 failed 80 → 50 tween、 deliveryRate 92 → 95% tween。 全 shape active。"},e=>e.activate("msg","kafka","fcm","iphone","pixel","galaxy").tween("queued",50,20).tween("delivered",920,950).tween("failed",80,50).tween("deliveryRate",92,95).badge("到達")).phase("p5",{duration:2e3,title:"リトライ",body:"失敗 50 件を retryGate が指数 backoff で再送、 Galaxy 圏内復帰後に配信成功。 queued 20 → 0 tween (bar 消失)、 delivered 950 → 992 tween (countup 最終)、 failed 50 → 8 tween (stat 減少)、 deliveryRate 95 → 99% tween (gauge 針最終)。 retryGate diamond が highlight。"},e=>e.activate("msg","kafka","fcm","retryGate","iphone","pixel","galaxy").tween("queued",20,0).tween("delivered",950,992).tween("failed",50,8).tween("deliveryRate",95,99).badge("retry")).build(),od="push 通知配信 + retry 実業務シナリオ = 5 phase (発火 → キュー → 配信 → 到達 → retry) の flow を shape-* primitive 7 種で表現 + 4 readout が state を consume して表示に反映",nd=Object.freeze(Object.defineProperty({__proto__:null,abTestResult:Un,activityPolar:bl,alertNotification:Tl,arrayLineChart:kn,arraySignalHistogram:pn,arrayStackedBar:mn,arrayWaterfall:Cn,audioPlayer:Ns,blogArticlePreview:Jr,buildStatusTrafficLight:xl,canvasMiniMap:zn,checkoutCartSummary:qr,checkoutCouponApply:Qr,chessStartingBoard:Ks,cliTerminalSession:zs,clickToggle:xo,colorPickerTheme:Oo,commitDiffCounter:Rl,contributionHeatmap:Jn,cryptoWallet:us,dashboardMetricsGrid:ns,dayScheduleTimeline:ir,decisionTree:En,deploySpinner:Ql,deviceBattery:is,dmReadReceipt:Pr,docsBreadcrumb:tr,docsTocNav:zr,dynamicReadouts:Ko,edgeFlowBind:tn,eip1559GasFlow:Dn,engineTachometer:ql,eventVariety:rn,examGrade:Jl,exemplarLoginFlow:td,exemplarNotificationFlow:id,exemplarPaymentFlow:Zr,featurePoll:vs,feedbackThumbRating:gr,formPasswordCheck:_r,formulaTextBind:vo,gitCommitList:xs,globalTimezoneClock:qs,gridLayoutMatrix:cn,inputSliderBar:wo,inputVariety:on,interactiveOauthFlow:In,issuePriorityBadge:gs,kpiBullet:wl,kpiDashboard:Gn,kpiIconTile:ds,loginOtpVerify:Tr,matrixHeatmap:An,mlConfidenceMeter:Kl,monthCalendarView:Js,npsTrendKpi:vr,numberSparkline:Ro,onboardingStepper:gl,opsAlertBanner:Or,pathProgressDemo:hn,perfBubbleChart:Fn,playerLeaderboard:fl,playlistSongQueue:Qs,portfolioDonut:Wn,postReactionPoll:fr,postReactions:Zl,priceCandlestick:Zn,prodLogTail:Mr,productPriceTag:Vl,productRating:_l,profileAvatarUpload:Rr,projectGantt:sl,publishWorkflowSteps:ur,radialHubAndSpoke:yn,radioSelect:Mo,readoutVariety:ln,renderOffsetDrift:Sn,repeatDeriveChain:$o,resourceTreemap:dl,revenueKpiCard:Kn,revenueScoreboard:vl,reviewerStack:fs,roomThermometer:ss,saasPricingTier:Vr,salesFunnel:nl,scoreSlope:il,scrollNarrative:fo,searchResults:_s,serverEventLog:Ps,serverUptimeStatus:nr,serviceHealthGrid:Hr,shapeArcSweep:Uo,shapeChainFill:qo,shapeCirclePulse:Go,shapePolyRotate:Yo,shapeRectFill:Ho,shapeWaveTank:jo,shippingOrderStatus:Os,signupFormSummary:Vs,skillRadar:Ln,socialShareButtons:Kr,sprintChecklist:Hl,sprintKanbanBoard:Zs,startupOrgChart:wr,stepperControl:To,subtitle__abTestResult:Qn,subtitle__activityPolar:hl,subtitle__alertNotification:Il,subtitle__arrayLineChart:wn,subtitle__arraySignalHistogram:bn,subtitle__arrayStackedBar:vn,subtitle__arrayWaterfall:xn,subtitle__audioPlayer:As,subtitle__blogArticlePreview:Yr,subtitle__buildStatusTrafficLight:Sl,subtitle__canvasMiniMap:$n,subtitle__checkoutCartSummary:Gr,subtitle__checkoutCouponApply:jr,subtitle__chessStartingBoard:Xs,subtitle__cliTerminalSession:$s,subtitle__clickToggle:So,subtitle__colorPickerTheme:Fo,subtitle__commitDiffCounter:El,subtitle__contributionHeatmap:Yn,subtitle__cryptoWallet:ps,subtitle__dashboardMetricsGrid:ls,subtitle__dayScheduleTimeline:or,subtitle__decisionTree:Mn,subtitle__deploySpinner:jl,subtitle__deviceBattery:os,subtitle__dmReadReceipt:Br,subtitle__docsBreadcrumb:ar,subtitle__docsTocNav:$r,subtitle__dynamicReadouts:Xo,subtitle__edgeFlowBind:an,subtitle__eip1559GasFlow:Tn,subtitle__engineTachometer:Gl,subtitle__eventVariety:dn,subtitle__examGrade:Yl,subtitle__exemplarLoginFlow:ad,subtitle__exemplarNotificationFlow:od,subtitle__exemplarPaymentFlow:ed,subtitle__featurePoll:ys,subtitle__feedbackThumbRating:kr,subtitle__formPasswordCheck:Dr,subtitle__formulaTextBind:yo,subtitle__gitCommitList:Ss,subtitle__globalTimezoneClock:Gs,subtitle__gridLayoutMatrix:un,subtitle__inputSliderBar:mo,subtitle__inputVariety:nn,subtitle__interactiveOauthFlow:Rn,subtitle__issuePriorityBadge:ks,subtitle__kpiBullet:ml,subtitle__kpiDashboard:Vn,subtitle__kpiIconTile:cs,subtitle__loginOtpVerify:Ir,subtitle__matrixHeatmap:Pn,subtitle__mlConfidenceMeter:Xl,subtitle__monthCalendarView:Ys,subtitle__npsTrendKpi:yr,subtitle__numberSparkline:Eo,subtitle__onboardingStepper:kl,subtitle__opsAlertBanner:Fr,subtitle__pathProgressDemo:gn,subtitle__perfBubbleChart:Hn,subtitle__playerLeaderboard:Cl,subtitle__playlistSongQueue:js,subtitle__portfolioDonut:qn,subtitle__postReactionPoll:Cr,subtitle__postReactions:es,subtitle__priceCandlestick:el,subtitle__prodLogTail:Lr,subtitle__productPriceTag:Ul,subtitle__productRating:Dl,subtitle__profileAvatarUpload:Er,subtitle__projectGantt:rl,subtitle__publishWorkflowSteps:pr,subtitle__radialHubAndSpoke:fn,subtitle__radioSelect:Lo,subtitle__readoutVariety:sn,subtitle__renderOffsetDrift:Nn,subtitle__resourceTreemap:cl,subtitle__revenueKpiCard:Xn,subtitle__revenueScoreboard:yl,subtitle__reviewerStack:Cs,subtitle__roomThermometer:rs,subtitle__saasPricingTier:Ur,subtitle__salesFunnel:ll,subtitle__scoreSlope:ol,subtitle__scrollNarrative:Co,subtitle__searchResults:Ds,subtitle__serverEventLog:Bs,subtitle__serverUptimeStatus:lr,subtitle__serviceHealthGrid:Wr,subtitle__shapeArcSweep:Qo,subtitle__shapeCirclePulse:Vo,subtitle__shapePolyRotate:zo,subtitle__shapeRectFill:Wo,subtitle__shapeWaveTank:Jo,subtitle__shippingOrderStatus:Fs,subtitle__signupFormSummary:Us,subtitle__skillRadar:On,subtitle__socialShareButtons:Xr,subtitle__sprintChecklist:Wl,subtitle__sprintKanbanBoard:er,subtitle__startupOrgChart:mr,subtitle__stepperControl:Io,subtitle__supportChat:Ll,subtitle__taskProgressGroup:_n,subtitle__teamActivityFeed:Bl,subtitle__teamAttendanceGrid:Ws,subtitle__teamKpiComparison:cr,subtitle__teamPresenceStatus:hr,subtitle__teamThreadSummary:Ar,subtitle__techPills:as,subtitle__techTagCloud:Al,subtitle__timelineDrive:en,subtitle__timerStopwatch:$l,subtitle__tournamentPodium:ms,subtitle__trafficSankey:pl,subtitle__tutorialVideoCards:Ls,subtitle__userAvatar:Fl,subtitle__userVenn:al,subtitle__visualBindBar:Ao,subtitle__visualBindOpacity:Bo,subtitle__voiceMessagePlayback:Sr,subtitle__weekCalendarView:rr,subtitle__weekWeather:Es,subtitle__worldMapPins:hs,subtitle__xypadNavigate:Do,subtitle__yearRoadmap:Is,supportChat:Ml,taskProgressGroup:Bn,teamActivityFeed:Pl,teamAttendanceGrid:Hs,teamKpiComparison:dr,teamPresenceStatus:br,teamThreadSummary:Nr,techPills:ts,techTagCloud:Nl,timelineDrive:Zo,timerStopwatch:zl,tournamentPodium:ws,trafficSankey:ul,tutorialVideoCards:Ms,userAvatar:Ol,userVenn:tl,visualBindBar:No,visualBindOpacity:Po,voiceMessagePlayback:xr,weekCalendarView:sr,weekWeather:Rs,worldMapPins:bs,xypadNavigate:_o,yearRoadmap:Ts},Symbol.toStringTag,{value:"Module"})),ld=t("eth-erc20-transfer",{topic:"ERC-20 の送金 — 残高表の書き換え"}).lane("l1",{x:0,width:240,label:"送り手"}).lane("l2",{x:0,width:240,label:"契約"}).lane("l3",{x:0,width:240,label:"受け手"}).state("balA",{initial:1e3}).state("balB",{initial:0}).state("moved",{initial:0}).node("alice",{lane:"l1",stack:0,kind:"dyn-wave",title:"Alice",subtitle:"{balA} TKN",w:160,h:220,shape:{kind:"wave",level:"{balA}",amplitude:1e3,frequency:2,waveHeight:6,fill:"#4e9dc4"}}).node("token",{lane:"l2",stack:0,kind:"shape-smart-contract",title:"トークン契約",subtitle:"残高表を持つ",w:200,h:220}).node("bob",{lane:"l3",stack:0,kind:"dyn-wave",title:"Bob",subtitle:"{balB} TKN",w:160,h:220,shape:{kind:"wave",level:"{balB}",amplitude:1e3,frequency:2,waveHeight:6,fill:"#22c55e"}}).edge("alice","token",{id:"e1",label:"250 送りたい",tone:"info"}).edge("token","bob",{id:"e2",label:"残高を加算",tone:"success"}).readout.countup("cu",{source:"moved",unit:" TKN",label:"動いた量",decimals:0}).phase("p1",{duration:2200,title:"① 送金を申し込む",body:"Alice が契約に「Bob へ 250 送って」 と伝える。 この時点ではまだ何も動いていない。"},e=>e.activate("alice").activate("token").badge("申込")).phase("p2",{duration:2400,title:"② 残高が足りるか確かめる",body:"契約は残高表を見て、 Alice が 250 以上持っているかを確認する。 足りなければここで失敗して終わる。"},e=>e.activate("token").badge("残高を確認")).phase("p3",{duration:3e3,title:"③ 数字を付け替える",body:"送り手から 250 を引き、 受け手に 250 を足す。 トークンという物が移動するのではなく、 契約が持つ表の数字が同時に書き換わるだけ。 2 人の合計は 1000 のまま変わらない。"},e=>e.activate("alice").activate("bob").tween("balA",1e3,750).tween("balB",0,250).tween("moved",0,250).badge("書き換え")).phase("p4",{duration:2e3,title:"④ 記録を残す",body:"Transfer という記録を残して完了。 外部のアプリはこの記録を読んで残高の変化を知る。"},e=>e.activate("token").activate("bob").badge("完了")).build(),sd=t("eth-eip1559-gas",{topic:"EIP-1559 — 手数料が混み具合で上下する"}).lane("l1",{x:0,width:240,label:"混み具合"}).lane("l2",{x:0,width:240,label:"基礎手数料"}).lane("l3",{x:0,width:240,label:"検証者の取り分"}).state("usage",{initial:50}).state("usageDeg",{initial:135}).state("base",{initial:20}).state("burn",{initial:0}).state("tip",{initial:2}).node("gauge",{lane:"l1",stack:0,kind:"dyn-arc",title:"使用率",subtitle:"{usage}%",w:180,h:180,shape:{kind:"arc",angle:"{usageDeg}",sweepMax:270,outerRadius:70,innerRadius:52,fill:"#e0803a"}}).node("basefee",{lane:"l2",stack:0,kind:"dyn-wave",title:"基礎手数料",subtitle:"{base} gwei",w:160,h:220,shape:{kind:"wave",level:"{base}",amplitude:60,frequency:2,waveHeight:6,fill:"#4e9dc4"}}).node("validator",{lane:"l3",stack:0,kind:"dyn-wave",title:"チップ",subtitle:"{tip} gwei",w:160,h:220,shape:{kind:"wave",level:"{tip}",amplitude:10,frequency:2,waveHeight:6,fill:"#22c55e"}}).edge("gauge","basefee",{id:"e1",label:"次のブロックへ",tone:"info"}).edge("basefee","validator",{id:"e2",label:"基礎分は消える",tone:"warning"}).readout.gauge("g",{source:"usage",min:0,max:100,color:"#e0803a",label:"使用率 %"}).readout.countup("burnCu",{source:"burn",unit:" gwei",label:"焼却の累計",decimals:0}).phase("p1",{duration:2200,title:"① 目標ちょうどのとき",body:"1 ブロックに詰められる量には上限があり、 その半分が目標。 ちょうど目標なら基礎手数料は据え置きで、 空いても混んでもいない状態。"},e=>e.activate("gauge").badge("据え置き")).phase("p2",{duration:3e3,title:"② 混んできたとき",body:"目標を超えて詰まると、 次のブロックの基礎手数料が上がる。 1 ブロックあたり最大 12.5% までしか動かないので、 一気に跳ね上がることはない。"},e=>e.activate("gauge").activate("basefee").tween("usage",50,95).tween("usageDeg",135,257).tween("base",20,45).badge("上がる")).phase("p3",{duration:2400,title:"③ 基礎分は誰の手にも渡らない",body:"払った基礎手数料は焼却されて消える。 検証者が受け取るのはチップだけ。 ここが以前の仕組みとの大きな違い。"},e=>e.activate("basefee").activate("validator").tween("burn",0,45).tween("tip",2,5).badge("焼却")).phase("p4",{duration:3e3,title:"④ 空いてきたとき",body:"目標を下回ると基礎手数料は下がる。 混雑が続かない限り自動的に元の水準へ戻っていく。 誰かが調整しているわけではなく、 式で決まる。"},e=>e.activate("gauge").activate("basefee").tween("usage",95,20).tween("usageDeg",257,54).tween("base",45,18).tween("burn",45,63).tween("tip",5,2).badge("下がる")).build(),rd=t("eth-erc4337-flow",{topic:"ERC-4337 — 財布を契約にして代理で払う"}).lane("l1",{x:0,width:240,label:"利用者"}).lane("l2",{x:0,width:240,label:"待ち行列"}).lane("l3",{x:0,width:240,label:"まとめ役"}).lane("l4",{x:0,width:240,label:"入口の契約"}).state("ops",{initial:0}).state("checked",{initial:0}).state("checkedDeg",{initial:0}).state("gasPaid",{initial:0}).node("owner",{lane:"l1",stack:0,kind:"shape-person",title:"利用者",subtitle:"鍵がなくてもよい",w:180,h:200}).node("mempool",{lane:"l2",stack:0,kind:"dyn-wave",title:"待ち行列",subtitle:"{ops} 件",w:160,h:220,shape:{kind:"wave",level:"{ops}",amplitude:5,frequency:2,waveHeight:6,fill:"#8a5a2a"}}).node("bundler",{lane:"l3",stack:0,kind:"shape-stack",title:"まとめ役",subtitle:"束ねて送る",w:180,h:200}).node("entrypoint",{lane:"l4",stack:0,kind:"dyn-arc",title:"入口の契約",subtitle:"{checked}% 検証",w:180,h:180,shape:{kind:"arc",angle:"{checkedDeg}",sweepMax:270,outerRadius:70,innerRadius:52,fill:"#4e9dc4"}}).edge("owner","mempool",{id:"e1",label:"やりたいこと",tone:"info"}).edge("mempool","bundler",{id:"e2",label:"拾い集める",tone:"info"}).edge("bundler","entrypoint",{id:"e3",label:"まとめて渡す",tone:"info"}).readout.countup("cu",{source:"gasPaid",unit:" gwei",label:"肩代わり額",decimals:0}).phase("p1",{duration:2400,title:"① やりたいことを書いて出す",body:"利用者は取引そのものではなく「やりたいこと」 を書いて出す。 秘密鍵で署名する代わりに、 指紋認証や複数人の承認でもよい。"},e=>e.activate("owner").activate("mempool").tween("ops",0,1).badge("要求を作る")).phase("p2",{duration:2600,title:"② まとめ役が拾い集める",body:"専用の待ち行列から複数人分をまとめ役が拾う。 1 つの取引にまとめることで、 1 人あたりの手数料が下がる。"},e=>e.activate("mempool").activate("bundler").tween("ops",1,5).badge("5 件を束ねる")).phase("p3",{duration:3e3,title:"③ 財布が自分で正しさを判断する",body:"入口の契約が各財布に「これはあなたの意思か」 と尋ね、 財布側の判定に従う。 判定の仕方は財布ごとに自由に書ける。 秘密鍵の照合に固定されていない点が従来と最も違う。"},e=>e.activate("entrypoint").tween("checked",0,100).tween("checkedDeg",0,270).badge("検証")).phase("p4",{duration:2400,title:"④ 手数料を肩代わりしてもらう",body:"手数料を肩代わりする契約を挟める。 利用者は手数料用の通貨を持っていなくても取引できる。 サービス側が負担する使い方が典型例。"},e=>e.activate("entrypoint").tween("gasPaid",0,180).tween("ops",5,0).badge("実行完了")).build(),dd=t("eth-block-production",{topic:"Ethereum のブロックができるまで"}).lane("l1",{x:0,width:240,label:"待ち行列"}).lane("l2",{x:0,width:240,label:"提案者"}).lane("l3",{x:0,width:240,label:"新しいブロック"}).lane("l4",{x:0,width:240,label:"他の検証者"}).state("pending",{initial:0}).state("included",{initial:0}).state("votes",{initial:0}).state("votesDeg",{initial:0}).node("pool",{lane:"l1",stack:0,kind:"dyn-wave",title:"待つ取引",subtitle:"{pending} 件",w:160,h:220,shape:{kind:"wave",level:"{pending}",amplitude:200,frequency:2,waveHeight:6,fill:"#8a5a2a"}}).node("picker",{lane:"l2",stack:0,kind:"shape-blockchain-node",title:"提案者",subtitle:"12 秒に 1 人",w:180,h:200}).node("newblock",{lane:"l3",stack:0,kind:"shape-blockchain-block",title:"ブロック",subtitle:"{included} 件",w:180,h:200}).node("voters",{lane:"l4",stack:0,kind:"dyn-arc",title:"賛成の割合",subtitle:"{votes}%",w:180,h:180,shape:{kind:"arc",angle:"{votesDeg}",sweepMax:270,outerRadius:70,innerRadius:52,fill:"#4e9dc4"}}).edge("pool","picker",{id:"e1",label:"取り出す",tone:"info"}).edge("picker","newblock",{id:"e2",label:"詰める",tone:"info"}).edge("newblock","voters",{id:"e3",label:"確かめる",tone:"warning"}).readout.percentRing("ring",{source:"votes",max:100,label:"賛成率"}).readout.countup("cu",{source:"included",unit:" 件",label:"収録済み",decimals:0}).phase("p1",{duration:2400,title:"① 取引が溜まっていく",body:"世界中から送られた取引が待ち行列に溜まる。 まだどのブロックにも入っていない状態。"},e=>e.activate("pool").tween("pending",0,180).badge("待ち行列")).phase("p2",{duration:2200,title:"② 提案者が選ばれる",body:"12 秒ごとに 1 人が提案者に選ばれる。 誰が選ばれるかは抽選で事前に決まるが、 直前まで公表されないので狙い撃ちされにくい。"},e=>e.activate("picker").badge("担当が決まる")).phase("p3",{duration:3e3,title:"③ ブロックに詰める",body:"提案者は待ち行列から取引を選んで詰める。 どれを入れるか、 どの順に並べるかは提案者の裁量。 手数料の高いものが選ばれやすい。"},e=>e.activate("picker").activate("newblock").tween("pending",180,60).tween("included",0,120).badge("120 件を収録")).phase("p4",{duration:2800,title:"④ 他の検証者が確かめる",body:"他の検証者がブロックの正しさを確認して賛成票を投じる。 賛成が集まらないブロックは次の提案者に選ばれず、 鎖から外れる。"},e=>e.activate("voters").activate("newblock").tween("votes",0,78).tween("votesDeg",0,211).badge("賛成を集める")).phase("p5",{duration:2400,title:"⑤ 確定する",body:"賛成が全体の 3 分の 2 を超え、 それが 2 期間 (約 13 分) 続くと、 このブロックは覆せなくなる。 それまでは理論上、 別の鎖に置き換わる余地が残っている。"},e=>e.activate("voters").tween("votes",78,96).tween("votesDeg",211,259).badge("覆せない")).build(),cd=Object.freeze(Object.defineProperty({__proto__:null,blockProduction:dd,eip1559Gas:sd,erc20Transfer:ld,erc4337Flow:rd},Symbol.toStringTag,{value:"Module"})),A=`title: "経路別の流入"
type: bar

actors:
  - 検索: "{search}"
  - SNS: "{sns}"
  - 直接: "{direct}"
  - 紹介: "{referral}"

states:
  search: 420
  sns: 310
  direct: 180
  referral: 90

animation:
  - step: "先月" 1.2s
    draw: bar
    description: "検索が 420 で最も多い"
  - step: "今月" 1.2s
    tween:
      search: 420 -> 680
      sns: 310 -> 420
      direct: 180 -> 150
      referral: 90 -> 240
    description: "紹介が 90 から 240 へ伸びる"
`,ud=`{
  "title": "経路別の流入",
  "type": "bar",
  "actors": [
    { "name": "検索", "subtitle": "{search}" },
    { "name": "SNS", "subtitle": "{sns}" },
    { "name": "直接", "subtitle": "{direct}" },
    { "name": "紹介", "subtitle": "{referral}" }
  ],
  "flow": [],
  "states": { "search": 420, "sns": 310, "direct": 180, "referral": 90 },
  "animation": [
    { "step": "先月", "duration": 1.2, "draw": "bar", "body": "検索が 420 で最も多い" },
    {
      "step": "今月",
      "duration": 1.2,
      "body": "紹介が 90 から 240 へ伸びる",
      "tween": {
        "search": [420, 680],
        "sns": [310, 420],
        "direct": [180, 150],
        "referral": [90, 240]
      }
    }
  ]
}`,pd=i(A),P=`title: "週ごとの応答時間"
type: line

actors:
  - W1: "{w1}"
  - W2: "{w2}"
  - W3: "{w3}"
  - W4: "{w4}"
  - W5: "{w5}"

states:
  w1: 180
  w2: 240
  w3: 210
  w4: 120
  w5: 95

animation:
  - step: "改善前" 1.2s
    draw: line
    description: "2 週目に 240 ms まで伸びている"
  - step: "改善後" 1.2s
    tween:
      w1: 180 -> 140
      w2: 240 -> 160
      w3: 210 -> 130
      w4: 120 -> 90
      w5: 95 -> 70
    description: "全週が下がり、山も消える"
`,bd=`{
  "title": "週ごとの応答時間",
  "type": "line",
  "actors": [
    { "name": "W1", "subtitle": "{w1}" },
    { "name": "W2", "subtitle": "{w2}" },
    { "name": "W3", "subtitle": "{w3}" },
    { "name": "W4", "subtitle": "{w4}" },
    { "name": "W5", "subtitle": "{w5}" }
  ],
  "flow": [],
  "states": { "w1": 180, "w2": 240, "w3": 210, "w4": 120, "w5": 95 },
  "animation": [
    { "step": "改善前", "duration": 1.2, "draw": "line", "body": "2 週目に 240 ms まで伸びている" },
    {
      "step": "改善後",
      "duration": 1.2,
      "body": "全週が下がり、山も消える",
      "tween": {
        "w1": [180, 140],
        "w2": [240, 160],
        "w3": [210, 130],
        "w4": [120, 90],
        "w5": [95, 70]
      }
    }
  ]
}`,hd=i(P),B=`title: "費用の内訳"
type: pie

actors:
  - 計算: "{compute}"
  - 保存: "{storage}"
  - 通信: "{network}"
  - その他: "{other}"

states:
  compute: 45
  storage: 25
  network: 20
  other: 10

animation:
  - step: "昨年" 1.2s
    draw: pie
    description: "計算が 45% で半分近くを占める"
  - step: "今年" 1.2s
    tween:
      compute: 45 -> 30
      storage: 25 -> 35
      network: 20 -> 25
      other: 10 -> 10
    description: "計算が下がり、保存が最大になる"
`,gd=`{
  "title": "費用の内訳",
  "type": "pie",
  "actors": [
    { "name": "計算", "subtitle": "{compute}" },
    { "name": "保存", "subtitle": "{storage}" },
    { "name": "通信", "subtitle": "{network}" },
    { "name": "その他", "subtitle": "{other}" }
  ],
  "flow": [],
  "states": { "compute": 45, "storage": 25, "network": 20, "other": 10 },
  "animation": [
    { "step": "昨年", "duration": 1.2, "draw": "pie", "body": "計算が 45% で半分近くを占める" },
    {
      "step": "今年",
      "duration": 1.2,
      "body": "計算が下がり、保存が最大になる",
      "tween": {
        "compute": [45, 30],
        "storage": [25, 35],
        "network": [20, 25],
        "other": [10, 10]
      }
    }
  ]
}`,kd=i(B),_=`title: "申込みまでの絞り込み"
type: funnel

actors:
  - 訪問: "{visit}"
  - 会員登録: "{signup}"
  - カート投入: "{cart}"
  - 申込み: "{order}"

states:
  visit: 12000
  signup: 3400
  cart: 1200
  order: 480

animation:
  - step: "改善前" 1.2s
    draw: funnel
    description: "訪問 12000 から申込み 480 まで絞られる"
  - step: "改善後" 1.2s
    tween:
      visit: 12000 -> 12000
      signup: 3400 -> 5200
      cart: 1200 -> 2400
      order: 480 -> 1100
    description: "入口は同じまま、途中の残り方が変わる"
`,wd=`{
  "title": "申込みまでの絞り込み",
  "type": "funnel",
  "actors": [
    { "name": "訪問", "subtitle": "{visit}" },
    { "name": "会員登録", "subtitle": "{signup}" },
    { "name": "カート投入", "subtitle": "{cart}" },
    { "name": "申込み", "subtitle": "{order}" }
  ],
  "flow": [],
  "states": { "visit": 12000, "signup": 3400, "cart": 1200, "order": 480 },
  "animation": [
    { "step": "改善前", "duration": 1.2, "draw": "funnel", "body": "訪問 12000 から申込み 480 まで絞られる" },
    {
      "step": "改善後",
      "duration": 1.2,
      "body": "入口は同じまま、途中の残り方が変わる",
      "tween": {
        "visit": [12000, 12000],
        "signup": [3400, 5200],
        "cart": [1200, 2400],
        "order": [480, 1100]
      }
    }
  ]
}`,md=i(_),D=`title: "公開までの段取り"
type: gantt

actors:
  - 設計: "1月"
  - 実装: "2月"
  - 検証: "4月"
  - 公開: "5月"

flow:
  - 設計 -> 実装: ""
  - 実装 -> 検証: ""
  - 検証 -> 公開: ""

animation:
  - step: "段取りを引く" 1.2s
    draw: gantt
    description: "帯が各工程の始まりから右へ伸び、依存の矢印は出揃ってから出る"
`,vd=`{
  "title": "公開までの段取り",
  "type": "gantt",
  "actors": [
    { "name": "設計", "subtitle": "1月" },
    { "name": "実装", "subtitle": "2月" },
    { "name": "検証", "subtitle": "4月" },
    { "name": "公開", "subtitle": "5月" }
  ],
  "flow": [
    { "from": "設計", "to": "実装", "label": "" },
    { "from": "実装", "to": "検証", "label": "" },
    { "from": "検証", "to": "公開", "label": "" }
  ],
  "animation": [
    {
      "step": "段取りを引く",
      "duration": 1.2,
      "draw": "gantt",
      "body": "帯が各工程の始まりから右へ伸び、依存の矢印は出揃ってから出る"
    }
  ]
}`,yd=i(D),T=`title: "初めて使うまで"
type: journey

actors:
  - 知る: "普通"
  - 登録: "{signup}"
  - 設定: "{setup}"
  - 初回の成功: "最高"

states:
  signup: "不満"
  setup: "満足"

animation:
  - step: "改善前" 1.2s
    draw: journey
    description: "登録でつまずき、設定でようやく持ち直す"
  - step: "改善後" 1.2s
    set:
      signup: "満足"
      setup: "最高"
    description: "登録の作りを直すと、その後の山も上がる"
`,fd=`{
  "title": "初めて使うまで",
  "type": "journey",
  "actors": [
    { "name": "知る", "subtitle": "普通" },
    { "name": "登録", "subtitle": "{signup}" },
    { "name": "設定", "subtitle": "{setup}" },
    { "name": "初回の成功", "subtitle": "最高" }
  ],
  "flow": [],
  "states": { "signup": "不満", "setup": "満足" },
  "animation": [
    { "step": "改善前", "duration": 1.2, "draw": "journey", "body": "登録でつまずき、設定でようやく持ち直す" },
    {
      "step": "改善後",
      "duration": 1.2,
      "body": "登録の作りを直すと、その後の山も上がる",
      "set": { "signup": "満足", "setup": "最高" }
    }
  ]
}`,Cd=i(T),I=`title: "図を速くする"
type: mind

actors:
  - 図を速くする: "{total} ms 短縮"
  - 描く量を減らす: "{paint} ms"
  - 計算を減らす: "{calc} ms"
  - 見えない所を省く: "{skip} ms"
  - 結果を覚える: "{cache} ms"

states:
  total: 0
  paint: 0
  calc: 0
  skip: 0
  cache: 0

animation:
  - step: "手を付ける前" 1.2s
    draw: mind
    description: "どの枝もまだ 0 ms"
  - step: "4 つを入れた後" 1.2s
    tween:
      paint: 0 -> 120
      calc: 0 -> 80
      skip: 0 -> 60
      cache: 0 -> 40
      total: 0 -> 300
    description: "枝ごとの短縮が積み上がって 300 ms になる"
`,xd=`{
  "title": "図を速くする",
  "type": "mind",
  "actors": [
    { "name": "図を速くする", "subtitle": "{total} ms 短縮" },
    { "name": "描く量を減らす", "subtitle": "{paint} ms" },
    { "name": "計算を減らす", "subtitle": "{calc} ms" },
    { "name": "見えない所を省く", "subtitle": "{skip} ms" },
    { "name": "結果を覚える", "subtitle": "{cache} ms" }
  ],
  "flow": [],
  "states": { "total": 0, "paint": 0, "calc": 0, "skip": 0, "cache": 0 },
  "animation": [
    { "step": "手を付ける前", "duration": 1.2, "draw": "mind", "body": "どの枝もまだ 0 ms" },
    {
      "step": "4 つを入れた後",
      "duration": 1.2,
      "body": "枝ごとの短縮が積み上がって 300 ms になる",
      "tween": {
        "paint": [0, 120],
        "calc": [0, 80],
        "skip": [0, 60],
        "cache": [0, 40],
        "total": [0, 300]
      }
    }
  ]
}`,Sd=i(I),R=`title: "着手の順番"
type: quadrant

actors:
  - 重複削除: "左上"
  - 描画刷新: "右上"
  - 配色統一: "{color}"
  - 旧記法: "{legacy}"

states:
  color: "左下"
  legacy: "右下"

animation:
  - step: "見直し前" 1.2s
    description: "配色統一と旧記法はどちらも後回しに置いてある"
  - step: "見直し後" 1.2s
    set:
      color: "左上"
      legacy: "右上"
    description: "効きを測り直すと、2 件とも上の段へ移る"
`,Nd=`{
  "title": "着手の順番",
  "type": "quadrant",
  "actors": [
    { "name": "重複削除", "subtitle": "左上" },
    { "name": "描画刷新", "subtitle": "右上" },
    { "name": "配色統一", "subtitle": "{color}" },
    { "name": "旧記法", "subtitle": "{legacy}" }
  ],
  "flow": [],
  "states": { "color": "左下", "legacy": "右下" },
  "animation": [
    { "step": "見直し前", "duration": 1.2, "body": "配色統一と旧記法はどちらも後回しに置いてある" },
    {
      "step": "見直し後",
      "duration": 1.2,
      "body": "効きを測り直すと、2 件とも上の段へ移る",
      "set": { "color": "左上", "legacy": "右上" }
    }
  ]
}`,Ad=i(R),E=`title: "配布物の構成"
type: tree

actors:
  - dragon
  - 記法
  - 描画
  - 読み取り
  - 配置

flow:
  - dragon -> 記法: ""
  - dragon -> 描画: ""
  - 記法 -> 読み取り: ""
  - 描画 -> 配置: ""

animation:
  - step: "構成を辿る" 1.2s
    draw: tree
    description: "枝が根から段ごとに伸び、箱は枝が届いてから出る"
`,Pd=`{
  "title": "配布物の構成",
  "type": "tree",
  "actors": [
    { "name": "dragon" },
    { "name": "記法" },
    { "name": "描画" },
    { "name": "読み取り" },
    { "name": "配置" }
  ],
  "flow": [
    { "from": "dragon", "to": "記法", "label": "" },
    { "from": "dragon", "to": "描画", "label": "" },
    { "from": "記法", "to": "読み取り", "label": "" },
    { "from": "描画", "to": "配置", "label": "" }
  ],
  "animation": [
    {
      "step": "構成を辿る",
      "duration": 1.2,
      "draw": "tree",
      "body": "枝が根から段ごとに伸び、箱は枝が届いてから出る"
    }
  ]
}`,Bd=i(E),_d=Object.freeze(Object.defineProperty({__proto__:null,chartBar:pd,chartLine:hd,chartPie:kd,funnelStages:md,ganttTimeline:yd,journeyMap:Cd,mindMap:Sd,quadrantMatrix:Ad,sourceJson__chartBar:ud,sourceJson__chartLine:bd,sourceJson__chartPie:gd,sourceJson__funnelStages:wd,sourceJson__ganttTimeline:vd,sourceJson__journeyMap:fd,sourceJson__mindMap:xd,sourceJson__quadrantMatrix:Nd,sourceJson__treeHierarchy:Pd,sourceYaml__chartBar:A,sourceYaml__chartLine:P,sourceYaml__chartPie:B,sourceYaml__funnelStages:_,sourceYaml__ganttTimeline:D,sourceYaml__journeyMap:T,sourceYaml__mindMap:I,sourceYaml__quadrantMatrix:R,sourceYaml__treeHierarchy:E,treeHierarchy:Bd},Symbol.toStringTag,{value:"Module"}));function Dd(e){return e.phases&&e.phases.length>0?e:{...e,phases:[{id:"p1",duration:1200,title:"static",body:"",activate:[],tweens:[],sets:[]}]}}function h(e){const n=[],s=new Map,b=new Map,u=new Map;for(const[d,c]of Object.entries(e))typeof c=="string"&&(d.startsWith("sourceYaml__")&&s.set(d.slice(12),c),d.startsWith("sourceJson__")&&b.set(d.slice(12),c),d.startsWith("subtitle__")&&u.set(d.slice(10),c));for(const[d,c]of Object.entries(e)){if(!c||typeof c!="object")continue;const g=c;if(!g.id||!g.nodes)continue;const f=Dd(g);n.push({id:g.id,title:d,subtitle:u.get(d)??g.topic??"",motionNote:O(f),diagram:f,sourceYaml:s.get(d),sourceJson:b.get(d)})}return n}const Rd={presets:h(L),primitives:[...h(Na),...h(Ya)],patterns:h(si),animation:h(mi),parts:[],styles:h(_i),cookbook:h(to),"text-dsl":h(ko),interactive:h(nd),ethereum:h(cd),charts:h(_d)};async function Ed(){const e=await M(()=>import("./parts.cdl-jk17Wa5r.js"),__vite__mapDeps([0,1,2]));return h(e)}const Md=80;export{Rd as C,Md as P,Ed as l};
