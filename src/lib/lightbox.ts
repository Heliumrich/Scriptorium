import { pickAssetSrc } from "./asset-tier";

export type LightboxItem = {
  alt: string;
  href?: string | null;
  medium?: string | null;
  large?: string | null;
  xlarge?: string | null;
  original?: string | null;
};

let gallery: LightboxItem[] = [];
let index = 0;
let bound = false;

function itemSrc(item: LightboxItem) {
  return pickAssetSrc({
    dataset: {
      medium: item.medium || "",
      large: item.large || "",
      xlarge: item.xlarge || "",
      original: item.original || "",
    },
  });
}

function fromEl(el: HTMLElement): LightboxItem {
  return {
    alt: el.getAttribute("data-alt") || el.getAttribute("alt") || "",
    href: el.dataset.href || "",
    medium: el.dataset.medium,
    large: el.dataset.large,
    xlarge: el.dataset.xlarge,
    original: el.dataset.original,
  };
}

export function setLightboxGallery(items: LightboxItem[]) {
  gallery = items.filter((i) => i.large || i.medium || i.original);
}

function ensureLightbox() {
  let root = document.getElementById("lightbox");
  if (root) return root;
  root = document.createElement("div");
  root.id = "lightbox";
  root.className = "lightbox";
  root.hidden = true;
  root.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Fermer">×</button>
    <button type="button" class="lightbox-prev" aria-label="Œuvre précédente">‹</button>
    <img class="lightbox-img" alt="" />
    <button type="button" class="lightbox-next" aria-label="Œuvre suivante">›</button>
    <p class="lightbox-cap"><a class="lightbox-cap-link" href="#"></a></p>
  `;
  document.body.appendChild(root);
  root.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest(".lightbox-cap-link")) return;
    if (t === root || t.classList.contains("lightbox-close")) closeLightbox();
    if (t.classList.contains("lightbox-prev")) step(-1);
    if (t.classList.contains("lightbox-next")) step(1);
  });
  return root;
}

function show() {
  const item = gallery[index];
  const root = ensureLightbox();
  if (!item) return;
  const img = root.querySelector<HTMLImageElement>(".lightbox-img");
  const cap = root.querySelector<HTMLElement>(".lightbox-cap");
  const prev = root.querySelector<HTMLElement>(".lightbox-prev");
  const next = root.querySelector<HTMLElement>(".lightbox-next");
  if (img) {
    img.src = itemSrc(item);
    img.alt = item.alt;
  }
  const link = root.querySelector<HTMLAnchorElement>(".lightbox-cap-link");
  if (link) {
    link.textContent = item.alt;
    if (item.href) {
      link.href = item.href;
      link.classList.add("is-link");
    } else {
      link.removeAttribute("href");
      link.classList.remove("is-link");
    }
  } else if (cap) {
    cap.textContent = item.alt;
  }
  const many = gallery.length > 1;
  prev?.classList.toggle("hidden", !many);
  next?.classList.toggle("hidden", !many);
  root.hidden = false;
  document.body.style.overflow = "hidden";
}

export function openLightbox(el: HTMLElement) {
  if (!gallery.length) {
    gallery = [...document.querySelectorAll<HTMLElement>("[data-lightbox]")].map(fromEl);
  }
  const key = el.dataset.original || el.dataset.large || el.getAttribute("data-alt");
  const found = gallery.findIndex(
    (item) =>
      item.original === el.dataset.original ||
      item.large === el.dataset.large ||
      item.alt === el.getAttribute("data-alt"),
  );
  index = found >= 0 ? found : 0;
  if (found < 0 && key) {
    gallery = [fromEl(el), ...gallery];
    index = 0;
  }
  show();
}

function step(delta: number) {
  if (gallery.length < 2) return;
  index = (index + delta + gallery.length) % gallery.length;
  show();
}

export function closeLightbox() {
  const root = document.getElementById("lightbox");
  if (!root) return;
  root.hidden = true;
  const img = root.querySelector<HTMLImageElement>(".lightbox-img");
  if (img) img.src = "";
  document.body.style.overflow = "";
}

export function initLightbox() {
  ensureLightbox();
  if (bound) return;
  bound = true;
  document.addEventListener("keydown", (e) => {
    const root = document.getElementById("lightbox");
    if (!root || root.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  document.addEventListener("click", (e) => {
    const trigger = (e.target as HTMLElement).closest<HTMLElement>("[data-lightbox]");
    if (!trigger) return;
    e.preventDefault();
    openLightbox(trigger);
  });
}
