import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command Center",
};

// The command center is always dark ("mission control"), independent of the
// tourist app's theme. Forcing `.dark` on this wrapper scopes the dark tokens.
export default function PoliceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </div>
  );
}
