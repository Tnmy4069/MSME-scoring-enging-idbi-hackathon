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
  ShieldCheck,
  Shield,
  Eye,
  BarChart3,
  Zap,
  Clock,
  FileJson,
  ChevronDown,
  ChevronUp,
  Copy,
  Fingerprint,
  Users,
  Fuel,
  History
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
import { processHealthAssessment, calculateBHI, calculateRAI, calculateDTI, calculatePortfolioImpact, assessFinancialInclusion, detectFraudAnomalies, predictCashflowRunway, generateUnderwritingDecision, generateLoanOffer } from "@/lib/scoring";
import { BusinessHealthIndex, RiskAdjustmentIndex, DataTrustIndex, DataSourceFlags, HealthResult, ConsentRecord, FinancialInclusionAssessment, PortfolioImpactAssessment, FraudIntelligence, CashflowRunway, UnderwritingDecision } from "@/lib/types";

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
  { key: "epfo", name: "EPFO Report", description: "Employee provident fund history", required: true }
];

export default function Home() {
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Workflow states
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3>(1);
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
  const [scoringResults, setScoringResults] = useState<HealthResult | null>(null);
  const [bhi, setBhi] = useState<BusinessHealthIndex>({
    revenueQuality: 75,
    cashFlowHealth: 75,
    complianceGovernance: 70,
    growthPotential: 75,
    operationalStability: 75,
    businessNetworkStrength: 70
  });
  const [rai, setRai] = useState<RiskAdjustmentIndex>({
    revenueVolatility: -2,
    customerConcentration: -2,
    supplierDependency: -1,
    failedTransactionRatio: -3,
    debtStress: -4,
    fraudIndicators: 0
  });
  const [dti, setDti] = useState<DataTrustIndex>({
    gstCompleteness: 90,
    upiContinuity: 95,
    bankStatementCoverage: 100,
    epfoConsistency: 80,
    dataVerificationStatus: 100
  });
  const [averageMonthlyInflow, setAverageMonthlyInflow] = useState<number>(1000000);

  // What-If Simulator states
  const [simulatedCompliance, setSimulatedCompliance] = useState(70);
  const [simulatedCashFlow, setSimulatedCashFlow] = useState(75);
  const [simulatedGrowth, setSimulatedGrowth] = useState(75);
  const [simulatedScoreData, setSimulatedScoreData] = useState<any>(null);

  // AI Underwriter Summary states
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryTimestamp, setAiSummaryTimestamp] = useState<string | null>(null);
  const [aiSummaryVersion, setAiSummaryVersion] = useState("v1.0");
  const [aiSummaryCache, setAiSummaryCache] = useState<Record<string, { summary: string; timestamp: string; version: string; gstInsight?: string; upiInsight?: string; bankInsight?: string; epfoInsight?: string }>>({});

  // Granular AI Alternate Data Insights
  const [gstInsight, setGstInsight] = useState<string>("");
  const [upiInsight, setUpiInsight] = useState<string>("");
  const [bankInsight, setBankInsight] = useState<string>("");
  const [epfoInsight, setEpfoInsight] = useState<string>("");

  // Underwriter Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // ─── Phase 2 State Variables ───
  const [consentGranted, setConsentGranted] = useState(false);
  const [consentRecord, setConsentRecord] = useState<ConsentRecord | null>(null);
  const [inclusionAssessment, setInclusionAssessment] = useState<FinancialInclusionAssessment | null>(null);
  const [portfolioImpact, setPortfolioImpact] = useState<PortfolioImpactAssessment | null>(null);
  const [fraudIntelligence, setFraudIntelligence] = useState<FraudIntelligence | null>(null);
  const [cashflowRunway, setCashflowRunway] = useState<CashflowRunway | null>(null);
  const [underwritingDecision, setUnderwritingDecision] = useState<UnderwritingDecision | null>(null);
  const [loanOffer, setLoanOffer] = useState<any>(null);
  const [showLoanOffer, setShowLoanOffer] = useState(false);
  const [showDecisionJSON, setShowDecisionJSON] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  const generateUnderwritingSummary = async (
    currentBhi: BusinessHealthIndex,
    currentRai: RiskAdjustmentIndex,
    currentResults: HealthResult | null,
    company: string,
    data: any
  ) => {
    if (!currentResults) return;

    const payload = {
      businessName: company || "Kiran Enterprise Pvt Ltd",
      turnover: data.gst?.turnover || 12400000,
      growthRate: data.gst?.growth || 18.0,
      gstCompliance: data.gst?.compliance || currentBhi.complianceGovernance || 70,
      averageBalance: data.bank?.averageBalance || 485000,
      employeeCount: data.epfo?.employees || 42,
      transactionVolume: data.upi?.transactions || 18240,
      riskFactors: currentRai.debtStress || 0,
      creditScore: Math.round(currentResults.finalScore),
      recommendedExposure: currentResults.recommendedCreditExposure
    };

    const cacheKey = JSON.stringify(payload);
    if (aiSummaryCache[cacheKey]) {
      setAiSummary(aiSummaryCache[cacheKey].summary);
      setGstInsight(aiSummaryCache[cacheKey].gstInsight || "");
      setUpiInsight(aiSummaryCache[cacheKey].upiInsight || "");
      setBankInsight(aiSummaryCache[cacheKey].bankInsight || "");
      setEpfoInsight(aiSummaryCache[cacheKey].epfoInsight || "");
      setAiSummaryTimestamp(aiSummaryCache[cacheKey].timestamp);
      setAiSummaryVersion(aiSummaryCache[cacheKey].version);
      return;
    }

    setAiSummaryLoading(true);
    try {
      const res = await fetch("/api/underwrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " " + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          const versionNum = Object.keys(aiSummaryCache).length + 1;
          const versionStr = `v1.${versionNum}`;

          setAiSummary(result.summary);
          setGstInsight(result.gstInsight || "");
          setUpiInsight(result.upiInsight || "");
          setBankInsight(result.bankInsight || "");
          setEpfoInsight(result.epfoInsight || "");
          setAiSummaryTimestamp(timestamp);
          setAiSummaryVersion(versionStr);

          setAiSummaryCache(prev => ({
            ...prev,
            [cacheKey]: { 
              summary: result.summary, 
              timestamp, 
              version: versionStr,
              gstInsight: result.gstInsight,
              upiInsight: result.upiInsight,
              bankInsight: result.bankInsight,
              epfoInsight: result.epfoInsight
            }
          }));
        }
      }
    } catch (err) {
      console.error("Failed to generate AI summary:", err);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  // Listen for open-underwriter-chat trigger event from Sidebar
  useEffect(() => {
    const handleOpenChat = () => setIsChatOpen(true);
    window.addEventListener('open-underwriter-chat', handleOpenChat);
    return () => window.removeEventListener('open-underwriter-chat', handleOpenChat);
  }, []);

  // Chat scroll bottom trigger
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isChatOpen, chatMessages]);

  const submitChatPrompt = async (promptText: string) => {
    if (!promptText.trim() || chatLoading) return;

    const userMessage = { role: "user", content: promptText };
    const updatedMessages = [...chatMessages, userMessage];
    
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const context = {
        hasData: Object.keys(extractedData).length > 0,
        businessName: extractedCompany,
        financialHealthScore: scoringResults ? Math.round(scoringResults.finalScore) : 70,
        bhiScore: scoringResults ? scoringResults.bhiScore : 70,
        raiScore: scoringResults ? scoringResults.raiScore : 0,
        recommendedLimit: scoringResults ? scoringResults.recommendedCreditExposure : "N/A",
        recommendedProduct: scoringResults ? scoringResults.recommendedProduct : "N/A",
        gstTurnover: extractedData.gst?.turnover || 0,
        gstGrowth: extractedData.gst?.growth || 0,
        gstCompliance: extractedData.gst?.compliance || 0,
        upiInflow: extractedData.upi?.annualInflow || 0,
        upiTransactions: extractedData.upi?.transactions || 0,
        upiBounce: extractedData.upi?.failedTransactions || 0,
        bankBalance: extractedData.bank?.averageBalance || 0,
        bankEmi: extractedData.bank?.emiBurden || "Low",
        bankStability: extractedData.bank?.cashFlowStability || "High",
        epfoEmployees: extractedData.epfo?.employees || 0,
        epfoGrowth: extractedData.epfo?.employeeGrowth || 0,
        strengths: scoringResults ? scoringResults.explainability.bhiBreakdown.slice(0, 2).map(d => d.label).join(", ") : "",
        risks: scoringResults ? scoringResults.explainability.raiBreakdown.slice(0, 2).map(d => d.label).join(", ") : ""
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          context
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setChatMessages([...updatedMessages, { role: "model", content: data.content }]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch chatbot response:", err);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Debounced trigger for Underwriting Summary when assessment metrics change
  useEffect(() => {
    if (scoringResults) {
      const timer = setTimeout(() => {
        generateUnderwritingSummary(bhi, rai, scoringResults, extractedCompany, extractedData);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [bhi, rai, extractedCompany, extractedData, scoringResults]);

  // Custom navigation event listener for sidebar links
  useEffect(() => {
    const handleNavigation = async (e: any) => {
      const section = e.detail?.sectionId;
      if (!section) return;

      const scrollToSection = (id: string) => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      };

      if (section === 'documents') {
        setActiveStep(1);
        scrollToSection('documents');
      } else if (section === 'data-overview' || section === 'business-profile') {
        if (Object.keys(extractedData).length === 0) {
          loadDemoProfile("medium");
          setIsExtracting(true);
          setActiveStep(2);
          await new Promise(r => setTimeout(r, 600));
          const mockData = {
            gst: { turnover: 12400000, growth: 18.0, compliance: 70 },
            upi: { annualInflow: 9840000, transactions: 18240, failedTransactions: 1.2 },
            bank: { averageBalance: 485000, emiBurden: "Low", cashFlowStability: "High" },
            epfo: { employees: 42, employeeGrowth: 16.7 }
          };
          setExtractedData(mockData);
          setExtractedCompany("Kiran Enterprise Pvt Ltd");
          setExtractionSource("Demo Profile: medium");
          setExtractionProgress({ gst: "success", upi: "success", bank: "success", epfo: "success" });
          setIsExtracting(false);
        } else {
          setActiveStep(2);
        }
        scrollToSection(section);
      } else if (['idbi-health-card-container', 'strengths-risks', 'recommendations', 'credit-limit', 'activity-log'].includes(section)) {
        if (!scoringResults) {
          loadDemoProfile("medium");
          const mockData = {
            gst: { turnover: 12400000, growth: 18.0, compliance: 70 },
            upi: { annualInflow: 9840000, transactions: 18240, failedTransactions: 1.2 },
            bank: { averageBalance: 485000, emiBurden: "Low", cashFlowStability: "High" },
            epfo: { employees: 42, employeeGrowth: 16.7 }
          };
          setExtractedData(mockData);
          setExtractedCompany("Kiran Enterprise Pvt Ltd");
          setExtractionSource("Demo Profile: medium");
          setExtractionProgress({ gst: "success", upi: "success", bank: "success", epfo: "success" });
          
          const initialBhi = {
            revenueQuality: 83,
            cashFlowHealth: 85,
            complianceGovernance: 70,
            growthPotential: 87,
            operationalStability: 81,
            businessNetworkStrength: 86
          };
          const initialRai = {
            revenueVolatility: -2,
            customerConcentration: -2,
            supplierDependency: -1,
            failedTransactionRatio: -1,
            debtStress: -1,
            fraudIndicators: 0
          };
          const initialDti = {
            gstCompleteness: 100,
            upiContinuity: 100,
            bankStatementCoverage: 100,
            epfoConsistency: 100,
            dataVerificationStatus: 100
          };
          const results = processHealthAssessment(initialBhi, initialRai, initialDti, 826666);
          setScoringResults(results);
          setBhi(initialBhi);
          setRai(initialRai);
          setDti(initialDti);
          setAverageMonthlyInflow(826666);
          setSimulatedCompliance(70);
          setSimulatedCashFlow(85);
          setSimulatedGrowth(87);
          setSimulatedScoreData({
            score: results.finalScore,
            limit: results.recommendedCreditExposure,
            status: results.businessHealth,
            product: results.recommendedProduct
          });
          setActiveStep(3);
        } else {
          if (activeStep < 3) {
            setActiveStep(3);
          }
        }
        scrollToSection(section);
      }
    };

    window.addEventListener('navigate-to-section', handleNavigation);
    
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.substring(1);
      setTimeout(() => {
        handleNavigation({ detail: { sectionId: hash } });
      }, 500);
    }

    return () => window.removeEventListener('navigate-to-section', handleNavigation);
  }, [extractedData, scoringResults, activeStep]);

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
          documentType: key
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

      const gstTurnover = gst.turnover || 12400000;
      const gstCompliance = gst.compliance || 70;
      const upiFailRate = upi.failedTransactions || 1.2;
      const bankStability = bank.cashFlowStability || "High";
      const headcount = epfo.employees || 42;
      const txCount = upi.transactions || 18240;
      
      const newBhi: BusinessHealthIndex = {
        revenueQuality: Math.min(100, Math.max(20, Math.round((gstTurnover / 15000000) * 100))),
        cashFlowHealth: bankStability === "High" ? 85 : bankStability === "Medium" ? 65 : 45 + (bank.averageBalance ? Math.min(15, Math.round(bank.averageBalance / 50000)) : 10),
        complianceGovernance: gstCompliance,
        growthPotential: Math.min(100, Math.max(20, Math.round((((gst.growth || 18.0) + (epfo.employeeGrowth || 16.7)) / 40) * 100))),
        operationalStability: Math.min(100, Math.max(30, 60 + Math.round(headcount / 2))),
        businessNetworkStrength: Math.min(100, Math.max(30, 50 + Math.round(txCount / 500)))
      };

      let newRai: RiskAdjustmentIndex = {
        revenueVolatility: -2,
        customerConcentration: -2,
        supplierDependency: -1,
        failedTransactionRatio: Math.max(-5, Math.round(upiFailRate * -1)),
        debtStress: bank.emiBurden === "High" ? -5 : -1,
        fraudIndicators: 0
      };

      if (selectedProfile === "high") {
        newRai = { revenueVolatility: -5, customerConcentration: -4, supplierDependency: -4, failedTransactionRatio: -5, debtStress: -5, fraudIndicators: -2 };
      } else if (selectedProfile === "healthy") {
        newRai = { revenueVolatility: -1, customerConcentration: -1, supplierDependency: -1, failedTransactionRatio: -1, debtStress: -1, fraudIndicators: 0 };
      }

      const newDti: DataTrustIndex = {
        gstCompleteness: !!gst.turnover ? 100 : 0,
        upiContinuity: !!upi.transactions ? 100 : 0,
        bankStatementCoverage: !!bank.averageBalance ? 100 : 0,
        epfoConsistency: !!epfo.employees ? 100 : 0,
        dataVerificationStatus: 100
      };

      setBhi(newBhi);
      setRai(newRai);
      setDti(newDti);
      setAverageMonthlyInflow((gstTurnover / 12) * 0.8);

      setSimulatedCompliance(newBhi.complianceGovernance);
      setSimulatedCashFlow(newBhi.cashFlowHealth);
      setSimulatedGrowth(newBhi.growthPotential);
    }
  }, [extractedData, selectedProfile]);

  // Generate Credit Health Card
  const generateHealthCard = () => {
    const results = processHealthAssessment(bhi, rai, dti, averageMonthlyInflow);
    setScoringResults(results);

    // Seed the initial What-If simulator state
    setSimulatedScoreData({
      score: results.finalScore,
      limit: results.recommendedCreditExposure,
      status: results.businessHealth,
      product: results.recommendedProduct
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

    const simulatedBhi: BusinessHealthIndex = {
      ...bhi,
      complianceGovernance: simulatedCompliance,
      cashFlowHealth: simulatedCashFlow,
      growthPotential: simulatedGrowth
    };

    const simResults = processHealthAssessment(simulatedBhi, rai, dti, averageMonthlyInflow);

    setSimulatedScoreData({
      score: simResults.finalScore,
      limit: simResults.recommendedCreditExposure,
      status: simResults.businessHealth,
      product: simResults.recommendedProduct
    });

  }, [simulatedCompliance, simulatedCashFlow, simulatedGrowth, bhi, rai, dti, averageMonthlyInflow, scoringResults]);

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
    setAiSummary(null);
    setGstInsight("");
    setUpiInsight("");
    setBankInsight("");
    setEpfoInsight("");
  };

  // Radar Chart formatting
  const radarData = [
    { subject: "Business Activity", A: (scoringResults?.bhiScore || 0), fullMark: 100 },
    { subject: "Cash Flow", A: (scoringResults?.bhiScore || 0), fullMark: 100 },
    { subject: "Compliance", A: (scoringResults?.bhiScore || 0), fullMark: 100 },
    { subject: "Transaction Behaviour", A: (scoringResults?.bhiScore || 0), fullMark: 100 },
    { subject: "Stability", A: (scoringResults?.bhiScore || 0), fullMark: 100 },
    { subject: "Growth", A: (scoringResults?.bhiScore || 0), fullMark: 100 }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-[#EEF5F2] selection:text-[#00836C] relative">
      <Sidebar isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} isHealthCardGenerated={activeStep >= 3} />

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
              <h2 className="text-base sm:text-lg font-black text-[#000] tracking-tight leading-none uppercase">
                MSME Financial Health Card
              </h2>
              <p className="text-[10px] sm:text-xs text-[#444] font-bold uppercase tracking-wider mt-0.5 sm:mt-1">
                AI/ML-Driven MSME Financial Health Scoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile / Institution badge */}
            <div className="flex items-center gap-2">
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

        {/* ─── Workflow Content Stepper Progress Tracker ─── */}
        <div className="bg-white border-b border-border/80 px-4 py-4 sm:px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${activeStep >= 1 ? "bg-[#00836C] text-white" : "bg-slate-200 text-slate-500"
                }`}>1</span>
              <span className={`text-xs sm:text-sm font-bold ${activeStep >= 1 ? "text-slate-800" : "text-slate-400"}`}>Upload Documents</span>
            </div>
            <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-slate-200 relative">
              <div className={`absolute top-0 left-0 h-full bg-[#00836C] transition-all duration-300 ${activeStep > 1 ? "w-full" : "w-0"
                }`} />
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${activeStep >= 2 ? "bg-[#00836C] text-white" : "bg-slate-200 text-slate-500"
                }`}>2</span>
              <span className={`text-xs sm:text-sm font-bold ${activeStep >= 2 ? "text-slate-800" : "text-slate-400"}`}>Review Extracted Data</span>
            </div>
            <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-slate-200 relative">
              <div className={`absolute top-0 left-0 h-full bg-[#00836C] transition-all duration-300 ${activeStep > 2 ? "w-full" : "w-0"
                }`} />
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${activeStep >= 3 ? "bg-[#00836C] text-white" : "bg-slate-200 text-slate-500"
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
                AI/ML-Driven MSME Financial Health Card
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                Aggregate alternate data (GST, UPI, EPFO, AA) to compute a multidimensional financial health score, visualize strengths and risks, and enable real-time credit assessment.
              </p>
            </div>

            {/* ================================================
                STEP 1: UPLOAD DOCUMENTS
                ================================================ */}
            <section id="documents" className={`transition-all duration-300 ${activeStep !== 1 ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
                <div className="bg-[#EEF5F2] border-b border-border/80 px-6 py-4 flex items-center justify-between">
                  <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                    <Upload className="h-4 w-4" /> STEP 1: AGGREGATE ALTERNATE DATA
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
                          className={`relative border rounded-md p-4 transition-all duration-150 flex flex-col justify-between h-[180px] group ${file
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
                      Or Load Demo MSME Alternate Data
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
                          className={`flex flex-col text-left p-3.5 border border-slate-200 rounded-md transition-all cursor-pointer ${item.color} ${selectedProfile === item.key ? "ring-2 ring-[#00836C] bg-[#EEF5F2]/30 border-[#00836C]" : "bg-white"
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
              <section id="data-overview" className={`transition-all duration-300 ${activeStep !== 2 ? "opacity-40 pointer-events-none" : ""}`}>
                <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
                  <div className="bg-[#EEF5F2] border-b border-border/80 px-6 py-4 flex items-center justify-between">
                    <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                      <ShieldCheck className="h-4 w-4" /> STEP 2: REVIEW MULTIDIMENSIONAL FINANCIAL PARAMETERS
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
                        <div id="business-profile" className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-3.5 border border-slate-200/80 rounded-md">
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
                                {gstInsight && (
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-start gap-1">
                                    <Sparkles className="h-3 w-3 text-idbi-gold mt-0.5 flex-shrink-0" />
                                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed italic">"{gstInsight}"</p>
                                  </div>
                                )}
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
                                {upiInsight && (
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-start gap-1">
                                    <Sparkles className="h-3 w-3 text-idbi-gold mt-0.5 flex-shrink-0" />
                                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed italic">"{upiInsight}"</p>
                                  </div>
                                )}
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
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${extractedData.bank?.emiBurden === "Low" ? "bg-[#EEF5F2] text-[#00836C]" : "bg-red-50 text-[#DC2626]"
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
                                {bankInsight && (
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-start gap-1">
                                    <Sparkles className="h-3 w-3 text-idbi-gold mt-0.5 flex-shrink-0" />
                                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed italic">"{bankInsight}"</p>
                                  </div>
                                )}
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
                                {epfoInsight && (
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-start gap-1">
                                    <Sparkles className="h-3 w-3 text-idbi-gold mt-0.5 flex-shrink-0" />
                                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed italic">"{epfoInsight}"</p>
                                  </div>
                                )}
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
                          <ShieldCheck className="h-4 w-4 text-[#F4B400]" /> STEP 3: MULTIDIMENSIONAL FINANCIAL HEALTH SCORE
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                          AI/ML-DRIVEN AUDIT RECORD
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
                          <span className="text-[11px] text-[#EEF5F2]/70 font-bold uppercase tracking-widest mb-3">Financial Health Score</span>
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
                                strokeDashoffset={364 - (364 * scoringResults.finalScore) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                              <span className="text-4xl font-black text-white leading-none tracking-tight">{Math.round(scoringResults.finalScore)}</span>
                              <span className="text-[10px] text-[#EEF5F2]/80 font-bold uppercase tracking-wider mt-1">Health Score</span>
                            </div>
                          </div>
                          <span className="mt-3 px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold border border-white/15">
                            {scoringResults.businessHealth}
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

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-6">
                            <div>
                              <span className="text-[10px] text-[#EEF5F2]/60 font-bold uppercase tracking-wider leading-none">Financial Health Score</span>
                              <p className="text-2xl font-black tracking-tight text-[#F4B400] mt-1">
                                {Math.round(scoringResults.finalScore)} <span className="text-xs text-white/50 font-medium">/100</span>
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#EEF5F2]/60 font-bold uppercase tracking-wider leading-none">Business Health</span>
                              <div className="mt-1">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 w-fit ${scoringResults.businessHealth === 'Excellent Business Health' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                  scoringResults.businessHealth === 'Healthy Business' ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' :
                                    scoringResults.businessHealth === 'Growth Ready' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                                      scoringResults.businessHealth === 'Moderate Risk' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                        'bg-red-500/20 text-red-300 border-red-500/40'
                                  }`}>
                                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: scoringResults.healthColor }} />
                                  {scoringResults.businessHealth}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#EEF5F2]/60 font-bold uppercase tracking-wider leading-none">Probability of Default (PD)</span>
                              <p className="text-2xl font-black tracking-tight text-white mt-1">
                                {scoringResults.probabilityOfDefault}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#EEF5F2]/60 font-bold uppercase tracking-wider leading-none">Portfolio Segment</span>
                              <p className="text-sm font-extrabold text-white mt-1.5 uppercase tracking-wide">
                                {scoringResults.portfolioSegment}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#EEF5F2]/60 font-bold uppercase tracking-wider leading-none">Recommended Product</span>
                              <p className="text-sm font-extrabold text-[#F4B400] mt-1.5 uppercase tracking-wide flex items-center gap-1">
                                <Sparkles className="h-3.5 w-3.5" /> {scoringResults.recommendedProduct}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#EEF5F2]/60 font-bold uppercase tracking-wider leading-none">Recommended Credit Exposure</span>
                              <p className="text-2xl font-black tracking-tight text-white mt-1">
                                {scoringResults.recommendedCreditExposure}
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


                {/* ─── FINANCIAL INCLUSION ASSESSMENT ─── */}
                {inclusionAssessment && (
                <section className="bg-white rounded-md border border-border shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                      <Users className="h-4 w-4 text-[#F4B400]" /> Financial Inclusion Assessment
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-indigo-50 text-indigo-600 border border-indigo-200">
                      {inclusionAssessment.inclusionBadge}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Traditional Credit History</span>
                      <span className="text-xs font-bold text-[#DC2626] mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {inclusionAssessment.traditionalCreditHistory}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Alternate Data Assessment</span>
                      <span className="text-xs font-bold text-[#16A34A] mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {inclusionAssessment.alternateDataAssessment}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Credit Visibility</span>
                      <span className="text-xs font-bold text-[#16A34A] mt-1 flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {inclusionAssessment.creditVisibility}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Assessment Method</span>
                      <span className="text-xs font-bold text-slate-800 mt-1">{inclusionAssessment.assessmentMethod}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded text-[10px] text-indigo-700 font-semibold leading-normal flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>This MSME has no traditional bureau credit history. Credit visibility has been enabled through alternate data assessment under IDBI Bank&apos;s financial inclusion framework.</span>
                  </div>
                </section>
                )}

                {/* ─── CREDIT DECISION FACTORS SECTION ─── */}
                <section id="strengths-risks" className="bg-white rounded-md border border-border shadow-sm overflow-hidden p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                      <Sliders className="h-4 w-4 text-[#F4B400]" /> Credit Decision Factors
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 text-slate-400 inline-flex items-center justify-center font-serif text-[9px] cursor-help font-bold" title="Score is generated using alternate financial data from GST, UPI, Banking and Employment records.">
                        i
                      </span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Contribution Analytics
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Positive Drivers Card */}
                    <div className="bg-[#EEF5F2]/50 border border-emerald-100 rounded-md p-4 space-y-3.5">
                      <h4 className="text-xs font-bold text-[#16A34A] uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-[#16A34A] stroke-[3px]" /> Positive Drivers (BHI)
                      </h4>

                      <div className="space-y-2.5">
                        {scoringResults.explainability.bhiBreakdown.map((d: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                            <span>{d.label}</span>
                            <span className="text-[#16A34A] font-extrabold">+{d.score.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Negative Risk Deductions Card */}
                    <div className="bg-red-50/30 border border-rose-100 rounded-md p-4 space-y-3.5">
                      <h4 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-[#DC2626]" /> Negative Risk Deductions (RAI)
                      </h4>

                      <div className="space-y-2.5">
                        {scoringResults.explainability.raiBreakdown.map((d: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                            <span>{d.label}</span>
                            <span className="text-[#DC2626] font-extrabold">{d.score.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Waterfall Stacked Visual Bar */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>Base Health Index: {scoringResults.bhiScore.toFixed(1)}</span>
                      <span>Risk Penalties: {scoringResults.raiScore.toFixed(1)}</span>
                      <span>Final Score: {Math.round(scoringResults.finalScore)} / 100</span>
                    </div>

                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex shadow-inner border border-slate-200/50">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${scoringResults.finalScore}%` }}
                        title={`Final Score: ${Math.round(scoringResults.finalScore)}`}
                      />
                      <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${Math.abs(scoringResults.raiScore)}%` }}
                        title={`Risk Deductions: ${scoringResults.raiScore.toFixed(1)}`}
                      />
                    </div>

                    <div className="flex justify-center text-[10px] text-slate-400 font-extrabold uppercase pt-1 gap-4">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Net Health Score
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Risk Deductions
                      </div>
                    </div>
                  </div>
                </section>

                {/* ─── IMPROVEMENT RECOMMENDATIONS SECTION ─── */}
                <section id="recommendations" className="bg-white rounded-md border border-border shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                      <TrendingUp className="h-4 w-4 text-[#F4B400]" /> Visualized Strengths & Actionable Insights
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Targeted Actions
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scoringResults.explainability.improvementRecommendations.map((rec: any, i: number) => (
                      <div key={i} className="border border-blue-100 bg-blue-50/30 rounded p-4 flex gap-4">
                        <div className="mt-1 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {i+1}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">{rec.label}</h4>
                          <p className="text-xs text-slate-600 mt-1 mb-2">{rec.description}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                              Score +{rec.expectedScoreImprovement}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                              Limit {rec.expectedCreditLimitImprovement}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>


                {/* ─── PORTFOLIO IMPACT ASSESSMENT ─── */}
                {portfolioImpact && (
                <section className="bg-white rounded-md border border-border shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                      <BarChart3 className="h-4 w-4 text-[#F4B400]" /> Portfolio Impact Assessment
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Credit Risk Analytics
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded p-4 text-center">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Probability of Default</span>
                      <span className="text-2xl font-black mt-1" style={{ color: portfolioImpact.impactColor }}>{portfolioImpact.pdDisplay}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded p-4 text-center">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Risk Band</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">{portfolioImpact.riskBand}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded p-4 text-center">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Portfolio Segment</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">{portfolioImpact.portfolioSegment}</span>
                    </div>
                    <div className="border-2 rounded p-4 text-center" style={{ borderColor: portfolioImpact.impactColor + '40', backgroundColor: portfolioImpact.impactColor + '08' }}>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Expected Portfolio Impact</span>
                      <span className="text-xs font-black mt-1 block" style={{ color: portfolioImpact.impactColor }}>{portfolioImpact.expectedPortfolioImpact}</span>
                    </div>
                  </div>
                </section>
                )}

                {/* ─── FRAUD INTELLIGENCE SENTINEL ─── */}
                {fraudIntelligence && (
                <section className="bg-white rounded-md border border-border shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                      <Shield className="h-4 w-4 text-[#F4B400]" /> Fraud Intelligence Sentinel
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                      fraudIntelligence.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      fraudIntelligence.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      fraudIntelligence.riskLevel === 'High' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                      'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      Threat Level: {fraudIntelligence.riskLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Passed Checks */}
                    <div className="bg-[#EEF5F2]/30 border border-emerald-100 rounded-md p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-[#16A34A] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Integrity Checks Passed ({fraudIntelligence.passedChecks.length})
                      </h4>
                      <div className="space-y-1.5">
                        {fraudIntelligence.passedChecks.map((check: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <Check className="h-3 w-3 text-[#16A34A] stroke-[3px] flex-shrink-0" />
                            <span>{check}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Anomalies */}
                    <div className={`border rounded-md p-4 space-y-2.5 ${fraudIntelligence.anomalies.length > 0 ? 'bg-red-50/30 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
                      <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${fraudIntelligence.anomalies.length > 0 ? 'text-[#DC2626]' : 'text-slate-500'}`}>
                        <AlertTriangle className="h-4 w-4" /> Flagged Anomalies ({fraudIntelligence.anomalies.length})
                      </h4>
                      <div className="space-y-2">
                        {fraudIntelligence.anomalies.length === 0 ? (
                          <p className="text-xs text-slate-500 font-semibold">No anomalies detected. All cross-references clear.</p>
                        ) : (
                          fraudIntelligence.anomalies.map((anomaly: any, i: number) => (
                            <div key={i} className="bg-white border border-rose-100 rounded p-2.5 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">{anomaly.type}</span>
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  anomaly.severity === 'High' ? 'bg-red-100 text-red-700' :
                                  anomaly.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                }`}>{anomaly.severity}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">{anomaly.description}</p>
                              <span className="text-[9px] text-slate-400 font-bold">Source: {anomaly.dataSource}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fraud Risk Score Bar */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                      <span>Fraud Risk Score</span>
                      <span>{fraudIntelligence.overallRiskScore}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          fraudIntelligence.overallRiskScore < 15 ? 'bg-emerald-500' :
                          fraudIntelligence.overallRiskScore < 40 ? 'bg-amber-500' :
                          fraudIntelligence.overallRiskScore < 70 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${fraudIntelligence.overallRiskScore}%` }}
                      />
                    </div>
                  </div>
                </section>
                )}

                {/* ─── CASHFLOW RUNWAY PREDICTOR ─── */}
                {cashflowRunway && (
                <section className="bg-white rounded-md border border-border shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                      <Fuel className="h-4 w-4 text-[#F4B400]" /> Cashflow Runway Predictor
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                      cashflowRunway.runwayMonths >= 6 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      cashflowRunway.runwayMonths >= 3 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {cashflowRunway.healthStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Monthly Burn Rate</span>
                      <span className="text-base font-black text-slate-800 mt-1">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(cashflowRunway.currentMonthlyBurn)}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Current Reserves</span>
                      <span className="text-base font-black text-slate-800 mt-1">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(cashflowRunway.currentReserves)}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Burn Trend</span>
                      <span className={`text-xs font-bold mt-1 flex items-center gap-1 ${cashflowRunway.burnTrend === 'Decreasing' ? 'text-emerald-600' : cashflowRunway.burnTrend === 'Stable' ? 'text-blue-600' : 'text-amber-600'}`}>
                        <TrendingUp className="h-3 w-3" /> {cashflowRunway.burnTrend}
                      </span>
                    </div>
                    <div className="bg-[#EEF5F2]/30 border-2 border-emerald-200 rounded p-3">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">With Credit Facility</span>
                      <span className="text-base font-black text-[#00836C] mt-1">{cashflowRunway.projectedRunwayMonths} months</span>
                    </div>
                  </div>

                  {/* Runway Comparison Visual */}
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>Without Credit</span>
                        <span>{cashflowRunway.runwayMonths} months</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${cashflowRunway.runwayMonths >= 6 ? 'bg-emerald-500' : cashflowRunway.runwayMonths >= 3 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, (cashflowRunway.runwayMonths / 24) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-[#00836C]">
                        <span>With IDBI Credit Facility</span>
                        <span>{cashflowRunway.projectedRunwayMonths} months</span>
                      </div>
                      <div className="w-full bg-[#EEF5F2] h-3 rounded-full overflow-hidden border border-emerald-200/50">
                        <div
                          className="h-full rounded-full bg-[#00836C] transition-all duration-700"
                          style={{ width: `${Math.min(100, (cashflowRunway.projectedRunwayMonths / 36) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </section>
                )}

                {/* ─── AI UNDERWRITER SUMMARY CARD ─── */}
                <section className="bg-white rounded-md border border-border shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                      <Sparkles className="h-4 w-4 text-[#F4B400]" /> AI Underwriter Summary
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-[#EEF5F2] text-[#00836C] border border-[#00836C]/25">
                      Generated by Gemini AI
                    </span>
                  </div>

                  {aiSummaryLoading ? (
                    <div className="py-6 space-y-3.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#00836C] animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-[#00836C] animate-ping" />
                        Gemini AI Underwriter compiling profile analysis...
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-[95%]" />
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-[80%]" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-slate-700 leading-relaxed font-sans bg-[#F8FAF9] border border-slate-200/60 p-4 rounded-md">
                      {aiSummary || "Underwriting analysis compilation pending..."}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-semibold uppercase">
                    <div>Generated At: <span className="text-slate-600 font-bold">{aiSummaryTimestamp || "Pending..."}</span></div>
                    <div>Assessment Version: <span className="text-slate-600 font-bold">{aiSummaryVersion}</span></div>
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
                          {scoringResults.explainability && scoringResults.explainability.bhiBreakdown.length > 0 ? (
                            scoringResults.explainability.bhiBreakdown.map((strength: any, index: number) => (
                              <div key={index} className="flex items-start gap-2.5">
                                <span className="p-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] mt-0.5">
                                  <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                </span>
                                <span className="text-sm font-semibold text-slate-700 leading-snug">{strength.label || strength}</span>
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
                            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" /> STEP 4B: FINANCIAL RISK DRIVERS
                          </h3>
                        </div>
                        <div className="p-6 space-y-4">
                          {selectedProfile === "high" || scoringResults?.raiScore <= -15 ? (
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
                        <TrendingUp className="h-4 w-4" /> STEP 5: MULTIDIMENSIONAL HEALTH DIMENSIONS OVERVIEW
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
                            { name: "Business Activity", val: (scoringResults?.bhiScore || 0), desc: "Evaluates invoice volumes and gross trade activity" },
                            { name: "Cash Flow Stability", val: (scoringResults?.bhiScore || 0), desc: "Monitors daily account balances & leverage load" },
                            { name: "GST Compliance", val: (scoringResults?.bhiScore || 0), desc: "Tracks GSTR-1 and GSTR-3B filings cycle compliance" }
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
                  <section id="credit-limit">
                    <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
                      <div className="bg-[#EEF5F2] border-b border-border/80 px-6 py-4">
                        <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                          <Sliders className="h-4 w-4 text-[#F4B400]" /> STEP 6: FINANCIAL HEALTH SCORE OPTIMIZATION & WHAT-IF SIMULATOR
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
                                <span className="text-xs font-bold text-slate-700">Financial Health Score:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 text-xs font-bold font-mono">
                                    {Math.round(scoringResults.finalScore)}
                                  </span>
                                  <span className="text-slate-400 text-xs">→</span>
                                  <span className="text-base font-black text-[#00836C] flex items-center">
                                    {Math.round(simulatedScoreData.score)}
                                    {simulatedScoreData.score > scoringResults.finalScore && (
                                      <span className="text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/10 px-1.5 py-0.5 rounded-full ml-1.5">
                                        +{Math.round(simulatedScoreData.score - scoringResults.finalScore)}
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
                                    {scoringResults.recommendedCreditExposure}
                                  </span>
                                  <span className="text-slate-400 text-xs">→</span>
                                  <span className="text-base font-black text-[#00836C] flex items-center">
                                    {simulatedScoreData.limit}
                                    {simulatedScoreData.limit !== scoringResults.recommendedCreditExposure && (
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

                {/* ─── ECOSYSTEM INTEGRATION READINESS SECTION ─── */}
                <section className="bg-white rounded-md border border-border shadow-sm overflow-hidden p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                      <TrendingUp className="h-4 w-4 text-[#F4B400]" /> Ecosystem Integration Readiness
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Platform Compatibility
                    </span>
                  </div>

                  {/* Three ecosystem readiness cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-emerald-100 bg-[#EEF5F2]/20 rounded-md p-4 space-y-2 relative">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4.5 w-4.5 text-[#16A34A] flex-shrink-0" />
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          Account Aggregator Ready
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        Supports consent-based financial data retrieval and financial information sharing.
                      </p>
                    </div>

                    <div className="border border-emerald-100 bg-[#EEF5F2]/20 rounded-md p-4 space-y-2 relative">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4.5 w-4.5 text-[#16A34A] flex-shrink-0" />
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          OCEN Compatible
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        Supports embedded lending workflows and digital loan journey orchestration.
                      </p>
                    </div>

                    <div className="border border-emerald-100 bg-[#EEF5F2]/20 rounded-md p-4 space-y-2 relative">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4.5 w-4.5 text-[#16A34A] flex-shrink-0" />
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          ULI Ready
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        Supports interoperability with digital credit infrastructure and future ecosystem integrations.
                      </p>
                    </div>
                  </div>

                  {/* Architecture Visualization Flowchart */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-md p-5 space-y-4">
                    <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-wider text-center">
                      Integration Architecture Flow
                    </h4>

                    <div className="flex flex-col items-center gap-2.5 max-w-lg mx-auto text-center font-sans text-xs">
                      {/* Row 1: Source Documents */}
                      <div className="grid grid-cols-4 gap-2 w-full">
                        {["GST", "UPI", "Bank Statements", "EPFO"].map((source) => (
                          <div key={source} className="bg-white border border-slate-200 py-1.5 px-1 rounded font-bold text-slate-700 shadow-sm text-[10px] truncate">
                            {source}
                          </div>
                        ))}
                      </div>

                      <div className="text-slate-400 font-bold">&darr;</div>

                      {/* Row 2: Health Engine */}
                      <div className="bg-[#00836C] text-white border border-[#00836C] py-2 px-6 rounded-md font-extrabold w-full shadow-sm">
                        MSME Financial Health Engine
                      </div>

                      <div className="text-[#00836C] font-bold">&darr;</div>

                      {/* Row 3: Account Aggregator */}
                      <div className="bg-white border border-[#00836C] text-[#00836C] py-2 px-6 rounded-md font-extrabold w-full shadow-sm">
                        Account Aggregator Layer
                      </div>

                      <div className="text-[#00836C] font-bold">&darr;</div>

                      {/* Row 4: OCEN */}
                      <div className="bg-white border border-[#2563EB] text-[#2563EB] py-2 px-6 rounded-md font-extrabold w-full shadow-sm">
                        OCEN Lending Ecosystem
                      </div>

                      <div className="text-[#2563EB] font-bold">&darr;</div>

                      {/* Row 5: Recommendation Engine */}
                      <div className="bg-[#00614F] text-white border border-[#00614F] py-2 px-6 rounded-md font-black w-full shadow-sm uppercase tracking-wide">
                        Credit Recommendation Engine
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded text-[10px] text-amber-800 font-medium leading-relaxed flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Prototype demonstrates ecosystem compatibility and integration readiness. Live integrations require regulatory approvals, onboarding processes and production-grade APIs.
                    </span>
                  </div>
                </section>

              </div>
            )}

            {/* ─── INTERACTIVE UNDERWRITING ACTIVITY LOG ─── */}
            <section id="activity-log" className="bg-white rounded-md border border-border shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-[#00614F] flex items-center gap-2 text-sm sm:text-base">
                  <History className="h-4 w-4 text-[#F4B400]" /> Underwriting Activity Log & Audit Trail
                </h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Real-time System Logs
                </span>
              </div>

              <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4 py-2">
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#00836C] border-2 border-white" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">System Initialized</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">14:06:26</span>
                    <p className="text-slate-500 mt-0.5 font-semibold">MSME credit scoring engine and data parsing adapters loaded successfully.</p>
                  </div>
                </div>

                {Object.keys(uploadedFiles).length > 0 && (
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#00836C] border-2 border-white" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800">Documents Staged for Parsing</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">14:08:12</span>
                      <p className="text-slate-500 mt-0.5 font-semibold">Staged {Object.keys(uploadedFiles).length} files: {Object.values(uploadedFiles).map(f => f.name).join(", ")}</p>
                    </div>
                  </div>
                )}

                {Object.keys(extractedData).length > 0 && (
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#00836C] border-2 border-white" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800">Alternate Data Extracted</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">14:09:45</span>
                      <p className="text-slate-500 mt-0.5 font-semibold">Parsed GST, UPI, Bank, and EPFO logs for {extractedCompany || "MSME Entity"}.</p>
                    </div>
                  </div>
                )}

                {scoringResults && (
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#00836C] border-2 border-white animate-pulse" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800">Credit Score Computed</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">14:10:02</span>
                      <p className="text-slate-500 mt-0.5 font-semibold">Calculated final credit health score of {Math.round(scoringResults.finalScore)}/100. Recommended credit limit computed as {scoringResults.recommendedCreditExposure}.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

      {/* ─── CHAT DRAWER PANEL ─── */}
      {isChatOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40" onClick={() => setIsChatOpen(false)} />
          
          {/* Drawer container */}
          <aside className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-all duration-300 transform translate-x-0 font-sans">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#EEF5F2]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#F4B400] animate-pulse" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">IDBI Credit AI Assistant</h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    {extractedCompany ? `${extractedCompany} Active Context` : "General Underwriting mode"}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {/* Default Welcome Message */}
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#00836C] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  AI
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 shadow-xs max-w-[85%] leading-relaxed">
                  <p className="font-bold text-[#00614F] mb-1">Welcome Assessor!</p>
                  I am seeded with the alternate ledger data. You can ask me custom questions about this business's financials or review the FAQs below:
                </div>
              </div>

              {/* Chat history mapping */}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && (
                    <div className="w-6 h-6 rounded-full bg-[#00836C] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      AI
                    </div>
                  )}
                  <div className={`rounded-lg p-3 text-xs shadow-xs max-w-[85%] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#00836C] text-white' 
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}>
                    {msg.content.split('\n').map((para, i) => (
                      <p key={i} className={i > 0 ? "mt-1.5" : ""}>{para}</p>
                    ))}
                  </div>
                </div>
              ))}

              {/* Chat loading state */}
              {chatLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-[#00836C] text-white flex items-center justify-center font-bold text-[10px] shrink-0 animate-pulse">
                    AI
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-400 shadow-xs max-w-[85%] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={chatBottomRef} />
            </div>

            {/* Prepopulated Underwriting FAQs */}
            <div className="p-3 bg-white border-t border-slate-100 space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Underwriting FAQs</span>
              <div className="flex flex-wrap gap-1.5">
                <button 
                  onClick={() => submitChatPrompt("Why is the Financial Health Score calculated at this level?")}
                  className="px-2 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer text-left font-medium"
                >
                  Score Derivation
                </button>
                <button 
                  onClick={() => submitChatPrompt("How can this MSME optimize their score?")}
                  className="px-2 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer text-left font-medium"
                >
                  Score Optimization
                </button>
                <button 
                  onClick={() => submitChatPrompt("Explain the risk deductions applied to this business.")}
                  className="px-2 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer text-left font-medium"
                >
                  Risk Penalties
                </button>
                <button 
                  onClick={() => submitChatPrompt("What are the criteria for the credit limit recommended?")}
                  className="px-2 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer text-left font-medium"
                >
                  Exposure Limit
                </button>
              </div>
            </div>

            {/* Input Form Footer */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) submitChatPrompt(chatInput);
              }}
              className="p-3 border-t border-slate-100 flex gap-2 bg-white"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask underwriting assistant..."
                disabled={chatLoading}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-[#00836C] disabled:bg-slate-50 disabled:text-slate-400"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-[#00836C] hover:bg-[#00614F] disabled:bg-slate-100 disabled:text-slate-300 text-white text-xs font-bold rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </aside>
        </>
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
