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

  > Note that link and verse are optional, depends whether it is recorded in the database.

  ```json
  [
    { "number": 1, "title": "Amazing Grace",    "link": "https://youtube.com/…", "verse": "Ephesians 2:8" },
    { "number": 2, "title": "My Hope Is Built" },
    { "number": 3, "title": "Side by Side",    "link": "https://youtube.com/…" },
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
    "song": [ "verse1", "chorus", … ],
    "verse": "..."
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
    "song": [ /* play order array of section IDs */ ],
    "verse": "..."
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

### 5. Verify User Credentials

```
POST user-verify
Content-Type: application/json
```

* **Body** – user login details

  ```jsonc
  {
    "username": "Hanny",
    "password": "Hanny123"
  }
  ```
* **Response**

  ```json
  { "message": "Login successfully." }
  ```
* **Errors**
  – `400` Request failed - `401` Unauthorised

### 6. Update User Password

```
POST /user-update-pwd
Content-Type: application/json
```

* **Body**

  ```jsonc
  {
    "username": "Hanny",
    "password": "Hanny12345"
  }
  ```
* **Response**

  ```json
  { "message": "Password for user '${username}' updated successfully." }
  ```
* **Errors**
  – `400` Request failed - `404` - User not found

### 7. Finding a Scripture text

```
GET /bible-verse?translation=[KJV/NKJV/NIV]&book=[book name]&chapter=[number]&verse_start=[num]&verse_end=[num]
```
`verse_start` and `verse_end` are optional, leaving both void to get a full chapter (or start = 1, end = 999 works, but not recommended lol), or fill only one of them to get that verse.

* **Response**

  ``` GET http://some-localhost/bible-verse?translation=NKJV&book=Genesis&chapter=1&verse_start=1&verse_end=3 ```
  ```json
  {
      "1": "In the beginning God created the heavens and the earth.",
      "2": "The earth was without form, and void; and darkness was on the face of the deep. And the Spirit of God was hovering over the face of the waters.",
      "3": "Then God said, “Let there be light”; and there was light."
  }
  ```
* **Errors**
  – `400` Params are not valid

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


