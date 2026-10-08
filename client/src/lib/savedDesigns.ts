/** Saved designs are reopened by id only; the server decides whether that id belongs to the signed-in customer. */
export function designIdFromLocation(search = typeof window === 'undefined' ? '' : window.location.search): number | null {
  const value = new URLSearchParams(search).get('design');
  if (!value || !/^\d{1,10}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

export function savedDesignHref(design: { id: number; kind: 'studio' | 'bespoke' }) {
  return `${design.kind === 'bespoke' ? '/custom-order' : '/studio'}?design=${design.id}`;
}

export const savedDesignSource = (kind: 'studio' | 'bespoke') => (kind === 'bespoke' ? 'Bespoke Studio' : 'Design Studio');
