// @vitest-environment jsdom
import { act } from 'react';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import CustomOrderPage from './CustomOrderPage';
import { AccountPage, StudioPage } from './DrevallonPages';
import { fabricStudies, isFabricSelectable } from '@/lib/orderPreview';
import { stellaFabrics } from '@/content/stellaFabrics';

const accountMocks = vi.hoisted(() => ({
  query: (data: unknown) => ({ data, isLoading: false, refetch: vi.fn() }),
  mutation: () => ({ mutate: vi.fn((_input: unknown, options?: { onSuccess?: (value: unknown) => void }) => options?.onSuccess?.({ id: 1 })), isPending: false }),
}));
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Sample Client', email: 'sample@example.com' }, loading: false, error: null, isAuthenticated: true, logout: vi.fn() }),
}));
vi.mock('@/lib/trpc', () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn() } } }),
    account: {
      fitProfile: { get: { useQuery: () => accountMocks.query({ current: null, history: [], preferences: null }) } },
      designs: { list: { useQuery: () => accountMocks.query([]) }, get: { useQuery: () => accountMocks.query(undefined) }, save: { useMutation: accountMocks.mutation }, delete: { useMutation: accountMocks.mutation } },
      orders: { list: { useQuery: () => accountMocks.query([]) } },
      wardrobe: { list: { useQuery: () => accountMocks.query([]) } },
      profile: { update: { useMutation: accountMocks.mutation } },
    },
  },
}));

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  vi.stubGlobal('fetch', vi.fn());
  window.localStorage.clear();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(<CustomOrderPage />); });
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
  vi.unstubAllGlobals();
});

async function press(selector: string) {
  const button = host.querySelector<HTMLButtonElement>(selector);
  expect(button, `Button ${selector} should exist`).not.toBeNull();
  await act(async () => { button?.click(); });
}

