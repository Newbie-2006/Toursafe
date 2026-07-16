import { TouristShell } from "@/components/tourist/tourist-shell";

export default function TouristLayout({ children }: { children: React.ReactNode }) {
  return <TouristShell>{children}</TouristShell>;
}
