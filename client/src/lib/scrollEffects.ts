const COMPACT_SCROLL_Y = 56;

export function bindHeaderScroll(header: HTMLElement): () => void {
  const update = () => header.classList.toggle('is-compact', window.scrollY > COMPACT_SCROLL_Y);
  update();
  window.addEventListener('scroll', update, { passive: true });
  return () => window.removeEventListener('scroll', update);
}

export function bindScrollReveals(root: HTMLElement): () => void {
  const targets = Array.from(root.querySelectorAll<HTMLElement>('.reveal-on-scroll'));
  if (!targets.length) return () => {};

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') {
    targets.forEach((target) => target.classList.add('is-visible'));
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

  targets.forEach((target) => observer.observe(target));
  root.classList.add('js-reveals');
  return () => {
    observer.disconnect();
    root.classList.remove('js-reveals');
  };
}

export function bindHeroParallax(hero: HTMLElement, mark: HTMLElement): () => void {
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (motion?.matches) return () => {};

  let frame: number | null = null;
  const clear = () => {
    mark.style.transform = '';
    mark.style.opacity = '';
  };
  const update = () => {
    frame = null;
    const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(hero.offsetHeight, 1)));
    mark.style.transform = `translate3d(0, -${Math.round(progress * 68)}px, 0)`;
    mark.style.opacity = (1 - .66 * Math.min(1, Math.max(0, (progress - .1) / .9))).toFixed(3);
  };
  const schedule = () => {
    if (frame === null && !motion?.matches) frame = window.requestAnimationFrame(update);
  };
  const onMotionChange = () => {
    if (motion?.matches) {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      clear();
    } else schedule();
  };
  schedule();
  window.addEventListener('scroll', schedule, { passive: true });
  motion?.addEventListener('change', onMotionChange);
  return () => {
    window.removeEventListener('scroll', schedule);
    motion?.removeEventListener('change', onMotionChange);
    if (frame !== null) window.cancelAnimationFrame(frame);
    clear();
  };
}
