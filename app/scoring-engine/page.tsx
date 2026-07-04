"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Menu, Calculator, TrendingUp, AlertTriangle, Database, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DIMENSION_CONFIG, RISK_MAX_PENALTY, CREDIT_LIMIT_CONFIG } from "@/lib/scoring";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export default function ScoringEnginePage() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [simulatedScore, setSimulatedScore] = useState(75);
  const [simulatedRisk, setSimulatedRisk] = useState(10);

  const calculateFinal = () => Math.max(0, simulatedScore - (simulatedRisk * RISK_MAX_PENALTY / 100));
  
  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-[#EEF5F2] selection:text-[#00836C] relative">
      <Sidebar isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="h-[72px] bg-white border-b border-border flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1 rounded-md text-slate-500 hover:bg-secondary cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
                Scoring Engine Methodology
              </h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mt-0.5 sm:mt-1">
                How the AI-Powered Credit Engine Works
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-slate-50/50">
          
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Overview */}
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" /> Engine Overview
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                The IDBI MSME Credit Underwriting Engine uses a highly calibrated formula to evaluate businesses based on alternative data sources. The final <strong>Credit Confidence Score (0-100)</strong> determines the lending eligibility tier and recommended credit limits.
              </p>
            </section>

            {/* Formula Block */}
            <Card className="rounded-md border-border bg-white shadow-sm border-l-4 border-l-primary">
              <CardContent className="p-6">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Core Formula</h4>
                <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left bg-secondary p-4 rounded-md border border-border">
                  <div>
                    <span className="block text-2xl font-black text-primary">Final Score</span>
                  </div>
                  <div className="text-xl font-bold text-slate-400">=</div>
                  <div>
                    <span className="block text-xl font-bold text-[#16A34A]">∑ Positive Dimensions</span>
                    <span className="text-xs text-slate-500 font-semibold">(Max 100 points)</span>
                  </div>
                  <div className="text-xl font-bold text-slate-400">-</div>
                  <div>
                    <span className="block text-xl font-bold text-[#DC2626]">Risk Penalty</span>
                    <span className="text-xs text-slate-500 font-semibold">(Max {RISK_MAX_PENALTY} points)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Positive Dimensions */}
              <Card className="rounded-md border-border bg-white shadow-sm">
                <CardHeader className="bg-secondary border-b border-border pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#16A34A]" /> Positive Scoring Dimensions
                  </CardTitle>
                  <CardDescription className="text-xs">Each dimension evaluates specific business health indicators up to a maximum weight.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {DIMENSION_CONFIG.map(dim => (
                      <div key={dim.key} className="flex justify-between items-center p-4">
                        <span className="text-sm font-semibold text-slate-700">{dim.label}</span>
                        <span className="text-sm font-bold text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded-full">
                          Max {dim.maxPoints} pts
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-4 bg-slate-50">
                      <span className="text-sm font-black text-slate-900">Total Possible Points</span>
                      <span className="text-sm font-black text-slate-900">100 pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-8">
                {/* Risk Penalties */}
                <Card className="rounded-md border-border bg-white shadow-sm">
                  <CardHeader className="bg-[#DC2626]/5 border-b border-[#DC2626]/10 pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-[#DC2626]">
                      <AlertTriangle className="h-4 w-4" /> Risk Deduction Mechanics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Alternative risk indicators (e.g., delayed GST filings, high bounce rates) translate into a risk severity percentage (0-100%). This severity applies a proportional penalty.
                    </p>
                    <div className="bg-secondary border border-border p-3 rounded-md">
                      <span className="text-xs font-bold text-slate-500 block mb-1">Example Calculation:</span>
                      <p className="text-sm font-semibold text-slate-800">50% Severity &times; 20 Max Penalty = <span className="text-[#DC2626]">-10 Points</span></p>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Confidence */}
                <Card className="rounded-md border-border bg-white shadow-sm">
                  <CardHeader className="bg-secondary border-b border-border pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#2563EB]" /> Data Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Calculated simply as the ratio of successfully connected data sources over the total required sources. High data confidence validates the primary score.
                    </p>
                    <div className="flex items-center gap-2 bg-[#2563EB]/10 text-[#2563EB] px-3 py-2 rounded-md text-xs font-bold">
                      <Info className="h-4 w-4" /> (Connected Sources / Total Sources) &times; 100
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Decision Logic */}
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-4 mt-8 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Lending Eligibility & Tiers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CREDIT_LIMIT_CONFIG.map((tier, idx) => (
                  <Card key={idx} className="rounded-md border-border bg-white shadow-sm">
                    <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score Requirement</div>
                      <div className="text-2xl font-black text-slate-800">{tier.minScore}+</div>
                      <div className="w-full h-px bg-border my-1" />
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Limit Cap</div>
                      <div className="text-base font-bold text-primary">{tier.limit}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Interactive Simulation Sandbox */}
            <section className="pb-12">
              <h3 className="text-xl font-bold text-slate-900 mb-4 mt-8">Interactive Simulation Sandbox</h3>
              <Card className="rounded-md border-border bg-white shadow-sm">
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Base Positive Score</Label>
                        <span className="font-bold text-[#16A34A]">{simulatedScore} pts</span>
                      </div>
                      <Slider value={simulatedScore} max={100} step={1} onValueChange={(val) => setSimulatedScore(val)} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk Indicator Severity</Label>
                        <span className="font-bold text-[#DC2626]">{simulatedRisk}%</span>
                      </div>
                      <Slider value={simulatedRisk} max={100} step={1} onValueChange={(val) => setSimulatedRisk(val)} />
                    </div>
                  </div>

                  <div className="bg-secondary p-8 rounded-md border border-border flex flex-col items-center justify-center text-center h-full">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Calculated Final Score</span>
                    <span className="text-5xl font-black text-slate-900">{calculateFinal().toFixed(1)}</span>
                    <div className="mt-4 text-sm font-semibold text-slate-600">
                      Resulting Deduction: <span className="text-[#DC2626] font-bold">-{ (simulatedRisk * RISK_MAX_PENALTY / 100).toFixed(1) } pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
