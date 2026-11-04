/**
 * 始まりと終わりの印の描き方 (#3163、#3347)。
 *
 * 始まりは塗った丸、終わりは輪の中の丸で描く。脇道の中の終わりは点線の輪にし、脇道の状態の色を付ける。
 * 印の置き場所と字の置き場所は場面 (`layout/scene.ts`) が持つ。
 */
import { markText, type SceneEnd } from "../../layout/scene";
import { type ColorKey, LOOK, TYPE } from "../../look/values";
import type { Ink } from "../../render/ink";
import { r1, write } from "../../render/parts";
import { cs } from "../color/draw";

/** 状態遷移図の始まりと終わりの印。始まりは塗った丸、終わりは輪の中の丸で、脇道の中の終わりは点線の輪 */
export function endMark(e: SceneEnd, color: ColorKey, ink: Ink[]): string {
  const { end } = LOOK.state;
  const at = markText(e);
  const text = e.text === "" ? "" : write(ink, "dg-mark", at[0], at[1], e.text, TYPE.regionNote);
  const x = r1(e.x);
  const y = r1(e.y);
  if (e.kind === "start") return `<g data-end="start"><circle class="dg-start" cx="${x}" cy="${y}" r="${e.r}"/>${text}</g>`;
  if (e.ghost) return `<g data-end="finish" style="${cs(color)}"><circle class="dg-end-x" cx="${x}" cy="${y}" r="${e.r}"/><circle class="dg-end-xi" cx="${x}" cy="${y}" r="${end.inner}"/>${text}</g>`;
  return `<g data-end="finish"><circle class="dg-end" cx="${x}" cy="${y}" r="${e.r}"/><circle class="dg-end-in" cx="${x}" cy="${y}" r="${end.inner}"/>${text}</g>`;
}
