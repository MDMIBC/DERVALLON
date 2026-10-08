import { Link, useLocation } from "wouter";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Menu,
  Search,
  Sun,
  Moon,
  UserRound,
  X,
} from "lucide-react";
import { products, siteContent } from "@/content/siteContent";
import { conceptResponsiveSources } from "@/content/campaignMedia";
import { bindHeaderScroll, bindScrollReveals } from "@/lib/scrollEffects";

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand-logo ${light ? "brand-logo-light" : ""}`} aria-label="DERVALLON home">
      <picture>
        <source media="(max-width: 639px)" srcSet={light ? "/manus-storage/dervallon-emblem-small-dark-vector_6b14ff10.svg" : "/manus-storage/dervallon-emblem-small-vector_9cc8ff3e.svg"} />
        <img src={light ? "/manus-storage/dervallon-horizontal-lockup-dark-vector_368fc851.svg" : "/manus-storage/dervallon-horizontal-lockup-vector_0ea99f59.svg"} alt="Supplied crowned knight emblem and DERVALLON wordmark" width="1000" height="220" />
      </picture>
    </Link>
  );
}

const responsiveImageSources = conceptResponsiveSources;

export function ResponsiveImage({ src, alt, className = "", loading = "lazy", sizes = "(max-width: 767px) 100vw, 50vw", fetchPriority, onLoad, onError }: { src: string; alt: string; className?: string; loading?: "lazy" | "eager"; sizes?: string; fetchPriority?: "high" | "low" | "auto"; onLoad?: React.ReactEventHandler<HTMLImageElement>; onError?: React.ReactEventHandler<HTMLImageElement> }) {
  const source = responsiveImageSources[src];
  if (!source) return <img src={src} alt={alt} className={className} loading={loading} decoding="async" fetchPriority={fetchPriority} onLoad={onLoad} onError={onError} />;
  return <picture><source type="image/avif" srcSet={source.avif} sizes={sizes} /><source type="image/webp" srcSet={source.webp} sizes={sizes} /><img src={src} alt={alt} className={className} loading={loading} decoding="async" fetchPriority={fetchPriority} width={source.dimensions[0]} height={source.dimensions[1]} onLoad={onLoad} onError={onError} /></picture>;
}

function useDialogFocus(open: boolean, dialogRef: React.RefObject<HTMLElement | null>, onClose: () => void, initialSelector: string | undefined, openerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const getFocusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.getClientRects().length > 0);
    const focusInitial = () => {
      const target = initialSelector ? dialog.querySelector<HTMLElement>(initialSelector) : null;
      (target ?? getFocusable()[0])?.focus();
    };
    const frame = window.requestAnimationFrame(focusInitial);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialog.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      dialog.removeEventListener("keydown", handleKeyDown);
      const opener = openerRef.current;
      if (opener?.isConnected && opener.getClientRects().length > 0) opener.focus();
      else document.querySelector<HTMLElement>(".site-header a, .site-header button")?.focus();
    };
  }, [dialogRef, initialSelector, onClose, open]);
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [location, navigate] = [useLocation()[0], useLocation()[1]];
  return (
    <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search DERVALLON">
      <div className="search-panel-inner">
        <div className="search-panel-heading">
          <span className="eyebrow">Search the house</span>
          <button className="icon-button" onClick={onClose} aria-label="Close search"><X size={19} /></button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onClose(); navigate(`/search?q=${encodeURIComponent(query)}`); }}>
          <label className="sr-only" htmlFor="site-search">Search the site</label>
          <div className="search-input-wrap">
            <Search size={19} aria-hidden="true" />
            <input id="site-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “navy”, “jacket”, or “studio”" />
            <button type="submit" className="text-button">Search <ArrowUpRight size={15} /></button>
          </div>
        </form>
        <p className="search-hint">Browse the collections, house pages, and the Design Studio.</p>
      </div>
    </div>
  );
}

export function Header() {
  const [location, navigate] = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuDialogRef = useRef<HTMLDivElement>(null);
  const searchDialogRef = useRef<HTMLDivElement>(null);
  const menuOpenerRef = useRef<HTMLElement | null>(null);
  const searchOpenerRef = useRef<HTMLElement | null>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openMenu = () => { menuOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setMenuOpen(true); };
  const openSearch = () => { searchOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setSearchOpen(true); };
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("drevallon-theme");
    return savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const isHome = location === "/";
  const darkHeader = darkMode || isHome || location.startsWith("/studio");
  useEffect(() => headerRef.current ? bindHeaderScroll(headerRef.current) : undefined, []);
  useEffect(() => { setMenuOpen(false); }, [location]);
  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, searchOpen]);
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);
  useEffect(() => {
    if (localStorage.getItem("drevallon-theme")) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => setDarkMode(event.matches);
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);
  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem("drevallon-theme", nextTheme ? "dark" : "light");
  };
  useDialogFocus(menuOpen, menuDialogRef, closeMenu, ".drawer-link", menuOpenerRef);
  useDialogFocus(searchOpen, searchDialogRef, closeSearch, "#site-search", searchOpenerRef);

  return (
    <>
      <header ref={headerRef} className={`site-header ${isHome ? "header-over-hero" : ""} ${darkHeader ? "header-dark" : ""}`}>
        <div className="header-inner">
          <button className="mobile-menu-button" onClick={openMenu} aria-label="Open menu" aria-expanded={menuOpen} aria-controls="site-menu"><Menu size={21} /></button>
          <nav className="desktop-primary-nav" aria-label="Primary navigation">
            {siteContent.nav.map((item) => <Link key={item.href} href={item.href} className={location === item.href ? "active" : ""} aria-current={location === item.href ? "page" : undefined}>{item.label}</Link>)}
          </nav>
          <div className="header-utilities">
            <button onClick={openSearch} className="utility-link" aria-label="Open search" aria-expanded={searchOpen} aria-controls="site-search-dialog"><Search size={16} /><span>Search</span></button>
            <Link href="/account" className="utility-link" aria-label="Account"><UserRound size={16} /><span>Account</span></Link>
            <button className="theme-toggle" onClick={toggleTheme} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={darkMode}>{darkMode ? <Sun size={16} /> : <Moon size={16} />}<span>{darkMode ? "Light" : "Dark"}</span></button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <div id="site-menu" ref={menuDialogRef} className={`menu-drawer ${darkMode ? "menu-drawer-dark" : ""}`} role="dialog" aria-modal="true" aria-label="Menu">
          <div className="menu-drawer-top"><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
          <div className="menu-drawer-body">
            <span className="eyebrow">Navigate</span>
            {siteContent.nav.map((item, index) => <Link key={item.href} href={item.href} className="drawer-link" style={{ "--delay": `${index * 30}ms` } as React.CSSProperties}>{item.label}<ChevronRight size={18} /></Link>)}
            <div className="drawer-rule" />
            <Link href="/search" className="drawer-utility"><Search size={17} />Search</Link>
            <Link href="/account" className="drawer-utility"><UserRound size={17} />Account</Link>
            <button className="drawer-utility drawer-theme-toggle" onClick={toggleTheme}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}{darkMode ? "Light mode" : "Dark mode"}</button>
          </div>
        </div>
      )}
      {searchOpen && <div id="site-search-dialog" ref={searchDialogRef}><SearchPanel onClose={closeSearch} /></div>}
    </>
  );
}

export function MobileBottomNav() {
  const [location] = useLocation();
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link href="/collections" className={location.startsWith("/collections") || location.startsWith("/category") ? "active" : ""} aria-current={location.startsWith("/collections") || location.startsWith("/category") ? "page" : undefined}><span className="bottom-nav-icon" aria-hidden="true">○</span><span>Collections</span></Link>
      <Link href="/studio" className={`studio-nav-item ${location.startsWith("/studio") ? "active" : ""}`} aria-current={location.startsWith("/studio") ? "page" : undefined}><span className="bottom-nav-icon" aria-hidden="true">✦</span><span>Design Studio</span></Link>
      <Link href="/account" className={location.startsWith("/account") ? "active" : ""} aria-current={location.startsWith("/account") ? "page" : undefined}><span className="bottom-nav-icon" aria-hidden="true">□</span><span>Account</span></Link>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top container">
        <div className="footer-signoff"><p>A considered presence.<br />Professional menswear / a new perspective.</p></div>
        <div className="footer-groups">
          {siteContent.footerGroups.map((group) => <details key={group.title} className="footer-group"><summary>{group.title}<ChevronDown size={16} /></summary><div>{group.links.map((link) => <Link key={link} href={link === "Design Studio" ? "/studio" : link === "About DERVALLON" ? "/about" : link === "Contact" ? "/contact" : link === "Delivery" ? "/delivery" : link === "Returns" ? "/returns" : link === "New Collections" ? "/collections" : link.startsWith("Suits") ? "/category/suits" : link.startsWith("Blazers") ? "/category/blazers" : link.startsWith("Shirts") ? "/category/shirts" : link.startsWith("Trousers") ? "/category/trousers" : link.startsWith("Jackets") ? "/category/jackets" : link.startsWith("Ties") ? "/category/ties" : "/information"}>{link}</Link>)}</div></details>)}
        </div>
      </div>
      <div className="footer-bottom container"><span>© 2026 DERVALLON.</span><span>Designed with restraint.</span><Link href="/contact">Start an Enquiry <ArrowUpRight size={14} /></Link></div>
    </footer>
  );
}

export function PageShell({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const mainRef = useRef<HTMLElement>(null);
  const [location] = useLocation();
  useEffect(() => mainRef.current ? bindScrollReveals(mainRef.current) : undefined, []);
  useEffect(() => {
    const page = pageMetadata(location);
    document.title = page.title;
    const canonicalUrl = `https://dervallon.com${location === "/" ? "/" : location}`;
    const upsertMeta = (selector: string, attribute: "name" | "property", value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, (() => { const match = selector.match(/\[name="([^"]+)"\]|\[property="([^"]+)"\]/); return match?.[1] ?? match?.[2] ?? ""; })());
        document.head.appendChild(element);
      }
      element.content = value;
    };
    upsertMeta('meta[name="description"]', "name", page.description);
    upsertMeta('meta[property="og:title"]', "property", page.title);
    upsertMeta('meta[property="og:description"]', "property", page.description);
    upsertMeta('meta[property="og:url"]', "property", canonicalUrl);
    upsertMeta('meta[name="twitter:title"]', "name", page.title);
    upsertMeta('meta[name="twitter:description"]', "name", page.description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [location]);
  return <div className={`site-page ${dark ? "dark-page" : ""}`}><a className="skip-link" href="#main-content">Skip to main content</a><Header /><main ref={mainRef} id="main-content" tabIndex={-1}>{children}</main><Footer /><MobileBottomNav /></div>;
}

