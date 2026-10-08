/** Original concept visuals; owner approval required before launch. */
export const conceptPhotos = {
  suits: { src: "/manus-storage/concept-suits_a8cf7cd4.jpg", alt: "Concept image of a model wearing a coordinated navy suit and matching trousers beside stone architecture" },
  shirts: { src: "/manus-storage/concept-shirts_763ed0a6.jpg", alt: "Concept image of a white dress shirt worn without a jacket against a stone backdrop" },
  ties: { src: "/manus-storage/concept-ties_0599c11c.jpg", alt: "Concept still life showing six distinct patterned silk ties in navy, gold, burgundy, blue, brown and ivory" },
  trousers: { src: "/manus-storage/concept-trousers_6e42ee09.jpg", alt: "Concept image focusing on full-length pleated navy trousers from waistband to shoes" },
  blazers: { src: "/manus-storage/concept-blazers_b70ebf8a.jpg", alt: "Concept image of a stone tailored blazer worn separately with dark trousers" },
  jackets: { src: "/manus-storage/concept-jackets_15f6b0a2.jpg", alt: "Concept image of a navy short field jacket worn over a cream shirt" },
  polo: { src: "/manus-storage/concept-polo_34e899d3.jpg", alt: "Concept image of a model wearing a navy long-sleeve knitted polo shirt" },
  workroom: { src: "/manus-storage/concept-workroom_419f97af.jpg", alt: "Concept image of navy tailoring cloth, pattern paper and brass scissors on a workroom table" },
} as const;

export const conceptResponsiveSources: Record<string, { avif: string; webp: string; dimensions: [number, number] }> = {
  [conceptPhotos.suits.src]: {
    avif: "/manus-storage/concept-suits-640_6234a06a.avif 640w, /manus-storage/concept-suits-1280_16424b8e.avif 1280w",
    webp: "/manus-storage/concept-suits-640_c40a40af.webp 640w, /manus-storage/concept-suits-1280_92f5b615.webp 1280w",
    dimensions: [1536, 2304],
  },
  [conceptPhotos.shirts.src]: {
    avif: "/manus-storage/concept-shirts-640_bbafee53.avif 640w, /manus-storage/concept-shirts-1280_db8e16ce.avif 1280w",
    webp: "/manus-storage/concept-shirts-640_dc71f9f4.webp 640w, /manus-storage/concept-shirts-1280_f0dffef2.webp 1280w",
    dimensions: [1536, 2304],
  },
  [conceptPhotos.ties.src]: {
    avif: "/manus-storage/concept-ties-640_77f436c6.avif 640w, /manus-storage/concept-ties-1280_b12a9c62.avif 1280w",
    webp: "/manus-storage/concept-ties-640_62a3c848.webp 640w, /manus-storage/concept-ties-1280_13b3173b.webp 1280w",
    dimensions: [1536, 2304],
  },
  [conceptPhotos.trousers.src]: {
    avif: "/manus-storage/concept-trousers-640_5f2a743f.avif 640w, /manus-storage/concept-trousers-1280_cda411ee.avif 1280w",
    webp: "/manus-storage/concept-trousers-640_ffa3cd3b.webp 640w, /manus-storage/concept-trousers-1280_369aeee9.webp 1280w",
    dimensions: [1536, 2304],
  },
  [conceptPhotos.blazers.src]: {
    avif: "/manus-storage/concept-blazers-640_2f632126.avif 640w, /manus-storage/concept-blazers-1280_cc1ce022.avif 1280w",
    webp: "/manus-storage/concept-blazers-640_8c99b471.webp 640w, /manus-storage/concept-blazers-1280_5b484088.webp 1280w",
    dimensions: [1536, 2304],
  },
  [conceptPhotos.jackets.src]: {
    avif: "/manus-storage/concept-jackets-640_4ecd30ab.avif 640w, /manus-storage/concept-jackets-1280_8eaa20f9.avif 1280w",
    webp: "/manus-storage/concept-jackets-640_69d07dd8.webp 640w, /manus-storage/concept-jackets-1280_f5ea542a.webp 1280w",
    dimensions: [1536, 2304],
  },
  [conceptPhotos.polo.src]: {
    avif: "/manus-storage/concept-polo-640_80c9073e.avif 640w, /manus-storage/concept-polo-1280_4d0d2eff.avif 1280w",
    webp: "/manus-storage/concept-polo-640_ab7e4674.webp 640w, /manus-storage/concept-polo-1280_6926780a.webp 1280w",
    dimensions: [1536, 2304],
  },
  [conceptPhotos.workroom.src]: {
    avif: "/manus-storage/concept-workroom-640_9525837f.avif 640w, /manus-storage/concept-workroom-1280_ca8201cd.avif 1280w",
    webp: "/manus-storage/concept-workroom-640_13b66ebf.webp 640w, /manus-storage/concept-workroom-1280_2a11288a.webp 1280w",
    dimensions: [2304, 1536],
  },
};
