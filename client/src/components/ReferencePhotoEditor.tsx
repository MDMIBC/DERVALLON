import React, { useEffect, useRef, useState } from 'react';
import { Crop, RotateCcw, RotateCw, X } from 'lucide-react';
import { exportEditedReference, renderReferenceCrop, type CropShape, type ReferenceEdit } from '@/lib/referenceEditor';

type Props = { name: string; sourceUrl: string; onApply: (blob: Blob) => void; onCancel: () => void };
const initialEdit: ReferenceEdit = { rotation: 0, shape: 'original', zoom: 1, focusX: 50, focusY: 50 };

export default function ReferencePhotoEditor({ name, sourceUrl, onApply, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [edit, setEdit] = useState<ReferenceEdit>(initialEdit);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      if (image.naturalWidth * image.naturalHeight > 24_000_000) setError('This photo is too large to edit in your browser. Choose a smaller image.');
      else setSourceImage(image);
    };
    image.onerror = () => { if (active) setError('This photo could not be opened. The original remains unchanged.'); };
    image.src = sourceUrl;
    return () => { active = false; image.onload = null; image.onerror = null; };
  }, [sourceUrl]);

  useEffect(() => {
    if (!sourceImage || !canvasRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      try {
        if (canvasRef.current) renderReferenceCrop(sourceImage, canvasRef.current, edit);
        setError('');
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not preview this crop.'); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [sourceImage, edit]);

  function update(patch: Partial<ReferenceEdit>) { setEdit((current) => ({ ...current, ...patch })); }

  async function save() {
    if (!canvasRef.current || !sourceImage || error || saving) return;
    setSaving(true);
    try {
      // Re-render the current controls before exporting in case a queued animation frame was cancelled.
      renderReferenceCrop(sourceImage, canvasRef.current, edit);
      onApply(await exportEditedReference(canvasRef.current));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'This crop could not be saved.'); }
    finally { setSaving(false); }
  }

  return <section className="co-photo-editor" aria-labelledby="co-photo-editor-title" onKeyDown={(event) => { if (event.key === 'Escape' && !saving) onCancel(); }}>
    <div className="co-photo-editor-heading"><div><span className="co-reference-eyebrow">REFERENCE STUDY / LOCAL EDIT</span><h4 id="co-photo-editor-title" tabIndex={-1} ref={headingRef}>Frame the detail</h4></div><button type="button" onClick={onCancel} disabled={saving} aria-label="Close image editor"><X size={18} aria-hidden="true" /></button></div>
    <p>Edit <strong>{name}</strong>. Rotate or crop to highlight a fabric detail. The original stays available; edits are previewed only in this browser tab.</p>
    <div className="co-photo-editor-stage"><canvas ref={canvasRef} role="img" aria-label="Crop preview">Your browser cannot display the crop preview.</canvas>{!sourceImage && !error && <span role="status">Preparing image preview…</span>}</div>
    <div className="co-photo-editor-tools">
      <div className="co-photo-editor-rotations"><button type="button" aria-label="Rotate counterclockwise" onClick={() => update({ rotation: (edit.rotation + 270) % 360 })}><RotateCcw size={17} aria-hidden="true" /> Rotate left</button><button type="button" aria-label="Rotate clockwise" onClick={() => update({ rotation: (edit.rotation + 90) % 360 })}><RotateCw size={17} aria-hidden="true" /> Rotate right</button></div>
      <label htmlFor="co-crop-shape">Crop shape</label><select id="co-crop-shape" aria-label="Crop shape" value={edit.shape} onChange={(event) => update({ shape: event.target.value as CropShape })}><option value="original">Original proportions</option><option value="square">Square</option><option value="portrait">Portrait 4:5</option></select>
      <label htmlFor="co-crop-zoom">Zoom <output>{edit.zoom.toFixed(1)}×</output></label><input id="co-crop-zoom" aria-label="Zoom" type="range" min="1" max="3" step="0.1" value={edit.zoom} onChange={(event) => update({ zoom: Number(event.target.value) })} />
      <div className="co-photo-editor-pan"><div><label htmlFor="co-focus-x">Move left / right</label><input id="co-focus-x" type="range" min="0" max="100" value={edit.focusX} onChange={(event) => update({ focusX: Number(event.target.value) })} /></div><div><label htmlFor="co-focus-y">Move up / down</label><input id="co-focus-y" type="range" min="0" max="100" value={edit.focusY} onChange={(event) => update({ focusY: Number(event.target.value) })} /></div></div>
    </div>
    {error && <p className="co-reference-error" role="alert">{error}</p>}
    <div className="co-photo-editor-actions"><button type="button" data-action="cancel-crop" disabled={saving} onClick={onCancel}>Cancel</button><button type="button" data-action="apply-crop" disabled={!sourceImage || !!error || saving} onClick={save}><Crop size={16} aria-hidden="true" />{saving ? 'Applying…' : 'Apply crop'}</button></div>
  </section>;
}
