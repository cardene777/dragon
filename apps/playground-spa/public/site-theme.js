/*
 * 描く前にサイトの意匠を html へ付ける (#2962)。
 *
 * 意匠は住所の `?theme=` で決める。 無い時と記法に無い名前は活版。
 * 値の表 (`src/styles/site-theme.css`) は `html[data-site-theme]` で当たるので、ここで付けておけば
 * React が描く前の 1 回目から意匠の色で描かれる。
 *
 * 公開の頁は CSP が inline の script を許さないため、外部 file として `index.html` の頭で読む。
 * 束ねられずにそのまま配られるので記法の `THEMES` を import できず、名前の一覧をここで持つ
 * (`site-theme-script.test.ts` が `THEMES` と突き合わせる)。
 */
(function () {
  var names = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"];
  var theme = "letterpress";
  try {
    var asked = new URL(location.href).searchParams.get("theme");
    if (names.indexOf(asked) >= 0) theme = asked;
  } catch {
    // 住所を読めない時は活版のまま描く
  }
  document.documentElement.setAttribute("data-site-theme", theme);
  // 明暗の切り替えが残した保存の値を消す。 明暗は意匠の地から決まるので読む場所はもう無い
  try {
    localStorage.removeItem("v4-theme");
  } catch {
    // 保存の場所が使えない環境では消す物も無い
  }
})();
