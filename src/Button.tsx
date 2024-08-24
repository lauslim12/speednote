import { children, type JSX } from 'solid-js';

const Button = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const c = children(() => props.children);

  return (
    <button
      class="cursor-pointer border-b border-current p-0.5 text-thanks transition-all duration-200 hover:text-time focus:scale-105 focus:shadow-emboss disabled:cursor-not-allowed disabled:text-time disabled:opacity-25"
      {...props}
    >
      {c()}
    </button>
  );
};

export default Button;
