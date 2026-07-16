"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <div className="grid size-16 place-items-center rounded-3xl bg-danger/10">
        <AlertTriangle className="size-8 text-danger" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="max-w-sm text-muted-foreground">
          An unexpected error occurred. You can try again — your data is safe.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
