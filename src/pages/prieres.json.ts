import type { APIRoute } from "astro";
import { fetchFromDirectus } from "../lib/directus";
import { prayerToIndex, type Prayer } from "../lib/prayer";

export const prerender = true;

export const GET: APIRoute = async () => {
  const prayers =
    (await fetchFromDirectus<Prayer[]>(
      "prayers?filter[status][_eq]=published&fields=id,slug,sort,title_latin,title_french,text_latin,text_french,description,tags&sort=sort,title_french&limit=-1",
    )) || [];

  return new Response(JSON.stringify({ items: prayers.map(prayerToIndex) }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
