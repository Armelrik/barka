import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-800 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-[#44382e] bg-[#44382e] text-white hover:bg-[#65513f] shadow-sm",
        outline:
          "border border-[#ded4c6] bg-white text-[#514332] hover:bg-[#f6f0e7]",
        ghost: "hover:bg-[#f6f0e7]",
      },
      size: { default: "h-12 px-5", sm: "h-10 px-4" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: Props) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
