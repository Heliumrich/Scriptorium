# Scriptorium
### Website for Catholics
- Text comparator (with french translations not available on any comparator website)
- Art gallery with presentation for each artist and people being depicted (Directus database is being populated, will be pushed later)

Future additions :
- Playlists by genre (Gregorian chants, Orthodox chants, classical music, ...)
- EPUB library
- Prayers memento
- Liturgic year calender
- List of resources
- and many more

### How to run
- Get the database for the comparator [here](https://github.com/Heliumrich/FR-Bibles_JSON/releases/tag/DB/latest)
  (there are scripts to add your own, but you will need to structure the translations into that JSON format. If you have an epub, get the files inside and ask an LLM to make a tailored script for it)
- WIP: Install Directus and import the schema, then point to it from the .env file (rename .env.example to .env and modify it)

### Stack used
- **Frontend:** Astro (content-first) with Svelte islands for interactive parts (Bible comparator)
- **Styling:** Tailwind CSS v4
- **CMS / media:** Directus + PostgreSQL (artists, artworks, image uploads & WebP transforms)
- **Bible data:** SQLite (read-only multi-translation verse database)
- **API:** Astro server endpoints (prerender = false) for verse lookup & navigation
- **Runtime / deploy:** Node (planned @astrojs/node adapter) on a small Linux VPS; Directus via Docker
- **Tooling:** Python scripts (BeautifulSoup) for EPUB/XHTML → JSON → SQLite import (tailored for each epub converted, not shared because it was made for each epub and is not reusable as each as a specific html structure that need to be parsed to handle verses and chapters correctly)
