import { Router } from "express";
import { requireAgentIdentity, requireRole } from "../../middleware/agent-auth";
import {
  addRequirements,
  getRequirement
} from "../../../core/orchestration-v2/requirements-store";
import { parseRequirementsPayload } from "../../../core/orchestration-v2/validation";

const router = Router();

router.use(requireAgentIdentity);

/**
 * POST /v1/requirements/bulk (PM only)
 * body: [Requirement]
 */
router.post("/bulk", requireRole(["pm"]), (req, res) => {
  const parsed = parseRequirementsPayload(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: "validation_error", message: parsed.error });
    return;
  }

  const { added, duplicates } = addRequirements(parsed.requirements);

  if (duplicates.length > 0) {
    res.status(409).json({
      error: "requirement_exists",
      message: "One or more requirements already exist",
      duplicates
    });
    return;
  }

  res.status(201).json({ requirements: added });
});

/**
 * GET /v1/requirements/:req_id
 */
router.get("/:req_id", (req, res) => {
  const requirement = getRequirement(req.params.req_id);
  if (!requirement) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.json(requirement);
});

export default router;
