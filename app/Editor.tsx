'use client';

import { type ChangeEvent, useState } from 'react';
import { type StoreApi } from 'zustand';

import Button from './Button';
import styles from './Editor.module.scss';
import Input from './Input';
import Link from './Link';
import { type State } from './schema';
import {
  ApplicationContext,
  createApplicationStore,
  useData,
} from './use-data';
import { useDebounce } from './use-debounce';
import { useSharedNote } from './use-shared-note';
import { type DataService, useStorage } from './use-storage';

/**
 * The root of the editor. Will not fetch from the `localStorage` if observing
 * a shared note. If observing a normal note, then the data will be loaded from
 * the `localStorage`. This is done to achieve the Single-Responsibility Principle (SRP).
 */
const Editor = () => {
  const sharedNote = useSharedNote();
  if (sharedNote.isShared) {
    return <SharedNote title={sharedNote.title} content={sharedNote.content} />;
  }

  return <NoteEditorRoot />;
};

type SharedNoteProps = {
  title: string;
  content: string;
};

const SharedNote = ({ title, content }: SharedNoteProps) => {
  return (
    <>
      <section className={styles.section}>
        <Input
          id="note-title"
          aria-label="Note title"
          type="title"
          placeholder={title}
          value={title}
          readOnly
        />
      </section>

      <section className={styles.section}>
        <Input
          id="note-content"
          aria-label="Note content"
          type="content"
          placeholder={content}
          value={content}
          readOnly
        />
      </section>

      <section className={styles.section}>
        <Link type="internal" href="/">
          Return to your note
        </Link>
      </section>
    </>
  );
};

const NoteEditorRoot = () => {
  const storage = useStorage();

  // Lazily initialize the initial value, this `useState` is identical
  // to `useRef` and will not cause any subsequent re-renders.
  // Ref: https://kentcdodds.com/blog/use-state-lazy-initialization-and-function-updates
  const [store] = useState(() => createApplicationStore(storage.getData()));

  return <NoteEditor storage={storage} store={store} />;
};

type NoteEditorProps = {
  storage: DataService;
  store: StoreApi<State>;
};

type Save = 'initial' | 'saving' | 'saved';

type MetadataProps = {
  save: Save;
};

const Metadata = ({ save }: MetadataProps) => {
  const lastUpdated = useData((state) => state.notes.lastUpdated);
  const timestamp = new Date(Number.parseInt(lastUpdated, 10));
  const formattedTimestamp =
    timestamp.getTime() > 0
      ? {
          valid: true,
          value: Intl.DateTimeFormat(undefined, {
            dateStyle: 'full',
            timeStyle: 'full',
            hourCycle: 'h23',
          }).format(timestamp),
        }
      : { valid: false };

  return (
    <>
      {formattedTimestamp.valid ? (
        <time role="time" className={styles.time}>
          Last updated at {formattedTimestamp.value}.
        </time>
      ) : null}
      {save === 'initial' ? null : save === 'saving' ? (
        <span className={styles.autosave}>Saving...</span>
      ) : (
        <span className={styles.autosave}>Saved.</span>
      )}
    </>
  );
};

type EditorBaseProps = {
  onChange: () => void;
};

const TitleEditor = ({ onChange }: EditorBaseProps) => {
  const title = useData((state) => state.notes.title);
  const frozen = useData((state) => state.notes.frozen);
  const setTitle = useData((state) => state.setTitle);

  const handleChangeTitle = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.currentTarget.value, Date.now().toString());
    onChange();
  };

  return (
    <Input
      id="note-title"
      aria-label="Note title"
      type="title"
      placeholder="Enter a title"
      value={title}
      readOnly={frozen}
      onChange={handleChangeTitle}
    />
  );
};

const ContentEditor = ({ onChange }: EditorBaseProps) => {
  const content = useData((state) => state.notes.content);
  const frozen = useData((state) => state.notes.frozen);
  const setContent = useData((state) => state.setContent);

  const handleChangeContent = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.currentTarget.value, Date.now().toString());
    onChange();
  };

  return (
    <Input
      id="note-content"
      aria-label="Note content"
      type="content"
      placeholder={
        "Start writing, your progress will be automatically stored in your machine's local storage"
      }
      value={content}
      readOnly={frozen}
      onChange={handleChangeContent}
    />
  );
};

type ActionBaseProps = {
  onSave: () => void;
};

const InternalNoteAction = ({ onSave }: ActionBaseProps) => {
  const content = useData((state) => state.notes.content);
  const frozen = useData((state) => state.notes.frozen);
  const setContent = useData((state) => state.setContent);
  const setFrozen = useData((state) => state.setFrozen);
  const [lastChanges, setLastChanges] = useState('');

  const handleClear = () => {
    setLastChanges(content);
    setContent('', Date.now().toString());
    onSave();
  };

  const handleFreezeNote = (nextValue: boolean) => () => {
    setFrozen(nextValue);
    onSave();
  };

  const handleUndo = () => {
    setLastChanges('');
    setContent(lastChanges, Date.now().toString());
    onSave();
  };

  return (
    <>
      <Button onClick={handleClear} disabled={frozen}>
        Clear content
      </Button>

      <Button onClick={handleFreezeNote(!frozen)}>
        {frozen ? 'Unfreeze note' : 'Freeze note'}
      </Button>

      {lastChanges && <Button onClick={handleUndo}>Undo clear</Button>}
    </>
  );
};

const ExternalNoteAction = ({ onSave }: ActionBaseProps) => {
  const title = useData((state) => state.notes.title);
  const content = useData((state) => state.notes.content);

  const handleShareNote = () => {
    // Save the note initially, so we're using the final state.
    onSave();

    // Set new query parameters.
    const newSearchParams = new URLSearchParams();
    if (title !== '') {
      newSearchParams.set('title', window.btoa(title));
    }

    if (content !== '') {
      newSearchParams.set('content', window.btoa(content));
    }

    // Copy the URL the user's clipboard. I know that the `writeText` is supposed
    // to be asynchronous, but for some reason, if I `await` it, it doesn't work
    // in one phone, but works in other devices. Because it's really strange, I decided
    // to just not put `await` in front of the function call.
    const url = `${window.location.href}?${newSearchParams.toString()}`;
    navigator.clipboard.writeText(url);
  };

  return <Button onClick={handleShareNote}>Copy/share note link</Button>;
};

const NoteEditor = ({ storage, store }: NoteEditorProps) => {
  const [save, setSave] = useState<Save>('initial');

  const debouncedSave = useDebounce(() => {
    storage.setData(store.getState());
    setSave('saved');
  });

  const handleChangeEditor = () => {
    setSave('saving');
    debouncedSave();
  };

  const handleNoteActionSave = () => {
    // Flush/execute the debounce and get the latest state. In the storage setter function call,
    // the get state call is reactive as it's using Zustand, so it will not 'lag' and
    // fail to save like the problem that happened in https://github.com/lauslim12/speednote/issues/31.
    debouncedSave.flush();
    storage.setData(store.getState());
    setSave('saved');
  };

  return (
    <ApplicationContext.Provider value={store}>
      <section className={styles.section}>
        <Metadata save={save} />
      </section>

      <section className={styles.section}>
        <TitleEditor onChange={handleChangeEditor} />
      </section>

      <section className={styles.section}>
        <ContentEditor onChange={handleChangeEditor} />
      </section>

      <section className={styles.section}>
        <InternalNoteAction onSave={handleNoteActionSave} />
      </section>

      <section className={styles.section}>
        <ExternalNoteAction onSave={handleNoteActionSave} />
      </section>
    </ApplicationContext.Provider>
  );
};

export default Editor;
