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
 * `false`, and falls back to `false` if its not. Coercion is not really efficient
 * as it cannot validate the edge-cases.
 *
 * {@link https://github.com/colinhacks/zod/issues/1630}
 * @returns Boolean values as the result of the transformation.
 */
const stringAsCompatibleBoolean = () => {
  return z.preprocess((x) => {
    if (!x) {
      return false;
    }

    // If it's a boolean then return as is, if it's a 'stringified'
    // boolean, such as `false` or `true`, then return the appropriate values.
    // If no match, return `false` as the default boolean value.
    if (typeof x === 'boolean') {
      return x;
    }

    if (typeof x === 'string') {
      switch (x) {
        case 'true':
          return true;

        case 'false':
          return false;

        default:
          return false;
      }
    }

    return false;
  }, z.boolean());
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
        if (!val) {
          return 'No title in the shared note';
        }

        if (!BASE64_REGEX.test(val)) {
          return 'Invalid title format from the shared URL, so we cannot read it.';
        }

        return window.atob(val);
      }),
    content: z
      .string()
      .nullable()
      .transform((val) => {
        if (!val) {
          return 'No content in the shared note';
        }

        if (!BASE64_REGEX.test(val)) {
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
 * Application data schema.
 */
export const dataSchema = z.object({
  notes: z.object({
    title: stringWithDefaultValue(),
    content: stringWithDefaultValue(),
    lastUpdated: stringAsCompatibleDate(),
    frozen: stringAsCompatibleBoolean(),
  }),
});

export type Data = z.infer<typeof dataSchema>;

export const DEFAULT_DATA: Data = {
  notes: {
    title: '',
    content: '',
    lastUpdated: '',
    frozen: false,
  },
};
