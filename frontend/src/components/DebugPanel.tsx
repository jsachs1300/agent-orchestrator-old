import { useState } from 'react';
import { DebugLog } from '../types';

interface DebugPanelProps {
  logs: DebugLog[];
  onClear: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ logs, onClear }) => {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleLog = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getLogTypeColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'request':
        return '#3b82f6'; // blue
      case 'response':
        return '#22c55e'; // green
      case 'error':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const formatJson = (obj: unknown) => {
    return JSON.stringify(obj, null, 2);
  };

  if (logs.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <h3
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            margin: 0,
            cursor: 'pointer',
            fontSize: '1.125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{isCollapsed ? '▶' : '▼'}</span>
          Debug Logs ({logs.length})
        </h3>
        <button
          onClick={onClear}
          style={{
            padding: '0.375rem 0.75rem',
            fontSize: '0.875rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          Clear Logs
        </button>
      </div>

      {!isCollapsed && (
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            maxHeight: '500px',
            overflowY: 'auto',
          }}
        >
          {logs.map((log, index) => {
            const isExpanded = expandedLogs.has(log.id);
            return (
              <div
                key={log.id}
                style={{
                  borderBottom:
                    index < logs.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}
              >
                <div
                  onClick={() => toggleLog(log.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#f9fafb' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <span>{isExpanded ? '▼' : '▶'}</span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getLogTypeColor(log.type),
                    }}
                  ></span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {log.method}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      color: '#6b7280',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    {log.url}
                  </span>
                  {log.duration && (
                    <span
                      style={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                      }}
                    >
                      {log.duration}ms
                    </span>
                  )}
                  {log.response && (
                    <span
                      style={{
                        color: getLogTypeColor(log.type),
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      {log.response.status}
                    </span>
                  )}
                  <span
                    style={{
                      color: '#9ca3af',
                      fontSize: '0.75rem',
                    }}
                  >
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      fontSize: '0.875rem',
                    }}
                  >
                    {log.request && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4
                          style={{
                            margin: '0 0 0.5rem 0',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#374151',
                          }}
                        >
                          Request
                        </h4>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Headers:</strong>
                          <pre
                            style={{
                              backgroundColor: 'white',
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                              overflow: 'auto',
                              margin: '0.25rem 0 0 0',
                              fontSize: '0.75rem',
                            }}
                          >
                            {formatJson(log.request.headers)}
                          </pre>
                        </div>
                        {log.request.body && (
                          <div>
                            <strong>Body:</strong>
                            <pre
                              style={{
                                backgroundColor: 'white',
                                padding: '0.5rem',
                                borderRadius: '0.25rem',
                                overflow: 'auto',
                                margin: '0.25rem 0 0 0',
                                fontSize: '0.75rem',
                              }}
                            >
                              {formatJson(log.request.body)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {log.response && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4
                          style={{
                            margin: '0 0 0.5rem 0',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#374151',
                          }}
                        >
                          Response
                        </h4>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Status:</strong> {log.response.status}{' '}
                          {log.response.statusText}
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Headers:</strong>
                          <pre
                            style={{
                              backgroundColor: 'white',
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                              overflow: 'auto',
                              margin: '0.25rem 0 0 0',
                              fontSize: '0.75rem',
                            }}
                          >
                            {formatJson(log.response.headers)}
                          </pre>
                        </div>
                        {log.response.body && (
                          <div>
                            <strong>Body:</strong>
                            <pre
                              style={{
                                backgroundColor: 'white',
                                padding: '0.5rem',
                                borderRadius: '0.25rem',
                                overflow: 'auto',
                                margin: '0.25rem 0 0 0',
                                fontSize: '0.75rem',
                              }}
                            >
                              {formatJson(log.response.body)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {log.error && (
                      <div>
                        <h4
                          style={{
                            margin: '0 0 0.5rem 0',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#ef4444',
                          }}
                        >
                          Error
                        </h4>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Message:</strong> {log.error.message}
                        </div>
                        {log.error.stack && (
                          <div>
                            <strong>Stack:</strong>
                            <pre
                              style={{
                                backgroundColor: 'white',
                                padding: '0.5rem',
                                borderRadius: '0.25rem',
                                overflow: 'auto',
                                margin: '0.25rem 0 0 0',
                                fontSize: '0.75rem',
                                color: '#ef4444',
                              }}
                            >
                              {log.error.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
