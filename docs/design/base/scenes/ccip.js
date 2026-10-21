// Chainlink CCIP 2.0 でメッセージとトークンが送信元チェーンから送信先チェーンへ届くまで。
// 3 つの区画を上から並べ、全体を止めたまま封筒とトークンを箱から箱へ動かす。
DRAGON.add({
  id: "ccip",
  form: "arch",
  mode: "fixed",
  title: "Chainlink CCIP でトークンを別のチェーンへ送る",
  short: "CCIP でトークンを送る",
  label: "Chainlink CCIP 2.0 でメッセージとトークンが送信元チェーンから送信先チェーンへ届くまでを、全体を止めたまま 13 段で動かす図",
  w: 728,
  h: 708,
  intro: { t: "全体の地図", body: "上から送信元チェーン、Chainlink のネットワーク、送信先チェーンの順に並ぶ。黒い封筒がメッセージで、下の帯にその中身が出る。段が進むと ID、署名、証明の印が付いていく。" },
  outro: { t: "通しで見る", body: "送る側は ccipSend() を 1 回呼ぶだけで、確定待ち、検証、実行は Chainlink の側が受け持つ。受け取る側で処理が落ちると FAILURE として残り、原因を直した後に誰でも手動で実行し直せる。" },
  steps: [
    { c: "blue", tag: "送信元チェーン", d: 3.0, t: "送る", code: "ccipSend(宛先チェーン, メッセージ)", body: "送る側のアプリがメッセージを作り、Router の ccipSend() を呼ぶ。メッセージには受け取る側、データ、送るトークンを入れ、手数料を LINK かそのチェーンの通貨で払う。" },
    { c: "blue", tag: "送信元チェーン", d: 2.2, t: "受け付ける", body: "Router が宛先に合った OnRamp へ渡す。Router はアプリから見たただ 1 つの入口で、どのチェーンでも同じ形をしている。" },
    { c: "blue", tag: "送信元チェーン", d: 2.8, t: "中身を確かめる", body: "OnRamp がトークンの数、ガスの上限、データの長さを確かめ、宛先が緊急停止されていないことも確かめる。通ったメッセージの ID が決まる。" },
    { c: "blue", tag: "送信元チェーン", d: 2.6, t: "トークンを預ける", code: "lockOrBurn()", body: "OnRamp が Token Pool の lockOrBurn() を呼ぶ。トークンは預かられるか焼かれ、送信元チェーンから出ていく。一度に送れる量の上限もここで効く。" },
    { c: "blue", tag: "送信元チェーン", d: 2.2, t: "出来事を残す", code: "CCIPMessageSent", body: "OnRamp が CCIPMessageSent を出し、メッセージは送信元チェーンのブロックに記録される。" },
    { c: "blue", tag: "送信元チェーン", d: 3.2, t: "確定を待つ", body: "既定では、そのブロックが確定するまで先へ進まない。チェーンごとの確定の条件を満たし、巻き戻らない状態になってから検証に入る。" },
    { c: "amber", tag: "Chainlink のネットワーク", d: 4.0, t: "検証して署名する", body: "Committee Verifier (Chainlink の DON) の各ノードが、送信元チェーンの記録とメッセージが合っているかを確かめて署名する。定足数の署名がそろうと、そのメッセージの証明になる。" },
    { c: "amber", tag: "Chainlink のネットワーク", d: 2.2, t: "証明を置く", code: "VerifierResult", body: "証明はメッセージの ID に結び付けて Indexer に置かれ、誰でも取り出せる。" },
    { c: "amber", tag: "Chainlink のネットワーク", d: 2.4, t: "証明をそろえる", body: "Executor がメッセージと、送信先が求める全ての証明を Indexer から集め、送信先チェーンへ運ぶ。" },
    { c: "green", tag: "送信先チェーン", d: 2.6, t: "実行を頼む", code: "OffRamp.execute()", body: "Executor が送信先チェーンの OffRamp の execute() を呼ぶ。この呼び出しは誰でもでき、Executor は代わりに打っているだけ。" },
    { c: "green", tag: "送信先チェーン", d: 2.8, t: "証明を確かめる", body: "OffRamp が各 CCV に証明を確かめさせる。求められた CCV が 1 つでも通らなければ実行しない。" },
    { c: "green", tag: "送信先チェーン", d: 2.6, t: "トークンを渡す", code: "releaseOrMint()", body: "OffRamp が Token Pool の releaseOrMint() を呼ぶ。トークンは解放されるか新しく発行され、受け取る側へ直接渡る。" },
    { c: "green", tag: "送信先チェーン", d: 3.6, t: "届ける", code: "ccipReceive()", body: "OffRamp が Router を通して受け取る側の ccipReceive() を呼ぶ。最後まで通ると、メッセージは SUCCESS として記録される。" },
  ],
  css: `
.blk{fill:var(--surf);stroke:var(--hair)}
.blk-top{fill:color-mix(in srgb,var(--c-blue) 16%,var(--surf))}
.blk-l{stroke:var(--line);stroke-width:1.4;stroke-linecap:round}
.blk-ph{fill:none;stroke:var(--line);stroke-dasharray:3 3}
.blk-m{fill:var(--surf);stroke:var(--c-blue);stroke-width:1.75}
.blk-f{fill:color-mix(in srgb,var(--c-blue) 18%,var(--surf));stroke:var(--c-blue);stroke-width:1.75}
.bl{font:500 11px var(--sans);fill:var(--mute)}
.bl-ok{font:700 11px var(--sans);fill:var(--t-blue)}
.bar-t{fill:var(--hair)}
.bar-f{fill:var(--c-blue);transform-box:fill-box;transform-origin:0 50%}
.pop-bg{fill:var(--surf);stroke:var(--hair)}
.pop-t{font:700 11.5px var(--sans);fill:var(--ink)}
.pop-r{font:500 11px var(--sans);fill:var(--ink2)}
.varc{fill:none;stroke:color-mix(in srgb,var(--c-amber) 45%,transparent);stroke-width:1.5;stroke-linecap:round;stroke-dasharray:0 4.5}
.vn{fill:var(--surf);stroke:var(--line)}
.vn-on{fill:var(--c-amber)}
.vg{fill:none;stroke:var(--mute);stroke-width:1.6;stroke-linecap:round}
.vg-on{fill:none;stroke:var(--on-c);stroke-width:1.6;stroke-linecap:round}
.vt{font:700 12.5px var(--sans);fill:var(--ink)}
.vs{font:500 11px var(--sans);fill:var(--mute)}
`,
  draw(E) {
    const { S, STEPS, N, L, LAST, TOTAL, END, OUT, EASE, POP, kf, vis, until, pop, rise, move, blink, cs, SH, r1, esc, glyph, stepEnd } = E;
    const ABSORB = S[N - 1] + 2.9;

    E.band({ y: 0, w: 728, h: 196, c: "blue", label: ["送信元", "チェーン"], ex: "例 Ethereum", g: "chain" });
    E.band({ y: 206, w: 728, h: 206, c: "amber", label: ["Chainlink", "ネットワーク"], ex: "DON", g: "net" });
    E.band({ y: 422, w: 728, h: 204, c: "green", label: ["送信先", "チェーン"], ex: "例 Arbitrum", g: "chain" });

    // 部品。箱は中心 (cx, cy)
    const ST = {
      app: { c: "blue", cx: 154, cy: 54, name: "送る側のアプリ", sub: "メッセージを作る", g: "app" },
      rtS: { c: "blue", cx: 328, cy: 54, name: "Router", sub: "ただ 1 つの入口", g: "router" },
      onR: { c: "blue", cx: 500, cy: 54, name: "OnRamp", sub: "確かめて送り出す", g: "on" },
      poolS: { c: "blue", cx: 668, cy: 54, name: "Token Pool", sub: "預かるか焼く", g: "pool" },
      idx: { c: "amber", cx: 360, cy: 334, name: "Indexer", sub: "証明を置く", g: "idx" },
      exe: { c: "amber", cx: 196, cy: 334, name: "Executor", sub: "実行を頼む", g: "exe" },
      offR: { c: "green", cx: 196, cy: 476, name: "OffRamp", sub: "確かめて実行する", g: "off" },
      rtD: { c: "green", cx: 420, cy: 476, name: "Router", sub: "ただ 1 つの入口", g: "router" },
      poolD: { c: "green", cx: 420, cy: 572, name: "Token Pool", sub: "解放するか発行", g: "pool" },
      recv: { c: "green", cx: 630, cy: 476, name: "受け取る側のアプリ", sub: "受け取って処理する", g: "app" },
    };
    const ACTIVE = [["app", "rtS"], ["rtS", "onR"], ["onR"], ["onR", "poolS"], ["onR"], [], [], ["idx"], ["idx", "exe"], ["exe", "offR"], ["offR"], ["offR", "poolD", "recv"], ["offR", "rtD", "recv"]];
    // 箱の下の小さな字は、その時に起きていることへ書き換わる
    const SWAP = {
      poolS: [[S[3] + 1.4, "−100 USDC", "ss-coin"]],
      idx: [[S[7] + 1.0, "証明を置いた", "ss-ok"]],
      poolD: [[S[11] + 0.6, "100 USDC を発行", "ss-coin"]],
      recv: [[S[11] + 2.5, "+100 USDC", "ss-coin"], [S[12] + 1.6, "ccipReceive()", "ss-code"], [ABSORB, "注文 #42 と 100 USDC", "ss-ok"]],
      offR: [[S[10] + 0.2, "CCV で確かめる", "ss-ok"], [S[11] + 0.1, "確かめて実行する", "ss"], [ABSORB, "SUCCESS を記録", "ss-ok"]],
    };
    const ICON = {}, BOX = {};
    for (const [id, s] of Object.entries(ST)) {
      const on = [];
      ACTIVE.forEach((a, i) => { if (a.includes(id)) on.push(i); });
      BOX[id] = E.card({ ...s, on, swap: SWAP[id] ?? [] });
      ICON[id] = BOX[id].icon;
    }
    const VER = { cx: 560, envY: 256 };

    // ブロックの列と確定
    {
      const BX = (i) => 483 + (i - 6) * 40, BY = 118;
      const block = (i) => `<rect class="blk" x="${BX(i)}" y="${BY}" width="34" height="26" rx="6"/><path class="blk-top" d="M ${BX(i) + 0.5} ${BY + 6.5} a6 6 0 0 1 6 -6 h21 a6 6 0 0 1 6 6 v1.5 h-33 z"/><path class="blk-l" d="M ${BX(i) + 8} ${BY + 14} h18 M ${BX(i) + 8} ${BY + 19} h12"/>`;
      const parts = [`<text class="bl" x="233" y="135" text-anchor="end">ブロック</text>`];
      for (let i = 0; i < 6; i++) parts.push(block(i));
      parts.push(`<rect class="blk-ph" x="${BX(6)}" y="${BY}" width="34" height="26" rx="6"/>`);
      parts.push(`<g class="popc a" style="${pop(S[4] + 0.85)}"><rect class="blk-m" x="${BX(6)}" y="${BY}" width="34" height="26" rx="6"/>${glyph("env", 500, BY + 13, "gl", 0.85)}</g>`);
      parts.push(`<g class="popc a" style="${pop(S[5] + 2.55)}"><rect class="blk-f" x="${BX(6)}" y="${BY}" width="34" height="26" rx="6"/>${glyph("lock", 500, BY + 13, "gl", 1.05)}</g>`);
      for (let k = 0; k < 5; k++) parts.push(`<g class="a" style="${vis(S[5] + 0.3 + k * 0.42, LAST, { on: { transform: "translateX(0px)" }, off: { transform: "translateX(14px)" } })}">${block(7 + k)}</g>`);
      const fill = [[0, { transform: "scaleX(0)" }], [S[5] + 0.3, { transform: "scaleX(0)" }]];
      for (let k = 0; k < 5; k++) fill.push([S[5] + 0.32 + k * 0.42, { transform: `scaleX(${k / 5})` }, OUT], [S[5] + 0.62 + k * 0.42, { transform: `scaleX(${(k + 1) / 5})` }]);
      fill.push([LAST, { transform: "scaleX(1)" }], [TOTAL, { transform: "scaleX(0)" }]);
      const done = S[5] + 2.55;
      parts.push(`<g class="a" style="${vis(S[5] + 0.1)}"><rect class="bar-t" x="556" y="156" width="161" height="5" rx="2.5"/><rect class="bar-f a" x="556" y="156" width="161" height="5" rx="2.5" style="${kf(fill)}"/><g class="a" style="${vis(S[5] + 0.1, done, { f: 0.2 })}"><text class="bl" x="717" y="177" text-anchor="end">確定まで</text></g><g class="a" style="${rise(done)}"><text class="bl-ok" x="717" y="177" text-anchor="end">確定した</text></g></g>`);
      L.mid.push(`<g style="${cs("blue")}">${parts.join("")}</g>`);
    }

    // OnRamp の確認表 (3 段目だけ出る)
    {
      const x = 542, y = 104, rows = ["トークンの数", "ガスの上限", "データの長さ", "宛先が止まっていない"];
      const parts = [`<rect class="pop-bg" x="${x}" y="${y}" width="172" height="84" rx="12" ${SH}/><text class="pop-t" x="${x + 12}" y="${y + 18}">OnRamp の確認</text>`];
      rows.forEach((t, k) => {
        const yy = y + 35 + k * 14;
        parts.push(`<circle class="slot" cx="${x + 18}" cy="${yy - 4}" r="5"/><g class="popc a" style="${cs("green")};${pop(S[2] + 0.55 + k * 0.32, S[3] + 0.15)}"><circle class="ok" cx="${x + 18}" cy="${yy - 4}" r="5.5"/>${glyph("check", x + 18, yy - 4, "ck", 0.55)}</g><text class="pop-r" x="${x + 30}" y="${yy}">${esc(t)}</text>`);
      });
      L.top.push(`<g class="a" style="${rise(S[2] + 0.15, S[3] + 0.15)}">${parts.join("")}</g>`);
    }

    // 検証者のノード。弧の上に 7 つ並べ、メッセージは弧の中心に置く
    const NODE = [];
    {
      const cx = VER.cx, cy = 248, R = 90;
      for (let k = 0; k < 7; k++) {
        const a = ((165 - k * 25) * Math.PI) / 180;
        NODE.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
      }
      const [ax, ay] = NODE[0], [bx, by] = NODE[6];
      const verOn = E.activeKf([6]);
      const parts = [`<g class="a" style="${verOn}"><rect class="st-halo" x="448" y="224" width="224" height="170" rx="16"/></g><rect class="st" x="448" y="224" width="224" height="170" rx="16" ${SH}/><g class="a" style="${verOn}"><rect class="st-on" x="448" y="224" width="224" height="170" rx="16"/></g><path class="varc" d="M ${r1(ax)} ${r1(ay)} A ${R} ${R} 0 0 0 ${r1(bx)} ${r1(by)}"/><text class="vt" x="${cx}" y="368" text-anchor="middle">Committee Verifier</text><text class="vs" x="${cx}" y="382" text-anchor="middle">署名を集めて証明を作る</text>`];
      NODE.forEach(([x, y], k) => {
        parts.push(`<circle class="vn" cx="${r1(x)}" cy="${r1(y)}" r="14" ${SH}/>${glyph("sign", x, y, "vg", 0.62)}`);
        parts.push(`<g class="popc a" style="${pop(S[6] + 1.0 + k * 0.32)}"><circle class="vn-on" cx="${r1(x)}" cy="${r1(y)}" r="14"/>${glyph("sign", x, y, "vg-on", 0.62)}</g>`);
      });
      L.node.push(`<g style="${cs("amber")}">${parts.join("")}</g>`);
      E.MINI.push({ kind: "card", x: 448, y: 224, w: 224, h: 170, c: "amber" });
    }

    // 線。名前、番号、運ぶ物は部品が置く。線が短くて名前が入らない所だけ lp で脇の空きへ寄せる
    const P = { ...ICON, ver: [VER.cx, VER.envY] };
    E.edge(0, "M 211 54 L 273 54", { label: "ccipSend()", lp: [242, 104], carry: { kind: "env", to: P.rtS }, at: 0.9 });
    E.edge(1, "M 383 54 L 444 54", { carry: { kind: "env", to: P.onR } });
    E.stepAt(2, BOX.onR);
    E.edge(3, "M 556 54 L 617 54", { c: "coin", label: "lockOrBurn()", lp: [668, 104], carry: { kind: "coin", to: P.poolS, until: S[3] + 1.25 } });
    E.edge(4, "M 500 92 L 500 116", { label: "CCIPMessageSent", lp: [426, 104], carry: { kind: "env" } });
    E.badge(5, 541, 158.5);
    E.edge(6, "M 500 146 L 500 182 C 500 212 560 206 560 222", { carry: { kind: "env", to: P.ver } });
    E.edge(7, "M 446 334 L 408 334", { label: "VerifierResult", lp: [360, 284], carry: { kind: "tag", text: "証明", to: P.idx } });
    E.edge(8, "M 312 334 L 244 334", { carry: { kind: "env", to: P.exe } });
    E.edge(9, "M 196 372 L 196 438", { label: "execute()", lp: [254, 392], carry: { kind: "env", to: P.offR } });
    E.stepAt(10, BOX.offR);
    E.edge(11, "M 196 514 C 196 552 260 572 369 572", { c: "coin", label: "releaseOrMint()", lp: [420, 524] });
    E.edge(11, "M 471 572 C 560 572 630 560 630 514", { c: "coin", at: 1.0, carry: { kind: "coin", to: P.recv } });
    E.edge(12, "M 252 476 L 365 476", { dur: 0.6, carry: { kind: "env", to: P.rtD } });
    E.edge(12, "M 475 476 L 560 476", { at: 0.45, dur: 0.6, carry: { kind: "env", to: P.recv, until: ABSORB } });

    // 検証の段だけの動き。署名がノードから封筒へ集まる
    NODE.forEach(([x, y], k) => {
      const t = S[6] + 1.05 + k * 0.32, [tx, ty] = P.ver, mx = (x + tx) / 2, my = Math.min(y, ty) - 18;
      L.top.push(`<g class="a" style="${cs("amber")};${move([[0, x, y], [t, x, y, 1, OUT], [t + 0.22, mx, my, 1.1], [t + 0.42, tx, ty, 0.6], [TOTAL, x, y]], blink(t, t + 0.4, 0.08))}"><circle class="sig" r="4.5"/></g>`);
    });
    // 預けたトークンが焼かれる
    {
      const t1 = S[3] + 1.25, [px, py] = ICON.poolS;
      L.top.push(`<circle class="flash popc a" cx="${px}" cy="${py}" r="15" style="${kf([[0, { opacity: 0, transform: "scale(.3)" }], [t1, { opacity: 0, transform: "scale(.3)" }], [t1 + 0.02, { opacity: 0.9, transform: "scale(.3)" }, OUT], [t1 + 0.65, { opacity: 0, transform: "scale(1.6)" }], [TOTAL, { opacity: 0, transform: "scale(.3)" }]])}"/>`);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, dx = Math.cos(a) * 24, dy = Math.sin(a) * 24;
        L.top.push(`<g class="a" style="${move([[0, px, py], [t1 + 0.02, px, py, 1, OUT], [t1 + 0.65, px + dx, py + dy, 0.4], [TOTAL, px, py]], blink(t1 + 0.02, t1 + 0.5, 0.15))}"><circle class="spark" r="2.4"/></g>`);
      }
    }
    // 新しく発行されるトークンが光って出る
    {
      const a = S[11] + 0.55, [px, py] = ICON.poolD;
      for (let k = 0; k < 4; k++) {
        const ang = (k / 4) * Math.PI * 2 + Math.PI / 4, dx = Math.cos(ang) * 16, dy = Math.sin(ang) * 16;
        L.top.push(`<g class="a" style="${move([[0, px + dx, py + dy, 0.2], [a, px + dx, py + dy, 0.2, POP], [a + 0.3, px + dx * 1.3, py + dy * 1.3, 1], [a + 0.6, px + dx * 1.6, py + dy * 1.6, 0.2], [TOTAL, px + dx, py + dy, 0.2]], blink(a, a + 0.5, 0.1))}"><path class="spark" d="M 0 -4.5 L 1.2 -1.2 L 4.5 0 L 1.2 1.2 L 0 4.5 L -1.2 1.2 L -4.5 0 L -1.2 -1.2 Z"/></g>`);
      }
    }

    // メッセージの中身の帯。封筒がどこにあっても、ここで中身の変わり方を見せる
    {
      const y0 = 636, ly = 658, vy = 679;
      const p = [E.stripBg({ y: y0, w: 728, h: 72, title: "メッセージ", g: "env", c: "blue" })];
      for (const sx of [112, 194, 272, 356, 424, 516, 630]) p.push(`<line class="sep" x1="${sx}" y1="${y0 + 14}" x2="${sx}" y2="${y0 + 58}"/>`);
      const field = (x, label, body, t) => `<g class="a" style="${rise(t)}"><text class="fl" x="${x}" y="${ly}">${label}</text>${body}</g>`;
      const idT = S[2] + 1.95;
      p.push(field(122, "ID", `<g class="a" style="${vis(S[0] + 0.6, idT, { f: 0.2 })}"><text class="fv-mute" x="122" y="${vy}">まだ無い</text></g><g class="popc a" style="${cs("blue")};${pop(idT)}"><text class="fv-id" x="122" y="${vy}">0x9f3c…a1</text></g>`, S[0] + 0.6));
      p.push(field(204, "宛先", `<text class="fv" x="204" y="${vy}">Arbitrum</text>`, S[0] + 0.75));
      p.push(field(282, "受け取る側", `<text class="fv" x="282" y="${vy}">0x7a1c…3f</text>`, S[0] + 0.9));
      p.push(field(366, "データ", `<text class="fv" x="366" y="${vy}">注文 #42</text>`, S[0] + 1.05));
      const burn = S[3] + 0.25, back = S[11] + 2.45;
      p.push(field(434, "トークン", `<g class="a" style="${until(burn - 0.15, 0.15)}"><circle class="coin" cx="440" cy="${vy - 4}" r="5"/></g><g class="a" style="${vis(burn, back - 0.1, { f: 0.15 })}"><circle class="coin-ghost" cx="440" cy="${vy - 4}" r="5"/></g><g class="popc a" style="${pop(back)}"><circle class="coin" cx="440" cy="${vy - 4}" r="5"/></g><text class="fv" x="450" y="${vy}">100 USDC</text>`, S[0] + 1.2));
      // 署名の欄は最初から空で見せ、検証で埋まり、確かめた後に緑へ変わる
      const sig = [`<text class="fl" x="526" y="${ly}">署名</text>`];
      for (let k = 0; k < 7; k++) {
        const x = 532 + k * 14, arrive = S[6] + 1.05 + k * 0.32 + 0.42, ok = S[10] + 0.5 + k * 0.17;
        sig.push(`<circle class="slot" cx="${x}" cy="${vy - 4}" r="5"/><g class="popc a" style="${cs("amber")};${pop(arrive)}"><circle class="ok" cx="${x}" cy="${vy - 4}" r="5.2"/></g><g class="popc a" style="${cs("green")};${pop(ok)}"><circle class="ok" cx="${x}" cy="${vy - 4}" r="5.6"/>${glyph("check", x, vy - 4, "ck", 0.45)}</g>`);
      }
      sig.push(E.tag(552, ly, 30, "証明", "amber", S[6] + 3.6), E.tag(586, ly, 38, "検証済", "green", S[10] + 1.9));
      p.push(`<g class="a" style="${rise(S[0] + 1.35)}">${sig.join("")}</g>`);
      // 状態は送信先で実行を頼まれた時から付く
      const st = [`<text class="fl" x="640" y="${ly}">状態</text>`];
      st.push(`<g class="a" style="${until(S[9] + 1.2)}"><text class="fv-mute" x="640" y="${vy}">—</text></g>`);
      st.push(E.tag(640, vy - 0.5, 68, "UNTOUCHED", "green", S[9] + 1.4, ABSORB - 0.2, { outline: true, mono: true }));
      st.push(E.tag(640, vy - 0.5, 58, "SUCCESS", "green", ABSORB, LAST, { mono: true }));
      p.push(`<g class="a" style="${rise(S[0] + 1.5)}">${st.join("")}</g>`);
      L.node.push(p.join(""));
    }
  },
});
