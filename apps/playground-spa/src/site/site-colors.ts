/**
 * サイトの色の値 (#3033)。
 *
 * サイトの地と面と字と線と差し色を、図の色味の表 (`@cardenelabs/dragon` の `PALETTES`) から色味と明暗で引く。
 * 色の値を写して持たないので、サイトと図はいつも同じ色味になる。
 * 差し色は色味ごとに決めた色相の字の色 (`t-*`) で、釦の上の字は図の色味の表が持つ差し色の上の字 (`on-c`)。
 * `main.tsx` がこの値を html に置き、部品は `--d-*` の変数だけを読む。
 */
import { DEFAULT_PALETTE, PALETTES, resolvePalette, type Theme } from "@cardenelabs/dragon/light";

/** 色味ごとの差し色の色相。紙と墨は朱、澄んだ色と夜の計器と紺と生成り (#3398) は青、アーケードの画面は bitsumi の強調と同じ緑 (#3341) */
const ACCENT_HUE: Readonly<Record<string, string>> = { paper: "rose", clear: "blue", night: "blue", arcade: "green", sea: "blue" };

/** 選んだ色味を残す鍵 */
const STORE = "dragon-site-palette";

/** 色味の差し色。帯の色味の切替の見本にも使う */
export function accentOf(palette: string, theme: Theme): string {
  const values = resolvePalette(palette)[theme];
  return values[`t-${ACCENT_HUE[palette] ?? "blue"}`] ?? values.ink ?? "";
}

/**
 * 書く欄の字の役ごとの色の元 (#3613)。値は図の色味の表の名前。
 * 記法の役は互いに違う色にし、JSON の鍵と字の列と数と真偽は、記法で同じ働きの役と同じ元を使う
 */
const SYNTAX_SOURCES = {
  kind: "t-violet",
  head: "t-blue",
  as: "t-slate",
  arrow: "t-rose",
  key: "t-amber",
  value: "t-green",
  comment: "mute",
  code: "ink2",
  punct: "mute",
  "json-key": "t-violet",
  "json-string": "t-green",
  "json-number": "t-amber",
  "json-literal": "t-rose",
  "json-punct": "mute",
} as const;
/** 互いに違う色にする記法の役 */
const DISTINCT_ROLES = ["kind", "head", "as", "arrow", "key", "value", "comment", "code"] as const;
/** 書く欄の地と字の濃さの比の下限 (WCAG の AA の普通の字) */
const READABLE_CONTRAST = 4.5;

const channels = (hex: string): number[] => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
};
const toHex = (rgb: number[]): string => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const mix = (from: string, to: string, t: number): string => {
  const [a, b] = [channels(from), channels(to)];
  return toHex(a.map((v, i) => v + ((b[i] ?? v) - v) * t));
};
const luminance = (hex: string): number => {
  const [r = 0, g = 0, b = 0] = channels(hex).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string): number => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** 地との濃さの比が下限に届くまで、色を字の色へ寄せる。届いている色はそのまま返す */
function readable(color: string, ground: string, ink: string): string {
  for (let step = 0; step <= 20; step += 1) {
    const next = mix(color, ink, step / 20);
    if (contrast(next, ground) >= READABLE_CONTRAST) return next;
  }
  return ink;
}

/**
 * 書く欄の字の役ごとの色 (#3613)。名前は役、値は色。
 * 色は色味の表の値から引き、書く欄の地 (`sunk`) との濃さの比が 4.5 に届かない時だけ字の色 (`ink`) へ寄せる。
 * 色味によっては 2 つの元が同じ色なので (アーケードの画面の `t-slate` と `mute`)、記法の役で前の役と同じ色になった時は、字の色へ 3 割寄せて分ける
 */
export function syntaxColors(palette: string, theme: Theme): Record<keyof typeof SYNTAX_SOURCES, string> {
  const values = resolvePalette(palette)[theme];
  const ground = values.sunk ?? "";
  const ink = values.ink ?? "";
  const out = {} as Record<keyof typeof SYNTAX_SOURCES, string>;
  for (const [role, source] of Object.entries(SYNTAX_SOURCES) as [keyof typeof SYNTAX_SOURCES, string][]) out[role] = readable(values[source] ?? ink, ground, ink);
  const used = new Set<string>();
  for (const role of DISTINCT_ROLES) {
    let color = out[role];
    for (let tries = 0; tries < 8 && used.has(color); tries += 1) color = readable(mix(color, ink, 0.3), ground, ink);
    out[role] = color;
    used.add(color);
  }
  return out;
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
    ...Object.fromEntries(Object.entries(syntaxColors(palette, theme)).map(([role, color]) => [`--d-syn-${role}`, color])),
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
