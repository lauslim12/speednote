import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "~/cn";

/**
 * Props for the link component.
 */
interface LinkProps extends ComponentPropsWithoutRef<"a"> {
	variant?: "small" | "medium";
	href: string;
	children: ReactNode;
}

/**
 * Variants for the link.
 */
const variantClass = {
	medium: cn("text-md"),
	small: cn("text-sm"),
};

/**
 * Link component. Shares the same design and variants with the button.
 */
export const Link = ({
	children,
	href,
	className,
	variant = "small",
	...props
}: LinkProps) => {
	const style = variantClass[variant];

	return (
		<a
			className={cn(
				style,
				"p-0.5",
				"text-gray-400 hover:text-gray-600",
				"dark:text-gray-600 dark:hover:text-gray-400",
				"transition-colors duration-300",
				className,
			)}
			href={href}
			{...props}
		>
			{children}
		</a>
	);
};
