import { A } from '@solidjs/router';
import { children, type JSX } from 'solid-js';

type LinkProps = {
  type: 'internal' | 'external';
  href: string;
} & JSX.AnchorHTMLAttributes<HTMLAnchorElement>;

const Link = (props: LinkProps) => {
  const c = children(() => props.children);

  if (props.type === 'external') {
    return (
      <a {...props} target="_blank" rel="noopener noreferrer" class="link">
        {c()}
      </a>
    );
  }

  return (
    <A {...props} class="link">
      {c()}
    </A>
  );
};

export default Link;
