/* =========================================
   Panelas Pará - UI
   Renderização, drawer, modal e toast.
   ========================================= */

const UI = {

  els: {},

  // controle do scroll lock do body
  scrollLockY: 0,

  cacheElements: function () {
    this.els = {
      grid: document.getElementById("productsGrid"),
      cartButton: document.getElementById("cartButton"),
      cartCount: document.getElementById("cartCount"),

      drawer: document.getElementById("drawer"),
      drawerOverlay: document.getElementById("drawerOverlay"),
      drawerClose: document.getElementById("drawerClose"),
      drawerBody: document.getElementById("drawerBody"),
      drawerCount: document.getElementById("drawerCount"),
      drawerProgress: document.getElementById("drawerProgress"),
      checkoutBtn: document.getElementById("checkoutBtn"),

      modalOverlay: document.getElementById("modalOverlay"),
      modalClose: document.getElementById("modalClose"),
      modalSummaryList: document.getElementById("modalSummaryList"),

      toast: document.getElementById("toast")
    };
  },

  /* ---------- SCROLL LOCK ---------- */
  // Trava o fundo do site sem deixar a página rolar atrás do drawer/modal.
  // Compatível com iOS (que ignora overflow:hidden no body sozinho).
  isLocked: function () {
    return document.body.classList.contains("no-scroll");
  },

  lockScroll: function () {
    if (this.isLocked()) return;
    this.scrollLockY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = "-" + this.scrollLockY + "px";
    document.body.classList.add("no-scroll");
  },

  unlockScroll: function () {
    if (!this.isLocked()) return;
    document.body.classList.remove("no-scroll");
    document.body.style.top = "";
    window.scrollTo(0, this.scrollLockY);
  },

  /* ---------- PRODUCTS GRID ---------- */
  renderProducts: function () {
    const grid = this.els.grid;
    grid.innerHTML = "";

    PRODUCTS.forEach(function (p) {
      const card = document.createElement("article");
      card.className = "product-card";
      if (p.soldOut) card.classList.add("sold-out");
      card.dataset.id = String(p.id);

      const soldOutOverlay = p.soldOut
        ? '<span class="sold-out-badge">Sold out</span>'
        : '';

      const button = p.soldOut
        ? '<button class="product-add" type="button" disabled aria-disabled="true">Sold out</button>'
        : '<button class="product-add" type="button" data-action="add" data-id="' + p.id + '">Add</button>';

      card.innerHTML =
        '<div class="product-image">' +
          '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" />' +
          soldOutOverlay +
        '</div>' +
        '<div class="product-category">' + p.category + '</div>' +
        '<h3 class="product-name">' + p.name + '</h3>' +
        '<p class="product-desc">' + p.description + '</p>' +
        '<div class="product-footer">' +
          '<div class="product-price"><small>Item value</small>$ 0.00</div>' +
          button +
        '</div>';

      grid.appendChild(card);
    });
  },

  refreshProductStates: function () {
    const cards = this.els.grid.querySelectorAll(".product-card");
    cards.forEach(function (card) {
      if (card.classList.contains("sold-out")) return;
      const id = parseInt(card.dataset.id, 10);
      const inCart = Cart.has(id);
      card.classList.toggle("in-cart", inCart);
      const btn = card.querySelector(".product-add");
      btn.textContent = inCart ? "Added" : "Add";
    });
  },

  /* ---------- CART COUNT ---------- */
  refreshCounts: function () {
    const count = Cart.count();
    this.els.cartCount.textContent = String(count);
    this.els.drawerCount.textContent = String(count);
    this.els.drawerProgress.style.width = (count / CART_LIMIT) * 100 + "%";
    this.els.checkoutBtn.disabled = count === 0;
  },

  /* ---------- DRAWER ---------- */
  renderDrawer: function () {
    const body = this.els.drawerBody;
    const products = Cart.getProducts();

    if (products.length === 0) {
      body.innerHTML =
        '<div class="drawer-empty">' +
          '<p class="drawer-empty-title">No vehicle selected</p>' +
          '<p class="drawer-empty-text">Add 1 vehicle to your cart and pay only the shipping fee.</p>' +
        '</div>';
      return;
    }

    body.innerHTML = "";
    products.forEach(function (p) {
      const item = document.createElement("div");
      item.className = "drawer-item";
      item.innerHTML =
        '<div class="drawer-item-image">' +
          '<img src="' + p.image + '" alt="' + p.name + '" />' +
        '</div>' +
        '<div class="drawer-item-body">' +
          '<div class="drawer-item-cat">' + p.category + '</div>' +
          '<div class="drawer-item-name">' + p.name + '</div>' +
          '<div class="drawer-item-price">$ 0.00</div>' +
        '</div>' +
        '<button class="drawer-item-remove" type="button" data-action="remove" data-id="' + p.id + '" aria-label="Remove ' + p.name + '">Remove</button>';
      body.appendChild(item);
    });
  },

  openDrawer: function () {
    this.els.drawer.classList.add("open");
    this.els.drawer.setAttribute("aria-hidden", "false");
    this.els.drawerOverlay.classList.add("open");
    this.lockScroll();
  },

  closeDrawer: function () {
    this.els.drawer.classList.remove("open");
    this.els.drawer.setAttribute("aria-hidden", "true");
    this.els.drawerOverlay.classList.remove("open");
    if (!this.els.modalOverlay.classList.contains("open")) {
      this.unlockScroll();
    }
  },

  /* ---------- MODAL ---------- */
  openModal: function () {
    this.renderModalSummary();
    this.els.modalOverlay.classList.add("open");
    this.lockScroll();
  },

  closeModal: function () {
    this.els.modalOverlay.classList.remove("open");
    if (!this.els.drawer.classList.contains("open")) {
      this.unlockScroll();
    }
  },

  renderModalSummary: function () {
    const list = this.els.modalSummaryList;
    list.innerHTML = "";
    Cart.getProducts().forEach(function (p) {
      const li = document.createElement("li");
      li.textContent = p.name;
      list.appendChild(li);
    });
  },

  /* ---------- TOAST ---------- */
  toastTimer: null,

  showToast: function (message, type) {
    const el = this.els.toast;
    el.textContent = message;
    el.classList.toggle("error", type === "error");
    el.classList.add("show");

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 3000);
  }
};
