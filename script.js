const backdrop = document.querySelector('.site-backdrop');
const backdropVideos = [
  document.querySelector('.backdrop-fill'),
  document.querySelector('.backdrop-video')
].filter(Boolean);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (backdrop && backdropVideos.length) {
  let frameRequest = 0;
  let lastRequestedTime = -1;

  const showSynchronizedFrame = () => {
    if (reducedMotion.matches || lastRequestedTime < 0) return;

    const videosAreReady = backdropVideos.every((video) => (
      video.readyState >= 2 &&
      !video.seeking &&
      Math.abs(video.currentTime - lastRequestedTime) < 0.12
    ));

    if (videosAreReady) {
      backdrop.classList.add('is-ready');
      backdrop.classList.remove('is-error');
    }
  };

  const seekVideoToScroll = () => {
    frameRequest = 0;
    if (reducedMotion.matches || backdropVideos.some((video) => video.readyState < 2)) return;

    const duration = backdropVideos[0].duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const scrollTop = Math.max(0, Math.min(maxScroll, window.scrollY || document.documentElement.scrollTop));
    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
    const firstClearFrame = Math.min(0.45, duration * 0.08);
    const lastClearFrame = Math.max(firstClearFrame, duration - 0.05);
    const targetTime = firstClearFrame + (lastClearFrame - firstClearFrame) * progress;

    if (Math.abs(targetTime - lastRequestedTime) < 0.025) return;

    try {
      backdropVideos.forEach((video) => {
        video.pause();
        if (Math.abs(video.currentTime - targetTime) >= 0.025) video.currentTime = targetTime;
      });
      lastRequestedTime = targetTime;
      showSynchronizedFrame();
    } catch {
      // Keep the poster visible if seeking is not available yet.
    }
  };

  const requestVideoFrame = () => {
    if (!frameRequest) frameRequest = window.requestAnimationFrame(seekVideoToScroll);
  };

  const showPoster = () => {
    backdrop.classList.remove('is-ready');
    backdrop.classList.add('is-error');
  };

  const syncMotionPreference = () => {
    backdropVideos.forEach((video) => {
      video.pause();
      video.loop = false;
      video.removeAttribute('autoplay');
      video.muted = true;
      video.preload = 'auto';
    });
    lastRequestedTime = -1;

    if (reducedMotion.matches) {
      backdrop.classList.remove('is-ready');
      return;
    }

    backdropVideos.forEach((video) => {
      if (video.readyState < 2) video.load();
    });
    requestVideoFrame();
  };

  backdropVideos.forEach((video) => {
    video.addEventListener('loadedmetadata', requestVideoFrame);
    video.addEventListener('loadeddata', requestVideoFrame);
    video.addEventListener('seeked', showSynchronizedFrame);
    video.addEventListener('error', showPoster);
  });

  window.addEventListener('scroll', requestVideoFrame, { passive: true });
  window.addEventListener('resize', requestVideoFrame, { passive: true });
  document.addEventListener('visibilitychange', requestVideoFrame);

  syncMotionPreference();
  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', syncMotionPreference);
  } else if (typeof reducedMotion.addListener === 'function') {
    reducedMotion.addListener(syncMotionPreference);
  }
}

document.querySelectorAll('.mobile-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    const menu = link.closest('.mobile-menu');
    if (menu) menu.open = false;
  });
});
