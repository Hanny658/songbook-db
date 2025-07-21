// types.ts (import as .js anw)

export interface SongLine {
    /** e.g. "F    G7" */
    chords: string;
    /** e.g. "Side by side we stand" */
    lyrics: string;
}

export interface SongSection {
    /** unique key, e.g. "verse1" */
    id: string;
    /** human read-able label, e.g. "Verse 1" */
    label: string;
    lines: SongLine[];
}

/** the full song JSON shape */
export interface ChristianSong {
    title: string;
    number: number;
    link: string;
    lyrics: SongSection[];
    /** play order, e.g. ["verse1","chorus",…] */
    song: string[];
}

/** minimal metadata for listing */
export interface SongMeta {
    number: number;
    title: string;
    link: string;
}

export interface User {
    /** must match the filename: user/[username].json */
    username: string;
    /** in this example stored in plaintext; you can upgrade to hashed passwords */
    password: string;
}
