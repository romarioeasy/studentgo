/* =========================================
   Panelas Pará - Checkout multi-step
   Dados → Endereço → Revisão → PayPal
   ========================================= */

const Checkout = {

  step: 'formData',

  formData: null,

  PAYPAL_URL: 'https://www.paypal.com/ncp/payment/YF92FZKXUE2J6',

  els: {},

  TITLES: {
    formData:    'Your details',
    formAddress: 'Delivery address',
    review:      'Order review'
  },

  cacheElements: function () {
    this.els = {
      stepFormData:    document.getElementById('stepFormData'),
      stepFormAddress: document.getElementById('stepFormAddress'),
      stepReview:      document.getElementById('stepReview'),

      formDataError:    document.getElementById('formDataError'),
      formAddressError: document.getElementById('formAddressError'),
      formDataNext:     document.getElementById('formDataNext'),
      formAddressNext:  document.getElementById('formAddressNext'),
      formAddressBack:  document.getElementById('formAddressBack'),

      reviewItems:         document.getElementById('reviewItems'),
      reviewAddress:       document.getElementById('reviewAddress'),
      reviewShippingLabel: document.getElementById('reviewShippingLabel'),
      reviewError:         document.getElementById('reviewError'),
      reviewPayBtn:        document.getElementById('reviewPay'),
      reviewBackBtn:       document.getElementById('reviewBack'),

      modalTitle: document.getElementById('modalTitle')
    };
  },

  showStep: function (name) {
    this.step = name;
    this.els.stepFormData.hidden    = (name !== 'formData');
    this.els.stepFormAddress.hidden = (name !== 'formAddress');
    this.els.stepReview.hidden      = (name !== 'review');

    if (this.els.modalTitle) {
      this.els.modalTitle.textContent = this.TITLES[name] || 'Checkout';
    }

    /* Scroll modal body to top on step change */
    var body = document.querySelector('#modalOverlay .modal');
    if (body) body.scrollTop = 0;
  },

  reset: function () {
    this.formData = null;

    var ids = ['fname', 'lname', 'email', 'phone', 'cpf',
               'cep', 'street', 'number', 'complement', 'district', 'city'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    var stateEl = document.getElementById('state');
    if (stateEl) stateEl.value = '';

    this.clearErrors();
    this.showStep('formData');
  },

  /* ---------- Masks and ZIP auto-fill ---------- */

  setupMasks: function () {
    Masks.apply(document.getElementById('cpf'),   Masks.cpf);
    Masks.apply(document.getElementById('phone'), Masks.phone);
    Masks.apply(document.getElementById('cep'),   Masks.cep);

    var cepInput  = document.getElementById('cep');
    var cepStatus = document.getElementById('cepStatus');
    var cepTimer  = null;
    var lastLookup = '';

    function setCepStatus(state, text) {
      cepStatus.className = 'cep-status' + (state ? ' ' + state : '');
      cepStatus.textContent = text || '';
      cepStatus.hidden = !text;
    }

    function fillAddress(addr) {
      var fill = function (id, val) {
        var el = document.getElementById(id);
        if (el) {
          el.value = val;
          el.parentElement.classList.remove('has-error');
        }
      };
      fill('street',   addr.street);
      fill('district', addr.district);
      fill('city',     addr.city);
      var stateEl = document.getElementById('state');
      if (stateEl && addr.state) {
        stateEl.value = addr.state;
        stateEl.parentElement.classList.remove('has-error');
      }
      /* Focus on Street Address so the user can fill it in */
      var streetEl = document.getElementById('street');
      if (streetEl) setTimeout(function () { streetEl.focus(); }, 80);
    }

    function lookupCep() {
      var digits = cepInput.value.replace(/\D/g, '');
      if (digits.length !== 5) return;
      if (digits === lastLookup) return; /* avoid duplicate calls */
      lastLookup = digits;

      setCepStatus('loading', 'Looking up address...');
      cepInput.parentElement.classList.remove('has-error');

      fetchAddressByCEP(cepInput.value).then(function (addr) {
        if (!addr) {
          setCepStatus('not-found', 'ZIP code not found. Please fill in the address manually.');
          return;
        }
        fillAddress(addr);
        setCepStatus('found', 'Address filled in automatically.');
      });
    }

    /* Trigger as soon as 5 digits are entered */
    cepInput.addEventListener('input', function () {
      clearTimeout(cepTimer);
      lastLookup = '';
      setCepStatus('', '');
      if (cepInput.value.replace(/\D/g, '').length === 5) {
        cepTimer = setTimeout(lookupCep, 350);
      }
    });

    /* Fallback: also trigger on blur */
    cepInput.addEventListener('blur', lookupCep);
  },

  /* ---------- Error clearing ---------- */

  clearErrors: function () {
    var self = this;
    ['formDataError', 'formAddressError', 'reviewError'].forEach(function (k) {
      if (self.els[k]) {
        self.els[k].textContent = '';
        self.els[k].hidden = true;
      }
    });
    document.querySelectorAll(
      '#stepFormData .has-error, #stepFormAddress .has-error'
    ).forEach(function (el) { el.classList.remove('has-error'); });
  },

  markFieldErrors: function (errors) {
    Object.keys(errors).forEach(function (k) {
      var el = document.getElementById(k);
      if (el) el.parentElement.classList.add('has-error');
    });
  },

  /* ---------- Step 1: Personal details ---------- */

  validateDataStep: function () {
    var checks = {
      fname: Validators.required(document.getElementById('fname').value),
      lname: Validators.required(document.getElementById('lname').value),
      email: Validators.email(document.getElementById('email').value),
      phone: Validators.phone(document.getElementById('phone').value),
      cpf:   Validators.cpf(document.getElementById('cpf').value)
    };
    var errors = {};
    Object.keys(checks).forEach(function (k) {
      if (!checks[k]) errors[k] = true;
    });
    return errors;
  },

  submitDataStep: function () {
    this.els.formDataError.hidden = true;
    document.querySelectorAll('#stepFormData .has-error').forEach(function (el) {
      el.classList.remove('has-error');
    });

    var errors = this.validateDataStep();
    if (Object.keys(errors).length > 0) {
      this.els.formDataError.textContent = 'Please check the highlighted fields before continuing.';
      this.els.formDataError.hidden = false;
      this.markFieldErrors(errors);
      return;
    }

    this.showStep('formAddress');
  },

  /* ---------- Step 2: Delivery address ---------- */

  validateAddressStep: function () {
    var checks = {
      cep:    Validators.cep(document.getElementById('cep').value),
      street: Validators.required(document.getElementById('street').value),
      city:   Validators.required(document.getElementById('city').value),
      state:  Validators.required(document.getElementById('state').value)
    };
    var errors = {};
    Object.keys(checks).forEach(function (k) {
      if (!checks[k]) errors[k] = true;
    });
    return errors;
  },

  submitAddressStep: function () {
    this.els.formAddressError.hidden = true;
    document.querySelectorAll('#stepFormAddress .has-error').forEach(function (el) {
      el.classList.remove('has-error');
    });

    var errors = this.validateAddressStep();
    if (Object.keys(errors).length > 0) {
      this.els.formAddressError.textContent = 'Please check the highlighted fields before continuing.';
      this.els.formAddressError.hidden = false;
      this.markFieldErrors(errors);
      return;
    }

    this.formData = this.collectFormData();
    this.renderReview();
    this.showStep('review');

    Track.lead();
  },

  goBackToData: function () {
    this.els.formAddressError.hidden = true;
    document.querySelectorAll('#stepFormAddress .has-error').forEach(function (el) {
      el.classList.remove('has-error');
    });
    this.showStep('formData');
  },

  goBackToForm: function () {
    this.clearErrors();
    this.showStep('formAddress');
  },

  /* ---------- Collect form data ---------- */

  collectFormData: function () {
    var get = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    return {
      fname:      get('fname'),
      lname:      get('lname'),
      name:       get('fname') + ' ' + get('lname'),
      email:      get('email'),
      phone:      get('phone'),
      cpf:        get('cpf'),
      cep:        get('cep'),
      street:     get('street'),
      number:     get('number'),
      complement: get('complement'),
      district:   get('district'),
      city:       get('city'),
      state:      get('state').toUpperCase()
    };
  },

  /* ---------- Order review ---------- */

  renderReview: function () {
    var data = this.formData;
    if (!data) return;

    var list = this.els.reviewItems;
    list.innerHTML = '';
    Cart.getProducts().forEach(function (p) {
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="review-item-name">' + p.name + '</span>' +
        '<span class="review-item-price">$ 0.00</span>';
      list.appendChild(li);
    });

    var addr =
      data.street +
      (data.number ? ', ' + data.number : '') +
      (data.complement ? ' ' + data.complement : '') + '<br>' +
      data.city + ', ' + data.state + ' ' + data.cep;
    this.els.reviewAddress.innerHTML = addr;

    this.els.reviewShippingLabel.textContent = 'Shipping to ' + data.city + ', ' + data.state;
  },

  /* ---------- PayPal ---------- */

  redirectToPayPal: function () {
    if (!this.formData) { this.showStep('formData'); return; }
    Track.addPaymentInfo();
    window.open(this.PAYPAL_URL, '_blank');
  }
};
