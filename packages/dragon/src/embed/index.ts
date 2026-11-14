/**
 * 外のツールやサービスが図を置くSDKの入口`@cardenelabs/dragon/embed` (#3698)。
 *
 * `mountDragon`は記法から図を置き、既定で帯を付ける。帯と枠の見た目は設定`look`で、帯のボタンは設定`buttons`で置き先に合わせる。
 * `header: false`は帯を出さずに図だけを置き、エクスポートとエディタで開くとコピーは返した物の関数で呼ぶ。
 * 置いた要素は、描けた・描けなかった (`dragon-render`)、段が変わった (`dragon-step`)、エクスポートした (`dragon-export`)、
 * エディタで開いた・コピーした (`dragon-share`) の4つを`bubbles`と`composed`で知らせる。
 *
 * 出す名前は`src/embed/names.json`が持ち、検査`sdk-entry-matches-name-list`が突き合わせる。
 * 名前を変える時は一覧と版の真ん中の数と変更の一覧を同じPRで直す (`docs/adr/0001-sdk-entry-names.md`)。
 */
import { parseNotation, mountDiagram, type Diagram, type Player, type PlayerOptions } from '@cardenelabs/dragon';
import { createDiagramActions, type DiagramActions } from '../frame/diagram-actions.mjs';
import { mountFramedDiagram } from '../frame/index';
import type { HeaderColors } from '../frame/header';
import type { BuiltinButton, CopyKind, EmbedLook, ExportDetail, ExportFormat, ExportOptions, ShareDetail } from '../frame/types';

export type { HeaderColors };
export type { BuiltinButton, CopyKind, EmbedLook, ExportDetail, ExportFormat, ExportOptions, ShareDetail };

/** 帯に足す置く側のボタン。押すと`onClick`が置いた図 (`mountDragon`が返した物) を受け取る */
export interface CustomButton {
  id: string;
  label: string;
  /** 24 四方の SVG の`path`の`d` */
  icon?: string;
  onClick(embed: DragonEmbed): void;
}

/** 帯のボタン。初めから在るボタンは名前で、置く側のボタンは`CustomButton`で書く */
export type EmbedButton = BuiltinButton | CustomButton;

/** 図を置く設定。図の再生の設定 (`PlayerOptions`) も受ける */
export interface EmbedOptions extends PlayerOptions {
  /** `false`で帯を出さずに図だけを置く。書かなければ帯を付ける */
  header?: boolean;
  /** 帯と枠を置き先に合わせる値。帯を出さない時は効かない */
  look?: EmbedLook;
  /** 帯のボタンの並び。書いた順に並び、書かなかった初めからのボタンは外れる。帯を出さない時は効かない */
  buttons?: readonly EmbedButton[];
  /** 帯と再生の部品の言葉。書かない時は置いた所から上の`lang`属性に従い、それも無い時は英語 */
  lang?: 'ja' | 'en';
  /** `adoptedStyleSheets`を持たないブラウザで作るstyle要素と、図の SVG の`<style>`に付ける`nonce` */
  nonce?: string;
}

/** 描けた・描けなかった知らせの中身。描けなかった時は記法の誤りの文を持つ */
export interface RenderDetail {
  ok: boolean;
  errors?: string[];
}

/** 段が変わった知らせの中身。段は 0 から数える */
export interface StepDetail {
  step: number;
}

/** 置いた要素が送る4つの知らせ */
export interface DragonEmbedEventMap {
  'dragon-render': CustomEvent<RenderDetail>;
  'dragon-step': CustomEvent<StepDetail>;
  'dragon-export': CustomEvent<ExportDetail>;
  'dragon-share': CustomEvent<ShareDetail>;
}

