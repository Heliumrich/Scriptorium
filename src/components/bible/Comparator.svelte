<script lang="ts">
  import { onMount } from 'svelte';
  import { formatRefLabel } from '../../lib/bible-ref';

  type Translation = { id: number; code: string; name_short: string };
  type Verse = { verse: number; text: string };
  type Column = { code: string; name: string; verses: Verse[] };

  let translations: Translation[] = [];
  let ref = 'Jean 3:16';
  let numCols = 2;
  let selectedIds: number[] = [];
  let align = true;
  let loading = false;
  let error = '';
  let columns: Column[] = [];
  let current = { book: '', chapter: 0, verse: null as number | null, verseEnd: null as number | null };
  let nav = { prev: null as any, next: null as any };
  let ready = false; // ← empêche les appels trop tôt

  onMount(async () => {
    const saved = localStorage.getItem('bible-comparator');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        ref = data.ref ?? ref;
        numCols = data.numCols ?? 2;
        selectedIds = data.selectedIds ?? [];
        align = data.align ?? true;
      } catch {}
    }

    const res = await fetch('/api/bible/translations');
    translations = await res.json();

    if (selectedIds.length === 0 && translations.length > 0) {
      selectedIds = translations.slice(0, numCols).map(t => t.id);
    } else {
      // S'assurer qu'on a le bon nombre d'IDs
      selectedIds = selectedIds.slice(0, numCols);
      while (selectedIds.length < numCols) {
        selectedIds.push(translations[0]?.id);
      }
    }

    ready = true;
    await load();
  });

  function savePrefs() {
    if (!ready) return;
    localStorage.setItem('bible-comparator', JSON.stringify({
      ref, numCols, selectedIds, align
    }));
  }

  function setNumCols(value: number) {
    numCols = value;
    while (selectedIds.length < numCols) {
      const next = translations.find(t => !selectedIds.includes(t.id));
      selectedIds.push(next ? next.id : translations[0]?.id);
    }
    selectedIds = selectedIds.slice(0, numCols);
    savePrefs();
    load();
  }

  function setTranslation(index: number, id: number) {
    selectedIds[index] = id;
    selectedIds = [...selectedIds]; // trigger réactif propre
    savePrefs();
    load();
  }

  async function load() {
    if (!ready || !ref.trim()) return;
    loading = true;
    error = '';
    savePrefs();

    try {
      const parseRes = await fetch(`/api/bible/parse?ref=${encodeURIComponent(ref)}`);
      const parsed = await parseRes.json();

      if (!parsed.book || !parsed.chapter) {
        error = 'Référence non reconnue';
        columns = [];
        return;
      }

      const params = new URLSearchParams({
        book: parsed.book,
        chapter: String(parsed.chapter)
      });
      if (parsed.verse) params.set('verse', String(parsed.verse));
      if (parsed.verseEnd) params.set('verseEnd', String(parsed.verseEnd));
      selectedIds.forEach(id => params.append('t', String(id)));

      const res = await fetch(`/api/bible/verses?${params}`);
      const data = await res.json();

      columns = data.results;
      current = {
        book: data.book,
        chapter: data.chapter,
        verse: data.verse || null,
        verseEnd: data.verseEnd || parsed.verseEnd || null,
      };

      const navParams = new URLSearchParams({
        book: current.book,
        chapter: String(current.chapter)
      });
      if (current.verse && !current.verseEnd) navParams.set('verse', String(current.verse));
      const navRes = await fetch(`/api/bible/navigation?${navParams}`);
      nav = await navRes.json();

      if (align) {
        requestAnimationFrame(() => alignHeights());
      }
    } catch (e) {
      error = 'Erreur de chargement';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function alignHeights() {
    const allNums = new Set<number>();
    columns.forEach(c => c.verses.forEach(v => allNums.add(v.verse)));
    allNums.forEach(num => {
      const els = document.querySelectorAll(`[data-verse="${num}"]`);
      let max = 0;
      els.forEach(el => {
        (el as HTMLElement).style.minHeight = 'auto';
        max = Math.max(max, (el as HTMLElement).offsetHeight);
      });
      els.forEach(el => {
        (el as HTMLElement).style.minHeight = max + 'px';
      });
    });
  }

  async function navigate(dir: 'prev' | 'next') {
    const target = nav[dir];
    if (!target) return;
    ref = target.book + ' ' + target.chapter + (target.verse ? ':' + target.verse : '');
    await load();
  }

  function onHover(verse: number, enter: boolean) {
    document.querySelectorAll(`[data-verse="${verse}"]`).forEach(el => {
      el.classList.toggle('highlight', enter);
    });
  }
</script>

<div class="space-y-6">
  <!-- Contrôles -->
  <div class="flex flex-wrap items-end gap-4">
    <div>
      <label class="block text-xs text-[var(--text-muted)] mb-1">Référence</label>
      <input
        type="text"
        bind:value={ref}
        on:keydown={(e) => e.key === 'Enter' && load()}
        class="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] w-56"
        placeholder="Ps 34:1-4"
      />
    </div>

	<div>
	  <label class="block text-xs text-[var(--text-muted)] mb-1">Colonnes</label>
	  <select
		value={numCols}
		on:change={(e) => setNumCols(Number(e.currentTarget.value))}
		class="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)]"
	  >
		<option value={1}>1</option>
		<option value={2}>2</option>
		<option value={3}>3</option>
		<option value={4}>4</option>
	  </select>
	</div>

	{#each Array(numCols) as _, i}
	  <div>
		<label class="block text-xs text-[var(--text-muted)] mb-1">Traduction {i + 1}</label>
		<select
		  value={selectedIds[i]}
		  on:change={(e) => setTranslation(i, Number(e.currentTarget.value))}
		  class="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)]"
		>
		  {#each translations as t}
			<option value={t.id}>{t.code} – {t.name_short}</option>
		  {/each}
		</select>
	  </div>
	{/each}

    <label class="flex items-center gap-2 text-sm cursor-pointer pb-2">
      <input type="checkbox" bind:checked={align} on:change={() => { savePrefs(); if (align) requestAnimationFrame(alignHeights); }} />
      Aligner
    </label>

    <button
      on:click={load}
      class="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium hover:opacity-90"
    >
      Comparer
    </button>

    <div class="ml-auto flex h-9 w-9 shrink-0 items-center justify-center" aria-live="polite">
      <span class="cmp-spinner" class:cmp-spinner-on={loading} aria-hidden={!loading}></span>
      <span class="sr-only">{loading ? 'Chargement' : ''}</span>
    </div>
  </div>

  <!-- Navigation -->
  <div class="flex items-center justify-between gap-3">
    <button
      on:click={() => navigate('prev')}
      disabled={!nav.prev}
      class="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] disabled:opacity-40 shrink-0"
    >
      ← Précédent
    </button>
    {#if current.book}
      <h2 class="min-w-0 flex-1 text-center font-display text-xl sm:text-2xl">
        {formatRefLabel(current)}
      </h2>
    {/if}
    <button
      on:click={() => navigate('next')}
      disabled={!nav.next}
      class="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] disabled:opacity-40 shrink-0"
    >
      Suivant →
    </button>
  </div>

  {#if error}
    <p class="text-red-500">{error}</p>
  {/if}

  <!-- Résultats -->
  {#if columns.length > 0}
    <div
      class="grid gap-4"
      style="grid-template-columns: repeat({columns.length}, 1fr)"
    >
      {#each columns as col}
        <div class="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div class="px-4 py-2.5 border-b border-[var(--border)] font-medium text-sm">
            {col.code} – {col.name}
          </div>
          <div>
            {#each col.verses as v}
              <div
                class="verse grid grid-cols-[2.2rem_1fr] gap-2 px-3 py-2 border-b border-[var(--border)] last:border-0"
                data-verse={v.verse}
                on:mouseenter={() => onHover(v.verse, true)}
                on:mouseleave={() => onHover(v.verse, false)}
                role="presentation"
              >
                <div class="text-xs text-[var(--text-muted)] text-right pt-0.5 select-none">{v.verse}</div>
                <div class="text-[0.95rem] leading-relaxed">{v.text}</div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .verse {
    transition: background 0.12s;
  }
  .verse.highlight {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .cmp-spinner {
    width: 1.35rem;
    height: 1.35rem;
    border-radius: 999px;
    border: 2px solid color-mix(in oklab, var(--text) 22%, transparent);
    border-top-color: var(--gold);
    opacity: 0;
    transform: scale(0.92);
    transition: opacity 0.22s ease, transform 0.22s ease;
    pointer-events: none;
  }
  .cmp-spinner-on {
    opacity: 1;
    transform: scale(1);
    animation: cmp-spin 0.7s linear infinite;
  }
  @keyframes cmp-spin {
    to { transform: rotate(360deg); }
  }
</style>