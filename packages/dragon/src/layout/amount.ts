/**
 * 量の字の形。パイプ図とシーケンス図の両方が、値の札と2人を結ぶ線の差の札に使う (#3398、#107)。
 *
 * パイプ図は後から読む塊にあり、シーケンス図は最初に読む塊にあるので、両方が読む道具はどちらの図の file にも置かず、ここに置く。
 */
import type { NotationLang } from "../words";

/** 量の字を 3 桁ごとに区切る (#3398)。数でない字はそのまま */
export function grouped(amount: string): string {
  const m = /^(-?)(\d+)(\.\d+)?$/u.exec(amount);
  return m ? `${m[1] ?? ""}${(m[2] ?? "").replace(/\B(?=(\d{3})+(?!\d))/gu, ",")}${m[3] ?? ""}` : amount;
}

const decimalOf = (v: string): { neg: boolean; int: string; frac: string } | undefined => {
  const m = /^(-?)(\d+)(?:\.(\d+))?$/u.exec(v.replace(/,/gu, ""));
  return m ? { neg: m[1] === "-", int: m[2] ?? "0", frac: m[3] ?? "" } : undefined;
};

/** 前の値から今の値への差 (`+20`、`−5.5`)。どちらかが数でないか、差が無い時は持たない */
export function linkDelta(was: string, now: string): string | undefined {
  const a = decimalOf(was);
  const b = decimalOf(now);
  if (!a || !b) return undefined;
  const places = Math.max(a.frac.length, b.frac.length);
  const big = (d: { neg: boolean; int: string; frac: string }): bigint => (d.neg ? -1n : 1n) * BigInt(d.int + d.frac.padEnd(places, "0"));
  const diff = big(b) - big(a);
  if (diff === 0n) return undefined;
  const digits = (diff < 0n ? -diff : diff).toString().padStart(places + 1, "0");
  const whole = places > 0 ? digits.slice(0, -places) : digits;
  const frac = places > 0 ? digits.slice(-places).replace(/0+$/u, "") : "";
  return `${diff < 0n ? "−" : "+"}${grouped(whole)}${frac ? `.${frac}` : ""}`;
}

/** リバートで戻った値の札の語。Tracelythの用語集の語 (リバート) で書く (Tracelyth #111) */
export const UNDONE_TAG: Record<NotationLang, string> = { ja: "リバート", en: "Undone" };
