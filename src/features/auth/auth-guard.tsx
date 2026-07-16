"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-provider";
import type { Role } from "@/types";

/**
 * Gates a section behind a signed-in session with the required role.
 * Redirects to /login (preselecting the role) when unauthorized.
 */
export function AuthGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const router = useRouter();

  const authorized = ready && session?.role === role;

  useEffect(() => {
    if (ready && (!session || session.role !== role)) {
      router.replace(`/login?role=${role}`);
    }
  }, [ready, session, role, router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
