/**
 * 薄い文字が明暗どちらでも同じくらい読めることの検証 (#1116)。
 *
 * 以前は明るい側だけ `.pen` の値 (`#8a857a`) のまま残り、 白地に対する対比が 3.67 しか
 * なかった。 暗い側は #1112 で `#77716a` から `#a8a199` へ持ち上げてあり 5.46 ある。
 * 同じ役割の文字が明暗で倍近く開いていた。
 *
 * ## 地は画素から読み、 文字は宣言色を使う (review R1-F1、 2 巡)
 *
 * 初版は宣言した色をそのまま測り、 `opacity` を重ねた形を見逃した (宣言 5.47 / 実際 3.58)。
 * 2 版は `opacity` を数えたが、 半透明の地を読み飛ばしてその下の不透明な祖先を地として
 * 採っていた (白地に `rgba(0,0,0,0.5)` を重ねた上の文字を 5.47 と判定する形が残る)。
 *
 * 難しいのは **地** の側で、 半透明の重なり / gradient / 混色 (`color-mix`) / 画像が絡み、
 * 合成の順序まで含めて再現しないと合わない。 そこは自前で持たず、 **薄い文字を隠した画面を
 * 撮ってその画素を読む**。 描画側が既に正しく合成している。
 *
 * **文字の側は画素から採らない**。 anti-alias のせいで、 最も濃い画素でも宣言した色に届かない
 * (実測 = 11px の等幅で宣言 `#6d6960` に対し芯の画素が `#73706 7`、 対比 5.30 が 4.49 に沈む。
 * 3 倍で撮っても変わらない)。 WCAG は指定された色で判定するので、 宣言色に `opacity` と
 * 色自身の alpha を掛けて、 読み取った地に重ねる。
 *
 * ## 地は「字が乗っている画素」 だけを見る
 *
 * 要素の矩形には字が乗っていない場所も入る。 そこを通る枠線や隣の面まで地として拾うと、
 * 実際より暗い / 明るい所を見て誤判定する (実測 = 行番号の矩形の worst が `227,224,216` に
 * なり、 実際の地 `245,244,239` より 2 段暗い所を見ていた)。
 *
 * 隠した写しと出した写しの差が大きい画素 = 字が実際に覆った所だけを見る。 1 つの文字が
 * 格子や半透明の重なりにまたがる場合に備えて、 その中の最悪値を採る。
 *
 * ## 1 画面あたり 2 枚で済ませる
 *
 * 対象は 1 画面で最大 135 件ある。 1 件ずつ撮ると現実的な時間で終わらないので、
 * **薄い文字を全部隠して 1 枚、 出して 1 枚** 撮り、 各要素の矩形だけを切り出して読む。
 *
 * 薄い文字どうしが重なることは無いので、 まとめて隠しても他の文字が地に混ざらない。
 *
 * ## 測る対象が 0 件なら落とす
 *
 * 選択の仕方が実装とずれると、 何も確かめずに通る。 各画面で 1 件以上取れることを
 * 先に見る。
 *
 * **上の帯は数に入れない**。 全画面に出るので、 帯の中の薄い文字だけで件数条件を
 * 満たしてしまい、 画面固有の薄い文字を 1 件も測れなくても通る (実測 = `/docs` で
 * 取れた 2 件がどちらも帯の中だった)。
 */
