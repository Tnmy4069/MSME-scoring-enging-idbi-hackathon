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
  status: string;
  lendingRecommendation: string;
  recommendedCreditLimit: string;

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
  decision?: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
}
