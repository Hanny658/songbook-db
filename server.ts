import express, { Request, Response } from 'express';
import fs from 'fs';
import path, { dirname, join } from 'path';
import cors from 'cors';
import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { fileURLToPath } from 'url';
import {
    ChristianSong,
    SongMeta,
    User
} from './types.js';


const app = express();
app.use(express.json());
app.use(cors({
    origin: [
    'https://cgsongbook.org'
    ],
    methods: ['GET','POST','DELETE']
}));

// ESM __filename/__dirname shims and database dir
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Directory where individual song files live
const SONG_DIR = join(__dirname, '../songdata');
// Directory where individual user files live
const USER_DIR = join(__dirname, '../user');
// Path to the centralized metadata file at project root
const METADATA_PATH = join(__dirname, '../metadata.json');

//
// ─── HELPERS ───────────────────────────────────────────────────────────────────
//

/**
 * Build the full path to a song file by number.
 */
function songFilePath(number: number): string {
    return path.join(SONG_DIR, `${number}.json`);
}

/**
 * Load a song by number using LowDB.
 * @returns the parsed ChristianSong, or null if file not found / invalid
 */
function loadSong(number: number): ChristianSong | null {
    const file = songFilePath(number);
    if (!fs.existsSync(file)) return null;

    // LowDB adapter pointed at this one file
    const adapter = new JSONFileSync<ChristianSong>(file);
    const db = new LowSync(adapter, {} as ChristianSong);
    db.read();

    // db.data should now be your song JSON
    return db.data ?? null;
}

/**
 * Save (or overwrite) a song JSON to disk.
 */
function saveSong(number: number, song: ChristianSong): void {
    const file = songFilePath(number);
    const adapter = new JSONFileSync<ChristianSong>(file);
    const db = new LowSync(adapter, {} as ChristianSong);

    // Guarantee consistency of the number field
    song.number = number;
    db.data = song;
    db.write();
}

/**
 * Delete a song file.
 */
function deleteSong(number: number): boolean {
    const file = songFilePath(number);
    if (!fs.existsSync(file)) return false;
    fs.unlinkSync(file);
    return true;
}

/**
 * Read all JSON filenames in SONG_DIR and extract minimal metadata.
 */
function listAllSongs(): SongMeta[] {
    return fs
        .readdirSync(SONG_DIR)
        .filter(f => f.match(/^\d+\.json$/))        // only [number].json
        .map(f => parseInt(f, 10))
        .map(num => {
            const song = loadSong(num);
            if (!song) throw new Error(`Invalid JSON in ${num}.json`);
            return { number: num, title: song.title, link: song.link } as SongMeta;
        });
}

/** Regenerate metadata.json from every song in songdata/. */
function updateMetadata(): void {
    try {
        const metas = listAllSongs();
        fs.writeFileSync(
            METADATA_PATH,
            JSON.stringify(metas, null, 2),
            'utf-8'
        );
        console.log('🔄 metadata.json updated.');
    } catch (err) {
        console.error('❌ Failed to update metadata.json:', err);
    }
}

/**
 * Load a user JSON by username.
 * @returns the User object, or null if not found or invalid JSON.
 */
function loadUser(username: string): User | null {
    const filePath = join(USER_DIR, `${username}.json`);
    if (!fs.existsSync(filePath)) return null;

    // LowDB adapter for this one file
    const adapter = new JSONFileSync<User>(filePath);
    // supply a stub so the constructor type-checks
    const db = new LowSync<User>(adapter, {} as User);
    db.read();

    return db.data ?? null;
}


//
// ─── ROUTES ────────────────────────────────────────────────────────────────────
//

/**
 * GET /songs
 * Returns the precomputed metadata.json
 */
app.get('/songs', (req: Request, res: Response) => {
    try {
        const raw = fs.readFileSync(METADATA_PATH, 'utf-8');
        const list: SongMeta[] = JSON.parse(raw);
        res.json(list);
    } catch (err) {
        console.error('❌ Failed to read metadata.json:', err);
        res.status(500).json({ error: 'Failed to list songs.' });
    }
});

/**
 * GET /songs/:number
 * Returns the full song JSON for that number, or 404 if not found.
 */
app.get('/songs/:number', (req: Request, res: Response) => {
    const num = parseInt(req.params.number, 10);
    if (isNaN(num)) return res.status(400).json({ error: 'Invalid song number.' });

    const song = loadSong(num);
    if (!song) return res.status(404).json({ error: 'Song not found.' });

    console.log(`Got song No.${num}.`);
    res.json(song);
});

/**
 * POST /songs/:number
 * Creates or replaces songdata/[number].json with the body.
 */
app.post('/songs/:number', (req: Request, res: Response) => {
    const num = parseInt(req.params.number, 10);
    if (isNaN(num)) return res.status(400).json({ error: 'Invalid song number.' });

    const body = req.body as Partial<ChristianSong>;
    // Basic validation
    if (typeof body.title !== 'string' || typeof body.link !== 'string' || !Array.isArray(body.lyrics) || !Array.isArray(body.song)) {
        return res.status(400).json({ error: 'Request body is not a valid ChristianSong data.' });
    }

    // Merge into full shape
    const song: ChristianSong = {
        title: body.title,
        number: num,
        link: body.link,
        lyrics: body.lyrics,
        song: body.song
    };

    saveSong(num, song);
    updateMetadata();

    console.log(`Added/Updated song No.${num} ${body.title}.`);
    res.json({ message: 'Song saved successfully.'/*, song */ });
});

/**
 * DELETE /songs/:number
 * Deletes the corresponding JSON file.
 */
app.delete('/songs/:number', (req: Request, res: Response) => {
    const num = parseInt(req.params.number, 10);
    if (isNaN(num)) return res.status(400).json({ error: 'Invalid song number.' });

    const ok = deleteSong(num);
    if (!ok) return res.status(404).json({ error: 'Song not found.' });

    updateMetadata();

    console.log(`🗑️ Deleted song No.${num}.`);
    res.json({ message: 'Song deleted successfully.' });
});

/**
 * POST /user-verify
 * Body: { username: string; password: string }
 * — Returns 200 + { message } if credentials match,
 *   or 401 + { error } otherwise.
 */
app.post('/user-verify', (req, res) => {
    const { username, password } = req.body as Partial<User>;

    // 1) Basic request validation
    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Request Error [data type], contact dev for help..' });
    }

    // 2) Attempt to load the user file
    const user = loadUser(username);
    if (!user) {
        // no such user
        return res.status(401).json({ error: 'User is not found.' });
    }

    // 3) Verify password (plaintext match here; replace with hash check if needed)
    if (user.password !== password) {
        return res.status(401).json({ error: 'Incorrect Password' });
    }

    // 4) Success!
    console.log(`User ${username} just logged in.`);
    return res.status(200).json({ message: 'Login successful.' });
});


//
// ─── START SERVER ───────────────────────────────────────────────────────────────
//

updateMetadata();                       // Make sure server starts with fresh metadata
const PORT = process.env.PORT ?? 3053;  // Allow .env set PORT, default 3053
app.listen(PORT, () => {
    console.log(`🎵  Song DB APIs are lively listening on PORT:${PORT}`);
});
