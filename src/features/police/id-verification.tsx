"use client";

import * as React from "react";
import { BadgeCheck, Fingerprint, ScanLine, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/features/i18n/i18n-provider";
import { DEFAULT_IDENTITY } from "@/lib/demo-data";

interface VerifiedResult {
  name: string;
  nationality: string;
  passport: string;
  verified: boolean;
}

export function IdVerification() {
  const { t } = useI18n();
  const [code, setCode] = React.useState("");
  const [result, setResult] = React.useState<VerifiedResult | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  const verify = (raw: string) => {
    setNotFound(false);
    const value = raw.trim();
    if (!value) return;
    // Accept a scanned JSON payload or the known demo ID.
    try {
      const parsed = JSON.parse(value) as Partial<VerifiedResult>;
      if (parsed.name && parsed.passport) {
        setResult({
          name: parsed.name,
          nationality: parsed.nationality ?? "—",
          passport: parsed.passport,
          verified: parsed.verified ?? true,
        });
        return;
      }
    } catch {
      /* not JSON — try id match */
    }
    if (value.toUpperCase() === "TS-IN-4820" || value === DEFAULT_IDENTITY.passportNo) {
      setResult({
        name: DEFAULT_IDENTITY.fullName,
        nationality: DEFAULT_IDENTITY.nationality,
        passport: DEFAULT_IDENTITY.passportNo,
        verified: true,
      });
    } else {
      setResult(null);
      setNotFound(true);
    }
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Fingerprint className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("police.idVerification")}</h3>
      </div>

      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Scan / paste ID (e.g. TS-IN-4820)"
          className="font-mono text-sm"
          onKeyDown={(e) => e.key === "Enter" && verify(code)}
        />
        <Button size="icon" variant="outline" onClick={() => verify(code)} aria-label="Verify">
          <ScanLine className="size-4" />
        </Button>
      </div>
      <button
        onClick={() => {
          setCode("TS-IN-4820");
          verify("TS-IN-4820");
        }}
        className="mt-2 text-xs font-medium text-primary hover:underline"
      >
        Verify sample tourist ID
      </button>

      {result && (
        <div className="mt-4 animate-fade-in rounded-2xl border border-success/30 bg-success/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{result.name}</p>
            <Badge variant="success">
              <BadgeCheck className="size-3.5" />
              {t("id.verified")}
            </Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">{t("id.nationality")}</p>
              <p className="font-medium">{result.nationality}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("id.passport")}</p>
              <p className="font-mono font-medium">{result.passport}</p>
            </div>
          </div>
        </div>
      )}

      {notFound && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          <XCircle className="size-4" />
          No matching identity found.
        </div>
      )}
    </div>
  );
}
