/**
 * サイトの色の値 (#3033)。
 *
 * サイトの地と面と字と線と差し色を、図の色味の表 (`@cardenelabs/dragon` の `PALETTES`) から色味と明暗で引く。
 * 色の値を写して持たないので、サイトと図はいつも同じ色味になる。
 * 差し色は色味ごとに決めた色相の字の色 (`t-*`) で、釦の上の字は図の色味の表が持つ差し色の上の字 (`on-c`)。
 * `main.tsx` がこの値を html に置き、部品は `--d-*` の変数だけを読む。
 */
import { DEFAULT_PALETTE, PALETTES, resolvePalette, type Theme } from "@cardenelabs/dragon/light";

/** 色味ごとの差し色の色相。紙と墨は朱、澄んだ色と夜の計器は青 */
const ACCENT_HUE: Readonly<Record<string, string>> = { paper: "rose", clear: "blue", night: "blue" };

/** 選んだ色味を残す鍵 */
const STORE = "dragon-site-palette";

/** 色味の差し色。帯の色味の切替の見本にも使う */
export function accentOf(palette: string, theme: Theme): string {
  const values = resolvePalette(palette)[theme];
  return values[`t-${ACCENT_HUE[palette] ?? "blue"}`] ?? values.ink ?? "";
}

/** 色味と明暗のサイトの値。名前は `site.css` などの部品が読む `--d-*` の変数 */
export function siteColors(palette: string, theme: Theme): Record<string, string> {
  const values = resolvePalette(palette)[theme];
  const v = (name: string): string => values[name] ?? "";
  return {
    "--d-bg": v("page"),
    "--d-surface": v("surf"),
    "--d-surface-2": v("bg"),
    "--d-surface-3": v("sunk"),
    "--d-border": v("hair"),
    "--d-border-strong": v("line"),
    "--d-text-primary": v("ink"),
    "--d-text-secondary": v("ink2"),
    "--d-text-muted": v("mute"),
    "--d-accent": accentOf(palette, theme),
    "--d-on-accent": v("on-c"),
    "--d-code-bg": v("sunk"),
    "--d-err": v("t-rose"),
    "--d-ok": v("t-green"),
    "--d-warn": v("t-amber"),
  };
}

/** html にサイトの値と明暗を置く。描く前に呼び、最初の 1 回だけ違う色で描かれるのを避ける */
export function paintSite(palette: string, theme: Theme): void {
  const root = document.documentElement;
  root.dataset.scheme = theme;
  root.style.colorScheme = theme;
  for (const [name, value] of Object.entries(siteColors(palette, theme))) root.style.setProperty(name, value);
}

/** 前に選んだ色味。残っていないか、表に無い名前なら紙と墨 */
export function storedPalette(): string {
  try {
    const id = localStorage.getItem(STORE);
    return id !== null && Object.hasOwn(PALETTES, id) ? id : DEFAULT_PALETTE;
  } catch {
    // 保存を止めた browser では、選んだ色味を残さない
    return DEFAULT_PALETTE;
  }
}

/** 選んだ色味を残す。残せない browser では今の頁の間だけ効く */
export function storePalette(palette: string): void {
  try {
    localStorage.setItem(STORE, palette);
  } catch {
    // 残せなくても、今の頁の色味は替わる
  }
}
