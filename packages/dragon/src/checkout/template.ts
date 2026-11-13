export const template = String.raw`

<svg class="symbols" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
  <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></symbol>
  <symbol id="i-agent" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="13" rx="4"/><path d="M12 2v4M1 11v4m22-4v4m-15 0h8"/><circle cx="8.5" cy="11" r=".5"/><circle cx="15.5" cy="11" r=".5"/></symbol>
  <symbol id="i-shop" viewBox="0 0 24 24"><path d="M3 9h18l-2-6H5L3 9Zm1 0v12h16V9M9 21v-7h6v7M3 9c0 4 4 4 4 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 4 4 4 0"/></symbol>
  <symbol id="i-card" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20M6 15h4m3 0h2"/></symbol>
  <symbol id="i-truck" viewBox="0 0 24 24"><path d="M1 5h13v12H1V5Zm13 4h5l4 5v3h-9M15 17h4"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/></symbol>
  <symbol id="i-bolt" viewBox="0 0 24 24"><path d="m14 2-9 12h7l-2 8 9-12h-7l2-8Z"/></symbol>
  <symbol id="i-bag" viewBox="0 0 24 24"><path d="M4 7h16l1 15H3L4 7Zm4 1V6a4 4 0 0 1 8 0v2"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 4 4L20 5"/></symbol>
  <symbol id="i-lock" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/></symbol>
  <symbol id="i-refresh" viewBox="0 0 24 24"><path d="M20 7A9 9 0 1 0 21 15M20 2v6h-6"/></symbol>
</defs></svg>
<main id="lab" class="lab">
  <header class="page-header">
    <div>
    <h1>条件を変える。<br class="small-only">購入の判断が変わる。</h1>
    <p class="intro">配送や数量を変えて、最新の購入条件を承認してみてください。</p></div>
    <div class="header-actions">
      <button id="reset" class="reset" type="button"><svg><use href="#i-refresh"/></svg>最初の条件に戻す</button>
      <fieldset id="modes" class="scenario-tabs"><legend class="sr-only">試すケース</legend><label><input type="radio" name="mode" value="normal" checked><span>通常の購入</span></label><label><input type="radio" name="mode" value="decline"><span>決済拒否</span></label><label><input type="radio" name="mode" value="lost"><span>応答不達</span></label></fieldset>
    </div>
  </header>

  <section class="board" aria-label="購入条件と購入の状態を操作する図">
    <div class="scene-heading"><div class="flow-heading"><span class="flow-heading-icon"><svg><use href="#i-refresh"/></svg></span><div><h2>注文フロー</h2><p>条件の変更が、誰の処理につながるか</p></div></div><span class="scene-pill" id="phase-label">購入条件を確認</span></div>
    <div class="flow-map" id="flow-map">
      <div id="flow-svg" class="flow-svg" aria-hidden="true"></div>
      <button class="actor" data-actor="buyer" type="button" aria-pressed="false"><span class="actor-top"><span class="avatar"><svg><use href="#i-user"/></svg></span><span><strong>あなた</strong><small>購入の判断</small></span></span><span class="actor-state" id="actor-buyer"></span></button>
      <button class="actor selected" data-actor="agent" type="button" aria-pressed="true"><span class="actor-top"><span class="avatar"><svg><use href="#i-agent"/></svg></span><span><strong>エージェント</strong><small>情報をつなぐ</small></span></span><span class="actor-state" id="actor-agent"></span></button>
      <button class="actor" data-actor="seller" type="button" aria-pressed="false"><span class="actor-top"><span class="avatar"><svg><use href="#i-shop"/></svg></span><span><strong>販売事業者</strong><small>条件と注文</small></span></span><span class="actor-state" id="actor-seller"></span></button>
      <button class="actor" data-actor="payment" type="button" aria-pressed="false"><span class="actor-top"><span class="avatar"><svg><use href="#i-card"/></svg></span><span><strong>決済事業者</strong><small>支払いの処理</small></span></span><span class="actor-state" id="actor-payment"></span></button>
    </div>
    <div id="transfer" class="transfer" role="status">条件を変えると、購入に関わるやり取りがここに現れます。</div>
    <div id="actor-note" class="actor-note"></div>

    <div class="coach" id="coach" role="status" aria-live="polite"><span class="coach-dot"></span><div><h2 id="scene-title"></h2><p id="scene-description"></p></div></div>

    <div class="workspace">
      <section class="merchant-panel" aria-labelledby="merchant-title">
        <div class="section-label"><span>01</span><h2 id="merchant-title">販売事業者が返す購入条件</h2><span class="live-badge" id="quote-badge">最新</span></div>
        <div class="product">
          <div class="product-art" aria-hidden="true"><svg viewBox="0 0 260 150"><ellipse cx="132" cy="127" rx="104" ry="8" fill="#d9e4dc"/><path d="M27 96 49 72l11-31 24 11 22-3 42 31 57 15q31 3 34 21l-8 10H36q-20-7-9-30Z" fill="#fafbf4" stroke="#254b41" stroke-width="2.5" stroke-linejoin="round"/><path d="m59 43 24 12-10 36-25-15Z" fill="#9bc3aa" stroke="#254b41" stroke-width="2"/><path d="m105 51 42 31 42 10-27 14-44-14-35-22Z" fill="#dce9dc" stroke="#254b41" stroke-width="2"/><path d="M26 106q34 13 83 5l49 8 77-8 2 10-8 7H37q-13-4-11-22Z" fill="#eee8cf" stroke="#254b41" stroke-width="2.5"/><path d="m91 62 24 2m-15 7 25 2m-15 6 25 2M50 94l14-2m101 22 15-8" fill="none" stroke="#254b41" stroke-width="2.5" stroke-linecap="round"/><path d="m151 84 20 8" stroke="#df9857" stroke-width="6" stroke-linecap="round"/></svg></div>
          <div class="product-info"><span class="product-category">シューズ店A</span><h3>白いランニングシューズ</h3><p><strong>18,000<span>円</span></strong><span> / 1足・税込み</span></p><div class="quantity"><span>数量</span><div class="stepper"><button id="qty-down" type="button" aria-label="数量を1足減らす">−</button><output id="quantity" aria-live="polite">1足</output><button id="qty-up" type="button" aria-label="数量を1足増やす">＋</button></div><small>最大3足</small></div></div>
        </div>
        <fieldset class="delivery-options"><legend>配送方法を変える</legend><div id="delivery-options"></div></fieldset>
        <div class="quote" id="quote">
          <div class="quote-row"><span>商品</span><span id="subtotal"></span></div>
          <div class="quote-row"><span>送料</span><span id="shipping-fee"></span></div>
          <div class="quote-total"><div><span>販売事業者が返した合計</span><small id="quote-detail"></small></div><strong id="total"></strong></div>
          <p id="budget-gap" class="budget-gap"></p>
        </div>
        <div class="merchant-order" id="merchant-order" hidden><svg><use href="#i-check"/></svg><div><strong>販売事業者側では、注文が1件できています</strong><span id="merchant-order-detail"></span></div></div>
        <p class="panel-foot">価格は説明用の設定です。図では、販売事業者が変更を受けて最新の合計を返します。</p>
      </section>

      <section class="buyer-panel" aria-labelledby="buyer-title">
        <div class="section-label"><span>02</span><h2 id="buyer-title">あなたが決める予算と承認</h2></div>
        <div class="budget-head"><label for="budget">送料込みの予算</label><output for="budget" id="budget-value"></output></div>
        <div class="budget-slider"><input id="budget" type="range" min="15000" max="60000" step="500" value="20000" aria-label="送料込みの予算"><div class="range-ticks"><span>15,000円</span><span>60,000円</span></div></div>
        <div class="approval" id="approval"><div class="approval-top"><svg><use href="#i-user"/></svg><strong id="approval-status"></strong><span id="approval-mark"></span></div><p id="approval-detail"></p><button id="revoke" class="text-button" type="button" hidden>承認を取り消す</button></div>
        <p id="approval-notice" class="approval-notice" hidden></p>
        <button id="approve" type="button" class="approve-button"></button>
        <div class="permit" id="permit"><svg><use href="#i-lock"/></svg><div><strong id="permit-title">この購入に限った支払い</strong><p id="permit-detail"></p></div></div>
        <button id="buy" type="button" class="buy-button"></button>
        <button id="reconcile" type="button" class="buy-button" hidden>同じ購入の結果を確認する</button>
        <div class="order-result" id="order-result" hidden></div>
        <p class="button-hint" id="button-hint"></p>
      </section>
    </div>

  </section>
  <footer class="page-foot"><p>この図は購入の仕組みを学ぶためのモデルです。実際の注文・カード認証・課金は行いません。</p><p>動きを減らす設定とキーボード操作に対応しています。</p></footer>
</main>
`;
