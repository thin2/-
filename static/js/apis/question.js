/**
 * 错题相关 API（非模块版本）
 * 直接挂载到 window.questionAPI
 */
window.questionAPI = {
  // 获取错题列表
  listQuestions: async (params = {}) => {
    try {
      const response = await request.get('/questions', { params });
      return response;
    } catch (error) {
      console.error('获取错题列表失败:', error);
      throw error;
    }
  },

  // 获取错题详情
  getQuestionDetail: async (id) => {
    try {
      const response = await request.get(`/questions/${id}`);
      return response;
    } catch (error) {
      console.error('获取错题详情失败:', error);
      throw error;
    }
  },

  // 创建错题
  createQuestion: async (data) => {
    try {
      const response = await request.post('/questions', data);
      return response;
    } catch (error) {
      console.error('创建错题失败:', error);
      throw error;
    }
  },

  // 更新错题
  updateQuestion: async (id, data) => {
    try {
      const response = await request.put(`/questions/${id}`, data);
      return response;
    } catch (error) {
      console.error('更新错题失败:', error);
      throw error;
    }
  },

  // 删除错题
  deleteQuestion: async (id) => {
    try {
      const response = await request.delete(`/questions/${id}`);
      return response;
    } catch (error) {
      console.error('删除错题失败:', error);
      throw error;
    }
  },

  // 上传错题图片
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'question');
      
      const response = await fetch('/api/upload/file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });
      
      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.message || '上传失败');
      }
      return result;
    } catch (error) {
      console.error('上传图片失败:', error);
      throw error;
    }
  }
};
