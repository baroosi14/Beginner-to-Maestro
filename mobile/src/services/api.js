import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = 'https://api.beginnertomaestro.com/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('btm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('btm_token')
      await SecureStore.deleteItemAsync('btm_user')
    }
    return Promise.reject(err)
  }
)

export default api
