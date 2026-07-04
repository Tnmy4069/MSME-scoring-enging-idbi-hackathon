import { MSMEScores, HealthResult, DataSourceFlags, ScoreBreakdownItem, Contributor } from "./types";

// ─── Dimension configuration ─────────────────────────────────────────────────
export const DIMENSION_CONFIG = [
  { key: 'businessActivity',     label: 'Business Activity',     maxPoints: 15 },
  { key: 'cashFlowHealth',       label: 'Cash Flow Health',      maxPoints: 20 },
  { key: 'complianceScore',      label: 'Compliance Score',      maxPoints: 15 },
  { key: 'transactionBehaviour', label: 'Transaction Behaviour', maxPoints: 10 },
  { key: 'businessStability',    label: 'Business Stability',    maxPoints: 15 },
  { key: 'networkStrength',      label: 'Network Strength',      maxPoints: 10 },
  { key: 'growthPotential',      label: 'Growth Potential',      maxPoints: 15 },
] as const;

export const RISK_MAX_PENALTY = 20;

export const DIMENSIONS = [
  ...DIMENSION_CONFIG,
  { key: 'riskIndicators', label: 'Risk Indicators', maxPoints: 0 },
] as const;

export const DATA_SOURCES = [
  { key: 'gst',               label: 'GST Data' },
  { key: 'upi',               label: 'UPI Analytics' },
  { key: 'accountAggregator', label: 'Account Aggregator' },
  { key: 'epfo',              label: 'EPFO Records' },
  { key: 'itr',               label: 'ITR Filing' },
] as const;

export const CREDIT_LIMIT_CONFIG = [
  { minScore: 90, limit: '₹25,00,000' },
  { minScore: 80, limit: '₹15,00,000' },
  { minScore: 70, limit: '₹10,00,000' },
  { minScore: 60, limit: '₹5,00,000' },
  { minScore: 50, limit: '₹2,00,000' },
  { minScore: 0,  limit: 'Manual Review Required' },
];

// ─── Individual contribution calculators ─────────────────────────────────────
export function calculateBusinessActivityContribution(raw: number): number {
  return Number((raw * 15 / 100).toFixed(2));
}

export function calculateCashFlowContribution(raw: number): number {
  return Number((raw * 20 / 100).toFixed(2));
}

export function calculateComplianceContribution(raw: number): number {
  return Number((raw * 15 / 100).toFixed(2));
}

export function calculateTransactionContribution(raw: number): number {
  return Number((raw * 10 / 100).toFixed(2));
}

export function calculateStabilityContribution(raw: number): number {
  return Number((raw * 15 / 100).toFixed(2));
}

export function calculateNetworkContribution(raw: number): number {
  return Number((raw * 10 / 100).toFixed(2));
}

export function calculateGrowthContribution(raw: number): number {
  return Number((raw * 15 / 100).toFixed(2));
}

export function calculateRiskPenalty(riskIndicators: number): number {
  return Number((riskIndicators * RISK_MAX_PENALTY / 100).toFixed(2));
}

// ─── Credit Confidence Score ─────────────────────────────────────────────────
export function calculateCreditConfidenceScore(scores: MSMEScores): {
  breakdown: ScoreBreakdownItem[];
  positiveTotal: number;
  riskPenalty: number;
  score: number;
} {
  const breakdown: ScoreBreakdownItem[] = [];

  const contributions = [
    { key: 'businessActivity',     label: 'Business Activity',     maxPts: 15, earned: calculateBusinessActivityContribution(scores.businessActivity),  raw: scores.businessActivity },
    { key: 'cashFlowHealth',       label: 'Cash Flow Health',      maxPts: 20, earned: calculateCashFlowContribution(scores.cashFlowHealth),            raw: scores.cashFlowHealth },
    { key: 'complianceScore',      label: 'Compliance Score',      maxPts: 15, earned: calculateComplianceContribution(scores.complianceScore),          raw: scores.complianceScore },
    { key: 'transactionBehaviour', label: 'Transaction Behaviour', maxPts: 10, earned: calculateTransactionContribution(scores.transactionBehaviour),    raw: scores.transactionBehaviour },
    { key: 'businessStability',    label: 'Business Stability',    maxPts: 15, earned: calculateStabilityContribution(scores.businessStability),          raw: scores.businessStability },
    { key: 'networkStrength',      label: 'Network Strength',      maxPts: 10, earned: calculateNetworkContribution(scores.networkStrength),              raw: scores.networkStrength },
    { key: 'growthPotential',      label: 'Growth Potential',      maxPts: 15, earned: calculateGrowthContribution(scores.growthPotential),              raw: scores.growthPotential },
  ];

  let positiveTotal = 0;
  for (const c of contributions) {
    positiveTotal += c.earned;
    breakdown.push({
      key: c.key,
      label: c.label,
      maxPoints: c.maxPts,
      earnedPoints: c.earned,
      rawScore: c.raw,
      isRisk: false,
    });
  }
  positiveTotal = Number(positiveTotal.toFixed(2));

  const riskPenalty = calculateRiskPenalty(scores.riskIndicators);
  breakdown.push({
    key: 'riskPenalty',
    label: 'Risk Penalty',
    maxPoints: RISK_MAX_PENALTY,
    earnedPoints: -riskPenalty,
    rawScore: scores.riskIndicators,
    isRisk: true,
  });

  const score = Math.min(100, Math.max(0, Number((positiveTotal - riskPenalty).toFixed(2))));

  return { breakdown, positiveTotal, riskPenalty, score };
}

