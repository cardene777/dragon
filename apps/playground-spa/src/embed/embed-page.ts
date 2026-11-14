/**
 * 見本帳の埋め込みの頁 (#3700)。
 *
 * 外の頁がiframeで`/embed#z=<縮めた記法>`か`/embed#n=<記法>`を開くと、記法をSDKの`mountDragon`で帯つきの図にする。
 * 帯と再生の部品の言葉は`?lang=ja`か`?lang=en`で決め、無い時は英語にする。iframeの中からは置いた頁の`lang`属性を読めないため。
 * 記法の形はエディタで開くURLと同じで、`#`の後ろは頁を配るサーバーへ送られない。
 *
 * 描けた・描けなかった (`dragon-render`)、段が変わった (`dragon-step`)、エクスポートした (`dragon-export`)、
 * エディタで開いた・コピーした (`dragon-share`) の4つは、`{ source: "dragon", type, detail }`の形で置いた頁へ`postMessage`で送る。
 * 置いた頁の置き場は前もって知れないので宛先は`*`にする。送る中身は描けたかと段の数とエクスポートの形とコピーした物の種類で、
 * 置いた頁が自分でURLに詰めた記法の外の値を持たない。
 * 記法が無いか描けない時は、頁に誤りの文を出して`dragon-render`の`ok: false`を送る。
 */
import { mountDragon } from "@cardenelabs/dragon/embed";

import { fromPackedHash } from "../share";
import "./embed.css";

/** 置いた頁へ送る知らせ */
const EVENTS = ["dragon-render", "dragon-step", "dragon-export", "dragon-share"] as const;

/** 記法の無いURLで出す文 */
const NO_NOTATION = {
  ja: "記法がありません。URLの#の後ろに記法を詰めて開いてください。",
  en: "No notation. Open this page with the notation after # in the URL.",
} as const;

/** 誤りの文を頁に出す */
function showError(root: HTMLElement, message: string): void {
  const note = document.createElement("pre");
  note.dataset.embed = "error";
  note.setAttribute("role", "alert");
  note.textContent = message;
  root.replaceChildren(note);
}

/** 埋め込みの頁を`root`に置く */
export async function openEmbed(root: HTMLElement): Promise<void> {
  const asked = new URLSearchParams(location.search).get("lang");
  const lang = asked === "ja" || asked === "en" ? asked : undefined;
  const html = document.documentElement;
  html.dataset.embed = "";
  if (lang) html.lang = lang;
  else html.removeAttribute("lang");

  // iframeで開いた時だけ置いた頁へ送る。直に開いた頁は送る先を持たない
  const relay = (event: Event): void => {
    if (window.parent === window) return;
    window.parent.postMessage({ source: "dragon", type: event.type, detail: (event as CustomEvent<unknown>).detail }, "*");
  };
  for (const type of EVENTS) root.addEventListener(type, relay);

  const source = await fromPackedHash(location.hash);
  if (source === undefined || source.trim() === "") {
    const message = NO_NOTATION[lang ?? "en"];
    showError(root, message);
    root.dispatchEvent(new CustomEvent("dragon-render", { detail: { ok: false, errors: [message] } }));
    return;
  }
  try {
    mountDragon(root, source, { lang });
  } catch (error) {
    // 描けなかった知らせは mountDragon が送った
    showError(root, error instanceof Error ? error.message : String(error));
  }
}
