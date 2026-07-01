/**
 * fileStore.ts — Persistent file-based key-value store for dev/MVP.
 *
 * Replaces the volatile globalThis.mockDb pattern which was wiped on every
 * Next.js hot-reload, causing the dashboard to show fake fallback data.
 *
 * In production, Firebase Firestore is used directly. This store acts as a
 * local cache that survives process restarts during development.
 *
 * Data is stored in: data/mockdb.json (excluded from git via .gitignore)
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mockdb.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDb(): Record<string, any> {
  ensureDataDir();
  try {
    if (!fs.existsSync(DB_FILE)) return {};
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeDb(data: Record<string, any>): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/** Retrieve a single record by cvId. Returns null if not found. */
export function getRecord(cvId: string): Record<string, any> | null {
  const db = readDb();
  return db[cvId] ?? null;
}

/** Create or fully overwrite a record. */
export function setRecord(cvId: string, data: Record<string, any>): void {
  const db = readDb();
  db[cvId] = { ...data, _updatedAt: new Date().toISOString() };
  writeDb(db);
}

/** Merge partial data into an existing record without overwriting other fields. */
export function updateRecord(cvId: string, partial: Record<string, any>): void {
  const db = readDb();
  db[cvId] = { ...(db[cvId] ?? {}), ...partial, _updatedAt: new Date().toISOString() };
  writeDb(db);
}

/** Delete a record (GDPR / data hygiene). */
export function deleteRecord(cvId: string): void {
  const db = readDb();
  delete db[cvId];
  writeDb(db);
}
