import { matchesQuery } from "./catalog";

type Item = {
  slug: string;
  href: string;
  title: string;
  titleLatin: string;
  description: string;
  lead: string;
  tags: string[];
  haystack: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cardHtml(item: Item, view: "grid" | "list") {
  const tags = item.tags
    .map(
      (tag) =>
        `<button type="button" class="prayer-tag tag-pill" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`,
    )
    .join("");
  const body =
    view === "list"
      ? item.description
      : item.lead;
  return `<article class="panel catalog-item rounded-xl p-5 sm:p-6" data-tags="${escapeHtml(item.tags.join(","))}">
    <a href="${item.href}" class="block">
      <h2 class="font-display text-2xl hover:underline">${escapeHtml(item.title)}</h2>
      ${item.titleLatin ? `<p class="mt-1 italic text-muted">${escapeHtml(item.titleLatin)}</p>` : ""}
    </a>
    ${body ? `<p class="mt-3 text-sm text-muted ${view === "list" ? "whitespace-pre-line" : ""}">${escapeHtml(body)}</p>` : ""}
    ${tags ? `<div class="mt-4 flex flex-wrap gap-1.5">${tags}</div>` : ""}
  </article>`;
}

function selectedTags() {
  return [...document.querySelectorAll<HTMLInputElement>(".tag-filter:checked")].map(
    (i) => i.value,
  );
}

export function initPrayerList(jsonUrl: string) {
  const grid = document.getElementById("catalog-grid");
  const empty = document.getElementById("catalog-empty");
  const pager = document.getElementById("catalog-pager");
  const status = document.getElementById("catalog-status");
  const search = document.getElementById("catalog-search") as HTMLInputElement | null;
  const toggle = document.getElementById("tag-toggle");
  const panel = document.getElementById("tag-panel");
  const countEl = document.getElementById("tag-count");
  if (!grid) return;

  let items: Item[] = [];
  let mode: "and" | "or" = "and";
  let view: "grid" | "list" = "grid";
  let page = 1;
  let timer = 0;
  const size = 20;

  const params = new URLSearchParams(location.search);
  if (search && params.get("q")) search.value = params.get("q") || "";
  const initialTags = (params.get("tags") || "").split(",").filter(Boolean);
  initialTags.forEach((tag) => {
    const input = document.querySelector<HTMLInputElement>(
      `.tag-filter[value="${CSS.escape(tag)}"]`,
    );
    if (input) input.checked = true;
  });
  if (params.get("mode") === "or") mode = "or";
  if (params.get("view") === "list") view = "list";
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

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / size));
    if (page > pages) page = pages;
    const slice = list.slice((page - 1) * size, page * size);
    grid!.innerHTML = slice.map((item) => cardHtml(item, view)).join("");
    grid!.classList.toggle("md:grid-cols-2", view === "grid");
    grid!.classList.toggle("grid", view === "grid");
    grid!.classList.toggle("flex", view === "list");
    grid!.classList.toggle("flex-col", view === "list");
    document.querySelectorAll(".view-btn").forEach((btn) => {
      const active = (btn as HTMLElement).dataset.view === view;
      btn.classList.toggle("bg-bg-secondary", active);
      btn.classList.toggle("font-medium", active);
      btn.classList.toggle("text-muted", !active);
    });
    const hasFilters = selectedTags().length > 0 || !!(search?.value.trim());
    empty?.classList.toggle("hidden", list.length !== 0);
    if (empty) {
      empty.innerHTML = list.length
        ? ""
        : `Aucune prière ne correspond.${hasFilters ? ' <button type="button" class="clear-all-filters underline">Effacer les filtres</button>' : ""}`;
    }
    if (status) {
      status.innerHTML = list.length
        ? `${list.length} prière${list.length > 1 ? "s" : ""}${hasFilters ? ' <button type="button" class="clear-all-filters ml-3 underline">Effacer les filtres</button>' : ""}`
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
      pager.innerHTML =
        pages <= 1
          ? ""
          : Array.from({ length: pages }, (_, i) => {
              const n = i + 1;
              return `<button type="button" data-page="${n}" class="min-w-9 rounded-md border border-border px-2.5 py-1.5 text-sm ${n === page ? "bg-bg-secondary font-medium" : "text-muted hover:text-fg"}">${n}</button>`;
            }).join("");
    }
    const next = new URL(location.href);
    const q = search?.value.trim() || "";
    if (q) next.searchParams.set("q", q);
    else next.searchParams.delete("q");
    if (tags.length) next.searchParams.set("tags", tags.join(","));
    else next.searchParams.delete("tags");
    if (mode === "or" && tags.length) next.searchParams.set("mode", "or");
    else next.searchParams.delete("mode");
    if (page > 1) next.searchParams.set("p", String(page));
    else next.searchParams.delete("p");
    if (view === "list") next.searchParams.set("view", "list");
    else next.searchParams.delete("view");
    history.replaceState(null, "", next);
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
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      view = (btn as HTMLElement).dataset.view === "list" ? "list" : "grid";
      page = 1;
      render();
    });
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
  grid.addEventListener("click", (e) => {
    const tagBtn = (e.target as HTMLElement).closest(".prayer-tag") as HTMLElement | null;
    if (!tagBtn) return;
    e.preventDefault();
    const tag = tagBtn.dataset.tag;
    const input = document.querySelector<HTMLInputElement>(
      `.tag-filter[value="${CSS.escape(tag || "")}"]`,
    );
    if (input) {
      input.checked = true;
      page = 1;
      render();
    }
  });

  fetch(jsonUrl)
    .then((r) => r.json())
    .then((data) => {
      items = data.items || [];
      render();
    })
    .catch(() => {});
}
