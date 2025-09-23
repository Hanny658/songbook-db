# Songbook‑DB API

A lightweight, file‑based REST API for managing Christian song data stored as individual JSON files.  
Built with TypeScript, Node.js, Express and LowDB, this service exposes CRUD endpoints to list, retrieve, add/update, and delete song files under `songdata/`.

---

## 📋 Features

- **GET /songs**: List all songs (number, title, link)  
- **GET /songs/:number**: Retrieve full song JSON by its numeric ID  
- **POST /songs/:number**: Create or replace `songdata/[number].json`  
- **DELETE /songs/:number**: Remove `songdata/[number].json`  

- Type‑safe models in **TypeScript**  
- Zero‑configuration JSON file storage via **LowDB**  
- ES Module support (NodeNext + `import.meta.url`)  
- Simple, folder‑based “database”—no external DB required  

---

## 📂 Project Structure

```

your-project/
├── package.json
├── tsconfig.json
├── README.md
├── songdata/                # JSON files: \[number].json
│   ├── 1.json
│   ├── 2.json
│   └── …
├── bibledata/                # JSON files: \[translation].json
│   ├── index.ts              # index for the translation contained
│   ├── KJV.json
│   ├── NIV.json
│   └── …
├── user/                     # JSON files: \[name].json, private to each deploy
│   ├── David.json
│   ├── Joshua.json
│   └── …
├── server.ts            # Express app + route definitions
└── types.ts             # TS interfaces (ChristianSong, SongMeta, etc.)

````

---

## ⚙️ Prerequisites

- **Node.js** ≥ 16.x  (newer the better)
- **npm** ≥ 8.x       (newer the better)
- **Git** (optional, for cloning)

---

## 🚀 Getting Started

1. **Clone the repo**  
   ```bash
   git clone https://github.com/Hanny658/songbook-db.git
   cd songbook-db
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configuration**
   No additional configuration is required. The service reads/writes from `songdata/` relative to the project root.

---

## 🏗️ Build & Production

1. **Compile TypeScript**

   ```bash
   npm run build
   ```
2. **Start**

   ```bash
   npm start
   ```

The production build outputs to `dist/`, and the compiled server is `dist/server.js`.

---

## 📖 API Reference

### 1. List all songs

```
GET /songs
```

* **Response**:

  ```json
  [
    { "number": 1, "title": "My Hope Is Built", "link": "https://youtube.com/…" },
    { "number": 2, "title": "Side by Side",    "link": "https://youtube.com/…" },
    …
  ]
  ```

### 2. Get a song by number

```
GET /songs/:number
```

* **Parameters**
  – `:number` (integer) – the song ID / filename.
* **Response** – full `ChristianSong` JSON:

  ```jsonc
  {
    "title": "Side by Side",
    "number": 2,
    "link": "https://youtube.com/…",
    "lyrics": [ /* sections */ ],
    "song": [ "verse1", "chorus", … ]
  }
  ```
* **Errors**
  – `400` Invalid number
  – `404` Song not found

### 3. Create or replace a song

```
POST /songs/:number
Content-Type: application/json
```

* **Body** – `ChristianSong` shape (all fields except `number` will be enforced):

  ```jsonc
  {
    "title": "New Song Title",
    "link": "https://youtube.com/…",
    "lyrics": [ /* same schema as above */ ],
    "song": [ /* play order array of section IDs */ ]
  }
  ```
* **Response**

  ```json
  { "message": "Song saved successfully.", "song": { /* full song JSON */ } }
  ```
* **Errors**
  – `400` Validation failed

### 4. Delete a song

```
DELETE /songs/:number
```

* **Response**

  ```json
  { "message": "Song deleted successfully." }
  ```
* **Errors**
  – `400` Invalid number
  – `404` Song not found

---

## 🎨 Data Model

```ts
interface SongLine {
  chords: string;
  lyrics: string;
}

interface SongSection {
  id: string;
  label: string;
  lines: SongLine[];
}

interface ChristianSong {
  title: string;
  number: number;
  link: string;
  lyrics: SongSection[];
  song: string[];
}

// For listing:
interface SongMeta {
  number: number;
  title: string;
  link: string;
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/YourFeature`
3. Commit changes: `git commit -m "feat: add …"`
4. Push and open a Pull Request

Please follow the existing code style and ensure TypeScript type checks pass.

---

## 📄 License

This project is released under the **MIT License**. See the [LICENSE](LICENSE) file for details.


