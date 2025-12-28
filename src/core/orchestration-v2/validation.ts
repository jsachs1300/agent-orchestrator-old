import { Requirement } from "./types";

const allowedPriorities = new Set(["P0", "P1", "P2", "P3"]);

const requirementKeys = new Set([
  "req_id",
  "title",
  "priority",
  "acceptance",
  "constraints",
  "source_ref",
  "status"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    // empty arrays are allowed
    value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  );
}

function hasOnlyKnownKeys(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).every((key) => requirementKeys.has(key));
}

export function parseRequirementsPayload(
  payload: unknown
): { requirements: Requirement[] } | { error: string } {
  if (!Array.isArray(payload)) {
    return { error: "payload must be an array of requirements" };
  }

  const requirements: Requirement[] = [];
  const seenReqIds = new Set<string>();

  for (const entry of payload) {
    if (!isRecord(entry)) {
      return { error: "each requirement must be an object" };
    }

    if (!hasOnlyKnownKeys(entry)) {
      return { error: "unexpected fields in requirement" };
    }

    const reqId = entry.req_id;
    const title = entry.title;
    const priority = entry.priority;
    const acceptance = entry.acceptance;
    const constraints = entry.constraints;
    const sourceRef = entry.source_ref;
    const status = entry.status ?? "derived";

    if (!isNonEmptyString(reqId)) {
      return { error: "req_id is required" };
    }
    if (seenReqIds.has(reqId)) {
      return { error: "duplicate req_id in payload" };
    }
    seenReqIds.add(reqId);
    if (!isNonEmptyString(title)) {
      return { error: "title is required" };
    }
    if (!isNonEmptyString(priority)) {
      return { error: "priority is required" };
    }
    if (!allowedPriorities.has(priority)) {
      return { error: "priority must be one of P0, P1, P2, P3" };
    }
    if (!isNonEmptyStringArray(acceptance)) {
      return { error: "acceptance must be an array of strings" };
    }
    if (!isNonEmptyStringArray(constraints)) {
      return { error: "constraints must be an array of strings" };
    }
    if (!isNonEmptyString(sourceRef)) {
      return { error: "source_ref is required" };
    }
    if (status !== "derived") {
      return { error: "status must be derived" };
    }

    requirements.push({
      req_id: reqId,
      title,
      priority,
      acceptance,
      constraints,
      source_ref: sourceRef,
      status
    });
  }

  return { requirements };
}
