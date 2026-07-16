"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck, User, UserCog } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

type Mode = "signin" | "register";

interface FormValues {
  name: string;
  email: string;
  password: string;
}

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { signIn, register: registerUser, guestLogin } = useAuth();

  const [role, setRole] = React.useState<Role>("tourist");
  const [mode, setMode] = React.useState<Mode>("signin");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { name: "", email: "", password: "" } });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("role");
    if (r === "police" || r === "tourist") setRole(r);
  }, []);

  const go = (r: Role) => router.push(r === "police" ? "/police" : "/dashboard");

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "register") {
        await registerUser(values.name, values.email, values.password, role);
      } else {
        await signIn(values.email, values.password, role);
      }
      go(role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  });

  const onGuest = () => {
    guestLogin(role);
    go(role);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-white/5" />
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-2xl bg-white/15">
            <ShieldCheck className="size-5" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight">TourSafe</span>
        </Link>
        <div className="relative z-10 space-y-4">
          <h1 className="max-w-md text-4xl font-semibold leading-[1.1] tracking-tight">
            {t("landing.hero")}
          </h1>
          <p className="max-w-sm text-white/80">{t("landing.sub")}</p>
        </div>
        <p className="relative z-10 text-sm text-white/60">© {new Date().getFullYear()} TourSafe</p>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md"
          >
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">{t("auth.welcome")}</h2>
              <p className="mt-1 text-muted-foreground">{t("auth.subtitle")}</p>
            </div>

            {/* Role selector */}
            <div className="mb-5">
              <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
                {t("auth.role")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <RoleCard
                  active={role === "tourist"}
                  onClick={() => setRole("tourist")}
                  icon={<User className="size-5" />}
                  title={t("auth.roleTourist")}
                  desc={t("auth.touristDesc")}
                />
                <RoleCard
                  active={role === "police"}
                  onClick={() => setRole("police")}
                  icon={<UserCog className="size-5" />}
                  title={t("auth.rolePolice")}
                  desc={t("auth.policeDesc")}
                />
              </div>
            </div>

            {/* Mode tabs */}
            <div className="mb-4 inline-flex w-full rounded-2xl bg-muted p-1">
              {(["signin", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={cn(
                    "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
                    mode === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "signin" ? t("auth.signIn") : t("auth.register")}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-3.5">
              <AnimatePresence initial={false}>
                {mode === "register" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5 pb-0.5">
                      <Label htmlFor="name">{t("auth.name")}</Label>
                      <IconInput icon={<User className="size-4" />}>
                        <Input
                          id="name"
                          placeholder="Aarav Sharma"
                          className="pl-10"
                          {...register("name", {
                            validate: (v) => mode !== "register" || v.trim().length >= 2 || "Name is required.",
                          })}
                        />
                      </IconInput>
                      {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <IconInput icon={<Mail className="size-4" />}>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    {...register("email", {
                      required: "Email is required.",
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email." },
                    })}
                  />
                </IconInput>
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <IconInput icon={<Lock className="size-4" />}>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...register("password", {
                      required: "Password is required.",
                      minLength: { value: 6, message: "At least 6 characters." },
                    })}
                  />
                </IconInput>
                {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {mode === "signin" ? t("auth.signInCta") : t("auth.registerCta")}
                {!submitting && <ArrowRight className="size-4" />}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t("auth.or")}
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={onGuest}>
              {t("auth.continueGuest")} · {role === "police" ? t("auth.rolePolice") : t("auth.roleTourist")}
            </Button>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "register" : "signin");
                  setError(null);
                }}
                className="font-medium text-primary hover:underline"
              >
                {mode === "signin" ? t("auth.register") : t("auth.signIn")}
              </button>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1.5 rounded-2xl border p-3.5 text-left transition-all duration-200",
        active
          ? "border-primary/50 bg-primary/8 ring-2 ring-primary/20"
          : "border-border/70 bg-card hover:border-primary/30",
      )}
    >
      <span className={cn("grid size-9 place-items-center rounded-xl", active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
        {icon}
      </span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-[11px] leading-snug text-muted-foreground">{desc}</span>
    </button>
  );
}

function IconInput({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      {children}
    </div>
  );
}
