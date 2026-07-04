"use client";

import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { DIMENSIONS } from "@/lib/scoring";
import { MSMEScores } from "@/lib/types";

interface RadarChartMetricsProps {
  scores: MSMEScores;
}

export function RadarChartMetrics({ scores }: RadarChartMetricsProps) {
  const data = DIMENSIONS.map((dim) => ({
    subject: dim.label,
    value: scores[dim.key as keyof MSMEScores],
    fullMark: 100,
  }));

  return (
    <div className="w-full h-[300px] sm:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickCount={6}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#ffffff", 
              borderColor: "#cbd5e1",
              borderRadius: "4px",
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
            }}
            itemStyle={{ color: "#0f172a", fontWeight: 600 }}
          />
          <Radar
            name="MSME Score"
            dataKey="value"
            stroke="#0f172a"
            strokeWidth={2}
            fill="#0f172a"
            fillOpacity={0.15}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
