/* =========================================
   Panelas Para - Carrinho
   Gerencia estado, persistencia (localStorage)
   e regra de limite de 5 itens por mae.
   ========================================= */

const CART_KEY = "panelas_para_cart_v1";
const CART_LIMIT = 1;

const Cart = {

  items: [],

  load: function () {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      this.items = Array.isArray(ids)
        ? ids.filter(function (id) { return getProductById(id); })
        : [];
    } catch (e) {
      this.items = [];
    }
  },

  save: function () {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(this.items));
    } catch (e) {
      // localStorage indisponivel - segue em memoria
    }
  },

  has: function (id) {
    return this.items.indexOf(id) !== -1;
  },

  count: function () {
    return this.items.length;
  },

  isFull: function () {
    return this.items.length >= CART_LIMIT;
  },

  add: function (id) {
    const product = getProductById(id);
    if (!product) return { ok: false, reason: "not_found" };
    if (product.soldOut) return { ok: false, reason: "sold_out" };
    if (this.has(id)) return { ok: false, reason: "exists" };
    if (this.isFull()) return { ok: false, reason: "limit" };
    this.items.push(id);
    this.save();
    return { ok: true };
  },

  remove: function (id) {
    const idx = this.items.indexOf(id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    this.save();
    return true;
  },

  clear: function () {
    this.items = [];
    this.save();
  },

  getProducts: function () {
    return this.items
      .map(function (id) { return getProductById(id); })
      .filter(Boolean);
  }
};
