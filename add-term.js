#!/usr/bin/env node
/**
 * Append (or update) a term in MasterLib.json, alphabetically, in the same format.
 *
 * Usage:
 *   node add-term.js "TERM" "The definition text."
 *   node add-term.js "CFI" "Cyber Fraud Investigations. ..."
 *
 * - Inserts the term in case-insensitive alphabetical order (the "*Sample" template stays first).
 * - If the term already exists (case-insensitive), it is updated and you are told so.
 * - Writes a timestamped backup to MasterLib_backups/ before saving.
 */
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const FILE = path.join(
  os.homedir(),
  'Library', 'CloudStorage', 'OneDrive-Adobe',
  'Work', 'Development', 'Js Scripts', 'MasterLib.json'
);
// A single backup file kept alongside the glossary, overwritten on every save.
const BACKUP_FILE = path.join(path.dirname(FILE), 'MasterLib.backup.json');

function fail(msg) { console.error('✗ ' + msg); process.exit(1); }

const [term, ...defParts] = process.argv.slice(2);
const definition = defParts.join(' ').trim();
if (!term || !definition) {
  fail('Usage: node add-term.js "TERM" "definition text"');
}

// Read + parse the real file (tolerate a BOM).
let obj;
try {
  const txt = fs.readFileSync(FILE, 'utf8').replace(/^﻿/, '');
  obj = JSON.parse(txt);
} catch (e) {
  fail('Could not read/parse MasterLib.json: ' + e.message);
}
if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
  fail('MasterLib.json is not a JSON object.');
}

// Detect an existing entry (case-insensitive). On a case-only match, keep the
// glossary's existing (canonical) casing rather than renaming the key.
const existingKey = Object.keys(obj).find(k => k.toLowerCase() === term.toLowerCase());
const isUpdate = !!existingKey;
const key = existingKey || term;
obj[key] = [definition];

// Re-sort: "*" (template) first, then case-insensitive alphabetical.
const ordered = {};
Object.keys(obj)
  .sort((a, b) => {
    if (a.startsWith('*') && !b.startsWith('*')) return -1;
    if (b.startsWith('*') && !a.startsWith('*')) return 1;
    return a.toLowerCase().localeCompare(b.toLowerCase());
  })
  .forEach(k => { ordered[k] = Array.isArray(obj[k]) ? obj[k].map(String) : [String(obj[k])]; });

const json = JSON.stringify(ordered, null, 4);
JSON.parse(json); // sanity check before writing

// Backup (single file, overwritten), then write.
try {
  fs.copyFileSync(FILE, BACKUP_FILE);
} catch (e) {
  fail('Backup failed, not writing: ' + e.message);
}

fs.writeFileSync(FILE, json, 'utf8');
console.log(`✓ ${isUpdate ? 'Updated' : 'Added'} "${key}" — glossary now has ${Object.keys(ordered).length} terms.`);
