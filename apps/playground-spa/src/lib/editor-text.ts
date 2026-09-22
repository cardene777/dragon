import type { Locale } from "./i18n";
import type { 二言語 } from "./bilingual";

/**
 * 編集画面に出る字の 2 言語表 (#2454)。
 *
 * 画面 file の中に `{locale === "ja" ? "…" : "…"}` を 70 か所以上置くと、字を直す時に
 * 画面の組み立てを読み進めることになる。 字だけをここに集めて、画面は鍵で引く。
 *
 * **記法に書き込む字はここに置かない**。 `位置:` や `色:` のような記法の語は、画面の言語が
 * 変わっても変えてはいけない (変えると書き戻した記法が読めなくなる)。 ここに在るのは
 * 人が読む字だけで、記法の語は画面 file 側が直に持つ。
 *
 * **分類の呼び名もここに置かない**。 出どころは `CATEGORIES` 1 つ (#1788) で、
 * 画面は `categoryLabel(c, locale)` で引く。
 */


const 表 = {
  // 上の帯
  新規ファイル: { ja: "新規ファイル", en: "New file" },
  共有の呼び名: { ja: "共有URL", en: "Share URL" },
  共有の説明: {
    ja: "この図を開ける URL を作って写す",
    en: "Make a URL that opens this diagram, and copy it",
  },
  書き出すの呼び名: { ja: "書き出す", en: "Export" },
  書き出すの説明: {
    ja: "画像として書き出す (SVG / PNG)",
    en: "Export as an image (SVG / PNG)",
  },
  動くSVG: { ja: "動く SVG", en: "Animated SVG" },
  動くSVGの説明: {
    ja: "単一ファイルで動く / GitHub README / Notion",
    en: "Runs from one file / GitHub README / Notion",
  },
  静止SVG: { ja: "静止 SVG", en: "Still SVG" },
  静止SVGの説明: {
    ja: "今の段の静止 1 こま / Keynote / PDF",
    en: "One still frame of the current phase / Keynote / PDF",
  },
  PNGの説明: {
    ja: "点で描く 2 倍の密度 / Slack / Twitter",
    en: "Drawn in dots at twice the density / Slack / Twitter",
  },
  実況表示: { ja: "実況表示", en: "Live view" },

  // 左の棚
  見本のタブ: { ja: "見本", en: "Samples" },
  記法のタブ: { ja: "記法", en: "Notation" },
  検索の欄: { ja: "🔍 検索…", en: "🔍 Search…" },
  一覧を閉じる: { ja: "一覧を閉じる", en: "Close the list" },
  最初の読み込み待ち: {
    ja: "最初の読み込みを待っています…",
    en: "Waiting for the first load…",
  },
  読み込み中: { ja: "読み込み中...", en: "Loading..." },
  本文欄でのみ使える: {
    ja: "本文欄 (CDL) でのみ使えます",
    en: "Only usable in the CDL pane",
  },
  部品として使う見本: {
    ja: "操作盤の部品として使う見本です",
    en: "A sample used as a part of the control panel",
  },
  名前の基準: {
    ja: "actors: に書いた名前を基準にする",
    en: "Uses the names written under actors:",
  },
  押すと1行足す: {
    ja: "押すと actors: に 1 行追加します。 位置は自動で決まるので、 変えたい時は記法に posX / posY を書きます。",
    en: "Adds one line under actors:. The place is decided for you, so write posX / posY in the notation to move it.",
  },

  // 書きかけの確認と写し
  書きかけが消える: {
    ja: "書きかけの内容が消えます。 続けますか？",
    en: "Your unsaved work will be lost. Continue?",
  },
  写した: { ja: "URL をコピーしました", en: "Copied the URL" },
  写せなかった: { ja: "コピーに失敗しました", en: "Could not copy it" },
  手で写してほしい: {
    ja: "共有 URL をコピーしてください:",
    en: "Copy the share URL yourself:",
  },

  // 位置関係の知らせ
  位置が崩れている: { ja: "位置の関係が崩れている", en: "The placement is off" },
  直せる注意なし: {
    ja: "自動で直せる注意はありません",
    en: "None of these can be fixed for you",
  },
  直せるものなし: { ja: "直せるものなし", en: "Nothing to fix" },

  // 図の操作
  文字を小さく: { ja: "文字を小さく", en: "Smaller text" },
  文字を小さくの説明: {
    ja: "図の中の文字を一律で小さくする",
    en: "Make all the text in the diagram smaller",
  },
  文字を大きく: { ja: "文字を大きく", en: "Larger text" },
  文字を大きくの説明: {
    ja: "図の中の文字を一律で大きくする",
    en: "Make all the text in the diagram larger",
  },
  図を縮小: { ja: "図を縮小", en: "Shrink the diagram" },
  図を縮小の説明: {
    ja: "図そのものを縮める (表示倍率ではなく記法に書き戻す)",
    en: "Shrink the diagram itself (written back to the notation, not the zoom)",
  },
  図を拡大: { ja: "図を拡大", en: "Grow the diagram" },
  図を拡大の説明: {
    ja: "図そのものを広げる (表示倍率ではなく記法に書き戻す)",
    en: "Grow the diagram itself (written back to the notation, not the zoom)",
  },
  位置を表示: { ja: "位置を表示", en: "Show the places" },
  位置を表示の説明: {
    ja: "各要素が今どこに居るかを図に重ねて出す",
    en: "Lay where each element sits over the diagram",
  },
  方眼を表示: { ja: "方眼を表示", en: "Show the grid" },
  方眼を表示の説明: {
    ja: "舞台に点の方眼を出す (掴んで動かす時の目安)",
    en: "Put a dotted grid on the stage as a guide while dragging",
  },
  枠に合わせる: { ja: "枠に合わせる", en: "Fit the frame" },
  枠に合わせるの説明: {
    ja: "図が枠に収まるように表示を合わせる",
    en: "Fit the view so the diagram sits inside the frame",
  },
  表示を戻す: { ja: "表示を戻す", en: "Reset the view" },
  表示を戻すの説明: {
    ja: "表示を最初の状態に戻す (Esc)",
    en: "Put the view back where it started (Esc)",
  },
  等倍表示: { ja: "等倍表示", en: "Actual size" },
  等倍表示の説明: { ja: "等倍で表示する", en: "Show it at actual size" },
  縮小: { ja: "縮小", en: "Zoom out" },
  縮小の説明: { ja: "表示を縮小する", en: "Zoom the view out" },
  拡大: { ja: "拡大", en: "Zoom in" },
  拡大の説明: { ja: "表示を拡大する", en: "Zoom the view in" },
  無し: { ja: "無し", en: "None" },

  // 記法の一覧 (SyntaxReference)
  押すと末尾に足す: {
    ja: "押すと入力欄の末尾に足す",
    en: "Adds it to the end of the pane",
  },
  別名なし: { ja: "別名なし", en: "No other name" },
  図種: { ja: "図種", en: "Diagram types" },
  箱の種類: { ja: "箱の種類", en: "Box kinds" },
  起点から描ける図種: { ja: "起点から描ける図種", en: "Types that draw from a start point" },
  色: { ja: "色", en: "Colours" },
  向き: { ja: "向き", en: "Directions" },
} as const satisfies Record<string, 二言語>;

