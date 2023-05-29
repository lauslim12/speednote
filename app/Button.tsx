import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { memo } from 'react';

import styles from './Button.module.scss';

type ButtonProps = {
  children: ReactNode;
} & ComponentPropsWithoutRef<'button'>;

const Button = ({ children, ...rest }: ButtonProps) => (
  <button className={styles.button} {...rest}>
    {children}
  </button>
);

export default memo(Button);
