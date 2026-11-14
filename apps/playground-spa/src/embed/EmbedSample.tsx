/**
 * 組み込みの見本の頁 (`/embedding`、#3701)。
 *
 * 同じ記法 (`sample.dragon`、英語の頁は`sample.en.dragon`) の図を、外の頁に置く4つの置き方で並べる。
 * 札ごとに、置き方のコードと、そのコードと同じ形で置いた帯つきの図を横に並べる。
 *
 * | 札 | 置き方 | 図の置き方 |
 * |---|---|---|
 * | `script` | scriptの1行 | 見本帳に写した本物の入口を読む頁 (`script/demo.html`、`vite-script-demo.ts`) をiframeで開く |
 * | `npm` | SDKの関数 | `mountDragon`で要素に置く |
 * | `element` | Web Component | `defineDragonElement`で登録した`<dragon-diagram>`を置く |
 * | `iframe` | iframe | `embedUrl`で作った埋め込みの頁のURLをiframeで開く |
 *
 * 図はどれも外の頁が置いた時と同じ既定の見た目で描き、見本帳の明暗と色味を渡さない。
 * コードはその言葉の記法から作り、scriptの1行の版は見本帳の版の`<major>.<minor>`にする。
 */
import { defineDragonElement, mountDragon } from "@cardenelabs/dragon/embed";
import { embedUrl } from "@cardenelabs/dragon/light";
import { type ReactElement, useEffect, useRef, useState } from "react";

import { follow, PATHS } from "../site/routes";
import { type Lang, TEXT } from "../text";
import sampleJa from "./sample.dragon?raw";
import sampleEn from "./sample.en.dragon?raw";
import "./embed-sample.css";

/** 見本帳の置き場 */
const BASE = import.meta.env.BASE_URL;
/** scriptの1行のコードが読む版 */
const PINNED = __DRAGON_VERSION__.split(".").slice(0, 2).join(".");
/** 4つの置き方。札の並び */
const WAYS = ["script", "npm", "element", "iframe"] as const;
type Way = (typeof WAYS)[number];

/** その言葉の見本の記法 */
const sampleOf = (lang: Lang): string => (lang === "en" ? sampleEn : sampleJa).trimEnd();

/** 記法の題。1 行目の図の種類の後ろの字 */
const titleOf = (source: string): string => (source.split("\n")[0] ?? "").replace(/^\S+\s*/u, "").trim();

/** 空でない行の頭に`by`を足す */
const indent = (text: string, by: string): string =>
  text
    .split("\n")
    .map((line) => (line === "" ? line : `${by}${line}`))
    .join("\n");

/** 置き方`way`のコード */
function codeOf(way: Way, source: string, lang: Lang): string {
  switch (way) {
    case "script":
      return [
        `<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@${PINNED}/dist/cdn/dragon.js"></script>`,
        "",
        '<pre class="dragon" data-header>',
        source,
        "</pre>",
      ].join("\n");
    case "npm":
      return [
        'import { mountDragon } from "@cardenelabs/dragon/embed";',
        "",
        'const source = await (await fetch("sample.dragon")).text();',
        'const host = document.getElementById("figure");',
        'if (host === null) throw new Error("#figure not found");',
        `mountDragon(host, source, { lang: "${lang}" });`,
      ].join("\n");
    case "element":
      return [
        '<script type="module">',
        '  import { defineDragonElement } from "@cardenelabs/dragon/embed";',
        "  defineDragonElement();",
        "</script>",
        "",
        "<dragon-diagram>",
        indent(source, "  "),
        "</dragon-diagram>",
      ].join("\n");
    case "iframe":
      return [
        `<iframe id="figure" title="${titleOf(source)}" allow="clipboard-write" style="width: 100%; height: 640px; border: 0"></iframe>`,
        "",
        '<script type="module">',
        '  import { embedUrl } from "@cardenelabs/dragon";',
        "",
        '  const source = await (await fetch("sample.dragon")).text();',
        '  const frame = document.getElementById("figure");',
        `  frame.src = await embedUrl(source, { lang: "${lang}" });`,
        "</script>",
      ].join("\n");
  }
}

/**
 * 見本帳と同じ置き場の頁を開くiframe。中の頁の最初の要素の高さに合わせて伸び縮みし、帯から再生の操作までを切らずに見せる。
 * 中の頁の`body`は`min-height: 100%`でiframeの高さまで伸びるので、`body`ではなく最初の要素 (`#root`か図の枠) を測る。
 * scriptの1行の入口は塊を図の枠に置き換えるので、`body`の子が替わったら測る要素を替える。
 * 中の要素はiframeの側の型を持ち`instanceof`で見分けられないので、高さの値で見る
 */
