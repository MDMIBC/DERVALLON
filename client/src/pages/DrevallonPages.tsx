import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Heart, LogOut, MoreHorizontal, Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import {
  Breadcrumbs,
  ButtonLink,
  EditorialImage,
  PageShell,
  ResponsiveImage,
  SectionLabel,
} from "@/components/DrevallonShell";
import {
  emptyStudioState,
  findOptionLabel,
  products,
  siteContent,
  studioOptions,
  studioSteps,
  type StudioState,
} from "@/content/siteContent";
import { bindHeroParallax } from "@/lib/scrollEffects";
import { conceptPhotos } from "@/content/campaignMedia";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { MEASUREMENT_SOURCE_LABELS, preferenceLabel } from "@shared/fitMeasurements";
import { confirmedDate, enteredLabel, storedEntries } from "@/lib/fitDisplay";
import { designIdFromLocation, savedDesignHref, savedDesignSource } from "@/lib/savedDesigns";

const imageSuit = conceptPhotos.suits.src;
const imageBlazer = conceptPhotos.blazers.src;
const imageInterior = conceptPhotos.workroom.src;
const imageShirt = conceptPhotos.shirts.src;
const imageTie = conceptPhotos.ties.src;
const imageTrouser = conceptPhotos.trousers.src;
const imageJacket = conceptPhotos.jackets.src;

export function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!heroRef.current || !logoRef.current) return;
    return bindHeroParallax(heroRef.current, logoRef.current);
  }, []);
  return <PageShell>
    <section ref={heroRef} className="home-hero brand-hero" aria-label="DERVALLON introduction">
      <div className="brand-hero-grain" aria-hidden="true" style={{ backgroundImage: "url('/manus-storage/hero-grain-tile_7bd8c5f8.png')" }} />
      <div className="brand-hero-content">
        <span className="brand-hero-kicker">{siteContent.brand.eyebrow}</span>
        <div ref={logoRef} className="brand-hero-mark"><picture><source type="image/webp" srcSet="/manus-storage/dervallon-exact-master-800_1cb8bbf6.webp 800w, /manus-storage/dervallon-exact-master-1500_ea847867.webp 1500w, /manus-storage/dervallon-exact-master-lossless_3ec5a643.webp 3690w" sizes="(max-width: 640px) 78vw, 460px" /><img src="/manus-storage/1000007848_3a47cba1.png" alt="Supplied knight emblem with gold crown and DERVALLON wordmark" width="3690" height="3834" fetchPriority="high" decoding="async" /></picture></div>
        <h1 className="brand-hero-line">{siteContent.brand.heroHeadline}</h1>
        <p className="brand-hero-description">{siteContent.brand.heroLine}</p>
        <div className="brand-hero-actions hero-actions"><span className="primary-cta-entrance"><ButtonLink href="/collections" variant="light">Explore the Collection</ButtonLink></span><ButtonLink href="/studio" variant="line">Enter the Design Studio</ButtonLink></div>
      </div>
      <div className="brand-hero-scroll">Scroll to explore <ArrowRight size={14} aria-hidden="true" /></div>
    </section>

    <section className="section-ivory signature-section">
      <div className="container">
        <SectionLabel number="01">Signature suits</SectionLabel>
        <div className="section-intro-row reveal-on-scroll"><div><span className="eyebrow">The opening edit</span><h2>Strong lines.<br /><em>Quiet intent.</em></h2></div><p className="intro-copy">A considered edit shaped around proportion, presence, and the moments that ask you to be clear.</p></div>
        <div className="signature-grid">{products.filter((product) => product.featured).map((product, index) => <ProductCard key={product.id} product={product} index={index} reveal />)}</div>
        <div className="section-end-link"><ButtonLink href="/category/suits" variant="line">View all suits</ButtonLink></div>
      </div>
    </section>

    <section className="studio-home-section">
      <div className="studio-home-image reveal-on-scroll"><EditorialImage src={imageInterior} alt={conceptPhotos.workroom.alt} /></div>
      <div className="studio-home-copy reveal-on-scroll"><SectionLabel number="02" dark>Design Studio</SectionLabel><span className="eyebrow eyebrow-brass">A guided design experience</span><h2>Make room<br /><em>for your point of view.</em></h2><p>{siteContent.brand.studioIntro}</p><ButtonLink href="/studio" variant="light">Enter the Design Studio</ButtonLink><div className="studio-stat"><span>07</span><span>considered stages<br />from first choice to final direction</span></div></div>
    </section>

    <section className="section-ivory detail-section">
      <div className="container"><SectionLabel number="03">Editorial details</SectionLabel><div className="detail-grid reveal-on-scroll"><EditorialImage src={imageSuit} alt={conceptPhotos.suits.alt} className="detail-large" /><div className="detail-side"><EditorialImage src={imageBlazer} alt={conceptPhotos.blazers.alt} className="detail-small" /><p>Design is found in the space between a clean line and a personal decision.</p><span className="detail-note">01 — Editorial detail / considered texture</span></div></div></div>
    </section>

    <section className="collections-section"><div className="container"><SectionLabel dark number="04">Collections</SectionLabel><div className="section-intro-row dark-intro reveal-on-scroll"><div><span className="eyebrow eyebrow-brass">The house edit</span><h2>Find your<br /><em>register.</em></h2></div><p className="intro-copy">Six directions for a considered wardrobe, each shaped around a distinct point of view.</p></div><div className="collection-tiles"><CollectionTile title="Suits" number="01" image={imageSuit} alt={conceptPhotos.suits.alt} href="/category/suits" /><CollectionTile title="Shirts" number="02" image={imageShirt} alt={conceptPhotos.shirts.alt} href="/category/shirts" /><CollectionTile title="Ties" number="03" image={imageTie} alt={conceptPhotos.ties.alt} href="/category/ties" /><CollectionTile title="Trousers" number="04" image={imageTrouser} alt={conceptPhotos.trousers.alt} href="/category/trousers" /><CollectionTile title="Blazers" number="05" image={imageBlazer} alt={conceptPhotos.blazers.alt} href="/category/blazers" /><CollectionTile title="Jackets" number="06" image={imageJacket} alt={conceptPhotos.jackets.alt} href="/category/jackets" /></div></div></section>

    <section className="house-section section-ivory"><div className="container house-grid reveal-on-scroll"><div><SectionLabel number="05">The house</SectionLabel><span className="eyebrow">A new menswear brand</span><h2>Defined by<br /><em>consideration.</em></h2></div><div className="house-copy"><p className="house-lede">{siteContent.brand.houseIntro}</p><p>Here, every element has a role: the cut, the contrast, the restraint. The first collection is a study in how clothing can support the person wearing it without asking to be louder than them.</p><ButtonLink href="/about" variant="line">Read about DERVALLON</ButtonLink></div></div></section>

    <section className="preview-notice-section"><div className="container preview-notice reveal-on-scroll"><div><span className="eyebrow eyebrow-brass">A new point of view</span><h2>Considered now.<br /><em>Made to evolve.</em></h2></div><p>{siteContent.brand.conceptNotice}</p><Link href="/contact" className="text-link light-text-link">Start an Enquiry <ArrowRight size={15} /></Link></div></section>
  </PageShell>;
}

