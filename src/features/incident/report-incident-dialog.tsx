"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, MapPin, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useData } from "@/features/data/data-provider";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useGeolocation } from "@/features/location/use-geolocation";
import { useToast } from "@/components/ui/toast";
import { incidentSchema, type IncidentFormValues } from "@/lib/validation";
import { TOURIST_PROFILE } from "@/lib/demo-data";
import type { IncidentCategory, Priority } from "@/types";
import type { TranslationKey } from "@/lib/i18n";

const CATEGORIES: IncidentCategory[] = [
  "theft",
  "harassment",
  "accident",
  "medical",
  "lost_item",
  "scam",
  "natural_hazard",
  "other",
];
const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

export function ReportIncidentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { createIncident } = useData();
  const { session } = useAuth();
  const { position } = useGeolocation();
  const { toast } = useToast();
  const [image, setImage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { category: "theft", priority: "medium", title: "", description: "", address: "" },
  });

  React.useEffect(() => {
    if (!open) {
      reset();
      setImage(null);
      setSubmitting(false);
    }
  }, [open, reset]);

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast({ variant: "warning", title: "Image too large", description: "Please use an image under 4 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = handleSubmit((values) => {
    setSubmitting(true);
    createIncident({
      title: values.title,
      category: values.category,
      priority: values.priority,
      description: values.description,
      address: values.address || undefined,
      location: position,
      reporterName: session?.name ?? TOURIST_PROFILE.name,
      imageDataUrl: image,
    });
    setTimeout(() => {
      toast({ variant: "success", title: t("incident.submitted"), description: t("incident.submittedBody") });
      onClose();
    }, 600);
  });

  return (
    <Modal open={open} onClose={onClose} title={t("incident.title")} description={t("incident.subtitle")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">{t("incident.titleField")}</Label>
          <Input id="title" placeholder={t("incident.titlePlaceholder")} {...register("title")} />
          {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="category">{t("incident.category")}</Label>
            <Select id="category" {...register("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`cat.${c}` as TranslationKey)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority">{t("incident.priority")}</Label>
            <Select id="priority" {...register("priority")}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t(`prio.${p}` as TranslationKey)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">{t("incident.description")}</Label>
          <Textarea id="description" placeholder={t("incident.descPlaceholder")} {...register("description")} />
          {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">{t("incident.location")}</Label>
          <div className="flex items-center gap-2 rounded-2xl border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span>
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)} · {t("incident.useMyLocation")}
            </span>
          </div>
          <Input id="address" placeholder="Nearby landmark (optional)" {...register("address")} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("incident.image")}</Label>
          {image ? (
            <div className="relative overflow-hidden rounded-2xl border border-border/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Evidence" className="max-h-44 w-full object-cover" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-foreground/60 text-background"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              <ImagePlus className="size-5" />
              {t("incident.uploadImage")}
              <input type="file" accept="image/*" className="hidden" onChange={onImage} />
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("incident.submit")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
