// 作業の枝 feature を rebase して main へ取り込むまで。
// 上の線が main、下の線が feature。commit は丸で、枝の参照 (main / feature) は黒い札として線の上を運ばれる。
// HEAD は下の帯に出し、枝から離れた間 (rebase の途中) だけ札でも出す。
// 当て直した C' と D' は E の後ろ (上の線) に積むので、取り込んだ後の履歴はそのまま 1 本に見える。
DRAGON.add({
  id: "git",
  form: "graph",
  mode: "fixed",
  title: "作業の枝を rebase して main へ取り込む",
  short: "rebase して取り込む",
  label: "作業の枝 feature を main の先端へ rebase し、衝突を直して検査を通し、main を早送りで進めて履歴を 1 本にするまでを 11 段で動かす図",
  w: 728,
  h: 414,
  icons: {
    trunk: "M -10 0 h6.5 M 3.5 0 h6.5 M -3.5 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0",
  },
  intro: { t: "全体の地図", body: "上の線が main、下の線が作業の枝 feature。丸が commit で、黒い札が枝の参照。HEAD (今いる場所) は下の帯に出し、枝から離れた間だけ札でも出す。右下の箱は手元のファイル。" },
  outro: { t: "通しで見る", body: "rebase は commit を作り直すので hash が変わる。もう他の人と共有した枝を rebase すると相手の履歴と食い違うため、手元だけの枝に使う。" },
  steps: [
    { c: "blue", tag: "main", d: 2.6, t: "main にある", body: "main に commit A と B がある。main は B を指し、HEAD は main を指している。手元で開いているのは B の中身。" },
    { c: "violet", tag: "feature", d: 2.6, t: "枝を切る", code: "git switch -c feature", body: "B から作業の枝 feature を作って移る。feature も B を指し、HEAD は feature を指す。中身はまだ main と同じ。" },
    { c: "violet", tag: "feature", d: 3.2, t: "作業を積む", code: "git commit", body: "feature に C と D を積む。commit のたびに feature が新しい commit へ進み、HEAD も付いていく。main は B のまま。" },
    { c: "blue", tag: "main", d: 2.6, t: "main が進む", body: "その間に他の人の変更 E が main に入り、手元の main も取り込んで E を指す。feature は古い B から分かれたまま。" },
    { c: "violet", tag: "rebase", d: 3.2, t: "rebase を始める", code: "git rebase main", body: "Git は分かれ目の B まで戻って C と D を控え、HEAD を E へ移す。HEAD は枝を通さず E を直接指す (切り離し)。ここから 1 つずつ当て直す。" },
    { c: "rose", tag: "rebase", d: 3.0, t: "衝突で止まる", body: "C を E の上へ当て直すと、E も同じ行を変えていたので衝突する。rebase はそこで止まり、直すのを待つ。" },
    { c: "violet", tag: "rebase", d: 3.0, t: "直して続ける", code: "git add → git rebase --continue", body: "衝突した行を直して続けると、C と同じ変更を持つ C' ができる。親が B から E に変わったので hash も変わる。" },
    { c: "violet", tag: "rebase", d: 3.8, t: "D を当て直す", body: "D は衝突せず D' になる。当て終わると feature が D' へ移り、HEAD も feature に戻る。元の C と D はどこからも指されない。" },
    { c: "green", tag: "検査", d: 2.8, t: "検査が通る", body: "D' は E の変更も含んだ形になっている。この形で検査を回し、全て通ることを確かめてから取り込む。" },
    { c: "blue", tag: "main", d: 3.4, t: "main を早送り", code: "git switch main → git merge --ff-only feature", body: "main を D' まで進める。main の先に C' と D' が一直線に続くので、merge commit を作らず参照を動かすだけで済む。" },
    { c: "blue", tag: "main", d: 3.0, t: "一直線の履歴", code: "git log --oneline", body: "main の履歴を先端から辿ると D'、C'、E、B、A の 1 本になる。元の C と D は reflog に残るが、期限が過ぎると掃除される。" },
  ],
  css: `
.gt-c{fill:var(--surf);stroke:var(--c);stroke-width:2.25}
.gt-cl{font:700 11px var(--sans);fill:var(--ct)}
.gt-old{fill:var(--surf);stroke:var(--c);stroke-width:1.5;stroke-dasharray:3 3;stroke-opacity:.6}
.gt-oldl{font:700 11px var(--sans);fill:var(--ct);opacity:.55}
.gt-ssx{font:700 11px var(--sans);fill:var(--t-rose)}
.gt-ssg{font:700 11px var(--sans);fill:var(--t-green)}
`,
  draw(E) {
    const { S, L, LAST, pop, vis, cs, SH, esc } = E;

    // commit の置き場。上の線 (main) は y 120、下の線 (feature) は y 250
    // L0 は枝の線路の始まりで、commit は置かない。feature の札は枝を切った直後だけここに留まる
    const P = { A: [120, 120], B: [210, 120], E: [300, 120], Cp: [390, 120], Dp: [480, 120], L0: [270, 250], C: [345, 250], D: [435, 250] };
    // 札の置き場。1 段目は commit の 30 上、同じ commit に 2 枚目が来た時は 52 上
    const slot = ([x, y], row = 1) => [x, y - (row === 1 ? 30 : 52)];
    const tag = (text, to, until) => ({ kind: "tag", text, to, until });
    // 引いた線の上を、もう 1 つの札が後から走る
    const ride = (d, a, dur, text, to, until) => { const m = E.measure(d); E.carry(m, a, a + dur, tag(text, to), until); m.drop(); };

    E.band({ y: 0, w: 728, h: 150, c: "blue", label: ["main"], ex: "取り込む先", g: "trunk" });
    E.band({ y: 160, w: 728, h: 172, c: "violet", label: ["feature"], ex: "作業の枝", g: "branch" });

    const D = {
      AB: "M 132 120 L 198 120",
      BE: "M 222 120 L 288 120",
      BRANCH: "M 210 132 C 210 214 222 250 270 250",
      L0C: "M 270 250 L 333 250",
      CD: "M 357 250 L 423 250",
      // rebase は feature を分かれ目の B まで辿り戻し、main の先端 E へ移る
      WALK: "M 423 250 L 270 250 C 222 250 210 214 210 132 L 210 120 L 288 120",
      RC: "M 345 238 C 345 186 390 184 390 132",
      EC: "M 312 120 L 378 120",
      RD: "M 435 238 C 435 186 480 184 480 132",
      CDp: "M 402 120 L 468 120",
      // 早送りは commit を作らず、札だけが 2 段目の札の高さを進む (1 段目は D' の feature が塞いでいる)
      FF: "M 331 68 L 459 68",
      // git log は先端から親を辿る
      LOG: "M 468 120 L 132 120",
    };

    // 段ごとの線。運ぶ札の留まる時刻は、次にその札を運ぶ線が動き出す時刻に合わせる
    const e0 = E.edge(0, D.AB, { carry: tag("main", slot(P.B), S[3] + 0.1) });
    const e1 = E.edge(1, D.BRANCH, { head: false, label: "git switch -c feature", lp: [165, 282], carry: tag("feature", slot(P.L0), S[2] + 0.1) });
    const e2 = E.edge(2, D.L0C, { label: "git commit", lp: [300, 282], carry: tag("feature", slot(P.C), S[2] + 1.7) });
    const featLeavesD = S[7] + 2.35, featAtDp = featLeavesD + 1.1;
    const e2b = E.edge(2, D.CD, { at: 1.2, carry: tag("feature", slot(P.D), featLeavesD) });
    // 当て直しの線は B から E への線の下に敷き、main の線の色を上に残す
    const e4 = E.edge(4, D.WALK, { ghost: false, dur: 1.6, label: "git rebase main", lp: [412, 282], carry: tag("HEAD", slot(P.E, 2), S[6] + 0.7) });
    const e9a = S[9] + 0.5;
    const e3 = E.edge(3, D.BE, { carry: tag("main", slot(P.E), e9a) });
    const e5 = E.edge(5, D.RC, { carry: tag("C の変更", P.Cp, S[6] + 0.7) });
    const e6 = E.edge(6, D.EC, { at: 0.7, label: "git rebase --continue", lp: [345, 34], carry: tag("HEAD", slot(P.Cp), S[7] + 1.25) });
    // 段の番号は C' から D' への線の始まりに置く (D の上は feature の札が留まっていて隠れる)
    const e7b = E.edge(7, D.CDp, { k: 1, at: 0.75, dur: 0.7, carry: tag("HEAD", slot(P.Dp), featAtDp - 0.3) });
    E.edge(7, D.RD, { k: 0, dur: 0.8, carry: tag("D の変更", P.Dp, S[7] + 1.15) });
    // 当て終わると feature が D' へ移り、先に着いていた HEAD を引き取る
    ride(D.RD, featLeavesD, 0.8, "feature", slot(P.Dp), LAST);
    const e9 = E.edge(9, D.FF, { at: 0.5, label: "git merge --ff-only feature", lp: [560, 34], carry: tag("main", slot(P.Dp, 2), LAST) });
    E.edge(10, D.LOG, { head: false, ghost: false, label: "git log --oneline", lp: [175, 34] });

    // commit の丸。線が着いた時に出る
    const commit = ([x, y], c, letter, a) => `<g style="${cs(c)}"><g class="popc a" style="${pop(a)}"><circle class="gt-c" cx="${x}" cy="${y}" r="12" ${SH}/><text class="gt-cl" x="${x}" y="${y + 4}" text-anchor="middle">${esc(letter)}</text></g></g>`;
    // どこからも指されなくなった commit。点線の縁の丸を上に重ねる
    const orphan = ([x, y], letter, a) => `<g class="a" style="${cs("violet")};${vis(a, LAST, { f: 0.5 })}"><circle class="gt-old" cx="${x}" cy="${y}" r="13.5"/><text class="gt-oldl" x="${x}" y="${y + 4}" text-anchor="middle">${esc(letter)}</text></g>`;
    const orphanAt = featAtDp + 0.05, cpAt = e6.a, dpAt = S[7] + 1.2;
    L.node.push(
      commit(P.A, "blue", "A", S[0] - 0.6),
      commit(P.B, "blue", "B", e0.b),
      commit(P.C, "violet", "C", e2.b),
      commit(P.D, "violet", "D", e2b.b),
      commit(P.E, "blue", "E", e3.b),
      commit(P.Cp, "violet", "C'", cpAt),
      commit(P.Dp, "violet", "D'", dpAt),
      orphan(P.C, "C", orphanAt),
      orphan(P.D, "D", orphanAt),
    );

    // 手元のファイル。衝突と検査は線を作らず、箱の下の字で見せる
    const tree = E.card({
      cx: 620, cy: 246, w: 176, name: "作業ツリー", sub: "手元のファイル", g: "doc", c: "violet", on: [5, 6, 8],
      swap: [[e5.b + 0.3, "src/price.ts で衝突", "gt-ssx"], [S[6] + 0.2, "直して git add した", "ss-ok"], [S[8] + 0.2, "D' で検査を回す", "ss"], [S[8] + 1.3, "型 ・ 単体 ・ 結合が通った", "gt-ssg"]],
    });
    E.stepAt(8, tree);

    // 参照の帯。段ごとに行き先が書き換わる
    {
      const y0 = 342, ly = y0 + 22;
      const H = { B: "8b04f71", C: "c41d0e5", D: "d72b9a3", E: "e5f8312", Cp: "a90c6b4", Dp: "f1e7d28" };
      const none = [0, "—", "fv-mute"];
      const p = [E.stripBg({ y: y0, w: 728, h: 72, title: "参照", g: "branch", c: "violet" })];
      for (const sx of [92, 210, 328, 470, 604]) p.push(`<line class="sep" x1="${sx}" y1="${y0 + 14}" x2="${sx}" y2="${y0 + 58}"/>`);
      const at = (e) => e.b + 0.3;
      p.push(E.field(104, ly, "main", [none, [at(e0), `B ${H.B}`], [at(e3), `E ${H.E}`], [at(e9), `D' ${H.Dp}`]]));
      p.push(E.field(222, ly, "feature", [none, [at(e1), `B ${H.B}`], [at(e2), `C ${H.C}`], [at(e2b), `D ${H.D}`], [featAtDp, `D' ${H.Dp}`]]));
      p.push(E.field(340, ly, "HEAD", [none, [at(e0), "main"], [at(e1), "feature"], [at(e4), "E (切り離し)"], [at(e6), "C' (切り離し)"], [at(e7b), "D' (切り離し)"], [featAtDp, "feature"], [S[9] + 0.2, "main"]]));
      p.push(E.field(482, ly, "履歴の形", [none, [at(e0), "一直線"], [at(e3), "枝分かれ"], [e4.a + 0.2, "当て直し中"], [at(e5), "衝突で停止"], [cpAt, "当て直し中"], [featAtDp, "早送りできる"], [at(e9), "一直線"]]));
      p.push(E.field(616, ly, "merge commit", [none, [at(e9), "作らない"]]));
      L.node.push(p.join(""));
    }
  },
});
