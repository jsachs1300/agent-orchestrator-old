export interface GitConfig {
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
}

export interface GitCredentials {
  authType: 'none' | 'pat';
  patToken?: string;
}

export interface PlanRequestPayload {
  goal: string;
  tools: {
    git: {
      repoOwner: string;
      repoName: string;
      defaultBranch: string;
    };
  };
}

export type PlanResponse = unknown;

export interface DebugLog {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  method: string;
  url: string;
  duration?: number;
  request?: {
    headers: Record<string, string>;
    body?: unknown;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: unknown;
  };
  error?: {
    message: string;
    stack?: string;
  };
}

export interface DebugSettings {
  enabled: boolean;
}
