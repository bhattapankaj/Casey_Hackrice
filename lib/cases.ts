import type { Band, Channel } from "@/lib/channels";

export type Verdict = "scam" | "legit" | "more";
export type CaseTruth = "scam" | "legit" | "unresolvable";

export type EmailContent = {
  kind: "email";
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  mailedBy?: string;
  signedBy?: string;
  to: string;
  timestamp: string;
  subject: string;
  paragraphs: string[];
  link: { href: string; label: string };
};

export type DirectoryContent = {
  kind: "directory";
  university: string;
  breadcrumbs: string[];
  domain: string;
  searchTerm: string;
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
  /** Scripted caller turns. Nothing here is generated, and nothing scores. */
  script: { speaker: "caller" | "you"; text: string }[];
};

export type ArtifactContent = EmailContent | DirectoryContent | CallContent;

/** An excerpt the player can pin as evidence. Pinning never reveals the answer. */
export type Excerpt = {
  id: string;
  text: string;
};

export type CaseArtifact = {
  id: string;
  channel: Channel;
  band: Band;
  label: string;
  /** Groups artifacts that trace back to the same origin. */
  sourceId: string;
  sourceLabel: string;
  /** Factual statement of where this came from, shown outside the artifact. */
  originLabel: string;
  /** Neutral fact shown on the card once it has been viewed. */
  preview: string;
  provenance: string;
  excerpts: Excerpt[];
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
    /** What the independently sourced check actually established. */
    independentFinding: string;
    /** What it could not establish, so independence is never mistaken for proof. */
    independentLimit: string;
    lesson: string;
    habit: string;
    realWorldLink: string;
    realWorldLabel: string;
  };
  artifacts: CaseArtifact[];
};

export const CASE_ORDER = ["case-01", "case-02", "case-03"] as const;

const CLAIMANT = {
  sourceId: "their-message",
  sourceLabel: "The message they sent you",
};

const DIRECTORY = {
  sourceId: "directory-search",
  sourceLabel: "Harlow University directory",
};

