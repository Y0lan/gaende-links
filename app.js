(() => {
  const body = document.body;
  const video = document.getElementById('roar-video');
  const intro = document.getElementById('intro');
  const motionToggle = document.getElementById('motion-toggle');
  const backgroundAudio = document.getElementById('background-audio');
  const audioToggle = document.getElementById('audio-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const storedMotion = localStorage.getItem('gaende-motion');

  const setMotion = (paused, remember = true) => {
    body.classList.toggle('motion-paused', paused);
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionToggle.textContent = paused ? 'PLAY MOTION' : 'PAUSE MOTION';

    if (paused) {
      video.pause();
    } else {
      video.play().catch(() => {
        body.classList.add('motion-paused');
        motionToggle.setAttribute('aria-pressed', 'true');
        motionToggle.textContent = 'PLAY MOTION';
      });
    }

    if (remember) {
      localStorage.setItem('gaende-motion', paused ? 'paused' : 'playing');
    }
  };

  const initialPause = reduceMotion.matches || saveData || storedMotion === 'paused';
  setMotion(initialPause, false);

  motionToggle.addEventListener('click', () => {
    setMotion(!document.body.classList.contains('motion-paused'), true);
  });

  const setAudio = async playing => {
    if (playing) {
      try {
        backgroundAudio.volume = 0.32;
        await backgroundAudio.play();
        audioToggle.setAttribute('aria-pressed', 'true');
        audioToggle.setAttribute('aria-label', 'Pause Inhale background music');
        audioToggle.querySelector('span').textContent = 'Ⅱ';
      } catch {
        audioToggle.setAttribute('aria-pressed', 'false');
      }
    } else {
      backgroundAudio.pause();
      audioToggle.setAttribute('aria-pressed', 'false');
      audioToggle.setAttribute('aria-label', 'Play Inhale as background music');
      audioToggle.querySelector('span').textContent = '▶';
    }
  };

  audioToggle.addEventListener('click', () => {
    setAudio(backgroundAudio.paused);
  });

  backgroundAudio.addEventListener('error', () => {
    audioToggle.disabled = true;
    audioToggle.textContent = 'AUDIO UNAVAILABLE';
  });

  reduceMotion.addEventListener?.('change', event => {
    if (event.matches) setMotion(true, false);
  });

  const buildPlayer = button => {
    const provider = button.dataset.provider;
    if (provider === 'soundcloud') {
      const source = encodeURIComponent(button.dataset.url);
      const iframe = document.createElement('iframe');
      iframe.title = 'SoundCloud player';
      iframe.height = '166';
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay';
      iframe.src = `https://w.soundcloud.com/player/?url=${source}&color=%23ee1f09&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
      return iframe;
    }

    if (provider === 'spotify') {
      const iframe = document.createElement('iframe');
      iframe.title = 'Spotify player';
      iframe.height = '352';
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      iframe.src = `https://open.spotify.com/embed/${button.dataset.kind}/${button.dataset.id}?utm_source=oembed`;
      return iframe;
    }

    return null;
  };

  document.querySelectorAll('.preview-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const opening = button.getAttribute('aria-expanded') !== 'true';
      const card = button.closest('.media-card, .playlist-card');

      button.setAttribute('aria-expanded', String(opening));
      panel.hidden = !opening;
      card?.classList.toggle('is-open', opening);

      if (opening && !panel.dataset.loaded) {
        panel.innerHTML = '<div class="media-preview__loading">LOADING PLAYER</div>';
        const player = buildPlayer(button);
        if (player) {
          const clearLoading = () => panel.querySelector('.media-preview__loading')?.remove();
          player.addEventListener('load', clearLoading, { once: true });
          window.setTimeout(clearLoading, 5000);
          panel.append(player);
          panel.dataset.loaded = 'true';
        } else {
          panel.innerHTML = '<div class="media-preview__error">PLAYER UNAVAILABLE. USE THE OPEN LINK.</div>';
        }
      }

      if (!opening) {
        panel.querySelector('iframe')?.contentWindow?.postMessage(JSON.stringify({ method: 'pause' }), '*');
      }
    });
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
