/**
 * 携帯の幅で、図の中の文字が読める大きさに届いているかを測る (#2268)。
 *
 * ## 枠組みは携帯に対応しているのに、図の中身だけ読めない
 *
 * 横にはみ出す画面は 0 件で (`mobile-overflow.spec.ts` が 375 / 390px を通す)、`width=device-width`
 * も分岐点も在る。 それでも幅 390px でひな形の詳細を開くと **箱の名前が 2.0px** になり、
 * 拡大するまで 1 文字も読めない。
 *
 * ## 測る経路が 1 つも無かった
 *
 * 記法の側 (`@cardenelabs/dragon`) は `responsive-viewport` という軸で 12px の下限を見ているが、
 * **判定に使う器が 1150×630px と 874px に固定されている** (`src/lib/diagram-zoom.ts` の表が SSOT)。
 * 携帯の幅で評価する経路がどこにも無いため、いくら直しても次に図の形が変わった日に戻る。
 *
 * 見た目の直し方より先に、ここで測る側を置く。
 *
 * ## 実寸は画面への変換行列から取る
 *
 * 指定の大きさ (`font-size`) は図の中の座標なので、そのままでは画面に何 px で出るか判らない。
 * `getScreenCTM()` は図の座標から画面までの変換をまとめて返すので、その拡大率を掛ければ
 * 実寸になる。 `viewBox` の比を手で割る形だと `preserveAspectRatio` の縮みと、拡大や移動の
 * 操作で掛かる変換を取りこぼす。
 *
 * ## 母集団は走査で作り、受け入れた側は手で書く
 *
 * 経路は `main.tsx` の `<Route>` から読み、`:欄` は見本と分類の一覧で全件に広げる。 手で並べると
 * 画面や見本が増えた時に黙って対象から外れる。 逆に `宣言` は手で書く = 実際の集合から作ると
 * 何を書いても通る検査になる (`packages/dragon/test/support/responsive-accepted.ts` と同じ向き)。
 *
 * 実行 = `pnpm --filter dragon-playground-spa exec playwright test phone-diagram-legibility`
 */
import { test, expect } from "@playwright/test";

import { 画面の経路, 経路を広げる, 値を入れる節 } from "./app-routes";
import { CATEGORIES } from "../src/lib/catalog";
import { PRESETS } from "../src/lib/presets";

/** 携帯の幅と高さ。 iPhone 14 の値 */
const 携帯の幅 = 390;
const 携帯の高さ = 844;

/**
 * 画面の上でこれを下回ると読めない (px)。
 *
 * `src/lib/readable-scale.ts` の `READABLE_RELAXED_PX` と同じ値を **書き写す**。 import すると
 * 実装側の値を変えた時に期待値も一緒に動いて何も落ちなくなる (`readable-floor.ts` と同じ判断)。
 *
 * 好ましい下限 (10px) ではなく譲れる下限を使うのは、携帯の幅では器が狭く、10px にすると
 * どの図も箱が枠から出るため = 実装側も同じ時に 8px へ譲る。
 */
const 下限 = 8;

/**
 * 経路の `:欄` に入れる値。 図は見本ごとに中身が違うので、**全件に広げる**。
 *
 * 1 件だけ入れる形 (`screen-smoke.spec.ts` がそうしている) は「画面が開くか」 を見るには足りるが、
 * ここは図ごとの文字の大きさを測るので、見本を 1 つ選ぶと残りが黙って対象から外れる。
 */
const 欄の値: Record<string, readonly string[]> = {
  ":slug": CATEGORIES.map((c) => c.slug),
  ":id": PRESETS.map((p) => p.slug),
  ":filename": ["diagram.yaml"],
};

/** 開発時にしか繋がらない経路と、当たらなかった時の受け皿。 開いて測る対象ではない */
const 開かない経路 = new Set(["/__render", "*"]);

const 対象の経路 = 画面の経路().filter((p) => !開かない経路.has(p));

