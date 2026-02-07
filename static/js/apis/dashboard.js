/**
 * 仪表盘 API
 */
window.dashboardAPI = {
  stats: async () => {
    try {
      const response = await request.get('/dashboard/stats');
      return response;
    } catch (error) {
      console.error('获取仪表盘统计失败:', error);
      throw error;
    }
  },

  subjectDistribution: async () => {
    try {
      const response = await request.get('/dashboard/subject-distribution');
      return response;
    } catch (error) {
      console.error('获取科目分布失败:', error);
      throw error;
    }
  },

  reviewTrend: async () => {
    try {
      const response = await request.get('/dashboard/review-trend');
      return response;
    } catch (error) {
      console.error('获取复习趋势失败:', error);
      throw error;
    }
  },

  masteryStatus: async () => {
    try {
      const response = await request.get('/dashboard/mastery-status');
      return response;
    } catch (error) {
      console.error('获取掌握状态分布失败:', error);
      throw error;
    }
  },
};

