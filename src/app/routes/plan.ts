import { Router } from "express";
import { createSession, setSessionTools } from "../../core/session-store";
import { runOrchestrationTurn } from "../../core/orchestrator";

const router = Router();

interface PlanRequestPayload {
  goal: string;
  tools?: {
    git?: {
      repoOwner: string;
      repoName: string;
      defaultBranch: string;
    };
  };
}

/**
 * POST /plan
 * Generate an execution plan for a given goal
 * body: { goal: string, tools?: { git?: { repoOwner, repoName, defaultBranch } } }
 */
router.post("/", async (req, res) => {
  const body = (req.body ?? {}) as PlanRequestPayload;

  if (!body.goal || typeof body.goal !== "string" || body.goal.trim().length === 0) {
    return res.status(400).json({ error: "goal is required" });
  }

  try {
    // Create a new session for this planning request
    const session = await createSession({
      goal: body.goal,
      metadata: {
        type: "plan",
        createdAt: new Date().toISOString()
      }
    });

    // Configure git tools if provided
    if (body.tools?.git) {
      const { repoOwner, repoName, defaultBranch } = body.tools.git;

      await setSessionTools(session, [
        {
          name: "repo.search",
          enabled: true,
          config: {
            repoOwner,
            repoName,
            defaultBranch
          }
        },
        {
          name: "repo.read_file",
          enabled: true,
          config: {
            repoOwner,
            repoName,
            defaultBranch
          }
        },
        {
          name: "repo.write_file",
          enabled: true,
          config: {
            repoOwner,
            repoName,
            defaultBranch
          }
        },
        {
          name: "repo.create_branch",
          enabled: true,
          config: {
            repoOwner,
            repoName,
            defaultBranch
          }
        },
        {
          name: "repo.list_branches",
          enabled: true,
          config: {
            repoOwner,
            repoName,
            defaultBranch
          }
        },
        {
          name: "symbol.find_definition",
          enabled: true,
          config: {
            repoOwner,
            repoName,
            defaultBranch
          }
        },
        {
          name: "symbol.find_references",
          enabled: true,
          config: {
            repoOwner,
            repoName,
            defaultBranch
          }
        }
      ]);
    }

    // Generate the plan using orchestration
    const planningPrompt = `Please create a detailed execution plan for the following goal. Break it down into clear, actionable steps and identify which tools you would need to use.

Goal: ${body.goal}

Provide:
1. A list of steps to accomplish this goal
2. Which tools/APIs you would use for each step
3. Any potential challenges or considerations
4. An estimate of the complexity (low, medium, or high)`;

    const messages = await runOrchestrationTurn(session, planningPrompt);

    res.json({
      sessionId: session.id,
      goal: body.goal,
      messages,
      session
    });
  } catch (err) {
    console.error("Error in POST /plan", err);
    res.status(500).json({
      error: "internal_error",
      message: (err as Error).message
    });
  }
});

export default router;
