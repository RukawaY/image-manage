import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 启用跨域cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
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
};

// 标签相关API
export const tagAPI = {
  list: (params) => api.get('/tags/', { params }),
  get: (id) => api.get(`/tags/${id}/`),
  create: (data) => api.post('/tags/', data),
  update: (id, data) => api.patch(`/tags/${id}/`, data),
  delete: (id) => api.delete(`/tags/${id}/`),
  popular: () => api.get('/tags/popular/'),
};

export default api;

