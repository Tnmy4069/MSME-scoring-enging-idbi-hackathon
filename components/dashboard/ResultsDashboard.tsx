"use client";

import React, { useRef, useState, useEffect } from "react";
import { MSMEScores, HealthResult, DataSourceFlags } from "@/lib/types";
import { processHealthAssessment, DIMENSION_CONFIG, RISK_MAX_PENALTY } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Download, CheckCircle2, AlertTriangle, ShieldCheck,
  Lightbulb, Info, ArrowUpRight, ArrowDownRight,
  Briefcase, Activity, FileText, CreditCard, Shield,
  GitPullRequest, Zap, BadgeAlert, Coins, HelpCircle, Check
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";

interface ResultsDashboardProps {
  scores: MSMEScores;
  dataFlags: DataSourceFlags;
}

export function ResultsDashboard({ scores, dataFlags }: ResultsDashboardProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Core assessment results
  const result: HealthResult = processHealthAssessment(scores, dataFlags);

  // Credit Improvement Simulator State
  const [simScores, setSimScores] = useState<MSMEScores>(scores);
  
  // Sync simulator scores when base scores change
  useEffect(() => {
    setSimScores(scores);
  }, [scores]);

  const simResult = processHealthAssessment(simScores, dataFlags);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const html2canvasPro = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvasPro(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - 20);
      }

      pdf.save('MSME_Credit_Underwriting_File.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Premium Eligible': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Growth Ready':     return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Standard Eligible': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Limited Exposure':  return 'text-orange-700 bg-orange-50 border-orange-200';
      default:                  return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const getStatusRingColor = (status: string) => {
    switch (status) {
      case 'Premium Eligible':  return '#10b981';
      case 'Growth Ready':      return '#3b82f6';
      case 'Standard Eligible': return '#f59e0b';
      case 'Limited Exposure':  return '#f97316';
      default:                  return '#ef4444';
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'Approvable':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Conditional':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  // Semi-circular gauge logic
  const r = 50;
  const strokeWidth = 10;
  const circumference = Math.PI * r; // ~157.08
  const strokeDashoffset = circumference - (result.score / 100) * circumference;
  const strokeColor = getStatusRingColor(result.lendingEligibilityStatus);

  // Positive vs Risk drivers calculations (v2 points scale)
  const positiveDrivers = result.scoreBreakdown.filter(b => !b.isRisk);
  const riskDriver = result.scoreBreakdown.find(b => b.isRisk);

  // Lending Spectrum configuration
  const spectrumSteps = [
    { label: 'Manual Review', min: 0, max: 39 },
    { label: 'Limited Exposure', min: 40, max: 59 },
    { label: 'Standard Lending', min: 60, max: 74 },
    { label: 'Growth Lending', min: 75, max: 89 },
    { label: 'Premium Lending', min: 90, max: 100 },
  ];

  const getFactorIcon = (key: string) => {
    switch (key) {
      case 'businessActivity':     return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'cashFlowHealth':       return <Activity className="h-4 w-4 text-emerald-600" />;
      case 'complianceScore':      return <FileText className="h-4 w-4 text-purple-600" />;
      case 'transactionBehaviour': return <CreditCard className="h-4 w-4 text-orange-600" />;
      case 'businessStability':    return <Shield className="h-4 w-4 text-indigo-600" />;
      case 'networkStrength':      return <GitPullRequest className="h-4 w-4 text-pink-600" />;
      case 'growthPotential':      return <Zap className="h-4 w-4 text-cyan-600" />;
      default:                     return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const handleSimScoreChange = (key: keyof MSMEScores, val: number) => {
    setSimScores(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header Banner */}
      <div className="flex justify-between items-center bg-white px-6 py-3.5 border border-slate-200 rounded-sm">
        <div className="flex items-center gap-2.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4.5 w-4.5 text-blue-600" /> Alternate Alternate alternate alternate Alternate Credit Underwriting Desk
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="gap-2 rounded-sm border-blue-200 hover:bg-blue-50 text-blue-700 font-bold"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Compiling File...' : 'Download Assessment Report'}
        </Button>
      </div>

      <div ref={reportRef} className="bg-slate-50 p-6 rounded-sm space-y-6">

        {/* ─── Top Level Credit Assessment Result Banner ─── */}
        <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assessment Decision Profile</span>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold">Credit Underwriting Decision:</h3>
              <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider border ${getDecisionBadge(result.decision)}`}>
                {result.decision}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 sm:gap-10 border-t border-slate-800 md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Risk Classification</div>
              <div className={`text-base font-bold uppercase tracking-wide mt-0.5 ${
                result.riskLevel === 'Minimal' || result.riskLevel === 'Low' ? 'text-emerald-400' :
                result.riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400'
              }`}>{result.riskLevel} Risk</div>
            </div>
            <div className="border-l border-slate-800 pl-6 sm:pl-10">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Alternate Data Confidence</div>
              <div className="text-base font-bold text-slate-200 mt-0.5">{result.dataConfidenceScore}%</div>
            </div>
          </div>
        </div>

        {/* ─── Underwriting Dashboard KPIs (5 Columns) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Credit Confidence Score card */}
          <Card className="rounded-sm border-slate-200 shadow-none bg-white p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                Credit Confidence Score <InfoIcon />
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-black text-slate-900">{result.score.toFixed(2)}</span>
                <span className="text-xs text-slate-400 font-medium">/100</span>
              </div>
              <div className="mt-1">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border ${getStatusColor(result.lendingEligibilityStatus)}`}>
                  {result.lendingEligibilityStatus}
                </span>
              </div>
            </div>

            {/* Gauge */}
            <div className="flex justify-center mt-3 h-20 relative overflow-hidden">
              <svg className="w-28 h-20" viewBox="0 0 120 70">
                <circle
                  cx="60"
                  cy="60"
                  r={r}
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth={strokeWidth}
                  strokeDasharray="157.08 314.16"
                  transform="rotate(-180 60 60)"
                  strokeLinecap="round"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={r}
                  fill="transparent"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${(result.score / 100) * 157.08} 314.16`}
                  transform="rotate(-180 60 60)"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute bottom-0 flex flex-col items-center">
                <span className="text-base font-extrabold text-slate-800">{result.score.toFixed(2)}</span>
                <div className="flex justify-between w-24 text-[8px] text-slate-400 px-1 font-bold">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
            </div>
            <div className="text-[9px] text-slate-400 text-center font-medium mt-1">
              File updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </Card>

          {/* Lending Eligibility Status */}
          <Card className="rounded-sm border-slate-200 shadow-none bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lending Eligibility <InfoIcon />
            </div>
            <div className="my-3 flex items-center gap-3">
              <div className="p-2.5 rounded-sm" style={{ backgroundColor: `${strokeColor}15` }}>
                <Shield className="h-6 w-6" style={{ color: strokeColor }} />
              </div>
              <div>
                <div className="text-base font-extrabold text-slate-800 leading-tight">{result.lendingEligibilityStatus}</div>
                <div className="text-[9px] text-slate-400 font-bold tracking-wider mt-0.5">Eligibility Tier</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 leading-snug">
              Represents active credit limits mapping class of the borrower.
            </div>
          </Card>

          {/* Alternate Data Confidence */}
          <Card className="rounded-sm border-slate-200 shadow-none bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              Alternate Data Confidence <InfoIcon />
            </div>
            <div className="my-3 flex items-center gap-3">
              <div className="p-2.5 rounded-sm bg-blue-50">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{result.dataConfidenceScore}%</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Reliability Score</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 leading-snug">
              Underwriting confidence rating based on available registry feeds.
            </div>
          </Card>

          {/* Recommended Limit & Rationale */}
          <Card className="rounded-sm border-slate-200 shadow-none bg-white p-4 flex flex-col justify-between col-span-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recommended Credit Limit <InfoIcon />
            </div>
            <div className="my-3 flex items-center gap-2.5">
              <div className="p-2.5 rounded-sm bg-emerald-50">
                <Coins className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">{result.recommendedCreditLimit}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Approved Limit CAP</div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 p-1.5 rounded-sm leading-normal">
              <span className="font-bold text-slate-600">Rationale: </span>
              {result.creditLimitRationale.scoreRange} Range | {result.creditLimitRationale.riskCategory}
            </div>
          </Card>

          {/* Risk Penalty */}
          <Card className="rounded-sm border-slate-200 shadow-none bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              Risk Penalty <InfoIcon />
            </div>
            <div className="my-3 flex items-center gap-3">
              <div className="p-2.5 rounded-sm bg-red-50">
                <BadgeAlert className="h-6 w-6 text-red-500" />
              </div>
              <div className="text-xl font-bold text-red-600">
                {result.riskPenalty > 0 ? `-${result.riskPenalty.toFixed(2)}` : '0.00'}
              </div>
            </div>
            <div className="text-xs text-slate-500 leading-snug">
              Deduction applied due to alternate risk indicators ({scores.riskIndicators}/100).
            </div>
          </Card>

        </div>

        {/* ─── Lending Spectrum Visualization ─── */}
        <Card className="rounded-sm border-slate-200 shadow-none bg-white p-5">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Underwriting Spectrum Position</h4>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
            {spectrumSteps.map((step) => {
              const isActive = result.lendingEligibilityStatus === step.label;
              return (
                <div 
                  key={step.label}
                  className={`p-3 rounded-sm border transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 font-semibold'
                  }`}
                >
                  <div className="truncate">{step.label}</div>
                  <div className={`text-[10px] mt-1 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {step.min}-{step.max} Pts
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ─── Main Content Grid: Score Composition & Positive/Risk Drivers ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Score Composition Table */}
          <Card className="rounded-sm border-slate-200 shadow-none bg-white lg:col-span-7 p-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide mb-4">
              Score Composition <InfoIcon />
            </h3>
            
            <div className="space-y-3.5">
              <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                <div className="col-span-5">Factor</div>
                <div className="col-span-4 text-center">Your Score</div>
                <div className="col-span-3 text-right">Contribution (Points)</div>
              </div>

              {result.scoreBreakdown.map((b) => (
                <div key={b.key} className="grid grid-cols-12 items-center text-sm">
                  <div className="col-span-5 flex items-center gap-2">
                    {getFactorIcon(b.key)}
                    <span className="font-semibold text-slate-700">{b.label}</span>
                  </div>

                  <div className="col-span-4 flex items-center gap-3 justify-center px-2">
                    <span className="text-xs font-bold text-slate-500 tabular-nums w-12 text-right font-semibold">
                      {b.rawScore} <span className="text-[10px] text-slate-400 font-medium">/100</span>
                    </span>
                    <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${b.isRisk ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${b.rawScore}%` }}
                      />
                    </div>
                  </div>

                  <div className={`col-span-3 text-right font-bold tabular-nums ${b.isRisk ? 'text-red-500' : 'text-emerald-600'}`}>
                    {b.earnedPoints > 0 ? '+' : ''}{b.earnedPoints.toFixed(2)}
                  </div>
                </div>
              ))}

              <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 flex justify-between items-center text-sm font-bold text-slate-800 mt-4">
                <span>Credit Confidence Score</span>
                <span className="text-base text-slate-900">{result.score.toFixed(2)} <span className="text-xs text-slate-400 font-medium">/100</span></span>
              </div>

              <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-1">
                <div>Total Positive Contribution: <span className="text-emerald-600">+{result.positiveTotal.toFixed(2)}</span></div>
                <div>Total Risk Penalty: <span className="text-red-500">-{result.riskPenalty.toFixed(2)}</span></div>
                <div>Final Score: <span className="text-emerald-600">{result.score.toFixed(2)}/100</span></div>
              </div>
            </div>
          </Card>

          {/* Positive Drivers & Risk Drivers Card */}
          <Card className="rounded-sm border-slate-200 shadow-none bg-white lg:col-span-5 p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide mb-1">
                  Lending Underwriting Drivers <InfoIcon />
                </h3>
                <p className="text-xs text-slate-400 font-semibold">Earned points and risk deductions breakdown</p>
              </div>

              {/* Positive Drivers Column */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4" /> Positive Drivers (Max Points)
                </h4>
                <div className="space-y-2.5">
                  {positiveDrivers.map((driver) => (
                    <div key={driver.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{driver.label}</span>
                        <span className="text-emerald-700 font-bold">+{driver.earnedPoints.toFixed(2)} / {driver.maxPoints} Pts</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(driver.earnedPoints / driver.maxPoints) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Drivers Column */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                  <ArrowDownRight className="h-4 w-4" /> Risk Drivers (Max Penalty)
                </h4>
                {riskDriver && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{riskDriver.label} Deduction</span>
                      <span className="text-red-700 font-bold">-{result.riskPenalty.toFixed(2)} / {RISK_MAX_PENALTY} Pts</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${(result.riskPenalty / RISK_MAX_PENALTY) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

        </div>

        {/* ─── Why Bank Should Lend & Credit Decision Explanation ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Why Bank Should Lend Card */}
          <Card className="rounded-sm border-slate-200 shadow-none bg-white p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide mb-4">
                Why Bank Should Lend <InfoIcon />
              </h3>
              <div className="space-y-4">
                {result.whyBankShouldLend.length > 0 ? (
                  result.whyBankShouldLend.map((signal, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="bg-emerald-50 p-1.5 rounded-full mt-0.5">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-normal">{signal}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 p-3 text-xs bg-slate-50 border border-slate-100 rounded-sm text-slate-500">
                    <Info className="h-4 w-4" /> No positive indicators scored above threshold.
                  </div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-4 font-semibold italic">
              *Signals compiled from Alternate Alternate Data registry filings.
            </div>
          </Card>

          {/* Credit Decision Explanation */}
          <Card className="rounded-sm border-slate-200 shadow-none bg-white p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide mb-4">
                Credit Decision Explanation <InfoIcon />
              </h3>
              <div className="space-y-4 text-xs leading-relaxed text-slate-700 font-medium">
                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                  <p><span className="font-bold text-slate-800 uppercase tracking-wider text-[9px] block mb-0.5 text-emerald-700">Qualification Profile</span>{result.decisionExplanation.qualification}</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                  <p><span className="font-bold text-slate-800 uppercase tracking-wider text-[9px] block mb-0.5 text-red-700">Remaining Risk Vectors</span>{result.decisionExplanation.remainingRisks}</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  <p><span className="font-bold text-slate-800 uppercase tracking-wider text-[9px] block mb-0.5 text-blue-700">Recommended Exposure Caps</span>{result.decisionExplanation.recommendedExposure}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-sm p-3 mt-4 text-[11px] text-blue-800 leading-normal">
              Overall decision is <span className="font-bold">{result.decision}</span>. Suitable for <span className="font-bold">{result.lendingRecommendation}</span>.
            </div>
          </Card>

        </div>

        {/* ─── Credit Improvement Simulator Card ─── */}
        <Card className="rounded-sm border-slate-200 shadow-none bg-white p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Credit Improvement Simulator</h3>
              <p className="text-xs text-slate-500 mt-0.5">Simulate alternate scores to predict limits and category bumps</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="text-right">
                <div className="text-slate-400 uppercase tracking-wider text-[9px]">Simulated Score</div>
                <div className="text-lg text-blue-600 font-extrabold">{simResult.score.toFixed(2)}</div>
              </div>
              <div className="text-right border-l border-slate-200 pl-4">
                <div className="text-slate-400 uppercase tracking-wider text-[9px]">Simulated Limit</div>
                <div className="text-lg text-emerald-600 font-extrabold">{simResult.recommendedCreditLimit}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {DIMENSION_CONFIG.map((dim) => (
              <div key={dim.key} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{dim.label}</span>
                  <span className="font-bold text-slate-900">{simScores[dim.key as keyof MSMEScores]} / 100</span>
                </div>
                <Slider
                  value={simScores[dim.key as keyof MSMEScores]}
                  max={100}
                  step={1}
                  onValueChange={(val) => handleSimScoreChange(dim.key as keyof MSMEScores, val)}
                  className="py-1"
                />
              </div>
            ))}
            
            {/* Risk Indicator simulator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Risk Indicators</span>
                <span className="font-bold text-red-600">{simScores.riskIndicators} / 100 (Penalty: -{simResult.riskPenalty.toFixed(1)})</span>
              </div>
              <Slider
                value={simScores.riskIndicators}
                max={100}
                step={1}
                onValueChange={(val) => handleSimScoreChange('riskIndicators', val)}
                className="py-1"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4 text-xs font-semibold text-slate-500">
            <div>Current Tier: <span className="text-slate-800 font-bold">{result.lendingEligibilityStatus}</span> &rarr; Simulated Tier: <span className="text-blue-600 font-bold">{simResult.lendingEligibilityStatus}</span></div>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => setSimScores(scores)}
              className="rounded-sm text-[10px] h-7 border-slate-300"
            >
              Reset Simulator
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 text-slate-400 inline-flex items-center justify-center font-serif text-[10px] cursor-help font-bold" title="Information node">
      i
    </span>
  );
}
