import type {
  AlertItem,
  DigitalIdentity,
  LatLng,
  Officer,
  Poi,
  Zone,
} from "@/types";

// Central Delhi — a recognizable tourist hub used as the demo home location.
export const DEFAULT_CENTER: LatLng = { lat: 28.6139, lng: 77.209 };

export const TOURIST_PROFILE = {
  name: "Aarav Sharma",
  touristId: "TS-IN-4820",
  nationality: "India",
  city: "New Delhi, India",
};

export const ZONES: Zone[] = [
  { id: "z1", name: "Connaught Place", type: "safe", center: { lat: 28.6304, lng: 77.2177 }, radiusM: 650 },
  { id: "z2", name: "India Gate Lawns", type: "safe", center: { lat: 28.6129, lng: 77.2295 }, radiusM: 550 },
  { id: "z3", name: "Paharganj", type: "caution", center: { lat: 28.6448, lng: 77.214 }, radiusM: 480 },
  { id: "z4", name: "Nightspot Alley", type: "danger", center: { lat: 28.648, lng: 77.23 }, radiusM: 380 },
];

export const POIS: Poi[] = [
  { id: "p1", name: "Connaught Place Police Station", type: "police", location: { lat: 28.6314, lng: 77.219 }, phone: "112" },
  { id: "p2", name: "Parliament Street Police Station", type: "police", location: { lat: 28.625, lng: 77.21 }, phone: "112" },
  { id: "h1", name: "Dr. RML Hospital", type: "hospital", location: { lat: 28.625, lng: 77.202 }, phone: "102" },
  { id: "h2", name: "Lady Hardinge Medical College", type: "hospital", location: { lat: 28.636, lng: 77.205 }, phone: "102" },
  { id: "e1", name: "U.S. Embassy", type: "embassy", location: { lat: 28.598, lng: 77.189 } },
  { id: "e2", name: "British High Commission", type: "embassy", location: { lat: 28.596, lng: 77.187 } },
];

/**
 * The demo dataset is authored around DEFAULT_CENTER (New Delhi). These helpers
 * translate it to wherever the user actually is, so "nearest police/hospital"
 * stay realistic (~1 km) instead of showing thousands of km when the user is
 * far from Delhi. The relative layout of zones/POIs is preserved.
 */
export function poisAround(center: LatLng): Poi[] {
  const dLat = center.lat - DEFAULT_CENTER.lat;
  const dLng = center.lng - DEFAULT_CENTER.lng;
  return POIS.map((p) => ({
    ...p,
    location: { lat: p.location.lat + dLat, lng: p.location.lng + dLng },
  }));
}

export function zonesAround(center: LatLng): Zone[] {
  const dLat = center.lat - DEFAULT_CENTER.lat;
  const dLng = center.lng - DEFAULT_CENTER.lng;
  return ZONES.map((z) => ({
    ...z,
    center: { lat: z.center.lat + dLat, lng: z.center.lng + dLng },
  }));
}

export const OFFICERS: Officer[] = [
  { id: "o1", name: "Insp. Meera Nair", badge: "DL-2231", status: "available", zone: "Connaught Place", location: { lat: 28.6312, lng: 77.2185 } },
  { id: "o2", name: "SI Rohan Verma", badge: "DL-4417", status: "available", zone: "India Gate", location: { lat: 28.6135, lng: 77.228 } },
  { id: "o3", name: "Const. Aisha Khan", badge: "DL-7789", status: "on_call", zone: "Paharganj", location: { lat: 28.644, lng: 77.215 } },
  { id: "o4", name: "SI David Thomas", badge: "DL-9902", status: "available", zone: "Central", location: { lat: 28.62, lng: 77.212 } },
  { id: "o5", name: "Const. Priya Das", badge: "DL-1120", status: "off_duty", zone: "North Block", location: { lat: 28.6145, lng: 77.2 } },
];

export const SEED_ALERTS: AlertItem[] = [
  {
    id: "a1",
    level: "warning",
    title: "Crowd surge near Paharganj",
    body: "Higher than usual foot traffic reported. Stay aware of your belongings.",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "a2",
    level: "info",
    title: "Weather advisory",
    body: "Light rain expected after 6 PM. Carry an umbrella.",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "a3",
    level: "success",
    title: "You entered a safe zone",
    body: "Connaught Place is well-patrolled and tourist-friendly.",
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
];

export const DEFAULT_IDENTITY: DigitalIdentity = {
  touristId: "TS-IN-4820",
  fullName: "Aarav Sharma",
  nationality: "India",
  passportNo: "P4820193",
  visaNo: "V-IND-2026-0098",
  bloodGroup: "O+",
  insuranceProvider: "GlobeGuard Travel",
  insuranceNo: "GG-88-4471209",
  emergencyContactName: "Priya Sharma",
  emergencyContactPhone: "+91 98100 12345",
  photoDataUrl: null,
  verified: true,
  issuedAt: "2026-01-12",
  expiresAt: "2026-12-31",
};

export interface TimelineEvent {
  time: string;
  title: string;
  place: string;
  status: "done" | "current" | "upcoming";
}

export const TRAVEL_TIMELINE: TimelineEvent[] = [
  { time: "09:30", title: "Hotel check-out", place: "The Imperial", status: "done" },
  { time: "11:00", title: "India Gate visit", place: "Rajpath", status: "done" },
  { time: "14:00", title: "Lunch", place: "Connaught Place", status: "current" },
  { time: "16:30", title: "Qutub Minar tour", place: "Mehrauli", status: "upcoming" },
  { time: "20:00", title: "Return to hotel", place: "The Imperial", status: "upcoming" },
];

export const WEATHER = {
  tempC: 29,
  condition: "Partly Cloudy",
  humidity: 62,
  windKph: 12,
  feelsLikeC: 31,
  uv: 6,
};
