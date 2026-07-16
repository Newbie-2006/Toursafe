import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
  compact = false,
}: {
  className?: string;
  showWordmark?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "grid place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft",
          compact ? "size-8" : "size-9",
        )}
      >
        <ShieldCheck className={compact ? "size-4" : "size-5"} />
      </div>
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">
          Tour<span className="text-primary">Safe</span>
        </span>
      )}
    </div>
  );
}
