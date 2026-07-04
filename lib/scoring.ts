import { MSMEScores, HealthResult, DataSourceFlags, ScoreBreakdownItem, Contributor } from "./types";

// ─── Dimension configuration ─────────────────────────────────────────────────
// Every point is visible. No hidden weights. No multipliers.
//
//   Max positive score  = 15 + 20 + 15 + 10 + 15 + 10 + 15 = 100
//   Max risk penalty    = 20
//   Score range         = [0, 100]  (clamped)

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

// Also export flat list for radar chart / other legacy uses
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
// Formula: rawScore × maxPoints / 100

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

// ─── Risk penalty ────────────────────────────────────────────────────────────
// Higher Risk Indicators = MORE penalty (more risk = lower score)
// riskPenalty = riskIndicators × 20 / 100
// Examples:
//   riskIndicators = 100 → penalty = 20  (maximum deduction)
//   riskIndicators = 50  → penalty = 10
//   riskIndicators = 0   → penalty = 0   (no deduction)

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

// ─── Status & recommendations ────────────────────────────────────────────────

export function getHealthStatus(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Weak';
  return 'High Risk';
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

// ─── Data confidence ─────────────────────────────────────────────────────────

export function calculateDataConfidence(flags: DataSourceFlags): number {
  const total = Object.keys(flags).length;
  const available = Object.values(flags).filter(Boolean).length;
  return Math.round((available / total) * 100);
}

// ─── Contributors ─────────────────────────────────────────────────────────────

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

  // Risk penalty is always first if it exists
  const risk = breakdown.find(b => b.isRisk);
  if (risk && risk.earnedPoints < 0) {
    negatives.push({
      label: 'Risk Indicators',
      impact: risk.earnedPoints,
      description: `Elevated risk signals (${risk.rawScore}/100)`,
    });
  }

  // Weakest positive contributors
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

// ─── Explainability ───────────────────────────────────────────────────────────

export function generateExplanation(
  scores: MSMEScores,
  breakdown: ScoreBreakdownItem[],
  score: number,
  lendingRecommendation: string,
): string {
  const parts: string[] = [];

  // Top 2 positive contributions
  const top2 = breakdown
    .filter(b => !b.isRisk)
    .sort((a, b) => b.earnedPoints - a.earnedPoints)
    .slice(0, 2);

  if (top2.length >= 2) {
    parts.push(
      `The business demonstrates strong ${top2[0].label.toLowerCase()} (+${top2[0].earnedPoints.toFixed(1)}) and ${top2[1].label.toLowerCase()} (+${top2[1].earnedPoints.toFixed(1)}) — the two largest contributors to creditworthiness.`
    );
  }

  // Mid-range contributors
  const midRange = breakdown
    .filter(b => !b.isRisk && b.earnedPoints >= b.maxPoints * 0.5 && b.earnedPoints < b.maxPoints * 0.8);
  if (midRange.length > 0) {
    const names = midRange.map(b => b.label.toLowerCase()).join(', ');
    parts.push(`${midRange.length > 1 ? 'Areas' : 'The area'} of ${names} ${midRange.length > 1 ? 'show' : 'shows'} acceptable performance and positively influence the overall assessment.`);
  }

  // Weak areas
  const weak = breakdown
    .filter(b => !b.isRisk && b.earnedPoints < b.maxPoints * 0.5);
  if (weak.length > 0) {
    const names = weak.map(b => b.label.toLowerCase()).join(' and ');
    parts.push(`However, ${names} ${weak.length > 1 ? 'are' : 'is'} below expectations and ${weak.length > 1 ? 'limit' : 'limits'} the score potential.`);
  }

  // Risk penalty narrative
  const riskItem = breakdown.find(b => b.isRisk);
  if (riskItem) {
    const penalty = Math.abs(riskItem.earnedPoints);
    if (penalty >= 12)      parts.push(`Elevated risk indicators (${scores.riskIndicators}/100) apply a significant penalty of -${penalty.toFixed(1)} points, materially impacting the Credit Confidence Score.`);
    else if (penalty >= 6)  parts.push(`Moderate risk indicators (${scores.riskIndicators}/100) reduce the score by -${penalty.toFixed(1)} points.`);
    else if (penalty > 0)   parts.push(`Risk indicators are relatively low (${scores.riskIndicators}/100), applying only a -${penalty.toFixed(1)} point deduction.`);
    else                    parts.push(`No risk indicators detected — full score retained with zero penalty.`);
  }

  parts.push(`Based on a final score of ${score.toFixed(2)}, this MSME is recommended for ${lendingRecommendation}.`);

  return parts.join(' ');
}

// ─── Aggregate processor ──────────────────────────────────────────────────────

export function processHealthAssessment(scores: MSMEScores, dataFlags: DataSourceFlags): HealthResult {
  const cce = calculateCreditConfidenceScore(scores);
  const status = getHealthStatus(cce.score);
  const lendingRecommendation = getLendingRecommendation(cce.score);
  const recommendedCreditLimit = getRecommendedCreditLimit(cce.score);
  const dataConfidenceScore = calculateDataConfidence(dataFlags);
  const positiveContributors = getPositiveContributors(cce.breakdown);
  const negativeContributors = getNegativeContributors(cce.breakdown);
  const explanation = generateExplanation(scores, cce.breakdown, cce.score, lendingRecommendation);

  return {
    scoreBreakdown: cce.breakdown,
    positiveTotal: cce.positiveTotal,
    riskPenalty: cce.riskPenalty,
    score: cce.score,
    status,
    lendingRecommendation,
    recommendedCreditLimit,
    dataConfidenceScore,
    positiveContributors,
    negativeContributors,
    explanation,
  };
}
