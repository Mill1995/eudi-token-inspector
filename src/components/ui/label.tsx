import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">): React.JSX.Element {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-xs font-medium leading-none tracking-wide select-none",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
