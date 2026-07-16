import { TouristShell } from "@/components/tourist/tourist-shell";
import { AuthGuard } from "@/features/auth/auth-guard";

export default function TouristLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="tourist">
      <TouristShell>{children}</TouristShell>
    </AuthGuard>
  );
}
