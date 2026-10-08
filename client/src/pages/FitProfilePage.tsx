import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Check, Ruler, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { startLogin } from '@/const';
import { trpc } from '@/lib/trpc';
import { Breadcrumbs, PageShell } from '@/components/DrevallonShell';
import {
  BODY_MEASUREMENTS,
  CORE_MEASUREMENT_KEYS,
  FIT_PREFERENCE_CATEGORIES,
  FIT_PREFERENCE_CHOICES,
  MEASUREMENT_GROUPS,
  MEASUREMENT_SOURCE_LABELS,
  assessMeasurements,
  formatLength,
  otherUnit,
  parseMeasurementInput,
  tapeCare,
  toMicrometres,
  type FitPreferenceChoice,
  type MeasurementIssue,
  type MeasurementKey,
  type MeasurementUnit,
  type MeasurementValues,
  type StoredMeasurement,
} from '@shared/fitMeasurements';
import { confirmedDate, enteredLabel, equivalentLabel, storedEntries } from '@/lib/fitDisplay';
import './fit-profile.css';

type Draft = Partial<Record<MeasurementKey, { value: string; unit: MeasurementUnit }>>;
type Preferences = { jacketFit: FitPreferenceChoice | null; trouserFit: FitPreferenceChoice | null; notes: string };
const STEPS = [...MEASUREMENT_GROUPS.map(({ id, label }) => ({ id, label })), { id: 'review', label: 'Review' }] as const;
type StepId = (typeof STEPS)[number]['id'];
const LEGACY_DEVICE_KEY = 'drevallon-fit-preview';

function legacyDeviceValues(): Draft {
  try {
    const raw = window.localStorage.getItem(LEGACY_DEVICE_KEY);
    if (!raw) return {};
    const value = JSON.parse(raw) as Record<string, unknown>;
    const draft: Draft = {};
    const take = (from: string, to: MeasurementKey) => { if (typeof value[from] === 'string' && (value[from] as string).trim()) draft[to] = { value: (value[from] as string).trim(), unit: 'cm' }; };
    take('height', 'height'); take('chest', 'chest'); take('waist', 'naturalWaist');
    return draft;
  } catch { return {}; }
}

function toInput(draft: Draft): MeasurementValues {
  const values: MeasurementValues = {};
  for (const { key } of BODY_MEASUREMENTS) {
    const entry = draft[key];
    if (entry && entry.value.trim()) values[key] = { value: entry.value.trim(), unit: entry.unit };
  }
  return values;
}

