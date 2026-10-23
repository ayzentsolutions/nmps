import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-ink text-white hover:bg-slate-800",
      primary: "bg-teal text-white hover:bg-teal/90",
      secondary: "border border-slate-200 bg-white text-ink hover:bg-slate-50",
      outline: "border border-slate-300 bg-transparent text-ink hover:bg-slate-50",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      ghost: "text-ink hover:bg-slate-100",
      link: "text-teal underline-offset-4 hover:underline"
    },
    size: { default: "min-h-11 px-4 py-2", sm: "min-h-11 px-3 py-2", lg: "min-h-11 px-5 py-2.5", icon: "h-11 w-11" }
  },
  defaultVariants: { variant: "default", size: "default" }
});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean; }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Component = asChild ? Slot : "button";
  return <Component ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
});
Button.displayName = "Button";
export { Button, buttonVariants };