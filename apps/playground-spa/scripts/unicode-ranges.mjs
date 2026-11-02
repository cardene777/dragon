/** `U+30-39,U+3000-303F,U+30??` の形の範囲の字の番号を、書かれた順に返す */
export function codesOf(list) {
  return list.split(",").flatMap((part) => {
    const [from, to = from] = part.trim().replace(/^U\+/iu, "").split("-");
    const first = Number.parseInt(from.replaceAll("?", "0"), 16);
    const last = Number.parseInt(to.replaceAll("?", "F"), 16);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  });
}

/** 字の番号を、連なりを畳んだ `U+3001-3002,U+3005` の形にする */
export function rangeOf(codes) {
  const spans = [];
  for (const code of [...codes].sort((a, b) => a - b)) {
    const last = spans.at(-1);
    if (last !== undefined && last[1] === code - 1) last[1] = code;
    else spans.push([code, code]);
  }
  return spans.map(([from, to]) => (from === to ? `U+${from.toString(16)}` : `U+${from.toString(16)}-${to.toString(16)}`)).join(",");
}
