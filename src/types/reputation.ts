export interface MetricScore {
  readonly name: string;
  readonly score: number;
  readonly weight: number;
  readonly maxScore: number;
}

export type ReputationTier = 'TOURIST' | 'RESIDENT' | 'BUILDER' | 'BASED' | 'LEGEND';

export interface ReputationData {
  readonly totalScore: number;
  readonly tier: ReputationTier;
  readonly metrics: MetricScore[];
  readonly lastCalculated: Date;
}

export interface ScoreInput {
  readonly address: string;
  readonly linkedWallets: readonly string[];
}

export interface MetricCalculator {
  (input: ScoreInput): Promise<MetricScore>;
}
