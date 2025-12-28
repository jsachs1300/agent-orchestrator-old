export type AgentRole = "pm" | "architect" | "coder" | "tester";

export type RequirementStatus = "derived";

export interface Requirement {
  req_id: string;
  title: string;
  priority: string;
  acceptance: string[];
  constraints: string[];
  source_ref: string;
  status: RequirementStatus;
}

export type SliceStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "completed";

export interface SliceDeliverables {
  architect: { design_spec: string | null };
  coder: { implementation_notes: string | null; pr: string | null };
  tester: { test_plan: string | null; test_results: string | null };
}

export interface Slice {
  slice_id: string;
  req_id: string;
  title: string;
  owner_role: AgentRole;
  status: SliceStatus;
  depends_on: string[];
  deliverables: SliceDeliverables;
  evidence: Evidence[];
}

export interface Decision {
  dec_id: string;
  statement: string;
  rationale: string;
  owner: "pm";
  date: string;
}

export type EvidenceType = "file" | "command" | "test" | "pr";

export interface Evidence {
  type: EvidenceType;
  ref: string;
  result: "pass" | "fail" | null;
}
