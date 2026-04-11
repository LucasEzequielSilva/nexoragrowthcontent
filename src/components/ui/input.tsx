import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl",
          "bg-secondary",
          "border border-border",
          "shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
          "px-4 py-2 text-sm text-foreground",
          "ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
