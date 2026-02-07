/**
 * 通用文件上传 API（非模块版本）
 * 支持多种文件类型上传：question（错题图片）、avatar（头像）、general（通用文件）
 * 直接挂载到 window.uploadAPI
 */
window.uploadAPI = {
  // 通用文件上传
  uploadFile: async (file, type = 'general') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      // 使用fetch上传文件（因为axios对FormData的支持需要特殊配置）
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
      console.error('文件上传失败:', error);
      throw error;
    }
  },

  // 上传错题图片（便捷方法）
  uploadQuestionImage: async (file) => {
    return window.uploadAPI.uploadFile(file, 'question');
  },

  // 上传头像（便捷方法）
  uploadAvatar: async (file) => {
    return window.uploadAPI.uploadFile(file, 'avatar');
  },

  // 上传通用文件（便捷方法）
  uploadGeneralFile: async (file) => {
    return window.uploadAPI.uploadFile(file, 'general');
  }
};

