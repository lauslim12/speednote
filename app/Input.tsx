'use client';

import type { ChangeEvent, HTMLProps } from 'react';
import { memo, useEffect, useRef } from 'react';

import styles from './Input.module.css';

const handleTextareaSizeChange = (textAreaRef: HTMLTextAreaElement | null) => {
  if (!textAreaRef) {
    return;
  }

  // We need to reset the height momentarily to get the correct scrollHeight for the textarea.
  textAreaRef.style.height = '0px';
  const scrollHeight = textAreaRef.scrollHeight;

  // We then set the height directly, outside of the render loop.
  // Trying to set this with state or a ref will product an incorrect value.
  textAreaRef.style.height = `${scrollHeight}px`;
};

interface InputProps extends HTMLProps<HTMLTextAreaElement> {
  type: 'title' | 'content';
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const Input = ({ type, value, onChange, ...rest }: InputProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const style = [
    styles.base,
    type === 'title' ? styles.title : styles.content,
  ].join(' ');

  // Auto-resize textarea on content growth.
  useEffect(() => {
    // When calling the `cleanup` function, there is a possibility that the `textAreaRef.current` will change. To keep
    // everything safe, we'll copy the reference here because it points to the React node anyways.
    const inputRef = textAreaRef.current;

    // Always change the text area size when the value changes.
    handleTextareaSizeChange(inputRef);

    // Resize is an edge-case: it'll only happen if the user is mischevious enough to resize the
    // window when typing in the text-area.
    window.addEventListener('resize', () => handleTextareaSizeChange(inputRef));

    // Return cleanup function.
    return () =>
      window.removeEventListener('resize', () =>
        handleTextareaSizeChange(inputRef)
      );
  }, [textAreaRef, value]);

  return (
    <textarea
      className={style}
      onChange={onChange}
      ref={textAreaRef}
      rows={1}
      value={value}
      placeholder={rest.placeholder}
      {...rest}
    />
  );
};

export default memo(Input);
