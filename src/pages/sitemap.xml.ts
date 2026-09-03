import type { APIRoute } from "astro";
import { fetchFromDirectus } from "../lib/directus";

export const prerender = true;

const MAIN = "https://literae.ch";
const ART = "https://art.literae.ch";

function entry(loc: string, changefreq = "weekly", priority = "0.7") {
  return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const GET: APIRoute = async () => {
  const staticMain = [
    entry(`${MAIN}/`, "daily", "1.0"),
    entry(`${MAIN}/scriptorium`, "weekly", "0.9"),
    entry(`${MAIN}/scriptorium/comparateur`, "weekly", "0.8"),
    entry(`${MAIN}/scriptorium/bibliotheque`, "monthly", "0.5"),
    entry(`${MAIN}/prieres`, "weekly", "0.8"),
    entry(`${MAIN}/calendrier`, "daily", "0.7"),
    entry(`${MAIN}/a-propos`, "monthly", "0.4"),
  ];

  const staticArt = [
    entry(`${ART}/`, "daily", "0.9"),
    entry(`${ART}/oeuvres`, "daily", "0.8"),
    entry(`${ART}/personalites`, "weekly", "0.8"),
  ];

  const artworks =
    (await fetchFromDirectus<{ slug: string }[]>(
      "artworks?filter[status][_eq]=published&fields=slug&limit=-1",
    )) || [];
  const artists =
    (await fetchFromDirectus<{ slug: string }[]>(
      "artists?filter[status][_eq]=published&fields=slug&limit=-1",
    )) || [];
  const prayers =
    (await fetchFromDirectus<{ slug: string }[]>(
      "prayers?filter[status][_eq]=published&fields=slug&limit=-1",
    )) || [];

  const dynamic = [
    ...artworks
      .filter((w) => w.slug)
      .map((w) => entry(`${ART}/oeuvres/${w.slug}`, "monthly", "0.6")),
    ...artists
      .filter((a) => a.slug)
      .map((a) => entry(`${ART}/personalites/${a.slug}`, "monthly", "0.6")),
    ...prayers
      .filter((p) => p.slug)
      .map((p) => entry(`${MAIN}/prieres/${p.slug}`, "monthly", "0.6")),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticMain, ...staticArt, ...dynamic].join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
