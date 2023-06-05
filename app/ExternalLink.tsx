import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { memo } from 'react';

import styles from './ExternalLink.module.scss';

type ExternalLinkProps = {
  children: ReactNode;
  href: string;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'target' | 'rel'>;

const ExternalLink = ({ children, href, ...rest }: ExternalLinkProps) => (
  <a
    target="_blank"
    rel="noopener noreferrer"
    className={styles.externalLink}
    href={href}
    {...rest}
  >
    {children}
  </a>
);

export default memo(ExternalLink);
