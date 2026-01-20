import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReputationCard } from './ReputationCard';
import type { ReputationData } from '@/types/reputation';

const mockReputation: ReputationData = {
  totalScore: 750,
  tier: 'BUILDER',
  metrics: [],
  lastCalculated: new Date('2024-01-01'),
};

describe('ReputationCard', () => {
  it('should render reputation score and tier', () => {
    render(<ReputationCard reputation={mockReputation} address="0x1234567890123456789012345678901234567890" />);
    
    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('/ 1000')).toBeInTheDocument();
    expect(screen.getByText('BUILDER')).toBeInTheDocument();
  });

  it('should format address correctly', () => {
    render(<ReputationCard reputation={mockReputation} address="0x1234567890123456789012345678901234567890" />);
    
    const addressElement = screen.getByText(/0x1234/);
    expect(addressElement).toBeInTheDocument();
  });

  it('should display last calculated date', () => {
    render(<ReputationCard reputation={mockReputation} address="0x1234567890123456789012345678901234567890" />);
    
    expect(screen.getByText(/Last calculated/)).toBeInTheDocument();
  });

  it('should apply correct tier color for LEGEND', () => {
    const legendReputation: ReputationData = {
      ...mockReputation,
      tier: 'LEGEND',
    };
    render(<ReputationCard reputation={legendReputation} address="0x1234567890123456789012345678901234567890" />);
    
    const tierElement = screen.getByText('LEGEND');
    expect(tierElement.className).toContain('text-yellow-500');
  });
});
