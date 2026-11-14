/**
 * `idea` のブロックの読み方 (#3619)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 無い親と、2 つ目の真ん中の題と、題から数えて 4 段目の考えは、書いた行で止め、真ん中の題が無い図は記法の終わりに止める。
 */
import { attrs, name, quote } from "../../print-kit";
import { fail, ID, isOneOf, readAttrs, readQuoted, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { type Color, COLORS } from "../definition-values";
import type { MindIdea } from "./block";
import { MIND_LEVELS, OF } from "./limits";

/** `idea` の行の名札 */
const IDEA = /^idea\s+([^\s[]+)/du;
/** 名前の後ろの `of <親>`。名前は最後の `of` の前まで */
const NAMED_PARENT = new RegExp(`^(.*\\S)\\s+${OF}\\s+([^\\s[]+)\\s*$`, "du");
/** 名札の直ぐ後ろの `of <親>` */
const BARE_PARENT = new RegExp(`^${OF}\\s+([^\\s[]+)`, "du");
/** 語の `of` を含む名前。書き戻す時に `"` で囲む */
const HAS_OF = new RegExp(`(^|\\s)${OF}(\\s|$)`, "u");

export interface IdeaMessages {
  ideaShape: string;
  /** 親に書いた名札 (`id`) の考えを、まだ書いていない */
  noParentIdea: (id: string) => string;
  /** 真ん中の題 (`of` の無い考え) を、`centre` のほかにもう 1 つ書いた */
  twoCentres: (id: string, centre: string) => string;
  /** 真ん中の題を 1 つも書いていない */
  noCentre: string;
  /** 題から数えて `levels` 段より深い考え (`id`) を書いた */
  tooDeep: (id: string, levels: number) => string;
}

/** 考えの名前の書き戻し。名札と同じなら書かず、語の `of` を含む名前は `"` で囲む */
const shownName = (id: string, text: string): string => (text === id ? "" : ` as ${HAS_OF.test(text) ? quote(text) : name(text)}`);

/** `idea <名札> as <名前> of <親> [color: <色>]` の行。`as <名前>` と `of <親>` と色は省ける */
function readIdea(source: SourceLine, state: ParseState): MindIdea {
  const { m } = state;
  const { levels } = state.figure.mind;
  const text = source.text;
  const found = IDEA.exec(text);
  const id = found?.[1];
  if (!found || id === undefined) throw fail(source, 0, m.ideaShape);
  const idAt = found.indices?.[1]?.[0] ?? 0;
  if (!ID.test(id)) throw fail(source, idAt, m.badId(id));
  let rest = skipSpaces(text, found[0].length);
  let named: string | undefined;
  let parent: { id: string; at: number } | undefined;
  if (text.startsWith("as", rest) && /^(\s|$)/u.test(text.slice(rest + 2, rest + 3))) {
    const start = skipSpaces(text, rest + 2);
    if (text[start] === '"') {
      const quoted = readQuoted(source, start, m);
      named = quoted.value;
      rest = skipSpaces(text, quoted.end);
    } else {
      const open = text.indexOf("[", start);
      const end = open < 0 ? text.length : open;
      const body = text.slice(start, end);
      const split = NAMED_PARENT.exec(body);
      if (split) {
        named = split[1] ?? "";
        parent = { id: split[2] ?? "", at: start + (split.indices?.[2]?.[0] ?? 0) };
      } else named = body.trim();
      rest = end;
    }
    if (named === "") throw fail(source, rest, m.emptyName(id));
  }
  if (parent === undefined) {
    const bare = BARE_PARENT.exec(text.slice(rest));
    if (bare) {
      parent = { id: bare[1] ?? "", at: rest + (bare.indices?.[1]?.[0] ?? 0) };
      rest = skipSpaces(text, rest + bare[0].length);
    }
  }
  if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.ideaShape);
  // 色はほかの後から読む読み方と同じく色の一覧で確かめる。本体の箱の読み方 (`readLook`) を読むと、1行の入口で色を読む処理が本体から分かれる (#3657)
  const color = rest < text.length ? readAttrs(source, rest, state.attrs.idea ?? [], m).get("color") : undefined;
  if (color && !isOneOf(COLORS, color.value)) throw fail(source, color.at, m.badColor);
  state.declare(source, id, idAt);
  if (parent === undefined) {
    const centre = state.figure.mind.centre;
    if (centre !== undefined) throw fail(source, 0, m.twoCentres(id, centre));
    state.figure.mind.centre = id;
    levels.set(id, 0);
  } else {
    const above = levels.get(parent.id);
    if (above === undefined) throw fail(source, parent.at, m.noParentIdea(parent.id));
    if (above + 1 >= MIND_LEVELS) throw fail(source, 0, m.tooDeep(id, MIND_LEVELS));
    levels.set(id, above + 1);
  }
  return {
    type: "idea",
    id,
    name: named ?? id,
    ...(parent !== undefined ? { parent: parent.id } : {}),
    ...(color ? { color: color.value as Color } : {}),
  };
}

export const reading: BlockReading<IdeaMessages> = {
  finish: (state, head) => {
    if (state.figure.mind.centre === undefined) throw fail(head, 0, state.m.noCentre);
  },
  read: {
    idea: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readIdea(source, state));
    },
  },
  print: {
    events: {
      idea: (e) => `idea ${e.id}${shownName(e.id, e.name)}${e.parent !== undefined ? ` ${OF} ${e.parent}` : ""}${attrs([["color", e.color]])}`,
    },
  },
  messages: {
    ja: {
      ideaShape: "idea は idea <名札> as <名前> of <親> [color: <色>] の形で書く",
      noParentIdea: (id) => `${id} という考えはまだ書いていない。親は前に idea の行で書いた名札にする`,
      twoCentres: (id, centre) => `${id} は 2 つ目の真ん中の題になる。of の無い idea は ${centre} の 1 つだけにし、${id} には of <親> を書く`,
      noCentre: "of の無い idea の行で、真ん中の題を 1 つ書く",
      tooDeep: (id, levels) => `${id} は真ん中の題から数えて ${levels + 1} 段目になる。考えは題、枝、葉の ${levels} 段まで書ける`,
    },
    en: {
      ideaShape: "Write an idea as idea <id> as <name> of <parent> [color: <color>]",
      noParentIdea: (id) => `No idea named ${id} has been written yet. A parent must be an id written earlier with an idea line`,
      twoCentres: (id, centre) => `${id} would be a second centre. Only ${centre} may be an idea without of; give ${id} an of <parent>`,
      noCentre: "Write one centre with an idea line that has no of",
      tooDeep: (id, levels) => `${id} would be level ${levels + 1} counted from the centre. Ideas go ${levels} levels deep: the centre, branches and leaves`,
    },
  },
};
