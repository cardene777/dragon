/**
 * 編集画面の図の側 (#3031)。前の編集画面の舞台の配置を、今の再生の部品で戻す。
 *
 * 上の段に色味と道具 (語りの字の大きさ、格子、全画面、全体に合わせる、縮小、拡大) を置く。
 * 携帯の幅では道具を指で押せる大きさ (44px) にして 1 列に収めるため、全体に合わせるの釦を出さず、
 * 倍率を縮小と拡大の間の釦にして、押すと全体に合わせる (#3065)。
 * 図は再生の部品 (`mountDiagram`) で描き、頁の側では SVG を組まない (`useFittedFigure.ts`)。
 * 止めて見せる図 (`data-view="fixed"`) は枠に合わせた倍率 (`fit.ts`) で描き、拡大と縮小はその倍率に掛ける。
 * 寄って追う図は再生の部品が枠の幅で描き直すので、倍率を当てない。
 * 段を 2 つ以上持つ図は、左上に今の段の札を、下端に段の数で区切った進み具合の帯を出す。
 * 字の重なりがある時は、今の段で重なる字を再生の部品に点線で囲ませ、知らせの欄の段の札で頼まれた段へ移って止める (#3178)。
 */
import { type Diagram, type Overlap, PALETTES, type Player, type Theme } from "@cardenelabs/dragon/light";
import { type CSSProperties, type ReactElement, useEffect, useRef, useState } from "react";

import { FigureWaiting } from "../site/KindState";
import { usePhone } from "../site/usePhone";
import { type Lang, TEXT } from "../text";
import { ZOOM_RANGE, ZOOM_STEP, zoomed } from "./fit";
import { useFittedFigure } from "./useFittedFigure";

interface Props {
  /** 最後に描けた図 */
  diagram: Diagram | null;
  palette: string;
  onPalette: (id: string) => void;
  theme: Theme;
  lang: Lang;
  /** 書く欄に誤りがあり、最後に描けた図を出している */
  kept: boolean;
  /** 書き出しの案内に出す書類名 */
  fileName: string;
  /** 描けた図の字の重なり */
  overlaps: Overlap[];
  /** 知らせの欄の段の札で頼まれた移り先。`count` が増えるたびに移る */
  jump: { step: number; count: number } | null;
  /** 最初に開いた図の種類の部品を待っている (#3248)。前の図があれば前の図を残すので立てない */
  waiting: boolean;
}

/** 語りの字の倍率の段と範囲 */
const SAY_STEP = 1.15;
const SAY_RANGE = [0.7, 1.6] as const;
const clampSay = (v: number): number => Math.min(SAY_RANGE[1], Math.max(SAY_RANGE[0], v));

interface ToolProps {
  /** `data-playground` の札 */
  name: string;
  /** 線の絵の名前 (`editor/icons/<icon>.svg`) */
  icon: string;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
}

/** 図の側の道具の釦。字の代わりに線の絵を出し、名前は読み上げと押す前の説明に出す */
function Tool({ name, icon, label, onClick, pressed, disabled }: ToolProps): ReactElement {
  return (
    <button type="button" className="pg-tool" data-playground={name} aria-label={label} title={label} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
      <span className="pg-icon" data-icon={icon} aria-hidden="true" />
    </button>
  );
}