function pageMetadata(location: string) {
  if (location === "/") return { title: "DERVALLON | Refined Menswear & Tailoring", description: "Discover DERVALLON, a considered approach to refined menswear, tailored silhouettes and personal expression." };
  if (location === "/collections") return { title: "Menswear Collections | DERVALLON", description: "Explore the DERVALLON collection of refined menswear, tailored silhouettes and considered wardrobe pieces." };
  if (location === "/studio" || location === "/custom-order") return { title: "Design Studio | DERVALLON", description: "Shape a considered garment direction through the DERVALLON Design Studio." };
  if (location === "/about") return { title: "Our Story | DERVALLON", description: "Discover the point of view behind DERVALLON refined menswear." };
  if (location === "/contact") return { title: "Contact DERVALLON | Client Enquiries", description: "Contact DERVALLON to explore a garment, a design direction, or a considered wardrobe." };
  if (location === "/delivery") return { title: "Delivery Information | DERVALLON", description: "Read DERVALLON delivery information and enquire about current fulfilment arrangements." };
  if (location === "/returns") return { title: "Returns Information | DERVALLON", description: "Read DERVALLON returns information and the details to confirm before ordering." };
  if (location === "/account/fit") return { title: "My DERVALLON Fit | DERVALLON", description: "Record and review your body measurements and fit preferences in your private DERVALLON account." };
  if (location === "/account/saved-designs") return { title: "Saved Designs | My DERVALLON", description: "Your saved DERVALLON design directions, kept privately in your account." };
  if (location === "/account/orders") return { title: "My Orders | My DERVALLON", description: "Your DERVALLON order history, kept privately in your account." };
  if (location === "/account/wardrobe") return { title: "My DERVALLON Wardrobe | My DERVALLON", description: "Your DERVALLON wardrobe records, kept privately in your account." };
  if (location === "/account") return { title: "My DERVALLON | Account", description: "Manage your DERVALLON fit profile, saved designs and personal wardrobe direction." };
  if (location.startsWith("/category/")) return { title: `${location.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} | DERVALLON`, description: "Explore a considered DERVALLON menswear category." };
  if (location.startsWith("/product/")) {
    const product = products.find((item) => item.id === location.split("/").pop());
    return { title: `${product?.name ?? "Product Details"} | DERVALLON`, description: product ? `${product.description} Enquire about fit, fabric and personalisation with DERVALLON.` : "Explore a DERVALLON garment and enquire about its fit, fabric and personalisation." };
  }
  return { title: "DERVALLON | Refined Menswear", description: "Refined menswear and considered wardrobe direction from DERVALLON." };
}

export function SectionLabel({ number, children, dark = false }: { number?: string; children: React.ReactNode; dark?: boolean }) {
  return <div className={`section-label ${dark ? "section-label-dark" : ""}`}><span>{number ?? "01"}</span><span>{children}</span><span className="section-label-line" /></div>;
}

export function EditorialImage({ src, alt, className = "", concept = true }: { src: string; alt: string; className?: string; concept?: boolean }) { return <figure className={`editorial-image ${className}`}><ResponsiveImage src={src} alt={alt} /><span className="image-badge">{concept ? "Editorial image" : "DERVALLON"}</span></figure>; }

export function ButtonLink({ href, children, variant = "dark", className = "" }: { href: string; children: React.ReactNode; variant?: "dark" | "light" | "line"; className?: string }) {
  return <Link href={href} className={`button-link button-${variant} ${className}`}>{children}<ArrowUpRight size={15} /></Link>;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={item.label}>{index > 0 && <ChevronRight size={14} />}{item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</span>)}</nav>;
}
