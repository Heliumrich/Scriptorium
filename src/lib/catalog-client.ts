import { PAGE_SIZE, matchesQuery } from "./catalog";
import { hydrateThumbs } from "./thumbs";
import { setLightboxGallery } from "./lightbox";

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
  basePath: string;
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function selectedTags() {
  return [...document.querySelectorAll<HTMLInputElement>(".tag-filter:checked")].map(
    (i) => i.value,
  );
}

export function initCatalog(opts: Options) {
  const grid = document.getElementById("catalog-grid");
  const empty = document.getElementById("catalog-empty");
  const pager = document.getElementById("catalog-pager");
  const status = document.getElementById("catalog-status");
  const search = document.getElementById("catalog-search") as HTMLInputElement | null;
  const toggle = document.getElementById("tag-toggle");
  const panel = document.getElementById("tag-panel");
  const countEl = document.getElementById("tag-count");
  if (!grid) return;

  let items: CatalogItem[] = [];
  let mode: "and" | "or" = "and";
  let page = 1;
  let timer = 0;

  const params = new URLSearchParams(location.search);
  if (search && params.get("q")) search.value = params.get("q") || "";
  const initialTags = (params.get("tags") || "").split(",").filter(Boolean);
  initialTags.forEach((tag) => {
    const input = document.querySelector<HTMLInputElement>(`.tag-filter[value="${CSS.escape(tag)}"]`);
    if (input) input.checked = true;
  });
  if (params.get("mode") === "or") mode = "or";
  page = Math.max(1, Number(params.get("p") || "1") || 1);

  function filtered() {
    const q = search?.value || "";
    const tags = selectedTags();
    return items.filter((item) => {
      if (!matchesQuery(item.haystack, q)) return false;
      if (!tags.length) return true;
      return mode === "or"
        ? tags.some((t) => item.tags.includes(t))
        : tags.every((t) => item.tags.includes(t));
    });
  }

  function syncUrl(list: CatalogItem[]) {
    const next = new URL(location.href);
    const q = search?.value.trim() || "";
    const tags = selectedTags();
    if (q) next.searchParams.set("q", q);
    else next.searchParams.delete("q");
    if (tags.length) next.searchParams.set("tags", tags.join(","));
    else next.searchParams.delete("tags");
    if (mode === "or" && tags.length) next.searchParams.set("mode", "or");
    else next.searchParams.delete("mode");
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (page > pages) page = pages;
    if (page > 1) next.searchParams.set("p", String(page));
    else next.searchParams.delete("p");
    history.replaceState(null, "", next);
  }

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (page > pages) page = pages;
    const slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    grid!.innerHTML = slice.map((item) => cardHtml(item, opts.kind)).join("");
    hydrateThumbs(grid!);
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
    const hasFilters = selectedTags().length > 0 || !!(search?.value.trim());
    empty?.classList.toggle("hidden", list.length !== 0);
    if (empty) {
      const label = opts.kind === "artist" ? "Aucune personnalité ne correspond." : "Aucune œuvre ne correspond.";
      empty.innerHTML = list.length
        ? ""
        : `${label}${hasFilters ? ' <button type="button" class="clear-all-filters underline">Effacer les filtres</button>' : ""}`;
    }
    if (status) {
      status.innerHTML = list.length
        ? `${list.length} résultat${list.length > 1 ? "s" : ""}${hasFilters ? ' <button type="button" class="clear-all-filters ml-3 underline">Effacer les filtres</button>' : ""}`
        : "";
    }
    const tags = selectedTags();
    if (countEl) {
      countEl.textContent = String(tags.length);
      countEl.classList.toggle("hidden", tags.length === 0);
    }
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      const active = (btn as HTMLElement).dataset.mode === mode;
      btn.classList.toggle("bg-bg-secondary", active);
      btn.classList.toggle("font-medium", active);
      btn.classList.toggle("text-muted", !active);
    });
    if (pager) {
      if (pages <= 1) pager.innerHTML = "";
      else {
        const buttons = Array.from({ length: pages }, (_, i) => {
          const n = i + 1;
          const current = n === page;
          return `<button type="button" data-page="${n}" class="min-w-9 rounded-md border border-border px-2.5 py-1.5 text-sm ${current ? "bg-bg-secondary font-medium" : "text-muted hover:text-fg"}">${n}</button>`;
        }).join("");
        pager.innerHTML = buttons;
      }
    }
    syncUrl(list);
  }

  toggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = !panel?.classList.contains("hidden");
    panel?.classList.toggle("hidden", open);
    toggle.setAttribute("aria-expanded", String(!open));
  });
  document.addEventListener("click", (e) => {
    if (!document.getElementById("tag-dropdown")?.contains(e.target as Node)) {
      panel?.classList.add("hidden");
      toggle?.setAttribute("aria-expanded", "false");
    }
  });
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = (btn as HTMLElement).dataset.mode === "or" ? "or" : "and";
      page = 1;
      render();
    });
  });
  document.querySelectorAll(".tag-filter").forEach((el) => {
    el.addEventListener("change", () => {
      page = 1;
      render();
    });
  });
  document.getElementById("tag-clear")?.addEventListener("click", () => {
    document.querySelectorAll<HTMLInputElement>(".tag-filter").forEach((i) => (i.checked = false));
    page = 1;
    render();
  });
  function clearAllFilters() {
    document.querySelectorAll<HTMLInputElement>(".tag-filter").forEach((i) => (i.checked = false));
    if (search) search.value = "";
    page = 1;
    render();
  }
  status?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest(".clear-all-filters")) clearAllFilters();
  });
  empty?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest(".clear-all-filters")) clearAllFilters();
  });
  search?.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      page = 1;
      render();
    }, 120);
  });
  pager?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-page]") as HTMLElement | null;
    if (!btn) return;
    page = Number(btn.dataset.page);
    render();
    grid?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  fetch(opts.jsonUrl)
    .then((r) => r.json())
    .then((data) => {
      items = data.items || [];
      render();
    })
    .catch(() => {
      /* garde le HTML pré-rendu */
    });
}
