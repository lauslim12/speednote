'use client';

import type { ComponentPropsWithoutRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import styles from './Input.module.scss';

// We want all of the base `textarea` props with the exception of `style` because we do not want to override the base style.
//
// We should use `ComponentPropsWithoutRef` to be explicit.
// Reference: https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#definitely-not-reacthtmlprops-or-reacthtmlattributes
type InputProps = {
  id: string;
  type: 'title' | 'content';
  value: string;
  readOnly: boolean;
} & Omit<ComponentPropsWithoutRef<'textarea'>, 'style'>;

const Input = ({
  id,
  type,
  value,
  readOnly,
  onChange,
  ...rest
}: InputProps) => {
  const style = [
    styles.base,
    type === 'title' ? styles.title : styles.content,
    readOnly && styles.frozen, // Apply `readOnly` specific styles if it's set to `true`.
  ].join(' ');

  return (
    <TextareaAutosize
      id={id}
      className={style}
      onChange={onChange}
      value={value}
      readOnly={readOnly}
      {...rest}
    />
  );
};

export default Input;
