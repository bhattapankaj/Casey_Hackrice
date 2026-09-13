export const VERDICTS = ["scam", "legit", "not_enough_evidence"] as const;
export const CHANNELS = ["email", "phone", "directory", "web", "portal"] as const;
export const SOURCE_CLASSES = ["claimant", "independent", "unknown"] as const;
export const PRESSURE_TACTICS = [
  "urgency",
  "authority",
  "scarcity",
  "reciprocity",
] as const;
export const EVIDENCE_WEIGHTS = [0, 25, 50, 75, 100] as const;
export const RISK_COSTS = [0, 25, 50, 100] as const;
export const ACTION_TYPES = ["open", "call", "lookup", "submit"] as const;
export const CASE_CATEGORIES = ["jobs", "bank", "tolls", "rentals", "investment"] as const;
export const CASE_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;
export const CASE_DIFFICULTIES = [1, 2, 3] as const;

export type Verdict = (typeof VERDICTS)[number];
export type Channel = (typeof CHANNELS)[number];
export type SourceClass = (typeof SOURCE_CLASSES)[number];
export type PressureTactic = (typeof PRESSURE_TACTICS)[number];
export type EvidenceWeight = (typeof EVIDENCE_WEIGHTS)[number];
export type RiskCost = (typeof RISK_COSTS)[number];
export type ActionType = (typeof ACTION_TYPES)[number];
export type CaseCategory = (typeof CASE_CATEGORIES)[number];
export type CaseRank = (typeof CASE_RANKS)[number];
export type CaseDifficulty = (typeof CASE_DIFFICULTIES)[number];

export type SourceNote = {
  pattern: string;
  source: string;
  year: number;
  url: string;
};

export type EmailContent = {
  kind: "email";
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  mailedBy?: string;
  signedBy?: string;
  to?: string;
  timestamp: string;
  subject: string;
  paragraphs: string[];
  link?: { href: string; label: string };
};

export type DirectoryContent = {
  kind: "directory";
  university: string;
  domain?: string;
  searchTerm?: string;
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
  transcript: string[];
};

export type WebContent = {
  kind: "web";
  siteName: string;
  heading: string;
  url: string;
  paragraphs: string[];
};

export type PortalContent = {
  kind: "portal";
  serviceName: string;
  heading: string;
  rows: { label: string; value: string }[];
};

export type ArtifactContent =
  | EmailContent
  | DirectoryContent
  | CallContent
  | WebContent
  | PortalContent;

export type Artifact = {
  id: string;
  title: string;
  channel: Channel;
  sourceRoot: string;
  sourceRootLabel: string;
  sourceClass: SourceClass;
  provenance: string;
  content: ArtifactContent;
  supports: Verdict[];
  contradicts?: Verdict[];
  evidenceWeight: EvidenceWeight;
  decisive: boolean;
  unlockedBy?: string;
};

export type Action = {
  id: string;
  label: string;
  type: ActionType;
  sourceRoot: string;
  sourceClass: SourceClass;
  reveals: string[];
  riskCost: RiskCost;
  unlockedBy?: string;
};

export type CallerConfig = {
  characterName: string;
  organizationName: string;
  persona: string;
  firstMessage: string;
  scenarioSummary: string;
  allowedFacts: string[];
  forbiddenRequests: string[];
  contradiction: string;
  crackLine: string;
  maxCallSeconds: number;
};

export type CaseFile = {
  id: string;
  title: string;
  shortTitle: string;
  category: CaseCategory;
  difficulty: CaseDifficulty;
  rank: CaseRank;
  neutralTitle: string;
  estimatedMinutes: number;
  sourceNote: SourceNote;
  truth: Verdict;
  claimantSourceRoot: string;
  briefing: [string, string];
  startingArtifactIds: string[];
  artifacts: Artifact[];
  actions: Action[];
  allowedPressureTactics: PressureTactic[];
  caller?: CallerConfig;
  debrief: {
    lesson: string;
    realWorldAction: string;
    sourceUrl: string;
    sourceLabel: string;
  };
};

export class CaseSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CaseSchemaError";
  }
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, path: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CaseSchemaError(`${path} must be an object`);
  }
  return value as UnknownRecord;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CaseSchemaError(`${path} must be a non-empty string`);
  }
  return value;
}

function optionalString(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : string(value, path);
}

function enumValue<T extends readonly (string | number)[]>(
  value: unknown,
  allowed: T,
  path: string,
): T[number] {
  if (!allowed.includes(value as T[number])) {
    throw new CaseSchemaError(`${path} has an unsupported value`);
  }
  return value as T[number];
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new CaseSchemaError(`${path} must be an array`);
  }
  return value;
}

function strings(value: unknown, path: string): string[] {
  return array(value, path).map((entry, index) => string(entry, `${path}[${index}]`));
}

function verdicts(value: unknown, path: string): Verdict[] {
  return array(value, path).map((entry, index) =>
    enumValue(entry, VERDICTS, `${path}[${index}]`),
  );
}

