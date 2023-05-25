import { z } from 'zod';

export const storageKey = Object.freeze({
  TITLE_STORAGE_KEY: 'title',
  CONTENT_STORAGE_KEY: 'content',
  LAST_UPDATED_STORAGE_KEY: 'last-updated',
});

export const notesSchema = z.object({
  notes: z.object({
    // Coerce to `undefined` so we can always set the default value: https://github.com/colinhacks/zod/issues/2070.
    title: z
      .string()
      .nullish()
      .transform((x) => x ?? undefined)
      .default(''),
    content: z
      .string()
      .nullish()
      .transform((x) => x ?? undefined)
      .default(''),
    lastUpdated: z
      .string()
      .nullish()
      .transform((x) => x ?? undefined)
      .default(''),
  }),
});

export type Notes = z.infer<typeof notesSchema>;
