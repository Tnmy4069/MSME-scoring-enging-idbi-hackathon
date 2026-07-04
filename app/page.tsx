"use client";

import { useState } from "react";
import { MSMEScores, DataSourceFlags } from "@/lib/types";
import { HealthAssessmentForm } from "@/components/dashboard/HealthAssessmentForm";
import { ResultsDashboard } from "@/components/dashboard/ResultsDashboard";
import { DataConfidencePanel } from "@/components/dashboard/DataConfidencePanel";
import { Roadmap } from "@/components/dashboard/Roadmap";
import { calculateDataConfidence } from "@/lib/scoring";
import { Building2, ChartBar, FileText } from "lucide-react";

const DEFAULT_SCORES: MSMEScores = {
  businessActivity: 50,
  cashFlowHealth: 50,
  complianceScore: 50,
  transactionBehaviour: 50,
  businessStability: 50,
  networkStrength: 50,
  growthPotential: 50,
  riskIndicators: 50,
};

const DEFAULT_FLAGS: DataSourceFlags = {
  gst: true,
  upi: true,
  accountAggregator: false,
  epfo: false,
  itr: true,
};

export default function Home() {
  const [scores, setScores] = useState<MSMEScores>(DEFAULT_SCORES);
  const [dataFlags, setDataFlags] = useState<DataSourceFlags>(DEFAULT_FLAGS);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleScoreChange = (key: keyof MSMEScores, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const handleFlagChange = (key: keyof DataSourceFlags, value: boolean) => {
    setDataFlags(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    setHasGenerated(true);
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const confidenceScore = calculateDataConfidence(dataFlags);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20" style={{ fontFamily: "'Segoe UI', 'Segoe UI Variable', system-ui, -apple-system, sans-serif" }}>

      {/* ─── Header ─── */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-sm">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">MSME Credit Confidence Engine</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                AI-Powered Alternate Data Credit Assessment
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-300">
            <span className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
              <ChartBar className="h-4 w-4" /> Dashboard
            </span>
            <span className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
              <FileText className="h-4 w-4" /> Reports
            </span>
          </div>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* ─── Left Column ─── */}
          <div className="xl:col-span-4 space-y-4">
            <HealthAssessmentForm
              scores={scores}
              onScoreChange={handleScoreChange}
              onGenerate={handleGenerate}
            />
            <DataConfidencePanel
              flags={dataFlags}
              onChange={handleFlagChange}
              confidenceScore={confidenceScore}
            />
          </div>

          {/* ─── Right Column ─── */}
          <div className="xl:col-span-8" id="results">
            {hasGenerated ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ResultsDashboard scores={scores} dataFlags={dataFlags} />
              </div>
            ) : (
              <div className="h-full min-h-[500px] border border-slate-200 border-dashed rounded-sm bg-white flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                <div className="border border-slate-200 rounded-sm p-4 mb-5 bg-slate-50">
                  <Building2 className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Credit Assessment Pending</h3>
                <p className="text-sm max-w-sm text-slate-400 leading-relaxed">
                  Configure the assessment parameters and data sources on the left panel, then click
                  <span className="font-semibold text-slate-600"> "Generate Financial Health Card"</span> to run the Credit Confidence Engine.
                </p>
              </div>
            )}
          </div>

        </div>

        <Roadmap />
      </main>
    </div>
  );
}
