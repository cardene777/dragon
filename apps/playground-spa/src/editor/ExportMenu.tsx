/**
 * 編集画面の図を書き出す釦と、書き出す形を選ぶ小さな窓 (#3644)。
 *
 * 図の上の道具の列の右端に置く。押すと PNG、SVG、GIF、MP4、HTML を選ぶ窓を開き、Esc か窓の外を押すと閉じる。
 * 道具の列は狭い幅で横に送るため、はみ出した物を切る。窓は列に切られないよう、釦の下の画面の位置に置く (`position: fixed`)。
 * 形を選ぶと、書き出す入口 (`@cardenelabs/dragon/capture`) の関数に今の図の SVG を渡し、返った物を書類名の file に保存させる。
 * HTML は頁が図を描き直すので、SVG でなく今の図の記法と色味を渡し、返った頁の文字列を保存させる (#3667)。
 * 書き出す入口は詰める道具を持ち重いので、最初に読む script に入れず、釦を押した時に読む。
 * mp4 は WebCodecs の H.264 が無いブラウザでは作れないので、窓を開いた時に確かめ、作れない時は MP4 を並べない。
 * 書き出している間は釦を押せない。書き出せなかった時は、釦の下に訳を出す。
 */
import type { LineStyle, Theme, Timeline } from "@cardenelabs/dragon/light";
import { type CSSProperties, type ReactElement, useEffect, useRef, useState } from "react";

import type { Lang, Text } from "../text";

/** 書き出す入口を読む。釦を押した時に初めて読み、2 度目からは同じ物を使う */
const loadCapture = (): Promise<typeof import("@cardenelabs/dragon/capture")> => import("@cardenelabs/dragon/capture");

type Format = "png" | "svg" | "gif" | "mp4" | "html";
/** 窓に並べる形。名前は形の名前をそのまま出し、言葉で替えない */
const FORMATS: readonly { id: Format; label: string }[] = [
  { id: "png", label: "PNG" },
  { id: "svg", label: "SVG" },
  { id: "gif", label: "GIF" },
  { id: "mp4", label: "MP4" },
  { id: "html", label: "HTML" },
];

interface Props {
  t: Text["stage"];
  /** 頁の言葉。書き出す入口が断る時の文の言葉にする */
  lang: Lang;
  /** 今の図の SVG。図を置いていない時は null */
  figure: () => SVGSVGElement | null;
  /** 今の図の 1 周の秒と段ごとの止め絵の時刻。GIF の色の表を `dragon export` と同じ絵から作る */
  timeline: () => Pick<Timeline, "total" | "stills"> | undefined;
  /** 今の図の記法。HTML の頁に埋める。図を置いていない時は null */
  source: () => string | null;
  /** 今の図の色味と明るさ。HTML の頁を同じ色で描く */
  palette: string;
  theme: Theme;
  /** 今の図の線の描き方。HTML の頁を同じ描き方で描く (#3643)。画像と動画は描いた図をそのまま撮るので要らない */
  line: LineStyle;
  /** 保存させる file の名前 (拡張子を除く) */
  name: string;
}

/** Blob を `name` の file として保存させる */
function save(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // 保存が始まる前に消すと、保存が空になる browser がある
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function ExportMenu({ t, lang, figure, timeline, source, palette, theme, line, name }: Props): ReactElement {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mp4, setMp4] = useState<boolean | undefined>(undefined);
  const [failed, setFailed] = useState<string | null>(null);
  /** 窓と断りの文を置く画面の位置。釦の下の端に右を揃える */
  const [spot, setSpot] = useState<CSSProperties>({});
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  /** 窓か断りの文を出している */
  const shown = open || failed !== null;
  useEffect(() => {
    if (!shown) return;
    if (open) menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const hide = (): void => {
      setOpen(false);
      setFailed(null);
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      hide();
      button.current?.focus();
    };
    const onDown = (event: PointerEvent): void => {
      const target = event.target as Node | null;
      if (target && !menu.current?.contains(target) && !button.current?.contains(target)) hide();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    // 窓は画面の位置に置くので、画面の大きさが替わったら閉じる
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", hide);
    };
  }, [shown, open]);

  /** 窓と断りの文を、釦の下の端に右を揃えて置く */
  const place = (): void => {
    const box = button.current?.getBoundingClientRect();
    if (box) setSpot({ top: box.bottom + 4, right: Math.max(8, window.innerWidth - box.right) });
  };

  const toggle = (): void => {
    setFailed(null);
    if (open) {
      setOpen(false);
      return;
    }
    place();
    setOpen(true);
    if (mp4 === undefined) {
      loadCapture()
        .then((capture) => capture.canCaptureMp4())
        .then(setMp4, () => setMp4(false));
    }
  };

  const choose = async (format: Format): Promise<void> => {
    setOpen(false);
    const svg = figure();
    const notation = source();
    if (!svg || notation === null) return;
    setBusy(true);
    try {
      const capture = await loadCapture();
      const film = { lang, timeline: timeline() };
      const made =
        format === "html"
          ? new Blob([await capture.captureHtml(notation, { lang, palette, theme, line })], { type: "text/html" })
          : format === "png"
          ? await capture.capturePng(svg, { lang })
          : format === "svg"
            ? new Blob([await capture.captureSvg(svg, { lang })], { type: "image/svg+xml" })
            : format === "gif"
              ? await capture.captureGif(svg, film)
              : await capture.captureMp4(svg, film);
      save(made, `${name}.${format}`);
    } catch (error) {
      place();
      setFailed(t.exportFailed(error instanceof Error ? error.message : String(error)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        ref={button}
        className="pg-tool"
        data-playground="export-figure"
        aria-label={t.export}
        title={t.export}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-busy={busy}
        disabled={busy}
        onClick={toggle}
      >
        <span className="pg-icon" data-icon="export" aria-hidden="true" />
      </button>
      {open && (
        <div className="pg-export-menu" role="menu" aria-label={t.exportMenu} data-playground="export-menu" ref={menu} style={spot}>
          {FORMATS.filter((f) => f.id !== "mp4" || mp4 !== false).map((f) => (
            <button key={f.id} type="button" role="menuitem" className="pg-export-item" data-format={f.id} onClick={() => void choose(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      )}
      {failed !== null && (
        <p className="pg-export-failed" role="alert" data-playground="export-failed" style={spot}>
          {failed}
        </p>
      )}
    </>
  );
}
