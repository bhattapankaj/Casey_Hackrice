import {
  Building2,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Channel } from "@/lib/cases/schema";

export type { Channel };
export type Band = "in" | "out" | "unknown";
export type CardState = "facedown" | "unopened" | "viewed";

/** Band is a presentation label for source provenance, never a trust verdict. */
export const BAND_LABEL: Record<Band, string> = {
  in: "Their channel",
  out: "Independent",
  unknown: "Source unknown",
};

export const CHANNEL_ICONS: Record<Channel, LucideIcon> = {
  email: Mail,
  phone: Phone,
  directory: Building2,
  web: Globe,
  portal: ShieldCheck,
};

export const CHANNEL_INDEX: Record<Channel, string> = {
  email: "E",
  phone: "P",
  directory: "D",
  web: "W",
  portal: "O",
};

export const CHANNEL_OPEN_LABEL: Record<Channel, string> = {
  email: "Open the email",
  phone: "Open the call record",
  directory: "Open the directory",
  web: "Open the page",
  portal: "Open the portal",
};

export const CHANNEL_CLOSE_LABEL: Record<Channel, string> = {
  email: "Close the email",
  phone: "Close the call",
  directory: "Close the directory",
  web: "Close the page",
  portal: "Close the portal",
};

export const BAND_PHRASE: Record<Band, string> = {
  in: "from a claimant-controlled source",
  out: "found through an independent source",
  unknown: "with an unverified source",
};
