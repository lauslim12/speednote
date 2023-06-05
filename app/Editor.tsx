'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { memo, useEffect, useState } from 'react';

import Button from './Button';
import styles from './Editor.module.scss';
import Input from './Input';
import { sharedNoteSchema } from './schema';
import {
  getData,
  storeContent,
  storeFrozen,
  storeLastUpdated,
  storeTitle,
} from './store';
import useDebounce from './useDebounce';

const isValidTimestamp = (timestamp: string) => {
  return new Date(Number.parseInt(timestamp, 10)).getTime() > 0;
};

const displayReadableTime = (timestamp: string) => {
  // Falls back to the browser's settings.
  const parsedTimestamp = new Date(Number.parseInt(timestamp, 10));
  return Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'full',
    hourCycle: 'h23',
  }).format(parsedTimestamp);
};

/**
 * Hook to process and return the query parameters inputted into the application by the user.
 *
 * @returns Shared note parsed data.
 */
const useSharedNoteQueryParams = () => {
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

/**
 * The performant note editor. This is premature optimization, but all of the states are intentionally
 * declared as strings instead of a single state in the form of an object. It is much faster to write to strings
 * compared to assigning values to objects.
 *
 * @returns React Functional Component.
 */
const Editor = () => {
  const sharedNote = useSharedNoteQueryParams();
  const { config, notes } = getData();

  const [title, setTitle] = useState(notes.title || '');
  const [content, setContent] = useState(notes.content || '');
  const [lastUpdated, setLastUpdated] = useState(notes.lastUpdated);
  const [frozen, setFrozen] = useState(config.frozen);
  const [lastChanges, setLastChanges] = useState('');

  const debouncedChangeTitle = useDebounce(() => storeTitle(title));
  const debouncedChangeContent = useDebounce(() => storeContent(content));
  const debouncedChangeLastUpdated = useDebounce(() =>
    storeLastUpdated(lastUpdated)
  );

  const handleContentActionButtonClick = (type: 'clear' | 'undo') => () => {
    // Cancel all pending debounces.
    debouncedChangeContent.cancel();
    debouncedChangeLastUpdated.cancel();

    // Store changes now without debouncing.
    if (type === 'undo') {
      setLastChanges('');
      setContent(lastChanges);
    } else {
      setLastChanges(content);
      setContent('');
    }
    setLastUpdated(Date.now().toString());

    // Sync with store
    storeLastUpdated(Date.now().toString());
    storeContent(lastChanges);
  };

  const handleFreezeButtonClick = () => {
    setFrozen((prevState) => {
      debouncedChangeTitle.flush();
      debouncedChangeContent.flush();
      debouncedChangeLastUpdated.flush();

      const nextState = prevState === 'true' ? 'false' : 'true';
      storeFrozen(nextState);

      return nextState;
    });
  };

  const handleShareButtonClick = async () => {
    // Invoke all debounces to make sure all of the states are in their final value.
    debouncedChangeTitle.flush();
    debouncedChangeContent.flush();

    // Set new query parameters.
    const newSearchParams = new URLSearchParams(window.location.search);
    if (title !== '') {
      newSearchParams.set('title', window.btoa(title));
    }

    if (content !== '') {
      newSearchParams.set('content', window.btoa(content));
    }

    // Copy into the user's clipboard.
    const url = `${window.location.origin}?${newSearchParams.toString()}`;
    await navigator.clipboard.writeText(url);
  };

  useEffect(() => {
    const invokeDebounces = () => {
      debouncedChangeTitle.flush();
      debouncedChangeContent.flush();
      debouncedChangeLastUpdated.flush();
    };

    // Make sure to invoke the debounces when the component unmounts. This makes sense
    // because writing to `localStorage` is a synchronous operation, so this is better
    // than cancelling the debounces.
    return () => invokeDebounces();
  }, [
    debouncedChangeTitle,
    debouncedChangeContent,
    debouncedChangeLastUpdated,
  ]);

  return (
    <>
      <section className={styles.section}>
        {lastUpdated && isValidTimestamp(lastUpdated) ? (
          <time role="time" className={styles.time}>
            Last updated at {displayReadableTime(lastUpdated)}
          </time>
        ) : null}
      </section>

      <section className={styles.section}>
        <Input
          aria-label="Note title"
          type="title"
          placeholder={sharedNote.isShared ? sharedNote.title : 'Enter a title'}
          value={sharedNote.isShared ? sharedNote.title : title}
          readOnly={sharedNote.isShared ? 'true' : frozen}
          onChange={({ currentTarget: { value } }) => {
            setTitle(value);
            setLastUpdated(Date.now().toString());
            debouncedChangeTitle();
            debouncedChangeLastUpdated();
          }}
        />
      </section>

      <section className={styles.section}>
        <Input
          aria-label="Note content"
          type="content"
          placeholder={
            sharedNote.isShared
              ? sharedNote.content
              : "Start writing, your progress will be automatically stored in your machine's local storage"
          }
          value={sharedNote.isShared ? sharedNote.content : content}
          readOnly={sharedNote.isShared ? 'true' : frozen}
          onChange={({ currentTarget: { value } }) => {
            setContent(value);
            setLastUpdated(Date.now().toString());
            debouncedChangeContent();
            debouncedChangeLastUpdated();
          }}
        />
      </section>

      <section className={styles.section}>
        <Button onClick={handleContentActionButtonClick('clear')}>
          Clear content
        </Button>

        {!sharedNote.isShared && (
          <Button onClick={handleFreezeButtonClick}>
            {frozen === 'true' ? 'Unfreeze note' : 'Freeze note'}
          </Button>
        )}

        {lastChanges && (
          <Button onClick={handleContentActionButtonClick('undo')}>
            Undo clear
          </Button>
        )}
      </section>

      <section className={styles.section}>
        {sharedNote.isShared && (
          <Link className={styles.internalLink} href="/">
            Return to your note
          </Link>
        )}

        <Button onClick={handleShareButtonClick}>Copy/share note link</Button>
      </section>
    </>
  );
};

export default memo(Editor);
