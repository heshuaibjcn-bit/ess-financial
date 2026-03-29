/**
 * Agent Metrics Dashboard - Real-time performance monitoring
 *
 * Displays:
 * - Per-agent success rates
 * - Average latency
 * - Token usage
 * - Error tracking
 */

import { useEffect, useState } from 'react';
import { getCommunicationLogger } from '../../services/agents/AgentCommunicationLogger';
import type { AgentMetrics } from '../../services/agents/AgentCommunicationLogger';

interface DashboardProps {
  refreshInterval?: number; // milliseconds
}

export function AgentMetricsDashboard({ refreshInterval = 5000 }: DashboardProps) {
  const [metrics, setMetrics] = useState<AgentMetrics[]>([]);
  const [healthScore, setHealthScore] = useState<number>(100);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());

  useEffect(() => {
    const logger = getCommunicationLogger();

    // Initial load
    const updateMetrics = () => {
      const agentMetrics = logger.getAllAgentMetrics();
      setMetrics(agentMetrics);
      setHealthScore(logger.getHealthScore());
      setLastUpdate(new Date().toISOString());
    };

    updateMetrics();

    // Subscribe to real-time updates
    const unsubscribe = logger.subscribe(() => {
      updateMetrics();
    });

    // Set up refresh interval
    const interval = setInterval(updateMetrics, refreshInterval);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshInterval]);

  const getHealthColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 95) return 'bg-green-500';
    if (rate >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="agent-metrics-dashboard p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Agent Performance Metrics</h2>
        <div className="text-sm text-gray-500">
          Last update: {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      </div>

      {/* System Health Score */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">System Health Score</span>
          <span className={`text-3xl font-bold ${getHealthColor(healthScore)}`}>
            {healthScore.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getHealthColor(healthScore).replace('text-', 'bg-')}`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>

      {/* Per-Agent Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((agent) => (
          <div key={agent.agentName} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{agent.agentName}</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                agent.successRate >= 95 ? 'bg-green-100 text-green-800' :
                agent.successRate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {agent.successRate.toFixed(1)}% success
              </span>
            </div>

            {/* Success Rate Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Success Rate</span>
                <span>{agent.successCount}/{agent.totalCalls}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getSuccessRateColor(agent.successRate)}`}
                  style={{ width: `${agent.successRate}%` }}
                />
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600 text-xs">Avg Latency</div>
                <div className="font-semibold">{agent.averageLatency.toFixed(0)}ms</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600 text-xs">Total Tokens</div>
                <div className="font-semibold">{agent.totalTokens.toLocaleString()}</div>
              </div>
            </div>

            {/* Last Error */}
            {agent.lastError && (
              <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                <strong>Last Error:</strong> {agent.lastError}
              </div>
            )}

            {/* Last Call Time */}
            <div className="mt-2 text-xs text-gray-500">
              Last call: {new Date(agent.lastCallTime).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {metrics.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No agent metrics available yet</p>
          <p className="text-sm mt-2">Metrics will appear once agents start processing tasks</p>
        </div>
      )}

      {/* Export Buttons */}
      {metrics.length > 0 && (
        <div className="mt-6 flex gap-4 justify-end">
          <button
            onClick={() => {
              const logger = getCommunicationLogger();
              const blob = new Blob([logger.exportMetrics()], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `agent-metrics-${Date.now()}.json`;
              a.click();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Export Metrics (JSON)
          </button>
          <button
            onClick={() => {
              const logger = getCommunicationLogger();
              const blob = new Blob([logger.exportLogsAsCSV()], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `agent-logs-${Date.now()}.csv`;
              a.click();
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Export Logs (CSV)
          </button>
        </div>
      )}
    </div>
  );
}
