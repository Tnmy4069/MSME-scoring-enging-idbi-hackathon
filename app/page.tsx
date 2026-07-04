"use client";

import { useState } from "react";
import { MSMEScores, DataSourceFlags } from "@/lib/types";
import { HealthAssessmentForm } from "@/components/dashboard/HealthAssessmentForm";
import { ResultsDashboard } from "@/components/dashboard/ResultsDashboard";
import { DataConfidencePanel } from "@/components/dashboard/DataConfidencePanel";
import { Roadmap } from "@/components/dashboard/Roadmap";
import { calculateDataConfidence } from "@/lib/scoring";
import { 
  LayoutDashboard, Briefcase, Database, BarChart2, 
  ShieldAlert, Sparkles, Scale, FolderOpen, History, 
  HelpCircle, ChevronDown, SlidersHorizontal, X, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_SCORES: MSMEScores = {
  businessActivity: 80,
  cashFlowHealth: 75,
  complianceScore: 90,
  transactionBehaviour: 70,
  businessStability: 80,
  networkStrength: 60,
  growthPotential: 85,
  riskIndicators: 50,
};

const DEFAULT_FLAGS: DataSourceFlags = {
  gst: true,
  upi: true,
  accountAggregator: true,
  epfo: false,
  itr: true,
};

export default function Home() {
  const [scores, setScores] = useState<MSMEScores>(DEFAULT_SCORES);
  const [dataFlags, setDataFlags] = useState<DataSourceFlags>(DEFAULT_FLAGS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true); // Open on page load
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false); // Only show dashboard after generation

  const handleScoreChange = (key: keyof MSMEScores, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const handleFlagChange = (key: keyof DataSourceFlags, value: boolean) => {
    setDataFlags(prev => ({ ...prev, [key]: value }));
  };

  const confidenceScore = calculateDataConfidence(dataFlags);

  const sidebarLinks = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, active: true },
    { label: "Business Profile", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Data Overview", icon: <Database className="h-4 w-4" /> },
    { label: "Score & Insights", icon: <BarChart2 className="h-4 w-4" /> },
    { label: "Strengths & Risks", icon: <ShieldAlert className="h-4 w-4" /> },
    { label: "Recommendations", icon: <Sparkles className="h-4 w-4" /> },
    { label: "Credit Limit", icon: <Scale className="h-4 w-4" /> },
    { label: "Documents", icon: <FolderOpen className="h-4 w-4" /> },
    { label: "Activity Log", icon: <History className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-blue-100 selection:text-blue-900 relative">
      
      {/* ─── Left Sidebar (Desktop) ─── */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#0a1829] text-slate-300 border-r border-slate-800 flex-shrink-0">
        {/* Logo Section */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-[#071322]">
          <IdbiLogo />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {sidebarLinks.map((link, idx) => (
            <button
              key={idx}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-semibold transition-all duration-150 cursor-pointer ${
                link.active 
                  ? 'bg-blue-600 text-white font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </button>
          ))}
        </nav>

        {/* Assistant/Help panel at bottom */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-[#112438] rounded-sm p-4 border border-slate-800/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              <HelpCircle className="h-4 w-4 text-blue-400" /> Need Help?
            </div>
            <p className="text-[11px] text-slate-400 leading-normal mb-3">Talk to Assistant</p>
            <button className="w-full text-center py-2 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-sm transition-colors cursor-pointer">
              Launch Underwriting Chat
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside className="relative flex flex-col w-56 bg-[#0a1829] text-slate-300 h-full">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#0c1a30] bg-[#071322]">
              <IdbiLogo />
              <button onClick={() => setIsMobileSidebarOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {sidebarLinks.map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-semibold transition-all cursor-pointer ${
                    link.active 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ─── Main Content Wrapper ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight leading-none">
                MSME Financial Health Card
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5 sm:mt-1">
                AI-Powered Credit Intelligence & Underwriting Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Last updated info */}
            <span className="hidden md:inline-block text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Last Updated: 24 May 2025, 10:30 AM
            </span>

            {/* Adjust Parameters Action Button */}
            <Button
              onClick={() => setIsDrawerOpen(true)}
              className="gap-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 h-8 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Adjust Parameters</span>
            </Button>

            {/* Profile badge / account */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:pl-4">
              <span className="hidden sm:inline-block text-xs font-bold text-slate-700">ACME</span>
              <div className="w-8 h-8 rounded-full bg-[#0a1829] text-white flex items-center justify-center font-bold text-xs cursor-pointer border border-slate-200 hover:bg-[#112438] transition-colors">
                AC
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 cursor-pointer hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Dashboard Grid Content */}
        <main className="p-4 sm:p-8 flex-1">
          {hasGenerated ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <ResultsDashboard scores={scores} dataFlags={dataFlags} />
            </div>
          ) : (
            <div className="h-full min-h-[500px] border border-slate-200 border-dashed rounded-sm bg-white flex flex-col items-center justify-center text-slate-400 p-10 text-center">
              <div className="border border-slate-200 rounded-sm p-4 mb-5 bg-slate-50">
                <Briefcase className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Credit Assessment Pending</h3>
              <p className="text-sm max-w-sm text-slate-400 leading-relaxed">
                Configure the assessment parameters and data sources on the right panel, then click
                <span className="font-semibold text-slate-600"> "Apply & Compute Score"</span> to run the Credit Confidence Engine.
              </p>
            </div>
          )}

          {/* Underwriting Roadmap Section */}
          <Roadmap />
          
          {/* Footer disclaimer */}
          <div className="mt-8 text-[10px] text-slate-400 text-center space-y-1 font-semibold leading-relaxed border-t border-slate-200/80 pt-4">
            <p>Disclaimer: The score is generated using alternate data and AI/ML models. It is only an aid for decision making and not the final decision.</p>
            <p>Final lending decision rests with the bank.</p>
          </div>
        </main>
      </div>

      {/* ─── Parameter Scoring Inputs Drawer (Slide-out from Right) ─── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop blur overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Sliding container */}
          <div className="relative w-full sm:w-[500px] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-blue-600" /> Adjust Scoring Parameters
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Tweak dimension scores & data flags below</p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable inputs body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sliders Form */}
              <HealthAssessmentForm 
                scores={scores}
                onScoreChange={handleScoreChange}
                onGenerate={() => {
                  setHasGenerated(true);
                  setIsDrawerOpen(false);
                }}
              />

              {/* Data flags checklist */}
              <DataConfidencePanel 
                flags={dataFlags}
                onChange={handleFlagChange}
                confidenceScore={confidenceScore}
              />
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-sm border-slate-300 cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setHasGenerated(true);
                  setIsDrawerOpen(false);
                }}
                className="rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer text-xs px-6"
              >
                Apply & Compute Score
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── IDBI Vector Brand Logo Component ───

function IdbiLogo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Orange circle with a white inset graphic matching IDBI brand structure */}
      <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#f05a28" />
        <circle cx="50" cy="50" r="32" fill="#ffffff" />
        <path d="M 50 18 A 32 32 0 0 1 82 50 L 50 50 Z" fill="#f05a28" />
      </svg>
      <div className="flex flex-col">
        <span className="text-white text-lg font-black tracking-wider leading-none">IDBI</span>
        <span className="text-[7px] text-[#f05a28] tracking-widest font-black leading-none mt-1">BANK</span>
      </div>
    </div>
  );
}
