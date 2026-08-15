import type { APIRoute } from 'astro';
import { getBibleDb } from '../../../lib/bible-db';

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const book = url.searchParams.get('book')?.toUpperCase();
  const chapter = Number(url.searchParams.get('chapter'));
  const verse = url.searchParams.get('verse') ? Number(url.searchParams.get('verse')) : null;
  const translationIds = url.searchParams.getAll('t');

  if (!book || !chapter || translationIds.length === 0) {
    return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400 });
  }

  const db = getBibleDb();
  const results = [];

  for (const tid of translationIds) {
    let rows;
    if (verse) {
      rows = db.prepare(`
        SELECT v.verse, v.text, t.code, t.name_short
        FROM verses v
        JOIN translations t ON t.id = v.translation_id
        WHERE v.translation_id = ? AND v.book = ? AND v.chapter = ? AND v.verse = ?
        ORDER BY v.verse
      `).all(tid, book, chapter, verse);
    } else {
      rows = db.prepare(`
        SELECT v.verse, v.text, t.code, t.name_short
        FROM verses v
        JOIN translations t ON t.id = v.translation_id
        WHERE v.translation_id = ? AND v.book = ? AND v.chapter = ?
        ORDER BY v.verse
      `).all(tid, book, chapter);
    }

    results.push({
      code: rows[0]?.code || '?',
      name: rows[0]?.name_short || `ID ${tid}`,
      verses: rows.map((r: any) => ({ verse: r.verse, text: r.text }))
    });
  }

  db.close();

  return new Response(JSON.stringify({ book, chapter, verse, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};