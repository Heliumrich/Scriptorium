import type { APIRoute } from "astro";
import { fetchFromDirectus, getAssetURL, fileIdOf } from "../../lib/directus";
import { parseTags, searchHaystack } from "../../lib/catalog";

export const prerender = true;

export const GET: APIRoute = async () => {
  const artists =
    (await fetchFromDirectus<any[]>(
      "artists?filter[status][_eq]=published&fields=id,slug,name,name_latin,short_description,photo,tags&sort=name&limit=-1",
    )) || [];

  const items = artists.map((artist) => ({
    slug: artist.slug,
    href: `/art/personalites/${artist.slug}`,
    title: artist.name,
    subtitle: artist.short_description || artist.name_latin || null,
    thumb: getAssetURL(fileIdOf(artist.photo), "thumbnail"),
    tags: parseTags(artist.tags),
    haystack: searchHaystack([
      artist.name,
      artist.name_latin,
      artist.short_description,
    ]),
  }));

  return new Response(JSON.stringify({ items }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
