import { createServerClient } from '@0xintuition/graphql';

// Basic server client usage (most common)
export const intuitionClient = createServerClient({});

// Server client with authentication token (rarely needed)
export const createAuthenticatedClient = (token: string) => {
  return createServerClient({
    token,
  });
};

// Example usage in API routes or server components
export async function fetchStats() {
  try {
    // This would use the generated queries from @0xintuition/graphql
    // const { data } = await intuitionClient.query({ query: GET_STATS_QUERY });
    // return data;

    // For now, return a placeholder structure
    return {
      totalUsers: 0,
      totalTransactions: 0,
      totalVolume: '0',
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}

export async function fetchUserProfile(userId: string) {
  try {
    // This would use the generated queries from @0xintuition/graphql
    // const { data } = await intuitionClient.query({
    //   query: GET_USER_PROFILE_QUERY,
    //   variables: { userId }
    // });
    // return data;

    // For now, return a placeholder structure
    return {
      id: userId,
      username: 'user_' + userId,
      joinedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}