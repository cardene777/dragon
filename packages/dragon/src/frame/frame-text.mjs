/**
 * 帯つきの図の帯に出す字 (#3695)。
 *
 * 言葉は設定`lang`が勝ち、無ければ置いた所から上の`lang`属性に従い、どちらも無ければ英語にする。
 * `ja-JP`のように地域の付いた値は言葉の部分 (`ja`) で読み、日本語と英語のほかの言葉は英語にする。
 */
export const FRAME_TEXT = {
  ja: {
    toolbar: '図の操作',
    mark: 'dragonの見本帳を開く',
    code: 'コード',
    editor: 'エディタ',
    editorLabel: 'dragonエディタで開く',
    copy: 'コピー',
    export: 'エクスポート',
    expand: '図を拡大',
    collapse: '拡大表示を閉じる',
    copySource: '記法',
    copyImage: '画像',
    copyUrl: 'エディタのURL',
    images: '画像',
    motion: '動き',
    notation: '記法',
    dragon: 'dragon記法',
    scale: '大きさ',
    scaleLabel: '画像の大きさ',
    times: n => `${n}倍`,
    background: '地',
    backgroundLabel: '画像の地',
    fill: '塗る',
    transparent: '透明',
    codeCopy: 'コピー',
    copiedSource: '記法をコピーしました。',
    copiedImage: '画像をコピーしました。',
    copiedUrl: 'エディタのURLをコピーしました。',
    copiedCode: 'コードをコピーしました。',
    pasteInEditor: '記法が長いのでコピーしました。開いたエディタに貼ってください。',
    copyFailed: 'コピーできませんでした。ブラウザがクリップボードへの書き込みを許していません。',
    exporting: 'エクスポートしています。',
    progress: n => `エクスポートしています。${n}%`,
    saved: 'ファイルを保存しました。',
    savedHtml: '操作できるHTMLを保存しました。開くと初期条件から始まります。',
    exportFailed: 'エクスポートできませんでした。図を表示してから押し直してください。',
    expandFailed: 'この画面では拡大表示を開始できませんでした。',
  },
  en: {
    toolbar: 'Diagram actions',
    mark: 'Open the dragon gallery',
    code: 'Code',
    editor: 'Editor',
    editorLabel: 'Open in the dragon editor',
    copy: 'Copy',
    export: 'Export',
    expand: 'Expand diagram',
    collapse: 'Close expanded view',
    copySource: 'Notation',
    copyImage: 'Image',
    copyUrl: 'Editor URL',
    images: 'Images',
    motion: 'Motion',
    notation: 'Notation',
    dragon: 'dragon notation',
    scale: 'Size',
    scaleLabel: 'Image size',
    times: n => `${n}x`,
    background: 'Background',
    backgroundLabel: 'Image background',
    fill: 'Fill',
    transparent: 'Transparent',
    codeCopy: 'Copy',
    copiedSource: 'Copied the notation.',
    copiedImage: 'Copied the image.',
    copiedUrl: 'Copied the editor URL.',
    copiedCode: 'Copied the code.',
    pasteInEditor: 'The notation is long, so it was copied. Paste it into the editor that opened.',
    copyFailed: 'Could not copy. The browser does not allow writing to the clipboard.',
    exporting: 'Exporting.',
    progress: n => `Exporting. ${n}%`,
    saved: 'Saved the file.',
    savedHtml: 'Saved an interactive HTML file. It starts from the initial state.',
    exportFailed: 'Could not export. Show the diagram and try again.',
    expandFailed: 'This page cannot open the expanded view.',
  },
};

/** `lang`の値を帯の言葉にする。日本語でない値は英語 */
const pick = value => (String(value).trim().toLowerCase().split('-')[0] === 'ja' ? 'ja' : 'en');

/**
 * 帯の言葉。設定`lang`を渡した時はその言葉、無い時は`node`から上で最初に空でない`lang`属性を持つ要素の言葉、どちらも無い時は英語
 */
export function frameLang(lang, node) {
  if (lang) return pick(lang);
  const owner = node?.closest?.('[lang]:not([lang=""])');
  return owner ? pick(owner.getAttribute('lang')) : 'en';
}
