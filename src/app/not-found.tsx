import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Logo />
      <div className="grid size-16 place-items-center rounded-3xl bg-primary/10">
        <Compass className="size-8 text-primary" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">This route doesn&apos;t exist. Let&apos;s get you back safely.</p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
