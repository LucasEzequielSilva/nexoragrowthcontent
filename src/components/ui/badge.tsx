import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Fancy badge pills — gradient top-light to bottom-dark, white text, inner shadows
 */

const fancyShadow = "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),inset_0_-1px_0_0_rgba(0,0,0,0.12)] brightness-110";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold text-white transition-all duration-200 focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-primary brand-surface",
        secondary: `bg-gradient-to-b from-slate-400 to-slate-600 border border-slate-600 ${fancyShadow}`,
        destructive: "bg-destructive brand-surface",
        outline: [
          "bg-white text-foreground/70 !text-foreground/70",
          "border border-black/[0.08]",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),inset_0_-1px_0_0_rgba(0,0,0,0.04)]",
        ].join(" "),
        success: `bg-gradient-to-b from-emerald-400 to-emerald-600 border border-emerald-600 ${fancyShadow}`,
        warning: `bg-gradient-to-b from-amber-400 to-amber-600 border border-amber-600 ${fancyShadow}`,
        info: `bg-gradient-to-b from-blue-400 to-blue-600 border border-blue-600 ${fancyShadow}`,
        violet: `bg-gradient-to-b from-violet-400 to-violet-600 border border-violet-600 ${fancyShadow}`,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