function ProductCard({ product, index, reveal = false }: { product: (typeof products)[number]; index: number; reveal?: boolean }) {
  return <Link href={`/product/${product.id}`} className={`product-card ${reveal ? "reveal-on-scroll" : ""}`} style={{ "--card-index": index } as React.CSSProperties}><div className="product-image"><ResponsiveImage src={product.image} alt={`${product.name}, DERVALLON ${product.category.toLowerCase()} editorial`} sizes="(max-width: 767px) 100vw, 40vw" /><span className="image-badge">Editorial image</span><span className="product-index">{String(index + 1).padStart(2, '0')}</span></div><div className="product-card-meta"><div><span className="product-category">{product.category} / {product.type}</span><h3>{product.name}</h3><p className="product-card-description">{product.description}</p><span className="product-card-status">{product.customisable ? "Design Studio path" : "Collection edit"}</span></div><span className="product-card-cta">View Garment <ArrowRight size={14} aria-hidden="true" /></span></div></Link>;
}

function ArrowUpRightIcon() { return <span className="arrow-circle" aria-hidden="true"><ArrowRight size={16} /></span>; }

function CollectionTile({ title, number, image, href, alt }: { title: string; number: string; image: string; href: string; alt: string }) {
  return <Link href={href} className="collection-tile reveal-on-scroll"><ResponsiveImage src={image} alt={alt} sizes="(max-width: 767px) 100vw, (max-width: 1180px) 50vw, 33vw" /><div className="collection-tile-overlay" /><span className="collection-tile-status">EDITORIAL IMAGE</span><div className="collection-tile-copy"><span>{number}</span><h3>{title}</h3><ArrowUpRightIcon /></div></Link>;
}

export function CollectionsPage() {
  return <PageShell><div className="page-hero page-hero-ivory"><div className="container"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "New Collections" }]} /><span className="eyebrow">The opening edit / 2026</span><h1>New<br /><em>Collections.</em></h1><p>A considered starting point for professional life, formal occasions, and the spaces in between.</p></div></div><section className="section-ivory catalogue-section"><div className="container"><div className="catalogue-header"><div><span className="eyebrow">The DERVALLON edit</span><h2>A studied<br /><em>wardrobe.</em></h2></div><p>{siteContent.brand.conceptNotice}</p></div><div className="catalogue-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} reveal />)}</div></div></section></PageShell>;
}

