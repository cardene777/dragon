/**
 * 印刷の形で紙に並べる段ごとの止め絵 (#3956)。
 *
 * 段のある図を印刷すると、全ての段の止め絵を段の順に並べ、各絵の下に段の番号と題と say の文を置く。
 * 止め絵は今の図を写し、その段の止め絵の時刻 (`--at`) で止める。段ごとの組 (#3846) はその段の組だけを見せる。
 * 止め絵の束は印刷する間だけ置く。印刷の前 (`beforeprint`) か印刷の形に切り替わった時に作り、印刷の後か画面の形に戻った時に外す。
 * 画面の間は図を写した物を頁に残さず、頁が数える図は今までどおり 1 つにする。
 * 再生の部品 (`player.ts`) と場面の図 (`scene-player.ts`) が使い、見た目の規則は再生の部品の規則が持つ
 */

/** 止め絵の下に置く段の題と say の文 */
export interface StillStep {
  title?: string;
  body?: string;
}

/** 印刷の前の知らせから印刷の後の知らせまでの間に在る窓。その間に置いた図は、置いた時に止め絵を作る */
const printing = new WeakSet<Window>();
/** 印刷の間を見張り始めた窓 */
const watched = new WeakSet<Window>();

/**
 * 窓の印刷の間を見張る。印刷の前の知らせを受けて隠したタブの図を描く頁 (`page-blocks.ts`) では、
 * 描いた図が置く見張りに同じ知らせが届かないので、置いた時に印刷の間かを読めるようにする。
 * 見張りは捕まえる段 (`capture`) で受け、同じ知らせのほかの受け手より先に印刷の間を記す
 */
function watchPrinting(win: Window): void {
  if (watched.has(win)) return;
  watched.add(win);
  win.addEventListener("beforeprint", () => printing.add(win), { capture: true });
  win.addEventListener("afterprint", () => printing.delete(win), { capture: true });
}

/**
 * 図 `figure` を写し、段ごとの止め絵の束を作る。
 * `times` は段ごとの止め絵の時刻 (流す速さで割った秒)、`number` は段の番号の字を返す
 */
export function drawStills(doc: Document, figure: SVGSVGElement, steps: readonly StillStep[], times: readonly number[], number: (i: number) => string): HTMLElement {
  const box = doc.createElement("div");
  box.className = "dg-print";
  box.dataset.dragon = "print-steps";
  // 画面では隠し、読み上げは段の一覧が読む
  box.setAttribute("aria-hidden", "true");
  steps.forEach((step, i) => {
    const still = doc.createElement("figure");
    still.className = "dg-still";
    still.dataset.dragon = "step-still";
    const copy = figure.cloneNode(true) as SVGSVGElement;
    copy.style.setProperty("--at", String(times[i] ?? 0));
    copy.style.setProperty("--play", "paused");
    copy.dataset.motion = "still";
    copy.removeAttribute("role");
    copy.setAttribute("aria-hidden", "true");
    for (const part of copy.querySelectorAll("[data-dg-only]")) part.toggleAttribute("hidden", part.getAttribute("data-dg-only") !== String(i));
    // 写した図の箱は押せない。Tab で選べる所を増やさない
    for (const part of copy.querySelectorAll("[tabindex]")) part.removeAttribute("tabindex");
    const caption = doc.createElement("figcaption");
    caption.className = "dg-still-c";
    const no = doc.createElement("span");
    no.className = "dg-still-no";
    no.textContent = number(i);
    const text = doc.createElement("div");
    text.className = "dg-still-txt";
    for (const [cls, value] of [
      ["dg-still-t", step.title],
      ["dg-still-b", step.body],
    ] as const) {
      if (!value) continue;
      const p = doc.createElement("p");
      p.className = cls;
      p.textContent = value;
      text.append(p);
    }
    caption.append(no, text);
    still.append(copy, caption);
    box.append(still);
  });
  return box;
}

/**
 * 印刷の前 (`beforeprint`) か印刷の形に切り替わった時に `make` を呼び、印刷の後 (`afterprint`) か画面の形に戻った時に `drop` を呼ぶ。
 * 置いた時に印刷の形か印刷の間なら今 `make` を呼ぶ。`make` は何度呼ばれても 1 度だけ作る形にしておく。返す関数は見張りを外す
 */
export function whenPrinting(win: Window | null, make: () => void, drop: () => void): () => void {
  if (!win) return () => undefined;
  watchPrinting(win);
  const media = win.matchMedia?.("print");
  const onMedia = (event: MediaQueryListEvent): void => (event.matches ? make() : drop());
  win.addEventListener("beforeprint", make);
  win.addEventListener("afterprint", drop);
  media?.addEventListener?.("change", onMedia);
  if (media?.matches || printing.has(win)) make();
  return () => {
    win.removeEventListener("beforeprint", make);
    win.removeEventListener("afterprint", drop);
    media?.removeEventListener?.("change", onMedia);
  };
}
