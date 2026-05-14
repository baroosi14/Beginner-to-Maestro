import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const MusicNote = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </svg>
)

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-dark-800/80 backdrop-blur-md border-b border-dark-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary-400 font-bold text-xl">
            <MusicNote />
            <span className="gradient-text">Beginner to Maestro</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/courses" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Courses</Link>
            {user && <Link to="/live-classes" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Live Classes</Link>}
            {user && <Link to="/dashboard" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">My Learning</Link>}
            {isAdmin && <Link to="/admin" className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">Admin</Link>}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center font-semibold text-white text-xs">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:block">{user.full_name?.split(' ')[0]}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-48 card shadow-xl z-50 animate-fade-in">
                    <div className="p-3 border-b border-dark-600">
                      <p className="text-white text-sm font-medium">{user.full_name}</p>
                      <p className="text-gray-400 text-xs">{user.student_id}</p>
                    </div>
                    <div className="p-1">
                      <Link to="/profile" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-600 rounded-lg">Profile</Link>
                      {isAdmin && <Link to="/admin" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-primary-400 hover:text-primary-300 hover:bg-dark-600 rounded-lg">Admin Panel</Link>}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-600 rounded-lg">Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-800 border-t border-dark-600 px-4 py-3 space-y-2 animate-fade-in">
          <Link to="/courses"      className="block py-2 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Courses</Link>
          {user && <Link to="/live-classes" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Live Classes</Link>}
          {user && <Link to="/dashboard"    className="block py-2 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>My Learning</Link>}
          {user && <Link to="/profile"      className="block py-2 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Profile</Link>}
          {isAdmin && <Link to="/admin"     className="block py-2 text-primary-400"              onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
          {!user
            ? <div className="flex gap-3 pt-2">
                <Link to="/login"    className="btn-secondary text-sm py-2 px-4" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4"  onClick={() => setMenuOpen(false)}>Get Started</Link>
              </div>
            : <button onClick={handleLogout} className="block py-2 text-red-400 hover:text-red-300">Sign Out</button>
          }
        </div>
      )}
    </nav>
  )
}
