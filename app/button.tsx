import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '~/cn';

/**
 * Props for the button component.
 */
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
	variant?: 'primary' | 'secondary';
	onPress?: () => void;
	children: ReactNode;
}

/**
 * Variants for the button.
 */
const variantClass = {
	primary: cn(
		'border-b border-current',
		'text-red-500 hover:text-red-600',
		'dark:text-red-400 dark:hover-text-red-300',
		'disabled:text-orange-500 disabled:dark:text-orange-400',
		'transition-colors duration-200',
	),
	secondary: cn(
		'text-sm',
		'text-gray-400 hover:text-gray-600',
		'dark:text-gray-600 dark:hover:text-gray-400',
		'transition-colors duration-300',
	),
};

/**
 * Exported button component.
 */
export const Button = ({
	children,
	className,
	variant = 'primary',
	...props
}: ButtonProps) => {
	const style = variantClass[variant];

	return (
		<button type="button" className={cn('p-0.5', style, className)} {...props}>
			{children}
		</button>
	);
};
