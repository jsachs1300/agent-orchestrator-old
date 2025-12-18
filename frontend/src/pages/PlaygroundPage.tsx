import { useMemo, useState, useCallback } from 'react';
import GitConfigFields from '../components/GitConfigFields';
import PromptForm from '../components/PromptForm';
import ResultPanel from '../components/ResultPanel';
import { DebugPanel } from '../components/DebugPanel';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { GitConfig, GitCredentials, PlanRequestPayload, PlanResponse, DebugSettings, DebugLog } from '../types';
import { ApiClient } from '../utils/apiClient';

const defaultGitConfig: GitConfig = {
  repoOwner: '',
  repoName: '',
  defaultBranch: 'main',
};

const defaultGitCredentials: GitCredentials = {
  authType: 'none',
  patToken: '',
};

const defaultDebugSettings: DebugSettings = {
  enabled: false,
};

export default function PlaygroundPage() {
  const [gitConfig] = useLocalStorage<GitConfig>('gitConfig', defaultGitConfig);
  const [gitCredentials] = useLocalStorage<GitCredentials>('gitCredentials', defaultGitCredentials);
  const [debugSettings] = useLocalStorage<DebugSettings>('debugSettings', defaultDebugSettings);
  const [response, setResponse] = useState<PlanResponse | null>(null);
  const [error, setError] = useState<{ status?: number; statusText?: string; body?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const apiBaseUrl = useMemo(() => import.meta.env.VITE_API_BASE_URL || '', []);

  const handleDebugLog = useCallback((log: DebugLog) => {
    setDebugLogs((prev) => [...prev, log]);
  }, []);

  const apiClient = useMemo(
    () =>
      new ApiClient({
        debugEnabled: debugSettings.enabled,
        onDebugLog: handleDebugLog,
      }),
    [debugSettings.enabled, handleDebugLog]
  );

  const handleRun = async ({ prompt }: { prompt: string }) => {
    setIsLoading(true);
    setError(null);

    const payload: PlanRequestPayload = {
      goal: prompt,
      tools: {
        git: {
          repoOwner: gitConfig.repoOwner,
          repoName: gitConfig.repoName,
          defaultBranch: gitConfig.defaultBranch || 'main',
        },
      },
    };

    try {
      const headers: Record<string, string> = {};
      if (gitCredentials.authType === 'pat' && gitCredentials.patToken) {
        headers['Authorization'] = `Bearer ${gitCredentials.patToken}`;
      }

      const result = await apiClient.post<PlanResponse>('/plan', payload, headers);
      setResponse(result.data);
      setError(null);
    } catch (err) {
      setError({ statusText: 'Network error', body: (err as Error).message });
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = useCallback(() => {
    setDebugLogs([]);
  }, []);

  return (
    <div className="layout-grid">
      <div>
        <PromptForm gitConfig={gitConfig} gitCredentials={gitCredentials} onSubmit={handleRun} isSubmitting={isLoading} />
        <ResultPanel data={response} error={error} isLoading={isLoading} />
        {debugSettings.enabled && (
          <DebugPanel logs={debugLogs} onClear={handleClearLogs} />
        )}
      </div>
      <div>
        <GitConfigFields gitConfig={gitConfig} gitCredentials={gitCredentials} />
      </div>
    </div>
  );
}
