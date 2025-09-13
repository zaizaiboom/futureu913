'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Competency } from '@/types/competency';
import { Brain, Target } from 'lucide-react';

interface CurrentCompetencyStatusProps {
  competencyData: Competency[];
}

export function CurrentCompetencyStatus({ competencyData }: CurrentCompetencyStatusProps) {
  const getSpectrumPosition = (spectrum: string[], state: string): number => {
    return spectrum.findIndex(item => item === state);
  };

  const getSpectrumColor = (index: number, currentIndex: number, totalLength: number) => {
    if (index === currentIndex) {
      // 当前状态 - 根据位置决定颜色
      const ratio = currentIndex / (totalLength - 1);
      if (ratio >= 0.8) return 'bg-green-500 text-white';
      if (ratio >= 0.6) return 'bg-blue-500 text-white';
      if (ratio >= 0.4) return 'bg-yellow-500 text-white';
      return 'bg-orange-500 text-white';
    }
    
    if (index < currentIndex) {
      // 已经超越的状态
      return 'bg-gray-200 text-gray-600';
    }
    
    // 尚未达到的状态
    return 'bg-gray-100 text-gray-400 border-dashed border';
  };

  const getProgressLineColor = (currentIndex: number, totalLength: number) => {
    const ratio = currentIndex / (totalLength - 1);
    if (ratio >= 0.8) return 'bg-green-400';
    if (ratio >= 0.6) return 'bg-blue-400';
    if (ratio >= 0.4) return 'bg-yellow-400';
    return 'bg-orange-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          当前能力状态
        </CardTitle>
        <p className="text-sm text-gray-600">基于能力光谱模型的诊断式反馈</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {competencyData.map((competency) => {
            const currentIndex = getSpectrumPosition(competency.spectrum, competency.currentState);
            const progressPercentage = currentIndex >= 0 ? (currentIndex / (competency.spectrum.length - 1)) * 100 : 0;
            
            return (
              <div key={competency.id} className="space-y-4">
                {/* 能力名称 */}
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">{competency.name}</h4>
                </div>
                
                {/* 能力光谱可视化 */}
                <div className="space-y-3">
                  {/* 进度线 */}
                  <div className="relative">
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressLineColor(currentIndex, competency.spectrum.length)}`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* 光谱节点 */}
                  <div className="flex justify-between items-center gap-2">
                    {competency.spectrum.map((state, index) => {
                      const isCurrent = index === currentIndex;
                      
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          {/* 节点圆点 */}
                          <div className="relative mb-2">
                            <div 
                              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                                isCurrent 
                                  ? 'border-blue-500 bg-blue-500 scale-125' 
                                  : index < currentIndex 
                                    ? 'border-green-400 bg-green-400' 
                                    : 'border-gray-300 bg-white'
                              }`}
                            />
                            {isCurrent && (
                              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full border-2 border-blue-300 animate-pulse" />
                            )}
                          </div>
                          
                          {/* 状态标签 */}
                          <Badge 
                            variant={isCurrent ? 'default' : 'outline'}
                            className={`text-xs px-2 py-1 text-center min-w-0 max-w-full ${
                              getSpectrumColor(index, currentIndex, competency.spectrum.length)
                            }`}
                          >
                            <span className="truncate">{state}</span>
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* AI诊断 */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">AI诊断</p>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {competency.currentDiagnosis}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}