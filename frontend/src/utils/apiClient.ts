import { DebugLog } from '../types';

interface ApiClientOptions {
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface ApiClientConfig {
  debugEnabled: boolean;
  onDebugLog?: (log: DebugLog) => void;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  async request<T>(
    endpoint: string,
    options: ApiClientOptions
  ): Promise<{ data: T; log?: DebugLog }> {
    const url = `${apiBaseUrl}${endpoint}`;
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Prepare request headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Create debug log entry
    const debugLog: DebugLog = {
      id: requestId,
      timestamp: new Date().toISOString(),
      type: 'request',
      method: options.method,
      url,
      request: {
        headers: { ...headers },
        body: options.body,
      },
    };

    // Log request if debug is enabled
    if (this.config.debugEnabled) {
      console.log('[API Client] Request:', {
        id: requestId,
        method: options.method,
        url,
        headers,
        body: options.body,
      });
    }

    try {
      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const duration = Date.now() - startTime;

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      let responseBody: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      // Update debug log with response
      debugLog.type = response.ok ? 'response' : 'error';
      debugLog.duration = duration;
      debugLog.response = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
      };

      if (this.config.debugEnabled) {
        console.log('[API Client] Response:', {
          id: requestId,
          duration: `${duration}ms`,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
        });

        // Call the debug log callback if provided
        if (this.config.onDebugLog) {
          this.config.onDebugLog(debugLog);
        }
      }

      if (!response.ok) {
        throw new Error(
          `API Error: ${response.status} ${response.statusText}`
        );
      }

      return {
        data: responseBody as T,
        log: this.config.debugEnabled ? debugLog : undefined,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Update debug log with error
      debugLog.type = 'error';
      debugLog.duration = duration;
      debugLog.error = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };

      if (this.config.debugEnabled) {
        console.error('[API Client] Error:', {
          id: requestId,
          duration: `${duration}ms`,
          error: debugLog.error,
        });

        // Call the debug log callback if provided
        if (this.config.onDebugLog) {
          this.config.onDebugLog(debugLog);
        }
      }

      throw error;
    }
  }

  async post<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<{ data: T; log?: DebugLog }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body,
    });
  }

  async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<{ data: T; log?: DebugLog }> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  updateConfig(config: Partial<ApiClientConfig>) {
    this.config = { ...this.config, ...config };
  }
}
