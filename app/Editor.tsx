'use client';

import { memo, useEffect, useState } from 'react';

import styles from './Editor.module.css';
import Input from './Input';
import { getNotes, storeContent, storeLastUpdated, storeTitle } from './store';
import useDebounce from './useDebounce';

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
  const debouncedChangeTitle = useDebounce(() => storeTitle(title));
  const debouncedChangeContent = useDebounce(() => storeContent(content));
  const debouncedChangeLastUpdated = useDebounce(() =>
    storeLastUpdated(lastUpdated)
  );

  useEffect(() => {
    // Make sure to invoke and clean the debounces when the component unmounts.
    return () => {
      debouncedChangeTitle.flush();
      debouncedChangeContent.flush();
      debouncedChangeLastUpdated.flush();
    };
  }, [
    debouncedChangeTitle,
    debouncedChangeContent,
    debouncedChangeLastUpdated,
  ]);

  return (
    <>
      <section className={styles.section}>
        {lastUpdated && (
          <p className={styles.time}>
            Last updated at{' '}
            {Intl.DateTimeFormat(undefined, {
              dateStyle: 'full',
              timeStyle: 'full',
              hour12: false,
            }).format(new Date(Number.parseInt(lastUpdated, 10)))}
          </p>
        )}
      </section>

      <section className={styles.section}>
        <Input
          aria-label="Note title"
          type="title"
          placeholder="Enter a title"
          value={title}
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
          placeholder="Start writing, your progress will be automatically stored in your machine's local storage"
          value={content}
          onChange={({ currentTarget: { value } }) => {
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
