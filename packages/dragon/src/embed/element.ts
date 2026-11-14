/**
 * Web Componentの要素`<dragon-diagram>` (#3700)。
 *
 * 要素の中の字を記法として読み、要素の影の根に`mountDragon`で図を置く。中の字は影の根に描かないので、記法の字は頁に出ない。
 * 属性`header="false"`で帯を外し、属性`nonce`を設定として渡す。
 * 影の根の中からは要素の外の`lang`属性を辿れないので、要素から上で最初に空でない`lang`属性を読み、設定`lang`として渡す。
 * 属性と中の字が変わると置き直し、頁から外されると図を取り除く。
 * 4つの知らせは`mountDragon`が`composed`で送るので、要素の外で受けられる。
 *
 * 要素の型は`HTMLElement`を元にするため、`HTMLElement`の無いNodeでSDKの入口を読んでも落ちないよう、登録する時に作る。
 */
import { dedent } from "./dedent";
import type { DragonEmbed, EmbedOptions } from "./index";

/** 要素`<dragon-diagram>` */
export interface DragonDiagramElement extends HTMLElement {
  /** 置く記法。要素の中の字で、書き換えると置き直す */
  source: string;
  /** 置いた図。記法が無いか描けない時は無い */
  readonly embed: DragonEmbed | undefined;
}

/** 記法から図を置く関数。SDKの入口の`mountDragon` */
type Mount = (host: HTMLElement, source: string, options: EmbedOptions) => DragonEmbed;

/** 置き直す時に読む属性 */
const ATTRIBUTES = ["header", "lang", "nonce"] as const;

/** `lang`の値を帯の言葉にする。日本語でない値は英語 */
const pick = (value: string): "ja" | "en" => (value.trim().toLowerCase().split("-")[0] === "ja" ? "ja" : "en");

/** 要素を名前`name`で登録する。同じ名前が既に在る時と、`customElements`の無い所では何もしない */
export function registerElement(name: string, mount: Mount): void {
  const registry = globalThis.customElements;
  if (!registry || registry.get(name)) return;

  class Element extends HTMLElement implements DragonDiagramElement {
    static readonly observedAttributes = ATTRIBUTES;
    #embed: DragonEmbed | undefined;
    #stage: HTMLElement | undefined;
    #watch: MutationObserver | undefined;
    #queued = false;

    get source(): string {
      return this.textContent ?? "";
    }

    set source(value: string) {
      this.textContent = value;
    }

    get embed(): DragonEmbed | undefined {
      return this.#embed;
    }

    connectedCallback(): void {
      this.#watch ??= new MutationObserver(() => this.#schedule());
      this.#watch.observe(this, { childList: true, characterData: true, subtree: true });
      this.#schedule();
    }

    disconnectedCallback(): void {
      this.#watch?.disconnect();
      this.#clear();
    }

    attributeChangedCallback(_name: string, before: string | null, after: string | null): void {
      if (before !== after) this.#schedule();
    }

    /** 同じ時に続いた変更をまとめて 1 度だけ置き直す */
    #schedule(): void {
      if (this.#queued) return;
      this.#queued = true;
      queueMicrotask(() => {
        this.#queued = false;
        if (this.isConnected) this.#render();
      });
    }

    #clear(): void {
      this.#embed?.destroy();
      this.#embed = undefined;
      this.#stage?.remove();
      this.#stage = undefined;
    }

    #render(): void {
      this.#clear();
      const source = dedent(this.source).trim();
      if (source === "") return;
      const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const stage = this.ownerDocument.createElement("div");
      root.append(stage);
      this.#stage = stage;
      try {
        this.#embed = mount(stage, source, this.#options());
      } catch (error) {
        // 描けなかった知らせは mountDragon が送った。書いた人が誤りを読めるよう、要素の中にも出す
        const note = this.ownerDocument.createElement("pre");
        note.setAttribute("part", "error");
        note.setAttribute("role", "alert");
        note.style.whiteSpace = "pre-wrap";
        note.textContent = error instanceof Error ? error.message : String(error);
        stage.replaceChildren(note);
      }
    }

    #options(): EmbedOptions {
      const owner = this.closest('[lang]:not([lang=""])');
      const lang = owner ? pick(owner.getAttribute("lang") ?? "") : undefined;
      // CSPを持つ頁は置いた後に属性の字を消し、値を`nonce`の値にだけ残す
      const nonce = this.nonce || this.getAttribute("nonce") || undefined;
      return { header: this.getAttribute("header") !== "false", lang, nonce };
    }
  }

  registry.define(name, Element);
}
