# Notter

**An open-source, local-first canon library for novel writers.**

Notter helps writers turn their novel chapters into a structured, searchable **canon library**.

It extracts and organizes information such as characters, locations, items, relationships, events, and other story details, then uses that data to provide tools such as character records, timelines, mind maps, and continuity tracking.

## Why Notter?

Notter is built around three principles:

* **Local-first** — Your novel and canon data are stored locally in your browser.
* **BYOK** — Bring your own AI API key and choose the provider/model you want to use.
* **Open source** — The project is transparent and built in the open.

AI is used to extract and structure information from your chapters. The resulting canon remains under your control, and extracted information can be reviewed and edited.

## Features

* **Canon Library** — Organize characters, locations, items, abilities, organizations, relationships, and other story information.
* **Character Records** — Maintain detailed information about individual characters and their development.
* **Events & Timelines** — Track story events by both chronological order and chapter.
* **Mind Maps & Relationships** — Visualize connections between characters, locations, events, and other entities.
* **AI Extraction** — Extract structured information from novel chapters using your own AI provider.
* **Canon & Continuity Tools** — Review your story data and identify inconsistencies or missing relationships.
* **Import & Export** — Back up and transfer your novel and canon data.
* **Writing Tools** — Write and manage chapters directly within Notter.

## Privacy

Notter is designed to keep your data local.

Novel and canon data are stored in your browser's local storage. Notter does not require a user account or a central database for your story data.

When AI extraction is used, chapter content is sent directly to the AI provider configured by you using your own API key.

For more information, see the documentation.

## Getting Started

### Requirements

* Node.js
* npm

### Installation

```bash
git clone https://github.com/Unique-newbie/Notter.git
cd Notter
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Production Build

```bash
npm run build
npm run start
```

## Development

Notter uses a feature-branch workflow.

```text
feature branch
      ↓
Pull Request → dev
      ↓
Preview / review
      ↓
dev.notterpad.in
      ↓
Pull Request → main
      ↓
app.notterpad.in
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Documentation

Full documentation will be available at:

**[docs.notterpad.in](https://docs.notterpad.in)**

The documentation will cover usage, AI extraction, the canon system, storage, architecture, and development.

## Project Status

Notter is currently in **early development**.

The application is functional but is still being actively developed and refined. Features and internal APIs may change before the first stable release.

There is currently no official stable release.

## License

Notter is licensed under the [MIT License](LICENSE).