import { test, expect, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import { contrast, cores, requiredRatio, type Box } from "./helpers/pixel-contrast";

const 倍率 = 2;
test.use({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 倍率 });

/**
 * 薄い文字 1 件。
 *
 * `box` は頁の左上を原点とする座標 (写しと同じ基準)。
 * `色` は宣言された rgb、 `実効` は色の alpha と自分 / 祖先の `opacity` を掛けた値。
 */
type 対象 = {
  文: string;
  box: Box;
  px: number;
  weight: number;
  色: [number, number, number];
  実効: number;
};

/**
 * 集めた要素を頁の中に控える所。 写しを撮った後に **同じ要素** の位置を測り直すために使う
 * (`控えた要素の位置`)。 文字や並び順で対応を取ると、 DOM が組み替わった時に別の要素どうしを比べる。
 */
type 控えを持つ窓 = { __薄い文字の控え?: Element[] };

/** その画面で `--d-text-muted` が実際に当たっている文字を集める。 */
async function 薄い文字を集める(page: Page): Promise<対象[]> {
  return await page.evaluate(() => {
    const 薄 = getComputedStyle(document.documentElement).getPropertyValue("--d-text-muted").trim();
    // 変数を解決した実 rgb を得る (hex のままでは computed color と比べられない)
    const probe = document.createElement("span");
    probe.style.color = 薄;
    document.body.appendChild(probe);
    const 目標 = getComputedStyle(probe).color;
    probe.remove();

    const 数値 = (s: string): number[] | null => {
      const m = s.match(/[\d.]+/g);
      return m && m.length >= 3 ? m.map(Number) : null;
    };

    const out: 対象[] = [];
    const 控え: Element[] = [];
    for (const e of document.querySelectorAll("*")) {
      const 直 = [...e.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent?.trim())
        .map((n) => n.textContent!.trim())
        .join("");
      if (!直) continue;
      // 全画面に出る上の帯は数に入れない (帯だけで件数条件を満たさないため)
      if (e.closest("header.v4-nav")) continue;
      const c = getComputedStyle(e);
      if (c.color !== 目標) continue;
      if (c.visibility === "hidden" || c.display === "none") continue;
      const r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;

      // **切り取られる要素は対象にしない**。 内側に scroll する箱や写しの下端で、
      // 要素の一部しか描かれないことがある。 字の下半分だけが外に出ると、 残った帯には
      // 字の画素が 1 つも無く「隠しても変わらない」 になる (実測 = 一覧の 8 件と
      // `/editor` の `mind` 1 件)。
      //
      // 部分的に描かれた要素を測ると、 配色と無関係な理由で落ちたり通ったりする。
      // **全部描かれている要素だけ** を測り、 それ以外は測れなかった扱いにもしない
      // (測れないのではなく、 測る対象ではない)。
      let [l, t2, rr, b] = [r.left, r.top, r.right, r.bottom];
      for (let n = e.parentElement; n; n = n.parentElement) {
        const ns = getComputedStyle(n);
        const 切る = [ns.overflow, ns.overflowX, ns.overflowY].some((v) => v !== "visible");
        if (!切る) continue;
        const p = n.getBoundingClientRect();
        l = Math.max(l, p.left);
        t2 = Math.max(t2, p.top);
        rr = Math.min(rr, p.right);
        b = Math.min(b, p.bottom);
      }
      // 写しは文書の大きさで撮るので、 そこからはみ出す分も切り取られる
      rr = Math.min(rr, document.documentElement.scrollWidth - scrollX);
      b = Math.min(b, document.documentElement.scrollHeight - scrollY);
      const 欠け = l - r.left > 0.5 || t2 - r.top > 0.5 || r.right - rr > 0.5 || r.bottom - b > 0.5;
      if (欠け) continue;

      const v = 数値(c.color);
      if (!v) continue;

      // 色自身の alpha と、 自分と祖先の `opacity` を掛ける。 祖先は `documentElement`
      // 自身も含めて遡る (root に掛けた分を見落とさない)
      let 実効 = v.length === 4 ? v[3]! : 1;
      let a: Element | null = e;
      while (a) {
        実効 *= Number(getComputedStyle(a).opacity || 1);
        if (a === document.documentElement) break;
        a = a.parentElement;
      }
      out.push({
        文: 直.slice(0, 24),
        box: { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height },
        px: parseFloat(c.fontSize),
        weight: Number.parseInt(c.fontWeight, 10) || 400,
        色: [v[0]!, v[1]!, v[2]!],
        実効,
      });
      控え.push(e);
    }
    (window as unknown as 控えを持つ窓).__薄い文字の控え = 控え;
    return out;
  });
}

/** `薄い文字を集める` が控えた要素を、 いまの位置で測り直す。 頁から外れた要素は `null` */
async function 控えた要素の位置(page: Page): Promise<(Box | null)[]> {
  return await page.evaluate(() =>
    ((window as unknown as 控えを持つ窓).__薄い文字の控え ?? []).map((e) => {
      if (!e.isConnected) return null;
      const r = e.getBoundingClientRect();
      return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
    }),
  );
}

/** 位置を落ちた時の文面に出す形。 0.5px の動きも読めるよう小数 1 桁まで出す */
const 位置の字 = (b: Box): string =>
  `x ${b.x.toFixed(1)} y ${b.y.toFixed(1)} 幅 ${b.width.toFixed(1)} 高さ ${b.height.toFixed(1)}`;

/** 測った時から 0.5px を超えて動いたか。 それ未満は丸めの差で、 写しの画素 (2 倍) で半画素に満たない */
const 動いたか = (前: Box, 後: Box): boolean =>
  [前.x - 後.x, 前.y - 後.y, 前.width - 後.width, 前.height - 後.height].some(
    (d) => Math.abs(d) > 0.5,
  );

/** 薄い文字を全部隠す / 戻す。 隠した画面が地になる。 */
async function 隠す(page: Page, 隠すか: boolean): Promise<void> {
  await page.evaluate((h) => {
    const 薄 = getComputedStyle(document.documentElement).getPropertyValue("--d-text-muted").trim();
    const probe = document.createElement("span");
    probe.style.color = 薄;
    document.body.appendChild(probe);
    const 目標 = getComputedStyle(probe).color;
    probe.remove();
    for (const e of document.querySelectorAll("*")) {
      const 直 = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim());
      if (!直 || e.closest("header.v4-nav")) continue;
      if (getComputedStyle(e).color !== 目標) continue;
      (e as HTMLElement).style.visibility = h ? "hidden" : "";
    }
  }, 隠すか);
}

