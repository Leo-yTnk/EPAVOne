export const insightsService = {
  async getOverview(_filters) {
    // Replace with a repository/API adapter during the pilot. UI never calls Supabase directly.
    return { salesTotal:0, orders:0, averageTicket:0, conversion:0 };
  }
};
