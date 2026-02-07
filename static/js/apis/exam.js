/**
 * 出卷自测 API
 */
window.examAPI = {
  generate: async (data) => {
    try {
      const response = await request.post('/exam/generate', data);
      return response;
    } catch (error) {
      console.error('生成试卷失败:', error);
      throw error;
    }
  },

  submit: async (data) => {
    try {
      const response = await request.post('/exam/submit', data);
      return response;
    } catch (error) {
      console.error('提交答卷失败:', error);
      throw error;
    }
  },

  saveWrongQuestion: async (questionId, errorReason) => {
    try {
      const response = await request.post('/exam/save-wrong-question', {
        question_id: questionId,
        error_reason: errorReason || '自测答错'
      });
      return response;
    } catch (error) {
      console.error('保存错题失败:', error);
      throw error;
    }
  },
};

