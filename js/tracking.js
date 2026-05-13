/* =========================================
   Panelas Pará - Tracking (Meta Pixel)
   Wrapper seguro para fbq + helpers de eventos
   ========================================= */

const Track = {

  // Wrapper seguro: nunca quebra a página se o pixel falhar em carregar
  // (bloqueador de anúncios, rede ruim, etc).
  send: function (eventName, params) {
    try {
      if (typeof window.fbq === 'function') {
        if (params) {
          window.fbq('track', eventName, params);
        } else {
          window.fbq('track', eventName);
        }
      }
    } catch (e) {
      // Silencioso por segurança
    }
  },

  /* ---------- Eventos do funil ---------- */

  viewContent: function () {
    this.send('ViewContent', {
      content_type: 'product_group',
      content_name: 'Car Campaign',
      currency: 'USD',
      value: 0
    });
  },

  addToCart: function (product, cartCount) {
    if (!product) return;
    this.send('AddToCart', {
      content_ids: [String(product.id)],
      content_name: product.name,
      content_type: 'product',
      content_category: product.category,
      contents: [{ id: String(product.id), quantity: 1 }],
      value: 0,
      currency: 'USD',
      num_items: cartCount || 1
    });
  },

  initiateCheckout: function (cartProducts) {
    const ids = (cartProducts || []).map(function (p) { return String(p.id); });
    this.send('InitiateCheckout', {
      content_ids: ids,
      contents: ids.map(function (id) { return { id: id, quantity: 1 }; }),
      num_items: ids.length,
      value: 99.00,
      currency: 'USD'
    });
  },

  addPaymentInfo: function () {
    this.send('AddPaymentInfo', {
      value: 99.00,
      currency: 'USD'
    });
  },

  purchase: function (transactionId, cartProducts) {
    const ids = (cartProducts || []).map(function (p) { return String(p.id); });
    this.send('Purchase', {
      content_ids: ids,
      contents: ids.map(function (id) { return { id: id, quantity: 1 }; }),
      num_items: ids.length,
      value: 99.00,
      currency: 'USD',
      order_id: transactionId || ''
    });
  },

  // Auxiliary events
  lead: function () {
    this.send('Lead', { value: 99.00, currency: 'USD' });
  }
};
