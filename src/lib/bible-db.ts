import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve('data/bible.db');

export function getBibleDb() {
  return new Database(dbPath, { readonly: true });
}