/** 置いた図 */
export interface DragonEmbed {
  /** 置いた記法 */
  readonly source: string;
  /** 記法を読んだ図 */
  readonly diagram: Diagram;
  /** 図の再生の部品 */
  readonly player: Player;
  /** 帯つきの図の枠。帯を出さない時は無い */
  readonly frame: HTMLElement | undefined;
  /** 見本帳のエディタで同じ記法を開く URL */
  readonly editorUrl: string;
  /** 図を形式`format`のファイルの中身にする */
  export(format: ExportFormat, options?: ExportOptions): Promise<Blob>;
  /** 見本帳のエディタを新しいタブで開く */
  openEditor(): void;
  /** 物`kind`をクリップボードに書く。ブラウザが断った時は投げる */
  copy(kind: CopyKind): Promise<void>;
  /** 図と帯を取り除く */
  destroy(): void;
}

/** 記法`source`の図を要素`host`に置く。描けない記法は`dragon-render`で知らせてから投げる */
export function mountDragon(host: HTMLElement, source: string, options: EmbedOptions = {}): DragonEmbed {
  const emit = <K extends keyof DragonEmbedEventMap>(type: K, detail: DragonEmbedEventMap[K]['detail']): void => {
    const view = host.ownerDocument.defaultView as Window & typeof globalThis;
    host.dispatchEvent(new view.CustomEvent(type, { detail, bubbles: true, composed: true }));
  };
  const parsed = parseNotation(source);
  if (!parsed.ok) {
    const errors = parsed.errors.map((e) => `${e.line}: ${e.message}`);
    emit('dragon-render', { ok: false, errors });
    throw new Error(errors.join('\n'));
  }
  const { diagram } = parsed;
  const { header = true, look, buttons, ...playerOptions } = options;
  let last: number | undefined;
  const onStep = (step: number): void => {
    options.onStep?.(step);
    if (step === last) return;
    last = step;
    emit('dragon-step', { step });
  };
  const notify = (type: 'export' | 'share', detail: ExportDetail | ShareDetail): void => {
    if (type === 'export') emit('dragon-export', detail as ExportDetail);
    else emit('dragon-share', detail as ShareDetail);
  };

  let placed: { player: Player; frame: HTMLElement | undefined; actions: DiagramActions; destroy(): void };
  try {
    placed = header ? framed() : headless();
  } catch (error) {
    emit('dragon-render', { ok: false, errors: [error instanceof Error ? error.message : String(error)] });
    throw error;
  }
  const { player, actions } = placed;
  const embed: DragonEmbed = {
    source,
    diagram,
    player,
    frame: placed.frame,
    editorUrl: actions.editorUrl,
    export: (format, exportOptions) => actions.export(format, exportOptions),
    openEditor: () => actions.openEditor(),
    copy: (kind) => actions.copy(kind),
    destroy: () => placed.destroy(),
  };
  emit('dragon-render', { ok: true });
  return embed;

  function framed(): typeof placed {
    // 置く側のボタンは、押した時に置いた図を渡す
    const arranged = buttons?.map((entry) => (typeof entry === 'string' ? entry : { ...entry, onClick: () => entry.onClick(embed) }));
    const mounted = mountFramedDiagram(host, source, { ...playerOptions, onStep, look, buttons: arranged, notify });
    return { player: mounted.player, frame: mounted.frame.frame, actions: mounted.frame.actions, destroy: () => mounted.destroy() };
  }
  function headless(): typeof placed {
    const stage = host.ownerDocument.createElement('div');
    stage.className = 'dragon-embed';
    host.append(stage);
    let mountedPlayer: Player;
    try {
      mountedPlayer = mountDiagram(stage, diagram, { ...playerOptions, onStep });
    } catch (error) {
      stage.remove();
      throw error;
    }
    const headlessActions = createDiagramActions(host.ownerDocument, stage, source, diagram, notify);
    headlessActions.connect();
    let disposed = false;
    return {
      player: mountedPlayer,
      frame: undefined,
      actions: headlessActions,
      destroy() {
        if (disposed) return;
        disposed = true;
        mountedPlayer.destroy();
        headlessActions.destroy();
        stage.remove();
      },
    };
  }
}
