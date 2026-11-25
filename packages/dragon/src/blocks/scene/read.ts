/**
 * 場面のブロックの読み方 (#3878)。`scene` の行は段を積む読む処理 (`parser.ts` の `openScene`) へ渡し、`stop` の行は今の段に止まる理由を置く。
 * 場面を書き戻すのは書き戻す処理 (`printer.ts`) で、場面の段の後ろに `stop` の行を、場面の終わりに `end` の行を書く
 */
import type { Messages } from "../../messages";
import { type Attr, fail, isOneOf, list } from "../../read-kit";
import type { SceneShow } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none } from "../block";
import { SCENE_KINDS, SCENE_MOST, SCENE_SHOWS } from "./block";

export interface SceneMessages {
  /** 最初の行の `scenes` に `stack` と `pick` の外の値を書いた */
  badScenes: string;
  /** 場面を書けない図の種類に `scene` を書いた */
  sceneKinds: string;
  /** 場面を上限より多く書いた */
  sceneMost: string;
  /** `scene` の後ろに名前を書かない */
  emptyScene: string;
  /** 同じ名前の場面をもう一度書いた */
  sceneTwice: (name: string) => string;
  /** 場面の中に `scene` を書いた */
  sceneInScene: string;
  /** `end` で閉じない場面 */
  unclosedScene: (name: string) => string;
  /** 場面の後ろに場面の外の段を書いた */
  stepAfterScenes: string;
  /** 場面の外の段に `stop` を書いた */
  stopOutsideScene: string;
  /** `stop` の後ろに理由を書かない */
  emptyStop: string;
  /** `stop` を書いた段の後ろに、同じ場面の段か `stop` を書いた */
  afterStop: string;
}

/** 最初の行の `scenes:` の値。知らない見せ方は 1 行目の `scenes` の所を指して断る */
export function sceneShowOf(head: SourceLine, shown: Attr | undefined, m: Messages): SceneShow | undefined {
  if (shown && !isOneOf(SCENE_SHOWS, shown.value)) throw fail(head, shown.at, m.badScenes);
  return shown?.value as SceneShow | undefined;
}

export const reading: BlockReading<SceneMessages> = {
  read: {
    // 場面の段を書き始める。場面を書ける図の種類と数と名前は、段を積む読む処理が確かめる
    scene: (source, state) => {
      state.openScene(source, source.text.slice("scene".length).trim());
    },
    // 場面が止まる段と理由。場面の中の段にだけ書け、1 つの場面に 1 つまで
    stop: (source, state) => {
      if (state.scene() === undefined) throw fail(source, 0, state.m.stopOutsideScene);
      const step = state.inStep(source);
      if (step.stop !== undefined) throw fail(source, 0, state.m.afterStop);
      const reason = source.text.slice("stop".length).trim();
      if (reason === "") throw fail(source, 0, state.m.emptyStop);
      step.stop = reason;
    },
  },
  print: none("場面は書き戻す処理が、場面の段と一緒に scene と stop と end の行で書き戻す"),
  messages: {
    ja: {
      badScenes: `1 行目の scenes は ${list(SCENE_SHOWS)} のどれか。stack は場面を縦に並べ、pick は場面の名前の釦で選んだ場面を追う`,
      sceneKinds: `scene は ${list(SCENE_KINDS)} の図にだけ書ける`,
      sceneMost: `1 つの図に scene は ${SCENE_MOST} つまで`,
      emptyScene: "scene の後ろに場面の名前を書く",
      sceneTwice: (name) => `scene ${name} は既に書いた場面。場面ごとに違う名前を付ける`,
      sceneInScene: "scene の中に scene は書けない。先に end で閉じる",
      unclosedScene: (name) => `scene ${name} を end で閉じていない`,
      stepAfterScenes: "全ての場面に共通の段は、最初の scene より前に書く。scene の後ろには scene だけを書ける",
      stopOutsideScene: "stop は scene の中の段にだけ書ける。場面が止まる段に書く",
      emptyStop: "stop の後ろに場面が止まる理由を書く",
      afterStop: "stop は 1 つの場面に 1 つまで、場面の最後の段に書く",
    },
    en: {
      badScenes: `scenes on the first line is one of ${list(SCENE_SHOWS)}. stack lines the scenes up, and pick follows the scene chosen with its name button`,
      sceneKinds: `scene can be written only in ${list(SCENE_KINDS)} diagrams`,
      sceneMost: `A diagram takes at most ${SCENE_MOST} scenes`,
      emptyScene: "Write the scene name after scene",
      sceneTwice: (name) => `scene ${name} is already written. Give each scene its own name`,
      sceneInScene: "A scene cannot hold another scene. Close it with end first",
      unclosedScene: (name) => `scene ${name} is not closed with end`,
      stepAfterScenes: "Write the steps shared by all scenes before the first scene. Only scenes can follow a scene",
      stopOutsideScene: "stop can be written only in a step inside a scene, the step where the scene stops",
      emptyStop: "Write why the scene stops after stop",
      afterStop: "A scene takes one stop, in its last step",
    },
  },
};
