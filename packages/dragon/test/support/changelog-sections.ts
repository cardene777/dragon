/**
 * 変更履歴の見出しを読み取る (#2028)。
 *
 * 1 つの版の下に同じ見出しが 2 回以上出ていないか、 見出しが決めた並びの順に出ているかを見る。
 *
 * 探し方をここ 1 箇所に置くのは、本番 (実 file) と植え込み対照 (違反する形を作った文字列) が
 * **同じ探し方を通る** ようにするため。 2 度書くと片方だけ直って、対照が本番を守らなくなる。
 */

/**
 * 種類の見出しの並び。 元にした Keep a Changelog が決めている順に、この repo が使う
 * `Removed (破壊的変更)` を `Removed` の隣へ足したもの。
 *
 * 一覧に無い名前は「見なかった」 に数えて呼出側へ返す。 黙って飛ばすと、知らない名前が
 * いくつ増えても 0 件のまま通る。
 */
export const SECTION_ORDER = [
  "Added",
  "Changed",
  "Deprecated",
  "Removed",
  "Removed (破壊的変更)",
  "Fixed",
  "Security",
] as const;

/** 版の下に出た見出し 1 つ。 */
export interface Section {
  readonly name: string;
  /** 1 始まりの行番号 */
  readonly line: number;
}

/** 版 1 つと、その下に出た見出しの並び。 */
export interface VersionSections {
  /** `## [0.28.0] - 2026-09-16` の `[0.28.0]` の部分 */
  readonly version: string;
  readonly line: number;
  readonly sections: readonly Section[];
}

/** 見出しの形の問題 1 件。 */
export interface SectionProblem {
  readonly version: string;
  readonly line: number;
  readonly kind: "重複" | "並び";
  readonly 説明: string;
}

const VERSION = /^## (\[[^\]]+\])/;
const SECTION = /^### (.+?)\s*$/;
const FENCE = /^\s*(```+|~~~+)/;

/**
 * 版ごとの見出しの並びを返す。
 *
 * 囲み (```` ``` ```` / `~~~`) の中は読まない。 変更履歴は差分や記法の例を囲みで載せるため、
 * 中の `###` を見出しと読むと、書いた例のせいで落ちる。
 */
export function versionSections(text: string): VersionSections[] {
  const versions: { version: string; line: number; sections: Section[] }[] = [];
  let fence: string | null = null;

  text.split("\n").forEach((raw, i) => {
    const line = i + 1;
    const opening = FENCE.exec(raw);
    if (opening !== null) {
      const mark = opening[1] ?? "";
      // 開いた印より短い印では閉じない (囲みの中に短い囲みを書ける)。
      if (fence === null) fence = mark;
      else if (mark[0] === fence[0] && mark.length >= fence.length) fence = null;
      return;
    }
    if (fence !== null) return;

    const v = VERSION.exec(raw);
    if (v !== null) {
      versions.push({ version: v[1] ?? "", line, sections: [] });
      return;
    }

    const s = SECTION.exec(raw);
    // 版の外に出た見出しはどの版にも入らない (前書きの中の見出しを拾わないため)。
    if (s !== null && versions.length > 0) {
      versions[versions.length - 1]?.sections.push({ name: s[1] ?? "", line });
    }
  });

  return versions;
}

/**
 * 見出しの形を見て、問題と走査の内訳を返す。
 *
 * `見なかった` は並びの一覧に無い名前。 並びの判定には使えないので、重複だけを見て
 * 並びからは外し、名前を呼出側へ返す。
 */
export function sectionAudit(text: string): {
  versions: VersionSections[];
  problems: SectionProblem[];
  見た: number;
  見なかった: string[];
} {
  const versions = versionSections(text);
  const problems: SectionProblem[] = [];
  const 見なかった: string[] = [];
  let 見た = 0;

  for (const v of versions) {
    const 出た = new Map<string, number>();
    let 直前 = -1;

    for (const s of v.sections) {
      const 前の行 = 出た.get(s.name);
      if (前の行 !== undefined) {
        problems.push({
          version: v.version,
          line: s.line,
          kind: "重複",
          説明: `${s.name} が ${前の行} 行目に続いて 2 度目に出ている`,
        });
      } else {
        出た.set(s.name, s.line);
      }

      const 位置 = SECTION_ORDER.indexOf(s.name as (typeof SECTION_ORDER)[number]);
      if (位置 < 0) {
        見なかった.push(s.name);
        continue;
      }

      見た += 1;
      if (位置 < 直前) {
        problems.push({
          version: v.version,
          line: s.line,
          kind: "並び",
          説明: `${s.name} が、並びで後ろにある見出しより下に出ている`,
        });
      }
      直前 = Math.max(直前, 位置);
    }
  }

  return { versions, problems, 見た, 見なかった };
}
