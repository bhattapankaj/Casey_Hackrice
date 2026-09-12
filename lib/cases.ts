import type { Band, Channel } from "@/lib/channels";

export type Verdict = "scam" | "legit" | "more";
export type CaseTruth = "scam" | "legit" | "unresolvable";

export type EmailContent = {
  kind: "email";
  fromName: string;
  fromEmail: string;
  timestamp: string;
  subject: string;
  paragraphs: string[];
  link: { href: string; label: string };
};

export type DirectoryContent = {
  kind: "directory";
  university: string;
  breadcrumbs: string[];
  name: string;
  title: string;
  department: string;
  office: string;
  email: string;
  phone: string;
  sidebar: string[];
  note?: string;
};

export type CallContent = {
  kind: "call";
  contactName: string;
  number: string;
};

export type ArtifactContent = EmailContent | DirectoryContent | CallContent;

export type CaseArtifact = {
  id: string;
  channel: Channel;
  band: Band;
  label: string;
  provenance: string;
  content: ArtifactContent;
};

export type GameCase = {
  id: string;
  title: string;
  shortTitle: string;
  briefing: [string, string];
  truth: CaseTruth;
  startingScore: number;
  debrief: {
    lesson: string;
    realWorldLink: string;
    realWorldLabel: string;
  };
  artifacts: CaseArtifact[];
};

export const CASE_ORDER = ["case-01", "case-02", "case-03"] as const;

