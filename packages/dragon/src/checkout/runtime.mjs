import { createCheckoutModel } from './model.mjs';
import { template, skin } from './assets';

export function mountCheckoutRuntime(host, definition, options = {}) {
const document = host.ownerDocument;
const environment = document.defaultView;
if (!environment) throw new Error('checkout requires a browser document');
const scope = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
// 見た目は再生の部品が渡す口で図の影の根へ入れ、style要素を作らない (#3695)。口を渡さずに直に置いた時は影の根にstyle要素で入れる
scope.innerHTML = options.styles ? template : `<style>${skin}</style>${template}`;
options.styles?.adopt('dragon-checkout-css', skin, scope);
const { UNIT_PRICE, DELIVERY, QUANTITY, BUDGET, PRODUCT, PARTIES, initialState, transition, viewOf } = createCheckoutModel(definition);
let disposed = false;
const $ = id => scope.querySelector(`[id="${id}"]`);
const yen = n => `${n.toLocaleString('ja-JP')}円`;
const timers = new Set();
const effects = new Set();
let transferVersion = 0;
let pulseVersion = 0;
let inspectedActor = false;
const reduceMotion = environment.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
let state = initialState();
$('lab').dataset.reducedMotion = String(reduceMotion);

const heading = scope.querySelector('h1'); heading.textContent = definition.title;
scope.querySelector('.intro').textContent = definition.note;
scope.querySelector('.product-info h3').textContent = PRODUCT.name;
scope.querySelector('.product-category').textContent = PRODUCT.options.merchant;
scope.querySelector('.product-info p strong').textContent = yen(UNIT_PRICE);
scope.querySelector('.product-info p').lastChild.textContent = ` / 1${PRODUCT.options.unit}・税込み`;
scope.querySelector('.quantity small').textContent = `最大${QUANTITY.max}${PRODUCT.options.unit}`;
$('qty-down').setAttribute('aria-label', `数量を1${PRODUCT.options.unit}減らす`);
$('qty-up').setAttribute('aria-label', `数量を1${PRODUCT.options.unit}増やす`);
const of = kind => definition.blocks.find(block => block.kind === kind);
scope.querySelector('.flow-heading h2').textContent = of('flow').name;
scope.querySelector('.delivery-options legend').textContent = of('delivery').name;
scope.querySelector('.budget-head label').textContent = of('budget').name;
scope.querySelector('.quote-total > div > span').textContent = of('total').name;
$('budget').setAttribute('aria-label', of('budget').name);
for (const key of ['min','max','step']) $('budget').setAttribute(key, String(BUDGET[key]));
scope.querySelector('.range-ticks').replaceChildren(...[BUDGET.min, BUDGET.max].map(value => { const span = document.createElement('span'); span.textContent = yen(value); return span; }));
for (const button of scope.querySelectorAll('[data-actor]')) {
  const part = PARTIES[button.dataset.actor];
  button.querySelector('strong').textContent = part.name;
  button.querySelector('.actor-top small').textContent = part.options.note;
  button.querySelector('use').setAttribute('href', '#i-' + part.options.icon);
  button.dataset.dragonBlock = part.id;
}
for (const input of scope.querySelectorAll('input[name="mode"]')) {
  const part = definition.blocks.find(block => block.kind === 'scenario' && block.options.outcome === input.value);
  input.nextElementSibling.textContent = part.name;
  input.closest('label').dataset.dragonBlock = part.id;
}
for (const [kind, selector] of Object.entries({ product:'.product',delivery:'.delivery-options',budget:'.budget-head',total:'.quote',approval:'.approval',payment:'.permit',order:'.order-result',flow:'.flow-map' })) scope.querySelector(selector).dataset.dragonBlock = of(kind).id;
if (PRODUCT.options.art !== 'shoe') scope.querySelector('.product-art').innerHTML = '<svg aria-hidden="true"><use href="#i-bag"/></svg>';

for (const [id, method] of Object.entries(DELIVERY)) {
  const label = document.createElement('label');
  label.className = 'delivery-option';
  const input = document.createElement('input');
  input.type = 'radio'; input.name = 'delivery'; input.value = id; input.setAttribute('aria-label', method.name);
  const card = document.createElement('span'); card.className = 'delivery-card';
  const art = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); art.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '#i-' + method.icon); art.append(use);
  const name = document.createElement('strong'); name.textContent = method.name;
  const price = document.createElement('em'); price.textContent = method.fee.toLocaleString('ja-JP');
  const currency = document.createElement('small'); currency.textContent = '円'; price.append(currency);
  const note = document.createElement('small'); note.textContent = method.note;
  card.append(art, name, price, note); label.append(input, card);
  input.addEventListener('change', () => dispatch({ type: 'TERMS', delivery: id }));
  $('delivery-options').append(label);
}

