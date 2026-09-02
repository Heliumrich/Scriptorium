import type { APIRoute } from "astro";
import { getBibleDb } from "../../../lib/bible-db";

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  try {
    const book = url.searchParams.get("book")?.toUpperCase();
    const chapter = Number(url.searchParams.get("chapter"));
    const verse = url.searchParams.get("verse") ? Number(url.searchParams.get("verse")) : null;
    const verseEnd = url.searchParams.get("verseEnd") ? Number(url.searchParams.get("verseEnd")) : null;
    const translationIds = url.searchParams.getAll("t");

    if (!book || !chapter || translationIds.length === 0) {
      return new Response(JSON.stringify({ error: "Paramètres manquants" }), { status: 400 });
    }

    const db = getBibleDb();
    const results = [];

    for (const tid of translationIds) {
      let rows;
      if (verse && verseEnd && verseEnd !== verse) {
        const from = Math.min(verse, verseEnd);
        const to = Math.max(verse, verseEnd);
        rows = db
          .prepare(
            `SELECT v.verse, v.text, t.code, t.name_short
             FROM verses v
             JOIN translations t ON t.id = v.translation_id
             WHERE v.translation_id = ? AND v.book = ? AND v.chapter = ? AND v.verse BETWEEN ? AND ?
             ORDER BY v.verse`,
          )
          .all(tid, book, chapter, from, to);
      } else if (verse) {
        rows = db
          .prepare(
            `SELECT v.verse, v.text, t.code, t.name_short
             FROM verses v
             JOIN translations t ON t.id = v.translation_id
             WHERE v.translation_id = ? AND v.book = ? AND v.chapter = ? AND v.verse = ?
             ORDER BY v.verse`,
          )
          .all(tid, book, chapter, verse);
      } else {
        rows = db
          .prepare(
            `SELECT v.verse, v.text, t.code, t.name_short
             FROM verses v
             JOIN translations t ON t.id = v.translation_id
             WHERE v.translation_id = ? AND v.book = ? AND v.chapter = ?
             ORDER BY v.verse`,
          )
          .all(tid, book, chapter);
      }

      results.push({
        code: rows[0]?.code || "?",
        name: rows[0]?.name_short || `ID ${tid}`,
        verses: rows.map((r: any) => ({ verse: r.verse, text: r.text })),
      });
    }

    db.close();

    return new Response(JSON.stringify({ book, chapter, verse, verseEnd, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