/**
 * 画面の動きを止める。
 *
 * 本検査は 4 並列の中で走り、 その間ずっと動く図を開いたままにする。 他の worker で
 * 寸法を測る検査が走ると CPU を奪われて標本を取り損ね、 図が壊れていないのに落ちる
 * (実測 = 本 file を外すと 383 件が安定して通り、 入れると `row-bounds-offset` /
 * `pattern-validate-process` が回ごとに入れ替わって落ちた)。
 *
 * 動いたまま 2 枚撮ると、 隠した写しと出した写しで図そのものが変わってしまう問題もある。
 *
 * `animation: none` ではなく `paused` にするのは、 途中の状態を保ったまま止めるため
 * (`none` は初期状態へ戻すので、 動きの中で色が変わる要素を実際とは違う色で測ることになる)。
 */
async function 動きを止める(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-play-state: paused !important;
      transition: none !important;
    }`,
  });
}

/**
 * 落ちた時に出す画面の名前。
 *
 * 経路は base 相対で書くため、トップだけ空文字になる (#1438)。 そのまま出すと
 * 「 で薄い文字を 1 つも測れていない」 のように、どの画面の話か読めない形になる。
 */
const 画面名 = (path: string): string => path || "トップ";

async function 開く(page: Page, path: string, 暗い: boolean, 部品?: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate((d) => {
    document.documentElement.classList.toggle("dark", d);
  }, 暗い);
  await page.waitForTimeout(1200);
  if (部品) {
    // 一覧の中の選択は URL に出ないので押して開く (`CategoryPage` が state で持つ)
    const 押せた = await page.evaluate((id) => {
      const 札 = [...document.querySelectorAll(".catalog-list-item")].find((e) =>
        (e.textContent ?? "").includes(id),
      );
      if (!札) return false;
      (札 as HTMLElement).scrollIntoView({ block: "center" });
      (札 as HTMLElement).click();
      return true;
    }, 部品);
    expect(押せた, `${画面名(path)} に ${部品} が見つからない (一覧の中身が変わった)`).toBe(true);
    await page.waitForTimeout(2000);
  }
  await 動きを止める(page);
  await page.evaluate(() => scrollTo(0, 0));
}

type 結果 = { 文: string; 比: number; 要: number; px: number; 地: string };
/** 測れなかった 1 件。 黙って除くと、 読めない文字が 1 件だけ残っても通ってしまう。 */
type 測れず = { 文: string; px: number; 理由: string };

/**
 * 薄い文字を全部測る。 写しは 1 画面につき 2 枚だけ撮る。
 *
 * 測れなかった要素は捨てずに返す。 捨てると、 地と同じ色になって消えた 1 件や写しの外に
 * 出た 1 件があっても、 他の要素で件数条件を満たして通ってしまう。
 *
 * ## 撮る間に位置が動いた要素も測れなかった側に入れる (#2046)
 *
 * 位置を測ってから 2 枚を撮り終えるまでに要素が動くと、 測った位置の画素は別の場所のものになる。
 * 文字が無い所を見れば「隠しても画素が変わらない」 になり、 別の薄い文字の上を見れば
 * **その文字の対比を測って通る**。 どちらも読みやすさの判定として成り立たないので、 画素が
 * 読めた場合も落とす。
 *
 * 実際に `/catalog/interactive` で一覧の箱の下端近くの 2 件が 1 度だけ「隠しても画素が変わらない」
 * で落ち、 再現しなかった。 落ちた時に位置の前後を出せば、 ずれが原因だったかを 1 回で切り分けられる。
 *
 * **測れなかった文字があれば 2 枚の写しを検査の結果に添付する**。 位置が動いていないのに画素が
 * 変わらない時は、 何が覆っていたかを写しで見るしかない。 通る時は添付しない (重くしない)。
 */
async function 測る(page: Page, 見出し: string): Promise<{ 測れた: 結果[]; 測れず: 測れず[] }> {
  const 対象群 = await 薄い文字を集める(page);
  if (対象群.length === 0) return { 測れた: [], 測れず: [] };

  // 薄い文字を隠した画面 = 各文字の位置の地。 半透明の重なりも gradient も、
  // 描画側が合成した結果がそのまま画素に出る
  await 隠す(page, true);
  const 地の写し = await page.screenshot({ fullPage: true });
  await 隠す(page, false);
  const 字の写し = await page.screenshot({ fullPage: true });
  const 地画 = PNG.sync.read(地の写し);
  const 字画 = PNG.sync.read(字の写し);

  const 撮った後 = await 控えた要素の位置(page);
  expect(
    撮った後.length,
    `${見出し} で集めた要素を測り直せていない (控えが空 = 位置の比べが空振りしている)`,
  ).toBe(対象群.length);

  const out: 結果[] = [];
  const 不能: 測れず[] = [];
  for (const [i, t] of 対象群.entries()) {
    const 後 = 撮った後[i];
    if (後 === null || 後 === undefined) {
      不能.push({ 文: t.文, px: t.px, 理由: `撮る間に頁から外れた (${位置の字(t.box)})` });
      continue;
    }
    if (動いたか(t.box, 後)) {
      不能.push({
        文: t.文,
        px: t.px,
        理由: `撮る間に位置が動いた (${位置の字(t.box)} → ${位置の字(後)})`,
      });
      continue;
    }
    const 範囲 = {
      x: t.box.x * 倍率,
      y: t.box.y * 倍率,
      width: t.box.width * 倍率,
      height: t.box.height * 倍率,
    };
    const 芯 = cores(字画, 地画, 範囲);
    if (芯.kind !== "ok") {
      // `invisible` = 隠しても画素が変わらない (地と同じ色になっている / 何かに覆われている)。
      // `unmeasurable` = 範囲が写しの外 / 芯を特定できない。 どちらも「読めることを確かめられて
      // いない」 ので、 黙って除かず落とす側に倒す
      不能.push({
        文: t.文,
        px: t.px,
        理由: `${芯.kind === "invisible" ? "隠しても画素が変わらない" : 芯.reason} (${位置の字(t.box)})`,
      });
      continue;
    }

    let 最悪 = Infinity;
    let 最悪地: [number, number, number] = [0, 0, 0];
    for (const { bg } of 芯.画素) {
      // **文字の色は画素から採らない**。 宣言色を実効の濃さで、 読み取った地に重ねる
      const fg = bg.map((b, k) => t.色[k]! * t.実効 + b * (1 - t.実効)) as [number, number, number];
      const r = contrast(fg, bg);
      if (r < 最悪) { 最悪 = r; 最悪地 = bg; }
    }
    if (!Number.isFinite(最悪)) {
      不能.push({ 文: t.文, px: t.px, 理由: "芯の画素が 0 件" });
      continue;
    }
    out.push({
      文: t.文,
      比: 最悪,
      要: requiredRatio(t.px, t.weight),
      px: t.px,
      地: 最悪地.join(","),
    });
  }
  if (不能.length > 0) {
    await test.info().attach(`${見出し} 薄い文字を隠した写し`, { body: 地の写し, contentType: "image/png" });
    await test.info().attach(`${見出し} 薄い文字を出した写し`, { body: 字の写し, contentType: "image/png" });
  }
  return { 測れた: out, 測れず: 不能 };
}

/**
 * 薄い文字が出る画面。 括弧内は上の帯を除いた実測件数。
 *
 * `/catalog/interactive` の読み取り部品は、 薄い色に `opacity` を重ねていた実例
 * (review 指摘)。 一覧から押して開かないと到達しないので `部品` を指定する。
 *
 * **`/docs` は入れない**。 帯の外に薄い文字を 1 つも持たないため (実測 0 件)、
 * 入れると件数条件を満たせない。
 */
const 画面 = [
  { path: "", 部品: undefined }, // 35 件
  { path: "catalog/presets", 部品: undefined }, // 26 件
  { path: "editor", 部品: undefined }, // 90 件
  { path: "contribute", 部品: undefined }, // 5 件
  { path: "catalog/interactive", 部品: "interactive-dynamic-readouts" }, // 135 件
] as const;


for (const 暗い of [false, true]) {
  const 名 = 暗い ? "暗い" : "明るい";
  test(`${名}画面で薄い文字が地の上で読める`, async ({ page }) => {
    for (const { path, 部品 } of 画面) {
      await 開く(page, path, 暗い, 部品);
      const { 測れた: 件, 測れず } = await 測る(page, `${名}画面 ${画面名(path)}`);
      expect(件.length, `${画面名(path)} で薄い文字を 1 つも測れていない (選択子が実装とずれた)`).toBeGreaterThan(0);
      expect(
        測れず.map((x: 測れず) => `「${x.文}」 ${x.px}px (${x.理由})`),
        `${名}画面 ${画面名(path)} に読めることを確かめられない薄い文字がある`,
      ).toEqual([]);
      for (const { 文, 比, 要, px, 地 } of 件) {
        expect(
          比,
          `${名}画面 ${画面名(path)} の「${文}」 が地に溶ける (${px}px / 地 ${地} / 対比 ${比.toFixed(2)} / 要 ${要})`,
        ).toBeGreaterThanOrEqual(要);
      }
    }
  });
}

test("薄い文字の読みやすさが明暗で揃っている", async ({ page }) => {
  // 本 Issue の中身。 片側だけを直しても落ちないと、 同じ非対称がまた作られる。
  //
  // **地が明暗で違うので色そのものは比べられない**。 地に対する対比で比べる。
  const 代表 = async (暗い: boolean): Promise<number> => {
    await 開く(page, "catalog/presets", 暗い);
    const { 測れた: 件 } = await 測る(page, `${暗い ? "暗い" : "明るい"}画面 catalog/presets`);
    expect(件.length, `${暗い ? "暗い" : "明るい"}側で薄い文字を測れていない`).toBeGreaterThan(0);
    // 面の上に乗るものが多数派なので中央値を採る (端の 1 件に引きずられない)
    const v = 件.map((x: 結果) => x.比).sort((a: number, b: number) => a - b);
    return v[Math.floor(v.length / 2)]!;
  };
  const 明 = await 代表(false);
  const 暗 = await 代表(true);
  expect(
    Math.abs(明 - 暗),
    `薄い文字の読みやすさが明暗で開いている (明 ${明.toFixed(2)} / 暗 ${暗.toFixed(2)})`,
  ).toBeLessThanOrEqual(1.5);
});
