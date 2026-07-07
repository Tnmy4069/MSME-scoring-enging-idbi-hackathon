export interface BusinessHealthIndex {
  revenueQuality: number;       // 20%
  cashFlowHealth: number;       // 25%
  complianceGovernance: number; // 15%
  growthPotential: number;      // 15%
  operationalStability: number; // 15%
  businessNetworkStrength: number; // 10%
}

export interface RiskAdjustmentIndex {
  revenueVolatility: number;
  customerConcentration: number;
  supplierDependency: number;
  failedTransactionRatio: number;
  debtStress: number;
  fraudIndicators: number;
}

export interface DataTrustIndex {
  gstCompleteness: number;
  upiContinuity: number;
  bankStatementCoverage: number;
  epfoConsistency: number;
  dataVerificationStatus: number;
}

export interface DataSourceFlags {
  gst: boolean;
  upi: boolean;
  accountAggregator: boolean;
  epfo: boolean;
  itr: boolean;
}

export interface ExplainabilityComponent {
  label: string;
  score: number;
  maxPoints: number;
  raw: number;
}

export interface ImprovementRecommendation {
  label: string;
  expectedScoreImprovement: number;
  expectedCreditLimitImprovement: string;
  description: string;
}

export interface HealthResult {
  bhiScore: number;
  raiScore: number;
  dtiScore: number;
  finalScore: number;

  businessHealth: string;
  probabilityOfDefault: string;
  portfolioSegment: string;
  recommendedProduct: string;
  recommendedCreditExposure: string;
  healthColor: string;
  
  explainability: {
    bhiBreakdown: ExplainabilityComponent[];
    raiBreakdown: ExplainabilityComponent[];
    dtiBreakdown: ExplainabilityComponent[];
    improvementRecommendations: ImprovementRecommendation[];
  };
}

// ─── PHASE 2: CONSENT MANAGEMENT ───
export interface ConsentRecord {
  consentStatus: 'Approved' | 'Pending' | 'Revoked';
  consentTimestamp: string;
  consentVersion: string;
  dataSources: string[];
}

// ─── PHASE 2: FINANCIAL INCLUSION ───
export interface FinancialInclusionAssessment {
  traditionalCreditHistory: 'Available' | 'Not Available';
  alternateDataAssessment: 'Completed' | 'Pending' | 'Failed';
  creditVisibility: 'Enabled' | 'Disabled';
  assessmentMethod: string;
  inclusionBadge: string;
  inclusionStatus: string;
}

// ─── PHASE 2: PORTFOLIO IMPACT ───
export interface PortfolioImpactAssessment {
  probabilityOfDefault: number;
  pdDisplay: string;
  riskBand: string;
  portfolioSegment: string;
  expectedPortfolioImpact: string;
  impactColor: string;
}

// ─── PHASE 2: FRAUD INTELLIGENCE ───
export interface FraudAnomaly {
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  dataSource: string;
}

export interface FraudIntelligence {
  overallRiskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  anomalies: FraudAnomaly[];
  passedChecks: string[];
}

// ─── PHASE 2: CASHFLOW RUNWAY ───
export interface CashflowRunway {
  currentMonthlyBurn: number;
  currentReserves: number;
  runwayMonths: number;
  projectedRunwayMonths: number;
  burnTrend: 'Increasing' | 'Stable' | 'Decreasing';
  healthStatus: string;
}

// ─── PHASE 2: UNDERWRITING DECISION OBJECT ───
export interface UnderwritingDecision {
  assessmentId: string;
  assessmentTimestamp: string;
  finalScore: number;
  businessHealthIndex: number;
  riskAdjustmentIndex: number;
  dataTrustIndex: number;
  probabilityOfDefault: number;
  portfolioImpact: string;
  inclusionStatus: string;
  consentStatus: string;
  recommendedProduct: string;
  recommendedLimit: string;
  fraudRiskLevel: string;
  cashflowRunwayMonths: number;
  ecosystemReadiness: {
    aa: boolean;
    ocen: boolean;
    uli: boolean;
  };
}

