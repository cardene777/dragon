/**
 * 記法から読んだ図を帯の内側に描く (#3699)。npm の入口 (`mountFramedDiagram`) と、script の1行の入口が後から読む帯の塊が共に使う。
 *
 * 図の再生の部品 (`mount`) と記法の語の一覧 (`words`) は呼ぶ側から受け取り、package の入口を読まない。
 * script の1行の入口は本体の物を渡すので、帯の塊は再生の部品の写しを持たず、本体が登録した図の種類をそのまま描ける。
 */
import type { Diagram, Player, PlayerOptions } from "@cardenelabs/dragon";
import { stylesFor } from "../adopt-css";
import { createDragonFrame } from "./dragon-frame.mjs";
import { frameLang } from "./frame-text.mjs";
import type { DiagramFrame, FrameOptions } from "./index";

/** 図の再生の部品を置く処理。package の`mountDiagram`と同じ形 */
type Mount = (host: HTMLElement, diagram: Diagram, options?: PlayerOptions) => Player;
/** コードの窓で色を付ける記法の語の一覧。package の`NOTATION_WORDS`と同じ形 */
type Words = { readonly kinds: readonly string[]; readonly heads: readonly string[] };

/** `host`に帯を置き、帯の内側に図を描く。描けない時は帯を外して誤りを投げる */
export function mountInFrame(host: HTMLElement, source: string, diagram: Diagram, options: PlayerOptions & FrameOptions, mount: Mount, words: Words): { player: Player; frame: DiagramFrame; destroy(): void } {
  // 帯と再生の部品は同じ言葉で出す。設定が無い時は置いた所から上の`lang`属性で決める (#3695)
  const shown = { ...options, lang: frameLang(options.lang, host) };
  const controls = createDragonFrame(host.ownerDocument, source, diagram, { ...shown, words });
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
 * script の1行の入口が描いた図に帯を付ける (#3699)。入口は図を描いた後にこの塊を読んで呼ぶ。
 * 描いた図は文書の頭の見た目で描かれているので、外して帯の内側に描き直す
 */
export function frameDrawn(host: HTMLElement, drawn: Player, source: string, diagram: Diagram, options: PlayerOptions, mount: Mount, words: Words): void {
  drawn.destroy();
  host.replaceChildren();
  mountInFrame(host, source, diagram, options, mount, words);
}
