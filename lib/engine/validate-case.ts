import {
  EVIDENCE_WEIGHTS,
  PRESSURE_TACTICS,
  RISK_COSTS,
  caseFileSchema,
  type CaseFile,
} from "@/lib/cases/schema";

const APPROVED_DEBRIEF_HOSTS = new Set(["consumer.ftc.gov", "www.ftc.gov"]);
const FORBIDDEN_VOICE_PATTERNS = [
  /elevenlabs_api_key/i,
  /xi-api-key/i,
  /\bapi[_ -]?key\b/i,
  /\bcase truth\b/i,
  /\bscore (?:rule|weight|instruction)s?\b/i,
  /\bsk_[a-z0-9_-]{12,}\b/i,
];

export class CaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CaseValidationError";
  }
}

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new CaseValidationError(`Duplicate ${label} ID: ${value}`);
    }
    seen.add(value);
  }
}

function validateDebriefUrl(sourceUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new CaseValidationError("Debrief source URL is invalid");
  }
  if (parsed.protocol !== "https:" || !APPROVED_DEBRIEF_HOSTS.has(parsed.hostname)) {
    throw new CaseValidationError("Debrief source URL is not an approved HTTPS source");
  }
}

function validateVoiceConfig(caseFile: CaseFile) {
  if (!caseFile.caller) {
    return;
  }
  if (caseFile.caller.maxCallSeconds > 75) {
    throw new CaseValidationError("Caller maximum duration cannot exceed 75 seconds");
  }
  const voiceValues = [
    caseFile.caller.characterName,
    caseFile.caller.organizationName,
    caseFile.caller.persona,
    caseFile.caller.firstMessage,
    caseFile.caller.scenarioSummary,
    ...caseFile.caller.allowedFacts,
    ...caseFile.caller.forbiddenRequests,
    caseFile.caller.contradiction,
    caseFile.caller.crackLine,
  ];
  if (voiceValues.some((value) => FORBIDDEN_VOICE_PATTERNS.some((pattern) => pattern.test(value)))) {
    throw new CaseValidationError("Caller variables contain a secret or scoring/truth instruction");
  }
}

function validateSourceRoots(caseFile: CaseFile) {
  const roots = new Map<string, { label?: string; sourceClass: string }>();
  for (const artifact of caseFile.artifacts) {
    const existing = roots.get(artifact.sourceRoot);
    if (
      existing &&
      (existing.sourceClass !== artifact.sourceClass ||
        (existing.label !== undefined && existing.label !== artifact.sourceRootLabel))
    ) {
      throw new CaseValidationError(
        `Source root ${artifact.sourceRoot} has inconsistent provenance metadata`,
      );
    }
    roots.set(artifact.sourceRoot, {
      label: artifact.sourceRootLabel,
      sourceClass: artifact.sourceClass,
    });
  }

  for (const action of caseFile.actions) {
    const existing = roots.get(action.sourceRoot);
    if (existing && existing.sourceClass !== action.sourceClass) {
      throw new CaseValidationError(
        `Action ${action.id} conflicts with source root ${action.sourceRoot}`,
      );
    }
  }
}

function reachableActionIds(caseFile: CaseFile): Set<string> {
  const reachable = new Set(
    caseFile.actions.filter((action) => action.unlockedBy === undefined).map((action) => action.id),
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const action of caseFile.actions) {
      if (!reachable.has(action.id) && action.unlockedBy && reachable.has(action.unlockedBy)) {
        reachable.add(action.id);
        changed = true;
      }
    }
  }
  return reachable;
}

