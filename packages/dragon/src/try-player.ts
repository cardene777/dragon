/**
 * 試す図 (`try`、#3337) の再生の部品の操作。
 *
 * 再生の部品 (`player.ts`) は試す図を、書き手の最初の段だけを持つ原本 (今の原本) で描き、この file の操作を図の下と図の上に置く。
 * 図の下の入力の帯 (`form[data-dragon="ask"]`) には、欄ごとの入力と送る釦と、置き場 (`at`) を書かない釦 (`press`) を並べる。
 * 選択肢を持たない文字の欄は `TYPED_MOST` 字までしか打てず、図は打った名前を切らずに出す (#3458)。
 * 置き場を書いた釦は図の上のその部品の題の右に置き、寄って追う図か、帯の中身の幅が `LOOK.player.narrow` より狭い時は帯へ移す。
 * 空の待ち行列から取り出す釦と、満杯の待ち行列へ送る送る釦は押せなくし、押せない訳を `[data-dragon="reason"]` に出す。
 * 送る先の待ち行列が `accept` に書いていない名前を入れた送る釦と、2 つ以上の待ち行列のどれかが `take` 件に満たない釦も同じく押せなくする (#3453)。
 * 網の節の関門 (#3476) で止まる値は待ち行列に入らないので、送る先が満杯か受け入れないかを問わずに送れる。止まった段の本文は止まった節とエラーの名前を書く。
 * 機械の列が `edit` を持つ時、ブロックの中のチップを押すと書き換える欄 (`form[data-dragon="edit"]`) を出す。
 * 送る、押す、書き換えるたびに、記法と同じ出来事を 1 つ持つ段を渡した言葉の題と本文で作り、再生の部品へ渡す。
 * 押せるかと訳は今の原本の最後の段の状態 (`layout.states`) から読む。読み手の値はどこにも保存しない。
 * 操作の要素は描き直しても作り直さず、押した物は帯と図の上の層の 2 か所で受けるので、釦を移しても受け方は変わらない。
 * この file は試す図の描く部品と同じ塊 (`kinds/try.ts`) に入り、軽い入口では試す図を読んだ時に届く。
 * 再生の部品は試す図を描けた後にだけ操作を置くので、操作を置く時には塊が届いている。見た目は操作を置く時に頁へ 1 度だけ入れる。
 */
import { pressSpot } from "./blocks/press/draw";
import type { TryLayout } from "./kinds/try/layout";
import { TRY_LOOK } from "./look/try";
import { LOOK, TYPE } from "./look/values";
import { cssFont as font } from "./render/parts";
import type { DiagramModel, Step, TryPart } from "./schema";
import { accepts, askFields, fromsOf, intoOf, stopOf, type TryState } from "./try-state";
import { TRY_TEXT } from "./try-text";
import type { NotationLang } from "./words";

type Part<T extends TryPart["type"]> = Extract<TryPart, { type: T }>;
/** 入力の帯と書き換えの欄。選択肢を持つ欄は選ぶ欄、持たない欄は文字の欄 (#3422) */
type FieldInput = HTMLInputElement | HTMLSelectElement;

const px = (v: number): string => `${v}px`;
const percent = (v: number): string => `${v * 100}%`;

/** チップの名前に使える字。原本はチップを名札で名指すので、名札に使えない字 (空白、`[`、`]`、`「`、`」`、`=`、`:`) を断る */
const NAME = /^[^\s[\]「」=:]+$/u;

/** 文字の欄に打てる字数。図はチップの名前を切らずに出すので、読み手が打つ値をここで限る (#3458) */
const TYPED_MOST = 12;

