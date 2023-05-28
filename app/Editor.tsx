'use client';

import { memo, useEffect, useState } from 'react';

import styles from './Editor.module.css';
import Input from './Input';
import { getNotes, storeContent, storeLastUpdated, storeTitle } from './store';
import useDebounce from './useDebounce';

const isValidTimestamp = (timestamp: string) => {
  return new Date(Number.parseInt(timestamp, 10)).getTime() > 0;
};

const displayReadableTime = (timestamp: string) => {
  if (!isValidTimestamp(timestamp)) {
    return '';
  }

  const parsedTimestamp = new Date(Number.parseInt(timestamp, 10));
  return Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'full',
    hourCycle: 'h23',
  }).format(parsedTimestamp);
};

/**
 * The performant note editor. This is premature optimization, but all of the states are intentionally
 * declared as strings instead of a single state in the form of an object. It is much faster to write to strings
 * compared to assigning values to objects.
 *
 * @returns React Functional Component.
 */
const Editor = () => {
  const { notes } = getNotes();
  const [title, setTitle] = useState(notes.title);
  const [content, setContent] = useState(notes.content);
  const [lastUpdated, setLastUpdated] = useState(notes.lastUpdated);
  const [isAutosaving, setIsAutosaving] = useState(false);

  const debouncedChangeTitle = useDebounce(() => storeTitle(title));
  const debouncedChangeContent = useDebounce(() => storeContent(content));
  const debouncedChangeLastUpdated = useDebounce(() =>
    storeLastUpdated(lastUpdated)
  );

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
          <time className={styles.time}>
            Last updated at {displayReadableTime(lastUpdated)}
          </time>
        ) : null}
      </section>

      <section className={styles.section}>
        <Input
          aria-label="Note title"
          type="title"
          placeholder="Enter a title"
          value={title}
          onChange={({ currentTarget: { value } }) => {
            setIsAutosaving(true);
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
          placeholder="Start writing, your progress will be automatically stored in your machine's local storage"
          value={content}
          onChange={({ currentTarget: { value } }) => {
            setIsAutosaving(true);
            setContent(value);
            setLastUpdated(Date.now().toString());
            debouncedChangeContent();
            debouncedChangeLastUpdated();
          }}
        />
      </section>
    </>
  );
};

export default memo(Editor);
