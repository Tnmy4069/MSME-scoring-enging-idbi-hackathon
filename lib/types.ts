export interface MSMEScores {
  businessActivity: number;
  cashFlowHealth: number;
  complianceScore: number;
  transactionBehaviour: number;
  businessStability: number;
  networkStrength: number;
  growthPotential: number;
  riskIndicators: number;
}

export interface DataSourceFlags {
  gst: boolean;
  upi: boolean;
  accountAggregator: boolean;
  epfo: boolean;
  itr: boolean;
}

export interface ScoreBreakdownItem {
  key: string;
  label: string;
  maxPoints: number;
  earnedPoints: number;
  rawScore: number;
  isRisk: boolean;
}

export interface Contributor {
  label: string;
  impact: number;
  description: string;
}

export interface HealthResult {
  // Score composition
  scoreBreakdown: ScoreBreakdownItem[];
  positiveTotal: number;
  riskPenalty: number;

  // Final outputs
  score: number;
  status: string; // Legacy
  lendingRecommendation: string; // Legacy
  recommendedCreditLimit: string;
  
  // Underwriting Workbench specific additions
  decision: 'Approvable' | 'Conditional' | 'Review Required';
  riskLevel: 'Minimal' | 'Low' | 'Medium' | 'High' | 'Critical';
  lendingEligibilityStatus: 'Premium Eligible' | 'Growth Ready' | 'Standard Eligible' | 'Limited Exposure' | 'Manual Review';
  whyBankShouldLend: string[];
  creditLimitRationale: {
    scoreRange: string;
    riskCategory: string;
    lendingCategory: string;
  };
  decisionExplanation: {
    qualification: string;
    remainingRisks: string;
    recommendedExposure: string;
  };

  // Data confidence
  dataConfidenceScore: number;

  // Contributors
  positiveContributors: Contributor[];
  negativeContributors: Contributor[];

  // Explainability
  explanation: string;

  // Future-ready fields
  requestedLoanAmount?: number;
  approvableLimit?: number;
  decisionCode?: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
}
