"use client";

import { BadgeCheck, HeartPulse, Link2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DigitalIdCard } from "@/features/identity/digital-id-card";
import { useIdentity } from "@/features/identity/use-identity";
import { useI18n } from "@/features/i18n/i18n-provider";
import { BLOCKCHAIN_TIMELINE } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export default function DigitalIdPage() {
  const { t } = useI18n();
  const { identity } = useIdentity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("id.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("common.tagline")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <DigitalIdCard identity={identity} />
          <Button asChild variant="outline" className="w-full">
            <Link href="/profile">{t("nav.profile")}</Link>
          </Button>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <HeartPulse className="size-5 text-danger" />
              <h3 className="text-base font-semibold">{t("id.insurance")}</h3>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label={t("id.insurance")} value={identity.insuranceProvider} />
              <Row label="Policy No." value={identity.insuranceNo} />
              <Row label={t("id.bloodGroup")} value={identity.bloodGroup} />
              <Row label={t("id.emergencyContact")} value={`${identity.emergencyContactName} · ${identity.emergencyContactPhone}`} />
            </dl>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="size-5 text-primary" />
                <h3 className="text-base font-semibold">{t("id.blockchain")}</h3>
              </div>
              <Badge variant="success">
                <BadgeCheck className="size-3.5" />
                {t("id.verified")}
              </Badge>
            </div>
            <ol className="relative space-y-4 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-1.5rem)] before:w-px before:bg-border">
              {BLOCKCHAIN_TIMELINE.map((step) => (
                <li key={step.hash} className="relative flex gap-3 pl-7">
                  <span
                    className={cn(
                      "absolute left-0 top-0.5 grid size-5 place-items-center rounded-full ring-2 ring-background",
                      step.done ? "bg-success text-success-foreground" : "bg-muted",
                    )}
                  >
                    <ShieldCheck className="size-3" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{step.label}</p>
                      <span className="text-[11px] text-muted-foreground">{step.at}</span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{step.hash}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
