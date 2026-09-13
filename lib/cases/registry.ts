import { CASE_01 } from "@/lib/cases/case-01";
import type { CaseFile } from "@/lib/cases/schema";
import { validateCaseRegistry } from "@/lib/engine/validate-case";

const ENABLED_CASES = validateCaseRegistry([CASE_01]);
const CASES_BY_ID = new Map(ENABLED_CASES.map((caseFile) => [caseFile.id, caseFile]));

export const CASE_ORDER = ENABLED_CASES.map((caseFile) => caseFile.id);

export function getCase(caseId: string): CaseFile | undefined {
  return CASES_BY_ID.get(caseId);
}

export function getEnabledCases(): readonly CaseFile[] {
  return ENABLED_CASES;
}

export function nextCaseId(caseId: string): string | undefined {
  const index = CASE_ORDER.indexOf(caseId);
  return index < 0 ? undefined : CASE_ORDER[index + 1];
}
