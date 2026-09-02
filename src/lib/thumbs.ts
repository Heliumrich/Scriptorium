export function markThumbLoaded(img: HTMLImageElement) {
  const slot = img.closest(".thumb-slot");
  if (!slot) return;
  if (img.naturalWidth > 0) slot.classList.add("is-loaded");
}

export function hydrateThumbs(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>(".thumb-slot img").forEach((img) => {
    if (img.complete) markThumbLoaded(img);
    else img.addEventListener("load", () => markThumbLoaded(img), { once: true });
    img.addEventListener("error", () => img.closest(".thumb-slot")?.classList.add("is-loaded"), {
      once: true,
    });
  });
}
