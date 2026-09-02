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
  type CatalogView,
  type FilterMode,
} from "./catalog-ui";

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

const PAGE_SIZE = 20;

function cardHtml(item: Item, view: CatalogView) {
  const tags = item.tags
    .map(
      (tag) =>
        `<button type="button" class="prayer-tag tag-pill" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`,
    )
    .join("");
  const body = view === "list" ? item.description : item.lead;
  return `<article class="panel catalog-item rounded-xl p-5 sm:p-6">
    <a href="${item.href}" class="block">
      <h2 class="font-display text-2xl hover:underline">${escapeHtml(item.title)}</h2>
      ${item.titleLatin ? `<p class="mt-1 italic text-muted">${escapeHtml(item.titleLatin)}</p>` : ""}
    </a>
    ${body ? `<p class="mt-3 text-sm text-muted ${view === "list" ? "whitespace-pre-line" : ""}">${escapeHtml(body)}</p>` : ""}
    ${tags ? `<div class="mt-4 flex flex-wrap gap-1.5">${tags}</div>` : ""}
  </article>`;
}

export function initPrayerList(jsonUrl: string) {
  const grid = document.getElementById("catalog-grid");
  const empty = document.getElementById("catalog-empty");
  const pager = document.getElementById("catalog-pager");
  const status = document.getElementById("catalog-status");
  const search = document.getElementById("catalog-search") as HTMLInputElement | null;
  if (!grid) return;

  let items: Item[] = [];
  const initial = readFilterParams(search);
  let mode: FilterMode = initial.mode;
  let view: CatalogView = initial.view;
  let page = initial.page;

  function render() {
    const list = filterCatalog(items, search?.value || "", selectedTags(), mode);
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (page > pages) page = pages;
    grid.innerHTML = list
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      .map((item) => cardHtml(item, view))
      .join("");
    grid.classList.toggle("md:grid-cols-2", view === "grid");
    grid.classList.toggle("grid", view === "grid");
    grid.classList.toggle("flex", view === "list");
    grid.classList.toggle("flex-col", view === "list");
    markActiveButtons(".view-btn", "view", view);
    markActiveButtons(".mode-btn", "mode", mode);
    const noun = list.length > 1 ? "prières" : "prière";
    updateFilterStatus(status, empty, list.length, "Aucune prière ne correspond.", `${list.length} ${noun}`);
    renderPager(pager, pages, page);
    writeFilterParams({
      search,
      mode,
      page,
      extra: { view: view === "list" ? "list" : null },
    });
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
    onView(next) {
      view = next;
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

  grid.addEventListener("click", (event) => {
    const tagBtn = (event.target as HTMLElement).closest(".prayer-tag") as HTMLElement | null;
    if (!tagBtn) return;
    event.preventDefault();
    const input = document.querySelector<HTMLInputElement>(
      `.tag-filter[value="${CSS.escape(tagBtn.dataset.tag || "")}"]`,
    );
    if (!input) return;
    input.checked = true;
    page = 1;
    render();
  });

  fetch(jsonUrl)
    .then((res) => res.json())
    .then((data) => {
      items = data.items || [];
      render();
    })
    .catch(() => {});
}
