'use client';

import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import styles from './Input.module.scss';

// We want all of the base `textarea` props with the exception of `style` because we do not want to override the base style.
//
// We should use `ComponentPropsWithoutRef` to be explicit.
// Reference: https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#definitely-not-reacthtmlprops-or-reacthtmlattributes
type InputProps = {
  type: 'title' | 'content';
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
} & Omit<ComponentPropsWithoutRef<'textarea'>, 'style' | 'value' | 'onChange'>;

const Input = ({ type, value, onChange, ...rest }: InputProps) => {
  const style = [
    styles.base,
    type === 'title' ? styles.title : styles.content,
  ].join(' ');

  return (
    <TextareaAutosize
      className={style}
      onChange={onChange}
      value={value}
      placeholder={rest.placeholder}
      {...rest}
    />
  );
};

export default memo(Input);