/**
 * 開いただけで図が出る経路。 **母集団ではなく期待値**。
 *
 * カタログの図は札を押して開くため、開いただけでは 1 枚も出ない (実測 = 11 分類とも 0 件)。
 * 「図が 0 件」 を「該当なし」 と読むと、画面が壊れて図が出なくなった時に素通りする。
 * どの経路で図が出るはずかを書いておき、実測の集合と突き合わせる。
 *
 * `/editor/:filename` は走査で作った母集団が拾った。 横はみ出しを見る `mobile-overflow.spec.ts` は
 * 経路を手で並べており、この 1 件を 1 度も見ていない (#2270 で直す)。
 */
const 図を出す経路 = new Set(["/", "/editor", "/editor/:filename", "/preset/:id"]);

/**
 * いま下限に届かない画面と、その理由。 **経路の形ではなく、実際に開く path で持つ** (#2269)。
 *
 * 形で持つと `/preset/:id` の 19 件が 1 行に丸まり、1 件だけ残った時に「全部まだ駄目」 と
 * 同じ見た目になる。 path で持てば、直った分だけ行が減る。
 *
 * **理由と行き先を必ず書く**。 書かずに並べると「なぜ許しているか」 が次に読む人に伝わらず、
 * 直ったかどうかも判らないまま残る。
 *
 * 宣言した画面は、下限に届かない図がまだ残っていることを確かめる = 直ったら落ちるので、
 * 直した PR がこの行を外すまで気付ける。
 */
const 宣言: ReadonlyMap<string, string> = new Map([
  [
    "",
    "トップの図 4 枚は札の中の見本で、読ませる面ではない (枠は 299x102 - 299x198px)。" +
      " 下限まで拡げると札からはみ出し、押して分類へ移る導線が壊れる。" +
      " 読む先はカタログとひな形の詳細で、札はそこへの入口。 直す対象にしない",
  ],
]);

/**
 * 落ちた時に出す画面の名前。
 *
 * 経路は base 相対で書くため、トップだけ空文字になる。 そのまま出すと名前に穴が空く (#1438)。
 */
const 画面名 = (path: string): string => path || "トップ";

/** 1 枚の図の測定結果 */
interface 図の実寸 {
  /** 画面の上での最小の文字 (px) */
  最小: number;
  /** その文字の中身。 落ちた時にどこを直すか判るように持つ */
  最小の字: string;
  /** 数えた文字の数 */
  文字数: number;
}

/** いま開いている画面の図を全枚数測る */
async function 測る(page: import("@playwright/test").Page): Promise<図の実寸[]> {
  return page.evaluate(() => {
    const 図たち: { 最小: number; 最小の字: string; 文字数: number }[] = [];
    for (const svg of document.querySelectorAll("svg")) {
      let 最小 = Number.POSITIVE_INFINITY;
      let 最小の字 = "";
      let 文字数 = 0;
      for (const t of svg.querySelectorAll("text")) {
        const 字 = (t.textContent ?? "").trim();
        // 中身の無い `<text>` は位置合わせのために置かれた節点。 数えると実在しない
        // 「読めない文字」 で判定が動く
        if (字 === "") continue;
        const cs = getComputedStyle(t);
        if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") {
          continue;
        }
        if (Number.parseFloat(cs.opacity) === 0) continue;
        const ctm = t.getScreenCTM?.();
        if (!ctm) continue;
        // 回転や傾きが混ざっても面積の比から 1 つの拡大率を出せる (行列式の平方根)
        const 拡大率 = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c));
        const 指定 = Number.parseFloat(cs.fontSize);
        if (!Number.isFinite(指定) || 指定 <= 0) continue;
        if (!Number.isFinite(拡大率) || 拡大率 <= 0) continue;
        文字数++;
        const 実寸 = 指定 * 拡大率;
        if (実寸 < 最小) {
          最小 = 実寸;
          最小の字 = 字.slice(0, 16);
        }
      }
      if (文字数 === 0) continue;
      図たち.push({ 最小, 最小の字, 文字数 });
    }
    return 図たち;
  });
}

