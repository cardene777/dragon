/**
 * Markdown の中の dragon の囲み (```dragon) を、囲みごとに取り出す。
 *
 * 囲みの開き方と閉じ方は CommonMark に従う。` か ~ を 3 つ以上並べて開き、同じ字を開いた数以上
 * 並べて閉じる。閉じていない囲みは文書の終わりまでを中身にする。dragon 以外の言語の囲みの中は読まない。
 */
export interface Fence {
  /** 囲みの中身 (記法) */
  source: string;
  /** 中身の 1 行目が文書の何行目か。記法の誤りの行を文書の行に直す時に足す */
  line: number;
}

export function extractDiagrams(markdown: string): Fence[] {
  const lines = markdown.split(/\r?\n/);
  if (lines[lines.length - 1] === "") lines.pop();
  const fences: Fence[] = [];
  let open: { mark: string; dragon: boolean; start: number; body: string[] } | undefined;
  lines.forEach((text, index) => {
    if (!open) {
      const found = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/.exec(text);
      if (found) open = { mark: found[1] ?? "", dragon: found[2] === "dragon", start: index + 2, body: [] };
      return;
    }
    const close = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(text)?.[1];
    if (close !== undefined && close[0] === open.mark[0] && close.length >= open.mark.length) {
      if (open.dragon) fences.push({ source: open.body.join("\n"), line: open.start });
      open = undefined;
      return;
    }
    open.body.push(text);
  });
  if (open?.dragon) fences.push({ source: open.body.join("\n"), line: open.start });
  return fences;
}
