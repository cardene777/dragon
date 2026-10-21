// Ethereum のブロックが確定するまで。
// 上に最初の 4 slot の拡大、下に 3 epoch 分 (96 slot) の時間軸を置き、全体を止めたまま時刻を進める。
// 時間軸は 32 slot を縮めずに並べ、細い棒 1 本を 1 slot (12 秒) とする。
DRAGON.add({
  id: "finality",
  form: "time",
  mode: "fixed",
  title: "Ethereum のブロックが確定して戻せなくなるまで",
  short: "ブロックが確定する",
  label: "Ethereum でブロックが出てから確定するまでを、最初の 4 slot の拡大と 3 epoch 分の時間軸で、全体を止めたまま 10 段で動かす図",
  w: 728,
  h: 552,
  icons: { flag: "M -4 8 V -8 M -4 -7 H 6 L 3.5 -3.5 L 6 0 H -4" },
  intro: { t: "全体の地図", body: "上は最初の 4 slot の拡大、下は 3 epoch 分の時間軸で、細い棒 1 本が 1 slot (12 秒)。下の帯に、票の重さと checkpoint の状態が出る。" },
  outro: { t: "通しで見る", body: "ブロックは 12 秒ごとに出るが、戻せなくなるのは約 2 epoch (12.8 分) 後。正当化と確定は、epoch の終わりの集計でまとめて進む。" },
  steps: [
    { c: "blue", tag: "slot", d: 3.0, t: "ブロックを出す", body: "時間は 12 秒ごとの slot に区切られる。slot ごとに validator から 1 人が提案者に選ばれ、ブロックを 1 つ出す。" },
    { c: "amber", tag: "投票", d: 3.0, t: "委員会が投票する", code: "attestation = { head, source, target }", body: "各 validator は 1 epoch に 1 回、割り当てられた slot で投票 (attestation) する。票は先頭のブロックと checkpoint を指す。" },
    { c: "slate", tag: "slot", d: 3.9, t: "空く slot もある", body: "提案者が応答しないと、その slot はブロックの無いまま過ぎる。チェーンは止まらず、その slot の票は 1 つ前のブロックを指す。" },
    { c: "blue", tag: "checkpoint", d: 2.8, t: "checkpoint を決める", body: "32 slot (6.4 分) で 1 epoch。epoch の最初の slot のブロックが、その epoch の checkpoint になる。ここでは C100 と呼ぶ。" },
    { c: "amber", tag: "投票", d: 4.2, t: "票が積み上がる", body: "epoch の間に全 validator が 1 回ずつ投票するので、C100 への票は slot ごとに積み上がる。票の重さは持っている stake で量る。" },
    { c: "violet", tag: "正当化", d: 2.8, t: "正当化する", body: "epoch の終わりの集計で、C100 への票が全体の stake の 2/3 を超えていれば、C100 は正当化 (justified) される。" },
    { c: "amber", tag: "投票", d: 3.8, t: "次の epoch も同じ", code: "source C100 → target C101", body: "次の epoch では C101 へ票が集まる。票は直前に正当化された C100 を起点 (source)、C101 を目標 (target) として数える。" },
    { c: "green", tag: "確定", d: 3.6, t: "前の checkpoint が確定する", body: "C101 も正当化されると、続けて正当化された 2 つのうち前の C100 が確定 (finalized) する。C100 の提案から約 2 epoch、12.8 分。" },
    { c: "green", tag: "確定", d: 4.6, t: "確定が 1 epoch ずつ進む", body: "以後は epoch ごとに同じことが起き、C102 の正当化で C101 までのブロックが確定する。確定した範囲は 1 epoch ずつ伸びる。" },
    { c: "rose", tag: "安全性", d: 3.4, t: "確定したら戻せない", body: "確定したブロックを戻すには、全体の stake の 1/3 以上を持つ validator が矛盾した票を出し、罰 (slashing) を受けなければならない。" },
  ],
  css: `
.fn-ch{font:650 11px var(--mono);fill:var(--ink)}
.fn-cm{font:500 11px var(--sans);fill:var(--mute)}
.fn-colsep{stroke:var(--hair);stroke-width:1;stroke-dasharray:2 4}
.fn-chip{fill:var(--surf);stroke:var(--hair)}
.fn-chip-on{fill:color-mix(in srgb,var(--c) 10%,var(--surf));stroke:var(--c);stroke-width:1.5}
.fn-cg{fill:none;stroke:var(--mute);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.fn-cg-on{fill:none;stroke:var(--c);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.fn-ct{font:600 11px var(--sans);fill:var(--ink2)}
.fn-ct-on{font:700 11px var(--sans);fill:var(--ct)}
.fn-ph{fill:none;stroke:var(--line);stroke-dasharray:3 3}
.fn-ph-x{fill:color-mix(in srgb,var(--c-slate) 8%,var(--surf));stroke:var(--c-slate);stroke-width:1.25;stroke-dasharray:3 3}
.fn-ph-xt{font:700 11px var(--sans);fill:var(--t-slate)}
.fn-sv{font:700 11px var(--sans);fill:var(--t-violet)}
.fn-sg{font:700 11px var(--sans);fill:var(--t-green)}
.fn-st-p{font:650 12px var(--sans);fill:var(--t-blue)}
.fn-st-j{font:700 12px var(--sans);fill:var(--t-violet)}
.fn-st-f{font:700 12px var(--sans);fill:var(--t-green)}
.fn-ep{fill:color-mix(in srgb,var(--ink) 3.5%,transparent)}
.fn-slot{fill:none;stroke:var(--line);stroke-width:.6;opacity:.55}
.fn-b{fill:var(--c-blue)}
.fn-bf{fill:var(--c-green)}
.fn-emp{fill:var(--c-slate)}
.fn-v{fill:var(--c-amber);opacity:.8;transform-box:fill-box;transform-origin:50% 0}
.fn-lens{fill:none;stroke:var(--c-blue);stroke-width:1.25;stroke-dasharray:3 2}
.fn-guide{fill:none;stroke:color-mix(in srgb,var(--c-blue) 50%,transparent);stroke-width:1;stroke-dasharray:2 3}
.fn-cur{stroke:var(--ink);stroke-width:1.25;opacity:.55}
.fn-curh{fill:var(--ink)}
.fn-axis{stroke:var(--line);stroke-width:1;fill:none}
.fn-tl{font:600 10.5px var(--mono);fill:var(--mute)}
.fn-el{font:650 11.5px var(--sans);fill:var(--ink2)}
.fn-sl{font:500 10.5px var(--mono);fill:var(--mute)}
.fn-con{fill:none;stroke:var(--line);stroke-width:1.4;stroke-linecap:round;stroke-dasharray:0 3.5}
.fn-cp{fill:var(--surf);stroke:var(--line);stroke-dasharray:2 2.5}
.fn-cpg{fill:none;stroke:var(--mute);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.fn-cpg-on{fill:none;stroke:var(--on-c);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.fn-cpo{fill:var(--surf);stroke:var(--c);stroke-width:1.75}
.fn-cpn{font:700 11px var(--mono);fill:var(--ink)}
.fn-cpn-g{font:700 11px var(--mono);fill:var(--mute)}
.fn-brk{fill:none;stroke:var(--c);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.fn-guard{fill:color-mix(in srgb,var(--c-rose) 6%,transparent);stroke:var(--c-rose);stroke-width:1.5;stroke-dasharray:4 3}
.fn-mt{fill:var(--hair)}
.fn-mf{fill:var(--c);transform-box:fill-box;transform-origin:0 50%}
.fn-mk{stroke:var(--ink2);stroke-width:1.25}
.fn-mkl{font:700 10.5px var(--mono);fill:var(--ink2)}
.fn-mkl-r{font:700 10.5px var(--mono);fill:var(--t-rose)}
.fn-tg text{font-family:var(--sans)}
`,
  draw(E) {
    const { S, L, LAST, TOTAL, OUT, EASE, kf, vis, until, pop, move, cs, r1, esc, glyph, stepEnd } = E;

    // 時間軸は x 118 から 712 に 96 slot を並べる。棒は細く短くして、並んでも重く見えないようにする
    const P = 594 / 96, X = (s) => 118 + s * P, BC = (s) => r1(X(s) + P / 2), BW = 3, BX = (s) => r1(X(s) + (P - BW) / 2);
    const BY = 272, BH = 20, VY = 297;
    // 提案者が応答しなかった slot
    const EMPTY = new Set([3, 13, 45, 79]);

    // slot ごとのブロックの時刻 bt と票の時刻 vt。最初の 4 slot は上の拡大で線が届く時刻に合わせる
    const bt = [], vt = [];
    bt[0] = S[0] + 1.15; vt[0] = S[1] + 1.75;
    bt[1] = S[2] + 1.0; vt[1] = S[2] + 1.75;
    bt[2] = S[2] + 2.0; vt[2] = S[2] + 2.75;
    bt[3] = S[2] + 2.4; vt[3] = S[2] + 3.7;
    const sweep = (a, b, t0, t1) => {
      const dt = (t1 - t0) / (b - a + 1);
      for (let s = a; s <= b; s++) { bt[s] = t0 + (s - a + 0.25) * dt; vt[s] = t0 + (s - a + 0.75) * dt; }
      return (s) => t0 + (s - a) * dt;
    };
    const at0 = sweep(4, 31, S[4] + 0.3, S[4] + 3.7);
    const at1 = sweep(32, 63, S[6] + 0.3, S[6] + 3.5);
    const at2 = sweep(64, 95, S[8] + 0.3, S[8] + 3.3);
    // 確定する時刻。C100 の確定でブロック 0 が、C101 の確定で 32 までが確定する
    const ft = (s) => (s === 0 ? S[7] + 1.0 : S[8] + 3.95 + (s - 1) * 0.012);
    const tagJ = (...a) => `<g class="fn-tg">${E.tag(...a)}</g>`;

    E.band({ y: 0, w: 728, h: 236, c: "blue", label: ["最初の", "4 slot"], ex: "拡大", g: "box" });
    E.band({ y: 248, w: 728, h: 222, c: "slate", label: ["時間軸"], ex: "1 本 = 1 slot", g: "clock" });

    // 上の拡大。slot ごとに 提案者 → ブロック ← 委員会の票 の縦の並び
    const CX = [192, 341, 490, 639];
    let block0 = null;
    {
      const HASH = ["0x4a…1c", "0x9e…07", "0x13…d2"];
      const p = [`<text class="bx" x="14" y="204">委員会の投票</text><text class="bx" x="14" y="219">全体の 1/32</text>`];
      for (let k = 1; k < 4; k++) p.push(`<line class="fn-colsep" x1="${117.5 + 149 * k}" y1="12" x2="${117.5 + 149 * k}" y2="224"/>`);
      const chip = (cx, cls, gcls, tcls, text, g, dx) => `<rect class="${cls}" x="${cx - 38}" y="30" width="76" height="22" rx="11"/>${glyph(g, cx - dx, 41, gcls, g === "x" ? 0.7 : 0.5)}<text class="${tcls}" x="${cx - dx + 10}" y="45">${esc(text)}</text>`;
      const CHIP_ON = [[S[0], S[1]], [S[2] + 0.05, S[2] + 1.05], [S[2] + 1.05, S[2] + 2.05]];
      const POP = [S[0] + 1.1, S[2] + 0.95, S[2] + 1.95];
      const DOTS = [S[1] + 0.15, S[2] + 0.7, S[2] + 1.7, S[2] + 2.6];
      CX.forEach((cx, k) => {
        p.push(`<text class="fn-ch" x="${cx}" y="21" text-anchor="middle">slot ${3200 + k}<tspan class="fn-cm"> ・ ${k * 12} 秒</tspan></text>`);
        p.push(chip(cx, "fn-chip", "fn-cg", "fn-ct", "提案者", "user", 19));
        if (k < 3) p.push(`<g class="a" style="${cs("blue")};${E.rangeKf([CHIP_ON[k]])}">${chip(cx, "fn-chip-on", "fn-cg-on", "fn-ct-on", "提案者", "user", 19)}</g>`);
        else p.push(`<g class="a" style="${cs("slate")};${vis(S[2] + 2.2)}">${chip(cx, "fn-chip-on", "fn-cg-on", "fn-ct-on", "応答なし", "x", 24)}</g>`);
        // ブロックが出るまでの枠。箱が出たら枠は消す
        if (k < 3) p.push(`<g class="a" style="${until(POP[k] + 0.3)}"><rect class="fn-ph" x="${cx - 46}" y="92" width="92" height="72" rx="12"/></g><g class="a" style="${until(POP[k] - 0.1)}"><text class="fv-mute" x="${cx}" y="132" text-anchor="middle">まだ無い</text></g>`);
        else p.push(`<rect class="fn-ph" x="${cx - 46}" y="92" width="92" height="72" rx="12"/><g class="a" style="${until(S[2] + 2.35)}"><text class="fv-mute" x="${cx}" y="132" text-anchor="middle">まだ無い</text></g><g class="a" style="${vis(S[2] + 2.4)}"><rect class="fn-ph-x" x="${cx - 46}" y="92" width="92" height="72" rx="12"/><text class="fn-ph-xt" x="${cx}" y="126" text-anchor="middle">空き</text><text class="ss" x="${cx}" y="142" text-anchor="middle">ブロック無し</text></g>`);
        // 委員会の票。空いた slot でも票は出る
        for (let j = 0; j < 7; j++) {
          const x = cx + (j - 3) * 13;
          p.push(`<circle class="slot" cx="${x}" cy="206" r="4.5"/><g class="popc a" style="${cs("amber")};${pop(DOTS[k] + j * 0.05)}"><circle class="ok" cx="${x}" cy="206" r="4.8"/></g>`);
        }
      });
      L.mid.push(p.join(""));

      // ブロックの箱は、提案者から届いた時に現れる
      const SWAPS = [[[S[5] + 0.6, "正当化", "fn-sv"], [S[7] + 1.0, "確定", "fn-sg"]], [[S[8] + 4.0, "確定", "fn-sg"]], [[S[8] + 4.05, "確定", "fn-sg"]]];
      const ON = [[0, 3], [2], [2]];
      for (let k = 0; k < 3; k++) {
        const box = E.card({ cx: CX[k], cy: 128, name: "ブロック", sub: HASH[k], g: "box", c: "blue", on: ON[k], swap: SWAPS[k] });
        if (k === 0) block0 = box;
        L.node.push(`<g class="popc a" style="${pop(POP[k])}">${L.node.pop()}</g>`);
      }
      // ブロック 3200 は C100 の checkpoint になる
      L.node.push(`<g class="fn-tgm">${E.tag(206, 96, 46, "C100", "blue", S[3] + 0.4, LAST, { outline: true, mono: true })}</g>`);

      // 提案者からブロックへ、委員会の票からブロックへ。運ぶ物はブロックが封筒、票が札
      E.edge(0, "M 192 54 L 192 90", { at: 0.15, carry: { kind: "env", absorb: true } });
      E.edge(1, "M 192 199 L 192 166", { at: 0.75, carry: { kind: "tag", text: "票", absorb: true } });
      // 空いた slot の票は 1 つ前のブロックを指す。この段の番号はこの線の始まりに付ける
      L.base.push(`<path class="e" d="M 639 54 L 639 90"/><path class="eh" d="M 635.5 84 L 639 90 L 642.5 84"/>`);
      E.edge(2, "M 639 199 C 639 178 566 176 538 158", { k: 0, at: 2.75, c: "amber", ghost: false, dur: 0.85, carry: { kind: "tag", text: "票", absorb: true } });
      E.edge(2, "M 341 54 L 341 90", { k: 0, at: 0.05, dur: 0.85, c: "blue", carry: { kind: "env", absorb: true } });
      E.edge(2, "M 341 199 L 341 166", { k: 0, at: 0.8, dur: 0.85, c: "amber", carry: { kind: "tag", text: "票", absorb: true } });
      E.edge(2, "M 490 54 L 490 90", { k: 0, at: 1.05, dur: 0.85, c: "blue", carry: { kind: "env", absorb: true } });
      E.edge(2, "M 490 199 L 490 166", { k: 0, at: 1.8, dur: 0.85, c: "amber", carry: { kind: "tag", text: "票", absorb: true } });
      // 線の無い段。checkpoint はブロック 3200 の箱の角に番号を置く
      E.stepAt(3, block0);
    }

    // 時間軸。ブロックの列、票の棒、checkpoint、時刻の目盛りを上から並べる
    const zoomEnd = S[9] + 0.2;
    {
      const p = [`<rect class="fn-ep" x="${r1(X(32))}" y="264" width="${r1(32 * P)}" height="48" rx="4"/>`];
      for (let s = 0; s < 96; s++) {
        const x = BX(s);
        p.push(`<rect class="fn-slot" x="${x}" y="${BY}" width="${BW}" height="${BH}" rx="1.5"/>`);
        if (EMPTY.has(s)) p.push(`<g class="a" style="${vis(bt[s], LAST, { f: 0.2 })}"><circle class="fn-emp" cx="${BC(s)}" cy="${BY + BH / 2}" r="1.7"/></g>`);
        else {
          p.push(`<g class="a" style="${vis(bt[s], LAST, { f: 0.2 })}"><rect class="fn-b" x="${x}" y="${BY}" width="${BW}" height="${BH}" rx="1.5"/></g>`);
          if (s <= 32) p.push(`<g class="a" style="${vis(ft(s), LAST, { f: 0.35 })}"><rect class="fn-bf" x="${x}" y="${BY}" width="${BW}" height="${BH}" rx="1.5"/></g>`);
        }
        const h = 6 + ((s * 7) % 5) * 0.5;
        p.push(`<rect class="fn-v a" x="${x}" y="${VY}" width="${BW}" height="${h}" rx="1" style="${kf([[0, { transform: "scaleY(0)" }], [vt[s], { transform: "scaleY(0)" }, OUT], [vt[s] + 0.25, { transform: "scaleY(1)" }], [LAST, { transform: "scaleY(1)" }, EASE], [TOTAL, { transform: "scaleY(0)" }]])}"/>`);
      }
      // 上の拡大へつなぐ枠。戻せない範囲を囲む段では消して、札と重ならないようにする
      p.push(`<g class="a" style="${until(zoomEnd)}"><rect class="fn-lens" x="115.5" y="267.5" width="${r1(X(4) + 1.5 - 115.5)}" height="42" rx="4"/><path class="fn-guide" d="M 115.5 267.5 L 118 238 M ${r1(X(4) + 1.5)} 267.5 L 714 238"/></g>`);
      // 目盛り
      p.push(`<path class="fn-axis" d="M 118 426 H 712 ${[0, 32, 64, 96].map((s) => `M ${r1(X(s))} 420 V 432`).join(" ")} ${[8, 16, 24, 40, 48, 56, 72, 80, 88].map((s) => `M ${r1(X(s))} 423 V 429`).join(" ")}"/>`);
      [[0, "0 分", "start"], [32, "6.4 分", "middle"], [64, "12.8 分", "middle"], [96, "19.2 分", "end"]].forEach(([s, t, a]) => p.push(`<text class="fn-tl" x="${r1(X(s))}" y="444" text-anchor="${a}">${t}</text>`));
      [0, 1, 2].forEach((e) => p.push(`<text class="fn-el" x="${r1(X(16 + 32 * e))}" y="444" text-anchor="middle">epoch ${100 + e}</text><text class="fn-sl" x="${r1(X(16 + 32 * e))}" y="458" text-anchor="middle">slot ${3200 + 32 * e}〜${3231 + 32 * e}</text>`));
      L.mid.push(p.join(""));

      // 今の時刻。ブロックの列と目盛りの上を進む
      const cur = move([[0, X(0), 0], [bt[0], X(0), 0], [S[2] + 0.05, X(1), 0], [S[2] + 1.05, X(2), 0], [S[2] + 2.05, X(3), 0], [S[2] + 3.6, X(4), 0],
        [S[4] + 0.3, X(4), 0], [S[4] + 3.7, X(32), 0], [S[6] + 0.3, X(32), 0], [S[6] + 3.5, X(64), 0], [S[8] + 0.3, X(64), 0], [S[8] + 3.3, X(96), 0], [LAST, X(96), 0], [TOTAL, X(0), 0]]);
      L.mid.push(`<g class="a" style="${cur}"><line class="fn-cur" x1="0" y1="264" x2="0" y2="312"/><path class="fn-curh" d="M -4.5 257.5 L 4.5 257.5 L 0 264 Z"/><circle class="fn-curh" cx="0" cy="426" r="3.5"/></g>`);
    }

    // checkpoint。epoch の最初の slot のブロックから下へ点線をつなぎ、状態を丸の色と字で見せる
    const CP = [
      { s: 0, n: "C100", tp: S[3] + 0.5, tj: S[5] + 0.4, tf: S[7] + 0.9 },
      { s: 32, n: "C101", tp: S[6] + 0.45, tj: S[7] + 0.3, tf: S[8] + 3.9 },
      { s: 64, n: "C102", tp: S[8] + 0.45, tj: S[8] + 3.45, tf: null },
    ];
    for (const c of CP) {
      const cx = BC(c.s), cy = 346;
      L.base.push(`<path class="fn-con" d="M ${cx} 315 L ${cx} 335"/>`);
      const states = [[c.tp, "提案済み", "ss"], [c.tj, "正当化", "fn-sv"], ...(c.tf ? [[c.tf, "確定", "fn-sg"]] : [])];
      const st = states.map(([t, text, cls], k) => {
        const nxt = k + 1 < states.length ? states[k + 1][0] : null;
        return `<g class="a" style="${nxt === null ? E.rise(t) : E.rise(t, nxt - 0.2)}"><text class="${cls}" x="${cx + 15}" y="${cy + 12}">${esc(text)}</text></g>`;
      }).join("");
      L.node.push(`<circle class="fn-cp" cx="${cx}" cy="${cy}" r="9"/>${glyph("flag", cx, cy, "fn-cpg", 0.62)}` +
        `<g class="a" style="${until(c.tp)}"><text class="fn-cpn-g" x="${cx + 15}" y="${cy - 2}">${c.n}</text></g><g class="a" style="${vis(c.tp)}"><text class="fn-cpn" x="${cx + 15}" y="${cy - 2}">${c.n}</text></g>` + st +
        `<g class="popc a" style="${cs("blue")};${pop(c.tp)}"><circle class="fn-cpo" cx="${cx}" cy="${cy}" r="9.5"/>${glyph("flag", cx, cy, "gl", 0.62)}</g>` +
        `<g class="popc a" style="${cs("violet")};${pop(c.tj)}"><circle class="ok" cx="${cx}" cy="${cy}" r="9.5"/>${glyph("flag", cx, cy, "fn-cpg-on", 0.62)}</g>` +
        (c.tf ? `<g class="popc a" style="${cs("green")};${pop(c.tf)}"><circle class="ok" cx="${cx}" cy="${cy}" r="9.5"/>${glyph("check", cx, cy, "ck", 0.75)}</g>` : ""));
    }
    // 続けて正当化された 2 つのつながり。票の 2/3 が前の checkpoint から次の checkpoint への道を作る
    const link = (i, a, b, at) => E.edge(i, `M ${r1(BC(a) + 70)} 346 L ${r1(BC(b) - 14)} 346`, { at, c: "violet", ghost: false, label: "2/3 を超えた", lside: "below" });
    link(7, 0, 32, 0.2);
    link(8, 32, 64, 3.35);

    // 線も箱も持たない段は、時間軸の上の出来事のすぐ脇に番号を置く
    E.badge(4, r1(X(16)), 324);
    E.badge(5, 97, 346);
    E.badge(6, r1(X(48)), 324);

    // 目盛りの上の括弧。epoch の長さ、確定までの長さ
    const bracket = (x1, c, a, b) => `<g class="a" style="${cs(c)};${vis(a, b)}"><path class="fn-brk" d="M 121 388 L 121 394 L ${x1} 394 L ${x1} 388"/></g>`;
    L.mid.push(bracket(315, "slate", S[3] + 0.7, stepEnd(3) - 0.2), bracket(517, "green", S[7] + 1.2));
    E.caption(218, 394, "32 slot = 6.4 分", S[3] + 0.8, stepEnd(3) - 0.2, "slate", false);
    E.caption(319, 394, "C100 の提案から確定まで 約 12.8 分", S[7] + 1.3, LAST, "green", false);
    // 確定した範囲を囲み、戻せないことを縁の札で示す
    L.mid.push(`<g class="a" style="${vis(S[9] + 0.3)}"><rect class="fn-guard" x="112.5" y="262" width="${r1(X(33) + 3.5 - 112.5)}" height="52" rx="6"/></g>`);
    L.top.push(tagJ(128, 263, 100, "確定して戻せない", "rose", S[9] + 0.5));
    // 札の右は時刻の針が通るので、囲みの左の脇に置く
    E.badge(9, 100, 288);

    // 下の帯。経過時間、今の epoch の票の重さ、checkpoint ごとの状態
    {
      const y0 = 480, ly = 502, MX = 228, MW = 168;
      const p = [E.stripBg({ y: y0, w: 728, h: 72, title: "確定の進み", g: "lock", c: "green" })];
      for (const sx of [118, 214, 420]) p.push(`<line class="sep" x1="${sx}" y1="${y0 + 14}" x2="${sx}" y2="${y0 + 58}"/>`);

      p.push(E.field(128, ly, "経過", [[0, "0 秒"], [S[2] + 0.05, "12 秒"], [S[2] + 1.05, "24 秒"], [S[2] + 2.05, "36 秒"],
        [at0(16), "3 分 12 秒"], [S[4] + 3.7, "6 分 24 秒"], [at1(48), "9 分 36 秒"], [S[6] + 3.5, "12 分 48 秒"], [at2(80), "16 分"], [S[8] + 3.3, "19 分 12 秒"]], 0));

      // 票の重さは slot ごとに 1/32 ずつ足され、epoch が替わると 0 から数え直す (参加は 97% とする)
      const m = (k) => `scaleX(${r1(((k + 1) / 32) * 0.97 * 1000) / 1000})`;
      const pts = [[0, { transform: "scaleX(0)" }]];
      for (let s = 0; s < 96; s++) {
        const e = Math.floor(s / 32), k = s - 32 * e;
        if (k === 0 && e > 0) { const r = [S[6], S[8]][e - 1]; pts.push([r + 0.05, { transform: m(31) }, EASE], [r + 0.25, { transform: "scaleX(0)" }]); }
        if (s <= 4 || k === 0) pts.push([vt[s] - 0.2, { transform: s === 0 || k === 0 ? "scaleX(0)" : m(k - 1) }, OUT]);
        pts.push([vt[s], { transform: m(k) }]);
      }
      pts.push([LAST, { transform: m(31) }, EASE], [TOTAL, { transform: "scaleX(0)" }]);
      // 正当化した間だけ物差しを紫にする。黄と紫が透けて混ざらないよう、薄れずに一度で切り替える
      const snap = (ranges) => {
        const q = [[0, { opacity: 0 }]];
        for (const [a, b] of ranges) q.push([a - 0.01, { opacity: 0 }], [a, { opacity: 1 }], [b, { opacity: 1 }], [b + 0.01, { opacity: 0 }]);
        q.push([TOTAL, { opacity: 0 }]);
        return kf(q);
      };
      const T = MX + (MW * 2) / 3;
      p.push(`<rect class="fn-mt" x="${MX}" y="516" width="${MW}" height="6" rx="3"/>`);
      p.push(`<g class="a" style="${until(S[9] + 0.2)}"><text class="fl" x="${MX}" y="${ly}">今の epoch の票</text>` +
        `<rect class="fn-mf a" x="${MX}" y="516" width="${MW}" height="6" rx="3" style="${cs("amber")};${kf(pts)}"/>` +
        `<g class="a" style="${snap([[CP[0].tj, S[6] + 0.05], [CP[1].tj, S[8] + 0.05], [CP[2].tj, S[9] + 0.2]])}"><rect class="fn-mf" x="${MX}" y="516" width="${MW}" height="6" rx="3" style="${cs("violet")};transform:scaleX(.97)"/></g>` +
        `<line class="fn-mk" x1="${r1(T)}" y1="511" x2="${r1(T)}" y2="527"/><text class="fn-mkl" x="${r1(T)}" y="539" text-anchor="middle">2/3</text></g>`);
      const R3 = MX + MW / 3;
      p.push(`<g class="a" style="${vis(S[9] + 0.3)}"><text class="fl" x="${MX}" y="${ly}">戻すのに罰を受ける stake</text>` +
        `<rect class="fn-mf" x="${MX}" y="516" width="${MW}" height="6" rx="3" style="${cs("rose")};transform:scaleX(.3333)"/>` +
        `<line class="fn-mk" x1="${r1(R3)}" y1="511" x2="${r1(R3)}" y2="527"/><text class="fn-mkl-r" x="${r1(R3)}" y="539" text-anchor="middle">1/3 以上</text></g>`);

      CP.forEach((c, k) => {
        p.push(E.field(432 + k * 94, ly, c.n, [[0, "—", "fv-mute"], [c.tp, "提案済み", "fn-st-p"], [c.tj, "正当化", "fn-st-j"], ...(c.tf ? [[c.tf, "確定", "fn-st-f"]] : [])], 0));
      });
      L.node.push(p.join(""));
    }
  },
});
