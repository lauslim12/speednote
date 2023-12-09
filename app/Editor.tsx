'use client';

import { type ChangeEvent, memo, useEffect, useState } from 'react';

import Button from './Button';
import styles from './Editor.module.scss';
import Input from './Input';
import Link from './Link';
import { type Data } from './schema';
import { useData } from './use-data';
import { useDebounce } from './use-debounce';
import { useSharedNoteQueryParams } from './use-shared-note';
import { type DataService, useStorage } from './use-storage';

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
 * The root of the note editor, will initially load from the local storage before
 * mounting the content of the note editor with the data.
 */
const Editor = () => {
  const [initialValue, setInitialValue] = useState<Data | null>(null);
  const storage = useStorage();

  useEffect(() => {
    setInitialValue(storage.getData());
  }, [storage]);

  if (initialValue === null) {
    return null;
  }

  return <EditorContent storage={storage} initialValue={initialValue} />;
};

type EditorContentProps = {
  storage: DataService;
  initialValue: Data;
};

type Save = 'initial' | 'saving' | 'saved';

const EditorContent = ({ storage, initialValue }: EditorContentProps) => {
  const sharedNote = useSharedNoteQueryParams();
  const { state, setTitle, setContent, setFrozen } = useData(initialValue);
  const [save, setSave] = useState<Save>('initial');
  const [lastChanges, setLastChanges] = useState('');

  // Special function to write to the data store.
  const writeToStorage = () => {
    storage.setData(state);
    setSave('saved');
  };

  // Special React optimized debounce which will write to the
  // `localStorage` once an interval has passed. This is to create
  // an 'autosave-like' behavior.
  const debouncedSave = useDebounce(() => writeToStorage());

  const handleChangeTitle = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.currentTarget.value, Date.now().toString());
    setSave('saving');
    debouncedSave();
  };

  const handleChangeContent = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.currentTarget.value, Date.now().toString());
    setSave('saving');
    debouncedSave();
  };

  const handleClear = () => {
    // Cancel pending debounce, set relevant state, then store immediately.
    debouncedSave.cancel();
    setLastChanges(state.notes.content);
    setContent('', Date.now().toString());
    writeToStorage();
  };

  const handleFreezeNote = () => {
    setFrozen(!state.notes.frozen);
    writeToStorage();
  };

  const handleShareNote = () => {
    // Invoke debounce to make sure all of the states are in their final value.
    debouncedSave.flush();

    // Set new query parameters.
    const newSearchParams = new URLSearchParams();
    if (state.notes.title !== '') {
      newSearchParams.set('title', window.btoa(state.notes.title));
    }

    if (state.notes.content !== '') {
      newSearchParams.set('content', window.btoa(state.notes.content));
    }

    // Copy the URL the user's clipboard. I know that the `writeText` is supposed
    // to be asynchronous, but for some reason, if I `await` it, it doesn't work
    // in one phone, but works in other devices. Because it's really strange, I decided
    // to just not put `await` in front of the function call.
    const url = `${window.location.href}?${newSearchParams.toString()}`;
    navigator.clipboard.writeText(url);
  };

  const handleUndo = () => {
    // Cancel pending debounce, set the relevant state, then store immediately.
    debouncedSave.cancel();
    setLastChanges('');
    setContent(lastChanges, Date.now().toString());
    writeToStorage();
  };

  useEffect(() => {
    const invokeDebounces = () => {
      debouncedSave.flush();
    };

    // Make sure to invoke the debounces when the component unmounts. This makes sense
    // because writing to `localStorage` is a synchronous operation, so this is better
    // than cancelling the debounces.
    return () => invokeDebounces();
  }, [debouncedSave]);

  return (
    <>
      <section className={styles.section}>
        {state.notes.lastUpdated &&
        isValidTimestamp(state.notes.lastUpdated) ? (
          <time role="time" className={styles.time}>
            Last updated at {displayReadableTime(state.notes.lastUpdated)}.
          </time>
        ) : null}{' '}
        {save === 'initial' ? null : save === 'saving' ? (
          <span className={styles.time}>Saving...</span>
        ) : (
          <span className={styles.time}>Saved.</span>
        )}
      </section>

      <section className={styles.section}>
        {sharedNote.isShared ? (
          <Input
            id="note-title"
            aria-label="Note title"
            type="title"
            placeholder={sharedNote.title}
            value={sharedNote.title}
            readOnly
          />
        ) : (
          <Input
            id="note-title"
            aria-label="Note title"
            type="title"
            placeholder="Enter a title"
            value={state.notes.title}
            readOnly={state.notes.frozen}
            onChange={handleChangeTitle}
          />
        )}
      </section>

      <section className={styles.section}>
        {sharedNote.isShared ? (
          <Input
            id="note-content"
            aria-label="Note content"
            type="content"
            placeholder={sharedNote.content}
            value={sharedNote.content}
            readOnly
          />
        ) : (
          <Input
            id="note-content"
            aria-label="Note content"
            type="content"
            placeholder={
              "Start writing, your progress will be automatically stored in your machine's local storage"
            }
            value={state.notes.content}
            readOnly={state.notes.frozen}
            onChange={handleChangeContent}
          />
        )}
      </section>

      {!sharedNote.isShared && (
        <section className={styles.section}>
          <Button onClick={handleClear} disabled={state.notes.frozen}>
            Clear content
          </Button>

          <Button onClick={handleFreezeNote}>
            {state.notes.frozen ? 'Unfreeze note' : 'Freeze note'}
          </Button>

          {lastChanges && <Button onClick={handleUndo}>Undo clear</Button>}
        </section>
      )}

      <section className={styles.section}>
        {sharedNote.isShared && (
          <Link type="internal" href="/">
            Return to your note
          </Link>
        )}

        <Button onClick={handleShareNote}>Copy/share note link</Button>
      </section>
    </>
  );
};

export default memo(Editor);
