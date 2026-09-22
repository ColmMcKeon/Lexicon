# Lexicon

A glossary manager for MasterLib.json — a desktop app for searching, adding, editing, and organizing terminology and definitions.

## Tech Stack

- **Framework:** Electron
- **Language:** JavaScript/HTML/CSS
- **Data:** JSON (MasterLib.json)
- **Build:** electron-packager
- **Platform:** macOS (Apple Silicon)

## Features

- **Search glossary** — Fast full-text search across all terms and definitions
- **Add/edit terms** — Create new entries with multiple definitions per term
- **Case-insensitive duplicate detection** — Avoid unintended term duplication
- **Auto-backup** — Timestamped backups saved before every edit
- **Safe saves** — Confirmation prompts and validation before destructive operations
- **Multi-definition support** — Store multiple meanings for a single term
- **Native macOS app** — Built with Electron for smooth macOS integration

## Installation

Download the latest `Lexicon.zip` from [Releases](https://github.com/ColmMcKeon/Lexicon/releases) or build from source.

## Usage

Lexicon reads and writes to your `MasterLib.json` file, typically located at:
```
~/OneDrive/Work/Development/Js Scripts/MasterLib.json
```

## Development

```bash
npm install
npm start
npm run build  # Create production bundle
```

---

Manage your personal glossary with confidence and precision.