/** 測り直す回数と間隔。 工程表は 2.1 秒で静止し、1 周は 7 秒 (#2279 の実測) */
const 測り直す回数 = 4;
const 測り直す間隔 = 700;

/**
 * 静止した姿へ寄せる (#2279)。
 *
 * **描き出しの動きは文字を 0 倍から 1 倍へ動かす**。 工程表の帯の中の名前は入れ子の拡大率が
 * 0.19 → 0.46 → 0.74 → 1.0 と動き、途中を測ると 8.5px、静止すると 10.0px になる。
 * 1 回だけ測ると当たった時刻で判定が決まるので、測り直して **図ごとに最大を残す**。
 *
 * 最大を取るのは動きが上りだから。 下りの動き (だんだん小さくなって消える) を持つ図では
 * 静止した姿ではなく最も大きい瞬間を拾うが、それは「読める大きさに届く瞬間がある」 ことを
 * 意味するので、読めないと判定する向きには倒れない。
 *
 * 枚数が測るたびに変わる図がある (漏斗図は文字が 4 件から 11 件に増える)。
 * 並び順で突き合わせ、片方にしか無い位置はそのまま残す。
 */
function 良い方を残す(前: 図の実寸[], 次: 図の実寸[]): 図の実寸[] {
  const 長さ = Math.max(前.length, 次.length);
  const 結果: 図の実寸[] = [];
  for (let i = 0; i < 長さ; i++) {
    const a = 前[i];
    const b = 次[i];
    if (a === undefined) {
      結果.push(b!);
    } else if (b === undefined) {
      結果.push(a);
    } else {
      結果.push(a.最小 >= b.最小 ? a : b);
    }
  }
  return 結果;
}

test("経路と見本を実装から読めている (空振り検知)", () => {
  expect(対象の経路.length, "main.tsx から経路を 1 つも読めていない").toBeGreaterThan(0);
  expect(PRESETS.length, "見本の一覧が空").toBeGreaterThan(0);
  expect(CATEGORIES.length, "分類の一覧が空").toBeGreaterThan(0);

  expect(
    値を入れる節(対象の経路).sort(),
    "経路に出る欄と、入れる値の表がずれている (表を直す)",
  ).toEqual(Object.keys(欄の値).sort());

  for (const 経路 of 図を出す経路) {
    expect([...対象の経路], `図が出るはずの経路が router に無い: ${経路}`).toContain(経路);
  }
  // 宣言は開く path で持つので、図が出る経路を広げた集合と突き合わせる = 綴りを間違えた行が
  // 「直った」 側に化けて黙って消えるのを止める
  const 図が出る画面 = new Set([...図を出す経路].flatMap((p) => 経路を広げる(p, 欄の値)));
  for (const [path, 理由] of 宣言) {
    expect(
      [...図が出る画面],
      `図を出さない画面を宣言しても意味が無い: ${画面名(path)}`,
    ).toContain(path);
    expect(理由.trim().length, `宣言の理由が空: ${画面名(path)}`).toBeGreaterThan(0);
  }
});