export type 編集画面の字の鍵 = keyof typeof 表;

const 覚えた = new Map<Locale, Record<編集画面の字の鍵, string>>();

/**
 * その言語の字をまとめて引く。
 *
 * 画面は `字.新規ファイル` の形で読む。 鍵を打ち間違えると `tsc` が落ちる
 * (表に無い鍵は型に出ない)。
 */
export function 編集画面の字(locale: Locale): Record<編集画面の字の鍵, string> {
  const 覚え = 覚えた.get(locale);
  if (覚え !== undefined) return 覚え;
  const 組 = Object.fromEntries(
    Object.entries(表).map(([鍵, 値]) => [鍵, 値[locale]]),
  ) as Record<編集画面の字の鍵, string>;
  覚えた.set(locale, 組);
  return 組;
}

/**
 * 値を差し込む知らせ。 語順が日本語と英語で違うので、文ごとに関数で持つ。
 *
 * 差し込む値 (件数 / 名前 / 記法の語) は関数の引数で受け、ここでは組み立てだけを行う。
 *
 * **英語の文に記法の語 (`位置:` 等) を入れない** (#2454)。 入れると、字を判定する検査から
 * 「日本語の文に英語が残っている」 と読まれる = 英語の文か日本語の文かを、字だけでは
 * 見分けられない。 記法の語そのものは本文の欄に出るので、知らせでは繰り返さない。
 */
