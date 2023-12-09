import { useSearchParams } from 'next/navigation';

import { sharedNoteSchema } from './schema';

/**
 * Hook to process and return the query parameters from the URL. Special query
 * parameters are treated as special characters to identify a special shared note.
 *
 * @returns Shared note parsed data.
 */
export const useSharedNoteQueryParams = () => {
  const searchParams = useSearchParams();
  const sharedTitle = searchParams.get('title');
  const sharedContent = searchParams.get('content');

  const rawSharedData = {
    isShared: [sharedTitle, sharedContent].some((val) => val !== null),
    title: searchParams.get('title'),
    content: searchParams.get('content'),
  };

  return sharedNoteSchema.parse(rawSharedData);
};
