import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full min-w-0 max-w-full rounded-[inherit] [&>div]:!block [&>div]:min-w-0 [&>div]:max-w-full">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "group flex touch-none select-none transition-opacity duration-200 data-[state=hidden]:opacity-0",
      orientation === "vertical" &&
        "h-full w-[13px] justify-center rounded-[var(--radius)] border border-border/30 bg-muted/40 py-2 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)] px-0.5 dark:border-border/40 dark:bg-muted/25 dark:shadow-none sm:w-[14px]",
      orientation === "horizontal" &&
        "h-[13px] w-full flex-col rounded-[var(--radius)] border border-border/30 bg-muted/40 px-2 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)] py-0.5 dark:border-border/40 dark:bg-muted/25 dark:shadow-none sm:h-[14px]",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={cn(
        "relative flex-1 rounded-lg border border-background/80 bg-clip-padding transition-colors",
        "min-h-[2.25rem] bg-primary/42 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.22)]",
        "group-hover:bg-primary/52 group-active:bg-primary/58",
        "dark:border-background/25 dark:bg-primary/30 dark:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08)] dark:group-hover:bg-primary/42 dark:group-active:bg-primary/48",
      )}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