function content(value: unknown, path: string): ArtifactContent {
  const candidate = record(value, path);
  const kind = string(candidate.kind, `${path}.kind`);

  if (kind === "email") {
    const link = candidate.link === undefined ? undefined : record(candidate.link, `${path}.link`);
    return {
      kind,
      fromName: string(candidate.fromName, `${path}.fromName`),
      fromEmail: string(candidate.fromEmail, `${path}.fromEmail`),
      replyTo: optionalString(candidate.replyTo, `${path}.replyTo`),
      mailedBy: optionalString(candidate.mailedBy, `${path}.mailedBy`),
      signedBy: optionalString(candidate.signedBy, `${path}.signedBy`),
      to: optionalString(candidate.to, `${path}.to`),
      timestamp: string(candidate.timestamp, `${path}.timestamp`),
      subject: string(candidate.subject, `${path}.subject`),
      paragraphs: strings(candidate.paragraphs, `${path}.paragraphs`),
      link: link
        ? {
            href: string(link.href, `${path}.link.href`),
            label: string(link.label, `${path}.link.label`),
          }
        : undefined,
    };
  }

  if (kind === "directory") {
    return {
      kind,
      university: string(candidate.university, `${path}.university`),
      domain: optionalString(candidate.domain, `${path}.domain`),
      searchTerm: optionalString(candidate.searchTerm, `${path}.searchTerm`),
      breadcrumbs: strings(candidate.breadcrumbs, `${path}.breadcrumbs`),
      name: string(candidate.name, `${path}.name`),
      title: string(candidate.title, `${path}.title`),
      department: string(candidate.department, `${path}.department`),
      office: string(candidate.office, `${path}.office`),
      email: string(candidate.email, `${path}.email`),
      phone: string(candidate.phone, `${path}.phone`),
      sidebar: strings(candidate.sidebar, `${path}.sidebar`),
      note: optionalString(candidate.note, `${path}.note`),
    };
  }

  if (kind === "call") {
    return {
      kind,
      contactName: string(candidate.contactName, `${path}.contactName`),
      number: string(candidate.number, `${path}.number`),
      transcript: strings(candidate.transcript, `${path}.transcript`),
    };
  }

  if (kind === "web") {
    return {
      kind,
      siteName: string(candidate.siteName, `${path}.siteName`),
      heading: string(candidate.heading, `${path}.heading`),
      url: string(candidate.url, `${path}.url`),
      paragraphs: strings(candidate.paragraphs, `${path}.paragraphs`),
    };
  }

  if (kind === "portal") {
    return {
      kind,
      serviceName: string(candidate.serviceName, `${path}.serviceName`),
      heading: string(candidate.heading, `${path}.heading`),
      rows: array(candidate.rows, `${path}.rows`).map((entry, index) => {
        const row = record(entry, `${path}.rows[${index}]`);
        return {
          label: string(row.label, `${path}.rows[${index}].label`),
          value: string(row.value, `${path}.rows[${index}].value`),
        };
      }),
    };
  }

  throw new CaseSchemaError(`${path}.kind has an unsupported value`);
}

function artifact(value: unknown, index: number): Artifact {
  const path = `case.artifacts[${index}]`;
  const candidate = record(value, path);
  if (typeof candidate.decisive !== "boolean") {
    throw new CaseSchemaError(`${path}.decisive must be a boolean`);
  }
  return {
    id: string(candidate.id, `${path}.id`),
    title: string(candidate.title, `${path}.title`),
    channel: enumValue(candidate.channel, CHANNELS, `${path}.channel`),
    sourceRoot: string(candidate.sourceRoot, `${path}.sourceRoot`),
    sourceRootLabel: string(candidate.sourceRootLabel, `${path}.sourceRootLabel`),
    sourceClass: enumValue(candidate.sourceClass, SOURCE_CLASSES, `${path}.sourceClass`),
    provenance: string(candidate.provenance, `${path}.provenance`),
    content: content(candidate.content, `${path}.content`),
    supports: verdicts(candidate.supports, `${path}.supports`),
    contradicts:
      candidate.contradicts === undefined
        ? undefined
        : verdicts(candidate.contradicts, `${path}.contradicts`),
    evidenceWeight: enumValue(
      candidate.evidenceWeight,
      EVIDENCE_WEIGHTS,
      `${path}.evidenceWeight`,
    ),
    decisive: candidate.decisive,
    unlockedBy: optionalString(candidate.unlockedBy, `${path}.unlockedBy`),
  };
}

