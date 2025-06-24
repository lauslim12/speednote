import Dexie, { type EntityTable } from "dexie";
import * as v from "valibot";

/*
 * Strict schema for the database data from Indexed DB, in case a user has
 * an invalid data in their database, so it could fallback to the specified values.
 */
const databaseSchema = v.object({
	content: v.fallback(v.string(), ""),
	isFrozen: v.fallback(v.boolean(), false),
	lastUpdated: v.pipe(
		v.fallback(v.number(), () => Date.now()),
		v.transform((value) => {
			// Make sure that the current value is a valid timestamp, else just use a default empty string.
			const validTimestamp = new Date(value).getTime() > 0;
			if (validTimestamp) {
				return value;
			}

			return Date.now();
		}),
	),
	title: v.fallback(v.string(), ""),
});

/**
 * Notes database schema.
 */
type NotesDatabaseEntry = {
	id: 0;
	title: string;
	content: string;
	lastUpdated: number;
	isFrozen: boolean;
};

/**
 * Default note.
 */
const defaultNote = {
	content: "",
	isFrozen: false,
	lastUpdated: Date.now(),
	title: "",
};

/**
 * Dexie database schema.
 */
type Database = {
	notes: EntityTable<NotesDatabaseEntry, "id">;
};

/**
 * Parsed, user-facing note, not the one from the database.
 */
type Note = v.InferOutput<typeof databaseSchema>;

/**
 * A better way is to define a concrete type for update, but in
 * this case the data structure is simple enough so this is not falling into
 * the realms of overengineering. We don't want the `id` and `lastUpdated` to be updated since
 * we can only have one note.
 */
type UpdateNotes = Partial<Omit<NotesDatabaseEntry, "id" | "lastUpdated">>;

/**
 * Special `Dexie` type for Indexed DB.
 */
type IndexedDatabase = Dexie & Database;

/**
 * Instantiate a Dexie client on module load.
 */
const database = new Dexie("speednote") as IndexedDatabase;

/**
 * Use the initial database schema.
 */
database.version(1).stores({
	notes: "id, title, content, lastUpdated, frozen",
});

/**
 * Retrieves a note from Indexed DB. Will return `undefined` if
 * data does not exist, and will crash the application if we somehow
 * failed to get from the Indexed DB.
 *
 * If the data does not exist, upsert the data into the table. Since
 * this is only called once during the app startup, this becomes the initializer.
 *
 * {@link https://dexie.org/docs/Table/Table.get()}
 * @package
 */
export const getNotes = async (): Promise<Note> => {
	const notes = await database.notes.get(0);

	// Guard for non-existent data. We have to add `id` here
	// to prevent an error when it tries to evaluate the store's key path
	// but failed.
	if (!notes) {
		await database.notes.put({ id: 0, ...defaultNote }, 0);
		return v.parse(databaseSchema, defaultNote);
	}

	// Guard for invalid data. If someone inserts an invalid data in Indexed DB,
	// it'll fallback to the default values.
	return v.parse(databaseSchema, notes);
};

/**
 * Sets a note into the Indexed DB. Returns the new note, or nothing if nothing was updated.
 *
 * {@link https://dexie.org/docs/Table/Table.update()}
 * @package
 */
export const setNotes = async (notes: UpdateNotes) => {
	const results = await database.notes.update(0, notes);
	if (results === 0) {
		return null;
	}

	return await database.notes.get(0);
};
