import 'server-only';

/**
 * Farcaster API integration for fetching social graph data
 * Supports both Hub API and Neynar API
 */

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName?: string;
  followerCount: number;
  followingCount: number;
  bio?: string;
  avatar?: string;
  verifiedAddresses?: string[];
}

export interface FarcasterGraph {
  fid: number;
  follows: number[]; // Array of FIDs this user follows
  followers: number[]; // Array of FIDs following this user
  mentions: Map<number, number>; // FID -> mention count
}

/**
 * Get Farcaster user by FID
 * Uses Neynar API or Hub API
 */
export async function getFarcasterUser(fid: number): Promise<FarcasterUser | null> {
  try {
    // Try Neynar API first (requires API key)
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    
    if (neynarApiKey) {
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/by_id?fid=${fid}`,
        {
          headers: {
            'api_key': neynarApiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const user = data.result?.user;
        
        if (user) {
          return {
            fid: user.fid,
            username: user.username,
            displayName: user.display_name,
            followerCount: user.follower_count || 0,
            followingCount: user.following_count || 0,
            bio: user.profile?.bio?.text,
            avatar: user.pfp?.url,
            verifiedAddresses: user.verified_addresses?.eth_addresses || [],
          };
        }
      }
    }
    
    // Fallback to Hub API (public, but rate limited)
    const hubResponse = await fetch(
      `https://hub.pinata.cloud/v1/userDataByFid?fid=${fid}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (hubResponse.ok) {
      // Hub API returns different format - would need parsing
      // For now, return basic structure
      return {
        fid,
        username: `user_${fid}`,
        followerCount: 0,
        followingCount: 0,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Farcaster user:', error);
    return null;
  }
}

/**
 * Get Farcaster user by verified Ethereum address
 */
export async function getFarcasterUserByAddress(
  address: string
): Promise<FarcasterUser | null> {
  try {
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    
    if (!neynarApiKey) {
      return null;
    }
    
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_verification?address=${address.toLowerCase()}`,
      {
        headers: {
          'api_key': neynarApiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const user = data.result;
      
      if (user) {
        return {
          fid: user.fid,
          username: user.username,
          displayName: user.display_name,
          followerCount: user.follower_count || 0,
          followingCount: user.following_count || 0,
          bio: user.profile?.bio?.text,
          avatar: user.pfp?.url,
          verifiedAddresses: user.verified_addresses?.eth_addresses || [],
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Farcaster user by address:', error);
    return null;
  }
}

/**
 * Get social graph data for a Farcaster user
 */
export async function getFarcasterGraph(fid: number): Promise<FarcasterGraph | null> {
  try {
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    
    if (!neynarApiKey) {
      return null;
    }
    
    // Fetch follows and followers in parallel
    const [followsResponse, followersResponse, castsResponse] = await Promise.all([
      fetch(`https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=5000`, {
        headers: {
          'api_key': neynarApiKey,
          'Content-Type': 'application/json',
        },
      }),
      fetch(`https://api.neynar.com/v2/farcaster/followers?fid=${fid}&limit=5000`, {
        headers: {
          'api_key': neynarApiKey,
          'Content-Type': 'application/json',
        },
      }),
      fetch(`https://api.neynar.com/v2/farcaster/casts?fid=${fid}&limit=100`, {
        headers: {
          'api_key': neynarApiKey,
          'Content-Type': 'application/json',
        },
      }),
    ]);
    
    if (!followsResponse.ok || !followersResponse.ok) {
      return null;
    }
    
    const [followsData, followersData, castsData] = await Promise.all([
      followsResponse.json(),
      followersResponse.json(),
      castsResponse.ok ? castsResponse.json() : { result: { casts: [] } },
    ]);
    
    // Extract FIDs
    const follows = followsData.result?.users?.map((u: { fid: number }) => u.fid) || [];
    const followers = followersData.result?.users?.map((u: { fid: number }) => u.fid) || [];
    
    // Extract mentions from casts (mentions of other FIDs)
    const mentions = new Map<number, number>();
    const casts = castsData.result?.casts || [];
    
    for (const cast of casts) {
      // Extract mentions from cast text or mentions array
      const castMentions = cast.mentions || [];
      for (const mentionedFid of castMentions) {
        mentions.set(mentionedFid, (mentions.get(mentionedFid) || 0) + 1);
      }
    }
    
    return {
      fid,
      follows,
      followers,
      mentions,
    };
  } catch (error) {
    console.error('Error fetching Farcaster graph:', error);
    return null;
  }
}

/**
 * Calculate OpenRank score (simplified version)
 * OpenRank is an EigenTrust-based metric for social reputation
 */
export async function calculateOpenRank(fid: number): Promise<{
  openRank: number;
  percentile: number;
}> {
  // This would typically require computing EigenTrust over the entire Farcaster graph
  // For now, we'll use follower/following ratio as a proxy
  const graph = await getFarcasterGraph(fid);
  
  if (!graph) {
    return { openRank: 0, percentile: 0 };
  }
  
  // Simplified OpenRank calculation
  // Real OpenRank requires global graph analysis
  const followerCount = graph.followers.length;
  const followingCount = graph.follows.length;
  
  // Engagement ratio
  const engagementRatio = followingCount > 0 ? followerCount / followingCount : 0;
  
  // Normalize to 0-1 scale (logarithmic)
  const openRank = Math.min(1.0, Math.log10(followerCount + 1) / 5);
  
  // Estimate percentile (rough approximation)
  // Top 10% typically have >10k followers on Farcaster
  let percentile = 0;
  if (followerCount > 10000) percentile = 90;
  else if (followerCount > 5000) percentile = 75;
  else if (followerCount > 1000) percentile = 50;
  else if (followerCount > 100) percentile = 25;
  else percentile = 10;
  
  return { openRank, percentile };
}
