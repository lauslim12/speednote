import { z } from 'zod';

const BASE64_REGEX =
  /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

/**
 * Custom Zod schema to create a string-like with a unique fallback. See documentation
 * below to coerce empty strings to `undefined` so we can always set the default value.
 *
 * {@link https://github.com/colinhacks/zod/issues/2070}
 * @returns Composable/reusable Zod type to create a string with a unique fallback.
 */
const stringWithDefaultValue = (defaultValue?: string) => {
  return z
    .string()
    .nullish()
    .transform((x) => x ?? undefined)
    .default(defaultValue ?? '');
};

/**
 * Ensures that a string is a string compatible with the date. Falls back to
 * an empty string if its not.
 *
 * @returns String that is compatible as date.
 */
const stringAsCompatibleDate = () => {
  return z.preprocess((x) => {
    if (typeof x !== 'string') {
      return '';
    }

    // Make sure that the current string is a valid timestamp, else just use a default empty string.
    const validTimestamp = new Date(Number.parseInt(x, 10)).getTime() > 0;
    if (validTimestamp) {
      return x;
    }

    return '';
  }, stringWithDefaultValue());
};

/**
 * Ensures that a string is a string that's compatible with the boolean literals `true` and
 * `false`, and falls back to `false` if its not.
 *
 * @returns String that is compatible with boolean literals.
 */
const stringAsCompatibleBoolean = () => {
  return z.preprocess((x) => {
    if (!x) {
      return 'false';
    }

    if (x !== 'false' && x !== 'true') {
      return 'false';
    }

    return x;
  }, z.union([z.literal('true'), z.literal('false')]));
};

/**
 * Schema that we use to share notes to other people.
 */
export const sharedNoteSchema = z.discriminatedUnion('isShared', [
  z.object({
    isShared: z.literal(true),
    title: z
      .string()
      .nullable()
      .transform((val) => {
        if (!val || !BASE64_REGEX.test(val)) {
          return 'Invalid title format from the shared URL, so we cannot read it.';
        }

        return window.atob(val);
      }),
    content: z
      .string()
      .nullable()
      .transform((val) => {
        if (!val || !BASE64_REGEX.test(val)) {
          return 'Invalid content format from the shared URL, so we cannot read it for now. Please ask the other party to re-share the URL!';
        }

        return window.atob(val);
      }),
  }),
  z.object({
    isShared: z.literal(false),
  }),
]);

export type SharedNote = z.infer<typeof sharedNoteSchema>;

/**
 * Storage keys for the current implementation of `localStorage` key value pairs.
 */
export const storageKey = Object.freeze({
  CONFIG_FROZEN_KEY: 'frozen',
  TITLE_STORAGE_KEY: 'title',
  CONTENT_STORAGE_KEY: 'content',
  LAST_UPDATED_STORAGE_KEY: 'last-updated',
});

/**
 * Application data schema.
 */
export const dataSchema = z.object({
  config: z.object({
    frozen: stringAsCompatibleBoolean(),
  }),
  notes: z.object({
    title: stringWithDefaultValue(),
    content: stringWithDefaultValue(),
    lastUpdated: stringAsCompatibleDate(),
  }),
});

export type Data = z.infer<typeof dataSchema>;
