import type { APIRoute } from "astro";
import { parseReference } from "../../../lib/bible-ref";

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  try {
    const ref = url.searchParams.get("ref") || "";
    return new Response(JSON.stringify(parseReference(ref)), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
