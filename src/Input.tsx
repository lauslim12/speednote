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
    class={`w-full resize-none border-none bg-transparent py-2 outline-none [field-sizing:content] read-only:text-frozen dark:text-white ${props.type === 'title' ? 'text-2xl font-black md:text-4xl' : 'text-base md:text-xl'}`}
    {...props}
  />
);

export default Input;
