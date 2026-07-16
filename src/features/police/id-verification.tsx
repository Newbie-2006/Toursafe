"use client";

import * as React from "react";
import { BadgeCheck, Fingerprint, ScanLine, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/features/i18n/i18n-provider";
import { listIssuedIds, lookupIssuedId, type IssuedIdRecord } from "@/lib/identity";

interface VerifiedResult {
  touristId: string;
  name: string;
  nationality: string;
  passport: string;
  bloodGroup: string;
  verified: boolean;
  source: "registry" | "signed-qr";
}

function fromRecord(rec: IssuedIdRecord): VerifiedResult {
  return {
    touristId: rec.touristId,
    name: rec.name,
    nationality: rec.nationality,
    passport: rec.passport,
    bloodGroup: rec.bloodGroup,
    verified: rec.verified,
    source: "registry",
  };
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

    // 1) A scanned QR payload (JSON from the tourist's Digital ID).
    try {
      const parsed = JSON.parse(value) as {
        id?: string;
        name?: string;
        nationality?: string;
        passport?: string;
        bloodGroup?: string;
        verified?: boolean;
      };
      if (parsed && (parsed.id || parsed.passport)) {
        const rec = lookupIssuedId(parsed.id ?? "") ?? lookupIssuedId(parsed.passport ?? "");
        if (rec) {
          setResult(fromRecord(rec));
          return;
        }
        if (parsed.name && parsed.passport) {
          // Self-describing QR that isn't in this device's registry.
          setResult({
            touristId: parsed.id ?? "—",
            name: parsed.name,
            nationality: parsed.nationality ?? "—",
            passport: parsed.passport,
            bloodGroup: parsed.bloodGroup ?? "—",
            verified: Boolean(parsed.verified),
            source: "signed-qr",
          });
          return;
        }
      }
    } catch {
      /* not JSON — fall through to a direct lookup */
    }

    // 2) A typed Tourist ID or passport number.
    const rec = lookupIssuedId(value);
    if (rec) {
      setResult(fromRecord(rec));
      return;
    }

    setResult(null);
    setNotFound(true);
  };

  const verifyFirstIssued = () => {
    const [first] = listIssuedIds();
    if (!first) {
      setResult(null);
      setNotFound(true);
      setCode("");
      return;
    }
    setCode(first.touristId);
    verify(first.touristId);
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
        onClick={verifyFirstIssued}
        className="mt-2 text-xs font-medium text-primary hover:underline"
      >
        Verify a registered tourist
      </button>

      {result && (
        <div className="mt-4 animate-fade-in rounded-2xl border border-success/30 bg-success/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{result.name}</p>
            <Badge variant={result.verified ? "success" : "warning"}>
              <BadgeCheck className="size-3.5" />
              {result.verified ? t("id.verified") : t("id.unverified")}
            </Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">TourSafe ID</p>
              <p className="font-mono font-medium">{result.touristId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("id.nationality")}</p>
              <p className="font-medium">{result.nationality}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("id.passport")}</p>
              <p className="font-mono font-medium">{result.passport}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("id.bloodGroup")}</p>
              <p className="font-medium">{result.bloodGroup}</p>
            </div>
          </div>
          {result.source === "signed-qr" && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldAlert className="size-3" />
              Verified from signed QR (not in this station&apos;s registry).
            </p>
          )}
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
