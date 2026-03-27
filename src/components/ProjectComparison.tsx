/**
 * ProjectComparison - Compare multiple project scenarios
 *
 * Allows users to save and compare different project configurations
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { useCalculationStore } from '@/stores/calculationStore';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

interface ComparisonProject {
  id: string;
  name: string;
  input: ProjectInput;
  irr: number;
  npv: number;
  paybackPeriod: number;
  lcoe: number;
}

interface ProjectComparisonProps {
  className?: string;
}

export const ProjectComparison: React.FC<ProjectComparisonProps> = ({
  className = '',
}) => {
  const { t } = useTranslation();
  const { result: currentResult } = useCalculationStore();
  const { currentProject } = useProjectStore();

  const [savedProjects, setSavedProjects] = useState<ComparisonProject[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Add current project to comparison
  const addToComparison = () => {
    if (!currentResult || !currentProject) return;

    const newProject: ComparisonProject = {
      id: currentProject.id || `project-${Date.now()}`,
      name: `方案 ${savedProjects.length + 1}`,
      input: currentProject,
      irr: currentResult.irr || 0,
      npv: currentResult.npv || 0,
      paybackPeriod: currentResult.paybackPeriod || 0,
      lcoe: currentResult.levelizedCost || 0,
    };

    setSavedProjects([...savedProjects, newProject]);
  };

  // Remove project from comparison
  const removeProject = (id: string) => {
    setSavedProjects(savedProjects.filter(p => p.id !== id));
  };

  // Clear all projects
  const clearAll = () => {
    setSavedProjects([]);
  };

  // Generate comparison table
  const renderComparisonTable = () => {
    if (savedProjects.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium mb-2">还没有对比方案</p>
          <p className="text-sm">点击"添加到对比"按钮保存当前方案</p>
        </div>
      );
    }

    // Find best values for highlighting
    const bestIRR = Math.max(...savedProjects.map(p => p.irr));
    const bestNPV = Math.max(...savedProjects.map(p => p.npv));
    const bestPayback = Math.min(...savedProjects.filter(p => p.paybackPeriod > 0).map(p => p.paybackPeriod));

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">方案名称</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900">IRR</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900">NPV (万元)</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900">回收期 (年)</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900">LCOE (元/kWh)</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {savedProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{project.name}</td>
                <td className={`px-4 py-3 text-right font-semibold ${
                  project.irr === bestIRR ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {project.irr.toFixed(2)}%
                  {project.irr === bestIRR && (
                    <span className="ml-1 text-xs">⭐</span>
                  )}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${
                  project.npv === bestNPV ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {(project.npv / 10000).toFixed(1)}
                  {project.npv === bestNPV && (
                    <span className="ml-1 text-xs">⭐</span>
                  )}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${
                  project.paybackPeriod === bestPayback && project.paybackPeriod > 0 ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {project.paybackPeriod > 0 && project.paybackPeriod < 100
                    ? project.paybackPeriod.toFixed(1)
                    : '无法回收'
                  }
                  {project.paybackPeriod === bestPayback && project.paybackPeriod > 0 && (
                    <span className="ml-1 text-xs">⭐</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {project.lcoe.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => removeProject(project.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!showComparison) {
    return (
      <div className={`project-comparison ${className}`}>
        <button
          onClick={() => setShowComparison(true)}
          disabled={!currentResult}
          className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
            !currentResult
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-blue-400'
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          项目对比
          {savedProjects.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
              {savedProjects.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`project-comparison-panel bg-white rounded-lg border border-gray-200 shadow-lg ${className}`}>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">项目方案对比</h3>
          <p className="text-sm text-gray-500 mt-1">
            保存多个方案进行对比分析
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {currentResult && (
            <button
              onClick={addToComparison}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              添加当前方案
            </button>
          )}
          {savedProjects.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            >
              清空全部
            </button>
          )}
          <button
            onClick={() => setShowComparison(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        {renderComparisonTable()}
      </div>

      {/* Comparison insights */}
      {savedProjects.length >= 2 && (
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              对比分析
            </h4>
            <p className="text-xs text-blue-800">
              最佳IRR方案为 <span className="font-semibold">{Math.max(...savedProjects.map(p => p.irr)).toFixed(2)}%</span>，
              最高NPV为 <span className="font-semibold">{(Math.max(...savedProjects.map(p => p.npv)) / 10000).toFixed(1)}万元</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectComparison;
