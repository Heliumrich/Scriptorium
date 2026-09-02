import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

function resolveDbPath() {
  const candidates = [
    process.env.BIBLE_DB,
    path.resolve(process.cwd(), "data/bible.db"),
    "/var/www/scriptorium/data/bible.db",
  ].filter(Boolean) as string[];

  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }

  throw new Error(
    `bible.db introuvable (cwd=${process.cwd()}, essayé: ${candidates.join(", ")})`,
  );
}

export function getBibleDb() {
  const dbPath = resolveDbPath();
  return new Database(`file:${dbPath}?mode=ro&immutable=1`, {
    readonly: true,
    fileMustExist: true,
  });
}
