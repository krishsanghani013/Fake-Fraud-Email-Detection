'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function RiskDonutChart({ chartData, onSelectFilter }) {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-48 w-full flex items-center justify-center text-xs text-slate-400">
        No chart data available
      </div>
    );
  }

  return (
    <div className="h-48 w-full my-3">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0];
                return (
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 shadow-md text-xs">
                    <span className="font-semibold text-[#0F172A] dark:text-[#FAFBFC]">{data.name}: </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{data.value} emails</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            onClick={(entry) => onSelectFilter && onSelectFilter(entry.level)}
            cursor="pointer"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="transparent"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
