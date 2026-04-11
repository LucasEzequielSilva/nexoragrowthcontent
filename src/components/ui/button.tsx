import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13px] font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-primary/80 to-primary text-primary-foreground brand-surface",
        destructive: "bg-gradient-to-b from-destructive/80 to-destructive text-destructive-foreground brand-surface",
        outline: [
          "bg-card text-foreground/75",
          "border border-border",
          "shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
          "hover:bg-accent hover:text-foreground",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "border border-border/60",
          "shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
          "hover:brightness-110",
        ].join(" "),
        ghost: [
          "text-muted-foreground",
          "hover:bg-accent hover:text-foreground",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-11 px-7",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
