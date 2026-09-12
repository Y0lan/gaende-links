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

  document.querySelectorAll('.collection-toggle').forEach(button => {
    const browser = document.getElementById(button.getAttribute('aria-controls'));
    if (!browser) return;

    const syncCollectionState = () => {
      button.setAttribute('aria-expanded', String(browser.open));
      button.closest('.media-card')?.classList.toggle('is-open', browser.open);
    };

    button.addEventListener('click', () => {
      browser.open = !browser.open;
      syncCollectionState();
    });

    browser.addEventListener('toggle', syncCollectionState);
  });

  window.setTimeout(() => intro.classList.add('is-done'), reduceMotion.matches ? 0 : 1350);

  // TRACK HUNT title: drawn as an SVG whose viewBox is the exact glyph ink, so the outlined letters run
  // from the left edge of the first cover to the right edge of the last, with no font-box slack.
  const fitTitle = () => {
    const h = document.getElementById('playlists-title');
    if (!h) return;
    const text = 'TRACK HUNT', FS = 100;
    const cs = getComputedStyle(h);
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${cs.fontWeight} ${FS}px ${cs.fontFamily}`;
    const m = ctx.measureText(text);
    const x0 = -m.actualBoundingBoxLeft, x1 = m.actualBoundingBoxRight, y0 = -m.actualBoundingBoxAscent, y1 = m.actualBoundingBoxDescent;
    const fam = cs.fontFamily.replace(/"/g, "'");
    h.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" aria-hidden="true"><text x="0" y="0" font-family="${fam}" font-weight="${cs.fontWeight}" font-size="${FS}">${text}</text></svg><span class="visually-hidden">${text}</span>`;
  };
  fitTitle();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);

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