// ─── Status & Decisioning ──────────────────────────────────────────────────
export function getLendingEligibilityStatus(score: number): 'Premium Eligible' | 'Growth Ready' | 'Standard Eligible' | 'Limited Exposure' | 'Manual Review' {
  if (score >= 90) return 'Premium Eligible';
  if (score >= 75) return 'Growth Ready';
  if (score >= 60) return 'Standard Eligible';
  if (score >= 40) return 'Limited Exposure';
  return 'Manual Review';
}

export function getUnderwritingDecision(score: number): 'Approvable' | 'Conditional' | 'Review Required' {
  if (score >= 75) return 'Approvable';
  if (score >= 40) return 'Conditional';
  return 'Review Required';
}

export function getRiskLevel(score: number): 'Minimal' | 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score >= 90) return 'Minimal';
  if (score >= 75) return 'Low';
  if (score >= 60) return 'Medium';
  if (score >= 40) return 'High';
  return 'Critical';
}

export function getLendingRecommendation(score: number): string {
  if (score >= 90) return 'Low Risk Lending';
  if (score >= 75) return 'Growth Lending';
  if (score >= 60) return 'Standard Lending';
  if (score >= 40) return 'Limited Exposure';
  return 'Manual Review Required';
}

export function getRecommendedCreditLimit(score: number): string {
  for (const cfg of CREDIT_LIMIT_CONFIG) {
    if (score >= cfg.minScore) return cfg.limit;
  }
  return 'Manual Review Required';
}

export function calculateDataConfidence(flags: DataSourceFlags): number {
  const total = Object.keys(flags).length;
  const available = Object.values(flags).filter(Boolean).length;
  return Math.round((available / total) * 100);
}

// ─── Positive / Negative Contributors ─────────────────────────────────────────
export function getPositiveContributors(breakdown: ScoreBreakdownItem[]): Contributor[] {
  return breakdown
    .filter(b => !b.isRisk)
    .sort((a, b) => b.earnedPoints - a.earnedPoints)
    .slice(0, 3)
    .map(b => {
      let desc = '';
      if (b.earnedPoints >= b.maxPoints * 0.8)      desc = `Excellent ${b.label.toLowerCase()} performance`;
      else if (b.earnedPoints >= b.maxPoints * 0.6)  desc = `Strong ${b.label.toLowerCase()} indicators`;
      else                                           desc = `Moderate ${b.label.toLowerCase()} contribution`;
      return { label: b.label, impact: b.earnedPoints, description: desc };
    });
}

export function getNegativeContributors(breakdown: ScoreBreakdownItem[]): Contributor[] {
  const negatives: Contributor[] = [];
  const risk = breakdown.find(b => b.isRisk);
  if (risk && risk.earnedPoints < 0) {
    negatives.push({
      label: 'Risk Indicators',
      impact: risk.earnedPoints,
      description: `Elevated risk signals (${risk.rawScore}/100)`,
    });
  }
  const weakPositives = breakdown
    .filter(b => !b.isRisk)
    .sort((a, b) => a.earnedPoints - b.earnedPoints)
    .slice(0, 2)
    .map(b => ({
      label: b.label,
      impact: b.earnedPoints,
      description: `Weak ${b.label.toLowerCase()} (only +${b.earnedPoints.toFixed(1)} of max ${b.maxPoints})`,
    }));
  return [...negatives, ...weakPositives].slice(0, 3);
}

