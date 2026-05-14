import { createContext, useContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('btm_token')
        if (token) {
          const r = await api.get('/auth/me')
          setUser(r.data.data)
        }
      } catch {
        await SecureStore.deleteItemAsync('btm_token')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = async (identifier, password) => {
    const r = await api.post('/auth/login', { identifier, password })
    const { token, user: u } = r.data.data
    await SecureStore.setItemAsync('btm_token', token)
    setUser(u)
    return u
  }

  const register = async (payload) => {
    const r = await api.post('/auth/register', payload)
    const { token, user: u } = r.data.data
    await SecureStore.setItemAsync('btm_token', token)
    setUser(u)
    return u
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    await SecureStore.deleteItemAsync('btm_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
