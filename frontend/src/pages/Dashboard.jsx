import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { format } from 'date-fns'

function ProgressRing({ pct }) {
  const r = 20, circ = 2 * Math.PI * r
  return (
    <svg width="52" height="52" className="-rotate-90">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#2e2e4a" strokeWidth="4" />
      <circle cx="26" cy="26" r={r} fill="none" stroke="#c026d3" strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
        strokeLinecap="round" />
    </svg>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/students/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-dark-600 border-t-primary-500 rounded-full animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{user?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-400 mt-1">Student ID: <span className="text-primary-400 font-mono">{user?.student_id}</span></p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Enrolled Courses',     value: data?.stats?.total_enrolled    || 0, icon: '📚', color: 'text-blue-400' },
            { label: 'Completed Courses',    value: data?.stats?.completed_courses  || 0, icon: '🏆', color: 'text-green-400' },
            { label: 'Upcoming Classes',     value: data?.upcoming_classes?.length  || 0, icon: '📡', color: 'text-yellow-400' },
            { label: 'Notifications',        value: data?.unread_notifications      || 0, icon: '🔔', color: 'text-primary-400' },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className={`text-2xl mb-1`}>{s.icon}</div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-sm mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">My Courses</h2>
              <Link to="/courses" className="text-primary-400 text-sm hover:text-primary-300">Browse more →</Link>
            </div>
            {data?.enrolled_courses?.length === 0
              ? <div className="card p-8 text-center text-gray-400">
                  <div className="text-4xl mb-3">🎵</div>
                  <p className="font-medium text-white mb-1">No courses yet</p>
                  <p className="text-sm mb-4">Start your musical journey today!</p>
                  <Link to="/courses" className="btn-primary text-sm">Browse Courses</Link>
                </div>
              : <div className="space-y-3">
                  {data?.enrolled_courses?.map(c => (
                    <div key={c.id} className="card p-4 flex items-center gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-dark-600 rounded-lg overflow-hidden">
                        {c.thumbnail_url
                          ? <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm truncate">{c.title}</h3>
                        <p className="text-gray-400 text-xs mt-0.5">{c.category}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="progress-bar flex-1">
                            <div className="progress-bar-fill" style={{ width: `${c.progress_pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">{c.progress_pct}%</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <ProgressRing pct={c.progress_pct} />
                      </div>
                      <Link to={`/courses/${c.slug}`} className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
                        Continue
                      </Link>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Upcoming live classes */}
          <div>
            <h2 className="text-white font-bold text-lg mb-4">Upcoming Classes</h2>
            {data?.upcoming_classes?.length === 0
              ? <div className="card p-6 text-center text-gray-400">
                  <div className="text-3xl mb-2">📡</div>
                  <p className="text-sm">No upcoming live classes</p>
                  <Link to="/live-classes" className="text-primary-400 text-sm hover:text-primary-300 mt-2 block">View schedule →</Link>
                </div>
              : <div className="space-y-3">
                  {data?.upcoming_classes?.map(cls => (
                    <div key={cls.id} className="card p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-900/40 border border-primary-700/50 flex items-center justify-center">
                          📡
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{cls.title}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{cls.instructor}</p>
                          <p className="text-primary-400 text-xs mt-1">
                            {format(new Date(cls.scheduled_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      {cls.meeting_url && (
                        <a href={cls.meeting_url} target="_blank" rel="noreferrer"
                          className="mt-3 btn-primary text-xs py-1.5 w-full text-center block">
                          Join {cls.platform}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
