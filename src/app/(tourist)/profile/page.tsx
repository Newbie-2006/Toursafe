"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, HeartPulse, LogOut, Save, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { useIdentity } from "@/features/identity/use-identity";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { profileSchema, type ProfileFormValues } from "@/lib/validation";

export default function ProfilePage() {
  const { t, locale, setLocale, locales } = useI18n();
  const { identity, update } = useIdentity();
  const { session, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Sensitive fields are masked by default; each has its own reveal toggle.
  const [showPassport, setShowPassport] = React.useState(false);
  const [showBlood, setShowBlood] = React.useState(false);
  const [showPhone, setShowPhone] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: identity.fullName,
      nationality: identity.nationality,
      passportNo: identity.passportNo,
      bloodGroup: identity.bloodGroup,
      insuranceProvider: identity.insuranceProvider,
      emergencyContactName: identity.emergencyContactName,
      emergencyContactPhone: identity.emergencyContactPhone,
    },
  });

  const onSubmit = handleSubmit((values) => {
    update(values);
    toast({ variant: "success", title: t("common.saved"), description: "Your profile has been updated." });
    reset(values);
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={session?.name ?? identity.fullName} src={identity.photoDataUrl} size={64} className="ring-2 ring-border" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{identity.fullName}</h1>
          <p className="text-muted-foreground">
            {session?.email ? `${t("auth.signedInAs")} ${session.email}` : identity.nationality}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            signOut();
            router.replace("/login");
          }}
        >
          <LogOut className="size-4" />
          {t("auth.signOut")}
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <User className="size-4" /> Personal Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("id.name")} error={errors.fullName?.message}>
              <Input {...register("fullName")} />
            </Field>
            <Field label={t("id.nationality")} error={errors.nationality?.message}>
              <Input {...register("nationality")} />
            </Field>
            <Field label={t("id.passport")} error={errors.passportNo?.message}>
              <MaskedInput show={showPassport} onToggle={() => setShowPassport((s) => !s)} {...register("passportNo")} />
            </Field>
            <Field label={t("id.bloodGroup")} error={errors.bloodGroup?.message}>
              <MaskedInput show={showBlood} onToggle={() => setShowBlood((s) => !s)} {...register("bloodGroup")} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <HeartPulse className="size-4 text-danger" /> Emergency & Medical
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t("id.emergencyContact")} — Name`} error={errors.emergencyContactName?.message}>
              <Input {...register("emergencyContactName")} />
            </Field>
            <Field label={`${t("id.emergencyContact")} — Phone`} error={errors.emergencyContactPhone?.message}>
              <MaskedInput show={showPhone} onToggle={() => setShowPhone((s) => !s)} {...register("emergencyContactPhone")} />
            </Field>
            <Field label={t("id.insurance")}>
              <Input {...register("insuranceProvider")} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" /> {t("settings.language")}
          </h2>
          <Field label={t("settings.language")}>
            <Select value={locale} onChange={(e) => setLocale(e.target.value as typeof locale)} className="sm:w-64">
              {locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty}>
            <Save className="size-4" />
            {t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

/** A form input for sensitive data, masked by default with a reveal toggle. */
const MaskedInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { show: boolean; onToggle: () => void }
>(({ show, onToggle, className, ...props }, ref) => (
  <div className="relative">
    <Input ref={ref} type={show ? "text" : "password"} className={cn("pr-11", className)} {...props} />
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Hide" : "Show"}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  </div>
));
MaskedInput.displayName = "MaskedInput";
