// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, expect, expectTypeOf, test, vi } from "vitest";
import type { CheckoutState } from "../src/checkout/model.mjs";
import type { CheckoutState as SourceCheckoutState } from "../src/checkout/types";
import { createCheckoutModel } from "../src/checkout/model.mjs";
import { parseCheckout } from "../src/checkout/read";
import { mountCheckoutRuntime } from "../src/checkout/runtime.mjs";
import { skin } from "../src/checkout/skin";

const source = readFileSync(`${process.cwd()}/packages/dragon/examples/checkout/acp-purchase.dragon`, "utf8");
const parsed = parseCheckout(source);
if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors));
const definition = parsed.definition;
const mounted: ReturnType<typeof mountCheckoutRuntime>[] = [];
const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");

test("モデル宣言と操作画面の状態型が同じ照会中の状態を持つ", () => {
  expectTypeOf<CheckoutState>().toEqualTypeOf<SourceCheckoutState>();
  expectTypeOf<"reconciling">().toExtend<CheckoutState["phase"]>();
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: () => ({ finished: Promise.resolve(), cancel() {} }),
  });
});
afterEach(() => {
  for (const controller of mounted.splice(0)) controller.destroy();
  document.body.replaceChildren();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, "animate");
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mount(reduceMotion = false) {
  vi.stubGlobal("matchMedia", () => ({ matches: reduceMotion }));
  const host = document.createElement("div");
  document.body.append(host);
  const controller = mountCheckoutRuntime(host, definition, {
    drawFlow: () => ({ svg: "<svg></svg>", timeline: { total: 1, last: 1 } } as never),
  });
  mounted.push(controller);
  const root = host.shadowRoot!;
  const element = <T extends HTMLElement = HTMLElement>(id: string) => root.getElementById(id) as T;
  const click = (id: string) => element<HTMLButtonElement>(id).click();
  const standard = root.querySelector<HTMLInputElement>('input[name="delivery"][value="standard"]')!;
  const chooseStandard = () => {
    standard.checked = true;
    standard.dispatchEvent(new Event("change", { bubbles: true }));
  };
  return { host, controller, root, element, click, chooseStandard };
}

test("再計算と決済の待機表示を実際の状態に同期し、承認待ちでは回さない", () => {
  const { controller, element, click, chooseStandard } = mount();
  expect(element("coach").dataset.busy).toBe("false");
  chooseStandard();
  expect(controller.getState().phase).toBe("quoting");
  expect(element("coach").dataset.busy).toBe("true");
  expect(element("scene-title").textContent).toBe("販売事業者が購入条件を再計算しています");
  expect(element("quote").getAttribute("aria-busy")).toBe("true");
  expect(element("approve").getAttribute("aria-busy")).toBe("true");
  expect(element("coach").hasAttribute("aria-busy")).toBe(false);
  vi.advanceTimersByTime(1699);
  expect(element("coach").dataset.busy).toBe("true");
  vi.advanceTimersByTime(1);
  expect(controller.getState().phase).toBe("ready");
  expect(element("coach").dataset.busy).toBe("false");
  expect(element("quote").getAttribute("aria-busy")).toBe("false");
  expect(element("approve").getAttribute("aria-busy")).toBe("false");
  click("approve");
  expect(element("scene-title").textContent).toBe("購入者がこの条件を承認しました");
  expect(element("coach").dataset.busy).toBe("false");
  click("buy");
  expect(element("coach").dataset.busy).toBe("true");
  expect(element("buy").getAttribute("aria-busy")).toBe("true");
  vi.advanceTimersByTime(3800);
  expect(controller.getState().phase).toBe("ordered");
  expect(element("coach").dataset.busy).toBe("false");
  expect(element("buy").getAttribute("aria-busy")).toBe("false");
});

function lostPurchase(view: ReturnType<typeof mount>) {
  view.chooseStandard();
  vi.advanceTimersByTime(1700);
  view.click("approve");
  view.controller.dispatch({ type: "MODE", mode: "lost" });
  view.click("buy");
  vi.advanceTimersByTime(3800);
  expect(view.controller.getState().phase).toBe("unknown");
}

test("注文照会の返答を待つ間だけ回し、連打しても決済と注文を増やさない", () => {
  const view = mount();
  lostPurchase(view);
  expect(view.element("coach").dataset.busy).toBe("false");
  expect(view.element("reconcile").getAttribute("aria-busy")).toBe("false");
  const order = view.controller.getState().order;
  view.click("reconcile");
  expect(view.controller.getState().phase).toBe("reconciling");
  expect(view.element("coach").dataset.busy).toBe("true");
  expect(view.element("reconcile").getAttribute("aria-busy")).toBe("true");
  expect(view.element<HTMLButtonElement>("reconcile").disabled).toBe(true);
  expect(view.element("phase-label").textContent).toBe("注文結果を確認中");
  view.controller.dispatch({ type: "RECONCILE_START" });
  view.controller.dispatch({ type: "BUY" });
  vi.advanceTimersByTime(1199);
  expect(view.controller.getState().phase).toBe("reconciling");
  vi.advanceTimersByTime(1);
  expect(view.controller.getState().phase).toBe("ordered");
  expect(view.controller.getState().chargeCount).toBe(1);
  expect(view.controller.getState().order).toEqual(order);
  expect(view.element("coach").dataset.busy).toBe("false");
  expect(view.element("reconcile").getAttribute("aria-busy")).toBe("false");
});

test("注文照会中にリセットすると古い返答を無視し、待機表示も解除する", () => {
  const view = mount();
  lostPurchase(view);
  view.click("reconcile");
  const oldSession = view.controller.getState().session;
  view.click("reset");
  vi.advanceTimersByTime(10000);
  view.controller.dispatch({ type: "RECONCILE", session: oldSession });
  expect(view.controller.getState().phase).toBe("over_budget");
  expect(view.controller.getState().chargeCount).toBe(0);
  expect(view.controller.getState().order).toBeNull();
  expect(view.element("coach").dataset.busy).toBe("false");
  expect(view.element("reconcile").getAttribute("aria-busy")).toBe("false");
});

test("破棄時に注文照会のタイマーとローディング表示を残さない", () => {
  const view = mount();
  lostPurchase(view);
  view.click("reconcile");
  const state = view.controller.getState();
  view.controller.destroy();
  vi.advanceTimersByTime(10000);
  expect(view.controller.getState()).toEqual(state);
  expect(view.root.childNodes).toHaveLength(0);
});

test("動きを減らす設定でも待機状態と静止した円の表示を残す", () => {
  const view = mount(true);
  view.chooseStandard();
  expect(view.element("lab").dataset.reducedMotion).toBe("true");
  expect(view.element("coach").dataset.busy).toBe("true");
  expect(view.root.querySelector(".coach-dot")?.getAttribute("aria-hidden")).toBe("true");
  expect(skin).toMatch(/\.lab\[data-reduced-motion=true\][^{]+\{animation:none!important\}/);
  expect(skin).toContain("@media(prefers-reduced-motion:reduce)");
  vi.advanceTimersByTime(1700);
  expect(view.element("coach").dataset.busy).toBe("false");
});

test("従来の直接照会を保ち、照会中は購入条件やケースを変更しない", () => {
  const model = createCheckoutModel(definition);
  let state = model.transition(model.initialState(), { type: "TERMS", delivery: "standard" });
  state = model.transition(state, { type: "QUOTE_READY", session: state.session, revision: state.revision });
  state = model.transition(state, { type: "APPROVE" });
  state = model.transition(state, { type: "MODE", mode: "lost" });
  state = model.transition(state, { type: "BUY" });
  state = model.transition(state, { type: "TOKEN_READY", session: state.session, attempt: state.attempt });
  state = model.transition(state, { type: "SETTLE", session: state.session, attempt: state.attempt });
  expect(model.transition(state, { type: "RECONCILE" }).phase).toBe("ordered");
  const pending = model.transition(state, { type: "RECONCILE_START" });
  expect(model.viewOf(pending).lockedInputs).toBe(true);
  for (const event of [{ type: "TERMS", qty: 2 }, { type: "BUDGET", value: 40000 }, { type: "MODE", mode: "normal" }, { type: "RECONCILE_START" }]) {
    expect(model.transition(pending, event)).toBe(pending);
  }
});
