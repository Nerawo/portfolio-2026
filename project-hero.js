// One intrinsic-ratio detector for every project hero; no project-name rules.
(() => {
  const hero = document.querySelector('.case-hero');
  const media = hero?.querySelector('.case-hero-media > img, .case-hero-media > video');
  if (!media) return;

  function updateRatio() {
    const width = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
    const height = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
    if (!width || !height) return; // Keep the dimension-based reservation until decoding succeeds.
    hero.classList.toggle('case-hero--portrait', height > width);
    hero.dataset.mediaOrientation = height > width ? 'portrait' : 'landscape';
    hero.dataset.ratioSource = 'intrinsic';
    hero.style.setProperty('--hero-media-ratio', `${width} / ${height}`);
    hero.style.setProperty('--hero-media-aspect', width / height);
    hero.style.setProperty('--hero-media-natural-width', width + 'px');
  }

  if (media instanceof HTMLVideoElement) {
    media.addEventListener('loadedmetadata', updateRatio);
    media.addEventListener('resize', updateRatio);
    // Read stream dimensions without autoplay; only the hero needs metadata.
    // Run after other page setup so a shared preload default cannot override this.
    const requestMetadata = () => {
      if (media.readyState >= 1) updateRatio();
      else { media.preload = 'metadata'; media.load(); }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', requestMetadata, { once: true });
    else requestMetadata();
  } else {
    media.addEventListener('load', updateRatio);
  }
  updateRatio();
})();
