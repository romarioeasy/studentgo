/* =========================================
   Panelas Pará – Elegibilidade
   Controla verificação de CPF/nome e o modal
   de confirmação com animação por etapas.
   ========================================= */

var Eligibility = (function () {

  var STORAGE_KEY = 'panelas_elegib_v1';

  var STEPS = [
    'Verifying ID in federal records',
    'Checking beneficiary registry',
    'Verifying eligibility as a campaign beneficiary',
    'Confirming campaign inventory availability'
  ];

  /* Duração (ms) de cada etapa — simula tempos reais de consulta */
  var DURATIONS = [1600, 1900, 2100, 1300];

  var _verified = false;
  var _name = '';
  var _civilStatus = ''; /* 'solteira' | 'casada' */
  var _ready = false;
  var els = {};

  /* ─── Estado ──────────────────────────────── */

  function isVerified() {
    if (_verified) return true;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        _verified = true;
        _name = d.name || '';
        return true;
      }
    } catch (e) {}
    return false;
  }

  function setVerified(name, cpf, civil) {
    _verified = true;
    _name = name;
    _civilStatus = civil || '';
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: name, cpf: cpf, civil: civil }));
    } catch (e) {}
  }

  function getName() { return _name; }

  /* ─── Cache de elementos ──────────────────── */

  function cache() {
    els.overlay      = document.getElementById('eligOverlay');
    els.stepForm     = document.getElementById('eligStepForm');
    els.stepLoading  = document.getElementById('eligStepLoading');
    els.stepApproved = document.getElementById('eligStepApproved');
    els.form         = document.getElementById('eligForm');
    els.nameInput    = document.getElementById('eligName');
    els.cpfInput     = document.getElementById('eligCpf');
    els.submitBtn    = document.getElementById('eligSubmit');
    els.errorMsg     = document.getElementById('eligError');
    els.civilBtns    = document.querySelectorAll('.elig-civil-btn');
    els.overallFill  = document.getElementById('eligOverallFill');
    els.stepItems    = document.querySelectorAll('.elig-check-item');
    els.approvedName = document.getElementById('eligApprovedName');
    els.approvedBtn  = document.getElementById('eligApprovedBtn');
    _ready = true;
  }

  /* ─── Modal ───────────────────────────────── */

  function openModal() {
    if (!_ready) cache();
    showStep('form');
    els.errorMsg.hidden = true;
    els.submitBtn.disabled = false;
    els.nameInput.value = '';
    els.cpfInput.value  = '';
    /* Limpa seleção de estado civil */
    _civilStatus = '';
    els.civilBtns.forEach(function (btn) {
      btn.classList.remove('selected');
      btn.setAttribute('aria-pressed', 'false');
    });
    els.overlay.classList.add('open');
    UI.lockScroll();
    setTimeout(function () { els.nameInput.focus(); }, 100);
  }

  function closeModal() {
    if (!_ready) return;
    els.overlay.classList.remove('open');
    UI.unlockScroll();
  }

  function showStep(step) {
    els.stepForm.hidden     = (step !== 'form');
    els.stepLoading.hidden  = (step !== 'loading');
    els.stepApproved.hidden = (step !== 'approved');
  }

  /* ─── Formulário ──────────────────────────── */

  function bindForm() {
    /* Seleção de estado civil */
    els.civilBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        els.civilBtns.forEach(function (b) {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        _civilStatus = btn.dataset.value;
      });
    });

    /* Máscara de CPF em tempo real */
    els.cpfInput.addEventListener('input', function () {
      var v = els.cpfInput.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      els.cpfInput.value = v;
    });

    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit();
    });
  }

  function handleSubmit() {
    var name = els.nameInput.value.trim();
    var cpf  = els.cpfInput.value.replace(/\D/g, '');

    els.errorMsg.hidden = true;

    var words = name.split(/\s+/).filter(function (w) { return w.length > 0; });
    if (words.length < 2) {
      showFormError('Please enter your full name (first and last name).');
      els.nameInput.focus();
      return;
    }
    if (!Validators.cpf(cpf)) {
      showFormError('Invalid ID. Please enter the last 4 digits of your SSN.');
      els.cpfInput.focus();
      return;
    }

    if (!_civilStatus) {
      showFormError('Please select your marital status before continuing.');
      return;
    }

    els.submitBtn.disabled = true;
    showStep('loading');
    runVerification(name, cpf);
  }

  function showFormError(msg) {
    els.errorMsg.textContent = msg;
    els.errorMsg.hidden = false;
  }

  /* ─── Animação de verificação ─────────────── */

  function runVerification(name, cpf) {
    var items  = els.stepItems;
    var fill   = els.overallFill;
    var total  = STEPS.length;

    /* Reinicia estado visual */
    fill.style.transition = 'none';
    fill.style.width = '0%';
    for (var j = 0; j < items.length; j++) {
      items[j].classList.remove('done', 'active');
    }

    function runStep(i) {
      if (i >= total) {
        /* Todas as etapas concluídas — completa a barra e exibe aprovação */
        fill.style.transition = 'width 0.6s ease';
        fill.style.width = '100%';
        setTimeout(function () {
          setVerified(name, cpf, _civilStatus);
          var firstName = name.split(/\s+/)[0];
          if (els.approvedName) els.approvedName.textContent = firstName;
          showStep('approved');
        }, 750);
        return;
      }

      var item = items[i];
      item.classList.add('active');

      /* Progresso proporcional à etapa atual */
      var pct = Math.round(((i + 0.9) / total) * 95);
      var dur = DURATIONS[i];
      fill.style.transition = 'width ' + (dur / 1000) + 's linear';
      fill.style.width = pct + '%';

      setTimeout(function () {
        item.classList.remove('active');
        item.classList.add('done');
        setTimeout(function () { runStep(i + 1); }, 300);
      }, dur);
    }

    /* Pequeno delay antes de iniciar para o usuário perceber a transição de tela */
    setTimeout(function () { runStep(0); }, 500);
  }

  /* ─── Inicialização ───────────────────────── */

  function init() {
    cache();
    bindForm();

    /* Botão "Escolher minha panela" → fecha modal + scroll para catálogo */
    els.approvedBtn.addEventListener('click', function () {
      closeModal();
      var sec = document.getElementById('cars');
      if (sec) {
        setTimeout(function () {
          sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 350);
      }
    });

    /* Fecha ao clicar no fundo escuro */
    els.overlay.addEventListener('click', function (e) {
      if (e.target === els.overlay) closeModal();
    });
  }

  return {
    isVerified : isVerified,
    getName    : getName,
    openModal  : openModal,
    closeModal : closeModal,
    init       : init
  };

}());
