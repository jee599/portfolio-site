// Decorative SVG thumbnails for the old project grid. The redesigned
// Projects component no longer renders thumbnails (type-led grid instead),
// so this module is kept as a no-op shim. If the visual library is needed
// again, restore from git history.
export function ProjectThumb(_props: { kind: string; time?: number }) {
  return null;
}