export const CASES: Record<string, GameCase> = {
  "case-01": {
    id: "case-01",
    title: "Case one, The Meridian Offer",
    shortTitle: "The Meridian Offer",
    briefing: [
      "A research assistant offer arrived this morning.",
      "They want you to confirm today by phone.",
    ],
    truth: "scam",
    startingScore: 240,
    debrief: {
      lesson:
        "A confirmation only counts if you found it yourself, not if they handed it to you.",
      realWorldLink: "https://consumer.ftc.gov/articles/job-scams",
      realWorldLabel: "Read the FTC guidance on job scams",
    },
    artifacts: [
      {
        id: "offer-email",
        channel: "email",
        band: "in",
        label: "Offer email",
        provenance: "Opened from the original message",
        content: {
          kind: "email",
          fromName: "D. Ellison",
          fromEmail: "d.ellison.meridian@myinbox.net",
          timestamp: "Yesterday, 4:12 PM",
          subject: "Research assistant opening, start Monday",
          paragraphs: [
            "I am writing from the Meridian Research Group at Harlow University. We have a paid research assistant opening for the current term. The stipend is $450 a week, remote, with a start date of this coming Monday.",
            "We need a confirmation today so payroll can process the first payment. Please call me at (555) 014-2680 to accept the offer and share your deposit details.",
            "The program page is linked below. I look forward to working with you.",
            "D. Ellison",
            "Principal investigator, Meridian Research Group",
            "Harlow University",
          ],
          link: {
            href: "https://harlow-meridian-research.org/assistants",
            label: "harlow-meridian-research.org/assistants",
          },
        },
      },
      {
        id: "callback",
        channel: "phone",
        band: "in",
        label: "Callback number",
        provenance: "Opened from the original message",
        content: {
          kind: "call",
          contactName: "D. Ellison",
          number: "(555) 014-2680",
        },
      },
      {
        id: "staff-directory",
        channel: "directory",
        band: "out",
        label: "Staff directory",
        provenance: "Found independently in the staff directory",
        content: {
          kind: "directory",
          university: "Harlow University",
          breadcrumbs: ["Home", "Directory", "Sociology", "Dana Ellison"],
          name: "Dana Ellison, Ph.D.",
          title: "Associate Professor",
          department: "Department of Sociology",
          office: "Hale Hall 314",
          email: "d.ellison@harlow.edu",
          phone: "(555) 310-4421",
          sidebar: [
            "Search the directory",
            "Departments A to Z",
            "Campus map",
            "Office of the Registrar",
          ],
        },
      },
    ],
  },
  "case-02": {
    id: "case-02",
    title: "Case two, The Refund",
    shortTitle: "The Refund",
    briefing: [
      "The bursar says your account was overpaid.",
      "They want to send $182.40 back to you.",
    ],
    truth: "legit",
    startingScore: 240,
    debrief: {
      lesson:
        "Awkward wording is a clue, not a verdict. Check the office yourself.",
      realWorldLink: "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams",
      realWorldLabel: "Read the FTC guidance on phishing",
    },
    artifacts: [
      {
        id: "refund-email",
        channel: "email",
        band: "in",
        label: "Refund email",
        provenance: "Opened from the original message",
        content: {
          kind: "email",
          fromName: "Marta Okoye",
          fromEmail: "m.okoye@harlow.edu",
          timestamp: "Today, 9:04 AM",
          subject: "Student account overpayment, refund pending",
          paragraphs: [
            "Our records show your student account was over paid during the spring term. The surplus is $182.40.",
            "Please confirm the last four of your student number so we can release the refund to the account on file. If that account is closed, call the bursar desk at (555) 310-8802 and we will mail a check.",
            "Processing takes five to seven business days after you confirm. Reply to this message or use the refund page linked below.",
            "Marta Okoye",
            "Assistant bursar",
            "Office of the Bursar, Harlow University",
          ],
          link: {
            href: "https://harlow.edu/bursar/refunds",
            label: "harlow.edu/bursar/refunds",
          },
        },
      },
      {
        id: "bursar-desk",
        channel: "phone",
        band: "in",
        label: "Bursar desk",
        provenance: "Opened from the original message",
        content: {
          kind: "call",
          contactName: "Marta Okoye",
          number: "(555) 310-8802",
        },
      },
      {
        id: "bursar-directory",
        channel: "directory",
        band: "out",
        label: "Bursar office",
        provenance: "Found independently in the staff directory",
        content: {
          kind: "directory",
          university: "Harlow University",
          breadcrumbs: ["Home", "Directory", "Finance", "Marta Okoye"],
          name: "Marta Okoye",
          title: "Assistant Bursar",
          department: "Office of the Bursar",
          office: "Whitlock Hall 110",
          email: "m.okoye@harlow.edu",
          phone: "(555) 310-8802",
          sidebar: [
            "Tuition and fees",
            "Refunds and overpayments",
            "Payment plans",
            "Contact the bursar",
          ],
        },
      },
    ],
  },
  "case-03": {
    id: "case-03",
    title: "Case three, The Sublet",
    shortTitle: "The Sublet",
    briefing: [
      "A student wants to sublet a room until August.",
      "They asked for the first month before you visit.",
    ],
    truth: "unresolvable",
    startingScore: 240,
    debrief: {
      lesson:
        "If the evidence cannot settle it, the right call is to wait.",
      realWorldLink: "https://consumer.ftc.gov/articles/rental-listing-scams",
      realWorldLabel: "Read the FTC guidance on rental listing scams",
    },
    artifacts: [
      {
        id: "sublet-email",
        channel: "email",
        band: "in",
        label: "Sublet email",
        provenance: "Opened from the original message",
        content: {
          kind: "email",
          fromName: "S. Pell",
          fromEmail: "s.pell.housing@myinbox.net",
          timestamp: "Today, 11:41 AM",
          subject: "My place near campus, June to August",
          paragraphs: [
            "I am heading home for the summer and need someone in my room from June 1 to August 15. Rent is $740 a month, utilities included.",
            "I already have two other people interested. If you want it, send the first month today and I will hold it. We can do a walkthrough over the phone. The building does not do in-person showings this week.",
            "Photos and the lockbox note are on the listing page. Call me at (555) 018-4402 once you send it.",
            "S. Pell",
          ],
          link: {
            href: "https://rooms.harlow-housing.net/room/4b",
            label: "rooms.harlow-housing.net/room/4b",
          },
        },
      },
      {
        id: "sublet-call",
        channel: "phone",
        band: "in",
        label: "Their number",
        provenance: "Opened from the original message",
        content: {
          kind: "call",
          contactName: "S. Pell",
          number: "(555) 018-4402",
        },
      },
      {
        id: "housing-office",
        channel: "directory",
        band: "out",
        label: "Housing office",
        provenance: "Found independently in the staff directory",
        content: {
          kind: "directory",
          university: "Harlow University",
          breadcrumbs: ["Home", "Directory", "Student Life", "Campus Housing"],
          name: "Campus Housing Office",
          title: "Student Life",
          department: "Residential Life",
          office: "Kerr Hall, first floor",
          email: "housing@harlow.edu",
          phone: "(555) 310-2290",
          note:
            "This office does not review private sublets. No staff member named S. Pell appears in the directory. Students are told to see a written lease and the room before sending money.",
          sidebar: [
            "On-campus housing",
            "Private rentals",
            "Staff directory",
            "Report a listing",
          ],
        },
      },
    ],
  },
};

export function getCase(caseId: string): GameCase | undefined {
  return CASES[caseId];
}

export function nextCaseId(caseId: string): string | undefined {
  const index = CASE_ORDER.indexOf(caseId as (typeof CASE_ORDER)[number]);
  if (index === -1) {
    return undefined;
  }
  return CASE_ORDER[index + 1];
}
