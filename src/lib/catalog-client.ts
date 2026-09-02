import { PAGE_SIZE } from "./catalog";
import { hydrateThumbs } from "./thumbs";
import { setLightboxGallery } from "./lightbox";
import {
  bindCatalogChrome,
  escapeHtml,
  filterCatalog,
  markActiveButtons,
  readFilterParams,
  renderPager,
  selectedTags,
  uncheckTags,
  updateFilterStatus,
  writeFilterParams,
  type FilterMode,
} from "./catalog-ui";

export type CatalogItem = {
  slug: string;
  href: string;
  title: string;
  subtitle?: string | null;
  year?: string | number | null;
  artist?: string | null;
  thumb: string | null;
  medium?: string | null;
  large?: string | null;
  xlarge?: string | null;
  original?: string | null;
  tags: string[];
  haystack: string;
};

type Options = {
  jsonUrl: string;
  kind: "artwork" | "artist";
};

function lbAttrs(item: CatalogItem) {
  return `data-lightbox data-alt="${escapeHtml(item.title)}" data-href="${escapeHtml(item.href)}" data-medium="${item.medium || ""}" data-large="${item.large || ""}" data-xlarge="${item.xlarge || ""}" data-original="${item.original || ""}"`;
}

function cardHtml(item: CatalogItem, kind: "artwork" | "artist") {
  const meta =
    kind === "artwork"
      ? [item.artist, item.year].filter(Boolean).join(" · ")
      : item.subtitle || "";
  const img = item.thumb
    ? `<img src="${item.thumb}" alt="${escapeHtml(item.title)}" class="thumb-img" loading="lazy" decoding="async" fetchpriority="low" width="400" height="400" ${kind === "artwork" ? lbAttrs(item) : ""} />`
    : `<span class="relative z-10 grid h-full place-items-center text-sm text-muted">Pas d’image</span>`;
  return `<article class="group">
    <div class="thumb-slot">
      <span class="thumb-ph" aria-hidden="true"><img src="/fleur-de-lys.svg" alt="" width="40" height="40" class="size-10 opacity-40" /></span>
      ${img}
    </div>
    <h2 class="mt-3 font-display text-lg"><a href="${item.href}" class="group-hover:underline">${escapeHtml(item.title)}</a></h2>
    ${meta ? `<p class="text-sm text-muted line-clamp-2">${escapeHtml(String(meta))}</p>` : ""}
  </article>`;
}

export function initCatalog(opts: Options) {
  const grid = document.getElementById("catalog-grid");
  const empty = document.getElementById("catalog-empty");
  const pager = document.getElementById("catalog-pager");
  const status = document.getElementById("catalog-status");
  const search = document.getElementById("catalog-search") as HTMLInputElement | null;
  if (!grid) return;

  let items: CatalogItem[] = [];
  const initial = readFilterParams(search);
  let mode: FilterMode = initial.mode;
  let page = initial.page;

  function render() {
    const list = filterCatalog(items, search?.value || "", selectedTags(), mode);
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (page > pages) page = pages;
    const slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const keepSsr =
      grid.dataset.ssr === "1" &&
      page === 1 &&
      !search?.value.trim() &&
      selectedTags().length === 0;
    if (!keepSsr) {
      grid.removeAttribute("data-ssr");
      grid.innerHTML = slice.map((item) => cardHtml(item, opts.kind)).join("");
    }
    hydrateThumbs(grid);
    if (opts.kind === "artwork") {
      setLightboxGallery(
        list.map((item) => ({
          alt: item.title,
          href: item.href,
          medium: item.medium,
          large: item.large,
          xlarge: item.xlarge,
          original: item.original,
        })),
      );
    }
    const noun = list.length > 1 ? "résultats" : "résultat";
    updateFilterStatus(
      status,
      empty,
      list.length,
      opts.kind === "artist" ? "Aucune personnalité ne correspond." : "Aucune œuvre ne correspond.",
      `${list.length} ${noun}`,
    );
    markActiveButtons(".mode-btn", "mode", mode);
    renderPager(pager, pages, page);
    writeFilterParams({ search, mode, page });
  }

  bindCatalogChrome({
    search,
    pager,
    status,
    empty,
    onResetPage() {
      page = 1;
      render();
    },
    onPage(next) {
      page = next;
      render();
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    onMode(next) {
      mode = next;
      page = 1;
      render();
    },
    onClearAll() {
      uncheckTags();
      if (search) search.value = "";
      page = 1;
      render();
    },
  });

  fetch(opts.jsonUrl)
    .then((res) => res.json())
    .then((data) => {
      items = data.items || [];
      render();
    })
    .catch(() => {});
}
