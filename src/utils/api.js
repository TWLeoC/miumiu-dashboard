import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'https://zhuang-ji-api.zeabur.app',
  timeout: 15000,
})

api.interceptors.request.use(
  (config) => {
    const storeId = import.meta.env.VITE_STORE_ID
    if (storeId) config.headers['X-Store-ID'] = storeId
    const raw = localStorage.getItem('miumiu-dashboard-auth')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        const token = parsed?.state?.token
        if (token) config.headers['Authorization'] = `Bearer ${token}`
      } catch {
        // ignore parse errors
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('miumiu-dashboard-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
