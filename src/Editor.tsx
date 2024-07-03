import './Editor.scss';

import { debounce } from '@solid-primitives/scheduled';
import { useSearchParams } from '@solidjs/router';
import {
  type Accessor,
  createSignal,
  Match,
  Show,
  splitProps,
  Switch,
} from 'solid-js';

import Button from './Button';
import { createLocalDatabase, type DatabaseService } from './database';
import Input from './Input';
import Link from './Link';
import { type Data, sharedContentSchema, sharedTitleSchema } from './schema';
import { createApplicationStore, type StoreService } from './store';

/**
 * The root of the editor. Will not fetch from the `localStorage` if observing
 * a shared note. If observing a normal note, then the data will be loaded from
 * the `localStorage`. This is done to achieve the Single-Responsibility Principle (SRP).
 */
const Editor = () => {
  const [searchParams] = useSearchParams();
  const sharedTitle = () => searchParams?.title;
  const sharedContent = () => searchParams?.content;

  return (
    <Switch fallback={<NoteEditorRoot />}>
      <Match when={sharedTitle() || sharedContent()}>
        <SharedNote
          title={sharedTitleSchema.parse(sharedTitle())}
          content={sharedContentSchema.parse(sharedContent())}
        />
      </Match>
    </Switch>
  );
};

type SharedNoteProps = {
  title: string;
  content: string;
};

/**
 * In this component, the `value` of the `title` and `content` has to be inserted into
 * `decodeURIComponent` to prevent errors when sharing notes with Kanji characters, or any
 * other characters outside of the `Latin1` range.
 *
 * {@link https://github.com/lauslim12/speednote/issues/36}
 */
const SharedNote = ({ title, content }: SharedNoteProps) => (
  <>
    <section class="section">
      <Input
        id="note-title"
        aria-label="Note title"
        type="title"
        placeholder={title}
        value={decodeURIComponent(title)}
        readonly
      />
    </section>

    <section class="section">
      <Input
        id="note-content"
        aria-label="Note content"
        type="content"
        placeholder={content}
        value={decodeURIComponent(content)}
        readonly
      />
    </section>

    <section class="section">
      <Link type="internal" href="/">
        Return to your note
      </Link>
    </section>
  </>
);

const NoteEditorRoot = () => {
  const storage = createLocalDatabase(localStorage);
  const { state, store } = createApplicationStore(storage.getData());

  return <NoteEditor storage={storage} state={state} store={store} />;
};

type Save = 'initial' | 'saving' | 'saved';

type MetadataProps = {
  save: Accessor<Save>;
  state: Data;
};

const Metadata = (props: MetadataProps) => {
  const timestamp = () =>
    new Date(Number.parseInt(props.state.notes.lastUpdated, 10));
  const formattedTimestamp = () =>
    timestamp().getTime() > 0
      ? Intl.DateTimeFormat(undefined, {
          dateStyle: 'full',
          timeStyle: 'full',
          hourCycle: 'h23',
        }).format(timestamp())
      : null;

  return (
    <>
      <Show when={formattedTimestamp() !== null}>
        <time class="time">Last updated at {formattedTimestamp()}.</time>
      </Show>

      <Switch>
        <Match when={props.save() === 'saving'}>
          <span class="autosave">Saving...</span>
        </Match>
        <Match when={props.save() === 'saved'}>
          <span class="autosave">Saved.</span>
        </Match>
      </Switch>
    </>
  );
};

type ActionBaseProps = {
  state: Data;
  store: StoreService;
  onSave: () => void;
};

const InternalNoteAction = (props: ActionBaseProps) => {
  const [lastChanges, setLastChanges] = createSignal('');

  const handleClear = () => {
    setLastChanges(props.state.notes.content);
    props.store.resetContent(Date.now().toString());
    props.onSave();
  };

  const handleFreezeNote = (nextValue: boolean) => () => {
    props.store.setFrozen(nextValue);
    props.onSave();
  };

  const handleUndo = () => {
    props.store.setContent(lastChanges(), Date.now().toString());
    setLastChanges('');
    props.onSave();
  };

  return (
    <>
      <Button onClick={handleClear} disabled={props.state.notes.frozen}>
        Clear content
      </Button>

      <Button onClick={handleFreezeNote(!props.state.notes.frozen)}>
        {props.state.notes.frozen ? 'Unfreeze note' : 'Freeze note'}
      </Button>

      {lastChanges() && <Button onClick={handleUndo}>Undo clear</Button>}
    </>
  );
};

const ExternalNoteAction = (props: ActionBaseProps) => {
  const handleShareNote = () => {
    // Save the note initially, so we're using the final state.
    props.onSave();

    // Set new query parameters. Encode as URI component to prevent
    // failure when sharing Kanji characters or any other characters
    // that exist outside of the Latin1 range.
    // Reference: https://github.com/lauslim12/speednote/issues/36.
    const newSearchParams = new URLSearchParams();
    if (props.state.notes.title !== '') {
      const { title } = props.store.getState().notes;
      newSearchParams.set('title', window.btoa(encodeURIComponent(title)));
    }

    if (props.state.notes.content !== '') {
      const { content } = props.store.getState().notes;
      newSearchParams.set('content', window.btoa(encodeURIComponent(content)));
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

type NoteEditorProps = {
  storage: DatabaseService;
  state: Data;
  store: StoreService;
};

const NoteEditor = (props: NoteEditorProps) => {
  const [save, setSave] = createSignal<Save>('initial');
  const [, others] = splitProps(props, ['storage']);

  const debouncedSave = debounce(() => {
    props.storage.setData(props.store.getState());
    setSave('saved');
  }, 100);

  const handleChangeEditor = () => {
    setSave('saving');
    debouncedSave();
  };

  const handleNoteActionSave = () => {
    // Cancel the debounce operation and explicitly write the contents of our store
    // into the storage. The state is reactive as it's SolidJS, so it will not 'lag' and
    // use an outdated / fail to save like https://github.com/lauslim12/speednote/issues/31.
    debouncedSave.clear();
    props.storage.setData(props.store.getState());
    setSave('saved');
  };

  return (
    <>
      <section class="section">
        <Metadata {...others} save={save} />
      </section>

      <section class="section">
        <Input
          id="note-title"
          aria-label="Note title"
          type="title"
          placeholder="Enter a title"
          value={props.state.notes.title}
          readonly={props.state.notes.frozen}
          onInput={({ currentTarget: { value } }) => {
            props.store.setTitle(value, Date.now().toString());
            handleChangeEditor();
          }}
        />
      </section>

      <section class="section">
        <Input
          id="note-content"
          aria-label="Note content"
          type="content"
          placeholder={
            "Start writing, your progress will be automatically stored in your machine's local storage"
          }
          value={props.state.notes.content}
          readonly={props.state.notes.frozen}
          onInput={({ currentTarget: { value } }) => {
            props.store.setContent(value, Date.now().toString());
            handleChangeEditor();
          }}
        />
      </section>

      <section class="section">
        <InternalNoteAction {...others} onSave={handleNoteActionSave} />
      </section>

      <section class="section">
        <ExternalNoteAction {...others} onSave={handleNoteActionSave} />
      </section>
    </>
  );
};

export default Editor;