export const 編集画面の文 = {
  中身が置き換わる: (見本: string, locale: Locale): string =>
    locale === "ja"
      ? `編集中の内容が「${見本}」 に置き換わります。 元に戻すには Cmd+Z で undo 可能。\n\n続けますか？`
      : `What you are editing will be replaced with "${見本}". Cmd+Z undoes it.\n\nContinue?`,
  見本を読み込めない: (部品: string, locale: Locale): string =>
    locale === "ja"
      ? `見本を読み込めませんでした。 ${部品}の一覧を開き直すと再試行します。`
      : `Could not load the samples. Open the ${部品} list again to retry.`,
  編集できる見本が無い: (分類: string, slug: string, 既定: string, locale: Locale): string =>
    locale === "ja"
      ? `${分類}「${slug}」 に対応する編集できる見本は未登録です。 既定の見本 (${既定}) で開きます。`
      : `No editable sample is registered for the ${分類} "${slug}". Opening the default sample (${既定}) instead.`,
  名札の位置を書き戻した: (件数: number, locale: Locale): string =>
    locale === "ja"
      ? `${件数} 件の線の名札の位置を記法に書き戻しました。`
      : `Wrote ${件数} line-label places back into the notation.`,
  一部を書き戻せなかった: (件数: number, 失敗: number, locale: Locale): string =>
    locale === "ja"
      ? `${件数} 件を記法に書き戻しました。 ${失敗} 件は本文の該当行が見つからず書き戻せていません (記法を書き換えた直後は再描画を待ってから押してください)。`
      : `Wrote ${件数} of them back into the notation. ${失敗} could not be written because the matching line was not found (wait for the redraw after editing the notation, then press again).`,
  読み取りを読み込めない: (理由: string, locale: Locale): string =>
    locale === "ja"
      ? `YAML の読み取りを読み込めませんでした。 頁を開き直してください (${理由})`
      : `Could not load the YAML reader. Open the page again (${理由})`,
  印はあるがJSONが壊れている: (印: string, locale: Locale): string =>
    locale === "ja"
      ? `${印} の印はあるが JSON が壊れています。 印を消して記法に戻すか、 JSON を直してください。`
      : `The ${印} marker is there but the JSON is broken. Remove the marker to go back to the notation, or fix the JSON.`,
  図の外の値は色にできない: (道: string, locale: Locale): string =>
    locale === "ja"
      ? `図の外を指す値 (${道}) は色として使えないため外しました。`
      : `A value pointing outside the diagram (${道}) cannot be a colour, so it was left out.`,
  描く部品を持たない: (id: string, 種別: string, locale: Locale): string =>
    locale === "ja"
      ? `"${id}" (${種別}) は図の中に描く部品を持たないため、置いても図には出ません。`
      : `"${id}" (${種別}) has nothing to draw, so placing it will not show anything.`,
  行が見つからない: (名前: string, locale: Locale): string =>
    locale === "ja"
      ? `"${名前}" の行が本文に見つかりませんでした。`
      : `Could not find the line for "${名前}".`,
  位置を書いた: (名前: string, x: number, y: number, locale: Locale): string =>
    locale === "ja"
      ? `"${名前}" に 位置: ${x},${y} を書きました。`
      : `Wrote the place ${x},${y} on "${名前}".`,
  位置を書く: (名前: string, x: number, y: number, locale: Locale): string =>
    locale === "ja"
      ? `"${名前}" に 位置: ${x},${y} を書く`
      : `Write the place ${x},${y} on "${名前}"`,
  一致する部品が無い: (部品: string, locale: Locale): string =>
    locale === "ja"
      ? `検索条件に一致する${部品}がありません。`
      : `No ${部品} matches the search.`,
  名前を足した: (別名: string, 種別: string, locale: Locale): string =>
    locale === "ja"
      ? `actors: に "${別名}" (${種別}) を追加しました。`
      : `Added "${別名}" (${種別}) under actors:.`,
  部品を図として読み込んだ: (題: string, locale: Locale): string =>
    locale === "ja"
      ? `部品「${題}」 を新しい図として読み込みました。`
      : `Loaded the part "${題}" as a new diagram.`,
  読み込み中の件数: (件数: number, locale: Locale): string =>
    locale === "ja" ? `読み込み中… (${件数} 件)` : `Loading… (${件数})`,
  他に何件: (件数: number, locale: Locale): string =>
    locale === "ja" ? `…他 ${件数} 件` : `…and ${件数} more`,
  見本と部品の一覧: (部品: string, locale: Locale): string =>
    locale === "ja" ? `見本と${部品}の一覧` : `Samples and ${部品}`,
  見本と部品の一覧を出す: (部品: string, locale: Locale): string =>
    locale === "ja" ? `見本と${部品}の一覧を出す` : `Show samples and ${部品}`,
  位置関係の警告: (件数: number, locale: Locale): string =>
    locale === "ja" ? `位置関係の警告 ${件数}件` : `${件数} placement warnings`,
  名札の位置を調整できる: (直せる: number, locale: Locale): string =>
    locale === "ja"
      ? `記法の labelOffsetX / labelOffsetY で箱との位置を調整できます (自動で直せるもの ${直せる} 件)`
      : `labelOffsetX / labelOffsetY in the notation move a label against its box (${直せる} of these can be fixed for you)`,
  まとめて書き戻す: (直せる: number, locale: Locale): string =>
    locale === "ja"
      ? `${直せる} 件の名札の位置を記法にまとめて書き戻す`
      : `Write all ${直せる} label places back into the notation`,
  一括反映: (直せる: number, locale: Locale): string =>
    locale === "ja" ? `一括反映 (${直せる}) ✨` : `Fix all (${直せる}) ✨`,
};
