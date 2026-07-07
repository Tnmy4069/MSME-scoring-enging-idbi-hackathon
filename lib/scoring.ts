import { 
  BusinessHealthIndex, 
  RiskAdjustmentIndex, 
  DataTrustIndex,
  HealthResult,
  ExplainabilityComponent,
  ImprovementRecommendation,
  PortfolioImpactAssessment,
  FinancialInclusionAssessment,
  FraudIntelligence,
  FraudAnomaly,
  CashflowRunway,
  UnderwritingDecision
} from "./types";

export function calculateBHI(bhi: BusinessHealthIndex) {
  const breakdown: ExplainabilityComponent[] = [
    { label: 'Revenue Quality', score: (bhi.revenueQuality * 0.20), maxPoints: 20, raw: bhi.revenueQuality },
    { label: 'Cash Flow Health', score: (bhi.cashFlowHealth * 0.25), maxPoints: 25, raw: bhi.cashFlowHealth },
    { label: 'Compliance & Governance', score: (bhi.complianceGovernance * 0.15), maxPoints: 15, raw: bhi.complianceGovernance },
    { label: 'Growth Potential', score: (bhi.growthPotential * 0.15), maxPoints: 15, raw: bhi.growthPotential },
    { label: 'Operational Stability', score: (bhi.operationalStability * 0.15), maxPoints: 15, raw: bhi.operationalStability },
    { label: 'Business Network Strength', score: (bhi.businessNetworkStrength * 0.10), maxPoints: 10, raw: bhi.businessNetworkStrength },
  ];
  const score = breakdown.reduce((sum, item) => sum + item.score, 0);
  return { score: Number(score.toFixed(2)), breakdown };
}

export function calculateRAI(rai: RiskAdjustmentIndex) {
  const breakdown: ExplainabilityComponent[] = [
    { label: 'Revenue Volatility', score: Math.min(0, Math.max(-5, rai.revenueVolatility)), maxPoints: -5, raw: rai.revenueVolatility },
    { label: 'Customer Concentration', score: Math.min(0, Math.max(-5, rai.customerConcentration)), maxPoints: -5, raw: rai.customerConcentration },
    { label: 'Supplier Dependency', score: Math.min(0, Math.max(-5, rai.supplierDependency)), maxPoints: -5, raw: rai.supplierDependency },
    { label: 'Failed Transaction Ratio', score: Math.min(0, Math.max(-5, rai.failedTransactionRatio)), maxPoints: -5, raw: rai.failedTransactionRatio },
    { label: 'Debt Stress', score: Math.min(0, Math.max(-5, rai.debtStress)), maxPoints: -5, raw: rai.debtStress },
    { label: 'Fraud Indicators', score: Math.min(0, Math.max(-5, rai.fraudIndicators)), maxPoints: -5, raw: rai.fraudIndicators },
  ];
  const score = breakdown.reduce((sum, item) => sum + item.score, 0);
  return { score: Number(score.toFixed(2)), breakdown };
}

export function calculateDTI(dti: DataTrustIndex) {
  const breakdown: ExplainabilityComponent[] = [
    { label: 'GST Completeness', score: (dti.gstCompleteness * 0.20), maxPoints: 20, raw: dti.gstCompleteness },
    { label: 'UPI Continuity', score: (dti.upiContinuity * 0.20), maxPoints: 20, raw: dti.upiContinuity },
    { label: 'Bank Statement Coverage', score: (dti.bankStatementCoverage * 0.20), maxPoints: 20, raw: dti.bankStatementCoverage },
    { label: 'EPFO Consistency', score: (dti.epfoConsistency * 0.20), maxPoints: 20, raw: dti.epfoConsistency },
    { label: 'Data Verification Status', score: (dti.dataVerificationStatus * 0.20), maxPoints: 20, raw: dti.dataVerificationStatus },
  ];
  const score = breakdown.reduce((sum, item) => sum + item.score, 0);
  return { score: Number(score.toFixed(2)), breakdown };
}

export function getBusinessHealthClassification(score: number): string {
  if (score >= 90) return 'Excellent Business Health';
  if (score >= 75) return 'Growth Ready';
  if (score >= 60) return 'Healthy Business';
  if (score >= 40) return 'Moderate Risk';
  return 'High Risk';
}

export function getHealthColor(score: number): string {
  if (score >= 90) return '#10B981'; // emerald-500
  if (score >= 75) return '#3B82F6'; // blue-500
  if (score >= 60) return '#14B8A6'; // teal-500
  if (score >= 40) return '#F59E0B'; // amber-500
  return '#EF4444'; // red-500
}

