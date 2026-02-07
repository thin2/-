/**
 * 认证相关 API（非模块版本）
 * 直接挂载到 window.authAPI
 */
window.authAPI = {
  // 用户注册
  register: async (params) => {
    try {
      const response = await request.post('/auth/register', params);
      return response;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  },

  // 用户登录
  login: async (params) => {
    try {
      const response = await request.post('/auth/login', params);
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  // 退出登录
  logout: async () => {
    try {
      const response = await request.post('/auth/logout');
      return response;
    } catch (error) {
      console.error('退出登录失败:', error);
      throw error;
    }
  }
};