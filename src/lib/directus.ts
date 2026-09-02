export const DIRECTUS_URL =
  import.meta.env.DIRECTUS_URL || "https://api.literae.ch";

export type AssetKey = "thumbnail" | "medium" | "large" | "xlarge";

export function getDirectusUrl() {
  return DIRECTUS_URL;
}

export async function fetchFromDirectus<T = unknown>(
  endpoint: string,
): Promise<T | null> {
  try {
    const res = await fetch(`${DIRECTUS_URL}/items/${endpoint}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error(`Erreur Directus: ${res.status} ${res.statusText}`);
      return null;
    }
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch (error) {
    console.error("Erreur Directus:", error);
    return null;
  }
}

export function getAssetURL(
  fileId: string | null | undefined,
  key?: AssetKey | string,
) {
  if (!fileId) return null;
  if (
    fileId.startsWith("http://") ||
    fileId.startsWith("https://") ||
    fileId.startsWith("/")
  ) {
    return fileId;
  }
  const base = `${DIRECTUS_URL}/assets/${fileId}`;
  return key ? `${base}?key=${key}` : base;
}

export function getArtworkTitle(work: {
  title_french?: string | null;
  title_original?: string | null;
  title_english?: string | null;
}) {
  return (
    work.title_french ||
    work.title_original ||
    work.title_english ||
    "Sans titre"
  );
}

export function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function fileIdOf(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "id" in value) {
    const id = (value as { id: unknown }).id;
    return typeof id === "string" || typeof id === "number"
      ? String(id)
      : null;
  }
  return null;
}