export function getPortfolioSegment(score: number): string {
  if (score >= 80) return 'Prime MSME';
  if (score >= 60) return 'Emerging MSME';
  if (score >= 40) return 'Standard Portfolio';
  return 'High Risk Portfolio';
}

export function getRecommendedProduct(score: number): string {
  if (score >= 90) return 'Prime Business Loan / Overdraft';
  if (score >= 75) return 'Prime Working Capital Loan';
  if (score >= 60) return 'Working Capital Loan';
  if (score >= 40) return 'Business Term Loan';
  return 'Micro Business Loan (Review)';
}

export function getProbabilityOfDefault(score: number): string {
  if (score >= 90) return `${(1.2 - (score - 90) * 0.07).toFixed(1)}%`;
  if (score >= 75) return `${(2.5 - (score - 75) * 0.08).toFixed(1)}%`;
  if (score >= 60) return `${(4.5 - (score - 60) * 0.13).toFixed(1)}%`;
  if (score >= 40) return `${(7.5 - (score - 40) * 0.15).toFixed(1)}%`;
  return `${Math.min(25.0, 7.6 + (40 - score) * 0.4).toFixed(1)}%`;
}

// Dynamic Credit Limit Engine
export function calculateDynamicCreditLimit(
  averageMonthlyInflow: number,
  cashFlowStability: number,
  riskMultiplier: number,
  repaymentCapacity: number
): string {
  // Formula: Average Monthly Inflow * 12 * (CashFlowStability / 100) * (RepaymentCapacity / 100) * (RiskMultiplier)
  const baseAnnualInflow = averageMonthlyInflow * 12;
  const cfFactor = cashFlowStability / 100;
  const rcFactor = repaymentCapacity / 100;
  
  let rawLimit = baseAnnualInflow * cfFactor * rcFactor * riskMultiplier;
  
  if (rawLimit < 50000) return 'Manual Review Required';
  
  // Round to nearest 50,000
  const roundedLimit = Math.round(rawLimit / 50000) * 50000;
  
  // Format to Indian Rupee (₹XX,XX,XXX)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(roundedLimit);
}

export function generateImprovementRecommendations(
  bhiBreakdown: ExplainabilityComponent[],
  raiBreakdown: ExplainabilityComponent[]
): ImprovementRecommendation[] {
  const recommendations: ImprovementRecommendation[] = [];

  const weakBhi = [...bhiBreakdown].sort((a, b) => (a.score / a.maxPoints) - (b.score / b.maxPoints))[0];
  if (weakBhi && (weakBhi.score / weakBhi.maxPoints) < 0.7) {
    recommendations.push({
      label: `Improve ${weakBhi.label}`,
      expectedScoreImprovement: Math.round(weakBhi.maxPoints - weakBhi.score),
      expectedCreditLimitImprovement: '+15%',
      description: `Optimizing ${weakBhi.label.toLowerCase()} can significantly raise your base Health Index.`
    });
  }

  const highestRisk = [...raiBreakdown].sort((a, b) => a.score - b.score)[0];
  if (highestRisk && highestRisk.score < -1) {
    recommendations.push({
      label: `Mitigate ${highestRisk.label}`,
      expectedScoreImprovement: Math.abs(Math.round(highestRisk.score)),
      expectedCreditLimitImprovement: '+10%',
      description: `Reducing ${highestRisk.label.toLowerCase()} will lower your risk deductions.`
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      label: 'Maintain Consistent Growth',
      expectedScoreImprovement: 2,
      expectedCreditLimitImprovement: '+5%',
      description: 'Your metrics are highly optimal. Maintain current trajectory.'
    });
  }

  return recommendations;
}

