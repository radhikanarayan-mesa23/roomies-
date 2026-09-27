import {
  Wallet,
  MapPinOff,
  MapPin,
  Bath,
  Building2,
  ArrowUpDown,
  Car,
  PawPrint,
  Users,
  CircleAlert,
  CheckCircle2,
  HelpCircle,
  Heart,
  type LucideIcon,
} from "lucide-react";

/** Icon for a dealbreaker field, used in the form labels and toggles. */
export const FIELD_ICON = {
  rent: Wallet,
  noGoAreas: MapPinOff,
  bathrooms: Bath,
  floor: Building2,
  lift: ArrowUpDown,
  parking: Car,
  petFriendly: PawPrint,
  bachelorFriendly: Users,
  keyPlace: MapPin,
} satisfies Record<string, LucideIcon>;

export const WORKS_ICON = CheckCircle2;
export const NOT_CONFIRMED_ICON = HelpCircle;
export const GIVES_UP_ICON = Heart;

/** Renders a representative icon for a dealbreaker gap statement, purely presentational. */
export function GapIcon({ text, className }: { text: string; className?: string }) {
  const t = text.toLowerCase();
  const props = { size: 14, className };
  if (t.startsWith("rent share")) return <Wallet {...props} />;
  if (t.includes("no-go area")) return <MapPinOff {...props} />;
  if (t.includes("bathroom")) return <Bath {...props} />;
  if (t.includes("floor")) return <Building2 {...props} />;
  if (t.includes("lift")) return <ArrowUpDown {...props} />;
  if (t.includes("parking")) return <Car {...props} />;
  if (t.includes("pet-friendly")) return <PawPrint {...props} />;
  if (t.includes("bachelor-friendly")) return <Users {...props} />;
  if (t.includes("straight-line") || t.includes("km from")) return <MapPin {...props} />;
  return <CircleAlert {...props} />;
}
