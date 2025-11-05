import axios from 'axios';

// 在生产环境（Docker部署）中，使用相对路径 /api （Nginx会代理到后端）
// 在开发环境中，使用完整的后端地址
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:8000/api'
);

// 获取CSRF Token的辅助函数
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 启用跨域cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加CSRF Token
api.interceptors.request.use(
  (config) => {
    // 对于非GET请求，添加CSRF token
    if (config.method !== 'get') {
      const csrftoken = getCookie('csrftoken');
      if (csrftoken) {
        config.headers['X-CSRFToken'] = csrftoken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理认证错误（401未授权 或 403禁止访问）
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // 排除以下情况，不进行自动重定向：
      // 1. 登录和注册接口的错误（正常的认证失败）
      // 2. 获取当前用户接口的错误（用于检查登录状态）
      const isAuthEndpoint = error.config?.url?.includes('/auth/login/') || 
                            error.config?.url?.includes('/auth/register/') ||
                            error.config?.url?.includes('/auth/user/');
      
      if (!isAuthEndpoint) {
        // Session过期或未授权，清空用户状态并重定向到登录页
        console.warn('Session已过期，请重新登录');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  getCurrentUser: () => api.get('/auth/user/'),
  updateUser: (data) => api.patch('/auth/user/update/', data),
  uploadAvatar: (formData) => {
    return api.post('/auth/user/avatar/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// 图片相关API
export const imageAPI = {
  list: (params) => api.get('/images/', { params }),
  get: (id) => api.get(`/images/${id}/`),
  upload: (formData) => {
    return api.post('/images/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  batchUpload: (formData) => {
    return api.post('/images/batch_upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => api.patch(`/images/${id}/`, data),
  delete: (id) => api.delete(`/images/${id}/`),
  edit: (id, operations) => api.post(`/images/${id}/edit/`, { operations }),
  updateTags: (id, data) => api.patch(`/images/${id}/`, data),
  addTags: (id, tags, source = 'user') => api.post(`/images/${id}/add_tags/`, { tags, source }),
  removeTags: (id, tag_ids) => api.post(`/images/${id}/remove_tags/`, { tag_ids }),
  favorite: (id) => api.post(`/images/${id}/favorite/`),
  unfavorite: (id) => api.post(`/images/${id}/unfavorite/`),
  getFavorites: (params) => api.get('/images/favorites/', { params }),
};

// AI相关API
export const aiAPI = {
  analyzeImage: (formData) => {
    return api.post('/ai/analyze/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  searchImages: (query) => api.post('/ai/search/', { query }),
};

// 标签相关API
export const tagAPI = {
  list: (params) => api.get('/tags/', { params }),
  get: (id) => api.get(`/tags/${id}/`),
  create: (data) => api.post('/tags/', data),
  update: (id, data) => api.patch(`/tags/${id}/`, data),
  delete: (id) => api.delete(`/tags/${id}/`),
  popular: () => api.get('/tags/popular/'),
  allTags: () => api.get('/tags/all_tags/'),
};

// 相册相关API
export const albumAPI = {
  list: (params) => api.get('/albums/', { params }),
  get: (id) => api.get(`/albums/${id}/`),
  create: (data) => api.post('/albums/', data),
  update: (id, data) => api.patch(`/albums/${id}/`, data),
  delete: (id) => api.delete(`/albums/${id}/`),
  addImages: (id, image_ids) => api.post(`/albums/${id}/add_images/`, { image_ids }),
  removeImages: (id, image_ids) => api.post(`/albums/${id}/remove_images/`, { image_ids }),
};

// 统计相关API
export const statisticsAPI = {
  getUserStatistics: () => api.get('/statistics/'),
};

export default api;

