import type { CaseFile } from "@/lib/cases/schema";
import type { VoiceDynamicVariables } from "@/lib/voice/types";

export function buildCaseVariables(caseFile: CaseFile): VoiceDynamicVariables {
  if (!caseFile.caller) {
    throw new Error(`Case ${caseFile.id} has no caller configuration`);
  }
  return {
    case_title: caseFile.shortTitle,
    character_name: caseFile.caller.characterName,
    organization_name: caseFile.caller.organizationName,
    persona: caseFile.caller.persona,
    opening_line: caseFile.caller.firstMessage,
    scenario_summary: caseFile.caller.scenarioSummary,
    allowed_facts: caseFile.caller.allowedFacts.join(" "),
    contradiction: caseFile.caller.contradiction,
    crack_line: caseFile.caller.crackLine,
    allowed_tactics: caseFile.allowedPressureTactics.join(", "),
  };
}
