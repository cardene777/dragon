import { createCheckoutModel } from '../src/checkout/model.mjs';
import { definitionOf as purchaseDefinition } from '../src/checkout/definition.ts';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseNotation } from '../dist/index.js';
const definition = parseNotation(readFileSync(new URL('../examples/checkout/acp-purchase.dragon', import.meta.url), 'utf8'));
assert.equal(definition.ok, true);
const { initialState, transition: send, approvalValid } = createCheckoutModel(purchaseDefinition(definition.diagram));

const quote = s => send(s, { type: 'QUOTE_READY', session: s.session, revision: s.revision });
const standard = () => quote(send(initialState(), { type: 'TERMS', delivery: 'standard' }));
const approved = () => send(standard(), { type: 'APPROVE' });
const token = s => send(s, { type: 'TOKEN_READY', session: s.session, attempt: s.attempt });
const settle = s => send(s, { type: 'SETTLE', session: s.session, attempt: s.attempt });

test('送料込みで予算を超える購入を、承認も実行もできない', () => {
  const s = initialState();
  assert.equal(s.quote.total, 20500);
  assert.equal(s.phase, 'over_budget');
  assert.equal(send(s, { type: 'APPROVE' }), s);
  assert.equal(send(s, { type: 'BUY' }), s);
  assert.equal(s.order, null);
});

test('返答前には承認できず、承認後の条件変更は再承認を要求する', () => {
  let s = send(initialState(), { type: 'TERMS', delivery: 'standard' });
  assert.equal(send(s, { type: 'APPROVE' }), s);
  s = send(quote(s), { type: 'APPROVE' });
  assert.equal(s.approval.total, 19000);
  s = send(s, { type: 'TERMS', qty: 2 });
  assert.equal(s.approval, null);
  assert.equal(s.invalidated, true);
  assert.equal(send(s, { type: 'BUY' }), s);
  s = quote(s);
  assert.equal(s.quote.total, 37000);
  assert.equal(s.phase, 'over_budget');
});

test('予算を増やしても、承認額とトークンの上限を自動で増やさない', () => {
  let s = send(approved(), { type: 'BUDGET', value: 40000 });
  assert.equal(s.approval.total, 19000);
  assert.equal(approvalValid(s), true);
  s = token(send(s, { type: 'BUY' }));
  assert.equal(s.token.maxAmount, 19000);
});

test('承認額より予算を下げると、前の承認は使えない', () => {
  const s = send(approved(), { type: 'BUDGET', value: 18000 });
  assert.equal(s.approval, null);
  assert.equal(s.phase, 'over_budget');
  assert.equal(send(s, { type: 'BUY' }), s);
});

test('配送を続けて変更しても、古い見積もりの返答で上書きしない', () => {
  let s = send(initialState(), { type: 'TERMS', delivery: 'standard' });
  const oldRevision = s.revision;
  s = send(s, { type: 'TERMS', delivery: 'pickup' });
  assert.equal(send(s, { type: 'QUOTE_READY', revision: oldRevision }), s);
  s = quote(s);
  assert.equal(s.quote.delivery, 'pickup');
  assert.equal(s.quote.total, 18000);
});

test('購入要求や完了処理を重ねても、決済と注文を増やさない', () => {
  let s = send(approved(), { type: 'BUY' });
  assert.equal(send(s, { type: 'BUY' }), s);
  s = settle(token(s));
  assert.equal(s.phase, 'ordered');
  assert.equal(s.chargeCount, 1);
  assert.equal(s.order.total, 19000);
  assert.equal(send(s, { type: 'BUY' }), s);
  assert.equal(settle(s), s);
});

test('応答不達でも、既存の注文を確認して追加の決済をしない', () => {
  let s = send(approved(), { type: 'MODE', mode: 'lost' });
  s = settle(token(send(s, { type: 'BUY' })));
  assert.equal(s.phase, 'unknown');
  assert.equal(s.order.total, 19000);
  assert.equal(send(s, { type: 'BUY' }), s);
  assert.equal(send(s, { type: 'TERMS', qty: 2 }), s);
  s = send(s, { type: 'RECONCILE' });
  assert.equal(s.phase, 'ordered');
  assert.equal(s.chargeCount, 1);
});

test('決済拒否では注文を作らず、その後の成功で1件だけ作る', () => {
  let s = send(approved(), { type: 'MODE', mode: 'decline' });
  s = settle(token(send(s, { type: 'BUY' })));
  assert.equal(s.phase, 'declined');
  assert.equal(s.order, null);
  assert.equal(s.chargeCount, 0);
  s = send(s, { type: 'MODE', mode: 'normal' });
  s = settle(token(send(s, { type: 'BUY' })));
  assert.equal(s.phase, 'ordered');
  assert.equal(s.chargeCount, 1);
});

test('最初に戻した後は、以前の購入の遅い返答を受け付けない', () => {
  const old = send(approved(), { type: 'BUY' });
  const s = send(old, { type: 'RESET' });
  assert.equal(send(s, { type: 'TOKEN_READY', session: old.session, attempt: old.attempt }), s);
  assert.equal(send(s, { type: 'SETTLE', session: old.session, attempt: old.attempt }), s);
  assert.equal(s.phase, 'over_budget');
  assert.equal(s.chargeCount, 0);
});
