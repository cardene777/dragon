import { EDITOR_URL_LIMIT, editorPasteUrl, packedEditorUrl } from '../editor-url';
import { snapshotDiagram, snapshotText, snapshotCanvas } from './dragon-snapshot.mjs';

/** 地を塗る時の色。図の地と同じ */
export const PAPER = '#fffefa';
const FORMATS = ['png', 'svg', 'html', 'gif', 'mp4', 'dragon', 'json'];
const KINDS = ['source', 'json', 'image', 'url'];

/**
 * 置いた図のエクスポートとコピーとエディタで開く処理 (#3698)。帯のボタンと、帯を出さずに置いた図の関数が同じ処理を呼ぶ。
 * `host`は再生の部品を持つ要素。`connect()`の後は図の動きを記録し、GIF と MP4 はその記録を流す。
 * `notify`はエクスポートした時 (`export`) とエディタで開いた・コピーした時 (`share`) に呼ぶ。
 * エディタの URL は記法を縮めて詰め、縮めても`EDITOR_URL_LIMIT`を超える記法は写してから貼るよう頼むエディタを開く (#3697)。
 */
export function createDiagramActions(document, host, source, diagram, notify) {
  const environment = document.defaultView;
  const sourceText = { dragon: source, json: JSON.stringify(diagram, null, 2) };
  /** 縮めたエディタの URL と、上限を超えるか */
  const link = packedEditorUrl(source).then(url => ({ url, long: url.length > EDITOR_URL_LIMIT }));
  const controller = new environment.AbortController();
  const history = [];
  let disposed = false, busy = false, observer, queued = false;

  /** 図を`scale`倍の画素の PNG にする。`transparent`の時は地を塗らない */
  const png = async (scale, transparent) => {
    const canvas = await snapshotCanvas(snapshotDiagram(host, { transparent }), 0, scale, transparent ? null : PAPER);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNGを作成できませんでした');
    return blob;
  };
  /** 記録した図の動きを GIF か MP4 にする */
  const motion = async (format, onProgress) => {
    const current = snapshotDiagram(host);
    const capture = await import('./capture.js');
    const frames = history.length ? [...history] : [{ shot: current, time: 0 }];
    frames.push({ shot: current, time: (frames.at(-1)?.time ?? 0) + 900 });
    let total = 0;
    const clips = frames.map((frame, i) => {
      const duration = i < frames.length - 1 ? Math.min(1.1, Math.max(.15, (frames[i + 1].time - frame.time) / 1000)) : .8;
      const clip = { ...frame, start: total, end: total + duration }; total += duration; return clip;
    });
    const width = Math.ceil(Math.max(...clips.map(c => c.shot.width)) / 2) * 2, height = Math.ceil(Math.max(...clips.map(c => c.shot.height)) / 2) * 2;
    return capture.captureFrames({ width, height, total, format, signal: controller.signal, onProgress,
      draw: async seconds => {
        const clip = clips.find(c => seconds < c.end) ?? clips.at(-1);
        const image = await snapshotCanvas(clip.shot, seconds - clip.start);
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d'); context.fillStyle = PAPER; context.fillRect(0, 0, width, height); context.drawImage(image, 0, 0);
        return canvas;
      } });
  };
  async function produce(format, { scale = 2, background = 'fill', onProgress } = {}) {
    if (format === 'dragon' || format === 'json') {
      return new environment.Blob([sourceText[format]], { type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8' });
    }
    if (format === 'html') {
      const capture = await import('./capture.js');
      return new environment.Blob([await capture.captureHtml(source)], { type: 'text/html;charset=utf-8' });
    }
    const transparent = background === 'transparent';
    if (format === 'svg') return new environment.Blob([snapshotText(snapshotDiagram(host, { transparent }))], { type: 'image/svg+xml' });
    if (format === 'png') return png(scale, transparent);
    return motion(format, onProgress);
  }

  /** 図を形式`format`のファイルの中身にする。作っている間に呼ぶと断る */
  async function exportDiagram(format, options = {}) {
    if (!FORMATS.includes(format)) throw new RangeError(`format must be one of ${FORMATS.join(', ')}, got ${String(format)}`);
    if (disposed) throw new Error('取り除いた図はエクスポートできません');
    if (busy) throw new Error('エクスポートの途中です');
    busy = true;
    try {
      const blob = await produce(format, options);
      notify?.('export', { format });
      return blob;
    } finally { busy = false; }
  }
  /** 物`kind`をクリップボードに書く。ブラウザが断った時は投げる */
  async function copy(kind) {
    if (!KINDS.includes(kind)) throw new RangeError(`kind must be one of ${KINDS.join(', ')}, got ${String(kind)}`);
    const clipboard = environment.navigator.clipboard;
    if (kind === 'image') await clipboard.write([new environment.ClipboardItem({ 'image/png': png(2, false) })]);
    else await clipboard.writeText(kind === 'url' ? (await link).url : kind === 'json' ? sourceText.json : source);
    notify?.('share', { via: 'copy', kind });
  }
  /**
   * 見本帳のエディタを新しいタブで開く。縮めても長すぎる記法はクリップボードに写してから、貼るよう頼むエディタを開いて`true`を返す。
   * タブを先に開くと頁が前に出ず、クリップボードへ書けないので、写してから開く
   */
  async function openEditor() {
    const { url, long } = await link;
    if (long) await environment.navigator.clipboard.writeText(source);
    environment.open(long ? editorPasteUrl() : url, '_blank', 'noopener');
    notify?.('share', { via: 'editor' });
    return long;
  }
  function record() {
    if (disposed || busy || !host.clientWidth) return;
    try {
      const shot = snapshotDiagram(host, { animate: true });
      if (history.length && history.at(-1).shot.width !== shot.width) history.length = 0;
      const time = environment.performance.now();
      if (history.length && time - history.at(-1).time < 150) history.pop();
      history.push({ shot, time }); if (history.length > 12) history.shift();
    } catch { /* A hidden or detached diagram has no capture area. */ }
  }
  return {
    source, sourceText,
    editorUrl: () => link.then(({ url }) => url),
    editorLink: () => link,
    get busy() { return busy; },
    export: exportDiagram, copy, openEditor,
    connect() {
      record(); observer = new environment.MutationObserver(() => {
        if (queued || disposed || busy) return; queued = true;
        environment.requestAnimationFrame(() => { queued = false; record(); });
      });
      observer.observe(host.shadowRoot ?? host, { subtree: true, childList: true, characterData: true, attributes: true });
    },
    destroy() {
      if (disposed) return; disposed = true; controller.abort();
      observer?.disconnect(); history.length = 0;
    },
  };
}
