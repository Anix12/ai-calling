import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-600 text-white shadow-[0_1px_2px_rgb(16_24_40/0.1),inset_0_1px_0_rgb(255_255_255/0.18)] hover:bg-accent-700",
        secondary:
          "border border-line bg-white text-ink shadow-[0_1px_2px_rgb(16_24_40/0.05)] hover:border-[#d0d5dd] hover:bg-soft",
        dark: "bg-ink text-white hover:bg-ink-soft",
        light: "bg-white text-ink hover:bg-white/90",
        outlineLight: "border border-white/20 text-white hover:bg-white/10",
        ghost: "text-ink-soft hover:bg-line-soft hover:text-ink",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children: React.ReactNode;
} & (
    | ({ href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">)
    | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  );

export function Button({ variant, size, className, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if ("href" in props && props.href !== undefined) {
    return (
      <Link className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
