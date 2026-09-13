import {
  Briefcase,
  KeyRound,
  Landmark,
  ReceiptText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { CaseCategory } from "@/lib/cases/schema";

export const CATEGORY_META: Record<
  CaseCategory,
  { label: string; icon: LucideIcon; skill: string }
> = {
  jobs: {
    label: "Jobs and internships",
    icon: Briefcase,
    skill: "Confirm the employer through a route they did not give you",
  },
  bank: {
    label: "Bank impersonation",
    icon: Landmark,
    skill: "Hang up and reach the bank through a number you already had",
  },
  tolls: {
    label: "Tolls and traffic fines",
    icon: ReceiptText,
    skill: "Find the agency yourself before paying anything",
  },
  rentals: {
    label: "Rentals and deposits",
    icon: KeyRound,
    skill: "Verify the property and the person's authority to rent it",
  },
  investment: {
    label: "Investment groups",
    icon: TrendingUp,
    skill: "Treat testimonials and screenshots as claims, not evidence",
  },
};
