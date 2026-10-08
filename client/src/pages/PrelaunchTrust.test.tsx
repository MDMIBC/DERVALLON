import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..', '..');
const pages = readFileSync(resolve(root, 'client/src/pages/DrevallonPages.tsx'), 'utf8');
const content = readFileSync(resolve(root, 'client/src/content/siteContent.ts'), 'utf8');

describe('pre-launch trust and enquiry copy', () => {
  it('removes internal development language from public pages', () => {
    for (const phrase of [
      'Concept study',
      'future conversation',
      'Coming later',
      'begins accepting orders',
      'as the collection develops',
      'Our customer information pages are being prepared',
    ]) {
      expect(`${pages}\n${content}`).not.toContain(phrase);
    }
  });

  it('keeps future account records honest and empty until real data exists', () => {
    expect(pages).toContain('Order history');
    expect(pages).toContain('No orders yet.');
    expect(pages).toContain('Confirmed orders will appear here once a real checkout is available.');
    expect(pages).not.toContain('fake orders');
  });

  it('makes the local-only enquiry boundary explicit without claiming delivery', () => {
    expect(pages).toContain('No message has been sent');
    expect(pages).toContain('Nothing has been shared externally');
    expect(pages).not.toContain('A direct contact channel will be added when available');
  });

  it('keeps Information concise and non-duplicated', () => {
    expect(pages.match(/className="info-intro"/g)?.length).toBe(1);
    expect(pages).toContain('Product-specific information appears on each garment page');
  });
});
