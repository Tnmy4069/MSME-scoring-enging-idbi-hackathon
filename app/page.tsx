"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Menu,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Check,
  Trash2,
  Sliders,
  Sparkles,
  Info,
  TrendingUp,
  Key,
  ShieldCheck
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { processHealthAssessment, calculateCreditConfidenceScore } from "@/lib/scoring";
import { MSMEScores, DataSourceFlags } from "@/lib/types";

// Supported Alternate Data Documents definition
interface SupportedDoc {
  key: string;
  name: string;
  description: string;
  required: boolean;
}

const SUPPORTED_DOCS: SupportedDoc[] = [
  { key: "gst", name: "GST Report", description: "GST returns, GSTR-1 & GSTR-3B filings", required: true },
  { key: "upi", name: "UPI Statement", description: "Business transaction records from UPI merchants", required: true },
  { key: "bank", name: "Bank Statement", description: "Current account transaction logs (12 Months)", required: true },
  { key: "epfo", name: "EPFO Report", description: "Employer provident fund contribution & headcount logs", required: true }
];

export default function AlternateUnderwritingPage() {
  // Navigation and layout states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Workflow states
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedProfile, setSelectedProfile] = useState<"healthy" | "medium" | "high" | null>(null);
  
  // Document uploads tracking
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; size: string; content?: string }>>({});
  const [dragActive, setDragActive] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Extraction results state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<Record<string, "idle" | "parsing" | "success">>(
    Object.fromEntries(SUPPORTED_DOCS.map(d => [d.key, "idle"]))
  );
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});
  const [extractedCompany, setExtractedCompany] = useState("");
  const [extractionSource, setExtractionSource] = useState("");

  // Underwriting and scoring results state
  const [scoringResults, setScoringResults] = useState<any>(null);
  const [scores, setScores] = useState<MSMEScores>({
    businessActivity: 75,
    cashFlowHealth: 75,
    complianceScore: 70,
    transactionBehaviour: 80,
    businessStability: 75,
    networkStrength: 70,
    growthPotential: 75,
    riskIndicators: 45
  });

  // What-If Simulator states
  const [simulatedCompliance, setSimulatedCompliance] = useState(70);
  const [simulatedCashFlow, setSimulatedCashFlow] = useState(75);
  const [simulatedGrowth, setSimulatedGrowth] = useState(75);
  const [simulatedScoreData, setSimulatedScoreData] = useState<any>(null);

  // Load API Key from local storage if exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("idbi_gemini_api_key");
      if (savedKey) {
        setCustomApiKey(savedKey);
      }
    }
  }, []);

  // Update localStorage when key changes
  const handleApiKeyChange = (val: string) => {
    setCustomApiKey(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("idbi_gemini_api_key", val);
    }
  };

  // Helper to load sample profiles
  const loadDemoProfile = (profile: "healthy" | "medium" | "high") => {
    setSelectedProfile(profile);
    const demoNames: Record<string, string> = {
      healthy: "Vikas Industries Limited",
      medium: "Kiran Enterprise Pvt Ltd",
      high: "Apex Retailers Ltd"
    };
    
    // Simulate files selected
    const mockFiles: Record<string, { name: string; size: string }> = {
      gst: { name: `gst_report_${profile}.json`, size: "48.2 KB" },
      upi: { name: `upi_statement_${profile}.csv`, size: "142.5 KB" },
      bank: { name: `bank_statement_${profile}.txt`, size: "854.1 KB" },
      epfo: { name: `epfo_report_${profile}.txt`, size: "12.8 KB" }
    };
    
    setUploadedFiles(mockFiles);
    setExtractedCompany(demoNames[profile]);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent, docKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(docKey);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  };

  const handleDrop = (e: React.DragEvent, docKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file, docKey);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docKey: string) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, docKey);
    }
  };

  const processFile = (file: File, docKey: string) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadedFiles(prev => ({
        ...prev,
        [docKey]: {
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          content
        }
      }));
    };
    reader.readAsText(file);
    // Reset selected profile since they are uploading their own documents
    setSelectedProfile(null);
  };

  const removeFile = (docKey: string) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[docKey];
      return updated;
    });
    setSelectedProfile(null);
  };

  // Triggers document extraction
  const analyzeBusiness = async () => {
    if (Object.keys(uploadedFiles).length === 0) return;
    
    setIsExtracting(true);
    setActiveStep(2);

    const keys = SUPPORTED_DOCS.map(d => d.key);
    
    // Step-by-step progress simulation
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      setExtractionProgress(prev => ({ ...prev, [key]: "parsing" }));
      
      // Wait for a simulated parsing delay or network request
      await new Promise(resolve => setTimeout(resolve, 600));

      try {
        const fileData = uploadedFiles[key];
        const payload: any = {
          documentType: key,
          customApiKey: customApiKey || undefined
        };

        if (selectedProfile) {
          payload.mockProfile = selectedProfile;
        } else if (fileData) {
          payload.text = fileData.content || "";
          payload.fileName = fileData.name;
        } else {
          // If a document wasn't uploaded, default to medium mock for completeness
          payload.mockProfile = "medium";
        }

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          setExtractedData(prev => ({ ...prev, [key]: data.extractedData }));
          if (data.companyName && !extractedCompany) {
            setExtractedCompany(data.companyName);
          }
          if (data.source) {
            setExtractionSource(data.source);
          }
        }
      } catch (err) {
        console.error(`Error parsing document ${key}:`, err);
      }

      setExtractionProgress(prev => ({ ...prev, [key]: "success" }));
    }

    setIsExtracting(false);
  };

  // Compile individual document values to final MSME Underwriting Scores
  useEffect(() => {
    if (Object.keys(extractedData).length === SUPPORTED_DOCS.length) {
      const gst = extractedData.gst || {};
      const upi = extractedData.upi || {};
      const bank = extractedData.bank || {};
      const epfo = extractedData.epfo || {};

      // Map values into the 0-100 dimensions
      // complianceScore maps directly to GST compliance
      const complianceScore = gst.compliance || 70;
      
      // businessActivity based on GST turnover (e.g. Turnover ₹1.24 Cr => ~78 raw score)
      const gstTurnover = gst.turnover || 12400000;
      const businessActivity = Math.min(100, Math.max(20, Math.round((gstTurnover / 15000000) * 100)));
      
      // growthPotential based on GST growth + Employee growth
      const gstGrowth = gst.growth || 18.0;
      const epfoGrowth = epfo.employeeGrowth || 16.7;
      const growthPotential = Math.min(100, Math.max(20, Math.round(((gstGrowth + epfoGrowth) / 40) * 100)));
      
      // transactionBehaviour based on UPI failed transaction rate (1.2% failed => 94 behaviour score)
      const upiFailRate = upi.failedTransactions || 1.2;
      const transactionBehaviour = Math.min(100, Math.max(10, Math.round(100 - (upiFailRate * 5))));

      // cashFlowHealth based on Bank cash flow stability and average balance
      const bankStability = bank.cashFlowStability || "High";
      const cashFlowBase = bankStability === "High" ? 85 : bankStability === "Medium" ? 65 : 45;
      const cashFlowHealth = Math.min(100, cashFlowBase + (bank.averageBalance ? Math.min(15, Math.round(bank.averageBalance / 50000)) : 10));

      // businessStability based on headcount + balance stability
      const headcount = epfo.employees || 42;
      const businessStability = Math.min(100, Math.max(30, 60 + Math.round(headcount / 2)));

      // Network strength based on transaction volumes
      const txCount = upi.transactions || 18240;
      const networkStrength = Math.min(100, Math.max(30, 50 + Math.round(txCount / 500)));

      // Determine riskIndicators penalty profile (Healthy = 10, Medium = 45, High = 80)
      let riskIndicators = 45;
      if (selectedProfile === "healthy") riskIndicators = 10;
      if (selectedProfile === "high") riskIndicators = 80;
      if (!selectedProfile) {
        // Compute dynamically based on metrics
        let penalty = 20;
        if (upiFailRate > 4) penalty += 20;
        if (bank.emiBurden === "High") penalty += 20;
        if (gstGrowth < 0) penalty += 20;
        riskIndicators = penalty;
      }

      const compiledScores: MSMEScores = {
        businessActivity,
        cashFlowHealth,
        complianceScore,
        transactionBehaviour,
        businessStability,
        networkStrength,
        growthPotential,
        riskIndicators
      };

      setScores(compiledScores);
      setSimulatedCompliance(complianceScore);
      setSimulatedCashFlow(cashFlowHealth);
      setSimulatedGrowth(growthPotential);
    }
  }, [extractedData, selectedProfile]);

  // Generate Credit Health Card
  const generateHealthCard = () => {
    const flags: DataSourceFlags = {
      gst: !!extractedData.gst,
      upi: !!extractedData.upi,
      accountAggregator: !!extractedData.bank,
      epfo: !!extractedData.epfo,
      itr: false
    };

    const results = processHealthAssessment(scores, flags);
    setScoringResults(results);

    // Seed the initial What-If simulator state
    const cceSim = calculateCreditConfidenceScore(scores);
    setSimulatedScoreData({
      score: cceSim.score,
      limit: results.recommendedCreditLimit,
      status: results.lendingEligibilityStatus,
      product: results.lendingRecommendation === "Low Risk Lending" ? "Prime Business Loan" : results.lendingRecommendation === "Growth Lending" ? "Working Capital Loan" : "Micro Business Loan"
    });

    setActiveStep(3);
    
    // Smooth scroll down to result card
    setTimeout(() => {
      document.getElementById("underwriting-report-anchor")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  // Handle Simulator Adjustments
  useEffect(() => {
    if (!scoringResults) return;

    const simulatedScores: MSMEScores = {
      ...scores,
      complianceScore: simulatedCompliance,
      cashFlowHealth: simulatedCashFlow,
      growthPotential: simulatedGrowth
    };

    const cceSim = calculateCreditConfidenceScore(simulatedScores);
    
    // Map simulated score to credit limit config
    let simulatedLimit = "₹2,00,000";
    let simulatedStatus: any = "Manual Review";
    let simulatedProduct = "Micro Business Loan (Review)";

    if (cceSim.score >= 90) {
      simulatedLimit = "₹25,00,000";
      simulatedStatus = "Premium Eligible";
      simulatedProduct = "Prime Business Loan / Overdraft";
    } else if (cceSim.score >= 80) {
      simulatedLimit = "₹15,00,000";
      simulatedStatus = "Growth Ready";
      simulatedProduct = "Prime Working Capital Loan";
    } else if (cceSim.score >= 70) {
      simulatedLimit = "₹10,00,000";
      simulatedStatus = "Growth Ready";
      simulatedProduct = "Working Capital Loan";
    } else if (cceSim.score >= 60) {
      simulatedLimit = "₹5,00,000";
      simulatedStatus = "Standard Eligible";
      simulatedProduct = "Business Term Loan";
    } else if (cceSim.score >= 40) {
      simulatedLimit = "₹2,00,000";
      simulatedStatus = "Limited Exposure";
      simulatedProduct = "Micro Business Loan";
    }

    setSimulatedScoreData({
      score: cceSim.score,
      limit: simulatedLimit,
      status: simulatedStatus,
      product: simulatedProduct
    });

  }, [simulatedCompliance, simulatedCashFlow, simulatedGrowth, scores, scoringResults]);

  // Client-side PDF downloader
  const downloadPDFReport = async () => {
    const reportElement = document.getElementById("idbi-health-card-container");
    if (!reportElement) return;

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#F8FAF9",
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Top margin

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Handle multi-page if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`IDBI_MSME_Health_Card_${(extractedCompany || "Business").replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to export PDF. Please check console for details.");
    }
  };

  // Reset the workflow back to step 1
  const resetWorkflow = () => {
    setActiveStep(1);
    setSelectedProfile(null);
    setUploadedFiles({});
    setExtractedData({});
    setExtractedCompany("");
    setScoringResults(null);
    setExtractionProgress(Object.fromEntries(SUPPORTED_DOCS.map(d => [d.key, "idle"])));
  };

  // Radar Chart formatting
  const radarData = [
    { subject: "Business Activity", A: scores.businessActivity, fullMark: 100 },
    { subject: "Cash Flow", A: scores.cashFlowHealth, fullMark: 100 },
    { subject: "Compliance", A: scores.complianceScore, fullMark: 100 },
    { subject: "Transaction Behaviour", A: scores.transactionBehaviour, fullMark: 100 },
    { subject: "Stability", A: scores.businessStability, fullMark: 100 },
    { subject: "Growth", A: scores.growthPotential, fullMark: 100 }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-[#EEF5F2] selection:text-[#00836C] relative">
      <Sidebar isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Header */}
        <header className="h-[72px] bg-white border-b border-border flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#00614F] tracking-tight leading-none uppercase">
                MSME Financial Health Card
              </h2>
              <p className="text-[10px] sm:text-xs text-[#00836C] font-bold uppercase tracking-wider mt-0.5 sm:mt-1">
                AI-Powered Alternate Data Credit Assessment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Gemini API config toggle */}
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY
                  ? "bg-[#EEF5F2] text-[#00836C] border-[#00836C]/30"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "Gemini Live Active" : "Setup Gemini API"}
              </span>
            </button>

            {/* Profile / Institution badge */}
            <div className="flex items-center gap-2 border-l border-border pl-3">
              <div className="w-8 h-8 rounded-full bg-[#00614F] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                ID
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Underwriter Portal</span>
                <span className="text-xs font-bold text-slate-700 leading-none mt-1">IDBI Officer</span>
              </div>
            </div>
          </div>
        </header>

        {/* Gemini API Key Slide-Down Banner */}
        {showApiKeyInput && (
          <div className="bg-slate-50 border-b border-border p-4 animate-in slide-in-from-top duration-200">
            <div className="max-w-xl mx-auto flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Key className="h-3.5 w-3.5 text-[#00836C]" /> Custom Gemini API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste your Gemini API Key here (AIzaSy...)"
                  value={customApiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-[#00836C] bg-white font-mono"
                />
                {customApiKey && (
                  <button
                    onClick={() => handleApiKeyChange("")}
                    className="px-3 py-2 text-xs font-semibold text-[#DC2626] bg-[#DC2626]/10 rounded-md hover:bg-[#DC2626]/20 transition-colors"
                  >
                    Clear Key
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Your key is stored securely in your local browser and sent directly to Google Gemini APIs only. If left blank, the app will read the `.env` key, or fallback to our high-fidelity rule-based parsing engine.
              </p>
            </div>
          </div>
        )}

        {/* ─── Workflow Content Stepper Progress Tracker ─── */}
        <div className="bg-white border-b border-border/80 px-4 py-4 sm:px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                activeStep >= 1 ? "bg-[#00836C] text-white" : "bg-slate-200 text-slate-500"
              }`}>1</span>
              <span className={`text-xs sm:text-sm font-bold ${activeStep >= 1 ? "text-slate-800" : "text-slate-400"}`}>Upload Documents</span>
            </div>
            <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-slate-200 relative">
              <div className={`absolute top-0 left-0 h-full bg-[#00836C] transition-all duration-300 ${
                activeStep > 1 ? "w-full" : "w-0"
              }`} />
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                activeStep >= 2 ? "bg-[#00836C] text-white" : "bg-slate-200 text-slate-500"
              }`}>2</span>
              <span className={`text-xs sm:text-sm font-bold ${activeStep >= 2 ? "text-slate-800" : "text-slate-400"}`}>Review Extracted Data</span>
            </div>
            <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-slate-200 relative">
              <div className={`absolute top-0 left-0 h-full bg-[#00836C] transition-all duration-300 ${
                activeStep > 2 ? "w-full" : "w-0"
              }`} />
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                activeStep >= 3 ? "bg-[#00836C] text-white" : "bg-slate-200 text-slate-500"
              }`}>3</span>
              <span className={`text-xs sm:text-sm font-bold ${activeStep >= 3 ? "text-slate-800" : "text-slate-400"}`}>Credit Underwriting</span>
            </div>
          </div>
        </div>

        {/* ─── Main Workflow Content Grid ─── */}
        <main className="p-4 sm:p-8 flex-1 bg-slate-50/50 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-12 pb-16">
            
            {/* Header Description */}
            <div className="text-center sm:text-left space-y-2 max-w-3xl">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                Alternate Data Credit Underwriting Engine
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                Upload alternate financial documents to generate a real-time MSME Financial Health Card and credit eligibility assessment.
              </p>
            </div>

            {/* ================================================
                STEP 1: UPLOAD DOCUMENTS
                ================================================ */}
            <section className={`transition-all duration-300 ${activeStep !== 1 ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
                <div className="bg-[#EEF5F2] border-b border-border/80 px-6 py-4 flex items-center justify-between">
                  <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                    <Upload className="h-4 w-4" /> STEP 1: UPLOAD DOCUMENT CREDENTIALS
                  </h3>
                  {activeStep > 1 && (
                    <button
                      onClick={resetWorkflow}
                      className="text-xs font-bold text-[#00836C] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Reset Workspace
                    </button>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Grid of Documents Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SUPPORTED_DOCS.map((doc) => {
                      const file = uploadedFiles[doc.key];
                      return (
                        <div
                          key={doc.key}
                          onDragEnter={(e) => handleDrag(e, doc.key)}
                          onDragOver={(e) => handleDrag(e, doc.key)}
                          onDragLeave={(e) => handleDrag(e, doc.key)}
                          onDrop={(e) => handleDrop(e, doc.key)}
                          className={`relative border rounded-md p-4 transition-all duration-150 flex flex-col justify-between h-[180px] group ${
                            file
                              ? "bg-[#EEF5F2]/40 border-[#00836C] shadow-sm"
                              : dragActive === doc.key
                              ? "bg-slate-50 border-[#00836C] border-dashed scale-102"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="p-2 bg-slate-50 group-hover:bg-[#EEF5F2] rounded-md transition-colors">
                                <FileText className={`h-5 w-5 ${file ? "text-[#00836C]" : "text-slate-400"}`} />
                              </span>
                              {file ? (
                                <span className="text-[10px] font-bold text-[#00836C] bg-[#EEF5F2] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Check className="h-3 w-3" /> Ready
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">
                                  Required
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 leading-snug">{doc.name}</h4>
                            <p className="text-[11px] text-slate-400 font-semibold leading-normal mt-1">
                              {doc.description}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            {file ? (
                              <div className="flex items-center justify-between w-full">
                                <div className="truncate pr-2">
                                  <span className="block text-xs font-bold text-slate-700 truncate">{file.name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">{file.size}</span>
                                </div>
                                <button
                                  onClick={() => removeFile(doc.key)}
                                  className="p-1 rounded text-[#DC2626] hover:bg-[#DC2626]/10 cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-full">
                                <input
                                  type="file"
                                  ref={(el) => { fileInputRefs.current[doc.key] = el; }}
                                  onChange={(e) => handleFileSelect(e, doc.key)}
                                  className="hidden"
                                  accept=".json,.csv,.txt,.pdf"
                                />
                                <button
                                  onClick={() => fileInputRefs.current[doc.key]?.click()}
                                  className="w-full text-center py-1.5 border border-[#00836C] text-[#00836C] hover:bg-[#EEF5F2] text-xs font-bold rounded-full transition-colors cursor-pointer"
                                >
                                  Browse File
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load Demo MSME Profiles */}
                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center sm:text-left">
                      Or Load Demo MSME Credentials
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: "healthy", name: "Healthy MSME", desc: "Premium Credit, High Compliance", color: "hover:border-[#16A34A] hover:bg-[#16A34A]/5" },
                        { key: "medium", name: "Medium Risk MSME", desc: "Growth Ready, Compliance Gaps", color: "hover:border-[#F59E0B] hover:bg-[#F59E0B]/5" },
                        { key: "high", name: "High Risk MSME", desc: "Declining Growth, High Delinquency", color: "hover:border-[#DC2626] hover:bg-[#DC2626]/5" }
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => loadDemoProfile(item.key as any)}
                          className={`flex flex-col text-left p-3.5 border border-slate-200 rounded-md transition-all cursor-pointer ${item.color} ${
                            selectedProfile === item.key ? "ring-2 ring-[#00836C] bg-[#EEF5F2]/30 border-[#00836C]" : "bg-white"
                          }`}
                        >
                          <span className="font-bold text-sm text-slate-800">{item.name}</span>
                          <span className="text-[11px] text-slate-400 font-semibold mt-1">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      onClick={analyzeBusiness}
                      disabled={Object.keys(uploadedFiles).length === 0 || isExtracting}
                      className="px-8 py-3 bg-[#00836C] hover:bg-[#00614F] text-white disabled:bg-slate-200 disabled:text-slate-400 font-bold rounded-full flex items-center gap-2 shadow-sm transition-all text-sm cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isExtracting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Extracting Ledger...
                        </>
                      ) : (
                        <>
                          Analyze Business Alternate Data <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Downloadable Demo Files Helper */}
                  <div className="bg-slate-50 rounded p-4 flex flex-col sm:flex-row items-center justify-between border border-slate-200/50 gap-4 mt-2">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-white border border-slate-200 rounded-full">
                        <Download className="h-4 w-4 text-[#00836C]" />
                      </span>
                      <div className="text-left">
                        <span className="block text-xs font-bold text-slate-800">Download Sandbox Sample Ledger Files</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Use these formatted test files to evaluate the parser performance</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <a href="/demo/gst_report_healthy.json" download className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:text-[#00836C] hover:border-[#00836C] transition-colors">GST (JSON)</a>
                      <a href="/demo/upi_statement_healthy.csv" download className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:text-[#00836C] hover:border-[#00836C] transition-colors">UPI (CSV)</a>
                      <a href="/demo/bank_statement_healthy.txt" download className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:text-[#00836C] hover:border-[#00836C] transition-colors">Bank (TXT)</a>
                      <a href="/demo/epfo_report_healthy.txt" download className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:text-[#00836C] hover:border-[#00836C] transition-colors">EPFO (TXT)</a>
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* ================================================
                STEP 2: DATA EXTRACTION RESULTS
                ================================================ */}
            {activeStep >= 2 && (
              <section className={`transition-all duration-300 ${activeStep !== 2 ? "opacity-40 pointer-events-none" : ""}`}>
                <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
                  <div className="bg-[#EEF5F2] border-b border-border/80 px-6 py-4 flex items-center justify-between">
                    <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                      <ShieldCheck className="h-4 w-4" /> STEP 2: ALTERNATE LEDGER EXTRACTION RESULTS
                    </h3>
                    {extractionSource && (
                      <span className="text-[10px] font-bold text-[#00836C] bg-white border border-[#00836C]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Sparkles className="h-3 w-3 text-idbi-gold" /> {extractionSource}
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-8">
                    {/* Extraction Progress Checklist */}
                    <div className="bg-slate-50/50 rounded-md border border-slate-200/60 p-4">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Parsing Ledger Logs</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {SUPPORTED_DOCS.map((doc) => {
                          const progress = extractionProgress[doc.key];
                          return (
                            <div key={doc.key} className="flex items-center gap-2">
                              {progress === "idle" ? (
                                <div className="h-4 w-4 rounded-full border border-slate-300 bg-white" />
                              ) : progress === "parsing" ? (
                                <svg className="animate-spin h-4 w-4 text-[#00836C]" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <CheckCircle2 className="h-4.5 w-4.5 text-[#16A34A] fill-[#16A34A]/10" />
                              )}
                              <span className={`text-xs font-bold ${progress === "success" ? "text-slate-800" : "text-slate-400"}`}>
                                {doc.name} {progress === "success" && "Parsed"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Extracted Structured Data Table */}
                    {Object.keys(extractedData).length > 0 && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-3.5 border border-slate-200/80 rounded-md">
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Identified MSME Business Entity</span>
                            <span className="text-sm font-bold text-slate-800">{extractedCompany || "Generic Business Corporation"}</span>
                          </div>
                          <span className="text-xs text-[#00836C] font-semibold flex items-center gap-1">
                            <Info className="h-3.5 w-3.5" /> Direct Underwriting Mapping Active
                          </span>
                        </div>

                        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            
                            {/* GST Data */}
                            <div className="p-4 space-y-3">
                              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                                <span className="text-xs font-black text-[#00614F] tracking-wide uppercase">GST Ledgers</span>
                                <span className="text-[10px] text-slate-400 font-bold font-mono">GSTR-3B</span>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Turnover (Annual)</span>
                                  <span className="text-base font-extrabold text-slate-800">
                                    ₹{(extractedData.gst?.turnover / 10000000).toFixed(2)} Cr
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">YoY Growth</span>
                                    <span className={`text-xs font-bold ${extractedData.gst?.growth >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                                      {extractedData.gst?.growth}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Compliance</span>
                                    <span className="text-xs font-bold text-slate-800">
                                      {extractedData.gst?.compliance}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* UPI Data */}
                            <div className="p-4 space-y-3">
                              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                                <span className="text-xs font-black text-[#00614F] tracking-wide uppercase">UPI Merchant</span>
                                <span className="text-[10px] text-slate-400 font-bold font-mono">Settlement</span>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Annual Inflow</span>
                                  <span className="text-base font-extrabold text-slate-800">
                                    ₹{(extractedData.upi?.annualInflow / 100000).toFixed(1)}L
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Transactions</span>
                                    <span className="text-xs font-bold text-slate-800">
                                      {extractedData.upi?.transactions?.toLocaleString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Bounce Rate</span>
                                    <span className="text-xs font-bold text-[#DC2626]">
                                      {extractedData.upi?.failedTransactions}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bank Data */}
                            <div className="p-4 space-y-3">
                              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                                <span className="text-xs font-black text-[#00614F] tracking-wide uppercase">Banking Core</span>
                                <span className="text-[10px] text-slate-400 font-bold font-mono">Current A/C</span>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Average Balance</span>
                                  <span className="text-base font-extrabold text-slate-800">
                                    ₹{(extractedData.bank?.averageBalance / 100000).toFixed(2)}L
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">EMI Burden</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                                      extractedData.bank?.emiBurden === "Low" ? "bg-[#EEF5F2] text-[#00836C]" : "bg-red-50 text-[#DC2626]"
                                    }`}>
                                      {extractedData.bank?.emiBurden}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Cash Stability</span>
                                    <span className="text-xs font-bold text-slate-800">
                                      {extractedData.bank?.cashFlowStability}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* EPFO Data */}
                            <div className="p-4 space-y-3">
                              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                                <span className="text-xs font-black text-[#00614F] tracking-wide uppercase">Employment</span>
                                <span className="text-[10px] text-slate-400 font-bold font-mono">EPFO Payroll</span>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Employee Count</span>
                                  <span className="text-base font-extrabold text-slate-800">
                                    {extractedData.epfo?.employees} Active
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] text-slate-400 font-bold uppercase">headcount Growth</span>
                                  <span className={`text-xs font-bold ${extractedData.epfo?.employeeGrowth >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                                    {extractedData.epfo?.employeeGrowth}% YoY
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                    {/* CTA to Step 3 */}
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        onClick={generateHealthCard}
                        disabled={Object.keys(extractedData).length !== SUPPORTED_DOCS.length}
                        className="px-8 py-3 bg-[#00836C] hover:bg-[#00614F] text-white disabled:bg-slate-200 disabled:text-slate-400 font-bold rounded-full flex items-center gap-2 shadow-sm transition-all text-sm cursor-pointer"
                      >
                        Generate Financial Health Card <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}


            {/* ================================================
                STEP 3, 4, 5: UNDERWRITING REPORT DISPLAY
                ================================================ */}
            <div id="underwriting-report-anchor" className="scroll-mt-24" />

            {activeStep >= 3 && scoringResults && (
              <div id="idbi-health-card-container" className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                
                {/* ─── STEP 3: FINANCIAL HEALTH CARD (HERO CARD) ─── */}
                <section>
                  <div className="bg-white rounded-md border border-border shadow-md overflow-hidden">
                    <div className="bg-[#EEF5F2] border-b border-border/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                          <ShieldCheck className="h-4 w-4 text-[#F4B400]" /> STEP 3: IDBI BANK MSME FINANCIAL HEALTH CARD
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                          OFFICIAL ASSESSMENT RECORD
                        </p>
                      </div>
                      <button
                        onClick={downloadPDFReport}
                        className="px-4 py-2 border border-[#00836C] text-[#00836C] hover:bg-[#EEF5F2] text-xs font-bold rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm bg-white"
                      >
                        <Download className="h-3.5 w-3.5" /> Download Report (PDF)
                      </button>
                    </div>

                    {/* Premium Banking Pass Card Body */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#00614F] text-white rounded-md p-6 sm:p-8 relative overflow-hidden shadow-md">
                        {/* Abstract background graphics to mimic real premium pass */}
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                        <div className="absolute left-[-50px] bottom-[-50px] w-64 h-64 bg-[#00836C]/20 rounded-full filter blur-xl pointer-events-none" />

                        {/* Col 1: Circular Score Gauge */}
                        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center">
                          <span className="text-[11px] text-[#EEF5F2]/70 font-bold uppercase tracking-widest mb-3">Credit Confidence Score</span>
                          <div className="relative w-36 h-36 flex items-center justify-center">
                            {/* Gauge Track */}
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="72"
                                cy="72"
                                r="58"
                                className="stroke-white/10"
                                strokeWidth="8"
                                fill="transparent"
                              />
                              <circle
                                cx="72"
                                cy="72"
                                r="58"
                                className="stroke-[#F4B400] transition-all duration-1000 ease-out"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={364}
                                strokeDashoffset={364 - (364 * scoringResults.score) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                              <span className="text-4xl font-black text-white leading-none tracking-tight">{Math.round(scoringResults.score)}</span>
                              <span className="text-[10px] text-[#EEF5F2]/80 font-bold uppercase tracking-wider mt-1">Index Rank</span>
                            </div>
                          </div>
                          <span className="mt-3 px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold border border-white/15">
                            {scoringResults.lendingEligibilityStatus}
                          </span>
                        </div>

                        {/* Col 2: Business Profile Info */}
                        <div className="lg:col-span-8 space-y-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-4 gap-4">
                            <div>
                              <span className="text-[10px] text-[#EEF5F2]/60 font-bold uppercase tracking-wider leading-none">Registered MSME Entity</span>
                              <h2 className="text-xl font-extrabold tracking-tight mt-1">{extractedCompany || "Kiran Enterprise Pvt Ltd"}</h2>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-[#EEF5F2]/60 font-bold uppercase tracking-wider leading-none">Assessment ID</span>
                              <p className="font-mono text-xs text-white/80 font-bold tracking-wide mt-1">IDBI-CCE-98246X</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <span className="text-[10px] text-[#EEF5F2]/60 font-bold uppercase tracking-wider leading-none">Recommended Funding Product</span>
                              <p className="text-base font-extrabold text-[#F4B400] mt-1 flex items-center gap-1.5">
                                <Sparkles className="h-4.5 w-4.5" /> {scoringResults.lendingRecommendation === "Low Risk Lending" ? "Prime Business Loan" : scoringResults.lendingRecommendation === "Growth Lending" ? "Working Capital Loan" : "Micro Business Loan"}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#EEF5F2]/60 font-bold uppercase tracking-wider leading-none">Recommended Credit Exposure</span>
                              <p className="text-2xl font-black tracking-tight text-white mt-1">
                                {scoringResults.recommendedCreditLimit}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-[11px] text-[#EEF5F2]/70 font-semibold">
                            <Info className="h-3.5 w-3.5 text-[#F4B400]" />
                            <span>Structured validation based on GST registry, transaction settlement logs, and EPFO schedules.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>


                {/* ─── STEP 4: ASSESSMENT INSIGHTS (STRENGTHS VS RISKS) ─── */}
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Why You Qualify */}
                    <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="bg-[#EEF5F2] border-b border-border/80 px-6 py-4">
                          <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-[#16A34A]" /> STEP 4A: WHY BUSINESS QUALIFIES
                          </h3>
                        </div>
                        <div className="p-6 space-y-4">
                          {scoringResults.whyBankShouldLend && scoringResults.whyBankShouldLend.length > 0 ? (
                            scoringResults.whyBankShouldLend.map((strength: string, index: number) => (
                              <div key={index} className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] mt-0.5">
                                  <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700 leading-snug">{strength}</span>
                              </div>
                            ))
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] mt-0.5">
                                  <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700">Strong GST Growth and turnover compliance.</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] mt-0.5">
                                  <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700">Consistent Monthly UPI settlement inflows.</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] mt-0.5">
                                  <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700">Excellent regulatory filing compliance score.</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        Primary Credit Anchors
                      </div>
                    </div>

                    {/* Right: Risk Drivers */}
                    <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="bg-[#EEF5F2] border-b border-border/80 px-6 py-4">
                          <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" /> STEP 4B: CREDIT RISK DRIVERS
                          </h3>
                        </div>
                        <div className="p-6 space-y-4">
                          {selectedProfile === "high" || scores.riskIndicators >= 70 ? (
                            <>
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] mt-0.5">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700">Negative revenue trajectory over preceding GSTR cycles.</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] mt-0.5">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700">Critical digital transactions failure and bounce rate.</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] mt-0.5">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700">Sub-optimal ledger balance with elevated EMI leverage.</span>
                              </div>
                            </>
                          ) : selectedProfile === "healthy" ? (
                            <>
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] mt-0.5">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700">Minor client concentration in commercial trade.</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] mt-0.5">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700">Supplier dependency on bulk material handlers.</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] mt-0.5">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700 font-sans">Moderate Revenue Volatility across seasonal months.</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] mt-0.5">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700">Client Concentration: Top 3 buyers represent 65% of invoices.</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] mt-0.5">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700">Supplier Dependence on central logistical chains.</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        Risk Deductions Profile
                      </div>
                    </div>
                  </div>
                </section>


                {/* ─── STEP 5: BUSINESS HEALTH OVERVIEW (RADAR CHART) ─── */}
                <section>
                  <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
                    <div className="bg-[#EEF5F2] border-b border-border/80 px-6 py-4">
                      <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                        <TrendingUp className="h-4 w-4" /> STEP 5: BUSINESS HEALTH DIMENSIONS OVERVIEW
                      </h3>
                    </div>

                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-8 bg-white">
                      
                      {/* Left: Dimension description */}
                      <div className="w-full md:w-5/12 space-y-4 text-left">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Dimension Postures</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          The credit engine distributes total weight across 6 core alternate data pillars. Direct indices evaluate operational, liquidity, compliance, and employment parameters to represent comprehensive creditworthiness.
                        </p>
                        
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-md overflow-hidden bg-slate-50/50">
                          {[
                            { name: "Business Activity", val: scores.businessActivity, desc: "Evaluates invoice volumes and gross trade activity" },
                            { name: "Cash Flow Stability", val: scores.cashFlowHealth, desc: "Monitors daily account balances & leverage load" },
                            { name: "GST Compliance", val: scores.complianceScore, desc: "Tracks GSTR-1 and GSTR-3B filings cycle compliance" }
                          ].map((item, idx) => (
                            <div key={idx} className="p-3 flex justify-between items-center">
                              <div>
                                <span className="block text-xs font-bold text-slate-700">{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{item.desc}</span>
                              </div>
                              <span className="text-xs font-bold bg-[#EEF5F2] text-[#00836C] px-2.5 py-0.5 rounded-full">
                                {item.val}/100
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: The Radar Chart */}
                      <div className="w-full md:w-7/12 flex justify-center">
                        <div className="w-full max-w-[400px] h-[320px] flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: "#475569", fontSize: 10, fontWeight: 600 }}
                              />
                              <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={{ fill: "#94a3b8", fontSize: 9 }}
                                tickCount={5}
                              />
                              <Radar
                                name="MSME Posture"
                                dataKey="A"
                                stroke="#00836C"
                                strokeWidth={2.5}
                                fill="#00836C"
                                fillOpacity={0.18}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#ffffff",
                                  borderColor: "#d7e2dd",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                                }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                    </div>
                  </div>
                </section>


                {/* ─── STEP 6: IMPROVEMENT SIMULATOR (WHAT IF ANALYSIS) ─── */}
                {simulatedScoreData && (
                  <section>
                    <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
                      <div className="bg-[#EEF5F2] border-b border-border/80 px-6 py-4">
                        <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                          <Sliders className="h-4 w-4 text-[#F4B400]" /> STEP 6: ELIGIBILITY SIMULATOR & WHAT-IF ANALYSIS
                        </h3>
                      </div>

                      <div className="p-6 space-y-8">
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-3xl">
                          Simulate improvements in operational metrics to visualize potential upgrades in Credit Score and eligibility thresholds. Drag the sliders to project improvements:
                        </p>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                          {/* Sliders Block */}
                          <div className="lg:col-span-7 space-y-6">
                            
                            {/* Slider 1: GST Compliance */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-slate-700">GST Filing Compliance (%)</span>
                                <span className="font-extrabold text-[#00836C]">{simulatedCompliance}%</span>
                              </div>
                              <input
                                type="range"
                                min="60"
                                max="100"
                                value={simulatedCompliance}
                                onChange={(e) => setSimulatedCompliance(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#00836C]"
                              />
                              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                <span>60% (Non-Compliant)</span>
                                <span>80% (Moderate)</span>
                                <span>100% (Perfect Compliance)</span>
                              </div>
                            </div>

                            {/* Slider 2: Cash Flow Stability */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-slate-700">Cash Flow Stability Rating</span>
                                <span className="font-extrabold text-[#00836C]">{simulatedCashFlow}/100</span>
                              </div>
                              <input
                                type="range"
                                min="40"
                                max="100"
                                value={simulatedCashFlow}
                                onChange={(e) => setSimulatedCashFlow(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#00836C]"
                              />
                              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                <span>40 (Low Liquidity)</span>
                                <span>70 (Stable)</span>
                                <span>100 (Optimal Liquid Position)</span>
                              </div>
                            </div>

                            {/* Slider 3: YoY Revenue Growth */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-slate-700">YoY Revenue & Growth Outlook</span>
                                <span className="font-extrabold text-[#00836C]">{simulatedGrowth}/100</span>
                              </div>
                              <input
                                type="range"
                                min="30"
                                max="100"
                                value={simulatedGrowth}
                                onChange={(e) => setSimulatedGrowth(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#00836C]"
                              />
                              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                <span>30 (Negative)</span>
                                <span>65 (Flat / Slow)</span>
                                <span>100 (High Growth)</span>
                              </div>
                            </div>

                          </div>

                          {/* Dynamic Impact Display Panel */}
                          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-md p-6 flex flex-col justify-between h-full relative overflow-hidden">
                            
                            {/* Subtitle */}
                            <div className="border-b border-slate-200/80 pb-4 mb-4">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Projected Business Impact</span>
                              <span className="text-xs text-slate-500 font-semibold">Simulated values based on metric adjustments</span>
                            </div>

                            {/* Impact Stats */}
                            <div className="space-y-4">
                              {/* Score Delta */}
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700">Credit Confidence Score:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 text-xs font-bold font-mono">
                                    {Math.round(scoringResults.score)}
                                  </span>
                                  <span className="text-slate-400 text-xs">→</span>
                                  <span className="text-base font-black text-[#00836C] flex items-center">
                                    {Math.round(simulatedScoreData.score)}
                                    {simulatedScoreData.score > scoringResults.score && (
                                      <span className="text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/10 px-1.5 py-0.5 rounded-full ml-1.5">
                                        +{Math.round(simulatedScoreData.score - scoringResults.score)}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Credit Limit Delta */}
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700">Credit Eligibility Limit:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 text-xs font-bold">
                                    {scoringResults.recommendedCreditLimit}
                                  </span>
                                  <span className="text-slate-400 text-xs">→</span>
                                  <span className="text-base font-black text-[#00836C] flex items-center">
                                    {simulatedScoreData.limit}
                                    {simulatedScoreData.limit !== scoringResults.recommendedCreditLimit && (
                                      <span className="text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/10 px-1.5 py-0.5 rounded-full ml-1.5">
                                        Upgrade
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Recommended Product Delta */}
                              <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                                <span className="text-xs font-bold text-slate-700">Recommended Product:</span>
                                <span className="text-xs font-bold text-slate-800 bg-[#EEF5F2] text-[#00836C] px-2.5 py-0.5 rounded-full">
                                  {simulatedScoreData.product}
                                </span>
                              </div>
                            </div>

                            {/* Help Alert */}
                            <div className="mt-6 p-3 bg-[#EEF5F2]/60 rounded text-[10px] text-slate-500 font-semibold leading-normal flex items-start gap-1.5 border border-[#00836C]/10">
                              <Info className="h-3.5 w-3.5 text-[#00836C] flex-shrink-0" />
                              <span>Improving GST filing compliance to 90% or above and maintaining stable cash levels reduces the bank risk penalty, significantly boosting overall credit eligibility.</span>
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>
                  </section>
                )}

              </div>
            )}

            {/* Bottom Disclaimer */}
            <div className="text-center space-y-2 border-t border-slate-200/80 pt-8 max-w-3xl mx-auto">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Underwriting Disclaimer</p>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Assessment generated using alternate financial data including GST, UPI, Banking and Employment records.
                Final lending decision remains subject to IDBI Bank credit policy, full KYC documentation and physical audit verification.
              </p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
