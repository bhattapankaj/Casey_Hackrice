import type { CaseCategory, CaseRank } from "@/lib/cases/schema";

export type UpcomingCase = {
  id: string;
  category: CaseCategory;
  rank: CaseRank;
  neutralTitle: string;
  estimatedMinutes: number;
};

export const UPCOMING_CASES: readonly UpcomingCase[] = [
  {
    id: "upcoming-tolls",
    category: "tolls",
    rank: "6",
    neutralTitle: "An unpaid toll notice",
    estimatedMinutes: 2,
  },
  {
    id: "upcoming-rentals",
    category: "rentals",
    rank: "8",
    neutralTitle: "A weekend sublet",
    estimatedMinutes: 3,
  },
  {
    id: "upcoming-investment",
    category: "investment",
    rank: "Q",
    neutralTitle: "A private study group",
    estimatedMinutes: 3,
  },
];
