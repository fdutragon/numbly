// Mock database for Clara demo
// In production, replace with actual database connection
export const db = {
  user: {
    findFirst: async (query: any) => {
      console.log('Mock DB query:', query);
      return null; // No user found
    },
    update: async (query: any) => {
      console.log('Mock DB update:', query);
      return { id: 1 };
    }
  }
};
