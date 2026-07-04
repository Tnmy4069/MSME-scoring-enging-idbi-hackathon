"use client";

import React from "react";
import { DIMENSIONS } from "@/lib/scoring";
import { MSMEScores } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface HealthAssessmentFormProps {
  scores: MSMEScores;
  onScoreChange: (key: keyof MSMEScores, value: number) => void;
  onGenerate: () => void;
}

export function HealthAssessmentForm({ scores, onScoreChange, onGenerate }: HealthAssessmentFormProps) {
  const handleInputChange = (key: keyof MSMEScores, value: string) => {
    let numValue = parseInt(value, 10);
    if (isNaN(numValue)) numValue = 0;
    if (numValue < 0) numValue = 0;
    if (numValue > 100) numValue = 100;
    onScoreChange(key, numValue);
  };

  return (
    <Card className="rounded-sm border border-slate-200 shadow-sm bg-white text-slate-900">
      <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <CardTitle className="text-xl font-semibold text-slate-900">Assessment Parameters</CardTitle>
        <CardDescription className="text-slate-500 mt-1">
          Input scoring values (0-100) for each dimension to evaluate the financial health profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor={dim.key} className="text-sm font-medium text-slate-700">
                  {dim.label} <span className="text-slate-400 font-normal ml-1">(max {dim.maxPoints} pts)</span>
                </Label>
                <Input
                  id={dim.key}
                  type="number"
                  min="0"
                  max="100"
                  value={String(scores[dim.key as keyof MSMEScores] ?? 0)}
                  onChange={(e) => handleInputChange(dim.key as keyof MSMEScores, e.target.value)}
                  className="w-20 text-right h-8 rounded-sm border-slate-300 focus-visible:ring-slate-500"
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

        <Separator className="bg-slate-200 my-6" />

        <div className="pt-2 flex justify-end">
          <Button 
            onClick={onGenerate}
            className="w-full md:w-auto px-8 h-10 rounded-sm bg-slate-900 hover:bg-slate-800 text-white font-medium"
          >
            Generate Financial Health Card
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