export function processHealthAssessment(
  bhi: BusinessHealthIndex,
  rai: RiskAdjustmentIndex,
  dti: DataTrustIndex,
  averageMonthlyInflow: number
): HealthResult {
  const bhiResult = calculateBHI(bhi);
  const raiResult = calculateRAI(rai);
  const dtiResult = calculateDTI(dti);

  const finalScore = Math.max(0, Math.min(100, bhiResult.score + raiResult.score));

  // Compute multipliers for credit limit
  const riskMultiplier = Math.max(0.1, (100 + raiResult.score) / 100);
  const recommendedCreditExposure = calculateDynamicCreditLimit(
    averageMonthlyInflow,
    bhi.cashFlowHealth, // Use as stability proxy
    riskMultiplier,
    bhi.revenueQuality // Use as repayment capacity proxy
  );

  return {
    bhiScore: bhiResult.score,
    raiScore: raiResult.score,
    dtiScore: dtiResult.score,
    finalScore: finalScore,

    businessHealth: getBusinessHealthClassification(finalScore),
    probabilityOfDefault: getProbabilityOfDefault(finalScore),
    portfolioSegment: getPortfolioSegment(finalScore),
    recommendedProduct: getRecommendedProduct(finalScore),
    recommendedCreditExposure,
    healthColor: getHealthColor(finalScore),

    explainability: {
      bhiBreakdown: bhiResult.breakdown,
      raiBreakdown: raiResult.breakdown,
      dtiBreakdown: dtiResult.breakdown,
      improvementRecommendations: generateImprovementRecommendations(bhiResult.breakdown, raiResult.breakdown)
    }
  };
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: PORTFOLIO IMPACT & PD ENGINE
// ═══════════════════════════════════════════════════════════

export function calculatePortfolioImpact(finalScore: number): PortfolioImpactAssessment {
  let pd: number;
  let riskBand: string;

  if (finalScore >= 90) {
    pd = 1.0 + (100 - finalScore) * 0.1;
    riskBand = 'Very Low Risk';
  } else if (finalScore >= 75) {
    pd = 2.0 + (90 - finalScore) * 0.2;
    riskBand = 'Low Risk';
  } else if (finalScore >= 60) {
    pd = 5.0 + (75 - finalScore) * 0.33;
    riskBand = 'Moderate Risk';
  } else if (finalScore >= 40) {
    pd = 10.0 + (60 - finalScore) * 0.5;
    riskBand = 'Elevated Risk';
  } else {
    pd = 20.0 + (40 - finalScore) * 0.5;
    riskBand = 'High Risk';
  }

  pd = Math.round(pd * 10) / 10;

  let expectedPortfolioImpact: string;
  let impactColor: string;
  if (pd < 5) {
    expectedPortfolioImpact = 'Positive Portfolio Addition';
    impactColor = '#10B981';
  } else if (pd <= 10) {
    expectedPortfolioImpact = 'Neutral Portfolio Impact';
    impactColor = '#F59E0B';
  } else {
    expectedPortfolioImpact = 'Elevated Portfolio Risk';
    impactColor = '#EF4444';
  }

  return {
    probabilityOfDefault: pd,
    pdDisplay: `${pd.toFixed(1)}%`,
    riskBand,
    portfolioSegment: getPortfolioSegment(finalScore),
    expectedPortfolioImpact,
    impactColor
  };
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: FINANCIAL INCLUSION ASSESSMENT
// ═══════════════════════════════════════════════════════════

export function assessFinancialInclusion(dti: DataTrustIndex): FinancialInclusionAssessment {
  const dataAvailable = (dti.gstCompleteness > 0 || dti.upiContinuity > 0 || dti.bankStatementCoverage > 0 || dti.epfoConsistency > 0);
  const assessmentComplete = dataAvailable && (dti.dataVerificationStatus >= 50);

  const sourcesUsed: string[] = [];
  if (dti.gstCompleteness > 0) sourcesUsed.push('GST');
  if (dti.upiContinuity > 0) sourcesUsed.push('UPI');
  if (dti.bankStatementCoverage > 0) sourcesUsed.push('Bank');
  if (dti.epfoConsistency > 0) sourcesUsed.push('EPFO');

  return {
    traditionalCreditHistory: 'Not Available',
    alternateDataAssessment: assessmentComplete ? 'Completed' : 'Pending',
    creditVisibility: assessmentComplete ? 'Enabled' : 'Disabled',
    assessmentMethod: sourcesUsed.join(' + '),
    inclusionBadge: 'New-To-Credit MSME',
    inclusionStatus: assessmentComplete ? 'Credit Visibility Enabled' : 'Assessment Pending'
  };
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: FRAUD INTELLIGENCE SENTINEL
// ═══════════════════════════════════════════════════════════

export function detectFraudAnomalies(
  bhi: BusinessHealthIndex,
  rai: RiskAdjustmentIndex,
  extractedData: Record<string, any>
): FraudIntelligence {
  const anomalies: FraudAnomaly[] = [];
  const passedChecks: string[] = [];

  const gst = extractedData.gst || {};
  const upi = extractedData.upi || {};
  const bank = extractedData.bank || {};
  const epfo = extractedData.epfo || {};

  // Check 1: GST Turnover vs UPI Inflow Discrepancy
  if (gst.turnover && upi.annualInflow) {
    const ratio = Math.abs(gst.turnover - upi.annualInflow) / gst.turnover;
    if (ratio > 0.5) {
      anomalies.push({
        type: 'Revenue Discrepancy',
        severity: 'High',
        description: `GST-declared turnover and UPI settlement inflows differ by ${(ratio * 100).toFixed(0)}%. Cross-verification recommended.`,
        dataSource: 'GST + UPI'
      });
    } else if (ratio > 0.3) {
      anomalies.push({
        type: 'Revenue Variance',
        severity: 'Medium',
        description: `${(ratio * 100).toFixed(0)}% variance between GST turnover and UPI inflows detected.`,
        dataSource: 'GST + UPI'
      });
    } else {
      passedChecks.push('GST-UPI Revenue Consistency Verified');
    }
  } else {
    passedChecks.push('GST-UPI Revenue Consistency (Insufficient Data)');
  }

  // Check 2: Sudden Headcount Spike
  if (epfo.employeeGrowth && epfo.employeeGrowth > 50) {
    anomalies.push({
      type: 'Headcount Anomaly',
      severity: 'Medium',
      description: `EPFO records show ${epfo.employeeGrowth}% YoY headcount growth — unusually high for MSME segment.`,
      dataSource: 'EPFO'
    });
  } else {
    passedChecks.push('EPFO Headcount Growth Pattern Normal');
  }

  // Check 3: Bank Balance vs Revenue Plausibility
  if (bank.averageBalance && gst.turnover) {
    const monthlyTurnover = gst.turnover / 12;
    const balanceRatio = bank.averageBalance / monthlyTurnover;
    if (balanceRatio < 0.02) {
      anomalies.push({
        type: 'Liquidity Mismatch',
        severity: 'High',
        description: 'Average bank balance is disproportionately low relative to declared monthly turnover.',
        dataSource: 'Bank + GST'
      });
    } else {
      passedChecks.push('Bank Balance-Revenue Ratio Plausible');
    }
  } else {
    passedChecks.push('Bank Balance-Revenue Check (Insufficient Data)');
  }

  // Check 4: High UPI Failure Rate
  if (upi.failedTransactions && upi.failedTransactions > 5) {
    anomalies.push({
      type: 'Transaction Failure Pattern',
      severity: upi.failedTransactions > 10 ? 'High' : 'Medium',
      description: `UPI failed transaction rate of ${upi.failedTransactions}% exceeds acceptable threshold of 5%.`,
      dataSource: 'UPI'
    });
  } else {
    passedChecks.push('UPI Transaction Failure Rate Within Limits');
  }

  // Check 5: GST Compliance Gaps
  if (gst.compliance && gst.compliance < 60) {
    anomalies.push({
      type: 'Compliance Gap',
      severity: 'Medium',
      description: `GST filing compliance at ${gst.compliance}% indicates potential missing or late filings.`,
      dataSource: 'GST'
    });
  } else {
    passedChecks.push('GST Filing Compliance Adequate');
  }

  // Check 6: Debt Stress vs Revenue
  if (rai.debtStress <= -4 && bhi.cashFlowHealth < 50) {
    anomalies.push({
      type: 'Debt Overload Risk',
      severity: 'High',
      description: 'High EMI burden combined with weak cash flow health raises repayment risk.',
      dataSource: 'Bank + RAI'
    });
  } else {
    passedChecks.push('Debt-to-Cashflow Ratio Sustainable');
  }

  // Calculate overall risk score
  let riskScore = 0;
  anomalies.forEach(a => {
    if (a.severity === 'High') riskScore += 30;
    else if (a.severity === 'Medium') riskScore += 15;
    else riskScore += 5;
  });
  riskScore = Math.min(100, riskScore);

  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  if (riskScore >= 70) riskLevel = 'Critical';
  else if (riskScore >= 40) riskLevel = 'High';
  else if (riskScore >= 15) riskLevel = 'Medium';
  else riskLevel = 'Low';

  return {
    overallRiskScore: riskScore,
    riskLevel,
    anomalies,
    passedChecks
  };
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: CASHFLOW RUNWAY PREDICTOR
// ═══════════════════════════════════════════════════════════

export function predictCashflowRunway(
  extractedData: Record<string, any>,
  recommendedCreditLimit: string
): CashflowRunway {
  const bank = extractedData.bank || {};
  const gst = extractedData.gst || {};
  const upi = extractedData.upi || {};

  // Estimate monthly burn from bank outflows
  const monthlyRevenue = (gst.turnover || 12000000) / 12;
  const avgBalance = bank.averageBalance || 500000;
  
  // Estimate burn as ~75% of revenue for operating MSMEs
  const estimatedMonthlyBurn = monthlyRevenue * 0.75;
  
  // Current reserves = average balance + receivables buffer
  const currentReserves = avgBalance + (upi.annualInflow || 0) / 24;

  // Runway = reserves / monthly burn
  const runwayMonths = estimatedMonthlyBurn > 0 ? Math.round((currentReserves / estimatedMonthlyBurn) * 10) / 10 : 12;

  // Parse credit limit for projected runway
  let creditAmount = 0;
  const limitMatch = recommendedCreditLimit.replace(/[₹,]/g, '').match(/[\d]+/);
  if (limitMatch) {
    creditAmount = parseInt(limitMatch[0], 10);
  }
  const projectedReserves = currentReserves + creditAmount;
  const projectedRunwayMonths = estimatedMonthlyBurn > 0 ? Math.round((projectedReserves / estimatedMonthlyBurn) * 10) / 10 : 18;

  // Determine burn trend
  let burnTrend: 'Increasing' | 'Stable' | 'Decreasing';
  const growth = gst.growth || 0;
  if (growth > 15) burnTrend = 'Increasing';
  else if (growth < -5) burnTrend = 'Decreasing';
  else burnTrend = 'Stable';

  // Health status
  let healthStatus: string;
  if (runwayMonths >= 6) healthStatus = 'Healthy Operating Runway';
  else if (runwayMonths >= 3) healthStatus = 'Adequate Runway — Monitor';
  else healthStatus = 'Critical — Immediate Action Required';

  return {
    currentMonthlyBurn: Math.round(estimatedMonthlyBurn),
    currentReserves: Math.round(currentReserves),
    runwayMonths: Math.min(24, runwayMonths),
    projectedRunwayMonths: Math.min(36, projectedRunwayMonths),
    burnTrend,
    healthStatus
  };
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: UNDERWRITING DECISION OBJECT
// ═══════════════════════════════════════════════════════════

export function generateUnderwritingDecision(
  results: HealthResult,
  portfolioImpact: PortfolioImpactAssessment,
  inclusion: FinancialInclusionAssessment,
  consentStatus: string,
  fraud: FraudIntelligence,
  runway: CashflowRunway
): UnderwritingDecision {
  const assessmentId = `IDBI-CCE-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  return {
    assessmentId,
    assessmentTimestamp: new Date().toISOString(),
    finalScore: Math.round(results.finalScore),
    businessHealthIndex: results.bhiScore,
    riskAdjustmentIndex: results.raiScore,
    dataTrustIndex: results.dtiScore,
    probabilityOfDefault: portfolioImpact.probabilityOfDefault,
    portfolioImpact: portfolioImpact.expectedPortfolioImpact,
    inclusionStatus: inclusion.inclusionStatus,
    consentStatus,
    recommendedProduct: results.recommendedProduct,
    recommendedLimit: results.recommendedCreditExposure,
    fraudRiskLevel: fraud.riskLevel,
    cashflowRunwayMonths: runway.runwayMonths,
    ecosystemReadiness: {
      aa: true,
      ocen: true,
      uli: true
    }
  };
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: OCEN LOAN OFFER GENERATOR
// ═══════════════════════════════════════════════════════════

export function generateLoanOffer(decision: UnderwritingDecision) {
  return {
    loanOfferId: `OCEN-${Date.now().toString(36).toUpperCase().slice(-8)}`,
    lenderCode: 'IDBI-MSME',
    timestamp: new Date().toISOString(),
    borrowerAssessment: {
      assessmentId: decision.assessmentId,
      creditScore: decision.finalScore,
      probabilityOfDefault: `${decision.probabilityOfDefault}%`,
      riskClassification: decision.fraudRiskLevel === 'Low' ? 'Standard' : 'Enhanced Due Diligence'
    },
    loanTerms: {
      product: decision.recommendedProduct,
      sanctionedAmount: decision.recommendedLimit,
      tenure: decision.finalScore >= 75 ? '36 months' : '24 months',
      interestRate: decision.finalScore >= 90 ? '9.5% p.a.' :
                    decision.finalScore >= 75 ? '11.0% p.a.' :
                    decision.finalScore >= 60 ? '13.5% p.a.' : '16.0% p.a.',
      processingFee: '1% of sanctioned amount',
      repaymentMode: 'Monthly EMI via Auto-Debit'
    },
    conditions: [
      'Subject to KYC verification',
      'Valid GST registration mandatory',
      'Business vintage minimum 12 months',
      decision.fraudRiskLevel !== 'Low' ? 'Enhanced verification required due to data anomalies' : 'Standard verification applicable'
    ].filter(Boolean),
    ecosystemMeta: {
      ocenVersion: '2.0',
      protocol: 'OCEN-MSME-WCL',
      uliCompatible: true,
      aaConsent: decision.consentStatus === 'Approved'
    }
  };
}

