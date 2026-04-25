import {
  Zap,
  Truck,
  Warehouse,
  Plane,
  Ship,
  Package,
  PackageCheck,
  Boxes,
  Globe2,
  ShieldCheck,
  Headphones,
  Award,
  Timer,
  Clock,
  MapPin,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Truck,
  Warehouse,
  Plane,
  Ship,
  Package,
  PackageCheck,
  Boxes,
  Globe2,
  ShieldCheck,
  Headphones,
  Award,
  Timer,
  Clock,
  MapPin,
  Sparkles,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export function getIcon(name: string | undefined | null): LucideIcon {
  if (!name) return Package;
  return ICON_MAP[name] ?? Package;
}