export const CASES: Record<string, GameCase> = {
  "case-01": {
    id: "case-01",
    title: "The Meridian Offer",
    shortTitle: "The Meridian Offer",
    briefing: [
      "A research assistant offer arrived this morning.",
      "They want you to confirm today by phone.",
    ],
    truth: "scam",
    startingScore: 240,
    debrief: {
      independentFinding:
        "The directory lists Dana Ellison at d.ellison@harlow.edu on (555) 310-4421. Neither the address nor the number in the message matches.",
      independentLimit:
        "The directory did not prove the message was a scam. It proved the sender was not the person they claimed to be, which is what settled it.",
      lesson:
        "A confirmation only counts if you found it yourself, not if they handed it to you.",
      habit:
        "Look up the organisation's own directory before replying to an unexpected offer.",
      realWorldLink: "https://consumer.ftc.gov/articles/job-scams",
      realWorldLabel: "Read the FTC guidance on job scams",
    },
    artifacts: [
      {
        id: "offer-email",
        channel: "email",
        band: "in",
        ...CLAIMANT,
        label: "Offer email",
        originLabel: "Arrived in your inbox",
        preview: "From d.ellison.meridian@myinbox.net",
        provenance: "Opened from the original message",
        excerpts: [
          { id: "e-from", text: "Sender address is d.ellison.meridian@myinbox.net" },
          { id: "e-number", text: "Message supplies the number (555) 014-2680" },
          { id: "e-urgency", text: "Asks for confirmation and deposit details today" },
        ],
        content: {
          kind: "email",
          fromName: "D. Ellison",
          fromEmail: "d.ellison.meridian@myinbox.net",
          replyTo: "payroll.meridian@myinbox.net",
          mailedBy: "myinbox.net",
          signedBy: "myinbox.net",
          to: "you@harlow.edu",
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
        ...CLAIMANT,
        label: "Callback number",
        originLabel: "Number supplied in the email",
        preview: "(555) 014-2680, given by the sender",
        provenance: "Opened from the original message",
        excerpts: [
          { id: "c-number", text: "Called (555) 014-2680, the number from the email" },
          { id: "c-pressure", text: "Caller pressed for a same-day decision" },
        ],
        content: {
          kind: "call",
          contactName: "D. Ellison",
          number: "(555) 014-2680",
          script: [
            { speaker: "caller", text: "Meridian Research, this is Ellison speaking." },
            { speaker: "you", text: "I am calling about the assistant offer." },
            {
              speaker: "caller",
              text: "Wonderful. I have your file open. I just need the deposit details today so payroll can run on Monday.",
            },
            { speaker: "you", text: "Can I confirm this through the department first?" },
            {
              speaker: "caller",
              text: "You can, but the posting closes at five and I would hate for you to lose it. Everything you need is in my email.",
            },
          ],
        },
      },
      {
        id: "staff-directory",
        channel: "directory",
        band: "out",
        ...DIRECTORY,
        label: "Staff directory",
        originLabel: "Found through directory search",
        preview: "d.ellison@harlow.edu, (555) 310-4421",
        provenance: "Found independently in the staff directory",
        excerpts: [
          { id: "d-email", text: "Directory lists d.ellison@harlow.edu" },
          { id: "d-phone", text: "Directory lists (555) 310-4421" },
          { id: "d-dept", text: "Dana Ellison is in Sociology, not a research group" },
        ],
        content: {
          kind: "directory",
          university: "Harlow University",
          domain: "directory.harlow.edu",
          searchTerm: "Ellison",
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
    title: "The Refund",
    shortTitle: "The Refund",
    briefing: [
      "The bursar says your account was overpaid.",
      "They want to send $182.40 back to you.",
    ],
    truth: "legit",
    startingScore: 240,
    debrief: {
      independentFinding:
        "The directory lists Marta Okoye as assistant bursar on m.okoye@harlow.edu and (555) 310-8802. Both match the message exactly.",
      independentLimit:
        "Matching contact details do not make every request safe. They establish that the sender is who they claim to be, which is the question this case asked.",
      lesson:
        "Awkward wording is a clue, not a verdict. Check the office yourself.",
      habit:
        "Confirm the person exists in the official directory before you judge their tone.",
      realWorldLink:
        "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams",
      realWorldLabel: "Read the FTC guidance on phishing",
    },
    artifacts: [
      {
        id: "refund-email",
        channel: "email",
        band: "in",
        ...CLAIMANT,
        label: "Refund email",
        originLabel: "Arrived in your inbox",
        preview: "From m.okoye@harlow.edu",
        provenance: "Opened from the original message",
        excerpts: [
          { id: "r-from", text: "Sender address is m.okoye@harlow.edu" },
          { id: "r-wording", text: "Wording is awkward, including 'over paid'" },
          { id: "r-ask", text: "Asks for the last four of your student number" },
        ],
        content: {
          kind: "email",
          fromName: "Marta Okoye",
          fromEmail: "m.okoye@harlow.edu",
          mailedBy: "harlow.edu",
          signedBy: "harlow.edu",
          to: "you@harlow.edu",
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
        ...CLAIMANT,
        label: "Bursar desk",
        originLabel: "Number supplied in the email",
        preview: "(555) 310-8802, given by the sender",
        provenance: "Opened from the original message",
        excerpts: [
          { id: "bd-number", text: "Called (555) 310-8802, the number from the email" },
          { id: "bd-manner", text: "Caller offered to post a check instead" },
        ],
        content: {
          kind: "call",
          contactName: "Marta Okoye",
          number: "(555) 310-8802",
          script: [
            { speaker: "caller", text: "Bursar's office, this is Marta." },
            { speaker: "you", text: "I had an email about an overpayment refund." },
            {
              speaker: "caller",
              text: "Yes, spring term. I can either send it to the account on file or post a check. Take your time deciding.",
            },
            { speaker: "you", text: "Can I come to the office instead?" },
            {
              speaker: "caller",
              text: "Of course. Whitlock Hall 110, we are open until four. Bring your student card.",
            },
          ],
        },
      },
      {
        id: "bursar-directory",
        channel: "directory",
        band: "out",
        ...DIRECTORY,
        label: "Bursar office",
        originLabel: "Found through directory search",
        preview: "m.okoye@harlow.edu, (555) 310-8802",
        provenance: "Found independently in the staff directory",
        excerpts: [
          { id: "bdir-email", text: "Directory lists m.okoye@harlow.edu" },
          { id: "bdir-phone", text: "Directory lists (555) 310-8802" },
          { id: "bdir-role", text: "Marta Okoye is the assistant bursar" },
        ],
        content: {
          kind: "directory",
          university: "Harlow University",
          domain: "directory.harlow.edu",
          searchTerm: "Okoye",
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
    title: "The Sublet",
    shortTitle: "The Sublet",
    briefing: [
      "A student wants to sublet a room until August.",
      "They asked for the first month before you visit.",
    ],
    truth: "unresolvable",
    startingScore: 240,
    debrief: {
      independentFinding:
        "The housing office does not review private sublets and has no record of S. Pell, because a private subletter would not appear in a staff directory either way.",
      independentLimit:
        "That absence is not proof of a scam. It means the evidence available cannot settle the question, which is why waiting is the correct call.",
      lesson: "If the evidence cannot settle it, the right call is to wait.",
      habit:
        "See the written lease and the room in person before sending any money.",
      realWorldLink: "https://consumer.ftc.gov/articles/rental-listing-scams",
      realWorldLabel: "Read the FTC guidance on rental listing scams",
    },
    artifacts: [
      {
        id: "sublet-email",
        channel: "email",
        band: "in",
        ...CLAIMANT,
        label: "Sublet email",
        originLabel: "Arrived in your inbox",
        preview: "From s.pell.housing@myinbox.net",
        provenance: "Opened from the original message",
        excerpts: [
          { id: "s-from", text: "Sender address is s.pell.housing@myinbox.net" },
          { id: "s-money", text: "Asks for the first month before any viewing" },
          { id: "s-scarcity", text: "Claims two other people are interested" },
        ],
        content: {
          kind: "email",
          fromName: "S. Pell",
          fromEmail: "s.pell.housing@myinbox.net",
          mailedBy: "myinbox.net",
          signedBy: "myinbox.net",
          to: "you@harlow.edu",
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
        ...CLAIMANT,
        label: "Their number",
        originLabel: "Number supplied in the email",
        preview: "(555) 018-4402, given by the sender",
        provenance: "Opened from the original message",
        excerpts: [
          { id: "sc-number", text: "Called (555) 018-4402, the number from the email" },
          { id: "sc-refusal", text: "Caller would not arrange an in-person viewing" },
        ],
        content: {
          kind: "call",
          contactName: "S. Pell",
          number: "(555) 018-4402",
          script: [
            { speaker: "caller", text: "Hello, this is Sam." },
            { speaker: "you", text: "I am calling about the room for the summer." },
            {
              speaker: "caller",
              text: "Great, it is still open. I can hold it as soon as the first month lands.",
            },
            { speaker: "you", text: "Could I see it this week?" },
            {
              speaker: "caller",
              text: "The building is not doing showings right now. I can walk you through on video instead.",
            },
          ],
        },
      },
      {
        id: "housing-office",
        channel: "directory",
        band: "out",
        ...DIRECTORY,
        label: "Housing office",
        originLabel: "Found through directory search",
        preview: "No S. Pell listed, office does not review sublets",
        provenance: "Found independently in the staff directory",
        excerpts: [
          { id: "h-nopell", text: "No staff member named S. Pell appears" },
          { id: "h-scope", text: "The office does not review private sublets" },
          { id: "h-advice", text: "Students are told to see a lease and the room first" },
        ],
        content: {
          kind: "directory",
          university: "Harlow University",
          domain: "directory.harlow.edu",
          searchTerm: "Pell",
          breadcrumbs: ["Home", "Directory", "Student Life", "Campus Housing"],
          name: "Campus Housing Office",
          title: "Student Life",
          department: "Residential Life",
          office: "Kerr Hall, first floor",
          email: "housing@harlow.edu",
          phone: "(555) 310-2290",
          note: "This office does not review private sublets. No staff member named S. Pell appears in the directory. Students are told to see a written lease and the room before sending money.",
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

/** One-based position of a case in the run, for "Case 2 of 3". */
export function caseNumber(caseId: string): number {
  return CASE_ORDER.indexOf(caseId as (typeof CASE_ORDER)[number]) + 1;
}

export const CASE_TOTAL = CASE_ORDER.length;

export const TRUTH_LABEL: Record<CaseTruth, string> = {
  scam: "Scam",
  legit: "Legitimate",
  unresolvable: "Not provable either way",
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  scam: "Scam",
  legit: "Legitimate",
  more: "Insufficient evidence",
};
