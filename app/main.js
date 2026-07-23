const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// The real, hydrated MasterLib.json (CloudStorage path — NOT the .noindex placeholder).
const GLOSSARY_FILE = path.join(
  os.homedir(),
  'Library', 'CloudStorage', 'OneDrive-Adobe',
  'Work', 'Development', 'Js Scripts', 'MasterLib.json'
);
// A single backup file kept alongside the glossary, overwritten on every save.
const BACKUP_FILE = path.join(path.dirname(GLOSSARY_FILE), 'MasterLib.backup.json');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  900,
    height: 640,
    minWidth:  680,
    minHeight: 460,
    title: 'Lexicon',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    vibrancy: 'under-window',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile('lexicon.html');
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => app.quit());

// ── Helpers ──
function readGlossaryRaw() {
  // strip a BOM if present, tolerate it on parse
  const txt = fs.readFileSync(GLOSSARY_FILE, 'utf8').replace(/^﻿/, '');
  return JSON.parse(txt);
}

// Normalise to { TERM: [def, ...] } — every value becomes an array of strings.
function normalise(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) out[k] = v.map(String);
    else if (v == null) out[k] = [''];
    else out[k] = [String(v)];
  }
  return out;
}

function backupCurrent() {
  if (!fs.existsSync(GLOSSARY_FILE)) return null;
  // Single backup: overwrite the previous one each time.
  fs.copyFileSync(GLOSSARY_FILE, BACKUP_FILE);
  return BACKUP_FILE;
}

// ── IPC ──
ipcMain.handle('load-glossary', () => {
  try {
    const data = normalise(readGlossaryRaw());
    return { ok: true, data, path: GLOSSARY_FILE, count: Object.keys(data).length };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err), path: GLOSSARY_FILE };
  }
});

/**
 * Save the whole glossary.
 * Safety rails: refuse to overwrite a healthy file with junk.
 *  - data must be a plain object with at least 1 entry
 *  - if it would shrink the file by >25% of entries, require force=true
 * Always writes a timestamped backup first.
 */
ipcMain.handle('save-glossary', (e, data, force) => {
  try {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, error: 'Refused: data is not an object.' };
    }
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return { ok: false, error: 'Refused: glossary would be empty.' };
    }

    // Compare against what is currently on disk.
    let prevCount = 0;
    try { prevCount = Object.keys(readGlossaryRaw()).length; } catch { prevCount = 0; }
    if (!force && prevCount > 0 && keys.length < prevCount * 0.75) {
      return {
        ok: false, needsConfirm: true,
        error: `This would drop from ${prevCount} to ${keys.length} entries.`,
        prevCount, newCount: keys.length,
      };
    }

    // Validate every value is an array of strings; write 4-space indent to match the file.
    const clean = {};
    for (const k of keys) {
      const v = data[k];
      clean[k] = Array.isArray(v) ? v.map(String) : [String(v)];
    }
    const json = JSON.stringify(clean, null, 4);
    JSON.parse(json); // sanity check

    const backup = backupCurrent();
    fs.writeFileSync(GLOSSARY_FILE, json, 'utf8');
    return { ok: true, count: keys.length, backup };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  }
});

ipcMain.handle('reveal-file', () => {
  try { shell.showItemInFolder(GLOSSARY_FILE); return true; } catch { return false; }
});

ipcMain.handle('open-backups', () => {
  try {
    if (fs.existsSync(BACKUP_FILE)) shell.showItemInFolder(BACKUP_FILE);
    else shell.showItemInFolder(GLOSSARY_FILE);
    return true;
  } catch { return false; }
});
