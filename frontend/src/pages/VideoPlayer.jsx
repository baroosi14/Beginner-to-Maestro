import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactPlayer from 'react-player'
import Navbar from '../components/common/Navbar'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function VideoPlayer() {
  const { slug, lessonId } = useParams()
  const [lesson, setLesson]       = useState(null)
  const [course, setCourse]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [played, setPlayed]       = useState(0)
  const [completed, setCompleted] = useState(false)
  const playerRef = useRef(null)
  const progressSavedRef = useRef(false)

  useEffect(() => {
    Promise.all([
      api.get(`/lessons/${lessonId}`),
      api.get(`/courses/${slug}`),
    ]).then(([lr, cr]) => {
      setLesson(lr.data.data)
      setCourse(cr.data.data)
    }).catch(() => toast.error('Could not load lesson'))
    .finally(() => setLoading(false))
  }, [lessonId, slug])

  const saveProgress = async (watchTime, isCompleted = false) => {
    if (progressSavedRef.current && !isCompleted) return
    try {
      await api.post(`/lessons/${lessonId}/progress`, { watch_time: Math.floor(watchTime), completed: isCompleted })
      if (isCompleted) { setCompleted(true); toast.success('Lesson completed! 🎉') }
      progressSavedRef.current = true
    } catch {}
  }

  const handleProgress = ({ playedSeconds }) => {
    setPlayed(playedSeconds)
    if (playedSeconds > 0 && playedSeconds % 30 < 1) saveProgress(playedSeconds)
  }

  const handleEnded = () => saveProgress(played, true)

  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><div className="w-10 h-10 border-4 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>

  const allLessons = course?.modules?.flatMap(m => m.lessons) || []
  const currentIdx = allLessons.findIndex(l => String(l.id) === String(lessonId))
  const prevLesson = allLessons[currentIdx - 1]
  const nextLesson = allLessons[currentIdx + 1]

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
          <span>/</span>
          <Link to={`/courses/${slug}`} className="hover:text-white">{course?.title}</Link>
          <span>/</span>
          <span className="text-white">{lesson?.title}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Player */}
          <div className="lg:col-span-2 space-y-4">
            {lesson?.video_url
              ? <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <ReactPlayer
                    ref={playerRef}
                    url={lesson.video_url}
                    width="100%" height="100%"
                    controls playing
                    onProgress={handleProgress}
                    onEnded={handleEnded}
                    config={{ file: { attributes: { controlsList: 'nodownload' } } }}
                  />
                </div>
              : <div className="aspect-video bg-dark-700 rounded-xl flex items-center justify-center">
                  <p className="text-gray-400">No video available for this lesson</p>
                </div>
            }

            <div className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-white font-bold text-xl mb-1">{lesson?.title}</h1>
                  <p className="text-gray-400 text-sm">{lesson?.module_title} · {lesson?.course_title}</p>
                </div>
                {completed && (
                  <div className="flex-shrink-0 bg-green-900/40 border border-green-700 rounded-full px-3 py-1 text-green-400 text-sm font-medium">
                    ✓ Completed
                  </div>
                )}
              </div>
              {lesson?.description && (
                <p className="text-gray-300 mt-4 text-sm leading-relaxed">{lesson.description}</p>
              )}
              {lesson?.resource_url && (
                <a href={`/api/resources/${lessonId}`}
                  className="inline-flex items-center gap-2 btn-secondary text-sm mt-4">
                  📄 Download Resources
                </a>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {prevLesson && (
                <Link to={`/learn/${slug}/${prevLesson.id}`} className="btn-secondary text-sm flex-1 text-center">
                  ← {prevLesson.title}
                </Link>
              )}
              {nextLesson && (
                <Link to={`/learn/${slug}/${nextLesson.id}`} className="btn-primary text-sm flex-1 text-center">
                  {nextLesson.title} →
                </Link>
              )}
            </div>
          </div>

          {/* Lesson list */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-dark-600">
              <h2 className="text-white font-semibold">Course Content</h2>
              <p className="text-gray-400 text-xs mt-0.5">{allLessons.length} lessons</p>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
              {course?.modules?.map(mod => (
                <div key={mod.id}>
                  <div className="px-4 py-2 bg-dark-600/50 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    {mod.title}
                  </div>
                  {mod.lessons?.map(l => (
                    <Link key={l.id} to={`/learn/${slug}/${l.id}`}
                      className={`flex items-center gap-3 px-4 py-3 text-sm border-b border-dark-600/50 hover:bg-dark-600 transition-colors ${String(l.id) === String(lessonId) ? 'bg-primary-900/30 border-l-2 border-l-primary-500' : ''}`}>
                      <span className="text-gray-400 flex-shrink-0">
                        {l.content_type === 'video' ? '▶' : '📄'}
                      </span>
                      <span className={String(l.id) === String(lessonId) ? 'text-white font-medium' : 'text-gray-300'}>
                        {l.title}
                      </span>
                      {l.video_duration && (
                        <span className="ml-auto text-gray-500 text-xs flex-shrink-0">
                          {Math.floor(l.video_duration/60)}:{String(l.video_duration%60).padStart(2,'0')}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