function SameSiteFrame({ src, title }: { src: string; title: string }): ReactElement {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const element = frame.current;
    if (element === null) return;
    let resize: ResizeObserver | undefined;
    let children: MutationObserver | undefined;
    const fit = (): void => {
      const body = element.contentDocument?.body;
      if (!body) return;
      const measure = (): void => {
        const height = (body.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0;
        if (height > 0) element.style.height = `${height}px`;
      };
      const watch = (): void => {
        resize?.disconnect();
        resize = new ResizeObserver(measure);
        if (body.firstElementChild) resize.observe(body.firstElementChild);
        measure();
      };
      children?.disconnect();
      children = new MutationObserver(watch);
      children.observe(body, { childList: true });
      watch();
    };
    element.addEventListener("load", fit);
    return () => {
      element.removeEventListener("load", fit);
      resize?.disconnect();
      children?.disconnect();
    };
  }, [src]);
  return <iframe ref={frame} className="embedding-frame" title={title} src={src} allow="clipboard-write" />;
}

/** scriptの1行。見本帳に写した入口を読む頁をiframeで開く */
function ScriptFigure({ lang, title }: { lang: Lang; title: string }): ReactElement {
  return <SameSiteFrame src={`${BASE}script/demo.html?lang=${lang}`} title={title} />;
}

/** SDKの関数。`mountDragon`で要素に置く */
function NpmFigure({ source, lang }: { source: string; lang: Lang }): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (host.current === null) return;
    const placed = mountDragon(host.current, source, { lang });
    return () => placed.destroy();
  }, [source, lang]);
  return <div ref={host} data-embed="figure" />;
}

/** Web Component。登録した`<dragon-diagram>`の中に記法を書いて置く */
function ElementFigure({ source }: { source: string }): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (host.current === null) return;
    defineDragonElement();
    const element = document.createElement("dragon-diagram");
    element.textContent = source;
    host.current.replaceChildren(element);
    return () => element.remove();
  }, [source]);
  return <div ref={host} />;
}

/** iframe。`embedUrl`で作った埋め込みの頁を開く */
function IframeFigure({ source, lang, title }: { source: string; lang: Lang; title: string }): ReactElement {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void embedUrl(source, { base: `${location.origin}${BASE}`, lang }).then((made) => {
      if (live) setUrl(made);
    });
    return () => {
      live = false;
    };
  }, [source, lang]);
  return url === null ? <div className="embedding-frame" /> : <SameSiteFrame src={url} title={title} />;
}

/** 置き方`way`の図 */
function FigureOf({ way, source, lang }: { way: Way; source: string; lang: Lang }): ReactElement {
  const title = titleOf(source);
  switch (way) {
    case "script":
      return <ScriptFigure key={lang} lang={lang} title={title} />;
    case "npm":
      return <NpmFigure source={source} lang={lang} />;
    case "element":
      return <ElementFigure source={source} />;
    case "iframe":
      return <IframeFigure source={source} lang={lang} title={title} />;
  }
}

export function EmbedSample({ lang }: { lang: Lang }): ReactElement {
  const t = TEXT[lang].site.embedding;
  const source = sampleOf(lang);
  return (
    <div className="embedding">
      <header className="embedding-hero">
        <span className="embedding-eyebrow">{t.eyebrow}</span>
        <h1>{TEXT[lang].site.screens.embedding.title}</h1>
        <p className="embedding-lead">{t.lead}</p>
        <a className="embedding-back" href={`${PATHS.docs}#embed`} onClick={(e) => follow(e)}>
          {t.back}
        </a>
      </header>

      <section className="embedding-notation" aria-labelledby="embedding-notation">
        <h2 id="embedding-notation">{t.notation}</h2>
        <pre>
          <code>{source}</code>
        </pre>
      </section>

      <ol className="embedding-ways">
        {WAYS.map((way, index) => (
          <li key={way} className="embedding-way" data-embed-way={way}>
            <div className="embedding-way-head">
              <span className="embedding-way-no">{String(index + 1).padStart(2, "0")}</span>
              <h2>{t.ways[way].name}</h2>
              <p>{t.ways[way].note}</p>
            </div>
            <div className="embedding-way-body">
              <pre className="embedding-code">
                <code>{codeOf(way, source, lang)}</code>
              </pre>
              <div className="embedding-figure">
                <FigureOf way={way} source={source} lang={lang} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
