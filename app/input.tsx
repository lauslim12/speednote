import { useId } from "react";
import TextareaAutosize, {
	type TextareaAutosizeProps,
} from "react-textarea-autosize";
import { cn } from "~/cn";

/**
 * Props for the input component.
 */
interface InputProps extends TextareaAutosizeProps {
	type: "title" | "content" | "generic";
}

/**
 * Exported input component, with auto-resize.
 */
export const Input = ({ type, className, ...props }: InputProps) => {
	const id = useId();

	return (
		<TextareaAutosize
			className={cn(
				"w-full resize-none border-none py-2 outline-hidden",
				"placeholder:text-stone-400 dark:placeholder:text-stone-600",
				"placeholder:transition-colors placeholder:duration-300 placeholder:ease-in-out",
				"read-only:text-stone-500 dark:read-only:text-stone-400",
				"transition-colors duration-300 ease-in-out",
				{
					"font-black text-2xl/[3rem] md:text-4xl/[3rem]": type === "title",
					"text-base/8 md:text-xl/8": type === "content",
				},
				className,
			)}
			id={id}
			{...props}
		/>
	);
};
