import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    // 统一错误格式
    const errorData = error.response?.data
    if (errorData && !errorData.success) {
      // 后端返回的错误格式：{success: false, error: message}
      const errorObj = new Error(errorData.error || '请求失败')
      errorObj.name = 'APIError'
      return Promise.reject(errorObj)
    }
    
    return Promise.reject(new Error(error.message || '网络错误'))
  }
)

export default api