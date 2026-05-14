import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import PaymentModal from '../components/payment/PaymentModal'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const LEVEL_COLOR = { beginner:'text-green-400', intermediate:'text-yellow-400', advanced:'text-red-400', all:'text-blue-400' }

export default function CourseDetail() {
  const { slug }   = useParams()
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [course, setCourse]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [openMod, setOpenMod]     = useState({})
  const [showPayment, setShowPayment] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    api.get(`/courses/${slug}`)
      .then(r => setCourse(r.data.data))
      .catch(() => navigate('/courses'))
      .finally(() => setLoading(false))
  }, [slug])

  const toggleMod = (id) => setOpenMod(s => ({ ...s, [id]: !s[id] }))

  const enrollFree = async () => {
    if (!user) { navigate('/login'); return }
    setEnrolling(true)
    try {
      await api.post(`/courses/${slug}/enroll`, {})
      toast.success('Enrolled successfully!')
      setCourse(c => ({ ...c, is_enrolled: true }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><div className="w-10 h-10 border-4 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>
  if (!course) return null

  const totalLessons   = course.modules?.flatMap(m => m.lessons).length || 0
  const freePreviewCnt = course.modules?.flatMap(m => m.lessons).filter(l => l.is_free_preview).length || 0

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      {showPayment && <PaymentModal course={course} onClose={() => setShowPayment(false)} />}

      {/* Hero */}
      <div className="bg-dark-800 border-b border-dark-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`badge bg-dark-600 ${LEVEL_COLOR[course.level]}`}>
                  {course.level?.charAt(0).toUpperCase() + course.level?.slice(1)}
                </span>
                {course.category && <span className="badge bg-dark-600 text-gray-400">{course.category}</span>}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{course.title}</h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">{course.description}</p>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                {course.instructor && <span>👨‍🏫 {course.instructor}</span>}
                <span>📚 {totalLessons} lessons</span>
                {course.duration_hours && <span>⏱ {course.duration_hours}h total</span>}
                <span>👥 {course.enrollment_count} students</span>
                {freePreviewCnt > 0 && <span>🎁 {freePreviewCnt} free previews</span>}
              </div>
            </div>

            {/* Purchase card */}
            <div className="card p-6 sticky top-20">
              {course.thumbnail_url && (
                <img src={course.thumbnail_url} alt={course.title} className="w-full aspect-video object-cover rounded-lg mb-4" />
              )}
              <div className="text-3xl font-extrabold text-white mb-4">
                {course.is_free || parseFloat(course.price) === 0
                  ? <span className="text-green-400">Free</span>
                  : <span>${parseFloat(course.price).toFixed(2)} <span className="text-gray-400 text-base font-normal">{course.currency}</span></span>
                }
              </div>
              {course.is_enrolled
                ? <Link to={`/courses/${slug}`} className="btn-primary w-full text-center block py-3">
                    Continue Learning →
                  </Link>
                : course.is_free || parseFloat(course.price) === 0
                  ? <button onClick={enrollFree} disabled={enrolling} className="btn-primary w-full py-3">
                      {enrolling ? 'Enrolling...' : 'Enroll for Free'}
                    </button>
                  : <button onClick={() => user ? setShowPayment(true) : navigate('/login')} className="btn-primary w-full py-3">
                      {user ? 'Enroll Now' : 'Sign in to Enroll'}
                    </button>
              }
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">✅ Full lifetime access</li>
                <li className="flex items-center gap-2">✅ HD video lessons</li>
                <li className="flex items-center gap-2">✅ Downloadable resources</li>
                <li className="flex items-center gap-2">✅ Live class access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:max-w-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Course Curriculum</h2>
          <div className="space-y-3">
            {course.modules?.map(mod => (
              <div key={mod.id} className="card">
                <button onClick={() => toggleMod(mod.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-dark-600 transition-colors rounded-xl">
                  <div>
                    <span className="text-white font-semibold">{mod.title}</span>
                    <span className="ml-3 text-gray-400 text-sm">{mod.lessons?.length} lessons</span>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${openMod[mod.id] ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openMod[mod.id] && (
                  <div className="border-t border-dark-600">
                    {mod.lessons?.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between px-4 py-3 hover:bg-dark-600/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">
                            {lesson.content_type === 'video' ? '▶️' : lesson.content_type === 'pdf' ? '📄' : '🎵'}
                          </span>
                          <span className="text-gray-300 text-sm">
                            {course.is_enrolled && lesson.video_url
                              ? <Link to={`/learn/${slug}/${lesson.id}`} className="hover:text-white">{lesson.title}</Link>
                              : lesson.title
                            }
                          </span>
                          {lesson.is_free_preview && <span className="badge bg-green-900/50 text-green-400 text-xs">Preview</span>}
                        </div>
                        {lesson.video_duration && (
                          <span className="text-gray-500 text-xs">
                            {Math.floor(lesson.video_duration / 60)}:{String(lesson.video_duration % 60).padStart(2,'0')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