function MeasurementField({ definition, entry, unit, error, warning, showError, onValue, onUnit, onBlur }: {
  definition: (typeof BODY_MEASUREMENTS)[number];
  entry?: { value: string; unit: MeasurementUnit };
  unit: MeasurementUnit;
  error?: MeasurementIssue;
  warning?: MeasurementIssue;
  showError: boolean;
  onValue: (value: string) => void;
  onUnit: (unit: MeasurementUnit) => void;
  onBlur: () => void;
}) {
  const { key, label, where, tape, position } = definition;
  const parsed = parseMeasurementInput(entry?.value ?? '');
  const equivalent = parsed.ok ? formatLength(toMicrometres(parsed.hundredths, unit), otherUnit(unit)) : '';
  const optional = !CORE_MEASUREMENT_KEYS.includes(key);
  const visibleError = showError ? error : undefined;
  const describedBy = [`fit-${key}-guide`, visibleError ? `fit-${key}-error` : warning ? `fit-${key}-warning` : ''].filter(Boolean).join(' ');
  return <div className="fp-measure" data-measurement={key}>
    <div className="fp-measure-head">
      <label htmlFor={`fit-${key}`}>{label}</label>
      <span className="fp-measure-tag">{optional ? 'Optional' : 'Core'}</span>
    </div>
    <dl className="fp-guide" id={`fit-${key}-guide`}>
      <div><dt>Where</dt><dd>{where}</dd></div>
      <div><dt>Tape</dt><dd>{tape} <strong>{tapeCare(definition)}</strong></dd></div>
      <div><dt>Position</dt><dd>{position}</dd></div>
    </dl>
    <div className="fp-entry">
      <input id={`fit-${key}`} name={`fit-${key}`} type="text" inputMode="decimal" autoComplete="off" placeholder="—" value={entry?.value ?? ''}
        onChange={(event) => onValue(event.target.value)} onBlur={onBlur} aria-invalid={Boolean(visibleError)} aria-describedby={describedBy} />
      <div className="fp-units" role="group" aria-label={`${label} unit`}>
        {(['cm', 'in'] as const).map((option) => <button key={option} type="button" data-unit={option} aria-pressed={unit === option} onClick={() => onUnit(option)}>{option}</button>)}
      </div>
    </div>
    {equivalent && !visibleError && <p className="fp-equivalent">Entered as {parsed.ok ? parsed.normalized : ''} {unit} · about {equivalent}</p>}
    {visibleError && <p className="fp-error" id={`fit-${key}-error`} role="alert">{visibleError.message}{visibleError.suggestedUnit && <button type="button" data-switch-unit={visibleError.suggestedUnit} onClick={() => onUnit(visibleError.suggestedUnit!)}>Use {visibleError.suggestedUnit}</button>}</p>}
    {!visibleError && warning && <p className="fp-warning" id={`fit-${key}-warning`}>{warning.message}{warning.suggestedUnit && <button type="button" data-switch-unit={warning.suggestedUnit} onClick={() => onUnit(warning.suggestedUnit!)}>Switch to {warning.suggestedUnit}</button>}</p>}
  </div>;
}

