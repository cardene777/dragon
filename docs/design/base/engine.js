// dragon の見た目の見本帳の共通部分。
// 色の値、動きの組み立て、共通の部品、再生の釦、図の切り替えを持つ。図ごとの中身は scenes/*.js が DRAGON.add() で足す。
// 動きは全て CSS の keyframes が回し、釦は表示中の図の getAnimations() で一斉に止めて時刻を合わせる。
(() => {
  // 見た目の値は全て palettes.json の色味から読む (build.py が DRAGON_PALETTES として埋める)。
  // 色味ごとに明るい背景と暗い背景で別の値を持ち、色味は .p-<id>、明暗は .lt / .dk の class で切り替える。
  // 色の枠は blue / amber / green / violet / rose / slate の 6 つで、c- が線と塗り、t- が字に使う濃さ。
  const PALETTES = window.DRAGON_PALETTES;
  const vars = (o) => Object.entries(o).map(([k, v]) => `--${k}:${v}`).join(";");
  const baseCss = document.createElement("style");
  baseCss.textContent = Object.entries(PALETTES).map(([id, p]) => `.p-${id}.lt{${vars(p.light)}}.p-${id}.dk{${vars(p.dark)}}`).join("");
  document.head.appendChild(baseCss);
  const sceneCss = document.createElement("style");
  document.head.appendChild(sceneCss);

  const EASE = "cubic-bezier(.65,0,.35,1)", OUT = "cubic-bezier(.22,1,.36,1)", POP = "cubic-bezier(.34,1.56,.64,1)";
  const r1 = (v) => Math.round(v * 100) / 100;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pad = (n) => String(n).padStart(2, "0");
  // 等幅の英数字と和文で幅が違うので、字ごとに足す
  const tw = (t, a, c) => [...String(t)].reduce((s, ch) => s + (ch.charCodeAt(0) > 0x2e80 ? c : a), 0);

  // 箱と区画の印。どれも (0, 0) を中心に 20 四方へ収める
  const G = {
    app: "M -9 -7 h18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z M -11 -2 h22",
    router: "M -9 -4 h16 M 3 -8 l4 4 l-4 4 M 9 5 h-16 M -3 1 l-4 4 l4 4",
    on: "M -7 7 L 7 -7 M -1 -7 h8 v8",
    off: "M -7 -7 L 7 7 M 7 -1 v8 h-8",
    pool: "M -9 -5 a9 3.5 0 1 0 18 0 a9 3.5 0 1 0 -18 0 M -9 -5 v10 a9 3.5 0 0 0 18 0 v-10 M -9 0 a9 3.5 0 0 0 18 0",
    db: "M -9 -5 a9 3.5 0 1 0 18 0 a9 3.5 0 1 0 -18 0 M -9 -5 v10 a9 3.5 0 0 0 18 0 v-10 M -9 0 a9 3.5 0 0 0 18 0",
    exe: "M -5 -8 L 7 0 L -5 8 Z",
    idx: "M -9 -7 h18 M -9 -2 h18 M -9 3 h18 M -9 8 h11",
    sign: "M -9 4 c 3 -9 5 -9 6 0 s 3 7 6 -2 s 3 -6 6 0",
    env: "M -8 -5.5 h16 v11 h-16 z M -8 -5.5 l8 6 l8 -6",
    lock: "M -5.5 -1 h11 v8 h-11 z M -3.5 -1 v-3 a3.5 3.5 0 0 1 7 0 v3",
    check: "M -5 0 l3.5 3.5 l6.5 -7",
    x: "M -5 -5 l10 10 M 5 -5 l-10 10",
    chain: "M -1.5 4.5 l-2 2 a3.5 3.5 0 0 1 -5 -5 l3 -3 a3.5 3.5 0 0 1 5 0 M 1.5 -4.5 l2 -2 a3.5 3.5 0 0 1 5 5 l-3 3 a3.5 3.5 0 0 1 -5 0 M -2.5 2.5 l5 -5",
    net: "M -1.3 -4.6 L -5.8 3 M 1.3 -4.6 L 5.8 3 M -4.3 5.5 H 4.3 M -2.2 -7 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 M -9.2 5.5 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 M 4.8 5.5 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0",
    user: "M -4 -4.5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M -8 9 c0 -5 3.6 -7.5 8 -7.5 s8 2.5 8 7.5",
    server: "M -9 -8 h18 v7 h-18 z M -9 1 h18 v7 h-18 z M -5 -4.5 h0.01 M -5 4.5 h0.01",
    key: "M -9 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0 M -2 0 h10 M 5 0 v3.5 M 8 0 v2.5",
    shield: "M 0 -9 l8 3 v5 c0 5 -3.5 8 -8 10 c-4.5 -2 -8 -5 -8 -10 v-5 z",
    globe: "M -9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M -9 0 h18 M 0 -9 c-4.5 4 -4.5 14 0 18 M 0 -9 c4.5 4 4.5 14 0 18",
    bolt: "M 2 -9 L -5 1 h5 l-2 8 l7 -10 h-5 z",
    doc: "M -6 -9 h8 l5 5 v13 h-13 z M 2 -9 v5 h5 M -3 1 h7 M -3 5 h5",
    box: "M -9 -4.5 l9 -4.5 l9 4.5 v9 l-9 4.5 l-9 -4.5 z M -9 -4.5 l9 4.5 l9 -4.5 M 0 0 v9",
    truck: "M -10 -6 h11 v10 h-11 z M 1 -2 h5 l3.5 3.5 v2.5 h-8.5 M -7.5 6.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0 M 3 6.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0",
    card: "M -9 -6.5 h18 a2 2 0 0 1 2 2 v9 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-9 a2 2 0 0 1 2 -2 z M -11 -2 h22 M -7 3 h5",
    cart: "M -10 -8 h3 l3 11 h11 l2.5 -8 h-15.5 M -4.5 7.5 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M 5 7.5 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0",
    clock: "M -9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M 0 -5 v5 l3.5 2.5",
    branch: "M -4 -4.5 v9 M 5 0.5 c0 4 -9 3 -9 6.5 M -6.2 -7 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 M -6.2 7 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 M 2.8 -2 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0",
    cloud: "M -7 6 h13 a4.5 4.5 0 0 0 0.5 -9 a6 6 0 0 0 -11.5 -1 a4.5 4.5 0 0 0 -2 10 z",
    refresh: "M 7 -3 a7.5 7.5 0 1 0 0.5 5 M 7.5 -8 v5 h-5",
    layers: "M 0 -8 l9 4.5 l-9 4.5 l-9 -4.5 z M -9 2.5 l9 4.5 l9 -4.5",
    code: "M -4 -6 l-5 6 l5 6 M 4 -6 l5 6 l-5 6",
    paint: "M -8 8 c 0 -3 2 -5 4.5 -5 l 9 -9 l 3.5 3.5 l -9 9 c 0 2.5 -2 4.5 -5 4.5 z",
  };

  // 図の形ごとの小さな絵。飛ぶ先の札に出す
  const FORM = {
    arch: { name: "構成図", svg: `<rect x="3" y="3" width="22" height="6" rx="2"/><rect x="3" y="11" width="22" height="6" rx="2"/><rect x="3" y="19" width="22" height="6" rx="2"/><circle class="f" cx="8" cy="6" r="1.4"/><circle class="f" cx="20" cy="14" r="1.4"/><circle class="f" cx="12" cy="22" r="1.4"/>` },
    seq: { name: "時系列図", svg: `<path d="M6 3v22M22 3v22M6 9h13M16.5 6.5L19 9l-2.5 2.5M22 18H9M11.5 15.5L9 18l2.5 2.5"/>` },
    state: { name: "状態遷移図", svg: `<circle cx="7" cy="8" r="3.5"/><circle cx="21" cy="8" r="3.5"/><circle cx="14" cy="21" r="3.5"/><path d="M10.5 8h7M18.5 10.5l-3 7.5M11.5 18.5 8.5 11.5"/>` },
    graph: { name: "枝分かれの図", svg: `<path d="M3 20h22M9 20c0-8 5-11 10-11h6"/><circle class="f" cx="6" cy="20" r="2.2"/><circle class="f" cx="14" cy="20" r="2.2"/><circle class="f" cx="22" cy="20" r="2.2"/><circle class="f" cx="19" cy="9" r="2.2"/>` },
    time: { name: "時間軸の図", svg: `<path d="M3 21h22M7 18v6M14 18v6M21 18v6"/><rect x="4" y="5" width="5" height="8" rx="1.2"/><rect x="11.5" y="5" width="5" height="8" rx="1.2"/><rect x="19" y="5" width="5" height="8" rx="1.2"/>` },
  };
  const MODE = { fixed: "全体を止めて中を動かす", follow: "寄って追い、全体図で今を示す" };

  // 線の長さと途中の点を測る。描く前に 1 度だけ見えない svg へ置いて測り、すぐ外す
  const NS = "http://www.w3.org/2000/svg";
  let ruler = null;
  const measure = (d) => {
    if (!ruler) { ruler = document.createElementNS(NS, "svg"); ruler.setAttribute("style", "position:absolute;width:0;height:0;visibility:hidden"); document.body.appendChild(ruler); }
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    ruler.appendChild(p);
    const L = p.getTotalLength();
    return { L, at: (f) => { const q = p.getPointAtLength(L * Math.min(1, Math.max(0, f))); return [q.x, q.y]; }, drop: () => p.remove() };
  };

  const SCENES = [];
  const DRAGON = (window.DRAGON = { add: (s) => SCENES.push(s), PALETTES, G, FORM, MODE });

  // 図 1 枚分の部品と時刻。scene.draw(E) に渡す
  function engine(sc) {
    const id = sc.id, STEPS = sc.steps, N = STEPS.length, INTRO = sc.introSec ?? 1.4;
    const S = [];
    let acc = INTRO;
    for (const st of STEPS) { S.push(acc); acc += st.d; }
    const END = acc, TOTAL = Math.ceil(END + (sc.outroSec ?? 4.6)), LAST = TOTAL - 0.6;
    const stepEnd = (i) => S[i] + STEPS[i].d;
    const pct = (t) => +((Math.min(Math.max(t, 0), TOTAL) / TOTAL) * 100).toFixed(3);

    // 性質ごとに独立して補間されるので、点ごとに変える性質だけを書く
    const KF = [];
    let kn = 0;
    function kf(pts) {
      const name = `${id}-${kn++}`, by = new Map();
      for (const [t, props, ease] of [...pts].sort((a, b) => a[0] - b[0])) {
        const p = pct(t), cur = by.get(p) ?? { props: {}, ease: null };
        Object.assign(cur.props, props);
        if (ease) cur.ease = ease;
        by.set(p, cur);
      }
      KF.push(`@keyframes ${name}{${[...by].map(([p, { props, ease }]) => {
        const d = Object.entries(props).map(([k, v]) => `${k}:${v}`);
        if (ease) d.push(`animation-timing-function:${ease}`);
        return `${p}%{${d.join(";")}}`;
      }).join("")}}`);
      return `animation-name:${name}`;
    }
    // a で出て b で消える
    const vis = (a, b = LAST, o = {}) => {
      const f = o.f ?? 0.3, on = o.on ?? {}, off = o.off ?? {};
      return kf([[0, { opacity: 0, ...off }], [a, { opacity: 0, ...off }, o.ein ?? OUT], [a + f, { opacity: 1, ...on }], [b, { opacity: 1, ...on }, EASE], [Math.min(b + f, TOTAL), { opacity: 0, ...off }], [TOTAL, { opacity: 0, ...off }]]);
    };
    // 初めから出ていて b で消える
    const until = (b, f = 0.2) => kf([[0, { opacity: 1 }], [b, { opacity: 1 }, EASE], [b + f, { opacity: 0 }], [LAST, { opacity: 0 }], [TOTAL, { opacity: 1 }]]);
    const pop = (a, b = LAST) => vis(a, b, { f: 0.4, ein: POP, on: { transform: "scale(1)" }, off: { transform: "scale(.4)" } });
    const rise = (a, b = LAST) => vis(a, b, { on: { transform: "translateY(0px)" }, off: { transform: "translateY(5px)" } });
    const tf = (x, y, s = 1) => `translate(${r1(x)}px,${r1(y)}px) scale(${s})`;
    // [時刻, x, y, 大きさ, 次の点までの easing]
    const move = (pts, extra = []) => kf(pts.map(([t, x, y, s = 1, e]) => [t, { transform: tf(x, y, s) }, e]).concat(extra));
    const blink = (a, b, fade = 0.15) => [[0, { opacity: 0 }], [a - 0.01, { opacity: 0 }], [a, { opacity: 1 }], [b, { opacity: 1 }], [b + fade, { opacity: 0 }], [TOTAL, { opacity: 0 }]];

    const COIN = "--c:var(--coin);--ct:var(--coint)";
    const cs = (k) => (k === "coin" ? COIN : k === "ink" ? "--c:var(--ink);--ct:var(--ink)" : `--c:var(--c-${k});--ct:var(--t-${k})`);
    const SH = `filter="url(#sh-${id})"`;
    const glyph = (k, x, y, cls = "gl", s = 1) => `<path class="${cls}" transform="translate(${r1(x)} ${r1(y)}) scale(${s})" d="${G[k] ?? sc.icons?.[k] ?? ""}"/>`;

    // 重なりの順。後ろの層ほど手前に描く
    const L = { band: [], base: [], lit: [], mid: [], node: [], badge: [], top: [] };
    const compose = () => { flushCarry(); return Object.values(L).map((a) => a.join("")).join(""); };
    // 寄って追う図の全体図に写す形
    const MINI = [];

    // 時刻の範囲 [[a, b], ...] の間だけ出る
    const rangeKf = (ranges) => {
      const pts = [[0, { opacity: 0 }]];
      for (const [a, b] of ranges) pts.push([a, { opacity: 0 }, OUT], [a + 0.3, { opacity: 1 }], [b - 0.1, { opacity: 1 }, EASE], [b + 0.25, { opacity: 0 }]);
      pts.push([TOTAL, { opacity: 0 }]);
      return kf(pts);
    };
    // 段の番号の並び。続いた段は 1 つの範囲にまとめ、途中で消えないようにする
    const activeKf = (on) => {
      const r = [];
      for (let k = 0; k < on.length;) {
        let e = k;
        while (e + 1 < on.length && on[e + 1] === on[e] + 1) e++;
        r.push([S[on[k]], stepEnd(on[e])]);
        k = e + 1;
      }
      return rangeKf(r);
    };

    // 区画。名前は左の列の上に寄せ、区画の印を添える
    function band({ x = 0, y, w, h, c, label = [], ex = "", g }) {
      const lines = label.map((t, k) => `<text class="bz" x="${x + 14}" y="${y + 58 + k * 16}">${esc(t)}</text>`).join("");
      L.band.push(`<g style="${cs(c)}"><rect class="band" x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="14"/>` +
        (g ? `<rect class="bi" x="${x + 14}" y="${y + 14}" width="24" height="24" rx="7"/>${glyph(g, x + 26, y + 26, "gl", 0.68)}` : "") +
        `${lines}${ex ? `<text class="bx" x="${x + 14}" y="${y + 58 + label.length * 16 + 1}">${esc(ex)}</text>` : ""}</g>`);
      MINI.push({ kind: "band", x, y, w, h, c });
    }

    // 箱。今動いている箱は縁に色を付け、外側に淡い光を足す。高さは 72 で揃える
    // on は動いている段の番号の並び。swap は [時刻, 字, class] で下の小さな字を書き換える
    function card({ cx, cy, name, sub = "", g, c, on = [], swap = [], w }) {
      const W = w ?? Math.max(92, Math.max(tw(name, 7.7, 13), tw(sub, 6.6, 11)) + 24), x = cx - W / 2, y = cy - 36;
      const seq = [[0, sub, "ss"], ...swap];
      const subs = seq.map(([t, text, cls], k) => {
        const nxt = k + 1 < seq.length ? seq[k + 1][0] : null;
        const anim = k === 0 ? (nxt === null ? "" : until(nxt - 0.2)) : nxt === null ? rise(t) : rise(t, nxt - 0.2);
        return `<g${anim ? ` class="a" style="${anim}"` : ""}><text class="${cls}" x="${cx}" y="${cy + 27}" text-anchor="middle">${esc(text)}</text></g>`;
      }).join("");
      const act = on.length ? activeKf(on) : null, rect = (cls, extra = "") => `<rect class="${cls}" x="${r1(x)}" y="${y}" width="${r1(W)}" height="72" rx="12"${extra}/>`;
      L.node.push(`<g style="${cs(c)}">${act ? `<g class="a" style="${act}">${rect("st-halo")}</g>` : ""}${rect("st", ` ${SH}`)}${act ? `<g class="a" style="${act}">${rect("st-on")}</g>` : ""}` +
        `<rect class="ic" x="${cx - 12}" y="${cy - 28}" width="24" height="24" rx="7"/>${glyph(g, cx, cy - 16, "gl", 0.74)}` +
        `<text class="sn" x="${cx}" y="${cy + 12}" text-anchor="middle">${esc(name)}</text>${subs}</g>`);
      MINI.push({ kind: "card", x, y, w: W, h: 72, c });
      return { cx, cy, x, y, w: W, h: 72, l: x, r: x + W, t: y, b: y + 72, icon: [cx, cy - 16] };
    }

    // 線。点線で道を見せておき、その段で色の線を引いて、段の終わりまで流れる点で向きを見せる
    // 済んだ段は薄く残し、終わりに通った道を全て濃くし直す
    const arrowHead = (d) => {
      const n = d.match(/-?\d+(?:\.\d+)?/g).map(Number), ex = n[n.length - 2], ey = n[n.length - 1];
      let dx = ex - n[n.length - 4], dy = ey - n[n.length - 3];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      return `M ${r1(ex - dx * 6 - dy * 3.5)} ${r1(ey - dy * 6 + dx * 3.5)} L ${ex} ${ey} L ${r1(ex - dx * 6 + dy * 3.5)} ${r1(ey - dy * 6 - dx * 3.5)}`;
    };
    const seen = {}, marked = new Set();
    // 線。i はその線を引く段、d は線の形。
    // label を渡すと線の名前の札を出す。置き場所は線の中ほどの上 (横向きの線) か右 (縦向きの線) で、
    // 線より長くて入らない時だけ lp: [x, y] で札の中心を渡す。lside で "below" / "left" にも寄せられる。
    // carry を渡すと運ぶ物が線の上を走る。kind は env (封筒) / tag (名前のある値、text に字) / coin (硬貨)。
    // carry.to: [x, y] を渡すと、着いた後にその点 (受け取る箱の印) へ寄って段の終わりまで留まる。
    // その段の最初の線の始まりには段の番号が自動で付く。badge: false で外す
    function edge(i, d, o = {}) {
      const k = o.k ?? (seen[i] = (seen[i] ?? -1) + 1), ck = o.c ?? STEPS[i].c, c = cs(ck);
      const a = S[i] + (o.at ?? 0.1) + k * 0.5, b = a + (o.dur ?? (o.carry ? 0.9 : 0.55)), e = o.until ?? stepEnd(i), head = o.head !== false;
      if (o.ghost !== false) L.base.push(`<path class="e" d="${d}"/>${head ? `<path class="eh" d="${arrowHead(d)}"/>` : ""}`);
      const tail = [[e, { opacity: 1 }, EASE], [e + 0.4, { opacity: 0.45 }], [END + 0.3, { opacity: 0.45 }, EASE], [END + 1.0, { opacity: 0.95 }], [LAST, { opacity: 0.95 }, EASE], [TOTAL, { opacity: 0 }]];
      const line = kf([[0, { opacity: 0, "stroke-dashoffset": 1 }], [a, { opacity: 0, "stroke-dashoffset": 1 }, EASE], [a + 0.05, { opacity: 1 }], [b, { "stroke-dashoffset": 0 }], [LAST, { "stroke-dashoffset": 0 }], [TOTAL, { "stroke-dashoffset": 1 }], ...tail]);
      const hk = kf([[0, { opacity: 0 }], [b - 0.05, { opacity: 0 }], [b, { opacity: 1 }], ...tail]);
      const run = -(e - b) * 26;
      const flow = kf([[0, { opacity: 0, "stroke-dashoffset": 0 }], [b, { opacity: 0, "stroke-dashoffset": 0 }], [b + 0.25, { opacity: 0.9 }], [e - 0.1, { opacity: 0.9 }, EASE], [e + 0.2, { opacity: 0, "stroke-dashoffset": run }], [TOTAL, { opacity: 0, "stroke-dashoffset": run }]]);
      L.lit.push(`<g style="${c}"><path class="e-on a" pathLength="1" d="${d}" style="${line}"/>${head ? `<path class="eh-on a" d="${arrowHead(d)}" style="${hk}"/>` : ""}<path class="e-flow a" d="${d}" style="${flow}"/></g>`);
      const P = measure(d);
      // 段の番号は、その段で最初に引く線の始まりに置く
      if (o.badge !== false && !marked.has(i)) {
        // 短い線は始まりに置くと箱と重なるので、中ほどに置く
        const [bx, by] = P.at(P.L < 44 ? 0.5 : 14 / P.L);
        badge(i, r1(bx), r1(by));
      }
      if (o.label) {
        const mono = o.mono ?? !/[　-鿿]/.test(o.label), w = tw(o.label, 6.6, 11) + 18;
        let [lx, ly] = o.lp ?? [0, 0];
        if (!o.lp) {
          const [mx, my] = P.at(0.5), [x0, y0] = P.at(0.46), [x1, y1] = P.at(0.54), flat = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
          const side = o.lside ?? (flat ? "above" : "right");
          // 横の線では 22 離す。線の始まりの番号 (半径 9.5) と、線の上を走る封筒 (高さ 17) の両方に掛からない距離
          [lx, ly] = side === "above" ? [mx, my - 22] : side === "below" ? [mx, my + 22] : side === "left" ? [mx - w / 2 - 14, my] : [mx + w / 2 + 14, my];
        }
        label(r1(lx), r1(ly), o.label, a, e, ck, mono);
      }
      if (o.carry) carry(P, a, b, o.carry, o.carry.until);
      P.drop();
      return { a, b, e };
    }

    // 線の名前の札。その段の間だけ出す (済んだ名前を残すと積もって図がごちゃつくため)
    function label(cx, cy, t, a, e, ck, mono = true) {
      const w = tw(t, 6.6, 11) + 18, body = `<rect x="${r1(cx - w / 2)}" y="${cy - 10}" width="${r1(w)}" height="20" rx="10"/><text x="${cx}" y="${cy + 3.8}" text-anchor="middle">${esc(t)}</text>`;
      L.top.push(`<g class="cap${mono ? "" : " capj"} a" style="${cs(ck)};${rise(a + 0.15, e)}">${body}</g>`);
    }

    // 運ぶ物。線の上を走り、to があればその点へ寄って留まる
    const CARRY = {
      env: () => `<rect class="env" x="-12" y="-8.5" width="24" height="17" rx="3" ${SH}/><path class="env-in" d="M -8 -4.5 L 0 1.5 L 8 -4.5"/>`,
      coin: () => `<circle class="coin" r="6.5"/><circle class="coin-in" r="3.8"/>`,
      tag: (t) => { const w = tw(t, 6.6, 11) + 16; return `<rect class="car" x="${r1(-w / 2)}" y="-9" width="${r1(w)}" height="18" rx="9" ${SH}/><text class="car-t" y="3.7" text-anchor="middle">${esc(t)}</text>`; },
    };
    // 運ぶ物は、主役 (who) ごとに途切れず見え続ける。
    // 着いた後は次の同じ主役が出発するまで着いた先に留まり、次が無ければ終わりまで留まる。
    // until を渡した時だけ、その時刻で消える (焼かれる硬貨のように、そこで役目を終える物)。
    // absorb を立てると、着いた先へ吸い込まれて消える (届いた票のように、着いた先の状態に変わる物)。
    // who を渡さなければ、封筒と札は "main"、硬貨は "coin" の主役として扱う
    const CARRIES = [];
    function carry(P, a, b, o, until) {
      const N = 16, ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2), path = [];
      for (let n = 0; n <= N; n++) { const [x, y] = P.at(ease(n / N)); path.push([a + ((b - a) * n) / N, x, y]); }
      CARRIES.push({ who: o.who ?? (o.kind === "coin" ? "coin" : "main"), a, b, path, to: o.to, until: o.absorb ? b + 0.35 : until, html: CARRY[o.kind ?? "env"](o.text ?? "") });
    }
    function flushCarry() {
      const by = {};
      for (const c of CARRIES) (by[c.who] ??= []).push(c);
      for (const list of Object.values(by)) {
        list.sort((x, y) => x.a - y.a);
        list.forEach((c, k) => {
          const next = list[k + 1], rest = c.to ?? c.path[c.path.length - 1].slice(1);
          // 次が出発した瞬間に消す。着く前に次が出る時だけ、着くまでは走らせる
          const gone = c.until ?? (next ? Math.max(next.a, c.b) : LAST);
          // 主役の最初の運ぶ物は、図の始まりから出発点で待つ (何も見えない時間を作らないため)
          const from = k === 0 && c.who === "main" ? Math.min(S[0], c.a) : c.a;
          const pts = [[0, ...c.path[0].slice(1)], ...c.path];
          if (c.to) pts.push([Math.min(c.b + 0.3, Math.max(gone, c.b + 0.01)), ...rest]);
          pts.push([gone, ...rest], [TOTAL, ...rest]);
          // 次の運ぶ物と入れ替わる時は、重なって 2 つに見えないよう素早く消す
          const fade = next && c.until === undefined ? 0.05 : 0.18;
          L.top.push(`<g class="a carrier" style="${move(pts, blink(from + 0.02, gone, fade))}">${c.html}</g>`);
        });
      }
      CARRIES.length = 0;
    }

    // 線を持たない段の番号は、中心をその段で動く箱の左上の角に置く。箱の内側に置くと左上の絵柄に掛かる (#3187)
    const stepAt = (i, box) => badge(i, r1(box.x), r1(box.y));

    // 中身の帯の 1 欄。seq は [時刻, 字, class] の並びで、時刻ごとに字が入れ替わる
    function field(x, y, name, seq, at = INTRO) {
      const vals = seq.map(([t, text, cls = "fv"], k) => {
        const nxt = k + 1 < seq.length ? seq[k + 1][0] : null;
        const anim = nxt === null ? rise(t) : rise(t, nxt - 0.2);
        return `<g class="a" style="${anim}"><text class="${cls}" x="${x}" y="${y + 21}">${esc(text)}</text></g>`;
      }).join("");
      return `<g class="a" style="${rise(at)}"><text class="fl" x="${x}" y="${y}">${esc(name)}</text>${vals}</g>`;
    }

    // 段の番号。まだ来ていない段は出さず、今の段は塗り、済んだ段は縁取りに変えて番号を読めるまま残す。押すとその段へ移る
    function badge(i, x, y) {
      marked.add(i);
      const a = S[i], e = stepEnd(i);
      const fill = kf([[0, { opacity: 0, transform: "scale(.5)" }], [a, { opacity: 0, transform: "scale(.5)" }, POP], [a + 0.35, { opacity: 1, transform: "scale(1)" }], [e, { opacity: 1, transform: "scale(1)" }, EASE], [e + 0.4, { opacity: 0, transform: "scale(1)" }], [TOTAL, { opacity: 0, transform: "scale(.5)" }]]);
      const past = kf([[0, { opacity: 0 }], [e, { opacity: 0 }, EASE], [e + 0.4, { opacity: 1 }], [LAST, { opacity: 1 }, EASE], [TOTAL, { opacity: 0 }]]);
      const ring = kf([[0, { opacity: 0, transform: "scale(1)" }], [a + 0.05, { opacity: 0, transform: "scale(1)" }], [a + 0.1, { opacity: 0.7, transform: "scale(1)" }, OUT], [a + 0.9, { opacity: 0, transform: "scale(2.3)" }], [TOTAL, { opacity: 0, transform: "scale(1)" }]]);
      L.badge.push(`<g class="bd" data-step="${i}" role="button" tabindex="0" aria-label="${i + 1} 段目 ${esc(STEPS[i].t)} へ移る" style="${cs(STEPS[i].c)}"><circle class="bdr popc a" cx="${x}" cy="${y}" r="9" style="${ring}"/><g class="a" style="${past}"><circle class="bdp" cx="${x}" cy="${y}" r="9"/><text class="bdpt" x="${x}" y="${y + 3.5}" text-anchor="middle">${i + 1}</text></g><g class="popc a" style="${fill}"><circle class="bdf" cx="${x}" cy="${y}" r="9.5"/><text class="bdft" x="${x}" y="${y + 3.5}" text-anchor="middle">${i + 1}</text></g></g>`);
    }

    // 呼び出しの名札。mono を外すと和文の太さで出す
    function caption(cx, cy, t, a, b, c, mono = true) {
      const w = tw(t, 6.6, 11) + 18;
      L.top.push(`<g class="cap${mono ? "" : " capj"} a" style="${cs(c)};${rise(a, b)}"><rect x="${r1(cx - w / 2)}" y="${cy - 10}" width="${r1(w)}" height="20" rx="10"/><text x="${cx}" y="${cy + 3.8}" text-anchor="middle">${esc(t)}</text></g>`);
    }

    // 小さな札。outline で縁取りの形にする
    const tag = (x, y, w, t, c, a, b = LAST, o = {}) => `<g class="${o.outline ? "tgo" : "tg"}${o.mono ? " tgm" : ""} popc a" style="${cs(c)};${pop(a, b)}"><rect x="${x}" y="${y - 10.5}" width="${w}" height="15" rx="7.5"/><text x="${r1(x + w / 2)}" y="${y}" text-anchor="middle">${esc(t)}</text></g>`;

    // 中身の帯の地。欄の字は図ごとに .fl / .fv で置く
    function stripBg({ x = 0, y, w, h, title, g = "env", c = "blue", iconW = 24 }) {
      const my = y + h / 2;
      return `<rect class="strip" x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="14" ${SH}/><g style="${cs(c)}"><rect class="bi" x="${x + 12}" y="${my - 12}" width="${iconW}" height="24" rx="7"/>${glyph(g, x + 12 + iconW / 2, my, "gl", 0.78)}</g><text class="sh" x="${x + 44}" y="${my + 4.5}">${esc(title)}</text>`;
    }

    return { id, sc, STEPS, N, S, END, TOTAL, LAST, INTRO, EASE, OUT, POP, kf, vis, until, pop, rise, tf, move, blink, cs, COIN, SH, r1, esc, tw, pad, G, glyph, stepEnd, L, compose, MINI, rangeKf, activeKf, band, card, edge, label, carry, stepAt, field, measure, badge, caption, tag, stripBg, KF };
  }

  // 寄って追う図。world の中身をカメラの動きで動かし、全体図で今見ている所を示す
  // scene.cam(E) が [時刻, 見る中心 x, y, 寄り, 次の点までの easing] の並びを返す
  // viewH を渡すと窓の高さを svg の高さ (h) と分け、窓の下に scene.hud(E, { w, h: 窓の高さ }) で動かない帯を置ける
  // mini に { x, y, w } を渡すと全体図をその位置 (帯の上) に置く。渡さない時は窓の右上に札として重ね、mini.show = [出る, 消える] で出す時刻を絞れる
  function followSvg(sc, E, content) {
    const { id, r1: R } = E, vw = sc.w, vh = sc.viewH ?? sc.h, ww = sc.world.w, wh = sc.world.h;
    const cam = [...sc.cam(E)];
    if (cam[0][0] > 0) cam.unshift([0, ...cam[0].slice(1, 4)]);
    if (cam[cam.length - 1][0] < E.TOTAL) cam.push([E.TOTAL, ...cam[0].slice(1, 4)]);
    const camKf = E.move(cam.map(([t, cx, cy, s, e]) => [t, vw / 2 - s * cx, vh / 2 - s * cy, s, e]));
    const M = sc.mini ?? {}, inWin = M.x === undefined;
    const MW = M.w ?? 168, m = MW / ww, MH = wh * m, P = 8, at = M.at ?? "tr";
    const mx = inWin ? (at.includes("r") ? vw - MW - 12 - P : 12 + P) : M.x;
    const my = inWin ? (at.includes("t") ? 12 + P + 14 : vh - MH - 12 - P) : M.y;
    const mini = E.MINI.map((b) => `<rect class="mm-${b.kind}" style="${E.cs(b.c)}" x="${R(mx + b.x * m)}" y="${R(my + b.y * m)}" width="${R(b.w * m)}" height="${R(b.h * m)}" rx="${b.kind === "band" ? 3 : 1.5}"/>`).join("");
    // 見ている所の枠は、カメラと同じ時刻に同じ割合で動かす
    const vp = E.move(cam.map(([t, cx, cy, s, e]) => [t, mx + (cx - vw / (2 * s)) * m, my + (cy - vh / (2 * s)) * m, 1 / s, e]));
    const map = `<g clip-path="url(#mm-${id})"><rect class="mm-world" x="${R(mx)}" y="${R(my)}" width="${R(MW)}" height="${R(MH)}"/>${mini}<rect class="mm-vp a" width="${R(vw * m)}" height="${R(vh * m)}" rx="2" style="${vp}"/></g>`;
    const card = inWin ? `<g${M.show ? ` class="a" style="${E.vis(...M.show)}"` : ""}><rect class="mm-bg" x="${R(mx - P)}" y="${R(my - P - 14)}" width="${R(MW + P * 2)}" height="${R(MH + P * 2 + 14)}" rx="10" ${E.SH}/><text class="mm-t" x="${R(mx)}" y="${R(my - 6)}">全体図</text>${map}</g>` : map;
    return `<defs><clipPath id="vp-${id}"><rect width="${vw}" height="${vh}" rx="12"/></clipPath><clipPath id="mm-${id}"><rect x="${R(mx)}" y="${R(my)}" width="${R(MW)}" height="${R(MH)}" rx="4"/></clipPath>` +
      `<pattern id="dot-${id}" width="24" height="24" patternUnits="userSpaceOnUse"><circle class="vp-dot" cx="12" cy="12" r="1.1"/></pattern></defs>` +
      `<g clip-path="url(#vp-${id})"><rect class="vp-bg" width="${vw}" height="${vh}"/><g class="a" style="${camKf}"><rect x="-600" y="-600" width="${ww + 1200}" height="${wh + 1200}" fill="url(#dot-${id})"/>${content}</g></g>` +
      `<rect class="vp-frame" x="0.5" y="0.5" width="${vw - 1}" height="${vh - 1}" rx="12"/>` +
      (sc.hud ? sc.hud(E, { w: vw, h: vh }) : "") + card;
  }

  // 影は図ごとに id を分け、明暗の値で落とす
  const shadow = (id) => `<defs><filter id="sh-${id}" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="1" stdDeviation="0.8" style="flood-color:var(--sh);flood-opacity:var(--shA)"/><feDropShadow dx="0" dy="3" stdDeviation="4" style="flood-color:var(--sh);flood-opacity:var(--shB)"/></filter></defs>`;

  function renderScene(sc) {
    const E = engine(sc);
    const drawn = sc.draw(E);
    const content = typeof drawn === "string" ? drawn : E.compose();
    const body = sc.mode === "follow" ? followSvg(sc, E, content) : content;
    const svg = `<svg class="fig" viewBox="0 0 ${sc.w} ${sc.h}" role="group" aria-label="${E.esc(sc.label ?? sc.title)}。番号を押すとその段へ移る">${shadow(sc.id)}${body}</svg>`;

    // 語り
    const inkCs = E.cs("ink");
    const item = (cs, no, title, zone, body, code, a, b) => `<div class="it a" style="${cs};${E.kf([[0, { opacity: 0, transform: "translateY(6px)" }], [a - 0.1, { opacity: 0, transform: "translateY(6px)" }, E.OUT], [a + 0.25, { opacity: 1, transform: "translateY(0px)" }], [b - 0.12, { opacity: 1, transform: "translateY(0px)" }, E.EASE], [Math.min(b + 0.1, E.TOTAL), { opacity: 0, transform: "translateY(-6px)" }], [E.TOTAL, { opacity: 0, transform: "translateY(-6px)" }]])}"><div class="nno">${no}</div><div><div class="nt">${E.esc(title)}${zone ? `<span class="nz">${E.esc(zone)}</span>` : ""}</div><div class="nb">${E.esc(body)}</div>${code ? `<code>${E.esc(code)}</code>` : ""}</div></div>`;
    const narr = [item(inkCs, "▸", sc.intro.t, "", sc.intro.body, "", 0.1, E.INTRO)];
    E.STEPS.forEach((st, i) => narr.push(item(E.cs(st.c), `${pad(i + 1)}<small>/${E.N}</small>`, st.t, st.tag, st.body, st.code, E.S[i], E.stepEnd(i))));
    narr.push(item(inkCs, "✓", sc.outro.t, "", sc.outro.body, "", E.END, E.LAST + 0.5));
    const pg = E.kf([[0, { transform: "scaleX(0)" }], [E.INTRO, { transform: "scaleX(0)" }], [E.END, { transform: "scaleX(1)" }], [E.LAST, { transform: "scaleX(1)" }], [E.TOTAL, { transform: "scaleX(0)" }]]);
    const ticks = E.S.map((s) => `<i style="left:${E.r1(((s - E.INTRO) / (E.END - E.INTRO)) * 100)}%"></i>`).join("");

    sceneCss.textContent = (sc.css ?? "") + "\n" + E.KF.join("\n");
    return {
      E,
      html: `<div class="sc-h"><b>${E.esc(sc.title)}</b><span class="pill">${FORM[sc.form].name}</span><span class="pill">${MODE[sc.mode]}</span></div>` +
        `<div class="top"><div class="ctl"><button data-k="re" aria-label="最初から">↺</button><button data-k="pv" aria-label="前の段">‹</button><button data-k="pl" class="main" aria-label="止める">❚❚</button><button data-k="nx" aria-label="次の段">›</button></div>` +
        `<div class="track" data-k="tr"><div class="rail"></div><b class="a" style="${pg}"></b>${ticks}</div><div class="ctl"><button data-k="sp" aria-label="速さを変える">1×</button></div></div>` +
        `<div class="pn">${svg}<div class="narr" aria-live="off">${narr.join("")}</div></div>`,
    };
  }

  // 再生の釦。表示中の図の動きだけを相手にする
  function controller(root, E) {
    const q = (k) => root.querySelector(`[data-k="${k}"]`);
    const { S, STEPS, END, TOTAL, N } = E;
    const all = () => root.getAnimations({ subtree: true }).filter((a) => "animationName" in a);
    const now = () => { const a = all()[0]; return a ? ((Number(a.currentTime) || 0) / 1000) % TOTAL : 0; };
    const seek = (t) => all().forEach((a) => { a.currentTime = t * 1000; });
    const stepEnd = (i) => S[i] + STEPS[i].d * 0.96;
    let paused = false, rate = 1, watch = null;
    const icon = () => { q("pl").textContent = paused ? "▶" : "❚❚"; q("pl").setAttribute("aria-label", paused ? "流す" : "止める"); };
    const stopWatch = () => { if (watch) { clearInterval(watch); watch = null; } };
    const pause = () => { stopWatch(); all().forEach((a) => a.pause()); paused = true; icon(); };
    const play = () => { stopWatch(); all().forEach((a) => a.play()); paused = false; icon(); };
    const idx = (t) => { let i = -1; S.forEach((s, k) => { if (t >= s) i = k; }); return i; };
    const runTo = (target) => { play(); watch = setInterval(() => { if (now() >= target) { stopWatch(); seek(target); pause(); } }, 30); };
    const stepTo = (i) => { const was = paused; seek(S[i]); if (was) runTo(stepEnd(i)); };
    const next = () => {
      const t = now(), i = idx(t);
      if (t >= END) return;
      if (i >= 0 && paused && t < stepEnd(i) - 0.05) { runTo(stepEnd(i)); return; }
      if (i + 1 < N) stepTo(i + 1); else if (paused) runTo(END + 2.5); else seek(END);
    };
    const prev = () => { const t = now(), i = idx(t); pause(); seek(t >= END ? stepEnd(N - 1) : i > 0 ? stepEnd(i - 1) : 0); };
    root.querySelectorAll(".bd").forEach((g) => {
      const go = () => stepTo(Number(g.dataset.step));
      g.addEventListener("click", go);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); go(); } });
    });
    q("tr").addEventListener("click", (e) => { const r = q("tr").getBoundingClientRect(); seek(E.INTRO + ((e.clientX - r.left) / r.width) * (END - E.INTRO)); });
    q("pl").onclick = () => (paused ? play() : pause());
    q("nx").onclick = next;
    q("pv").onclick = prev;
    q("re").onclick = () => { seek(0); play(); };
    const RATES = [1, 2, 0.5];
    q("sp").onclick = () => {
      rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
      all().forEach((a) => (a.updatePlaybackRate ? a.updatePlaybackRate(rate) : (a.playbackRate = rate)));
      q("sp").textContent = (rate === 0.5 ? "½" : rate) + "×";
    };
    return { seek, pause, play, now, next, prev, toggle: () => (paused ? play() : pause()), stop: stopWatch, S, END, TOTAL };
  }

  DRAGON.boot = () => {
    const params = new URLSearchParams(location.search);
    const only = document.body.dataset.only;
    const list = only ? SCENES.filter((s) => s.id === only) : SCENES;
    const sd = document.createElement("div");
    sd.className = "sd lt p-paper";
    sd.innerHTML = `<div class="wrap"><header class="gh"><div><div class="gk">dragon の見た目の見本 ・ ${list.length} 枚</div><h1>図の形と題材を変えて、同じ見た目が保てるかを見る</h1></div>` +
      `<div class="sw"><div class="seg" role="group" aria-label="色味">${Object.entries(PALETTES).map(([id, p]) => `<button data-pal="${id}" aria-pressed="false">${p.name}</button>`).join("")}</div>` +
      `<div class="seg" role="group" aria-label="背景"><button data-theme="lt" aria-pressed="true">明るい</button><button data-theme="dk" aria-pressed="false">暗い</button></div></div></header>` +
      `<nav class="jump" aria-label="図へ飛ぶ">${list.map((s, k) => `<button class="jc" data-id="${s.id}" aria-current="false"><span class="ji"><svg viewBox="0 0 28 28" aria-hidden="true">${FORM[s.form].svg}</svg></span><span><span class="jt"><span class="jn">${pad(k + 1)}</span>${s.short ?? s.title}</span><span class="jm" style="display:block">${FORM[s.form].name} ・ ${s.mode === "follow" ? "寄って追う" : "全体を止める"}</span></span></button>`).join("")}</nav>` +
      `<section class="stage"></section><div class="keys"><kbd>←</kbd> <kbd>→</kbd> で段を送り、<kbd>Space</kbd> で止め、<kbd>1</kbd>〜<kbd>${list.length}</kbd> で図を替える</div></div>`;
    document.body.appendChild(sd);
    const stage = sd.querySelector(".stage");
    let cur = null;
    const show = (id) => {
      const sc = list.find((s) => s.id === id) ?? list[0];
      if (cur) cur.stop();
      const { E, html } = renderScene(sc);
      stage.style.setProperty("--T", `${E.TOTAL}s`);
      stage.innerHTML = html;
      cur = controller(stage, E);
      window.__seq = cur;
      sd.querySelectorAll(".jc").forEach((b) => b.setAttribute("aria-current", String(b.dataset.id === sc.id)));
      remember();
    };
    // 今の図、明暗、色味を URL に残し、開き直しても同じ見え方に戻す
    let pal = "paper", mode = "lt";
    const remember = () => {
      const id = sd.querySelector('.jc[aria-current="true"]')?.dataset.id ?? list[0].id;
      try { history.replaceState(null, "", `?scene=${id}&theme=${mode}&palette=${pal}`); } catch {}
    };
    const paint = () => {
      sd.className = `sd ${mode} p-${pal}`;
      document.body.style.background = PALETTES[pal][mode === "dk" ? "dark" : "light"].page;
      sd.querySelectorAll("[data-theme]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.theme === mode)));
      sd.querySelectorAll("[data-pal]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pal === pal)));
      remember();
    };
    const theme = (t) => { mode = t === "dk" ? "dk" : "lt"; paint(); };
    const palette = (p) => { pal = PALETTES[p] ? p : "paper"; paint(); };
    sd.querySelectorAll(".jc").forEach((b) => b.addEventListener("click", () => show(b.dataset.id)));
    sd.querySelectorAll("[data-theme]").forEach((b) => b.addEventListener("click", () => theme(b.dataset.theme)));
    sd.querySelectorAll("[data-pal]").forEach((b) => b.addEventListener("click", () => palette(b.dataset.pal)));
    document.addEventListener("keydown", (e) => {
      if (!cur) return;
      if (e.target instanceof HTMLButtonElement && (e.key === " " || e.key === "Enter")) return;
      if (e.key === " ") { e.preventDefault(); cur.toggle(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); cur.next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); cur.prev(); }
      else if (/^[1-9]$/.test(e.key) && list[Number(e.key) - 1]) show(list[Number(e.key) - 1].id);
    });
    mode = params.get("theme") === "dk" ? "dk" : "lt";
    palette(params.get("palette") ?? "paper");
    show(params.get("scene") ?? list[0].id);
    window.__gallery = { show, theme, palette };
  };
})();
