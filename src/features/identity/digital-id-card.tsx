"use client";

import { QRCodeSVG } from "qrcode.react";
import { BadgeCheck, Droplet, Phone, ShieldCheck } from "lucide-react";
import type { DigitalIdentity } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function DigitalIdCard({
  identity,
  className,
}: {
  identity: DigitalIdentity;
  className?: string;
}) {
  const { t } = useI18n();

  const payload = JSON.stringify({
    id: "TS-IN-4820",
    name: identity.fullName,
    nationality: identity.nationality,
    passport: identity.passportNo,
    verified: identity.verified,
    issued: identity.issuedAt,
  });

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 text-white shadow-soft-lg",
        "bg-gradient-to-br from-[#2E6B5A] via-[#357a63] to-[#1f4c40]",
        className,
      )}
    >
      {/* decorative rings */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5" />
          <span className="text-sm font-semibold tracking-wide">TourSafe ID</span>
        </div>
        {identity.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur">
            <BadgeCheck className="size-3.5" />
            {t("id.verified")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-xs font-medium">
            {t("id.unverified")}
          </span>
        )}
      </div>

      <div className="relative mt-6 flex items-center gap-4">
        <Avatar name={identity.fullName} src={identity.photoDataUrl} size={64} className="ring-2 ring-white/30" />
        <div>
          <p className="text-xl font-semibold leading-tight">{identity.fullName}</p>
          <p className="text-sm text-white/70">{identity.nationality}</p>
        </div>
      </div>

      <div className="relative mt-6 flex items-end justify-between gap-4">
        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Field label={t("id.passport")} value={identity.passportNo} />
          <Field label={t("id.visa")} value={identity.visaNo} />
          <Field
            label={t("id.bloodGroup")}
            value={identity.bloodGroup}
            icon={<Droplet className="size-3.5" />}
          />
          <Field
            label={t("id.emergencyContact")}
            value={identity.emergencyContactPhone}
            icon={<Phone className="size-3.5" />}
          />
        </div>

        <div className="shrink-0 rounded-xl bg-white p-2">
          <QRCodeSVG value={payload} size={76} bgColor="#ffffff" fgColor="#1f4c40" level="M" />
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-white/15 pt-3 text-[11px] text-white/60">
        <span>
          {t("id.issued")} {identity.issuedAt}
        </span>
        <span>
          {t("id.expires")} {identity.expiresAt}
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-white/55">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 font-medium">
        {icon}
        {value}
      </p>
    </div>
  );
}
