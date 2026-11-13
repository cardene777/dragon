/**
 * 記法の字から動く図を置く部品 (#3032)。
 *
 * 記法を読み、再生の部品 (`mountDiagram`) で描く。頁の側では SVG を組まない。
 * 記法か言葉か色味か明暗が替わると、前の再生の部品を片付けてから置き直す (動きの時計を残さない)。
 * `whole` を渡すと、枠の幅に関わらず全体を止めて見せる (`fixed`)。縮小版と小さな図に使う。
 * 寄って追う見せ方は小さな枠では動く所だけが大きく映り、何の図かが分からないため。
 * `json` を渡すと、記法ではなく原本の JSON の字として読む (#3034、使い方の JSON の節)。
 * 後から読む種類の図は、種類の塊 (描く部品と、その種類の個別ブロックの読み方、#3349) が届いてから読む。塊が届くまでは枠に読み込み中を出す。
 * 足したブロックの定義を持つ記法は、定義を読む処理の塊 (#3399) が届いてから読む (#3407)。
 */
import { type Diagram, diagramKind, type LineStyle, mountDiagram, parseNotation, readDiagram, type Theme } from "@cardenelabs/dragon/light";
import { type ReactElement, useEffect, useMemo, useRef } from "react";

import type { Lang } from "../text";
import { useDefinitions, useKind, useLine, useValidator } from "./kinds";
import { KindState } from "./KindState";

interface Props {
  notation: string;
  lang: Lang;
  theme: Theme;
  /** 図の色味。上の帯で選んだ色味を受け取る (#3033) */
  palette: string;
  /** 線の描き方 (#3643)。書かなければ定規の線 */
  line?: LineStyle;
  /** 枠の幅に関わらず全体を止めて見せる */
  whole?: boolean;
  /** `notation` に記法ではなく原本の JSON の字を渡す */
  json?: boolean;
  /** 段が替わるたびに今の段 (0 から) を受け取る */
  onStep?: (step: number) => void;
  /** 流さずに段 `pausedAt` (0 から) の止め絵で置く。段の数を超えた時は最後の段で止める */
  pausedAt?: number;
  className?: string;
}

/** 原本の JSON の字を読む。JSON として読めない時と検査を通らない時は `null` */
function readJson(text: string): Diagram | null {
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return null;
  }
  const read = readDiagram(input);
  return read.ok ? read.diagram : null;
}

/** 記法か原本の JSON の字の図の種類。読む前に、どの種類の塊を待つかを決める。JSON として読めない時は `undefined` */
function kindOfText(text: string, json: boolean): string | undefined {
  if (!json) return diagramKind(text);
  try {
    const input: unknown = JSON.parse(text);
    return typeof input === "object" && input !== null ? diagramKind(input) : undefined;
  } catch {
    return undefined;
  }
}

/** 記法の字を読む。読めない時は `null` */
function readNotation(text: string): Diagram | null {
  const parsed = parseNotation(text);
  return parsed.ok ? parsed.diagram : null;
}

export function LiveFigure({ notation, lang, theme, palette, line, whole = false, json = false, onStep, pausedAt, className }: Props): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const kind = useMemo(() => kindOfText(notation, json), [notation, json]);
  // 原本の JSON は原本の形の検査の塊も待つ。記法から読んだ図は検査を要らない (#3400)
  const checked = useValidator(json).status === "ready";
  // 足したブロックの定義を持つ記法は、定義を読む処理の塊も待つ (#3407)
  const defined = useDefinitions(json ? "" : notation).status === "ready";
  // 手描きの線を選んだ図は、描き替える処理の塊も待つ (#3643)
  const drawn = useLine(line).status === "ready";
  const ready = useKind(kind).status === "ready" && checked && defined && drawn;
  const diagram = useMemo((): Diagram | null => {
    if (!ready) return null;
    const read = json ? readJson(notation) : readNotation(notation);
    if (!read) return null;
    // 写して作り直すと記法から読んだ図の印が消えて検査が要るので、読んだ図の見せ方を直に替える (#3400)
    if (whole) read.view = "fixed";
    return read;
  }, [notation, whole, json, ready]);
  // 段の知らせ先は描くたびに替わりうるので、置き直さずに最新の物を呼ぶ
  const stepTo = useRef(onStep);
  useEffect(() => {
    stepTo.current = onStep;
  });

  useEffect(() => {
    const el = host.current;
    if (!el || !diagram || !ready) return;
    const player = mountDiagram(el, diagram, { palette, theme, lang, ...(line ? { line } : {}), pausedAt, onStep: (step) => stepTo.current?.(step) });
    return () => player.destroy();
  }, [diagram, ready, palette, theme, lang, line, pausedAt]);

  return (
    <div ref={host} className={className}>
      <KindState kind={kind} lang={lang} />
    </div>
  );
}