export function CategoryPage() {
  const [, params] = useRoute<{ category: string }>("/category/:category");
  const category = (params?.category ?? "suits").replace(/-/g, " ");
  const title = category.charAt(0).toUpperCase() + category.slice(1);
  const [query, setQuery] = useState("");
  const photo = (conceptPhotos as Record<string, { src: string; alt: string }>)[category.toLowerCase()];
  const filtered = products.filter((product) => product.category.toLowerCase() === category.toLowerCase() && `${product.name} ${product.description} ${product.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return <PageShell><div className="page-hero page-hero-ivory compact-page-hero category-page-hero"><div className="container"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: title }]} /><div className="category-hero-grid"><div><span className="eyebrow">Category / {title}</span><h1>{title}<em>.</em></h1><p>{category.toLowerCase() === "suits" ? "A focused line for days that ask for clarity." : "A considered category in the DERVALLON wardrobe."}</p><span className="category-hero-caption">Editorial image</span></div>{photo && <figure className="category-hero-art"><ResponsiveImage src={photo.src} alt={photo.alt} sizes="(max-width: 767px) 100vw, 40vw" loading="eager" /><figcaption>01 / {title.toUpperCase()} · EDITORIAL IMAGE</figcaption></figure>}</div></div></div><section className="section-ivory catalogue-section"><div className="container"><div className="filter-row"><span>{filtered.length} {filtered.length === 1 ? "piece" : "pieces"}</span><label className="filter-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter this edit" aria-label={`Filter ${title}`} /></label><button className="reset-button" onClick={() => setQuery("")} disabled={!query}>Reset</button></div>{filtered.length ? <div className="catalogue-grid">{filtered.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <EmptyState title="No garments match this filter." action="Reset filter" onAction={() => setQuery("")} />}</div></section></PageShell>;
}

export function ProductPage() {
  const [, params] = useRoute<{ id: string }>("/product/:id");
  const product = products.find((item) => item.id === params?.id) ?? products[0];
  const [saved, setSaved] = useState(false);
  const related = products.filter((item) => item.id !== product.id).slice(0, 2);
  return <PageShell><div className="container product-page"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: product.category, href: `/category/${product.category.toLowerCase()}` }, { label: product.name }]} /><div className="product-detail-grid"><div className="product-gallery"><div className="gallery-main"><ResponsiveImage src={product.image} alt={`${product.name}, DERVALLON ${product.category.toLowerCase()} editorial`} sizes="(max-width: 767px) 100vw, 60vw" /><span className="image-badge">Editorial image</span></div>{product.supportingImages?.length ? <div className="gallery-thumbs" aria-label="Supporting editorial reference images">{product.supportingImages.map((image) => <ResponsiveImage key={image.src} src={image.src} alt={image.alt} sizes="(max-width: 767px) 50vw, 30vw" />)}</div> : null}</div><div className="product-detail-copy"><span className="eyebrow">{product.category} / {product.type}</span><h1>{product.name}<em>.</em></h1><p className="product-lede">{product.description}</p><div className="product-detail-rule" /><dl className="product-notes"><div><dt>Silhouette</dt><dd>{product.tags[1] ?? "Considered line"}</dd></div><div><dt>Price</dt><dd>Price on enquiry</dd></div></dl><div className="product-actions"><button className={`save-button ${saved ? "saved" : ""}`} onClick={() => setSaved(!saved)}><Heart size={17} fill={saved ? "currentColor" : "none"} />{saved ? "Saved" : "Save this direction"}</button><ButtonLink href={`/contact?context=${encodeURIComponent(product.name)}`} variant="dark">Start an Enquiry</ButtonLink></div>{product.category === "Suits" ? <div className="customise-path"><span className="customise-path-label">Shape the next direction</span><ButtonLink href="/studio" variant="line">Customise This Suit <ArrowRight size={15} aria-hidden="true" /></ButtonLink><p>Explore the silhouette and keep your design direction close.</p></div> : null}</div></div><section className="product-details" aria-labelledby="product-details-title"><div className="product-details-heading"><span className="eyebrow">Product guidance</span><h2 id="product-details-title">The useful<br /><em>details.</em></h2><p>The current edit is defined by its silhouette and point of view. Explore the details of this garment, then enquire about fabric, construction and personalisation.</p></div><dl className="product-detail-list"><div data-product-detail="silhouette"><dt>Silhouette</dt><dd>{product.tags[1] ?? "Considered line"}</dd></div></dl><ButtonLink href="/custom-order" variant="line">Explore fit direction <ArrowRight size={15} aria-hidden="true" /></ButtonLink></section><section className="complete-the-look" aria-labelledby="complete-the-look-title"><div className="section-label-row"><SectionLabel number="06">Complete the look</SectionLabel><span>Related garments</span></div><div className="related-product-grid">{related.map((item) => <RelatedProductCard key={item.id} product={item} />)}</div></section></div></PageShell>;
}

function RelatedProductCard({ product }: { product: (typeof products)[number] }) {
  return <Link href={`/product/${product.id}`} className="related-product-card"><div className="related-product-image"><ResponsiveImage src={product.image} alt={`${product.name}, DERVALLON ${product.category.toLowerCase()} editorial`} sizes="(max-width: 767px) 50vw, 25vw" /></div><span className="product-category">{product.category} / {product.type}</span><h3>{product.name}</h3></Link>;
}

export function StudioPage() {
  const [state, setState] = useState<StudioState>(() => { try { return JSON.parse(localStorage.getItem("drevallon-studio-draft") ?? "null") ?? emptyStudioState; } catch { return emptyStudioState; } });
  const [stepIndex, setStepIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const auth = useAuth();
  const [designId, setDesignId] = useState<number | null>(() => designIdFromLocation());
  const [saveStatus, setSaveStatus] = useState<"" | "account" | "device" | "error">("");
  const savedDesignQuery = trpc.account.designs.get.useQuery({ id: designId ?? 0 }, { enabled: auth.isAuthenticated && designId !== null, retry: false });
  const saveDesignMutation = trpc.account.designs.save.useMutation();
  const restoredDesign = useRef<number | null>(null);
  const [designUnavailable, setDesignUnavailable] = useState(false);
  // A link to a design that is not on this account (removed, or another customer's) is never reused for saving.
  useEffect(() => { if (savedDesignQuery.isError) { setDesignId(null); setDesignUnavailable(true); } }, [savedDesignQuery.isError]);
  useEffect(() => {
    const design = savedDesignQuery.data;
    if (!design || design.payload.kind !== "studio" || restoredDesign.current === design.id) return;
    restoredDesign.current = design.id;
    const { garment, silhouette, jacketDetail, trouserDetail, profile, notes } = design.payload;
    setState({ garment, silhouette, jacketDetail, trouserDetail, profile, notes: notes ?? "" });
  }, [savedDesignQuery.data]);
  const visibleSteps = useMemo(() => studioSteps.filter((step) => !(step.id === "trouserDetail" && state.garment === "jacket")), [state.garment]);
  const step = visibleSteps[stepIndex] ?? visibleSteps[0];
  const update = (patch: Partial<StudioState>) => { setSaved(false); setSaveStatus(""); setState((current) => { const next = { ...current, ...patch }; localStorage.setItem("drevallon-studio-draft", JSON.stringify(next)); return next; }); };
  const next = () => setStepIndex((index) => Math.min(index + 1, visibleSteps.length - 1));
  const back = () => setStepIndex((index) => Math.max(index - 1, 0));
  const finish = () => {
    if (!auth.isAuthenticated) {
      // Signed out: kept only in this browser, and labelled as such. Sign-in offers to add it to the account.
      localStorage.setItem("drevallon-saved-design", JSON.stringify({ ...state, savedAt: new Date().toISOString(), title: `${findOptionLabel("garment", state.garment)} direction` }));
      setSaved(true); setSaveStatus("device");
      return;
    }
    const design = { kind: "studio" as const, garment: state.garment, silhouette: state.silhouette, jacketDetail: state.jacketDetail, trouserDetail: state.trouserDetail, profile: state.profile, notes: state.notes ?? "" };
    // Studio state holds plain strings; the server re-validates every id against the real Studio options.
    saveDesignMutation.mutate((designId === null ? { design } : { id: designId, design }) as Parameters<typeof saveDesignMutation.mutate>[0], {
      onSuccess: (savedDesign) => { setDesignId(savedDesign.id); setSaved(true); setSaveStatus("account"); },
      onError: () => { setSaved(false); setSaveStatus("error"); },
    });
  };
  return <PageShell dark><div className="studio-page"><div className="container studio-header"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Design Studio" }]} /><span className="eyebrow eyebrow-brass">A guided design experience</span><h1>Design<br /><em>Studio.</em></h1><p>{siteContent.brand.studioIntro}</p><p className="studio-preview-note">Start with silhouette, detail, and proportion. When you are ready, explore fabric and fit direction in the Bespoke Studio.</p><Link href="/custom-order" className="studio-custom-order-link">Explore Bespoke Studio <ArrowRight size={16} aria-hidden="true" /></Link></div><div className="studio-workspace container"><div className="studio-progress" aria-label="Design Studio progress">{visibleSteps.map((item, index) => <button key={item.id} className={index === stepIndex ? "active" : index < stepIndex ? "complete" : ""} onClick={() => setStepIndex(index)}><span>{String(index + 1).padStart(2, "0")}</span><span>{item.label}</span></button>)}</div><div className="studio-main">{designUnavailable && <div className="studio-notice" data-saved-design-unavailable role="status"><span>Saved design</span><p>This saved design is not available on your account. Your choices here will be saved as a new design.</p></div>}<div className="studio-step-label"><span>Step {String(stepIndex + 1).padStart(2, "0")} / {String(visibleSteps.length).padStart(2, "0")}</span><span>{step.label}</span></div>{state.garment === "jacket" && step.id !== "garment" && <div className="studio-notice"><span>Jacket-only direction</span><p>Trouser detail has been removed from this active path. Any previous trouser choice remains in the draft if you return to a full suit.</p></div>}<StudioStep step={step.id} state={state} update={update} /><div className="studio-controls"><button className="studio-back" onClick={back} disabled={stepIndex === 0}><ArrowLeft size={16} />Back</button>{step.id === "review" ? <button className="studio-continue" onClick={finish} disabled={saveDesignMutation.isPending}>{saved ? <><Check size={16} />Saved</> : <>Save design <Check size={16} /></>}</button> : <button className="studio-continue" onClick={next} disabled={!canContinue(step.id, state)}>Continue <ArrowRight size={16} /></button>}</div>{saveStatus && <div className={`studio-save-status${saveStatus === "error" ? " is-error" : ""}`} data-studio-save-status role={saveStatus === "error" ? "alert" : "status"}>{saveStatus === "account" ? <p>Saved to your DERVALLON account. Find it in <Link href="/account">My DERVALLON</Link>. Saving a design does not place an order.</p> : saveStatus === "device" ? <><p>Saved only on this device. Sign in to keep your designs in your DERVALLON account. Saving a design does not place an order.</p><button type="button" className="text-button" onClick={() => startLogin()}>Sign in</button></> : <p>This design could not be saved to your account just now. Your choices are still here; please try again.</p>}</div>}</div><aside className={`studio-summary ${summaryOpen ? "open" : ""}`}><button className="summary-toggle" onClick={() => setSummaryOpen(!summaryOpen)}><span>Your summary</span><ChevronDown size={17} /></button><div className="summary-content"><span className="eyebrow eyebrow-brass">Live summary</span><h2>{findOptionLabel("garment", state.garment)}<br /><em>direction.</em></h2><SummaryRow label="Silhouette" value={findOptionLabel("silhouette", state.silhouette)} /><SummaryRow label="Jacket detail" value={findOptionLabel("jacketDetail", state.jacketDetail)} />{state.garment !== "jacket" && <SummaryRow label="Trouser detail" value={findOptionLabel("trouserDetail", state.trouserDetail)} />}<SummaryRow label="Measurement profile" value={findOptionLabel("profile", state.profile)} /><div className="summary-note"><span>Notes</span><p>{state.notes || "No personal notes yet."}</p></div></div></aside></div></div></PageShell>;
}

function canContinue(step: string, state: StudioState) { return step === "notes" || step === "profile" || step === "review" || Boolean(state[step as keyof StudioState]); }

function StudioStep({ step, state, update }: { step: string; state: StudioState; update: (patch: Partial<StudioState>) => void }) {
  if (["garment", "silhouette", "jacketDetail", "trouserDetail", "profile"].includes(step)) {
    const options = studioOptions[step as keyof typeof studioOptions] as readonly { id: string; label: string; note: string }[];
    return <div className="studio-option-grid">{options.map((option) => <button key={option.id} className={`studio-option ${state[step as keyof StudioState] === option.id ? "selected" : ""}`} onClick={() => update({ [step]: option.id } as Partial<StudioState>)}><span className="option-mark">{state[step as keyof StudioState] === option.id ? <Check size={17} /> : <span />}</span><span><strong>{option.label}</strong><small>{option.note}</small></span></button>)}</div>;
  }
  if (step === "notes") return <div className="studio-notes-step"><label htmlFor="design-notes">What should this direction hold?</label><textarea id="design-notes" maxLength={2000} value={state.notes} onChange={(event) => update({ notes: event.target.value })} placeholder="Add a thought, a reference point, or the occasion this wardrobe is for." /><span>Optional / kept with your design choices</span></div>;
  return <div className="studio-review-step"><div className="review-card"><span className="eyebrow eyebrow-brass">Ready to review</span><h2>{findOptionLabel("garment", state.garment)}<br /><em>with intent.</em></h2><p>Your choices stay with this design exploration. Saving does not create an account or place an order.</p><div className="review-marks"><span><Check size={14} />Concept built</span><span><Check size={14} />No measurements collected</span><span><Check size={14} />Design direction saved</span></div></div></div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="summary-row"><span>{label}</span><strong>{value}</strong></div>; }

type LocalSavedDirection = { title?: string; savedAt?: string; garment?: string; silhouette?: string; jacketDetail?: string; trouserDetail?: string; profile?: string; notes?: string };

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function AccountAuthGate() {
  return <PageShell><div className="account-page section-ivory"><div className="container"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My DERVALLON" }]} /><div className="account-auth-gate"><span className="eyebrow">My DERVALLON</span><h1>Your wardrobe,<br /><em>kept close.</em></h1><p>Sign in to save your fit direction, design choices, and future wardrobe records to your own account.</p><button type="button" className="button-link button-dark" onClick={() => startLogin()}>Sign in to DERVALLON <ArrowRight size={15} aria-hidden="true" /></button><span className="account-auth-note"><ShieldCheck size={16} aria-hidden="true" /> Account data is protected by your authenticated session.</span></div></div></div></PageShell>;
}

function AccountLoadError({ what, retry, onRetry }: { what: string; retry: string; onRetry: () => void }) {
  return <div className="account-load-error" role="alert"><p className="card-copy">We could not load {what} just now. Nothing has been changed.</p><button type="button" className="outline-button" data-retry={retry} onClick={onRetry}>Try again</button></div>;
}

const ACCOUNT_SECTION_ROUTES: Record<string, "saved-designs" | "orders" | "wardrobe" | undefined> = {
  "/account/saved-designs": "saved-designs",
  "/account/orders": "orders",
  "/account/wardrobe": "wardrobe",
};
export function AccountPage() {
  const auth = useAuth();
  const utils = trpc.useUtils();
  const profile = auth.user;
  const fitQuery = trpc.account.fitProfile.get.useQuery(undefined, { enabled: auth.isAuthenticated, retry: false });
  const designsQuery = trpc.account.designs.list.useQuery(undefined, { enabled: auth.isAuthenticated, retry: false });
  const ordersQuery = trpc.account.orders.list.useQuery(undefined, { enabled: auth.isAuthenticated, retry: false });
  const wardrobeQuery = trpc.account.wardrobe.list.useQuery(undefined, { enabled: auth.isAuthenticated, retry: false });
  const profileMutation = trpc.account.profile.update.useMutation({ onSuccess: () => utils.auth.me.invalidate() });
  const saveDesignMutation = trpc.account.designs.save.useMutation();
  const deleteDesignMutation = trpc.account.designs.delete.useMutation();
  const [profileName, setProfileName] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [savedLocal, setSavedLocal] = useState<LocalSavedDirection | null>(() => readLocalJson("drevallon-saved-design", null));
  const [designNotice, setDesignNotice] = useState("");

  useEffect(() => { setProfileName(profile?.name ?? ""); }, [profile?.name]);
  // /account/saved-designs, /account/orders and /account/wardrobe open this same page at the matching section.
  const [accountLocation] = useLocation();
  const requestedSection = ACCOUNT_SECTION_ROUTES[accountLocation];
  // Wait until the records above the section have loaded, so their height no longer changes.
  const accountRecordsLoading = fitQuery.isLoading || designsQuery.isLoading || ordersQuery.isLoading || wardrobeQuery.isLoading;
  const focusedSection = useRef<string | null>(null);
  useEffect(() => {
    if (!requestedSection) { focusedSection.current = null; return; }
    if (auth.loading || !auth.isAuthenticated || accountRecordsLoading || focusedSection.current === requestedSection) return;
    const section = document.querySelector<HTMLElement>(`[data-account-section="${requestedSection}"]`);
    if (!section) return;
    focusedSection.current = requestedSection;
    section.scrollIntoView({ block: "start" });
    section.focus({ preventScroll: true });
  }, [requestedSection, auth.loading, auth.isAuthenticated, accountRecordsLoading]);
  if (auth.loading) return <PageShell><div className="account-page section-ivory"><div className="container"><p className="route-loading" role="status">Loading your DERVALLON account</p></div></div></PageShell>;
  if (!auth.isAuthenticated) return <AccountAuthGate />;

  const designs = designsQuery.data ?? [];
  const currentFit = fitQuery.data?.current ?? null;
  const fitPreferences = fitQuery.data?.preferences ?? null;
  const forgetDeviceDesign = (notice: string) => { try { localStorage.removeItem("drevallon-saved-design"); } catch { /* storage unavailable */ } setSavedLocal(null); setDesignNotice(notice); };
  // A design saved while signed out is only added to this account when the customer explicitly chooses to.
  const addDeviceDesign = () => {
    if (!savedLocal) return;
    saveDesignMutation.mutate({ design: { kind: "studio", garment: savedLocal.garment, silhouette: savedLocal.silhouette, jacketDetail: savedLocal.jacketDetail, trouserDetail: savedLocal.trouserDetail, profile: savedLocal.profile, notes: savedLocal.notes ?? "" } } as Parameters<typeof saveDesignMutation.mutate>[0], {
      onSuccess: () => { forgetDeviceDesign("The design from this device has been added to your DERVALLON account."); void designsQuery.refetch(); },
      onError: () => setDesignNotice("The design from this device could not be added. It is still on this device."),
    });
  };
  const removeDesign = (design: { id: number; title: string }) => deleteDesignMutation.mutate({ id: design.id }, {
    onSuccess: () => { setDesignNotice(`${design.title} has been removed from your account.`); void designsQuery.refetch(); },
    onError: () => setDesignNotice(`${design.title} could not be removed just now. Nothing has been changed.`),
  });
  const saveName = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const name = profileName.trim(); if (!name || name === profile?.name) return; profileMutation.mutate({ name }, { onSuccess: () => setProfileNotice("Account details updated."), onError: () => setProfileNotice("Account details could not be updated.") }); };

  return <PageShell><div className="account-page section-ivory"><div className="container"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My DERVALLON" }]} /><div className="account-header"><div><span className="eyebrow">My DERVALLON</span><h1>Your<br /><em>wardrobe.</em></h1></div><div className="account-header-actions"><p>Save a design direction and keep exploring the wardrobe at your own pace.</p><button type="button" className="account-signout" onClick={() => void auth.logout()} disabled={auth.loading}><LogOut size={15} /> Sign out</button></div></div><section className="account-profile-card"><div className="account-profile-mark"><UserRound size={20} aria-hidden="true" /></div><div><span className="eyebrow">Account details</span><strong>{profile?.email ?? "DERVALLON client"}</strong><small>Authenticated DERVALLON account</small></div><form onSubmit={saveName}><label className="sr-only" htmlFor="account-name">Your name</label><input id="account-name" value={profileName} onChange={(event) => { setProfileName(event.target.value); setProfileNotice(""); }} placeholder="Your name" /><button type="submit" className="outline-button" disabled={profileMutation.isPending}>Save details</button></form></section>{(profileNotice || designNotice) && <p className="inline-notice" role="status">{profileNotice || designNotice}</p>}<div className="account-grid"><section className="account-card account-card-main" id="account-saved-designs" data-account-section="saved-designs" tabIndex={-1} aria-label="Saved designs"><div className="account-card-heading"><div><span className="eyebrow">Saved designs</span><h2>Directions in progress</h2></div><Link href="/studio" className="square-action" aria-label="Create a new design"><Plus size={18} /></Link></div>{designsQuery.isLoading ? <p className="card-copy" role="status">Loading your saved designs…</p> : designsQuery.isError ? <AccountLoadError what="your saved designs" retry="designs" onRetry={() => void designsQuery.refetch()} /> : designs.length ? <div className="saved-design-list">{designs.map((design) => <div className="saved-design" data-saved-design key={design.id}><div className="saved-design-mark">✦</div><div><span className="eyebrow">{savedDesignSource(design.kind)}</span><h3>{design.title}</h3><p>Saved {new Date(design.updatedAt).toLocaleDateString()}{design.details.length ? ` · ${design.details.slice(0, 3).map(({ value }) => value).join(" · ")}` : ""}</p></div><div className="saved-actions"><Link href={savedDesignHref(design)} aria-label={`Open ${design.title}`}><Pencil size={16} /></Link><button type="button" onClick={() => removeDesign(design)} aria-label={`Delete ${design.title}`} disabled={deleteDesignMutation.isPending}><Trash2 size={16} /></button></div></div>)}</div> : <EmptyState title="No saved directions yet." copy="Designs you save in the Design Studio or Bespoke Studio will appear here." action="Enter the Design Studio" href="/studio" />}{savedLocal && <div className="device-design" data-device-design><p><strong>{savedLocal.title ?? "A design direction"}</strong> is saved only on this device, not in your account.</p><div className="device-design-actions"><button type="button" className="outline-button" data-action="add-device-design" onClick={addDeviceDesign} disabled={saveDesignMutation.isPending}>Add to my account</button><button type="button" className="account-signout" data-action="remove-device-design" onClick={() => forgetDeviceDesign("The design saved on this device has been removed.")}>Remove from this device</button></div></div>}</section><section className="account-card fit-profile-card" data-fit-profile><div className="account-card-heading"><div><span className="eyebrow">My DERVALLON Fit</span><h2>Your proportions.</h2></div><span className="muted-chip">Private to you</span></div>{currentFit ? <><p className="card-copy">Version {currentFit.version} · confirmed {confirmedDate(currentFit.confirmedAt)} · {MEASUREMENT_SOURCE_LABELS[currentFit.source]}</p><div className="fit-profile-summary">{storedEntries(currentFit.measurements).slice(0, 4).map(({ definition, measurement }) => <div className="fit-summary-row" key={definition.key}><span>{definition.label}</span><strong>{enteredLabel(measurement)}</strong></div>)}<div className="fit-summary-row"><span>Jacket fit</span><strong>{preferenceLabel(fitPreferences?.jacketFit)}</strong></div><div className="fit-summary-row"><span>Trouser fit</span><strong>{preferenceLabel(fitPreferences?.trouserFit)}</strong></div></div><Link href="/account/fit" className="outline-button fit-profile-open">Review or update <ArrowRight size={15} aria-hidden="true" /></Link></> : fitQuery.isLoading ? <p className="card-copy" role="status">Loading your fit profile…</p> : fitQuery.isError ? <><p className="card-copy" role="alert">We could not load your fit profile just now. Nothing has been changed.</p><Link href="/account/fit" className="outline-button fit-profile-open">Open My DERVALLON Fit <ArrowRight size={15} aria-hidden="true" /></Link></> : <><p className="card-copy">No measurements saved yet. A guided, private record of your body measurements and fit preferences.</p><Link href="/account/fit" className="outline-button fit-profile-open">Begin your fit profile <ArrowRight size={15} aria-hidden="true" /></Link></>}<Link href="/custom-order" className="fit-profile-link">Continue to Bespoke Studio <ArrowRight size={15} aria-hidden="true" /></Link></section><section className="account-card account-empty-card" id="account-orders" data-account-section="orders" tabIndex={-1} aria-label="My Orders"><div className="account-card-heading"><div><span className="eyebrow">My Orders</span><h2>Order history.</h2></div>{ordersQuery.data && <span className="muted-chip">{ordersQuery.data.length} records</span>}</div>{ordersQuery.isLoading ? <p className="card-copy" role="status">Loading your order history…</p> : ordersQuery.isError ? <AccountLoadError what="your order history" retry="orders" onRetry={() => void ordersQuery.refetch()} /> : ordersQuery.data?.length ? <p className="card-copy">Your confirmed order records will appear here.</p> : <EmptyState title="No orders yet." copy="Confirmed orders will appear here once a real checkout is available. Saved designs are not orders." action="Explore collections" href="/collections" />}</section><section className="account-card account-empty-card" id="account-wardrobe" data-account-section="wardrobe" tabIndex={-1} aria-label="My DERVALLON Wardrobe"><div className="account-card-heading"><div><span className="eyebrow">My DERVALLON Wardrobe</span><h2>Pieces kept close.</h2></div>{wardrobeQuery.data && <span className="muted-chip">{wardrobeQuery.data.length} pieces</span>}</div>{wardrobeQuery.isLoading ? <p className="card-copy" role="status">Loading your wardrobe…</p> : wardrobeQuery.isError ? <AccountLoadError what="your wardrobe" retry="wardrobe" onRetry={() => void wardrobeQuery.refetch()} /> : wardrobeQuery.data?.length ? <p className="card-copy">Your confirmed wardrobe pieces will appear here.</p> : <EmptyState title="Your wardrobe is ready for its first piece." copy="Confirmed garments will appear here after an order is complete." action="Browse the wardrobe" href="/collections" />}</section></div></div></div></PageShell>;
}
export function SearchPage() {
  const [location] = useLocation();
  const queryParam = new URLSearchParams(location.split("?")[1] ?? "").get("q") ?? "";
  const [query, setQuery] = useState(queryParam);
  const results = products.filter((product) => `${product.name} ${product.category} ${product.description} ${product.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return <PageShell><div className="page-hero page-hero-ivory compact-page-hero"><div className="container"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} /><span className="eyebrow">Search the house</span><h1>Find a<br /><em>direction.</em></h1><div className="search-page-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, categories, or pages" aria-label="Search products, categories, or pages" /><button onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button></div></div></div><section className="section-ivory search-results-section"><div className="container"><div className="filter-row"><span>{results.length} {results.length === 1 ? "result" : "results"}</span></div>{results.length ? <div className="catalogue-grid">{results.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <EmptyState title="Nothing here yet." copy="Try a broader search or return to the collections." action="Explore collections" href="/collections" />}</div></section></PageShell>;
}

export function AboutPage() {
  return <PageShell><div className="about-page section-ivory"><div className="container"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} /><div className="about-hero"><span className="eyebrow">About DERVALLON</span><h1>A wardrobe<br /><em>with intent.</em></h1><p className="about-lede">{siteContent.brand.houseIntro}</p></div><div className="about-content-grid"><div><SectionLabel number="01">The point of view</SectionLabel></div><div className="about-copy"><p>We are beginning with a simple proposition: professional menswear can hold both discipline and personality. That means paying attention to the way a silhouette sits in a room, how a detail shifts the register, and what the wearer wants the clothes to say before they say anything at all.</p><p>DERVALLON is guided by an appreciation for considered design, refined proportions and individual expression. Our vision is to create a distinctive menswear experience where personal style remains at the centre.</p><div className="about-rule" /><span className="eyebrow">A working principle</span><h2>Make it clear.<br /><em>Leave room.</em></h2></div></div></div></div></PageShell>;
}

export function ContactPage() {
  const [location] = useLocation();
  const queryString = typeof window !== "undefined" ? window.location.search : location.split("?")[1] ?? "";
  const context = new URLSearchParams(queryString).get("context");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); if (!form.get("name") || !form.get("email") || !form.get("message")) { setError("Please complete your name, email, and message before continuing."); return; } setSubmitted(true); };
  return <PageShell><div className="contact-page section-ivory"><div className="container"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} /><div className="contact-grid"><div><span className="eyebrow">Client enquiries</span><h1>Start a<br /><em>conversation.</em></h1><p className="contact-lede">Discover DERVALLON, explore a garment, or enquire about your personal design direction. Our team welcomes your enquiry.</p><div className="contact-note"><span>Enquiry details</span><p>Share what you are exploring and keep your direction together in one place.</p></div></div><div className="contact-form-wrap">{submitted ? <div className="form-success"><div className="success-mark"><Check size={20} /></div><span className="eyebrow">Enquiry details ready</span><h2>Thank you<br /><em>for the note.</em></h2><p>No message has been sent. Nothing has been shared externally.</p><button className="outline-button" onClick={() => setSubmitted(false)}>Review another note <RotateCcw size={15} /></button></div> : <form className="contact-form" onSubmit={submit} noValidate><div className="form-field"><label htmlFor="name">Name</label><input id="name" name="name" placeholder="Your name" /></div><div className="form-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" placeholder="you@example.com" /></div><div className="form-field"><label htmlFor="type">Enquiry type</label><select id="type" name="type" defaultValue={context ? "product" : "general"}><option value="general">General enquiry</option><option value="product">A product direction</option><option value="studio">Design Studio</option><option value="account">Account / saved design</option></select></div><div className="form-field"><label htmlFor="message">Message</label><textarea id="message" name="message" defaultValue={context ? `I’m enquiring about ${context}. ` : ""} placeholder="How can we help?" /></div>{error && <div className="form-error" role="alert">{error}</div>}<button className="button-link button-dark" type="submit">Review enquiry <ArrowRight size={15} /></button><p className="form-disclaimer">No message has been sent. Nothing has been shared externally.</p></form>}</div></div></div></div></PageShell>;
}

