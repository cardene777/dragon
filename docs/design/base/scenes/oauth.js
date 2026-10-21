// OAuth 2.0 の認可コードと PKCE で、ログインしてから API を呼ぶまで。
// 4 本の生存線を左右に並べ、上から下へ時間を進める。線の名前、段の番号、運ぶ物は部品が置く。
DRAGON.add({
  id: "oauth",
  form: "seq",
  mode: "fixed",
  title: "OAuth 2.0 でログインして API を呼ぶ (認可コードと PKCE)",
  short: "ログインして API を呼ぶ",
  label: "OAuth 2.0 の認可コードと PKCE で、利用者のブラウザ、アプリ、認可サーバー、API の 4 者がやり取りし、ログインから API の呼び出しまでを 12 段で動かす時系列図",
  w: 728,
  h: 780,
  intro: { t: "全体の地図", body: "左から利用者のブラウザ、アプリ、認可サーバー、API が並び、上から下へ時間が進む。名前に「直接」と付いた線はブラウザを通らない。下の帯にアプリが持つ値が出る。" },
  outro: { t: "通しで見る", body: "アプリはパスワードに一度も触れず、トークンだけで API を呼べた。途中で認可コードを盗まれても、code_verifier を知らなければトークンに換えられない。" },
  steps: [
    { c: "slate", tag: "利用者のブラウザ", d: 2.4, t: "ログインを押す", code: "GET /login", body: "利用者がアプリのログインを押す。アプリは ID もパスワードも受け取らず、本人の確認を認可サーバーに任せる。" },
    { c: "blue", tag: "アプリ", d: 3.2, t: "鍵の元を作る", code: "code_challenge = BASE64URL(SHA-256(code_verifier))", body: "アプリが使い捨ての code_verifier を作り、その SHA-256 を code_challenge にする。戻りを見分ける state も作り、手元に残す。" },
    { c: "blue", tag: "アプリ", d: 2.8, t: "認可サーバーへ回す", code: "GET /authorize?code_challenge=…&state=…", body: "アプリはブラウザを認可サーバーへリダイレクトする。code_challenge と state は URL に載り、ブラウザを通って運ばれる。" },
    { c: "violet", tag: "認可サーバー", d: 3.2, t: "ログインと同意", body: "認可サーバーが利用者を確かめ、アプリに渡す範囲 (scope) への同意を取る。パスワードはアプリに一度も渡らない。" },
    { c: "violet", tag: "認可サーバー", d: 2.8, t: "認可コードを付けて戻す", code: "302 redirect_uri?code=…&state=…", body: "認可サーバーは短命の認可コードを発行し、登録済みの redirect_uri へブラウザを戻す。コードもブラウザを通る。" },
    { c: "blue", tag: "アプリ", d: 2.4, t: "state を確かめる", body: "アプリは戻った state が送った値と同じかを確かめる。違えば他人が仕組んだ戻りとみなして捨てる。" },
    { c: "blue", tag: "アプリ", d: 2.6, t: "コードを交換する", code: "POST /token  code=…&code_verifier=…", body: "アプリは認可コードと code_verifier を、ブラウザを通さず認可サーバーへ直接送る。" },
    { c: "violet", tag: "認可サーバー", d: 3.4, t: "照らし合わせる", body: "認可サーバーは code_verifier の SHA-256 が最初の code_challenge と同じか、コードが未使用で期限内かを確かめ、コードを使用済みにする。" },
    { c: "violet", tag: "認可サーバー", d: 2.6, t: "トークンを返す", code: "access_token, refresh_token, expires_in", body: "通ればアクセストークンとリフレッシュトークンを返す。コードだけを盗んだ者は code_verifier を知らないので、前の段で弾かれる。" },
    { c: "blue", tag: "アプリ", d: 2.4, t: "API を呼ぶ", code: "Authorization: Bearer <access_token>", body: "アプリはアクセストークンを Authorization ヘッダに載せて API を呼ぶ。" },
    { c: "green", tag: "API", d: 3.0, t: "確かめて返す", body: "API はトークンの署名、期限、許された範囲を確かめ、通れば利用者のデータを返す。" },
    { c: "blue", tag: "アプリ", d: 2.6, t: "ログイン後の画面を返す", body: "アプリはデータで画面を作って返す。アクセストークンが切れたら、リフレッシュトークンで新しく取り直す。" },
  ],
  css: `
.oa-life{fill:none;stroke:var(--line);stroke-width:1.5;stroke-linecap:round;stroke-dasharray:0 5}
.oa-pop{fill:var(--surf);stroke:var(--hair)}
.oa-pt{font:700 11.5px var(--sans);fill:var(--ink)}
.oa-pr{font:500 11px var(--sans);fill:var(--ink2)}
.oa-pm{font:600 11px var(--mono);fill:var(--ink)}
`,
  draw(E) {
    const { S, STEPS, L, LAST, cs, SH, r1, esc, tw, pop, rise, glyph, stepEnd } = E;
    const X = { B: 100, A: 282, Z: 464, R: 646 }, HB = 4, LIFE = [76, 694];

    // やり取り。[段, 送る側, 受ける側, y, 名前, 段の始まりから線を引くまで, 引く長さ, 運ぶ物]
    // 名前に「直接」と付けたものはブラウザを通らない。運ぶ物は封筒 (要求と応答) か黒い札 (名前のある値)
    const env = { kind: "env" }, tag = (text) => ({ kind: "tag", text });
    const MSG = [
      [0, "B", "A", 112, "GET /login", 0.5, 0.8, env],
      [2, "A", "B", 194, "302 で転送", 0.1, 0.8, tag("challenge")],
      [2, "B", "Z", 228, "GET /authorize", 1.0, 0.9, tag("challenge")],
      [3, "Z", "B", 266, "ログイン画面", 0.1, 0.9, env],
      [3, "B", "Z", 300, "ID とパスワードと同意", 1.6, 0.9, env],
      [4, "Z", "B", 338, "302 で転送", 0.1, 0.9, tag("code")],
      [4, "B", "A", 372, "GET /callback", 1.2, 0.8, tag("code")],
      [6, "A", "Z", 446, "直接 POST /token", 0.2, 0.9, tag("code + verifier")],
      [8, "Z", "A", 524, "直接 200 トークン", 0.2, 0.9, tag("access + refresh")],
      [9, "A", "R", 560, "GET /me", 0.2, 1.0, tag("Bearer")],
      [10, "R", "A", 640, "200 データ", 1.7, 1.0, env],
      [11, "A", "B", 676, "ログイン後の画面", 0.2, 0.8, env],
    ];
    // 自分の中で済ます処理は、短い自分への矢印で見せる。[段, 誰, y, 名前]
    const SELF = [[1, "A", 148, "鍵の元を作る"], [5, "A", 402, "state を照らす"], [7, "Z", 484, "照らし合わせる"], [10, "R", 596, "トークンを確かめる"]];

    // 生存線の頭。関わる段で縁が光り、下の字がその時の状態へ書き換わる
    const HEAD = {
      B: { c: "slate", name: "利用者のブラウザ", sub: "利用者が操作する", g: "globe", swap: [[S[11] + 1.0, "ログイン済み", "ss-ok"]] },
      A: { c: "blue", name: "アプリ", sub: "ログインを頼む側", g: "app", swap: [[S[8] + 1.2, "トークンを持つ", "ss-ok"]] },
      Z: { c: "violet", name: "認可サーバー", sub: "本人を確かめる", g: "shield", swap: [] },
      R: { c: "green", name: "API", sub: "利用者のデータ", g: "server", swap: [[S[10] + 2.7, "データを返した", "ss-ok"]] },
    };
    const involved = (k) => [...new Set([...MSG.filter((m) => m[1] === k || m[2] === k).map((m) => m[0]), ...SELF.filter((s) => s[1] === k).map((s) => s[0])])].sort((a, b) => a - b);
    for (const [k, h] of Object.entries(HEAD)) {
      E.card({ ...h, cx: X[k], cy: 40, on: involved(k) });
      L.band.push(`<path class="oa-life" d="M ${X[k]} ${LIFE[0]} L ${X[k]} ${LIFE[1]}"/>`);
    }

    // 自分への矢印。右端の API だけ左へ回す。同じ段にやり取りもある時 (API が確かめて返す) は、先に起きる自分への矢印に段の番号が付くよう、こちらを先に引く
    for (const [i, w, y, name] of SELF) {
      const s = w === "R" ? -1 : 1, x = X[w];
      E.edge(i, `M ${x + s * HB} ${y - 12} L ${x + s * 24} ${y - 12} Q ${x + s * 32} ${y - 12} ${x + s * 32} ${y - 4} L ${x + s * 32} ${y + 4} Q ${x + s * 32} ${y + 12} ${x + s * 24} ${y + 12} L ${x + s * HB} ${y + 12}`, { k: 0, at: 0.1, dur: 0.5, label: name, lside: s > 0 ? "right" : "left" });
    }

    // やり取りの線。名前は線の上に置くが、運ぶ物が線の上を走る間に重ならないよう、部品の既定より 4 だけ上へ寄せる
    for (const [i, f, t, y, name, at, dur, carry] of MSG) {
      const dir = Math.sign(X[t] - X[f]), x0 = X[f] + dir * HB, x1 = X[t] - dir * HB;
      E.edge(i, `M ${x0} ${y} L ${x1} ${y}`, { k: 0, at, dur, label: name, lp: [r1((x0 + x1) / 2), y - 19], carry });
    }
    // 鍵の元を作る段と照らし合わせる段だけ、手元で何を作り何を確かめたかを札で見せる (PKCE の要の 2 段)
    const popover = ({ x, y, w, title, rows, a, b, col2 = 0 }) => {
      const h = 46 + (rows.length - 1) * 15;
      const parts = [`<rect class="oa-pop" x="${x}" y="${y}" width="${w}" height="${h}" rx="12" ${SH}/><text class="oa-pt" x="${x + 12}" y="${y + 18}">${esc(title)}</text>`];
      rows.forEach((r, k) => {
        const yy = y + 36 + k * 15, icon = r.icon ?? "check";
        parts.push(`<circle class="slot" cx="${x + 18}" cy="${yy - 4}" r="5"/><g class="popc a" style="${cs(r.c ?? "green")};${pop(r.at, b)}"><circle class="ok" cx="${x + 18}" cy="${yy - 4}" r="5.5"/>${glyph(icon, x + 18, yy - 4, "ck", icon === "lock" ? 0.6 : 0.55)}</g>`);
        parts.push(`<text class="${r.mono ? "oa-pm" : "oa-pr"}" x="${x + 30}" y="${yy}">${esc(r.t)}</text>`);
        if (r.t2) parts.push(`<text class="oa-pr" x="${x + col2}" y="${yy}">${esc(r.t2)}</text>`);
      });
      L.top.push(`<g class="a" style="${rise(a, b)}">${parts.join("")}</g>`);
    };
    popover({
      x: 300, y: 166, w: 272, col2: 136, title: "アプリの手元で作る", a: S[1] + 0.7, b: stepEnd(1) - 0.15,
      rows: [
        { t: "code_verifier", mono: true, t2: "ランダムな 43〜128 字", at: S[1] + 1.0 },
        { t: "code_challenge", mono: true, t2: "verifier の SHA-256", at: S[1] + 1.4 },
        { t: "state", mono: true, t2: "ランダムな値", at: S[1] + 1.8 },
      ],
    });
    popover({
      x: 476, y: 502, w: 246, title: "認可サーバーが確かめる", a: S[7] + 0.7, b: stepEnd(7) - 0.15,
      rows: [
        { t: "SHA-256(verifier) = challenge", mono: true, at: S[7] + 1.1 },
        { t: "コードは未使用で期限内", at: S[7] + 1.6 },
        { t: "コードを使用済みにする", icon: "lock", c: "rose", at: S[7] + 2.2 },
      ],
    });

    // アプリが持つ値の帯。値が出て、渡し、使えなくなるまでを見せる
    {
      const y0 = 708, ly = 730;
      const p = [E.stripBg({ y: y0, w: 728, h: 72, title: "アプリが持つ値", g: "key", c: "blue" })];
      for (const sx of [150, 262, 374, 486, 598]) p.push(`<line class="sep" x1="${sx}" y1="${y0 + 14}" x2="${sx}" y2="${y0 + 58}"/>`);
      const tagW = (t) => r1(tw(t, 6.4, 10.5) + 14);
      // 値の欄。札は欄の右端にそろえる
      const field = ({ x, end, name, v, c, at, tags = [] }) => {
        p.push(`<g style="${cs(c)}">${E.field(x, ly, name, [[E.INTRO, "—", "fv-mute"], [at, v, "fv-id"]], E.S[0] + 1.2)}</g>`);
        for (const [t, tc, a, b, outline] of tags) p.push(E.tag(r1(end - 4 - tagW(t)), ly + 20.5, tagW(t), t, tc, a, b ?? LAST, { outline }));
      };
      field({ x: 160, end: 262, name: "state", v: "af0i…", c: "slate", at: S[1] + 1.9, tags: [["一致", "green", S[5] + 1.2]] });
      field({ x: 272, end: 374, name: "code_verifier", v: "dBjf…", c: "blue", at: S[1] + 1.1, tags: [["渡した", "blue", S[6] + 1.1, LAST, true]] });
      field({ x: 384, end: 486, name: "認可コード", v: "Splx…", c: "amber", at: S[4] + 2.1, tags: [["渡した", "amber", S[6] + 1.1, S[7] + 2.1, true], ["使えない", "rose", S[7] + 2.3, LAST, true]] });
      field({ x: 496, end: 598, name: "アクセストークン", v: "eyJh…", c: "green", at: S[8] + 1.1, tags: [["60 分", "green", S[8] + 1.5, LAST, true]] });
      field({ x: 608, end: 720, name: "リフレッシュトークン", v: "8xLO…", c: "violet", at: S[8] + 1.2, tags: [["保管", "violet", S[8] + 1.6, LAST, true]] });
      L.node.push(p.join(""));
    }
  },
});
