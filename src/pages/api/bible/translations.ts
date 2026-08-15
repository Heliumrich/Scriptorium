import type { APIRoute } from 'astro';
import { getBibleDb } from '../../../lib/bible-db';

export const prerender = false;

export const GET: APIRoute = () => {
  const db = getBibleDb();
  const rows = db.prepare(`
    SELECT id, code, name_short, name_full
    FROM translations
    ORDER BY code
  `).all();
  db.close();

  return new Response(JSON.stringify(rows), {
    headers: { 'Content-Type': 'application/json' }
  });
};