function later(fn, delay) {
  const timer = environment.setTimeout(() => { timers.delete(timer); fn(); }, delay);
  timers.add(timer);
}

function sendLater(from, to, delay, color, label, amount) {
  const version = transferVersion;
  later(() => { if (version === transferVersion) pulse(from, to, color, label, amount); }, delay);
}

function emphasize(id, tone = 'good') {
  if (reduceMotion || $(id).hidden) return;
  const effect = $(id).animate([
    { transform: 'translateY(3px)', boxShadow: `0 0 0 4px ${tone === 'warning' ? '#cc935b55' : '#81a96b55'}` },
    { transform: 'translateY(0)', boxShadow: '0 0 0 0 transparent' },
  ], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' });
  effects.add(effect);
  effect.finished.then(() => effects.delete(effect), () => effects.delete(effect));
}

function dispatch(event) {
  const before = state;
  const next = transition(state, event);
  if (disposed || next === state) return;
  state = next;
  if (!['FOCUS', 'MODE'].includes(event.type)) {
    transferVersion++;
    pulseVersion++;
    for (const actor of scope.querySelectorAll('[data-actor]')) { delete actor.dataset.transfer; delete actor.dataset.bypass; }
    delete $('transfer').dataset.active;
    activeRoute = undefined;
  }
  if (event.type === 'RESET') {
    inspectedActor = false;
    for (const timer of timers) environment.clearTimeout(timer);
    timers.clear();
    activeRoute = undefined;
    for (const effect of effects) effect.cancel();
    effects.clear();
    for (const actor of scope.querySelectorAll('[data-actor]')) delete actor.dataset.transfer;
    delete $('transfer').dataset.active;
    $('transfer').textContent = '条件を変えると購入に関わるやり取りがここに現れます。';
  }
  render();
  const { session, revision, attempt } = state;
  if (event.type === 'TERMS') {
    pulse('buyer', 'agent', '#518563', '数量・配送の変更を伝える');
    sendLater('agent', 'seller', 800, '#518563', '新しい合計を問い合わせる');
    later(() => dispatch({ type: 'QUOTE_READY', session, revision }), 1700);
    if (before.approval) emphasize('approval', 'warning');
  } else if (event.type === 'QUOTE_READY') {
    pulse('seller', 'agent', '#518563', '再計算した購入条件を返す', state.quote.total);
    sendLater('agent', 'buyer', 900, '#518563', '最新の合計を提示する', state.quote.total);
    emphasize('quote');
  } else if (event.type === 'APPROVE') {
    pulse('buyer', 'agent', '#518563', 'この購入条件を承認する', state.approval.total);
    emphasize('approval');
  } else if (event.type === 'BUY') {
    pulse('agent', 'payment', '#518563', '支払いの委任を要求', state.approval.total);
    later(() => dispatch({ type: 'TOKEN_READY', session, attempt }), reduceMotion ? 120 : 900);
    later(() => dispatch({ type: 'SETTLE', session, attempt }), reduceMotion ? 450 : 3800);
  } else if (event.type === 'TOKEN_READY') {
    const amount = state.token.maxAmount;
    pulse('payment', 'agent', '#518563', '上限付きトークンを返す', amount);
    sendLater('agent', 'seller', 900, '#518563', 'トークンを渡す', amount);
    sendLater('seller', 'payment', 1800, '#518563', '決済を要求', amount);
    emphasize('permit');
  } else if (event.type === 'SETTLE') {
    pulse('payment', 'seller', state.phase === 'declined' ? '#b76743' : '#4e8761', state.phase === 'declined' ? '決済の拒否を返す' : '決済の成功を返す', before.token.maxAmount);
    emphasize('coach', state.phase === 'declined' ? 'warning' : 'good');
    if (state.order) emphasize('merchant-order');
    if (state.phase === 'ordered') {
      sendLater('seller', 'agent', 900, '#518563', '成立した注文を返す', state.order.total);
      sendLater('agent', 'buyer', 1800, '#518563', '注文成立を知らせる', state.order.total);
      emphasize('order-result');
    }
  } else if (event.type === 'RECONCILE_START') {
    pulse('agent', 'seller', '#518563', '同じ購入の結果を問い合わせる');
    later(() => dispatch({ type: 'RECONCILE', session }), 1200);
  } else if (event.type === 'RECONCILE') {
    pulse('seller', 'agent', '#518563', '既存の注文を返す', state.order.total);
    emphasize('order-result');
  } else if (event.type === 'BUDGET' && before.approval && !state.approval) {
    pulse('buyer', 'agent', '#c58d4c');
  }
}

function actorDescriptions(s, v) {
  return {
    buyer: v.approved ? `あなたが承認したのは${yen(s.approval.total)}・${DELIVERY[s.approval.delivery].name}です。予算を増やしても、承認した金額が自動で増えるわけではありません。` : `あなたの予算は${yen(s.budget)}です。予算内でも、購入条件を確認して承認するまでは購入を進めません。`,
    agent: s.phase === 'unknown' ? '店からの応答が届いていません。新しい購入を送るのではなく、同じ購入の状態を確認します。' : s.phase === 'reconciling' ? '同じ購入の最新状態を販売事業者に問い合わせています。追加の決済は行いません。' : s.phase === 'ordered' ? '店が返した注文を購入者へ伝えました。注文の確認と配送の完了は別です。' : v.pending ? '数量や配送の変更を販売事業者へ伝えています。販売事業者の新しい返答を待ち、手元の古い金額で確定しません。' : v.gap < 0 ? '返された合計が予算を超えているため、購入の完了を要求しません。条件の変更を待っています。' : v.approved ? '最新の購入条件が承認されています。この購入に使う支払い情報を用意できます。' : '販売事業者が返した最新の購入内容を示し、購入者の承認を待っています。',
    seller: s.order ? `店側では${yen(s.order.total)}の注文が1件成立しています。エージェントへ応答が届いたかどうかとは別の状態です。` : v.pending ? `変更を受けて販売条件を計算し直しています。この例では商品${yen(UNIT_PRICE)}×数量に、選んだ配送方法の送料を加えます。` : `商品と配送方法を確認し、合計${yen(s.quote.total)}を返しています。正式な購入内容を計算するのは販売事業者です。`,
    payment: s.token ? `今回の購入・${s.token.merchant}・上限${yen(s.token.maxAmount)}という条件で支払いを扱います。トークンの発行と決済の成功は別です。` : s.phase === 'declined' ? 'この決済は拒否しました。購入者が承認していても、決済が成功したことにはなりません。' : 'まだ支払いは要求されていません。購入者の承認を得た後にこの購入に限った支払いを処理します。',
  };
}

function render() {
  const s = state;
  const v = viewOf(s);
  const reconciling = s.phase === 'reconciling';
  const busy = v.pending || s.phase === 'processing' || reconciling;
  $('scene-title').textContent = v.title;
  $('scene-description').textContent = v.description;
  $('coach').dataset.tone = ['over_budget', 'unknown'].includes(s.phase) ? 'warning' : s.phase === 'declined' ? 'error' : ['approved', 'ordered'].includes(s.phase) ? 'good' : 'neutral';
  $('coach').dataset.busy = String(busy);
  $('phase-label').textContent = { quoting: '購入条件を更新', over_budget: '購入条件を確認', ready: '購入者の承認待ち', approved: '最新条件を承認済み', processing: '支払いを処理', declined: '決済が失敗', unknown: '購入結果は未確認', reconciling: '注文結果を確認中', ordered: '注文成立' }[s.phase];

  $('quantity').textContent = `${s.qty}${PRODUCT.options.unit}`;
  $('qty-down').disabled = v.lockedInputs || s.qty === QUANTITY.min;
  $('qty-up').disabled = v.lockedInputs || s.qty === QUANTITY.max;
  for (const input of scope.querySelectorAll('input[name="delivery"]')) {
    input.checked = input.value === s.delivery; input.disabled = v.lockedInputs;
  }
  $('quote').dataset.pending = String(v.pending);
  $('quote').setAttribute('aria-busy', String(v.pending));
  $('quote-badge').dataset.pending = String(v.pending);
  $('quote-badge').textContent = v.pending ? '更新中' : '最新';
  $('subtotal').textContent = v.pending ? '再計算中' : yen(s.quote.subtotal);
  $('shipping-fee').textContent = v.pending ? '—' : yen(s.quote.fee);
  $('total').innerHTML = v.pending ? '···' : `${s.quote.total.toLocaleString('ja-JP')}<small>円</small>`;
  $('quote-detail').textContent = v.pending ? '最新の返答を待っています' : `${DELIVERY[s.quote.delivery].name}・${s.quote.qty}${PRODUCT.options.unit}・税込み`;
  $('budget-gap').dataset.over = String(v.gap < 0);
  $('budget-gap').textContent = v.pending ? 'エージェントが変更を伝えています' : v.gap < 0 ? `予算を${yen(-v.gap)}超えています` : v.gap === 0 ? '送料込みで予算ちょうどです' : `予算まで${yen(v.gap)}あります`;
  $('budget').value = s.budget;
  $('budget').disabled = v.lockedInputs;
  $('budget').setAttribute('aria-valuetext', yen(s.budget));
  $('budget').style.background = `linear-gradient(to right,#6c9365 ${(s.budget - BUDGET.min) / (BUDGET.max - BUDGET.min) * 100}%,#d8e4cf 0)`;
  $('budget-value').innerHTML = `${s.budget.toLocaleString('ja-JP')}<small>円</small>`;

  $('approval').dataset.approved = String(v.approved);
  $('approval-status').textContent = v.approved ? `${yen(s.approval.total)}の条件を承認済み` : '最新の購入条件はまだ未承認';
  $('approval-mark').textContent = v.approved ? '✓ 承認済み' : '承認待ち';
  $('approval-detail').textContent = v.approved ? `${s.approval.qty}${PRODUCT.options.unit}・${DELIVERY[s.approval.delivery].name}を承認しています。数量や配送を変えると承認が無効になります。` : v.pending ? '販売事業者が返す新しい購入条件を待っています。' : `合計${yen(s.quote.total)}・${DELIVERY[s.quote.delivery].name}を確認して承認します。`;
  $('revoke').hidden = !v.approved || v.lockedInputs;
  $('approval-notice').hidden = !s.notice;
  $('approval-notice').textContent = s.notice;
  $('approve').disabled = !v.canApprove;
  $('approve').dataset.done = String(v.approved);
  $('approve').setAttribute('aria-busy', String(v.pending));
  $('approve').textContent = v.approved ? '✓ この購入条件は承認済み' : v.pending ? '購入条件を更新しています' : v.gap < 0 ? '予算を超えるため承認できません' : `${yen(s.quote.total)}の条件を承認する`;

  $('permit').dataset.issued = String(Boolean(s.token));
  $('permit-title').textContent = s.token ? `この購入・上限${yen(s.token.maxAmount)}` : 'この購入に限った支払い';
  $('permit-detail').textContent = s.token ? `${s.token.merchant}で有効期限内に使えるトークンです。会話の予算${yen(s.budget)}とは別の制約です。` : v.approved ? `承認した${yen(s.approval.total)}に限定した支払いを用意します。` : '購入条件が承認された後に支払いに使う情報を用意します。';
  $('buy').disabled = !v.canBuy;
  $('buy').hidden = ['unknown', 'reconciling', 'ordered'].includes(s.phase);
  $('buy').setAttribute('aria-busy', String(s.phase === 'processing'));
  $('buy').textContent = s.phase === 'processing' ? s.token ? '利用条件を照合して決済しています' : '支払いを準備しています' : s.phase === 'declined' ? '同じ購入条件でもう一度試す' : v.approved ? `${yen(s.approval.total)}で購入を試す` : '承認して購入を試す';
  $('reconcile').hidden = !['unknown', 'reconciling'].includes(s.phase);
  $('reconcile').disabled = reconciling;
  $('reconcile').setAttribute('aria-busy', String(reconciling));
  $('reconcile').textContent = reconciling ? '注文の結果を確認しています' : '同じ購入の結果を確認する';
  $('order-result').hidden = s.phase !== 'ordered';
  $('order-result').replaceChildren();
  if (s.phase === 'ordered') {
    const title = document.createElement('strong'); title.textContent = '注文が1件成立しました';
    const description = document.createElement('p'); description.textContent = `${yen(s.order.total)}・${DELIVERY[s.order.delivery].name}・${s.order.qty}${PRODUCT.options.unit}。発送と配達はこの後です。`;
    $('order-result').append(title, description);
  }
  $('merchant-order').hidden = !s.order;
  $('merchant-order-detail').textContent = s.order ? `${yen(s.order.total)}・${DELIVERY[s.order.delivery].name} / 決済の成立は${s.chargeCount}回` : '';
  $('button-hint').textContent = ['unknown', 'reconciling'].includes(s.phase) ? '結果を確認しても追加の決済は行いません。' : s.phase === 'ordered' ? '別の条件を試す時は右上から最初に戻せます。' : s.phase === 'processing' ? '処理中は数量や配送を変更できません。' : v.approved ? '条件を変えたら改めて承認します。' : '予算内でも承認なしには購入を進めません。';
  for (const input of scope.querySelectorAll('input[name="mode"]')) {
    input.checked = input.value === s.mode; input.disabled = v.lockedInputs;
  }
  renderActors(s, v);
  drawLinks();
}

function renderActors(s, v) {
  const actorStates = {
    buyer: [s.phase === 'ordered' ? '注文を確認済み' : v.approved ? '最新条件を承認済み' : v.gap < 0 ? '予算を超過' : '条件を確認', s.phase === 'unknown' ? 'warning' : v.approved ? 'good' : v.gap < 0 ? 'warning' : 'neutral'],
    agent: [{ quoting: '条件を伝える', over_budget: '購入を止める', ready: '承認を待つ', approved: '購入の準備', processing: '支払いを依頼', declined: '失敗を伝える', unknown: '結果は未確認', reconciling: '注文を確認中', ordered: '注文を伝える' }[s.phase], ['over_budget', 'unknown', 'declined'].includes(s.phase) ? 'warning' : ['quoting', 'processing', 'reconciling'].includes(s.phase) ? 'busy' : v.approved ? 'good' : 'neutral'],
    seller: [s.order ? '注文が1件成立' : v.pending ? '合計を再計算' : `合計${yen(s.quote.total)}`, v.pending ? 'busy' : 'good'],
    payment: [s.order ? '決済済み' : s.phase === 'declined' ? '決済を拒否' : s.phase === 'processing' ? s.token ? '利用条件を照合' : 'トークンを発行' : 'まだ呼ばれない', s.order ? 'good' : s.phase === 'declined' ? 'warning' : s.phase === 'processing' ? 'busy' : 'muted'],
  };
  for (const button of scope.querySelectorAll('[data-actor]')) {
    const id = button.dataset.actor;
    $('actor-' + id).textContent = actorStates[id][0];
    button.dataset.state = actorStates[id][1];
    button.classList.toggle('selected', s.focus === id);
    button.setAttribute('aria-pressed', String(s.focus === id));
  }
  const name = PARTIES[s.focus].name;
  const title = document.createElement('strong'); title.textContent = name;
  const description = document.createElement('span'); description.textContent = actorDescriptions(s, v)[s.focus];
  $('actor-note').replaceChildren(title, description);
  $('actor-note').hidden = !inspectedActor;
}

let activeRoute;
let flowDrawKey;
function anchors() {
  const parent = $('flow-map').getBoundingClientRect();
  return Object.fromEntries([...scope.querySelectorAll('[data-actor]')].map(el => {
    const r = el.getBoundingClientRect();
    const party = PARTIES[el.dataset.actor];
    return [party.id, {x:r.left-parent.x,y:r.top-parent.y,w:r.width,h:r.height}];
  }));
}
function drawLinks() {
  if (!$('flow-map').clientWidth) return;
  const ports = anchors();
  const key = JSON.stringify([ports, activeRoute, pulseVersion]);
  if (key === flowDrawKey) return;
  flowDrawKey = key;
  const output = options.drawFlow(ports, activeRoute);
  $('flow-svg').innerHTML = options.styles ? options.styles.markup(output.svg) : output.svg;
  const svg = $('flow-svg').firstElementChild;
  svg.setAttribute('width', $('flow-map').clientWidth);
  svg.setAttribute('height', $('flow-map').clientHeight);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.setProperty('--play', activeRoute && !reduceMotion ? 'running' : 'paused');
  // Native timeline is played once for each input action, then held at arrival.
  const total = output.timeline.total;
  svg.style.setProperty('--T', '.7s');
  if (!activeRoute) {
    for (const item of svg.querySelectorAll('.dg-a')) item.style.visibility = 'hidden';
  }
  else later(() => {
    if (svg !== $('flow-svg').firstElementChild) return;
    svg.style.setProperty('--play','paused');
    svg.style.setProperty('--at', String(Math.min(total, output.timeline.last) * .7 / total));
  }, 700);
}
function pulse(from, to, _color = '#518563', label = '', amount = null) {
  const names = Object.fromEntries(Object.entries(PARTIES).map(([role, block]) => [role, block.name]));
  if (label) {
    const route = document.createElement('span'); route.className = 'transfer-route'; route.textContent = `${names[from]} → ${names[to]}`;
    const action = document.createElement('span'); action.className = 'transfer-action'; action.textContent = label;
    $('transfer').replaceChildren(route, action);
    if (amount !== null) {
      const value = document.createElement('span'); value.className = 'transfer-amount'; value.textContent = yen(amount);
      $('transfer').append(value);
    }
  }
  if (reduceMotion) return;
  const roles = ['buyer', 'agent', 'seller', 'payment'];
  const first = Math.min(roles.indexOf(from), roles.indexOf(to));
  const last = Math.max(roles.indexOf(from), roles.indexOf(to));
  for (const actor of scope.querySelectorAll('[data-actor]')) {
    delete actor.dataset.transfer;
    actor.dataset.bypass = String(roles.indexOf(actor.dataset.actor) > first && roles.indexOf(actor.dataset.actor) < last);
  }
  scope.querySelector(`[data-actor="${from}"]`).dataset.transfer = 'sending';
  $('transfer').dataset.active = 'true';
  const version = ++pulseVersion;
  later(() => {
    if (version !== pulseVersion) return;
    delete scope.querySelector(`[data-actor="${from}"]`).dataset.transfer;
    scope.querySelector(`[data-actor="${to}"]`).dataset.transfer = 'received';
    later(() => {
      if (version !== pulseVersion) return;
      delete scope.querySelector(`[data-actor="${to}"]`).dataset.transfer;
      delete $('transfer').dataset.active;
    }, 450);
  }, 700);
  activeRoute = undefined;
  activeRoute = {from:PARTIES[from].id, to:PARTIES[to].id};
  drawLinks();
}

$('qty-down').addEventListener('click', () => dispatch({ type: 'TERMS', qty: state.qty - 1 }));
$('qty-up').addEventListener('click', () => dispatch({ type: 'TERMS', qty: state.qty + 1 }));
$('budget').addEventListener('input', event => dispatch({ type: 'BUDGET', value: Number(event.target.value) }));
$('approve').addEventListener('click', () => dispatch({ type: 'APPROVE' }));
$('revoke').addEventListener('click', () => dispatch({ type: 'REVOKE' }));
$('buy').addEventListener('click', () => dispatch({ type: 'BUY' }));
$('reconcile').addEventListener('click', () => dispatch({ type: 'RECONCILE_START' }));
$('reset').addEventListener('click', () => dispatch({ type: 'RESET' }));
for (const input of scope.querySelectorAll('input[name="mode"]')) input.addEventListener('change', () => dispatch({ type: 'MODE', mode: input.value }));
for (const button of scope.querySelectorAll('[data-actor]')) button.addEventListener('click', () => {
  inspectedActor = !inspectedActor || state.focus !== button.dataset.actor;
  dispatch({ type: 'FOCUS', actor: button.dataset.actor });
  renderActors(state, viewOf(state));
});
const onResize = () => {
  drawLinks();
  options.onResize?.(Math.ceil($('lab').getBoundingClientRect().height));
};
const observer = environment.ResizeObserver ? new environment.ResizeObserver(onResize) : undefined;
observer?.observe($('lab'));
if (!observer) environment.addEventListener('resize', onResize);
render();
return {
  definition,
  dispatch,
  getState: () => globalThis.structuredClone(state),
  destroy() {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    environment.removeEventListener('resize', onResize);
    for (const timer of timers) environment.clearTimeout(timer);
    for (const effect of effects) effect.cancel();
    timers.clear(); effects.clear(); scope.replaceChildren();
  },
};
}