export function Stage({ diagram, palette, onPalette, theme, lang, kept, fileName, overlaps, jump, waiting }: Props): ReactElement {
  const t = TEXT[lang];
  const stage = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [factor, setFactor] = useState(1);
  const [grid, setGrid] = useState(false);
  const [say, setSay] = useState(1);
  const [full, setFull] = useState(false);
  const phone = usePhone();
  const player = useRef<Player | null>(null);
  const fit = useFittedFigure(host, diagram, {
    palette,
    theme,
    lang,
    onStep: setStep,
    onPlayer: (placed) => {
      player.current = placed;
    },
  });

  // 今の段で重なる字を囲む。図を置き直すと囲みも消えるので、置き直す時の値も見る
  useEffect(() => {
    player.current?.mark(overlaps.filter((o) => o.step === step).flatMap((o) => o.spots.map((spot) => spot.rect)));
  }, [overlaps, step, diagram, palette, theme, lang]);

  useEffect(() => {
    if (jump) player.current?.goTo(jump.step);
  }, [jump]);

  useEffect(() => {
    const onChange = (): void => setFull(document.fullscreenElement !== null && document.fullscreenElement === stage.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFull = (): void => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void stage.current?.requestFullscreen().catch(() => undefined);
  };

  const count = diagram?.steps.length ?? 0;
  const current = diagram?.steps[Math.min(step, count - 1)];
  const phased = count > 1 && current !== undefined;
  const scale = fit ? zoomed(fit.scale, factor) : null;
  const level = scale === null ? "—" : `${Math.round(scale * 100)}%`;
  const zoomBy = (by: number): void => {
    if (!fit) return;
    // 範囲の端で押しても、倍率の数だけ増えて戻りが遅れないよう、範囲に収めた倍率から係数を出し直す
    setFactor(zoomed(fit.scale, factor * by) / fit.scale);
  };
  const figureStyle = {
    ...(fit && scale !== null ? { "--fig-w": `${fit.width * scale}px` } : {}),
    "--say": String(say),
  } as CSSProperties;

  return (
    <section className="pg-stage" data-playground="stage" ref={stage}>
      <div className="pg-stage-bar">
        <span className="pg-live">
          <span className="pg-live-dot" aria-hidden="true" />
          {t.stage.live}
        </span>
        {/* 釦と見本の丸を分け、指で触る時は丸の大きさのまま釦だけを 44px にする (#3077) */}
        <div className="pg-swatches" role="group" aria-label={t.palette}>
          {Object.values(PALETTES).map((p) => (
            <button
              key={p.id}
              type="button"
              className="pg-swatch"
              data-playground={`palette-${p.id}`}
              aria-pressed={palette === p.id}
              aria-label={t.paletteNames[p.id] ?? p.name}
              title={t.paletteNames[p.id] ?? p.name}
              onClick={() => onPalette(p.id)}
            >
              <span
                className="pg-swatch-dot"
                aria-hidden="true"
                style={{ background: `linear-gradient(135deg, ${p.light.page} 50%, ${p.dark.page} 50%)`, borderColor: p.light["c-blue"] }}
              />
            </button>
          ))}
        </div>
        <span className="pg-gap" />
        <Tool name="font-down" icon="text-down" label={t.stage.fontDown} onClick={() => setSay(clampSay(say / SAY_STEP))} />
        <Tool name="font-up" icon="text-up" label={t.stage.fontUp} onClick={() => setSay(clampSay(say * SAY_STEP))} />
        <Tool name="grid" icon="grid" label={t.stage.grid} pressed={grid} onClick={() => setGrid(!grid)} />
        <Tool name="fullscreen" icon="fullscreen" label={t.stage.fullscreen} pressed={full} onClick={toggleFull} />
        <span className="pg-tool-sep" aria-hidden="true" />
        {!phone && <Tool name="fit" icon="fit" label={t.stage.fit} disabled={!fit} onClick={() => setFactor(1)} />}
        <Tool name="zoom-out" icon="zoom-out" label={t.stage.zoomOut} disabled={!fit || scale === ZOOM_RANGE[0]} onClick={() => zoomBy(1 / ZOOM_STEP)} />
        {phone && (
          <button
            type="button"
            className="pg-tool pg-zoom-fit"
            data-playground="zoom-level"
            aria-label={`${t.stage.fit} (${level})`}
            title={t.stage.fit}
            disabled={!fit}
            onClick={() => setFactor(1)}
          >
            {level}
          </button>
        )}
        <Tool name="zoom-in" icon="zoom-in" label={t.stage.zoomIn} disabled={!fit || scale === ZOOM_RANGE[1]} onClick={() => zoomBy(ZOOM_STEP)} />
        {!phone && (
          <span className="pg-zoom" data-playground="zoom-level" aria-label={t.stage.zoom}>
            {level}
          </span>
        )}
      </div>

      <div className="pg-figure" data-playground="figure" data-grid={grid ? "on" : undefined} data-phased={phased ? "on" : undefined} style={figureStyle}>
        {phased && (
          <p className="pg-phase" data-playground="phase-badge">
            <span className="pg-phase-dot" aria-hidden="true" />
            {t.stage.phase(step + 1, count, current.title)}
          </p>
        )}
        {kept && <p className="pg-kept">↺ {t.kept}</p>}
        {waiting && <FigureWaiting lang={lang} />}
        <div className="pg-player" ref={host} />
      </div>

      <div className="pg-stage-foot">
        {phased && (
          <div className="pg-progress" data-playground="progress" aria-hidden="true">
            {diagram?.steps.map((s, i) => (
              <span key={`${i}-${s.title}`} className="pg-progress-seg" data-playground="progress-seg" data-done={i <= step} />
            ))}
          </div>
        )}
        <p className="pg-hint">
          {t.exportLead} <code>dragon export {fileName}</code> {t.exportTail}
        </p>
      </div>
    </section>
  );
}
