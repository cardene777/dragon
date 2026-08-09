import { test, expect, type Page } from "@playwright/test";

/**
 * editor の preview 操作が **図の `<svg>`** を対象にすることを固定する (#985)。
 *
 * `CdlDiagramView` の DOM は panel が stage より先に来る (cdl `render.tsx` = panel →
 * `CdlStage`)。 interactive panel は widget ごとに `<svg>` を持つので、 「preview 内の最初の
 * `<svg>`」 で取ると widget を掴む。 Fit も実寸換算も 120px 角の widget を基準にしてしまう。
 *
 * dragon の text DSL と parts は今のところ readout を持たないため、 **user 操作でこの状態には
 * 到達できない** (`compile.ts` の `part.readouts` 経路は実装済で、 readout を持つ part が入った
 * 時点で到達する)。 実在する DOM の形を再現するために、 test 側で widget 相当の `<svg>` を
 * preview の先頭に差し込む。
 *
 * 差し込む値は実測に合わせる。 `/catalog/interactive` の `interactive-ab-test` は widget が
 * `viewBox="0 0 120 120"` で、 stage は `"-35 59 1521 279"` (縦横比が 10 倍以上違う)。
 */

const WIDGET_VIEWBOX = "0 0 120 120";

async function setup(page: Page): Promise<void> {
  await page.goto("/editor", { waitUntil: "networkidle" });
  await page.waitForSelector(".v4-editor-stage svg[data-cdl-stage]", { timeout: 15000 });
  await page.waitForTimeout(600);
}

/** panel の widget 相当の `<svg>` を preview の先頭に置く。 置いた後に stage より前にあることを確かめる。 */
async function insertWidgetSvg(page: Page): Promise<void> {
  const ok = await page.evaluate((vb) => {
    const preview = document.querySelector(".v4-editor-stage");
    if (!preview) return "preview が無い";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", vb);
    svg.setAttribute("width", "120");
    svg.setAttribute("height", "120");
    svg.setAttribute("data-test-widget", "");
    // widget にしか無い font-size を 1 つ置く。 文字倍率が widget を対象にすると、 この値の
    // CSS 規則が生成される = call site 別の取り違えを見分けられる。
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("font-size", "7777");
    t.textContent = "w";
    svg.appendChild(t);
    preview.insertBefore(svg, preview.firstChild);
    // 差し込んだものが「最初の svg」 になっていないと、 この test は何も確かめていない。
    return preview.querySelector("svg") === svg ? "" : "先頭に入っていない";
  }, WIDGET_VIEWBOX);
  expect(ok, "widget 相当の svg を差し込めていない").toBe("");
}

const stageBoxBy = (page: Page, sel: string) =>
  page.evaluate((selector) => {
    const preview = document.querySelector(".v4-editor-stage");
    const stage = preview?.querySelector<SVGSVGElement>(`svg${selector}`);
    if (!preview || !stage) return null;
    const p = preview.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const vb = stage.viewBox.baseVal;
    const k = vb && vb.width > 0 ? s.width / vb.width : -1;
    // 図の中で最も小さい文字の、 画面上の大きさ。 図を基準にフィットしたかを見る材料
    const px = [...stage.querySelectorAll("text")]
      .filter((t) => (t.textContent ?? "").trim().length > 0)
      // 画面に出ていない文字は測らない (実装が数えないものと揃える、 #1084)
      .filter((t) => {
        const r = t.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })
      .map((t) => Number.parseFloat(getComputedStyle(t).fontSize) * k)
      .filter((v) => Number.isFinite(v) && v > 0);
    return {
      pw: p.width,
      ph: p.height,
      sw: s.width,
      sh: s.height,
      // 画面上の倍率 = 実 px 幅 / 図の枠の幅。 widget (120 角) を基準にすると桁で外れる
      k,
      最小文字: px.length > 0 ? Math.min(...px) : -1,
    };
  }, sel);

const stageBox = (page: Page) => stageBoxBy(page, "[data-cdl-stage]");

