const DIRECTUS_URL = import.meta.env.DIRECTUS_URL || 'http://localhost:8055';

export async function fetchFromDirectus(endpoint: string) {
  const res = await fetch(`${DIRECTUS_URL}/items/${endpoint}`);
  
  if (!res.ok) {
    console.error(`Erreur Directus: ${res.status} ${res.statusText}`);
    return null;
  }

  const json = await res.json();
  return json.data;
}

export function getAssetURL(fileId: string, key?: string) {
  if (!fileId) return null;
  const base = `${DIRECTUS_URL}/assets/${fileId}`;
  return key ? `${base}?key=${key}` : base;
}