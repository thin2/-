/**
 * 复习中心 API
 */
window.reviewAPI = {
  stats: async () => {
    try {
      const response = await request.get('/review/stats');
      return response;
    } catch (error) {
      console.error('获取复习统计失败:', error);
      throw error;
    }
  },

  list: async (params = {}) => {
    try {
      const response = await request.get('/review/list', { params });
      return response;
    } catch (error) {
      console.error('获取复习列表失败:', error);
      throw error;
    }
  },

  submit: async (id, data) => {
    try {
      const response = await request.post(`/review/${id}`, data);
      return response;
    } catch (error) {
      console.error('提交复习结果失败:', error);
      throw error;
    }
  },
};

