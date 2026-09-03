# Literae

Atelier catholique francophone. Comparer des traductions de la Bible trop peu présentes ailleurs, feuilleter une galerie d’art sacré, prier, suivre l’année liturgique.

*Tolle, lege — prends et lis.*

## Fonctions

- **Comparateur de traductions** — Crampon, Fillion, Sacy, Segond, Ostervald, Vulgate, etc. Colonnes côte à côte, survol synchronisé des versets, navigation livre / chapitre (îlot Svelte).
- **Galerie** — artistes, saints et œuvres depuis Directus (`https://api.literae.ch`). Notices, personnes représentées, images (clés Directus `thumbnail` / `medium` / `large` / `xlarge`), filtres d’étiquettes (ET / OU) via paramètres GET.
- **Prières** — placeholder (mémento local à venir).
- **Calendrier liturgique** — couleur du jour, temps, solennités (calcul local).
- **Thèmes** — Clair, Sombre, OLED, **Royauté française** (lys sur bleu de France), **Saint Augustin** (parchemin grainé, Cinzel). Thème par défaut : Saint Augustin.

## Stack

| Couche | Choix |
|---|---|
| Frontend | Astro 7 (content-first) + Svelte 5 islands (comparateur) |
| Style | Tailwind CSS v4, tokens CSS (`data-theme`), typographie Google Fonts |
| CMS / images | Directus public `https://api.literae.ch` — collections `artists`, `artworks` |
| Bible | SQLite lecture seule (`data/bible.db`, schéma [FR-Bibles_JSON](https://github.com/Heliumrich/FR-Bibles_JSON)) |
| API | Astro server endpoints (`prerender = false`) pour versets & navigation |

## UI / layout

- Header sticky : logo lys + Literae, nav (Scriptorium en menu), **Qualité max**, sélecteur de thème, menu mobile
- Footer : lys, phrase d’atelier, liens
- Rythme de page : label uppercase tracking large → titre `font-display` → `OrnamentRule` → texte serif
- Cartes `.panel`, grilles max-width `6xl` (comparateur `1600px`)
- Accueil : verset du jour, temps liturgique, pupitres ; lys en filigrane dès `lg`

## Lancer

```bash
# Placez data/bible.db (release DB/latest de FR-Bibles_JSON)
cp .env.example .env   # optionnel — DIRECTUS_URL
npm install
npm run dev
```

Build : `npm run build`.

## Directus

Par défaut : `https://api.literae.ch` (surcharge via `DIRECTUS_URL`).

- `artists` — `slug`, `name`, `name_latin`, `photo`, `type`, `birth_year`, `death_year`, `short_description`, `biography`, `tags`, `status=published`
- `artworks` — `slug`, titres, `year`, `image`, `artist`, `depicted`, `technique`, `dimensions`, `location`, `description`, `tags`, `date_created`, `status=published`

Assets : `/assets/{id}?key=thumbnail|medium|large|xlarge`. **Qualité max** sert le fichier original.

## Routes

| Chemin | Page |
|---|---|
| `/` | Accueil |
| `/scriptorium` | Hub Scriptorium |
| `/scriptorium/comparateur` | Comparateur |
| `/scriptorium/bibliotheque` | Bibliothèque (placeholder) |
| `/art` | Hub galerie + derniers ajouts |
| `/art/personalites` | Liste artistes (`?tags=` `&mode=or` `&view=list`) |
| `/art/personalites/[slug]` | Fiche artiste |
| `/art/oeuvres` | Liste œuvres |
| `/art/oeuvres/[slug]` | Fiche œuvre |
| `/prieres` | Placeholder |
| `/calendrier` | Jour liturgique |
| `/a-propos` | Colophon |
