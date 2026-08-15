import type { APIRoute } from 'astro';
import { getBibleDb } from '../../../lib/bible-db';

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const book = url.searchParams.get('book')?.toUpperCase();
  const chapter = Number(url.searchParams.get('chapter'));
  const verseParam = url.searchParams.get('verse');
  const verse = verseParam ? Number(verseParam) : null;

  if (!book || !chapter) {
    return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400 });
  }

  const db = getBibleDb();

  const books = db.prepare(`SELECT code FROM books ORDER BY order_num`).all()
    .map((r: any) => r.code);

  const bookIdx = books.indexOf(book);
  if (bookIdx === -1) {
    db.close();
    return new Response(JSON.stringify({ error: 'Livre inconnu' }), { status: 400 });
  }

  const maxChapter = (b: string) =>
    (db.prepare(`SELECT MAX(chapter) as m FROM verses WHERE book = ?`).get(b) as any)?.m || 1;

  const maxVerse = (b: string, c: number) =>
    (db.prepare(`SELECT MAX(verse) as m FROM verses WHERE book = ? AND chapter = ?`).get(b, c) as any)?.m || 1;

  // ----- NEXT -----
  let next = null;
  if (verse !== null) {
    const mv = maxVerse(book, chapter);
    if (verse < mv) {
      next = { book, chapter, verse: verse + 1 };
    } else if (chapter < maxChapter(book)) {
      next = { book, chapter: chapter + 1, verse: 1 };
    } else if (bookIdx + 1 < books.length) {
      next = { book: books[bookIdx + 1], chapter: 1, verse: 1 };
    }
  } else {
    if (chapter < maxChapter(book)) {
      next = { book, chapter: chapter + 1, verse: null };
    } else if (bookIdx + 1 < books.length) {
      next = { book: books[bookIdx + 1], chapter: 1, verse: null };
    }
  }

  // ----- PREV -----
  let prev = null;
  if (verse !== null) {
    if (verse > 1) {
      prev = { book, chapter, verse: verse - 1 };
    } else if (chapter > 1) {
      const pc = chapter - 1;
      prev = { book, chapter: pc, verse: maxVerse(book, pc) };
    } else if (bookIdx > 0) {
      const pb = books[bookIdx - 1];
      const pc = maxChapter(pb);
      prev = { book: pb, chapter: pc, verse: maxVerse(pb, pc) };
    }
  } else {
    if (chapter > 1) {
      prev = { book, chapter: chapter - 1, verse: null };
    } else if (bookIdx > 0) {
      const pb = books[bookIdx - 1];
      prev = { book: pb, chapter: maxChapter(pb), verse: null };
    }
  }

  db.close();
  return new Response(JSON.stringify({ prev, next }), {
    headers: { 'Content-Type': 'application/json' }
  });
};