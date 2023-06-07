import NextLink, { type LinkProps as NextLinkProps } from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { memo } from 'react';

import styles from './Link.module.scss';

type ExternalLinkProps = {
  type: 'external';
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'target' | 'rel'>;

type InternalLinkProps = {
  type: 'internal';
} & Omit<NextLinkProps, 'href'>;

type LinkProps = {
  children: ReactNode;
  href: string;
} & (InternalLinkProps | ExternalLinkProps);

const Link = ({ type, children, href, ...rest }: LinkProps) => {
  if (type === 'external') {
    return (
      <a
        {...rest}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        href={href}
      >
        {children}
      </a>
    );
  }

  return (
    <NextLink {...rest} className={styles.link} href={href}>
      {children}
    </NextLink>
  );
};

export default memo(Link);
