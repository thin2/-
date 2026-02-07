/**
 * 个人资料相关 API
 */
window.profileAPI = {
  // 获取个人资料
  getProfile: async () => {
    try {
      const response = await request.get('/profile');
      return response;
    } catch (error) {
      console.error('获取个人资料失败:', error);
      throw error;
    }
  },

  // 更新个人资料
  updateProfile: async (data = {}) => {
    try {
      const response = await request.put('/profile', data);
      return response;
    } catch (error) {
      console.error('更新个人资料失败:', error);
      throw error;
    }
  },

  // 修改密码
  changePassword: async (data = {}) => {
    try {
      const response = await request.put('/password', data);
      return response;
    } catch (error) {
      console.error('修改密码失败:', error);
      throw error;
    }
  },

  // 删除头像
  deleteAvatar: async () => {
    try {
      const response = await request.delete('/avatar');
      return response;
    } catch (error) {
      console.error('删除头像失败:', error);
      throw error;
    }
  },
};
