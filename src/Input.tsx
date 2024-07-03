import './Input.scss';

import type { JSX } from 'solid-js';

// We want all of the base `textarea` props with the exception of `style` because we do not want
// to override the base style. We should use `JSX.HTMLAttributes` to be explicit.
//
// Reference: https://github.com/solidjs/solid/discussions/970.
type InputProps = {
  type: 'title' | 'content';
} & JSX.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Input = (props: InputProps) => (
  <textarea
    class={`base ${props.type === 'title' ? 'title' : 'content'} ${props.readonly && 'frozen'}`}
    {...props}
  />
);

export default Input;
