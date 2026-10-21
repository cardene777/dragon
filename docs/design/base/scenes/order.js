// ネット通販の注文 #1042 が受け付けられ、届いた後に返品されて返金で閉じるまでの状態。
// 状態を 2 段に並べ、どちらの段も左から右へ読む。上の段の終わりから下の段の始まりへは、段の間を通る線で戻る。
// 上の脇道に今回は通らない取り消しを置く。注文の札は線の上を走り、着いた状態の印に乗る。
DRAGON.add({
  id: "order",
  form: "state",
  mode: "fixed",
  title: "ネット通販の注文が届いて返金されるまでの状態",
  short: "注文の状態が移る",
  label: "ネット通販の注文 #1042 が注文受付から配達完了を経て、返品と返金で閉じるまでを、状態と移るきっかけで 10 段に分けて動かす図",
  w: 728,
  h: 578,
  icons: {
    undo: "M -7 -2 h10 a5 5 0 0 1 0 10 h-6 M -3 -6 l-4 4 l4 4",
    yen: "M -6 -8 l6 7 l6 -7 M 0 -1 v9 M -5 1.5 h10 M -5 5 h10",
  },
  intro: { t: "全体の地図", body: "角の丸い四角が注文の状態、矢印が状態を移すきっかけ。黒い札が注文 #1042 で、今いる状態に乗る。通った状態には右上に印が付き、上の点線は今回は通らない取り消しの道。" },
  outro: { t: "通しで見る", body: "注文は 8 つの状態を通って返金で閉じた。どの状態から次へ移れるかは決まっていて、発送した後は取り消しの道が無く、返品の道だけが残る。" },
  steps: [
    { c: "blue", tag: "注文受付", d: 2.6, t: "注文を受け付ける", body: "カートの中身で注文を確定すると、注文受付から始まる。注文番号 #1042 が付き、ここから先の動きは全て記録に残る。" },
    { c: "amber", tag: "支払い待ち", d: 2.4, t: "支払いを待つ", body: "決済へ進むと支払い待ちに移る。期限までに払われなければ、この状態から取り消しへ移る。" },
    { c: "amber", tag: "支払い済み", d: 2.6, t: "支払いが確定する", body: "決済会社から入金の知らせが届き、支払い済みに移る。金額の 4,980 円が記録に入る。" },
    { c: "blue", tag: "発送準備", d: 2.6, t: "在庫を確保する", body: "倉庫が在庫を引き当て、発送準備に移る。ここまでは取り消せて、取り消すと払った分を返す。" },
    { c: "violet", tag: "発送済み", d: 3.0, t: "発送する", body: "配送業者に渡して伝票番号を発行し、発送済みに移る。発送した後は取り消しの道が閉じる。" },
    { c: "green", tag: "配達完了", d: 2.6, t: "届く", body: "配送業者が受け取りを記録すると、配達完了に移る。普通の注文はここで終わる。" },
    { c: "rose", tag: "返品の受付", d: 2.6, t: "返品を申し込む", body: "購入者が返品を申し込み、返品の受付に移る。届いてから決まった日数の間だけ選べる道。" },
    { c: "rose", tag: "返品の受付", d: 2.8, t: "戻った品を確かめる", body: "戻った商品を検品する。状態は返品の受付のまま変わらないので、同じ状態へ戻る矢印で表す。" },
    { c: "rose", tag: "返金済み", d: 2.8, t: "返金する", body: "検品を通ったので返金を実行し、返金済みに移る。支払いの欄が返金した、に変わる。" },
    { c: "green", tag: "終わり", d: 2.6, t: "注文を閉じる", body: "返金済みは終わりの状態で、ここから先へは移らない。注文は閉じ、通った道は記録として残る。" },
  ],
  css: `
.od-side{fill:color-mix(in srgb,var(--c-rose) 4%,var(--bg));stroke:color-mix(in srgb,var(--c-rose) 36%,transparent);stroke-dasharray:4 4}
.od-sz{font:700 12.5px var(--sans);fill:var(--t-rose)}
.od-sx{font:500 11px var(--sans);fill:var(--mute)}
.od-ghost{fill:var(--surf);stroke:color-mix(in srgb,var(--c-rose) 60%,transparent);stroke-dasharray:4 3}
.od-gi{fill:color-mix(in srgb,var(--c-rose) 10%,var(--surf))}
.od-gn{font:650 13px var(--sans);fill:var(--ink2)}
.od-xe{fill:none;stroke:color-mix(in srgb,var(--c-rose) 55%,transparent);stroke-width:1.6;stroke-linecap:round;stroke-dasharray:0 5}
.od-xh{fill:none;stroke:color-mix(in srgb,var(--c-rose) 55%,transparent);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.od-xl{font:600 11px var(--sans);fill:var(--t-rose)}
.od-start{fill:var(--ink)}
.od-end{fill:var(--bg);stroke:var(--ink);stroke-width:1.6}
.od-endi{fill:var(--ink)}
.od-endx{fill:var(--bg);stroke:color-mix(in srgb,var(--c-rose) 55%,transparent);stroke-width:1.5;stroke-dasharray:2 2.5}
.od-endxi{fill:color-mix(in srgb,var(--c-rose) 55%,transparent)}
.od-mk{font:500 11px var(--sans);fill:var(--mute)}
.od-pulse{fill:none;stroke:var(--ink);stroke-width:2}
.od-done{fill:var(--c);stroke:var(--surf);stroke-width:1.2}
.od-fv{font:600 12px var(--sans);fill:var(--ink)}
.od-fv-rose{font:700 12px var(--sans);fill:var(--t-rose)}
`,
  draw(E) {
    const { S, L, LAST, TOTAL, OUT, kf, pop, cs, r1, esc, glyph, tw } = E;
    // 4 列を 2 段。列の間は線の名前 (最長 84) と番号が並んで入る幅を取る
    const AY = 196, BY = 376, C = [66, 264, 462, 660], RY = 286;
    // 横の線の名前は、線の始まりの番号と重ならないよう線より 24 上に置く
    const above = (l, r, y) => [r1((l.r + r.l) / 2), y - 24];

    // 状態。今いる状態は光り、出た状態には右上に済んだ印が残る
    const ST = [
      { name: "注文受付", sub: "番号を付ける", g: "doc", c: "blue", cx: C[0], cy: AY, on: [0] },
      { name: "支払い待ち", sub: "入金を待つ", g: "clock", c: "amber", cx: C[1], cy: AY, on: [1] },
      { name: "支払い済み", sub: "決済が通った", g: "card", c: "amber", cx: C[2], cy: AY, on: [2] },
      { name: "発送準備", sub: "棚から出す", g: "box", c: "blue", cx: C[3], cy: AY, on: [3] },
      { name: "発送済み", sub: "業者が運ぶ", g: "truck", c: "violet", cx: C[0], cy: BY, on: [4] },
      { name: "配達完了", sub: "受け取られた", g: "check", c: "green", cx: C[1], cy: BY, on: [5] },
      { name: "返品の受付", sub: "検品を待つ", g: "undo", c: "rose", cx: C[2], cy: BY, on: [6, 7], swap: [[S[7] + 1.6, "検品を通った", "ss-ok"]] },
      { name: "返金済み", sub: "代金を戻す", g: "yen", c: "rose", cx: C[3], cy: BY, on: [8], swap: [[S[8] + 1.2, "全額を戻した", "ss-ok"]] },
    ];
    const ENTER = [S[0], S[1], S[2], S[3], S[4], S[5], S[6], S[8]], LEAVE = [S[1], S[2], S[3], S[4], S[5], S[6], S[8], S[9]];
    const B = ST.map((s, k) => {
      const b = E.card(s);
      L.node.push(`<g class="popc a" style="${cs(s.c)};${pop(LEAVE[k] + 0.3)}"><circle class="od-done" cx="${r1(b.r - 13)}" cy="${b.t + 13}" r="6.5"/>${glyph("check", b.r - 13, b.t + 13, "ck", 0.5)}</g>`);
      return b;
    });
    const P = B.map((b) => b.icon), START = [C[0], 40], FIN = [C[3], 474];
    const tag = (to) => ({ kind: "tag", text: "#1042", to });

    // 始まりと終わりの印
    L.node.push(`<circle class="od-start" cx="${START[0]}" cy="${START[1]}" r="7"/><text class="od-mk" x="${START[0] + 16}" y="${START[1] + 4}">始まり</text>`);
    L.node.push(`<circle class="od-end" cx="${FIN[0]}" cy="${FIN[1]}" r="9"/><circle class="od-endi" cx="${FIN[0]}" cy="${FIN[1]}" r="5"/><text class="od-mk" x="${FIN[0] + 16}" y="${FIN[1] + 4}">終わり</text>`);
    L.top.push(`<circle class="od-pulse popc a" cx="${FIN[0]}" cy="${FIN[1]}" r="9" style="${kf([[0, { opacity: 0, transform: "scale(1)" }], [S[9] + 1.0, { opacity: 0, transform: "scale(1)" }], [S[9] + 1.05, { opacity: 0.8, transform: "scale(1)" }, OUT], [S[9] + 1.8, { opacity: 0, transform: "scale(2.4)" }], [TOTAL, { opacity: 0, transform: "scale(1)" }]])}"/>`);

    // 線。きっかけの名前、番号、注文の札は部品が置く
    E.edge(0, `M ${C[0]} 50 L ${C[0]} ${B[0].t - 4}`, { label: "注文を確定", carry: tag(P[0]) });
    E.edge(1, `M ${B[0].r + 4} ${AY} L ${B[1].l - 4} ${AY}`, { label: "決済へ進む", lp: above(B[0], B[1], AY), carry: tag(P[1]) });
    E.edge(2, `M ${B[1].r + 4} ${AY} L ${B[2].l - 4} ${AY}`, { label: "支払いを確定", lp: above(B[1], B[2], AY), carry: tag(P[2]) });
    E.edge(3, `M ${B[2].r + 4} ${AY} L ${B[3].l - 4} ${AY}`, { label: "在庫を確保", lp: above(B[2], B[3], AY), carry: tag(P[3]) });
    // 上の段の終わりから、段の間を通って下の段の始まりへ戻る
    E.edge(4, `M ${C[3]} ${B[3].b + 4} L ${C[3]} ${RY - 12} Q ${C[3]} ${RY} ${C[3] - 12} ${RY} L ${C[0] + 12} ${RY} Q ${C[0]} ${RY} ${C[0]} ${RY + 12} L ${C[0]} ${B[4].t - 4}`, { label: "伝票を発行", carry: tag(P[4]), dur: 1.6 });
    E.edge(5, `M ${B[4].r + 4} ${BY} L ${B[5].l - 4} ${BY}`, { label: "配達を記録", lp: above(B[4], B[5], BY), carry: tag(P[5]) });
    E.edge(6, `M ${B[5].r + 4} ${BY} L ${B[6].l - 4} ${BY}`, { label: "返品を申請", lp: above(B[5], B[6], BY), carry: tag(P[6]) });
    // 同じ状態へ戻る矢印。箱の下で輪を描く
    E.edge(7, `M ${C[2] + 12} ${B[6].b + 2} C ${C[2] + 16} ${B[6].b + 42} ${C[2] - 16} ${B[6].b + 42} ${C[2] - 12} ${B[6].b + 2}`, { label: "検品する", lp: [C[2], B[6].b + 52], carry: tag(P[6]), dur: 1.2 });
    E.edge(8, `M ${B[6].r + 4} ${BY} L ${B[7].l - 4} ${BY}`, { label: "返金を実行", lp: above(B[6], B[7], BY), carry: tag(P[7]) });
    E.edge(9, `M ${C[3]} ${B[7].b + 4} L ${C[3]} ${FIN[1] - 13}`, { label: "注文を閉じる", lp: [C[3] - 60, 442], carry: { kind: "tag", text: "#1042" } });

    // 脇道。支払い待ち、支払い済み、発送準備の 3 つから取り消しへ入れるが、今回は通らない
    {
      const w = 128, h = 60, x0 = C[2] - w / 2, y0 = 26, cy = y0 + h / 2, HY = 128, IN = y0 + h + 4;
      L.band.push(`<rect class="od-side" x="180.5" y="8.5" width="529" height="99" rx="14"/><text class="od-sz" x="196" y="36">脇道</text><text class="od-sx" x="196" y="53">今回は通らない</text><text class="od-sx" x="196" y="69">3 つの状態から入れる</text>`);
      const XS = [
        `M ${C[1]} ${B[1].t - 4} L ${C[1]} ${HY + 12} Q ${C[1]} ${HY} ${C[1] + 12} ${HY} L ${x0 + 16} ${HY} Q ${x0 + 28} ${HY} ${x0 + 28} ${HY - 12} L ${x0 + 28} ${IN}`,
        `M ${C[2]} ${B[2].t - 4} L ${C[2]} ${IN}`,
        `M ${C[3]} ${B[3].t - 4} L ${C[3]} ${HY + 12} Q ${C[3]} ${HY} ${C[3] - 12} ${HY} L ${x0 + w - 16} ${HY} Q ${x0 + w - 28} ${HY} ${x0 + w - 28} ${HY - 12} L ${x0 + w - 28} ${IN}`,
        `M ${x0 + w + 4} ${cy} L ${x0 + w + 26} ${cy}`,
      ];
      const head = (d) => {
        const n = d.match(/-?\d+(?:\.\d+)?/g).map(Number), ex = n[n.length - 2], ey = n[n.length - 1];
        let dx = ex - n[n.length - 4], dy = ey - n[n.length - 3];
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        return `M ${r1(ex - dx * 6 - dy * 3.5)} ${r1(ey - dy * 6 + dx * 3.5)} L ${ex} ${ey} L ${r1(ex - dx * 6 + dy * 3.5)} ${r1(ey - dy * 6 - dx * 3.5)}`;
      };
      L.base.push(XS.map((d) => `<path class="od-xe" d="${d}"/><path class="od-xh" d="${head(d)}"/>`).join(""));
      L.mid.push(`<text class="od-xl" x="${C[2] + 9}" y="${HY + 18}">取り消す</text>`);
      L.node.push(`<g style="${cs("rose")}"><rect class="od-ghost" x="${x0}" y="${y0}" width="${w}" height="${h}" rx="12"/><rect class="od-gi" x="${x0 + 12}" y="${cy - 12}" width="24" height="24" rx="7"/>${glyph("x", x0 + 24, cy, "gl", 0.62)}` +
        `<text class="od-gn" x="${x0 + 46}" y="${cy - 3}">キャンセル</text><text class="ss" x="${x0 + 46}" y="${cy + 13}">払った分は返す</text></g>`);
      L.node.push(`<circle class="od-endx" cx="${x0 + w + 38}" cy="${cy}" r="8"/><circle class="od-endxi" cx="${x0 + w + 38}" cy="${cy}" r="4.5"/>`);
    }

    // 注文の記録の帯。状態が移るたびに欄が書き換わる
    {
      const y0 = 504, ly = y0 + 22, vy = y0 + 43;
      const p = [E.stripBg({ y: y0, w: 728, h: 72, title: "注文 #1042", g: "doc", c: "blue" })];
      for (const sx of [124, 220, 306, 392, 484, 548]) p.push(`<line class="sep" x1="${sx}" y1="${y0 + 14}" x2="${sx}" y2="${y0 + 58}"/>`);

      // 状態の欄は、今の状態の色の札で出す
      const st = [E.field(134, ly, "状態", [[0, "—", "fv-mute"], [ENTER[0] + 0.4, ""]], 0)];
      ST.forEach((s, k) => {
        const w = r1(tw(s.name, 6.6, 10.5) + 16), a = ENTER[k] + 0.6, b = k + 1 < ST.length ? ENTER[k + 1] + 0.45 : LAST;
        st.push(E.tag(134, vy - 1, w, s.name, s.c, a, b));
      });
      p.push(st.join(""));

      p.push(E.field(230, ly, "支払い", [[0, "まだ", "fv-mute"], [S[2] + 0.7, "4,980 円"], [S[8] + 0.9, "返金した", "od-fv-rose"]], 0));
      p.push(E.field(316, ly, "在庫", [[0, "未確保", "fv-mute"], [S[3] + 0.7, "確保した", "od-fv"], [S[4] + 0.7, "出荷した", "od-fv"], [S[7] + 1.0, "棚へ戻した", "od-fv"]], 0));
      p.push(E.field(402, ly, "伝票番号", [[0, "—", "fv-mute"], [S[4] + 0.9, "4821-0937"]], 0));
      const age = ["0 分", "2 分", "5 分", "3 時間", "1 日", "2 日", "6 日", "9 日", "10 日"];
      p.push(E.field(494, ly, "経過", [[0, "—", "fv-mute"], ...age.map((t, k) => [S[k] + 0.6, t])], 0));

      // 通った状態の並び。入った順に状態の色で埋まる
      const hist = [`<text class="fl" x="558" y="${ly}">履歴</text>`];
      ST.forEach((s, k) => {
        const x = 564 + k * 16;
        hist.push(`<circle class="slot" cx="${x}" cy="${vy - 4}" r="5"/><g class="popc a" style="${cs(s.c)};${pop(ENTER[k] + 0.6)}"><circle class="ok" cx="${x}" cy="${vy - 4}" r="5.4"/></g>`);
      });
      p.push(hist.join(""));
      L.node.push(p.join(""));
    }
  },
});
