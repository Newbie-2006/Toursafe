"use client";

import * as React from "react";
import { BadgeCheck, Fingerprint, ScanLine, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/features/i18n/i18n-provider";
import { listIssuedIds, lookupIssuedId, type IssuedIdRecord } from "@/lib/identity";
import { getSupabase } from "@/lib/supabase";

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

interface DigitalIdRow {
  tourist_id: string;
  full_name: string;
  nationality: string | null;
  passport_no: string | null;
  blood_group: string | null;
  verified: boolean | null;
}

/** Cross-device lookup against the Supabase digital_ids registry (if configured). */
async function lookupSupabase(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  code: string,
): Promise<VerifiedResult | null> {
  try {
    const byId = await sb.from("digital_ids").select("*").eq("tourist_id", code).limit(1);
    let row = (byId.data as DigitalIdRow[] | null)?.[0];
    if (!row) {
      const byPass = await sb.from("digital_ids").select("*").eq("passport_no", code).limit(1);
      row = (byPass.data as DigitalIdRow[] | null)?.[0];
    }
    if (!row) return null;
    return {
      touristId: row.tourist_id,
      name: row.full_name,
      nationality: row.nationality ?? "—",
      passport: row.passport_no ?? "—",
      bloodGroup: row.blood_group ?? "—",
      verified: Boolean(row.verified),
      source: "registry",
    };
  } catch {
    return null;
  }
}

export function IdVerification() {
  const { t } = useI18n();
  const [code, setCode] = React.useState("");
  const [result, setResult] = React.useState<VerifiedResult | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  const verify = async (raw: string) => {
    setNotFound(false);
    const value = raw.trim();
    if (!value) return;

    // Collect candidate identifiers: from a scanned QR payload, or the raw text.
    const candidates: string[] = [];
    let qr: {
      id?: string;
      name?: string;
      nationality?: string;
      passport?: string;
      bloodGroup?: string;
      verified?: boolean;
    } | null = null;
    try {
      const parsed = JSON.parse(value);
      if (parsed && (parsed.id || parsed.passport)) {
        qr = parsed;
        if (parsed.id) candidates.push(parsed.id);
        if (parsed.passport) candidates.push(parsed.passport);
      }
    } catch {
      /* not JSON */
    }
    if (candidates.length === 0) candidates.push(value);

    // 1) Local issued-ID registry (this device).
    for (const c of candidates) {
      const rec = lookupIssuedId(c);
      if (rec) {
        setResult(fromRecord(rec));
        return;
      }
    }

    // 2) Supabase registry (cross-device), when configured.
    const sb = getSupabase();
    if (sb) {
      for (const c of candidates) {
        const rec = await lookupSupabase(sb, c);
        if (rec) {
          setResult(rec);
          return;
        }
      }
    }

    // 3) A self-describing signed QR not present in any registry.
    if (qr?.name && qr?.passport) {
      setResult({
        touristId: qr.id ?? "—",
        name: qr.name,
        nationality: qr.nationality ?? "—",
        passport: qr.passport,
        bloodGroup: qr.bloodGroup ?? "—",
        verified: Boolean(qr.verified),
        source: "signed-qr",
      });
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
