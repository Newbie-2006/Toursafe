export type LatLng = { lat: number; lng: number };

export type Role = "tourist" | "police";

export type IncidentCategory =
  | "theft"
  | "harassment"
  | "accident"
  | "medical"
  | "lost_item"
  | "scam"
  | "natural_hazard"
  | "other";

export type Priority = "low" | "medium" | "high" | "critical";

export type IncidentStatus = "open" | "assigned" | "resolved";

export interface Incident {
  id: string;
  category: IncidentCategory;
  priority: Priority;
  status: IncidentStatus;
  title: string;
  description: string;
  location: LatLng;
  address?: string;
  reporterName: string;
  imageDataUrl?: string | null;
  assignedOfficerId?: string | null;
  createdAt: string;
}

export type SosStatus = "active" | "acknowledged" | "resolved";

export interface SosRequest {
  id: string;
  touristName: string;
  touristId: string;
  location: LatLng;
  status: SosStatus;
  message?: string;
  createdAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
}

export type AlertLevel = "info" | "warning" | "danger" | "success";

export interface AlertItem {
  id: string;
  level: AlertLevel;
  title: string;
  body: string;
  createdAt: string;
}

export type ZoneType = "safe" | "danger" | "caution";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  center: LatLng;
  radiusM: number;
}

export type PoiType = "police" | "hospital" | "embassy";

export interface Poi {
  id: string;
  name: string;
  type: PoiType;
  location: LatLng;
  phone?: string;
  address?: string;
}

export interface Officer {
  id: string;
  name: string;
  badge: string;
  status: "available" | "on_call" | "off_duty";
  zone: string;
  location: LatLng;
}

export interface DigitalIdentity {
  fullName: string;
  nationality: string;
  passportNo: string;
  visaNo: string;
  bloodGroup: string;
  insuranceProvider: string;
  insuranceNo: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  photoDataUrl?: string | null;
  verified: boolean;
  issuedAt: string;
  expiresAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}
