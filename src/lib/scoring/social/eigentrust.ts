import 'server-only';

/**
 * EigenTrust Algorithm Implementation
 * 
 * Computes trust scores for nodes in a social graph based on trust propagation.
 * Used for Sybil resistance and social graph scoring.
 * 
 * Algorithm:
 * 1. Each node i maintains trust opinions about other nodes j
 * 2. Local trust scores: c_ij = sat(i,j) - unsat(i,j)
 * 3. Normalize local trust values
 * 4. Iteratively compute global trust: t_i = Σ c_ji * t_j
 * 5. Repeat until convergence
 * 
 * Reference: Sepandar D. Kamvar, Mario T. Schlosser, Hector Garcia-Molina
 * "The EigenTrust Algorithm for Reputation Management in P2P Networks"
 */

export interface TrustRelationship {
  from: string; // Address or FID
  to: string;
  trust: number; // -1 to 1 (trust/distrust)
  weight: number; // Relationship strength/importance
}

export interface SocialGraphNode {
  id: string;
  trustScore: number;
  incomingTrust: TrustRelationship[];
  outgoingTrust: TrustRelationship[];
}

/**
 * Calculate EigenTrust scores for a set of nodes
 * 
 * @param nodes - Graph nodes with trust relationships
 * @param maxIterations - Maximum iterations (default: 100)
 * @param convergenceThreshold - Threshold for convergence (default: 0.0001)
 * @returns Map of node ID to trust score
 */
export function calculateEigenTrust(
  nodes: SocialGraphNode[],
  maxIterations = 100,
  convergenceThreshold = 0.0001
): Map<string, number> {
  // Initialize trust scores uniformly (1/n for n nodes)
  const nodeCount = nodes.length;
  const trustScores = new Map<string, number>();
  const nodeMap = new Map<string, SocialGraphNode>();
  
  // Build node map and initialize scores
  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    trustScores.set(node.id, 1.0 / nodeCount);
  });
  
  // Build normalized local trust matrix
  const localTrust = buildNormalizedTrustMatrix(nodes, nodeMap);
  
  // Iterative computation until convergence
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const newTrustScores = new Map<string, number>();
    let maxChange = 0;
    
    // Compute new trust scores: t_i = Σ c_ji * t_j
    for (const node of nodes) {
      let newScore = 0;
      
      // Sum of incoming trust weighted by current trust scores
      for (const incoming of node.incomingTrust) {
        const sourceTrust = trustScores.get(incoming.from) || 0;
        const localTrustValue = localTrust.get(`${incoming.from}-${node.id}`) || 0;
        newScore += localTrustValue * sourceTrust;
      }
      
      newTrustScores.set(node.id, newScore);
      
      // Track maximum change for convergence check
      const oldScore = trustScores.get(node.id) || 0;
      const change = Math.abs(newScore - oldScore);
      maxChange = Math.max(maxChange, change);
    }
    
    // Update trust scores
    trustScores.clear();
    newTrustScores.forEach((score, id) => {
      trustScores.set(id, score);
    });
    
    // Check convergence
    if (maxChange < convergenceThreshold) {
      break;
    }
  }
  
  // Normalize final scores to sum to 1
  normalizeScores(trustScores);
  
  return trustScores;
}

/**
 * Build normalized local trust matrix
 * Each row sums to 1 (probability distribution)
 */
function buildNormalizedTrustMatrix(
  nodes: SocialGraphNode[],
  nodeMap: Map<string, SocialGraphNode>
): Map<string, number> {
  const matrix = new Map<string, number>();
  
  for (const node of nodes) {
    // Calculate outgoing trust sum for normalization
    let totalOutgoing = 0;
    const outgoingTrust = new Map<string, number>();
    
    for (const trust of node.outgoingTrust) {
      const trustValue = trust.trust * trust.weight;
      outgoingTrust.set(trust.to, trustValue);
      totalOutgoing += Math.max(0, trustValue); // Only count positive trust
    }
    
    // Normalize outgoing trust (only positive values)
    if (totalOutgoing > 0) {
      for (const [targetId, trustValue] of outgoingTrust.entries()) {
        const normalized = Math.max(0, trustValue) / totalOutgoing;
        matrix.set(`${node.id}-${targetId}`, normalized);
      }
    }
  }
  
  return matrix;
}

