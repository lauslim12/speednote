import './Button.scss';

import { children, type JSX } from 'solid-js';

const Button = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const c = children(() => props.children);

  return (
    <button class="button" {...props}>
      {c()}
    </button>
  );
};

export default Button;
