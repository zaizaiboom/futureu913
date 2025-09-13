'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Competency } from '@/types/competency';
import { TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DevelopmentTrendProps {
  competencyData: Competency[];
}

export function DevelopmentTrend({ competencyData }: DevelopmentTrendProps) {
  const getSpectrumPosition = (spectrum: string[], state: string): number => {
    return spectrum.findIndex(item => item === state);
  };

  const getTrendInfo = (competency: Competency) => {
    const previousIndex = getSpectrumPosition(competency.spectrum, competency.previousState);
    const currentIndex = getSpectrumPosition(competency.spectrum, competency.currentState);
    
    if (currentIndex > previousIndex) {
      return {
        type: 'improvement',
        icon: ArrowUpRight,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: '进步',
        emoji: '↗️'
      };
    } else if (currentIndex === previousIndex) {
      return {
        type: 'stable',
        icon: ArrowRight,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: '稳定',
        emoji: '➡️'
      };
    } else {
      return {
        type: 'decline',
        icon: ArrowDownRight,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: '待提升',
        emoji: '↘️'
      };
    }
  };

  const getStateColor = (competency: Competency, state: string) => {
    const index = getSpectrumPosition(competency.spectrum, state);
    const ratio = index / (competency.spectrum.length - 1);
    
    if (ratio >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (ratio >= 0.6) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (ratio >= 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          发展趋势对比
        </CardTitle>
        <p className="text-sm text-gray-600">对比上次评估的能力变化情况</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 表格头部 */}
          <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200">
            <div className="col-span-3 text-sm font-medium text-gray-700">能力维度</div>
            <div className="col-span-3 text-sm font-medium text-gray-700">上次状态</div>
            <div className="col-span-1 text-sm font-medium text-gray-700 text-center"></div>
            <div className="col-span-3 text-sm font-medium text-gray-700">本次状态</div>
            <div className="col-span-2 text-sm font-medium text-gray-700 text-center">趋势</div>
          </div>
          
          {/* 趋势数据行 */}
          {competencyData.map((competency) => {
            const trendInfo = getTrendInfo(competency);
            const TrendIcon = trendInfo.icon;
            
            return (
              <div 
                key={competency.id} 
                className={`grid grid-cols-12 gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                  trendInfo.bgColor
                } ${
                  trendInfo.borderColor
                }`}
              >
                {/* 能力名称 */}
                <div className="col-span-3 flex items-center">
                  <span className="font-medium text-gray-900">{competency.name}</span>
                </div>
                
                {/* 上次状态 */}
                <div className="col-span-3 flex items-center">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 ${getStateColor(competency, competency.previousState)}`}
                  >
                    {competency.previousState}
                  </Badge>
                </div>
                
                {/* 箭头 */}
                <div className="col-span-1 flex items-center justify-center">
                  <TrendIcon className={`h-4 w-4 ${trendInfo.color}`} />
                </div>
                
                {/* 本次状态 */}
                <div className="col-span-3 flex items-center">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 ${getStateColor(competency, competency.currentState)}`}
                  >
                    {competency.currentState}
                  </Badge>
                </div>
                
                {/* 趋势标识 */}
                <div className="col-span-2 flex items-center justify-center gap-2">
                  <span className="text-lg">{trendInfo.emoji}</span>
                  <Badge 
                    variant="outline"
                    className={`text-xs px-2 py-1 ${trendInfo.color} border-current`}
                  >
                    {trendInfo.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 图例说明 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">趋势说明</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">↗️</span>
              <span className="text-green-700">进步：能力等级有所提升</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">➡️</span>
              <span className="text-blue-700">稳定：能力等级保持不变</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">↘️</span>
              <span className="text-orange-700">待提升：需要重点关注</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}