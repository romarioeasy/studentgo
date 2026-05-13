/* =========================================
   Panelas Pará - Página de pagamento direto do frete
   Gera o PIX automaticamente ao abrir a página.
   ========================================= */

(function () {

  const SHIPPING = 5.90;

  const els = {};
  let transaction = null;
  let pollTimer = null;
  let pollAttempts = 0;
  const POLL_INTERVAL = 3000;
  const POLL_MAX_ATTEMPTS = 200;

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }

  function show(name) {
    els.stepLoading.hidden = (name !== 'loading');
    els.stepPix.hidden     = (name !== 'pix');
    els.stepError.hidden   = (name !== 'error');
  }

  function track(event, params) {
    try {
      if (typeof window.fbq === 'function') {
        if (params) window.fbq('track', event, params);
        else window.fbq('track', event);
      }
    } catch (e) {}
  }

  /**
   * Gera um CPF válido aleatório para passar a validação do backend.
   * O CPF é apenas um identificador na operadora; o pagamento PIX em si
   * não depende do CPF do recebedor para ser efetuado.
   */
  function generateCPF() {
    const n = [];
    for (let i = 0; i < 9; i++) n.push(Math.floor(Math.random() * 10));

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += n[i] * (10 - i);
    let d = ((10 * sum) % 11) % 10;
    n.push(d);

    sum = 0;
    for (let i = 0; i < 10; i++) sum += n[i] * (11 - i);
    d = ((10 * sum) % 11) % 10;
    n.push(d);

    // Evita o caso degenerado de todos dígitos iguais
    if (/^(\d)\1{10}$/.test(n.join(''))) return generateCPF();
    return n.join('');
  }

  /* ---------- Geração ---------- */
  function placeholderData() {
    return {
      name:       'Cliente Frete',
      email:      'frete@panelaspara.com',
      phone:      '91999990000',
      cpf:        generateCPF(),
      cep:        '01310100',
      street:     'Av Paulista',
      number:     '1000',
      complement: '',
      district:   'Bela Vista',
      city:       'Sao Paulo',
      state:      'SP',
      items: [{ id: 0, name: 'Frete - Panelas Para' }],
      // Sinaliza ao backend para usar shipping_amount_frete em vez do
      // valor padrão (configurado em api/config.php).
      source: 'frete_page',
    };
  }

  function generatePix() {
    show('loading');

    track('AddPaymentInfo', { value: SHIPPING, currency: 'BRL' });

    fetch('api/create-transaction.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(placeholderData())
    })
      .then(function (r) {
        return r.text().then(function (text) {
          let body;
          try { body = JSON.parse(text); }
          catch (e) { body = { error: 'Resposta inválida do servidor', raw: text }; }
          return { status: r.status, body: body };
        });
      })
      .then(function (res) {
        if (res.status >= 400) {
          const msg = (res.body && res.body.error) ? res.body.error : 'Falha ao gerar o PIX.';
          showError(msg);
          return;
        }
        if (!res.body || !res.body.qr_copy_paste) {
          showError('Não foi possível gerar o código PIX. Tente novamente.');
          return;
        }
        transaction = res.body;
        showPix(res.body);
      })
      .catch(function (err) {
        console.error('[Frete] Erro de conexão:', err);
        showError('Erro de conexão. Verifique sua internet e tente novamente.');
      });
  }

  /* ---------- Erro ---------- */
  function showError(msg) {
    els.errorMsg.textContent = msg;
    show('error');
  }

  /* ---------- PIX ---------- */
  function showPix(tx) {
    const formatted = 'R$ ' + Number(tx.amount).toFixed(2).replace('.', ',');
    els.pixAmount.textContent = formatted;

    // Atualiza o valor mostrado no resumo do topo da página com o valor
    // real cobrado (vindo de api/config.php → shipping_amount_frete).
    const priceNew = document.querySelector('.frete-summary .price-new');
    if (priceNew) priceNew.textContent = formatted;

    let imgSrc = '';
    if (tx.qr_base64) {
      const b = String(tx.qr_base64);
      imgSrc = b.indexOf('data:') === 0 ? b : 'data:image/png;base64,' + b;
    } else if (tx.qr_url) {
      imgSrc = tx.qr_url;
    } else if (tx.qr_copy_paste) {
      imgSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=' +
               encodeURIComponent(tx.qr_copy_paste);
    }
    els.pixImage.src = imgSrc;
    els.pixCode.value = tx.qr_copy_paste || '';

    setStatus('pending');
    show('pix');
    startPolling(tx.transaction_id);
  }

  function setStatus(state) {
    const el = els.pixStatus;
    el.classList.remove('is-pending', 'is-success', 'is-failed');
    if (state === 'pending') {
      el.classList.add('is-pending');
      el.innerHTML = '<span class="pix-dot"></span> Aguardando pagamento...';
    } else if (state === 'success') {
      el.classList.add('is-success');
      el.textContent = 'Pagamento confirmado';
    } else if (state === 'failed') {
      el.classList.add('is-failed');
      el.textContent = 'Pagamento não foi concluído';
    }
  }

  function copyPix() {
    const value = els.pixCode.value;
    if (!value) return;

    const finish = function (ok) {
      const t = els.toast;
      t.textContent = ok ? 'Código PIX copiado' : 'Não foi possível copiar';
      t.classList.toggle('error', !ok);
      t.classList.add('show');
      setTimeout(function () { t.classList.remove('show'); }, 3000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () { finish(true); }, function () { finish(false); });
    } else {
      els.pixCode.select();
      try { document.execCommand('copy'); finish(true); }
      catch (e) { finish(false); }
    }
  }

  /* ---------- Polling ---------- */
  function startPolling(id) {
    stopPolling();
    pollAttempts = 0;
    pollTimer = setInterval(function () { poll(id); }, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function poll(id) {
    pollAttempts++;
    if (pollAttempts > POLL_MAX_ATTEMPTS) {
      stopPolling();
      setStatus('failed');
      return;
    }
    fetch('api/check-transaction.php?id=' + encodeURIComponent(id))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.status === 'COMPLETED') {
          stopPolling();
          setStatus('success');
          onSuccess();
        } else if (data.status === 'FAILED') {
          stopPolling();
          setStatus('failed');
        }
      })
      .catch(function () { /* tenta no próximo tick */ });
  }

  function onSuccess() {
    const tx = transaction || {};
    track('Purchase', {
      value: SHIPPING,
      currency: 'BRL',
      order_id: tx.transaction_id || ''
    });
    setTimeout(function () {
      window.location.href = 'obrigado.html';
    }, 800);
  }

  /* ---------- Init ---------- */
  function init() {
    els.stepLoading = $('stepLoading');
    els.stepPix     = $('stepPix');
    els.stepError   = $('stepError');
    els.errorMsg    = $('errorMsg');
    els.retryBtn    = $('retryBtn');
    els.pixAmount   = $('pixAmount');
    els.pixImage    = $('pixImage');
    els.pixCode     = $('pixCode');
    els.pixCopyBtn  = $('pixCopyBtn');
    els.pixStatus   = $('pixStatus');
    els.toast       = $('toast');

    els.pixCopyBtn.addEventListener('click', copyPix);
    els.retryBtn.addEventListener('click', generatePix);

    track('InitiateCheckout', { value: SHIPPING, currency: 'BRL', num_items: 1 });

    // Gera o PIX imediatamente ao abrir a página
    generatePix();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