/** 入力の帯と書き換える欄と、図の上の釦の見た目。操作を置く時に頁へ 1 度だけ入れる */
function tryCss(): string {
  const P = LOOK.player;
  const A = P.ask;
  const hair = px(LOOK.stroke.hair);
  // 送る釦と決める釦と入力の縁は、図のチップとブロックと同じ色で塗る
  const tint = `var(--c-${TRY_LOOK.color.part})`;
  return [
    `.dg-try{display:flex;flex-direction:column;gap:${px(P.gap / 2)}}`,
    `.dg-ask{container:dg-ask/inline-size;margin:0;padding:${px(A.pad)};border:${hair} solid var(--hair);border-radius:${px(P.radius)};background:var(--sunk)}`,
    ".dg-ask[hidden]{display:none}",
    `.dg-ask-row{display:flex;flex-wrap:wrap;align-items:flex-end;gap:${px(P.gap)}}`,
    `.dg-field{display:flex;flex-direction:column;gap:${px(A.label)};flex:1 1 ${px(A.field)};min-width:0}`,
    `.dg-fl{${font(TYPE.askLabel)};color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`,
    `.dg-in{box-sizing:border-box;width:100%;height:${px(P.touch)};margin:0;padding:0 ${px(A.inset)};border:${hair} solid var(--line);border-radius:${px(A.radius)};background:var(--surf);color:var(--ink);${font(TYPE.askInput)}}`,
    `.dg-in:focus{outline:${hair} solid ${tint};border-color:${tint}}`,
    `.dg-act{box-sizing:border-box;flex:none;min-width:${px(P.touch)};min-height:${px(P.touch)};margin:0;padding:0 ${px(A.side)};border:${hair} solid var(--line);border-radius:${px(A.radius)};background:var(--surf);color:var(--ink);${font(TYPE.button)};cursor:pointer}`,
    `.dg-act:focus-visible{outline:${px(P.focus)} solid var(--c-blue);outline-offset:${px(P.focus)}}`,
    `.dg-act:is([data-dragon="send"],[data-dragon="apply"]){border-color:${tint};background:${tint};color:var(--on-c)}`,
    `.dg-act:disabled{opacity:${A.dim};cursor:not-allowed}`,
    `.dg-why{margin:0;${font(TYPE.askReason)};color:var(--t-amber);white-space:pre-line}`,
    ".dg-why:empty{display:none}",
    // 図の上の釦の層は図 (SVG) と同じ所と大きさに置き、釦の位置を図の寸法の割合で決める。層は図のチップへの押下を遮らない
    ".dg-player[data-try] .dg-frame{position:relative}",
    ".dg-ats{position:absolute;left:0;top:0;pointer-events:none}",
    `.dg-ats .dg-act{position:absolute;min-height:${px(P.button)};height:${px(P.button)};transform:translateY(-50%);pointer-events:auto;white-space:nowrap}`,
    `@media (pointer: coarse){.dg-ats .dg-act{min-height:${px(P.touch)};height:${px(P.touch)}}}`,
    ".dg-player [data-chip][data-editable]{cursor:pointer}",
    // 狭い帯 (携帯の幅) では欄と釦を 2 列の升に並べ、どれも帯の幅に収める
    `@container dg-ask (width < ${px(P.narrow)}){.dg-ask-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:end}.dg-act{width:100%;min-width:0}}`,
    // 角を落とす色味は、帯と入力と釦の角を丸めない (#3344)
    '.dg-player[data-corner="cut"] :is(.dg-ask,.dg-in,.dg-act){border-radius:0}',
  ].join("");
}

/** 見た目を頁に入れる。再生の部品の見た目 (`dragon-player-css`) の後ろに置く */
function ensureTryCss(doc: Document): void {
  if (doc.getElementById("dragon-try-css")) return;
  const style = doc.createElement("style");
  style.id = "dragon-try-css";
  style.textContent = tryCss();
  doc.head.appendChild(style);
}

