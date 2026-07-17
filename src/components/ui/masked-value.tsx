"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn, maskSensitive } from "@/lib/utils";

/**
 * Read-only sensitive value (passport no., phone, blood group, policy no.)
 * masked by default with a reveal/hide toggle. `buttonClassName` lets callers
 * on a dark/gradient background (e.g. the Digital ID card) restyle the icon.
 */
export function MaskedValue({
  value,
  buttonClassName,
}: {
  value: string;
  buttonClassName?: string;
}) {
  const [show, setShow] = React.useState(false);
  if (!value?.trim()) return <span>—</span>;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{show ? value : maskSensitive(value)}</span>
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide" : "Show"}
        className={cn(
          "shrink-0 text-muted-foreground transition-colors hover:text-foreground",
          buttonClassName,
        )}
      >
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </span>
  );
}
