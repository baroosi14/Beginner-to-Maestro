import { useEffect, useState } from 'react'
import Navbar from '../components/common/Navbar'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function LiveClasses() {
  const [classes, setClasses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [registering, setReg]   = useState(null)

  useEffect(() => {
    api.get('/live-classes?upcoming=1').then(r => setClasses(r.data.data || [])).finally(() => setLoading(false))
  }, [])

  const register = async (id) => {
    setReg(id)
    try {
      await api.post(`/live-classes/${id}/register`)
      toast.success('Registered for live class!')
      setClasses(cs => cs.map(c => c.id === id ? { ...c, is_registered: true, registered_count: c.registered_count + 1 } : c))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setReg(null)
    }
  }

  const PLATFORM_ICON = { zoom: '📹', google_meet: '📲', teams: '💼', custom: '🔗' }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Live Classes</h1>
        <p className="text-gray-400 mb-8">Join live sessions with expert instructors</p>

        {loading
          ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>
          : classes.length === 0
            ? <div className="text-center py-20 card p-12">
                <div className="text-5xl mb-4">📡</div>
                <p className="text-white font-medium text-lg">No upcoming live classes</p>
                <p className="text-gray-400 text-sm mt-1">Check back soon for new sessions</p>
              </div>
            : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => (
                  <div key={cls.id} className="card p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-900/40 border border-primary-700/50 flex items-center justify-center text-xl flex-shrink-0">
                        {PLATFORM_ICON[cls.platform] || '📡'}
                      </div>
                      <span className={`badge text-xs ${
                        cls.status === 'live' ? 'bg-red-900/50 text-red-400' :
                        cls.status === 'scheduled' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {cls.status === 'live' ? '🔴 LIVE' : cls.status}
                      </span>
                    </div>

                    <h3 className="text-white font-semibold mb-1">{cls.title}</h3>
                    {cls.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{cls.description}</p>}

                    <div className="space-y-1.5 mb-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <span>👨‍🏫</span>
                        <span>{cls.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🗓</span>
                        <span>{format(new Date(cls.scheduled_at), 'MMMM d, yyyy · h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⏱</span>
                        <span>{cls.duration_mins} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <span>{cls.registered_count} registered
                          {cls.max_attendees && ` / ${cls.max_attendees} max`}
                        </span>
                      </div>
                      {cls.course_title && (
                        <div className="flex items-center gap-2">
                          <span>📚</span>
                          <span>{cls.course_title}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto">
                      {cls.is_registered
                        ? cls.meeting_url
                          ? <a href={cls.meeting_url} target="_blank" rel="noreferrer" className="btn-primary w-full text-center block text-sm py-2.5">
                              Join {cls.platform?.replace('_',' ')} →
                            </a>
                          : <div className="btn-secondary w-full text-center text-sm py-2.5 opacity-60 cursor-default">
                              ✓ Registered – Link coming soon
                            </div>
                        : <button
                            onClick={() => register(cls.id)}
                            disabled={registering === cls.id || cls.status === 'completed'}
                            className="btn-outline w-full text-sm py-2.5"
                          >
                            {registering === cls.id ? 'Registering...' : 'Register for Class'}
                          </button>
                      }
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>
    </div>
  )
}
