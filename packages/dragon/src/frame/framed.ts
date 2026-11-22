/**
 * 記法から読んだ図を帯の内側に描く (#3699)。npm の入口 (`mountFramedDiagram`) と、script の1行の入口が後から読む帯の塊が共に使う。
 *
 * 図の再生の部品 (`mount`) と記法の語の一覧 (`words`) は呼ぶ側から受け取り、package の入口を読まない。
 * script の1行の入口は本体の物を渡すので、帯の塊は再生の部品の写しを持たず、本体が登録した図の種類をそのまま描ける。
 * 既定の入口の帯 (`@cardenelabs/dragon/frame`) と軽い入口の帯 (`@cardenelabs/dragon/light/frame`) は、それぞれの入口の記法を読む処理を渡す (#3789)。
 * 書き出す部品を読む処理 (`capture`) も呼ぶ側から受け取る (#3786)。`dragon embed`が埋める script は、頁に束ねた書き出す部品を渡す (#3792)。
 */
import type { Diagram, Parsed, ParseOptions, Player, PlayerOptions } from "@cardenelabs/dragon";
import { stylesFor } from "../adopt-css";
import type { CaptureLoader } from "./diagram-actions.mjs";
import { createDragonFrame } from "./dragon-frame.mjs";
import { frameLang } from "./frame-text.mjs";
import type { DiagramFrame, FrameOptions } from "./index";

/** 図の再生の部品を置く処理。package の`mountDiagram`と同じ形 */
type Mount = (host: HTMLElement, diagram: Diagram, options?: PlayerOptions) => Player;
/** コードの窓で色を付ける記法の語の一覧。package の`NOTATION_WORDS`と同じ形 */
type Words = { readonly kinds: readonly string[]; readonly heads: readonly string[] };
/** 記法を読む処理。package の`parseNotation`と同じ形 */
type Parse = (text: string, options?: ParseOptions) => Parsed;
/** 帯つきで置いた図 */
type Framed = { player: Player; frame: DiagramFrame; destroy(): void };

/** `host`に帯を置き、帯の内側に図を描く。描けない時は帯を外して誤りを投げる */
export function mountInFrame(host: HTMLElement, source: string, diagram: Diagram, options: PlayerOptions & FrameOptions, mount: Mount, words: Words, capture?: CaptureLoader): Framed {
  // 帯と再生の部品は同じ言葉で出す。設定が無い時は置いた所から上の`lang`属性で決める (#3695)
  const shown = { ...options, lang: frameLang(options.lang, host) };
  const controls = createDragonFrame(host.ownerDocument, source, diagram, { ...shown, words, capture });
  host.append(controls.frame);
  let player: Player;
  try {
    // 図の再生の部品の見た目は、文書の頭ではなく帯の内側の影の根へ入れる (#3695)
    player = mount(controls.host, diagram, { ...shown, styles: stylesFor(controls.host, options.nonce) });
    controls.connect();
  } catch (error) {
    controls.destroy(); controls.frame.remove(); throw error;
  }
  let disposed = false;
  return { player, frame: controls, destroy() {
    if (disposed) return; disposed = true;
    player.destroy(); controls.destroy(); controls.frame.remove();
  } };
}

/**
 * 記法`source`を読み、`host`に帯を置いて帯の内側に図を描く。記法は帯と同じ言葉で読み、誤りの文もその言葉で出す (#3789)。
 * 記法に誤りが在る時は、帯を置かずに行ごとの誤りの文を投げる
 */
export function mountNotationInFrame(host: HTMLElement, source: string, options: PlayerOptions & FrameOptions, parse: Parse, mount: Mount, words: Words, capture?: CaptureLoader): Framed {
  const parsed = parse(source, { lang: frameLang(options.lang, host) });
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\n"));
  return mountInFrame(host, source, parsed.diagram, options, mount, words, capture);
}