export function InformationPage() {
  return <PageShell><div className="info-page section-ivory"><div className="container"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Information" }]} /><span className="eyebrow">Information</span><h1>Clear by<br /><em>design.</em></h1><div className="info-list"><p className="info-intro">Explore the collection, Design Studio, fit guidance and enquiry pathways. Product-specific information appears on each garment page, with delivery and returns details available before ordering.</p></div></div></div></PageShell>;
}
function PolicyPage({ title, intro, detail }: { title: "Delivery" | "Returns"; intro: string; detail: string }) {
  return <PageShell><div className="info-page section-ivory"><div className="container"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Information", href: "/information" }, { label: title }]} /><span className="eyebrow">Customer information</span><h1>{title}<br /><em>details.</em></h1><div className="info-list"><details open><summary>{intro}</summary><p>{detail}</p></details></div></div></div></PageShell>;
}
export function DeliveryPage() {
  return <PolicyPage title="Delivery" intro="Delivery arrangements will depend on the confirmed product and fulfilment options." detail="Transactions are not yet enabled. Delivery destinations, timing and costs will be confirmed before ordering. For questions about a garment or current arrangements, please start an enquiry with DERVALLON." />;
}
export function ReturnsPage() {
  return <PolicyPage title="Returns" intro="Purchasing and returns information will be provided before you commit to an order." detail="Transactions are not yet enabled. Final terms will be confirmed before ordering and will not limit rights available under applicable Australian Consumer Law. Any product-specific conditions will be stated clearly before purchase." />;
}
export function EmptyState({ title, copy, action, href, onAction }: { title: string; copy?: string; action: string; href?: string; onAction?: () => void }) { return <div className="empty-state"><div className="empty-symbol">—</div><h2>{title}</h2>{copy && <p>{copy}</p>}{href ? <ButtonLink href={href} variant="line">{action}</ButtonLink> : <button className="outline-button" onClick={onAction}>{action} <RotateCcw size={15} /></button>}</div>; }

export function NotFound() { return <PageShell><div className="not-found section-ivory"><div className="container"><span className="eyebrow">404 / not found</span><h1>That page<br /><em>is elsewhere.</em></h1><p>Return to the house and take a different direction.</p><ButtonLink href="/" variant="dark">Return home</ButtonLink></div></div></PageShell>; }
