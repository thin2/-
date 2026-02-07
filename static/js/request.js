/**
 * axios请求封装
 * 统一处理请求拦截、响应拦截、错误处理等
 * 非模块版本，可直接通过 script 标签引入
 */

// 确保 axios 已经加载
if (typeof axios === 'undefined') {
  console.error('axios 未加载，请先引入 axios.min.js');
}

// 创建axios实例
const request = axios.create({
  baseURL: '/api', // API基础路径
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    // 如果token存在，则在请求头中添加Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // 处理请求错误
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 获取响应数据
    const res = response.data;
    
    // 根据业务状态码处理
    if (res.code === 0) {
      // 请求成功
      return res;
    } else {
      // 请求失败，显示错误信息
      console.error('请求失败:', res.message);
      // 可以使用Element UI的Message组件显示错误信息
      if (window.$message) {
        window.$message.error(res.message);
      }
      return Promise.reject(res);
    }
  },
  error => {
    // 处理响应错误
    console.error('响应错误:', error);
    
    let errorMessage = '网络请求失败，请稍后重试';
    
    if (error.response) {
      // HTTP状态码处理
      switch (error.response.status) {
        case 400:
          errorMessage = '请求参数错误';
          break;
        case 401:
          errorMessage = '未授权，请重新登录';
          // 清除本地存储的token和用户信息
          localStorage.removeItem('token');
          localStorage.removeItem('user_info');
          // 跳转到登录页
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
          break;
        case 403:
          errorMessage = '拒绝访问';
          break;
        case 404:
          errorMessage = '请求资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = `请求失败 (${error.response.status})`;
      }
      
      // 如果有错误信息，使用服务器返回的错误信息
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      errorMessage = '网络连接超时，请检查网络设置';
    }
    
    // 显示错误信息
    if (window.$message) {
      window.$message.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// 将 request 挂载到全局对象
if (typeof window !== 'undefined') {
  window.request = request;
}
