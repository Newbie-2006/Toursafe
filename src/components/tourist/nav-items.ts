import { LayoutDashboard, Map, Bot, IdCard, Settings, type LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
}

export const TOURIST_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/map", labelKey: "nav.map", icon: Map },
  { href: "/assistant", labelKey: "nav.assistant", icon: Bot },
  { href: "/digital-id", labelKey: "nav.digitalId", icon: IdCard },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];
