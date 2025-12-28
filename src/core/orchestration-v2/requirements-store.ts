import { Requirement } from "./types";

const requirements = new Map<string, Requirement>();

export function listRequirements(): Requirement[] {
  return Array.from(requirements.values());
}

export function getRequirement(reqId: string): Requirement | null {
  return requirements.get(reqId) ?? null;
}

export function addRequirements(newRequirements: Requirement[]): {
  added: Requirement[];
  duplicates: string[];
} {
  const added: Requirement[] = [];
  const duplicates: string[] = [];

  for (const requirement of newRequirements) {
    if (requirements.has(requirement.req_id)) {
      duplicates.push(requirement.req_id);
      continue;
    }
    requirements.set(requirement.req_id, requirement);
    added.push(requirement);
  }

  return { added, duplicates };
}

export function resetRequirementsStore(): void {
  requirements.clear();
}
