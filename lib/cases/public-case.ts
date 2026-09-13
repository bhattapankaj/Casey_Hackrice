import type { SourceClass } from "@/lib/cases/schema";
import type { Band } from "@/lib/channels";

export function sourceClassToBand(sourceClass: SourceClass): Band {
  if (sourceClass === "claimant") {
    return "in";
  }
  if (sourceClass === "independent") {
    return "out";
  }
  return "unknown";
}
