import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/admin',              label: 'Dashboard',    icon: '📊', end: true },
  { to: '/admin/students',     label: 'Students',     icon: '👩‍🎓' },
  { to: '/admin/courses',      label: 'Courses',      icon: '📚' },
  { to: '/admin/live-classes', label: 'Live Classes', icon: '📡' },
  { to: '/admin/payments',     label: 'Payments',     icon: '💳' },
  { to: '/admin/analytics',    label: 'Analytics',    icon: '📈' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sideOpen, setSideOpen] = useState(true)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <aside className={`${sideOpen ? 'w-56' : 'w-16'} sidebar-transition bg-dark-800 border-r border-dark-600 flex flex-col flex-shrink-0`}>
        {/* Logo */}
        <div className="p-4 border-b border-dark-600 flex items-center justify-between">
          {sideOpen && <span className="gradient-text font-bold text-sm">Admin Panel</span>}
          <button onClick={() => setSideOpen(!sideOpen)} className="text-gray-400 hover:text-white ml-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sideOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              }
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                 ${isActive ? 'bg-primary-900/40 text-primary-300 border border-primary-800/50' : 'text-gray-400 hover:text-white hover:bg-dark-700'}`
              }>
              <span className="text-base flex-shrink-0">{n.icon}</span>
              {sideOpen && <span className="font-medium">{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-dark-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.full_name?.charAt(0)}
            </div>
            {sideOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.full_name}</p>
                <p className="text-gray-400 text-xs truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {sideOpen && (
            <button onClick={handleLogout} className="w-full mt-2 text-xs text-red-400 hover:text-red-300 text-left px-1">
              Sign Out →
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
