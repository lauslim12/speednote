import { type Data, dataSchema, storageKey } from './schema';

/**
 * Data store, used to store the data in a data store somewhere. The current implementation
 * uses `localStorage` to store all of the data here.
 */
const dataStore = {
  config: {
    setFrozen: (frozen: Data['config']['frozen']) => {
      localStorage.setItem(storageKey.CONFIG_FROZEN_KEY, frozen);
    },
    getFrozen: () => {
      return localStorage.getItem(storageKey.CONFIG_FROZEN_KEY);
    },
  },
  notes: {
    title: {
      storeTitle: (title: string) => {
        localStorage.setItem(storageKey.TITLE_STORAGE_KEY, title);
      },
      getTitle: () => {
        return localStorage.getItem(storageKey.TITLE_STORAGE_KEY);
      },
    },
    content: {
      storeContent: (content: string) => {
        localStorage.setItem(storageKey.CONTENT_STORAGE_KEY, content);
      },
      getContent: () => {
        return localStorage.getItem(storageKey.CONTENT_STORAGE_KEY);
      },
    },
    lastUpdated: {
      storeLastUpdated: (lastUpdated: string) => {
        localStorage.setItem(storageKey.LAST_UPDATED_STORAGE_KEY, lastUpdated);
      },
      getLastUpdated: () => {
        return localStorage.getItem(storageKey.LAST_UPDATED_STORAGE_KEY);
      },
    },
  },
};

/**
 * Fetches your own global data from the data store. The return parses
 * it according to the schema to make sure that it's a valid data.
 *
 * @returns The data object.
 */
export const getData = () => {
  const parsedData = dataSchema.parse({
    config: {
      frozen: dataStore.config.getFrozen(),
    },
    notes: {
      title: dataStore.notes.title.getTitle(),
      content: dataStore.notes.content.getContent(),
      lastUpdated: dataStore.notes.lastUpdated.getLastUpdated(),
    },
  });

  return parsedData;
};

/**
 * Stores the title in the data store.
 *
 * @param title - Title of the note.
 * @returns The title.
 */
export const storeTitle = (title: string) => {
  dataStore.notes.title.storeTitle(title);
  return title;
};

/**
 * Stores the content in the data store.
 *
 * @param content - Content of the note.
 * @returns The content of the note.
 */
export const storeContent = (content: string) => {
  dataStore.notes.content.storeContent(content);
  return content;
};

/**
 * Stores the last updated note time in the data store.
 *
 * @param lastUpdated - A **string** of the last updated time.
 * @returns The last updated time of the note.
 */
export const storeLastUpdated = (lastUpdated: string) => {
  dataStore.notes.lastUpdated.storeLastUpdated(lastUpdated);
  return lastUpdated;
};

/**
 * Stores the string representation of a boolean in the data store. Used
 * to check whether the note is frozen or not.
 *
 * @param frozen - A **string** representation of a boolean.
 * @returns The string representation of the boolean.
 */
export const storeFrozen = (frozen: Data['config']['frozen']) => {
  dataStore.config.setFrozen(frozen);
  return frozen;
};
