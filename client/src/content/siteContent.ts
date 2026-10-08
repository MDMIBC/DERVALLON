import { conceptPhotos } from "./campaignMedia";

export type Product = {
  id: string;
  name: string;
  category: string;
  type: string;
  description: string;
  image: string;
  tags: string[];
  featured?: boolean;
  fabricName?: string;
  colour?: string;
  pattern?: string;
  season?: string;
  fitSummary?: string;
  occasion?: string;
  customisable?: boolean;
  supportingImages?: { src: string; alt: string }[];
};

export const siteContent = {
  brand: {
    name: "DERVALLON",
    eyebrow: "Professional menswear / a new perspective",
    heroHeadline: "A considered presence.",
    heroLine: "Tailoring and refined menswear for a purposeful wardrobe.",
    houseIntro:
      "DERVALLON is a new menswear brand shaped by a clear ambition: a wardrobe defined by proportion, restraint, and personal expression.",
    studioIntro:
      "Explore an intentional design process through a series of considered choices. Build a direction, keep the decisions that matter, and return to it when you are ready.",
    conceptNotice:
      "A considered edit shaped around proportion, presence, and personal expression.",
  },
  nav: [
    { label: "New Collections", href: "/collections" },
    { label: "Suits", href: "/category/suits" },
    { label: "Blazers", href: "/category/blazers" },
    { label: "Jackets", href: "/category/jackets" },
    { label: "Shirts", href: "/category/shirts" },
    { label: "Trousers", href: "/category/trousers" },
    { label: "Ties", href: "/category/ties" },
    { label: "Bespoke", href: "/studio" },
    { label: "About", href: "/about" },
  ],
  footerGroups: [
    {
      title: "Collections",
      links: ["New Collections", "Suits", "Blazers", "Jackets", "Shirts", "Trousers", "Ties"],
    },
    { title: "The House", links: ["About DERVALLON", "Design Studio"] },
    { title: "Client support", links: ["Contact", "Delivery", "Returns"] },
    { title: "Information", links: ["Information"] },
  ],
  services: {
    privateClient: { enabled: false, title: "Private Client", description: "A future concept for more personal conversations around wardrobe direction." },
    corporateWardrobe: { enabled: false, title: "Corporate Wardrobe", description: "A future concept for considered wardrobe conversations at team scale." },
  },
};

export const products: Product[] = [
  {
    id: "the-assembly-suit",
    name: "The Assembly Suit",
    category: "Suits",
    type: "Full suit",
    description: "A disciplined navy silhouette for days that ask for clarity.",
    image: conceptPhotos.suits.src,
    tags: ["navy", "structured", "editorial direction"],
    featured: true,
    customisable: true,
  },
  {
    id: "the-interval-jacket",
    name: "The Interval Jacket",
    category: "Blazers",
    type: "Blazer",
    description: "A single-breasted layer conceived around quiet contrast and movement.",
    image: conceptPhotos.blazers.src,
    tags: ["navy", "soft shoulder", "editorial direction"],
    featured: true,
  },
  {
    id: "the-quiet-shirt",
    name: "The Quiet Shirt",
    category: "Shirts",
    type: "Shirt",
    description: "A clean base note for the rest of the wardrobe.",
    image: conceptPhotos.shirts.src,
    tags: ["white", "clean line", "editorial direction"],
    featured: true,
  },
  {
    id: "the-cadence-trouser",
    name: "The Cadence Trouser",
    category: "Trousers",
    type: "Trouser",
    description: "A deliberate line from waist to shoe, made to hold its place in a wardrobe.",
    image: conceptPhotos.trousers.src,
    tags: ["navy", "straight leg", "editorial direction"],
  },
  {
    id: "the-ink-tie",
    name: "The Ink Tie",
    category: "Ties",
    type: "Tie",
    description: "A narrow register of depth for the moments that call for less noise.",
    image: conceptPhotos.ties.src,
    tags: ["patterned", "silk texture", "editorial direction"],
  },
  {
    id: "the-signature-polo",
    name: "The Signature Polo",
    category: "Shirts",
    type: "Refined polo",
    description: "A measured alternative to the shirt, considered for the modern working wardrobe.",
    image: conceptPhotos.polo.src,
    tags: ["navy", "refined", "editorial direction"],
  },
  {
    id: "the-passage-jacket",
    name: "The Passage Jacket",
    category: "Jackets",
    type: "Short jacket",
    description: "A compact outer layer studied for clear everyday lines.",
    image: conceptPhotos.jackets.src,
    tags: ["navy", "relaxed structure", "editorial direction"],
  },
];

export const studioOptions = {
  garment: [
    { id: "suit", label: "Full suit", note: "Jacket and trouser direction" },
    { id: "jacket", label: "Jacket", note: "Jacket-only direction" },
  ],
  silhouette: [
    { id: "precise", label: "Precise", note: "Closer line, clear shoulder" },
    { id: "relaxed", label: "Relaxed", note: "More room, softer posture" },
    { id: "balanced", label: "Balanced", note: "An even, considered proportion" },
  ],
  jacketDetail: [
    { id: "notch", label: "Notch lapel", note: "A familiar, disciplined line" },
    { id: "peak", label: "Peak lapel", note: "A sharper point of emphasis" },
    { id: "minimal", label: "Minimal detail", note: "Let the silhouette do the work" },
  ],
  trouserDetail: [
    { id: "clean", label: "Clean front", note: "A quiet uninterrupted line" },
    { id: "pleated", label: "Single pleat", note: "A considered note of ease" },
    { id: "tapered", label: "Soft taper", note: "A steady line towards the shoe" },
  ],
  profile: [
    { id: "later", label: "Attach later", note: "Continue without a profile" },
    { id: "without", label: "Continue without one", note: "Continue without measurements" },
  ],
} as const;

export const studioSteps = [
  { id: "garment", label: "Garment" },
  { id: "silhouette", label: "Silhouette" },
  { id: "jacketDetail", label: "Jacket detail" },
  { id: "trouserDetail", label: "Trouser detail" },
  { id: "notes", label: "Notes" },
  { id: "profile", label: "Profile" },
  { id: "review", label: "Review" },
] as const;

export type StudioState = {
  garment?: string;
  silhouette?: string;
  jacketDetail?: string;
  trouserDetail?: string;
  notes: string;
  profile?: string;
};

export const emptyStudioState: StudioState = { notes: "" };

export const findOptionLabel = (group: keyof typeof studioOptions, id?: string) => {
  const option = studioOptions[group].find((item) => item.id === id);
  return option?.label ?? "Not selected";
};
