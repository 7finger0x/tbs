import { describe, it, expect, vi } from 'vitest';
import { calculateReputation } from './calculator';
import type { ScoreInput } from '@/types/reputation';

// Mock all metric calculators
vi.mock('./metrics/baseTenure', () => ({
  calculateBaseTenure: vi.fn().mockResolvedValue({
    name: 'Base Tenure',
    score: 100,
    weight: 15,
    maxScore: 150,
  }),
}));

vi.mock('./metrics/zoraMints', () => ({
  calculateZoraMints: vi.fn().mockResolvedValue({
    name: 'Zora Mints',
    score: 80,
    weight: 12,
    maxScore: 120,
  }),
}));

vi.mock('./metrics/timeliness', () => ({
  calculateTimeliness: vi.fn().mockResolvedValue({
    name: 'Timeliness',
    score: 50,
    weight: 8,
    maxScore: 80,
  }),
}));

vi.mock('./metrics/farcaster', () => ({
  calculateFarcaster: vi.fn().mockResolvedValue({ name: 'Farcaster', score: 90, weight: 15, maxScore: 150 }),
}));

vi.mock('./metrics/builder', () => ({
  calculateBuilder: vi.fn().mockResolvedValue({ name: 'Builder', score: 150, weight: 20, maxScore: 200 }),
}));

vi.mock('./metrics/creator', () => ({
  calculateCreator: vi.fn().mockResolvedValue({ name: 'Creator', score: 60, weight: 10, maxScore: 100 }),
}));

vi.mock('./metrics/onchainSummer', () => ({
  calculateOnchainSummer: vi.fn().mockResolvedValue({ name: 'Onchain Summer', score: 40, weight: 8, maxScore: 80 }),
}));

vi.mock('./metrics/hackathon', () => ({
  calculateHackathon: vi.fn().mockResolvedValue({ name: 'Hackathon', score: 35, weight: 7, maxScore: 70 }),
}));

vi.mock('./metrics/earlyAdopter', () => ({
  calculateEarlyAdopter: vi.fn().mockResolvedValue({ name: 'Early Adopter', score: 25, weight: 5, maxScore: 50 }),
}));

describe('calculateReputation', () => {
  const mockInput: ScoreInput = {
    address: '0x1234567890123456789012345678901234567890',
    linkedWallets: [],
  };

  it('should calculate total score correctly', async () => {
    const result = await calculateReputation(mockInput);
    
    // Sum: 100+80+50+90+150+60+40+35+25 = 630
    expect(result.totalScore).toBe(630);
    expect(result.metrics).toHaveLength(9);
  });

  it('should assign RESIDENT tier for score 630', async () => {
    const result = await calculateReputation(mockInput);
    expect(result.tier).toBe('RESIDENT');
  });

  it('should return metrics array', async () => {
    const result = await calculateReputation(mockInput);
    expect(result.metrics).toBeDefined();
    expect(result.metrics[0]).toHaveProperty('name');
    expect(result.metrics[0]).toHaveProperty('score');
    expect(result.metrics[0]).toHaveProperty('weight');
    expect(result.metrics[0]).toHaveProperty('maxScore');
  });

  it('should include lastCalculated timestamp', async () => {
    const result = await calculateReputation(mockInput);
    expect(result.lastCalculated).toBeInstanceOf(Date);
  });
});