/**
 * Normalize trust scores so they sum to 1
 */
function normalizeScores(scores: Map<string, number>): void {
  let sum = 0;
  scores.forEach((score) => {
    sum += score;
  });
  
  if (sum > 0) {
    scores.forEach((score, id) => {
      scores.set(id, score / sum);
    });
  }
}

/**
 * Calculate social graph score from EigenTrust results
 * 
 * @param trustScores - Map of node ID to EigenTrust score
 * @param targetId - Target node ID to score
 * @param percentile - Percentile threshold (0-1)
 * @returns Score from 0-100
 */
export function calculateSocialGraphScore(
  trustScores: Map<string, number>,
  targetId: string,
  percentile = 0.1 // Top 10% threshold
): number {
  const targetScore = trustScores.get(targetId) || 0;
  
  // Convert to array and sort
  const scores = Array.from(trustScores.values()).sort((a, b) => b - a);
  
  if (scores.length === 0) {
    return 0;
  }
  
  // Find percentile threshold
  const thresholdIndex = Math.floor(scores.length * percentile);
  const thresholdScore = scores[thresholdIndex] || 0;
  
  // Calculate score based on position relative to threshold
  if (targetScore >= thresholdScore) {
    // In top percentile - score based on relative position
    const topScores = scores.slice(0, thresholdIndex + 1);
    const maxScore = topScores[0] || 0;
    const minScore = thresholdScore;
    
    if (maxScore === minScore) {
      return 100; // Perfect score
    }
    
    // Linear interpolation: 100 points if at max, 80 points if at threshold
    const normalized = (targetScore - minScore) / (maxScore - minScore);
    return Math.round(80 + normalized * 20); // 80-100 range
  } else {
    // Below threshold - score based on percentile position
    const normalized = targetScore / thresholdScore;
    return Math.round(normalized * 80); // 0-80 range
  }
}

/**
 * Build social graph from Farcaster data
 * Relationships are based on:
 * - Follows (positive trust)
 * - Mutual follows (higher trust)
 * - Mentions/replies (engagement trust)
 */
export function buildFarcasterSocialGraph(
  fid: number,
  follows: number[],
  followers: number[],
  mentions: Map<number, number> // FID -> mention count
): SocialGraphNode {
  const nodeId = `farcaster:${fid}`;
  const incomingTrust: TrustRelationship[] = [];
  const outgoingTrust: TrustRelationship[] = [];
  
  // Outgoing trust: who this user follows
  const mutualFollows = new Set<number>();
  for (const followId of follows) {
    if (followers.includes(followId)) {
      mutualFollows.add(followId);
    }
    
    // Base trust: 0.5 for follows, 0.8 for mutual follows
    const baseTrust = mutualFollows.has(followId) ? 0.8 : 0.5;
    const mentionBonus = (mentions.get(followId) || 0) * 0.1; // Up to 0.2 bonus
    
    outgoingTrust.push({
      from: nodeId,
      to: `farcaster:${followId}`,
      trust: Math.min(1.0, baseTrust + mentionBonus),
      weight: 1.0,
    });
  }
  
  // Incoming trust: who follows this user
  for (const followerId of followers) {
    const isMutual = follows.includes(followerId);
    const baseTrust = isMutual ? 0.8 : 0.3;
    
    incomingTrust.push({
      from: `farcaster:${followerId}`,
      to: nodeId,
      trust: baseTrust,
      weight: 1.0,
    });
  }
  
  return {
    id: nodeId,
    trustScore: 0, // Will be calculated by EigenTrust
    incomingTrust,
    outgoingTrust,
  };
}