/** 書き出した頁で試す図の操作が出しうる字。字の file に残す */
export function tryTexts(model: DiagramModel, lang: NotationLang): string[] {
  const w = TRY_TEXT[lang];
  const parts = model.try?.parts ?? [];
  return [
    ...parts.map((p) => p.id),
    ...askFields(parts),
    "0123456789",
    w.trySend,
    w.tryApply,
    w.tryClose,
    w.tryBlank,
    w.tryBlankEdit,
    w.tryFull("", 0),
    w.tryEmpty("", ""),
    // 待ち行列の accept と、2 つ以上の待ち行列から集める釦 (#3453) の、押せない訳と押した段の本文
    ...(parts.some((p) => p.type === "queue" && p.accept !== undefined) ? [w.tryRefused("", "")] : []),
    ...(parts.some((p) => p.type === "press" && fromsOf(p).length > 1)
      ? [w.tryShort("", "", 0), w.tryGatheredBody(1, ["", ""], 0), w.tryGatheredBody(2, ["", ""], 0), w.tryGatheredRecordBody(1, ["", ""], "", 0), w.tryGatheredRecordBody(2, ["", ""], "", 0)]
      : []),
    // 網の節の関門 (#3476) の、止まった記録の字と止まった段の本文
    ...(model.try?.checks ?? []).flatMap((c) => [c.node, c.no, w.tryStoppedAt(c.node), w.tryStoppedBody("", c.node, c.no), c.retry ? w.tryRetry : w.tryResend]),
    w.tryBadName(""),
    w.tryEditField("", ""),
    w.trySent(""),
    w.trySentBody("", "", ""),
    w.trySentBody("", ""),
    w.tryPressed(""),
    w.tryPressedBody(1, "", 0),
    w.tryPressedBody(2, "", 0),
    // 記録の列 (#3441) の、読み手が足す記録の番号と印と、押した段の本文
    ...parts.flatMap((p) =>
      p.type === "log"
        ? [w.tryRecord(0), w.tryFoldedRecords(1), w.tryFoldedRecords(2), w.tryPressedRecordBody(1, "", "", 0), w.tryPressedRecordBody(2, "", "", 0), ...(p.all ? [p.all.yes, p.all.no] : [])]
        : [],
    ),
    w.tryEdited("", ""),
    w.tryEditedBody("", "", ""),
  ];
}

export interface TryControls {
  /** 図の下に置く帯。入力の帯と、開いている間の書き換える欄と、押せない訳を持つ */
  readonly tools: HTMLElement;
  /** 図の上に置く釦の層。図の枠の中に置く */
  readonly layer: HTMLElement;
  /** 今の原本を描いた置き場所で、押せるかと押せない訳と、図の上の釦の位置を決め直す */
  update(layout: TryLayout): void;
  /** 置き場を書いた釦を図の上と帯のどちらに置くかを選ぶ。`fallback` は帯の幅を測れない時に使う幅 */
  arrange(view: string, fallback: number): void;
  /** 図の上の釦の層を、図 (SVG) と同じ所と大きさにする */
  fit(frame: HTMLElement, svg: SVGSVGElement): void;
  /** 段 `step` の図で、書き換えられるチップ (ブロックの中のチップ) に印を付ける */
  mark(svg: SVGSVGElement, step: number): void;
  /** 図のチップ `item` を押した。段 `step` でブロックの中に居るチップなら書き換える欄を出す */
  pick(item: string, step: number): void;
  /** 段を足せなかった訳を出す */
  refuse(message: string): void;
  destroy(): void;
}

/**
 * 試す図の操作を作る。`model` は今の原本を描いた形、`layout` はその置き場所。
 * `add` は読み手の操作で作った段を受け取り、今の原本に足して描き直せた時に真を返す
 */