for (const 経路 of 対象の経路) {
  const 開く先 = 経路を広げる(経路, 欄の値);

  test(`幅 ${携帯の幅}px の ${経路} の図の文字が読める大きさに届く`, async ({ page }, info) => {
    // 見本の 19 件のように 1 つの経路が多くの画面に広がる。 1 画面あたり 2 秒を見込む
    info.setTimeout(30_000 + 開く先.length * 8_000);
    await page.setViewportSize({ width: 携帯の幅, height: 携帯の高さ });

    let 図の数 = 0;
    let 文字の数 = 0;
    let 全体の最小 = Number.POSITIVE_INFINITY;
    /** 下限を割った画面。 宣言していない画面のぶんだけを持つ */
    const 割った: string[] = [];
    /** 宣言したのに下限を割らなくなった画面。 宣言が古いので外す */
    const 直った: string[] = [];

    for (const path of 開く先) {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      let 図たち = await 測る(page);
      // **割った時だけ測り直す** = 全 40 画面で毎回 4 回測ると検査が 2 分伸びる。
      // 届いている画面は 1 回で判る (最大を取るので、測り直しても下がらない)
      if (図たち.some((図) => 図.最小 < 下限)) {
        for (let i = 0; i < 測り直す回数; i++) {
          await page.waitForTimeout(測り直す間隔);
          図たち = 良い方を残す(図たち, await 測る(page));
        }
      }
      const この画面の割れ: string[] = [];
      for (const 図 of 図たち) {
        図の数++;
        文字の数 += 図.文字数;
        全体の最小 = Math.min(全体の最小, 図.最小);
        if (図.最小 < 下限) {
          この画面の割れ.push(`${画面名(path)} ${図.最小.toFixed(1)}px "${図.最小の字}"`);
        }
      }
      const 理由 = 宣言.get(path);
      if (理由 === undefined) {
        割った.push(...この画面の割れ);
        continue;
      }
      // 宣言した画面は「まだ割っていること」 を確かめる。 図が 1 枚も出なくなった画面は
      // 下の 図の数 の判定が受け持つので、ここでは割れの有無だけを見る
      if (この画面の割れ.length === 0 && 図たち.length > 0) {
        直った.push(`${画面名(path)} — 宣言の理由: ${理由}`);
      }
    }

    // 走査した母数と実測した最小をそのまま残す。 0 件が「該当なし」 か「測っていない」 かを
    // 読み手が分けられるようにする
    const 母数 = `画面 ${開く先.length} 件 / 図 ${図の数} 枚 / 文字 ${文字の数} 件 / 最小 ${
      Number.isFinite(全体の最小) ? `${全体の最小.toFixed(1)}px` : "測れず"
    }`;
    await info.attach(`母数 ${経路}`, { body: 母数, contentType: "text/plain" });

    expect(
      図の数 > 0,
      図の数 > 0
        ? `図が出ないはずの経路で図が出た (${経路} を 図を出す経路 に足す): ${母数}`
        : `図が出るはずの経路で 1 枚も拾えていない (${経路}): ${母数}`,
    ).toBe(図を出す経路.has(経路));

    expect(
      直った,
      `宣言が古い。 下限 ${下限}px を割らなくなったので 宣言 から外す (${母数})\n${直った.join("\n")}`,
    ).toEqual([]);
    expect(
      割った,
      `${経路} の図の文字が下限 ${下限}px を割っている (${母数})\n${割った.join("\n")}`,
    ).toEqual([]);
  });
}

test("小さすぎる文字はちゃんと拾える (植え込み対照)", async ({ page }) => {
  // 上の判定は「割った図が 0 件」 を期待する側を持つ。 正しい画面を見ているだけでは、
  // 拾い方が実物と噛み合っているかが判らない。 わざと小さい文字を 1 つ置いて確かめる
  await page.setViewportSize({ width: 携帯の幅, height: 携帯の高さ });
  await page.goto("editor", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const 植える前 = await 測る(page);
  expect(植える前.length, "編集画面に図が出ていない (植え込みの土台が無い)").toBeGreaterThan(0);
  expect(
    植える前.filter((x) => x.最小 < 下限),
    "植える前から下限を割っている (対照にならない)",
  ).toEqual([]);

  await page.evaluate(() => {
    const svg = document.querySelector("svg");
    if (!svg) throw new Error("図が無い");
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", "0");
    t.setAttribute("y", "0");
    t.style.fontSize = "0.5px";
    t.textContent = "植えた字";
    svg.append(t);
  });

  const 植えた後 = await 測る(page);
  expect(
    植えた後.filter((x) => x.最小 < 下限).map((x) => x.最小の字),
    "小さい文字を置いても拾えない (測り方が実物と噛み合っていない)",
  ).toContain("植えた字");
});