test.describe("editor の preview 操作が図の svg を対象にする (#985)", () => {
  test("widget の svg が先頭にあってもフィットが図に合う", async ({ page }) => {
    await setup(page);
    await insertWidgetSvg(page);

    await page.click('[data-testid="editor-fit"]');
    await page.waitForTimeout(500);

    const box = await stageBox(page);
    expect(box, "stage の svg が取れない").not.toBeNull();

    // フィットが図を基準にしていることを **画面上の文字の大きさ** で見る (#1084 で書き換え)。
    //
    // 変更前は「図が preview に収まる」 で見ていた。 読める下限を入れた結果、 正しく図を基準に
    // していても横にはみ出すようになった (既定の見本 = 50% で 886px / 枠 595px) ため、 収まりを
    // 条件にすると正しい状態を落とす。
    //
    // 収めた後の倍率は「枠に収まる倍率」 と「文字が下限になる倍率」 の大きい方で決まる。
    // 既定の見本 (1772×1032、 最小文字 20) では後者が決め手になり、 最小文字は下限に張り付く。
    // widget (120 角) を基準にすると図の縦で決まってしまい 14.3px になる (実測)。
    //
    // `#1102` で下限は 1 つではなくなった = 箱が枠から出る図は 8px まで譲る。 この検査の枠は
    // 595px と狭く、 既定の見本は譲る側に落ちて 8px になる (実測、 倍率 0.400)。 判別に使うのは
    // 「下限に張り付いているか」 なので、 見る値を 8px に直せば #985 の意図はそのまま残る。
    expect(box!.最小文字, "図の文字を測れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(
      box!.最小文字,
      `文字が読める下限に張り付いていない: ${box!.最小文字}px (倍率 ${box!.k})`,
    ).toBeGreaterThanOrEqual(8);
    expect(
      box!.最小文字,
      `図より大きいものを基準にした疑い: 文字 ${box!.最小文字}px (倍率 ${box!.k})`,
    ).toBeLessThan(9);
    // 倍率だけでは「図が 1px しか無い」 形が通るので、 実寸の下限も置く。
    expect(box!.sw, "図が preview に対して小さすぎる").toBeGreaterThan(box!.pw * 0.3);
  });

  test("widget の svg が先頭にあってもリセットが図に合う", async ({ page }) => {
    await setup(page);
    await insertWidgetSvg(page);

    await page.click('[data-testid="editor-reset"]');
    await page.waitForTimeout(500);

    const box = await stageBox(page);
    expect(box).not.toBeNull();
    // フィットと同じ理由で、 幅の収まりではなく画面上の文字の大きさで見る (#1084)。
    // 下限が 8px なのはフィット側と同じ理由 (#1102、 この検査の枠 595px では譲る側に落ちる)
    expect(box!.最小文字, "図の文字を測れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(box!.最小文字, `文字が読める下限に張り付いていない: ${box!.最小文字}px`).toBeGreaterThanOrEqual(8);
    expect(box!.最小文字, `図より大きいものを基準にした疑い: ${box!.最小文字}px`).toBeLessThan(9);
    expect(box!.sw).toBeGreaterThan(0);
  });

  test("widget の svg が先頭にあっても文字倍率が図に当たる", async ({ page }) => {
    await setup(page);
    await insertWidgetSvg(page);

    await page.click('[data-testid="editor-font-scale-up"]');
    await page.waitForTimeout(500);

    // 倍率は「渡された svg の中に現れる font-size 値」 ごとの CSS 規則として書き出される
    // (`lib/diagram-scale.ts` の `applyFontScale`)。 widget を渡すと font-size を持つ子が
    // 無いので規則が 1 本も出ない。
    const css = await page.evaluate(() =>
      document.getElementById("cdl-editor-font-scale")?.textContent ?? "");
    expect(css, "倍率の規則が 1 本も出ていない = 図ではないものを渡している").toContain("font-size");
    expect(css.split("\n").length, "規則の本数が少なすぎる").toBeGreaterThan(1);
    // widget にしか無い値。 出ていたら widget を対象にしている。
    expect(css, "widget の font-size が対象になっている").not.toContain("7777");
  });

  test("widget の svg が先頭にあっても図の拡大が図に当たる", async ({ page }) => {
    // 実寸の焼き込み (`applySvgPixelSize`) を通る経路。 フィットとは別の call site。
    await setup(page);
    await insertWidgetSvg(page);

    const before = await page.evaluate(() => ({
      stage: document.querySelector(".v4-editor-stage svg[data-cdl-stage]")?.getAttribute("style") ?? "",
      widget: document.querySelector(".v4-editor-stage svg[data-test-widget]")?.getAttribute("style") ?? "",
    }));

    await page.click('[data-testid="editor-diagram-scale-up"]');
    await page.waitForTimeout(1200);

    const after = await page.evaluate(() => ({
      stage: document.querySelector(".v4-editor-stage svg[data-cdl-stage]")?.getAttribute("style") ?? "",
      widget: document.querySelector(".v4-editor-stage svg[data-test-widget]")?.getAttribute("style") ?? "",
    }));

    expect(after.stage, "図に実寸が焼き込まれていない").not.toBe(before.stage);
    expect(after.stage, "図に実寸が焼き込まれていない").toContain("width:");
    expect(after.widget, "widget に実寸が焼き込まれている").toBe(before.widget);
  });

  test("widget の svg が先頭にあっても 100% が図を中央に置く", async ({ page }) => {
    // `handle100` は viewBox の実寸で中央寄せを計算する。 widget (120 角) を使うと寄せ先が
    // 大きくずれる。 既定の状態から動かしてから押す (既定が偶然一致して通る形を避ける)。
    await setup(page);
    await insertWidgetSvg(page);

    await page.click('[data-testid="editor-fit"]');
    await page.waitForTimeout(300);
    for (let i = 0; i < 3; i++) await page.click('button[aria-label="拡大"], button:has-text("＋")').catch(() => {});
    await page.waitForTimeout(300);

    await page.click('[data-testid="editor-actual-size"]');
    await page.waitForTimeout(500);

    const r = await page.evaluate(() => {
      const preview = document.querySelector(".v4-editor-stage");
      const stage = preview?.querySelector("svg[data-cdl-stage]");
      const widget = preview?.querySelector("svg[data-test-widget]");
      if (!preview || !stage || !widget) return null;
      const p = preview.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const vb = (stage as SVGSVGElement).viewBox.baseVal;
      const wvb = (widget as SVGSVGElement).viewBox.baseVal;
      // 中央寄せの誤差 = 図の中心が preview の中心からどれだけ離れているか。
      return {
        offCenter: Math.abs((s.left + s.width / 2) - (p.left + p.width / 2)),
        pw: p.width, vbw: vb.width, wvbw: wvb.width,
      };
    });
    expect(r, "図の svg が取れない").not.toBeNull();
    // widget の viewBox (120) と図の viewBox が違うことを先に固定する。 同じなら判定が成立しない。
    expect(r!.wvbw, "widget の viewBox が 120 でない").toBe(120);
    expect(Math.abs(r!.vbw - r!.wvbw), "図と widget の viewBox が近すぎて判別できない").toBeGreaterThan(200);
    // 図の viewBox で寄せたなら中心が合う。 widget の 120 で寄せると (pw - 120) / 2 だけずれる。
    const wrongOffset = Math.abs((r!.pw - r!.vbw) / 2 - (r!.pw - r!.wvbw) / 2);
    expect(r!.offCenter, `中央からのずれ ${r!.offCenter} が widget 基準のずれ ${wrongOffset} に近い`)
      .toBeLessThan(wrongOffset / 2);
  });

  test("widget の svg が先頭にあっても書き出しが図を出す", async ({ page }) => {
    // `getPreviewSvg` の経路。 書き出した中身に図の node が入っていることを見る。
    await setup(page);
    await insertWidgetSvg(page);

    const svgText = await page.evaluate(async () => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => /SVG/.test(b.textContent ?? ""));
      if (!btn) return "SVG の button が無い";
      // download を起こさずに中身だけ見たいので、 Blob を横取りする。
      let captured = "";
      const orig = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (this: void, blob: Blob): string {
        void blob.text().then((t) => { captured = t; });
        return orig(blob);
      };
      btn.click();
      await new Promise((r) => setTimeout(r, 800));
      URL.createObjectURL = orig;
      return captured;
    });

    expect(svgText.length, "書き出しの中身が取れない").toBeGreaterThan(200);
    expect(svgText, "図の node が入っていない = widget を書き出している").toContain("data-cdl-node");
    expect(svgText, "widget を書き出している").not.toContain("data-test-widget");
  });

  test("目印が無い時は「最初の svg」 に戻らない", async ({ page }) => {
    // 戻すと #985 の状態に戻り、 しかも黙って戻るので気付けない。 何もしない方を選ぶ。
    await setup(page);
    await insertWidgetSvg(page);

    const removed = await page.evaluate(() => {
      const stage = document.querySelector(".v4-editor-stage svg[data-cdl-stage]");
      if (!stage) return false;
      stage.setAttribute("data-test-was-stage", "");
      stage.removeAttribute("data-cdl-stage");
      return true;
    });
    expect(removed, "目印を外せていない").toBe(true);

    const before = await stageBoxBy(page, "[data-test-was-stage]");
    await page.click('[data-testid="editor-fit"]');
    await page.click('[data-testid="editor-font-scale-up"]');
    await page.waitForTimeout(500);

    const css = await page.evaluate(() =>
      document.getElementById("cdl-editor-font-scale")?.textContent ?? "");
    expect(css, "目印が無いのに倍率が当たっている = 別の svg に戻っている").toBe("");

    const after = await stageBoxBy(page, "[data-test-was-stage]");
    expect(after, "図の svg が消えている").not.toBeNull();
    expect(Math.round(after!.sw), "目印が無いのにフィットが効いている").toBe(Math.round(before!.sw));
  });

  /**
   * 重ねたパーツが図枠の実寸で描かれることを固定する (#937)。
   *
   * 大きさは `CdlEditor` が `--cdl-svg-w/h` に入れる。 入れないと `editor.css` の既定値
   * (800x600) に落ち、 縦横比の違うパーツが `preserveAspectRatio` で縮む。 助変数を消しても
   * 単体 test は通ってしまうため (helper の返値と CSS 文字列しか見ていない)、 画面で確かめる。
   */
  test("重ねたパーツは図枠の実寸で描かれる", async ({ page }) => {
    await setup(page);
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForTimeout(300);
    await page.click('[data-part-id="parts-horizontal-bar"]');
    await page.waitForTimeout(1200);

    const got = await page.evaluate(() => {
      const host = document.querySelector("[data-overlay-part]");
      if (!host) return null;
      const wrap = host.querySelector(".v4-editor-svg-wrap svg[data-cdl-stage]")
        ?? host.querySelector("svg[data-cdl-stage]");
      if (!wrap) return null;
      const vb = (wrap.getAttribute("viewBox") ?? "").split(/\s+/).map(Number);
      const r = wrap.getBoundingClientRect();
      const style = getComputedStyle(host);
      return {
        vbW: vb[2] ?? 0,
        vbH: vb[3] ?? 0,
        w: r.width,
        h: r.height,
        // 画面に渡した値そのもの。 縦横比だけを見ると、 縦横を同じ率で間違えた時に通ってしまう
        varW: parseFloat(style.getPropertyValue("--cdl-svg-w")),
        varH: parseFloat(style.getPropertyValue("--cdl-svg-h")),
      };
    });
    expect(got, "重ねたパーツの svg が無い").not.toBeNull();
    expect(got!.vbW, "図枠の幅が取れていない").toBeGreaterThan(0);

    // 渡した値が図枠と同じ数字であること。 2 倍にする間違いはここで落ちる
    expect(got!.varW, `渡した幅が図枠と違う (渡した ${got!.varW} / 図枠 ${got!.vbW})`).toBeCloseTo(got!.vbW, 1);
    expect(got!.varH, `渡した高さが図枠と違う (渡した ${got!.varH} / 図枠 ${got!.vbH})`).toBeCloseTo(got!.vbH, 1);

    // 渡した値が実際に svg に効いていること (画面全体の倍率が掛かるので縦横比で見る)
    const drawn = got!.w / got!.h;
    const frame = got!.vbW / got!.vbH;
    expect(Math.abs(drawn - frame), `縦横比が図枠と違う (描画 ${drawn} / 図枠 ${frame})`).toBeLessThan(0.05);

    // 既定値に落ちていないこと。 落ちると縦横比は 800/600 に張り付く
    expect(Math.abs(drawn - 800 / 600), "800x600 の既定値で描かれている").toBeGreaterThan(0.05);
  });

  /**
   * `大きさ:` を書いたパーツが、実際に描かれる中身まで伸びることを固定する (#1018)。
   *
   * SVG は図枠を `preserveAspectRatio="xMidYMid meet"` で収めるため、縦横で違う比の枠を
   * 渡しても中身は縦横同じ率でしか伸びない (実測 = 枠を 2625 にしても中身は 716 のままだった)。
   * 伸縮は `transform` で縦横別に掛けている。
   *
   * 単体 test は助変数の値しか見ないため、`transform` を外す変更でも通る。 画面で測る。
   */
  test("大きさを書いたパーツは中身まで伸びる", async ({ page }) => {
    const withSize = `title: "t"
type: flow

actors:
  - Web: service
  - a:
      kind: achievement
      位置: 2000,700
      大きさ: 2000,300

flow:
  - Web -> Web: "x"
`;
    const plain = withSize.replace("      大きさ: 2000,300\n", "");

    /** 重ねたパーツの中の箱を、画面上の幅で測る。 */
    const measure = async (src: string): Promise<number> => {
      const encoded = await page.evaluate((s) => btoa(unescape(encodeURIComponent(s))), src);
      await page.goto(`/editor#s=${encoded}`);
      await page.waitForSelector('[data-testid="editor-preview-stage"]');
      await page.waitForTimeout(1800);
      return await page.evaluate(() => {
        const svg = document.querySelector("[data-overlay-part] svg[data-cdl-stage]");
        const nodes = Array.from(svg?.querySelectorAll("[data-cdl-node]") ?? []).map((n) =>
          n.getBoundingClientRect(),
        );
        if (nodes.length === 0) return 0;
        return Math.max(...nodes.map((r) => r.x + r.width)) - Math.min(...nodes.map((r) => r.x));
      });
    };

    await setup(page);
    // 見本の一覧を読ませてから測る (開かないと catalog が来ない)
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForSelector('[data-part-id="parts-achievement"]', { timeout: 15000 });

    const plainW = await measure(plain);
    expect(plainW, "大きさを書かないパーツの箱が測れていない").toBeGreaterThan(0);
    const sizedW = await measure(withSize);
    expect(sizedW, "大きさを書いたパーツの箱が測れていない").toBeGreaterThan(0);

    // 縦列の幅 400 に対して 2000 なので 5 倍。 画面全体の拡大率は同じ本文で揃うため、
    // 比がそのまま出る。 `transform` を外すと 1 倍前後に落ちる
    expect(sizedW / plainW, `伸びていない (${sizedW} / ${plainW})`).toBeGreaterThan(3);
  });

  /**
   * 縦に並べて書いた `scale:` が、実際に描かれる中身まで掛かることを固定する (#1020)。
   *
   * 読み取りの単体 test は助変数の値しか見ないため、読めていても `transform` に載せない
   * 変更で通ってしまう。 描いた結果を画面で測る。
   */
  test("縦に並べて書いた倍率は中身まで掛かる", async ({ page }) => {
    const withScale = `title: "t"
type: flow

actors:
  - Web: service
  - a:
      kind: achievement
      位置: 2000,700
      scale: 3

flow:
  - Web -> Web: "x"
`;
    const plain = withScale.replace("      scale: 3\n", "");

    /** 重ねたパーツの中の箱を、画面上の幅で測る。 */
    const measure = async (src: string): Promise<number> => {
      const encoded = await page.evaluate((s) => btoa(unescape(encodeURIComponent(s))), src);
      await page.goto(`/editor#s=${encoded}`);
      await page.waitForSelector('[data-testid="editor-preview-stage"]');
      await page.waitForTimeout(1800);
      return await page.evaluate(() => {
        const svg = document.querySelector("[data-overlay-part] svg[data-cdl-stage]");
        const nodes = Array.from(svg?.querySelectorAll("[data-cdl-node]") ?? []).map((n) =>
          n.getBoundingClientRect(),
        );
        if (nodes.length === 0) return 0;
        return Math.max(...nodes.map((r) => r.x + r.width)) - Math.min(...nodes.map((r) => r.x));
      });
    };

    await setup(page);
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForSelector('[data-part-id="parts-achievement"]', { timeout: 15000 });

    const plainW = await measure(plain);
    expect(plainW, "倍率を書かないパーツの箱が測れていない").toBeGreaterThan(0);
    const scaledW = await measure(withScale);
    expect(scaledW, "倍率を書いたパーツの箱が測れていない").toBeGreaterThan(0);

    // 3 倍で書いたので比がそのまま出る。 読めていても描画に載せなければ 1 倍前後に落ちる
    expect(scaledW / plainW, `掛かっていない (${scaledW} / ${plainW})`).toBeGreaterThan(2);
  });

  /**
   * 名前の行に値を書いた見本の続きの行が、画面でも効くことを固定する (#1028)。
   *
   * 続きの行を読まないと本文にそのまま残り、組み立て側だけが位置と大きさを読む。
   * 単体 test は読んだ値しか見ないため、描いた結果を画面で測る。
   */
  test("名前の行に値を書いた見本でも続きの行が効く", async ({ page }) => {
    const withCont = `title: "t"
type: flow

actors:
  - Web: service
  - a: achievement
      位置: 2000,700
      倍率: 3

flow:
  - Web -> Web: "x"
`;
    const plain = withCont.replace("      倍率: 3\n", "");

    const measure = async (src: string): Promise<number> => {
      const encoded = await page.evaluate((s) => btoa(unescape(encodeURIComponent(s))), src);
      await page.goto(`/editor#s=${encoded}`);
      await page.waitForSelector('[data-testid="editor-preview-stage"]');
      await page.waitForTimeout(1800);
      return await page.evaluate(() => {
        const svg = document.querySelector("[data-overlay-part] svg[data-cdl-stage]");
        const nodes = Array.from(svg?.querySelectorAll("[data-cdl-node]") ?? []).map((n) =>
          n.getBoundingClientRect(),
        );
        if (nodes.length === 0) return 0;
        return Math.max(...nodes.map((r) => r.x + r.width)) - Math.min(...nodes.map((r) => r.x));
      });
    };

    await setup(page);
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForSelector('[data-part-id="parts-achievement"]', { timeout: 15000 });

    const plainW = await measure(plain);
    expect(plainW, "倍率を書かない見本の箱が測れていない").toBeGreaterThan(0);
    const scaledW = await measure(withCont);
    expect(scaledW, "倍率を書いた見本の箱が測れていない").toBeGreaterThan(0);

    // 続きの行を読まなければ 1 倍前後に落ちる
    expect(scaledW / plainW, `続きの行が効いていない (${scaledW} / ${plainW})`).toBeGreaterThan(2);
  });

  /**
   * 実体が操作パネルの部品だけの見本を置いた時に知らせが出ることを固定する (#1017)。
   *
   * この見本 (catalog 80 件中 17 件) は図の中に描く部品を持たない。 場所は確保されるため
   * 「置いたのに見えない」 状態になり、黙って置くと綴りを疑うことになる。
   */
  test("パネル部品だけの見本を置くと知らせが出る", async ({ page }) => {
    await setup(page);
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForSelector('[data-part-id="parts-percent-ring"]', { timeout: 15000 });
    await page.waitForTimeout(300);

    await page.click('[data-part-id="parts-percent-ring"]');
    await page.waitForTimeout(1500);
    const shown = await page.evaluate(
      () => document.querySelector('[data-testid="editor-compile-notices"]')?.textContent ?? "",
    );
    expect(shown, "知らせが出ていない").toContain("図の中に描く部品を持たない");
  });

  test("図として描く見本では知らせが出ない", async ({ page }) => {
    await setup(page);
    await page.click('[data-testid="editor-parts-tab"]');
    await page.waitForSelector('[data-part-id="parts-achievement"]', { timeout: 15000 });
    await page.waitForTimeout(300);

    await page.click('[data-part-id="parts-achievement"]');
    await page.waitForTimeout(1500);
    const shown = await page.evaluate(
      () => document.querySelector('[data-testid="editor-compile-notices"]')?.textContent ?? "",
    );
    expect(shown, "図として描く見本にまで知らせが出ている").not.toContain(
      "図の中に描く部品を持たない",
    );
  });

  /**
   * 共有 URL で開いた本文の見本が、一覧を開かなくても見本として復元されることを固定する (#1022)。
   *
   * 見本の一覧は 80 件あるため開いた時に読む形で遅延させている。 本文の側から読み込みを
   * 起こさないと、中身が無いまま組み立てられて別名がそのまま箱になる
   * (実測 = `achievement` を置いた本文が `ach` という名前の箱になった)。
   */
  test("共有 URL の見本は一覧を開かなくても復元される", async ({ page }) => {
    const src = [
      'title: "t"',
      "type: flow",
      "",
      "actors:",
      "  - Web: service",
      "  - ach:",
      "      kind: achievement",
      "      v: 50",
      "",
      "flow:",
      '  - Web -> Web: "x"',
      "",
    ].join("\n");
    const encoded = Buffer.from(src, "utf8").toString("base64");
    await page.goto(`/editor#s=${encoded}`);
    await page.waitForSelector('[data-testid="editor-preview-stage"]');
    await page.waitForTimeout(2500);

    const overlay = await page.evaluate(
      () => document.querySelectorAll("[data-overlay-part]").length,
    );
    expect(overlay, "見本として重ねられていない").toBeGreaterThan(0);
  });

  test("見本を使わない本文では一覧を読み込まない", async ({ page }) => {
    // 読み込むと、見本を使わない本文でも 80 件の取得を待つことになる
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));

    const src = [
      'title: "t"',
      "type: flow",
      "",
      "actors:",
      "  - Web: service",
      "  - DB: database",
      "",
      "flow:",
      '  - Web -> DB: "x"',
      "",
    ].join("\n");
    const encoded = Buffer.from(src, "utf8").toString("base64");
    await page.goto(`/editor#s=${encoded}`);
    await page.waitForSelector('[data-testid="editor-preview-stage"]');
    await page.waitForTimeout(2500);

    const loaded = requests.filter((u) => u.includes("parts.cdl"));
    expect(loaded.length, `見本一覧を読み込んでいる (${loaded[0] ?? ""})`).toBe(0);
  });

  /**
   * 見本の読み込みに失敗した時、要求が輪にならないことを固定する (#1022)。
   *
   * 本文起点の読み込みは既定の tab (samples) で走る。 失敗時の解除をその tab で行っていた頃は、
   * 失敗 → 解除 → 再発火 の輪になり、本文を触らなくても要求が出続けていた。
   */
  test("見本の読み込みに失敗しても要求が繰り返されない", async ({ page }) => {
    // 要求数では数えられない。 取得に失敗した module は再取得されないため、
    // 輪になっていても要求は 1 回で止まる。 失敗のたびに出る記録を数える
    const attempts: string[] = [];
    page.on("console", (m) => {
      if (m.text().includes("parts load failed")) attempts.push(m.text());
    });
    await page.route("**/parts.cdl*", (route) => route.abort());

    const src = [
      'title: "t"',
      "type: flow",
      "",
      "actors:",
      "  - Web: service",
      "  - ach:",
      "      kind: achievement",
      "",
      "flow:",
      '  - Web -> Web: "x"',
      "",
    ].join("\n");
    const encoded = Buffer.from(src, "utf8").toString("base64");
    await page.goto(`/editor#s=${encoded}`);
    await page.waitForSelector('[data-testid="editor-preview-stage"]');
    await page.waitForTimeout(4000);

    expect(attempts.length, `読み込みが繰り返されている (${attempts.length} 回)`).toBeLessThanOrEqual(2);
  });

  /**
   * YAML 欄に直接書いた見本でも読み込みが起きることを固定する (#1022)。
   *
   * YAML は登場人物を `{ name, kind }` の形で書くため、本文欄と文法が違う。 本文欄の走査を
   * 当てると次の行の種類を読み飛ばし、`kind:` を書いても読み込みが起きない。
   */
  test("YAML 欄に書いた見本でも一覧を読み込む", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));

    await setup(page);
    await page.click('[data-testid="editor-tab-yaml"]');
    await page.waitForTimeout(600);
    // ここまでで読み込まれていないことを確かめてから書く
    expect(
      requests.filter((u) => u.includes("parts.cdl")).length,
      "書く前に読み込まれている",
    ).toBe(0);

    await page.locator('[data-testid="editor-code-body-yaml"] .cm-content').click();
    await page.keyboard.press("Meta+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.insertText(
      [
        "title: t",
        "type: flow",
        "actors:",
        "  - name: Web",
        "    kind: service",
        "  - name: ach",
        "    kind: achievement",
        "flow:",
        "  - from: Web",
        "    to: Web",
        "    label: x",
        "",
      ].join("\n"),
    );
    await page.waitForTimeout(2500);

    expect(
      requests.filter((u) => u.includes("parts.cdl")).length,
      "YAML 欄に書いた見本で読み込みが起きていない",
    ).toBeGreaterThan(0);
  });
});
