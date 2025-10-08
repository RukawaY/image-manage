import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
    if (error.response && error.response.status === 401) {
      // 未授权，重定向到登录页
      window.location.href = '/login';
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
  update: (id, data) => api.patch(`/images/${id}/`, data),
  delete: (id) => api.delete(`/images/${id}/`),
  edit: (id, operations) => api.post(`/images/${id}/edit/`, { operations }),
  addTags: (id, tags) => api.post(`/images/${id}/add_tags/`, { tags }),
  removeTags: (id, tag_ids) => api.post(`/images/${id}/remove_tags/`, { tag_ids }),
  favorite: (id) => api.post(`/images/${id}/favorite/`),
  unfavorite: (id) => api.post(`/images/${id}/unfavorite/`),
  getFavorites: (params) => api.get('/images/favorites/', { params }),
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

export default api;

