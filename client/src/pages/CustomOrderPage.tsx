import React, { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleHelp, ImagePlus, Ruler, ShieldCheck, X } from 'lucide-react';
import { Breadcrumbs, PageShell, ResponsiveImage } from '@/components/DrevallonShell';
import { conceptPhotos } from '@/content/campaignMedia';
import { stellaCollections, stellaFabrics, type StellaCollection } from '@/content/stellaFabrics';
import ReferencePhotoEditor from '@/components/ReferencePhotoEditor';
import { clearOrderDraft, loadOrderDraft, saveOrderDraft, type StoredOrderDraft } from '@/lib/orderDraft';
import {
  canAdvanceOrderPreview,
  defaultOrderPreview,
  fabricStudies,
  isFabricSelectable,
  lapels,
  measurementFields,
  orderSteps,
  silhouettes,
  validateMeasurements,
  type MeasurementKey,
  type OrderPreview,
} from '@/lib/orderPreview';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { MEASUREMENT_SOURCE_LABELS } from '@shared/fitMeasurements';
import { confirmedDate, enteredLabel, storedEntries } from '@/lib/fitDisplay';
import { designIdFromLocation } from '@/lib/savedDesigns';
import './custom-order.css';

type ReferenceImage = { id: number; name: string; originalUrl: string; url: string };
const MAX_REFERENCES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

function browserDraftStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

function MeasurementDiagram({ line, label }: { line: [number, number, number, number]; label: string }) {
  return <svg className="co-measure-diagram" viewBox="0 0 110 192" role="img" aria-label={`${label} measurement position on a simplified body diagram`}>
    <circle cx="55" cy="22" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M44 39 L30 47 L23 96 M66 39 L80 47 L87 96 M43 39 Q55 46 67 39 L74 106 Q55 115 36 106 Z M36 106 L43 180 M74 106 L67 180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} className="co-measure-highlight" strokeWidth="4" strokeLinecap="round" />
    <circle cx={line[0]} cy={line[1]} r="3" className="co-measure-highlight-dot" />
    <circle cx={line[2]} cy={line[3]} r="3" className="co-measure-highlight-dot" />
  </svg>;
}