export default function FitProfilePage() {
  const auth = useAuth();
  const utils = trpc.useUtils();
  const fitQuery = trpc.account.fitProfile.get.useQuery(undefined, { enabled: auth.isAuthenticated, retry: false });
  const confirmMutation = trpc.account.fitProfile.confirmMeasurements.useMutation();
  const preferencesMutation = trpc.account.fitProfile.savePreferences.useMutation();
  const removeMutation = trpc.account.fitProfile.remove.useMutation();
  const [mode, setMode] = useState<'overview' | 'edit'>('overview');
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [preferredUnit, setPreferredUnit] = useState<MeasurementUnit>('cm');
  const [touched, setTouched] = useState<Set<MeasurementKey>>(() => new Set());
  const [attempted, setAttempted] = useState<Set<StepId>>(() => new Set());
  const [reviewChecked, setReviewChecked] = useState(false);
  const [notice, setNotice] = useState('');
  const [deviceNotice, setDeviceNotice] = useState('');
  const [preferences, setPreferences] = useState<Preferences>({ jacketFit: null, trouserFit: null, notes: '' });
  const [preferencesNotice, setPreferencesNotice] = useState('');
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousView = useRef('');
  const data = fitQuery.data;
  const current = data?.current ?? null;

  useEffect(() => {
    if (!data?.preferences) return;
    setPreferences({ jacketFit: (data.preferences.jacketFit as FitPreferenceChoice | null) ?? null, trouserFit: (data.preferences.trouserFit as FitPreferenceChoice | null) ?? null, notes: data.preferences.notes ?? '' });
  }, [data?.preferences]);
  useEffect(() => {
    const view = `${mode}:${stepIndex}`;
    if (previousView.current && previousView.current !== view) headingRef.current?.focus();
    previousView.current = view;
  }, [mode, stepIndex]);

  const input = useMemo(() => toInput(draft), [draft]);
  const assessment = useMemo(() => assessMeasurements(input, { requireCore: true }), [input]);
  const fieldIssue = (issues: MeasurementIssue[], key: MeasurementKey) => issues.find((issue) => issue.key === key);
  const step = STEPS[stepIndex];
  const stepFields = step.id === 'review' ? [] : BODY_MEASUREMENTS.filter(({ group }) => group === step.id);
  const blockingErrors = assessment.errors.filter(({ code }) => code !== 'required');
  const missingCore = assessment.errors.filter(({ code }) => code === 'required');
  const pairWarnings = assessment.warnings.filter(({ key }) => key === null);
  const canConfirm = assessment.errors.length === 0 && reviewChecked && !confirmMutation.isPending;

  function startEditing() {
    const base: Draft = {};
    if (current) {
      for (const { definition, measurement } of storedEntries(current.measurements)) base[definition.key] = { value: measurement.value, unit: measurement.unit };
      setDeviceNotice('');
    } else {
      Object.assign(base, legacyDeviceValues());
      setDeviceNotice(Object.keys(base).length ? 'We found measurements saved on this device earlier. Review them in centimetres before confirming; nothing has been saved to your account yet.' : '');
    }
    setDraft(base);
    const firstUnit = Object.values(base)[0]?.unit;
    if (firstUnit) setPreferredUnit(firstUnit);
    setTouched(new Set());
    setAttempted(new Set());
    setReviewChecked(false);
    setNotice('');
    setStepIndex(0);
    setMode('edit');
  }
  function updateValue(key: MeasurementKey, value: string) {
    setDraft((existing) => ({ ...existing, [key]: { value, unit: existing[key]?.unit ?? preferredUnit } }));
    setReviewChecked(false);
  }
  function updateUnit(key: MeasurementKey, unit: MeasurementUnit) {
    setDraft((existing) => ({ ...existing, [key]: { value: existing[key]?.value ?? '', unit } }));
    setPreferredUnit(unit);
    setReviewChecked(false);
  }
  function goTo(index: number) {
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, index)));
  }
  function continueStep() {
    const invalid = stepFields.find(({ key }) => blockingErrors.some((issue) => issue.key === key));
    if (invalid) {
      setAttempted((existing) => new Set(existing).add(step.id));
      document.getElementById(`fit-${invalid.key}`)?.focus();
      return;
    }
    goTo(stepIndex + 1);
  }
  function confirmProfile() {
    if (!canConfirm) return;
    confirmMutation.mutate({ measurements: input }, {
      onSuccess: () => {
        try { window.localStorage.removeItem(LEGACY_DEVICE_KEY); } catch { /* storage unavailable */ }
        void utils.account.fitProfile.get.invalidate();
        setMode('overview');
        setNotice('Your fit profile is confirmed and saved to your DERVALLON account.');
      },
      onError: (error) => setNotice(error.message || 'Your measurements could not be saved. Please try again.'),
    });
  }
  function savePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    preferencesMutation.mutate({ jacketFit: preferences.jacketFit, trouserFit: preferences.trouserFit, notes: preferences.notes.trim() }, {
      onSuccess: () => { void utils.account.fitProfile.get.invalidate(); setPreferencesNotice('Fit preferences saved.'); },
      onError: () => setPreferencesNotice('Your preferences could not be saved. Please try again.'),
    });
  }
  function removeProfile() {
    removeMutation.mutate(undefined, {
      onSuccess: () => { setConfirmingRemoval(false); setPreferences({ jacketFit: null, trouserFit: null, notes: '' }); void utils.account.fitProfile.get.invalidate(); setNotice('Your fit profile and measurement history have been removed.'); },
      onError: () => setNotice('Your fit profile could not be removed. Please try again.'),
    });
  }

  const crumbs = <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My DERVALLON', href: '/account' }, { label: 'My DERVALLON Fit' }]} />;
  if (auth.loading) return <PageShell><div className="fit-page section-ivory"><div className="container"><p className="route-loading" role="status">Loading My DERVALLON Fit</p></div></div></PageShell>;
  if (!auth.isAuthenticated) return <PageShell><div className="fit-page section-ivory"><div className="container">{crumbs}<div className="account-auth-gate"><span className="eyebrow">My DERVALLON Fit</span><h1>Your measurements,<br /><em>kept private.</em></h1><p>Sign in to record your body measurements and fit preferences in your own DERVALLON account.</p><button type="button" className="button-link button-dark" onClick={() => startLogin()}>Sign in to DERVALLON <ArrowRight size={15} aria-hidden="true" /></button><span className="account-auth-note"><ShieldCheck size={16} aria-hidden="true" /> Measurements are visible only to your signed-in account.</span></div></div></div></PageShell>;

  return <PageShell><div className="fit-page section-ivory"><div className="container">
    {crumbs}
    <header className="fp-header">
      <div><span className="eyebrow">My DERVALLON Fit</span><h1>Your body,<br /><em>measured with care.</em></h1></div>
      <p>Record your body measurements once, review them calmly, and use them for future DERVALLON designs. These are measurements of you, not of a garment.</p>
    </header>
    {notice && <p className="inline-notice fp-notice" role="status">{notice}</p>}
    {fitQuery.isLoading ? <p className="route-loading" role="status">Loading your fit profile</p>
    : fitQuery.isError ? <div className="inline-notice fp-notice fp-load-error" role="alert"><p>We could not load your fit profile. Nothing has been changed.</p><button type="button" className="fp-text-link" onClick={() => { void fitQuery.refetch(); }}>Try again</button></div>
    : mode === 'overview' ? <div className="fp-overview">
      <section className="fp-card fp-current" data-fit-current aria-labelledby="fp-current-title">
        <div className="fp-card-head"><div><span className="eyebrow">Current profile</span><h2 id="fp-current-title" ref={headingRef} tabIndex={-1}>{current ? <>Version {current.version}</> : 'Not yet measured'}</h2></div><Ruler size={20} aria-hidden="true" /></div>
        {current ? <>
          <p className="fp-meta">Last confirmed {confirmedDate(current.confirmedAt)} · {MEASUREMENT_SOURCE_LABELS[current.source]}</p>
          <dl className="fp-values">{storedEntries(current.measurements).map(({ definition, measurement }) => <div key={definition.key}><dt>{definition.label}</dt><dd>{enteredLabel(measurement)}<small>{equivalentLabel(measurement as StoredMeasurement)}</small></dd></div>)}</dl>
          <div className="fp-actions"><button type="button" className="button-link button-dark" onClick={startEditing}>Update measurements <ArrowRight size={15} aria-hidden="true" /></button><Link href="/custom-order" className="fp-text-link">Use in Bespoke Studio <ArrowRight size={14} aria-hidden="true" /></Link></div>
        </> : <>
          <p className="fp-meta">No measurements saved yet. Allow around ten minutes, a soft tape measure and, ideally, someone to help.</p>
          <div className="fp-actions"><button type="button" className="button-link button-dark" onClick={startEditing}>Begin measuring <ArrowRight size={15} aria-hidden="true" /></button></div>
        </>}
      </section>

      <section className="fp-card" aria-labelledby="fp-preferences-title">
        <div className="fp-card-head"><div><span className="eyebrow">Fit preferences</span><h2 id="fp-preferences-title">How you like it to sit.</h2></div></div>
        <p className="fp-meta">Kept separately from your measurements and shared with your tailor as preferences only.</p>
        <form className="fp-preferences" onSubmit={savePreferences}>
          {FIT_PREFERENCE_CATEGORIES.map(({ key, label }) => <fieldset key={key}><legend>{label}</legend><div className="fp-pref-options">{FIT_PREFERENCE_CHOICES.map((choice) => <label key={choice.id} className={preferences[key] === choice.id ? 'is-selected' : ''}><input type="radio" name={key} value={choice.id} checked={preferences[key] === choice.id} onChange={() => { setPreferences((existing) => ({ ...existing, [key]: choice.id })); setPreferencesNotice(''); }} /><span>{choice.label}</span><small>{choice.note}</small></label>)}</div></fieldset>)}
          <label className="fp-notes" htmlFor="fit-notes">Notes for your tailor <span>Optional</span><textarea id="fit-notes" name="fit-notes" maxLength={500} rows={3} value={preferences.notes} placeholder="For example, posture or how you prefer a cuff to fall." onChange={(event) => { setPreferences((existing) => ({ ...existing, notes: event.target.value })); setPreferencesNotice(''); }} /></label>
          <button type="submit" className="outline-button" disabled={preferencesMutation.isPending}>Save preferences <Check size={15} aria-hidden="true" /></button>
          {preferencesNotice && <p className="inline-notice" role="status">{preferencesNotice}</p>}
        </form>
      </section>

      {data?.history.length ? <section className="fp-card fp-history" data-fit-history aria-labelledby="fp-history-title">
        <div className="fp-card-head"><div><span className="eyebrow">History</span><h2 id="fp-history-title">Earlier versions.</h2></div></div>
        <ol>{data.history.map((record) => <li key={record.version}><details><summary><span>Version {record.version}</span><span>{confirmedDate(record.confirmedAt)} · {MEASUREMENT_SOURCE_LABELS[record.source]}</span></summary><dl className="fp-values">{storedEntries(record.measurements).map(({ definition, measurement }) => <div key={definition.key}><dt>{definition.label}</dt><dd>{enteredLabel(measurement)}</dd></div>)}</dl></details></li>)}</ol>
      </section> : null}

      <section className="fp-card fp-privacy" aria-labelledby="fp-privacy-title">
        <div className="fp-card-head"><div><span className="eyebrow">Privacy</span><h2 id="fp-privacy-title">Yours alone.</h2></div><ShieldCheck size={20} aria-hidden="true" /></div>
        <p className="fp-meta">Your measurements are stored in your signed-in DERVALLON account and are not shared with any manufacturer. You can remove them at any time.</p>
        {(current || data?.preferences) && (confirmingRemoval
          ? <div className="fp-remove-confirm" role="group" aria-label="Confirm removal"><p>This removes every saved measurement version and your fit preferences.</p><button type="button" className="outline-button fp-danger" onClick={removeProfile} disabled={removeMutation.isPending}><Trash2 size={15} aria-hidden="true" /> Remove permanently</button><button type="button" className="fp-text-link" onClick={() => setConfirmingRemoval(false)}>Keep my profile</button></div>
          : <button type="button" className="fp-text-link" onClick={() => setConfirmingRemoval(true)}>Remove my fit profile</button>)}
      </section>
    </div> : <div className="fp-flow">
      <nav className="fp-steps" aria-label="Measurement sections">{STEPS.map((item, index) => <button key={item.id} type="button" data-step={item.id} aria-current={index === stepIndex ? 'step' : undefined} className={index === stepIndex ? 'is-current' : ''} onClick={() => goTo(index)}><span>{String(index + 1).padStart(2, '0')}</span>{item.label}</button>)}</nav>
      <section className="fp-card fp-stage" aria-labelledby="fp-stage-title">
        <p className="sr-only" role="status">{`Section ${stepIndex + 1} of ${STEPS.length}: ${step.label}`}</p>
        {step.id !== 'review' ? <>
          <span className="eyebrow">{String(stepIndex + 1).padStart(2, '0')} / {step.label}</span>
          <h2 id="fp-stage-title" ref={headingRef} tabIndex={-1}>{MEASUREMENT_GROUPS[stepIndex].title}<br /><em>{MEASUREMENT_GROUPS[stepIndex].emphasis}</em></h2>
          <p className="fp-lede">Measure over light clothing or skin with a soft tape. Choose centimetres or inches for each value; what you enter is kept exactly as typed.</p>
          {deviceNotice && stepIndex === 0 && <p className="inline-notice">{deviceNotice}</p>}
          <div className="fp-measure-list">{stepFields.map((definition) => <MeasurementField key={definition.key} definition={definition} entry={draft[definition.key]} unit={draft[definition.key]?.unit ?? preferredUnit}
            error={fieldIssue(blockingErrors, definition.key)} warning={fieldIssue(assessment.warnings, definition.key)} showError={touched.has(definition.key) || attempted.has(step.id)}
            onValue={(value) => updateValue(definition.key, value)} onUnit={(unit) => updateUnit(definition.key, unit)} onBlur={() => setTouched((existing) => new Set(existing).add(definition.key))} />)}</div>
        </> : <>
          <span className="eyebrow">{String(stepIndex + 1).padStart(2, '0')} / Review</span>
          <h2 id="fp-stage-title" ref={headingRef} tabIndex={-1}>Review before<br /><em>you confirm.</em></h2>
          <p className="fp-lede">Check each value and unit. You can return to any section to change it.</p>
          {(missingCore.length > 0 || blockingErrors.length > 0) && <div className="fp-error-summary" role="alert"><strong>Before you confirm</strong><ul>{[...missingCore, ...blockingErrors].map((issue) => <li key={`${issue.key}-${issue.code}`}>{issue.message}</li>)}</ul></div>}
          {(assessment.warnings.length > 0) && <div className="fp-warning-summary"><strong>Please check</strong><ul>{assessment.warnings.map((issue) => <li key={`${issue.key ?? issue.keys?.join('-')}-${issue.code}`}>{issue.key ? `${BODY_MEASUREMENTS.find(({ key }) => key === issue.key)?.label}: ` : ''}{issue.message}</li>)}</ul></div>}
          {MEASUREMENT_GROUPS.map((group, index) => <div className="fp-review-group" key={group.id}><div className="fp-review-head"><span className="eyebrow">{group.label}</span><button type="button" onClick={() => goTo(index)}>Edit</button></div><dl>{BODY_MEASUREMENTS.filter((definition) => definition.group === group.id).map(({ key, label }) => {
            const entry = input[key];
            const parsed = entry ? parseMeasurementInput(entry.value) : null;
            return <div key={key} data-review={key}><dt>{label}</dt><dd>{entry && parsed?.ok ? <>{entry.value} {entry.unit}<small>{formatLength(toMicrometres(parsed.hundredths, entry.unit), otherUnit(entry.unit))}</small></> : entry ? 'Needs correction' : 'Not supplied'}</dd></div>;
          })}</dl></div>)}
          {pairWarnings.length === 0 && assessment.warnings.length === 0 && missingCore.length === 0 && <p className="fp-meta">No checks to flag. That does not confirm the values; it only means nothing looked unusual.</p>}
          <p className="fp-disclaimer"><ShieldCheck size={17} aria-hidden="true" /> Software checks can catch typing mistakes but cannot guarantee tailoring accuracy. A DERVALLON tailor should confirm measurements before any garment is made.</p>
          <label className="fp-confirm" htmlFor="fit-review-confirmed"><input id="fit-review-confirmed" name="fit-review-confirmed" type="checkbox" checked={reviewChecked} onChange={(event) => setReviewChecked(event.target.checked)} /><span>I have checked these measurements and units, and they are current.</span></label>
        </>}
        <div className="fp-controls">
          <button type="button" className="fp-back" onClick={() => stepIndex === 0 ? setMode('overview') : goTo(stepIndex - 1)}><ArrowLeft size={15} aria-hidden="true" /> {stepIndex === 0 ? 'Cancel' : 'Back'}</button>
          {step.id === 'review'
            ? <button type="button" className="button-link button-dark" data-action="confirm-fit" disabled={!canConfirm} onClick={confirmProfile}>Confirm fit profile <Check size={15} aria-hidden="true" /></button>
            : <button type="button" className="button-link button-dark" onClick={continueStep}>Continue <ArrowRight size={15} aria-hidden="true" /></button>}
        </div>
      </section>
    </div>}
  </div></div></PageShell>;
}
