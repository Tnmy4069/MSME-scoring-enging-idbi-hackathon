"use client";

import React, { useRef, useState, useEffect } from "react";
import { MSMEScores, HealthResult, DataSourceFlags } from "@/lib/types";
import { processHealthAssessment, DIMENSION_CONFIG, RISK_MAX_PENALTY } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Download, CheckCircle2, AlertTriangle, ShieldCheck,
  Lightbulb, Info, ArrowUpRight, ArrowDownRight,
  Briefcase, Activity, FileText, CreditCard, Shield,
  GitPullRequest, Zap, BadgeAlert, Coins, Check, ArrowRight
} from "lucide-react";

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
      case 'Premium Eligible':  return 'text-[#16A34A] bg-[#16A34A]/10 border-[#16A34A]/20';
      case 'Growth Ready':      return 'text-[#00836C] bg-[#00836C]/10 border-[#00836C]/20';
      case 'Standard Eligible': return 'text-[#2563EB] bg-[#2563EB]/10 border-[#2563EB]/20';
      case 'Limited Exposure':  return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20';
      default:                  return 'text-[#DC2626] bg-[#DC2626]/10 border-[#DC2626]/20';
    }
  };

  const getStatusRingColor = (status: string) => {
    switch (status) {
      case 'Premium Eligible':  return '#16A34A';
      case 'Growth Ready':      return '#00836C';
      case 'Standard Eligible': return '#2563EB';
      case 'Limited Exposure':  return '#F59E0B';
      default:                  return '#DC2626';
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'Approvable':
        return 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20';
      case 'Conditional':
        return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
      default:
        return 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20';
    }
  };

  // Semi-circular gauge logic
  const renderGauge = (score: number) => {
    const theta_deg = 180 - (score / 100) * 180;
    const theta_rad = (theta_deg * Math.PI) / 180;
    const r_in = 36;
    const r_out = 50;
    const x_in = 60 + r_in * Math.cos(theta_rad);
    const y_in = 60 - r_in * Math.sin(theta_rad);
    const x_out = 60 + r_out * Math.cos(theta_rad);
    const y_out = 60 - r_out * Math.sin(theta_rad);

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-36 h-20">
          <svg className="w-full h-full" viewBox="0 0 120 70">
            {/* Background track */}
            <path
              d="M 15 60 A 45 45 0 0 1 105 60"
              fill="none"
              stroke="#D7E2DD"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Active path */}
            <path
              d="M 15 60 A 45 45 0 0 1 105 60"
              fill="none"
              stroke="#00836C"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="141.37"
              strokeDashoffset={141.37 - (score / 100) * 141.37}
              className="transition-all duration-1000 ease-out"
            />
            {/* Needle indicator */}
            <line
              x1={x_in}
              y1={y_in}
              x2={x_out}
              y2={y_out}
              stroke="#475569"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          {/* Centered score value */}
          <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-end">
            <span className="text-xl font-extrabold text-slate-800 leading-none">{score.toFixed(2)}</span>
          </div>
        </div>
        {/* Under-labels */}
        <div className="flex justify-between w-28 text-[9px] font-bold text-slate-400 mt-1">
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    );
  };

  // Positive vs Risk drivers calculations (v2 points scale)
  const positiveDrivers = result.scoreBreakdown.filter(b => !b.isRisk);
  const riskDriver = result.scoreBreakdown.find(b => b.isRisk);

  // Lending Spectrum configuration
  const spectrumSteps = [
    { label: 'Manual Review', min: 0, max: 39 },
    { label: 'Limited Exposure', min: 40, max: 59 },
    { label: 'Standard Eligible', min: 60, max: 74 },
    { label: 'Growth Ready', min: 75, max: 89 },
    { label: 'Premium Eligible', min: 90, max: 100 },
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
      <div className="flex justify-between items-center bg-white px-6 py-3.5 border border-border rounded-md">
        <div className="flex items-center gap-2.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4.5 w-4.5 text-primary" /> Credit Decisioning Suite
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="gap-2 rounded-full border-primary hover:bg-secondary text-primary font-bold"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Compiling File...' : 'Download Report'}
        </Button>
      </div>

      <div ref={reportRef} className="bg-slate-50 p-6 rounded-sm space-y-6">

        {/* ─── Top Level Credit Assessment Result Banner ─── */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-5 text-sidebar-foreground flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Assessment Decision Profile</span>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold">Credit Underwriting Decision:</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getDecisionBadge(result.decision)}`}>
                {result.decision}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 sm:gap-10 border-t border-[#00836C]/30 md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
            <div>
              <div className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Risk Classification</div>
              <div className={`text-base font-bold uppercase tracking-wide mt-0.5 ${
                result.riskLevel === 'Minimal' || result.riskLevel === 'Low' ? 'text-[#16A34A]' :
                result.riskLevel === 'Medium' ? 'text-[#F59E0B]' : 'text-[#DC2626]'
              }`}>{result.riskLevel} Risk</div>
            </div>
            <div className="border-l border-[#00836C]/30 pl-6 sm:pl-10">
              <div className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Alternate Data Confidence</div>
              <div className="text-base font-bold text-white mt-0.5">{result.dataConfidenceScore}%</div>
            </div>
          </div>
        </div>

        {/* ─── Underwriting Dashboard KPIs (5 Columns Layout) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Credit Confidence Score card (Spans 2 columns) */}
          <Card className="rounded-md border-border shadow-none bg-white sm:col-span-2 p-5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Credit Confidence Score <InfoIcon />
            </div>
            <div className="flex flex-row items-center justify-between gap-4">
              {/* Left: Score text and badge */}
              <div className="flex flex-col justify-between min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{result.score.toFixed(2)}</span>
                  <span className="text-sm text-slate-400 font-semibold">/100</span>
                </div>
                <div className="mt-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${getStatusColor(result.lendingEligibilityStatus)}`}>
                    {result.status}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-semibold mt-3">
                  Score calculated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Right: Gauge */}
              <div className="flex-shrink-0">
                {renderGauge(result.score)}
              </div>
            </div>
          </Card>

          {/* Lending Eligibility Status */}
          <Card className="rounded-md border-border shadow-none bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lending Eligibility <InfoIcon />
            </div>
            <div className="my-3 flex items-center gap-3">
              <div className="p-2.5 rounded-sm" style={{ backgroundColor: `${getStatusRingColor(result.lendingEligibilityStatus)}15` }}>
                <Shield className="h-6 w-6" style={{ color: getStatusRingColor(result.lendingEligibilityStatus) }} />
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
          <Card className="rounded-md border-border shadow-none bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              Alternate Data Confidence <InfoIcon />
            </div>
            <div className="my-3 flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-[#2563EB]/10">
                <FileText className="h-6 w-6 text-[#2563EB]" />
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
          <Card className="rounded-md border-border shadow-none bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recommended Credit Limit <InfoIcon />
            </div>
            <div className="my-3 flex items-center gap-2.5">
              <div className="p-2.5 rounded-md bg-[#00836C]/10">
                <span className="text-lg font-bold text-primary">₹</span>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">{result.recommendedCreditLimit}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Approved Limit CAP</div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 bg-secondary border border-border p-1.5 rounded-md leading-normal">
              <span className="font-bold text-slate-700">Rationale: </span>
              {result.creditLimitRationale.scoreRange} Range | {result.creditLimitRationale.riskCategory}
            </div>
          </Card>

          {/* Risk Penalty */}
          <Card className="rounded-md border-border shadow-none bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              Risk Penalty <InfoIcon />
            </div>
            <div className="my-3 flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-[#DC2626]/10">
                <BadgeAlert className="h-6 w-6 text-[#DC2626]" />
              </div>
              <div className="text-xl font-bold text-[#DC2626]">
                {result.riskPenalty > 0 ? `-${result.riskPenalty.toFixed(2)}` : '0.00'}
              </div>
            </div>
            <div className="text-xs text-slate-500 leading-snug">
              Deduction applied due to alternate risk indicators ({scores.riskIndicators}/100).
            </div>
          </Card>

        </div>

        {/* ─── Lending Spectrum Visualization ─── */}
        <Card className="rounded-md border-border shadow-none bg-white p-5">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Underwriting Spectrum Position</h4>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
            {spectrumSteps.map((step) => {
              const isActive = result.lendingEligibilityStatus === step.label;
              return (
                <div 
                  key={step.label}
                  className={`p-3 rounded-md border transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary border-primary text-white font-bold shadow-sm' 
                      : 'bg-secondary border-border text-muted-foreground font-semibold'
                  }`}
                >
                  <div className="truncate">{step.label}</div>
                  <div className={`text-[10px] mt-1 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
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
          <Card className="rounded-md border-border shadow-none bg-white lg:col-span-7 p-6">
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
                        className={`h-full rounded-full ${b.isRisk ? 'bg-[#DC2626]' : 'bg-primary'}`}
                        style={{ width: `${b.rawScore}%` }}
                      />
                    </div>
                  </div>

                  <div className={`col-span-3 text-right font-bold tabular-nums ${b.isRisk ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                    {b.earnedPoints > 0 ? '+' : ''}{b.earnedPoints.toFixed(2)}
                  </div>
                </div>
              ))}

              <div className="bg-secondary border border-border rounded-md p-3 flex justify-between items-center text-sm font-bold text-slate-800 mt-4">
                <span>Credit Confidence Score</span>
                <span className="text-base text-slate-900">{result.score.toFixed(2)} <span className="text-xs text-slate-400 font-medium">/100</span></span>
              </div>

              <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-1">
                <div>Total Positive Contribution: <span className="text-[#16A34A]">+{result.positiveTotal.toFixed(2)}</span></div>
                <div>Total Risk Penalty: <span className="text-[#DC2626]">-{result.riskPenalty.toFixed(2)}</span></div>
                <div>Final Score: <span className="text-[#16A34A]">{result.score.toFixed(2)}/100</span></div>
              </div>
            </div>
          </Card>

          {/* Positive Drivers & Risk Drivers Card */}
          <Card className="rounded-md border-border shadow-none bg-white lg:col-span-5 p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide mb-1">
                  Lending Underwriting Drivers <InfoIcon />
                </h3>
                <p className="text-xs text-slate-400 font-semibold">Earned points and risk deductions breakdown</p>
              </div>

              {/* Positive Drivers Column */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#16A34A] uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4" /> Positive Drivers (Max Points)
                </h4>
                <div className="space-y-2.5">
                  {positiveDrivers.map((driver) => (
                    <div key={driver.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{driver.label}</span>
                        <span className="text-[#16A34A] font-bold">+{driver.earnedPoints.toFixed(2)} / {driver.maxPoints} Pts</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${(driver.earnedPoints / driver.maxPoints) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Drivers Column */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider flex items-center gap-1">
                  <ArrowDownRight className="h-4 w-4" /> Risk Drivers (Max Penalty)
                </h4>
                {riskDriver && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{riskDriver.label} Deduction</span>
                      <span className="text-[#DC2626] font-bold">-{result.riskPenalty.toFixed(2)} / {RISK_MAX_PENALTY} Pts</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#DC2626] rounded-full" style={{ width: `${(result.riskPenalty / RISK_MAX_PENALTY) * 100}%` }} />
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
          <Card className="rounded-md border-border shadow-none bg-white p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide mb-4">
                Why Bank Should Lend <InfoIcon />
              </h3>
              <div className="space-y-4">
                {result.whyBankShouldLend.length > 0 ? (
                  result.whyBankShouldLend.map((signal, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="bg-[#16A34A]/10 p-1.5 rounded-full mt-0.5">
                        <Check className="h-3.5 w-3.5 text-[#16A34A]" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-normal">{signal}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 p-3 text-xs bg-secondary border border-border rounded-md text-slate-500">
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
          <Card className="rounded-md border-border shadow-none bg-white p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide mb-4">
                Credit Decision Explanation <InfoIcon />
              </h3>
              <div className="space-y-4 text-xs leading-relaxed text-slate-700 font-medium">
                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 bg-[#16A34A] rounded-full mt-1.5 flex-shrink-0" />
                  <p><span className="font-bold text-slate-800 uppercase tracking-wider text-[9px] block mb-0.5 text-[#16A34A]">Qualification Profile</span>{result.decisionExplanation.qualification}</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 bg-[#DC2626] rounded-full mt-1.5 flex-shrink-0" />
                  <p><span className="font-bold text-slate-800 uppercase tracking-wider text-[9px] block mb-0.5 text-[#DC2626]">Remaining Risk Vectors</span>{result.decisionExplanation.remainingRisks}</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 bg-[#2563EB] rounded-full mt-1.5 flex-shrink-0" />
                  <p><span className="font-bold text-slate-800 uppercase tracking-wider text-[9px] block mb-0.5 text-[#2563EB]">Recommended Exposure Caps</span>{result.decisionExplanation.recommendedExposure}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-md p-3 mt-4 text-[11px] text-[#2563EB] leading-normal">
              Overall decision is <span className="font-bold">{result.decision}</span>. Suitable for <span className="font-bold">{result.lendingRecommendation}</span>.
            </div>
          </Card>

        </div>

        {/* ─── Credit Improvement Simulator Card ─── */}
        <Card className="rounded-md border-border shadow-none bg-white p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Credit Improvement Simulator</h3>
              <p className="text-xs text-slate-500 mt-0.5">Simulate alternate scores to predict limits and category bumps</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="text-right">
                <div className="text-slate-400 uppercase tracking-wider text-[9px]">Simulated Score</div>
                <div className="text-lg text-primary font-extrabold">{simResult.score.toFixed(2)}</div>
              </div>
              <div className="text-right border-l border-slate-200 pl-4">
                <div className="text-slate-400 uppercase tracking-wider text-[9px]">Simulated Limit</div>
                <div className="text-lg text-[#16A34A] font-extrabold">{simResult.recommendedCreditLimit}</div>
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
            <div>Current Tier: <span className="text-slate-800 font-bold">{result.lendingEligibilityStatus}</span> &rarr; Simulated Tier: <span className="text-primary font-bold">{simResult.lendingEligibilityStatus}</span></div>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => setSimScores(scores)}
              className="rounded-full text-[10px] h-7 border-border hover:bg-secondary"
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
