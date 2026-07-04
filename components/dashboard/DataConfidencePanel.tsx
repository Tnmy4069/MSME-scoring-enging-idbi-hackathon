"use client";

import React from "react";
import { DataSourceFlags } from "@/lib/types";
import { DATA_SOURCES } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, CheckCircle2, XCircle } from "lucide-react";

interface DataConfidencePanelProps {
  flags: DataSourceFlags;
  onChange: (key: keyof DataSourceFlags, value: boolean) => void;
  confidenceScore: number;
}

export function DataConfidencePanel({ flags, onChange, confidenceScore }: DataConfidencePanelProps) {
  return (
    <Card className="rounded-sm border-slate-200 shadow-sm bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-500" /> Data Sources
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs mt-0.5">Toggle available data for confidence scoring</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{confidenceScore}%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Data Confidence</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {DATA_SOURCES.map((src) => {
          const isAvailable = flags[src.key as keyof DataSourceFlags];
          return (
            <button
              key={src.key}
              onClick={() => onChange(src.key as keyof DataSourceFlags, !isAvailable)}
              className={`w-full flex items-center justify-between p-3 rounded-sm border text-sm font-medium transition-colors cursor-pointer ${
                isAvailable
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span>{src.label}</span>
              {isAvailable
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                : <XCircle className="h-4 w-4 text-slate-300" />
              }
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