async function enter(selector: string, value: string) {
  const field = host.querySelector<HTMLInputElement>(selector);
  expect(field, `Input ${selector} should exist`).not.toBeNull();
  await act(async () => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    set?.call(field, value);
    field?.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function chooseCollection(name: string) {
  const collection = host.querySelector<HTMLSelectElement>('select[data-fabric-ref-collection]');
  expect(collection, 'Collection dropdown should exist').not.toBeNull();
  await act(async () => { if (collection) { collection.value = name; collection.dispatchEvent(new Event('change', { bubbles: true })); } });
}

async function advanceToMeasurements() {
  await press('button[aria-label="Select Midnight navy"]');
  await press('button[data-action="continue"]');
  await press('button[aria-label="Select Tailored silhouette"]');
  await press('button[aria-label="Select Notch lapel"]');
  await press('button[data-action="continue"]');
}

describe('custom-order frontend preview', () => {
  it('browses original fabric references by collection and selects one without inventing fabric properties', async () => {
    expect(stellaFabrics).toHaveLength(209);
    const collection = host.querySelector<HTMLSelectElement>('select[data-fabric-ref-collection]');
    expect(collection?.options).toHaveLength(4);
    expect(host.querySelectorAll('button[data-fabric-ref-id]')).toHaveLength(12);
    expect(host.textContent).toContain('41 references');
    expect(host.querySelector('button[data-fabric-ref-id] img')?.getAttribute('src')).toMatch(/^\/manus-storage\//);
    await press('button[data-action="fabric-ref-more"]');
    expect(host.querySelectorAll('button[data-fabric-ref-id]')).toHaveLength(24);
    await act(async () => { if (collection) { collection.value = 'HERITAGE'; collection.dispatchEvent(new Event('change', { bubbles: true })); } });
    expect(host.textContent).toContain('61 references');
    expect(host.querySelectorAll('button[data-fabric-ref-id]')).toHaveLength(12);
    const choice = host.querySelector<HTMLButtonElement>('button[data-fabric-ref-id]');
    expect(choice?.dataset.fabricRefId).toMatch(/^stella:HERITAGE:/);
    await act(async () => { choice?.click(); });
    expect(choice?.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.co-summary-content')?.textContent).toContain(`HERITAGE · ${choice?.dataset.fabricRefId?.split(':').at(-1)}`);
    expect(host.querySelector('button[data-action="continue"]')?.hasAttribute('disabled')).toBe(false);
  });

  it('shows each collection’s full reference total, unchanged by Show more', async () => {
    const totals = { '1000 TWISTS': 41, HERITAGE: 61, KALEIDOLUX: 54, 'NEW EMPIRE': 53 } as const;
    for (const name of ['HERITAGE', '1000 TWISTS', 'NEW EMPIRE', 'KALEIDOLUX', 'HERITAGE'] as const) {
      await chooseCollection(name);
      expect(host.querySelector('.co-fabric-ref-count')?.textContent).toBe(`${totals[name]} references in ${name}`);
      expect(host.querySelectorAll('button[data-fabric-ref-id]')).toHaveLength(12);
    }
    await press('button[data-action="fabric-ref-more"]');
    expect(host.querySelectorAll('button[data-fabric-ref-id]')).toHaveLength(24);
    expect(host.querySelector('.co-fabric-ref-count')?.textContent).toBe('61 references in HERITAGE');
  });
  it('keeps the collection count current after browser translation rewrites the label text', async () => {
    const label = host.querySelector<HTMLElement>('.co-fabric-ref-count');
    // Browser page translation (for example Chrome / Google Translate) swaps each text node for <font> wrappers.
    for (const node of Array.from(label?.childNodes ?? [])) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const wrapper = document.createElement('font');
      wrapper.textContent = node.nodeValue;
      label?.replaceChild(wrapper, node);
    }
    await chooseCollection('HERITAGE');
    expect(host.querySelector('.co-fabric-ref-count')?.textContent).toBe('61 references in HERITAGE');
    await chooseCollection('KALEIDOLUX');
    expect(host.querySelector('.co-fabric-ref-count')?.textContent).toBe('54 references in KALEIDOLUX');
    await chooseCollection('NEW EMPIRE');
    expect(host.querySelector('.co-fabric-ref-count')?.textContent).toBe('53 references in NEW EMPIRE');
  });
  it('presents the fabric collections as DERVALLON collections without naming the supplier', () => {
    const browser = host.querySelector<HTMLElement>('.co-fabric-ref-browser');
    expect(browser?.querySelector('p')?.textContent).toBe('Browse the original numbered fabric swatches from the DERVALLON collections. Some references share the same photography. Images and codes do not confirm composition, availability, or price. Please verify fabric details before making a garment.');
    expect(host.textContent).not.toMatch(/stella/i);
    const accessibleText = Array.from(host.querySelectorAll('[aria-label], img[alt], [title]')).map((element) => `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('alt') ?? ''} ${element.getAttribute('title') ?? ''}`).join(' ');
    expect(accessibleText).not.toMatch(/stella/i);
  });

  it('uses neutral fabric-reference identifiers in the browser markup while keeping catalogue IDs unchanged', async () => {
    const heading = Array.from(host.querySelectorAll('h3')).find((element) => element.textContent === 'Explore the collections.');
    const browser = heading?.closest('section');
    expect(browser, 'Fabric reference browser should exist').toBeTruthy();
    await press('button[data-action="fabric-ref-more"]');
    const offending: string[] = [];
    for (const element of [browser as Element, ...Array.from(browser?.querySelectorAll('*') ?? [])]) {
      for (const attribute of Array.from(element.attributes)) {
        // The data-fabric-ref-id value is the catalogue reference ID (a persisted compatibility contract), so only its name is checked.
        const value = attribute.name === 'data-fabric-ref-id' ? '' : attribute.value;
        if (/stella/i.test(attribute.name) || /stella/i.test(value)) offending.push(`${element.tagName.toLowerCase()} ${attribute.name}="${attribute.value}"`);
      }
    }
    expect(offending).toEqual([]);
    expect(browser?.querySelector('select[data-fabric-ref-collection]')).toBeTruthy();
    expect(browser?.querySelectorAll('button[data-fabric-ref-id]')).toHaveLength(24);
    expect(browser?.querySelector('button[data-fabric-ref-id]')?.getAttribute('data-fabric-ref-id')).toBe(stellaFabrics[0].id);
    expect(host.querySelectorAll('button[data-fabric-id]')).toHaveLength(4);
  });

  it('has a distinct lazy route and a visible entry from the existing Design Studio', () => {
    const clientRoot = existsSync(resolve(process.cwd(), 'src/App.tsx')) ? process.cwd() : resolve(process.cwd(), 'client');
    const appSource = readFileSync(resolve(clientRoot, 'src/App.tsx'), 'utf8');
    expect(appSource).toContain('path="/custom-order"');
    const studio = new DOMParser().parseFromString(renderToStaticMarkup(<StudioPage />), 'text/html');
    expect(studio.querySelector('a[href="/custom-order"]')?.textContent).toMatch(/Bespoke Studio/i);
  });

  it('links from the account measurement area without claiming measurements can never be entered', () => {
    const account = new DOMParser().parseFromString(renderToStaticMarkup(<AccountPage />), 'text/html');
    expect(account.querySelector('a[href="/custom-order"]')?.textContent).toMatch(/Bespoke Studio/i);
    expect(account.body.textContent).toContain('Your proportions');
    expect(account.body.textContent).not.toMatch(/secure account|review build|preview only/i);
  });

  it('offers four labelled sample fabrics and discloses that no purchase is possible', () => {
    const form = host.querySelector('form[aria-labelledby="co-stage-title"]');
    expect(form).not.toBeNull();
    expect(form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))).toBe(false);
    expect(host.querySelectorAll('button[data-fabric-id]')).toHaveLength(4);
    expect(host.querySelector('nav[aria-label="Custom order progress"]')).not.toBeNull();
    expect(host.querySelector('[role="group"][aria-label="Fabric studies"]')).not.toBeNull();
    expect(host.textContent).toMatch(/This is a design exploration/i);
    expect(host.querySelector('button[data-action="continue"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('keeps fabric records customer-safe and prevents unavailable records from being selected', () => {
    expect(fabricStudies.length).toBeGreaterThanOrEqual(4);
    expect(fabricStudies.every((fabric) => fabric.reference && fabric.colour && fabric.pattern && fabric.composition && fabric.availability)).toBe(true);
    expect(fabricStudies.some((fabric) => 'supplierCost' in fabric || 'supplierCode' in fabric)).toBe(false);
    expect(isFabricSelectable(fabricStudies[0])).toBe(true);
    expect(isFabricSelectable({ ...fabricStudies[0], availability: 'Discontinued' })).toBe(false);
    expect(isFabricSelectable({ ...fabricStudies[0], availability: 'Temporarily unavailable' })).toBe(false);
  });

  it('offers progressive fabric filters, demo disclosure, and a reset action', async () => {
    expect(host.querySelector('[data-fabric-filter="colour"]')).not.toBeNull();
    expect(host.querySelector('[data-fabric-filter="pattern"]')).not.toBeNull();
    expect(host.querySelector('[data-action="reset-fabric-filters"]')).not.toBeNull();
    expect(host.textContent).toMatch(/fabric direction/i);
    const colour = host.querySelector<HTMLSelectElement>('[data-fabric-filter="colour"]');
    await act(async () => {
      if (colour) { colour.value = 'Charcoal'; colour.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    expect(host.querySelectorAll('button[data-fabric-id]').length).toBeGreaterThan(0);
    expect(host.querySelectorAll('button[data-fabric-id]').length).toBeLessThan(fabricStudies.length);
    await press('button[data-action="reset-fabric-filters"]');
    expect(host.querySelectorAll('button[data-fabric-id]')).toHaveLength(fabricStudies.length);
  });

  it('supports a dark canvas and readable input/selection surfaces in dark mode', () => {
    const clientRoot = existsSync(resolve(process.cwd(), 'src/App.tsx')) ? process.cwd() : resolve(process.cwd(), 'client');
    const css = readFileSync(resolve(clientRoot, 'src/pages/custom-order.css'), 'utf8');
    expect(css).toMatch(/\.dark-mode \.custom-order\s*\{[^}]*background:/);
    expect(css).toMatch(/\.dark-mode \.custom-order \.co-panel\s*\{[^}]*background:/);
    expect(css).toMatch(/\.dark-mode \.custom-order \.co-input-wrap\s*\{[^}]*background:/);
  });

  it('keeps selections when going back, catches invalid measurements, and summarizes corrected values', async () => {
    await advanceToMeasurements();
    expect(host.querySelector('input[name="chest"]')).not.toBeNull();
    expect(host.querySelector('button[data-action="continue"]')?.textContent).toMatch(/skip measurements/i);
    await enter('input[name="chest"]', '0');
    await press('button[data-action="continue"]');
    expect(host.textContent).toMatch(/greater than zero/i);
    expect(host.querySelector('input[name="chest"]')?.getAttribute('aria-invalid')).toBe('true');
    await enter('input[name="chest"]', '102.5');
    await press('button[data-action="continue"]');
    expect(host.textContent).toMatch(/102\.5 cm/);
    await press('button[data-action="back"]');
    expect(host.querySelector<HTMLInputElement>('input[name="chest"]')?.value).toBe('102.5');
    expect(document.activeElement?.tagName).toBe('H2');
  });

  it('completes an explicit design without placing an order or storing measurements in the browser', async () => {
    await advanceToMeasurements();
    await enter('input[name="chest"]', '102.5');
    await press('button[data-action="continue"]');
    await act(async () => { host.querySelector<HTMLInputElement>('input[name="review-confirmed"]')?.click(); });
    await press('button[data-action="complete"]');
    expect(host.textContent).toMatch(/no order was placed or sent/i);
    expect(host.querySelector('button[data-action="restart"]')).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(Object.values(window.localStorage).join(' ')).not.toContain('102.5');
  });

  it('requires a deliberate double-check of all measurements, fabric and style before preview confirmation', async () => {
    await advanceToMeasurements();
    await enter('input[name="chest"]', '102.5');
    await press('button[data-action="continue"]');
    const review = host.querySelector('.co-panel');
    expect(review?.textContent).toMatch(/midnight navy/i);
    expect(review?.textContent).toMatch(/102\.5 cm/);
    expect(review?.querySelectorAll('[data-review-measurement]')).toHaveLength(6);
    expect(review?.textContent).toMatch(/not supplied/i);
    expect(review?.querySelector('button[data-action="edit-measurements"]')).not.toBeNull();
    expect(review?.querySelector('button[data-action="complete"]')?.hasAttribute('disabled')).toBe(true);
    const acknowledgement = review?.querySelector<HTMLInputElement>('input[name="review-confirmed"]');
    expect(acknowledgement?.checked).toBe(false);
    await act(async () => { acknowledgement?.click(); });
    expect(review?.querySelector('button[data-action="complete"]')?.hasAttribute('disabled')).toBe(false);
    await press('button[data-action="complete"]');
    expect(host.textContent).toMatch(/no order was placed or sent/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('resets review acknowledgement when returning to change a measurement', async () => {
    await advanceToMeasurements();
    await press('button[data-action="continue"]');
    await act(async () => { host.querySelector<HTMLInputElement>('input[name="review-confirmed"]')?.click(); });
    await press('button[data-action="edit-measurements"]');
    await enter('input[name="chest"]', '101');
    await press('button[data-action="continue"]');
    expect(host.querySelector<HTMLInputElement>('input[name="review-confirmed"]')?.checked).toBe(false);
    expect(host.querySelector('button[data-action="complete"]')?.hasAttribute('disabled')).toBe(true);
  });
});


describe('wizard visual guidance and local references', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn((file: File) => `blob:preview/${encodeURIComponent(file.name)}`) });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });
  async function chooseFiles(files: File[]) {
    const input = host.querySelector<HTMLInputElement>('input[type="file"][accept*="image/jpeg"]');
    expect(input, 'A labelled local image picker should exist in the style or measurement step').not.toBeNull();
    Object.defineProperty(input, 'files', { configurable: true, value: files });
    await act(async () => { input?.dispatchEvent(new Event('change', { bubbles: true })); });
  }

  it('shows a native four-step progress meter and announces steps remaining as choices advance', async () => {
    const meter = host.querySelector<HTMLProgressElement>('progress[aria-label="Custom order completion"]');
    expect(meter).not.toBeNull();
    expect(meter?.max).toBe(4);
    expect(meter?.value).toBe(1);
    expect(host.textContent).toMatch(/3 steps remaining/i);
    await press('button[aria-label="Select Midnight navy"]');
    await press('button[data-action="continue"]');
    expect(host.querySelector<HTMLProgressElement>('progress[aria-label="Custom order completion"]')?.value).toBe(2);
    expect(host.textContent).toMatch(/2 steps remaining/i);
  });

  it('announces a singular remaining step when measurements are current', async () => {
    await advanceToMeasurements();
    expect(host.querySelector('[role="status"]')?.textContent).toContain('1 step remaining');
  });

  it('offers labelled local photo references at style and measurement steps and never submits an order', async () => {
    await press('button[aria-label="Select Midnight navy"]');
    await press('button[data-action="continue"]');
    const input = host.querySelector<HTMLInputElement>('input[type="file"][accept*="image/jpeg"]');
    expect(input?.multiple).toBe(true);
    expect(input?.getAttribute('aria-describedby')).toBeTruthy();
    await chooseFiles([new File(['suit'], 'my-suit.jpg', { type: 'image/jpeg' })]);
    expect(host.querySelector('img[alt*="my-suit.jpg"]')).not.toBeNull();
    expect(host.textContent).toMatch(/my-suit\.jpg/);
    await press('button[aria-label="Select Tailored silhouette"]');
    await press('button[aria-label="Select Notch lapel"]');
    await press('button[data-action="continue"]');
    expect(host.querySelector('img[alt*="my-suit.jpg"]')).not.toBeNull();
    await press('button[data-action="continue"]');
    expect(host.textContent).toMatch(/my-suit\.jpg/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects oversized or non-image files and never creates a preview URL for them', async () => {
    await press('button[aria-label="Select Midnight navy"]');
    await press('button[data-action="continue"]');
    await chooseFiles([new File(['no'], 'notes.svg', { type: 'image/svg+xml' })]);
    expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/jpg|jpeg|png|webp|avif/i);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    await chooseFiles([new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'huge.jpg', { type: 'image/jpeg' })]);
    expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/5 mb/i);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('limits the number of local photos and revokes URLs on removal and restart', async () => {
    await press('button[aria-label="Select Midnight navy"]');
    await press('button[data-action="continue"]');
    await chooseFiles([new File(['a'], 'one.jpg', { type: 'image/jpeg' }), new File(['b'], 'two.png', { type: 'image/png' })]);
    expect(host.querySelectorAll('.co-reference-card')).toHaveLength(2);
    await chooseFiles([new File(['c'], 'three.webp', { type: 'image/webp' }), new File(['d'], 'four.avif', { type: 'image/avif' })]);
    expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/up to 3/i);
    expect(host.querySelectorAll('.co-reference-card')).toHaveLength(2);
    await press('button[aria-label="Remove reference photo one.jpg"]');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview/one.jpg');
    await press('button[aria-label="Select Tailored silhouette"]');
    await press('button[aria-label="Select Notch lapel"]');
    await press('button[data-action="continue"]');
    await press('button[data-action="continue"]');
    await act(async () => { host.querySelector<HTMLInputElement>('input[name="review-confirmed"]')?.click(); });
    await press('button[data-action="complete"]');
    await press('button[data-action="restart"]');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview/two.png');
    expect(host.textContent).toMatch(/This is a design exploration/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('offers a non-destructive local crop/rotate editor and shows edited photos in the final review', async () => {
    await press('button[aria-label="Select Midnight navy"]');
    await press('button[data-action="continue"]');
    await chooseFiles([new File(['image'], 'fabric.jpg', { type: 'image/jpeg' })]);
    const original = host.querySelector<HTMLImageElement>('.co-reference-card img')?.src;
    await press('button[aria-label="Edit reference photo fabric.jpg"]');
    expect(host.querySelector('canvas[aria-label="Crop preview"]')).not.toBeNull();
    expect(host.querySelector('button[aria-label="Rotate clockwise"]')).not.toBeNull();
    expect(host.querySelector('select[aria-label="Crop shape"]')).not.toBeNull();
    expect(host.querySelector('input[type="range"][aria-label="Zoom"]')).not.toBeNull();
    expect(host.querySelector('button[data-action="apply-crop"]')).not.toBeNull();
    await press('button[data-action="cancel-crop"]');
    expect(host.querySelector<HTMLImageElement>('.co-reference-card img')?.src).toBe(original);
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(original);
    await press('button[aria-label="Select Tailored silhouette"]');
    await press('button[aria-label="Select Notch lapel"]');
    await press('button[data-action="continue"]');
    await press('button[data-action="continue"]');
    expect(host.querySelector('button[data-action="edit-references"]')).not.toBeNull();
    expect(host.querySelector('.co-review-images img')?.getAttribute('src')).toBe(original);
  });

  it('applies a canvas edit locally, preserves the source for re-edit, and revokes both URLs on removal', async () => {
    vi.stubGlobal('Image', class {
      naturalWidth = 1200;
      naturalHeight = 800;
      onload: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      set src(_url: string) { setTimeout(() => this.onload?.(new Event('load')), 0); }
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
    vi.stubGlobal('cancelAnimationFrame', (timer: number) => clearTimeout(timer));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => { callback(new Blob(['cropped'], { type: 'image/webp' })); });
    await press('button[aria-label="Select Midnight navy"]');
    await press('button[data-action="continue"]');
    await chooseFiles([new File(['a'], 'fabric.jpg', { type: 'image/jpeg' })]);
    const original = host.querySelector<HTMLImageElement>('.co-reference-card img')?.src;
    await press('button[aria-label="Edit reference photo fabric.jpg"]');
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 25)); });
    await press('button[aria-label="Rotate clockwise"]');
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 15)); });
    await press('button[data-action="apply-crop"]');
    await act(async () => { await Promise.resolve(); });
    const edited = host.querySelector<HTMLImageElement>('.co-reference-card img')?.src;
    expect(edited).not.toBe(original);
    expect(host.querySelector('.co-photo-editor')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(original);
    await press('button[aria-label="Edit reference photo fabric.jpg"]');
    expect(host.querySelector('.co-photo-editor')?.textContent).toMatch(/original stays available/i);
    await press('button[data-action="cancel-crop"]');
    await press('button[aria-label="Remove reference photo fabric.jpg"]');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(original);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(edited);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('explains how to take each measurement with keyboard-operable expanded guides', async () => {
    await advanceToMeasurements();
    const guides = host.querySelectorAll<HTMLDetailsElement>('.co-measure-help');
    expect(guides).toHaveLength(6);
    const chestGuide = host.querySelector<HTMLDetailsElement>('#measure-guide-chest');
    expect(chestGuide?.querySelector('summary')?.textContent).toMatch(/how to measure chest/i);
    expect(chestGuide?.textContent).toMatch(/tape/i);
    expect(host.querySelector('input[name="chest"]')?.getAttribute('aria-describedby')).toContain('measure-guide-chest');
  });
});


describe('opt-in saved draft and review help', () => {
  async function remount() {
    await act(async () => { root.unmount(); });
    root = createRoot(host);
    await act(async () => { root.render(<CustomOrderPage />); });
  }

  it('saves choices and measurements only on explicit action, then offers manual restore after reload', async () => {
    await advanceToMeasurements();
    await enter('input[name="chest"]', '101.5');
    expect(Object.values(localStorage).join(' ')).not.toContain('101.5');
    await press('button[data-action="save-draft"]');
    expect(host.querySelector('[role="status"]')?.textContent).toMatch(/saved|device/i);
    expect(Object.values(localStorage).join(' ')).toContain('101.5');
    await remount();
    expect(host.querySelector('button[data-action="restore-draft"]')).not.toBeNull();
    expect(host.querySelector('button[data-action="discard-draft"]')).not.toBeNull();
    expect(host.querySelector('input[name="chest"]')).toBeNull();
    await press('button[data-action="restore-draft"]');
    expect(host.querySelector<HTMLInputElement>('input[name="chest"]')?.value).toBe('101.5');
    expect(host.querySelector('.co-summary-content')?.textContent).toMatch(/midnight navy/i);
    expect(host.textContent).toMatch(/photos (?:were|are) not saved/i);
  });

  it('never persists photo bytes and discarding the saved draft leaves unsaved in-page changes intact', async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:private-image') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    await press('button[aria-label="Select Midnight navy"]');
    await press('button[data-action="continue"]');
    const input = host.querySelector<HTMLInputElement>('input[type="file"]');
    Object.defineProperty(input, 'files', { configurable: true, value: [new File(['secret'], 'private.jpg', { type: 'image/jpeg' })] });
    await act(async () => { input?.dispatchEvent(new Event('change', { bubbles: true })); });
    await press('button[data-action="save-draft"]');
    expect(Object.values(localStorage).join(' ')).not.toMatch(/private\.jpg|blob:private-image|secret/);
    await remount();
    await press('button[aria-label="Select Graphite"]');
    await press('button[data-action="discard-draft"]');
    expect(host.querySelector('button[data-fabric-id="graphite"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('button[data-action="restore-draft"]')).toBeNull();
    expect(Object.values(localStorage).join(' ')).not.toContain('midnight');
  });

  it('reports unavailable storage without claiming success, and clears the draft after preview confirmation', async () => {
    await advanceToMeasurements();
    await enter('input[name="chest"]', '102');
    const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage blocked'); });
    await press('button[data-action="save-draft"]');
    expect(host.textContent).toMatch(/could not save|storage unavailable/i);
    blocked.mockRestore();
    await press('button[data-action="save-draft"]');
    expect(Object.values(localStorage).join(' ')).toContain('102');
    await press('button[data-action="continue"]');
    await act(async () => { host.querySelector<HTMLInputElement>('input[name="review-confirmed"]')?.click(); });
    await press('button[data-action="complete"]');
    expect(Object.values(localStorage).join(' ')).not.toContain('102');
    expect(host.textContent).toMatch(/no order was placed or sent/i);
  });

  it('returns to an invalid measurement before saving when that field is on a different step', async () => {
    await advanceToMeasurements();
    await enter('input[name="chest"]', '0');
    await press('button[data-action="back"]');
    await press('button[data-action="save-draft"]');
    expect(host.querySelector<HTMLInputElement>('input[name="chest"]')?.value).toBe('0');
    expect(host.querySelector('input[name="chest"]')?.getAttribute('aria-invalid')).toBe('true');
    expect(Object.values(localStorage).join(' ')).not.toContain('"chest":"0"');
  });

  it('places keyboard-operable measurement help next to confirmation, with an honest contact-preview link', async () => {
    await advanceToMeasurements();
    await press('button[data-action="continue"]');
    const help = host.querySelector<HTMLDetailsElement>('details.co-review-help');
    expect(help?.querySelector('summary')?.textContent).toMatch(/need help\?/i);
    const link = help?.querySelector<HTMLAnchorElement>('a[href*="/contact?"]');
    expect(new URLSearchParams(link?.getAttribute('href')?.split('?')[1]).get('context')).toMatch(/measurement verification/i);
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(help?.textContent).toMatch(/tailor/i);
    expect(help?.textContent).toMatch(/prepare an enquiry with the measurements you would like checked/i);
    expect(help?.parentElement?.querySelector('button[data-action="complete"]')).not.toBeNull();
    await act(async () => { help?.querySelector('summary')?.click(); });
    expect(help?.open).toBe(true);
    expect(host.querySelector('button[data-action="complete"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('reserves room for the open review help rather than obscuring the confirmation checkbox', () => {
    const clientRoot = existsSync(resolve(process.cwd(), 'src/App.tsx')) ? process.cwd() : resolve(process.cwd(), 'client');
    const css = readFileSync(resolve(clientRoot, 'src/pages/custom-order.css'), 'utf8');
    expect(css).toMatch(/\.co-help-card\s*\{[^}]*top:\s*calc\(100% \+ 12px\)/);
    expect(css).toMatch(/\.co-controls:has\(\.co-review-help\[open\]\)/);
  });
});