export default function CustomOrderPage() {
  const [draft, setDraft] = useState<OrderPreview>(defaultOrderPreview);
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [complete, setComplete] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [referenceError, setReferenceError] = useState('');
  const [editingReferenceId, setEditingReferenceId] = useState<number | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const auth = useAuth();
  const fitQuery = trpc.account.fitProfile.get.useQuery(undefined, { enabled: auth.isAuthenticated, retry: false });
  const savedFit = auth.isAuthenticated ? fitQuery.data?.current ?? null : null;
  const [fitMode, setFitMode] = useState<'manual' | 'saved'>('manual');
  const [fitStillCurrent, setFitStillCurrent] = useState(false);
  const [fitConfirmError, setFitConfirmError] = useState(false);
  // Saved designs belong to the signed-in account; the server decides ownership. Saving never places an order.
  const [designId, setDesignId] = useState<number | null>(() => designIdFromLocation());
  const [designSave, setDesignSave] = useState<'' | 'saved' | 'error'>('');
  const savedDesignQuery = trpc.account.designs.get.useQuery({ id: designId ?? 0 }, { enabled: auth.isAuthenticated && designId !== null, retry: false });
  const saveDesignMutation = trpc.account.designs.save.useMutation();
  const restoredDesign = useRef<number | null>(null);
  const [designUnavailable, setDesignUnavailable] = useState(false);
  const [savedDraft, setSavedDraft] = useState<StoredOrderDraft | null>(() => {
    const storage = browserDraftStorage();
    return storage ? loadOrderDraft(storage) : null;
  });
  const [draftNotice, setDraftNotice] = useState('');
  const [fabricFilters, setFabricFilters] = useState({ colour: 'All', pattern: 'All', season: 'All', formality: 'All' });
  const [fabricRefCollection, setFabricRefCollection] = useState<StellaCollection>(stellaCollections[0]);
  const [fabricRefVisible, setFabricRefVisible] = useState(12);
  const referenceImagesRef = useRef<ReferenceImage[]>([]);
  const referenceSequence = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(0);
  const step = orderSteps[stepIndex];
  const errors = showErrors ? validateMeasurements(draft.measurements) : {};
  const chosenReference = stellaFabrics.find(({ id }) => id === draft.fabricId);
  const chosenFabric = fabricStudies.find(({ id }) => id === draft.fabricId)
    ?? (chosenReference ? { name: `${chosenReference.collection} · ${chosenReference.reference}` } : undefined);
  const chosenSilhouette = silhouettes.find(({ id }) => id === draft.silhouette);
  const chosenLapel = lapels.find(({ id }) => id === draft.lapel);
  const filteredFabrics = useMemo(() => fabricStudies.filter((fabric) =>
    isFabricSelectable(fabric)
    && (fabricFilters.colour === 'All' || fabric.colour === fabricFilters.colour)
    && (fabricFilters.pattern === 'All' || fabric.pattern === fabricFilters.pattern)
    && (fabricFilters.season === 'All' || fabric.season === fabricFilters.season)
    && (fabricFilters.formality === 'All' || fabric.formality === fabricFilters.formality)
  ), [fabricFilters]);
  const collectionFabrics = useMemo(() => stellaFabrics.filter((fabric) => fabric.collection === fabricRefCollection), [fabricRefCollection]);
  const enteredMeasurements = measurementFields.filter(({ key }) => draft.measurements[key].trim());
  const stepsRemaining = complete ? 0 : orderSteps.length - stepIndex - 1;
  const editingReference = referenceImages.find(({ id }) => id === editingReferenceId);
  const usingSavedFit = fitMode === 'saved' && savedFit !== null;
  const measurementsReady = usingSavedFit ? fitStillCurrent : canAdvanceOrderPreview('measurements', draft);
  const reviewIsValid = canAdvanceOrderPreview('fabric', draft) && canAdvanceOrderPreview('style', draft) && measurementsReady;
  // A newer saved version must be confirmed again; old measurements are never used unknowingly.
  useEffect(() => { setFitStillCurrent(false); setFitConfirmError(false); setReviewConfirmed(false); }, [savedFit?.version]);
  // A link to a design that is not on this account (removed, or another customer's) is never reused for saving.
  useEffect(() => { if (savedDesignQuery.isError) { setDesignId(null); setDesignUnavailable(true); } }, [savedDesignQuery.isError]);
  useEffect(() => {
    const design = savedDesignQuery.data;
    if (!design || design.payload.kind !== 'bespoke' || restoredDesign.current === design.id) return;
    restoredDesign.current = design.id;
    const payload = design.payload;
    setDraft({ fabricId: payload.fabricId, silhouette: payload.silhouette, lapel: payload.lapel, measurements: { ...defaultOrderPreview.measurements, ...(payload.measurements ?? {}) } });
    // A saved-fit design reselects the saved profile, which must be confirmed as still current again.
    chooseFitMode(payload.measurementMode === 'fit_profile' ? 'saved' : 'manual');
    setShowErrors(false);
    setComplete(false);
    setStepIndex(0);
    setFurthestStep(orderSteps.length - 1);
    setDraftNotice('Saved design opened from My DERVALLON. Photos are never saved; add references again if you wish.');
  }, [savedDesignQuery.data]);
  function chooseFitMode(mode: 'manual' | 'saved') {
    setFitMode(mode);
    setFitStillCurrent(false);
    setFitConfirmError(false);
    setReviewConfirmed(false);
  }

  function revokeReference(image: ReferenceImage) {
    URL.revokeObjectURL(image.url);
    if (image.originalUrl !== image.url) URL.revokeObjectURL(image.originalUrl);
  }

  useEffect(() => {
    if (stepIndex !== previousStep.current || complete) headingRef.current?.focus();
    previousStep.current = stepIndex;
  }, [stepIndex, complete]);

  // Object URLs keep file bytes in this tab only. Release them on restart and unmount.
  useEffect(() => () => {
    referenceImagesRef.current.forEach(revokeReference);
    referenceImagesRef.current = [];
  }, []);

  function chooseReferences(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length) return;
    if (referenceImagesRef.current.length + files.length > MAX_REFERENCES) {
      setReferenceError('Add up to 3 reference photos. Remove one before adding another.');
      return;
    }
    for (const file of files) {
      if (!allowedImageTypes.has(file.type)) {
        setReferenceError('Choose JPG, JPEG, PNG, WebP or AVIF images only.');
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setReferenceError('Each image must be 5 MB or smaller.');
        return;
      }
    }
    const next = [...referenceImagesRef.current, ...files.map((file) => { const url = URL.createObjectURL(file); return { id: ++referenceSequence.current, name: file.name, originalUrl: url, url }; })];
    referenceImagesRef.current = next;
    setReferenceImages(next);
    setReferenceError('');
    setReviewConfirmed(false);
  }

  function removeReference(id: number) {
    const removed = referenceImagesRef.current.find((image) => image.id === id);
    if (removed) revokeReference(removed);
    const next = referenceImagesRef.current.filter((image) => image.id !== id);
    referenceImagesRef.current = next;
    setReferenceImages(next);
    setReferenceError('');
    setReviewConfirmed(false);
    if (editingReferenceId === id) setEditingReferenceId(null);
  }

  function clearReferences() {
    referenceImagesRef.current.forEach(revokeReference);
    referenceImagesRef.current = [];
    setReferenceImages([]);
    setReferenceError('');
    setEditingReferenceId(null);
    setReviewConfirmed(false);
  }

  function closeReferenceEditor(id: number) {
    setEditingReferenceId(null);
    window.requestAnimationFrame(() => document.getElementById(`co-edit-${id}`)?.focus());
  }

  function applyReferenceEdit(id: number, blob: Blob) {
    const current = referenceImagesRef.current.find((image) => image.id === id);
    if (!current) return;
    const url = URL.createObjectURL(blob);
    if (current.url !== current.originalUrl) URL.revokeObjectURL(current.url);
    const next = referenceImagesRef.current.map((image) => image.id === id ? { ...image, url } : image);
    referenceImagesRef.current = next;
    setReferenceImages(next);
    setReviewConfirmed(false);
    closeReferenceEditor(id);
  }

  function revisitStep(index: number) {
    setReviewConfirmed(false);
    setEditingReferenceId(null);
    setStepIndex(index);
  }

  function continuePreview() {
    if (step.id === 'measurements' && usingSavedFit) {
      if (!fitStillCurrent) {
        setFitConfirmError(true);
        document.getElementById('co-fit-still-current')?.focus();
        return;
      }
      setFitConfirmError(false);
    } else if (step.id === 'measurements') {
      setShowErrors(true);
      const invalid = validateMeasurements(draft.measurements);
      const firstInvalid = measurementFields.find(({ key }) => invalid[key]);
      if (firstInvalid) {
        document.getElementById(`order-${firstInvalid.key}`)?.focus();
        return;
      }
    }
    const stepReady = step.id === 'measurements' ? measurementsReady : canAdvanceOrderPreview(step.id, draft);
    if (!stepReady || stepIndex >= orderSteps.length - 1) return;
    const nextIndex = stepIndex + 1;
    setFurthestStep((value) => Math.max(value, nextIndex));
    setReviewConfirmed(false);
    setStepIndex(nextIndex);
  }

  function saveForLater() {
    const invalid = validateMeasurements(draft.measurements);
    const firstInvalid = measurementFields.find(({ key }) => invalid[key]);
    if (firstInvalid) {
      setShowErrors(true);
      setDraftNotice('Correct the highlighted measurement before saving your draft.');
      if (stepIndex !== 2) {
        setStepIndex(2);
        setFurthestStep((value) => Math.max(value, 2));
      }
      window.setTimeout(() => document.getElementById(`order-${firstInvalid.key}`)?.focus(), 0);
      return;
    }
    const storage = browserDraftStorage();
    if (!storage || !saveOrderDraft(storage, draft, stepIndex)) {
      setDraftNotice('Could not save on this device. Browser storage may be unavailable or full.');
      return;
    }
    setSavedDraft(loadOrderDraft(storage));
    setDraftNotice('Saved on this device for up to seven days. Fabric, style and measurements only; photos are not saved.');
  }

  function restoreSavedDraft() {
    const storage = browserDraftStorage();
    const saved = storage ? loadOrderDraft(storage) : null;
    if (!saved) {
      setSavedDraft(null);
      setDraftNotice('The saved draft is unavailable or has expired. Your current choices were not changed.');
      return;
    }
    clearReferences();
    chooseFitMode('manual');
    setDraft(saved.draft);
    setShowErrors(false);
    setReviewConfirmed(false);
    setComplete(false);
    setStepIndex(saved.stepIndex);
    setFurthestStep(saved.stepIndex);
    setSavedDraft(saved);
    setDraftNotice('Saved draft restored. Photos were not saved; add references again if you wish.');
  }

  function forgetSavedDraft() {
    const storage = browserDraftStorage();
    if (storage && clearOrderDraft(storage)) {
      setSavedDraft(null);
      setDraftNotice('Saved draft removed from this device. Your current page choices remain until you leave.');
    } else {
      setDraftNotice('Could not remove the saved draft. Clear this site’s browser data on a shared device.');
    }
  }

  function completePreview() {
    if (!reviewConfirmed || !reviewIsValid) return;
    if (!auth.isAuthenticated) { finishDesign(''); return; }
    const design = usingSavedFit
      ? { kind: 'bespoke' as const, fabricId: draft.fabricId, silhouette: draft.silhouette, lapel: draft.lapel, measurementMode: 'fit_profile' as const, fitVersion: savedFit.version }
      : { kind: 'bespoke' as const, fabricId: draft.fabricId, silhouette: draft.silhouette, lapel: draft.lapel, measurementMode: 'manual' as const, measurements: { ...draft.measurements } };
    setDesignSave('');
    saveDesignMutation.mutate((designId === null ? { design } : { id: designId, design }) as Parameters<typeof saveDesignMutation.mutate>[0], {
      onSuccess: (saved) => { setDesignId(saved.id); finishDesign('saved'); },
      onError: () => setDesignSave('error'),
    });
  }
  function finishDesign(result: '' | 'saved') {
    setDesignSave(result);
    const storage = browserDraftStorage();
    if (savedDraft && (!storage || !clearOrderDraft(storage))) {
      setDraftNotice('Could not remove the saved draft. Clear this site’s browser data on a shared device.');
    } else {
      setSavedDraft(null);
      setDraftNotice('');
    }
    setComplete(true);
  }

  function restartPreview() {
    if (savedDraft) {
      const storage = browserDraftStorage();
      if (storage && clearOrderDraft(storage)) setSavedDraft(null);
      else setDraftNotice('Could not remove the saved draft. Clear this site’s browser data on a shared device.');
    } else setDraftNotice('');
    clearReferences();
    chooseFitMode('manual');
    setDraft({ ...defaultOrderPreview, measurements: { ...defaultOrderPreview.measurements } });
    setShowErrors(false);
    setFurthestStep(0);
    setStepIndex(0);
    setComplete(false);
    setReviewConfirmed(false);
    setDesignId(null);
    setDesignSave('');
  }

  function updateMeasurement(key: MeasurementKey, value: string) {
    setDraft((current) => ({ ...current, measurements: { ...current.measurements, [key]: value } }));
    setReviewConfirmed(false);
  }

  const referencePicker = <section className="co-references" aria-labelledby="co-references-title">
    <div className="co-references-heading"><div><span className="co-reference-eyebrow">OPTIONAL / VISUAL NOTES</span><h3 id="co-references-title">Your references</h3></div><ImagePlus size={21} aria-hidden="true" /></div>
    <p id="co-reference-help">Add up to 3 suit or fabric images (JPG, PNG, WebP, AVIF; 5 MB each). Previewed only in this browser tab, not uploaded or saved.</p>
    <label className="co-upload-control" htmlFor="order-reference-input"><ImagePlus size={18} aria-hidden="true" /><span>Add reference photos</span><span className="co-upload-hint">{referenceImages.length}/{MAX_REFERENCES}</span></label>
    <input id="order-reference-input" className="co-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple aria-describedby="co-reference-help" onChange={chooseReferences} />
    {referenceError && <p className="co-reference-error" role="alert">{referenceError}</p>}
    {editingReference && <ReferencePhotoEditor key={editingReference.id} name={editingReference.name} sourceUrl={editingReference.originalUrl} onApply={(blob) => applyReferenceEdit(editingReference.id, blob)} onCancel={() => closeReferenceEditor(editingReference.id)} />}
    {referenceImages.length > 0 && <div className="co-reference-grid" aria-label="Your selected reference photos">
      {referenceImages.map((image) => <div key={image.id} className="co-reference-card"><img src={image.url} alt={`Reference photo ${image.name}${image.url !== image.originalUrl ? ', edited crop' : ''}`} /><div><span title={image.name}>{image.name}</span><button id={`co-edit-${image.id}`} type="button" aria-label={`Edit reference photo ${image.name}`} onClick={() => { setEditingReferenceId(image.id); setReferenceError(''); }}>Edit</button><button type="button" aria-label={`Remove reference photo ${image.name}`} onClick={() => removeReference(image.id)}><X size={16} aria-hidden="true" /></button></div></div>)}
    </div>}
  </section>;

  return <PageShell>
    <div className="custom-order">
      <div className="container custom-order-intro">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Design Studio', href: '/studio' }, { label: 'Bespoke Studio' }]} />
        <div className="co-intro-grid">
          <div><span className="co-kicker">DERVALLON / PERSONAL DESIGN DIRECTION</span><h1>A suit with<br /><em>your point of view.</em></h1></div>
          <div className="co-intro-aside"><span className="co-intro-number">01 — 04</span><p>Explore an idea from fabric to fit. Make each decision in your own time, then see the choices together.</p><p className="co-disclosure"><ShieldCheck size={16} aria-hidden="true" /> This is a design exploration. Choices stay on this device only if you select Save for Later; reference photos are never saved.</p></div>
        </div>
      </div>

      <div className="container co-page-body">
        <div className="co-progress-overview"><span>YOUR DESIGN JOURNEY</span><strong>{complete ? 'Design complete' : `Step ${stepIndex + 1} of ${orderSteps.length} · ${stepsRemaining} ${stepsRemaining === 1 ? 'step' : 'steps'} remaining`}</strong></div>
        <progress className="co-progress-meter" aria-label="Custom order completion" value={complete ? orderSteps.length : stepIndex + 1} max={orderSteps.length}>{stepIndex + 1} of {orderSteps.length}</progress>
        <nav className="co-progress" aria-label="Custom order progress">
          {orderSteps.map((item, index) => <button
            key={item.id} type="button" className={`co-progress-step ${index === stepIndex ? 'is-current' : ''} ${index < stepIndex ? 'is-visited' : ''}`}
            aria-current={index === stepIndex ? 'step' : undefined}
            aria-label={`Step ${index + 1} of ${orderSteps.length}: ${item.label}${index > furthestStep ? ', not yet available' : ''}`}
            onClick={() => { if (index <= furthestStep && !complete) revisitStep(index); }} disabled={index > furthestStep || complete}
          ><span className="co-progress-index">{index < furthestStep ? <Check size={14} aria-hidden="true" /> : String(index + 1).padStart(2, '0')}</span><span className="co-progress-text"><strong>{item.label}</strong><small>{item.subtitle}</small></span><span className="co-progress-bar" aria-hidden="true" /></button>)}
        </nav>

        {!complete && <div className="co-draft-tools">
          <p>On a shared device? Browser drafts are not encrypted and may be seen by others. Nothing is saved automatically; photos are never included.</p>
          <button type="button" data-action="save-draft" onClick={saveForLater}>Save for Later <ArrowRight size={16} aria-hidden="true" /></button>
        </div>}
        {savedDraft && !complete && <div className="co-draft-banner">
          <div><strong>Saved on this browser</strong><p>Available until {new Date(savedDraft.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}. Fabric, style and measurements only. Photos are not saved.</p></div>
          <div className="co-draft-actions"><button type="button" data-action="restore-draft" onClick={restoreSavedDraft}>Restore saved draft</button><button type="button" data-action="discard-draft" onClick={forgetSavedDraft}>Forget saved draft</button></div>
        </div>}
        {designUnavailable && <p className="co-draft-status" data-saved-design-unavailable role="status">This saved design is not available on your account. Your choices here will be saved as a new design.</p>}
        {draftNotice && <p className="co-draft-status" role="status">{draftNotice}</p>}

        <div className="co-workspace">
          <form className="co-panel" aria-labelledby="co-stage-title" onSubmit={(event) => event.preventDefault()}>
            <div className="co-panel-header"><span className="co-step-count">{complete ? 'DIRECTION COMPLETE' : `STEP ${String(stepIndex + 1).padStart(2, '0')} / ${String(orderSteps.length).padStart(2, '0')}`}</span><span className="co-panel-marker" aria-hidden="true">✦</span></div>
            <p className="sr-only" role="status">{complete ? 'Design complete. No order was placed or sent.' : `Step ${stepIndex + 1} of ${orderSteps.length}: ${step.label}. ${stepsRemaining} ${stepsRemaining === 1 ? 'step' : 'steps'} remaining.`}</p>
            {complete ? <div className="co-complete">
              <div className="co-complete-symbol" aria-hidden="true"><Check size={28} /></div>
              <h2 id="co-stage-title" ref={headingRef} tabIndex={-1}>A considered<br /><em>starting point.</em></h2>
              {designSave === 'saved' ? <p>Your design is saved to My DERVALLON. <strong>No order was placed or sent.</strong> Photos were not saved, and any available saved draft was removed from this device.</p> : <p>You have completed this design journey. It was not saved to an account. <strong>No order was placed or sent.</strong> Photos were not saved, and any available saved draft was removed. Measurements on this page clear when you leave.</p>}
              <button type="button" data-action="restart" className="co-primary-action" onClick={restartPreview}>Start again <ArrowRight size={17} aria-hidden="true" /></button>
              {designSave === 'saved' && <Link className="co-text-link" href="/account">View in My DERVALLON <ChevronRight size={15} aria-hidden="true" /></Link>}<Link className="co-text-link" href="/studio">Return to Design Studio <ChevronRight size={15} aria-hidden="true" /></Link>
            </div> : <>
              {step.id === 'fabric' && <>
                <h2 id="co-stage-title" ref={headingRef} tabIndex={-1}>Choose your<br /><em>fabric direction.</em></h2>
                <p className="co-step-lede">Begin with a feeling, not a specification. These swatches help set the mood for your design direction.</p>
                <div className="co-fabric-library-head"><div><span className="co-reference-eyebrow">FABRIC DIRECTION</span><p className="co-fabric-disclosure">Availability and lead times will be shared when the collection is ready.</p></div><button type="button" data-action="reset-fabric-filters" className="co-filter-reset" onClick={() => setFabricFilters({ colour: 'All', pattern: 'All', season: 'All', formality: 'All' })}>Reset filters</button></div>
                <div className="co-fabric-filters" aria-label="Filter fabric studies">
                  {(['colour', 'pattern', 'season', 'formality'] as const).map((filter) => {
                    const values = Array.from(new Set(fabricStudies.map((fabric) => fabric[filter])));
                    return <label key={filter}>{filter}<select data-fabric-filter={filter} value={fabricFilters[filter]} onChange={(event) => setFabricFilters((current) => ({ ...current, [filter]: event.target.value }))}><option>All</option>{values.map((value) => <option key={value}>{value}</option>)}</select></label>;
                  })}
                </div>
                {filteredFabrics.length ? <div className="co-fabric-grid" role="group" aria-label="Fabric studies">
                  {filteredFabrics.map((fabric, index) => <button key={fabric.id} type="button" data-fabric-id={fabric.id} aria-label={`Select ${fabric.name}`} aria-pressed={draft.fabricId === fabric.id} className={`co-fabric-card ${draft.fabricId === fabric.id ? 'is-selected' : ''}`} onClick={() => setDraft((current) => ({ ...current, fabricId: fabric.id }))}>
                    <span className={`co-fabric-swatch co-fabric-${fabric.tone}`} aria-hidden="true"><span className="co-fabric-index">0{index + 1}</span></span>
                    <span className="co-fabric-meta"><span><strong>{fabric.name}</strong><small>{fabric.pattern} · {fabric.colour.toLowerCase()}</small></span><span className="co-choice-mark" aria-hidden="true">{draft.fabricId === fabric.id ? <Check size={16} /> : <span />}</span></span>
                    <span className="co-fabric-caption">{fabric.caption}</span><span className="co-fabric-status">{fabric.availability}</span>
                  </button>)}
                </div> : <div className="co-fabric-empty"><strong>No reference fabrics match those filters.</strong><button type="button" data-action="reset-fabric-filters" onClick={() => setFabricFilters({ colour: 'All', pattern: 'All', season: 'All', formality: 'All' })}>Show all fabrics</button></div>}
                <section className="co-fabric-ref-browser" aria-labelledby="co-fabric-ref-title">
                  <span className="co-reference-eyebrow">ORIGINAL FABRIC REFERENCES</span>
                  <h3 id="co-fabric-ref-title">Explore the collections.</h3>
                  <p>Browse the original numbered fabric swatches from the DERVALLON collections. Some references share the same photography. Images and codes do not confirm composition, availability, or price. Please verify fabric details before making a garment.</p>
                  <label className="co-fabric-ref-label" htmlFor="co-fabric-ref-collection">Collection
                    <select id="co-fabric-ref-collection" data-fabric-ref-collection value={fabricRefCollection} onChange={(event) => { setFabricRefCollection(event.target.value as StellaCollection); setFabricRefVisible(12); }}>
                      {stellaCollections.map((collection) => <option key={collection} value={collection}>{collection}</option>)}
                    </select>
                  </label>
                  <p className="co-fabric-ref-count" role="status">{`${collectionFabrics.length} references in ${fabricRefCollection}`}</p>
                  <div className="co-fabric-ref-grid" role="group" aria-label={`${fabricRefCollection} original swatches`}>
                    {collectionFabrics.slice(0, fabricRefVisible).map((fabric) => <button key={fabric.id} type="button" data-fabric-ref-id={fabric.id} aria-label={`Select ${fabric.collection} reference ${fabric.reference}`} aria-pressed={draft.fabricId === fabric.id} className={`co-fabric-ref-card ${draft.fabricId === fabric.id ? 'is-selected' : ''}`} onClick={() => setDraft((current) => ({ ...current, fabricId: fabric.id }))}>
                      <img src={fabric.imageUrl} loading="lazy" alt={`Original swatch for ${fabric.collection} reference ${fabric.reference}`} />
                      <span><strong>{fabric.reference}</strong><small>{fabric.collection}</small></span>
                    </button>)}
                  </div>
                  {fabricRefVisible < collectionFabrics.length && <button type="button" data-action="fabric-ref-more" className="co-fabric-ref-more" onClick={() => setFabricRefVisible((count) => count + 12)}>Show more references <ArrowRight size={15} aria-hidden="true" /></button>}
                </section>
              </>}

              {step.id === 'style' && <>
                <h2 id="co-stage-title" ref={headingRef} tabIndex={-1}>Define your<br /><em>silhouette.</em></h2>
                <p className="co-step-lede">Two details shape the character of the suit. Use these directions to set the character of your suit.</p>
                <fieldset className="co-choice-group"><legend>01 / Silhouette</legend><div className="co-choice-grid co-choice-grid-three">{silhouettes.map((option) => <button key={option.id} type="button" aria-label={`Select ${option.label} silhouette`} aria-pressed={draft.silhouette === option.id} className={`co-choice-card ${draft.silhouette === option.id ? 'is-selected' : ''}`} onClick={() => setDraft((current) => ({ ...current, silhouette: option.id }))}><span className="co-choice-mark" aria-hidden="true">{draft.silhouette === option.id ? <Check size={16} /> : <span />}</span><strong>{option.label}</strong><small>{option.note}</small></button>)}</div></fieldset>
                <fieldset className="co-choice-group"><legend>02 / Lapel</legend><div className="co-choice-grid">{lapels.map((option) => <button key={option.id} type="button" aria-label={`Select ${option.label}`} aria-pressed={draft.lapel === option.id} className={`co-choice-card ${draft.lapel === option.id ? 'is-selected' : ''}`} onClick={() => setDraft((current) => ({ ...current, lapel: option.id }))}><span className="co-choice-mark" aria-hidden="true">{draft.lapel === option.id ? <Check size={16} /> : <span />}</span><strong>{option.label}</strong><small>{option.note}</small></button>)}</div></fieldset>
                {referencePicker}
              </>}

              {step.id === 'measurements' && <>
                <h2 id="co-stage-title" ref={headingRef} tabIndex={-1}>Your proportions,<br /><em>if you wish.</em></h2>
                <p className="co-step-lede">Measurements are optional. Use the diagrams as a starting point, then have a qualified tailor confirm values for a real garment.</p>
                {savedFit ? <section className="co-saved-fit" data-saved-fit aria-labelledby="co-saved-fit-title">
                  <div className="co-saved-fit-head"><span className="co-review-eyebrow" id="co-saved-fit-title">MY DERVALLON FIT</span><span>Version {savedFit.version} · confirmed {confirmedDate(savedFit.confirmedAt)} · {MEASUREMENT_SOURCE_LABELS[savedFit.source]}</span></div>
                  <fieldset className="co-fit-mode"><legend className="sr-only">Measurements for this design</legend>
                    <label className={usingSavedFit ? 'is-selected' : ''}><input type="radio" name="fit-mode" value="saved" checked={usingSavedFit} onChange={() => chooseFitMode('saved')} /><span>Use my saved fit profile</span></label>
                    <label className={!usingSavedFit ? 'is-selected' : ''}><input type="radio" name="fit-mode" value="manual" checked={!usingSavedFit} onChange={() => chooseFitMode('manual')} /><span>Enter measurements for this design</span></label>
                  </fieldset>
                  {usingSavedFit && <>
                    <dl className="co-saved-fit-values">{storedEntries(savedFit.measurements).map(({ definition, measurement }) => <div key={definition.key}><dt>{definition.label}</dt><dd>{enteredLabel(measurement)}</dd></div>)}</dl>
                    <p className="co-saved-fit-note">Shown exactly as you entered them. If anything has changed, <Link href="/account/fit">update My DERVALLON Fit</Link> before continuing.</p>
                    <label className="co-review-confirm co-fit-current" htmlFor="co-fit-still-current"><input id="co-fit-still-current" name="fit-still-current" type="checkbox" checked={fitStillCurrent} onChange={(event) => { setFitStillCurrent(event.target.checked); setFitConfirmError(false); setReviewConfirmed(false); }} aria-describedby={fitConfirmError ? 'co-fit-current-error' : undefined} /><span>These measurements, last confirmed {confirmedDate(savedFit.confirmedAt)}, are still current.</span></label>
                    {fitConfirmError && <p className="co-error-summary" id="co-fit-current-error" role="alert">Please confirm that your saved measurements are still current, or update them in My DERVALLON Fit.</p>}
                  </>}
                </section> : <p className="co-fit-invite">{auth.isAuthenticated ? <>Keep your body measurements in one private place and reuse them for future designs. <Link href="/account/fit">Create your My DERVALLON Fit profile <ArrowRight size={13} aria-hidden="true" /></Link></> : <>Have a saved profile? <Link href="/account/fit">Sign in to use My DERVALLON Fit <ArrowRight size={13} aria-hidden="true" /></Link></>}</p>}
                {!usingSavedFit && <>
                <div className="co-measurement-note"><Ruler size={18} aria-hidden="true" /><span>Values are in centimetres. Entries clear when you leave unless you choose Save for Later; that keeps them on this device for up to seven days.</span></div>
                {Object.keys(errors).length > 0 && <p className="co-error-summary" role="alert">Please correct the highlighted measurements before continuing.</p>}
                <div className="co-measure-grid">{measurementFields.map(({ key, label, help, guide, guideLine }) => <div key={key} className="co-field">
                  <label htmlFor={`order-${key}`}>{label} <span>Optional</span></label>
                  <div className="co-input-wrap"><input id={`order-${key}`} name={key} type="text" inputMode="decimal" autoComplete="off" placeholder="—" value={draft.measurements[key]} onChange={(event) => updateMeasurement(key, event.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={`order-${key}-hint measure-guide-${key}${errors[key] ? ` order-${key}-error` : ''}`} /><span aria-hidden="true">cm</span></div>
                  <small id={`order-${key}-hint`}>{help}</small>
                  <details className="co-measure-help" id={`measure-guide-${key}`}><summary>How to measure {label.toLowerCase()}</summary><div className="co-measure-help-body"><MeasurementDiagram line={guideLine} label={label} /><p>{guide}</p></div></details>
                  {errors[key] && <span className="co-field-error" id={`order-${key}-error`}>{errors[key]}</span>}
                </div>)}</div>
                </>}
                {referencePicker}
              </>}

              {step.id === 'review' && <>
                <h2 id="co-stage-title" ref={headingRef} tabIndex={-1}>Review every<br /><em>detail.</em></h2>
                <p className="co-step-lede">Double-check your fabric, style, measurements and photo references before saving this design. Use Edit to return to any section.</p>
                <div className="co-review-group"><div className="co-review-heading"><span className="co-review-eyebrow">FABRIC DIRECTION</span><button type="button" data-action="edit-fabric" onClick={() => revisitStep(0)}>Edit fabric <ArrowRight size={14} aria-hidden="true" /></button></div><dl><div><dt>Fabric direction</dt><dd>{chosenFabric?.name ?? 'Not selected'}</dd></div></dl></div>
                <div className="co-review-group"><div className="co-review-heading"><span className="co-review-eyebrow">STYLE DETAILS</span><button type="button" data-action="edit-style" onClick={() => revisitStep(1)}>Edit style <ArrowRight size={14} aria-hidden="true" /></button></div><dl><div><dt>Silhouette</dt><dd>{chosenSilhouette?.label ?? 'Not selected'}</dd></div><div><dt>Lapel</dt><dd>{chosenLapel?.label ?? 'Not selected'}</dd></div></dl></div>
                {usingSavedFit && savedFit ? <div className="co-review-group" data-review-fit><div className="co-review-heading"><span className="co-review-eyebrow">MY DERVALLON FIT</span><button type="button" data-action="edit-measurements" onClick={() => revisitStep(2)}>Edit measurements <ArrowRight size={14} aria-hidden="true" /></button></div><dl>{storedEntries(savedFit.measurements).map(({ definition, measurement }) => <div key={definition.key}><dt>{definition.label}</dt><dd>{enteredLabel(measurement)}</dd></div>)}</dl><p>Version {savedFit.version}, confirmed {confirmedDate(savedFit.confirmedAt)} ({MEASUREMENT_SOURCE_LABELS[savedFit.source]}). You confirmed these are still current. A tailor should verify every measurement before production.</p></div> : <div className="co-review-group"><div className="co-review-heading"><span className="co-review-eyebrow">MEASUREMENTS / CM</span><button type="button" data-action="edit-measurements" onClick={() => revisitStep(2)}>Edit measurements <ArrowRight size={14} aria-hidden="true" /></button></div><dl>{measurementFields.map(({ key, label }) => <div key={key} data-review-measurement={key}><dt>{label}</dt><dd>{draft.measurements[key].trim() ? `${draft.measurements[key].trim()} cm` : 'Not supplied'}</dd></div>)}</dl><p>These optional values are a starting point; a tailor should verify every measurement before production.</p></div>}
                <div className="co-review-group"><div className="co-review-heading"><span className="co-review-eyebrow">PHOTO REFERENCES</span><button type="button" data-action="edit-references" onClick={() => revisitStep(1)}>Edit photos <ArrowRight size={14} aria-hidden="true" /></button></div>{referenceImages.length ? <div className="co-review-images">{referenceImages.map((image) => <figure key={image.id}><img src={image.url} alt={`Selected suit or fabric reference: ${image.name}${image.url !== image.originalUrl ? ', edited crop' : ''}`} /><figcaption>{image.name}{image.url !== image.originalUrl ? ' · edited' : ''}</figcaption></figure>)}</div> : <p>No reference photos selected.</p>}</div>
                <p className="co-review-disclaimer"><ShieldCheck size={18} aria-hidden="true" /> This design journey does not place an order, request a quote, or send your details.</p>
                <label className="co-review-confirm" htmlFor="co-review-confirm"><input id="co-review-confirm" name="review-confirmed" type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} /><span>I have checked my selections and understand that saving this design does not place an order or send my details.</span></label>
                {designSave === 'error' && <p className="co-design-save-error" data-design-save-error role="alert">This design could not be saved to your account just now. Nothing was placed or sent; your choices are still here, so please try again.</p>}
              </>}
              <div className="co-controls">
                <button type="button" data-action="back" className="co-back-action" disabled={stepIndex === 0} onClick={() => revisitStep(stepIndex - 1)}><ArrowLeft size={16} aria-hidden="true" /> Back</button>
                {step.id === 'review' ?
                  <div className="co-review-actions"><details className="co-review-help"><summary><CircleHelp size={17} aria-hidden="true" /> Need Help?</summary><div className="co-help-card"><strong>Not sure about a measurement?</strong><p>A qualified tailor should verify every value before making a garment.</p><Link href="/contact?context=Measurement%20verification" target="_blank" rel="noopener noreferrer">Prepare a measurement enquiry <ArrowRight size={14} aria-hidden="true" /></Link><small>Prepare an enquiry with the measurements you would like checked.</small></div></details><button type="button" data-action="complete" className="co-primary-action" disabled={!reviewConfirmed || !reviewIsValid || saveDesignMutation.isPending} onClick={completePreview}>{auth.isAuthenticated ? 'Save design' : 'Complete design'} <Check size={16} aria-hidden="true" /></button></div> :
                  <button type="button" data-action="continue" className="co-primary-action" onClick={continuePreview} disabled={step.id !== 'measurements' && !canAdvanceOrderPreview(step.id, draft)}>
                    {step.id === 'measurements' ? (usingSavedFit || enteredMeasurements.length ? 'Continue to review' : 'Skip measurements') : 'Continue'} <ArrowRight size={16} aria-hidden="true" />
                  </button>}
              </div>
            </>}
          </form>

          <aside className="co-summary" aria-label="Your current design">
            <div className="co-summary-top"><span>THE HOUSE / YOUR DIRECTION</span><span>01</span></div>
            <div className="co-summary-image"><ResponsiveImage src={conceptPhotos.suits.src} alt={conceptPhotos.suits.alt} sizes="(max-width: 980px) 92vw, 380px" loading="lazy" /><span>FIXED STYLING · SELECTIONS DO NOT CHANGE THIS IMAGE</span></div>
            <div className="co-summary-content"><span className="co-summary-overline">LIVE COMPOSITION</span><h2>{chosenFabric?.name ?? 'Your fabric'}<br /><em>direction.</em></h2><dl><div><dt>Fabric</dt><dd>{chosenFabric?.name ?? 'Not chosen'}</dd></div><div><dt>Silhouette</dt><dd>{chosenSilhouette?.label ?? 'Not chosen'}</dd></div><div><dt>Lapel</dt><dd>{chosenLapel?.label ?? 'Not chosen'}</dd></div><div><dt>Measurements</dt><dd>{usingSavedFit && savedFit ? `Fit profile v${savedFit.version}` : enteredMeasurements.length ? `${enteredMeasurements.length} noted` : 'Optional'}</dd></div><div><dt>Photo references</dt><dd>{referenceImages.length ? `${referenceImages.length} local` : 'Optional'}</dd></div></dl><p>Only an explicit Save for Later stores your choices and measurements on this device. Photos are never saved; nothing is submitted.</p></div>
          </aside>
        </div>
        <div className="co-footer-note"><span>01 / EXPLORE</span><p>A thoughtful beginning. Pricing, stock, and fulfillment details will be shared once confirmed.</p><Link href="/studio">Back to Design Studio <ArrowRight size={15} aria-hidden="true" /></Link></div>
      </div>
    </div>
  </PageShell>;
}
