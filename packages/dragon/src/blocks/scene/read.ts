/**
 * 場面のブロックの読み方 (#3878)。`scene` の行は段を積む読む処理 (`parser.ts` の `openScene`) へ渡し、`stop` の行は今の段に止まる理由を置く。
 * 読み方は手順の図と列の図の図でだけ後から読むので、1 行目の `scenes` の値と、ほかの図の種類の `scene` と `stop` の行は、記法を読む処理が中心の誤りの文で断る。
 * 場面のブロックの定義 (`block.ts`) は最初に読む塊に入るので、ここから値を読まない。読むと定義が最初に読む別の file に分かれる (#3706)。
 * 場面を書き戻すのは書き戻す処理 (`printer.ts`) で、場面の段の後ろに `stop` の行を、場面の終わりに `end` の行を書く
 */
import { fail } from "../../read-kit";
import { type BlockReading, none } from "../block";

export interface SceneMessages {
  /** 場面を上限 (`most`) より多く書いた。上限は記法を読む処理が渡し、この file は場面のブロックの定義を読まない */
  sceneMost: (most: number) => string;
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
      sceneMost: (most) => `1 つの図に scene は ${most} つまで`,
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
      sceneMost: (most) => `A diagram takes at most ${most} scenes`,
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