export function mountTryControls(
  doc: Document,
  model: DiagramModel,
  layout: TryLayout,
  lang: NotationLang,
  add: (step: Step) => boolean,
): TryControls {
  ensureTryCss(doc);
  const words = TRY_TEXT[lang];
  const parts = model.try?.parts ?? [];
  const ask = parts.find((p): p is Part<"ask"> => p.type === "ask");
  const presses = parts.filter((p): p is Part<"press"> => p.type === "press");
  /** 機械の列ごとの、読み手が書き換えられる欄 */
  const edits = new Map(
    parts.flatMap((p) =>
      p.type === "chain" && p.edit !== undefined ? [[p.id, p.edit] as const] : [],
    ),
  );
  const fields = askFields(parts);
  /** 送る先を受け入れる名前で限る待ち行列が在るか (#3453)。在れば、名前の欄を打ち直すたびに送れるかを決め直す */
  const limited = parts.some((p) => p.type === "queue" && p.accept !== undefined);
  /** 網の節の関門 (#3476) と、関門を置く入力の帯の網。関門を持つ図は、どの欄を打ち直しても送れるかを決め直す */
  const checks = model.try?.checks ?? [];
  const via = parts.find((p): p is Part<"route"> => p.type === "route" && p.id === ask?.via);
  let current = layout;
  /** 押した時の断り (空の欄など)。次に描き直すか打ち込むまで出す */
  let notice = "";
  /** 押せない釦の訳 */
  let blocked: string[] = [];
  /** 置き場を書いた釦を図の上に置いているか */
  let over = false;

  const button = (role: string, text: string, type: "submit" | "button"): HTMLButtonElement => {
    const b = doc.createElement("button");
    b.type = type;
    b.className = "dg-act";
    b.dataset.dragon = role;
    b.textContent = text;
    return b;
  };
  /** 欄ごとの選択肢 (#3422)。選択肢を持つ欄は打たせず選ばせる */
  const choices = ask?.choices ?? {};
  /**
   * 欄 `name` の札と欄。選択肢を持つ欄は選択肢を書いた順に並べた選ぶ欄で、`value` が選択肢に無ければ最初の選択肢を選ぶ。
   * 選択肢を持たない欄は `TYPED_MOST` 字まで打てる文字の欄
   */
  const field = (name: string, label: string, value = ""): { label: HTMLLabelElement; input: FieldInput } => {
    const box = doc.createElement("label");
    box.className = "dg-field";
    const caption = doc.createElement("span");
    caption.className = "dg-fl";
    caption.textContent = label;
    const options = choices[name];
    let input: FieldInput;
    if (options) {
      const select = doc.createElement("select");
      for (const option of options) {
        const o = doc.createElement("option");
        o.value = option;
        o.textContent = option;
        select.append(o);
      }
      select.value = options.includes(value) ? value : (options[0] ?? "");
      input = select;
    } else {
      const text = doc.createElement("input");
      text.type = "text";
      text.autocomplete = "off";
      text.maxLength = TYPED_MOST;
      text.value = value;
      input = text;
    }
    input.className = "dg-in";
    input.dataset.field = name;
    box.append(caption, input);
    return { label: box, input };
  };

  const tools = doc.createElement("div");
  tools.className = "dg-try";
  // 置いた頁の言葉と違っても、釦の字と押せない訳を渡した言葉の声で読ませる
  tools.setAttribute("lang", lang);
  const form = doc.createElement("form");
  form.className = "dg-ask";
  form.dataset.dragon = "ask";
  form.noValidate = true;
  form.setAttribute("aria-label", words.tryAsk);
  const row = doc.createElement("div");
  row.className = "dg-ask-row";
  form.append(row);
  const inputs = ask ? fields.map((name) => field(name, name)) : [];
  const send = ask ? button("send", words.trySend, "submit") : undefined;
  const pressed = new Map(
    presses.map((p) => {
      const b = button("press", p.id, "button");
      b.dataset.press = p.id;
      if (p.at !== undefined) b.dataset.at = p.at;
      return [p.id, b] as const;
    }),
  );
  row.append(...inputs.map((i) => i.label), ...(send ? [send] : []));
  const reason = doc.createElement("p");
  reason.className = "dg-why";
  reason.dataset.dragon = "reason";
  reason.setAttribute("aria-live", "polite");
  tools.append(form, reason);
  const layer = doc.createElement("div");
  layer.className = "dg-ats";
  let editor:
    { form: HTMLFormElement; input: FieldInput; item: string; field: string } | undefined;

  const lastState = (): TryState | undefined => current.states[current.states.length - 1];
  const say = (): void => {
    reason.textContent = [notice, ...blocked].filter((t) => t !== "").join("\n");
  };
  const refuse = (message: string): void => {
    notice = message;
    say();
  };

  /** 釦を置く図の上の所。図の上に置かない釦 (置き場を書かない釦、題を持たない部品に置く釦、帯へ移した釦) は `undefined` */
  const spotFor = (p: Part<"press">): { x: number; y: number } | undefined =>
    over && p.at !== undefined ? pressSpot(current, p.at) : undefined;
  /** 図の上の釦を、置き場の部品の題の右に置く。置き場所は描き直すと変わりうるので、描き直すたびに決め直す */
  const position = (): void => {
    for (const p of presses) {
      const b = pressed.get(p.id) as HTMLButtonElement;
      const spot = spotFor(p);
      if (spot) {
        b.style.left = `calc(${percent(spot.x / current.width)} + ${px(LOOK.player.ask.at)})`;
        b.style.top = percent(spot.y / current.height);
      } else {
        b.style.removeProperty("left");
        b.style.removeProperty("top");
      }
    }
  };
  /**
   * 釦を書いた順に帯か図の上の層へ並べる。並べる所が変わった時 (幅が変わった時) だけ呼び、
   * 描き直すたびには動かさない。押した釦と打ち込み中の欄から、押したり打ち込んだりする先 (focus) を外さないため
   */
  const move = (): void => {
    for (const p of presses)
      (spotFor(p) ? layer : row).append(pressed.get(p.id) as HTMLButtonElement);
    form.hidden = row.childElementCount === 0;
    position();
  };

  /** 入力の帯の今の値 */
  const typed = (): string[] => inputs.map((i) => i.input.value.trim());
  /** 送る先の待ち行列。`into` に欄を書いた入力の帯は、その欄に今選んでいる値の待ち行列 (#3441) */
  const target = (): string =>
    ask ? intoOf(ask, typed(), (id) => parts.some((p) => p.id === id)) : "";
  /** 今の値のチップが止まる関門 (#3476)。空の欄がある間は決めない */
  const stopped = (values: readonly string[]) =>
    via && values.every((v) => v !== "") ? stopOf(checks, via, fields, values) : undefined;
  const update = (next: TryLayout): void => {
    current = next;
    const last = lastState();
    const reasons: string[] = [];
    if (ask && send) {
      const into = target();
      const most = next.parts.find((p) => p.id === into)?.most ?? Number.POSITIVE_INFINITY;
      // 名前を入れる前は受け入れるかを問わない。空の欄は送る時に断る。関門で止まる値は待ち行列に入らないので、受け入れと満杯を問わない (#3476)
      const name = inputs[0]?.input.value.trim() ?? "";
      const passing = stopped(typed()) === undefined;
      const refused = passing && name !== "" && !accepts(parts.find((p) => p.id === into), name);
      const full = passing && (last?.queues[into]?.length ?? 0) >= most;
      send.disabled = refused || full;
      if (refused) reasons.push(words.tryRefused(into, name));
      if (full) reasons.push(words.tryFull(into, most));
    }
    for (const p of presses) {
      const b = pressed.get(p.id) as HTMLButtonElement;
      const froms = fromsOf(p);
      // 1 つの待ち行列から取り出す釦は 1 件でもあれば押せ、2 つ以上から集める釦はどれにも take 件要る (#3453)
      const need = froms.length > 1 ? p.take : 1;
      const short = froms.find((id) => (last?.queues[id]?.length ?? 0) < need);
      b.disabled = short !== undefined;
      if (short !== undefined)
        reasons.push((last?.queues[short]?.length ?? 0) === 0 ? words.tryEmpty(short, p.id) : words.tryShort(short, p.id, p.take));
    }
    blocked = reasons;
    notice = "";
    say();
    position();
  };

  const closeEdit = (): void => {
    editor?.form.remove();
    editor = undefined;
  };
  const openEdit = (item: string, name: string): void => {
    closeEdit();
    const value = lastState()?.items[item]?.[fields.indexOf(name)] ?? "";
    const editForm = doc.createElement("form");
    editForm.className = "dg-ask";
    editForm.dataset.dragon = "edit";
    editForm.dataset.item = item;
    editForm.noValidate = true;
    editForm.setAttribute("aria-label", words.tryEditForm);
    const editRow = doc.createElement("div");
    editRow.className = "dg-ask-row";
    const box = field(name, words.tryEditField(item, name), value);
    editRow.append(
      box.label,
      button("apply", words.tryApply, "submit"),
      button("close", words.tryClose, "button"),
    );
    editForm.append(editRow);
    tools.insertBefore(editForm, reason);
    editor = { form: editForm, input: box.input, item, field: name };
    box.input.focus();
    // 文字の欄は今の値を選んだ状態にして打ち直させる。選ぶ欄は今の値を選んで開く
    if (box.input.tagName === "INPUT") (box.input as HTMLInputElement).select();
  };

  const sendValues = (): void => {
    if (!ask || !send || send.disabled) return;
    const values = typed();
    if (values.some((v) => v === "")) return refuse(words.tryBlank);
    const name = values[0] ?? "";
    if (!NAME.test(name)) return refuse(words.tryBadName(fields[0] ?? ""));
    const stop = stopped(values)?.check;
    add({
      title: words.trySent(name),
      body: stop ? words.tryStoppedBody(name, stop.node, stop.no) : words.trySentBody(name, target(), ask.via),
      events: [{ type: "ask", values }],
    });
  };
  const press = (id: string | undefined): void => {
    const p = presses.find((x) => x.id === id);
    if (!p) return;
    const last = lastState();
    const froms = fromsOf(p);
    const waiting = froms.map((from) => last?.queues[from]?.length ?? 0);
    const records = last?.logs?.[p.into];
    const next = records ? records.length + 1 : (last?.chains[p.into]?.length ?? 0) + 1;
    // 2 つ以上の待ち行列から集める釦は、どの待ち行列にも take 件ある時だけ押せる (#3453)
    if (froms.length > 1) {
      if (waiting.some((n) => n < p.take)) return;
      add({
        title: words.tryPressed(p.id),
        body: records ? words.tryGatheredRecordBody(p.take, froms, p.into, next) : words.tryGatheredBody(p.take, froms, next),
        events: [{ type: "press", press: p.id }],
      });
      return;
    }
    const from = froms[0] ?? "";
    const count = Math.min(p.take, waiting[0] ?? 0);
    if (count === 0) return;
    add({
      title: words.tryPressed(p.id),
      body: records ? words.tryPressedRecordBody(count, from, p.into, next) : words.tryPressedBody(count, from, next),
      events: [{ type: "press", press: p.id }],
    });
  };
  const applyEdit = (): void => {
    if (!editor) return;
    const { item, field: name } = editor;
    const value = editor.input.value.trim();
    if (value === "") return refuse(words.tryBlankEdit);
    const from = lastState()?.items[item]?.[fields.indexOf(name)] ?? "";
    const added = add({
      title: words.tryEdited(item, name),
      body: words.tryEditedBody(name, from, value),
      events: [{ type: "item", item, values: { [name]: value } }],
    });
    if (added) closeEdit();
  };

  // 押した物は帯と図の上の層で受ける。釦を帯と層の間で移しても、描き直しても受け方が変わらない
  const onClick = (event: Event): void => {
    const target = (event.target as Element | null)?.closest?.("button");
    if (!target || target.disabled) return;
    const role = target.getAttribute("data-dragon");
    if (role === "press") press(target.getAttribute("data-press") ?? undefined);
    else if (role === "close") closeEdit();
  };
  const onSubmit = (event: Event): void => {
    event.preventDefault();
    if (event.target === form) sendValues();
    else if (editor && event.target === editor.form) applyEdit();
  };
  const onInput = (event: Event): void => {
    // into に書いた欄を選び直すと送る先の待ち行列が替わるので、送れるかを決め直す (#3441)。
    // 受け入れる名前を限る待ち行列が在る図は、名前の欄を打ち直しても決め直す (#3453)。関門を持つ図は、どの欄を打ち直しても決め直す (#3476)
    const changed = (event.target as HTMLElement | null)?.dataset?.field;
    if (ask && changed !== undefined && (changed === ask.into || (limited && changed === fields[0]) || checks.length > 0)) {
      update(current);
      return;
    }
    if (notice === "") return;
    notice = "";
    say();
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && editor?.form.contains(event.target as Node | null)) closeEdit();
  };
  tools.addEventListener("click", onClick);
  tools.addEventListener("submit", onSubmit);
  tools.addEventListener("input", onInput);
  tools.addEventListener("change", onInput);
  tools.addEventListener("keydown", onKey);
  layer.addEventListener("click", onClick);

  move();
  update(layout);

  /** 釦の層を図 (SVG) と同じ所と大きさにする */
  const fitLayer = (frame: HTMLElement, svg: SVGSVGElement): void => {
    const f = frame.getBoundingClientRect();
    const s = svg.getBoundingClientRect();
    layer.style.left = px(s.left - f.left - frame.clientLeft + frame.scrollLeft);
    layer.style.top = px(s.top - f.top - frame.clientTop + frame.scrollTop);
    layer.style.width = px(s.width);
    layer.style.height = px(s.height);
  };
  /**
   * 合わせた図。頁が図の幅だけを替えて縮める時 (見本帳の枠に合わせた倍率など) は枠の大きさが変わらず、
   * 再生の部品は合わせ直さない。図の大きさが替わるたびに層を合わせ直し、元の大きさの層が枠からはみ出さないようにする
   */
  let fitted: { frame: HTMLElement; svg: SVGSVGElement } | undefined;
  const Observer = (doc.defaultView as (Window & { ResizeObserver?: typeof ResizeObserver }) | null)
    ?.ResizeObserver;
  const resized = Observer
    ? new Observer(() => {
        if (fitted) fitLayer(fitted.frame, fitted.svg);
      })
    : undefined;

  return {
    tools,
    layer,
    update,
    arrange: (view, fallback) => {
      const inner = (tools.clientWidth || fallback) - (LOOK.player.ask.pad + LOOK.stroke.hair) * 2;
      const next = view === "fixed" && inner >= LOOK.player.narrow;
      if (next === over) return;
      over = next;
      move();
    },
    fit: (frame, svg) => {
      if (fitted?.svg !== svg) {
        if (fitted) resized?.unobserve(fitted.svg);
        resized?.observe(svg);
      }
      fitted = { frame, svg };
      fitLayer(frame, svg);
    },
    mark: (svg, step) => {
      if (edits.size === 0) return;
      const chains = current.states[step]?.chains ?? {};
      const editable = new Set(
        Object.entries(chains)
          .filter(([id]) => edits.has(id))
          .flatMap(([, blocks]) => blocks.flatMap((b) => b.items)),
      );
      for (const chip of svg.querySelectorAll("[data-chip]"))
        chip.toggleAttribute("data-editable", editable.has(chip.getAttribute("data-chip") ?? ""));
    },
    pick: (item, step) => {
      const chains = current.states[step]?.chains ?? {};
      const chain = Object.entries(chains).find(([, blocks]) =>
        blocks.some((b) => b.items.includes(item)),
      )?.[0];
      const name = chain === undefined ? undefined : edits.get(chain);
      if (name !== undefined) openEdit(item, name);
    },
    refuse,
    destroy: () => {
      resized?.disconnect();
      tools.removeEventListener("click", onClick);
      tools.removeEventListener("submit", onSubmit);
      tools.removeEventListener("input", onInput);
      tools.removeEventListener("keydown", onKey);
      layer.removeEventListener("click", onClick);
      tools.remove();
      layer.remove();
    },
  };
}
