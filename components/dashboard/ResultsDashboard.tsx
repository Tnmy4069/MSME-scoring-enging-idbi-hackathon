"use client";

import React, { useRef, useState } from "react";
import { MSMEScores, HealthResult } from "@/lib/types";
import { processHealthAssessment, DIMENSIONS } from "@/lib/scoring";
import { RadarChartMetrics } from "./RadarChartMetrics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Download, CheckCircle2, AlertCircle, Activity, ShieldCheck,
  BarChart2, Lightbulb, Info, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import { DataSourceFlags } from "@/lib/types";

interface ResultsDashboardProps {
  scores: MSMEScores;
  dataFlags: DataSourceFlags;
}

export function ResultsDashboard({ scores, dataFlags }: ResultsDashboardProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const result: HealthResult = processHealthAssessment(scores, dataFlags);

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

      const imgWidth = 190; // A4 size is 210mm wide, leaves 10mm margins
      const pageHeight = 297; // A4 height is 297mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // start 10mm from top

      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - 20); // account for margins

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - 20);
      }

      pdf.save('MSME_Credit_Confidence_Report.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Good':      return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Fair':      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'Weak':      return 'text-orange-700 bg-orange-50 border-orange-200';
      default:          return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const getStatusRingColor = (status: string) => {
    switch (status) {
      case 'Excellent': return '#10b981';
      case 'Good':      return '#3b82f6';
      case 'Fair':      return '#f59e0b';
      case 'Weak':      return '#f97316';
      default:          return '#ef4444';
    }
  };

  // Gauge
  const gaugeRadius = 60;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeStrokeDashoffset = gaugeCircumference - (result.score / 100) * gaugeCircumference;
  const strokeColor = getStatusRingColor(result.status);

  // Contribution chart data
  const chartData = result.scoreBreakdown.map(b => ({
    name: b.label,
    value: b.earnedPoints,
    fill: b.isRisk ? '#ef4444' : '#1e3a5f',
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleDownloadPDF} disabled={isExporting} className="gap-2 rounded-sm border-slate-300">
          <Download className="h-4 w-4" />
          {isExporting ? 'Generating Report...' : 'Download PDF Report'}
        </Button>
      </div>

      <div ref={reportRef} className="bg-white border border-slate-200 shadow-sm rounded-sm">

        {/* ─── Report Header ─── */}
        <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">MSME Credit Intelligence Platform</div>
            <h2 className="text-xl font-bold tracking-tight">Credit Confidence Assessment Report</h2>
            <p className="text-slate-400 text-sm mt-0.5">Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <ShieldCheck className="h-4 w-4" /> Confidential & Proprietary
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-10">

          {/* ─── Executive Summary ─── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Executive Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

              {/* Gauge */}
              <div className="col-span-2 md:col-span-1 xl:col-span-2 flex flex-col items-center justify-center py-4 border border-slate-200 rounded-sm bg-slate-50">
                <div className="relative flex items-center justify-center">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle cx="64" cy="64" r={gaugeRadius} stroke="#e2e8f0" strokeWidth="10" fill="transparent" />
                    <circle cx="64" cy="64" r={gaugeRadius} stroke={strokeColor} strokeWidth="10" fill="transparent"
                      strokeDasharray={gaugeCircumference} strokeDashoffset={gaugeStrokeDashoffset}
                      strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-slate-900">{result.score.toFixed(1)}</span>
                    <span className="text-xs text-slate-400 font-medium">/100</span>
                  </div>
                </div>
                <div className={`mt-3 px-3 py-1 rounded-sm text-xs font-bold border uppercase tracking-wider ${getStatusColor(result.status)}`}>{result.status}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">Credit Confidence Score</div>
              </div>

              {/* KPI: Status */}
              <KpiCard label="Financial Health Status" value={result.status} sub={result.lendingRecommendation} valueClass={getStatusColor(result.status).split(' ')[0]} />

              {/* KPI: Lending Recommendation */}
              <KpiCard label="Lending Recommendation" value={result.lendingRecommendation} sub={`Score: ${result.score.toFixed(2)}`} />

              {/* KPI: Risk Penalty */}
              <KpiCard label="Risk Penalty" value={result.riskPenalty > 0 ? `-${result.riskPenalty.toFixed(1)}` : '0'} sub={`Risk Indicators: ${scores.riskIndicators}/100`} valueClass={result.riskPenalty >= 10 ? 'text-red-600' : result.riskPenalty > 0 ? 'text-yellow-600' : 'text-emerald-600'} />

              {/* KPI: Credit Limit */}
              <KpiCard label="Recommended Credit Limit" value={result.recommendedCreditLimit} sub="Subject to verification" />

            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* ─── Score Composition — the USP ─── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <BarChart2 className="h-3.5 w-3.5" /> Score Composition
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

              {/* Tabular breakdown */}
              <div className="border border-slate-200 rounded-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">Dimension</th>
                      <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">Score</th>
                      <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.scoreBreakdown.map((b) => (
                      <tr key={b.key} className={`border-b border-slate-100 ${b.isRisk ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-2.5 font-medium text-slate-700">{b.label}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">{b.rawScore}/100</td>
                        <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${b.isRisk ? 'text-red-600' : 'text-emerald-700'}`}>
                          {b.earnedPoints > 0 ? '+' : ''}{b.earnedPoints.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white">
                      <td className="px-4 py-3 font-bold" colSpan={2}>Credit Confidence Score</td>
                      <td className="px-4 py-3 text-right font-black text-lg tabular-nums">{result.score.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Contribution bar chart */}
              <div>
                <div className="text-xs text-slate-500 font-medium mb-3">Contribution breakdown</div>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
                      <XAxis type="number" domain={[-20, 20]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: 12 }}
                        formatter={(val) => [`${Number(val) > 0 ? '+' : ''}${Number(val).toFixed(1)} pts`, 'Contribution']}
                      />
                      <ReferenceLine x={0} stroke="#cbd5e1" />
                      <Bar dataKey="value" radius={[2, 2, 2, 2]} maxBarSize={28}>
                        {chartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* ─── Radar Chart + Score Breakdown Bars ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" /> Dimension Analysis
              </h3>
              <RadarChartMetrics scores={scores} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Score Breakdown</h3>
              <div className="space-y-4">
                {DIMENSIONS.map((dim) => {
                  const val = scores[dim.key as keyof MSMEScores];
                  const barColor = val >= 80 ? 'bg-emerald-500' : val >= 60 ? 'bg-blue-500' : val >= 40 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={dim.key}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700">{dim.label}</span>
                        <span className="font-semibold text-slate-900 tabular-nums">{val} / 100</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className={`${barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* ─── Contributors ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positive */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> Positive Contributors
              </h3>
              {result.positiveContributors.length > 0 ? (
                <div className="space-y-2">
                  {result.positiveContributors.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-sm">
                      <div>
                        <div className="text-sm font-semibold text-emerald-800">✓ {c.label}</div>
                        <div className="text-xs text-emerald-600 mt-0.5">{c.description}</div>
                      </div>
                      <span className="text-sm font-bold text-emerald-700 tabular-nums whitespace-nowrap ml-4">+{c.impact.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No significant positive contributors.</p>
              )}
            </div>

            {/* Negative */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <ArrowDownRight className="h-3.5 w-3.5 text-red-500" /> Negative Contributors
              </h3>
              {result.negativeContributors.length > 0 ? (
                <div className="space-y-2">
                  {result.negativeContributors.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-sm">
                      <div>
                        <div className="text-sm font-semibold text-red-800">⚠ {c.label}</div>
                        <div className="text-xs text-red-600 mt-0.5">{c.description}</div>
                      </div>
                      <span className="text-sm font-bold text-red-700 tabular-nums whitespace-nowrap ml-4">
                        {c.impact < 0 ? c.impact.toFixed(1) : `+${c.impact.toFixed(1)} only`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No significant negative contributors.</p>
              )}
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* ─── Explainability ─── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5" /> Why This Score?
            </h3>
            <div className="border border-slate-200 bg-slate-50 rounded-sm p-5">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 leading-relaxed">{result.explanation}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Small KPI card helper ───────────────────────────────────────────────────

function KpiCard({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass?: string }) {
  return (
    <div className="border border-slate-200 rounded-sm p-4 bg-slate-50 flex flex-col justify-between">
      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">{label}</div>
      <div className={`text-xl font-bold ${valueClass ?? 'text-slate-900'} leading-tight`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1.5">{sub}</div>
    </div>
  );
}
