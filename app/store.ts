import { type Notes, notesSchema, storageKey } from './schema';

/**
 * Data store, used to store the data in a data store somewhere. The current implementation
 * uses `localStorage` to store all of the data here.
 */
const dataStore = {
  storeTitle: (title: string) => {
    localStorage.setItem(storageKey.TITLE_STORAGE_KEY, title);
  },

  storeContent: (content: string) => {
    localStorage.setItem(storageKey.CONTENT_STORAGE_KEY, content);
  },

  storeLastUpdated: (lastUpdated: string) => {
    localStorage.setItem(storageKey.LAST_UPDATED_STORAGE_KEY, lastUpdated);
  },

  getTitle: () => {
    return localStorage.getItem(storageKey.TITLE_STORAGE_KEY);
  },

  getContent: () => {
    return localStorage.getItem(storageKey.CONTENT_STORAGE_KEY);
  },

  getLastUpdated: () => {
    return localStorage.getItem(storageKey.LAST_UPDATED_STORAGE_KEY);
  },
};

/**
 * Fetches your own notes from the data store. The return parses
 * it according to the schema to make sure that it's a valid data.
 *
 * @returns A note object.
 */
export const getNotes = (): Notes => {
  const [title, content, lastUpdated] = [
    dataStore.getTitle(),
    dataStore.getContent(),
    dataStore.getLastUpdated(),
  ];

  return notesSchema.parse({ notes: { title, content, lastUpdated } });
};

/**
 * Stores the title in the data store.
 *
 * @param title - Title of the note.
 * @returns The title.
 */
export const storeTitle = (title: string) => {
  dataStore.storeTitle(title);
  return title;
};

/**
 * Stores the content in the data store.
 *
 * @param content - Content of the note.
 * @returns The content of the note.
 */
export const storeContent = (content: string) => {
  dataStore.storeContent(content);
  return content;
};

/**
 * Stores the last updated note time in the data store.
 *
 * @param lastUpdated - A **string** of the last updated time.
 * @returns The last updated time of the note.
 */
export const storeLastUpdated = (lastUpdated: string) => {
  dataStore.storeLastUpdated(lastUpdated);
  return lastUpdated;
};
