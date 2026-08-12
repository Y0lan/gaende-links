(() => {
  const body = document.body;
  const video = document.getElementById('roar-video');
  const intro = document.getElementById('intro');
  const toggle = document.getElementById('motion-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const storedMotion = localStorage.getItem('gaende-motion');

  const setMotion = (paused, remember = true) => {
    body.classList.toggle('motion-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'PLAY MOTION' : 'PAUSE MOTION';

    if (paused) {
      video.pause();
    } else {
      video.play().catch(() => {
        body.classList.add('motion-paused');
        toggle.setAttribute('aria-pressed', 'true');
        toggle.textContent = 'PLAY MOTION';
      });
    }

    if (remember) {
      localStorage.setItem('gaende-motion', paused ? 'paused' : 'playing');
    }
  };

  const initialPause = reduceMotion.matches || saveData || storedMotion === 'paused';
  setMotion(initialPause, false);

  toggle.addEventListener('click', () => {
    setMotion(!body.classList.contains('motion-paused'));
  });

  reduceMotion.addEventListener?.('change', event => {
    if (event.matches) setMotion(true, false);
  });

  window.setTimeout(() => intro.classList.add('is-done'), reduceMotion.matches ? 0 : 1350);

  const revealItems = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealItems.forEach(item => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

  revealItems.forEach(item => observer.observe(item));
})();
