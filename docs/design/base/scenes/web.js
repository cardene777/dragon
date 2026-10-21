// URL を打ってから画面が出るまで。
// 大きな図の一部を窓に寄せて見せ、要求と応答が区画をまたいで走るのをカメラで追う。
// 窓の下の帯は動かず、全体図 (今見ている所の枠) と、段ごとにかかった時間の積み上げを出す。
DRAGON.add({
  id: "web",
  form: "arch",
  mode: "follow",
  title: "URL を打ってから画面が出るまで",
  short: "URL から画面が出るまで",
  label: "ブラウザに URL を打ってから、名前を引き、近くの配信拠点と繋ぎ、サービスの本体で組み立てた HTML が戻って画面に描かれるまでを、大きな図に寄って追いながら 13 段で動かす図",
  w: 728,
  h: 664,
  viewH: 460,
  world: { w: 1980, h: 900 },
  mini: { x: 16, y: 500, w: 216 },
  introSec: 2.6,
  intro: { t: "全体の地図", body: "上の窓は大きな図の一部を寄せて見ている。下の全体図の枠が今見ている所で、右の棒が段ごとにかかった時間を積み上げる。時間の数字は例。" },
  outro: { t: "通しで見る", body: "画面が出るまでの大半は、名前を引く、繋ぐ、本体で組み立てる、の待ち時間にある。2 回目からはブラウザ、OS、リゾルバ、拠点の控えが効き、多くの段を飛ばせる。" },
  steps: [
    { c: "blue", tag: "手元の端末", d: 2.8, t: "URL を打つ", body: "アドレス欄に example.com を打って Enter を押す。ブラウザはまず、この名前の IP アドレスを自分の控えに持っていないかを見る。" },
    { c: "blue", tag: "手元の端末", d: 2.4, t: "OS の控えを見る", code: "getaddrinfo(\"example.com\")", body: "ブラウザの控えに無いので、OS に名前を引くよう頼む。OS も最近引いた名前を控えているが、今回は無い。" },
    { c: "violet", tag: "名前を引く (DNS)", d: 2.6, t: "リゾルバに聞く", body: "OS は決めておいたリゾルバ (通信会社や公開の DNS) に問い合わせる。リゾルバの控えにも無いので、代わりに上から順に聞いて回る。" },
    { c: "violet", tag: "名前を引く (DNS)", d: 2.6, t: "ルートに聞く", body: "リゾルバはまずルートサーバーに聞く。ルートは答えそのものを持たず、com を受け持つサーバーの場所を返す。" },
    { c: "violet", tag: "名前を引く (DNS)", d: 2.6, t: "com に聞く", body: "次に com のサーバーに聞く。com のサーバーは、example.com を受け持つ権威サーバーの場所を返す。" },
    { c: "violet", tag: "名前を引く (DNS)", d: 4.2, t: "権威サーバーに聞く", code: "example.com → 203.0.113.10", body: "権威サーバーが IP アドレスを答える。リゾルバは答えを決められた時間 (TTL) だけ控え、OS を通してブラウザへ返す。" },
    { c: "amber", tag: "近くの配信拠点", d: 3.0, t: "近くの拠点と繋ぐ", body: "返ってきた IP アドレスは近くの CDN の拠点を指している。ブラウザは拠点と TCP の 3 回のやり取り (SYN、SYN+ACK、ACK) で繋ぐ。" },
    { c: "amber", tag: "近くの配信拠点", d: 3.4, t: "暗号の鍵を決める", body: "TLS 1.3 で暗号の鍵を決める。拠点は example.com の証明書を見せ、ブラウザは信頼できる発行元の署名かを確かめる。1 往復で済む。" },
    { c: "amber", tag: "近くの配信拠点", d: 3.0, t: "ページを頼む", code: "GET / HTTP/2", body: "暗号化した道でページを頼む。拠点はまず自分の控えに同じページの写しがあるかを見るが、今回は無い。" },
    { c: "green", tag: "サービスの本体", d: 2.8, t: "本体へ回す", body: "拠点は頼まれたページを本体へ取りに行く。振り分けが、空いているアプリのサーバーを選んで渡す。" },
    { c: "green", tag: "サービスの本体", d: 3.4, t: "集めて組み立てる", body: "アプリはまず控えの置き場 (例 Redis) を見て、無いので DB から記事を読む。集めた中身で HTML を組み立てる。" },
    { c: "green", tag: "サービスの本体", d: 4.2, t: "応答を返す", code: "200 OK", body: "HTML は振り分けと拠点を通って戻る。拠点は次の人のために写しを控える。最初の 1 byte がブラウザに届くまでを TTFB と呼ぶ。" },
    { c: "blue", tag: "画面を描く", d: 6.0, t: "画面を描く", body: "ブラウザは HTML を部品に分けて DOM を作り、CSS から見た目の木 (CSSOM) を作る。2 つを合わせて大きさと位置を決め、画素に塗って画面に出す。" },
  ],
  css: `
.wb-miss{font:700 11px var(--sans);fill:var(--t-rose)}
.wb-dot{fill:var(--line)}
.wb-url{fill:var(--sunk);stroke:var(--hair)}
.wb-ch{font:500 12px var(--mono);fill:var(--ink)}
.wb-caret{stroke:var(--c-blue);stroke-width:1.5}
.wb-sepl{stroke:var(--hair)}
.wb-prog{fill:var(--c-blue);transform-box:fill-box;transform-origin:0 50%}
.wb-empty{font:500 11px var(--sans);fill:var(--mute)}
.wb-lay{fill:none;stroke:var(--line);stroke-dasharray:3 3}
.wb-hd{fill:color-mix(in srgb,var(--c-blue) 16%,var(--surf))}
.wb-logo{fill:var(--c-blue)}
.wb-h1{font:700 15px var(--sans);fill:var(--ink)}
.wb-p{fill:color-mix(in srgb,var(--ink) 14%,transparent)}
.wb-a{fill:var(--c-blue)}
.wb-img{fill:color-mix(in srgb,var(--c-green) 14%,var(--surf))}
.wb-imgl{fill:color-mix(in srgb,var(--c-green) 42%,var(--surf))}
.wb-sun{fill:color-mix(in srgb,var(--c-amber) 55%,var(--surf))}
.wb-pop{fill:var(--surf);stroke:var(--hair)}
.wb-popt{font:700 11.5px var(--sans);fill:var(--ink)}
.wb-popr{font:500 11px var(--sans);fill:var(--ink2)}
.wb-ov rect{fill:color-mix(in srgb,var(--surf) 94%,transparent);stroke:color-mix(in srgb,var(--c) 55%,transparent);stroke-width:2.5}
.wb-ov text{font:800 32px var(--sans);fill:var(--ct)}
.wb-gl{stroke:var(--hair)}
.wb-tick{font:600 10.5px var(--mono);fill:var(--mute)}
.wb-rl{font:600 11px var(--sans);fill:var(--mute)}
.wb-rl-on{font:700 11px var(--sans);fill:var(--ink)}
.wb-track{fill:color-mix(in srgb,var(--ink) 7%,var(--surf))}
.wb-bar{fill:var(--c);transform-box:fill-box;transform-origin:0 50%}
.wb-val{font:700 10.5px var(--mono);fill:var(--ct)}
.wb-cur{stroke:var(--ink);stroke-width:1.25}
.wb-curk{fill:var(--ink)}
.wb-lg{font:500 10.5px var(--sans);fill:var(--ink2)}
.wb-sw{fill:var(--c)}
`,
  draw(E) {
    const { S, L, END, LAST, TOTAL, INTRO, OUT, EASE, kf, vis, until, pop, rise, cs, SH, r1, esc, tw, glyph, stepEnd } = E;

    // 区画。手元の端末と画面を描く所はどちらもブラウザの側なので同じ色にする
    E.band({ x: 0, y: 0, w: 560, h: 900, c: "violet", label: ["名前を", "引く"], ex: "DNS", g: "globe" });
    E.band({ x: 580, y: 0, w: 620, h: 440, c: "blue", label: ["手元の", "端末"], ex: "ブラウザと OS", g: "app" });
    E.band({ x: 580, y: 460, w: 620, h: 440, c: "blue", label: ["画面を", "描く"], ex: "ブラウザの中", g: "paint" });
    E.band({ x: 1220, y: 0, w: 760, h: 440, c: "amber", label: ["近くの", "配信拠点"], ex: "CDN", g: "cloud" });
    E.band({ x: 1220, y: 460, w: 760, h: 440, c: "green", label: ["サービスの", "本体"], ex: "origin", g: "server" });

    // 箱。箱の中の処理 (控えを探す、組み立てる) は下の字の書き換えで見せる
    const os = E.card({ c: "blue", cx: 690, cy: 380, name: "OS の名前の控え", sub: "最近引いた名前", g: "idx", on: [1, 2], swap: [[S[1] + 1.3, "控えに無い", "wb-miss"], [S[5] + 3.1, "答えを控えた", "ss-ok"]] });
    const res = E.card({ c: "violet", cx: 420, cy: 380, name: "リゾルバ", sub: "代わりに聞いて回る", g: "router", on: [2, 3, 4, 5], swap: [[S[2] + 1.2, "控えに無い", "wb-miss"], [S[3] + 0.2, "代わりに聞いて回る", "ss"], [S[5] + 2.1, "1 時間は控える", "ss-ok"]] });
    const root = E.card({ c: "violet", cx: 160, cy: 170, name: "ルート", sub: "com などの場所を知る", g: "globe", on: [3] });
    const com = E.card({ c: "violet", cx: 160, cy: 380, name: "com", sub: "com の名前を束ねる", g: "layers", on: [4] });
    const auth = E.card({ c: "violet", cx: 160, cy: 590, name: "権威サーバー", sub: "example.com の答え", g: "server", on: [5] });
    const edge = E.card({ c: "amber", cx: 1440, cy: 242, name: "CDN の拠点", sub: "近くで受ける", g: "cloud", on: [6, 7, 8, 9, 11], swap: [[S[6] + 2.5, "繋がった", "ss-ok"], [S[8] + 0.2, "近くで受ける", "ss"]] });
    const ec = E.card({ c: "amber", cx: 1700, cy: 242, name: "拠点の控え", sub: "写しを置いておく", g: "box", on: [8, 11], swap: [[S[8] + 1.7, "控えに無い", "wb-miss"], [S[11] + 2.9, "写しを控えた", "ss-ok"]] });
    const lb = E.card({ c: "green", cx: 1440, cy: 600, name: "振り分け", sub: "空いた所へ回す", g: "router", on: [9, 11] });
    const app = E.card({ c: "green", cx: 1680, cy: 600, name: "アプリ", sub: "HTML を組み立てる", g: "code", on: [9, 10, 11], swap: [[S[10] + 2.7, "HTML ができた", "ss-ok"], [S[11] + 1.0, "HTML を組み立てる", "ss"]] });
    const cache = E.card({ c: "green", cx: 1580, cy: 800, name: "控えの置き場", sub: "よく使う答え", g: "bolt", on: [10], swap: [[S[10] + 0.9, "控えに無い", "wb-miss"]] });
    const db = E.card({ c: "green", cx: 1830, cy: 800, name: "DB", sub: "記事と注文の元", g: "db", on: [10], swap: [[S[10] + 1.9, "記事を返した", "ss-ok"]] });
    // 描く段は 1 段の中で 4 つの箱を順に光らせるので、光る時刻を箱ごとに決める
    const PIPE = [
      [{ cx: 930, cy: 600, name: "HTML を解析", sub: "部品に分ける", g: "code" }, 0.9, 1.8],
      [{ cx: 1110, cy: 600, name: "DOM と CSSOM", sub: "形と見た目の木", g: "layers" }, 1.6, 2.5],
      [{ cx: 1110, cy: 800, name: "配置", sub: "大きさと位置を決める", g: "box" }, 2.3, 3.2],
      [{ cx: 930, cy: 800, name: "塗り", sub: "画素に描く", g: "paint" }, 3.0, 4.1],
    ];
    const [parse, dom, lay, paint] = PIPE.map(([o, a, b]) => {
      const g = E.card({ c: "blue", ...o });
      const act = E.rangeKf([[S[12] + a, S[12] + b]]), rect = (cls) => `<rect class="${cls}" x="${r1(g.x)}" y="${g.y}" width="${r1(g.w)}" height="72" rx="12"/>`;
      L.node.push(`<g style="${cs("blue")}"><g class="a" style="${act}">${rect("st-halo")}${rect("st-on")}</g></g>`);
      return g;
    });

    // ブラウザの窓。アドレス欄に字が入り、最後に画面が描かれる
    const BW = { x: 840, y: 40, w: 280, h: 260 };
    {
      const act = E.rangeKf([[S[0], stepEnd(1)], [S[5] + 3.3, stepEnd(5)], [S[6], stepEnd(8)], [S[11] + 2.3, END]]);
      const frame = (cls, extra = "") => `<rect class="${cls}" x="${BW.x}" y="${BW.y}" width="${BW.w}" height="${BW.h}" rx="12"${extra}/>`;
      const p = [`<g class="a" style="${act}">${frame("st-halo")}</g>${frame("st", ` ${SH}`)}<g class="a" style="${act}">${frame("st-on")}</g>`];
      p.push([856, 867, 878].map((x) => `<circle class="wb-dot" cx="${x}" cy="57" r="3.2"/>`).join(""));
      p.push(`<rect class="wb-url" x="896" y="46" width="212" height="22" rx="11"/><line class="wb-sepl" x1="${BW.x}" y1="76" x2="${BW.x + BW.w}" y2="76"/>`);
      // 打つ字は 1 字ずつ出す
      const url = "example.com", t0 = S[0] + 0.5;
      [...url].forEach((ch, k) => p.push(`<g class="a" style="${vis(t0 + k * 0.1, LAST, { f: 0.05 })}"><text class="wb-ch" x="${r1(922 + k * 7.22)}" y="61.5">${ch}</text></g>`));
      const caret = kf([[0, { opacity: 0, transform: "translateX(0px)" }], [t0 - 0.2, { opacity: 0, transform: "translateX(0px)" }], [t0 - 0.15, { opacity: 1 }], ...[...url].map((_, k) => [t0 + k * 0.1 + 0.05, { transform: `translateX(${r1((k + 1) * 7.22)}px)` }]), [S[0] + 2.2, { opacity: 1 }], [S[0] + 2.3, { opacity: 0 }], [TOTAL, { opacity: 0, transform: `translateX(${r1(url.length * 7.22)}px)` }]]);
      p.push(`<line class="wb-caret a" x1="922" y1="51" x2="922" y2="64" style="${caret}"/>`);
      p.push(`<g class="popc a" style="${cs("green")};${pop(S[7] + 2.4)}">${glyph("lock", 911, 57.5, "gl", 0.66)}</g>`);
      // 読み込みの進み具合
      const prog = kf([[0, { opacity: 0, transform: "scaleX(0)" }], [S[8], { opacity: 0, transform: "scaleX(0)" }], [S[8] + 0.2, { opacity: 1, transform: "scaleX(.12)" }], [S[9], { transform: "scaleX(.3)" }], [S[10], { transform: "scaleX(.5)" }], [S[11], { transform: "scaleX(.7)" }], [S[11] + 3.2, { transform: "scaleX(.9)" }], [S[12] + 4.1, { opacity: 1, transform: "scaleX(.96)" }], [S[12] + 4.6, { opacity: 1, transform: "scaleX(1)" }], [S[12] + 5.0, { opacity: 0 }], [TOTAL, { opacity: 0, transform: "scaleX(0)" }]]);
      p.push(`<rect class="wb-prog a" x="${BW.x + 1}" y="75" width="${BW.w - 2}" height="2.5" style="${prog}"/>`);
      // 中身。描く前は空で、配置の段で枠が、塗りの段で色が付く
      const cx = BW.x + BW.w / 2;
      p.push(`<g class="a" style="${until(S[8] - 0.1)}"><text class="wb-empty" x="${cx}" y="192" text-anchor="middle">新しいタブ</text></g>`);
      p.push(`<g class="a" style="${vis(S[8] + 0.1, S[12] + 4.0, { f: 0.2 })}"><text class="wb-empty" x="${cx}" y="192" text-anchor="middle">読み込み中…</text></g>`);
      const BOX = [[860, 92, 240, 22], [864, 124, 150, 20], [864, 148, 226, 36], [864, 188, 74, 10], [864, 204, 232, 80]];
      BOX.forEach(([x, y, w, h], k) => p.push(`<g class="a" style="${vis(S[12] + 4.1 + k * 0.08, S[12] + 5.0 + k * 0.1, { f: 0.2 })}"><rect class="wb-lay" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/></g>`));
      const paintAt = (k) => S[12] + 4.6 + k * 0.12;
      const page = [
        `<rect class="wb-hd" x="860" y="92" width="240" height="22" rx="5"/><circle class="wb-logo" cx="873" cy="103" r="5"/><rect class="wb-p" x="1040" y="100.5" width="16" height="5" rx="2.5"/><rect class="wb-p" x="1062" y="100.5" width="16" height="5" rx="2.5"/><rect class="wb-p" x="1084" y="100.5" width="10" height="5" rx="2.5"/>`,
        `<text class="wb-h1" x="864" y="140">Example Domain</text>`,
        `<rect class="wb-p" x="864" y="151" width="224" height="6" rx="3"/><rect class="wb-p" x="864" y="163" width="206" height="6" rx="3"/><rect class="wb-p" x="864" y="175" width="168" height="6" rx="3"/>`,
        `<rect class="wb-a" x="864" y="190" width="72" height="6" rx="3"/>`,
        `<rect class="wb-img" x="864" y="204" width="232" height="80" rx="8"/><circle class="wb-sun" cx="1062" cy="226" r="9"/><path class="wb-imgl" d="M 864 276 L 914 236 L 950 262 L 984 228 L 1044 276 Z"/>`,
      ];
      page.forEach((s, k) => p.push(`<g class="a" style="${vis(paintAt(k), LAST, { f: 0.3 })}">${s}</g>`));
      L.node.push(`<g style="${cs("blue")}">${p.join("")}</g>`);
      E.MINI.push({ kind: "card", x: BW.x, y: BW.y, w: BW.w, h: BW.h, c: "blue" });
    }

    // 道。行きと帰りは並べて引き、帰りの線は行きの内側を通す
    const P = {
      brOs: `M ${BW.x - 2} 236 C 760 236 ${os.cx - 12} 262 ${os.cx - 12} ${os.t - 2}`,
      osBr: `M ${os.cx + 10} ${os.t - 2} C ${os.cx + 10} 284 772 262 ${BW.x - 2} 262`,
      osRes: `M ${os.l - 2} 370 L ${res.r + 2} 370`,
      resOs: `M ${res.r + 2} 390 L ${os.l - 2} 390`,
      // 問いは外側、答えは内側を通し、2 本が交わらないようにする
      qRoot: `M ${res.cx - 2} ${res.t - 2} C ${res.cx - 2} 230 336 ${root.cy - 8} ${root.r + 2} ${root.cy - 8}`,
      aRoot: `M ${root.r + 2} ${root.cy + 8} C 318 ${root.cy + 8} ${res.cx - 18} 250 ${res.cx - 18} ${res.t - 2}`,
      qCom: `M ${res.l - 2} 370 L ${com.r + 2} 370`,
      aCom: `M ${com.r + 2} 390 L ${res.l - 2} 390`,
      qAuth: `M ${res.cx - 2} ${res.b + 2} C ${res.cx - 2} 530 336 ${auth.cy + 8} ${auth.r + 2} ${auth.cy + 8}`,
      aAuth: `M ${auth.r + 2} ${auth.cy - 8} C 318 ${auth.cy - 8} ${res.cx - 18} 510 ${res.cx - 18} ${res.b + 2}`,
      brEdge: `M ${BW.x + BW.w + 2} 232 L ${edge.l - 2} 232`,
      edgeBr: `M ${edge.l - 2} 254 L ${BW.x + BW.w + 2} 254`,
      edgeEc: `M ${edge.r + 2} 242 L ${ec.l - 2} 242`,
      edgeLb: `M ${edge.cx - 10} ${edge.b + 2} L ${edge.cx - 10} ${lb.t - 2}`,
      lbEdge: `M ${edge.cx + 10} ${lb.t - 2} L ${edge.cx + 10} ${edge.b + 2}`,
      lbApp: `M ${lb.r + 2} 591 L ${app.l - 2} 591`,
      appLb: `M ${app.l - 2} 609 L ${lb.r + 2} 609`,
      appCache: `M ${app.cx - 30} ${app.b + 2} C ${app.cx - 30} 700 ${cache.cx} 700 ${cache.cx} ${cache.t - 2}`,
      appDb: `M ${app.cx + 30} ${app.b + 2} C ${app.cx + 30} 700 ${db.cx} 700 ${db.cx} ${db.t - 2}`,
      dbApp: `M ${db.cx - 16} ${db.t - 2} C ${db.cx - 16} 712 ${app.cx + 14} 712 ${app.cx + 14} ${app.b + 2}`,
      brParse: `M ${parse.cx} ${BW.y + BW.h + 2} L ${parse.cx} ${parse.t - 2}`,
      parseDom: `M ${parse.r + 2} 600 L ${dom.l - 2} 600`,
      domLay: `M ${dom.cx} ${dom.b + 2} L ${lay.cx} ${lay.t - 2}`,
      layPaint: `M ${lay.l - 2} 800 L ${paint.r + 2} 800`,
      // 塗った画素は解析の箱の左を真っ直ぐ上り、窓の下から入る
      paintBr: `M ${paint.l - 2} 800 C 858 800 850 792 850 772 L 850 ${BW.y + BW.h + 4}`,
    };
    const ic = (g) => g.icon, inWin = [BW.x + 64, 262], inWinR = [BW.x + BW.w - 40, 243];
    const tag = (text, to, until) => ({ kind: "tag", text, to, until });
    const env = (to, until) => ({ kind: "env", to, until });

    // 線の名前、段の番号、運ぶ物は部品が置く。運ぶ物は封筒 (要求と応答) と札 (名前のある値) だけ
    E.stepAt(0, BW);
    E.edge(1, P.brOs, { label: "getaddrinfo()", lp: [728, 214], carry: tag("example.com", ic(os)) });
    E.edge(2, P.osRes, { carry: tag("example.com", ic(res)) });
    E.edge(3, P.qRoot, { k: 0, carry: tag("example.com") });
    E.edge(3, P.aRoot, { k: 0, at: 1.15, carry: tag("com の場所", ic(res)) });
    E.edge(4, P.qCom, { k: 0, carry: tag("example.com") });
    E.edge(4, P.aCom, { k: 0, at: 1.15, carry: tag("権威の場所", ic(res)) });
    E.edge(5, P.qAuth, { k: 0, carry: tag("example.com") });
    E.edge(5, P.aAuth, { k: 0, at: 1.1, carry: tag("203.0.113.10", ic(res)) });
    E.edge(5, P.resOs, { k: 0, at: 2.1, dur: 0.7, carry: tag("203.0.113.10", ic(os)) });
    E.edge(5, P.osBr, { k: 0, at: 3.3, dur: 0.7, carry: tag("203.0.113.10", inWin) });
    // 繋ぐ、鍵を決める、頼むの 3 段は同じ道を行き来するので、番号は道の始まりから順に並べる
    E.edge(6, P.brEdge, { k: 0, dur: 0.7, carry: tag("SYN") });
    E.edge(6, P.edgeBr, { k: 0, at: 0.95, dur: 0.7, carry: tag("SYN+ACK") });
    E.edge(6, P.brEdge, { k: 0, at: 1.8, dur: 0.7, ghost: false, carry: tag("ACK") });
    E.badge(7, BW.x + BW.w + 44, 232);
    E.edge(7, P.brEdge, { k: 0, dur: 0.7, ghost: false, carry: tag("ClientHello") });
    E.edge(7, P.edgeBr, { k: 0, at: 0.95, dur: 0.7, ghost: false, carry: tag("ServerHello と証明書") });
    E.edge(7, P.brEdge, { k: 0, at: 2.45, dur: 0.7, ghost: false, carry: tag("Finished") });
    E.badge(8, BW.x + BW.w + 72, 232);
    E.edge(8, P.brEdge, { k: 0, ghost: false, label: "GET / HTTP/2", lp: [1268, 217], carry: env(ic(edge)) });
    E.edge(8, P.edgeEc, { k: 0, at: 1.15 });
    E.edge(9, P.edgeLb, { k: 0, at: 0.2, carry: env(ic(lb)) });
    E.edge(9, P.lbApp, { k: 0, at: 1.2, carry: env(ic(app)) });
    E.edge(10, P.appCache, { k: 0, at: 0.2 });
    E.edge(10, P.appDb, { k: 0, at: 1.0, dur: 0.7, carry: tag("SELECT") });
    E.edge(10, P.dbApp, { k: 0, at: 1.8, dur: 0.7, carry: tag("記事", ic(app)) });
    E.edge(11, P.appLb, { k: 0, carry: env(ic(lb)) });
    E.edge(11, P.lbEdge, { k: 0, at: 1.1, carry: env(ic(edge)) });
    E.edge(11, P.edgeEc, { k: 0, at: 2.1, dur: 0.6, ghost: false, carry: { kind: "tag", text: "写し", who: "copy", until: S[11] + 3.1 } });
    E.edge(11, P.edgeBr, { k: 0, at: 2.3, label: "200 OK", lside: "below", carry: env(inWinR) });
    E.edge(12, P.brParse, { k: 0, at: 0.3, dur: 0.6, carry: tag("HTML", ic(parse)) });
    E.edge(12, P.parseDom, { k: 0, at: 1.1, dur: 0.6, carry: tag("DOM", ic(dom)) });
    E.edge(12, P.domLay, { k: 0, at: 1.8, dur: 0.6, carry: tag("描画の木", ic(lay)) });
    E.edge(12, P.layPaint, { k: 0, at: 2.5, dur: 0.6, carry: tag("配置", ic(paint)) });
    E.edge(12, P.paintBr, { k: 0, at: 3.2, dur: 0.9, carry: tag("画素") });

    // 証明書の札 (鍵を決める段だけ出る)
    {
      const x = 1330, y = 84, rows = ["信頼できる発行元の署名", "期限の内側", "名前が example.com"];
      const p = [`<rect class="wb-pop" x="${x}" y="${y}" width="176" height="92" rx="12" ${SH}/><text class="wb-popt" x="${x + 12}" y="${y + 19}">example.com の証明書</text>`];
      rows.forEach((t, k) => {
        const yy = y + 39 + k * 17;
        p.push(`<circle class="slot" cx="${x + 18}" cy="${yy - 4}" r="5"/><g class="popc a" style="${cs("green")};${pop(S[7] + 1.6 + k * 0.25, S[8] + 0.2)}"><circle class="ok" cx="${x + 18}" cy="${yy - 4}" r="5.5"/>${glyph("check", x + 18, yy - 4, "ck", 0.55)}</g><text class="wb-popr" x="${x + 30}" y="${yy}">${esc(t)}</text>`);
      });
      L.top.push(`<g class="a" style="${rise(S[7] + 1.2, S[8] + 0.2)}">${p.join("")}</g>`);
    }

    // 全体を見ている間だけ、区画の名前を大きく出す (寄った時の字は全体を見る大きさでは読めないため)
    {
      const show = kf([[0, { opacity: 1 }], [INTRO - 0.9, { opacity: 1 }, EASE], [INTRO - 0.5, { opacity: 0 }], [END + 1.5, { opacity: 0 }, OUT], [END + 2.0, { opacity: 1 }], [TOTAL, { opacity: 1 }]]);
      // 箱に被らない空いた所に置く
      const ov = [[280, 800, "名前を引く", "violet"], [700, 170, "手元の端末", "blue"], [740, 856, "画面を描く", "blue"], [1600, 370, "近くの配信拠点", "amber"], [1380, 800, "サービスの本体", "green"]];
      L.top.push(`<g class="a" style="${show}">${ov.map(([x, y, t, c]) => { const w = tw(t, 18, 32) + 48; return `<g class="wb-ov" style="${cs(c)}"><rect x="${x - w / 2}" y="${y - 30}" width="${w}" height="60" rx="30"/><text x="${x}" y="${y + 11}" text-anchor="middle">${t}</text></g>`; }).join("")}</g>`);
    }

    // 窓の下の帯で使う、段ごとにかかった時間 (例)。始まりと終わりは図の動きに合わせる
    E.web = {
      phases: [
        { n: "名前を引く", ms: 20, c: "violet", a: S[1] + 0.1, b: S[5] + 4.0 },
        { n: "繋ぐ", ms: 15, c: "amber", a: S[6] + 0.1, b: S[6] + 2.5 },
        { n: "鍵を決める", ms: 15, c: "amber", a: S[7] + 0.1, b: S[7] + 3.15 },
        { n: "最初の 1 byte", ms: 130, c: "green", a: S[8] + 0.1, b: S[11] + 3.2 },
        { n: "受け取る", ms: 20, c: "blue", a: S[11] + 3.2, b: S[11] + 4.0 },
        { n: "描く", ms: 60, c: "blue", a: S[12] + 0.3, b: S[12] + 5.0 },
      ],
    };
  },

  // カメラ。始めに全体を見せ、段ごとに今動いている所へ寄り、終わりに全体へ引く
  cam(E) {
    const { S, END, EASE } = E;
    const OV = [990, 450, 0.355];
    const T = {
      br: [980, 172, 1.25], brOs: [850, 250, 1.12], osRes: [560, 380, 1.2], root: [290, 270, 1.25], com: [300, 380, 1.25], auth: [290, 490, 1.25], back: [640, 330, 1.1],
      tcp: [1255, 214, 1.1], tls: [1190, 184, 1.1], get: [1290, 232, 1.1], ec: [1560, 240, 1.15], svc: [1560, 420, 1.05], app: [1690, 700, 1.1],
      ret: [1560, 430, 1.05], retBr: [1250, 236, 1.1], pipe: [1010, 640, 1.08], page: [980, 175, 1.22],
    };
    const go = (a, from, b, to) => [[a, ...from, EASE], [b, ...to]];
    return [
      [0, ...OV],
      ...go(E.INTRO - 0.7, OV, S[0] + 0.4, T.br),
      ...go(S[1], T.br, S[1] + 0.7, T.brOs),
      ...go(S[2], T.brOs, S[2] + 0.8, T.osRes),
      ...go(S[3], T.osRes, S[3] + 0.7, T.root),
      ...go(S[4], T.root, S[4] + 0.7, T.com),
      ...go(S[5], T.com, S[5] + 0.6, T.auth),
      ...go(S[5] + 2.0, T.auth, S[5] + 2.9, T.back),
      ...go(S[6], T.back, S[6] + 0.9, T.tcp),
      ...go(S[7], T.tcp, S[7] + 0.6, T.tls),
      ...go(S[8], T.tls, S[8] + 0.6, T.get),
      ...go(S[8] + 1.0, T.get, S[8] + 1.5, T.ec),
      ...go(S[9], T.ec, S[9] + 0.8, T.svc),
      ...go(S[10], T.svc, S[10] + 0.8, T.app),
      ...go(S[11], T.app, S[11] + 0.8, T.ret),
      ...go(S[11] + 1.9, T.ret, S[11] + 2.6, T.retBr),
      ...go(S[12], T.retBr, S[12] + 0.9, T.pipe),
      ...go(S[12] + 3.1, T.pipe, S[12] + 3.9, T.page),
      ...go(END + 0.6, T.page, END + 1.8, OV),
    ];
  },

  // 窓の下の帯。左は全体図と区画の色、右は段ごとにかかった時間を積み上げる滝の図
  hud(E, win) {
    const { kf, vis, rise, cs, SH, esc, r1, LAST, TOTAL, OUT, EASE, S } = E;
    const y0 = win.h + 12, H = E.sc.h - y0 - 2, phases = E.web.phases;
    const p = [`<rect class="strip" x="0.5" y="${y0 + 0.5}" width="${win.w - 1}" height="${H - 1}" rx="14" ${SH}/>`];
    p.push(`<text class="fl" x="16" y="${y0 + 20}">全体図</text><line class="sep" x1="248" y1="${y0 + 14}" x2="248" y2="${y0 + H - 14}"/>`);
    // 区画の色の見本
    const lg = [[16, 0, "手元の端末と描く所", "blue"], [16, 1, "名前を引く", "violet"], [130, 1, "近くの配信拠点", "amber"], [16, 2, "サービスの本体", "green"]];
    lg.forEach(([x, row, t, c]) => p.push(`<g style="${cs(c)}"><rect class="wb-sw" x="${x}" y="${y0 + 136 + row * 17}" width="9" height="9" rx="2.5"/><text class="wb-lg" x="${x + 14}" y="${y0 + 144.5 + row * 17}">${t}</text></g>`));

    // 滝の図
    const X0 = 360, X1 = 640, MAX = 300, X = (ms) => X0 + ((X1 - X0) * ms) / MAX;
    p.push(`<text class="sh" x="264" y="${y0 + 22}">かかった時間</text><text class="fl" x="350" y="${y0 + 22}">数字は例</text>`);
    for (const ms of [0, 100, 200, 300]) p.push(`<line class="wb-gl" x1="${r1(X(ms))}" y1="${y0 + 48}" x2="${r1(X(ms))}" y2="${y0 + H - 12}"/><text class="wb-tick" x="${r1(X(ms))}" y="${y0 + 40}" text-anchor="${ms === 0 ? "start" : ms === MAX ? "end" : "middle"}">${ms}${ms === MAX ? " ms" : ""}</text>`);
    let cum = 0;
    const tot = [[S[1] + 0.1, "0 ms", "fv"]];
    const cur = [[0, { transform: `translateX(${X0}px)` }]];
    phases.forEach((ph, k) => {
      const y = y0 + 62 + k * 20, x = X(cum), w = X(cum + ph.ms) - x;
      p.push(`<rect class="wb-track" x="${X0}" y="${y - 5}" width="${X1 - X0}" height="10" rx="3"/>`);
      p.push(`<text class="wb-rl" x="264" y="${y + 4}">${esc(ph.n)}</text><g class="a" style="${vis(ph.a, ph.b + 0.4, { f: 0.2 })}"><text class="wb-rl-on" x="264" y="${y + 4}">${esc(ph.n)}</text></g>`);
      const grow = kf([[0, { transform: "scaleX(0)" }], [ph.a, { transform: "scaleX(0)" }], [ph.b, { transform: "scaleX(1)" }], [LAST, { transform: "scaleX(1)" }, EASE], [TOTAL, { transform: "scaleX(0)" }]]);
      p.push(`<g style="${cs(ph.c)}"><rect class="wb-bar a" x="${r1(x)}" y="${y - 5}" width="${r1(Math.max(w, 2))}" height="10" rx="3" style="${grow}"/><g class="a" style="${rise(ph.b)}"><text class="wb-val" x="712" y="${y + 4}" text-anchor="end">${ph.ms} ms</text></g></g>`);
      cur.push([ph.a, { transform: `translateX(${r1(x)}px)` }], [ph.b, { transform: `translateX(${r1(x + w)}px)` }]);
      cum += ph.ms;
      tot.push([ph.b, `${cum} ms`, "fv"]);
    });
    // 合計は帯の欄と同じ形で、区切りごとに書き換える
    p.push(E.field(660, y0 + 20, "合計", tot, S[1] + 0.1));
    // 今の時刻の線。棒の伸びと同じ速さで右へ進む
    cur.push([LAST, { transform: `translateX(${r1(X(cum))}px)` }, EASE], [TOTAL, { transform: `translateX(${X0}px)` }]);
    const curVis = kf([[0, { opacity: 0 }], [S[1], { opacity: 0 }, OUT], [S[1] + 0.3, { opacity: 1 }], [LAST, { opacity: 1 }, EASE], [TOTAL, { opacity: 0 }]]);
    p.push(`<g class="a" style="${curVis}"><g class="a" style="${kf(cur)}"><line class="wb-cur" x1="0" y1="${y0 + 49}" x2="0" y2="${y0 + H - 12}"/><path class="wb-curk" d="M -4 ${y0 + 45} L 4 ${y0 + 45} L 0 ${y0 + 50} Z"/></g></g>`);
    return p.join("");
  },
});
