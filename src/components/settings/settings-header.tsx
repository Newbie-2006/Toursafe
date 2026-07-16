"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/features/i18n/i18n-provider";

export function SettingsHeader({
  title,
  description,
  backHref = "/settings",
}: {
  title: string;
  description?: string;
  backHref?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("nav.settings")}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
