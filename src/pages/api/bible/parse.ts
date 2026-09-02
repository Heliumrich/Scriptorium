import type { APIRoute } from "astro";
import { parseReference } from "../../../lib/bible-ref";

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref") || "";
  return new Response(JSON.stringify(parseReference(ref)), {
    headers: { "Content-Type": "application/json" },
  });
};