// ─── Underwriting Workbench Explanations ──────────────────────────────────────
export function getWhyBankShouldLend(breakdown: ScoreBreakdownItem[]): string[] {
  return breakdown
    .filter(b => !b.isRisk && b.earnedPoints >= b.maxPoints * 0.7)
    .sort((a, b) => b.earnedPoints - a.earnedPoints)
    .slice(0, 3)
    .map(b => {
      if (b.key === 'cashFlowHealth') return "Strong operational cash flow ensures highly robust repayment capacity.";
      if (b.key === 'complianceScore') return "Flawless compliance record reduces regulatory and legal lending friction.";
      if (b.key === 'businessStability') return "Established business history supports long-term operational stability.";
      return `Solid contribution from ${b.label.toLowerCase()} (+${b.earnedPoints.toFixed(1)} pts) strengthens risk posture.`;
    });
}

export function generateExplanation(
  scores: MSMEScores,
  breakdown: ScoreBreakdownItem[],
  score: number,
  lendingRecommendation: string,
): string {
  return `The business scores ${score.toFixed(2)} on the Credit Confidence index. Cash flow stands at ${scores.cashFlowHealth}/100 and compliance score at ${scores.complianceScore}/100, which are major anchors of creditworthiness. Risk is monitored at ${scores.riskIndicators}/100. recommended for ${lendingRecommendation}.`;
}

// ─── Aggregate processor ──────────────────────────────────────────────────────
export function processHealthAssessment(scores: MSMEScores, dataFlags: DataSourceFlags): HealthResult {
  const cce = calculateCreditConfidenceScore(scores);
  const status = getLendingEligibilityStatus(cce.score);
  const decision = getUnderwritingDecision(cce.score);
  const riskLevel = getRiskLevel(cce.score);
  const recommendedCreditLimit = getRecommendedCreditLimit(cce.score);
  const dataConfidenceScore = calculateDataConfidence(dataFlags);
  const positiveContributors = getPositiveContributors(cce.breakdown);
  const negativeContributors = getNegativeContributors(cce.breakdown);
  const whyBankShouldLend = getWhyBankShouldLend(cce.breakdown);

  // Score limit rationale
  let scoreRange = '0 - 39';
  if (cce.score >= 90) scoreRange = '90 - 100';
  else if (cce.score >= 80) scoreRange = '80 - 89';
  else if (cce.score >= 70) scoreRange = '70 - 79';
  else if (cce.score >= 60) scoreRange = '60 - 69';
  else if (cce.score >= 50) scoreRange = '50 - 59';

  const creditLimitRationale = {
    scoreRange,
    riskCategory: `${riskLevel} Risk`,
    lendingCategory: getLendingRecommendation(cce.score),
  };

  // Top positive factors list
  const topPos = positiveContributors.map(c => c.label.toLowerCase()).slice(0, 2).join(' and ');
  const worstNeg = negativeContributors.map(c => c.label.toLowerCase()).slice(0, 1).join('');

  const decisionExplanation = {
    qualification: `The MSME qualifies for underwriting based on strong performance in ${topPos || 'operational metrics'} which present highly favorable lending attributes.`,
    remainingRisks: worstNeg 
      ? `Lenders should note that risks are concentrated in ${worstNeg}, which contributed negative weight to the score.`
      : "No outstanding risk vectors were highlighted during the primary credit evaluation.",
    recommendedExposure: `We recommend capping lending exposure at ${recommendedCreditLimit} under standard monitoring covenants, consistent with the ${status} profile.`
  };

  const explanation = generateExplanation(scores, cce.breakdown, cce.score, creditLimitRationale.lendingCategory);

  return {
    scoreBreakdown: cce.breakdown,
    positiveTotal: cce.positiveTotal,
    riskPenalty: cce.riskPenalty,
    score: cce.score,
    status,
    lendingRecommendation: creditLimitRationale.lendingCategory,
    recommendedCreditLimit,
    decision,
    riskLevel,
    lendingEligibilityStatus: status,
    whyBankShouldLend,
    creditLimitRationale,
    decisionExplanation,
    dataConfidenceScore,
    positiveContributors,
    negativeContributors,
    explanation,
  };
}
