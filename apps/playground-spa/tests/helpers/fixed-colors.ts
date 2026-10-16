import type { Page } from "@playwright/test";

/**
 * 宣言の値から **明暗で変わらない固定の色** だけを取り出す。
 *
 * 判定も切り出しもブラウザに任せる。 こちらで数え上げるものを 4 度減らした。
 *
 *   1. 色の名前の一覧 (`tomato` / `rebeccapurple` …) → `CSS.supports` に聞く
 *   2. 色関数の種類 (`rgb` / `hsl` / `lab` / `color()` …) → 同上
 *   3. 色を書ける property の一覧 (`border-left` が漏れた) → 全ての宣言を見る
 *   4. 環境で変わる名前の一覧 (`background` が漏れた) → 明暗を切り替えて動くかで見る
 *
 * 値は **空白で割らない**。 割ると `rgb(255 0 0)` が 3 つに散り、 色として渡らない
 * (review で実測)。 括弧の対応を数えて関数を 1 つの塊のまま取り出す。
 *
 * 残さないもの。
 *
 *   - 色として解決しない語 (`solid` / `1px` / `600` 等)。 `CSS.supports` が弾く
 *     (`style.color` への代入だと `600` が 16 進数として通る、 実測)
 *   - `var()` / `color-mix()` の塊 (明暗で変わる)。 **中には降りない** =
 *     降りると `color-mix(in srgb, red 40%, var(--d-bg))` の `red` を拾う
 *   - `url(...)` の中身 (画像の場所であって色ではない)
 *   - 明暗の設定で値が動く語 (system color 等)。 環境依存なので固定色ではない
 *   - 黒 (影に使う。 明暗に依らないので固定でよい)
 *   - 文脈で決まる語 (`transparent` / `currentColor` / `inherit` 等)
 */
export async function 固定色を取り出す(page: Page, 宣言: string[]): Promise<string[]> {
  if (宣言.length === 0) return [];

  return await page.evaluate((vs) => {
    /**
     * 値を token に割る。 **関数の中にも降りる**。
     *
     * 降りないと `linear-gradient(red, var(--d-bg))` の `red` を見逃す。 降りるので
     * `var()` / `color-mix()` / `url()` だけは名指しで捨て、 中を見ない。
     *
     * 引用符の中は跨がない = `url("a,)b")` の `)` で切ると内側を誤って拾う。
     */
    const 割る = (値: string): string[] => {
      const out: string[] = [];
      let i = 0;
      const 語を足す = (t: string): void => {
        const 語 = t.trim();
        if (語) out.push(語);
      };
      while (i < 値.length) {
        const c = 値[i]!;
        if (/[\s,;]/.test(c)) {
          i++;
          continue;
        }
        if (c === '"' || c === "'") {
          // 文字列は丸ごと飛ばす (色ではない)
          const 閉じ = 値.indexOf(c, i + 1);
          i = 閉じ === -1 ? 値.length : 閉じ + 1;
          continue;
        }
        const m = /^([a-z-]+)\(/i.exec(値.slice(i));
        if (m) {
          // 括弧の対応を数えて関数の範囲を取る。 引用符の中の括弧は数えない
          let 深さ = 0;
          let j = i + m[0].length - 1;
          let 引用: string | null = null;
          for (; j < 値.length; j++) {
            const d = 値[j]!;
            if (引用) {
              if (d === 引用) 引用 = null;
              continue;
            }
            if (d === '"' || d === "'")引用 = d;
            else if (d === "(") 深さ++;
            else if (d === ")") {
              深さ--;
              if (深さ === 0) {
                j++;
                break;
              }
            }
          }
          const 塊 = 値.slice(i, j);
          const 名 = m[1]!.toLowerCase();
          if (名 === "var" || 名 === "url") {
            // 明暗で変わる / 画像の場所。 中には降りない
          } else if (名 === "color-mix") {
            // **中に `var()` があるかで分ける**。 無ければ固定色なので塊のまま拾う
            // (`color-mix(in srgb, red, blue)` は明暗で変わらない)。 あれば明暗で
            // 変わるので捨てる。 どちらの場合も中には降りない = 降りると
            // `color-mix(in srgb, red 40%, var(--d-bg))` の `red` を拾う
            if (!/\bvar\(/i.test(塊)) 語を足す(塊);
          } else if (/^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)$/.test(名)) {
            語を足す(塊); // 色関数そのもの
          } else if (
            // **色を引数に取る関数だけ中を走査する**。 任意の関数に降りると
            // `counter(blue)` / `attr(green)` の名前を色として拾う (review 指摘)。
            /^(linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient|drop-shadow|cross-fade|image-set|light-dark)$/.test(
              名,
            )
          ) {
            割る(塊.slice(m[0].length, -1)).forEach(語を足す);
          }
          i = j;
          continue;
        }
        let j = i;
        while (j < 値.length && !/[\s,;]/.test(値[j]!) && 値[j] !== "(") j++;
        語を足す(値.slice(i, j));
        i = j === i ? i + 1 : j;
      }
      return out;
    };

    /**
     * 色を RGBA に正規化する。
     *
     * **文字列で比べない**。 `lab()` / `oklch()` / `color()` は解決後も関数の形を保つため、
     * `rgb(...)` だけを見ると新しい色空間の固定色を取りこぼす (review で指摘)。
     * Canvas に 1 画素描けば、 どの色空間で書かれていても同じ RGBA になる。
     */
    const cv = document.createElement("canvas");
    cv.width = 1;
    cv.height = 1;
    const ctx = cv.getContext("2d")!;
    const 正規化 = (v: string): [number, number, number] | null => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      const 前 = ctx.fillStyle;
      ctx.fillStyle = v;
      if (ctx.fillStyle === 前 && !/^#0{3,8}$/i.test(v.trim())) {
        // 受理されなければ既定値のまま = 色ではない
        if (!CSS.supports("color", v)) return null;
      }
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0]!, d[1]!, d[2]!];
    };

    /** 明暗 2 通りで解決させ、 値が動く語 (環境依存) を見分ける。 */
    const 測る = (scheme: string, ws: string[]): Record<string, string> => {
      const e = document.createElement("span");
      e.style.colorScheme = scheme;
      document.body.appendChild(e);
      const out: Record<string, string> = {};
      for (const w of ws) {
        e.style.color = "";
        e.style.color = w;
        out[w] = getComputedStyle(e).color;
      }
      e.remove();
      return out;
    };

    const 候補 = [...new Set(vs.flatMap((v) => 割る(v)))]
      .map((w) => w.replace(/%23/g, "#"))
      .filter((w) => !/^(transparent|currentcolor|inherit|initial|unset|revert|none)$/i.test(w))
      .filter((w) => CSS.supports("color", w));

    const 明 = 測る("light", 候補);
    const 暗 = 測る("dark", 候補);

    const out: string[] = [];
    for (const 語 of 候補) {
      if (暗[語] !== 明[語]) continue; // 環境依存なので固定色ではない
      const rgb = 正規化(語);
      if (!rgb) continue;
      if (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0) continue; // 黒は影に使うので許す
      out.push(語);
    }
    return out;
  }, 宣言);
}