function action(value: unknown, index: number): Action {
  const path = `case.actions[${index}]`;
  const candidate = record(value, path);
  return {
    id: string(candidate.id, `${path}.id`),
    label: string(candidate.label, `${path}.label`),
    type: enumValue(candidate.type, ACTION_TYPES, `${path}.type`),
    sourceRoot: string(candidate.sourceRoot, `${path}.sourceRoot`),
    sourceClass: enumValue(candidate.sourceClass, SOURCE_CLASSES, `${path}.sourceClass`),
    reveals: strings(candidate.reveals, `${path}.reveals`),
    riskCost: enumValue(candidate.riskCost, RISK_COSTS, `${path}.riskCost`),
    unlockedBy: optionalString(candidate.unlockedBy, `${path}.unlockedBy`),
  };
}

function sourceNote(value: unknown, path: string): SourceNote {
  const candidate = record(value, path);
  const year = candidate.year;
  if (!Number.isInteger(year) || (year as number) < 2000) {
    throw new CaseSchemaError(`${path}.year must be a four-digit year`);
  }
  return {
    pattern: string(candidate.pattern, `${path}.pattern`),
    source: string(candidate.source, `${path}.source`),
    year: year as number,
    url: string(candidate.url, `${path}.url`),
  };
}

function caller(value: unknown): CallerConfig {
  const candidate = record(value, "case.caller");
  const maxCallSeconds = candidate.maxCallSeconds;
  if (!Number.isInteger(maxCallSeconds) || (maxCallSeconds as number) <= 0) {
    throw new CaseSchemaError("case.caller.maxCallSeconds must be a positive integer");
  }
  return {
    characterName: string(candidate.characterName, "case.caller.characterName"),
    organizationName: string(candidate.organizationName, "case.caller.organizationName"),
    persona: string(candidate.persona, "case.caller.persona"),
    firstMessage: string(candidate.firstMessage, "case.caller.firstMessage"),
    scenarioSummary: string(candidate.scenarioSummary, "case.caller.scenarioSummary"),
    allowedFacts: strings(candidate.allowedFacts, "case.caller.allowedFacts"),
    forbiddenRequests: strings(
      candidate.forbiddenRequests,
      "case.caller.forbiddenRequests",
    ),
    contradiction: string(candidate.contradiction, "case.caller.contradiction"),
    crackLine: string(candidate.crackLine, "case.caller.crackLine"),
    maxCallSeconds: maxCallSeconds as number,
  };
}

export function parseCaseFile(value: unknown): CaseFile {
  const candidate = record(value, "case");
  const briefing = strings(candidate.briefing, "case.briefing");
  if (briefing.length !== 2) {
    throw new CaseSchemaError("case.briefing must contain exactly two lines");
  }
  const debrief = record(candidate.debrief, "case.debrief");
  const estimatedMinutes = candidate.estimatedMinutes;
  if (!Number.isInteger(estimatedMinutes) || (estimatedMinutes as number) <= 0) {
    throw new CaseSchemaError("case.estimatedMinutes must be a positive integer");
  }

  return {
    id: string(candidate.id, "case.id"),
    title: string(candidate.title, "case.title"),
    shortTitle: string(candidate.shortTitle, "case.shortTitle"),
    category: enumValue(candidate.category, CASE_CATEGORIES, "case.category"),
    difficulty: enumValue(candidate.difficulty, CASE_DIFFICULTIES, "case.difficulty"),
    rank: enumValue(candidate.rank, CASE_RANKS, "case.rank"),
    neutralTitle: string(candidate.neutralTitle, "case.neutralTitle"),
    estimatedMinutes: estimatedMinutes as number,
    sourceNote: sourceNote(candidate.sourceNote, "case.sourceNote"),
    truth: enumValue(candidate.truth, VERDICTS, "case.truth"),
    claimantSourceRoot: string(candidate.claimantSourceRoot, "case.claimantSourceRoot"),
    briefing: [briefing[0], briefing[1]],
    startingArtifactIds: strings(candidate.startingArtifactIds, "case.startingArtifactIds"),
    artifacts: array(candidate.artifacts, "case.artifacts").map(artifact),
    actions: array(candidate.actions, "case.actions").map(action),
    allowedPressureTactics: array(
      candidate.allowedPressureTactics,
      "case.allowedPressureTactics",
    ).map((entry, index) =>
      enumValue(entry, PRESSURE_TACTICS, `case.allowedPressureTactics[${index}]`),
    ),
    caller: candidate.caller === undefined ? undefined : caller(candidate.caller),
    debrief: {
      lesson: string(debrief.lesson, "case.debrief.lesson"),
      realWorldAction: string(debrief.realWorldAction, "case.debrief.realWorldAction"),
      sourceUrl: string(debrief.sourceUrl, "case.debrief.sourceUrl"),
      sourceLabel: string(debrief.sourceLabel, "case.debrief.sourceLabel"),
    },
  };
}

export const caseFileSchema = {
  parse: parseCaseFile,
  safeParse(value: unknown):
    | { success: true; data: CaseFile }
    | { success: false; error: CaseSchemaError } {
    try {
      return { success: true, data: parseCaseFile(value) };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof CaseSchemaError
            ? error
            : new CaseSchemaError("case validation failed"),
      };
    }
  },
};
