export function createCheckoutModel(definition) {
const part = kind => definition.blocks.find(block => block.kind === kind);
const PRODUCT = part('product');
const SHIPPING = part('delivery');
const QUANTITY = Object.fromEntries(['min','max','initial'].map(key => [key, Number(PRODUCT.options[key])]));
const BUDGET = Object.fromEntries(['min','max','step','initial'].map(key => [key, Number(part('budget').options[key])]));
const UNIT_PRICE = Number(PRODUCT.options.price);
const DELIVERY = Object.freeze(Object.fromEntries(definition.blocks.filter(block => block.kind === 'option').map(block => [block.id, { name: block.name, fee: Number(block.options.fee), note: block.options.note, icon: block.options.icon }])));
const PARTIES = Object.fromEntries(definition.blocks.filter(block => block.kind === 'party').map(block => [block.options.role, block]));
const locked = s => ['processing', 'unknown', 'reconciling', 'ordered'].includes(s.phase);
const quoted = (s, qty = s.qty, delivery = s.delivery) => ({
  revision: s.revision, qty, delivery, subtotal: UNIT_PRICE * qty,
  fee: DELIVERY[delivery].fee, total: UNIT_PRICE * qty + DELIVERY[delivery].fee,
  merchant: PRODUCT.options.merchant,
});
const add = (s, actor, text) => {
  s.events = [...s.events, { actor, text, n: s.eventCount + 1 }].slice(-6);
  s.eventCount++;
};
const resting = s => s.quote.total > s.budget ? 'over_budget' : s.approval ? 'approved' : 'ready';

function initialState(session = 1) {
  const s = {
    session, revision: 1, qty: QUANTITY.initial, delivery: SHIPPING.options.initial, budget: BUDGET.initial,
    phase: 'over_budget', quote: null, approval: null, token: null,
    order: null, chargeCount: 0, attempt: 0, mode: 'normal',
    events: [], eventCount: 0, notice: '', invalidated: false, focus: 'agent',
  };
  s.quote = quoted(s);
  s.phase = resting(s);
  add(s, '販売事業者', `商品${UNIT_PRICE.toLocaleString('ja-JP')}円＋送料${s.quote.fee.toLocaleString('ja-JP')}円。合計${s.quote.total.toLocaleString('ja-JP')}円を返しました。`);
  return s;
}

function approvalValid(s) {
  return Boolean(s.approval && s.phase !== 'quoting' &&
    s.approval.revision === s.quote.revision &&
    s.approval.total === s.quote.total && s.approval.total <= s.budget);
}

/** 説明用の購入モデル。通信、カード認証、課金は実行しない。 */
function transition(previous, event) {
  if (event.type === 'RESET') return initialState(previous.session + 1);
  if (event.session !== undefined && event.session !== previous.session) return previous;
  const s = globalThis.structuredClone(previous);
  switch (event.type) {
    case 'FOCUS':
      if (!['buyer', 'agent', 'seller', 'payment'].includes(event.actor)) return previous;
      s.focus = event.actor;
      return s;
    case 'BUDGET': {
      if (locked(s)) return previous;
      const amount = Number(event.value);
      if (!Number.isFinite(amount) || amount < BUDGET.min || amount > BUDGET.max || (amount - BUDGET.min) % BUDGET.step !== 0) return previous;
      s.budget = amount;
      if (s.approval && s.approval.total > amount) {
        s.approval = null; s.token = null; s.invalidated = true;
        s.notice = '承認した金額より予算が低くなったため、前の承認は使えません。';
      }
      if (s.phase !== 'quoting') s.phase = resting(s);
      return s;
    }
    case 'TERMS': {
      if (locked(s)) return previous;
      const qty = event.qty ?? s.qty;
      const delivery = event.delivery ?? s.delivery;
      if (!Number.isInteger(qty) || qty < QUANTITY.min || qty > QUANTITY.max || !Object.hasOwn(DELIVERY, delivery)) return previous;
      if (qty === s.qty && delivery === s.delivery) return previous;
      s.invalidated = Boolean(s.approval) || s.invalidated;
      s.qty = qty; s.delivery = delivery; s.revision++;
      s.approval = null; s.token = null; s.phase = 'quoting';
      s.notice = s.invalidated ? '購入条件が変わったため、前の承認は使えません。' : '';
      return s;
    }
    case 'QUOTE_READY':
      if (s.phase !== 'quoting' || event.revision !== s.revision) return previous;
      s.quote = quoted(s); s.phase = resting(s);
      add(s, '販売事業者', `${DELIVERY[s.delivery].name}・${s.qty}${PRODUCT.options.unit}で再計算。最新の合計は${s.quote.total.toLocaleString('ja-JP')}円です。`);
      return s;
    case 'APPROVE':
      if (!['ready', 'declined'].includes(s.phase) || s.quote.total > s.budget) return previous;
      s.approval = { ...s.quote }; s.invalidated = false; s.notice = '';
      s.phase = 'approved';
      add(s, '購入者', `${s.quote.total.toLocaleString('ja-JP')}円・${DELIVERY[s.delivery].name}の条件を承認しました。`);
      return s;
    case 'REVOKE':
      if (locked(s) || !s.approval) return previous;
      s.approval = null; s.token = null; s.phase = resting(s);
      s.notice = '承認を取り消しました。購入するにはもう一度承認してください。';
      add(s, '購入者', '購入条件の承認を取り消しました。');
      return s;
    case 'MODE':
      if (locked(s) || !['normal', 'decline', 'lost'].includes(event.mode)) return previous;
      s.mode = event.mode;
      return s;
    case 'BUY':
      if (!['approved', 'declined'].includes(s.phase) || !approvalValid(s)) return previous;
      s.phase = 'processing'; s.attempt++; s.token = null; s.notice = '';
      add(s, 'エージェント', '承認済みの購入内容で支払い委任を要求しました。');
      return s;
    case 'TOKEN_READY':
      if (s.phase !== 'processing' || event.attempt !== s.attempt || s.token) return previous;
      s.token = { maxAmount: s.approval.total, merchant: s.quote.merchant, session: s.session };
      add(s, '決済事業者', `${s.token.merchant}・今回の購入・上限${s.token.maxAmount.toLocaleString('ja-JP')}円に限定したトークンを発行しました。`);
      return s;
    case 'SETTLE':
      if (s.phase !== 'processing' || event.attempt !== s.attempt || !s.token || !approvalValid(s)) return previous;
      if (s.token.maxAmount !== s.quote.total || s.token.session !== s.session || s.token.merchant !== s.quote.merchant) return previous;
      if (s.mode === 'decline') {
        s.phase = 'declined'; s.token = null;
        add(s, '決済事業者', '決済を拒否しました。注文は作成されていません。');
        return s;
      }
      s.chargeCount++;
      s.order = { number: `DEMO-${String(s.session).padStart(3, '0')}`, ...s.quote };
      s.phase = s.mode === 'lost' ? 'unknown' : 'ordered';
      add(s, '販売事業者', `${s.order.total.toLocaleString('ja-JP')}円の決済成功を確認し、注文を1件作成しました。`);
      if (s.mode === 'lost') add(s, 'エージェント', '注文完了の応答が届かず、購入結果を確認できません。');
      else add(s, 'エージェント', '成立した注文を購入者へ伝えました。');
      return s;
    case 'RECONCILE_START':
      if (s.phase !== 'unknown' || !s.order) return previous;
      s.phase = 'reconciling';
      add(s, 'エージェント', '同じ購入の最新状態を販売事業者に問い合わせています。');
      return s;
    case 'RECONCILE':
      if (!['unknown', 'reconciling'].includes(s.phase) || !s.order) return previous;
      s.phase = 'ordered';
      add(s, 'エージェント', '同じ購入の最新状態を取得しました。既存の注文を確認し、追加の決済はしていません。');
      return s;
    default:
      return previous;
  }
}

function viewOf(s) {
  const pending = s.phase === 'quoting';
  const approved = approvalValid(s);
  const gap = s.budget - s.quote.total;
  const lockedInputs = locked(s);
  const titles = {
    over_budget: ['送料を含めると予算を超えています', '配送方法や数量を変えるか、予算を調整してください。'],
    quoting: ['販売事業者が購入条件を再計算しています', '変更を販売事業者に伝えました。最新の購入条件が返るのを待っています。'],
    ready: [s.invalidated ? '条件が変わりました。もう一度承認してください' : '予算内です。購入はまだ確定していません', '合計と配送方法を確認して、この条件で購入するか決めてください。'],
    approved: ['購入者がこの条件を承認しました', '支払いの上限は今回承認した金額です。'],
    processing: [s.token ? '承認した範囲で決済を処理しています' : 'この購入に限った支払いを準備しています', '購入の仕組みを説明するための処理です。実際の課金は行いません。'],
    declined: ['決済が拒否されました。注文はありません', '購入条件の承認と決済の成功は別です。上のケースを切り替えて再度試せます。'],
    unknown: ['購入結果をまだ確認できません', '店側では注文が作成済みです。新たに購入を送り直さず、同じ購入の状態を確認してください。'],
    reconciling: ['販売事業者に注文の結果を確認しています', '同じ購入の最新状態を問い合わせています。決済は繰り返しません。'],
    ordered: ['購入条件の確認から注文成立まで進みました', '注文は1件です。購入の完了と発送・配達の完了は別です。'],
  };
  return { pending, approved, gap, lockedInputs, title: titles[s.phase][0], description: titles[s.phase][1],
    canApprove: !lockedInputs && !pending && !approved && gap >= 0,
    canBuy: !lockedInputs && !pending && approved,
  };
}

return { UNIT_PRICE, DELIVERY, QUANTITY, BUDGET, PRODUCT, PARTIES, initialState, approvalValid, transition, viewOf };
}
