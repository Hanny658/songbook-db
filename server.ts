import express, { Request, Response } from 'express';
import fs from 'fs';
import path, { dirname, join } from 'path';
import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { fileURLToPath } from 'url';
import {
    ChristianSong,
    SongMeta
} from './types.js';


const app = express();
app.use(express.json());

// ESM __filename/__dirname shims and database dir
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SONG_DIR = join(__dirname, '../songdata');

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

//
// ─── ROUTES ────────────────────────────────────────────────────────────────────
//

/**
 * GET /songs
 * Returns an array of { number, title, link } for every song file.
 */
app.get('/songs', (req: Request, res: Response) => {
    try {
        const list = listAllSongs();
        res.json(list);
    } catch (err) {
        console.error(err);
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
    res.json({ message: 'Song saved successfully.'/*, song */});
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

    res.json({ message: 'Song deleted successfully.' });
});


//
// ─── START SERVER ───────────────────────────────────────────────────────────────
//

const PORT = process.env.PORT ?? 3053; // Allow .env set PORT, default 3053
app.listen(PORT, () => {
    console.log(`🎵  Song DB APIs are lively listening on PORT:${PORT}`);
});
