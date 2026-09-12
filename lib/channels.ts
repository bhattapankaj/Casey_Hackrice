import { Building2, Globe, Mail, Phone, type LucideIcon } from "lucide-react";

export type Channel = "email" | "phone" | "directory" | "web";
export type Band = "in" | "out";
export type CardState = "facedown" | "available" | "opened";

export const CHANNEL_ICONS: Record<Channel, LucideIcon> = {
  email: Mail,
  phone: Phone,
  directory: Building2,
  web: Globe,
};

export const CHANNEL_INDEX: Record<Channel, string> = {
  email: "E",
  phone: "P",
  directory: "D",
  web: "W",
};

export const CHANNEL_OPEN_LABEL: Record<Channel, string> = {
  email: "Open the email",
  phone: "Call this number",
  directory: "Open the directory",
  web: "Open the page",
};

export const BAND_PHRASE: Record<Band, string> = {
  in: "from the original message",
  out: "found independently",
};
