"use client";

import React from "react";
import { DIMENSIONS } from "@/lib/scoring";
import { MSMEScores } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HealthAssessmentFormProps {
  scores: MSMEScores;
  onScoreChange: (key: keyof MSMEScores, value: number) => void;
  onGenerate: () => void;
}

export function HealthAssessmentForm({ scores, onScoreChange }: HealthAssessmentFormProps) {
  const handleInputChange = (key: keyof MSMEScores, value: string) => {
    let numValue = parseInt(value, 10);
    if (isNaN(numValue)) numValue = 0;
    if (numValue < 0) numValue = 0;
    if (numValue > 100) numValue = 100;
    onScoreChange(key, numValue);
  };

  return (
    <div className="space-y-5 bg-white p-4 border border-border rounded-md">
      <div>
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Assessment Dimensions</h4>
        <p className="text-xs text-slate-400 font-semibold mb-4">Set scoring values (0-100) for credit evaluation</p>
      </div>

      <div className="space-y-4">
        {DIMENSIONS.map((dim) => (
          <div key={dim.key} className="space-y-2 pb-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={dim.key} className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                {dim.label} <span className="text-slate-400 font-normal ml-0.5">(Max {dim.maxPoints} pts)</span>
              </Label>
              <Input
                id={dim.key}
                type="number"
                min="0"
                max="100"
                value={String(scores[dim.key as keyof MSMEScores] ?? 0)}
                onChange={(e) => handleInputChange(dim.key as keyof MSMEScores, e.target.value)}
                className="w-16 text-right h-7 text-xs rounded-md border-border focus-visible:ring-primary font-semibold tabular-nums"
              />
            </div>
            <Slider
              value={scores[dim.key as keyof MSMEScores]}
              max={100}
              step={1}
              onValueChange={(val) => onScoreChange(dim.key as keyof MSMEScores, val)}
              className="py-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
