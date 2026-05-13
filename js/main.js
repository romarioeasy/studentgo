/* =========================================
   Panelas Pará - Bootstrap
   Inicialização e event listeners.
   ========================================= */

(function () {

  function handleAdd(id) {
    const result = Cart.add(id);

    if (!result.ok) {
      if (result.reason === "limit") {
        UI.showToast("You have already added your vehicle for this campaign.", "error");
      }
      return;
    }

    const product = getProductById(id);
    Track.addToCart(product, Cart.count());

    UI.refreshProductStates();
    UI.refreshCounts();
    UI.renderDrawer();
    UI.showToast("Item added! Complete your order in the cart.");
  }

  function handleRemove(id) {
    Cart.remove(id);
    UI.refreshProductStates();
    UI.refreshCounts();
    UI.renderDrawer();
  }

  function bindGrid() {
    UI.els.grid.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-action='add']");
      if (!btn) return;
      const id = parseInt(btn.dataset.id, 10);

      if (!Eligibility.isVerified()) {
        UI.showToast("Please check your eligibility before choosing a vehicle.");
        Eligibility.openModal();
        return;
      }

      if (Cart.has(id)) {
        UI.openDrawer();
        return;
      }
      handleAdd(id);
    });
  }

  function bindDrawer() {
    UI.els.cartButton.addEventListener("click", function () { UI.openDrawer(); });
    UI.els.drawerClose.addEventListener("click", function () { UI.closeDrawer(); });
    UI.els.drawerOverlay.addEventListener("click", function () { UI.closeDrawer(); });

    UI.els.drawerBody.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-action='remove']");
      if (!btn) return;
      const id = parseInt(btn.dataset.id, 10);
      handleRemove(id);
    });

    UI.els.checkoutBtn.addEventListener("click", function () {
      if (Cart.count() === 0) return;
      Track.initiateCheckout(Cart.getProducts());
      UI.closeDrawer();
      Checkout.reset();
      UI.openModal();
    });
  }

  function bindModal() {
    UI.els.modalClose.addEventListener("click", function () {
      UI.closeModal();
    });

    UI.els.modalOverlay.addEventListener("click", function (e) {
      if (e.target === UI.els.modalOverlay) {
        UI.closeModal();
      }
    });
  }

  function bindCheckout() {
    Checkout.cacheElements();
    Checkout.setupMasks();

    /* Etapa 1: Dados pessoais → Endereço */
    Checkout.els.formDataNext.addEventListener("click", function () {
      Checkout.submitDataStep();
    });

    /* Etapa 2: Endereço → Revisão / Voltar */
    Checkout.els.formAddressNext.addEventListener("click", function () {
      Checkout.submitAddressStep();
    });
    Checkout.els.formAddressBack.addEventListener("click", function () {
      Checkout.goBackToData();
    });

    /* Revisão → PayPal / Voltar */
    Checkout.els.reviewPayBtn.addEventListener("click", function () { Checkout.redirectToPayPal(); });
    Checkout.els.reviewBackBtn.addEventListener("click", function () { Checkout.goBackToForm(); });
  }

  function bindKeys() {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (UI.els.modalOverlay.classList.contains("open")) {
        UI.closeModal();
      } else if (UI.els.drawer.classList.contains("open")) {
        UI.closeDrawer();
      }
    });
  }

  function bindNav() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function initCookieBanner() {
    const KEY = "panelas_cookies_v1";
    const banner = document.getElementById("cookieBanner");
    const acceptBtn = document.getElementById("cookieAccept");
    if (!banner || !acceptBtn) return;

    let already = false;
    try { already = localStorage.getItem(KEY) === "accepted"; } catch (e) {}

    if (already) return;

    // Mostra com pequeno delay para não competir com o carregamento inicial
    banner.hidden = false;
    setTimeout(function () { banner.classList.add("show"); }, 600);

    acceptBtn.addEventListener("click", function () {
      try { localStorage.setItem(KEY, "accepted"); } catch (e) {}
      banner.classList.remove("show");
      setTimeout(function () { banner.hidden = true; }, 350);
    });
  }

  function bindEligibilityCta() {
    const btn = document.getElementById("eligCtaBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (Eligibility.isVerified()) {
        const sec = document.getElementById("cars");
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        Eligibility.openModal();
      }
    });
  }

  function init() {
    UI.cacheElements();
    Cart.load();
    UI.renderProducts();
    UI.renderDrawer();
    UI.refreshProductStates();
    UI.refreshCounts();

    Eligibility.init();

    bindGrid();
    bindDrawer();
    bindCheckout();
    bindModal();
    bindKeys();
    bindNav();
    bindEligibilityCta();
    initCookieBanner();

    // Sinaliza visualização do catálogo após o carregamento
    setTimeout(function () { Track.viewContent(); }, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
