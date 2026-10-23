import * as React from "react";
import { cn } from "@/lib/utils";
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => (
  <input type={type} className={cn("flex min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-ink placeholder:text-slate-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60", className)} ref={ref} {...props} />
));
Input.displayName = "Input";
export { Input };