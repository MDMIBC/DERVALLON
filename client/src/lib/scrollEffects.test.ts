// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindHeaderScroll, bindHeroParallax, bindScrollReveals } from './scrollEffects';

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('bindHeaderScroll', () => {
  it('compacts only after scrolling and restores the full logo near the top', () => {
    const header = document.createElement('header');
    document.body.append(header);
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    const stop = bindHeaderScroll(header);
    expect(header.classList.contains('is-compact')).toBe(false);
    window.scrollY = 96;
    window.dispatchEvent(new Event('scroll'));
    expect(header.classList.contains('is-compact')).toBe(true);
    window.scrollY = 0;
    window.dispatchEvent(new Event('scroll'));
    expect(header.classList.contains('is-compact')).toBe(false);
    stop();
  });

  it('does not keep changing the header after cleanup', () => {
    const header = document.createElement('header');
    document.body.append(header);
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    const stop = bindHeaderScroll(header);
    stop();
    window.scrollY = 100;
    window.dispatchEvent(new Event('scroll'));
    expect(header.classList.contains('is-compact')).toBe(false);
  });
});

describe('bindScrollReveals', () => {
  it('reveals targets when they enter the viewport and does not observe them again', () => {
    const root = document.createElement('main');
    root.innerHTML = '<section class="reveal-on-scroll"></section>';
    document.body.append(root);
    let notify: IntersectionObserverCallback = () => {};
    const observed: Element[] = [];
    const unobserved: Element[] = [];
    const disconnect = vi.fn();
    class FakeObserver {
      constructor(callback: IntersectionObserverCallback) { notify = callback; }
      observe(node: Element) { observed.push(node); }
      unobserve(node: Element) { unobserved.push(node); }
      disconnect() { disconnect(); }
    }
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const stop = bindScrollReveals(root);
    const target = root.querySelector('section')!;
    expect(observed).toEqual([target]);
    expect(root.classList.contains('js-reveals')).toBe(true);
    expect(target.classList.contains('is-visible')).toBe(false);
    notify([{ target, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(target.classList.contains('is-visible')).toBe(true);
    expect(unobserved).toEqual([target]);
    stop();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('keeps content visible when reduced motion is requested or observers are unavailable', () => {
    const root = document.createElement('main');
    root.innerHTML = '<section class="reveal-on-scroll"></section>';
    document.body.append(root);
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const stop = bindScrollReveals(root);
    expect(root.querySelector('section')?.classList.contains('is-visible')).toBe(true);
    expect(root.classList.contains('js-reveals')).toBe(false);
    stop();
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('IntersectionObserver', undefined);
    const stopWithoutObserver = bindScrollReveals(root);
    expect(root.querySelector('section')?.classList.contains('is-visible')).toBe(true);
    stopWithoutObserver();
  });
});

describe('bindHeroParallax', () => {
  it('moves and fades the logo only as the visitor scrolls through the hero, then stops on cleanup', () => {
    const hero = document.createElement('section');
    const mark = document.createElement('h1');
    hero.append(mark);
    document.body.append(hero);
    Object.defineProperty(hero, 'offsetHeight', { value: 800, configurable: true });
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));

    const stop = bindHeroParallax(hero, mark);
    frames.shift()?.(0);
    expect(mark.style.opacity).toBe('1');
    window.scrollY = 400;
    window.dispatchEvent(new Event('scroll'));
    frames.shift()?.(0);
    expect(mark.style.transform).toContain('translate3d(0, -');
    expect(Number(mark.style.opacity)).toBeLessThan(1);
    window.scrollY = 900;
    window.dispatchEvent(new Event('scroll'));
    frames.shift()?.(0);
    expect(Number(mark.style.opacity)).toBeGreaterThanOrEqual(.3);
    expect(Number(mark.style.opacity)).toBeLessThan(.5);
    stop();
    expect(mark.style.transform).toBe('');
    expect(mark.style.opacity).toBe('');
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(0);
  });

  it('keeps the logo static and fully visible when reduced motion is preferred', () => {
    const hero = document.createElement('section');
    const mark = document.createElement('h1');
    const frame = vi.fn();
    vi.stubGlobal('requestAnimationFrame', frame);
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }));
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 400 });
    const stop = bindHeroParallax(hero, mark);
    window.dispatchEvent(new Event('scroll'));
    expect(mark.style.opacity).toBe('');
    expect(mark.style.transform).toBe('');
    expect(frame).not.toHaveBeenCalled();
    stop();
  });
});
