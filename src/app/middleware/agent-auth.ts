import { NextFunction, Request, Response } from "express";
import { AgentRole } from "../../core/orchestration-v2/types";

const allowedRoles: AgentRole[] = ["pm", "architect", "coder", "tester"];

function isValidRole(value: string | string[] | undefined): value is AgentRole {
  if (typeof value !== "string") return false;
  return allowedRoles.includes(value as AgentRole);
}

export function requireAgentIdentity(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const role = req.header("X-Agent-Role");
  const agentId = req.header("X-Agent-Id");

  if (!isValidRole(role) || !agentId || agentId.trim().length === 0) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  res.locals.agentRole = role;
  res.locals.agentId = agentId;
  next();
}

export function requireRole(roles: AgentRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = res.locals.agentRole as AgentRole | undefined;
    if (!role || !roles.includes(role)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    next();
  };
}
