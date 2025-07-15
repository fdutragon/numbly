'use client';

import { useState } from 'react';
import { TrendingUp, Target, DollarSign, Clock, Users, BarChart3 } from 'lucide-react';

interface SalesData {
  score: number;
  stage: 'discovery' | 'qualification' | 'presentation' | 'objection' | 'closing' | 'won' | 'lost';
  interests: string[];
  objections: string[];
  budget?: string;
  timeline?: string;
  company?: string;
  urgency: 'low' | 'medium' | 'high';
  lastScoreUpdate: number;
}

interface SalesFunnelDebugProps {
  salesData: SalesData;
  isVisible?: boolean;
}

export function SalesFunnelDebug({ salesData, isVisible = false }: SalesFunnelDebugProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!isVisible) return null;

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'discovery': return 'bg-blue-500';
      case 'qualification': return 'bg-yellow-500';
      case 'presentation': return 'bg-orange-500';
      case 'objection': return 'bg-red-500';
      case 'closing': return 'bg-green-500';
      case 'won': return 'bg-emerald-500';
      case 'lost': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const stages = [
    { name: 'Discovery', range: '0-20', stage: 'discovery' },
    { name: 'Qualification', range: '21-40', stage: 'qualification' },
    { name: 'Presentation', range: '41-60', stage: 'presentation' },
    { name: 'Objection', range: '61-80', stage: 'objection' },
    { name: 'Closing', range: '81-100', stage: 'closing' },
  ];

  return (
    <div className="fixed bottom-20 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40 md:bottom-4">
      <div 
        className="p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer flex items-center justify-between"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Funil de Vendas
          </span>
        </div>
        <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          {collapsed ? '↓' : '↑'}
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Score Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Score</span>
              <span className="text-sm font-bold text-violet-600">{salesData.score}/100</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${salesData.score}%` }}
              />
            </div>
          </div>

          {/* Current Stage */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Stage Atual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStageColor(salesData.stage)}`} />
              <span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                {salesData.stage}
              </span>
            </div>
          </div>

          {/* Stages Progress */}
          <div className="space-y-1">
            {stages.map((stage, index) => (
              <div 
                key={stage.stage}
                className={`flex items-center gap-2 p-1 rounded text-xs ${
                  salesData.stage === stage.stage 
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${getStageColor(stage.stage)}`} />
                <span className="flex-1">{stage.name}</span>
                <span className="text-xs opacity-75">{stage.range}</span>
              </div>
            ))}
          </div>

          {/* Interests */}
          {salesData.interests.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Interesses</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {salesData.interests.map((interest, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Urgency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Urgência</span>
            </div>
            <span className={`text-xs font-medium capitalize ${getUrgencyColor(salesData.urgency)}`}>
              {salesData.urgency}
            </span>
          </div>

          {/* Objections */}
          {salesData.objections.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Objeções</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {salesData.objections.map((objection, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-xs rounded-full"
                  >
                    {objection}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Last Update */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            Último update: {new Date(salesData.lastScoreUpdate).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
