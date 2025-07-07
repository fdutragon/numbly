// Mock database for Clara demo
// In production, replace with actual database connection

interface DBQuery {
  where?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export const db = {
  user: {
    findFirst: async (query: DBQuery) => {
      console.log('Mock DB query:', query);
      return null; // No user found
    },
    update: async (query: DBQuery) => {
      console.log('Mock DB update:', query);
      return { id: 1 };
    }
  }
};
