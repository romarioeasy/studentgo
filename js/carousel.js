/* =========================================
   Panelas Pará – Carrossel de banners
   Auto-rotação, dots clicáveis e swipe mobile.
   ========================================= */

(function () {

  var track    = document.getElementById('carouselTrack');
  if (!track) return;

  var dots     = document.querySelectorAll('.carousel-dot');
  var total    = dots.length;
  var current  = 0;
  var timer    = null;
  var INTERVAL = 5000; /* ms entre slides */

  /* ─── Navegação ──────────────────────────── */

  function goTo(index) {
    current = ((index % total) + total) % total;
    track.style.transform = 'translateX(-' + current * 100 + '%)';
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === current);
    });
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () { goTo(current + 1); }, INTERVAL);
  }

  /* ─── Dots clicáveis ────────────────────── */

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      goTo(i);
      startTimer();
    });
  });

  /* ─── Swipe (mobile) ────────────────────── */

  var touchStartX = 0;

  track.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', function (e) {
    var diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      goTo(current + (diff > 0 ? 1 : -1));
      startTimer();
    }
  }, { passive: true });

  /* ─── Pausa ao passar o mouse (desktop) ─── */

  track.addEventListener('mouseenter', function () { clearInterval(timer); });
  track.addEventListener('mouseleave', startTimer);

  /* ─── Inicia ────────────────────────────── */

  startTimer();

}());
