import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => JSON.parse(localStorage.getItem('btm_user') || 'null'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('btm_token')
    if (token) {
      api.get('/auth/me')
        .then(r => { setUser(r.data.data); localStorage.setItem('btm_user', JSON.stringify(r.data.data)) })
        .catch(() => { localStorage.removeItem('btm_token'); localStorage.removeItem('btm_user'); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (identifier, password) => {
    const r = await api.post('/auth/login', { identifier, password })
    const { token, user: u } = r.data.data
    localStorage.setItem('btm_token', token)
    localStorage.setItem('btm_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const register = async (payload) => {
    const r = await api.post('/auth/register', payload)
    const { token, user: u } = r.data.data
    localStorage.setItem('btm_token', token)
    localStorage.setItem('btm_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('btm_token')
    localStorage.removeItem('btm_user')
    setUser(null)
  }

  const isAdmin   = user?.role === 'admin'
  const isStudent = user?.role === 'student'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isStudent }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