export function validateCase(input: unknown): CaseFile {
  const caseFile = caseFileSchema.parse(input);
  assertUnique([caseFile.id], "case");
  assertUnique(caseFile.artifacts.map((artifact) => artifact.id), "artifact");
  assertUnique(caseFile.actions.map((action) => action.id), "action");

  const artifactIds = new Set(caseFile.artifacts.map((artifact) => artifact.id));
  const actionIds = new Set(caseFile.actions.map((action) => action.id));

  for (const startingId of caseFile.startingArtifactIds) {
    if (!artifactIds.has(startingId)) {
      throw new CaseValidationError(`Unknown starting artifact: ${startingId}`);
    }
  }

  for (const artifact of caseFile.artifacts) {
    if (!EVIDENCE_WEIGHTS.includes(artifact.evidenceWeight)) {
      throw new CaseValidationError(`Unsupported evidence weight on ${artifact.id}`);
    }
    if (artifact.decisive && artifact.supports.length === 0) {
      throw new CaseValidationError(`Decisive artifact ${artifact.id} supports no verdict`);
    }
    if (artifact.supports.some((verdict) => artifact.contradicts?.includes(verdict))) {
      throw new CaseValidationError(
        `Artifact ${artifact.id} cannot support and contradict the same verdict`,
      );
    }
    if (artifact.unlockedBy && !actionIds.has(artifact.unlockedBy)) {
      throw new CaseValidationError(`Unknown unlock action ${artifact.unlockedBy}`);
    }
  }

  for (const action of caseFile.actions) {
    if (!RISK_COSTS.includes(action.riskCost)) {
      throw new CaseValidationError(`Unsupported risk cost on ${action.id}`);
    }
    if (action.unlockedBy && !actionIds.has(action.unlockedBy)) {
      throw new CaseValidationError(`Unknown action prerequisite ${action.unlockedBy}`);
    }
    for (const artifactId of action.reveals) {
      if (!artifactIds.has(artifactId)) {
        throw new CaseValidationError(`Unknown revealed artifact ${artifactId}`);
      }
    }
  }

  for (const artifact of caseFile.artifacts) {
    if (
      artifact.unlockedBy &&
      !caseFile.actions.find((action) => action.id === artifact.unlockedBy)?.reveals.includes(artifact.id)
    ) {
      throw new CaseValidationError(
        `Artifact ${artifact.id} is not revealed by unlock action ${artifact.unlockedBy}`,
      );
    }
  }


  for (const artifact of caseFile.artifacts) {
    if (
      !caseFile.startingArtifactIds.includes(artifact.id) &&
      artifact.unlockedBy === undefined
    ) {
      throw new CaseValidationError(
        `Artifact ${artifact.id} is neither starting evidence nor action-revealed`,
      );
    }
  }

  assertUnique(caseFile.allowedPressureTactics, "pressure tactic");
  if (
    caseFile.allowedPressureTactics.some(
      (tactic) => !PRESSURE_TACTICS.includes(tactic),
    )
  ) {
    throw new CaseValidationError("Caller contains an unsupported pressure tactic");
  }

  validateVoiceConfig(caseFile);
  validateDebriefUrl(caseFile.debrief.sourceUrl);
  validateSourceRoots(caseFile);

  const reachable = reachableActionIds(caseFile);
  const reachableArtifacts = new Set(caseFile.startingArtifactIds);
  for (const action of caseFile.actions) {
    if (reachable.has(action.id)) {
      action.reveals.forEach((artifactId) => reachableArtifacts.add(artifactId));
    }
  }

  const supportingReachableArtifact = caseFile.artifacts.some(
    (artifact) =>
      reachableArtifacts.has(artifact.id) && artifact.supports.includes(caseFile.truth),
  );
  if (caseFile.truth !== "not_enough_evidence" && !supportingReachableArtifact) {
    throw new CaseValidationError("Case has no achievable evidence supporting its truth");
  }

  if (caseFile.id === "case-01") {
    const decisiveIndependentScam = caseFile.artifacts.some(
      (artifact) =>
        reachableArtifacts.has(artifact.id) &&
        artifact.sourceClass === "independent" &&
        artifact.decisive &&
        artifact.supports.includes("scam"),
    );
    if (!decisiveIndependentScam) {
      throw new CaseValidationError(
        "Case 01 requires reachable decisive independent evidence supporting scam",
      );
    }
  }

  if (caseFile.truth === "not_enough_evidence") {
    const unresolvedIndependentCheck = caseFile.actions.some((action) => {
      if (!reachable.has(action.id) || action.sourceClass !== "independent") {
        return false;
      }
      return action.reveals.length > 0 && action.reveals.every((artifactId) => {
        const artifact = caseFile.artifacts.find((item) => item.id === artifactId);
        return artifact !== undefined && !artifact.decisive;
      });
    });
    if (!unresolvedIndependentCheck) {
      throw new CaseValidationError(
        "Not-enough-evidence cases require a reachable unresolved independent check",
      );
    }
  }

  return caseFile;
}

export function validateCaseRegistry(inputs: readonly unknown[]): CaseFile[] {
  const cases = inputs.map(validateCase);
  assertUnique(cases.map((caseFile) => caseFile.id), "case");
  return cases;
}
